(function() {
    /* * iOS Do Not Disturb (Focus Mode) Switch
     * Toggles visibility of all widgets except Search.
     * Persists state across reloads.
     */

    const CONFIG = {
        storageKey: 'landr_focus_mode',
        // These selectors will be hidden when active. 
        // We target common containers based on the Landr structure.
        selectorsToHide: [
            '.links-container', 
            '.todo-container', 
            '.visualizer-container', 
            'canvas', // Hides the music visualizer canvas
            '.addon-container',
            'footer'
        ],
        // The switch will appear in the top-right
        position: 'fixed', 
        top: '20px',
        right: '20px'
    };

    // 1. Inject CSS for the iOS Switch and the Hidden State
    const style = document.createElement('style');
    style.innerHTML = `
        /* Focus Mode State - Hides elements with a smooth fade */
        body.focus-active ${CONFIG.selectorsToHide.join(', \nbody.focus-active ')} {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.4s ease;
        }

        /* The Switch Container */
        #dnd-wrapper {
            position: ${CONFIG.position};
            top: ${CONFIG.top};
            right: ${CONFIG.right};
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Label Text */
        #dnd-label {
            color: white;
            font-size: 14px;
            font-weight: 500;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            opacity: 0.8;
        }

        /* The Switch Input (Hidden) */
        .ios-switch-input {
            display: none;
        }

        /* The Slider (The visible track) */
        .ios-switch-label {
            position: relative;
            display: block;
            width: 50px;
            height: 30px;
            background-color: rgba(120, 120, 128, 0.32); /* iOS Dark Mode Grey */
            border-radius: 30px;
            cursor: pointer;
            transition: background-color 0.3s;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }

        /* The Knob (The circle) */
        .ios-switch-label::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 26px;
            height: 26px;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06);
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        /* Active State (Green) */
        .ios-switch-input:checked + .ios-switch-label {
            background-color: #34C759; /* iOS Green */
        }

        /* Active Knob Position */
        .ios-switch-input:checked + .ios-switch-label::after {
            transform: translateX(20px);
        }
        
        /* Moon Icon inside the knob (Optional flair) */
        .ios-switch-label::before {
            content: '🌙';
            position: absolute;
            top: 50%;
            left: 7px;
            transform: translateY(-50%) scale(0);
            font-size: 14px;
            transition: transform 0.3s;
            z-index: 1;
            line-height: 1;
        }
        .ios-switch-input:checked + .ios-switch-label::before {
            transform: translateY(-50%) scale(1);
            left: 8px; 
            color: #34C759; /* Matches background to hide it or use a specific color */
            opacity: 0; /* Kept simple for now, set to 1 to show icon */
        }
    `;
    document.head.appendChild(style);

    // 2. Create the DOM Elements
    const wrapper = document.createElement('div');
    wrapper.id = 'dnd-wrapper';

    const labelText = document.createElement('span');
    labelText.id = 'dnd-label';
    labelText.innerText = 'Focus';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'dnd-toggle';
    toggleInput.className = 'ios-switch-input';

    const toggleLabel = document.createElement('label');
    toggleLabel.setAttribute('for', 'dnd-toggle');
    toggleLabel.className = 'ios-switch-label';

    wrapper.appendChild(labelText);
    wrapper.appendChild(toggleInput);
    wrapper.appendChild(toggleLabel);
    document.body.appendChild(wrapper);

    // 3. Logic functions
    const setFocusMode = (isActive) => {
        if (isActive) {
            document.body.classList.add('focus-active');
            localStorage.setItem(CONFIG.storageKey, 'true');
            if(window.LandrAPI) LandrAPI.showNotification('Focus Mode On', 'success');
        } else {
            document.body.classList.remove('focus-active');
            localStorage.setItem(CONFIG.storageKey, 'false');
        }
    };

    // 4. Event Listeners
    toggleInput.addEventListener('change', (e) => {
        setFocusMode(e.target.checked);
    });

    // 5. Initialize State on Load
    const savedState = localStorage.getItem(CONFIG.storageKey);
    if (savedState === 'true') {
        toggleInput.checked = true;
        // We apply the class immediately without notification on load
        document.body.classList.add('focus-active');
    }
})();
