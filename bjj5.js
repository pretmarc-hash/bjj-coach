/* v20 · Diseño «Analítico»: Inicio y BJJ por bloques (1 a mejorar · 2 hoy y semana · 3 plan), iconos de línea en vez de emoticonos, gráfico de carga, animación solo al cambiar de pantalla */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, today, fmtDate } = APP;
  const V = APP.views;
  const $ = APP.$;
  const ui = APP.ui;

  // ---------------- iconos de línea ----------------
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="M16 10l6-3v10l-6-3"/>', dumb: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z"/><path d="M5 19l8-8"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', check: '<path d="M5 12l5 5 9-10"/>', play: '<path d="M8 5l11 7-11 7z"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
    repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>', pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', chart: '<path d="M4 4v16h16M8 16v-5M13 16V8M18 16V7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>', users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15c3 0 5 1.5 5 5"/>',
    tree: '<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 12l8-5M8 12l8 5"/>', lib: '<path d="M5 4v16M10 4v16M15 5l4 15"/>', plus: '<path d="M12 5v14M5 12h14"/>', chev: '<path d="M9 6l6 6-6 6"/>',
    flex: '<path d="M7 20V9l5-5 5 5v11z"/>', flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 3-6 1 1 2 1 2-4z"/>', bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',
    medic: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>', save: '<path d="M12 4v10M7 10l5 5 5-5M5 20h14"/>', trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/>', door: '<path d="M6 21V4h12v17M4 21h16"/><circle cx="14.5" cy="12.5" r=".8"/>', mountain: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h3l2.5 11h10L21 8H7"/>', drop: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>', f1: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5"/><path d="M8.5 16.5c1-1.6 2.2-2.2 3.5-2.2s2.5.6 3.5 2.2"/>', f2: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5"/><path d="M9 15.5c1-.6 1.9-.9 3-.9s2 .3 3 .9"/>', f3: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5"/><path d="M9 15h6"/>', f4: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5"/><path d="M9 14.5c1 1.2 2 1.7 3 1.7s2-.5 3-1.7"/>', f5: '<circle cx="12" cy="12" r="9"/><path d="M9 10v.5M15 10v.5"/><path d="M8 14c1 2.4 2.6 3.2 4 3.2s3-.8 4-3.2z"/>', moon: '<path d="M20 14a8 8 0 1 1-9-10 6 6 0 0 0 9 10z"/>', bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'
  };
  const ic = (n, z, c) => '<svg class="ic" width="' + (z || 16) + '" height="' + (z || 16) + '" viewBox="0 0 24 24" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[n] || P.more) + '</svg>';
  APP.ic = ic;
  const EMO = { '🥋': 'user', '🏋': 'dumb', '🍎': 'leaf', '🎯': 'target', '🔥': 'flame', '🧠': 'bulb', '🩹': 'medic', '⚖': 'gauge', '💾': 'save', '▶': 'play', '📝': 'pen', '📚': 'lib', '🌳': 'tree', '📊': 'chart', '📅': 'cal', '🏆': 'trophy', '🎓': 'cap', '💬': 'chat', '⚠': 'alert', '🎬': 'video', '🎞': 'video', '🛡': 'shield', '🕸': 'web', '🌀': 'repeat', '🚪': 'door', '⛰': 'mountain', '🤼': 'users', '💪': 'flex', '⏱': 'clock', '😴': 'moon', '🧘': 'leaf', '🔁': 'repeat', '⚡': 'bolt', '✅': 'check', '❓': 'help' };
  Object.assign(EMO, { '😫': 'f1', '😓': 'f1', '😕': 'f2', '😐': 'f3', '🙂': 'f4', '😄': 'f5', '🥱': 'f3', '😴': 'moon', '💡': 'bulb', '🧰': 'flex', '🎥': 'video', '🍎': 'leaf', '⚙': 'gear', '⚙️': 'gear', '★': 'trophy', '✨': 'bolt', '📋': 'book', '📈': 'chart', '📉': 'chart', '🛒': 'cart', '💧': 'drop', '👩': 'leaf', '🧍': 'user', '🧑': 'user', '🥗': 'leaf', '🍽': 'leaf', '🥩': 'leaf', '⚖️': 'gauge', '📆': 'cal', '🗓': 'cal', '✏': 'pen', '🎙': 'pen', '🔔': 'alert', '⭐': 'trophy', '🥇': 'trophy', '🏅': 'trophy', '👍': 'check', '✔': 'check', '☑': 'check', '❌': 'plus', '➕': 'plus', '▶️': 'play', '⏯': 'play' });
  const RX = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*/gu;
  const RT = /\p{Extended_Pictographic}/u;
  const SKIP = { TEXTAREA: 1, OPTION: 1, SELECT: 1, SCRIPT: 1, STYLE: 1, INPUT: 1, TITLE: 1, SVG: 1 };
  const iconFor = (m) => { const first = String.fromCodePoint(m.codePointAt(0)); return EMO[first] || EMO[first + '️'] || ''; };
  function iconize(root) {
    if (!root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (!SKIP[(n.parentNode.nodeName || '').toUpperCase()] && RT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) }); const L = []; let n; while ((n = w.nextNode())) L.push(n);
    L.forEach((t) => { const f = document.createDocumentFragment(); const s = t.nodeValue; let last = 0, m; RX.lastIndex = 0; while ((m = RX.exec(s))) { f.appendChild(document.createTextNode(s.slice(last, m.index).replace(/ $/, last === 0 && m.index === 0 ? '' : ' '))); const nm = iconFor(m[0]); if (!nm) f.appendChild(document.createTextNode(m[0])); else { const sp = document.createElement('span'); sp.className = 'icw'; sp.innerHTML = ic(nm, 16); f.appendChild(sp); } last = m.index + m[0].length; } f.appendChild(document.createTextNode(s.slice(last).replace(/^ /, ' '))); t.parentNode.replaceChild(f, t); });
  }
  const noEmoji = (x) => String(x).replace(RX, (m) => (iconFor(m) ? '' : m)).replace(/^\s+/, '');
  const toast0 = APP.toast; if (toast0) APP.toast = (m, ...r) => toast0.call(APP, noEmoji(m), ...r);
  const ACR = ['BJJ', 'RIR', 'IMC', 'TMB', 'RPE', 'ACWR', 'HIIT', 'RM', 'DTF', 'EPOC', 'IA', 'OK'];
  function sentence(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.ct,.sect,.gk,.eb,.pl,.tk,.rh,.il,.k,.glabel,.datebox,b.k,.today2 .go').forEach((el) => {
      const t = el.textContent.trim(); if (t.length < 3 || t !== t.toUpperCase() || t === t.toLowerCase()) return;
      let first = true; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const L = []; let n; while ((n = w.nextNode())) L.push(n);
      L.forEach((x) => { let v = x.nodeValue.toLowerCase().replace(/[a-záéíóúñü]+/g, (m) => (ACR.indexOf(m.toUpperCase()) >= 0 ? m.toUpperCase() : m)); if (first && /[a-záéíóúñü]/i.test(v)) { v = v.replace(/[a-záéíóúñü]/i, (c) => c.toUpperCase()); first = false; } x.nodeValue = v; });
    });
  }
  const tidy0 = APP.tidy; APP.tidy = (root) => { tidy0(root); try { iconize(root); sentence(root); } catch (e) { /* no bloquea */ } };

  // ---------------- animación solo al cambiar de pantalla ----------------
  let lastHash = ''; const render0 = APP.render;
  APP.render = function () { const v = $('#view'); const ch = location.hash !== lastHash; lastHash = location.hash; if (v) v.classList.toggle('anim', ch); const hh = location.hash.replace(/^#\/?/, '').split('/')[0]; document.body.classList.toggle('n6home', hh === '' || hh === 'inicio' || hh === 'entrenos'); return render0.apply(this, arguments); };

  // ---------------- piezas ----------------
  const kids = (html) => { const d = document.createElement('div'); d.innerHTML = html; return Array.prototype.slice.call(d.children); };
  const has = (e, t) => e.textContent.indexOf(t) >= 0;
  const sec = (n, title, icon, cls, els, meta) => (els.length ? '<section class="g5s ' + cls + '"><div class="g5h">' + ic(icon, 17) + '<span>' + title + '</span>' + (meta ? '<i class="g5m">' + meta + '</i>' : '') + '</div>' + els.map((e) => (typeof e === 'string' ? e : e.outerHTML)).join('') + '</section>' : '');
  const row = (href, icon, cls, name, right) => '<a class="g5i" href="' + href + '"><span class="ico ' + cls + '">' + ic(icon, 18) + '</span><span class="tx">' + name + '</span><span class="rt">' + (right || '') + ic('chev', 16) + '</span></a>';
  const list = (label, rows) => '<div class="g5k">' + label + '</div><div class="g5list">' + rows.join('') + '</div>';
  const redInner = () => { const k = kids(APP.redBlock ? APP.redBlock() : ''); const r = k.find((e) => e.classList.contains('redb')); if (r) { const c = r.querySelector('.ct'); if (c) c.remove(); } return r; };
  const vinfo = () => (APP.vidInfo ? APP.vidInfo() : { done: 0, total: 0, today: null });

  // carga de las últimas 4 semanas (minutos × esfuerzo percibido, método session-RPE de Foster 2001)
  function loadPanel() {
    const t = today(); const w = [0, 0, 0, 0]; let n = 0;
    S.sessions.forEach((x) => { const d = ST.parse(t) - ST.parse(x.date); const k = Math.floor(d / 86400000 / 7); if (d >= 0 && k < 4) { w[3 - k] += (Number(x.duration) || 0) * ((x.feel && x.feel.effort) || x.intensity || 3); n++; } });
    if (n < 2) return '';
    const mx = Math.max.apply(null, w) * 1.25 || 1; const avg = w.reduce((a, b) => a + b, 0) / 4; const X = (i) => 10 + i * 106, Y = (v) => 96 - (v / mx) * 80;
    const pts = w.map((v, i) => X(i) + ',' + Y(v).toFixed(1)); const line = 'M' + pts.join(' L');
    const lo = Y(avg * 1.2), hi = Y(avg * 0.8); const last = w[3]; const ratio = avg ? last / avg : 0;
    const dots = w.map((v, i) => '<circle cx="' + X(i) + '" cy="' + Y(v).toFixed(1) + '" r="' + (i === 3 ? 4.5 : 3) + '" fill="' + (i === 3 ? 'var(--ink)' : 'var(--green)') + '"/>').join('');
    const svg = '<svg class="ldchart" viewBox="0 0 330 118"><rect x="0" y="' + lo.toFixed(1) + '" width="330" height="' + (hi - lo).toFixed(1) + '" fill="color-mix(in srgb,var(--green) 12%,transparent)"/><text x="4" y="' + (lo - 4).toFixed(1) + '" font-size="10" fill="var(--muted)">tu media ±20 %</text><path d="' + line + ' L' + X(3) + ',104 L' + X(0) + ',104z" fill="color-mix(in srgb,var(--green) 16%,transparent)"/><path d="' + line + '" fill="none" stroke="var(--green)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' + dots + ['hace 3 sem', 'hace 2', 'hace 1', 'esta'].map((l, i) => '<text x="' + X(i) + '" y="116" font-size="10" text-anchor="' + (i === 0 ? 'start' : i === 3 ? 'end' : 'middle') + '" fill="var(--muted)">' + l + '</text>').join('') + '</svg>';
    const note = ratio > 1.3 ? 'Esta semana llevas bastante más carga que tu media. Reparte los días duros.' : ratio < 0.7 ? 'Llevas menos carga que tu media: buen momento para sumar una sesión.' : 'Dentro de tu rango habitual.';
    return '<div class="pn"><h4>Carga de 4 semanas<small>minutos × esfuerzo</small></h4>' + svg + '<p class="muted small" style="margin:8px 0 0">' + note + '</p></div>';
  }

  const oldInicio = V.inicio;
  const planCardHtml = () => { const vi = vinfo(); return '<a class="g5pl" href="#/videos"><span class="ico c-violet">' + ic('video', 18) + '</span><span class="tx"><b>Plan de vídeos</b><small>' + (vi.total ? vi.done + ' de ' + vi.total + ' vistos' + (vi.today ? ' · hoy: ' + esc(vi.today.title) : '') : 'Añade vídeos y planifica uno por día') + '</small></span>' + ic('chev', 16) + '</a>'; };
  // reparte el Inicio antiguo en grupos (hoy, semana, vídeo, resto)
  function splitInicio() {
    const els = kids(oldInicio()); const G = { hoy: [], semana: [], video: [], mas: [], obj: [], onb: [], mejor: [] }; let mode = '';
    els.forEach((e) => {
      const c = e.classList;
      if (c.contains('sect')) return;
      if (c.contains('pair') || c.contains('wk2') || c.contains('leg')) G.semana.push(e);
      else if (has(e, 'Hoy toca ver')) G.video.push(e);
      else if (has(e, 'Hoy en tu BJJ')) G.avisos = e;
      else if (c.contains('today2') || c.contains('inten') || has(e, '¿Cómo ha ido hoy')) G.hoy.push(e);
      else if (c.contains('today-card')) G.onb.push(e);
      else if (has(e, 'Reto') || has(e, 'RETO')) G.reto = e;
      else if (has(e, 'Mis objetivos')) G.obj.push(e);
      else if (c.contains('insight')) G.mejor.push(e);
      else if (c.contains('tl3') || has(e, 'Constancia')) G.mas.push(e);
    });
    if (G.reto) G.semana.push(G.reto);
    return G;
  }
  // ---------- bloques compactos (diseño del ejemplo aprobado) ----------
  const DLB = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const longDate = () => { try { return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return fmtDate(today()); } };
  const weekData = () => {
    const t = today(); const ws = ST.weekStart(t); const we = ST.addDays(ws, 6);
    const weekS = S.sessions.filter((x) => x.date >= ws && x.date <= we); const minutes = weekS.reduce((a, x) => a + (Number(x.duration) || 0), 0);
    const p = S.profile; const target = p && Number(p.weeklyTarget) ? Number(p.weeklyTarget) : (Object.keys(S.plan.days).filter((k) => S.plan.days[k].on).length || 0);
    return { t, ws, weekS, minutes, target, nb: weekS.length };
  };
  const stripHtml = (w) => '<div class="n6wk">' + DLB.map((l, i) => {
    const d = ST.addDays(w.ws, i); const done = S.sessions.some((x) => x.date === d) || ((S.gym && S.gym.logs) || []).some((x) => x.date === d);
    let planned = false; try { const k = APP.plan && APP.plan.wd ? APP.plan.wd(d) : i; planned = !!(S.plan.days[k] && S.plan.days[k].on); } catch (e) { /* sin plan */ }
    const cls = done ? 'd' : d === w.t ? 't' : planned ? 'p' : '';
    return '<button data-act="dayPeek" data-d="' + d + '" aria-label="' + esc(fmtDate(d)) + '"><span>' + l + '</span><b class="' + cls + '">' + (done ? ic('check', 15, '#fff', 2.6) : '') + '</b></button>';
  }).join('') + '</div>';
  const todayInfo = () => {
    const t = today(); const a = APP.advice ? APP.advice() : null; const doneToday = S.sessions.filter((x) => x.date === t); const nx = APP.plan ? APP.plan.next() : null;
    const o = { a, nx, doneToday, title: '', sub: '', act: 'newSession', lab: 'Registrar entreno', key: '', dd: '', line: '' };
    if (nx && !(doneToday.length && nx.inDays === 0)) {
      const when = nx.inDays === 0 ? '' : (nx.inDays === 1 ? 'Mañana' : fmtDate(nx.date)) + ' · ';
      o.title = nx.focus || 'Clase de BJJ'; o.sub = when + (nx.start || (nx.inDays === 0 ? 'hoy' : '')); o.act = nx.inDays === 0 ? 'regPlanned' : 'newSession'; o.lab = nx.inDays === 0 ? 'Registrar entreno' : 'Ver el plan'; o.key = nx.key; o.dd = nx.date;
      o.line = (nx.inDays === 0 ? 'Hoy: ' : (nx.inDays === 1 ? 'Mañana: ' : fmtDate(nx.date) + ': ')) + (nx.focus ? nx.focus.charAt(0).toLowerCase() + nx.focus.slice(1) : 'clase de BJJ') + (nx.start ? ', ' + nx.start : '');
    } else if (doneToday.length) { o.title = 'Entreno registrado'; o.sub = (doneToday[0].type || 'Entrenamiento') + (doneToday[0].duration ? ' · ' + doneToday[0].duration + ' min' : ''); o.lab = 'Registrar otro'; o.line = 'Hoy: entreno registrado'; }
    else { o.title = '¿Has entrenado hoy?'; o.sub = 'Registra tu entreno en un minuto'; o.line = 'Hoy: sin clase planificada'; }
    if (a && a.gym && a.gym.today) o.sub += ' · y gym: ' + a.gym.today;
    return o;
  };
  const intLine = (a, why) => { if (!a) return ''; const r = String(a.b.rng).replace('-', '–'); return 'Intensidad recomendada ' + esc(r) + ' de 5' + (why ? ' · en el gym, ' + a.gym.lo + '–' + a.gym.hi + ' repeticiones en reserva' : '') + ' <a class="n6l" data-act="intWhy" role="button">Por qué</a>'; };
  function hoyBlock() {
    const o = todayInfo(); const a = o.a; let h = '<div class="n6"><div class="t">' + esc(o.title) + '</div><div class="s">' + esc(o.sub) + '</div>';
    if (a) { const m = String(a.b.rng).match(/(\d)(?:-(\d))?/); const lo = m ? +m[1] : 0, hi = m ? +(m[2] || m[1]) : 0;
      h += '<div class="seg5" aria-label="Intensidad de 1 a 5">' + [1, 2, 3, 4, 5].map((n) => '<span><i class="' + (n >= lo && n <= hi ? 'on' : '') + '"></i>' + n + '</span>').join('') + '</div><div class="s" style="margin-top:8px">' + intLine(a, true) + '</div>'; }
    return h + '<button class="n6go" data-act="' + o.act + '"' + (o.key ? ' data-key="' + o.key + '" data-d="' + o.dd + '"' : '') + '>' + ic('pen', 17, '#fff', 1.9) + o.lab + '</button></div>';
  }
  function weekBlock(bjj) {
    const w = weekData(); const pct = w.target ? Math.min(100, Math.round((w.nb / w.target) * 100)) : (w.nb ? 100 : 0); const left = Math.max(0, w.target - w.nb);
    const meta = w.nb + (w.target ? ' de ' + w.target : '') + ' entrenos';
    if (bjj) { const o = todayInfo(); return { meta, html: '<div class="n6">' + stripHtml(w) + '<div class="t" style="font-size:19px">' + esc(o.line) + '</div><div class="s">' + intLine(o.a, false) + '</div></div>' }; }
    const txt = !w.nb ? 'Aún no has entrenado esta semana' + (w.target ? ' · tienes ' + w.target + ' entrenos planificados' : '') : (w.minutes ? APP.hm(w.minutes) + ' esta semana · ' : '') + (w.target ? (left ? 'te faltan ' + left + (left === 1 ? ' entreno' : ' entrenos') + ' para tu objetivo' : 'objetivo de la semana cumplido') : 'define tu objetivo semanal en BJJ');
    return { meta, html: '<div class="n6">' + stripHtml(w) + '<div class="n6bar"><i style="width:' + Math.max(pct, w.nb ? 4 : 3) + '%"></i></div><div class="s" style="margin-top:8px">' + esc(txt) + '</div></div>' };
  }
  function videoBlock() {
    const vi = vinfo(); const td = vi.today;
    if (!td) return '<div class="n6"><div class="s" style="margin:0">' + (vi.total ? 'Hoy no tienes vídeo planificado.' : 'Añade vídeos y planifica uno por día.') + '</div><a class="n6go o" href="#/videos">' + ic('video', 17) + (vi.total ? 'Ver el plan' : 'Añadir vídeos') + '</a></div>';
    const cat = vi.catName ? vi.catName(td.cat) : ''; const sub = [cat, td.sub].filter(Boolean).filter((x, i, ar) => ar.indexOf(x) === i).join(' · ');
    return '<div class="n6"><a class="n6vt" href="#/video/' + td.id + '"><span class="th">' + (APP.vidThumb ? APP.vidThumb(td) : '') + '<i>' + ic('play', 18, '#fff', 1.8) + '</i></span><span class="tx"><b>' + esc(td.title) + '</b><span>' + esc(sub) + '</span></span></a><a class="n6go" href="#/video/' + td.id + '">' + ic('play', 17, '#fff', 1.8) + 'Ver y apuntar</a></div>';
  }
  const vmeta = () => { const vi = vinfo(); return vi.weekTotal ? vi.weekDone + ' de ' + vi.weekTotal + ' esta semana' : ''; };
  function esencialBlock() {
    const t = today(); let h = '';
    if (APP.nutri) {
      const tg = APP.nutri.targets(t); const tot = APP.nutri.dayTotal(t); const wt = APP.nutri.waterTarget(t); const ml = APP.nutri.waterCount(t) * APP.nutri.glassMl();
      const wts = APP.gym && APP.gym.weights ? APP.gym.weights() : []; const lw = wts[wts.length - 1]; const tr = APP.gym && APP.gym.weightTrend ? APP.gym.weightTrend() : null; const f = (n) => Math.round(n).toLocaleString('es-ES');
      const ws = tr ? (Math.abs(tr.diff) < 0.3 ? 'tendencia estable' : tr.diff > 0 ? 'sube ' + Math.abs(Math.round(tr.diff * 10) / 10).toString().replace('.', ',') : 'baja ' + Math.abs(Math.round(tr.diff * 10) / 10).toString().replace('.', ',')) : '';
      h += '<div class="n6sm"><a href="#/nutri"><b>' + (tg ? f(tot.k) : '–') + '</b><span>' + (tg ? 'kcal de ' + f(tg.kcal) : 'calcula tu objetivo') + '</span></a><a href="#/nutri"><b>' + (Math.round(ml / 10) / 100).toLocaleString('es-ES') + ' L</b><span>agua de ' + (Math.round(wt.ml / 10) / 100).toLocaleString('es-ES') + '</span></a><a href="#/gym/peso"><b>' + (lw ? String(lw.kg).replace('.', ',') : '–') + '</b><span>' + (lw ? 'kg' + (ws ? ', ' + ws : '') : 'añade tu peso') + '</span></a></div>';
    }
    const w = (APP.weak ? APP.weak() : [])[0];
    h += '<div class="n6k">A mejorar ahora</div><div class="g5list"><a class="g5i" href="#/entrenos"><span class="ico c-red">' + ic('alert', 17) + '</span><span class="tx">' + (w ? esc(w.title) + '<small>' + esc(w.why) + '</small>' : 'Cosas a mejorar<small>Registra rounds para detectar tus puntos débiles</small>') + '</span><span class="rt">' + ic('chev', 15) + '</span></a></div>';
    return h;
  }
  // «Cosas a mejorar» compacto, sacado del bloque rojo de siempre
  function redCompact() {
    const r = redInner(); if (!r) return '';
    const secs = []; let cur = null;
    Array.prototype.slice.call(r.children).forEach((e) => { if (e.classList.contains('rh')) { cur = { label: e.textContent.replace(/\s*·\s*[^·]*$/, '').trim(), items: [], empty: '' }; secs.push(cur); } else if (cur) { if (e.classList.contains('rl')) cur.items.push(e); else if (e.tagName === 'P') cur.empty = e.textContent; } });
    const row = (sc) => { let v = '';
      if (sc.items.length) { const it = sc.items[0]; const b = it.querySelector('b'); const clk = it.getAttribute('data-act') ? ' data-act="' + it.getAttribute('data-act') + '" data-id="' + esc(it.getAttribute('data-id') || '') + '" style="cursor:pointer"' : '';
        v = '<span' + clk + '>' + esc((b ? b.textContent : it.textContent).replace(/\s*›\s*$/, '')) + '</span>'; }
      else v = '<span class="mu">' + esc(sc.empty || 'Sin datos todavía') + '</span>';
      return '<div><b>' + esc(sc.label) + '</b>' + v + '</div>'; };
    return '<div class="red6">' + secs.map(row).join('') + '</div>';
  }
  const row2 = (href, icon, label, sub, right) => '<a class="g5i" href="' + href + '"><span class="ico">' + ic(icon, 17) + '</span><span class="tx">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span><span class="rt">' + (right || '') + ic('chev', 15) + '</span></a>';
  // objetivos: barras compactas; el editor de siempre se abre debajo
  ui.objOpen = ui.objOpen || false;
  APP.actions.objOpen = () => { ui.objOpen = !ui.objOpen; APP.render(); };
  function objBlock(oldPlan) {
    const t = today(); const gs = (APP.goalsOn ? APP.goalsOn(t) : []).concat(APP.goalsOfPeriod ? APP.goalsOfPeriod('week') : []).filter((g, i, ar) => ar.indexOf(g) === i).slice(0, 4);
    const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
    const bars = gs.length ? '<div class="n6">' + gs.map((g, i) => { const p = APP.goalProgress2(g, t); const right = p.target ? fmt(p.score) + ' de ' + p.target : (p.done ? 'Cumplido' : 'Pendiente');
      return '<div class="gl"><div class="r">' + esc(g.text) + '<span>' + right + '</span></div><div class="n6bar"><i style="width:' + Math.max(p.pct || 0, 3) + '%;' + (i % 2 ? 'background:var(--blue)' : '') + '"></i></div></div>'; }).join('') + '<button class="n6go o" data-act="objOpen">' + (ui.objOpen ? 'Ocultar el editor' : 'Añadir o editar objetivos') + '</button></div>' : '';
    return bars + (!gs.length || ui.objOpen ? oldPlan.map((e) => e.outerHTML).join('') : '');
  }
  V.inicio = () => {
    const G = splitInicio(); const wb = weekBlock(false); const vm = vmeta();
    let h = '<div class="ttl"><h2>Inicio<small>' + esc(longDate()) + '</small></h2></div>';
    h += sec('', 'Hoy toca entrenar', 'target', 'c-teal', [hoyBlock()]);
    h += sec('', 'Progreso de la semana', 'chart', 'c-ink', [wb.html], wb.meta);
    h += sec('', 'Tu tarea de hoy: plan y vídeo', 'video', 'c-ink', [videoBlock()], vm);
    h += sec('', 'Lo esencial', 'gauge', 'c-ink', [esencialBlock()].concat(G.onb));
    return h;
  };
  const _unusedInicio = () => {
    const G = splitInicio(); const vi = vinfo(); const t = today();
    let h = '<div class="ttl"><h2>Inicio<small>' + esc(fmtDate(t)) + '</small></h2></div>';
    h += sec('', 'Hoy toca entrenar', 'target', 'c-teal', G.hoy);
    h += sec('', 'Progreso de la semana', 'chart', 'c-teal', G.semana);
    h += sec('', 'Tu tarea de hoy: plan y vídeo', 'video', 'c-violet', G.video.concat([planCardHtml()]));
    h += sec('', 'Lo esencial', 'gauge', 'c-blue', G.mas.concat(['<div class="g5list"><a class="g5i" href="#/entrenos"><span class="ico c-red">' + ic('alert', 17) + '</span><span class="tx">Cosas a mejorar</span><span class="rt">' + ic('chev', 15) + '</span></a></div>']).concat(G.avisos ? [G.avisos] : [], G.onb));
    h += list('Apartados', [row('#/entrenos', 'user', 'c-teal', 'BJJ'), row('#/videos', 'video', 'c-violet', 'Vídeos', vi.total ? vi.done + ' / ' + vi.total : ''), row('#/apuntes', 'pen', 'c-violet', 'Apuntes', String(S.notes.length)), row('#/gym', 'dumb', 'c-blue', 'Físico'), row('#/nutri', 'leaf', 'c-amber', 'Nutrición'), row('#/mas', 'more', 'c-pink', 'Más')]);
    return h;
  };

  const oldEntrenos = V.entrenos;
  V.entrenos = () => {
    const els = kids(oldEntrenos()); const G = { hoy: [], plan: [], rest: [], title: '', red: null, video: [] }; let afterGoals = false;
    els.forEach((e) => {
      const c = e.classList;
      if (c.contains('ttl')) G.title = e.outerHTML;
      else if (c.contains('redb')) { const q = e.querySelector('.ct'); if (q) q.remove(); G.red = e; }
      else if (has(e, 'Hoy toca ver')) G.video.push(e);
      else if (c.contains('inten') || (e.matches && e.matches('[data-act=newSession]')) || (e.getAttribute && e.getAttribute('href') === '#/briefing') || has(e, 'Reto') || has(e, '¿Cómo ha ido hoy') || has(e, 'Hoy toca ver')) G.hoy.push(e);
      else if (c.contains('segt') || (c.contains('card') && (has(e, 'Cumplimiento') || has(e, 'pendientes') || has(e, 'Nuevo objetivo')))) G.plan.push(e);
      else if (c.contains('tl3') || (e.getAttribute && (e.getAttribute('href') === '#/estudio' || e.getAttribute('href') === '#/videos')) || (c.contains('card') && c.contains('gstrip'))) { /* se sustituye por las listas */ }
      else if (e.querySelector && e.querySelector('.gstrip')) G.rest.unshift(e);
      else G.rest.push(e);
    });
    const vi = vinfo(); const due = APP.dueCount ? APP.dueCount() : 0; const ls = APP.loadStatus ? APP.loadStatus() : null;
    let h = G.title;
    const wb = weekBlock(true); const W = splitInicio();
    const hasRed = G.red; if (hasRed) G.red.remove;
    h += sec('', 'Cosas a mejorar', 'alert', 'c-red', [redCompact()]);
    h += sec('', 'Hoy y esta semana', 'clock', 'c-ink', [wb.html], wb.meta);
    h += sec('', 'Tu tarea de plan y vídeo', 'video', 'c-ink', [videoBlock()], vmeta());
    h += sec('', 'Objetivos', 'target', 'c-ink', [objBlock(G.plan)]);
    h += '<div class="n6k">Todo lo demás</div><div class="g5list">' + [
      row2('#/apuntes', 'pen', 'Apuntes', S.notes.length + (S.notes.length === 1 ? ' nota de técnicas' : ' notas de técnicas')),
      row2('#/biblio', 'lib', 'Biblioteca técnica', 'fichas de técnicas y posiciones'),
      row2('#/arbol', 'tree', 'Game plan', 'tu árbol de decisión'),
      row2('#/stats', 'chart', 'Estadísticas y carga', 'rounds, finalizaciones, semanas'),
      row2('#/coach', 'flex', 'Entrenador y ciencia', 'análisis con tus datos'),
      row2('#/videos', 'video', 'Vídeos y plan', 'categorías, calendario y apuntes', vi.total ? vi.done + ' / ' + vi.total : ''),
      row2('#/estudio', 'cap', 'Estudio', 'técnicas que estás aprendiendo'),
      row2('#/repaso', 'repeat', 'Repaso', 'apuntes que toca repasar', due ? String(due) : ''),
      row2('#/plan', 'cal', 'Plan semanal', 'tus días y horarios de clase'),
      row2('#/juego', 'user', 'Mi juego', 'tus posiciones y finalizaciones'),
      row2('#/analisis', 'users', 'Análisis de rolas', 'qué pasó en cada round'),
      row2('#/fisico', 'dumb', 'Preparación física', 'técnicas según tu cuerpo'),
      row2('#/progreso', 'trophy', 'Progreso y logros', 'tu evolución'),
      row2('#/carga', 'gauge', 'Carga y lesiones', 'fatiga y molestias'),
      row2('#/informe', 'book', 'Informe semanal', 'resumen de la semana'),
      row2('#/ciencia', 'info', 'Base científica', 'de dónde salen las recomendaciones')].join('') + '</div>';
    h += loadPanel() + (W.reto ? W.reto.outerHTML : '');
    h += '<div class="g5k">Historial</div>' + G.rest.map((e) => e.outerHTML).join('');
    return h;
  };
})();
