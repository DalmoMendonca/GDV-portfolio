const SAVE_KEY = "GDV502_P04_SaveData";

const saveStatus = document.getElementById('saveStatus');
const btnSave = document.getElementById('btnSave');
const btnReset = document.getElementById('btnReset');
const btnCorrupt = document.getElementById('btnCorrupt');

const goldVal = document.getElementById('goldVal');
const gpsVal = document.getElementById('gpsVal');
const multVal = document.getElementById('multVal');
const btnMine = document.getElementById('btnMine');
const upgradesContainer = document.getElementById('upgradesContainer');

// Game State
let state = {
  gold: 0,
  gps: 0,
  multiplier: 1,
  upgrades: {
    pickaxe: 0,
    miner: 0,
    factory: 0
  },
  lastSaved: 0
};

const UPGRADE_DATA = {
  pickaxe: { name: "Better Pickaxe", baseCost: 10, mult: 1.5, effect: () => state.multiplier += 1, desc: "+1 Click Multiplier" },
  miner: { name: "Auto Miner", baseCost: 50, mult: 1.2, effect: () => state.gps += 2, desc: "+2 Gold / sec" },
  factory: { name: "Gold Factory", baseCost: 500, mult: 1.2, effect: () => state.gps += 25, desc: "+25 Gold / sec" }
};

function init() {
  loadGame();
  renderUpgrades();
  updateUI();
  
  // Auto Save Loop
  setInterval(() => {
    saveGame(false);
  }, 5000);
  
  // Logic Loop
  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    
    if (state.gps > 0) {
      state.gold += state.gps * dt;
      updateUI();
    }
  }, 100);
}

function updateUI() {
  goldVal.textContent = Math.floor(state.gold);
  gpsVal.textContent = state.gps;
  multVal.textContent = state.multiplier;
  
  // Update buttons
  Object.keys(UPGRADE_DATA).forEach(key => {
    const btn = document.getElementById(`btn-buy-${key}`);
    if (btn) {
      const cost = Math.floor(UPGRADE_DATA[key].baseCost * Math.pow(UPGRADE_DATA[key].mult, state.upgrades[key]));
      btn.disabled = state.gold < cost;
      btn.textContent = `Buy (${cost})`;
    }
  });
}

function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  Object.keys(UPGRADE_DATA).forEach(key => {
    const data = UPGRADE_DATA[key];
    const cost = Math.floor(data.baseCost * Math.pow(data.mult, state.upgrades[key]));
    
    const div = document.createElement('div');
    div.className = 'upgrade-card';
    div.innerHTML = `
      <div class="upg-info">
        <h3>${data.name} <span style="color:#64748b; font-size:0.9rem;">Lvl ${state.upgrades[key]}</span></h3>
        <p>${data.desc}</p>
      </div>
      <button id="btn-buy-${key}" class="btn upg-buy" ${state.gold < cost ? 'disabled' : ''}>Buy (${cost})</button>
    `;
    
    upgradesContainer.appendChild(div);
    
    document.getElementById(`btn-buy-${key}`).addEventListener('click', () => {
      const currentCost = Math.floor(data.baseCost * Math.pow(data.mult, state.upgrades[key]));
      if (state.gold >= currentCost) {
        state.gold -= currentCost;
        state.upgrades[key]++;
        data.effect();
        renderUpgrades();
        updateUI();
      }
    });
  });
}

btnMine.addEventListener('click', () => {
  state.gold += 1 * state.multiplier;
  updateUI();
});

// --- Persistence ---

function saveGame(manual = true) {
  try {
    state.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (manual) showStatus("Game Saved Successfully", false);
  } catch (e) {
    showStatus("Error Saving Game!", true);
  }
}

function loadGame() {
  try {
    const savedStr = localStorage.getItem(SAVE_KEY);
    if (savedStr) {
      const saved = JSON.parse(savedStr);
      // Fallback behavior: validate loaded data
      if (typeof saved.gold === 'number' && typeof saved.upgrades === 'object') {
        state = { ...state, ...saved }; // merge to keep defaults for missing fields
        showStatus("Save Loaded!", false);
      } else {
        throw new Error("Invalid Save Data Format");
      }
    } else {
      showStatus("New Game Started", false);
    }
  } catch (e) {
    console.error(e);
    showStatus("Corrupt Save Data! Resetting to default.", true);
    // Reset state
    state = { gold: 0, gps: 0, multiplier: 1, upgrades: { pickaxe: 0, miner: 0, factory: 0 }, lastSaved: 0 };
  }
}

function showStatus(msg, isError) {
  saveStatus.textContent = `Status: ${msg}`;
  if (isError) saveStatus.classList.add('error');
  else saveStatus.classList.remove('error');
}

btnSave.addEventListener('click', () => saveGame(true));

btnReset.addEventListener('click', () => {
  if (confirm("Are you sure you want to reset all progress?")) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
});

btnCorrupt.addEventListener('click', () => {
  // Write invalid JSON to force corrupt save fallback on next load
  localStorage.setItem(SAVE_KEY, "{ corrupted_data: [1, 2, }");
  showStatus("Save corrupted. Reload page to see fallback.", true);
});

// Run
init();
