// Name: Desktop Pet
// Description: Adopt a retro interactive pet (Penguin, Panda, Pig, etc.) using Ruffle emulation.
// Author: Landr Addon

(function() {
    const WIDGET_ID = 'bunnyHeroWidget';
    const STORAGE_KEY = 'landr_pet_config';
    
    // Ruffle is required because BunnyHeroLabs uses Flash (.swf)
    const RUFFLE_SCRIPT = 'https://unpkg.com/@ruffle-rs/ruffle';

    // Wayback Machine prefix for stable asset loading (2013 epoch)
    const ARCHIVE_PREFIX = 'https://web.archive.org/web/20130000000000if_/';
    const BASE_URL = 'http://bunnyherolabs.com/adopt/swf/';

    // Extended list of pets
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
        'horse': 'horse.swf',
        'pig': 'pig.swf',
        'bear': 'bear.swf',
        'hedgehog': 'hedgehog.swf'
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
            min-height: 350px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            grid-row: span 2; /* Give it more room */
        `;

        const visualizer = document.getElementById('visualizerWidget');
        if (visualizer) {
            contentGrid.insertBefore(widget, visualizer);
        } else {
            contentGrid.appendChild(widget);
        }

        renderWidgetContent();
    }

    // --- Parsing Logic ---
    function parseBunnyHeroCode(input) {
        try {
            // 1. Search for the Base64 encoded string common in BunnyHero embed codes
            // Matches: /adopt/i/[BASE64].swf OR showpet.php?b=[BASE64] OR petimage/[BASE64].png
            const b64Regex = /(?:\/adopt\/i\/|showpet\.php\?b=|petimage\/)([a-zA-Z0-9+/=]+)/;
            const match = input.match(b64Regex);

            if (match && match[1]) {
                const decoded = atob(match[1]);
                // Decoded string looks like: mc=pig.swf&clr=0xfddbfa&cn=pet name&an=adopter name
                
                // Parse query string
                const params = new URLSearchParams(decoded);
                
                const mc = params.get('mc'); // master clip (swf file)
                if (!mc) throw new Error('No SWF found in code');

                // Extract other params to pass as FlashVars
                const flashVars = [];
                params.forEach((value, key) => {
                    if (key !== 'mc') {
                        flashVars.push(`${key}=${encodeURIComponent(value)}`);
                    }
                });
                // Add standard mapping for reliability
                if (params.has('cn')) flashVars.push(`name=${encodeURIComponent(params.get('cn'))}`);
                if (params.has('an')) flashVars.push(`msg=${encodeURIComponent('Owner: ' + params.get('an'))}`);

                return {
                    swfUrl: ARCHIVE_PREFIX + BASE_URL + mc,
                    flashVars: flashVars.join('&'),
                    type: 'custom'
                };
            }

            // 2. Fallback: Classic Embed/Object tag parsing (Simple src extraction)
            if (input.includes('<embed') || input.includes('<object')) {
                const srcMatch = input.match(/src=["'](https?:\/\/[^"']+\.swf)["']/);
                if (srcMatch) {
                    let url = srcMatch[1];
                    // Fix URL to use archive if it points to dead site
                    if (url.includes('bunnyherolabs.com') && !url.includes('archive.org')) {
                        url = url.replace(/https?:\/\/bunnyherolabs\.com\/adopt\/swf\//, ''); // remove prefix
                        // If regex failed to strip cleanly, just grab filename if possible, else fallback
                        const filename = url.split('/').pop();
                        url = ARCHIVE_PREFIX + BASE_URL + filename;
                    }
                    return {
                        swfUrl: url,
                        flashVars: 'name=My Pet&msg=Hello',
                        type: 'legacy'
                    };
                }
            }

            return null;
        } catch (e) {
            console.error('Error parsing pet code:', e);
            return null;
        }
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
            <div id="viewQuick" style="display: flex; flex-direction: column; gap: 15px; height: 100%;">
                <div>
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 5px; opacity: 0.8;">Choose Species</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; max-height: 150px; overflow-y: auto; padding-right: 5px;">
                        ${Object.keys(PET_PRESETS).map(pet => `
                            <button class="species-btn" data-pet="${pet}" style="
                                padding: 8px;
                                border: 1px solid rgba(255,255,255,0.1);
                                background: rgba(255,255,255,0.05);
                                color: white;
                                border-radius: 8px;
                                cursor: pointer;
                                text-transform: capitalize;
                                font-size: 0.8rem;
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
                <button id="btnAdoptQuick" class="add-btn" style="margin-top: auto;">Adopt Now!</button>
            </div>

            <!-- Custom Form -->
            <div id="viewCustom" style="display: none; flex-direction: column; gap: 15px;">
                <p style="font-size: 0.85rem; opacity: 0.8; line-height: 1.4; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                    <strong>How to customize:</strong><br>
                    1. Go to the <a href="https://web.archive.org/web/20130807091245/http://bunnyherolabs.com/adopt/" target="_blank" style="color: var(--accent-color); text-decoration: underline;">Archived Creation Page</a>.<br>
                    2. Create your pet (choose color, name).<br>
                    3. On the "Finish" page, copy the <strong>HTML Code</strong> or the <strong>Direct Link</strong>.<br>
                    4. Paste it below. We will decode it and fix the broken links.
                </p>
                <textarea id="petEmbedInput" placeholder="Paste code here (e.g. <iframe...> or https://.../showpet.php?...)" style="
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

        // Tab Switching
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

        // Species Selection
        let selectedSpecies = null;
        const speciesBtns = widget.querySelectorAll('.species-btn');
        speciesBtns.forEach(btn => {
            btn.onclick = () => {
                speciesBtns.forEach(b => b.style.background = 'rgba(255,255,255,0.05)');
                btn.style.background = 'var(--accent-color)';
                selectedSpecies = btn.dataset.pet;
            };
        });

        // Quick Adopt Handler
        widget.querySelector('#btnAdoptQuick').onclick = () => {
            if (!selectedSpecies) {
                LandrAPI.showNotification('Please select a pet species!', 'warning');
                return;
            }
            const name = widget.querySelector('#petNameInput').value.trim() || 'My Pet';
            const url = ARCHIVE_PREFIX + BASE_URL + PET_PRESETS[selectedSpecies];
            const flashVars = `name=${encodeURIComponent(name)}&msg=${encodeURIComponent('Hello!')}&cn=${encodeURIComponent(name)}`;
            
            savePetConfig(url, flashVars);
        };

        // Custom Adopt Handler
        widget.querySelector('#btnAdoptCustom').onclick = () => {
            const input = widget.querySelector('#petEmbedInput').value.trim();
            if (!input) return;

            const parsed = parseBunnyHeroCode(input);
            
            if (parsed) {
                savePetConfig(parsed.swfUrl, parsed.flashVars);
            } else {
                LandrAPI.showNotification('Could not recognize pet code. Check the format.', 'error');
            }
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
                <div style="color: white; opacity: 0.7; position: absolute; pointer-events: none;">Loading Pet...</div>
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
            
            // Create Ruffle Embed
            // We construct the embed HTML manually to ensure parameters are passed correctly to the emulator
            const embedHTML = `
                <embed 
                    src="${config.swf}" 
                    width="100%" 
                    height="100%" 
                    quality="high" 
                    wmode="transparent" 
                    flashvars="${config.flashVars}"
                    name="bunnyheropet"
                    type="application/x-shockwave-flash"
                    pluginspage="http://www.macromedia.com/go/getflashplayer">
                </embed>
            `;
            
            container.innerHTML = embedHTML;
        });
    }

    function savePetConfig(swfUrl, flashVars) {
        const config = {
            active: true,
            swf: swfUrl,
            flashVars: flashVars,
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
