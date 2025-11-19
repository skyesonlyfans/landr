// Name: Desktop Pet
// Description: Adopt a retro interactive pet (Penguin, Panda, etc.) using Ruffle emulation.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'bunnyHeroWidget';
    const STORAGE_KEY = 'landr_pet_config';
    
    // Ruffle is required because BunnyHeroLabs uses Flash (.swf)
    const RUFFLE_SCRIPT = 'https://unpkg.com/@ruffle-rs/ruffle';

    // We must use the Wayback Machine because the original site often returns 404s for hotlinked SWFs
    // Timestamp 2013 is stable for these assets.
    const ARCHIVE_PREFIX = 'https://web.archive.org/web/20130000000000if_/';
    const BASE_URL = 'http://bunnyherolabs.com/adopt/swf/';

    const PET_PRESETS = {
        'penguin': 'penguin.swf',
        'panda': 'panda.swf',
        'fox': 'fox.swf',
        'monkey': 'monkey.swf',
        'puppy': 'puppy.swf',
        'kitty': 'kitten.swf',
        'lion': 'lion.swf',
        'sloth': 'sloth.swf',
        'turtle': 'turtle.swf',
        'horse': 'horse.swf'
    };

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
            min-height: 350px; /* Increased height for Flash container */
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        const visualizer = document.getElementById('visualizerWidget');
        if (visualizer) {
            contentGrid.insertBefore(widget, visualizer);
        } else {
            contentGrid.appendChild(widget);
        }

        renderWidgetContent();
    }

    // --- Rendering ---
    function renderWidgetContent() {
        const widget = document.getElementById(WIDGET_ID);
        if (!widget) return;

        const config = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (config && config.active) {
            renderPetView(widget, config);
        } else {
            renderSetupView(widget);
        }
    }

    function renderSetupView(widget) {
        widget.innerHTML = `
            <h2 style="margin-bottom: 15px;">Adopt a Pet</h2>
            <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <button id="tabQuick" class="pet-tab active" style="background: none; border: none; color: white; cursor: pointer; font-weight: 600; opacity: 1; border-bottom: 2px solid var(--accent-color);">Quick Adopt</button>
                <button id="tabCustom" class="pet-tab" style="background: none; border: none; color: white; cursor: pointer; font-weight: 600; opacity: 0.6;">Custom Code</button>
            </div>

            <!-- Quick Adopt Form -->
            <div id="viewQuick" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 5px; opacity: 0.8;">Choose Species</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px;">
                        ${Object.keys(PET_PRESETS).map(pet => `
                            <button class="species-btn" data-pet="${pet}" style="
                                padding: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05);
                                color: white;
                                border-radius: 8px;
                                cursor: pointer;
                                text-transform: capitalize;
                                font-size: 0.9rem;
                                transition: all 0.2s;
                            ">${pet}</button>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 5px; opacity: 0.8;">Name Your Pet</label>
                    <input type="text" id="petNameInput" placeholder="e.g. Fluffy" style="
                        width: 100%;
                        padding: 10px;
                        background: rgba(255,255,255,0.1);
                        border: none;
                        border-radius: 8px;
                        color: white;
                    ">
                </div>
                <button id="btnAdoptQuick" class="add-btn" style="margin-top: 10px;">Adopt Now!</button>
            </div>

            <!-- Custom Form -->
            <div id="viewCustom" style="display: none; flex-direction: column; gap: 15px;">
                <p style="font-size: 0.85rem; opacity: 0.8; line-height: 1.4;">
                    To fully customize (colors, items):<br>
                    1. Visit the <a href="https://web.archive.org/web/20130807091245/http://bunnyherolabs.com/adopt/" target="_blank" style="color: var(--accent-color); text-decoration: underline;">Archived Creator</a>.<br>
                    2. Create your pet and copy the HTML code.<br>
                    3. Paste it below (we will fix the broken links automatically).
                </p>
                <textarea id="petEmbedInput" placeholder="Paste <object> or <embed> code here..." style="
                    width: 100%;
                    height: 80px;
                    padding: 10px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-family: monospace;
                    font-size: 0.8rem;
                "></textarea>
                <button id="btnAdoptCustom" class="add-btn">Import Pet</button>
            </div>
        `;

        // Bind Tab Logic
        const tabQuick = widget.querySelector('#tabQuick');
        const tabCustom = widget.querySelector('#tabCustom');
        const viewQuick = widget.querySelector('#viewQuick');
        const viewCustom = widget.querySelector('#viewCustom');

        const switchTab = (isQuick) => {
            tabQuick.style.opacity = isQuick ? '1' : '0.6';
            tabQuick.style.borderBottom = isQuick ? '2px solid var(--accent-color)' : 'none';
            
            tabCustom.style.opacity = !isQuick ? '1' : '0.6';
            tabCustom.style.borderBottom = !isQuick ? '2px solid var(--accent-color)' : 'none';

            viewQuick.style.display = isQuick ? 'flex' : 'none';
            viewCustom.style.display = !isQuick ? 'flex' : 'none';
        };

        tabQuick.onclick = () => switchTab(true);
        tabCustom.onclick = () => switchTab(false);

        // Bind Species Selection
        let selectedSpecies = null;
        widget.querySelectorAll('.species-btn').forEach(btn => {
            btn.onclick = () => {
                widget.querySelectorAll('.species-btn').forEach(b => b.style.background = 'rgba(255,255,255,0.05)');
                btn.style.background = 'var(--accent-color)';
                selectedSpecies = btn.dataset.pet;
            };
        });

        // Bind Action Buttons
        widget.querySelector('#btnAdoptQuick').onclick = () => {
            if (!selectedSpecies) {
                LandrAPI.showNotification('Please select a pet species!', 'warning');
                return;
            }
            const name = widget.querySelector('#petNameInput').value.trim() || 'My Pet';
            // Use the Archive URL
            const url = ARCHIVE_PREFIX + BASE_URL + PET_PRESETS[selectedSpecies];
            
            const embedHTML = `
                <embed 
                    src="${url}" 
                    width="250" 
                    height="300" 
                    quality="high" 
                    wmode="transparent" 
                    flashvars="name=${encodeURIComponent(name)}&msg=${encodeURIComponent('Hello!')}"
                    type="application/x-shockwave-flash">
                </embed>
            `;
            
            savePet(embedHTML);
        };

        widget.querySelector('#btnAdoptCustom').onclick = () => {
            const code = widget.querySelector('#petEmbedInput').value.trim();
            if (!code.includes('bunnyherolabs') && !code.includes('archive.org')) {
                LandrAPI.showNotification('Invalid code. Must be from BunnyHeroLabs.', 'warning');
                return;
            }
            savePet(code);
        };
    }

    function renderPetView(widget, config) {
        widget.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 style="margin:0;">My Pet</h2>
                <button id="btnReleasePet" style="
                    background: rgba(239, 68, 68, 0.2); 
                    color: #fca5a5; 
                    border: none; 
                    padding: 5px 10px; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 0.8rem;
                ">Release</button>
            </div>
            <div id="petContainer" style="
                flex: 1; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                background: rgba(0,0,0,0.2); 
                border-radius: 12px;
                min-height: 300px;
                position: relative;
            ">
                <div style="color: white; opacity: 0.7; position: absolute;">Loading Pet...</div>
            </div>
        `;

        widget.querySelector('#btnReleasePet').onclick = () => {
            if(confirm('Are you sure you want to release your pet?')) {
                localStorage.removeItem(STORAGE_KEY);
                renderSetupView(widget);
            }
        };

        loadRuffle(() => {
            const container = widget.querySelector('#petContainer');
            if (!container) return;
            
            container.innerHTML = config.html;
        });
    }

    function savePet(htmlContent) {
        // --- AUTO-REPAIR BROKEN URLs ---
        // If the user pastes code from the live site (which 404s), we inject the Archive prefix.
        
        let cleanHtml = htmlContent;
        
        // 1. Ensure https
        cleanHtml = cleanHtml.replace(/http:\/\/bunnyherolabs/g, 'https://bunnyherolabs');
        
        // 2. If it points to bunnyherolabs directly, prepend the Wayback Machine prefix
        // We use a regex to find src="..." and check if it lacks archive.org
        const urlRegex = /(src|value)=["'](https?:\/\/bunnyherolabs\.com\/[^"']+)["']/g;
        
        cleanHtml = cleanHtml.replace(urlRegex, (match, attr, url) => {
            if (!url.includes('archive.org')) {
                return `${attr}="${ARCHIVE_PREFIX}${url}"`;
            }
            return match;
        });

        // 3. Force wmode=transparent if missing (fixes layering issues)
        if (!cleanHtml.includes('wmode')) {
             cleanHtml = cleanHtml.replace('<embed ', '<embed wmode="transparent" ');
        }

        const config = {
            active: true,
            html: cleanHtml,
            date: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        
        renderWidgetContent();
        LandrAPI.showNotification('Pet adopted successfully!', 'success');
    }

    // --- Initialize ---
    const style = document.createElement('style');
    style.textContent = `
        .pet-tab:hover { opacity: 1 !important; }
        .species-btn:hover { transform: scale(1.05); background: rgba(255,255,255,0.15); }
    `;
    document.head.appendChild(style);

    createWidget();

})();
