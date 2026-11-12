/* Núcleo: estado, base de datos local (IndexedDB), utilidades de interfaz y enrutador. */
(function () {
  'use strict';
  const ST = window.BJJStats;
  const APP = (window.APP = {
    ST,
    S: { sessions: [], rounds: [], mastery: {}, chains: [], goals: [], profile: null, settings: { theme: 'auto' }, favs: [], custom: [], aliases: {}, plan: null, lib: [] },
    views: {}, actions: {}, titles: {}, ui: {}
  });


  // Plan: días habituales, ajustes por fecha, entrenos extra, hechos manuales y estado de avisos.
  APP.defaultPlan = () => ({
    days: {}, overrides: {}, extras: [], done: {}, notified: {}, weeklySeen: '',
    notif: { enabled: false, afterMin: 15, remindUnlogged: true, remindAfterH: 3, goals: false, weekly: false, weeklyDay: 7, weeklyTime: '20:00' }
  });
  APP.normalizePlan = (p) => { const d = APP.defaultPlan(); if (!p) return d; return Object.assign(d, p, { notif: Object.assign(d.notif, p.notif || {}) }); };

  // ---------- utilidades ----------
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const today = () => ST.toISO(new Date());
  const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const fmtDate = (s) => { try { return ST.parse(s).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return s; } };
  Object.assign(APP, { esc, uid, today, nowTime, fmtDate });

  APP.LEVELS = ['No la conozco', 'La conozco teóricamente', 'La estoy aprendiendo', 'Puedo ejecutarla entrenando', 'La aplico contra resistencia'];
  APP.CATS = { guardia: 'Guardias', pase: 'Pases', finalizacion: 'Finalizaciones', escape: 'Escapes', sweep: 'Sweeps', derribo: 'Derribos', posicion: 'Posiciones', transicion: 'Transiciones', retencion: 'Retención', concepto: 'Conceptos' };
  APP.MODES = { gi: 'GI', nogi: 'NO-GI', both: 'Ambos' };

  // ---------- base de datos ----------
  let db = null;
  const mem = {}; // alternativa en memoria si IndexedDB no está disponible
  const STORES = ['sessions', 'rounds', 'chains', 'goals', 'mastery', 'meta'];
  function openDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      let req;
      try { req = indexedDB.open('bjj-coach', 1); } catch (e) { return resolve(null); }
      req.onupgradeneeded = () => {
        const d = req.result;
        ['sessions', 'rounds', 'chains', 'goals', 'mastery'].forEach((n) => d.createObjectStore(n, { keyPath: 'id' }));
        d.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  const keyOf = (store) => (store === 'meta' ? 'key' : 'id');
  APP.db = {
    all(store) {
      if (!db) return Promise.resolve(Object.values(mem[store] || {}));
      return new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    },
    put(store, val) {
      if (!db) { mem[store] = mem[store] || {}; mem[store][val[keyOf(store)]] = val; return Promise.resolve(val); }
      return new Promise((res, rej) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(val); t.oncomplete = () => res(val); t.onerror = () => rej(t.error); });
    },
    del(store, id) {
      if (!db) { if (mem[store]) delete mem[store][id]; return Promise.resolve(); }
      return new Promise((res, rej) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(id); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
    },
    clear(store) {
      if (!db) { mem[store] = {}; return Promise.resolve(); }
      return new Promise((res, rej) => { const t = db.transaction(store, 'readwrite'); t.objectStore(store).clear(); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
    }
  };

  const sortSessions = () => APP.S.sessions.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

  APP.load = async function () {
    db = await openDB();
    const S = APP.S;
    S.sessions = await APP.db.all('sessions');
    S.rounds = await APP.db.all('rounds');
    S.chains = await APP.db.all('chains');
    S.goals = await APP.db.all('goals');
    S.mastery = {};
    (await APP.db.all('mastery')).forEach((m) => { S.mastery[m.id] = m.level; });
    const meta = {};
    (await APP.db.all('meta')).forEach((m) => { meta[m.key] = m.value; });
    S.profile = meta.profile || null;
    S.settings = Object.assign({ theme: 'auto' }, meta.settings || {});
    S.favs = meta.favs || [];
    S.custom = meta.custom || [];
    S.plan = APP.normalizePlan(meta.plan);
    S.aliases = meta.aliases || {};
    sortSessions();
    if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* ignorado */ } }
    return !!db;
  };

  APP.saveMeta = (key, value) => { APP.S[key] = value; return APP.db.put('meta', { key, value }); };
  APP.saveSession = async (s) => { const i = APP.S.sessions.findIndex((x) => x.id === s.id); if (i >= 0) APP.S.sessions[i] = s; else APP.S.sessions.push(s); sortSessions(); await APP.db.put('sessions', s); return s; };
  APP.deleteSession = async (id) => {
    APP.S.sessions = APP.S.sessions.filter((s) => s.id !== id);
    await APP.db.del('sessions', id);
    for (const r of APP.S.rounds.filter((r) => r.sessionId === id)) await APP.deleteRound(r.id);
  };
  APP.saveRound = async (r) => { const i = APP.S.rounds.findIndex((x) => x.id === r.id); if (i >= 0) APP.S.rounds[i] = r; else APP.S.rounds.push(r); await APP.db.put('rounds', r); return r; };
  APP.deleteRound = async (id) => { APP.S.rounds = APP.S.rounds.filter((r) => r.id !== id); await APP.db.del('rounds', id); };
  APP.setMastery = async (id, level) => { APP.S.mastery[id] = level; await APP.db.put('mastery', { id, level }); };
  APP.saveChain = async (c) => { const i = APP.S.chains.findIndex((x) => x.id === c.id); if (i >= 0) APP.S.chains[i] = c; else APP.S.chains.push(c); await APP.db.put('chains', c); };
  APP.deleteChain = async (id) => { APP.S.chains = APP.S.chains.filter((c) => c.id !== id); await APP.db.del('chains', id); };
  APP.saveGoal = async (g) => { const i = APP.S.goals.findIndex((x) => x.id === g.id); if (i >= 0) APP.S.goals[i] = g; else APP.S.goals.push(g); await APP.db.put('goals', g); };
  APP.deleteGoal = async (id) => { APP.S.goals = APP.S.goals.filter((g) => g.id !== id); await APP.db.del('goals', id); };

  // ---------- biblioteca ----------
  // La biblioteca se compone de paquetes JSON (lib-index.json). Añadir técnicas = añadir
  // objetos a un paquete o crear un paquete nuevo y listarlo en index.json; no hay que tocar código.
  const idx = new Map();
  APP.libWarnings = [];
  const fetchJSON = async (u) => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u); return r.json(); };

  function registerNames(t) {
    [t.name, t.es].concat(t.alias || []).forEach((n) => { const k = ST.norm(n); if (k && !idx.has(k)) idx.set(k, t); });
  }
  APP.buildDatalists = () => {
    let holder = document.getElementById('datalists');
    if (!holder) { holder = document.createElement('div'); holder.id = 'datalists'; document.body.appendChild(holder); }
    const dl = (id, items) => '<datalist id="' + id + '">' + items.map((n) => '<option value="' + esc(n) + '"></option>').join('') + '</datalist>';
    holder.innerHTML = dl('dl-tech', APP.S.lib.map((t) => t.name)) + dl('dl-pos', APP.S.lib.filter((t) => t.cat === 'posicion' || t.cat === 'guardia').map((t) => t.name));
  };
  APP.loadLib = async function () {
    const lib = []; const byId = new Map(); idx.clear(); APP.libWarnings = [];
    let packs = ['lib-base.json', 'lib-extra.json', 'lib-fichas.json'];
    try { packs = (await fetchJSON('lib-index.json')).packs || packs; } catch (e) { /* usa la lista por defecto */ }
    for (const f of packs) {
      let pack; try { pack = await fetchJSON(f); } catch (e) { APP.libWarnings.push('No se pudo cargar ' + f); continue; }
      (pack.techniques || []).forEach((t) => {
        if (!t || !t.id || !t.name) return;
        if (byId.has(t.id)) { APP.libWarnings.push('Id repetido ignorado: ' + t.id); return; }
        const clash = [t.name, t.es].concat(t.alias || []).map((n) => idx.get(ST.norm(n))).find(Boolean);
        if (clash) { APP.libWarnings.push(t.name + ' coincide con ' + clash.name + ' (se ignora para no duplicar)'); return; }
        const copy = Object.assign({ alias: [], st: 'borrador' }, t); lib.push(copy); byId.set(copy.id, copy); registerNames(copy);
      });
      (pack.details || []).forEach((d) => { const t = byId.get(d.id); if (t) Object.assign(t, d); else APP.libWarnings.push('Ficha sin técnica: ' + d.id); });
    }
    (APP.S.custom || []).forEach((c) => { if (!byId.has(c.id)) { const copy = Object.assign({}, c, { custom: true, st: 'propia' }); lib.push(copy); byId.set(copy.id, copy); registerNames(copy); } });
    Object.keys(APP.S.aliases || {}).forEach((id) => { const t = byId.get(id); if (!t) return; APP.S.aliases[id].forEach((al) => { const k = ST.norm(al); if (k && !idx.has(k)) { t.alias = (t.alias || []).concat(al); idx.set(k, t); } }); });
    APP.S.lib = lib;
    APP.buildDatalists();
  };
  APP.findTech = (text) => idx.get(ST.norm(text)) || null;
  // Una técnica o posición tiene una identidad principal: los alias se convierten en el nombre canónico.
  APP.canon = (text) => { const t = String(text || '').trim(); if (!t) return { name: '', id: null }; const f = APP.findTech(t); return f ? { name: f.name, id: f.id } : { name: t, id: null }; };
  APP.techsBy = (cat) => APP.S.lib.filter((t) => t.cat === cat);
  APP.techById = (id) => APP.S.lib.find((t) => t.id === id) || null;
  // Añadir técnica propia sin duplicar: si el nombre o un alias ya existe, se rechaza y se indica la técnica existente.
  APP.addCustom = async (t) => {
    const clash = [t.name, t.es].concat(t.alias || []).filter(Boolean).map((n) => APP.findTech(n)).find(Boolean);
    if (clash) return { ok: false, existing: clash };
    const rec = Object.assign({ id: 'custom-' + uid(), alias: [] }, t);
    APP.S.custom = (APP.S.custom || []).concat(rec);
    await APP.saveMeta('custom', APP.S.custom);
    const copy = Object.assign({}, rec, { custom: true, st: 'propia' }); APP.S.lib.push(copy); registerNames(copy); APP.buildDatalists();
    return { ok: true, tech: copy };
  };
  APP.addAlias = async (id, alias) => {
    const t = APP.techById(id); if (!t) return false; const k = ST.norm(alias); if (!k || idx.has(k)) return false;
    t.alias = (t.alias || []).concat(alias.trim()); idx.set(k, t);
    // los alias añadidos a técnicas del paquete se guardan aparte para no perderse
    const extra = Object.assign({}, APP.S.aliases || {}); extra[id] = (extra[id] || []).concat(alias.trim());
    await APP.saveMeta('aliases', extra);
    if (t.custom) { APP.S.custom = (APP.S.custom || []).map((c) => (c.id === id ? Object.assign({}, c, { alias: t.alias }) : c)); await APP.saveMeta('custom', APP.S.custom); }
    APP.buildDatalists(); return true;
  };

  // ---------- interfaz ----------
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  APP.$ = $; APP.$$ = $$;

  let toastTimer = null;
  APP.toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); };

  APP.openSheet = (title, html) => { $('#sheet-title').textContent = title; $('#sheet-body').innerHTML = html; $('#sheet').hidden = false; $('#sheet-body').scrollTop = 0; document.body.style.overflow = 'hidden'; };
  APP.closeSheet = () => { $('#sheet').hidden = true; $('#sheet-body').innerHTML = ''; document.body.style.overflow = ''; };
  APP.sheetOpen = () => !$('#sheet').hidden;
  APP.confirm = (msg) => window.confirm(msg);

  // Componentes de formulario
  APP.chips = (group, options, selected, multi, small) => {
    const sel = [].concat(selected === undefined || selected === null ? [] : selected);
    return '<div class="chips" data-group="' + group + '"' + (multi ? ' data-multi="1"' : '') + '>' +
      options.map((o) => { const v = typeof o === 'object' ? o.v : o; const l = typeof o === 'object' ? o.l : o; return '<button type="button" class="chip' + (small ? ' sm' : '') + (sel.includes(v) ? ' on' : '') + '" data-val="' + esc(v) + '">' + esc(l) + '</button>'; }).join('') + '</div>';
  };
  APP.scale = (group, selected, max) => {
    const n = max || 10; let h = '<div class="scale" data-group="' + group + '" style="grid-template-columns:repeat(' + n + ',1fr)">';
    for (let i = 1; i <= n; i++) h += '<button type="button" data-val="' + i + '"' + (Number(selected) === i ? ' class="on"' : '') + '>' + i + '</button>';
    return h + '</div>';
  };
  APP.sel = (group, root) => { const c = $('[data-group="' + group + '"]', root || $('#sheet-body')); return c ? $$('.on', c).map((b) => b.dataset.val) : []; };
  APP.tagField = (group, values, listId, placeholder) =>
    '<div class="chips" data-tags="' + group + '" style="margin-bottom:8px">' + (values || []).map((v) => tagChip(v)).join('') + '</div>' +
    '<div class="row"><input data-taginput="' + group + '" list="' + listId + '" placeholder="' + esc(placeholder || 'Escribe y pulsa Añadir') + '" autocomplete="off"><button type="button" class="btn secondary small" data-act="tagadd" data-g="' + group + '">Añadir</button></div>';
  const tagChip = (v) => '<button type="button" class="chip on sm" data-act="tagdel" data-val="' + esc(v) + '">' + esc(v) + ' ✕</button>';
  APP.tags = (group, root) => $$('[data-tags="' + group + '"] [data-val]', root || $('#sheet-body')).map((b) => b.dataset.val);
  APP.field = (label, inner) => '<label class="field"><span>' + label + '</span>' + inner + '</label>';
  APP.group = (label, inner) => '<div class="field"><span style="display:block;margin-bottom:6px">' + label + '</span>' + inner + '</div>';
  APP.val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

  // Barras de porcentaje: siempre muestran el número de observaciones.
  APP.bars = (rows, total, cls) => rows.length
    ? rows.map((r) => '<div class="bar ' + (cls || '') + '"><div class="meta"><span>' + esc(r.key || r.label) + '</span><span><b>' + r.pct + '%</b> <span class="pill-n">(' + r.n + ' de ' + total + ')</span></span></div><div class="track"><div class="fill" style="width:' + r.pct + '%"></div></div></div>').join('')
    : '<div class="empty">Sin datos todavía.</div>';
  APP.eff = (e, label) => e.total ? '<div class="bar gold"><div class="meta"><span>' + esc(label) + '</span><span><b>' + e.pct + '%</b> <span class="pill-n">(' + e.success + ' éxitos de ' + e.total + ' intentos)</span></span></div><div class="track"><div class="fill" style="width:' + e.pct + '%"></div></div></div>' : '';
  APP.lowN = (n) => n < 5 ? '<div class="explain">⚠ Pocos datos (n = ' + n + '). Tómalo como una pista, no como una conclusión.</div>' : '';
  APP.miniBars = (rows) => {
    rows = rows.slice(-12); if (!rows.length) return '<div class="empty">Sin datos todavía.</div>';
    const max = Math.max.apply(null, rows.map((r) => r.n)) || 1; const w = 100 / rows.length;
    return '<svg viewBox="0 0 300 120" width="100%" role="img" aria-label="Evolución">' + rows.map((r, i) => {
      const h = Math.round((r.n / max) * 80); const x = i * (300 / rows.length) + 4;
      return '<rect x="' + x + '" y="' + (90 - h) + '" width="' + (300 / rows.length - 8) + '" height="' + h + '" rx="4" fill="var(--green-2)"></rect>' +
        '<text x="' + (x + (300 / rows.length - 8) / 2) + '" y="' + (86 - h) + '" font-size="10" text-anchor="middle" fill="var(--ink)">' + r.n + '</text>' +
        '<text x="' + (x + (300 / rows.length - 8) / 2) + '" y="108" font-size="8" text-anchor="middle" fill="var(--muted)">' + esc(String(r.key).slice(-5)) + '</text>';
    }).join('') + '</svg>';
  };
  APP.insightHTML = (list) => list.map((i) => '<div class="item" style="align-items:flex-start"><div><span class="tag ' + i.type + '">' + ({ dato: 'Dato registrado', patron: 'Patrón observado', hipotesis: 'Hipótesis', recomendacion: 'Recomendación' }[i.type]) + '</span><p style="margin:6px 0 0">' + esc(i.text) + '</p></div></div>').join('');

  // ---------- tema ----------
  APP.applyTheme = () => {
    const t = APP.S.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#141a18' : '#2f5d50';
  };

  // ---------- enrutador ----------
  APP.go = (hash) => { if (location.hash === hash) APP.render(); else location.hash = hash; };
  APP.render = () => {
    const parts = (location.hash || '#/inicio').replace(/^#\//, '').split('/');
    const name = APP.views[parts[0]] ? parts[0] : 'inicio';
    const view = $('#view');
    try { view.innerHTML = APP.views[name](parts[1]); } catch (e) { console.error(e); view.innerHTML = '<div class="card"><h3>Algo ha fallado</h3><p class="muted">' + esc(e.message) + '</p></div>'; }
    $('#screen-title').textContent = (APP.titles[name] || 'BJJ Coach');
    const tab = { inicio: 'inicio', entrenos: 'entrenos', entreno: 'entrenos', juego: 'juego', stats: 'stats' }[name] || 'mas';
    $$('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
    window.scrollTo(0, 0);
  };

  // ---------- eventos globales ----------
  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]'); if (closer) { APP.closeSheet(); return; }
    const chip = e.target.closest('[data-group] > button');
    if (chip) {
      const box = chip.parentElement;
      if (box.dataset.multi) chip.classList.toggle('on');
      else { $$('.on', box).forEach((b) => b.classList.remove('on')); chip.classList.add('on'); }
      if (box.dataset.onchange && APP.actions[box.dataset.onchange]) APP.actions[box.dataset.onchange](chip, box);
      return;
    }
    const el = e.target.closest('[data-act]');
    if (el && APP.actions[el.dataset.act]) { e.preventDefault(); APP.actions[el.dataset.act](el, e); }
  });
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-input]'); if (el && APP.actions[el.dataset.input]) APP.actions[el.dataset.input](el, e); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.taginput) { e.preventDefault(); APP.actions.tagadd({ dataset: { g: e.target.dataset.taginput } }); }
    if (e.key === 'Escape' && APP.sheetOpen()) APP.closeSheet();
  });

  APP.actions.tagadd = (el) => {
    const g = el.dataset.g; const input = $('[data-taginput="' + g + '"]'); if (!input) return;
    const c = APP.canon(input.value); if (!c.name) return;
    const box = $('[data-tags="' + g + '"]');
    if (!$$('[data-val]', box).some((b) => b.dataset.val === c.name)) box.insertAdjacentHTML('beforeend', tagChip(c.name));
    input.value = ''; input.focus();
  };
  APP.actions.tagdel = (el) => el.remove();
  APP.actions.back = () => history.back();
})();
