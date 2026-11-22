/* v15 · Nuevo diseño: Inicio, panel BJJ con objetivos (día / semana / mes), registro de entreno por pasos
   (con técnicas, sensaciones, rounds y apuntes automáticos) y estadísticas por pestañas. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, nowTime, fmtDate, field, group, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const $ = APP.$, $$ = APP.$$;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  const DL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const DLONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const TYPES = ['Clase técnica', 'Sparring', 'Open mat', 'Competición', 'Drilling', 'Preparación física', 'Clase particular'];
  const MOODS = { 5: 'Genial', 4: 'Bien', 3: 'Normal', 2: 'Duro', 1: 'Mal' };
  const FACES = ['😫', '😕', '😐', '🙂', '😄'];
  const RATES = { hard: ['😓', 'Me costó', 'bad'], ok: ['😐', 'Regular', 'warn'], good: ['💪', 'Salió bien', 'ok'] };
  const modeLabel = (m) => ({ gi: 'GI', nogi: 'NO-GI' }[m] || '');
  const defaultMode = () => (S.profile && (S.profile.mode === 'gi' || S.profile.mode === 'nogi') ? S.profile.mode : '');
  const pctN = (n, t) => (t > 0 ? Math.round((n / t) * 100) : 0);
  const fmtN = (x) => String(Math.round(x * 2) / 2).replace('.', ',');
  const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? h + 'h' + (m ? ' ' + String(m).padStart(2, '0') : '') : m + ' min'; };
  const mmss = (min) => { const t = Math.round(min * 60); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const wdIdx = (d) => (ST.parse(d).getDay() + 6) % 7;
  const nextDate = (dow) => { let d = today(); for (let i = 0; i < 7; i++) { if (wdIdx(d) === dow) return d; d = ST.addDays(d, 1); } return today(); };
  const uniq = (a) => Array.from(new Set(a));

  // ---------- componentes visuales ----------
  const mring = (p, color, txt, size) => { size = size || 56; const r = size / 2 - 6, c = 2 * Math.PI * r, q = Math.max(0, Math.min(1, p)); return '<svg class="mring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="7"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (c * q).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/><text x="' + size / 2 + '" y="' + (size / 2 + size / 11) + '" text-anchor="middle" font-size="' + (size / (String(txt).length > 3 ? 4.4 : 3.3)).toFixed(1) + '" font-weight="800" fill="currentColor">' + esc(txt) + '</text></svg>'; };
  const spark = (vals, color, w, h) => { w = w || 120; h = h || 30; if (vals.length < 2) return ''; const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = mx - mn || 1; return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><polyline fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="' + vals.map((v, i) => (i * w / (vals.length - 1)).toFixed(1) + ',' + (h - 3 - ((v - mn) / rg) * (h - 6)).toFixed(1)).join(' ') + '"/></svg>'; };
  const hbar = (n, v, p, cls, x) => '<div class="hbar ' + (cls || '') + '"><span class="hn">' + esc(APP.tn(n)) + '</span><span class="ht"><i style="width:' + Math.max(3, Math.round(p * 100)) + '%"></i></span><b>' + v + '</b>' + (x !== undefined ? '<span class="hx">' + x + '</span>' : '') + '</div>';
  const rows = (list, cls, fmt) => { if (!list.length) return '<p class="muted small" style="margin:0">Aún sin datos.</p>'; const mx = Math.max.apply(null, list.map((r) => r.n)) || 1; return list.map((r) => hbar(r.key, r.n, r.n / mx, cls, fmt ? fmt(r) : undefined)).join(''); };
  const vs = (a, b, la, lb) => '<div class="vsb"><div class="vl"><span><b class="g">' + a + '</b> ' + la + '</span><span>' + lb + ' <b class="r">' + b + '</b></span></div><div class="vt"><i class="g" style="flex:' + Math.max(a, 0.001) + '"></i><i class="r" style="flex:' + Math.max(b, 0.001) + '"></i></div></div>';
  const insight = (t) => '<div class="insight"><b class="k">COACH</b> · ' + t + '</div>';
  const card = (inner, x) => '<div class="card"' + (x ? ' style="' + x + '"' : '') + '>' + inner + '</div>';
  const ct = (t, c) => '<div class="ct ' + (c || '') + '">' + t + '</div>';
  const pill = (t, c) => '<span class="pill ' + (c || '') + '">' + t + '</span>';
  const empty = (t) => '<div class="empty" style="padding:14px 6px">' + t + '</div>';

  // =====================================================================
  // OBJETIVOS  (día · semana · mes · con contador o Sí/No)
  // =====================================================================
  const appliesOn = (g, d) => g.period === 'day' && (g.repeat ? wdIdx(d) === g.dow && d >= (g.created || '0000') : d === g.date);
  const rangeOf = (g, ref) => (g.period === 'day' ? { from: ref, to: ref } : g.period === 'month' ? ST.monthRange(ref.slice(0, 7)) : { from: ST.weekStart(ref), to: ST.addDays(ST.weekStart(ref), 6) });
  const prevRef = (g, ref) => (g.period === 'month' ? ST.prevMonth(ref.slice(0, 7)) + '-01' : g.period === 'day' ? ST.addDays(ref, -7) : ST.addDays(ST.weekStart(ref), -7));
  const defTarget = (period) => { const w = (S.profile && Number(S.profile.weeklyTarget)) || Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length || 3; return period === 'month' ? w * 4 : w; };
  function gp(g, ref) {
    const r = rangeOf(g, ref || today());
    const ss = S.sessions.filter((s) => s.date >= r.from && s.date <= r.to && s.goalChecks && s.goalChecks[g.id] !== undefined);
    let score = 0; let marks = [];
    if (g.kind === 'count') ss.forEach((s) => { score += Number((s.goalCounts || {})[g.id]) || 0; });
    else { marks = ss.map((s) => s.goalChecks[g.id]); score = marks.reduce((a, m) => a + (m === 'si' ? 1 : m === 'medias' ? 0.5 : 0), 0); }
    const target = g.kind === 'count' ? Number(g.target) || 0 : g.period === 'day' ? 1 : Number(g.target) || 0;
    return { score, target, pct: target ? Math.min(100, Math.round((score / target) * 100)) : 0, asked: ss.length, marks, range: r, done: target > 0 && score >= target };
  }
  APP.goalProgress2 = gp; APP.hm = hm; APP.gymInfo = () => gymInfo(); APP.goalsOn = (d) => goalsOn(d); APP.goalsOfPeriod = (x) => goalsOfPeriod(x);
  const activeGoals = () => S.goals.filter((g) => !g.done);
  const goalsOn = (d) => activeGoals().filter((g) => appliesOn(g, d));
  const goalsOfPeriod = (p) => activeGoals().filter((g) => (g.period || 'week') === p);
  const perLabel = { day: 'Hoy', week: 'Semana', month: 'Mes' };
  function goalRow(g, ref) {
    const p = gp(g, ref); const isCount = g.kind === 'count'; const past = g.period === 'day' && ref < today();
    let right;
    if (g.period === 'day' && !isCount) right = p.done ? pill('✓ Cumplido', 'ok') : p.asked ? pill(p.marks[0] === 'medias' ? 'A medias' : 'No cumplido', 'bad') : pill(past ? 'Sin valorar' : 'Pendiente');
    else right = '<span class="ob2"><b>' + fmtN(p.score) + (p.target ? '/' + p.target : '') + '</b><span class="pbar"><i class="' + (p.done ? '' : p.pct < 35 ? 'am' : '') + '" style="width:' + p.pct + '%"></i></span></span>';
    const sub = isCount ? 'Contador' + (g.period === 'day' ? '' : ' · se suma al registrar') : g.period === 'day' ? (g.repeat ? 'Cada ' + DLONG[g.dow] : 'Sí / No') : 'Sí / No · en ' + (g.target || '–') + ' entrenos';
    return '<button class="obj" data-act="goalOpen" data-id="' + g.id + '"><span class="ob"><b>' + esc(g.text) + '</b><span>' + sub + '</span></span>' + right + '</button>';
  }
  function goalForm(g) {
    g = g || {}; const per = g.period || ui.newGoalPeriod || 'week'; const kind = g.kind || 'yn'; const dow = g.dow !== undefined ? g.dow : wdIdx(g.date || today());
    APP.openSheet(g.id ? 'Editar objetivo' : 'Nuevo objetivo',
      group('¿Para cuándo?', '<div class="chips" data-group="gper" data-onchange="gfChange">' + [['day', 'Un día'], ['week', 'Semana'], ['month', 'Mes']].map((x) => '<button type="button" class="chip' + (per === x[0] ? ' on' : '') + '" data-val="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>') +
      field('¿Qué quieres conseguir?', '<input id="g-text" list="dl-tech" autocomplete="off" placeholder="Ej.: llegar a media guardia · hacer raspados" value="' + esc(g.text || '') + '">') +
      group('¿Cómo se mide?', '<div class="chips" data-group="gkind" data-onchange="gfChange">' + [['count', 'Contador (X veces)'], ['yn', 'Sí / No']].map((x) => '<button type="button" class="chip' + (kind === x[0] ? ' on' : '') + '" data-val="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>') +
      '<div id="g-meta-wrap">' + field('<span id="g-meta-l">Meta</span>', '<input type="number" id="g-target" inputmode="numeric" min="1" max="200" value="' + (g.target || (kind === 'count' ? 5 : defTarget(per))) + '">') + '</div>' +
      '<div id="g-day-wrap">' + group('Día de la semana', '<div class="chips" data-group="gdow">' + DL.map((l, i) => '<button type="button" class="chip sm' + (dow === i ? ' on' : '') + '" data-val="' + i + '">' + l + '</button>').join('') + '</div>') +
      '<div class="chips" style="margin-bottom:12px" data-group="grep" data-multi="1"><button type="button" class="chip sm' + (g.repeat ? ' on' : '') + '" data-val="1">Repetir cada semana</button></div></div>' +
      '<p class="small muted">Al registrar cada entreno te preguntaré si lo has cumplido y el avance se actualiza solo.</p>' +
      '<button class="btn block" data-act="saveGoal" data-id="' + (g.id || '') + '">Guardar objetivo</button>');
    A.gfChange();
  }
  A.gfChange = () => {
    const per = APP.sel('gper')[0] || 'week', kind = APP.sel('gkind')[0] || 'yn';
    const dw = $('#g-day-wrap'), mw = $('#g-meta-wrap'), ml = $('#g-meta-l'); if (!dw) return;
    dw.hidden = per !== 'day'; mw.hidden = per === 'day' && kind === 'yn';
    ml.textContent = kind === 'count' ? (per === 'day' ? 'Meta de hoy (veces)' : 'Meta total (veces)') : '¿En cuántos entrenos quieres conseguirlo?';
    const ti = $('#g-target'); if (ti && !ti.dataset.touched) { if (kind === 'yn' && per !== 'day') ti.value = defTarget(per); }
  };
  A.addGoal = () => goalForm();
  A.goalEdit = (el) => goalForm(S.goals.find((x) => x.id === el.dataset.id));
  A.saveGoal = async (el) => {
    const text = val('g-text').trim(); if (!text) return APP.toast('Escribe el objetivo');
    const old = S.goals.find((x) => x.id === (el && el.dataset.id)) || {};
    const period = APP.sel('gper')[0] || 'week', kind = APP.sel('gkind')[0] || 'yn'; const dow = Number(APP.sel('gdow')[0]); const repeat = APP.sel('grep').length > 0;
    const target = period === 'day' && kind === 'yn' ? 1 : Math.max(1, Number(val('g-target')) || 1);
    const g = Object.assign({}, old, { id: old.id || uid(), text, period, kind, target, done: old.done || false, created: old.created || today() });
    if (period === 'day') { g.dow = isNaN(dow) ? wdIdx(today()) : dow; g.repeat = repeat; g.date = old.date && old.dow === g.dow ? old.date : nextDate(g.dow); } else { delete g.date; delete g.dow; delete g.repeat; }
    await APP.saveGoal(g); APP.closeSheet(); rk(); APP.toast('Objetivo guardado');
  };
  A.goalOpen = (el) => {
    const g = S.goals.find((x) => x.id === el.dataset.id); if (!g) return; const hist = []; let ref = today();
    const n = g.period === 'day' ? 5 : 6;
    for (let i = 0; i < n; i++) { const p = gp(g, ref); hist.unshift({ p, label: g.period === 'month' ? ST.parse(p.range.from).toLocaleDateString('es-ES', { month: 'short' }) : ST.parse(p.range.from).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) }); ref = prevRef(g, ref); }
    const cur = gp(g, g.period === 'day' && g.date && !g.repeat ? g.date : today()); const mx = Math.max.apply(null, hist.map((h) => Math.max(h.p.score, h.p.target || 0))) || 1;
    APP.openSheet(g.text, '<div class="row" style="margin-bottom:12px">' + mring(cur.pct / 100, cur.done ? 'var(--gold)' : 'var(--green)', fmtN(cur.score) + (cur.target ? '/' + cur.target : ''), 72) + '<div><b>' + (g.period === 'day' ? (g.repeat ? 'Cada ' + DLONG[g.dow] : fmtDate(g.date)) : g.period === 'month' ? 'Este mes' : 'Esta semana') + '</b><div class="muted small">' + (g.kind === 'count' ? 'Contador · meta ' + g.target : 'Sí / No') + ' · ' + cur.asked + ' entrenos valorados</div></div></div>' +
      (g.period === 'day' && !g.repeat ? '' : '<div class="sect" style="margin-top:4px">Historial</div><div class="ghist">' + hist.map((h) => '<div class="gcol"><span class="gv">' + (h.p.asked ? fmtN(h.p.score) : '–') + '</span><div class="gbar"><div style="height:' + Math.round((h.p.score / mx) * 100) + '%" class="' + (h.p.done ? 'ok' : '') + '"></div></div><span class="gl">' + h.label + '</span></div>').join('') + '</div>') +
      '<div class="stack" style="margin-top:14px"><button class="btn secondary block" data-act="goalEdit" data-id="' + g.id + '">Editar</button><button class="btn block" data-act="goalDone" data-id="' + g.id + '">Dar por completado y archivar</button><button class="btn ghost block" data-act="goalDel" data-id="' + g.id + '">Borrar</button></div>');
  };

  // =====================================================================
  // INICIO
  // =====================================================================
  const gymInfo = () => {
    const g = S.gym; const logs = (APP.gym && APP.gym.weekLogs) ? APP.gym.weekLogs() : [];
    const r = g && g.routines ? g.routines.find((x) => x.id === g.active) : null; const target = r ? r.days.length : 0;
    const vol = logs.reduce((a, l) => a + (APP.gym.volume ? APP.gym.volume(l) : 0), 0); const min = logs.reduce((a, l) => a + (Number(l.duration) || 0), 0);
    return { n: logs.length, target, vol, min };
  };
  function weekStrip(ws) {
    const t = today();
    return '<div class="wk2">' + DL.map((l, i) => { const d = ST.addDays(ws, i); const b = S.sessions.some((s) => s.date === d); const gy = ((S.gym && S.gym.logs) || []).some((x) => x.date === d); return '<button class="' + (d === t ? 'today' : '') + '" data-act="dayPeek" data-d="' + d + '">' + l + '<span class="dots"><i class="' + (b ? 'b' : '') + '"></i><i class="' + (gy ? 'g' : '') + '"></i></span></button>'; }).join('') + '</div>';
  }
  V.inicio = () => {
    const p = S.profile; const t = today(); const ws = ST.weekStart(t); const we = ST.addDays(ws, 6);
    const weekS = S.sessions.filter((s) => s.date >= ws && s.date <= we); const minutes = weekS.reduce((a, s) => a + (Number(s.duration) || 0), 0);
    const target = p && Number(p.weeklyTarget) ? Number(p.weeklyTarget) : (Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length || 0);
    const weekR = S.rounds.filter((r) => r.date >= ws && r.date <= we); const rep = ST.report(weekR, {});
    let h = '';
    // 1. Hoy
    const doneToday = S.sessions.filter((s) => s.date === t);
    const nx = APP.plan ? APP.plan.next() : null; const dayGoals = goalsOn(nx && nx.inDays ? nx.date : t);
    if (nx && !(doneToday.length && nx.inDays === 0)) {
      const when = nx.inDays === 0 ? 'HOY' : nx.inDays === 1 ? 'MAÑANA' : fmtDate(nx.date).toUpperCase();
      h += '<div class="today2"><div><div class="eb">' + when + (nx.start ? ' · ' + nx.start : '') + '</div><div class="tt">BJJ · ' + esc(nx.focus || 'Entrenamiento') + '</div><div class="st">' + (dayGoals.length ? '🎯 ' + esc(dayGoals[0].text) : 'Sin objetivo para este día') + '</div></div><button class="go" data-act="' + (nx.inDays === 0 ? 'regPlanned' : 'newSession') + '" data-key="' + nx.key + '" data-d="' + nx.date + '">' + (nx.inDays === 0 ? 'EMPEZAR →' : 'VER') + '</button></div>';
    } else if (doneToday.length) h += '<div class="today2"><div><div class="eb">HOY</div><div class="tt">Entreno registrado ✓</div><div class="st">' + esc(doneToday[0].type || 'Entrenamiento') + (doneToday[0].duration ? ' · ' + doneToday[0].duration + ' min' : '') + '</div></div><button class="go" data-act="newSession">OTRO +</button></div>';
    else h += '<div class="today2"><div><div class="eb">HOY</div><div class="tt">¿Has entrenado?</div><div class="st">' + (dayGoals.length ? '🎯 ' + esc(dayGoals[0].text) : 'Registra tu entreno en un minuto') + '</div></div><button class="go" data-act="newSession">REGISTRAR →</button></div>';
    // 2. BJJ y Gym de la semana
    const gy = gymInfo();
    h += '<div class="sect" style="margin-top:2px">Esta semana</div><div class="pair"><a class="pcard bjj" href="#/entrenos"><div class="pl"><i></i>JIU-JITSU</div><div class="pb">' + mring(target ? Math.min(1, weekS.length / target) : (weekS.length ? 1 : 0), 'var(--green)', weekS.length + (target ? '/' + target : ''), 56) + '<div class="pt"><b>' + hm(minutes) + '</b><br>' + weekR.length + ' rounds' + (rep.subs.efficacy.total ? '<br>' + rep.subs.efficacy.pct + '% subm.' : '') + '</div></div></a>' +
      '<a class="pcard gy" href="#/gym"><div class="pl"><i></i>GYM</div><div class="pb">' + mring(gy.target ? Math.min(1, gy.n / gy.target) : (gy.n ? 1 : 0), 'var(--gym)', gy.n + (gy.target ? '/' + gy.target : ''), 56) + '<div class="pt"><b>' + (gy.vol ? (Math.round(gy.vol / 100) / 10).toLocaleString('es-ES') + ' t' : gy.min ? hm(gy.min) : '–') + '</b><br>' + (gy.vol ? 'volumen' : gy.target ? 'sin sesiones aún' : 'crea tu rutina') + (gy.min && gy.vol ? '<br>' + hm(gy.min) : '') + '</div></div></a></div>';
    h += weekStrip(ws);
    // racha
    const need = target || 1; let streak = 0; let w = ws; const inWeek = (a) => S.sessions.filter((x) => x.date >= a && x.date <= ST.addDays(a, 6)).length;
    if (inWeek(w) >= need) streak++; w = ST.addDays(w, -7); while (inWeek(w) >= need && streak < 520) { streak++; w = ST.addDays(w, -7); }
    h += '<div class="leg"><span><b class="b">●</b> Jiu-jitsu &nbsp;<b class="g">●</b> Gym</span><span>' + (streak ? '🔥 <b style="color:var(--ink)">' + streak + (streak === 1 ? ' semana' : ' semanas') + '</b> seguidas' : 'Racha: empieza esta semana') + '</span></div>';
    // 3. Nutrición, agua, peso
    if (APP.nutri) {
      const tg = APP.nutri.targets(t); const tot = APP.nutri.dayTotal(t); const wt = APP.nutri.waterTarget(t); const gl = APP.nutri.glassMl(); const wc = APP.nutri.waterCount(t); const ml = wc * gl;
      const wts = APP.gym && APP.gym.weights ? APP.gym.weights() : []; const lastW = wts[wts.length - 1]; const tr = APP.gym && APP.gym.weightTrend ? APP.gym.weightTrend() : null;
      h += '<div class="tl3"><a href="#/nutri"><span class="tk" style="color:var(--gold)">NUTRICIÓN</span><span class="tvis">' + (tg ? mring(Math.min(1, tot.k / tg.kcal), 'var(--gold)', Math.round(Math.min(999, (tot.k / tg.kcal) * 100)) + '%', 46) : '<span style="font-size:22px">🍎</span>') + '</span><span class="tv">' + (tg ? Math.round(tot.k).toLocaleString('es-ES') + ' kcal' : 'Calcula tu objetivo') + '</span><span class="ts">' + (tg ? 'de ' + tg.kcal.toLocaleString('es-ES') : 'objetivo') + '</span></a>' +
        '<a href="#/nutri"><span class="tk" style="color:var(--blue)">AGUA</span><span class="tvis">' + mring(Math.min(1, ml / wt.ml), 'var(--blue)', String(wc), 46) + '</span><span class="tv">' + (Math.round(ml / 10) / 100).toLocaleString('es-ES') + ' L</span><span class="ts">de ' + (Math.round(wt.ml / 10) / 100).toLocaleString('es-ES') + ' L</span></a>' +
        '<a href="#/gym/peso"><span class="tk" style="color:var(--green)">PESO</span><span class="tvis">' + (wts.length > 1 ? spark(wts.slice(-8).map((x) => x.kg), 'var(--green)', 64, 32) : '<span style="font-size:22px">⚖️</span>') + '</span><span class="tv">' + (lastW ? String(lastW.kg).replace('.', ',') + ' kg' : '–') + '</span><span class="ts">' + (tr ? (tr.diff > 0 ? '↑ ' : '↓ ') + Math.abs(Math.round(tr.diff * 10) / 10).toString().replace('.', ',') + ' en 7 d' : 'añade tu peso') + '</span></a></div>';
    }
    // 4. Objetivos
    const wk = goalsOfPeriod('week'); const dg = goalsOn(t);
    const showG = dg.concat(wk).slice(0, 4); const all = dg.concat(wk, goalsOfPeriod('month')); const okN = all.filter((g) => gp(g, t).done).length;
    h += card('<div class="row between"><div class="ct" style="margin:0">Mis objetivos</div>' + (all.length ? '<span class="pill ok">' + okN + ' de ' + all.length + ' cumplidos</span>' : '') + '</div>' +
      (showG.length ? showG.map((g) => goalRow(g, t)).join('') + '<a href="#/entrenos" style="display:block;text-align:center;font-size:12px;font-weight:700;margin-top:6px">Ver todos ›</a>' : '<p class="muted small" style="margin:6px 0 10px">Ponte objetivos para hoy, la semana o el mes. Al registrar cada entreno marcarás si los has cumplido.</p><button class="btn secondary block" data-act="addGoal">+ Nuevo objetivo</button>'), 'padding:10px 14px');
    if (APP.plan) h += APP.plan.banner();
    if (!(p && p.done)) h += '<div class="card today-card"><h3>Personaliza la app</h3><p class="muted" style="margin:0 0 10px">4 pantallas cortas sobre tu jiu-jitsu.</p><button class="btn block" data-act="interview">Empezar</button></div>';
    // 5. Coach
    const insights = ST.coach({ sessions: S.sessions, rounds: S.rounds, goals: S.goals }, t); const rec = insights.find((i) => i.type === 'recomendacion');
    if (rec && S.sessions.length) h += insight(esc(rec.text) + ' <a href="#/coach">Ver más</a>');
    // 6. Constancia
    if (S.sessions.length) { const counts = {}; S.sessions.forEach((x) => { counts[x.date] = (counts[x.date] || 0) + 1; }); const hours = Math.round(S.sessions.reduce((a, x) => a + (Number(x.duration) || 0), 0) / 60);
      h += card('<div class="row between"><div class="ct" style="margin:0">Constancia · 16 semanas</div><span class="pill">' + hours + ' h · ' + S.sessions.length + ' entrenos</span></div><div style="margin-top:10px">' + APP.heat(counts, 16) + '</div>'); }
    // 7. Técnicas más trabajadas
    const top = ST.tally(S.sessions.filter((x) => x.date >= ST.addDays(t, -29)).reduce((a, x) => a.concat(ST.splitTags(x.techniques)), []), (x) => x).slice(0, 5);
    if (top.length) h += card('<div class="row between"><div class="ct" style="margin:0">Técnicas más trabajadas</div><span class="pill">30 días</span></div>' + APP.rank(top, { fmt: (r) => r.n + (r.n === 1 ? ' sesión' : ' sesiones') }));
    return h;
  };

  // =====================================================================
  // PANEL BJJ
  // =====================================================================
  ui.objTab = 'week'; APP.ui.allSessions = APP.ui.allSessions || false;
  A.objTab = (el) => { ui.objTab = el.dataset.v; rk(); };
  function sessRow(s) {
    const nr = S.rounds.filter((r) => r.sessionId === s.id).length; const f = s.feel && s.feel.mood ? FACES[s.feel.mood - 1] : '';
    const gc = s.goalChecks ? Object.keys(s.goalChecks).filter((k) => S.goals.some((g) => g.id === k)).map((k) => s.goalChecks[k]) : [];
    return '<a class="item" href="#/entreno/' + s.id + '" data-close style="text-decoration:none;color:inherit"><span class="datebox"><b>' + ST.parse(s.date).getDate() + '</b>' + ST.parse(s.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '') + '</span><div style="flex:1;min-width:0"><div class="title">' + esc(s.type || 'Entrenamiento') + ' ' + (s.mode ? '<span class="tag">' + modeLabel(s.mode) + '</span>' : '') + '</div><div class="pill-n">' + [s.duration ? s.duration + ' min' : '', nr ? nr + ' rounds' : '', (s.techniques || []).slice(0, 2).map(APP.tn).join(', ')].filter(Boolean).join(' · ') + '</div>' + (gc.length ? '<span class="marks">' + gc.map((m) => '<i class="m-' + m + '">' + ({ si: '✓', medias: '½', no: '✕' }[m] || '·') + '</i>').join('') + '</span>' : '') + '</div>' + (f ? '<span style="font-size:20px">' + f + '</span>' : '') + '<span class="muted">›</span></a>';
  }
  A.sessionsAll = () => { ui.allSessions = !ui.allSessions; rk(); };
  V.entrenos = () => {
    const t = today(); const rep = ST.report(S.rounds, {}); const hours = Math.round(S.sessions.reduce((a, x) => a + (Number(x.duration) || 0), 0) / 60);
    let h = '<div class="ttl"><h2>BJJ<small>Tus objetivos y tu progreso</small></h2></div>';
    h += card('<div class="gstrip"><div><b>' + S.sessions.length + '</b><span>entrenos</span></div><div><b>' + S.rounds.length + '</b><span>rounds</span></div><div><b>' + hours + ' h</b><span>tatami</span></div><div><b>' + (rep.subs.efficacy.total ? rep.subs.efficacy.pct + '%' : '–') + '</b><span>subm.</span></div><a href="#/stats" style="align-self:center;font-size:12px;font-weight:800;text-decoration:none">Más ›</a></div>', 'padding:11px 14px');
    const tab = ui.objTab || 'week';
    h += '<div class="segt">' + [['day', 'Hoy'], ['week', 'Semana'], ['month', 'Mes']].map((x) => '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="objTab" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    const list = tab === 'day' ? goalsOn(t) : goalsOfPeriod(tab); const okN = list.filter((g) => gp(g, t).done).length;
    const wkDay = tab === 'week' ? activeGoals().filter((g) => g.period === 'day' && !g.repeat && g.date >= ST.weekStart(t) && g.date <= ST.addDays(ST.weekStart(t), 6) && g.date !== t) : [];
    const title = tab === 'day' ? fmtDate(t) : tab === 'week' ? 'Semana ' + ST.parse(ST.weekStart(t)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' – ' + ST.parse(ST.addDays(ST.weekStart(t), 6)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ST.parse(t).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    h += card((list.length ? '<div class="row" style="margin-bottom:6px">' + mring(list.length ? okN / list.length : 0, 'var(--green)', okN + '/' + list.length, 52) + '<div><b style="text-transform:capitalize">' + title + '</b><div class="muted small">' + okN + ' cumplidos · ' + (list.length - okN) + ' pendientes</div></div></div>' + list.map((g) => goalRow(g, t)).join('') : '<p class="muted" style="margin:2px 0 10px"><b style="text-transform:capitalize;color:var(--ink)">' + title + '</b><br>' + (tab === 'day' ? 'No tienes objetivo para hoy.' : tab === 'week' ? 'Aún no tienes objetivos semanales.' : 'Aún no tienes objetivos mensuales.') + '</p>') +
      (wkDay.length ? '<div class="sect">Otros días de esta semana</div>' + wkDay.map((g) => goalRow(g, g.date)).join('') : '') +
      '<button class="btn secondary block" style="margin-top:10px" data-act="newGoalIn" data-p="' + tab + '">+ Nuevo objetivo</button>' + (activeGoals().length === 0 ? '<button class="btn ghost block" style="margin-top:8px" data-act="suggest">Sugerir según mis datos</button>' : ''), 'padding:12px 14px');
    // historial de cumplimiento (semanas)
    const wg = goalsOfPeriod('week'); if (wg.length && tab === 'week') { const bars = []; let ref = t; for (let i = 0; i < 5; i++) { const ps = wg.map((g) => gp(g, ref)).filter((p) => p.target && p.asked); bars.unshift({ v: ps.length ? Math.round(ps.reduce((a, p) => a + p.pct, 0) / ps.length) : 0, ok: ps.length > 0 }); ref = ST.addDays(ST.weekStart(ref), -7); }
      h += card(ct('Cumplimiento · últimas 5 semanas') + '<div style="display:flex;gap:8px;align-items:flex-end;height:60px">' + bars.map((b, i) => '<div style="flex:1;text-align:center"><div style="height:' + Math.max(3, b.v * 0.4) + 'px;border-radius:5px;background:' + (i === 4 ? 'var(--green)' : 'color-mix(in srgb,var(--green) 45%,var(--surface-2))') + '"></div><div style="font-size:9px;color:var(--muted);margin-top:3px">' + (b.ok ? b.v + '%' : '–') + '</div></div>').join('') + '</div>', 'padding:11px 14px'); }
    h += '<button class="btn block" style="margin-bottom:12px" data-act="newSession">+ Registrar entreno</button>';
    const tile = (href, ico, name) => '<a href="' + href + '"><span style="font-size:20px">' + ico + '</span><span class="tv" style="font-size:12px">' + name + '</span></a>';
    h += '<a class="card" href="#/estudio" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;margin-bottom:8px"><span style="font-size:24px">🎓</span><span style="flex:1"><b>Estudio</b><br><span class="small muted">Técnicas con vídeo y apuntes · ' + (S.study || []).length + '</span></span><span class="muted">›</span></a>';
    h += '<div class="tl3">' + tile('#/juego', '🥋', 'Mi juego') + tile('#/arbol', '🌳', 'Game plan') + tile('#/apuntes', '📝', 'Apuntes (' + S.notes.length + ')') + tile('#/stats', '📊', 'Estadísticas') + tile('#/plan', '📅', 'Plan') + tile('#/biblio', '📚', 'Técnicas') + '</div>';
    if (APP.plan) { const pend = APP.plan.pending(); if (pend.length) h += APP.plan.banner(); }
    const all = ui.allSessions; const ls = all ? S.sessions : S.sessions.slice(0, 5);
    h += card('<div class="row between"><div class="ct" style="margin:0">Últimas sesiones</div><span class="pill">' + S.sessions.length + '</span></div>' + (S.sessions.length ? '<div class="list">' + ls.map(sessRow).join('') + '</div>' + (S.sessions.length > 5 ? '<button class="btn ghost block" style="margin-top:8px" data-act="sessionsAll">' + (all ? 'Ver menos' : 'Ver las ' + S.sessions.length) + '</button>' : '') : '<div class="empty">Registrar un entreno lleva menos de un minuto.</div>'), 'padding:8px 14px');
    const orphans = S.rounds.filter((r) => !r.sessionId).sort((a, b) => b.date.localeCompare(a.date));
    if (orphans.length) h += '<details class="card acc" data-acc="orph"' + (ui.acc && ui.acc.orph ? ' open' : '') + '><summary><h3>Rounds sueltos</h3><span class="pill-n">' + orphans.length + '</span></summary><div class="list">' + orphans.map((r) => '<div class="item"><div><div class="title">' + (r.partner ? esc(r.partner) : 'Round') + '</div><div class="pill-n">' + fmtDate(r.date) + (r.duration ? ' · ' + mmss(r.duration) : '') + ' · ' + (r.events || []).length + ' acontecimientos</div></div><button class="btn small secondary" data-act="editRound" data-id="' + r.id + '">Editar</button></div>').join('') + '</div></details>';
    h += '<div class="chips" style="justify-content:center;margin-top:4px"><button class="chip sm" data-act="newRound">+ Round suelto</button><a class="chip sm" href="#/coach">💬 Entrenador</a><a class="chip sm" href="#/informe">Informe semanal</a><a class="chip sm" href="#/mensual">Informe mensual</a></div>';
    return h;
  };
  A.newGoalIn = (el) => { ui.newGoalPeriod = el.dataset.p === 'day' ? 'day' : el.dataset.p === 'month' ? 'month' : 'week'; goalForm(); };

  // =====================================================================
  // REGISTRO DE ENTRENO POR PASOS
  // =====================================================================
  const splitHow = (s) => String(s || '').split(/\s*(?:,|;|\sy\s)\s*/i).map((x) => x.trim()).filter(Boolean);
  function goalsForReg(st) { return S.goals.filter((g) => (!g.done && (g.period !== 'day' || appliesOn(g, st.date))) || (st.id && (st.prevChecks || {})[g.id] !== undefined)); }

  function regInit(src) {
    src = src || {}; const last = S.sessions[0] || {}; const f = src.feel || {};
    const st = {
      id: src.id || '', date: src.date || today(), time: src.time || nowTime(), duration: Number(src.duration) || Number(last.duration) || 90,
      type: src.type || last.type || TYPES[0], mode: src.mode || last.mode || defaultMode(), mood: f.mood || 0, effort: f.effort || 0, cardio: f.cardio || 0, energy: f.energy || 0, flags: (f.flags || []).slice(),
      goals: {}, counts: {}, prevChecks: src.goalChecks || {}, worked: [], hard: (src.review && src.review.hard) || '', good: (src.review && src.review.good) || '', notes: src.notes || '',
      step: 1, rounds: [], removed: [], legacy: [], tech: -1, objective: src.objective || '', src
    };
    const w = src.worked && src.worked.length ? src.worked : (src.techniques || []).map((n) => ({ name: n }));
    st.worked = w.map((x) => ({ name: x.name, rating: x.rating || '', explain: x.explain || '', flaw: x.flaw || '', toNotes: x.toNotes !== undefined ? x.toNotes : true }));
    Object.keys(st.prevChecks).forEach((k) => { st.goals[k] = st.prevChecks[k]; st.counts[k] = (src.goalCounts || {})[k] || 0; });
    if (src.id) S.rounds.filter((r) => r.sessionId === src.id).forEach((r) => { if (r.form) st.rounds.push(JSON.parse(JSON.stringify(r))); else st.legacy.push(r); });
    return st;
  }
  function regOpen(src) { if (src && src.target) src = null; ui.reg = regInit(src); regRender(); }
  APP.sessionForm = regOpen;
  const head = (n, t, tot) => '<div class="rsteps">' + Array.from({ length: tot || 3 }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div><div class="rhead"><b>' + t + '</b><span>' + (n > (tot || 3) ? 'Resumen' : 'Paso ' + n + ' de ' + (tot || 3)) + '</span></div>';
  const foot = (back, nextLabel, nextAct, extra) => '<div class="regfoot">' + (back ? '<button class="btn secondary" style="flex:0 0 auto;padding:14px 18px" data-act="' + back + '">‹</button>' : '') + '<button class="btn" data-act="' + nextAct + '"' + (extra || '') + '>' + nextLabel + '</button></div>';
  const stepper = (label, v, unit, dec, inc, id) => '<div class="stp2"><button data-act="' + dec + '" aria-label="Menos">−</button><div><div class="sl">' + label + '</div><div class="sv"><span id="' + id + '">' + v + '</span><small> ' + unit + '</small></div></div><button class="pl" data-act="' + inc + '" aria-label="Más">+</button></div>';
  function regRender() {
    const st = ui.reg; if (!st) return; let body = '';
    if (st.step === 1) body = step1(st); else if (st.step === 2) body = step2(st); else if (st.step === 3) body = step3(st); else if (st.step === 4) body = step4(st); else if (st.step === 'tech') body = stepTech(st);
    APP.openSheet(st.id ? 'Editar entreno' : 'Registrar entreno', body);
  }
  function step1(st) {
    return head(1, 'General') +
      '<div class="chips" data-group="rg-type" style="margin-bottom:10px">' + TYPES.map((t) => '<button type="button" class="chip sm' + (st.type === t ? ' on' : '') + '" data-val="' + esc(t) + '">' + t + '</button>').join('') + '</div>' +
      '<div class="chips" data-group="rg-mode" style="margin-bottom:10px">' + [['gi', 'GI'], ['nogi', 'NO-GI']].map((x) => '<button type="button" class="chip' + (st.mode === x[0] ? ' on' : '') + '" style="flex:1;justify-content:center" data-val="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="grid2">' + field('Fecha', '<input type="date" id="rg-date" value="' + st.date + '">') + field('Hora', '<input type="time" id="rg-time" value="' + st.time + '">') + '</div>' +
      '<div style="margin-bottom:12px">' + stepper('DURACIÓN', st.duration, 'min', 'rgDur" data-d="-15', 'rgDur" data-d="15', 'rg-dur').replace('data-act="rgDur" data-d="-15"', 'data-act="rgDur" data-d="-15"') + '</div>' +
      '<div class="sect" style="margin-top:4px">¿Cómo te sentiste?</div><div class="faces">' + FACES.map((f, i) => '<button class="' + (st.mood === i + 1 ? 'on' : '') + '" data-act="rgFace" data-v="' + (i + 1) + '">' + f + '</button>').join('') + '</div>' +
      '<div class="sect">Intensidad del entreno (1 suave · 5 a tope)</div><div class="nums effort">' + [1, 2, 3, 4, 5].map((i) => '<button class="' + (st.effort === i ? 'on' : '') + '" data-act="rgNum" data-k="effort" data-v="' + i + '">' + i + '</button>').join('') + '</div>' +
      (APP.recLine ? APP.recLine() : '') + '<div class="sect">Cardio (1 flojo · 5 sobrado)</div><div class="nums cardio">' + [1, 2, 3, 4, 5].map((i) => '<button class="' + (st.cardio === i ? 'on' : '') + '" data-act="rgNum" data-k="cardio" data-v="' + i + '">' + i + '</button>').join('') + '</div>' +
      '<div class="sect">Energía / descanso</div><div class="nums energy">' + [1, 2, 3, 4, 5].map((i) => '<button class="' + (st.energy === i ? 'on' : '') + '" data-act="rgNum" data-k="energy" data-v="' + i + '">' + i + '</button>').join('') + '</div>' +
      '<div class="chips" data-group="rg-flags" data-multi="1" style="margin-top:12px">' + ['Lesión / dolor', 'Dormí poco', 'Mucho estrés'].map((x) => '<button type="button" class="chip sm' + (st.flags.includes(x) ? ' on' : '') + '" data-val="' + x + '">+ ' + x + '</button>').join('') + '</div>' +
      foot(null, 'Siguiente: objetivos y técnicas →', 'rgNext');
  }
  A.rgDur = (el) => { const st = ui.reg; st.duration = Math.max(0, st.duration + Number(el.dataset.d)); const s = $('#rg-dur'); if (s) s.textContent = st.duration; };
  A.rgFace = (el) => { ui.reg.mood = Number(el.dataset.v); $$('.faces button').forEach((b) => b.classList.toggle('on', b === el)); };
  A.rgNum = (el) => { const k = el.dataset.k; ui.reg[k] = Number(el.dataset.v); $$('.nums.' + k + ' button').forEach((b) => b.classList.toggle('on', b === el)); };
  const ynBtns = (g, cur) => '<div class="ynr">' + [['si', '✓ Sí'], ['medias', 'Parcial'], ['no', 'No']].map((x) => '<button class="' + (cur === x[0] ? 'on ' + (x[0] === 'si' ? 'si' : x[0] === 'medias' ? 'me' : 'no') : '') + '" data-act="rgGoal" data-id="' + g.id + '" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
  function goalBlocks(st) {
    const gs = goalsForReg(st); if (!gs.length) return '';
    return card(ct('Objetivos') + gs.map((g) => {
      const k = g.period === 'day' ? 'd' : g.period === 'month' ? 'm' : 'w'; const p = gp(g, st.date); const before = g.kind === 'count' && st.prevChecks[g.id] !== undefined ? 0 : 0;
      if (g.kind === 'count') { const n = st.counts[g.id] || 0; const prev = p.score - (st.id && (st.src.goalCounts || {})[g.id] ? Number(st.src.goalCounts[g.id]) : 0); return '<div class="gblk"><div class="gk ' + k + '">' + perLabel[g.period].toUpperCase() + '</div><div class="gtr"><div><div class="gt2" style="margin:2px 0">' + esc(g.text) + '</div><div class="muted small">Llevas ' + fmtN(Math.max(0, prev)) + ' → con hoy <b id="gc-t-' + g.id + '">' + fmtN(Math.max(0, prev) + n) + '</b>' + (g.target ? '/' + g.target : '') + '</div></div><span class="stpsm"><button data-act="rgCount" data-id="' + g.id + '" data-d="-1" data-p="' + prev + '">−</button><b id="gc-' + g.id + '">' + n + '</b><button class="pl" data-act="rgCount" data-id="' + g.id + '" data-d="1" data-p="' + prev + '">+</button></span></div></div>'; }
      return '<div class="gblk"><div class="gk ' + k + '">' + perLabel[g.period].toUpperCase() + '</div><div class="gt2">' + esc(g.text) + '</div>' + ynBtns(g, st.goals[g.id]) + '</div>';
    }).join('') + '<button class="btn ghost small" style="margin-top:8px" data-act="addGoal">+ Nuevo objetivo</button>', 'padding:10px 14px');
  }
  A.rgGoal = (el) => { const st = ui.reg; st.goals[el.dataset.id] = el.dataset.v; const box = el.parentElement; $$('button', box).forEach((b) => { b.className = b === el ? 'on ' + ({ si: 'si', medias: 'me', no: 'no' }[el.dataset.v]) : ''; }); };
  A.rgCount = (el) => { const st = ui.reg; const id = el.dataset.id; st.counts[id] = Math.max(0, (st.counts[id] || 0) + Number(el.dataset.d)); const a = $('#gc-' + id), b = $('#gc-t-' + id); if (a) a.textContent = st.counts[id]; if (b) b.textContent = fmtN(Number(el.dataset.p) + st.counts[id]); };
  function step2(st) {
    const tl = st.worked.length ? st.worked.map((w, i) => { const r = RATES[w.rating]; return '<button class="tch" data-act="rgTech" data-i="' + i + '"><span class="tn"><b>' + esc(APP.tn(w.name)) + '</b><span>' + (w.explain ? '📝 Con nota → Apuntes' : 'Toca para valorarla y explicarla') + '</span></span>' + (r ? pill(r[0] + ' ' + r[1], r[2]) : '<span class="muted">›</span>') + '</button>'; }).join('') : '<p class="muted small" style="margin:0 0 4px">Añade las técnicas que trabajaste hoy.</p>';
    return head(2, 'Objetivos y técnicas') + goalBlocks(st) + tdCard(st) +
      card('<div class="ct">Técnicas trabajadas</div>' + tl + '<div class="addrow"><input id="rg-tadd" list="dl-tech" autocomplete="off" placeholder="Ej.: Triángulo desde cerrada"><button class="btn small" data-act="rgTechAdd">Añadir</button></div>', 'padding:12px 14px') +
      field('Lo que más me costó hoy', '<textarea id="rg-hard" rows="2" placeholder="Opcional">' + esc(st.hard) + '</textarea>') + field('Lo que mejor me salió', '<textarea id="rg-good" rows="2" placeholder="Opcional">' + esc(st.good) + '</textarea>') +
      foot('rgBack', 'Siguiente: rounds →', 'rgNext');
  }
  // Técnica del día: explicación visible directamente en el paso 2 (va a Apuntes)
  function tdCard(st) {
    const i = Math.max(0, Math.min(st.td || 0, st.worked.length - 1)); const w = st.worked[i];
    if (!w) return card('<div class="ct" style="color:var(--gold)">🥋 TÉCNICA DEL DÍA</div><p class="muted small" style="margin:0 0 8px">¿Qué técnica trabajaste hoy? Explícala con tus palabras y se guarda en Apuntes.</p><div class="addrow"><input id="rg-tdadd" list="dl-tech" autocomplete="off" placeholder="Ej.: Pase torreando"><button class="btn small" data-act="rgTdAdd">Añadir</button></div>', 'padding:12px 14px;border-color:var(--gold)');
    return card('<div class="ct" style="color:var(--gold)">🥋 TÉCNICA DEL DÍA</div>' +
      (st.worked.length > 1 ? '<div class="chips" style="margin-bottom:8px">' + st.worked.map((x, k) => '<button type="button" class="chip sm' + (k === i ? ' on' : '') + '" data-act="rgTdPick" data-i="' + k + '">' + esc(APP.tn(x.name)) + '</button>').join('') + '</div>' : '<b>' + esc(APP.tn(w.name)) + '</b>') +
      '<textarea id="rg-td-expl" rows="4" style="margin-top:8px" placeholder="Explica la técnica como se la explicarías a un compañero: posición de partida, pasos, detalles clave…">' + esc(w.explain) + '</textarea>' +
      '<input id="rg-td-flaw" style="margin-top:8px" value="' + esc(w.flaw) + '" placeholder="Error o detalle que fallaste (opcional)">' +
      '<div class="togrow" style="margin-top:8px"><div><b>Guardar en Apuntes</b><small>Se crea una nota con esta explicación</small></div><button class="tgl' + (w.toNotes ? ' on' : '') + '" data-act="rgTdTgl" aria-label="Guardar en apuntes"></button></div>', 'padding:12px 14px;border-color:var(--gold)');
  }
  A.rgTdAdd = () => { collect(ui.reg); const c = APP.canon(val('rg-tdadd')); if (!c.name) return; const st = ui.reg; let k = st.worked.findIndex((w) => ST.norm(w.name) === ST.norm(c.name)); if (k < 0) { st.worked.push({ name: c.name, rating: '', explain: '', flaw: '', toNotes: true }); k = st.worked.length - 1; } st.td = k; regRender(); };
  A.rgTdPick = (el) => { collect(ui.reg); ui.reg.td = Number(el.dataset.i); regRender(); };
  A.rgTdTgl = (el) => { const st = ui.reg; const w = st.worked[Math.min(st.td || 0, st.worked.length - 1)]; w.toNotes = !w.toNotes; el.classList.toggle('on', w.toNotes); };
  A.rgTechAdd = () => { collect(ui.reg); const i = $('#rg-tadd'); const c = APP.canon(i ? i.value : ''); if (!c.name) return; const st = ui.reg; if (!st.worked.some((w) => ST.norm(w.name) === ST.norm(c.name))) st.worked.push({ name: c.name, rating: '', explain: '', flaw: '', toNotes: true }); regRender(); };
  A.rgTech = (el) => { collect(ui.reg); ui.reg.tech = Number(el.dataset.i); ui.reg.step = 'tech'; regRender(); };
  function stepTech(st) {
    const w = st.worked[st.tech]; if (!w) { st.step = 2; return step2(st); }
    const t = APP.findTech(w.name);
    return '<div class="rhead" style="margin-top:4px"><div><b>' + esc(APP.tn(w.name)) + '</b><div class="muted small">' + (t ? esc(APP.CATS[t.cat] || '') : 'Técnica propia') + '</div></div></div>' +
      '<div class="sect" style="margin-top:2px">¿Cómo te fue?</div><div class="chips" data-group="rg-rate" style="margin-bottom:12px">' + Object.keys(RATES).map((k) => '<button type="button" class="chip' + (w.rating === k ? ' on' : '') + '" style="flex:1;justify-content:center" data-val="' + k + '">' + RATES[k][0] + ' ' + RATES[k][1] + '</button>').join('') + '</div>' +
      field('Explícala con tus palabras', '<textarea id="rg-expl" rows="5" placeholder="Ej.: controlo la postura, subo la cadera, lanzo la pierna…">' + esc(w.explain) + '</textarea>') +
      field('Detalle que fallaste (opcional)', '<input id="rg-flaw" value="' + esc(w.flaw) + '" placeholder="Ej.: apreté antes de cerrar el ángulo">') +
      '<div class="togrow"><div><b>Guardar en Apuntes</b><small>Se crea una nota ligada a la técnica</small></div><button class="tgl' + (w.toNotes ? ' on' : '') + '" data-act="rgTgl" aria-label="Guardar en apuntes"></button></div>' +
      '<div class="regfoot"><button class="btn secondary" style="flex:0 0 auto;padding:14px 18px" data-act="rgTechDel">🗑</button><button class="btn" data-act="rgTechSave">Guardar técnica</button></div>';
  }
  A.rgTgl = (el) => { const w = ui.reg.worked[ui.reg.tech]; w.toNotes = !w.toNotes; el.classList.toggle('on', w.toNotes); };
  A.rgTechSave = () => { const st = ui.reg; const w = st.worked[st.tech]; w.rating = APP.sel('rg-rate')[0] || w.rating || ''; w.explain = val('rg-expl').trim(); w.flaw = val('rg-flaw').trim(); st.step = 2; regRender(); };
  A.rgTechDel = () => { const st = ui.reg; st.worked.splice(st.tech, 1); st.step = 2; regRender(); };
  // rounds dentro del registro
  const evCount = (r, kind, outcome) => (r.events || []).filter((e) => e.kind === kind && (!outcome || e.outcome === outcome)).length;
  function roundCard(r, i) {
    const tg = [];
    const pm = evCount(r, 'pass_made'), pr = evCount(r, 'pass_recv'), sm = evCount(r, 'sub_made', 'exito'), sr = evCount(r, 'sub_recv'), sw = evCount(r, 'sweep_made');
    if (pm) tg.push(pill('Pasé ×' + pm, 'ok')); if (pr) tg.push(pill('Me pasaron ×' + pr, 'bad')); if (sw) tg.push(pill('Raspados ×' + sw, 'ok')); if (sm) tg.push(pill('Finalicé ×' + sm, 'ok')); if (sr) tg.push(pill('Me finalizaron ×' + sr, 'bad'));
    if (!tg.length) tg.push(pill('Sin acontecimientos'));
    return '<button class="rcrd" data-act="rgRoundEdit" data-i="' + i + '"><div class="rt"><b>Round ' + (i + 1) + (r.partner ? ' · ' + esc(r.partner) : '') + '</b><span>' + mmss(r.duration || 0) + (r.mode ? ' · ' + modeLabel(r.mode) : '') + '</span></div><div class="rtg">' + tg.join('') + '</div></button>';
  }
  function totals(rs) { const c = (k, o) => rs.reduce((a, r) => a + evCount(r, k, o), 0); return { min: rs.reduce((a, r) => a + (Number(r.duration) || 0), 0), n: rs.length, pm: c('pass_made'), pr: c('pass_recv'), sm: c('sub_made', 'exito'), sr: c('sub_recv') }; }
  function step3(st) {
    const T = totals(st.rounds);
    return head(3, 'Rounds (rolas)') + (st.rounds.map(roundCard).join('') || '<p class="muted small">Aún no has añadido rounds. Si no hiciste sparring, sigue adelante.</p>') +
      st.legacy.map((r) => '<div class="rcrd" style="opacity:.7"><div class="rt"><b>' + esc(r.partner || 'Round') + '</b><span>registrado antes · se edita desde la sesión</span></div></div>').join('') +
      '<button class="addround" data-act="rgRoundNew">+ Añadir round</button>' +
      (st.rounds.length ? card(ct('Total de la sesión') + '<div class="totals">' + [[hm(T.min), 'tiempo'], [T.n, 'rounds'], [T.pm, 'pasé'], [T.pr, 'me pasan'], [T.sm, 'finalicé'], [T.sr, 'finalizado']].map((x) => '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>').join('') + '</div>', 'padding:10px 14px') : '') +
      foot('rgBack', 'Revisar y guardar →', 'rgNext');
  }
  function step4(st) {
    const T = totals(st.rounds); const gs = goalsForReg(st); const nNotes = st.worked.filter((w) => w.toNotes && (w.explain || w.flaw)).length;
    const okG = gs.map((g) => { if (g.kind === 'count') { const p = gp(g, st.date); const prev = p.score - ((st.src.goalCounts || {})[g.id] ? Number(st.src.goalCounts[g.id]) : 0); const tot = Math.max(0, prev) + (st.counts[g.id] || 0); return [g.text, fmtN(tot) + (g.target ? '/' + g.target : ''), g.target && tot >= g.target]; } const v = st.goals[g.id]; return [g.text, v === 'si' ? 'Sí' : v === 'medias' ? 'Parcial' : v === 'no' ? 'No' : 'Sin valorar', v === 'si']; });
    return head(4, 'Resumen del entreno') +
      '<div class="today2" style="margin-bottom:10px"><div><div class="eb">' + (modeLabel(st.mode) ? modeLabel(st.mode) + ' · ' : '') + esc(st.type.toUpperCase()) + ' · ' + st.duration + ' MIN</div><div class="tt">' + T.n + ' rounds · ' + hm(T.min) + '</div></div><div style="font-size:30px">' + (st.mood ? FACES[st.mood - 1] : '🥋') + '</div></div>' +
      '<div class="sumtiles"><div class="g"><b>' + T.pm + '</b><span>pases míos</span></div><div class="r"><b>' + T.pr + '</b><span>me pasan</span></div><div class="g"><b>' + T.sm + '</b><span>sumisión</span></div><div class="r"><b>' + T.sr + '</b><span>me finalizan</span></div></div>' +
      (okG.length ? card(ct('Objetivos') + okG.map((g, i) => '<div class="cnt"><span>' + esc(g[0]) + '</span>' + pill(g[2] ? '✓ ' + g[1] : g[1], g[2] ? 'ok' : 'warn') + '</div>').join(''), 'padding:8px 14px') : '') +
      card(ct('Sensaciones') + '<div class="row between" style="font-size:13px"><span>Ánimo ' + (st.mood ? FACES[st.mood - 1] : '–') + '</span><span>Intens. <b style="color:var(--orange)">' + (st.effort || '–') + '/5</b></span><span>Cardio <b style="color:var(--green)">' + (st.cardio || '–') + '/5</b></span><span>Energía <b style="color:var(--gold)">' + (st.energy || '–') + '/5</b></span></div>', 'padding:10px 14px') +
      card(ct('Se guardará en') + [['📓', 'Diario', '1 entrada'], ['📊', 'Estadísticas', 'posiciones, llaves, rivales'], ['📝', 'Apuntes', nNotes ? nNotes + (nNotes === 1 ? ' nota' : ' notas') + ' nuevas' : 'ninguna nota nueva'], ['🎯', 'Objetivos', gs.length ? 'se actualizan' : 'sin objetivos activos']].map((x) => '<div class="save2"><span>' + x[0] + '</span><b>' + x[1] + '</b><span>' + x[2] + '</span></div>').join(''), 'padding:6px 14px') +
      foot('rgBack', 'Guardar entreno', 'rgSave');
  }
  function collect(st) {
    if (!st) return; const dateEl = $('#rg-date');
    if (st.step === 1 && dateEl) { st.date = dateEl.value || st.date; st.time = val('rg-time') || st.time; st.type = APP.sel('rg-type')[0] || st.type; st.mode = APP.sel('rg-mode')[0] || ''; st.flags = APP.sel('rg-flags'); }
    if (st.step === 2 && $('#rg-hard')) { st.hard = val('rg-hard').trim(); st.good = val('rg-good').trim(); }
    if (st.step === 2 && $('#rg-td-expl')) { const w = st.worked[Math.min(st.td || 0, st.worked.length - 1)]; if (w) { w.explain = val('rg-td-expl').trim(); w.flaw = val('rg-td-flaw').trim(); } }
  }
  A.rgNext = () => { const st = ui.reg; collect(st); if (st.step < 4) st.step++; regRender(); };
  A.rgBack = () => { const st = ui.reg; collect(st); if (st.step > 1) st.step--; regRender(); };
  A.rgRoundNew = () => rdOpen(null, 'wizard');
  A.rgRoundEdit = (el) => rdOpen(ui.reg.rounds[Number(el.dataset.i)], 'wizard', Number(el.dataset.i));
  A.rgSave = async () => {
    const st = ui.reg; collect(st); const old = S.sessions.find((x) => x.id === st.id) || {};
    const gc = Object.assign({}, old.goalChecks), cn = Object.assign({}, old.goalCounts);
    goalsForReg(st).forEach((g) => { if (g.kind === 'count') { const n = st.counts[g.id] || 0; if (n > 0 || st.prevChecks[g.id] !== undefined) { cn[g.id] = n; gc[g.id] = n > 0 ? 'si' : 'no'; } } else if (st.goals[g.id]) gc[g.id] = st.goals[g.id]; });
    const names = uniq(st.worked.map((w) => APP.canon(w.name).name || w.name));
    const dayG = goalsOn(st.date)[0];
    const s = Object.assign({}, old, { id: old.id || uid(), date: st.date, time: st.time, duration: st.duration, type: st.type, mode: st.mode, techniques: names, positions: old.positions || [], objective: st.objective || (dayG ? dayG.text : old.objective || ''), notes: st.notes, goalChecks: gc, goalCounts: cn, feel: { mood: st.mood, effort: st.effort, cardio: st.cardio, energy: st.energy, flags: st.flags }, worked: st.worked.map((w) => Object.assign({}, w, { name: APP.canon(w.name).name || w.name })), created: old.created || Date.now(), quick: false });
    if (!s.intensity) s.intensity = 3;
    s.review = Object.assign({}, old.review, { mood: st.mood ? MOODS[st.mood] : (old.review && old.review.mood) || '', good: st.good, hard: st.hard, worked: names });
    await APP.saveSession(s);
    for (const r of st.removed) await APP.deleteRound(r);
    for (const r of st.rounds) { r.sessionId = s.id; r.date = s.date; r.mode = r.mode || s.mode; await APP.saveRound(r); }
    let nNotes = 0; for (const w of s.worked) { if (w.toNotes && (w.explain || w.flaw)) { await createNote(w, s); nNotes++; } }
    APP.closeSheet(); ui.reg = null; rk();
    APP.toast('Entreno guardado' + (nNotes ? ' · ' + nNotes + (nNotes === 1 ? ' apunte' : ' apuntes') : '') + (S.goals.some((g) => !g.done) ? ' · objetivos al día' : ''));
    if (location.hash.indexOf('#/entreno/') === 0) APP.render();
  };
  const SEC = { finalizacion: 'Finalizaciones', pase: 'Pases', sweep: 'Raspados', escape: 'Salidas y escapes', guardia: 'Retención', derribo: 'Entradas', transicion: 'Transiciones', retencion: 'Retención', posicion: 'Conceptos', concepto: 'Conceptos' };
  async function createNote(w, s) {
    const c = APP.canon(w.name); const tech = APP.findTech(w.name); const section = SEC[tech && tech.cat] || 'Conceptos'; const topic = c.name || w.name;
    S.notes = S.notes.filter((n) => !(n.sessionId === s.id && n.title === topic));
    S.notes.push({ id: uid(), topic, section, title: topic, keys: [], body: w.explain || '', mistakes: w.flaw || '', mode: s.mode || 'both', link: '', created: today(), updated: today(), sessionId: s.id, fromDate: s.date, rating: w.rating || '' });
    const cur = S.noteTopics[topic] || []; if (!cur.some((x) => ST.norm(x) === ST.norm(section))) { cur.push(section); S.noteTopics[topic] = cur; await APP.saveMeta('noteTopics', S.noteTopics); }
    await APP.saveMeta('notes', S.notes);
  }
  A.newSession = () => regOpen();
  A.editSession = (el) => regOpen(S.sessions.find((s) => s.id === el.dataset.id));
  A.newSessionOn = (el) => regOpen({ date: el.dataset.d });
  A.quickLog = async () => {
    const t = today(); const occ = APP.plan ? APP.plan.occurrences(t).find((o) => !o.done) : null; const last = S.sessions[0] || {}; const pre = occ ? APP.plan.prefill(occ) : {};
    const s = { id: uid(), date: t, time: pre.time || nowTime(), duration: Number(pre.duration) || Number(last.duration) || 90, type: last.type || TYPES[0], mode: last.mode || defaultMode(), objective: pre.objective || '', techniques: pre.techniques || [], positions: [], intensity: 3, quick: true };
    await APP.saveSession(s); rk(); APP.toast('Entreno registrado (' + s.duration + ' min)');
  };
  A.goalCheck = (el) => { const s = S.sessions.find((x) => x.id === el.dataset.id); if (!s) return; regOpen(s); ui.reg.step = 2; regRender(); };
  A.fab = ((orig) => () => { const tab = APP.route && APP.route.tab; if (tab === 'gym' && A.gymFab) return A.gymFab(); if (tab === 'nutri' && A.nutriFab) return A.nutriFab(); regOpen(); })(A.fab);

  // ---------- editor de round ----------
  const newRd = (sid, mode) => ({ id: '', sessionId: sid || null, date: (ui.reg && ui.reg.date) || today(), partner: '', mode: mode || '', duration: Number(S.settings.lastRoundMin) || 6, worked: [], passMade: { n: 0, how: '' }, passRecv: { n: 0, how: '' }, sweeps: 0, sweepsRecv: 0, subMade: { n: 0, how: '' }, subRecv: { n: 0, how: '' }, subTry: 0, tdMade: 0, tdRecv: 0, escapes: 0, posGain: [], posLost: [], notes: '' });
  function rdOpen(r, where, idx) {
    const f = r && r.form ? JSON.parse(JSON.stringify(r.form)) : null;
    const d = f ? Object.assign(newRd(), f, { id: r.id, sessionId: r.sessionId, date: r.date, partner: r.partner || '', mode: r.mode || '', duration: r.duration || 6, notes: r.notes || '' }) : newRd(r ? r.sessionId : (where === 'standalone' ? currentSid() : null), ui.reg ? ui.reg.mode : defaultMode());
    ui.rd = { d, page: 1, where, idx: idx === undefined ? -1 : idx, rec: r || null }; rdRender();
  }
  function currentSid() { const hs = location.hash.match(/#\/entreno\/(.+)/); if (hs) return hs[1]; const t = S.sessions.find((s) => s.date === today()); return t ? t.id : null; }
  const partners = () => ST.tally(S.rounds.map((r) => (r.partner || '').trim()).filter(Boolean), (x) => x).slice(0, 6).map((x) => x.key);
  const yn2 = (label, f, red) => { const o = ui.rd.d[f]; const on = o.n > 0; return '<div class="yn2' + (red ? ' rd' : '') + '"><div class="yr"><b>' + label + '</b><span class="sy"><button class="' + (on ? 'on' : '') + '" data-act="rdYn" data-f="' + f + '" data-v="1">Sí</button><button class="' + (!on ? 'on' : '') + '" data-act="rdYn" data-f="' + f + '" data-v="0">No</button></span>' + (on ? '<span class="stpsm"><button data-act="rdAdd" data-f="' + f + '.n" data-d="-1">−</button><b>' + o.n + '</b><button class="pl" data-act="rdAdd" data-f="' + f + '.n" data-d="1">+</button></span>' : '') + '</div>' + (on ? '<div class="how">¿Cómo? <input data-how="' + f + '" list="dl-tech" autocomplete="off" value="' + esc(o.how) + '" placeholder="Ej.: knee cut, toreando"></div>' : '') + '</div>'; };
  const cnt = (label, f) => '<div class="cnt"><span>' + label + '</span><span class="stpsm"><button data-act="rdAdd" data-f="' + f + '" data-d="-1">−</button><b>' + ui.rd.d[f] + '</b><button class="pl" data-act="rdAdd" data-f="' + f + '" data-d="1">+</button></span></div>';
  function rdRender() {
    const rd = ui.rd; const d = rd.d; let b;
    const ps = partners();
    if (rd.page === 1) {
      b = '<div class="rhead"><b>Round' + (rd.idx >= 0 ? ' ' + (rd.idx + 1) : '') + '</b><span>Parte 1 de 2</span></div>' +
        '<div class="grid2" style="margin-bottom:10px">' + stepper('TIEMPO', mmss(d.duration), '', 'rdDur" data-d="-0.5', 'rdDur" data-d="0.5', 'rd-dur') + '<div class="stp2 mid" style="align-items:stretch"><div class="sl">CON QUIÉN</div><input id="rd-partner" list="dl-partners" autocomplete="off" placeholder="Compañero" value="' + esc(d.partner) + '" style="min-height:34px;font-weight:800;font-size:16px;background:transparent;border:0;padding:0 4px"></div></div>' +
        (ps.length ? '<div class="chips" style="margin-bottom:10px">' + ps.map((p) => '<button type="button" class="chip sm" data-act="rdPartner" data-n="' + esc(p) + '">' + esc(p) + '</button>').join('') + '</div>' : '') +
        '<div class="chips" data-group="rd-mode" style="margin-bottom:10px">' + [['gi', 'GI'], ['nogi', 'NO-GI']].map((x) => '<button type="button" class="chip' + (d.mode === x[0] ? ' on' : '') + '" style="flex:1;justify-content:center" data-val="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
        card(ct('Qué trabajé') + APP.tagField('rd-worked', d.worked, 'dl-tech', 'Técnica o posición'), 'padding:10px 14px') +
        card(ct('Pases de guardia') + yn2('¿Pasé yo la guardia?', 'passMade') + yn2('¿Me pasaron la guardia?', 'passRecv', true) + cnt('Raspados míos', 'sweeps') + cnt('Me rasparon', 'sweepsRecv'), 'padding:6px 14px') +
        '<datalist id="dl-partners">' + uniq(S.rounds.map((r) => (r.partner || '').trim()).filter(Boolean)).map((p) => '<option value="' + esc(p) + '">').join('') + '</datalist>' +
        '<div class="regfoot"><button class="btn secondary" style="flex:0 0 auto;padding:14px 18px" data-act="rdCancel">✕</button><button class="btn" data-act="rdNext">Siguiente →</button></div>';
    } else {
      b = '<div class="rhead"><b>Round' + (rd.idx >= 0 ? ' ' + (rd.idx + 1) : '') + '</b><span>Parte 2 de 2</span></div>' +
        card(ct('Finalizaciones') + yn2('¿Finalicé yo?', 'subMade') + yn2('¿Me finalizaron?', 'subRecv', true) + cnt('Intentos de llave fallidos míos', 'subTry'), 'padding:6px 14px') +
        card(ct('Otras cosas') + cnt('Derribos míos', 'tdMade') + cnt('Derribos que me hacen', 'tdRecv') + cnt('Escapes míos', 'escapes'), 'padding:6px 14px') +
        card(ct('Posiciones') + '<div class="muted small" style="margin-bottom:4px">Llegué a…</div>' + APP.tagField('rd-pg', d.posGain, 'dl-pos', 'Ej.: Montada') + '<div class="muted small" style="margin:10px 0 4px">Me dominaron en…</div>' + APP.tagField('rd-pl', d.posLost, 'dl-pos', 'Ej.: Side control'), 'padding:10px 14px') +
        field('Qué pasó (nota libre)', '<textarea id="rd-notes" rows="3" placeholder="Opcional">' + esc(d.notes) + '</textarea>') +
        '<div class="regfoot"><button class="btn secondary" style="flex:0 0 auto;padding:14px 18px" data-act="rdBack">‹</button><button class="btn" data-act="rdSave">' + (rd.where === 'wizard' ? 'Guardar round' : 'Guardar round') + '</button></div>' + (rd.rec ? '<button class="btn ghost block" data-act="rdDel">Borrar round</button>' : '');
    }
    APP.openSheet(rd.where === 'wizard' ? 'Round del entreno' : (rd.rec ? 'Editar round' : 'Nuevo round'), b);
  }
  function rdCollect() {
    const rd = ui.rd, d = rd.d; if (!rd) return;
    if (rd.page === 1) { if ($('#rd-partner')) d.partner = val('rd-partner').trim(); d.mode = APP.sel('rd-mode')[0] || d.mode; if ($('[data-tags="rd-worked"]')) d.worked = APP.tags('rd-worked'); }
    else { if ($('[data-tags="rd-pg"]')) { d.posGain = APP.tags('rd-pg'); d.posLost = APP.tags('rd-pl'); } if ($('#rd-notes')) d.notes = val('rd-notes').trim(); }
    $$('[data-how]').forEach((i) => { d[i.dataset.how].how = i.value; });
  }
  A.rdDur = (el) => { const d = ui.rd.d; d.duration = Math.max(0.5, Math.round((d.duration + Number(el.dataset.d)) * 2) / 2); const s = $('#rd-dur'); if (s) s.textContent = mmss(d.duration); };
  A.rdPartner = (el) => { const i = $('#rd-partner'); if (i) i.value = el.dataset.n; };
  A.rdYn = (el) => { rdCollect(); const o = ui.rd.d[el.dataset.f]; o.n = el.dataset.v === '1' ? Math.max(1, o.n) : 0; rdRender(); };
  A.rdAdd = (el) => { rdCollect(); const path = el.dataset.f.split('.'); const d = ui.rd.d; if (path.length === 2) d[path[0]][path[1]] = Math.max(0, d[path[0]][path[1]] + Number(el.dataset.d)); else d[path[0]] = Math.max(0, d[path[0]] + Number(el.dataset.d)); rdRender(); };
  A.rdNext = () => { rdCollect(); ui.rd.page = 2; rdRender(); };
  A.rdBack = () => { rdCollect(); ui.rd.page = 1; rdRender(); };
  A.rdCancel = () => { if (ui.rd.where === 'wizard' && ui.reg) regRender(); else APP.closeSheet(); };
  function rdBuild(d) {
    const ev = []; const mk = (kind, outcome, tech, extra) => ev.push(Object.assign({ id: uid(), kind, tech: tech ? tech.name : '', techId: tech ? tech.id : null, from: '', to: '', outcome, comment: '' }, extra));
    const group = (kind, outcome, o) => { const hows = splitHow(o.how).map((x) => APP.canon(x)); for (let i = 0; i < o.n; i++) mk(kind, outcome, hows.length ? hows[Math.min(i, hows.length - 1)] : null); };
    group('pass_made', 'exito', d.passMade); group('pass_recv', 'recibida', d.passRecv); group('sub_made', 'exito', d.subMade); group('sub_recv', 'recibida', d.subRecv);
    for (let i = 0; i < d.sweeps; i++) mk('sweep_made', 'exito'); for (let i = 0; i < d.sweepsRecv; i++) mk('sweep_recv', 'recibida');
    for (let i = 0; i < d.subTry; i++) mk('sub_made', 'intento'); for (let i = 0; i < d.tdMade; i++) mk('takedown_made', 'exito'); for (let i = 0; i < d.tdRecv; i++) mk('takedown_recv', 'recibida'); for (let i = 0; i < d.escapes; i++) mk('escape', 'exito');
    d.posGain.forEach((p) => mk('pos_gain', 'exito', null, { to: APP.canon(p).name })); d.posLost.forEach((p) => mk('pos_lost', 'recibida', null, { to: APP.canon(p).name }));
    return ev;
  }
  A.rdSave = async () => {
    rdCollect(); const rd = ui.rd, d = rd.d; const mode = d.mode || (ui.reg && ui.reg.mode) || '';
    const old = rd.rec || {}; const events = rdBuild(d).map((e) => Object.assign(e, { mode }));
    const r = Object.assign({}, old, { id: old.id || uid(), sessionId: d.sessionId, date: d.date, partner: d.partner, context: 'entreno', mode, result: old.result || 'none', duration: d.duration, events, worked: d.worked, notes: d.notes, form: JSON.parse(JSON.stringify(Object.assign({}, d, { mode }))), created: old.created || Date.now() });
    if (S.settings.lastRoundMin !== d.duration) await APP.saveMeta('settings', Object.assign({}, S.settings, { lastRoundMin: d.duration }));
    if (rd.where === 'wizard' && ui.reg) { const st = ui.reg; if (rd.idx >= 0) st.rounds[rd.idx] = r; else st.rounds.push(r); st.step = 3; regRender(); return; }
    await APP.saveRound(r); APP.closeSheet(); rk(); APP.toast('Round guardado');
  };
  A.rdDel = async () => { if (!APP.confirm('¿Borrar este round?')) return; const rd = ui.rd; if (rd.where === 'wizard' && ui.reg) { ui.reg.removed.push(rd.rec.id); ui.reg.rounds.splice(rd.idx, 1); ui.reg.step = 3; regRender(); return; } await APP.deleteRound(rd.rec.id); APP.closeSheet(); rk(); };
  const oldEditRound = A.editRound;
  A.editRound = (el) => { const r = S.rounds.find((x) => x.id === el.dataset.id); if (r && r.form) rdOpen(r, 'standalone'); else oldEditRound(el); };
  A.newRound = (el) => { let sid = el && el.dataset ? el.dataset.sid : ''; if (!sid) sid = currentSid() || ''; const d = newRd(sid || null, defaultMode()); ui.rd = { d, page: 1, where: 'standalone', idx: -1, rec: null }; rdRender(); };

  // ---------- detalle de sesión: sensaciones y técnicas ----------
  const oldEntreno = V.entreno;
  V.entreno = (id) => {
    const html = oldEntreno(id); const s = S.sessions.find((x) => x.id === id); if (!s) return html;
    let extra = '';
    if (s.feel && (s.feel.mood || s.feel.effort || s.feel.cardio || s.feel.energy)) extra += card(ct('Sensaciones') + '<div class="row between" style="font-size:13px"><span>Ánimo ' + (s.feel.mood ? FACES[s.feel.mood - 1] : '–') + '</span><span>Intens. <b style="color:var(--orange)">' + (s.feel.effort || '–') + '/5</b></span><span>Cardio <b style="color:var(--green)">' + (s.feel.cardio || '–') + '/5</b></span><span>Energía <b style="color:var(--gold)">' + (s.feel.energy || '–') + '/5</b></span></div>' + ((s.feel.flags || []).length ? '<div class="chips" style="margin-top:8px">' + s.feel.flags.map((f) => '<span class="tag">' + esc(f) + '</span>').join('') + '</div>' : ''), 'padding:12px 14px');
    if (s.worked && s.worked.length) extra += card(ct('Técnicas trabajadas') + s.worked.map((w) => { const r = RATES[w.rating]; return '<div class="cnt"><span><b>' + esc(APP.tn(w.name)) + '</b>' + (w.explain ? '<br><span class="muted small">' + esc(w.explain) + '</span>' : '') + '</span>' + (r ? pill(r[0] + ' ' + r[1], r[2]) : '') + '</div>'; }).join(''), 'padding:8px 14px');
    return html.replace('<button class="btn danger block" data-act="delSession"', extra + '<button class="btn danger block" data-act="delSession"');
  };
  APP.techHistory = (title) => S.sessions.filter((s) => (s.worked || []).some((w) => ST.norm(w.name) === ST.norm(title))).slice(0, 4).map((s) => ({ date: s.date, rating: s.worked.find((w) => ST.norm(w.name) === ST.norm(title)).rating }));

  // =====================================================================
  // ESTADÍSTICAS POR PESTAÑAS
  // =====================================================================
  const oldStats = V.stats;
  ui.stats.ptab = ui.stats.ptab || 'res';
  const PT = [['res', 'Resumen'], ['pos', 'Posiciones'], ['llaves', 'Llaves'], ['riv', 'Rivales'], ['cuerpo', 'Cuerpo'], ['det', 'Detalle']];
  A.ptab = (el) => { ui.stats.ptab = el.dataset.v; rk(); };
  function filters() {
    const u = ui.stats; const pick = (k, opts, cur) => '<select data-input="statSel" data-k="' + k + '" aria-label="Filtro">' + opts.map((o) => '<option value="' + o[0] + '"' + (cur === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
    return '<div class="filters">' + pick('mode', [['all', 'GI + NO-GI'], ['gi', 'GI'], ['nogi', 'NO-GI']], u.mode) + pick('ctx', [['all', 'Todo'], ['entreno', 'Entrenamiento'], ['competicion', 'Competición']], u.ctx) + pick('period', [['all', 'Todo'], ['30', '30 días'], ['90', '90 días'], ['365', 'Año']], u.period) + '</div>';
  }
  function fObj() { const u = ui.stats; const f = { mode: u.mode, context: u.ctx }; if (u.period !== 'all') { f.from = ST.addDays(today(), -Number(u.period) + 1); f.to = today(); } return f; }
  const own = (ev, k) => ev.filter((e) => e.kind === k && e.outcome === 'exito');
  const posKey = (p) => { const n = String(p || '').trim(); return n ? APP.canon(n).name : ''; };
  const tallyK = (items) => ST.tally(items.filter(Boolean), (x) => x);
  const effTxt = (e) => (e.total ? e.pct + '%' : '–');
  function statCoach(rep, ev) {
    const out = []; const prg = ST.tally(ev.filter((e) => e.kind === 'pos_lost' && e.to).map((e) => posKey(e.to)), (x) => x)[0];
    if (prg && prg.n >= 3) out.push('Te dominan sobre todo en <b>' + esc(APP.tn(prg.key)) + '</b> (' + prg.n + ' veces): trabaja el escape.');
    const sm = rep.subs.byTech.filter((x) => x.total >= 3).sort((a, b) => b.pct - a.pct)[0]; if (sm) out.push('Tu mejor llave es <b>' + esc(APP.tn(sm.tech)) + '</b> (' + sm.pct + '%, ' + sm.success + ' de ' + sm.total + ').');
    const rv = rep.subs.received.rows[0]; if (rv && rv.n >= 3) out.push('Te finalizan más con <b>' + esc(APP.tn(rv.key)) + '</b> (' + rv.n + ' veces).');
    return out;
  }
  function tabRes(rep, ev, rs) {
    const f = fObj(); const ses = ST.sessionsInRange(S.sessions, f.from, f.to).filter((s) => ui.stats.mode === 'all' || s.mode === ui.stats.mode); const hours = Math.round(ses.reduce((a, x) => a + (Number(x.duration) || 0), 0) / 60);
    const rg = (e, l, c) => '<div style="text-align:center">' + mring(e.total ? e.pct / 100 : 0, c, effTxt(e), 66) + '<div style="font-size:11px;font-weight:700">' + l + '</div><div class="pill-n">' + (e.total ? e.success + ' de ' + e.total : 'sin intentos') + '</div></div>';
    const c = statCoach(rep, ev);
    return card('<div class="gstrip"><div><b>' + ses.length + '</b><span>entrenos</span></div><div><b>' + rep.rounds + '</b><span>rounds</span></div><div><b>' + hours + ' h</b><span>tatami</span></div><div><b>' + rep.events + '</b><span>acciones</span></div></div>', 'padding:11px 14px') +
      card(ct('Eficacia') + '<div class="row" style="justify-content:space-around">' + rg(rep.subs.efficacy, 'Sumisiones', 'var(--green)') + rg(rep.passes.efficacy, 'Pases', 'var(--blue)') + rg(rep.escapes.efficacy, 'Escapes', 'var(--gold)') + '</div>') +
      card(ct('Balance (míos · contra mí)') + vs(rep.subs.made.total, rep.subs.received.total, 'finalizaciones', 'finalizado') + vs(own(ev, 'pass_made').length || rep.passes.efficacy.success, ev.filter((e) => e.kind === 'pass_recv').length, 'pases míos', 'me pasan') + vs(rep.guards.sweepEfficacy.success, ev.filter((e) => e.kind === 'sweep_recv').length, 'raspados', 'me rasparon') + vs(rep.takedowns.efficacy.success, ev.filter((e) => e.kind === 'takedown_recv').length, 'derribos', 'me derriban')) +
      card(ct('Actividad por semana') + APP.miniBars(rep.general.byWeek)) + c.map(insight).join('');
  }
  function tabPos(rep, ev) {
    const gain = tallyK(ev.filter((e) => e.outcome === 'exito' && (e.kind === 'pos_gain' || e.kind === 'pass_made' || e.kind === 'sweep_made' || e.kind === 'takedown_made' || e.kind === 'back_take')).map((e) => posKey(e.to)));
    const lost = tallyK(ev.filter((e) => e.kind === 'pos_lost' || e.kind === 'pass_recv' || e.kind === 'sweep_recv' || e.kind === 'takedown_recv').map((e) => posKey(e.to)));
    const g = rep.guards.passesReceivedByGuard.rows.filter((r) => r.key !== 'Sin especificar');
    const c = statCoach(rep, ev).filter((x) => /dominan/.test(x));
    const how = '<p class="muted small" style="margin:8px 0 0">Se rellena con «Llegué a…» y «Me dominaron en…» de cada round.</p>';
    return card(ct('Llego más a', 'g') + rows(gain.slice(0, 6)) + (gain.length ? '' : how), 'padding:11px 14px') + card(ct('Me dominan más en', 'r') + rows(lost.slice(0, 6), 'red') + (lost.length ? '' : how), 'padding:11px 14px') +
      card(ct('Guardia · balance') + vs(rep.passes.efficacy.success, ev.filter((e) => e.kind === 'pass_recv').length, 'pases míos', 'me pasan') + vs(rep.guards.sweepEfficacy.success, ev.filter((e) => e.kind === 'sweep_recv').length, 'raspados', 'me rasparon') + vs(rep.takedowns.efficacy.success, ev.filter((e) => e.kind === 'takedown_recv').length, 'derribos', 'me derriban')) +
      (g.length ? card(ct('Guardias desde las que me pasan', 'r') + rows(g.slice(0, 5), 'red')) : '') + c.map(insight).join('');
  }
  function tabLlaves(rep, ev) {
    const eff = rep.subs.byTech; const mx = Math.max.apply(null, eff.map((x) => x.success)) || 1;
    const hago = eff.filter((x) => x.success > 0).slice(0, 5).map((x) => '<div class="hbar"><span class="hn">' + esc(APP.tn(x.tech)) + '</span><span class="ht"><i style="width:' + Math.max(3, Math.round((x.success / mx) * 100)) + '%"></i></span><b>' + x.success + '</b><span class="hx">' + x.pct + '%</span></div>').join('');
    const c = statCoach(rep, ev).filter((x) => /llave|finalizan/.test(x));
    return card(ct('Llaves que más hago', 'g') + (hago || '<p class="muted small" style="margin:0">Aún sin datos.</p>') + (hago ? '<p class="pill-n" style="margin:6px 0 0">veces · % de intentos que acaban en sumisión</p>' : ''), 'padding:11px 14px') +
      card(ct('Llaves que me hacen', 'r') + rows(rep.subs.received.rows.slice(0, 5), 'red'), 'padding:11px 14px') +
      card(vs(rep.subs.made.total, rep.subs.received.total, 'subm. hechas', 'finalizado') + '<p class="muted small" style="margin:8px 0 0">Intentos totales: ' + rep.subs.efficacy.total + (rep.subs.efficacy.total ? ' · convertidos: ' + rep.subs.efficacy.pct + '%' : '') + '</p>', 'padding:11px 14px') +
      card(ct('Desde dónde finalizo', 'g') + rows(rep.subs.madeByPosition.rows.filter((r) => r.key !== 'Sin especificar').slice(0, 5).map((r) => ({ key: r.key, n: r.n }))), 'padding:11px 14px') +
      card(ct('Desde dónde me finalizan', 'r') + rows(rep.subs.receivedByPosition.rows.filter((r) => r.key !== 'Sin especificar').slice(0, 5).map((r) => ({ key: r.key, n: r.n })), 'red'), 'padding:11px 14px') + c.map(insight).join('');
  }
  function tabRiv(rep, ev, rs) {
    const pm = {}; rs.forEach((x) => { const n = (x.partner || '').trim(); if (!n) return; const p = pm[n] = pm[n] || { n: 0, made: 0, recv: 0 }; p.n++; (x.events || []).forEach((e) => { if (e.kind === 'sub_made' && e.outcome === 'exito') p.made++; if (e.kind === 'sub_recv') p.recv++; }); });
    const list = Object.keys(pm).map((k) => Object.assign({ name: k }, pm[k])).sort((a, b) => b.n - a.n).slice(0, 8);
    const gi = ST.report(S.rounds, Object.assign({}, fObj(), { mode: 'gi' })), ng = ST.report(S.rounds, Object.assign({}, fObj(), { mode: 'nogi' }));
    const mode = (l, r, cl) => '<div class="hbar ' + cl + '"><span class="hn">' + l + '</span><span class="ht"><i style="width:' + (r.subs.efficacy.total ? r.subs.efficacy.pct : 0) + '%"></i></span><b style="width:44px">' + effTxt(r.subs.efficacy) + '</b></div>';
    return card(ct('Contra quién ruedo') + (list.length ? list.map((p) => '<div class="prow"><span class="av">' + esc(p.name[0].toUpperCase()) + '</span><div style="flex:1"><b style="font-size:13px">' + esc(p.name) + '</b><div class="pill-n">' + p.n + (p.n === 1 ? ' round' : ' rounds') + '</div></div><span style="color:var(--green);font-weight:800;font-size:13px">' + p.made + ' ✓</span><span style="color:var(--red);font-weight:800;font-size:13px;width:34px;text-align:right">' + p.recv + ' ✗</span></div>').join('') + '<p class="pill-n" style="margin:6px 0 0">✓ le hice sumisión · ✗ me finalizó</p>' : '<p class="muted small" style="margin:0">Anota el compañero en cada round y verás aquí cómo te va con cada uno.</p>'), 'padding:11px 14px') +
      card(ct('Gi vs No-Gi · eficacia de sumisiones') + (gi.rounds || ng.rounds ? mode('Gi (' + gi.rounds + ' rounds)', gi, '') + mode('No-Gi (' + ng.rounds + ' rounds)', ng, 'am') : '<p class="muted small" style="margin:0">Aún sin datos.</p>'), 'padding:11px 14px');
  }
  function tabCuerpo() {
    const t = today(); const ws = ST.weekStart(t); const weeks = []; for (let i = 7; i >= 0; i--) weeks.push(ST.addDays(ws, -7 * i));
    const ser = (k) => weeks.map((w) => { const ss = S.sessions.filter((s) => s.date >= w && s.date <= ST.addDays(w, 6) && s.feel && s.feel[k]); return ss.length ? ss.reduce((a, s) => a + s.feel[k], 0) / ss.length : null; }).filter((x) => x !== null);
    const cd = ser('cardio'), md = ser('mood'); const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : '–');
    const wk = {}; S.sessions.filter((s) => s.date >= ST.addDays(t, -90)).forEach((s) => (s.worked || []).forEach((w) => { if (w.rating) { const k = APP.canon(w.name).name; (wk[w.rating] = wk[w.rating] || []).push(k); } }));
    const hard = ST.tally(wk.hard || [], (x) => x).slice(0, 4), good = ST.tally(wk.good || [], (x) => x).slice(0, 4);
    const wg = goalsOfPeriod('week'); const bars = []; let ref = t; for (let i = 0; i < 5; i++) { const ps = wg.map((g) => gp(g, ref)).filter((p) => p.target && p.asked); bars.unshift(ps.length ? Math.round(ps.reduce((a, p) => a + p.pct, 0) / ps.length) : null); ref = ST.addDays(ST.weekStart(ref), -7); }
    // cardio alto vs bajo: sumisiones por round
    const sr = S.sessions.filter((s) => s.feel && s.feel.cardio).map((s) => { const rs = S.rounds.filter((r) => r.sessionId === s.id); if (!rs.length) return null; const subs = rs.reduce((a, r) => a + (r.events || []).filter((e) => e.kind === 'sub_made' && e.outcome === 'exito').length, 0); return { c: s.feel.cardio, v: subs / rs.length }; }).filter(Boolean);
    const hi = sr.filter((x) => x.c >= 4), lo = sr.filter((x) => x.c <= 3); let ins = '';
    if (hi.length >= 3 && lo.length >= 3) { const a = hi.reduce((x, y) => x + y.v, 0) / hi.length, b = lo.reduce((x, y) => x + y.v, 0) / lo.length; ins = insight('Con cardio ≥4 haces <b>' + (Math.round(a * 10) / 10).toString().replace('.', ',') + '</b> sumisiones por round frente a <b>' + (Math.round(b * 10) / 10).toString().replace('.', ',') + '</b> con cardio ≤3 (' + hi.length + ' y ' + lo.length + ' sesiones; solo orientativo).'); }
    return card(ct('Cardio y ánimo · últimas 8 semanas') + (cd.length > 1 || md.length > 1 ? '<div class="row" style="justify-content:space-between"><div>' + spark(cd, 'var(--green)', 130, 36) + '<div style="font-size:11px;color:var(--green);margin-top:3px">Cardio · ' + avg(cd) + ' / 5</div></div><div>' + spark(md, 'var(--gold)', 130, 36) + '<div style="font-size:11px;color:var(--gold);margin-top:3px">Ánimo · ' + avg(md) + ' / 5</div></div></div>' : '<p class="muted small" style="margin:0">Registra cómo te sientes en cada entreno (≥2 semanas) para ver la evolución.</p>'), 'padding:11px 14px') +
      card(ct('Lo que más me cuesta', 'r') + rows(hard, 'red') + '<p class="pill-n" style="margin:4px 0 0">técnicas valoradas «Me costó» · 90 días</p>', 'padding:11px 14px') +
      card(ct('Lo que mejor me sale', 'g') + rows(good) + '<p class="pill-n" style="margin:4px 0 0">técnicas valoradas «Salió bien» · 90 días</p>', 'padding:11px 14px') +
      card(ct('Objetivos semanales cumplidos') + (bars.some((b) => b !== null) ? '<div style="display:flex;gap:8px;align-items:flex-end;height:60px">' + bars.map((v, i) => '<div style="flex:1;text-align:center"><div style="height:' + Math.max(3, (v || 0) * 0.4) + 'px;border-radius:5px;background:' + (i === 4 ? 'var(--green)' : 'color-mix(in srgb,var(--green) 45%,var(--surface-2))') + '"></div><div style="font-size:9px;color:var(--muted);margin-top:3px">' + (v === null ? '–' : v + '%') + '</div></div>').join('') + '</div>' : '<p class="muted small" style="margin:0">Crea objetivos semanales y verás aquí cuánto los cumples.</p>'), 'padding:11px 14px') + ins;
  }
  V.stats = () => {
    const tab = ui.stats.ptab || 'res';
    const tabs = '<div class="ptabs">' + PT.map((t) => '<button class="' + (tab === t[0] ? 'on' : '') + '" data-act="ptab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (!S.rounds.length && tab !== 'cuerpo') return '<div class="ttl"><h2>Estadísticas</h2></div>' + tabs + '<div class="card empty"><h3>Aún no hay estadísticas</h3><p>Se calculan con tus rounds registrados: al guardar un entreno, añade tus rolas (pases, finalizaciones, posiciones…).</p><button class="btn" data-act="newSession">Registrar entreno</button></div>';
    if (tab === 'det') return '<div class="ttl"><h2>Estadísticas</h2></div>' + tabs + oldStats();
    const f = fObj(); const rs = ST.filterRounds(S.rounds, f); const ev = ST.flatten(rs); const rep = ST.report(S.rounds, f);
    const body = tab === 'pos' ? tabPos(rep, ev) : tab === 'llaves' ? tabLlaves(rep, ev) : tab === 'riv' ? tabRiv(rep, ev, rs) : tab === 'cuerpo' ? tabCuerpo() : tabRes(rep, ev, rs);
    return '<div class="ttl"><h2>Estadísticas<small>Tu jiu-jitsu en datos</small></h2></div>' + tabs + (tab === 'cuerpo' ? '' : filters()) + body;
  };
  APP.titles.stats = 'Estadísticas BJJ';

  // =====================================================================
  // ESTUDIO · técnicas concretas con vídeo de YouTube + apuntes clasificados que van a Apuntes
  // =====================================================================
  const SECS = ['Entradas', 'Salidas y escapes', 'Raspados', 'Pases', 'Finalizaciones', 'Defensas', 'Retención', 'Transiciones', 'Conceptos'];
  const NCLS = { key: ['🔑', 'Detalle clave'], step: ['👣', 'Paso a paso'], err: ['⚠️', 'Error a evitar'], doubt: ['❓', 'Duda'] };
  const chipsH = (n, o, sl, m, oc) => APP.chips(n, o, sl, m, oc);
  const study = () => (S.study = S.study || []);
  const saveStudy = () => APP.saveMeta('study', study());
  Object.assign(APP.titles, { estudio: 'Estudio' });
  APP.TABMAP.estudio = 'bjj';
  ui.st = ui.st || { q: '', sec: '', v: 0 };
  const ytId = (u) => { u = String(u || '').trim(); let m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([\w-]{11})/); if (!m && /^[\w-]{11}$/.test(u)) m = [0, u]; return m ? m[1] : ''; };
  const ytStart = (u) => { const m = String(u).match(/[?&#](?:t|start)=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
  const tsF = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const tsP = (x) => { x = String(x || '').trim(); if (!x) return null; const p = x.split(':').map(Number); if (p.some(isNaN)) return null; return p.length === 1 ? p[0] * 60 : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2]; };
  const stItem = (id) => study().find((x) => x.id === id);

  V.estudio = (arg) => {
    if (arg) return stDetail(stItem(arg));
    const q = ST.norm(ui.st.q), all = study();
    let list = all.filter((x) => (!ui.st.sec || x.sec === ui.st.sec) && (!q || ST.norm(x.title + ' ' + x.pos).includes(q)));
    list.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    const secs = uniq(all.map((x) => x.sec).filter(Boolean));
    const nN = all.reduce((a, x) => a + x.notes.length, 0), nV = all.reduce((a, x) => a + x.videos.length, 0);
    let h = '<div class="ttl"><h2>Estudio<small>Técnica a técnica, con vídeo y apuntes</small></h2></div>';
    h += card('<div class="row"><div style="flex:1;text-align:center"><b style="font-size:22px">' + all.length + '</b><div class="small muted">técnicas</div></div><div style="flex:1;text-align:center"><b style="font-size:22px">' + nV + '</b><div class="small muted">vídeos</div></div><div style="flex:1;text-align:center"><b style="font-size:22px">' + nN + '</b><div class="small muted">apuntes</div></div></div>');
    h += '<button class="btn block" style="margin-bottom:12px" data-act="stNew">+ Nueva técnica de estudio</button>';
    if (all.length) {
      h += '<input type="search" placeholder="Buscar técnica o posición…" value="' + esc(ui.st.q) + '" data-input="stSearch" style="margin-bottom:10px">';
      if (secs.length > 1) h += '<div class="ptabs" style="overflow-x:auto;white-space:nowrap"><button class="' + (!ui.st.sec ? 'on' : '') + '" data-act="stSec" data-v="">Todas</button>' + secs.map((x) => '<button class="' + (ui.st.sec === x ? 'on' : '') + '" data-act="stSec" data-v="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>';
      h += '<div id="st-list">' + stList(list) + '</div>';
    } else h += '<div class="card empty"><h3>Empieza tu estudio</h3><p>Crea una técnica concreta (por ejemplo «Raspado desde media guardia»), pega el enlace de un vídeo de YouTube y ve tomando apuntes mientras lo ves.</p></div>';
    return h;
  };
  const stList = (list) => list.length ? list.map((x) => '<a class="card" href="#/estudio/' + x.id + '" style="display:block;text-decoration:none;color:inherit"><div class="row between"><b>' + esc(APP.tn(x.title)) + '</b><span class="muted">›</span></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">' + (x.pos ? pill(esc(APP.tn(x.pos))) : '') + (x.sec ? pill(esc(x.sec)) : '') + pill('🎬 ' + x.videos.length) + pill('📝 ' + x.notes.length) + '</div></a>').join('') : empty('Nada coincide.');
  A.stSearch = (el) => { ui.st.q = el.value; const l = $('#st-list'); if (l) l.innerHTML = stList(study().filter((x) => (!ui.st.sec || x.sec === ui.st.sec) && (!ST.norm(el.value) || ST.norm(x.title + ' ' + x.pos).includes(ST.norm(el.value))))); };
  A.stSec = (el) => { ui.st.sec = el.dataset.v; rk(); };

  function stForm(x) {
    x = x || {};
    APP.openSheet(x.id ? 'Editar técnica' : 'Nueva técnica de estudio',
      field('Técnica concreta', '<input id="st-title" list="dl-tech" autocomplete="off" placeholder="Ej.: Raspado desde media guardia" value="' + esc(x.title || '') + '">') +
      field('Posición (será el tema en Apuntes)', '<input id="st-pos" list="dl-pos" autocomplete="off" placeholder="Ej.: Media guardia" value="' + esc(x.pos || '') + '">') +
      group('Apartado en Apuntes', chipsH('stsec', SECS, x.sec || null, false, true)) +
      (x.id ? '' : field('Enlace de YouTube (opcional)', '<input id="st-url" type="url" inputmode="url" placeholder="https://youtu.be/…">')) +
      '<button class="btn block" data-act="stSave" data-id="' + (x.id || '') + '">' + (x.id ? 'Guardar cambios' : 'Crear y abrir') + '</button>');
  }
  A.stNew = () => stForm();
  A.stEdit = (el) => stForm(stItem(el.dataset.id));
  A.stSave = async (el) => {
    const title = val('st-title').trim(); if (!title) return APP.toast('Escribe la técnica');
    const old = stItem(el.dataset.id); const pos = val('st-pos').trim(); const sec = APP.sel('stsec')[0] || '';
    const x = old || { id: uid(), videos: [], notes: [], created: today() };
    Object.assign(x, { title, pos, sec, updated: today() });
    const url = (APP.$('#st-url') ? val('st-url').trim() : '');
    if (url) { const id = ytId(url); if (!id) return APP.toast('Ese enlace no parece de YouTube'); x.videos.push({ id: uid(), url, yt: id, start: ytStart(url) }); }
    if (!old) study().push(x);
    await saveStudy(); await stSync(x); APP.closeSheet(); ui.st.v = 0; APP.go('#/estudio/' + x.id); if (old) rk();
  };
  A.stDel = async (el) => {
    const x = stItem(el.dataset.id); if (!x || !APP.confirm('¿Borrar «' + x.title + '»? El apunte ya guardado en Apuntes se mantiene.')) return;
    S.study = study().filter((y) => y.id !== x.id); await saveStudy(); APP.go('#/estudio');
  };

  let ytP = null, ytReady = null;
  const ytLoad = () => ytReady || (ytReady = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res();
    const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(); };
    const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.onerror = () => { ytReady = null; rej(); }; document.head.appendChild(sc);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { ytReady = null; rej(); } }, 8000);
  }));
  const ytInit = (x) => { ytP = null; const fr = $('#st-frame'); if (!fr || !navigator.onLine) return; ytLoad().then(() => { if ($('#st-frame') === fr) ytP = new window.YT.Player('st-frame'); }).catch(() => {}); };

  function stDetail(x) {
    if (!x) return '<div class="card empty">Técnica no encontrada.</div>';
    const vi = Math.min(ui.st.v || 0, x.videos.length - 1), v = x.videos[vi];
    let h = '<a class="backlink" href="#/estudio">‹ Estudio</a>';
    h += '<div class="row between" style="margin-bottom:10px"><div><h2 style="margin:0">' + esc(APP.tn(x.title)) + '</h2><div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">' + (x.pos ? pill(esc(APP.tn(x.pos))) : '') + (x.sec ? pill(esc(x.sec)) : '') + '</div></div><button class="btn small ghost" data-act="stEdit" data-id="' + x.id + '">Editar</button></div>';
    if (v) {
      h += '<div class="card" style="padding:10px">' + (navigator.onLine ? '<div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000"><iframe id="st-frame" style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube-nocookie.com/embed/' + v.yt + '?enablejsapi=1&playsinline=1&rel=0' + (v.start ? '&start=' + v.start : '') + '" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : '<div class="empty" style="padding:18px">Sin conexión: el vídeo necesita internet. Tus apuntes sí funcionan.</div>') +
        '<div class="row between" style="margin-top:8px;gap:6px"><a class="small" style="color:var(--green)" target="_blank" rel="noopener" href="' + esc(v.url) + '">Abrir en YouTube ↗</a><button class="btn small ghost" data-act="stVidDel" data-id="' + x.id + '" data-i="' + vi + '">Quitar vídeo</button></div></div>';
    }
    h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">' + x.videos.map((y, i) => '<button class="btn small ' + (i === vi ? '' : 'secondary') + '" data-act="stVid" data-i="' + i + '">Vídeo ' + (i + 1) + '</button>').join('') + '<button class="btn small secondary" data-act="stVidAdd" data-id="' + x.id + '">+ ' + (v ? 'Otro vídeo' : 'Añadir vídeo de YouTube') + '</button></div>';
    h += card(ct('Mis apuntes mientras lo veo') +
      '<textarea id="sn-text" rows="3" placeholder="Escribe lo que veas importante…"></textarea>' +
      '<div class="small muted" style="margin:8px 0 4px">Tipo</div>' + chipsH('sncls', Object.keys(NCLS).map((k) => ({ v: k, l: NCLS[k][0] + ' ' + NCLS[k][1] })), 'key', false, false) +
      '<div class="row" style="margin-top:10px;gap:8px"><input id="sn-ts" placeholder="m:ss" inputmode="numeric" style="width:84px;flex:none"><button class="btn small secondary" style="flex:1" data-act="snNow">⏱ Minuto actual</button></div><button class="btn block" style="margin-top:10px" data-act="snAdd" data-id="' + x.id + '">Añadir apunte</button>' +
      '<p class="small muted" style="margin:8px 0 0">Se guarda solo y se actualiza en Apuntes › ' + esc(APP.tn(x.pos || x.title)) + '.</p>');
    h += '<div id="st-notes">' + stNotes(x) + '</div>';
    h += '<div class="stack"><button class="btn secondary block" data-act="stToApuntes" data-id="' + x.id + '">📝 Ver en Apuntes</button><button class="btn ghost block" data-act="stDel" data-id="' + x.id + '">Borrar técnica</button></div>';
    setTimeout(() => ytInit(x), 0);
    return h;
  }
  const stNotes = (x) => {
    if (!x.notes.length) return '';
    const vids = x.videos;
    return Object.keys(NCLS).map((k) => { const ns = x.notes.filter((n) => n.cls === k); if (!ns.length) return ''; return card(ct(NCLS[k][0] + ' ' + NCLS[k][1] + ' (' + ns.length + ')') + ns.map((n) => '<div class="row between" style="align-items:flex-start;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1;white-space:pre-wrap">' + (n.t != null ? '<a href="#" data-act="snSeek" data-t="' + n.t + '" data-v="' + (n.v || 0) + '" style="color:var(--green);font-weight:700">' + tsF(n.t) + '</a> ' : '') + esc(n.text) + '</div><button class="btn small ghost" data-act="snDel" data-id="' + x.id + '" data-n="' + n.id + '">✕</button></div>').join('')); }).join('');
  };
  A.stVid = (el) => { ui.st.v = +el.dataset.i; rk(); };
  A.stVidAdd = (el) => APP.openSheet('Añadir vídeo', field('Enlace de YouTube', '<input id="sv-url" type="url" inputmode="url" placeholder="https://youtu.be/…">') + '<button class="btn block" data-act="stVidSave" data-id="' + el.dataset.id + '">Añadir</button>');
  A.stVidSave = async (el) => {
    const x = stItem(el.dataset.id), url = val('sv-url').trim(), id = ytId(url); if (!id) return APP.toast('Ese enlace no parece de YouTube');
    x.videos.push({ id: uid(), url, yt: id, start: ytStart(url) }); x.updated = today(); ui.st.v = x.videos.length - 1; await saveStudy(); await stSync(x); APP.closeSheet(); rk();
  };
  A.stVidDel = async (el) => { const x = stItem(el.dataset.id); if (!APP.confirm('¿Quitar este vídeo?')) return; x.videos.splice(+el.dataset.i, 1); ui.st.v = 0; await saveStudy(); await stSync(x); rk(); };
  A.snNow = () => { try { if (ytP && ytP.getCurrentTime) { $('#sn-ts').value = tsF(ytP.getCurrentTime()); return; } } catch (e) { /* sigue */ } APP.toast('No puedo leer el minuto: escríbelo a mano (m:ss)'); };
  A.snSeek = (el) => { try { if (ytP && ytP.seekTo) { ytP.seekTo(+el.dataset.t, true); ytP.playVideo(); window.scrollTo({ top: 0, behavior: 'smooth' }); } } catch (e) { /* sin API */ } };
  A.snAdd = async (el) => {
    const x = stItem(el.dataset.id), text = val('sn-text').trim(); if (!text) return APP.toast('Escribe el apunte');
    const t = tsP(val('sn-ts')); const cls = APP.sel('sncls', $('#view'))[0] || 'key';
    x.notes.push({ id: uid(), cls, text, t, v: Math.min(ui.st.v || 0, x.videos.length - 1), created: today() }); x.updated = today();
    await saveStudy(); await stSync(x);
    $('#sn-text').value = ''; $('#sn-ts').value = ''; $('#st-notes').innerHTML = stNotes(x); APP.toast('Apunte guardado en Apuntes');
  };
  A.snDel = async (el) => { const x = stItem(el.dataset.id); x.notes = x.notes.filter((n) => n.id !== el.dataset.n); await saveStudy(); await stSync(x); $('#st-notes').innerHTML = stNotes(x); };
  A.stToApuntes = (el) => { const x = stItem(el.dataset.id); APP.go('#/apuntes/' + encodeURIComponent(APP.canon(x.pos || x.title).name || x.pos || x.title)); };

  // Crea o actualiza el apunte de Apuntes ligado a esta técnica de estudio.
  async function stSync(x) {
    const topic = APP.canon(x.pos || x.title).name || x.pos || x.title; const section = x.sec || 'Conceptos';
    const line = (n) => (n.t != null ? '[' + tsF(n.t) + '] ' : '') + n.text;
    const by = (k) => x.notes.filter((n) => n.cls === k);
    const body = by('step').map(line).join('\n') + (by('doubt').length ? (by('step').length ? '\n\n' : '') + 'Dudas:\n' + by('doubt').map(line).join('\n') : '');
    let n = S.notes.find((y) => y.studyId === x.id);
    const empty = !x.notes.length && !x.videos.length;
    if (empty && !n) return;
    const data = { topic, section, title: x.title, keys: by('key').map(line), body, mistakes: by('err').map(line).join('\n'), mode: 'both', link: x.videos[0] ? x.videos[0].url : '', updated: today(), studyId: x.id };
    if (n) Object.assign(n, data); else S.notes.push(Object.assign({ id: uid(), created: today() }, data));
    const cur = S.noteTopics[topic] || []; if (!cur.some((c) => ST.norm(c) === ST.norm(section))) { cur.push(section); S.noteTopics[topic] = cur; await APP.saveMeta('noteTopics', S.noteTopics); }
    await APP.saveMeta('notes', S.notes);
  }
  APP.ui2 = { card, ct, pill, mring, spark, hbar, rows, insight, empty, mmss, hm, fmtN, gp, appliesOn, rk, wdIdx, activeGoals };
  APP.yt = { ytId, ytStart, tsF, tsP, ytInit, ytLoad, player: () => ytP };
  APP.SECS = SECS;
})();
