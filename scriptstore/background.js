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
      <input type="file" id="backgroundUpload" accept="image/*,video/*" style="display: none;">
      <button id="resetBackground" class="modal-btn secondary" style="padding: 10px 20px; font-size: 0.9rem; display: none;">Reset</button>
    </div>
    <div style="margin-top: 10px; opacity: 0.7; font-size: 0.85rem;">
      Supports images (JPG, PNG, GIF) and videos (MP4, WebM)
    </div>
  `;
  
  visualizerSetting.parentNode.insertBefore(backgroundSetting, visualizerSetting.nextSibling);
  
  const fileInput = document.getElementById('backgroundUpload');
  const resetBtn = document.getElementById('resetBackground');
  let videoElement = null;
  
  function loadSavedBackground() {
    const savedBg = localStorage.getItem('landrCustomBackground');
    const savedType = localStorage.getItem('landrCustomBackgroundType');
    
    if (savedBg && savedType) {
      applyBackground(savedBg, savedType);
      resetBtn.style.display = 'block';
    }
  }
  
  function applyBackground(dataUrl, type) {
    const body = document.body;
    
    // Remove any existing video element
    if (videoElement) {
      videoElement.remove();
      videoElement = null;
    }
    
    if (type === 'video') {
      // Create video element for background
      videoElement = document.createElement('video');
      videoElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: 0;
        pointer-events: none;
      `;
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.src = dataUrl;
      
      body.insertBefore(videoElement, body.firstChild);
      body.style.background = 'transparent';
      body.style.animation = 'none';
      
      // Ensure video plays
      videoElement.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else {
      // Apply image background
      body.style.background = `url('${dataUrl}') center center / cover fixed`;
      body.style.animation = 'none';
    }
  }
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification('Please upload an image or video file', 'error');
      } else {
        alert('Please upload an image or video file');
      }
      return;
    }
    
    // Check file size (limit to 50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification(
          `File too large. Max size: ${isVideo ? '50MB' : '10MB'}`, 
          'error'
        );
      } else {
        alert(`File too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
      }
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const dataUrl = event.target.result;
      const type = isVideo ? 'video' : 'image';
      
      localStorage.setItem('landrCustomBackground', dataUrl);
      localStorage.setItem('landrCustomBackgroundType', type);
      
      applyBackground(dataUrl, type);
      
      resetBtn.style.display = 'block';
      
      if (typeof LandrAPI !== 'undefined') {
        LandrAPI.showNotification(
          `${type === 'video' ? 'Video' : 'Image'} background uploaded successfully!`, 
          'success'
        );
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
    localStorage.removeItem('landrCustomBackgroundType');
    
    // Remove video element if exists
    if (videoElement) {
      videoElement.remove();
      videoElement = null;
    }
    
    const body = document.body;
    body.style.background = '';
    body.style.animation = 'gradientShift 15s ease infinite';
    
    resetBtn.style.display = 'none';
    
    if (typeof LandrAPI !== 'undefined') {
      LandrAPI.showNotification('Background reset to default', 'info');
    }
  });
  
  loadSavedBackground();
  
  console.log('Enhanced background upload feature (images & videos) loaded successfully!');
})();
