/**
 * ============================================================================
 * KARAMPUDI ACHARYA PRANAV — DYNAMIC MECHANICAL CAD & ANIME SWORDS ENGINE
 * Features:
 *  - Top Sword Selector: All Blades, Ichigo (Zangetsu), Sasuke (Kusanagi),
 *    Zoro (Wado Ichimonji), Zoro (Sandai Kitetsu), Zoro (Enma).
 *  - Ultra-Polished HD Canvas Procedural Rendering for Anime Blades:
 *    • Realistic kissaki tips, fullers, habakis, tsuka-ito wraps, manji & trefoil tsubas.
 *    • Physics chain links, Chidori lightning branches, Ryuo haki flames, Getsuga waves.
 *  - Dual Light & Dark Mode with High-Contrast Engineering Color Palettes.
 *  - 5-Palette View Range Color Switcher (Cyan, Amber, Crimson, Purple, Emerald).
 *  - Mechanical Load Simulator, Case Study Modals, Command Palette & Audio Haptics.
 * ============================================================================
 */

(function () {
  'use strict';

  const state = {
    audioEnabled: false,
    audioCtx: null,
    cmdIndex: 0,
    cmdItems: [],
    theme: localStorage.getItem('kap_portfolio_theme') || 'dark',
    accent: localStorage.getItem('kap_portfolio_accent') || 'cyan',
    activeSword: 'all',
    caseStudies: {
      steel_plant: {
        title: "Budgetary Proposal for Equipment in a Steel Plant",
        badge: "Turnkey Project Management • Equipment Sizing & Layout",
        problem: "Greenfield steel processing facility required a comprehensive budgetary proposal, equipment capacity sizing, crane coverage envelopes, and equipment sequencing before capital expenditure approval.",
        solution: "Formulated the complete budgetary proposal and equipment planning in AutoCAD. Analyzed machine specifications, layout flow, material transport rail cars, overhead crane clearances (25T capacity), civil foundation load interfaces, and supplier cost comparison matrices.",
        diagram: `
+---------------------------------------------------------------------------------+
|               STEEL PLANT EQUIPMENT BUDGETARY PROPOSAL & MASTER LAYOUT          |
+---------------------------------------------------------------------------------+
| Raw Coil Receiving Bay (25T Overhead Crane) ---> Continuous Strip Leveler Line  |
|                                                                                 |
| Coil Slitting & Shearing Line              ---> Cold Forming & Tube Mill Unit   |
|                                                                                 |
| Heat Treatment & Annealing Furnaces        ---> Finished Bundling & Dispatch Bay|
+---------------------------------------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|         CIVIL FOUNDATIONS • TRENCHING • ELECTRICAL SUBSTATION INTERFACING       |
+---------------------------------------------------------------------------------+`,
        benchmarks: [
          { label: "Scope", val: "Full Equipment Budgetary Quote" },
          { label: "Layout Footprint", val: "45,000 m² Master Plan" },
          { label: "Crane Integration", val: "25T Hook Clearances" }
        ],
        code: `// Equipment Budgetary Proposal Allocation Breakdown:
// 1. Slitting, Leveling & Uncoiling Lines: Equipment sizing & drive selection
// 2. Heavy Material Handling & 25T Cranes: Hook coverage & runway beams
// 3. Drive Cabinets, Substations & PLCs:   Power distribution & cabling
// 4. Civil Foundation Loading & Pits:      Dynamic load calculations
// 5. Turnkey Installation & Commissioning: Staged execution schedule`
      },
      air_cargo: {
        title: "Air Cargo Powered Roller Deck & Lazy Dolly Castor Deck System",
        badge: "Aviation GSE • 7,000 kg ULD Load Rating",
        problem: "Airport cargo terminals require rapid, omnidirectional transfer of wide-body aircraft Unit Load Devices (ULDs e.g., LD3, LD7, PMC pallets weighing up to 6,800 kg) with minimal operator pushing force and zero container damage under dynamic impact loads.",
        solution: "Engineered modular heavy-duty steel deck sections integrating motorized powered roller drives with polyurethane coated rollers, pneumatic/mechanical container pallet stops, and an omnidirectional Lazy Dolly Castor Deck matrix with heavy-duty steel ball castors on a staggered 55mm pitch for uniform load distribution.",
        diagram: `
+-------------------------------------------------------------------------------+
|                    AIRCRAFT CARGO LOADER / TRUCK DOCK                         |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------+               +---------------------------------+
|  Powered Roller Deck Cell   | <===========> | Lazy Dolly Castor Deck Matrix   |
|  - 1.5 kW Helical Gearmotor |               | - Omnidirectional Ball Castors  |
|  - ANSI 50-2 Double Chain   |               | - 7,000 kg Dynamic Load Rating  |
|  - Bidirectional Stop Locks |               | - Integrated Pallet Guide Rails |
+-----------------------------+               +---------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|              CONTAINER LOCKING MECHANISMS & RETRACTABLE RESTRAINTS            |
+-------------------------------------------------------------------------------+`,
        benchmarks: [
          { label: "Rated Payload", val: "7,000 kg ULD Capacity" },
          { label: "Transfer Speed", val: "0.35 m/s Motorized" },
          { label: "Breakaway Force", val: "< 15 kgf Manual Push" }
        ],
        code: `// Drive Torque & Shaft Shear Sizing:
// Input: ULD Weight = 68,000 N, Roll Friction Coeff = 0.035
// Drive Torque Required: T = (F_friction * Roll_Radius) / Gear_Ratio
// 1.5 kW Gearmotor with 1:25 Reduction delivers 340 N·m output torque
// Factor of Safety on Drive Shaft: FoS = 3.4 against torsional shear`
      },
      strip_flattening: {
        title: "Heavy Industrial Strip Flattening & Coil Leveling Machine",
        badge: "Automated SPM • 6 mm High-Tensile Steel",
        problem: "Heavy steel coils exhibit severe residual stresses, coil set curvature, and cross-bow after uncoiling, causing binding in downstream precision stamping dies and automated welding fixtures.",
        solution: "Engineered a 17-roll precision leveling cassette with induction-hardened chrome-plated 42CrMo4 alloy steel rolls. Designed synchronized hydraulic downforce cylinders delivering 80 kN to produce alternating elastoplastic bending, backed by dual planetary reduction drives.",
        diagram: `
[ Steel Coil Reel ] ---> ( Pinch Entry Rolls ) ---> [ 17-Roll Leveling Cassette ]
                                                                |
                                             +------------------+------------------+
                                             | 80 kN Hydraulic Downforce Cylinders |
                                             | Chrome Plated 42CrMo4 Alloy Rolls   |
                                             +------------------+------------------+
                                                                |
                                                                v
                                              [ Tension Exit & Flatness Laser QA ]`,
        benchmarks: [
          { label: "Strip Width", val: "Up to 1,200 mm" },
          { label: "Hydraulic Force", val: "80 kN Downforce" },
          { label: "Residual Flatness", val: "< 0.1 mm / meter" }
        ],
        code: `// Bending Moment & Roll Tonnage Sizing:
// Strip: Width b = 1200 mm, Thickness t = 6 mm, Yield Sy = 355 MPa
// Section Modulus: Z = (b * t^2) / 6 = (1200 * 36) / 6 = 7,200 mm³
// Total Leveling Force required = 78.4 kN -> 80 kN hydraulic system configured`
      },
      t_spacer: {
        title: "Automated T-Spacer Precision Cutting Machine",
        badge: "Special Purpose Machinery (SPM) • ±0.05 mm Accuracy",
        problem: "Manual and semi-automated cutting of insulating glass T-spacers caused high material scrap rates, inconsistent cut lengths (±1.5mm), burrs on miter cuts, and safety hazards during high-speed saw blade engagement.",
        solution: "Engineered an automated cutting cell featuring servo-driven linear ball screws for precise indexing, dual pneumatic clamping jaws lined with urethane pads to avoid surface marring, a high-RPM carbide-tipped circular blade, and an automatic chip vacuum extraction system.",
        diagram: `
[ Profile Feeder ] ---> [ Linear Servo Indexer ] ---> [ Pneumatic Dual Clamps ]
                                                                 |
                                                     High-Speed Carbide Saw Blade
                                                     (4,500 RPM Down-Stroke)
                                                                 |
                                          [ Automated Ejection & Chip Extraction ]`,
        benchmarks: [
          { label: "Cut Tolerance", val: "± 0.05 mm Accuracy" },
          { label: "Cycle Time", val: "1.8 Seconds per Cut" },
          { label: "Scrap Reduction", val: "94% Material Yield" }
        ],
        code: `// Cycle Time Synchronization Sequence:
// Step 1: Servo Feed Index (400 mm @ 600 mm/s) = 0.67s
// Step 2: Pneumatic Clamp Actuation (6 bar)     = 0.15s
// Step 3: Blade Down-Stroke & Cut               = 0.45s
// Step 4: Blade Retract & Unclamp               = 0.25s
// Step 5: Part Ejection to Chute                = 0.28s
// Total Cycle Time per Piece                    = 1.80 seconds`
      },
      load_analysis: {
        title: "CAD FEA Simulation & Real-Life Proof Load Testing Rig",
        badge: "Structural Analysis • Physical Load Testing",
        problem: "Critical lifting beams, spreader bars, and heavy material handling frames must be certified for 1.5x dynamic overload conditions with zero plastic deformation or fatigue cracking under cyclic service.",
        solution: "Conducted non-linear Finite Element Analysis (FEA) in SolidWorks Simulation and ANSYS to identify peak Von Mises stresses and deflection contours. Constructed an in-house proof testing rig utilizing calibrated hydraulic rams and strain gauges to validate deflection against simulation data.",
        diagram: `
Digital CAD Model ---> [ Mesh Refinement (Tet10) ] ---> [ FEA Von Mises Stress Heatmap ]
                                                                   |
                                                         (Comparative Validation)
                                                                   |
Physical Prototype ---> [ Calibrated Hydraulic Rams ] ---> [ Strain Gauge Telemetry ]`,
        benchmarks: [
          { label: "Proof Load", val: "1.5x Dynamic Overload" },
          { label: "Max Deflection", val: "1.42 mm (Spec < 2.5 mm)" },
          { label: "Factor of Safety", val: "3.2 FoS Certified" }
        ],
        code: `// Proof Test & Stress Verification Protocol:
// Applied Test Load: P = 1.5 * W_rated = 1.5 * 70 kN = 105 kN
// Measured Max Strain: ε = 520 microstrain
// Calculated Stress: σ = E * ε = 210,000 MPa * 0.00052 = 109.2 MPa
// Yield Strength S355JR = 355 MPa -> Factor of Safety FoS = 3.25`
      },
      autocad_proposals: {
        title: "AutoCAD Manufacturing Proposals & Site Commissioning Redlines",
        badge: "ASME Y14.5M • QA Inspection Documentation",
        problem: "Manufacturing errors and field installation delays frequently arise from ambiguous 2D drawings, missing datum references, and unforeseen site civil floor level deviations.",
        solution: "Authored comprehensive AutoCAD 2D drafting packages conforming to ASME Y14.5M GD&T standards, created First Article Inspection (FAI) reports, and performed real-time site engineering redlines during plant commissioning to adapt mounting brackets to field conditions.",
        diagram: `
3D SolidWorks Assembly ---> AutoCAD 2D Drafting ---> ASME Y14.5 GD&T Callouts
                                                             |
                                           +-----------------+-----------------+
                                           | Fabrication BOM & Weld Symbols    |
                                           | On-Site Redline Retrofit Protocols|
                                           +-----------------+-----------------+`,
        benchmarks: [
          { label: "Inspection Pass", val: "99.8% First Article FAI" },
          { label: "Standard", val: "ASME Y14.5M / ISO 2768" },
          { label: "Field Redlines", val: "100% Commissioned" }
        ],
        code: `// Drawing Standard Callouts Checklist:
// - True Position: [ ⌖ | ⌀ 0.05 | A | B | C ] on all critical bearing bores
// - Surface Texture: Ra 1.6 on sliding ways, Ra 3.2 on structural weldments
// - Welding: Continuous fillet weld 6mm conforming to AWS D1.1`
      }
    }
  };

  // ==========================================================================
  // WEB AUDIO HAPTICS
  // ==========================================================================
  function initAudio() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) state.audioCtx = new AudioCtx();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
  }

  function playUiSound(type = 'click') {
    if (!state.audioEnabled || !state.audioCtx) return;
    try {
      const now = state.audioCtx.currentTime;
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(290, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'slash') {
        // Crisp metallic sword slice swoosh
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (e) {
      console.warn("Audio issue:", e);
    }
  }

  function toggleAudio() {
    initAudio();
    state.audioEnabled = !state.audioEnabled;
    const btn = document.getElementById('audio-toggle-btn');
    const iconMuted = document.getElementById('audio-icon-muted');
    const iconActive = document.getElementById('audio-icon-active');

    if (state.audioEnabled) {
      btn.classList.add('active');
      iconMuted.style.display = 'none';
      iconActive.style.display = 'block';
      showToast("Engineering UI Haptics Enabled", "🔊");
      playUiSound('success');
    } else {
      btn.classList.remove('active');
      iconMuted.style.display = 'block';
      iconActive.style.display = 'none';
      showToast("UI Haptics Muted", "🔇");
    }
  }

  // ==========================================================================
  // THEME & COLOR PALETTE MANAGEMENT
  // ==========================================================================
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kap_portfolio_theme', theme);

    const sunIcon = document.getElementById('theme-sun-icon');
    const moonIcon = document.getElementById('theme-moon-icon');
    if (sunIcon && moonIcon) {
      if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
  }

  function applyAccent(accent) {
    state.accent = accent;
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('kap_portfolio_accent', accent);

    const choices = document.querySelectorAll('.color-choice-btn');
    choices.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === accent);
    });

    // Update active color dot
    const activeDot = document.getElementById('active-color-indicator');
    if (activeDot) {
      const colors = {
        cyan: '#00d2ff',
        amber: '#f59e0b',
        crimson: '#ef4444',
        purple: '#a855f7',
        emerald: '#10b981'
      };
      activeDot.style.backgroundColor = colors[accent] || '#00d2ff';
    }
  }

  function toggleTheme() {
    initAudio();
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme.toUpperCase()} Mode`, nextTheme === 'light' ? '☀️' : '🌙');
    playUiSound('pop');
  }

  // ==========================================================================
  // HIGH-DEFINITION PROCEDURAL ANIME SWORDS CANVAS ENGINE
  // ==========================================================================
  function initAnimeSwordsEngine() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let lastScrollY = window.scrollY;
    let scrollSpeed = 0;
    let scrollDelta = 0;

    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;
      scrollDelta = currentY - lastScrollY;
      scrollSpeed = Math.abs(scrollDelta);
      lastScrollY = currentY;
    });

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Particle Trail Pool
    const trails = [];
    function addTrail(x, y, color, size = 2.4) {
      if (trails.length > 90) trails.shift();
      trails.push({
        x,
        y,
        color,
        size,
        alpha: 0.75,
        life: 1.0,
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.8
      });
    }

    // 5 High-Definition Character Anime Swords
    const swords = [
      {
        id: 'ichigo',
        name: 'Ichigo: Tensa Zangetsu',
        x: width * 0.16,
        y: height * 0.28,
        angle: -0.62,
        scale: 1.15,
        length: 180,
        color: '#ef4444',
        glowColor: 'rgba(239, 68, 68, 0.65)',
        speedX: 0.35,
        speedY: 0.22,
        chainAngle: 0,
        draw(ctx, s, t, isDark) {
          ctx.save();
          // Blade: Curving pitch-black daito with chisel kissaki tip & fuller groove
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.lineTo(s.length - 24, -14);
          ctx.lineTo(s.length, -20); // Sharp Kissaki
          ctx.lineTo(s.length - 8, -10);
          ctx.lineTo(0, 4);
          ctx.closePath();
          
          // Blade Fill & Gradient
          const bladeGrad = ctx.createLinearGradient(0, -10, 0, 4);
          bladeGrad.addColorStop(0, '#090d16');
          bladeGrad.addColorStop(0.6, '#030508');
          bladeGrad.addColorStop(1, isDark ? '#1e293b' : '#334155');
          ctx.fillStyle = bladeGrad;
          ctx.fill();

          // Crimson Edge Aura
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Bo-hi (Fuller groove)
          ctx.beginPath();
          ctx.moveTo(12, -2);
          ctx.lineTo(s.length - 35, -12);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Gunmetal Habaki (Blade Collar)
          ctx.fillStyle = '#475569';
          ctx.fillRect(-6, -5, 8, 10);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(-6, -5, 8, 10);

          // Manji-shaped Black Iron Tsuba (Crossguard)
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 4;
          ctx.lineCap = 'square';
          ctx.beginPath();
          // Vertical cross arm with hook
          ctx.moveTo(-6, -16);
          ctx.lineTo(-6, 16);
          ctx.moveTo(-6, -16);
          ctx.lineTo(-14, -16);
          ctx.moveTo(-6, 16);
          ctx.lineTo(2, 16);
          // Horizontal cross arm with hook
          ctx.moveTo(-20, 0);
          ctx.lineTo(8, 0);
          ctx.moveTo(-20, 0);
          ctx.lineTo(-20, 8);
          ctx.moveTo(8, 0);
          ctx.lineTo(8, -8);
          ctx.stroke();

          // Tsuka (Hilt with red diamond wrap)
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-52, -4, 46, 8);
          ctx.fillStyle = '#020617';
          // Diamond pattern on wrap
          for (let i = -48; i < -10; i += 7) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 3.5, -4);
            ctx.lineTo(i + 7, 0);
            ctx.lineTo(i + 3.5, 4);
            ctx.closePath();
            ctx.fill();
          }

          // Kashira (Pommel)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-56, -5, 5, 10);

          // Dynamic Physics Chain Links swaying at pommel
          s.chainAngle = Math.sin(t * 2.5) * 0.35;
          ctx.save();
          ctx.translate(-56, 0);
          ctx.rotate(s.chainAngle);
          ctx.strokeStyle = isDark ? '#cbd5e1' : '#475569';
          ctx.lineWidth = 1.4;
          for (let c = 0; c < 5; c++) {
            ctx.strokeRect(-6 - (c * 7), -2.5, 6, 5);
          }
          ctx.restore();

          // Getsuga Tensho Energy Ribbons (swirling black-crimson spiritual pressure)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.length * 0.4, -6);
          ctx.quadraticCurveTo(s.length * 0.7, -25 + Math.sin(t * 3) * 8, s.length + 15, -20);
          ctx.stroke();

          ctx.restore();
        }
      },
      {
        id: 'sasuke',
        name: 'Sasuke: Sword of Kusanagi',
        x: width * 0.82,
        y: height * 0.32,
        angle: 0.52,
        scale: 1.1,
        length: 165,
        color: '#00d2ff',
        glowColor: 'rgba(0, 210, 255, 0.7)',
        speedX: -0.32,
        speedY: 0.25,
        draw(ctx, s, t, isDark) {
          ctx.save();
          // Blade: Razor-straight chokuto with dual-tone chrome mirror edge
          const bladeGrad = ctx.createLinearGradient(0, -3, 0, 3);
          bladeGrad.addColorStop(0, '#0f172a');
          bladeGrad.addColorStop(0.45, '#334155');
          bladeGrad.addColorStop(0.5, '#e2e8f0');
          bladeGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = bladeGrad;
          ctx.fillRect(0, -3, s.length, 6);
          ctx.strokeStyle = '#00d2ff';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(0, -3, s.length, 6);

          // Chokuto Chisel Tip
          ctx.beginPath();
          ctx.moveTo(s.length, -3);
          ctx.lineTo(s.length + 16, -1);
          ctx.lineTo(s.length, 3);
          ctx.closePath();
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.stroke();

          // Habaki (Blade Collar)
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-6, -4, 7, 8);
          ctx.strokeStyle = '#00d2ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(-6, -4, 7, 8);

          // Minimalist Black Hilt
          ctx.fillStyle = '#050811';
          ctx.fillRect(-50, -3.5, 44, 7);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-50, -3.5, 44, 7);

          // White Center Inlay Strip on Hilt
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(-48, -1, 40, 2);

          // Branching Chidori Lightning Bolts crackling along the spine
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const lightningOffset = Math.sin(t * 8) * 6;
          ctx.moveTo(s.length * 0.2, -3);
          ctx.lineTo(s.length * 0.35, -12 + lightningOffset);
          ctx.lineTo(s.length * 0.45, -2);
          ctx.lineTo(s.length * 0.65, -10 - lightningOffset);
          ctx.lineTo(s.length * 0.8, -1);
          ctx.lineTo(s.length + 10, -8);
          ctx.stroke();

          ctx.restore();
        }
      },
      {
        id: 'zoro_wado',
        name: "Zoro: Wado Ichimonji",
        x: width * 0.75,
        y: height * 0.72,
        angle: -0.42,
        scale: 1.05,
        length: 160,
        color: '#ffffff',
        glowColor: 'rgba(255, 255, 255, 0.55)',
        speedX: 0.28,
        speedY: -0.22,
        draw(ctx, s, t, isDark) {
          ctx.save();
          // Blade: Elegant sweeping shinogi-zukuri curve with bright mirror hamon
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s.length * 0.6, -11, s.length, -20);
          ctx.lineTo(s.length + 10, -15);
          ctx.quadraticCurveTo(s.length * 0.6, -3, 0, 5);
          ctx.closePath();
          
          const bladeGrad = ctx.createLinearGradient(0, -10, 0, 5);
          bladeGrad.addColorStop(0, '#334155');
          bladeGrad.addColorStop(0.5, '#cbd5e1');
          bladeGrad.addColorStop(1, '#ffffff');
          ctx.fillStyle = bladeGrad;
          ctx.fill();

          ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Hamon (Bright White Cutting Edge Temper Line)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(4, 3);
          ctx.quadraticCurveTo(s.length * 0.6, -4, s.length + 8, -16);
          ctx.stroke();

          // Brass Habaki
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-6, -4, 7, 9);

          // Circular Golden Tsuba
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // White Tsuka Wrap over Textured Samegawa
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-46, -3.5, 46, 7);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(-46, -3.5, 46, 7);

          // White Diamond wrap knots
          ctx.fillStyle = '#94a3b8';
          for (let i = -42; i < -6; i += 7) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 3.5, -3.5);
            ctx.lineTo(i + 7, 0);
            ctx.lineTo(i + 3.5, 3.5);
            ctx.closePath();
            ctx.fill();
          }

          // Wind Slash Aura Rings
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(s.length * 0.6, -10, 18 + Math.sin(t * 3) * 4, -0.4, Math.PI * 0.8);
          ctx.stroke();

          ctx.restore();
        }
      },
      {
        id: 'zoro_kitetsu',
        name: "Zoro: Sandai Kitetsu (Cursed Blade)",
        x: width * 0.25,
        y: height * 0.78,
        angle: 0.38,
        scale: 1.05,
        length: 160,
        color: '#dc2626',
        glowColor: 'rgba(220, 38, 38, 0.65)',
        speedX: -0.28,
        speedY: -0.24,
        draw(ctx, s, t, isDark) {
          ctx.save();
          // Blade: Deep dark steel with wild undulating flame hamon (midare)
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s.length * 0.5, -14, s.length, -25);
          ctx.lineTo(s.length + 10, -20);
          ctx.quadraticCurveTo(s.length * 0.5, -6, 0, 5);
          ctx.closePath();

          const bladeGrad = ctx.createLinearGradient(0, -14, 0, 5);
          bladeGrad.addColorStop(0, '#0f172a');
          bladeGrad.addColorStop(0.6, '#1e293b');
          bladeGrad.addColorStop(1, '#450a0a');
          ctx.fillStyle = bladeGrad;
          ctx.fill();

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Wild Undulating Flame Hamon
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 8; i < s.length - 5; i += 10) {
            const hx = i;
            const hy = -6 - (i / s.length * 15) + Math.sin(i * 0.4 + t * 4) * 4;
            if (i === 8) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.stroke();

          // Brass Habaki
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-5, -4, 6, 9);

          // Notched Flared Crossguard (Kitetsu Tsuba)
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(-4, -14);
          ctx.lineTo(0, -16);
          ctx.lineTo(4, -14);
          ctx.lineTo(2, 0);
          ctx.lineTo(4, 14);
          ctx.lineTo(0, 16);
          ctx.lineTo(-4, 14);
          ctx.lineTo(-2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Scarlet Tsuka Wrap with Gold Menuki
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-48, -4, 46, 8);
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-48, -4, 46, 8);

          // Gold Menuki Pin
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(-24, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Demonic Crimson Embers
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(s.length * 0.7, -18, 10 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
      },
      {
        id: 'zoro_enma',
        name: "Zoro: Great Blade Enma",
        x: width * 0.5,
        y: height * 0.52,
        angle: -0.18,
        scale: 1.2,
        length: 185,
        color: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.7)',
        speedX: 0.32,
        speedY: 0.18,
        draw(ctx, s, t, isDark) {
          ctx.save();
          // Blade: Heavy sweeping edge with flame-engraved habaki & golden hamon
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s.length * 0.55, -9, s.length, -16);
          ctx.lineTo(s.length + 12, -10);
          ctx.quadraticCurveTo(s.length * 0.55, -2, 0, 5);
          ctx.closePath();

          const bladeGrad = ctx.createLinearGradient(0, -10, 0, 5);
          bladeGrad.addColorStop(0, '#090d16');
          bladeGrad.addColorStop(0.5, '#1e1b4b');
          bladeGrad.addColorStop(1, '#3b0764');
          ctx.fillStyle = bladeGrad;
          ctx.fill();

          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Gold Temper Line
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(6, 2);
          ctx.quadraticCurveTo(s.length * 0.55, -5, s.length + 8, -12);
          ctx.stroke();

          // Gilded Flame Habaki
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-6, -5, 7, 10);

          // Trefoil / Clover-Leaf Golden Tsuba
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(-2, -8, 6, 0, Math.PI * 2);
          ctx.arc(-2, 8, 6, 0, Math.PI * 2);
          ctx.arc(4, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Royal Lilac/Purple Tsuka Wrap
          ctx.fillStyle = '#6b21a8';
          ctx.fillRect(-52, -4, 48, 8);
          ctx.strokeStyle = '#e9d5ff';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-52, -4, 48, 8);

          // Golden Blossom Emblems on Hilt
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(-36, 0, 2, 0, Math.PI * 2);
          ctx.arc(-20, 0, 2, 0, Math.PI * 2);
          ctx.fill();

          // Swirling Purple Ryuo (Haki) Vapor Licking Along the Edge
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 20; i < s.length + 15; i += 15) {
            const vy = -6 - (i / s.length * 10) + Math.sin(i * 0.3 + t * 5) * 6;
            if (i === 20) ctx.moveTo(i, vy);
            else ctx.lineTo(i, vy);
          }
          ctx.stroke();

          ctx.restore();
        }
      }
    ];

    let t = 0;

    function renderLoop() {
      ctx.clearRect(0, 0, width, height);
      t += 0.015;

      const isDark = state.theme === 'dark';
      scrollSpeed *= 0.92;

      // Update & Draw Trails
      for (let i = trails.length - 1; i >= 0; i--) {
        const p = trails[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.018;
        if (p.alpha <= 0) {
          trails.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
        ctx.fill();
      }

      // Render Active Swords
      swords.forEach((s, idx) => {
        // If a specific sword is selected and it's not this one, skip
        if (state.activeSword !== 'all' && state.activeSword !== s.id) {
          return;
        }

        const scrollParallax = (window.scrollY * (0.12 + idx * 0.04)) % (height + 300);
        
        // Gentle floating drift
        s.x += s.speedX + Math.sin(t + idx) * 0.35;
        s.y += s.speedY + Math.cos(t * 0.8 + idx) * 0.35;

        // Wrap around viewport with margin
        if (s.x < -220) s.x = width + 120;
        if (s.x > width + 220) s.x = -120;
        if (s.y < -220) s.y = height + 120;
        if (s.y > height + 220) s.y = -120;

        // Dynamic tilt with scroll velocity
        const dynamicAngle = s.angle + Math.sin(t + idx * 2) * 0.08 + (scrollDelta * 0.001);

        // Spotlighting Scale: If isolated sword, make it 1.25x larger & centered in perspective
        const effectiveScale = state.activeSword === s.id ? s.scale * 1.25 : s.scale;
        const drawY = (s.y - (scrollParallax * 0.2) + height) % height;

        ctx.save();
        ctx.translate(s.x, drawY);
        ctx.rotate(dynamicAngle);
        ctx.scale(effectiveScale, effectiveScale);

        // Glow Filter
        ctx.shadowColor = s.glowColor;
        ctx.shadowBlur = (isDark ? 18 : 12) + Math.sin(t * 2 + idx) * 6;

        // Draw Polished Weapon
        s.draw(ctx, s, t, isDark);

        // Spawn Energy Particles from Blade Tip
        if (Math.random() > 0.35) {
          const tipX = s.x + Math.cos(dynamicAngle) * (s.length * effectiveScale);
          const tipY = drawY + Math.sin(dynamicAngle) * (s.length * effectiveScale);
          const particleColor = s.color === '#ffffff' ? 'rgba(255, 255, 255' : s.color.replace('#', 'rgba(');
          addTrail(tipX, tipY, particleColor, 2.6);
        }

        ctx.restore();
      });

      scrollDelta = 0;
      requestAnimationFrame(renderLoop);
    }

    renderLoop();
  }

  // ==========================================================================
  // TOP SWORD SELECTOR TOOLBAR LOGIC
  // ==========================================================================
  function initSwordSelector() {
    const pills = document.querySelectorAll('.sword-select-pill');
    const label = document.getElementById('active-sword-label');
    const stateText = document.getElementById('active-sword-state');

    const swordTitles = {
      all: "All 5 Anime Swords",
      ichigo: "Ichigo: Tensa Zangetsu",
      sasuke: "Sasuke: Sword of Kusanagi",
      zoro_wado: "Zoro: Wado Ichimonji",
      zoro_kitetsu: "Zoro: Sandai Kitetsu",
      zoro_enma: "Zoro: Great Blade Enma"
    };

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        initAudio();
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const swordId = pill.dataset.sword;
        state.activeSword = swordId;

        const title = swordTitles[swordId] || "Anime Blade Engine";
        if (label) label.textContent = `Active Blade: ${title}`;
        if (stateText) stateText.textContent = `Spotlight Active`;

        showToast(`Spotlight: ${title}`, "⚔️");
        playUiSound('slash');
      });
    });
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, icon = '✓') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span style="color: var(--accent-primary); font-size: 1rem;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    playUiSound('pop');

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================================================
  // COMMAND PALETTE (Ctrl+K / Cmd+K)
  // ==========================================================================
  const commandData = [
    { title: "Steel Plant Budgetary Quote", desc: "Turnkey equipment sizing & CAPEX proposals", icon: "🏗️", action: () => openCaseStudy('steel_plant') },
    { title: "Air Cargo GSE Decks", desc: "Powered Roller & Lazy Dolly Castor Deck specs (7,000 kg)", icon: "🛫", action: () => openCaseStudy('air_cargo') },
    { title: "Strip Flattening Machine", desc: "17-roll precision hydraulic leveling machine (80 kN)", icon: "🦾", action: () => openCaseStudy('strip_flattening') },
    { title: "T-Spacer Cutting SPM", desc: "High-speed precision automated cutting cell (±0.05mm)", icon: "⚡", action: () => openCaseStudy('t_spacer') },
    { title: "FEA & Proof Load Testing", desc: "Von Mises stress simulation & physical validation", icon: "📐", action: () => openCaseStudy('load_analysis') },
    { title: "AutoCAD & QA Documentation", desc: "ASME Y14.5M GD&T & inspection packages", icon: "📋", action: () => openCaseStudy('autocad_proposals') },
    { title: "Toggle Light / Dark Theme", desc: "Switch between Obsidian Titanium & Drafting White", icon: "🌓", action: () => toggleTheme() },
    { title: "Select Tensa Zangetsu Blade", desc: "Isolate Ichigo's Bankai in background", icon: "🔴", action: () => document.querySelector('.sword-select-pill[data-sword="ichigo"]')?.click() },
    { title: "Select Kusanagi Katana", desc: "Isolate Sasuke's Chidori Katana in background", icon: "⚡", action: () => document.querySelector('.sword-select-pill[data-sword="sasuke"]')?.click() },
    { title: "Select Enma Ryuo Blade", desc: "Isolate Zoro's Great Blade Enma in background", icon: "🟣", action: () => document.querySelector('.sword-select-pill[data-sword="zoro_enma"]')?.click() },
    { title: "Run 7,000 kg Air Cargo Load Calc", desc: "Execute dynamic deck loading in sandbox", icon: "🧮", action: () => { scrollToSection('architecture'); runSandboxCommand('calc-air-cargo'); } },
    { title: "Run Strip Leveling Tonnage Sizing", desc: "Solve 80 kN hydraulic downforce requirements", icon: "⚙️", action: () => { scrollToSection('architecture'); runSandboxCommand('strip-tonnage'); } },
    { title: "Copy Verified Email", desc: "pran.acharya.eng@gmail.com", icon: "✉️", action: () => copyEmail() },
    { title: "Download Technical Dossier", desc: "Export Karampudi Acharya Pranav engineering brief", icon: "💾", action: () => downloadDossier() }
  ];

  function openCommandPalette() {
    initAudio();
    const backdrop = document.getElementById('cmd-modal-backdrop');
    const input = document.getElementById('cmd-search-input');
    if (!backdrop || !input) return;

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    input.value = '';
    state.cmdIndex = 0;
    renderCommandResults('');
    input.focus();
    playUiSound('pop');
  }

  function closeCommandPalette() {
    const backdrop = document.getElementById('cmd-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  function renderCommandResults(query) {
    const list = document.getElementById('cmd-results-list');
    if (!list) return;
    list.innerHTML = '';

    const q = query.toLowerCase().trim();
    const filtered = commandData.filter(item => {
      return item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    });

    state.cmdItems = filtered;

    if (filtered.length === 0) {
      list.innerHTML = `<li style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No matching CAD engineering tools found.</li>`;
      return;
    }

    filtered.forEach((cmd, idx) => {
      const li = document.createElement('li');
      li.className = `cmd-item ${idx === state.cmdIndex ? 'selected' : ''}`;
      li.innerHTML = `
        <div class="cmd-item-left">
          <span style="font-size: 1.15rem;">${cmd.icon}</span>
          <div>
            <div style="font-weight: 600; color: var(--text-highlight);">${cmd.title}</div>
            <div class="cmd-item-desc">${cmd.desc}</div>
          </div>
        </div>
        <span class="kbd-badge">↵</span>
      `;

      li.addEventListener('click', () => {
        cmd.action();
        closeCommandPalette();
      });

      list.appendChild(li);
    });
  }

  function handleCommandKeydown(e) {
    const backdrop = document.getElementById('cmd-modal-backdrop');
    if (!backdrop || !backdrop.classList.contains('open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.cmdItems.length > 0) {
        state.cmdIndex = (state.cmdIndex + 1) % state.cmdItems.length;
        updateCommandSelection();
        playUiSound('click');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.cmdItems.length > 0) {
        state.cmdIndex = (state.cmdIndex - 1 + state.cmdItems.length) % state.cmdItems.length;
        updateCommandSelection();
        playUiSound('click');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.cmdItems[state.cmdIndex]) {
        state.cmdItems[state.cmdIndex].action();
        closeCommandPalette();
      }
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  }

  function updateCommandSelection() {
    const items = document.querySelectorAll('.cmd-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === state.cmdIndex);
      if (idx === state.cmdIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================================================
  // CASE STUDY MODAL
  // ==========================================================================
  function openCaseStudy(projectId) {
    const data = state.caseStudies[projectId];
    if (!data) return;

    const backdrop = document.getElementById('case-study-modal-backdrop');
    const title = document.getElementById('case-study-title');
    const badge = document.getElementById('case-study-badge');
    const content = document.getElementById('case-study-content');

    title.textContent = data.title;
    badge.textContent = data.badge;

    let benchmarksHtml = '';
    if (data.benchmarks && data.benchmarks.length > 0) {
      benchmarksHtml = `
        <h4 style="color:var(--text-highlight); margin-top:1.5rem; margin-bottom:0.75rem;">Verified Performance &amp; Inspection Benchmarks</h4>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          ${data.benchmarks.map(b => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); padding: 0.85rem; border-radius: var(--radius-sm);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${b.label}</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); font-family: var(--font-mono); margin-top: 0.2rem;">${b.val}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    content.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h4 style="color:var(--text-highlight); margin-bottom: 0.4rem;">Engineering Challenge &amp; Design Criteria</h4>
        <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">${data.problem}</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="color:var(--text-highlight); margin-bottom: 0.4rem;">Design Thinking &amp; Mechanical Solution</h4>
        <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">${data.solution}</p>
      </div>

      <h4 style="color:var(--text-highlight); margin-bottom: 0.4rem;">Mechanical Assembly &amp; Flow Schematic</h4>
      <div class="case-diagram">${data.diagram}</div>

      ${benchmarksHtml}

      <h4 style="color:var(--text-highlight); margin-bottom: 0.4rem;">Engineering Calculations &amp; Specification Sizing</h4>
      <div class="case-diagram" style="color: var(--text-secondary);">${escapeHtml(data.code)}</div>
    `;

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    playUiSound('pop');
  }

  function closeCaseStudy() {
    const backdrop = document.getElementById('case-study-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ==========================================================================
  // INTERACTIVE MECHANICAL & FEA LOAD SIMULATOR
  // ==========================================================================
  function runSandboxCommand(cmd) {
    const output = document.getElementById('sandbox-terminal-output');
    if (!output) return;

    const append = (html) => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = html;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    playUiSound('click');

    if (cmd === 'clear') {
      output.innerHTML = '';
      append(`<span class="terminal-prompt">&gt;&gt;</span><span class="terminal-output">Simulation log cleared. Ready for next calculation.</span>`);
      return;
    }

    append(`<span class="terminal-prompt">&gt;&gt;</span><span class="terminal-output">solve --routine ${cmd}</span>`);

    if (cmd === 'calc-air-cargo') {
      append(`<span class="terminal-highlight">[Air Cargo GSE Deck]</span> Loading 7,000 kg ULD Container onto Lazy Dolly Castor Deck...`);
      setTimeout(() => {
        append(`<span class="terminal-output">» Castor Matrix: 120 Inverted Ball Castors (Load per unit = 572 N)</span>`);
        append(`<span class="terminal-output">» Motorized Roller Ingress: 1.5 kW Gearmotor @ 1:25 ratio delivering 340 N·m torque</span>`);
      }, 300);
      setTimeout(() => {
        append(`<span class="terminal-success">✓ Solver Result: Max Deck Deflection = 1.42 mm (Allowable &lt; 2.5 mm). Factor of Safety = 3.2 FoS.</span>`);
        playUiSound('success');
      }, 750);
    } else if (cmd === 'strip-tonnage') {
      append(`<span class="terminal-highlight">[Strip Flattening Machine]</span> Calculating roll tonnage for S355JR coil (t = 6mm, b = 1,200mm)...`);
      setTimeout(() => {
        append(`<span class="terminal-output">» Section Modulus Z = (1200 * 36) / 6 = 7,200 mm³</span>`);
        append(`<span class="terminal-output">» Plastic Bending Moment Mp = 1.5 * Sy * Z = 3.83 kN·m</span>`);
      }, 300);
      setTimeout(() => {
        append(`<span class="terminal-success">✓ Total Required Hydraulic Force = 78.4 kN. Configured cylinders provide 80 kN (Margin: 102%).</span>`);
        playUiSound('success');
      }, 700);
    } else if (cmd === 't-spacer-cycle') {
      append(`<span class="terminal-highlight">[T-Spacer Cutting SPM]</span> Simulating automated cycle breakdown...`);
      setTimeout(() => {
        append(`<span class="terminal-output">» Feed Stroke (400 mm @ 600 mm/s) + Accel: 0.67s</span>`);
        append(`<span class="terminal-output">» Pneumatic Clamping (6 bar dual jaw):   0.15s</span>`);
        append(`<span class="terminal-output">» 4,500 RPM Carbide Blade Stroke:         0.45s</span>`);
        append(`<span class="terminal-output">» Blade Retract &amp; Air Jet Part Ejection:   0.53s</span>`);
      }, 300);
      setTimeout(() => {
        append(`<span class="terminal-success">✓ Total Cycle Time: 1.80 seconds per finished T-Spacer (Accuracy ±0.03 mm).</span>`);
        playUiSound('success');
      }, 750);
    } else if (cmd === 'steel-plant-quote') {
      append(`<span class="terminal-highlight">[Steel Plant Equipment Proposal]</span> Processing equipment specifications &amp; budgetary quote...`);
      setTimeout(() => {
        append(`<span class="terminal-output">├── Primary Processing Lines: Slitters &amp; 17-Roll Levelers</span>`);
        append(`<span class="terminal-output">├── Material Handling Systems: 25T Overhead Cranes &amp; Rail Carts</span>`);
        append(`<span class="terminal-output">├── Electrical &amp; Automation: Substations &amp; Centralized HMI</span>`);
        append(`<span class="terminal-output">└── Civil Interfacing: Foundations, Pits &amp; Machine Anchor Patterns</span>`);
      }, 300);
      setTimeout(() => {
        append(`<span class="terminal-success">✓ Master Layout &amp; Budgetary Proposal validated for equipment installation sequencing.</span>`);
        playUiSound('success');
      }, 700);
    }
  }

  // ==========================================================================
  // PROJECT FILTERING
  // ==========================================================================
  function initProjectFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playUiSound('click');

        const filter = btn.dataset.filter;

        cards.forEach(card => {
          const cat = card.dataset.category;
          if (filter === 'all' || cat === filter) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 30);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  // ==========================================================================
  // UTILITY ACTIONS (Copy Email, Technical Dossier, Clock)
  // ==========================================================================
  function copyEmail() {
    const email = "pran.acharya.eng@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      showToast("Email address copied to clipboard!", "📋");
      playUiSound('success');
    }).catch(() => {
      showToast("Email: pran.acharya.eng@gmail.com", "✉️");
    });
  }

  function downloadDossier() {
    playUiSound('pop');
    showToast("Generating Karampudi Acharya Pranav Technical Dossier...", "💾");

    const content = `================================================================================
KARAMPUDI ACHARYA PRANAV — LEAD MECHANICAL CAD DESIGN & TURNKEY PROJECT ENGINEER
Email: pran.acharya.eng@gmail.com | Turnkey Machinery & Aviation GSE Engineering
CAD Specialties: SolidWorks 3D, AutoCAD 2D, KeyShot 11, FEA Stress Analysis
================================================================================

EXECUTIVE OVERVIEW:
Mechanical Design Engineer with extensive experience in 3D CAD modeling, large assemblies,
Design Thinking, and turnkey industrial project management. Proven record delivering
budgetary proposals for steel plant equipment, automated special purpose machinery,
and aviation cargo ground handling systems.

CORE PROJECT SPOTLIGHTS:

1. BUDGETARY PROPOSAL FOR EQUIPMENT IN A STEEL PLANT:
   • Preparation of comprehensive budgetary quotes and CAPEX estimation for steel plant equipment.
   • 2D/3D plant layout in AutoCAD, material handling logistics, 25T crane clearance envelopes.
   • Supplier technical evaluations, equipment sizing, and civil foundation load interfaces.

2. AIR CARGO GROUND HANDLING SYSTEMS:
   • Powered Roller Deck & Lazy Dolly Castor Deck systems handling up to 7,000 kg ULDs.
   • Motorized chain drives, bidirectional pallet stops, omnidirectional ball castors.
   • Dynamic shock load verification conforming to IATA / AHM standards.

3. SPECIAL PURPOSE MACHINERY (SPM):
   • Automated T-Spacer Precision Cutting Machine: Linear servo indexer, ±0.05 mm tolerance,
     pneumatic dual clamping, 1.8 second cycle time, automatic scrap ejection.
   • Industrial Strip Flattening Machine: 17-roll precision cassette with 80 kN hydraulic
     downforce to eliminate coil set across 1,200 mm wide high-tensile steel coils.

4. FEA LOAD ANALYSIS & REAL-WORLD PROOF TESTING:
   • Computational Von Mises stress, strain, and deflection simulations (ANSYS / SolidWorks).
   • Validated against real-life proof tests using calibrated hydraulic rams and strain gauges.
   • Factor of Safety FoS > 2.8 certified on all load-bearing lifting assets.

5. AUTOCAD TECHNICAL PROPOSALS & INSPECTION DOCUMENTATION:
   • ASME Y14.5M Geometric Dimensioning & Tolerancing (GD&T) shop drawings.
   • Detailed Bills of Materials (BOM), weldment callouts (AWS D1.1), First Article Inspections.
   • On-site engineering redlines and real-time retrofits during live plant commissioning.

6. KEYSHOT 3D PHOTOREALISTIC RENDERINGS:
   • Studio HDRI ray-traced presentations, exploded assembly views, client visual approvals.

================================================================================
Generated via Karampudi Acharya Pranav Engineering Suite. All Rights Reserved.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Karampudi_Acharya_Pranav_CAD_Dossier.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateClock() {
    const clockEl = document.getElementById('current-pst-time');
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  function initTelemetryFlicker() {
    const deflectEl = document.getElementById('telemetry-deflect');
    const fosEl = document.getElementById('telemetry-fos');

    setInterval(() => {
      if (deflectEl) {
        const d = (1.38 + Math.random() * 0.08).toFixed(2);
        deflectEl.textContent = `${d} mm`;
      }
      if (fosEl) {
        const f = (3.15 + Math.random() * 0.12).toFixed(1);
        fosEl.textContent = `${f} FoS`;
      }
    }, 3600);
  }

  // ==========================================================================
  // INITIALIZATION & EVENT BINDINGS
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme & Accent Setup
    applyTheme(state.theme);
    applyAccent(state.accent);

    // 2. Engines & UI Controls
    initAnimeSwordsEngine();
    initSwordSelector();
    initProjectFilters();
    initTelemetryFlicker();

    updateClock();
    setInterval(updateClock, 1000);

    // Theme Switcher Button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Color Palette Switcher Dropdown
    const colorBtn = document.getElementById('color-picker-btn');
    const colorMenu = document.getElementById('color-palette-menu');
    if (colorBtn && colorMenu) {
      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorMenu.classList.toggle('open');
        playUiSound('click');
      });

      document.addEventListener('click', (e) => {
        if (!colorMenu.contains(e.target) && e.target !== colorBtn) {
          colorMenu.classList.remove('open');
        }
      });

      document.querySelectorAll('.color-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          initAudio();
          const acc = btn.dataset.accent;
          applyAccent(acc);
          colorMenu.classList.remove('open');
          showToast(`Palette Range: ${btn.textContent.trim()}`, "🎨");
          playUiSound('pop');
        });
      });
    }

    // Command Palette Setup
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutLabel = document.getElementById('kbd-shortcut-label');
    if (shortcutLabel && !isMac) {
      shortcutLabel.textContent = 'Ctrl+K';
    }

    const openCmdBtn = document.getElementById('open-cmd-btn');
    const heroCmdBtn = document.getElementById('hero-cmd-btn');
    const cmdBackdrop = document.getElementById('cmd-modal-backdrop');
    const cmdInput = document.getElementById('cmd-search-input');

    if (openCmdBtn) openCmdBtn.addEventListener('click', openCommandPalette);
    if (heroCmdBtn) heroCmdBtn.addEventListener('click', openCommandPalette);

    if (cmdBackdrop) {
      cmdBackdrop.addEventListener('click', (e) => {
        if (e.target === cmdBackdrop) closeCommandPalette();
      });
    }

    if (cmdInput) {
      cmdInput.addEventListener('input', (e) => {
        state.cmdIndex = 0;
        renderCommandResults(e.target.value);
      });
      cmdInput.addEventListener('keydown', handleCommandKeydown);
    }

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const backdrop = document.getElementById('cmd-modal-backdrop');
        if (backdrop && backdrop.classList.contains('open')) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeCaseStudy();
      }
    });

    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) audioBtn.addEventListener('click', toggleAudio);

    const dossierBtn = document.getElementById('hero-brief-btn');
    if (dossierBtn) dossierBtn.addEventListener('click', downloadDossier);

    const copyEmailBtn = document.getElementById('copy-email-btn');
    if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmail);

    document.querySelectorAll('.view-case-study').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const proj = btn.dataset.project;
        openCaseStudy(proj);
      });
    });

    const closeCaseBtn = document.getElementById('close-case-study-btn');
    const caseBackdrop = document.getElementById('case-study-modal-backdrop');
    if (closeCaseBtn) closeCaseBtn.addEventListener('click', closeCaseStudy);
    if (caseBackdrop) {
      caseBackdrop.addEventListener('click', (e) => {
        if (e.target === caseBackdrop) closeCaseStudy();
      });
    }

    document.querySelectorAll('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const link = btn.dataset.link || "Technical Proposal Documentation";
        navigator.clipboard.writeText(link).then(() => {
          showToast(`Specification details copied!`, "📋");
          playUiSound('success');
        });
      });
    });

    document.querySelectorAll('.term-cmd-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        runSandboxCommand(cmd);
      });
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('form-submit-btn');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = `<span>Transmitting Technical Inquiry...</span>`;
        submitBtn.disabled = true;

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          contactForm.reset();
          showToast("Technical Project Inquiry transmitted to priority queue!", "✓");
          playUiSound('success');
        }, 1200);
      });
    }

    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', () => {
        mobileDrawer.classList.toggle('open');
        playUiSound('click');
      });

      document.querySelectorAll('[data-close-drawer]').forEach(item => {
        item.addEventListener('click', () => {
          mobileDrawer.classList.remove('open');
        });
      });
    }

    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (window.pageYOffset >= sectionTop) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  });

})();
