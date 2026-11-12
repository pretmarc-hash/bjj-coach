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

  APP.titles = Object.assign(APP.titles, { inicio: 'Inicio', entrenos: 'Entrenamientos', entreno: 'Sesión' });

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

  V.inicio = () => {
    const p = S.profile; const t = today(); const ws = ST.weekStart(t); const we = ST.addDays(ws, 6);
    const weekS = S.sessions.filter((s) => s.date >= ws && s.date <= we);
    const minutes = weekS.reduce((a, s) => a + (Number(s.duration) || 0), 0);
    const target = p && Number(p.weeklyTarget) ? Number(p.weeklyTarget) : 0;
    const rep = ST.report(S.rounds, {});
    const insights = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, t);
    const rec = insights.find((i) => i.type === 'recomendacion') || insights[0];

    const strengths = [];
    rep.subs.made.rows.filter((r) => r.n >= 2).slice(0, 2).forEach((r) => strengths.push('Finalizas con ' + r.key + ' (' + r.n + ' veces)'));
    rep.passes.byTech.filter((x) => x.total >= 3 && x.pct >= 50).slice(0, 1).forEach((x) => strengths.push('Pase ' + x.tech + ': ' + x.success + ' de ' + x.total));
    const weaknesses = insights.filter((i) => i.type === 'patron' && /finalizado|Escapes desde|pasado la guardia|dificultad/.test(i.text)).slice(0, 3).map((i) => i.text);

    let h = '';
    h += '<div class="card hero">' + (p && p.done
      ? '<div class="row between"><div><h2>' + esc(beltName(p.belt) || 'Mi perfil') + (p.stripes ? ' · ' + p.stripes + (Number(p.stripes) === 1 ? ' grado' : ' grados') : '') + '</h2><div class="muted">' + (practicing(p.since) ? 'Practicando ' + practicing(p.since) : '') + (p.mode ? ' · ' + ({ gi: 'GI', nogi: 'NO-GI', both: 'GI y NO-GI' }[p.mode] || '') : '') + '</div></div></div>' +
        (p.mainGoal ? '<p style="margin-top:12px"><span class="muted">Objetivo principal</span><br><b>' + esc(p.mainGoal) + '</b></p>' : '')
      : '<h2>Bienvenido</h2><p class="muted">Cuéntame cómo es tu jiu-jitsu para personalizar la app. Son 4 pantallas cortas.</p><button class="btn secondary" data-act="interview">Empezar entrevista</button>') + '</div>';

    h += '<div class="grid2">' +
      '<div class="card kpi"><div class="big">' + weekS.length + (target ? '<span class="muted" style="font-size:18px"> / ' + target + '</span>' : '') + '</div><div class="label">entrenos esta semana</div>' + (target ? '<div class="bar"><div class="track"><div class="fill" style="width:' + Math.min(100, ST.pct(weekS.length, target)) + '%"></div></div></div>' : '') + '</div>' +
      '<div class="card kpi"><div class="big">' + minutes + '</div><div class="label">minutos esta semana</div></div></div>';

    if (APP.plan) h += APP.plan.banner();
    h += '<div class="row" style="margin-bottom:14px"><button class="btn block" data-act="newSession">Registrar entrenamiento</button><button class="btn secondary block" data-act="newRound">Registrar round</button></div>';

    if (rec) h += '<div class="card"><div class="row between"><h3>Entrenador</h3><a href="#/coach">Ver todo</a></div>' + APP.insightHTML([rec]) + '</div>';

    const goals = S.goals.filter((g) => !g.done);
    h += '<div class="card"><div class="row between"><h3>Objetivos activos</h3><button class="btn small ghost" data-act="addGoal">+ Añadir</button></div>' +
      (goals.length ? '<div class="list">' + goals.map((g) => '<div class="item"><div><div class="title">' + esc(g.text) + '</div><div class="pill-n">' + (g.period === 'month' ? 'Mensual' : 'Semanal') + '</div></div><div class="row"><button class="btn small secondary" data-act="goalDone" data-id="' + g.id + '">Hecho</button><button class="icon-btn" style="width:34px;height:34px" data-act="goalDel" data-id="' + g.id + '" aria-label="Borrar">✕</button></div></div>').join('') + '</div>' : '<div class="empty">Aún no tienes objetivos. Añade uno semanal o mensual.</div>') + '</div>';

    h += '<div class="card"><div class="row between"><h3>Últimos entrenamientos</h3><a href="#/entrenos">Ver todos</a></div>' +
      (S.sessions.length ? '<div class="list">' + S.sessions.slice(0, 3).map(sessionRow).join('') + '</div>' : '<div class="empty">Todavía no has registrado ningún entrenamiento.</div>') + '</div>';

    h += '<div class="card"><h3>Fortalezas</h3>' + (strengths.length || (p && p.strengths) ? '<ul style="margin:0;padding-left:18px">' + strengths.map((x) => '<li>' + esc(x) + '</li>').join('') + (p && p.strengths ? '<li>' + esc(p.strengths) + ' <span class="pill-n">(tus notas)</span></li>' : '') + '</ul>' : '<p class="muted">Aparecerán cuando haya registros suficientes.</p>') + '</div>';
    h += '<div class="card"><h3>Debilidades que necesitan atención</h3>' + (weaknesses.length || (p && p.weaknesses) ? '<ul style="margin:0;padding-left:18px">' + weaknesses.map((x) => '<li>' + esc(x) + '</li>').join('') + (p && p.weaknesses ? '<li>' + esc(p.weaknesses) + ' <span class="pill-n">(tus notas)</span></li>' : '') + '</ul>' : '<p class="muted">No se ha detectado ninguna todavía (o hay pocos datos).</p>') + '</div>';
    return h;
  };

  A.addGoal = () => {
    APP.openSheet('Nuevo objetivo', field('¿Qué quieres conseguir?', '<input id="g-text" placeholder="Ej.: pasar 3 veces con knee cut">') + group('Periodo', chips('gp', [{ v: 'week', l: 'Semanal' }, { v: 'month', l: 'Mensual' }], 'week')) + '<button class="btn block" data-act="saveGoal">Guardar</button>');
  };
  A.saveGoal = async () => {
    const text = val('g-text').trim(); if (!text) return APP.toast('Escribe el objetivo');
    await APP.saveGoal({ id: uid(), text, period: sel('gp')[0] || 'week', done: false, created: today() });
    APP.closeSheet(); APP.render();
  };
  A.goalDone = async (el) => { const g = S.goals.find((x) => x.id === el.dataset.id); if (g) { g.done = true; g.doneDate = today(); await APP.saveGoal(g); APP.render(); } };
  A.goalDel = async (el) => { await APP.deleteGoal(el.dataset.id); APP.render(); };

  // ================= ENTRENOS =================
  function sessionRow(s) {
    const nr = S.rounds.filter((r) => r.sessionId === s.id).length;
    return '<a class="item" href="#/entreno/' + s.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(s.type || 'Entrenamiento') + ' ' + (s.mode ? '<span class="tag">' + modeLabel(s.mode) + '</span>' : '') + '</div><div class="pill-n">' + fmtDate(s.date) + (s.time ? ' · ' + s.time : '') + (s.duration ? ' · ' + s.duration + ' min' : '') + (nr ? ' · ' + nr + ' rounds' : '') + '</div></div>' +
      '<div>' + (s.review && s.review.rating ? '<b>' + s.review.rating + '</b><span class="pill-n">/10</span>' : '<span class="pill-n">sin valorar</span>') + '</div></a>';
  }

  V.entrenos = () => {
    const orphans = S.rounds.filter((r) => !r.sessionId).sort((a, b) => b.date.localeCompare(a.date));
    let h = '<div class="row" style="margin-bottom:14px"><button class="btn block" data-act="newSession">Registrar entrenamiento</button><button class="btn secondary block" data-act="newRound">Registrar round</button></div>';
    h += '<div class="card">' + (S.sessions.length ? '<div class="list">' + S.sessions.map(sessionRow).join('') + '</div>' : '<div class="empty">Aquí aparecerán tus entrenamientos.<br>Registrar uno lleva menos de un minuto.</div>') + '</div>';
    if (orphans.length) h += '<div class="card"><h3>Rounds sin sesión</h3><div class="list">' + orphans.map((r) => roundRow(r)).join('') + '</div></div>';
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
    if (el.dataset.review === '1') reviewForm(s.id);
    if (location.hash.startsWith('#/entreno/') || location.hash === '#/inicio' || location.hash === '' || location.hash === '#/entrenos') APP.render(); else APP.go('#/entrenos');
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
      (s.techniques && s.techniques.length ? '<div class="chips" style="margin-top:10px">' + s.techniques.map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>' : '') +
      (s.positions && s.positions.length ? '<p class="small muted" style="margin-top:10px">Posiciones: ' + esc(s.positions.join(', ')) + '</p>' : '') +
      ((s.intensity || s.fatigue) ? '<p class="small muted">' + (s.intensity ? 'Intensidad ' + s.intensity + '/5' : '') + (s.intensity && s.fatigue ? ' · ' : '') + (s.fatigue ? 'Fatiga ' + s.fatigue + '/5' : '') + '</p>' : '') +
      (s.notes ? '<p>' + esc(s.notes) + '</p>' : '') + '</div>';
    h += '<div class="card"><div class="row between"><h3>Cuestionario</h3><button class="btn small secondary" data-act="review" data-id="' + id + '">' + (rv ? 'Editar' : 'Responder') + '</button></div>' +
      (rv ? '<div class="list">' + [['Sensación', rv.mood], ['Valoración', rv.rating ? rv.rating + '/10' : ''], ['Técnica aprendida', rv.learned], ['Salió bien', rv.good], ['Costó', rv.hard], ['Posiciones perdidas', (rv.lostPos || []).join(', ')], ['Aplicó lo estudiado', rv.applied], ['Para el próximo', rv.next], ['Otros', rv.free]].filter((x) => x[1]).map((x) => '<div class="item"><div><div class="pill-n">' + x[0] + '</div>' + esc(x[1]) + '</div></div>').join('') + '</div>' : '<p class="muted">Aún no has respondido el cuestionario de esta sesión.</p>') + '</div>';
    h += '<div class="card"><div class="row between"><h3>Rounds (' + rounds.length + ')</h3><button class="btn small" data-act="newRound" data-sid="' + id + '">+ Round</button></div>' + (rounds.length ? '<div class="list">' + rounds.map((r) => roundRow(r)).join('') + '</div>' : '<p class="muted">No has registrado rounds en esta sesión.</p>') + '</div>';
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
    return '<div class="item"><div><div class="title">' + label + (r.partner ? ' · ' + esc(r.partner) : '') + (r.context === 'competicion' ? ' <span class="tag">Competición</span>' : '') + '</div><div class="pill-n">' + fmtDate(r.date) + ' · ' + n + ' acontecimientos' + (r.mode ? ' · ' + modeLabel(r.mode) : '') + '</div></div><div class="row"><button class="btn small secondary" data-act="editRound" data-id="' + r.id + '">Editar</button></div></div>';
  }

  const OWN = ['sub_made', 'pass_made', 'sweep_made', 'escape', 'takedown_made', 'guard_recovery', 'back_take', 'pos_gain'];
  const RECV = ['sub_recv', 'pass_recv', 'sweep_recv', 'takedown_recv', 'pos_lost'];
  const kindOpts = (list) => list.map((k) => '<option value="' + k + '">' + ST.KINDS[k].label + '</option>').join('');

  function eventListHTML() {
    const ev = APP.ui.draft.events;
    if (!ev.length) return '<div class="empty">Añade cada acontecimiento del round: finalizaciones, pases, sweeps…</div>';
    return '<div class="list">' + ev.map((e, i) => '<div class="item"><div><div class="title">' + ST.KINDS[e.kind].label + (e.outcome === 'intento' ? ' <span class="tag">intento</span>' : '') + '</div><div class="pill-n">' + esc([e.tech, e.from ? 'desde ' + e.from : '', e.to ? '→ ' + e.to : ''].filter(Boolean).join(' · ')) + (e.comment ? ' · ' + esc(e.comment) : '') + '</div></div><button class="icon-btn" style="width:34px;height:34px" data-act="delEvent" data-i="' + i + '" aria-label="Quitar">✕</button></div>').join('') + '</div>';
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
      result: sel('result')[0] || 'none', events: d.events.map((e) => Object.assign({}, e, { mode })), created: old.created || Date.now()
    });
    await APP.saveRound(r); APP.closeSheet(); APP.toast('Round guardado'); APP.render();
  };
  A.delRound = async (el) => { if (!APP.confirm('¿Borrar este round?')) return; await APP.deleteRound(el.dataset.id); APP.closeSheet(); APP.render(); };

  // ================= BOTÓN FLOTANTE =================
  A.fab = () => APP.openSheet('¿Qué quieres registrar?', '<div class="stack"><button class="btn block" data-act="newSession">Un entrenamiento</button><button class="btn secondary block" data-act="newRound">Un round de sparring</button></div>');
})();
