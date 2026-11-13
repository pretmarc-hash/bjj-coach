/* Preparación física: ejercicios, rutinas (propias o generadas con encuesta), registro de series, progreso y peso corporal. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, chips, sel, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  Object.assign(APP.titles, { gym: 'Preparación física' });
  const num = (v) => Number(String(v === undefined || v === null ? '' : v).replace(',', '.')) || 0;

  // ---------- catálogo de ejercicios ----------
  // [id, nombre, grupo, material, patrón, tipo (w = peso x repeticiones, r = repeticiones, t = segundos), nivel 1-3]
  const GROUPS = { pierna: 'Piernas', gluteo: 'Glúteo e isquios', pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombros', brazo: 'Brazos', core: 'Core', agarre: 'Agarre', potencia: 'Potencia', bjj: 'Específico BJJ', movilidad: 'Movilidad', cardio: 'Cardio' };
  const EQUIP = { bw: 'Sin material', db: 'Mancuernas', bb: 'Barra y discos', kb: 'Kettlebell', band: 'Bandas elásticas', bar: 'Barra de dominadas', dip: 'Paralelas', mach: 'Máquinas', cable: 'Poleas', bench: 'Banco', mb: 'Balón medicinal', box: 'Cajón', cardio: 'Máquina de cardio' };
  const RAW = [
    ['sq-bw', 'Sentadilla con peso corporal', 'pierna', 'bw', 'squat', 'r', 1], ['sq-goblet', 'Sentadilla goblet', 'pierna', 'db|kb', 'squat', 'w', 1], ['sq-bb', 'Sentadilla con barra', 'pierna', 'bb', 'squat', 'w', 2], ['sq-front', 'Sentadilla frontal', 'pierna', 'bb', 'squat', 'w', 3],
    ['leg-press', 'Prensa de piernas', 'pierna', 'mach', 'squat', 'w', 1], ['hack', 'Sentadilla hack', 'pierna', 'mach', 'squat', 'w', 2], ['leg-ext', 'Extensión de cuádriceps', 'pierna', 'mach', 'quad', 'w', 1], ['pistol', 'Sentadilla a una pierna (pistol)', 'pierna', 'bw', 'squat', 'r', 3],
    ['bulgarian', 'Sentadilla búlgara', 'pierna', 'bw|db', 'lunge', 'w', 2], ['lunge', 'Zancadas', 'pierna', 'bw|db', 'lunge', 'w', 1], ['lunge-rev', 'Zancada inversa', 'pierna', 'bw|db', 'lunge', 'w', 1], ['step-up', 'Subida al cajón', 'pierna', 'box|bench', 'lunge', 'w', 1],
    ['calf', 'Elevación de gemelos', 'pierna', 'bw|db|mach', 'calf', 'w', 1], ['wall-sit', 'Sentadilla isométrica en pared', 'pierna', 'bw', 'squat', 't', 1],
    ['dl', 'Peso muerto', 'gluteo', 'bb', 'hinge', 'w', 2], ['rdl', 'Peso muerto rumano', 'gluteo', 'bb|db|kb', 'hinge', 'w', 1], ['rdl-1', 'Peso muerto a una pierna', 'gluteo', 'bw|db|kb', 'hinge', 'w', 2], ['hip-thrust', 'Hip thrust', 'gluteo', 'bb|db|bench', 'hinge', 'w', 1],
    ['bridge', 'Puente de glúteo', 'gluteo', 'bw', 'hinge', 'r', 1], ['bridge-1', 'Puente de glúteo a una pierna', 'gluteo', 'bw', 'hinge', 'r', 2], ['leg-curl', 'Curl femoral', 'gluteo', 'mach', 'ham', 'w', 1], ['nordic', 'Curl nórdico', 'gluteo', 'bw', 'ham', 'r', 3],
    ['hyper', 'Hiperextensiones', 'gluteo', 'mach|bench', 'hinge', 'r', 1], ['gm', 'Buenos días', 'gluteo', 'bb|band', 'hinge', 'w', 2], ['kb-swing', 'Kettlebell swing', 'gluteo', 'kb', 'power', 'w', 2],
    ['bench', 'Press de banca', 'pecho', 'bb', 'pushH', 'w', 2], ['db-press', 'Press con mancuernas', 'pecho', 'db', 'pushH', 'w', 1], ['incline', 'Press inclinado', 'pecho', 'bb|db', 'pushH', 'w', 2], ['chest-mach', 'Press de pecho en máquina', 'pecho', 'mach', 'pushH', 'w', 1],
    ['pushup', 'Flexiones', 'pecho', 'bw', 'pushH', 'r', 1], ['pushup-knee', 'Flexiones con rodillas apoyadas', 'pecho', 'bw', 'pushH', 'r', 1], ['pushup-dec', 'Flexiones declinadas', 'pecho', 'bw', 'pushH', 'r', 2], ['dips', 'Fondos en paralelas', 'pecho', 'dip', 'pushH', 'r', 2],
    ['fly', 'Aperturas', 'pecho', 'db|mach|cable', 'chestAcc', 'w', 1], ['cable-cross', 'Cruce de poleas', 'pecho', 'cable', 'chestAcc', 'w', 1], ['pushup-clap', 'Flexiones con palmada', 'potencia', 'bw', 'power', 'r', 3],
    ['ohp', 'Press militar', 'hombro', 'bb', 'pushV', 'w', 2], ['db-ohp', 'Press de hombros con mancuernas', 'hombro', 'db|kb', 'pushV', 'w', 1], ['sh-mach', 'Press de hombros en máquina', 'hombro', 'mach', 'pushV', 'w', 1], ['pike', 'Flexiones en pica', 'hombro', 'bw', 'pushV', 'r', 2],
    ['hspu', 'Flexiones haciendo el pino (en pared)', 'hombro', 'bw', 'pushV', 'r', 3], ['lat-raise', 'Elevaciones laterales', 'hombro', 'db|cable|band', 'delt', 'w', 1], ['face-pull', 'Face pull', 'hombro', 'cable|band', 'rear', 'w', 1], ['rear-fly', 'Pájaros', 'hombro', 'db|mach', 'rear', 'w', 1],
    ['pullup', 'Dominadas', 'espalda', 'bar', 'pullV', 'r', 2], ['chinup', 'Dominadas supinas', 'espalda', 'bar', 'pullV', 'r', 2], ['pullup-as', 'Dominadas asistidas', 'espalda', 'bar|mach', 'pullV', 'r', 1], ['lat-pd', 'Jalón al pecho', 'espalda', 'cable|mach', 'pullV', 'w', 1],
    ['band-pd', 'Jalón con banda', 'espalda', 'band', 'pullV', 'r', 1], ['row-bb', 'Remo con barra', 'espalda', 'bb', 'pullH', 'w', 2], ['row-db', 'Remo con mancuerna', 'espalda', 'db|kb', 'pullH', 'w', 1], ['row-cable', 'Remo en polea baja', 'espalda', 'cable', 'pullH', 'w', 1],
    ['row-mach', 'Remo en máquina', 'espalda', 'mach', 'pullH', 'w', 1], ['row-inv', 'Remo invertido', 'espalda', 'bar|dip', 'pullH', 'r', 1], ['row-band', 'Remo con banda', 'espalda', 'band', 'pullH', 'r', 1], ['row-towel', 'Remo con toalla en una puerta', 'espalda', 'bw', 'pullH', 'r', 1], ['superman', 'Superman', 'espalda', 'bw', 'pullH', 'r', 1],
    ['curl', 'Curl de bíceps', 'brazo', 'db|bb|cable|band', 'bi', 'w', 1], ['hammer', 'Curl martillo', 'brazo', 'db', 'bi', 'w', 1], ['tri-pd', 'Extensión de tríceps en polea', 'brazo', 'cable|band', 'tri', 'w', 1], ['skull', 'Press francés', 'brazo', 'bb|db', 'tri', 'w', 2],
    ['bench-dip', 'Fondos en banco', 'brazo', 'bw|bench', 'tri', 'r', 1], ['diamond', 'Flexiones diamante', 'brazo', 'bw', 'tri', 'r', 2],
    ['plank', 'Plancha', 'core', 'bw', 'core', 't', 1], ['side-plank', 'Plancha lateral', 'core', 'bw', 'core', 't', 1], ['hollow', 'Hollow hold', 'core', 'bw', 'core', 't', 2], ['dead-bug', 'Dead bug', 'core', 'bw', 'core', 'r', 1], ['bird-dog', 'Bird dog', 'core', 'bw', 'core', 'r', 1],
    ['leg-raise', 'Elevación de piernas tumbado', 'core', 'bw', 'core', 'r', 1], ['hang-raise', 'Elevación de piernas colgado', 'core', 'bar', 'core', 'r', 2], ['ab-wheel', 'Rueda abdominal', 'core', 'bw', 'core', 'r', 2], ['crunch', 'Crunch abdominal', 'core', 'bw|mach|cable', 'core', 'r', 1],
    ['rus-twist', 'Giro ruso', 'core', 'bw|db|kb|mb', 'core', 'r', 1], ['pallof', 'Press Pallof', 'core', 'cable|band', 'core', 'r', 1], ['woodchop', 'Leñador en polea', 'core', 'cable|band', 'core', 'w', 1], ['mtn-climb', 'Escaladores', 'core', 'bw', 'cond', 'r', 1],
    ['farmer', 'Paseo del granjero', 'agarre', 'db|kb', 'carry', 't', 1], ['hang', 'Colgarse de la barra', 'agarre', 'bar', 'grip', 't', 1], ['towel-hang', 'Colgarse de una toalla o del kimono', 'agarre', 'bar', 'grip', 't', 2], ['towel-pullup', 'Dominadas con toalla o kimono', 'agarre', 'bar', 'pullV', 'r', 3], ['wrist-curl', 'Curl de muñeca', 'agarre', 'db|bb', 'grip', 'w', 1],
    ['box-jump', 'Salto al cajón', 'potencia', 'box|bench', 'power', 'r', 2], ['broad-jump', 'Salto horizontal', 'potencia', 'bw', 'power', 'r', 1], ['jump-squat', 'Sentadilla con salto', 'potencia', 'bw', 'power', 'r', 1], ['mb-slam', 'Lanzamiento de balón medicinal al suelo', 'potencia', 'mb', 'power', 'r', 1],
    ['mb-throw', 'Lanzamiento de balón medicinal de pecho', 'potencia', 'mb', 'power', 'r', 1], ['power-clean', 'Cargada de potencia', 'potencia', 'bb', 'power', 'w', 3], ['burpee', 'Burpees', 'potencia', 'bw', 'cond', 'r', 1],
    ['sprawl', 'Sprawls', 'bjj', 'bw', 'cond', 'r', 1], ['shrimp', 'Escape de cadera (gamba)', 'bjj', 'bw', 'drill', 'r', 1], ['tech-standup', 'Levantada técnica', 'bjj', 'bw', 'drill', 'r', 1], ['sit-out', 'Sit-outs', 'bjj', 'bw', 'cond', 'r', 1], ['bear-crawl', 'Desplazamiento de oso', 'bjj', 'bw', 'cond', 't', 1],
    ['tgu', 'Levantamiento turco', 'bjj', 'kb|db', 'carry', 'w', 2], ['bridge-bjj', 'Puente (upa) con giro', 'bjj', 'bw', 'drill', 'r', 1],
    ['hip-9090', 'Movilidad de cadera 90/90', 'movilidad', 'bw', 'mob', 't', 1], ['hip-flexor', 'Estiramiento del flexor de cadera', 'movilidad', 'bw', 'mob', 't', 1], ['deep-squat', 'Sentadilla profunda mantenida', 'movilidad', 'bw', 'mob', 't', 1], ['cat-cow', 'Gato-camello', 'movilidad', 'bw', 'mob', 'r', 1],
    ['t-rot', 'Rotaciones torácicas', 'movilidad', 'bw', 'mob', 'r', 1], ['pigeon', 'Postura de la paloma', 'movilidad', 'bw', 'mob', 't', 1], ['butterfly-st', 'Estiramiento de mariposa', 'movilidad', 'bw', 'mob', 't', 1], ['ham-st', 'Estiramiento de isquios', 'movilidad', 'bw', 'mob', 't', 1],
    ['sh-disloc', 'Movilidad de hombros con banda o palo', 'movilidad', 'bw|band', 'mob', 'r', 1], ['wgs', 'Zancada con rotación', 'movilidad', 'bw', 'mob', 'r', 1], ['neck-mob', 'Movilidad suave de cuello', 'movilidad', 'bw', 'mob', 'r', 1], ['ankle-mob', 'Movilidad de tobillo', 'movilidad', 'bw', 'mob', 'r', 1],
    ['run', 'Carrera', 'cardio', 'bw|cardio', 'cardio', 't', 1], ['bike', 'Bicicleta', 'cardio', 'cardio', 'cardio', 't', 1], ['rower', 'Remo (máquina)', 'cardio', 'cardio', 'cardio', 't', 1], ['rope', 'Comba', 'cardio', 'bw', 'cardio', 't', 1], ['hiit', 'Intervalos de alta intensidad', 'cardio', 'bw|cardio', 'cardio', 't', 2]
  ];
  const BASE = RAW.map((r) => ({ id: r[0], name: r[1], group: r[2], equip: r[3].split('|'), pat: r[4], kind: r[5], lv: r[6] }));
  const G = () => S.gym || (S.gym = { profile: null, routines: [], active: '', logs: [], weights: [], customEx: [], current: null });
  const saveGym = () => APP.saveMeta('gym', G());
  const allEx = () => BASE.concat(G().customEx || []);
  const exById = (id) => allEx().find((e) => e.id === id) || { id, name: 'Ejercicio eliminado', group: 'core', equip: ['bw'], kind: 'w', pat: '', lv: 1 };
  APP.gym = { exById, allEx, GROUPS, EQUIP };

  // ---------- cálculos ----------
  const e1rm = (w, r) => (w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0); // fórmula de Epley
  const setScore = (ex, s) => (ex.kind === 't' ? num(s.r) : ex.kind === 'r' ? num(s.r) + num(s.w) * 0.0001 : e1rm(num(s.w), num(s.r)));
  const doneSets = (en) => (en.sets || []).filter((s) => s.done && (num(s.r) > 0));
  const logsOf = (exId) => G().logs.filter((l) => l.entries.some((en) => en.ex === exId && doneSets(en).length)).sort((a, b) => a.date.localeCompare(b.date));
  const lastEntry = (exId, beforeId) => { const ls = logsOf(exId).filter((l) => l.id !== beforeId); const l = ls[ls.length - 1]; return l ? { log: l, entry: l.entries.find((en) => en.ex === exId) } : null; };
  const fmtSet = (ex, s) => (ex.kind === 't' ? num(s.r) + ' s' : ex.kind === 'r' ? num(s.r) + ' rep' + (num(s.w) ? ' +' + num(s.w) + ' kg' : '') : num(s.w) + ' kg × ' + num(s.r));
  const volume = (l) => l.entries.reduce((a, en) => a + (exById(en.ex).kind === 'w' ? doneSets(en).reduce((b, s) => b + num(s.w) * num(s.r), 0) : 0), 0);
  const bestOf = (ex, en) => doneSets(en).reduce((b, s) => (setScore(ex, s) > (b ? setScore(ex, b) : -1) ? s : b), null);
  const weekLogs = () => { const ws = ST.weekStart(today()); return G().logs.filter((l) => l.date >= ws && l.date <= ST.addDays(ws, 6)); };
  APP.gym.weekLogs = weekLogs; APP.gym.volume = volume;

  // ---------- peso corporal ----------
  const weights = () => G().weights.slice().sort((a, b) => a.date.localeCompare(b.date));
  APP.gym.weights = weights;
  APP.gym.latestWeight = () => { const w = weights(); return w.length ? w[w.length - 1].kg : (S.body && S.body.weight) || 0; };
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  // Media de los últimos 7 días frente a los 7 anteriores: suaviza las oscilaciones diarias.
  APP.gym.weightTrend = () => { const w = weights(); const t = today(); const a = w.filter((x) => x.date > ST.addDays(t, -7)).map((x) => x.kg), b = w.filter((x) => x.date > ST.addDays(t, -14) && x.date <= ST.addDays(t, -7)).map((x) => x.kg); return a.length && b.length ? { now: avg(a), prev: avg(b), diff: avg(a) - avg(b), n: a.length + b.length } : null; };
  A.weightForm = () => { const w = weights(); const last = w[w.length - 1]; APP.openSheet('Peso corporal', '<div class="grid2">' + field('Fecha', '<input type="date" id="bw-date" value="' + today() + '">') + field('Peso (kg)', '<input type="number" id="bw-kg" inputmode="decimal" step="0.1" min="30" max="250" placeholder="' + (last ? last.kg : '') + '">') + '</div><p class="small muted">Pésate siempre en las mismas condiciones (por ejemplo, al levantarte) para que la evolución sea comparable.</p><button class="btn block" data-act="weightSave">Guardar</button>'); };
  A.weightSave = async () => {
    const kg = num(val('bw-kg')); const date = val('bw-date') || today(); if (kg < 30 || kg > 250) return APP.toast('Introduce un peso válido');
    const g = G(); g.weights = g.weights.filter((x) => x.date !== date).concat({ date, kg });
    if (S.body) { const w = weights(); await APP.saveMeta('body', Object.assign({}, S.body, { weight: w[w.length - 1].kg })); }
    await saveGym(); APP.closeSheet(); APP.toast('Peso guardado'); rk();
  };
  A.weightDel = async (el) => { G().weights = G().weights.filter((x) => x.date !== el.dataset.d); await saveGym(); rk(); };
  function weightCard(full) {
    const w = weights(); const tr = APP.gym.weightTrend(); const last = w[w.length - 1];
    const ma = w.map((p, i) => { const win = w.filter((x) => x.date > ST.addDays(p.date, -7) && x.date <= p.date); return { x: p.date, y: avg(win.map((x) => x.kg)) }; });
    return '<div class="card"><div class="row between"><h3>⚖️ Peso corporal</h3><button class="btn small" data-act="weightForm">+ Registrar</button></div>' +
      (last ? '<div class="kpis" style="justify-content:flex-start;gap:24px;text-align:left;margin:6px 0"><div><div class="big">' + last.kg + '<span class="muted" style="font-size:16px"> kg</span></div><div class="label">' + fmtDate(last.date) + '</div></div>' + (tr ? '<div><div class="big" style="font-size:24px;color:' + (Math.abs(tr.diff) < 0.05 ? 'var(--muted)' : 'var(--green)') + '">' + (tr.diff > 0 ? '+' : '') + tr.diff.toFixed(1) + ' kg</div><div class="label">media 7 días vs 7 anteriores (n = ' + tr.n + ')</div></div>' : '') + '</div>' : '<p class="muted">Registra tu peso para ver la evolución.</p>') +
      (w.length >= 2 ? APP.line([{ points: w.map((p) => ({ x: p.date, y: p.kg })), color: 'var(--green-2)' }, { points: ma, color: 'var(--gold)', dashed: true }], { unit: ' kg', label: 'Peso corporal' }) + '<p class="small muted">Línea continua: pesajes. Discontinua: media móvil de 7 días.</p>' : '') +
      (full && w.length ? '<div class="list" style="margin-top:8px">' + w.slice().reverse().slice(0, 30).map((p) => '<div class="item"><div>' + fmtDate(p.date) + '</div><div class="row"><b>' + p.kg + ' kg</b><button class="icon-btn" style="width:32px;height:32px" data-act="weightDel" data-d="' + p.date + '" aria-label="Borrar">✕</button></div></div>').join('') + '</div>' : (!full && w.length ? '<a href="#/gym/peso">Ver historial</a>' : '')) + '</div>';
  }
  APP.gym.weightCard = weightCard;

  // ---------- generador de rutinas ----------
  const GOALS = [['musculo', 'Ganar músculo'], ['fuerza', 'Ganar fuerza'], ['grasa', 'Perder grasa'], ['explosividad', 'Explosividad para BJJ'], ['resistencia', 'Resistencia para BJJ'], ['movilidad', 'Movilidad'], ['agarre', 'Agarre y core para BJJ'], ['salud', 'Forma física general']];
  const PLACES = [['casa', 'Casa'], ['calistenia', 'Calistenia (parque o barras)'], ['gimnasio', 'Gimnasio']];
  const SCHEME = {
    musculo: { main: [4, '8-10', 90], acc: [3, '10-12', 60] }, fuerza: { main: [5, '4-6', 150], acc: [3, '6-8', 90] }, grasa: { main: [3, '10-12', 60], acc: [3, '12-15', 45] }, explosividad: { main: [4, '4-6', 120], acc: [3, '8-10', 75] },
    resistencia: { main: [3, '12-15', 45], acc: [3, '15-20', 30] }, movilidad: { main: [3, '8-10', 60], acc: [2, '10-12', 45] }, agarre: { main: [4, '6-8', 90], acc: [3, '10-12', 60] }, salud: { main: [3, '8-12', 75], acc: [2, '10-15', 60] }
  };
  const SPLITS = {
    2: [['Cuerpo completo A', ['squat', 'pushH', 'pullH', 'hinge', 'core']], ['Cuerpo completo B', ['hinge', 'pushV', 'pullV', 'lunge', 'core']]],
    3: [['Cuerpo completo A', ['squat', 'pushH', 'pullH', 'core', 'carry']], ['Cuerpo completo B', ['hinge', 'pushV', 'pullV', 'lunge', 'core']], ['Cuerpo completo C', ['lunge', 'pushH', 'pullV', 'hinge', 'core']]],
    4: [['Tren superior A', ['pushH', 'pullH', 'pushV', 'pullV', 'bi', 'tri']], ['Tren inferior A', ['squat', 'hinge', 'lunge', 'calf', 'core']], ['Tren superior B', ['pullV', 'pushH', 'pullH', 'delt', 'rear', 'core']], ['Tren inferior B', ['hinge', 'squat', 'lunge', 'ham', 'core']]],
    5: [['Empuje', ['pushH', 'pushV', 'chestAcc', 'delt', 'tri']], ['Tirón', ['pullV', 'pullH', 'rear', 'bi', 'grip']], ['Pierna', ['squat', 'hinge', 'lunge', 'calf', 'core']], ['Tren superior', ['pushH', 'pullH', 'pushV', 'pullV', 'core']], ['Tren inferior y core', ['hinge', 'squat', 'lunge', 'core', 'carry']]]
  };
  const FALLBACK = { quad: 'squat', ham: 'hinge', chestAcc: 'pushH', delt: 'pushV', rear: 'pullH', carry: 'core', grip: 'pullH', calf: 'lunge', bi: 'pullH', tri: 'pushH', pushV: 'pushH', pullV: 'pullH' };
  function equipFor(p) { const base = { casa: ['bw'], calistenia: ['bw', 'bar', 'dip'], gimnasio: Object.keys(EQUIP) }[p.place] || ['bw']; return Array.from(new Set(base.concat(p.equip || []))); }
  const seen = {}; // veces que un ejercicio ya aparece en otros días de la rutina que se está generando
  function pick(pat, eq, p, used, avoid) {
    let pool = BASE.filter((e) => e.pat === pat && e.equip.some((q) => eq.includes(q)) && e.lv <= p.level && !used.has(e.id) && !avoid.has(e.id));
    if (!pool.length && FALLBACK[pat]) return pick(FALLBACK[pat], eq, p, used, avoid);
    if (!pool.length) return null;
    // Preferencia: en gimnasio, pesos libres y máquinas antes que peso corporal; el ejercicio más exigente que permita el nivel.
    const score = (e) => (p.place === 'gimnasio' && e.equip.every((q) => q === 'bw') ? -2 : 0) + (p.level === 1 && e.equip.includes('mach') ? 1 : 0) + e.lv + (e.kind === 'w' && p.place !== 'calistenia' ? 0.5 : 0) - 1.6 * (seen[e.id] || 0);
    pool.sort((a, b) => score(b) - score(a)); seen[pool[0].id] = (seen[pool[0].id] || 0) + 1; return pool[0];
  }
  function generate(p) {
    Object.keys(seen).forEach((k) => delete seen[k]);
    const eq = equipFor(p); const sc = SCHEME[p.goal] || SCHEME.salud; const inj = p.injuries || []; const notes = []; const avoid = new Set();
    if (inj.includes('rodillas')) { ['jump-squat', 'box-jump', 'broad-jump', 'pistol', 'burpee', 'hack'].forEach((x) => avoid.add(x)); notes.push('Por tus rodillas se han evitado los saltos y las sentadillas más exigentes.'); }
    if (inj.includes('hombros')) { ['ohp', 'hspu', 'dips', 'pike', 'pushup-clap', 'bench-dip'].forEach((x) => avoid.add(x)); notes.push('Por tus hombros se han evitado los fondos y los empujes más exigentes por encima de la cabeza.'); }
    if (inj.includes('lumbar')) { ['dl', 'gm', 'row-bb', 'power-clean', 'kb-swing'].forEach((x) => avoid.add(x)); notes.push('Por tu zona lumbar se han evitado el peso muerto convencional y los ejercicios con el tronco inclinado y carga.'); }
    if (inj.includes('cuello')) notes.push('Cuida el cuello: no tires de la cabeza en los abdominales.');
    const maxEx = { 30: 4, 45: 5, 60: 6, 75: 7 }[p.minutes] || 5; const lvSets = p.level === 1 ? -1 : 0;
    const item = (e, kind) => { const s = sc[kind]; const sets = Math.max(2, s[0] + lvSets); return { ex: e.id, sets, reps: e.kind === 't' ? (e.pat === 'mob' ? '30-45 s' : e.pat === 'cardio' ? '10-15 min' : '20-40 s') : s[1], rest: s[2] }; };
    let days;
    if (p.goal === 'movilidad') {
      const mob = BASE.filter((e) => e.pat === 'mob'); const half = Math.ceil(mob.length / 2);
      days = [['Movilidad A: cadera y piernas', mob.filter((e) => /hip|squat|pigeon|butterfly|ham|ankle/.test(e.id))], ['Movilidad B: columna y hombros', mob.filter((e) => /cat|t-rot|sh-|wgs|neck|hip-flexor/.test(e.id))]].slice(0, Math.max(1, Math.min(2, p.days)))
        .map((d) => ({ id: uid(), name: d[0], items: (d[1].length ? d[1] : mob.slice(0, half)).map((e) => ({ ex: e.id, sets: 2, reps: e.kind === 't' ? '30-45 s' : '8-10', rest: 15 })) }));
      notes.push('Rutina corta para hacer a diario o después de entrenar. Sin dolor: llega solo hasta una tensión cómoda.');
    } else {
      const split = SPLITS[Math.max(2, Math.min(5, p.days))];
      days = split.map((d, di) => {
        const used = new Set(); const items = [];
        if (p.goal === 'explosividad') { const pw = pick('power', eq, p, used, avoid); if (pw) { used.add(pw.id); items.push({ ex: pw.id, sets: 4, reps: '3-5', rest: 120, note: 'Máxima velocidad, sin llegar al cansancio' }); } }
        d[1].forEach((pat, i) => { if (items.length >= maxEx) return; const e = pick(pat, eq, p, used, avoid); if (e) { used.add(e.id); items.push(item(e, i < 2 ? 'main' : 'acc')); } });
        // Si con el material disponible faltan ejercicios, se completa con otros patrones para no dejar el día corto.
        const fill = ['core', 'pullH', 'pushH', 'squat', 'hinge', 'lunge', 'core', 'cond', 'drill']; for (let fi = 0; items.length < Math.min(maxEx, 4) && fi < fill.length * 2; fi++) { const e = pick(fill[fi % fill.length], eq, p, used, avoid); if (e) { used.add(e.id); items.push(item(e, 'acc')); } }
        const extra = (pat, it) => { const e = pick(pat, eq, p, used, avoid); if (e) { used.add(e.id); if (items.length >= maxEx) items.pop(); items.push(Object.assign(item(e, 'acc'), it || {})); } };
        if (p.goal === 'agarre') extra(di % 2 ? 'carry' : 'grip', { sets: 3 });
        if (p.goal === 'resistencia' || p.goal === 'grasa') extra('cond', { sets: 3, reps: '30 s', rest: 30, note: 'Circuito final a ritmo alto' });
        return { id: uid(), name: d[0], items };
      });
      if (p.bjjDays >= 4) notes.push('Entrenas BJJ ' + p.bjjDays + ' días por semana: empieza con las series más bajas y deja margen (1-3 repeticiones sin llegar al fallo) para recuperarte.');
      if (p.goal === 'explosividad') notes.push('Los ejercicios de potencia van primero, descansado y con pocas repeticiones rápidas.');
      if (p.goal === 'grasa') notes.push('La pérdida de grasa depende sobre todo de la alimentación: mira tu objetivo de calorías en Nutrición.');
    }
    const g = GOALS.find((x) => x[0] === p.goal);
    return { id: uid(), name: (g ? g[1] : 'Rutina') + ' · ' + (p.goal === 'movilidad' ? days.length : p.days) + ' días', days, generated: true, notes, created: today() };
  }
  APP.gym.generate = generate;

  A.gymSurvey = () => {
    const p = G().profile || {}; const bjj = Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length || (S.profile && S.profile.weeklyTarget) || 0;
    APP.openSheet('Crear mi rutina', '<div class="explain">Responde y te preparo una rutina orientativa que luego puedes editar a tu gusto.</div>' +
      group('¿Qué quieres conseguir?', chips('gy-goal', GOALS.map((x) => ({ v: x[0], l: x[1] })), p.goal || null, false, true)) +
      group('¿Dónde entrenas?', chips('gy-place', PLACES.map((x) => ({ v: x[0], l: x[1] })), p.place || null, false, true)) +
      group('Material que tienes además (si entrenas en casa o en el parque)', chips('gy-equip', ['db', 'kb', 'band', 'bar', 'dip', 'bench', 'bb', 'mb', 'box'].map((k) => ({ v: k, l: EQUIP[k] })), p.equip || [], true, true)) +
      group('Días de preparación física por semana', chips('gy-days', ['2', '3', '4', '5'], String(p.days || 3), false, true)) +
      group('Tiempo por sesión', chips('gy-min', [{ v: '30', l: '30 min' }, { v: '45', l: '45 min' }, { v: '60', l: '60 min' }, { v: '75', l: '75 min' }], String(p.minutes || 45), false, true)) +
      group('Experiencia con pesas', chips('gy-level', [{ v: '1', l: 'Principiante' }, { v: '2', l: 'Intermedio' }, { v: '3', l: 'Avanzado' }], String(p.level || 1), false, true)) +
      field('Días de BJJ por semana', '<input type="number" id="gy-bjj" min="0" max="14" inputmode="numeric" value="' + (p.bjjDays !== undefined ? p.bjjDays : bjj) + '">') +
      group('Molestias o lesiones', chips('gy-inj', [['rodillas', 'Rodillas'], ['hombros', 'Hombros'], ['lumbar', 'Zona lumbar'], ['cuello', 'Cuello']].map((x) => ({ v: x[0], l: x[1] })), p.injuries || (S.body && S.body.injuries) || [], true, true)) +
      '<button class="btn block" data-act="gymSurveySave">Crear rutina</button>');
  };
  A.gymSurveySave = async () => {
    const p = { goal: sel('gy-goal')[0], place: sel('gy-place')[0], equip: sel('gy-equip'), days: Number(sel('gy-days')[0]) || 3, minutes: Number(sel('gy-min')[0]) || 45, level: Number(sel('gy-level')[0]) || 1, bjjDays: Number(val('gy-bjj')) || 0, injuries: sel('gy-inj') };
    if (!p.goal || !p.place) return APP.toast('Elige tu objetivo y dónde entrenas');
    const g = G(); g.profile = p; const r = generate(p); g.routines.push(r); g.active = r.id; await saveGym(); APP.closeSheet(); APP.go('#/gym/r-' + r.id); APP.toast('Rutina creada');
  };

  // ---------- rutinas ----------
  const routine = (id) => G().routines.find((r) => r.id === id);
  const targetText = (it) => it.sets + ' × ' + it.reps + (it.rest ? ' · descanso ' + (it.rest >= 60 ? Math.floor(it.rest / 60) + ' min' + (it.rest % 60 ? ' ' + (it.rest % 60) + ' s' : '') : it.rest + ' s') : '');
  function routinePage(r) {
    if (!r) return '<div class="card"><p>No se encuentra la rutina.</p><a href="#/gym/rutinas">Volver</a></div>';
    const g = G();
    return '<div class="row between" style="margin-bottom:10px"><a class="btn small ghost" style="text-decoration:none" href="#/gym/rutinas">← Rutinas</a>' + (g.active === r.id ? '<span class="tag recomendacion">Rutina activa</span>' : '<button class="btn small" data-act="routineActive" data-id="' + r.id + '">Usar esta rutina</button>') + '</div>' +
      '<div class="card hero"><div class="row between"><h2>' + esc(r.name) + '</h2><button class="btn small secondary" data-act="routineRename" data-id="' + r.id + '">Renombrar</button></div><div class="muted">' + r.days.length + ' días' + (r.generated ? ' · creada con la encuesta' : ' · propia') + '</div></div>' +
      (r.notes && r.notes.length ? '<div class="explain"><b>Rutina orientativa.</b> ' + r.notes.map(esc).join(' ') + ' Si tienes una lesión o dudas con la técnica de un ejercicio, consulta a un profesional.</div>' : (r.generated ? '<div class="explain"><b>Rutina orientativa</b>, pensada como punto de partida. Edítala a tu gusto. Si tienes una lesión o dudas con la técnica de un ejercicio, consulta a un profesional.</div>' : '')) +
      r.days.map((d, di) => '<div class="card"><div class="row between"><h3>' + esc(d.name) + '</h3><button class="btn small" data-act="workoutStart" data-r="' + r.id + '" data-d="' + d.id + '">▶ Empezar</button></div>' +
        (d.items.length ? '<div class="list">' + d.items.map((it, i) => { const e = exById(it.ex); return '<div class="item"><a href="#" data-act="itemEdit" data-r="' + r.id + '" data-d="' + d.id + '" data-i="' + i + '" style="text-decoration:none;color:inherit;flex:1"><div class="title">' + esc(e.name) + '</div><div class="pill-n">' + targetText(it) + (it.note ? ' · ' + esc(it.note) : '') + '</div></a><div class="row" style="gap:4px"><button class="icon-btn sm" data-act="itemMove" data-r="' + r.id + '" data-d="' + d.id + '" data-i="' + i + '" data-n="-1"' + (i ? '' : ' disabled') + ' aria-label="Subir">↑</button><button class="icon-btn sm" data-act="itemMove" data-r="' + r.id + '" data-d="' + d.id + '" data-i="' + i + '" data-n="1"' + (i < d.items.length - 1 ? '' : ' disabled') + ' aria-label="Bajar">↓</button></div></div>'; }).join('') + '</div>' : '<p class="muted small">Día vacío.</p>') +
        '<div class="row wrap" style="margin-top:10px"><button class="btn small secondary" data-act="exPick" data-mode="routine" data-r="' + r.id + '" data-d="' + d.id + '">+ Ejercicio</button><button class="btn small ghost" data-act="dayRename" data-r="' + r.id + '" data-d="' + d.id + '">Renombrar día</button>' + (r.days.length > 1 ? '<button class="btn small ghost" data-act="dayDel" data-r="' + r.id + '" data-d="' + d.id + '">Quitar día</button>' : '') + '</div></div>').join('') +
      '<div class="stack"><button class="btn secondary block" data-act="dayAdd" data-r="' + r.id + '">+ Añadir día</button><button class="btn ghost block" data-act="routineDup" data-id="' + r.id + '">Duplicar rutina</button><button class="btn danger block" data-act="routineDel" data-id="' + r.id + '">Borrar rutina</button></div>';
  }
  function routinesPage() {
    const g = G();
    return '<div class="row" style="margin-bottom:12px"><button class="btn block" data-act="gymSurvey">✨ Crear con encuesta</button><button class="btn secondary block" data-act="routineNew">+ Rutina propia</button></div>' +
      (g.routines.length ? g.routines.map((r) => '<a class="card" href="#/gym/r-' + r.id + '" style="display:block;text-decoration:none;color:inherit"><div class="row between"><h3>' + esc(r.name) + '</h3>' + (g.active === r.id ? '<span class="tag recomendacion">Activa</span>' : '<span class="muted">›</span>') + '</div><div class="pill-n">' + r.days.map((d) => esc(d.name)).join(' · ') + '</div></a>').join('') : '<div class="card empty">Todavía no tienes rutinas.<br>Crea una con la encuesta o móntala tú mismo.</div>');
  }
  A.routineNew = () => APP.openSheet('Rutina propia', field('Nombre', '<input id="rt-name" placeholder="Ej.: Mi rutina de fuerza">') + group('¿Cuántos días tiene?', chips('rt-days', ['1', '2', '3', '4', '5', '6'], '3', false, true)) + '<button class="btn block" data-act="routineCreate">Crear y añadir ejercicios</button>');
  A.routineCreate = async () => { const n = Number(sel('rt-days')[0]) || 3; const g = G(); const r = { id: uid(), name: val('rt-name').trim() || 'Mi rutina', days: Array.from({ length: n }, (_, i) => ({ id: uid(), name: 'Día ' + (i + 1), items: [] })), created: today() }; g.routines.push(r); if (!g.active) g.active = r.id; await saveGym(); APP.closeSheet(); APP.go('#/gym/r-' + r.id); };
  A.routineActive = async (el) => { G().active = el.dataset.id; await saveGym(); rk(); };
  A.routineRename = (el) => { const r = routine(el.dataset.id); APP.openSheet('Renombrar rutina', field('Nombre', '<input id="rt-name" value="' + esc(r.name) + '">') + '<button class="btn block" data-act="routineRenameSave" data-id="' + r.id + '">Guardar</button>'); };
  A.routineRenameSave = async (el) => { const r = routine(el.dataset.id); r.name = val('rt-name').trim() || r.name; await saveGym(); APP.closeSheet(); rk(); };
  A.routineDup = async (el) => { const r = routine(el.dataset.id); const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name = r.name + ' (copia)'; c.generated = false; c.days.forEach((d) => { d.id = uid(); }); G().routines.push(c); await saveGym(); APP.go('#/gym/r-' + c.id); };
  A.routineDel = async (el) => { if (!APP.confirm('¿Borrar esta rutina? Tus entrenos registrados se conservan.')) return; const g = G(); g.routines = g.routines.filter((r) => r.id !== el.dataset.id); if (g.active === el.dataset.id) g.active = g.routines[0] ? g.routines[0].id : ''; await saveGym(); APP.go('#/gym/rutinas'); };
  const dayOf = (el) => { const r = routine(el.dataset.r); return { r, d: r && r.days.find((x) => x.id === el.dataset.d) }; };
  A.dayAdd = async (el) => { const r = routine(el.dataset.r); r.days.push({ id: uid(), name: 'Día ' + (r.days.length + 1), items: [] }); await saveGym(); rk(); };
  A.dayDel = async (el) => { const { r, d } = dayOf(el); if (!APP.confirm('¿Quitar «' + d.name + '»?')) return; r.days = r.days.filter((x) => x !== d); await saveGym(); rk(); };
  A.dayRename = (el) => { const { d } = dayOf(el); APP.openSheet('Renombrar día', field('Nombre', '<input id="dy-name" value="' + esc(d.name) + '">') + '<button class="btn block" data-act="dayRenameSave" data-r="' + el.dataset.r + '" data-d="' + d.id + '">Guardar</button>'); };
  A.dayRenameSave = async (el) => { const { d } = dayOf(el); d.name = val('dy-name').trim() || d.name; await saveGym(); APP.closeSheet(); rk(); };
  A.itemMove = async (el) => { const { d } = dayOf(el); const i = Number(el.dataset.i), j = i + Number(el.dataset.n); if (j < 0 || j >= d.items.length) return; const t = d.items[i]; d.items[i] = d.items[j]; d.items[j] = t; await saveGym(); rk(); };
  A.itemEdit = (el) => {
    const { d } = dayOf(el); const i = Number(el.dataset.i); const it = d.items[i]; const e = exById(it.ex); const ds = 'data-r="' + el.dataset.r + '" data-d="' + d.id + '" data-i="' + i + '"';
    APP.openSheet(e.name, '<p class="muted small">' + GROUPS[e.group] + ' · ' + e.equip.map((q) => EQUIP[q]).join(', ') + '</p><div class="grid2">' + field('Series', '<input type="number" id="it-sets" min="1" max="12" inputmode="numeric" value="' + it.sets + '">') + field(e.kind === 't' ? 'Tiempo' : 'Repeticiones', '<input id="it-reps" value="' + esc(it.reps) + '" placeholder="8-12">') + '</div>' +
      field('Descanso (segundos)', '<input type="number" id="it-rest" min="0" max="600" step="15" inputmode="numeric" value="' + (it.rest || 0) + '">') + field('Nota', '<input id="it-note" placeholder="Opcional" value="' + esc(it.note || '') + '">') +
      '<div class="stack"><button class="btn block" data-act="itemSave" ' + ds + '>Guardar</button><button class="btn secondary block" data-act="exPick" data-mode="replace" ' + ds + '>Cambiar por otro ejercicio</button><button class="btn ghost block" data-act="exProgress" data-ex="' + e.id + '">Ver mi progreso</button><button class="btn danger block" data-act="itemDel" ' + ds + '>Quitar de la rutina</button></div>');
  };
  A.itemSave = async (el) => { const { d } = dayOf(el); const it = d.items[Number(el.dataset.i)]; Object.assign(it, { sets: Math.max(1, Number(val('it-sets')) || it.sets), reps: val('it-reps').trim() || it.reps, rest: Number(val('it-rest')) || 0, note: val('it-note').trim() }); await saveGym(); APP.closeSheet(); rk(); };
  A.itemDel = async (el) => { const { d } = dayOf(el); d.items.splice(Number(el.dataset.i), 1); await saveGym(); APP.closeSheet(); rk(); };

  // ---------- selector de ejercicios ----------
  ui.exPick = { q: '', group: 'all', equip: 'all' };
  function exList() {
    const u = ui.exPick; const q = ST.norm(u.q);
    const rows = allEx().filter((e) => (u.group === 'all' || e.group === u.group) && (u.equip === 'all' || e.equip.includes(u.equip)) && (!q || ST.norm(e.name).includes(q)));
    return rows.length ? '<div class="list">' + rows.map((e) => '<a href="#" class="item" data-act="exChoose" data-ex="' + e.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(e.name) + '</div><div class="pill-n">' + GROUPS[e.group] + ' · ' + e.equip.map((x) => EQUIP[x]).join(', ') + '</div></div><span class="muted">' + (u.mode === 'browse' ? '›' : '+') + '</span></a>').join('') + '</div>' : '<div class="empty">Ningún ejercicio coincide.</div>';
  }
  function exPickHTML() {
    const u = ui.exPick; const opt = (o, cur) => Object.keys(o).map((k) => '<option value="' + k + '"' + (cur === k ? ' selected' : '') + '>' + o[k] + '</option>').join('');
    return '<input type="search" placeholder="Buscar ejercicio…" value="' + esc(u.q) + '" data-input="exSearch" style="margin-bottom:8px"><div class="grid2" style="margin-bottom:8px"><select data-input="exFilter" data-k="group"><option value="all">Todos los grupos</option>' + opt(GROUPS, u.group) + '</select><select data-input="exFilter" data-k="equip"><option value="all">Todo el material</option>' + opt(EQUIP, u.equip) + '</select></div><div id="ex-list">' + exList() + '</div><button class="btn ghost block" style="margin-top:10px" data-act="exCustom">+ Crear ejercicio propio</button>';
  }
  A.exPick = (el) => { Object.assign(ui.exPick, { mode: el.dataset.mode, r: el.dataset.r, d: el.dataset.d, i: el.dataset.i, q: '' }); APP.openSheet(el.dataset.mode === 'browse' ? 'Ejercicios' : 'Elegir ejercicio', exPickHTML()); };
  A.exSearch = (el) => { ui.exPick.q = el.value; const l = APP.$('#ex-list'); if (l) l.innerHTML = exList(); };
  A.exFilter = (el) => { ui.exPick[el.dataset.k] = el.value; const l = APP.$('#ex-list'); if (l) l.innerHTML = exList(); };
  A.exChoose = async (el) => {
    const u = ui.exPick; const e = exById(el.dataset.ex); const g = G();
    if (u.mode === 'browse') return A.exProgress({ dataset: { ex: e.id } });
    if (u.mode === 'workout') { g.current.entries.push({ ex: e.id, target: '', sets: [{ w: '', r: '' }, { w: '', r: '' }, { w: '', r: '' }] }); prefill(g.current.entries[g.current.entries.length - 1]); }
    else { const { d } = dayOf({ dataset: u }); const p = g.profile || {}; const sc = (SCHEME[p.goal] || SCHEME.salud).acc; if (u.mode === 'replace') d.items[Number(u.i)].ex = e.id; else d.items.push({ ex: e.id, sets: sc[0], reps: e.kind === 't' ? '30 s' : sc[1], rest: sc[2] }); }
    await saveGym(); APP.closeSheet(); rk(); APP.toast(e.name + (u.mode === 'replace' ? ': cambiado' : ': añadido'));
  };
  A.exCustom = () => APP.openSheet('Ejercicio propio', field('Nombre', '<input id="cx-name">') + group('Grupo', chips('cx-group', Object.keys(GROUPS).map((k) => ({ v: k, l: GROUPS[k] })), 'pierna', false, true)) + group('Material', chips('cx-equip', Object.keys(EQUIP).map((k) => ({ v: k, l: EQUIP[k] })), ['bw'], true, true)) + group('Se registra con', chips('cx-kind', [{ v: 'w', l: 'Peso y repeticiones' }, { v: 'r', l: 'Solo repeticiones' }, { v: 't', l: 'Tiempo (segundos)' }], 'w', false, true)) + '<button class="btn block" data-act="exCustomSave">Guardar</button>');
  A.exCustomSave = async () => {
    const name = val('cx-name').trim(); if (!name) return APP.toast('Escribe el nombre');
    if (allEx().some((e) => ST.norm(e.name) === ST.norm(name))) return APP.toast('Ya existe un ejercicio con ese nombre');
    G().customEx.push({ id: 'cx-' + uid(), name, group: sel('cx-group')[0] || 'pierna', equip: sel('cx-equip').length ? sel('cx-equip') : ['bw'], kind: sel('cx-kind')[0] || 'w', pat: 'custom', lv: 1, custom: true });
    await saveGym(); ui.exPick.q = name; APP.openSheet('Elegir ejercicio', exPickHTML()); APP.toast('Ejercicio creado');
  };

  // ---------- entreno en curso ----------
  function prefill(en) { const last = lastEntry(en.ex); if (!last) return; const ls = doneSets(last.entry); en.sets.forEach((s, i) => { const p = ls[Math.min(i, ls.length - 1)]; if (p) { s.pw = p.w; s.pr = p.r; } }); }
  A.workoutStart = async (el) => {
    const g = G(); if (g.current && !APP.confirm('Tienes un entreno sin terminar. ¿Descartarlo y empezar otro?')) return APP.go('#/gym/entreno');
    const r = el.dataset.r ? routine(el.dataset.r) : null; const d = r ? r.days.find((x) => x.id === el.dataset.d) : null;
    g.current = { id: uid(), date: today(), start: Date.now(), routineId: r ? r.id : '', dayId: d ? d.id : '', name: d ? d.name : 'Entreno libre', entries: (d ? d.items : []).map((it) => ({ ex: it.ex, target: targetText(it), rest: it.rest || 0, note: it.note || '', sets: Array.from({ length: it.sets }, () => ({ w: '', r: '' })) })) };
    g.current.entries.forEach(prefill); await saveGym(); APP.closeSheet(); APP.go('#/gym/entreno');
  };
  function workoutPage() {
    const c = G().current; if (!c) return '<div class="card empty">No hay ningún entreno en curso.<br><a href="#/gym">Volver</a></div>';
    const total = c.entries.reduce((a, en) => a + en.sets.length, 0), done = c.entries.reduce((a, en) => a + en.sets.filter((s) => s.done).length, 0);
    return '<div class="card hero"><div class="row between"><div><h2>' + esc(c.name) + '</h2><div class="muted">' + done + ' de ' + total + ' series</div></div>' + APP.ring(ST.pct(done, total || 1), ST.pct(done, total || 1) + '%', '', '#fff') + '</div></div><div id="rest-bar" class="rest-bar" hidden></div>' +
      c.entries.map((en, ei) => {
        const e = exById(en.ex); const last = lastEntry(en.ex, c.id);
        return '<div class="card"><div class="row between"><h3>' + esc(e.name) + '</h3><button class="icon-btn sm" data-act="wEntryMenu" data-e="' + ei + '" aria-label="Opciones">⋯</button></div><div class="pill-n">' + (en.target ? 'Objetivo: ' + esc(en.target) : GROUPS[e.group]) + (en.note ? ' · ' + esc(en.note) : '') + '</div>' +
          (last ? '<div class="pill-n">Última vez (' + fmtDate(last.log.date) + '): ' + doneSets(last.entry).map((s) => fmtSet(e, s)).join(' · ') + '</div>' : '<div class="pill-n">Primera vez que lo registras.</div>') +
          '<div class="sets"><div class="set head"><span>#</span><span>' + (e.kind === 't' ? '' : e.kind === 'r' ? 'Lastre kg' : 'Kg') + '</span><span>' + (e.kind === 't' ? 'Segundos' : 'Reps') + '</span><span></span></div>' +
          en.sets.map((s, si) => '<div class="set' + (s.done ? ' done' : '') + '"><span>' + (si + 1) + '</span>' + (e.kind === 't' ? '<span></span>' : '<input type="number" inputmode="decimal" step="0.5" min="0" data-input="wSet" data-e="' + ei + '" data-s="' + si + '" data-k="w" value="' + esc(s.w) + '" placeholder="' + esc(s.pw !== undefined && s.pw !== '' ? s.pw : (e.kind === 'r' ? '0' : '')) + '">') +
            '<input type="number" inputmode="numeric" min="0" data-input="wSet" data-e="' + ei + '" data-s="' + si + '" data-k="r" value="' + esc(s.r) + '" placeholder="' + esc(s.pr !== undefined ? s.pr : '') + '"><button class="chk" data-act="wDone" data-e="' + ei + '" data-s="' + si + '" aria-label="Serie hecha">' + (s.done ? '✓' : '') + '</button></div>').join('') + '</div>' +
          '<div class="row" style="margin-top:8px"><button class="btn small ghost" data-act="wAddSet" data-e="' + ei + '">+ Serie</button>' + (en.sets.length > 1 ? '<button class="btn small ghost" data-act="wDelSet" data-e="' + ei + '">− Serie</button>' : '') + '</div></div>';
      }).join('') +
      '<div class="stack"><button class="btn secondary block" data-act="exPick" data-mode="workout">+ Añadir ejercicio</button><button class="btn block" data-act="wFinish">Terminar entreno</button><button class="btn ghost block" data-act="wCancel">Descartar</button></div>';
  }
  A.wSet = (el) => { const c = G().current; const s = c.entries[Number(el.dataset.e)].sets[Number(el.dataset.s)]; s[el.dataset.k] = el.value; clearTimeout(ui.wSaveT); ui.wSaveT = setTimeout(saveGym, 600); };
  let restT = null;
  function startRest(sec) {
    clearInterval(restT); const bar = APP.$('#rest-bar'); if (!bar || !sec) return; const end = Date.now() + sec * 1000;
    const paint = () => { const b = APP.$('#rest-bar'); if (!b) return clearInterval(restT); const left = Math.max(0, Math.round((end - Date.now()) / 1000)); b.hidden = false; b.innerHTML = '<span>⏱ Descanso <b>' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</b></span><button class="btn small ghost" data-act="restSkip">Saltar</button>'; if (left <= 0) { clearInterval(restT); b.innerHTML = '<span>✅ Descanso terminado</span>'; if (navigator.vibrate) { try { navigator.vibrate(200); } catch (e) { /* ignorado */ } } setTimeout(() => { const x = APP.$('#rest-bar'); if (x) x.hidden = true; }, 4000); } };
    paint(); restT = setInterval(paint, 500);
  }
  A.restSkip = () => { clearInterval(restT); const b = APP.$('#rest-bar'); if (b) b.hidden = true; };
  A.wDone = async (el) => {
    const c = G().current; const en = c.entries[Number(el.dataset.e)]; const s = en.sets[Number(el.dataset.s)]; const e = exById(en.ex);
    if (!s.done) { if (s.r === '' && s.pr !== undefined) s.r = s.pr; if (s.w === '' && s.pw !== undefined && e.kind !== 't') s.w = s.pw; if (!(num(s.r) > 0)) return APP.toast(e.kind === 't' ? 'Indica los segundos' : 'Indica las repeticiones'); }
    s.done = !s.done; await saveGym(); rk(); if (s.done) startRest(en.rest);
  };
  A.wAddSet = async (el) => { const en = G().current.entries[Number(el.dataset.e)]; const l = en.sets[en.sets.length - 1] || {}; en.sets.push({ w: '', r: '', pw: l.w !== '' && l.w !== undefined ? l.w : l.pw, pr: l.r !== '' && l.r !== undefined ? l.r : l.pr }); await saveGym(); rk(); };
  A.wDelSet = async (el) => { G().current.entries[Number(el.dataset.e)].sets.pop(); await saveGym(); rk(); };
  A.wEntryMenu = (el) => { const en = G().current.entries[Number(el.dataset.e)]; const e = exById(en.ex); APP.openSheet(e.name, '<div class="stack"><button class="btn secondary block" data-act="exProgress" data-ex="' + e.id + '">Ver mi progreso</button><button class="btn danger block" data-act="wEntryDel" data-e="' + el.dataset.e + '">Quitar de este entreno</button></div>'); };
  A.wEntryDel = async (el) => { G().current.entries.splice(Number(el.dataset.e), 1); await saveGym(); APP.closeSheet(); rk(); };
  A.wCancel = async () => { if (!APP.confirm('¿Descartar este entreno? No se guardará nada.')) return; G().current = null; clearInterval(restT); await saveGym(); APP.go('#/gym'); };
  A.wFinish = () => {
    const c = G().current; const n = c.entries.reduce((a, en) => a + doneSets(en).length, 0); if (!n) return APP.toast('Marca al menos una serie como hecha (✓)');
    const mins = Math.max(1, Math.round((Date.now() - c.start) / 60000));
    APP.openSheet('Terminar entreno', '<p>' + n + ' series completadas.</p>' + field('Duración (minutos)', '<input type="number" id="wf-dur" inputmode="numeric" min="1" max="300" value="' + Math.min(mins, 300) + '">') + group('Esfuerzo percibido (1 suave – 5 máximo)', APP.scale('wf-rpe', 3, 5)) + field('Notas', '<textarea id="wf-notes" placeholder="Opcional"></textarea>') + '<button class="btn block" data-act="wSave">Guardar entreno</button>');
  };
  A.wSave = async () => {
    const g = G(); const c = g.current; const prs = [];
    const log = { id: c.id, date: c.date, routineId: c.routineId, dayId: c.dayId, name: c.name, duration: Number(val('wf-dur')) || 0, rpe: Number(sel('wf-rpe')[0]) || 3, notes: val('wf-notes').trim(), entries: c.entries.map((en) => ({ ex: en.ex, sets: en.sets.filter((s) => s.done).map((s) => ({ w: num(s.w), r: num(s.r), done: true })) })).filter((en) => en.sets.length) };
    log.entries.forEach((en) => { const e = exById(en.ex); const prev = logsOf(en.ex); if (!prev.length) return; const old = Math.max.apply(null, prev.map((l) => { const b = bestOf(e, l.entries.find((x) => x.ex === en.ex)); return b ? setScore(e, b) : 0; })); const b = bestOf(e, en); if (b && setScore(e, b) > old + 0.001) prs.push(e.name + ': ' + fmtSet(e, b)); });
    g.logs.push(log); g.current = null; clearInterval(restT); await saveGym(); APP.closeSheet();
    APP.go('#/gym'); if (prs.length) setTimeout(() => APP.openSheet('🏆 Nuevas marcas personales', '<ul class="keys">' + prs.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul><button class="btn block" style="margin-top:12px" data-close>Genial</button>'), 250); else APP.toast('Entreno guardado');
  };
  A.logView = (el) => {
    const l = G().logs.find((x) => x.id === el.dataset.id); if (!l) return;
    APP.openSheet(l.name + ' · ' + fmtDate(l.date), '<p class="muted small">' + (l.duration ? l.duration + ' min · ' : '') + 'Esfuerzo ' + (l.rpe || '—') + '/5 · Volumen ' + Math.round(volume(l)) + ' kg</p>' + l.entries.map((en) => { const e = exById(en.ex); return '<div class="card" style="box-shadow:none"><b>' + esc(e.name) + '</b><div class="pill-n">' + en.sets.map((s) => fmtSet(e, s)).join(' · ') + '</div></div>'; }).join('') + (l.notes ? '<p>' + esc(l.notes) + '</p>' : '') + '<button class="btn danger block" data-act="logDel" data-id="' + l.id + '">Borrar entreno</button>');
  };
  A.logDel = async (el) => { if (!APP.confirm('¿Borrar este entreno?')) return; G().logs = G().logs.filter((l) => l.id !== el.dataset.id); await saveGym(); APP.closeSheet(); rk(); };

  // ---------- progreso ----------
  A.exProgress = (el) => {
    const e = exById(el.dataset.ex); const ls = logsOf(e.id); const unit = e.kind === 't' ? ' s' : e.kind === 'r' ? ' rep' : ' kg';
    const pts = ls.map((l) => { const b = bestOf(e, l.entries.find((x) => x.ex === e.id)); return { x: l.date, y: e.kind === 'w' ? Math.round(e1rm(num(b.w), num(b.r)) * 10) / 10 : num(b.r), set: b, log: l }; });
    const best = pts.reduce((a, p) => (!a || p.y > a.y ? p : a), null); const first = pts[0], last = pts[pts.length - 1];
    APP.openSheet(e.name, '<p class="muted small">' + GROUPS[e.group] + ' · ' + e.equip.map((q) => EQUIP[q]).join(', ') + '</p>' +
      (pts.length ? '<div class="grid2"><div class="card kpi" style="box-shadow:none"><div class="big" style="font-size:24px">' + fmtSet(e, best.set) + '</div><div class="label">mejor marca · ' + fmtDate(best.x) + '</div></div><div class="card kpi" style="box-shadow:none"><div class="big" style="font-size:24px">' + ls.length + '</div><div class="label">sesiones registradas</div></div></div>' +
        '<h3 style="margin:6px 0">' + (e.kind === 'w' ? 'Fuerza estimada (1RM)' : e.kind === 'r' ? 'Mejor serie (repeticiones)' : 'Mejor serie (segundos)') + '</h3>' + APP.line([{ points: pts.map((p) => ({ x: p.x, y: p.y })) }], { unit }) +
        (e.kind === 'w' ? '<div class="explain">El 1RM estimado se calcula con la fórmula de Epley (peso × (1 + repeticiones ÷ 30)) a partir de tu mejor serie de cada día. Es una estimación para comparar sesiones, no una marca real.</div>' : '') +
        (pts.length >= 2 ? '<p class="small">Desde la primera sesión: <b>' + (last.y - first.y >= 0 ? '+' : '') + (Math.round((last.y - first.y) * 10) / 10) + unit + '</b> <span class="pill-n">(' + pts.length + ' sesiones)</span></p>' : '<div class="explain">⚠ Solo hay una sesión: todavía no se puede hablar de progreso.</div>') +
        '<h3 style="margin:12px 0 6px">Historial</h3><div class="list">' + ls.slice().reverse().slice(0, 12).map((l) => '<div class="item"><div>' + fmtDate(l.date) + '</div><div class="pill-n" style="text-align:right">' + doneSets(l.entries.find((x) => x.ex === e.id)).map((s) => fmtSet(e, s)).join(' · ') + '</div></div>').join('') + '</div>'
        : '<div class="empty">Aún no has registrado este ejercicio.</div>'));
  };
  function progressPage() {
    const g = G(); if (!g.logs.length) return '<div class="card empty"><h3>Aún no hay progreso</h3><p>Registra tus entrenos y aquí verás la evolución de cada ejercicio.</p></div>' + weightCard(false);
    const byWeek = {}; g.logs.forEach((l) => { const k = ST.weekStart(l.date); byWeek[k] = byWeek[k] || { n: 0, vol: 0 }; byWeek[k].n++; byWeek[k].vol += volume(l); });
    const weeks = Object.keys(byWeek).sort(); const exIds = Array.from(new Set(g.logs.reduce((a, l) => a.concat(l.entries.map((en) => en.ex)), [])));
    const rows = exIds.map((id) => { const e = exById(id); const ls = logsOf(id); if (!ls.length) return null; const sc = ls.map((l) => { const b = bestOf(e, l.entries.find((x) => x.ex === id)); return e.kind === 'w' ? e1rm(num(b.w), num(b.r)) : num(b.r); }); const b = bestOf(e, ls[ls.length - 1].entries.find((x) => x.ex === id)); return { e, n: ls.length, diff: sc.length > 1 ? sc[sc.length - 1] - sc[0] : null, last: b }; }).filter(Boolean).sort((a, b) => b.n - a.n);
    return '<div class="card"><h3>Volumen semanal (kg levantados)</h3>' + APP.line([{ points: weeks.map((w) => ({ x: w, y: Math.round(byWeek[w].vol) })), color: 'var(--blue)' }], { unit: ' kg', empty: 'Hacen falta al menos 2 semanas con entrenos.' }) + '<p class="small muted">Suma de peso × repeticiones de todas las series con carga. ' + g.logs.length + ' entrenos en ' + weeks.length + ' semanas.</p></div>' +
      '<div class="card"><h3>Mis ejercicios</h3><div class="explain">Toca un ejercicio para ver su gráfica. El cambio compara tu primera y tu última sesión.</div><div class="list">' + rows.map((r) => '<a href="#" class="item" data-act="exProgress" data-ex="' + r.e.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(r.e.name) + '</div><div class="pill-n">Última: ' + fmtSet(r.e, r.last) + ' · ' + r.n + (r.n === 1 ? ' sesión' : ' sesiones') + '</div></div>' + (r.diff === null ? '<span class="pill-n">n = 1</span>' : '<b style="color:' + (r.diff > 0.05 ? 'var(--green)' : r.diff < -0.05 ? 'var(--red)' : 'var(--muted)') + '">' + (r.diff > 0 ? '+' : '') + (Math.round(r.diff * 10) / 10) + (r.e.kind === 'w' ? ' kg' : r.e.kind === 't' ? ' s' : ' rep') + '</b>') + '</a>').join('') + '</div></div>' + weightCard(false);
  }

  // ---------- pantalla principal ----------
  function nextDay() { const g = G(); const r = routine(g.active); if (!r || !r.days.length) return null; const last = g.logs.filter((l) => l.routineId === r.id).sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id)).pop(); const i = last ? (r.days.findIndex((d) => d.id === last.dayId) + 1) % r.days.length : 0; return { r, d: r.days[Math.max(0, i)] }; }
  APP.gym.nextDay = nextDay;
  V.gym = (arg) => {
    const g = G();
    if (arg === 'rutinas') return back() + routinesPage();
    if (arg === 'entreno') return workoutPage();
    if (arg === 'progreso') return back() + progressPage();
    if (arg === 'peso') return back() + weightCard(true);
    if (arg && arg.indexOf('r-') === 0) return routinePage(routine(arg.slice(2)));
    const wl = weekLogs(); const nd = nextDay(); const p = g.profile; const target = p ? p.days : 0;
    let h = '';
    if (g.current) h += '<div class="card today-card"><h3>Entreno en curso: ' + esc(g.current.name) + '</h3><a class="btn block" style="text-decoration:none;text-align:center;margin-top:8px" href="#/gym/entreno">Continuar</a></div>';
    else if (nd) h += '<div class="card hero"><div class="muted">' + esc(nd.r.name) + '</div><h2 style="margin:4px 0 10px">Hoy toca: ' + esc(nd.d.name) + '</h2><p class="muted" style="margin-bottom:12px">' + nd.d.items.slice(0, 4).map((it) => esc(exById(it.ex).name)).join(' · ') + (nd.d.items.length > 4 ? ' y ' + (nd.d.items.length - 4) + ' más' : '') + '</p><div class="row"><button class="btn secondary block" data-act="workoutStart" data-r="' + nd.r.id + '" data-d="' + nd.d.id + '">▶ Empezar entreno</button><button class="btn secondary" data-act="dayChoose">Otro día</button></div></div>';
    else h += '<div class="card hero"><h2>Preparación física</h2><p class="muted">Crea tu rutina respondiendo a una encuesta rápida, o móntala tú mismo: en casa, calistenia o gimnasio.</p><div class="row"><button class="btn secondary block" data-act="gymSurvey">✨ Crear con encuesta</button><button class="btn secondary block" data-act="routineNew">Rutina propia</button></div></div>';
    h += '<div class="card"><h3>Esta semana</h3><div class="kpis">' + APP.ring(target ? ST.pct(Math.min(wl.length, target), target) : (wl.length ? 100 : 0), wl.length + (target ? '/' + target : ''), 'entrenos') + '<div class="kpi"><div class="big">' + wl.reduce((a, l) => a + (l.duration || 0), 0) + '</div><div class="label">minutos</div></div><div class="kpi"><div class="big">' + Math.round(wl.reduce((a, l) => a + volume(l), 0)).toLocaleString('es-ES') + '</div><div class="label">kg levantados</div></div></div></div>';
    h += '<div class="tiles t4"><a class="tile" href="#/gym/rutinas"><span class="ico">📋</span><b>Rutinas</b></a><a class="tile" href="#/gym/progreso"><span class="ico">📈</span><b>Progreso</b></a><a class="tile" href="#" data-act="exPick" data-mode="browse"><span class="ico">💪</span><b>Ejercicios</b></a><a class="tile" href="#" data-act="workoutStart"><span class="ico">⚡</span><b>Libre</b></a></div>';
    h += weightCard(false);
    const recent = g.logs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    h += '<div class="card"><h3>Últimos entrenos</h3>' + (recent.length ? '<div class="list">' + recent.map((l) => '<a href="#" class="item" data-act="logView" data-id="' + l.id + '" style="text-decoration:none;color:inherit"><div><div class="title">' + esc(l.name) + '</div><div class="pill-n">' + fmtDate(l.date) + (l.duration ? ' · ' + l.duration + ' min' : '') + ' · ' + l.entries.length + ' ejercicios</div></div><span class="pill-n">' + Math.round(volume(l)).toLocaleString('es-ES') + ' kg</span></a>').join('') + '</div>' : '<p class="muted">Aún no has registrado ningún entreno.</p>') + '</div>';
    return h;
  };
  const back = () => '<div style="margin-bottom:10px"><a class="btn small ghost" style="text-decoration:none" href="#/gym">← Preparación física</a></div>';
  A.dayChoose = () => { const r = routine(G().active); APP.openSheet('¿Qué día haces hoy?', '<div class="stack">' + r.days.map((d) => '<button class="btn secondary block" data-act="workoutStart" data-r="' + r.id + '" data-d="' + d.id + '">' + esc(d.name) + '</button>').join('') + '<button class="btn ghost block" data-act="workoutStart">Entreno libre</button></div>'); };
  A.gymFab = () => { const g = G(); const nd = nextDay(); APP.openSheet('Preparación física', '<div class="stack">' + (g.current ? '<a class="btn block" style="text-decoration:none;text-align:center" href="#/gym/entreno" data-close>Continuar entreno</a>' : (nd ? '<button class="btn block" data-act="workoutStart" data-r="' + nd.r.id + '" data-d="' + nd.d.id + '">▶ Empezar: ' + esc(nd.d.name) + '</button>' : '') + '<button class="btn secondary block" data-act="workoutStart">Entreno libre</button>') + '<button class="btn secondary block" data-act="weightForm">Registrar peso corporal</button></div>'); };
})();
