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

// Favicon ALVA oficial. Reemplaza cualquier favicon previo, también en /admin/.
(() => {
  document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.sizes = '64x64';
  icon.href = '/assets/brand/favicon-alva.png?v=20260916-3';
  document.head.appendChild(icon);

  const shortcut = document.createElement('link');
  shortcut.rel = 'shortcut icon';
  shortcut.href = '/assets/brand/favicon-alva.png?v=20260916-3';
  document.head.appendChild(shortcut);
})();
