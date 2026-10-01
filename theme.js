// Apply the palette before CSS paints, then remember an explicit user choice.
(() => {
  const storageKey = 'obscurium-theme-v1';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch { /* System theme also works with storage disabled. */ }

  function applyTheme() {
    const theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#18151b' : '#f4f1ed';
    const toggle = document.querySelector('#theme-toggle');
    if (toggle) {
      const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = label;
    }
  }

  applyTheme();
  if (systemTheme.addEventListener) systemTheme.addEventListener('change', applyTheme);
  else if (systemTheme.addListener) systemTheme.addListener(applyTheme);
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.querySelector('#theme-toggle').addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey, preference); } catch { /* Keep the current-page selection. */ }
      applyTheme();
    });
  });
})();
