(function() {
  const settingsPanel = document.getElementById('settingsPanel');
  
  if (!settingsPanel) {
    console.error('Settings panel not found');
    return;
  }
  
  const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
  
  if (!visualizerSetting) {
    console.error('Could not find visualizer setting');
    return;
  }
  
  const backgroundSetting = document.createElement('div');
  backgroundSetting.className = 'setting-item';
  backgroundSetting.innerHTML = `
    <label class="setting-label">Custom Background</label>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <label for="backgroundUpload" class="file-label" style="margin: 0;">Upload Background</label>
      <input type="file" id="backgroundUpload" accept="image/*" style="display: none;">
      <button id="resetBackground" class="modal-btn secondary" style="padding: 10px 20px; font-size: 0.9rem; display: none;">Reset</button>
    </div>
  `;
  
  visualizerSetting.parentNode.insertBefore(backgroundSetting, visualizerSetting.nextSibling);
  
  const fileInput = document.getElementById('backgroundUpload');
  const resetBtn = document.getElementById('resetBackground');
  
  function loadSavedBackground() {
    const savedBg = localStorage.getItem('landrCustomBackground');
    if (savedBg) {
      applyBackground(savedBg);
      resetBtn.style.display = 'block';
    }
  }
  
  function applyBackground(dataUrl) {
    const body = document.body;
    body.style.background = `url('${dataUrl}') center center / cover fixed`;
    body.style.animation = 'none';
  }
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification('Please upload an image file', 'error');
      } else {
        alert('Please upload an image file');
      }
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataUrl = event.target.result;
      
      localStorage.setItem('landrCustomBackground', dataUrl);
      
      applyBackground(dataUrl);
      
      resetBtn.style.display = 'block';
      
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification('Background uploaded successfully!', 'success');
      }
    };
    
    reader.onerror = function() {
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification('Error reading file', 'error');
      } else {
        alert('Error reading file');
      }
    };
    
    reader.readAsDataURL(file);
  });
  
  resetBtn.addEventListener('click', function() {
    localStorage.removeItem('landrCustomBackground');
    
    const body = document.body;
    body.style.background = '';
    body.style.animation = 'gradientShift 15s ease infinite';
    
    resetBtn.style.display = 'none';
    
    if (typeof LandrAPI !== 'undefined') {
      LandrAPI.showNotification('Background reset to default', 'info');
    }
  });
  
  loadSavedBackground();
  
  console.log('Background upload feature loaded successfully!');
})();