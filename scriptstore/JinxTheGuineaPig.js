// Name: Jinx the Guinea Pig
// Description: A standalone widget for Jinx, the Landr Team's guinea pig.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'jinxPetWidget';
    
    // Configuration decoded from your iframe code:
    // bWM9Z3VpbmVhcGlnLnN3ZiZjbHI9MHhiMTg1MmQmY249amlueCZhbj10aGUgbGFuZHIgdGVhbQ==
    const PET_CONFIG = {
        swfFile: 'guineapig.swf',
        color: '0xb1852d',
        name: 'Jinx',
        owner: 'the landr team'
    };

    const RUFFLE_SCRIPT = 'https://unpkg.com/@ruffle-rs/ruffle';
    
    // CHANGED: Used 'id_' (raw identity) instead of 'if_' (frame) to prevent HTML injection
    // CHANGED: Used a concrete timestamp (June 2013) to avoid redirect chains that break CORS
    const ARCHIVE_PREFIX = 'https://web.archive.org/web/20130614020500id_/';
    const BASE_URL = 'http://bunnyherolabs.com/adopt/swf/';

    // --- Ruffle Config ---
    // Pre-configure Ruffle to be permissive with cross-origin content
    window.RufflePlayer = window.RufflePlayer || {};
    window.RufflePlayer.config = {
        "publicPath": undefined,
        "polyfills": true,
        "allowScriptAccess": true
    };

    // --- Ruffle Loader ---
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

    // --- Widget Creation ---
    function createWidget() {
        if (document.getElementById(WIDGET_ID)) return;

        const contentGrid = document.querySelector('.content-grid');
        if (!contentGrid) return;

        const widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'widget';
        // Added specific height to ensure the SWF has room
        widget.style.cssText = `
            position: relative;
            height: 380px; 
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border: 1px solid rgba(255,255,255,0.2);
        `;

        contentGrid.prepend(widget);
        renderJinx(widget);
    }

    function renderJinx(widget) {
        widget.innerHTML = `
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 15px; 
                border-bottom: 1px solid rgba(255,255,255,0.1); 
                padding-bottom: 10px;
                height: 40px;
            ">
                <h2 style="margin:0; font-size: 1.5rem;">🐹 Jinx the Guinea Pig</h2>
            </div>
            <div id="jinxContainer" style="
                flex: 1; 
                width: 100%;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                position: relative;
                background: rgba(0,0,0,0.1);
                border-radius: 8px;
            ">
                <div style="color: white; opacity: 0.7; position: absolute;">Loading Jinx...</div>
            </div>
        `;

        loadRuffle(() => {
            const container = widget.querySelector('#jinxContainer');
            if (!container) return;
            
            const swfUrl = ARCHIVE_PREFIX + BASE_URL + PET_CONFIG.swfFile;
            
            // FlashVars: pass customization data to the SWF
            const flashVars = [
                `mc=${encodeURIComponent(PET_CONFIG.swfFile)}`,
                `clr=${encodeURIComponent(PET_CONFIG.color)}`,
                `cn=${encodeURIComponent(PET_CONFIG.name)}`,
                `an=${encodeURIComponent(PET_CONFIG.owner)}`,
                `name=${encodeURIComponent(PET_CONFIG.name)}`,
                `msg=${encodeURIComponent('Owner: ' + PET_CONFIG.owner)}`
            ].join('&');

            // Using <embed> is generally more reliable for Ruffle polyfill detection than object
            const embedHTML = `
                <embed 
                    src="${swfUrl}" 
                    width="250" 
                    height="300" 
                    quality="high" 
                    wmode="transparent" 
                    flashvars="${flashVars}"
                    name="jinxwidget"
                    allowScriptAccess="always"
                    type="application/x-shockwave-flash">
                </embed>
            `;
            
            container.innerHTML = embedHTML;
        });
    }

    createWidget();

    if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification('Jinx has arrived! 🐹', 'success');
    }

})();
