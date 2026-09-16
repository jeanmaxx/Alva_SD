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
