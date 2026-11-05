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
  // Fusée qui monte : sifflement ascendant + souffle
  function whistle(t0, dur = 0.55) {
    const o = ac.createOscillator(), g = gain(0); o.type = 'sine';
    o.frequency.setValueAtTime(R(700, 900), t0); o.frequency.exponentialRampToValueAtTime(R(2200, 2800), t0 + dur);
    chain(o, g, master); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.05); g.gain.setValueAtTime(0.05, t0 + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.05);
    const h = gain(0); chain(noiseSrc(t0, dur), filter('highpass', 3000), h, master);
    h.gain.setValueAtTime(0.0001, t0); h.gain.exponentialRampToValueAtTime(0.12, t0 + 0.04); h.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
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
  const CLIMB = 1300; // durée de la montée des flammes (ms)
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
  let GLOW = null;
  const glow = () => GLOW || (GLOW = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,150,40,.55)'); g.addColorStop(0.45, 'rgba(255,90,20,.28)'); g.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })());
  function drawFlame(ctx, x, y, H, t, seed, alpha = 1) {
    if (H < 2) return;
    const W = H * 0.25;
    ctx.save(); ctx.globalAlpha = alpha;
    const gs = H * 1.5; ctx.drawImage(glow(), x - gs / 2, y - H * 0.45 - gs / 2, gs, gs);
    flameShape(ctx, x, y + H * 0.04, H, W, t, seed); ctx.fillStyle = '#E2361A'; ctx.fill();
    flameShape(ctx, x, y + H * 0.02, H * 0.84, W * 0.8, t * 1.1 + 300, seed + 1.3); ctx.fillStyle = '#FF6A1E'; ctx.fill();
    flameShape(ctx, x, y, H * 0.62, W * 0.7, t * 1.2 + 700, seed + 2.6); ctx.fillStyle = '#FFC93A'; ctx.fill();
    flameShape(ctx, x, y - H * 0.02, H * 0.38, W * 0.55, t * 1.3 + 1100, seed + 3.9); ctx.fillStyle = '#FFF2A6'; ctx.fill();
    ctx.restore();
  }
  // Morceau de flamme détaché (goutte de feu qui s'envole)
  function drawWisp(ctx, x, y, s, rot, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.drawImage(glow(), -12, -14, 24, 24);
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-6, 5, -6, -2, -1, -9); ctx.bezierCurveTo(0, -4, 6, -1, 5, 3); ctx.bezierCurveTo(4, 6, 2, 6, 0, 6); ctx.fillStyle = '#E63A1C'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-3, 3, -3, -1, -0.5, -4); ctx.bezierCurveTo(0, -1, 3, 0, 2.5, 2); ctx.fillStyle = '#FFC93A'; ctx.fill();
    ctx.restore();
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
  const SHOW = [
    { at: 0, fly: 520, dx: 0, dy: 0.2, big: 1.15 },
    { at: 220, fly: 560, dx: -0.28, dy: 0.28, big: 0.8 },
    { at: 420, fly: 540, dx: 0.27, dy: 0.24, big: 0.85 },
    { at: 750, fly: 600, dx: -0.12, dy: 0.12, big: 0.7 },
    { at: 950, fly: 580, dx: 0.15, dy: 0.32, big: 0.75 },
  ];
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; // ease-in-out (cubique)
  const easeOut = x => 1 - Math.pow(1 - x, 3);

  function celebrate(getEl, opts = {}) {
    const sound = opts.sound !== false, anim = opts.anim !== false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const visual = anim && !reduce, snd = sound && audio();
    if (snd) {
      const t0 = ac.currentTime + 0.03, climb = CLIMB / 1000;
      fuse(t0, climb); flames(t0 + 0.05, climb);
      if (!visual) SHOW.forEach(f => { whistle(t0 + (CLIMB + f.at) / 1000, f.fly / 1000); boom(t0 + (CLIMB + f.at + f.fly) / 1000, f.big); sparkle(t0 + (CLIMB + f.at + f.fly) / 1000 + 0.05, 1.6, 40); });
    }
    if (!visual) return;
    const sfx = (fn, ...a) => { if (snd) try { fn(ac.currentTime + 0.01, ...a); } catch (e) { /* ignore */ } };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; };
    size();
    let el = getEl(), rect = el?.getBoundingClientRect();
    if (!rect) { cv.remove(); return; }
    const zoom = on => { const e = getEl(); if (!e) return; e.classList.toggle('fx-zoom', on); };
    zoom(true); setTimeout(() => zoom(false), CLIMB + 450);
    // Une grande flamme par côté, qui monte le long du bord et fusionne au sommet
    const wisps = [], rockets = [], parts = [], flashes = [], start = performance.now();
    const MERGE = 200, BIG = 130, SMALL = 84;
    const PAL = [['#FFD23F', '#FFF4B0'], ['#FF4D6D', '#FFC2CF'], ['#3DD6FF', '#D4F6FF'], [getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2EE68A', '#FFFFFF'], ['#B57BFF', '#EBDDFF'], ['#FF9A2E', '#FFE0B8']];
    const shows = SHOW.map((f, i) => ({ ...f, i, launched: false }));
    const explode = (x, y, f) => {
      const [c1, c2] = PAL[f.i % PAL.length], n = Math.round(70 * f.big), base = R(4.2, 5.4) * (0.75 + f.big * 0.35);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + R(-0.05, 0.05), sp = base * R(0.82, 1.08);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: R(1100, 1700), col: Math.random() < 0.25 ? c2 : c1, tr: [], w: R(1.6, 2.6), glit: Math.random() < 0.45 });
      }
      for (let k = 0; k < 24; k++) { const a = R(0, 6.3), sp = R(0.5, 2.8); parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: R(500, 900), col: c2, tr: [], w: 1.4, glit: true }); }
      flashes.push({ x, y, life: 0, col: c1, r: 70 * f.big });
      sfx(boom, f.big); sfx(sparkle, 1.6, Math.round(45 * f.big));
      try { navigator.vibrate?.(f.big > 0.9 ? 30 : 12); } catch (e) { /* ignore */ }
    };
    const spawnWisp = (x, y, H) => wisps.push({ x: x + R(-H * 0.1, H * 0.1), y: y - H * R(0.7, 0.95), vx: R(-0.6, 0.6), vy: R(-2.2, -1.2), life: 0, max: R(350, 600), s: H / 70 * R(0.8, 1.3), rot: R(-0.5, 0.5) });
    let last = start, wispT = 0;
    const frame = now => {
      const t = now - start, dt = Math.min(40, now - last) / 16.7; last = now;
      const cur = getEl(); if (cur && cur !== el) el = cur; if (el?.isConnected) rect = el.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      const path = halfPath(rect, 26), p = ease(Math.min(1, t / CLIMB));
      const burnOut = t < CLIMB + 150 ? 1 : 1 - easeOut(Math.min(1, (t - CLIMB - 150) / 550));
      // traînée lumineuse laissée par la flamme
      if (burnOut > 0) for (const side of [-1, 1]) {
        ctx.beginPath();
        const n = Math.max(2, Math.ceil(p * path.L / 3));
        for (let k = 0; k <= n; k++) { const [x, y] = path(p * k / n, side); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const a = burnOut * easeOut(Math.min(1, t / 250));
        [[12, 'rgba(255,90,20,.12)'], [7, 'rgba(255,100,25,.28)'], [3.6, 'rgba(255,90,30,.95)'], [1.5, 'rgba(255,230,140,1)']].forEach(([w, c]) => { ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      const cxTop = rect.left + rect.width / 2, yTop = rect.top;
      wispT += dt * 16.7;
      if (t < CLIMB - MERGE) {
        for (const side of [-1, 1]) {
          const [hx, hy] = path(p, side), H = SMALL * easeOut(Math.min(1, t / 220));
          drawFlame(ctx, hx, hy + 4, H, t, side > 0 ? 0 : 2.1);
          if (wispT > 140) spawnWisp(hx, hy, H);
        }
        if (wispT > 140) wispT = 0;
      } else if (t < CLIMB + 260) {
        // fusion au sommet : une seule grosse flamme qui grandit, puis disparaît dans l'explosion
        const k = ease(Math.min(1, (t - (CLIMB - MERGE)) / MERGE)), H = t < CLIMB ? SMALL + (BIG - SMALL) * k : BIG * (1 - easeOut(Math.min(1, (t - CLIMB) / 260)));
        drawFlame(ctx, cxTop, yTop + 4, H, t, 1, t < CLIMB ? 1 : Math.max(0, 1 - (t - CLIMB) / 260));
        if (t < CLIMB && wispT > 90) { spawnWisp(cxTop, yTop, H); wispT = 0; }
      }
      // lancement des fusées depuis le sommet de la carte
      for (const f of shows) if (!f.launched && t >= CLIMB + f.at) {
        f.launched = true;
        const x0 = cxTop, y0 = yTop, tx = Math.max(40, Math.min(innerWidth - 40, innerWidth / 2 + f.dx * innerWidth)), ty = Math.max(70, Math.min(y0 - 90, innerHeight * f.dy));
        rockets.push({ x: x0, y: y0, x0, y0, tx, ty, t0: t, f, tr: [] }); sfx(whistle, f.fly / 1000);
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i], k = Math.min(1, (t - r.t0) / r.f.fly), e = 1 - Math.pow(1 - k, 2.2);
        r.x = r.x0 + (r.tx - r.x0) * e + Math.sin(k * 9) * 3 * (1 - k); r.y = r.y0 + (r.ty - r.y0) * e;
        r.tr.push([r.x, r.y]); if (r.tr.length > 14) r.tr.shift();
        if (Math.random() < 0.7) parts.push({ x: r.x, y: r.y, vx: R(-0.5, 0.5), vy: R(0.4, 1.4), life: 0, max: R(250, 450), col: '#FFB347', tr: [], w: 1.2, glit: true, ember: true });
        if (k >= 1) { rockets.splice(i, 1); explode(r.x, r.y, r.f); }
      }
      // morceaux de flamme qui s'envolent
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i]; w.life += dt * 16.7; if (w.life > w.max) { wisps.splice(i, 1); continue; }
        w.x += w.vx * dt; w.y += w.vy * dt; w.vx += Math.sin(w.life * 0.02) * 0.05; const k = w.life / w.max;
        drawWisp(ctx, w.x, w.y, w.s * (1 - k * 0.7), w.rot, 1 - k * k);
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      // éclairs lumineux des explosions
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]; f.life += dt * 16.7; if (f.life > 260) { flashes.splice(i, 1); continue; }
        const k = f.life / 260, g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.6 + k));
        g.addColorStop(0, `rgba(255,255,240,${0.55 * (1 - k)})`); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + k), 0, 7); ctx.fill();
      }
      // fusées : tête brillante + traînée
      for (const r of rockets) {
        ctx.beginPath(); r.tr.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = 'rgba(255,190,90,.55)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(255,245,200,.9)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#FFF6D0'; ctx.beginPath(); ctx.arc(r.x, r.y, 2.6, 0, 7); ctx.fill();
      }
      // particules des gerbes : traînées qui retombent, scintillement en fin de vie
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]; q.life += dt * 16.7;
        if (q.life > q.max || q.y > innerHeight + 20) { parts.splice(i, 1); continue; }
        q.tr.push([q.x, q.y]); if (q.tr.length > 7) q.tr.shift();
        q.vx *= Math.pow(0.965, dt); q.vy = q.vy * Math.pow(0.965, dt) + 0.075 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        const k = q.life / q.max; let a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        if (q.glit && k > 0.45) a *= Math.random() < 0.5 ? 0.25 : 1;
        if (a <= 0.02) continue;
        ctx.globalAlpha = a; ctx.strokeStyle = q.col;
        if (q.tr.length > 1) { ctx.beginPath(); q.tr.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(q.x, q.y); ctx.lineWidth = q.w; ctx.stroke(); }
        ctx.fillStyle = k < 0.15 ? '#FFFFFF' : q.col; ctx.beginPath(); ctx.arc(q.x, q.y, q.w * 0.9, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (t > CLIMB + 900 && shows.every(f => f.launched) && !rockets.length && !wisps.length && !parts.length && !flashes.length) { cv.remove(); window.removeEventListener('resize', size); return; }
      if (t > 9000) { cv.remove(); window.removeEventListener('resize', size); return; }
      requestAnimationFrame(frame);
    };
    window.addEventListener('resize', size);
    requestAnimationFrame(frame);
  }
  window.KaloFX = { celebrate, prime: audio };
})();
