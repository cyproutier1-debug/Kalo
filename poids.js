/* Kalo — coach poids : lit les pesées, le déficit et la journée de la veille pour expliquer les variations
   (eau, sel, glucides, entraînement, rebond après une grosse baisse) et rassurer avec des chiffres. */
window.KaloWeightInit = function (K) {
  const { S, UI, esc, r0, r1, dkey, dparse, addDays, today, cap, F, sortedWeights, dayTotals, dayBurn, Nu, Mu, goals, currentWeight } = K;
  const waterGoal = () => Math.max(1500, Math.round(35 * (currentWeight() || 75) / 250) * 250);
  const foodMass = k => (S.days[k]?.entries || []).reduce((a, e) => a + (e.grams || 0), 0);
  const KCAL_KG = 7700; // énergie d'environ 1 kg de graisse corporelle
  const fmt = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + String(Math.abs(Math.round(v * 10 ** d) / 10 ** d)).replace('.', ',');
  const kg = v => String(r1(v)).replace('.', ',');
  const daysBetween = (a, b) => Math.round((dparse(b) - dparse(a)) / 864e5);
  const logged = k => (S.days[k]?.entries?.length || 0) > 0;

  // Poids « tendance » : moyenne lissée (exponentielle) qui gomme l'eau du jour, comme les applis de pesée sérieuses
  function trendSeries(ws) {
    const out = []; let t = null, prevDate = null;
    for (const w of ws) {
      if (t == null) t = w.kg;
      else { const gap = Math.max(1, daysBetween(prevDate, w.date)); const a = 1 - Math.pow(1 - 0.15, gap); t += a * (w.kg - t); }
      out.push({ date: w.date, kg: w.kg, t }); prevDate = w.date;
    }
    return out;
  }
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function deficitBetween(fromK, toK) { // déficit cumulé des jours saisis entre deux dates (exclusif / inclusif)
    let sum = 0, n = 0;
    for (let d = addDays(dparse(fromK), 1); dkey(d) <= toK; d = addDays(d, 1)) { const k = dkey(d); if (!logged(k)) continue; sum += dayBurn(k).v - dayTotals(k).kcal; n++; }
    return { sum, n };
  }

  function analyse() {
    const ws = sortedWeights(); if (ws.length < 2) return null;
    const T = trendSeries(ws), last = T[T.length - 1], prev = T[T.length - 2];
    const recent = T.filter(x => daysBetween(x.date, last.date) <= 7);
    const low = recent.reduce((m, x) => (x.kg < m.kg ? x : m), recent[0]);
    const back7 = [...T].reverse().find(x => daysBetween(x.date, last.date) >= 7) || T[0];
    const trendWeek = (last.t - back7.t) / Math.max(1, daysBetween(back7.date, last.date)) * 7;
    const w7 = avg(ws.filter(w => daysBetween(w.date, today()) < 7).map(w => w.kg)), w14 = avg(ws.filter(w => { const d = daysBetween(w.date, today()); return d >= 7 && d < 14; }).map(w => w.kg));
    const def7 = deficitBetween(dkey(addDays(new Date(), -8)), dkey(addDays(new Date(), -1)));
    const rebound = last.kg - low.kg;
    // causes probables dans les 2 jours avant la dernière pesée
    const causes = [];
    const d1 = dkey(addDays(dparse(last.date), -1)), d2 = dkey(addDays(dparse(last.date), -2));
    for (const k of [d1, d2]) {
      if (!logged(k)) continue;
      const q = Nu.dayQuality(k);
      if (q.salt > 6) { causes.push({ ico: '🧂', t: `Sel élevé ${k === d1 ? 'la veille' : "l'avant-veille"} (${kg(q.salt)} g)`, d: 'Le corps garde environ 1 L d\'eau en plus pour diluer un excès de sel. Ça repart en 1 à 3 jours.' }); break; }
    }
    const carbs = k => logged(k) ? dayTotals(k).c : null;
    const cAvg = avg([3, 4, 5, 6, 7, 8].map(i => carbs(dkey(addDays(dparse(last.date), -i)))).filter(v => v != null));
    const cYest = carbs(d1);
    if (cAvg && cYest != null && cYest > cAvg * 1.25) causes.push({ ico: '🍝', t: `Plus de glucides la veille (${r0(cYest)} g contre ${r0(cAvg)} g en moyenne)`, d: 'Les glucides sont stockés en glycogène avec environ 3 g d\'eau par gramme : 100 g de glucides en plus ≈ +0,3 à 0,4 kg sur la balance, sans aucune graisse.' });
    if (logged(d1)) {
      const mAvg = avg([2, 3, 4, 5, 6, 7].map(i => dkey(addDays(dparse(last.date), -i))).filter(logged).map(foodMass)), m1 = foodMass(d1);
      if (mAvg && m1 > mAvg * 1.3 && m1 - mAvg > 300) causes.push({ ico: '🥗', t: `Plus de volume dans l'assiette la veille (${kg(m1 / 1000)} kg d'aliments contre ${kg(mAvg / 1000)} kg)`, d: `Ce que tu as mangé pèse encore dans ton intestin : environ ${kg((m1 - mAvg) / 1000)} kg de plus que d'habitude, qui repartent en 1 à 2 jours.` });
      const q1 = Nu.dayQuality(d1), fAvg = avg([2, 3, 4, 5, 6, 7].map(i => dkey(addDays(dparse(last.date), -i))).filter(logged).map(k => Nu.dayQuality(k).fib));
      if (fAvg != null && q1.fib > fAvg + 8) causes.push({ ico: '🌾', t: `Beaucoup de fibres la veille (${r0(q1.fib)} g contre ${r0(fAvg)} g)`, d: 'Les fibres retiennent de l\'eau dans l\'intestin et ralentissent le transit le temps de s\'habituer : +0,2 à 0,5 kg temporaire.' });
      const w1 = S.days[d1]?.water || 0;
      if (w1 && w1 < waterGoal() * .5) causes.push({ ico: '💧', t: `Peu bu la veille (${kg(w1 / 1000)} L sur ${kg(waterGoal() / 1000)} L)`, d: 'Quand tu bois peu, le corps a tendance à garder l\'eau qu\'il a. Boire normalement aujourd\'hui aide à l\'évacuer.' });
    }
    if (last.h != null && last.h >= 11) causes.push({ ico: '🕐', t: `Pesée faite à ${Math.floor(last.h)} h ${String(Math.round(last.h % 1 * 60)).padStart(2, '0')}`, d: 'Plus tard dans la journée, la balance compte l\'eau bue et les repas : souvent +0,5 à 1,5 kg par rapport au matin à jeun.' });
    const wos = (Mu?.M?.workouts || []).filter(w => w.end && w.start >= dparse(last.date).getTime() - 2 * 864e5 && w.start < dparse(last.date).getTime() + 864e5);
    if (wos.length) causes.push({ ico: '🏋️', t: `Séance de muscu récente (${esc(wos[wos.length - 1].name)})`, d: 'Après une séance, les muscles sollicités retiennent de l\'eau pour réparer les fibres (souvent +0,3 à 1 kg pendant 2 à 4 jours). C\'est le signe que l\'entraînement travaille.' });
    const drop = T.map((x, i) => i ? { date: x.date, dk: x.kg - T[i - 1].kg, gap: daysBetween(T[i - 1].date, x.date) } : null).filter(Boolean).filter(x => x.gap <= 2 && daysBetween(x.date, last.date) <= 4 && daysBetween(x.date, last.date) >= 1);
    const big = drop.find(x => x.dk <= -0.7);
    if (big) causes.push({ ico: '📉', t: `Grosse baisse juste avant (${fmt(big.dk)} kg le ${cap(F.short.format(dparse(big.date)))})`, d: 'Une chute brutale vient surtout d\'eau évacuée ; un petit rebond derrière est mécanique. Compare toujours à la tendance, pas au jour le plus bas.' });
    return { T, last, prev, low, rebound, trendWeek, w7, w14, def7, causes, n: ws.length };
  }

  function verdict(a) {
    const bw = a.last.kg, fatEq = a.rebound * KCAL_KG;
    const defLow = a.def7.n >= 3 ? a.def7.sum : null;
    // 1) remontée récente alors que la tendance baisse ou que le déficit est réel
    if (a.rebound >= 0.15 && daysBetween(a.low.date, a.last.date) <= 4 && (a.trendWeek < 0 || (defLow != null && defLow > 0))) {
      const defSince = deficitBetween(dkey(addDays(dparse(a.low.date), -1)), dkey(addDays(dparse(a.last.date), -1))); // repas du jour de la pesée basse jusqu'à la veille
      return { tone: 'calm', title: `${fmt(a.rebound)} kg depuis le ${cap(F.short.format(dparse(a.low.date)))} : c'est de l'eau, pas de la graisse`,
        body: `Pour stocker ${kg(a.rebound)} kg de graisse, il faudrait manger environ <b>${r0(fatEq).toLocaleString('fr-FR')} kcal de plus</b> que ce que tu dépenses.${defSince.n && defSince.sum > 0 ? ` ${defSince.n > 1 ? `Sur ces ${defSince.n} jours` : 'Ce jour-là'}, tu étais au contraire en <b>déficit de ${r0(defSince.sum).toLocaleString('fr-FR')} kcal</b>.` : ''} La balance pèse aussi l'eau, le glycogène et le contenu de l'intestin, qui varient de 0,5 à 2 kg d'un jour à l'autre.` };
    }
    // 2) stagnation sur 2 semaines malgré un déficit annoncé
    const old = [...a.T].reverse().find(x => daysBetween(x.date, a.last.date) >= 14);
    if (old && a.last.t - old.t > -0.15 && defLow != null && defLow / a.def7.n > 250 && a.n >= 6)
      return { tone: 'warn', title: 'Tendance stable depuis 2 semaines', body: `Ton journal indique un déficit d'environ ${r0(defLow / a.def7.n)} kcal/jour, mais la tendance ne bouge pas. Le plus souvent, l'écart vient de la saisie (huile, sauces, grignotages, portions estimées) ou d'une dépense surestimée. Ouvre les conseils ci-dessous.` };
    // 3) perte trop rapide
    if (a.trendWeek < -0.012 * bw) return { tone: 'warn', title: `Tu perds vite : ${fmt(a.trendWeek)} kg/semaine`, body: 'Au-delà d\'environ 1 % du poids par semaine, une partie peut venir du muscle. Garde tes protéines hautes et ne descends pas plus bas en calories ; une partie de cette baisse est aussi de l\'eau qui ne se reproduira pas chaque semaine.' };
    if (a.trendWeek < -0.05) return { tone: 'good', title: `Tendance en baisse : ${fmt(a.trendWeek)} kg/semaine`, body: 'C\'est la tendance qui compte, pas la pesée du jour. Continue comme ça.' };
    if (a.trendWeek > 0.1) return { tone: 'warn', title: `Tendance en hausse : ${fmt(a.trendWeek)} kg/semaine`, body: 'Sur plusieurs jours, la tendance monte. Vérifie que tes journées sont bien toutes saisies et compare tes calories à ton objectif.' };
    return { tone: 'calm', title: 'Poids stable', body: 'Les variations du moment restent dans le bruit normal (eau, sel, digestion). Regarde la tendance sur 2 semaines avant de changer quoi que ce soit.' };
  }

  /* Conseils personnalisés : analyse des 14 derniers jours saisis (hors aujourd'hui) */
  function habits() {
    const g = goals(), wg = waterGoal(), days = [];
    for (let i = 1; i <= 14; i++) { const k = dkey(addDays(new Date(), -i)); if (logged(k)) days.push(k); }
    if (days.length < 3) return { n: days.length, tips: [] };
    const D = days.map(k => { const t = dayTotals(k), q = Nu.dayQuality(k), dow = dparse(k).getDay(); return { k, t, q, we: dow === 0 || dow === 6, water: S.days[k]?.water || 0 }; });
    const tips = [], good = [];
    const n = D.length, pct = x => Math.round(x * 100);
    // régularité de saisie
    if (n < 11) tips.push({ s: 9, ico: '📝', t: `${n} jours saisis sur les 14 derniers`, d: 'Les jours non saisis faussent le déficit affiché et donc l\'explication du poids. Même une estimation rapide vaut mieux qu\'un jour vide.' });
    // calories : objectif, excès, week-end
    const kp = D.map(x => x.t.kcal / g.kcal), over = kp.filter(v => v > 1.05).length, inT = kp.filter(v => v >= .8 && v <= 1.05).length;
    if (over >= 3) tips.push({ s: 8, ico: '🔥', t: `${over} jours au-dessus de l'objectif calories sur ${n}`, d: `En moyenne tu es à ${pct(avg(kp))} % de ton objectif (${r0(g.kcal)} kcal). Un excès de 500 kcal efface environ un jour de déficit.` });
    else if (inT >= n * .7) good.push(`${inT}/${n} jours dans ton objectif calories`);
    const we = D.filter(x => x.we).map(x => x.t.kcal), wd = D.filter(x => !x.we).map(x => x.t.kcal);
    if (we.length >= 2 && wd.length >= 3 && avg(we) - avg(wd) > 300) tips.push({ s: 7, ico: '📅', t: `Week-ends à +${r0(avg(we) - avg(wd))} kcal par rapport à la semaine`, d: `Deux jours comme ça réduisent ton déficit de la semaine d'environ ${r0((avg(we) - avg(wd)) * 2)} kcal. La pesée du lundi sera aussi plus haute (sel, glucides).` });
    // protéines
    const pHit = D.filter(x => x.t.p >= g.protein * .95).length;
    if (pHit < n * .6) tips.push({ s: 6, ico: '💪', t: `Protéines atteintes ${pHit} jour${pHit > 1 ? 's' : ''} sur ${n}`, d: `Ton objectif est ${r0(g.protein)} g. En déficit, les protéines protègent le muscle et calment la faim : skyr, blanc de poulet, œufs, whey.` });
    else good.push(`protéines atteintes ${pHit}/${n} jours`);
    // sel
    const salt = D.map(x => x.q.salt), saltHigh = salt.filter(v => v > 6).length;
    if (saltHigh >= 3) tips.push({ s: 7, ico: '🧂', t: `Sel au-dessus de 6 g ${saltHigh} jour${saltHigh > 1 ? 's' : ''} sur ${n} (moyenne ${kg(avg(salt))} g)`, d: 'Chaque journée salée ajoute de l\'eau sur la balance le lendemain. Les plus gros apports dans ton journal viennent souvent des plats préparés, fast-food, charcuterie et fromage.' });
    // glucides en dents de scie
    const cs = D.map(x => x.t.c), cm = avg(cs), sd = Math.sqrt(avg(cs.map(c => (c - cm) ** 2)));
    if (cm > 0 && sd / cm > .3) tips.push({ s: 5, ico: '🍝', t: `Glucides très variables (de ${r0(Math.min(...cs))} à ${r0(Math.max(...cs))} g selon les jours)`, d: 'Ta balance va suivre ces écarts (≈ 3 g d\'eau par gramme de glucides stocké). Des glucides plus réguliers = une courbe plus lisible.' });
    // fibres, fruits & légumes
    const fib = avg(D.map(x => x.q.fib)), veg = avg(D.map(x => x.q.vegP));
    if (fib < 20) tips.push({ s: 5, ico: '🌾', t: `Fibres : ${r0(fib)} g par jour en moyenne (objectif 30 g)`, d: 'Peu de fibres = transit irrégulier, donc des écarts de 0,5 à 1 kg selon les jours. Ajoute légumineuses, légumes ou fruits rouges.' });
    if (veg < 3) tips.push({ s: 4, ico: '🥦', t: `${kg(veg)} portion${veg >= 2 ? 's' : ''} de fruits & légumes par jour en moyenne`, d: 'Le potassium des végétaux aide à évacuer l\'eau retenue par le sel. Vise 5 portions de 80 g.' });
    else good.push(`${kg(veg)} portions de fruits & légumes par jour`);
    // eau
    const wD = D.filter(x => x.water > 0);
    if (wD.length >= 3) { const wa = avg(wD.map(x => x.water)); if (wa < wg * .7) tips.push({ s: 5, ico: '💧', t: `Tu bois ${kg(wa / 1000)} L par jour en moyenne (objectif ${kg(wg / 1000)} L)`, d: 'Une hydratation basse et irrégulière favorise la rétention d\'eau et la faim.' }); else good.push(`hydratation à ${pct(wa / wg)} % de l'objectif`); }
    // données incomplètes
    const partial = D.filter(x => x.q.cover < .85).length;
    if (partial >= 4) tips.push({ s: 4, ico: '❓', t: `${partial} jours avec des aliments incomplets`, d: 'Ajouts rapides ou étiquettes sans fibres ni sel : le coach ne peut pas expliquer ces jours-là. « Compléter → » dans la Qualité du jour.' });
    // féculents probablement pesés cuits avec des valeurs crues
    const sus = [];
    for (const x of D) for (const e of S.days[x.k].entries || []) if (e.per100?.kcal > 300 && !e.cg && e.grams > 170 && /p[âa]tes|spaghett|penne|riz|semoule|couscous|quinoa|lentille|nouille/i.test(e.name || '')) sus.push(e);
    if (sus.length) tips.push({ s: 8, ico: '⚖️', t: `${sus.length} portion${sus.length > 1 ? 's' : ''} de féculents comptée${sus.length > 1 ? 's' : ''} en cru à plus de 170 g`, d: `Par exemple « ${esc(sus[0].name)} » : ${r0(sus[0].grams)} g crus = environ ${r0(sus[0].grams * 2.3)} g cuits. Si tu as pesé ton assiette, choisis l'unité « g cuits » : sinon tes calories sont comptées environ 2,3 fois trop haut et ton déficit réel est plus grand qu'affiché.` });
    // heure des pesées
    const ws = sortedWeights().filter(w => w.h != null).slice(-10), late = ws.filter(w => w.h >= 11).length;
    if (late >= 2) tips.push({ s: 6, ico: '🕐', t: `${late} pesées faites après 11 h`, d: 'Les pesées de l\'après-midi ou du soir ne sont pas comparables à celles du matin à jeun. Le matin, après les toilettes, c\'est la référence.' });
    return { n, tips: tips.sort((a, b) => b.s - a.s).slice(0, 6), good };
  }

  const TIPS = [
    ['⚖️', 'Pèse-toi dans les mêmes conditions', 'Le matin, après les toilettes, avant de boire et de manger, avec le même vêtement (ou sans). Une pesée le soir peut afficher 1 à 2 kg de plus.'],
    ['📊', 'Compare des moyennes, pas des jours', 'Moyenne de cette semaine contre la semaine dernière : c\'est ce chiffre qui reflète la graisse perdue. Le poids « tendance » de Kalo fait ce lissage pour toi.'],
    ['🧂', 'Sel et plats préparés', 'Un repas très salé (tacos, pizza, sushis + sauce soja) fait souvent +0,5 à 1 kg le lendemain. Bois normalement et mange des légumes riches en potassium ; ça part en 1 à 3 jours.'],
    ['🍝', 'Glucides et glycogène', 'Après un repas riche en féculents, les muscles se rechargent en glycogène et en eau. C\'est utile pour l\'entraînement et sans effet sur la graisse.'],
    ['🏋️', 'Courbatures = rétention', 'Une grosse séance (surtout jambes) fait retenir de l\'eau aux muscles pendant 2 à 4 jours.'],
    ['😴', 'Sommeil et stress', 'Une nuit courte ou une période stressante augmentent le cortisol, qui favorise la rétention d\'eau. La baisse revient souvent d\'un coup quelques jours plus tard.'],
    ['🚽', 'Transit', 'Plus de fibres ou de volume alimentaire = plus de poids dans l\'intestin (jusqu\'à 1 kg). Ce n\'est pas du gras.'],
    ['📝', 'Si ça stagne 2-3 semaines', 'Pèse tes aliments crus (ou utilise « g cuits »), compte l\'huile et les sauces, saisis aussi les week-ends ; puis seulement, baisse de 100 à 150 kcal ou ajoute 2 000 pas par jour.'],
  ];

  function card() {
    const a = analyse(); if (!a) return '';
    const v = verdict(a), open = !!UI.wcOpen, hb = habits();
    const wkDiff = a.w7 != null && a.w14 != null ? a.w7 - a.w14 : null;
    return `<section class="card coach wcoach ${v.tone} ${open ? 'open' : ''}">
      <div class="card-title">🧭 Coach poids</div>
      <p class="wc-title">${v.title}</p>
      <p class="coach-tip small">${v.body}</p>
      ${v.tone === 'calm' && a.causes.length ? `<div class="wc-causes">${a.causes.map(c => `<div class="wc-cause"><span>${c.ico}</span><div><b>${c.t}</b><div class="muted small">${c.d}</div></div></div>`).join('')}</div>` : ''}
      <div class="wc-stats">
        <div><b class="num">${kg(a.last.t)} kg</b><span>poids tendance</span></div>
        <div><b class="num ${a.trendWeek < 0 ? 'good-text' : ''}">${fmt(a.trendWeek)} kg</b><span>tendance / semaine</span></div>
        ${wkDiff != null ? `<div><b class="num ${wkDiff < 0 ? 'good-text' : ''}">${fmt(wkDiff)} kg</b><span>moyenne 7 j vs 7 j avant</span></div>` : `<div><b class="num">${a.def7.n ? r0(Math.max(0, a.def7.sum)).toLocaleString('fr-FR') : '–'}</b><span>kcal de déficit (7 j)</span></div>`}
      </div>
      <button class="coach-more" data-action="wc-toggle" aria-expanded="${open}"><span>${hb.tips.length ? `${hb.tips.length} conseil${hb.tips.length > 1 ? 's' : ''} d'après ton journal` : 'Conseils pour bien lire la balance'}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="coach-drop"><div class="coach-drop-in">
        ${hb.n >= 3 ? `<div class="wc-sub">Sur tes ${hb.n} derniers jours saisis</div>` : '<div class="wc-sub">Saisis au moins 3 jours pour des conseils personnalisés.</div>'}
        ${hb.tips.map(x => `<div class="wc-tip"><span>${x.ico}</span><div><b>${x.t}</b><div class="muted small">${x.d}</div></div></div>`).join('')}
        ${hb.good?.length ? `<div class="wc-good">✅ Points forts : ${hb.good.join(' · ')}</div>` : ''}
        <div class="wc-sub">À savoir</div>
        ${TIPS.filter(([, t]) => !hb.tips.some(x => x.t.toLowerCase().includes(t.split(' ')[0].toLowerCase()))).slice(0, hb.tips.length ? 3 : 8).map(([i, t, d]) => `<div class="wc-tip"><span>${i}</span><div><b>${t}</b><div class="muted small">${d}</div></div></div>`).join('')}
      </div></div>
    </section>`;
  }
  // Une phrase pour le Coach du jour quand la dernière pesée (aujourd'hui ou hier) remonte
  function coachLine() {
    const a = analyse(); if (!a) return '';
    if (daysBetween(a.last.date, today()) > 1) return '';
    const v = verdict(a);
    if (v.tone !== 'calm' || a.rebound < 0.15) return '';
    return `Balance ${fmt(a.rebound)} kg ? Pas de panique : ${a.causes[0] ? a.causes[0].t.toLowerCase().replace(/^(\S+)/, '$1') + ', ' : ''}c'est de l'eau. Ta tendance est à <b>${fmt(a.trendWeek)} kg/semaine</b>.`;
  }
  const actions = { 'wc-toggle': b => { UI.wcOpen = !UI.wcOpen; const c = b.closest('.wcoach'); c?.classList.toggle('open', UI.wcOpen); b.setAttribute('aria-expanded', UI.wcOpen); } };
  return { card, coachLine, analyse, actions };
};
