/* v17 · Copia de seguridad con aviso, carga y lesiones, puntos débiles + reto semanal, briefing, repaso con recordatorio,
   repaso rápido de situaciones, análisis de rolas en vídeo, mapa de habilidades, logros y comparación contigo mismo. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const $ = APP.$, $$ = APP.$$;
  const U = APP.ui2, YT = APP.yt;
  const { card, ct, pill, empty, mmss, hm, rk } = U;
  const chipsH = (n, o, sl, m) => APP.chips(n, o, sl, m, true);
  const selV = (g) => APP.sel(g, $('#view'));
  const norm = ST.norm;
  const dd = (a, b) => Math.round((ST.parse(b) - ST.parse(a)) / 86400000);
  const nfix = (x, d) => String(Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).replace('.', ',');
  Object.assign(APP.titles, { briefing: 'Antes de entrenar', progreso: 'Progreso', carga: 'Carga y lesiones', repaso: 'Repaso', analisis: 'Análisis de round' });
  ['briefing', 'progreso', 'carga', 'repaso', 'analisis'].forEach((k) => { APP.TABMAP[k] = 'bjj'; });
  const sav = (k, v) => APP.saveMeta(k, v);
  const meta = () => { S.injuries = S.injuries || []; S.srs = S.srs || {}; S.challenge = S.challenge || null; S.study = S.study || []; };

  // =====================================================================
  // DATOS DE APOYO
  // =====================================================================
  const evIn = (from, to) => ST.flatten(S.rounds.filter((r) => (!from || r.date >= from) && (!to || r.date <= to)));
  const cn = (ev, k, o) => ev.filter((e) => e.kind === k && (!o || e.outcome === o)).length;
  const sIn = (from, to) => S.sessions.filter((s) => (!from || s.date >= from) && (!to || s.date <= to));
  const ratio = (a, b) => (a + b >= 3 ? a / (a + b) : null);

  // ---------- Carga de entreno: minutos × intensidad (1-5; si falta, 3) ----------
  const load = (s) => (Number(s.duration) || 0) * 2 * ((s.feel && s.feel.effort) || 3); // minutos × CR-10 (tu 1-5 ×2)
  function loadStatus() {
    const t = today(); const acute = sIn(ST.addDays(t, -6), t).reduce((a, s) => a + load(s), 0);
    const prev = sIn(ST.addDays(t, -34), ST.addDays(t, -7)); const chronic = prev.reduce((a, s) => a + load(s), 0) / 4;
    const first = S.sessions.length ? S.sessions[S.sessions.length - 1].date : t;
    if (dd(first, t) < 21 || chronic <= 0) return { acute, chronic, r: null, lvl: 'nodata', msg: 'Aún hay pocos datos: necesito unas 3 semanas de entrenos para comparar tu carga.' };
    const r = acute / chronic;
    const lvl = r < 0.8 ? 'low' : r <= 1.3 ? 'ok' : r <= 1.5 ? 'high' : 'vhigh';
    const msg = { low: 'Estás entrenando menos que tu media: buen momento para descargar o recuperar.', ok: 'Carga estable y dentro de tu zona. Sigue así.', high: 'Esta semana cargas más de lo habitual. Cuida el descanso y el sueño.', vhigh: 'Subida brusca de carga. Es cuando más lesiones aparecen: baja intensidad o descansa un día.' }[lvl];
    return { acute, chronic, r, lvl, msg };
  }
  const ZONES = ['Cuello', 'Hombro', 'Codo', 'Muñeca / mano', 'Dedos', 'Costillas', 'Espalda baja', 'Cadera', 'Rodilla', 'Tobillo', 'Pie', 'Otra'];
  const LEVELS = { 1: 'Molestia', 2: 'Dolor', 3: 'No puedo entrenar' };
  const activeInj = () => (S.injuries || []).filter((i) => !i.end);

  // ---------- Puntos débiles (desde tus rounds y entrenos) ----------
  let wkMemo = null;
  function weak() {
    if (wkMemo && Date.now() - wkMemo.t < 800 && wkMemo.k === S.rounds.length + '|' + S.sessions.length) return wkMemo.v;
    const v = weak0(); wkMemo = { t: Date.now(), k: S.rounds.length + '|' + S.sessions.length, v }; return v;
  }
  function weak0() {
    const t = today(); const from = ST.addDays(t, -89);
    const rs = S.rounds.filter((r) => r.date >= from); const rep = ST.report(S.rounds, { from, to: t }); const out = [];
    const add = (o) => out.push(o);
    const pg = rep.passes.receivedFromGuard.rows.filter((r) => r.key !== 'Sin especificar')[0];
    if (pg && pg.n >= 2) add({ id: 'pass:' + pg.key, n: pg.n + 2, title: 'Retener la guardia desde ' + APP.tn(pg.key), pos: pg.key, sec: 'Retención', why: 'Te han pasado la guardia ' + pg.n + ' veces desde ' + APP.tn(pg.key) + ' (últimos 90 días).', chal: 'Retener o recuperar la guardia desde ' + APP.tn(pg.key), target: 3 });
    const sr = rep.subs.received.rows.filter((r) => r.key !== 'Sin especificar')[0];
    if (sr && sr.n >= 2) add({ id: 'sub:' + sr.key, n: sr.n + 2, title: 'Defensa de ' + APP.tn(sr.key), pos: '', sec: 'Defensas', why: 'Te finalizan con ' + APP.tn(sr.key) + ' (' + sr.n + ' veces).', chal: 'Defender ' + APP.tn(sr.key) + ' sin tapear', target: 2 });
    const es = rep.escapes.byPosition.filter((p) => p.total >= 3 && p.pct < 50 && p.pos !== 'Sin especificar')[0];
    if (es) add({ id: 'esc:' + es.pos, n: es.total, title: 'Escape de ' + APP.tn(es.pos), pos: es.pos, sec: 'Salidas y escapes', why: 'Solo sales el ' + es.pct + '% de las veces desde ' + APP.tn(es.pos) + ' (' + es.total + ' intentos).', chal: 'Escapar de ' + APP.tn(es.pos), target: 3 });
    const hard = {}; sIn(ST.addDays(t, -59), t).forEach((s) => (s.worked || []).forEach((w) => { if (w.rating === 'hard') { const k = APP.canon(w.name).name || w.name; hard[k] = (hard[k] || 0) + 1; } }));
    const hk = Object.keys(hard).sort((a, b) => hard[b] - hard[a])[0];
    if (hk && hard[hk] >= 2) add({ id: 'hard:' + hk, n: hard[hk] + 1, title: hk, pos: '', sec: ((APP.findTech(hk) || {}).cat && ({ sweep: 'Raspados', pase: 'Pases', finalizacion: 'Finalizaciones', escape: 'Salidas y escapes', derribo: 'Entradas' })[APP.findTech(hk).cat]) || 'Conceptos', why: 'Te costó en ' + hard[hk] + ' entrenos.', chal: 'Practicar ' + hk + ' en entrenos', target: 3 });
    const ev = ST.flatten(rs); const rn = rs.length;
    if (rn >= 5 && cn(ev, 'sweep_made', 'exito') / rn < 0.4) add({ id: 'sweep', n: 3, title: 'Raspados básicos', pos: '', sec: 'Raspados', why: 'Haces pocos raspados (' + cn(ev, 'sweep_made', 'exito') + ' en ' + rn + ' rounds).', chal: 'Conseguir raspados', target: 3 });
    if (rn >= 5 && cn(ev, 'sub_made', 'exito') / rn < 0.3) add({ id: 'finish', n: 2, title: 'Finalizaciones de tu juego', pos: '', sec: 'Finalizaciones', why: 'Finalizas poco (' + cn(ev, 'sub_made', 'exito') + ' en ' + rn + ' rounds).', chal: 'Intentar finalizaciones', target: 5 });
    out.sort((a, b) => b.n - a.n);
    return out;
  }
  const studyFor = (w) => S.study.find((x) => norm(x.title) === norm(w.title));

  A.wkStudy = async (el) => {
    const w = weak().find((x) => x.id === el.dataset.id); if (!w) return;
    let x = studyFor(w);
    if (!x) { x = { id: uid(), title: w.title, pos: w.pos || '', sec: w.sec, videos: [], notes: [], created: today(), updated: today(), fromWeak: true }; S.study.push(x); await sav('study', S.study); }
    APP.go('#/estudio/' + x.id);
  };
  const weakCard = () => {
    const ws = weak().slice(0, 3);
    if (!ws.length) return card(ct('Tus puntos débiles') + '<p class="small muted" style="margin:0">Necesito más rounds registrados para detectar tus puntos débiles (te pasan la guardia, te finalizan, te cuesta una técnica…).</p>');
    return card(ct('Tus puntos débiles · qué estudiar') + ws.map((w) => '<div style="padding:8px 0;border-top:1px solid var(--line)"><b>' + esc(w.title) + '</b><div class="small muted" style="margin:2px 0 6px">' + esc(w.why) + '</div><button class="btn small ' + (studyFor(w) ? 'secondary' : '') + '" data-act="wkStudy" data-id="' + esc(w.id) + '">' + (studyFor(w) ? 'Seguir estudiándolo ›' : 'Estudiar esto ›') + '</button></div>').join(''));
  };
  const oldEstudio = V.estudio;
  V.estudio = (arg) => { const h = oldEstudio(arg); if (arg) return h; return h.replace('<button class="btn block" style="margin-bottom:12px" data-act="stNew">', weakCard() + '<button class="btn block" style="margin-bottom:12px" data-act="stNew">'); };

  // ---------- Reto semanal ----------
  const plabel = (p) => nfix(p.score, 1) + '/' + p.target;
  const weekKey = () => ST.weekStart(today());
  function challenge() {
    meta(); const wk = weekKey(); const c = S.challenge;
    if (c && c.week === wk) return c;
    const ws = weak(); const idx = Math.abs(Math.round(dd('2026-01-05', wk) / 7)) % Math.max(1, Math.min(3, ws.length));
    const w = ws[idx]; const hist = (c && c.history) || [];
    const nc = { week: wk, state: 'offer', history: hist, text: w ? w.chal : 'Probar una técnica nueva y apuntarla', target: w ? w.target : 1, kind: w ? 'count' : 'yn', why: w ? w.why : 'Aún no hay datos para personalizarlo: un reto sencillo para empezar.', wid: w ? w.id : '', goalId: '' };
    S.challenge = nc; sav('challenge', nc); return nc;
  }
  A.chAccept = async () => {
    const c = challenge(); const g = { id: uid(), text: c.text, period: 'week', kind: c.kind === 'yn' ? 'yn' : 'count', target: c.target || 1, done: false, created: today(), challenge: true };
    await APP.saveGoal(g); c.state = 'accepted'; c.goalId = g.id; await sav('challenge', c); APP.toast('Reto añadido a tus objetivos de la semana'); APP.render();
  };
  A.chSkip = async () => { const c = challenge(); c.state = 'skipped'; await sav('challenge', c); APP.render(); };
  function chStatus() {
    const c = challenge(); if (c.state !== 'accepted') return { c, p: null };
    const g = S.goals.find((x) => x.id === c.goalId); if (!g) return { c, p: null };
    const p = U.gp(g, today()); if (p.pct >= 100 && !(c.history || []).some((h) => h.week === c.week && h.done)) { c.history = (c.history || []).concat([{ week: c.week, text: c.text, done: true }]); sav('challenge', c); APP.toast('🏆 ¡Reto semanal cumplido!'); }
    return { c, p };
  }
  const chCard = (compact) => {
    const { c, p } = chStatus();
    if (c.state === 'skipped') return '';
    const head = '<div class="ct" style="color:var(--gold)">🎯 RETO DE LA SEMANA</div>';
    if (c.state === 'offer') return card(head + '<b>' + esc(c.text) + (c.kind === 'count' ? ' · ' + c.target + ' veces' : '') + '</b><div class="small muted" style="margin:4px 0 10px">' + esc(c.why) + '</div><div class="row"><button class="btn small block" data-act="chAccept">Aceptar reto</button><button class="btn small ghost" data-act="chSkip">Otro día</button></div>');
    const pct = p ? p.pct : 0;
    return card(head + '<div class="row between"><b>' + esc(c.text) + '</b>' + pill(pct >= 100 ? '✓ cumplido' : (p ? plabel(p) : '')) + '</div>' + (compact ? '' : '<div class="small muted" style="margin-top:4px">Marca cuántas veces lo hiciste al registrar cada entreno.</div>'));
  };

  // =====================================================================
  // SEGURIDAD: copia de seguridad con aviso
  // =====================================================================
  const oldExport = A.export;
  A.export = async () => { oldExport(); S.backup = { last: today() }; await sav('backup', S.backup); };
  A.exportShare = async () => {
    try {
      const data = { app: 'bjj-coach', version: 1, exported: new Date().toISOString(), profile: S.profile, sessions: S.sessions, rounds: S.rounds, chains: S.chains, goals: S.goals, mastery: S.mastery, favs: S.favs, settings: S.settings, custom: S.custom, aliases: S.aliases, plan: S.plan, notes: S.notes, noteTopics: S.noteTopics, tree: S.tree, body: S.body, gym: S.gym, food: S.food, study: S.study, injuries: S.injuries, srs: S.srs, ach: S.ach, challenge: S.challenge, vid: S.vid };
      const f = new File([JSON.stringify(data)], 'bjj-coach-' + today() + '.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Copia BJJ Coach' }); S.backup = { last: today() }; await sav('backup', S.backup); APP.toast('Copia enviada'); } else { A.export(); }
    } catch (e) { if (e && e.name !== 'AbortError') A.export(); }
  };
  const backupDays = () => (S.backup && S.backup.last ? dd(S.backup.last, today()) : null);
  const backupDue = () => S.sessions.length >= 3 && (backupDays() === null || backupDays() >= 14);
  const oldAjustes = V.ajustes;
  V.ajustes = () => {
    const h = oldAjustes(); const d = backupDays();
    const line = '<p class="small" style="margin:0 0 10px;color:' + (backupDue() ? 'var(--orange)' : 'var(--green)') + '">' + (d === null ? '⚠ Aún no has hecho ninguna copia.' : 'Última copia: ' + (d === 0 ? 'hoy' : 'hace ' + d + ' días') + '.') + '</p>';
    return h.replace('<div class="stack"><button class="btn block" data-act="export">', line + '<div class="stack"><button class="btn block" data-act="exportShare">Enviar copia (WhatsApp, Drive…)</button><button class="btn secondary block" data-act="export">');
  };

  // =====================================================================
  // CARGA Y LESIONES
  // =====================================================================
  V.carga = () => {
    meta(); const t = today(); const ls = loadStatus();
    const wk0 = ST.weekStart(t); const bars = []; for (let i = 5; i >= 0; i--) { const f = ST.addDays(wk0, -7 * i); bars.push({ f, v: sIn(f, ST.addDays(f, 6)).reduce((a, s) => a + load(s), 0), n: sIn(f, ST.addDays(f, 6)).length }); }
    const mx = Math.max.apply(null, bars.map((b) => b.v).concat([1]));
    const col = { nodata: 'var(--muted)', low: 'var(--blue)', ok: 'var(--green)', high: 'var(--gold)', vhigh: 'var(--red)' }[ls.lvl];
    let h = '<div class="ttl"><h2>Carga y lesiones<small>Entrena fuerte sin romperte</small></h2></div>';
    h += card(ct('Carga de los últimos 7 días') + '<div class="row between" style="align-items:flex-end"><div><b style="font-size:26px;color:' + col + '">' + (ls.r === null ? '–' : nfix(ls.r, 1) + '×') + '</b><div class="small muted">frente a tu media de 4 semanas</div></div>' + pill(Math.round(ls.acute) + ' u.') + '</div><p style="margin:10px 0 0">' + esc(ls.msg) + '</p>' +
      '<div style="display:flex;gap:8px;align-items:flex-end;height:80px;margin-top:14px">' + bars.map((b, i) => '<div style="flex:1;text-align:center"><div style="height:' + Math.max(3, Math.round(b.v / mx * 60)) + 'px;border-radius:6px;background:' + (i === 5 ? 'var(--green)' : 'var(--line2,#2a3a38)') + '"></div><div class="small muted" style="font-size:10px;margin-top:4px">' + ST.parse(b.f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + '</div></div>').join('') + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">Carga = minutos × intensidad (método session-RPE, Foster 2001; tu 1-5 equivale a 2-4-6-8-10 en la escala CR-10). Los tramos de aviso son una <b>regla práctica</b>: que la ratio carga aguda/crónica prediga lesiones está <b>discutido</b> (Impellizzeri 2020). Úsala como aviso, no como diagnóstico. <a href="#/ciencia" style="color:var(--green)">Ver base científica ›</a></p>');
    const act = activeInj();
    h += '<div class="row between" style="margin:14px 0 8px"><h3 style="margin:0">Molestias y lesiones</h3><button class="btn small" data-act="injNew">+ Anotar</button></div>';
    h += act.length ? act.map((i) => card('<div class="row between"><div><b>' + esc(i.zone) + '</b> ' + pill(LEVELS[i.level], i.level >= 3 ? 'bad' : i.level === 2 ? 'warn' : '') + '<div class="small muted" style="margin-top:2px">Desde ' + fmtDate(i.date) + ' · ' + dd(i.date, t) + ' días' + (i.note ? ' · ' + esc(i.note) : '') + '</div></div><button class="btn small secondary" data-act="injEnd" data-id="' + i.id + '">Recuperada</button></div>')).join('') : card('<p class="small muted" style="margin:0">Sin molestias activas. 👌</p>');
    const hist = (S.injuries || []).filter((i) => i.end); const z = {}; (S.injuries || []).filter((i) => i.date >= ST.addDays(t, -120)).forEach((i) => { z[i.zone] = (z[i.zone] || 0) + 1; });
    const rep = Object.keys(z).filter((k) => z[k] >= 2).sort((a, b) => z[b] - z[a]);
    if (rep.length) h += '<div class="insight"><b class="k">COACH</b> · Se te repite: <b>' + rep.map(esc).join(', ') + '</b> (2 o más veces en 4 meses). Conviene revisar técnica, calentamiento o consultar a un fisio.</div>';
    if (hist.length) h += card(ct('Historial') + hist.slice().reverse().slice(0, 8).map((i) => '<div class="cnt"><span><b>' + esc(i.zone) + '</b> · ' + LEVELS[i.level] + '</span><span class="small muted">' + fmtDate(i.date) + ' → ' + fmtDate(i.end) + '</span></div>').join(''));
    return h;
  };
  A.injNew = () => APP.openSheet('Anotar molestia o lesión', group('Zona', chipsH('injz', ZONES, null, false)) + group('Gravedad', chipsH('injl', [{ v: '1', l: 'Molestia' }, { v: '2', l: 'Dolor' }, { v: '3', l: 'No puedo entrenar' }], '1', false)) + field('Qué pasó (opcional)', '<input id="inj-note" placeholder="Ej.: torsión en el pase del domingo">') + '<button class="btn block" data-act="injSave">Guardar</button>');
  A.injSave = async () => {
    const zone = APP.sel('injz')[0]; if (!zone) return APP.toast('Elige la zona'); meta();
    S.injuries.push({ id: uid(), zone, level: Number(APP.sel('injl')[0]) || 1, date: today(), note: val('inj-note').trim() }); await sav('injuries', S.injuries); APP.closeSheet(); APP.render();
  };
  A.injEnd = async (el) => { const i = S.injuries.find((x) => x.id === el.dataset.id); if (i) { i.end = today(); await sav('injuries', S.injuries); APP.render(); } };

  // =====================================================================
  // REPASO CON RECORDATORIO + REPASO RÁPIDO DE SITUACIONES
  // =====================================================================
  const hasContent = (n) => (n.keys || []).length || n.body || n.mistakes;
  const noteItems = () => S.notes.filter(hasContent).map((n) => ({ key: 'n:' + n.id, kind: 'note', n }));
  function situations() {
    const nodes = S.tree.nodes || []; const by = {}; nodes.forEach((n) => { (by[n.parent || ''] = by[n.parent || ''] || []).push(n); });
    const path = (n) => { const out = []; let c = n; while (c) { out.unshift(c); c = nodes.find((x) => x.id === c.parent); } return out; };
    const out = [];
    nodes.forEach((n) => {
      const ch = by[n.id] || [];
      if (!n.parent && ch.length) out.push({ key: 's:' + n.id, kind: 'sit', q: 'Estás en <b>' + esc(APP.tn(n.label)) + '</b>. ¿Qué opciones tienes según cómo reaccione el rival?', a: ch.map((c) => '<div>• ' + (c.cond ? '<i>' + esc(c.cond) + '</i> → ' : '') + '<b>' + esc(APP.tn(c.label)) + '</b></div>').join('') });
      if (n.parent && n.cond) { const p = path(n); const ctx = p.slice(0, -1).map((x) => esc(APP.tn(x.label))).join(' › '); out.push({ key: 's:' + n.id, kind: 'sit', q: 'Vas por <b>' + ctx + '</b> y el rival: <i>«' + esc(n.cond) + '»</i>. ¿Qué haces?', a: '<b>' + esc(APP.tn(n.label)) + '</b>' + (ch.length ? '<div class="small muted" style="margin-top:6px">Después: ' + ch.map((c) => (c.cond ? esc(c.cond) + ' → ' : '') + esc(APP.tn(c.label))).join(' · ') + '</div>' : '') }); }
    });
    return out;
  }
  const isDue = (it) => { const r = S.srs[it.key]; return !r || r.due <= today(); };
  const dueList = (items) => items.filter(isDue).sort((a, b) => ((S.srs[a.key] || { due: '0' }).due).localeCompare((S.srs[b.key] || { due: '0' }).due));
  APP.dueCount = () => { meta(); return dueList(noteItems()).length; };
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  V.repaso = () => {
    meta(); const ni = noteItems(), due = dueList(ni), sits = situations(); const done = Object.keys(S.srs).filter((k) => S.srs[k].last === today()).length;
    let h = '<div class="ttl"><h2>Repaso<small>Para que lo estudiado se quede</small></h2></div>';
    h += card(ct('Apuntes para repasar hoy') + '<div class="row between"><div><b style="font-size:28px;color:' + (due.length ? 'var(--orange)' : 'var(--green)') + '">' + due.length + '</b><div class="small muted">de ' + ni.length + ' apuntes con contenido</div></div>' + (due.length ? '<button class="btn" data-act="rpStart" data-m="note">Empezar repaso</button>' : '<span class="pill ok">Todo al día</span>') + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">Cada apunte vuelve a salir pronto si fallas y más tarde si lo recuerdas bien (1, 3, 7, 14… días). Hoy has repasado ' + done + '.</p>');
    h += card(ct('Repaso rápido de situaciones') + (sits.length ? '<p style="margin:0 0 10px">Te planteo una situación de tu Game plan (<i>«te hacen X, ¿qué haces?»</i>) y piensas la respuesta antes de verla. ' + sits.length + ' disponibles.</p><button class="btn secondary block" data-act="rpStart" data-m="sit">5 situaciones al azar</button>' : '<p class="small muted" style="margin:0">Crea jugadas en tu Game plan (con «si el rival hace…») y aquí podrás practicarlas.</p>'));
    if (!ni.length) h += '<div class="card empty"><p>Escribe apuntes con detalles clave (o estudia técnicas con vídeo) y aparecerán aquí para repasar.</p></div>';
    return h;
  };
  A.rpStart = (el) => {
    const m = el.dataset.m; let list = m === 'note' ? dueList(noteItems()).slice(0, 12) : shuffle(situations()).slice(0, 5);
    if (!list.length) return APP.toast('No hay nada para repasar');
    ui.rp = { list, i: 0, shown: false, m, ok: 0 }; rpShow();
  };
  function rpShow() {
    const r = ui.rp; const it = r.list[r.i];
    if (!it) { const done = r.ok; APP.closeSheet(); ui.rp = null; APP.toast('Repaso terminado · ' + done + ' de ' + r.list.length + ' bien'); APP.render(); return; }
    let front, back;
    if (it.kind === 'note') { const n = it.n; front = '<div class="pill-n">' + esc(APP.tn(n.topic)) + (n.section ? ' › ' + esc(n.section) : '') + '</div><h2 style="margin:10px 0">' + esc(APP.tn(n.title)) + '</h2>' + (r.shown ? '' : '<p class="muted">Intenta recordar los detalles clave antes de verlos.</p>');
      back = ((n.keys || []).length ? '<ul class="keys">' + n.keys.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' : '') + (n.body ? '<p style="white-space:pre-wrap">' + esc(n.body) + '</p>' : '') + (n.mistakes ? '<p class="small muted">Errores a evitar</p><p style="white-space:pre-wrap">' + esc(n.mistakes) + '</p>' : ''); }
    else { front = '<div class="pill-n">Situación</div><p style="margin:10px 0;font-size:17px">' + it.q + '</p>' + (r.shown ? '' : '<p class="muted">Piensa qué harías…</p>'); back = '<div>' + it.a + '</div>'; }
    APP.openSheet('Repaso ' + (r.i + 1) + ' de ' + r.list.length, '<div class="card" style="text-align:center">' + front + '</div>' + (r.shown ? '<div class="card">' + back + '</div><div class="row" style="margin-top:8px"><button class="btn secondary block" data-act="rpRate" data-q="0">😓 Fallé</button><button class="btn secondary block" data-act="rpRate" data-q="1">🤔 Dudé</button><button class="btn block" data-act="rpRate" data-q="2">💪 Bien</button></div>' : '<button class="btn block" data-act="rpReveal">Mostrar respuesta</button>'));
  }
  A.rpReveal = () => { ui.rp.shown = true; rpShow(); };
  A.rpRate = async (el) => {
    const r = ui.rp; const it = r.list[r.i]; const q = Number(el.dataset.q); const old = S.srs[it.key] || { int: 0, n: 0 };
    const int = q === 0 ? 1 : q === 1 ? Math.max(2, Math.round((old.int || 1) * 1.3)) : Math.max(3, Math.round((old.int || 1) * 2.3));
    S.srs[it.key] = { int, n: (old.n || 0) + 1, due: ST.addDays(today(), int), last: today() }; if (q === 2) r.ok++;
    await sav('srs', S.srs); r.i++; r.shown = false; rpShow();
  };

  // =====================================================================
  // ANÁLISIS DE TUS PROPIOS ROUNDS (vídeo + notas por minuto)
  // =====================================================================
  const ACLS = { good: ['✅', 'Acierto'], err: ['❌', 'Error'], idea: ['💡', 'Qué haría mejor'], key: ['⚔️', 'Momento clave'] };
  ui.an = ui.an || { local: null };
  const roundOf = (id) => S.rounds.find((r) => r.id === id);
  V.analisis = (id) => {
    const r = roundOf(id); if (!r) return '<div class="card empty">Round no encontrado.</div>';
    const v = r.video || {}; const sess = S.sessions.find((s) => s.id === r.sessionId);
    let h = '<a class="backlink" href="#/' + (sess ? 'entreno/' + sess.id : 'entrenos') + '">‹ ' + (sess ? 'Entreno' : 'BJJ') + '</a>';
    h += '<div class="ttl"><h2>Análisis' + (r.partner ? ' · ' + esc(r.partner) : '') + '<small>' + fmtDate(r.date) + ' · ' + mmss(r.duration || 0) + '</small></h2></div>';
    const local = ui.an.local && ui.an.local.rid === id ? ui.an.local.url : '';
    if (local) h += card('<video id="an-vid" src="' + local + '" controls playsinline style="width:100%;border-radius:12px;background:#000"></video>');
    else if (v.yt && navigator.onLine) h += card('<div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000"><iframe id="st-frame" style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube-nocookie.com/embed/' + v.yt + '?enablejsapi=1&playsinline=1&rel=0" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><div class="row between" style="margin-top:8px"><a class="small" style="color:var(--green)" target="_blank" rel="noopener" href="' + esc(v.url) + '">Abrir en YouTube ↗</a><button class="btn small ghost" data-act="anUrl" data-id="' + id + '">Cambiar vídeo</button></div>');
    else h += card(ct('Vídeo del round') + (v.url ? '<p class="small"><a style="color:var(--green)" target="_blank" rel="noopener" href="' + esc(v.url) + '">Abrir vídeo ↗</a></p>' : '') +
      '<div class="stack"><button class="btn secondary block" data-act="anUrl" data-id="' + id + '">🔗 Pegar enlace (YouTube u otro)</button><label class="btn secondary block" style="display:block;text-align:center">🎞 Elegir vídeo del móvil<input type="file" accept="video/*" data-input="anFile" data-id="' + id + '" style="display:none"></label></div><p class="small muted" style="margin:10px 0 0">Del móvil se reproduce solo ahora mismo (la app no guarda el archivo); tus notas con minuto sí se quedan. Los enlaces de YouTube se ven dentro de la app.</p>');
    h += card(ct('Notas mientras lo ves') + '<textarea id="an-text" rows="2" placeholder="Qué pasó en este momento…"></textarea>' + chipsH('ancls', Object.keys(ACLS).map((k) => ({ v: k, l: ACLS[k][0] + ' ' + ACLS[k][1] })), 'err', false) +
      '<div class="row" style="margin-top:10px;gap:8px"><input id="an-ts" placeholder="m:ss" inputmode="numeric" style="width:84px;flex:none"><button class="btn small secondary" style="flex:1" data-act="anNow">⏱ Minuto actual</button></div><button class="btn block" style="margin-top:10px" data-act="anAdd" data-id="' + id + '">Añadir nota</button>');
    h += '<div id="an-notes">' + anNotes(r) + '</div>';
    setTimeout(() => { if (v.yt && !local) YT.ytInit(); }, 0);
    return h;
  };
  const anNotes = (r) => { const ns = ((r.video || {}).notes || []).slice().sort((a, b) => (a.t == null ? 1e9 : a.t) - (b.t == null ? 1e9 : b.t)); if (!ns.length) return ''; return card(ct('Línea de tiempo (' + ns.length + ')') + ns.map((n) => '<div class="row between" style="align-items:flex-start;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1;white-space:pre-wrap">' + (n.t != null ? '<a href="#" data-act="anSeek" data-t="' + n.t + '" style="color:var(--green);font-weight:700">' + YT.tsF(n.t) + '</a> ' : '') + (ACLS[n.cls] ? ACLS[n.cls][0] : '') + ' ' + esc(n.text) + '</div><button class="btn small ghost" data-act="anDel" data-id="' + r.id + '" data-n="' + n.id + '">✕</button></div>').join('')); };
  const anPos = () => { const vid = $('#an-vid'); if (vid) return { get: () => vid.currentTime, seek: (t) => { vid.currentTime = t; vid.play(); } }; const p = YT.player(); return p && p.getCurrentTime ? { get: () => p.getCurrentTime(), seek: (t) => { p.seekTo(t, true); p.playVideo(); } } : null; };
  A.anUrl = (el) => APP.openSheet('Vídeo del round', field('Enlace', '<input id="an-url" type="url" inputmode="url" placeholder="https://youtu.be/…">') + '<button class="btn block" data-act="anUrlSave" data-id="' + el.dataset.id + '">Guardar</button>');
  A.anUrlSave = async (el) => { const r = roundOf(el.dataset.id), url = val('an-url').trim(); if (!/^https?:\/\//.test(url)) return APP.toast('Pega un enlace que empiece por https://'); r.video = Object.assign({ notes: [] }, r.video, { url, yt: YT.ytId(url) }); ui.an.local = null; await APP.saveRound(r); APP.closeSheet(); rk(); };
  A.anFile = (el) => { const f = el.files && el.files[0]; if (!f) return; ui.an.local = { rid: el.dataset.id, url: URL.createObjectURL(f) }; rk(); };
  A.anNow = () => { const p = anPos(); if (p) { $('#an-ts').value = YT.tsF(p.get()); } else APP.toast('Escribe el minuto a mano (m:ss)'); };
  A.anSeek = (el) => { const p = anPos(); if (p) { p.seek(+el.dataset.t); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  A.anAdd = async (el) => {
    const r = roundOf(el.dataset.id), text = val('an-text').trim(); if (!text) return APP.toast('Escribe la nota');
    r.video = r.video || { notes: [] }; r.video.notes = r.video.notes || [];
    r.video.notes.push({ id: uid(), text, cls: selV('ancls')[0] || 'err', t: YT.tsP(val('an-ts')) });
    await APP.saveRound(r); $('#an-text').value = ''; $('#an-ts').value = ''; $('#an-notes').innerHTML = anNotes(r); APP.toast('Nota guardada');
  };
  A.anDel = async (el) => { const r = roundOf(el.dataset.id); r.video.notes = r.video.notes.filter((n) => n.id !== el.dataset.n); await APP.saveRound(r); $('#an-notes').innerHTML = anNotes(r); };
  const oldEntreno = V.entreno;
  V.entreno = (id) => {
    const html = oldEntreno(id); const rs = S.rounds.filter((r) => r.sessionId === id); if (!rs.length) return html;
    const blk = card(ct('Análisis de rounds en vídeo') + rs.map((r, i) => '<div class="cnt"><span><b>Round ' + (i + 1) + (r.partner ? ' · ' + esc(r.partner) : '') + '</b>' + (r.video && r.video.notes && r.video.notes.length ? ' ' + pill(r.video.notes.length + ' notas') : '') + '</span><a class="btn small secondary" style="text-decoration:none" href="#/analisis/' + r.id + '">' + (r.video ? '🎥 Abrir' : '🎥 Analizar') + '</a></div>').join(''));
    return html.replace('<button class="btn danger block" data-act="delSession"', blk + '<button class="btn danger block" data-act="delSession"');
  };

  // =====================================================================
  // PROGRESO: comparación contigo mismo · mapa de habilidades · logros
  // =====================================================================
  function period(from, to) {
    const ss = sIn(from, to), ev = evIn(from, to), rs = S.rounds.filter((r) => r.date >= from && r.date <= to);
    const cardio = ss.filter((s) => s.feel && s.feel.cardio); const sm = cn(ev, 'sub_made', 'exito'), sr = cn(ev, 'sub_recv'), pm = cn(ev, 'pass_made', 'exito'), pr = cn(ev, 'pass_recv'), sw = cn(ev, 'sweep_made', 'exito'), swr = cn(ev, 'sweep_recv'), tm = cn(ev, 'takedown_made', 'exito'), tr = cn(ev, 'takedown_recv'), es = cn(ev, 'escape', 'exito'), esf = cn(ev, 'escape', 'intento');
    return { ses: ss.length, min: ss.reduce((a, s) => a + (Number(s.duration) || 0), 0), rounds: rs.length, sm, sr, pm, pr, sw, swr, tm, tr, es, esf, cardio: cardio.length ? cardio.reduce((a, s) => a + s.feel.cardio, 0) / cardio.length : null };
  }
  const radarAxes = (p) => [
    ['Pases', ratio(p.pm, p.pr)], ['Raspados', ratio(p.sw, p.swr)], ['Derribos', ratio(p.tm, p.tr)], ['Finalizar', ratio(p.sm, p.sr)], ['Escapes', ratio(p.es, p.esf)],
    ['Cardio', p.cardio === null ? null : (p.cardio - 1) / 4], ['Constancia', p.ses ? Math.min(1, p.ses / 12) : null]];
  function radar(a, b) {
    const W = 300, c = 150, R = 95, n = a.length; const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n; const pt = (i, v) => [c + Math.cos(ang(i)) * R * v, c + Math.sin(ang(i)) * R * v];
    const poly = (arr, st) => '<polygon points="' + arr.map((x, i) => pt(i, x[1] === null ? 0 : x[1]).map((q) => q.toFixed(1)).join(',')).join(' ') + '" ' + st + '/>';
    let g = [0.25, 0.5, 0.75, 1].map((k) => '<polygon points="' + a.map((x, i) => pt(i, k).map((q) => q.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="var(--line)" stroke-width="1"/>').join('');
    g += a.map((x, i) => { const [x2, y2] = pt(i, 1); return '<line x1="' + c + '" y1="' + c + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="var(--line)"/>'; }).join('');
    const lab = a.map((x, i) => { const [lx, ly] = pt(i, 1.2); return '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (x[1] === null ? 'var(--muted)' : 'var(--ink)') + '">' + x[0] + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + W + '" style="width:100%;max-width:320px;display:block;margin:0 auto">' + g + poly(b, 'fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"') + poly(a, 'fill="rgba(46,230,200,.22)" stroke="var(--green)" stroke-width="2"') + lab + '</svg>';
  }
  const ACH = () => {
    const ss = S.sessions, ev = ST.flatten(S.rounds), t = today();
    const wks = new Set(ss.map((s) => ST.weekStart(s.date))); let streak = 0, w = ST.weekStart(t); if (!wks.has(w)) w = ST.addDays(w, -7); while (wks.has(w)) { streak++; w = ST.addDays(w, -7); }
    let best = 0, cur = 0; Array.from(wks).sort().forEach((x, i, arr) => { cur = i && dd(arr[i - 1], x) === 7 ? cur + 1 : 1; best = Math.max(best, cur); });
    const subs = ev.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito'); const distinctSubs = new Set(subs.map((e) => norm(e.tech || '')).filter(Boolean)).size;
    const tri = subs.some((e) => /triang/.test(norm(e.tech || '')));
    const notesN = S.notes.length, studyN = (S.study || []).length, reviews = Object.keys(S.srs || {}).reduce((a, k) => a + (S.srs[k].n || 0), 0);
    const chDone = ((S.challenge && S.challenge.history) || []).filter((h) => h.done).length;
    const L = [];
    const add = (id, ico, name, desc, cur, target) => L.push({ id, ico, name, desc, cur: Math.min(cur, target), target });
    [[1, 'Primer paso'], [10, 'Constante'], [25, 'Habitual'], [50, 'Cinturón de hierro'], [100, 'Centenario']].forEach((x) => add('ses' + x[0], '🥋', x[1], x[0] + ' entrenos registrados', ss.length, x[0]));
    add('streak4', '🔥', 'Racha de 4 semanas', '4 semanas seguidas entrenando', best, 4); add('streak12', '🔥', 'Racha de 12 semanas', '12 semanas seguidas entrenando', best, 12);
    [[10, 'Rodando'], [50, 'Rolero'], [100, 'Tiburón del tatami'], [250, 'Máquina de rolas']].forEach((x) => add('rd' + x[0], '🤼', x[1], x[0] + ' rounds registrados', S.rounds.length, x[0]));
    add('sub1', '🎯', 'Primera finalización', 'Finaliza a alguien una vez', subs.length, 1); add('sub10', '🎯', 'Cazador', '10 finalizaciones', subs.length, 10); add('sub50', '🎯', 'Depredador', '50 finalizaciones', subs.length, 50);
    add('tri', '🔺', 'Triangulador', 'Consigue un triángulo', tri ? 1 : 0, 1); add('var5', '🧰', 'Caja de herramientas', '5 finalizaciones distintas', distinctSubs, 5); add('var10', '🧰', 'Arsenal', '10 finalizaciones distintas', distinctSubs, 10);
    add('pass25', '🛡', 'Pasador', '25 pases de guardia', cn(ev, 'pass_made', 'exito'), 25); add('sweep10', '🌀', 'Raspador', '10 raspados', cn(ev, 'sweep_made', 'exito'), 10);
    add('study1', '🎓', 'Estudiante', 'Crea una técnica en Estudio', studyN, 1); add('study5', '🎓', 'Alumno aplicado', '5 técnicas en Estudio', studyN, 5); add('notes10', '📝', 'Cuaderno', '10 apuntes', notesN, 10); add('notes30', '📝', 'Enciclopedia', '30 apuntes', notesN, 30);
    add('rev20', '🧠', 'Memoria de acero', '20 repasos hechos', reviews, 20); add('ch1', '🏆', 'Retador', 'Cumple un reto semanal', chDone, 1); add('ch5', '🏆', 'Imparable', 'Cumple 5 retos semanales', chDone, 5);
    add('bk', '💾', 'Precavido', 'Haz una copia de seguridad', S.backup ? 1 : 0, 1); add('vid1', '🎥', 'Analista', 'Analiza un round con notas', S.rounds.some((r) => r.video && (r.video.notes || []).length) ? 1 : 0, 1);
    L.forEach((a) => { a.on = a.cur >= a.target; }); return L;
  };
  let achBusy = false;
  async function checkAch() {
    if (achBusy || !S.sessions) return; achBusy = true;
    try {
      const L = ACH(); const first = !S.ach; const m = Object.assign({}, S.ach || {}); const fresh = [];
      L.forEach((a) => { if (a.on && !m[a.id]) { m[a.id] = first ? 'ya' : today(); fresh.push(a); } });
      if (first || fresh.length) { S.ach = m; await sav('ach', m); if (!first) fresh.slice(0, 2).forEach((a, i) => setTimeout(() => APP.toast('🏆 Logro: ' + a.name), 400 + i * 2600)); }
    } finally { achBusy = false; }
  }
  const dlt = (now, prv, good, fmt) => { fmt = fmt || ((x) => String(x)); const d = now - prv; const better = good === 0 ? null : (d > 0) === (good > 0); const arrow = d === 0 ? '＝' : d > 0 ? '▲' : '▼'; const colr = d === 0 || better === null ? 'var(--muted)' : better ? 'var(--green)' : 'var(--orange)'; return '<span style="color:' + colr + ';font-weight:800">' + arrow + ' ' + (d === 0 ? '' : fmt(Math.abs(d))) + '</span>'; };
  V.progreso = () => {
    const t = today(); const a = period(ST.addDays(t, -29), t), b = period(ST.addDays(t, -59), ST.addDays(t, -30));
    let h = '<div class="ttl"><h2>Progreso<small>Tú frente a tu yo de hace un mes</small></h2></div>';
    if (!a.ses && !b.ses && !a.rounds) return h + '<div class="card empty"><p>Registra entrenos y rounds y aquí verás cómo evolucionas.</p></div>';
    const rows = [['Entrenos', 'ses', 1], ['Horas', 'min', 1, (x) => nfix(x / 60, 1) + ' h'], ['Rounds', 'rounds', 1], ['Finalizaciones hechas', 'sm', 1], ['Finalizaciones recibidas', 'sr', -1], ['Pases hechos', 'pm', 1], ['Pases recibidos', 'pr', -1], ['Raspados', 'sw', 1], ['Escapes logrados', 'es', 1]];
    let better = 0, worse = 0, tot = 0; rows.forEach((r) => { const d = a[r[1]] - b[r[1]]; if (a[r[1]] + b[r[1]] > 0) { tot++; if (d !== 0) { if ((d > 0) === (r[2] > 0)) better++; else worse++; } } });
    h += card(ct('Últimos 30 días vs 30 anteriores') + '<div class="small muted" style="display:grid;grid-template-columns:1fr 54px 54px 70px;gap:4px;margin-bottom:4px"><span></span><b style="text-align:right">Ahora</b><b style="text-align:right">Antes</b><b style="text-align:right">Cambio</b></div>' +
      rows.map((r) => { const f = r[3] || ((x) => String(Math.round(x))); return '<div style="display:grid;grid-template-columns:1fr 54px 54px 70px;gap:4px;padding:6px 0;border-top:1px solid var(--line);font-size:14px"><span>' + r[0] + '</span><b style="text-align:right">' + f(a[r[1]]) + '</b><span class="muted" style="text-align:right">' + f(b[r[1]]) + '</span><span style="text-align:right">' + dlt(a[r[1]], b[r[1]], r[2], f) + '</span></div>'; }).join(''));
    if (tot >= 3) h += '<div class="insight"><b class="k">COACH</b> · Mejoras en <b>' + better + ' de ' + tot + '</b> indicadores' + (worse ? ' y empeoras en <b>' + worse + '</b>' : '') + (better > worse ? ': buen mes, sigue por ahí.' : better === worse ? ': mes parecido al anterior.' : ': mes más flojo; mira tus puntos débiles y el reto de la semana.') + '</div>';
    const p1 = period(ST.addDays(t, -59), t), p0 = period(ST.addDays(t, -119), ST.addDays(t, -60)); const ax1 = radarAxes(p1), ax0 = radarAxes(p0);
    h += card(ct('Mapa de habilidades') + radar(ax1, ax0) + '<div class="row" style="justify-content:center;gap:14px;margin-top:6px;font-size:12px"><span style="color:var(--green)">━ últimos 60 días</span><span class="muted">┅ 60 días anteriores</span></div>' +
      '<p class="small muted" style="margin:10px 0 0">Cada eje compara lo que haces con lo que te hacen: p. ej. Pases = pases hechos ÷ (hechos + recibidos). 50% es ir igualado. Escapes = % de escapes logrados. Cardio = tu media (1-5). Constancia = entrenos frente a 12 en 60 días. Los ejes en gris no tienen datos suficientes (mínimo 3 acciones).</p>');
    const L = ACH(); const on = L.filter((x) => x.on);
    h += '<div class="row between" style="margin:14px 0 8px"><h3 style="margin:0">Logros</h3>' + pill(on.length + ' / ' + L.length) + '</div><div class="achg">' + L.map((x) => '<div class="ach ' + (x.on ? 'on' : '') + '"><span class="ai">' + x.ico + '</span><b>' + esc(x.name) + '</b><span class="small muted">' + esc(x.desc) + '</span>' + (x.on ? '<span class="small" style="color:var(--gold)">' + (((S.ach || {})[x.id] || 'ya') === 'ya' ? 'Conseguido' : fmtDate(S.ach[x.id])) + '</span>' : '<span class="pbar"><i style="width:' + Math.round((x.cur / x.target) * 100) + '%"></i></span><span class="small muted">' + x.cur + ' / ' + x.target + '</span>') + '</div>').join('') + '</div>';
    return h;
  };

  // =====================================================================
  // BRIEFING ANTES DE ENTRENAR
  // =====================================================================
  V.briefing = () => {
    meta(); const t = today(); let h = '<div class="ttl"><h2>Antes de entrenar<small>' + ST.parse(t).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + '</small></h2></div>';
    const gs = U.activeGoals().filter((g) => (g.period === 'day' ? U.appliesOn(g, t) : true));
    h += card(ct('🎯 Tus objetivos de hoy') + (gs.length ? gs.map((g) => { const p = U.gp(g, t); return '<div class="cnt"><span>' + esc(g.text) + '</span>' + pill(plabel(p), p.pct >= 100 ? 'ok' : '') + '</div>'; }).join('') : '<p class="small muted" style="margin:0">No tienes objetivos activos. Crea uno en BJJ › Hoy / Semana.</p>'));
    const inj = activeInj();
    if (inj.length) h += card('<div class="ct" style="color:var(--orange)">🩹 CUIDADO HOY</div>' + inj.map((i) => '<div class="cnt"><span><b>' + esc(i.zone) + '</b> · ' + LEVELS[i.level] + '</span></div>').join('') + '<p class="small muted" style="margin:6px 0 0">Calienta esa zona, avisa a tus compañeros y para si duele más.' + (inj.some((i) => i.level >= 3) ? ' Una de ellas es de «no puedo entrenar»: valora descansar.' : '') + '</p>');
    const ls = loadStatus(); if (ls.lvl !== 'nodata') h += card(ct('⚖️ Carga') + '<p style="margin:0">' + esc(ls.msg) + '</p>');
    const last = S.sessions[0]; if (last) { const hardW = (last.worked || []).filter((w) => w.rating === 'hard'); const rv = last.review || {}; h += card(ct('🔁 Del último entreno (' + fmtDate(last.date) + ')') + (hardW.length ? '<p style="margin:0 0 6px">Te costó: <b>' + hardW.map((w) => esc(APP.tn(w.name))).join(', ') + '</b></p>' : '') + (rv.hard ? '<p style="margin:0 0 6px">' + esc(rv.hard) + '</p>' : '') + (last.notes ? '<p class="small muted" style="margin:0">' + esc(last.notes) + '</p>' : '') + (!hardW.length && !rv.hard && !last.notes ? '<p class="small muted" style="margin:0">Sin notas del último entreno.</p>' : '')); }
    const w = weak()[0]; if (w) h += card(ct('🧩 Punto débil principal') + '<b>' + esc(w.title) + '</b><div class="small muted" style="margin:2px 0 8px">' + esc(w.why) + '</div><button class="btn small secondary" data-act="wkStudy" data-id="' + esc(w.id) + '">Repasarlo ahora ›</button>');
    h += chCard(true);
    const due = APP.dueCount(); if (due) h += card(ct('🧠 Repaso') + '<div class="row between"><span>' + due + ' apuntes por repasar</span><a class="btn small secondary" style="text-decoration:none" href="#/repaso">Repasar</a></div>');
    const stu = (S.study || []).slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0]; if (stu) h += card(ct('🎓 Estudiando') + '<div class="row between"><span><b>' + esc(APP.tn(stu.title)) + '</b></span><a class="btn small secondary" style="text-decoration:none" href="#/estudio/' + stu.id + '">Abrir</a></div>');
    h += '<button class="btn block" style="margin-top:6px" data-act="newSession">+ Registrar el entreno después</button>';
    return h;
  };

  // =====================================================================
  // INTEGRACIÓN EN INICIO Y EN EL PANEL BJJ
  // =====================================================================

  // ---------- Bloque rojo del panel BJJ: dónde me dominan · qué mejorar · qué me costó ----------
  function redBlock() {
    const t = today(), from = ST.addDays(t, -89); const rs = S.rounds.filter((r) => r.date >= from);
    const rep = ST.report(S.rounds, { from, to: t }); const ev = ST.flatten(rs); const ok = (k) => k && k !== 'Sin especificar';
    const tally = (arr) => { const m = {}; arr.forEach((k) => { if (k) m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map((k) => ({ key: k, n: m[k] })).sort((a, b) => b.n - a.n); };
    const lost = tally(ev.filter((e) => ['pos_lost', 'pass_recv', 'sweep_recv', 'takedown_recv'].includes(e.kind)).map((e) => e.to)).filter((r) => ok(r.key)).slice(0, 3);
    const pg = rep.guards.passesReceivedByGuard.rows.filter((r) => ok(r.key))[0];
    const sb = rep.subs.received.rows.filter((r) => ok(r.key))[0], sp = rep.subs.receivedByPosition.rows.filter((r) => ok(r.key))[0];
    const dom = [];
    if (lost.length) dom.push('<div class="rl"><span>Posiciones donde más me dominan</span><b>' + lost.map((r) => esc(APP.tn(r.key)) + ' (' + r.n + ')').join(' · ') + '</b></div>');
    if (pg) dom.push('<div class="rl"><span>Guardia desde la que más me pasan</span><b>' + esc(APP.tn(pg.key)) + ' (' + pg.n + ')</b></div>');
    if (sb) dom.push('<div class="rl"><span>Llave que más me hacen</span><b>' + esc(APP.tn(sb.key)) + ' (' + sb.n + ')' + (sp ? ' · desde ' + esc(APP.tn(sp.key)) : '') + '</b></div>');
    const ws = weak().slice(0, 2);
    const last = S.sessions[0]; const hardW = last ? (last.worked || []).filter((w) => w.rating === 'hard') : []; const rv = (last && last.review) || {};
    let h = '<div class="redb"><div class="ct">⚠ PARA MEJORAR</div>';
    h += '<div class="rh">Donde más me dominan</div>' + (dom.length ? dom.join('') : '<p class="small muted" style="margin:0">Registra «Me dominaron en…» y las llaves recibidas en tus rounds para verlo aquí.</p>');
    h += '<div class="rh">Lo que tengo que mejorar</div>' + (ws.length ? ws.map((w) => '<div class="rl" data-act="wkStudy" data-id="' + esc(w.id) + '" style="cursor:pointer"><span>' + esc(w.why) + '</span><b>' + esc(w.title) + ' ›</b></div>').join('') : '<p class="small muted" style="margin:0">Aún no hay datos suficientes para detectarlo.</p>');
    h += '<div class="rh">Lo que me costó el entreno anterior' + (last ? ' · ' + fmtDate(last.date) : '') + '</div>';
    h += last ? ((hardW.length ? '<div class="rl"><span>Técnicas que me costaron</span><b>' + hardW.map((w) => esc(APP.tn(w.name))).join(', ') + '</b></div>' : '') + (rv.hard ? '<div class="rl"><span>Lo que más me costó</span><b>' + esc(rv.hard) + '</b></div>' : '') + (!hardW.length && !rv.hard ? '<p class="small muted" style="margin:0">No anotaste qué te costó. Hazlo al registrar (paso «Objetivos y técnicas»).</p>' : '')) : '<p class="small muted" style="margin:0">Aún no has registrado ningún entreno.</p>';
    return h + '</div>' + (APP.intensityCard ? APP.intensityCard() : '');
  }
  const oldInicio = V.inicio;
  V.inicio = () => {
    meta(); const h = oldInicio(); const rows = [];
    const link = (href, ico, txt, c) => '<a href="' + href + '" class="cnt" style="text-decoration:none;color:inherit"><span>' + ico + ' ' + txt + '</span><span class="muted" style="' + (c ? 'color:' + c : '') + '">›</span></a>';
    rows.push(link('#/briefing', '▶', '<b>Antes de entrenar</b> · tu resumen de hoy'));
    const inj = activeInj(); if (inj.length) rows.push(link('#/carga', '🩹', 'Molestia activa: <b>' + inj.map((i) => esc(i.zone)).join(', ') + '</b>', 'var(--orange)'));
    const due = APP.dueCount(); if (due) rows.push(link('#/repaso', '🧠', '<b>' + due + '</b> apuntes para repasar', 'var(--orange)'));
    const ls = loadStatus(); if (ls.lvl === 'high' || ls.lvl === 'vhigh') rows.push(link('#/carga', '⚖️', 'Carga alta esta semana (' + nfix(ls.r, 1) + '×)', 'var(--orange)'));
    if (backupDue()) rows.push('<a href="#" data-act="exportShare" class="cnt" style="text-decoration:none;color:inherit"><span>💾 <b>Haz una copia de seguridad</b>' + (backupDays() === null ? '' : ' · hace ' + backupDays() + ' días') + '</span><span style="color:var(--orange)">›</span></a>');
    const blk = card(ct('Hoy en tu BJJ') + rows.join('')) + chCard(true);
    const i = h.indexOf('<div class="pair'); setTimeout(checkAch, 300);
    return i >= 0 ? h.slice(0, i) + blk + h.slice(i) : blk + h;
  };
  const oldEntrenos = V.entrenos;
  V.entrenos = () => {
    meta(); const h = oldEntrenos(); const tile = (href, ico, name, sub) => '<a href="' + href + '"><span style="font-size:20px">' + ico + '</span><span class="tv" style="font-size:12px">' + name + '</span>' + (sub ? '<span class="ts">' + sub + '</span>' : '') + '</a>';
    const due = APP.dueCount(); const ls = loadStatus();
    const blk = chCard(false) + '<a class="btn block secondary" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px" href="#/briefing">▶ Antes de entrenar</a><div class="tl3">' + tile('#/progreso', '🏆', 'Progreso', (S.ach ? Object.keys(S.ach).length : 0) + ' logros') + tile('#/carga', '🩹', 'Carga', activeInj().length ? activeInj().length + ' molestia' + (activeInj().length > 1 ? 's' : '') : ls.r === null ? '' : nfix(ls.r, 1) + '×') + tile('#/repaso', '🧠', 'Repaso', due ? due + ' hoy' : 'al día') + '</div>';
    setTimeout(checkAch, 300);
    const k = h.indexOf('</h2></div>') + 11;
    return (k > 11 ? h.slice(0, k) + redBlock() + h.slice(k) : redBlock() + h).replace('<a class="card" href="#/estudio"', blk + '<a class="card" href="#/estudio"');
  };
  APP.loadStatus = loadStatus; APP.activeInj = activeInj; APP.weak = weak; APP.LEVELS = LEVELS;
  const oldRender = APP.render;
  APP.render = function () { oldRender(); if (APP.route && ['estudio', 'entreno', 'entrenos', 'progreso'].includes(APP.route.name)) setTimeout(checkAch, 400); };
})();
