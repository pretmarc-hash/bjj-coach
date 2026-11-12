/* Arranque de la aplicación. */
(function () {
  'use strict';
  const APP = window.APP;

  async function boot() {
    const persistent = await APP.load();
    await APP.loadLib();
    APP.applyTheme();
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', APP.applyTheme);
    APP.$('#fab').addEventListener('click', APP.actions.fab);
    APP.$('#btn-coach').addEventListener('click', () => APP.go('#/coach'));
    APP.$('#brand').addEventListener('click', () => APP.go('#/inicio'));
    window.addEventListener('hashchange', APP.render);
    if (!location.hash) location.hash = '#/inicio'; else APP.render();
    if (APP.plan) { APP.plan.tick(); setInterval(APP.plan.tick, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) { APP.plan.tick(); if (/#\/inicio|^#?$/.test(location.hash)) APP.render(); } }); }
    if (!persistent) APP.toast('Aviso: no se puede guardar en este navegador (modo privado). Los datos se perderán al cerrar.');
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
})();
