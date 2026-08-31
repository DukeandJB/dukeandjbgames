// Sky Battle — top-down plane fighter over an ocean with 5 islands.
// You always fly forward. Steer left/right. You auto-shoot.
// Red enemy planes chase you and fire back.

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// ---- Colours ----
const SEA   = '#0E5FD8';
const SAND  = '#F2D9A0';
const PALM  = '#2E8B57';
const INK   = '#16130F';
const PAPER = '#FBF3E4';
const FLAME = '#FF4A1C';

// ---- World ----
const WORLD = 4400;               // square world size
let W = 0, H = 0;                 // screen size

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---- Islands (5, fixed spots) ----
const islands = [
  { x: 850,  y: 850,  r: 240 },
  { x: 3550, y: 800,  r: 200 },
  { x: 2200, y: 2200, r: 320 },
  { x: 750,  y: 3600, r: 220 },
  { x: 3650, y: 3600, r: 260 },
];

// ---- Waves ----
const WAVES = [5, 7, 10];   // clear all three to win

// ---- Player ----
let player, bullets, enemies, eBullets, score, turning, gameOver, particles, wave;

function reset() {
  player = { x: WORLD / 2, y: WORLD / 2, a: -Math.PI / 2, speed: 4.6, hp: 100, cool: 0 };
  bullets = [];
  enemies = [];
  eBullets = [];
  particles = [];
  score = 0;
  turning = 0;         // -1 left, +1 right
  gameOver = false;
  wave = 0;
  startWave();
  document.getElementById('over').classList.add('hidden');
  updateHud();
}

function startWave() {
  for (let i = 0; i < WAVES[wave]; i++) spawnEnemy();
}

function spawnEnemy() {
  // spawn away from the player
  let x, y, d;
  do {
    x = Math.random() * WORLD;
    y = Math.random() * WORLD;
    d = Math.hypot(x - player.x, y - player.y);
  } while (d < 700);
  enemies.push({ x, y, a: Math.random() * Math.PI * 2, speed: 2.3, hp: 3, cool: Math.random() * 80 });
}

// ---- Input ----
function press(dir) { turning = dir; }
function release()  { turning = 0; }

const L = document.getElementById('left');
const R = document.getElementById('right');
L.addEventListener('touchstart', e => { e.preventDefault(); press(-1); }, { passive: false });
R.addEventListener('touchstart', e => { e.preventDefault(); press(1);  }, { passive: false });
L.addEventListener('touchend',  e => { e.preventDefault(); release(); }, { passive: false });
R.addEventListener('touchend',  e => { e.preventDefault(); release(); }, { passive: false });
L.addEventListener('mousedown', () => press(-1));
R.addEventListener('mousedown', () => press(1));
window.addEventListener('mouseup', release);

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') press(-1);
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') press(1);
});
window.addEventListener('keyup', e => {
  if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) release();
});

document.getElementById('again').addEventListener('click', reset);

// ---- Update ----
function update() {
  // Explosion keeps animating even after you're down
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.94; p.vy *= 0.94;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  if (gameOver) return;

  // Player turn + move
  player.a += turning * 0.055;
  player.x += Math.cos(player.a) * player.speed;
  player.y += Math.sin(player.a) * player.speed;
  player.x = clamp(player.x, 0, WORLD);
  player.y = clamp(player.y, 0, WORLD);

  // Player auto-fire
  player.cool--;
  if (player.cool <= 0) {
    bullets.push(makeBullet(player.x, player.y, player.a, 8));
    player.cool = 12;
  }

  // Player bullets
  for (const b of bullets) { b.x += b.vx; b.y += b.vy; b.life--; }

  // Enemies chase + shoot
  for (const e of enemies) {
    const want = Math.atan2(player.y - e.y, player.x - e.x);
    e.a = turnToward(e.a, want, 0.03);
    e.x += Math.cos(e.a) * e.speed;
    e.y += Math.sin(e.a) * e.speed;

    const dist = Math.hypot(player.x - e.x, player.y - e.y);
    e.cool--;
    if (e.cool <= 0 && dist < 600) {
      eBullets.push(makeBullet(e.x, e.y, e.a, 5));
      e.cool = 90;
    }
  }

  // Enemy bullets
  for (const b of eBullets) { b.x += b.vx; b.y += b.vy; b.life--; }

  // Player bullets hit enemies
  for (const b of bullets) {
    for (const e of enemies) {
      if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < 22) {
        e.hp--; b.life = 0;
        if (e.hp <= 0) { score += 1; updateHud(); }
      }
    }
  }

  // Enemy bullets hit player
  for (const b of eBullets) {
    if (Math.hypot(b.x - player.x, b.y - player.y) < 20) {
      b.life = 0; damage(6);
    }
  }

  // Crash into an enemy = both hurt
  for (const e of enemies) {
    if (e.hp > 0 && Math.hypot(player.x - e.x, player.y - e.y) < 30) {
      e.hp = 0; damage(20);
    }
  }

  // Clean up dead enemies + bullets
  bullets  = bullets.filter(b => b.life > 0 && inWorld(b));
  eBullets = eBullets.filter(b => b.life > 0 && inWorld(b));
  enemies  = enemies.filter(e => e.hp > 0);

  // Wave cleared? Next wave, or win.
  if (enemies.length === 0 && !gameOver) {
    wave++;
    if (wave >= WAVES.length) {
      win();
    } else {
      startWave();
      updateHud();
    }
  }
}

function damage(n) {
  player.hp -= n;
  if (player.hp <= 0) { player.hp = 0; end(); }
  updateHud();
}

function explode(x, y) {
  const colours = [FLAME, '#FFD23F', PAPER];
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 3 + Math.random() * 6,
      life: 30 + Math.random() * 25,
      colour: colours[(Math.random() * colours.length) | 0],
    });
  }
}

function end() {
  gameOver = true;
  explode(player.x, player.y);          // boom right where you died
  // let the explosion play before the game-over screen shows
  setTimeout(() => showOver('Down!'), 850);
}

function win() {
  gameOver = true;
  showOver('You win!');
}

function showOver(title) {
  document.getElementById('overtitle').textContent = title;
  document.getElementById('overscore').textContent = 'Score: ' + score;
  document.getElementById('over').classList.remove('hidden');
}

function makeBullet(x, y, a, sp) {
  return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 120 };
}

// ---- Draw ----
function draw() {
  // camera centred on player
  const camX = clamp(player.x - W / 2, 0, WORLD - W);
  const camY = clamp(player.y - H / 2, 0, WORLD - H);

  ctx.fillStyle = SEA;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-camX, -camY);

  drawWaves(camX, camY);

  for (const is of islands) drawIsland(is);

  for (const b of bullets)  drawBullet(b, PAPER, 9);
  for (const b of eBullets) drawBullet(b, FLAME, 5);

  for (const e of enemies) drawPlane(e.x, e.y, e.a, FLAME);
  if (!gameOver) drawPlane(player.x, player.y, player.a, PAPER);

  for (const p of particles) drawParticle(p);

  ctx.restore();
}

function drawParticle(p) {
  ctx.fillStyle = p.colour;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaves(camX, camY) {
  // little wave dashes on a grid, cheap and mobile-friendly
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  const gap = 120;
  const startX = Math.floor(camX / gap) * gap;
  const startY = Math.floor(camY / gap) * gap;
  ctx.beginPath();
  for (let x = startX; x < camX + W + gap; x += gap) {
    for (let y = startY; y < camY + H + gap; y += gap) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y);
    }
  }
  ctx.stroke();
}

function drawIsland(is) {
  ctx.fillStyle = SAND;
  ctx.beginPath();
  ctx.arc(is.x, is.y, is.r, 0, Math.PI * 2);
  ctx.fill();
  // a few palm blobs
  ctx.fillStyle = PALM;
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const px = is.x + Math.cos(ang) * is.r * 0.4;
    const py = is.y + Math.sin(ang) * is.r * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, is.r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlane(x, y, a, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  // body
  ctx.fillStyle = colour;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 0);     // nose
  ctx.lineTo(-14, -13);  // wing
  ctx.lineTo(-8, 0);     // tail notch
  ctx.lineTo(-14, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBullet(b, colour, r) {
  ctx.fillStyle = colour;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// ---- Helpers ----
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function inWorld(b) { return b.x > -50 && b.x < WORLD + 50 && b.y > -50 && b.y < WORLD + 50; }
function turnToward(a, target, step) {
  let diff = ((target - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + clamp(diff, -step, step);
}
function updateHud() {
  document.getElementById('score').textContent = score;
  document.getElementById('wave').textContent = 'Wave ' + (wave + 1) + '/' + WAVES.length;
  document.getElementById('healthbar').style.width = player.hp + '%';
}

// ---- Loop ----
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
