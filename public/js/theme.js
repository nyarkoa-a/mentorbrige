/**
 * MentorBridge Theme Module
 * Dark/light mode — controlled from Settings page only.
 * Applies stored theme on load with no flash.
 */
const ThemeManager = {
  storageKey: 'mentorbridgeTheme',

  init() {
    const saved = localStorage.getItem(this.storageKey) || 'light';
    const resolved = saved === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : saved;
    this.apply(resolved);
  },

  set(theme) {
    localStorage.setItem(this.storageKey, theme);
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    this.apply(resolved);
  },

  apply(resolvedTheme) {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  },

  get() {
    return localStorage.getItem(this.storageKey) || 'light';
  }
};

// Apply immediately before DOM paints to prevent flash
(function () {
  const saved = localStorage.getItem('mentorbridgeTheme') || 'light';
  const resolved = saved === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : saved;
  document.documentElement.setAttribute('data-theme', resolved);
})();

window.ThemeManager = ThemeManager;
