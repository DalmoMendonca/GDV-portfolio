const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');
const btnExport = document.getElementById('btnExport');
const btnClear = document.getElementById('btnClear');
const btnLoad = document.getElementById('btnLoad');
const lvlSelect = document.getElementById('lvlSelect');
const exportModal = document.getElementById('exportModal');
const exportText = document.getElementById('exportText');
const btnCloseModal = document.getElementById('btnCloseModal');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const btnOverlayClose = document.getElementById('btnOverlayClose');
const toolRadios = document.getElementsByName('tool');

const TILE_SIZE = 20;
const COLS = 500 / TILE_SIZE; // 25
const ROWS = 400 / TILE_SIZE; // 20

// State
let mode = 'editor'; // editor, play
let currentTool = 'wall';
let isDrawing = false;
let animFrame;
let lastTime = 0;

// Level Data
let level = {
  walls: Array(ROWS).fill().map(() => Array(COLS).fill(0)),
  start: { r: 2, c: 2 },
  goal: { r: 17, c: 22 }
};

// Player (for play mode)
let player = { x: 0, y: 0, w: 16, h: 16, speed: 150 };
const keys = { w: false, a: false, s: false, d: false };

// Authored Levels
const authoredLevels = {
  "1": {
    "start":{"r":2,"c":2},"goal":{"r":2,"c":22},
    "walls": Array(ROWS).fill().map((_,r) => Array(COLS).fill(0).map((_,c) => (r===1||r===3) && c>=2 && c<=22 ? 1 : 0))
  },
  "2": {
    "start":{"r":2,"c":2},"goal":{"r":17,"c":22},
    "walls": Array(ROWS).fill().map((_,r) => Array(COLS).fill(0).map((_,c) => {
      if (r===0||c===0||r===ROWS-1||c===COLS-1) return 1;
      if (c%4===0 && r>4) return 1;
      if (c%4===2 && r<ROWS-4) return 1;
      return 0;
    }))
  },
  "3": {
    "start":{"r":10,"c":2},"goal":{"r":10,"c":22},
    "walls": Array(ROWS).fill().map((_,r) => Array(COLS).fill(0).map((_,c) => {
      if (r < 8 || r > 12) return 1; // tight tunnel
      if (c > 5 && c < 20 && c%3===0 && r%2===0) return 1; // pillars
      return 0;
    }))
  }
};

// Editor Tool Select
toolRadios.forEach(r => r.addEventListener('change', e => {
  if (e.target.checked) currentTool = e.target.value;
}));

// Editor Interaction
canvas.addEventListener('mousedown', e => {
  if (mode !== 'editor') return;
  isDrawing = true;
  useTool(e);
});
canvas.addEventListener('mousemove', e => {
  if (mode !== 'editor' || !isDrawing) return;
  useTool(e);
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / TILE_SIZE);
  const r = Math.floor((e.clientY - rect.top) / TILE_SIZE);
  return { r: Math.max(0, Math.min(ROWS - 1, r)), c: Math.max(0, Math.min(COLS - 1, c)) };
}

function useTool(e) {
  const {r, c} = getCell(e);
  if (currentTool === 'wall') {
    level.walls[r][c] = 1;
  } else if (currentTool === 'erase') {
    level.walls[r][c] = 0;
  } else if (currentTool === 'start') {
    level.start = {r, c};
    level.walls[r][c] = 0;
  } else if (currentTool === 'goal') {
    level.goal = {r, c};
    level.walls[r][c] = 0;
  }
  drawMap();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Grid
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.beginPath();
  for(let x=0; x<=canvas.width; x+=TILE_SIZE) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
  for(let y=0; y<=canvas.height; y+=TILE_SIZE) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
  ctx.stroke();

  // Walls
  ctx.fillStyle = 'var(--wall)';
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      if (level.walls[r][c] === 1) {
        ctx.fillRect(c*TILE_SIZE, r*TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Start
  ctx.fillStyle = 'var(--start)';
  ctx.beginPath();
  ctx.arc(level.start.c*TILE_SIZE + TILE_SIZE/2, level.start.r*TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2.5, 0, Math.PI*2);
  ctx.fill();

  // Goal
  ctx.fillStyle = 'var(--goal)';
  ctx.fillRect(level.goal.c*TILE_SIZE+2, level.goal.r*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-4);
}

// Play Mode
function startPlay() {
  mode = 'play';
  btnPlay.classList.add('hidden');
  btnStop.classList.remove('hidden');
  
  player.x = level.start.c * TILE_SIZE + (TILE_SIZE - player.w)/2;
  player.y = level.start.r * TILE_SIZE + (TILE_SIZE - player.h)/2;
  
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function stopPlay() {
  mode = 'editor';
  cancelAnimationFrame(animFrame);
  btnPlay.classList.remove('hidden');
  btnStop.classList.add('hidden');
  overlay.classList.add('hidden');
  drawMap();
}

// AABB
function rectIntersect(r1, r2) {
  return !(r2.x >= r1.x + r1.w || r2.x + r2.w <= r1.x || r2.y >= r1.y + r1.h || r2.y + r2.h <= r1.y);
}

function gameLoop(time) {
  if (mode !== 'play') return;
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  let vx = 0, vy = 0;
  if (keys.w) vy = -1;
  if (keys.s) vy = 1;
  if (keys.a) vx = -1;
  if (keys.d) vx = 1;
  
  if (vx !== 0 && vy !== 0) {
    const len = Math.hypot(vx, vy);
    vx /= len; vy /= len;
  }

  let nx = player.x + vx * player.speed * dt;
  let ny = player.y + vy * player.speed * dt;
  
  // Bounds
  if (nx < 0 || nx + player.w > canvas.width) nx = player.x;
  if (ny < 0 || ny + player.h > canvas.height) ny = player.y;

  // Wall Collision
  let xRect = { x: nx, y: player.y, w: player.w, h: player.h };
  let yRect = { x: nx, y: ny, w: player.w, h: player.h };
  
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      if (level.walls[r][c] === 1) {
        let wallRect = { x: c*TILE_SIZE, y: r*TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
        if (rectIntersect(xRect, wallRect)) {
          if (vx > 0) nx = wallRect.x - player.w;
          else if (vx < 0) nx = wallRect.x + wallRect.w;
          xRect.x = nx;
          yRect.x = nx;
        }
        if (rectIntersect(yRect, wallRect)) {
          if (vy > 0) ny = wallRect.y - player.h;
          else if (vy < 0) ny = wallRect.y + wallRect.h;
        }
      }
    }
  }

  player.x = nx;
  player.y = ny;

  // Check Goal
  let pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
  let gRect = { x: level.goal.c*TILE_SIZE, y: level.goal.r*TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
  if (rectIntersect(pRect, gRect)) {
    overlay.classList.remove('hidden');
    mode = 'done';
  }

  drawMap();
  // Draw Player
  ctx.fillStyle = 'var(--start)';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(player.x, player.y, player.w, player.h);

  if (mode === 'play') animFrame = requestAnimationFrame(gameLoop);
}

// Input Map
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup') keys.w = true;
  if (k === 'arrowdown') keys.s = true;
  if (k === 'arrowleft') keys.a = true;
  if (k === 'arrowright') keys.d = true;
  if (keys.hasOwnProperty(k)) keys[k] = true;
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup') keys.w = false;
  if (k === 'arrowdown') keys.s = false;
  if (k === 'arrowleft') keys.a = false;
  if (k === 'arrowright') keys.d = false;
  if (keys.hasOwnProperty(k)) keys[k] = false;
});

// UI Buttons
btnPlay.addEventListener('click', startPlay);
btnStop.addEventListener('click', stopPlay);
btnOverlayClose.addEventListener('click', stopPlay);

btnClear.addEventListener('click', () => {
  level.walls = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  drawMap();
});

btnExport.addEventListener('click', () => {
  // Compress walls representation for easy sharing
  const exportData = {
    start: level.start,
    goal: level.goal,
    walls: level.walls
  };
  exportText.value = JSON.stringify(exportData);
  exportModal.classList.remove('hidden');
});

btnCloseModal.addEventListener('click', () => {
  exportModal.classList.add('hidden');
});

btnLoad.addEventListener('click', () => {
  const id = lvlSelect.value;
  if (authoredLevels[id]) {
    level = JSON.parse(JSON.stringify(authoredLevels[id]));
    drawMap();
  }
});

// Init
drawMap();
