window.ALVA_SUPABASE = {
  url: 'https://lliedfgeegkqeopxvtze.supabase.co',
  publishableKey: 'sb_publishable_dvGaagv6ZhJ2GChDinyfBQ_VISGCW62'
};

(() => {
  if (!location.pathname.includes('/admin/')) return;

  const addCss = (href, id) => {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  addCss('./phase3plus.css?v=20260916-1', 'alva-phase3plus-css');
  addCss('./ttd-integration.css?v=20260916-2', 'alva-ttd-integration-css');

  window.addEventListener('load', () => {
    const loadScript = (src, id) => new Promise(resolve => {
      if (document.getElementById(id)) return resolve();
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });

    loadScript('./phase3plus.js?v=20260916-1', 'alva-phase3plus-js')
      .then(() => loadScript('./ttd-integration.js?v=20260916-2', 'alva-ttd-integration-js'));
  }, { once: true });
})();
