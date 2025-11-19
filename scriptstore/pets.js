(function() {
  const STORAGE_KEY = 'landrBunnyHeroPet';
  const PET_CONFIG_KEY = 'landrBunnyHeroPetConfig';
  
  // Global Pet API for extensibility
  window.LandrPetAPI = window.LandrPetAPI || {
    currentPet: null,
    petTypes: {},
    
    registerPetType: function(id, config) {
      this.petTypes[id] = config;
      console.log(`Pet type registered: ${id}`);
    },
    
    getCurrentPet: function() {
      return this.currentPet;
    },
    
    adoptPet: function(petType, petName, ownerName, color) {
      if (this.currentPet) {
        this.removePet();
      }
      
      this.currentPet = {
        type: petType,
        name: petName,
        owner: ownerName,
        color: color
      };
      
      this.embedPet(petType, petName, ownerName, color);
      this.savePet();
      
      const selector = document.getElementById('petAdoptionForm');
      const display = document.getElementById('petDisplay');
      if (selector) selector.style.display = 'none';
      if (display) display.style.display = 'block';
    },
    
    embedPet: function(petType, petName, ownerName, color) {
      const container = document.getElementById('petContainer');
      if (!container) return;
      
      // Clean color hex (remove # if present)
      const cleanColor = color.replace('#', '');
      
      // BunnyHero Labs embed URL structure
      const swfFile = this.petTypes[petType]?.swfFile || 'bunny';
      const embedUrl = `https://petswf.bunnyherolabs.com/adopt/swf/${swfFile}`;
      
      // Create iframe embed (works better than Flash/Ruffle in modern browsers)
      const iframeUrl = `https://bunnyherolabs.com/adopt/showpet.php?cn=${encodeURIComponent(petName)}&an=${encodeURIComponent(ownerName)}&mc=${swfFile}.swf&clr=0x${cleanColor}`;
      
      container.innerHTML = `
        <div style="width: 250px; margin: 0 auto; text-align: center;">
          <iframe src="${iframeUrl}" width="250" height="300" frameborder="0" scrolling="no" style="border-radius: 15px; background: transparent;"></iframe>
          <div style="margin-top: 10px; font-size: 0.85rem; opacity: 0.7;">
            <a href="https://bunnyherolabs.com/adopt/" target="_blank" style="color: var(--text-color); text-decoration: underline;">powered by bunnyhero labs</a>
          </div>
        </div>
      `;
    },
    
    removePet: function() {
      this.currentPet = null;
      localStorage.removeItem(PET_CONFIG_KEY);
      
      const container = document.getElementById('petContainer');
      if (container) container.innerHTML = '';
      
      const selector = document.getElementById('petAdoptionForm');
      const display = document.getElementById('petDisplay');
      if (selector) selector.style.display = 'block';
      if (display) display.style.display = 'none';
    },
    
    savePet: function() {
      if (this.currentPet) {
        localStorage.setItem(PET_CONFIG_KEY, JSON.stringify(this.currentPet));
      }
    },
    
    loadPet: function() {
      const saved = localStorage.getItem(PET_CONFIG_KEY);
      if (saved) {
        try {
          const pet = JSON.parse(saved);
          this.currentPet = pet;
          this.embedPet(pet.type, pet.name, pet.owner, pet.color);
          
          const selector = document.getElementById('petAdoptionForm');
          const display = document.getElementById('petDisplay');
          if (selector) selector.style.display = 'none';
          if (display) display.style.display = 'block';
          
          return true;
        } catch (e) {
          console.error('Error loading pet:', e);
        }
      }
      return false;
    }
  };
  
  // Register BunnyHero Labs pet types
  const petTypes = [
    { id: 'bunny', name: '🐰 Bunny', swfFile: 'bunny' },
    { id: 'cat', name: '🐱 Cat', swfFile: 'cat' },
    { id: 'dog', name: '🐶 Dog', swfFile: 'dog' },
    { id: 'hamster', name: '🐹 Hamster', swfFile: 'hamster' },
    { id: 'chick', name: '🐤 Chick', swfFile: 'chick' },
    { id: 'pig', name: '🐷 Pig', swfFile: 'pig' },
    { id: 'fox', name: '🦊 Fox', swfFile: 'fox' },
    { id: 'sheep', name: '🐑 Sheep', swfFile: 'sheep' },
    { id: 'fish', name: '🐠 Fish', swfFile: 'fish' },
    { id: 'bird', name: '🐦 Bird', swfFile: 'bird' },
    { id: 'monkey', name: '🐵 Monkey', swfFile: 'monkey' },
    { id: 'penguin', name: '🐧 Penguin', swfFile: 'penguin' },
    { id: 'hedgehog', name: '🦔 Hedgehog', swfFile: 'hedgehog' },
    { id: 'ferret', name: '🦦 Ferret', swfFile: 'ferret' },
    { id: 'sloth', name: '🦥 Sloth', swfFile: 'sloth' },
    { id: 'llama', name: '🦙 Llama', swfFile: 'llama' }
  ];
  
  petTypes.forEach(pet => {
    window.LandrPetAPI.registerPetType(pet.id, pet);
  });
  
  function createPetWidget() {
    const contentGrid = document.querySelector('.content-grid');
    if (!contentGrid || document.getElementById('bunnyHeroPetWidget')) return;
    
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'bunnyHeroPetWidget';
    widget.innerHTML = `
      <h2>🐾 Adopt a Virtual Pet</h2>
      
      <div id="petAdoptionForm">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.9;">Choose Your Pet</label>
          <select id="petTypeSelect" class="ios-select">
            ${petTypes.map(pet => `<option value="${pet.id}">${pet.name}</option>`).join('')}
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.9;">Pet Name</label>
          <input type="text" id="petNameInput" class="setting-input" placeholder="e.g., Fluffy" maxlength="20">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.9;">Your Name</label>
          <input type="text" id="ownerNameInput" class="setting-input" placeholder="e.g., Alex" maxlength="20">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.9;">Pet Color</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="color" id="petColorInput" value="#ffffff" style="width: 60px; height: 40px; border: none; border-radius: 8px; cursor: pointer; background: rgba(255,255,255,0.1);">
            <input type="text" id="petColorHex" class="setting-input" value="#ffffff" placeholder="#ffffff" maxlength="7" style="flex: 1;">
          </div>
        </div>
        
        <button class="add-btn" onclick="window.LandrPetAPI._handleAdopt()" style="width: 100%;">🎉 Adopt Pet</button>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.85rem; opacity: 0.8;">
          <strong>ℹ️ About:</strong> Pets are powered by <a href="https://bunnyherolabs.com/adopt/" target="_blank" style="color: var(--accent-color); text-decoration: underline;">BunnyHero Labs</a>. They're interactive Flash pets running via Ruffle emulator!
        </div>
      </div>
      
      <div id="petDisplay" style="display: none;">
        <div id="petContainer" style="margin-bottom: 15px;"></div>
        
        <div style="display: flex; gap: 10px;">
          <button class="add-btn" onclick="window.open('https://bunnyherolabs.com/adopt/', '_blank')" style="flex: 1;">📖 Learn More</button>
          <button class="modal-btn secondary" onclick="window.LandrPetAPI.removePet()" style="flex: 1;">🔄 Change Pet</button>
        </div>
      </div>
    `;
    
    contentGrid.appendChild(widget);
    
    // Connect color picker and hex input
    const colorInput = document.getElementById('petColorInput');
    const hexInput = document.getElementById('petColorHex');
    
    if (colorInput && hexInput) {
      colorInput.addEventListener('input', function() {
        hexInput.value = this.value;
      });
      
      hexInput.addEventListener('input', function() {
        if (/^#[0-9A-F]{6}$/i.test(this.value)) {
          colorInput.value = this.value;
        }
      });
    }
    
    // Load saved pet if exists
    window.LandrPetAPI.loadPet();
  }
  
  function removePetWidget() {
    const widget = document.getElementById('bunnyHeroPetWidget');
    if (widget) {
      window.LandrPetAPI.removePet();
      widget.remove();
    }
  }
  
  window.LandrPetAPI._handleAdopt = function() {
    const petType = document.getElementById('petTypeSelect')?.value;
    const petName = document.getElementById('petNameInput')?.value.trim();
    const ownerName = document.getElementById('ownerNameInput')?.value.trim();
    const color = document.getElementById('petColorHex')?.value.trim();
    
    if (!petName) {
      alert('Please enter a name for your pet!');
      return;
    }
    
    if (!ownerName) {
      alert('Please enter your name!');
      return;
    }
    
    this.adoptPet(petType, petName, ownerName, color);
  };
  
  function addSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const petSetting = document.createElement('div');
    petSetting.className = 'setting-item';
    petSetting.innerHTML = `
      <label class="setting-label">BunnyHero Virtual Pet</label>
      <div class="setting-toggle">
        <span>Enable Pet Widget</span>
        <div class="toggle-switch" id="bunnyHeroPetToggle">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(petSetting, visualizerSetting.nextSibling);
    
    const toggle = document.getElementById('bunnyHeroPetToggle');
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (savedState === 'true') {
      toggle.classList.add('active');
      createPetWidget();
    }
    
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      localStorage.setItem(STORAGE_KEY, isEnabled);
      
      if (isEnabled) {
        createPetWidget();
      } else {
        removePetWidget();
      }
    });
  }
  
  addSettingsToggle();
  
  console.log('BunnyHero Labs Pet Widget loaded!');
  console.log('Available pets:', Object.keys(window.LandrPetAPI.petTypes));
  console.log('API available at window.LandrPetAPI');
})();
