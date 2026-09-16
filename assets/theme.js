(() => {
  const storageKey = 'alva-theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply(theme, persist = false) {
    root.dataset.theme = theme;
    if (persist) localStorage.setItem(storageKey, theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const dark = theme === 'dark';
      button.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      button.setAttribute('title', dark ? 'Tema claro' : 'Tema oscuro');
      const icon = button.querySelector('span');
      if (icon) icon.textContent = dark ? '☀' : '☾';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#111316' : '#f7f7f5');
  }

  const saved = localStorage.getItem(storageKey);
  apply(saved || (media.matches ? 'dark' : 'light'));

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  });

  media.addEventListener?.('change', event => {
    if (!localStorage.getItem(storageKey)) apply(event.matches ? 'dark' : 'light');
  });
})();

// Extensiones administrativas cargadas únicamente dentro de /admin/.
(() => {
  if (!location.pathname.includes('/admin')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './phase3plus.css';
  document.head.appendChild(link);

  window.addEventListener('load', () => {
    if (document.querySelector('script[data-alva-ops]')) return;
    const script = document.createElement('script');
    script.src = './phase3plus.js';
    script.dataset.alvaOps = 'true';
    script.onload = () => {
      const privacy = document.createElement('script');
      privacy.src = './privacy.js';
      privacy.dataset.alvaPrivacy = 'true';
      document.body.appendChild(privacy);
    };
    document.body.appendChild(script);
  }, { once:true });
})();

// Favicon oficial ALVA: círculo blanco con transparencia exterior.
(() => {
  const href = 'data:image/png;base64,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...';
  let links = [...document.querySelectorAll('link[rel~="icon"]')];
  if (!links.length) {
    const link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
    links = [link];
  }
  links.forEach(link => { link.type = 'image/png'; link.href = href; });
})();
