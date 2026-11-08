'use strict';
// Kalo « boost » : coach du jour, hydratation, repas favoris, séries et trophées, bilan de la semaine, rappel de sauvegarde.
window.KaloBoostInit = K => {
  const { $, $$, esc, r0, r1, uid, cap, dkey, dparse, addDays, today, F, ICON, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, progColor,
    goals, dayTotals, getDay, saveDay, isLocked, dayBurn, currentWeight, sortedWeights, MEALS, mealName, guessMeal, openDetail, celebrate, Mu, exportData } = K;
  const DAY = 864e5;

  /* ---------- Hydratation ---------- */
  const waterGoal = () => Math.max(1500, Math.round(35 * (currentWeight() || 75) / 250) * 250);
  function waterCard(k) {
    const ml = S.days[k]?.water || 0, goal = waterGoal(), pct = Math.min(1, ml / goal);
    const lvl = (1 - pct) * 100;
    // bouteille en fond de carte : l'eau monte jusqu'au niveau atteint, pourcentage au centre
    // couleur de progression comme les protéines / glucides : rouge (0 %) → orange (50 %) → vert (100 %)
    const col = progColor ? progColor(pct) : '#38BDF8';
    const prevLvl = UI.waterLvl ?? 100, prevPct = UI.waterPct ?? 0; UI.waterLvl = lvl; UI.waterPct = Math.round(pct * 100);
    if (prevLvl !== lvl || prevPct !== UI.waterPct) requestAnimationFrame(() => requestAnimationFrame(() => animWater(prevPct, UI.waterPct, prevLvl - lvl)));
    return `<section class="card water ${pct >= 1 ? 'done' : ''}" style="--wcol:${col}">
      <div class="water-bg" aria-hidden="true"><div class="water-fill" style="transform:translateY(${prevLvl.toFixed(1)}%)" data-lvl="${lvl.toFixed(1)}">${WAVE('w-back')}${WAVE('w-front')}<i class="water-shine"></i></div></div>
      <div class="water-fg">
        <div class="card-title">Hydratation</div>
        <div class="water-center"><b class="num water-pct">${prevPct}%</b><span class="num water-val">${r1(ml / 1000)} / ${r1(goal / 1000)} L</span></div>
        <div class="water-btns"><button class="chip" data-action="water" data-v="-250" ${ml ? '' : 'disabled'} aria-label="Retirer un verre">−</button><button class="chip" data-action="water" data-v="250" aria-label="Ajouter un verre de 25 cl">+25 cl</button><button class="chip" data-action="water" data-v="500" aria-label="Ajouter 50 cl">+50 cl</button></div>
      </div>
    </section>`;
  }
  // vague : deux couches décalées (arrière plus sombre et plus lente) sur une période parfaitement raccordée
  const WAVE = cls => `<svg class="wave ${cls}" viewBox="0 0 240 20" preserveAspectRatio="none"><path d="M0 10 C20 3 40 3 60 10 S100 17 120 10 S160 3 180 10 S220 17 240 10 V20 H0Z"/></svg>`;
  function animWater(from, to, dLvl) {
    const card = $('#view .card.water'); if (!card) return;
    const fill = card.querySelector('.water-fill'), num = card.querySelector('.water-pct');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (fill) { if (!reduce && dLvl > 0) { card.classList.remove('rising'); void card.offsetWidth; card.classList.add('rising'); setTimeout(() => card.classList.remove('rising'), 1500); } fill.style.transform = `translateY(${fill.dataset.lvl}%)`; }
    if (!num) return;
    if (reduce) { num.textContent = to + '%'; return; }
    const t0 = performance.now(), D = 1100, ease = x => 1 - Math.pow(1 - x, 4);
    const step = now => { const k = Math.min(1, (now - t0) / D); num.textContent = Math.round(from + (to - from) * ease(k)) + '%'; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function addWater(k, v) {
    const d = getDay(k), before = d.water || 0; d.water = Math.max(0, before + v); if (!d.water) delete d.water;
    saveDay(k); render();
    try { navigator.vibrate?.(10); } catch (e) { /* ignore */ }
    if (before < waterGoal() && (d.water || 0) >= waterGoal()) { if (S.fx?.sound) window.KaloFX?.prime?.(); toast('Objectif hydratation atteint 💧'); try { navigator.vibrate?.(30); } catch (e) { /* ignore */ } requestAnimationFrame(() => celebrate(() => $('#view .card.water'))); }
  }

  /* ---------- Repas favoris ---------- */
  const strip = e => { const { id, t, meal, ...rest } = e; return rest; };
  function saveFav(k, meal) {
    const es = (S.days[k]?.entries || []).filter(e => e.meal === meal);
    if (!es.length) return;
    const name = prompt('Nom de ce repas favori', `${mealName(meal)} ${es.length > 1 ? 'habituel' : '· ' + es[0].name}`);
    if (!name || !name.trim()) return;
    S.favs.unshift({ id: uid(), name: name.trim(), meal, items: es.map(strip) }); Store.put('favs', S.favs);
    toast('Repas favori enregistré ⭐');
  }
  function addFav(fav, k, meal) {
    if (isLocked(k)) { toast('Journée validée : rouvre-la pour ajouter'); return; }
    const d = getDay(k), now = Date.now();
    fav.items.forEach((it, i) => d.entries.push({ ...it, id: uid(), meal, t: now + i }));
    saveDay(k); UI.date = k; UI.tab = 'journal';
    const kc = fav.items.reduce((a, x) => a + (x.kcal || 0), 0), p = fav.items.reduce((a, x) => a + (x.p || 0), 0);
    return `${fav.name} ajouté · ${r0(kc)} kcal · ${r0(p)} g prot.`;
  }
  const favTotals = f => ({ kcal: f.items.reduce((a, x) => a + (x.kcal || 0), 0), p: f.items.reduce((a, x) => a + (x.p || 0), 0) });
  // Section affichée en haut de l'écran « Ajouter »
  const favsHTML = () => S.favs.length ? `<h3>⭐ Repas favoris</h3><section class="card list">${S.favs.map((f, i) => { const t = favTotals(f); return `<div class="item fav-item"><button class="grow fav-add" data-fav="${i}"><div class="name">${esc(f.name)}</div><div class="sub">${f.items.length} aliment${f.items.length > 1 ? 's' : ''} · ${r0(t.kcal)} kcal · ${r0(t.p)} g prot.</div></button><button class="icon-btn" data-fav-del="${i}" aria-label="Supprimer ce favori">${ICON.close}</button></div>`; }).join('')}</section>` : '';
  function favClick(e, ctx, close) {
    const del = e.target.closest('[data-fav-del]');
    if (del) { const f = S.favs[+del.dataset.favDel]; if (f && confirm(`Supprimer le favori « ${f.name} » ?`)) { S.favs.splice(+del.dataset.favDel, 1); Store.put('favs', S.favs); return 'redraw'; } return true; }
    const add = e.target.closest('[data-fav]');
    if (add) { const msg = addFav(S.favs[+add.dataset.fav], ctx.date, ctx.meal); if (msg) close(msg); return true; }
    return false;
  }

  /* ---------- Coach du jour ---------- */
  function suggestions(remK, remP, k) {
    const seen = new Set(), pool = [];
    for (const f of [...S.recents, ...S.foods]) {
      const key = (f.code || f.id || f.name) + '|' + f.name; if (seen.has(key) || !f.per100) continue; seen.add(key);
      if (f.per100.p < 8 || f.per100.kcal <= 0) continue;
      const g = f.lastGrams || (f.unit ? f.unit.g : 100), kc = f.per100.kcal * g / 100, p = f.per100.p * g / 100;
      if (kc > remK + 60 || p < 8) continue;
      pool.push({ f, g, kc, p, d: f.per100.p / f.per100.kcal });
    }
    return pool.sort((a, b) => b.d - a.d).slice(0, 3);
  }
  function coachCard(k) {
    if (k !== today() || isLocked(k)) return '';
    const g = goals(), t = dayTotals(k), remK = g.kcal - t.kcal, remP = g.protein - t.p, h = new Date().getHours();
    const water = S.days[k]?.water || 0, supps = S.supps.filter(x => !S.days[k]?.supps?.[x.id]);
    const tips = [];
    if (!t.n) tips.push(h < 11 ? `Bonne journée ! Un petit-déjeuner riche en protéines (skyr, œufs, whey) cale jusqu'à midi.` : `Rien de saisi pour l'instant : ajoute ce que tu as mangé pour garder un bilan juste.`);
    else if (remK < 0) tips.push(`Tu dépasses de <b>${r0(-remK)} kcal</b>. Pas grave : 30 min de marche rapide ≈ 150 kcal, et demain on repart propre.`);
    else if (remP > 10) tips.push(`Il te reste <b>${r0(remP)} g de protéines</b> pour <b>${r0(remK)} kcal</b>. ${remP / Math.max(1, remK) > 0.12 ? 'Vise des aliments très protéinés et peu caloriques.' : 'Tu as de la marge.'}`);
    else tips.push(`Protéines atteintes 💪 Il te reste <b>${r0(Math.max(0, remK))} kcal</b> à répartir.`);
    const ql = K.Nu?.coachLine(k); if (ql) tips.push(ql);
    const wl = K.Wc?.coachLine(); if (wl && t.n) tips.splice(1, 0, wl); else if (wl) tips.unshift(wl);
    if (h >= 14 && water < waterGoal() * 0.5) tips.push(`Pense à boire : seulement ${r1(water / 1000)} L aujourd'hui.`);
    if (h >= 12 && supps.length) tips.push(`Compléments à prendre : ${supps.slice(0, 3).map(x => esc(x.name)).join(', ')}${supps.length > 3 ? '…' : ''}.`);
    const sug = remP > 10 && remK > 80 ? suggestions(remK, remP, k) : [];
    // seule la phrase principale est visible ; rappels et idées d'aliments dans un menu déroulant
    const more = tips.slice(1), n = sug.length + more.length, open = !!UI.coachOpen;
    return `<section class="card coach ${open ? 'open' : ''}"><div class="card-title">🧠 Coach du jour</div>
      <p class="coach-tip">${tips[0]}</p>
      ${n ? `<button class="coach-more" data-action="coach-toggle" aria-expanded="${open}"><span>${sug.length ? `${sug.length} idée${sug.length > 1 ? 's' : ''} d'aliments` : 'Rappels'}${sug.length && more.length ? ' et rappels' : ''}</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="coach-drop"><div class="coach-drop-in">
        ${more.map(x => `<p class="coach-tip small">${x}</p>`).join('')}
        ${sug.length ? `<div class="coach-sug"><span class="muted small">Idées tirées de tes aliments :</span>${sug.map((s, i) => `<button class="coach-food" data-action="coach-add" data-i="${i}"><b>${esc(s.f.name)}</b><span class="num">${r0(s.g)} g · +${r0(s.p)} g prot. · ${r0(s.kc)} kcal</span><i>+</i></button>`).join('')}</div>` : ''}
      </div></div>` : ''}
    </section>`;
  }
  let lastSug = [];
  const coachAdd = i => { const s = lastSug[i]; if (s) openDetail(s.f, { meal: guessMeal(), date: today(), grams: s.g }); };

  /* ---------- Séries ---------- */
  const logged = k => (S.days[k]?.entries?.length || 0) > 0;
  function streak(test) {
    let d = new Date(), n = 0;
    if (!test(dkey(d))) d = addDays(d, -1);
    while (test(dkey(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function bestStreak(test) {
    const ks = Object.keys(S.days).sort(); let best = 0, cur = 0, prev = null;
    for (const k of ks) { if (!test(k)) { cur = 0; prev = k; continue; } cur = prev && dkey(addDays(dparse(prev), 1)) === k && cur ? cur + 1 : 1; prev = k; best = Math.max(best, cur); }
    return best;
  }
  const protHit = k => { const d = S.days[k]; if (!logged(k)) return false; const g = d.goal || goals(); return dayTotals(k).p >= g.protein; };
  const kcalOk = k => { const d = S.days[k]; if (!logged(k) || (k === today() && !d.validated)) return false; const g = d.goal || goals(); return dayTotals(k).kcal <= g.kcal; };
  const waterHit = k => (S.days[k]?.water || 0) >= waterGoal();
  const suppsAll = k => S.supps.length > 0 && S.supps.every(x => S.days[k]?.supps?.[x.id]);

  /* ---------- Trophées ---------- */
  function data() {
    const ks = Object.keys(S.days), lg = ks.filter(logged);
    const ws = sortedWeights(), lost = ws.length ? Math.max(0, ws[0].kg - currentWeight()) : 0;
    const deficit = lg.filter(k => k < today()).reduce((a, k) => a + Math.max(0, dayBurn(k).v - dayTotals(k).kcal), 0);
    const mu = Mu.stats ? Mu.stats() : { n: 0, streak: 0, volume: 0, prs: 0 };
    return {
      logged: lg.length, best: bestStreak(logged), protDays: lg.filter(protHit).length, valid: ks.filter(k => S.days[k].validated).length,
      deficit, lost, waterDays: ks.filter(waterHit).length, suppDays: ks.filter(suppsAll).length, scans: lg.some(k => S.days[k].entries.some(e => e.src === 'off')) ? 1 : 0,
      favs: S.favs.length, mu, target: S.profile?.target && currentWeight() <= S.profile.target ? 1 : 0, ai: lg.some(k => S.days[k].entries.some(e => e.src === 'ai')) ? 1 : 0,
    };
  }
  const BADGES = [
    ['first', '🍽️', 'Premier pas', 'Saisir ton premier aliment', d => [d.logged, 1]],
    ['scan', '📷', 'Scanner fou', 'Scanner un produit', d => [d.scans, 1]],
    ['ai', '✨', 'Œil de lynx', 'Estimer un plat avec la Photo IA', d => [d.ai, 1]],
    ['streak3', '🔥', 'Lancé', '3 jours de suite saisis', d => [d.best, 3]],
    ['streak7', '🔥', 'Semaine parfaite', '7 jours de suite saisis', d => [d.best, 7]],
    ['streak30', '🌋', 'Inarrêtable', '30 jours de suite saisis', d => [d.best, 30]],
    ['prot7', '💪', 'Bâtisseur', 'Objectif protéines atteint 7 jours', d => [d.protDays, 7]],
    ['prot30', '🦾', 'Machine à protéines', 'Objectif protéines atteint 30 jours', d => [d.protDays, 30]],
    ['valid1', '✅', 'Mission accomplie', 'Valider une journée', d => [d.valid, 1]],
    ['valid14', '🏅', 'Discipline', 'Valider 14 journées', d => [d.valid, 14]],
    ['def1', '🔻', 'Premier kilo brûlé', 'Cumuler 7 700 kcal de déficit (≈ 1 kg de graisse)', d => [Math.round(d.deficit), 7700]],
    ['def5', '🧨', 'Fournaise', 'Cumuler 38 500 kcal de déficit (≈ 5 kg)', d => [Math.round(d.deficit), 38500]],
    ['kg2', '📉', 'Ça bouge', 'Perdre 2 kg sur la balance', d => [r1(d.lost), 2]],
    ['kg5', '🏆', 'Transformation', 'Perdre 5 kg sur la balance', d => [r1(d.lost), 5]],
    ['kg10', '👑', 'Légende', 'Perdre 10 kg sur la balance', d => [r1(d.lost), 10]],
    ['goal', '🎯', 'Objectif atteint', 'Atteindre ton poids objectif', d => [d.target, 1]],
    ['water7', '💧', 'Hydraté', 'Objectif d\'eau atteint 7 jours', d => [d.waterDays, 7]],
    ['supp7', '💊', 'Rigoureux', 'Tous tes compléments pris 7 jours', d => [d.suppDays, 7]],
    ['fav', '⭐', 'Habitudes', 'Enregistrer un repas favori', d => [d.favs, 1]],
    ['gym1', '🏋️', 'Première séance', 'Terminer une séance de muscu', d => [d.mu.n, 1]],
    ['gym10', '🦍', 'Habitué de la salle', 'Terminer 10 séances', d => [d.mu.n, 10]],
    ['gym50', '⚡', 'Monstre', 'Terminer 50 séances', d => [d.mu.n, 50]],
    ['pr', '🥇', 'Record battu', 'Battre un record personnel', d => [d.mu.prs, 1]],
    ['weeks4', '📅', 'Régularité', '4 semaines d\'affilée avec au moins une séance', d => [d.mu.streak, 4]],
  ];
  const evalBadges = () => { const d = data(); return BADGES.map(([id, ico, name, desc, fn]) => { const [cur, tgt] = fn(d); return { id, ico, name, desc, cur: Math.min(+cur, tgt), tgt, ok: +cur >= tgt }; }); };
  let checking = false;
  function checkBadges(sheetsOpen) {
    return; // trophées retirés de l'appli (v3.9.2)
    if (!S.profile || checking) return;
    const list = evalBadges(), seen = new Set(S.badges || []);
    const fresh = list.filter(b => b.ok && !seen.has(b.id));
    if (!fresh.length) return;
    const first = !S.badgesInit;
    if (sheetsOpen && !first) return; // on attend que les écrans soient fermés pour fêter ça
    S.badges = [...seen, ...fresh.map(b => b.id)]; Store.put('badges', S.badges);
    if (first) { S.badgesInit = true; Store.put('badgesInit', true); if (fresh.length > 3 || sheetsOpen) return; } // installation : pas d'avalanche
    checking = true;
    setTimeout(() => { checking = false; showUnlock(fresh); }, 700);
  }
  function showUnlock(fresh) {
    const sh = makeSheet(fresh.length > 1 ? `${fresh.length} trophées débloqués !` : 'Trophée débloqué !');
    sh.setBody(`<div class="unlock">${fresh.map(b => `<div class="unlock-badge"><span class="ico">${b.ico}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div>`);
    sh.setFoot('<button class="btn grow" data-a="ok">Trop fort 🔥</button>');
    sh.foot.onclick = () => closeSheet(1);
    openSheet(sh.el);
    setTimeout(() => celebrate(() => $('.sheet:last-child .unlock-badge')), 250);
  }

  /* ---------- Vue « Trophées & séries » (onglet Progrès) ---------- */
  function trophiesHTML() {
    const sLog = streak(logged), sProt = streak(protHit), sKcal = streak(kcalOk);
    return `<div class="section-title"><h2>Séries</h2></div>
      <div class="streaks">
        <div class="streak ${sLog ? 'on' : ''}"><span class="fl">🔥</span><b class="num">${sLog}</b><small>jour${sLog > 1 ? 's' : ''} saisis</small></div>
        <div class="streak ${sProt ? 'on' : ''}"><span class="fl">💪</span><b class="num">${sProt}</b><small>jour${sProt > 1 ? 's' : ''} protéines ✓</small></div>
        <div class="streak ${sKcal ? 'on' : ''}"><span class="fl">🎯</span><b class="num">${sKcal}</b><small>jour${sKcal > 1 ? 's' : ''} sous l'objectif</small></div>
      </div>`;
  }
  const badgeInfo = id => { const b = evalBadges().find(x => x.id === id); if (b) toast(`${b.ico} ${b.name} : ${b.desc}${b.ok ? ' · débloqué ✓' : ` · ${r0(b.cur)} / ${r0(b.tgt)}`}`, 3200); };

  /* ---------- Bilan de la semaine ---------- */
  function weekHTML() {
    // 7 derniers jours complets (hier et avant) ; aujourd'hui compte seulement s'il est validé
    const t0 = isLocked(today()) ? 0 : 1, ks = Array.from({ length: 7 }, (_, i) => dkey(addDays(new Date(), -6 - t0 + i)));
    const lg = ks.filter(logged);
    if (lg.length < 2) return '';
    const g = goals(), tot = lg.map(k => ({ k, t: dayTotals(k), g: S.days[k].goal || g }));
    const avgK = tot.reduce((a, x) => a + x.t.kcal, 0) / lg.length, pHit = tot.filter(x => x.t.p >= x.g.protein).length, kOk = tot.filter(x => x.t.kcal <= x.g.kcal).length;
    const def = tot.reduce((a, x) => a + (dayBurn(x.k).v - x.t.kcal), 0);
    const daily = tot.map(x => 50 * Math.min(1, x.t.p / x.g.protein) + 50 * (x.t.kcal <= x.g.kcal ? 1 : Math.max(0, 1 - (x.t.kcal - x.g.kcal) / x.g.kcal * 4)));
    const score = Math.round(daily.reduce((a, b) => a + b, 0) / daily.length * (0.6 + 0.4 * lg.length / 7));
    const grade = score >= 90 ? ['S', 'Exceptionnel'] : score >= 80 ? ['A', 'Excellent'] : score >= 65 ? ['B', 'Solide'] : score >= 50 ? ['C', 'Correct'] : ['D', 'À relancer'];
    const ws = sortedWeights(), w0 = ws.filter(w => w.date <= ks[0]).pop() || ws.find(w => w.date >= ks[0]), w1 = ws[ws.length - 1];
    const dW = w0 && w1 && w1.date > w0.date ? w1.kg - w0.kg : null;
    const mu = Mu.stats ? Mu.stats(7) : { week: 0 };
    // mini-courbes : calories par jour, graisse estimée cumulée, pesées de la semaine
    // mini-graphique : aire dégradée + courbe monotone (pas de vagues qui dépassent les vraies valeurs)
    const spark = (vals, cls, id) => {
      const v = vals.filter(x => x != null); if (v.length < 2) return '<i class="wk-spark-empty"></i>';
      const lo = Math.min(...v), hi = Math.max(...v), W = 100, H = 24, sp = hi - lo || 1;
      const pts = vals.map((x, i) => x == null ? null : [i / (vals.length - 1) * W, 3 + (1 - (x - lo) / sp) * (H - 6)]).filter(Boolean);
      const n = pts.length, dx = [], m = [], tg = [];
      for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
      tg[0] = m[0]; tg[n - 1] = m[n - 2];
      for (let i = 1; i < n - 1; i++) tg[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
      for (let i = 0; i < n - 1; i++) { if (!m[i]) { tg[i] = tg[i + 1] = 0; continue; } const a = tg[i] / m[i], b = tg[i + 1] / m[i], h = a * a + b * b; if (h > 9) { const t = 3 / Math.sqrt(h); tg[i] = t * a * m[i]; tg[i + 1] = t * b * m[i]; } }
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + tg[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - tg[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`; }
      const area = `${d}L${pts[n - 1][0].toFixed(1)},${H}L${pts[0][0].toFixed(1)},${H}Z`;
      return `<svg class="wk-spark ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="a0"/><stop offset="1" class="a1"/></linearGradient></defs><path d="${area}" fill="url(#${id})"/><path d="${d}" fill="none" class="ln" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
    };
    let cum = 0; const fatC = tot.map(x => (cum -= (dayBurn(x.k).v - x.t.kcal) / 7.7));
    const wSer = ks.map(k => ws.find(w => w.date === k)?.kg ?? null);
    const tone = grade[0] === 'S' || grade[0] === 'A' ? 'good' : grade[0] === 'B' ? 'mid' : grade[0] === 'C' ? 'warn' : 'bad';
    const C = 2 * Math.PI * 52, IC = {
      bolt: '<svg viewBox="0 0 24 24"><path d="M13.5 2.5L5 13.5h6l-1 8 8.5-11h-6z"/></svg>',
      flame: '<svg viewBox="0 0 24 24"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.2 1.6 1 2.6 2 3.1C10.8 8.7 11.2 5.6 12 3z"/></svg>',
      target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/></svg>',
      scale: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M8.5 9.5a4.8 4.8 0 0 1 7 0M12 9.6l1.6-2"/></svg>',
      body: '<svg viewBox="0 0 24 24"><path d="M8.5 4.5c1 1.2 2.1 1.7 3.5 1.7s2.5-.5 3.5-1.7l4 2.5-1.8 3.5-2-1V20h-7.4V9.5l-2 1L4.5 7z"/><path d="M10 13h4"/></svg>',
      dumbbell: '<svg viewBox="0 0 24 24"><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>',
      bars: '<svg viewBox="0 0 24 24"><rect x="3.5" y="13" width="4" height="7" rx="1"/><rect x="10" y="8.5" width="4" height="11.5" rx="1"/><rect x="16.5" y="4" width="4" height="16" rx="1"/></svg>',
      star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/></svg>',
    };
    return `<section class="card week wk2">
      <div class="wk-head"><span class="wk-logo">${IC.bars}</span><div class="card-title">Bilan des 7 derniers jours</div><button class="wk-gear" data-action="week-info" aria-label="Comment est calculé le bilan">${ICON.gear}</button></div>
      <div class="wk-top">
        <div class="wk-ring"><svg viewBox="0 0 120 120"><defs><linearGradient id="wkRing" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2F7BFF"/><stop offset=".55" stop-color="#22C7E8"/><stop offset="1" stop-color="#3BE38A"/></linearGradient></defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(80,140,255,.12)" stroke-width="10"/>
          <circle class="arc" cx="60" cy="60" r="52" fill="none" stroke="url(#wkRing)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(score / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>
          <circle cx="60" cy="60" r="40" fill="rgba(8,14,30,.85)" stroke="rgba(90,150,255,.18)" stroke-width="1"/></svg>
          <div><b>${grade[0]}</b><small class="num">${score}/100</small></div></div>
        <div class="grow"><span class="wk-badge ${tone}">${IC.star}${grade[1]}</span>
          <p class="wk-desc">Score = protéines atteintes (${pHit}/${lg.length}) + calories tenues (${kOk}/${lg.length}), pondéré par le nombre de jours saisis (${lg.length}/7).</p></div>
      </div>
      <div class="wk-tiles">
        <div class="wk-tile"><div class="wk-l"><span class="wk-ico flame">${IC.flame}</span><b class="num">${r0(avgK)}</b></div><small>kcal / jour</small>${spark(tot.map(x => x.t.kcal), 'blue', 'spK')}</div>
        <div class="wk-tile"><div class="wk-l"><span class="wk-ico bolt">${IC.bolt}</span><b class="num ${def >= 0 ? '' : 'over-text'}">${def >= 0 ? '−' : '+'}${r0(Math.abs(def) / lg.length)}</b></div><small>kcal / jour ${def >= 0 ? 'de déficit' : "d'excédent"}</small>${spark(tot.map(x => dayBurn(x.k).v - x.t.kcal), 'cyan', 'spD')}</div>
        <div class="wk-tile"><div class="wk-l"><span class="wk-ico scale">${IC.scale}</span><b class="num ${def >= 0 ? '' : 'over-text'}">${def >= 0 ? '−' : '+'}${r0(Math.abs(def) / 7.7)} g</b></div><small>graisse estimée</small>${spark(fatC, 'green', 'spF')}</div>
        <div class="wk-tile"><div class="wk-l"><span class="wk-ico body">${IC.body}</span><b class="num">${dW == null ? '–' : (dW > 0 ? '+' : dW < 0 ? '−' : '') + String(r1(Math.abs(dW))).replace('.', ',') + ' kg'}</b></div><small>sur la balance</small>${spark(wSer, 'purple', 'spW')}</div>
      </div>
      <button class="wk-row" data-tab="muscu"><span class="wk-ico dumb">${IC.dumbbell}</span><b class="num">${mu.week ?? 0}</b><small>séance${(mu.week || 0) > 1 ? 's' : ''} de muscu</small><span class="wk-chev">${ICON.right}</span></button>
    </section>`;
  }

  /* ---------- Rappel de sauvegarde ---------- */
  function backupCard() {
    const m = S.meta || {}, nLogged = Object.keys(S.days).filter(logged).length;
    if (nLogged < 5) return '';
    const since = m.lastExport ? (Date.now() - m.lastExport) / DAY : Infinity;
    if (since < 14 || (m.snooze && m.snooze > Date.now())) return '';
    return `<section class="card backup"><div class="row" style="gap:12px;align-items:flex-start"><span class="ico">🛟</span><div class="grow"><b>Sauvegarde tes données</b><p class="small muted" style="margin:4px 0 10px">${m.lastExport ? `Dernière sauvegarde il y a ${Math.floor(since)} jours.` : 'Tu n\'as encore jamais sauvegardé.'} Sur iPhone, supprimer l'app efface tout : garde une copie.</p>
      <div class="row" style="gap:8px"><button class="btn small" data-action="export">Sauvegarder</button><button class="btn plain small" data-action="backup-later">Plus tard</button></div></div></div></section>`;
  }
  const markExport = () => { S.meta = { ...(S.meta || {}), lastExport: Date.now() }; Store.put('meta', S.meta); };

  /* ---------- Série affichée dans l'accueil ---------- */
  const streakChip = () => { const n = streak(logged); return n >= 2 ? `<span class="streak-chip">🔥 ${n} jours de suite</span>` : ''; };

  const actions = {
    water: b => addWater(UI.date, +b.dataset.v),
    'fav-save': b => saveFav(UI.date, b.dataset.meal),
    'coach-add': b => coachAdd(+b.dataset.i),
    'week-info': () => toast('Score /100 : chaque jour saisi vaut 50 pts si les protéines sont atteintes et 50 pts si les calories restent sous l\'objectif ; la moyenne est pondérée par le nombre de jours saisis sur 7. S ≥ 90, A ≥ 80, B ≥ 65, C ≥ 50.', 6000),
    'coach-toggle': b => { UI.coachOpen = !UI.coachOpen; const c = b.closest('.coach'); c?.classList.toggle('open', UI.coachOpen); b.setAttribute('aria-expanded', UI.coachOpen); },
    badge: b => badgeInfo(b.dataset.id),
    'backup-later': () => { S.meta = { ...(S.meta || {}), snooze: Date.now() + 7 * DAY }; Store.put('meta', S.meta); render(); },
  };
  return {
    waterCard, coachCard: k => { const h = coachCard(k); const g = goals(), t = dayTotals(k); lastSug = h.includes('coach-food') ? suggestions(g.kcal - t.kcal, g.protein - t.p, k) : []; return h; },
    favsHTML, favClick, trophiesHTML, weekHTML, backupCard, streakChip, checkBadges, markExport, actions,
    onLoad(all) { S.favs = all.favs || []; S.badges = all.badges || []; S.badgesInit = !!all.badgesInit; S.meta = all.meta || {}; },
  };
};
