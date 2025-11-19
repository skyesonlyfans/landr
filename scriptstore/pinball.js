// Name: Retro Pinball
// Description: Play classic Flash Pinball tables (Pepsi Pinball, Space Pinball) using Ruffle.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'pinballWidget';
    
    // We use direct Archive.org download links for reliability
    // These are raw SWF files that Ruffle can digest
    const TABLES = {
        'pepsi': {
            name: 'Pepsi Pinball (Classic)',
            url: 'https://archive.org/download/pepsipinball_flash/pepsipinball.swf',
            width: 550,
            height: 400
        },
        'space': {
            name: 'Space Pinball',
            url: 'https://archive.org/download/flash_pinball/pinball.swf',
            width: 550,
            height: 400
        },
        'fantasy': {
            name: 'Fantasy Pinball',
            url: 'https://archive.org/download/flash_pinball_game/flash_pinball_game.swf',
            width: 600,
            height: 450
        }
    };

    const RUFFLE_SCRIPT = 'https://unpkg.com/@ruffle-rs/ruffle';

    // --- Ruffle Config ---
    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
        "publicPath": undefined,
        "polyfills": true,
        "allowScriptAccess": true,
        "autoplay": "on",
        "unmuteOverlay": "hidden"
    };

    // --- Dependencies ---
    function loadRuffle(callback) {
        if (window.RufflePlayer && window.RufflePlayer.newest) {
            callback();
            return;
        }
        
        if (document.querySelector(`script[src="${RUFFLE_SCRIPT}"]`)) {
            const check = setInterval(() => {
                if (window.RufflePlayer && window.RufflePlayer.newest) {
                    clearInterval(check);
                    callback();
                }
            }, 100);
            return;
        }

        const script = document.createElement('script');
        script.src = RUFFLE_SCRIPT;
        script.onload = callback;
        document.head.appendChild(script);
    }

    // --- Widget Construction ---
    function createWidget() {
        if (document.getElementById(WIDGET_ID)) return;

        const contentGrid = document.querySelector('.content-grid');
        if (!contentGrid) return;

        const widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'widget';
        
        // Initial styling (Desktop Manager will override layout properties later)
        widget.style.cssText = `
            position: absolute;
            top: 100px;
            left: 100px;
            width: 600px;
            height: 500px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #1a1a1a;
            z-index: 500; /* Start high so it pops up */
        `;

        // If Desktop Manager isn't active, fallback to grid placement
        if (getComputedStyle(contentGrid).display === 'grid') {
            widget.style.position = 'relative';
            widget.style.top = 'auto';
            widget.style.left = 'auto';
            widget.style.width = 'auto';
            widget.style.gridColumn = 'span 2';
        }

        contentGrid.appendChild(widget);
        renderMenu(widget);
    }

    function renderMenu(widget) {
        widget.innerHTML = `
            <div style="padding: 20px; text-align: center; color: white; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <h2 style="margin-bottom: 20px; font-size: 2rem;">🕹️ Retro Pinball</h2>
                <p style="opacity: 0.7; margin-bottom: 30px;">Select a table to launch:</p>
                
                <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
                    ${Object.entries(TABLES).map(([key, info]) => `
                        <button class="pinball-btn" data-table="${key}" style="
                            padding: 15px 25px;
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 12px;
                            color: white;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            font-weight: 600;
                            transition: all 0.2s;
                            min-width: 150px;
                        ">
                            ${info.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Hover effects
        widget.querySelectorAll('.pinball-btn').forEach(btn => {
            btn.onmouseenter = () => {
                btn.style.background = 'var(--accent-color, #f093fb)';
                btn.style.transform = 'translateY(-3px)';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.transform = 'translateY(0)';
            };
            btn.onclick = () => {
                loadTable(widget, btn.dataset.table);
            };
        });
    }

    function loadTable(widget, tableKey) {
        const table = TABLES[tableKey];
        
        widget.innerHTML = `
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: 10px 20px;
                background: rgba(0,0,0,0.3);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
                <span style="font-weight: 600; opacity: 0.9;">${table.name}</span>
                <button id="btnBackMenu" style="
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.8rem;
                ">Menu</button>
            </div>
            <div id="pinballContainer" style="
                flex: 1;
                background: black;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
            ">
                <div style="color: white; opacity: 0.5;">Loading Ruffle Emulator...</div>
            </div>
        `;

        widget.querySelector('#btnBackMenu').onclick = () => renderMenu(widget);

        loadRuffle(() => {
            const container = widget.querySelector('#pinballContainer');
            if (!container) return;

            // Using <embed> tag for Ruffle
            // We set specific dimensions to keep aspect ratio, but allow scaling via CSS
            const embedHTML = `
                <embed 
                    src="${table.url}" 
                    width="100%" 
                    height="100%" 
                    quality="high" 
                    wmode="window" 
                    allowScriptAccess="always"
                    type="application/x-shockwave-flash"
                    pluginspage="http://www.macromedia.com/go/getflashplayer">
                </embed>
            `;
            
            container.innerHTML = embedHTML;
        });
    }

    createWidget();
    
    if (typeof LandrAPI !== 'undefined') {
    console.log('Custom script loaded successfully!');
    }

})();
