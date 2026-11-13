/* Nutrición: diario de comidas, objetivo de calorías y macros según tus entrenos, recetas, menú semanal y lista de la compra. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S, DB = window.BJJFood || { foods: [], recipes: [] };
  const { esc, uid, today, fmtDate, field, group, chips, sel, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  Object.assign(APP.titles, { nutri: 'Nutrición' });
  const num = (v) => Number(String(v === undefined || v === null ? '' : v).replace(',', '.')) || 0;
  const r0 = Math.round, r1 = (x) => Math.round(x * 10) / 10;

  const N = () => S.food || (S.food = { profile: null, mode: 'avg', log: {}, custom: [], menu: null, shop: {}, goalPlan: null, photos: {} });
  const saveFood = () => APP.saveMeta('food', N());
  const MEALS = [['desayuno', 'Desayuno', '🌅'], ['almuerzo', 'Media mañana', '🍏'], ['comida', 'Comida', '🍽️'], ['merienda', 'Merienda', '🥪'], ['cena', 'Cena', '🌙']];
  const CATS = { carne: 'Carnes', pescado: 'Pescados y mariscos', huevos: 'Huevos', lacteos: 'Lácteos', cereales: 'Cereales, pan, pasta y patata', legumbres: 'Legumbres y proteína vegetal', verduras: 'Verduras', frutas: 'Frutas', frutos: 'Frutos secos y semillas', grasas: 'Aceites y grasas', otros: 'Otros', suplementos: 'Suplementos' };
  const allFoods = () => DB.foods.concat(N().custom || []);
  const food = (id) => allFoods().find((f) => f.id === id);
  const recipe = (id) => DB.recipes.find((r) => r.id === id);
  const mac = (f, g) => ({ k: f.k * g / 100, p: f.p * g / 100, f: f.f * g / 100, h: f.h * g / 100 });
  const sum = (arr) => arr.reduce((a, x) => ({ k: a.k + (x.k || 0), p: a.p + (x.p || 0), f: a.f + (x.f || 0), h: a.h + (x.h || 0) }), { k: 0, p: 0, f: 0, h: 0 });
  const recMac = (r) => { const t = sum(r.i.map((x) => mac(food(x[0]), x[1]))); return { k: t.k / r.s, p: t.p / r.s, f: t.f / r.s, h: t.h / r.s }; };
  const recFlags = (r) => { const fs = r.i.map((x) => food(x[0])); return { vg: fs.every((f) => f.vg), vt: fs.every((f) => f.vt), glu: fs.some((f) => f.glu), lac: fs.some((f) => f.lac) }; };
  const fits = (fl, p) => { p = p || {}; return (p.diet !== 'vegana' || fl.vg) && (p.diet !== 'vegetariana' || fl.vt) && (!p.noGluten || !fl.glu) && (!p.noLactose || !fl.lac); };
  const macLine = (m) => r0(m.k) + ' kcal · P ' + r0(m.p) + ' g · H ' + r0(m.h) + ' g · G ' + r0(m.f) + ' g';

  // ---------- gasto y objetivos ----------
  const NEAT = [['1.2', 'Sentado casi todo el día'], ['1.35', 'De pie o caminando parte del día'], ['1.5', 'Trabajo físico o muy activo'], ['1.7', 'Trabajo físico intenso']];
  const GOALS = [['perder', 'Perder grasa'], ['mantener', 'Mantener'], ['ganar', 'Ganar músculo']];
  const PACE = { perder: [['-0.10', 'Suave (−10%)'], ['-0.20', 'Estándar (−20%)'], ['-0.25', 'Rápido (−25%)']], ganar: [['0.05', 'Suave (+5%)'], ['0.10', 'Estándar (+10%)'], ['0.15', 'Rápido (+15%)']], mantener: [['0', 'Mantenimiento']] };
  const weightNow = () => (APP.gym && APP.gym.latestWeight()) || (N().profile && N().profile.weight) || (S.body && S.body.weight) || 0;
  // Mifflin-St Jeor (1990): 10·peso + 6,25·altura − 5·edad + 5 (hombres) o − 161 (mujeres). sex: 'h' hombre, 'm' mujer.
  const bmr = (p, kg) => 10 * kg + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? -161 : 5);
  // MET del Compendium of Physical Activities (2024). Gasto neto = (MET − 1) × kg × horas, porque el reposo ya está en el metabolismo basal.
  const bjjMet = (intensity) => { const i = Number(intensity) || 3; return 5.3 + ((Math.max(1, Math.min(5, i)) - 1) / 4) * (10.3 - 5.3); }; // 5,3 (ritmo suave) a 10,3 (ritmo de combate)
  const gymMet = (rpe) => { const r = Number(rpe) || 3; return r <= 2 ? 3.5 : r === 3 ? 5.0 : 6.0; };
  const net = (met, kg, min) => Math.max(0, met - 1) * kg * (min / 60);
  const span = (a, b) => (a && b ? Math.max(0, (Number(b.slice(0, 2)) * 60 + Number(b.slice(3))) - (Number(a.slice(0, 2)) * 60 + Number(a.slice(3)))) : 0) || 90;
  function exerciseOn(date, kg) {
    const out = []; S.sessions.filter((s) => s.date === date && Number(s.duration) > 0).forEach((s) => out.push({ what: 'BJJ', min: Number(s.duration), kcal: net(bjjMet(s.intensity), kg, Number(s.duration)) }));
    ((S.gym && S.gym.logs) || []).filter((l) => l.date === date && l.duration > 0).forEach((l) => out.push({ what: 'Gimnasio', min: l.duration, kcal: net(gymMet(l.rpe), kg, l.duration) }));
    if (!out.length && date >= today() && APP.plan) APP.plan.occurrences(date).filter((o) => !o.done).forEach((o) => { const m = span(o.start, o.end); out.push({ what: 'BJJ (planificado)', min: m, kcal: net(bjjMet(3), kg, m), planned: true }); });
    return out;
  }
  function exerciseAvg(kg) {
    const t = today(); let kcal = 0, n = 0, bj = 0, gy = 0;
    for (let i = 1; i <= 28; i++) { const d = ST.addDays(t, -i); S.sessions.filter((s) => s.date === d && Number(s.duration) > 0).forEach((s) => { kcal += net(bjjMet(s.intensity), kg, Number(s.duration)); n++; bj++; }); ((S.gym && S.gym.logs) || []).filter((l) => l.date === d && l.duration > 0).forEach((l) => { kcal += net(gymMet(l.rpe), kg, l.duration); n++; gy++; }); }
    if (n >= 4) return { perDay: kcal / 28, source: 'registros', n, text: 'Media de tus últimos 28 días: ' + bj + ' entrenos de BJJ y ' + gy + ' de gimnasio con duración registrada.' };
    const days = Object.keys(S.plan.days).map((k) => S.plan.days[k]).filter((d) => d.on); let pk = 0;
    days.forEach((d) => { pk += net(bjjMet(3), kg, span(d.start, d.end)); });
    const gp = S.gym && S.gym.profile; if (gp) pk += gp.days * net(gymMet(3), kg, gp.minutes || 45);
    if (pk > 0) return { perDay: pk / 7, source: 'plan', n: days.length + (gp ? gp.days : 0), text: 'Estimado con tu planificación: ' + days.length + ' días de BJJ' + (gp ? ' y ' + gp.days + ' de preparación física' : '') + ' por semana. Cuando registres entrenos con su duración se usará lo que hagas de verdad.' };
    return { perDay: 0, source: 'ninguno', n: 0, text: 'No hay entrenos registrados ni planificados: solo se cuenta tu actividad diaria.' };
  }
  function targets(date) {
    const p = N().profile; const kg = weightNow(); if (!p || !kg || !p.height || !p.age) return null;
    const b = bmr(p, kg); const base = b * Number(p.neat || 1.2); const avg = exerciseAvg(kg); const dayEx = exerciseOn(date || today(), kg);
    const ex = N().mode === 'day' ? dayEx.reduce((a, x) => a + x.kcal, 0) : avg.perDay; const tdee = base + ex;
    let pct = p.goal === 'mantener' ? 0 : Number(p.pace || 0); const minor = p.age < 18; if (minor && pct < 0) pct = 0;
    const gp = N().goalPlan; let planNote = '';
    if (gp && gp.targetKg && gp.weeks && !minor) { const perDay = ((gp.targetKg - gp.startKg) * 7700) / (gp.weeks * 7); const raw = perDay / (base + avg.perDay); pct = Math.max(-0.25, Math.min(0.15, raw)); if (Math.abs(raw - pct) > 0.005) planNote = 'El plan pide un ritmo mayor del recomendable; el ajuste de calorías se ha limitado a ' + r0(pct * 100) + '%.'; }
    const floor = Math.max(b, p.sex === 'm' ? 1200 : 1500); let kcal = tdee * (1 + pct); let floored = false; if (kcal < floor) { kcal = floor; floored = true; }
    const pk = p.goal === 'perder' ? 2.2 : p.goal === 'ganar' ? 2.0 : 1.8; const prot = pk * kg; const fat = Math.max(0.6 * kg, (kcal * 0.25) / 9); const carb = Math.max(0, (kcal - prot * 4 - fat * 9) / 4);
    return { kcal: r0(kcal), p: r0(prot), f: r0(fat), h: r0(carb), fiber: r0((kcal / 1000) * 14), bmr: r0(b), base: r0(base), ex: r0(ex), tdee: r0(tdee), pct, avg, dayEx, kg, pk, floored, minor, planNote };
  }
  APP.nutri = { targets, exerciseAvg, exerciseOn, bmr, bjjMet, gymMet, net, food, recipe, recMac, dayTotal: (d) => sum(N().log[d] || []) };

  // ---------- diario ----------
  ui.nutri = { date: today(), q: '', meal: 'comida', target: 'log' };
  const dayLog = (d) => N().log[d] || [];
  const bar = (label, v, t, color, unit) => '<div class="bar"><div class="meta"><span>' + label + '</span><span><b>' + r0(v) + '</b> / ' + t + ' ' + (unit || 'g') + '</span></div><div class="track"><div class="fill" style="width:' + Math.min(100, ST.pct(v, t || 1)) + '%;background:' + color + '"></div></div></div>';
  function diary() {
    const d = ui.nutri.date; const log = dayLog(d); const tot = sum(log); const t = targets(d);
    let h = '<div class="row between" style="margin-bottom:10px"><button class="icon-btn" data-act="nDay" data-n="-1" aria-label="Día anterior">‹</button><b style="text-transform:capitalize">' + (d === today() ? 'Hoy' : fmtDate(d)) + '</b><button class="icon-btn" data-act="nDay" data-n="1" aria-label="Día siguiente">›</button></div>';
    if (!t) h += '<div class="card hero"><h2>Calcula tu objetivo</h2><p class="muted">Dime tus datos y tu objetivo y calculo las calorías y los macronutrientes que necesitas según tus entrenos de BJJ y de gimnasio.</p><button class="btn secondary" data-act="nProfile">Empezar</button></div>';
    const left = t ? t.kcal - tot.k : 0;
    h += '<div class="card"><div class="kpis">' + APP.ring(t ? ST.pct(Math.min(tot.k, t.kcal), t.kcal) : 0, String(r0(tot.k)), t ? 'de ' + t.kcal + ' kcal' : 'kcal', t && tot.k > t.kcal * 1.05 ? 'var(--red)' : 'var(--green-2)') +
      (t ? '<div class="kpi"><div class="big" style="font-size:26px;color:' + (left < 0 ? 'var(--red)' : 'var(--ink)') + '">' + Math.abs(r0(left)) + '</div><div class="label">kcal ' + (left < 0 ? 'de más' : 'restantes') + '</div></div><div class="kpi"><div class="big" style="font-size:26px">' + t.ex + '</div><div class="label">kcal de entreno' + (N().mode === 'day' ? ' este día' : ' (media)') + '</div></div>' : '<div class="kpi"><div class="label">Sin objetivo todavía</div></div>') + '</div>' +
      (t ? bar('Proteína', tot.p, t.p, 'var(--red)') + bar('Hidratos', tot.h, t.h, 'var(--gold)') + bar('Grasas', tot.f, t.f, 'var(--blue)') + '<a href="#/nutri/objetivo" class="small">Ver cómo se calcula</a>' : '<p class="small muted">' + macLine(tot) + '</p>') + '</div>';
    h += '<div class="tiles t4"><a class="tile" href="#/nutri/objetivo"><span class="ico">🎯</span><b>Objetivo</b></a><a class="tile" href="#/nutri/recetas"><span class="ico">👩‍🍳</span><b>Recetas</b></a><a class="tile" href="#/nutri/menu"><span class="ico">🗓️</span><b>Menú</b></a><a class="tile" href="#/nutri/compra"><span class="ico">🛒</span><b>Compra</b></a></div>';
    MEALS.forEach((m) => {
      const es = log.filter((e) => e.meal === m[0]); const mt = sum(es);
      h += '<div class="card"><div class="row between"><h3>' + m[2] + ' ' + m[1] + (es.length ? ' <span class="pill-n">' + r0(mt.k) + ' kcal</span>' : '') + '</h3><button class="btn small" data-act="nAdd" data-meal="' + m[0] + '">+ Añadir</button></div>' +
        (es.length ? '<div class="list">' + es.map((e) => '<a href="#" class="item" data-act="nEntry" data-id="' + e.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(e.name) + '</div><div class="pill-n">' + esc(e.qty) + ' · P ' + r0(e.p) + ' · H ' + r0(e.h) + ' · G ' + r0(e.f) + '</div></div><b>' + r0(e.k) + '</b></a>').join('') + '</div>' : '') + '</div>';
    });
    if (t && log.length) h += suggest(t, tot);
    if (!log.length) { const y = dayLog(ST.addDays(d, -1)); const menuDay = N().menu && N().menu.days[APP.plan.wd(d)]; h += '<div class="stack">' + (menuDay ? '<button class="btn secondary block" data-act="nFromMenu">Registrar el menú de este día</button>' : '') + (y.length ? '<button class="btn ghost block" data-act="nCopyPrev">Copiar lo que comí el día anterior</button>' : '') + '</div>'; }
    return h;
  }
  // Sugerencias según lo que falta hoy (datos del diario frente al objetivo).
  function suggest(t, tot) {
    const p = N().profile || {}; const needP = t.p - tot.p, needK = t.kcal - tot.k; let h = '';
    if (needP > 15 && needK > 100) {
      const fs = allFoods().filter((f) => fits(f, p) && f.p >= 10 && f.c !== 'otros').map((f) => ({ f, d: (f.p * 4) / Math.max(1, f.k) })).sort((a, b) => b.d - a.d).slice(0, 5);
      const rs = DB.recipes.filter((r) => fits(recFlags(r), p)).map((r) => ({ r, m: recMac(r) })).filter((x) => x.m.k <= needK * 1.1).sort((a, b) => b.m.p / b.m.k - a.m.p / a.m.k).slice(0, 3);
      h = '<div class="card"><span class="tag dato">Dato</span> <span class="pill-n">Te faltan ' + r0(needP) + ' g de proteína y ' + r0(needK) + ' kcal para tu objetivo de hoy.</span><p style="margin:8px 0 6px"><span class="tag recomendacion">Recomendación</span> Opciones que encajan:</p><div class="chips">' + fs.map((x) => '<button class="chip sm" data-act="nPick" data-t="f" data-id="' + x.f.id + '">' + esc(x.f.n) + '</button>').join('') + '</div>' + (rs.length ? '<div class="chips" style="margin-top:8px">' + rs.map((x) => '<button class="chip sm" data-act="nRecipe" data-id="' + x.r.id + '">' + x.r.e + ' ' + esc(x.r.n) + '</button>').join('') + '</div>' : '') + '</div>';
    } else if (needK < -t.kcal * 0.1) h = '<div class="card"><span class="tag dato">Dato</span> <span class="pill-n">Hoy llevas ' + r0(-needK) + ' kcal por encima del objetivo.</span><p class="small muted" style="margin-top:6px">Un día suelto no cambia el resultado: lo que cuenta es la media de la semana.</p></div>';
    return h;
  }
  A.nDay = (el) => { ui.nutri.date = ST.addDays(ui.nutri.date, Number(el.dataset.n)); rk(); };
  const push = async (date, entries) => { const n = N(); n.log[date] = (n.log[date] || []).concat(entries); await saveFood(); };
  const entryOf = (meal, t, id, q) => {
    if (t === 'r') { const r = recipe(id); const m = recMac(r); return { id: uid(), meal, name: r.n, qty: (Math.round(q * 100) / 100) + (q === 1 ? ' ración' : ' raciones'), k: m.k * q, p: m.p * q, f: m.f * q, h: m.h * q, ref: { t, id, q } }; }
    const f = food(id); const m = mac(f, q); return Object.assign({ id: uid(), meal, name: f.n, qty: r0(q) + ' g', ref: { t: 'f', id, q } }, m);
  };
  A.nCopyPrev = async () => { const d = ui.nutri.date; await push(d, dayLog(ST.addDays(d, -1)).map((e) => Object.assign({}, e, { id: uid() }))); rk(); };
  A.nFromMenu = async () => { const d = ui.nutri.date; const day = N().menu.days[APP.plan.wd(d)]; const es = []; Object.keys(day).forEach((meal) => day[meal].forEach((it) => es.push(entryOf(meal, it.t, it.id, it.q)))); await push(d, es); rk(); APP.toast('Menú registrado'); };

  const row = (t, id) => { if (t === 'r') { const r = recipe(id); const m = recMac(r); return '<a href="#" class="item" data-act="nPick" data-t="r" data-id="' + id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + r.e + ' ' + esc(r.n) + '</div><div class="pill-n">Receta · ' + macLine(m) + ' por ración</div></div><span class="muted">+</span></a>'; } const f = food(id); return '<a href="#" class="item" data-act="nPick" data-t="f" data-id="' + id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(f.n) + '</div><div class="pill-n">' + f.k + ' kcal · P ' + f.p + ' · H ' + f.h + ' · G ' + f.f + ' por 100 g</div></div><span class="muted">+</span></a>'; };
  function pickList() {
    const q = ST.norm(ui.nutri.q); const p = N().profile || {};
    if (!q) {
      const seen = new Set(); const recent = []; Object.keys(N().log).sort().reverse().slice(0, 30).forEach((d) => N().log[d].forEach((e) => { if (e.ref && e.ref.t !== 'm') { const k = e.ref.t + e.ref.id; if (!seen.has(k) && (e.ref.t === 'r' ? recipe(e.ref.id) : food(e.ref.id))) { seen.add(k); recent.push(e.ref); } } }));
      return (recent.length ? '<p class="small muted">Recientes</p><div class="list">' + recent.slice(0, 8).map((x) => row(x.t, x.id)).join('') + '</div>' : '<p class="muted small">Escribe para buscar entre ' + allFoods().length + ' alimentos y ' + DB.recipes.length + ' recetas.</p>') +
        '<p class="small muted" style="margin-top:12px">Por categoría</p><div class="chips">' + Object.keys(CATS).map((c) => '<button class="chip sm" data-act="nCat" data-c="' + c + '">' + CATS[c] + '</button>').join('') + '</div>';
    }
    const cat = ui.nutri.q.indexOf('cat:') === 0 ? ui.nutri.q.slice(4) : null;
    const fs = allFoods().filter((f) => (cat ? f.c === cat : ST.norm(f.n).includes(q))).slice(0, 40); const rs = cat ? [] : DB.recipes.filter((r) => ST.norm(r.n).includes(q) && fits(recFlags(r), p)).slice(0, 10);
    return (fs.length || rs.length ? '<div class="list">' + rs.map((r) => row('r', r.id)).join('') + fs.map((f) => row('f', f.id)).join('') + '</div>' : '<div class="empty">Nada coincide. Puedes crear el alimento con los datos de su etiqueta.</div>');
  }
  A.nAdd = (el) => {
    const ds = (el && el.dataset) || {}; ui.nutri.meal = ds.meal || ui.nutri.meal; ui.nutri.q = ''; ui.nutri.target = ds.target || 'log';
    APP.openSheet('Añadir a ' + (MEALS.find((m) => m[0] === ui.nutri.meal) || MEALS[2])[1].toLowerCase(), '<input type="search" id="n-q" placeholder="Buscar alimento o receta…" data-input="nSearch" style="margin-bottom:10px"><div id="n-list">' + pickList() + '</div><div class="row" style="margin-top:12px"><button class="btn ghost block" data-act="nCustom">+ Alimento propio</button>' + (ui.nutri.target === 'log' ? '<button class="btn ghost block" data-act="nManual">Añadir calorías a mano</button>' : '') + '</div>');
  };
  A.nSearch = (el) => { ui.nutri.q = el.value; const l = APP.$('#n-list'); if (l) l.innerHTML = pickList(); };
  A.nCat = (el) => { ui.nutri.q = 'cat:' + el.dataset.c; const l = APP.$('#n-list'); if (l) l.innerHTML = pickList(); };
  A.nPick = (el) => {
    const t = el.dataset.t, id = el.dataset.id; const isR = t === 'r'; const it = isR ? recipe(id) : food(id); ui.nutri.pick = { t, id }; if (!APP.sheetOpen()) ui.nutri.target = 'log';
    const q0 = isR ? 1 : it.g || 100;
    APP.openSheet(it.n, (isR ? '<p class="muted small">' + macLine(recMac(it)) + ' por ración</p>' : '<p class="muted small">' + it.k + ' kcal · P ' + it.p + ' · H ' + it.h + ' · G ' + it.f + ' por 100 g' + (it.custom ? ' (dato tuyo)' : ' · Fuente: USDA') + '</p>') +
      field(isR ? 'Raciones' : 'Cantidad (gramos)', '<input type="number" id="n-qty" inputmode="decimal" min="0" step="' + (isR ? '0.25' : '1') + '" value="' + q0 + '" data-input="nQty">') +
      (isR ? '<div class="chips" style="margin-bottom:12px">' + [0.5, 1, 1.5, 2].map((x) => '<button class="chip sm" data-act="nSetQty" data-q="' + x + '">' + x + '</button>').join('') + '</div>' : '<div class="chips" style="margin-bottom:12px"><button class="chip sm" data-act="nSetQty" data-q="' + (it.g || 100) + '">' + esc(it.gl || 'Ración') + ' (' + (it.g || 100) + ' g)</button><button class="chip sm" data-act="nSetQty" data-q="100">100 g</button><button class="chip sm" data-act="nSetQty" data-q="' + (it.g || 100) * 2 + '">Doble</button></div>') +
      '<div class="card" style="box-shadow:none;text-align:center" id="n-prev"></div>' + (ui.nutri.target === 'log' ? group('Comida', chips('n-meal', MEALS.map((m) => ({ v: m[0], l: m[1] })), ui.nutri.meal, false, true)) : '') +
      '<button class="btn block" data-act="nPickSave">Añadir</button>'); A.nQty();
  };
  A.nQty = () => { const pk = ui.nutri.pick; const q = num(val('n-qty')); let m; if (pk.t === 'r') { const x = recMac(recipe(pk.id)); m = { k: x.k * q, p: x.p * q, f: x.f * q, h: x.h * q }; } else m = mac(food(pk.id), q); const el = APP.$('#n-prev'); if (el) el.innerHTML = '<div class="big">' + r0(m.k) + '<span class="muted" style="font-size:16px"> kcal</span></div><div class="label muted small">Proteína ' + r1(m.p) + ' g · Hidratos ' + r1(m.h) + ' g · Grasas ' + r1(m.f) + ' g</div>'; };
  A.nSetQty = (el) => { APP.$('#n-qty').value = el.dataset.q; A.nQty(); };
  A.nPickSave = async () => {
    const pk = ui.nutri.pick; const q = num(val('n-qty')); if (!(q > 0)) return APP.toast('Indica la cantidad');
    if (ui.nutri.target === 'menu') { const m = ui.nutri.menuSlot; N().menu.days[m.day][m.meal].push({ t: pk.t, id: pk.id, q }); ui.nutri.target = 'log'; await saveFood(); APP.closeSheet(); return rk(); }
    const meal = sel('n-meal')[0] || ui.nutri.meal; ui.nutri.meal = meal; await push(ui.nutri.date, [entryOf(meal, pk.t, pk.id, q)]); APP.closeSheet(); if (APP.route.name !== 'nutri' || APP.route.arg) APP.go('#/nutri'); else rk(); APP.toast('Añadido');
  };
  A.nManual = () => APP.openSheet('Añadir a mano', field('Nombre', '<input id="nm-name" placeholder="Ej.: Menú del restaurante">') + '<div class="grid2">' + field('Calorías', '<input type="number" id="nm-k" inputmode="numeric" min="0">') + field('Proteína (g)', '<input type="number" id="nm-p" inputmode="decimal" min="0">') + field('Hidratos (g)', '<input type="number" id="nm-h" inputmode="decimal" min="0">') + field('Grasas (g)', '<input type="number" id="nm-f" inputmode="decimal" min="0">') + '</div><p class="small muted">Si solo pones los macros, las calorías se calculan (4 kcal por gramo de proteína e hidratos, 9 por gramo de grasa).</p><button class="btn block" data-act="nManualSave">Añadir</button>');
  A.nManualSave = async () => { const p = num(val('nm-p')), h = num(val('nm-h')), f = num(val('nm-f')); const k = num(val('nm-k')) || p * 4 + h * 4 + f * 9; if (!(k > 0)) return APP.toast('Indica las calorías o los macros'); await push(ui.nutri.date, [{ id: uid(), meal: ui.nutri.meal, name: val('nm-name').trim() || 'Añadido a mano', qty: 'manual', k, p, h, f, ref: { t: 'm' } }]); APP.closeSheet(); rk(); };
  A.nCustom = () => APP.openSheet('Alimento propio', '<div class="explain">Copia los valores de la etiqueta del producto, por 100 g.</div>' + field('Nombre', '<input id="nc-name">') + '<div class="grid2">' + field('Calorías (kcal)', '<input type="number" id="nc-k" inputmode="decimal" min="0">') + field('Proteínas (g)', '<input type="number" id="nc-p" inputmode="decimal" min="0">') + field('Hidratos (g)', '<input type="number" id="nc-h" inputmode="decimal" min="0">') + field('Grasas (g)', '<input type="number" id="nc-f" inputmode="decimal" min="0">') + '</div>' + field('Ración habitual (g)', '<input type="number" id="nc-g" inputmode="numeric" min="1" value="100">') + group('Categoría (para la lista de la compra)', chips('nc-cat', Object.keys(CATS).map((c) => ({ v: c, l: CATS[c] })), 'otros', false, true)) + '<button class="btn block" data-act="nCustomSave">Guardar</button>');
  A.nCustomSave = async () => {
    const name = val('nc-name').trim(); if (!name) return APP.toast('Escribe el nombre'); if (allFoods().some((f) => ST.norm(f.n) === ST.norm(name))) return APP.toast('Ya existe un alimento con ese nombre');
    const p = num(val('nc-p')), h = num(val('nc-h')), f = num(val('nc-f')); const k = num(val('nc-k')) || p * 4 + h * 4 + f * 9; if (!(k > 0)) return APP.toast('Indica al menos las calorías');
    const cat = sel('nc-cat')[0] || 'otros'; const veg = !/carne|pescado/.test(cat);
    const rec = { id: 'c' + uid(), n: name, c: cat, k: r0(k), p, f, h, fi: 0, g: num(val('nc-g')) || 100, gl: 'Ración', vg: veg && !/huevos|lacteos/.test(cat) ? 1 : 0, vt: veg ? 1 : 0, glu: 0, lac: cat === 'lacteos' ? 1 : 0, custom: true };
    N().custom.push(rec); await saveFood(); A.nPick({ dataset: { t: 'f', id: rec.id } });
  };
  A.nEntry = (el) => { const e = dayLog(ui.nutri.date).find((x) => x.id === el.dataset.id); if (!e) return; APP.openSheet(e.name, '<p class="muted">' + esc(e.qty) + ' · ' + macLine(e) + '</p>' + group('Mover a', chips('ne-meal', MEALS.map((m) => ({ v: m[0], l: m[1] })), e.meal, false, true)) + '<div class="stack"><button class="btn block" data-act="nEntryMove" data-id="' + e.id + '">Guardar</button><button class="btn danger block" data-act="nEntryDel" data-id="' + e.id + '">Quitar</button></div>'); };
  A.nEntryMove = async (el) => { const e = dayLog(ui.nutri.date).find((x) => x.id === el.dataset.id); e.meal = sel('ne-meal')[0] || e.meal; await saveFood(); APP.closeSheet(); rk(); };
  A.nEntryDel = async (el) => { const n = N(); n.log[ui.nutri.date] = dayLog(ui.nutri.date).filter((x) => x.id !== el.dataset.id); await saveFood(); APP.closeSheet(); rk(); };
  A.nutriFab = () => { const h = new Date().getHours(); A.nAdd({ dataset: { meal: h < 11 ? 'desayuno' : h < 13 ? 'almuerzo' : h < 17 ? 'comida' : h < 20 ? 'merienda' : 'cena' } }); };

  // ---------- perfil y objetivo ----------
  const paceHTML = (goal, cur) => (goal === 'mantener' ? '' : group('Ritmo', chips('np-pacev', PACE[goal].map((x) => ({ v: x[0], l: x[1] })), cur && PACE[goal].some((x) => x[0] === String(cur)) ? String(cur) : PACE[goal][1][0], false, true)));
  A.nProfile = () => {
    const p = N().profile || {}; const b = S.body || {}; const kg = weightNow();
    APP.openSheet('Mis datos y objetivo', '<div class="explain">Con estos datos se estiman tus calorías. Es una estimación: se ajusta mejor cuando registras tu peso y tus comidas durante un par de semanas.</div>' +
      group('Sexo (para la fórmula del metabolismo)', chips('np-sex', [{ v: 'h', l: 'Hombre' }, { v: 'm', l: 'Mujer' }], p.sex || null, false, true)) +
      '<div class="grid2">' + field('Edad', '<input type="number" id="np-age" inputmode="numeric" min="12" max="90" value="' + esc(p.age || b.age || '') + '">') + field('Altura (cm)', '<input type="number" id="np-h" inputmode="numeric" min="120" max="230" value="' + esc(p.height || b.height || '') + '">') + '</div>' +
      field('Peso actual (kg)', '<input type="number" id="np-w" inputmode="decimal" step="0.1" min="30" max="250" value="' + esc(kg || '') + '">') +
      group('Tu día a día, sin contar los entrenos', chips('np-neat', NEAT.map((x) => ({ v: x[0], l: x[1] })), p.neat || '1.2', false, true)) +
      group('Objetivo', '<div class="chips" data-group="np-goal" data-onchange="nGoalChange">' + GOALS.map((g) => '<button type="button" class="chip sm' + ((p.goal || 'mantener') === g[0] ? ' on' : '') + '" data-val="' + g[0] + '">' + g[1] + '</button>').join('') + '</div>') +
      '<div id="np-pace">' + paceHTML(p.goal || 'mantener', p.pace) + '</div>' +
      group('Tipo de alimentación', chips('np-diet', [{ v: 'omnivora', l: 'Como de todo' }, { v: 'vegetariana', l: 'Vegetariana' }, { v: 'vegana', l: 'Vegana' }], p.diet || 'omnivora', false, true)) +
      group('Evitar', chips('np-avoid', [{ v: 'gluten', l: 'Gluten' }, { v: 'lactosa', l: 'Lactosa' }], [].concat(p.noGluten ? ['gluten'] : [], p.noLactose ? ['lactosa'] : []), true, true)) +
      '<button class="btn block" data-act="nProfileSave">Calcular mi objetivo</button>');
  };
  A.nGoalChange = (chip) => { APP.$('#np-pace').innerHTML = paceHTML(chip.dataset.val); };
  A.nProfileSave = async () => {
    const goal = sel('np-goal')[0] || 'mantener'; const av = sel('np-avoid');
    const p = { sex: sel('np-sex')[0], age: Number(val('np-age')), height: Number(val('np-h')), neat: sel('np-neat')[0] || '1.2', goal, pace: goal === 'mantener' ? '0' : (sel('np-pacev')[0] || PACE[goal][1][0]), diet: sel('np-diet')[0] || 'omnivora', noGluten: av.includes('gluten'), noLactose: av.includes('lactosa') };
    const kg = num(val('np-w')); if (!p.sex || !p.age || !p.height || !kg) return APP.toast('Completa sexo, edad, altura y peso');
    p.weight = kg; const n = N(); n.profile = p;
    if (APP.gym && Math.abs((APP.gym.latestWeight() || 0) - kg) > 0.01) { const g = S.gym || (S.gym = { profile: null, routines: [], active: '', logs: [], weights: [], customEx: [], current: null }); g.weights = g.weights.filter((x) => x.date !== today()).concat({ date: today(), kg }); await APP.saveMeta('gym', g); }
    await saveFood(); APP.closeSheet(); APP.go('#/nutri/objetivo'); APP.render();
  };
  A.nMode = async (el) => { N().mode = el.dataset.v; await saveFood(); rk(); };
  function adaptive(t) {
    const td = today(); const days = []; for (let i = 1; i <= 21; i++) { const d = ST.addDays(td, -i); const k = sum(dayLog(d)).k; if (k > 500) days.push(k); }
    const w = ((S.gym && S.gym.weights) || []).filter((x) => x.date >= ST.addDays(td, -21)).sort((a, b) => a.date.localeCompare(b.date));
    if (days.length < 10 || w.length < 4 || ST.diffDays(w[w.length - 1].date, w[0].date) < 12) return '<div class="card"><h3>Ajuste con tus datos reales</h3><p class="muted small">Cuando tengas al menos 10 días de comidas registradas y 4 pesajes repartidos en 3 semanas, compararé lo que comes con cómo cambia tu peso para afinar el cálculo. Ahora hay ' + days.length + ' días y ' + w.length + ' pesajes.</p></div>';
    const xs = w.map((p) => ST.diffDays(p.date, w[0].date)); const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = w.reduce((a, p) => a + p.kg, 0) / w.length; const slope = xs.reduce((a, x, i) => a + (x - mx) * (w[i].kg - my), 0) / xs.reduce((a, x) => a + (x - mx) * (x - mx), 0);
    const intake = days.reduce((a, b) => a + b, 0) / days.length; const real = intake - slope * 7700; const diff = real - t.tdee;
    return '<div class="card"><h3>Ajuste con tus datos reales</h3><p><span class="tag dato">Dato</span> En las últimas 3 semanas has comido de media ' + r0(intake) + ' kcal al día (n = ' + days.length + ' días) y tu peso ha cambiado ' + (slope * 7 >= 0 ? '+' : '') + r1(slope * 7) + ' kg por semana (n = ' + w.length + ' pesajes).</p><p><span class="tag hipotesis">Hipótesis</span> Tu gasto real ronda las ' + r0(real / 10) * 10 + ' kcal al día, ' + (Math.abs(diff) < 100 ? 'muy parecido al estimado.' : Math.abs(r0(diff / 10) * 10) + ' kcal ' + (diff > 0 ? 'más' : 'menos') + ' que el estimado (' + t.tdee + ').') + '</p><p class="small muted">Es aproximado: el peso oscila por agua y sal, y el registro de comidas nunca es exacto. Úsalo como orientación para ajustar tu ritmo.</p></div>';
  }
  function goalPlanCard(t) {
    const gp = N().goalPlan; const ws = (APP.gym && APP.gym.weights()) || [];
    if (!gp) return '<div class="card"><h3>Plan con fecha</h3><p class="muted small">Marca un peso objetivo y un plazo y calculo el ritmo necesario y si es realista.</p><button class="btn secondary block" data-act="nPlanForm">Crear plan</button></div>';
    const end = ST.addDays(gp.start, gp.weeks * 7); const perWeek = (gp.targetKg - gp.startKg) / gp.weeks; const pctW = Math.abs(perWeek) / gp.startKg * 100;
    const realistic = perWeek < 0 ? pctW <= 1 : pctW <= 0.5; const actual = ws.filter((x) => x.date >= gp.start).map((x) => ({ x: x.date, y: x.kg }));
    const last = actual[actual.length - 1]; const expNow = gp.startKg + perWeek * Math.min(gp.weeks, Math.max(0, ST.diffDays(today(), gp.start)) / 7);
    return '<div class="card"><div class="row between"><h3>Plan con fecha</h3><button class="btn small ghost" data-act="nPlanForm">Editar</button></div><p>De <b>' + gp.startKg + ' kg</b> a <b>' + gp.targetKg + ' kg</b> en ' + gp.weeks + ' semanas (hasta el ' + fmtDate(end) + '): ' + (perWeek >= 0 ? '+' : '') + (Math.round(perWeek * 100) / 100) + ' kg por semana.</p>' +
      (realistic ? '' : '<div class="explain">⚠ Ritmo exigente: equivale al ' + r1(pctW) + '% de tu peso por semana. Lo habitual es no pasar de un 1% al perder ni de un 0,5% al ganar. ' + esc(t ? t.planNote : '') + ' Plantéate alargar el plazo.</div>') +
      APP.line([{ points: [{ x: gp.start, y: gp.startKg }, { x: end, y: gp.targetKg }], color: 'var(--gold)', dashed: true }, { points: actual, color: 'var(--green-2)' }], { unit: ' kg' }) + '<p class="small muted">Discontinua: plan. Continua: tus pesajes.</p>' +
      (last ? '<p class="small"><span class="tag dato">Dato</span> Último pesaje ' + last.y + ' kg; según el plan hoy tocarían ' + r1(expNow) + ' kg (' + (last.y - expNow >= 0 ? '+' : '') + r1(last.y - expNow) + ' kg).</p>' : '<p class="small muted">Registra tu peso para comparar con el plan.</p>') +
      '<button class="btn ghost block" data-act="nPlanDel">Quitar plan</button></div>';
  }
  A.nPlanForm = () => { const gp = N().goalPlan || {}; const kg = weightNow(); APP.openSheet('Plan con fecha', '<div class="grid2">' + field('Peso de partida (kg)', '<input type="number" id="gp-s" inputmode="decimal" step="0.1" value="' + esc(gp.startKg || kg || '') + '">') + field('Peso objetivo (kg)', '<input type="number" id="gp-t" inputmode="decimal" step="0.1" value="' + esc(gp.targetKg || '') + '">') + '</div>' + field('Plazo (semanas)', '<input type="number" id="gp-w" inputmode="numeric" min="1" max="104" value="' + esc(gp.weeks || 12) + '">') + '<button class="btn block" data-act="nPlanSave">Guardar plan</button>'); };
  A.nPlanSave = async () => { const s = num(val('gp-s')), t = num(val('gp-t')), w = Number(val('gp-w')); if (!s || !t || !w) return APP.toast('Completa los tres datos'); const n = N(); n.goalPlan = { start: (n.goalPlan && n.goalPlan.start) || today(), startKg: s, targetKg: t, weeks: w }; if (n.profile) n.profile.goal = t < s ? 'perder' : t > s ? 'ganar' : 'mantener'; await saveFood(); APP.closeSheet(); rk(); };
  A.nPlanDel = async () => { N().goalPlan = null; await saveFood(); rk(); };
  const back = () => '<div style="margin-bottom:10px"><a class="btn small ghost" style="text-decoration:none" href="#/nutri">← Diario</a></div>';
  function goalPage() {
    const t = targets(today()); const p = N().profile;
    if (!t) return back() + '<div class="card hero"><h2>Tu objetivo</h2><p class="muted">Necesito tus datos para calcularlo.</p><button class="btn secondary" data-act="nProfile">Rellenar</button></div>';
    const li = (a, b) => '<div class="item"><div>' + a + '</div><b>' + b + '</b></div>'; const wl = 'style="color:rgba(255,255,255,.75)"';
    return back() + '<div class="card hero"><div class="muted">' + GOALS.find((g) => g[0] === p.goal)[1] + ' · ' + t.kg + ' kg</div><h2 style="margin:4px 0">' + t.kcal + ' kcal al día</h2><div class="kpis" style="margin-top:12px;color:#fff"><div><div class="big" style="font-size:24px">' + t.p + ' g</div><div class="label" ' + wl + '>proteína</div></div><div><div class="big" style="font-size:24px">' + t.h + ' g</div><div class="label" ' + wl + '>hidratos</div></div><div><div class="big" style="font-size:24px">' + t.f + ' g</div><div class="label" ' + wl + '>grasas</div></div></div><button class="btn secondary" style="margin-top:14px" data-act="nProfile">Cambiar datos u objetivo</button></div>' +
      (t.minor ? '<div class="explain">Eres menor de edad: no se aplica déficit de calorías. Para cambiar de peso, habla con un médico o un dietista-nutricionista.</div>' : '') + (t.floored ? '<div class="explain">⚠ El cálculo quedaba por debajo de un mínimo prudente, así que se ha fijado en ' + t.kcal + ' kcal. No conviene bajar de ahí sin supervisión profesional.</div>' : '') +
      '<div class="card"><h3>Cómo se calcula</h3><div class="list">' + li('Metabolismo basal (Mifflin-St Jeor)', t.bmr + ' kcal') + li('Con tu actividad diaria (× ' + p.neat + ')', t.base + ' kcal') + li('Entrenos de BJJ y gimnasio', '+ ' + t.ex + ' kcal') + li('Gasto total estimado', t.tdee + ' kcal') + li('Ajuste por objetivo', (t.pct >= 0 ? '+' : '') + r0(t.pct * 100) + '%') + li('Proteína', t.pk + ' g por kg') + li('Fibra orientativa', t.fiber + ' g') + '</div>' +
      '<p class="small muted" style="margin-top:8px">' + esc(t.avg.text) + '</p><h3 style="margin-top:12px">Reparto de los entrenos</h3><div class="seg">' + [['avg', 'Igual todos los días'], ['day', 'Más los días que entreno']].map((x) => '<button class="' + (N().mode === x[0] ? 'on' : '') + '" data-act="nMode" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="explain">Es una <b>estimación</b>: las fórmulas pueden desviarse un 10% o más de una persona a otra. Los entrenos se calculan con los valores MET del Compendium of Physical Activities (BJJ entre 5,3 y 10,3 según la intensidad que registras; pesas entre 3,5 y 6) y la proteína sigue el rango habitual en nutrición deportiva (1,4-2,0 g/kg, algo más en déficit). No sustituye a un dietista-nutricionista, sobre todo si tienes alguna enfermedad.</div></div>' + goalPlanCard(t) + adaptive(t);
  }

  // ---------- recetas ----------
  ui.rec = { meal: 'all', q: '' };
  const goalTag = (m, p) => { const pp = (m.p * 4) / m.k; if (p && p.goal === 'perder' && pp >= 0.28 && m.k <= 550) return 'Encaja con perder grasa'; if (p && p.goal === 'ganar' && m.k >= 550 && m.p >= 30) return 'Encaja con ganar músculo'; return pp >= 0.3 ? 'Alta en proteína' : ''; };
  const thumb = (r, big) => { const ph = N().photos[r.id]; return ph ? '<div class="rthumb' + (big ? ' big' : '') + '" style="background-image:url(' + ph + ')"></div>' : '<div class="rthumb' + (big ? ' big' : '') + '">' + r.e + '</div>'; };
  function recList() {
    const p = N().profile || {}; const u = ui.rec; const q = ST.norm(u.q);
    const list = DB.recipes.filter((r) => fits(recFlags(r), p) && (u.meal === 'all' || r.m.includes(u.meal)) && (!q || ST.norm(r.n).includes(q))).map((r) => ({ r, m: recMac(r) }));
    list.sort((a, b) => (goalTag(b.m, p) ? 1 : 0) - (goalTag(a.m, p) ? 1 : 0));
    return list.length ? list.map((x) => '<a href="#" class="rcard" data-act="nRecipe" data-id="' + x.r.id + '">' + thumb(x.r) + '<div class="rb"><b>' + esc(x.r.n) + '</b><span class="pill-n">' + r0(x.m.k) + ' kcal · P ' + r0(x.m.p) + ' g · ' + x.r.t + ' min</span>' + (goalTag(x.m, p) ? '<span class="tag recomendacion">' + goalTag(x.m, p) + '</span>' : '') + '</div></a>').join('') : '<div class="empty">Ninguna receta coincide.</div>';
  }
  function recipesPage() {
    const p = N().profile || {}; const u = ui.rec;
    return back() + '<div class="card"><input type="search" placeholder="Buscar receta…" value="' + esc(u.q) + '" data-input="nRecSearch" style="margin-bottom:10px"><div class="seg">' + [['all', 'Todas'], ['desayuno', 'Desayuno'], ['comida', 'Comida'], ['merienda', 'Merienda'], ['cena', 'Cena']].map((x) => '<button class="' + (u.meal === x[0] ? 'on' : '') + '" data-act="nRecMeal" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' + ((p.diet && p.diet !== 'omnivora') || p.noGluten || p.noLactose ? '<p class="small muted">Filtradas según tu alimentación.</p>' : '') + '</div><div class="rgrid" id="rec-list">' + recList() + '</div>';
  }
  A.nRecSearch = (el) => { ui.rec.q = el.value; const l = APP.$('#rec-list'); if (l) l.innerHTML = recList(); };
  A.nRecMeal = (el) => { ui.rec.meal = el.dataset.v; rk(); };
  A.nRecipe = (el) => {
    const r = recipe(el.dataset.id); const m = recMac(r); const fl = recFlags(r); ui.nutri.target = 'log';
    APP.openSheet(r.n, thumb(r, true) + '<div class="chips" style="margin:10px 0"><span class="tag">' + r.t + ' min</span><span class="tag">' + r.s + (r.s === 1 ? ' ración' : ' raciones') + '</span>' + (fl.vg ? '<span class="tag recomendacion">Vegana</span>' : fl.vt ? '<span class="tag recomendacion">Vegetariana</span>' : '') + (fl.glu ? '' : '<span class="tag">Sin gluten*</span>') + (fl.lac ? '' : '<span class="tag">Sin lactosa*</span>') + '</div>' +
      '<div class="card" style="box-shadow:none;text-align:center"><div class="big">' + r0(m.k) + '<span class="muted" style="font-size:16px"> kcal por ración</span></div><div class="label muted small">Proteína ' + r0(m.p) + ' g · Hidratos ' + r0(m.h) + ' g · Grasas ' + r0(m.f) + ' g</div></div>' +
      '<h3 style="margin:12px 0 6px">Ingredientes' + (r.s > 1 ? ' (para ' + r.s + ' raciones)' : '') + '</h3><ul class="keys">' + r.i.map((x) => '<li>' + x[1] + ' g de ' + esc(food(x[0]).n.toLowerCase()) + '</li>').join('') + '</ul><h3 style="margin:12px 0 6px">Preparación</h3><ol style="margin:0;padding-left:20px">' + r.st.map((s) => '<li style="margin-bottom:6px">' + esc(s) + '</li>').join('') + '</ol>' +
      '<p class="small muted" style="margin-top:10px">Valores calculados con los pesos indicados. *Comprueba siempre las etiquetas si tienes alergia o intolerancia.</p>' +
      '<div class="stack" style="margin-top:12px"><button class="btn block" data-act="nPick" data-t="r" data-id="' + r.id + '">Añadir a mi diario</button><label class="btn secondary block" style="display:block;text-align:center">' + (N().photos[r.id] ? 'Cambiar mi foto' : '📷 Añadir mi foto del plato') + '<input type="file" accept="image/*" data-input="nPhoto" data-id="' + r.id + '" hidden></label>' + (N().photos[r.id] ? '<button class="btn ghost block" data-act="nPhotoDel" data-id="' + r.id + '">Quitar foto</button>' : '') + '</div>');
  };
  A.nPhoto = (el) => { const f = el.files && el.files[0]; if (!f) return; const id = el.dataset.id; const img = new Image(); const url = URL.createObjectURL(f); img.onload = async () => { const s = Math.min(1, 640 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = r0(img.width * s); c.height = r0(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); N().photos[id] = c.toDataURL('image/jpeg', 0.75); URL.revokeObjectURL(url); await saveFood(); rk(); A.nRecipe({ dataset: { id } }); }; img.onerror = () => APP.toast('No se pudo leer la imagen'); img.src = url; };
  A.nPhotoDel = async (el) => { delete N().photos[el.dataset.id]; await saveFood(); rk(); A.nRecipe({ dataset: { id: el.dataset.id } }); };

  // ---------- menú semanal ----------
  const SLOTS = [['desayuno', 0.25], ['comida', 0.35], ['merienda', 0.1], ['cena', 0.3]];
  const DAYN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const itMac = (it) => { if (it.t === 'r') { const m = recMac(recipe(it.id)); return { k: m.k * it.q, p: m.p * it.q, f: m.f * it.q, h: m.h * it.q }; } return mac(food(it.id), it.q); };
  const dayMac = (day) => sum(Object.keys(day).reduce((a, k) => a.concat(day[k].map(itMac)), []));
  function genMenu(t, p) {
    const pool = {}; SLOTS.forEach((s) => { pool[s[0]] = DB.recipes.filter((r) => r.m.includes(s[0]) && fits(recFlags(r), p)).map((r) => ({ r, m: recMac(r) })); });
    if (SLOTS.some((s) => !pool[s[0]].length)) return null;
    const used = {}; const days = {};
    for (let d = 1; d <= 7; d++) {
      let best = null;
      for (let it = 0; it < 400; it++) {
        const cand = {}; let rep = 0; const tot = { k: 0, p: 0 };
        SLOTS.forEach((s) => { const x = pool[s[0]][Math.floor(Math.random() * pool[s[0]].length)]; const q = Math.max(0.5, Math.min(2.5, Math.round(((t.kcal * s[1]) / x.m.k) * 4) / 4)); cand[s[0]] = [{ t: 'r', id: x.r.id, q }]; rep += used[x.r.id] || 0; tot.k += x.m.k * q; tot.p += x.m.p * q; });
        const ids = SLOTS.map((s) => cand[s[0]][0].id); if (new Set(ids).size < ids.length) rep += 3;
        const err = Math.abs(tot.k - t.kcal) / t.kcal + 3 * Math.max(0, (t.p - tot.p) / t.p) + 0.1 * rep;
        if (!best || err < best.err) best = { err, cand };
      }
      const day = best.cand; SLOTS.forEach((s) => { const id = day[s[0]][0].id; used[id] = (used[id] || 0) + 1; });
      // Si falta proteína, se añade un alimento magro a la merienda y, si sobran calorías, se recorta la ración menos proteica.
      let tot = dayMac(day); const leans = ['u01256', 'u01015', 'u15121', 'u01124', 'u16426', 'u11211'].map(food).filter((f) => f && fits(f, p)); if (leans.length > 1 && d % 2) leans.push(leans.shift());
      for (let round = 0; round < 3; round++) {
        for (const lean of leans) { const gap = t.p - tot.p; if (gap <= 8) break; const ex = day.merienda.find((it) => it.t === 'f' && it.id === lean.id); const have = ex ? ex.q : 0; const g = Math.min(300 - have, Math.ceil(((gap / lean.p) * 100) / 25) * 25); if (g <= 0) continue; if (ex) ex.q += g; else day.merienda.push({ t: 'f', id: lean.id, q: g }); tot = dayMac(day); }
        for (let n = 0; n < 6 && tot.k > t.kcal * 1.05; n++) { const rs = SLOTS.map((s) => day[s[0]][0]).filter((it) => it.q > 0.5).sort((x, y) => { const mx = recMac(recipe(x.id)), my = recMac(recipe(y.id)); return mx.p / mx.k - my.p / my.k; }); if (!rs.length) break; rs[0].q -= 0.25; tot = dayMac(day); }
      }
      days[d] = day;
    }
    return { days, created: today(), kcal: t.kcal };
  }
  APP.nutri.genMenu = genMenu; APP.nutri.dayMac = dayMac;
  A.nMenuGen = async () => { const t = targets(today()); if (!t) return A.nProfile(); if (N().menu && !APP.confirm('¿Sustituir el menú actual por uno nuevo?')) return; const m = genMenu(t, N().profile); if (!m) return APP.toast('No hay recetas suficientes con tus filtros'); N().menu = m; N().shop = {}; await saveFood(); rk(); APP.toast('Menú creado'); };
  A.nMenuEmpty = async () => { const days = {}; for (let d = 1; d <= 7; d++) { days[d] = {}; SLOTS.forEach((s) => { days[d][s[0]] = []; }); } N().menu = { days, created: today() }; await saveFood(); rk(); };
  ui.menuDay = APP.plan ? APP.plan.wd(today()) : 1;
  function menuPage() {
    const m = N().menu; const t = targets(today());
    if (!m) return back() + '<div class="card hero"><h2>Tu menú semanal</h2><p class="muted">Creo un menú de 7 días ajustado a tus calorías y proteínas con las recetas de la app, o lo montas tú. Después te saco la lista de la compra.</p><div class="row"><button class="btn secondary block" data-act="nMenuGen">✨ Crear menú</button><button class="btn secondary block" data-act="nMenuEmpty">Montarlo yo</button></div></div>';
    const d = ui.menuDay; const day = m.days[d]; const tot = dayMac(day); const dev = t ? r0(((tot.k - t.kcal) / t.kcal) * 100) : null;
    return back() + '<div class="seg">' + DAYN.map((n, i) => '<button class="' + (d === i + 1 ? 'on' : '') + '" data-act="nMenuDay" data-d="' + (i + 1) + '">' + n.slice(0, 3) + '</button>').join('') + '</div>' +
      '<div class="card"><div class="row between"><h3>' + DAYN[d - 1] + '</h3><span class="pill-n">' + macLine(tot) + '</span></div>' + (t ? bar('Calorías', tot.k, t.kcal, 'var(--green-2)', 'kcal') + bar('Proteína', tot.p, t.p, 'var(--red)') + '<p class="small muted">Frente a tu objetivo: ' + (dev >= 0 ? '+' : '') + dev + '% de calorías y ' + (tot.p - t.p >= 0 ? '+' : '') + r0(tot.p - t.p) + ' g de proteína. Las raciones se ajustan en cuartos de ración, así que no cuadra al gramo.</p>' : '') + '</div>' +
      SLOTS.map((s) => { const ml = MEALS.find((x) => x[0] === s[0]); return '<div class="card"><div class="row between"><h3>' + ml[2] + ' ' + ml[1] + '</h3><button class="btn small ghost" data-act="nMenuAdd" data-meal="' + s[0] + '">+ Añadir</button></div>' + (day[s[0]].length ? '<div class="list">' + day[s[0]].map((it, i) => { const nm = it.t === 'r' ? recipe(it.id) : food(it.id); const mm = itMac(it); return '<div class="item"><a href="#" ' + (it.t === 'r' ? 'data-act="nRecipe" data-id="' + it.id + '"' : 'data-act="noop"') + ' style="text-decoration:none;color:inherit;flex:1"><div class="title">' + (it.t === 'r' ? nm.e + ' ' : '') + esc(nm.n) + '</div><div class="pill-n">' + (it.t === 'r' ? (Math.round(it.q * 100) / 100) + (it.q === 1 ? ' ración' : ' raciones') : r0(it.q) + ' g') + ' · ' + r0(mm.k) + ' kcal · P ' + r0(mm.p) + ' g</div></a><div class="row" style="gap:4px">' + (it.t === 'r' ? '<button class="icon-btn sm" data-act="nMenuSwap" data-meal="' + s[0] + '" data-i="' + i + '" aria-label="Cambiar por otra">⇄</button>' : '') + '<button class="icon-btn sm" data-act="nMenuDel" data-meal="' + s[0] + '" data-i="' + i + '" aria-label="Quitar">✕</button></div></div>'; }).join('') + '</div>' : '<p class="muted small">Vacío.</p>') + '</div>'; }).join('') +
      '<div class="stack"><a class="btn block" style="text-decoration:none;text-align:center" href="#/nutri/compra">🛒 Ver lista de la compra</a><button class="btn secondary block" data-act="nMenuGen">Generar otro menú</button><button class="btn ghost block" data-act="nMenuClear">Borrar menú</button></div>';
  }
  A.noop = () => {};
  A.nMenuDay = (el) => { ui.menuDay = Number(el.dataset.d); rk(); };
  A.nMenuAdd = (el) => { ui.nutri.menuSlot = { day: ui.menuDay, meal: el.dataset.meal }; A.nAdd({ dataset: { meal: el.dataset.meal, target: 'menu' } }); };
  A.nMenuDel = async (el) => { N().menu.days[ui.menuDay][el.dataset.meal].splice(Number(el.dataset.i), 1); await saveFood(); rk(); };
  A.nMenuSwap = async (el) => { const p = N().profile || {}; const list = N().menu.days[ui.menuDay][el.dataset.meal]; const it = list[Number(el.dataset.i)]; const cur = itMac(it); const opts = DB.recipes.filter((r) => r.m.includes(el.dataset.meal) && r.id !== it.id && fits(recFlags(r), p)); if (!opts.length) return APP.toast('No hay más recetas para esta comida'); const r = opts[Math.floor(Math.random() * opts.length)]; const m = recMac(r); list[Number(el.dataset.i)] = { t: 'r', id: r.id, q: Math.max(0.5, Math.min(2.5, Math.round((cur.k / m.k) * 4) / 4)) }; await saveFood(); rk(); };
  A.nMenuClear = async () => { if (!APP.confirm('¿Borrar el menú?')) return; N().menu = null; N().shop = {}; await saveFood(); rk(); };

  // ---------- lista de la compra ----------
  ui.shop = { span: 'semana' };
  function shopItems() {
    const m = N().menu; if (!m) return []; const sp = ui.shop.span; const days = sp === 'dia' ? [ui.menuDay] : [1, 2, 3, 4, 5, 6, 7]; const mult = sp === 'mes' ? 4 : 1; const tot = {};
    days.forEach((d) => Object.keys(m.days[d]).forEach((meal) => m.days[d][meal].forEach((it) => { if (it.t === 'r') { const r = recipe(it.id); r.i.forEach((x) => { tot[x[0]] = (tot[x[0]] || 0) + (x[1] * it.q) / r.s; }); } else tot[it.id] = (tot[it.id] || 0) + it.q; })));
    return Object.keys(tot).map((id) => ({ f: food(id), g: tot[id] * mult })).filter((x) => x.f).sort((a, b) => a.f.n.localeCompare(b.f.n));
  }
  const UNIT = /^1 (huevo|plátano|manzana|naranja|mandarina|pera|kiwi|tomate|zanahoria|pimiento|calabacín|patata|boniato|yogur|melocotón|puerro|alcachofa|tortilla|diente)/;
  const qtyText = (x) => { const g = x.g; const base = g >= 1000 ? (r0(g / 10) / 100).toLocaleString('es-ES') + ' kg' : (g < 20 ? r0(g) : Math.ceil(g / 10) * 10) + ' g'; if (!UNIT.test(x.f.gl || '')) return base; const n = Math.max(1, Math.ceil(g / x.f.g - 0.05)); return base + ' <span class="pill-n">(≈ ' + n + ' ' + (n === 1 ? 'unidad' : 'unidades') + ')</span>'; };
  const cleanName = (n) => n.replace(/ \((crud[oa]s?|cocid[oa]s?)\)/, '');
  function shopPage() {
    const m = N().menu; if (!m) return back() + '<div class="card empty"><h3>Sin menú todavía</h3><p>La lista de la compra se calcula a partir de tu menú.</p><a class="btn" style="text-decoration:none;display:inline-block" href="#/nutri/menu">Crear menú</a></div>';
    const items = shopItems(); const chk = N().shop || {}; const key = (x) => ui.shop.span + (ui.shop.span === 'dia' ? ui.menuDay : '') + ':' + x.f.id;
    const by = {}; items.forEach((x) => { (by[x.f.c] = by[x.f.c] || []).push(x); });
    return back() + '<div class="seg">' + [['dia', DAYN[ui.menuDay - 1]], ['semana', 'Semana'], ['mes', 'Mes (4 semanas)']].map((x) => '<button class="' + (ui.shop.span === x[0] ? 'on' : '') + '" data-act="nShopSpan" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="explain">Cantidades que necesitas para cocinar el menú' + (ui.shop.span === 'mes' ? ' repetido 4 semanas' : ui.shop.span === 'dia' ? ' de ese día (cámbialo en Menú)' : ' de la semana') + ', con los pesos tal como aparecen en las recetas. Revisa lo que ya tengas en casa. <span id="shop-count">' + items.filter((x) => chk[key(x)]).length + '</span> de ' + items.length + ' marcados.</div>' +
      Object.keys(CATS).filter((c) => by[c]).map((c) => '<div class="card"><h3>' + CATS[c] + '</h3><div class="list">' + by[c].map((x) => '<label class="item shop' + (chk[key(x)] ? ' done' : '') + '"><span class="row"><input type="checkbox" data-input="nShopChk" data-k="' + key(x) + '"' + (chk[key(x)] ? ' checked' : '') + '><span class="sn">' + esc(cleanName(x.f.n)) + '</span></span><b style="text-align:right">' + qtyText(x) + '</b></label>').join('') + '</div></div>').join('') +
      '<div class="stack"><button class="btn block" data-act="nShopCopy">Copiar o compartir lista</button><button class="btn ghost block" data-act="nShopReset">Desmarcar todo</button></div>';
  }
  A.nShopSpan = (el) => { ui.shop.span = el.dataset.v; rk(); };
  A.nShopChk = async (el) => { const n = N(); n.shop = n.shop || {}; if (el.checked) n.shop[el.dataset.k] = 1; else delete n.shop[el.dataset.k]; el.closest('.item').classList.toggle('done', el.checked); const c = APP.$('#shop-count'); if (c) c.textContent = APP.$$('.shop input:checked').length; await saveFood(); };
  A.nShopReset = async () => { N().shop = {}; await saveFood(); rk(); };
  A.nShopCopy = async () => { const items = shopItems(); const by = {}; items.forEach((x) => { (by[x.f.c] = by[x.f.c] || []).push(x); }); const txt = 'Lista de la compra\n' + Object.keys(CATS).filter((c) => by[c]).map((c) => '\n' + CATS[c].toUpperCase() + '\n' + by[c].map((x) => '- ' + cleanName(x.f.n) + ': ' + qtyText(x).replace(/<[^>]+>/g, '')).join('\n')).join('\n'); try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); APP.toast('Lista copiada'); } } catch (e) { APP.toast('No se pudo copiar'); } };
  APP.nutri.shopItems = shopItems;

  V.nutri = (arg) => (arg === 'objetivo' ? goalPage() : arg === 'recetas' ? recipesPage() : arg === 'menu' ? menuPage() : arg === 'compra' ? shopPage() : diary());

  // ---------- integración con Inicio y Más ----------
  APP.homeExtra = () => {
    const g = S.gym; const nd = APP.gym && APP.gym.nextDay(); const t = targets(today()); const tot = sum(dayLog(today())); const w = APP.gym && APP.gym.latestWeight();
    return '<div class="tiles"><a class="tile" href="#/gym"><span class="ico">🏋️</span><b>Preparación física</b><span class="pill-n">' + (g && g.current ? 'Entreno en curso' : nd ? 'Toca: ' + esc(nd.d.name) : 'Crea tu rutina') + (w ? ' · ' + w + ' kg' : '') + '</span></a><a class="tile" href="#/nutri"><span class="ico">🍎</span><b>Nutrición</b><span class="pill-n">' + (t ? r0(tot.k) + ' de ' + t.kcal + ' kcal hoy' : 'Calcula tu objetivo') + '</span></a></div>';
  };
  APP.masExtra = (sec) => sec('Físico y nutrición', [['#/gym', '🏋️', 'Preparación física', 'Rutinas, pesos y progreso'], ['#/gym/peso', '⚖️', 'Peso corporal', 'Historial y tendencia'], ['#/nutri', '🍎', 'Nutrición', 'Diario, objetivo y macros'], ['#/nutri/menu', '🗓️', 'Menú semanal', 'Dieta y lista de la compra'], ['#/nutri/recetas', '👩‍🍳', 'Recetas', DB.recipes.length + ' recetas con sus macros']]);
})();
