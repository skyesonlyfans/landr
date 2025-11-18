(function() {
  const STORAGE_KEY = 'landrFlappyBirdEnabled';
  
  function createFlappyBirdWidget() {
    const contentGrid = document.querySelector('.content-grid');
    if (!contentGrid) return;
    
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.id = 'flappyBirdWidget';
    widget.innerHTML = `
      <h2>Flappy Bird</h2>
      <div style="position: relative; margin-bottom: 15px;">
        <canvas id="flappyCanvas" width="350" height="400" style="width: 100%; max-width: 350px; border-radius: 15px; background: linear-gradient(to bottom, #4ec0ca 0%, #87ceeb 100%); display: block; margin: 0 auto; cursor: pointer;"></canvas>
        <div id="flappyScore" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-size: 2.5rem; font-weight: 800; color: white; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); font-family: 'Poppins', sans-serif; pointer-events: none;">0</div>
        <div id="flappyGameOver" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(0,0,0,0.8); padding: 30px; border-radius: 20px; pointer-events: none;">
          <div style="font-size: 2rem; font-weight: 800; color: #ff6b6b; margin-bottom: 10px;">Game Over!</div>
          <div style="font-size: 1.2rem; color: white; margin-bottom: 5px;">Score: <span id="finalScore">0</span></div>
          <div style="font-size: 1rem; color: #ffd93d; margin-top: 10px;">Click to restart</div>
        </div>
      </div>
      <div style="text-align: center; opacity: 0.7; font-size: 0.9rem;">Click or press Space to flap</div>
    `;
    
    contentGrid.appendChild(widget);
    
    const canvas = document.getElementById('flappyCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('flappyScore');
    const gameOverDisplay = document.getElementById('flappyGameOver');
    const finalScoreDisplay = document.getElementById('finalScore');
    
    let bird = { x: 50, y: 200, velocity: 0, radius: 15 };
    let pipes = [];
    let score = 0;
    let gameRunning = false;
    let gameOver = false;
    let frameCount = 0;
    
    const gravity = 0.5;
    const jumpStrength = -8;
    const pipeWidth = 60;
    const pipeGap = 150;
    const pipeSpeed = 2;
    
    function drawBird() {
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bird.x + 5, bird.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(bird.x + 5, bird.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(bird.x + bird.radius, bird.y);
      ctx.lineTo(bird.x + bird.radius + 10, bird.y - 3);
      ctx.lineTo(bird.x + bird.radius + 10, bird.y + 3);
      ctx.closePath();
      ctx.fill();
    }
    
    function drawPipe(pipe) {
      ctx.fillStyle = '#7ec850';
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
      ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
      
      ctx.fillStyle = '#68b53e';
      ctx.fillRect(pipe.x, pipe.top - 20, pipeWidth, 20);
      ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, 20);
      
      ctx.strokeStyle = '#5a9e34';
      ctx.lineWidth = 3;
      ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
      ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    }
    
    function createPipe() {
      const minTop = 50;
      const maxTop = canvas.height - pipeGap - 50;
      const top = Math.random() * (maxTop - minTop) + minTop;
      const bottom = canvas.height - top - pipeGap;
      
      pipes.push({
        x: canvas.width,
        top: top,
        bottom: bottom,
        scored: false
      });
    }
    
    function updatePipes() {
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        
        if (pipes[i].x + pipeWidth < 0) {
          pipes.splice(i, 1);
        }
        
        if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
          score++;
          scoreDisplay.textContent = score;
          pipes[i].scored = true;
        }
      }
    }
    
    function checkCollision() {
      if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
        return true;
      }
      
      for (let pipe of pipes) {
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipeWidth) {
          if (bird.y - bird.radius < pipe.top || bird.y + bird.radius > canvas.height - pipe.bottom) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    function jump() {
      if (!gameRunning && !gameOver) {
        gameRunning = true;
        createPipe();
      }
      
      if (gameRunning && !gameOver) {
        bird.velocity = jumpStrength;
      }
      
      if (gameOver) {
        resetGame();
      }
    }
    
    function resetGame() {
      bird = { x: 50, y: 200, velocity: 0, radius: 15 };
      pipes = [];
      score = 0;
      gameRunning = false;
      gameOver = false;
      frameCount = 0;
      scoreDisplay.textContent = '0';
      gameOverDisplay.style.display = 'none';
    }
    
    function endGame() {
      gameOver = true;
      gameRunning = false;
      finalScoreDisplay.textContent = score;
      gameOverDisplay.style.display = 'block';
    }
    
    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#4ec0ca');
      gradient.addColorStop(1, '#87ceeb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (gameRunning && !gameOver) {
        bird.velocity += gravity;
        bird.y += bird.velocity;
        
        frameCount++;
        if (frameCount % 90 === 0) {
          createPipe();
        }
        
        updatePipes();
        
        if (checkCollision()) {
          endGame();
        }
      }
      
      for (let pipe of pipes) {
        drawPipe(pipe);
      }
      
      drawBird();
      
      if (!gameRunning && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2);
      }
      
      requestAnimationFrame(gameLoop);
    }
    
    canvas.addEventListener('click', jump);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.getElementById('flappyBirdWidget')) {
        e.preventDefault();
        jump();
      }
    });
    
    gameLoop();
  }
  
  function removeFlappyBirdWidget() {
    const widget = document.getElementById('flappyBirdWidget');
    if (widget) {
      widget.remove();
    }
  }
  
  function addSettingsToggle() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const visualizerSetting = settingsPanel.querySelector('.setting-item:has(#visualizerWidgetToggle)');
    if (!visualizerSetting) return;
    
    const flappyBirdSetting = document.createElement('div');
    flappyBirdSetting.className = 'setting-item';
    flappyBirdSetting.innerHTML = `
      <label class="setting-label">Flappy Bird Game</label>
      <div class="setting-toggle">
        <span>Enable Flappy Bird Widget</span>
        <div class="toggle-switch" id="flappyBirdToggle">
          <div class="toggle-slider"></div>
        </div>
      </div>
    `;
    
    visualizerSetting.parentNode.insertBefore(flappyBirdSetting, visualizerSetting.nextSibling);
    
    const toggle = document.getElementById('flappyBirdToggle');
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState === 'true') {
      toggle.classList.add('active');
      createFlappyBirdWidget();
    }
    
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      localStorage.setItem(STORAGE_KEY, isEnabled);
      
      if (isEnabled) {
        createFlappyBirdWidget();
        if (typeof LandrAPI !== 'undefined') {
          LandrAPI.showNotification('Flappy Bird enabled!', 'success');
        }
      } else {
        removeFlappyBirdWidget();
        if (typeof LandrAPI !== 'undefined') {
          LandrAPI.showNotification('Flappy Bird disabled', 'info');
        }
      }
    });
  }
  
  addSettingsToggle();
  
  if (typeof LandrAPI !== 'undefined') {
    LandrAPI.showNotification('Flappy Bird widget loaded!', 'success');
  }
  
  console.log('Flappy Bird widget script loaded successfully!');
})();