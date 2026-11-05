'use strict';
// Module Musculation de Kalo : séances, routines, minuteur de repos, historique, records, statistiques, carte musculaire.
window.KaloMuscuInit = K => {
  const { $, $$, esc, r0, r1, num, uid, cap, dkey, dparse, addDays, today, F, ICON, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, closeAll, niceStep, bindTip, currentWeight } = K;
  const MUS = window.KALO_MUSCLES || {}, EQ = window.KALO_EQUIP || {};
  const BASE = (window.KALO_EXOS || []).map(([id, name, muscle, sec, equip, type]) => ({ id, name, muscle, sec, equip, type }));
  const M = { workouts: [], routines: [], custom: [], active: null, settings: { rest: 90 }, rest: null };
  const DAY = 864e5;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const exos = () => [...BASE, ...M.custom];
  const exo = id => exos().find(e => e.id === id) || { id, name: 'Exercice supprimé', muscle: 'autre', sec: [], equip: 'autre', type: 'w' };
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
  function onLoad(all) {
    M.workouts = Object.keys(all).filter(k => k.startsWith('wo:')).map(k => all[k]).sort((a, b) => a.start - b.start);
    M.routines = all.routines || []; M.custom = all.exos || []; M.active = all.activeWo || null;
    M.settings = { rest: 90, ...(all.muscuSettings || {}) };
  }

  /* ---------- Calculs ---------- */
  const doneSets = w => w.exercises.reduce((n, x) => n + x.sets.filter(s => isDone(s, exo(x.exId).type)).length, 0);
  const volume = w => w.exercises.reduce((v, x) => { const t = exo(x.exId).type; return v + x.sets.filter(s => isDone(s, t) && (t === 'w' || t === 'bw')).reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0); }, 0);
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
  function bodySVG(side, sets) {
    const L = [[45, 26], [30, 32], [23, 38], [20, 52], [18, 70], [15, 88], [14, 100], [14, 110], [19, 111], [21, 100], [24, 84], [27, 68], [31, 56], [34, 62], [35, 80], [34, 96], [33, 112], [34, 135], [36, 150], [35, 165], [37, 185], [39, 198], [37, 205], [47, 205], [47, 196], [47, 180], [48, 165], [47, 150], [48, 132], [49, 115], [50, 110]];
    const pts = [...L, ...L.slice(0, -1).reverse().map(([x, y]) => [100 - x, y])];
    const fill = k => { const v = sets[k] || 0; return v > 0 ? `rgba(var(--accent-rgb),${(0.25 + Math.min(1, v / 12) * 0.7).toFixed(2)})` : 'rgba(148,163,184,.16)'; };
    const sym = (k, f) => f(false) + f(true);
    const el = (k, cx, cy, rx, ry, rot = 0) => sym(k, m => { const x = m ? 100 - cx : cx, r = m ? -rot : rot; return `<ellipse data-m="${k}" cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${cy})" style="fill:${fill(k)}"/>`; });
    const poly = (k, p) => sym(k, m => `<polygon data-m="${k}" points="${p.map(([x, y]) => `${m ? 100 - x : x},${y}`).join(' ')}" style="fill:${fill(k)}"/>`);
    let s = `<svg viewBox="0 0 100 212" class="body-svg" aria-label="Muscles ${side === 'front' ? 'face' : 'dos'}"><polygon points="${pts.map(p => p.join(',')).join(' ')}" class="body-base"/><circle cx="50" cy="15" r="10" class="body-base"/>`;
    if (side === 'front') {
      s += poly('trapezes', [[44.5, 27], [35, 33], [44.5, 34]]) + el('epaules', 29, 40, 6.8, 6, -20) + el('pecs', 41.3, 47, 8.2, 6.6, 8);
      s += el('biceps', 24, 57, 4, 9, 10) + el('avantbras', 19.5, 84, 3.6, 12, 8) + `<rect data-m="abdos" x="43.5" y="56" width="13" height="31" rx="4" style="fill:${fill('abdos')}"/>` + el('abdos', 37.6, 72, 3, 10, -4);
      s += el('quadriceps', 40.5, 129, 6.2, 20, 3) + el('adducteurs', 46.6, 120, 2.4, 10) + el('mollets', 39.6, 172, 3.8, 13, 2);
      s += '<path d="M44 66h12M44 74h12M50 57v29" class="body-line"/>';
    } else {
      s += `<polygon data-m="trapezes" points="50,25 36,34 50,54 64,34" style="fill:${fill('trapezes')}"/>` + el('epaules', 29, 40, 6.8, 6, 20);
      s += poly('dos', [[36.5, 43], [48.5, 52], [47.5, 74], [38, 67]]) + el('triceps', 24, 57, 4, 9, 10) + el('avantbras', 19.5, 84, 3.6, 12, 8);
      s += `<rect data-m="lombaires" x="44" y="75" width="12" height="13" rx="3" style="fill:${fill('lombaires')}"/>` + el('fessiers', 42.6, 100, 7.4, 8) + el('ischios', 41, 131, 6.2, 18, 2) + el('mollets', 40, 170, 4.8, 13, 2);
    }
    return s + '</svg>';
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
      <div class="section-title"><h2>Nouvelle séance</h2></div>
      <button class="card mu-start" data-action="wo-free"><div><div class="card-title">${ICON.bolt}Séance libre</div><div class="sub">Ajoute tes exercices au fur et à mesure</div></div><span class="mu-go">${ICON.right}</span></button>
      <div class="section-title"><h2>Mes routines</h2><button class="btn plain" data-action="rt-new">+ Créer</button></div>
      ${M.routines.length ? M.routines.map((r, i) => `<section class="card mu-routine"><div class="grow" data-action="rt-edit" data-i="${i}"><div class="card-title" style="font-size:18px">${esc(r.name)}</div><div class="sub">${r.exercises.length} exercice${r.exercises.length > 1 ? 's' : ''} · ${r.exercises.reduce((a, e) => a + e.sets, 0)} séries · ${esc(r.exercises.slice(0, 3).map(e => exo(e.exId).name).join(', '))}${r.exercises.length > 3 ? '…' : ''}</div></div><button class="btn small" data-action="rt-start" data-i="${i}">Commencer</button></section>`).join('')
        : '<section class="card"><p class="note" style="margin:0">Crée tes routines (ex. « Push », « Jambes & Dos ») pour lancer une séance pré-remplie en un geste, avec tes charges de la dernière fois. Tu peux aussi enregistrer une séance libre comme routine à la fin.</p></section>'}
      <div class="section-title"><h2>Muscles · 7 jours</h2></div>
      <section class="card">
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
  function newWorkout(name, exs = [], routineId = null) {
    M.active = { id: uid(), start: Date.now(), name, routineId, exercises: exs.map(e => ({ uid: uid(), exId: e.exId, sets: Array.from({ length: Math.max(1, e.sets || 3) }, () => ({ kg: null, reps: null, done: false })) })) };
    saveActive();
  }
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
        <div class="wo-top"><button class="wo-name" data-a="rename">${esc(w.name)} ${ICON.edit}</button><div class="row between"><b class="num wo-clock" data-w="elapsed">${fmtDur(Date.now() - w.start)}</b><button class="chip" data-a="restcfg">⏱ Repos ${M.settings.rest} s</button></div><div class="sub" data-w="meta">${meta()}</div></div>
        ${w.exercises.map((x, xi) => exCard(x, xi, w)).join('')}
        <button class="btn ghost block" data-a="addex" style="margin:4px 0 12px">+ Ajouter des exercices</button>
        <button class="btn danger block" data-a="cancel">Abandonner la séance</button>`);
      body.scrollTop = st;
      drawFoot();
    };
    const exCard = (x, xi, w) => {
      const e = exo(x.exId), [fa, fb] = FIELDS[e.type] || FIELDS.w, prev = lastPerf(x.exId, w.start);
      return `<section class="card wo-ex"><div class="row between" style="align-items:flex-start"><div class="grow"><div class="wo-ex-name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${esc(EQ[e.equip] || '')}</div></div>
        <div class="row" style="gap:0"><button class="icon-btn" data-a="up" data-x="${xi}" aria-label="Monter" ${xi ? '' : 'disabled style="opacity:.25"'}>${ICON.left.replace('M15 5l-7 7 7 7', 'M6 15l6-6 6 6')}</button><button class="icon-btn" data-a="rmex" data-x="${xi}" aria-label="Retirer" style="color:var(--danger)">${ICON.close}</button></div></div>
        <div class="wo-table ${fa ? '' : 'one'}"><div class="wo-row head"><span>Série</span><span>Précédent</span>${fa ? `<span>${fa}</span>` : ''}<span>${fb}</span><span></span></div>
        ${x.sets.map((s, si) => { const p = prev[si] || prev[prev.length - 1]; const pa = p ? (e.type === 'time' ? '' : p.kg ?? '') : '', pb = p ? p.reps ?? '' : '';
          return `<div class="wo-row ${s.done ? 'done' : ''}" data-x="${xi}" data-s="${si}"><span class="set-n">${si + 1}</span><span class="prev">${p ? esc(setTxt(p, e.type)) : '—'}</span>${fa ? `<input class="wo-in" data-f="kg" inputmode="decimal" value="${s.kg ?? ''}" placeholder="${pa}" data-ph="${pa}">` : ''}<input class="wo-in" data-f="reps" inputmode="decimal" value="${s.reps ?? ''}" placeholder="${pb}" data-ph="${pb}"><button class="set-check" data-a="check" aria-label="Valider la série">${ICON.check}</button></div>`; }).join('')}
        </div><div class="wo-ex-foot"><button data-a="addset" data-x="${xi}">+ Série</button>${x.sets.length > 1 ? `<button data-a="rmset" data-x="${xi}">− Série</button>` : ''}</div></section>`;
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
          if (t !== 'cardio' && M.settings.rest > 0) { M.rest = { end: Date.now() + M.settings.rest * 1000, total: M.settings.rest }; drawFoot(); }
        } else { s.done = false; row.classList.remove('done'); }
        saveActive(); refreshMeta(); return;
      }
      if (a === 'addset') { const x = w.exercises[xi], last = x.sets[x.sets.length - 1]; x.sets.push({ kg: last?.kg ?? null, reps: last?.reps ?? null, done: false }); saveActive(); draw(); }
      if (a === 'rmset') { w.exercises[xi].sets.pop(); saveActive(); draw(); }
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
    const pending = w.exercises.reduce((a, x) => a + x.sets.filter(s => !s.done).length, 0);
    if (pending && !confirm(`${pending} série${pending > 1 ? 's non validées seront ignorées' : ' non validée sera ignorée'}. Terminer la séance ?`)) return;
    const fin = { ...w, end: Date.now(), exercises: w.exercises.map(x => ({ exId: x.exId, sets: x.sets.filter(s => isDone(s, exo(x.exId).type)).map(s => ({ kg: s.kg, reps: s.reps, done: true })) })).filter(x => x.sets.length) };
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
    sh.setFoot(`${fresh && !w.routineId ? '<button class="btn outline" data-a="asroutine">Créer une routine</button>' : !fresh ? '<button class="btn danger" data-a="del">Supprimer</button><button class="btn outline" data-a="repeat">Refaire</button>' : ''}<button class="btn grow" data-a="close">${fresh ? 'Super !' : 'Fermer'}</button>`);
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
      const item = e => `<button class="item pick ${sel.includes(e.id) ? 'on' : ''}" data-id="${e.id}"><span class="meal-check ${sel.includes(e.id) ? 'on' : ''}">${ICON.check}</span><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${esc(EQ[e.equip] || '')}</div></div></button>`;
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
      $('[data-w="list"]', sh.body).innerHTML = `<section class="card list">${withH.map(({ e, h }) => { const best = e.type === 'w' ? Math.max(0, ...h.map(x => bestOf(x.sets))) : 0; return `<button class="item" data-id="${e.id}"><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(MUS[e.muscle] || '')} · ${h.length ? `${h.length} séance${h.length > 1 ? 's' : ''}${best ? ` · 1RM est. ${r1(best)} kg` : ''}` : 'jamais fait'}</div></div><span class="muted">${ICON.right}</span></button>`; }).join('')}</section>`;
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
    sh.setBody(`<div class="sub" style="margin-bottom:12px">${esc(MUS[e.muscle] || '')}${e.sec?.length ? ' · secondaires : ' + e.sec.map(s => esc(MUS[s] || s)).join(', ') : ''} · ${esc(EQ[e.equip] || '')}</div>
      <div class="stats" style="margin-bottom:14px">${e.type === 'w' ? `<div class="stat"><b class="num">${best ? r1(e1rm(best.kg, best.reps)) + ' kg' : '–'}</b><span>1RM estimé (record)</span></div><div class="stat"><b class="num">${maxKg ? r1(maxKg) + ' kg' : '–'}</b><span>charge max</span></div><div class="stat"><b class="num">${bestVolSet ? r1(bestVolSet.kg) + '×' + r0(bestVolSet.reps) : '–'}</b><span>meilleure série (volume)</span></div>` : `<div class="stat"><b class="num">${maxReps ? r0(maxReps) : '–'}</b><span>${e.type === 'time' ? 'secondes max' : e.type === 'cardio' ? 'km max' : 'reps max'}</span></div>`}<div class="stat"><b class="num">${h.length}</b><span>séance${h.length > 1 ? 's' : ''}</span></div></div>
      ${e.type === 'w' && h.length ? '<section class="card"><div class="card-title" style="font-size:17px;margin-bottom:6px">Progression du 1RM estimé</div><div class="chart-wrap" id="ex-chart"></div><p class="note" style="margin:6px 0 0">1RM estimé = charge × (1 + reps / 30), formule d\'Epley. Utile pour comparer des séries faites avec des répétitions différentes.</p></section>' : ''}
      <h3>Historique</h3>${h.length ? h.slice().reverse().slice(0, 15).map(x => `<section class="card wo-done-ex"><div class="sub" style="margin-bottom:6px">${cap(F.short.format(new Date(x.w.start)))} · ${esc(x.w.name)}</div>${x.sets.map((s, i) => `<div class="vline small"><span class="muted">Série ${i + 1}</span><b class="num">${esc(setTxt(s, e.type))}</b></div>`).join('')}</section>`).join('') : '<p class="note">Pas encore fait.</p>'}
      ${id.startsWith('c-') ? '<button class="btn danger block" data-a="delex">Supprimer cet exercice personnalisé</button>' : ''}`);
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
  };
  const exportData = () => ({ workouts: M.workouts, routines: M.routines, custom: M.custom, settings: M.settings });
  async function importData(d) {
    if (!d) return;
    for (const w of d.workouts || []) await Store.put('wo:' + w.id, w);
    await Store.put('routines', d.routines || []); await Store.put('exos', d.custom || []); if (d.settings) await Store.put('muscuSettings', d.settings);
  }
  return { view, afterRender, actions, onLoad, updateBanner, exportData, importData, M };
};
