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

  // Update embedded headers without an additional network request.
  function updateNavigation() {
    document.querySelectorAll('.hce-nav').forEach(nav => {
      const findMenu = name => Array.from(nav.querySelectorAll('details.hce-menu')).find(m => m.querySelector('summary')?.textContent.trim().toLowerCase() === name);
      const consulting = findMenu('consulting'), engineering = findMenu('engineering tools');
      if (!consulting || !engineering) return;
      const group = (menu, name) => {
        const mega = menu.querySelector('.hce-mega');
        if (!mega) return null;
        let g = Array.from(mega.children).find(x => x.querySelector('strong')?.textContent.trim().toLowerCase() === name.toLowerCase());
        if (!g) { g = document.createElement('div'); const h = document.createElement('strong'); h.textContent = name; g.append(h); mega.append(g); }
        return g;
      };
      const move = (href, target, label) => {
        if (!target) return;
        const matches = Array.from(nav.querySelectorAll('a')).filter(a => a.getAttribute('href')?.toLowerCase() === href.toLowerCase());
        let a = matches.find(a => target.contains(a)) || matches.find(a => consulting.contains(a)) || matches[0];
        if (!a) { a = document.createElement('a'); a.textContent = label; }
        a.setAttribute('href', href); target.append(a);
        matches.filter(x => x !== a && (consulting.contains(x) || target.contains(x))).forEach(x => x.remove());
      };
      const resources = group(consulting, 'Project Resources'), deliverables = group(engineering, 'Deliverables');
      move('/Vendors.html', resources, 'Fabricators & vendors'); move('/vendor.html', resources, 'Vendor');
      move('/cngpfd.html', deliverables, 'Process flow diagram tools'); move('/pfd-template.html', deliverables, 'Process flow diagram viewer');
      move('/Training.html', group(consulting, 'Project development'), 'Training');
      consulting.querySelectorAll('a').forEach(a => { if (['modeling','model review','relief','instrumentation','relief review'].includes(a.textContent.trim().toLowerCase())) a.remove(); });
    });
  }
  updateNavigation();
  void Promise.all([loadFragment('header','/header.html','header'),loadFragment('footer','/footer.html','footer')]).then(updateNavigation);
})();
