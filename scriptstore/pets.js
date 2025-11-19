(function() {
  const STORAGE_KEY = 'landrInteractivePet';
  const PET_DATA_KEY = 'landrPetData';
  
  // Global Pet API for extensibility
  window.LandrPetAPI = window.LandrPetAPI || {
    pets: {},
    currentPet: null,
    
    registerPet: function(id, petConfig) {
      this.pets[id] = petConfig;
      console.log(`Pet registered: ${id}`);
    },
    
    getPet: function(id) {
      return this.pets[id];
    },
    
    getCurrentPet: function() {
      return this.currentPet;
    },
    
    feedPet: function() {
      if (this.currentPet) {
        this.currentPet.feed();
      }
    },
    
    petPet: function() {
      if (this.currentPet) {
        this.currentPet.pet();
      }
    },
    
    playWithPet: function() {
      if (this.currentPet) {
        this.currentPet.play();
      }
    },
    
    customAction: function(actionName, ...args) {
      if (this.currentPet && this.currentPet.customActions && this.currentPet.customActions[actionName]) {
        this.currentPet.customActions[actionName](...args);
      }
    }
  };
  
  // Base Pet Class
  class Pet {
    constructor(type, container) {
      this.type = type;
      this.container = container;
      this.element = null;
      this.x = 100;
      this.y = 100;
      this.targetX = null;
      this.targetY = null;
      this.speed = 2;
      this.animationFrame = null;
      this.isMoving = false;
      this.direction = 'right';
      this.stats = {
        hunger: 100,
        happiness: 100,
        energy: 100
      };
      this.lastUpdate = Date.now();
      this.customActions = {};
      
      this.loadStats();
      this.create();
      this.startAutoMovement();
      this.startStatDecay();
    }
    
    create() {
      this.element = document.createElement('div');
      this.element.style.cssText = `
        position: fixed;
        width: 60px;
        height: 60px;
        cursor: pointer;
        user-select: none;
        z-index: 9998;
        transition: transform 0.3s ease;
        pointer-events: all;
      `;
      this.element.innerHTML = this.getSprite();
      this.element.addEventListener('click', () => this.onClick());
      this.container.appendChild(this.element);
      this.updatePosition();
    }
    
    getSprite() {
      // Override in subclasses
      return '🐾';
    }
    
    onClick() {
      this.pet();
    }
    
    updatePosition() {
      if (this.element) {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.transform = `scaleX(${this.direction === 'left' ? -1 : 1})`;
      }
    }
    
    moveTo(targetX, targetY) {
      this.targetX = targetX;
      this.targetY = targetY;
      this.isMoving = true;
    }
    
    update() {
      if (this.isMoving && this.targetX !== null && this.targetY !== null) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
          this.x = this.targetX;
          this.y = this.targetY;
          this.isMoving = false;
          this.targetX = null;
          this.targetY = null;
        } else {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
          this.direction = dx > 0 ? 'right' : 'left';
        }
        
        this.updatePosition();
      }
      
      this.animationFrame = requestAnimationFrame(() => this.update());
    }
    
    startAutoMovement() {
      this.update();
      
      setInterval(() => {
        if (!this.isMoving && this.stats.energy > 20) {
          const margin = 100;
          const maxX = window.innerWidth - 60 - margin;
          const maxY = window.innerHeight - 60 - margin;
          const newX = Math.random() * maxX + margin;
          const newY = Math.random() * maxY + margin;
          this.moveTo(newX, newY);
        }
      }, 5000);
    }
    
    startStatDecay() {
      setInterval(() => {
        const now = Date.now();
        const elapsed = (now - this.lastUpdate) / 1000 / 60; // minutes
        
        this.stats.hunger = Math.max(0, this.stats.hunger - elapsed * 0.5);
        this.stats.happiness = Math.max(0, this.stats.happiness - elapsed * 0.3);
        this.stats.energy = Math.max(0, this.stats.energy - elapsed * 0.2);
        
        this.lastUpdate = now;
        this.saveStats();
        this.updateStatsDisplay();
        
        // Auto-sleep if energy is low
        if (this.stats.energy < 20) {
          this.speed = 0.5;
        } else {
          this.speed = 2;
        }
      }, 60000); // Every minute
    }
    
    feed() {
      this.stats.hunger = Math.min(100, this.stats.hunger + 30);
      this.stats.happiness = Math.min(100, this.stats.happiness + 10);
      this.showEmoji('🍖');
      this.saveStats();
      this.updateStatsDisplay();
    }
    
    pet() {
      this.stats.happiness = Math.min(100, this.stats.happiness + 20);
      this.showEmoji('❤️');
      this.saveStats();
      this.updateStatsDisplay();
    }
    
    play() {
      if (this.stats.energy < 20) {
        this.showEmoji('😴');
        return;
      }
      this.stats.happiness = Math.min(100, this.stats.happiness + 25);
      this.stats.energy = Math.max(0, this.stats.energy - 15);
      this.showEmoji('⚽');
      
      // Make pet jump around
      const jumps = 5;
      for (let i = 0; i < jumps; i++) {
        setTimeout(() => {
          const jumpX = this.x + (Math.random() - 0.5) * 100;
          const jumpY = this.y + (Math.random() - 0.5) * 100;
          this.moveTo(
            Math.max(100, Math.min(window.innerWidth - 160, jumpX)),
            Math.max(100, Math.min(window.innerHeight - 160, jumpY))
          );
        }, i * 500);
      }
      
      this.saveStats();
      this.updateStatsDisplay();
    }
    
    showEmoji(emoji) {
      const emojiEl = document.createElement('div');
      emojiEl.textContent = emoji;
      emojiEl.style.cssText = `
        position: fixed;
        left: ${this.x + 30}px;
        top: ${this.y - 20}px;
        font-size: 2rem;
        z-index: 9999;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
      `;
      
      document.body.appendChild(emojiEl);
      setTimeout(() => emojiEl.remove(), 1000);
    }
    
    saveStats() {
      const data = {
        type: this.type,
        stats: this.stats,
        lastUpdate: this.lastUpdate
      };
      localStorage.setItem(PET_DATA_KEY, JSON.stringify(data));
    }
    
    loadStats() {
      const saved = localStorage.getItem(PET_DATA_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.type === this.type) {
            this.stats = data.stats;
            this.lastUpdate = data.lastUpdate;
          }
        } catch (e) {
          console.error('Error loading pet stats:', e);
        }
      }
    }
    
    updateStatsDisplay() {
      const widget = document.getElementById('petWidget');
      if (!widget) return;
      
      const hungerBar = widget.querySelector('.hunger-bar');
      const happinessBar = widget.querySelector('.happiness-bar');
      const energyBar = widget.querySelector('.energy-bar');
      
      if (hungerBar) hungerBar.style.width = this.stats.hunger + '%';
      if (happinessBar) happinessBar.style.width = this.stats.happiness + '%';
      if (energyBar) energyBar.style.width = this.stats.energy + '%';
    }
    
    destroy() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      if (this.element) {
        this.element.remove();
      }
    }
  }
  
  // Cat Pet
  class CatPet extends Pet {
    constructor(container) {
      super('cat', container);
      this.moodStates = ['😺', '😸', '😹', '😻', '😼'];
    }
    
    getSprite() {
      return `<div style="font-size: 3rem; line-height: 1;">🐱</div>`;
    }
    
    onClick() {
      // Cats are moody
      if (Math.random() > 0.7) {
        this.showEmoji('😾');
        this.stats.happiness = Math.max(0, this.stats.happiness - 5);
      } else {
        this.pet();
      }
      this.updateStatsDisplay();
    }
  }
  
  // Dog Pet
  class DogPet extends Pet {
    constructor(container) {
      super('dog', container);
      this.speed = 2.5; // Dogs are faster
    }
    
    getSprite() {
      return `<div style="font-size: 3rem; line-height: 1;">🐶</div>`;
    }
    
    onClick() {
      // Dogs always love attention
      this.pet();
      this.stats.happiness = Math.min(100, this.stats.happiness + 5);
      this.showEmoji('🦴');
      this.updateStatsDisplay();
    }
    
    play() {
      // Dogs love playing more
      if (this.stats.energy < 20) {
        this.showEmoji('😴');
        return;
      }
      this.stats.happiness = Math.min(100, this.stats.happiness + 35);
      this.stats.energy = Math.max(0, this.stats.energy - 20);
      this.showEmoji('🎾');
      
      const jumps = 8;
      for (let i = 0; i < jumps; i++) {
        setTimeout(() => {
          const jumpX = this.x + (Math.random() - 0.5) * 150;
          const jumpY = this.y + (Math.random() - 0.5) * 150;
          this.moveTo(
            Math.max(100, Math.min(window.innerWidth - 160, jumpX)),
            Math.max(100, Math.min(window.innerHeight - 160, jumpY))
          );
        }, i * 400);
      }
      
      this.saveStats();
      this.updateStatsDisplay();
    }
  }
  
  // Slime Pet
  class SlimePet extends Pet {
    constructor(container) {
      super('slime', container);
      this.speed = 1.5;
      this.bounceHeight = 0;
      this.startBouncing();
    }
    
    getSprite() {
      return `<div style="font-size: 3rem; line-height: 1;">🟢</div>`;
    }
    
    startBouncing() {
      setInterval(() => {
        this.bounceHeight = Math.sin(Date.now() / 200) * 10;
        if (this.element) {
          this.element.style.transform = `
            scaleX(${this.direction === 'left' ? -1 : 1}) 
            translateY(${this.bounceHeight}px)
          `;
        }
      }, 50);
    }
    
    onClick() {
      this.pet();
      // Slime jiggles
      this.element.style.animation = 'jiggle 0.5s ease';
      setTimeout(() => {
        if (this.element) this.element.style.animation = '';
      }, 500);
    }
    
    feed() {
      // Slime grows slightly when fed
      super.feed();
      this.element.style.transform += ' scale(1.1)';
      setTimeout(() => {
        if (this.element) {
          this.element.style.transform = `scaleX(${this.direction === 'left' ? -1 : 1})`;
        }
      }, 1000);
    }
  }
  
  // Register default pets
  window.LandrPetAPI.registerPet('cat', CatPet);
  window.LandrPetAPI.registerPet('dog', DogPet);
  window.LandrPetAPI.registerPet('slime', SlimePet);
  
  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUp {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-50px);
      }
    }
    
    @keyframes jiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }
    
    .stat-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .stat-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }
    
    .hunger-bar { background: linear-gradient(90deg, #ef4444, #f97316); }
    .happiness-bar { background: linear-gradient(90deg, #ec4899, #f59e0b); }
    .energy-bar { background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
  `;
  document.head.appendChild(style);
  
  function createPetWidget() {
    const contentGrid = document.querySelector('.content-grid');
    if (!contentGrid || document.getElementById('petWidget')) return;
    
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'petWidget';
    widget.innerHTML = `
      <h2>🐾 Virtual Pet</h2>
      <div id="petSelector" style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
        <button class="add-btn" onclick="window.LandrPetAPI._selectPet('cat')" style="flex: 1; min-width: 80px;">🐱 Cat</button>
        <button class="add-btn" onclick="window.LandrPetAPI._selectPet('dog')" style="flex: 1; min-width: 80px;">🐶 Dog</button>
        <button class="add-btn" onclick="window.LandrPetAPI._selectPet('slime')" style="flex: 1; min-width: 80px;">🟢 Slime</button>
      </div>
      <div id="petStats" style="display: none;">
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 0.9rem;">🍖 Hunger</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill hunger-bar" style="width: 100%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 0.9rem;">😊 Happiness</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill happiness-bar" style="width: 100%;"></div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 0.9rem;">⚡ Energy</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill energy-bar" style="width: 100%;"></div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="add-btn" onclick="window.LandrPetAPI.feedPet()" style="flex: 1; min-width: 70px;">🍖 Feed</button>
          <button class="add-btn" onclick="window.LandrPetAPI.petPet()" style="flex: 1; min-width: 70px;">❤️ Pet</button>
          <button class="add-btn" onclick="window.LandrPetAPI.playWithPet()" style="flex: 1; min-width: 70px;">⚽ Play</button>
        </div>
        <button class="modal-btn secondary" onclick="window.LandrPetAPI._removePet()" style="width: 100%; margin-top: 10px;">Remove Pet</button>
      </div>
    `;
    
    contentGrid.appendChild(widget);
  }
  
  function removePetWidget() {
    const widget = document.getElementById('petWidget');
    if (widget) widget.remove();
  }
  
  window.LandrPetAPI._selectPet = function(petType) {
    if (this.currentPet) {
      this.currentPet.destroy();
    }
    
    const PetClass = this.pets[petType];
    if (PetClass) {
      this.currentPet = new PetClass(document.body);
      
      const selector = document.getElementById('petSelector');
      const stats = document.getElementById('petStats');
      if (selector) selector.style.display = 'none';
      if (stats) stats.style.display = 'block';
      
      this.currentPet.updateStatsDisplay();
      localStorage.setItem(STORAGE_KEY + '_type', petType);
    }
  };
  
  window.LandrPetAPI._removePet = function() {
    if (this.currentPet) {
      this.currentPet.destroy();
      this.currentPet = null;
    }
    
    const selector = document.getElementById('petSelector');
    const stats = document.getElementById('petStats');
    if (selector) selector.style.display = 'flex';
    if (stats) stats.style.display = 'none';
    
    localStorage.removeItem(STORAGE_KEY + '_type');
    localStorage.removeItem(PET_DATA_KEY);
  };
  
  function addSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const petSetting = document.createElement('div');
    petSetting.className = 'setting-item';
    petSetting.innerHTML = `
      <label class="setting-label">Virtual Pet</label>
      <div class="setting-toggle">
        <span>Enable Pet Widget</span>
        <div class="toggle-switch" id="petToggle">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(petSetting, visualizerSetting.nextSibling);
    
    const toggle = document.getElementById('petToggle');
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    const savedPetType = localStorage.getItem(STORAGE_KEY + '_type');
    
    if (savedState === 'true') {
      toggle.classList.add('active');
      createPetWidget();
      
      if (savedPetType) {
        setTimeout(() => {
          window.LandrPetAPI._selectPet(savedPetType);
        }, 100);
      }
    }
    
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      localStorage.setItem(STORAGE_KEY, isEnabled);
      
      if (isEnabled) {
        createPetWidget();
      } else {
        window.LandrPetAPI._removePet();
        removePetWidget();
      }
    });
  }
  
  addSettingsToggle();
  
  console.log('Interactive Pet Widget loaded! API available at window.LandrPetAPI');
  console.log('Available pets:', Object.keys(window.LandrPetAPI.pets));
})();
