/* Kalo — qualité nutritionnelle : fibres, sel, végétaux, produits laitiers + planificateur « compléter ma journée ».
   Repères : fibres ≥ 30 g/j (Anses), sel ≤ 6 g/j, 5 portions de 80 g de fruits & légumes, 2 produits laitiers/j (PNNS 2019).
   Valeurs génériques : moyennes proches de la table Ciqual (Anses, Licence Ouverte), arrondies. */
window.KaloNutriInit = function (K) {
  const { openDetail } = K;
  const { $, esc, r0, r1, uid, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, goals, dayTotals, getDay, saveDay, isLocked, guessMeal, mealName, MEALS, progColor, celebrate, today } = K;
  const T = { fib: 30, salt: 6, veg: 400, vegPortion: 80, dairy: 2 };

  /* [fibres g, sel g, % fruits/légumes, portion laitière en g (0 = non)] pour 100 g */
  const Q = {
    'Blanc de poulet cru': [0, .17, 0, 0], 'Blanc de poulet cuit (grillé)': [0, .2, 0, 0], 'Cuisse de poulet rôtie sans peau': [0, .25, 0, 0], 'Escalope de dinde crue': [0, .15, 0, 0],
    'Steak haché 5 % MG cru': [0, .18, 0, 0], 'Steak haché 5 % MG cuit': [0, .22, 0, 0], 'Steak haché 15 % MG cru': [0, .17, 0, 0], 'Bœuf (rumsteck) grillé': [0, .15, 0, 0],
    'Filet mignon de porc cuit': [0, .2, 0, 0], 'Jambon blanc découenné': [0, 1.9, 0, 0], 'Jambon cru': [0, 5, 0, 0], 'Lardons': [0, 2.3, 0, 0],
    'Saumon cru': [0, .12, 0, 0], 'Saumon cuit': [0, .15, 0, 0], 'Saumon fumé': [0, 3, 0, 0], 'Thon au naturel (boîte, égoutté)': [0, .8, 0, 0],
    'Cabillaud cuit': [0, .3, 0, 0], 'Colin / lieu cuit': [0, .3, 0, 0], 'Crevettes cuites décortiquées': [0, 1.5, 0, 0], "Sardines à l'huile égouttées": [0, .8, 0, 0],
    'Maquereau cuit': [0, .25, 0, 0], 'Œuf entier': [0, .36, 0, 0], "Blanc d'œuf": [0, .45, 0, 0], 'Tofu nature': [.5, .02, 0, 0],
    'Lait demi-écrémé': [0, .1, 0, 150], 'Lait écrémé': [0, .1, 0, 150], 'Lait entier': [0, .1, 0, 150], 'Yaourt nature': [0, .13, 0, 125],
    'Skyr nature': [0, .12, 0, 125], 'Fromage blanc 0 %': [0, .1, 0, 100], 'Fromage blanc 3 %': [0, .1, 0, 100], 'Emmental': [0, .6, 0, 30],
    'Comté': [0, .8, 0, 30], 'Camembert': [0, 1.6, 0, 30], 'Mozzarella': [0, .5, 0, 30], 'Feta': [0, 2.7, 0, 30], 'Parmesan': [0, 1.6, 0, 30],
    'Fromage de chèvre (bûche)': [0, 1.4, 0, 30], 'Beurre': [0, .03, 0, 0], 'Crème fraîche 30 %': [0, .05, 0, 0], 'Crème légère 15 %': [0, .08, 0, 0],
    'Riz blanc cuit': [.4, 0, 0, 0], 'Riz blanc cru': [1.4, 0, 0, 0], 'Riz complet cuit': [1.6, 0, 0, 0], 'Pâtes cuites': [1.8, 0, 0, 0], 'Pâtes crues': [3, 0, 0, 0],
    'Pâtes complètes cuites': [3.5, 0, 0, 0], 'Semoule / couscous cuit': [1.4, 0, 0, 0], 'Quinoa cuit': [2.8, 0, 0, 0], "Pomme de terre cuite à l'eau": [1.6, .02, 0, 0],
    'Patate douce cuite': [2.5, .1, 0, 0], 'Frites': [3.5, .6, 0, 0], 'Lentilles cuites': [4.5, .02, 50, 0], 'Pois chiches cuits': [5, .02, 50, 0], 'Haricots rouges cuits': [6, .02, 50, 0], /* légumineuses : groupe à part au PNNS, comptées pour ½ */
    'Pain baguette': [2.7, 1.3, 0, 0], 'Pain complet': [6.5, 1.2, 0, 0], 'Pain de mie': [3, 1.1, 0, 0], "Flocons d'avoine": [10, .01, 0, 0], 'Muesli': [7, .1, 0, 0],
    'Corn flakes': [3, 1.4, 0, 0], 'Biscotte': [4, 1.2, 0, 0], 'Galette de riz soufflé': [3.5, .4, 0, 0],
    'Pomme': [2.4, 0, 100, 0], 'Banane': [2.6, 0, 100, 0], 'Orange': [2.2, 0, 100, 0], 'Clémentine': [1.7, 0, 100, 0], 'Kiwi': [3, 0, 100, 0], 'Fraises': [2, 0, 100, 0],
    'Framboises': [6.5, 0, 100, 0], 'Myrtilles': [2.4, 0, 100, 0], 'Raisin': [1, 0, 100, 0], 'Poire': [3, 0, 100, 0], 'Pêche / nectarine': [1.5, 0, 100, 0],
    'Ananas': [1.4, 0, 100, 0], 'Mangue': [1.8, 0, 100, 0], 'Avocat': [6.7, .02, 100, 0], 'Compote sans sucres ajoutés': [1.8, 0, 100, 0], 'Dattes sèches': [7, 0, 0, 0],
    'Brocoli cuit': [2.6, .03, 100, 0], 'Haricots verts cuits': [3, .02, 100, 0], 'Courgette cuite': [1.2, .01, 100, 0], 'Carotte crue': [2.7, .08, 100, 0], 'Tomate': [1.2, .01, 100, 0],
    'Concombre': [.5, .01, 100, 0], 'Salade verte': [1.3, .02, 100, 0], 'Épinards cuits': [2.5, .2, 100, 0], 'Champignons de Paris': [2.5, .02, 100, 0], 'Poivron': [1.9, 0, 100, 0],
    'Oignon': [1.7, .01, 100, 0], 'Petits pois cuits': [5.5, .01, 100, 0], 'Maïs doux (boîte)': [2.5, .5, 0, 0], 'Chou-fleur cuit': [2.3, .03, 100, 0], 'Soupe de légumes maison': [1, .6, 70, 0],
    'Huile (olive, colza, tournesol)': [0, 0, 0, 0], 'Amandes': [12.5, .01, 0, 0], 'Noix': [6.5, .01, 0, 0], 'Noix de cajou': [3.3, .03, 0, 0], 'Cacahuètes': [8, .5, 0, 0],
    'Beurre de cacahuète': [6, .4, 0, 0], 'Mayonnaise': [0, 1.3, 0, 0], 'Ketchup': [.9, 2, 0, 0], 'Vinaigrette': [.2, 2.5, 0, 0], 'Chocolat noir 70 %': [11, .02, 0, 0],
    'Chocolat au lait': [2.5, .2, 0, 0], 'Pâte à tartiner chocolat-noisette': [3.5, .1, 0, 0], 'Miel': [0, 0, 0, 0], 'Sucre': [0, 0, 0, 0], 'Confiture': [1, 0, 0, 0],
    'Croissant': [2, 1, 0, 0], 'Pain au chocolat': [2.5, .9, 0, 0], 'Chips': [4.5, 1.3, 0, 0], 'Barre protéinée (moyenne)': [5, .5, 0, 0], 'Whey protéine (poudre)': [.5, .4, 0, 0],
    'Pizza margherita': [2, 1.3, 10, 0], 'Burger type fast-food': [1.5, 1.3, 5, 0], 'Makis / sushis': [.8, 1.2, 0, 0], 'Lasagnes bolognaise': [1.2, .8, 10, 0],
    'Hachis parmentier': [1.2, .7, 0, 0], 'Croque-monsieur': [1.5, 1.8, 0, 0], 'Quiche lorraine': [1, 1, 0, 0], "Jus d'orange": [.2, 0, 0, 0], 'Soda sucré type cola': [0, 0, 0, 0],
    'Soda zéro': [0, .02, 0, 0], 'Bière blonde 5 %': [0, 0, 0, 0], 'Vin rouge': [0, 0, 0, 0], 'Café noir': [0, 0, 0, 0], 'Boisson amande sans sucre': [.4, .1, 0, 0],
  };
  /* Complète per100 d'un aliment générique avec ses données qualité */
  function enrichGen(f) {
    const q = Q[f.name]; if (!q || !f.per100) return f;
    f.per100 = { ...f.per100, fib: q[0], salt: q[1], veg: q[2], dairy: q[3] };
    return f;
  }
  /* Open Food Facts : fibres, sel, % fruits/légumes/légumineuses estimé depuis les ingrédients, type de produit laitier */
  function offQuality(p, n) {
    const tags = (p.categories_tags || []).join(' ');
    const fib = n.fiber_100g != null ? Math.max(0, +n.fiber_100g || 0) : null;
    const salt = n.salt_100g != null ? Math.max(0, +n.salt_100g || 0) : n.sodium_100g != null ? Math.max(0, +n.sodium_100g * 2.5) : null;
    let veg = n['fruits-vegetables-legumes-estimate-from-ingredients_100g'] ?? n['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? n['fruits-vegetables-legumes_100g'] ?? n['fruits-vegetables-nuts_100g'] ?? null;
    veg = veg == null ? null : Math.min(100, Math.max(0, +veg || 0));
    if (/en:(fruit-juices|juices-and-nectars|nectars|jams|fruit-preserves|sweet-spreads|sodas|fruit-based-beverages|plant-based-beverages|dried-fruits|nuts)\b/.test(tags)) veg = 0; // jus, confitures, fruits secs : hors 5 par jour
    let dairy = 0;
    if (!/en:(plant-based|dairy-substitutes|desserts|dairy-desserts|ice-creams|creams|butters)\b/.test(tags)) {
      if (/en:cheeses\b/.test(tags) && !/en:(fromages-blancs|fresh-cheeses|cottage-cheeses|petits-suisses)\b/.test(tags)) dairy = 30;
      else if (/en:(yogurts|skyrs|fromages-blancs|fermented-milk-products|petits-suisses|fresh-cheeses|cottage-cheeses|quarks)\b/.test(tags)) dairy = 125;
      else if (/en:milks\b/.test(tags)) dairy = 150;
    }
    return { fib, salt, veg, dairy };
  }

  /* ---------- Bilan qualité d'une journée ---------- */
  const hasQ = p => p && p.fib != null;
  function dayQuality(k) {
    const r = { fib: 0, salt: 0, vegG: 0, dairyP: 0, kcal: 0, kcalKnown: 0, saltKnown: 0, missing: [] };
    for (const e of S.days[k]?.entries || []) {
      const kc = e.kcal || 0; r.kcal += kc;
      let p = e.per100;
      if (e.src === 'gen' && !hasQ(p)) { const q = Q[e.name]; if (q) p = { ...p, fib: q[0], salt: q[1], veg: q[2], dairy: q[3] }; }
      if (!p || e.grams == null) continue;
      const g = e.grams, k100 = g / 100;
      if (p.fib != null) { r.fib += p.fib * k100; r.kcalKnown += kc; } else if (e.src === 'off' && e.code && !('fib' in p)) r.missing.push(e.code);
      if (p.salt != null) { r.salt += p.salt * k100; r.saltKnown += kc; }
      if (p.veg) r.vegG += g * p.veg / 100;
      if (p.dairy) r.dairyP += g / p.dairy;
    }
    r.cover = r.kcal > 0 ? r.kcalKnown / r.kcal : 1;
    r.vegP = r.vegG / T.vegPortion;
    return r;
  }

  /* Rattrapage : les produits OFF déjà saisis avant la v3.7 n'ont pas fibres/sel → on va les chercher une fois */
  const asked = new Set();
  let backfillT = 0;
  async function backfill(codes) {
    const todo = [...new Set(codes)].filter(c => !asked.has(c)).slice(0, 8);
    if (!todo.length || !navigator.onLine) return;
    todo.forEach(c => asked.add(c));
    let changed = false;
    await Promise.all(todo.map(async code => {
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=nutriments,categories_tags`, { headers: { Accept: 'application/json' } });
        if (!r.ok) return; const j = await r.json(); if (j.status !== 1 || !j.product) return;
        const q = offQuality(j.product, j.product.nutriments || {});
        for (const [dk, d] of Object.entries(S.days)) {
          let ch = false;
          for (const e of d.entries || []) if (e.src === 'off' && e.code === code && e.per100 && !('fib' in e.per100)) { e.per100 = { ...e.per100, ...q }; ch = true; }
          if (ch) { saveDay(dk); changed = true; }
        }
        for (const list of [S.recents, S.favs?.flatMap(f => f.items) || []]) for (const x of list) if (x.src === 'off' && x.code === code && x.per100 && !('fib' in x.per100)) x.per100 = { ...x.per100, ...q };
        if (S.off?.[code]?.per100) S.off[code].per100 = { ...S.off[code].per100, ...q };
      } catch (err) { /* hors ligne ou OFF indisponible : on réessaiera à la prochaine session */ }
    }));
    if (changed) { Store.put('recents', S.recents); clearTimeout(backfillT); backfillT = setTimeout(render, 50); }
  }

  /* ---------- Carte « Qualité du jour » ---------- */
  const leaf = on => `<svg viewBox="0 0 24 24" class="pip ${on}"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zm0 0c3-4 6-7 10-10"/></svg>`;
  const cup = on => `<svg viewBox="0 0 24 24" class="pip ${on}"><path d="M7 4h10l-1.4 15.2a2 2 0 0 1-2 1.8h-3.2a2 2 0 0 1-2-1.8z"/><path d="M7.4 9h9.2"/></svg>`;
  const pips = (n, max, icon) => Array.from({ length: max }, (_, i) => icon(n >= i + 1 ? 'on' : n > i + 0.25 ? 'half' : '')).join('');
  function saltColor(v) { return v <= T.salt * 0.8 ? '#2EE68A' : v <= T.salt ? '#FFB020' : '#FF4D4F'; }
  const scoreOf = q => Math.round(Math.min(1, q.fib / T.fib) * 30 + Math.min(1, q.vegP / 5) * 35 + Math.min(1, q.dairyP / T.dairy) * 15 + (q.salt <= T.salt ? 20 : Math.max(0, 20 - (q.salt - T.salt) * 8)));
  /* Idées d'aliments pour monter le score : chaque aliment est testé sur la journée, classé par points gagnés et adapté aux calories restantes */
  let lastQSug = [];
  function qualitySuggestions(k, q) {
    const remK = goals().kcal - dayTotals(k).kcal, base = scoreOf(q), meal = guessMeal();
    const out = [];
    for (const c of CANDS) {
      const it = itemOf(c); if (!it) continue;
      if (isSnackMeal(meal) && !SNACK.has(it.name)) continue;
      const cap = Math.max(90, remK + 40); if (it.kcal > cap) continue;
      const nq = { ...q, fib: q.fib + it.fib, salt: q.salt + it.salt, vegP: (q.vegG + it.veg) / T.vegPortion, dairyP: q.dairyP + it.dairy };
      const gain = scoreOf(nq) - base; if (gain < 2) continue;
      const why = [it.veg >= 40 ? `+${r1(it.veg / T.vegPortion).replace('.', ',')} F&L` : '', it.fib >= 1.5 ? `+${r0(it.fib)} g fibres` : '', it.dairy >= 0.5 ? `+${r1(it.dairy).replace('.', ',')} laitier` : '', it.p >= 8 ? `+${r0(it.p)} g prot.` : ''].filter(Boolean).slice(0, 2).join(' · ');
      out.push({ it, gain, why, rank: gain / Math.max(40, it.kcal) * 100 + (it.p >= 10 ? 1.5 : 0) });
    }
    out.sort((a, b) => b.rank - a.rank);
    const pick = [], roles = {};
    for (const o of out) { if (pick.length >= 5) break; if ((roles[o.it.role] = (roles[o.it.role] || 0) + 1) > 2) continue; pick.push(o); } // variété : 2 max par famille
    return pick.sort((a, b) => b.gain - a.gain);
  }
  function qualityCard(k) {
    const q = dayQuality(k);
    if (q.missing.length) setTimeout(() => backfill(q.missing), 400);
    const empty = !(S.days[k]?.entries || []).length;
    const fibPct = Math.min(100, q.fib / T.fib * 100), saltPct = Math.min(100, q.salt / (T.salt * 1.5) * 100);
    const partial = q.kcal > 0 && q.cover < 0.85;
    const canPlan = !isLocked(k) && k === today() && !empty && goals().kcal - dayTotals(k).kcal > 120;
    const score = empty ? null : scoreOf(q);
    const live = !isLocked(k) && k === today();
    const sug = live && score != null && score < 100 ? qualitySuggestions(k, q) : [];
    lastQSug = sug;
    const saltTip = live && q.salt > T.salt * 0.85 ? `<p class="coach-tip small">🧂 Sel ${q.salt > T.salt ? 'dépassé' : 'presque au max'} : au prochain repas, évite charcuterie, fromage, pain et plats préparés ; les végétaux riches en potassium compensent.</p>` : '';
    const open = !!UI.qualOpen, n = sug.length + (saltTip ? 1 : 0), best = sug.reduce((m, x) => Math.max(m, x.gain), 0);
    return `<section class="card quality ${open ? 'open' : ''}">
      <div class="row between"><div class="card-title"><svg viewBox="0 0 24 24" class="ico"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zm0 0c3-4 6-7 10-10"/></svg>Qualité du jour<button class="q-info-btn" data-action="quality-info" aria-label="Comment est calculé ce score">i</button></div>${score != null ? `<span class="q-score" style="--qc:${progColor(score / 100)}"><b class="num">${score}</b>/100</span>` : ''}</div>
      <div class="q-grid">
        <div class="q-item"><div class="q-row"><span>Fibres</span><b class="num">${r0(q.fib)} / ${T.fib} g</b></div><div class="bar"><div style="width:${fibPct}%;background:${progColor(q.fib / T.fib)};box-shadow:0 0 10px ${progColor(q.fib / T.fib)};border-radius:8px"></div></div></div>
        <div class="q-item"><div class="q-row"><span>Sel</span><b class="num" style="color:${q.salt > T.salt ? '#FF6B6B' : 'inherit'}">${r1(q.salt)} / ${T.salt} g max</b></div><div class="bar salt"><i class="lim" style="left:${100 / 1.5}%"></i><div style="width:${saltPct}%;background:${saltColor(q.salt)};border-radius:8px"></div></div></div>
        <div class="q-item"><div class="q-row"><span>Fruits & légumes</span><b class="num">${r1(Math.min(9, q.vegP)).replace('.', ',')} / 5</b></div><div class="pips veg">${pips(q.vegP, 5, leaf)}</div></div>
        <div class="q-item"><div class="q-row"><span>Laitiers (calcium)</span><b class="num">${r1(q.dairyP).replace('.', ',')} / ${T.dairy}</b></div><div class="pips dairy">${pips(q.dairyP, T.dairy, cup)}</div></div>
      </div>
      ${partial ? `<p class="q-note">Données partielles : ${r0((1 - q.cover) * 100)} % des calories viennent d'aliments sans fibres renseignées (ajout rapide, étiquette incomplète).</p>` : ''}
      ${n ? `<button class="coach-more" data-action="quality-toggle" aria-expanded="${open}"><span>${sug.length ? `${sug.length} idée${sug.length > 1 ? 's' : ''} · jusqu'à +${best} pts` : 'Conseil sel'}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="coach-drop"><div class="coach-drop-in">
        ${saltTip}
        ${sug.length ? `<div class="coach-sug">${sug.map((x, i) => `<button class="coach-food q-food" data-action="quality-sug" data-i="${i}"><b>${esc(x.it.lab)}${x.it.lab.toLowerCase().includes(x.it.name.split(/[ (]/)[0].toLowerCase().slice(0, 5)) ? '' : ' · ' + esc(x.it.name.replace(/ \(.*\)$/, '').toLowerCase())}</b><span class="num">${x.why} · ${r0(x.it.kcal)} kcal</span><em class="q-gain num">+${x.gain}</em></button>`).join('')}</div>` : ''}
      </div></div>` : ''}
      ${canPlan ? `<button class="btn block q-plan" data-action="plan-day">✨ Compléter ma journée intelligemment</button>` : ''}
    </section>`;
  }

  function qualityInfo() {
    const sh = makeSheet('Qualité du jour');
    sh.setBody(`<section class="card stack q-info">
      <p><b>Fibres ≥ 30 g.</b> Repère Anses pour l'adulte. Elles calent, régulent la glycémie et le transit. Sources : légumes, fruits, légumineuses, céréales complètes, oléagineux.</p>
      <p><b>Sel ≤ 6 g.</b> Les plats préparés, la charcuterie, le fromage et le pain en apportent l'essentiel. Une journée salée se rééquilibre avec des végétaux riches en potassium (légumes, fruits, légumineuses).</p>
      <p><b>5 fruits & légumes</b> (portions de 80 g). C'est le meilleur indicateur des vitamines C et B9, du potassium et du magnésium, que les étiquettes n'indiquent presque jamais. Pour les produits emballés, Kalo utilise l'estimation d'Open Food Facts de la part de fruits, légumes et légumineuses dans les ingrédients. Jus, confitures et fruits secs ne comptent pas.</p>
      <p><b>2 produits laitiers</b> (PNNS 2019) : un yaourt ou skyr de 125 g, 100 g de fromage blanc, 150 ml de lait ou 30 g de fromage = 1 portion. Principale source de calcium (besoin ≈ 950 mg/j).</p>
      <p><b>Score /100</b> : fibres 30 pts, fruits & légumes 35, laitiers 15, sel 20.</p>
      <p class="muted small">Valeurs génériques proches de la table Ciqual (Anses). Produits scannés : Open Food Facts. Ces repères ne remplacent pas l'avis d'un professionnel de santé.</p></section>`);
    sh.setFoot('<button class="btn grow" data-a="ok">Compris</button>');
    sh.foot.onclick = () => closeSheet(1);
    openSheet(sh.el);
  }

  /* ---------- Planificateur : compléter la journée en respectant les macros restantes ---------- */
  // [nom générique, grammes, libellé portion, rôle]
  const CANDS = [
    ['Fromage blanc 0 %', 150, '150 g', 'dairy'], ['Skyr nature', 150, '1 pot 150 g', 'dairy'], ['Yaourt nature', 125, '1 pot', 'dairy'], ['Lait demi-écrémé', 250, '1 bol 250 ml', 'dairy'], ['Emmental', 30, '30 g', 'dairy'],
    ['Blanc de poulet cuit (grillé)', 120, '1 filet', 'prot'], ['Thon au naturel (boîte, égoutté)', 100, '1 petite boîte', 'prot'], ['Œuf entier', 100, '2 œufs', 'prot'], ['Crevettes cuites décortiquées', 120, '120 g', 'prot'],
    ['Cabillaud cuit', 150, '1 pavé', 'prot'], ['Tofu nature', 120, '120 g', 'prot'], ['Jambon blanc découenné', 80, '2 tranches', 'prot'], ['Saumon cuit', 120, '1 pavé', 'prot'],
    ['Lentilles cuites', 150, '1 portion', 'leg'], ['Pois chiches cuits', 120, '1 portion', 'leg'], ['Haricots rouges cuits', 150, '1 portion', 'leg'],
    ['Pomme', 150, '1 pomme', 'fruit'], ['Banane', 120, '1 banane', 'fruit'], ['Orange', 150, '1 orange', 'fruit'], ['Kiwi', 150, '2 kiwis', 'fruit'], ['Fraises', 150, '1 barquette 150 g', 'fruit'],
    ['Framboises', 125, '1 barquette', 'fruit'], ['Poire', 150, '1 poire', 'fruit'], ['Clémentine', 120, '2 clémentines', 'fruit'], ['Myrtilles', 100, '100 g', 'fruit'],
    ['Brocoli cuit', 200, '200 g', 'veg'], ['Haricots verts cuits', 200, '200 g', 'veg'], ['Carotte crue', 120, '1 grosse carotte', 'veg'], ['Tomate', 150, '1 tomate', 'veg'], ['Concombre', 150, '½ concombre', 'veg'],
    ['Salade verte', 80, '1 bol', 'veg'], ['Épinards cuits', 200, '200 g', 'veg'], ['Courgette cuite', 200, '200 g', 'veg'], ['Soupe de légumes maison', 300, '1 bol 300 ml', 'veg'], ['Chou-fleur cuit', 200, '200 g', 'veg'], ['Petits pois cuits', 150, '150 g', 'veg'],
    ['Amandes', 20, '1 poignée (20 g)', 'nut'], ['Noix', 20, '1 poignée (20 g)', 'nut'], ["Flocons d'avoine", 40, '40 g', 'starch'], ['Pain complet', 60, '2 tranches', 'starch'],
    ['Patate douce cuite', 200, '200 g', 'starch'], ['Riz complet cuit', 150, '150 g', 'starch'], ['Quinoa cuit', 150, '150 g', 'starch'], ["Pomme de terre cuite à l'eau", 200, '200 g', 'starch'],
  ];
  const SNACK = new Set(['Fromage blanc 0 %', 'Skyr nature', 'Yaourt nature', 'Lait demi-écrémé', 'Emmental', 'Œuf entier', 'Jambon blanc découenné', 'Pomme', 'Banane', 'Orange', 'Kiwi', 'Fraises', 'Framboises', 'Poire', 'Clémentine', 'Myrtilles', 'Carotte crue', 'Tomate', 'Concombre', 'Amandes', 'Noix', "Flocons d'avoine", 'Pain complet']);
  const isSnackMeal = m => m === 'snack' || m === 'breakfast';
  function genFood(name) { return (K.GEN || []).find(f => f.name === name); }
  function itemOf([name, g, lab, role]) {
    const f = genFood(name); if (!f) return null;
    const q = Q[name] || [0, 0, 0, 0], p = f.per100, k = g / 100;
    return { f, name, g, lab, role, kcal: p.kcal * k, p: p.p * k, c: p.c * k, fat: p.f * k, fib: q[0] * k, salt: q[1] * k, veg: g * q[2] / 100, dairy: q[3] ? g / q[3] : 0 };
  }
  function plan(k, meal) {
    const g = goals(), t = dayTotals(k), q = dayQuality(k);
    const R = { k: g.kcal - t.kcal, p: Math.max(0, g.protein - t.p), c: g.carbs != null ? g.carbs - t.c : null, f: g.fat != null ? g.fat - t.f : null,
      fib: Math.max(0, T.fib - q.fib), veg: Math.max(0, T.veg - q.vegG), dairy: Math.max(0, T.dairy - q.dairyP) };
    if (R.k < 120) return { R, q, plans: [] };
    const items = CANDS.map(itemOf).filter(Boolean).filter(it => !isSnackMeal(meal) || SNACK.has(it.name));
    const recentNames = new Set((S.recents || []).map(r => r.name));
    function score(set) {
      const s = { kcal: 0, p: 0, c: 0, fat: 0, fib: 0, veg: 0, dairy: 0, salt: 0 };
      for (const it of set) for (const key in s) s[key] += it[key];
      let pen = 0;
      const over = s.kcal - R.k; if (over > 0) pen += Math.pow(over / 40, 2) * 3; // dépasser le budget kcal : très pénalisé
      pen += Math.max(0, R.k - s.kcal) / 400; // laisser trop de calories inutilisées : léger
      const pg = Math.max(0, R.p - s.p); pen += Math.pow(pg / 6, 1.6);
      pen += Math.pow(Math.max(0, R.fib - s.fib) / 4, 1.4) * 0.9;
      pen += Math.max(0, R.veg - s.veg) / T.vegPortion * 1.4;
      pen += Math.max(0, R.dairy - s.dairy) * 1.6;
      if (R.c != null && s.c > Math.max(0, R.c)) pen += Math.pow((s.c - Math.max(0, R.c)) / 12, 2);
      if (R.f != null && s.fat > Math.max(0, R.f)) pen += Math.pow((s.fat - Math.max(0, R.f)) / 6, 2);
      if (q.salt + s.salt > T.salt) pen += (q.salt + s.salt - T.salt) * 2;
      const roles = set.map(x => x.role); if (new Set(roles).size < roles.length) pen += 1.2; // variété
      pen += set.length * 0.35; // simplicité
      if (!isSnackMeal(meal) && !set.some(x => ['prot', 'leg', 'dairy'].includes(x.role)) && R.p > 10) pen += 1.5; // un repas = une source de protéines
      pen -= set.filter(x => recentNames.has(x.name)).length * 0.25; // préférer ce que tu manges déjà
      return { pen, s };
    }
    const all = [], n = items.length;
    for (let a = 0; a < n; a++) {
      all.push({ set: [items[a]], ...score([items[a]]) });
      for (let b = a + 1; b < n; b++) {
        all.push({ set: [items[a], items[b]], ...score([items[a], items[b]]) });
        for (let c = b + 1; c < n; c++) { const set = [items[a], items[b], items[c]]; all.push({ set, ...score(set) }); }
      }
    }
    all.sort((x, y) => x.pen - y.pen);
    const plans = [], mainRole = c => { const m = c.set.slice().sort((x, y) => y.p - x.p)[0]; return m.p >= 5 ? m.role : 'none'; };
    for (const pass of [true, false]) for (const cand of all) { // 1er passage : une source de protéines différente par proposition
      if (plans.length >= 3) break;
      if (plans.includes(cand)) continue;
      const names = cand.set.map(x => x.name);
      if (plans.some(pl => pl.set.filter(x => names.includes(x.name)).length >= Math.min(2, names.length))) continue; // propositions vraiment différentes
      if (pass && plans.some(pl => mainRole(pl) === mainRole(cand))) continue;
      if (cand.pen > (plans[0]?.pen ?? cand.pen) + 6) break;
      plans.push(cand);
    }
    return { R, q, plans };
  }
  function gains(pl, R) {
    const s = pl.s, out = [];
    if (s.p >= 3) out.push(`<span class="g-p">+${r0(s.p)} g prot.</span>`);
    if (s.fib >= 1) out.push(`<span class="g-fib">+${r0(s.fib)} g fibres</span>`);
    if (s.veg >= 40) out.push(`<span class="g-veg">+${r1(s.veg / T.vegPortion).replace('.', ',')}${s.veg / T.vegPortion >= 1.95 ? ' fruits/légumes' : ' fruit/légume'}</span>`);
    if (s.dairy >= 0.5) out.push(`<span class="g-dairy">+${r1(s.dairy).replace('.', ',')} laitier</span>`);
    return out.join('');
  }
  function openPlanner(k, mealSel) {
    const sh = makeSheet('Compléter ma journée');
    let meal = mealSel || guessMeal();
    const draw = () => {
    const { R, q, plans } = plan(k, meal);
    const gaps = [R.p > 3 ? `<b>${r0(R.p)} g</b> de protéines` : '', R.fib > 2 ? `<b>${r0(R.fib)} g</b> de fibres` : '', R.veg > 40 ? `<b>${r1(R.veg / T.vegPortion).replace('.', ',')}</b> portion${R.veg / T.vegPortion >= 2 ? 's' : ''} de fruits/légumes` : '', R.dairy > 0.3 ? `<b>${r1(R.dairy).replace('.', ',')}</b> laitier` : ''].filter(Boolean);
    sh.setBody(`<div class="seg plan-meal">${MEALS.map(([id, nm]) => `<button data-a="meal" data-m="${id}" class="${id === meal ? 'on' : ''}">${esc(nm.replace('Petit-déjeuner', 'Petit-déj'))}</button>`).join('')}</div>
      <section class="card plan-head">
        <p>Il te reste <b class="num">${r0(R.k)} kcal</b>${gaps.length ? ` et il manque ${gaps.join(', ').replace(/, ([^,]*)$/, ' et $1')}` : ''}.</p>
        ${q.salt > T.salt ? `<p class="small" style="color:#FF8A8A">Journée salée (${r1(q.salt)} g) : les propositions misent sur les végétaux riches en potassium et évitent le sel.</p>` : ''}
        <p class="muted small">Calculé parmi ~${r0(CANDS.length ** 3 / 6 / 1000)} 000 combinaisons d'aliments simples, en respectant tes glucides et lipides restants.</p></section>
      ${plans.length ? plans.map((pl, i) => `<section class="card plan ${i === 0 ? 'best' : ''}">
        ${i === 0 ? '<span class="plan-badge">Meilleur choix</span>' : ''}
        <ul>${pl.set.map(it => `<li><b>${esc(it.lab)}</b> ${it.lab.toLowerCase().includes(it.name.split(/[ (]/)[0].toLowerCase().slice(0, 5)) ? '' : esc(it.name.replace(/ \(.*\)$/, '').toLowerCase())}<span class="num">${r0(it.kcal)} kcal</span></li>`).join('')}</ul>
        <div class="plan-gains">${gains(pl, R)}<span class="g-k num">${r0(pl.s.kcal)} kcal</span></div>
        <button class="btn block ${i === 0 ? '' : 'ghost'}" data-a="add" data-i="${i}">Ajouter à « ${esc(mealName(meal))} »</button></section>`).join('')
        : '<div class="empty small">Plus assez de calories pour une proposition utile aujourd\'hui.</div>'}`);
      sh.plans = plans; sh.q = q;
    };
    draw();
    sh.setFoot('<button class="btn plain grow" data-a="close">Fermer</button>');
    const onClick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const plans = sh.plans, q = sh.q;
      if (b.dataset.a === 'close') { closeSheet(1); return; }
      if (b.dataset.a === 'meal') { meal = b.dataset.m; draw(); return; }
      if (b.dataset.a === 'add') {
        const pl = plans[+b.dataset.i]; if (!pl) return;
        const d = getDay(k), now = Date.now();
        pl.set.forEach((it, j) => { const p = { ...it.f.per100, fib: Q[it.name][0], salt: Q[it.name][1], veg: Q[it.name][2], dairy: Q[it.name][3] }, kk = it.g / 100;
          d.entries.push({ id: uid(), meal, src: 'gen', fid: it.f.id, code: '', name: it.f.name, brand: '', per100: p, unit: it.f.unit || null, img: '', ns: '', qtyLabel: '', grams: it.g, count: null, kcal: p.kcal * kk, p: p.p * kk, c: p.c * kk, f: p.f * kk, t: now + j }); });
        saveDay(k); UI.date = k; UI.tab = 'journal';
        const before = dayQuality(k);
        closeSheet(1, () => { render(); toast(`Ajouté · +${r0(pl.s.p)} g prot. · +${r0(pl.s.fib)} g fibres`); if (before.vegP >= 5 && q.vegP < 5) requestAnimationFrame(() => celebrate?.(() => $('#view .card.quality'))); });
      }
    };
    sh.body.addEventListener('click', onClick); sh.foot.addEventListener('click', onClick);
    openSheet(sh.el);
  }

  /* Phrase de coach basée sur la qualité (utilisée par le Coach du jour) */
  function coachLine(k) {
    const q = dayQuality(k), h = new Date().getHours();
    if (!(S.days[k]?.entries || []).length) return '';
    if (q.salt > T.salt) return `Journée salée (<b>${r1(q.salt)} g</b> de sel) : mise sur des légumes et fruits ce soir, riches en potassium.`;
    if (h >= 15 && q.vegP < 2) return `Seulement <b>${r1(q.vegP).replace('.', ',')}</b> portion de fruits/légumes : vitamines C, potassium et magnésium en manque. « Compléter ma journée » te propose de quoi rattraper.`;
    if (h >= 17 && q.fib < T.fib * 0.6) return `Fibres à <b>${r0(q.fib)} g</b> sur 30 : légumineuses, légumes ou fruits rouges au prochain repas.`;
    return '';
  }

  const actions = {
    'quality-toggle': b => { UI.qualOpen = !UI.qualOpen; const c = b.closest('.quality'); c?.classList.toggle('open', UI.qualOpen); b.setAttribute('aria-expanded', UI.qualOpen); },
    'quality-sug': b => { const x = lastQSug[+b.dataset.i]; if (x) openDetail(x.it.f, { meal: guessMeal(), date: UI.date, grams: x.it.g }); },
  };
  return { actions, enrichGen, offQuality, dayQuality, qualityCard, qualityInfo, openPlanner, coachLine, T, Q };
};
