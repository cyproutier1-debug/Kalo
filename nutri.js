/* Kalo — qualité nutritionnelle : fibres, sel, végétaux, produits laitiers + planificateur « compléter ma journée ».
   Repères : fibres ≥ 30 g/j (Anses), sel ≤ 6 g/j, 5 portions de 80 g de fruits & légumes, 2 produits laitiers/j (PNNS 2019).
   Valeurs génériques : moyennes proches de la table Ciqual (Anses, Licence Ouverte), arrondies. */
window.KaloNutriInit = function (K) {
  const { openDetail } = K;
  const { $, esc, r0, r1, uid, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, goals, dayTotals, getDay, saveDay, isLocked, guessMeal, mealName, MEALS, progColor, celebrate, today, mealDone } = K;
  const T = { fib: 30, salt: 6, veg: 400, vegPortion: 80, dairy: 2, sug: 50 };

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
  /* Sucres totaux g/100 g (absent = 0). Les sucres du lait/yaourt (lactose) et des fruits/légumes entiers sont retirés au calcul : reste les sucres « libres » (OMS : < 10 % des calories, ≈ 50 g). */
  const SG = {
    'Lait demi-écrémé': 4.8, 'Lait écrémé': 4.8, 'Lait entier': 4.8, 'Yaourt nature': 4.5, 'Skyr nature': 3.5, 'Fromage blanc 0 %': 4, 'Fromage blanc 3 %': 4,
    'Pain baguette': 3, 'Pain complet': 3, 'Pain de mie': 5, "Flocons d'avoine": 1, 'Muesli': 15, 'Corn flakes': 8, 'Biscotte': 5, 'Galette de riz soufflé': .5,
    'Dattes sèches': 65, 'Maïs doux (boîte)': 5, 'Soupe de légumes maison': 3, 'Lentilles cuites': .5, 'Ketchup': 22, 'Mayonnaise': 1.5, 'Vinaigrette': 3,
    'Chocolat noir 70 %': 24, 'Chocolat au lait': 55, 'Pâte à tartiner chocolat-noisette': 56, 'Miel': 80, 'Sucre': 100, 'Confiture': 55, 'Beurre de cacahuète': 8,
    'Croissant': 8, 'Pain au chocolat': 12, 'Chips': .5, 'Barre protéinée (moyenne)': 8, 'Whey protéine (poudre)': 3, 'Pizza margherita': 3, 'Burger type fast-food': 4,
    'Makis / sushis': 3, 'Lasagnes bolognaise': 3, 'Hachis parmentier': 2, 'Croque-monsieur': 3, 'Quiche lorraine': 1.5, "Jus d'orange": 8.5, 'Soda sucré type cola': 10.6,
    'Vin rouge': .5, 'Bière blonde 5 %': .1, 'Crème légère 15 %': 3.5, 'Crème fraîche 30 %': 2.5,
  };
  /* sucres libres pour 100 g d'un aliment : total moins lactose (produits laitiers) ou part de fruits/légumes entiers */
  const freeSug100 = p => { let v = +p?.sug || 0; if (!v) return 0; if (p.dairy) v = Math.max(0, v - 5); else if (p.veg) v *= 1 - Math.min(100, p.veg) / 100; return v; };
  /* Étiquettes rouges : trop sucré (> 22,5 g/100 g, boissons > 10 g/100 ml) ou trop salé (> 1,5 g/100 g), seuils « rouge » des feux tricolores britanniques */
  const DRINK = /(?<!\p{L})(soda|cola|coca|jus|boisson|limonade|sirop|nectar|th[ée] glac|smoothie|ice tea|energy|redbull|red bull|monster)(?!\p{L})/iu;
  function flags(p, name) {
    if (!p) return { sweet: false, salty: false };
    const sug = p.sug != null ? p.sug : (SG[name] || 0), salt = p.salt != null ? p.salt : (Q[name]?.[1] || 0);
    const fs = freeSug100({ sug, veg: p.veg ?? Q[name]?.[2], dairy: p.dairy ?? Q[name]?.[3] });
    return { sweet: fs > (DRINK.test(name || '') ? 10 : 22.5), salty: salt > 1.5, fs, salt };
  }
  /* Complète per100 d'un aliment générique avec ses données qualité */
  function enrichGen(f) {
    const q = Q[f.name]; if (!q || !f.per100) return f;
    f.per100 = { ...f.per100, fib: q[0], salt: q[1], veg: q[2], dairy: q[3], sug: SG[f.name] || 0 };
    return f;
  }
  /* Aliments sans fibres par nature (produits animaux, boissons, matières grasses, sucres purs) : 0 g sûr même si l'étiquette ne le dit pas.
     Les fibres ne sont PAS obligatoires sur l'étiquette nutritionnelle européenne : beaucoup de produits ne les indiquent pas. */
  const ZERO_NAME = /(?<!\p{L})(whey|isolate?|cas[ée]ine|prot[ée]ine en poudre|poulet|dinde|b[œo]euf|veau|steak|porc|jambon|bacon|lardons?|saucisse|merguez|chorizo|saumon|thon|cabillaud|colin|lieu|crevettes?|poissons?|sardines?|maquereau|truite|(?:œ|oe|o)ufs?|blanc d.?(?:œ|oe|o)euf|lait|skyr|yaourt|yogourt|fromage|emmental|comt[ée]|mozzarella|feta|parmesan|camembert|ch[èe]vre|cr[èe]me fra[iî]che|huile|beurre|soda|cola|limonade|eau|caf[ée]|th[ée]|bi[èe]re|vin|sucre|miel|sirop)(?!\p{L})/iu;
  const NOT_ZERO = /(?<!\p{L})(riz|p[âa]tes|pain|tacos|burger|sandwich|wrap|pizza|salade|l[ée]gumes?|frites|pan[ée]|panure|nuggets?|tenders?|cordon|quiche|tarte|gratin|curry|couscous|chili|bowl|plat|lasagne|hachis|cr[êe]pe|galette|g[âa]teau|biscuit|c[ée]r[ée]ales|muesli|granola|barre|fruits?|compote|smoothie|soupe|velout[ée]|chips|fruits? rouges|muffin|brioche|viennoiserie)(?!\p{L})/iu;
  const zeroByName = n => ZERO_NAME.test(n || '') && !NOT_ZERO.test(n || '');
  const ZERO_TAGS = /en:(meats|poultries|fishes|seafood|eggs|milks|cheeses|yogurts|fromages-blancs|skyrs|fermented-milk-products|dairies|fats|vegetable-oils|butters|beverages|waters|sodas|coffees|teas|alcoholic-beverages|sugars|honeys|syrups|protein-powders|whey-proteins|dietary-supplements)\b/;
  const ZERO_BLOCK = /en:(plant-based|cereal|breads|meals|prepared|sandwiches|pizzas|biscuits|cakes|snacks|fruit|vegetable|legume|chocolate|smoothies|juices|nectars)/;
  /* Open Food Facts : fibres, sel, % fruits/légumes/légumineuses estimé depuis les ingrédients, type de produit laitier */
  function offQuality(p, n) {
    const tags = (p.categories_tags || []).join(' ');
    const fib = n.fiber_100g != null ? Math.max(0, +n.fiber_100g || 0) : null;
    const salt = n.salt_100g != null ? Math.max(0, +n.salt_100g || 0) : n.sodium_100g != null ? Math.max(0, +n.sodium_100g * 2.5) : null;
    const sug = n.sugars_100g != null ? Math.max(0, +n.sugars_100g || 0) : null;
    let veg = n['fruits-vegetables-legumes-estimate-from-ingredients_100g'] ?? n['fruits-vegetables-nuts-estimate-from-ingredients_100g'] ?? n['fruits-vegetables-legumes_100g'] ?? n['fruits-vegetables-nuts_100g'] ?? null;
    veg = veg == null ? null : Math.min(100, Math.max(0, +veg || 0));
    if (/en:(fruit-juices|juices-and-nectars|nectars|jams|fruit-preserves|sweet-spreads|sodas|fruit-based-beverages|plant-based-beverages|dried-fruits|nuts)\b/.test(tags)) veg = 0; // jus, confitures, fruits secs : hors 5 par jour
    let dairy = 0;
    if (!/en:(plant-based|dairy-substitutes|desserts|dairy-desserts|ice-creams|creams|butters)\b/.test(tags)) {
      if (/en:cheeses\b/.test(tags) && !/en:(fromages-blancs|fresh-cheeses|cottage-cheeses|petits-suisses)\b/.test(tags)) dairy = 30;
      else if (/en:(yogurts|skyrs|fromages-blancs|fermented-milk-products|petits-suisses|fresh-cheeses|cottage-cheeses|quarks)\b/.test(tags)) dairy = 125;
      else if (/en:milks\b/.test(tags)) dairy = 150;
    }
    let fibEst = false, fibV = fib;
    if (fibV == null && ZERO_TAGS.test(tags) && !ZERO_BLOCK.test(tags)) { fibV = 0; fibEst = true; }
    return { fib: fibV, fibEst, salt, sug, veg, dairy, qv: 3 };
  }

  /* Corrections manuelles : par produit (code-barres), par aliment perso (id) ou par entrée (IA, ajout rapide) */
  const fixKey = e => e.src === 'off' && e.code ? 'off:' + e.code : e.src === 'custom' && e.fid ? 'custom:' + e.fid : 'e:' + e.id;
  const fixOf = e => (S.nutriFix || {})[fixKey(e)];
  /* ---------- Bilan qualité d'une journée ---------- */
  const hasQ = p => p && p.fib != null;
  function dayQuality(k) {
    const r = { fib: 0, salt: 0, sug: 0, vegG: 0, dairyP: 0, kcal: 0, kcalKnown: 0, saltKnown: 0, missing: [], miss: [] };
    for (const e of S.days[k]?.entries || []) {
      const kc = e.kcal || 0; r.kcal += kc;
      let p = e.per100;
      if (e.src === 'gen' && !hasQ(p)) { const q = Q[e.name]; if (q) p = { ...p, fib: q[0], salt: q[1], veg: q[2], dairy: q[3] }; }
      if (e.src === 'gen' && p && p.sug == null) p = { ...p, sug: SG[e.name] || 0 };
      const fx = fixOf(e);
      if (e.src === 'quick' || e.grams == null) { // ajout rapide : pas de poids, seulement un total de fibres saisi à la main
        if (fx && fx.fibTot != null) { r.fib += fx.fibTot; r.kcalKnown += kc; } else r.miss.push(e);
        continue;
      }
      if (!p) continue;
      const g = e.grams, k100 = g / 100;
      let fib = p.fib;
      if (fib == null && fx && fx.fib != null) fib = fx.fib;
      if (fib == null && zeroByName(e.name)) fib = 0;
      if (fib != null) { r.fib += fib * k100; r.kcalKnown += kc; }
      else { r.miss.push(e); if (e.code && (e.src === 'off' || e.src === 'custom') && (p.qv || 0) < 3) r.missing.push(e.code); }
      if (p.salt == null && fx && fx.salt != null) { r.salt += fx.salt * k100; r.saltKnown += kc; }
      if (p.salt != null) { r.salt += p.salt * k100; r.saltKnown += kc; }
      if (p.veg) r.vegG += g * p.veg / 100;
      r.sug += freeSug100(p) * k100;
      if (p.sug === undefined && (e.src === 'off' || e.src === 'custom') && e.code && p.qv !== 3) r.missing.push(e.code);
      if (p.dairy) r.dairyP += g / p.dairy;
    }
    r.cover = r.kcal > 0 ? r.kcalKnown / r.kcal : 1;
    r.vegP = r.vegG / T.vegPortion;
    return r;
  }

  /* Rattrapage : les produits OFF déjà saisis avant la v3.7 n'ont pas fibres/sel → on va les chercher une fois */
  const asked = new Set();
  let backfillT = 0;
  // ne remplace jamais une valeur déjà saisie (aliment perso) ; complète seulement ce qui manque
  const mergeQ = (p, q) => ({ ...p, fib: p.fib ?? q.fib, fibEst: p.fib != null ? p.fibEst : q.fibEst, salt: p.salt ?? q.salt, sug: p.sug ?? q.sug, veg: p.veg ?? q.veg, dairy: p.dairy || q.dairy, qv: 3 });
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
          for (const e of d.entries || []) if ((e.src === 'off' || e.src === 'custom') && e.code === code && e.per100 && (e.per100.qv || 0) < 3) { e.per100 = mergeQ(e.per100, q); ch = true; }
          if (ch) { saveDay(dk); changed = true; }
        }
        for (const list of [S.recents, S.foods, S.favs?.flatMap(f => f.items) || []]) for (const x of list) if ((x.src === 'off' || x.src === 'custom') && x.code === code && x.per100 && (x.per100.qv || 0) < 3) x.per100 = mergeQ(x.per100, q);
        if (S.off?.[code]?.per100) S.off[code].per100 = mergeQ(S.off[code].per100, q);
      } catch (err) { /* hors ligne ou OFF indisponible : on réessaiera à la prochaine session */ }
    }));
    if (changed) { Store.put('recents', S.recents); Store.put('foods', S.foods); clearTimeout(backfillT); backfillT = setTimeout(render, 50); }
  }

  /* ---------- Carte « Qualité du jour » ---------- */
  const leaf = on => `<svg viewBox="0 0 24 24" class="pip ${on}"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zm0 0c3-4 6-7 10-10"/></svg>`;
  const cup = on => `<svg viewBox="0 0 24 24" class="pip ${on}"><path d="M7 4h10l-1.4 15.2a2 2 0 0 1-2 1.8h-3.2a2 2 0 0 1-2-1.8z"/><path d="M7.4 9h9.2"/></svg>`;
  const pips = (n, max, icon) => Array.from({ length: max }, (_, i) => icon(n >= i + 1 ? 'on' : n > i + 0.25 ? 'half' : '')).join('');
  function saltColor(v) { return v <= T.salt * 0.8 ? '#2EE68A' : v <= T.salt ? '#FFB020' : '#FF4D4F'; }
  const scoreOf = q => Math.round(Math.min(1, q.fib / T.fib) * 25 + Math.min(1, q.vegP / 5) * 30 + Math.min(1, q.dairyP / T.dairy) * 10 + (q.salt <= T.salt ? 15 : Math.max(0, 15 - (q.salt - T.salt) * 6)) + ((q.sug || 0) <= T.sug ? 20 : Math.max(0, 20 - (q.sug - T.sug) * 0.5)));
  const sugColor = v => v <= T.sug * 0.7 ? '#2EE68A' : v <= T.sug ? '#FFB020' : '#FF4D4F';
  /* Idées d'aliments pour monter le score : chaque aliment est testé sur la journée, classé par points gagnés et adapté aux calories restantes */
  let lastQSug = [];
  function qualitySuggestions(k, q) {
    const remK = goals(k).kcal - dayTotals(k).kcal, base = scoreOf(q), meal = guessMeal();
    const out = [];
    for (const c of CANDS) {
      const it = itemOf(c); if (!it) continue;
      if (isSnackMeal(meal) && !SNACK.has(it.name)) continue;
      const cap = Math.max(90, remK + 40); if (it.kcal > cap) continue;
      const nq = { ...q, fib: q.fib + it.fib, salt: q.salt + it.salt, sug: (q.sug || 0) + it.sug, vegP: (q.vegG + it.veg) / T.vegPortion, dairyP: q.dairyP + it.dairy };
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
    const fibPct = Math.min(100, q.fib / T.fib * 100), saltPct = Math.min(100, q.salt / (T.salt * 1.5) * 100), sugPct = Math.min(100, q.sug / (T.sug * 1.5) * 100);
    const partial = q.kcal > 0 && q.cover < 0.85;
    const canPlan = !isLocked(k) && k === today() && !empty && goals(k).kcal - dayTotals(k).kcal > 120;
    const score = empty ? null : scoreOf(q);
    const live = !isLocked(k) && k === today();
    const sug = live && score != null && score < 100 ? qualitySuggestions(k, q) : [];
    lastQSug = sug;
    const saltTip = live && q.salt > T.salt * 0.85 ? `<p class="coach-tip small">🧂 Sel ${q.salt > T.salt ? 'dépassé' : 'presque au max'} : au prochain repas, évite charcuterie, fromage, pain et plats préparés ; les végétaux riches en potassium compensent.</p>` : '';
    const sugTip = live && q.sug > T.sug * 0.8 ? `<p class="coach-tip small">🍬 Sucres libres ${q.sug > T.sug ? 'dépassés' : 'presque au max'} (${r0(q.sug)} g) : privilégie fruits entiers, yaourt nature ou oléagineux plutôt que boissons sucrées, pâtisseries ou céréales sucrées.</p>` : '';
    const open = !!UI.qualOpen, n = sug.length + (saltTip ? 1 : 0) + (sugTip ? 1 : 0), best = sug.reduce((m, x) => Math.max(m, x.gain), 0);
    return `<section class="card quality ${open ? 'open' : ''}">
      <div class="row between"><div class="card-title"><svg viewBox="0 0 24 24" class="ico"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15zm0 0c3-4 6-7 10-10"/></svg>Qualité du jour<button class="q-info-btn" data-action="quality-info" aria-label="Comment est calculé ce score">i</button></div>${score != null ? `<span class="q-score" style="--qc:${progColor(score / 100)}"><b class="num">${score}</b>/100</span>` : ''}</div>
      <div class="q-grid">
        <div class="q-item"><div class="q-row"><span>Fibres</span><b class="num">${r0(q.fib)} / ${T.fib} g</b></div><div class="bar"><div style="width:${fibPct}%;background:${progColor(q.fib / T.fib)};box-shadow:0 0 10px ${progColor(q.fib / T.fib)};border-radius:8px"></div></div></div>
        <button class="q-item tapq" data-action="q-fix-salt"><div class="q-row"><span>Sel</span><b class="num" style="color:${q.salt > T.salt ? '#FF6B6B' : 'inherit'}">${r1(q.salt)} / ${T.salt} g max</b></div><div class="bar salt"><i class="lim" style="left:${100 / 1.5}%"></i><div style="width:${saltPct}%;background:${saltColor(q.salt)};border-radius:8px"></div></div>${q.salt > T.salt * 0.7 ? '<small class="q-help">Comment réduire ›</small>' : ''}</button>
        <button class="q-item tapq" data-action="q-fix-sug"><div class="q-row"><span>Sucres</span><b class="num" style="color:${q.sug > T.sug ? '#FF6B6B' : 'inherit'}">${r0(q.sug)} / ${T.sug} g max</b></div><div class="bar salt"><i class="lim" style="left:${100 / 1.5}%"></i><div style="width:${sugPct}%;background:${sugColor(q.sug)};border-radius:8px"></div></div>${q.sug > T.sug * 0.7 ? '<small class="q-help">Comment réduire ›</small>' : ''}</button>
        <div class="q-item"><div class="q-row"><span>Fruits & légumes</span><b class="num">${r1(Math.min(9, q.vegP)).replace('.', ',')} / 5</b></div><div class="pips veg">${pips(q.vegP, 5, leaf)}</div></div>
        <div class="q-item"><div class="q-row"><span>Laitiers (calcium)</span><b class="num">${r1(q.dairyP).replace('.', ',')} / ${T.dairy}</b></div><div class="pips dairy">${pips(q.dairyP, T.dairy, cup)}</div></div>
      </div>
      ${partial ? `<button class="q-note q-fix" data-action="quality-fix">Fibres inconnues pour ${r0((1 - q.cover) * 100)} % des calories (${q.miss.length} aliment${q.miss.length > 1 ? 's' : ''}) · <b>Compléter →</b></button>` : ''}
      ${n ? `<button class="coach-more" data-action="quality-toggle" aria-expanded="${open}"><span>${sug.length ? `${sug.length} idée${sug.length > 1 ? 's' : ''} · jusqu'à +${best} pts` : 'Conseils'}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="coach-drop"><div class="coach-drop-in">
        ${saltTip}${sugTip}
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
      <p><b>Sucres libres ≤ 50 g.</b> Repère OMS : moins de 10 % des calories (≈ 50 g, idéalement 25 g). Sont comptés les sucres ajoutés, ceux des jus, miels et sirops. Les sucres des fruits entiers, des légumes et le lactose du lait et des yaourts nature ne comptent pas. Valeur estimée depuis les étiquettes : un produit sans sucres renseignés compte 0.</p>
      <p><b>Score /100</b> : fibres 25 pts, fruits & légumes 30, sucres 20, sel 15, laitiers 10.</p>
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
    return { f, name, g, lab, role, kcal: p.kcal * k, p: p.p * k, c: p.c * k, fat: p.f * k, fib: q[0] * k, salt: q[1] * k, sug: freeSug100({ sug: SG[name] || 0, veg: q[2], dairy: q[3] }) * k, veg: g * q[2] / 100, dairy: q[3] ? g / q[3] : 0 };
  }
  function plan(k, meal) {
    const g = goals(k), t = dayTotals(k), q = dayQuality(k);
    const R = { k: g.kcal - t.kcal, p: Math.max(0, g.protein - t.p), c: g.carbs != null ? g.carbs - t.c : null, f: g.fat != null ? g.fat - t.f : null,
      fib: Math.max(0, T.fib - q.fib), veg: Math.max(0, T.veg - q.vegG), dairy: Math.max(0, T.dairy - q.dairyP) };
    if (R.k < 120) return { R, q, plans: [] };
    const items = CANDS.map(itemOf).filter(Boolean).filter(it => !isSnackMeal(meal) || SNACK.has(it.name));
    const recentNames = new Set((S.recents || []).map(r => r.name));
    function score(set) {
      const s = { kcal: 0, p: 0, c: 0, fat: 0, fib: 0, veg: 0, dairy: 0, salt: 0, sug: 0 };
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
      if (q.sug + s.sug > T.sug) pen += (q.sug + s.sug - T.sug) / 5;
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
        pl.set.forEach((it, j) => { const p = { ...it.f.per100, fib: Q[it.name][0], salt: Q[it.name][1], veg: Q[it.name][2], dairy: Q[it.name][3], sug: SG[it.name] || 0 }, kk = it.g / 100;
          d.entries.push({ id: uid(), meal, src: 'gen', fid: it.f.id, code: '', name: it.f.name, brand: '', per100: p, unit: it.f.unit || null, img: '', ns: '', qtyLabel: '', grams: it.g, count: null, kcal: p.kcal * kk, p: p.p * kk, c: p.c * kk, f: p.f * kk, t: now + j }); });
        saveDay(k); UI.date = k; UI.tab = 'journal';
        const before = dayQuality(k);
        closeSheet(1, () => { render(); toast(`Ajouté · +${r0(pl.s.p)} g prot. · +${r0(pl.s.fib)} g fibres`); if (before.vegP >= 5 && q.vegP < 5) requestAnimationFrame(() => celebrate?.(() => $('#view .card.quality'))); });
      }
    };
    sh.body.addEventListener('click', onClick); sh.foot.addEventListener('click', onClick);
    openSheet(sh.el);
  }

  /* Écran « Compléter les fibres » : liste des aliments du jour sans fibres, saisie pour 100 g (ou total pour un ajout rapide) */
  function openFixer(k) {
    const q = dayQuality(k), seen = new Map();
    for (const e of q.miss) { const key = fixKey(e); const x = seen.get(key) || { key, e, kcal: 0 }; x.kcal += e.kcal || 0; seen.set(key, x); }
    const items = [...seen.values()].sort((a, b) => b.kcal - a.kcal);
    const sh = makeSheet('Compléter les fibres');
    const row = (x, i) => { const quick = x.e.src === 'quick' || x.e.grams == null; const fx = (S.nutriFix || {})[x.key] || {};
      return `<section class="card fix-row" data-i="${i}"><div class="row between"><div class="grow"><div class="name">${esc(x.e.name)}</div><div class="muted small">${r0(x.kcal)} kcal aujourd'hui · ${x.e.src === 'off' ? 'Open Food Facts' : x.e.src === 'custom' ? 'Mon aliment' : x.e.src === 'ai' ? 'Photo IA' : 'Ajout rapide'}</div></div></div>
        <div class="grid2" style="margin-top:10px"><label class="field"><span>${quick ? 'Fibres au total (g)' : 'Fibres pour 100 g'}</span><input type="number" inputmode="decimal" step="any" min="0" data-f="fib" value="${quick ? (fx.fibTot ?? '') : (fx.fib ?? '')}" placeholder="ex. ${quick ? '4' : '2,5'}"></label>
        ${quick ? '' : `<label class="field"><span>Sel pour 100 g</span><input type="number" inputmode="decimal" step="any" min="0" data-f="salt" value="${fx.salt ?? ''}"></label>`}</div>
        <div class="fix-quick"><button class="chip" data-z="0">0 g · aucune</button>${quick ? '' : '<button class="chip" data-z="1">≈ 1 g · peu</button><button class="chip" data-z="3">≈ 3 g · moyen</button><button class="chip" data-z="6">≈ 6 g · riche</button>'}</div></section>`; };
    sh.setBody(items.length ? `<p class="muted small" style="margin:0 0 12px">Les fibres sont facultatives sur les étiquettes : beaucoup de produits ne les indiquent pas. Regarde l'emballage (ligne « Fibres alimentaires ») ou choisis une estimation. La valeur sert pour tous les jours où tu manges cet aliment.</p>${items.map(row).join('')}
      <p class="muted small">Repères : viande, poisson, œufs, laitiers, whey, huile, boissons = 0 g · pain blanc, pâtes, riz ≈ 1-3 g · plat avec légumes ≈ 2-3 g · pain complet, légumineuses, flocons d'avoine ≈ 6-10 g.</p>` : '<div class="empty small">Tout est complété ✓</div>');
    sh.setFoot('<button class="btn plain" data-a="cancel">Annuler</button><button class="btn grow" data-a="save">Enregistrer</button>');
    sh.body.addEventListener('click', e => { const z = e.target.closest('[data-z]'); if (!z) return; const r = z.closest('.fix-row'); r.querySelector('[data-f="fib"]').value = z.dataset.z; r.querySelectorAll('[data-z]').forEach(b => b.classList.toggle('on', b === z)); });
    sh.foot.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'cancel') { closeSheet(1); return; }
      if (a !== 'save') return;
      const fix = { ...(S.nutriFix || {}) }; let n = 0;
      sh.body.querySelectorAll('.fix-row').forEach(r => { const x = items[+r.dataset.i], quick = x.e.src === 'quick' || x.e.grams == null;
        const v = r.querySelector('[data-f="fib"]').value.trim().replace(',', '.'), sv = r.querySelector('[data-f="salt"]')?.value.trim().replace(',', '.');
        if (v === '' && !sv) return;
        const cur = { ...(fix[x.key] || {}) };
        if (v !== '' && isFinite(+v)) { if (quick) cur.fibTot = Math.max(0, +v); else cur.fib = Math.max(0, +v); n++; }
        if (sv && isFinite(+sv)) cur.salt = Math.max(0, +sv);
        fix[x.key] = cur;
        if (x.e.src === 'custom' && x.e.fid && !quick) { const f = S.foods.find(f => f.id === x.e.fid); if (f && f.per100) { if (cur.fib != null && f.per100.fib == null) f.per100.fib = cur.fib; if (cur.salt != null && f.per100.salt == null) f.per100.salt = cur.salt; } }
      });
      S.nutriFix = fix; Store.put('nutriFix', fix); Store.put('foods', S.foods);
      closeSheet(1, () => { render(); toast(n ? `Fibres complétées pour ${n} aliment${n > 1 ? 's' : ''}` : 'Rien de modifié'); }); };
    openSheet(sh.el);
  }
  /* Phrase de coach basée sur la qualité (utilisée par le Coach du jour) */
  function coachLine(k) {
    const q = dayQuality(k), h = new Date().getHours();
    if (!(S.days[k]?.entries || []).length) return '';
    if (q.salt > T.salt) return `Journée salée (<b>${r1(q.salt)} g</b> de sel) : mise sur des légumes et fruits ce soir, riches en potassium.`;
    if (q.sug > T.sug) return `Sucres libres à <b>${r0(q.sug)} g</b> (repère 50 g) : le reste de la journée, fruits entiers, yaourt nature ou oléagineux plutôt que du sucré.`;
    if (h >= 15 && q.vegP < 2) return `Seulement <b>${r1(q.vegP).replace('.', ',')}</b> portion de fruits/légumes : vitamines C, potassium et magnésium en manque. « Compléter ma journée » te propose de quoi rattraper.`;
    if (h >= 17 && q.fib < T.fib * 0.6) return `Fibres à <b>${r0(q.fib)} g</b> sur 30 : légumineuses, légumes ou fruits rouges au prochain repas.`;
    return '';
  }


  /* ---------- « Comment réduire » le sucre ou le sel ---------- */
  const SWAPS = {
    sug: [
      [/soda|cola|coca|limonade|sprite|fanta|ice ?tea|th[ée] glac|energy|red ?bull|monster|sirop/i, 'Eau pétillante citronnée, soda zéro ou thé sans sucre'],
      [/jus|nectar|smoothie/i, 'Un fruit entier (plus de fibres, moins de sucres libres)'],
      [/nutella|p[âa]te [àa] tartiner|confiture|miel|sirop/i, 'Beurre de cacahuète 100 %, ou moitié moins avec des tranches de banane'],
      [/c[ée]r[ée]ales|corn ?flakes|muesli|granola|chocapic|special k|frosties/i, "Flocons d'avoine nature + fruits rouges"],
      [/barre|snickers|mars|twix|kinder|bounty|kitkat/i, 'Un fruit + une poignée d\'amandes, ou une barre protéinée sans sucres ajoutés'],
      [/chocolat|bonbon|g[âa]teau|biscuit|cookie|brownie|muffin|donut|crois|pain au choc|viennoiserie|tarte|glace|dessert|cr[èe]me/i, 'Yaourt nature + fruit, ou 2 carrés de chocolat noir 70 %'],
      [/ketchup|sauce|barbecue|bbq/i, 'Moutarde, salsa maison ou citron'],
      [/yaourt|skyr|fromage blanc/i, 'Version nature (ajoute des fruits frais)'],
    ],
    salt: [
      [/jambon|bacon|lardons?|saucisse|charcuterie|chorizo|saucisson|rillettes|p[âa]t[ée]|merguez|knacki/i, 'Blanc de poulet ou dinde maison, œufs, thon au naturel'],
      [/fromage|emmental|comt[ée]|camembert|feta|parmesan|raclette|mozzarella|ch[èe]vre/i, 'Fromage blanc, skyr ou une portion de 30 g seulement'],
      [/chips|biscuit ap[ée]ro|cacahu[èe]tes? sal|cr[ée]ackers?|bretzel/i, 'Amandes ou noix non salées, légumes croquants'],
      [/pizza|burger|kebab|tacos|nuggets|sandwich|panini|croque|quiche|lasagne|hachis|plat pr[ée]par|surgel/i, 'Version maison : tu contrôles le sel (compte 1 g de sel par plat en moins)'],
      [/soupe|bouillon|velout/i, 'Soupe maison sans cube, relevée aux herbes et citron'],
      [/ketchup|mayonnaise|sauce|vinaigrette|soja/i, 'Citron, herbes, épices, moutarde (en petite quantité)'],
      [/pain|baguette|biscotte/i, 'Pain complet avec moins de tranches, ou flocons d\'avoine'],
      [/thon|saumon fum|crevettes|sardines?|anchois/i, 'Poisson frais ou surgelé nature, ou rincer les conserves'],
    ],
  };
  for (const kk in SWAPS) SWAPS[kk] = SWAPS[kk].map(([re, t]) => [new RegExp('(?<!\\p{L})(?:' + re.source + ')', 'iu'), t]); // début de mot obligatoire (cola ≠ chocolat)
  function openReduce(kind, k) {
    const isSug = kind === 'sug', lim = isSug ? T.sug : T.salt, unit = 'g', nameWord = isSug ? 'sucres libres' : 'sel';
    const q = dayQuality(k), tot = isSug ? q.sug : q.salt;
    const rows = [];
    for (const e of S.days[k]?.entries || []) {
      if (e.grams == null || !e.per100) continue;
      let p = e.per100;
      if (e.src === 'gen') p = { ...p, sug: p.sug ?? SG[e.name] ?? 0, salt: p.salt ?? Q[e.name]?.[1] ?? 0, veg: p.veg ?? Q[e.name]?.[2], dairy: p.dairy ?? Q[e.name]?.[3] };
      const v = (isSug ? freeSug100(p) : (+p.salt || 0)) * e.grams / 100;
      if (v >= (isSug ? 2 : 0.15)) rows.push({ e, v, done: mealDone(k, e.meal) });
    }
    rows.sort((a, b) => b.v - a.v);
    const top = rows.slice(0, 6), planned = rows.filter(r => !r.done && !isLocked(k)).reduce((s, r) => s + r.v, 0);
    const over = tot - lim, swapFor = n => (SWAPS[kind].find(([re]) => re.test(n)) || [])[1];
    const fmt = v => isSug ? r0(v) : r1(v).replace('.', ',');
    const sh = makeSheet(isSug ? 'Réduire le sucre' : 'Réduire le sel');
    const head = `<section class="card stack rd-head"><div class="rd-big"><b class="num" style="color:${over > 0 ? '#FF6B6B' : 'inherit'}">${fmt(tot)}</b><span>/ ${lim} g max</span></div>
      <p class="muted small">${over > 0 ? `${fmt(over)} g au-dessus du repère. Ce qui est déjà mangé ne se retire pas, mais voici d'où ça vient et quoi changer pour la suite.` : `Tu es sous le repère : ${fmt(lim - tot)} g de marge.`}</p>
      ${planned > 0 && over > -lim ? `<p class="small rd-plan">Dont <b>${fmt(planned)} g</b> sur des aliments encore « prévus » : tu peux encore les remplacer ou les retirer.${tot - planned <= lim ? ` Sans eux : <b>${fmt(tot - planned)} g</b> ✓` : ` Sans eux : ${fmt(tot - planned)} g.`}</p>` : ''}</section>`;
    const list = top.length ? `<div class="section-title" style="margin:14px 0 8px"><h2>D'où ça vient</h2></div><section class="card list rd-list">${top.map(({ e, v, done }, i) => {
      const sw = swapFor(e.name);
      return `<div class="rd-row"><div class="row between"><div class="grow"><div class="name">${esc(e.name)}</div><div class="sub">${r0(e.grams)} g · ${done ? 'déjà mangé' : 'prévu'}</div></div><b class="num rd-v">${fmt(v)} ${unit}</b></div>
        <div class="bar rd-bar"><div style="width:${Math.min(100, v / Math.max(tot, .01) * 100)}%;background:${isSug ? '#FF6B6B' : '#FFB020'};border-radius:8px"></div></div>
        ${sw ? `<p class="rd-swap small">↳ ${esc(sw)}</p>` : ''}
        ${!done && !isLocked(k) ? `<button class="btn ghost small rd-edit" data-a="edit" data-id="${e.id}">Modifier / retirer</button>` : ''}</div>`;
    }).join('')}</section>` : '<p class="muted small" style="margin-top:14px">Rien de significatif dans ta journée pour le moment.</p>';
    const tips = isSug ? [
      'Les boissons sucrées sont la première source : eau pétillante, soda zéro, thé ou café sans sucre.',
      'Remplace desserts et viennoiseries par yaourt nature + fruit : les sucres des fruits entiers et du lactose ne comptent pas.',
      'Lis la ligne « dont sucres » de l\'étiquette : au-delà de 10 g pour 100 g, c\'est déjà sucré.',
      'Un peu de protéines et de fibres au repas limitent l\'envie de sucré 2 h après.',
    ] : [
      'Le pain, le fromage, la charcuterie et les plats préparés apportent l\'essentiel du sel.',
      'Cuisine sans ajouter de sel : ail, herbes, épices, citron, vinaigre.',
      'Rince les légumes et légumineuses en conserve.',
      'Les légumes et fruits riches en potassium (banane, épinards, pommes de terre) aident à compenser.',
    ];
    sh.setBody(head + list + `<div class="section-title" style="margin:14px 0 8px"><h2>Pour la suite</h2></div><section class="card stack"><ul class="rd-tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul></section>`);
    sh.setFoot('<button class="btn grow" data-a="ok">Compris</button>');
    sh.foot.onclick = () => closeSheet(1);
    sh.body.addEventListener('click', ev => { const b = ev.target.closest('[data-a="edit"]'); if (!b) return; K.editEntry(b.dataset.id); });
    openSheet(sh.el);
  }

  const actions = {
    'q-fix-sug': () => openReduce('sug', UI.date),
    'q-fix-salt': () => openReduce('salt', UI.date),
    'quality-toggle': b => { UI.qualOpen = !UI.qualOpen; const c = b.closest('.quality'); c?.classList.toggle('open', UI.qualOpen); b.setAttribute('aria-expanded', UI.qualOpen); },
    'quality-fix': () => openFixer(UI.date),
    'quality-sug': b => { const x = lastQSug[+b.dataset.i]; if (x) openDetail(x.it.f, { meal: guessMeal(), date: UI.date, grams: x.it.g }); },
  };
  return { actions, flags, scoreOf, enrichGen, offQuality, dayQuality, qualityCard, qualityInfo, openPlanner, coachLine, T, Q };
};
