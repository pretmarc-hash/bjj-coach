/* Entrenamientos, rounds, cuestionario e Inicio. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, nowTime, fmtDate, field, group, chips, scale, sel, tags, tagField, val } = APP;
  const V = APP.views, A = APP.actions;

  const TYPES = ['Clase técnica', 'Sparring', 'Open mat', 'Competición', 'Drilling', 'Preparación física', 'Clase particular'];
  const MOODS = ['Genial', 'Bien', 'Normal', 'Duro', 'Mal'];
  const MODE_OPTS = [{ v: 'gi', l: 'GI' }, { v: 'nogi', l: 'NO-GI' }];
  const RESULT_OPTS = [{ v: 'win', l: 'Victoria' }, { v: 'loss', l: 'Derrota' }, { v: 'draw', l: 'Empate' }, { v: 'none', l: 'Sin resultado' }];
  const modeLabel = (m) => ({ gi: 'GI', nogi: 'NO-GI' }[m] || '');
  const defaultMode = () => (S.profile && (S.profile.mode === 'gi' || S.profile.mode === 'nogi') ? S.profile.mode : '');

  APP.titles = Object.assign(APP.titles, { inicio: 'Inicio', entrenos: 'BJJ', entreno: 'Sesión' });

  // ================= INICIO =================
  function monthsSince(ym) {
    if (!ym) return null;
    const p = ym.split('-').map(Number); const n = new Date();
    return (n.getFullYear() - p[0]) * 12 + (n.getMonth() + 1 - p[1]);
  }
  function practicing(ym) {
    const m = monthsSince(ym); if (m === null || m < 0) return '';
    const y = Math.floor(m / 12), r = m % 12;
    return (y ? y + (y === 1 ? ' año' : ' años') : '') + (y && r ? ' y ' : '') + (r || !y ? r + (r === 1 ? ' mes' : ' meses') : '');
  }
  const beltName = (b) => ({ blanco: 'Cinturón blanco', azul: 'Cinturón azul', morado: 'Cinturón morado', marron: 'Cinturón marrón', negro: 'Cinturón negro' }[b] || '');
  APP.profileLine = (p) => [beltName(p.belt) + (p.belt && p.stripes ? ' · ' + p.stripes + (Number(p.stripes) === 1 ? ' grado' : ' grados') : ''), practicing(p.since) ? 'practicando ' + practicing(p.since) : '', ({ gi: 'GI', nogi: 'NO-GI', both: 'GI y NO-GI' }[p.mode] || '')].filter(Boolean).join(' · ');

  // ---------- objetivos con seguimiento por entrenamiento ----------
  // Cada sesión guarda si se cumplió cada objetivo activo (goalChecks: { idObjetivo: 'si' | 'medias' | 'no' }).
  const CHECK = { si: ['✓', 'Sí', 1], medias: ['½', 'A medias', 0.5], no: ['✕', 'No', 0] };
  const goalRange = (g, ref) => (g.period === 'month' ? ST.monthRange(ref.slice(0, 7)) : { from: ST.weekStart(ref), to: ST.addDays(ST.weekStart(ref), 6) });
  const prevRef = (g, ref) => (g.period === 'month' ? ST.prevMonth(ref.slice(0, 7)) + '-01' : ST.addDays(ST.weekStart(ref), -7));
  const defaultTarget = (period) => { const w = (S.profile && Number(S.profile.weeklyTarget)) || Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length || 3; return period === 'month' ? w * 4 : w; };
  function goalProgress(g, ref) {
    const r = goalRange(g, ref); const ss = S.sessions.filter((s) => s.date >= r.from && s.date <= r.to && s.goalChecks && s.goalChecks[g.id]).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const marks = ss.map((s) => s.goalChecks[g.id]); const score = marks.reduce((a, m) => a + (CHECK[m] ? CHECK[m][2] : 0), 0); const target = Number(g.target) || 0;
    return { marks, asked: ss.length, score, target, pct: target ? Math.min(100, ST.pct(score, target)) : (ss.length ? ST.pct(score, ss.length) : 0), range: r };
  }
  APP.goalProgress = goalProgress;
  const fmtScore = (x) => (Math.round(x * 2) / 2).toString().replace('.5', ',5');
  function goalRow(g) {
    const t = today(); const p = goalProgress(g, t); const prev = goalProgress(g, prevRef(g, t)); const per = g.period === 'month' ? 'este mes' : 'esta semana';
    return '<button class="goal" data-act="goalOpen" data-id="' + g.id + '">' + APP.ring(p.pct, fmtScore(p.score) + (p.target ? '/' + p.target : ''), '', p.target && p.score >= p.target ? 'var(--gold)' : 'var(--green-2)') +
      '<span class="gbody"><b>' + esc(g.text) + '</b><span class="marks">' + (p.marks.length ? p.marks.map((m) => '<i class="m-' + m + '">' + CHECK[m][0] + '</i>').join('') : '<span class="pill-n">Sin entrenos valorados ' + per + '</span>') + '</span>' +
      '<span class="pill-n">' + (p.target && p.score >= p.target ? '🏆 Cumplido ' + per : p.target ? 'Te faltan ' + fmtScore(p.target - p.score) + ' ' + per : 'Conseguido en ' + fmtScore(p.score) + ' de ' + p.asked + ' entrenos') + (prev.asked ? ' · antes: ' + fmtScore(prev.score) + (prev.target ? '/' + prev.target : ' de ' + prev.asked) : '') + '</span></span></button>';
  }
  function goalsCard() {
    const act = S.goals.filter((g) => !g.done); const wk = act.filter((g) => g.period !== 'month'), mo = act.filter((g) => g.period === 'month');
    const block = (title, list) => (list.length ? '<div class="glabel">' + title + '</div>' + list.map(goalRow).join('') : '');
    return '<div class="card"><div class="row between"><h3>Mis objetivos</h3><button class="btn small ghost" data-act="addGoal">+ Añadir</button></div>' +
      (act.length ? block('Semanal', wk) + block('Mensual', mo) : '<p class="muted" style="margin:0 0 10px">Ponte un objetivo semanal o mensual. Al registrar cada entreno te preguntaré si lo has conseguido.</p><button class="btn secondary block" data-act="suggest">Sugerir según mis datos</button>') + '</div>';
  }
  APP.goalsCard = goalsCard;
  function goalForm(g) {
    g = g || {}; const period = g.period || 'week';
    APP.openSheet(g.id ? 'Editar objetivo' : 'Nuevo objetivo', field('¿Qué quieres conseguir?', '<input id="g-text" placeholder="Ej.: pasar la guardia con corte de rodilla" value="' + esc(g.text || '') + '">') +
      group('Periodo', '<div class="chips" data-group="gp" data-onchange="goalPeriod">' + [['week', 'Semanal'], ['month', 'Mensual']].map((x) => '<button type="button" class="chip' + (period === x[0] ? ' on' : '') + '" data-val="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>') +
      field('¿En cuántos entrenamientos quieres conseguirlo?', '<input type="number" id="g-target" inputmode="numeric" min="1" max="60" value="' + (g.target || defaultTarget(period)) + '">') +
      '<p class="small muted">Después de cada entreno marcarás si lo has conseguido; así se ve el avance hacia esa cifra.</p><button class="btn block" data-act="saveGoal" data-id="' + (g.id || '') + '">Guardar</button>');
  }
  A.goalPeriod = (chip) => { const i = APP.$('#g-target'); if (i) i.value = defaultTarget(chip.dataset.val); };
  A.addGoal = () => goalForm();
  A.goalEdit = (el) => goalForm(S.goals.find((x) => x.id === el.dataset.id));
  A.saveGoal = async (el) => {
    const text = val('g-text').trim(); if (!text) return APP.toast('Escribe el objetivo');
    const old = S.goals.find((x) => x.id === (el && el.dataset.id));
    await APP.saveGoal(Object.assign({}, old, { id: old ? old.id : uid(), text, period: sel('gp')[0] || 'week', target: Math.max(1, Number(val('g-target')) || 0), done: old ? old.done : false, created: old ? old.created : today() }));
    APP.closeSheet(); APP.render();
  };
  A.goalDone = async (el) => { const g = S.goals.find((x) => x.id === el.dataset.id); if (g) { g.done = true; g.doneDate = today(); await APP.saveGoal(g); if (APP.sheetOpen()) APP.closeSheet(); APP.render(); APP.toast('Objetivo completado'); } };
  A.goalDel = async (el) => { if (!APP.confirm('¿Borrar este objetivo y su seguimiento?')) return; await APP.deleteGoal(el.dataset.id); if (APP.sheetOpen()) APP.closeSheet(); APP.render(); };
  A.goalOpen = (el) => {
    const g = S.goals.find((x) => x.id === el.dataset.id); if (!g) return; const hist = []; let ref = today();
    for (let i = 0; i < 6; i++) { const p = goalProgress(g, ref); hist.unshift({ p, label: g.period === 'month' ? ST.parse(p.range.from).toLocaleDateString('es-ES', { month: 'short' }) : ST.parse(p.range.from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }); ref = prevRef(g, ref); }
    const max = Math.max.apply(null, hist.map((h) => Math.max(h.p.score, h.p.target || 0))) || 1; const cur = hist[hist.length - 1].p;
    APP.openSheet(g.text, '<div class="kpis" style="margin-bottom:12px">' + APP.ring(cur.pct, fmtScore(cur.score) + (cur.target ? '/' + cur.target : ''), g.period === 'month' ? 'este mes' : 'esta semana') + '<div class="kpi"><div class="big">' + cur.asked + '</div><div class="label">entrenos valorados</div></div></div>' +
      '<h3 style="margin-bottom:8px">' + (g.period === 'month' ? 'Últimos 6 meses' : 'Últimas 6 semanas') + '</h3><div class="ghist">' + hist.map((h) => '<div class="gcol"><span class="gv">' + (h.p.asked ? fmtScore(h.p.score) : '–') + '</span><div class="gbar"><div style="height:' + Math.round((h.p.score / max) * 100) + '%" class="' + (h.p.target && h.p.score >= h.p.target ? 'ok' : '') + '"></div></div><span class="gl">' + h.label + '</span></div>').join('') + '</div>' +
      '<p class="small muted">Veces conseguido en cada periodo (un «a medias» cuenta 0,5)' + (g.target ? '. Meta: ' + g.target + '.' : '.') + '</p>' +
      '<div class="stack" style="margin-top:12px"><button class="btn secondary block" data-act="goalEdit" data-id="' + g.id + '">Editar</button><button class="btn block" data-act="goalDone" data-id="' + g.id + '">Dar por completado y archivar</button><button class="btn ghost block" data-act="goalDel" data-id="' + g.id + '">Borrar</button></div>');
  };
  // Pregunta tras registrar un entreno: ¿has conseguido cada objetivo hoy?
  function goalCheckHTML(s) {
    return S.goals.filter((g) => !g.done).map((g) => '<div class="gcheck"><b>' + esc(g.text) + '</b><span class="pill-n">' + (g.period === 'month' ? 'Mensual' : 'Semanal') + '</span><div class="chips big3" data-group="gc-' + g.id + '">' + Object.keys(CHECK).map((k) => '<button type="button" class="chip c-' + k + ((s.goalChecks || {})[g.id] === k ? ' on' : '') + '" data-val="' + k + '">' + CHECK[k][0] + ' ' + CHECK[k][1] + '</button>').join('') + '</div></div>').join('');
  }
  function goalCheckSheet(id, thenReview) {
    const s = S.sessions.find((x) => x.id === id); if (!s) return;
    APP.openSheet('¿Has conseguido tu objetivo hoy?', goalCheckHTML(s) + '<button class="btn block" style="margin-top:6px" data-act="goalCheckSave" data-id="' + id + '" data-review="' + (thenReview ? '1' : '') + '">' + (thenReview ? 'Guardar y seguir' : 'Guardar') + '</button><button class="btn ghost block" style="margin-top:8px" data-act="goalCheckSkip" data-id="' + id + '" data-review="' + (thenReview ? '1' : '') + '">Ahora no</button>');
  }
  A.goalCheck = (el) => goalCheckSheet(el.dataset.id, false);
  A.goalCheckSave = async (el) => {
    const s = S.sessions.find((x) => x.id === el.dataset.id); if (!s) return; const gc = Object.assign({}, s.goalChecks);
    S.goals.filter((g) => !g.done).forEach((g) => { const v = sel('gc-' + g.id)[0]; if (v) gc[g.id] = v; });
    s.goalChecks = gc; await APP.saveSession(s); APP.closeSheet(); APP.render();
    if (el.dataset.review === '1') reviewForm(s.id); else APP.toast('Objetivos actualizados');
  };
  A.goalCheckSkip = (el) => { APP.closeSheet(); if (el.dataset.review === '1') reviewForm(el.dataset.id); };

  // ================= INICIO =================
  const DAYL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  function weekStrip(ws) {
    const t = today();
    return '<div class="wstrip">' + DAYL.map((l, i) => {
      const d = ST.addDays(ws, i); const n = S.sessions.filter((s) => s.date === d).length; const gym = ((S.gym && S.gym.logs) || []).some((x) => x.date === d);
      const planned = APP.plan && APP.plan.occurrences(d).some((o) => !o.done); const cls = n ? 'done' : planned ? (d < t ? 'miss' : 'plan') : '';
      return '<button class="wd ' + cls + (d === t ? ' today' : '') + '" data-act="dayPeek" data-d="' + d + '" aria-label="' + fmtDate(d) + '"><span>' + l + '</span><i>' + (n ? (n > 1 ? n : '✓') : ST.parse(d).getDate()) + '</i>' + (gym ? '<em></em>' : '') + '</button>';
    }).join('') + '</div>';
  }
  A.dayPeek = (el) => {
    const d = el.dataset.d; const ss = S.sessions.filter((s) => s.date === d); const logs = ((S.gym && S.gym.logs) || []).filter((x) => x.date === d); const occ = APP.plan ? APP.plan.occurrences(d).filter((o) => !o.done) : [];
    APP.openSheet(fmtDate(d), (ss.length ? '<div class="list">' + ss.map(sessionRow).join('') + '</div>' : '') +
      (logs.length ? '<div class="list">' + logs.map((l) => '<a class="item" href="#/gym" data-close style="text-decoration:none;color:inherit"><div><div class="title">🏋️ ' + esc(l.name) + '</div><div class="pill-n">' + (l.duration ? l.duration + ' min · ' : '') + l.entries.length + ' ejercicios</div></div></a>').join('') + '</div>' : '') +
      (occ.length ? occ.map((o) => '<p class="muted" style="margin:10px 0 0">Planificado' + (o.start ? ' a las ' + o.start : '') + (o.focus ? ': ' + esc(o.focus) : '') + '</p>').join('') : '') +
      (!ss.length && !logs.length && !occ.length ? '<p class="muted">Nada registrado ni planificado.</p>' : '') +
      (d <= today() ? '<button class="btn block" style="margin-top:14px" data-act="newSessionOn" data-d="' + d + '">Registrar entreno de BJJ este día</button>' : ''));
  };
  A.newSessionOn = (el) => sessionForm({ date: el.dataset.d });

  V.inicio = () => {
    const p = S.profile; const t = today(); const ws = ST.weekStart(t); const we = ST.addDays(ws, 6);
    const weekS = S.sessions.filter((s) => s.date >= ws && s.date <= we); const minutes = weekS.reduce((a, s) => a + (Number(s.duration) || 0), 0);
    const target = p && Number(p.weeklyTarget) ? Number(p.weeklyTarget) : 0;
    const weekR = S.rounds.filter((r) => r.date >= ws && r.date <= we); const sparMin = weekR.reduce((a, r) => a + (Number(r.duration) || 0), 0);
    const prevS = S.sessions.filter((s) => s.date >= ST.addDays(ws, -7) && s.date < ws).length;
    let h = '';
    // 1. Esta semana
    h += '<div class="card"><div class="row between"><h3>Esta semana</h3><a href="#/informe">Informe</a></div>' + weekStrip(ws) + '<div class="kpis" style="margin-top:14px">' +
      APP.ring(target ? ST.pct(Math.min(weekS.length, target), target) : (weekS.length ? 100 : 0), weekS.length + (target ? '/' + target : ''), 'entrenos') +
      '<div class="kpi"><div class="big">' + minutes + '</div><div class="label">minutos</div></div>' +
      '<div class="kpi"><div class="big">' + weekR.length + '</div><div class="label">rounds' + (sparMin ? ' · ' + sparMin + ' min' : '') + '</div></div></div>' +
      '<p class="small muted" style="margin:10px 0 0;text-align:center">Semana pasada: ' + prevS + (prevS === 1 ? ' entreno' : ' entrenos') + '</p></div>';
    // 2. Objetivos semanal y mensual con su avance
    h += goalsCard();
    // 3. Lo que toca hoy (plan, registros pendientes)
    if (APP.plan) h += APP.plan.banner();
    if (!(p && p.done)) h += '<div class="card today-card"><h3>Personaliza la app</h3><p class="muted" style="margin:0 0 10px">4 pantallas cortas sobre tu jiu-jitsu.</p><button class="btn block" data-act="interview">Empezar</button></div>';
    // 4. Físico y nutrición de un vistazo
    if (APP.homeExtra) h += APP.homeExtra();
    // 5. Una recomendación del entrenador (solo si hay algo que decir)
    const insights = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, t); const rec = insights.find((i) => i.type === 'recomendacion');
    if (rec) h += '<div class="card"><div class="row between"><h3>Entrenador</h3><a href="#/coach">Ver todo</a></div>' + APP.insightHTML([rec]) + '</div>';
    // 6. Técnicas más trabajadas
    const top = ST.tally(S.sessions.filter((x) => x.date >= ST.addDays(t, -29)).reduce((a, x) => a.concat(ST.splitTags(x.techniques)), []), (x) => x).slice(0, 5);
    if (top.length) h += '<div class="card"><div class="row between"><h3>Técnicas más trabajadas</h3><span class="pill-n">30 días</span></div>' + APP.rank(top, { fmt: (r) => r.n + (r.n === 1 ? ' sesión' : ' sesiones') }) + '</div>';
    return h;
  };

  // ================= BJJ: un solo panel, sin submenús =================
  function sessionRow(s) {
    const nr = S.rounds.filter((r) => r.sessionId === s.id).length; const rt = s.review && s.review.rating; const gc = s.goalChecks ? Object.keys(s.goalChecks).filter((k) => S.goals.some((g) => g.id === k)).map((k) => s.goalChecks[k]) : [];
    return '<a class="item" href="#/entreno/' + s.id + '" data-close style="text-decoration:none;color:inherit"><span class="datebox"><b>' + ST.parse(s.date).getDate() + '</b>' + ST.parse(s.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') + '</span><div style="flex:1;min-width:0"><div class="title">' + esc(s.type || 'Entrenamiento') + ' ' + (s.mode ? '<span class="tag">' + modeLabel(s.mode) + '</span>' : '') + '</div><div class="pill-n">' + [s.duration ? s.duration + ' min' : '', nr ? nr + ' rounds' : '', (s.techniques || []).slice(0, 2).map(APP.tn).join(', ')].filter(Boolean).join(' · ') + '</div>' + (gc.length ? '<span class="marks">' + gc.map((m) => '<i class="m-' + m + '">' + CHECK[m][0] + '</i>').join('') + '</span>' : '') + '</div>' +
      (rt ? '<span class="rate r' + (rt >= 8 ? 'h' : rt >= 5 ? 'm' : 'l') + '">' + rt + '</span>' : '') + '</a>';
  }
  APP.ui.allSessions = false;
  A.sessionsAll = () => { APP.ui.allSessions = !APP.ui.allSessions; const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  V.entrenos = () => {
    const rep = ST.report(S.rounds, {}); const lv = Object.keys(S.mastery).filter((k) => S.mastery[k] > 0).length; const days = Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length;
    const tile = (href, ico, name, sub) => '<a class="tile" href="' + href + '"><span class="ico">' + ico + '</span><b>' + name + '</b><span class="pill-n">' + sub + '</span></a>';
    let h = '<div class="tiles t3">' + tile('#/juego', '🥋', 'Mi juego', lv ? lv + ' técnicas con nivel' : 'Tu perfil técnico') + tile('#/arbol', '🌳', 'Game plan', S.tree.nodes.length ? S.tree.nodes.length + ' pasos' : 'Tu árbol') + tile('#/apuntes', '📝', 'Apuntes', S.notes.length + ' guardados') +
      tile('#/stats', '📊', 'Estadísticas', S.rounds.length + (S.rounds.length === 1 ? ' round' : ' rounds')) + tile('#/plan', '📅', 'Plan', days ? days + ' días/semana' : 'Calendario') + tile('#/biblio', '📚', 'Técnicas', S.lib.length + ' en biblioteca') + '</div>';
    if (APP.plan) { const nx = APP.plan.next(); const pend = APP.plan.pending(); if (pend.length || (nx && nx.inDays === 0)) h += APP.plan.banner(); }
    // Tu juego en datos: solo con rounds registrados
    if (S.rounds.length) {
      const e = [['Finalizaciones', rep.subs.efficacy, 'var(--red)'], ['Pases', rep.passes.efficacy, 'var(--blue)'], ['Escapes', rep.escapes.efficacy, 'var(--gold)']];
      h += '<div class="card"><div class="row between"><h3>Mi eficacia</h3><a href="#/stats">Detalle</a></div><div class="kpis">' + e.map((x) => APP.ring(x[1].total ? x[1].pct : 0, x[1].total ? x[1].pct + '%' : '–', x[0] + '<br><span class="pill-n">' + (x[1].total ? x[1].success + ' de ' + x[1].total : 'sin intentos') + '</span>', x[2])).join('') + '</div>' + (e.some((x) => x[1].total > 0 && x[1].total < 8) ? '<p class="small muted" style="margin:8px 0 0;text-align:center">Con menos de 8 intentos el porcentaje es solo orientativo.</p>' : '') + '</div>';
      const p = S.profile; const insights = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, today());
      const strengths = rep.subs.made.rows.filter((r) => r.n >= 2).slice(0, 2).map((r) => APP.tn(r.key) + ' ×' + r.n).concat(rep.passes.byTech.filter((x) => x.total >= 3 && x.pct >= 50).slice(0, 1).map((x) => 'Pase ' + APP.tn(x.tech) + ' ' + x.success + '/' + x.total)).concat(p && p.strengths ? [p.strengths] : []);
      const weak = insights.filter((i) => i.type === 'patron' && /finalizado|Escapes desde|pasado la guardia|dificultad/.test(i.text)).slice(0, 3).map((i) => i.text).concat(p && p.weaknesses ? [p.weaknesses] : []);
      if (strengths.length || weak.length) h += '<div class="card"><div class="two"><div><div class="glabel">Fortalezas</div>' + (strengths.length ? strengths.map((x) => '<p class="li ok">' + esc(x) + '</p>').join('') : '<p class="muted small">Aún sin datos.</p>') + '</div><div><div class="glabel">A mejorar</div>' + (weak.length ? weak.map((x) => '<p class="li bad">' + esc(x) + '</p>').join('') : '<p class="muted small">Nada detectado.</p>') + '</div></div></div>';
    }
    const all = APP.ui.allSessions; const list = all ? S.sessions : S.sessions.slice(0, 5);
    h += '<div class="card"><div class="row between"><h3>Entrenamientos</h3><span class="pill-n">' + S.sessions.length + '</span></div>' + (S.sessions.length ? '<div class="list">' + list.map(sessionRow).join('') + '</div>' + (S.sessions.length > 5 ? '<button class="btn ghost block" style="margin-top:8px" data-act="sessionsAll">' + (all ? 'Ver menos' : 'Ver los ' + S.sessions.length) + '</button>' : '') : '<div class="empty">Registrar un entreno lleva menos de un minuto.</div>') + '</div>';
    const orphans = S.rounds.filter((r) => !r.sessionId).sort((a, b) => b.date.localeCompare(a.date));
    if (orphans.length) h += '<details class="card acc" data-acc="orph"' + (APP.ui.acc && APP.ui.acc.orph ? ' open' : '') + '><summary><h3>Rounds sueltos</h3><span class="pill-n">' + orphans.length + '</span></summary><div class="list">' + orphans.map((r) => roundRow(r)).join('') + '</div></details>';
    h += '<div class="chips" style="justify-content:center;margin-top:4px"><a class="chip sm" href="#/coach">💬 Entrenador</a><a class="chip sm" href="#/informe">Informe semanal</a><a class="chip sm" href="#/mensual">Informe mensual</a></div>';
    return h;
  };

  // ---------- formulario de sesión ----------
  function sessionForm(s) {
    s = s || {};
    const html =
      '<div class="grid2">' + field('Fecha', '<input type="date" id="sf-date" value="' + (s.date || today()) + '">') + field('Hora', '<input type="time" id="sf-time" value="' + (s.time || nowTime()) + '">') + '</div>' +
      '<div class="grid2">' + field('Duración (min)', '<input type="number" id="sf-dur" inputmode="numeric" min="0" placeholder="60" value="' + (s.duration || '') + '">') + group('Modalidad', chips('mode', MODE_OPTS, s.mode || defaultMode())) + '</div>' +
      group('Tipo de sesión', chips('type', TYPES, s.type, false, true)) +
      group('Técnicas trabajadas', tagField('techs', s.techniques, 'dl-tech', 'Ej.: Knee Cut')) +
      group('Posiciones practicadas', tagField('poss', s.positions, 'dl-pos', 'Ej.: Media guardia')) +
      group('Intensidad (1 suave – 5 máxima)', scale('intensity', s.intensity, 5)) +
      group('Fatiga (1 fresco – 5 agotado)', scale('fatigue', s.fatigue, 5)) +
      field('Objetivo de la sesión', '<input id="sf-obj" placeholder="Opcional" value="' + esc(s.objective || '') + '">') +
      field('Notas personales', '<textarea id="sf-notes" placeholder="Opcional">' + esc(s.notes || '') + '</textarea>') +
      '<button class="btn block" data-act="saveSession" data-id="' + (s.id || '') + '" data-review="' + (s.id ? '' : '1') + '">' + (s.id ? 'Guardar cambios' : 'Guardar y valorar') + '</button>' +
      (s.id ? '' : '<button class="btn ghost block" style="margin-top:8px" data-act="saveSession" data-id="">Guardar sin cuestionario</button>');
    APP.openSheet(s.id ? 'Editar entrenamiento' : 'Nuevo entrenamiento', html);
  }
  APP.sessionForm = sessionForm;
  A.newSession = () => sessionForm();
  A.editSession = (el) => sessionForm(S.sessions.find((s) => s.id === el.dataset.id));

  A.saveSession = async (el) => {
    const old = S.sessions.find((s) => s.id === el.dataset.id) || {};
    const s = Object.assign({}, old, {
      id: old.id || uid(), date: val('sf-date') || today(), time: val('sf-time'), duration: Number(val('sf-dur')) || 0,
      mode: sel('mode')[0] || '', type: sel('type')[0] || '', techniques: tags('techs'), positions: tags('poss'),
      intensity: Number(sel('intensity')[0]) || 0, fatigue: Number(sel('fatigue')[0]) || 0,
      objective: val('sf-obj').trim(), notes: val('sf-notes').trim(), created: old.created || Date.now()
    });
    await APP.saveSession(s);
    APP.closeSheet(); APP.toast('Entrenamiento guardado');
    const isNew = !old.id; const hasGoals = S.goals.some((g) => !g.done);
    if (isNew && hasGoals) goalCheckSheet(s.id, el.dataset.review === '1'); else if (el.dataset.review === '1') reviewForm(s.id);
    APP.render();
  };

  // ---------- cuestionario posterior ----------
  function reviewForm(id) {
    const s = S.sessions.find((x) => x.id === id); if (!s) return; const rv = s.review || {};
    const dots = '<div class="step-dots"><span class="on" data-d="1"></span><span data-d="2"></span><span data-d="3"></span></div>';
    const page1 = '<div class="rv" data-page="1">' + group('1. ¿Cómo ha ido el entrenamiento?', chips('mood', MOODS, rv.mood)) + group('9. Valora la sesión (1–10)', scale('rating', rv.rating, 10)) +
      group('2. ¿Qué has trabajado?', tagField('rtechs', (rv.worked && rv.worked.length ? rv.worked : s.techniques) || [], 'dl-tech')) + field('3. ¿Qué técnica has aprendido?', '<input id="rv-learned" value="' + esc(rv.learned || '') + '" placeholder="Opcional">') + '</div>';
    const page2 = '<div class="rv" data-page="2" hidden>' + field('4. ¿Qué te ha salido bien?', '<textarea id="rv-good">' + esc(rv.good || '') + '</textarea>') + field('5. ¿Qué te ha costado?', '<textarea id="rv-hard">' + esc(rv.hard || '') + '</textarea>') +
      group('6. ¿Qué posiciones has perdido?', tagField('rlost', rv.lostPos || [], 'dl-pos')) + '</div>';
    const page3 = '<div class="rv" data-page="3" hidden>' + group('7. ¿Has aplicado lo que estás estudiando?', chips('applied', ['Sí', 'A medias', 'No', 'No aplica'], rv.applied)) + field('8. ¿Qué quieres mejorar en el siguiente entrenamiento?', '<textarea id="rv-next">' + esc(rv.next || '') + '</textarea>') + field('Algo más (texto libre)', '<textarea id="rv-free">' + esc(rv.free || '') + '</textarea>') + '</div>';
    const nav = '<div class="row" style="margin-top:8px"><button class="btn secondary block" data-act="rvback" id="rv-back" hidden>Atrás</button><button class="btn block" data-act="rvnext" id="rv-next-btn">Siguiente</button><button class="btn block" data-act="rvsave" data-id="' + id + '" id="rv-save" hidden>Guardar</button></div><button class="btn ghost block" style="margin-top:8px" data-close>Ahora no</button>';
    APP.openSheet('¿Cómo ha ido hoy el entrenamiento?', dots + page1 + page2 + page3 + nav);
    APP.ui.rvPage = 1;
  }
  function rvShow(n) {
    APP.ui.rvPage = n;
    APP.$$('.rv').forEach((p) => { p.hidden = Number(p.dataset.page) !== n; });
    APP.$$('.step-dots span').forEach((d) => d.classList.toggle('on', Number(d.dataset.d) <= n));
    APP.$('#rv-back').hidden = n === 1; APP.$('#rv-next-btn').hidden = n === 3; APP.$('#rv-save').hidden = n !== 3;
    APP.$('#sheet-body').scrollTop = 0;
  }
  A.rvnext = () => rvShow(Math.min(3, APP.ui.rvPage + 1));
  A.rvback = () => rvShow(Math.max(1, APP.ui.rvPage - 1));
  A.rvsave = async (el) => {
    const s = S.sessions.find((x) => x.id === el.dataset.id); if (!s) return;
    s.review = { mood: sel('mood')[0] || '', rating: Number(sel('rating')[0]) || 0, worked: tags('rtechs'), learned: val('rv-learned').trim(), good: val('rv-good').trim(), hard: val('rv-hard').trim(), lostPos: tags('rlost'), applied: sel('applied')[0] || '', next: val('rv-next').trim(), free: val('rv-free').trim() };
    s.techniques = Array.from(new Set((s.techniques || []).concat(s.review.worked)));
    await APP.saveSession(s); APP.closeSheet(); APP.toast('Cuestionario guardado'); APP.render();
  };
  A.review = (el) => reviewForm(el.dataset.id);

  // ---------- detalle de sesión ----------
  V.entreno = (id) => {
    const s = S.sessions.find((x) => x.id === id);
    if (!s) return '<div class="card"><p>No se encuentra esta sesión.</p><a href="#/entrenos">Volver</a></div>';
    const rv = s.review; const rounds = S.rounds.filter((r) => r.sessionId === id);
    let h = '<div class="card"><div class="row between"><div><h2>' + esc(s.type || 'Entrenamiento') + '</h2><div class="muted">' + fmtDate(s.date) + (s.time ? ' · ' + s.time : '') + (s.duration ? ' · ' + s.duration + ' min' : '') + (s.mode ? ' · ' + modeLabel(s.mode) : '') + '</div></div><button class="btn small secondary" data-act="editSession" data-id="' + id + '">Editar</button></div>' +
      (s.objective ? '<p style="margin-top:10px"><span class="muted">Objetivo:</span> ' + esc(s.objective) + '</p>' : '') +
      (s.techniques && s.techniques.length ? '<div class="chips" style="margin-top:10px">' + s.techniques.map((t) => '<span class="tag">' + esc(APP.tn(t)) + '</span>').join('') + '</div>' : '') +
      (s.positions && s.positions.length ? '<p class="small muted" style="margin-top:10px">Posiciones: ' + esc(s.positions.map(APP.tn).join(', ')) + '</p>' : '') +
      ((s.intensity || s.fatigue) ? '<p class="small muted">' + (s.intensity ? 'Intensidad ' + s.intensity + '/5' : '') + (s.intensity && s.fatigue ? ' · ' : '') + (s.fatigue ? 'Fatiga ' + s.fatigue + '/5' : '') + '</p>' : '') +
      (s.notes ? '<p>' + esc(s.notes) + '</p>' : '') + '</div>';
    const act = S.goals.filter((g) => !g.done || (s.goalChecks && s.goalChecks[g.id]));
    if (act.length) h += '<div class="card"><div class="row between"><h3>Objetivos en esta sesión</h3><button class="btn small secondary" data-act="goalCheck" data-id="' + id + '">' + (s.goalChecks ? 'Cambiar' : 'Responder') + '</button></div>' + act.map((g) => { const m = (s.goalChecks || {})[g.id]; return '<div class="row between" style="padding:6px 0"><span>' + esc(g.text) + '</span>' + (m ? '<span class="marks"><i class="m-' + m + '">' + CHECK[m][0] + '</i></span>' : '<span class="pill-n">sin responder</span>') + '</div>'; }).join('') + '</div>';
    h += '<div class="card"><div class="row between"><h3>Cuestionario</h3><button class="btn small secondary" data-act="review" data-id="' + id + '">' + (rv ? 'Editar' : 'Responder') + '</button></div>' +
      (rv ? '<div class="list">' + [['Sensación', rv.mood], ['Valoración', rv.rating ? rv.rating + '/10' : ''], ['Técnica aprendida', rv.learned], ['Salió bien', rv.good], ['Costó', rv.hard], ['Posiciones perdidas', (rv.lostPos || []).join(', ')], ['Aplicó lo estudiado', rv.applied], ['Para el próximo', rv.next], ['Otros', rv.free]].filter((x) => x[1]).map((x) => '<div class="item"><div><div class="pill-n">' + x[0] + '</div>' + esc(x[1]) + '</div></div>').join('') + '</div>' : '<p class="muted">Aún no has respondido el cuestionario de esta sesión.</p>') + '</div>';
    h += '<div class="card"><div class="row between"><h3>Rounds (' + rounds.length + ')' + (rounds.some((r) => r.duration) ? ' · ' + rounds.reduce((a, r) => a + (Number(r.duration) || 0), 0) + ' min' : '') + '</h3><button class="btn small" data-act="newRound" data-sid="' + id + '">+ Round</button></div>' + (rounds.length ? '<div class="list">' + rounds.map((r) => roundRow(r)).join('') + '</div>' : '<p class="muted">No has registrado rounds en esta sesión.</p>') + '</div>';
    const an = ST.sessionAnalysis(s, S.rounds);
    if (rounds.length) h += '<div class="card"><h3>Análisis de la sesión</h3>' + APP.insightHTML(an) + '</div>';
    h += '<button class="btn danger block" data-act="delSession" data-id="' + id + '">Borrar sesión</button>';
    return h;
  };
  A.delSession = async (el) => { if (!APP.confirm('¿Borrar esta sesión y sus rounds? No se puede deshacer.')) return; await APP.deleteSession(el.dataset.id); APP.go('#/entrenos'); };

  // ================= ROUNDS =================
  function roundRow(r) {
    const n = (r.events || []).length;
    const label = ST.RESULTS[r.result || 'none'];
    return '<div class="item"><div><div class="title">' + label + (r.partner ? ' · ' + esc(r.partner) : '') + (r.context === 'competicion' ? ' <span class="tag">Competición</span>' : '') + '</div><div class="pill-n">' + fmtDate(r.date) + (r.duration ? ' · ' + r.duration + ' min' : '') + ' · ' + n + ' acontecimientos' + (r.mode ? ' · ' + modeLabel(r.mode) : '') + '</div></div><div class="row"><button class="btn small secondary" data-act="editRound" data-id="' + r.id + '">Editar</button></div></div>';
  }

  const OWN = ['sub_made', 'pass_made', 'sweep_made', 'escape', 'takedown_made', 'guard_recovery', 'back_take', 'pos_gain'];
  const RECV = ['sub_recv', 'pass_recv', 'sweep_recv', 'takedown_recv', 'pos_lost'];
  const kindOpts = (list) => list.map((k) => '<option value="' + k + '">' + ST.KINDS[k].label + '</option>').join('');

  function eventListHTML() {
    const ev = APP.ui.draft.events;
    if (!ev.length) return '<div class="empty">Añade cada acontecimiento del round: finalizaciones, pases, raspados…</div>';
    return '<div class="list">' + ev.map((e, i) => '<div class="item"><div><div class="title">' + ST.KINDS[e.kind].label + (e.outcome === 'intento' ? ' <span class="tag">intento</span>' : '') + '</div><div class="pill-n">' + esc([APP.tn(e.tech), e.from ? 'desde ' + APP.tn(e.from) : '', e.to ? '→ ' + APP.tn(e.to) : ''].filter(Boolean).join(' · ')) + (e.comment ? ' · ' + esc(e.comment) : '') + '</div></div><button class="icon-btn" style="width:34px;height:34px" data-act="delEvent" data-i="' + i + '" aria-label="Quitar">✕</button></div>').join('') + '</div>';
  }

  function roundForm(sessionId, r) {
    const base = r || {};
    const sess = S.sessions.find((s) => s.id === (base.sessionId || sessionId));
    APP.ui.draft = { events: (base.events || []).map((e) => Object.assign({}, e)), lastSig: '', lastT: 0, id: base.id || '', sessionId: base.sessionId || sessionId || null };
    const html =
      '<div class="grid2">' + field('Fecha', '<input type="date" id="rf-date" value="' + (base.date || (sess && sess.date) || today()) + '">') + field('Compañero / competición', '<input id="rf-partner" placeholder="Opcional" value="' + esc(base.partner || '') + '">') + '</div>' +
      group('Contexto', chips('ctx', [{ v: 'entreno', l: 'Entreno' }, { v: 'competicion', l: 'Competición' }], base.context || 'entreno')) +
      group('Modalidad', chips('rmode', MODE_OPTS, base.mode || (sess && sess.mode) || defaultMode())) +
      group('Resultado', chips('result', RESULT_OPTS, base.result || 'none')) +
      '<div class="field"><span style="display:block;margin-bottom:6px">Duración del round (minutos)</span><div class="row"><div class="chips" style="flex:1">' + [4, 5, 6, 8, 10].map((m) => '<button type="button" class="chip sm" data-act="rdur" data-m="' + m + '">' + m + '′</button>').join('') + '</div><input type="number" id="rf-dur" inputmode="decimal" min="0" max="120" step="0.5" placeholder="min" style="width:90px" value="' + (base.duration || S.settings.lastRoundMin || '') + '"></div></div>' +
      '<div class="card" style="background:var(--surface-2);box-shadow:none"><h3>Añadir acontecimiento</h3>' +
      '<label class="field"><span>Tipo</span><select id="ev-kind" data-input="kindchange"><optgroup label="Acciones mías">' + kindOpts(OWN) + '</optgroup><optgroup label="Acciones recibidas">' + kindOpts(RECV) + '</optgroup></select></label>' +
      '<div id="ev-outcome-wrap">' + group('Resultado de la acción', chips('evout', [{ v: 'exito', l: '✔ Éxito' }, { v: 'intento', l: '✘ Intento fallido' }], 'exito')) + '</div>' +
      field('Técnica exacta', '<input id="ev-tech" list="dl-tech" autocomplete="off" placeholder="Ej.: Armbar">') +
      '<div class="grid2">' + field('Posición de origen', '<input id="ev-from" list="dl-pos" autocomplete="off">') + field('Posición final', '<input id="ev-to" list="dl-pos" autocomplete="off">') + '</div>' +
      field('Comentario', '<input id="ev-comment" placeholder="Opcional">') +
      '<button class="btn block" data-act="addEvent">Añadir al round</button></div>' +
      '<h3 style="margin:6px 0">Acontecimientos del round</h3><div id="ev-list">' + eventListHTML() + '</div>' +
      '<button class="btn block" style="margin-top:14px" data-act="saveRound">' + (base.id ? 'Guardar round' : 'Guardar round') + '</button>' +
      (base.id ? '<button class="btn danger block" style="margin-top:8px" data-act="delRound" data-id="' + base.id + '">Borrar round</button>' : '');
    APP.openSheet(base.id ? 'Editar round' : 'Nuevo round', html);
  }
  A.rdur = (el) => { APP.$('#rf-dur').value = el.dataset.m; };
  A.newRound = (el) => {
    let sid = el && el.dataset ? el.dataset.sid : '';
    if (!sid) { const hs = location.hash.match(/#\/entreno\/(.+)/); if (hs) sid = hs[1]; }
    if (!sid) { const t = S.sessions.find((s) => s.date === today()); sid = t ? t.id : ''; }
    roundForm(sid || null);
  };
  A.editRound = (el) => roundForm(null, S.rounds.find((r) => r.id === el.dataset.id));
  A.kindchange = (el) => { const w = APP.$('#ev-outcome-wrap'); if (w) w.hidden = !ST.KINDS[el.value].own; };

  A.addEvent = () => {
    const d = APP.ui.draft; const kind = val('ev-kind'); const def = ST.KINDS[kind]; if (!def) return;
    const tech = APP.canon(val('ev-tech')), from = APP.canon(val('ev-from')), to = APP.canon(val('ev-to'));
    const outcome = def.own ? (sel('evout')[0] || 'exito') : 'recibida';
    const comment = val('ev-comment').trim();
    const sig = [kind, tech.name, from.name, to.name, outcome, comment].join('|');
    const blank = !tech.name && !from.name && !to.name && !comment; // doble toque: los campos ya se vaciaron
    if ((sig === d.lastSig || blank) && Date.now() - d.lastT < 2500) return APP.toast('Ese acontecimiento ya estaba añadido');
    d.lastSig = sig; d.lastT = Date.now();
    d.events.push({ id: uid(), kind, tech: tech.name, techId: tech.id, from: from.name, to: to.name, outcome, comment });
    ['ev-tech', 'ev-from', 'ev-to', 'ev-comment'].forEach((i) => { APP.$('#' + i).value = ''; });
    APP.$('#ev-list').innerHTML = eventListHTML();
  };
  A.delEvent = (el) => { APP.ui.draft.events.splice(Number(el.dataset.i), 1); APP.$('#ev-list').innerHTML = eventListHTML(); };

  A.saveRound = async () => {
    const d = APP.ui.draft; const mode = sel('rmode')[0] || '';
    if (!d.events.length && !confirm('El round no tiene acontecimientos. ¿Guardarlo igualmente (solo resultado)?')) return;
    const old = S.rounds.find((r) => r.id === d.id) || {};
    const r = Object.assign({}, old, {
      id: old.id || uid(), sessionId: d.sessionId, date: val('rf-date') || today(), partner: val('rf-partner').trim(), context: sel('ctx')[0] || 'entreno', mode,
      result: sel('result')[0] || 'none', duration: Number(String(val('rf-dur')).replace(',', '.')) || 0, events: d.events.map((e) => Object.assign({}, e, { mode })), created: old.created || Date.now()
    });
    if (r.duration && S.settings.lastRoundMin !== r.duration) await APP.saveMeta('settings', Object.assign({}, S.settings, { lastRoundMin: r.duration }));
    await APP.saveRound(r); APP.closeSheet(); APP.toast('Round guardado'); APP.render();
  };
  A.delRound = async (el) => { if (!APP.confirm('¿Borrar este round?')) return; await APP.deleteRound(el.dataset.id); APP.closeSheet(); APP.render(); };

  // ================= BOTÓN FLOTANTE =================
  A.fab = () => (APP.route && APP.route.tab === 'gym' && A.gymFab) ? A.gymFab() : (APP.route && APP.route.tab === 'nutri' && A.nutriFab) ? A.nutriFab() : APP.openSheet('¿Qué quieres registrar?', '<div class="stack"><button class="btn block" data-act="newSession">Un entrenamiento</button><button class="btn secondary block" data-act="newRound">Un round de sparring</button></div>');
})();
