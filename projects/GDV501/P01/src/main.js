import "./styles.css";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const TAU = Math.PI * 2;

const tiers = [
  {
    name: "Foundation",
    label: "Tier 1",
    speed: 1.78,
    perfect: 0.22,
    good: 0.58,
    target: 4.9,
    palette: ["#3fc1b9", "#f0c36b"],
  },
  {
    name: "Compression",
    label: "Tier 2",
    speed: 2.55,
    perfect: 0.16,
    good: 0.45,
    target: 1.02,
    palette: ["#f47c57", "#f8d576"],
  },
  {
    name: "Aperture",
    label: "Tier 3",
    speed: 3.32,
    perfect: 0.11,
    good: 0.34,
    target: 2.72,
    palette: ["#9cc9ff", "#ff7ab6"],
  },
];

const state = {
  mode: "menu",
  tierIndex: 0,
  attemptInTier: 0,
  totalAttempts: 0,
  angle: -Math.PI / 2,
  pulse: 0,
  score: 0,
  streak: 0,
  perfects: 0,
  history: [],
  message: "Press Space, click, or tap when the needle enters the aperture.",
  result: null,
  resultTimer: 0,
  finalRank: "",
  time: 0,
  reducedMotion: false,
};

const audio = {
  context: null,
  unlocked: false,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle) {
  let wrapped = angle % TAU;
  if (wrapped < 0) wrapped += TAU;
  return wrapped;
}

function angleDistance(a, b) {
  const diff = Math.abs(wrapAngle(a) - wrapAngle(b));
  return Math.min(diff, TAU - diff);
}

function unlockAudio() {
  if (audio.unlocked) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audio.context = new AudioContext();
  audio.unlocked = true;
}

function tone(frequency, duration = 0.12, type = "sine", gainValue = 0.08) {
  if (!audio.context) return;
  const now = audio.context.currentTime;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainValue, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audio.context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function playResultSound(kind) {
  if (kind === "perfect") {
    tone(523.25, 0.11, "triangle", 0.08);
    setTimeout(() => tone(783.99, 0.13, "triangle", 0.08), 58);
    return;
  }
  if (kind === "late" || kind === "early") {
    tone(kind === "early" ? 220 : 164.81, 0.16, "sawtooth", 0.04);
    return;
  }
  tone(329.63, 0.12, "square", 0.06);
}

function currentTier() {
  return tiers[state.tierIndex] ?? tiers[tiers.length - 1];
}

function resetRun() {
  state.mode = "running";
  state.tierIndex = 0;
  state.attemptInTier = 0;
  state.totalAttempts = 0;
  state.angle = -Math.PI / 2;
  state.pulse = 0;
  state.score = 0;
  state.streak = 0;
  state.perfects = 0;
  state.history = [];
  state.result = null;
  state.finalRank = "";
  state.message = "Attempt 1 of 9. Watch the rhythm, then commit.";
  state.resultTimer = 0;
}

function resultLabel(distance, signed) {
  const tier = currentTier();
  if (distance <= tier.perfect) return "perfect";
  if (distance <= tier.good) return "good";
  return signed < 0 ? "early" : "late";
}

function signedAngularOffset(angle, target) {
  let offset = wrapAngle(angle) - wrapAngle(target);
  if (offset > Math.PI) offset -= TAU;
  if (offset < -Math.PI) offset += TAU;
  return offset;
}

function evaluateAttempt() {
  const tier = currentTier();
  const signed = signedAngularOffset(state.angle, tier.target);
  const distance = Math.abs(signed);
  const label = resultLabel(distance, signed);
  const quality =
    label === "perfect" ? 100 : label === "good" ? Math.round(78 - distance * 22) : Math.max(0, Math.round(42 - distance * 16));
  const points = label === "perfect" ? 120 + state.streak * 10 : label === "good" ? 70 : 20;

  if (label === "perfect") {
    state.streak += 1;
    state.perfects += 1;
  } else if (label === "good") {
    state.streak = Math.max(0, state.streak);
  } else {
    state.streak = 0;
  }

  state.score += points;
  state.totalAttempts += 1;
  state.attemptInTier += 1;
  state.pulse = label === "perfect" ? 1 : 0.65;
  state.result = {
    tier: tier.name,
    attempt: state.totalAttempts,
    label,
    distance,
    offsetDegrees: Math.round((signed * 180) / Math.PI),
    quality,
    points,
  };
  state.history.push(state.result);
  state.mode = "result";
  state.resultTimer = 0;
  state.message =
    label === "perfect"
      ? "Perfect lock. The aperture held."
      : label === "good"
        ? "Inside the window. Clean enough to continue."
        : label === "early"
          ? "Early release. Wait for the bright gate."
          : "Late release. Commit before the needle escapes.";
  playResultSound(label);
}

function advanceAttempt() {
  if (state.totalAttempts >= 9) {
    const average = state.history.reduce((sum, item) => sum + item.quality, 0) / state.history.length;
    state.finalRank =
      average >= 92 && state.perfects >= 4
        ? "Aperture Master"
        : average >= 78
          ? "Reliable Chronist"
          : average >= 58
            ? "Apprentice Timer"
            : "Needs Calibration";
    state.mode = "complete";
    state.message = `${state.finalRank}. ${state.perfects} perfect hits, ${state.score} points.`;
    return;
  }

  if (state.attemptInTier >= 3) {
    state.tierIndex += 1;
    state.attemptInTier = 0;
  }

  const tier = currentTier();
  state.mode = "running";
  state.result = null;
  state.resultTimer = 0;
  state.angle = -Math.PI / 2 + state.totalAttempts * 0.37;
  state.message = `${tier.label}: ${tier.name}. Attempt ${state.totalAttempts + 1} of 9.`;
}

function handleAction() {
  unlockAudio();
  if (state.mode === "menu") {
    resetRun();
    tone(392, 0.1, "triangle", 0.05);
    return;
  }
  if (state.mode === "running") {
    evaluateAttempt();
    return;
  }
  if (state.mode === "result") {
    advanceAttempt();
    return;
  }
  if (state.mode === "complete") {
    resetRun();
  }
}

function update(dt) {
  const capped = Math.min(dt, 0.05);
  state.time += capped;
  if (state.mode === "running") {
    const tier = currentTier();
    const pressure = 1 + state.attemptInTier * 0.08;
    state.angle = wrapAngle(state.angle + tier.speed * pressure * capped);
  }
  if (state.mode === "result") {
    state.resultTimer += capped;
    if (state.resultTimer > 1.35) {
      advanceAttempt();
    }
  }
  state.pulse = Math.max(0, state.pulse - capped * 1.8);
}

function drawArc(cx, cy, radius, start, end, color, width) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawText(text, x, y, options = {}) {
  ctx.save();
  ctx.fillStyle = options.color ?? "#f5f2e8";
  ctx.font = `${options.weight ?? 500} ${options.size ?? 18}px Inter, Segoe UI, sans-serif`;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = options.baseline ?? "alphabetic";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWrapped(text, x, y, maxWidth, lineHeight, options = {}) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    ctx.font = `${options.weight ?? 500} ${options.size ?? 18}px Inter, Segoe UI, sans-serif`;
    if (ctx.measureText(test).width > maxWidth && line) {
      drawText(line, x, y, options);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) drawText(line, x, y, options);
}

function drawDial() {
  const tier = currentTier();
  const cx = 480;
  const cy = 324;
  const radius = 170;
  const pulse = state.reducedMotion ? 0 : state.pulse;
  const [primary, secondary] = tier.palette;

  ctx.save();
  ctx.translate(cx, cy);
  if (pulse > 0) {
    ctx.globalAlpha = 0.16 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 44 + pulse * 32, 0, TAU);
    ctx.fillStyle = primary;
    ctx.fill();
  }
  ctx.restore();

  drawArc(cx, cy, radius, 0, TAU, "rgba(245,242,232,0.18)", 18);
  drawArc(cx, cy, radius, tier.target - tier.good, tier.target + tier.good, "rgba(245,242,232,0.22)", 22);
  drawArc(cx, cy, radius, tier.target - tier.perfect, tier.target + tier.perfect, primary, 28);

  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * TAU;
    const long = i % 3 === 0;
    const inner = radius - (long ? 21 : 12);
    const outer = radius + (long ? 19 : 12);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = long ? "rgba(245,242,232,0.32)" : "rgba(245,242,232,0.14)";
    ctx.lineWidth = long ? 2 : 1;
    ctx.stroke();
  }

  const needleX = cx + Math.cos(state.angle) * (radius + 8);
  const needleY = cy + Math.sin(state.angle) * (radius + 8);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(needleX, needleY);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(needleX, needleY, 13 + pulse * 10, 0, TAU);
  ctx.fillStyle = secondary;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 48, 0, TAU);
  ctx.fillStyle = "#111721";
  ctx.fill();
  ctx.strokeStyle = "rgba(245,242,232,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();

  drawText(`${state.totalAttempts + (state.mode === "complete" ? 0 : 1)}/9`, cx, cy + 8, {
    align: "center",
    size: 30,
    weight: 800,
  });
}

function drawHud() {
  const tier = currentTier();
  drawText("CHRONO APERTURE", 48, 58, { size: 16, weight: 900, color: "#f0c36b" });
  drawText(`${tier.label}: ${tier.name}`, 48, 92, { size: 30, weight: 800 });
  drawText(`Score ${state.score}`, 48, 124, { size: 18, color: "#a9b2ba" });
  drawText(`Perfects ${state.perfects}  Streak ${state.streak}`, 48, 150, { size: 16, color: "#a9b2ba" });

  const y = 548;
  drawText("ONE BUTTON", 48, y, { size: 13, weight: 900, color: "#f0c36b" });
  drawText("Space / click / tap to start, lock, advance, or restart.", 48, y + 28, { size: 18, color: "#f5f2e8" });
  drawText("F toggles fullscreen. Esc exits fullscreen.", 48, y + 54, { size: 14, color: "#a9b2ba" });

  const startX = 710;
  drawText("Windows", startX, 58, { size: 13, weight: 900, color: "#f0c36b" });
  drawText(`Perfect ${(tier.perfect * 2 * 180 / Math.PI).toFixed(0)}°`, startX, 92, { size: 18 });
  drawText(`Playable ${(tier.good * 2 * 180 / Math.PI).toFixed(0)}°`, startX, 120, { size: 18, color: "#a9b2ba" });
  drawText("Three attempts per tier.", startX, 150, { size: 14, color: "#a9b2ba" });
}

function drawResultPanel() {
  if (state.mode !== "result" && state.mode !== "complete") return;
  const panelX = 622;
  const panelY = 214;
  ctx.fillStyle = "rgba(15, 20, 28, 0.86)";
  ctx.strokeStyle = "rgba(245,242,232,0.2)";
  ctx.lineWidth = 1;
  ctx.fillRect(panelX, panelY, 284, 176);
  ctx.strokeRect(panelX, panelY, 284, 176);

  if (state.mode === "complete") {
    drawText("Run Complete", panelX + 24, panelY + 42, { size: 16, weight: 900, color: "#f0c36b" });
    drawWrapped(state.message, panelX + 24, panelY + 78, 228, 28, { size: 22, weight: 800 });
    drawText("Press once to replay.", panelX + 24, panelY + 146, { size: 15, color: "#a9b2ba" });
    return;
  }

  const result = state.result;
  const color =
    result.label === "perfect" ? "#3fc1b9" : result.label === "good" ? "#f0c36b" : result.label === "early" ? "#9cc9ff" : "#ff7ab6";
  drawText(result.label.toUpperCase(), panelX + 24, panelY + 42, { size: 18, weight: 900, color });
  drawText(`${result.points} points`, panelX + 24, panelY + 78, { size: 34, weight: 900 });
  drawText(`${Math.abs(result.offsetDegrees)}° ${result.offsetDegrees < 0 ? "early" : "late"}`, panelX + 24, panelY + 112, {
    size: 18,
    color: "#a9b2ba",
  });
  drawText("Next attempt auto-advances.", panelX + 24, panelY + 146, { size: 15, color: "#a9b2ba" });
}

function drawHistory() {
  const startX = 710;
  const startY = 504;
  drawText("Attempt history", startX, startY, { size: 13, weight: 900, color: "#f0c36b" });
  for (let i = 0; i < 9; i += 1) {
    const item = state.history[i];
    const x = startX + (i % 3) * 54;
    const y = startY + 30 + Math.floor(i / 3) * 34;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, TAU);
    ctx.fillStyle = item
      ? item.label === "perfect"
        ? "#3fc1b9"
        : item.label === "good"
          ? "#f0c36b"
          : "#7d8895"
      : "rgba(245,242,232,0.12)";
    ctx.fill();
    drawText(String(i + 1), x, y + 5, { align: "center", size: 12, weight: 900, color: item ? "#0d1118" : "#a9b2ba" });
  }
}

function drawMenu() {
  drawText("CHRONO APERTURE", 480, 172, { align: "center", size: 18, weight: 900, color: "#f0c36b" });
  drawWrapped("A one-button timing study in anticipation, commitment, feedback, and difficulty compression.", 480, 230, 620, 44, {
    align: "center",
    size: 36,
    weight: 900,
  });
  drawText("Press Space, click, or tap to begin.", 480, 382, { align: "center", size: 22 });
  drawText("Three tiers. Three attempts each. Early, perfect, and late feedback every time.", 480, 422, {
    align: "center",
    size: 15,
    color: "#a9b2ba",
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f141c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createRadialGradient(480, 310, 40, 480, 310, 430);
  gradient.addColorStop(0, "rgba(63,193,185,0.16)");
  gradient.addColorStop(0.52, "rgba(244,124,87,0.06)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.mode === "menu") {
    drawMenu();
    return;
  }

  drawHud();
  drawDial();
  drawResultPanel();
  drawHistory();
  drawWrapped(state.message, 430, 72, 240, 23, { size: 16, color: "#f5f2e8" });
}

let lastFrame = performance.now();
function loop(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function resize() {
  const logicalWidth = 960;
  const logicalHeight = 640;
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
  canvas.style.aspectRatio = `${logicalWidth} / ${logicalHeight}`;
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    handleAction();
  }
  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
});

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  handleAction();
});

window.addEventListener("resize", resize);

window.render_game_to_text = () =>
  JSON.stringify({
    coordinateSystem: "Canvas 960x640, origin top-left, x right, y down. Dial center at 480,324.",
    mode: state.mode,
    tier: currentTier().name,
    attempt: state.totalAttempts + (state.mode === "complete" ? 0 : 1),
    attemptsRemaining: Math.max(0, 9 - state.totalAttempts),
    angleRadians: Number(state.angle.toFixed(3)),
    targetRadians: Number(currentTier().target.toFixed(3)),
    perfectWindowRadians: currentTier().perfect,
    goodWindowRadians: currentTier().good,
    score: state.score,
    streak: state.streak,
    perfects: state.perfects,
    message: state.message,
    result: state.result,
    finalRank: state.finalRank,
  });

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  render();
};

resize();
render();
requestAnimationFrame(loop);
