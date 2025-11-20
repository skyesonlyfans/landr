/* ================================
   📹 VideoChatter Addon v1.0
   FaceTime-style P2P Video Calling
   For ChatterBox v6 Addon System
   ================================ */

(function () {
    if (!window.ChatterBoxAPI) {
        console.error("VideoChatter Addon: ChatterBoxAPI not found.");
        return;
    }

    console.log("VideoChatter Addon Loaded ✔");

    /* -----------------------------------------------------
       Addon State
    ----------------------------------------------------- */
    let localStream = null;
    let remoteStream = null;
    let activeVideoCall = null;
    let isOpen = false;

    /* -----------------------------------------------------
       Helper: Create/Inject UI Components
    ----------------------------------------------------- */
    function injectVideoButton() {
        const controls = document.querySelector(".chat-controls");
        if (!controls) return setTimeout(injectVideoButton, 300);

        if (document.getElementById("videoAddonBtn")) return;

        const btn = document.createElement("button");
        btn.className = "btn-icon";
        btn.id = "videoAddonBtn";
        btn.title = "Video Chat";
        btn.innerHTML = "📹";
        btn.style.transition = "0.2s";

        btn.onclick = toggleVideoUI;

        controls.insertBefore(btn, controls.firstChild);
    }

    /* -----------------------------------------------------
       FaceTime-style UI Window
    ----------------------------------------------------- */
    function createVideoWindow() {
        if (document.getElementById("videoChatterWindow")) return;

        const wrap = document.createElement("div");
        wrap.id = "videoChatterWindow";
        wrap.style.position = "fixed";
        wrap.style.bottom = "90px";
        wrap.style.right = "20px";
        wrap.style.width = "260px";
        wrap.style.height = "360px";
        wrap.style.background = "rgba(20,20,20,0.75)";
        wrap.style.border = "1px solid rgba(255,255,255,0.1)";
        wrap.style.backdropFilter = "blur(20px)";
        wrap.style.borderRadius = "20px";
        wrap.style.overflow = "hidden";
        wrap.style.zIndex = "99999";
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";
        wrap.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";
        wrap.style.animation = "fadeIn 0.25s ease";

        wrap.innerHTML = `
            <style>
                #videoChatterWindow video {
                    width: 100%;
                    height: auto;
                    background: black;
                }
                #videoChatterWindow .controls {
                    padding: 10px;
                    display: flex;
                    justify-content: space-around;
                    background: rgba(0,0,0,0.35);
                    backdrop-filter: blur(10px);
                }
                #videoChatterWindow button {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    font-size: 1.3rem;
                    cursor: pointer;
                }
                #videoChatterWindow .end {
                    background: #ff3b30;
                    color: white;
                }
                #videoChatterWindow .call {
                    background: #34c759;
                    color: white;
                }
            </style>

            <video id="vcRemote" autoplay playsinline></video>
            <video id="vcLocal" autoplay muted playsinline style="
                position:absolute;
                width:90px; 
                height:120px;
                bottom:70px;
                right:10px;
                border-radius:12px;
                box-shadow:0 0 15px rgba(0,0,0,0.4);
            "></video>

            <div class="controls">
                <button class="call" id="vcStartBtn">📞</button>
                <button class="end" id="vcEndBtn">✕</button>
            </div>
        `;

        document.body.appendChild(wrap);

        // Listeners
        document.getElementById("vcStartBtn").onclick = startVideoCall;
        document.getElementById("vcEndBtn").onclick = endVideoCall;
    }

    /* -----------------------------------------------------
       Toggle UI
    ----------------------------------------------------- */
    function toggleVideoUI() {
        isOpen = !isOpen;

        if (isOpen) {
            createVideoWindow();
            document.getElementById("videoAddonBtn").style.background = "var(--accent)";
            document.getElementById("videoAddonBtn").style.color = "white";
        } else {
            closeVideoWindow();
        }
    }

    function closeVideoWindow() {
        const el = document.getElementById("videoChatterWindow");
        if (el) el.remove();

        document.getElementById("videoAddonBtn").style.background = "";
        document.getElementById("videoAddonBtn").style.color = "";

        endVideoCall();
        isOpen = false;
    }

    /* -----------------------------------------------------
       Start & Answer Calls
    ----------------------------------------------------- */
    async function startVideoCall() {
        const roomCode = ChatterBoxAPI.getRoomCode();
        if (!roomCode) return alert("Join a room first.");

        const peerId = "video_" + roomCode;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const localVid = document.getElementById("vcLocal");
            if (localVid) localVid.srcObject = localStream;

            activeVideoCall = window.peer.call(peerId, localStream);

            activeVideoCall.on("stream", stream => {
                const remoteVid = document.getElementById("vcRemote");
                remoteVid.srcObject = stream;
            });

        } catch (e) {
            alert("Unable to access camera/microphone.");
        }
    }

    function endVideoCall() {
        if (activeVideoCall) {
            try { activeVideoCall.close(); } catch (e) { }
            activeVideoCall = null;
        }

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }

        const remoteVid = document.getElementById("vcRemote");
        const localVid = document.getElementById("vcLocal");
        if (remoteVid) remoteVid.srcObject = null;
        if (localVid) localVid.srcObject = null;
    }

    /* -----------------------------------------------------
       Auto-Answer System
    ----------------------------------------------------- */
    function setupAutoAnswer() {
        if (!window.peer) {
            return setTimeout(setupAutoAnswer, 500);
        }

        window.peer.on("call", async call => {
            if (!call.peer.startsWith("video_")) return;

            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const localVid = document.getElementById("vcLocal");
                if (localVid) localVid.srcObject = localStream;

                call.answer(localStream);

                activeVideoCall = call;

                call.on("stream", stream => {
                    const remoteVid = document.getElementById("vcRemote");
                    if (remoteVid) remoteVid.srcObject = stream;
                });

            } catch (e) {
                console.error("Camera error", e);
            }
        });
    }

    /* Initialize after UI loads */
    injectVideoButton();
    setupAutoAnswer();

})();
