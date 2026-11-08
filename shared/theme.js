// applies the saved theme before first paint so pages don't flash.
// loaded in <head> of both the popup and the settings page
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch (e) {
    // storage blocked, fall back to the system preference
  }
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
  }
})();
