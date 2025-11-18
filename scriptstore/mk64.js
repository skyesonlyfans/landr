(function() {
  const STORAGE_KEY = 'landrMarioKartEnabled';
  const ROM_BASE_URL = 'https://raw.githubusercontent.com/skyesonlyfans/landr/main/roms/SM64/';
  
  function createMarioKartWidget() {
    const contentGrid = document.querySelector('.content-grid');
    if (!contentGrid || document.getElementById('marioKartWidget')) return;
    
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'marioKartWidget';
    widget.style.cssText = 'grid-column: span 2; min-height: 500px;';
    widget.innerHTML = `
      <h2 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="font-size: 1.5rem;">🏎️</span> Mario Kart 64
      </h2>
      <div style="position: relative; width: 100%; height: 480px; background: #000; border-radius: 15px; overflow: hidden;">
        <div id="marioKartGame" style="width: 100%; height: 100%;"></div>
      </div>
      <div style="margin-top: 15px; text-align: center; opacity: 0.7; font-size: 0.9rem;">
        <p style="margin: 5px 0;">Controls: Arrow Keys = Steer, Z = Accelerate, X = Brake</p>
        <p style="margin: 5px 0;">A = Use Item, S = Drift, Enter = Start/Pause</p>
      </div>
    `;
    
    contentGrid.appendChild(widget);
    
    loadEmulator();
  }
  
  function loadEmulator() {
    if (document.querySelector('#marioKartGame script')) {
      return;
    }
    
    const gameContainer = document.getElementById('marioKartGame');
    if (!gameContainer) return;
    
    window.EJS_player = "#marioKartGame";
    window.EJS_core = "n64";
    window.EJS_gameName = "Mario Kart 64";
    window.EJS_color = "#764ba2";
    window.EJS_startOnLoaded = true;
    window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
    window.EJS_gameUrl = ROM_BASE_URL + "Mario Kart 64 (USA).z64";
    
    const existingScript = document.querySelector('script[src*="emulatorjs"][data-mariokart]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
      script.setAttribute('data-mariokart', 'true');
      document.body.appendChild(script);
    }
  }
  
  function removeMarioKartWidget() {
    const widget = document.getElementById('marioKartWidget');
    if (widget) {
      widget.remove();
    }
  }
  
  function addSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const marioKartSetting = document.createElement('div');
    marioKartSetting.className = 'setting-item';
    marioKartSetting.innerHTML = `
      <label class="setting-label">N64 Emulator</label>
      <div class="setting-toggle">
        <span>Enable Mario Kart 64</span>
        <div class="toggle-switch" id="marioKartToggle">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(marioKartSetting, visualizerSetting.nextSibling);
    
    const toggle = document.getElementById('marioKartToggle');
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === 'true') {
      toggle.classList.add('active');
      setTimeout(() => createMarioKartWidget(), 100);
    }
    
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      localStorage.setItem(STORAGE_KEY, isEnabled);
      
      if (isEnabled) {
        createMarioKartWidget();
      } else {
        removeMarioKartWidget();
      }
    });
  }
  
  addSettingsToggle();
  
  console.log('Mario Kart 64 emulator widget loaded successfully!');
})();