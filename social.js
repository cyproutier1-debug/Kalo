/* Kalo — onglet Social : amis, résumés de nutrition et d'entraînement.
   Serveur : Supabase (auth anonyme + PostgREST), appelé en fetch simple, sans bibliothèque.
   Partagé (si activé) : pseudo, photo de profil, % calories/protéines vs objectif, score qualité, séries,
   séances (nom, durée, volume, muscles, records), évolution du poids en %. Jamais : kg, aliments, photo objectif. */
window.KaloSocialInit = function (K) {
  const { $, esc, r0, r1, cap, dkey, addDays, today, F, S, UI, Store, toast, render, makeSheet, openSheet, closeSheet, goals, dayTotals, currentWeight, sortedWeights, Mu, Nu, progColor } = K;
  // Projet Supabase de Kalo (URL + clé publique « anon » : publique par conception, la sécurité vient des règles RLS de schema.sql)
  const CFG = window.KALO_SOCIAL_CFG || { url: '', key: '' };
  const ready = () => !!(CFG.url && CFG.key);
  const SO = () => S.social || (S.social = {});
  const save = () => Store.put('social', S.social);
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CODE_CHARS[b % CODE_CHARS.length]).join('');

  /* ---------- Réseau ---------- */
  async function req(path, { method = 'GET', body, auth = true, prefer } = {}) {
    const h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (auth) { await ensureFresh(); h.Authorization = 'Bearer ' + SO().session.access_token; }
    if (prefer) h.Prefer = prefer;
    let r = await fetch(CFG.url + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
    if (r.status === 401 && auth) { await refresh(true); h.Authorization = 'Bearer ' + SO().session.access_token; r = await fetch(CFG.url + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) { j = txt; }
    if (!r.ok) { const m = (j && (j.message || j.msg || j.error_description || j.error)) || 'HTTP ' + r.status; const err = new Error(m); err.status = r.status; throw err; }
    return j;
  }
  const setSession = j => { SO().session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user_id: j.user?.id || SO().session?.user_id }; save(); };
  async function refresh(force) {
    const s = SO().session; if (!s) throw new Error('non connecté');
    if (!force && s.expires_at - Date.now() > 60000) return;
    const j = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token }, auth: false });
    setSession(j);
  }
  const ensureFresh = () => refresh(false);
  const rpc = (fn, args) => req('/rest/v1/rpc/' + fn, { method: 'POST', body: args || {} });

  /* ---------- Résumé partagé ---------- */
  function smallAvatar() {
    return new Promise(res => {
      if (!S.avatar) return res(null);
      const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(i, 0, 0, 96, 96); res(c.toDataURL('image/jpeg', 0.8)); }; i.onerror = () => res(null); i.src = S.avatar;
    });
  }
  function buildSnapshot() {
    const g = goals(), days = [];
    for (let i = 13; i >= 0; i--) {
      const k = dkey(addDays(new Date(), -i)), d = S.days[k], n = d?.entries?.length || 0;
      if (!n) { days.push({ d: k }); continue; }
      const t = dayTotals(k), q = Nu.dayQuality(k);
      days.push({ d: k, kp: Math.round(t.kcal / g.kcal * 100), pp: Math.round(t.p / g.protein * 100), q: Nu.scoreOf(q), v: !!d.validated, w: d.water ? Math.round(d.water / (Math.max(1500, Math.round((currentWeight() || 70) * 35 / 250) * 250)) * 100) : 0 });
    }
    const run = test => { let n = 0; for (let i = days.length - 1; i >= 0; i--) { if (test(days[i])) n++; else if (i === days.length - 1) continue; else break; } return n; };
    const ws = sortedWeights(), p = S.profile || {}, now = ws[ws.length - 1];
    let weight = null;
    if (ws.length >= 2 && now) {
      const first = ws[0], m30 = ws.filter(w => w.date >= dkey(addDays(new Date(), -30)))[0] || first;
      const path = p.target && first.kg !== p.target ? Math.max(0, Math.min(100, (first.kg - now.kg) / (first.kg - p.target) * 100)) : null;
      const pct = (x, y) => Math.round((x - y) / y * 1000) / 10;
      weight = { tot: pct(now.kg, first.kg), m30: pct(now.kg, m30.kg), path: path == null ? null : Math.round(path), since: first.date };
    }
    const mu = Mu.stats ? Mu.stats(7) : {};
    return { v: 1, days, streak: run(x => x.kp != null), protStreak: run(x => x.pp >= 95), weight, wo: Mu.socialSummary ? Mu.socialSummary(14) : [], woStreak: mu.streak || 0, badges: (S.badges || []).length };
  }
  let upT = 0, upBusy = false;
  async function upload(force) {
    const so = SO(); if (!ready() || !so.session || !so.joined || so.paused) return;
    const data = buildSnapshot(), hash = JSON.stringify(data);
    if (!force && hash === so.lastHash) return;
    if (upBusy) return; upBusy = true;
    try {
      await req('/rest/v1/snapshots?on_conflict=user_id', { method: 'POST', body: { user_id: so.session.user_id, data, updated_at: new Date().toISOString() }, prefer: 'resolution=merge-duplicates,return=minimal' });
      so.lastHash = hash; so.lastUp = Date.now(); save();
    } catch (e) { /* hors ligne : on réessaiera */ } finally { upBusy = false; }
  }
  const schedule = () => { clearTimeout(upT); upT = setTimeout(() => upload(false), 8000); };

  // messages compréhensibles pour les erreurs de configuration du serveur
  function explain(e) {
    const m = String(e?.message || e);
    if (/anonymous.*(disabled|not enabled)|signups not allowed|signup.*disabled/i.test(m)) return 'Serveur : connexion anonyme désactivée (Supabase → Authentication → Sign In / Providers → « Allow anonymous sign-ins »)';
    if (/PGRST20[25]|does not exist|schema cache|relation/i.test(m)) return 'Serveur : tables absentes (Supabase → SQL Editor → exécuter schema.sql)';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Serveur injoignable (' + m + ') : touche « Tester la connexion au serveur » pour le détail';
    if (/invalid api key|apikey|No API key/i.test(m)) return 'Serveur : clé publique invalide';
    return 'Activation impossible : ' + m;
  }
  /* ---------- Amis ---------- */
  let loading = false;
  async function loadFriends() {
    const so = SO(); if (!ready() || !so.joined) return;
    loading = true;
    try {
      const fr = await req('/rest/v1/friendships?select=b,created_at&order=created_at.asc');
      const ids = (fr || []).map(x => x.b);
      let profs = [], snaps = [];
      if (ids.length) {
        const inList = `in.(${ids.join(',')})`;
        [profs, snaps] = await Promise.all([req(`/rest/v1/profiles?select=id,name,avatar&id=${inList}`), req(`/rest/v1/snapshots?select=user_id,data,updated_at&user_id=${inList}`)]);
      }
      so.friends = ids.map(id => { const p = profs.find(x => x.id === id) || {}, s = snaps.find(x => x.user_id === id); return { id, name: p.name || 'Ami', avatar: p.avatar || null, data: s?.data || null, at: s ? Date.parse(s.updated_at) : 0 }; });
      so.loadedAt = Date.now(); save();
    } catch (e) { if (e.status !== 401) toast('Social hors ligne : affichage de la dernière mise à jour'); }
    loading = false;
    if (UI.tab === 'social') render();
  }

  /* ---------- Inscription / compte ---------- */
  async function join(name) {
    const so = SO();
    if (!so.session) { const j = await req('/auth/v1/signup', { method: 'POST', body: { data: {} }, auth: false }); if (!j.access_token) throw new Error('Connexion anonyme désactivée dans Supabase'); setSession(j); }
    const avatar = await smallAvatar();
    for (let i = 0; i < 4; i++) {
      const code = newCode();
      try { await req('/rest/v1/profiles?on_conflict=id', { method: 'POST', body: { id: so.session.user_id, code, name, avatar }, prefer: 'resolution=merge-duplicates,return=minimal' }); so.code = code; break; }
      catch (e) { if (!/duplicate|unique|23505/i.test(e.message) || i === 3) throw e; }
    }
    Object.assign(so, { joined: true, name, paused: false, lastHash: '' }); save();
    await upload(true);
  }
  async function updateProfile(fields) { await req(`/rest/v1/profiles?id=eq.${SO().session.user_id}`, { method: 'PATCH', body: fields, prefer: 'return=minimal' }); }
  async function addFriend(code) {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 6) { toast('Un code ami fait 6 caractères'); return false; }
    if (c === SO().code) { toast("C'est ton propre code 😄"); return false; }
    try { const r = await rpc('add_friend', { p_code: c }); toast(`${r?.name || 'Ami'} ajouté 🤝`); await loadFriends(); return true; }
    catch (e) { toast(/inconnu/.test(e.message) ? 'Code inconnu : vérifie les 6 caractères' : /limite/.test(e.message) ? 'Limite de 50 amis atteinte' : 'Impossible d\'ajouter : ' + e.message); return false; }
  }

  /* ---------- Rendu ---------- */
  const ICO = {
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.9-3.6 3.4-5.5 6.5-5.5s5.6 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.7"/><path d="M16.5 14.6c2.6.1 4.3 1.8 5 4.9"/></svg>',
  };
  const ago = t => { if (!t) return 'jamais synchronisé'; const m = Math.round((Date.now() - t) / 60000); return m < 2 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
  const avatarHTML = (src, name, cls = '') => src ? `<span class="so-av ${cls}" style="background-image:url('${src}')"></span>` : `<span class="so-av ${cls} ini">${esc((name || '?').trim().charAt(0).toUpperCase())}</span>`;
  const kcColor = kp => kp == null ? 'rgba(255,255,255,.12)' : kp <= 105 && kp >= 80 ? '#2EE68A' : kp <= 115 && kp >= 60 ? '#FFB020' : '#FF4D4F';
  const todayOf = data => (data?.days || []).find(x => x.d === today()) || null;
  function weekStats(data) {
    const ds = (data?.days || []).slice(-7), logged = ds.filter(x => x.kp != null);
    const wo = (data?.wo || []).filter(w => w.t >= Date.now() - 7 * 864e5);
    return { logged: logged.length, inTarget: logged.filter(x => x.kp >= 80 && x.kp <= 105).length, prot: logged.filter(x => x.pp >= 95).length, q: logged.length ? Math.round(logged.reduce((a, x) => a + (x.q || 0), 0) / logged.length) : null, sessions: wo.length, vol: wo.reduce((a, w) => a + w.vol, 0) };
  }
  // points de la semaine : régularité plutôt que performance (personne n'est récompensé pour manger moins)
  const weekPoints = st => st.logged * 2 + st.inTarget * 3 + st.prot * 3 + st.sessions * 5 + Math.round((st.q || 0) / 20);
  function friendCard(f, i) {
    const t = todayOf(f.data), st = weekStats(f.data), last = f.data?.wo?.[0];
    return `<button class="card so-friend" data-action="so-friend" data-i="${i}">
      <div class="so-row">${avatarHTML(f.avatar, f.name)}<div class="grow"><div class="so-name">${esc(f.name)}</div><div class="muted small">${f.data ? `mis à jour ${ago(f.at)}` : 'pas encore de données'}</div></div>${f.data?.streak >= 2 ? `<span class="so-streak">🔥 ${f.data.streak}</span>` : ''}</div>
      ${f.data ? `<div class="so-chips">
        <span class="so-chip" style="--c:${kcColor(t?.kp)}"><b class="num">${t?.kp != null ? t.kp + ' %' : '–'}</b>kcal du jour</span>
        <span class="so-chip" style="--c:${t?.pp >= 95 ? '#2EE68A' : t?.pp >= 60 ? '#FFB020' : 'rgba(255,255,255,.25)'}"><b class="num">${t?.pp != null ? (t.pp >= 95 ? '✓' : t.pp + ' %') : '–'}</b>protéines</span>
        <span class="so-chip" style="--c:${t?.q != null ? progColor(t.q / 100) : 'rgba(255,255,255,.25)'}"><b class="num">${t?.q ?? '–'}</b>qualité</span>
        <span class="so-chip" style="--c:#6E8BFF"><b class="num">${st.sessions}</b>séance${st.sessions > 1 ? 's' : ''} 7 j</span></div>
      ${last ? `<div class="so-last">🏋️ ${esc(last.name)} · ${cap(F.short.format(new Date(last.t)))} · ${r0(last.vol)} kg${last.prs?.length ? ` · 🏆 ${last.prs.length}` : ''}</div>` : ''}` : ''}
    </button>`;
  }
  function leaderboard(so) {
    const me = { name: so.name + ' (moi)', avatar: S.avatar ? null : null, me: true, st: weekStats(buildSnapshot()) };
    const rows = [me, ...(so.friends || []).filter(f => f.data).map(f => ({ name: f.name, avatar: f.avatar, st: weekStats(f.data) }))].map(r => ({ ...r, pts: weekPoints(r.st) })).sort((a, b) => b.pts - a.pts);
    if (rows.length < 2) return '';
    const medal = i => ['🥇', '🥈', '🥉'][i] || `<span class="num">${i + 1}</span>`;
    return `<section class="card so-board"><div class="row between"><div class="card-title">🏆 Classement 7 jours</div><button class="q-info-btn" data-action="so-board-info" aria-label="Comment sont calculés les points">i</button></div>
      ${rows.map((r, i) => `<div class="so-rank ${r.me ? 'me' : ''}"><span class="so-medal">${medal(i)}</span><div class="grow"><b>${esc(r.name)}</b><div class="muted small">${r.st.logged}/7 j saisis · ${r.st.prot} j protéines · ${r.st.sessions} séance${r.st.sessions > 1 ? 's' : ''}</div></div><b class="num so-pts">${r.pts} pts</b></div>`).join('')}</section>`;
  }
  function view() {
    const so = SO();
    if (!ready()) return `<h1>Social</h1><section class="card so-hero"><div class="so-hero-ico">${ICO.people}</div><h2>Bientôt disponible</h2><p class="muted">Le serveur du social n'est pas encore branché sur cette version de Kalo.</p></section>`;
    if (!so.joined) {
      const nm = so.name || S.profile?.name || '';
      return `<h1>Social</h1>
      <section class="card so-hero"><div class="so-hero-ico">${ICO.people}</div><h2>Progresse avec tes amis</h2><p class="muted">Ajoute tes amis avec leur code et suivez mutuellement votre régularité : nutrition, qualité et séances de salle.</p></section>
      <section class="card stack"><label class="field"><span>Ton pseudo</span><input type="text" maxlength="30" data-f="so-name" value="${esc(nm)}" placeholder="ex. Cyp"></label>
        <div class="so-share"><div><b>Ce que tes amis verront</b><ul><li>Pseudo et photo de profil</li><li>Calories et protéines en % de ton objectif</li><li>Score qualité, séries de jours</li><li>Séances : nom, durée, volume, muscles, records</li><li>Évolution du poids en % (jamais en kg)</li></ul></div>
        <div><b>Jamais partagé</b><ul><li>Ton poids en kg, ta taille, ton âge</li><li>Le détail de tes repas</li><li>Ta photo objectif</li></ul></div></div>
        <label class="so-consent"><input type="checkbox" data-f="so-ok"><span>J'accepte que ces résumés soient envoyés sur le serveur de Kalo et visibles par les amis que j'ajoute. Je peux mettre en pause ou tout supprimer à tout moment.</span></label>
        <button class="btn block" data-action="so-join">Activer le social</button>
        <button class="btn plain small" data-action="so-diag">🩺 Tester la connexion au serveur</button></section>`;
    }
    if (!so.loadedAt && !loading) setTimeout(loadFriends, 0);
    const fr = so.friends || [];
    return `<div class="row between"><h1>Social</h1><button class="icon-btn" data-action="so-settings" aria-label="Réglages du partage">${K.ICON.gear}</button></div>
      ${so.paused ? '<div class="so-paused">⏸ Partage en pause : tes amis voient ta dernière mise à jour. <button class="btn plain small" data-action="so-resume">Reprendre</button></div>' : ''}
      <section class="card glow so-me"><div class="so-row">${avatarHTML(S.avatar, so.name, 'big')}<div class="grow"><div class="muted small">Mon code ami</div><div class="so-code num">${esc(so.code || '')}</div><div class="muted small">Synchronisé ${ago(so.lastUp)}</div></div></div>
        <div class="grid2"><button class="btn" data-action="so-share">Partager</button><button class="btn outline" data-action="so-copy">Copier</button></div></section>
      <section class="card"><div class="so-add"><input type="text" maxlength="8" autocapitalize="characters" data-f="so-code" placeholder="Code de ton ami" value="${esc(UI.soPending || '')}"><button class="btn" data-action="so-add">Ajouter</button></div></section>
      ${leaderboard(so)}
      <div class="row between section-title"><h2>Mes amis${fr.length ? ` · ${fr.length}` : ''}</h2><button class="btn plain small" data-action="so-refresh">${loading ? 'Actualisation…' : '↻ Actualiser'}</button></div>
      ${fr.length ? fr.map(friendCard).join('') : '<div class="card empty small">Pas encore d\'amis. Partage ton code ou entre celui d\'un ami ci-dessus.</div>'}`;
  }

  /* ---------- Fiche d'un ami ---------- */
  function openFriend(f) {
    const d = f.data, sh = makeSheet(f.name);
    if (!d) { sh.setBody(`<div class="card empty">${esc(f.name)} n'a pas encore partagé de données.</div>`); }
    else {
      const st = weekStats(d), days = d.days || [];
      const W = 320, H = 120, bw = W / 14;
      const bars = days.map((x, i) => { const v = x.kp == null ? 0 : Math.min(140, x.kp); const h = v / 140 * (H - 18); return `<rect x="${i * bw + 3}" y="${H - 14 - h}" width="${bw - 6}" height="${Math.max(0, h)}" rx="3" fill="${kcColor(x.kp)}" opacity="${x.kp == null ? 0 : .9}"/>${x.pp >= 95 ? `<circle cx="${i * bw + bw / 2}" cy="${H - 4}" r="3" fill="#FFD23F"/>` : ''}`; }).join('');
      const band = `<rect x="0" y="${H - 14 - 105 / 140 * (H - 18)}" width="${W}" height="${25 / 140 * (H - 18)}" fill="rgba(46,230,138,.08)"/><line x1="0" x2="${W}" y1="${H - 14 - 100 / 140 * (H - 18)}" y2="${H - 14 - 100 / 140 * (H - 18)}" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>`;
      const w = d.weight;
      sh.setBody(`<section class="card so-head">${avatarHTML(f.avatar, f.name, 'big')}<div><div class="so-name big">${esc(f.name)}</div><div class="muted small">Mis à jour ${ago(f.at)}${d.streak >= 2 ? ` · 🔥 ${d.streak} jours de suite` : ''}</div></div></section>
        <section class="card"><div class="card-title">7 derniers jours</div><div class="so-stats">
          <div><b class="num">${st.logged}/7</b><span>jours saisis</span></div><div><b class="num">${st.inTarget}</b><span>dans l'objectif kcal</span></div>
          <div><b class="num">${st.prot}</b><span>protéines atteintes</span></div><div><b class="num">${st.q ?? '–'}</b><span>qualité moyenne</span></div>
          <div><b class="num">${st.sessions}</b><span>séances</span></div><div><b class="num">${r1(st.vol / 1000)} t</b><span>volume soulevé</span></div></div></section>
        <section class="card"><div class="card-title">Calories vs objectif · 14 jours</div><svg viewBox="0 0 ${W} ${H}" class="so-bars">${band}${bars}</svg>
          <div class="legend"><span><i style="background:#2EE68A"></i>80-105 %</span><span><i style="background:#FFB020"></i>écart modéré</span><span><i style="background:#FFD23F;border-radius:50%"></i>protéines ✓</span></div></section>
        ${w ? `<section class="card"><div class="card-title">Poids</div><div class="so-stats three"><div><b class="num ${w.m30 <= 0 ? 'good-text' : ''}">${w.m30 > 0 ? '+' : ''}${String(w.m30).replace('.', ',')} %</b><span>sur 30 jours</span></div><div><b class="num">${w.tot > 0 ? '+' : ''}${String(w.tot).replace('.', ',')} %</b><span>depuis le début</span></div><div><b class="num">${w.path != null ? w.path + ' %' : '–'}</b><span>du chemin vers l'objectif</span></div></div></section>` : ''}
        <section class="card"><div class="card-title">Séances récentes${d.woStreak >= 2 ? ` · ${d.woStreak} semaines d'affilée` : ''}</div>
          ${(d.wo || []).length ? d.wo.slice(0, 8).map(x => `<div class="so-wo"><div class="row between"><b>${esc(x.name)}</b><span class="muted small">${cap(F.short.format(new Date(x.t)))}</span></div>
            <div class="muted small">${x.min} min · ${x.sets} séries · ${r0(x.vol)} kg</div>${x.mus?.length ? `<div class="so-mus">${x.mus.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
            ${(x.prs || []).map(p => `<div class="so-pr">🏆 ${esc(p.ex)} : ${esc(p.txt)}</div>`).join('')}</div>`).join('') : '<div class="empty small">Aucune séance sur 14 jours.</div>'}</section>`);
    }
    sh.setFoot('<button class="btn danger" data-a="rm">Retirer cet ami</button><button class="btn grow" data-a="close">Fermer</button>');
    sh.foot.onclick = async e => { const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'close') closeSheet(1);
      if (a === 'rm' && confirm(`Retirer ${f.name} de tes amis ? Vous ne verrez plus vos progrès respectifs.`)) { try { await rpc('remove_friend', { p_id: f.id }); SO().friends = (SO().friends || []).filter(x => x.id !== f.id); save(); closeSheet(1, () => { render(); toast('Ami retiré'); }); } catch (err) { toast('Impossible : ' + err.message); } } };
    openSheet(sh.el);
  }

  function openSettings() {
    const so = SO(), sh = makeSheet('Réglages du partage');
    sh.setBody(`<section class="card stack"><label class="field"><span>Pseudo</span><input type="text" maxlength="30" data-f="nm" value="${esc(so.name || '')}"></label>
      <button class="btn outline" data-a="name">Enregistrer le pseudo et la photo de profil</button></section>
      <section class="card stack"><div class="row between"><div><b>Partage</b><div class="muted small">${so.paused ? 'En pause : plus rien n\'est envoyé.' : 'Actif : ton résumé se met à jour quand tu utilises Kalo.'}</div></div><button class="btn ${so.paused ? '' : 'outline'} small" data-a="pause">${so.paused ? 'Reprendre' : 'Mettre en pause'}</button></div></section>
      <section class="card stack"><div><b>Nouveau code ami</b><div class="muted small">L'ancien code ne marchera plus. Tes amis actuels restent.</div></div><button class="btn outline" data-a="code">Changer de code</button></section>
      <section class="card stack"><div><b>Supprimer mon compte social</b><div class="muted small">Efface du serveur ton profil, ton résumé et tes amitiés. Ton journal sur le téléphone n'est pas touché.</div></div><button class="btn danger" data-a="del">Tout supprimer du serveur</button></section>`);
    sh.setFoot('<button class="btn grow" data-a="close">Fermer</button>');
    const onClick = async e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      try {
        if (a === 'close') closeSheet(1);
        if (a === 'name') { const nm = $('[data-f="nm"]', sh.body).value.trim().slice(0, 30); if (!nm) { toast('Choisis un pseudo'); return; } await updateProfile({ name: nm, avatar: await smallAvatar() }); so.name = nm; save(); toast('Profil social mis à jour'); }
        if (a === 'pause') { so.paused = !so.paused; save(); if (!so.paused) await upload(true); closeSheet(1, () => { render(); toast(so.paused ? 'Partage en pause' : 'Partage repris'); }); }
        if (a === 'code') { if (!confirm('Changer de code ami ?')) return; for (let i = 0; i < 4; i++) { const c = newCode(); try { await updateProfile({ code: c }); so.code = c; save(); break; } catch (err) { if (i === 3) throw err; } } closeSheet(1, () => { render(); toast('Nouveau code : ' + so.code); }); }
        if (a === 'del') { if (!confirm('Supprimer ton compte social et toutes ses données du serveur ? Cette action est définitive.')) return; await rpc('delete_me'); S.social = { name: so.name }; save(); closeSheet(1, () => { render(); toast('Compte social supprimé'); }); }
      } catch (err) { toast('Erreur : ' + err.message); } };
    sh.body.addEventListener('click', onClick); sh.foot.addEventListener('click', onClick);
    openSheet(sh.el);
  }

  async function shareCode() {
    const so = SO(), link = `${location.origin}${location.pathname}?ami=${so.code}`, text = `Ajoute-moi sur Kalo 💪 Mon code ami : ${so.code}`;
    try { if (navigator.share) { await navigator.share({ title: 'Kalo', text, url: link }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(`${text}\n${link}`); toast('Lien copié'); } catch (e) { toast(so.code); }
  }

  /* Diagnostic : teste le serveur étape par étape et affiche les messages bruts */
  async function diagnose() {
    const sh = makeSheet('Test du serveur'), out = [];
    const line = (ok, t, d) => out.push(`<div class="so-diag ${ok === null ? '' : ok ? 'ok' : 'ko'}"><b>${ok === null ? '…' : ok ? '✓' : '✗'} ${esc(t)}</b>${d ? `<div class="muted small">${esc(d)}</div>` : ''}</div>`);
    const draw = () => sh.setBody(`<section class="card stack"><div class="muted small">Serveur : ${esc(CFG.url || '(non configuré)')}</div>${out.join('')}</section>`);
    sh.setFoot('<button class="btn grow" data-a="close">Fermer</button>'); sh.foot.onclick = () => closeSheet(1);
    draw(); openSheet(sh.el);
    const get = async path => { const r = await fetch(CFG.url + path, { headers: { apikey: CFG.key } }); const t = await r.text(); return { status: r.status, t }; };
    try { const r = await get('/auth/v1/health'); line(r.status < 500, 'Serveur joignable', `HTTP ${r.status} · ${r.t.slice(0, 120)}`); }
    catch (e) { line(false, 'Serveur injoignable', `${e.name}: ${e.message}. Ouvre ${CFG.url}/auth/v1/health dans Safari : si la page ne s'ouvre pas, l'adresse du projet est fausse ou un VPN / bloqueur / DNS filtrant bloque supabase.co.`); draw(); return; }
    draw();
    try { const r = await get('/auth/v1/settings'); let j = {}; try { j = JSON.parse(r.t); } catch (e) { /* ignore */ }
      const anon = j.external?.anonymous_users;
      line(r.status === 200 && anon !== false, 'Clé publique et connexion anonyme', r.status !== 200 ? `HTTP ${r.status} · ${r.t.slice(0, 160)}` : anon === false ? 'Connexion anonyme désactivée : Authentication → Sign In / Providers → « Allow anonymous sign-ins » → Save' : anon ? 'Connexion anonyme activée' : 'Clé acceptée');
    } catch (e) { line(false, 'Réglages du serveur', e.message); }
    draw();
    try { const r = await fetch(CFG.url + '/rest/v1/profiles?select=id&limit=1', { headers: { apikey: CFG.key } }); const t = await r.text();
      line(r.ok, 'Tables Kalo présentes', r.ok ? 'profiles, friendships, snapshots' : `HTTP ${r.status} · ${t.slice(0, 160)}${/PGRST205|does not exist|schema cache/.test(t) ? ' → exécute schema.sql dans le SQL Editor' : ''}`);
    } catch (e) { line(false, 'Tables Kalo', e.message); }
    draw();
  }
  const actions = {
    'so-diag': () => diagnose(),
    'so-join': async b => {
      const nm = ($('[data-f="so-name"]')?.value || '').trim().slice(0, 30);
      if (!nm) { toast('Choisis un pseudo'); return; }
      if (!$('[data-f="so-ok"]')?.checked) { toast('Coche la case pour accepter le partage'); return; }
      b.disabled = true; b.textContent = 'Activation…';
      try { await join(nm); toast('Social activé 🎉'); await loadFriends(); if (UI.soPending) { const c = UI.soPending; UI.soPending = ''; await addFriend(c); } }
      catch (e) { toast(explain(e), 6000); }
      render();
    },
    'so-add': async b => { const inp = $('[data-f="so-code"]'); b.disabled = true; const ok = await addFriend(inp?.value); b.disabled = false; if (ok) { UI.soPending = ''; render(); } },
    'so-friend': b => { const f = (SO().friends || [])[+b.dataset.i]; if (f) openFriend(f); },
    'so-refresh': () => { loadFriends(); upload(false); render(); },
    'so-settings': () => openSettings(),
    'so-resume': async () => { SO().paused = false; save(); await upload(true); render(); },
    'so-share': () => shareCode(),
    'so-copy': async () => { try { await navigator.clipboard.writeText(SO().code); toast('Code copié'); } catch (e) { toast(SO().code); } },
    'so-board-info': () => alert('Points de la semaine (7 derniers jours) :\n• 2 pts par jour saisi\n• 3 pts par jour dans l\'objectif calories (80-105 %)\n• 3 pts par jour protéines atteintes\n• 5 pts par séance\n• + score qualité moyen ÷ 20\n\nOn récompense la régularité, pas le fait de manger moins.'),
  };

  function onLoad(all) {
    S.social = all.social || {};
    const m = /[?&]ami=([A-Za-z0-9]{6})/.exec(location.search);
    if (m) { UI.soPending = m[1].toUpperCase(); UI.tab = 'social'; try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ } }
    if (ready() && S.social.joined) { setTimeout(() => upload(false), 3000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') upload(false); }); }
  }
  return { view, actions, onLoad, schedule, upload, loadFriends, ready, buildSnapshot };
};
