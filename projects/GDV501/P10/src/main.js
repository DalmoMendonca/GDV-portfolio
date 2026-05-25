import "./styles.css";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = 1120;
const H = 700;
const TAU = Math.PI * 2;

const keys = new Set();
const pointer = { x: W / 2, y: H / 2, down: false, clicked: false };
let last = 0;

const COLORS = {
  paper: "#fff7df",
  ink: "#1f2a24",
  green: "#2f8f63",
  teal: "#1f9aa5",
  gold: "#f2b23a",
  red: "#d94f45",
  plum: "#6d4c9f",
  blue: "#4f7dc9",
  smoke: "rgba(31,42,36,.18)",
};

const districts = [
  {
    id: "gate",
    name: "Lantern Gate",
    x: 456,
    y: 202,
    color: COLORS.gold,
    need: "focus",
    story: "The gate crew needs a clean opening signal before the first procession.",
  },
  {
    id: "market",
    name: "Market Row",
    x: 642,
    y: 150,
    color: COLORS.teal,
    need: "rhythm",
    story: "Vendors are ready, but their timing flags are out of phase.",
  },
  {
    id: "garden",
    name: "Quiet Garden",
    x: 842,
    y: 230,
    color: COLORS.green,
    need: "mercy",
    story: "Guests can recover here if the festival becomes too loud.",
  },
  {
    id: "stage",
    name: "Main Stage",
    x: 962,
    y: 442,
    color: COLORS.red,
    need: "spectacle",
    story: "Performers need a spectacular beam without blinding the crowd.",
  },
  {
    id: "pier",
    name: "River Pier",
    x: 588,
    y: 506,
    color: COLORS.blue,
    need: "closure",
    story: "The closing boats will only launch if the route home is lit.",
  },
];

const nights = [
  {
    title: "Night 1: Open the Grounds",
    goal: ["gate", "market", "garden"],
    time: 150,
    mirrors: [0, 1, 2],
    crowd: 56,
  },
  {
    title: "Night 2: The Long Procession",
    goal: ["gate", "market", "garden", "stage"],
    time: 170,
    mirrors: [1, 3, 0],
    crowd: 68,
  },
  {
    title: "Night 3: River Finale",
    goal: ["gate", "market", "garden", "stage", "pier"],
    time: 190,
    mirrors: [2, 0, 3],
    crowd: 74,
  },
];

const state = {
  mode: "title",
  night: 0,
  time: 0,
  score: 0,
  crowd: 0,
  resolve: 0,
  message: "Route signal beams through the festival, help each district, and keep the crowd delighted through three nights.",
  log: [],
  player: { x: 416, y: 590, r: 14, speed: 210 },
  mirrors: [],
  beams: [],
  sparks: [],
  helped: new Set(),
  lit: new Set(),
  route: [],
  reduceMotion: false,
  showMap: true,
  ending: "",
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dist(a, b, c, d) {
  return Math.hypot(a - c, b - d);
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

function rnd(seed) {
  const x = Math.sin(seed * 991.13) * 43758.5453;
  return x - Math.floor(x);
}

function has(...codes) {
  return codes.some((c) => keys.has(c));
}

function addLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 6);
}

function text(value, x, y, size = 16, color = COLORS.ink, weight = 750, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Inter, Segoe UI, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
}

function wrapText(value, x, y, width, lineHeight, size = 16, color = COLORS.ink) {
  ctx.font = `720 ${size}px Inter, Segoe UI, system-ui, sans-serif`;
  let line = "";
  for (const word of String(value).split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      text(line, x, y, size, color, 720);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) text(line, x, y, size, color, 720);
}

function circle(x, y, r, fill, stroke = null, width = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function rect(x, y, w, h, fill, stroke = null, width = 2) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.strokeRect(x, y, w, h);
  }
}

function rounded(x, y, w, h, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function line(x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function startNight(index = 0) {
  const night = nights[index];
  state.mode = "play";
  state.night = index;
  state.time = night.time;
  state.crowd = night.crowd;
  state.resolve = 0;
  state.message = night.title;
  state.player.x = 416;
  state.player.y = 590;
  state.helped = new Set();
  state.lit = new Set();
  state.route = [];
  state.beams = [];
  state.sparks = [];
  state.mirrors = [
    { x: 548, y: 292, angle: night.mirrors[0], label: "Sun" },
    { x: 706, y: 354, angle: night.mirrors[1], label: "Bell" },
    { x: 820, y: 520, angle: night.mirrors[2], label: "River" },
  ];
  addLog(`${night.title} begins.`);
  solveSignals();
}

function nextNight() {
  if (state.night >= nights.length - 1) {
    state.mode = "ending";
    state.ending = state.crowd >= 68
      ? "The festival closes as a citywide ritual. Every route home is lit, and the crowd leaves singing the signal pattern."
      : "The festival survives, but the crowd remembers the rough edges. The signal worked; the public play needed more grace.";
    state.score += Math.round(state.crowd * 5 + state.resolve * 120);
    return;
  }
  startNight(state.night + 1);
}

function rotateMirror(index) {
  const m = state.mirrors[index];
  m.angle = (m.angle + 1) % 4;
  state.crowd = clamp(state.crowd - 1, 0, 100);
  addLog(`${m.label} mirror rotated.`);
  if (!state.reduceMotion) {
    for (let i = 0; i < 10; i++) {
      state.sparks.push({ x: m.x, y: m.y, vx: (rnd(i + state.time) - 0.5) * 120, vy: (rnd(i + 20 + state.time) - 0.5) * 120, life: 0.55, color: COLORS.gold });
    }
  }
  solveSignals();
}

function solveSignals() {
  state.beams = [];
  state.lit = new Set();
  const source = { x: 414, y: 336 };
  const points = [source, ...state.mirrors.map((m) => ({ x: m.x, y: m.y }))];
  for (let i = 0; i < state.mirrors.length; i++) {
    const from = points[i];
    const mirror = state.mirrors[i];
    const target = districts[(mirror.angle + i) % districts.length];
    state.beams.push({ x1: from.x, y1: from.y, x2: mirror.x, y2: mirror.y, color: target.color, alpha: 0.35 });
    state.beams.push({ x1: mirror.x, y1: mirror.y, x2: target.x, y2: target.y, color: target.color, alpha: 0.65 });
    state.lit.add(target.id);
  }
  state.resolve = nights[state.night].goal.filter((id) => state.lit.has(id) && state.helped.has(id)).length;
}

function nearbyDistrict() {
  return districts.find((d) => dist(state.player.x, state.player.y, d.x, d.y) < 42);
}

function nearbyMirror() {
  return state.mirrors.findIndex((m) => dist(state.player.x, state.player.y, m.x, m.y) < 42);
}

function interact() {
  if (state.mode === "title") {
    startNight(0);
    return;
  }
  if (state.mode === "complete") {
    nextNight();
    return;
  }
  if (state.mode === "ending") {
    startNight(0);
    return;
  }
  const mirrorIndex = nearbyMirror();
  if (mirrorIndex >= 0) {
    rotateMirror(mirrorIndex);
    return;
  }
  const district = nearbyDistrict();
  if (district) {
    if (!state.lit.has(district.id)) {
      addLog(`${district.name} needs a routed beam first.`);
      state.crowd = clamp(state.crowd - 2, 0, 100);
      return;
    }
    if (!state.helped.has(district.id)) {
      state.helped.add(district.id);
      state.score += 100;
      state.crowd = clamp(state.crowd + 7, 0, 100);
      addLog(`${district.name}: ${district.need} restored.`);
      if (!state.reduceMotion) {
        for (let i = 0; i < 22; i++) {
          state.sparks.push({ x: district.x, y: district.y, vx: (rnd(i + state.time) - 0.5) * 150, vy: (rnd(i + 40 + state.time) - 0.5) * 150, life: 0.8, color: district.color });
        }
      }
      solveSignals();
    } else {
      addLog(`${district.name} is already ready.`);
    }
  }
}

function update(dt) {
  if (state.mode !== "play") return;
  state.time -= dt;
  if (state.time <= 0) {
    state.mode = "complete";
    state.message = "The night ended before the whole signal pattern resolved.";
    addLog("Night ended.");
    return;
  }

  const dx = (has("ArrowRight", "KeyD") ? 1 : 0) - (has("ArrowLeft", "KeyA") ? 1 : 0);
  const dy = (has("ArrowDown", "KeyS") ? 1 : 0) - (has("ArrowUp", "KeyW") ? 1 : 0);
  if (dx || dy) {
    const mag = Math.hypot(dx, dy);
    state.player.x = clamp(state.player.x + (dx / mag) * state.player.speed * dt, 396, 1036);
    state.player.y = clamp(state.player.y + (dy / mag) * state.player.speed * dt, 76, 635);
  }

  state.sparks = state.sparks.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt;
    return p.life > 0;
  });

  const required = nights[state.night].goal.length;
  if (state.resolve >= required) {
    state.mode = "complete";
    state.message = `${nights[state.night].title} cleared: ${required}/${required} districts lit and ready.`;
    state.score += Math.round(state.time * 4 + state.crowd * 2);
    addLog("Night clear.");
  }
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#fff4d3");
  g.addColorStop(0.55, "#e7f3d2");
  g.addColorStop(1, "#ffe1d8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 70; i++) {
    const x = 90 + rnd(i) * 980;
    const y = 70 + rnd(i + 80) * 560;
    const c = [COLORS.gold, COLORS.green, COLORS.teal, COLORS.red, COLORS.plum][i % 5];
    circle(x, y, 2 + rnd(i + 3) * 4, c);
  }
  ctx.restore();

  rounded(32, 32, 314, 620, 8, "rgba(255,255,255,.78)", "rgba(31,42,36,.18)");
  rounded(372, 46, 706, 596, 10, "rgba(255,255,255,.42)", "rgba(31,42,36,.16)");

  for (let x = 400; x < 1060; x += 42) line(x, 72, x, 620, "rgba(31,42,36,.055)", 1);
  for (let y = 86; y < 620; y += 42) line(392, y, 1060, y, "rgba(31,42,36,.055)", 1);

  line(416, 590, 456, 202, "rgba(31,42,36,.12)", 11);
  line(456, 202, 642, 150, "rgba(31,42,36,.12)", 11);
  line(642, 150, 842, 230, "rgba(31,42,36,.12)", 11);
  line(842, 230, 962, 442, "rgba(31,42,36,.12)", 11);
  line(962, 442, 588, 506, "rgba(31,42,36,.12)", 11);
  line(588, 506, 416, 590, "rgba(31,42,36,.12)", 11);
}

function drawDistricts() {
  const goal = new Set(nights[state.night]?.goal ?? []);
  for (const d of districts) {
    const lit = state.lit.has(d.id);
    const helped = state.helped.has(d.id);
    const required = goal.has(d.id);
    const r = required ? 30 : 22;
    circle(d.x, d.y, r + (lit ? 8 : 0), lit ? `${d.color}55` : "rgba(255,255,255,.58)", required ? d.color : COLORS.smoke, 3);
    circle(d.x, d.y, r, helped ? d.color : "rgba(255,255,255,.9)", d.color, 3);
    if (helped) {
      text("ready", d.x, d.y + 5, 11, "#fff", 900, "center");
    } else {
      text(required ? "need" : "opt", d.x, d.y + 5, 11, d.color, 900, "center");
    }
    text(d.name, d.x - 48, d.y - r - 16, 12, COLORS.ink, 800);
  }
}

function drawBeams() {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (const b of state.beams) {
    line(b.x1, b.y1, b.x2, b.y2, b.color, 8);
    line(b.x1, b.y1, b.x2, b.y2, "rgba(255,255,255,.8)", 2);
  }
  ctx.restore();
  circle(414, 336, 22, COLORS.gold, COLORS.ink, 3);
  text("signal source", 378, 306, 12, COLORS.ink, 800);
}

function drawMirrors() {
  for (let i = 0; i < state.mirrors.length; i++) {
    const m = state.mirrors[i];
    circle(m.x, m.y, 34, "rgba(255,255,255,.84)", COLORS.ink, 2);
    const angle = (m.angle / 4) * TAU + Math.PI / 4;
    line(m.x - Math.cos(angle) * 24, m.y - Math.sin(angle) * 24, m.x + Math.cos(angle) * 24, m.y + Math.sin(angle) * 24, COLORS.plum, 6);
    text(m.label, m.x, m.y + 54, 12, COLORS.ink, 850, "center");
    text(String(m.angle + 1), m.x, m.y + 5, 12, COLORS.plum, 900, "center");
  }
}

function drawPlayer() {
  const p = state.player;
  circle(p.x, p.y, 20, "rgba(255,255,255,.85)", COLORS.ink, 2);
  circle(p.x, p.y, p.r, COLORS.teal, COLORS.ink, 2);
  line(p.x - 8, p.y - 16, p.x + 8, p.y - 16, COLORS.gold, 4);
  const d = nearbyDistrict();
  const m = nearbyMirror();
  if (d || m >= 0) {
    circle(p.x, p.y, 34 + Math.sin(state.time * 5) * 2, "transparent", COLORS.gold, 2);
  }
}

function drawSparks() {
  for (const p of state.sparks) {
    circle(p.x, p.y, 3 + p.life * 3, p.color);
  }
}

function drawPanel() {
  text("GDV501-P10", 58, 64, 14, COLORS.teal, 900);
  text("Festival Signal", 58, 104, 34, COLORS.ink, 950);
  wrapText("A full-course capstone about loops, constraints, feedback, pacing, onboarding, and public-play readability.", 58, 138, 248, 22, 15, "rgba(31,42,36,.74)");

  const night = nights[state.night] ?? nights[0];
  text(night.title, 58, 232, 17, COLORS.plum, 900);
  text(`Time ${Math.ceil(Math.max(0, state.time))}`, 58, 266, 22, COLORS.red, 900);
  text(`Crowd ${Math.round(state.crowd)}%`, 176, 266, 22, COLORS.green, 900);

  const required = night.goal.length;
  const ratio = required ? state.resolve / required : 0;
  rect(58, 288, 238, 16, "rgba(31,42,36,.12)");
  rect(58, 288, 238 * ratio, 16, COLORS.gold);
  text(`Districts ${state.resolve}/${required}`, 58, 330, 17, COLORS.ink, 850);

  const y0 = 360;
  for (let i = 0; i < night.goal.length; i++) {
    const d = districts.find((x) => x.id === night.goal[i]);
    const lit = state.lit.has(d.id);
    const helped = state.helped.has(d.id);
    circle(70, y0 + i * 28 - 4, 7, helped ? d.color : lit ? COLORS.gold : "rgba(31,42,36,.22)", COLORS.ink, 1);
    text(`${d.name}: ${helped ? "ready" : lit ? "lit" : "dark"}`, 88, y0 + i * 28, 14, COLORS.ink, 760);
  }

  wrapText("Move through the grounds. Rotate mirrors. Visit lit districts to solve their public-play need.", 58, 528, 252, 22, 14, "rgba(31,42,36,.72)");
  text("WASD/arrows move   Space interact", 58, 606, 13, COLORS.ink, 850);
  text("M map   X reduce motion   R restart", 58, 630, 13, COLORS.ink, 850);
}

function drawOverlay() {
  if (state.mode === "title") {
    rounded(410, 178, 560, 344, 12, "rgba(255,255,255,.94)", COLORS.gold);
    text("Festival Signal", 455, 246, 48, COLORS.ink, 950);
    wrapText("Route beams across a living festival for three nights. This is the GDV501 capstone: a complete public-play game about loops, constraints, feedback, pacing, and readable goals.", 458, 292, 456, 30, 20, "rgba(31,42,36,.78)");
    text("Press Space or click to begin", 458, 448, 20, COLORS.teal, 900);
  }
  if (state.mode === "complete") {
    rounded(398, 196, 584, 300, 12, "rgba(255,255,255,.95)", COLORS.green);
    text("Night Report", 446, 260, 42, COLORS.ink, 950);
    wrapText(state.message, 448, 306, 470, 30, 21, "rgba(31,42,36,.8)");
    text(state.night >= nights.length - 1 ? "Continue to finale" : "Press Space for next night", 448, 430, 19, COLORS.teal, 900);
  }
  if (state.mode === "ending") {
    rounded(360, 154, 650, 390, 12, "rgba(255,255,255,.96)", COLORS.plum);
    text("Festival Closed", 420, 226, 48, COLORS.ink, 950);
    wrapText(state.ending, 424, 280, 510, 32, 22, "rgba(31,42,36,.82)");
    text(`Final score ${state.score}`, 424, 410, 24, COLORS.red, 900);
    text("Press R or Space to replay", 424, 462, 18, COLORS.teal, 900);
  }
}

function render() {
  drawBackground();
  if (state.showMap) {
    drawBeams();
    drawDistricts();
    drawMirrors();
    drawPlayer();
    drawSparks();
  }
  drawPanel();
  for (let i = 0; i < state.log.length; i++) {
    text(state.log[i], 776, 556 + i * 22, 13, "rgba(31,42,36,.72)", 720);
  }
  drawOverlay();
  pointer.clicked = false;
}

function clickCanvas() {
  if (state.mode !== "play") {
    interact();
    return;
  }
  for (let i = 0; i < state.mirrors.length; i++) {
    const m = state.mirrors[i];
    if (dist(pointer.x, pointer.y, m.x, m.y) < 42) {
      rotateMirror(i);
      return;
    }
  }
}

function onKey(e, up = false) {
  if (up) {
    keys.delete(e.code);
    return;
  }
  keys.add(e.code);
  if (e.code === "Space") interact();
  if (e.code === "KeyR") startNight(0);
  if (e.code === "KeyM") state.showMap = !state.showMap;
  if (e.code === "KeyX") state.reduceMotion = !state.reduceMotion;
  if (e.code === "KeyF") toggleFullscreen();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

canvas.addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * W;
  pointer.y = ((e.clientY - r.top) / r.height) * H;
});
canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * W;
  pointer.y = ((e.clientY - r.top) / r.height) * H;
  pointer.down = true;
  pointer.clicked = true;
  clickCanvas();
});
canvas.addEventListener("pointerup", () => {
  pointer.down = false;
});
window.addEventListener("keydown", (e) => onKey(e));
window.addEventListener("keyup", (e) => onKey(e, true));

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1 / 60);
  render();
};

window.render_game_to_text = () => JSON.stringify({
  project: "GDV501-P10",
  title: "Festival Signal",
  mode: state.mode,
  night: state.night + 1,
  time: Math.round(state.time),
  score: state.score,
  crowd: Math.round(state.crowd),
  resolve: state.resolve,
  required: nights[state.night]?.goal.length ?? 0,
  player: { x: Math.round(state.player.x), y: Math.round(state.player.y) },
  reduceMotion: state.reduceMotion,
  fullscreen: Boolean(document.fullscreenElement),
  mirrors: state.mirrors.map((m) => ({ label: m.label, angle: m.angle, x: m.x, y: m.y })),
  lit: [...state.lit],
  helped: [...state.helped],
  log: state.log,
  coordinateSystem: "1120x700 canvas, origin top-left",
});

function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

render();
requestAnimationFrame(loop);
