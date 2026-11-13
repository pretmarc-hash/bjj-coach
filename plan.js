/* Planificación, recordatorios locales, calendario (.ics) e informe mensual. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, chips, sel, tags, tagField, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  const save = () => APP.saveMeta('plan', S.plan);
  Object.assign(APP.titles, { plan: 'Planificación', mensual: 'Informe mensual', registrar: 'Registrar' });

  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const wd = (d) => ((ST.parse(d).getDay() + 6) % 7) + 1; // 1 = lunes … 7 = domingo
  const tmin = (t) => { if (!t) return 0; const p = t.split(':').map(Number); return p[0] * 60 + (p[1] || 0); };
  const fromMin = (m) => { m = Math.max(0, Math.min(1439, m)); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const dur = (a, b) => (a && b ? Math.max(0, tmin(b) - tmin(a)) : 0);
  const endOf = (o) => o.end || fromMin(tmin(o.start) + 60);
  const appUrl = () => location.href.split('#')[0];

  // ---------- ocurrencias del plan ----------
  function occurrences(date) {
    const p = S.plan; const out = []; const cfg = p.days[wd(date)]; const ov = p.overrides[date] || {};
    if (cfg && cfg.on && !ov.skip) out.push({ key: 'r:' + date, date, kind: 'regular', start: ov.start || cfg.start || '', end: ov.end || cfg.end || '', focus: ov.focus !== undefined ? ov.focus : (cfg.focus || ''), techs: ov.techs || cfg.techs || [] });
    p.extras.filter((e) => e.date === date).forEach((e) => out.push({ key: 'e:' + e.id, date, kind: 'extra', id: e.id, start: e.start || '', end: e.end || '', focus: e.focus || '', techs: e.techs || [] }));
    out.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    const logged = S.sessions.filter((s) => s.date === date).length; // la i-ésima ocurrencia queda hecha si hay más de i sesiones registradas
    out.forEach((o, i) => { o.done = !!p.done[o.key] || logged > i; o.auto = logged > i; });
    return out;
  }
  const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  function pending() {
    const n = S.plan.notif; const t = today();
    return occurrences(t).filter((o) => !o.done && o.start && nowMin() >= tmin(endOf(o)) + (Number(n.afterMin) || 0));
  }
  function next() {
    for (let i = 0; i < 15; i++) {
      const d = ST.addDays(today(), i);
      const o = occurrences(d).find((x) => !x.done && (i > 0 || !x.start || nowMin() < tmin(endOf(x))));
      if (o) return Object.assign({ inDays: i }, o);
    }
    return null;
  }
  const dayLabel = (i, d) => (i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : fmtDate(d));
  const occLine = (o) => (o.start ? o.start + (o.end ? '–' + o.end : '') : 'Sin hora') + (o.focus ? ' · ' + esc(o.focus) : '');

  function prefill(o) {
    return { date: o.date, time: o.start || undefined, duration: dur(o.start, o.end) || '', objective: o.focus || '', techniques: o.techs || [] };
  }
  A.regPlanned = (el) => { const o = occurrences(el.dataset.d).find((x) => x.key === el.dataset.key); APP.sessionForm(o ? prefill(o) : {}); };
  A.dismissWeekly = async () => { S.plan.weeklySeen = ST.weekStart(today()); await save(); rk(); };

  function banner() {
    let h = ''; const t = today();
    pending().forEach((o) => {
      h += '<div class="card" style="border-color:var(--gold)"><h3>¿Cómo ha ido hoy el entrenamiento?</h3><p class="muted small">' + occLine(o) + '</p><button class="btn block" data-act="regPlanned" data-key="' + o.key + '" data-d="' + o.date + '">Registrar ahora</button></div>';
    });
    const n = S.plan.notif;
    if (n.weekly && wd(t) === Number(n.weeklyDay) && nowMin() >= tmin(n.weeklyTime) && S.plan.weeklySeen !== ST.weekStart(t)) {
      h += '<div class="card" style="border-color:var(--gold)"><h3>Revisión semanal</h3><p class="muted small">Es el momento de repasar tu semana.</p><div class="row"><a class="btn block" style="text-decoration:none;text-align:center" href="#/informe">Ver informe</a><button class="btn secondary block" data-act="dismissWeekly">Ya está</button></div></div>';
    }
    const nx = next();
    if (nx && nx.inDays === 0) h += '<div class="card today-card"><div class="row between"><h3>🥋 Hoy entrenas' + (nx.start ? ' a las ' + nx.start : '') + '</h3><a href="#/plan">Plan</a></div><p style="margin:0">' + esc(workText(nx)) + '</p>' + (nx.techs && nx.techs.length ? '<div class="chips" style="margin-top:8px">' + nx.techs.map((x) => '<button class="chip sm" data-act="notesOf" data-name="' + esc(x) + '">📝 ' + esc(APP.tn(x)) + '</button>').join('') + '</div>' : '') + '</div>';
    else h += '<div class="card"><div class="row between"><h3>Próximo entrenamiento</h3><a href="#/plan">Planificación</a></div>' +
      (nx ? '<p style="margin:0"><b>' + dayLabel(nx.inDays, nx.date) + '</b> · ' + occLine(nx) + (nx.kind === 'extra' ? ' <span class="tag">Extra</span>' : '') + '</p>' : '<p class="muted" style="margin:0">' + (Object.keys(S.plan.days).some((k) => S.plan.days[k].on) ? 'No hay entrenamientos pendientes en los próximos días.' : 'Aún no has configurado tus días de entrenamiento.') + ' <a href="#/plan">Configurar</a></p>') + '</div>';
    return h;
  }

  // ---------- notificaciones locales (con la app abierta o en segundo plano reciente) ----------
  function notify(title, body, url, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, tag, icon: 'icon.svg', data: { url } };
    const fallback = () => { try { new Notification(title, opts); } catch (e) { /* ignorado */ } };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(fallback); else fallback();
  }
  // Texto de lo que toca trabajar en una sesión planificada.
  const workText = (o) => [o.focus ? 'Toca trabajar: ' + o.focus : '', o.techs && o.techs.length ? 'Técnicas: ' + o.techs.map(APP.tn).join(', ') : ''].filter(Boolean).join('. ') || 'Sin enfoque definido: decide qué quieres trabajar hoy.';
  function tick() {
    const n = S.plan.notif; if (!n.enabled) return; const t = today(); const nm = nowMin(); let changed = false; const nt = S.plan.notified;
    occurrences(t).forEach((o) => {
      if (o.done || !o.start) return; const k = o.key + ':' + t; const due = tmin(endOf(o)) + (Number(n.afterMin) || 0);
      if (n.before && nm >= tmin(o.start) - (Number(n.beforeMin) || 120) && nm < tmin(o.start) && !nt[k + ':pre']) { notify('Hoy entrenas a las ' + o.start, workText(o), appUrl() + '#/plan', 'pre-' + k); nt[k + ':pre'] = true; changed = true; }
      if (nm >= due && !nt[k + ':post']) { notify('¿Cómo ha ido hoy el entrenamiento?', 'Toca para registrarlo.', appUrl() + '#/registrar', 'post-' + k); nt[k + ':post'] = true; changed = true; }
      if (n.remindUnlogged && nm >= due + (Number(n.remindAfterH) || 1) * 60 && !nt[k + ':again']) { notify('Aún no has registrado el entrenamiento', 'Solo te llevará un minuto.', appUrl() + '#/registrar', 'again-' + k); nt[k + ':again'] = true; changed = true; }
    });
    if (n.weekly && wd(t) === Number(n.weeklyDay) && nm >= tmin(n.weeklyTime) && !nt['w:' + t]) { notify('Revisión semanal', 'Mira cómo ha ido tu semana.', appUrl() + '#/informe', 'weekly'); nt['w:' + t] = true; changed = true; }
    if (n.goals && wd(t) === 1 && nm >= 9 * 60 && !nt['g:' + t]) { notify('Objetivos de la semana', 'Revisa tus objetivos de esta semana.', appUrl() + '#/inicio', 'goals'); nt['g:' + t] = true; changed = true; }
    Object.keys(nt).forEach((k) => { const m = k.match(/\d{4}-\d{2}-\d{2}/); if (m && m[0] < ST.addDays(t, -30)) { delete nt[k]; changed = true; } });
    if (changed) save();
  }

  // ---------- exportar recordatorios al calendario del móvil (.ics) ----------
  const icsEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  function ymd(d) { return d.replace(/-/g, ''); }
  function nextDateOf(w) { for (let i = 0; i < 8; i++) { const d = ST.addDays(today(), i); if (wd(d) === w) return d; } return today(); }
  function buildICS() {
    const p = S.plan, n = p.notif; const BY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BJJ Coach//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:BJJ Coach'];
    function ev(id, w, start, end, summary, desc, alarm, url) {
      const d = ymd(nextDateOf(w)); const hm = (t) => t.replace(':', '') + '00';
      L.push('BEGIN:VEVENT', 'UID:bjjcoach-' + id + '@local', 'DTSTAMP:' + stamp, 'DTSTART:' + d + 'T' + hm(start), 'DTEND:' + d + 'T' + hm(end), 'RRULE:FREQ=WEEKLY;BYDAY=' + BY[w - 1], 'SUMMARY:' + icsEsc(summary), 'DESCRIPTION:' + icsEsc(desc));
      if (url) L.push('URL:' + url);
      L.push('BEGIN:VALARM', 'TRIGGER:-PT' + alarm + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(summary), 'END:VALARM', 'END:VEVENT');
    }
    let count = 0;
    for (let w = 1; w <= 7; w++) {
      const c = p.days[w]; if (!c || !c.on || !c.start) continue; const end = c.end || fromMin(tmin(c.start) + 60); count++;
      ev('t' + w, w, c.start, end, 'Entrenamiento BJJ' + (c.focus ? ': ' + c.focus : ''), workText(c), n.before ? (Number(n.beforeMin) || 120) : 30, '');
      const after = fromMin(tmin(end) + (Number(n.afterMin) || 15));
      ev('p' + w, w, after, fromMin(tmin(after) + 5), '¿Cómo ha ido hoy el entrenamiento?', 'Abre BJJ Coach para registrarlo: ' + appUrl() + '#/registrar', 0, appUrl() + '#/registrar');
    }
    if (n.weekly) ev('w', Number(n.weeklyDay) || 7, n.weeklyTime || '20:00', fromMin(tmin(n.weeklyTime || '20:00') + 10), 'Revisión semanal de BJJ', 'Abre BJJ Coach: ' + appUrl() + '#/informe', 0, appUrl() + '#/informe');
    if (n.goals) ev('g', 1, '09:00', '09:10', 'Objetivos de la semana (BJJ)', 'Revisa tus objetivos en BJJ Coach: ' + appUrl() + '#/inicio', 0, appUrl() + '#/inicio');
    L.push('END:VCALENDAR');
    return { text: L.join('\r\n'), count };
  }
  A.icsExport = () => {
    const r = buildICS(); if (!r.count) return APP.toast('Primero configura al menos un día de entrenamiento con hora de inicio');
    const blob = new Blob([r.text], { type: 'text/calendar' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bjj-coach-recordatorios.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    APP.toast('Archivo de calendario descargado');
  };
  APP.buildICS = buildICS;

  // ---------- vista Planificación ----------
  ui.plan = { month: today().slice(0, 7), sel: today() };
  const dayCfg = (w) => S.plan.days[w] || {};
  function calendar() {
    const ym = ui.plan.month; const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5)); const first = new Date(y, m - 1, 1); const nd = new Date(y, m, 0).getDate(); const lead = (first.getDay() + 6) % 7; const t = today();
    let cells = SHORT.map((s) => '<div class="h">' + s + '</div>').join(''); for (let i = 0; i < lead; i++) cells += '<div></div>';
    for (let d = 1; d <= nd; d++) {
      const date = ym + '-' + String(d).padStart(2, '0'); const oc = occurrences(date);
      const dots = oc.map((o) => '<i class="' + (o.done ? '' : (date < t ? 'miss' : 'plan')) + (o.kind === 'extra' ? ' extra' : '') + '"></i>').join('');
      cells += '<button data-act="calsel" data-d="' + date + '" class="' + (date === ui.plan.sel ? 'sel ' : '') + (date === t ? 'today' : '') + '">' + d + '<span class="dot">' + dots + '</span></button>';
    }
    const monthName = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return '<div class="row between" style="margin-bottom:10px"><button class="icon-btn" data-act="calmonth" data-n="-1" aria-label="Mes anterior">‹</button><b style="text-transform:capitalize">' + monthName + '</b><button class="icon-btn" data-act="calmonth" data-n="1" aria-label="Mes siguiente">›</button></div><div class="cal">' + cells + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">● hecho · ○ pendiente · <span style="color:var(--red)">●</span> no registrado · <span style="color:var(--gold)">●</span> extra</p>';
  }
  function dayDetail() {
    const d = ui.plan.sel; const oc = occurrences(d); const logged = S.sessions.filter((s) => s.date === d);
    return '<div class="card"><div class="row between"><h3 style="text-transform:capitalize">' + fmtDate(d) + '</h3><button class="btn small ghost" data-act="addExtra">+ Extra</button></div>' +
      (oc.length ? '<div class="list">' + oc.map((o) => '<div class="item" style="flex-direction:column;align-items:stretch"><div class="row between"><div><div class="title">' + (o.done ? '✔ ' : '') + occLine(o) + '</div>' + (o.techs && o.techs.length ? '<div class="pill-n">' + esc(o.techs.join(', ')) + '</div>' : '') + '</div>' + (o.kind === 'extra' ? '<span class="tag">Extra</span>' : '') + '</div>' +
        '<div class="row wrap" style="margin-top:8px">' + (o.auto ? '<span class="pill-n">Registrado</span>' : '<button class="btn small secondary" data-act="occdone" data-key="' + o.key + '">' + (S.plan.done[o.key] ? 'Deshacer hecho' : 'Marcar hecho') + '</button>') +
        '<button class="btn small ghost" data-act="editOcc" data-key="' + o.key + '">Editar</button>' + (o.kind === 'regular' ? '<button class="btn small ghost" data-act="skipOcc" data-d="' + d + '">Saltar este día</button>' : '<button class="btn small ghost" data-act="delExtra" data-id="' + o.id + '">Quitar</button>') + '</div></div>').join('') + '</div>' : '<p class="muted">' + (S.plan.overrides[d] && S.plan.overrides[d].skip ? 'Entrenamiento saltado este día. <button class="btn small ghost" data-act="unskip" data-d="' + d + '">Restaurar</button>' : 'Descanso. No hay entrenamientos planificados.') + '</p>') +
      (logged.length ? '<p class="small muted" style="margin-top:10px">Sesiones registradas: ' + logged.map((s) => '<a href="#/entreno/' + s.id + '">' + esc(s.type || 'Entrenamiento') + '</a>').join(', ') + '</p>' : '') + '</div>';
  }
  V.plan = () => {
    const daysOn = [1, 2, 3, 4, 5, 6, 7].filter((w) => dayCfg(w).on);
    const goals = S.goals.filter((g) => !g.done); const n = S.plan.notif;
    const perm = 'Notification' in window ? Notification.permission : 'no disponible';
    let h = '<div class="card"><h3>Mis días de entrenamiento</h3><div class="explain">Toca un día para configurarlo: hora, enfoque técnico y técnicas a trabajar. Los días sin marcar son de descanso.</div><div class="list">' +
      DAYS.map((nm, i) => { const c = dayCfg(i + 1); return '<a href="#" class="item" data-act="editDay" data-w="' + (i + 1) + '" style="text-decoration:none;color:inherit"><div><div class="title">' + nm + '</div><div class="pill-n">' + (c.on ? (c.start ? c.start + (c.end ? '–' + c.end : '') : 'Sin hora') + (c.focus ? ' · ' + esc(c.focus) : '') : 'Descanso') + '</div></div><span class="muted">›</span></a>'; }).join('') + '</div>' +
      '<button class="btn secondary block" style="margin-top:10px" data-act="suggestFocus">Sugerir enfoque por día según mis datos</button></div>';
    h += '<div class="card"><h3>Calendario</h3>' + calendar() + '</div>' + dayDetail();
    h += '<div class="card"><div class="row between"><h3>Objetivos</h3><button class="btn small ghost" data-act="addGoal">+ Añadir</button></div>' +
      (goals.length ? '<div class="list">' + goals.map((g) => '<div class="item"><div><div class="title">' + esc(g.text) + '</div><div class="pill-n">' + (g.period === 'month' ? 'Mensual' : 'Semanal') + '</div></div><div class="row"><button class="btn small secondary" data-act="goalDone" data-id="' + g.id + '">Hecho</button><button class="icon-btn" style="width:34px;height:34px" data-act="goalDel" data-id="' + g.id + '" aria-label="Borrar">✕</button></div></div>').join('') + '</div>' : '<p class="muted">Sin objetivos activos.</p>') +
      '<button class="btn secondary block" style="margin-top:10px" data-act="suggest">Sugerir objetivos según mis datos</button></div>';
    h += '<div class="card"><h3>Recordatorios</h3><div class="explain">Una app web no puede lanzar avisos programados con la app cerrada sin servidores de pago. Por eso hay dos vías: (1) avisos dentro de la app al abrirla, y notificaciones del navegador mientras esté abierta; (2) <b>exportar al calendario del móvil</b>, que sí avisa con la app cerrada y es gratis. En iPhone las notificaciones del navegador son más limitadas.</div>' +
      '<div class="list"><div class="item"><div>Avisos activados</div><b>' + (n.enabled ? 'Sí' : 'No') + '</b></div><div class="item"><div>Antes del entrenamiento (qué toca trabajar)</div><b>' + (n.before ? (n.beforeMin >= 60 && n.beforeMin % 60 === 0 ? n.beforeMin / 60 + ' h antes' : n.beforeMin + ' min antes') : 'No') + '</b></div><div class="item"><div>Aviso tras el entrenamiento</div><b>' + n.afterMin + ' min después</b></div><div class="item"><div>Recordar si no registro</div><b>' + (n.remindUnlogged ? 'a las ' + n.remindAfterH + ' h' : 'No') + '</b></div><div class="item"><div>Revisión semanal</div><b>' + (n.weekly ? DAYS[n.weeklyDay - 1] + ' ' + n.weeklyTime : 'No') + '</b></div><div class="item"><div>Recordatorio de objetivos</div><b>' + (n.goals ? 'Lunes 09:00' : 'No') + '</b></div><div class="item"><div>Permiso del navegador</div><b>' + perm + '</b></div></div>' +
      '<div class="stack" style="margin-top:10px"><button class="btn block" data-act="notifForm">Configurar avisos</button>' + (perm === 'default' ? '<button class="btn secondary block" data-act="askPerm">Permitir notificaciones del navegador</button>' : '') + '<button class="btn secondary block" data-act="icsExport">Exportar recordatorios al calendario (.ics)</button></div></div>';
    h += '<a class="btn ghost block" style="text-decoration:none;text-align:center" href="#/mensual">Ver informe mensual</a>';
    return h;
  };
  A.calsel = (el) => { ui.plan.sel = el.dataset.d; rk(); };
  A.calmonth = (el) => { const p = ui.plan.month.split('-').map(Number); const d = new Date(p[0], p[1] - 1 + Number(el.dataset.n), 1); ui.plan.month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); rk(); };
  A.occdone = async (el) => { const k = el.dataset.key; if (S.plan.done[k]) delete S.plan.done[k]; else S.plan.done[k] = true; await save(); rk(); };
  A.skipOcc = async (el) => { const d = el.dataset.d; S.plan.overrides[d] = Object.assign({}, S.plan.overrides[d], { skip: true }); await save(); rk(); };
  A.unskip = async (el) => { const d = el.dataset.d; if (S.plan.overrides[d]) delete S.plan.overrides[d].skip; await save(); rk(); };
  A.delExtra = async (el) => { S.plan.extras = S.plan.extras.filter((e) => e.id !== el.dataset.id); await save(); rk(); };

  const timeFields = (s, e) => '<div class="grid2">' + field('Empieza', '<input type="time" id="pl-start" value="' + esc(s || '') + '">') + field('Termina', '<input type="time" id="pl-end" value="' + esc(e || '') + '">') + '</div>';
  A.editDay = (el) => {
    const w = Number(el.dataset.w); const c = dayCfg(w);
    APP.openSheet(DAYS[w - 1], group('¿Entrenas este día?', chips('dayon', [{ v: '1', l: 'Entreno' }, { v: '0', l: 'Descanso' }], c.on ? '1' : '0')) + timeFields(c.start, c.end) + field('Enfoque técnico del día', '<input id="pl-focus" placeholder="Ej.: guardia y retención" value="' + esc(c.focus || '') + '">') +
      group('Técnicas a trabajar', tagField('pltechs', c.techs || [], 'dl-tech')) + '<button class="btn block" data-act="saveDay" data-w="' + w + '">Guardar</button>');
  };
  A.saveDay = async (el) => {
    const w = Number(el.dataset.w); const on = sel('dayon')[0] === '1';
    S.plan.days[w] = { on, start: val('pl-start'), end: val('pl-end'), focus: val('pl-focus').trim(), techs: tags('pltechs') };
    await save(); APP.closeSheet(); rk();
  };
  A.addExtra = () => APP.openSheet('Entrenamiento extraordinario', field('Fecha', '<input type="date" id="ex-date" value="' + ui.plan.sel + '">') + timeFields('', '') + field('Enfoque', '<input id="pl-focus" placeholder="Opcional">') + group('Técnicas', tagField('pltechs', [], 'dl-tech')) + '<button class="btn block" data-act="saveExtra">Guardar</button>');
  A.saveExtra = async () => {
    const date = val('ex-date') || today(); S.plan.extras.push({ id: uid(), date, start: val('pl-start'), end: val('pl-end'), focus: val('pl-focus').trim(), techs: tags('pltechs') });
    ui.plan.sel = date; ui.plan.month = date.slice(0, 7); await save(); APP.closeSheet(); rk();
  };
  A.editOcc = (el) => {
    const d = ui.plan.sel; const o = occurrences(d).find((x) => x.key === el.dataset.key); if (!o) return;
    APP.openSheet('Editar ' + (o.kind === 'extra' ? 'entrenamiento extra' : 'este día') + ' · ' + fmtDate(d), timeFields(o.start, o.end) + field('Enfoque', '<input id="pl-focus" value="' + esc(o.focus) + '">') + group('Técnicas / objetivos técnicos de la sesión', tagField('pltechs', o.techs, 'dl-tech')) +
      '<p class="small muted">' + (o.kind === 'regular' ? 'El cambio solo afecta a este día; tu horario habitual no se toca.' : '') + '</p><button class="btn block" data-act="saveOcc" data-key="' + o.key + '">Guardar</button>' + (o.kind === 'regular' && S.plan.overrides[d] ? '<button class="btn ghost block" style="margin-top:8px" data-act="resetOcc">Quitar ajustes de este día</button>' : ''));
  };
  A.saveOcc = async (el) => {
    const d = ui.plan.sel; const key = el.dataset.key; const v = { start: val('pl-start'), end: val('pl-end'), focus: val('pl-focus').trim(), techs: tags('pltechs') };
    if (key.startsWith('e:')) { const e = S.plan.extras.find((x) => x.id === key.slice(2)); if (e) Object.assign(e, v); } else S.plan.overrides[d] = Object.assign({}, S.plan.overrides[d], v);
    await save(); APP.closeSheet(); rk();
  };
  A.resetOcc = async () => { delete S.plan.overrides[ui.plan.sel]; await save(); APP.closeSheet(); rk(); };

  // ---------- objetivos y enfoque sugeridos ----------
  const dataForCoach = () => ({ rounds: S.rounds, sessions: S.sessions, mastery: S.mastery, lib: S.lib });
  const AREA_FOCUS = { defensa: 'Defensa y escapes', escapes: 'Escapes', retencion: 'Guardia y retención', pases: 'Pases de guardia', finalizaciones: 'Finalizaciones y encadenados', derribos: 'Derribos y lucha de pie', practicar: 'Repaso de técnicas en aprendizaje' };
  const GENERIC = ['Guardia y retención', 'Escapes y defensa', 'Pases y finalizaciones'];
  A.suggest = () => {
    const daysOn = [1, 2, 3, 4, 5, 6, 7].filter((w) => dayCfg(w).on).length || 3; const all = ST.suggestGoals(dataForCoach(), today()); const list = all.slice(0, Math.max(1, Math.min(4, daysOn)));
    ui.sugg = list;
    APP.openSheet('Objetivos sugeridos', '<div class="explain">Se calculan con tus registros y se limitan a ' + list.length + ' según tus ' + daysOn + ' días de entrenamiento por semana.</div><div class="list">' + list.map((g, i) => '<div class="item" style="align-items:flex-start"><div><span class="tag recomendacion">Recomendación</span><p style="margin:6px 0 2px"><b>' + esc(g.text) + '</b></p><p class="small muted" style="margin:0"><span class="tag dato">Dato</span> ' + esc(g.why) + ' <span class="pill-n">(n = ' + g.n + ')</span></p></div><button class="btn small" data-act="addSugg" data-i="' + i + '">Añadir</button></div>').join('') + '</div>');
  };
  A.addSugg = async (el) => { const g = ui.sugg[Number(el.dataset.i)]; if (!g) return; await APP.saveGoal({ id: uid(), text: g.text, period: ui.suggPeriod || 'week', done: false, created: today() }); el.textContent = '✔'; el.disabled = true; APP.toast('Objetivo añadido'); };
  A.suggestFocus = () => {
    const days = [1, 2, 3, 4, 5, 6, 7].filter((w) => dayCfg(w).on);
    if (!days.length) return APP.toast('Primero marca tus días de entrenamiento');
    const sg = ST.suggestGoals(dataForCoach(), today()); const areas = Array.from(new Set(sg.filter((g) => AREA_FOCUS[g.area]).map((g) => AREA_FOCUS[g.area])));
    const generic = !areas.length; const pool = generic ? GENERIC : areas; const plan = {};
    days.forEach((w, i) => { plan[w] = pool[i % pool.length]; });
    ui.focusPlan = plan;
    APP.openSheet('Enfoque sugerido por día', '<div class="explain">' + (generic ? 'Todavía no hay datos tuyos suficientes: es una rotación genérica equilibrada, no una recomendación personalizada.' : 'Basado en tus puntos débiles detectados (' + sg.slice(0, 3).map((g) => g.n).join(', ') + ' observaciones).') + '</div><div class="list">' + days.map((w) => '<div class="item"><div class="title">' + DAYS[w - 1] + '</div><div>' + esc(plan[w]) + '</div></div>').join('') + '</div><button class="btn block" style="margin-top:12px" data-act="applyFocus">Aplicar a mi plan</button>');
  };
  A.applyFocus = async () => { Object.keys(ui.focusPlan).forEach((w) => { S.plan.days[w] = Object.assign({}, S.plan.days[w], { focus: ui.focusPlan[w] }); }); await save(); APP.closeSheet(); rk(); };

  // ---------- configuración de avisos ----------
  A.notifForm = () => {
    const n = S.plan.notif; const yn = (g, v) => chips(g, [{ v: '1', l: 'Sí' }, { v: '0', l: 'No' }], v ? '1' : '0');
    APP.openSheet('Avisos y recordatorios', group('Avisos dentro de la app y del navegador', yn('nen', n.enabled)) + group('Avisar antes de entrenar con lo que toca trabajar', yn('nbef', n.before)) + field('Minutos antes (120 = 2 horas)', '<input type="number" id="nf-before" min="5" max="720" value="' + (n.beforeMin || 120) + '">') + field('Minutos después de terminar para preguntar «¿Cómo ha ido hoy el entrenamiento?»', '<input type="number" id="nf-after" min="0" max="240" value="' + n.afterMin + '">') +
      group('Recordármelo otra vez si no lo registro', yn('nrem', n.remindUnlogged)) + field('Horas después', '<input type="number" id="nf-again" min="1" max="24" value="' + n.remindAfterH + '">') + group('Revisión semanal', yn('nweek', n.weekly)) +
      '<div class="grid2">' + field('Día', '<select id="nf-wday">' + DAYS.map((d, i) => '<option value="' + (i + 1) + '"' + (Number(n.weeklyDay) === i + 1 ? ' selected' : '') + '>' + d + '</option>').join('') + '</select>') + field('Hora', '<input type="time" id="nf-wtime" value="' + n.weeklyTime + '">') + '</div>' +
      group('Recordatorio de objetivos (lunes 09:00)', yn('ngoal', n.goals)) + '<button class="btn block" data-act="saveNotif">Guardar</button>');
  };
  A.saveNotif = async () => {
    const n = S.plan.notif; n.enabled = sel('nen')[0] === '1'; n.before = sel('nbef')[0] === '1'; n.beforeMin = Number(val('nf-before')) || 120; n.afterMin = Number(val('nf-after')) || 0; n.remindUnlogged = sel('nrem')[0] === '1'; n.remindAfterH = Number(val('nf-again')) || 1; n.weekly = sel('nweek')[0] === '1'; n.weeklyDay = Number(val('nf-wday')) || 7; n.weeklyTime = val('nf-wtime') || '20:00'; n.goals = sel('ngoal')[0] === '1';
    await save(); APP.closeSheet();
    if (n.enabled && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) { /* ignorado */ } }
    APP.toast('Avisos guardados'); rk();
  };
  A.askPerm = async () => { try { const r = await Notification.requestPermission(); APP.toast(r === 'granted' ? 'Notificaciones permitidas' : 'Permiso no concedido'); } catch (e) { APP.toast('No disponible en este navegador'); } rk(); };

  // ---------- registrar (enlace directo desde la notificación) ----------
  V.registrar = () => {
    setTimeout(() => { history.replaceState(null, '', '#/inicio'); const o = occurrences(today()).find((x) => !x.done); APP.sessionForm(o ? prefill(o) : {}); }, 0);
    return V.inicio();
  };

  // ---------- informe mensual ----------
  V.mensual = (arg) => {
    const ym = arg && /^\d{4}-\d{2}$/.test(arg) ? arg : today().slice(0, 7); const r = ST.monthlyReport({ sessions: S.sessions, rounds: S.rounds, goals: S.goals, mastery: S.mastery, lib: S.lib }, ym, today());
    const name = (m) => ST.parse(m + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const nextYm = (() => { const p = ym.split('-').map(Number); const d = new Date(p[0], p[1], 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
    const diff = (a, b) => { const d = a - b; return (d > 0 ? '+' : '') + d; };
    const row = (l, a, b) => '<div class="item"><div>' + l + '</div><div><b>' + a + '</b> <span class="pill-n">vs ' + b + ' ' + name(r.prevYm).split(' ')[0] + '</span></div></div>';
    const effS = (e) => (e.total ? e.pct + '% (' + e.success + '/' + e.total + ')' : '—');
    ui.monthPlan = r.nextPlan;
    let h = '<div class="row between" style="margin-bottom:12px"><a class="btn small ghost" style="text-decoration:none" href="#/mensual/' + r.prevYm + '">← ' + name(r.prevYm).split(' ')[0] + '</a><b style="text-transform:capitalize">' + name(ym) + '</b><a class="btn small ghost" style="text-decoration:none" href="#/mensual/' + nextYm + '">Siguiente →</a></div>';
    if (!r.sessions && !r.rounds) return h + '<div class="card empty"><p>No hay registros en este mes.</p></div>';
    h += '<div class="card"><h3>Evolución general</h3><div class="list">' + row('Entrenamientos', r.sessions, r.prevSessions) + row('Minutos', r.minutes, r.prevMinutes) + row('Rounds', r.rounds, r.prevRounds) + (r.roundMinutes || r.prevRoundMinutes ? row('Minutos de sparring', r.roundMinutes, r.prevRoundMinutes) : '') + row('Finalizaciones realizadas', r.subsMade, r.prevSubsMade) + row('Finalizaciones recibidas', r.subsRecv, r.prevSubsRecv) + row('Eficacia de finalizaciones', effS(r.subEff), effS(r.prevSubEff)) + row('Eficacia de pases', effS(r.passEff), effS(r.prevPassEff)) + row('Eficacia de escapes', effS(r.escapeEff), effS(r.prevEscapeEff)) + (r.avgRating ? row('Valoración media de sesiones', r.avgRating + '/10 (n = ' + r.ratedN + ')', '—') : '') + '</div>' +
      '<div class="explain">Compara siempre el número entre paréntesis: con pocos intentos, una diferencia de porcentaje no significa mejora ni empeoramiento.' + (r.subEff.total < 8 || r.prevSubEff.total < 8 ? ' <b>Aquí hay pocos intentos de finalización (' + r.subEff.total + ' y ' + r.prevSubEff.total + '), así que no se puede afirmar si has mejorado.</b>' : '') + '</div></div>';
    const chipsOf = (arr, f) => arr.length ? '<div class="chips">' + arr.map(f).join('') + '</div>' : '<p class="muted small">Nada que destacar con los datos de este mes.</p>';
    h += '<div class="card"><h3>Técnicas más trabajadas</h3>' + APP.rank(r.topTechniques, { empty: 'Nada que destacar con los datos de este mes.' }) + '<h3 style="margin-top:14px">Finalizaciones más usadas</h3>' + APP.rank(r.mostUsedSubs, { cls: 'gold', empty: 'Nada que destacar con los datos de este mes.' }) +
      '<h3 style="margin-top:14px">Más efectivas (mín. 3 intentos)</h3>' + chipsOf(r.mostEffective, (x) => '<span class="tag">' + esc(APP.tn(x.tech)) + ' ' + x.success + '/' + x.total + ' (' + x.pct + '%)</span>') + '</div>';
    h += '<div class="card"><h3>Errores recurrentes</h3>' + chipsOf(r.recurringErrors, (x) => '<span class="tag patron">' + esc(x.key) + ' ×' + x.n + '</span>') + '<h3 style="margin-top:14px">Nuevas fortalezas</h3>' + chipsOf(r.newStrengths, (x) => '<span class="tag recomendacion">' + esc(APP.tn(x.key)) + ' ×' + x.n + '</span>') + '<p class="small muted" style="margin-top:6px">Finalizaciones que no habías conseguido antes de este mes y has repetido al menos 2 veces.</p>' +
      '<h3 style="margin-top:14px">Objetivos conseguidos</h3>' + (r.goalsDone.length ? '<ul style="margin:0;padding-left:18px">' + r.goalsDone.map((g) => '<li>' + esc(g.text) + '</li>').join('') + '</ul>' : '<p class="muted small">Ninguno marcado como hecho este mes.</p>') + '</div>';
    h += '<div class="card"><h3>Plan recomendado para el mes siguiente</h3><div class="list">' + r.nextPlan.slice(0, 4).map((g, i) => '<div class="item" style="align-items:flex-start"><div><span class="tag recomendacion">Recomendación</span><p style="margin:6px 0 2px"><b>' + esc(g.text) + '</b></p><p class="small muted" style="margin:0">' + esc(g.why) + ' <span class="pill-n">(n = ' + g.n + ')</span></p></div><button class="btn small" data-act="addMonthGoal" data-i="' + i + '">Añadir</button></div>').join('') + '</div></div>';
    return h;
  };
  A.addMonthGoal = async (el) => { const g = (ui.monthPlan || [])[Number(el.dataset.i)]; if (!g) return; await APP.saveGoal({ id: uid(), text: g.text, period: 'month', done: false, created: today() }); el.textContent = '✔'; el.disabled = true; APP.toast('Objetivo mensual añadido'); };

  APP.plan = { occurrences, next, pending, banner, tick, wd, buildICS, prefill };
})();
