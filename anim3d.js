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

  /* ---------- Mannequin humain réaliste (maillage MakeHuman, licence CC0) ---------- */
  const humans = {}; const HUMAN_PALM = 1;
  function loadHuman(sex) {
    return humans[sex] || (humans[sex] = Promise.all([fetch('vendor/human/human-' + sex + '.json').then(r => r.json()), fetch('vendor/human/human-' + sex + '.bin').then(r => r.arrayBuffer())]).then(([meta, buf]) => {
      const nv = meta.nv, nt = meta.nt, pos = new Float32Array(buf, 0, nv * 3);
      let off = nv * 12; const big = nv >= 65536, idx = big ? new Uint32Array(buf, off, nt * 3) : new Uint16Array(buf, off, nt * 3);
      off += nt * 3 * (big ? 4 : 2); if (off % 4) off += 2;
      const si = new Uint8Array(buf, off, nv * 4), sw = new Uint8Array(buf, off + nv * 4, nv * 4);
      const B = {}; meta.bones.forEach((b, i) => { b.i = i; B[b.n] = b; });
      const P = n => B[n].h, sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = a => Math.hypot(a[0], a[1], a[2]);
      const legMH = len(sub(P('lowerleg01.L'), P('upperleg01.L'))) + len(sub(P('foot.L'), P('lowerleg01.L')));
      const k = 82 / legMH; // même longueur de jambes que les gabarits
      const palm = (sd) => { const w = P('wrist' + sd), f = P('finger3-1' + sd); return [w[0] + (f[0] - w[0]) * 0.55, w[1] + (f[1] - w[1]) * 0.55, w[2] + (f[2] - w[2]) * 0.55]; };
      const hipMid = P('upperleg01.L').map((x, i) => (x + P('upperleg01.R')[i]) / 2), shMid = P('upperarm01.L').map((x, i) => (x + P('upperarm01.R')[i]) / 2);
      const dims = {
        L: { ua: len(sub(P('lowerarm01.L'), P('upperarm01.L'))) * k, fa: len(sub(palm('.L'), P('lowerarm01.L'))) * k, th: len(sub(P('lowerleg01.L'), P('upperleg01.L'))) * k, sh: len(sub(P('foot.L'), P('lowerleg01.L'))) * k,
          foot: len(sub(B['foot.L'].t, P('foot.L'))) * k * 1.35, torso: (shMid[1] - hipMid[1]) * k, neck: 6, head: (B.head.t[1] - shMid[1]) * k - 8 },
        SW: (P('upperarm01.L')[0] - P('upperarm01.R')[0]) / 2 * k, HW: (P('upperleg01.L')[0] - P('upperleg01.R')[0]) / 2 * k,
      };
      return { meta, B, pos, idx, si, sw, k, hipMid, shMid, dims };
    }));
  }

  /* ---------- Réglages 3D par gabarit ---------- */
  // ky : bras vus de face projetés vers l'avant (1 = plan frontal, 0.1 = plan horizontal, ex. écarté)
  const O3 = {
    pullup: { legs: [14, -62, 95] }, pulldown1: { legs: [0, -100, 45] },
    // russian twist : assis en V, buste incliné en arrière, rotation du buste ; hands = main droite [latéral, bas, avant] depuis l'épaule
    twist: { lean: 40, yaw: p => (p.hx || 0) * 6.5, legs: [125, 40, 95], hipY: 12, hands: [-14, 14, 26] },
    woodchop: { ky: 0.8, yaw: p => ((p.hand?.[0] ?? 105) - 105) * 0.6 },
    fly: { ky: 0.12 }, flyUp: { ky: 0.75 }, reverseFly: { ky: 0.15 }, uprightRow: { ky: 0.9 },
    shrug: { ky: 0.97 },
    // vue de profil : grip = écart des mains (demi-largeur), pole = direction du coude [extérieur, haut, avant] (repère du buste), one = une seule charge tenue à deux mains
    bench: { grip: 31, pole: [1, 0.15, -0.6] }, incline: { grip: 31, pole: [1, 0.15, -0.6] }, decline: { grip: 31, pole: [1, 0.15, -0.6] },
    squat: { grip: 40, pole: [0.5, -1, -0.45], hand: J => [J.sh[0] - 3, J.sh[1] - 3] }, goodMorning: { grip: 40, pole: [0.5, -1, -0.45], hand: J => [J.sh[0] - 3, J.sh[1] - 3] }, calf: { grip: 25, hand: J => [J.sh[0] + 8, J.sh[1] - 1], noHold: 1, eq3: (c, R) => {
      // deux appuis d'épaules + colonne de la machine derrière
      const back = R.hip.z - 24, top = R.shC.y + 9;
      for (const s of [1, -1]) { const S0 = R[s > 0 ? 'shR' : 'shL']; c.box(S0.x - s * 3, S0.y + 8, S0.z, 13, 6, 20, c.m.pad); c.cyl(v(S0.x - s * 3, top, back), v(S0.x - s * 3, top, S0.z + 4), 1.8, c.m.steel); c.cyl(v(S0.x + s * 6, S0.y + 3, S0.z + 9), v(S0.x + s * 6, S0.y + 3, S0.z + 2), 1.4, c.m.dark); }
      c.box(0, top / 2, back, 10, top, 10, c.m.pad);
    } }, hack: { grip: 30, pole: [0.6, -1, 0] },
    frontSquat: { grip: 22, pole: [0.25, -0.1, 1], hand: J => [J.sh[0] + 7, J.sh[1] - 1] }, goblet: { grip: 6, one: 1, pole: [1, -1, 0.3] }, pullover: { grip: 5, one: 1 }, overhead: { grip: 5, one: 1, pole: [0.6, 1, 0.3] },
    skull: { grip: 14 }, row: { grip: 26 }, deadlift: { grip: 24 }, rdl: { grip: 24 }, wheel: { grip: 8, one: 1 }, rower: { grip: 12, one: 1 }, seatedRow: { grip: 9 }, pushdown: { grip: 15, pole: [0.9, -0.3, -0.7] },
    backExt: { grip: 9, pole: [1, -0.6, 0.2], hand: J => { const dx = J.sh[0] - J.hip[0], dy = J.sh[1] - J.hip[1], l = Math.hypot(dx, dy); return [J.sh[0] - dx / l * 13 - dy / l * 9, J.sh[1] - dy / l * 13 + dx / l * 9]; } },
    facePull: { grip: 14, pole: [1, 0.3, 0] }, crunchCable: { grip: 6, one: 1 }, straightPull: { grip: 18 }, hipThrust: { grip: 30 }, wristCurl: { grip: 20 }, lateral: { ky: 0.96 }, lateral1: { ky: 0.96 }, rope: { ky: 0.7 },
    dips: { noEq: 1, eq3: (c, R) => { const y = R.gripR ? (R.haR.y + R.haL.y) / 2 - 1 : GROUND - 86, x = R.gripR ? Math.abs(R.haR.x) : 24, z0 = R.gripR ? R.haR.z : 4; for (const s of [1, -1]) { c.cyl(c.v(s * x, y, z0 - 18), c.v(s * x, y, z0 + 46), 2.2, c.m.steel); c.cyl(c.v(s * x, y, z0 + 36), c.v(s * x, 0, z0 + 36), 2.2, c.m.steel); } } },
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
    let HM = null; if (o.human !== false) { try { HM = await loadHuman(o.sex === 'f' ? 'f' : 'm'); } catch (e) { HM = null; } }
    if (!canvas.isConnected && o.time == null) return;
    const LL = { ...L, torso: 48 };
    if (HM) { Object.assign(LL, HM.dims.L); B.SW = HM.dims.SW; B.HW = HM.dims.HW; }

    let renderer;
    try { renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { throw e; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = T3.SRGBColorSpace; renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = HM ? 1 : 0.98; if (HM) renderer.toneMapping = 0; // pas de compression des tons pour les aplats
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFShadowMap;
    const scene = new T3.Scene();
    const cam = new T3.PerspectiveCamera(30, 1, 10, 3000);

    // lumières
    scene.add(new T3.HemisphereLight(0xffffff, 0x2a3140, HM ? 0.55 : 1.25));
    const key = new T3.DirectionalLight(0xffffff, HM ? 1.55 : 2.4); key.position.set(HM ? 240 : 160, 300, HM ? 170 : 220); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 50, far: 900 }); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.6;
    scene.add(key, key.target);
    const rim = new T3.DirectionalLight(HM ? 0xbfd2ff : 0x7fa6ff, HM ? 0.5 : 1.5); rim.position.set(-220, 160, -240); scene.add(rim);
    const fill = new T3.DirectionalLight(0xffe2cc, HM ? 0.25 : 0.45); fill.position.set(-200, 60, 160); scene.add(fill);

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
    const bones = HM ? null : {
      torso: build(B.torso), head: build(B.head),
      uaR: build(B.ua), uaL: build(B.ua), faR: build(B.fa), faL: build(B.fa), thR: build(B.th), thL: build(B.th), shR: build(B.sh), shL: build(B.sh), ftR: build(B.ft), ftL: build(B.ft),
    };
    const toonRamp = new T3.DataTexture(new Uint8Array([92, 168, 255]), 3, 1, T3.RedFormat); toonRamp.minFilter = toonRamp.magFilter = T3.NearestFilter; toonRamp.needsUpdate = true; disposables.push(toonRamp);
    if (HM) for (const key of ['steel', 'dark', 'plate', 'rim', 'pad', 'cable']) { const old = mat[key]; mat[key] = new T3.MeshToonMaterial({ color: old.color, gradientMap: toonRamp }); disposables.push(mat[key]); }
    const HB = HM ? buildHuman() : null;
    function buildHuman() {
      const { meta, pos, idx, si, sw, k } = HM, nv = meta.nv;
      const geo = new T3.BufferGeometry();
      geo.setAttribute('position', new T3.BufferAttribute(pos, 3)); geo.setIndex(new T3.BufferAttribute(idx, 1));
      geo.setAttribute('skinIndex', new T3.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T3.BufferAttribute(sw, 4, true));
      geo.computeVertexNormals();
      geo.setAttribute('color', new T3.BufferAttribute(humanColors(geo.attributes.normal.array), 3));
      const bl = meta.bones.map(b => { const bone = new T3.Bone(); bone.name = b.n; return bone; });
      meta.bones.forEach((b, i) => { if (b.p >= 0) { const ph = meta.bones[b.p].h; bl[i].position.set(b.h[0] - ph[0], b.h[1] - ph[1], b.h[2] - ph[2]); bl[b.p].add(bl[i]); } else bl[i].position.set(b.h[0], b.h[1], b.h[2]); });
      const skin = new T3.SkinnedMesh(geo, new T3.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp }));
      skin.add(bl[0]); skin.bind(new T3.Skeleton(bl)); skin.castShadow = true; skin.frustumCulled = false;
      // contour encré : coque inversée qui suit le squelette
      const lineMat = new T3.MeshBasicMaterial({ color: 0x24170f, side: T3.BackSide });
      lineMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed += normalize(objectNormal) * 0.05;'); };
      const outline = new T3.SkinnedMesh(geo, lineMat); outline.bind(skin.skeleton, skin.bindMatrix); outline.frustumCulled = false;
      const grp = new Group(); grp.scale.setScalar(k); grp.add(skin, outline); scene.add(grp);
      if (o.sex === 'f') { // queue de cheval accrochée à l'os de la tête
        const hb = meta.bones.find(b => b.n === 'head'), hh = hb.t[1] - hb.h[1], hairM = new T3.MeshToonMaterial({ color: 0x2b1d16, gradientMap: toonRamp });
        const tail = new Group(); tail.position.set(0, 0.62 * hh, -0.62 * hh);
        for (const [y, z, r, l] of [[0, 0, 0.3, 0.32], [-0.32, -0.18, 0.24, 0.42], [-0.72, -0.24, 0.17, 0.36]]) { const m = new Mesh(gS, hairM); m.position.set(0, y * hh, z * hh); m.scale.set(r * hh, l * hh, r * hh); m.castShadow = true; tail.add(m); }
        bl[meta.bones.indexOf(hb)].add(tail); disposables.push(hairM);
      }
      disposables.push(geo, skin.material, lineMat);
      return { bl, skin, grp };
    }
    // couleurs : peau gris clair, short foncé, muscles travaillés en rouge / orange (zones calculées sur la pose de repos)
    function humanColors(nrm) {
      const { meta, B, pos, si, sw, hipMid, shMid } = HM, nv = meta.nv, out = new Float32Array(nv * 3);
      const T = shMid[1] - hipMid[1], SWm = (B['upperarm01.L'].h[0] - B['upperarm01.R'].h[0]) / 2;
      const kneeY = B['lowerleg01.L'].h[1], ankY = B['foot.L'].h[1], thL = hipMid[1] - kneeY;
      const grp = n => { if (/^(spine|root|clavicle)/.test(n)) return 'torso'; if (/^(neck|head)/.test(n)) return 'head'; if (/^(shoulder01|upperarm)/.test(n)) return 'ua'; if (/^lowerarm/.test(n)) return 'fa'; if (/^(wrist|metacarpal|finger)/.test(n)) return 'hand'; if (/^(pelvis|upperleg)/.test(n)) return 'th'; if (/^lowerleg/.test(n)) return 'sh'; return 'foot'; };
      const gOf = meta.bones.map(b => grp(b.n));
      const ss = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      const band = (x, a, b, e) => ss(x, a - e, a + e) * (1 - ss(x, b - e, b + e));
      const skin = [0.95, 0.71, 0.53], shorts = [0.16, 0.19, 0.27], red = [1.0, 0.13, 0.17], org = [1.0, 0.52, 0.14], ink = [0.22, 0.13, 0.09];
      // relief : creux (séparations musculaires) assombris, bosses légèrement éclaircies
      const idx = HM.idx, sum = new Float32Array(nv * 3), cnt = new Float32Array(nv), el = new Float32Array(nv);
      for (let f = 0; f < idx.length; f += 3) for (let e = 0; e < 3; e++) { const a = idx[f + e], b = idx[f + (e + 1) % 3]; for (const [p1, p2] of [[a, b], [b, a]]) { sum[p1 * 3] += pos[p2 * 3]; sum[p1 * 3 + 1] += pos[p2 * 3 + 1]; sum[p1 * 3 + 2] += pos[p2 * 3 + 2]; cnt[p1]++; el[p1] += Math.hypot(pos[p2 * 3] - pos[p1 * 3], pos[p2 * 3 + 1] - pos[p1 * 3 + 1], pos[p2 * 3 + 2] - pos[p1 * 3 + 2]); } }
      let cav = new Float32Array(nv);
      for (let i = 0; i < nv; i++) { if (!cnt[i]) continue; const dx = sum[i * 3] / cnt[i] - pos[i * 3], dy = sum[i * 3 + 1] / cnt[i] - pos[i * 3 + 1], dz = sum[i * 3 + 2] / cnt[i] - pos[i * 3 + 2]; cav[i] = (dx * nrm[i * 3] + dy * nrm[i * 3 + 1] + dz * nrm[i * 3 + 2]) / (el[i] / cnt[i]); }
      for (let it = 0; it < 2; it++) { const nx2 = new Float32Array(nv), nc = new Float32Array(nv); for (let f = 0; f < idx.length; f += 3) for (let e = 0; e < 3; e++) { const a = idx[f + e], b = idx[f + (e + 1) % 3]; nx2[a] += cav[b]; nc[a]++; nx2[b] += cav[a]; nc[b]++; } for (let i = 0; i < nv; i++) cav[i] = 0.5 * cav[i] + 0.5 * (nc[i] ? nx2[i] / nc[i] : cav[i]); }
      const isP = m => P.has(m), isS = m => S.has(m);
      const sx = (mx) => Math.sign(mx) || 1;
      for (let i = 0; i < nv; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], nx = nrm[i * 3], ny = nrm[i * 3 + 1], nz = nrm[i * 3 + 2];
        const w = {}; for (let j = 0; j < 4; j++) { const g = gOf[si[i * 4 + j]]; w[g] = (w[g] || 0) + sw[i * 4 + j] / 255; }
        const t = w.torso || 0, uaw = w.ua || 0, faw = w.fa || 0, thw = w.th || 0, shw = w.sh || 0;
        const yr = (y - hipMid[1]) / T, ax = Math.abs(x) / SWm;
        const sideSh = x > 0 ? B['upperarm01.L'].h : B['upperarm01.R'].h, dSh = Math.hypot(x - sideSh[0], y - sideSh[1], z - sideSh[2]);
        const m = {
          pecs: t * ss(nz, 0.15, 0.4) * band(yr, 0.6, 1.02, 0.05) * (1 - ss(ax, 0.82, 0.98)),
          abdos: t * Math.max(ss(nz, 0.2, 0.45) * band(yr, 0.04, 0.6, 0.04) * (1 - ss(ax, 0.36, 0.46)), 0.8 * ss(Math.abs(nx), 0.4, 0.65) * ss(nz, -0.35, -0.05) * band(yr, 0.08, 0.5, 0.05)),
          dos: t * Math.max(ss(-nz, 0.15, 0.4) * band(yr, 0.38, 0.95, 0.05), ss(Math.abs(nx), 0.45, 0.7) * (1 - ss(nz, 0.05, 0.3)) * band(yr, 0.42, 0.86, 0.05)),
          trapezes: Math.min(1, t + (w.head || 0) * 0.3) * (1 - ss(y, B.neck03.h[1], B.head.h[1])) * Math.max(ss(yr, 0.9, 1.0) * (1 - ss(nz, 0.2, 0.5)) * (1 - ss(ax, 0.72, 0.9)), ss(-nz, 0.3, 0.5) * ss(yr, 0.62, 0.72) * (1 - ss(ax, 0.3, 0.42))),
          lombaires: t * ss(-nz, 0.3, 0.5) * band(yr, -0.02, 0.36, 0.04) * (1 - ss(ax, 0.28, 0.38)),
          epaules: (uaw + t > 0.5 ? 1 : 0) * (1 - ss(dSh / T, 0.27, 0.32)) * ss(ax, 0.74, 0.84) * (1 - ss(-ny, 0.5, 0.7)),
          biceps: uaw * ss(nz, -0.05, 0.2) * ss(dSh / T, 0.26, 0.32),
          triceps: uaw * ss(-nz, -0.05, 0.2) * ss(dSh / T, 0.24, 0.3),
          avantbras: faw * ss(faw, 0.4, 0.7),
          fessiers: Math.min(1, thw + t) * ss(-nz, 0.15, 0.4) * band(y, hipMid[1] - 0.42 * thL, hipMid[1] + 0.22 * T, 0.05 * T),
          quadriceps: thw * ss(nz, -0.05, 0.25) * band(y, kneeY + 0.06 * thL, hipMid[1] - 0.12 * thL, 0.05 * thL),
          ischios: thw * ss(-nz, 0.2, 0.45) * band(y, kneeY + 0.08 * thL, hipMid[1] - 0.4 * thL, 0.05 * thL),
          adducteurs: thw * ss(-nx * sx(x), 0.35, 0.6) * band(y, hipMid[1] - 0.65 * thL, hipMid[1] - 0.05 * thL, 0.06 * thL),
          mollets: shw * ss(-nz, 0.05, 0.3) * ss(y, ankY + 0.35 * (kneeY - ankY), ankY + 0.5 * (kneeY - ankY)),
        };
        let c = skin.slice(); const inkK = ss(cav[i], 0.055, 0.11);
        const sh = Math.min(1, thw + t) * band(y, hipMid[1] - 0.42 * thL, hipMid[1] + 0.14 * T, 0.008 * T);
        if (sh > 0) c = c.map((v, k) => v + (shorts[k] - v) * sh);
        if (o.sex === 'f') { const bra = t * band(yr, 0.62, 0.9, 0.025); if (bra > 0) c = c.map((v, k) => v + (shorts[k] - v) * bra); }
        let mp = 0, ms = 0; for (const key in m) { if (isP(key)) mp = Math.max(mp, m[key]); else if (isS(key)) ms = Math.max(ms, m[key]); }
        ms = ss(ms, 0.3, 0.5); mp = ss(mp, 0.3, 0.5); // zones nettes (style illustré)
        if (ms > 0) c = c.map((v, k) => v + (org[k] - v) * ms * 0.92);
        if (mp > 0) c = c.map((v, k) => v + (red[k] - v) * mp * 0.95);
        // cheveux courts
        const hb = B.head.h[1], hh = B.head.t[1] - hb, hw = w.head || 0;
        if (hw > 0.5) { const fh = o.sex === 'f' ? 0.1 : 0; const hair = Math.max(ss(y, hb + (0.45 - fh) * hh, hb + (0.48 - fh) * hh) * (1 - ss(nz, 0.2, 0.28)), ss(y, hb + 0.73 * hh, hb + 0.76 * hh), ss(y, hb + (0.26 - fh) * hh, hb + (0.29 - fh) * hh) * ss(-nz, 0.3, 0.38)); if (hair > 0) c = c.map((v, k) => v + ([0.17, 0.12, 0.09][k] - v) * hair); }
        if (inkK > 0 && hw < 0.3) c = c.map((v, k) => v + (ink[k] - v) * inkK * 0.85); // traits des séparations musculaires
        if (meta.eye && i >= meta.eye[0] && i <= meta.eye[1]) c = [0.16, 0.11, 0.08];
        out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2];
      }
      return out;
    }
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
    const FM = (p, z = 0) => v(p[0] - 100, GROUND + 3 - p[1], z);
    const ky = o3.ky ?? 1;
    const squash = (dx, dy, len) => { const y = dy * ky, z = Math.sqrt(Math.max(0, len * len - dx * dx - y * y)); return v(dx, -y, ky < 1 ? z : 0); };

    function ik3(S0, H, l1, l2, pole) {
      const d = H.clone().sub(S0), n = d.length() || 1, len = Math.min(Math.max(n, Math.abs(l1 - l2) + 0.01, Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(Math.PI / 6))), l1 + l2 - 0.01);
      d.divideScalar(n);
      const ca = (l1 * l1 + len * len - l2 * l2) / (2 * l1 * len), a = Math.acos(Math.max(-1, Math.min(1, ca)));
      const perp = pole.clone().addScaledVector(d, -pole.dot(d)); if (perp.lengthSq() < 1e-6) perp.set(0, -1, 0).addScaledVector(d, d.y); perp.normalize();
      return [S0.clone().addScaledVector(d, Math.cos(a) * l1).addScaledVector(perp, Math.sin(a) * l1), S0.clone().addScaledVector(d, len), perp];
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
        R.shC = hip.clone().addScaledVector(u, LL.torso);
        const sh = s => R.shC.clone().addScaledVector(r, s * B.SW);
        const grip = (o3.grip ?? B.SW + 5) - B.SW;
        // pôle anatomique du coude : rotation de +90° de la direction épaule → main dans le plan sagittal
        // (bras le long du corps → coude vers l'arrière ; bras devant → coude vers le bas ; bras en l'air → coude vers l'avant)
        const apexArm = (s, d) => { const a = d.dot(u), b = d.dot(f), p = f.clone().multiplyScalar(a).addScaledVector(u, -b); if (p.lengthSq() < 0.04 * d.lengthSq()) p.copy(u).negate(); return p.normalize().addScaledVector(r, s * 0.35).addScaledVector(u, -0.12); };
        // pôle anatomique du genou : toujours vers l'avant de la cuisse (rotation de −90°)
        const apexLeg = (s, d) => { const a = d.dot(u), b = d.dot(f), p = f.clone().multiplyScalar(-a).addScaledVector(u, b); if (p.lengthSq() < 0.04 * d.lengthSq()) p.copy(f); return p.normalize().addScaledVector(r, s * 0.12); };
        const arm = (s, el, ha) => {
          if (o3.hand) ha = o3.hand(J);
          const S0 = sh(s), H = S0.clone().add(SD(ha[0] - J.sh[0], ha[1] - J.sh[1])).addScaledVector(r, s * grip);
          const pole = o3.pole ? r.clone().multiplyScalar(s * o3.pole[0]).addScaledVector(u, o3.pole[1]).addScaledVector(f, o3.pole[2]) : apexArm(s, H.clone().sub(S0));
          const [E, H2, apex] = ik3(S0, H, LL.ua, LL.fa, pole); return [S0, E, H2, apex];
        };
        let aR, aL, kR, kL;
        [R.shR, R.elR, R.haR, aR] = arm(1, J.el, J.ha); [R.shL, R.elL, R.haL, aL] = arm(-1, J.el2, J.ha2);
        const leg = (s, an, to) => {
          const H0 = hip.clone().addScaledVector(r, s * B.HW), T0 = H0.clone().add(SD(an[0] - J.hip[0], an[1] - J.hip[1])).addScaledVector(r, s * 2);
          const [K, An, apex] = ik3(H0, T0, LL.th, LL.sh, apexLeg(s, T0.clone().sub(H0)));
          // pied : angle relatif au tibia repris du gabarit (déjà borné), dans le plan du genou
          const kn2 = s > 0 ? J.kn : J.kn2, rel = (((Math.atan2(to[0] - an[0], to[1] - an[1]) - Math.atan2(an[0] - kn2[0], an[1] - kn2[1])) * 180 / Math.PI) % 360 + 540) % 360 - 180;
          const S = An.clone().sub(K).normalize(), F = apex.clone().addScaledVector(S, -apex.dot(S)).normalize(), rr = Math.max(40, Math.min(128, rel)) * Math.PI / 180;
          const To = An.clone().addScaledVector(S, Math.cos(rr) * LL.foot).addScaledVector(F, Math.sin(rr) * LL.foot);
          return [H0, K, An, To, apex];
        };
        [R.hR, R.knR, R.anR, R.toR, kR] = leg(1, J.an, J.to); [R.hL, R.knL, R.anL, R.toL, kL] = leg(-1, J.an2, J.to2);
        R.head = SM(J.head);
        // avant des segments : côté opposé à la pointe du coude (biceps), côté de la pointe du genou (quadriceps)
        const perp = (a, b, apex, sg) => { const d = b.clone().sub(a).normalize(); return apex.clone().addScaledVector(d, -apex.dot(d)).normalize().multiplyScalar(sg); };
        R.fr = { uaR: perp(R.shR, R.elR, aR, -1), faR: perp(R.elR, R.haR, aR, -1), uaL: perp(R.shL, R.elL, aL, -1), faL: perp(R.elL, R.haL, aL, -1), thR: perp(R.hR, R.knR, kR, 1), shR: perp(R.knR, R.anR, kR, 1), thL: perp(R.hL, R.knL, kL, 1), shL: perp(R.knL, R.anL, kL, 1) };
      } else {
        J = frontJoints(pose);
        const sy = pose.sy ? -pose.sy : 0;
        // buste : inclinaison arrière (lean) et rotation (yaw) facultatives
        const ln = (o3.lean || 0) * Math.PI / 180, yw = (o3.yaw ? o3.yaw(pose) : 0) * Math.PI / 180, cy = Math.cos(yw), sny = Math.sin(yw);
        const rotY = q => v(q.x * cy + q.z * sny, q.y, -q.x * sny + q.z * cy);
        const u = rotY(v(0, Math.cos(ln), -Math.sin(ln))), f = rotY(v(0, Math.sin(ln), Math.cos(ln))), r = new V3().crossVectors(u, f), hip = FM(J.hip);
        if (o3.hipY != null) hip.y = o3.hipY;
        Object.assign(R, { J, u, f, r, hip, sym: false, symL: false });
        R.shC = hip.clone().addScaledVector(u, LL.torso);
        const T3 = q => r.clone().multiplyScalar(q.x).addScaledVector(u, q.y).addScaledVector(f, q.z);
        const arm = (s, sh2, el2, ha2) => {
          const S0 = R.shC.clone().addScaledVector(r, s * B.SW).addScaledVector(u, sy);
          if (o3.hands) { const [hx, hy, hz] = o3.hands, H = S0.clone().add(T3(v(s * hx, -hy, hz))); const [E, H2] = ik3(S0, H, LL.ua, LL.fa, r.clone().multiplyScalar(s * 0.6).addScaledVector(u, -1).addScaledVector(f, -0.2)); return [S0, E, H2]; }
          const E = S0.clone().add(T3(squash(el2[0] - sh2[0], el2[1] - sh2[1], LL.ua))), H = E.clone().add(T3(squash(ha2[0] - el2[0], ha2[1] - el2[1], LL.fa))); return [S0, E, H];
        };
        [R.shR, R.elR, R.haR] = arm(1, J.shR, J.elR, J.haR); [R.shL, R.elL, R.haL] = arm(-1, J.shL, J.elL, J.haL);
        const leg = (s, h2, k2, a2) => {
          const H0 = hip.clone().add(v(s * B.HW, 0, 0)), dx = k2[0] - h2[0], dy = k2[1] - h2[1];
          let K, An;
          if (o3.legs) { // jambes fléchies vers l'arrière (suspension) : [cuisse, tibia, pied] en degrés, 0 = vers le bas, + = vers l'avant
            const [ta, sa, fa] = o3.legs.map(x => x * Math.PI / 180);
            K = H0.clone().add(v(s * 1.5, -Math.cos(ta) * LL.th, Math.sin(ta) * LL.th)); An = K.clone().add(v(s * 1, -Math.cos(sa) * LL.sh, Math.sin(sa) * LL.sh));
            return [H0, K, An, An.clone().add(v(s * 2, -Math.cos(sa + fa) * LL.foot, Math.sin(sa + fa) * LL.foot))];
          }
          if (pose.seat) {
            const drop = Math.max(0, dy), K0 = H0.clone().add(v(dx, -drop, Math.sqrt(Math.max(0, LL.th * LL.th - dx * dx - drop * drop))));
            K = K0; const sdx = a2[0] - k2[0], down = Math.min(LL.sh - 0.5, Math.max(0, K.y - 2)); An = K.clone().add(v(sdx, -down, Math.sqrt(Math.max(0, LL.sh * LL.sh - sdx * sdx - down * down))));
          } else {
            K = H0.clone().add(v(dx, -dy, Math.sqrt(Math.max(0, LL.th * LL.th - dx * dx - dy * dy))));
            const sdx = a2[0] - k2[0], sdy = a2[1] - k2[1]; An = K.clone().add(v(sdx, -sdy, Math.sqrt(Math.max(0, LL.sh * LL.sh - sdx * sdx - sdy * sdy)) * 0));
          }
          return [H0, K, An, An.clone().add(v(s * 3, -1.5, 14.6))];
        };
        [R.hR, R.knR, R.anR, R.toR] = leg(1, J.hR, J.knR, J.anR); [R.hL, R.knL, R.anL, R.toL] = leg(-1, J.hL, J.knL, J.anL);
        R.head = R.shC.clone().addScaledVector(u, LL.neck + LL.head + 2);
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
    const qA = new Quaternion(), qB = new Quaternion(), mA = new Matrix4(), mB = new Matrix4(), tA = new V3(), tB = new V3(), tC = new V3();
    const frameQ = (out, dir, front) => { tA.copy(dir).normalize(); tB.copy(front).addScaledVector(tA, -front.dot(tA)); if (tB.lengthSq() < 1e-6) tB.set(0, 0, 1).addScaledVector(tA, -tA.z); tB.normalize(); tC.crossVectors(tA, tB); mA.makeBasis(tC, tA, tB); return out.setFromRotationMatrix(mA); };
    const aimQ = (restDir, restFront, dir, front) => { frameQ(qA, restDir, restFront); frameQ(qB, dir, front); return qB.clone().multiply(qA.invert()); };
    const HR = {}; // directions de repos
    const GR = {}; // prise de chaque main (orientation, paume, axe du poing)
    const neutralIds = new Set(['curl-marteau', 'shrug-halt', 'farmer', 'fentes', 'bulgare', 'step-up', 'rowing-halt', 'kickback', 'elev-lat-halt', 'ecarte-halt', 'sdt-jt']);
    function poseHuman(R) {
      const { bl } = HB, { B, k, hipMid } = HM, W = {};
      const rv = (a, b) => v(B[b].h[0] - B[a].h[0], B[b].h[1] - B[a].h[1], B[b].h[2] - B[a].h[2]);
      const Zr = v(0, 0, 1), Yr = v(0, 1, 0);
      mB.makeBasis(R.r, R.u, R.f); const torsoQ = new Quaternion().setFromRotationMatrix(mB);
      const set = (n, q) => { W[n] = q; };
      for (const n of ['root', 'spine05', 'spine04', 'spine03', 'spine02', 'spine01', 'clavicle.L', 'clavicle.R', 'shoulder01.L', 'shoulder01.R', 'pelvis.L', 'pelvis.R']) set(n, torsoQ);
      const neckQ = aimQ(rv('neck01', 'head'), Zr, R.head.clone().sub(R.neck), R.f);
      for (const n of ['neck01', 'neck02', 'neck03', 'head']) set(n, neckQ);
      for (const [s, sd] of [['R', '.L'], ['L', '.R']]) {
        const uaDir = R['el' + s].clone().sub(R['sh' + s]).normalize();
        // ceinture scapulaire : suit ~30 % du mouvement du bras (épaules qui montent quand les bras passent au-dessus de la tête)
        const restUA = rv('upperarm01' + sd, 'lowerarm01' + sd).normalize().applyQuaternion(torsoQ), clQ = new Quaternion().slerp(new Quaternion().setFromUnitVectors(restUA, uaDir), 0.3).multiply(torsoQ);
        set('clavicle' + sd, clQ); set('shoulder01' + sd, clQ);
        const uaQ = aimQ(rv('upperarm01' + sd, 'lowerarm01' + sd), Zr, R['el' + s].clone().sub(R['sh' + s]), R.fr['ua' + s]);
        set('upperarm01' + sd, uaQ); set('upperarm02' + sd, uaQ);
        // paume au repos : normale calculée avec le pouce (côté radial) ; la paume suit le côté fléchisseur de l'avant-bras
        const palmN = HR[sd] || (HR[sd] = (() => { const dd = rv('wrist' + sd, 'finger3-1' + sd).normalize(), t = rv('finger3-1' + sd, 'finger1-1' + sd); t.addScaledVector(dd, -t.dot(dd)).normalize(); return sd === '.L' ? dd.clone().cross(t) : t.clone().cross(dd); })());
        // orientation de la main : l'axe du poing (autour duquel les doigts se ferment) suit l'axe de la charge
        // prise neutre (marteau) : axe vers l'avant, paume vers l'intérieur ; sinon axe latéral (barre), paume côté fléchisseurs
        const dF = R['ha' + s].clone().sub(R['el' + s]).normalize(), flex = R.fr['fa' + s], sg = s === 'R' ? 1 : -1;
        const gA = (o3.neutral || neutralIds.has(id) ? R.f : R.r).clone(), pref = o3.neutral || neutralIds.has(id) ? R.r.clone().multiplyScalar(-sg).addScaledVector(R.u, -0.6) : flex;
        gA.addScaledVector(dF, -gA.dot(dF));
        let palmT = flex;
        if (gA.lengthSq() > 0.05) { gA.normalize(); palmT = gA.clone().cross(dF); if (palmT.dot(pref) < 0) palmT.negate(); }
        const faQ = aimQ(rv('lowerarm01' + sd, 'wrist' + sd), palmN, dF, palmT);
        set('lowerarm01' + sd, aimQ(rv('lowerarm01' + sd, 'wrist' + sd), palmN, dF, palmT.clone().add(flex).normalize())); // torsion répartie
        for (const n of ['lowerarm02', 'wrist', 'metacarpal1', 'metacarpal2', 'metacarpal3', 'metacarpal4']) set(n + sd, faQ);
        GR[s] = { q: faQ.clone(), palm: palmT.clone(), axis: dF.clone().cross(palmT).normalize(), sd };
        // poing fermé autour de la poignée
        for (let f = 1; f <= 5; f++) {
          const d = rv('finger' + f + '-1' + sd, 'finger' + f + '-2' + sd).normalize(), ax = d.clone().cross(palmN).normalize();
          const ang = f === 1 ? [0.35, 0.5, 0.6] : [1.0, 1.45, 1.75];
          for (let j = 1; j <= 3; j++) set('finger' + f + '-' + j + sd, faQ.clone().multiply(new Quaternion().setFromAxisAngle(ax, ang[j - 1])));
        }
        const thQ = aimQ(rv('upperleg01' + sd, 'lowerleg01' + sd), Zr, R['kn' + s].clone().sub(R['h' + s]), R.fr['th' + s]);
        set('upperleg01' + sd, thQ); set('upperleg02' + sd, thQ);
        const shQ = aimQ(rv('lowerleg01' + sd, 'foot' + sd), Zr, R['an' + s].clone().sub(R['kn' + s]), R.fr['sh' + s]);
        set('lowerleg01' + sd, shQ); set('lowerleg02' + sd, shQ);
        const ft = B['foot' + sd]; set('foot' + sd, aimQ(v(ft.t[0] - ft.h[0], ft.t[1] - ft.h[1], ft.t[2] - ft.h[2]), Yr, R['to' + s].clone().sub(R['an' + s]), R['kn' + s].clone().sub(R['an' + s])));
      }
      // quaternions locaux (les os n'ont pas de rotation au repos)
      HM.meta.bones.forEach((b, i) => { const q = W[b.n] || torsoQ; bl[i].quaternion.copy(b.p >= 0 ? (W[HM.meta.bones[b.p].n] || torsoQ).clone().invert().multiply(q) : q); });
      // racine : milieu des hanches sur la hanche du gabarit
      const d0 = v(hipMid[0] - B.root.h[0], hipMid[1] - B.root.h[1], hipMid[2] - B.root.h[2]).applyQuaternion(torsoQ);
      bl[0].position.copy(R.hip).divideScalar(k).sub(d0);
      // point de prise réel (centre du poing) : le matériel s'y accroche
      HB.grp.updateMatrixWorld(true);
      for (const s of ['R', 'L']) {
        const g = GR[s], wb = bl[B['wrist' + g.sd].i], w = wb.getWorldPosition(new V3());
        const wr = B['wrist' + g.sd].h, f3 = B['finger3-1' + g.sd].h, off = v((f3[0] - wr[0]) * 0.62, (f3[1] - wr[1]) * 0.62, (f3[2] - wr[2]) * 0.62).applyQuaternion(g.q).multiplyScalar(k);
        R['ha' + s] = w.add(off).addScaledVector(g.palm, 0.32 * k); R['grip' + s] = g.axis;
      }
    }
    function pose3(R) {
      if (HB) return poseHuman(R);
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
      // main réelle la plus proche (prise du mannequin humain) : [centre du poing, axe, côté]
      hand(c) { const R = c3.R; if (!R.gripR) return null; const dR = c.distanceTo(R.haR), dL = c.distanceTo(R.haL); if (Math.min(dR, dL) > 14) return null; return dR <= dL ? [R.haR, R.gripR, 'R'] : [R.haL, R.gripL, 'L']; },
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
        bar(p) { const c = c3.pt(p, false); c.x = 0; const R = c3.R; if (R.gripR) { const m = R.haR.clone().add(R.haL).multiplyScalar(0.5); if (m.distanceTo(c) < 24) return c3.barbell(m, R.haR.clone().sub(R.haL).normalize()); } c3.barbell(c, v(1, 0, 0)); },
        barFront() { const R = c3.R, c = R.haR.clone().add(R.haL).multiplyScalar(0.5); c3.barbell(c, R.gripR ? R.haR.clone().sub(R.haL).normalize() : v(1, 0, 0)); },
        db(p, ang = 0) { const c = c3.pt(p), h = c3.hand(c); if (h) return c3.dumbbell(h[0], h[1]); c3.dumbbell(c, ang === 90 ? v(0, 0, 1) : v(1, 0, 0)); },
        dbSide(p) { const c = c3.pt(p), h = c3.hand(c); if (h) { c3.dumbbell(h[0], h[1]); if (c3.sym) { const o = c3.R[h[2] === 'R' ? 'haL' : 'haR']; c3.dumbbell(o, c3.R['grip' + (h[2] === 'R' ? 'L' : 'R')]); } return; } c3.twice(([q]) => c3.dumbbell(q, v(1, 0, 0)), [c]); },
        kb(p) { const R = c3.R; let c; if (R.gripR) c = R.haR.clone().add(R.haL).multiplyScalar(0.5).addScaledVector(R.f, 7).addScaledVector(R.u, -10); else { c = side ? c3.pt([p[0], p[1] + 10], false) : R.haR.clone().add(R.haL).multiplyScalar(0.5); if (side) { c.x = 0; c.y = (R.haR.y + R.haL.y) / 2 - 8; c.z = (R.haR.z + R.haL.z) / 2 + 2; } } c3.sph(c, 9, mat.plate); c3.torus(c.clone().add(v(0, 9, 0)), 5.5, v(0, 0, 1), mat.plate, 1); },
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
        pullbar(y, x0 = 40, x1 = 160) { const R = c3.R; if (R.gripR) { const m = R.haR.clone().add(R.haL).multiplyScalar(0.5); return c3.cyl(v(-62, m.y, m.z), v(62, m.y, m.z), 1.8, mat.steel); } if (side) { c3.cyl(v(-60, GROUND - y, R.haR.z), v(60, GROUND - y, R.haR.z), 1.8, mat.steel); } else c3.cyl(c3.pt([x0, y], false), c3.pt([x1, y], false), 1.8, mat.steel); },
        box(x, w, h) { if (side) c3.box(0, h / 2, x + w / 2 - 100, 44, h, w, mat.pad); else c3.box(x + w / 2 - 100, h / 2, 10, w, h, 40, mat.pad); },
        back(y0, y1) { if (side) return; const z = c3.R.hip.z - 13; c3.box(0, GROUND + 3 - (y0 + y1) / 2, z, 34, y0 - y1, 6, mat.pad); c3.cyl(v(0, GROUND + 3 - y0, z - 2), v(0, 0, z - 2), 2.2, mat.steel); },
        handle(p) { const c = c3.pt(p), h = c3.hand(c); if (h) { const one = (q, a) => c3.cyl(q.clone().addScaledVector(a, -5.5), q.clone().addScaledVector(a, 5.5), 1.6, mat.dark); one(h[0], h[1]); if (c3.sym) one(c3.R[h[2] === 'R' ? 'haL' : 'haR'], c3.R['grip' + (h[2] === 'R' ? 'L' : 'R')]); return; } c3.twice(([q]) => c3.cyl(q.clone().add(v(-5.5, 0, 0)), q.clone().add(v(5.5, 0, 0)), 1.6, mat.dark), [c]); },
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
        if (!o3.noEq) tpl.eq?.(c3, J, k, opt, pose);
        o3.eq3?.(c3, R, k, opt);
        tpl.front?.(c3, J, k, opt, pose);
        if (!o3.noHold) tpl.hold?.(c3, J, k, opt, pose);
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
    lo.addScalar(-16); hi.addScalar(16); lo.y = Math.min(lo.y, -2);
    elo.min(lo); ehi.max(hi);
    const fit = (a, b) => Math.max((b.y - a.y) / 2 * 1.06, Math.hypot(b.x - a.x, b.z - a.z) / 2 * 0.82);
    const bRad = Math.max(55, fit(lo, hi)), eRad = fit(elo, ehi);
    const rad = Math.min(Math.max(eRad, bRad * 1.05), bRad * 1.4);
    const center = lo.clone().add(hi).multiplyScalar(0.5).lerp(elo.clone().add(ehi).multiplyScalar(0.5), 0.35);
    const baseAz = tpl.view === 'side' ? (lying ? 72 : 66) : tpl.view === 'back' ? 156 : 24, baseEl = lying ? 22 : 12;
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
    let lastR = null;
    function draw(time) {
      resize();
      const R = skeleton(time); lastR = R;
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
    if (o.time != null) { io?.disconnect(); draw(o.time); return { dispose, renderAt: t => draw(t), skeleton, dur, tpl: name, last: () => lastR }; }
    if (still) draw(dur * 0.45); else raf = requestAnimationFrame(frame);
    // surveillance du retrait du canvas (fermeture de la fiche) pour libérer le contexte WebGL
    const watch = setInterval(() => { if (!canvas.isConnected) { clearInterval(watch); dispose(); } }, 1500);
    return { dispose, renderAt: t => draw(t) };
  }

  window.KaloAnim3D = { ok: webgl, load, play, _O3: O3 };
})();
