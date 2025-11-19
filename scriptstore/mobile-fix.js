(function() {
  const STORAGE_KEY = 'landrMobileOptimization';
  
  const optimizationSettings = {
    off: {
      name: 'Off',
      apply: function() {
        // Remove all optimizations
        document.body.style.removeProperty('-webkit-overflow-scrolling');
        document.body.style.removeProperty('transform');
        
        const particles = document.getElementById('particles');
        if (particles) particles.style.display = '';
        
        // Restore original animations
        restoreAnimations();
      }
    },
    light: {
      name: 'Light Optimization',
      apply: function() {
        // Smooth scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Reduce particles on mobile
        if (window.innerWidth <= 768) {
          const particles = document.getElementById('particles');
          if (particles) {
            const allParticles = particles.querySelectorAll('.particle');
            allParticles.forEach((p, i) => {
              if (i % 2 === 0) p.style.display = 'none';
            });
          }
        }
        
        // Optimize animations
        optimizeAnimations('light');
      }
    },
    medium: {
      name: 'Medium Optimization',
      apply: function() {
        // Enable hardware acceleration
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.transform = 'translate3d(0,0,0)';
        
        // Significantly reduce particles
        if (window.innerWidth <= 768) {
          const particles = document.getElementById('particles');
          if (particles) {
            const allParticles = particles.querySelectorAll('.particle');
            allParticles.forEach((p, i) => {
              if (i % 3 !== 0) p.style.display = 'none';
            });
          }
        }
        
        // Optimize animations
        optimizeAnimations('medium');
        
        // Reduce backdrop blur
        reduceBlur('medium');
      }
    },
    aggressive: {
      name: 'Aggressive Optimization',
      apply: function() {
        // Maximum hardware acceleration
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.transform = 'translate3d(0,0,0)';
        
        // Hide particles completely on mobile
        const particles = document.getElementById('particles');
        if (particles && window.innerWidth <= 768) {
          particles.style.display = 'none';
        }
        
        // Disable most animations
        optimizeAnimations('aggressive');
        
        // Remove backdrop blur
        reduceBlur('aggressive');
        
        // Simplify background
        if (window.innerWidth <= 768) {
          document.body.style.backgroundSize = '200% 200%';
        }
        
        // Add will-change hints
        addWillChangeHints();
      }
    }
  };
  
  function optimizeAnimations(level) {
    const style = document.createElement('style');
    style.id = 'mobile-optimization-style';
    
    // Remove existing optimization style
    const existing = document.getElementById('mobile-optimization-style');
    if (existing) existing.remove();
    
    let css = '';
    
    if (level === 'light') {
      css = `
        @media (max-width: 768px) {
          .particle {
            animation-duration: 20s !important;
          }
          body {
            animation-duration: 20s !important;
          }
        }
      `;
    } else if (level === 'medium') {
      css = `
        @media (max-width: 768px) {
          .particle {
            animation: none !important;
          }
          body {
            animation-duration: 25s !important;
          }
          .link-card:hover,
          .widget:hover,
          .control-btn:hover {
            transform: none !important;
          }
        }
      `;
    } else if (level === 'aggressive') {
      css = `
        @media (max-width: 768px) {
          * {
            animation: none !important;
            transition: none !important;
          }
          body {
            background: linear-gradient(-45deg, var(--bg-gradient-1), var(--bg-gradient-2), var(--bg-gradient-3), var(--bg-gradient-4)) !important;
            background-size: 200% 200% !important;
            animation: none !important;
          }
          .link-card:hover,
          .widget:hover,
          .control-btn:hover,
          .add-btn:hover,
          .todo-btn:hover {
            transform: none !important;
          }
          .modal-content {
            animation: none !important;
          }
          h1 {
            animation: none !important;
          }
          .clock,
          .search-container,
          .quick-links,
          .content-grid {
            animation: none !important;
          }
        }
      `;
    }
    
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  function reduceBlur(level) {
    const style = document.createElement('style');
    style.id = 'blur-optimization-style';
    
    const existing = document.getElementById('blur-optimization-style');
    if (existing) existing.remove();
    
    let css = '';
    
    if (level === 'medium') {
      css = `
        @media (max-width: 768px) {
          input[type="text"],
          .link-card,
          .widget,
          .control-btn,
          .settings-panel,
          .modal-content {
            backdrop-filter: blur(5px) !important;
            -webkit-backdrop-filter: blur(5px) !important;
          }
        }
      `;
    } else if (level === 'aggressive') {
      css = `
        @media (max-width: 768px) {
          input[type="text"],
          .link-card,
          .widget,
          .control-btn,
          .settings-panel,
          .modal-content {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: var(--card-bg) !important;
          }
        }
      `;
    }
    
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  function addWillChangeHints() {
    const style = document.createElement('style');
    style.id = 'will-change-style';
    
    const existing = document.getElementById('will-change-style');
    if (existing) existing.remove();
    
    style.textContent = `
      @media (max-width: 768px) {
        body {
          will-change: scroll-position;
        }
        .link-card,
        .widget,
        .control-btn {
          will-change: transform;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function restoreAnimations() {
    const optimizationStyle = document.getElementById('mobile-optimization-style');
    const blurStyle = document.getElementById('blur-optimization-style');
    const willChangeStyle = document.getElementById('will-change-style');
    
    if (optimizationStyle) optimizationStyle.remove();
    if (blurStyle) blurStyle.remove();
    if (willChangeStyle) willChangeStyle.remove();
    
    // Restore particles
    const particles = document.getElementById('particles');
    if (particles) {
      particles.style.display = '';
      const allParticles = particles.querySelectorAll('.particle');
      allParticles.forEach(p => p.style.display = '');
    }
    
    // Restore background
    document.body.style.removeProperty('background-size');
  }
  
  function applyOptimization(level) {
    // First remove all optimizations
    Object.keys(optimizationSettings).forEach(key => {
      if (key === 'off') {
          optimizationSettings[key].apply();
      }
    });
    
    // Then apply the selected one
    if (level && level !== 'off' && optimizationSettings[level]) {
      optimizationSettings[level].apply();
    }
    
    // Save preference
    localStorage.setItem(STORAGE_KEY, level);
  }
  
  function addSettingsOption() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const mobileSetting = document.createElement('div');
    mobileSetting.className = 'setting-item';
    mobileSetting.innerHTML = `
      <label class="setting-label">Mobile Optimization</label>
      <select class="ios-select" id="mobileOptimizationSelect">
        <option value="off">Off</option>
        <option value="light">Light Optimization</option>
        <option value="medium">Medium Optimization</option>
        <option value="aggressive">Aggressive Optimization</option>
      </select>
      <div style="margin-top: 8px; opacity: 0.7; font-size: 0.85rem;">
        Reduces animations and effects to improve performance on mobile devices
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(mobileSetting, visualizerSetting.nextSibling);
    
    const select = document.getElementById('mobileOptimizationSelect');
    
    // Load saved setting
    const savedLevel = localStorage.getItem(STORAGE_KEY) || 'off';
    select.value = savedLevel;
    
    // Apply on load if mobile
    if (window.innerWidth <= 768 && savedLevel !== 'off') {
      applyOptimization(savedLevel);
    }
    
    // Listen for changes
    select.addEventListener('change', function() {
      applyOptimization(this.value);
    });
  }
  
  // Handle orientation changes
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      const savedLevel = localStorage.getItem(STORAGE_KEY) || 'off';
      if (savedLevel !== 'off') {
        applyOptimization(savedLevel);
      }
    }, 250);
  });
  
  // Prevent scroll bounce on iOS
  if (window.innerWidth <= 768) {
    document.addEventListener('touchmove', function(e) {
      if (e.target.closest('.settings-panel') || 
          e.target.closest('.modal') ||
          e.target.closest('.todo-list')) {
        return;
      }
    }, { passive: true });
  }
  
  // Initialize
  addSettingsOption();
  
  console.log('Mobile optimization script loaded successfully!');
})();
