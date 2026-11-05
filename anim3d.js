'use strict';
// Kalo : animations d'exercices en 3D (three.js, licence MIT, chargé à la demande).
// Mannequin musclé original construit en volumes, mêmes mouvements que anim.js (squelettes 2D convertis en 3D),
// muscles travaillés en rouge (principal) / orange (secondaires), ombres, caméra qui tourne + rotation au doigt.
(() => {
  const A = window.KaloAnim; if (!A || !A._) return;
  const { resolve, poseAt, sideJoints, frontJoints, exoInfo, L, C, GROUND, ease } = A._;
  let THREE = null, loading = null;
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } })();
  function load() {
    if (THREE) return Promise.resolve(THREE);
    return loading || (loading = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'vendor/three.min.js'; s.async = true;
      s.onload = () => (THREE = window.THREE) ? res(THREE) : rej(new Error('three'));
      s.onerror = () => { loading = null; rej(new Error('three')); };
      document.head.appendChild(s);
    }));
  }

  /* ---------- Réglages 3D par gabarit ---------- */
  // ky : bras vus de face projetés vers l'avant (1 = plan frontal, 0.1 = plan horizontal, ex. écarté)
  const O3 = {
    fly: { ky: 0.12 }, flyUp: { ky: 0.75 }, reverseFly: { ky: 0.15 }, twist: { ky: 0.45 }, woodchop: { ky: 0.8 }, uprightRow: { ky: 0.9 },
    shrug: { ky: 0.97 },
    // vue de profil : grip = écart des mains (demi-largeur), pole = direction du coude [extérieur, haut, avant] (repère du buste), one = une seule charge tenue à deux mains
    bench: { grip: 31, pole: [1, 0.15, -0.6] }, incline: { grip: 31, pole: [1, 0.15, -0.6] }, decline: { grip: 31, pole: [1, 0.15, -0.6] },
    squat: { grip: 40, pole: [0.5, -1, -0.45], hand: J => [J.sh[0] - 3, J.sh[1] - 3] }, goodMorning: { grip: 40, pole: [0.5, -1, -0.45], hand: J => [J.sh[0] - 3, J.sh[1] - 3] }, calf: { grip: 36, pole: [0.5, -1, -0.45], hand: J => [J.sh[0] - 3, J.sh[1] - 3] }, hack: { grip: 30, pole: [0.6, -1, 0] },
    frontSquat: { grip: 22, pole: [0.25, -0.1, 1], hand: J => [J.sh[0] + 7, J.sh[1] - 1] }, goblet: { grip: 6, one: 1, pole: [1, -1, 0.3] }, pullover: { grip: 5, one: 1 }, overhead: { grip: 5, one: 1, pole: [0.6, 1, 0.3] },
    skull: { grip: 14 }, row: { grip: 26 }, deadlift: { grip: 24 }, rdl: { grip: 24 }, wheel: { grip: 8, one: 1 }, rower: { grip: 12, one: 1 }, seatedRow: { grip: 9 }, pushdown: { grip: 10 },
    facePull: { grip: 14, pole: [1, 0.3, 0] }, crunchCable: { grip: 6, one: 1 }, straightPull: { grip: 18 }, hipThrust: { grip: 30 }, wristCurl: { grip: 20 }, lateral: { ky: 0.96 }, lateral1: { ky: 0.96 }, rope: { ky: 0.7 },
    dips: { eq3: (c, J) => { for (const s of [1, -1]) c.cyl(c.v(s * 24, GROUND - 86, -14), c.v(s * 24, GROUND - 86, 50), 2.2, c.m.steel); c.cyl(c.v(24, GROUND - 86, 40), c.v(24, 0, 40), 2.2, c.m.steel); c.cyl(c.v(-24, GROUND - 86, 40), c.v(-24, 0, 40), 2.2, c.m.steel); } },
  };

  /* ---------- Mannequin ---------- */
  // [forme, position locale, rayons, muscle, rotation Z]  (x local = vers l'extérieur pour les membres)
  function bodySpec(f) {
    const k = f ? 0.84 : 1, mk = f ? 0.78 : 1;
    const torso = [
      ['s', [0, 2, -1], [f ? 16.8 : 15, 10.5, 10.5]],
      ['s', [0, 15, 0], [f ? 11.6 : 13.2, 13.5, f ? 8.6 : 9.4]],
      ['s', [0, 33, -0.5], [f ? 14.6 : 16.5, 15.5, f ? 10 : 11]],
      ['s', [0, 45, -1], [f ? 16.5 : 19, 5.6, f ? 7.8 : 9]],
      ...[1, -1].map(s => f ? ['s', [s * 6.6, 35.5, 7.6], [6.2, 6, 5.6], 'pecs'] : ['s', [s * 7.6, 37.5, 8], [8.4, 6.2, 4.4], 'pecs', s * 0.15]),
      ...[9.5, 16, 22.5].flatMap(y => [1, -1].map(s => ['s', [s * 3.6, y, f ? 7.9 : 8.7], [3.7, 3.2, 1.25 * mk], 'abdos'])),
      ...[1, -1].map(s => ['s', [s * (f ? 9.6 : 10.6), 14, 2.6], [3.4, 8.5, 5.6], 'abdos']),
      ...[1, -1].map(s => ['s', [s * (f ? 10 : 11.6), 31, -5], [6 * mk, 12.5, 3.4], 'dos', s * 0.25]),
      ['s', [0, 35, f ? -8.4 : -9], [9.5, 8.5, 2.6 * mk], 'dos'],
      ...[1, -1].map(s => ['s', [s * 4.2, 13, f ? -7.4 : -7.8], [3.4, 10, 2.3], 'lombaires']),
      ...[1, -1].map(s => ['s', [s * (f ? 7.4 : 6.6), -1, -7.4], f ? [8.4, 8.4, 7] : [7.6, 7.8, 6.4], 'fessiers']),
      ...[1, -1].map(s => ['s', [s * 7, 48.6, -2], [8.5 * mk, 4.6 * mk, 6], 'trapezes', -s * 0.35]),
    ];
    const ua = [['c', 5.6 * k, 4.2 * k, L.ua], ['s', [0, 0, 0], [6 * k, 6 * k, 6 * k]], ['s', [1.5, 4, 0], [6.8 * k, 9 * k, 7 * k], 'epaules'],
      ['s', [0, 13, 2.1 * k], [4.4 * k, 9.5, 3.9 * k], 'biceps'], ['s', [0, 11, -2 * k], [4.8 * k, 10.5, 4.2 * k], 'triceps'], ['s', [0, L.ua, 0], [4.1 * k, 4.1 * k, 4.1 * k]]];
    const fa = [['c', 4.5 * k, 2.9 * k, L.fa], ['s', [0.6, 7.5, 0.3], [4.6 * k, 9.5, 3.9 * k], 'avantbras'], ['s', [0, L.fa + 1.6, 0.4], [3.4 * k, 4.6 * k, 2.7 * k]]];
    const th = [['c', 9.4 * k, 5.6 * k, L.th], ['s', [0, 1, 0], [9.2 * k, 9.4 * k, 9.2 * k]], ['s', [0.8, 19, 2.6 * k], [7.4 * k, 17, 5.6 * k], 'quadriceps'], ['s', [-3.2 * k, 31, 2.6 * k], [4.2 * k, 7.5, 4 * k], 'quadriceps'],
      ['s', [0, 20, -3 * k], [6.4 * k, 15.5, 4.8 * k], 'ischios'], ['s', [-4.4 * k, 11, 0.5], [4.6 * k, 12, 5.4 * k], 'adducteurs'], ['s', [0, L.th, 0.6], [5.3 * k, 5.3 * k, 5.3 * k]]];
    const sh = [['c', 5.3 * k, 3.1 * k, L.sh], ['s', [0, 11.5, -2.6 * k], [5.2 * k, 11.5, 4.6 * k], 'mollets'], ['s', [1.4, 15, 2 * k], [2.6 * k, 11, 2.4 * k]], ['s', [0, L.sh, 0], [3.1 * k, 3.1 * k, 3.1 * k]]];
    const ft = [['s', [0, 5, 0.9], [3.8 * k, 9.4, 3]], ['s', [0, -0.5, 0.8], [3.4 * k, 4, 3.2]]];
    const head = [['c', 6 * k, 5.2 * k, 9], ['s', [0, 13.5, 0.6], [8.4 * k, 10.4 * k, 9.4 * k]], ['s', [0, 9, 3.4], [6.2 * k, 4.8, 5.6 * k]], ...(f ? [['s', [0, 18, -7.5], [5, 5, 5]], ['s', [0, 15, -4], [8.8, 8.5, 7.5]]] : [])];
    return { torso, ua, fa, th, sh, ft, head, SW: f ? 15.5 : 18, HW: f ? 9.4 : 9 };
  }

  /* ---------- Lecteur ---------- */
  async function play(canvas, id, o = {}) {
    if (!webgl) throw new Error('webgl');
    const T3 = await load();
    if (!canvas.isConnected) return;
    const { Vector3: V3, Matrix4, Quaternion, Mesh, Group, MeshStandardMaterial: Std } = T3;
    const info = o.info || exoInfo(id), { tpl, opt } = resolve(id, info);
    const name = Object.keys(A.templates).find(k => A.templates[k] === tpl) || '';
    const o3 = O3[name] || {};
    const P = new Set([info?.[2]].filter(Boolean)), S = new Set(info?.[3] || []);
    const B = bodySpec(o.sex === 'f');

    let renderer;
    try { renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { throw e; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = T3.SRGBColorSpace; renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFShadowMap;
    const scene = new T3.Scene();
    const cam = new T3.PerspectiveCamera(30, 1, 10, 3000);

    // lumières
    scene.add(new T3.HemisphereLight(0xe4ecff, 0x2a3140, 1.25));
    const key = new T3.DirectionalLight(0xffffff, 2.4); key.position.set(160, 320, 220); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 50, far: 900 }); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.6;
    scene.add(key, key.target);
    const rim = new T3.DirectionalLight(0x7fa6ff, 1.5); rim.position.set(-220, 160, -240); scene.add(rim);
    const fill = new T3.DirectionalLight(0xffe2cc, 0.45); fill.position.set(-200, 60, 160); scene.add(fill);

    // sol
    const floor = new Mesh(new T3.CircleGeometry(115, 64), new Std({ color: 0x1c2330, roughness: 0.95, transparent: true, opacity: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.4; scene.add(floor);
    const shadowM = new Mesh(new T3.CircleGeometry(115, 64), new T3.ShadowMaterial({ opacity: 0.38 }));
    shadowM.rotation.x = -Math.PI / 2; shadowM.receiveShadow = true; scene.add(shadowM);
    const ring = new Mesh(new T3.TorusGeometry(115, 0.6, 6, 96), new T3.MeshBasicMaterial({ color: 0x3a4558 })); ring.rotation.x = Math.PI / 2; scene.add(ring);
    if (o.thumb) { ring.visible = false; floor.visible = false; shadowM.material.opacity = 0.3; }

    // matériaux
    const mat = {
      body: new Std({ color: 0xb4bfcf, roughness: 0.55, metalness: 0.05 }),
      prim: new Std({ color: 0xff3446, roughness: 0.42, emissive: 0xff1a33, emissiveIntensity: 0.35 }),
      sec: new Std({ color: 0xff8a3d, roughness: 0.45, emissive: 0xff6a1a, emissiveIntensity: 0.18 }),
      steel: new Std({ color: 0x9aa4b4, roughness: 0.3, metalness: 0.75 }),
      dark: new Std({ color: 0x2a3342, roughness: 0.5, metalness: 0.3 }),
      plate: new Std({ color: 0x1b222d, roughness: 0.55, metalness: 0.25 }),
      rim: new Std({ color: 0x4f5b72, roughness: 0.4, metalness: 0.5 }),
      pad: new Std({ color: 0x3a4558, roughness: 0.85 }),
      cable: new Std({ color: 0xb4bdcb, roughness: 0.4, metalness: 0.4 }),
      heart: new Std({ color: 0xff3446, emissive: 0xff1a33, emissiveIntensity: 0.6, roughness: 0.4 }),
    };
    const colMat = col => col === C.steel ? mat.steel : col === C.dark ? mat.dark : col === C.plate ? mat.plate : col === C.rim ? mat.rim : col === C.pad ? mat.pad : col === C.cable ? mat.cable : col === C.prim ? mat.heart : mat.steel;
    const muscMat = m => !m ? mat.body : P.has(m) ? mat.prim : S.has(m) ? mat.sec : mat.body;

    // géométries partagées
    const gS = new T3.SphereGeometry(1, 28, 18), gC = new T3.CylinderGeometry(1, 1, 1, 20), gB = new T3.BoxGeometry(1, 1, 1), gT = new T3.TorusGeometry(1, 0.09, 10, 40), gT2 = new T3.TorusGeometry(1, 0.2, 10, 28);
    const disposables = [gS, gC, gB, gT, gT2, floor.geometry, shadowM.geometry, ring.geometry, ...Object.values(mat)];
    const build = (spec, mirror) => {
      const g = new Group(); g.matrixAutoUpdate = false;
      for (const [kind, a, b, c, d] of spec) {
        let m;
        if (kind === 'c') { const geo = new T3.CylinderGeometry(b, a, c, 20, 1, true); geo.translate(0, c / 2, 0); disposables.push(geo); m = new Mesh(geo, mat.body); }
        else { m = new Mesh(gS, muscMat(c)); m.position.set(a[0] * (mirror || 1), a[1], a[2]); m.scale.set(b[0], b[1], b[2]); if (d) m.rotation.z = d * (mirror || 1); }
        m.castShadow = true; g.add(m);
      }
      scene.add(g); return g;
    };
    const bones = {
      torso: build(B.torso), head: build(B.head),
      uaR: build(B.ua), uaL: build(B.ua), faR: build(B.fa), faL: build(B.fa), thR: build(B.th), thL: build(B.th), shR: build(B.sh), shL: build(B.sh), ftR: build(B.ft), ftL: build(B.ft),
    };
    let heart = null;
    if (P.has('cardio')) {
      heart = new Group(); const h1 = new Mesh(gS, mat.heart), h2 = new Mesh(gS, mat.heart), h3 = new Mesh(new T3.CylinderGeometry(0.01, 1, 1.4, 20), mat.heart);
      h1.position.set(-0.55, 0.25, 0); h2.position.set(0.55, 0.25, 0); h1.scale.setScalar(0.72); h2.scale.setScalar(0.72); h3.position.set(0, -0.55, 0); h3.rotation.z = Math.PI; h3.scale.set(1.25, 1, 0.62);
      h1.scale.z = h2.scale.z = 0.55; heart.add(h1, h2, h3); scene.add(heart); disposables.push(h3.geometry);
    }

    /* ---------- Squelette 3D ---------- */
    const v = (x, y, z) => new V3(x, y, z);
    const side = tpl.view === 'side';
    const SM = (p, lat = 0) => v(lat, GROUND - p[1], p[0] - 100);
    const SD = (dx, dy) => v(0, -dy, dx);
    const FM = (p, z = 0) => v(p[0] - 100, GROUND - 2 - p[1], z);
    const ky = o3.ky ?? 1;
    const squash = (dx, dy, len) => { const y = dy * ky, z = Math.sqrt(Math.max(0, len * len - dx * dx - y * y)); return v(dx, -y, ky < 1 ? z : 0); };

    function ik3(S0, H, l1, l2, pole) {
      const d = H.clone().sub(S0), n = d.length() || 1, len = Math.min(Math.max(n, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
      d.divideScalar(n);
      const ca = (l1 * l1 + len * len - l2 * l2) / (2 * l1 * len), a = Math.acos(Math.max(-1, Math.min(1, ca)));
      const perp = pole.clone().addScaledVector(d, -pole.dot(d)); if (perp.lengthSq() < 1e-6) perp.set(0, -1, 0).addScaledVector(d, d.y); perp.normalize();
      return [S0.clone().addScaledVector(d, Math.cos(a) * l1).addScaledVector(perp, Math.sin(a) * l1), S0.clone().addScaledVector(d, len)];
    }
    function skeleton(time) {
      const pose = poseAt(tpl, time);
      if (opt.stand) { pose.seat = 0; pose.hip = [100, 98]; }
      const R = {}; let J;
      if (side) {
        J = sideJoints(pose);
        const u = SD(J.sh[0] - J.hip[0], J.sh[1] - J.hip[1]).normalize(), f = v(0, -u.z, u.y), r = new V3().crossVectors(u, f);
        const hip = SM(J.hip);
        Object.assign(R, { J, u, f, r, hip, sym: J.ha2 === J.ha, symL: J.an2 === J.an });
        R.shC = hip.clone().addScaledVector(u, 48);
        const sh = s => R.shC.clone().addScaledVector(r, s * B.SW);
        const grip = (o3.grip ?? B.SW + 5) - B.SW;
        const arm = (s, el, ha) => {
          if (o3.hand) ha = o3.hand(J);
          const S0 = sh(s), H = S0.clone().add(SD(ha[0] - J.sh[0], ha[1] - J.sh[1])).addScaledVector(r, s * grip);
          const pole = o3.pole ? r.clone().multiplyScalar(s * o3.pole[0]).addScaledVector(u, o3.pole[1]).addScaledVector(f, o3.pole[2]) : SD(el[0] - J.sh[0], el[1] - J.sh[1]).addScaledVector(r, s * 3);
          const [E, H2] = ik3(S0, H, L.ua, L.fa, pole); return [S0, E, H2];
        };
        [R.shR, R.elR, R.haR] = arm(1, J.el, J.ha); [R.shL, R.elL, R.haL] = arm(-1, J.el2, J.ha2);
        const leg = (s, kn, an, to) => { const H0 = hip.clone().addScaledVector(r, s * B.HW), K = H0.clone().add(SD(kn[0] - J.hip[0], kn[1] - J.hip[1])).addScaledVector(r, s * 1), An = H0.clone().add(SD(an[0] - J.hip[0], an[1] - J.hip[1])).addScaledVector(r, s * 2), To = An.clone().add(SD(to[0] - an[0], to[1] - an[1])).addScaledVector(r, s * 1.5); return [H0, K, An, To]; };
        [R.hR, R.knR, R.anR, R.toR] = leg(1, J.kn, J.an, J.to); [R.hL, R.knL, R.anL, R.toL] = leg(-1, J.kn2, J.an2, J.to2);
        R.head = SM(J.head);
        // avant des segments (côté biceps / quadriceps) : normale 2D du segment
        R.front = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return v(0, dx / l, dy / l); };
        R.fr = { uaR: R.front(J.sh, J.el), faR: R.front(J.el, J.ha), uaL: R.front(J.sh, J.el2), faL: R.front(J.el2, J.ha2), thR: R.front(J.hip, J.kn), shR: R.front(J.kn, J.an), thL: R.front(J.hip, J.kn2), shL: R.front(J.kn2, J.an2) };
      } else {
        J = frontJoints(pose);
        const sy = pose.sy ? -pose.sy : 0;
        const u = v(0, 1, 0), f = v(0, 0, 1), r = v(1, 0, 0), hip = FM(J.hip);
        Object.assign(R, { J, u, f, r, hip, sym: false, symL: false });
        R.shC = hip.clone().addScaledVector(u, 48);
        const arm = (s, sh2, el2, ha2) => { const S0 = R.shC.clone().add(v(s * B.SW, sy, 0)), E = S0.clone().add(squash(el2[0] - sh2[0], el2[1] - sh2[1], L.ua)), H = E.clone().add(squash(ha2[0] - el2[0], ha2[1] - el2[1], L.fa)); return [S0, E, H]; };
        [R.shR, R.elR, R.haR] = arm(1, J.shR, J.elR, J.haR); [R.shL, R.elL, R.haL] = arm(-1, J.shL, J.elL, J.haL);
        const leg = (s, h2, k2, a2) => {
          const H0 = hip.clone().add(v(s * B.HW, 0, 0)), dx = k2[0] - h2[0], dy = k2[1] - h2[1];
          let K, An;
          if (pose.seat) {
            const drop = Math.max(0, dy), K0 = H0.clone().add(v(dx, -drop, Math.sqrt(Math.max(0, L.th * L.th - dx * dx - drop * drop))));
            K = K0; const sdx = a2[0] - k2[0], down = Math.min(L.sh - 0.5, Math.max(0, K.y - 2)); An = K.clone().add(v(sdx, -down, Math.sqrt(Math.max(0, L.sh * L.sh - sdx * sdx - down * down))));
          } else {
            K = H0.clone().add(v(dx, -dy, Math.sqrt(Math.max(0, L.th * L.th - dx * dx - dy * dy))));
            const sdx = a2[0] - k2[0], sdy = a2[1] - k2[1]; An = K.clone().add(v(sdx, -sdy, Math.sqrt(Math.max(0, L.sh * L.sh - sdx * sdx - sdy * sdy)) * 0));
          }
          return [H0, K, An, An.clone().add(v(s * 3, -1.2, 14.6))];
        };
        [R.hR, R.knR, R.anR, R.toR] = leg(1, J.hR, J.knR, J.anR); [R.hL, R.knL, R.anL, R.toL] = leg(-1, J.hL, J.knL, J.anL);
        R.head = FM(J.head).add(v(0, 0, 0));
        const fz = (a, b) => { const d = b.clone().sub(a).normalize(), z = v(0, 0, 1).addScaledVector(d, -d.z); return z.lengthSq() > 0.05 ? z.normalize() : v(0, 1, 0); };
        R.fr = { uaR: fz(R.shR, R.elR), faR: fz(R.elR, R.haR), uaL: fz(R.shL, R.elL), faL: fz(R.elL, R.haL), thR: fz(R.hR, R.knR), shR: fz(R.knR, R.anR), thL: fz(R.hL, R.knL), shL: fz(R.knL, R.anL) };
        // pieds : dessus du pied vers le haut
      }
      R.neck = R.shC.clone().addScaledVector(R.u, 1.5).addScaledVector(R.f, -1);
      R.pose = pose;
      return R;
    }

    const X = new V3(), Y = new V3(), Z = new V3(), M4 = new Matrix4();
    function place(g, origin, yDir, zHint, mirror) {
      Y.copy(yDir).normalize();
      Z.copy(zHint).addScaledVector(Y, -zHint.dot(Y)); if (Z.lengthSq() < 1e-4) Z.set(0, 0, 1).addScaledVector(Y, -Y.z); Z.normalize();
      if (mirror === 0) X.crossVectors(Y, Z); else { X.crossVectors(Z, Y); if (mirror < 0) X.negate(); }
      g.matrix.makeBasis(X, Y, Z).setPosition(origin); g.matrixWorldNeedsUpdate = true;
    }
    function pose3(R) {
      place(bones.torso, R.hip, R.u, R.f, 0);
      place(bones.head, R.neck, R.head.clone().sub(R.neck), R.f, 0);
      for (const s of ['R', 'L']) {
        const m = s === 'R' ? 1 : -1;
        place(bones['ua' + s], R['sh' + s], R['el' + s].clone().sub(R['sh' + s]), R.fr['ua' + s], m);
        place(bones['fa' + s], R['el' + s], R['ha' + s].clone().sub(R['el' + s]), R.fr['fa' + s], m);
        place(bones['th' + s], R['h' + s], R['kn' + s].clone().sub(R['h' + s]), R.fr['th' + s], m);
        place(bones['sh' + s], R['kn' + s], R['an' + s].clone().sub(R['kn' + s]), R.fr['sh' + s], m);
        place(bones['ft' + s], R['an' + s], R['to' + s].clone().sub(R['an' + s]), R['kn' + s].clone().sub(R['an' + s]), m);
      }
    }

    /* ---------- Matériel : contexte « 3D » pour les fonctions de anim.js ---------- */
    const pools = {};
    const pool = (geo) => { const k = geo.uuid; return pools[k] || (pools[k] = { geo, items: [], n: 0 }); };
    const take = (geo, m) => { const p = pool(geo); let mesh = p.items[p.n]; if (!mesh) { mesh = new Mesh(geo, m); mesh.castShadow = true; scene.add(mesh); p.items.push(mesh); } mesh.material = m; mesh.visible = true; p.n++; return mesh; };
    const UP = v(0, 1, 0), q = new Quaternion();
    const c3 = {
      is3d: true, m: mat, v, fillStyle: C.pad, strokeStyle: C.steel, lineWidth: 2, path: [],
      sym: false, R: null,
      cyl(a, b, r, m) { const d = b.clone().sub(a), len = d.length(); if (len < 0.01) return; const mesh = take(gC, m); mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(UP, d.divideScalar(len)); mesh.scale.set(r, len, r); },
      sph(p, r, m) { const mesh = take(gS, m); mesh.position.copy(p); mesh.quaternion.identity(); mesh.scale.set(r, r, r); },
      boxSeg(a, b, wAxis, w, t, m) { const d = b.clone().sub(a), len = d.length(); if (len < 0.01) return; Y.copy(d).divideScalar(len); X.copy(wAxis).addScaledVector(Y, -wAxis.dot(Y)).normalize(); Z.crossVectors(X, Y); M4.makeBasis(X, Y, Z); const mesh = take(gB, m); mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromRotationMatrix(M4); mesh.scale.set(w, len, t); },
      box(cx, cy, cz, sx, sy, sz, m) { const mesh = take(gB, m); mesh.position.set(cx, cy, cz); mesh.quaternion.identity(); mesh.scale.set(sx, sy, sz); },
      torus(c, R0, axis, m, thick) { const mesh = take(thick ? gT2 : gT, m); mesh.position.copy(c); mesh.quaternion.setFromUnitVectors(v(0, 0, 1), axis); mesh.scale.set(R0, R0, R0); },
      // point 2D → 3D, accroché à l'articulation la plus proche (main, coude, genou…) si elle est à moins de 10 px
      pt(p, attach = true) {
        const R = c3.R, J = R.J;
        if (attach) {
          const cand = side ? [[J.ha, R.haR], [J.el, R.elR], [J.ha2, R.haL], [J.el2, R.elL], [J.an, R.anR], [J.kn, R.knR], [J.an2, R.anL], [J.kn2, R.knL]] : [[J.haR, R.haR], [J.haL, R.haL], [J.elR, R.elR], [J.elL, R.elL], [J.knR, R.knR], [J.knL, R.knL], [J.anR, R.anR], [J.anL, R.anL]];
          let best = null, bd = 10;
          for (const [a, b] of cand) { const d = Math.hypot(p[0] - a[0], p[1] - a[1]); if (d < bd) { bd = d; best = [a, b]; } }
          if (best) { const [a, b0] = best, b = o3.one && (b0 === R.haR || b0 === R.haL) ? R.haR.clone().add(R.haL).multiplyScalar(0.5) : b0; return b.clone().add(side ? SD(p[0] - a[0], p[1] - a[1]) : v(p[0] - a[0], -(p[1] - a[1]), 0)); }
        }
        return side ? SM(p) : FM(p, 0);
      },
      // émet une pièce, et son double de l'autre côté si les deux bras / jambes sont symétriques (vue de profil)
      twice(fn, pts) { fn(pts); const isArm = c3.sym, isLeg = c3.R.symL; if (side && pts.some(p => Math.abs(p.x) > 6) && (isArm || isLeg)) fn(pts.map(p => v(-p.x, p.y, p.z))); },
      cap(a, b, w, col) {
        const m = colMat(col);
        if (col === C.pad) { const A3 = c3.pt(a, false), B3 = c3.pt(b, false); return side ? c3.boxSeg(A3, B3, v(1, 0, 0), 30, w, m) : c3.boxSeg(A3, B3, v(0, 0, 1), 20, w, m); }
        c3.twice(([A3, B3]) => c3.cyl(A3, B3, Math.max(0.8, w / 2), m), [c3.pt(a), c3.pt(b)]);
      },
      dot(p, r, col) {
        const m = colMat(col);
        if (side && (col === C.pad || col === C.plate)) { const c = c3.pt(p, false); return c3.cyl(c.clone().add(v(col === C.pad ? -16 : -2, 0, 0)), c.clone().add(v(col === C.pad ? 16 : 2, 0, 0)), r, m); }
        c3.twice(([c]) => c3.sph(c, r * 0.9, m), [c3.pt(p)]);
      },
      rr(x, y, w, h) { const m = colMat(c3.fillStyle); if (side) c3.box(0, GROUND - y - h / 2, x + w / 2 - 100, 40, h, w, m); else c3.box(x + w / 2 - 100, GROUND - 2 - y - h / 2, 0, w, h, 22, m); },
      beginPath() { c3.path = []; }, moveTo(x, y) { c3.path.push(['m', x, y]); }, lineTo(x, y) { c3.path.push(['l', x, y]); }, closePath() {},
      arc(x, y, r) { c3.path.push(['a', x, y, r]); }, ellipse() {}, quadraticCurveTo(cx, cy, x, y) { c3.path.push(['q', cx, cy, x, y]); },
      bezierCurveTo() {}, arcTo() {},
      stroke() {
        const m = colMat(c3.strokeStyle); let last = null;
        for (const s of c3.path) {
          if (s[0] === 'a') c3.torus(c3.pt([s[1], s[2]], false), s[3], side ? v(1, 0, 0) : v(0, 0, 1), m);
          else if (s[0] === 'm') last = [s[1], s[2]];
          else if (s[0] === 'l') { c3.cyl(c3.pt(last), c3.pt([s[1], s[2]]), 1, m); last = [s[1], s[2]]; }
          else if (s[0] === 'q') { const a = c3.pt(last), b = c3.pt([s[3], s[4]]), c = c3.pt([s[1], s[2]], false); c.z += 30; let prev = a; for (let i = 1; i <= 10; i++) { const t = i / 10, pnt = a.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(c, 2 * t * (1 - t)).addScaledVector(b, t * t); c3.cyl(prev, pnt, 1.3, m); prev = pnt; } last = [s[3], s[4]]; }
        }
      },
      fill() {}, save() {}, restore() {}, translate() {}, rotate() {}, setTransform() {}, clearRect() {},
      eq: {
        bar(p) { const c = c3.pt(p, false); c.x = 0; c3.barbell(c, v(1, 0, 0)); },
        barFront() { const R = c3.R, c = R.haR.clone().add(R.haL).multiplyScalar(0.5); c3.barbell(c, v(1, 0, 0)); },
        db(p, ang = 0) { const c = c3.pt(p); c3.dumbbell(c, ang === 90 ? v(0, 0, 1) : v(1, 0, 0)); },
        dbSide(p) { c3.twice(([c]) => c3.dumbbell(c, v(1, 0, 0)), [c3.pt(p)]); },
        kb(p) { const R = c3.R, c = side ? c3.pt([p[0], p[1] + 10], false) : R.haR.clone().add(R.haL).multiplyScalar(0.5); if (side) { c.x = 0; c.y = (R.haR.y + R.haL.y) / 2 - 8; c.z = (R.haR.z + R.haL.z) / 2 + 2; } c3.sph(c, 9, mat.plate); c3.torus(c.clone().add(v(0, 9, 0)), 5.5, v(0, 0, 1), mat.plate, 1); },
        cable(from, to) {
          const T0 = c3.pt(to), F0 = c3.pt(from, false);
          c3.twice(([F, T]) => { c3.cyl(F, T, 0.7, mat.cable); c3.sph(F, 3.2, mat.steel); c3.sph(T, 2.4, mat.dark); }, [side ? v(T0.x * 0.5, F0.y, F0.z) : F0, T0]);
        },
        tower(x, y0 = 20, y1 = GROUND) { if (side) c3.box(0, GROUND - (y0 + y1) / 2, x - 100, 10, y1 - y0, 10, mat.pad); else c3.box(x - 100, GROUND - 2 - (y0 + y1) / 2, -8, 10, y1 - y0, 10, mat.pad); },
        bench(x0, x1, y, legs = true) {
          if (side) { c3.box(0, GROUND - y - 4, (x0 + x1) / 2 - 100, 30, 8, x1 - x0, mat.pad); if (legs) for (const x of [x0 + 10, x1 - 10]) { c3.box(0, (GROUND - y - 8) / 2, x - 100, 4, GROUND - y - 8, 4, mat.steel); c3.box(0, 1, x - 100, 28, 2, 4, mat.steel); } }
          else c3.box((x0 + x1) / 2 - 100, GROUND - 2 - y - 4, 0, x1 - x0, 8, 30, mat.pad);
        },
        pad(a, b, w = 9) { c3.cap(a, b, w, C.pad); },
        seat(x, y, w = 40) {
          if (side) { c3.box(0, GROUND - y - 4, x - 100, 32, 8, w, mat.pad); c3.cyl(v(0, GROUND - y - 8, x - 100), v(0, 0, x - 100), 2.5, mat.steel); c3.box(0, 1, x - 100, 30, 2, 26, mat.steel); }
          else { c3.box(x - 100, GROUND - 2 - y - 4, 8, w, 8, 36, mat.pad); c3.cyl(v(x - 100, GROUND - 2 - y - 8, 6), v(x - 100, 0, 6), 2.5, mat.steel); c3.box(x - 100, 1, 6, 26, 2, 30, mat.steel); }
        },
        rails(x) { for (const s of [1, -1]) { const a = side ? v(s * 46, GROUND - 18, x - 100) : v(x - 100 + s * 3, GROUND - 20, -10), b = a.clone(); b.y = 0; c3.cyl(a, b, 1.8, mat.steel); if (!side) break; } },
        pullbar(y, x0 = 40, x1 = 160) { if (side) { const R = c3.R; c3.cyl(v(-60, GROUND - y, R.haR.z), v(60, GROUND - y, R.haR.z), 1.8, mat.steel); } else c3.cyl(c3.pt([x0, y], false), c3.pt([x1, y], false), 1.8, mat.steel); },
        box(x, w, h) { if (side) c3.box(0, h / 2, x + w / 2 - 100, 44, h, w, mat.pad); else c3.box(x + w / 2 - 100, h / 2, 10, w, h, 40, mat.pad); },
        handle(p) { c3.twice(([c]) => c3.cyl(c.clone().add(v(-5.5, 0, 0)), c.clone().add(v(5.5, 0, 0)), 1.6, mat.dark), [c3.pt(p)]); },
      },
      barbell(c, ax) {
        const a = c.clone().addScaledVector(ax, -72), b = c.clone().addScaledVector(ax, 72);
        c3.cyl(a, b, 1.4, mat.steel);
        for (const s of [1, -1]) {
          const base = c.clone().addScaledVector(ax, s * 44);
          c3.cyl(base, base.clone().addScaledVector(ax, s * 26), 2.2, mat.steel);
          c3.cyl(base.clone().addScaledVector(ax, s * 1), base.clone().addScaledVector(ax, s * 5), 15, mat.plate);
          c3.cyl(base.clone().addScaledVector(ax, s * 5.4), base.clone().addScaledVector(ax, s * 8.8), 11.5, mat.plate);
          c3.torus(base.clone().addScaledVector(ax, s * 5.1), 13.2, ax, mat.rim);
          c3.cyl(base.clone().addScaledVector(ax, s * -0.5), base.clone().addScaledVector(ax, s * 1.2), 3.2, mat.steel);
        }
      },
      dumbbell(c, ax) {
        c3.cyl(c.clone().addScaledVector(ax, -10), c.clone().addScaledVector(ax, 10), 1.5, mat.steel);
        for (const s of [1, -1]) { const b = c.clone().addScaledVector(ax, s * 6.5); c3.cyl(b, b.clone().addScaledVector(ax, s * 6), 6.6, mat.plate); c3.torus(b.clone().addScaledVector(ax, s * 6.1), 5.2, ax, mat.rim); }
      },
    };
    function equipment(R, k, pose) {
      for (const p of Object.values(pools)) p.n = 0;
      c3.R = R; c3.sym = R.sym && !o3.one;
      const J = R.J;
      try {
        if (o3.eq3) o3.eq3(c3, R, k, opt); else tpl.eq?.(c3, J, k, opt, pose);
        tpl.front?.(c3, J, k, opt, pose);
        tpl.hold?.(c3, J, k, opt, pose);
      } catch (e) { /* matériel facultatif */ }
      for (const p of Object.values(pools)) for (let i = p.n; i < p.items.length; i++) p.items[i].visible = false;
    }

    /* ---------- Cadrage ---------- */
    const dur = tpl.dur || 2.6;
    let lo = v(1e9, 1e9, 1e9), hi = v(-1e9, -1e9, -1e9), elo = lo.clone(), ehi = hi.clone();
    let lying = false;
    for (let i = 0; i < 6; i++) {
      const R = skeleton(dur * i / 6);
      if (i === 0) lying = Math.abs(R.u.y) < 0.55;
      for (const kk of ['hip', 'shC', 'head', 'haR', 'haL', 'elR', 'elL', 'knR', 'knL', 'anR', 'anL', 'toR', 'toL', 'shR', 'shL']) { lo.min(R[kk]); hi.max(R[kk]); }
      equipment(R, i / 6, R.pose);
      for (const pl of Object.values(pools)) for (let j = 0; j < pl.n; j++) { const m = pl.items[j], sc = m.scale, e = pl.geo === gC ? Math.max(sc.x, sc.y / 2) : pl.geo === gB ? Math.max(sc.x, sc.y, sc.z) / 2 : sc.x; elo.min(m.position.clone().addScalar(-e)); ehi.max(m.position.clone().addScalar(e)); }
    }
    lo.addScalar(-12); hi.addScalar(12); lo.y = Math.min(lo.y, -2);
    elo.min(lo); ehi.max(hi);
    const fit = (a, b) => Math.max((b.y - a.y) / 2 * 1.06, Math.hypot(b.x - a.x, b.z - a.z) / 2 * 0.82);
    const bRad = Math.max(55, fit(lo, hi)), eRad = fit(elo, ehi);
    const rad = Math.min(Math.max(eRad, bRad * 1.05), bRad * 1.4);
    const center = lo.clone().add(hi).multiplyScalar(0.5).lerp(elo.clone().add(ehi).multiplyScalar(0.5), 0.35);
    const baseAz = tpl.view === 'side' ? (lying ? 72 : 60) : tpl.view === 'back' ? 156 : 24, baseEl = lying ? 22 : 12;
    let dragAz = 0, dragEl = 0;
    const D2R = Math.PI / 180;

    /* ---------- Interaction : glisser pour tourner ---------- */
    let drag = null;
    const onDown = e => { drag = { x: e.clientX, y: e.clientY, az: dragAz, el: dragEl }; canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('grab'); };
    const onMove = e => { if (!drag) return; dragAz = drag.az - (e.clientX - drag.x) * 0.5; dragEl = Math.max(-baseEl + 2, Math.min(55, drag.el + (e.clientY - drag.y) * 0.3)); if (still) draw(1.3); };
    const onUp = () => { drag = null; canvas.classList.remove('grab'); };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    canvas.style.touchAction = 'pan-y';

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    function resize() { const cw = canvas.clientWidth || 300, ch = canvas.clientHeight || cw; if (Math.abs(cw - w) < 1) return; w = cw; renderer.setSize(cw, ch, false); cam.aspect = cw / ch; cam.updateProjectionMatrix(); }
    function draw(time) {
      resize();
      const R = skeleton(time);
      pose3(R);
      const kk = (time % dur) / dur;
      equipment(R, kk, R.pose);
      // effort : intensité des muscles qui suit la phase concentrique
      const e = tpl.fn ? (tpl.loop ? 0.5 + 0.5 * Math.sin(kk * Math.PI * 2) : ease(kk < 0.5 ? kk * 2 : 2 - kk * 2)) : (kk < 0.4 ? ease(kk / 0.4) : kk < 0.5 ? 1 : kk < 0.9 ? 1 - ease((kk - 0.5) / 0.4) : 0);
      mat.prim.emissiveIntensity = 0.22 + 0.55 * e; mat.sec.emissiveIntensity = 0.1 + 0.25 * e;
      if (heart) { const b = 1 + 0.18 * Math.max(0, Math.sin(time * 9)); heart.position.copy(R.shC).addScaledVector(R.f, 12).addScaledVector(R.u, -8).addScaledVector(R.r, 5); heart.scale.setScalar(4.2 * b); heart.quaternion.setFromRotationMatrix(M4.makeBasis(R.r, R.u, R.f)); }
      const az = (baseAz + dragAz + (still || drag ? 0 : 16 * Math.sin(time * 0.45))) * D2R, el = (baseEl + dragEl) * D2R;
      const dist = rad / Math.tan(cam.fov * D2R / 2) * (cam.aspect < 1 ? 1 / cam.aspect : 1);
      cam.position.set(center.x + dist * Math.cos(el) * Math.sin(az), center.y + dist * Math.sin(el), center.z + dist * Math.cos(el) * Math.cos(az));
      cam.lookAt(center);
      key.target.position.copy(center);
      renderer.render(scene, cam);
    }
    const t0 = performance.now();
    let raf = 0, visible = true;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf && !still) raf = requestAnimationFrame(frame); }) : null;
    io?.observe(canvas);
    function dispose() { cancelAnimationFrame(raf); io?.disconnect(); for (const d of disposables) d.dispose?.(); renderer.dispose(); renderer.forceContextLoss?.(); }
    function frame(now) {
      raf = 0;
      if (!canvas.isConnected) return dispose();
      draw((now - t0) / 1000);
      if (visible) raf = requestAnimationFrame(frame);
    }
    if (o.time != null) { io?.disconnect(); draw(o.time); return { dispose, renderAt: t => draw(t) }; }
    if (still) draw(dur * 0.45); else raf = requestAnimationFrame(frame);
    // surveillance du retrait du canvas (fermeture de la fiche) pour libérer le contexte WebGL
    const watch = setInterval(() => { if (!canvas.isConnected) { clearInterval(watch); dispose(); } }, 1500);
    return { dispose, renderAt: t => draw(t) };
  }

  window.KaloAnim3D = { ok: webgl, load, play, _O3: O3 };
})();
