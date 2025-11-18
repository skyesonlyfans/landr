(function() {
  const STORAGE_KEY = 'landrEmulatorEnabled';
  const ROM_BASE_URL = 'https://raw.githubusercontent.com/skyesonlyfans/landr/main/roms/';
  
  function createEmulatorWidget() {
    const contentGrid = document.querySelector('.content-grid');
    if (!contentGrid || document.getElementById('emulatorWidget')) return;
    
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'emulatorWidget';
    widget.style.cssText = 'grid-column: span 2; min-height: 500px;';
    widget.innerHTML = `
      <h2 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="font-size: 1.5rem;">🎮</span> Super Mario Bros
      </h2>
      <div style="position: relative; width: 100%; height: 480px; background: #000; border-radius: 15px; overflow: hidden;">
        <div id="emulatorGame" style="width: 100%; height: 100%;"></div>
      </div>
      <div style="margin-top: 15px; text-align: center; opacity: 0.7; font-size: 0.9rem;">
        <p style="margin: 5px 0;">Controls: Arrow Keys = Move/Duck, Z = Jump, X = Run/Fireball</p>
        <p style="margin: 5px 0;">Enter = Start/Pause, Shift = Select</p>
      </div>
    `;
    
    contentGrid.appendChild(widget);
    
    loadEmulator();
  }
  
  function loadEmulator() {
    if (window.EJS_player) {
      return;
    }
    
    const existingScript = document.querySelector('script[src*="emulatorjs"]');
    if (existingScript) {
      return;
    }
    
    window.EJS_player = "#emulatorGame";
    window.EJS_core = "nes";
    window.EJS_gameName = "Super Mario Bros";
    window.EJS_color = "#764ba2";
    window.EJS_startOnLoaded = true;
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_gameUrl = ROM_BASE_URL + "Super Mario Bros. (World).nes";
    
    const script = document.createElement('script');
    script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
    document.body.appendChild(script);
  }
  
  function removeEmulatorWidget() {
    const widget = document.getElementById('emulatorWidget');
    if (widget) {
      widget.remove();
    }
  }
  
  function addSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const emulatorSetting = document.createElement('div');
    emulatorSetting.className = 'setting-item';
    emulatorSetting.innerHTML = `
      <label class="setting-label">NES Emulator</label>
      <div class="setting-toggle">
        <span>Enable Super Mario Bros</span>
        <div class="toggle-switch" id="emulatorToggle">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(emulatorSetting, visualizerSetting.nextSibling);
    
    const toggle = document.getElementById('emulatorToggle');
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === 'true') {
      toggle.classList.add('active');
      setTimeout(() => createEmulatorWidget(), 100);
    }
    
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      localStorage.setItem(STORAGE_KEY, isEnabled);
      
      if (isEnabled) {
        createEmulatorWidget();
      } else {
        removeEmulatorWidget();
      }
    });
  }
  
  addSettingsToggle();
  
  console.log('Super Mario Bros emulator widget loaded successfully!');
})();