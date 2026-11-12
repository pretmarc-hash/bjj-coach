/* Mi juego, Estadísticas, Entrenador, Biblioteca (básica), Más y Ajustes. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, chips, sel, tags, tagField, val, bars, eff, lowN } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  Object.assign(APP.titles, { juego: 'Mi juego', stats: 'Estadísticas', coach: 'Entrenador personal', biblio: 'Biblioteca técnica', mas: 'Más', ajustes: 'Ajustes', informe: 'Informe semanal', plan: 'Planificación' });
  const names = (cat) => APP.techsBy(cat).map((t) => t.name);

  // ================= MI JUEGO =================
  ui.juegoCat = 'guardia';
  const BELTS = [{ v: 'blanco', l: 'Blanco' }, { v: 'azul', l: 'Azul' }, { v: 'morado', l: 'Morado' }, { v: 'marron', l: 'Marrón' }, { v: 'negro', l: 'Negro' }];

  function interview() {
    const p = S.profile || {};
    const dots = '<div class="step-dots"><span class="on" data-d="1"></span><span data-d="2"></span><span data-d="3"></span><span data-d="4"></span></div>';
    const p1 = '<div class="iv" data-page="1">' + group('Cinturón', chips('belt', BELTS, p.belt)) + group('Grados', chips('stripes', ['0', '1', '2', '3', '4'], String(p.stripes === undefined ? '' : p.stripes))) +
      field('¿Desde cuándo practicas BJJ?', '<input type="month" id="iv-since" value="' + esc(p.since || '') + '">') + group('Modalidad', chips('imode', [{ v: 'gi', l: 'GI' }, { v: 'nogi', l: 'NO-GI' }, { v: 'both', l: 'Ambos' }], p.mode)) +
      group('¿Prefieres luchar…?', chips('pref', [{ v: 'arriba', l: 'Arriba' }, { v: 'abajo', l: 'Abajo' }, { v: 'ambos', l: 'Ambos' }], p.pref)) + field('Entrenos por semana (objetivo)', '<input type="number" id="iv-week" min="0" max="14" inputmode="numeric" value="' + esc(p.weeklyTarget || '') + '">') + '</div>';
    const p2 = '<div class="iv" data-page="2" hidden>' + group('Guardias preferidas', chips('guards', names('guardia'), p.guards, true, true)) + group('Sistemas de pase preferidos', chips('passes', names('pase'), p.passes, true, true)) + '</div>';
    const p3 = '<div class="iv" data-page="3" hidden>' + group('Finalizaciones que conozco', chips('subsK', names('finalizacion'), p.subsKnown, true, true)) + group('Finalizaciones preferidas', chips('subsP', names('finalizacion'), p.subsPref, true, true)) +
      group('Posiciones que domino', chips('posM', names('posicion'), p.posMastered, true, true)) + group('Posiciones problemáticas', chips('posP', names('posicion'), p.posProblem, true, true)) + '</div>';
    const p4 = '<div class="iv" data-page="4" hidden>' + field('Fortalezas', '<textarea id="iv-str">' + esc(p.strengths || '') + '</textarea>') + field('Debilidades', '<textarea id="iv-weak">' + esc(p.weaknesses || '') + '</textarea>') +
      field('Objetivos técnicos', '<textarea id="iv-tech">' + esc(p.techGoals || '') + '</textarea>') + field('Objetivos competitivos', '<textarea id="iv-comp">' + esc(p.compGoals || '') + '</textarea>') + field('Mi objetivo principal ahora', '<input id="iv-main" value="' + esc(p.mainGoal || '') + '">') + '</div>';
    const nav = '<div class="row"><button class="btn secondary block" data-act="ivback" id="iv-back" hidden>Atrás</button><button class="btn block" data-act="ivnext" id="iv-next">Siguiente</button><button class="btn block" data-act="ivsave" id="iv-save" hidden>Guardar</button></div>';
    APP.openSheet('Entrevista técnica', dots + p1 + p2 + p3 + p4 + nav);
    ui.ivPage = 1;
  }
  function ivShow(n) {
    ui.ivPage = n;
    APP.$$('.iv').forEach((p) => { p.hidden = Number(p.dataset.page) !== n; });
    APP.$$('.step-dots span').forEach((d) => d.classList.toggle('on', Number(d.dataset.d) <= n));
    APP.$('#iv-back').hidden = n === 1; APP.$('#iv-next').hidden = n === 4; APP.$('#iv-save').hidden = n !== 4;
    APP.$('#sheet-body').scrollTop = 0;
  }
  A.interview = interview;
  A.ivnext = () => ivShow(Math.min(4, ui.ivPage + 1));
  A.ivback = () => ivShow(Math.max(1, ui.ivPage - 1));
  A.ivsave = async () => {
    const st = sel('stripes')[0];
    const p = {
      belt: sel('belt')[0] || '', stripes: st === undefined ? '' : Number(st), since: val('iv-since'), mode: sel('imode')[0] || '', pref: sel('pref')[0] || '', weeklyTarget: Number(val('iv-week')) || 0,
      guards: sel('guards'), passes: sel('passes'), subsKnown: sel('subsK'), subsPref: sel('subsP'), posMastered: sel('posM'), posProblem: sel('posP'),
      strengths: val('iv-str').trim(), weaknesses: val('iv-weak').trim(), techGoals: val('iv-tech').trim(), compGoals: val('iv-comp').trim(), mainGoal: val('iv-main').trim(), done: true
    };
    await APP.saveMeta('profile', p); APP.closeSheet(); APP.toast('Perfil guardado'); APP.render();
  };

  function masteryRow(t) {
    const p = S.profile || {}; const lv = S.mastery[t.id] || 0;
    const star = [].concat(p.guards || [], p.passes || [], p.subsPref || []).includes(t.name) ? ' ★' : '';
    return '<div class="item" style="flex-direction:column;align-items:stretch"><div class="row between"><a href="#" data-act="tech" data-id="' + t.id + '" class="title" style="text-decoration:none;color:inherit">' + esc(t.name) + star + '</a><span class="pill-n">' + (lv ? APP.LEVELS[lv - 1] : 'Sin marcar') + '</span></div>' +
      '<div class="mastery" style="margin-top:6px">' + [1, 2, 3, 4, 5].map((i) => '<button class="' + (lv === i ? 'on' : '') + '" data-act="mastery" data-id="' + t.id + '" data-l="' + i + '" aria-label="' + APP.LEVELS[i - 1] + '">' + i + '</button>').join('') + '</div></div>';
  }
  A.mastery = async (el) => { const id = el.dataset.id, l = Number(el.dataset.l); await APP.setMastery(id, l); rk(); };

  function chainHTML(c) {
    return '<div class="item" style="flex-direction:column;align-items:stretch"><div class="row between"><div class="title">' + esc(c.name) + '</div><button class="icon-btn" style="width:34px;height:34px" data-act="delChain" data-id="' + c.id + '" aria-label="Borrar cadena">✕</button></div><div class="chain" style="margin-top:8px">' +
      c.steps.map((s, i) => { const t = APP.findTech(s); const lv = t ? S.mastery[t.id] : 0; return (i ? '<span class="arrow">→</span>' : '') + '<span class="node">' + esc(s) + (lv ? ' <span class="pill-n">· ' + lv + '/5</span>' : '') + '</span>'; }).join('') + '</div></div>';
  }
  V.juego = () => {
    const p = S.profile; let h = '';
    if (!p || !p.done) h += '<div class="card hero"><h2>Construye tu juego</h2><p class="muted">Empieza con una entrevista técnica (4 pantallas cortas). Después podrás marcar tu nivel en cada técnica y crear cadenas de ataque.</p><button class="btn secondary" data-act="interview">Empezar entrevista</button></div>';
    else {
      const chipsOf = (l, arr) => arr && arr.length ? '<p class="small muted" style="margin:10px 0 4px">' + l + '</p><div class="chips">' + arr.map((x) => '<span class="tag">' + esc(x) + '</span>').join('') + '</div>' : '';
      h += '<div class="card"><div class="row between"><h3>Mi perfil técnico</h3><button class="btn small secondary" data-act="interview">Editar</button></div>' +
        '<p class="muted small">' + ({ arriba: 'Prefiero luchar arriba', abajo: 'Prefiero luchar abajo', ambos: 'Lucho arriba y abajo' }[p.pref] || '') + '</p>' + chipsOf('Guardias preferidas', p.guards) + chipsOf('Pases preferidos', p.passes) + chipsOf('Finalizaciones preferidas', p.subsPref) + chipsOf('Posiciones problemáticas', p.posProblem) +
        (p.techGoals ? '<p class="small muted" style="margin:10px 0 2px">Objetivos técnicos</p><p>' + esc(p.techGoals) + '</p>' : '') + (p.compGoals ? '<p class="small muted" style="margin:10px 0 2px">Objetivos competitivos</p><p>' + esc(p.compGoals) + '</p>' : '') + '</div>';
    }
    // Mapa: nivel de dominio por categoría (solo lo que has marcado)
    h += '<div class="card"><h3>Mapa de mi juego</h3><div class="explain">Cada barra muestra, por categoría, cuántas técnicas has marcado con cada nivel de dominio (del 2 al 5). Las que no marcas cuentan como «no la conozco».</div>' +
      Object.keys(APP.CATS).map((cat) => {
        const list = APP.techsBy(cat); if (!list.length) return '';
        const counts = [0, 0, 0, 0, 0, 0]; list.forEach((t) => { counts[S.mastery[t.id] || 1]++; });
        const marked = counts[2] + counts[3] + counts[4] + counts[5];
        const seg = [2, 3, 4, 5].map((l) => '<div style="width:' + ST.pct(counts[l], list.length) + '%;background:var(--green);opacity:' + (0.3 + 0.2333 * (l - 2)) + ';height:100%" title="Nivel ' + l + ': ' + counts[l] + '"></div>').join('');
        return '<div class="bar"><div class="meta"><span>' + APP.CATS[cat] + '</span><span class="pill-n">' + marked + ' de ' + list.length + ' marcadas</span></div><div class="track" style="display:flex">' + seg + '</div></div>';
      }).join('') + '</div>';

    h += '<div class="card"><h3>Mis técnicas</h3><div class="seg">' + Object.keys(APP.CATS).map((c) => '<button class="' + (ui.juegoCat === c ? 'on' : '') + '" data-act="juegoCat" data-c="' + c + '">' + APP.CATS[c] + '</button>').join('') + '</div>' +
      '<div class="explain">1 No la conozco · 2 Teoría · 3 Aprendiendo · 4 Entrenando · 5 Contra resistencia</div><div class="list">' + APP.techsBy(ui.juegoCat).map(masteryRow).join('') + '</div></div>';

    h += '<div class="card"><div class="row between"><h3>Cadenas técnicas</h3><button class="btn small ghost" data-act="addChain">+ Crear</button></div>' +
      (S.chains.length ? '<div class="list">' + S.chains.map(chainHTML).join('') + '</div>' : '<p class="muted">Enlaza técnicas para visualizar tus rutas de ataque, por ejemplo: guardia → sweep → posición → finalización.</p>') + '</div>';
    return h;
  };
  A.juegoCat = (el) => { ui.juegoCat = el.dataset.c; rk(); };
  A.addChain = () => APP.openSheet('Nueva cadena técnica', field('Nombre', '<input id="ch-name" placeholder="Ej.: Mi ruta desde mariposa">') + group('Pasos en orden (técnicas y posiciones)', tagField('chain', [], 'dl-tech', 'Escribe una técnica o posición')) + '<p class="small muted">Los alias se convierten en el nombre principal, para que no haya duplicados.</p><button class="btn block" data-act="saveChain">Guardar cadena</button>');
  A.saveChain = async () => {
    const steps = tags('chain'); const name = val('ch-name').trim() || 'Cadena ' + (S.chains.length + 1);
    if (steps.length < 2) return APP.toast('Añade al menos 2 pasos');
    await APP.saveChain({ id: uid(), name, steps }); APP.closeSheet(); APP.render();
  };
  A.delChain = async (el) => { if (APP.confirm('¿Borrar esta cadena?')) { await APP.deleteChain(el.dataset.id); rk(); } };

  // ================= ESTADÍSTICAS =================
  ui.stats = { mode: 'all', ctx: 'all', period: 'all', tab: 'subs' };
  const TABS = [['subs', 'Mis finalizaciones'], ['recv', 'Recibidas'], ['pases', 'Pases'], ['guardias', 'Guardias'], ['escapes', 'Escapes'], ['derribos', 'Derribos'], ['general', 'General']];
  const PERIODS = [['all', 'Todo'], ['30', '30 días'], ['90', '90 días'], ['365', 'Año']];
  function statsFilters() {
    const f = { mode: ui.stats.mode, context: ui.stats.ctx };
    if (ui.stats.period !== 'all') { f.from = ST.addDays(today(), -Number(ui.stats.period) + 1); f.to = today(); }
    return f;
  }
  const seg = (k, opts, cur) => '<div class="seg">' + opts.map((o) => '<button class="' + (cur === o[0] ? 'on' : '') + '" data-act="statf" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  A.statf = (el) => { ui.stats[el.dataset.k] = el.dataset.v; rk(); };

  const lines = (rows, f) => rows.length ? '<div class="list">' + rows.map(f).join('') + '</div>' : '<div class="empty">Sin datos todavía.</div>';
  const effTable = (rows, label) => rows.length ? rows.map((r) => eff(r, r[label])).join('') : '<div class="empty">Sin datos todavía.</div>';

  V.stats = () => {
    const f = statsFilters(); const r = ST.report(S.rounds, f); const u = ui.stats; let b = '';
    if (!S.rounds.length) return '<div class="card empty"><h3>Aún no hay estadísticas</h3><p>Las estadísticas se calculan solo con tus rounds registrados.<br>Registra tu primer round para empezar.</p><button class="btn" data-act="newRound">Registrar round</button></div>';
    if (u.tab === 'subs') {
      const s = r.subs;
      b = '<div class="explain">Finalizaciones que has conseguido, repartidas por técnica. Entre paréntesis ves siempre sobre cuántas observaciones se calcula el porcentaje.</div>' + lowN(s.made.total) + '<h3>Total: ' + s.made.total + '</h3>' + bars(s.made.rows, s.made.total) +
        '<h3 style="margin-top:16px">Intentos frente a éxitos</h3>' + eff(s.efficacy, 'Eficacia global') + effTable(s.byTech, 'tech') +
        '<h3 style="margin-top:16px">Desde qué posición</h3>' + bars(s.madeByPosition.rows, s.madeByPosition.total) + '<h3 style="margin-top:16px">Por modalidad</h3>' + bars(s.madeByMode.rows.map((x) => Object.assign({}, x, { key: ({ gi: 'GI', nogi: 'NO-GI' }[x.key] || x.key) })), s.madeByMode.total) +
        '<h3 style="margin-top:16px">Evolución mensual</h3>' + APP.miniBars(s.evolutionMade);
    } else if (u.tab === 'recv') {
      const s = r.subs;
      b = '<div class="explain">Finalizaciones que te han hecho a ti. Sirve para ver qué defensas necesitas.</div>' + lowN(s.received.total) + '<h3>Total recibidas: ' + s.received.total + '</h3>' + bars(s.received.rows, s.received.total, 'red') +
        '<h3 style="margin-top:16px">Desde qué posición te finalizan</h3>' + bars(s.receivedByPosition.rows, s.receivedByPosition.total, 'red') + '<h3 style="margin-top:16px">Evolución mensual</h3>' + APP.miniBars(s.evolutionRecv);
    } else if (u.tab === 'pases') {
      const s = r.passes;
      b = '<div class="explain">Eficacia = pases conseguidos entre todos tus intentos de pase (conseguidos + fallidos).</div>' + lowN(s.efficacy.total) + eff(s.efficacy, 'Pases realizados') + effTable(s.byTech, 'tech') +
        '<h3 style="margin-top:16px">Posiciones de partida</h3>' + bars(s.byStartPosition.rows, s.byStartPosition.total) + '<h3 style="margin-top:16px">Pases recibidos</h3>' + bars(s.received.rows, s.received.total, 'red');
    } else if (u.tab === 'guardias') {
      const g = r.guards;
      b = '<div class="explain">Resultados de tus acciones desde cada posición de origen registrada.</div><h3>Sweeps conseguidos por guardia</h3>' + bars(g.sweepsByGuard.rows, g.sweepsByGuard.total) + eff(g.sweepEfficacy, 'Eficacia de sweeps') +
        '<h3 style="margin-top:16px">Finalizaciones desde guardia</h3>' + bars(g.subsByGuard.rows, g.subsByGuard.total) + '<h3 style="margin-top:16px">Pases recibidos, por guardia de origen</h3>' + bars(g.passesReceivedByGuard.rows, g.passesReceivedByGuard.total, 'red') +
        '<h3 style="margin-top:16px">Recuperaciones de guardia</h3>' + (g.recoveries.total ? eff(g.recoveries, 'Retención / recuperación') : '<div class="empty">Sin datos todavía.</div>');
    } else if (u.tab === 'escapes') {
      const e = r.escapes;
      b = '<div class="explain">Porcentaje de escapes conseguidos sobre los intentados, por posición. Las posiciones con menor porcentaje son las que más te cuesta salir.</div>' + lowN(e.efficacy.total) + eff(e.efficacy, 'Escapes (global)') + '<h3 style="margin-top:16px">Por posición</h3>' + (e.byPosition.length ? e.byPosition.map((x) => eff(x, x.pos)).join('') : '<div class="empty">Sin datos todavía.</div>') +
        '<h3 style="margin-top:16px">Técnicas de finalización que más recibo</h3>' + bars(r.subs.received.rows.slice(0, 5), r.subs.received.total, 'red');
    } else if (u.tab === 'derribos') {
      const t = r.takedowns;
      b = '<div class="explain">Derribos conseguidos y recibidos. Los intentos fallidos cuentan para la eficacia.</div>' + lowN(t.efficacy.total) + eff(t.efficacy, 'Derribos realizados') + effTable(t.byTech, 'tech') + '<h3 style="margin-top:16px">Derribos recibidos</h3>' + bars(t.received.rows, t.received.total, 'red') + '<h3 style="margin-top:16px">Evolución mensual</h3>' + APP.miniBars(t.evolution);
    } else {
      const ses = ST.sessionsInRange(S.sessions, f.from, f.to).filter((s) => !u.mode || u.mode === 'all' || s.mode === u.mode);
      const cmp = ST.compare(S.rounds, { from: ST.addDays(today(), -29), to: today() }, { from: ST.addDays(today(), -59), to: ST.addDays(today(), -30) }, { mode: u.mode, context: u.ctx });
      const row = (l, a, b2) => '<div class="item"><div>' + l + '</div><div><b>' + a + '</b> <span class="pill-n">vs ' + b2 + '</span></div></div>';
      const effS = (e) => e.total ? e.pct + '% (' + e.success + '/' + e.total + ')' : '—';
      b = '<div class="grid2"><div class="card kpi"><div class="big">' + ses.length + '</div><div class="label">entrenamientos</div></div><div class="card kpi"><div class="big">' + r.rounds + '</div><div class="label">rounds</div></div></div>' +
        '<h3>Resultados de los rounds</h3>' + bars(r.results, r.rounds) + '<h3 style="margin-top:16px">Rounds+acciones por semana</h3>' + APP.miniBars(r.general.byWeek) +
        '<h3 style="margin-top:16px">Comparar: últimos 30 días frente a los 30 anteriores</h3><div class="list">' + row('Rounds', cmp.a.rounds, cmp.b.rounds) + row('Finalizaciones hechas', cmp.a.subsMade, cmp.b.subsMade) + row('Finalizaciones recibidas', cmp.a.subsRecv, cmp.b.subsRecv) + row('Eficacia de finalizaciones', effS(cmp.a.subEff), effS(cmp.b.subEff)) + row('Eficacia de pases', effS(cmp.a.passEff), effS(cmp.b.passEff)) + row('Eficacia de escapes', effS(cmp.a.escapeEff), effS(cmp.b.escapeEff)) + '</div>' +
        '<div class="explain">Compara siempre el número entre paréntesis: con pocos intentos, una diferencia de porcentaje no significa nada.</div>';
    }
    return '<div class="card" style="padding:12px">' + seg('mode', [['all', 'GI + NO-GI'], ['gi', 'GI'], ['nogi', 'NO-GI']], u.mode) + seg('ctx', [['all', 'Todo'], ['entreno', 'Entrenamiento'], ['competicion', 'Competición']], u.ctx) + seg('period', PERIODS, u.period) + '</div>' +
      '<div class="seg" style="margin-bottom:10px">' + TABS.map((t) => '<button class="' + (u.tab === t[0] ? 'on' : '') + '" data-act="statf" data-k="tab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div class="card">' + b + '</div>';
  };

  // ================= ENTRENADOR =================
  function answer(q) {
    const rep = ST.report(S.rounds, {}); const ins = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, today());
    const need = [{ type: 'dato', text: 'Todavía no hay datos suficientes para responder con fiabilidad.' }];
    const top = (rows, n) => rows.slice(0, n).map((r) => r.key + ' (' + r.n + ')').join(', ');
    switch (q) {
      case 'weak': { const x = ins.filter((i) => i.type === 'patron' && /finalizado|Escapes desde|pasado la guardia|dificultad/.test(i.text)); return x.length ? x : need; }
      case 'subs': return rep.subs.made.total ? [{ type: 'dato', text: 'Tus finalizaciones más usadas: ' + top(rep.subs.made.rows, 3) + '. Total: ' + rep.subs.made.total + '.' }] : need;
      case 'recv': return rep.subs.received.total ? [{ type: 'dato', text: 'Te finalizan sobre todo con: ' + top(rep.subs.received.rows, 3) + '.' }].concat(rep.subs.receivedByPosition.rows.length ? [{ type: 'dato', text: 'Desde estas posiciones: ' + top(rep.subs.receivedByPosition.rows.filter((r) => r.key !== 'Sin especificar'), 3) + '.' }] : []) : need;
      case 'pass': { const b = rep.passes.byTech.filter((x) => x.total >= 3).sort((a, c) => c.pct - a.pct); return b.length ? [{ type: 'dato', text: b[0].tech + ': ' + b[0].success + ' de ' + b[0].total + ' intentos (' + b[0].pct + '%).' }] : [{ type: 'dato', text: 'Hacen falta al menos 3 intentos registrados con un mismo pase para compararlos.' }]; }
      case 'guard': {
        const out = []; const g = rep.guards.passesReceivedByGuard.rows.filter((r) => r.key !== 'Sin especificar')[0];
        if (g) out.push({ type: 'patron', text: 'Te pasan más la guardia desde ' + g.key + ' (' + g.n + ' veces).' }, { type: 'recomendacion', text: 'Desarrollar la retención desde ' + g.key + ' tendría el mayor impacto según tus registros.' });
        const learning = APP.techsBy('guardia').filter((t) => S.mastery[t.id] === 3).map((t) => t.name);
        if (learning.length) out.push({ type: 'dato', text: 'Guardias que marcaste como «aprendiendo»: ' + learning.join(', ') + '.' });
        return out.length ? out : need;
      }
      case 'week': { const r = ins.filter((i) => i.type === 'recomendacion'); return r.length ? r : need; }
      case 'errors': { const r = ins.filter((i) => /Has anotado/.test(i.text)); return r.length ? r : [{ type: 'dato', text: 'No hay errores repetidos anotados aún (necesito al menos 2 sesiones con el mismo punto en «qué te ha costado» o «posiciones perdidas»).' }]; }
      case 'better': { const r = ins.filter((i) => /Efectividad|No hay datos suficientes/.test(i.text) || i.type === 'hipotesis'); return r.length ? r : need; }
      case 'learn': {
        const lv = { blanco: ['blanco'], azul: ['blanco', 'azul'], morado: ['blanco', 'azul', 'morado'], marron: ['blanco', 'azul', 'morado'], negro: ['blanco', 'azul', 'morado'] }[(S.profile && S.profile.belt) || 'blanco'];
        const c = APP.S.lib.filter((t) => t.cat !== 'posicion' && (!S.mastery[t.id] || S.mastery[t.id] <= 2) && lv.includes(t.lv)).slice(0, 5);
        return c.length ? [{ type: 'recomendacion', text: 'Técnicas de tu nivel que aún no has marcado como aprendiéndolas: ' + c.map((t) => t.name).join(', ') + '.' }, { type: 'hipotesis', text: 'Es una sugerencia por nivel de cinturón; no tengo datos tuyos que indiquen cuáles te convienen más.' }] : need;
      }
      case 'neglect': {
        const ev = ST.flatten(S.rounds); if (S.rounds.length < 10) return [{ type: 'dato', text: 'Con ' + S.rounds.length + ' rounds registrados es pronto para decir si descuidas algo (mínimo 10).' }];
        const miss = []; const g = (k) => ev.some((e) => ST.KINDS[e.kind].group === k);
        [['takedown', 'derribos'], ['sweep', 'sweeps'], ['escape', 'escapes'], ['pass', 'pases de guardia'], ['sub', 'finalizaciones']].forEach((x) => { if (!g(x[0])) miss.push(x[1]); });
        return miss.length ? [{ type: 'hipotesis', text: 'No has registrado ' + miss.join(', ') + ' en ' + S.rounds.length + ' rounds. Puede que no los trabajes o que no los estés anotando.' }] : [{ type: 'dato', text: 'Has registrado acciones en todas las áreas principales.' }];
      }
      default: return need;
    }
  }
  const QS = [['weak', '¿Cuáles son mis mayores debilidades?'], ['subs', '¿Qué finalizaciones uso más?'], ['recv', '¿Cómo me suelen finalizar?'], ['guard', '¿Qué guardia debería desarrollar?'], ['pass', '¿Qué pase me funciona mejor?'], ['week', '¿Qué debería trabajar esta semana?'], ['errors', '¿Qué errores repito?'], ['better', '¿Estoy mejorando?'], ['learn', '¿Qué técnicas debería aprender?'], ['neglect', '¿Descuido alguna parte de mi juego?']];
  ui.coachQ = null;
  V.coach = () => {
    const ins = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, today());
    return '<div class="card"><h3>Pregúntale al entrenador</h3><div class="explain">Es un motor local basado en reglas y en tus registros: no usa inteligencia artificial externa ni envía tus datos a ningún sitio. Si hay pocos datos, te lo dirá.</div><div class="chips">' + QS.map((q) => '<button class="chip sm' + (ui.coachQ === q[0] ? ' on' : '') + '" data-act="ask" data-q="' + q[0] + '">' + q[1] + '</button>').join('') + '</div>' +
      (ui.coachQ ? '<div class="list" style="margin-top:12px">' + APP.insightHTML(answer(ui.coachQ)) + '</div>' : '') + '</div>' +
      '<div class="card"><div class="row between"><h3>Análisis general</h3><a href="#/informe">Semanal</a> · <a href="#/mensual">Mensual</a></div><div class="list">' + APP.insightHTML(ins) + '</div></div>';
  };
  A.ask = (el) => { ui.coachQ = el.dataset.q; rk(); };
  A.coachOpen = () => APP.go('#/coach');

  V.informe = (arg) => {
    const ws = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? ST.weekStart(arg) : ST.weekStart(today());
    const r = ST.weeklyReport({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, ws);
    const prev = ST.addDays(ws, -7), next = ST.addDays(ws, 7);
    const eg = (e) => e.total ? e.success + ' de ' + e.total + ' (' + e.pct + '%)' : '—';
    const row = (l, v) => '<div class="item"><div>' + l + '</div><div><b>' + v + '</b></div></div>';
    return '<div class="row between" style="margin-bottom:12px"><a class="btn small ghost" style="text-decoration:none" href="#/informe/' + prev + '">← Anterior</a><b>' + fmtDate(r.from) + ' – ' + fmtDate(r.to) + '</b><a class="btn small ghost" style="text-decoration:none" href="#/informe/' + next + '">Siguiente →</a></div>' +
      '<div class="card"><div class="list">' + row('Entrenamientos', r.sessions) + row('Minutos', r.minutes) + row('Rounds', r.rounds) + row('Finalizaciones realizadas', r.subsMade) + row('Finalizaciones recibidas', r.subsRecv) + row('Pases (éxitos de intentos)', eg(r.passes)) + row('Escapes (éxitos de intentos)', eg(r.escapes)) + row('Objetivos completados', r.goalsDone) + '</div></div>' +
      '<div class="card"><h3>Técnicas trabajadas</h3>' + (r.techniques.length ? '<div class="chips">' + r.techniques.map((t) => '<span class="tag">' + esc(t.key) + ' ×' + t.n + '</span>').join('') + '</div>' : '<p class="muted">No registraste técnicas esta semana.</p>') + '</div>' +
      (r.sessions + r.rounds === 0 ? '<div class="card"><p class="muted">No hay registros en esta semana.</p></div>' : '');
  };

  // ================= BIBLIOTECA =================
  const ST_LABEL = { borrador: 'Borrador', ficha: 'Ficha sin contrastar', contrastada: 'Nombre contrastado con fuente (descripción sin revisar)', 'sin-verificar': 'Sin verificar', propia: 'Propia' };
  ui.lib = { q: '', cat: 'all', gi: 'all', lv: 'all', pos: 'all', fav: false, learned: false };
  const libPositions = () => Array.from(new Set(S.lib.reduce((a, t) => a.concat(t.from ? [t.from] : [], t.to ? [t.to] : []), []))).sort((x, y) => x.localeCompare(y));
  function libList() {
    const u = ui.lib; const q = ST.norm(u.q);
    const rows = S.lib.filter((t) => (u.cat === 'all' || t.cat === u.cat) && (u.gi === 'all' || t.gi === u.gi || t.gi === 'both') && (u.lv === 'all' || t.lv === u.lv) &&
      (u.pos === 'all' || t.from === u.pos || t.to === u.pos) && (!u.fav || S.favs.includes(t.id)) && (!u.learned || (S.mastery[t.id] || 0) >= 4) &&
      (!q || [t.name, t.es].concat(t.alias || []).some((n) => ST.norm(n).includes(q))));
    return '<p class="small muted">' + rows.length + ' de ' + S.lib.length + ' técnicas</p>' + (rows.length ? '<div class="list">' + rows.map((t) =>
      '<a href="#" class="item" data-act="tech" data-id="' + t.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + (S.favs.includes(t.id) ? '★ ' : '') + esc(t.name) + '</div><div class="pill-n">' + esc(t.es) + ' · ' + APP.CATS[t.cat] + (t.st === 'sin-verificar' || t.st === 'propia' ? ' · ' + ST_LABEL[t.st] : '') + '</div></div><span class="tag">' + (S.mastery[t.id] ? S.mastery[t.id] + '/5' : t.lv) + '</span></a>').join('') + '</div>' : '<div class="empty">Ninguna técnica coincide.</div>');
  }
  V.biblio = () => {
    const u = ui.lib; const b = (k, opts, cur) => '<div class="seg">' + opts.map((o) => '<button class="' + (cur === o[0] ? 'on' : '') + '" data-act="libf" data-k="' + k + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
    const withFicha = S.lib.filter((t) => t.desc).length; const verified = S.lib.filter((t) => t.st === 'contrastada').length; const unver = S.lib.filter((t) => t.st === 'sin-verificar').length;
    return '<div class="card"><input type="search" placeholder="Buscar por nombre o sinónimo…" value="' + esc(u.q) + '" data-input="libsearch" style="margin-bottom:10px">' +
      b('cat', [['all', 'Todas']].concat(Object.keys(APP.CATS).map((c) => [c, APP.CATS[c]])), u.cat) + b('gi', [['all', 'GI + NO-GI'], ['gi', 'GI'], ['nogi', 'NO-GI']], u.gi) + b('lv', [['all', 'Todos'], ['blanco', 'Blanco'], ['azul', 'Azul'], ['morado', 'Morado']], u.lv) +
      '<select data-input="libpos" style="margin-bottom:10px"><option value="all">Todas las posiciones</option>' + libPositions().map((x) => '<option value="' + esc(x) + '"' + (u.pos === x ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>' +
      '<div class="row wrap"><button class="chip sm' + (u.fav ? ' on' : '') + '" data-act="libfav">★ Favoritas</button><button class="chip sm' + (u.learned ? ' on' : '') + '" data-act="liblearned">✔ Aprendidas</button><button class="btn small ghost" data-act="addCustom">+ Técnica propia</button></div></div>' +
      '<div class="explain"><b>Estado de la biblioteca:</b> ' + S.lib.length + ' técnicas con alias, ' + withFicha + ' con ficha, ' + verified + ' con nombre contrastado en una fuente y ' + unver + ' sin verificar. <b>No está completa ni revisada.</b> Las fichas están sin contrastar: confírmalas con tu profesor.' + (APP.libWarnings.length ? '<br>Avisos: ' + esc(APP.libWarnings.join(' · ')) : '') + '</div>' +
      '<div class="card" id="lib-list">' + libList() + '</div>';
  };
  A.libsearch = (el) => { ui.lib.q = el.value; const l = APP.$('#lib-list'); if (l) l.innerHTML = libList(); };
  A.libpos = (el) => { ui.lib.pos = el.value; const l = APP.$('#lib-list'); if (l) l.innerHTML = libList(); };
  A.libf = (el) => { ui.lib[el.dataset.k] = el.dataset.v; rk(); };
  A.libfav = () => { ui.lib.fav = !ui.lib.fav; rk(); };
  A.liblearned = () => { ui.lib.learned = !ui.lib.learned; rk(); };
  const refreshList = () => { const l = APP.$('#lib-list'); if (l) l.innerHTML = libList(); };
  const listBlock = (title, arr) => arr && arr.length ? '<h3 style="margin:16px 0 6px">' + title + '</h3><ul style="margin:0;padding-left:18px">' + arr.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
  const techChips = (ids) => ids && ids.length ? '<div class="chips">' + ids.map((i) => { const t = APP.techById(i); return t ? '<button class="chip sm" data-act="tech" data-id="' + t.id + '">' + esc(t.name) + '</button>' : ''; }).join('') + '</div>' : '';
  A.tech = (el) => {
    const t = APP.techById(el.dataset.id); if (!t) return;
    const lv = S.mastery[t.id] || 0; const inChains = S.chains.filter((c) => c.steps.some((x) => (APP.findTech(x) || {}).id === t.id));
    const rel = new Set(); inChains.forEach((c) => c.steps.forEach((x, i) => { if ((APP.findTech(x) || {}).id === t.id) { if (c.steps[i - 1]) rel.add(c.steps[i - 1]); if (c.steps[i + 1]) rel.add(c.steps[i + 1]); } }));
    const diff = t.diff ? '<p class="small muted" style="margin:8px 0">Dificultad: ' + '●'.repeat(t.diff) + '○'.repeat(5 - t.diff) + ' (' + t.diff + '/5) · Nivel recomendado: ' + esc(t.lv) + '</p>' : '<p class="small muted" style="margin:8px 0">Nivel recomendado: ' + esc(t.lv) + '</p>';
    const srcs = (t.src || []).filter((x) => /^https?:/.test(x));
    APP.openSheet(t.name, '<p class="muted">' + esc(t.es) + '</p>' + (t.alias && t.alias.length ? '<p class="small">También conocida como: ' + esc(t.alias.join(', ')) + '</p>' : '') +
      '<div class="chips"><span class="tag">' + APP.CATS[t.cat] + '</span>' + (t.sub ? '<span class="tag">' + esc(t.sub) + '</span>' : '') + '<span class="tag">' + ({ gi: 'GI', nogi: 'NO-GI', both: 'GI y NO-GI' }[t.gi] || '') + '</span><span class="tag">' + (ST_LABEL[t.st] || 'Borrador') + '</span></div>' + diff +
      (t.nota ? '<div class="explain">' + esc(t.nota) + '</div>' : '') + (t.desc ? '<p>' + esc(t.desc) + '</p>' : '<p class="muted small">Esta técnica aún no tiene ficha descriptiva.</p>') +
      (t.from || t.to ? '<p class="small"><b>Posición inicial:</b> ' + esc(t.from || '—') + ' &nbsp; <b>Final:</b> ' + esc(t.to || '—') + '</p>' : '') +
      listBlock('Variantes', t.variants) + listBlock('Entradas', t.entries) + (t.next && t.next.length ? '<h3 style="margin:16px 0 6px">Continuaciones</h3>' + techChips(t.next) : '') + listBlock('Defensas', t.defenses) + listBlock('Errores habituales', t.mistakes) +
      (t.related && t.related.length ? '<h3 style="margin:16px 0 6px">Técnicas relacionadas</h3>' + techChips(t.related) : '') +
      (srcs.length ? '<h3 style="margin:16px 0 6px">Fuentes</h3><ul style="margin:0;padding-left:18px">' + srcs.map((x) => '<li><a href="' + esc(x) + '" target="_blank" rel="noopener">' + esc(x) + '</a></li>').join('') + '</ul>' : '') +
      '<h3 style="margin:16px 0 6px">Mi nivel</h3><div class="mastery">' + [1, 2, 3, 4, 5].map((i) => '<button class="' + (lv === i ? 'on' : '') + '" data-act="mastery2" data-id="' + t.id + '" data-l="' + i + '">' + i + '</button>').join('') + '</div><p class="small muted">' + (lv ? APP.LEVELS[lv - 1] : 'Sin marcar') + '</p>' +
      '<div class="stack"><button class="btn secondary block" data-act="learned" data-id="' + t.id + '">' + (lv >= 4 ? '✔ Marcada como aprendida' : 'Marcar como aprendida (nivel 4)') + '</button><button class="btn secondary block" data-act="fav" data-id="' + t.id + '">' + (S.favs.includes(t.id) ? '★ Quitar de favoritas' : '☆ Guardar en favoritas') + '</button><button class="btn ghost block" data-act="aliasForm" data-id="' + t.id + '">Añadir otro nombre (alias)</button></div>' +
      (rel.size ? '<h3 style="margin:16px 0 6px">En mis cadenas</h3><div class="chips">' + Array.from(rel).map((x) => '<span class="tag">' + esc(x) + '</span>').join('') + '</div>' : ''));
  };
  A.mastery2 = async (el) => { await APP.setMastery(el.dataset.id, Number(el.dataset.l)); A.tech({ dataset: { id: el.dataset.id } }); refreshList(); };
  A.learned = async (el) => { if ((S.mastery[el.dataset.id] || 0) < 4) await APP.setMastery(el.dataset.id, 4); A.tech({ dataset: { id: el.dataset.id } }); refreshList(); };
  A.fav = async (el) => { const id = el.dataset.id; await APP.saveMeta('favs', S.favs.includes(id) ? S.favs.filter((x) => x !== id) : S.favs.concat(id)); A.tech({ dataset: { id } }); refreshList(); };
  A.aliasForm = (el) => {
    const t = APP.techById(el.dataset.id); if (!t) return;
    APP.openSheet('Añadir alias a ' + t.name, field('Otro nombre con el que conoces esta técnica', '<input id="al-name" placeholder="Ej.: nombre de tu academia">') + '<p class="small muted">Se guarda como otro nombre de la misma técnica, no como una técnica nueva.</p><button class="btn block" data-act="saveAlias" data-id="' + t.id + '">Guardar alias</button>');
  };
  A.saveAlias = async (el) => {
    const n = val('al-name').trim(); if (!n) return;
    const ex = APP.findTech(n); if (ex) { APP.toast('Ya existe: «' + ex.name + '»'); return; }
    if (await APP.addAlias(el.dataset.id, n)) { APP.toast('Alias guardado'); A.tech({ dataset: { id: el.dataset.id } }); refreshList(); }
  };
  A.addCustom = () => APP.openSheet('Nueva técnica propia',
    field('Nombre', '<input id="ct-name" placeholder="Nombre internacional o el que uses">') + field('Nombre en español (opcional)', '<input id="ct-es">') + field('Otros nombres (separados por comas)', '<input id="ct-alias">') +
    group('Categoría', chips('ctcat', Object.keys(APP.CATS).map((c) => ({ v: c, l: APP.CATS[c] })), 'finalizacion', false, true)) + group('Modalidad', chips('ctgi', [{ v: 'both', l: 'Ambos' }, { v: 'gi', l: 'GI' }, { v: 'nogi', l: 'NO-GI' }], 'both')) +
    group('Nivel recomendado', chips('ctlv', ['blanco', 'azul', 'morado', 'marron', 'negro'], 'blanco', false, true)) +
    '<div class="grid2">' + field('Posición inicial', '<input id="ct-from" list="dl-pos">') + field('Posición final', '<input id="ct-to" list="dl-pos">') + '</div>' + field('Descripción (opcional)', '<textarea id="ct-desc"></textarea>') +
    '<button class="btn block" data-act="saveCustom">Guardar técnica</button>');
  A.saveCustom = async () => {
    const name = val('ct-name').trim(); if (!name) return APP.toast('Escribe el nombre');
    const alias = val('ct-alias').split(',').map((x) => x.trim()).filter(Boolean);
    const res = await APP.addCustom({ name, es: val('ct-es').trim() || name, alias, cat: sel('ctcat')[0] || 'finalizacion', sub: '', gi: sel('ctgi')[0] || 'both', lv: sel('ctlv')[0] || 'blanco', from: val('ct-from').trim(), to: val('ct-to').trim(), desc: val('ct-desc').trim() });
    if (!res.ok) {
      if (APP.confirm('«' + name + '» ya existe como «' + res.existing.name + '». ¿Añadirlo como otro nombre (alias) de esa técnica en vez de crear una duplicada?')) { await APP.addAlias(res.existing.id, name); APP.closeSheet(); APP.toast('Alias añadido a ' + res.existing.name); rk(); }
      return;
    }
    APP.closeSheet(); APP.toast('Técnica añadida'); rk();
  };

  // ================= MÁS / AJUSTES / PLAN =================
  V.mas = () => '<div class="card"><div class="list">' +
    [['#/coach', '🥋', 'Entrenador personal', 'Análisis y respuestas con tus datos'], ['#/informe', '🗓', 'Informe semanal', 'Resumen de tu semana'], ['#/mensual', '📈', 'Informe mensual', 'Evolución y plan del mes'], ['#/biblio', '📚', 'Biblioteca técnica', S.lib.length + ' técnicas (borrador)'], ['#/plan', '📅', 'Planificación', 'Calendario, objetivos y recordatorios'], ['#/ajustes', '⚙', 'Ajustes y datos', 'Tema, exportar e importar']]
      .map((x) => '<a class="item" href="' + x[0] + '" style="text-decoration:none;color:inherit"><div><div class="title">' + x[1] + ' ' + x[2] + '</div><div class="pill-n">' + x[3] + '</div></div><span class="muted">›</span></a>').join('') + '</div></div>';

  V.ajustes = () => '<div class="card"><h3>Apariencia</h3>' + '<div class="seg">' + [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map((t) => '<button class="' + (S.settings.theme === t[0] ? 'on' : '') + '" data-act="theme" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="card"><h3>Tus datos</h3><p class="muted small">Todo se guarda en este dispositivo. No hay cuentas ni servidores. Haz copias de seguridad de vez en cuando.</p><div class="stack"><button class="btn block" data-act="export">Exportar copia (JSON)</button><label class="btn secondary block" style="display:block;text-align:center">Importar copia<input type="file" accept="application/json,.json" data-input="importfile" hidden></label><button class="btn danger block" data-act="wipe">Borrar todos los datos</button></div></div>' +
    '<div class="card"><h3>Resumen</h3><p class="small muted">' + S.sessions.length + ' entrenamientos · ' + S.rounds.length + ' rounds · ' + S.goals.length + ' objetivos · ' + S.chains.length + ' cadenas</p></div>';
  A.theme = async (el) => { S.settings.theme = el.dataset.v; await APP.saveMeta('settings', S.settings); APP.applyTheme(); rk(); };
  A.export = () => {
    const data = { app: 'bjj-coach', version: 1, exported: new Date().toISOString(), profile: S.profile, sessions: S.sessions, rounds: S.rounds, chains: S.chains, goals: S.goals, mastery: S.mastery, favs: S.favs, settings: S.settings, custom: S.custom, aliases: S.aliases, plan: S.plan };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bjj-coach-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    APP.toast('Copia exportada');
  };
  A.importfile = async (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); if (d.app !== 'bjj-coach') throw new Error('Archivo no válido');
      if (!APP.confirm('Se añadirán a tus datos ' + (d.sessions || []).length + ' sesiones y ' + (d.rounds || []).length + ' rounds (lo que ya existe se actualiza). ¿Continuar?')) return;
      for (const s of d.sessions || []) await APP.saveSession(s);
      for (const r of d.rounds || []) await APP.saveRound(r);
      for (const c of d.chains || []) await APP.saveChain(c);
      for (const g of d.goals || []) await APP.saveGoal(g);
      for (const k of Object.keys(d.mastery || {})) await APP.setMastery(k, d.mastery[k]);
      if (d.profile) await APP.saveMeta('profile', d.profile);
      if (d.favs) await APP.saveMeta('favs', Array.from(new Set(S.favs.concat(d.favs))));
      if (d.custom && d.custom.length) { const have = new Set((S.custom || []).map((c) => c.id)); await APP.saveMeta('custom', (S.custom || []).concat(d.custom.filter((c) => !have.has(c.id)))); }
      if (d.aliases) { const al = Object.assign({}, S.aliases || {}); Object.keys(d.aliases).forEach((k) => { al[k] = Array.from(new Set((al[k] || []).concat(d.aliases[k]))); }); await APP.saveMeta('aliases', al); }
      if (d.plan) await APP.saveMeta('plan', APP.normalizePlan(d.plan));
      await APP.loadLib();
      APP.toast('Copia importada'); APP.render();
    } catch (e) { APP.toast('No se pudo importar: ' + e.message); }
    el.value = '';
  };
  A.wipe = async () => {
    if (!APP.confirm('¿Borrar TODOS tus datos de este dispositivo? No se puede deshacer.')) return;
    if (!APP.confirm('Última confirmación: se borrarán entrenamientos, rounds, perfil y objetivos.')) return;
    for (const st of ['sessions', 'rounds', 'chains', 'goals', 'mastery']) await APP.db.clear(st);
    await APP.db.del('meta', 'profile'); await APP.db.del('meta', 'favs'); await APP.db.del('meta', 'custom'); await APP.db.del('meta', 'aliases'); await APP.db.del('meta', 'plan'); S.plan = APP.defaultPlan();
    Object.assign(S, { sessions: [], rounds: [], mastery: {}, chains: [], goals: [], profile: null, favs: [], custom: [], aliases: {} }); await APP.loadLib();
    APP.toast('Datos borrados'); APP.go('#/inicio');
  };
})();
