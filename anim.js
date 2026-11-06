'use strict';
// Kalo : animations d'exercices dessinées en direct (motion design original).
// Bonhomme en aplats, vue de profil / face / dos, muscles travaillés en rouge (principal) et orange (secondaires).
(() => {
  const D = Math.PI / 180, sin = a => Math.sin(a * D), cos = a => Math.cos(a * D);
  const C = { body: '#D5DDE8', bodyFar: '#8E9AAC', shade: '#B9C4D2', prim: '#FF3446', sec: '#FF8A3D', steel: '#6B778A', dark: '#2A3342', plate: '#1F2733', rim: '#46526A', cable: '#9AA5B5', pad: '#3A4558', ground: 'rgba(148,163,184,.18)' };
  const L = { torso: 50, neck: 6, head: 11, ua: 28, fa: 26, th: 42, sh: 40, foot: 15 };
  const W = { torso: 23, ua: 10.5, fa: 8.5, th: 15.5, sh: 11, foot: 6.5 };
  const GROUND = 180;

  /* ---------- Géométrie ---------- */
  const at = (p, len, a) => [p[0] + len * sin(a), p[1] + len * cos(a)];
  const angOf = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) / D; // 0 = vers le bas, 90 = vers la droite
  // Cinématique inverse à deux segments : renvoie l'articulation intermédiaire
  function ik(root, target, l1, l2, bend) {
    let d = Math.hypot(target[0] - root[0], target[1] - root[1]); const dir = angOf(root, target);
    d = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01, Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(30 * D))), l1 + l2 - 0.01);
    const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) / D;
    ik.tip = at(root, d, dir); // cible ramenée à une distance atteignable sans dépasser les butées
    return at(root, l1, dir + bend * a);
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  function mix(A, B, k) {
    const o = {};
    for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const a = A[key] ?? B[key], b = B[key] ?? A[key];
      if (Array.isArray(a)) o[key] = a.map((v, i) => lerp(v, b[i], k));
      else if (typeof a === 'number') o[key] = lerp(a, b, k);
      else o[key] = k < 0.5 ? a : b;
    }
    return o;
  }

  /* ---------- Squelette de profil (personnage tourné vers la droite) ---------- */
  function sideJoints(p) {
    const hip = p.hip, t = p.t ?? 180, sh = at(hip, L.torso, t), head = at(sh, L.neck + L.head, t + (p.h || 0));
    const arm = (hand, ua, fa, bend) => { if (hand) { const e = ik(sh, hand, L.ua, L.fa, bend ?? 1); return [e, at(e, L.fa, angOf(e, ik.tip))]; } const e = at(sh, L.ua, ua ?? 0); return [e, at(e, L.fa, fa ?? ua ?? 0)]; };
    const leg = (foot, th, shn, bend, ft, fr) => { let k, a; if (foot) { k = ik(hip, foot, L.th, L.sh, bend ?? -1); a = at(k, L.sh, angOf(k, ik.tip)); } else { k = at(hip, L.th, th ?? 0); a = at(k, L.sh, shn ?? th ?? 0); } const sa = angOf(k, a); let rel = fr ?? (((ft ?? 90) - sa) % 360 + 540) % 360 - 180; rel = Math.max(40, Math.min(128, rel)); return [k, a, at(a, L.foot, sa + rel)]; };
    const [el, ha] = arm(p.hand, p.ua, p.fa, p.ab);
    const [el2, ha2] = p.hand2 || p.ua2 != null ? arm(p.hand2, p.ua2, p.fa2, p.ab2 ?? p.ab) : [el, ha];
    const [kn, an, to] = leg(p.foot, p.th, p.sh, p.lb, p.ft, p.fr);
    const [kn2, an2, to2] = p.foot2 || p.th2 != null ? leg(p.foot2, p.th2, p.sh2, p.lb2 ?? p.lb, p.ft2 ?? p.ft, p.fr2 ?? p.fr) : [kn, an, to];
    return { hip, sh, head, el, ha, el2, ha2, kn, an, to, kn2, an2, to2, t };
  }
  /* ---------- Squelette de face / de dos ---------- */
  function frontJoints(p) {
    const hip = p.hip, sw = 17, hw = 9, ty = L.torso;
    const shR = [hip[0] + sw, hip[1] - ty + 4], shL = [hip[0] - sw, hip[1] - ty + 4], neck = [hip[0], hip[1] - ty], head = [hip[0] + (p.hx || 0), hip[1] - ty - L.neck - L.head + (p.hy || 0)];
    const arm = (s, sign, a, f, hand, bend) => { if (hand) { const tgt = [hip[0] + sign * (hand[0] - hip[0] < 0 && sign > 0 ? hand[0] - hip[0] : Math.abs(hand[0] - hip[0])) , hand[1]]; const tg = sign > 0 ? hand : [2 * hip[0] - hand[0], hand[1]]; const e = ik(s, tg, L.ua, L.fa, bend * sign); return [e, at(e, L.fa, angOf(e, ik.tip))]; } const e = at(s, L.ua, sign * a); return [e, at(e, L.fa, sign * (f ?? a))]; };
    const [elR, haR] = arm(shR, 1, p.a ?? 8, p.f, p.hand, p.ab ?? 1);
    const [elL, haL] = p.aL != null || p.handL ? arm(shL, -1, p.aL ?? p.a ?? 8, p.fL ?? p.f, p.handL, p.ab ?? 1) : arm(shL, -1, p.a ?? 8, p.f, p.hand, p.ab ?? 1);
    const hR = [hip[0] + hw, hip[1]], hL = [hip[0] - hw, hip[1]];
    const leg = (h, sign, l, s, foot, bend) => { if (p.seat) { const k = at(h, L.th * 0.42, sign * (l ?? 22)); return [k, at(k, L.sh, sign * (s ?? 4))]; } if (foot) { const tg = sign > 0 ? foot : [2 * hip[0] - foot[0], foot[1]]; const k = ik(h, tg, L.th, L.sh, (bend ?? 1) * sign); return [k, at(k, L.sh, angOf(k, ik.tip))]; } const k = at(h, L.th, sign * (l ?? 3)); return [k, at(k, L.sh, sign * (s ?? l ?? 3))]; };
    const [knR, anR] = leg(hR, 1, p.l, p.s, p.foot, p.lb);
    const [knL, anL] = p.lL != null ? leg(hL, -1, p.lL, p.sL, null) : leg(hL, -1, p.l, p.s, p.foot, p.lb);
    return { hip, shR, shL, neck, head, elR, haR, elL, haL, hR, hL, knR, anR, knL, anL };
  }

  /* ---------- Dessin ---------- */
  function cap(ctx, a, b, w, col) { if (ctx.is3d) return ctx.cap(a, b, w, col); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function dot(ctx, p, r, col) { if (ctx.is3d) return ctx.dot(p, r, col); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  // Muscle posé sur un segment : côté s (+1 / -1 / 0), portion u0 → u1
  function musc(ctx, a, b, w, s, u0, u1, col, k = 0.62) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = dy / len, ny = -dx / len, off = s * w * 0.2;
    const p = [a[0] + dx * u0 + nx * off, a[1] + dy * u0 + ny * off], q = [a[0] + dx * u1 + nx * off, a[1] + dy * u1 + ny * off];
    cap(ctx, p, q, w * k, col);
  }
  const tone = (m, P, S) => P.has(m) ? C.prim : S.has(m) ? C.sec : null;

  function drawSide(ctx, J, P, S, tm) {
    const far = !P.has('__nofar'), col = (m, farSide) => { const c = tone(m, P, S); return c && farSide ? c + 'B0' : c; };
    // membres du fond
    const legDraw = (kn, an, to, base, farSide) => {
      cap(ctx, J.hip, kn, W.th, base); cap(ctx, kn, an, W.sh, base); cap(ctx, an, to, W.foot, base);
      let c; if ((c = col('quadriceps', farSide))) musc(ctx, J.hip, kn, W.th, 1, 0.18, 0.85, c);
      if ((c = col('ischios', farSide))) musc(ctx, J.hip, kn, W.th, -1, 0.2, 0.85, c);
      if ((c = col('adducteurs', farSide))) musc(ctx, J.hip, kn, W.th, 0, 0.15, 0.55, c, 0.4);
      if ((c = col('mollets', farSide))) musc(ctx, kn, an, W.sh, -1, 0.12, 0.6, c);
    };
    const armDraw = (el, ha, base, farSide) => {
      cap(ctx, J.sh, el, W.ua, base); cap(ctx, el, ha, W.fa, base); dot(ctx, ha, 4.6, base);
      let c; if ((c = col('biceps', farSide))) musc(ctx, J.sh, el, W.ua, 1, 0.2, 0.85, c);
      if ((c = col('triceps', farSide))) musc(ctx, J.sh, el, W.ua, -1, 0.2, 0.85, c);
      if ((c = col('avantbras', farSide))) musc(ctx, el, ha, W.fa, 0, 0.12, 0.75, c, 0.7);
      if ((c = col('epaules', farSide))) dot(ctx, J.sh, 7.2, c);
    };
    if (far) { legDraw(J.kn2, J.an2, J.to2, C.bodyFar, true); armDraw(J.el2, J.ha2, C.bodyFar, true); }
    // tronc + tête
    cap(ctx, J.hip, J.sh, W.torso, C.body); dot(ctx, J.hip, 11.5, C.body);
    const tc = (m, s, u0, u1, k) => { const c = tone(m, P, S); if (c) musc(ctx, J.hip, J.sh, W.torso, s, u0, u1, c, k); };
    tc('pecs', -1, 0.62, 0.9, 0.55); tc('abdos', -1, 0.12, 0.55, 0.5); tc('dos', 1, 0.4, 0.88, 0.55); tc('lombaires', 1, 0.05, 0.38, 0.5); tc('trapezes', 1, 0.86, 1.02, 0.5);
    if (tone('fessiers', P, S)) { const n = [Math.cos(J.t * D), -Math.sin(J.t * D)]; dot(ctx, [J.hip[0] + n[0] * 6.5, J.hip[1] + n[1] * 6.5], 8.5, tone('fessiers', P, S)); }
    if (P.has('cardio')) { const pulse = 1 + 0.18 * Math.max(0, Math.sin(tm * 9)); const c = at(J.hip, L.torso * 0.72, J.t); const n = [-Math.cos(J.t * D) * 3, Math.sin(J.t * D) * 3]; heart(ctx, c[0] + n[0], c[1] + n[1], 5.5 * pulse); }
    cap(ctx, J.sh, at(J.sh, L.neck + 2, J.t), 7, C.body); dot(ctx, J.head, L.head, C.body);
    legDraw(J.kn, J.an, J.to, C.body, false);
    return () => armDraw(J.el, J.ha, C.body, false); // bras proche dessiné après le matériel tenu
  }
  function heart(ctx, x, y, r) { ctx.fillStyle = C.prim; ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); ctx.fill(); }

  const FRONT_M = new Set(['pecs', 'abdos', 'epaules', 'biceps', 'avantbras', 'quadriceps', 'adducteurs', 'trapezes']);
  function drawFront(ctx, J, P, S, back) {
    const col = m => tone(m, P, S);
    // jambes
    for (const [h, k, a] of [[J.hR, J.knR, J.anR], [J.hL, J.knL, J.anL]]) {
      cap(ctx, h, k, W.th, C.body); cap(ctx, k, a, W.sh, C.body); cap(ctx, a, [a[0] + (a[0] > J.hip[0] ? 3 : -3), a[1] + 2], 7, C.body);
      let c; if (!back && (c = col('quadriceps'))) musc(ctx, h, k, W.th, 0, 0.18, 0.85, c, 0.7);
      if ((c = col('adducteurs'))) { const s = h[0] > J.hip[0] ? -1 : 1; musc(ctx, h, k, W.th, s * (back ? -1 : 1) * 1.4, 0.08, 0.55, c, 0.38); }
      if (back && (c = col('ischios'))) musc(ctx, h, k, W.th, 0, 0.2, 0.85, c, 0.7);
      if (back && (c = col('mollets'))) musc(ctx, k, a, W.sh, 0, 0.12, 0.6, c, 0.75);
    }
    // tronc
    ctx.fillStyle = C.body; ctx.beginPath(); ctx.moveTo(J.shL[0] - 6, J.shL[1] - 4); ctx.lineTo(J.shR[0] + 6, J.shR[1] - 4); ctx.lineTo(J.hR[0] + 6, J.hR[1] + 4); ctx.lineTo(J.hL[0] - 6, J.hL[1] + 4); ctx.closePath(); ctx.fill();
    dot(ctx, [J.hip[0], J.hip[1] + 2], 12, C.body);
    let c;
    if (!back) {
      if ((c = col('pecs'))) { dot(ctx, [J.hip[0] - 8, J.shR[1] + 9], 8.5, c); dot(ctx, [J.hip[0] + 8, J.shR[1] + 9], 8.5, c); }
      if ((c = col('abdos'))) { ctx.fillStyle = c; rr(ctx, J.hip[0] - 8, J.shR[1] + 20, 16, 24, 5); }
    } else {
      if ((c = col('dos'))) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(J.shL[0] - 2, J.shL[1] + 5); ctx.lineTo(J.shR[0] + 2, J.shR[1] + 5); ctx.lineTo(J.hip[0] + 8, J.hip[1] - 14); ctx.lineTo(J.hip[0] - 8, J.hip[1] - 14); ctx.closePath(); ctx.fill(); }
      if ((c = col('lombaires'))) { ctx.fillStyle = c; rr(ctx, J.hip[0] - 7, J.hip[1] - 16, 14, 12, 4); }
      if ((c = col('fessiers'))) { dot(ctx, [J.hip[0] - 6, J.hip[1] + 4], 8, c); dot(ctx, [J.hip[0] + 6, J.hip[1] + 4], 8, c); }
    }
    if ((c = col('trapezes'))) { cap(ctx, [J.neck[0] - 9, J.neck[1] + 3], [J.neck[0] + 9, J.neck[1] + 3], 7, c); }
    cap(ctx, J.neck, [J.neck[0], J.neck[1] - 6], 8, C.body); dot(ctx, J.head, L.head, C.body);
    // bras
    for (const [s, e, h] of [[J.shR, J.elR, J.haR], [J.shL, J.elL, J.haL]]) {
      cap(ctx, s, e, W.ua, C.body); cap(ctx, e, h, W.fa, C.body); dot(ctx, h, 4.6, C.body);
      if (!back && (c = col('biceps'))) musc(ctx, s, e, W.ua, 0, 0.22, 0.85, c, 0.7);
      if (back && (c = col('triceps'))) musc(ctx, s, e, W.ua, 0, 0.18, 0.85, c, 0.7);
      if ((c = col('avantbras'))) musc(ctx, e, h, W.fa, 0, 0.12, 0.75, c, 0.7);
      if ((c = col('epaules'))) dot(ctx, s, 7.4, c);
    }
  }
  function rr(ctx, x, y, w, h, r) { if (ctx.is3d) return ctx.rr(x, y, w, h, r); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }

  /* ---------- Matériel ---------- */
  const EQ = {
    bar(ctx, p) { dot(ctx, p, 15, C.plate); ctx.strokeStyle = C.rim; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, 7); ctx.stroke(); dot(ctx, p, 3.5, C.steel); },
    barFront(ctx, a, b) { const y = (a[1] + b[1]) / 2; cap(ctx, [a[0] - 34, y], [b[0] + 34, y], 4, C.steel); for (const x of [a[0] - 30, b[0] + 30]) { ctx.fillStyle = C.plate; rr(ctx, x - 5, y - 15, 10, 30, 3); } },
    db(ctx, p, ang = 0) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang * D); cap(ctx, [-9, 0], [9, 0], 3.5, C.steel); ctx.fillStyle = C.plate; rr(ctx, -13, -7, 6, 14, 2); rr(ctx, 7, -7, 6, 14, 2); ctx.restore(); },
    dbSide(ctx, p) { dot(ctx, p, 8.5, C.plate); ctx.strokeStyle = C.rim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.stroke(); },
    kb(ctx, p) { dot(ctx, [p[0], p[1] + 10], 9, C.plate); ctx.strokeStyle = C.plate; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1] + 2, 5, Math.PI, 0); ctx.stroke(); },
    cable(ctx, from, to) { ctx.strokeStyle = C.cable; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(to[0], to[1]); ctx.stroke(); dot(ctx, from, 5, C.steel); dot(ctx, from, 2, C.dark); dot(ctx, to, 3.2, C.dark); },
    tower(ctx, x, y0 = 20, y1 = GROUND) { cap(ctx, [x, y0], [x, y1], 6, C.pad); },
    bench(ctx, x0, x1, y, legs = true) { ctx.fillStyle = C.pad; rr(ctx, x0, y, x1 - x0, 8, 3); if (legs) { cap(ctx, [x0 + 10, y + 8], [x0 + 10, GROUND], 4, C.steel); cap(ctx, [x1 - 10, y + 8], [x1 - 10, GROUND], 4, C.steel); } },
    pad(ctx, a, b, w = 9) { cap(ctx, a, b, w, C.pad); },
    seat(ctx, x, y, w = 40) { ctx.fillStyle = C.pad; rr(ctx, x - w / 2, y, w, 8, 3); cap(ctx, [x, y + 8], [x, GROUND], 5, C.steel); },
    rails(ctx, x) { cap(ctx, [x - 4, 18], [x - 4, GROUND], 3, C.steel); cap(ctx, [x + 4, 18], [x + 4, GROUND], 3, C.steel); },
    pullbar(ctx, y, x0 = 40, x1 = 160) { cap(ctx, [x0, y], [x1, y], 4, C.steel); },
    box(ctx, x, w, h) { ctx.fillStyle = C.pad; rr(ctx, x, GROUND - h, w, h, 3); },
    handle(ctx, p) { cap(ctx, [p[0], p[1] - 6], [p[0], p[1] + 6], 4, C.dark); },
  };

  // En 3D (anim3d.js), le contexte fournit ses propres versions du matériel
  for (const k of Object.keys(EQ)) { const f = EQ[k]; EQ[k] = (c, ...a) => c.is3d ? c.eq[k]?.(...a) : f(c, ...a); }

  /* ---------- Poses de base ---------- */
  const G = GROUND - 2; // hauteur de la cheville au sol
  const P = (o) => o;
  const pp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  // Gabarits : view ('side' | 'front' | 'back'), A, B (poses), eq(ctx, J, k, opt) matériel derrière, eqF(ctx, J, k, opt) matériel devant, fn(t) pose personnalisée
  const T = {};
  // --- Pectoraux
  T.bench = { view: 'side', A: { hip: [118, 122], t: 270, hand: [86, 62], ab: -1, foot: [146, G], lb: 1 }, B: { hip: [118, 122], t: 270, hand: [86, 98], ab: -1, foot: [146, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.smith) EQ.rails(c, 86); EQ.bench(c, 40, 130, J.hip[1] + 11); }, hold: (c, J, k, o) => o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, J.ha) };
  T.incline = { view: 'side', A: { hip: [120, 120], t: 238, hand: [86, 44], ab: -1, foot: [150, G], lb: 1 }, B: { hip: [120, 120], t: 238, hand: [88, 78], ab: -1, foot: [150, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.smith) EQ.rails(c, 88); EQ.pad(c, [J.hip[0] + 6, J.hip[1] + 10], at([J.hip[0] + 6, J.hip[1] + 10], 62, 238), 9); EQ.seat(c, J.hip[0], J.hip[1] + 11, 30); }, hold: (c, J, k, o) => o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, J.ha) };
  T.decline = { view: 'side', A: { hip: [124, 112], t: 290, hand: [92, 66], ab: -1, th: 125, sh: 20 }, B: { hip: [124, 112], t: 290, hand: [92, 100], ab: -1, th: 125, sh: 20 },
    eq: (c, J) => { EQ.pad(c, [J.hip[0] + 4, J.hip[1] + 11], at([J.hip[0] + 4, J.hip[1] + 11], 70, 289), 9); cap(c, [J.hip[0], J.hip[1] + 14], [J.hip[0], GROUND], 4, C.steel); }, hold: (c, J) => EQ.bar(c, J.ha) };
  T.chestPress = { view: 'side', A: { hip: [82, 128], t: 192, hand: [142, 78], ab: -1, foot: [120, G], lb: 1 }, B: { hip: [82, 128], t: 192, hand: [104, 82], ab: -1, foot: [120, G], lb: 1 },
    eq: (c, J) => { EQ.seat(c, J.hip[0], J.hip[1] + 11, 34); EQ.pad(c, [J.hip[0] - 14, J.hip[1] + 6], [J.hip[0] - 22, J.hip[1] - 52], 9); EQ.tower(c, 172, 40); cap(c, [172, 78], [J.ha[0] + 6, J.ha[1]], 4, C.steel); }, hold: (c, J) => EQ.handle(c, J.ha) };
  T.pushup = { view: 'side', A: { hip: [88, 139], t: 108, hand: [138, G - 2], ab: -1, foot: [10, G - 14], lb: 1, fr: 80 }, B: { hip: [92, 160], t: 94, hand: [138, G - 2], ab: -1, foot: [10, G - 14], lb: 1, fr: 80 } };
  T.dips = { view: 'side', A: { hip: [100, 80], t: 176, hand: [104, 84], ab: -1, th: 20, sh: -60, fr: 95 }, B: { hip: [100, 106], t: 160, hand: [104, 84], ab: -1, th: 30, sh: -55, fr: 95 },
    eq: (c) => { cap(c, [86, 86], [150, 86], 4, C.steel); cap(c, [140, 86], [140, GROUND], 4, C.steel); } };
  T.fly = { view: 'front', A: { hip: [100, 98], a: 82, f: 92 }, B: { hip: [100, 98], a: 20, f: -10 },
    eq: (c, J, k, o) => { if (o.imp === 'cable') { EQ.tower(c, 20, 40); EQ.tower(c, 180, 40); } }, hold: (c, J, k, o) => { if (o.imp === 'cable') { EQ.cable(c, [24, o.low ? 160 : 50], J.haL); EQ.cable(c, [176, o.low ? 160 : 50], J.haR); } else if (o.imp === 'db') { EQ.db(c, J.haR, 90); EQ.db(c, J.haL, 90); } else { EQ.handle(c, J.haR); EQ.handle(c, J.haL); } } };
  T.flyUp = { ...T.fly, A: { hip: [100, 98], a: 40, f: 30 }, B: { hip: [100, 98], a: 150, f: 170 } };
  // --- Dos
  T.pullup = { view: 'back', fit2d: 0.9, A: { hip: [100, 113], a: 168, f: 172, l: 2, s: -4 }, B: { hip: [100, 70], a: 118, f: 190, l: 2, s: -4 }, eq: (c) => EQ.pullbar(c, 14) };
  T.pulldown = { view: 'back', A: { hip: [100, 130], seat: 1, a: 168, f: 170 }, B: { hip: [100, 130], seat: 1, a: 120, f: 196 },
    eq: (c, J) => { EQ.seat(c, 100, J.hip[1] + 11, 44); EQ.tower(c, 100, 4, 24); }, hold: (c, J) => { cap(c, [J.haL[0] - 8, J.haL[1]], [J.haR[0] + 8, J.haR[1]], 4, C.steel); EQ.cable(c, [100, 8], [100, Math.min(J.haL[1], J.haR[1])]); } };
  T.pulldown1 = { ...T.pulldown, A: { hip: [100, 140], seat: 1, a: 168, f: 170, aL: 10, fL: 20 }, B: { hip: [100, 140], seat: 1, a: 115, f: 196, aL: 10, fL: 20 },
    eq: (c) => EQ.tower(c, 108, 4, 20), hold: (c, J) => EQ.cable(c, [108, 8], J.haR) };
  T.row = { view: 'side', A: { hip: [86, 98], t: 118, h: -20, hand: [120, 140], ab: -1, foot: [104, G], lb: 1 }, B: { hip: [86, 98], t: 118, h: -20, hand: [104, 112], ab: -1, foot: [104, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.smith) EQ.rails(c, 122); }, hold: (c, J, k, o) => o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, J.ha) };
  T.row1 = { view: 'side', A: { hip: [70, 98], t: 100, h: -10, hand: [121, 146], ab: -1, foot: [62, G], lb: 1, hand2: [124, 140], ab2: -1, th2: 3, sh2: 270, ft2: 330 }, B: { hip: [70, 98], t: 100, h: -10, hand: [98, 110], ab: -1, foot: [62, G], lb: 1, hand2: [124, 140], th2: 3, sh2: 270, ft2: 330 },
    eq: (c) => EQ.bench(c, 30, 150, 144), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.seatedRow = { view: 'side', A: { hip: [76, 140], t: 166, hand: [140, 116], ab: -1, foot: [140, 168], lb: 1, fr: 95 }, B: { hip: [76, 140], t: 186, hand: [104, 112], ab: -1, foot: [140, 168], lb: 1, fr: 95 },
    eq: (c, J) => { EQ.bench(c, 40, 120, J.hip[1] + 11, false); cap(c, [146, 150], [146, GROUND], 8, C.pad); EQ.tower(c, 176, 90); }, hold: (c, J) => { EQ.cable(c, [172, 116], J.ha); EQ.handle(c, J.ha); } };
  T.straightPull = { view: 'side', A: { hip: [86, 98], t: 168, ua: 160, fa: 165, foot: [96, G], lb: 1 }, B: { hip: [86, 98], t: 172, ua: 30, fa: 30, foot: [96, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.imp !== 'db') EQ.tower(c, 150, 10); }, hold: (c, J, k, o) => { if (o.imp === 'db') EQ.dbSide(c, J.ha); else { EQ.cable(c, [146, 20], J.ha); EQ.handle(c, J.ha); } } };
  T.pullover = { view: 'side', A: { hip: [130, 122], t: 270, hand: [52, 104], ab: -1, foot: [158, G], lb: 1 }, B: { hip: [130, 122], t: 270, hand: [98, 70], ab: -1, foot: [158, G], lb: 1 }, eq: (c, J) => EQ.bench(c, 50, 140, J.hip[1] + 11), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.deadlift = { view: 'side', A: { hip: [86, 128], t: 122, h: -24, hand: [110, 160], ab: 1, foot: [104, G], lb: 1 }, B: { hip: [96, 96], t: 180, hand: [102, 134], ab: 1, foot: [104, G], lb: 1 }, hold: (c, J, k, o) => o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, [J.ha[0], J.ha[1] + 6]) };
  T.rdl = { ...T.deadlift, A: { hip: [86, 100], t: 112, h: -22, hand: [114, 150], ab: 1, foot: [104, G], lb: 1 }, B: { hip: [96, 96], t: 180, hand: [102, 134], ab: 1, foot: [104, G], lb: 1 } };
  T.goodMorning = { view: 'side', A: { hip: [92, 98], t: 180, hand: [86, 50], ab: -1, foot: [104, G], lb: 1 }, B: { hip: [86, 100], t: 104, h: -16, hand: [128, 70], ab: -1, foot: [104, G], lb: 1 }, hold: (c, J) => EQ.bar(c, [J.sh[0] - 2, J.sh[1] - 4]) };
  T.shrug = { view: 'front', fn: (k) => ({ hip: [100, 98], a: 6, f: 4, sy: -7 * k }), hold: (c, J, k, o) => o.imp === 'db' ? (EQ.db(c, J.haR, 90), EQ.db(c, J.haL, 90)) : EQ.barFront(c, J.haL, J.haR) };
  T.facePull = { view: 'side', A: { hip: [80, 96], t: 186, hand: [126, 54], ab: -1, foot: [90, G], lb: 1 }, B: { hip: [80, 96], t: 184, hand: [94, 34], ab: 1, foot: [90, G], lb: 1 }, eq: (c) => EQ.tower(c, 170, 10), hold: (c, J) => EQ.cable(c, [166, 40], J.ha) };
  // --- Épaules
  T.ohp = { view: 'front', A: { hip: [100, 122], seat: 1, a: 98, f: 178 }, B: { hip: [100, 122], seat: 1, a: 160, f: 176 },
    eq: (c, J, k, o) => { if (o.smith) { EQ.rails(c, 40); EQ.rails(c, 160); } if (!o.stand) EQ.seat(c, 100, J.hip[1] + 11, 40); }, hold: (c, J, k, o) => o.imp === 'db' ? (EQ.db(c, J.haR, 0), EQ.db(c, J.haL, 0)) : o.imp === 'machine' ? (EQ.handle(c, J.haR), EQ.handle(c, J.haL)) : EQ.barFront(c, J.haL, J.haR) };
  T.lateral = { view: 'front', A: { hip: [100, 98], a: 10, f: 14 }, B: { hip: [100, 98], a: 88, f: 92 },
    eq: (c, J, k, o) => { if (o.imp === 'cable') EQ.tower(c, 22, 120); }, hold: (c, J, k, o) => { if (o.imp === 'cable') { EQ.cable(c, [26, 168], J.haR); EQ.handle(c, J.haR); } else if (o.imp === 'machine') { EQ.pad(c, J.elR, pp(J.elR, J.shR, 0.4), 8); EQ.pad(c, J.elL, pp(J.elL, J.shL, 0.4), 8); } else { EQ.db(c, J.haR, 90); EQ.db(c, J.haL, 90); } } };
  T.lateral1 = { ...T.lateral, A: { hip: [100, 98], a: 10, f: 14, aL: 4, fL: 4 }, B: { hip: [100, 98], a: 88, f: 92, aL: 4, fL: 4 } };
  T.front = { view: 'side', A: { hip: [90, 98], t: 180, ua: 8, fa: 8, foot: [100, G], lb: 1 }, B: { hip: [90, 98], t: 182, ua: 92, fa: 92, foot: [100, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.imp === 'cable') EQ.tower(c, 40, 120); }, hold: (c, J, k, o) => o.imp === 'cable' ? EQ.cable(c, [44, 170], J.ha) : o.imp === 'plate' ? EQ.bar(c, J.ha) : EQ.dbSide(c, J.ha) };
  T.reverseFly = { view: 'back', A: { hip: [100, 124], seat: 1, a: 20, f: -6 }, B: { hip: [100, 124], seat: 1, a: 88, f: 90 },
    eq: (c, J) => { EQ.seat(c, 100, J.hip[1] + 11, 40); }, hold: (c, J, k, o) => o.imp === 'db' ? (EQ.db(c, J.haR, 90), EQ.db(c, J.haL, 90)) : (EQ.handle(c, J.haR), EQ.handle(c, J.haL)) };
  T.uprightRow = { view: 'front', A: { hip: [100, 98], hand: [108, 124], ab: 1 }, B: { hip: [100, 98], hand: [108, 50], ab: 1 }, hold: (c, J) => EQ.barFront(c, J.haL, J.haR) };
  // --- Bras
  T.curl = { view: 'side', A: { hip: [96, 98], t: 180, ua: 4, fa: 6, foot: [104, G], lb: 1 }, B: { hip: [96, 98], t: 180, ua: 10, fa: 160, foot: [104, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.imp === 'cable') EQ.tower(c, 150, 120); }, hold: (c, J, k, o) => o.imp === 'cable' ? (EQ.cable(c, [146, 172], J.ha), EQ.handle(c, J.ha)) : o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, J.ha) };
  T.curlBayes = { ...T.curl, A: { hip: [100, 98], t: 184, ua: 330, fa: -20, foot: [110, G], lb: 1 }, B: { hip: [100, 98], t: 184, ua: 330, fa: 115, foot: [110, G], lb: 1 }, eq: (c) => EQ.tower(c, 40, 120), hold: (c, J) => { EQ.cable(c, [44, 160], J.ha); EQ.handle(c, J.ha); } };
  T.curlIncline = { view: 'side', A: { hip: [110, 128], t: 225, ua: 2, fa: 4, foot: [142, G], lb: 1 }, B: { hip: [110, 128], t: 225, ua: 2, fa: 150, foot: [142, G], lb: 1 },
    eq: (c, J) => { EQ.pad(c, [J.hip[0] + 6, J.hip[1] + 9], at([J.hip[0] + 6, J.hip[1] + 9], 60, 225), 9); EQ.seat(c, J.hip[0], J.hip[1] + 11, 30); }, hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.preacher = { view: 'side', A: { hip: [82, 130], t: 166, ua: 48, fa: 54, foot: [116, G], lb: 1 }, B: { hip: [82, 130], t: 166, ua: 48, fa: 183, foot: [116, G], lb: 1 },
    eq: (c, J) => { EQ.seat(c, J.hip[0], J.hip[1] + 11, 30); const a = at(at(J.sh, 5, 48), 8, -42), b = at(at(J.sh, 30, 48), 8, -42); EQ.pad(c, a, b, 7); cap(c, at(b, 4, 180), [b[0] - 4, GROUND], 5, C.steel); }, hold: (c, J) => EQ.bar(c, J.ha) };
  T.concentration = { view: 'side', A: { hip: [80, 132], t: 150, h: -20, ua: 15, fa: 15, foot: [112, G], lb: 1 }, B: { hip: [80, 132], t: 150, h: -20, ua: 15, fa: 165, foot: [112, G], lb: 1 }, eq: (c, J) => EQ.seat(c, J.hip[0], J.hip[1] + 11, 34), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.pushdown = { view: 'side', A: { hip: [92, 98], t: 186, ua: 8, fa: 140, foot: [100, G], lb: 1 }, B: { hip: [92, 98], t: 186, ua: 8, fa: 10, foot: [100, G], lb: 1 }, eq: (c) => EQ.tower(c, 140, 10), hold: (c, J, k, o) => { EQ.cable(c, [136, 22], J.ha); if (o.rope) cap(c, J.ha, [J.ha[0] + 2, J.ha[1] + 8], 3, C.dark); else EQ.handle(c, J.ha); } };
  T.overhead = { view: 'side', A: { hip: [92, 98], t: 176, ua: 170, fa: 318, foot: [100, G], lb: 1 }, B: { hip: [92, 98], t: 176, ua: 172, fa: 178, foot: [100, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.imp === 'cable') EQ.tower(c, 30, 120); }, hold: (c, J, k, o) => o.imp === 'cable' ? EQ.cable(c, [34, 172], J.ha) : EQ.dbSide(c, J.ha) };
  T.skull = { view: 'side', A: { hip: [120, 122], t: 270, ua: 172, fa: 178, foot: [148, G], lb: 1 }, B: { hip: [120, 122], t: 270, ua: 168, fa: 290, foot: [148, G], lb: 1 }, eq: (c, J) => EQ.bench(c, 40, 132, J.hip[1] + 11), hold: (c, J, k, o) => o.imp === 'db' ? EQ.dbSide(c, J.ha) : EQ.bar(c, J.ha) };
  T.benchDip = { view: 'side', A: { hip: [70, 104], t: 182, hand: [62, 118], ab: -1, foot: [150, G], lb: 1, ft: 100 }, B: { hip: [70, 134], t: 186, hand: [62, 118], ab: -1, foot: [150, G], lb: 1, ft: 100 }, eq: (c) => EQ.bench(c, 26, 70, 120) };
  T.kickback = { view: 'side', A: { hip: [70, 98], t: 100, h: -10, ua: 280, fa: 0, foot: [62, G], lb: 1, hand2: [124, 140], ab2: -1, th2: 3, sh2: 270, ft2: 330 }, B: { hip: [70, 98], t: 100, h: -10, ua: 280, fa: -80, foot: [62, G], lb: 1, hand2: [124, 140], th2: 3, sh2: 270, ft2: 330 }, eq: (c) => EQ.bench(c, 30, 150, 144), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.wristCurl = { view: 'side', fn: k => ({ hip: [74, 132], t: 150, ua: 2, fa: 92, foot: [116, G], lb: 1, wrist: -30 + 60 * k }),
    eq: (c, J) => EQ.seat(c, J.hip[0], J.hip[1] + 11, 34), hold: (c, J, k, o, p) => EQ.bar(c, at(J.ha, 6, 92 + 90 + (p.wrist || 0))) };
  T.farmer = { view: 'side', loop: true, fn: k => { const s = Math.sin(k * Math.PI * 2); return { hip: [100, 97 + Math.abs(s) * 1.5], t: 180, ua: 2, fa: 2, ua2: 2, fa2: 2, th: 20 * s, sh: 20 * s - 25 * Math.max(0, -s), th2: -20 * s, sh2: -20 * s - 25 * Math.max(0, s) }; }, hold: (c, J) => EQ.dbSide(c, J.ha) };
  // --- Abdos
  T.crunch = { view: 'side', A: { hip: [116, 166], t: 268, hand: [68, 150], ab: -1, foot: [150, G], lb: 1 }, B: { hip: [116, 166], t: 230, h: 20, hand: [86, 120], ab: -1, foot: [150, G], lb: 1 } };
  T.crunchCable = { view: 'side', A: { hip: [74, 131], t: 170, hand: [92, 56], ab: -1, th: 355, sh: 262, fr: 40 }, B: { hip: [74, 131], t: 110, h: 30, hand: [122, 92], ab: -1, th: 355, sh: 262, fr: 40 }, eq: (c) => EQ.tower(c, 150, 10), hold: (c, J) => EQ.cable(c, [146, 22], J.ha) };
  T.crunchMachine = { view: 'side', A: { hip: [88, 128], t: 182, hand: [104, 64], ab: -1, foot: [122, G], lb: 1 }, B: { hip: [88, 128], t: 132, h: 20, hand: [126, 98], ab: -1, foot: [122, G], lb: 1 }, eq: (c, J) => EQ.seat(c, J.hip[0], J.hip[1] + 11, 34), hold: (c, J) => EQ.handle(c, J.ha) };
  T.hangRaise = { view: 'side', fit2d: 0.82, A: { hip: [100, 92], t: 180, hand: [102, -12], ab: -1, th: 6, sh: 0, fr: 70 }, B: { hip: [100, 92], t: 184, hand: [102, -12], ab: -1, th: 100, sh: 20, fr: 60 }, eq: (c) => EQ.pullbar(c, -12) };
  T.legRaise = { view: 'side', A: { hip: [100, 166], t: 270, ua: 80, fa: 90, th: 85, sh: 88, ft: 170 }, B: { hip: [100, 166], t: 270, ua: 80, fa: 90, th: 175, sh: 175, ft: 260 } };
  T.flutter = { view: 'side', loop: true, fn: k => { const s = Math.sin(k * Math.PI * 4); return { hip: [100, 166], t: 270, h: 14, ua: 80, fa: 90, th: 112 + 14 * s, sh: 112 + 14 * s, ft: 190, th2: 112 - 14 * s, sh2: 112 - 14 * s, ft2: 190 }; } };
  T.vup = { view: 'side', A: { hip: [100, 166], t: 270, ua: 270, fa: 270, th: 88, sh: 90, ft: 170 }, B: { hip: [100, 164], t: 216, h: 10, ua: 145, fa: 145, th: 146, sh: 146, ft: 230 } };
  T.plank = { view: 'side', A: { hip: [96, 150], t: 92, ua: 0, fa: 90, foot: [20, G - 14], lb: 1, fr: 80 }, B: { hip: [96, 148], t: 92, ua: 0, fa: 90, foot: [20, G - 14], lb: 1, fr: 80 } };
  T.twist = { view: 'front', loop: true, fn: k => { const s = Math.sin(k * Math.PI * 2); return { hip: [100, 150], seat: 1, hx: 6 * s, hand: [100 + 26 * s + 6, 120], handL: [100 + 26 * s - 6, 120], ab: 1, l: 40, s: 10 }; }, hold: (c, J) => EQ.db(c, [(J.haR[0] + J.haL[0]) / 2, J.haR[1]], 90) };
  T.wheel = { view: 'side', A: { hip: [80, 134], t: 112, h: -20, hand: [130, G - 6], ab: -1, th: 340, sh: 262, fr: 40 }, B: { hip: [102, 152], t: 98, h: -6, hand: [196, G - 6], ab: -1, th: 300, sh: 262, fr: 40 }, hold: (c, J) => { dot(c, [J.ha[0], G - 4], 9, C.plate); dot(c, [J.ha[0], G - 4], 3, C.steel); } };
  T.woodchop = { view: 'front', A: { hip: [100, 98], hand: [148, 40], ab: -1, handL: [140, 50] }, B: { hip: [100, 98], hand: [70, 130], ab: 1, handL: [62, 136] }, eq: (c) => EQ.tower(c, 172, 10), hold: (c, J) => EQ.cable(c, [168, 26], J.haR) };
  T.backExt = { view: 'side', A: { hip: [100, 120], t: 60, h: -10, hand: [94, 140], ab: 1, foot: [46, 150], lb: 1, fr: 95 }, B: { hip: [100, 120], t: 130, h: -10, hand: [108, 86], ab: -1, foot: [46, 150], lb: 1, fr: 95 },
    eq: (c, J) => { EQ.pad(c, [J.hip[0] + 4, J.hip[1] + 10], [J.hip[0] - 14, J.hip[1] + 22], 10); EQ.pad(c, [40, 158], [56, 150], 8); cap(c, [90, 132], [70, GROUND], 4, C.steel); } };
  // --- Jambes
  T.squat = { view: 'side', A: { hip: [96, 96], t: 176, hand: [86, 56], ab: -1, foot: [104, G], lb: 1 }, B: { hip: [76, 136], t: 142, h: -16, hand: [98, 74], ab: -1, foot: [104, G], lb: 1 },
    eq: (c, J, k, o) => { if (o.smith) EQ.rails(c, J.sh[0]); }, hold: (c, J) => EQ.bar(c, [J.sh[0] - 2, J.sh[1] - 4]) };
  T.frontSquat = { ...T.squat, A: { hip: [96, 96], t: 178, hand: [110, 54], ab: -1, foot: [104, G], lb: 1 }, B: { hip: [80, 136], t: 158, hand: [120, 86], ab: -1, foot: [104, G], lb: 1 }, hold: (c, J) => EQ.bar(c, [J.sh[0] + 8, J.sh[1] - 2]) };
  T.goblet = { ...T.squat, A: { hip: [96, 96], t: 178, hand: [112, 66], ab: -1, foot: [104, G], lb: 1 }, B: { hip: [80, 138], t: 162, hand: [118, 98], ab: -1, foot: [104, G], lb: 1 }, hold: (c, J) => EQ.kb(c, [J.ha[0] + 2, J.ha[1] - 10]) };
  T.hack = { view: 'side', A: { hip: [92, 96], t: 196, hand: [80, 50], ab: -1, foot: [118, G], lb: 1 }, B: { hip: [70, 140], t: 196, hand: [58, 94], ab: -1, foot: [118, G], lb: 1 }, eq: (c, J) => { cap(c, [40, GROUND], [118, 20], 5, C.steel); EQ.pad(c, at(J.hip, -8, 196), at(J.sh, 4, 196), 9); } };
  T.legPress = { view: 'side', A: { hip: [70, 150], t: 228, ua: 70, fa: 80, foot: [150, 92], lb: 1, fr: 100 }, B: { hip: [70, 150], t: 228, ua: 70, fa: 80, foot: [116, 112], lb: 1, fr: 100 },
    eq: (c, J) => { EQ.pad(c, [J.hip[0] - 2, J.hip[1] + 11], at([J.hip[0] - 2, J.hip[1] + 11], 60, 228), 9); cap(c, [40, GROUND], [70, 160], 5, C.steel); cap(c, [70, 160], [190, 60], 4, C.steel); }, front: (c, J) => { const b = at(J.an, 5, 130); cap(c, at(b, 8, 40), at(b, 20, 220), 7, C.pad); } };
  T.legPressCalf = { ...T.legPress, A: { hip: [70, 150], t: 228, ua: 70, fa: 80, foot: [150, 92], lb: 1, fr: 100 }, B: { hip: [70, 150], t: 228, ua: 70, fa: 80, foot: [150, 92], lb: 1, fr: 60 } };
  T.legExt = { view: 'side', A: { hip: [84, 126], t: 186, hand: [86, 136], ab: 1, th: 90, sh: 10, ft: 100 }, B: { hip: [84, 126], t: 186, hand: [86, 136], ab: 1, th: 90, sh: 86, ft: 170 }, eq: (c, J) => { EQ.seat(c, J.hip[0], J.hip[1] + 11, 38); EQ.pad(c, [J.hip[0] - 16, J.hip[1] + 4], [J.hip[0] - 20, J.hip[1] - 50], 9); }, front: (c, J) => dot(c, at(J.an, 6, angOf(J.kn, J.an) + 90), 6, C.pad) };
  T.legCurlLying = { view: 'side', A: { hip: [96, 138], t: 92, h: -10, hand: [150, 140], ab: -1, th: 270, sh: 270, fr: 80 }, B: { hip: [96, 138], t: 92, h: -10, hand: [150, 140], ab: -1, th: 270, sh: 160, fr: 70 }, eq: (c, J) => EQ.bench(c, 30, 170, J.hip[1] + 11), front: (c, J) => dot(c, at(J.an, 6, angOf(J.kn, J.an) - 90), 6, C.pad) };
  T.legCurlSeated = { view: 'side', A: { hip: [84, 126], t: 186, hand: [86, 136], ab: 1, th: 90, sh: 84, ft: 170 }, B: { hip: [84, 126], t: 186, hand: [86, 136], ab: 1, th: 90, sh: -15, ft: 80 }, eq: (c, J) => { EQ.seat(c, J.hip[0], J.hip[1] + 11, 38); EQ.pad(c, [J.hip[0] - 16, J.hip[1] + 4], [J.hip[0] - 20, J.hip[1] - 50], 9); }, front: (c, J) => { dot(c, at(J.an, 6, angOf(J.kn, J.an) - 90), 6, C.pad); EQ.pad(c, [J.kn[0] - 20, J.kn[1] - 9], [J.kn[0] + 1, J.kn[1] - 9], 7); } };
  T.lunge = { view: 'side', A: { hip: [96, 96], t: 180, ua: 2, fa: 2, foot: [104, G], lb: 1, foot2: [90, G], lb2: 1, fr2: 92 }, B: { hip: [86, 130], t: 180, ua: 2, fa: 2, foot: [124, G], lb: 1, foot2: [42, G - 15], lb2: 1, fr2: 95 }, hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.bulgarian = { view: 'side', A: { hip: [96, 100], t: 182, ua: 2, fa: 2, foot: [116, G], lb: 1, foot2: [40, 136], lb2: 1, fr2: 40 }, B: { hip: [90, 128], t: 172, ua: 2, fa: 2, foot: [116, G], lb: 1, foot2: [40, 136], lb2: 1, fr2: 40 }, eq: (c) => EQ.bench(c, 14, 54, 140), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.stepUp = { view: 'side', A: { hip: [86, 120], t: 176, ua: 2, fa: 2, foot: [118, 154], lb: 1, foot2: [80, G], lb2: 1, ft2: 90 }, B: { hip: [114, 86], t: 180, ua: 2, fa: 2, foot: [118, 154], lb: 1, foot2: [104, 146], lb2: 1, ft2: 60 }, eq: (c) => EQ.box(c, 100, 56, 24), hold: (c, J) => EQ.dbSide(c, J.ha) };
  T.hipThrust = { view: 'side', A: { hip: [100, 156], t: 255, h: 30, hand: [86, 140], ab: -1, foot: [140, G], lb: 1 }, B: { hip: [104, 120], t: 268, h: 30, hand: [96, 112], ab: -1, foot: [140, G], lb: 1 }, eq: (c) => EQ.bench(c, 20, 60, 128), hold: (c, J) => EQ.bar(c, [J.hip[0], J.hip[1] - 14]) };
  T.bridge = { view: 'side', A: { hip: [100, 170], t: 270, hand: [100, 176], ab: -1, foot: [140, G], lb: 1 }, B: { hip: [104, 144], t: 285, hand: [100, 176], ab: -1, foot: [140, G], lb: 1 } };
  T.glutekick = { view: 'side', A: { hip: [96, 98], t: 168, hand: [140, 70], ab: -1, foot: [100, G], lb: 1, th2: 0, sh2: 4 }, B: { hip: [96, 98], t: 150, hand: [140, 70], ab: -1, foot: [100, G], lb: 1, th2: -22, sh2: -26 }, eq: (c) => EQ.tower(c, 150, 10), hold: (c, J) => EQ.cable(c, [146, 170], J.an2) };
  T.abduction = { view: 'front', A: { hip: [100, 124], seat: 1, a: 12, f: 14, l: 18, s: 4 }, B: { hip: [100, 124], seat: 1, a: 12, f: 14, l: 62, s: 22 }, eq: (c, J) => EQ.seat(c, 100, J.hip[1] + 11, 50), front: (c, J) => { EQ.pad(c, [J.knR[0] + 6, J.knR[1] - 10], [J.knR[0] + 6, J.knR[1] + 10], 7); EQ.pad(c, [J.knL[0] - 6, J.knL[1] - 10], [J.knL[0] - 6, J.knL[1] + 10], 7); } };
  T.adduction = { ...T.abduction, A: { hip: [100, 124], seat: 1, a: 12, f: 14, l: 62, s: 22 }, B: { hip: [100, 124], seat: 1, a: 12, f: 14, l: 18, s: 4 }, front: (c, J) => { EQ.pad(c, [J.knR[0] - 6, J.knR[1] - 10], [J.knR[0] - 6, J.knR[1] + 10], 7); EQ.pad(c, [J.knL[0] + 6, J.knL[1] - 10], [J.knL[0] + 6, J.knL[1] + 10], 7); } };
  T.calf = { view: 'side', fn: k => ({ hip: [96, 96 - 10 * k], t: 180, hand: [88, 54 - 10 * k], ab: -1, foot: [104, G - 10 * k], lb: 1, fr: 90 - 45 * k }), eq: (c) => { c.fillStyle = C.pad; rr(c, 90, G + 1, 40, 6, 2); }, hold: (c, J) => EQ.pad(c, [J.sh[0] - 12, J.sh[1] - 4], [J.sh[0] + 10, J.sh[1] - 4], 8) };
  T.calfSeated = { view: 'side', fn: k => ({ hip: [84, 126], t: 182, hand: [118, 116], ab: -1, th: 90, foot: [126, G - 10 * k], lb: 1, fr: 90 - 45 * k }), eq: (c, J) => EQ.seat(c, J.hip[0], J.hip[1] + 11, 34), front: (c, J) => EQ.pad(c, [J.kn[0] - 10, J.kn[1] - 8], [J.kn[0] + 12, J.kn[1] - 8], 7) };
  // --- Cardio
  T.run = { view: 'side', loop: true, fn: k => { const s = Math.sin(k * Math.PI * 2), c2 = Math.cos(k * Math.PI * 2); return { hip: [100, 98 + Math.abs(c2) * 3], t: 172, ua: -40 * s, fa: -40 * s + 90, ua2: 40 * s, fa2: 40 * s + 90, th: 35 * s, sh: 35 * s - 40 - 30 * Math.max(0, -s), th2: -35 * s, sh2: -35 * s - 40 - 30 * Math.max(0, s) }; }, eq: (c) => { c.fillStyle = C.pad; rr(c, 40, G + 2, 130, 6, 3); } };
  T.walkIncline = { ...T.run, fn: k => { const s = Math.sin(k * Math.PI * 2); return { hip: [100, 96], t: 176, ua: -22 * s, fa: -22 * s + 30, ua2: 22 * s, fa2: 22 * s + 30, th: 22 * s, sh: 22 * s - 10 * Math.max(0, -s), th2: -22 * s, sh2: -22 * s - 10 * Math.max(0, s) }; } };
  T.bike = { view: 'side', loop: true, fn: k => { const a = k * 360, p = [104 + 18 * Math.cos(a * D), 150 + 18 * Math.sin(a * D)], q = [104 - 18 * Math.cos(a * D), 150 - 18 * Math.sin(a * D)]; return { hip: [84, 104], t: 150, hand: [136, 82], ab: -1, foot: p, lb: 1, foot2: q, lb2: 1 }; }, eq: (c) => { EQ.seat(c, 84, 115, 26); cap(c, [104, 150], [140, 80], 4, C.steel); c.strokeStyle = C.steel; c.lineWidth = 3; c.beginPath(); c.arc(104, 150, 22, 0, 7); c.stroke(); } };
  T.rower = { view: 'side', loop: true, fn: k => { const e = (1 - Math.cos(k * Math.PI * 2)) / 2; return { hip: [64 + 40 * (1 - e), 150], t: 200 - 35 * (1 - e), hand: [100 + 50 * (1 - e) - 20 * e, 128 - 6 * e], ab: -1, foot: [150, 158], lb: 1 }; }, eq: (c) => { cap(c, [30, 168], [170, 168], 5, C.steel); cap(c, [158, 150], [158, 170], 6, C.pad); } };
  T.elliptical = { view: 'side', loop: true, fn: k => { const a = k * 360; return { hip: [100, 82], t: 178, hand: [130 + 10 * Math.cos(a * D), 64], ab: -1, hand2: [130 - 10 * Math.cos(a * D), 64], foot: [104 + 22 * Math.cos(a * D), 160 + 8 * Math.sin(a * D)], lb: 1, foot2: [104 - 22 * Math.cos(a * D), 160 - 8 * Math.sin(a * D)], lb2: 1 }; }, eq: (c) => { cap(c, [60, 170], [150, 170], 5, C.steel); cap(c, [150, 170], [140, 60], 4, C.steel); } };
  T.stairs = { view: 'side', loop: true, fn: k => { const s = Math.sin(k * Math.PI * 2); return { hip: [96, 80 - 5 * Math.abs(s)], t: 176, hand: [126, 72], ab: -1, foot: [112, 156 - 14 * Math.max(0, s)], lb: 1, foot2: [112, 156 - 14 * Math.max(0, -s)], lb2: 1 }; }, eq: (c) => { c.fillStyle = C.pad; rr(c, 100, 158, 40, 22, 3); cap(c, [140, 180], [134, 76], 4, C.steel); } };
  T.rope = { view: 'front', loop: true, fn: k => { const j = Math.abs(Math.sin(k * Math.PI * 2)); return { hip: [100, 92 - 12 * j], a: 30, f: 80 }; }, hold: (c, J, k) => { const ry = Math.cos(k * Math.PI * 2); c.strokeStyle = C.cable; c.lineWidth = 2; c.beginPath(); c.moveTo(J.haL[0], J.haL[1]); c.quadraticCurveTo(100, ry > 0 ? 20 : GROUND + 4, J.haR[0], J.haR[1]); c.stroke(); } };

  /* ---------- Exercice → gabarit ---------- */
  const X = {
    'dc-barre': ['bench'], 'dc-halt': ['bench', { imp: 'db' }], 'di-barre': ['incline'], 'di-halt': ['incline', { imp: 'db' }], 'dd-barre': ['decline'], 'dc-smith': ['bench', { smith: 1 }], 'di-smith': ['incline', { smith: 1 }],
    'presse-pec': ['chestPress'], 'ecarte-halt': ['fly', { imp: 'db' }], 'ecarte-poulie': ['fly', { imp: 'cable' }], 'pec-deck': ['fly', { imp: 'machine' }], pompes: ['pushup'], dips: ['dips'], 'ecarte-bas-haut': ['flyUp', { imp: 'cable', low: 1 }],
    tractions: ['pullup'], 'tirage-vert': ['pulldown'], 'tirage-haut-machine': ['pulldown'], 'tirage-unilat-genou': ['pulldown1'], 'tirage-horiz': ['seatedRow'], 'rowing-machine': ['seatedRow'], 'tirage-horiz-unilat': ['seatedRow'],
    'rowing-barre': ['row'], 'rowing-smith': ['row', { smith: 1 }], 'rowing-halt': ['row1'], tbar: ['row'], 'tirage-bras-tendus': ['straightPull'], 'pullover-poulie': ['straightPull'], 'pull-over': ['pullover'], sdt: ['deadlift'], 'shrug-halt': ['shrug', { imp: 'db' }], 'shrug-barre': ['shrug'], 'face-pull': ['facePull'],
    'dm-barre': ['ohp', { seated: false, stand: 1 }], 'de-halt': ['ohp', { imp: 'db' }], 'de-smith': ['ohp', { smith: 1 }], 'de-machine': ['ohp', { imp: 'machine' }], 'elev-lat-halt': ['lateral'], 'elev-lat-poulie': ['lateral1', { imp: 'cable' }], 'elev-lat-machine': ['lateral', { imp: 'machine' }],
    'elev-front': ['front'], 'elev-front-corde': ['front', { imp: 'cable' }], oiseau: ['reverseFly', { imp: 'db' }], 'ecarte-inverse': ['reverseFly'], 'rowing-menton': ['uprightRow'],
    'curl-barre': ['curl'], 'curl-ez': ['curl'], 'curl-halt': ['curl', { imp: 'db' }], 'curl-marteau': ['curl', { imp: 'db' }], 'curl-incline': ['curlIncline'], 'curl-pupitre': ['preacher'], 'curl-poulie': ['curl', { imp: 'cable' }], 'curl-concentre': ['concentration'], 'curl-bayesien': ['curlBayes'],
    'ext-corde': ['pushdown', { rope: 1 }], 'ext-barre-poulie': ['pushdown'], 'barre-front': ['skull'], 'ext-triceps-allonge': ['skull'], 'ext-nuque': ['overhead'], 'ext-tete-poulie': ['overhead', { imp: 'cable' }], 'dips-banc': ['benchDip'], 'dc-serre': ['bench'], kickback: ['kickback'], 'dips-machine': ['dips'],
    'curl-poignets': ['wristCurl'], farmer: ['farmer'],
    crunch: ['crunch'], 'crunch-machine': ['crunchMachine'], 'crunch-poulie': ['crunchCable'], 'releve-jambes': ['hangRaise'], 'releve-jambes-sol': ['legRaise'], gainage: ['plank'], 'russian-twist': ['twist'], roue: ['wheel'], bucheron: ['woodchop'], 'abdos-bras-jambes': ['vup'], battements: ['flutter'],
    'ext-lombaires': ['backExt'], 'good-morning': ['goodMorning'],
    squat: ['squat'], 'squat-smith': ['squat', { smith: 1 }], 'front-squat': ['frontSquat'], goblet: ['goblet'], presse: ['legPress'], 'presse-pieds-hauts': ['legPress'], 'hack-squat': ['hack'], 'leg-ext': ['legExt'], fentes: ['lunge'], bulgare: ['bulgarian'], 'step-up': ['stepUp'],
    'leg-curl-allonge': ['legCurlLying'], 'leg-curl-assis': ['legCurlSeated'], 'sdt-roumain': ['rdl'], 'sdt-jt': ['rdl', { imp: 'db' }], 'sdt-roumain-halt': ['rdl', { imp: 'db' }],
    'hip-thrust': ['hipThrust'], 'pont-fessier': ['bridge'], abducteurs: ['abduction'], 'kickback-fessier': ['glutekick'], adducteurs: ['adduction'],
    'mollets-debout': ['calf'], 'mollets-machine': ['calf'], 'mollets-assis': ['calfSeated'], 'mollets-presse': ['legPressCalf'],
    tapis: ['walkIncline'], velo: ['bike'], rameur: ['rower'], elliptique: ['elliptical'], stairs: ['stairs'], corde: ['rope'],
  };
  const MUSCLE_FALLBACK = { pecs: 'bench', dos: 'pulldown', epaules: 'ohp', trapezes: 'shrug', biceps: 'curl', triceps: 'pushdown', avantbras: 'wristCurl', abdos: 'crunch', lombaires: 'backExt', quadriceps: 'squat', ischios: 'rdl', fessiers: 'hipThrust', adducteurs: 'adduction', mollets: 'calf', cardio: 'run' };
  const exoInfo = id => (window.KALO_EXOS || []).find(e => e[0] === id);
  function resolve(id, info) {
    const m = X[id]; if (m) return { tpl: T[m[0]], opt: m[1] || {} };
    const e = info || exoInfo(id); const eq = e?.[4];
    return { tpl: T[MUSCLE_FALLBACK[e?.[2]] || 'curl'], opt: { imp: eq === 'halteres' ? 'db' : eq === 'poulie' ? 'cable' : eq === 'machine' ? 'machine' : undefined, smith: eq === 'smith' } };
  }

  /* ---------- Rendu ---------- */
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function poseAt(tpl, time) {
    const dur = tpl.dur || 2.6;
    const k = (time % dur) / dur;
    if (tpl.fn) return tpl.fn(tpl.loop ? k : ease(k < 0.5 ? k * 2 : 2 - k * 2));
    // aller (40 %), pause (10 %), retour (40 %), pause (10 %)
    const e = k < 0.4 ? ease(k / 0.4) : k < 0.5 ? 1 : k < 0.9 ? 1 - ease((k - 0.5) / 0.4) : 0;
    return mix(tpl.A, tpl.B, e);
  }
  function render(ctx, id, time, opts = {}) {
    const e = opts.info || exoInfo(id), { tpl, opt } = resolve(id, e);
    const P = new Set([e?.[2]].filter(Boolean)), S = new Set(e?.[3] || []);
    const pose = poseAt(tpl, time);
    if (opt.stand) { pose.seat = 0; pose.hip = [100, 98]; }
    ctx.save();
    ctx.lineJoin = 'round';
    // sol
    ctx.fillStyle = C.ground; ctx.beginPath(); ctx.ellipse(100, GROUND + 3, 72, 5, 0, 0, 7); ctx.fill();
    const k = ((time % (tpl.dur || 2.6)) / (tpl.dur || 2.6));
    if (tpl.fit2d) { ctx.translate(100, GROUND); ctx.scale(tpl.fit2d, tpl.fit2d); ctx.translate(-100, -GROUND); }
    if (tpl.view === 'side') {
      const J = sideJoints(pose);
      tpl.eq?.(ctx, J, k, opt, pose);
      const nearArm = drawSide(ctx, J, P, S, time);
      tpl.front?.(ctx, J, k, opt, pose);
      tpl.hold?.(ctx, J, k, opt, pose);
      nearArm();
    } else {
      const J = frontJoints(pose);
      if (pose.sy) { for (const kk of ['shR', 'shL', 'neck', 'head', 'elR', 'elL', 'haR', 'haL']) J[kk] = [J[kk][0], J[kk][1] + pose.sy]; }
      tpl.eq?.(ctx, J, k, opt, pose);
      drawFront(ctx, J, P, S, tpl.view === 'back');
      tpl.front?.(ctx, J, k, opt, pose);
      tpl.hold?.(ctx, J, k, opt, pose);
    }
    ctx.restore();
  }
  // Lecture en boucle dans un <canvas> (s'arrête quand le canvas quitte la page)
  function play(canvas, id) {
    const dpr = Math.min(3, window.devicePixelRatio || 1), size = () => { const w = canvas.clientWidth || 300; canvas.width = w * dpr; canvas.height = w * dpr; return w; };
    let w = size(); const ctx = canvas.getContext('2d'), t0 = performance.now();
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const frame = now => {
      if (!canvas.isConnected) return;
      if (canvas.clientWidth && Math.abs(canvas.clientWidth - w) > 1) w = size();
      ctx.setTransform(dpr * w / 200, 0, 0, dpr * w / 200, 0, 0); ctx.clearRect(0, 0, 200, 200);
      render(ctx, id, still ? 1.3 : (now - t0) / 1000);
      if (!still) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  // Vignette fixe (pose « effort ») mise en cache
  const cache = {};
  // vignettes 3D pré-rendues (thumbs/*.webp) pour les exercices de base, dessin 2D pour les exercices perso
  const TH3 = new Set('abdos-bras-jambes,abducteurs,adducteurs,barre-front,battements,bucheron,bulgare,corde,crunch,crunch-machine,crunch-poulie,curl-barre,curl-bayesien,curl-concentre,curl-ez,curl-halt,curl-incline,curl-marteau,curl-poignets,curl-poulie,curl-pupitre,dc-barre,dc-halt,dc-serre,dc-smith,dd-barre,de-halt,de-machine,de-smith,di-barre,di-halt,di-smith,dips,dips-banc,dips-machine,dm-barre,ecarte-bas-haut,ecarte-halt,ecarte-inverse,ecarte-poulie,elev-front,elev-front-corde,elev-lat-halt,elev-lat-machine,elev-lat-poulie,elliptique,ext-barre-poulie,ext-corde,ext-lombaires,ext-nuque,ext-tete-poulie,ext-triceps-allonge,face-pull,farmer,fentes,front-squat,gainage,goblet,good-morning,hack-squat,hip-thrust,kickback,kickback-fessier,leg-curl-allonge,leg-curl-assis,leg-ext,mollets-assis,mollets-debout,mollets-machine,mollets-presse,oiseau,pec-deck,pompes,pont-fessier,presse,presse-pec,presse-pieds-hauts,pull-over,pullover-poulie,rameur,releve-jambes,releve-jambes-sol,roue,rowing-barre,rowing-halt,rowing-machine,rowing-menton,rowing-smith,russian-twist,sdt,sdt-jt,sdt-roumain,sdt-roumain-halt,shrug-barre,shrug-halt,squat,squat-smith,stairs,step-up,tapis,tbar,tirage-bras-tendus,tirage-haut-machine,tirage-horiz,tirage-horiz-unilat,tirage-unilat-genou,tirage-vert,tractions,velo'.split(','));
  function thumb(id) {
    if (TH3.has(id)) return 'thumbs/' + id + '.webp';
    if (cache[id]) return cache[id];
    const c = document.createElement('canvas'); c.width = c.height = 120; const ctx = c.getContext('2d');
    ctx.setTransform(120 / 200, 0, 0, 120 / 200, 0, 0);
    const { tpl } = resolve(id); render(ctx, id, tpl.fn ? (tpl.dur || 2.6) * 0.3 : (tpl.dur || 2.6) * 0.45);
    return (cache[id] = c.toDataURL('image/png'));
  }
  window.KaloAnim = { render, play, thumb, has: id => !!X[id] || !!exoInfo(id), templates: T, map: X, _: { T, X, resolve, poseAt, sideJoints, frontJoints, exoInfo, L, C, GROUND, ease } };
})();
