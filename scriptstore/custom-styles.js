// Name: Desktop Environment (OS X Style)
// Description: Transforms widgets into draggable, resizable windows with OS X controls and a System Preferences panel.
// Author: Landr Addon

(function() {
    const LAYOUT_KEY = 'landr_desktop_layout';
    const PREFS_KEY = 'landr_desktop_prefs';
    
    // Global state
    let zIndexCounter = 100;
    let layoutState = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
    let prefsState = JSON.parse(localStorage.getItem(PREFS_KEY) || '{ "font": "Inter", "accent": "#f093fb" }');

    // CSS for the Desktop Environment
    const style = document.createElement('style');
    style.textContent = `
        .content-grid {
            display: block !important; /* Break the grid */
            position: relative;
            height: calc(100vh - 200px); /* Allow space for header/footer */
            width: 100%;
            overflow: hidden; /* Contain windows */
        }
        
        .widget {
            position: absolute !important;
            min-width: 300px;
            min-height: 200px;
            margin: 0 !important;
            display: flex;
            flex-direction: column;
            transition: box-shadow 0.2s ease, transform 0.1s ease; /* Removed transition on width/height/top/left for smooth dragging */
            backdrop-filter: blur(20px) !important;
            background: rgba(40, 40, 40, 0.6) !important; /* Mac-like dark glass */
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }

        .widget.active-window {
            box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        /* Window Controls (Traffic Lights) */
        .window-header {
            height: 32px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px 20px 0 0;
            display: flex;
            align-items: center;
            padding: 0 15px;
            cursor: grab;
            user-select: none;
            flex-shrink: 0;
        }
        
        .window-header:active {
            cursor: grabbing;
        }

        .window-controls {
            display: flex;
            gap: 8px;
            margin-right: 15px;
        }

        .control-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            position: relative;
        }
        
        .control-dot:hover::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            border-radius: 50%;
            background: rgba(0,0,0,0.2);
        }

        .dot-close { background: #ff5f56; }
        .dot-min { background: #ffbd2e; }
        .dot-max { background: #27c93f; }

        .window-title {
            font-size: 0.85rem;
            font-weight: 600;
            opacity: 0.7;
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            text-align: center;
            margin-right: 50px; /* Balance the controls width */
        }

        .widget-content-area {
            flex: 1;
            overflow: auto;
            padding: 20px;
            position: relative;
        }

        /* Resize Handle */
        .resize-handle {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            cursor: nwse-resize;
            z-index: 10;
        }
        
        .resize-handle::after {
            content: '';
            position: absolute;
            right: 5px;
            bottom: 5px;
            width: 8px;
            height: 8px;
            border-right: 2px solid rgba(255,255,255,0.3);
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }

        /* System Preferences Specifics */
        .pref-group {
            margin-bottom: 20px;
        }
        .pref-label {
            display: block;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: #ccc;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
    `;
    document.head.appendChild(style);

    // --- Initialization ---

    function initDesktop() {
        // Apply saved preferences immediately
        applyPreferences();

        // Create System Preferences Widget if it doesn't exist
        if (!document.getElementById('sysPrefsWidget')) {
            createSystemPreferences();
        }

        // Convert all existing widgets to Windows
        const widgets = document.querySelectorAll('.widget');
        const grid = document.querySelector('.content-grid');

        if (!grid) return;

        // Reset grid logic to block for absolute positioning
        grid.style.display = 'block';
        
        widgets.forEach((widget, index) => {
            // Prevent double initialization
            if (widget.querySelector('.window-header')) return;
            
            // Identify the widget
            const id = widget.id || `widget-${index}`;
            widget.id = id;
            
            // 1. Structure Transformation
            wrapWidgetContent(widget);
            
            // 2. Initial Positioning
            if (layoutState[id]) {
                const s = layoutState[id];
                widget.style.left = s.left;
                widget.style.top = s.top;
                widget.style.width = s.width;
                widget.style.height = s.height;
                if (s.zIndex) widget.style.zIndex = s.zIndex;
                if (s.minimized) toggleMinimize(widget, true);
                if (s.closed) widget.style.display = 'none';
            } else {
                // Default cascade
                widget.style.left = (50 + (index * 30)) + 'px';
                widget.style.top = (50 + (index * 30)) + 'px';
                widget.style.width = '400px';
                widget.style.height = '300px';
            }

            // 3. Add Interactions
            makeDraggable(widget);
            makeResizable(widget);
            
            // Bring to front on mousedown
            widget.addEventListener('mousedown', () => bringToFront(widget));
        });
        
        // Save layout periodically
        setInterval(saveLayout, 5000);
    }

    function wrapWidgetContent(widget) {
        // Extract title
        const h2 = widget.querySelector('h2');
        let title = 'Widget';
        if (h2) {
            title = h2.textContent; // Keep icon if present
            h2.style.display = 'none'; // Hide original H2 inside content
        }

        // Move original content to a wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'widget-content-area';
        while (widget.firstChild) {
            contentWrapper.appendChild(widget.firstChild);
        }

        // Create Header
        const header = document.createElement('div');
        header.className = 'window-header';
        header.innerHTML = `
            <div class="window-controls">
                <button class="control-dot dot-close" title="Close"></button>
                <button class="control-dot dot-min" title="Minimize"></button>
                <button class="control-dot dot-max" title="Maximize"></button>
            </div>
            <div class="window-title">${title}</div>
        `;

        // Bind Header Controls
        header.querySelector('.dot-close').onclick = (e) => {
            e.stopPropagation();
            widget.style.display = 'none';
            saveLayout();
        };
        header.querySelector('.dot-min').onclick = (e) => {
            e.stopPropagation();
            toggleMinimize(widget);
        };
        header.querySelector('.dot-max').onclick = (e) => {
            e.stopPropagation();
            toggleMaximize(widget);
        };

        // Create Resize Handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';

        // Reassemble
        widget.appendChild(header);
        widget.appendChild(contentWrapper);
        widget.appendChild(resizeHandle);
    }

    // --- Interaction Logic ---

    function bringToFront(widget) {
        zIndexCounter++;
        widget.style.zIndex = zIndexCounter;
        
        // Visual active state
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active-window'));
        widget.classList.add('active-window');
        
        saveLayout();
    }

    function makeDraggable(widget) {
        const header = widget.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking buttons
            if(e.target.closest('button')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Get computed values
            const rect = widget.getBoundingClientRect();
            // We need relative values to the container
            const container = widget.offsetParent || document.body;
            const containerRect = container.getBoundingClientRect();
            
            initialLeft = widget.offsetLeft;
            initialTop = widget.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            widget.style.left = `${initialLeft + dx}px`;
            widget.style.top = `${initialTop + dy}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveLayout();
        }
    }

    function makeResizable(widget) {
        const handle = widget.querySelector('.resize-handle');
        let isResizing = false;
        let startX, startY, startW, startH;

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = widget.offsetWidth;
            startH = widget.offsetHeight;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            widget.style.width = `${Math.max(200, startW + dx)}px`;
            widget.style.height = `${Math.max(100, startH + dy)}px`;
        }

        function onMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveLayout();
        }
    }

    function toggleMinimize(widget, force) {
        const content = widget.querySelector('.widget-content-area');
        const handle = widget.querySelector('.resize-handle');
        const isMinimized = content.style.display === 'none';
        
        if (force === true || !isMinimized) {
            content.style.display = 'none';
            handle.style.display = 'none';
            widget.dataset.prevHeight = widget.style.height;
            widget.style.height = 'auto';
        } else {
            content.style.display = 'block';
            handle.style.display = 'block';
            widget.style.height = widget.dataset.prevHeight || '300px';
        }
        saveLayout();
    }

    function toggleMaximize(widget) {
        const container = widget.offsetParent;
        if (!widget.dataset.isMaximized) {
            // Store previous state
            widget.dataset.prevTop = widget.style.top;
            widget.dataset.prevLeft = widget.style.left;
            widget.dataset.prevWidth = widget.style.width;
            widget.dataset.prevHeight = widget.style.height;

            widget.style.top = '0';
            widget.style.left = '0';
            widget.style.width = '100%';
            widget.style.height = '100%';
            widget.dataset.isMaximized = 'true';
            bringToFront(widget);
        } else {
            // Restore
            widget.style.top = widget.dataset.prevTop;
            widget.style.left = widget.dataset.prevLeft;
            widget.style.width = widget.dataset.prevWidth;
            widget.style.height = widget.dataset.prevHeight;
            delete widget.dataset.isMaximized;
        }
    }

    // --- System Preferences Widget ---

    function createSystemPreferences() {
        const grid = document.querySelector('.content-grid');
        if (!grid) return;

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.id = 'sysPrefsWidget';
        widget.innerHTML = `<h2>⚙️ System Preferences</h2>`;
        
        const form = document.createElement('div');
        form.style.padding = '10px';
        form.innerHTML = `
            <div class="pref-group">
                <label class="pref-label">Appearance</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="color" id="accentPicker" value="${prefsState.accent}" style="
                        width: 50px; height: 30px; border: none; border-radius: 4px; cursor: pointer; background: none;
                    ">
                    <span style="font-size: 0.9rem; opacity: 0.8;">Accent Color</span>
                </div>
            </div>

            <div class="pref-group">
                <label class="pref-label">Typography</label>
                <select id="fontPicker" class="ios-select" style="width: 100%;">
                    <option value="Inter">Inter (Default)</option>
                    <option value="'Courier New', monospace">Courier New (Retro)</option>
                    <option value="'Times New Roman', serif">Times New Roman (Classic)</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans (Fun)</option>
                    <option value="Arial, sans-serif">Arial</option>
                </select>
            </div>
            
            <div class="pref-group">
                <label class="pref-label">Custom Injectors</label>
                <input type="text" id="cssInjector" placeholder="Custom CSS (e.g. body { background: red; })" class="setting-input" style="margin-bottom: 10px;">
                <button id="btnInjectCSS" class="add-btn" style="width: 100%;">Inject CSS</button>
            </div>
            
            <div class="pref-group">
                <button id="btnResetLayout" style="
                    width: 100%; padding: 10px; background: #ef4444; border: none; border-radius: 8px; color: white; cursor: pointer;
                ">Reset Desktop Layout</button>
            </div>
        `;

        widget.appendChild(form);
        grid.appendChild(widget);

        // Bind Prefs Events
        setTimeout(() => {
            const accentPicker = document.getElementById('accentPicker');
            const fontPicker = document.getElementById('fontPicker');
            const btnInject = document.getElementById('btnInjectCSS');
            const btnReset = document.getElementById('btnResetLayout');
            const cssInput = document.getElementById('cssInjector');

            fontPicker.value = prefsState.font;

            accentPicker.oninput = (e) => {
                prefsState.accent = e.target.value;
                applyPreferences();
                savePrefs();
            };

            fontPicker.onchange = (e) => {
                prefsState.font = e.target.value;
                applyPreferences();
                savePrefs();
            };

            btnInject.onclick = () => {
                const css = cssInput.value;
                if (css) {
                    const style = document.createElement('style');
                    style.textContent = css;
                    document.head.appendChild(style);
                    LandrAPI.showNotification('CSS Injected', 'success');
                }
            };

            btnReset.onclick = () => {
                if(confirm('Reset all window positions?')) {
                    localStorage.removeItem(LAYOUT_KEY);
                    location.reload();
                }
            };
        }, 100);
    }

    function saveLayout() {
        const state = {};
        document.querySelectorAll('.widget').forEach(w => {
            state[w.id] = {
                left: w.style.left,
                top: w.style.top,
                width: w.style.width,
                height: w.style.height,
                zIndex: w.style.zIndex,
                minimized: w.querySelector('.widget-content-area').style.display === 'none',
                closed: w.style.display === 'none'
            };
        });
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(state));
    }

    function savePrefs() {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefsState));
    }

    function applyPreferences() {
        document.documentElement.style.setProperty('--accent-color', prefsState.accent);
        document.body.style.fontFamily = prefsState.font;
        
        // Update pickers if they exist
        const picker = document.getElementById('accentPicker');
        if (picker) picker.value = prefsState.accent;
    }

    // Start the environment
    // Small delay to ensure other widgets have rendered
    setTimeout(initDesktop, 500);

})();
