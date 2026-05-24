import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const courseRoot = path.join(root, "projects", "GDV501");

const themes = {
  P01: {
    palette: ["#fbf3df", "#1e2a2f", "#e45f2b", "#0b7f82", "#b63546"],
    body: "linear-gradient(135deg,#fff7df,#e3f2ec 52%,#f4ded3)",
  },
  P02: {
    palette: ["#eef8fb", "#142234", "#246b9f", "#d99a18", "#c6414b"],
    body: "linear-gradient(135deg,#eef8fb,#f7f1dc 55%,#ffd9d6)",
  },
  P03: {
    palette: ["#f8ead2", "#2b1d15", "#a6542d", "#28785f", "#415d9c"],
    body: "linear-gradient(135deg,#f9ecd4,#edf5df 48%,#e8d5bd)",
  },
  P04: {
    palette: ["#f7f1e7", "#211720", "#7d4f9e", "#b87818", "#2f8b68"],
    body: "linear-gradient(135deg,#f7f1e7,#ece2f5 50%,#f2dcc1)",
  },
  P05: {
    palette: ["#f4f7fb", "#172235", "#1782a6", "#d85b93", "#508c4f"],
    body: "linear-gradient(135deg,#f4f7fb,#e1f2f7 55%,#f7dfeb)",
  },
  P06: {
    palette: ["#f1f6ee", "#17241f", "#2f8b67", "#c66a2e", "#b53d4b"],
    body: "linear-gradient(135deg,#f1f6ee,#e4efe4 50%,#f4dfcf)",
  },
  P07: {
    palette: ["#edf3fb", "#17233a", "#2d67b2", "#b98620", "#bf4561"],
    body: "linear-gradient(135deg,#edf3fb,#dde9fb 54%,#f2dfbb)",
  },
  P08: {
    palette: ["#f1f4f7", "#18222c", "#217a9f", "#d79620", "#c23e5a"],
    body: "linear-gradient(135deg,#f1f4f7,#e4eef5 55%,#f5e3c9)",
  },
  P09: {
    palette: ["#fff6e8", "#1f2a2d", "#1a8a96", "#d49b20", "#d75d42"],
    body: "linear-gradient(135deg,#fff6e8,#e7f7ef 52%,#f9dfd4)",
  },
  P10: {
    palette: ["#f7f3da", "#202417", "#6f9f2d", "#cf8b22", "#bf4b4b"],
    body: "linear-gradient(135deg,#f7f3da,#e4f0c7 52%,#f5d5c7)",
  },
};

function html(cfg) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${cfg.title}: ${cfg.deck}" />
    <title>${cfg.id} ${cfg.title}</title>
  </head>
  <body>
    <main class="shell">
      <canvas id="game" width="1120" height="700" aria-label="${cfg.title} playable game canvas"></canvas>
    </main>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
`;
}

const copy = {
  P03: {
    deck: "Balance each order by using three visible conversion recipes.",
    specific: "Use ore, glass, and signal as resources. Each level shows current stock, exact target stock, and the recipe on every action button so the puzzle teaches conversion, scarcity, and reversibility through play.",
    controls: "Click a recipe button. R resets the current ledger.",
  },
  P10: {
    deck: "Rotate three signal mirrors until every festival gate lights.",
    specific: "Rotate three large mirrors to match the required public-play signal pattern before time expires. The board shows which gates are lit, which mirror orientation is needed, and how close the route is to a complete clear.",
    controls: "Click a mirror to rotate it. R restarts the board.",
  },
};

function replaceFunction(source, name, body) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing ${name}`);
  let brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    if (depth === 0) {
      return source.slice(0, start) + body + source.slice(i + 1);
    }
  }
  throw new Error(`Unclosed ${name}`);
}

const sharedPatches = [
  [/rgba\(255,255,255,\.035\)/g, "rgba(24,32,28,.045)"],
  [/rgba\(255,255,255,\.03\)/g, "rgba(24,32,28,.045)"],
  [/rgba\(255,255,255,\.04\)/g, "rgba(24,32,28,.055)"],
  [/rgba\(255,255,255,\.045\)/g, "rgba(24,32,28,.06)"],
  [/rgba\(255,255,255,\.06\)/g, "rgba(24,32,28,.075)"],
  [/rgba\(255,255,255,\.07\)/g, "rgba(255,255,255,.82)"],
  [/rgba\(255,255,255,\.08\)/g, "rgba(24,32,28,.085)"],
  [/rgba\(255,255,255,\.14\)/g, "rgba(24,32,28,.16)"],
  [/rgba\(255,255,255,\.15\)/g, "rgba(24,32,28,.16)"],
  [/rgba\(255,255,255,\.18\)/g, "rgba(24,32,28,.2)"],
  [/rgba\(255,255,255,\.2\)/g, "rgba(24,32,28,.18)"],
  [/rgba\(255,255,255,\.22\)/g, "rgba(24,32,28,.2)"],
  [/rgba\(255,255,255,\.24\)/g, "rgba(24,32,28,.25)"],
  [/rgba\(243,239,225,\.78\)/g, "rgba(24,32,28,.72)"],
  [/rgba\(243,239,225,\.72\)/g, "rgba(24,32,28,.68)"],
  [/rgba\(243,239,225,\.65\)/g, "rgba(24,32,28,.6)"],
  [/rgba\(243,239,225,\.58\)/g, "rgba(24,32,28,.52)"],
];

const shell = `function shell(){
  const g=ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,cfg.palette[0]);
  g.addColorStop(.62,"#ffffff");
  g.addColorStop(1,cfg.palette[0]);
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.globalAlpha=.55;
  if(cfg.kind==="timing"){for(let i=0;i<18;i++){circle(840,360,70+i*28,"transparent",cfg.palette[i%2?2:3]);}}
  else if(cfg.kind==="risk"){for(let i=0;i<16;i++){rect(390+i*38,110+(i%5)*78,26,26,"rgba(36,107,159,.10)");}}
  else if(cfg.kind==="resource"){for(let i=0;i<12;i++){rect(404+i*54,116+(i%3)*38,36,22,"rgba(166,84,45,.10)");}}
  else if(cfg.kind==="bluff"){for(let i=0;i<9;i++){circle(470+i*62,150+(i%2)*48,24,"rgba(125,79,158,.09)");}}
  else if(cfg.kind==="movement"){for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(390+i*75,610);ctx.quadraticCurveTo(420+i*75,500,465+i*75,555);ctx.strokeStyle="rgba(23,130,166,.16)";ctx.lineWidth=5;ctx.stroke();}}
  else if(cfg.kind==="choice"){for(let i=0;i<8;i++){rect(430+i*68,120+i%2*44,42,42,"rgba(47,139,103,.10)");}}
  else if(cfg.kind==="coop"){for(let i=0;i<10;i++){rect(405+i*62,140,38,420,"rgba(45,103,178,.06)");}}
  else if(cfg.kind==="adaptive"){for(let i=0;i<8;i++){circle(500+i*72,180+(i%3)*90,38,"rgba(33,122,159,.08)");}}
  else if(cfg.kind==="toy"){for(let i=0;i<40;i++){circle(420+rnd(i)*560,130+rnd(i+4)*420,4+rnd(i+8)*8,"rgba(26,138,150,.16)");}}
  else if(cfg.kind==="festival"){for(let i=0;i<10;i++){ctx.strokeStyle="rgba(207,139,34,.16)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(390,150+i*42);ctx.lineTo(1060,120+i*48);ctx.stroke();}}
  ctx.restore();
  ctx.strokeStyle="rgba(24,32,28,.22)";
  ctx.lineWidth=2;
  ctx.strokeRect(28,28,W-56,H-56);
  header();
}`;

const header = `function header(){
  text(cfg.id ?? "GDV501-P"+cfg.n,54,56,14,cfg.palette[2],900);
  text(cfg.title,54,94,34,cfg.palette[1],900);
  wrapText(s.message,54,130,360,24,17,"rgba(24,32,28,.72)",650);
  text("Score "+Math.round(s.score),54,215,18,cfg.palette[2],800);
  text(cfg.controls,54,626,17,cfg.palette[1],800);
  text("R restart   F fullscreen",54,654,13,"rgba(24,32,28,.52)",700);
}`;

const menuRender = `function render(){shell(); if(s.mode==="menu"){rect(410,225,570,300,"rgba(255,255,255,.82)","rgba(24,32,28,.18)");wrapText(cfg.deck,450,290,490,40,32,cfg.palette[1],900);wrapText(cfg.generic,450,390,470,25,18,"rgba(24,32,28,.68)",650);text("Press Space or click to begin",450,480,21,cfg.palette[2],900);return;} if(cfg.kind==="timing")renderTiming(); if(cfg.kind==="risk")renderRisk(); if(cfg.kind==="resource")renderResource(); if(cfg.kind==="bluff")renderBluff(); if(cfg.kind==="movement")renderMovement(); if(cfg.kind==="choice")renderChoice(); if(cfg.kind==="coop")renderCoop(); if(cfg.kind==="adaptive")renderAdaptive(); if(cfg.kind==="toy")renderToy(); if(cfg.kind==="festival")renderFestival(); renderLog(); if(s.mode==="complete"){rect(360,235,520,230,"rgba(255,255,255,.92)",cfg.palette[3]);wrapText(s.message,405,310,430,34,27,cfg.palette[1],900);text("Press R to restart",405,405,18,cfg.palette[2],900);}}`;

const drawButton = `function drawButton(x,y,w,h,label){rect(x,y,w,h,"rgba(255,255,255,.9)","rgba(24,32,28,.26)");text(label,x+w/2,y+Math.min(34,h/2+7),15,cfg.palette[1],850,"center");}`;

const renderLog = `function renderLog(){const x=cfg.kind==="resource"?845:820;const y=cfg.kind==="resource"?535:500;s.log.forEach((l,i)=>text(l,x,y+i*24,13,"rgba(24,32,28,.66)",700));}`;

const renderResource = `function renderResource(){const l=resourceState();const names=["Ore","Glass","Signal"],keys=["a","b","c"];text("Goal: make CURRENT match TARGET exactly.",430,156,18,cfg.palette[1],900);keys.forEach((k,i)=>{const x=430+i*170;rect(x,190,132,170,"rgba(255,255,255,.88)","rgba(24,32,28,.22)");text(names[i],x+66,225,17,cfg.palette[2],900,"center");text("current",x+66,257,13,"rgba(24,32,28,.55)",800,"center");text(l[k],x+66,307,44,cfg.palette[1],900,"center");text("target "+l.goal[k],x+66,342,15,cfg.palette[3],900,"center");});drawButton(375,430,210,58,"Forge: 2 Ore -> 1 Glass");drawButton(610,430,250,58,"Focus: Ore + Glass -> 2 Signal");drawButton(885,430,190,58,"Reclaim: Signal -> 2 Ore");wrapText("If a recipe cannot be paid for, it does nothing. Solve each ledger in the fewest moves you can.",430,535,390,24,17,"rgba(24,32,28,.66)",650);text("Ledger "+(s.game.level+1)+"/5   Moves "+s.game.moves,430,112,20,cfg.palette[1],900);}`;

const convert = `function convert(type){const l=resourceState(); let changed=false; if(type==="forge"&&l.a>=2){l.a-=2;l.b++;changed=true;} if(type==="focus"&&l.b>=1&&l.a>=1){l.b--;l.a--;l.c+=2;changed=true;} if(type==="reclaim"&&l.c>=1){l.c--;l.a+=2;changed=true;} if(changed){s.game.moves++; addLog(type+" recipe applied.");} else addLog("Not enough resources for "+type+"."); const g=l.goal; if(l.a===g.a&&l.b===g.b&&l.c===g.c){addLog("Ledger "+(s.game.level+1)+" balanced."); if(s.game.level===4)finish("All five ledgers balanced in "+s.game.moves+" moves."); else s.game.level++;}}`;

const resourceInit = `function initResource(){
  s.game={level:0,moves:0,levels:[
    {a:4,b:0,c:0,goal:{a:1,b:1,c:1}},
    {a:6,b:1,c:0,goal:{a:0,b:3,c:1}},
    {a:3,b:2,c:1,goal:{a:2,b:0,c:4}},
    {a:8,b:0,c:2,goal:{a:1,b:4,c:2}},
    {a:5,b:3,c:0,goal:{a:0,b:1,c:5}},
  ]};
  s.message="Use the recipe buttons to transform CURRENT stock until it matches the TARGET numbers exactly.";
}`;

const festivalInit = `function initFestival(){s.game={time:150,mirrors:[{x:360,y:350,a:0,goal:1,label:"A"},{x:600,y:350,a:2,goal:3,label:"B"},{x:840,y:350,a:1,goal:0,label:"C"}],gates:[{x:460,y:260,on:false},{x:700,y:440,on:false},{x:940,y:300,on:false}]};s.message="Click mirrors until each face points at its matching gate: A up-right, B down-right, C straight right.";}`;

const festivalClick = `function clickFestival(x,y){const m=s.game.mirrors.find(m=>dist(x,y,m.x,m.y)<54); if(m){m.a=(m.a+1)%4; addLog("Mirror "+m.label+" rotated to "+["right","up-right","down-left","down-right"][m.a]+".");}}`;

const festivalUpdate = `function updateFestival(dt){const g=s.game;g.time-=dt;if(g.time<=0)fail("Festival clock expired. Gates lit: "+g.gates.filter(x=>x.on).length+"/3.");g.gates.forEach((gt,i)=>gt.on=g.mirrors[i].a===g.mirrors[i].goal);if(g.gates.every(gt=>gt.on))finish("All three gates lit. Festival-ready clear.");}`;

const festivalRender = `function renderFestival(){const g=s.game;text("Rotate mirrors to the target labels before the clock expires.",430,112,18,cfg.palette[1],900);g.gates.forEach((gt,i)=>{circle(gt.x,gt.y,34,gt.on?cfg.palette[2]:"rgba(24,32,28,.08)",gt.on?cfg.palette[2]:"rgba(24,32,28,.28)");text("Gate "+(i+1),gt.x,gt.y+62,14,cfg.palette[1],800,"center");});ctx.strokeStyle=cfg.palette[3];ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,350);ctx.lineTo(1030,350);ctx.stroke();g.mirrors.forEach((m,i)=>{ctx.save();ctx.translate(m.x,m.y);ctx.rotate([0,-Math.PI/4,Math.PI,Math.PI/4][m.a]);rect(-48,-7,96,14,cfg.palette[3],"rgba(24,32,28,.28)");ctx.restore();circle(m.x,m.y,54,"rgba(255,255,255,.72)","rgba(24,32,28,.25)");text(m.label,m.x,m.y+8,24,cfg.palette[1],900,"center");text("target "+["right","up-right","down-left","down-right"][m.goal],m.x,m.y+82,14,cfg.palette[2],900,"center");});text("Clock "+Math.ceil(g.time)+"   Gates "+g.gates.filter(x=>x.on).length+"/3",430,610,18,cfg.palette[1],900);}`;

for (const project of Object.keys(themes)) {
  const dir = path.join(courseRoot, project);
  const mainPath = path.join(dir, "src", "main.js");
  let source = await readFile(mainPath, "utf8");
  const cfgMatch = source.match(/const cfg = (\{.*?\});/s);
  if (!cfgMatch) throw new Error(`Missing cfg in ${project}`);
  const cfg = JSON.parse(cfgMatch[1]);
  cfg.palette = themes[project].palette;
  if (copy[project]) Object.assign(cfg, copy[project]);
  source = source.replace(/const cfg = \{.*?\};/s, `const cfg = ${JSON.stringify(cfg)};`);
  for (const [pattern, replacement] of sharedPatches) source = source.replace(pattern, replacement);
  source = replaceFunction(source, "header", header);
  source = replaceFunction(source, "shell", shell);
  source = replaceFunction(source, "drawButton", drawButton);
  source = replaceFunction(source, "renderLog", renderLog);
  source = replaceFunction(source, "render", menuRender);
  if (project === "P03") {
    source = replaceFunction(source, "initResource", resourceInit);
    source = replaceFunction(source, "renderResource", renderResource);
    source = replaceFunction(source, "convert", convert);
    source = source.replace(/if\(x>426\+i\*165&&x<562\+i\*165&&y>450&&y<504\)convert\(b\);|const boxes=\[\[[^\n]*?\]\];const box=boxes\[i\];if\(x>box\[0\]&&x<box\[0\]\+box\[2\]&&y>box\[1\]&&y<box\[1\]\+box\[3\]\)convert\(b\);/, `const boxes=[[375,430,210,58],[610,430,250,58],[885,430,190,58]];const box=boxes[i];if(x>box[0]&&x<box[0]+box[2]&&y>box[1]&&y<box[1]+box[3])convert(b);`);
  }
  if (project === "P10") {
    source = replaceFunction(source, "initFestival", festivalInit);
    source = replaceFunction(source, "clickFestival", festivalClick);
    source = replaceFunction(source, "updateFestival", festivalUpdate);
    source = replaceFunction(source, "renderFestival", festivalRender);
  }
  await writeFile(mainPath, source, "utf8");
  await writeFile(path.join(dir, "index.html"), html(cfg), "utf8");

  const styles = `:root{color-scheme:light;--bg:${themes[project].palette[0]};--fg:${themes[project].palette[1]}}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:${themes[project].body};color:var(--fg);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{overflow:hidden}.shell{min-height:100vh;display:grid;place-items:center;padding:18px;background:${themes[project].body}}canvas{width:min(100%,1120px);height:auto;max-height:calc(100vh - 36px);aspect-ratio:1120/700;border:1px solid rgba(24,32,28,.22);box-shadow:0 24px 70px rgba(24,32,28,.18);background:var(--bg)}`;
  await writeFile(path.join(dir, "src", "styles.css"), styles, "utf8");

  const readmePath = path.join(dir, "README.md");
  let readme = await readFile(readmePath, "utf8");
  if (copy[project]) {
    readme = readme
      .replace(/## Specific Execution\n\n[\s\S]*?\n\n## Design Standard/, `## Specific Execution\n\n${copy[project].specific}\n\n## Design Standard`)
      .replace(/## Controls\n\n[\s\S]*?\n\n## Build Instructions/, `## Controls\n\n${copy[project].controls}\n\n## Build Instructions`);
    await writeFile(readmePath, readme, "utf8");
    const projectJsonPath = path.join(dir, "project.json");
    const metadata = JSON.parse(await readFile(projectJsonPath, "utf8"));
    metadata.specificDescription = copy[project].specific;
    await writeFile(projectJsonPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  }

  const progressPath = path.join(dir, "progress.md");
  let progress = await readFile(progressPath, "utf8");
  progress += `\n- Reworked visual direction and onboarding after critique: lighter bespoke palette, clearer controls, and less templated presentation.\n`;
  if (project === "P03") progress += `- Rebuilt ledger presentation with explicit recipe buttons and exact current/target resource language.\n`;
  if (project === "P10") progress += `- Reworked signal puzzle to a legible mirror-orientation board with visible target states.\n`;
  await writeFile(progressPath, progress, "utf8");
}

console.log("Reworked GDV501 exemplar visuals and onboarding.");
