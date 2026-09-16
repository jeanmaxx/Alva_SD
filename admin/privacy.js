/* ALVA Admin — privacidad financiera de interfaz */
(() => {
  let attempts=0;
  const timer=setInterval(() => {
    attempts++;
    try {
      if (typeof state==='undefined' || !state.role) {
        if (attempts>80) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      const owner=state.role.slug==='owner';
      const billingNav=document.querySelector('[data-view="billing"]');
      if (billingNav) billingNav.hidden=!owner;
      if (!owner && location.hash==='#billing' && typeof openView==='function') openView('dashboard');
    } catch (_) {
      if (attempts>80) clearInterval(timer);
    }
  },100);
})();
