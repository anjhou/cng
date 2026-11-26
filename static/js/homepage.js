(() => {
  const search = document.querySelector('.hce-search');
  if (!search) return;
  const cards = Array.from(document.querySelectorAll('[data-resource]'), el => ({el, text: el.textContent.toLowerCase()}));
  const status = document.querySelector('#search-status');
  let frame = 0;
  function filter() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    for (const {el,text} of cards) { const visible = text.includes(query); el.hidden = !visible; if (visible) count++; }
    if (status) status.textContent = `${count} resources shown`;
  }
  search.addEventListener('input', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(filter); });
  filter();
})();
