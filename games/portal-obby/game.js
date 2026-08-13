// Portal Obby — jump across the platforms, reach the portal for a trophy,
// get sent back to spawn. Press Z at the shop to spend trophies on coils.
// Move: arrows / A D.  Jump: up / W / space.  Z: shop.  G: grapple.  F: carpet.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const INK = '#16130F', PAPER = '#FBF3E4', FLAME = '#FF4A1C', SEA = '#0E5FD8', GOLD = '#ffc828';
const SKY = '#7ec8ff', GRASS = '#4caf2a', DIRT = '#7a5230', PORTAL = '#8e2de2';

let W, H, S, U;
let platforms = [], portal = {}, spawn = {}, shopkeeper = {}, worldW = 0, worldH = 0;

const player = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, onGround: false, dir: 1 };

let trophies = Number(localStorage.getItem('obbyTrophies') || 0);
let owned = JSON.parse(localStorage.getItem('obbyItems') || '{}');
owned = { speed: !!owned.speed, jump: !!owned.jump, grapple: !!owned.grapple, carpet: !!owned.carpet };

const SHOP = [
  { key: 'speed',   name: 'Speed Coil',     price: 2, desc: 'run faster' },
  { key: 'jump',    name: 'Gravity Coil',   price: 3, desc: 'jump higher' },
  { key: 'grapple', name: 'Grappling Hook', price: 4, desc: 'press G to zip up' },
  { key: 'carpet',  name: 'Flying Carpet',  price: 5, desc: 'press F to fly 5s' },
];

let state = 'play';          // 'play' | 'shop'
let flying = false;
let flyMeter = 5;            // seconds of flight left
const FLY_MAX = 5;
let flashText = '', flashT = 0, grappleAnim = 0, jumpPrev = false;
let grappleFrom = null, grappleTo = null;
let uiButtons = [];

function saveState() {
  localStorage.setItem('obbyTrophies', trophies);
  localStorage.setItem('obbyItems', JSON.stringify(owned));
}

function buildLevel() {
  U = S * 0.14;
  const P = (x, y, w) => ({ x: x * U, y: y * U, w: w * U, h: U * 0.5 });
  // one obby section (8 jumps). We paste it TWICE for a longer course.
  const unitY = [8.4, 7.8, 8.1, 7.4, 6.8, 7.0, 6.3, 5.7];
  const step = 3.3;
  platforms = [P(0, 9, 3.5)];              // spawn platform
  let bx = 5.0;
  for (let copy = 0; copy < 2; copy++) {   // the obby pasted twice — portal is NOT duplicated
    for (let i = 0; i < unitY.length; i++) platforms.push(P(bx + i * step, unitY[i], 1.8));
    bx += unitY.length * step;             // the next copy continues right after
  }
  const endX = bx;                         // one final platform holds the single portal
  platforms.push(P(endX, 5.4, 3.5));
  worldW = (endX + 5) * U;
  worldH = 11 * U;
  player.w = U * 0.45; player.h = U * 0.6;
  spawn = { x: 0.6 * U, y: 9 * U - player.h };
  portal = { x: (endX + 1.5) * U, y: 5.4 * U - U * 1.5, w: U * 0.9, h: U * 1.5 };
  shopkeeper = { x: 2.4 * U, y: 9 * U - U * 0.85, w: U * 0.55, h: U * 0.85 };
}

function teleportSpawn() {
  player.x = spawn.x; player.y = spawn.y; player.vx = 0; player.vy = 0;
  player.onGround = true; flying = false;
}

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  S = Math.min(W, H);
  buildLevel();
  if (player.x === 0 && player.y === 0) teleportSpawn();
  else { player.x = Math.min(player.x, worldW - player.w); }
}
window.addEventListener('resize', resize);
resize();
teleportSpawn();

// ---- input ----
const keys = {};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'z') { state = state === 'shop' ? 'play' : 'shop'; e.preventDefault(); return; }
  if (k === 'g') { grapple(); return; }
  if (k === 'f') {
    if (owned.carpet) {
      if (flying) flying = false;
      else if (flyMeter > 0.3) { flying = true; player.vy = 0; }
    }
    return;
  }
  if (['1','2','3','4'].includes(k) && state === 'shop') { buy(SHOP[+k - 1].key); return; }
  keys[k] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const btn = { left: false, right: false, jump: false };
const pmap = {};
function rawXY(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function controls() {
  const s = S * 0.13, pad = S * 0.03;
  return {
    left:  { x: pad, y: H - s - pad, w: s, h: s },
    right: { x: pad * 2 + s, y: H - s - pad, w: s, h: s },
    jump:  { x: W - s - pad, y: H - s - pad, w: s, h: s },
    shop:  { x: W - s - pad, y: pad, w: s, h: s },
  };
}
function inside(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
function recompute() {
  const v = Object.values(pmap);
  btn.left = v.includes('left'); btn.right = v.includes('right'); btn.jump = v.includes('jump');
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = rawXY(e);
  if (state === 'shop') { for (const b of uiButtons) if (inside(p, b)) { b.act(); return; } return; }
  const c = controls();
  if (inside(p, c.shop)) { state = 'shop'; return; }
  let region = inside(p, c.left) ? 'left' : inside(p, c.right) ? 'right' : inside(p, c.jump) ? 'jump' : null;
  if (region) { pmap[e.pointerId] = region; recompute(); }
});
function clearPtr(e) { delete pmap[e.pointerId]; recompute(); }
window.addEventListener('pointerup', clearPtr);
window.addEventListener('pointercancel', clearPtr);

function buy(key) {
  if (owned[key]) return;
  const item = SHOP.find(s => s.key === key);
  if (trophies >= item.price) { trophies -= item.price; owned[key] = true; saveState(); }
}

function grapple() {
  if (!owned.grapple || state !== 'play') return;
  const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
  let best = null, bestD = Infinity;
  for (const p of platforms) {
    if (p.y > player.y + player.h - U * 0.3) continue;  // only grab a platform above your feet
    const ax = Math.max(p.x, Math.min(cx, p.x + p.w)); // where the hook grabs its top
    const dx = ax - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
    const forward = dx * player.dir >= -U * 0.6;       // ahead of you or overhead
    if (d < U * 6 && forward && d < bestD) { bestD = d; best = { p, ax }; }
  }
  if (best) {
    grappleFrom = { x: cx, y: cy };
    grappleTo = { x: best.ax, y: best.p.y };
    player.x = Math.max(0, Math.min(worldW - player.w, best.ax - player.w / 2));
    player.y = best.p.y - player.h;
    player.vy = 0; player.onGround = true;
    grappleAnim = 0.3;
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---- update ----
function update(dt) {
  if (state !== 'play') return;
  const RUN = S * 0.5 * (owned.speed ? 1.6 : 1);
  const JUMP = S * 1.05 * (owned.jump ? 1.28 : 1);
  const GRAV = S * 2.6;
  const left = keys['arrowleft'] || keys['a'] || btn.left;
  const right = keys['arrowright'] || keys['d'] || btn.right;
  const up = keys['arrowup'] || keys['w'] || keys[' '] || btn.jump;
  const down = keys['arrowdown'] || keys['s'];

  if (flying) {
    const F = S * 0.42;
    player.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * F;
    player.vy = ((down ? 1 : 0) - (up ? 1 : 0)) * F;
    player.x += player.vx * dt; player.y += player.vy * dt;
  } else {
    player.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * RUN;
    if (up && !jumpPrev && player.onGround) { player.vy = -JUMP; player.onGround = false; }
    player.vy += GRAV * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.onGround = false;
    for (const p of platforms) {
      if (player.x + player.w > p.x && player.x < p.x + p.w) {
        const feet = player.y + player.h;
        const prevFeet = feet - player.vy * dt;
        if (player.vy >= 0 && prevFeet <= p.y + 1 && feet >= p.y) {
          player.y = p.y - player.h; player.vy = 0; player.onGround = true;
        }
      }
    }
  }
  jumpPrev = up;
  if (player.vx > 0) player.dir = 1; else if (player.vx < 0) player.dir = -1;

  player.x = Math.max(0, Math.min(worldW - player.w, player.x));
  player.y = Math.max(-U * 4, player.y);
  if (player.y > worldH + S * 0.4) teleportSpawn();          // fell off

  if (rectsOverlap(player, portal)) {                        // reached the portal
    trophies += 1; saveState();
    flashText = 'trophy! +1'; flashT = 1.6;
    teleportSpawn();
  }

  if (flashT > 0) flashT -= dt;
  if (grappleAnim > 0) grappleAnim -= dt;

  // flying carpet fuel: 5 seconds of flight, refills while on the ground
  if (flying) { flyMeter -= dt; if (flyMeter <= 0) { flyMeter = 0; flying = false; } }
  else if (player.onGround) flyMeter = Math.min(FLY_MAX, flyMeter + dt);
}

// ---- draw ----
let camX = 0, camY = 0;
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sx(x) { return x - camX; }
function sy(y) { return y - camY; }

function drawWorld() {
  ctx.fillStyle = SKY; ctx.fillRect(0, 0, W, H);
  // a couple of clouds
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 6; i++) {
    const cx = sx((i * 6 + 2) * U) * 0.6, cy = (i % 3) * U * 1.5 + U;
    ctx.beginPath(); ctx.arc(cx, cy, U * 0.6, 0, Math.PI * 2); ctx.arc(cx + U * 0.6, cy, U * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  // platforms: grass top, dirt body
  for (const p of platforms) {
    ctx.fillStyle = DIRT; ctx.fillRect(sx(p.x), sy(p.y), p.w, p.h + U);
    ctx.fillStyle = GRASS; ctx.fillRect(sx(p.x), sy(p.y), p.w, p.h * 0.5);
    ctx.fillStyle = INK; ctx.fillRect(sx(p.x), sy(p.y), p.w, 2);
  }
  // portal
  const px = sx(portal.x) + portal.w / 2, py = sy(portal.y) + portal.h / 2;
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(px, py, portal.w / 2 + 4, portal.h / 2 + 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PORTAL; ctx.beginPath(); ctx.ellipse(px, py, portal.w / 2, portal.h / 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c79bff'; ctx.beginPath(); ctx.ellipse(px, py, portal.w / 3, portal.h / 3, 0, 0, Math.PI * 2); ctx.fill();
  // shopkeeper
  const kx = sx(shopkeeper.x), ky = sy(shopkeeper.y);
  ctx.fillStyle = INK; ctx.fillRect(kx - 2, ky - 2, shopkeeper.w + 4, shopkeeper.h + 4);
  ctx.fillStyle = '#b5651d'; ctx.fillRect(kx, ky, shopkeeper.w, shopkeeper.h);
  ctx.fillStyle = GOLD; ctx.fillRect(kx, ky - U * 0.25, shopkeeper.w, U * 0.25);    // hat
  ctx.fillStyle = PAPER; ctx.font = '700 ' + Math.round(U * 0.28) + 'px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('SHOP (Z)', kx + shopkeeper.w / 2, ky - U * 0.35);
}

function drawPlayer() {
  const x = sx(player.x), y = sy(player.y), w = player.w, h = player.h;
  if (flying) { ctx.fillStyle = FLAME; ctx.fillRect(x - w * 0.3, y + h, w * 1.6, h * 0.25); }
  ctx.fillStyle = INK; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = SEA; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAPER;
  const ex = player.dir > 0 ? x + w * 0.45 : x + w * 0.2;
  ctx.fillRect(ex, y + h * 0.2, w * 0.35, h * 0.25);
}

function drawGrapple() {
  if (grappleAnim <= 0 || !grappleTo) return;
  ctx.globalAlpha = Math.min(1, grappleAnim * 3.5);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(sx(grappleFrom.x), sy(grappleFrom.y)); ctx.lineTo(sx(grappleTo.x), sy(grappleTo.y)); ctx.stroke();
  ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(sx(grappleTo.x), sy(grappleTo.y), U * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHUD() {
  const s = S * 0.05;
  ctx.fillStyle = GOLD; ctx.fillRect(S * 0.03, S * 0.03, s * 0.7, s * 0.5);       // little trophy
  ctx.fillStyle = INK; ctx.fillRect(S * 0.03 + s * 0.28, S * 0.03 + s * 0.5, s * 0.14, s * 0.2);
  ctx.fillStyle = PAPER; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.05) + 'px system-ui, sans-serif';
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.strokeText('x ' + trophies, S * 0.03 + s * 0.9, S * 0.03 + s * 0.35);
  ctx.fillText('x ' + trophies, S * 0.03 + s * 0.9, S * 0.03 + s * 0.35);

  // owned coils hint
  const abil = [];
  if (owned.grapple) abil.push('G: grapple');
  if (owned.carpet) abil.push('F: fly' + (flying ? ' (ON)' : ''));
  if (abil.length) {
    ctx.font = '700 ' + Math.round(S * 0.03) + 'px ui-monospace, monospace';
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.fillText(abil.join('   '), W / 2, S * 0.05);
  }
  if (owned.carpet) {                                      // fly fuel bar
    const bw = S * 0.2, bh = S * 0.022, bx = W / 2 - bw / 2, by = S * 0.08;
    ctx.fillStyle = INK; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#555'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = flying ? '#ff3b30' : '#1db954';
    ctx.fillRect(bx, by, bw * (flyMeter / FLY_MAX), bh);
  }
}

function drawTouch() {
  const c = controls();
  ctx.globalAlpha = 0.5; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.06) + 'px system-ui, sans-serif';
  for (const [r, label] of [[c.left, '‹'], [c.right, '›'], [c.jump, '▲'], [c.shop, 'Z']]) {
    ctx.fillStyle = INK; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = PAPER; ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  }
  ctx.globalAlpha = 1;
}

function drawFlash() {
  if (flashT <= 0) return;
  ctx.globalAlpha = Math.min(1, flashT);
  ctx.fillStyle = GOLD; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.08) + 'px system-ui, sans-serif';
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.strokeText(flashText, W / 2, H * 0.25);
  ctx.fillText(flashText, W / 2, H * 0.25);
  ctx.globalAlpha = 1;
}

function drawShop() {
  uiButtons = [];
  ctx.fillStyle = 'rgba(22,19,15,0.85)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.07) + 'px system-ui, sans-serif';
  ctx.fillText('SHOP', W / 2, H * 0.12);
  ctx.fillStyle = GOLD; ctx.font = '700 ' + Math.round(S * 0.04) + 'px ui-monospace, monospace';
  ctx.fillText('you have ' + trophies + ' trophies', W / 2, H * 0.2);

  const bw = Math.min(W * 0.8, 420), bh = S * 0.1, gap = S * 0.03;
  let y = H * 0.28;
  for (const it of SHOP) {
    const got = owned[it.key];
    const afford = trophies >= it.price;
    const bg = got ? '#3a3a3a' : (afford ? '#1db954' : '#7a2020');
    ctx.fillStyle = INK; ctx.fillRect(W / 2 - bw / 2 + 4, y + 4, bw, bh);
    ctx.fillStyle = bg; ctx.fillRect(W / 2 - bw / 2, y, bw, bh);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - bw / 2, y, bw, bh);
    ctx.fillStyle = PAPER; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(bh * 0.3) + 'px system-ui, sans-serif';
    ctx.fillText(it.name + '  —  ' + it.desc, W / 2 - bw / 2 + 16, y + bh * 0.36);
    ctx.font = '700 ' + Math.round(bh * 0.26) + 'px ui-monospace, monospace';
    ctx.fillText(got ? 'OWNED' : (it.price + ' trophy' + (it.price > 1 ? 's' : '')), W / 2 - bw / 2 + 16, y + bh * 0.72);
    if (!got) uiButtons.push({ x: W / 2 - bw / 2, y, w: bw, h: bh, act: () => buy(it.key) });
    y += bh + gap;
  }
  const cw = Math.min(W * 0.5, 260), ch = S * 0.09;
  ctx.fillStyle = INK; ctx.fillRect(W / 2 - cw / 2 + 4, y + 4, cw, ch);
  ctx.fillStyle = FLAME; ctx.fillRect(W / 2 - cw / 2, y, cw, ch);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - cw / 2, y, cw, ch);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = '700 ' + Math.round(ch * 0.34) + 'px system-ui, sans-serif';
  ctx.fillText('close (Z)', W / 2, y + ch / 2);
  uiButtons.push({ x: W / 2 - cw / 2, y, w: cw, h: ch, act: () => { state = 'play'; } });
}

function draw() {
  camX = clamp(player.x + player.w / 2 - W * 0.4, 0, Math.max(0, worldW - W));
  camY = clamp(player.y + player.h / 2 - H * 0.55, 0, Math.max(0, worldH - H));
  drawWorld();
  drawPlayer();
  drawGrapple();
  drawHUD();
  drawFlash();
  if (state === 'play') drawTouch();
  if (state === 'shop') drawShop();
}

// ---- loop ----
let last = 0;
function loop(now) {
  if (!last) last = now;
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.05) dt = 0.05;
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
