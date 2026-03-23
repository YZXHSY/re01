const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameSpeed = 150;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;

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
  gameSpeed = 150;
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
    score += 10;
    scoreEl.textContent = score;
    generateFood();
    
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('snakeHighScore', highScore);
    }
    
    if (gameSpeed > 80) {
      gameSpeed -= 2;
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

initGame();
gameLoop = setInterval(step, gameSpeed);
