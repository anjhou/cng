// Static pages already contain their shared shell; fetch only missing fragments.
(() => {
  async function loadFragment(id, url, selector) {
    const el = document.getElementById(id);
    if (!el || el.querySelector(selector)) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      el.innerHTML = await response.text();
    } catch (error) { console.error('Shared fragment:', url, error); }
  }
  const menus = () => Array.from(document.querySelectorAll('.hce-menu'));
  document.addEventListener('toggle', event => {
    if (event.target.matches?.('.hce-menu') && event.target.open) {
      menus().forEach(menu => { if (menu !== event.target) menu.open = false; });
    }
  }, true);
  document.addEventListener('click', event => {
    if (!event.target.closest('.hce-menu')) menus().forEach(menu => menu.open = false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') menus().forEach(menu => {
      if (menu.open) { menu.open = false; menu.querySelector('summary')?.focus(); }
    });
  });
  void Promise.all([loadFragment('header','/header.html','header'),loadFragment('footer','/footer.html','footer')]);
})();
