const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const debugToggle = document.getElementById('debugToggle');
const overlay = document.getElementById('overlay');
const nextBtn = document.getElementById('nextBtn');
const btnRestart = document.getElementById('btnRestart');
const overlayTitle = document.getElementById('overlayTitle');

let showDebug = false;
debugToggle.addEventListener('change', (e) => showDebug = e.target.checked);

let currentLevel = 0;
let isPlaying = true;
let animFrame;
let lastTime = 0;

const FRICTION = 0.98; // per physics tick
const RESTITUTION = 0.8; // bounce factor

let player = {
  x: 50, y: 200, r: 12,
  vx: 0, vy: 0,
  mass: 1,
  color: '#3b82f6'
};

let aim = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };

let blocks = [];
let goal = { x: 0, y: 0, w: 40, h: 40 };
let bumpers = [];

const levels = [
  {
    start: {x: 50, y: 200},
    goal: {x: 500, y: 180, w: 40, h: 40},
    blocks: [
      {x: 250, y: 0, w: 50, h: 250}
    ],
    bumpers: []
  },
  {
    start: {x: 50, y: 350},
    goal: {x: 500, y: 50, w: 50, h: 50},
    blocks: [
      {x: 200, y: 150, w: 400, h: 50},
      {x: 0, y: 150, w: 100, h: 50}
    ],
    bumpers: [
      {x: 300, y: 300, r: 25, restitution: 1.5} // Bouncy!
    ]
  }
];

function loadLevel() {
  if (currentLevel >= levels.length) {
    overlayTitle.textContent = "All Levels Cleared!";
    nextBtn.classList.add('hidden');
    overlay.classList.remove('hidden');
    isPlaying = false;
    return;
  }
  
  const lvl = levels[currentLevel];
  player.x = lvl.start.x;
  player.y = lvl.start.y;
  player.vx = 0;
  player.vy = 0;
  
  goal = { ...lvl.goal };
  blocks = JSON.parse(JSON.stringify(lvl.blocks));
  bumpers = JSON.parse(JSON.stringify(lvl.bumpers));
  
  overlay.classList.add('hidden');
  isPlaying = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

btnRestart.addEventListener('click', loadLevel);
nextBtn.addEventListener('click', () => {
  currentLevel++;
  loadLevel();
});

// Input
canvas.addEventListener('mousedown', e => {
  if (!isPlaying) return;
  const rect = canvas.getBoundingClientRect();
  aim.active = true;
  aim.startX = e.clientX - rect.left;
  aim.startY = e.clientY - rect.top;
  aim.currentX = aim.startX;
  aim.currentY = aim.startY;
});

canvas.addEventListener('mousemove', e => {
  if (aim.active) {
    const rect = canvas.getBoundingClientRect();
    aim.currentX = e.clientX - rect.left;
    aim.currentY = e.clientY - rect.top;
  }
});

canvas.addEventListener('mouseup', () => {
  if (aim.active) {
    aim.active = false;
    const dx = aim.startX - aim.currentX;
    const dy = aim.startY - aim.currentY;
    // Launch! Max speed ~1000 px/s
    player.vx += dx * 4;
    player.vy += dy * 4;
  }
});

// Physics Math
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function resolveCircleAABB(circle, rect) {
  // Find closest point on rect to circle center
  let closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  let closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  
  let dx = circle.x - closestX;
  let dy = circle.y - closestY;
  let distanceSquared = dx * dx + dy * dy;
  
  if (distanceSquared < circle.r * circle.r) {
    let distance = Math.sqrt(distanceSquared);
    let overlap = circle.r - distance;
    
    let nx = 0, ny = 0;
    
    if (distance === 0) {
      // Deep penetration, circle center inside rect
      // Push out to the closest edge
      let distLeft = circle.x - rect.x;
      let distRight = (rect.x + rect.w) - circle.x;
      let distTop = circle.y - rect.y;
      let distBottom = (rect.y + rect.h) - circle.y;
      
      let min = Math.min(distLeft, distRight, distTop, distBottom);
      if (min === distLeft) nx = -1;
      else if (min === distRight) nx = 1;
      else if (min === distTop) ny = -1;
      else if (min === distBottom) ny = 1;
      overlap = min + circle.r;
    } else {
      nx = dx / distance;
      ny = dy / distance;
    }
    
    // Positional correction
    circle.x += nx * overlap;
    circle.y += ny * overlap;
    
    // Velocity resolution (bounce)
    // Dot product of velocity and normal
    let vDotN = circle.vx * nx + circle.vy * ny;
    if (vDotN < 0) {
      circle.vx -= (1 + RESTITUTION) * vDotN * nx;
      circle.vy -= (1 + RESTITUTION) * vDotN * ny;
    }
    
    return { hit: true, nx, ny };
  }
  return { hit: false };
}

function resolveCircleCircle(c1, c2) {
  let dx = c1.x - c2.x;
  let dy = c1.y - c2.y;
  let distSq = dx * dx + dy * dy;
  let rSum = c1.r + c2.r;
  
  if (distSq < rSum * rSum) {
    let dist = Math.sqrt(distSq);
    let overlap = rSum - dist;
    
    let nx = dx / dist;
    let ny = dy / dist;
    
    // Since bumper is static, push c1 completely out
    c1.x += nx * overlap;
    c1.y += ny * overlap;
    
    let vDotN = c1.vx * nx + c1.vy * ny;
    if (vDotN < 0) {
      let rest = c2.restitution !== undefined ? c2.restitution : RESTITUTION;
      c1.vx -= (1 + rest) * vDotN * nx;
      c1.vy -= (1 + rest) * vDotN * ny;
    }
    
    return { hit: true, nx, ny };
  }
  return { hit: false };
}

function loop(time) {
  if (!isPlaying) return;
  // Fixed physics step for stability
  const dt = 1/60;
  
  // Friction
  player.vx *= Math.pow(FRICTION, dt * 60);
  player.vy *= Math.pow(FRICTION, dt * 60);
  
  // Stop if very slow
  if (Math.abs(player.vx) < 5) player.vx = 0;
  if (Math.abs(player.vy) < 5) player.vy = 0;
  
  // Move
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  
  let contactNormals = [];

  // Collisions: Walls
  if (player.x - player.r < 0) {
    player.x = player.r;
    player.vx *= -RESTITUTION;
    contactNormals.push({nx: 1, ny: 0});
  }
  if (player.x + player.r > canvas.width) {
    player.x = canvas.width - player.r;
    player.vx *= -RESTITUTION;
    contactNormals.push({nx: -1, ny: 0});
  }
  if (player.y - player.r < 0) {
    player.y = player.r;
    player.vy *= -RESTITUTION;
    contactNormals.push({nx: 0, ny: 1});
  }
  if (player.y + player.r > canvas.height) {
    player.y = canvas.height - player.r;
    player.vy *= -RESTITUTION;
    contactNormals.push({nx: 0, ny: -1});
  }

  // Collisions: Blocks
  blocks.forEach(b => {
    let res = resolveCircleAABB(player, b);
    if (res.hit) contactNormals.push({nx: res.nx, ny: res.ny});
  });

  // Collisions: Bumpers
  bumpers.forEach(b => {
    let res = resolveCircleCircle(player, b);
    if (res.hit) contactNormals.push({nx: res.nx, ny: res.ny});
  });

  // Goal check (is completely inside?)
  if (player.x > goal.x && player.x < goal.x + goal.w &&
      player.y > goal.y && player.y < goal.y + goal.h &&
      Math.abs(player.vx) < 50 && Math.abs(player.vy) < 50) {
    
    isPlaying = false;
    overlayTitle.textContent = "Level Cleared!";
    nextBtn.textContent = "Next Level";
    overlay.classList.remove('hidden');
  }

  // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Goal
  ctx.fillStyle = '#10b981';
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  
  // Blocks
  ctx.fillStyle = '#334155';
  blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  
  // Bumpers
  ctx.fillStyle = '#ec4899';
  bumpers.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
  });

  // Player
  ctx.fillStyle = player.color;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();

  // Aiming
  if (aim.active) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    // Draw vector opposite to drag direction
    ctx.lineTo(player.x + (aim.startX - aim.currentX), player.y + (aim.startY - aim.currentY));
    ctx.stroke();
  }

  // Debug Visualization
  if (showDebug) {
    // Velocity vector
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.vx * 0.1, player.y + player.vy * 0.1);
    ctx.stroke();

    // Bounding boxes
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    blocks.forEach(b => ctx.strokeRect(b.x, b.y, b.w, b.h));
    
    // Contact Normals
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    contactNormals.forEach(n => {
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + n.nx * 20, player.y + n.ny * 20);
      ctx.stroke();
    });
  }
  
  if (isPlaying) animFrame = requestAnimationFrame(loop);
}

// Init
loadLevel();
