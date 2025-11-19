// Name: Secret Chat
// Description: Create or join private, ephemeral chat rooms using a 6-character code.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'secretChatWidget';
    const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
    const APP_PREFIX = 'landr-chat-v1-'; // Prefix to namespace the peer IDs

    // --- Dependencies ---
    function loadPeerJS(callback) {
        if (window.Peer) {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = PEERJS_CDN;
        script.onload = callback;
        document.head.appendChild(script);
    }

    // --- Widget UI Construction ---
    function createWidget() {
        if (document.getElementById(WIDGET_ID)) return;

        const contentGrid = document.querySelector('.content-grid');
        if (!contentGrid) return;

        const widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'widget';
        widget.style.cssText = `
            grid-row: span 2;
            display: flex;
            flex-direction: column;
            min-height: 400px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        widget.innerHTML = `
            <h2 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                <span>💬</span> ChatterBox
            </h2>
            
            <!-- Login View -->
            <div id="chatLoginView" style="display: flex; flex-direction: column; gap: 15px; flex: 1; justify-content: center;">
                <div style="text-align: center; opacity: 0.8; font-size: 0.9rem; margin-bottom: 10px;">
                    Enter a matching code to join the same room.
                </div>
                <input type="text" id="chatNick" placeholder="Your Nickname" maxlength="12" style="
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: white;
                    font-family: inherit;
                    outline: none;
                ">
                <input type="text" id="chatRoomCode" placeholder="Code (e.g. X92B4A)" maxlength="6" style="
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: white;
                    font-family: monospace;
                    text-transform: uppercase;
                    outline: none;
                    letter-spacing: 2px;
                    text-align: center;
                    font-size: 1.2rem;
                ">
                <button id="btnJoinChat" class="add-btn" style="margin-top: 10px;">Join Room</button>
                <div id="chatStatus" style="text-align: center; font-size: 0.85rem; min-height: 20px; color: #fbbf24;"></div>
            </div>

            <!-- Chat Interface (Hidden initially) -->
            <div id="chatInterface" style="display: none; flex-direction: column; flex: 1; height: 100%;">
                <div style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 10px;
                ">
                    <div style="font-size: 0.9rem; opacity: 0.8;">
                        Room: <span id="displayRoomCode" style="font-family: monospace; font-weight: bold;"></span>
                    </div>
                    <button id="btnLeaveChat" style="
                        background: rgba(239, 68, 68, 0.2);
                        color: #fca5a5;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.8rem;
                    ">Leave</button>
                </div>

                <div id="chatMessages" style="
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-right: 5px;
                    margin-bottom: 15px;
                    max-height: 300px;
                "></div>

                <form id="chatForm" style="display: flex; gap: 10px;">
                    <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" style="
                        flex: 1;
                        padding: 10px;
                        border-radius: 10px;
                        border: none;
                        background: rgba(255,255,255,0.1);
                        color: white;
                        font-family: inherit;
                    ">
                    <button type="submit" style="
                        background: var(--accent-color);
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 10px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    ">➤</button>
                </form>
            </div>
        `;

        contentGrid.prepend(widget);

        // Styles for messages
        const style = document.createElement('style');
        style.textContent = `
            .chat-msg { padding: 8px 12px; border-radius: 10px; font-size: 0.9rem; line-height: 1.4; max-width: 85%; word-wrap: break-word; }
            .chat-msg.system { align-self: center; background: rgba(255,255,255,0.05); font-style: italic; font-size: 0.8rem; opacity: 0.7; }
            .chat-msg.mine { align-self: flex-end; background: var(--accent-color); color: white; border-bottom-right-radius: 2px; }
            .chat-msg.theirs { align-self: flex-start; background: rgba(255,255,255,0.1); border-bottom-left-radius: 2px; }
            .chat-nick { font-size: 0.75rem; opacity: 0.6; margin-bottom: 2px; display: block; }
        `;
        document.head.appendChild(style);

        bindEvents(widget);
    }

    // --- Logic ---
    let peer = null;
    let connections = []; // For Host: list of connected clients
    let hostConnection = null; // For Client: connection to host
    let myNickname = '';
    let amIHost = false;

    function bindEvents(widget) {
        const btnJoin = widget.querySelector('#btnJoinChat');
        const inpCode = widget.querySelector('#chatRoomCode');
        const inpNick = widget.querySelector('#chatNick');
        const statusEl = widget.querySelector('#chatStatus');

        btnJoin.onclick = () => {
            const code = inpCode.value.trim().toUpperCase();
            const nick = inpNick.value.trim();

            if (code.length !== 6) {
                statusEl.textContent = 'Code must be 6 characters.';
                return;
            }
            if (!nick) {
                statusEl.textContent = 'Nickname is required.';
                return;
            }

            myNickname = nick;
            statusEl.textContent = 'Connecting...';
            btnJoin.disabled = true;

            loadPeerJS(() => {
                joinRoom(code, widget);
            });
        };

        widget.querySelector('#chatForm').onsubmit = (e) => {
            e.preventDefault();
            sendMessage(widget);
        };

        widget.querySelector('#btnLeaveChat').onclick = () => {
            disconnectAll(widget);
        };
    }

    // --- Core Chat Logic ---

    function joinRoom(code, widget) {
        const roomId = APP_PREFIX + code;
        
        // Strategy: Try to become the Host (claim the Room ID).
        // If ID is taken, PeerJS throws 'unavailable-id', then we join as client.
        
        try {
            peer = new Peer(roomId, {
                debug: 1
            });
        } catch (e) {
            console.error(e);
        }

        // 1. Successfully claimed the Room ID -> I am HOST
        peer.on('open', (id) => {
            amIHost = true;
            showChatInterface(widget, code);
            addSystemMessage(widget, `Room created. You are the Host.`);
            addSystemMessage(widget, `Waiting for others to join code: ${code}...`);

            // Host logic: Listen for connections
            peer.on('connection', (conn) => {
                setupConnection(conn, widget);
            });
        });

        // 2. ID Taken -> Someone else is Host -> Join as CLIENT
        peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                // Create a generic peer (random ID)
                peer = new Peer();
                
                peer.on('open', () => {
                    amIHost = false;
                    // Connect to the Host
                    const conn = peer.connect(roomId, {
                        metadata: { nickname: myNickname }
                    });
                    
                    conn.on('open', () => {
                        showChatInterface(widget, code);
                        hostConnection = conn;
                        setupConnection(conn, widget);
                        addSystemMessage(widget, `Connected to room ${code}.`);
                    });

                    conn.on('error', (e) => {
                        document.querySelector('#chatStatus').textContent = 'Could not find host. Retrying...';
                    });
                });
            } else {
                document.querySelector('#chatStatus').textContent = 'Connection Error: ' + err.type;
                document.querySelector('#btnJoinChat').disabled = false;
            }
        });
    }

    function setupConnection(conn, widget) {
        // Keep track of connections
        if (amIHost) {
            connections.push(conn);
            
            // Listen for data from this client
            conn.on('data', (data) => {
                handleData(data, widget, conn); // Pass conn to identify sender
            });

            conn.on('close', () => {
                const nick = conn.metadata?.nickname || 'Unknown';
                addSystemMessage(widget, `${nick} left.`);
                connections = connections.filter(c => c !== conn);
            });
            
            conn.on('open', () => {
                 addSystemMessage(widget, `${conn.metadata?.nickname || 'Someone'} joined.`);
            });
        } else {
            // I am Client, listening to Host
            conn.on('data', (data) => {
                handleData(data, widget);
            });
            
            conn.on('close', () => {
                addSystemMessage(widget, 'Host disconnected. Room closed.');
                setTimeout(() => disconnectAll(widget), 3000);
            });
        }
    }

    function handleData(data, widget, senderConn = null) {
        if (data.type === 'chat') {
            // Display the message
            addChatMessage(widget, data.sender, data.text, false);

            // If I am Host, I must RELAY this message to everyone else
            if (amIHost) {
                connections.forEach(conn => {
                    // Don't send it back to the person who sent it
                    if (conn !== senderConn) {
                        conn.send(data);
                    }
                });
            }
        }
    }

    function sendMessage(widget) {
        const input = widget.querySelector('#chatInput');
        const text = input.value.trim();
        if (!text) return;

        const msgData = {
            type: 'chat',
            sender: myNickname,
            text: text,
            timestamp: Date.now()
        };

        // Display my own message
        addChatMessage(widget, 'You', text, true);

        if (amIHost) {
            // Broadcast to all clients
            connections.forEach(conn => conn.send(msgData));
        } else if (hostConnection) {
            // Send to Host (who will relay)
            hostConnection.send(msgData);
        }

        input.value = '';
    }

    // --- UI Helpers ---

    function showChatInterface(widget, code) {
        widget.querySelector('#chatLoginView').style.display = 'none';
        widget.querySelector('#chatInterface').style.display = 'flex';
        widget.querySelector('#displayRoomCode').textContent = code;
    }

    function addSystemMessage(widget, text) {
        const container = widget.querySelector('#chatMessages');
        const div = document.createElement('div');
        div.className = 'chat-msg system';
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function addChatMessage(widget, sender, text, isMe) {
        const container = widget.querySelector('#chatMessages');
        const div = document.createElement('div');
        div.className = `chat-msg ${isMe ? 'mine' : 'theirs'}`;
        
        div.innerHTML = `
            <span class="chat-nick">${isMe ? '' : sender}</span>
            ${escapeHtml(text)}
        `;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function disconnectAll(widget) {
        if (peer) {
            peer.destroy();
            peer = null;
        }
        connections = [];
        hostConnection = null;
        amIHost = false;

        // Reset UI
        widget.querySelector('#chatLoginView').style.display = 'flex';
        widget.querySelector('#chatInterface').style.display = 'none';
        widget.querySelector('#chatMessages').innerHTML = '';
        widget.querySelector('#btnJoinChat').disabled = false;
        widget.querySelector('#chatStatus').textContent = '';
        widget.querySelector('#chatRoomCode').value = '';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Init ---
    createWidget();

})();
