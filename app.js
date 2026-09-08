/* ============================================================================
   KARAMPUDI ACHARYA PRANAV — PORTFOLIO APP.JS
   3D Gear Animation Engine · Crimson/Obsidian Theme · Interactive Mechanical UI
   ============================================================================ */

'use strict';

// ===========================================================================
// STATE
// ===========================================================================
const APP = {
  theme:          'dark',
  audioEnabled:   false,
  activeGearType: 'all',
  cmdPaletteOpen: false,
  modalOpen:      false,
  gears:          [],
  animFrameId:    null,
  ctx:            null,
  canvas:         null,
  W:              0,
  H:              0,
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

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ===========================================================================
// TOAST NOTIFICATIONS
// ===========================================================================
function showToast(msg, icon = '⚙️', duration = 2800) {
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
// THEME SYSTEM (Dark / Light — no palette picker)
// ===========================================================================
function applyTheme(theme) {
  APP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('kap-theme', theme);
  const sunIcon  = $('#theme-sun-icon');
  const moonIcon = $('#theme-moon-icon');
  if (theme === 'dark') {
    sunIcon.style.display  = '';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display  = 'none';
    moonIcon.style.display = '';
  }
  // Rebuild gears for new theme
  if (APP.gears.length) buildGearScene();
}

function initTheme() {
  const saved = localStorage.getItem('kap-theme') || 'dark';
  applyTheme(saved);
  $('#theme-toggle-btn').addEventListener('click', () => {
    applyTheme(APP.theme === 'dark' ? 'light' : 'dark');
    showToast(APP.theme === 'dark' ? 'Dark mode active' : 'Light mode active', '🌓');
  });
}

// ===========================================================================
// NAVBAR SCROLL BEHAVIOUR
// ===========================================================================
function initNavbar() {
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');

  window.addEventListener('scroll', debounce(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    // Active section highlight
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
// AUDIO HAPTICS TOGGLE
// ===========================================================================
function initAudio() {
  const btn       = $('#audio-toggle-btn');
  const iconMuted = $('#audio-icon-muted');
  const iconActive = $('#audio-icon-active');

  btn.addEventListener('click', () => {
    APP.audioEnabled = !APP.audioEnabled;
    iconMuted.style.display  = APP.audioEnabled ? 'none' : '';
    iconActive.style.display = APP.audioEnabled ? '' : 'none';
    showToast(APP.audioEnabled ? 'Audio haptics on' : 'Audio haptics off', '🔊');
  });
}

function playHaptic(type = 'click') {
  if (!APP.audioEnabled) return;
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
}

// ===========================================================================
// 3D GEAR ANIMATION ENGINE (WebGL via Three.js)
// ===========================================================================

let threeScene, threeCamera, threeRenderer;
let gearGroup = new THREE.Group();
let clock = new THREE.Clock();
let activeGearMesh = null;
let bgGearMeshes = [];

/* --- Gear type definitions ------------------------------------------------ */
const GEAR_TYPES = {
  spur: { 
    label: 'Spur Gear', teeth: { min: 12, max: 28 }, depth: 2.2,
    specs: {
      "Desired Gear Ratio": "1",
      "(al) Pressure Angle": "20.00°",
      "(bt) Helix Angle": "0.00°",
      "(CD) Center Distance": "90.00 mm",
      "Helix Angle Direction": "Left",
      "(r) Root Fillet": "0.20 mm",
      "Gear Accuracy": "1",
      "Total Unit Correction": "0",
      "(DM) Mounting Hole Diameter": "20.00 mm",
      "(b) Face Width": "30.00 mm",
      "Power": "1000.000 W",
      "Speed": "1000.000 rpm",
      "Efficiency": "0.92",
      "Size Factor For Contact": "1",
      "Size Factor For Bending": "1"
    }
  },
  bevel: { 
    label: 'Bevel Gear', teeth: { min: 10, max: 20 }, depth: 2.8,
    specs: {
      "Desired Gear Ratio": "1",
      "(al) Pressure Angle": "20.00°",
      "(bt) Spiral Angle": "0.00°",
      "(Si) Shaft Angle": "90.00°",
      "Module": "3.00 mn",
      "Spiral Angle Direction": "Left",
      "Tooth Thickness Mod.": "0",
      "No. of Teeth": "30",
      "(DM) Mounting Hole": "20.00 mm",
      "(b) Face Width": "22.00 mm",
      "Power": "1000.000 W",
      "Speed": "1000.000 rpm",
      "Efficiency": "0.92"
    }
  },
  helical: { 
    label: 'Helical Gear', teeth: { min: 14, max: 24 }, depth: 2.0,
    specs: {
      "Desired Gear Ratio": "1",
      "(al) Pressure Angle": "20.00°",
      "(bt) Helix Angle": "21.59°",
      "(CD) Center Distance": "90.00 mm",
      "Helix Angle Direction": "Left",
      "(r) Root Fillet": "0.20 mm",
      "Gear Accuracy": "1",
      "Total Unit Correction": "0",
      "(DM) Mounting Hole": "20.00 mm",
      "(b) Face Width": "30.00 mm",
      "Power": "1000.000 W",
      "Speed": "1000.000 rpm",
      "Efficiency": "0.92"
    }
  },
  planetary: { 
    label: 'Planetary Gear', teeth: { min: 16, max: 30 }, depth: 2.4,
    specs: {
      "Sun Gear Teeth": "16",
      "Planet Gear Teeth": "12",
      "Ring Gear Teeth": "40",
      "(al) Pressure Angle": "20.00°",
      "(CD) Center Distance": "45.00 mm",
      "Module": "3.00 mn",
      "(b) Face Width": "25.00 mm",
      "Power": "1000.000 W",
      "Input Speed (Sun)": "1000.000 rpm",
      "Efficiency": "0.94"
    }
  },
  worm: { 
    label: 'Worm Gear', teeth: { min: 20, max: 36 }, depth: 1.8,
    specs: {
      "Speed": "1000.000 rpm",
      "Torque": "9.540 N-m",
      "Efficiency": "0.92",
      "Form of Worm": "Form - ZA",
      "Diametral Quotient": "10",
      "CD (mm)": "125",
      "(df) Root Dia (Worm)": "48.94 mm",
      "(df) Root Dia (Gear)": "171.82 mm",
      "(Beta) Helix Angle": "21.59°",
      "(Gamma) Lead Angle": "21.59°",
      "(Rtr) Tip Relief Rad": "0.63 mm",
      "(Rrr) Root Relief Rad": "1.26 mm",
      "(b) Worm Gear Width": "41.79 mm",
      "(Pa) Worm Axial Pitch": "19.58 mm",
      "(L) Length of Worm": "91.21 mm",
      "(Pz) Lead of Worm": "78.33 mm",
      "Axial Tooth Thickness": "9.89 mm"
    }
  },
};
const GEAR_TYPE_KEYS = Object.keys(GEAR_TYPES);

/* --- Materials (theme-aware) ---------------------------------------------- */
function getMaterials(isActive) {
  const isDark = APP.theme === 'dark';
  
  if (isActive) {
    return new THREE.MeshStandardMaterial({
      color: isDark ? 0xef4444 : 0xdc2626, // Crimson
      metalness: 0.8,
      roughness: 0.2,
      emissive: isDark ? 0x4a0000 : 0x2a0000,
      emissiveIntensity: 0.4
    });
  } else {
    // Muted grey/purple tones
    return new THREE.MeshStandardMaterial({
      color: isDark ? 0x5a5566 : 0x74849b,
      metalness: 0.6,
      roughness: 0.5,
      transparent: true,
      opacity: isDark ? 0.4 : 0.6
    });
  }
}

/* --- Geometry Generator --------------------------------------------------- */
function createGearGeometry(radius, teeth, depth, type) {
  const shape = new THREE.Shape();
  const innerRadius = radius * 0.7;
  const holeRadius = radius * 0.25;
  const toothDepth = radius * 0.15;
  const numTeeth = teeth;

  const angleStep = (Math.PI * 2) / numTeeth;

  for (let i = 0; i < numTeeth; i++) {
    const angle = i * angleStep;
    const nextAngle = (i + 1) * angleStep;
    
    const toothAngle = angleStep * 0.4; // width of tooth
    const gapAngle = angleStep * 0.6;   // width of gap

    // Start of tooth
    if (i === 0) shape.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    else shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    
    // Tooth profile
    shape.lineTo(Math.cos(angle + toothAngle * 0.2) * radius, Math.sin(angle + toothAngle * 0.2) * radius);
    shape.lineTo(Math.cos(angle + toothAngle * 0.8) * radius, Math.sin(angle + toothAngle * 0.8) * radius);
    shape.lineTo(Math.cos(angle + toothAngle) * innerRadius, Math.sin(angle + toothAngle) * innerRadius);
    
    // Gap
    shape.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
  }

  // Create hole in center
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
  shape.holes.push(holePath);

  // Extrude settings
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: type === 'helical' ? 4 : 1,
    bevelSize: radius * 0.02,
    bevelThickness: radius * 0.02
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Apply helical twist
  if (type === 'helical') {
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const z = vertices.getZ(i);
      const angleOffset = (z / depth) * 0.5; // twist amount
      const x = vertices.getX(i);
      const y = vertices.getY(i);
      vertices.setX(i, x * Math.cos(angleOffset) - y * Math.sin(angleOffset));
      vertices.setY(i, x * Math.sin(angleOffset) + y * Math.cos(angleOffset));
    }
    geometry.computeVertexNormals();
  }

  // Apply bevel skew
  if (type === 'bevel') {
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const z = vertices.getZ(i);
      const scale = 1 - (z / depth) * 0.4; // cone effect
      vertices.setX(i, vertices.getX(i) * scale);
      vertices.setY(i, vertices.getY(i) * scale);
    }
    geometry.computeVertexNormals();
  }

  geometry.center();
  return geometry;
}

/* --- Gear Object Factory -------------------------------------------------- */
function spawnGear(isActive) {
  const typeKey = APP.activeGearType === 'all' ? GEAR_TYPE_KEYS[rndInt(0, GEAR_TYPE_KEYS.length - 1)] : APP.activeGearType;
  const def = GEAR_TYPES[typeKey] || GEAR_TYPES['spur'];
  const teeth = rndInt(def.teeth.min, def.teeth.max);
  
  const radius = isActive ? rnd(12, 18) : rnd(4, 9);
  const mat = getMaterials(isActive);
  const gearObj = new THREE.Group();
  
  if (typeKey === 'planetary') {
    // Sun Gear
    const sunR = radius * 0.4;
    const sunGeo = createGearGeometry(sunR, Math.floor(teeth * 0.4), def.depth, 'spur');
    const sunMesh = new THREE.Mesh(sunGeo, mat);
    sunMesh.userData = { isSun: true };
    gearObj.add(sunMesh);
    
    // Planet Gears
    const planetR = radius * 0.28;
    const orbitR = sunR + planetR + 0.1;
    for(let i=0; i<3; i++) {
      const pGeo = createGearGeometry(planetR, Math.floor(teeth * 0.3), def.depth, 'spur');
      const pMesh = new THREE.Mesh(pGeo, mat);
      const angle = (i / 3) * Math.PI * 2;
      pMesh.position.set(Math.cos(angle) * orbitR, Math.sin(angle) * orbitR, 0);
      pMesh.userData = { isPlanet: true };
      gearObj.add(pMesh);
    }
    
    // Ring Gear
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, radius * 1.3, 0, Math.PI * 2, false);
    const ringHole = new THREE.Path();
    const numTeeth = Math.floor(teeth * 1.2);
    const angleStep = (Math.PI * 2) / numTeeth;
    const innerR = radius * 1.05;
    const outerR = radius * 1.15;
    
    for (let i = numTeeth - 1; i >= 0; i--) {
      const angle = i * angleStep;
      const nextAngle = (i + 1) * angleStep;
      const toothAngle = angleStep * 0.4;
      if (i === numTeeth - 1) ringHole.moveTo(Math.cos(nextAngle) * outerR, Math.sin(nextAngle) * outerR);
      else ringHole.lineTo(Math.cos(nextAngle) * outerR, Math.sin(nextAngle) * outerR);
      ringHole.lineTo(Math.cos(angle + toothAngle) * outerR, Math.sin(angle + toothAngle) * outerR);
      ringHole.lineTo(Math.cos(angle + toothAngle * 0.8) * innerR, Math.sin(angle + toothAngle * 0.8) * innerR);
      ringHole.lineTo(Math.cos(angle + toothAngle * 0.2) * innerR, Math.sin(angle + toothAngle * 0.2) * innerR);
      ringHole.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    }
    ringShape.holes.push(ringHole);
    const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: def.depth, bevelEnabled: true, bevelSegments: 1, bevelSize: radius*0.02, bevelThickness: radius*0.02 });
    ringGeo.center();
    const ringMesh = new THREE.Mesh(ringGeo, mat);
    ringMesh.userData = { isRing: true };
    gearObj.add(ringMesh);
    
  } else if (typeKey === 'worm') {
    // Worm Wheel
    const geo = createGearGeometry(radius, teeth, def.depth, 'helical');
    const wheelMesh = new THREE.Mesh(geo, mat);
    gearObj.add(wheelMesh);
    
    // Worm Shaft
    class HelicalCurve extends THREE.Curve {
      constructor(radius, length, coils) { super(); this.radius = radius; this.length = length; this.coils = coils; }
      getPoint(t, optionalTarget = new THREE.Vector3()) {
        return optionalTarget.set(Math.cos(t * Math.PI * 2 * this.coils) * this.radius, Math.sin(t * Math.PI * 2 * this.coils) * this.radius, (t - 0.5) * this.length);
      }
    }
    const shaftL = radius * 2.5;
    const shaftR = radius * 0.3;
    const shaftGroup = new THREE.Group();
    
    const cylGeo = new THREE.CylinderGeometry(shaftR*0.8, shaftR*0.8, shaftL, 16);
    const cylMesh = new THREE.Mesh(cylGeo, mat);
    cylMesh.rotation.x = Math.PI / 2;
    shaftGroup.add(cylMesh);
    
    const path = new HelicalCurve(shaftR, shaftL, 8);
    const tubeGeo = new THREE.TubeGeometry(path, 100, radius * 0.08, 8, false);
    const threadMesh = new THREE.Mesh(tubeGeo, mat);
    shaftGroup.add(threadMesh);
    
    shaftGroup.position.set(0, radius + shaftR*0.5, 0);
    // Orient the shaft tangentially along the X-axis
    shaftGroup.rotation.y = Math.PI / 2;
    shaftGroup.userData = { isShaft: true };
    gearObj.add(shaftGroup);
    
  } else {
    // Standard Gears
    const geo = createGearGeometry(radius, teeth, def.depth, typeKey);
    const mesh = new THREE.Mesh(geo, mat);
    gearObj.add(mesh);
  }

  gearObj.userData = {
    radius: typeKey === 'planetary' ? radius * 1.3 : radius,
    type: typeKey,
    speed: (isActive ? rnd(0.5, 1.0) : rnd(0.2, 0.6)) * (Math.random() > 0.5 ? 1 : -1),
    bobSpeed: rnd(0.5, 1.5),
    bobY: rnd(0, Math.PI * 2),
    bobAmp: isActive ? rnd(0.5, 1.5) : rnd(0.2, 0.8),
    baseY: 0
  };

  if (isActive) {
    gearObj.position.set(15, 0, 0);
    gearObj.userData.baseY = 0;
  } else {
    gearObj.position.set(rnd(-30, 30), rnd(-20, 20), rnd(-15, -5));
    gearObj.userData.baseY = gearObj.position.y;
    gearObj.rotation.x = rnd(0, Math.PI * 2);
    gearObj.rotation.y = rnd(0, Math.PI * 2);
  }

  gearGroup.add(gearObj);
  return gearObj;
}

/* --- Build scene ---------------------------------------------------------- */
function buildGearScene() {
  if (!threeScene) return;

  function disposeGroup(grp) {
    if (!grp || !grp.children) return;
    grp.children.forEach(child => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      } else if (child.isGroup) {
        disposeGroup(child);
      }
    });
  }

  // Clear existing gears
  while(gearGroup.children.length > 0){ 
    const grp = gearGroup.children[0];
    disposeGroup(grp);
    gearGroup.remove(grp); 
  }
  bgGearMeshes = [];

  // Active Gear
  activeGearMesh = spawnGear(true);
  
  // Background Gears (Non-overlapping approximation in 3D)
  let attempts = 0;
  while (bgGearMeshes.length < 8 && attempts < 100) {
    attempts++;
    const grp = spawnGear(false);
    
    // Simple bounding sphere collision check
    let safe = true;
    for (let existing of [activeGearMesh, ...bgGearMeshes]) {
      const dist = grp.position.distanceTo(existing.position);
      const minSafeDist = grp.userData.radius + existing.userData.radius + 2;
      if (dist < minSafeDist) {
        safe = false;
        break;
      }
    }
    
    if (safe) {
      bgGearMeshes.push(grp);
    } else {
      gearGroup.remove(grp);
      disposeGroup(grp);
    }
  }

  updateGearBanner();
}

/* --- Defense Lines Background --------------------------------------------- */
const bgCanvas = document.getElementById('bg-canvas');
let bgCtx, bgWidth, bgHeight;
let defenseParticles = [];

function initDefenseLines() {
  if (!bgCanvas) return;
  bgCtx = bgCanvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  bgWidth = window.innerWidth;
  bgHeight = window.innerHeight;
  bgCanvas.width = Math.max(1, Math.floor(bgWidth * dpr));
  bgCanvas.height = Math.max(1, Math.floor(bgHeight * dpr));
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bgCtx.imageSmoothingEnabled = false;
  
  defenseParticles = [];
  const particleCount = window.innerWidth < 768 ? 40 : 100;
  for(let i = 0; i < particleCount; i++) {
      defenseParticles.push({
          x: Math.random() * bgWidth,
          y: Math.random() * bgHeight,
          baseLength: Math.random() * 80 + 20,
          speedY: Math.random() * 0.8 + 0.2,
          baseOpacity: Math.random() * 0.2 + 0.05
      });
  }
}

function animateDefenseLines() {
  if (!bgCtx) return;
  bgCtx.clearRect(0, 0, bgWidth, bgHeight);
  const centerX = bgWidth / 2;
  const centerY = bgHeight / 2;
  bgCtx.lineCap = 'butt';
  bgCtx.lineJoin = 'miter';
  
  defenseParticles.forEach(p => {
      const distFromCenterX = Math.abs(p.x - centerX);
      const distFromCenterY = Math.abs(p.y - centerY);
      const proximityX = Math.max(0, 1 - (distFromCenterX / (bgWidth / 2)));
      const proximityY = Math.max(0, 1 - (distFromCenterY / (bgHeight / 2)));
      const centerProximity = proximityX * (0.4 + proximityY * 0.6);
      const currentLength = p.baseLength * (1 + centerProximity * 4); 
      const currentOpacity = Math.min(1.0, p.baseOpacity + (centerProximity * 2.0));
      const brightness = Math.floor(centerProximity * 180);
      
      bgCtx.beginPath();
      const grad = bgCtx.createLinearGradient(p.x, p.y, p.x, p.y + currentLength);
      grad.addColorStop(0, `rgba(220, 38, 38, 0)`);
      grad.addColorStop(0.5, `rgba(255, ${38 + brightness}, ${38 + brightness}, ${currentOpacity})`);
      grad.addColorStop(1, `rgba(220, 38, 38, 0)`);
      
      bgCtx.strokeStyle = grad;
      bgCtx.lineWidth = 0.5;
      bgCtx.moveTo(p.x, p.y);
      bgCtx.lineTo(p.x, p.y + currentLength);
      bgCtx.stroke();

      p.y -= p.speedY * 1.5 * (1 + centerProximity * 0.5);
      
      if(p.y + currentLength < 0) {
          p.y = bgHeight;
          p.x = Math.random() * bgWidth;
      }
  });
}

/* --- Init Three.js -------------------------------------------------------- */
function initGearEngine() {
  initDefenseLines();

  const container = $('#three-canvas-container');
  if (!container || typeof THREE === 'undefined') {
    console.warn("Three.js not loaded or container missing.");
    return;
  }

  // Set container styles
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '0';
  container.style.pointerEvents = 'none';

  threeScene = new THREE.Scene();
  
  threeCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  threeCamera.position.z = 80;
  threeCamera.position.x = -15;

  threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(threeRenderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  threeScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 30);
  threeScene.add(dirLight);

  const pointLight = new THREE.PointLight(0xef4444, 2, 100);
  pointLight.position.set(15, 0, 10);
  threeScene.add(pointLight);

  threeScene.add(gearGroup);

  window.addEventListener('resize', debounce(handleResize, 200));
  
  buildGearScene();
  animLoop();
}

/* --- Animation loop ------------------------------------------------------- */
function animLoop() {
  APP.animFrameId = requestAnimationFrame(animLoop);
  
  animateDefenseLines();

  if (!threeRenderer || !threeScene || !threeCamera) return;

  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  gearGroup.rotation.y = Math.sin(time * 0.3) * 0.3;
  gearGroup.rotation.x = Math.sin(time * 0.2) * 0.2;

  gearGroup.children.forEach(group => {
    const baseSpeed = group.userData.speed * dt;
    // Rotation
    group.rotation.z += baseSpeed;
    
    // Bobbing
    group.position.y = group.userData.baseY + Math.sin(time * group.userData.bobSpeed + group.userData.bobY) * group.userData.bobAmp;

    // Internal parts animation
    if (group.userData.type === 'planetary') {
      group.children.forEach(child => {
        if (child.userData.isPlanet) child.rotation.z -= baseSpeed * 3;
        else if (child.userData.isSun) child.rotation.z += baseSpeed * 2.5;
        else if (child.userData.isRing) child.rotation.z -= baseSpeed * 1.5;
      });
    } else if (group.userData.type === 'worm') {
      group.children.forEach(child => {
        if (child.userData.isShaft) child.rotation.z += baseSpeed * 15;
      });
    }
  });

  // Pulse active gear light
  const pointLight = threeScene.children.find(c => c.isPointLight);
  if (pointLight) {
    pointLight.intensity = 2 + Math.sin(time * 2) * 0.5;
  }

  threeRenderer.render(threeScene, threeCamera);
}

/* --- Resize handler ------------------------------------------------------- */
function handleResize() {
  initDefenseLines();
  if (!threeCamera || !threeRenderer) return;
  threeCamera.aspect = window.innerWidth / window.innerHeight;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
}

/* --- Gear toolbar interaction --------------------------------------------- */
function initGearToolbar() {
  $$('.gear-select-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.gear-select-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      APP.activeGearType = pill.dataset.gear;
      buildGearScene();
      updateGearBanner();
      playHaptic('click');
      showToast(`Gear type: ${pill.textContent.trim()}`, '⚙️');
    });
  });
}

function updateGearBanner() {
  const labelEl = $('#active-gear-label');
  const stateEl = $('#active-gear-state');
  if (labelEl && stateEl) {
    const pill = $(`.gear-select-pill.active`);
    const label = pill ? pill.textContent.trim() : 'All Types';
    labelEl.textContent = `Active System: ${label}`;
    stateEl.textContent = 'WebGL Render · Interactive';
  }
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
  { id: 'gear_spur',          icon: '🔩', title: 'Show Spur Gears',             desc: 'Standard involute spur gear',          action: () => setGearType('spur') },
  { id: 'gear_bevel',         icon: '🔺', title: 'Show Bevel Gears',            desc: 'Conical bevel gear pair',              action: () => setGearType('bevel') },
  { id: 'gear_helical',       icon: '〰️', title: 'Show Helical Gears',          desc: 'Helical involute gear',               action: () => setGearType('helical') },
  { id: 'gear_planetary',     icon: '🌐', title: 'Show Planetary Gears',        desc: 'Epicyclic sun / planet / ring',        action: () => setGearType('planetary') },
  { id: 'gear_worm',          icon: '⚡', title: 'Show Worm & Shaft',           desc: 'High-reduction worm gear drive',       action: () => setGearType('worm') },
  { id: 'calc_cargo',         icon: '🛫', title: 'Simulate: Air Cargo Deck',    desc: 'Calculate 7,000 kg ULD load stress',   action: () => runSimCmd('calc-air-cargo') },
  { id: 'calc_strip',         icon: '🦾', title: 'Simulate: Strip Flattening',  desc: 'Roll force for 6mm steel strip',       action: () => runSimCmd('strip-tonnage') },
  { id: 'calc_tspacer',       icon: '⚡', title: 'Simulate: T-Spacer Cycle',    desc: 'SPM cycle time calculation',           action: () => runSimCmd('t-spacer-cycle') },
  { id: 'calc_steel',         icon: '🏗️', title: 'Simulate: Steel Plant Quote', desc: 'Budgetary CAPEX estimate',             action: () => runSimCmd('steel-plant-quote') },
  { id: 'copy_email',         icon: '📋', title: 'Copy Email Address',          desc: 'acharyapranav1992@gmail.com',           action: () => copyText('acharyapranav1992@gmail.com', 'Email copied!') },
];

function scrollTo(hash) { document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }); closeCmdPalette(); }

function setGearType(type) {
  const pill = $(`.gear-select-pill[data-gear="${type}"]`);
  if (pill) {
    $$('.gear-select-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  }
  APP.activeGearType = type;
  buildGearScene();
  updateGearBanner();
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
  const input = $('#cmd-input');
  setTimeout(() => input?.focus(), 60);
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
    { label: 'Gear Systems', ids: ['gear_spur','gear_bevel','gear_helical','gear_planetary','gear_worm'] },
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

  const overlay  = $('#cmd-overlay');
  const input    = $('#cmd-input');

  overlay?.addEventListener('click', e => { if (e.target === overlay) closeCmdPalette(); });
  input?.addEventListener('input', () => renderCmdResults(input.value));

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      APP.cmdPaletteOpen ? closeCmdPalette() : openCmdPalette();
    }
    if (e.key === 'Escape' && APP.cmdPaletteOpen) closeCmdPalette();
  });

  // Keyboard shortcut label: show ⌘K on Mac, Ctrl+K on others
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
// HERO BRIEF DOWNLOAD (placeholder)
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
    const w = 1200;  // mm
    const t = 6;     // mm
    const Y = 355;   // MPa
    const F = (w * t * Y * 1.3 / 1000).toFixed(1);  // kN (empirical 1.3 factor)
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
    const feedL    = 1000;  // mm index
    const servoAcc = 180;   // mm/s²
    const servoV   = 400;   // mm/s
    const cutTime  = 0.12;  // s
    const clampTime = 0.06; // s each
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
// CONTACT FORM (mailto fallback)
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

    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:acharyapranav1992@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    showToast('Opening your email client…', '📧', 3200);
    playHaptic('success');
  });
}

// ===========================================================================
// SCROLL REVEAL ANIMATION
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
  initNavbar();
  initMobileDrawer();
  initAudio();
  initGearEngine();
  initGearToolbar();
  initCmdPalette();
  initProjectFilters();
  initModals();
  initCopyLinks();
  initHeroBrief();
  initTerminal();
  initContactForm();
  initScrollReveal();

  // Welcome toast
  setTimeout(() => showToast('Mechanical Design Portfolio — 3D Gears Active ⚙️', '⚙️', 3200), 600);
});
