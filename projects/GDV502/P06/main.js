const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const seedInput = document.getElementById('seedInput');
const btnRestart = document.getElementById('btnRestart');
const scoreVal = document.getElementById('scoreVal');
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('finalScore');
const finalSeed = document.getElementById('finalSeed');
const btnTryAgain = document.getElementById('btnTryAgain');
const btnNewSeed = document.getElementById('btnNewSeed');

// Mulberry32 Seeded RNG
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4) >>> 0;
}

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

let rng;
function seedRNG(seedStr) {
  const seedNum = cyrb128(seedStr);
  rng = mulberry32(seedNum);
}

// Game State
let isPlaying = false;
let lastTime = 0;
let animFrame;
let score = 0;
let distance = 0;

let player = { x: 50, y: 200, w: 24, h: 24, speed: 250 };
let obstacles = [];
let pickups = [];

const keys = { w: false, s: false };
const SCROLL_SPEED = 180;
let spawnTimer = 0;

function startRun(seedStr) {
  seedInput.value = seedStr;
  seedRNG(seedStr);
  
  score = 0;
  distance = 0;
  scoreVal.textContent = "0";
  player.y = 200;
  obstacles = [];
  pickups = [];
  spawnTimer = 0;
  
  overlay.classList.add('hidden');
  isPlaying = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function generateChunk() {
  // Use seeded RNG to determine what spawns
  const roll = rng();
  
  if (roll < 0.6) {
    // Asteroid
    obstacles.push({
      x: canvas.width + 50,
      y: rng() * (canvas.height - 40),
      w: 30 + rng() * 40,
      h: 30 + rng() * 40,
      vy: (rng() - 0.5) * 50
    });
  } else if (roll < 0.9) {
    // Crystal
    pickups.push({
      x: canvas.width + 50,
      y: rng() * (canvas.height - 20),
      w: 16, h: 16
    });
  } else {
    // Moving Asteroid Trap
    obstacles.push({
      x: canvas.width + 50,
      y: rng() > 0.5 ? 0 : canvas.height - 40,
      w: 40, h: 40,
      vy: (rng() > 0.5 ? 1 : -1) * 100
    });
  }
}

// AABB Collision
function rectIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

function loop(time) {
  if (!isPlaying) return;
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
  // Player movement
  if (keys.w) player.y -= player.speed * dt;
  if (keys.s) player.y += player.speed * dt;
  
  player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
  
  // Spawning
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    generateChunk();
    spawnTimer = 0.5 + (rng() * 0.5); // Random interval between 0.5 and 1.0s
  }
  
  const currentSpeed = SCROLL_SPEED + (distance * 10);
  distance += dt;
  
  // Update entities
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= currentSpeed * dt;
    obs.y += obs.vy * dt;
    
    // bounce on edges
    if (obs.y < 0 || obs.y + obs.h > canvas.height) obs.vy *= -1;
    
    if (rectIntersect(player, obs)) {
      gameOver();
      return;
    }
    
    if (obs.x + obs.w < 0) obstacles.splice(i, 1);
  }
  
  for (let i = pickups.length - 1; i >= 0; i--) {
    let p = pickups[i];
    p.x -= currentSpeed * dt;
    
    if (rectIntersect(player, p)) {
      score += 100;
      scoreVal.textContent = score;
      pickups.splice(i, 1);
      continue;
    }
    
    if (p.x + p.w < 0) pickups.splice(i, 1);
  }
  
  // Base score from survival
  score += 10 * dt;
  scoreVal.textContent = Math.floor(score);
  
  draw();
  animFrame = requestAnimationFrame(loop);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Stars (fake parallax)
  ctx.fillStyle = '#334155';
  for (let i=0; i<5; i++) {
    // using purely time based for visual effect, not gameplay relevant
    let sx = (performance.now() / (10+i) + i*100) % canvas.width;
    ctx.fillRect(canvas.width - sx, (i*80)%canvas.height, 2, 2);
  }
  
  // Pickups
  ctx.fillStyle = 'var(--crystal)';
  ctx.shadowColor = 'var(--crystal)';
  ctx.shadowBlur = 10;
  pickups.forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p.x + p.w/2, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h/2);
    ctx.lineTo(p.x + p.w/2, p.y + p.h);
    ctx.lineTo(p.x, p.y + p.h/2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  
  // Obstacles
  ctx.fillStyle = '#ef4444';
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  });
  
  // Player
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h/2);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.fill();
}

function gameOver() {
  isPlaying = false;
  finalScore.textContent = Math.floor(score);
  finalSeed.textContent = seedInput.value;
  overlay.classList.remove('hidden');
}

// Input
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = true;
  if (k === 's' || k === 'arrowdown') keys.s = true;
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = false;
  if (k === 's' || k === 'arrowdown') keys.s = false;
});

// Buttons
btnRestart.addEventListener('click', () => {
  if (seedInput.value.trim() === '') seedInput.value = 'ALPHA';
  startRun(seedInput.value);
});

btnTryAgain.addEventListener('click', () => {
  startRun(seedInput.value);
});

btnNewSeed.addEventListener('click', () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randSeed = '';
  for(let i=0; i<6; i++) randSeed += chars.charAt(Math.floor(Math.random() * chars.length));
  startRun(randSeed);
});

// Init
startRun('ALPHA');
