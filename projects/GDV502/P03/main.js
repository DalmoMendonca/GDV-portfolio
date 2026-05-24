const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const waveDesc = document.getElementById('waveDesc');
const healthVal = document.getElementById('healthVal');
const waveVal = document.getElementById('waveVal');
const enemiesVal = document.getElementById('enemiesVal');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const startBtn = document.getElementById('startBtn');

let wavesData = [];
let currentWaveIndex = 0;
let health = 100;
let isPlaying = false;
let lastTime = 0;

let player = { x: 300, y: 200, r: 16 };
let mouseX = 300, mouseY = 100;
let projectiles = [];
let enemies = [];
let spawnQueue = [];
let spawnTimer = 0;
let shootTimer = 0;

const ENEMY_TYPES = {
  basic: { color: '#ef4444', speed: 40, hp: 10, dmg: 10, r: 12 },
  fast: { color: '#fbbf24', speed: 90, hp: 5, dmg: 5, r: 8 },
  tank: { color: '#8b5cf6', speed: 20, hp: 40, dmg: 25, r: 20 }
};

async function loadData() {
  try {
    const res = await fetch('./waves.json');
    const data = await res.json();
    wavesData = data.waves;
    waveDesc.textContent = "Data loaded. Ready.";
    startBtn.disabled = false;
  } catch (err) {
    waveDesc.textContent = "Error loading waves.json!";
    console.error(err);
  }
}

function startWave() {
  if (currentWaveIndex >= wavesData.length) {
    winGame();
    return;
  }
  
  const wave = wavesData[currentWaveIndex];
  waveDesc.textContent = `Wave ${wave.id}: ${wave.name}`;
  waveVal.textContent = `${wave.id} / ${wavesData.length}`;
  
  // Build spawn queue
  spawnQueue = [];
  wave.enemies.forEach(group => {
    for (let i = 0; i < group.count; i++) {
      spawnQueue.push(group.type);
    }
  });
  
  // Shuffle queue for mixed spawns
  spawnQueue.sort(() => Math.random() - 0.5);
  
  spawnTimer = wave.spawnInterval;
  
  overlay.classList.add('hidden');
  isPlaying = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
  if (health <= 0 || currentWaveIndex >= wavesData.length) {
    health = 100;
    currentWaveIndex = 0;
    enemies = [];
    projectiles = [];
  }
  startWave();
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

function spawnEnemy(type) {
  const stats = ENEMY_TYPES[type];
  // Spawn around edges
  let x, y;
  if (Math.random() > 0.5) {
    x = Math.random() > 0.5 ? -20 : canvas.width + 20;
    y = Math.random() * canvas.height;
  } else {
    x = Math.random() * canvas.width;
    y = Math.random() > 0.5 ? -20 : canvas.height + 20;
  }
  enemies.push({ ...stats, x, y, maxHp: stats.hp });
}

function loop(time) {
  if (!isPlaying) return;
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
  // Check wave end
  if (spawnQueue.length === 0 && enemies.length === 0) {
    currentWaveIndex++;
    isPlaying = false;
    if (currentWaveIndex >= wavesData.length) {
      winGame();
    } else {
      overlayTitle.textContent = "Wave Cleared!";
      overlayMsg.textContent = "Prepare for the next wave.";
      startBtn.textContent = "Start Next Wave";
      overlay.classList.remove('hidden');
    }
    return;
  }

  // Spawning
  if (spawnQueue.length > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const type = spawnQueue.shift();
      spawnEnemy(type);
      spawnTimer = wavesData[currentWaveIndex].spawnInterval;
    }
  }

  // Shooting (auto fire)
  shootTimer -= dt;
  if (shootTimer <= 0) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    projectiles.push({
      x: player.x, y: player.y,
      vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
      r: 4
    });
    shootTimer = 0.2; // fire rate
  }

  // Update Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
      projectiles.splice(i, 1);
    }
  }

  // Update Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    // Check collision with player
    const distSq = (e.x - player.x)**2 + (e.y - player.y)**2;
    if (distSq < (e.r + player.r)**2) {
      health -= e.dmg;
      enemies.splice(i, 1);
      healthVal.textContent = Math.max(0, health);
      if (health <= 0) {
        loseGame();
        return;
      }
      continue;
    }

    // Check collision with projectiles
    for (let j = projectiles.length - 1; j >= 0; j--) {
      let p = projectiles[j];
      const pDistSq = (e.x - p.x)**2 + (e.y - p.y)**2;
      if (pDistSq < (e.r + p.r)**2) {
        e.hp -= 5;
        projectiles.splice(j, 1);
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          break; // enemy dead
        }
      }
    }
  }

  enemiesVal.textContent = enemies.length + spawnQueue.length;

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();
  
  // Aim Line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(mouseX, mouseY);
  ctx.stroke();

  // Projectiles
  ctx.fillStyle = '#fff';
  projectiles.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
    // hp bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(e.x - e.r, e.y - e.r - 6, e.r*2, 4);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(e.x - e.r, e.y - e.r - 6, (e.hp/e.maxHp)*e.r*2, 4);
  });
}

function winGame() {
  isPlaying = false;
  overlayTitle.textContent = "Victory!";
  overlayTitle.style.color = "var(--health)";
  overlayMsg.textContent = "You survived all waves defined in waves.json.";
  startBtn.textContent = "Play Again";
  overlay.classList.remove('hidden');
}

function loseGame() {
  isPlaying = false;
  overlayTitle.textContent = "Defeat!";
  overlayTitle.style.color = "#ef4444";
  overlayMsg.textContent = "The core was destroyed.";
  startBtn.textContent = "Retry Sequence";
  overlay.classList.remove('hidden');
}

// Init
loadData();
