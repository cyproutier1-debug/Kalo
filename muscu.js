'use strict';
// Module Musculation de Kalo : séances, routines, minuteur de repos, historique, records, statistiques, carte musculaire.
window.KaloMuscuInit = K => {
  const { $, $$, esc, r0, r1, num, uid, cap, dkey, dparse, addDays, today, F, ICON, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, closeAll, niceStep, bindTip, currentWeight } = K;
  const MUS = window.KALO_MUSCLES || {}, EQ = window.KALO_EQUIP || {};
  const BASE = (window.KALO_EXOS || []).map(([id, name, muscle, sec, equip, type]) => ({ id, name, muscle, sec, equip, type }));
  const M = { workouts: [], routines: [], custom: [], active: null, settings: { rest: 90 }, rest: null, programs: [], activeProg: null };
  const DAY = 864e5;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const exos = () => [...BASE, ...M.custom];
  const exo = id => exos().find(e => e.id === id) || { id, name: 'Exercice supprimé', muscle: 'autre', sec: [], equip: 'autre', type: 'w' };
  const A = window.KaloAnim;
  const thumb = (id, cls = '') => A ? `<img class="exo-thumb anim ${cls}" src="${A.thumb(id)}" alt="">` : `<span class="exo-thumb ${cls} none">${ICON.dumbbell}</span>`;
  const anim = id => A ? `<div class="exo-anim"><canvas class="exo-canvas" data-anim="${esc(id)}"></canvas></div><div class="exo-key"><span><i class="k1"></i>Muscle principal</span><span><i class="k2"></i>Muscles secondaires</span></div>` : `<div class="exo-anim none">${ICON.dumbbell}</div>`;
  // 2D tout de suite, puis bascule en 3D (three.js chargé à la demande) dès que le premier rendu est prêt
  const startAnims = root => {
    if (!A) return;
    $$('canvas[data-anim]', root).forEach(c => {
      A.play(c, c.dataset.anim);
      const A3 = window.KaloAnim3D; if (!A3?.ok) return;
      const wrap = c.parentElement, c3 = document.createElement('canvas');
      c3.className = 'exo-canvas3d'; wrap.appendChild(c3);
      A3.play(c3, c.dataset.anim, { sex: bodySex() }).then(p => {
        if (!p || !c3.isConnected) return;
        requestAnimationFrame(() => { c3.classList.add('ready'); setTimeout(() => c.remove(), 450); wrap.insertAdjacentHTML('beforeend', '<span class="exo-3dhint"><svg viewBox="0 0 24 24"><path d="M4 12a8 4 0 0 0 16 0M4 12a8 4 0 0 1 16 0"/><path d="M17 15l3-3 1.5 3.5"/></svg>Glisse pour tourner</span>'); });
      }).catch(() => c3.remove());
    });
  };
  const videoUrl = e => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.name + ' exécution technique musculation');
  const FIELDS = { w: ['kg', 'Reps'], bw: ['+kg', 'Reps'], time: [null, 'Sec'], cardio: ['Min', 'Km'] };
  const fmtDur = ms => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`; };
  const fmtDurShort = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
  const e1rm = (kg, reps) => (kg > 0 && reps > 0) ? kg * (1 + Math.min(reps, 15) / 30) : 0;
  const isDone = (s, type) => s.done && (type === 'cardio' ? s.kg > 0 : s.reps > 0);
  const setTxt = (s, type) => type === 'time' ? `${r0(s.reps)} s` : type === 'cardio' ? `${r1(s.kg)} min${s.reps ? ' · ' + r1(s.reps) + ' km' : ''}` : type === 'bw' ? `${s.kg ? '+' + r1(s.kg) + ' kg × ' : ''}${r0(s.reps)} reps` : `${r1(s.kg)} kg × ${r0(s.reps)}`;

  /* ---------- Persistance ---------- */
  let saveT;
  const saveActive = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (M.active) Store.put('activeWo', M.active); else Store.del('activeWo'); }, 300); };
  const saveRoutines = () => Store.put('routines', M.routines);
  const saveCustom = () => Store.put('exos', M.custom);
  const savePrograms = () => { Store.put('programs', M.programs); if (M.activeProg) Store.put('activeProg', M.activeProg); else Store.del('activeProg'); };
  function onLoad(all) {
    M.workouts = Object.keys(all).filter(k => k.startsWith('wo:')).map(k => all[k]).sort((a, b) => a.start - b.start);
    M.routines = all.routines || []; M.custom = all.exos || []; M.active = all.activeWo || null;
    M.settings = { rest: 90, ...(all.muscuSettings || {}) };
    M.programs = all.programs || []; M.activeProg = all.activeProg || null; upgradePrograms();
  }

  /* ---------- Calculs ---------- */
  const isWork = (s, t) => isDone(s, t) && !s.w;
  const doneSets = w => w.exercises.reduce((n, x) => n + x.sets.filter(s => isWork(s, exo(x.exId).type)).length, 0);
  const volume = w => w.exercises.reduce((v, x) => { const t = exo(x.exId).type; return v + x.sets.filter(s => isWork(s, t) && (t === 'w' || t === 'bw')).reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0); }, 0);
  const history = (exId, before = Infinity) => M.workouts.filter(w => w.start < before && w.exercises.some(x => x.exId === exId)).map(w => ({ w, sets: w.exercises.filter(x => x.exId === exId).flatMap(x => x.sets).filter(s => isDone(s, exo(exId).type)) })).filter(h => h.sets.length);
  const lastPerf = (exId, before) => { const h = history(exId, before); return h.length ? h[h.length - 1].sets : []; };
  const bestOf = sets => sets.reduce((b, s) => Math.max(b, e1rm(s.kg, s.reps)), 0);
  function recordsOf(w) {
    const out = [];
    for (const x of w.exercises) {
      const t = exo(x.exId).type; if (t !== 'w') continue;
      const sets = x.sets.filter(s => isDone(s, t)); if (!sets.length) continue;
      const prev = history(x.exId, w.start); if (!prev.length) continue;
      const prevBest = Math.max(...prev.map(h => bestOf(h.sets))), prevMax = Math.max(...prev.flatMap(h => h.sets.map(s => s.kg || 0)));
      const best = sets.reduce((b, s) => e1rm(s.kg, s.reps) > e1rm(b.kg, b.reps) ? s : b, sets[0]);
      const maxKg = Math.max(...sets.map(s => s.kg || 0));
      if (e1rm(best.kg, best.reps) > prevBest + 0.01) out.push({ exId: x.exId, kind: '1RM estimé', txt: `${r1(best.kg)} kg × ${r0(best.reps)} → 1RM estimé ${r1(e1rm(best.kg, best.reps))} kg` });
      else if (maxKg > prevMax + 0.01) out.push({ exId: x.exId, kind: 'Charge max', txt: `Charge max ${r1(maxKg)} kg` });
    }
    return out;
  }
  function muscleSets(fromTs) {
    const m = {};
    for (const w of M.workouts.filter(w => w.start >= fromTs)) for (const x of w.exercises) {
      const e = exo(x.exId), n = x.sets.filter(s => isDone(s, e.type)).length; if (!n) continue;
      m[e.muscle] = (m[e.muscle] || 0) + n; for (const s of e.sec || []) m[s] = (m[s] || 0) + n * 0.5;
    }
    return m;
  }
  function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function streakWeeks() {
    const weeks = new Set(M.workouts.map(w => weekStart(w.start).getTime()));
    let wk = weekStart(Date.now()), n = 0;
    if (!weeks.has(wk.getTime())) wk = addDays(wk, -7);
    while (weeks.has(wk.getTime())) { n++; wk = addDays(wk, -7); }
    return n;
  }
  const kcalEstimate = w => Math.round(5 * (currentWeight() || 80) * ((w.end || Date.now()) - w.start) / 36e5);

  /* ---------- Carte musculaire (dessin original) ---------- */
  const bodySex = () => M.settings.body || (S.profile?.sex === 'f' ? 'f' : 'm');
  function bodySVG(side, sets) {
    const fill = k => { const v = sets[k] || 0; return v > 0 ? `rgba(var(--accent-rgb),${(0.3 + Math.min(1, v / 12) * 0.7).toFixed(2)})` : 'rgba(148,163,184,.26)'; };
    return window.KaloBody ? window.KaloBody(side, fill, bodySex()) : '';
  }

  /* ---------- Vue de l'onglet ---------- */
  function view() {
    const now = Date.now(), wk = muscleSets(now - 7 * DAY), month = M.workouts.filter(w => w.start >= now - 30 * DAY).length;
    const vol7 = M.workouts.filter(w => w.start >= now - 7 * DAY).reduce((a, w) => a + volume(w), 0);
    const top = Object.entries(wk).filter(([k]) => k !== 'cardio').sort((a, b) => b[1] - a[1]);
    const recent = M.workouts.slice(-6).reverse();
    return `<h1>Musculation</h1>
      ${M.active ? `<button class="card glow wo-resume" data-action="wo-open"><div><div class="card-title">${ICON.dumbbell}Séance en cours</div><div class="sub" style="margin-top:4px">${esc(M.active.name)} · ${M.active.exercises.length} exercice${M.active.exercises.length > 1 ? 's' : ''} · ${doneSets(M.active)} séries</div></div><b class="num wo-clock" data-clock>${fmtDur(now - M.active.start)}</b></button>` : ''}
      <div class="mu-stats">
        <div class="stat"><b class="num">🔥 ${streakWeeks()}</b><span>sem. d'affilée</span></div>
        <div class="stat"><b class="num">${month}</b><span>séance${month > 1 ? 's' : ''} · 30 j</span></div>
        <div class="stat"><b class="num">${vol7 >= 10000 ? r1(vol7 / 1000) + ' t' : r0(vol7) + ' kg'}</b><span>volume · 7 j</span></div>
      </div>
      ${programCard()}
      <div class="section-title"><h2>Nouvelle séance</h2></div>
      <button class="card mu-start" data-action="wo-free"><div><div class="card-title">${ICON.bolt}Séance libre</div><div class="sub">Ajoute tes exercices au fur et à mesure</div></div><span class="mu-go">${ICON.right}</span></button>
      <div class="section-title"><h2>Mes routines</h2><button class="btn plain" data-action="rt-new">+ Créer</button></div>
      ${M.routines.length ? M.routines.map((r, i) => `<section class="card mu-routine"><div class="grow" data-action="rt-edit" data-i="${i}"><div class="card-title" style="font-size:18px">${esc(r.name)}</div><div class="sub">${r.exercises.length} exercice${r.exercises.length > 1 ? 's' : ''} · ${r.exercises.reduce((a, e) => a + e.sets, 0)} séries · ${esc(r.exercises.slice(0, 3).map(e => exo(e.exId).name).join(', '))}${r.exercises.length > 3 ? '…' : ''}</div></div><button class="btn small" data-action="rt-start" data-i="${i}">Commencer</button></section>`).join('')
        : '<section class="card"><p class="note" style="margin:0">Crée tes routines (ex. « Push », « Jambes & Dos ») pour lancer une séance pré-remplie en un geste, avec tes charges de la dernière fois. Tu peux aussi enregistrer une séance libre comme routine à la fin.</p></section>'}
      <div class="section-title"><h2>Muscles · 7 jours</h2></div>
      <section class="card">
        <div class="seg body-seg"><button data-action="body-sex" data-v="m" class="${bodySex() === 'm' ? 'on' : ''}">Homme</button><button data-action="body-sex" data-v="f" class="${bodySex() === 'f' ? 'on' : ''}">Femme</button></div>
        <div class="body-labels"><span>Face</span><span>Dos</span></div>
        <div class="body-map">${bodySVG('front', wk)}${bodySVG('back', wk)}</div>
        ${top.length ? `<div class="chips" style="justify-content:center;margin-top:12px">${top.slice(0, 8).map(([k, v]) => `<span class="chip mu-chip"><i style="background:rgba(var(--accent-rgb),${(0.25 + Math.min(1, v / 12) * 0.7).toFixed(2)})"></i>${esc(MUS[k] || k)} · ${r1(v)}</span>`).join('')}</div><p class="note" style="text-align:center;margin:8px 0 0">Séries par muscle (une série d'un muscle secondaire compte pour ½). Repère courant : 10 à 20 séries par muscle et par semaine.</p>` : '<p class="note" style="text-align:center;margin:10px 0 0">Aucune séance sur les 7 derniers jours.</p>'}
      </section>
      <div class="section-title"><h2>Volume par semaine</h2></div>
      <section class="card"><div class="chart-wrap" id="mu-vol"></div></section>
      <div class="section-title"><h2>Historique</h2>${M.workouts.length > 6 ? '<button class="btn plain" data-action="wo-all">Tout voir</button>' : ''}</div>
      ${recent.length ? `<section class="card list">${recent.map(w => woItem(w)).join('')}</section>` : '<section class="card"><p class="note" style="margin:0">Tes séances terminées apparaîtront ici.</p></section>'}
      <button class="btn outline block" data-action="exo-lib" style="margin-top:4px">${ICON.search} Exercices & records</button>`;
  }
  const woItem = w => { const pr = recordsOf(w).length; return `<button class="item" data-action="wo-detail" data-id="${w.id}"><span class="thumb mu-thumb">${ICON.dumbbell}</span><div class="grow"><div class="name">${esc(w.name)}</div><div class="sub">${cap(F.short.format(new Date(w.start)))} · ${fmtDurShort(w.end - w.start)} · ${r0(volume(w))} kg${pr ? ` · 🏆 ${pr}` : ''}</div></div><span class="muted">${ICON.right}</span></button>`; };

  function afterRender() {
    const wrap = $('#mu-vol'); if (!wrap) return;
    const wk0 = weekStart(Date.now()), pts = [];
    for (let i = 7; i >= 0; i--) { const s = addDays(wk0, -7 * i), e = addDays(s, 7); const v = M.workouts.filter(w => w.start >= s.getTime() && w.start < e.getTime()).reduce((a, w) => a + volume(w), 0); pts.push({ v, label: F.dm.format(s), n: M.workouts.filter(w => w.start >= s.getTime() && w.start < e.getTime()).length }); }
    if (!pts.some(p => p.v)) { wrap.innerHTML = '<div class="empty small">Pas encore de volume enregistré.</div>'; return; }
    const W = Math.max(260, wrap.clientWidth || 320), H = 170, Mg = { l: 42, r: 6, t: 26, b: 22 }, pw = W - Mg.l - Mg.r, ph = H - Mg.t - Mg.b;
    const max = Math.max(...pts.map(p => p.v)) * 1.1, step = niceStep(max), top = Math.ceil(max / step) * step, y = v => Mg.t + ph - v / top * ph, band = pw / pts.length, bw = Math.min(26, band * 0.6);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    for (let v = 0; v <= top + 1e-9; v += step) s += `<line x1="${Mg.l}" x2="${W - Mg.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${Mg.l - 6}" y="${y(v) + 4}" text-anchor="end">${v >= 1000 ? r1(v / 1000) + 't' : r0(v)}</text>`;
    pts.forEach((p, i) => { const cx = Mg.l + band * i + band / 2; if (p.v) { const yt = y(p.v); s += `<rect x="${cx - bw / 2}" y="${yt}" width="${bw}" height="${Mg.t + ph - yt}" rx="4" style="fill:${i === pts.length - 1 ? 'var(--accent)' : 'rgba(var(--accent-rgb),.55)'}"/>`; } if (i % 2 === 1 || i === pts.length - 1) s += `<text x="${cx}" y="${H - 5}" text-anchor="middle">${i === pts.length - 1 ? 'Cette sem.' : p.label}</text>`; });
    pts.forEach((p, i) => { s += `<rect data-i="${i}" x="${Mg.l + band * i}" y="${Mg.t - 10}" width="${band}" height="${ph + 10}" fill="transparent"/>`; });
    wrap.innerHTML = s + '</svg><div class="chart-tip"></div>';
    bindTip(wrap, i => ({ x: Mg.l + band * i + band / 2, text: `Semaine du ${pts[i].label} · ${r0(pts[i].v)} kg · ${pts[i].n} séance${pts[i].n > 1 ? 's' : ''}` }));
  }

  /* ---------- Bannière « séance en cours » ---------- */
  let woSheetOpen = false;
  function updateBanner() {
    const b = $('#wo-banner'); if (!b) return;
    const show = !!(M.active && !woSheetOpen && S.profile && UI.tab !== 'muscu');
    b.hidden = !show; document.body.classList.toggle('has-wo', show);
    if (show) b.innerHTML = `${ICON.dumbbell}<span>Séance en cours</span><b class="num">${fmtDur(Date.now() - M.active.start)}</b>${ICON.right}`;
    $$('[data-clock]').forEach(e => { if (M.active) e.textContent = fmtDur(Date.now() - M.active.start); });
  }
  setInterval(updateBanner, 1000);

  /* ---------- Séance en cours ---------- */
  function newWorkout(name, exs = [], routineId = null, extra = {}) {
    M.active = { id: uid(), start: Date.now(), name, routineId, prog: extra.prog || null, exercises: exs.map((e, i) => {
      const sets = Array.from({ length: Math.max(1, e.sets || 3) }, () => ({ kg: null, reps: null, done: false }));
      if (extra.warmup && i === 0 && exo(e.exId).type === 'w') sets.unshift({ kg: null, reps: null, done: false, w: 1 }, { kg: null, reps: null, done: false, w: 2 });
      return { uid: uid(), exId: e.exId, sets, tgt: e.min ? { sets: e.sets, min: e.min, max: e.max, rest: e.rest ?? 90, kg: e.kg || null } : null, alt: e.alt || null, note: e.note || '' };
    }), note: extra.note || '' };
    saveActive();
  }
  // Progression : si toutes les séries de la dernière fois ont atteint le haut de la fourchette, +2,5 à 5 % de charge
  function suggestion(exId, tgt, before = Infinity) {
    if (!tgt || exo(exId).type !== 'w') return null;
    const h = history(exId, before); if (!h.length) return null;
    const sets = h[h.length - 1].sets, top = Math.max(...sets.map(x => x.kg || 0)); if (!top) return null;
    const allTop = sets.length >= tgt.sets && sets.every(x => (x.reps || 0) >= tgt.max);
    if (!allTop) return { kg: top, up: false };
    const r = v => Math.round(v * 2) / 2, lo = r(top + Math.max(1, top * 0.025)), hi = r(top + Math.max(2, top * 0.05));
    return { kg: lo, hi, up: true, from: top };
  }
  const REST_TXT = { 0: 'aucun', 45: '45 s', 60: '1 min', 75: '1-1,5 min', 90: '1 min 30', 105: '1,5-2 min', 120: '2 min', 150: '2-3 min', 180: '3 min' };
  const restLabel = s => REST_TXT[s] || (s >= 60 ? r1(s / 60).replace('.', ',') + ' min' : s + ' s');
  const tgtLabel = (t, type) => `${t.sets} × ${t.min === t.max ? t.min : t.min + '-' + t.max}${type === 'time' ? ' s' : ' reps'}`;
  function startGuard(fn) {
    if (M.active) { if (confirm('Une séance est déjà en cours. Veux-tu l\'abandonner pour en commencer une nouvelle ?\n(Annuler = reprendre la séance en cours)')) { M.active = null; saveActive(); fn(); } else openWorkout(); return; }
    fn();
  }
  let audioCtx = null;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22].forEach(t => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2); });
      navigator.vibrate?.([200, 100, 200]);
    } catch (e) { /* ignore */ }
  }
  function openWorkout() {
    if (!M.active) return;
    const sh = makeSheet('Séance en cours');
    let tick;
    const A = () => M.active;
    const meta = () => { const w = A(); return `${w.exercises.length} exercice${w.exercises.length > 1 ? 's' : ''} · ${doneSets(w)} série${doneSets(w) > 1 ? 's' : ''} · ${r0(volume(w))} kg`; };
    const draw = () => {
      const body = sh.el.querySelector('.sheet-body'), st = body.scrollTop, w = A();
      sh.setBody(`
        <div class="wo-top"><button class="wo-name" data-a="rename">${esc(w.name)} ${ICON.edit}</button><div class="row between"><b class="num wo-clock" data-w="elapsed">${fmtDur(Date.now() - w.start)}</b>${w.prog ? '<span class="chip">⏱ Repos selon le programme</span>' : `<button class="chip" data-a="restcfg">⏱ Repos ${M.settings.rest} s</button>`}</div><div class="sub" data-w="meta">${meta()}</div>${w.note ? `<div class="wo-note">${esc(w.note)}</div>` : ''}</div>
        ${w.exercises.map((x, xi) => exCard(x, xi, w)).join('')}
        <button class="btn ghost block" data-a="addex" style="margin:4px 0 12px">+ Ajouter des exercices</button>
        <button class="btn danger block" data-a="cancel">Abandonner la séance</button>`);
      body.scrollTop = st;
      drawFoot();
    };
    const exCard = (x, xi, w) => {
      const e = exo(x.exId), [fa, fb] = FIELDS[e.type] || FIELDS.w, prev = lastPerf(x.exId, w.start), tg = x.tgt, sg = suggestion(x.exId, tg, w.start);
      let wi = 0;
      return `<section class="card wo-ex"><div class="row between" style="align-items:flex-start"><button class="wo-ex-info" data-a="info" data-id="${e.id}">${thumb(e.id)}</button><div class="grow" data-a="info" data-id="${e.id}"><div class="wo-ex-name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${esc(EQ[e.equip] || '')}</div>${tg ? `<div class="wo-tgt">🎯 ${tgtLabel(tg, e.type)} · ${tg.rest ? 'repos ' + restLabel(tg.rest) : 'sans repos'}${x.note ? ' · ' + esc(x.note) : ''}</div>` : ''}${sg?.up ? `<div class="wo-up">🔼 Tout au max la dernière fois (${r1(sg.from)} kg) : passe à <b>${r1(sg.kg)}</b>-${r1(sg.hi)} kg</div>` : ''}${x.alt ? `<button class="chip wo-alt" data-a="alt" data-x="${xi}">↔ ${esc(exo(x.alt).name)}</button>` : ''}</div>
        <div class="row" style="gap:0"><button class="icon-btn" data-a="up" data-x="${xi}" aria-label="Monter" ${xi ? '' : 'disabled style="opacity:.25"'}>${ICON.left.replace('M15 5l-7 7 7 7', 'M6 15l6-6 6 6')}</button><button class="icon-btn" data-a="rmex" data-x="${xi}" aria-label="Retirer" style="color:var(--danger)">${ICON.close}</button></div></div>
        <div class="wo-table ${fa ? '' : 'one'}"><div class="wo-row head"><span>Série</span><span>Précédent</span>${fa ? `<span>${fa}</span>` : ''}<span>${fb}</span><span></span></div>
        ${x.sets.map((s, si) => {
          if (s.w) { const base = sg?.kg || (prev[0]?.kg) || tg?.kg || 0, wk = base ? Math.round(base * (s.w === 1 ? 0.5 : 0.7) * 2) / 2 : ''; return `<div class="wo-row warm ${s.done ? 'done' : ''}" data-x="${xi}" data-s="${si}"><span class="set-n">É</span><span class="prev">Échauffement</span>${fa ? `<input class="wo-in" data-f="kg" inputmode="decimal" value="${s.kg ?? ''}" placeholder="${wk}" data-ph="${wk}">` : ''}<input class="wo-in" data-f="reps" inputmode="decimal" value="${s.reps ?? ''}" placeholder="${s.w === 1 ? 10 : 5}" data-ph="${s.w === 1 ? 10 : 5}"><button class="set-check" data-a="check" aria-label="Valider l'échauffement">${ICON.check}</button></div>`; }
          const n = wi++, p = prev[n] || prev[prev.length - 1];
          const pa = sg ? sg.kg : p ? (e.type === 'time' ? '' : p.kg ?? '') : tg?.kg ?? '', pb = p ? p.reps ?? '' : tg ? tg.min : '';
          return `<div class="wo-row ${s.done ? 'done' : ''}" data-x="${xi}" data-s="${si}"><span class="set-n">${n + 1}</span><span class="prev">${p ? esc(setTxt(p, e.type)) : '—'}</span>${fa ? `<input class="wo-in" data-f="kg" inputmode="decimal" value="${s.kg ?? ''}" placeholder="${pa}" data-ph="${pa}">` : ''}<input class="wo-in" data-f="reps" inputmode="decimal" value="${s.reps ?? ''}" placeholder="${pb}" data-ph="${pb}"><button class="set-check" data-a="check" aria-label="Valider la série">${ICON.check}</button></div>`; }).join('')}
        </div><div class="wo-ex-foot"><button data-a="addset" data-x="${xi}">+ Série</button>${x.sets.filter(z => !z.w).length > 1 ? `<button data-a="rmset" data-x="${xi}">− Série</button>` : ''}</div></section>`;
    };
    const drawFoot = () => {
      const r = M.rest, left = r ? Math.max(0, r.end - Date.now()) : 0;
      sh.setFoot(`${r ? `<div class="rest-bar"><div class="rest-fill" style="width:${(left / (r.total * 1000) * 100).toFixed(1)}%"></div><span class="rest-txt">Repos <b class="num" data-w="rest">${fmtDur(left)}</b></span><button data-a="rest-" class="chip">−15</button><button data-a="rest+" class="chip">+15</button><button data-a="rest-skip" class="chip">Passer</button></div>` : ''}<button class="btn grow" data-a="finish">Terminer la séance</button>`);
      sh.el.querySelector('.sheet-foot .inner').style.flexWrap = 'wrap';
    };
    const refreshMeta = () => { const m = $('[data-w="meta"]', sh.body); if (m) m.textContent = meta(); };
    tick = setInterval(() => {
      const el = $('[data-w="elapsed"]', sh.body); if (el && A()) el.textContent = fmtDur(Date.now() - A().start);
      if (M.rest) {
        const left = M.rest.end - Date.now(), t = $('[data-w="rest"]', sh.foot), f = $('.rest-fill', sh.foot);
        if (left <= 0) { M.rest = null; beep(); toast('Repos terminé : série suivante 💪'); drawFoot(); }
        else { if (t) t.textContent = fmtDur(left); if (f) f.style.width = (left / (M.rest.total * 1000) * 100).toFixed(1) + '%'; }
      }
    }, 250);
    sh.body.addEventListener('input', e => {
      const inp = e.target.closest('.wo-in'); if (!inp) return;
      const row = inp.closest('.wo-row'), s = A().exercises[+row.dataset.x].sets[+row.dataset.s];
      s[inp.dataset.f] = num(inp.value); saveActive(); refreshMeta();
    });
    sh.body.addEventListener('focusin', e => { const inp = e.target.closest('.wo-in'); if (inp) setTimeout(() => inp.select?.(), 0); });
    sh.body.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, w = A(), xi = +b.dataset.x;
      if (a === 'check') {
        const row = b.closest('.wo-row'), x = w.exercises[+row.dataset.x], s = x.sets[+row.dataset.s], t = exo(x.exId).type;
        if (!s.done) {
          $$('.wo-in', row).forEach(inp => { if (inp.value === '' && inp.dataset.ph !== '') { inp.value = inp.dataset.ph; s[inp.dataset.f] = num(inp.dataset.ph); } });
          if (!isDone({ ...s, done: true }, t) || (t === 'w' && s.kg == null)) { toast(t === 'cardio' ? 'Indique la durée' : t === 'time' ? 'Indique la durée' : 'Indique la charge et les répétitions'); return; }
          s.done = true; row.classList.add('done');
          try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume?.(); } catch (err) { /* ignore */ }
          const rs = s.w ? 60 : x.tgt ? x.tgt.rest : M.settings.rest;
          if (t !== 'cardio' && rs > 0) { M.rest = { end: Date.now() + rs * 1000, total: rs }; drawFoot(); }
        } else { s.done = false; row.classList.remove('done'); }
        saveActive(); refreshMeta(); return;
      }
      if (a === 'info') { openExercise(b.dataset.id); return; }
      if (a === 'alt') { const x = w.exercises[xi]; [x.exId, x.alt] = [x.alt, x.exId]; saveActive(); draw(); return; }
      if (a === 'addset') { const x = w.exercises[xi], last = x.sets[x.sets.length - 1]; x.sets.push({ kg: last?.kg ?? null, reps: last?.reps ?? null, done: false }); saveActive(); draw(); }
      if (a === 'rmset') { const ss = w.exercises[xi].sets; if (ss.filter(z => !z.w).length > 1) { ss.pop(); saveActive(); draw(); } }
      if (a === 'rmex') { if (confirm(`Retirer « ${exo(w.exercises[xi].exId).name} » de la séance ?`)) { w.exercises.splice(xi, 1); saveActive(); draw(); } }
      if (a === 'up' && xi > 0) { [w.exercises[xi - 1], w.exercises[xi]] = [w.exercises[xi], w.exercises[xi - 1]]; saveActive(); draw(); }
      if (a === 'addex') openPicker(ids => { ids.forEach(id => w.exercises.push({ uid: uid(), exId: id, sets: Array.from({ length: 3 }, () => ({ kg: null, reps: null, done: false })) })); saveActive(); draw(); });
      if (a === 'rename') { const n = prompt('Nom de la séance', w.name); if (n && n.trim()) { w.name = n.trim(); saveActive(); draw(); } }
      if (a === 'restcfg') { const opts = [0, 60, 90, 120, 150, 180]; M.settings.rest = opts[(opts.indexOf(M.settings.rest) + 1) % opts.length]; Store.put('muscuSettings', M.settings); b.textContent = `⏱ Repos ${M.settings.rest ? M.settings.rest + ' s' : 'désactivé'}`; }
      if (a === 'cancel') { if (confirm('Abandonner cette séance ? Rien ne sera enregistré.')) { M.active = null; M.rest = null; saveActive(); closeSheet(1, () => toast('Séance abandonnée')); } }
    });
    sh.foot.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'rest-' && M.rest) { M.rest.end -= 15000; drawFoot(); }
      if (a === 'rest+' && M.rest) { M.rest.end += 15000; M.rest.total = Math.max(M.rest.total, Math.round((M.rest.end - Date.now()) / 1000)); drawFoot(); }
      if (a === 'rest-skip') { M.rest = null; drawFoot(); }
      if (a === 'finish') finishWorkout();
    });
    woSheetOpen = true; updateBanner();
    openSheet(sh.el, () => { clearInterval(tick); woSheetOpen = false; updateBanner(); });
    draw();
    if (!A().exercises.length) setTimeout(() => $('[data-a="addex"]', sh.body)?.click(), 250);
  }
  function finishWorkout() {
    const w = M.active; if (!w) return;
    const n = doneSets(w);
    if (!n) { if (confirm('Aucune série validée. Abandonner la séance ?')) { M.active = null; M.rest = null; saveActive(); closeSheet(1); } return; }
    const pending = w.exercises.reduce((a, x) => a + x.sets.filter(s => !s.done && !s.w).length, 0);
    if (pending && !confirm(`${pending} série${pending > 1 ? 's non validées seront ignorées' : ' non validée sera ignorée'}. Terminer la séance ?`)) return;
    const fin = { ...w, end: Date.now(), exercises: w.exercises.map(x => ({ exId: x.exId, sets: x.sets.filter(s => isWork(s, exo(x.exId).type)).map(s => ({ kg: s.kg, reps: s.reps, done: true })) })).filter(x => x.sets.length) };
    M.workouts.push(fin); M.workouts.sort((a, b) => a.start - b.start); Store.put('wo:' + fin.id, fin);
    M.active = null; M.rest = null; saveActive();
    UI.tab = 'muscu';
    closeSheet(1, () => openSummary(fin, true));
  }
  function openSummary(w, fresh) {
    const recs = recordsOf(w), ms = {};
    for (const x of w.exercises) { const e = exo(x.exId); ms[e.muscle] = (ms[e.muscle] || 0) + x.sets.length; }
    const sh = makeSheet(fresh ? 'Séance terminée 💪' : cap(F.day.format(new Date(w.start))));
    sh.setBody(`
      <div class="wo-sum-head"><div class="card-title" style="font-size:22px">${esc(w.name)}</div><div class="sub">${cap(F.day.format(new Date(w.start)))} · ${new Date(w.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div>
      <div class="stats" style="margin-bottom:14px"><div class="stat"><b class="num">${fmtDurShort(w.end - w.start)}</b><span>durée</span></div><div class="stat"><b class="num">${r0(volume(w))} kg</b><span>volume soulevé</span></div><div class="stat"><b class="num">${doneSets(w)}</b><span>séries</span></div><div class="stat"><b class="num">≈ ${kcalEstimate(w)}</b><span>kcal (estimation)</span></div></div>
      ${recs.length ? `<section class="card wo-recs"><div class="card-title" style="font-size:18px;margin-bottom:8px">🏆 ${recs.length} record${recs.length > 1 ? 's' : ''} battu${recs.length > 1 ? 's' : ''}</div>${recs.map(r => `<div class="vline"><span><b>${esc(exo(r.exId).name)}</b><br><span class="sub">${esc(r.txt)}</span></span></div>`).join('')}</section>` : ''}
      <div class="chips" style="margin-bottom:12px">${Object.entries(ms).map(([k, v]) => `<span class="chip">${esc(MUS[k] || k)} · ${v}</span>`).join('')}</div>
      ${w.exercises.map(x => { const e = exo(x.exId); return `<section class="card wo-done-ex"><div class="wo-ex-name">${esc(e.name)}</div>${x.sets.map((s, i) => `<div class="vline small"><span class="muted">Série ${i + 1}</span><b class="num">${esc(setTxt(s, e.type))}</b></div>`).join('')}</section>`; }).join('')}
      <p class="note">${fresh ? 'Les kcal de la séance sont une estimation (MET 5) donnée à titre indicatif ; elles ne sont pas ajoutées au bilan : ta montre les compte déjà.' : ''}</p>`);
    sh.setFoot(`${fresh && !w.routineId && !w.prog ? '<button class="btn outline" data-a="asroutine">Créer une routine</button>' : !fresh ? '<button class="btn danger" data-a="del">Supprimer</button><button class="btn outline" data-a="repeat">Refaire</button>' : ''}<button class="btn grow" data-a="close">${fresh ? 'Super !' : 'Fermer'}</button>`);
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'close') closeSheet(1);
      if (a === 'asroutine') { const n = prompt('Nom de la routine', w.name === 'Séance libre' ? '' : w.name); if (n && n.trim()) { M.routines.push({ id: uid(), name: n.trim(), exercises: w.exercises.map(x => ({ exId: x.exId, sets: x.sets.length })) }); saveRoutines(); toast('Routine créée ✓'); closeSheet(1); } }
      if (a === 'del') { if (confirm('Supprimer cette séance de l\'historique ?')) { M.workouts = M.workouts.filter(x => x.id !== w.id); Store.del('wo:' + w.id); closeAll(() => toast('Séance supprimée')); } }
      if (a === 'repeat') closeAll(() => startGuard(() => { newWorkout(w.name, w.exercises.map(x => ({ exId: x.exId, sets: x.sets.length })), w.routineId); openWorkout(); }));
    };
    openSheet(sh.el);
  }

  /* ---------- Sélecteur d'exercices ---------- */
  function openPicker(onDone) {
    const sh = makeSheet('Ajouter des exercices');
    const sel = []; let q = '', mus = '';
    const recentIds = [...new Set(M.workouts.slice().reverse().flatMap(w => w.exercises.map(x => x.exId)))].slice(0, 8);
    const draw = () => {
      const words = norm(q).split(/\s+/).filter(Boolean);
      const list = exos().filter(e => (!mus || e.muscle === mus || (e.sec || []).includes(mus) && mus !== 'cardio') && words.every(w => norm(e.name + ' ' + (MUS[e.muscle] || '') + ' ' + (EQ[e.equip] || '')).includes(w)));
      const recent = !q && !mus ? recentIds.map(exo) : [];
      const item = e => `<div class="item pick ${sel.includes(e.id) ? 'on' : ''}" data-id="${e.id}"><button class="pick-info" data-info="${e.id}" aria-label="Voir l'exercice">${thumb(e.id)}<i>i</i></button><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${esc(EQ[e.equip] || '')}</div></div><span class="meal-check ${sel.includes(e.id) ? 'on' : ''}">${ICON.check}</span></div>`;
      $('[data-w="list"]', sh.body).innerHTML = (recent.length ? `<h3>Récents</h3><section class="card list">${recent.map(item).join('')}</section><h3>Tous les exercices</h3>` : '') + (list.length ? `<section class="card list">${list.map(item).join('')}</section>` : '<div class="empty small">Aucun exercice. Crée-le avec le bouton ci-dessus.</div>');
      $$('[data-mus]', sh.body).forEach(c => c.classList.toggle('chip-on', c.dataset.mus === mus));
      sh.setFoot(sel.length ? `<button class="btn grow" data-a="ok">Ajouter ${sel.length} exercice${sel.length > 1 ? 's' : ''}</button>` : '');
    };
    sh.setBody(`<form class="searchbar"><input type="search" placeholder="Rechercher un exercice" autocomplete="off"></form>
      <div class="mu-filter"><button type="button" class="chip" data-mus="">Tous</button>${Object.entries(MUS).map(([k, v]) => `<button type="button" class="chip" data-mus="${k}">${esc(v)}</button>`).join('')}</div>
      <button class="btn outline block small" data-a="create" style="margin:4px 0 12px">+ Créer un exercice</button>
      <div data-w="list"></div>`);
    $('form', sh.body).onsubmit = e => { e.preventDefault(); $('input', sh.body).blur(); };
    $('input', sh.body).addEventListener('input', e => { q = e.target.value; draw(); });
    sh.body.addEventListener('click', e => {
      const m = e.target.closest('[data-mus]'); if (m) { mus = m.dataset.mus; draw(); return; }
      if (e.target.closest('[data-a="create"]')) return openExoForm(id => { sel.push(id); draw(); });
      const inf = e.target.closest('[data-info]'); if (inf) return openExercise(inf.dataset.info);
      const it = e.target.closest('.pick'); if (it) { const id = it.dataset.id, i = sel.indexOf(id); if (i < 0) sel.push(id); else sel.splice(i, 1); draw(); }
    });
    sh.foot.onclick = e => { if (e.target.closest('[data-a="ok"]')) { const ids = sel.slice(); closeSheet(1, () => onDone(ids)); } };
    openSheet(sh.el); draw();
  }
  function openExoForm(onSaved) {
    const sh = makeSheet('Créer un exercice');
    sh.setBody(`<section class="card stack"><label class="field"><span>Nom</span><input type="text" data-f="n" placeholder="ex. Développé Arnold"></label>
      <label class="field"><span>Muscle principal</span><select data-f="m">${Object.entries(MUS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
      <label class="field"><span>Équipement</span><select data-f="e">${Object.entries(EQ).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
      <label class="field"><span>Type de suivi</span><select data-f="t"><option value="w">Charge × répétitions</option><option value="bw">Poids du corps (+ lest)</option><option value="time">Durée (secondes)</option><option value="cardio">Cardio (minutes + km)</option></select></label></section>`);
    sh.setFoot('<button class="btn grow" data-a="save">Créer</button>');
    sh.foot.onclick = e => {
      if (!e.target.closest('[data-a="save"]')) return;
      const g = f => $(`[data-f="${f}"]`, sh.body).value.trim(); if (!g('n')) { toast('Indique un nom'); return; }
      const ex = { id: 'c-' + uid(), name: g('n'), muscle: g('m'), sec: [], equip: g('e'), type: g('t') };
      M.custom.push(ex); saveCustom(); closeSheet(1, () => onSaved?.(ex.id));
    };
    openSheet(sh.el);
  }

  /* ---------- Routines ---------- */
  function openRoutine(i) {
    const r = i == null ? { id: uid(), name: '', exercises: [] } : JSON.parse(JSON.stringify(M.routines[i]));
    const sh = makeSheet(i == null ? 'Nouvelle routine' : 'Modifier la routine');
    const draw = () => {
      sh.setBody(`<section class="card"><label class="field"><span>Nom de la routine</span><input type="text" data-f="name" value="${esc(r.name)}" placeholder="ex. Push, Jambes & Dos…"></label></section>
        ${r.exercises.length ? `<section class="card list">${r.exercises.map((e, k) => `<div class="item"><div class="grow"><div class="name">${esc(exo(e.exId).name)}</div><div class="sub">${esc(MUS[exo(e.exId).muscle] || '')}</div></div>
          <div class="row" style="gap:4px"><button class="chip" data-a="minus" data-k="${k}">−</button><b class="num" style="min-width:58px;text-align:center">${e.sets} série${e.sets > 1 ? 's' : ''}</b><button class="chip" data-a="plus" data-k="${k}">+</button><button class="icon-btn" data-a="del" data-k="${k}" style="color:var(--danger)">${ICON.close}</button></div></div>`).join('')}</section>` : '<p class="note">Ajoute les exercices de ta routine.</p>'}
        <button class="btn ghost block" data-a="add">+ Ajouter des exercices</button>`);
      $('[data-f="name"]', sh.body).addEventListener('input', e => { r.name = e.target.value; });
    };
    sh.body.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const k = +b.dataset.k;
      if (b.dataset.a === 'minus') r.exercises[k].sets = Math.max(1, r.exercises[k].sets - 1);
      if (b.dataset.a === 'plus') r.exercises[k].sets = Math.min(12, r.exercises[k].sets + 1);
      if (b.dataset.a === 'del') r.exercises.splice(k, 1);
      if (b.dataset.a === 'add') return openPicker(ids => { ids.forEach(id => r.exercises.push({ exId: id, sets: 3 })); draw(); });
      draw();
    });
    sh.setFoot(`${i != null ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">Enregistrer</button>`);
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'del') { if (confirm('Supprimer cette routine ?')) { M.routines.splice(i, 1); saveRoutines(); closeSheet(1, () => toast('Routine supprimée')); } return; }
      if (!r.name.trim()) { toast('Donne un nom à la routine'); return; }
      if (!r.exercises.length) { toast('Ajoute au moins un exercice'); return; }
      r.name = r.name.trim(); if (i == null) M.routines.push(r); else M.routines[i] = r; saveRoutines(); closeSheet(1, () => toast('Routine enregistrée ✓'));
    };
    draw(); openSheet(sh.el);
  }

  /* ---------- Historique complet & exercices ---------- */
  function openAll() {
    const sh = makeSheet('Historique des séances');
    const byMonth = {};
    M.workouts.slice().reverse().forEach(w => { const k = cap(F.month.format(new Date(w.start))); (byMonth[k] = byMonth[k] || []).push(w); });
    sh.setBody(Object.entries(byMonth).map(([m, ws]) => `<h3>${esc(m)} · ${ws.length} séance${ws.length > 1 ? 's' : ''}</h3><section class="card list">${ws.map(woItem).join('')}</section>`).join('') || '<div class="empty">Aucune séance.</div>');
    sh.body.addEventListener('click', e => { const b = e.target.closest('[data-action="wo-detail"]'); if (b) { e.stopPropagation(); const w = M.workouts.find(x => x.id === b.dataset.id); if (w) openSummary(w, false); } });
    openSheet(sh.el);
  }
  function openLibrary() {
    const sh = makeSheet('Exercices & records'); let q = '', mus = '';
    const draw = () => {
      const words = norm(q).split(/\s+/).filter(Boolean);
      const list = exos().filter(e => (!mus || e.muscle === mus) && words.every(w => norm(e.name).includes(w)));
      const withH = list.map(e => ({ e, h: history(e.id) })).sort((a, b) => b.h.length - a.h.length);
      $('[data-w="list"]', sh.body).innerHTML = `<section class="card list">${withH.map(({ e, h }) => { const best = e.type === 'w' ? Math.max(0, ...h.map(x => bestOf(x.sets))) : 0; return `<button class="item" data-id="${e.id}">${thumb(e.id)}<div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${h.length ? `${h.length} séance${h.length > 1 ? 's' : ''}${best ? ` · 1RM est. ${r1(best)} kg` : ''}` : 'jamais fait'}</div></div><span class="muted">${ICON.right}</span></button>`; }).join('')}</section>`;
      $$('[data-mus]', sh.body).forEach(c => c.classList.toggle('chip-on', c.dataset.mus === mus));
    };
    sh.setBody(`<form class="searchbar"><input type="search" placeholder="Rechercher un exercice" autocomplete="off"></form><div class="mu-filter"><button type="button" class="chip" data-mus="">Tous</button>${Object.entries(MUS).map(([k, v]) => `<button type="button" class="chip" data-mus="${k}">${esc(v)}</button>`).join('')}</div><div data-w="list"></div>`);
    $('form', sh.body).onsubmit = e => { e.preventDefault(); };
    $('input', sh.body).addEventListener('input', e => { q = e.target.value; draw(); });
    sh.body.addEventListener('click', e => { const m = e.target.closest('[data-mus]'); if (m) { mus = m.dataset.mus; draw(); return; } const it = e.target.closest('.item[data-id]'); if (it) openExercise(it.dataset.id); });
    openSheet(sh.el); draw();
  }
  function openExercise(id) {
    const e = exo(id), h = history(id), sh = makeSheet(e.name);
    const all = h.flatMap(x => x.sets);
    const best = all.reduce((b, s) => e1rm(s.kg, s.reps) > e1rm(b?.kg, b?.reps) ? s : b, null);
    const maxKg = all.length ? Math.max(...all.map(s => s.kg || 0)) : 0, maxReps = all.length ? Math.max(...all.map(s => s.reps || 0)) : 0;
    const bestVolSet = all.reduce((b, s) => (s.kg || 0) * (s.reps || 0) > (b ? b.kg * b.reps : 0) ? s : b, null);
    const mfill = k => k === e.muscle ? '#FF3446' : (e.sec || []).includes(k) ? '#FF8A3D' : 'rgba(148,163,184,.22)';
    const front = window.KaloBody ? window.KaloBody('front', mfill, bodySex()) : '', back = window.KaloBody ? window.KaloBody('back', mfill, bodySex()) : '';
    sh.setBody(`<section class="card exo-hero">${anim(id)}</section>
      <a class="btn outline block exo-video" href="${videoUrl(e)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" style="fill:currentColor;stroke:none"/></svg>Voir une vidéo du mouvement</a>
      <section class="card"><div class="row between" style="margin-bottom:8px"><div class="card-title" style="font-size:18px">Muscles travaillés</div><div class="exo-legend"><i style="background:#FF3446"></i>Principal <i style="background:#FF8A3D"></i>Secondaire</div></div>
        <div class="body-map exo-map">${front}${back}</div>
        <div class="vline"><span class="muted">Principal</span><b>${esc(MUS[e.muscle] || '–')}</b></div>
        ${e.sec?.length ? `<div class="vline"><span class="muted">Secondaires</span><b style="text-align:right">${e.sec.map(s => esc(MUS[s] || s)).join(', ')}</b></div>` : ''}
        <div class="vline" style="border-bottom:0"><span class="muted">Équipement</span><b>${esc(EQ[e.equip] || '–')}</b></div></section>
      <h3>Mes performances</h3>
      <div class="stats" style="margin-bottom:14px">${e.type === 'w' ? `<div class="stat"><b class="num">${best ? r1(e1rm(best.kg, best.reps)) + ' kg' : '–'}</b><span>1RM estimé (record)</span></div><div class="stat"><b class="num">${maxKg ? r1(maxKg) + ' kg' : '–'}</b><span>charge max</span></div><div class="stat"><b class="num">${bestVolSet ? r1(bestVolSet.kg) + '×' + r0(bestVolSet.reps) : '–'}</b><span>meilleure série (volume)</span></div>` : `<div class="stat"><b class="num">${maxReps ? r0(maxReps) : '–'}</b><span>${e.type === 'time' ? 'secondes max' : e.type === 'cardio' ? 'km max' : 'reps max'}</span></div>`}<div class="stat"><b class="num">${h.length}</b><span>séance${h.length > 1 ? 's' : ''}</span></div></div>
      ${e.type === 'w' && h.length ? '<section class="card"><div class="card-title" style="font-size:17px;margin-bottom:6px">Progression du 1RM estimé</div><div class="chart-wrap" id="ex-chart"></div><p class="note" style="margin:6px 0 0">1RM estimé = charge × (1 + reps / 30), formule d\'Epley. Utile pour comparer des séries faites avec des répétitions différentes.</p></section>' : ''}
      <h3>Historique</h3>${h.length ? h.slice().reverse().slice(0, 15).map(x => `<section class="card wo-done-ex"><div class="sub" style="margin-bottom:6px">${cap(F.short.format(new Date(x.w.start)))} · ${esc(x.w.name)}</div>${x.sets.map((s, i) => `<div class="vline small"><span class="muted">Série ${i + 1}</span><b class="num">${esc(setTxt(s, e.type))}</b></div>`).join('')}</section>`).join('') : '<p class="note">Pas encore fait.</p>'}
      ${id.startsWith('c-') ? '<button class="btn danger block" data-a="delex">Supprimer cet exercice personnalisé</button>' : ''}
      <p class="note">Animation Kalo : schéma du mouvement, l'appareil de ta salle peut différer. La vidéo montre la version exacte.</p>`);
    requestAnimationFrame(() => startAnims(sh.body));
    sh.body.addEventListener('click', ev => { if (ev.target.closest('[data-a="delex"]') && confirm('Supprimer cet exercice ? Il restera visible dans l\'historique.')) { M.custom = M.custom.filter(x => x.id !== id); saveCustom(); closeSheet(1); } });
    openSheet(sh.el);
    const wrap = $('#ex-chart', sh.body); if (!wrap) return;
    const pts = h.map(x => ({ t: x.w.start, v: bestOf(x.sets) })).filter(p => p.v > 0);
    if (!pts.length) return;
    requestAnimationFrame(() => {
      const W = Math.max(260, wrap.clientWidth || 320), H = 180, Mg = { l: 40, r: 12, t: 26, b: 22 }, pw = W - Mg.l - Mg.r, ph = H - Mg.t - Mg.b;
      const t0 = pts[0].t - DAY, t1 = pts[pts.length - 1].t + DAY, x = t => Mg.l + (t - t0) / (t1 - t0) * pw;
      let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v)); const pad = Math.max(2, (hi - lo) * 0.15); lo -= pad; hi += pad;
      const step = niceStep(hi - lo); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; const y = v => Mg.t + ph - (v - lo) / (hi - lo) * ph;
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
      for (let v = lo; v <= hi + 1e-9; v += step) s += `<line x1="${Mg.l}" x2="${W - Mg.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${Mg.l - 6}" y="${y(v) + 4}" text-anchor="end">${r0(v)}</text>`;
      if (pts.length > 1) s += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ',' + y(p.v).toFixed(1)).join('')}" fill="none" stroke-width="2.5" style="stroke:var(--accent)"/>`;
      pts.forEach(p => { s += `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="4" style="fill:var(--accent)"/>`; });
      s += `<text x="${Mg.l}" y="${H - 5}">${F.dm.format(new Date(pts[0].t))}</text><text x="${W - Mg.r}" y="${H - 5}" text-anchor="end">${F.dm.format(new Date(pts[pts.length - 1].t))}</text>`;
      s += `<rect x="${Mg.l}" y="${Mg.t - 10}" width="${pw}" height="${ph + 10}" fill="transparent"/></svg><div class="chart-tip"></div>`;
      wrap.innerHTML = s;
      bindTip(wrap, null, ev => { const px = ev.clientX - wrap.querySelector('svg').getBoundingClientRect().left; let b = pts[0]; for (const p of pts) if (Math.abs(x(p.t) - px) < Math.abs(x(b.t) - px)) b = p; return { x: x(b.t), text: `${cap(F.short.format(new Date(b.t)))} · ${r1(b.v)} kg` }; });
    });
  }

  /* ---------- Programmes ---------- */
  const DOW = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], DOW_S = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const H = 150, I = 105; // repos : polyarticulaires lourds 2-3 min, isolation 1,5-2 min
  const it = (exId, sets, min, max, rest, more = {}) => ({ exId, sets, min, max, rest, ...more });
  const PRESETS = [{
    id: 'preset-hb5', name: 'Haut / Bas · 5 jours (75 séries)',
    desc: '5 séances par semaine (lundi, mardi, jeudi, vendredi, samedi), chaque muscle 2 fois par semaine, environ 75 séries de travail. Repos mercredi et dimanche.',
    rules: ['Séries à 1-2 répétitions de l\'échec, la dernière de chaque exercice à 0-1.', 'Repos de 2-3 min sur les exercices lourds et de 1,5-2 min sur l\'isolation (le minuteur s\'adapte tout seul).', 'Progression : quand tu atteins le haut de la fourchette sur toutes les séries, ajoute 2,5 à 5 % de charge (Kalo te le propose).', '1 à 2 séries d\'échauffement sur le premier exercice, en plus des séries de travail (ajoutées automatiquement).'],
    days: [
      { dow: 1, name: 'Haut A', items: [it('dc-barre', 3, 6, 8, H), it('tirage-haut-machine', 3, 8, 10, H), it('di-smith', 3, 8, 10, H), it('rowing-smith', 3, 8, 10, H), it('ext-tete-poulie', 4, 10, 12, I)] },
      { dow: 2, name: 'Bas A', items: [it('presse', 4, 8, 10, H), it('leg-ext', 3, 10, 12, I), it('leg-curl-allonge', 3, 8, 12, I), it('mollets-machine', 3, 10, 12, I)] },
      { dow: 4, name: 'Haut B', items: [it('presse-pec', 3, 8, 10, H), it('tirage-unilat-genou', 3, 10, 12, H), it('ecarte-bas-haut', 2, 12, 15, I), it('elev-lat-poulie', 3, 12, 20, I), it('curl-incline', 4, 10, 12, I, { alt: 'curl-bayesien', note: 'ou curl bayésien' })] },
      { dow: 5, name: 'Bas B', items: [it('sdt-roumain', 3, 8, 10, H), it('leg-curl-assis', 3, 10, 12, I), it('presse-pieds-hauts', 3, 10, 12, H), it('mollets-machine', 3, 10, 12, I), it('releve-jambes', 3, 10, 15, I)] },
      { dow: 6, name: 'Épaules, bras, abdos', items: [it('ecarte-inverse', 3, 12, 15, I), it('elev-lat-poulie', 3, 12, 20, I), it('curl-pupitre', 3, 8, 12, I), it('ext-triceps-allonge', 3, 8, 12, I), it('crunch-poulie', 3, 10, 15, I)] },
    ],
  }];
  PRESETS.push({
    id: 'preset-fessiers', v: 2, name: 'Fessiers / Quads / Ischios + haut du corps',
    desc: 'Lundi fessiers, mardi épaules / triceps, jeudi quadriceps, vendredi dos / biceps, samedi ischios. Circuit abdos (×3) à la fin de chaque séance du bas du corps.',
    rules: ['Charges notées dans le programme = charges de départ : Kalo propose d\'augmenter quand tu atteins le haut de la fourchette sur toutes les séries.', 'Hip thrust du lundi : lourd.', 'Abdos à la fin de chaque séance du bas du corps : circuit à faire 3 fois (enchaîne les 5 exercices, puis recommence).'],
    days: [
      { dow: 1, name: 'Fessiers', note: 'Abdos en fin de séance : circuit à faire 3 fois (enchaîne les 5 exercices d\'abdos, puis recommence). Valide une série de chaque exercice à chaque tour.', items: [it('ext-lombaires', 2, 15, 15, 75, { note: 'poids du corps' }), it('sdt-roumain', 3, 8, 10, 150), it('hip-thrust', 3, 6, 8, 150, { note: 'lourd' }), it('step-up', 2, 8, 10, 105), it('kickback-fessier', 2, 15, 20, 105), it('abducteurs', 3, 15, 20, 105), it('abdos-bras-jambes', 3, 10, 10, 0), it('releve-jambes-sol', 3, 10, 10, 0, { note: 'abdos' }), it('battements', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('russian-twist', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('gainage', 3, 60, 60, 60, { note: 'abdos' })] },
      { dow: 4, name: 'Quadriceps', note: 'Abdos en fin de séance : circuit à faire 3 fois (enchaîne les 5 exercices d\'abdos, puis recommence). Valide une série de chaque exercice à chaque tour.', items: [it('squat', 3, 6, 8, 150), it('presse', 3, 8, 10, 120), it('leg-ext', 3, 10, 12, 90), it('bulgare', 2, 10, 10, 105, { note: '10 pas par jambe' }), it('hip-thrust', 3, 8, 8, 120), it('adducteurs', 3, 20, 20, 75), it('abdos-bras-jambes', 3, 10, 10, 0), it('releve-jambes-sol', 3, 10, 10, 0, { note: 'abdos' }), it('battements', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('russian-twist', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('gainage', 3, 60, 60, 60, { note: 'abdos' })] },
      { dow: 6, name: 'Ischios', note: 'Abdos en fin de séance : circuit à faire 3 fois (enchaîne les 5 exercices d\'abdos, puis recommence). Valide une série de chaque exercice à chaque tour.', items: [it('leg-curl-assis', 3, 8, 10, 105), it('sdt-roumain-halt', 3, 10, 10, 120), it('hip-thrust', 3, 8, 10, 120), it('ext-lombaires', 2, 15, 20, 75, { note: 'lesté' }), it('kickback-fessier', 2, 12, 15, 75), it('adducteurs', 3, 20, 20, 75), it('abdos-bras-jambes', 3, 10, 10, 0), it('releve-jambes-sol', 3, 10, 10, 0, { note: 'abdos' }), it('battements', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('russian-twist', 3, 10, 10, 0, { note: 'abdos, 10 de chaque côté' }), it('gainage', 3, 60, 60, 60, { note: 'abdos' })] },
      { dow: 2, name: 'Épaules / Triceps', items: [it('dm-barre', 3, 6, 8, 120, { kg: 14 }), it('elev-lat-poulie', 3, 12, 15, 60), it('ecarte-inverse', 3, 12, 15, 60, { note: 'arrière d\'épaule' }), it('elev-front-corde', 2, 12, 15, 60), it('elev-lat-halt', 3, 12, 15, 60), it('ext-barre-poulie', 3, 12, 15, 60), it('ext-tete-poulie', 2, 10, 12, 60, { note: 'à la corde' })] },
      { dow: 5, name: 'Dos / Biceps', items: [it('tirage-vert', 3, 8, 10, 105, { kg: 45 }), it('rowing-barre', 3, 6, 8, 150, { kg: 51.3, alt: 'rowing-smith', note: 'ou à la Smith' }), it('tirage-horiz-unilat', 3, 8, 10, 120, { kg: 45 }), it('pull-over', 2, 12, 15, 75, { kg: 18 }), it('face-pull', 2, 12, 15, 75), it('ext-lombaires', 3, 10, 20, 75, { note: 'jusqu\'à l\'échec' }), it('curl-barre', 3, 8, 10, 90), it('curl-marteau', 2, 10, 15, 75)] },
    ],
  });
  PRESETS.forEach(p => p.days.sort((a, b) => (a.dow == null ? 9 : (a.dow + 6) % 7) - (b.dow == null ? 9 : (b.dow + 6) % 7)));
  // Copies de programmes proposés non modifiées : mises à jour avec la nouvelle version du modèle
  function upgradePrograms() {
    let changed = false;
    M.programs = M.programs.map(p => { const src = PRESETS.find(x => x.id === p.from); if (!src || p.edited || (p.v || 1) >= (src.v || 1)) return p; changed = true; return { ...JSON.parse(JSON.stringify(src)), id: p.id, from: src.id }; });
    if (changed) savePrograms();
  }
  const prog = () => M.programs.find(p => p.id === M.activeProg) || null;
  const dayLabel = d => d.dow == null ? 'Quand tu veux' : DOW[d.dow];
  const dowOrder = d => d.dow == null ? 9 : (d.dow + 6) % 7;
  const daySets = d => d.items.reduce((a, x) => a + x.sets, 0);
  const progSets = p => p.days.reduce((a, d) => a + daySets(d), 0);
  const doneThisWeek = (p, di) => { const ws = weekStart(Date.now()).getTime(); return M.workouts.some(w => w.start >= ws && w.prog?.pid === p.id && w.prog.day === di); };
  function nextDay(p) {
    const today = new Date().getDay();
    for (let k = 1; k < 8; k++) { const dw = (today + k) % 7, di = p.days.findIndex(d => d.dow === dw); if (di >= 0) return { di, k }; }
    return null;
  }
  let selDow = null; // jour affiché dans la carte programme (null = aujourd'hui)
  const dayDetail = (p, di) => { const d = p.days[di]; return `<div class="prog-lines">${d.items.map(x => { const e = exo(x.exId); return `<div class="prog-line" data-action="exo-info" data-id="${x.exId}">${thumb(x.exId, 'mini')}<span class="grow">${esc(e.name)}${x.note ? ` <em class="muted">(${esc(x.note)})</em>` : ''}</span><b class="num">${x.sets}×${x.min === x.max ? x.min : x.min + '-' + x.max}${e.type === 'time' ? ' s' : ''}</b></div>`; }).join('')}</div>${d.note ? `<p class="note" style="margin:8px 0 0">${esc(d.note)}</p>` : ''}`; };
  function programCard() {
    const p = prog();
    if (!p) return `<div class="section-title"><h2>Mon programme</h2></div>
      <button class="card mu-start prog-empty" data-action="prog-list"><div><div class="card-title">📋 Choisir un programme</div><div class="sub">Programme tout prêt ou le tien : la séance du jour s'affiche ici, avec tes objectifs de séries, de répétitions et de repos.</div></div><span class="mu-go">${ICON.right}</span></button>`;
    const today = new Date().getDay(), sel = selDow ?? today, di = p.days.findIndex(d => d.dow === sel), isToday = sel === today;
    const strip = [1, 2, 3, 4, 5, 6, 0].map(dw => { const i = p.days.findIndex(d => d.dow === dw); const done = i >= 0 && doneThisWeek(p, i);
      return `<button class="pd ${i >= 0 ? 'train' : 'rest'} ${dw === today ? 'today' : ''} ${dw === sel ? 'sel' : ''} ${done ? 'done' : ''}" data-action="prog-day" data-dow="${dw}" aria-label="${DOW[dw]}"><b>${DOW_S[dw]}</b><i>${done ? '✓' : i >= 0 ? '' : '·'}</i></button>`; }).join('');
    const d = di >= 0 ? p.days[di] : null, done = d && doneThisWeek(p, di);
    const free = p.days.map((x, i) => ({ x, i })).filter(o => o.x.dow == null);
    const freeHTML = free.length ? `<div class="prog-free"><div class="small muted">Séances à placer quand tu veux</div><div class="prog-free-row">${free.map(o => `<button class="chip ${doneThisWeek(p, o.i) ? 'chip-done' : ''}" data-action="prog-start" data-d="${o.i}">${doneThisWeek(p, o.i) ? '✓ ' : ''}${esc(o.x.name)}</button>`).join('')}</div></div>` : '';
    let nx = null; if (!d) for (let k = 1; k < 8; k++) { const dw = (sel + k) % 7, i = p.days.findIndex(x => x.dow === dw); if (i >= 0) { nx = { di: i }; break; } }
    return `<div class="section-title"><h2>Mon programme</h2><button class="btn plain" data-action="prog-list">Changer</button></div>
      <section class="card prog-card glow">
        <div class="row between"><button class="prog-name" data-action="prog-view">${esc(p.name)} ${ICON.right}</button></div>
        <div class="prog-strip">${strip}</div>
        ${d ? `<div class="prog-today"><div class="row between"><div class="small muted">${isToday ? "Aujourd'hui · " : ''}${DOW[sel]}${done ? ' · faite cette semaine ✓' : ''}</div>${isToday ? '' : '<button class="btn plain small" data-action="prog-day" data-dow="today">Revenir à aujourd\'hui</button>'}</div>
            <div class="card-title" style="font-size:20px">${esc(d.name)}</div><div class="sub">${d.items.length} exercices · ${daySets(d)} séries</div>
            ${dayDetail(p, di)}
            <button class="btn block ${isToday ? '' : 'outline'}" data-action="prog-start" data-d="${di}" style="margin-top:12px">${done ? 'Refaire la séance' : isToday ? 'Commencer la séance' : `Commencer ${esc(d.name)} maintenant`}</button></div>`
          : `<div class="prog-today"><div class="row between"><div class="small muted">${isToday ? "Aujourd'hui · " : ''}${DOW[sel]}</div>${isToday ? '' : '<button class="btn plain small" data-action="prog-day" data-dow="today">Revenir à aujourd\'hui</button>'}</div>
            <div class="card-title" style="font-size:19px">😴 Jour de repos</div><div class="sub">${nx ? `Séance suivante : ${DOW[p.days[nx.di].dow]} · ${esc(p.days[nx.di].name)}` : ''}</div>
            ${free.length ? '' : `<p class="note" style="margin:8px 0 0">La récupération fait partie du programme : c'est là que le muscle se construit.</p>`}${nx && isToday ? `<button class="btn outline block small" data-action="prog-start" data-d="${nx.di}" style="margin-top:10px">Faire quand même ${esc(p.days[nx.di].name)}</button>` : ''}</div>`}
        ${freeHTML}
      </section>`;
  }
  function startProgDay(di) {
    const p = prog(); if (!p) return; const d = p.days[di]; if (!d) return;
    startGuard(() => { newWorkout(d.name, d.items, null, { prog: { pid: p.id, day: di }, warmup: d.warmup !== false, note: d.note }); openWorkout(); });
  }
  function openProgList() {
    const sh = makeSheet('Programmes');
    const draw = () => {
      const mine = M.programs, installed = new Set(mine.map(p => p.from));
      sh.setBody(`<p class="note" style="margin-top:0">Chaque téléphone a ses propres données : ton programme n'apparaît pas chez les autres utilisateurs de Kalo, et le leur n'apparaît pas chez toi.</p>
        ${mine.length ? `<h3>Mes programmes</h3>${mine.map((p, i) => `<section class="card prog-item ${p.id === M.activeProg ? 'on' : ''}"><div class="grow"><div class="card-title" style="font-size:17px">${esc(p.name)}${p.id === M.activeProg ? ' <span class="pill-on">Actif</span>' : ''}</div><div class="sub">${p.days.length} séance${p.days.length > 1 ? 's' : ''} / semaine · ${progSets(p)} séries · ${p.days.map(d => d.dow == null ? 'libre' : DOW[d.dow].slice(0, 3)).join(', ')}</div>
          <div class="row" style="gap:6px;margin-top:10px">${p.id === M.activeProg ? '<button class="btn small outline" data-a="off">Désactiver</button>' : `<button class="btn small" data-a="on" data-i="${i}">Activer</button>`}<button class="btn small outline" data-a="edit" data-i="${i}">Modifier</button><button class="btn small danger" data-a="del" data-i="${i}">Supprimer</button></div></div></section>`).join('')}` : ''}
        <h3>Programmes proposés</h3>${PRESETS.map((p, i) => `<section class="card prog-item"><div class="grow"><div class="card-title" style="font-size:17px">${esc(p.name)}</div><div class="sub">${esc(p.desc)}</div>
          <button class="btn small ${installed.has(p.id) ? 'outline' : ''}" data-a="install" data-i="${i}" style="margin-top:10px">${installed.has(p.id) ? 'Ajouter une autre copie' : 'Utiliser ce programme'}</button></div></section>`).join('')}
        <button class="btn ghost block" data-a="new" style="margin-top:6px">+ Créer mon propre programme</button>`);
    };
    sh.body.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, i = +b.dataset.i;
      if (a === 'install') { const src = PRESETS[i], cp = JSON.parse(JSON.stringify(src)); cp.id = uid(); cp.from = src.id; M.programs.push(cp); M.activeProg = cp.id; savePrograms(); closeSheet(1, () => toast(`Programme « ${cp.name} » activé ✓`)); return; }
      if (a === 'on') { M.activeProg = M.programs[i].id; savePrograms(); closeSheet(1, () => toast('Programme activé ✓')); return; }
      if (a === 'off') { M.activeProg = null; savePrograms(); draw(); return; }
      if (a === 'del') { const p = M.programs[i]; if (confirm(`Supprimer le programme « ${p.name} » ? Tes séances déjà faites restent dans l'historique.`)) { M.programs.splice(i, 1); if (M.activeProg === p.id) M.activeProg = null; savePrograms(); draw(); } return; }
      if (a === 'edit') return openProgEdit(i, draw);
      if (a === 'new') return openProgEdit(null, draw);
    });
    draw(); openSheet(sh.el);
  }
  function openProgView() {
    const p = prog(); if (!p) return;
    const sh = makeSheet(p.name);
    sh.setBody(`${p.desc ? `<p class="note" style="margin-top:0">${esc(p.desc)}</p>` : ''}
      ${p.days.map((d, di) => `<section class="card prog-day"><div class="row between"><div><div class="small muted">${dayLabel(d)}${doneThisWeek(p, di) ? ' · faite cette semaine ✓' : ''}</div><div class="card-title" style="font-size:18px">${esc(d.name)} <span class="muted small">(${daySets(d)} séries)</span></div></div><button class="btn small" data-a="start" data-d="${di}">Go</button></div>
        ${d.items.map(x => `<div class="prog-line" data-a="info" data-id="${x.exId}">${thumb(x.exId, 'mini')}<span class="grow">${esc(exo(x.exId).name)}${x.note ? ` <em class="muted">(${esc(x.note)})</em>` : ''}</span><b class="num">${x.sets}×${x.min === x.max ? x.min : x.min + '-' + x.max}${exo(x.exId).type === 'time' ? ' s' : ''}${x.kg ? ` · ${r1(x.kg)} kg` : ''}</b></div>`).join('')}${d.note ? `<p class="note" style="margin:8px 0 0">${esc(d.note)}</p>` : ''}</section>`).join('')}
      ${p.rules?.length ? `<section class="card"><div class="card-title" style="font-size:18px;margin-bottom:6px">📏 Règles</div><ol class="prog-rules">${p.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ol></section>` : ''}`);
    sh.setFoot(`<button class="btn outline grow" data-a="edit">Modifier</button>`);
    sh.body.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'start') { const di = +b.dataset.d; closeSheet(1, () => startProgDay(di)); } if (b.dataset.a === 'info') openExercise(b.dataset.id); });
    sh.foot.onclick = e => { if (e.target.closest('[data-a="edit"]')) closeSheet(1, () => openProgEdit(M.programs.findIndex(x => x.id === p.id))); };
    openSheet(sh.el);
  }
  function openProgEdit(i, onSaved) {
    const p = i == null ? { id: uid(), name: '', desc: '', rules: [], days: [{ dow: 1, name: 'Séance A', items: [] }] } : JSON.parse(JSON.stringify(M.programs[i]));
    const sh = makeSheet(i == null ? 'Nouveau programme' : 'Modifier le programme');
    const restOpts = [0, 45, 60, 75, 90, 105, 120, 150, 180];
    const draw = () => {
      const st = sh.el.querySelector('.sheet-body').scrollTop;
      sh.setBody(`<section class="card stack"><label class="field"><span>Nom du programme</span><input type="text" data-f="name" value="${esc(p.name)}" placeholder="ex. Full body 3 jours"></label>
        <label class="field"><span>Règles (une par ligne, facultatif)</span><textarea data-f="rules" rows="3" placeholder="ex. Dernière série à l'échec">${esc((p.rules || []).join('\n'))}</textarea></label></section>
        ${p.days.map((d, di) => `<section class="card prog-edit-day"><div class="row" style="gap:8px"><select data-f="dow" data-d="${di}">${[1, 2, 3, 4, 5, 6, 0].map(v => `<option value="${v}" ${d.dow === v ? 'selected' : ''}>${DOW[v]}</option>`).join('')}<option value="-1" ${d.dow == null ? 'selected' : ''}>Libre</option></select><input type="text" data-f="dname" data-d="${di}" value="${esc(d.name)}" placeholder="Nom de la séance"><button class="icon-btn" data-a="dday" data-d="${di}" style="color:var(--danger)" aria-label="Supprimer la séance">${ICON.close}</button></div>
          ${d.items.map((x, xi) => `<div class="pe-item"><div class="row between"><b class="pe-name">${esc(exo(x.exId).name)}</b><button class="icon-btn" data-a="dex" data-d="${di}" data-x="${xi}" style="color:var(--danger)" aria-label="Retirer">${ICON.close}</button></div>
            <div class="pe-grid"><label><span>Séries</span><input type="number" inputmode="numeric" data-f="sets" data-d="${di}" data-x="${xi}" value="${x.sets}"></label><label><span>Reps min</span><input type="number" inputmode="numeric" data-f="min" data-d="${di}" data-x="${xi}" value="${x.min}"></label><label><span>Reps max</span><input type="number" inputmode="numeric" data-f="max" data-d="${di}" data-x="${xi}" value="${x.max}"></label>
            <label><span>Repos</span><select data-f="rest" data-d="${di}" data-x="${xi}">${restOpts.map(v => `<option value="${v}" ${x.rest === v ? 'selected' : ''}>${restLabel(v)}</option>`).join('')}</select></label></div></div>`).join('')}
          <button class="btn ghost block small" data-a="addex" data-d="${di}">+ Exercices</button></section>`).join('')}
        <button class="btn outline block" data-a="addday">+ Ajouter une séance</button>`);
      sh.el.querySelector('.sheet-body').scrollTop = st;
    };
    sh.body.addEventListener('input', e => {
      const f = e.target.dataset.f, di = +e.target.dataset.d, xi = +e.target.dataset.x; if (!f) return;
      if (f === 'name') p.name = e.target.value; else if (f === 'rules') p.rules = e.target.value.split('\n').map(x => x.trim()).filter(Boolean);
      else if (f === 'dname') p.days[di].name = e.target.value; else if (f === 'dow') p.days[di].dow = +e.target.value < 0 ? null : +e.target.value;
      else if (['sets', 'min', 'max', 'rest'].includes(f)) { const v = num(e.target.value); if (v != null) p.days[di].items[xi][f] = Math.max(f === 'rest' ? 0 : 1, Math.round(v)); }
    });
    sh.body.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, di = +b.dataset.d, xi = +b.dataset.x;
      if (a === 'addday') { const used = new Set(p.days.map(d => d.dow)), dow = [1, 2, 3, 4, 5, 6, 0].find(v => !used.has(v)) ?? null; p.days.push({ dow, name: `Séance ${String.fromCharCode(65 + p.days.length)}`, items: [] }); draw(); }
      if (a === 'dday') { if (p.days.length > 1 && confirm('Supprimer cette séance du programme ?')) { p.days.splice(di, 1); draw(); } }
      if (a === 'dex') { p.days[di].items.splice(xi, 1); draw(); }
      if (a === 'addex') openPicker(ids => { ids.forEach(id => p.days[di].items.push(it(id, 3, 8, 12, exo(id).type === 'w' ? 120 : 90))); draw(); });
    });
    sh.setFoot('<button class="btn grow" data-a="save">Enregistrer</button>');
    sh.foot.onclick = e => {
      if (!e.target.closest('[data-a="save"]')) return;
      $$('select[data-f]', sh.body).forEach(sel => { const di = +sel.dataset.d, xi = +sel.dataset.x; if (sel.dataset.f === 'dow') p.days[di].dow = +sel.value < 0 ? null : +sel.value; if (sel.dataset.f === 'rest') p.days[di].items[xi].rest = +sel.value; });
      if (!p.name.trim()) { toast('Donne un nom au programme'); return; }
      if (!p.days.some(d => d.items.length)) { toast('Ajoute au moins un exercice'); return; }
      const fixed = p.days.filter(d => d.dow != null); if (new Set(fixed.map(d => d.dow)).size < fixed.length) { toast('Deux séances tombent le même jour'); return; }
      p.days.forEach(d => d.items.forEach(x => { if (x.max < x.min) [x.min, x.max] = [x.max, x.min]; }));
      p.days.sort((a, b) => dowOrder(a) - dowOrder(b));
      p.name = p.name.trim(); p.edited = true; if (i == null) { M.programs.push(p); M.activeProg = p.id; } else M.programs[i] = p;
      savePrograms(); closeSheet(1, () => { onSaved?.(); toast(i == null ? 'Programme créé et activé ✓' : 'Programme enregistré ✓'); });
    };
    draw(); openSheet(sh.el);
  }

  /* ---------- Actions exposées ---------- */
  const actions = {
    'wo-open': () => openWorkout(),
    'wo-free': () => startGuard(() => { newWorkout('Séance libre'); openWorkout(); }),
    'rt-start': b => { const r = M.routines[+b.dataset.i]; if (r) startGuard(() => { newWorkout(r.name, r.exercises, r.id); openWorkout(); }); },
    'rt-new': () => openRoutine(null),
    'rt-edit': b => openRoutine(+b.dataset.i),
    'wo-detail': b => { const w = M.workouts.find(x => x.id === b.dataset.id); if (w) openSummary(w, false); },
    'wo-all': () => openAll(),
    'exo-lib': () => openLibrary(),
    'prog-list': () => openProgList(),
    'prog-view': () => openProgView(),
    'prog-start': b => startProgDay(+b.dataset.d),
    'prog-day': b => { const v = b.dataset.dow; selDow = v === 'today' ? null : +v; if (selDow === new Date().getDay()) selDow = null; render(); },
    'exo-info': b => openExercise(b.dataset.id),
    'body-sex': b => { M.settings.body = b.dataset.v; Store.put('muscuSettings', M.settings); render(); },
  };
  const exportData = () => ({ workouts: M.workouts, routines: M.routines, custom: M.custom, settings: M.settings, programs: M.programs, activeProg: M.activeProg });
  async function importData(d) {
    if (!d) return;
    for (const w of d.workouts || []) await Store.put('wo:' + w.id, w);
    await Store.put('routines', d.routines || []); await Store.put('exos', d.custom || []); await Store.put('programs', d.programs || []); if (d.activeProg) await Store.put('activeProg', d.activeProg); if (d.settings) await Store.put('muscuSettings', d.settings);
  }
  const stats = (days = 7) => ({ n: M.workouts.length, streak: streakWeeks(), week: M.workouts.filter(w => w.start >= Date.now() - days * DAY).length,
    prs: M.workouts.reduce((a, w) => a + recordsOf(w).length, 0) });
  return { view, afterRender, actions, onLoad, updateBanner, exportData, importData, stats, M };
};
