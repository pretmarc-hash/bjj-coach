/* Apuntes técnicos, game plan en árbol de decisión y perfil físico con recomendaciones orientativas. */
(function () {
  'use strict';
  const APP = window.APP, ST = APP.ST, S = APP.S;
  const { esc, uid, today, fmtDate, field, group, chips, sel, val } = APP;
  const V = APP.views, A = APP.actions, ui = APP.ui;
  const rk = () => { const y = window.scrollY; APP.render(); window.scrollTo(0, y); };
  Object.assign(APP.titles, { apuntes: 'Apuntes', arbol: 'Game plan', fisico: 'Mi físico' });

  // ================= APUNTES =================
  const SECTIONS = ['Entradas', 'Salidas y escapes', 'Raspados', 'Pases', 'Finalizaciones', 'Defensas', 'Retención', 'Transiciones', 'Conceptos'];
  const canonName = (x) => APP.canon(x).name;
  const same = (a, b) => ST.norm(a) === ST.norm(b);
  const saveNotes = () => APP.saveMeta('notes', S.notes);
  const topics = () => { const m = new Map(); Object.keys(S.noteTopics).forEach((t) => m.set(t, [])); S.notes.forEach((n) => { if (!m.has(n.topic)) m.set(n.topic, []); m.get(n.topic).push(n); }); return m; };
  const sectionsOf = (topic) => { const out = (S.noteTopics[topic] || []).slice(); S.notes.filter((n) => n.topic === topic).forEach((n) => { if (n.section && !out.some((s) => same(s, n.section))) out.push(n.section); }); return out; };
  // Apuntes relacionados con una técnica o posición: por título o por tema.
  APP.notesFor = (name) => { const c = canonName(name); return S.notes.filter((n) => same(n.topic, c) || same(canonName(n.title || ''), c)); };
  const linesOf = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const matchText = (n, q) => [n.title, n.body, n.mistakes, n.section, n.topic, APP.tn(n.topic), APP.tn(n.title || '')].concat(n.keys || []).some((x) => ST.norm(x || '').includes(q));

  function noteCard(n, open) {
    return '<details class="note"' + (open ? ' open' : '') + '><summary><span class="nt">' + esc(APP.tn(n.title) || 'Sin título') + '</span><span class="pill-n">' + (n.keys || []).length + ' detalles' + (n.mode && n.mode !== 'both' ? ' · ' + (n.mode === 'gi' ? 'GI' : 'NO-GI') : '') + '</span></summary>' +
      ((n.keys || []).length ? '<p class="small muted" style="margin:10px 0 4px">Detalles clave</p><ul class="keys">' + n.keys.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' : '') +
      (n.body ? '<p class="small muted" style="margin:10px 0 4px">Explicación</p><p style="white-space:pre-wrap">' + esc(n.body) + '</p>' : '') +
      (n.mistakes ? '<p class="small muted" style="margin:10px 0 4px">Errores a evitar</p><p style="white-space:pre-wrap">' + esc(n.mistakes) + '</p>' : '') +
      (n.link && /^https?:\/\//.test(n.link) ? '<p class="small"><a href="' + esc(n.link) + '" target="_blank" rel="noopener">Ver vídeo o enlace</a></p>' : '') +
      '<div class="row between" style="margin-top:8px"><span class="pill-n">Actualizado ' + fmtDate(n.updated || n.created) + '</span><div class="row"><button class="btn small secondary" data-act="noteEdit" data-id="' + n.id + '">Editar</button><button class="btn small ghost" data-act="noteDel" data-id="' + n.id + '">Borrar</button></div></div></details>';
  }

  ui.notes = { q: '' };
  function notesIndex() {
    const q = ST.norm(ui.notes.q); const tp = topics();
    if (q) {
      const canonQ = APP.findTech(ui.notes.q); // «media guardia» encuentra el tema «Half Guard»
      const tHits = Array.from(tp.keys()).filter((t) => ST.norm(t).includes(q) || ST.norm(APP.tn(t)).includes(q) || (canonQ && same(t, canonQ.name)));
      const nHits = S.notes.filter((n) => matchText(n, q) || (canonQ && same(canonName(n.title || ''), canonQ.name)));
      return (tHits.length ? '<p class="small muted">Temas</p><div class="tiles">' + tHits.map((t) => topicTile(t, tp.get(t))).join('') + '</div>' : '') +
        (nHits.length ? '<p class="small muted" style="margin-top:12px">Apuntes (' + nHits.length + ')</p>' + nHits.map((n) => '<div class="pill-n" style="margin-top:8px">' + esc(APP.tn(n.topic)) + ' › ' + esc(n.section || 'Sin apartado') + '</div>' + noteCard(n)).join('') : '') +
        (!tHits.length && !nHits.length ? '<div class="empty">Nada coincide con «' + esc(ui.notes.q) + '».<br><button class="btn small" style="margin-top:10px" data-act="noteNew" data-topic="' + esc(canonQ ? canonQ.name : ui.notes.q) + '">Crear apunte sobre esto</button></div>' : '');
    }
    const list = Array.from(tp.keys()).sort((a, b) => APP.tn(a).localeCompare(APP.tn(b)));
    return list.length ? '<div class="tiles">' + list.map((t) => topicTile(t, tp.get(t))).join('') + '</div>' : '<div class="empty">Aún no tienes apuntes.<br>Crea un tema (por ejemplo «Media guardia») y dentro añade apartados como salidas, raspados o finalizaciones.</div>';
  }
  function topicTile(t, notes) {
    const secs = sectionsOf(t).length;
    return '<a class="tile" href="#/apuntes/' + encodeURIComponent(t) + '"><b>' + esc(APP.tn(t)) + '</b><span class="pill-n">' + notes.length + (notes.length === 1 ? ' apunte' : ' apuntes') + ' · ' + secs + (secs === 1 ? ' apartado' : ' apartados') + '</span></a>';
  }
  V.apuntes = (arg) => {
    if (arg) return topicPage(decodeURIComponent(arg));
    return '<div class="card"><input type="search" placeholder="Buscar: media guardia, kimura, agarre…" value="' + esc(ui.notes.q) + '" data-input="noteSearch" style="margin-bottom:10px"><div class="row"><button class="btn block" data-act="noteNew">+ Nuevo apunte</button><button class="btn secondary block" data-act="topicNew">+ Nuevo tema</button></div></div>' +
      '<div id="notes-list">' + notesIndex() + '</div>';
  };
  A.noteSearch = (el) => { ui.notes.q = el.value; const l = APP.$('#notes-list'); if (l) l.innerHTML = notesIndex(); };

  function topicPage(topic) {
    const secs = sectionsOf(topic); const notes = S.notes.filter((n) => n.topic === topic); const t = APP.findTech(topic);
    let h = '<div class="row between" style="margin-bottom:10px"><a class="btn small ghost" style="text-decoration:none" href="#/apuntes">← Temas</a>' + (notes.length ? '<button class="btn small secondary" data-act="noteReview" data-topic="' + esc(topic) + '">▶ Repasar</button>' : '') + '</div>' +
      '<div class="card hero"><h2>' + esc(APP.tn(topic)) + '</h2><div class="muted">' + notes.length + (notes.length === 1 ? ' apunte' : ' apuntes') + (t ? ' · <a href="#" style="color:#fff" data-act="tech" data-id="' + t.id + '">ver ficha</a>' : '') + '</div></div>';
    secs.forEach((s) => {
      const ns = notes.filter((n) => same(n.section || '', s));
      h += '<div class="card"><div class="row between"><h3>' + esc(s) + ' <span class="pill-n">(' + ns.length + ')</span></h3><button class="btn small ghost" data-act="noteNew" data-topic="' + esc(topic) + '" data-section="' + esc(s) + '">+ Apunte</button></div>' + (ns.length ? ns.map((n) => noteCard(n)).join('') : '<p class="muted small">Vacío. Añade aquí lo que trabajes de este apartado.</p>') + '</div>';
    });
    const loose = notes.filter((n) => !n.section);
    if (loose.length) h += '<div class="card"><h3>Sin apartado</h3>' + loose.map((n) => noteCard(n)).join('') + '</div>';
    h += '<div class="stack"><button class="btn secondary block" data-act="sectionNew" data-topic="' + esc(topic) + '">+ Añadir apartado</button><button class="btn ghost block" data-act="topicDel" data-topic="' + esc(topic) + '">Borrar tema</button></div>';
    return h;
  }

  A.topicNew = () => APP.openSheet('Nuevo tema', field('Posición o tema', '<input id="tp-name" list="dl-pos" autocomplete="off" placeholder="Ej.: Media guardia">') + group('Apartados (puedes añadir más después)', chips('tpsecs', SECTIONS, ['Salidas y escapes', 'Raspados', 'Finalizaciones'], true, true)) + field('Otro apartado', '<input id="tp-extra" placeholder="Opcional">') + '<button class="btn block" data-act="topicSave">Crear tema</button>');
  A.topicSave = async () => {
    const name = canonName(val('tp-name')); if (!name) return APP.toast('Escribe el nombre del tema');
    const secs = sel('tpsecs'); const extra = val('tp-extra').trim(); if (extra && !secs.some((s) => same(s, extra))) secs.push(extra);
    const cur = S.noteTopics[name] || []; secs.forEach((s) => { if (!cur.some((c) => same(c, s))) cur.push(s); });
    S.noteTopics[name] = cur; await APP.saveMeta('noteTopics', S.noteTopics); APP.closeSheet(); APP.go('#/apuntes/' + encodeURIComponent(name));
  };
  A.sectionNew = (el) => APP.openSheet('Nuevo apartado', group('Elige uno', chips('secpick', SECTIONS.filter((s) => !sectionsOf(el.dataset.topic).some((c) => same(c, s))), null, false, true)) + field('O escribe el tuyo', '<input id="sec-name" placeholder="Ej.: Contra rival más pesado">') + '<button class="btn block" data-act="sectionSave" data-topic="' + esc(el.dataset.topic) + '">Añadir</button>');
  A.sectionSave = async (el) => {
    const topic = el.dataset.topic; const name = val('sec-name').trim() || sel('secpick')[0]; if (!name) return APP.toast('Elige o escribe un apartado');
    const cur = sectionsOf(topic); if (!cur.some((c) => same(c, name))) cur.push(name);
    S.noteTopics[topic] = cur; await APP.saveMeta('noteTopics', S.noteTopics); APP.closeSheet(); rk();
  };
  A.topicDel = async (el) => {
    const topic = el.dataset.topic; const n = S.notes.filter((x) => x.topic === topic).length;
    if (!APP.confirm('¿Borrar el tema «' + APP.tn(topic) + '»' + (n ? ' y sus ' + n + ' apuntes' : '') + '? No se puede deshacer.')) return;
    S.notes = S.notes.filter((x) => x.topic !== topic); delete S.noteTopics[topic]; await saveNotes(); await APP.saveMeta('noteTopics', S.noteTopics); APP.go('#/apuntes');
  };

  function noteForm(n, preset) {
    n = n || {}; preset = preset || {}; const topic = n.topic || preset.topic || ''; const secs = topic ? sectionsOf(topic) : [];
    const opts = Array.from(new Set(secs.concat(SECTIONS)));
    APP.openSheet(n.id ? 'Editar apunte' : 'Nuevo apunte',
      field('Tema (posición)', '<input id="nt-topic" list="dl-pos" autocomplete="off" placeholder="Ej.: Media guardia" value="' + esc(topic ? APP.tn(topic) : '') + '">') +
      group('Apartado', chips('ntsec', opts, n.section || preset.section || null, false, true)) + field('Otro apartado', '<input id="nt-sec2" placeholder="Opcional: escribe uno nuevo">') +
      field('Técnica', '<input id="nt-title" list="dl-tech" autocomplete="off" placeholder="Ej.: Raspado old school" value="' + esc(n.title ? APP.tn(n.title) : (preset.title ? APP.tn(preset.title) : '')) + '">') +
      field('Detalles clave (uno por línea)', '<textarea id="nt-keys" rows="5" placeholder="Agarre por debajo, cabeza pegada a la cadera&#10;Bloquear la rodilla antes de subir">' + esc((n.keys || []).join('\n')) + '</textarea>') +
      field('Explicación paso a paso', '<textarea id="nt-body" rows="5" placeholder="Opcional">' + esc(n.body || '') + '</textarea>') +
      field('Errores a evitar', '<textarea id="nt-mis" placeholder="Opcional">' + esc(n.mistakes || '') + '</textarea>') +
      group('Modalidad', chips('ntmode', [{ v: 'both', l: 'Ambas' }, { v: 'gi', l: 'GI' }, { v: 'nogi', l: 'NO-GI' }], n.mode || 'both', false, true)) +
      field('Enlace a un vídeo', '<input id="nt-link" type="url" inputmode="url" placeholder="Opcional: https://…" value="' + esc(n.link || '') + '">') +
      '<button class="btn block" data-act="noteSave" data-id="' + (n.id || '') + '">Guardar apunte</button>');
  }
  APP.noteForm = noteForm;
  A.noteNew = (el) => noteForm(null, el && el.dataset ? { topic: el.dataset.topic, section: el.dataset.section, title: el.dataset.title } : {});
  A.noteEdit = (el) => noteForm(S.notes.find((n) => n.id === el.dataset.id));
  A.noteSave = async (el) => {
    const title = canonName(val('nt-title')); const topic = canonName(val('nt-topic')) || title;
    if (!topic) return APP.toast('Indica al menos el tema o la técnica');
    const section = val('nt-sec2').trim() || sel('ntsec')[0] || '';
    const old = S.notes.find((n) => n.id === el.dataset.id);
    const n = Object.assign({}, old, { id: old ? old.id : uid(), topic, section, title: title || topic, keys: linesOf(val('nt-keys')), body: val('nt-body').trim(), mistakes: val('nt-mis').trim(), mode: sel('ntmode')[0] || 'both', link: val('nt-link').trim(), created: old ? old.created : today(), updated: today() });
    if (old) S.notes[S.notes.indexOf(old)] = n; else S.notes.push(n);
    if (section) { const cur = S.noteTopics[topic] || []; if (!cur.some((c) => same(c, section))) { cur.push(section); S.noteTopics[topic] = cur; await APP.saveMeta('noteTopics', S.noteTopics); } }
    await saveNotes(); APP.closeSheet(); APP.toast('Apunte guardado');
    if (/^#\/(apuntes)/.test(location.hash)) rk(); else APP.go('#/apuntes/' + encodeURIComponent(topic));
  };
  A.noteDel = async (el) => { if (!APP.confirm('¿Borrar este apunte?')) return; S.notes = S.notes.filter((n) => n.id !== el.dataset.id); await saveNotes(); if (APP.sheetOpen()) APP.closeSheet(); rk(); };

  // Repaso tipo tarjeta: primero el nombre, después los detalles.
  A.noteReview = (el) => { ui.review = { list: S.notes.filter((n) => n.topic === el.dataset.topic), i: 0, shown: false }; reviewShow(); };
  function reviewShow() {
    const r = ui.review; const n = r.list[r.i]; if (!n) return APP.closeSheet();
    APP.openSheet('Repaso ' + (r.i + 1) + ' de ' + r.list.length, '<div class="card" style="text-align:center"><div class="pill-n">' + esc(n.section || '') + '</div><h2 style="margin:8px 0">' + esc(APP.tn(n.title)) + '</h2>' + (r.shown ? '' : '<p class="muted">Intenta recordar los detalles clave antes de verlos.</p>') + '</div>' +
      (r.shown ? ((n.keys || []).length ? '<ul class="keys">' + n.keys.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' : '') + (n.body ? '<p style="white-space:pre-wrap">' + esc(n.body) + '</p>' : '') + (n.mistakes ? '<p class="small muted">Errores a evitar</p><p style="white-space:pre-wrap">' + esc(n.mistakes) + '</p>' : '') : '') +
      '<div class="row" style="margin-top:12px">' + (r.shown ? '<button class="btn block" data-act="reviewNext">' + (r.i + 1 < r.list.length ? 'Siguiente' : 'Terminar') + '</button>' : '<button class="btn block" data-act="reviewReveal">Mostrar detalles</button>') + '</div>');
  }
  A.reviewReveal = () => { ui.review.shown = true; reviewShow(); };
  A.reviewNext = () => { ui.review.i++; ui.review.shown = false; reviewShow(); };

  // Lista de apuntes de una técnica (desde la ficha o desde el árbol).
  A.notesOf = (el) => {
    const name = el.dataset.name; const list = APP.notesFor(name);
    APP.openSheet('Apuntes: ' + APP.tn(name), (list.length ? list.map((n) => '<div class="pill-n" style="margin-top:8px">' + esc(APP.tn(n.topic)) + (n.section ? ' › ' + esc(n.section) : '') + '</div>' + noteCard(n, list.length === 1)).join('') : '<div class="empty">Todavía no tienes apuntes de «' + esc(APP.tn(name)) + '».</div>') +
      '<button class="btn block" style="margin-top:12px" data-act="noteNew" data-title="' + esc(name) + '"' + (APP.findTech(name) && /posicion|guardia/.test(APP.findTech(name).cat) ? ' data-topic="' + esc(name) + '"' : '') + '>+ Crear apunte</button>');
  };

  // ================= GAME PLAN: ÁRBOL DE DECISIÓN =================
  const nodes = () => S.tree.nodes;
  const kids = (id) => nodes().filter((n) => (n.parent || null) === (id || null));
  const saveTree = () => APP.saveMeta('tree', S.tree);
  const descendants = (id) => { const out = []; const walk = (p) => kids(p).forEach((k) => { out.push(k.id); walk(k.id); }); walk(id); return out; };
  function nodeHTML(n) {
    const ch = kids(n.id); const t = APP.findTech(n.label); const nn = APP.notesFor(n.label).length; const lv = t ? S.mastery[t.id] : 0;
    return '<li>' + (n.cond ? '<div class="cond">' + esc(n.cond) + '</div>' : '') + '<div class="tnode' + (t ? ' c-' + t.cat : '') + '">' +
      (ch.length ? '<button class="tog" data-act="nodeToggle" data-id="' + n.id + '" aria-label="Plegar o desplegar">' + (n.collapsed ? '▸' : '▾') + '</button>' : '<span class="tog"></span>') +
      '<button class="lbl" data-act="node" data-id="' + n.id + '"><b>' + esc(APP.tn(n.label)) + '</b><span class="pill-n">' + (t ? APP.CATS[t.cat] : 'Propio') + (lv ? ' · nivel ' + lv + '/5' : '') + (nn ? ' · 📝 ' + nn : '') + (n.collapsed && ch.length ? ' · ' + descendants(n.id).length + ' ramas' : '') + '</span></button>' +
      '<button class="add" data-act="nodeAdd" data-parent="' + n.id + '" aria-label="Añadir rama">+</button></div>' +
      (ch.length && !n.collapsed ? '<ul>' + ch.map(nodeHTML).join('') + '</ul>' : '') + '</li>';
  }
  APP.treeHTML = () => {
    const roots = kids(null);
    return (roots.length ? '<ul class="tree">' + roots.map(nodeHTML).join('') + '</ul>' : '<div class="empty">Tu game plan está vacío.<br>Empieza por una situación de partida (por ejemplo «De pie» o «Guardia cerrada») y ve añadiendo ramas: «si el rival hace esto → hago esto».</div>') +
      '<div class="row wrap" style="margin-top:12px"><button class="btn small" data-act="nodeAdd" data-parent="">+ Punto de partida</button>' + (S.chains.length && !S.tree.imported ? '<button class="btn small secondary" data-act="treeImport">Importar mis cadenas (' + S.chains.length + ')</button>' : '') + '</div>';
  };
  V.arbol = () => '<div class="card"><div class="explain">Toca una técnica para ver tus apuntes y sus opciones. Usa <b>+</b> para añadir lo que haces después o la reacción del rival. Puedes mover, editar y plegar cada rama.</div>' + APP.treeHTML() + '</div>';

  A.nodeToggle = async (el) => { const n = nodes().find((x) => x.id === el.dataset.id); if (n) { n.collapsed = !n.collapsed; await saveTree(); rk(); } };
  function nodeForm(n, parent) {
    n = n || {}; const p = nodes().find((x) => x.id === parent);
    APP.openSheet(n.id ? 'Editar' : (p ? 'Nueva rama desde ' + APP.tn(p.label) : 'Nuevo punto de partida'),
      (p || n.parent ? field('¿Cuándo? Reacción del rival o situación', '<input id="nd-cond" placeholder="Ej.: si posturea / si baja la cabeza" value="' + esc(n.cond || '') + '">') : '') +
      field('Técnica o posición', '<input id="nd-label" list="dl-tech" autocomplete="off" placeholder="Ej.: Triángulo" value="' + esc(n.label ? APP.tn(n.label) : '') + '">') +
      '<button class="btn block" data-act="nodeSave" data-id="' + (n.id || '') + '" data-parent="' + (parent || '') + '">Guardar</button>');
  }
  A.nodeAdd = (el) => nodeForm(null, el.dataset.parent || '');
  A.nodeSave = async (el) => {
    const label = canonName(val('nd-label')); if (!label) return APP.toast('Escribe la técnica o posición');
    const cond = APP.$('#nd-cond') ? val('nd-cond').trim() : '';
    const old = nodes().find((x) => x.id === el.dataset.id);
    if (old) Object.assign(old, { label, cond }); else { nodes().push({ id: uid(), parent: el.dataset.parent || null, label, cond }); const p = nodes().find((x) => x.id === el.dataset.parent); if (p) p.collapsed = false; }
    await saveTree(); APP.closeSheet(); rk();
  };
  A.node = (el) => {
    const n = nodes().find((x) => x.id === el.dataset.id); if (!n) return; const t = APP.findTech(n.label); const list = APP.notesFor(n.label);
    const sib = kids(n.parent); const i = sib.indexOf(n); const ban = new Set(descendants(n.id).concat(n.id));
    const targets = nodes().filter((x) => !ban.has(x.id) && x.id !== n.parent);
    APP.openSheet(APP.tn(n.label), (n.cond ? '<div class="explain">' + esc(n.cond) + '</div>' : '') +
      '<h3 style="margin-bottom:6px">Mis apuntes</h3>' + (list.length ? list.map((x) => noteCard(x, list.length === 1)).join('') : '<p class="muted small">Todavía no tienes apuntes de esta técnica.</p>') +
      '<div class="stack" style="margin-top:12px"><button class="btn block" data-act="noteNew" data-title="' + esc(n.label) + '"' + (t && /posicion|guardia/.test(t.cat) ? ' data-topic="' + esc(n.label) + '"' : '') + '>+ Crear apunte</button>' +
      (t ? '<button class="btn secondary block" data-act="tech" data-id="' + t.id + '">Ver ficha de la técnica</button>' : '') +
      '<button class="btn secondary block" data-act="nodeAdd" data-parent="' + n.id + '">+ Añadir rama (qué hago después)</button>' +
      '<div class="row"><button class="btn ghost block" data-act="nodeEdit" data-id="' + n.id + '">Editar</button><button class="btn ghost block" data-act="nodeMove" data-id="' + n.id + '" data-d="-1"' + (i <= 0 ? ' disabled' : '') + '>↑ Subir</button><button class="btn ghost block" data-act="nodeMove" data-id="' + n.id + '" data-d="1"' + (i >= sib.length - 1 ? ' disabled' : '') + '>↓ Bajar</button></div>' +
      (targets.length || n.parent ? field('Mover a otra rama', '<select id="nd-target" data-input="nodeReparent" data-id="' + n.id + '"><option value="-">Elegir destino…</option>' + (n.parent ? '<option value="">(Punto de partida)</option>' : '') + targets.map((x) => '<option value="' + x.id + '">' + esc(APP.tn(x.label)) + '</option>').join('') + '</select>') : '') +
      '<button class="btn danger block" data-act="nodeDel" data-id="' + n.id + '">Borrar' + (descendants(n.id).length ? ' (con sus ' + descendants(n.id).length + ' ramas)' : '') + '</button></div>');
  };
  A.nodeEdit = (el) => { const n = nodes().find((x) => x.id === el.dataset.id); nodeForm(n, n.parent || ''); };
  A.nodeMove = async (el) => {
    const n = nodes().find((x) => x.id === el.dataset.id); const sib = kids(n.parent); const j = sib.indexOf(n) + Number(el.dataset.d); if (j < 0 || j >= sib.length) return;
    const all = nodes(); const a = all.indexOf(n), b = all.indexOf(sib[j]); all[a] = sib[j]; all[b] = n; await saveTree(); rk(); A.node({ dataset: { id: n.id } });
  };
  A.nodeReparent = async (el) => { if (el.value === '-') return; const n = nodes().find((x) => x.id === el.dataset.id); n.parent = el.value || null; if (!n.parent) n.cond = ''; await saveTree(); APP.closeSheet(); rk(); APP.toast('Rama movida'); };
  A.nodeDel = async (el) => { const ids = new Set(descendants(el.dataset.id).concat(el.dataset.id)); if (ids.size > 1 && !APP.confirm('¿Borrar esta técnica y sus ' + (ids.size - 1) + ' ramas?')) return; S.tree.nodes = nodes().filter((n) => !ids.has(n.id)); await saveTree(); APP.closeSheet(); rk(); };
  A.treeImport = async () => {
    S.chains.forEach((c) => { let parent = null; c.steps.forEach((s) => { const label = canonName(s); let ex = kids(parent).find((k) => same(k.label, label)); if (!ex) { ex = { id: uid(), parent, label, cond: '' }; nodes().push(ex); } parent = ex.id; }); });
    S.tree.imported = true; await saveTree(); rk(); APP.toast('Cadenas convertidas en ramas');
  };

  // ================= MI FÍSICO =================
  const Q = [
    ['legs', 'Piernas (respecto a tu altura)', [['cortas', 'Cortas'], ['medias', 'Medias'], ['largas', 'Largas']]],
    ['arms', 'Brazos', [['cortos', 'Cortos'], ['medios', 'Medios'], ['largos', 'Largos']]],
    ['build', 'Complexión', [['delgada', 'Delgada'], ['media', 'Media'], ['robusta', 'Robusta']]],
    ['rel', 'Frente a tus compañeros de entreno sueles ser', [['ligero', 'Más ligero'], ['similar', 'Similar'], ['pesado', 'Más pesado']]],
    ['flex', 'Flexibilidad', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']]],
    ['strength', 'Fuerza', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']]],
    ['explosive', 'Explosividad', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']]],
    ['cardio', 'Resistencia', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta']]]
  ];
  const INJ = [['rodillas', 'Rodillas'], ['cuello', 'Cuello'], ['hombros', 'Hombros'], ['lumbar', 'Zona lumbar'], ['dedos', 'Dedos / manos']];
  A.bodyForm = () => {
    const b = S.body || {};
    APP.openSheet('Mi físico', '<div class="explain">Con estas respuestas te sugiero técnicas que suelen encajar con tu cuerpo. Es solo una orientación: no sustituye a tu profesor ni decide tu juego.</div>' +
      '<div class="grid2">' + field('Altura (cm)', '<input type="number" id="bd-h" inputmode="numeric" min="120" max="230" value="' + esc(b.height || '') + '">') + field('Peso (kg)', '<input type="number" id="bd-w" inputmode="decimal" min="30" max="250" step="0.1" value="' + esc(b.weight || '') + '">') + '</div>' +
      field('Edad', '<input type="number" id="bd-age" inputmode="numeric" min="10" max="90" value="' + esc(b.age || '') + '">') +
      Q.map((q) => group(q[1], chips('bd-' + q[0], q[2].map((o) => ({ v: o[0], l: o[1] })), b[q[0]] || null, false, true))).join('') +
      group('Molestias o lesiones a tener en cuenta', chips('bd-inj', INJ.map((o) => ({ v: o[0], l: o[1] })), b.injuries || [], true, true)) +
      '<button class="btn block" data-act="bodySave">Guardar y ver recomendaciones</button>');
  };
  A.bodySave = async () => {
    const b = Object.assign({}, S.body, { height: Number(val('bd-h')) || '', weight: Number(String(val('bd-w')).replace(',', '.')) || '', age: Number(val('bd-age')) || '', injuries: sel('bd-inj'), updated: today() });
    Q.forEach((q) => { b[q[0]] = sel('bd-' + q[0])[0] || ''; });
    await APP.saveMeta('body', b); APP.closeSheet(); APP.go('#/fisico');
  };
  // Reglas orientativas (heurísticas habituales de entrenadores, no evidencia científica).
  function bodyRecs(b) {
    const R = []; const add = (text, why, techs, warn) => R.push({ text, why, techs: techs.filter((x) => APP.findTech(x)), warn: !!warn });
    if (b.legs === 'largas') add('Aprovecha tus piernas largas para controlar la distancia y cerrar triángulos.', 'Piernas largas', ['Triangle', 'De La Riva', 'Spider Guard', 'Lasso Guard', 'Closed Guard', 'Body Triangle']);
    if (b.legs === 'cortas') add('Con piernas cortas suele funcionar mejor el juego cercano, con ganchos y bloqueos por dentro.', 'Piernas cortas', ['Butterfly Guard', 'Half Guard', 'Deep Half Guard', 'Butterfly Sweep', 'Single Leg X']);
    if (b.arms === 'largos') add('Los brazos largos facilitan las estrangulaciones que rodean cabeza y brazo.', 'Brazos largos', ["D'Arce", 'Anaconda', 'Arm Triangle', 'Rear Naked Choke', 'Guillotine']);
    if (b.arms === 'cortos') add('Con brazos cortos suelen ser más fiables los agarres cercanos y compactos.', 'Brazos cortos', ['Kimura', 'Americana', 'Guillotine', 'Underhook', 'Body Lock Pass']);
    if (b.build === 'robusta' || b.rel === 'pesado') add('Tu peso es una ventaja arriba: presión y control antes que velocidad.', b.rel === 'pesado' ? 'Sueles ser más pesado que tus compañeros' : 'Complexión robusta', ['Over-Under', 'Smash Pass', 'Side Control', 'Mount', 'Knee on Belly', 'Arm Triangle', 'Half Guard']);
    if (b.build === 'delgada' || b.rel === 'ligero') add('Siendo más ligero, compensa moverte, crear ángulos y buscar la espalda en lugar de aguantar peso debajo.', b.rel === 'ligero' ? 'Sueles ser más ligero que tus compañeros' : 'Complexión delgada', ['Back Take', 'Arm Drag', 'De La Riva', 'Single Leg X', 'X-Guard', 'Guard Retention', 'Berimbolo']);
    if (b.flex === 'alta') add('Tu flexibilidad te abre guardias y recuperaciones que otros no pueden usar.', 'Flexibilidad alta', ['Rubber Guard', 'Inversions', 'Gogoplata', 'Omoplata', 'Triangle', 'Guard Retention']);
    if (b.flex === 'baja') add('Con poca flexibilidad, elige guardias que no dependan de invertir ni de subir mucho las piernas.', 'Flexibilidad baja', ['Half Guard', 'Knee Shield', 'Butterfly Guard', 'Closed Guard', 'Toreando', 'Knee Cut']);
    if (b.strength === 'alta') add('Tu fuerza encaja con agarres dominantes y lucha de pie.', 'Fuerza alta', ['Body Lock Pass', 'Single Leg', 'Double Leg', 'Kimura', 'Guillotine', 'Front Headlock']);
    if (b.strength === 'baja') add('Con menos fuerza, prioriza palanca, marcos y tiempo antes que el forcejeo.', 'Fuerza baja', ['Frames', 'Hip Escape', 'Scissor Sweep', 'Armbar', 'Triangle', 'Guard Retention']);
    if (b.explosive === 'alta') add('La explosividad encaja con entradas rápidas y cambios de dirección.', 'Explosividad alta', ['Double Leg', 'Toreando', 'Long Step', 'Arm Drag', 'Wrestle Up', 'Guillotine']);
    if (b.explosive === 'baja') add('Sin mucha explosividad, un juego metódico y de presión te dará más resultados.', 'Explosividad baja', ['Half Guard', 'Over-Under', 'Smash Pass', 'Closed Guard', 'Cross Collar Choke']);
    if (b.cardio === 'alta') add('Con buena resistencia puedes imponer ritmo y encadenar ataques hasta que el rival falle.', 'Resistencia alta', ['Toreando', 'Leg Drag', 'Wrestle Up', 'Guard Recovery']);
    if (b.cardio === 'baja') add('Con poca resistencia, busca posiciones estables y gasta energía solo en los momentos clave.', 'Resistencia baja', ['Closed Guard', 'Half Guard', 'Side Control', 'Mount', 'Knee Shield']);
    if (b.age >= 40) add('A partir de cierta edad compensa un juego de menor impacto y más control.', 'Edad: ' + b.age + ' años', ['Half Guard', 'Closed Guard', 'Knee Shield', 'Over-Under', 'Side Control']);
    const inj = b.injuries || [];
    if (inj.includes('rodillas')) add('Cuida las rodillas: evita forzar posiciones que las retuercen y ten especial cuidado con los ataques de pierna.', 'Molestias en las rodillas', ['Heel Hook', 'Lockdown', 'De La Riva', 'Rubber Guard'], true);
    if (inj.includes('cuello')) add('Cuida el cuello: evita invertir, que te apilen y aguantar estrangulaciones más de la cuenta.', 'Molestias en el cuello', ['Inversions', 'Berimbolo', 'Stack Pass', 'Granby Roll'], true);
    if (inj.includes('hombros')) add('Cuida los hombros: rinde pronto en llaves de hombro y evita apoyar todo el peso en un brazo.', 'Molestias en los hombros', ['Kimura', 'Americana', 'Omoplata'], true);
    if (inj.includes('lumbar')) add('Cuida la zona lumbar: evita invertir y que te apilen con las piernas sobre la cabeza.', 'Molestias lumbares', ['Inversions', 'Berimbolo', 'Stack Pass'], true);
    if (inj.includes('dedos')) add('Cuida los dedos: reduce los agarres de manga y solapa muy prolongados.', 'Molestias en dedos o manos', ['Spider Guard', 'Lasso Guard', 'Collar Sleeve'], true);
    return R;
  }
  APP.bodyRecs = bodyRecs;
  V.fisico = () => {
    const b = S.body;
    if (!b) return '<div class="card hero"><h2>Mi físico</h2><p class="muted">Responde a unas preguntas rápidas sobre tu cuerpo y te sugiero técnicas que suelen adaptarse a él.</p><button class="btn secondary" data-act="bodyForm">Empezar</button></div>';
    const R = bodyRecs(b); const lab = (k) => { const q = Q.find((x) => x[0] === k); const o = q && q[2].find((x) => x[0] === b[k]); return o ? o[1] : ''; };
    const facts = [b.height ? b.height + ' cm' : '', b.weight ? b.weight + ' kg' : '', b.age ? b.age + ' años' : ''].concat(Q.map((q) => (b[q[0]] ? q[1].split(' (')[0].replace('Frente a tus compañeros de entreno sueles ser', 'Frente a compañeros') + ': ' + lab(q[0]).toLowerCase() : ''))).filter(Boolean);
    const chipList = (r) => r.techs.length ? '<div class="chips" style="margin-top:8px">' + r.techs.map((x) => { const t = APP.findTech(x); return '<button class="chip sm" data-act="tech" data-id="' + t.id + '">' + esc(APP.tn(t.name)) + '</button>'; }).join('') + '</div>' : '';
    const good = R.filter((r) => !r.warn), warn = R.filter((r) => r.warn);
    return '<div class="card"><div class="row between"><h3>Mis características</h3><button class="btn small secondary" data-act="bodyForm">Editar</button></div><div class="chips">' + facts.map((f) => '<span class="tag">' + esc(f) + '</span>').join('') + '</div></div>' +
      '<div class="explain"><b>Solo son recomendaciones orientativas.</b> Se basan en criterios generales que suelen usar los entrenadores, no en tus resultados ni en estudios científicos. Tu físico no decide tu juego: pruébalas, y quédate con lo que te funcione a ti y con lo que diga tu profesor.</div>' +
      (good.length ? good.map((r) => '<div class="card"><span class="tag recomendacion">Recomendación</span> <span class="pill-n">' + esc(r.why) + '</span><p style="margin:8px 0 0">' + esc(r.text) + '</p>' + chipList(r) + '</div>').join('') : '<div class="card empty">Marca más características para recibir sugerencias.</div>') +
      (warn.length ? '<h3 style="margin:16px 0 8px">Precauciones</h3>' + warn.map((r) => '<div class="card" style="border-color:var(--gold)"><span class="tag patron">Precaución</span> <span class="pill-n">' + esc(r.why) + '</span><p style="margin:8px 0 0">' + esc(r.text) + '</p><p class="small muted" style="margin-top:6px">Técnicas con las que tener más cuidado:</p>' + chipList(r) + '<p class="small muted" style="margin-top:8px">Si la molestia persiste, consulta a un médico o fisioterapeuta.</p></div>').join('') : '');
  };
})();
