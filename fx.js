'use strict';
// Animation de validation de Kalo : flammes qui montent le long de la carte, puis étoiles en feu d'artifice.
// Sons synthétisés en direct (Web Audio) : mèche, flammes, explosions, crépitements.
(() => {
  /* ---------- Audio ---------- */
  let ac = null, master = null, noise = null;
  function audio() {
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
        ac = new C(); master = ac.createGain(); master.gain.value = 0.85;
        const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
        noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  const R = (a, b) => a + Math.random() * (b - a);
  function noiseSrc(t0, dur) { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t0, R(0, 1.5)); s.stop(t0 + dur + 0.05); return s; }
  function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
  function filter(type, f, q = 1) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  function gain(v = 0) { const g = ac.createGain(); g.gain.value = v; return g; }
  // Mèche allumée : grésillement aigu irrégulier + petits claquements
  function fuse(t0, dur) {
    const g = gain(0); chain(noiseSrc(t0, dur), filter('bandpass', 4200, 1.2), filter('highpass', 1800), g, master);
    for (let t = 0; t < dur; t += 0.018) g.gain.setValueAtTime(R(0.03, 0.2) * (t < 0.06 ? t / 0.06 : 1), t0 + t);
    g.gain.setValueAtTime(0.12, t0 + dur); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.15);
    for (let i = 0; i < 26; i++) pop(t0 + R(0, dur), R(0.05, 0.16), R(2500, 7000), 0.006);
  }
  // Flammes : souffle grave qui monte (bruit filtré passe-bas)
  function flames(t0, dur) {
    const lp = filter('lowpass', 300, 0.8), g = gain(0);
    chain(noiseSrc(t0, dur + 0.6), lp, g, master);
    lp.frequency.setValueAtTime(260, t0); lp.frequency.exponentialRampToValueAtTime(1300, t0 + dur); lp.frequency.exponentialRampToValueAtTime(500, t0 + dur + 0.5);
    g.gain.setValueAtTime(0.001, t0); g.gain.exponentialRampToValueAtTime(0.55, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur + 0.55);
    for (let i = 0; i < 14; i++) pop(t0 + R(0.1, dur), R(0.06, 0.18), R(600, 1800), 0.02);
  }
  function pop(t, amp, f, len) {
    const g = gain(0); chain(noiseSrc(t, len + 0.02), filter('bandpass', f, 2.5), g, master);
    g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
  }
  // Explosion de feu d'artifice : boum grave + souffle
  function boom(t0, big = 1) {
    const o = ac.createOscillator(), og = gain(0); o.type = 'sine';
    o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.45);
    chain(o, og, master); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.9 * big, t0 + 0.012); og.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.6);
    o.start(t0); o.stop(t0 + 0.65);
    const lp = filter('lowpass', 2400), g = gain(0); chain(noiseSrc(t0, 1), lp, g, master);
    lp.frequency.setValueAtTime(2600, t0); lp.frequency.exponentialRampToValueAtTime(300, t0 + 0.8);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.7 * big, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.9);
  }
  // Étoiles : crépitements qui retombent + scintillements cristallins
  function sparkle(t0, dur, n = 60) {
    for (let i = 0; i < n; i++) { const t = t0 + dur * Math.pow(Math.random(), 1.6); pop(t, R(0.05, 0.22) * (1 - (t - t0) / dur * 0.7), R(3000, 9000), R(0.008, 0.03)); }
    const notes = [1318.5, 1568, 1760, 2093, 2349.3, 2637, 3136];
    for (let i = 0; i < 12; i++) {
      const t = t0 + R(0.05, dur * 0.8), o = ac.createOscillator(), g = gain(0); o.type = 'sine'; o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      chain(o, g, master); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(R(0.04, 0.09), t + 0.006); g.gain.exponentialRampToValueAtTime(0.0002, t + R(0.25, 0.6));
      o.start(t); o.stop(t + 0.65);
    }
  }

  /* ---------- Visuel (style dessin animé : formes pleines, contour sombre épais) ---------- */
  const CLIMB = 1100; // durée de la montée des flammes (ms)
  const INK = '#2A0C02';
  // Forme de flamme : base arrondie, 3 langues de feu, pointe principale décalée par « w »
  // Grande flamme dessinée à chaque image : aplats rouge / orange / jaune, halo, langues qui ondulent
  function flameEdge(H, W, t, seed, side) {
    const pts = [], N = 22;
    for (let i = 0; i <= N; i++) {
      const v = i / N, base = Math.sqrt(v) * Math.pow(1 - v, 1.15) * 2.75 * W;
      const lick = 1 + 0.22 * Math.sin(t * 0.011 + v * 9 + seed + side * 1.7) + 0.12 * Math.sin(t * 0.023 + v * 17 + seed * 2);
      const tongue = v > 0.35 ? 0.35 * Math.max(0, Math.sin(v * 14 - t * 0.012 + seed + side)) * (1 - v) * W : 0;
      const cx = Math.sin(t * 0.004 + seed) * H * 0.07 * Math.pow(v, 1.4) + Math.sin(t * 0.009 + v * 5 + seed) * H * 0.045 * v;
      pts.push([cx + side * (base * lick + tongue), -v * H]);
    }
    return pts;
  }
  function flameShape(ctx, x, y, H, W, t, seed) {
    const L = flameEdge(H, W, t, seed, -1), Rr = flameEdge(H, W, t, seed, 1).reverse(), P = [...L, ...Rr];
    ctx.beginPath(); ctx.moveTo(x + P[0][0], y + P[0][1]);
    for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; ctx.quadraticCurveTo(x + P[i][0], y + P[i][1], x + mx, y + my); }
    ctx.closePath();
  }
  function drawFlame(ctx, x, y, H, t, seed, alpha = 1) {
    if (H < 2) return;
    const W = H * 0.25;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(255,96,24,.85)'; ctx.shadowBlur = H * 0.32;
    flameShape(ctx, x, y + H * 0.04, H, W, t, seed); ctx.fillStyle = '#E2361A'; ctx.fill();
    ctx.shadowBlur = 0;
    flameShape(ctx, x, y + H * 0.02, H * 0.84, W * 0.8, t * 1.1 + 300, seed + 1.3); ctx.fillStyle = '#FF6A1E'; ctx.fill();
    flameShape(ctx, x, y, H * 0.62, W * 0.7, t * 1.2 + 700, seed + 2.6); ctx.fillStyle = '#FFC93A'; ctx.fill();
    flameShape(ctx, x, y - H * 0.02, H * 0.38, W * 0.55, t * 1.3 + 1100, seed + 3.9); ctx.fillStyle = '#FFF2A6'; ctx.fill();
    ctx.restore();
  }
  // Morceau de flamme détaché (goutte de feu qui s'envole)
  function drawWisp(ctx, x, y, s, rot, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(255,96,24,.8)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-6, 5, -6, -2, -1, -9); ctx.bezierCurveTo(0, -4, 6, -1, 5, 3); ctx.bezierCurveTo(4, 6, 2, 6, 0, 6); ctx.fillStyle = '#E63A1C'; ctx.fill();
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-3, 3, -3, -1, -0.5, -4); ctx.bezierCurveTo(0, -1, 3, 0, 2.5, 2); ctx.fillStyle = '#FFC93A'; ctx.fill();
    ctx.restore();
  }
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const star = col => {
      const s = 52, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
      x.translate(s / 2, s / 2); x.lineJoin = 'round'; x.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 7.5 : 17, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.closePath(); x.fillStyle = col; x.fill(); x.lineWidth = 3.2; x.strokeStyle = INK; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(-4, -5, 2.4, 4, 0.5, 0, 7); x.fill(); return c;
    };
    const dot = col => { const c = document.createElement('canvas'); c.width = c.height = 20; const x = c.getContext('2d'); x.beginPath(); x.arc(10, 10, 7, 0, 7); x.fillStyle = col; x.fill(); x.lineWidth = 2.4; x.strokeStyle = INK; x.stroke(); return c; };
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2EE68A';
    SPR = {
      stars: ['#FFD23F', '#FFFFFF', '#FF9A2E', accent, '#FFE98A', '#7FE9FF'].map(star),
      dots: ['#FFD23F', '#FF9A2E', '#FFFFFF'].map(dot),
    };
    return SPR;
  }
  // Point sur la moitié du contour (du milieu du bas au milieu du haut), côté gauche (-1) ou droit (+1)
  function halfPath(r, rad) {
    const w = r.width, h = r.height, cx = r.left + w / 2, R0 = Math.min(rad, w / 2, h / 2);
    const segs = [w / 2 - R0, Math.PI * R0 / 2, h - 2 * R0, Math.PI * R0 / 2, w / 2 - R0], L = segs.reduce((a, b) => a + b, 0);
    const fn = (u, side) => {
      let d = u * L, i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
      const s = side, b = r.top + h, t = r.top, xl = cx + s * (w / 2);
      if (i === 0) return [cx + s * d, b];
      if (i === 1) { const a = d / R0; return [xl - s * R0 + s * Math.sin(a) * R0, b - R0 + Math.cos(a) * R0]; }
      if (i === 2) return [xl, b - R0 - d];
      if (i === 3) { const a = d / R0; return [xl - s * R0 + s * Math.cos(a) * R0, t + R0 - Math.sin(a) * R0]; }
      return [xl - s * R0 - s * d, t];
    };
    fn.L = L; return fn;
  }
  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  function celebrate(getEl, opts = {}) {
    const sound = opts.sound !== false, anim = opts.anim !== false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (sound && audio()) {
      const t0 = ac.currentTime + 0.03, climb = CLIMB / 1000;
      fuse(t0, climb); flames(t0 + 0.05, climb);
      boom(t0 + climb, 1); sparkle(t0 + climb + 0.05, 1.8, 70);
      boom(t0 + climb + 0.28, 0.6); boom(t0 + climb + 0.55, 0.5); sparkle(t0 + climb + 0.6, 1.4, 35);
    }
    if (!anim || reduce) return;
    const S = sprites(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; };
    size();
    let el = getEl(), rect = el?.getBoundingClientRect();
    if (!rect) { cv.remove(); return; }
    const zoom = on => { const e = getEl(); if (!e) return; e.classList.toggle('fx-zoom', on); };
    zoom(true); setTimeout(() => zoom(false), CLIMB + 450);
    // Une grande flamme par côté, qui monte le long du bord et fusionne au sommet
    const wisps = [], stars = [], sparks = [], start = performance.now();
    const MERGE = 200, BIG = 130, SMALL = 84;
    const bursts = [{ at: CLIMB, dx: 0, dy: 0, n: 60 }, { at: CLIMB + 280, dx: -90, dy: 40, n: 28 }, { at: CLIMB + 550, dx: 90, dy: 30, n: 28 }];
    const burst = (x, y, n) => {
      for (let i = 0; i < n; i++) {
        const a = R(0, Math.PI * 2), sp = R(2.5, 9.5);
        stars.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - R(1.5, 4), rot: R(0, 6.3), vr: R(-0.2, 0.2), s: R(0.4, 0.85), spr: S.stars[i % S.stars.length], pop: 0 });
      }
      for (let i = 0; i < 16; i++) { const a = R(0, Math.PI * 2), sp = R(2, 7); sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: R(300, 550), spr: S.dots[i % 3] }); }
      for (let i = 0; i < 10; i++) { const a = R(0, Math.PI * 2), sp = R(1.5, 4.5); wisps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 0, max: R(350, 650), s: R(1, 1.6), rot: R(-0.6, 0.6) }); }
    };
    const spawnWisp = (x, y, H) => wisps.push({ x: x + R(-H * 0.1, H * 0.1), y: y - H * R(0.7, 0.95), vx: R(-0.6, 0.6), vy: R(-2.2, -1.2), life: 0, max: R(350, 600), s: H / 70 * R(0.8, 1.3), rot: R(-0.5, 0.5) });
    let last = start, wispT = 0;
    const frame = now => {
      const t = now - start, dt = Math.min(40, now - last) / 16.7; last = now;
      const cur = getEl(); if (cur && cur !== el) el = cur; if (el?.isConnected) rect = el.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      const path = halfPath(rect, 26), p = ease(Math.min(1, t / CLIMB));
      const burnOut = t < CLIMB + 150 ? 1 : Math.max(0, 1 - (t - CLIMB - 150) / 450);
      // traînée lumineuse laissée par la flamme
      if (burnOut > 0) for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let k = 0; k <= 48; k++) { const [x, y] = path(p * k / 48, side); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = burnOut;
        ctx.shadowColor = 'rgba(255,96,24,.9)'; ctx.shadowBlur = 12; ctx.strokeStyle = '#FF5A1E'; ctx.lineWidth = 4; ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = '#FFE07A'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
      }
      const cxTop = rect.left + rect.width / 2, yTop = rect.top;
      wispT += dt * 16.7;
      if (t < CLIMB - MERGE) {
        for (const side of [-1, 1]) {
          const [hx, hy] = path(p, side), H = SMALL * Math.min(1, t / 160);
          drawFlame(ctx, hx, hy + 4, H, t, side > 0 ? 0 : 2.1);
          if (wispT > 140) spawnWisp(hx, hy, H);
        }
        if (wispT > 140) wispT = 0;
      } else if (t < CLIMB + 260) {
        // fusion au sommet : une seule grosse flamme qui grandit, puis disparaît dans l'explosion
        const k = Math.min(1, (t - (CLIMB - MERGE)) / MERGE), H = t < CLIMB ? SMALL + (BIG - SMALL) * k : BIG * Math.max(0, 1 - (t - CLIMB) / 260);
        drawFlame(ctx, cxTop, yTop + 4, H, t, 1, t < CLIMB ? 1 : Math.max(0, 1 - (t - CLIMB) / 260));
        if (t < CLIMB && wispT > 90) { spawnWisp(cxTop, yTop, H); wispT = 0; }
      }
      for (const b of bursts) if (!b.done && t >= b.at) { b.done = true; burst(rect.left + rect.width / 2 + b.dx, rect.top + b.dy, b.n); try { navigator.vibrate?.(b.dx ? 12 : 30); } catch (e) { /* ignore */ } }
      // morceaux de flamme qui s'envolent
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i]; w.life += dt * 16.7; if (w.life > w.max) { wisps.splice(i, 1); continue; }
        w.x += w.vx * dt; w.y += w.vy * dt; w.vx += Math.sin(w.life * 0.02) * 0.05; const k = w.life / w.max;
        drawWisp(ctx, w.x, w.y, w.s * (1 - k * 0.7), w.rot, 1 - k * k);
      }
      // étincelles de l'explosion
      for (let i = sparks.length - 1; i >= 0; i--) {
        const f = sparks[i]; f.life += dt * 16.7; if (f.life > f.max) { sparks.splice(i, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 0.12 * dt; const sz = 14 * (1 - f.life / f.max * 0.6);
        ctx.drawImage(f.spr, f.x - sz / 2, f.y - sz / 2, sz, sz);
      }
      // étoiles qui retombent (effet « pop » à l'apparition)
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]; s.vy += 0.2 * dt; s.vx *= Math.pow(0.985, dt); s.vy *= Math.pow(0.992, dt); s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt; s.pop = Math.min(1, s.pop + 0.12 * dt);
        if (s.y > innerHeight + 30) { stars.splice(i, 1); continue; }
        const sz = 52 * s.s * (s.pop < 1 ? 0.4 + s.pop * 0.8 : 1);
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.drawImage(s.spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      }
      if (t > CLIMB + 800 && !wisps.length && !stars.length && !sparks.length) { cv.remove(); window.removeEventListener('resize', size); return; }
      if (t > 9000) { cv.remove(); window.removeEventListener('resize', size); return; }
      requestAnimationFrame(frame);
    };
    window.addEventListener('resize', size);
    requestAnimationFrame(frame);
  }
  window.KaloFX = { celebrate, prime: audio };
})();
