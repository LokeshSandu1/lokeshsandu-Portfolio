/**
 * AUTOMOTIVE TELEMETRY & COCKPIT SCRIPT — v3.3
 * Lokesh Sandu Portfolio
 * Featuring Scroll-Hover Synchronizer for Stationary Cursor
 */

document.addEventListener('DOMContentLoaded', () => {

  const isMobile = window.innerWidth <= 768;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. HERO LETTER CINEMATIC FLY-IN
     ========================================================= */
  function startHeroIntro() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    const firstNode = heroTitle.childNodes[0];
    if (firstNode && firstNode.nodeType === 3) {
      const raw = firstNode.textContent;
      const trimmed = raw.trim();
      const leading = raw.slice(0, raw.indexOf(trimmed));
      if (leading) heroTitle.insertBefore(document.createTextNode(leading), firstNode);
      const frag = document.createDocumentFragment();
      [...trimmed].forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'hero-letter';
        s.style.setProperty('--i', i);
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        frag.appendChild(s);
      });
      firstNode.parentNode.replaceChild(frag, firstNode);
    }
    setTimeout(() => heroTitle.classList.add('hero-intro-play'), 120);
  }
  startHeroIntro();

  /* =========================================================
     2. CAN OSCILLOSCOPE — scroll-reactive waveform
     ========================================================= */
  const canvas = document.getElementById('canWaveformCanvas');
  let scrollVel = 1;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, step = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Blueprint grid
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
      for (let x = 0; x < width; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Two stacked scopes: CAN_H (blue) and CAN_L (silver)
      const scopeCenters = [height * 0.28, height * 0.78];
      const canHOffset = 32;
      const canLOffset = -32;

      // Glow pass — thicker soft stroke underneath
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.45)';

      // ---- CAN_H trace (top scope) ----
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
      ctx.lineWidth = 1.6;
      for (let x = 0; x < width; x += 3) {
        const pulse = Math.sin((x + step) * 0.02) * Math.sin((x + step) * 0.005);
        const bit = pulse > 0.3 ? 26 : 0;
        const y = scopeCenters[0] + canHOffset +
                  (Math.sin((x + step * 2) * 0.015) > 0.6 ? 24 : 0) - bit;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ---- CAN_L trace (bottom scope) ----
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(148, 163, 184, 0.7)';
      for (let x = 0; x < width; x += 3) {
        const pulse = Math.sin((x + step) * 0.02) * Math.sin((x + step) * 0.005);
        const bit = pulse > 0.3 ? 26 : 0;
        const y = scopeCenters[1] + canLOffset -
                  (Math.sin((x + step * 2) * 0.015) > 0.6 ? 24 : 0) + bit;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Moving "trigger" pulse markers
      ctx.shadowBlur = 0;
      const markerSpeed = 1.2 * scrollVel;
      const marker1 = ((step * markerSpeed) % (width + 200)) - 100;
      const marker2 = ((step * markerSpeed * 0.7 + 500) % (width + 200)) - 100;

      [marker1, marker2].forEach((mx, i) => {
        const yBase = scopeCenters[i];
        const grad = ctx.createRadialGradient(mx, yBase, 0, mx, yBase, 22);
        grad.addColorStop(0, i === 0 ? 'rgba(96,165,250,1)' : 'rgba(226,232,240,1)');
        grad.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, yBase, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      step += 1.5 * scrollVel;
      scrollVel += (1 - scrollVel) * 0.05;
      requestAnimationFrame(draw);
    }
    draw();
  }

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const v = Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;
    scrollVel = Math.min(6, 1 + v * 0.08);
  }, { passive: true });

  /* =========================================================
     3. CIRCUIT TRACES + DATA PACKET FLOW
     ========================================================= */
  const circuit = document.getElementById('circuitCanvas');
  if (circuit && !isMobile && !prefersReduced) {
    const cctx = circuit.getContext('2d');
    let cw, ch;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function cResize() {
      cw = window.innerWidth;
      ch = window.innerHeight;
      circuit.width = cw * dpr;
      circuit.height = ch * dpr;
      circuit.style.width = cw + 'px';
      circuit.style.height = ch + 'px';
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', cResize);
    cResize();

    const NODE_COUNT = 9;
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        connections: []
      });
    }

    nodes.forEach((n, i) => {
      nodes.forEach((m, j) => {
        if (i >= j) return;
        const dx = Math.abs(n.x - m.x);
        const dy = Math.abs(n.y - m.y);
        if (dx + dy < 340 && Math.random() > 0.7) {
          n.connections.push({ to: m, mid: Math.random() > 0.5 ? 'h' : 'v' });
        }
      });
    });

    const packets = [];
    nodes.forEach(n => {
      n.connections.forEach(c => {
        packets.push({
          from: n,
          to: c.to,
          mid: c.mid,
          t: Math.random(),
          speed: 0.0015 + Math.random() * 0.0025,
          size: 1.6 + Math.random() * 1.4
        });
      });
    });

    function packetPos(p) {
      const { from, to, mid, t } = p;
      if (mid === 'h') {
        const cornerX = to.x;
        const cornerY = from.y;
        const d1 = Math.abs(cornerX - from.x);
        const d2 = Math.abs(to.y - cornerY);
        const total = d1 + d2 || 1;
        const dist = t * total;
        if (dist < d1) {
          return { x: from.x + (cornerX - from.x) * (dist / d1 || 0), y: from.y };
        } else {
          return { x: cornerX, y: cornerY + (to.y - cornerY) * ((dist - d1) / (d2 || 1)) };
        }
      } else {
        const cornerX = from.x;
        const cornerY = to.y;
        const d1 = Math.abs(cornerY - from.y);
        const d2 = Math.abs(to.x - cornerX);
        const total = d1 + d2 || 1;
        const dist = t * total;
        if (dist < d1) {
          return { x: from.x, y: from.y + (cornerY - from.y) * (dist / (d1 || 1)) };
        } else {
          return { x: cornerX + (to.x - cornerX) * ((dist - d1) / (d2 || 1)), y: cornerY };
        }
      }
    }

    function drawCircuit() {
      cctx.clearRect(0, 0, cw, ch);

      // Static trace lines
      cctx.lineWidth = 0.8;
      cctx.strokeStyle = 'rgba(59, 130, 246, 0.28)';
      nodes.forEach(n => {
        n.connections.forEach(c => {
          const t = c.to;
          cctx.beginPath();
          if (c.mid === 'h') {
            cctx.moveTo(n.x, n.y);
            cctx.lineTo(t.x, n.y);
            cctx.lineTo(t.x, t.y);
          } else {
            cctx.moveTo(n.x, n.y);
            cctx.lineTo(n.x, t.y);
            cctx.lineTo(t.x, t.y);
          }
          cctx.stroke();
        });
      });

      // Node pads
      nodes.forEach(n => {
        cctx.fillStyle = 'rgba(59, 130, 246, 0.55)';
        cctx.fillRect(n.x - 2.5, n.y - 2.5, 5, 5);
        cctx.strokeStyle = 'rgba(96, 165, 250, 0.9)';
        cctx.lineWidth = 0.8;
        cctx.strokeRect(n.x - 4, n.y - 4, 8, 8);
      });

      // Animated packets
      packets.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) {
          const nn = nodes[Math.floor(Math.random() * nodes.length)];
          if (nn.connections.length) {
            const cc = nn.connections[Math.floor(Math.random() * nn.connections.length)];
            p.from = nn;
            p.to = cc.to;
            p.mid = cc.mid;
            p.t = 0;
          } else {
            p.t = 0;
          }
        }
        const pos = packetPos(p);
        const grad = cctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 4);
        grad.addColorStop(0, 'rgba(96, 165, 250, 1)');
        grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.6)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        cctx.fillStyle = grad;
        cctx.beginPath();
        cctx.arc(pos.x, pos.y, p.size * 4, 0, Math.PI * 2);
        cctx.fill();
      });

      requestAnimationFrame(drawCircuit);
    }
    drawCircuit();
  }

  /* =========================================================
     4. TYPEWRITER SUBTITLE
     ========================================================= */
  const typedTarget = document.getElementById('typingTarget');
  if (typedTarget) {
    const lines = [
      'Assistant Manager — Software Integration & Validation',
      'Vehicle CAN Architecture & Master DBC Management',
      'ECU V&V · VCU, BMS, MCU & BLE Integration',
      'CCS2 Fast Charging · ISO 15118 & IEC 61851',
      'Automated Test Design · CANoe & vTESTstudio',
      'Functional Safety · ISO 26262 ASIL-B & UDS Diagnostics',
      'Embedded Firmware · STM32 FOC BLDC Motor Control'
    ];
    let pi = 0, ci = 0, del = false;
    (function tick() {
      const ph = lines[pi];
      typedTarget.textContent = del ? ph.substring(0, ci - 1) : ph.substring(0, ci + 1);
      ci += del ? -1 : 1;
      let sp = del ? 30 : 65;
      if (!del && ci === ph.length) { sp = 2200; del = true; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % lines.length; sp = 400; }
      setTimeout(tick, sp);
    })();
  }

  /* =========================================================
     5. HOVER-UNDER-CURSOR TRACKER (for stationary mouse during scroll)
     ========================================================= */
  let lastMouseX = -1;
  let lastMouseY = -1;
  let activeCard = null;
  let activeChip = null;
  let activeBtn = null;
  let scrollTimeout = null;
  let scrollTicking = false;
  let dot = null;

  const CARD_SELECTOR = '.ecu-role-card, .skill-module, .project-deployment-card, ' +
    '.education-card, .cert-card, .award-card, .publication-card, ' +
    '.pillar-box, .contact-card-box';

  const CHIP_SELECTOR = '.ecu-chip, .tech-spec-pill, .spec-badge';

  const BTN_SELECTOR = '.btn-automotive-primary, .btn-automotive-secondary, ' +
    '.publication-doi-btn, .cert-link-btn, .btn-resume-nav, .hud-scroll-top, .nav-links-desktop a';

  const INTERACTIVE_TARGETS = 'a, button, .ecu-chip, .spec-badge, .tech-spec-pill, .skill-module, .pillar-box, .cert-card, .award-card, .project-deployment-card, .ecu-role-card, .education-card, .publication-card, .contact-card-box, .hud-scroll-top';

  window.addEventListener('mousemove', e => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Real mouse movement: remove synthetic is-hovered so native :hover seamlessly takes over
    if (activeCard) {
      activeCard.classList.remove('is-hovered');
      activeCard = null;
    }
    if (activeChip) {
      activeChip.classList.remove('is-hovered');
      activeChip = null;
    }
    if (activeBtn) {
      activeBtn.classList.remove('is-hovered');
      activeBtn = null;
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    lastMouseX = -1;
    lastMouseY = -1;
    clearScrollHover();
  });

  function clearScrollHover() {
    if (activeCard) {
      activeCard.classList.remove('is-hovered');
      activeCard.style.transform = '';
      activeCard = null;
    }
    if (activeChip) {
      activeChip.classList.remove('is-hovered');
      activeChip = null;
    }
    if (activeBtn) {
      activeBtn.classList.remove('is-hovered');
      activeBtn = null;
    }
  }

  function updateHoverUnderCursor() {
    if (lastMouseX < 0 || lastMouseY < 0) return;

    const el = document.elementFromPoint(lastMouseX, lastMouseY);
    if (!el) {
      clearScrollHover();
      if (dot) dot.classList.remove('cur-hover');
      return;
    }

    // Custom cursor dot hover state
    if (dot) {
      dot.classList.toggle('cur-hover', !!el.closest(INTERACTIVE_TARGETS));
    }

    // Card hover & 3D tilt
    const targetCard = el.closest(CARD_SELECTOR);
    if (targetCard) {
      if (activeCard && activeCard !== targetCard) {
        activeCard.classList.remove('is-hovered');
        activeCard.style.transform = '';
      }
      targetCard.classList.add('is-hovered');
      activeCard = targetCard;

      if (!isMobile && !prefersReduced) {
        const r = targetCard.getBoundingClientRect();
        const x = lastMouseX - r.left;
        const y = lastMouseY - r.top;
        targetCard.style.setProperty('--mouse-x', x + 'px');
        targetCard.style.setProperty('--mouse-y', y + 'px');
        const ry = ((x / r.width) - 0.5) * 6;
        const rx = ((y / r.height) - 0.5) * -6;
        targetCard.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    } else if (activeCard) {
      activeCard.classList.remove('is-hovered');
      activeCard.style.transform = '';
      activeCard = null;
    }

    // Chip spotlight & hover
    const targetChip = el.closest(CHIP_SELECTOR);
    if (targetChip) {
      if (activeChip && activeChip !== targetChip) {
        activeChip.classList.remove('is-hovered');
      }
      targetChip.classList.add('is-hovered');
      activeChip = targetChip;

      if (!isMobile && !prefersReduced) {
        const r = targetChip.getBoundingClientRect();
        targetChip.style.setProperty('--mouse-x', (lastMouseX - r.left) + 'px');
        targetChip.style.setProperty('--mouse-y', (lastMouseY - r.top) + 'px');
      }
    } else if (activeChip) {
      activeChip.classList.remove('is-hovered');
      activeChip = null;
    }

    // Button / link hover
    const targetBtn = el.closest(BTN_SELECTOR);
    if (targetBtn) {
      if (activeBtn && activeBtn !== targetBtn) {
        activeBtn.classList.remove('is-hovered');
      }
      targetBtn.classList.add('is-hovered');
      activeBtn = targetBtn;
    } else if (activeBtn) {
      activeBtn.classList.remove('is-hovered');
      activeBtn = null;
    }
  }

  // Listen for scrollend to immediately update hover once scroll settle
  if ('onscrollend' in window) {
    window.addEventListener('scrollend', updateHoverUnderCursor, { passive: true });
  }

  /* =========================================================
     6. UNIFIED HIGH-PERFORMANCE SCROLL SYSTEM
        - Header sticky & shadow
        - Scroll-to-top HUD button visibility
        - Scroll reading progress bar
        - Active navigation link detection
        - Live telemetry HUD indicators
        - Hero section parallax
        - Real-time stationary cursor hover update
     ========================================================= */
  const header = document.querySelector('header.cockpit-nav');
  const scrollTopBtn = document.getElementById('hudScrollTop');
  const heroSection = document.querySelector('.hero-cockpit');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links-desktop a[href^="#"]');

  // Scroll progress bar
  const scrollProg = document.createElement('div');
  scrollProg.className = 'scroll-progress';
  document.body.appendChild(scrollProg);

  // Live telemetry HUD element setup
  let hudSec = null;
  let hudScr = null;
  let hudTime = null;

  if (!isMobile && !prefersReduced) {
    const hud = document.createElement('div');
    hud.className = 'telemetry-hud';
    hud.innerHTML = `
      <div class="hud-row"><span class="hud-tag">SECTION</span><span class="hud-val" data-hud="sec">Hero</span></div>
      <div class="hud-row"><span class="hud-tag">PROGRESS</span><span class="hud-val" data-hud="scr">0%</span></div>
      <div class="hud-row"><span class="hud-tag">READING</span><span class="hud-val" data-hud="time">00:00</span></div>
    `;
    document.body.appendChild(hud);

    hudSec = hud.querySelector('[data-hud="sec"]');
    hudScr = hud.querySelector('[data-hud="scr"]');
    hudTime = hud.querySelector('[data-hud="time"]');

    const startTime = Date.now();
    setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      if (hudTime) hudTime.textContent = m + ':' + s;
    }, 1000);
  }

  function handleUnifiedScroll() {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? Math.min(100, Math.max(0, (y / docH) * 100)) : 0;

    // Header sticky styling
    if (header) header.classList.toggle('scrolled', y > 40);

    // Scroll to top button visibility
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 350);

    // Progress bar width
    scrollProg.style.width = progress + '%';

    // Active section tracking
    let curId = 'hero';
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      const h = sec.offsetHeight;
      if (y >= top && y < top + h) curId = sec.getAttribute('id');
    });

    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + curId));

    // Live Telemetry HUD values
    if (hudScr) hudScr.textContent = Math.round(progress) + '%';
    if (hudSec) hudSec.textContent = curId.charAt(0).toUpperCase() + curId.slice(1);

    // Hero parallax fade
    if (heroSection && !prefersReduced && y < 800) {
      heroSection.style.setProperty('--hero-p', Math.min(1, y / 800));
    }

    // Keep hover state synchronized under stationary cursor on scroll
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateHoverUnderCursor();
        scrollTicking = false;
      });
      scrollTicking = true;
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateHoverUnderCursor, 60);
  }

  window.addEventListener('scroll', handleUnifiedScroll, { passive: true });
  handleUnifiedScroll();

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* =========================================================
     7. MOBILE NAVIGATION DRAWER
     ========================================================= */
  const mobileToggle = document.getElementById('mobileNavToggle');
  const navDrawer = document.getElementById('navDrawer');
  if (mobileToggle && navDrawer) {
    mobileToggle.addEventListener('click', () => {
      navDrawer.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    navDrawer.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
      navDrawer.classList.remove('active');
      document.body.classList.remove('menu-open');
    }));
  }

  /* =========================================================
     8. REVEAL ON SCROLL & STAGGER
     ========================================================= */
  document.querySelectorAll('.reveal-stagger').forEach(group => {
    group.querySelectorAll('.reveal-on-scroll').forEach((k, i) => {
      if (i % 5 === 1) k.classList.add('reveal-scale');
      else if (i % 5 === 2) k.classList.add('reveal-left');
      else if (i % 5 === 3) k.classList.add('reveal-right');
      else if (i % 5 === 4) k.classList.add('reveal-rotate');
    });
  });

  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* =========================================================
     9. HERO CHIPS ENTRANCE
     ========================================================= */
  document.querySelectorAll('.hero-telemetry-tags .ecu-chip').forEach((chip, i) => {
    setTimeout(() => chip.classList.add('chip-visible'), 150 + i * 70);
  });

  /* =========================================================
     10. CONTACT CARD STAGGER ENTRANCE
     ========================================================= */
  const contactTerminal = document.querySelector('.contact-grid-cockpit');
  if (contactTerminal) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            contactTerminal.classList.add('stagger-active');
            obs.unobserve(contactTerminal);
          }
        });
      }, { threshold: 0.1 }).observe(contactTerminal);
    } else {
      contactTerminal.classList.add('stagger-active');
    }
  }

  /* =========================================================
     11. CUSTOM CURSOR (Minimal dot with smooth hover tracking)
     ========================================================= */
  if (!isMobile && !prefersReduced) {
    dot = document.createElement('div');
    dot.className = 'cur-dot';
    document.body.appendChild(dot);
    document.body.classList.add('custom-cursor');

    document.addEventListener('mousemove', e => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    });

    document.addEventListener('mouseover', e => {
      if (e.target.closest(INTERACTIVE_TARGETS)) {
        dot.classList.add('cur-hover');
      }
    });

    document.addEventListener('mouseout', e => {
      if (e.target.closest(INTERACTIVE_TARGETS)) {
        dot.classList.remove('cur-hover');
      }
    });
  }

  /* =========================================================
     12. SECTION TITLE SPLIT + GLITCH ANIMATION
     ========================================================= */
  document.querySelectorAll('.section-title').forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-block';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'split-char';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      s.style.transitionDelay = (i * 0.028) + 's';
      wrap.appendChild(s);
    });
    el.appendChild(wrap);
  });

  const splitObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.querySelectorAll('.split-char').forEach(c => c.classList.add('visible'));
        en.target.classList.add('title-glitch');
        setTimeout(() => en.target.classList.remove('title-glitch'), 700);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.section-title').forEach(el => splitObs.observe(el));

  /* =========================================================
     13. 3D TILT + CARD SPOTLIGHT + SIGNAL SWEEP
     ========================================================= */
  if (!isMobile && !prefersReduced) {
    document.querySelectorAll(CARD_SELECTOR).forEach(card => {
      card.classList.add('spotlight-card', 'tilt-card');
      card.insertAdjacentHTML('beforeend', '<span class="signal-sweep" aria-hidden="true"></span>');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
        const ry = ((x / r.width) - 0.5) * 6;
        const rx = ((y / r.height) - 0.5) * -6;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.classList.remove('is-hovered');
        if (activeCard === card) activeCard = null;
      });
    });

    document.querySelectorAll(CHIP_SELECTOR).forEach(chip => {
      chip.classList.add('spotlight-chip');
      chip.addEventListener('mousemove', e => {
        const r = chip.getBoundingClientRect();
        chip.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
        chip.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
      });
      chip.addEventListener('mouseleave', () => {
        chip.classList.remove('is-hovered');
        if (activeChip === chip) activeChip = null;
      });
    });
  } else {
    document.querySelectorAll(CARD_SELECTOR).forEach(card => {
      card.classList.add('spotlight-card');
    });
  }

  /* =========================================================
     14. MAGNETIC BUTTONS + RIPPLE EFFECT
     ========================================================= */
  document.querySelectorAll(
    '.btn-automotive-primary, .btn-automotive-secondary, ' +
    '.publication-doi-btn, .cert-link-btn, .btn-resume-nav'
  ).forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.14}px, ${y * 0.22}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.classList.remove('is-hovered');
      if (activeBtn === btn) activeBtn = null;
    });
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const sz = Math.max(r.width, r.height);
      const rip = document.createElement('span');
      rip.className = 'ripple';
      rip.style.width = rip.style.height = sz + 'px';
      rip.style.left = (e.clientX - r.left - sz / 2) + 'px';
      rip.style.top = (e.clientY - r.top - sz / 2) + 'px';
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 750);
    });
  });

  /* =========================================================
     15. HERO PARTICLES
     ========================================================= */
  if (heroSection && !isMobile && !prefersReduced) {
    setInterval(() => {
      const p = document.createElement('div');
      p.className = 'floating-particle';
      p.style.left = (Math.random() * 90 + 5) + '%';
      p.style.top = (Math.random() * 90 + 5) + '%';
      p.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
      p.style.setProperty('--dy', (-Math.random() * 70 - 30) + 'px');
      p.style.animation = `particleFloat ${2.4 + Math.random() * 2}s ease-out forwards`;
      heroSection.appendChild(p);
      setTimeout(() => p.remove(), 4500);
    }, 550);
  }

  /* =========================================================
     16. EXPERIENCE TIMELINE ACTIVE STATE
     ========================================================= */
  const expTrack = document.querySelector('.experience-track');
  if (expTrack && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) expTrack.classList.add('timeline-active'); });
    }, { threshold: 0.1 }).observe(expTrack);
  }

  /* =========================================================
     17. SKILL LIST STAGGER
     ========================================================= */
  if ('IntersectionObserver' in window) {
    const skillObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('list-visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.skill-module').forEach(m => skillObs.observe(m));
  }

  /* =========================================================
     18. MAGNETIC 3D AVATAR — follows mouse
     ========================================================= */
  const avatarFrame = document.querySelector('.avatar-frame');
  if (avatarFrame && heroSection && !isMobile && !prefersReduced) {
    heroSection.addEventListener('mousemove', e => {
      const r = heroSection.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      avatarFrame.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      const hud = avatarFrame.querySelector('.avatar-hud-overlay');
      if (hud) hud.style.transform = `translate(${x * -12}px, ${y * -12}px)`;
    });
    heroSection.addEventListener('mouseleave', () => { avatarFrame.style.transform = ''; });
  }

  /* =========================================================
     19. DATA FLOW LINES BETWEEN SECTIONS
     ========================================================= */
  if (!prefersReduced) {
    const pageSections = document.querySelectorAll('main > section');
    pageSections.forEach((sec, i) => {
      if (i === pageSections.length - 1) return;
      const line = document.createElement('div');
      line.className = 'data-flow-line';
      line.innerHTML = '<span></span><span></span><span></span>';
      sec.insertAdjacentElement('afterend', line);
    });
  }

  /* =========================================================
     20. ROTATING GREETING BADGE — "Hello" 👋 ⇄ "Welcome" 🤝
     ========================================================= */
  const greetText = document.getElementById('greetText');
  const greetIcon = document.getElementById('greetIcon');
  if (greetText && greetIcon) {
    const greetings = [
      { word: 'Hello',   icon: 'fa-hand-sparkles', motion: 'wave' },
      { word: 'Welcome', icon: 'fa-handshake',     motion: 'none' }
    ];
    let gIdx = 0;

    greetIcon.className = 'fas ' + greetings[0].icon + ' greet-icon';
    greetIcon.setAttribute('data-motion', greetings[0].motion);

    setInterval(() => {
      greetText.classList.add('fade-out');

      setTimeout(() => {
        gIdx = (gIdx + 1) % greetings.length;
        const g = greetings[gIdx];

        greetText.textContent = g.word;
        greetIcon.className = 'fas ' + g.icon + ' greet-icon';
        greetIcon.setAttribute('data-motion', g.motion);

        greetText.classList.remove('fade-out');
        greetText.classList.add('fade-in');

        setTimeout(() => greetText.classList.remove('fade-in'), 380);
      }, 340);
    }, 3400);
  }

});
