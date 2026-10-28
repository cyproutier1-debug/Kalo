'use strict';
(() => {
  const APP_VERSION = '1.2.0';

  /* ---------- Utilitaires ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const r0 = n => nf0.format(Math.round(n || 0));
  const r1 = n => nf1.format(Math.round((n || 0) * 10) / 10);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const num = v => { const x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v; return Number.isFinite(x) ? x : null; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const pad = n => String(n).padStart(2, '0');
  const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dparse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const today = () => dkey(new Date());
  const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));
  const F = {
    day: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    short: new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
    dm: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }),
    dmy: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    month: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }),
    monthOnly: new Intl.DateTimeFormat('fr-FR', { month: 'long' }),
  };

  const ICON = {
    left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
    scan: '<svg viewBox="0 0 24 24"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ico-check"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  };

  const MEALS = [['breakfast', 'Petit-déjeuner'], ['lunch', 'Déjeuner'], ['dinner', 'Dîner'], ['snack', 'Collations']];
  const mealName = id => (MEALS.find(m => m[0] === id) || [, id])[1];
  const guessMeal = () => { const d = new Date(), h = d.getHours() + d.getMinutes() / 60; return h < 10.5 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'snack' : 'dinner'; };
  const mealOptions = sel => MEALS.map(([id, n]) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${n}</option>`).join('');

  const ACTIVITY = [
    [1.2, 'Sédentaire', 'bureau, peu de marche'],
    [1.375, 'Légèrement actif', '1 à 3 séances / semaine'],
    [1.55, 'Actif', '3 à 5 séances / semaine'],
    [1.725, 'Très actif', 'sport quotidien ou métier physique'],
  ];
  const PACES = [[0, 'Maintenir mon poids'], [0.25, 'Perdre 0,25 kg / semaine'], [0.5, 'Perdre 0,5 kg / semaine (recommandé)'], [0.75, 'Perdre 0,75 kg / semaine'], [1, 'Perdre 1 kg / semaine']];

  function toast(msg, ms = 2200) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------- Stockage (IndexedDB, repli localStorage) ---------- */
  const Store = {
    db: null, mode: 'idb',
    async open() {
      try {
        if (!('indexedDB' in window)) throw new Error('no idb');
        this.db = await new Promise((res, rej) => {
          const r = indexedDB.open('kalo', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
          r.onblocked = () => rej(new Error('blocked'));
        });
      } catch (e) { this.mode = 'ls'; }
    },
    async loadAll() {
      const out = {};
      if (this.mode === 'idb') {
        await new Promise((res, rej) => {
          const req = this.db.transaction('kv').objectStore('kv').openCursor();
          req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } else res(); };
          req.onerror = () => rej(req.error);
        });
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('kalo:')) { try { out[k.slice(5)] = JSON.parse(localStorage.getItem(k)); } catch (e) { /* ignore */ } }
        }
      }
      return out;
    },
    put(k, v) {
      if (this.mode === 'idb') {
        return new Promise((res, rej) => {
          const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k);
          tx.oncomplete = res; tx.onerror = () => rej(tx.error);
        }).catch(() => toast("Erreur d'enregistrement"));
      }
      try { localStorage.setItem('kalo:' + k, JSON.stringify(v)); } catch (e) { toast('Stockage plein'); }
    },
    del(k) {
      if (this.mode === 'idb') {
        return new Promise(res => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = res; });
      }
      localStorage.removeItem('kalo:' + k);
    },
    clear() {
      if (this.mode === 'idb') {
        return new Promise(res => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').clear(); tx.oncomplete = res; tx.onerror = res; });
      }
      Object.keys(localStorage).filter(k => k.startsWith('kalo:')).forEach(k => localStorage.removeItem(k));
    },
  };

  /* ---------- État ---------- */
  const S = { profile: null, days: {}, weights: [], foods: [], recents: [], off: {} };
  const UI = { tab: 'journal', date: today(), period: 'week', metric: 'kcal', anchor: today(), proj: 'auto' };

  async function loadState() {
    const all = await Store.loadAll();
    S.profile = all.profile || null; S.weights = all.weights || []; S.foods = all.foods || []; S.recents = all.recents || [];
    S.days = {}; S.off = {};
    for (const k in all) {
      if (k.startsWith('day:')) S.days[k.slice(4)] = all[k];
      else if (k.startsWith('off:')) S.off[k.slice(4)] = all[k];
    }
  }

  function saveDay(k) {
    const d = S.days[k];
    if (!d || (!d.entries.length && d.burn == null && !d.validated)) { delete S.days[k]; return Store.del('day:' + k); }
    if (k === today() || !d.goal) { const g = goals(); d.goal = { kcal: g.kcal, protein: g.protein, tdee: g.tdee }; }
    return Store.put('day:' + k, d);
  }
  const getDay = k => (S.days[k] = S.days[k] || { entries: [] });
  const isLocked = k => !!S.days[k]?.validated;
  // Dépense du jour : saisie (montre / Santé) ou estimation du profil
  function dayBurn(k) {
    const d = S.days[k];
    if (d && d.burn != null) return { v: d.burn, measured: true };
    return { v: (k !== today() && d?.goal?.tdee) || goals().tdee, measured: false };
  }
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + r0(Math.abs(n));

  /* ---------- Objectifs ---------- */
  function sortedWeights() { return S.weights.slice().sort((a, b) => (a.date < b.date ? -1 : 1)); }
  function currentWeight() { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : S.profile?.weight; }

  function calc(p, w = currentWeight()) {
    const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
    const tdee = bmr * p.activity;
    const reached = p.target && w <= p.target;
    const deficit = reached ? 0 : Math.min((p.pace || 0) * 7700 / 7, 1000);
    const floor = p.sex === 'm' ? 1500 : 1200;
    const raw = tdee - deficit;
    const kcal = Math.round(Math.max(raw, floor) / 10) * 10;
    const refW = p.target && p.target < w ? p.target : w;
    const protein = Math.round(refW * 1.8 / 5) * 5;
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, floored: raw < floor, reached };
  }
  function goals() {
    const p = S.profile;
    if (!p) return { kcal: 2000, protein: 120, tdee: 2000 };
    const c = calc(p);
    return p.goalMode === 'manual' ? { ...c, kcal: p.kcalGoal || c.kcal, protein: p.proteinGoal || c.protein } : c;
  }

  function dayTotals(k) {
    const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0 };
    const d = S.days[k];
    if (d) for (const e of d.entries) { t.kcal += e.kcal || 0; t.p += e.p || 0; t.c += e.c || 0; t.f += e.f || 0; t.n++; }
    return t;
  }

  /* ---------- Aliments ---------- */
  const GEN = (window.GENERIC_FOODS || []).map(a => ({
    src: 'gen', id: 'g:' + a[0], name: a[0], brand: '', per100: { kcal: a[1], p: a[2], c: a[3], f: a[4] },
    unit: a[5] ? { label: a[5], g: a[6] } : null,
  }));
  const foodKey = f => f.src === 'off' ? 'off:' + f.code : f.src === 'custom' ? 'custom:' + f.id : 'gen:' + f.name;

  function localSearch(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const seen = new Set(), out = [];
    for (const f of [...S.foods, ...S.recents, ...GEN]) {
      const key = foodKey(f); if (seen.has(key)) continue;
      const hay = norm(f.name + ' ' + (f.brand || ''));
      if (words.every(w => hay.includes(w))) { seen.add(key); out.push(f); }
    }
    const first = words[0];
    return out.map((f, i) => ({ f, i, s: norm(f.name).startsWith(first) ? 0 : 1 })).sort((a, b) => a.s - b.s || a.i - b.i).map(x => x.f).slice(0, 40);
  }

  function pushRecent(food, grams, count) {
    const snap = { src: food.src, id: food.id || '', code: food.code || '', name: food.name, brand: food.brand || '', per100: food.per100, unit: food.unit || null, img: food.img || '', ns: food.ns || '', lastGrams: grams, lastCount: count || null };
    const key = foodKey(snap);
    S.recents = [snap, ...S.recents.filter(r => foodKey(r) !== key)].slice(0, 60);
    Store.put('recents', S.recents);
  }

  /* ---------- Open Food Facts ---------- */
  const OFF_FIELDS = 'code,product_name,product_name_fr,generic_name_fr,brands,quantity,serving_size,serving_quantity,nutriments,nutriscore_grade,image_front_small_url,image_front_thumb_url';
  function offToFood(p) {
    const n = p.nutriments || {};
    let kcal = num(n['energy-kcal_100g']);
    if (kcal == null) { const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']); if (kj != null) kcal = kj / 4.184; }
    const name = String(p.product_name_fr || p.product_name || p.generic_name_fr || '').trim();
    const sq = num(p.serving_quantity);
    return {
      src: 'off', code: String(p.code || ''), name: name || 'Produit sans nom',
      brand: String(p.brands || '').split(',')[0].trim(), qtyLabel: p.quantity || '',
      per100: kcal == null ? null : { kcal, p: num(n.proteins_100g) || 0, c: num(n.carbohydrates_100g) || 0, f: num(n.fat_100g) || 0 },
      unit: sq && sq > 0 ? { label: p.serving_size ? `1 portion (${p.serving_size})` : '1 portion', g: sq } : null,
      img: p.image_front_small_url || p.image_front_thumb_url || '',
      ns: /^[a-e]$/.test(p.nutriscore_grade || '') ? p.nutriscore_grade : '',
    };
  }
  async function fetchJSON(url, ms = 15000) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
      if (r.status === 404) return { status: 0 };
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally { clearTimeout(t); }
  }
  async function offProduct(code) {
    if (S.off[code]) return S.off[code];
    const j = await fetchJSON(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
    if (j.status !== 1 || !j.product) return null;
    const f = offToFood({ ...j.product, code });
    if (f.per100) { S.off[code] = f; Store.put('off:' + code, f); }
    return f;
  }
  async function offSearch(q) {
    const url = `https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n&fields=${OFF_FIELDS}`;
    const j = await fetchJSON(url, 25000);
    return (j.products || []).map(offToFood).filter(f => f.per100 && f.name !== 'Produit sans nom');
  }
  const netError = e => !navigator.onLine ? 'Pas de connexion internet.' : e && (e.status === 429 || e.status === 503) ? 'Open Food Facts est surchargé, réessaie dans quelques secondes.' : e && e.name === 'AbortError' ? 'Open Food Facts met trop de temps à répondre.' : 'Impossible de joindre Open Food Facts.';

  /* ---------- Feuilles (écrans superposés) + bouton retour Android ---------- */
  const stack = []; let afterClose = null;
  function makeSheet(title) {
    const el = document.createElement('div'); el.className = 'sheet';
    el.innerHTML = `<div class="sheet-head"><button class="icon-btn" data-close aria-label="Retour">${ICON.back}</button><h2></h2><span style="width:40px"></span></div><div class="sheet-body"><div class="inner"></div></div><div class="sheet-foot" hidden><div class="inner"></div></div>`;
    el.querySelector('[data-close]').onclick = () => closeSheet();
    const api = {
      el, body: el.querySelector('.sheet-body .inner'), foot: el.querySelector('.sheet-foot .inner'),
      title(t) { el.querySelector('h2').textContent = t; return api; },
      setBody(h) { api.body.innerHTML = h; return api; },
      setFoot(h) { api.foot.innerHTML = h || ''; el.querySelector('.sheet-foot').hidden = !h; return api; },
    };
    return api.title(title);
  }
  function openSheet(el, onClose) {
    $('#sheets').appendChild(el); stack.push({ el, onClose });
    history.pushState({ sheet: stack.length }, '');
  }
  function closeSheet(n = 1, then) {
    n = Math.min(n, stack.length); if (!n) { then?.(); return; }
    afterClose = then || null; history.go(-n);
  }
  const closeAll = then => closeSheet(stack.length, then);
  window.addEventListener('popstate', e => {
    const depth = (e.state && e.state.sheet) || 0;
    while (stack.length > depth) { const s = stack.pop(); try { s.onClose?.(); } catch (err) { /* ignore */ } s.el.remove(); }
    render();
    if (afterClose) { const f = afterClose; afterClose = null; f(); }
  });

  /* ---------- Vues ---------- */
  function render() {
    const v = $('#view');
    $('#tabbar').style.display = S.profile ? '' : 'none';
    if (!S.profile) { v.innerHTML = viewOnboarding(); bindOnboarding(); return; }
    $$('#tabbar [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === UI.tab));
    const views = { journal: viewJournal, progress: viewProgress, foods: viewFoods, profile: viewProfile };
    v.innerHTML = (views[UI.tab] || viewJournal)();
    if (UI.tab === 'progress') { drawChart(); drawProjection(); }
  }

  // Accueil / onboarding
  function profileFields(p = {}) {
    return `
      <div class="grid2">
        <label class="field"><span>Sexe</span><select name="sex"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Homme</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Femme</option></select></label>
        <label class="field"><span>Âge</span><input type="number" name="age" inputmode="numeric" min="16" max="100" value="${p.age ?? ''}" placeholder="30"></label>
        <label class="field"><span>Taille (cm)</span><input type="number" name="height" inputmode="numeric" min="120" max="230" value="${p.height ?? ''}" placeholder="178"></label>
        ${p.noWeight ? '' : `<label class="field"><span>Poids actuel (kg)</span><input type="number" name="weight" inputmode="decimal" step="0.1" min="30" max="300" value="${p.weight ?? ''}" placeholder="85"></label>`}
        <label class="field"><span>Poids objectif (kg)</span><input type="number" name="target" inputmode="decimal" step="0.1" min="30" max="300" value="${p.target ?? ''}" placeholder="75"></label>
      </div>
      <label class="field"><span>Niveau d'activité</span><select name="activity">${ACTIVITY.map(([v, l, d]) => `<option value="${v}" ${+p.activity === v ? 'selected' : ''}>${l} — ${d}</option>`).join('')}</select></label>
      <label class="field"><span>Rythme</span><select name="pace">${PACES.map(([v, l]) => `<option value="${v}" ${(p.pace ?? 0.5) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  }
  function readProfileForm(form) {
    const g = n => form.querySelector(`[name="${n}"]`)?.value;
    return { sex: g('sex'), age: num(g('age')), height: num(g('height')), weight: num(g('weight')), target: num(g('target')), activity: num(g('activity')), pace: num(g('pace')) ?? 0.5 };
  }
  const profileValid = p => p.age >= 16 && p.age <= 100 && p.height >= 120 && p.height <= 230 && (p.weight == null || (p.weight >= 30 && p.weight <= 300)) && (!p.target || (p.target >= 30 && p.target <= 300));

  function viewOnboarding() {
    return `
      <div class="onboard-hero"><img src="icons/icon-192.png" alt=""><h1 style="margin-top:12px">Bienvenue sur Kalo</h1>
      <p class="muted">Quelques infos pour calculer tes objectifs de calories et de protéines. Tout reste sur ton téléphone.</p></div>
      <form id="oform" class="card stack" novalidate>${profileFields({ pace: 0.5 })}</form>
      <section class="card goal-result" id="oresult"><p class="muted">Remplis le formulaire pour voir tes objectifs.</p></section>
      <button class="btn block" data-action="onboard-done" id="obtn" disabled>Commencer</button>
      <p class="note" style="margin-top:14px">Calcul : métabolisme de base (Mifflin-St Jeor) × niveau d'activité, moins le déficit lié au rythme choisi (7 700 kcal ≈ 1 kg). Plancher de sécurité : 1 500 kcal (homme) / 1 200 kcal (femme). Protéines : 1,8 g par kg de poids objectif. Ce sont des estimations : ajuste après 2 à 3 semaines selon l'évolution réelle de ton poids.</p>`;
  }
  function bindOnboarding() {
    const f = $('#oform'), out = $('#oresult'), btn = $('#obtn');
    const upd = () => {
      const p = readProfileForm(f);
      if (!profileValid(p) || !p.weight) { btn.disabled = true; return; }
      const c = calc(p, p.weight); btn.disabled = false;
      out.innerHTML = `<h3>Tes objectifs quotidiens</h3><div class="big num">${r0(c.kcal)} kcal</div><div style="font-size:20px;font-weight:700;color:var(--protein)" class="num">${r0(c.protein)} g de protéines</div><p class="note">Dépense estimée : ${r0(c.tdee)} kcal/jour${c.floored ? ' · objectif relevé au plancher de sécurité' : ''}${c.reached ? ' · poids objectif déjà atteint : maintien' : ''}</p>`;
    };
    f.addEventListener('input', upd); f.addEventListener('change', upd); upd();
  }

  // Journal
  function entrySub(e) {
    if (e.src === 'quick') return 'Ajout rapide';
    const q = e.count && e.unit ? (e.count === 1 ? e.unit.label : `${r1(e.count)} × ${e.unit.label.replace(/^1\s+/, '')}`) + (/\d\s*(g|ml)\b/i.test(e.unit.label) ? '' : ` · ${r0(e.grams)} g`) : `${r0(e.grams)} g`;
    return [e.brand, q].filter(Boolean).join(' · ');
  }
  function viewJournal() {
    const k = UI.date, g = goals(), t = dayTotals(k);
    const rem = g.kcal - t.kcal, over = rem < 0;
    const d = dparse(k);
    const label = k === today() ? "Aujourd'hui" : k === dkey(addDays(new Date(), -1)) ? 'Hier' : k === dkey(addDays(new Date(), 1)) ? 'Demain' : cap(F.short.format(d));
    const prev = S.days[dkey(addDays(d, -1))];
    const locked = isLocked(k), burn = dayBurn(k), bal = burn.v - t.kcal;
    const meal = ([id, name]) => {
      const es = (S.days[k]?.entries || []).filter(e => e.meal === id);
      const kc = es.reduce((s, e) => s + e.kcal, 0);
      const canCopy = !locked && !es.length && prev && prev.entries.some(e => e.meal === id);
      return `<section class="card meal"><div class="meal-head"><h2>${name}</h2><span class="kcal num">${es.length ? r0(kc) + ' kcal' : ''}</span></div>
        ${es.map(e => `<button class="entry" data-action="edit-entry" data-id="${e.id}"><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${esc(entrySub(e))}</div></div><div class="val num">${r0(e.kcal)}<small>${r0(e.p)} g prot.</small></div></button>`).join('')}
        ${locked ? (es.length ? '' : '<div class="empty small" style="padding:4px 16px 14px">Rien</div>') : `<div class="meal-foot"><button data-action="add" data-meal="${id}">+ Ajouter</button>${canCopy ? `<button data-action="copy-prev" data-meal="${id}">Copier la veille</button>` : ''}</div>`}</section>`;
    };
    return `
      <div class="datebar">
        <button class="icon-btn" data-action="day-prev" aria-label="Jour précédent">${ICON.left}</button>
        <label class="date-label" style="position:relative">${esc(label)}<input type="date" value="${k}" data-input="date" aria-label="Choisir une date" style="position:absolute;inset:0;opacity:0;width:100%"></label>
        <button class="icon-btn" data-action="day-next" aria-label="Jour suivant">${ICON.right}</button>
      </div>
      <section class="card summary">
        <div class="muted small">${over ? 'Calories en trop' : 'Calories restantes'}</div>
        <div class="big num ${over ? 'over-text' : ''}">${r0(Math.abs(rem))}</div>
        <div class="muted small num" style="margin:2px 0 14px">Objectif ${r0(g.kcal)} − consommé ${r0(t.kcal)}</div>
        <div class="metric"><div class="row between"><span>Calories</span><span class="num">${r0(t.kcal)} / ${r0(g.kcal)} kcal</span></div><div class="bar ${over ? 'over' : ''}"><div style="width:${Math.min(100, t.kcal / g.kcal * 100)}%"></div></div></div>
        <div class="metric"><div class="row between"><span>Protéines</span><span class="num">${r0(t.p)} / ${r0(g.protein)} g</span></div><div class="bar protein"><div style="width:${Math.min(100, t.p / g.protein * 100)}%"></div></div></div>
        <div class="macros-mini"><span>Glucides <b class="num">${r0(t.c)} g</b></span><span>Lipides <b class="num">${r0(t.f)} g</b></span></div>
      </section>
      ${locked ? validatedCard(k, t, burn) : ''}
      <section class="card bilan">
        <div class="row between" style="margin-bottom:10px"><h3 style="margin:0">Bilan du jour</h3>${locked ? '' : `<button class="btn plain" data-action="burn">${burn.measured ? 'Modifier la dépense' : '+ Saisir ma dépense'}</button>`}</div>
        <div class="eq3">
          <button class="cell" data-action="burn" ${locked ? 'disabled' : ''}><b class="num">${r0(burn.v)}</b><span>Dépense ${burn.measured ? '' : '<em>estimée</em>'}</span></button>
          <i>−</i>
          <div class="cell"><b class="num">${r0(t.kcal)}</b><span>Consommé</span></div>
          <i>=</i>
          <div class="cell"><b class="num ${bal >= 0 ? 'good-text' : 'over-text'}">${signed(-bal)}</b><span>${bal >= 0 ? 'Déficit' : 'Excédent'}</span></div>
        </div>
      </section>
      ${MEALS.map(meal).join('')}
      ${locked ? '' : `<button class="btn block validate-btn" data-action="validate">${ICON.check} Valider la journée</button>`}`;
  }

  function validatedCard(k, t, burn) {
    const d = S.days[k], g = d.goal || goals();
    const okK = t.kcal <= g.kcal, okP = t.p >= g.protein;
    return `<section class="card validated">
      <div class="row between"><div class="row" style="gap:8px">${ICON.check}<b>Journée validée</b></div><button class="btn plain" data-action="reopen">Rouvrir</button></div>
      <div class="vchecks"><span class="${okK ? 'ok' : 'ko'}">${okK ? '✓' : '✗'} Calories ${okK ? 'dans l\'objectif' : 'au-dessus (+' + r0(t.kcal - g.kcal) + ')'}</span>
      <span class="${okP ? 'ok' : 'ko'}">${okP ? '✓' : '✗'} Protéines ${okP ? 'atteintes' : '(' + r0(t.p) + ' / ' + r0(g.protein) + ' g)'}</span></div>
    </section>`;
  }

  /* ---------- Écran : dépense du jour ---------- */
  function openBurn(k, then) {
    const d = S.days[k], est = dayBurn(k);
    const g = goals();
    const sh = makeSheet('Dépense du jour');
    sh.setBody(`<section class="card stack">
      <label class="field"><span>Dépense totale de la journée (kcal)</span><input type="number" inputmode="numeric" data-f="burn" value="${d?.burn ?? ''}" placeholder="Estimation : ${r0(g.tdee)}"></label>
      <p class="note" style="margin:0">Entre la <b>dépense totale</b> (repos + activité), pas seulement le sport.<br>
      <b>iPhone</b> : app Santé → Activité → additionne <i>Énergie au repos</i> + <i>Énergie active</i>.<br>
      <b>Montre Garmin, Samsung, Fitbit…</b> : « calories totales » du jour.<br>
      Sans montre, laisse vide : l'estimation de ton profil (${r0(g.tdee)} kcal) est utilisée.</p>
      <div class="chips" data-f="chips"><button type="button" class="chip" data-add="200">+200 sport</button><button type="button" class="chip" data-add="400">+400 sport</button><button type="button" class="chip" data-add="-200">−200</button></div>
      <p class="note" style="margin:0">Les montres surestiment souvent les calories du sport de 20 à 40 %. Si ton poids baisse moins vite que prévu, sous-estime plutôt ta dépense.</p>
    </section>`);
    sh.setFoot(`${d?.burn != null ? '<button class="btn outline" data-a="clear">Estimation</button>' : ''}<button class="btn grow" data-a="save">Enregistrer</button>`);
    const inp = $('[data-f="burn"]', sh.body);
    $('[data-f="chips"]', sh.body).onclick = e => { const b = e.target.closest('[data-add]'); if (!b) return; inp.value = Math.max(0, (num(inp.value) ?? Math.round(est.v)) + +b.dataset.add); };
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      const day = getDay(k);
      if (a === 'clear') delete day.burn;
      if (a === 'save') {
        const v = num(inp.value);
        if (v == null) delete day.burn;
        else if (v < 800 || v > 8000) { toast('Valeur entre 800 et 8 000 kcal'); return; }
        else day.burn = Math.round(v);
      }
      saveDay(k);
      closeSheet(1, then || (() => toast('Dépense enregistrée')));
    };
    openSheet(sh.el);
  }

  /* ---------- Écran : valider la journée ---------- */
  function openValidate(k) {
    const t = dayTotals(k), g = goals(), burn = dayBurn(k), bal = burn.v - t.kcal;
    const okK = t.kcal <= g.kcal, okP = t.p >= g.protein;
    const kg4 = bal * 28 / 7700;
    const sh = makeSheet('Valider la journée');
    sh.setBody(`
      <section class="card">
        <div class="vline"><span>Consommé</span><b class="num">${r0(t.kcal)} kcal</b></div>
        <div class="vline"><span>Dépense ${burn.measured ? '' : '<em class="muted">(estimée)</em>'}</span><b class="num">${r0(burn.v)} kcal</b></div>
        <div class="vline big-line"><span>${bal >= 0 ? 'Déficit' : 'Excédent'}</span><b class="num ${bal >= 0 ? 'good-text' : 'over-text'}">${signed(-bal)} kcal</b></div>
        <p class="note" style="margin:6px 0 0">≈ ${r0(Math.abs(bal) / 7.7)} g de graisse ${bal >= 0 ? 'en moins' : 'en plus'} (7 700 kcal ≈ 1 kg).</p>
        ${burn.measured ? '' : '<button class="btn block ghost" data-a="burn" style="margin-top:12px">Saisir ma dépense réelle</button>'}
      </section>
      <section class="card vchecks big">
        <span class="${okK ? 'ok' : 'ko'}">${okK ? '✓' : '✗'} Calories : ${r0(t.kcal)} / ${r0(g.kcal)} kcal</span>
        <span class="${okP ? 'ok' : 'ko'}">${okP ? '✓' : '✗'} Protéines : ${r0(t.p)} / ${r0(g.protein)} g</span>
      </section>
      ${t.n && t.kcal < (S.profile.sex === 'm' ? 1500 : 1200) ? `<section class="card" style="background:var(--warn-soft)"><b class="over-text">Apport très bas (${r0(t.kcal)} kcal)</b><p class="small" style="margin:6px 0 0">As-tu tout saisi ? Si oui, un déficit aussi fort fait perdre du muscle et se maintient mal. Vise au moins ${S.profile.sex === 'm' ? '1 500' : '1 200'} kcal et tes protéines.</p></section>` : ''}
      ${t.n ? `<p class="note">Si tous tes jours ressemblaient à celui-ci : <b>${kg4 >= 0 ? '−' : '+'}${r1(Math.abs(kg4))} kg en 4 semaines</b>.</p>` : '<p class="note">Aucun aliment saisi ce jour-là. Vérifie que tu n\'as rien oublié avant de valider.</p>'}`);
    sh.setFoot('<button class="btn grow" data-a="ok">✓ Valider</button>');
    sh.body.onclick = e => { if (e.target.closest('[data-a="burn"]')) closeSheet(1, () => openBurn(k, () => openValidate(k))); };
    sh.foot.onclick = e => {
      if (!e.target.closest('[data-a="ok"]')) return;
      const day = getDay(k); day.validated = Date.now(); saveDay(k);
      try { navigator.vibrate?.(30); } catch (err) { /* ignore */ }
      closeSheet(1, () => { window.scrollTo(0, 0); toast(bal >= 0 ? `Journée validée · déficit ${r0(bal)} kcal` : 'Journée validée'); });
    };
    openSheet(sh.el);
  }

  // Aliments
  function foodItem(f, i) {
    const p = f.per100;
    const thumb = f.img ? `<img class="thumb" src="${esc(f.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="thumb">${f.src === 'gen' ? 'GÉN' : f.src === 'custom' ? 'PERSO' : 'OFF'}</span>`;
    const sub = [f.brand, p ? `${r0(p.kcal)} kcal · ${r1(p.p)} g prot. / 100 g` : 'valeurs manquantes'].filter(Boolean).join(' · ');
    return `<button class="item" data-i="${i}">${thumb}<div class="grow"><div class="name">${esc(f.name)}</div><div class="sub">${esc(sub)}</div></div>${f.ns ? `<span class="badge ns ns-${f.ns}">${f.ns.toUpperCase()}</span>` : ''}</button>`;
  }
  function viewFoods() {
    return `<h1>Aliments</h1>
      <button class="btn block ghost" data-action="create-food" style="margin-bottom:16px">+ Créer un aliment</button>
      <h3>Mes aliments</h3>
      <section class="card list" data-list="custom">${S.foods.length ? S.foods.map(foodItem).join('') : '<div class="empty small">Crée ici tes recettes ou les produits introuvables au scan.</div>'}</section>
      <h3>Récemment utilisés</h3>
      <section class="card list" data-list="recent">${S.recents.length ? S.recents.slice(0, 30).map(foodItem).join('') : '<div class="empty small">Les aliments que tu ajoutes apparaîtront ici.</div>'}</section>
      <p class="note">Données produits : <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> (base collaborative, licence ODbL). Les aliments génériques sont des valeurs moyennes.</p>`;
  }

  // Profil
  let installPrompt = null;
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function viewProfile() {
    const p = S.profile, c = calc(p), g = goals(), w = currentWeight();
    const install = isStandalone() ? '' : `<section class="card"><h3>Installer l'application</h3>${isIOS()
      ? '<p class="small">Dans <b>Safari</b> : touche <b>« ⋯ »</b> à côté de la barre d\'adresse, puis <b>Partager</b> (carré avec une flèche), fais défiler et choisis <b>« Sur l\'écran d\'accueil »</b>. Sur les anciens iOS, le bouton Partager est directement en bas de l\'écran.</p>'
      : installPrompt ? '<button class="btn block" data-action="install">Installer Kalo</button>' : '<p class="small">Dans <b>Chrome</b> : menu <b>⋮</b> puis <b>« Ajouter à l\'écran d\'accueil »</b> ou <b>« Installer l\'application »</b>.</p>'}</section>`;
    return `<h1>Profil</h1>
      ${install}
      <section class="card">
        <h3>Objectifs quotidiens</h3>
        <div class="row between"><div><div class="big num" style="font-size:28px;font-weight:750">${r0(g.kcal)} kcal</div><div class="num" style="color:var(--protein);font-weight:700">${r0(g.protein)} g de protéines</div></div>
        <div class="seg" style="width:150px"><button data-action="goal-mode" data-v="auto" class="${p.goalMode !== 'manual' ? 'on' : ''}">Auto</button><button data-action="goal-mode" data-v="manual" class="${p.goalMode === 'manual' ? 'on' : ''}">Manuel</button></div></div>
        ${p.goalMode === 'manual' ? `<div class="grid2" style="margin-top:12px"><label class="field"><span>Calories (kcal)</span><input type="number" inputmode="numeric" id="mk" value="${p.kcalGoal || c.kcal}"></label><label class="field"><span>Protéines (g)</span><input type="number" inputmode="numeric" id="mp" value="${p.proteinGoal || c.protein}"></label></div><button class="btn block" style="margin-top:10px" data-action="save-manual">Enregistrer les objectifs</button>` : ''}
        <p class="note">Poids actuel ${r1(w)} kg · dépense estimée ${r0(c.tdee)} kcal/j${p.goalMode !== 'manual' ? ` · objectif auto ${r0(c.kcal)} kcal` : ` · suggestion auto ${r0(c.kcal)} kcal / ${r0(c.protein)} g`}${c.floored ? ' · plancher de sécurité appliqué' : ''}${c.reached ? ' · poids objectif atteint : mode maintien' : ''}. En mode Auto, les objectifs se recalculent à chaque pesée.</p>
      </section>
      <form class="card stack" id="pform" novalidate><h3>Mon profil</h3>${profileFields({ ...p, noWeight: true })}<button type="button" class="btn block" data-action="save-profile">Enregistrer</button></form>
      <section class="card stack"><h3>Mes données</h3>
        <p class="note" style="margin:0">Tes données sont stockées uniquement sur cet appareil. Fais une sauvegarde de temps en temps (et avant de changer de téléphone).</p>
        <div class="grid2"><button class="btn outline" data-action="export">Exporter</button><label class="btn outline" style="position:relative">Importer<input type="file" accept="application/json,.json" data-input="import" style="position:absolute;inset:0;opacity:0"></label></div>
        <button class="btn danger block" data-action="reset">Effacer toutes les données</button>
      </section>
      <p class="note">Kalo ${APP_VERSION} · stockage ${Store.mode === 'idb' ? 'IndexedDB' : 'local'} · données produits <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a>. Les valeurs sont des estimations, pas un avis médical.</p>`;
  }

  /* ---------- Progrès ---------- */
  function periodRange() {
    const a = dparse(UI.anchor);
    if (UI.period === 'week') { const s = startOfWeek(a); return { start: s, end: addDays(s, 6) }; }
    if (UI.period === 'month') return { start: new Date(a.getFullYear(), a.getMonth(), 1), end: new Date(a.getFullYear(), a.getMonth() + 1, 0) };
    return { start: new Date(a.getFullYear(), 0, 1), end: new Date(a.getFullYear(), 11, 31) };
  }
  function periodLabel({ start, end }) {
    if (UI.period === 'week') return `${F.dm.format(start)} – ${F.dmy.format(end)}`;
    if (UI.period === 'month') return cap(F.month.format(start));
    return String(start.getFullYear());
  }
  function shiftPeriod(dir) {
    const a = dparse(UI.anchor);
    const n = UI.period === 'week' ? addDays(a, 7 * dir) : UI.period === 'month' ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : new Date(a.getFullYear() + dir, 0, 1);
    UI.anchor = dkey(n); render();
  }
  function daysIn(start, end) { const out = []; for (let d = start; d <= end; d = addDays(d, 1)) out.push(d); return out; }

  function periodData() {
    const r = periodRange(), tk = today();
    const days = daysIn(r.start, r.end);
    const logged = days.filter(d => S.days[dkey(d)]?.entries.length).map(d => { const k = dkey(d); return { d, k, t: dayTotals(k), g: S.days[k].goal || goals() }; });
    const elapsed = days.filter(d => dkey(d) <= tk).length;
    return { r, days, logged, elapsed };
  }

  function viewProgress() {
    const { r, logged, elapsed } = periodData();
    const g = goals(); const m = UI.metric;
    const isCurrent = dkey(r.end) >= today();
    let stats = '';
    if (m === 'kcal' || m === 'protein') {
      const n = logged.length;
      const avgK = n ? logged.reduce((s, x) => s + x.t.kcal, 0) / n : 0;
      const avgP = n ? logged.reduce((s, x) => s + x.t.p, 0) / n : 0;
      if (m === 'kcal') {
        const inGoal = logged.filter(x => x.t.kcal <= x.g.kcal).length;
        const bal = logged.reduce((s, x) => s + (x.t.kcal - (S.days[x.k].burn ?? (x.g.tdee || g.tdee))), 0);
        const nv = logged.filter(x => S.days[x.k].validated).length;
        stats = `
          <div class="stat"><b class="num">${n ? r0(avgK) : '–'}</b><span>kcal / jour en moyenne</span></div>
          <div class="stat"><b class="num">${n} / ${elapsed}</b><span>jours saisis · ${nv} validé${nv > 1 ? 's' : ''}</span></div>
          <div class="stat"><b class="num">${n ? inGoal : '–'}</b><span>jours sous l'objectif</span></div>
          <div class="stat"><b class="num">${n ? (bal <= 0 ? '−' : '+') + r1(Math.abs(bal) / 7700) + ' kg' : '–'}</b><span>bilan estimé (${n ? (bal <= 0 ? 'déficit ' : 'excédent ') + r0(Math.abs(bal)) + ' kcal' : 'jours saisis'})</span></div>`;
      } else {
        const hit = logged.filter(x => x.t.p >= x.g.protein).length;
        const w = currentWeight();
        stats = `
          <div class="stat"><b class="num">${n ? r0(avgP) + ' g' : '–'}</b><span>protéines / jour en moyenne</span></div>
          <div class="stat"><b class="num">${n ? hit : '–'}</b><span>jours objectif atteint</span></div>
          <div class="stat"><b class="num">${n ? r1(avgP / w) : '–'}</b><span>g / kg de poids corporel</span></div>
          <div class="stat"><b class="num">${n ? Math.round(avgP * 4 / Math.max(1, avgK) * 100) + ' %' : '–'}</b><span>des calories viennent des protéines</span></div>`;
      }
    } else {
      const ws = sortedWeights().filter(w => w.date >= dkey(r.start) && w.date <= dkey(r.end));
      const first = ws[0], last = ws[ws.length - 1], cw = currentWeight(), tgt = S.profile.target;
      stats = `
        <div class="stat"><b class="num">${first ? r1(first.kg) + ' kg' : '–'}</b><span>début de période</span></div>
        <div class="stat"><b class="num">${last ? r1(last.kg) + ' kg' : '–'}</b><span>dernière pesée de la période</span></div>
        <div class="stat"><b class="num">${ws.length > 1 ? (last.kg - first.kg > 0 ? '+' : last.kg - first.kg < 0 ? '−' : '') + r1(Math.abs(last.kg - first.kg)) + ' kg' : '–'}</b><span>variation sur la période</span></div>
        <div class="stat"><b class="num">${tgt ? (cw > tgt ? r1(cw - tgt) + ' kg' : 'Atteint') : '–'}</b><span>restant jusqu'à l'objectif</span></div>`;
    }
    const legend = m === 'kcal'
      ? `<span><i style="background:var(--accent)"></i>Dans l'objectif</span><span><i style="background:var(--warn)"></i>Au-dessus</span><span><i class="dash"></i>Objectif actuel (${r0(g.kcal)} kcal)</span>`
      : m === 'protein' ? `<span><i style="background:var(--protein)"></i>Protéines</span><span><i class="dash"></i>Objectif actuel (${r0(g.protein)} g)</span>`
        : `<span><i style="background:var(--accent);border-radius:50%"></i>Pesées</span>${S.profile.target ? `<span><i class="dash"></i>Poids objectif (${r1(S.profile.target)} kg)</span>` : ''}`;
    const ws = sortedWeights().reverse().slice(0, 8);
    return `<h1>Progrès</h1>
      ${viewProjection()}
      <div class="seg">${[['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']].map(([v, l]) => `<button data-action="period" data-v="${v}" class="${UI.period === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="period-nav"><button class="icon-btn" data-action="per-prev" aria-label="Période précédente">${ICON.left}</button><b>${periodLabel(r)}</b><button class="icon-btn" data-action="per-next" aria-label="Période suivante" ${isCurrent ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div>
      <section class="card">
        <div class="seg" style="margin-bottom:12px">${[['kcal', 'Calories'], ['protein', 'Protéines'], ['weight', 'Poids']].map(([v, l]) => `<button data-action="metric" data-v="${v}" class="${m === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="chart-wrap" id="chart"></div>
        <div class="legend">${legend}</div>
        ${UI.period === 'year' && m !== 'weight' ? '<p class="note" style="margin:8px 0 0">Moyenne mensuelle des jours saisis.</p>' : ''}
      </section>
      <div class="stats">${stats}</div>
      <section class="card" style="margin-top:14px">
        <div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Pesées</h3><button class="btn plain" data-action="add-weight">+ Ajouter</button></div>
        ${ws.length ? ws.map(w => `<button class="item" data-action="edit-weight" data-date="${w.date}" style="padding-left:0;padding-right:0"><div class="grow">${cap(F.dmy.format(dparse(w.date)))}</div><b class="num">${r1(w.kg)} kg</b></button>`).join('') : '<div class="empty small">Aucune pesée.</div>'}
      </section>`;
  }

  /* ---------- Graphiques (SVG) ---------- */
  function niceStep(span, count = 4) {
    const raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  const barPath = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); const yb = y + h; return `M${x},${yb}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${yb}Z`; };
  const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'], MO = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  function drawChart() {
    const wrap = $('#chart'); if (!wrap) return;
    const { r, days } = periodData(); const g = goals(); const m = UI.metric;
    if (m === 'weight') return drawWeight(wrap, r);
    const key = m === 'kcal' ? 'kcal' : 'p', unit = m === 'kcal' ? 'kcal' : 'g';
    const goal = m === 'kcal' ? g.kcal : g.protein, gk = m === 'kcal' ? 'kcal' : 'protein';
    let pts;
    if (UI.period === 'year') {
      pts = MO.map((lab, mi) => {
        const ds = days.filter(d => d.getMonth() === mi && S.days[dkey(d)]?.entries.length);
        const v = ds.length ? ds.reduce((s, d) => s + dayTotals(dkey(d))[key], 0) / ds.length : null;
        const gl = ds.length ? ds.reduce((s, d) => s + (S.days[dkey(d)].goal?.[gk] || goal), 0) / ds.length : goal;
        const mname = cap(F.monthOnly.format(new Date(2000, mi, 1)));
        return { v, g: gl, tick: lab, tip: v == null ? `${mname} · aucune saisie` : `${mname} · ${r0(v)} ${unit} en moyenne (${ds.length} j)` };
      });
    } else {
      pts = days.map((d, i) => {
        const k = dkey(d), t = dayTotals(k), v = t.n ? t[key] : null;
        const tick = UI.period === 'week' ? WD[i] : ([1, 5, 10, 15, 20, 25, 30].includes(d.getDate()) ? String(d.getDate()) : '');
        return { v, g: S.days[k]?.goal?.[gk] || goal, tick, tip: `${cap(F.short.format(d))} · ${v == null ? 'aucune saisie' : r0(v) + ' ' + unit}` };
      });
    }
    if (!pts.some(p => p.v != null)) { wrap.innerHTML = '<div class="empty">Aucune donnée sur cette période.</div>'; return; }
    const W = Math.max(260, wrap.clientWidth || 320), H = 220, M = { l: 40, r: 6, t: 30, b: 24 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;
    const maxV = Math.max(goal, ...pts.map(p => p.v || 0)) * 1.08;
    const step = niceStep(maxV), top = Math.ceil(maxV / step) * step;
    const y = v => M.t + ph - v / top * ph;
    const n = pts.length, band = pw / n, bw = Math.max(3, Math.min(26, band - Math.max(2, band * 0.32)));
    const color = m === 'kcal' ? 'var(--accent)' : 'var(--protein)';
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphique ${m === 'kcal' ? 'des calories' : 'des protéines'}">`;
    for (let v = 0; v <= top + 1e-9; v += step) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${r0(v)}</text>`;
    pts.forEach((p, i) => {
      const cx = M.l + band * i + band / 2;
      if (p.v != null && p.v > 0) {
        const yt = y(p.v), fill = m === 'kcal' && p.v > p.g ? 'var(--warn)' : color;
        s += `<path d="${barPath(cx - bw / 2, yt, bw, M.t + ph - yt, 4)}" style="fill:${fill}"/>`;
      }
      if (p.tick) s += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${p.tick}</text>`;
    });
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(goal)}" y2="${y(goal)}" stroke-dasharray="5 4" stroke-width="1.5" style="stroke:var(--ink-2)"/>`;
    pts.forEach((p, i) => { s += `<rect data-i="${i}" x="${M.l + band * i}" y="${M.t - 10}" width="${band}" height="${ph + 10}" fill="transparent"/>`; });
    s += '</svg><div class="chart-tip"></div>';
    wrap.innerHTML = s;
    bindTip(wrap, i => ({ x: M.l + band * i + band / 2, text: pts[i].tip }));
  }

  function drawWeight(wrap, r) {
    const tgt = S.profile.target;
    const pts = sortedWeights().filter(w => w.date >= dkey(r.start) && w.date <= dkey(r.end)).map(w => ({ t: dparse(w.date).getTime() + 432e5, v: w.kg, date: w.date }));
    if (!pts.length) { wrap.innerHTML = '<div class="empty">Aucune pesée sur cette période.<br><button class="btn plain" data-action="add-weight">Ajouter une pesée</button></div>'; return; }
    const W = Math.max(260, wrap.clientWidth || 320), H = 220, M = { l: 40, r: 12, t: 30, b: 24 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;
    const t0 = r.start.getTime(), t1 = addDays(r.end, 1).getTime();
    const x = t => M.l + (t - t0) / (t1 - t0) * pw;
    let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
    const showT = tgt && tgt >= lo - 3 && tgt <= hi + 3;
    if (showT) { lo = Math.min(lo, tgt); hi = Math.max(hi, tgt); }
    const padv = Math.max(0.5, (hi - lo) * 0.15); lo -= padv; hi += padv;
    const step = niceStep(hi - lo); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const y = v => M.t + ph - (v - lo) / (hi - lo) * ph;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graphique du poids">`;
    for (let v = lo; v <= hi + 1e-9; v += step) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${r1(v)}</text>`;
    const ticks = UI.period === 'week' ? daysIn(r.start, r.end).map((d, i) => [d.getTime() + 432e5, WD[i]])
      : UI.period === 'month' ? daysIn(r.start, r.end).filter(d => [1, 8, 15, 22, 29].includes(d.getDate())).map(d => [d.getTime() + 432e5, String(d.getDate())])
        : MO.map((l, i) => [new Date(r.start.getFullYear(), i, 15).getTime(), l]);
    ticks.forEach(([t, l]) => { s += `<text x="${x(t)}" y="${H - 6}" text-anchor="middle">${l}</text>`; });
    if (showT) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(tgt)}" y2="${y(tgt)}" stroke-dasharray="5 4" stroke-width="1.5" style="stroke:var(--ink-2)"/>`;
    if (pts.length > 1) s += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ',' + y(p.v).toFixed(1)).join('')}" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--accent)"/>`;
    pts.forEach(p => { s += `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="4.5" stroke-width="2" style="fill:var(--accent);stroke:var(--card)"/>`; });
    s += `<rect data-all="1" x="${M.l}" y="${M.t - 10}" width="${pw}" height="${ph + 10}" fill="transparent"/></svg><div class="chart-tip"></div>`;
    wrap.innerHTML = s;
    bindTip(wrap, null, ev => {
      const rect = wrap.querySelector('svg').getBoundingClientRect(); const px = ev.clientX - rect.left;
      let best = pts[0]; for (const p of pts) if (Math.abs(x(p.t) - px) < Math.abs(x(best.t) - px)) best = p;
      return { x: x(best.t), text: `${cap(F.short.format(dparse(best.date)))} · ${r1(best.v)} kg` };
    });
  }

  /* ---------- Projection du poids jusqu'à l'objectif ---------- */
  const DAY = 864e5;
  // Rythme réel : régression linéaire sur les pesées des 28 derniers jours (≥ 10 jours d'écart),
  // sinon déficit moyen des 14 derniers jours saisis (≥ 5 jours). Renvoie kg / jour (négatif = perte).
  function realRate() {
    const ws = sortedWeights();
    if (ws.length >= 2) {
      const lastT = dparse(ws[ws.length - 1].date).getTime();
      const pts = ws.filter(w => dparse(w.date).getTime() >= lastT - 28 * DAY).map(w => [dparse(w.date).getTime() / DAY, w.kg]);
      if (pts.length >= 2 && pts[pts.length - 1][0] - pts[0][0] >= 10) {
        const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
        const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
        return { rate: slope, basis: `tendance de tes pesées sur ${Math.round(pts[n - 1][0] - pts[0][0])} jours` };
      }
    }
    const days = []; for (let i = 1; i <= 14; i++) { const k = dkey(addDays(new Date(), -i)); if (S.days[k]?.entries.length) days.push(k); }
    if (days.length >= 5) {
      const avg = days.reduce((a, k) => a + (dayBurn(k).v - dayTotals(k).kcal), 0) / days.length;
      return { rate: -avg / 7700, basis: `déficit moyen de tes ${days.length} derniers jours saisis (${r0(avg)} kcal/j)` };
    }
    return null;
  }
  function projection() {
    const p = S.profile, ws = sortedWeights();
    const cur = currentWeight(), tgt = p.target;
    if (!tgt) return { none: 'Ajoute un poids objectif dans ton profil pour voir la projection.' };
    const start = ws.length ? Math.max(ws[0].kg, p.weight || 0) : p.weight;
    const done = start - cur, total = start - tgt, pct = total > 0 ? Math.max(0, Math.min(100, done / total * 100)) : 100;
    if (cur <= tgt) return { reached: true, start, cur, tgt, pct: 100 };
    const planned = p.pace > 0 ? { rate: -p.pace / 7, basis: `rythme prévu de ton profil (${r1(p.pace)} kg/semaine)` } : null;
    const real = realRate();
    const realOk = real && real.rate < -0.005;
    const mode = UI.proj === 'planned' || !real ? 'planned' : 'real';
    const use = mode === 'real' ? real : planned;
    const base = { start, cur, tgt, pct, done, planned, real, realOk, mode };
    if (!use || use.rate >= -0.005) return { ...base, stalled: true, use };
    const t0 = ws.length ? dparse(ws[ws.length - 1].date) : dparse(today());
    const daysTo = Math.ceil((cur - tgt) / -use.rate);
    const capped = daysTo > 730;
    const end = addDays(t0, Math.min(daysTo, 730));
    const at = d => Math.max(tgt, cur + use.rate * (d.getTime() - t0.getTime()) / DAY);
    const months = [];
    for (let m = new Date(t0.getFullYear(), t0.getMonth() + 1, 0); m < end && months.length < 24; m = new Date(m.getFullYear(), m.getMonth() + 2, 0)) {
      if (m.getTime() - t0.getTime() >= 7 * DAY) months.push({ d: m, kg: at(m) });
    }
    return { ...base, use, t0, end, daysTo, capped, months, at, weekly: use.rate * 7 };
  }
  function viewProjection() {
    const P = projection();
    if (P.none) return `<section class="card proj"><h3>Projection</h3><p class="note" style="margin:0">${P.none}</p></section>`;
    const bar = `<div class="proj-bar"><div style="width:${P.pct}%"></div></div>
      <div class="row between small muted num" style="margin-top:6px"><span>Départ ${r1(P.start)} kg</span><span><b style="color:var(--ink)">${r1(P.cur)} kg</b></span><span>Objectif ${r1(P.tgt)} kg</span></div>`;
    if (P.reached) return `<section class="card proj"><h3>Projection</h3><div class="proj-head">🎉 Objectif atteint !</div>${bar}<p class="note">Passe le rythme sur « Maintenir mon poids » dans ton profil, ou fixe un nouvel objectif.</p></section>`;
    const toggle = P.real && P.planned ? `<div class="seg" style="margin:12px 0 4px"><button data-action="proj" data-v="real" class="${P.mode === 'real' ? 'on' : ''}">Rythme réel</button><button data-action="proj" data-v="planned" class="${P.mode === 'planned' ? 'on' : ''}">Rythme prévu</button></div>` : '';
    if (P.stalled) return `<section class="card proj"><h3>Projection jusqu'à l'objectif</h3><div class="proj-head">${r1(P.done > 0 ? P.done : 0)} kg perdus · ${Math.round(P.pct)} %</div>${bar}${toggle}
      <p class="note">${P.use ? `D'après la ${esc(P.use.basis)}, ton poids ne baisse pas pour l'instant : la projection n'est pas calculable. Vérifie que tout est bien saisi, puis réduis ta cible de 100 à 200 kcal si ça dure plus de 3 semaines.` : 'Choisis un rythme de perte dans ton profil, ou saisis au moins 5 jours de repas, pour voir la projection.'}</p></section>`;
    const lastM = P.months[P.months.length - 1];
    const row = m => `<div class="proj-row"><span>${cap(F.month.format(m.d))}</span><b class="num">${r1(m.kg)} kg</b><span class="num good-text">−${r1(P.cur - m.kg)}</span></div>`;
    const rows3 = P.months.slice(0, 3).map(row).join(''), rowsMore = P.months.slice(3, 24).map(row).join('');
    return `<section class="card proj">
      <h3>Projection jusqu'à l'objectif</h3>
      <div class="proj-head">${P.capped ? 'Objectif dans plus de 2 ans à ce rythme' : `🎯 ${r1(P.tgt)} kg vers ${F.month.format(P.end)}`}</div>
      <div class="muted small">${r1(Math.max(0, P.done))} kg perdus · ${Math.round(P.pct)} % du chemin · encore ${r1(P.cur - P.tgt)} kg${P.capped ? '' : ` en ~${Math.max(1, Math.round(P.daysTo / 7))} semaines`}</div>
      ${bar}
      ${toggle}
      <div class="chart-wrap" id="proj-chart" style="margin-top:10px"></div>
      <div class="legend"><span><i style="background:var(--accent);border-radius:50%"></i>Pesées</span><span><i class="dash" style="border-color:var(--accent)"></i>Projection</span><span><i class="dash"></i>Objectif</span></div>
      <div class="proj-list">${rows3}${rowsMore ? `<details><summary>Voir tous les mois (${P.months.length})</summary>${rowsMore}</details>` : ''}
        ${P.capped ? '' : `<div class="proj-row goal"><span>🎯 ${cap(F.dmy.format(P.end))}</span><b class="num">${r1(P.tgt)} kg</b><span class="num good-text">−${r1(P.cur - P.tgt)}</span></div>`}</div>
      <p class="note" style="margin:8px 0 0">Base : ${esc(P.use.basis)} (−${r1(Math.abs(P.weekly))} kg/semaine). ${P.mode === 'real' ? 'Se met à jour à chaque pesée.' : 'Si tu suis ton objectif chaque jour.'} Le poids fluctue de ±1 kg d'un jour à l'autre (eau, sel) : fie-toi à la tendance.</p>
    </section>`;
  }
  function drawProjection() {
    const wrap = $('#proj-chart'); if (!wrap) return;
    const P = projection(); if (!P.months) return;
    const hist = sortedWeights().filter(w => dparse(w.date) >= addDays(P.t0, -90)).map(w => ({ t: dparse(w.date).getTime(), v: w.kg, date: w.date }));
    const tStart = hist.length ? Math.min(hist[0].t, P.t0.getTime()) : P.t0.getTime();
    const tEnd = P.end.getTime() + 10 * DAY;
    const W = Math.max(260, wrap.clientWidth || 320), H = 200, M = { l: 40, r: 12, t: 30, b: 24 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;
    const x = t => M.l + (t - tStart) / (tEnd - tStart) * pw;
    let lo = Math.min(P.tgt, ...hist.map(h => h.v)), hi = Math.max(P.cur, ...hist.map(h => h.v));
    const padv = Math.max(0.5, (hi - lo) * 0.1); lo -= padv; hi += padv;
    const step = niceStep(hi - lo); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const y = v => M.t + ph - (v - lo) / (hi - lo) * ph;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Projection du poids jusqu'à l'objectif">`;
    for (let v = lo; v <= hi + 1e-9; v += step) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${r1(v)}</text>`;
    // repères de mois
    const nM = P.months.length, every = nM > 12 ? 3 : nM > 6 ? 2 : 1;
    P.months.forEach((m, i) => { if (i % every === 0) s += `<text x="${x(m.d.getTime())}" y="${H - 6}" text-anchor="middle">${MO[m.d.getMonth()]}</text>`; });
    s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(P.tgt)}" y2="${y(P.tgt)}" stroke-dasharray="5 4" stroke-width="1.5" style="stroke:var(--ink-2)"/>`;
    if (hist.length > 1) s += `<path d="${hist.map((h, i) => (i ? 'L' : 'M') + x(h.t).toFixed(1) + ',' + y(h.v).toFixed(1)).join('')}" fill="none" stroke-width="2" stroke-linejoin="round" style="stroke:var(--accent)"/>`;
    const projPts = [{ t: P.t0.getTime(), v: P.cur }, ...P.months.map(m => ({ t: m.d.getTime(), v: m.kg })), { t: P.end.getTime(), v: P.at(P.end) }];
    s += `<path d="${projPts.map((h, i) => (i ? 'L' : 'M') + x(h.t).toFixed(1) + ',' + y(h.v).toFixed(1)).join('')}" fill="none" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round" style="stroke:var(--accent)"/>`;
    hist.forEach(h => { s += `<circle cx="${x(h.t)}" cy="${y(h.v)}" r="4" stroke-width="2" style="fill:var(--accent);stroke:var(--card)"/>`; });
    P.months.forEach(m => { s += `<circle cx="${x(m.d.getTime())}" cy="${y(m.kg)}" r="4" stroke-width="2" style="fill:var(--card);stroke:var(--accent)"/>`; });
    if (!P.capped) { const fx = x(P.end.getTime()), fy = y(P.tgt); s += `<circle cx="${fx}" cy="${fy}" r="6" style="fill:var(--accent)"/><text x="${Math.min(fx, W - M.r - 4)}" y="${fy + 18}" text-anchor="end" style="fill:var(--accent);font-weight:700">${r1(P.tgt)} kg</text>`; }
    s += `<rect x="${M.l}" y="${M.t - 10}" width="${pw}" height="${ph + 10}" fill="transparent"/></svg><div class="chart-tip"></div>`;
    wrap.innerHTML = s;
    const all = [...hist.map(h => ({ t: h.t, text: `${cap(F.short.format(new Date(h.t)))} · ${r1(h.v)} kg (pesée)` })), ...P.months.map(m => ({ t: m.d.getTime(), text: `Fin ${F.month.format(m.d)} · ≈ ${r1(m.kg)} kg` })), ...(P.capped ? [] : [{ t: P.end.getTime(), text: `🎯 ${cap(F.dmy.format(P.end))} · ${r1(P.tgt)} kg` }])];
    bindTip(wrap, null, ev => {
      const px = ev.clientX - wrap.querySelector('svg').getBoundingClientRect().left;
      let best = all[0]; for (const a of all) if (Math.abs(x(a.t) - px) < Math.abs(x(best.t) - px)) best = a;
      return { x: x(best.t), text: best.text };
    });
  }

  function bindTip(wrap, byIndex, byEvent) {
    const tip = wrap.querySelector('.chart-tip'), svg = wrap.querySelector('svg');
    const show = ev => {
      let info = null;
      if (byEvent) info = byEvent(ev);
      else { const i = ev.target?.dataset?.i; if (i == null) return; info = byIndex(+i); }
      tip.textContent = info.text; tip.classList.add('show');
      const w = tip.offsetWidth, W = wrap.clientWidth;
      tip.style.left = Math.min(W - w / 2, Math.max(w / 2, info.x)) + 'px';
    };
    svg.addEventListener('pointerdown', show); svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') tip.classList.remove('show'); });
  }

  /* ---------- Écran : ajouter un aliment ---------- */
  function openAdd(meal, date = UI.date) {
    const sh = makeSheet(`Ajouter · ${mealName(meal)}`);
    sh.setBody(`
      <div class="quick-actions">
        <button data-a="scan">${ICON.scan}Scanner</button>
        <button data-a="quick">${ICON.bolt}Ajout rapide</button>
        <button data-a="create">${ICON.plus}Créer</button>
      </div>
      <form class="searchbar"><input type="search" placeholder="Rechercher un aliment ou une marque" enterkeyhint="search" autocomplete="off" aria-label="Rechercher"><button class="btn" type="submit" aria-label="Rechercher sur Open Food Facts">${ICON.search}</button></form>
      <div data-a="results"></div>`);
    const input = $('input', sh.body), res = $('[data-a="results"]', sh.body);
    let list = [], offList = null, offState = '', q = '';
    const ctx = { meal, date };
    const draw = () => {
      const local = q ? localSearch(q) : S.recents.slice(0, 25);
      list = [...local, ...(offList || [])];
      let h = '';
      if (!q) h += local.length ? `<h3>Récents</h3><section class="card list">${local.map((f, i) => foodItem(f, i)).join('')}</section>` : `<div class="empty">Scanne un produit ou recherche un aliment.<br><span class="small">Les aliments utilisés apparaîtront ici.</span></div>`;
      else {
        h += local.length ? `<h3>Mes aliments & génériques</h3><section class="card list">${local.map((f, i) => foodItem(f, i)).join('')}</section>` : '';
        h += `<h3>Open Food Facts</h3>`;
        if (offState === 'loading') h += '<div class="spinner"></div>';
        else if (offState === 'error') h += `<div class="card empty small">${esc(offList?.error || '')}<br><button class="btn plain" data-a="off">Réessayer</button></div>`;
        else if (offList) h += offList.length ? `<section class="card list">${offList.map((f, i) => foodItem(f, local.length + i)).join('')}</section>` : '<div class="card empty small">Aucun produit trouvé.</div>';
        else h += `<button class="btn block outline" data-a="off">Chercher « ${esc(q)} » dans Open Food Facts</button>`;
      }
      res.innerHTML = h;
    };
    const runOff = async () => {
      const qq = q.trim(); if (!qq) return;
      offState = 'loading'; offList = null; draw();
      try { const r = await offSearch(qq); if (qq !== q.trim()) return; offList = r; offState = ''; }
      catch (e) { offList = []; offList.error = netError(e); offState = 'error'; }
      draw();
    };
    input.addEventListener('input', () => { q = input.value; offList = null; offState = ''; draw(); });
    $('form', sh.body).addEventListener('submit', e => { e.preventDefault(); input.blur(); runOff(); });
    sh.body.addEventListener('click', e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'scan') return openScanner(ctx);
      if (a === 'quick') return openQuick(ctx);
      if (a === 'create') return openFoodForm(null, { ctx });
      if (a === 'off') return runOff();
      const it = e.target.closest('.item[data-i]');
      if (it) openDetail(list[+it.dataset.i], ctx);
    });
    draw();
    openSheet(sh.el);
  }

  /* ---------- Écran : fiche aliment / quantité ---------- */
  function fillDetail(sh, food, ctx) {
    const entry = ctx.entry;
    sh.title(entry ? "Modifier l'aliment" : 'Ajouter un aliment');
    if (!food.per100) {
      sh.setBody(`<div class="food-hero">${food.img ? `<img src="${esc(food.img)}" alt="" referrerpolicy="no-referrer">` : ''}<div><div class="title">${esc(food.name)}</div><div class="muted">${esc(food.brand)}</div></div></div>
        <div class="card"><p style="margin-top:0">Ce produit existe sur Open Food Facts mais ses valeurs nutritionnelles n'ont pas été renseignées.</p><button class="btn block" data-a="complete">Saisir les valeurs de l'étiquette</button></div>`);
      sh.setFoot('');
      $('[data-a="complete"]', sh.body).onclick = () => openFoodForm({ name: food.name, brand: food.brand, code: food.code }, { ctx, replace: sh });
      return;
    }
    const recent = S.recents.find(r => foodKey(r) === foodKey(food));
    let mode = 'g', qty = 100;
    if (entry) { if (entry.count && entry.unit) { mode = 'u'; qty = entry.count; } else qty = Math.round(entry.grams * 10) / 10; }
    else if (recent?.lastGrams) { if (recent.lastCount && food.unit) { mode = 'u'; qty = recent.lastCount; } else qty = recent.lastGrams; }
    else if (food.unit) { mode = 'u'; qty = 1; }
    const p = food.per100;
    sh.setBody(`
      <div class="food-hero">${food.img ? `<img src="${esc(food.img)}" alt="" referrerpolicy="no-referrer">` : ''}
        <div class="grow"><div class="title">${esc(food.name)}</div><div class="muted small">${esc([food.brand, food.qtyLabel].filter(Boolean).join(' · '))}</div>
        <div style="margin-top:6px">${food.ns ? `<span class="badge ns ns-${food.ns}">Nutri-Score ${food.ns.toUpperCase()}</span> ` : ''}<span class="badge">${food.src === 'off' ? 'Open Food Facts' : food.src === 'custom' ? 'Mon aliment' : 'Générique'}</span></div></div></div>
      <section class="card"><div class="nutri-grid"><div class="kc"><b class="num" data-o="kcal"></b><span>kcal</span></div><div class="pr"><b class="num" data-o="p"></b><span>protéines</span></div><div><b class="num" data-o="c"></b><span>glucides</span></div><div><b class="num" data-o="f"></b><span>lipides</span></div></div></section>
      <section class="card stack">
        <div class="qty-row"><label class="field"><span>Quantité</span><input type="number" inputmode="decimal" step="any" min="0" data-f="qty" value="${qty}"></label>
        <label class="field"><span>Unité</span><select data-f="mode"><option value="g" ${mode === 'g' ? 'selected' : ''}>grammes (g / ml)</option>${food.unit ? `<option value="u" ${mode === 'u' ? 'selected' : ''}>${esc(food.unit.label)}${/\d\s*(g|ml)\b/i.test(food.unit.label) ? '' : ` — ${r0(food.unit.g)} g`}</option>` : ''}</select></label></div>
        <div class="chips" data-f="chips"></div>
        <label class="field"><span>Repas</span><select data-f="meal">${mealOptions(entry ? entry.meal : ctx.meal)}</select></label>
      </section>
      <p class="note">Pour 100 g : ${r0(p.kcal)} kcal · ${r1(p.p)} g protéines · ${r1(p.c)} g glucides · ${r1(p.f)} g lipides${food.code ? ` · code ${esc(food.code)}` : ''}</p>`);
    sh.setFoot(`${entry ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">${entry ? 'Enregistrer' : 'Ajouter'}</button>`);
    const qEl = $('[data-f="qty"]', sh.body), mEl = $('[data-f="mode"]', sh.body), chips = $('[data-f="chips"]', sh.body);
    const grams = () => { const v = num(qEl.value) || 0; return mEl.value === 'u' && food.unit ? v * food.unit.g : v; };
    const upd = () => {
      const k = grams() / 100;
      $('[data-o="kcal"]', sh.body).textContent = r0(p.kcal * k);
      $('[data-o="p"]', sh.body).textContent = r1(p.p * k);
      $('[data-o="c"]', sh.body).textContent = r1(p.c * k);
      $('[data-o="f"]', sh.body).textContent = r1(p.f * k);
    };
    const drawChips = () => { chips.innerHTML = (mEl.value === 'u' ? [0.5, 1, 2, 3] : [30, 50, 100, 150, 200, 250]).map(v => `<button type="button" class="chip" data-v="${v}">${mEl.value === 'u' ? r1(v) : v + ' g'}</button>`).join(''); };
    qEl.addEventListener('input', upd);
    mEl.addEventListener('change', () => { qEl.value = mEl.value === 'u' ? 1 : (food.unit ? food.unit.g : 100); drawChips(); upd(); });
    chips.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { qEl.value = b.dataset.v; upd(); } });
    drawChips(); upd();
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'del') { deleteEntry(ctx.date, entry.id); closeAll(() => toast('Supprimé')); }
      if (a === 'save') {
        const g = grams(); if (!(g > 0)) { toast('Indique une quantité'); return; }
        const meal = $('[data-f="meal"]', sh.body).value, count = mEl.value === 'u' ? num(qEl.value) : null, k = g / 100;
        const e2 = {
          id: entry ? entry.id : uid(), meal, src: food.src, fid: food.id || '', code: food.code || '', name: food.name, brand: food.brand || '',
          per100: p, unit: food.unit || null, img: food.img || '', ns: food.ns || '', qtyLabel: food.qtyLabel || '',
          grams: g, count, kcal: p.kcal * k, p: p.p * k, c: p.c * k, f: p.f * k, t: entry ? entry.t : Date.now(),
        };
        const d = getDay(ctx.date);
        if (entry) d.entries = d.entries.map(x => x.id === entry.id ? e2 : x); else d.entries.push(e2);
        saveDay(ctx.date); pushRecent(food, g, count);
        UI.date = ctx.date; UI.tab = 'journal';
        closeAll(() => toast(entry ? 'Modifié' : `Ajouté · ${r0(e2.kcal)} kcal · ${r0(e2.p)} g prot.`));
      }
    };
  }
  function openDetail(food, ctx) { const sh = makeSheet(''); fillDetail(sh, food, ctx); openSheet(sh.el); }
  const entryFood = e => ({ src: e.src, id: e.fid, code: e.code, name: e.name, brand: e.brand, per100: e.per100, unit: e.unit, img: e.img, ns: e.ns, qtyLabel: e.qtyLabel });
  function deleteEntry(k, id) { const d = S.days[k]; if (!d) return; d.entries = d.entries.filter(e => e.id !== id); saveDay(k); }

  async function openByCode(code, ctx) {
    const local = S.foods.find(f => f.code === code);
    if (local) return openDetail(local, ctx);
    const sh = makeSheet('Produit'); sh.setBody('<div class="spinner"></div><p class="empty small">Recherche du produit ' + esc(code) + '…</p>');
    openSheet(sh.el);
    try {
      const f = await offProduct(code);
      if (f) return fillDetail(sh, f, ctx);
      sh.setBody(`<div class="card"><h2>Produit inconnu</h2><p>Le code <b>${esc(code)}</b> n'est pas dans Open Food Facts. Crée-le à partir de l'étiquette : il sera reconnu au prochain scan.</p><button class="btn block" data-a="create">Créer ce produit</button><button class="btn block plain" data-a="rescan" style="margin-top:6px">Scanner à nouveau</button></div>`);
    } catch (e) {
      sh.setBody(`<div class="card"><h2>Recherche impossible</h2><p>${esc(netError(e))}</p><button class="btn block" data-a="retry">Réessayer</button><button class="btn block plain" data-a="create" style="margin-top:6px">Saisir l'étiquette manuellement</button></div>`);
    }
    sh.body.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'create') openFoodForm({ code }, { ctx, replace: sh });
      if (a === 'rescan') closeSheet(1, () => openScanner(ctx));
      if (a === 'retry') closeSheet(1, () => openByCode(code, ctx));
    };
  }

  /* ---------- Écran : ajout rapide ---------- */
  function openQuick(ctx) {
    const e = ctx.entry;
    const sh = makeSheet(e ? 'Modifier l\'ajout rapide' : 'Ajout rapide');
    sh.setBody(`<section class="card stack">
      <label class="field"><span>Description (facultatif)</span><input type="text" data-f="name" value="${esc(e?.name && e.name !== 'Ajout rapide' ? e.name : '')}" placeholder="ex. Repas au restaurant"></label>
      <div class="grid2"><label class="field"><span>Calories (kcal) *</span><input type="number" inputmode="decimal" data-f="kcal" value="${e ? Math.round(e.kcal) : ''}"></label>
      <label class="field"><span>Protéines (g)</span><input type="number" inputmode="decimal" data-f="p" value="${e?.p ? r1(e.p).replace(',', '.') : ''}"></label>
      <label class="field"><span>Glucides (g)</span><input type="number" inputmode="decimal" data-f="c" value="${e?.c ? r1(e.c).replace(',', '.') : ''}"></label>
      <label class="field"><span>Lipides (g)</span><input type="number" inputmode="decimal" data-f="f" value="${e?.f ? r1(e.f).replace(',', '.') : ''}"></label></div>
      <label class="field"><span>Repas</span><select data-f="meal">${mealOptions(e ? e.meal : ctx.meal)}</select></label></section>`);
    sh.setFoot(`${e ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">${e ? 'Enregistrer' : 'Ajouter'}</button>`);
    sh.foot.onclick = ev => {
      const a = ev.target.closest('[data-a]')?.dataset.a; const v = n => num($(`[data-f="${n}"]`, sh.body).value);
      if (a === 'del') { deleteEntry(ctx.date, e.id); closeAll(() => toast('Supprimé')); }
      if (a === 'save') {
        const kcal = v('kcal'); if (!(kcal >= 0) || kcal === null) { toast('Indique les calories'); return; }
        const e2 = { id: e ? e.id : uid(), src: 'quick', meal: $('[data-f="meal"]', sh.body).value, name: $('[data-f="name"]', sh.body).value.trim() || 'Ajout rapide', kcal, p: v('p') || 0, c: v('c') || 0, f: v('f') || 0, t: e ? e.t : Date.now() };
        const d = getDay(ctx.date);
        if (e) d.entries = d.entries.map(x => x.id === e.id ? e2 : x); else d.entries.push(e2);
        saveDay(ctx.date); UI.date = ctx.date; UI.tab = 'journal';
        closeAll(() => toast(e ? 'Modifié' : 'Ajouté'));
      }
    };
    openSheet(sh.el);
  }

  /* ---------- Écran : créer / modifier un aliment perso ---------- */
  function openFoodForm(food, { ctx, replace } = {}) {
    const f = food || {}; const editing = !!f.id;
    const sh = makeSheet(editing ? "Modifier l'aliment" : 'Créer un aliment');
    const val = x => (x == null ? '' : String(Math.round(x * 10) / 10));
    sh.setBody(`<section class="card stack">
      <label class="field"><span>Nom *</span><input type="text" data-f="name" value="${esc(f.name || '')}" placeholder="ex. Granola maison"></label>
      <div class="grid2"><label class="field"><span>Marque</span><input type="text" data-f="brand" value="${esc(f.brand || '')}"></label>
      <label class="field"><span>Code-barres</span><input type="text" inputmode="numeric" data-f="code" value="${esc(f.code || '')}"></label></div></section>
      <h3>Valeurs pour 100 g (ou 100 ml)</h3>
      <section class="card"><div class="grid2">
      <label class="field"><span>Calories (kcal) *</span><input type="number" inputmode="decimal" data-f="kcal" value="${val(f.per100?.kcal)}"></label>
      <label class="field"><span>Protéines (g)</span><input type="number" inputmode="decimal" data-f="p" value="${val(f.per100?.p)}"></label>
      <label class="field"><span>Glucides (g)</span><input type="number" inputmode="decimal" data-f="c" value="${val(f.per100?.c)}"></label>
      <label class="field"><span>Lipides (g)</span><input type="number" inputmode="decimal" data-f="f" value="${val(f.per100?.f)}"></label></div>
      <p class="note">Si l'étiquette n'indique que les kJ, divise par 4,184.</p></section>
      <h3>Portion (facultatif)</h3>
      <section class="card"><div class="grid2"><label class="field"><span>Nom de la portion</span><input type="text" data-f="ul" value="${esc(f.unit?.label || '')}" placeholder="ex. 1 bol"></label>
      <label class="field"><span>Poids (g)</span><input type="number" inputmode="decimal" data-f="ug" value="${val(f.unit?.g)}"></label></div></section>`);
    sh.setFoot(`${editing ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">${ctx ? 'Enregistrer et continuer' : 'Enregistrer'}</button>`);
    sh.foot.onclick = ev => {
      const a = ev.target.closest('[data-a]')?.dataset.a; const g = n => $(`[data-f="${n}"]`, sh.body).value.trim();
      if (a === 'del') { S.foods = S.foods.filter(x => x.id !== f.id); Store.put('foods', S.foods); closeAll(() => toast('Aliment supprimé')); }
      if (a === 'save') {
        const name = g('name'), kcal = num(g('kcal'));
        if (!name || kcal == null) { toast('Nom et calories obligatoires'); return; }
        const ug = num(g('ug'));
        const nf = { src: 'custom', id: f.id || uid(), name, brand: g('brand'), code: g('code').replace(/\D/g, ''), per100: { kcal, p: num(g('p')) || 0, c: num(g('c')) || 0, f: num(g('f')) || 0 }, unit: ug > 0 ? { label: g('ul') || '1 portion', g: ug } : null };
        S.foods = editing ? S.foods.map(x => x.id === nf.id ? nf : x) : [nf, ...S.foods];
        Store.put('foods', S.foods);
        if (ctx) closeSheet(replace ? 2 : 1, () => openDetail(nf, ctx));
        else closeSheet(1, () => toast('Aliment enregistré'));
      }
    };
    openSheet(sh.el);
  }

  /* ---------- Écran : pesée ---------- */
  function openWeight(date) {
    const ex = date && S.weights.find(w => w.date === date);
    const sh = makeSheet(ex ? 'Modifier la pesée' : 'Nouvelle pesée');
    sh.setBody(`<section class="card stack"><label class="field"><span>Date</span><input type="date" data-f="date" value="${ex ? ex.date : today()}" max="${today()}"></label>
      <label class="field"><span>Poids (kg)</span><input type="number" inputmode="decimal" step="0.1" data-f="kg" value="${ex ? ex.kg : (currentWeight() || '')}"></label></section>
      <p class="note">Pèse-toi idéalement le matin, à jeun, dans les mêmes conditions. Regarde la tendance sur plusieurs semaines plutôt que les variations d'un jour à l'autre (eau, sel, digestion).</p>`);
    sh.setFoot(`${ex ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">Enregistrer</button>`);
    sh.foot.onclick = ev => {
      const a = ev.target.closest('[data-a]')?.dataset.a;
      if (a === 'del') { S.weights = S.weights.filter(w => w.date !== ex.date); Store.put('weights', S.weights); closeSheet(1, () => toast('Pesée supprimée')); }
      if (a === 'save') {
        const d = $('[data-f="date"]', sh.body).value, kg = num($('[data-f="kg"]', sh.body).value);
        if (!d || !(kg >= 30 && kg <= 300)) { toast('Poids invalide'); return; }
        const before = goals().kcal;
        S.weights = [...S.weights.filter(w => w.date !== d && (!ex || w.date !== ex.date)), { date: d, kg }];
        Store.put('weights', S.weights);
        const after = goals().kcal;
        closeSheet(1, () => toast(before !== after ? `Pesée enregistrée · nouvel objectif ${r0(after)} kcal` : 'Pesée enregistrée', 3200));
      }
    };
    openSheet(sh.el);
  }

  /* ---------- Scanner ---------- */
  function loadScript(src) {
    return new Promise((res, rej) => { if (window.ZXingBrowser) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('script')); document.head.appendChild(s); });
  }
  async function startCamera(video, onCode) {
    if (!navigator.mediaDevices?.getUserMedia) { const e = new Error('nomedia'); e.name = 'NoMedia'; throw e; }
    const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    let native = null;
    if ('BarcodeDetector' in window) {
      try {
        const fm = await window.BarcodeDetector.getSupportedFormats();
        const want = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(f => fm.includes(f));
        if (want.includes('ean_13')) native = new window.BarcodeDetector({ formats: want });
      } catch (e) { native = null; }
    }
    if (native) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream; await video.play().catch(() => {});
      let alive = true;
      const tick = async () => {
        if (!alive) return;
        try { if (video.readyState >= 2) { const codes = await native.detect(video); const c = codes.find(x => x.rawValue); if (c) onCode(c.rawValue); } } catch (e) { /* frame not ready */ }
        if (alive) setTimeout(tick, 120);
      };
      tick();
      return () => { alive = false; stream.getTracks().forEach(t => t.stop()); video.srcObject = null; };
    }
    await loadScript('vendor/zxing-browser.min.js');
    const reader = new window.ZXingBrowser.BrowserMultiFormatOneDReader(undefined, { delayBetweenScanAttempts: 80, delayBetweenScanSuccess: 300 });
    const controls = await reader.decodeFromConstraints(constraints, video, r => { if (r) onCode(r.getText()); });
    return () => controls.stop();
  }
  function openScanner(ctx) {
    const el = document.createElement('div'); el.className = 'scanner';
    el.innerHTML = `<video playsinline muted autoplay></video><div class="frame"></div>
      <div class="top"><button class="icon-btn" data-close aria-label="Fermer">${ICON.close}</button><b>Scanner un code-barres</b><span style="width:40px"></span></div>
      <div class="bottom"><div class="status">Démarrage de la caméra…</div>
      <form class="manual"><input type="text" inputmode="numeric" autocomplete="off" placeholder="Ou tape le code (8 à 13 chiffres)" aria-label="Code-barres"><button class="btn" type="submit">OK</button></form></div>`;
    const video = $('video', el), status = $('.status', el);
    let stop = null, done = false;
    const handle = code => {
      if (done) return; done = true;
      try { navigator.vibrate?.(60); } catch (e) { /* ignore */ }
      stop?.(); stop = null;
      closeSheet(1, () => openByCode(code, ctx));
    };
    openSheet(el, () => { done = true; stop?.(); stop = null; });
    $('[data-close]', el).onclick = () => closeSheet();
    $('form', el).addEventListener('submit', e => {
      e.preventDefault(); const c = $('input', el).value.replace(/\D/g, '');
      if (c.length < 8 || c.length > 14) { toast('Code invalide'); return; }
      handle(c);
    });
    startCamera(video, c => { if (/^\d{8,14}$/.test(c)) handle(c); })
      .then(s => { if (done) s(); else { stop = s; status.textContent = 'Vise le code-barres du produit'; } })
      .catch(e => {
        status.textContent = e.name === 'NotAllowedError' ? "Accès à la caméra refusé. Autorise-le dans les réglages du navigateur, ou tape le code ci-dessous."
          : e.name === 'NotFoundError' || e.name === 'OverconstrainedError' ? 'Aucune caméra disponible. Tape le code ci-dessous.'
            : !window.isSecureContext ? "La caméra nécessite une adresse en https://." : 'Caméra indisponible. Tape le code ci-dessous.';
      });
  }

  /* ---------- Export / import ---------- */
  async function exportData() {
    const data = { app: 'kalo', version: 1, exportedAt: new Date().toISOString(), profile: S.profile, weights: S.weights, foods: S.foods, recents: S.recents, days: S.days };
    const name = `kalo-sauvegarde-${today()}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde Kalo' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Sauvegarde téléchargée');
  }
  async function importData(file) {
    try {
      const d = JSON.parse(await file.text());
      if (d.app !== 'kalo' || !d.profile) throw new Error('format');
      if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
      await Store.clear();
      await Store.put('profile', d.profile); await Store.put('weights', d.weights || []); await Store.put('foods', d.foods || []); await Store.put('recents', d.recents || []);
      for (const k in d.days || {}) await Store.put('day:' + k, d.days[k]);
      await loadState(); render(); toast('Sauvegarde restaurée');
    } catch (e) { toast('Fichier de sauvegarde invalide'); }
  }

  /* ---------- Actions ---------- */
  const actions = {
    'day-prev': () => { UI.date = dkey(addDays(dparse(UI.date), -1)); render(); },
    'day-next': () => { UI.date = dkey(addDays(dparse(UI.date), 1)); render(); },
    add: b => openAdd(b.dataset.meal),
    'scan-global': () => {
      UI.date = UI.tab === 'journal' ? UI.date : today();
      if (isLocked(UI.date)) { UI.tab = 'journal'; render(); toast('Journée validée : touche « Rouvrir » pour ajouter'); return; }
      openScanner({ meal: guessMeal(), date: UI.date });
    },
    burn: () => openBurn(UI.date),
    validate: () => openValidate(UI.date),
    reopen: () => { const d = S.days[UI.date]; if (!d) return; delete d.validated; saveDay(UI.date); render(); toast('Journée rouverte'); },
    'edit-entry': b => {
      if (isLocked(UI.date)) { toast('Journée validée : touche « Rouvrir » pour modifier'); return; }
      const e = S.days[UI.date]?.entries.find(x => x.id === b.dataset.id); if (!e) return;
      if (e.src === 'quick') openQuick({ entry: e, date: UI.date, meal: e.meal });
      else openDetail(entryFood(e), { entry: e, date: UI.date, meal: e.meal });
    },
    'copy-prev': b => {
      const prev = S.days[dkey(addDays(dparse(UI.date), -1))]; if (!prev) return;
      const d = getDay(UI.date); const add = prev.entries.filter(e => e.meal === b.dataset.meal).map(e => ({ ...e, id: uid(), t: Date.now() }));
      d.entries.push(...add); saveDay(UI.date); render(); toast(`${add.length} aliment${add.length > 1 ? 's' : ''} copié${add.length > 1 ? 's' : ''}`);
    },
    period: b => { UI.period = b.dataset.v; UI.anchor = today(); render(); },
    metric: b => { UI.metric = b.dataset.v; render(); },
    proj: b => { UI.proj = b.dataset.v; render(); },
    'per-prev': () => shiftPeriod(-1),
    'per-next': () => shiftPeriod(1),
    'add-weight': () => openWeight(),
    'edit-weight': b => openWeight(b.dataset.date),
    'create-food': () => openFoodForm(null),
    'onboard-done': () => {
      const p = readProfileForm($('#oform')); if (!profileValid(p) || !p.weight) return;
      S.profile = { ...p, goalMode: 'auto', createdAt: today() };
      S.weights = [{ date: today(), kg: p.weight }];
      Store.put('profile', S.profile); Store.put('weights', S.weights);
      try { navigator.storage?.persist?.(); } catch (e) { /* ignore */ }
      UI.tab = 'journal'; render();
    },
    'save-profile': () => {
      const p = readProfileForm($('#pform')); delete p.weight;
      if (!profileValid(p)) { toast('Vérifie les valeurs du profil'); return; }
      S.profile = { ...S.profile, ...p }; Store.put('profile', S.profile); render(); toast(`Profil enregistré · objectif ${r0(goals().kcal)} kcal`);
    },
    'goal-mode': b => { S.profile.goalMode = b.dataset.v; Store.put('profile', S.profile); render(); },
    'save-manual': () => {
      const k = num($('#mk').value), p = num($('#mp').value);
      if (!(k >= 800 && k <= 6000) || !(p >= 20 && p <= 400)) { toast('Valeurs hors limites'); return; }
      S.profile.kcalGoal = k; S.profile.proteinGoal = p; Store.put('profile', S.profile); render(); toast('Objectifs enregistrés');
    },
    export: () => exportData(),
    reset: async () => {
      if (!confirm('Effacer définitivement toutes tes données (journal, pesées, aliments) ?')) return;
      if (!confirm('Dernière confirmation : cette action est irréversible.')) return;
      await Store.clear(); await loadState(); UI.tab = 'journal'; UI.date = today(); render();
    },
    install: async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; render(); },
  };

  document.addEventListener('click', e => {
    if (e.target.matches?.('input[type=date]')) { try { e.target.showPicker?.(); } catch (err) { /* ignore */ } }
    const tab = e.target.closest('[data-tab]');
    if (tab) { UI.tab = tab.dataset.tab; if (UI.tab === 'progress') UI.anchor = today(); render(); window.scrollTo(0, 0); return; }
    const b = e.target.closest('[data-action]');
    if (b && !b.disabled && actions[b.dataset.action]) { actions[b.dataset.action](b, e); return; }
    const it = e.target.closest('#view [data-list] .item[data-i]');
    if (it) {
      const isCustom = it.closest('[data-list]').dataset.list === 'custom';
      const f = (isCustom ? S.foods : S.recents)[+it.dataset.i];
      if (isCustom) openFoodForm(f);
      else if (isLocked(today())) toast("Journée d'aujourd'hui validée : rouvre-la pour ajouter");
      else { UI.date = today(); openDetail(f, { meal: guessMeal(), date: UI.date }); }
    }
  });
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-input]'); if (!t) return;
    if (t.dataset.input === 'date' && t.value) { UI.date = t.value; render(); }
    if (t.dataset.input === 'import' && t.files[0]) importData(t.files[0]);
  });

  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (UI.tab === 'progress' && !stack.length) { drawChart(); drawProjection(); } }, 150); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (UI.tab === 'profile') render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && UI.date !== today() && UI.tab === 'journal' && !stack.length && UI._lastToday !== today()) { UI.date = today(); render(); } UI._lastToday = today(); });

  /* ---------- Démarrage ---------- */
  (async () => {
    history.replaceState({ sheet: 0 }, '');
    UI._lastToday = today();
    await Store.open();
    try { await loadState(); } catch (e) { toast('Erreur de lecture des données'); }
    render();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  })();
})();
