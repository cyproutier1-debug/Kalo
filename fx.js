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

  /* ---------- Visuel ---------- */
  const CLIMB = 1100; // durée de la montée des flammes (ms)
  function sprite(stops, size = 64) {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
  }
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const star = col => {
      const s = 48, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
      x.translate(s / 2, s / 2); x.shadowColor = col; x.shadowBlur = 10; x.fillStyle = col; x.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 15, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.closePath(); x.fill(); x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(0, 0, 3.2, 0, 7); x.fill(); return c;
    };
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2EE68A';
    SPR = {
      hot: sprite([[0, 'rgba(255,255,235,1)'], [0.25, 'rgba(255,230,120,.95)'], [0.55, 'rgba(255,140,30,.55)'], [1, 'rgba(255,60,0,0)']]),
      mid: sprite([[0, 'rgba(255,200,80,.95)'], [0.4, 'rgba(255,110,20,.6)'], [1, 'rgba(200,30,0,0)']]),
      cool: sprite([[0, 'rgba(255,90,20,.6)'], [0.5, 'rgba(160,20,0,.25)'], [1, 'rgba(60,0,0,0)']]),
      stars: ['#FFD23F', '#FFFFFF', '#FF9A2E', accent, '#FFE98A', '#7FE9FF'].map(star),
      glint: sprite([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,180,.7)'], [1, 'rgba(255,200,80,0)']], 32),
    };
    return SPR;
  }
  // Point sur la moitié du contour (du milieu du bas au milieu du haut), côté gauche (-1) ou droit (+1)
  function halfPath(r, rad) {
    const w = r.width, h = r.height, cx = r.left + w / 2, R0 = Math.min(rad, w / 2, h / 2);
    const segs = [w / 2 - R0, Math.PI * R0 / 2, h - 2 * R0, Math.PI * R0 / 2, w / 2 - R0], L = segs.reduce((a, b) => a + b, 0);
    return (u, side) => {
      let d = u * L, i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
      const s = side, b = r.top + h, t = r.top, xl = cx + s * (w / 2);
      if (i === 0) return [cx + s * d, b];
      if (i === 1) { const a = d / R0; return [xl - s * R0 + s * Math.sin(a) * R0, b - R0 + Math.cos(a) * R0]; }
      if (i === 2) return [xl, b - R0 - d];
      if (i === 3) { const a = d / R0; return [xl - s * R0 + s * Math.cos(a) * R0, t + R0 - Math.sin(a) * R0]; }
      return [xl - s * R0 - s * d, t];
    };
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
    // léger zoom avant de la carte
    const zoom = on => { const e = getEl(); if (!e) return; e.classList.toggle('fx-zoom', on); };
    zoom(true); setTimeout(() => zoom(false), CLIMB + 450);
    const flamesP = [], stars = [], start = performance.now();
    let bursts = [{ at: CLIMB, dx: 0, dy: 0, n: 70, done: false }, { at: CLIMB + 280, dx: -90, dy: 40, n: 34, done: false }, { at: CLIMB + 550, dx: 90, dy: 30, n: 34, done: false }];
    const burst = (x, y, n) => {
      for (let i = 0; i < n; i++) {
        const a = R(0, Math.PI * 2), sp = R(2.5, 9.5);
        stars.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - R(1.5, 4), rot: R(0, 6.3), vr: R(-0.2, 0.2), s: R(0.35, 0.8), spr: S.stars[i % S.stars.length], tw: R(0, 6) });
      }
      for (let i = 0; i < 24; i++) { const a = R(0, Math.PI * 2), sp = R(1, 6); flamesP.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: R(250, 500), s: R(10, 22), glint: true }); }
    };
    let last = start, raf;
    const frame = now => {
      const t = now - start, dt = Math.min(40, now - last) / 16.7; last = now;
      const cur = getEl(); if (cur && cur !== el) el = cur; if (el?.isConnected) rect = el.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      const path = halfPath(rect, 26), p = ease(Math.min(1, t / CLIMB));
      // traînée de feu le long du contour
      if (t < CLIMB + 700) {
        const fade = t < CLIMB ? 1 : 1 - (t - CLIMB) / 700;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          for (let k = 0; k <= 48; k++) { const [x, y] = path(p * k / 48, side); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = `rgba(255,120,20,${0.35 * fade})`; ctx.lineWidth = 9; ctx.stroke();
          ctx.strokeStyle = `rgba(255,210,90,${0.9 * fade})`; ctx.lineWidth = 2.6; ctx.stroke();
          if (t < CLIMB) {
            const [hx, hy] = path(p, side);
            for (let k = 0; k < 5; k++) flamesP.push({ x: hx + R(-4, 4), y: hy + R(-3, 3), vx: R(-0.7, 0.7) - side * 0.4, vy: R(-2.4, -0.8), life: 0, max: R(380, 720), s: R(16, 30) });
            if (Math.random() < 0.6) { const [ex, ey] = path(p * Math.random(), side); flamesP.push({ x: ex, y: ey, vx: R(-0.3, 0.3), vy: R(-1.4, -0.4), life: 0, max: R(300, 600), s: R(8, 16) }); }
          }
        }
      }
      // explosions d'étoiles au sommet
      for (const b of bursts) if (!b.done && t >= b.at) { b.done = true; burst(rect.left + rect.width / 2 + b.dx, rect.top + b.dy, b.n); try { navigator.vibrate?.(b.dx ? 12 : 30); } catch (e) { /* ignore */ } }
      // flammes
      for (let i = flamesP.length - 1; i >= 0; i--) {
        const f = flamesP[i]; f.life += dt * 16.7; if (f.life > f.max) { flamesP.splice(i, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 0.03 * dt; f.vx *= 0.98;
        const k = f.life / f.max, sz = f.s * (1 - k * 0.6);
        ctx.globalAlpha = 1 - k; ctx.drawImage(f.glint ? S.glint : k < 0.3 ? S.hot : k < 0.65 ? S.mid : S.cool, f.x - sz / 2, f.y - sz / 2, sz, sz);
      }
      // étoiles qui retombent
      ctx.globalCompositeOperation = 'source-over';
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]; s.vy += 0.2 * dt; s.vx *= Math.pow(0.985, dt); s.vy *= Math.pow(0.992, dt); s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt; s.tw += 0.25 * dt;
        if (s.y > innerHeight + 30) { stars.splice(i, 1); continue; }
        const sz = 48 * s.s; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(s.tw);
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.drawImage(s.spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (t > CLIMB + 800 && !flamesP.length && !stars.length) { cv.remove(); window.removeEventListener('resize', size); return; }
      if (t > 9000) { cv.remove(); return; }
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(frame);
  }
  window.KaloFX = { celebrate, prime: audio };
})();
