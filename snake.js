const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const baseSpeed = isMobile ? 200 : 150;
const speedDecrement = isMobile ? 3 : 2;
const minSpeed = isMobile ? 100 : 80;

let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameSpeed = baseSpeed;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;

let touchStartX = 0;
let touchStartY = 0;

highScoreEl.textContent = highScore;

function initGame() {
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  isPaused = false;
  isGameOver = false;
  gameSpeed = baseSpeed;
  scoreEl.textContent = score;
  gameOverEl.style.display = 'none';
  generateFood();
}

function generateFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  snake.forEach((segment, index) => {
    const gradient = ctx.createRadialGradient(
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      0,
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      gridSize / 2
    );
    
    if (index === 0) {
      gradient.addColorStop(0, '#00cc6a');
      gradient.addColorStop(1, '#00aa55');
    } else {
      gradient.addColorStop(0, '#00ff88');
      gradient.addColorStop(1, '#00cc6a');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2,
      4
    );
    ctx.fill();
  });

  const foodGradient = ctx.createRadialGradient(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    0,
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2
  );
  foodGradient.addColorStop(0, '#ff6b6b');
  foodGradient.addColorStop(1, '#ee5a5a');
  
  ctx.fillStyle = foodGradient;
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'eat') {
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'gameover') {
      oscillator.frequency.value = 220;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.log('Audio not supported');
  }
}

function update() {
  if (isPaused || isGameOver) return;

  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    endGame();
    return;
  }

  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    playSound('eat');
    score += 10;
    scoreEl.textContent = score;
    generateFood();
    
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
    
    if (gameSpeed > minSpeed) {
      gameSpeed -= speedDecrement;
      clearInterval(gameLoop);
      gameLoop = setInterval(step, gameSpeed);
    }
  } else {
    snake.pop();
  }
}

function step() {
  update();
  draw();
}

function endGame() {
  isGameOver = true;
  playSound('gameover');
  clearInterval(gameLoop);
  finalScoreEl.textContent = score;
  gameOverEl.style.display = 'block';
}

function restartGame() {
  initGame();
  clearInterval(gameLoop);
  gameLoop = setInterval(step, gameSpeed);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (isGameOver) {
      restartGame();
    } else {
      isPaused = !isPaused;
    }
    return;
  }

  if (isPaused || isGameOver) return;

  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 'KeyS':
      if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'KeyA':
      if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'KeyD':
      if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
      break;
  }
});

if (isMobile) {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!touchStartX || !touchStartY) return;
    if (isPaused || isGameOver) {
      touchStartX = 0;
      touchStartY = 0;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 30 && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
      } else if (diffX < -30 && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
      }
    } else {
      if (diffY > 30 && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
      } else if (diffY < -30 && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
      }
    }

    touchStartX = 0;
    touchStartY = 0;
  }, { passive: false });

  canvas.addEventListener('click', () => {
    if (isGameOver) {
      restartGame();
    } else {
      isPaused = !isPaused;
    }
  });
}

function hideRotateHint() {
  const hint = document.getElementById('rotateHint');
  if (hint) {
    hint.classList.remove('show');
  }
}

function checkOrientation() {
  const hint = document.getElementById('rotateHint');
  const isLandscape = window.innerWidth > window.innerHeight;
  
  if (hint) {
    if (isLandscape) {
      hint.classList.remove('show');
    } else {
      hint.classList.add('show');
    }
  }
}

if (isMobile) {
  checkOrientation();
  setInterval(checkOrientation, 300);
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', () => {
    setTimeout(checkOrientation, 100);
  });
}

initGame();
gameLoop = setInterval(step, gameSpeed);
