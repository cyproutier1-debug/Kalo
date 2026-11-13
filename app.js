'use strict';
(() => {
  const APP_VERSION = '3.13.1';

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
    pill: '<svg viewBox="0 0 24 24"><g transform="rotate(-45 12 12)"><rect x="3" y="8.3" width="18" height="7.4" rx="3.7"/><path d="M12 8.3v7.4"/></g></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.6"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path style="fill:var(--accent)" d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.3 2.2-3 2.3 1.8 3.5 4.3 3.5 6.6C18.5 19.3 15.6 22 12 22s-6.5-2.7-6.5-6.4C5.5 10.5 11 8.5 12 2z"/></svg>',
    fork: '<svg viewBox="0 0 24 24" fill="none" style="stroke:var(--accent)" stroke-width="2" stroke-linecap="round"><path d="M6 3v7a2 2 0 002 2v9M10 3v7a2 2 0 01-2 2M8 3v6M17 21V3c-2 1.5-3 4-3 7v3h3"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/></svg>',
    bars: '<svg viewBox="0 0 24 24" style="stroke:none"><rect x="3" y="12" width="4.5" height="9" rx="1.5" style="fill:var(--accent)"/><rect x="9.75" y="7" width="4.5" height="14" rx="1.5" style="fill:var(--accent)"/><rect x="16.5" y="3" width="4.5" height="18" rx="1.5" style="fill:var(--accent)"/></svg>',
    watch: '<svg viewBox="0 0 24 24" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="3.5"/><path d="M9 6l.6-3h4.8L15 6M9 18l.6 3h4.8l.6-3M12 9.5V12l1.5 1"/></svg>',
    muscle: '<svg viewBox="0 0 24 24"><path style="fill:var(--accent)" d="M3.5 16.5c0-4.6 1.8-10 5.6-11.6 1.4-.6 2.8.4 2.4 1.9l-.9 3.1c2.4-1.3 5.8-1.2 7.9.9 2.7 2.6 2.3 6.4-.8 8.3-3.6 2.2-10.5 2.4-14.2-.9z"/></svg>',
    drop: c => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 2.5C9 7 6 10.2 6 14a6 6 0 0012 0c0-3.8-3-7-6-11.5z"/></svg>`,
    dumbbell: '<svg viewBox="0 0 24 24" stroke-linecap="round"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>',
    body: '<svg viewBox="0 0 48 48"><circle cx="24" cy="12" r="6"/><path d="M10 44c0-11 3-20 14-20s14 9 14 20M17 30c2 2 4.5 3 7 3s5-1 7-3M24 33v8M18 38h12"/></svg>',
  };

  const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgK" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent-hi)"/><stop offset="1" style="stop-color:var(--accent-lo)"/></linearGradient></defs><circle cx="20" cy="20" r="14.5" fill="none" style="stroke:rgba(var(--accent-rgb),.22)" stroke-width="5.5"/><path d="M20 5.5 A14.5 14.5 0 1 1 5.5 20" fill="none" stroke="url(#lgK)" stroke-width="5.5" stroke-linecap="round"/><circle cx="20" cy="20" r="4.6" fill="#DCFBEA"/></svg>';
  const brandHTML = () => `<div class="brand">${LOGO}<span>Ka<b>lo</b></span></div>`;
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

  const celebrate = getEl => { try { window.KaloFX?.celebrate(getEl, S.fx); } catch (e) { /* ignore */ } };
  function toast(msg, ms = 2200) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------- Couleur de l'app ---------- */
  const THEMES = [['Vert', '#2EE68A'], ['Cyan', '#22D3EE'], ['Bleu', '#3D9BFF'], ['Violet', '#A76BFF'], ['Rose', '#FF5FA8'], ['Rouge', '#FF4D5E'], ['Orange', '#FF9A2E'], ['Jaune', '#FFD23F']];
  function applyTheme(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) hex = '#FFD23F';
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const mix = (t, to) => '#' + rgb.map((v, i) => Math.round(v + (to[i] - v) * t).toString(16).padStart(2, '0')).join('');
    const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    const st = document.documentElement.style;
    st.setProperty('--accent', hex); st.setProperty('--accent-rgb', rgb.join(','));
    st.setProperty('--accent-hi', mix(0.35, [255, 255, 255])); st.setProperty('--accent-lo', mix(0.22, [0, 0, 0]));
    st.setProperty('--on-accent', lum > 0.55 ? '#06110B' : '#FFFFFF');
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
  const S = { profile: null, days: {}, weights: [], foods: [], recents: [], off: {}, photo: '', supps: [], ai: { provider: 'gemini', keys: {} }, theme: '#FFD23F', fx: { anim: true, sound: true } };
  const UI = { tab: 'journal', date: today(), period: 'week', metric: 'kcal', anchor: today(), proj: 'auto', mini: 30 };

  async function loadState() {
    const all = await Store.loadAll();
    S.profile = all.profile || null; S.weights = all.weights || []; S.foods = all.foods || []; S.recents = all.recents || []; S.photo = all.photo || ''; S.photoPos = all.photoPos || null; S.nutriFix = all.nutriFix || {}; S.avatar = all.avatar || ''; S.supps = all.supps || []; S.ai = all.ai || { provider: 'gemini', keys: {} }; S.theme = all.theme || (all.profile ? '#2EE68A' : '#FFD23F'); applyTheme(S.theme); /* jaune par défaut pour les nouveaux comptes, vert conservé pour les anciens sans choix */ S.fx = { anim: true, sound: true, ...(all.fx || {}) }; Mu.onLoad(all); Bo.onLoad(all); So.onLoad(all);
    S.days = {}; S.off = {};
    for (const k in all) {
      if (k.startsWith('day:')) S.days[k.slice(4)] = all[k];
      else if (k.startsWith('off:')) S.off[k.slice(4)] = all[k];
    }
  }

  function saveDay(k) {
    const d = S.days[k];
    if (!d || (!d.entries.length && d.burn == null && d.active == null && !d.validated && !d.kcalOv && !(d.mealsDone && Object.keys(d.mealsDone).length) && !(d.supps && Object.keys(d.supps).length) && !d.water)) { delete S.days[k]; return Store.del('day:' + k); }
    if (k === today() || !d.goal) { const g = goals(k); d.goal = { kcal: g.kcal, protein: g.protein, carbs: g.carbs, tdee: g.tdee }; }
    return Store.put('day:' + k, d);
  }
  const getDay = k => (S.days[k] = S.days[k] || { entries: [] });
  const isLocked = k => !!S.days[k]?.validated;
  // Dépense du jour : saisie (montre / Santé) ou estimation du profil
  // Correction de la montre : les montres surestiment surtout les calories ACTIVES ; la dépense au repos est fiable.
  const watchCorr = d => (d && d.corr != null ? d.corr : (S.profile?.watchCorr ?? 25)) / 100;
  function dayBurn(k) {
    const d = S.days[k];
    if (d && d.active != null) {
      const bmr = d.bmr || calc(S.profile).bmr, c = watchCorr(d), cut = Math.round(d.active * c);
      return { v: bmr + d.active - cut, measured: true, active: d.active, bmr, cut, pct: Math.round(c * 100) };
    }
    if (d && d.burn != null) {
      const bmr = calc(S.profile).bmr; let extra = 0, restSoFar = bmr;
      if (d.burnAt) { const at = new Date(d.burnAt); if (dkey(at) === k) { const h = at.getHours() + at.getMinutes() / 60; extra = Math.round(bmr / 24 * Math.max(0, 24 - h)); restSoFar = bmr / 24 * h; } }
      const c = watchCorr(d), cut = Math.round(Math.max(0, d.burn - restSoFar) * c);
      return { v: d.burn - cut + extra, measured: true, total: true, raw: d.burn, extra, cut, pct: Math.round(c * 100) };
    }
    return { v: (k !== today() && d?.goal?.tdee) || goals().tdee, measured: false };
  }
  const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + r0(Math.abs(n));

  /* ---------- Objectifs ---------- */
  function sortedWeights() { return S.weights.slice().sort((a, b) => (a.date < b.date ? -1 : 1)); }
  function currentWeight() { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : S.profile?.weight; }

  // Lipides = 25 % des calories, glucides = le reste après protéines et lipides
  function macroSplit(kcal, protein, carbsOverride) {
    const fat = Math.round(kcal * 0.25 / 9);
    const carbs = carbsOverride || Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4 / 5) * 5);
    return { fat, carbs };
  }
  function calc(p, w = currentWeight(), tdeeOverride = null) {
    const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
    const formula = bmr * p.activity;
    const tdee = tdeeOverride || formula;
    const reached = p.target && w <= p.target;
    const deficit = reached ? 0 : Math.min((p.pace || 0) * 7700 / 7, 1000);
    const floor = p.sex === 'm' ? 1500 : 1200;
    const raw = tdee - deficit;
    const kcal = Math.round(Math.max(raw, floor) / 10) * 10;
    const refW = p.target && p.target < w ? p.target : w;
    const protein = Math.round(refW * 1.8 / 5) * 5;
    const { fat, carbs } = macroSplit(kcal, protein);
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), formulaTdee: Math.round(formula), kcal, protein, fat, carbs, floored: raw < floor, reached };
  }
  // Moyenne des dépenses saisies depuis la montre sur les 28 derniers jours complets (hors aujourd'hui)
  function watchStats() {
    const ks = [];
    for (let i = 1; i <= 28; i++) { const k = dkey(addDays(new Date(), -i)); const d = S.days[k]; if (d && (d.burn != null || d.active != null)) ks.push(k); }
    return { n: ks.length, avg: ks.length ? Math.round(ks.reduce((a, k) => a + dayBurn(k).v, 0) / ks.length) : null };
  }
  function goals(k) {
    const g0 = baseGoals();
    const ov = k && S.days[k]?.kcalOv;
    if (!ov || !g0) return g0;
    return { ...g0, baseKcal: g0.kcal, ov: true, kcal: ov, ...macroSplit(ov, g0.protein) };
  }
  function baseGoals() {
    const p = S.profile;
    if (!p) return { kcal: 2000, protein: 120, tdee: 2000 };
    const ws = watchStats();
    const useWatch = p.tdeeSource !== 'formula' && ws.n >= 3;
    const c = { ...calc(p, undefined, useWatch ? ws.avg : null), source: useWatch ? 'watch' : 'formula', watch: ws };
    if (p.goalMode !== 'manual') return c;
    const kcal = p.kcalGoal || c.kcal, protein = p.proteinGoal || c.protein;
    return { ...c, autoKcal: c.kcal, autoProtein: c.protein, autoCarbs: c.carbs, kcal, protein, ...macroSplit(kcal, protein, p.carbGoal) };
  }

  const mealDone = (k, m) => !!(S.days[k]?.validated || S.days[k]?.mealsDone?.[m]);
  function dayTotals(k) {
    const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0, eatenK: 0, eatenP: 0, eatenC: 0, anyDone: false };
    const d = S.days[k];
    if (d) for (const e of d.entries) {
      t.kcal += e.kcal || 0; t.p += e.p || 0; t.c += e.c || 0; t.f += e.f || 0; t.n++;
      if (mealDone(k, e.meal)) { t.eatenK += e.kcal || 0; t.eatenP += e.p || 0; t.eatenC += e.c || 0; }
    }
    t.anyDone = !!d && MEALS.some(([m]) => mealDone(k, m));
    t.planK = t.kcal - t.eatenK; t.planP = t.p - t.eatenP; t.planC = t.c - t.eatenC;
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
  const OFF_FIELDS = 'code,product_name,product_name_fr,generic_name_fr,brands,quantity,serving_size,serving_quantity,nutriments,nutriscore_grade,categories_tags,image_front_small_url,image_front_thumb_url';
  function offToFood(p) {
    const n = p.nutriments || {};
    let kcal = num(n['energy-kcal_100g']);
    if (kcal == null) { const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']); if (kj != null) kcal = kj / 4.184; }
    const name = String(p.product_name_fr || p.product_name || p.generic_name_fr || '').trim();
    const sq = num(p.serving_quantity);
    return {
      src: 'off', code: String(p.code || ''), name: name || 'Produit sans nom',
      brand: String(p.brands || '').split(',')[0].trim(), qtyLabel: p.quantity || '',
      per100: kcal == null ? null : { kcal, p: num(n.proteins_100g) || 0, c: num(n.carbohydrates_100g) || 0, f: num(n.fat_100g) || 0, ...Nu.offQuality(p, n) },
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

  /* ---------- Animations d'entrée ---------- */
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function playEnter(v) {
    if (reducedMotion()) return;
    v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    clearTimeout(playEnter._t); playEnter._t = setTimeout(() => v.classList.remove('enter'), 1400);
    $$('[data-count]', v).forEach(el => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 900;
      if (!(end > 0)) return;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = r0(end * e); if (k < 1 && el.isConnected) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }

  /* ---------- Vues ---------- */
  function render() {
    const v = $('#view');
    $('#tabbar').style.display = S.profile ? '' : 'none';
    if (!S.profile) { v.innerHTML = viewOnboarding(); bindOnboarding(); return; }
    $$('#tabbar [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === (UI.tab === 'foods' ? 'profile' : UI.tab)));
    const views = { journal: viewJournal, progress: viewProgress, muscu: Mu.view, foods: viewFoods, profile: viewProfile, social: So.view };
    v.innerHTML = (views[UI.tab] || viewJournal)();
    if (UI.tab === 'progress') { drawChart(); drawProjection(); }
    if (UI.tab === 'journal') drawMini();
    const fab = $('#fab-add'); if (fab) fab.hidden = UI.tab !== 'journal';
    So.schedule();
    if (UI.tab === 'muscu') Mu.afterRender();
    Mu.updateBanner();
    const key = UI.tab + (UI.tab === 'journal' ? UI.date : '');
    if (UI._shown !== key && !stack.length) { UI._shown = key; playEnter(v); }
    Bo.checkBadges(stack.length > 0);
    liquidSegs();
  }

  /* Sélecteurs segmentés : effet sablier. Le liquide de l'ancien bouton se vide vers le nouveau
     en passant par un goulot étroit, puis remplit le bouton choisi. Tout reste dans le cadre (piste découpée). */
  const segPos = new Map();
  // Animation 100 % GPU : seulement transform (translate/scale) et opacity. Le flou de mouvement est une copie floutée
  // calculée une seule fois, qui apparaît puis disparaît (pas de flou recalculé à chaque image).
  const blobHTML = '<b class="sharp"></b><b class="soft"></b>';
  function liquidSegs(root = document) {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('.seg').forEach(seg => {
      const btns = [...seg.children].filter(b => b.tagName === 'BUTTON'), on = btns.find(b => b.classList.contains('on'));
      if (!on || !on.offsetWidth) return;
      seg.classList.add('liquid');
      let track = seg.querySelector(':scope > .seg-track');
      if (!track) { track = document.createElement('i'); track.className = 'seg-track'; track.innerHTML = `<i class="seg-ghost">${blobHTML}</i><i class="seg-pill">${blobHTML}</i>`; seg.prepend(track); }
      const pill = track.querySelector('.seg-pill'), ghost = track.querySelector('.seg-ghost');
      const key = btns.map(b => b.textContent.trim()).join('|');
      const to = { x: on.offsetLeft, w: on.offsetWidth, y: on.offsetTop, h: on.offsetHeight };
      const from = track.dataset.x ? { x: +track.dataset.x, w: +track.dataset.w } : segPos.get(key);
      segPos.set(key, to); track.dataset.x = to.x; track.dataset.w = to.w;
      const place = (el, x, w) => Object.assign(el.style, { top: to.y + 'px', height: to.h + 'px', left: x + 'px', width: w + 'px' });
      place(pill, to.x, to.w); ghost.style.opacity = 0;
      if (!from || Math.abs(from.x - to.x) < 1 || reduce || !pill.animate) return;
      track.querySelectorAll('*').forEach(el => el.getAnimations?.().forEach(a => a.cancel()));
      // coulissement simple : la pastille glisse de l'ancien bouton au nouveau (transform seulement → GPU), courbe douce type iOS
      const D = 420, E = 'cubic-bezier(.32, .72, 0, 1)';
      pill.style.transformOrigin = 'left center';
      pill.animate([
        { transform: `translateX(${from.x - to.x}px) scaleX(${from.w / to.w})` },
        { transform: 'translateX(0) scaleX(1)' },
      ], { duration: D, easing: E });
      // léger flou de mouvement au départ, quand ça va le plus vite
      pill.querySelector('.soft').animate([{ opacity: .7 }, { opacity: 0, offset: .55 }, { opacity: 0 }], { duration: D, easing: 'ease-out' });
      pill.querySelector('.sharp').animate([{ opacity: .35 }, { opacity: 1, offset: .55 }, { opacity: 1 }], { duration: D, easing: 'ease-out' });
      // le texte suit le liquide : l'ancien reste foncé tant qu'il est plein, le nouveau fonce quand il se remplit
      const old = btns.find(b => b !== on && Math.abs(b.offsetLeft - from.x) < 3);
      const cOn = getComputedStyle(on).color, cOff = old ? getComputedStyle(old).color : null;
      on.animate([{ color: cOff || cOn }, { color: cOn }], { duration: D * .6, easing: 'ease-out' });
      if (old) old.animate([{ color: cOn }, { color: cOff }], { duration: D * .6, easing: 'ease-out' });
    });
  }
  // sélecteurs qui changent sans re-rendu complet (fiches) : on recale après chaque toucher
  document.addEventListener('click', e => { if (e.target.closest('.seg')) requestAnimationFrame(() => requestAnimationFrame(() => liquidSegs())); }, true);

  // Accueil / onboarding
  function profileFields(p = {}) {
    return `
      <label class="field"><span>Prénom</span><input type="text" name="name" autocomplete="given-name" value="${esc(p.name || '')}" placeholder="Ton prénom"></label>
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
    return { name: (g('name') || '').trim(), sex: g('sex'), age: num(g('age')), height: num(g('height')), weight: num(g('weight')), target: num(g('target')), activity: num(g('activity')), pace: num(g('pace')) ?? 0.5 };
  }
  const profileValid = p => p.age >= 16 && p.age <= 100 && p.height >= 120 && p.height <= 230 && (p.weight == null || (p.weight >= 30 && p.weight <= 300)) && (!p.target || (p.target >= 30 && p.target <= 300));

  function viewOnboarding() {
    return `
      <div class="onboard-hero">${brandHTML()}<h1 style="margin-top:18px">Bienvenue</h1>
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
  /* Féculents : valeurs crues (paquet sec) ou cuites ? ratio poids cuit / poids cru moyen */
  const STARCH = [
    [/riz|risotto/i, 2.6], [/quinoa/i, 2.7], [/semoule|couscous|boulgour|boulghour|polenta/i, 2.4],
    [/lentille|pois chiche|haricots? (secs?|rouges?|blancs?)|flageolet|f[èe]ves s[èe]ches/i, 2.5],
    [/p[âa]tes|spaghett|penne|tagliatell|fusill|macaroni|coquillette|farfalle|linguine|lasagn|nouille|vermicelle|tortellini|ravioli|gnocchi|torsade|rigatoni|orzo|udon|soba|ramen/i, 2.3],
  ];
  function starchInfo(f) {
    const p = f && f.per100; if (!p) return null;
    const hit = STARCH.find(([re]) => re.test(f.name || '')); if (!hit) return null;
    if (/galette|souffl|cracker|chips|biscuit|g[âa]teau|au lait|farine|cr[èe]me|boisson|lait de|vinaigre|sirop|sauce/i.test(f.name)) return null; // pas un féculent à cuire
    if (/cuit|cuisin|pr[êe]t|micro-?ondes|express|sachet cuisson rapide|en conserve|bo[iî]te/i.test(f.name) && !/\bcru/i.test(f.name)) return p.kcal < 260 ? { state: 'cuit', ratio: hit[1] } : null;
    if (/tortellini|ravioli|gnocchi/i.test(f.name) && p.kcal < 300) return null; // pâtes fraîches farcies : se pèsent telles quelles
    if (p.kcal >= 280) return { state: 'cru', ratio: hit[1] };
    if (p.kcal <= 200) return { state: 'cuit', ratio: hit[1] };
    return null;
  }
  const warnTags = (p, name) => { const f = Nu.flags(p, name); return (f.sweet ? '<span class="badge warn" title="Très sucré">SUCRÉ</span>' : '') + (f.salty ? '<span class="badge warn" title="Très salé">SALÉ</span>' : ''); };
  const crTag = st => st ? `<span class="badge cr cr-${st.state}">${st.state === 'cru' ? 'CRU · poids sec' : 'CUIT'}</span>` : '';
  function entrySub(e) {
    if (e.src === 'quick') return 'Ajout rapide';
    if (e.cg) return [e.brand, `${r0(e.cg)} g cuits (≈ ${r0(e.grams)} g crus)`].filter(Boolean).join(' · ');
    const q = e.count && e.unit ? (e.count === 1 ? e.unit.label : `${r1(e.count)} × ${e.unit.label.replace(/^1\s+/, '')}`) + (/\d\s*(g|ml)\b/i.test(e.unit.label) ? '' : ` · ${r0(e.grams)} g`) : `${r0(e.grams)} g`;
    return [e.brand, q].filter(Boolean).join(' · ');
  }
  // Couleur de progression : rouge (0 %) → orange (50 %) → vert (objectif atteint)
  function progColor(x) {
    x = Math.max(0, Math.min(1, x || 0));
    const h = x < 0.5 ? x / 0.5 * 32 : 32 + (x - 0.5) / 0.5 * 113;
    return `hsl(${Math.round(h)} 90% ${x >= 1 ? 50 : 57}%)`;
  }
  function gradBar(eaten, planned, goal) {
    if (!(goal > 0)) return '<div class="bar"></div>';
    const col = progColor((eaten + planned) / goal);
    const a = Math.min(100, eaten / goal * 100), b = Math.min(100 - a, planned / goal * 100);
    return `<div class="bar">${a > 0 ? `<div style="width:${a}%;background:${col};box-shadow:0 0 10px ${col}${b > 0 ? '' : ';border-radius:8px'}"></div>` : ''}${b > 0 ? `<div class="plan" style="width:${b}%;background:${col}${a > 0 ? '' : ';border-radius:8px'}"></div>` : ''}</div>`;
  }
  const plainBar = (v, goal, cls) => `<div class="bar ${cls}"><div style="width:${goal > 0 ? Math.min(100, v / goal * 100) : 0}%;border-radius:8px"></div></div>`;
  function kcalRing(eaten, planned, goal) {
    const R = 62, C = 2 * Math.PI * R, over = eaten + planned > goal;
    const a = Math.min(1, eaten / goal), b = Math.min(1 - a, planned / goal);
    const main = over ? '#FF9F43' : 'url(#ringGrad)';
    return `<svg viewBox="0 0 150 150" aria-hidden="true"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent-hi)"/><stop offset="1" style="stop-color:var(--accent-lo)"/></linearGradient></defs>
      <circle cx="75" cy="75" r="${R}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="13"/>
      ${b > 0.002 ? `<circle cx="75" cy="75" r="${R}" fill="none" style="stroke:${over ? '#FF9F43' : 'var(--accent)'}" stroke-opacity=".3" class="arc" stroke-width="13" stroke-linecap="round" stroke-dasharray="${((a + b) * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 75 75)"/>` : ''}
      ${a > 0.002 ? `<circle class="arc" cx="75" cy="75" r="${R}" fill="none" stroke="${main}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${(a * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 75 75)" style="filter:drop-shadow(0 0 5px ${over ? 'rgba(255,159,67,.6)' : 'rgba(var(--accent-rgb),.6)'})"/>` : ''}
    </svg>`;
  }
  const QUOTES = ['On reste focus 💪', 'Chaque repas compte 🔥', 'Un jour après l\'autre 💚', 'La régularité paie ⚡'];
  function viewJournal() {
    const k = UI.date, g = goals(k), t = dayTotals(k), p = S.profile;
    const rem = g.kcal - t.kcal, over = rem < 0;
    const d = dparse(k);
    const label = k === today() ? "Aujourd'hui" : k === dkey(addDays(new Date(), -1)) ? 'Hier' : k === dkey(addDays(new Date(), 1)) ? 'Demain' : cap(F.short.format(d));
    const prev = S.days[dkey(addDays(d, -1))];
    const locked = isLocked(k), burn = dayBurn(k), bal = burn.v - t.kcal;
    const split = !locked && t.anyDone && t.planK > 0;
    const E = split ? { k: t.eatenK, p: t.eatenP, c: t.eatenC } : { k: t.kcal, p: t.p, c: t.c };
    const P = split ? { k: t.planK, p: t.planP, c: t.planC } : { k: 0, p: 0, c: 0 };
    const cur = currentWeight();
    const sub = S.photo && p.target && cur > p.target ? `Encore ${r1(cur - p.target)} kg avant cette version de toi 🔥` : p.name ? `On reste focus, ${esc(p.name)} 💪` : QUOTES[d.getDate() % QUOTES.length];
    const burnLabel = burn.measured ? `<em>montre${burn.cut ? ` −${burn.pct} %` : ''}${burn.extra ? ` + ~${r0(burn.extra)} d'ici minuit` : ''}</em>` : '<em>estimée</em>';
    const meal = ([id, name]) => {
      const es = (S.days[k]?.entries || []).filter(e => e.meal === id);
      const kc = es.reduce((s, e) => s + e.kcal, 0);
      const mp = es.reduce((s, e) => s + (e.p || 0), 0), mc = es.reduce((s, e) => s + (e.c || 0), 0), mf = es.reduce((s, e) => s + (e.f || 0), 0);
      const done = mealDone(k, id);
      const canCopy = !locked && !done && !es.length && prev && prev.entries.some(e => e.meal === id);
      return `<section class="card meal ${done ? 'done' : ''}" data-meal-card="${id}"><div class="meal-head">
          <button class="meal-check ${done ? 'on' : ''}" data-action="meal-done" data-meal="${id}" ${locked ? 'disabled' : ''} aria-pressed="${done}" aria-label="${done ? 'Décocher' : 'Valider'} ${name}">${ICON.check}</button>
          <div class="grow"><h2>${name}</h2>${es.length ? `<div class="meal-macros num"><span class="mp">P ${r0(mp)} g</span><span class="mc">G ${r0(mc)} g</span><span class="mf">L ${r0(mf)} g</span></div>` : ''}</div>
          <span class="kcal num">${es.length ? `<span class="kv"><b>${r0(kc)}</b> kcal</span><small>${done ? 'mangé' : 'prévu'}</small>` : ''}</span></div>
        ${es.map(e => `<button class="entry" data-action="edit-entry" data-id="${e.id}"><div class="grow"><div class="name">${esc(e.name)}${warnTags(e.per100, e.name)}</div><div class="sub">${esc(entrySub(e))}</div></div><div class="val num">${r0(e.kcal)}<small>${r0(e.p)} g prot.</small></div></button>`).join('')}
        ${locked || done ? (es.length ? '' : '<div class="empty small" style="padding:4px 16px 14px">Rien</div>') : `<div class="meal-foot"><button data-action="add" data-meal="${id}">+ Ajouter</button>${canCopy ? `<button data-action="copy-prev" data-meal="${id}">Copier la veille</button>` : ''}${es.length ? `<button data-action="fav-save" data-meal="${id}">⭐ Favori</button>` : ''}</div>`}</section>`;
    };
    return `
      <header class="hero">
        ${S.photo ? `<div class="hero-photo" role="img" aria-label="Ma photo objectif">${photoImg(S.photo, S.photoPos)}</div>` : ''}
        <div class="brand-row">${brandHTML()}<button class="icon-btn glass" data-tab="profile" aria-label="Profil et réglages">${ICON.gear}</button></div>
        <div class="hero-text ${S.photo ? '' : 'wide'}">
          <div class="day-title"><button class="icon-btn" data-action="day-prev" aria-label="Jour précédent">${ICON.left}</button><label>${esc(label)}<input type="date" value="${k}" data-input="date" aria-label="Choisir une date" style="position:absolute;inset:0;opacity:0;width:100%"></label><button class="icon-btn" data-action="day-next" aria-label="Jour suivant">${ICON.right}</button></div>
          <p class="hero-sub">${sub}</p>${Bo.streakChip()}
          ${S.photo ? '' : '<button class="btn ghost small" data-action="photo-pick">📷 Ajoute ta photo objectif</button>'}
        </div>
      </header>
      <section class="card glow">
        <div class="today-card">
          <div class="ring-wrap">${kcalRing(E.k, P.k, g.kcal)}
            <div class="ring-center">${ICON.flame}<b class="num ${over ? 'over-text' : ''}" data-count="${Math.round(Math.abs(rem))}">${r0(Math.abs(rem))}</b><span>${over ? 'kcal en trop' : 'kcal restantes'}</span></div>
            <button class="ring-goal num ${g.ov ? 'adj' : ''}" data-action="goal-day" ${locked ? 'disabled' : ''}>${g.ov ? '' : 'Objectif : '}${r0(g.kcal)} kcal${g.ov ? ` <i>${g.kcal >= g.baseKcal ? '+' : '−'}${r0(Math.abs(g.kcal - g.baseKcal))}</i>` : ''} ${locked ? '' : '<u>✎</u>'}</button></div>
          <div class="macros">
            <div class="macro"><div class="row">${ICON.muscle}<span>Protéines</span><b class="num">${r0(t.p)} / ${r0(g.protein)} g</b></div>${gradBar(E.p, P.p, g.protein)}</div>
            <div class="macro"><div class="row">${ICON.drop('#6E8BFF')}<span>Glucides</span><b class="num">${r0(t.c)} / ${r0(g.carbs)} g</b></div>${gradBar(E.c, P.c, g.carbs)}</div>
            <button class="macro macro-btn" data-action="fat-open"><div class="row">${ICON.drop('#FFC247')}<span>Lipides</span><b class="num">${r0(t.f)} / ${r0(g.fat)} g</b></div>${plainBar(t.f, g.fat, 'fat')}${t.f < g.fat * 0.8 ? '<small class="q-help">Comment compléter ›</small>' : ''}</button>
          </div>
        </div>
        <div class="today-sub num">${split ? `Mangé ${r0(t.eatenK)} · prévu ${r0(t.planK)} · ` : ''}consommé ${r0(t.kcal)} / ${r0(g.kcal)} kcal</div>
      </section>
      ${Bo.backupCard()}
      ${Nu.qualityCard(k)}
      <div class="duo">${suppsCard(k)}${Bo.waterCard(k)}</div>
      ${Bo.coachCard(k)}
      ${locked ? validatedCard(k, t, burn) : ''}
      <section class="card">
        <div class="row between"><div class="card-title">${ICON.cal}Bilan du jour</div>${locked ? '' : `<button class="watch-pill ${burn.measured ? 'on' : ''}" data-action="burn">${ICON.watch}Ma montre<i></i></button>`}</div>
        <div class="bilan-row">
          <button data-action="burn" ${locked ? 'disabled' : ''}><div class="v">${ICON.flame}<span class="num">${r0(burn.v)}</span></div><div class="l">Dépense ${burnLabel}</div></button>
          <div><div class="v">${ICON.fork}<span class="num">${r0(t.kcal)}</span></div><div class="l">Consommé${split ? `<em>dont ${r0(t.planK)} prévu</em>` : ''}</div></div>
          <div><div class="v ${bal >= 0 ? 'good-text' : 'over-text'}">${ICON.trend}<span class="num">${signed(-bal)}</span></div><div class="l">${bal >= 0 ? 'Déficit' : 'Excédent'}</div></div>
        </div>
      </section>
      <div class="section-title"><h2>Repas du jour</h2></div>
      ${MEALS.map(meal).join('')}
      ${locked ? '' : `<button class="btn block validate-btn" data-action="validate">${ICON.check} Valider la journée</button>`}
      <section class="card mini-prog">
        <div class="row between"><div class="card-title">${ICON.bars}Progrès</div><div class="seg compact">${[[7, '7j'], [30, '30j'], [90, '90j']].map(([v, l]) => `<button data-action="mini-range" data-v="${v}" class="${UI.mini === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="chart-wrap" id="mini-chart"></div>
        <div class="legend"><span><i style="background:var(--accent);border-radius:50%"></i>Poids</span>${p.target ? '<span><i class="dash"></i>Objectif</span>' : ''}</div>
      </section>
      <section class="card prof-mini" data-tab="profile">
        <div class="avatar" ${S.avatar ? `style="background-image:url('${S.avatar}')"` : ''}>${S.avatar ? '' : ICON.body}</div>
        <div><div class="k num">${r0(g.kcal)} <small>kcal</small></div><div class="s">Objectif quotidien</div></div>
        <div class="chips2"><span>${p.sex === 'f' ? 'Femme' : 'Homme'}</span><span>${p.age} ans</span><span class="more">Voir plus ›</span></div>
      </section>`;
  }

  /* ---------- Compléments alimentaires du jour ---------- */
  function suppsCard(k) {
    const sl = S.supps, taken = S.days[k]?.supps || {};
    const n = sl.filter(x => taken[x.id]).length, all = sl.length && n === sl.length;
    return `<section class="card supps ${all ? 'all' : ''} ${UI.suppsOpen ? 'open' : ''}">
      <div class="card-title">${ICON.pill}Compléments</div>
      <div class="row between supp-head"><span class="supp-count ${all ? 'good-text' : n ? '' : 'over-text'}">${sl.length ? (all ? 'Tous pris ✓' : `${n} / ${sl.length} pris`) : ''}</span><button class="icon-btn" data-action="supps-manage" aria-label="Gérer mes compléments">${ICON.edit}</button></div>
      ${sl.length ? (() => {
        const chip = x => `<button class="supp ${taken[x.id] ? 'on' : ''}" data-action="supp-toggle" data-id="${x.id}" aria-pressed="${!!taken[x.id]}"><span class="dot">${ICON.check}</span><span class="txt"><b>${esc(x.name)}</b>${x.dose ? `<small>${esc(x.dose)}</small>` : ''}</span></button>`;
        const first = sl.slice(0, 4), rest = sl.slice(4), restTaken = rest.filter(x => taken[x.id]).length;
        return `<div class="supp-row">${first.map(chip).join('')}</div>${rest.length ? `<button class="supp-more-btn" data-action="supps-more" aria-expanded="${!!UI.suppsOpen}"><span>+ ${rest.length} autre${rest.length > 1 ? 's' : ''}${restTaken ? ` · ${restTaken} pris` : ''}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><div class="supp-drop"><div class="supp-drop-in"><div class="supp-row">${rest.map(chip).join('')}</div></div></div>` : ''}`;
      })()
        : '<button class="btn ghost block small" style="margin-top:12px" data-action="supps-manage">+ Ajouter (créatine, magnésium…)</button>'}
    </section>`;
  }
  const SUPP_SUGGEST = [['Créatine', '5 g'], ['Magnésium', '300 mg'], ['Oméga 3', '2 gélules'], ['Vitamine D3 + K2', '1 gélule'], ['Zinc', '15 mg'], ['Multivitamines', '1 comprimé'], ['Whey', '30 g'], ['Vitamine C', '500 mg'], ['Fer', '1 comprimé'], ['Collagène', '10 g']];
  function openSupps() {
    const sh = makeSheet('Mes compléments');
    const draw = () => {
      const has = n => S.supps.some(x => norm(x.name) === norm(n));
      sh.setBody(`
        <section class="card list">${S.supps.length ? S.supps.map((x, i) => `<div class="item"><div class="grow"><div class="name">${esc(x.name)}</div>${x.dose ? `<div class="sub">${esc(x.dose)}</div>` : ''}</div>
          <button class="icon-btn" data-a="up" data-i="${i}" aria-label="Monter" ${i ? '' : 'disabled style="opacity:.25"'}>${ICON.left.replace('M15 5l-7 7 7 7', 'M6 15l6-6 6 6')}</button>
          <button class="icon-btn" data-a="del" data-i="${i}" aria-label="Supprimer" style="color:var(--danger)">${ICON.close}</button></div>`).join('') : '<div class="empty small">Aucun complément pour l\'instant.</div>'}</section>
        <h3>Suggestions</h3>
        <div class="chips" style="margin:0 0 16px">${SUPP_SUGGEST.filter(([n]) => !has(n)).map(([n, d]) => `<button class="chip" data-a="sug" data-n="${esc(n)}" data-d="${esc(d)}">+ ${esc(n)}</button>`).join('')}</div>
        <h3>Ajouter un autre complément</h3>
        <section class="card stack"><div class="grid2"><label class="field"><span>Nom</span><input type="text" data-f="n" placeholder="ex. Ashwagandha"></label><label class="field"><span>Dose (facultatif)</span><input type="text" data-f="d" placeholder="ex. 1 gélule"></label></div>
          <button class="btn block" data-a="add">Ajouter</button></section>
        <p class="note">La liste est la même chaque jour ; les cases se décochent automatiquement à minuit. Les compléments ne remplacent pas une alimentation variée : demande conseil à un médecin ou un pharmacien en cas de traitement.</p>`);
    };
    const save = () => { Store.put('supps', S.supps); render(); };
    sh.body.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, i = +b.dataset.i;
      if (a === 'del') S.supps.splice(i, 1);
      if (a === 'up' && i > 0) [S.supps[i - 1], S.supps[i]] = [S.supps[i], S.supps[i - 1]];
      if (a === 'sug') S.supps.push({ id: uid(), name: b.dataset.n, dose: b.dataset.d });
      if (a === 'add') {
        const n = $('[data-f="n"]', sh.body).value.trim(), d = $('[data-f="d"]', sh.body).value.trim();
        if (!n) { toast('Indique un nom'); return; }
        S.supps.push({ id: uid(), name: n, dose: d });
      }
      save(); draw();
    });
    draw(); openSheet(sh.el);
  }

  function drawMini() {
    const wrap = $('#mini-chart'); if (!wrap) return;
    const N = UI.mini, end = dparse(today()), start = addDays(end, -(N - 1)), tgt = S.profile.target;
    const pts = sortedWeights().filter(w => w.date >= dkey(start)).map(w => ({ t: dparse(w.date).getTime() + 432e5, v: w.kg, date: w.date }));
    if (!pts.length) { wrap.innerHTML = '<div class="empty small">Aucune pesée sur cette période.<br><button class="btn plain" data-action="add-weight">+ Ajouter une pesée</button></div>'; return; }
    const W = Math.max(260, wrap.clientWidth || 320), H = 190, M = { l: 34, r: 14, t: 28, b: 22 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;
    // le graphique commence à la première pesée de la période (collé à gauche) et finit à la dernière (collé à droite)
    const lastT = Math.max(pts[pts.length - 1].t, end.getTime() + 432e5);
    const t0 = pts.length > 1 ? pts[0].t : start.getTime() + 432e5, t1 = lastT > t0 ? lastT : t0 + 864e5;
    const x = t => M.l + (t - t0) / (t1 - t0) * pw;
    const s0 = dparse(pts[0].date) > start ? dparse(pts[0].date) : start, spanD = Math.round((t1 - t0) / 864e5);
    let lo = Math.min(...pts.map(q => q.v), tgt || Infinity), hi = Math.max(...pts.map(q => q.v));
    const padv = Math.max(1, (hi - lo) * 0.12); lo -= padv; hi += padv;
    const step = niceStep(hi - lo); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const y = v => M.t + ph - (v - lo) / (hi - lo) * ph;
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution du poids"><defs><linearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".32"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
    for (let v = lo; v <= hi + 1e-9; v += step) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--grid)"/><text x="${M.l - 6}" y="${y(v) + 4}" text-anchor="end">${r0(v)}</text>`;
    if (tgt) s += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(tgt)}" y2="${y(tgt)}" stroke-dasharray="6 5" stroke-width="1.5" style="stroke:var(--ink-2)"/>`;
    (spanD >= 2 ? [s0, addDays(s0, Math.round(spanD / 2)), end] : [s0, end]).forEach((dd, i, arr) => { s += `<text x="${x(dd.getTime() + 432e5)}" y="${H - 5}" text-anchor="${i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}">${F.dm.format(dd)}</text>`; });
    const line = pts.map((q, i) => (i ? 'L' : 'M') + x(q.t).toFixed(1) + ',' + y(q.v).toFixed(1)).join('');
    if (pts.length > 1) {
      s += `<path d="${line}L${x(pts[pts.length - 1].t).toFixed(1)},${M.t + ph}L${x(pts[0].t).toFixed(1)},${M.t + ph}Z" fill="url(#miniFill)"/>`;
      s += `<path d="${line}" fill="none" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" style="stroke:var(--accent);filter:drop-shadow(0 0 4px rgba(var(--accent-rgb),.5))"/>`;
    }
    pts.slice(0, -1).forEach(q => { s += `<circle cx="${x(q.t)}" cy="${y(q.v)}" r="3.5" style="fill:var(--accent)"/>`; });
    const L = pts[pts.length - 1], lx = x(L.t), ly = y(L.v);
    s += `<circle cx="${lx}" cy="${ly}" r="10" style="fill:var(--accent)" fill-opacity=".2"/><circle cx="${lx}" cy="${ly}" r="6" style="fill:var(--accent)"/>`;
    const lab = `${r1(L.v)} kg`, bw = lab.length * 7.6 + 16, bx = Math.min(W - M.r - bw, Math.max(M.l, lx - bw / 2)), by = Math.max(2, ly - 36);
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="24" rx="8" fill="#141C18" stroke="rgba(255,255,255,.14)"/><text x="${bx + bw / 2}" y="${by + 16.5}" text-anchor="middle" style="fill:var(--ink);font-weight:700;font-size:13px">${lab}</text>`;
    s += `<rect x="${M.l}" y="${M.t - 10}" width="${pw}" height="${ph + 10}" fill="transparent"/></svg><div class="chart-tip"></div>`;
    wrap.innerHTML = s;
    bindTip(wrap, null, ev => {
      const px = ev.clientX - wrap.querySelector('svg').getBoundingClientRect().left;
      let best = pts[0]; for (const q of pts) if (Math.abs(x(q.t) - px) < Math.abs(x(best.t) - px)) best = q;
      return { x: x(best.t), y: y(best.v), text: `${cap(F.short.format(dparse(best.date)))} · ${r1(best.v)} kg` };
    });
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

  /* ---------- Écran : calories brûlées (montre) ---------- */
  function openBurn(k, then) {
    const d = S.days[k] || {};
    const bmr = calc(S.profile).bmr, g = goals();
    let mode = d.active != null ? 'active' : 'total';
    let corr = Math.round(watchCorr(d.burn != null || d.active != null ? d : null) * 100);
    const corrHTML = () => `<div class="corr-row"><span>Correction montre<small>sur les calories actives</small></span><div class="chips" style="margin:0">${[0, 15, 25, 35].map(c => `<button type="button" class="chip ${corr === c ? 'chip-on' : ''}" data-corr="${c}">${c ? '−' + c + ' %' : 'Aucune'}</button>`).join('')}</div></div>`;
    const restLeft = () => { if (k !== today()) return 0; const n = new Date(); return Math.round(bmr / 24 * Math.max(0, 24 - n.getHours() - n.getMinutes() / 60)); };
    const sh = makeSheet('Calories brûlées');
    const draw = () => {
      sh.setBody(mode === 'active' ? `<section class="card stack">
        <label class="field"><span>Calories brûlées aujourd'hui (kcal)</span><input type="number" inputmode="numeric" data-f="v" value="${d.active ?? ''}" placeholder="ex. 559"></label>
        <div class="burn-calc num" data-f="calc"></div>
        ${corrHTML()}
        <p class="note" style="margin:0">Entre le chiffre <b>« calories actives »</b> (ou « énergie active ») de ta montre. Kalo y ajoute ta dépense au repos estimée (${r0(bmr)} kcal) pour obtenir ta dépense totale du jour.</p>
      </section>
      <button class="btn plain block" data-a="mode">Entrer plutôt le TOTAL de ma montre (recommandé)</button>`
        : `<section class="card stack">
        <label class="field"><span>TOTAL de la journée (kcal)</span><input type="number" inputmode="numeric" data-f="v" value="${d.burn ?? ''}" placeholder="ex. 2 416"></label>
        <div class="burn-calc num" data-f="calc"></div>
        ${corrHTML()}
        <p class="note" style="margin:0"><b>Apple Watch</b> : app <b>Forme</b> → Résumé → touche l'anneau rouge → ligne <b>« TOTAL : … KCAL »</b> sous le graphique « Bouger ».${k === today() ? ' Kalo ajoute automatiquement ce que tu brûleras au repos jusqu\'à minuit.' : ''}</p>
      </section>
      <button class="btn plain block" data-a="mode">Je n'ai que les calories « Bouger » (actives)</button>`);
      const inp = $('[data-f="v"]', sh.body), out = $('[data-f="calc"]', sh.body);
      const upd = () => {
        if (!out) return; const v = num(inp.value);
        if (v == null) { out.innerHTML = `Sans saisie : estimation ${r0(g.tdee)} kcal`; return; }
        const c = corr / 100;
        if (mode === 'active' || v < 1200) {
          const cut = Math.round(v * c);
          out.innerHTML = `${mode === 'active' ? '' : `${r0(v)} ressemble à tes calories « Bouger ». `}Repos ${r0(bmr)} + actives ${r0(v)}${cut ? ` − ${corr} % (${r0(cut)})` : ''} = <b>${r0(bmr + v - cut)} kcal</b>`;
          return;
        }
        const rl = restLeft(), nowH = new Date().getHours() + new Date().getMinutes() / 60;
        const restSoFar = k === today() ? bmr / 24 * nowH : bmr, cut = Math.round(Math.max(0, v - restSoFar) * c);
        out.innerHTML = `Montre ${r0(v)}${cut ? ` − ${corr} % des actives (${r0(cut)})` : ''}${rl ? ` + ~${r0(rl)} au repos d'ici minuit` : ''} = <b>${r0(v - cut + rl)} kcal</b>`;
      };
      inp.addEventListener('input', upd); upd();
    };
    draw();
    sh.body.addEventListener('click', e => {
      if (e.target.closest('[data-a="mode"]')) { const v = $('[data-f="v"]', sh.body).value; mode = mode === 'active' ? 'total' : 'active'; draw(); $('[data-f="v"]', sh.body).value = ''; return; }
      const cb = e.target.closest('[data-corr]');
      if (cb) { const v = $('[data-f="v"]', sh.body).value; corr = +cb.dataset.corr; draw(); $('[data-f="v"]', sh.body).value = v; $('[data-f="v"]', sh.body).dispatchEvent(new Event('input')); }
    });
    sh.setFoot(`${d.burn != null || d.active != null ? '<button class="btn outline" data-a="clear">Effacer</button>' : ''}<button class="btn grow" data-a="save">Enregistrer</button>`);
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      const day = getDay(k);
      if (a === 'save') {
        const v = num($('[data-f="v"]', sh.body).value);
        if (v != null && mode === 'total' && v < 1200) mode = 'active';
        if (v != null && mode === 'active' && (v < 0 || v > 5000)) { toast('Valeur entre 0 et 5 000 kcal'); return; }
        if (v != null && mode === 'total' && (v < 800 || v > 8000)) { toast('Valeur entre 800 et 8 000 kcal'); return; }
        delete day.burn; delete day.active; delete day.bmr; delete day.burnAt; delete day.corr;
        S.profile.watchCorr = corr; Store.put('profile', S.profile);
        if (v != null) { day.corr = corr; }
        if (v != null) { if (mode === 'active') { day.active = Math.round(v); day.bmr = bmr; } else { day.burn = Math.round(v); if (k === today()) day.burnAt = Date.now(); } }
      }
      if (a === 'clear') { delete day.burn; delete day.active; delete day.bmr; delete day.burnAt; delete day.corr; }
      saveDay(k);
      closeSheet(1, then || (() => toast(a === 'clear' ? 'Retour à l\'estimation' : 'Calories brûlées enregistrées')));
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
        <div class="vline"><span>Dépense ${burn.active != null ? `<em class="muted">(repos ${r0(burn.bmr)} + actives ${r0(burn.active)}${burn.cut ? ` − ${burn.pct} %` : ''})</em>` : burn.total ? `<em class="muted">(montre ${r0(burn.raw)}${burn.cut ? ` − ${r0(burn.cut)} de correction` : ''}${burn.extra ? ` + ~${r0(burn.extra)} d'ici minuit` : ''})</em>` : '<em class="muted">(estimée)</em>'}</span><b class="num">${r0(burn.v)} kcal</b></div>
        <div class="vline big-line"><span>${bal >= 0 ? 'Déficit' : 'Excédent'}</span><b class="num ${bal >= 0 ? 'good-text' : 'over-text'}">${signed(-bal)} kcal</b></div>
        <p class="note" style="margin:6px 0 0">≈ ${r0(Math.abs(bal) / 7.7)} g de graisse ${bal >= 0 ? 'en moins' : 'en plus'} (7 700 kcal ≈ 1 kg).</p>
        ${burn.measured ? '' : '<button class="btn block ghost" data-a="burn" style="margin-top:12px">⌚ Entrer le TOTAL de ma montre</button>'}
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
      const day = getDay(k); day.validated = Date.now(); day.mealsDone = Object.fromEntries(MEALS.map(([m]) => [m, day.mealsDone?.[m] || Date.now()])); saveDay(k);
      try { navigator.vibrate?.(30); } catch (err) { /* ignore */ }
      if (S.fx.sound) window.KaloFX?.prime();
      closeSheet(1, () => {
        const card = () => $('#view .card.validated');
        card()?.scrollIntoView({ block: 'center' });
        setTimeout(() => celebrate(card), 250);
        toast(bal >= 0 ? `Journée validée · déficit ${r0(bal)} kcal` : 'Journée validée');
      });
    };
    openSheet(sh.el);
  }

  // Aliments
  function foodItem(f, i) {
    const p = f.per100;
    const thumb = f.img ? `<img class="thumb" src="${esc(f.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="thumb">${f.src === 'gen' ? 'GÉN' : f.src === 'custom' ? 'PERSO' : f.src === 'ai' ? 'IA' : 'OFF'}</span>`;
    const sub = [f.brand, p ? `${r0(p.kcal)} kcal · ${r1(p.p)} g prot. / 100 g` : 'valeurs manquantes'].filter(Boolean).join(' · ');
    return `<button class="item" data-i="${i}">${thumb}<div class="grow"><div class="name">${esc(f.name)} ${crTag(starchInfo(f))}${warnTags(p, f.name)}</div><div class="sub">${esc(sub)}</div></div>${f.ns ? `<span class="badge ns ns-${f.ns}">${f.ns.toUpperCase()}</span>` : ''}</button>`;
  }
  function viewFoods() {
    return `<button class="btn plain back-link" data-tab="profile">${ICON.back} Profil</button><h1>Mes aliments</h1>
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
  function setTheme(hex) { S.theme = hex; applyTheme(hex); Store.put('theme', hex); render(); }
  function aiPrompt() {
    const p = S.profile;
    return `Voici une photo de moi. Génère une image photoréaliste de moi-même à ${p.target ? r1(p.target) : 'mon poids idéal'} kg pour ${p.height} cm : garde exactement mon visage, ma couleur de peau, mes cheveux et mon âge. Silhouette plus sèche et athlétique, ventre plat, épaules et bras dessinés, posture confiante. Portrait vertical cadré du haut des cuisses à la tête, fond noir, éclairage de studio contrasté avec un léger reflet vert néon, rendu photo professionnelle très réaliste.`;
  }
  async function handlePhoto(file, kind) {
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const sc = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      openPhotoEditor(c.toDataURL('image/jpeg', 0.88), kind === 'avatar' ? { x: 50, y: 30, z: 1 } : { x: 50, y: 20, z: 1 }, kind === 'avatar' ? !S.avatar : true, kind);
    } catch (e) { toast('Image illisible, essaie une autre photo'); }
  }
  /* Cadrage de la photo objectif : position (x, y en %) et zoom, appliqués via object-position + scale autour du même point */
  const photoImg = (src, pos) => { const q = pos || { x: 50, y: 0, z: 1 }; return `<img src="${src}" alt="" draggable="false" style="object-position:${q.x}% ${q.y}%;transform:scale(${q.z});transform-origin:${q.x}% ${q.y}%">`; };
  function openPhotoEditor(src, pos0, isNew, kind) {
    const av = kind === 'avatar';
    const pos = { x: 50, y: 0, z: 1, ...(pos0 || {}) };
    const sh = makeSheet(av ? 'Photo de profil' : isNew ? 'Cadrer ma photo' : 'Recadrer ma photo');
    const heroH = av ? 240 : Math.round($('.hero')?.offsetHeight || 260), boxW = av ? 240 : Math.round(Math.min(window.innerWidth, 560) * 0.72);
    sh.setBody(`<p class="muted small" style="margin:0 0 12px">Glisse la photo pour la placer, pince ou utilise le curseur pour zoomer. ${av ? 'Le cercle montre ta photo de profil.' : "Le cadre montre exactement ce qui s'affichera en haut du Journal."}</p>
      <div class="ph-stage"><div class="ph-box ${av ? 'round' : ''}" style="width:${boxW}px;height:${heroH}px">${photoImg(src, pos)}${av ? '' : '<i class="ph-shade"></i>'}<i class="ph-grid"></i></div></div>
      <label class="field ph-zoom"><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value="${pos.z}" data-f="z"></label>
      <div class="ph-nudge"><button class="btn ghost small" data-a="up" aria-label="Monter">▲</button><button class="btn ghost small" data-a="down" aria-label="Descendre">▼</button><button class="btn ghost small" data-a="left" aria-label="Gauche">◀</button><button class="btn ghost small" data-a="right" aria-label="Droite">▶</button><button class="btn plain small" data-a="reset">Réinitialiser</button></div>`);
    sh.setFoot(`${av && !isNew && S.avatar ? '<button class="btn danger" data-a="del">Retirer</button>' : '<button class="btn plain" data-a="cancel">Annuler</button>'}<button class="btn grow" data-a="ok">Valider</button>`);
    const box = $('.ph-box', sh.body), img = $('img', box), zEl = $('[data-f="z"]', sh.body);
    const apply = () => { pos.x = Math.max(0, Math.min(100, pos.x)); pos.y = Math.max(0, Math.min(100, pos.y)); pos.z = Math.max(1, Math.min(3, pos.z));
      img.style.objectPosition = `${pos.x}% ${pos.y}%`; img.style.transformOrigin = `${pos.x}% ${pos.y}%`; img.style.transform = `scale(${pos.z})`; zEl.value = pos.z; };
    // débordement réel de l'image dans le cadre (en px) pour qu'un glissement suive exactement le doigt
    const over = () => { const nw = img.naturalWidth || 1, nh = img.naturalHeight || 1, bw = box.clientWidth, bh = box.clientHeight, k = Math.max(bw / nw, bh / nh); return { ox: nw * k * pos.z - bw, oy: nh * k * pos.z - bh }; };
    const pts = new Map(); let last = null, pinch0 = null;
    box.addEventListener('pointerdown', e => { box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = { x: e.clientX, y: e.clientY }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: pos.z }; } box.classList.add('drag'); });
    box.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && pinch0) { const [a, b] = [...pts.values()]; pos.z = pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch0.d); apply(); return; }
      const o = over(), dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      if (o.ox > 0.5) pos.x -= dx / o.ox * 100; if (o.oy > 0.5) pos.y -= dy / o.oy * 100; apply();
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; if (pts.size === 1) last = [...pts.values()][0]; if (!pts.size) box.classList.remove('drag'); };
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    box.addEventListener('wheel', e => { e.preventDefault(); pos.z *= e.deltaY < 0 ? 1.06 : 1 / 1.06; apply(); }, { passive: false });
    zEl.addEventListener('input', () => { pos.z = +zEl.value; apply(); });
    const step = 6;
    sh.body.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'up') pos.y += step; if (a === 'down') pos.y -= step; if (a === 'left') pos.x += step; if (a === 'right') pos.x -= step;
      if (a === 'reset') Object.assign(pos, { x: 50, y: 20, z: 1 }); apply(); });
    sh.foot.onclick = async e => { const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'cancel') closeSheet(1);
      if (a === 'del') { S.avatar = ''; await Store.del('avatar'); closeSheet(1, () => { render(); toast('Photo de profil retirée'); }); return; }
      if (a === 'ok' && av) { // photo de profil : on enregistre directement le carré recadré (400 px)
        const c = document.createElement('canvas'), N = 400; c.width = c.height = N; const nw = img.naturalWidth, nh = img.naturalHeight, bw = box.clientWidth, bh = box.clientHeight, k = Math.max(bw / nw, bh / nh);
        const dw = nw * k * pos.z, dh = nh * k * pos.z, left = pos.x / 100 * (bw - dw), top = pos.y / 100 * (bh - dh), sc = N / bw;
        c.getContext('2d').drawImage(img, left * sc, top * sc, dw * sc, dh * sc);
        S.avatar = c.toDataURL('image/jpeg', 0.88); await Store.put('avatar', S.avatar);
        closeSheet(1, () => { render(); toast('Photo de profil enregistrée'); }); return;
      }
      if (a === 'ok') { S.photo = src; S.photoPos = { x: Math.round(pos.x * 10) / 10, y: Math.round(pos.y * 10) / 10, z: Math.round(pos.z * 100) / 100 };
        await Store.put('photo', S.photo); await Store.put('photoPos', S.photoPos); closeSheet(1, () => { render(); toast(isNew ? 'Photo objectif ajoutée 💪' : 'Cadrage enregistré'); }); } };
    openSheet(sh.el);
  }
  function viewProfile() {
    const p = S.profile, g = goals(), c = g, w = currentWeight();
    const install = isStandalone() ? '' : `<section class="card"><h3>Installer l'application</h3>${isIOS()
      ? '<p class="small">Dans <b>Safari</b> : touche <b>« ⋯ »</b> à côté de la barre d\'adresse, puis <b>Partager</b> (carré avec une flèche), fais défiler et choisis <b>« Sur l\'écran d\'accueil »</b>. Sur les anciens iOS, le bouton Partager est directement en bas de l\'écran.</p>'
      : installPrompt ? '<button class="btn block" data-action="install">Installer Kalo</button>' : '<p class="small">Dans <b>Chrome</b> : menu <b>⋮</b> puis <b>« Ajouter à l\'écran d\'accueil »</b> ou <b>« Installer l\'application »</b>.</p>'}</section>`;
    const hM = `${Math.floor(p.height / 100)}m${String(Math.round(p.height % 100)).padStart(2, '0')}`;
    const imc = w / (p.height / 100) ** 2;
    const prompt = aiPrompt();
    return `<h1>Mon profil</h1>
      <section class="card glow">
        <div class="profile-head"><button class="avatar big avatar-edit" data-action="avatar-pick" aria-label="${S.avatar ? 'Modifier' : 'Ajouter'} ma photo de profil" ${S.avatar ? `style="background-image:url('${S.avatar}')"` : ''}>${S.avatar ? '' : ICON.body}<i class="avatar-cam">${S.avatar ? '✎' : '📷'}</i></button>
          <div><div class="n">${esc(p.name || 'Mon profil')}</div><div class="d">${p.age} ans · ${hM} · ${r1(w)} kg</div></div></div>
        <div class="pstats"><div><b class="num">${r1(w)} kg</b><span>Poids actuel</span></div><div><b class="num">${p.target ? r1(p.target) + ' kg' : '–'}</b><span>Objectif</span></div><div><b class="num">${r1(imc)}</b><span>IMC</span></div></div>
      </section>
      <section class="card stack">
        <div class="card-title">📷 Ma photo objectif</div>
        ${S.photo ? `<div class="photo-preview" style="background-image:url('${S.photo}')"></div>` : '<p class="note" style="margin:0">Ajoute une image de toi à ton poids objectif, générée par IA : elle s\'affichera en haut de l\'accueil pour te motiver chaque jour.</p>'}
        <div class="grid2"><button class="btn ${S.photo ? 'outline' : ''}" data-action="photo-pick" ${S.photo ? '' : 'style="grid-column:1/-1"'}>${S.photo ? 'Changer' : 'Ajouter ma photo'}</button>${S.photo ? '<button class="btn danger" data-action="photo-del">Retirer</button><button class="btn outline" data-action="photo-crop" style="grid-column:1/-1">✥ Recadrer / déplacer</button>' : ''}</div>
        <details><summary class="btn plain" style="padding-left:0">Créer ma photo avec l'IA (ChatGPT, Gemini…)</summary>
          <ol class="note" style="padding-left:18px;margin:8px 0">
            <li>Ouvre l'app ChatGPT ou Gemini.</li>
            <li>Envoie une photo de toi bien éclairée, de face, haut du corps visible.</li>
            <li>Colle le texte ci-dessous et envoie.</li>
            <li>Enregistre l'image obtenue dans Photos, puis « Ajouter ma photo » ici.</li></ol>
          <div class="prompt-box">${esc(prompt)}</div>
          <button class="btn outline block" style="margin-top:10px" data-action="copy-prompt">Copier le texte</button>
          <p class="note">C'est une image de motivation, pas une prédiction : ton corps réel à ${p.target ? r1(p.target) + ' kg' : 'ton objectif'} sera un peu différent.</p>
        </details>
      </section>
      ${install}
      <button class="card mu-start" data-tab="foods"><div><div class="card-title">${ICON.fork}Mes aliments</div><div class="sub">Aliments créés, recettes et récemment utilisés</div></div><span class="mu-go">${ICON.right}</span></button>
      <section class="card">
        <h3>Objectifs quotidiens</h3>
        <div class="row between"><div><div class="big num" style="font-size:28px;font-weight:800">${r0(g.kcal)} kcal</div><div class="num" style="color:var(--accent);font-weight:700">${r0(g.protein)} g protéines · ${r0(g.carbs)} g glucides</div><div class="num small muted">lipides ≈ ${r0(g.fat)} g (25 % des calories)</div></div>
        <div class="seg" style="width:150px"><button data-action="goal-mode" data-v="auto" class="${p.goalMode !== 'manual' ? 'on' : ''}">Auto</button><button data-action="goal-mode" data-v="manual" class="${p.goalMode === 'manual' ? 'on' : ''}">Manuel</button></div></div>
        ${p.goalMode === 'manual' ? `<div class="grid2" style="margin-top:12px"><label class="field"><span>Calories (kcal)</span><input type="number" inputmode="numeric" id="mk" value="${p.kcalGoal || g.autoKcal || g.kcal}"></label><label class="field"><span>Protéines (g)</span><input type="number" inputmode="numeric" id="mp" value="${p.proteinGoal || g.autoProtein || g.protein}"></label><label class="field" style="grid-column:1/-1"><span>Glucides (g) — vide = calcul auto</span><input type="number" inputmode="numeric" id="mc" value="${p.carbGoal || ''}" placeholder="${r0(macroSplit(p.kcalGoal || g.kcal, p.proteinGoal || g.protein).carbs)}"></label></div><button class="btn block" style="margin-top:10px" data-action="save-manual">Enregistrer les objectifs</button>` : ''}
        <div class="tdee-box">
          <div class="row between"><span>Dépense de référence</span><b class="num">${r0(g.tdee)} kcal/j</b></div>
          ${g.watch.n >= 3 ? `<div class="seg" style="margin:10px 0 4px"><button data-action="tdee-src" data-v="watch" class="${g.source === 'watch' ? 'on' : ''}">⌚ Ma montre</button><button data-action="tdee-src" data-v="formula" class="${g.source === 'formula' ? 'on' : ''}">Formule</button></div>` : ''}
          <p class="note" style="margin:6px 0 0">${g.watch.n >= 3
            ? `Montre : moyenne de tes ${g.watch.n} dernières journées saisies = <b>${r0(g.watch.avg)} kcal</b>. Formule du profil : ${r0(g.formulaTdee)} kcal.`
            : `Entre le TOTAL de ta montre (Journal → Bilan du jour → ⌚) pendant au moins 3 journées complètes : tes objectifs se caleront alors sur ta montre. Progression : <b>${g.watch.n} / 3</b>. En attendant : formule du profil (${r0(g.formulaTdee)} kcal).`}</p>
        </div>
        <p class="note">Poids actuel ${r1(w)} kg${p.goalMode !== 'manual' ? ` · objectif = dépense de référence − ${r0(Math.min((p.pace || 0) * 1100, 1000))} kcal (rythme ${r1(p.pace || 0)} kg/sem.)` : ` · suggestion auto ${r0(g.autoKcal)} kcal / ${r0(g.autoProtein)} g`}${c.floored ? ' · plancher de sécurité appliqué' : ''}${c.reached ? ' · poids objectif atteint : mode maintien' : ''}.</p>
      </section>
      <form class="card stack" id="pform" novalidate><h3>Mon profil</h3>${profileFields({ ...p, noWeight: true })}<button type="button" class="btn block" data-action="save-profile">Enregistrer</button></form>
      <section class="card">
        <div class="card-title" style="margin-bottom:12px"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5c0-4.1-4-7.6-9-7.6z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/></svg>Couleur de l'app</div>
        <div class="swatches">${THEMES.map(([n, h]) => `<button class="swatch ${S.theme.toLowerCase() === h.toLowerCase() ? 'on' : ''}" data-action="theme" data-v="${h}"><i style="background:${h};--sw-glow:${h}80"></i>${n}</button>`).join('')}</div>
        <label class="custom-color"><span>Couleur personnalisée</span><input type="color" data-input="theme" value="${S.theme}"></label>
        <p class="note" style="margin:8px 0 0">S'applique à toute l'app. Les couleurs de sens restent fixes : vert = objectif atteint / déficit, orange = dépassement, bleu = repas validé.</p>
      </section>
      <section class="card stack"><div class="card-title">🎆 Animation de validation</div>
        <p class="note" style="margin:0">Flammes autour du repas puis feu d'artifice d'étoiles quand tu valides un repas ou ta journée.</p>
        <div class="fx-row"><span>Animation</span><div class="seg"><button data-action="fx" data-k="anim" data-v="1" class="${S.fx.anim ? 'on' : ''}">Oui</button><button data-action="fx" data-k="anim" data-v="0" class="${S.fx.anim ? '' : 'on'}">Non</button></div></div>
        <div class="fx-row"><span>Sons</span><div class="seg"><button data-action="fx" data-k="sound" data-v="1" class="${S.fx.sound ? 'on' : ''}">Oui</button><button data-action="fx" data-k="sound" data-v="0" class="${S.fx.sound ? '' : 'on'}">Non</button></div></div>
        <button class="btn outline block" data-action="fx-test">Tester l'animation</button>
        <p class="note" style="margin:0">Sur iPhone, les sons sont coupés quand le bouton silencieux est activé.</p></section>
      <section class="card stack" id="ai-settings"><div class="card-title">${ICON.sparkle}Photo IA</div>${aiSettingsHTML()}<button class="btn block" data-action="ai-save">Enregistrer la clé</button></section>
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

  /* Déficit moyen sur 7 / 30 / 90 jours (jours saisis seulement ; aujourd'hui compte s'il est validé) */
  function deficitCard() {
    const N = UI.defRange || 7, t0 = isLocked(today()) ? 0 : 1, days = [];
    for (let i = t0; i < N + t0; i++) { const k = dkey(addDays(new Date(), -i)); if ((S.days[k]?.entries?.length || 0) > 0) days.push(k); }
    const seg = `<div class="seg compact">${[7, 30, 90].map(v => `<button data-action="def-range" data-v="${v}" class="${N === v ? 'on' : ''}">${v}j</button>`).join('')}</div>`;
    if (days.length < 2) return `<section class="card neon defc"><div class="row between"><div class="card-title">⚡ Déficit moyen</div>${seg}</div><p class="note" style="margin:10px 0 0">Saisis au moins 2 jours pour voir ton déficit moyen.</p></section>`;
    const vals = days.map(k => dayBurn(k).v - dayTotals(k).kcal), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const measured = days.filter(k => dayBurn(k).measured).length, perWeek = avg * 7 / 7700, tw = Wc.analyse()?.trendWeek;
    const pos = avg >= 0, best = Math.max(...vals), worst = Math.min(...vals);
    return `<section class="card neon defc"><div class="row between"><div class="card-title">⚡ Déficit moyen</div>${seg}</div>
      <div class="def-main"><b class="num ${pos ? 'good-text' : 'over-text'}">${pos ? '−' : '+'}${r0(Math.abs(avg)).toLocaleString('fr-FR')}</b><span>kcal / jour ${pos ? 'de déficit' : "d'excédent"}</span></div>
      <div class="def-grid">
        <div><b class="num">${pos ? '−' : '+'}${String(r1(Math.abs(perWeek))).replace('.', ',')} kg</b><small>de graisse estimée / semaine</small></div>
        <div><b class="num">${tw == null ? '–' : (tw > 0 ? '+' : tw < 0 ? '−' : '') + String(r1(Math.abs(tw))).replace('.', ',') + ' kg'}</b><small>sur la balance / semaine (tendance)</small></div>
        <div><b class="num">${days.length}/${N}</b><small>jours saisis${measured ? ` · ${measured} avec la montre` : ''}</small></div>
        <div><b class="num">${best >= 0 ? '−' : '+'}${r0(Math.abs(best))} / ${worst >= 0 ? '−' : '+'}${r0(Math.abs(worst))}</b><small>meilleur / pire jour (kcal)</small></div>
      </div></section>`;
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
        const bal = logged.reduce((s, x) => s + (x.t.kcal - dayBurn(x.k).v), 0);
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
      ${Bo.weekHTML()}
      ${viewProjection()}
      <div class="seg">${[['week', 'Semaine'], ['month', 'Mois'], ['year', 'Année']].map(([v, l]) => `<button data-action="period" data-v="${v}" class="${UI.period === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="period-nav"><button class="icon-btn" data-action="per-prev" aria-label="Période précédente">${ICON.left}</button><b>${periodLabel(r)}</b><button class="icon-btn" data-action="per-next" aria-label="Période suivante" ${isCurrent ? 'disabled style="opacity:.3"' : ''}>${ICON.right}</button></div>
      <section class="card neon">
        <div class="seg" style="margin-bottom:12px">${[['kcal', 'Calories'], ['protein', 'Protéines'], ['weight', 'Poids']].map(([v, l]) => `<button data-action="metric" data-v="${v}" class="${m === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="chart-wrap" id="chart"></div>
        <div class="legend">${legend}</div>
        ${UI.period === 'year' && m !== 'weight' ? '<p class="note" style="margin:8px 0 0">Moyenne mensuelle des jours saisis.</p>' : ''}
      </section>
      <div class="stats">${stats}</div>
      <section class="card" style="margin-top:14px">
        <div class="row between" style="margin-bottom:6px"><h3 style="margin:0">Pesées</h3><button class="btn plain" data-action="add-weight">+ Ajouter</button></div>
        ${ws.length ? ws.map(w => `<button class="item" data-action="edit-weight" data-date="${w.date}" style="padding-left:0;padding-right:0"><div class="grow">${cap(F.dmy.format(dparse(w.date)))}</div><b class="num">${r1(w.kg)} kg</b></button>`).join('') : '<div class="empty small">Aucune pesée.</div>'}
      </section>
      <div style="margin-top:14px">${Wc.card()}</div>
      ${Bo.trophiesHTML()}`;
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
      return { x: x(best.t), y: y(best.v), text: `${cap(F.short.format(dparse(best.date)))} · ${r1(best.v)} kg` };
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
    const all = [...hist.map(h => ({ t: h.t, v: h.v, text: `${cap(F.short.format(new Date(h.t)))} · ${r1(h.v)} kg (pesée)` })), ...P.months.map(m => ({ t: m.d.getTime(), v: m.kg, text: `Fin ${F.month.format(m.d)} · ≈ ${r1(m.kg)} kg` })), ...(P.capped ? [] : [{ t: P.end.getTime(), v: P.tgt, text: `🎯 ${cap(F.dmy.format(P.end))} · ${r1(P.tgt)} kg` }])];
    bindTip(wrap, null, ev => {
      const px = ev.clientX - wrap.querySelector('svg').getBoundingClientRect().left;
      let best = all[0]; for (const a of all) if (Math.abs(x(a.t) - px) < Math.abs(x(best.t) - px)) best = a;
      return { x: x(best.t), y: y(best.v), text: best.text };
    });
  }

  /* Main pointeuse originale (dessin maison) : index levé vers le point */
  const HAND_SVG = '<svg viewBox="0 0 24 30" width="22" height="28" aria-hidden="true"><path d="M9.2 1.6c1.3 0 2.3 1 2.3 2.3v8.3l.2-.1c.4-1 1.3-1.6 2.3-1.6 1.2 0 2.1.8 2.3 1.9.4-.5 1.1-.8 1.8-.8 1.2 0 2.2.9 2.3 2.1.3-.2.7-.3 1.1-.3 1.3 0 2.3 1 2.3 2.3v5.6c0 4.6-3.6 8.2-8.2 8.2h-1.6c-2.6 0-4.9-1.2-6.4-3.3L1.4 20.6c-.8-1-.6-2.4.4-3.2.9-.7 2.2-.6 3 .2l2.1 2.1V3.9c0-1.3 1-2.3 2.3-2.3z" fill="#fff" stroke="#0B0F0D" stroke-width="1.6" stroke-linejoin="round"/><path d="M11.5 12.2v4.3M16.1 13.2v3.3M20.2 14.6v2.6" stroke="#0B0F0D" stroke-width="1.3" stroke-linecap="round"/></svg>';
  function bindTip(wrap, byIndex, byEvent) {
    const tip = wrap.querySelector('.chart-tip'), svg = wrap.querySelector('svg');
    const show = ev => {
      let info = null;
      if (byEvent) info = byEvent(ev);
      else { const i = ev.target?.dataset?.i; if (i == null) return; info = byIndex(+i); }
      tip.textContent = info.text; tip.classList.add('show');
      const w = tip.offsetWidth, W = wrap.clientWidth;
      tip.style.left = Math.min(W - w / 2, Math.max(w / 2, info.x)) + 'px';
      if (info.y != null) {
        let ring = wrap.querySelector('.chart-ring'), hand = wrap.querySelector('.chart-hand');
        if (!ring) { ring = document.createElement('i'); ring.className = 'chart-ring'; wrap.appendChild(ring); }
        if (!hand) { hand = document.createElement('div'); hand.className = 'chart-hand'; hand.innerHTML = HAND_SVG; wrap.appendChild(hand); }
        const key = info.x + ':' + info.y;
        if (hand.dataset.k !== key) {
          hand.dataset.k = key;
          ring.style.left = hand.style.left = info.x + 'px';
          ring.style.top = info.y + 'px'; hand.style.top = (info.y + 7) + 'px';
          [ring, hand].forEach(el => { el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); });
        }
      }
    };
    svg.addEventListener('pointerdown', show); svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') tip.classList.remove('show'); });
  }

  /* ---------- Scan IA d'un plat (photo + description) ---------- */
  const AI_PROVIDERS = {
    gemini: { name: 'Gemini (Google)', price: 'gratuit', keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'Clé commençant par « AIza… »' },
    claude: { name: 'Claude (Anthropic)', price: '≈ 0,01 € par photo', keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'Clé commençant par « sk-ant-… »' },
  };
  const aiKey = () => (S.ai.keys || {})[S.ai.provider] || '';
  function aiPromptText(desc) {
    return `Tu es un nutritionniste expert en estimation de portions. Analyse la photo du plat${desc ? ' et la description de l\'utilisateur' : ''}.
Identifie chaque composant (y compris ceux qui ne se voient pas mais sont probables : huile ou beurre de cuisson, sauce, sucre). Estime le poids en grammes de chaque composant en te servant de l'assiette, des couverts et des mains comme repères. Pour un plat de restaurant, compte une matière grasse de cuisson généreuse.
${desc ? `Description de l'utilisateur (prioritaire sur ce que tu vois) : « ${desc} »\n` : ''}Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"plat":"nom court du plat","elements":[{"nom":"composant","grammes":0,"kcal":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0,"sel":0,"fruits_legumes_g":0}],"confiance":"faible|moyenne|élevée","remarque":"une phrase : ce qui ferait le plus varier l'estimation"}
fruits_legumes_g = grammes de fruits, légumes ou légumineuses dans ce composant (0 pour viande, féculents, sauces). Les valeurs kcal, proteines, glucides, lipides, fibres, sel sont celles de la quantité estimée (pas pour 100 g). Si la photo ne montre pas de nourriture, renvoie "elements":[].`;
  }
  function parseAIJson(txt) {
    const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('format');
    const j = JSON.parse(txt.slice(a, b + 1));
    const items = (j.elements || []).map(e => ({ name: String(e.nom || 'Élément'), grams: Math.max(1, num(e.grammes) || 100), kcal: Math.max(0, num(e.kcal) || 0), p: Math.max(0, num(e.proteines) || 0), c: Math.max(0, num(e.glucides) || 0), f: Math.max(0, num(e.lipides) || 0), fib: num(e.fibres), salt: num(e.sel), vg: Math.max(0, num(e.fruits_legumes_g) || 0), on: true }));
    return { dish: String(j.plat || 'Plat'), items, confidence: String(j.confiance || ''), note: String(j.remarque || '') };
  }
  async function geminiModel(key) {
    if (S.ai.geminiModel && S.ai.geminiModelAt > Date.now() - 7 * 864e5) return S.ai.geminiModel;
    let model = 'gemini-3.8-flash';
    try {
      const j = await (await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } })).json();
      const cands = (j.models || []).filter(m => /flash/.test(m.name) && (m.supportedGenerationMethods || []).includes('generateContent') && !/(image|tts|live|lite|embed|audio|thinking|exp)/.test(m.name));
      const ver = n => (n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1] * 1 - (/preview/.test(n) ? 0.01 : 0);
      cands.sort((x, y) => ver(y.name) - ver(x.name));
      if (cands[0]) model = cands[0].name.replace('models/', '');
    } catch (e) { /* modèle par défaut */ }
    S.ai.geminiModel = model; S.ai.geminiModelAt = Date.now(); Store.put('ai', S.ai);
    return model;
  }
  async function aiAnalyze(b64, desc) {
    const key = aiKey(); if (!key) { const e = new Error('nokey'); e.code = 'nokey'; throw e; }
    const prompt = aiPromptText(desc);
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 90000);
    try {
      let r, txt;
      if (S.ai.provider === 'claude') {
        r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: ctl.signal,
          headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 1200, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: prompt }] }] }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { const e = new Error(j.error?.message || 'HTTP ' + r.status); e.status = r.status; throw e; }
        txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      } else {
        const model = await geminiModel(key);
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', signal: ctl.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { if (r.status === 404) { S.ai.geminiModel = ''; Store.put('ai', S.ai); } const e = new Error(j.error?.message || 'HTTP ' + r.status); e.status = r.status; throw e; }
        txt = (j.candidates?.[0]?.content?.parts || []).map(x => x.text || '').join('');
      }
      return parseAIJson(txt);
    } finally { clearTimeout(tm); }
  }
  const aiError = e => e.code === 'nokey' ? 'Ajoute ta clé API pour utiliser la photo IA.'
    : e.status === 400 && /key|API_KEY/i.test(e.message) || e.status === 401 || e.status === 403 ? 'Clé API refusée : vérifie-la dans les réglages IA.'
      : e.status === 429 ? (S.ai.provider === 'gemini' ? 'Quota gratuit Gemini atteint pour le moment : réessaie dans une minute (ou demain si la limite du jour est atteinte).' : 'Trop de demandes : réessaie dans une minute.')
        : e.status === 529 || e.status >= 500 ? 'Le service IA est surchargé, réessaie dans un instant.'
          : e.name === 'AbortError' ? "L'analyse a pris trop de temps, réessaie."
            : e.message === 'format' || e instanceof SyntaxError ? "Réponse de l'IA illisible, réessaie (ou précise la description)."
              : !navigator.onLine ? 'Pas de connexion internet.' : 'Analyse impossible : ' + (e.message || 'erreur inconnue');
  async function imageToB64(file, max = 1280) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const d = c.toDataURL('image/jpeg', 0.82);
      return { dataUrl: d, b64: d.split(',')[1] };
    } finally { URL.revokeObjectURL(url); }
  }
  function aiSettingsHTML() {
    const pv = AI_PROVIDERS[S.ai.provider];
    return `<div class="seg" style="margin-bottom:10px">${Object.entries(AI_PROVIDERS).map(([k, v]) => `<button type="button" data-ai-prov="${k}" class="${S.ai.provider === k ? 'on' : ''}">${v.name.split(' ')[0]} · ${v.price}</button>`).join('')}</div>
      <label class="field"><span>Clé API ${esc(pv.name)}</span><input type="password" data-f="aikey" autocomplete="off" value="${esc(aiKey())}" placeholder="${esc(pv.keyHint)}"></label>
      <p class="note" style="margin:6px 0 0">Obtenir une clé : <a href="${pv.keyUrl}" target="_blank" rel="noopener">${pv.keyUrl.replace('https://', '')}</a> → créer une clé → la copier ici. La clé reste sur ton téléphone (jamais dans les sauvegardes). La photo est envoyée à ${esc(pv.name)} pour l'analyse${S.ai.provider === 'gemini' ? ' ; en gratuit, Google peut utiliser les données pour améliorer ses produits' : ''}.</p>`;
  }
  function bindAISettings(root, onChange) {
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-ai-prov]'); if (!b) return;
      saveAIKey(root); S.ai.provider = b.dataset.aiProv; Store.put('ai', S.ai); onChange();
    });
  }
  function saveAIKey(root) {
    const inp = $('[data-f="aikey"]', root); if (!inp) return;
    S.ai.keys = S.ai.keys || {}; S.ai.keys[S.ai.provider] = inp.value.trim(); Store.put('ai', S.ai);
  }
  function openAIScan(ctx) {
    const sh = makeSheet('Photo IA');
    const st = { file: null, img: '', b64: '', desc: '', res: null, mult: 1, loading: false, err: '', meal: ctx.meal };
    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.hidden = true; sh.el.appendChild(fileInput);
    const totals = () => st.res.items.filter(i => i.on).reduce((t, i) => { const k = st.mult; t.kcal += i.kcal * k; t.p += i.p * k; t.c += i.c * k; t.f += i.f * k; return t; }, { kcal: 0, p: 0, c: 0, f: 0 });
    const draw = () => {
      const needKey = !aiKey();
      let h = '';
      if (needKey || st.showSettings) h += `<section class="card"><div class="card-title" style="margin-bottom:10px">${ICON.sparkle}Réglages IA</div>${aiSettingsHTML()}<button class="btn block" style="margin-top:12px" data-a="savekey">Enregistrer la clé</button></section>`;
      h += `<section class="card stack">
        ${st.img ? `<div class="ai-photo" style="background-image:url('${st.img}')"></div>` : `<button class="ai-drop" data-a="pick">${ICON.camera}<b>Prendre ou choisir une photo</b><span>de ton plat, vue de dessus si possible, avec l'assiette entière</span></button>`}
        ${st.img ? '<button class="btn outline block small" data-a="pick">Changer de photo</button>' : ''}
        <label class="field"><span>Décris ton plat pour plus de précision</span><textarea data-f="desc" rows="3" placeholder="ex. Burger au restaurant, double steak, cheddar, sauce maison ; frites à moitié mangées ; pas de dessert">${esc(st.desc)}</textarea></label>
        <p class="note" style="margin:0">Indique ce que la photo ne montre pas : cuisson (frit, au beurre), sauces, quantité réelle (« j'ai laissé la moitié du riz »), taille de l'assiette.</p>
        <button class="btn block" data-a="go" ${!st.img || st.loading || needKey ? 'disabled' : ''}>${st.loading ? 'Analyse en cours…' : `${ICON.sparkle} Analyser le plat`}</button>
        ${st.loading ? '<div class="spinner"></div>' : ''}
        ${st.err ? `<p class="small over-text" style="margin:0">${esc(st.err)}</p>` : ''}
      </section>`;
      if (st.res) {
        const t = totals();
        h += st.res.items.length ? `<h3>${esc(st.res.dish)}</h3>
        <section class="card">
          <div class="nutri-grid"><div><b class="num">${r0(t.kcal)}</b><span>kcal</span></div><div class="pr"><b class="num">${r1(t.p)}</b><span>protéines</span></div><div><b class="num">${r1(t.c)}</b><span>glucides</span></div><div><b class="num">${r1(t.f)}</b><span>lipides</span></div></div>
          <div class="chips" style="justify-content:center">${[0.5, 0.75, 1, 1.25, 1.5].map(m => `<button class="chip ${st.mult === m ? 'chip-on' : ''}" data-a="mult" data-v="${m}">${m === 1 ? 'Portion estimée' : '× ' + r1(m)}</button>`).join('')}</div>
          ${st.res.confidence ? `<p class="note" style="text-align:center;margin:10px 0 0">Confiance de l'IA : <b>${esc(st.res.confidence)}</b>${st.res.note ? ' · ' + esc(st.res.note) : ''}</p>` : ''}
        </section>
        <h3>Détail (modifie les grammes si besoin)</h3>
        <section class="card list">${st.res.items.map((i, n) => `<div class="item ai-item ${i.on ? '' : 'off'}">
          <button class="meal-check ${i.on ? 'on' : ''}" data-a="tog" data-i="${n}" aria-label="Inclure">${ICON.check}</button>
          <div class="grow"><div class="name">${esc(i.name)}</div><div class="sub num">${r0(i.kcal * st.mult)} kcal · ${r1(i.p * st.mult)} g prot.</div></div>
          <input type="number" inputmode="decimal" class="ai-g" data-i="${n}" value="${Math.round(i.grams * st.mult)}" aria-label="Grammes"><span class="muted small">g</span></div>`).join('')}</section>
        <label class="field"><span>Repas</span><select data-f="meal">${mealOptions(st.meal)}</select></label>
        <p class="note">Estimation à ±20–30 % : une photo ne montre ni l'huile ni ce qui est caché. Plus la description est précise, plus le chiffre est fiable.</p>`
          : '<section class="card"><p style="margin:0">Aucun aliment reconnu sur la photo. Essaie une photo plus nette, vue de dessus, ou ajoute une description.</p></section>';
      }
      h += `<button class="btn plain block" data-a="settings">${st.showSettings ? 'Masquer' : 'Réglages IA'} · ${esc(AI_PROVIDERS[S.ai.provider].name)}</button>`;
      sh.setBody(h);
      sh.setFoot(st.res && st.res.items.some(i => i.on) ? `<button class="btn grow" data-a="add">Ajouter · ${r0(totals().kcal)} kcal</button>` : '');
      const ta = $('[data-f="desc"]', sh.body); ta.addEventListener('input', () => { st.desc = ta.value; });
      $$('.ai-g', sh.body).forEach(inp => inp.addEventListener('change', () => {
        const i = st.res.items[+inp.dataset.i], g = num(inp.value); if (!(g > 0)) return;
        const ratio = g / (i.grams * st.mult); i.grams *= ratio; i.kcal *= ratio; i.p *= ratio; i.c *= ratio; i.f *= ratio; if (i.fib != null) i.fib *= ratio; if (i.salt != null) i.salt *= ratio; i.vg *= ratio; draw();
      }));
      const ms = $('[data-f="meal"]', sh.body); if (ms) ms.addEventListener('change', () => { st.meal = ms.value; });
    };
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files[0]; fileInput.value = ''; if (!f) return;
      try { const r = await imageToB64(f); st.img = r.dataUrl; st.b64 = r.b64; st.res = null; st.err = ''; draw(); } catch (e) { toast('Image illisible'); }
    });
    bindAISettings(sh.body, draw);
    sh.body.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'pick') fileInput.click();
      if (a === 'settings') { st.showSettings = !st.showSettings; draw(); }
      if (a === 'savekey') { saveAIKey(sh.body); st.showSettings = false; toast(aiKey() ? 'Clé enregistrée ✓' : 'Clé effacée'); draw(); }
      if (a === 'mult') { st.mult = +b.dataset.v; draw(); }
      if (a === 'tog') { const i = st.res.items[+b.dataset.i]; i.on = !i.on; draw(); }
      if (a === 'go' && !st.loading) {
        st.loading = true; st.err = ''; st.res = null; st.mult = 1; draw();
        try { st.res = await aiAnalyze(st.b64, st.desc.trim()); } catch (err) { st.err = aiError(err); }
        st.loading = false; draw();
      }
    });
    sh.foot.onclick = e => {
      if (!e.target.closest('[data-a="add"]')) return;
      const d = getDay(ctx.date), meal = st.meal;
      for (const i of st.res.items.filter(x => x.on)) {
        const g = i.grams * st.mult, k = st.mult;
        d.entries.push({ id: uid(), meal, src: 'ai', name: i.name, brand: st.res.dish + ' · IA', per100: { kcal: i.kcal / i.grams * 100, p: i.p / i.grams * 100, c: i.c / i.grams * 100, f: i.f / i.grams * 100, fib: i.fib != null ? i.fib / i.grams * 100 : null, salt: i.salt != null ? i.salt / i.grams * 100 : null, veg: Math.min(100, (i.vg || 0) / i.grams * 100), dairy: 0 }, unit: null, grams: g, count: null, kcal: i.kcal * k, p: i.p * k, c: i.c * k, f: i.f * k, t: Date.now() });
      }
      saveDay(ctx.date); UI.date = ctx.date; UI.tab = 'journal';
      const t = totals(); closeAll(() => toast(`Ajouté · ${r0(t.kcal)} kcal · ${r0(t.p)} g prot.`));
    };
    draw(); openSheet(sh.el);
  }

  /* ---------- Écran : ajouter un aliment ---------- */
  function openAdd(meal, date = UI.date) {
    const sh = makeSheet(`Ajouter · ${mealName(meal)}`);
    sh.setBody(`
      <div class="quick-actions">
        <button data-a="scan">${ICON.scan}Scanner</button>
        <button data-a="quick">${ICON.bolt}Ajout rapide</button>
        <button data-a="create">${ICON.plus}Créer</button>
        <button data-a="ai" class="ai-btn">${ICON.sparkle}Photo IA</button>
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
      if (!q) h += Bo.favsHTML();
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
      const fr = Bo.favClick(e, ctx, msg => closeAll(() => toast(msg)));
      if (fr === 'redraw') return draw(); if (fr) return;
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'scan') return openScanner(ctx);
      if (a === 'quick') return openQuick(ctx);
      if (a === 'create') return openFoodForm(null, { ctx });
      if (a === 'ai') return openAIScan(ctx);
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
    const st = starchInfo(food), raw = st && st.state === 'cru';
    let mode = 'g', qty = 100;
    if (entry && entry.cg && raw) { mode = 'c'; qty = Math.round(entry.cg); }
    else if (entry) { if (entry.count && entry.unit) { mode = 'u'; qty = entry.count; } else qty = Math.round(entry.grams * 10) / 10; }
    else if (ctx.grams) { mode = 'g'; qty = Math.round(ctx.grams); }
    else if (recent?.lastGrams) { if (recent.lastCount && food.unit) { mode = 'u'; qty = recent.lastCount; } else qty = recent.lastGrams; }
    else if (food.unit) { mode = 'u'; qty = 1; }
    const p = food.per100;
    sh.setBody(`
      <div class="food-hero">${food.img ? `<img src="${esc(food.img)}" alt="" referrerpolicy="no-referrer">` : ''}
        <div class="grow"><div class="title">${esc(food.name)}</div><div class="muted small">${esc([food.brand, food.qtyLabel].filter(Boolean).join(' · '))}</div>
        <div style="margin-top:6px">${food.ns ? `<span class="badge ns ns-${food.ns}">Nutri-Score ${food.ns.toUpperCase()}</span> ` : ''}<span class="badge">${food.src === 'off' ? 'Open Food Facts' : food.src === 'custom' ? 'Mon aliment' : 'Générique'}</span> ${crTag(st)} <button type="button" class="badge edit-food" data-a="edit-food">✎ Modifier l'aliment</button></div></div></div>
      ${st ? `<div class="cr-note cr-${st.state}">${raw ? `<b>Valeurs pour le produit cru (sec).</b> Pesé avant cuisson → « g crus ». Pesé dans l'assiette → unité <b>« g cuits »</b>, l'appli divise par ${String(st.ratio).replace('.', ',')}.` : `<b>Valeurs pour le produit cuit.</b> Pèse ta portion cuite, dans l'assiette.`}</div>` : ''}
      <section class="card"><div class="nutri-grid"><div class="kc"><b class="num" data-o="kcal"></b><span>kcal</span></div><div class="pr"><b class="num" data-o="p"></b><span>protéines</span></div><div><b class="num" data-o="c"></b><span>glucides</span></div><div><b class="num" data-o="f"></b><span>lipides</span></div></div><div class="q-chips" data-o="q"></div></section>
      <section class="card stack">
        <div class="qty-row"><label class="field"><span>Quantité</span><input type="number" inputmode="decimal" step="any" min="0" data-f="qty" value="${qty}"></label>
        <label class="field"><span>Unité</span><select data-f="mode"><option value="g" ${mode === 'g' ? 'selected' : ''}>${raw ? 'g crus' : st ? 'g cuits' : 'grammes (g / ml)'}</option>${raw ? `<option value="c" ${mode === 'c' ? 'selected' : ''}>g cuits</option>` : ''}${food.unit ? `<option value="u" ${mode === 'u' ? 'selected' : ''}>${esc(food.unit.label)}${/\d\s*(g|ml)\b/i.test(food.unit.label) ? '' : ` — ${r0(food.unit.g)} g`}</option>` : ''}</select></label></div>
        <div class="cr-conv muted small" data-o="conv"></div>
        <div class="chips" data-f="chips"></div>
        <label class="field"><span>Repas</span><select data-f="meal">${mealOptions(entry ? entry.meal : ctx.meal)}</select></label>
      </section>
      <p class="note">Pour 100 g : ${r0(p.kcal)} kcal · ${r1(p.p)} g protéines · ${r1(p.c)} g glucides · ${r1(p.f)} g lipides${p.fib != null ? ` · ${r1(p.fib)} g fibres` : ''}${p.salt != null ? ` · ${r1(p.salt)} g sel` : ''}${Nu.sugOf(p, food.name) > 0 ? ` · ${r1(Nu.sugOf(p, food.name))} g sucres` : ''}${food.code ? ` · code ${esc(food.code)}` : ''}</p>`);
    sh.setFoot(`${entry ? '<button class="btn danger" data-a="del">Supprimer</button>' : ''}<button class="btn grow" data-a="save">${entry ? 'Enregistrer' : 'Ajouter'}</button>`);
    const qEl = $('[data-f="qty"]', sh.body), mEl = $('[data-f="mode"]', sh.body), chips = $('[data-f="chips"]', sh.body);
    const grams = () => { const v = num(qEl.value) || 0; return mEl.value === 'u' && food.unit ? v * food.unit.g : mEl.value === 'c' && raw ? v / st.ratio : v; };
    const upd = () => {
      const k = grams() / 100;
      const cv = $('[data-o="conv"]', sh.body);
      cv.textContent = mEl.value === 'c' ? `≈ ${r0(grams())} g de produit sec comptés` : raw && mEl.value === 'g' ? `≈ ${r0(grams() * st.ratio)} g une fois cuit` : '';
      $('[data-o="kcal"]', sh.body).textContent = r0(p.kcal * k);
      $('[data-o="p"]', sh.body).textContent = r1(p.p * k);
      $('[data-o="c"]', sh.body).textContent = r1(p.c * k);
      $('[data-o="f"]', sh.body).textContent = r1(p.f * k);
      const qc = [p.fib != null ? `<span class="qc-fib">${r1(p.fib * k)} g fibres</span>` : '<span class="qc-na">fibres non renseignées</span>', p.salt != null ? `<span class="qc-salt ${p.salt * k > 2 ? 'hi' : ''}">${r1(p.salt * k)} g sel</span>` : '', Nu.sugOf(p, food.name) > 0 ? `<span class="qc-sug ${Nu.flags(p, food.name).sweet || Nu.sugOf(p, food.name) * k > 25 ? 'hi' : ''}">${r1(Nu.sugOf(p, food.name) * k)} g sucres</span>` : '', p.veg ? `<span class="qc-veg">🥦 ${r1(grams() * p.veg / 100 / 80).replace('.', ',')} portion F&L</span>` : '', p.dairy ? `<span class="qc-dairy">🥛 ${r1(grams() / p.dairy).replace('.', ',')} laitier</span>` : ''].filter(Boolean);
      $('[data-o="q"]', sh.body).innerHTML = qc.join('');
    };
    const drawChips = () => { chips.innerHTML = (mEl.value === 'u' ? [0.5, 1, 2, 3] : (mEl.value === 'c' ? [100, 150, 200, 250, 300, 350] : [30, 50, 100, 150, 200, 250])).map(v => `<button type="button" class="chip" data-v="${v}">${mEl.value === 'u' ? r1(v) : v + ' g'}</button>`).join(''); };
    qEl.addEventListener('input', upd);
    mEl.addEventListener('change', () => { qEl.value = mEl.value === 'u' ? 1 : mEl.value === 'c' ? 200 : (food.unit ? food.unit.g : 100); drawChips(); upd(); });
    chips.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { qEl.value = b.dataset.v; upd(); } });
    drawChips(); upd();
    // modifier l'aliment lui-même (valeurs, nom, portion) ; un produit Open Food Facts / générique devient « Mon aliment »
    $('[data-a="edit-food"]', sh.body).onclick = () => {
      const own = food.src === 'custom' && S.foods.find(x => x.id === food.id);
      const base = own || { ...food, id: undefined, src: 'custom' };
      openFoodForm(base, { ctx: { ...ctx, entry, grams: grams() }, replace: sh });
    };
    sh.foot.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'del') { deleteEntry(ctx.date, entry.id); closeAll(() => toast('Supprimé')); }
      if (a === 'save') {
        const g = grams(); if (!(g > 0)) { toast('Indique une quantité'); return; }
        const meal = $('[data-f="meal"]', sh.body).value, count = mEl.value === 'u' ? num(qEl.value) : null, k = g / 100;
        const e2 = {
          id: entry ? entry.id : uid(), meal, src: food.src, fid: food.id || '', code: food.code || '', name: food.name, brand: food.brand || '',
          per100: p, unit: food.unit || null, img: food.img || '', ns: food.ns || '', qtyLabel: food.qtyLabel || '',
          grams: g, count, cg: mEl.value === 'c' ? num(qEl.value) : null, kcal: p.kcal * k, p: p.p * k, c: p.c * k, f: p.f * k, t: entry ? entry.t : Date.now(),
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
      <label class="field"><span>Lipides (g)</span><input type="number" inputmode="decimal" data-f="f" value="${val(f.per100?.f)}"></label>
      <label class="field"><span>Fibres (g)</span><input type="number" inputmode="decimal" data-f="fib" value="${val(f.per100?.fib)}"></label>
      <label class="field"><span>Sel (g)</span><input type="number" inputmode="decimal" data-f="salt" value="${val(f.per100?.salt)}"></label></div>
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
        const nf = { src: 'custom', id: f.id || uid(), name, brand: g('brand'), code: g('code').replace(/\D/g, ''), per100: { ...(f.per100 || {}), kcal, p: num(g('p')) || 0, c: num(g('c')) || 0, f: num(g('f')) || 0, fib: num(g('fib')), salt: num(g('salt')) }, unit: ug > 0 ? { label: g('ul') || '1 portion', g: ug } : null };
        S.foods = editing ? S.foods.map(x => x.id === nf.id ? nf : x) : [nf, ...S.foods];
        Store.put('foods', S.foods);
        if (editing) for (const [dk, d] of Object.entries(S.days)) { let ch = false; for (const e of d.entries || []) if (e.fid === nf.id && e.src === 'custom') { const k = e.grams / 100; Object.assign(e, { name: nf.name, brand: nf.brand, per100: nf.per100, unit: nf.unit, kcal: nf.per100.kcal * k, p: nf.per100.p * k, c: nf.per100.c * k, f: nf.per100.f * k }); ch = true; } if (ch) saveDay(dk); }
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
        S.weights = [...S.weights.filter(w => w.date !== d && (!ex || w.date !== ex.date)), { date: d, kg, ...(d === today() ? { h: new Date().getHours() + new Date().getMinutes() / 60 } : ex?.h != null && ex.date === d ? { h: ex.h } : {}) }];
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
    const data = { app: 'kalo', version: 1, exportedAt: new Date().toISOString(), profile: S.profile, weights: S.weights, foods: S.foods, recents: S.recents, days: S.days, photo: S.photo || '', photoPos: S.photoPos || null, avatar: S.avatar || '', nutriFix: S.nutriFix || {}, supps: S.supps, theme: S.theme, fx: S.fx, favs: S.favs, badges: S.badges, muscu: Mu.exportData() };
    const name = `kalo-sauvegarde-${today()}.json`;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Sauvegarde Kalo' }); Bo.markExport(); render(); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Sauvegarde téléchargée'); Bo.markExport(); render();
  }
  async function importData(file) {
    try {
      const d = JSON.parse(await file.text());
      if (d.app !== 'kalo' || !d.profile) throw new Error('format');
      if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
      const keepAI = S.ai;
      await Store.clear();
      await Store.put('ai', keepAI);
      await Store.put('profile', d.profile); await Store.put('weights', d.weights || []); await Store.put('foods', d.foods || []); await Store.put('recents', d.recents || []); if (d.photo) await Store.put('photo', d.photo); if (d.photoPos) await Store.put('photoPos', d.photoPos); if (d.nutriFix) await Store.put('nutriFix', d.nutriFix); if (d.avatar) await Store.put('avatar', d.avatar); if (d.supps) await Store.put('supps', d.supps); if (d.theme) await Store.put('theme', d.theme); if (d.fx) await Store.put('fx', d.fx); if (d.favs) await Store.put('favs', d.favs); if (d.badges) { await Store.put('badges', d.badges); await Store.put('badgesInit', true); }
      for (const k in d.days || {}) await Store.put('day:' + k, d.days[k]);
      await Mu.importData(d.muscu);
      await loadState(); render(); toast('Sauvegarde restaurée');
    } catch (e) { toast('Fichier de sauvegarde invalide'); }
  }

  /* ---------- Musculation (muscu.js) ---------- */
  const Mu = window.KaloMuscuInit({ $, $$, esc, r0, r1, num, uid, cap, dkey, dparse, addDays, today, F, ICON, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, closeAll, niceStep, bindTip, currentWeight });

  /* ---------- Boost : coach, eau, favoris, séries, trophées (boost.js) ---------- */
  const Nu = window.KaloNutriInit({ mealDone, editEntry: id => actions['edit-entry']({ dataset: { id } }), $, esc, r0, r1, uid, S, UI, Store, toast, render: () => render(), makeSheet, openSheet, closeSheet, goals, dayTotals, getDay, saveDay, isLocked, guessMeal, mealName, MEALS, progColor, celebrate: (...a) => celebrate(...a), today, GEN, openDetail });
  GEN.forEach(Nu.enrichGen);
  const Wc = window.KaloWeightInit({ S, UI, esc, r0, r1, dkey, dparse, addDays, today, cap, F, sortedWeights, dayTotals, dayBurn, Nu, Mu, goals, currentWeight });
  const So = window.KaloSocialInit({ $, esc, r0, r1, cap, dkey, addDays, today, F, S, UI, Store, toast, render: () => render(), makeSheet, openSheet, closeSheet, goals, dayTotals, currentWeight, sortedWeights, Mu, Nu, progColor, ICON });
  const Bo = window.KaloBoostInit({ Nu, Wc, $, $$, esc, r0, r1, uid, cap, dkey, dparse, addDays, today, F, ICON, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, progColor,
    goals, dayTotals, getDay, saveDay, isLocked, dayBurn, currentWeight, sortedWeights, MEALS, mealName, guessMeal, openDetail, celebrate, Mu, exportData });

  /* ---------- Actions ---------- */
  const actions = {
    'def-range': b => { UI.defRange = +b.dataset.v; render(); },
    'def-open': () => {
      const sh = makeSheet('Déficit moyen');
      const draw = () => { sh.setBody(deficitCard()); requestAnimationFrame(() => liquidSegs(sh.body)); };
      draw(); sh.setFoot('<button class="btn grow" data-a="ok">Fermer</button>'); sh.foot.onclick = () => closeSheet(1);
      sh.body.addEventListener('click', e => { const b = e.target.closest('[data-action="def-range"]'); if (!b) return; e.stopPropagation(); UI.defRange = +b.dataset.v; draw(); }, true);
      openSheet(sh.el);
    },
    'day-prev': () => { UI.date = dkey(addDays(dparse(UI.date), -1)); render(); },
    'day-next': () => { UI.date = dkey(addDays(dparse(UI.date), 1)); render(); },
    add: b => openAdd(b.dataset.meal),
    'scan-global': () => {
      UI.date = UI.tab === 'journal' ? UI.date : today();
      if (isLocked(UI.date)) { UI.tab = 'journal'; render(); toast('Journée validée : touche « Rouvrir » pour ajouter'); return; }
      openScanner({ meal: guessMeal(), date: UI.date });
    },
    burn: () => openBurn(UI.date),
    'add-global': () => {
      const k = UI.tab === 'journal' ? UI.date : today();
      if (isLocked(k)) { UI.date = k; UI.tab = 'journal'; render(); toast('Journée validée : touche « Rouvrir » pour ajouter'); return; }
      UI.date = k; openAdd(guessMeal(), k);
    },
    'photo-pick': () => $('#photoInput').click(),
    'avatar-pick': () => $('#avatarInput').click(),
    'photo-del': () => { if (!confirm('Retirer ta photo objectif ?')) return; S.photo = ''; S.photoPos = null; Store.del('photo'); Store.del('photoPos'); render(); },
    'photo-crop': () => { if (S.photo) openPhotoEditor(S.photo, S.photoPos || { x: 50, y: 0, z: 1 }, false); },
    'copy-prompt': () => { navigator.clipboard?.writeText(aiPrompt()).then(() => toast('Texte copié ✓'), () => toast('Copie impossible : sélectionne le texte')); },
    'supps-manage': () => openSupps(),
    theme: b => setTheme(b.dataset.v),
    'ai-save': () => { saveAIKey($('#ai-settings')); toast(aiKey() ? 'Clé enregistrée ✓' : 'Clé effacée'); render(); },
    'supp-toggle': b => {
      const d = getDay(UI.date); d.supps = d.supps || {};
      const id = b.dataset.id;
      if (d.supps[id]) delete d.supps[id]; else d.supps[id] = Date.now();
      saveDay(UI.date); render();
      if (d.supps[id]) { try { navigator.vibrate?.(15); } catch (e) { /* ignore */ } if (S.supps.every(x => d.supps[x.id])) toast('Tous tes compléments sont pris 💊'); }
    },
    'goal-day': () => {
      const k = UI.date, d = S.days[k] || {}, base = baseGoals().kcal;
      let v = d.kcalOv || base;
      const burn = dayBurn(k), eaten = dayTotals(k).kcal, maint = Math.round(burn.v / 10) * 10, diff = Math.round(eaten - burn.v);
      const isToday = k === today(), when = isToday ? "aujourd'hui" : 'ce jour';
      const sh = makeSheet(isToday ? 'Objectif du jour' : 'Objectif de ce jour');
      const draw = () => {
        sh.setBody(`<section class="card stack gd">
          <div class="gd-maint ${diff > 0 ? 'sur' : 'def'}"><div><small>Maintenance du jour <em>${burn.measured ? 'montre' : 'estimée'}</em></small><b class="num">≈ ${r0(maint)} kcal</b></div><div><small>${eaten ? 'Mangé' : 'Mangé'} ${r0(eaten)} kcal</small><b class="num">${eaten ? (diff > 0 ? 'Surplus +' : 'Déficit −') + r0(Math.abs(diff)) : '–'}</b></div></div>
          <div class="gd-big"><input type="number" inputmode="numeric" id="gd-in" value="${v}"><span>kcal</span></div>
          <div class="gd-sub num">Objectif habituel : ${r0(base)} kcal · ${v === base ? 'inchangé' : (v > base ? '+' : '−') + r0(Math.abs(v - base)) + ' kcal ' + when}</div>
          <div class="chips gd-chips">${[200, 400, 600, 800].map(n => `<button type="button" class="chip" data-add="${n}">+${n}</button>`).join('')}</div>
          <div class="chips gd-chips"><button type="button" class="chip ${v === maint ? 'chip-on' : ''}" data-set="${maint}">Maintenance ${r0(maint)}</button></div>
          <div class="chips gd-chips">${[2400, 2600, 2700, 2800].map(n => `<button type="button" class="chip ${v === n ? 'chip-on' : ''}" data-set="${n}">${n}</button>`).join('')}</div>
          <p class="muted small">Valable uniquement pour ce jour, y compris dans le bilan des 7 jours : un repas libre ou un jour de surplus voulu n'est plus compté comme raté. Les protéines restent identiques, glucides et lipides se recalculent. Le surplus ou déficit se calcule toujours sur ta dépense, pas sur l'objectif.</p>
        </section>`);
        sh.setFoot(`<div class="row" style="gap:10px">${d.kcalOv ? '<button class="btn ghost" data-a="reset">Remettre l\'habituel</button>' : ''}<button class="btn grow" data-a="ok">Enregistrer</button></div>`);
      };
      draw();
      sh.body.addEventListener('input', e => { if (e.target.id === 'gd-in') { v = Math.max(800, Math.min(6000, +e.target.value || 0)); } });
      sh.body.addEventListener('click', e => {
        const b = e.target.closest('[data-add],[data-set]'); if (!b) return;
        const cur = Math.max(800, +sh.body.querySelector('#gd-in')?.value || v);
        v = b.dataset.set ? +b.dataset.set : cur + +b.dataset.add; draw();
      });
      sh.foot.onclick = e => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        const day = getDay(k);
        if (b.dataset.a === 'reset') delete day.kcalOv;
        else { v = Math.max(800, Math.min(6000, +sh.body.querySelector('#gd-in').value || base)); if (v === base) delete day.kcalOv; else day.kcalOv = v; }
        if (day.goal) { const g2 = goals(k); day.goal = { ...day.goal, kcal: g2.kcal, carbs: g2.carbs }; } // jours passés : le bilan lit l'objectif figé du jour
        saveDay(k); closeSheet(1); render(); toast(day.kcalOv ? `Objectif du jour : ${r0(day.kcalOv)} kcal` : 'Objectif habituel rétabli');
      };
      openSheet(sh.el);
    },
    'mini-range': b => { UI.mini = +b.dataset.v; render(); },
    fx: b => { S.fx[b.dataset.k] = b.dataset.v === '1'; Store.put('fx', S.fx); render(); },
    'fx-test': b => celebrate(() => b.closest('.card')),
    'supps-more': b => { UI.suppsOpen = !UI.suppsOpen; b.closest('.supps')?.classList.toggle('open', UI.suppsOpen); b.setAttribute('aria-expanded', UI.suppsOpen); },
    'meal-done': b => {
      const k = UI.date, m = b.dataset.meal; if (isLocked(k)) return;
      const d = getDay(k); d.mealsDone = d.mealsDone || {};
      if (d.mealsDone[m]) delete d.mealsDone[m]; else d.mealsDone[m] = Date.now();
      saveDay(k); render();
      if (d.mealsDone[m]) { try { navigator.vibrate?.(20); } catch (e) { /* ignore */ } celebrate(() => $(`[data-meal-card="${m}"]`)); toast(`${mealName(m)} validé ✓`); }
    },
    validate: () => openValidate(UI.date),
    reopen: () => { const d = S.days[UI.date]; if (!d) return; delete d.validated; saveDay(UI.date); render(); toast('Journée rouverte'); },
    'edit-entry': b => {
      if (isLocked(UI.date)) { toast('Journée validée : touche « Rouvrir » pour modifier'); return; }
      const e = S.days[UI.date]?.entries.find(x => x.id === b.dataset.id); if (!e) return;
      if (mealDone(UI.date, e.meal)) { toast(`${mealName(e.meal)} validé : décoche-le pour modifier`); return; }
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
      Store.put('profile', S.profile); Store.put('weights', S.weights); Store.put('theme', S.theme); // la couleur par défaut (jaune) est figée pour ce compte
      try { navigator.storage?.persist?.(); } catch (e) { /* ignore */ }
      UI.tab = 'journal'; render(); $('#scroller')?.scrollTo(0, 0);
    },
    'save-profile': () => {
      const p = readProfileForm($('#pform')); delete p.weight;
      if (!profileValid(p)) { toast('Vérifie les valeurs du profil'); return; }
      S.profile = { ...S.profile, ...p }; Store.put('profile', S.profile); render(); toast(`Profil enregistré · objectif ${r0(goals().kcal)} kcal`);
    },
    'tdee-src': b => { S.profile.tdeeSource = b.dataset.v; Store.put('profile', S.profile); render(); toast(`Objectif : ${r0(goals().kcal)} kcal`); },
    'goal-mode': b => { S.profile.goalMode = b.dataset.v; Store.put('profile', S.profile); render(); },
    'save-manual': () => {
      const k = num($('#mk').value), p = num($('#mp').value), c = num($('#mc').value);
      if (!(k >= 800 && k <= 6000) || !(p >= 20 && p <= 400) || (c != null && !(c >= 0 && c <= 900))) { toast('Valeurs hors limites'); return; }
      S.profile.kcalGoal = k; S.profile.proteinGoal = p; S.profile.carbGoal = c || null; Store.put('profile', S.profile); render(); toast('Objectifs enregistrés');
    },
    export: () => exportData(),
    reset: async () => {
      if (!confirm('Effacer définitivement toutes tes données (journal, pesées, aliments) ?')) return;
      if (!confirm('Dernière confirmation : cette action est irréversible.')) return;
      await Store.clear(); await loadState(); UI.tab = 'journal'; UI.date = today(); render();
    },
    install: async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice.catch(() => {}); installPrompt = null; render(); },
  };
  Object.assign(actions, Mu.actions, Bo.actions, Nu.actions, So.actions, Wc.actions, { 'quality-info': () => Nu.qualityInfo(), 'plan-day': () => Nu.openPlanner(UI.date) });

  document.addEventListener('click', e => {
    if (e.target.matches?.('input[type=date]')) { try { e.target.showPicker?.(); } catch (err) { /* ignore */ } }
    const prov = e.target.closest('#view [data-ai-prov]');
    if (prov) { saveAIKey($('#ai-settings')); S.ai.provider = prov.dataset.aiProv; Store.put('ai', S.ai); render(); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) { UI.tab = tab.dataset.tab; if (UI.tab === 'progress') UI.anchor = today(); render(); $('#scroller')?.scrollTo(0, 0); return; }
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
  document.addEventListener('input', e => { const t = e.target.closest('[data-input="theme"]'); if (t) applyTheme(t.value); });
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-input]'); if (!t) return;
    if (t.dataset.input === 'date' && t.value) { UI.date = t.value; render(); }
    if (t.dataset.input === 'import' && t.files[0]) importData(t.files[0]);
    if (t.dataset.input === 'theme') setTheme(t.value);
    if (t.dataset.input === 'photo' && t.files[0]) { handlePhoto(t.files[0]); t.value = ''; }
    if (t.dataset.input === 'avatar' && t.files[0]) { handlePhoto(t.files[0], 'avatar'); t.value = ''; }
  });

  // pas de zoom au pincement (iOS ignore user-scalable=no) ; le recadrage photo garde son propre pincement (événements pointer)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 && !e.target.closest('.ph-box')) e.preventDefault(); }, { passive: false });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!stack.length) { if (UI.tab === 'progress') { drawChart(); drawProjection(); } if (UI.tab === 'journal') drawMini(); if (UI.tab === 'muscu') Mu.afterRender(); } }, 150); });
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
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloading) return;
        reloading = true;
        if (!stack.length) location.reload();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(() => {});
    }
  })();
})();
