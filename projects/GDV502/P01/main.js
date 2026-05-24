const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const stateDesc = document.getElementById('stateDesc');
const uiMenu = document.getElementById('uiMenu');
const uiCountdown = document.getElementById('uiCountdown');
const uiPause = document.getElementById('uiPause');
const uiResults = document.getElementById('uiResults');

const btnStart = document.getElementById('btnStart');
const btnResume = document.getElementById('btnResume');
const btnQuit = document.getElementById('btnQuit');
const btnRestart = document.getElementById('btnRestart');
const btnMenu = document.getElementById('btnMenu');

const countdownText = document.getElementById('countdownText');
const finalTimeEl = document.getElementById('finalTime');

// --- Game State Machine ---
const STATES = {
  MENU: 'MENU',
  COUNTDOWN: 'COUNTDOWN',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  GAMEOVER: 'GAMEOVER'
};

let currentState = STATES.MENU;

// --- Game Entities & Variables ---
let lastTime = 0;
let animFrame;
let survivalTime = 0;
let countdownVal = 3;
let countdownTimer = 0;

let player = { x: 300, y: 200, r: 12 };
let enemies = [];
let spawnTimer = 0;

let mouseX = 300;
let mouseY = 200;

// --- State Transitions ---
function changeState(newState) {
  currentState = newState;
  stateDesc.textContent = `Current State: ${newState}`;
  
  // Hide all UIs
  uiMenu.classList.add('hidden');
  uiCountdown.classList.add('hidden');
  uiPause.classList.add('hidden');
  uiResults.classList.add('hidden');
  
  // Setup logic for new state
  switch(newState) {
    case STATES.MENU:
      uiMenu.classList.remove('hidden');
      canvas.style.cursor = 'default';
      drawBackground();
      break;
    case STATES.COUNTDOWN:
      uiCountdown.classList.remove('hidden');
      canvas.style.cursor = 'none';
      countdownVal = 3;
      countdownTimer = 1000;
      countdownText.textContent = countdownVal;
      initGame();
      break;
    case STATES.PLAY:
      canvas.style.cursor = 'none';
      break;
    case STATES.PAUSE:
      uiPause.classList.remove('hidden');
      canvas.style.cursor = 'default';
      break;
    case STATES.GAMEOVER:
      uiResults.classList.remove('hidden');
      canvas.style.cursor = 'default';
      finalTimeEl.textContent = survivalTime.toFixed(1);
      break;
  }
}

// --- Gameplay Logic ---
function initGame() {
  player.x = 300;
  player.y = 200;
  enemies = [];
  survivalTime = 0;
  spawnTimer = 0;
  drawGame();
}

function spawnEnemy() {
  // Spawn outside screen
  let ex, ey;
  if (Math.random() > 0.5) {
    ex = Math.random() > 0.5 ? -20 : canvas.width + 20;
    ey = Math.random() * canvas.height;
  } else {
    ex = Math.random() * canvas.width;
    ey = Math.random() > 0.5 ? -20 : canvas.height + 20;
  }
  
  // Angle towards player with some variance
  const angle = Math.atan2(player.y - ey, player.x - ex) + (Math.random() - 0.5) * 0.5;
  const speed = 100 + Math.random() * 100 + (survivalTime * 5); // speeds up over time
  
  enemies.push({
    x: ex, y: ey, w: 16, h: 16,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  });
}

function updatePlay(dt) {
  survivalTime += dt;
  spawnTimer -= dt * 1000;
  
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(200, 1000 - (survivalTime * 20)); // faster spawns
  }
  
  // Player movement (lerp towards mouse)
  player.x += (mouseX - player.x) * 10 * dt;
  player.y += (mouseY - player.y) * 10 * dt;
  
  // Enemy movement & collision
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    
    // Collision (Circle vs AABB approx)
    let closestX = Math.max(e.x, Math.min(player.x, e.x + e.w));
    let closestY = Math.max(e.y, Math.min(player.y, e.y + e.h));
    let dx = player.x - closestX;
    let dy = player.y - closestY;
    
    if (dx*dx + dy*dy < player.r * player.r) {
      // Hit!
      changeState(STATES.GAMEOVER);
      return;
    }
    
    // Remove if far off screen
    if (e.x < -100 || e.x > canvas.width + 100 || e.y < -100 || e.y > canvas.height + 100) {
      enemies.splice(i, 1);
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGame() {
  drawBackground();
  
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  for (let x=0; x<canvas.width; x+=40) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
  for (let y=0; y<canvas.height; y+=40) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
  ctx.stroke();
  
  // Enemies
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });
  
  // Player
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();
  
  ctx.shadowBlur = 0; // reset
  
  // HUD
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '16px Outfit';
  ctx.fillText(`Time: ${survivalTime.toFixed(1)}s`, 10, 20);
}

// --- Main Loop ---
function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
  if (currentState === STATES.COUNTDOWN) {
    countdownTimer -= dt * 1000;
    if (countdownTimer <= 0) {
      countdownVal--;
      if (countdownVal > 0) {
        countdownText.textContent = countdownVal;
        countdownTimer = 1000;
      } else {
        countdownText.textContent = "GO!";
        setTimeout(() => changeState(STATES.PLAY), 500);
        currentState = null; // wait
      }
    }
    drawGame();
  } else if (currentState === STATES.PLAY) {
    updatePlay(dt);
    if (currentState === STATES.PLAY) drawGame();
  }
  
  animFrame = requestAnimationFrame(loop);
}

// --- Input & Events ---
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (currentState === STATES.PLAY) changeState(STATES.PAUSE);
    else if (currentState === STATES.PAUSE) changeState(STATES.PLAY);
  }
});

btnStart.addEventListener('click', () => changeState(STATES.COUNTDOWN));
btnResume.addEventListener('click', () => changeState(STATES.PLAY));
btnQuit.addEventListener('click', () => changeState(STATES.MENU));
btnRestart.addEventListener('click', () => changeState(STATES.COUNTDOWN));
btnMenu.addEventListener('click', () => changeState(STATES.MENU));

// Init
changeState(STATES.MENU);
lastTime = performance.now();
requestAnimationFrame(loop);
