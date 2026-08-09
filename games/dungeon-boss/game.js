// Dungeon Boss — melee. Move to dodge, press SPACE (or the sword button) to
// swing your sword. Clear the minions. Godly ends with a boss on a throne.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const INK = '#16130F', PAPER = '#FBF3E4', FLAME = '#FF4A1C', SEA = '#0E5FD8', GOLD = '#ffc828';
const FLOOR1 = '#2a2733', FLOOR2 = '#312d3c', WALL = '#1a1822';

const SWORD_DAMAGE = 50;

let W, H, S;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  S = Math.min(W, H);
}
window.addEventListener('resize', resize);
resize();

// Each level: how many minions, how much health each, how fast they chase.
// Godly also has a boss on a throne.
const LEVELS = [
  { name: 'Easy',   color: '#1db954', minions: 5, hp: 300, speed: 0.07, boss: null },
  { name: 'Medium', color: '#ffd500', minions: 6, hp: 450, speed: 0.09, boss: null },
  { name: 'Hard',   color: '#ff8a1c', minions: 7, hp: 600, speed: 0.11, boss: null },
  { name: 'Insane', color: '#ff3b30', minions: 8, hp: 800, speed: 0.13, boss: null },
  { name: 'Godly',  color: '#8e2de2', minions: 4, hp: 500, speed: 0.16, boss: { hp: 4000 } },
];

let state = 'menu';           // menu | play | win | lose
let level = null;
let uiButtons = [];

const hero = { x: 0, y: 0, hearts: 5, invuln: 0, atkCd: 0, swing: 0, fx: 0, fy: -1 };
let enemies = [];

function heroR() { return S * 0.03; }

function startGame(lv) {
  level = lv; state = 'play';
  hero.hearts = 10; hero.invuln = 0; hero.atkCd = 0; hero.swing = 0;
  hero.x = W / 2; hero.y = H * 0.8; hero.fx = 0; hero.fy = -1;
  enemies = [];
  const R = S * 0.035;
  for (let i = 0; i < lv.minions; i++) {
    enemies.push({
      x: S * 0.1 + Math.random() * (W - S * 0.2),
      y: H * 0.15 + Math.random() * H * 0.35,
      r: R, hp: lv.hp, maxHp: lv.hp, speed: lv.speed * S, isBoss: false
    });
  }
  if (lv.boss) {
    enemies.push({ x: W / 2, y: H * 0.17, r: S * 0.1, hp: lv.boss.hp, maxHp: lv.boss.hp, speed: 0, isBoss: true });
  }
}

// ---- input ----
const keys = {};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); attack(); return; }
  keys[k] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const move = { x: 0, y: 0, active: false, blocked: false };
function rawXY(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function attackBtn() {
  const s = S * 0.16;
  return { x: W - s - S * 0.03, y: H - s - S * 0.03, s };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (state !== 'play') { handleUI(e); return; }
  const p = rawXY(e);
  const b = attackBtn();
  if (p.x >= b.x && p.x <= b.x + b.s && p.y >= b.y && p.y <= b.y + b.s) {
    attack(); move.blocked = true; return;
  }
  move.blocked = false;
  move.x = p.x; move.y = p.y - (e.pointerType === 'touch' ? S * 0.12 : 0);
  move.active = true;
});
canvas.addEventListener('pointermove', e => {
  if (state !== 'play' || !move.active || move.blocked) return;
  const p = rawXY(e);
  move.x = p.x; move.y = p.y - (e.pointerType === 'touch' ? S * 0.12 : 0);
});
window.addEventListener('pointerup', () => { move.active = false; move.blocked = false; });

function handleUI(e) {
  const p = rawXY(e);
  for (const b of uiButtons) {
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.act(); return; }
  }
}

function attack() {
  if (state !== 'play' || hero.atkCd > 0) return;
  hero.atkCd = 0.35; hero.swing = 0.18;
  const reach = S * 0.11 + heroR();
  for (const e of enemies) {
    const dx = e.x - hero.x, dy = e.y - hero.y, d = Math.hypot(dx, dy) || 1;
    if (d < reach + e.r) {
      const facing = (dx * hero.fx + dy * hero.fy) / d;   // is the enemy in front?
      if (facing > 0.1) e.hp -= SWORD_DAMAGE;
    }
  }
  enemies = enemies.filter(e => e.hp > 0);
  if (enemies.length === 0) state = 'win';
}

// ---- update ----
function update(dt) {
  if (state !== 'play') return;
  const HR = heroR(), speed = S * 0.55;
  let vx = 0, vy = 0;
  if (keys['arrowleft'] || keys['a']) vx--;
  if (keys['arrowright'] || keys['d']) vx++;
  if (keys['arrowup'] || keys['w']) vy--;
  if (keys['arrowdown'] || keys['s']) vy++;
  if (vx || vy) {
    const m = Math.hypot(vx, vy);
    hero.x += vx / m * speed * dt; hero.y += vy / m * speed * dt;
    hero.fx = vx / m; hero.fy = vy / m;
  } else if (move.active) {
    const dx = move.x - hero.x, dy = move.y - hero.y, d = Math.hypot(dx, dy);
    if (d > 3) {
      const m = Math.min(1, d / (S * 0.06));
      hero.x += dx / d * speed * m * dt; hero.y += dy / d * speed * m * dt;
      hero.fx = dx / d; hero.fy = dy / d;
    }
  }
  const b = S * 0.02;
  hero.x = Math.max(b + HR, Math.min(W - b - HR, hero.x));
  hero.y = Math.max(b + HR, Math.min(H - b - HR, hero.y));

  if (hero.invuln > 0) hero.invuln -= dt;
  if (hero.atkCd > 0) hero.atkCd -= dt;
  if (hero.swing > 0) hero.swing -= dt;

  for (const e of enemies) {
    if (e.speed > 0) {
      const dx = hero.x - e.x, dy = hero.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.x += dx / d * e.speed * dt; e.y += dy / d * e.speed * dt;
    }
    if (hero.invuln <= 0) {
      if (Math.hypot(e.x - hero.x, e.y - hero.y) < e.r + HR) {
        hero.hearts--; hero.invuln = 1.0;
        if (hero.hearts <= 0) state = 'lose';
      }
    }
  }
}

// ---- draw ----
function drawFloor() {
  const t = S * 0.08;
  for (let y = 0; y < H; y += t)
    for (let x = 0; x < W; x += t) {
      ctx.fillStyle = ((Math.floor(x / t) + Math.floor(y / t)) % 2 === 0) ? FLOOR1 : FLOOR2;
      ctx.fillRect(x, y, t + 1, t + 1);
    }
  const b = S * 0.02;
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b);
  ctx.fillRect(0, 0, b, H); ctx.fillRect(W - b, 0, b, H);
}

function drawThrone(x, y, r) {
  ctx.fillStyle = '#4a3d1a';
  ctx.fillRect(x - r * 1.3, y - r * 1.7, r * 2.6, r * 2.2);      // backrest
  ctx.fillStyle = GOLD;
  ctx.fillRect(x - r * 1.3, y - r * 1.7, r * 2.6, r * 0.3);      // top trim
  ctx.fillRect(x - r * 1.5, y + r * 0.2, r * 3, r * 0.5);        // seat base
}

function healthBar(e) {
  const w = e.r * 2.2, h = S * 0.012, x = e.x - w / 2, y = e.y - e.r - h * 2.2;
  ctx.fillStyle = INK; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x, y, w, h);
  const frac = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = frac > 0.5 ? '#1db954' : (frac > 0.25 ? '#ffd500' : '#ff3b30');
  ctx.fillRect(x, y, w * frac, h);
}

function drawEnemies() {
  for (const e of enemies) {
    if (e.isBoss) {
      drawThrone(e.x, e.y, e.r);
      ctx.fillStyle = INK; ctx.fillRect(e.x - e.r - 3, e.y - e.r - 3, e.r * 2 + 6, e.r * 2 + 6);
      ctx.fillStyle = '#5b2a86'; ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      ctx.fillStyle = '#3a1a57';                                  // horns
      ctx.fillRect(e.x - e.r, e.y - e.r - e.r * 0.35, e.r * 0.35, e.r * 0.4);
      ctx.fillRect(e.x + e.r - e.r * 0.35, e.y - e.r - e.r * 0.35, e.r * 0.35, e.r * 0.4);
      ctx.fillStyle = '#ff3b30';                                  // eyes
      ctx.fillRect(e.x - e.r * 0.5, e.y - e.r * 0.2, e.r * 0.3, e.r * 0.3);
      ctx.fillRect(e.x + e.r * 0.2, e.y - e.r * 0.2, e.r * 0.3, e.r * 0.3);
    } else {
      ctx.fillStyle = INK; ctx.fillRect(e.x - e.r - 2, e.y - e.r - 2, e.r * 2 + 4, e.r * 2 + 4);
      ctx.fillStyle = '#4caf2a'; ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      ctx.fillStyle = '#111';                                     // eyes
      ctx.fillRect(e.x - e.r * 0.5, e.y - e.r * 0.3, e.r * 0.35, e.r * 0.35);
      ctx.fillRect(e.x + e.r * 0.15, e.y - e.r * 0.3, e.r * 0.35, e.r * 0.35);
    }
    healthBar(e);
  }
}

function drawHero() {
  const blink = hero.invuln > 0 && Math.floor(hero.invuln * 10) % 2 === 0;
  const r = heroR(), x = hero.x, y = hero.y;
  // sword swing arc
  if (hero.swing > 0) {
    const ang = Math.atan2(hero.fy, hero.fx);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, S * 0.12, -0.9, 0.9);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (!blink) {
    ctx.fillStyle = INK; ctx.fillRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4);
    ctx.fillStyle = SEA; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x - r * 0.5, y - r * 0.4, r * 0.35, r * 0.35);
    ctx.fillRect(x + r * 0.15, y - r * 0.4, r * 0.35, r * 0.35);
  }
}

function drawAttackButton() {
  const b = attackBtn();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = INK; ctx.fillRect(b.x + 3, b.y + 3, b.s, b.s);
  ctx.fillStyle = FLAME; ctx.fillRect(b.x, b.y, b.s, b.s);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.s, b.s);
  ctx.fillStyle = PAPER;
  ctx.font = '700 ' + Math.round(b.s * 0.22) + 'px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SWORD', b.x + b.s / 2, b.y + b.s / 2);
  ctx.globalAlpha = 1;
}

function drawHUD() {
  // hearts
  const hr = S * 0.025, b = S * 0.02;
  for (let i = 0; i < hero.hearts; i++) {
    const hx = b + S * 0.03 + i * hr * 2.6, hy = H - b - hr * 1.6;
    ctx.fillStyle = FLAME;
    ctx.fillRect(hx - hr * 0.5, hy - hr * 0.5, hr, hr);
    ctx.fillRect(hx - hr, hy - hr, hr * 0.6, hr * 0.6);
    ctx.fillRect(hx + hr * 0.4, hy - hr, hr * 0.6, hr * 0.6);
  }
  // level + minions left
  const left = enemies.filter(e => !e.isBoss).length;
  const bossLeft = enemies.some(e => e.isBoss);
  ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = '700 ' + Math.round(S * 0.03) + 'px ui-monospace, monospace';
  let msg = level.name.toUpperCase() + '  —  minions: ' + left;
  if (bossLeft) msg += '  + BOSS';
  ctx.fillText(msg, W / 2, b + S * 0.012);
}

function button(x, y, w, h, label, bg, fg, act) {
  ctx.fillStyle = INK; ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 ' + Math.round(h * 0.36) + 'px system-ui, sans-serif';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  uiButtons.push({ x, y, w, h, act });
}

function drawMenu() {
  uiButtons = [];
  ctx.fillStyle = PAPER; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.085) + 'px system-ui, sans-serif';
  ctx.fillText('DUNGEON BOSS', W / 2, H * 0.14);
  ctx.fillStyle = FLAME; ctx.font = '700 ' + Math.round(S * 0.032) + 'px ui-monospace, monospace';
  ctx.fillText('pick your difficulty', W / 2, H * 0.22);
  const bw = Math.min(W * 0.7, 360), bh = S * 0.085, gap = S * 0.022;
  let y = H * 0.3;
  for (const lv of LEVELS) { button(W / 2 - bw / 2, y, bw, bh, lv.name, lv.color, INK, () => startGame(lv)); y += bh + gap; }
}

function drawEnd(text, color) {
  uiButtons = [];
  ctx.fillStyle = 'rgba(22,19,15,0.78)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(S * 0.1) + 'px system-ui, sans-serif';
  ctx.fillText(text, W / 2, H * 0.36);
  ctx.fillStyle = PAPER; ctx.font = '700 ' + Math.round(S * 0.032) + 'px ui-monospace, monospace';
  ctx.fillText(level.name + ' dungeon', W / 2, H * 0.45);
  const bw = Math.min(W * 0.6, 300), bh = S * 0.085;
  button(W / 2 - bw / 2, H * 0.55, bw, bh, 'play again', FLAME, INK, () => { state = 'menu'; });
}

function draw() {
  drawFloor();
  if (state === 'menu') { drawMenu(); return; }
  drawEnemies();
  drawHero();
  drawHUD();
  drawAttackButton();
  if (state === 'win') drawEnd('YOU WIN!', GOLD);
  if (state === 'lose') drawEnd('GAME OVER', FLAME);
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
