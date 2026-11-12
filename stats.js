/* BJJ Coach — lógica de estadísticas y entrenador local (sin dependencias, sin red).
   Todo se calcula a partir de los registros reales. */
(function () {
  'use strict';

  const KINDS = {
    sub_made:      { label: 'Finalización realizada', own: true,  group: 'sub' },
    sub_recv:      { label: 'Finalización recibida',  own: false, group: 'sub' },
    pass_made:     { label: 'Pase de guardia realizado', own: true,  group: 'pass' },
    pass_recv:     { label: 'Pase de guardia recibido',  own: false, group: 'pass' },
    sweep_made:    { label: 'Sweep realizado', own: true,  group: 'sweep' },
    sweep_recv:    { label: 'Sweep recibido',  own: false, group: 'sweep' },
    escape:        { label: 'Escape',          own: true,  group: 'escape' },
    takedown_made: { label: 'Derribo realizado', own: true,  group: 'takedown' },
    takedown_recv: { label: 'Derribo recibido',  own: false, group: 'takedown' },
    guard_recovery:{ label: 'Recuperación de guardia', own: true, group: 'guard' },
    back_take:     { label: 'Transición a la espalda', own: true, group: 'back' },
    pos_gain:      { label: 'Control posicional conseguido', own: true,  group: 'pos' },
    pos_lost:      { label: 'Control posicional perdido',    own: false, group: 'pos' }
  };

  const RESULTS = { win: 'Victoria', loss: 'Derrota', draw: 'Empate', none: 'Sin resultado' };

  // ---------- utilidades de fecha ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); }
  function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); }
  function weekStart(s) { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return toISO(d); }
  function periodKey(s, gran) {
    const d = parse(s);
    if (gran === 'week') return weekStart(s);
    if (gran === 'month') return d.getFullYear() + '-' + pad(d.getMonth() + 1);
    if (gran === 'quarter') return d.getFullYear() + '-T' + (Math.floor(d.getMonth() / 3) + 1);
    if (gran === 'year') return String(d.getFullYear());
    return s;
  }

  // ---------- utilidades generales ----------
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function pct(n, total) { return total > 0 ? Math.round((n / total) * 100) : 0; }
  function tally(items, keyFn) {
    const m = new Map();
    items.forEach((it) => {
      const k = keyFn(it);
      if (k === undefined || k === null || k === '') return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m, ([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n || String(a.key).localeCompare(String(b.key)));
  }
  function techName(e) { return (e.tech && String(e.tech).trim()) || 'Sin especificar'; }
  function posName(p) { return (p && String(p).trim()) || 'Sin especificar'; }

  // ---------- eventos ----------
  function flatten(rounds) {
    const out = [];
    const seen = new Set();
    (rounds || []).forEach((r) => {
      (r.events || []).forEach((e) => {
        if (!e || !KINDS[e.kind]) return;
        if (e.id && seen.has(e.id)) return; // nunca contar dos veces el mismo acontecimiento
        if (e.id) seen.add(e.id);
        out.push(Object.assign({}, e, { rid: r.id, date: r.date, rmode: r.mode, context: r.context || 'entreno' }));
      });
    });
    return out;
  }

  function filterRounds(rounds, f) {
    f = f || {};
    return (rounds || []).filter((r) => {
      if (f.mode && f.mode !== 'all' && r.mode !== f.mode) return false;
      if (f.context && f.context !== 'all' && (r.context || 'entreno') !== f.context) return false;
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      return true;
    });
  }

  function rate(success, attempts) { return { success, attempts, total: success + attempts, pct: pct(success, success + attempts) }; }

  // Intentos fallidos + éxitos = intentos totales. Eficacia = éxitos / (éxitos + intentos fallidos).
  function efficacy(events, kind) {
    const ev = events.filter((e) => e.kind === kind);
    const ok = ev.filter((e) => e.outcome === 'exito').length;
    const fail = ev.filter((e) => e.outcome === 'intento').length;
    return rate(ok, fail);
  }

  function byTechEfficacy(events, kind) {
    const ev = events.filter((e) => e.kind === kind);
    const names = Array.from(new Set(ev.map(techName)));
    return names.map((t) => {
      const mine = ev.filter((e) => techName(e) === t);
      const ok = mine.filter((e) => e.outcome === 'exito').length;
      return Object.assign({ tech: t }, rate(ok, mine.length - ok));
    }).sort((a, b) => b.success - a.success || b.total - a.total);
  }

  function distribution(events, kind, keyFn, onlySuccess) {
    let ev = events.filter((e) => e.kind === kind);
    if (onlySuccess) ev = ev.filter((e) => e.outcome === 'exito');
    const total = ev.length;
    return { total, rows: tally(ev, keyFn).map((r) => ({ key: r.key, n: r.n, pct: pct(r.n, total) })) };
  }

  function evolution(events, kinds, gran, onlySuccess) {
    const set = new Set([].concat(kinds));
    let ev = events.filter((e) => set.has(e.kind));
    if (onlySuccess) ev = ev.filter((e) => e.outcome === 'exito' || !KINDS[e.kind].own);
    const rows = tally(ev, (e) => periodKey(e.date, gran || 'month'));
    return rows.sort((a, b) => String(a.key).localeCompare(String(b.key)));
  }

  function report(rounds, filters) {
    const rs = filterRounds(rounds, filters);
    const ev = flatten(rs);
    const subsMade = distribution(ev, 'sub_made', techName, true);
    const subsRecv = distribution(ev, 'sub_recv', techName, false);
    const guardsFromPassRecv = distribution(ev, 'pass_recv', (e) => posName(e.from), false);
    const sweepsByGuard = distribution(ev, 'sweep_made', (e) => posName(e.from), true);
    const subsByGuard = distribution(ev.filter((e) => /guard|guardia|mariposa|dlr|riva|x-guard|50\/50|half|media|lasso|spider|worm|lapel|k-guard|shin/.test(norm(e.from))), 'sub_made', (e) => posName(e.from), true);
    const escapesByPos = {};
    ev.filter((e) => e.kind === 'escape').forEach((e) => {
      const p = posName(e.from);
      escapesByPos[p] = escapesByPos[p] || { success: 0, attempts: 0 };
      if (e.outcome === 'exito') escapesByPos[p].success++; else escapesByPos[p].attempts++;
    });
    const escapeRows = Object.keys(escapesByPos).map((p) => Object.assign({ pos: p }, rate(escapesByPos[p].success, escapesByPos[p].attempts)))
      .sort((a, b) => a.pct - b.pct || b.total - a.total);
    const results = tally(rs, (r) => r.result || 'none').map((r) => ({ key: r.key, label: RESULTS[r.key] || r.key, n: r.n, pct: pct(r.n, rs.length) }));

    return {
      rounds: rs.length,
      events: ev.length,
      results,
      subs: {
        made: subsMade,
        madeByPosition: distribution(ev, 'sub_made', (e) => posName(e.from), true),
        madeByMode: distribution(ev, 'sub_made', (e) => e.mode || e.rmode || 'sin dato', true),
        efficacy: efficacy(ev, 'sub_made'),
        byTech: byTechEfficacy(ev, 'sub_made'),
        received: subsRecv,
        receivedByPosition: distribution(ev, 'sub_recv', (e) => posName(e.from), false),
        receivedByMode: distribution(ev, 'sub_recv', (e) => e.mode || e.rmode || 'sin dato', false),
        evolutionMade: evolution(ev, 'sub_made', 'month', true),
        evolutionRecv: evolution(ev, 'sub_recv', 'month', false)
      },
      passes: {
        efficacy: efficacy(ev, 'pass_made'),
        byTech: byTechEfficacy(ev, 'pass_made'),
        byStartPosition: distribution(ev, 'pass_made', (e) => posName(e.from), false),
        received: distribution(ev, 'pass_recv', techName, false),
        receivedFromGuard: guardsFromPassRecv
      },
      guards: { sweepsByGuard, subsByGuard, passesReceivedByGuard: guardsFromPassRecv, sweepEfficacy: efficacy(ev, 'sweep_made'), sweepsReceived: distribution(ev, 'sweep_recv', techName, false), recoveries: efficacy(ev, 'guard_recovery') },
      escapes: { efficacy: efficacy(ev, 'escape'), byPosition: escapeRows, byTech: byTechEfficacy(ev, 'escape') },
      takedowns: { efficacy: efficacy(ev, 'takedown_made'), byTech: byTechEfficacy(ev, 'takedown_made'), received: distribution(ev, 'takedown_recv', techName, false), evolution: evolution(ev, ['takedown_made'], 'month', true) },
      general: {
        byWeek: evolution(ev, Object.keys(KINDS), 'week', false),
        byMonth: evolution(ev, Object.keys(KINDS), 'month', false)
      }
    };
  }

  // Comparar dos periodos [a.from,a.to] vs [b.from,b.to]
  function compare(rounds, a, b, filters) {
    const ra = report(rounds, Object.assign({}, filters, a));
    const rb = report(rounds, Object.assign({}, filters, b));
    function pick(r) {
      return {
        rounds: r.rounds,
        subsMade: r.subs.made.total,
        subsRecv: r.subs.received.total,
        subEff: r.subs.efficacy,
        passEff: r.passes.efficacy,
        escapeEff: r.escapes.efficacy,
        takedownEff: r.takedowns.efficacy
      };
    }
    return { a: pick(ra), b: pick(rb) };
  }

  // ---------- sesiones ----------
  function sessionsInRange(sessions, from, to) {
    return (sessions || []).filter((s) => (!from || s.date >= from) && (!to || s.date <= to));
  }

  function topCount(items, n) { return tally(items, (x) => x).slice(0, n || 3); }

  function splitTags(v) {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    return String(v || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  }

  // ---------- entrenador local basado en reglas ----------
  // Cada observación: {type: 'dato'|'patron'|'hipotesis'|'recomendacion', text, n}
  function coach(data, today) {
    const sessions = data.sessions || [];
    const rounds = data.rounds || [];
    const out = [];
    const ev = flatten(rounds);
    const add = (type, text, n) => out.push({ type, text, n: n === undefined ? null : n });

    if (sessions.length === 0 && ev.length === 0) {
      add('dato', 'Todavía no hay entrenamientos ni rounds registrados.', 0);
      add('recomendacion', 'Registra tu próximo entrenamiento y, si haces sparring, los rounds. Con unos 10 acontecimientos ya puedo detectar patrones.', 0);
      return out;
    }

    // Frecuencia de entrenamiento
    const last7 = sessionsInRange(sessions, addDays(today, -6), today).length;
    const prev28 = sessionsInRange(sessions, addDays(today, -34), addDays(today, -7)).length;
    add('dato', 'Entrenamientos en los últimos 7 días: ' + last7 + '. En las 4 semanas anteriores: ' + prev28 + ' (' + (Math.round((prev28 / 4) * 10) / 10) + ' por semana de media).', sessions.length);

    if (ev.length < 10) {
      add('dato', 'Solo hay ' + ev.length + ' acontecimientos de combate registrados. Es poco para sacar conclusiones fiables.', ev.length);
      add('recomendacion', 'Anota tus rounds (aunque sean solo finalizaciones, pases y escapes) durante un par de semanas para que el análisis tenga base.', ev.length);
    }

    // Finalizaciones recibidas
    const recv = ev.filter((e) => e.kind === 'sub_recv');
    if (recv.length >= 4) {
      const t = tally(recv, techName)[0];
      const share = pct(t.n, recv.length);
      if (t.n >= 3 && share >= 40) {
        add('patron', 'Te han finalizado ' + recv.length + ' veces; ' + t.n + ' (' + share + '%) con ' + t.key + '.', recv.length);
        add('recomendacion', 'Dedica una sesión a defender ' + t.key + ' en las posiciones donde te la aplican.', recv.length);
      }
      const p = tally(recv.filter((e) => posName(e.from) !== 'Sin especificar'), (e) => posName(e.from))[0];
      if (p && p.n >= 3) add('patron', 'Desde ' + p.key + ' te han finalizado ' + p.n + ' veces de ' + recv.length + '.', recv.length);
    }

    // Dependencia de una finalización
    const made = ev.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito');
    if (made.length >= 5) {
      const t = tally(made, techName)[0];
      const share = pct(t.n, made.length);
      if (share >= 60) {
        add('patron', share + '% de tus ' + made.length + ' finalizaciones son ' + t.key + ' (' + t.n + ').', made.length);
        add('hipotesis', 'Puede que dependas de una sola finalización; con tan pocos datos no es seguro, pero conviene comprobarlo.', made.length);
        add('recomendacion', 'Prueba a encadenar ' + t.key + ' con una segunda finalización desde la misma posición.', made.length);
      }
    }

    // Eficacia de pases
    const pe = efficacy(ev, 'pass_made');
    if (pe.total >= 8) {
      if (pe.pct < 30) {
        add('patron', 'Pases de guardia: ' + pe.success + ' de ' + pe.total + ' intentos (' + pe.pct + '%).', pe.total);
        add('recomendacion', 'Elige un sistema de pase y trabájalo en exclusiva unas semanas antes de añadir más.', pe.total);
      } else if (pe.pct >= 60) {
        add('patron', 'Pases de guardia: ' + pe.success + ' de ' + pe.total + ' intentos (' + pe.pct + '%).', pe.total);
      }
      const bt = byTechEfficacy(ev, 'pass_made').filter((x) => x.total >= 3).sort((a, b) => b.pct - a.pct)[0];
      if (bt) add('dato', 'Tu pase con mejor efectividad registrada es ' + bt.tech + ': ' + bt.success + ' de ' + bt.total + '.', bt.total);
    }

    // Pases recibidos por guardia
    const prg = tally(ev.filter((e) => e.kind === 'pass_recv' && posName(e.from) !== 'Sin especificar'), (e) => posName(e.from))[0];
    if (prg && prg.n >= 3) {
      add('patron', 'Te han pasado la guardia ' + prg.n + ' veces desde ' + prg.key + '.', prg.n);
      add('recomendacion', 'Trabaja la retención de guardia desde ' + prg.key + ' (marcos, caderas y recuperación).', prg.n);
    }

    // Escapes
    const escRows = {};
    ev.filter((e) => e.kind === 'escape').forEach((e) => {
      const p = posName(e.from);
      escRows[p] = escRows[p] || { s: 0, t: 0 };
      escRows[p].t++;
      if (e.outcome === 'exito') escRows[p].s++;
    });
    Object.keys(escRows).forEach((p) => {
      const r = escRows[p];
      if (r.t >= 5 && pct(r.s, r.t) < 40 && p !== 'Sin especificar') {
        add('patron', 'Escapes desde ' + p + ': ' + r.s + ' de ' + r.t + ' (' + pct(r.s, r.t) + '%).', r.t);
        add('recomendacion', 'Incluye escapes desde ' + p + ' en tu planificación esta semana.', r.t);
      }
    });

    // Derribos vs. otras áreas
    if (rounds.length >= 10) {
      const td = ev.filter((e) => e.kind === 'takedown_made').length;
      if (td === 0) add('hipotesis', 'No has registrado ningún derribo propio en ' + rounds.length + ' rounds. Puede que empieces siempre sentado o de rodillas, o que no lo estés anotando.', rounds.length);
    }

    // ¿Estoy mejorando? (últimos 30 días vs 30 anteriores, solo con muestra suficiente)
    const cur = flatten(filterRounds(rounds, { from: addDays(today, -29), to: today }));
    const prv = flatten(filterRounds(rounds, { from: addDays(today, -59), to: addDays(today, -30) }));
    const ce = efficacy(cur, 'sub_made');
    const pr = efficacy(prv, 'sub_made');
    if (ce.total >= 8 && pr.total >= 8) {
      const diff = ce.pct - pr.pct;
      if (Math.abs(diff) >= 10) {
        add('patron', 'Efectividad de finalizaciones: ' + ce.pct + '% (' + ce.success + '/' + ce.total + ') los últimos 30 días frente a ' + pr.pct + '% (' + pr.success + '/' + pr.total + ') los 30 anteriores.', ce.total + pr.total);
        add('hipotesis', diff > 0 ? 'Podría indicar mejora, aunque puede deberse al tipo de compañeros o rounds.' : 'Podría indicar un bache o un cambio de rivales o de estilo.', ce.total + pr.total);
      } else {
        add('dato', 'Efectividad de finalizaciones estable: ' + ce.pct + '% ahora frente a ' + pr.pct + '% antes.', ce.total + pr.total);
      }
    } else {
      add('dato', 'No hay datos suficientes para afirmar si estás mejorando: harían falta al menos 8 intentos de finalización en cada uno de los dos últimos meses (ahora ' + ce.total + ' y ' + pr.total + ').', ce.total + pr.total);
    }

    // Errores repetidos que el propio usuario anota
    const hardTags = [];
    sessions.forEach((s) => {
      const rv = s.review || {};
      splitTags(rv.hard).forEach((t) => hardTags.push(norm(t)));
      splitTags(rv.lostPos).forEach((t) => hardTags.push(norm(t)));
    });
    const rep = tally(hardTags, (x) => x).filter((x) => x.n >= 2).slice(0, 3);
    rep.forEach((r) => add('patron', 'Has anotado "' + r.key + '" como dificultad o posición perdida en ' + r.n + ' sesiones.', r.n));

    // Satisfacción reciente
    const rated = sessions.filter((s) => s.review && s.review.rating).slice(-5);
    if (rated.length >= 3) {
      const avg = rated.reduce((a, s) => a + Number(s.review.rating), 0) / rated.length;
      add('dato', 'Valoración media de tus últimas ' + rated.length + ' sesiones: ' + (Math.round(avg * 10) / 10) + '/10.', rated.length);
    }

    return out;
  }

  function weeklyReport(data, today) {
    const from = weekStart(today);
    const to = addDays(from, 6);
    const ss = sessionsInRange(data.sessions, from, to);
    const rs = filterRounds(data.rounds, { from, to });
    const rep = report(data.rounds, { from, to });
    const techs = tally(ss.reduce((a, s) => a.concat(splitTags(s.techniques)), []), (x) => x).slice(0, 5);
    return {
      from, to,
      sessions: ss.length,
      minutes: ss.reduce((a, s) => a + (Number(s.duration) || 0), 0),
      rounds: rs.length,
      techniques: techs,
      subsMade: rep.subs.made.total,
      subsRecv: rep.subs.received.total,
      passes: rep.passes.efficacy,
      escapes: rep.escapes.efficacy,
      goalsDone: (data.goals || []).filter((g) => g.done && g.doneDate >= from && g.doneDate <= to).length
    };
  }

  function sessionAnalysis(session, rounds) {
    const rs = (rounds || []).filter((r) => r.sessionId === session.id);
    const ev = flatten(rs);
    const out = [];
    if (!rs.length) { out.push({ type: 'dato', text: 'No registraste rounds en esta sesión.' }); return out; }
    const w = rs.filter((r) => r.result === 'win').length;
    const l = rs.filter((r) => r.result === 'loss').length;
    out.push({ type: 'dato', text: rs.length + ' rounds: ' + w + ' victorias, ' + l + ' derrotas.' });
    const sm = ev.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito').length;
    const sr = ev.filter((e) => e.kind === 'sub_recv').length;
    out.push({ type: 'dato', text: 'Finalizaciones: ' + sm + ' realizadas y ' + sr + ' recibidas.' });
    const rt = tally(ev.filter((e) => e.kind === 'sub_recv'), techName)[0];
    if (rt && rt.n >= 2) out.push({ type: 'patron', text: 'Te finalizaron ' + rt.n + ' veces con ' + rt.key + ' en esta misma sesión.' });
    return out;
  }

  // ---------- objetivos sugeridos (reglas sobre datos reales) ----------
  // data: {rounds, sessions, mastery:{id:nivel}, lib:[{id,name}]}. Devuelve [{text, why, n, area}].
  function suggestGoals(data, today) {
    const ev = flatten(data.rounds || []); const out = [];
    const add = (text, why, n, area) => out.push({ text, why, n, area });
    const recv = ev.filter((e) => e.kind === 'sub_recv');
    if (recv.length >= 4) {
      const t = tally(recv, techName)[0];
      if (t.n >= 3 && pct(t.n, recv.length) >= 40) add('Trabajar la defensa de ' + t.key + ' en al menos 2 sesiones', 'Te han finalizado ' + recv.length + ' veces, ' + t.n + ' con ' + t.key + '.', recv.length, 'defensa');
    }
    const esc = {};
    ev.filter((e) => e.kind === 'escape').forEach((e) => { const p = posName(e.from); esc[p] = esc[p] || { s: 0, t: 0 }; esc[p].t++; if (e.outcome === 'exito') esc[p].s++; });
    Object.keys(esc).filter((p) => p !== 'Sin especificar' && esc[p].t >= 5 && pct(esc[p].s, esc[p].t) < 40).slice(0, 2).forEach((p) => add('Drilling de escapes desde ' + p + ' en cada sesión técnica', 'Escapes desde ' + p + ': ' + esc[p].s + ' de ' + esc[p].t + ' (' + pct(esc[p].s, esc[p].t) + '%).', esc[p].t, 'escapes'));
    const prg = tally(ev.filter((e) => e.kind === 'pass_recv' && posName(e.from) !== 'Sin especificar'), (e) => posName(e.from))[0];
    if (prg && prg.n >= 3) add('Mejorar la retención de guardia desde ' + prg.key, 'Te han pasado ' + prg.n + ' veces desde ' + prg.key + '.', prg.n, 'retencion');
    const pe = efficacy(ev, 'pass_made');
    if (pe.total >= 8 && pe.pct < 30) add('Elegir un único sistema de pase y repetirlo esta semana', 'Pases: ' + pe.success + ' de ' + pe.total + ' intentos (' + pe.pct + '%).', pe.total, 'pases');
    const made = ev.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito');
    if (made.length >= 5) { const t = tally(made, techName)[0]; if (pct(t.n, made.length) >= 60) add('Encadenar ' + t.key + ' con una segunda finalización', pct(t.n, made.length) + '% de tus ' + made.length + ' finalizaciones son ' + t.key + '.', made.length, 'finalizaciones'); }
    if ((data.rounds || []).length >= 10 && !ev.some((e) => e.kind === 'takedown_made')) add('Practicar entradas de derribo o tirar a guardia con intención', 'No hay derribos propios registrados en ' + data.rounds.length + ' rounds (puede que no los anotes).', data.rounds.length, 'derribos');
    // técnicas marcadas como «aprendiendo» que no aparecen en las sesiones de los últimos 30 días
    const recentText = (data.sessions || []).filter((s) => s.date >= addDays(today, -29)).reduce((a, s) => a.concat(splitTags(s.techniques)), []).map(norm);
    (data.lib || []).filter((t) => (data.mastery || {})[t.id] === 3 && !recentText.includes(norm(t.name))).slice(0, 2)
      .forEach((t) => add('Practicar ' + t.name + ' (la marcaste como «aprendiendo»)', 'No aparece en tus sesiones de los últimos 30 días.', (data.sessions || []).length, 'practicar'));
    if (!out.length) add('Registrar tus rounds durante 2 semanas para poder personalizar objetivos', 'Aún no hay datos suficientes para detectar puntos débiles; propuesta genérica.', ev.length, 'general');
    return out.sort((a, b) => (b.n || 0) - (a.n || 0));
  }

  // ---------- informe mensual ----------
  function monthRange(ym) { const p = ym.split('-').map(Number); const last = new Date(p[0], p[1], 0).getDate(); return { from: ym + '-01', to: ym + '-' + pad(last) }; }
  function prevMonth(ym) { const p = ym.split('-').map(Number); const d = new Date(p[0], p[1] - 2, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function monthlyReport(data, ym, today) {
    const r = monthRange(ym); const pm = prevMonth(ym); const pr = monthRange(pm);
    const ss = sessionsInRange(data.sessions, r.from, r.to); const ps = sessionsInRange(data.sessions, pr.from, pr.to);
    const cur = report(data.rounds, { from: r.from, to: r.to }); const prv = report(data.rounds, { from: pr.from, to: pr.to });
    const evCur = flatten(filterRounds(data.rounds, { from: r.from, to: r.to }));
    const before = flatten(filterRounds(data.rounds, { to: addDays(r.from, -1) }));
    const knownSubs = new Set(before.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito').map(techName));
    const newStrengths = tally(evCur.filter((e) => e.kind === 'sub_made' && e.outcome === 'exito' && !knownSubs.has(techName(e))), techName).filter((x) => x.n >= 2);
    const hard = []; ss.forEach((s) => { const rv = s.review || {}; splitTags(rv.hard).concat(splitTags(rv.lostPos)).forEach((t) => hard.push(norm(t))); });
    const rated = ss.filter((s) => s.review && s.review.rating);
    return {
      ym, prevYm: pm, from: r.from, to: r.to,
      sessions: ss.length, prevSessions: ps.length,
      minutes: ss.reduce((a, s) => a + (Number(s.duration) || 0), 0), prevMinutes: ps.reduce((a, s) => a + (Number(s.duration) || 0), 0),
      rounds: cur.rounds, prevRounds: prv.rounds,
      subsMade: cur.subs.made.total, prevSubsMade: prv.subs.made.total, subsRecv: cur.subs.received.total, prevSubsRecv: prv.subs.received.total,
      subEff: cur.subs.efficacy, prevSubEff: prv.subs.efficacy, passEff: cur.passes.efficacy, prevPassEff: prv.passes.efficacy, escapeEff: cur.escapes.efficacy, prevEscapeEff: prv.escapes.efficacy,
      topTechniques: tally(ss.reduce((a, s) => a.concat(splitTags(s.techniques)), []), (x) => x).slice(0, 5),
      mostUsedSubs: cur.subs.made.rows.slice(0, 3),
      mostEffective: cur.subs.byTech.filter((x) => x.total >= 3).sort((a, b) => b.pct - a.pct || b.total - a.total).slice(0, 3),
      recurringErrors: tally(hard, (x) => x).filter((x) => x.n >= 2).slice(0, 4),
      newStrengths: newStrengths.slice(0, 3),
      goalsDone: (data.goals || []).filter((g) => g.done && g.doneDate >= r.from && g.doneDate <= r.to),
      avgRating: rated.length ? Math.round((rated.reduce((a, s) => a + Number(s.review.rating), 0) / rated.length) * 10) / 10 : null, ratedN: rated.length,
      nextPlan: suggestGoals(data, today || r.to)
    };
  }

  const api = {
    KINDS, RESULTS, norm, pct, tally, flatten, filterRounds, efficacy, byTechEfficacy, distribution, evolution,
    report, compare, coach, weeklyReport, sessionAnalysis, suggestGoals, monthlyReport, monthRange, prevMonth, periodKey, weekStart, addDays, diffDays, toISO, parse, splitTags, sessionsInRange
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.BJJStats = api;
})();
