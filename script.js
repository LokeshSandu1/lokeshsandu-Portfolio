/**
 * AUTOMOTIVE TELEMETRY & COCKPIT SCRIPT — v3.1 (No Boot Loader)
 * Lokesh Sandu Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {

  const isMobile = window.innerWidth <= 768;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     HERO LETTER CINEMATIC FLY-IN (fires immediately)
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
     1. CAN OSCILLOSCOPE — reactive to scroll velocity
     ========================================================= */
    /* =========================================================
     1. CAN OSCILLOSCOPE — brighter, scroll-reactive
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

      // Moving "trigger" pulse markers — feel like live scope dots
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
     1b. CIRCUIT TRACES + DATA PACKET FLOW
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

    // Build static circuit path grid
    const NODE_COUNT = 9;
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        connections: []
      });
    }
    // Connect nearby nodes (Manhattan-style route)
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

    // Animated packets travelling along each connection
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

      // Node pads (small squares — like PCB vias)
      nodes.forEach(n => {
        cctx.fillStyle = 'rgba(59, 130, 246, 0.55)';
        cctx.fillRect(n.x - 2.5, n.y - 2.5, 5, 5);
        cctx.strokeStyle = 'rgba(96, 165, 250, 0.9)';
        cctx.lineWidth = 0.8;
        cctx.strokeRect(n.x - 4, n.y - 4, 8, 8);
      });

      // Animated data packets
      packets.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) {
          // Respawn on a random connection
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
     2. TYPEWRITER SUBTITLE
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
     3. METRIC COUNT-UP
     ========================================================= */
  const metricNumbers = document.querySelectorAll('.metric-number[data-target]');
  let metricsCounted = false;
  function countUpMetrics() {
    if (metricsCounted) return;
    metricNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      let cur = 0;
      const inc = Math.ceil(target / 50);
      const t = setInterval(() => {
        cur += inc;
        if (cur >= target) { cur = target; clearInterval(t); el.classList.add('bounce'); }
        el.textContent = cur + suffix;
      }, 30);
    });
    metricsCounted = true;
  }
  const metricsSection = document.querySelector('.metrics-banner');
  if (metricsSection) {
    new IntersectionObserver((e, o) => {
      if (e[0].isIntersecting) { countUpMetrics(); o.unobserve(metricsSection); }
    }, { threshold: 0.3 }).observe(metricsSection);
  }

  /* =========================================================
     4. HEADER + SCROLL TOP + ACTIVE NAV
     ========================================================= */
  const header = document.querySelector('header.cockpit-nav');
  const scrollTopBtn = document.getElementById('hudScrollTop');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', y > 350);
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links-desktop a[href^="#"]');
    let curId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120, h = sec.offsetHeight;
      if (y >= top && y < top + h) curId = sec.getAttribute('id');
    });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + curId));
  }, { passive: true });

  if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* =========================================================
     5. MOBILE MENU
     ========================================================= */
  const mt = document.getElementById('mobileNavToggle');
  const nd = document.getElementById('navDrawer');
  if (mt && nd) {
    mt.addEventListener('click', () => {
      nd.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    nd.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
      nd.classList.remove('active');
      document.body.classList.remove('menu-open');
    }));
  }

  /* =========================================================
     6. REVEAL ON SCROLL
     ========================================================= */
  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(el => ro.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  /* =========================================================
     7. HERO CHIPS
     ========================================================= */
  document.querySelectorAll('.hero-telemetry-tags .ecu-chip').forEach((chip, i) => {
    setTimeout(() => chip.classList.add('chip-visible'), 150 + i * 70);
  });

  /* =========================================================
     8. CONTACT CARD STAGGER
     ========================================================= */
  const contactTerminal = document.querySelector('.contact-grid-cockpit');
  if (contactTerminal && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { contactTerminal.classList.add('stagger-active'); obs.unobserve(contactTerminal); }
      });
    }, { threshold: 0.1 }).observe(contactTerminal);
  } else if (contactTerminal) contactTerminal.classList.add('stagger-active');

  /* =========================================================
     9. SCROLL PROGRESS BAR
     ========================================================= */
  const sp = document.createElement('div');
  sp.className = 'scroll-progress';
  document.body.appendChild(sp);
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    sp.style.width = Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) + '%';
  }, { passive: true });

    /* =========================================================
     10. CUSTOM CURSOR — minimal dot only (no ring)
     ========================================================= */
  if (!isMobile && !prefersReduced) {
    const dot = document.createElement('div');
    dot.className = 'cur-dot';
    document.body.appendChild(dot);
    document.body.classList.add('custom-cursor');

    document.addEventListener('mousemove', e => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    });

    document.querySelectorAll('a, button, .ecu-chip, .spec-badge, .tech-spec-pill, .skill-module, .pillar-box, .cert-card, .award-card, .project-deployment-card, .ecu-role-card, .education-card, .publication-card, .contact-card-box, .hud-scroll-top')
      .forEach(el => {
        el.addEventListener('mouseenter', () => dot.classList.add('cur-hover'));
        el.addEventListener('mouseleave', () => dot.classList.remove('cur-hover'));
      });
  }

  /* =========================================================
     11. SECTION TITLE SPLIT + GLITCH
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
     12. 3D TILT + CARD SPOTLIGHT + SIGNAL SWEEP
         · Big cards → tilt + spotlight + sweep
         · Small chips → soft spotlight glow only (no tilt)
     ========================================================= */
  const CARD_SELECTOR = '.ecu-role-card, .skill-module, .project-deployment-card, ' +
    '.education-card, .cert-card, .award-card, .publication-card, ' +
    '.pillar-box, .contact-card-box';

  const CHIP_SELECTOR = '.ecu-chip, .tech-spec-pill, .spec-badge';

  // ---- Big cards: full treatment ----
  document.querySelectorAll(CARD_SELECTOR).forEach(card => {
    card.classList.add('spotlight-card', 'tilt-card');
    card.insertAdjacentHTML('beforeend', '<span class="signal-sweep" aria-hidden="true"></span>');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
      const ry = ((x / r.width) - 0.5) * 6;
      const rx = ((y / r.height) - 0.5) * -6;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  // ---- Small chips: glow only (no tilt, no sweep) ----
  document.querySelectorAll(CHIP_SELECTOR).forEach(chip => {
    chip.classList.add('spotlight-chip');
    chip.addEventListener('mousemove', e => {
      const r = chip.getBoundingClientRect();
      chip.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
      chip.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
    });
  });

  /* =========================================================
     13. MAGNETIC BUTTONS + RIPPLE
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
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
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
     14. HERO PARTICLES
     ========================================================= */
  const heroSection = document.querySelector('.hero-cockpit');
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
     15. EXPERIENCE TIMELINE
     ========================================================= */
  const expTrack = document.querySelector('.experience-track');
  if (expTrack) {
    new IntersectionObserver((en) => {
      en.forEach(e => { if (e.isIntersecting) expTrack.classList.add('timeline-active'); });
    }, { threshold: 0.1 }).observe(expTrack);
  }

  /* =========================================================
     16. SKILL LIST STAGGER
     ========================================================= */
  const skillObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('list-visible'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.skill-module').forEach(m => skillObs.observe(m));

  /* =========================================================
     17. REVEAL VARIANT AUTO-ASSIGN
     ========================================================= */
  document.querySelectorAll('.reveal-stagger').forEach(group => {
    group.querySelectorAll('.reveal-on-scroll').forEach((k, i) => {
      if (i % 4 === 1) k.classList.add('reveal-scale');
      else if (i % 4 === 2) k.classList.add('reveal-left');
      else if (i % 4 === 3) k.classList.add('reveal-rotate');
    });
  });

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
     19. LIVE TELEMETRY HUD — portfolio-relevant metrics
     ========================================================= */
  if (!isMobile && !prefersReduced) {
    const hud = document.createElement('div');
    hud.className = 'telemetry-hud';
    hud.innerHTML = `
      <div class="hud-row"><span class="hud-tag">SECTION</span><span class="hud-val" data-hud="sec">hero</span></div>
      <div class="hud-row"><span class="hud-tag">PROGRESS</span><span class="hud-val" data-hud="scr">0%</span></div>
      <div class="hud-row"><span class="hud-tag">READING</span><span class="hud-val" data-hud="time">0s</span></div>
    `;
    document.body.appendChild(hud);

    const hudSec  = hud.querySelector('[data-hud="sec"]');
    const hudScr  = hud.querySelector('[data-hud="scr"]');
    const hudTime = hud.querySelector('[data-hud="time"]');

    const startTime = Date.now();
    setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      hudTime.textContent = m + ':' + s;
    }, 1000);

    window.addEventListener('scroll', () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      hudScr.textContent = Math.round((window.scrollY / docH) * 100) + '%';

      const sections = document.querySelectorAll('section[id]');
      let cur = 'hero';
      sections.forEach(sec => {
        const top = sec.offsetTop - 120, h = sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < top + h) cur = sec.getAttribute('id');
      });
      // Capitalize first letter for readability
      hudSec.textContent = cur.charAt(0).toUpperCase() + cur.slice(1);
    }, { passive: true });
  }

  /* =========================================================
     20. DATA FLOW LINES between sections
     ========================================================= */
  if (!prefersReduced) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach((sec, i) => {
      if (i === sections.length - 1) return;
      const line = document.createElement('div');
      line.className = 'data-flow-line';
      line.innerHTML = '<span></span><span></span><span></span>';
      sec.insertAdjacentElement('afterend', line);
    });
  }

  /* =========================================================
     21. HERO PARALLAX FADE on scroll
     ========================================================= */
  if (heroSection && !prefersReduced) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 800) {
        heroSection.style.setProperty('--hero-p', Math.min(1, y / 800));
      }
    }, { passive: true });
  }

  /* =========================================================
     22. ROTATING GREETING BADGE — "Hello" 👋 ⇄ "Welcome" 🤝
     ========================================================= */
  const greetText = document.getElementById('greetText');
  const greetIcon = document.getElementById('greetIcon');
  if (greetText && greetIcon) {
    const greetings = [
      { word: 'Hello',   icon: 'fa-hand-sparkles', motion: 'wave' },
      { word: 'Welcome', icon: 'fa-handshake',     motion: 'none' }
    ];
    let gIdx = 0;

    // Set initial state
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
    }, 3400);   // swaps every ~3.4s
  }


});
