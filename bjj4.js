/* v19 · Intensidad diaria recomendada (BJJ + gym) con base científica · Academia de vídeos (niveles, plan en calendario, reproductor propio) */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const $ = APP.$, $$ = APP.$$;
  const U = APP.ui2, YT = APP.yt;
  const { card, ct, pill, empty, mring, rk } = U;
  const norm = ST.norm;
  const dd = (a, b) => Math.round((ST.parse(b) - ST.parse(a)) / 86400000);
  const nf = (x, d) => String(Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).replace('.', ',');
  const sav = (k, v) => APP.saveMeta(k, v);
  const chipsH = (n, o, sl, m) => APP.chips(n, o, sl, m, true);
  const selV = (g) => APP.sel(g, $('#view'));
  Object.assign(APP.titles, { ciencia: 'Base científica', videos: 'Vídeos', video: 'Vídeo' });
  ['ciencia', 'videos', 'video'].forEach((k) => { APP.TABMAP[k] = 'bjj'; });

  // =====================================================================
  // 1 · INTENSIDAD DIARIA RECOMENDADA
  // Cada regla indica su fuente y el tipo de evidencia. Nada de números inventados:
  // lo que es regla práctica se dice como regla práctica.
  // =====================================================================
  const GRADE = {
    directa: ['Evidencia directa', 'Estudio que mide justo esto en deportistas'],
    indirecta: ['Evidencia indirecta', 'Viene de otro deporte o de otro tipo de entrenamiento y aquí se extrapola'],
    practica: ['Regla práctica', 'Convención habitual de entrenadores; no hay estudio directo que la fije'],
    discutida: ['Evidencia discutida', 'Hay estudios a favor y críticas serias en contra'],
    seguridad: ['Criterio de seguridad', 'Sentido común clínico: ante dolor o lesión, prudencia y consulta profesional'],
  };
  const REFS = {
    foster2001: ['Foster C, et al. (2001). A new approach to monitoring exercise training. J Strength Cond Res.', 'Método session-RPE: carga = duración × esfuerzo percibido. Resultó válido en ciclismo y baloncesto, comparado con la frecuencia cardiaca.'],
    foster1998: ['Foster C (1998). Monitoring training in athletes with reference to overtraining syndrome. Med Sci Sports Exerc 30(7):1164-8.', 'Muchas enfermedades aparecieron cuando el deportista superaba su umbral personal de «tensión» (carga × monotonía). Observacional.'],
    saw2016: ['Saw AE, Main LC, Gastin PB (2016). Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures. Br J Sports Med 50(5):281-91.', 'Revisión sistemática: las medidas subjetivas (ánimo, fatiga, energía) reflejan la carga aguda y crónica con más sensibilidad y consistencia que las objetivas.'],
    seiler2010: ['Seiler S (2010). What is best practice for training intensity and duration distribution in endurance athletes? Int J Sports Physiol Perform 5(3):276-91.', 'En deportistas de resistencia de élite, ~80% de las sesiones son de baja intensidad y ~20% de alta. Es de resistencia, no de BJJ: se extrapola.'],
    gabbett2016: ['Gabbett TJ (2016). The training-injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med 50(5):273-80.', 'Propone vigilar la ratio carga aguda:crónica y sostiene que las cargas crónicas altas protegen frente a lesiones.'],
    blanch2016: ['Blanch P, Gabbett TJ (2016). Has the athlete trained enough to return to play safely? Br J Sports Med 50(8):471-5.', 'En cricket, rugby league y fútbol australiano, subir la carga semanal por encima de la media de las 4 semanas previas se asoció a más lesiones.'],
    impellizzeri2020: ['Impellizzeri FM, Tenan MS, Kempton T, Novak A, Coutts AJ (2020). Acute:chronic workload ratio: conceptual issues and fundamental pitfalls. Int J Sports Physiol Perform 15(6):907-13.', 'Crítica: no hay evidencia que respalde usar la ratio para gestionar la carga y reducir lesiones; tiene problemas estadísticos y la causalidad no está establecida.'],
    zourdos2016: ['Zourdos MC, et al. (2016). Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve. J Strength Cond Res 30(1):267-75.', 'Escala RPE basada en repeticiones en reserva (RPE 10 = 0 RIR, RPE 9 = 1 RIR…). Se relaciona de forma inversa con la velocidad de la barra.'],
    helms2016: ['Helms ER, Cronin J, Storey A, Zourdos MC (2016). Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. Strength Cond J 38(4):42-9.', 'Cómo usar la escala RIR para ajustar la carga serie a serie según cómo estés ese día (autorregulación).'],
    schoenfeld2021: ['Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL (2021). Loading recommendations for muscle strength, hypertrophy, and local endurance: a re-examination of the repetition continuum. Sports 9(2):32.', 'Se puede ganar músculo con un rango amplio de cargas (aprox. desde el 30% del 1RM) si el esfuerzo es alto.'],
    schoenfeld2016: ['Schoenfeld BJ, et al. (2016). Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. Sports Med 46(11):1689-97.', 'Con el volumen igualado, entrenar cada grupo muscular 2 veces por semana dio más hipertrofia que 1.'],
    robineau2016: ['Robineau J, et al. (2016). Specific training effects of concurrent aerobic and strength exercises depend on recovery duration. J Strength Cond Res 30(3):672-83.', 'Con 0 h entre cardio y fuerza, la ganancia de fuerza fue menor que con 6 h, 24 h o solo fuerza. Recomiendan no juntar cualidades contrarias con menos de 6 h.'],
  };
  const BANDS = [
    { n: 0, name: 'Descanso', ico: '😴', rng: '–', col: 'var(--blue)', how: 'Hoy descansar es la mejor sesión. Si quieres moverte: caminar o movilidad suave.' },
    { n: 1, name: 'Recuperación', ico: '🧘', rng: '1-2', col: 'var(--green)', how: 'Drilling suave, flow roll sin competir, técnica y movilidad. Podrías mantener una conversación.' },
    { n: 2, name: 'Moderada', ico: '🥋', rng: '3', col: 'var(--gold)', how: 'Clase técnica y sparring controlado o posicional. Sin ir a por todas ni entrar en rounds de «vida o muerte».' },
    { n: 3, name: 'Fuerte', ico: '🔥', rng: '4', col: 'var(--orange)', how: 'Sparring vivo permitido. Es el techo recomendado: el 5/5 (máximo) reserva para competición o tras un descanso claro.' },
  ];
  const G = () => (S.gym && S.gym.logs ? S.gym : { logs: [] });
  let advMemo = null;
  function ctxNow() {
    const t = today(); const ss = S.sessions.slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
    const eff = (s) => (s.feel && s.feel.effort) || 0; const hard = (s) => eff(s) >= 4 && (Number(s.duration) || 0) >= 45;
    const day = (d) => ss.filter((s) => s.date === d); const glog = (d) => G().logs.filter((l) => l.date === d);
    const trainedDay = (d) => day(d).length > 0 || glog(d).length > 0;
    let consec = 0; for (let i = 1; i <= 14 && trainedDay(ST.addDays(t, -i)); i++) consec++;
    const last7 = ss.filter((s) => s.date >= ST.addDays(t, -6) && s.date <= t);
    const wl = (k) => { const v = ss.filter((s) => s.feel && s.feel[k] > 0).map((s) => s.feel[k]); if (v.length < 8) return 0; const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length; return mean(v.slice(3, 13)) - mean(v.slice(0, 3)); };
    const drop = Math.max(wl('energy'), wl('mood'), wl('cardio'));
    const occ = APP.plan ? APP.plan.occurrences(t) : []; const nd = APP.gym && APP.gym.nextDay ? APP.gym.nextDay() : null;
    return { t, ss, hardToday: day(t).some(hard), hardYday: day(ST.addDays(t, -1)).some(hard), bjjToday: day(t).length > 0, gymToday: glog(t).length > 0, consec, hard7: last7.filter(hard).length, n7: last7.length, drop, ls: APP.loadStatus(), inj: APP.activeInj(), planned: occ.filter((o) => !o.done).length, gymDay: nd && nd.today ? nd.d.name : '', gymNext: nd && !nd.today ? nd.label + nd.d.name : '', gymLogs7: G().logs.filter((l) => l.date >= ST.addDays(t, -6)).length };
  }
  function advice() {
    if (advMemo && Date.now() - advMemo.t < 800 && advMemo.k === S.sessions.length + '|' + S.injuries.length + '|' + G().logs.length) return advMemo.v;
    const c = ctxNow(); const R = []; let cap = 3, pen = 0; const add = (kind, txt, refs, grade) => R.push({ kind, txt, refs: refs || [], grade });
    const lim = (n, t, refs, g) => { if (n < cap) cap = n; add('cap', t, refs, g); };
    const lv = Math.max.apply(null, [0].concat(c.inj.map((i) => i.level)));
    if (lv >= 3) lim(0, 'Tienes anotada una lesión de «no puedo entrenar» (' + c.inj.filter((i) => i.level >= 3).map((i) => i.zone).join(', ') + '). Descansa esa zona y consulta con un fisio o médico.', [], 'seguridad');
    else if (lv === 2) lim(1, 'Tienes un dolor activo (' + c.inj.filter((i) => i.level === 2).map((i) => i.zone).join(', ') + '). Solo trabajo suave y sin cargar esa zona.', [], 'seguridad');
    else if (lv === 1) lim(2, 'Tienes una molestia activa (' + c.inj.map((i) => i.zone).join(', ') + '). Modera la intensidad y avisa a tu compañero.', [], 'seguridad');
    if (c.bjjToday) lim(0, 'Hoy ya has entrenado BJJ: lo que más suma ahora es recuperar.', ['foster1998'], 'practica');
    if (c.hardYday) lim(2, 'Ayer entrenaste duro (intensidad 4-5 y 45 min o más). Alterna días duros y fáciles.', ['seiler2010', 'foster1998'], 'indirecta');
    if (c.hard7 >= 3 || (c.hard7 >= 2 && c.n7 <= 3)) lim(2, 'Llevas ' + c.hard7 + ' sesiones duras en los últimos 7 días. En resistencia de élite la proporción típica es ~80% baja / ~20% alta intensidad.', ['seiler2010'], 'indirecta');
    const r = c.ls.r; if (r !== null) { if (r > 1.5) lim(1, 'Tu carga de los últimos 7 días es ' + nf(r, 1) + '× tu media de las 4 semanas anteriores: una subida muy brusca.', ['blanch2016', 'gabbett2016', 'impellizzeri2020'], 'discutida'); else if (r > 1.3) lim(2, 'Tu carga reciente es ' + nf(r, 1) + '× tu media habitual: sube más despacio.', ['blanch2016', 'gabbett2016', 'impellizzeri2020'], 'discutida'); else if (r < 0.8) add('info', 'Vienes con menos carga de la habitual (' + nf(r, 1) + '×): puedes subir, pero poco a poco.', ['gabbett2016'], 'discutida'); }
    if (c.consec >= 6) lim(1, 'Llevas ' + c.consec + ' días seguidos entrenando. Mejor un día muy suave o libre.', ['foster1998'], 'practica'); else if (c.consec >= 4) lim(2, 'Llevas ' + c.consec + ' días seguidos entrenando: baja un escalón de intensidad.', ['foster1998'], 'practica');
    if (c.drop >= 1) { pen = 1; add('cap', 'Tu energía, ánimo o cardio de los últimos 3 entrenos están ' + nf(c.drop, 1) + ' puntos por debajo de tu media habitual: baja un escalón.', ['saw2016'], 'directa'); }
    if (c.ss.length < 5) add('info', 'Tienes menos de 5 entrenos registrados: la recomendación usa reglas generales y se afinará con tus datos.', [], 'practica');
    const band = Math.max(0, Math.min(cap, 3) - (cap > 0 ? pen : 0));
    if (!R.some((x) => x.kind === 'cap')) add('ok', 'Sin señales de fatiga acumulada ni de subida brusca de carga: puedes entrenar fuerte.', ['foster2001'], 'practica');
    // GYM: RIR (repeticiones en reserva). RPE = 10 − RIR.
    const Rg = []; const ag = (kind, txt, refs, grade) => Rg.push({ kind, txt, refs: refs || [], grade }); let sh = 0, vol = 0;
    ag('ok', 'Series de trabajo con 1-3 repeticiones en reserva (RPE 7-9): suficiente esfuerzo sin llegar al fallo. Se pueden usar cargas muy distintas si el esfuerzo es alto.', ['zourdos2016', 'helms2016', 'schoenfeld2021'], 'indirecta');
    if (c.hardToday || c.planned > 0 || c.hardYday) { sh = 1; vol = Math.max(vol, c.hardToday || c.planned > 0 ? 1 : 0); ag('cap', c.hardYday ? 'Ayer fue una sesión dura de BJJ: deja 1 repetición más en reserva.' : 'Hoy hay BJJ: gym más ligero y, si puedes, con 6 h o más de separación.', ['robineau2016'], 'indirecta'); }
    if (c.drop >= 1) { sh = Math.min(2, sh + 1); ag('cap', 'Tus sensaciones están por debajo de lo habitual: ajusta el peso para dejar más reserva (la escala RIR sirve justo para eso).', ['saw2016', 'helms2016'], 'directa'); }
    if (r !== null && r > 1.5) { sh = Math.min(2, sh + 1); vol = 2; ag('cap', 'Carga reciente muy por encima de tu media: menos series y más reserva.', ['impellizzeri2020', 'blanch2016'], 'discutida'); }
    if (c.inj.length) ag('cap', 'Evita cargar la zona de la lesión (' + c.inj.map((i) => i.zone).join(', ') + ') y sustituye por ejercicios que no duelan.', [], 'seguridad');
    if (c.gymLogs7 >= 1) ag('info', 'Para ganar músculo conviene trabajar cada grupo muscular al menos 2 veces por semana (con el volumen igualado).', ['schoenfeld2016'], 'directa');
    const gym = { lo: 1 + sh, hi: Math.min(4, 3 + sh), vol: ['series normales', 'menos series (aprox. un tercio menos)', 'pocas series, solo lo esencial'][vol], r: Rg, today: c.gymDay, next: c.gymNext, done: c.gymToday };
    const out = { band, b: BANDS[band], r: R, gym, c }; advMemo = { t: Date.now(), k: S.sessions.length + '|' + S.injuries.length + '|' + G().logs.length, v: out }; return out;
  }
  APP.advice = advice;
  APP.recLine = () => { const a = advice(); return '<div class="recl"><span>' + a.b.ico + '</span><span>Recomendado hoy: <b style="color:' + a.b.col + '">' + a.b.rng + '/5 · ' + a.b.name + '</b></span></div>'; };
  const refsOf = (rs) => rs.length ? '<span class="refs">' + rs.map((k) => { const m = REFS[k][0].match(/^([^,(]+).*?\((\d{4})\)/); return esc(m ? m[1].trim() + ' ' + m[2] : k); }).join(' · ') + '</span>' : '';
  const reasonList = (rs) => rs.map((x) => '<div class="rsn ' + x.kind + '"><span>' + esc(x.txt) + '</span><span class="gr">' + esc(GRADE[x.grade][0]) + (x.refs.length ? ' · ' : '') + refsOf(x.refs) + '</span></div>').join('');
  APP.intensityCard = function () {
    const a = advice(); const g = a.gym;
    let h = '<div class="card inten"><div class="ct">⚡ INTENSIDAD RECOMENDADA HOY</div><div class="ipair">';
    h += '<div class="ibox" style="--ic:' + a.b.col + '"><span class="il">🥋 BJJ</span><b class="iv">' + a.b.rng + (a.band ? '<small>/5</small>' : '') + '</b><span class="in">' + a.b.ico + ' ' + a.b.name + '</span></div>';
    h += '<div class="ibox" style="--ic:var(--violet,#a78bfa)"><span class="il">🏋 GYM</span><b class="iv">RIR ' + g.lo + '-' + g.hi + '</b><span class="in">' + esc(g.vol) + '</span></div></div>';
    h += '<p class="small" style="margin:10px 0 4px">' + esc(a.b.how) + '</p>';
    h += '<p class="small muted" style="margin:0">' + (g.done ? 'Hoy ya has hecho gym.' : g.today ? 'Hoy toca gym: <b>' + esc(g.today) + '</b>.' : g.next ? 'Gym: ' + esc(g.next) + '.' : '') + '</p>';
    h += '<button class="btn small secondary" style="margin-top:10px" data-act="intWhy">Por qué · ver razones y fuentes</button></div>';
    return h;
  };
  A.intWhy = () => { const a = advice(); APP.openSheet('Por qué esta recomendación', '<h3 style="margin:0 0 6px">🥋 BJJ · ' + a.b.name + '</h3>' + reasonList(a.r) + '<h3 style="margin:16px 0 6px">🏋 Gym · RIR ' + a.gym.lo + '-' + a.gym.hi + '</h3>' + reasonList(a.gym.r) + '<p class="small muted" style="margin:14px 0 0">RIR = repeticiones que te quedan antes del fallo. Es una guía de carga, no un diagnóstico ni sustituye a un entrenador, fisio o médico.</p><a class="btn block secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="#/ciencia" data-act="closeSheet">Ver toda la base científica</a>'); };
  A.closeSheet = () => APP.closeSheet();

  V.ciencia = () => {
    let h = '<div class="ttl"><h2>Base científica<small>De dónde sale cada recomendación</small></h2></div>';
    h += card(ct('Cómo se decide la intensidad') + '<p style="margin:0 0 8px">Cada día la app mira <b>lo que tú has registrado</b>: duración e intensidad de tus entrenos, días seguidos, sesiones duras de la semana, energía/ánimo/cardio, lesiones activas y lo que tienes planificado. Con eso aplica reglas, y a cada regla le pone su <b>fuente</b> y el <b>tipo de evidencia</b>.</p><p class="small muted" style="margin:0">Intensidad en tu escala 1-5: 1-2 recuperación · 3 moderada · 4 fuerte · 5 máxima (solo competición o tras descanso). Equivale a 2-4-6-8-10 en la escala CR-10 de Foster. En gym usamos RIR: repeticiones que te quedan antes del fallo (RPE = 10 − RIR).</p>');
    h += card(ct('Tipos de evidencia') + Object.keys(GRADE).map((k) => '<div class="rsn"><span><b>' + GRADE[k][0] + '</b></span><span class="gr">' + GRADE[k][1] + '</span></div>').join(''));
    h += card(ct('Referencias') + Object.keys(REFS).map((k) => '<div class="rsn"><span>' + esc(REFS[k][0]) + '</span><span class="gr">' + esc(REFS[k][1]) + '</span></div>').join(''));
    h += '<div class="card" style="border-color:var(--orange)"><div class="ct" style="color:var(--orange)">LÍMITES (SÉ HONESTO CONTIGO)</div><ul class="keys" style="margin:0"><li><b>No hay guías de carga específicas de BJJ</b> con evidencia sólida. Casi todo viene de otros deportes (resistencia, equipo, fuerza) y se extrapola.</li><li>La <b>ratio de carga aguda:crónica</b> es popular, pero está criticada: Impellizzeri 2020 dice que no hay evidencia para usarla en la gestión de la carga. Aquí es solo un aviso.</li><li>No tengo tu <b>sueño, pulso ni variabilidad cardiaca</b>; sin ellos la app solo ve lo que tú anotas. Si no marcas la intensidad al registrar, se supone 3/5.</li><li>Los límites como «4 días seguidos» o «3 sesiones duras en 7 días» son <b>reglas prácticas</b>, no cifras de un estudio.</li><li>Ante dolor, mareo, sueño muy malo o lesión, manda tu criterio y el de un profesional sanitario.</li></ul></div>';
    return h;
  };

  // La recomendación también aparece en Inicio, panel BJJ (ya inyectada por bjj3) y briefing
  const oldInicio = V.inicio;
  V.inicio = () => {
    const h = oldInicio(); const k = h.indexOf('Hoy en tu BJJ'); const i = k > 0 ? h.lastIndexOf('<div class="card"', k) : -1;
    const stu = vidToday(); const blk = APP.intensityCard() + (stu ? card('<div class="cnt"><span>🎬 Hoy toca ver: <b>' + esc(stu.title) + '</b></span><a class="btn small secondary" style="text-decoration:none" href="#/video/' + stu.id + '">Ver</a></div>') : '');
    return i >= 0 ? h.slice(0, i) + blk + h.slice(i) : blk + h;
  };
  const oldBrief = V.briefing;
  V.briefing = () => { const h = oldBrief(); const k = h.indexOf('</h2></div>') + 11; return k > 11 ? h.slice(0, k) + APP.intensityCard() + h.slice(k) : h; };

  // =====================================================================
  // 2 · ACADEMIA DE VÍDEOS
  // =====================================================================
  const CATS = [
    { id: 'pasar', ico: '🛡', name: 'Pasar guardia', sec: 'Pases', subs: ['Guardia cerrada (abrir y pasar)', 'Media guardia', 'Guardia abierta · torreando', 'Knee slice', 'Leg drag', 'Over-under y presión', 'Stack'] },
    { id: 'guardia', ico: '🕸', name: 'Guardia', sec: 'Retención', subs: ['Guardia cerrada', 'Media guardia', 'De la Riva', 'Spider y lasso', 'X-guard y single-X', 'Mariposa', 'Retención y recomposición'] },
    { id: 'raspados', ico: '🌀', name: 'Raspados', sec: 'Raspados', subs: ['Desde guardia cerrada', 'Desde media guardia', 'Desde guardia abierta', 'Desde mariposa', 'Barridos de pie'] },
    { id: 'llaves', ico: '🎯', name: 'Llaves', sec: 'Finalizaciones', subs: ['Estrangulaciones', 'Armlocks', 'Kimura y americana', 'Triángulos', 'Ataques de piernas', 'Cadenas de ataque'] },
    { id: 'escapes', ico: '🚪', name: 'Escapes y defensa', sec: 'Salidas y escapes', subs: ['Escape de montada', 'Escape de espalda', 'Escape de costado', 'Escape de rodilla en el vientre', 'Defensa de llaves'] },
    { id: 'control', ico: '⛰', name: 'Control y transiciones', sec: 'Transiciones', subs: ['Control lateral', 'Montada', 'Espalda', 'Rodilla en el vientre', 'Transiciones'] },
    { id: 'derribos', ico: '🤼', name: 'Derribos y de pie', sec: 'Entradas', subs: ['Agarres y manejo', 'Judo', 'Lucha', 'Tirar de guardia'] },
    { id: 'mente', ico: '🧠', name: 'Mentalidad', sec: 'Conceptos', subs: ['Constancia y disciplina', 'Aprender y mejorar', 'Ego y rolas', 'Nervios y confianza'] },
    { id: 'combates', ico: '🏆', name: 'Combates y competición', sec: 'Conceptos', subs: ['Estrategia y game plan', 'Reglas y puntuación', 'Preparar un torneo', 'Análisis de combates'] },
    { id: 'fisico', ico: '💪', name: 'Físico y prevención', sec: 'Conceptos', subs: ['Calentamiento y movilidad', 'Fuerza para BJJ', 'Prevención de lesiones'] },
  ];
  const catOf = (id) => CATS.find((c) => c.id === id) || CATS[0];
  const vid = () => { if (!S.vid) S.vid = { items: [], plan: [], auto: true }; S.vid.items = S.vid.items || []; S.vid.plan = S.vid.plan || []; return S.vid; };
  const items = () => vid().items;
  const saveVid = () => sav('vid', vid());
  const vget = (id) => items().find((x) => x.id === id);
  const xpOf = (x) => (x.done ? 100 + Math.min(5, (x.notes || []).length) * 20 : 0);
  const xpTotal = () => items().reduce((a, x) => a + xpOf(x), 0);
  const lvlOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1; const xpFor = (l) => 50 * (l - 1) * (l - 1);
  const RANKS = [[0, 'Cinturón blanco'], [400, 'Cinturón azul'], [1200, 'Cinturón violeta'], [2800, 'Cinturón marrón'], [5500, 'Cinturón negro']];
  const rankOf = (xp) => { let r = 0; RANKS.forEach((x, i) => { if (xp >= x[0]) r = i; }); return { i: r, name: RANKS[r][1], next: RANKS[r + 1] || null, from: RANKS[r][0] }; };
  // orden recomendado: por categoría, sección y posición manual
  const ordered = (cat) => items().filter((x) => !cat || x.cat === cat).slice().sort((a, b) => (CATS.findIndex((c) => c.id === a.cat) - CATS.findIndex((c) => c.id === b.cat)) || (catOf(a.cat).subs.indexOf(a.sub) - catOf(b.cat).subs.indexOf(b.sub)) || ((a.order || 0) - (b.order || 0)));
  const nextOf = (cat) => ordered(cat).find((x) => !x.done);
  const vidToday = () => { const t = today(); const p = vid().plan.find((e) => e.date === t && vget(e.vid) && !vget(e.vid).done); return p ? vget(p.vid) : null; };
  const kindOf = (url) => {
    url = String(url || '').trim(); const y = YT.ytId(url); if (y) return { kind: 'yt', yt: y, start: YT.ytStart(url) };
    const v = url.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (v) return { kind: 'vimeo', vimeo: v[1] };
    if (/\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i.test(url)) return { kind: 'file' };
    if (/^https?:\/\//i.test(url)) return { kind: 'link' };
    return null;
  };
  const kindName = { yt: 'YouTube', vimeo: 'Vimeo', file: 'Archivo de vídeo', local: 'Guardado en tu móvil', link: 'Enlace web' };

  // ---------- almacenamiento de vídeos locales (Cache Storage, sin tocar la base de datos) ----------
  const LOCAL = 'bjj-videos';
  const localPut = async (id, file) => { const c = await caches.open(LOCAL); await c.put('/__video/' + id, new Response(file, { headers: { 'Content-Type': file.type || 'video/mp4', 'Content-Length': String(file.size) } })); try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* sigue */ } };
  const localGet = async (id) => { try { const c = await caches.open(LOCAL); const r = await c.match('/__video/' + id); return r ? URL.createObjectURL(await r.blob()) : ''; } catch (e) { return ''; } };
  const localDel = async (id) => { try { const c = await caches.open(LOCAL); await c.delete('/__video/' + id); } catch (e) { /* sigue */ } };

  // ---------- pantalla principal ----------
  ui.vd = ui.vd || { tab: 'camino', m: today().slice(0, 7) };
  const monthName = (m) => { const d = ST.parse(m + '-01'); const s = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const hero = () => {
    const xp = xpTotal(); const l = lvlOf(xp); const rk2 = rankOf(xp); const lo = xpFor(l), hi = xpFor(l + 1); const p = (xp - lo) / (hi - lo); const done = items().filter((x) => x.done).length;
    const days = new Set(items().filter((x) => x.done).map((x) => x.done)); let streak = 0, d = today(); if (!days.has(d)) d = ST.addDays(d, -1); while (days.has(d)) { streak++; d = ST.addDays(d, -1); }
    return '<div class="card vhero"><div class="row" style="gap:14px;align-items:center">' + mring(p, 'var(--gold)', 'N' + l, 78) + '<div style="flex:1"><div class="small muted">' + rk2.name.toUpperCase() + '</div><b style="font-size:20px">Nivel ' + l + '</b><div class="small muted">' + xp + ' XP' + (' · ' + (hi - xp) + ' para el nivel ' + (l + 1)) + '</div></div></div><div class="row" style="gap:8px;margin-top:12px">' + pill('🎬 ' + done + '/' + items().length + ' vistos') + pill('🔥 racha ' + streak + (streak === 1 ? ' día' : ' días')) + (rk2.next ? pill('🎖 ' + rk2.next[0] + ' XP → ' + rk2.next[1].replace('Cinturón ', '')) : pill('🥇 Rango máximo')) + '</div></div>';
  };
  V.videos = (arg) => {
    if (arg && CATS.some((c) => c.id === arg)) return catPage(arg);
    let h = '<div class="ttl"><h2>Vídeos<small>Tu camino de estudio, como un juego</small></h2></div>' + hero();
    h += '<div class="ptabs"><button class="' + (ui.vd.tab === 'camino' ? 'on' : '') + '" data-act="vdTab" data-v="camino">Camino</button><button class="' + (ui.vd.tab === 'plan' ? 'on' : '') + '" data-act="vdTab" data-v="plan">Plan</button></div>';
    h += ui.vd.tab === 'plan' ? planTab() : caminoTab();
    return h;
  };
  A.vdTab = (el) => { ui.vd.tab = el.dataset.v; rk(); };
  function caminoTab() {
    let h = ''; const nx = nextOf();
    if (nx) h += '<a class="card vnext" href="#/video/' + nx.id + '"><span class="small muted">CONTINÚA TU CAMINO</span><b>' + esc(nx.title) + '</b><span class="small muted">' + catOf(nx.cat).ico + ' ' + catOf(nx.cat).name + ' · ' + esc(nx.sub) + '</span><span class="btn small" style="align-self:flex-start;margin-top:6px">▶ Ver ahora</span></a>';
    h += '<button class="btn block secondary" style="margin-bottom:12px" data-act="vdAdd">+ Añadir vídeo</button>';
    h += '<div class="vcats">' + CATS.map((c) => { const it = items().filter((x) => x.cat === c.id); const dn = it.filter((x) => x.done).length; const nxt = nextOf(c.id); return '<a class="vcat" href="#/videos/' + c.id + '">' + mring(it.length ? dn / it.length : 0, 'var(--green)', it.length ? dn + '/' + it.length : '0', 52) + '<span class="vcn"><b>' + c.ico + ' ' + c.name + '</b><span class="small muted">' + (it.length ? 'Nivel ' + (dn + 1) + (nxt ? ' · sigue: ' + esc(nxt.title) : ' · ¡completada!') : 'Sin vídeos todavía') + '</span></span><span class="muted">›</span></a>'; }).join('') + '</div>';
    if (!items().length) h += '<div class="card empty"><h3>Empieza tu camino</h3><p>La app trae las categorías y secciones ordenadas. Tú añades los vídeos (YouTube, Vimeo, un enlace directo o un archivo de tu móvil) y los ves sin salir de la app. Cada vídeo visto da XP y sube tu nivel.</p></div>';
    return h;
  }
  function catPage(id) {
    const c = catOf(id); const it = ordered(id); const dn = it.filter((x) => x.done).length; const nx = nextOf(id);
    let h = '<a class="backlink" href="#/videos">‹ Vídeos</a><div class="card vhero"><div class="row" style="gap:14px;align-items:center">' + mring(it.length ? dn / it.length : 0, 'var(--green)', it.length ? Math.round((dn / it.length) * 100) + '%' : '–', 70) + '<div style="flex:1"><b style="font-size:20px">' + c.ico + ' ' + c.name + '</b><div class="small muted">Nivel ' + (dn + 1) + ' · ' + dn + ' de ' + it.length + ' vídeos</div></div></div></div>';
    h += '<button class="btn block" style="margin-bottom:12px" data-act="vdAdd" data-cat="' + id + '">+ Añadir vídeo a ' + esc(c.name) + '</button>';
    c.subs.forEach((s) => {
      const list = it.filter((x) => x.sub === s); h += '<div class="vsub"><div class="row between"><b>' + esc(s) + '</b><button class="btn small ghost" data-act="vdAdd" data-cat="' + id + '" data-sub="' + esc(s) + '">+</button></div>';
      h += list.length ? '<div class="vpath">' + list.map((x, i) => { const isN = nx && nx.id === x.id; return '<a class="vnode ' + (x.done ? 'done' : isN ? 'next' : '') + '" href="#/video/' + x.id + '"><span class="vn">' + (x.done ? '✓' : isN ? '▶' : i + 1) + '</span><span class="vt"><b>' + esc(x.title) + '</b><span class="small muted">' + kindName[x.kind] + ((x.notes || []).length ? ' · 📝 ' + x.notes.length : '') + '</span></span><span class="vx">+' + (x.done ? xpOf(x) : 100) + ' XP</span></a>'; }).join('') + '</div>' : '<p class="small muted" style="margin:6px 0 0">Aún sin vídeos. Busca uno sobre «' + esc(s.toLowerCase()) + '» y pégalo con «+».</p>';
      h += '</div>';
    });
    return h;
  }

  // ---------- añadir vídeo ----------
  const subOptions = (cid, sel) => catOf(cid).subs.map((s) => '<option value="' + esc(s) + '"' + (s === sel ? ' selected' : '') + '>' + esc(s) + '</option>').join('');
  A.vdAdd = (el) => {
    const cid = (el && el.dataset && el.dataset.cat) || ui.vd.lastCat || 'pasar'; const sub = (el && el.dataset && el.dataset.sub) || '';
    APP.openSheet('Añadir vídeo',
      field('Enlace (YouTube, Vimeo o vídeo directo .mp4)', '<input id="vd-url" type="url" inputmode="url" placeholder="https://youtu.be/…">') +
      '<div class="small muted" style="text-align:center;margin:-4px 0 8px">— o —</div><label class="btn secondary block" style="display:block;text-align:center;margin-bottom:12px">🎞 Elegir vídeo de mi móvil<input type="file" accept="video/*" id="vd-file" data-input="vdFile" style="display:none"></label><div id="vd-fileinfo" class="small muted" style="margin:-4px 0 10px"></div>' +
      field('Título', '<input id="vd-title" placeholder="Ej.: Knee slice paso a paso">') +
      field('Categoría', '<select id="vd-cat" data-input="vdCat">' + CATS.map((c) => '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + c.ico + ' ' + esc(c.name) + '</option>').join('') + '</select>') +
      field('Sección', '<select id="vd-sub">' + subOptions(cid, sub) + '</select>') +
      '<button class="btn block" data-act="vdSave">Guardar vídeo</button>');
  };
  A.vdCat = (el) => { const s = $('#vd-sub'); if (s) s.innerHTML = subOptions(el.value, ''); };
  ui.vd.file = null;
  A.vdFile = (el) => { const f = el.files && el.files[0]; ui.vd.file = f || null; const i = $('#vd-fileinfo'); if (f && i) { i.textContent = f.name + ' · ' + nf(f.size / 1048576, 0) + ' MB'; if (!val('vd-title')) $('#vd-title').value = f.name.replace(/\.[^.]+$/, ''); } };
  A.vdSave = async () => {
    const url = val('vd-url').trim(); const f = ui.vd.file; const cat = val('vd-cat'), sub = val('vd-sub'); let title = val('vd-title').trim();
    let k = null; if (f) k = { kind: 'local' }; else if (url) { k = kindOf(url); if (!k) return APP.toast('Pega un enlace que empiece por https:// o elige un archivo'); } else return APP.toast('Pega un enlace o elige un vídeo');
    if (f && f.size > 400 * 1048576 && !APP.confirm('Este vídeo pesa ' + nf(f.size / 1048576, 0) + ' MB y ocupará ese espacio en tu móvil. ¿Guardarlo igualmente?')) return;
    const x = Object.assign({ id: uid(), cat, sub, title: title || (f ? f.name.replace(/\.[^.]+$/, '') : 'Vídeo ' + (items().length + 1)), url: f ? '' : url, notes: [], done: '', order: Date.now(), created: today(), noteTopic: '', noteSec: '' }, k);
    try { if (f) { APP.toast('Guardando el vídeo en tu móvil…'); await localPut(x.id, f); } } catch (e) { return APP.toast('No cabe en el almacenamiento del móvil'); }
    vid().items.push(x); ui.vd.lastCat = cat; ui.vd.file = null; await saveVid(); APP.closeSheet(); APP.go('#/video/' + x.id);
    if (k.kind === 'yt' && !title && navigator.onLine) { try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000); const r = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json', { signal: ctl.signal }); if (r.ok) { const j = await r.json(); if (j.title) { x.title = j.title; await saveVid(); if (location.hash === '#/video/' + x.id) rk(); } } } catch (e) { /* sin título automático: se puede editar */ } }
  };

  // ---------- pantalla de un vídeo ----------
  const NCLS = { key: ['🔑', 'Detalle clave'], step: ['👣', 'Paso a paso'], err: ['⚠️', 'Error a evitar'], doubt: ['❓', 'Duda'] };
  let ytVP = null; ui.vd.local = ui.vd.local || {};
  V.video = (id) => {
    const x = vget(id); if (!x) return '<div class="card empty">Vídeo no encontrado.</div>'; const c = catOf(x.cat);
    const tgtTopic = x.noteTopic || x.sub, tgtSec = x.noteSec || c.sec;
    let h = '<a class="backlink" href="#/videos/' + x.cat + '">‹ ' + esc(c.name) + '</a>';
    h += '<div class="row between" style="margin-bottom:8px;align-items:flex-start"><div><h2 style="margin:0">' + esc(x.title) + '</h2><div class="small muted" style="margin-top:4px">' + c.ico + ' ' + esc(x.sub) + ' · ' + kindName[x.kind] + '</div></div><button class="btn small ghost" data-act="vdEdit" data-id="' + id + '">Editar</button></div>';
    h += card(playerHtml(x), 'padding:10px');
    h += '<button class="btn block ' + (x.done ? 'secondary' : '') + '" style="margin-bottom:12px" data-act="vdDone" data-id="' + id + '">' + (x.done ? '✓ Visto el ' + fmtDate(x.done) + ' · quitar' : '✅ Marcar como visto · +100 XP') + '</button>';
    h += card(ct('Mis apuntes mientras lo veo') + '<textarea id="vn-text" rows="3" placeholder="Escribe lo que veas importante…"></textarea><div class="small muted" style="margin:8px 0 4px">Tipo</div>' + chipsH('vncls', Object.keys(NCLS).map((k) => ({ v: k, l: NCLS[k][0] + ' ' + NCLS[k][1] })), 'key', false) +
      '<div class="row" style="margin-top:10px;gap:8px"><input id="vn-ts" placeholder="m:ss" inputmode="numeric" style="width:84px;flex:none"><button class="btn small secondary" style="flex:1" data-act="vnNow">⏱ Minuto actual</button></div><button class="btn block" style="margin-top:10px" data-act="vnAdd" data-id="' + id + '">Añadir apunte</button>' +
      '<div class="row between" style="margin-top:10px;gap:8px"><span class="small muted">Se guardan en Apuntes › <b>' + esc(APP.tn(tgtTopic)) + '</b> › ' + esc(tgtSec) + '</span><button class="btn small ghost" data-act="vdWhere" data-id="' + id + '">Cambiar</button></div>');
    h += '<div id="vn-list">' + vnList(x) + '</div>';
    h += '<div class="stack"><button class="btn secondary block" data-act="vdPlanAdd" data-id="' + id + '">📅 Añadir al plan</button><button class="btn ghost block" data-act="vdDel" data-id="' + id + '">Borrar vídeo</button></div>';
    setTimeout(() => vInit(x), 0); return h;
  };
  function playerHtml(x) {
    if (x.kind === 'yt') return navigator.onLine ? '<div class="vwrap"><iframe id="v-frame" src="https://www.youtube-nocookie.com/embed/' + x.yt + '?enablejsapi=1&playsinline=1&rel=0' + (x.start ? '&start=' + x.start : '') + '" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>' : offline();
    if (x.kind === 'vimeo') return navigator.onLine ? '<div class="vwrap"><iframe id="v-frame" src="https://player.vimeo.com/video/' + x.vimeo + '?playsinline=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>' : offline();
    if (x.kind === 'file') return navigator.onLine ? '<video id="v-vid" src="' + esc(x.url) + '" controls playsinline preload="metadata" class="vvid"></video>' : offline();
    if (x.kind === 'local') return '<video id="v-vid" controls playsinline preload="metadata" class="vvid"></video><div class="small muted" id="v-lmsg" style="margin-top:6px">Cargando desde tu móvil…</div>';
    return (navigator.onLine ? '<div class="vwrap"><iframe id="v-frame" src="' + esc(x.url) + '" referrerpolicy="no-referrer"></iframe></div><p class="small muted" style="margin:8px 0 0">Si ves la página en blanco, esa web no permite verse dentro de otras apps. Descarga el vídeo y súbelo con «Editar › Cambiar origen», o usa un enlace de YouTube/Vimeo.</p>' : offline()) + '<a class="small" style="color:var(--green)" target="_blank" rel="noopener" href="' + esc(x.url) + '">Abrir en el navegador ↗ (sale de la app)</a>';
  }
  const offline = () => '<div class="empty" style="padding:18px">Sin conexión: este vídeo necesita internet. Tus apuntes sí funcionan. Los vídeos guardados en el móvil se ven sin conexión.</div>';
  function vInit(x) {
    ytVP = null;
    const done = () => { const y = vget(x.id); if (y && !y.done && vid().auto) markDone(y, true); };
    if (x.kind === 'yt' && navigator.onLine) { const fr = $('#v-frame'); YT.ytLoad().then(() => { if ($('#v-frame') === fr) ytVP = new window.YT.Player('v-frame', { events: { onStateChange: (e) => { if (e.data === 0) done(); } } }); }).catch(() => {}); }
    const v = $('#v-vid'); if (v) { v.addEventListener('ended', done); if (x.kind === 'local') localGet(x.id).then((u) => { if (u && $('#v-vid') === v) { v.src = u; const m = $('#v-lmsg'); if (m) m.remove(); } else { const m = $('#v-lmsg'); if (m) m.textContent = 'No encuentro el archivo en este móvil (¿borraste los datos del navegador?). Vuelve a subirlo con Editar.'; } }); }
  }
  const pos = () => { const v = $('#v-vid'); if (v) return { get: () => v.currentTime, seek: (t) => { v.currentTime = t; v.play(); } }; if (ytVP && ytVP.getCurrentTime) return { get: () => ytVP.getCurrentTime(), seek: (t) => { ytVP.seekTo(t, true); ytVP.playVideo(); } }; return null; };
  const vnList = (x) => { const ns = x.notes || []; if (!ns.length) return ''; return Object.keys(NCLS).map((k) => { const l = ns.filter((n) => n.cls === k); if (!l.length) return ''; return card(ct(NCLS[k][0] + ' ' + NCLS[k][1] + ' (' + l.length + ')') + l.map((n) => '<div class="row between" style="align-items:flex-start;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1;white-space:pre-wrap">' + (n.t != null ? '<a href="#" data-act="vnSeek" data-t="' + n.t + '" style="color:var(--green);font-weight:700">' + YT.tsF(n.t) + '</a> ' : '') + esc(n.text) + '</div><button class="btn small ghost" data-act="vnDel" data-id="' + x.id + '" data-n="' + n.id + '">✕</button></div>').join('')); }).join(''); };
  A.vnNow = () => { const p = pos(); if (p) $('#vn-ts').value = YT.tsF(p.get()); else APP.toast('Escribe el minuto a mano (m:ss)'); };
  A.vnSeek = (el) => { const p = pos(); if (p) { p.seek(+el.dataset.t); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  A.vnAdd = async (el) => {
    const x = vget(el.dataset.id), text = val('vn-text').trim(); if (!text) return APP.toast('Escribe el apunte');
    x.notes = x.notes || []; x.notes.push({ id: uid(), cls: selV('vncls')[0] || 'key', text, t: YT.tsP(val('vn-ts')), created: today() });
    await saveVid(); await vSync(x); $('#vn-text').value = ''; $('#vn-ts').value = ''; $('#vn-list').innerHTML = vnList(x); APP.toast('Apunte guardado en Apuntes');
  };
  A.vnDel = async (el) => { const x = vget(el.dataset.id); x.notes = x.notes.filter((n) => n.id !== el.dataset.n); await saveVid(); await vSync(x); $('#vn-list').innerHTML = vnList(x); };
  A.vdWhere = (el) => { const x = vget(el.dataset.id); const c = catOf(x.cat); APP.openSheet('¿Dónde guardo los apuntes?', field('Tema (posición o técnica)', '<input id="vw-topic" list="dl-pos" autocomplete="off" value="' + esc(x.noteTopic || x.sub) + '">') + group('Apartado en Apuntes', chipsH('vwsec', APP.SECS, x.noteSec || c.sec, false)) + '<button class="btn block" data-act="vdWhereSave" data-id="' + x.id + '">Guardar</button>'); };
  A.vdWhereSave = async (el) => { const x = vget(el.dataset.id); x.noteTopic = val('vw-topic').trim(); x.noteSec = APP.sel('vwsec')[0] || ''; await saveVid(); await vSync(x); APP.closeSheet(); rk(); };
  // Crea o actualiza el apunte de Apuntes ligado a este vídeo
  async function vSync(x) {
    const topic = APP.canon(x.noteTopic || x.sub).name || x.noteTopic || x.sub; const section = x.noteSec || catOf(x.cat).sec; const by = (k) => (x.notes || []).filter((n) => n.cls === k);
    const line = (n) => (n.t != null ? '[' + YT.tsF(n.t) + '] ' : '') + n.text;
    let n = S.notes.find((y) => y.studyId === 'v:' + x.id); if (!(x.notes || []).length && !n) return;
    const data = { topic, section, title: x.title, keys: by('key').map(line), body: by('step').map(line).join('\n') + (by('doubt').length ? (by('step').length ? '\n\n' : '') + 'Dudas:\n' + by('doubt').map(line).join('\n') : ''), mistakes: by('err').map(line).join('\n'), mode: 'both', link: x.kind === 'local' ? '' : x.url, updated: today(), studyId: 'v:' + x.id };
    if (n) Object.assign(n, data); else S.notes.push(Object.assign({ id: uid(), created: today() }, data));
    const cur = S.noteTopics[topic] || []; if (!cur.some((c2) => norm(c2) === norm(section))) { cur.push(section); S.noteTopics[topic] = cur; await sav('noteTopics', S.noteTopics); }
    await sav('notes', S.notes);
  }
  async function markDone(x, auto) {
    const b = xpTotal(), lb = lvlOf(b), rb = rankOf(b).i; x.done = x.done ? '' : today(); await saveVid();
    const a = xpTotal(), la = lvlOf(a), ra = rankOf(a).i;
    if (x.done) { APP.toast('🎉 ' + (auto ? 'Vídeo terminado' : 'Visto') + ' · +' + xpOf(x) + ' XP' + (ra > rb ? ' · ¡' + rankOf(a).name + '!' : la > lb ? ' · ¡Nivel ' + la + '!' : '')); const nx = nextOf(x.cat); if (auto && nx) setTimeout(() => APP.toast('Siguiente: ' + nx.title), 2800); }
    if (location.hash.indexOf('#/video/') === 0 || location.hash.indexOf('#/videos') === 0) rk();
  }
  A.vdDone = (el) => markDone(vget(el.dataset.id), false);
  A.vdEdit = (el) => { const x = vget(el.dataset.id); APP.openSheet('Editar vídeo', field('Título', '<input id="ve-title" value="' + esc(x.title) + '">') + (x.kind !== 'local' ? field('Enlace', '<input id="ve-url" type="url" value="' + esc(x.url) + '">') : '') + field('Categoría', '<select id="ve-cat" data-input="veCat">' + CATS.map((c) => '<option value="' + c.id + '"' + (c.id === x.cat ? ' selected' : '') + '>' + c.ico + ' ' + esc(c.name) + '</option>').join('') + '</select>') + field('Sección', '<select id="ve-sub">' + subOptions(x.cat, x.sub) + '</select>') + '<div class="row" style="gap:8px"><button class="btn secondary block" data-act="vdMove" data-id="' + x.id + '" data-d="-1">↑ Antes</button><button class="btn secondary block" data-act="vdMove" data-id="' + x.id + '" data-d="1">↓ Después</button></div><div class="togrow" style="margin-top:10px"><div><b>Marcar como visto al terminar</b><small>Si el vídeo llega al final, se marca solo</small></div><button class="tgl' + (vid().auto ? ' on' : '') + '" data-act="vdAuto" aria-label="Auto"></button></div><button class="btn block" style="margin-top:10px" data-act="vdEditSave" data-id="' + x.id + '">Guardar</button>'); };
  A.veCat = (el) => { const s = $('#ve-sub'); if (s) s.innerHTML = subOptions(el.value, ''); };
  A.vdAuto = async (el) => { vid().auto = !vid().auto; el.classList.toggle('on', vid().auto); await saveVid(); };
  A.vdEditSave = async (el) => { const x = vget(el.dataset.id); x.title = val('ve-title').trim() || x.title; if ($('#ve-url')) { const u = val('ve-url').trim(); const k = kindOf(u); if (k && u !== x.url) { ['yt', 'vimeo', 'start'].forEach((q) => delete x[q]); Object.assign(x, k, { url: u }); } } x.cat = val('ve-cat'); x.sub = val('ve-sub'); await saveVid(); await vSync(x); APP.closeSheet(); rk(); };
  A.vdMove = async (el) => { const x = vget(el.dataset.id), d = Number(el.dataset.d); const l = ordered(x.cat).filter((y) => y.sub === x.sub); const i = l.findIndex((y) => y.id === x.id), j = i + d; if (j < 0 || j >= l.length) return APP.toast('Ya está en el extremo'); const t = l[j].order; l[j].order = x.order; x.order = t; if (l[j].order === x.order) x.order += d; await saveVid(); APP.toast(d < 0 ? 'Movido antes' : 'Movido después'); };
  A.vdDel = async (el) => { const x = vget(el.dataset.id); if (!APP.confirm('¿Borrar «' + x.title + '»? Los apuntes ya guardados en Apuntes se mantienen.')) return; if (x.kind === 'local') await localDel(x.id); vid().items = items().filter((y) => y.id !== x.id); vid().plan = vid().plan.filter((e) => e.vid !== x.id); await saveVid(); APP.go('#/videos/' + x.cat); };

  // ---------- plan de estudio (calendario) ----------
  const WDL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  function planTab() {
    const m = ui.vd.m; const first = ST.parse(m + '-01'); const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); const off = (first.getDay() + 6) % 7; const t = today();
    const pl = vid().plan.filter((e) => e.date.slice(0, 7) === m && vget(e.vid)); const doneN = pl.filter((e) => vget(e.vid).done).length; const pct = pl.length ? doneN / pl.length : 0;
    let h = '<div class="card"><div class="row between" style="margin-bottom:10px"><button class="btn small ghost" data-act="vdMon" data-d="-1">‹</button><b>' + monthName(m) + '</b><button class="btn small ghost" data-act="vdMon" data-d="1">›</button></div>';
    h += '<div class="row" style="gap:14px;align-items:center;margin-bottom:12px">' + mring(pct, 'var(--green)', Math.round(pct * 100) + '%', 64) + '<div><b>' + doneN + ' de ' + pl.length + ' vídeos del plan</b><div class="small muted">' + (pl.length ? (doneN === pl.length ? '¡Plan del mes completado! 🎉' : 'Te faltan ' + (pl.length - doneN)) : 'Aún no hay plan este mes') + '</div></div></div>';
    h += '<div class="vcal">' + WDL.map((w) => '<span class="vh">' + w + '</span>').join('');
    for (let i = 0; i < off; i++) h += '<span></span>';
    for (let d = 1; d <= dim; d++) { const ds = m + '-' + String(d).padStart(2, '0'); const ev = vid().plan.filter((e) => e.date === ds && vget(e.vid)); const dn = ev.filter((e) => vget(e.vid).done).length; const cls = ev.length ? (dn === ev.length ? 'all' : dn ? 'part' : 'has') : ''; h += '<button class="vd ' + cls + (ds === t ? ' today' : '') + (ds < t && ev.length && dn < ev.length ? ' late' : '') + '" data-act="vdDay" data-d="' + ds + '"><b>' + d + '</b>' + (ev.length ? '<i>' + (dn === ev.length ? '✓' : ev.length) + '</i>' : '') + '</button>'; }
    h += '</div><div class="row" style="gap:10px;margin-top:10px;font-size:11px;color:var(--muted)"><span>● con vídeos</span><span style="color:var(--green)">✓ completado</span><span style="color:var(--red)">atrasado</span></div></div>';
    h += '<div class="row" style="gap:8px"><button class="btn block" data-act="vdAuto2">⚙ Planificar el mes</button><button class="btn secondary" data-act="vdClear" style="flex:none">Limpiar</button></div>';
    const nxt = vid().plan.filter((e) => e.date >= t && vget(e.vid) && !vget(e.vid).done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    if (nxt.length) h += card(ct('Próximos vídeos del plan') + nxt.map((e) => { const x = vget(e.vid); return '<a class="cnt" style="text-decoration:none;color:inherit" href="#/video/' + x.id + '"><span><b>' + esc(x.title) + '</b><br><span class="small muted">' + fmtDate(e.date) + ' · ' + catOf(x.cat).name + '</span></span><span class="muted">›</span></a>'; }).join(''), 'margin-top:12px');
    return h;
  }
  A.vdMon = (el) => { const d = ST.parse(ui.vd.m + '-01'); d.setMonth(d.getMonth() + Number(el.dataset.d)); ui.vd.m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); rk(); };
  A.vdDay = (el) => dayOpen(el.dataset.d);
  function dayOpen(ds) {
    const ev = vid().plan.filter((e) => e.date === ds && vget(e.vid));
    APP.openSheet(fmtDate(ds), (ev.length ? ev.map((e) => { const x = vget(e.vid); return '<div class="cnt" style="gap:8px"><button class="chk' + (x.done ? ' on' : '') + '" data-act="vdPlanDone" data-id="' + x.id + '" data-d="' + ds + '" aria-label="Completado">' + (x.done ? '✓' : '') + '</button><a style="flex:1;text-decoration:none;color:inherit" href="#/video/' + x.id + '" data-act="closeSheet"><b>' + esc(x.title) + '</b><br><span class="small muted">' + catOf(x.cat).name + ' · ' + esc(x.sub) + '</span></a><button class="btn small ghost" data-act="vdPlanRm" data-e="' + e.id + '" data-d="' + ds + '">✕</button></div>'; }).join('') : '<p class="muted">Nada planificado este día.</p>') + '<button class="btn block secondary" style="margin-top:12px" data-act="vdPlanPick" data-d="' + ds + '">+ Añadir vídeo a este día</button>');
  }
  A.vdPlanDone = async (el) => { const x = vget(el.dataset.id); await markDone(x, false); dayOpen(el.dataset.d); };
  A.vdPlanRm = async (el) => { vid().plan = vid().plan.filter((e) => e.id !== el.dataset.e); await saveVid(); dayOpen(el.dataset.d); rk(); };
  A.vdPlanPick = (el) => { const ds = el.dataset.d; const l = ordered().filter((x) => !x.done && !vid().plan.some((e) => e.date === ds && e.vid === x.id)); APP.openSheet('Elige el vídeo', l.length ? l.map((x) => '<button class="cnt vpick" data-act="vdPlanSet" data-id="' + x.id + '" data-d="' + ds + '"><span style="text-align:left"><b>' + esc(x.title) + '</b><br><span class="small muted">' + catOf(x.cat).ico + ' ' + esc(x.sub) + '</span></span><span>+</span></button>').join('') : '<p class="muted">No tienes vídeos pendientes. Añade más desde «Camino».</p>'); };
  A.vdPlanSet = async (el) => { vid().plan.push({ id: uid(), date: el.dataset.d, vid: el.dataset.id }); await saveVid(); APP.closeSheet(); rk(); };
  A.vdPlanAdd = (el) => APP.openSheet('Añadir al plan', field('Día', '<input id="vp-date" type="date" value="' + today() + '">') + '<button class="btn block" data-act="vdPlanAddSave" data-id="' + el.dataset.id + '">Añadir</button>');
  A.vdPlanAddSave = async (el) => { const d = val('vp-date'); if (!d) return; vid().plan.push({ id: uid(), date: d, vid: el.dataset.id }); await saveVid(); APP.closeSheet(); APP.toast('Añadido al plan'); };
  A.vdAuto2 = () => APP.openSheet('Planificar el mes', '<p class="muted small" style="margin:0 0 8px">Reparto los vídeos pendientes siguiendo el orden de tu camino. ¿Cuántos por semana y qué días?</p>' + group('Vídeos por semana', chipsH('ap-n', ['1', '2', '3', '4', '5', '6', '7'], '3', false)) + group('Días', chipsH('ap-d', WDL.map((w, i) => ({ v: String(i), l: w })), ['0', '2', '4'], true)) + '<button class="btn block" data-act="vdAutoGo">Crear plan de ' + monthName(ui.vd.m) + '</button>');
  A.vdAutoGo = async () => {
    const n = Number(APP.sel('ap-n')[0] || 3); const days = APP.sel('ap-d').map(Number).sort(); if (!days.length) return APP.toast('Elige al menos un día');
    const m = ui.vd.m; const first = ST.parse(m + '-01'); const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); const t = today();
    const planned = new Set(vid().plan.map((e) => e.vid)); const pool = ordered().filter((x) => !x.done && !planned.has(x.id)); let i = 0, added = 0;
    for (let w = 0; w < 6 && i < pool.length; w++) { let wk = 0; for (const wd of days) { if (wk >= n || i >= pool.length) break; const d = 1 + (w * 7 + wd - ((first.getDay() + 6) % 7)); if (d < 1 || d > dim) continue; const ds = m + '-' + String(d).padStart(2, '0'); if (ds < t) continue; vid().plan.push({ id: uid(), date: ds, vid: pool[i++].id }); wk++; added++; } }
    await saveVid(); APP.closeSheet(); APP.toast(added ? 'Plan creado: ' + added + ' vídeos' : 'No hay vídeos pendientes o días libres en este mes'); rk();
  };
  A.vdClear = async () => { if (!APP.confirm('¿Quitar del plan los vídeos aún no vistos de este mes?')) return; const m = ui.vd.m; vid().plan = vid().plan.filter((e) => !(e.date.slice(0, 7) === m && vget(e.vid) && !vget(e.vid).done)); await saveVid(); rk(); };

  // Enlace en el panel BJJ, al lado de Estudio
  const oldEntrenos = V.entrenos;
  V.entrenos = () => {
    const h = oldEntrenos(); const i = h.indexOf('href="#/estudio"'); if (i < 0) return h; const j = h.indexOf('</a>', i) + 4; const xp = xpTotal(), n = items().filter((x) => x.done).length;
    return h.slice(0, j) + '<a class="card" href="#/videos" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;margin-bottom:8px"><span style="font-size:24px">🎬</span><span style="flex:1"><b>Vídeos</b><br><span class="small muted">Camino por niveles y plan · nivel ' + lvlOf(xp) + ' · ' + n + ' vistos</span></span><span class="muted">›</span></a>' + h.slice(j);
  };
})();
