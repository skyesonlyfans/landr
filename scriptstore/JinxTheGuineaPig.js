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
    const ARCHIVE_PREFIX = 'https://web.archive.org/web/20130000000000if_/';
    const BASE_URL = 'http://bunnyherolabs.com/adopt/swf/';

    // --- Ruffle Loader ---
    function loadRuffle(callback) {
        if (window.RufflePlayer) {
            callback();
            return;
        }
        
        if (document.querySelector(`script[src="${RUFFLE_SCRIPT}"]`)) {
            const check = setInterval(() => {
                if (window.RufflePlayer) {
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
        widget.style.cssText = `
            position: relative;
            min-height: 350px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border: 1px solid rgba(255,255,255,0.2);
        `;

        // Place Jinx at the top of the grid or append
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
            ">
                <h2 style="margin:0; font-size: 1.5rem;">🐹 Jinx the Guinea Pig</h2>
            </div>
            <div id="jinxContainer" style="
                flex: 1; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                position: relative;
            ">
                <div style="color: white; opacity: 0.7; position: absolute;">Waking up Jinx...</div>
            </div>
        `;

        loadRuffle(() => {
            const container = widget.querySelector('#jinxContainer');
            if (!container) return;
            
            // Construct the specific Archive URL for the guinea pig SWF
            const swfUrl = ARCHIVE_PREFIX + BASE_URL + PET_CONFIG.swfFile;
            
            // Construct FlashVars to recreate the specific customization
            // We map 'cn' (Creature Name) and 'an' (Adopter Name) which BunnyHeroLabs uses
            // We also include 'clr' for the custom color
            const flashVars = [
                `mc=${encodeURIComponent(PET_CONFIG.swfFile)}`,
                `clr=${encodeURIComponent(PET_CONFIG.color)}`,
                `cn=${encodeURIComponent(PET_CONFIG.name)}`,
                `an=${encodeURIComponent(PET_CONFIG.owner)}`,
                // Fallbacks often used by these SWFs
                `name=${encodeURIComponent(PET_CONFIG.name)}`,
                `msg=${encodeURIComponent('Owner: ' + PET_CONFIG.owner)}`
            ].join('&');

            const embedHTML = `
                <embed 
                    src="${swfUrl}" 
                    width="100%" 
                    height="100%" 
                    quality="high" 
                    wmode="transparent" 
                    flashvars="${flashVars}"
                    name="jinxwidget"
                    type="application/x-shockwave-flash"
                    pluginspage="http://www.macromedia.com/go/getflashplayer">
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
