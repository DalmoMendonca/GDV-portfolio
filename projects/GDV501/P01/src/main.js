import "./styles.css";

const cfg = {"n":"01","title":"Chrono Aperture","slug":"chrono-aperture","repo":"GDV501-P01-chrono-aperture","kind":"timing","deck":"One button. Nine commitments. Three shrinking timing windows.","generic":"Design with extreme input constraint; create readable anticipation, action, and result states; tune difficulty through timing windows.","specific":"Press once as the moving needle enters the active aperture. Three tiers reduce the perfect window while preserving fair anticipation and clear early, good, perfect, and late feedback.","controls":"Space, click, or tap","palette":["#122022","#e9f1e7","#58d6c9","#f2bb5c","#e45f46"],"id":"GDV501-P01"};
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = 1120;
const H = 700;
const TAU = Math.PI * 2;
const keys = new Set();
const pointer = { x: W / 2, y: H / 2, down: false };
let last = 0;

const s = {
  mode: "menu",
  t: 0,
  score: 0,
  message: cfg.deck,
  log: [],
  started: false,
  game: {},
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist(a, b, c, d) { return Math.hypot(a - c, b - d); }
function lerp(a, b, t) { return a + (b - a) * t; }
function wrap(v, max) { return ((v % max) + max) % max; }
function rnd(seed) { const x = Math.sin(seed * 999.91) * 43758.5453; return x - Math.floor(x); }
function down(...names) { return names.some((name) => keys.has(name)); }
function addLog(text) { s.log.unshift(text); s.log = s.log.slice(0, 6); }

function initGame() {
  s.mode = "play";
  s.t = 0;
  s.score = 0;
  s.log = [];
  s.started = true;
  if (cfg.kind === "timing") initTiming();
  if (cfg.kind === "risk") initRisk();
  if (cfg.kind === "resource") initResource();
  if (cfg.kind === "bluff") initBluff();
  if (cfg.kind === "movement") initMovement();
  if (cfg.kind === "choice") initChoice();
  if (cfg.kind === "coop") initCoop();
  if (cfg.kind === "adaptive") initAdaptive();
  if (cfg.kind === "toy") initToy();
  if (cfg.kind === "festival") initFestival();
}

function finish(message) {
  s.mode = "complete";
  s.message = message;
  addLog(message);
}

function fail(message) {
  s.mode = "complete";
  s.message = message;
  addLog(message);
}

function initTiming() {
  s.game = { tier: 0, attempt: 1, angle: -1.2, target: 4.7, score: 0, last: "Ready", pulse: 0, history: [] };
  s.message = "Commit when the needle crosses the lit aperture.";
}
function updateTiming(dt) {
  const g = s.game;
  const speed = [1.7, 2.45, 3.3][g.tier];
  g.angle = wrap(g.angle + speed * dt, TAU);
  g.pulse = Math.max(0, g.pulse - dt * 2);
}
function timingAction() {
  const g = s.game;
  const perfect = [0.22, 0.16, 0.11][g.tier];
  const good = [0.58, 0.44, 0.32][g.tier];
  let diff = Math.abs(wrap(g.angle - g.target + Math.PI, TAU) - Math.PI);
  const label = diff <= perfect ? "Perfect" : diff <= good ? "Good" : g.angle < g.target ? "Early" : "Late";
  const pts = label === "Perfect" ? 120 : label === "Good" ? 70 : 20;
  g.score += pts;
  s.score = g.score;
  g.last = label + " +" + pts;
  g.pulse = 1;
  g.history.push(label);
  addLog(g.last);
  if (g.attempt >= 9) finish("Run complete: " + g.score + " points, " + g.history.filter((x) => x === "Perfect").length + " perfect hits.");
  else {
    g.attempt++;
    if ((g.attempt - 1) % 3 === 0) g.tier++;
    g.target = [4.7, 1.1, 2.8][g.tier];
  }
}

function initRisk() {
  s.game = { p:{x:150,y:350,r:16}, gate:{x:1010,y:350,r:34}, level:0, banked:false, mult:1, time:70,
    items:Array.from({length:9},(_,i)=>({x:260+rnd(i)*620,y:110+rnd(i+20)*480,taken:false,value:80+i*15})),
    hazards:Array.from({length:4},(_,i)=>({x:340+rnd(i+50)*520,y:160+rnd(i+60)*360,a:rnd(i+70)*TAU,sp:55+i*12})) };
  s.message = "Collect cores. Each one raises danger. Bank at the right gate whenever your nerve breaks.";
}
function updateRisk(dt) {
  const g=s.game,p=g.p; const sp=220;
  p.x=clamp(p.x+(down("ArrowRight","KeyD")-down("ArrowLeft","KeyA"))*sp*dt,50,W-50);
  p.y=clamp(p.y+(down("ArrowDown","KeyS")-down("ArrowUp","KeyW"))*sp*dt,80,H-70);
  g.time-=dt; if(g.time<=0) fail("Time expired with "+s.score+" bankable points.");
  g.items.forEach((it)=>{ if(!it.taken&&dist(p.x,p.y,it.x,it.y)<28){it.taken=true; g.level++; g.mult+=.2; s.score+=Math.round(it.value*g.mult); addLog("Core taken. Danger multiplier "+g.mult.toFixed(1));}});
  g.hazards.forEach((h,i)=>{h.a+=dt*(.7+i*.16+g.level*.08); h.x+=Math.cos(h.a)*h.sp*dt; h.y+=Math.sin(h.a*1.3)*h.sp*dt; if(h.x<70||h.x>1050)h.a=Math.PI-h.a; if(h.y<95||h.y>610)h.a=-h.a; if(dist(p.x,p.y,h.x,h.y)<25){s.score=Math.max(0,s.score-90); p.x=150;p.y=350; addLog("Collision. Score pressure reset.");}});
  if(g.level===9) finish("All cores collected. Full-risk clear: "+s.score+" points.");
}
function bankRisk(){ const g=s.game,p=g.p; if(dist(p.x,p.y,g.gate.x,g.gate.y)<64) finish("Banked safely at "+s.score+" points after "+g.level+" cores."); else addLog("Bank gate is on the right edge."); }

function initResource(){
  s.game={level:0,moves:0,levels:[
    {a:4,b:0,c:0,goal:{a:1,b:1,c:1}},
    {a:6,b:1,c:0,goal:{a:0,b:3,c:1}},
    {a:3,b:2,c:1,goal:{a:2,b:0,c:4}},
    {a:8,b:0,c:2,goal:{a:1,b:4,c:2}},
    {a:5,b:3,c:0,goal:{a:0,b:1,c:5}},
  ]};
  s.message="Convert ore to glass, glass to signal, or recycle signal. Meet each ledger exactly.";
}
function resourceState(){return s.game.levels[s.game.level];}
function convert(type){const l=resourceState(); if(type==="forge"&&l.a>=2){l.a-=2;l.b++;s.game.moves++;} if(type==="focus"&&l.b>=1&&l.a>=1){l.b--;l.a--;l.c+=2;s.game.moves++;} if(type==="reclaim"&&l.c>=1){l.c--;l.a+=2;s.game.moves++;} const g=l.goal; if(l.a===g.a&&l.b===g.b&&l.c===g.c){addLog("Level "+(s.game.level+1)+" balanced."); if(s.game.level===4)finish("All five ledgers balanced in "+s.game.moves+" moves."); else s.game.level++;}}

function initBluff(){s.game={round:1,wins:0,losses:0,hand:0,bot:0,tell:"",recap:[]}; dealBluff(); s.message="Read the tell. Probe reveals more. Feint punishes overconfidence. Commit wins high value.";}
function dealBluff(){const g=s.game; g.hand=1+Math.floor(rnd(g.round+s.t+3)*9); g.bot=1+Math.floor(rnd(g.round+22)*9); g.tell=g.bot>=7?"Bot steadies the coin.":g.bot<=3?"Bot keeps touching the discard.":"Bot watches your hand, not the pot.";}
function bluff(action){const g=s.game; let out=""; if(action==="probe"){out="Probe: hidden value is "+(g.bot>=6?"high.":g.bot<=3?"low.":"uncertain.");}
 if(action==="feint"){const ok=g.bot>=7; ok?g.wins++:g.losses++; out=ok?"Feint worked against a strong hidden card.":"Feint failed; no pressure to exploit.";}
 if(action==="commit"){const ok=g.hand>=g.bot; ok?g.wins++:g.losses++; out="You "+(ok?"won":"lost")+" "+g.hand+" vs hidden "+g.bot+".";}
 addLog(out); g.recap.push(out); if(action!=="probe"){ if(g.round>=5)finish("Match over: "+g.wins+" wins, "+g.losses+" losses. Recap preserves every reveal."); else {g.round++; dealBluff();}}}

function initMovement(){s.game={room:0,p:{x:90,y:530,vx:0,vy:0,r:15,charge:0,on:false},rooms:[0,1,2,3,4]}; s.message="Hold Space to charge the dash. Release toward the landing lane.";}
function updateMovement(dt){const g=s.game,p=g.p; const left=down("ArrowLeft","KeyA"),right=down("ArrowRight","KeyD"); p.vx+=((right-left)*460-p.vx*5)*dt; p.vy+=900*dt; if(down("Space"))p.charge=clamp(p.charge+dt,0,1); p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.y>550){p.y=550;p.vy=0;p.on=true;} if(p.x<40||p.x>1080){p.x=clamp(p.x,40,1080);p.vx*=-.2;} const goalX=980, hazardX=360+g.room*90; if(dist(p.x,p.y,hazardX,535)<28){p.x=90;p.y=530;p.vx=0;p.vy=0; addLog("Hazard clipped. Room reset.");} if(p.x>goalX){ if(g.room===4)finish("Five-room dash study complete."); else {g.room++; p.x=90;p.y=530;p.vx=0;p.vy=0; addLog("Room "+(g.room+1));}}}
function releaseDash(){const p=s.game.p;if(p.charge>.08){p.vx+=520*p.charge*(down("ArrowLeft","KeyA")?-1:1);p.vy-=360*p.charge;p.charge=0;}}

function initChoice(){s.game={step:0,trust:5,budget:5,access:5,choices:[]}; s.message="Each public choice rewrites future costs and ending conditions.";}
function choose(i){const g=s.game; const table=[["Fund transit",1,-2,2],["Cut taxes",-2,2,-1],["Open records",2,-1,1],["Emergency powers",-3,1,-2],["Mutual aid",2,-2,2],["Private contract",-2,2,-2],["Public audit",2,-1,1],["Quiet settlement",-1,1,-1],["Citizen assembly",3,-2,3]]; const c=table[g.step*3+i]; g.trust=clamp(g.trust+c[1],0,10); g.budget=clamp(g.budget+c[2],0,10); g.access=clamp(g.access+c[3],0,10); g.choices.push(c[0]); addLog(c[0]); g.step++; if(g.step>=3){const label=g.trust+g.access+g.budget>=18?"durable coalition":"fragile compromise"; finish(label+": trust "+g.trust+", budget "+g.budget+", access "+g.access+".");}}

function initCoop(){s.game={room:0,active:"heavy",heavy:{x:110,y:510},light:{x:160,y:430},key:false,beam:true}; s.message="Use two asymmetric roles. Heavy anchors. Light reaches. Both must exit.";}
function updateCoop(dt){const g=s.game,a=g[g.active],sp=g.active==="heavy"?150:230; a.x=clamp(a.x+(down("ArrowRight","KeyD")-down("ArrowLeft","KeyA"))*sp*dt,60,1060); a.y=clamp(a.y+(down("ArrowDown","KeyS")-down("ArrowUp","KeyW"))*sp*dt,120,560); if(g.active==="light"&&dist(a.x,a.y,760,250)<38){g.key=true; addLog("Light recovered the key.");} if(g.heavy.x>430&&g.heavy.x<540&&g.heavy.y>470)g.beam=false; else g.beam=true; if(g.key&&!g.beam&&g.heavy.x>930&&g.light.x>930){ if(g.room===3)finish("Four asymmetric encounters complete."); else {g.room++;g.heavy={x:110,y:510};g.light={x:160,y:430};g.key=false;g.beam=true;addLog("Encounter "+(g.room+1));}}}

function initAdaptive(){s.game={p:{x:W/2,y:H/2},time:60,hits:0,near:0,level:1,marks:[],waves:[]}; s.message="The director adapts using hits, near misses, and collection rate. The report is visible.";}
function updateAdaptive(dt){const g=s.game,p=g.p;p.x=clamp(p.x+(down("ArrowRight","KeyD")-down("ArrowLeft","KeyA"))*230*dt,70,1050);p.y=clamp(p.y+(down("ArrowDown","KeyS")-down("ArrowUp","KeyW"))*230*dt,95,610);g.time-=dt;if(g.time<=0)finish("Director report: level "+g.level+", hits "+g.hits+", near misses "+g.near+", score "+s.score+"."); if(Math.floor(s.t*2)%3===0&&g.marks.length<5)g.marks.push({x:100+rnd(s.t+g.marks.length)*900,y:110+rnd(s.t+9)*460}); if(Math.floor(s.t*(.7+g.level*.18))!==Math.floor((s.t-dt)*(.7+g.level*.18)))g.waves.push({x:rnd(s.t)*W,y:90,r:14,vy:95+g.level*25});g.waves.forEach(w=>{w.y+=w.vy*dt;if(dist(p.x,p.y,w.x,w.y)<24){g.hits++;g.level=Math.max(1,g.level-.4);w.y=999;addLog("Director softened after a hit.");} else if(dist(p.x,p.y,w.x,w.y)<54)g.near+=dt;});g.waves=g.waves.filter(w=>w.y<680);g.marks=g.marks.filter(m=>{if(dist(p.x,p.y,m.x,m.y)<26){s.score+=25;g.level=clamp(g.level+.2,1,5);return false}return true});}

function initToy(){s.game={time:70,mode:"toy",particles:Array.from({length:40},(_,i)=>({x:120+rnd(i)*880,y:100+rnd(i+4)*500,vx:(rnd(i+9)-.5)*80,vy:(rnd(i+19)-.5)*80,caught:false})),rings:[{x:260,y:350,r:44},{x:560,y:240,r:44},{x:850,y:430,r:44}]};s.message="A toy field with a game layer: herd motes into scoring rings.";}
function updateToy(dt){const g=s.game;g.time-=dt;if(g.time<=0)finish("Toy converted to game: "+s.score+" ring captures.");g.particles.forEach((p)=>{const d=Math.max(35,dist(p.x,p.y,pointer.x,pointer.y));const force=(pointer.down||down("Space")?1:down("ShiftLeft","ShiftRight")?-1:0)*900/(d*d);p.vx+=(pointer.x-p.x)*force*dt;p.vy+=(pointer.y-p.y)*force*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;p.vy*=.992;p.x=wrap(p.x,W);p.y=wrap(p.y,H);g.rings.forEach(r=>{if(!p.caught&&dist(p.x,p.y,r.x,r.y)<r.r){p.caught=true;s.score+=10;}});});}

function initFestival(){s.game={time:180,beam:{x:90,y:350,dir:0},mirrors:[{x:300,y:250,a:1},{x:515,y:445,a:0},{x:735,y:260,a:1},{x:920,y:420,a:0}],gates:[{x:420,y:280,on:false},{x:650,y:430,on:false},{x:870,y:315,on:false}]};s.message="Click mirrors to rotate the signal through three public-play gates.";}
function clickFestival(x,y){const m=s.game.mirrors.find(m=>dist(x,y,m.x,m.y)<42); if(m){m.a=(m.a+1)%4; addLog("Mirror rotated.");}}
function updateFestival(dt){const g=s.game;g.time-=dt;if(g.time<=0)fail("Festival clock expired. Gates lit: "+g.gates.filter(x=>x.on).length+"/3.");g.gates.forEach(gt=>gt.on=false);let x=90,y=350,dir=0;for(let step=0;step<900;step+=8){x+=Math.cos(dir)*8;y+=Math.sin(dir)*8;g.gates.forEach(gt=>{if(dist(x,y,gt.x,gt.y)<24)gt.on=true;});const m=g.mirrors.find(m=>dist(x,y,m.x,m.y)<28);if(m){dir=(m.a%2===0? -dir: Math.PI-dir);x+=Math.cos(dir)*24;y+=Math.sin(dir)*24;}if(x<0||x>W||y<80||y>H)break;}if(g.gates.every(gt=>gt.on))finish("All three gates lit. Festival-ready clear.");}

function update(dt) {
  if (s.mode !== "play") return;
  s.t += dt;
  if (cfg.kind === "timing") updateTiming(dt);
  if (cfg.kind === "risk") updateRisk(dt);
  if (cfg.kind === "movement") updateMovement(dt);
  if (cfg.kind === "coop") updateCoop(dt);
  if (cfg.kind === "adaptive") updateAdaptive(dt);
  if (cfg.kind === "toy") updateToy(dt);
  if (cfg.kind === "festival") updateFestival(dt);
}

function rect(x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);}}
function text(t,x,y,size=18,color=cfg.palette[1],weight=600,align="left"){ctx.fillStyle=color;ctx.font=weight+" "+size+"px Inter, Segoe UI, sans-serif";ctx.textAlign=align;ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
function wrapText(t,x,y,w,lh,size=18,color=cfg.palette[1],weight=600,align="left"){ctx.font=weight+" "+size+"px Inter, Segoe UI, sans-serif";let line="";for(const word of t.split(" ")){const test=line?line+" "+word:word;if(ctx.measureText(test).width>w&&line){text(line,x,y,size,color,weight,align);line=word;y+=lh;}else line=test;}if(line)text(line,x,y,size,color,weight,align);}
function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function header(){text(cfg.id ?? "GDV501-P"+cfg.n,54,56,14,cfg.palette[3],900);text(cfg.title,54,91,34,cfg.palette[1],900);wrapText(s.message,54,125,360,24,17,"rgba(243,239,225,.78)",650);text("Score "+Math.round(s.score),54,210,18,cfg.palette[3],800);text(cfg.controls,54,626,17,cfg.palette[1],800);text("R restart   F fullscreen",54,654,13,"rgba(243,239,225,.58)",700);}
function shell(){ctx.fillStyle=cfg.palette[0];ctx.fillRect(0,0,W,H);for(let i=0;i<18;i++){ctx.strokeStyle="rgba(255,255,255,.035)";ctx.beginPath();ctx.moveTo(0,80+i*34);ctx.lineTo(W,80+i*34);ctx.stroke();}ctx.strokeStyle="rgba(255,255,255,.14)";ctx.strokeRect(28,28,W-56,H-56);header();}

function renderTiming(){const g=s.game,cx=630,cy=356,r=162;circle(cx,cy,r,"rgba(255,255,255,.035)","rgba(255,255,255,.2)");const good=[0.58,0.44,0.32][g.tier],perfect=[0.22,0.16,0.11][g.tier];ctx.lineWidth=26;ctx.lineCap="round";ctx.strokeStyle="rgba(255,255,255,.2)";ctx.beginPath();ctx.arc(cx,cy,r,g.target-good,g.target+good);ctx.stroke();ctx.strokeStyle=cfg.palette[2];ctx.lineWidth=30;ctx.beginPath();ctx.arc(cx,cy,r,g.target-perfect,g.target+perfect);ctx.stroke();ctx.strokeStyle=cfg.palette[3];ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(g.angle)*r,cy+Math.sin(g.angle)*r);ctx.stroke();circle(cx+Math.cos(g.angle)*r,cy+Math.sin(g.angle)*r,15,cfg.palette[3]);text(g.attempt+"/9",cx,cy+10,34,cfg.palette[1],900,"center");text(g.last,850,300,28,cfg.palette[3],900);}
function renderRisk(){const g=s.game;circle(g.gate.x,g.gate.y,g.gate.r,"rgba(255,255,255,.04)",cfg.palette[3]);g.items.forEach(it=>!it.taken&&circle(it.x,it.y,12,cfg.palette[3]));g.hazards.forEach(h=>circle(h.x,h.y,16,cfg.palette[4]));circle(g.p.x,g.p.y,g.p.r,cfg.palette[2]);text("Risk x"+g.mult.toFixed(1)+"  Time "+Math.ceil(g.time),760,92,18,cfg.palette[1],800);}
function renderResource(){const l=resourceState();["a","b","c"].forEach((k,i)=>{rect(450+i*130,230,94,120,"rgba(255,255,255,.045)","rgba(255,255,255,.18)");text(["Ore","Glass","Signal"][i],497+i*130,265,16,cfg.palette[3],900,"center");text(l[k],497+i*130,327,42,cfg.palette[1],900,"center");text("goal "+l.goal[k],497+i*130,368,14,"rgba(243,239,225,.65)",700,"center");});["forge","focus","reclaim"].forEach((b,i)=>drawButton(426+i*165,450,136,54,b));text("Level "+(s.game.level+1)+"/5   Moves "+s.game.moves,450,178,20,cfg.palette[1],800);}
function renderBluff(){const g=s.game;rect(455,220,140,190,"rgba(255,255,255,.06)",cfg.palette[2]);rect(690,220,140,190,"rgba(255,255,255,.035)",cfg.palette[4]);text(String(g.hand),525,330,72,cfg.palette[1],900,"center");text("?",760,330,72,cfg.palette[1],900,"center");wrapText(g.tell,455,455,380,26,20,cfg.palette[3],800);["probe","feint","commit"].forEach((b,i)=>drawButton(420+i*155,520,130,54,b));text("Round "+g.round+"/5  Wins "+g.wins+" Losses "+g.losses,455,178,20,cfg.palette[1],800);}
function renderMovement(){const g=s.game,p=g.p;rect(420,570,620,16,"rgba(255,255,255,.22)");circle(360+g.room*90,550,24,cfg.palette[4]);rect(960,500,62,86,"rgba(255,255,255,.04)",cfg.palette[3]);circle(p.x,p.y,p.r,cfg.palette[2]);rect(450,96,260*p.charge,10,cfg.palette[3]);text("Room "+(g.room+1)+"/5",450,178,20,cfg.palette[1],800);}
function renderChoice(){const g=s.game;["Trust","Budget","Access"].forEach((n,i)=>{text(n,450,170+i*48,16,cfg.palette[1],800);rect(540,154+i*48,220,18,"rgba(255,255,255,.08)");rect(540,154+i*48,22*[g.trust,g.budget,g.access][i],18,[cfg.palette[2],cfg.palette[3],cfg.palette[4]][i]);});const labels=[["Fund transit","Cut taxes","Open records"],["Emergency powers","Mutual aid","Private contract"],["Public audit","Quiet settlement","Citizen assembly"]][g.step]||[];labels.forEach((b,i)=>drawButton(430,330+i*75,300,54,b));text("Decision "+(g.step+1)+"/3",450,280,22,cfg.palette[1],900);}
function renderCoop(){const g=s.game;rect(420,590,640,14,"rgba(255,255,255,.2)");rect(430,510,110,64,g.beam?"rgba(238,111,134,.35)":"rgba(118,166,255,.16)",g.beam?cfg.palette[4]:cfg.palette[2]);circle(760,250,18,g.key?"rgba(255,255,255,.15)":cfg.palette[3]);circle(g.heavy.x,g.heavy.y,24,g.active==="heavy"?cfg.palette[3]:"#6b7280");circle(g.light.x,g.light.y,16,g.active==="light"?cfg.palette[2]:"#6b7280");rect(940,510,82,74,"rgba(255,255,255,.04)",cfg.palette[2]);text("Active: "+g.active+"   Key "+(g.key?"yes":"no")+"   Beam "+(g.beam?"on":"off"),430,178,18,cfg.palette[1],800);}
function renderAdaptive(){const g=s.game;g.marks.forEach(m=>circle(m.x,m.y,12,cfg.palette[3]));g.waves.forEach(w=>circle(w.x,w.y,w.r,cfg.palette[4]));circle(g.p.x,g.p.y,16,cfg.palette[2]);text("Director level "+g.level.toFixed(1)+"  Hits "+g.hits+"  Near "+Math.round(g.near),430,92,18,cfg.palette[1],800);text("Time "+Math.ceil(g.time),430,124,18,cfg.palette[3],800);}
function renderToy(){const g=s.game;g.rings.forEach(r=>circle(r.x,r.y,r.r,"rgba(255,255,255,.035)",cfg.palette[3]));g.particles.forEach(p=>circle(p.x,p.y,p.caught?5:8,p.caught?"rgba(255,255,255,.18)":cfg.palette[2]));circle(pointer.x,pointer.y,20,pointer.down||down("Space")?"rgba(246,200,95,.42)":"rgba(255,255,255,.08)",cfg.palette[3]);text("Time "+Math.ceil(g.time)+"  Captures "+s.score/10,430,92,18,cfg.palette[1],800);}
function renderFestival(){const g=s.game;g.gates.forEach(gt=>circle(gt.x,gt.y,26,gt.on?cfg.palette[2]:"rgba(255,255,255,.045)",gt.on?cfg.palette[2]:cfg.palette[1]));g.mirrors.forEach(m=>{ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.a*Math.PI/4);rect(-34,-5,68,10,cfg.palette[3]);ctx.restore();circle(m.x,m.y,36,"rgba(255,255,255,.03)","rgba(255,255,255,.14)");});ctx.strokeStyle=cfg.palette[3];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(90,350);ctx.lineTo(1040,350);ctx.stroke();text("Clock "+Math.ceil(g.time)+"  Gates "+g.gates.filter(x=>x.on).length+"/3",430,92,18,cfg.palette[1],800);}
function drawButton(x,y,w,h,label){rect(x,y,w,h,"rgba(255,255,255,.07)","rgba(255,255,255,.24)");text(label,x+w/2,y+34,17,cfg.palette[1],850,"center");}
function renderLog(){s.log.forEach((l,i)=>text(l,820,500+i*26,14,"rgba(243,239,225,.72)",700));}
function render(){shell(); if(s.mode==="menu"){wrapText(cfg.deck,430,275,520,42,36,cfg.palette[1],900);wrapText(cfg.generic,430,385,480,25,18,"rgba(243,239,225,.72)",650);text("Press Space or click to begin",430,488,21,cfg.palette[3],900);return;} if(cfg.kind==="timing")renderTiming(); if(cfg.kind==="risk")renderRisk(); if(cfg.kind==="resource")renderResource(); if(cfg.kind==="bluff")renderBluff(); if(cfg.kind==="movement")renderMovement(); if(cfg.kind==="choice")renderChoice(); if(cfg.kind==="coop")renderCoop(); if(cfg.kind==="adaptive")renderAdaptive(); if(cfg.kind==="toy")renderToy(); if(cfg.kind==="festival")renderFestival(); renderLog(); if(s.mode==="complete"){rect(360,235,520,230,"rgba(0,0,0,.72)",cfg.palette[3]);wrapText(s.message,405,310,430,34,27,cfg.palette[1],900);text("Press R to restart",405,405,18,cfg.palette[3],900);}}

function click(x,y){ if(s.mode==="menu"){initGame(); return;} if(s.mode==="complete")return; if(cfg.kind==="resource"){["forge","focus","reclaim"].forEach((b,i)=>{if(x>426+i*165&&x<562+i*165&&y>450&&y<504)convert(b);});} if(cfg.kind==="bluff"){["probe","feint","commit"].forEach((b,i)=>{if(x>420+i*155&&x<550+i*155&&y>520&&y<574)bluff(b);});} if(cfg.kind==="choice"){[0,1,2].forEach(i=>{if(x>430&&x<730&&y>330+i*75&&y<384+i*75)choose(i);});} if(cfg.kind==="festival")clickFestival(x,y); if(cfg.kind==="timing")timingAction(); if(cfg.kind==="risk")bankRisk();}
function keyAction(e,up=false){ if(up){keys.delete(e.code); if(cfg.kind==="movement"&&e.code==="Space")releaseDash(); return;} keys.add(e.code); if(e.code==="KeyR"){initGame(); return;} if(e.code==="KeyF"){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();} if((e.code==="Space"||e.code==="Enter")&&s.mode==="menu")initGame(); else if(e.code==="Space"&&cfg.kind==="timing"&&s.mode==="play")timingAction(); else if(e.code==="Space"&&cfg.kind==="risk"&&s.mode==="play")bankRisk(); else if(e.code==="Tab"&&cfg.kind==="coop"&&s.mode==="play"){e.preventDefault();s.game.active=s.game.active==="heavy"?"light":"heavy";}}
window.addEventListener("keydown",(e)=>{if(!e.repeat)keyAction(e,false);});
window.addEventListener("keyup",(e)=>keyAction(e,true));
canvas.addEventListener("pointermove",(e)=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;});
canvas.addEventListener("pointerdown",(e)=>{pointer.down=true;const r=canvas.getBoundingClientRect();click((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);});
canvas.addEventListener("pointerup",()=>{pointer.down=false;});
function frame(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;update(dt);render();requestAnimationFrame(frame);}
window.render_game_to_text=()=>JSON.stringify({id:"GDV501-P"+cfg.n,title:cfg.title,mode:s.mode,score:Math.round(s.score),message:s.message,game:s.game,log:s.log,coordinateSystem:"1120x700 canvas, origin top-left"});
window.advanceTime=(ms)=>{const steps=Math.max(1,Math.round(ms/16.667));for(let i=0;i<steps;i++)update(1/60);render();};
render();requestAnimationFrame(frame);
