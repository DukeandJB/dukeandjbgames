// Disaster Road — road + walls + a movable square + random disasters.
// Move: drag your finger, or arrow keys / WASD.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const INK    = '#16130F';
const PAPER  = '#FBF3E4';
const GREEN1 = '#3caa3c';
const GREEN2 = '#50c850';
const SEA    = '#0E5FD8';
const FLAME  = '#FF4A1C';

// ---- layout ----
const ROAD_TILES = 7;
const COLS = ROAD_TILES + 2;   // a wall each side
const LEN  = 52;               // road length in tiles

let W, H, tile, offsetX, roadPixelW, worldH, roadLeft, roadRight;

const trophy = { x: 0, y: 0, r: 0, got: 0 };
let score = 0;
let best = Number(localStorage.getItem('disasterRoadBest') || 0);

// squid ink: puddles on the floor + a splatter that covers your screen
let inkSpots = [];
let inkTimer = 2.0;
let inkScreen = 0;              // seconds of ink left on the screen
const inkBlobs = [];
for (let i = 0; i < 14; i++) {
  inkBlobs.push({ fx: Math.random(), fy: Math.random(), fr: 0.12 + Math.random() * 0.22 });
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  tile = Math.floor(W / COLS);
  roadPixelW = tile * COLS;
  offsetX = Math.floor((W - roadPixelW) / 2);
  worldH = LEN * tile;
  roadLeft  = tile;
  roadRight = tile * (COLS - 1);
  trophy.x = roadPixelW / 2;
  trophy.y = tile * 2;
  trophy.r = tile * 0.7;
}
window.addEventListener('resize', resize);
resize();

// ---- player ----
const player = { x: 0, y: 0, r: 0 };
function startPlayer() {
  player.r = tile * 0.36;
  player.x = roadPixelW / 2;
  player.y = worldH - tile * 4;
}
startPlayer();

let flash = null;   // {text, t}
function reset(text) {
  startPlayer();
  disasters = [];
  target.active = false;
  inkScreen = 0;
  if (text) flash = { text, t: 1 };
}

// ---- input ----
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const target = { x: 0, y: 0, active: false };
let camY = 0;
function pointerWorld(e) {
  const rect = canvas.getBoundingClientRect();
  const wx = e.clientX - rect.left - offsetX;
  let wy = e.clientY - rect.top + camY;
  if (e.pointerType === 'touch') wy -= tile * 1.8;   // keep square above the thumb
  return { wx, wy };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = pointerWorld(e);
  target.x = p.wx; target.y = p.wy; target.active = true;
});
canvas.addEventListener('pointermove', e => {
  if (!target.active) return;
  const p = pointerWorld(e);
  target.x = p.wx; target.y = p.wy;
});
window.addEventListener('pointerup', () => { target.active = false; });

// ---- disasters ----
let disasters = [];
let spawnIn = 1.5;                                   // seconds until next
function randomRange(a, b) { return a + Math.random() * (b - a); }

function spawnRandom() {
  const kinds = ['tornado', 'fireball', 'lava', 'avalanche'];
  spawn(kinds[Math.floor(Math.random() * kinds.length)]);
  spawnIn = randomRange(1.2, 3.2);                   // random gap till the next one
}

function spawnInk() {
  inkSpots.push({
    x: roadLeft + Math.random() * (roadRight - roadLeft),
    y: player.y - randomRange(tile * 4, tile * 12),  // on the road ahead of you
    r: tile * 0.7, touched: false, fade: 1
  });
}

function spawn(kind) {
  if (kind === 'lava') {
    disasters.push({ kind, y: camY + H + tile, speed: tile * 3.6 });
  } else if (kind === 'avalanche') {
    const gapW = tile * 2.2;                          // a pocket to slip through
    const gapStart = Math.random() < 0.5 ? roadLeft : (roadRight - gapW);
    disasters.push({ kind, y: camY - tile, speed: tile * 3.4, gapStart, gapEnd: gapStart + gapW });
  } else if (kind === 'tornado') {
    disasters.push({
      kind, x: roadLeft + Math.random() * (roadRight - roadLeft),
      y: camY - tile, speed: tile * 7.0,
      xdir: Math.random() < 0.5 ? 1 : -1, xspeed: tile * 4.6, r: tile * 1.0, spin: 0
    });
  } else { // fireball
    disasters.push({
      kind, x: roadPixelW / 2, y: camY - tile,
      speed: tile * 5.6, xspeed: tile * 3.4, r: tile * 0.62, spin: 0
    });
  }
}

function updateDisasters(dt) {
  for (const d of disasters) {
    if (d.kind === 'lava') {
      d.y -= d.speed * dt;                            // rises up from behind
    } else if (d.kind === 'avalanche') {
      d.y += d.speed * dt;                            // sweeps down from the top
    } else if (d.kind === 'tornado') {
      d.y += d.speed * dt;
      d.x += d.xdir * d.xspeed * dt;
      if (d.x <= roadLeft + d.r * 0.4)  { d.x = roadLeft + d.r * 0.4;  d.xdir = 1; }
      if (d.x >= roadRight - d.r * 0.4) { d.x = roadRight - d.r * 0.4; d.xdir = -1; }
      d.spin += dt * 12;
    } else { // fireball chases your lane
      d.y += d.speed * dt;
      const step = d.xspeed * dt;
      if (Math.abs(player.x - d.x) <= step) d.x = player.x;
      else d.x += player.x > d.x ? step : -step;
      d.spin += dt * 6;
    }
  }
  for (const d of disasters) {
    if (d.kind === 'lava') {
      if (player.y + player.r * 0.4 >= d.y) { reset('caught by the lava!'); return; }
    } else if (d.kind === 'avalanche') {
      const inGap = player.x > d.gapStart && player.x < d.gapEnd;
      if (!inGap && player.y - player.r * 0.4 <= d.y) { reset('buried by the snow!'); return; }
    } else {
      if (Math.hypot(player.x - d.x, player.y - d.y) < player.r + d.r * 0.8) {
        reset(d.kind === 'tornado' ? 'caught by the tornado!' : 'caught by the fireball!');
        return;
      }
    }
  }
  disasters = disasters.filter(d =>
    d.kind === 'lava' ? d.y > camY - tile * 2 : d.y < camY + H + tile * 2);
}

// ---- update ----
function update(dt) {
  let vx = 0, vy = 0;
  const speed = tile * 5.4;
  if (keys['arrowleft'] || keys['a']) vx -= 1;
  if (keys['arrowright'] || keys['d']) vx += 1;
  if (keys['arrowup'] || keys['w']) vy -= 1;
  if (keys['arrowdown'] || keys['s']) vy += 1;
  if (vx || vy) {
    const m = Math.hypot(vx, vy);
    player.x += (vx / m) * speed * dt;
    player.y += (vy / m) * speed * dt;
  } else if (target.active) {
    const dx = target.x - player.x, dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      const m = Math.min(1, dist / (tile * 2));
      player.x += (dx / dist) * speed * m * dt;
      player.y += (dy / dist) * speed * m * dt;
    }
  }
  player.x = Math.max(roadLeft + player.r, Math.min(roadRight - player.r, player.x));
  player.y = Math.max(player.r, Math.min(worldH - player.r, player.y));

  camY = Math.max(0, Math.min(worldH - H, player.y - H * 0.62));

  // reach the trophy: score up, then whisk back to start (no farming)
  if (Math.hypot(player.x - trophy.x, player.y - trophy.y) < player.r + trophy.r) {
    score += 1;
    if (score > best) { best = score; localStorage.setItem('disasterRoadBest', best); }
    trophy.got = 1;
    reset('trophy! +1');
  }
  if (trophy.got > 0) trophy.got = Math.max(0, trophy.got - dt * 1.5);

  spawnIn -= dt;
  if (spawnIn <= 0) spawnRandom();
  updateDisasters(dt);

  // squid ink puddles: step on one and it splats over your screen
  inkTimer -= dt;
  if (inkTimer <= 0) { spawnInk(); inkTimer = randomRange(3.0, 6.0); }
  for (const s of inkSpots) {
    if (!s.touched && Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r) {
      s.touched = true; inkScreen = 2.0;
    }
    if (s.touched) s.fade -= dt * 3;                 // the puddle fades away
  }
  inkSpots = inkSpots.filter(s => s.fade > 0 && s.y < camY + H + tile * 3);
  if (inkScreen > 0) inkScreen -= dt;

  if (flash) { flash.t -= dt * 0.6; if (flash.t <= 0) flash = null; }
}

// ---- draw ----
function sx(x) { return offsetX + x; }
function sy(y) { return y - camY; }

function drawRoad() {
  const firstRow = Math.max(0, Math.floor(camY / tile) - 1);
  const lastRow  = Math.min(LEN - 1, Math.floor((camY + H) / tile) + 1);
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = 0; col < COLS; col++) {
      const px = sx(col * tile), py = sy(row * tile);
      if (col === 0 || col === COLS - 1) {
        ctx.fillStyle = ((row + col) % 2 === 0) ? SEA : FLAME;     // walls
      } else {
        ctx.fillStyle = ((row + col) % 2 === 0) ? GREEN1 : GREEN2; // road
      }
      ctx.fillRect(px, py, tile + 1, tile + 1);
    }
  }
}

function drawPlayer() {
  const x = sx(player.x), y = sy(player.y), r = player.r;
  ctx.fillStyle = INK;
  ctx.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);
  ctx.fillStyle = SEA;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = PAPER;
  ctx.fillRect(x - r * 0.5, y - r * 0.5, r * 0.4, r * 0.4);
  ctx.fillRect(x + r * 0.1, y - r * 0.5, r * 0.4, r * 0.4);
}

function drawDisasters() {
  for (const d of disasters) {
    if (d.kind === 'lava') {
      const y = sy(d.y);
      ctx.fillStyle = FLAME;
      ctx.fillRect(sx(0), y, roadPixelW, H);
      ctx.fillStyle = '#ff8a1c';
      for (let x = 0; x < roadPixelW; x += tile * 0.6) {
        const h = (Math.sin((x + d.y) * 0.05) * 0.5 + 0.5) * tile * 0.5;
        ctx.fillRect(sx(x), y - h, tile * 0.6 + 1, h);
      }
    } else if (d.kind === 'avalanche') {
      const y = sy(d.y);
      const gs = sx(d.gapStart), ge = sx(d.gapEnd);
      ctx.fillStyle = '#dcecff';                      // snow, but leave the pocket open
      ctx.fillRect(0, y - H, gs, H);
      ctx.fillRect(ge, y - H, W - ge, H);
      ctx.fillStyle = '#ffffff';                      // tumbling chunks below
      for (let x = 0; x < roadPixelW; x += tile * 0.6) {
        if (x + tile * 0.3 > d.gapStart && x < d.gapEnd) continue;   // skip the gap
        const h = (Math.sin((x - d.y) * 0.05) * 0.5 + 0.5) * tile * 0.5;
        ctx.fillRect(sx(x), y, tile * 0.6 + 1, h);
      }
    } else if (d.kind === 'tornado') {
      const x = sx(d.x), y = sy(d.y);
      [1.1, 0.9, 0.7, 0.5, 0.3].forEach((b, i) => {
        const w = d.r * 2 * b;
        const off = Math.sin(d.spin + i) * tile * 0.25;
        ctx.fillStyle = i % 2 ? '#9a9aa6' : '#c2c2ce';
        ctx.fillRect(x - w / 2 + off, y - d.r + i * (d.r * 0.5), w, d.r * 0.42);
      });
    } else { // fireball
      const x = sx(d.x), y = sy(d.y);
      ctx.fillStyle = FLAME;
      ctx.beginPath(); ctx.arc(x, y, d.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a1c';
      ctx.beginPath(); ctx.arc(x, y, d.r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawFlash() {
  if (!flash) return;
  ctx.globalAlpha = Math.min(1, flash.t * 1.4);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(tile * 0.8) + 'px system-ui, sans-serif';
  ctx.fillText(flash.text, W / 2 + 2, H * 0.3 + 2);
  ctx.fillStyle = FLAME;
  ctx.fillText(flash.text, W / 2, H * 0.3);
  ctx.globalAlpha = 1;
}

function drawTrophy() {
  const x = sx(trophy.x), y = sy(trophy.y), s = tile;
  if (trophy.got > 0) {
    ctx.globalAlpha = trophy.got;
    ctx.fillStyle = PAPER;
    ctx.beginPath(); ctx.arc(x, y, s * 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ffc828';
  ctx.fillRect(x - s * 0.5, y - s * 0.6, s, s * 0.7);        // cup
  ctx.fillRect(x - s * 0.14, y + s * 0.1, s * 0.28, s * 0.35); // stem
  ctx.fillRect(x - s * 0.5, y + s * 0.45, s, s * 0.22);       // base
  ctx.fillStyle = INK;
  ctx.fillRect(x - s * 0.5, y - s * 0.6, s * 0.14, s * 0.7);  // pixel edges
  ctx.fillRect(x + s * 0.36, y - s * 0.6, s * 0.14, s * 0.7);
}

function pill(x, y, text, bg, fg) {
  ctx.font = '700 ' + Math.round(tile * 0.5) + 'px ui-monospace, monospace';
  const w = ctx.measureText(text).width + 20, h = tile * 0.9;
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = INK; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 10, y + h / 2 + 1);
  return w;
}

function drawHUD() {
  pill(12, 12, 'SCORE ' + score, PAPER, INK);
  ctx.font = '700 ' + Math.round(tile * 0.5) + 'px ui-monospace, monospace';
  const bt = 'BEST ' + best;
  const bw = ctx.measureText(bt).width + 20;
  pill(W - bw - 12, 12, bt, INK, PAPER);
}

function drawInkSpots() {
  for (const s of inkSpots) {
    const x = sx(s.x), y = sy(s.y);
    ctx.globalAlpha = s.fade;
    ctx.fillStyle = '#241640';
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s.r * 0.6, y - s.r * 0.5, s.r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - s.r * 0.5, y + s.r * 0.4, s.r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawInkScreen() {
  if (inkScreen <= 0) return;
  const a = Math.min(0.92, (inkScreen / 2) * 0.92);   // strong, then fades over 2s
  ctx.fillStyle = '#0b0a14';
  ctx.globalAlpha = a * 0.55;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  for (const b of inkBlobs) {
    ctx.beginPath();
    ctx.arc(b.fx * W, b.fy * H, b.fr * Math.max(W, H), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  drawRoad();
  drawInkSpots();
  drawTrophy();
  drawDisasters();
  drawPlayer();
  drawHUD();
  drawInkScreen();
  drawFlash();
}

// ---- loop ----
let last = 0;
function loop(now) {
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
