// Name: Desktop Pet
// Description: Adopt a retro interactive pet (Penguin, Panda, etc.) using Ruffle emulation.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'bunnyHeroWidget';
    const STORAGE_KEY = 'landr_pet_config';
    
    // Ruffle is required because BunnyHeroLabs uses Flash (.swf)
    const RUFFLE_SCRIPT = 'https://unpkg.com/@ruffle-rs/ruffle';

    // Curated list of working pet SWFs for "Quick Adopt"
    const PET_PRESETS = {
        'penguin': 'https://bunnyherolabs.com/adopt/swf/penguin.swf',
        'panda': 'https://bunnyherolabs.com/adopt/swf/panda.swf',
        'fox': 'https://bunnyherolabs.com/adopt/swf/fox.swf',
        'monkey': 'https://bunnyherolabs.com/adopt/swf/monkey.swf',
        'puppy': 'https://bunnyherolabs.com/adopt/swf/puppy.swf',
        'kitty': 'https://bunnyherolabs.com/adopt/swf/kitten.swf',
        'lion': 'https://bunnyherolabs.com/adopt/swf/lion.swf',
        'sloth': 'https://bunnyherolabs.com/adopt/swf/sloth.swf',
        'turtle': 'https://bunnyherolabs.com/adopt/swf/turtle.swf'
    };

    // --- Ruffle Loader ---
    function loadRuffle(callback) {
        if (window.RufflePlayer) {
            callback();
            return;
        }
        
        // Check if script is already appending
        if (document.querySelector(`script[src="${RUFFLE_SCRIPT}"]`)) {
            // Simple poll to wait for load
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
        // Avoid duplicates
        if (document.getElementById(WIDGET_ID)) return;

        const contentGrid = document.querySelector('.content-grid');
        if (!contentGrid) return;

        const widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'widget';
        widget.style.cssText = `
            position: relative;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Insert before the visualizer or at the end
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
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
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
                    1. Go to <a href="https://bunnyherolabs.com/adopt/" target="_blank" style="color: var(--accent-color);">BunnyHeroLabs.com</a><br>
                    2. Customize your pet fully (colors, accessories).<br>
                    3. Finish and copy the "Embed Code".<br>
                    4. Paste it below.
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
            const url = PET_PRESETS[selectedSpecies];
            
            // Construct FlashVars for BunnyHero
            // Structure typically: swf?name=NAME&...
            // We save the HTML structure that Ruffle expects
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
            if (!code.includes('bunnyherolabs')) {
                LandrAPI.showNotification('Invalid code. Make sure it is from BunnyHeroLabs.', 'warning');
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
                min-height: 250px;
            ">
                <div style="color: white; opacity: 0.7;">Loading Pet...</div>
            </div>
        `;

        widget.querySelector('#btnReleasePet').onclick = () => {
            if(confirm('Are you sure you want to release your pet?')) {
                localStorage.removeItem(STORAGE_KEY);
                renderSetupView(widget);
            }
        };

        // Inject Ruffle Content
        loadRuffle(() => {
            const container = widget.querySelector('#petContainer');
            if (!container) return;
            
            // Ruffle Polyfill
            // We inject the HTML. Ruffle's mutation observer usually picks it up automatically.
            container.innerHTML = config.html;
            
            // Force Ruffle scan if it doesn't happen automatically
            const player = window.RufflePlayer?.newest?.();
            if (player) {
                // Sometimes we need to explicitly create the player if the polyfill is tricky
                // But typically innerHTML injection works if Ruffle is active.
            }
        });
    }

    function savePet(htmlContent) {
        // Basic sanitization/fixes for the code
        // Ensure http is https if possible, though Ruffle handles it well.
        let cleanHtml = htmlContent.replace(/http:\/\/bunnyherolabs/g, 'https://bunnyherolabs');

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
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .pet-tab:hover { opacity: 1 !important; }
        .species-btn:hover { transform: scale(1.05); background: rgba(255,255,255,0.15); }
    `;
    document.head.appendChild(style);

    createWidget();

})();
