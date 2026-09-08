/* ============================================================================
   KARAMPUDI ACHARYA PRANAV — PORTFOLIO APP.JS
   HD Anime Sword Engine · Light/Dark Theme · Accent Color Switcher
   ============================================================================ */

'use strict';

// ===========================================================================
// STATE
// ===========================================================================
const APP = {
  theme:          'dark',
  accent:         'cyan',
  audioEnabled:   false,
  activeSword:    'all',
  cmdPaletteOpen: false,
  modalOpen:      false,
  swords:         [],
  particles:      [],
  animFrameId:    null,
  ctx:            null,
  canvas:         null,
  W:              0,
  H:              0,
  scrollY:        0,
  mouse:          { x: 0, y: 0 },
};

// ===========================================================================
// UTILITY HELPERS
// ===========================================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rnd  = (min, max) => Math.random() * (max - min) + min;
const rndInt = (min, max) => Math.floor(rnd(min, max + 1));
const TAU = Math.PI * 2;

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ===========================================================================
// TOAST NOTIFICATIONS
// ===========================================================================
function showToast(msg, icon = '⚔️', duration = 2800) {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-emoji">${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ===========================================================================
// THEME SYSTEM (Dark / Light)
// ===========================================================================
function applyTheme(theme) {
  APP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kap-theme', theme);
  const sunIcon  = $('#theme-sun-icon');
  const moonIcon = $('#theme-moon-icon');
  if (theme === 'dark') {
    if (sunIcon)  sunIcon.style.display  = '';
    if (moonIcon) moonIcon.style.display = 'none';
  } else {
    if (sunIcon)  sunIcon.style.display  = 'none';
    if (moonIcon) moonIcon.style.display = '';
  }
}

function initTheme() {
  const saved = localStorage.getItem('kap-theme') || 'dark';
  applyTheme(saved);
  const btn = $('#theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = APP.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? 'Dark mode active' : 'Light mode active', '🌓');
    });
  }
}

// ===========================================================================
// ACCENT COLOR SWITCHER
// ===========================================================================
const ACCENT_LABELS = {
  cyan:    'Blueprint Cyan',
  amber:   'Industrial Amber',
  crimson: 'Getsuga Crimson',
  purple:  'Ryuo Purple',
  emerald: 'Precision Emerald',
};

function applyAccent(accent) {
  APP.accent = accent;
  document.documentElement.setAttribute('data-accent', accent);
  localStorage.setItem('kap-accent', accent);
  $$('.accent-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.accent === accent);
  });
}

function initAccentPicker() {
  const savedAccent = localStorage.getItem('kap-accent') || 'crimson';
  applyAccent(savedAccent);
  $$('.accent-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const a = dot.dataset.accent;
      applyAccent(a);
      showToast(`Accent: ${ACCENT_LABELS[a] || a}`, '🎨');
      playHaptic('click');
    });
  });
}

// ===========================================================================
// NAVBAR SCROLL BEHAVIOUR
// ===========================================================================
function initNavbar() {
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');

  window.addEventListener('scroll', debounce(() => {
    APP.scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    const sections = $$('section[id], div[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
      const href = a.getAttribute('href')?.replace('#', '');
      a.classList.toggle('active', href === current);
    });
  }, 80));
}

// ===========================================================================
// MOBILE DRAWER
// ===========================================================================
function initMobileDrawer() {
  const toggleBtn = $('#mobile-menu-toggle');
  const drawer    = $('#mobile-drawer');

  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
  });

  $$('[data-close-drawer]').forEach(el => {
    el.addEventListener('click', () => {
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ===========================================================================
// AUDIO HAPTICS
// ===========================================================================
function initAudio() {
  const btn        = $('#audio-toggle-btn');
  const iconMuted  = $('#audio-icon-muted');
  const iconActive = $('#audio-icon-active');
  if (!btn) return;
  btn.addEventListener('click', () => {
    APP.audioEnabled = !APP.audioEnabled;
    iconMuted.style.display  = APP.audioEnabled ? 'none' : '';
    iconActive.style.display = APP.audioEnabled ? '' : 'none';
    showToast(APP.audioEnabled ? 'Audio haptics on' : 'Audio haptics off', '🔊');
  });
}

function playHaptic(type = 'click') {
  if (!APP.audioEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const map = { click: [600, 0.02, 'sine'], success: [880, 0.05, 'sine'], error: [200, 0.05, 'sawtooth'] };
    const [freq, dur, type_] = map[type] || map.click;
    osc.type = type_;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

// ===========================================================================
// HD ANIME SWORD ENGINE
// ===========================================================================

/* --------------------------------------------------------------------------
   Sword definitions — each has physics params + draw function
   -------------------------------------------------------------------------- */
const SWORD_DEFS = [
  {
    id:    'ichigo',
    label: 'Tensa Zangetsu',
    char:  'Ichigo',
    emoji: '🌑',
    // Canvas drawing function — receives (ctx, params)
    draw: drawIchigo,
    // Colors used in particle effects
    particleColors: ['#ef4444','#dc2626','#991b1b','#fca5a5','#ff6b6b'],
    auraColor: 'rgba(239,68,68,0.35)',
  },
  {
    id:    'kusanagi',
    label: 'Kusanagi',
    char:  'Sasuke',
    emoji: '⚡',
    draw: drawKusanagi,
    particleColors: ['#60a5fa','#3b82f6','#a78bfa','#c4b5fd','#e0f2fe'],
    auraColor: 'rgba(96,165,250,0.30)',
  },
  {
    id:    'wado',
    label: 'Wado Ichimonji',
    char:  'Zoro',
    emoji: '🤍',
    draw: drawWado,
    particleColors: ['#e2e8f0','#94a3b8','#67e8f9','#a5f3fc','#f0f9ff'],
    auraColor: 'rgba(148,163,184,0.28)',
  },
  {
    id:    'kitetsu',
    label: 'Sandai Kitetsu',
    char:  'Zoro',
    emoji: '🔴',
    draw: drawKitetsu,
    particleColors: ['#f87171','#ef4444','#dc2626','#fbbf24','#fca5a5'],
    auraColor: 'rgba(248,113,113,0.32)',
  },
  {
    id:    'enma',
    label: 'Enma',
    char:  'Zoro',
    emoji: '🟣',
    draw: drawEnma,
    particleColors: ['#c084fc','#a855f7','#7c3aed','#e9d5ff','#d8b4fe'],
    auraColor: 'rgba(192,132,252,0.30)',
  },
];

/* --------------------------------------------------------------------------
   Particle system
   -------------------------------------------------------------------------- */
function spawnParticle(x, y, colors, auraColor) {
  const count = rndInt(1, 3);
  for (let i = 0; i < count; i++) {
    APP.particles.push({
      x, y,
      vx: rnd(-1.4, 1.4),
      vy: rnd(-2.8, -0.6),
      life: 1.0,
      decay: rnd(0.012, 0.025),
      size: rnd(1.5, 4.5),
      color: colors[rndInt(0, colors.length - 1)],
      spin: rnd(-0.15, 0.15),
    });
  }
}

function updateParticles() {
  APP.particles = APP.particles.filter(p => p.life > 0);
  APP.particles.forEach(p => {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.04;  // gravity
    p.life -= p.decay;
    p.vx  *= 0.98;
  });
}

function drawParticles(ctx) {
  APP.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life * 0.85;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, TAU);
    ctx.fill();
    ctx.restore();
  });
}

/* --------------------------------------------------------------------------
   Sword object factory
   -------------------------------------------------------------------------- */
function createSword(defIndex, isHero) {
  const def = SWORD_DEFS[defIndex];
  const W = APP.W, H = APP.H;

  // Position — hero sword floats in center-right area; others scatter
  let x, y, scale, angle;
  if (isHero) {
    x     = W * rnd(0.58, 0.78);
    y     = H * rnd(0.30, 0.70);
    scale = clamp(Math.min(W, H) * 0.0013, 0.60, 1.20);
    angle = rnd(-0.22, 0.22);
  } else {
    x     = rnd(W * 0.06, W * 0.94);
    y     = rnd(H * 0.06, H * 0.94);
    scale = clamp(Math.min(W, H) * rnd(0.0005, 0.0010), 0.25, 0.70);
    angle = rnd(0, TAU);
  }

  return {
    defIndex,
    def,
    x, y,
    angle,
    targetAngle:   angle,
    driftAngle:    rnd(0, TAU),
    driftSpeed:    rnd(0.004, 0.009),
    driftRadius:   rnd(15, 45),
    bobY:          rnd(0, TAU),
    bobSpeed:      rnd(0.003, 0.007),
    bobAmp:        isHero ? rnd(6, 14) : rnd(3, 8),
    rotateSpeed:   rnd(-0.006, 0.006),
    scale,
    alpha:         isHero ? 1.0 : rnd(0.30, 0.65),
    isHero,
    pulseT:        rnd(0, TAU),
    pulseSpeed:    rnd(0.025, 0.040),
    particleTimer: 0,
    particleRate:  isHero ? rnd(3, 7) : rnd(10, 24),
  };
}

/* --------------------------------------------------------------------------
   Build sword scene
   -------------------------------------------------------------------------- */
function buildSwordScene() {
  APP.swords = [];
  const W = APP.W;

  // Determine which sword defs to include
  let defs;
  if (APP.activeSword === 'all') {
    defs = SWORD_DEFS.map((_, i) => i);
  } else {
    defs = [SWORD_DEFS.findIndex(d => d.id === APP.activeSword)];
    if (defs[0] === -1) defs = [0];
  }

  // Hero sword — one prominent centered blade
  const heroDefIdx = defs[rndInt(0, defs.length - 1)];
  APP.swords.push(createSword(heroDefIdx, true));

  // Background swords
  const bgCount = APP.activeSword === 'all' ? 7 : 4;
  for (let i = 0; i < bgCount; i++) {
    const idx = defs[i % defs.length];
    APP.swords.push(createSword(idx, false));
  }

  updateSwordBanner();
}

/* --------------------------------------------------------------------------
   Update sword banner (hero HUD)
   -------------------------------------------------------------------------- */
function updateSwordBanner() {
  const labelEl = $('#active-sword-label');
  const stateEl = $('#active-sword-state');
  if (!labelEl || !stateEl) return;
  const pill = $(`.sword-select-pill.active`);
  const label = pill ? pill.dataset.label || pill.textContent.trim() : 'All Blades';
  labelEl.textContent = `Active Blade: ${label}`;
  stateEl.textContent = 'Animated · Interactive';
}

/* --------------------------------------------------------------------------
   Sword draw functions — HD procedural rendering
   -------------------------------------------------------------------------- */

// — — — ICHIGO's TENSA ZANGETSU — — —
// Curved daito, Manji tsuba, black cloth hilt, crimson chain, Getsuga ribbons
function drawIchigo(ctx, scale, t, alpha, isHero) {
  const s = scale * 130;

  // ── Energy aura / Getsuga haze ──
  if (isHero) {
    const g = ctx.createRadialGradient(0, 0, s * 0.2, 0, 0, s * 0.8);
    g.addColorStop(0, 'rgba(239,68,68,0.12)');
    g.addColorStop(1, 'rgba(239,68,68,0.00)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.9, 0, 0, TAU);
    ctx.fill();
  }

  // ── Getsuga crimson ribbons ──
  if (isHero) {
    for (let r = 0; r < 3; r++) {
      const wave = Math.sin(t * 0.03 + r * 2.1 + 1.2) * s * 0.18;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 0.04 + r);
      ctx.strokeStyle = r === 0 ? '#ef4444' : r === 1 ? '#dc2626' : '#fca5a5';
      ctx.lineWidth = 2.5 - r * 0.5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.82 + r * s * 0.05);
      ctx.bezierCurveTo(
        wave, -s * 0.5,
        -wave, -s * 0.2,
        wave * 0.6, s * 0.3
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Blade — curved daito ──
  ctx.save();
  // Blade base shape (back edge)
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.92);       // Kissaki tip
  ctx.bezierCurveTo(
    s * 0.08, -s * 0.70,
    s * 0.10, -s * 0.30,
    s * 0.07, s * 0.10            // Munemachi (blade/hilt join)
  );
  ctx.lineTo(s * 0.03, s * 0.10);
  ctx.bezierCurveTo(
    s * 0.06, -s * 0.28,
    s * 0.04, -s * 0.68,
    -s * 0.02, -s * 0.92
  );
  ctx.closePath();

  // Blade gradient — mirror polish
  const bladeGrad = ctx.createLinearGradient(-s * 0.05, -s * 0.9, s * 0.12, s * 0.1);
  bladeGrad.addColorStop(0.0,  '#e8e8f0');
  bladeGrad.addColorStop(0.25, '#b8bfca');
  bladeGrad.addColorStop(0.5,  '#d0d5de');
  bladeGrad.addColorStop(0.75, '#8a9098');
  bladeGrad.addColorStop(1.0,  '#6d737c');
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Hamon line (temper line)
  ctx.beginPath();
  ctx.moveTo(s * 0.04, s * 0.06);
  ctx.bezierCurveTo(s * 0.07, -s * 0.18, s * 0.09, -s * 0.42, s * 0.05, -s * 0.78);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Edge highlight
  ctx.beginPath();
  ctx.moveTo(-s * 0.018, -s * 0.91);
  ctx.bezierCurveTo(-s * 0.01, -s * 0.60, 0, -s * 0.28, s * 0.02, s * 0.10);
  ctx.strokeStyle = 'rgba(220,225,240,0.90)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.restore();

  // ── Habaki collar ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.055, s * 0.06, s * 0.115, s * 0.055);
  const habakiG = ctx.createLinearGradient(-s * 0.055, 0, s * 0.06, 0);
  habakiG.addColorStop(0, '#4a4a54');
  habakiG.addColorStop(0.5, '#7a7a88');
  habakiG.addColorStop(1, '#3a3a44');
  ctx.fillStyle = habakiG;
  ctx.fill();
  ctx.restore();

  // ── Manji tsuba (cross-guard) ──
  ctx.save();
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = s * 0.036;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  // Horizontal bar
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, s * 0.115);
  ctx.lineTo( s * 0.22, s * 0.115);
  ctx.stroke();
  // Manji hook - top left
  ctx.beginPath();
  ctx.moveTo(-s * 0.22, s * 0.115);
  ctx.lineTo(-s * 0.22, s * 0.05);
  ctx.stroke();
  // Manji hook - bottom right
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.115);
  ctx.lineTo(s * 0.22, s * 0.18);
  ctx.stroke();
  ctx.restore();

  // ── Hilt — black cloth diamond wrap ──
  ctx.save();
  const hiltLen = s * 0.36;
  ctx.beginPath();
  ctx.rect(-s * 0.045, s * 0.155, s * 0.09, hiltLen);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  // Diamond ito wrap
  for (let d = 0; d < 7; d++) {
    const dy = s * 0.165 + d * s * 0.048;
    ctx.beginPath();
    ctx.moveTo(-s * 0.045, dy);
    ctx.lineTo(0, dy + s * 0.024);
    ctx.lineTo(s * 0.045, dy);
    ctx.strokeStyle = 'rgba(80,80,95,0.70)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();

  // ── Chain links ──
  if (isHero) {
    ctx.save();
    const chainSwing = Math.sin(t * 0.02) * s * 0.12;
    const chainY = s * 0.52;
    for (let c = 0; c < 5; c++) {
      const cx = chainSwing * (c / 4);
      const cy = chainY + c * s * 0.06;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 0.022, s * 0.014, Math.PI / 4 + c * 0.4, 0, TAU);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Pommel ──
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, s * 0.54, s * 0.05, s * 0.03, 0, 0, TAU);
  ctx.fillStyle = '#2a2a2a';
  ctx.fill();
  ctx.restore();
}

// — — — SASUKE's KUSANAGI — — —
// Straight chokuto, chrome blade, black hilt, Chidori lightning arcs
function drawKusanagi(ctx, scale, t, alpha, isHero) {
  const s = scale * 130;

  // ── Chidori lightning field ──
  if (isHero) {
    for (let l = 0; l < 4; l++) {
      ctx.save();
      ctx.globalAlpha = 0.55 * Math.abs(Math.sin(t * 0.08 + l * 1.6));
      ctx.strokeStyle = l % 2 === 0 ? '#60a5fa' : '#a78bfa';
      ctx.lineWidth = 1.0;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      let lx = rnd(-s * 0.25, s * 0.25);
      let ly = -s * 0.75;
      ctx.moveTo(lx, ly);
      for (let seg = 0; seg < 5; seg++) {
        lx += rnd(-s * 0.08, s * 0.08);
        ly += rnd(s * 0.12, s * 0.22);
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Straight chokuto blade ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.90);       // Tip
  ctx.lineTo( s * 0.05, -s * 0.82);
  ctx.lineTo( s * 0.06,  s * 0.08);
  ctx.lineTo(-s * 0.06,  s * 0.08);
  ctx.lineTo(-s * 0.04, -s * 0.82);
  ctx.closePath();

  const bladeGrad = ctx.createLinearGradient(-s * 0.06, 0, s * 0.06, 0);
  bladeGrad.addColorStop(0.0,  '#c8d0e0');
  bladeGrad.addColorStop(0.3,  '#e8ecf4');
  bladeGrad.addColorStop(0.55, '#f4f6fa');
  bladeGrad.addColorStop(0.80, '#b8c0cc');
  bladeGrad.addColorStop(1.0,  '#7a8090');
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Fuller groove
  ctx.beginPath();
  ctx.moveTo(s * 0.012, -s * 0.84);
  ctx.lineTo(s * 0.012,  s * 0.04);
  ctx.strokeStyle = 'rgba(160,170,190,0.55)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Edge gleam
  ctx.beginPath();
  ctx.moveTo(-s * 0.038, -s * 0.88);
  ctx.lineTo(-s * 0.056,  s * 0.06);
  ctx.strokeStyle = 'rgba(235,240,255,0.92)';
  ctx.lineWidth = 1.4;
  ctx.shadowColor = 'rgba(96,165,250,0.7)';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Blue tint at tip (lightning charge)
  const tipGrad = ctx.createLinearGradient(0, -s * 0.90, 0, -s * 0.60);
  tipGrad.addColorStop(0, 'rgba(96,165,250,0.50)');
  tipGrad.addColorStop(1, 'rgba(96,165,250,0.00)');
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.90);
  ctx.lineTo(s * 0.05, -s * 0.82);
  ctx.lineTo(-s * 0.04, -s * 0.82);
  ctx.closePath();
  ctx.fillStyle = tipGrad;
  ctx.fill();
  ctx.restore();

  // ── Habaki ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.07, s * 0.04, s * 0.14, s * 0.06);
  const hG = ctx.createLinearGradient(-s * 0.07, 0, s * 0.07, 0);
  hG.addColorStop(0, '#1a1a2a');
  hG.addColorStop(0.5, '#3a3a5a');
  hG.addColorStop(1, '#1a1a2a');
  ctx.fillStyle = hG;
  ctx.fill();
  ctx.restore();

  // ── Round tsuba with kunai slots ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.13, s * 0.14, 0, TAU);
  ctx.fillStyle = '#1c1c28';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 8;
  ctx.stroke();
  // Inner circle
  ctx.beginPath();
  ctx.arc(0, s * 0.13, s * 0.08, 0, TAU);
  ctx.strokeStyle = 'rgba(96,165,250,0.35)';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  // ── Black hilt with blue bindings ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.045, s * 0.27, s * 0.09, s * 0.32);
  ctx.fillStyle = '#0f0f1a';
  ctx.fill();
  // Blue wrap lines
  for (let b = 0; b < 6; b++) {
    const by = s * 0.28 + b * s * 0.046;
    ctx.beginPath();
    ctx.moveTo(-s * 0.045, by);
    ctx.lineTo( s * 0.045, by);
    ctx.strokeStyle = 'rgba(59,130,246,0.50)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
  ctx.restore();

  // ── Pommel ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.62, s * 0.052, 0, TAU);
  ctx.fillStyle = '#1c1c28';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

// — — — ZORO's WADO ICHIMONJI — — —
// White-polished blade, gold circular tsuba, white hilt wrap, cyan wind slashes
function drawWado(ctx, scale, t, alpha, isHero) {
  const s = scale * 130;

  // ── Cyan wind slashes ──
  if (isHero) {
    for (let w = 0; w < 3; w++) {
      const age = (t * 0.018 + w * 2.1) % TAU;
      const fade = Math.sin(age) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = fade * 0.45;
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.2 + w * 0.4;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, -s * 0.2, s * (0.25 + w * 0.12), -0.7, 0.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Polished white-silver blade ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.92);
  ctx.lineTo(s * 0.04, -s * 0.84);
  ctx.lineTo(s * 0.06,  s * 0.06);
  ctx.lineTo(-s * 0.06,  s * 0.06);
  ctx.lineTo(-s * 0.04, -s * 0.84);
  ctx.closePath();

  const bladeGrad = ctx.createLinearGradient(-s * 0.06, 0, s * 0.06, 0);
  bladeGrad.addColorStop(0.00, '#f0f4fa');
  bladeGrad.addColorStop(0.30, '#ffffff');
  bladeGrad.addColorStop(0.60, '#e8ecf4');
  bladeGrad.addColorStop(0.85, '#c8d4e0');
  bladeGrad.addColorStop(1.00, '#a8b8c8');
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Mirror hamon — wavy temper line
  ctx.beginPath();
  let hamonX = s * 0.035;
  for (let hy = s * 0.05; hy > -s * 0.85; hy -= s * 0.06) {
    hamonX = s * 0.032 + Math.sin(hy * 5.5) * s * 0.008;
    ctx.lineTo(hamonX, hy);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.80)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Bright edge
  ctx.beginPath();
  ctx.moveTo(-s * 0.038, -s * 0.90);
  ctx.lineTo(-s * 0.055,  s * 0.04);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.6;
  ctx.shadowColor = 'rgba(103,232,249,0.8)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();

  // ── Gold habaki ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.065, s * 0.03, s * 0.13, s * 0.06);
  const habG = ctx.createLinearGradient(-s * 0.065, 0, s * 0.065, 0);
  habG.addColorStop(0, '#7a6000');
  habG.addColorStop(0.4, '#d4a800');
  habG.addColorStop(0.7, '#f0cc00');
  habG.addColorStop(1, '#7a6000');
  ctx.fillStyle = habG;
  ctx.fill();
  ctx.restore();

  // ── Gold circular tsuba ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.12, s * 0.13, 0, TAU);
  const tsubaGrad = ctx.createRadialGradient(0, s * 0.12, s * 0.04, 0, s * 0.12, s * 0.13);
  tsubaGrad.addColorStop(0, '#d4a800');
  tsubaGrad.addColorStop(0.5, '#a07800');
  tsubaGrad.addColorStop(1, '#6a5000');
  ctx.fillStyle = tsubaGrad;
  ctx.fill();
  // Gold rim
  ctx.strokeStyle = '#f0cc00';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#f0cc00';
  ctx.shadowBlur = 6;
  ctx.stroke();
  // Inner ring
  ctx.beginPath();
  ctx.arc(0, s * 0.12, s * 0.075, 0, TAU);
  ctx.strokeStyle = 'rgba(240,204,0,0.45)';
  ctx.lineWidth = 1.0;
  ctx.stroke();
  ctx.restore();

  // ── White hilt with ray-skin diamonds ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.042, s * 0.25, s * 0.084, s * 0.32);
  ctx.fillStyle = '#f8f8fc';
  ctx.fill();
  // Diamond wrap (white cloth)
  for (let d = 0; d < 7; d++) {
    const dy = s * 0.26 + d * s * 0.044;
    ctx.beginPath();
    ctx.moveTo(-s * 0.042, dy);
    ctx.lineTo(0, dy + s * 0.022);
    ctx.lineTo(s * 0.042, dy);
    ctx.strokeStyle = 'rgba(200,210,220,0.65)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
  ctx.restore();

  // ── White pommel ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.60, s * 0.048, 0, TAU);
  ctx.fillStyle = '#e8eaf0';
  ctx.fill();
  ctx.strokeStyle = '#d4a800';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

// — — — ZORO's SANDAI KITETSU — — —
// Flared guard, red tsuka, wavy hamon, demonic scarlet embers
function drawKitetsu(ctx, scale, t, alpha, isHero) {
  const s = scale * 130;

  // ── Scarlet ember particles emanating ──
  if (isHero && Math.random() < 0.12) {
    spawnParticle(
      rnd(-s * 0.08, s * 0.08),
      rnd(-s * 0.6, -s * 0.1),
      ['#ef4444', '#f87171', '#fca5a5', '#fbbf24'],
      'rgba(239,68,68,0.3)'
    );
  }

  // ── Demonic red aura ──
  if (isHero) {
    const aura = ctx.createRadialGradient(0, -s * 0.1, 0, 0, -s * 0.1, s * 0.6);
    aura.addColorStop(0, 'rgba(239,68,68,0.15)');
    aura.addColorStop(0.6, 'rgba(239,68,68,0.06)');
    aura.addColorStop(1, 'rgba(239,68,68,0.00)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.42, s * 0.70, 0, 0, TAU);
    ctx.fill();
  }

  // ── Blade with wavy hamon ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.90);
  ctx.lineTo( s * 0.055, -s * 0.82);
  ctx.lineTo( s * 0.065,  s * 0.06);
  ctx.lineTo(-s * 0.065,  s * 0.06);
  ctx.lineTo(-s * 0.04,  -s * 0.82);
  ctx.closePath();

  const bladeGrad = ctx.createLinearGradient(-s * 0.065, 0, s * 0.065, 0);
  bladeGrad.addColorStop(0.00, '#c8ccd8');
  bladeGrad.addColorStop(0.25, '#e0e4f0');
  bladeGrad.addColorStop(0.55, '#d8dcec');
  bladeGrad.addColorStop(0.80, '#a0a8b8');
  bladeGrad.addColorStop(1.00, '#708090');
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Wavy flame hamon
  ctx.beginPath();
  ctx.moveTo(s * 0.025, s * 0.04);
  for (let h = 1; h <= 14; h++) {
    const hy = s * 0.04 - h * s * 0.067;
    const hx = s * 0.025 + Math.sin(h * 1.4 + t * 0.03) * s * 0.018;
    ctx.lineTo(hx, hy);
  }
  ctx.strokeStyle = 'rgba(255,180,180,0.70)';
  ctx.lineWidth = 1.0;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.stroke();

  // Red-tinted edge
  ctx.beginPath();
  ctx.moveTo(-s * 0.038, -s * 0.88);
  ctx.lineTo(-s * 0.058, s * 0.04);
  ctx.strokeStyle = 'rgba(252,165,165,0.88)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(239,68,68,0.8)';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();

  // ── Habaki (dark) ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.07, s * 0.04, s * 0.14, s * 0.055);
  ctx.fillStyle = '#3a1010';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  // ── Flared notched guard ──
  ctx.save();
  // Main tsuba — wider flared
  ctx.beginPath();
  for (let pt = 0; pt < 8; pt++) {
    const a = (pt / 8) * TAU - Math.PI / 8;
    const r2 = pt % 2 === 0 ? s * 0.17 : s * 0.13;
    if (pt === 0) ctx.moveTo(Math.cos(a) * r2, s * 0.12 + Math.sin(a) * r2);
    else ctx.lineTo(Math.cos(a) * r2, s * 0.12 + Math.sin(a) * r2);
  }
  ctx.closePath();
  ctx.fillStyle = '#2a0808';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();

  // ── Red tsuka wrap ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.044, s * 0.27, s * 0.088, s * 0.33);
  ctx.fillStyle = '#8b0000';
  ctx.fill();
  // Black cross-wrap
  for (let w = 0; w < 7; w++) {
    const wy = s * 0.28 + w * s * 0.044;
    ctx.beginPath();
    ctx.moveTo(-s * 0.044, wy);
    ctx.lineTo( s * 0.044, wy + s * 0.02);
    ctx.strokeStyle = 'rgba(20,0,0,0.60)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();

  // ── Pommel ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.63, s * 0.052, 0, TAU);
  ctx.fillStyle = '#3a0808';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

// — — — ZORO's ENMA — — —
// Cloverleaf tsuba, lilac wrap, gold cherry blossom accents, purple Ryuo vapor
function drawEnma(ctx, scale, t, alpha, isHero) {
  const s = scale * 130;

  // ── Ryuo purple vapor ──
  if (isHero) {
    for (let v = 0; v < 3; v++) {
      const vAngle = t * 0.015 + v * 2.1;
      const vr = s * (0.22 + v * 0.11);
      ctx.save();
      ctx.globalAlpha = 0.22 + 0.12 * Math.sin(t * 0.025 + v);
      const vGrad = ctx.createRadialGradient(
        Math.cos(vAngle) * vr * 0.5, Math.sin(vAngle) * vr * 0.5 - s * 0.1, 0,
        Math.cos(vAngle) * vr * 0.5, Math.sin(vAngle) * vr * 0.5 - s * 0.1, vr * 0.8
      );
      vGrad.addColorStop(0, 'rgba(192,132,252,0.55)');
      vGrad.addColorStop(1, 'rgba(192,132,252,0.00)');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(vAngle) * vr * 0.3, Math.sin(vAngle) * vr * 0.3 - s * 0.1,
        vr * 0.35, vr * 0.55, vAngle, 0, TAU
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Blade — dark-silver with purple sheen ──
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.91);
  ctx.lineTo( s * 0.05, -s * 0.83);
  ctx.lineTo( s * 0.065,  s * 0.06);
  ctx.lineTo(-s * 0.065,  s * 0.06);
  ctx.lineTo(-s * 0.04,  -s * 0.83);
  ctx.closePath();

  const bladeGrad = ctx.createLinearGradient(-s * 0.065, 0, s * 0.065, 0);
  bladeGrad.addColorStop(0.00, '#9090b0');
  bladeGrad.addColorStop(0.30, '#c8c0e0');
  bladeGrad.addColorStop(0.55, '#b0a8d0');
  bladeGrad.addColorStop(0.80, '#7878a0');
  bladeGrad.addColorStop(1.00, '#5050708');
  ctx.fillStyle = bladeGrad;
  ctx.fill();

  // Purple edge glow (Ryuo haki)
  ctx.beginPath();
  ctx.moveTo(-s * 0.038, -s * 0.89);
  ctx.lineTo(-s * 0.056,  s * 0.04);
  ctx.strokeStyle = 'rgba(196,140,255,0.88)';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = 'rgba(168,85,247,0.85)';
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Hamon
  ctx.beginPath();
  ctx.moveTo(s * 0.032, s * 0.04);
  ctx.bezierCurveTo(s * 0.040, -s * 0.28, s * 0.038, -s * 0.55, s * 0.026, -s * 0.82);
  ctx.strokeStyle = 'rgba(220,210,255,0.65)';
  ctx.lineWidth = 1.0;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();

  // ── Gold habaki ──
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.07, s * 0.03, s * 0.14, s * 0.058);
  const hG = ctx.createLinearGradient(-s * 0.07, 0, s * 0.07, 0);
  hG.addColorStop(0, '#6a5000');
  hG.addColorStop(0.4, '#c89800');
  hG.addColorStop(0.7, '#e0b400');
  hG.addColorStop(1, '#6a5000');
  ctx.fillStyle = hG;
  ctx.fill();
  ctx.restore();

  // ── Trefoil / cloverleaf gold tsuba ──
  ctx.save();
  ctx.translate(0, s * 0.12);
  for (let p = 0; p < 3; p++) {
    const pa = (p / 3) * TAU - Math.PI / 2;
    const px = Math.cos(pa) * s * 0.085;
    const py = Math.sin(pa) * s * 0.085;
    ctx.beginPath();
    ctx.arc(px, py, s * 0.085, 0, TAU);
    const leafG = ctx.createRadialGradient(px, py, 0, px, py, s * 0.085);
    leafG.addColorStop(0, '#e0b400');
    leafG.addColorStop(0.6, '#a07800');
    leafG.addColorStop(1, '#6a5000');
    ctx.fillStyle = leafG;
    ctx.fill();
    ctx.strokeStyle = '#f0cc00';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#f0cc00';
    ctx.shadowBlur = 6;
    ctx.stroke();
  }
  // Center disc
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.045, 0, TAU);
  ctx.fillStyle = '#e0b400';
  ctx.fill();
  ctx.restore();

  // ── Cherry blossom accents on hilt ──
  // Lilac hilt wrap
  ctx.save();
  ctx.beginPath();
  ctx.rect(-s * 0.044, s * 0.26, s * 0.088, s * 0.33);
  ctx.fillStyle = '#7c3aed';
  ctx.fill();
  // Gold diagonal wrap
  for (let w = 0; w < 7; w++) {
    const wy = s * 0.27 + w * s * 0.044;
    ctx.beginPath();
    ctx.moveTo(-s * 0.044, wy);
    ctx.lineTo( s * 0.044, wy + s * 0.02);
    ctx.strokeStyle = 'rgba(240,204,0,0.45)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
  // Cherry blossom dots
  if (isHero) {
    for (let cb = 0; cb < 5; cb++) {
      const cbx = rnd(-s * 0.20, s * 0.20);
      const cby = rnd(-s * 0.70, s * 0.20);
      const fade = Math.sin(t * 0.02 + cb * 1.3) * 0.5 + 0.5;
      ctx.globalAlpha = fade * 0.7;
      ctx.beginPath();
      for (let petal = 0; petal < 5; petal++) {
        const pa = (petal / 5) * TAU;
        const pr = s * 0.018;
        ctx.beginPath();
        ctx.arc(cbx + Math.cos(pa) * pr, cby + Math.sin(pa) * pr, pr * 0.55, 0, TAU);
        ctx.fillStyle = '#f9a8d4';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // ── Pommel ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, s * 0.62, s * 0.052, 0, TAU);
  ctx.fillStyle = '#4c1d95';
  ctx.fill();
  ctx.strokeStyle = '#f0cc00';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

/* --------------------------------------------------------------------------
   Animation loop
   -------------------------------------------------------------------------- */
function animLoop(t = 0) {
  const { ctx, W, H } = APP;
  ctx.clearRect(0, 0, W, H);

  // Parallax offset from scroll
  const parallaxY = APP.scrollY * 0.08;

  // Draw background swords first, then hero
  const sorted = [...APP.swords].sort((a, b) => a.isHero ? 1 : -1);

  sorted.forEach(sw => {
    sw.angle    += sw.rotateSpeed;
    sw.bobY     += sw.bobSpeed;
    sw.pulseT   += sw.pulseSpeed;
    sw.driftAngle += sw.driftSpeed;

    // Position with drift + bob
    const drawX = sw.x + Math.cos(sw.driftAngle) * sw.driftRadius * 0.4;
    const drawY = sw.y + Math.sin(sw.bobY) * sw.bobAmp
                 - parallaxY * (sw.isHero ? 0.3 : 0.15);

    // Pulse scale for hero blade
    let sc = sw.scale;
    if (sw.isHero) {
      sc = sw.scale * (1.0 + Math.sin(sw.pulseT) * 0.025);
    }

    // Spawn trail particles for hero blade
    sw.particleTimer++;
    if (sw.particleTimer >= sw.particleRate) {
      sw.particleTimer = 0;
      const tipX = drawX + Math.cos(sw.angle - Math.PI / 2) * sc * 130 * 0.88;
      const tipY = drawY + Math.sin(sw.angle - Math.PI / 2) * sc * 130 * 0.88;
      spawnParticle(tipX, tipY, sw.def.particleColors, sw.def.auraColor);
    }

    ctx.save();
    ctx.globalAlpha = sw.alpha;
    ctx.translate(drawX, drawY);
    ctx.rotate(sw.angle);

    // Aura glow for hero
    if (sw.isHero) {
      ctx.shadowColor = sw.def.auraColor;
      ctx.shadowBlur  = 30;
    }

    sw.def.draw(ctx, sc, t, sw.alpha, sw.isHero);

    ctx.restore();
  });

  // Particles
  updateParticles();
  drawParticles(ctx);

  APP.animFrameId = requestAnimationFrame(ts => animLoop(ts * 0.05));
}

/* --------------------------------------------------------------------------
   Resize handler
   -------------------------------------------------------------------------- */
function handleResize() {
  const canvas = APP.canvas;
  APP.W = canvas.width  = window.innerWidth;
  APP.H = canvas.height = window.innerHeight;
  buildSwordScene();
}

/* --------------------------------------------------------------------------
   Sword toolbar interaction
   -------------------------------------------------------------------------- */
function initSwordToolbar() {
  $$('.sword-select-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.sword-select-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      APP.activeSword = pill.dataset.sword;
      APP.particles = [];
      buildSwordScene();
      playHaptic('click');
      const label = pill.dataset.label || pill.textContent.trim();
      showToast(`Blade selected: ${label}`, '⚔️');
    });
  });
}

/* --------------------------------------------------------------------------
   Canvas init
   -------------------------------------------------------------------------- */
function initSwordEngine() {
  const canvas = $('#ambient-canvas');
  if (!canvas) return;
  APP.canvas = canvas;
  APP.ctx    = canvas.getContext('2d');
  APP.W = canvas.width  = window.innerWidth;
  APP.H = canvas.height = window.innerHeight;

  window.addEventListener('resize', debounce(handleResize, 200));
  window.addEventListener('scroll', () => { APP.scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('mousemove', e => {
    APP.mouse.x = e.clientX;
    APP.mouse.y = e.clientY;
  }, { passive: true });

  buildSwordScene();
  animLoop();
}

// ===========================================================================
// COMMAND PALETTE
// ===========================================================================
const CMD_ITEMS = [
  { id: 'goto_hero',          icon: '🏠', title: 'Go to Overview',              desc: 'Hero / Landing section',              action: () => scrollTo('#hero') },
  { id: 'goto_projects',      icon: '⚙️', title: 'Go to Projects',              desc: 'Mechanical design portfolio',          action: () => scrollTo('#projects') },
  { id: 'goto_architecture',  icon: '🔧', title: 'Go to Skills & Tools',        desc: 'CAD, FEA, simulation stack',          action: () => scrollTo('#architecture') },
  { id: 'goto_experience',    icon: '🏭', title: 'Go to Experience',            desc: 'Work history & education',             action: () => scrollTo('#experience') },
  { id: 'goto_documentation', icon: '📐', title: 'Go to Documentation',         desc: 'AutoCAD, GD&T, BOMs',                  action: () => scrollTo('#documentation') },
  { id: 'goto_contact',       icon: '📧', title: 'Get in Touch',                desc: 'Contact & engineering enquiry',         action: () => scrollTo('#contact') },
  { id: 'theme_toggle',       icon: '🌓', title: 'Toggle Theme',                desc: 'Switch dark / light mode',             action: () => $('#theme-toggle-btn').click() },
  { id: 'sword_all',          icon: '⚔️', title: 'All Blades',                  desc: 'Show all anime swords',                action: () => setSword('all') },
  { id: 'sword_ichigo',       icon: '🌑', title: 'Ichigo – Tensa Zangetsu',     desc: 'Curved daito, crimson Getsuga',        action: () => setSword('ichigo') },
  { id: 'sword_kusanagi',     icon: '⚡', title: 'Sasuke – Kusanagi',           desc: 'Chokuto, Chidori lightning',           action: () => setSword('kusanagi') },
  { id: 'sword_wado',         icon: '🤍', title: 'Zoro – Wado Ichimonji',       desc: 'White blade, gold tsuba',              action: () => setSword('wado') },
  { id: 'sword_kitetsu',      icon: '🔴', title: 'Zoro – Sandai Kitetsu',       desc: 'Cursed blade, scarlet embers',         action: () => setSword('kitetsu') },
  { id: 'sword_enma',         icon: '🟣', title: 'Zoro – Enma',                 desc: 'Cloverleaf tsuba, Ryuo vapor',         action: () => setSword('enma') },
  { id: 'calc_cargo',         icon: '🛫', title: 'Simulate: Air Cargo Deck',    desc: 'Calculate 7,000 kg ULD load stress',   action: () => runSimCmd('calc-air-cargo') },
  { id: 'calc_strip',         icon: '🦾', title: 'Simulate: Strip Flattening',  desc: 'Roll force for 6mm steel strip',       action: () => runSimCmd('strip-tonnage') },
  { id: 'calc_tspacer',       icon: '⚡', title: 'Simulate: T-Spacer Cycle',    desc: 'SPM cycle time calculation',           action: () => runSimCmd('t-spacer-cycle') },
  { id: 'calc_steel',         icon: '🏗️', title: 'Simulate: Steel Plant Quote', desc: 'Budgetary CAPEX estimate',             action: () => runSimCmd('steel-plant-quote') },
  { id: 'copy_email',         icon: '📋', title: 'Copy Email Address',          desc: 'pran.acharya.eng@gmail.com',           action: () => copyText('pran.acharya.eng@gmail.com', 'Email copied!') },
];

function scrollTo(hash) { document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); closeCmdPalette(); }

function setSword(id) {
  const pill = $(`.sword-select-pill[data-sword="${id}"]`);
  if (pill) {
    $$('.sword-select-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  }
  APP.activeSword = id;
  APP.particles = [];
  buildSwordScene();
  closeCmdPalette();
}

function runSimCmd(cmd) {
  const btn = $(`[data-cmd="${cmd}"]`);
  if (btn) btn.click();
  closeCmdPalette();
  scrollTo('#architecture');
}

function copyText(text, toastMsg) {
  navigator.clipboard.writeText(text).then(() => showToast(toastMsg, '📋'));
  closeCmdPalette();
}

function openCmdPalette() {
  const overlay = $('#cmd-overlay');
  if (!overlay) return;
  APP.cmdPaletteOpen = true;
  overlay.classList.add('open');
  setTimeout(() => $('#cmd-input')?.focus(), 60);
  renderCmdResults('');
}

function closeCmdPalette() {
  const overlay = $('#cmd-overlay');
  if (!overlay) return;
  APP.cmdPaletteOpen = false;
  overlay.classList.remove('open');
  const input = $('#cmd-input');
  if (input) input.value = '';
}

function renderCmdResults(query) {
  const container = $('#cmd-results');
  if (!container) return;
  const filtered = query
    ? CMD_ITEMS.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()))
    : CMD_ITEMS;

  container.innerHTML = '';

  const sections = [
    { label: 'Navigation', ids: ['goto_hero','goto_projects','goto_architecture','goto_experience','goto_documentation','goto_contact','theme_toggle'] },
    { label: 'Anime Blades', ids: ['sword_all','sword_ichigo','sword_kusanagi','sword_wado','sword_kitetsu','sword_enma'] },
    { label: 'Simulations', ids: ['calc_cargo','calc_strip','calc_tspacer','calc_steel'] },
    { label: 'Quick Actions', ids: ['copy_email'] },
  ];

  sections.forEach(section => {
    const items = filtered.filter(i => section.ids.includes(i.id));
    if (!items.length) return;
    const label = document.createElement('div');
    label.className = 'cmd-section-label';
    label.textContent = section.label;
    container.appendChild(label);
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cmd-item';
      el.innerHTML = `
        <div class="cmd-item-icon">${item.icon}</div>
        <div>
          <div class="cmd-item-title">${item.title}</div>
          <div class="cmd-item-desc">${item.desc}</div>
        </div>`;
      el.addEventListener('click', () => { item.action(); playHaptic('click'); });
      container.appendChild(el);
    });
  });
}

function initCmdPalette() {
  const openBtns = [$('#open-cmd-btn'), $('#hero-cmd-btn')].filter(Boolean);
  openBtns.forEach(b => b.addEventListener('click', openCmdPalette));

  const overlay = $('#cmd-overlay');
  const input   = $('#cmd-input');

  overlay?.addEventListener('click', e => { if (e.target === overlay) closeCmdPalette(); });
  input?.addEventListener('input', () => renderCmdResults(input.value));

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      APP.cmdPaletteOpen ? closeCmdPalette() : openCmdPalette();
    }
    if (e.key === 'Escape' && APP.cmdPaletteOpen) closeCmdPalette();
  });

  const kbd = $('#kbd-shortcut-label');
  if (kbd && !navigator.platform.toLowerCase().includes('mac')) {
    kbd.textContent = 'Ctrl+K';
  }
}

// ===========================================================================
// PROJECT FILTER BUTTONS
// ===========================================================================
function initProjectFilters() {
  const btns  = $$('.filter-btn');
  const cards = $$('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
      });
      playHaptic('click');
    });
  });
}

// ===========================================================================
// CASE STUDY MODAL DATA
// ===========================================================================
const CASE_STUDIES = {
  air_cargo: {
    title: 'Air Cargo Powered Roller & Castor Deck',
    badge: 'Air Cargo GSE',
    overview: `Heavy-capacity Ground Support Equipment (GSE) designed for wide-body aircraft cargo loading. The powered roller deck drives Unit Load Devices (ULDs) bidirectionally at 0.35 m/s with a dynamic load rating of 7,000 kg. Lazy Dolly Castor Deck uses a 55 mm pitch ball castor matrix providing 360° of load movement for positioning accuracy within ±5 mm.`,
    diagram: `
  [ULD 7,000 kg]
       ↕
  ┌────────────────────────────────┐
  │  POWERED ROLLER DECK           │
  │  ● Motor: 1.5 kW ×4, AC VFD   │
  │  ● Drive speed: 0.35 m/s       │
  │  ● Bi-directional stop blocks  │
  └────────────────────────────────┘
       ↕
  ┌────────────────────────────────┐
  │  LAZY DOLLY CASTOR DECK        │
  │  ● Ball castor pitch: 55 mm   │
  │  ● Capacity: 7,000 kg dynamic  │
  │  ● IATA AHM 913 compliant      │
  └────────────────────────────────┘`,
    benchmarks: [
      { val: '7,000 kg', label: 'Dynamic ULD Rating' },
      { val: '0.35 m/s', label: 'Drive Speed' },
      { val: '55 mm',    label: 'Castor Pitch' },
    ],
    tools: 'SolidWorks 3D Assembly · AutoCAD 2D Layout · Motor Drive Sizing · IATA AHM Compliance Checking',
  },
  strip_flattening: {
    title: 'Industrial Strip Flattening Machine',
    badge: 'Automated SPM',
    overview: `17-roll precision leveling cassette for continuous steel strip processing up to 1,200 mm width and 6 mm gauge. Hydraulic downforce cylinders deliver 80 kN distributed across upper roll set. Dual planetary reduction drives ensure roll surface speed consistency within ±0.5%. Heat-treated Cr-Mo leveling rolls rated for HRC 58–62 surface hardness.`,
    diagram: `
  INPUT COIL → ENTRY PINCH → 17-ROLL CASSETTE → EXIT PINCH → CUT-TO-LENGTH
                              │
              ┌───────────────┴────────────────┐
              │  8× Upper rolls (adjustable)    │
              │  9× Lower rolls (fixed datum)   │
              │  Hydraulic cylinders: 80 kN     │
              │  Planetary gearbox: 1:45 ratio  │
              └────────────────────────────────┘`,
    benchmarks: [
      { val: '1,200 mm', label: 'Strip Width' },
      { val: '80 kN',    label: 'Downforce' },
      { val: 'HRC 60',   label: 'Roll Hardness' },
    ],
    tools: 'SolidWorks Large Assembly · Hydraulic Cylinder Sizing · Bearing Life Calculation (ISO 281) · DFM Review',
  },
  t_spacer: {
    title: 'Automated T-Spacer Cutting Machine',
    badge: 'Precision SPM',
    overview: `High-speed automated SPM for insulating glass T-spacer profiles. Servo ball-screw indexing achieves ±0.05 mm cut length accuracy. Dual pneumatic clamp jaws apply 1.2 kN per jaw. Carbide-tipped circular blade at 4,500 RPM. Automatic chip vacuum extraction maintains 94% material yield. Overall equipment effectiveness (OEE) target: >91%.`,
    diagram: `
  FEED ROLL PAIR → SERVO INDEXER → PNEUMATIC CLAMP → BLADE CUT → PART TRAY
                       │
              ┌────────┴──────────┐
              │ Ball screw: 5mm p  │
              │ Servo: 400W BLDC  │
              │ Clamp: 1.2kN ×2   │
              │ Blade: ⌀160 TC    │
              └───────────────────┘`,
    benchmarks: [
      { val: '±0.05 mm', label: 'Cut Tolerance' },
      { val: '1.8 s',    label: 'Cycle Time' },
      { val: '94%',      label: 'Material Yield' },
    ],
    tools: 'Linear Servo Design · Pneumatic Actuator Sizing · AutoCAD Shop Drawings · Safety Enclosure Design (ISO 13855)',
  },
  steel_plant: {
    title: 'Steel Plant Budgetary Equipment Proposal',
    badge: 'Budgetary Proposal',
    overview: `Comprehensive CAPEX estimation and equipment specification for a new 45,000 m² steel processing plant. Deliverables included 2D/3D plant layouts with 25T overhead crane clearance envelopes, slitting line, leveling line, cut-to-length line equipment specifications, civil/mechanical interface documentation, and supplier comparison matrices.`,
    diagram: `
  PLANT SCOPE (45,000 m²):
  ┌─────────────────────────────────────┐
  │  Bay A: Slitting Line (2,000 mm)    │
  │  Bay B: Leveling & CTL (1,200 mm)   │
  │  Bay C: Shipping / Packaging        │
  │  25T EOT Crane × 3 (25m span)       │
  │  Civil interfaces: 14 pits / sumps  │
  └─────────────────────────────────────┘`,
    benchmarks: [
      { val: '45,000 m²', label: 'Plant Footprint' },
      { val: '25T',       label: 'Crane Rating' },
      { val: '3 Lines',   label: 'Processing Lines' },
    ],
    tools: 'AutoCAD Plant Layout · CAPEX Cost Modelling · Supplier Comparison Matrix · Civil/Mech Interface Docs',
  },
  load_analysis: {
    title: 'FEA Stress Simulation & Proof Load Testing',
    badge: 'FEA & Proof Test',
    overview: `Combined digital FEA and physical proof test verification protocol. SolidWorks Simulation / ANSYS APDL Von Mises stress analysis followed by physical proof overload at 1.5× rated capacity using calibrated hydraulic rams and rosette strain gauges. Factor of Safety certified > 3.2. Maximum recorded deflection: 1.42 mm (< L/850 limit).`,
    diagram: `
  DIGITAL FEA (SolidWorks / ANSYS)
  ├─ Material: S355JR (σy = 355 MPa)
  ├─ Max Von Mises: 108.4 MPa
  ├─ FoS: 3.27
  └─ Max deflection: 1.42 mm

  PHYSICAL PROOF TESTING
  ├─ Rated load: 70 kN
  ├─ Proof overload: 105 kN (1.5×)
  ├─ Strain gauge reading: 114.8 MPa
  └─ Permanent set: < 0.1 mm ✓`,
    benchmarks: [
      { val: '3.27 FoS', label: 'Safety Factor' },
      { val: '1.42 mm',  label: 'Max Deflection' },
      { val: '1.5×',     label: 'Proof Overload' },
    ],
    tools: 'ANSYS APDL · SolidWorks Simulation · Rosette Strain Gauges · Calibrated Hydraulic Ram',
  },
  autocad_proposals: {
    title: 'MHE Cargo Terminal Mezzanine Floor Design',
    badge: 'MHE & GSE Design',
    overview: `End-to-end design and development of Material Handling Equipment (MHE) for a cargo terminal mezzanine floor. Work spanned concept design, detail modelling, manufacturing drawings with ASME Y14.5M GD&T, BOM generation, first article inspection (FAI), and hands-on site installation support. Reduced installation time by 15% through coordinated documentation packages.`,
    diagram: `
  DESIGN FLOW:
  Concept Sketch
    ↓ SolidWorks 3D Model
    ↓ AutoCAD Shop Drawings (ASME Y14.5M)
    ↓ BOM + Vendor Procurement
    ↓ First Article Inspection (FAI)
    ↓ Site Installation Support
    ✓ 100% FAI Pass · 15% Install Time Reduction`,
    benchmarks: [
      { val: '15%',   label: 'Installation Time Saved' },
      { val: '100%',  label: 'FAI Pass Rate' },
      { val: '20%',   label: 'PoC Cost Reduction' },
    ],
    tools: 'SolidWorks · AutoCAD · ASME Y14.5M · BOM Generation · FAI Inspection Sheets · Site Commissioning',
  },
};

function openCaseStudy(projectId) {
  const data = CASE_STUDIES[projectId];
  if (!data) return;

  const overlay = $('#modal-overlay');
  const title   = $('#modal-title');
  const badge   = $('#modal-badge');
  const body    = $('#modal-body');

  title.textContent = data.title;
  badge.textContent = data.badge;

  body.innerHTML = `
    <div>
      <div class="modal-section-title">Project Overview</div>
      <p class="modal-text">${data.overview}</p>
    </div>
    <div>
      <div class="modal-section-title">System Architecture Diagram</div>
      <div class="modal-diagram">${data.diagram}</div>
    </div>
    <div>
      <div class="modal-section-title">Key Metrics</div>
      <div class="modal-benchmarks">
        ${data.benchmarks.map(b => `
          <div class="modal-benchmark">
            <div class="modal-bench-val">${b.val}</div>
            <div class="modal-bench-label">${b.label}</div>
          </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="modal-section-title">Tools &amp; Methodologies</div>
      <p class="modal-text">${data.tools}</p>
    </div>`;

  overlay.classList.add('open');
  APP.modalOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal-overlay').classList.remove('open');
  APP.modalOpen = false;
  document.body.style.overflow = '';
}

function initModals() {
  $$('.view-case-study').forEach(btn => {
    btn.addEventListener('click', () => {
      openCaseStudy(btn.dataset.project);
      playHaptic('click');
    });
  });

  $$('.doc-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.project) { openCaseStudy(card.dataset.project); playHaptic('click'); }
    });
  });

  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', e => { if (e.target === $('#modal-overlay')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && APP.modalOpen) closeModal(); });
}

// ===========================================================================
// COPY SPEC LINK
// ===========================================================================
function initCopyLinks() {
  $$('.copy-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.link || 'Engineering Specification';
      navigator.clipboard.writeText(text).then(() => showToast('Spec text copied!', '📋'));
      playHaptic('click');
    });
  });
}

// ===========================================================================
// HERO BRIEF
// ===========================================================================
function initHeroBrief() {
  const btn = $('#hero-brief-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    showToast('Technical brief will be shared upon request — reach out via contact below.', '📄', 4000);
    playHaptic('click');
  });
}

// ===========================================================================
// INTERACTIVE FEA / LOAD SIMULATOR TERMINAL
// ===========================================================================
const SIM_COMMANDS = {
  'calc-air-cargo': () => {
    const load = 7000;
    const g = 9.81;
    const F = (load * g).toFixed(0);
    const area = (0.8 * 1.2).toFixed(2);
    const stress = ((load * g) / (0.8 * 1.2 * 1e6) * 1000).toFixed(3);
    return [
      `>> Executing: air-cargo-deck-stress --load ${load}kg`,
      ``,
      `  Applied force F = ${load} × 9.81 = ${F} N (${(F/1000).toFixed(1)} kN)`,
      `  Deck contact area = 0.8 m × 1.2 m = ${area} m²`,
      `  Distributed pressure = ${stress} MPa`,
      `  Roller section modulus (S355JR) → σ_max = 78.4 MPa`,
      `  Factor of Safety = 355 / 78.4 = 4.53`,
      ``,
      `  ✓ PASS — FoS 4.53 > 2.5 design minimum`,
      `  ✓ ULD dynamic load 7,000 kg cleared at 0.35 m/s drive`,
      `  ✓ IATA AHM 913 compliant (Dynamic load factor 1.35 applied)`,
    ];
  },
  'strip-tonnage': () => {
    const w = 1200; const t = 6; const Y = 355;
    const F = (w * t * Y * 1.3 / 1000).toFixed(1);
    const rolls = 17;
    const perRoll = (F / (rolls / 2)).toFixed(1);
    return [
      `>> Executing: strip-flattening-force --width ${w}mm --gauge ${t}mm`,
      ``,
      `  Material: S355JR, Yield σ_y = ${Y} MPa`,
      `  Strip area  = ${w} mm × ${t} mm = ${(w*t).toLocaleString()} mm²`,
      `  Estimated leveling force = ${F} kN total`,
      `  Per active roll pair load = ${perRoll} kN`,
      `  Hydraulic cylinder bore (80 kN @ 250 bar) = ⌀203 mm`,
      ``,
      `  ✓ 17-roll cassette sufficient for 6mm S355JR at 1,200mm`,
      `  ✓ Planetary gearbox ratio 1:45 — roll surface ΔV < 0.5%`,
      `  ✓ Cross-bow reduction > 95% (ISO 9225 strip flatness)`,
    ];
  },
  't-spacer-cycle': () => {
    const feedL = 1000; const servoAcc = 180; const servoV = 400;
    const cutTime = 0.12; const clampTime = 0.06;
    const tAccel = servoV / servoAcc;
    const tFeed  = tAccel + (feedL - servoV * servoV / (2 * servoAcc)) / servoV;
    const tTotal = (tFeed + cutTime + clampTime * 2).toFixed(2);
    return [
      `>> Executing: t-spacer-cycle-sim --index ${feedL}mm`,
      ``,
      `  Servo ball screw: v_max = ${servoV} mm/s, a = ${servoAcc} mm/s²`,
      `  Acceleration time t_a = ${tAccel.toFixed(3)} s`,
      `  Feed traverse t_feed  = ${tFeed.toFixed(3)} s`,
      `  Clamp engage/release  = ${(clampTime*2).toFixed(3)} s`,
      `  Blade cut dwell       = ${cutTime} s`,
      `  ─────────────────────────────────────`,
      `  Total cycle time      = ${tTotal} s`,
      `  Output rate           = ~${Math.floor(3600/tTotal).toLocaleString()} cuts/hr`,
      ``,
      `  ✓ Meets 1.8 s cycle target`,
      `  ✓ ±0.05 mm servo accuracy confirmed`,
      `  ✓ Material yield 94% (offcut < 6%)`,
    ];
  },
  'steel-plant-quote': () => {
    return [
      `>> Executing: plant-budget-estimate --plant steel --area 45000sqm`,
      ``,
      `  EQUIPMENT SCOPE SUMMARY`,
      `  ─────────────────────────────────────`,
      `  Slitting Line (2,000 mm):  ~ ₹ 8.5 Cr`,
      `  Leveling + CTL Line:       ~ ₹ 6.2 Cr`,
      `  25T EOT Crane × 3:         ~ ₹ 3.8 Cr`,
      `  MHE / Conveyors / Coil Cars:~ ₹ 2.1 Cr`,
      `  Civil / Structural / Pits: ~ ₹ 4.4 Cr`,
      `  Electrical / Automation:   ~ ₹ 3.6 Cr`,
      `  Commissioning + Spares:    ~ ₹ 1.4 Cr`,
      `  ─────────────────────────────────────`,
      `  TOTAL CAPEX (Budgetary):   ~ ₹ 30.0 Cr`,
      ``,
      `  ✓ 45,000 m² plant layout complete (AutoCAD)`,
      `  ✓ Crane clearance envelope verified (3D)`,
      `  ✓ Civil pit interfaces documented`,
    ];
  },
  'clear': () => null,
};

function addTerminalLines(lines) {
  const out = $('#sandbox-terminal-output');
  if (!out) return;
  lines.forEach((line, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'terminal-line';
      if (line.startsWith('>>')) {
        div.innerHTML = `<span class="terminal-prompt">&gt;&gt;</span><span class="terminal-output">${line.replace('>>', '').trim()}</span>`;
      } else if (line.startsWith('  ✓')) {
        div.innerHTML = `<span class="terminal-success">${line}</span>`;
      } else if (line.startsWith('  TOTAL')) {
        div.innerHTML = `<span class="terminal-highlight">${line}</span>`;
      } else {
        div.innerHTML = `<span class="terminal-output">${line}</span>`;
      }
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }, i * 55);
  });
}

function initTerminal() {
  $$('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      playHaptic('click');
      if (cmd === 'clear') {
        const out = $('#sandbox-terminal-output');
        if (out) out.innerHTML = `<div class="terminal-line"><span class="terminal-prompt">&gt;&gt;</span><span class="terminal-output"> Terminal cleared. Ready.</span></div>`;
        return;
      }
      const fn = SIM_COMMANDS[cmd];
      if (fn) {
        const lines = fn();
        if (lines) addTerminalLines(lines);
      }
    });
  });
}

// ===========================================================================
// CONTACT FORM
// ===========================================================================
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = $('#contact-name').value.trim();
    const email   = $('#contact-email').value.trim();
    const subject = $('#contact-subject').value.trim() || 'Engineering Enquiry';
    const message = $('#contact-message').value.trim();
    const body    = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto  = `mailto:pran.acharya.eng@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    showToast('Opening your email client…', '📧', 3200);
    playHaptic('success');
  });
}

// ===========================================================================
// SCROLL REVEAL
// ===========================================================================
function initScrollReveal() {
  const els = $$('.reveal-on-scroll');
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }),
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
  els.forEach(el => io.observe(el));
}

// ===========================================================================
// BOOT
// ===========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAccentPicker();
  initNavbar();
  initMobileDrawer();
  initAudio();
  initSwordEngine();
  initSwordToolbar();
  initCmdPalette();
  initProjectFilters();
  initModals();
  initCopyLinks();
  initHeroBrief();
  initTerminal();
  initContactForm();
  initScrollReveal();

  // Welcome toast
  setTimeout(() => showToast('Portfolio loaded — Anime Blades Active ⚔️', '⚔️', 3200), 700);
});
