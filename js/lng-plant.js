'use strict';

const unitData = {
  feed: {
    title: 'Feed Gas Reception & Separation',
    desc1: 'Receives pipeline or field gas, removes bulk liquid, slugs, sand, and condensate.',
    desc2: 'Typical equipment: slug catcher, inlet separator, filters, condensate stabilization tie-ins.',
    function: 'Bulk liquid and contaminant separation before gas conditioning.',
    equipment: 'Slug catcher, inlet separator, filter/coalescer, condensate drum'
  },
  acid: {
    title: 'Acid Gas Removal',
    desc1: 'Removes CO₂ and H₂S to meet cryogenic liquefaction and LNG product limits.',
    desc2: 'Typical technology: amine, physical solvent, membrane-assisted polishing where required.',
    function: 'CO₂ / H₂S removal and acid gas routing to sulfur or disposal systems.',
    equipment: 'Absorber, regenerator, amine circulation, acid gas cooler/KO drum'
  },
  dehy: {
    title: 'Gas Dehydration',
    desc1: 'Removes water to very low ppmv levels to prevent hydrate and ice formation.',
    desc2: 'Typical technology: molecular sieve adsorption beds with heating/cooling regeneration.',
    function: 'Water removal to cryogenic specification.',
    equipment: 'Molecular sieve beds, regeneration heater, coolers, regeneration gas separator'
  },
  mru: {
    title: 'Mercury Removal Unit',
    desc1: 'Removes mercury to protect aluminum plate-fin and coil-wound cryogenic exchangers.',
    desc2: 'Typical technology: fixed-bed sulfur-impregnated activated carbon or equivalent adsorbent.',
    function: 'Mercury polishing upstream of cryogenic equipment.',
    equipment: 'Fixed-bed adsorbers, guard bed, sample points'
  },
  ngl: {
    title: 'NGL / Heavy Hydrocarbon Removal',
    desc1: 'Controls C₅+ and sometimes C₃+ to avoid freezing in the main cryogenic exchanger.',
    desc2: 'Typical options: scrub column, demethanizer feed column, or turbo-expander NGL recovery.',
    function: 'Heavy hydrocarbon removal and lean gas routing to liquefaction.',
    equipment: 'Scrub column, expander, demethanizer, reflux condenser, reboiler'
  },
  frac: {
    title: 'NGL Fractionation Train',
    desc1: 'Separates recovered liquids into ethane, propane, butanes, and natural gasoline/condensate.',
    desc2: 'Column lineup depends on product slate and ethane rejection/recovery strategy.',
    function: 'NGL product separation and stabilization.',
    equipment: 'Deethanizer, depropanizer, debutanizer, stabilizer, product coolers'
  },
  liq: {
    title: 'Liquefaction & Refrigeration System',
    desc1: 'Cools treated lean gas to LNG using propane pre-cooling, mixed refrigerant, DMR, or cascade cycles.',
    desc2: 'Includes main cryogenic exchanger, refrigerant compressors, drivers, condensers, and separators.',
    function: 'Cryogenic cooling and LNG production.',
    equipment: 'MCHE, refrigerant compressors, propane/MR circuits, cold box, LNG rundown'
  },
  storage: {
    title: 'LNG Storage & Export',
    desc1: 'Stores LNG in full-containment tanks and transfers LNG to ship loading facilities.',
    desc2: 'Includes LNG rundown, tanks, BOG handling, export pumps, loading arms, and marine systems.',
    function: 'LNG inventory, boil-off gas management, and ship export.',
    equipment: 'LNG tanks, BOG compressors, export pumps, loading arms, jetty'
  },
  util: {
    title: 'Utilities & Offsites',
    desc1: 'Provides support systems required for safe and continuous LNG operation.',
    desc2: 'Includes nitrogen, instrument air, power, cooling, fuel gas, flare, firewater, and wastewater.',
    function: 'Plant support, safety, power, cooling, and offsite logistics.',
    equipment: 'Power generation, N₂ package, IA/PA compressors, cooling system, flare, firewater'
  }
};

const streamData = {
  s1: { title: 'Feed Gas', from: 'Pipeline / field inlet', to: 'Feed gas reception', purpose: 'Raw feed gas enters the LNG plant battery limit.' },
  s2: { title: 'Wet Gas to Acid Gas Removal', from: 'Reception', to: 'AGR', purpose: 'Gas routed for CO₂ and H₂S removal.' },
  s3: { title: 'Sweet Gas to NGL Recovery', from: 'AGR', to: 'NGL removal', purpose: 'Sweetened gas continues to hydrocarbon dewpoint control.' },
  s4: { title: 'Gas to Dehydration', from: 'Reception / AGR path', to: 'Dehydration', purpose: 'Gas dehydration before cryogenic service.' },
  s5: { title: 'Dry Gas to NGL Recovery', from: 'Dehydration', to: 'NGL removal', purpose: 'Dry gas is sent to heavy hydrocarbon removal.' },
  s6: { title: 'Gas to MRU', from: 'Reception / dehydration path', to: 'MRU', purpose: 'Gas receives mercury polishing upstream of cold box.' },
  s7: { title: 'Mercury-Free Gas', from: 'MRU', to: 'NGL removal', purpose: 'Treated gas enters heavy hydrocarbon removal.' },
  s8: { title: 'Lean Gas', from: 'NGL removal', to: 'Liquefaction', purpose: 'Heavy hydrocarbon-controlled gas enters the main cryogenic exchanger.' },
  s9: { title: 'LNG Rundown', from: 'Liquefaction', to: 'LNG storage', purpose: 'Produced LNG is routed to storage tanks.' },
  s10: { title: 'LNG Export', from: 'LNG storage', to: 'Ship loading', purpose: 'LNG is pumped to marine loading arms and LNG carriers.' },
  s11: { title: 'NGL Bottoms', from: 'NGL removal', to: 'Fractionation', purpose: 'Recovered liquids are separated into NGL products.' },
  s12: { title: 'Ethane Product', from: 'Fractionation', to: 'Ethane handling', purpose: 'Ethane product or recycle/rejection service.' },
  s13: { title: 'Propane Product', from: 'Fractionation', to: 'Propane storage/export', purpose: 'Propane product from fractionation.' },
  s14: { title: 'Butanes+ Product', from: 'Fractionation', to: 'Butanes/condensate storage', purpose: 'Butanes and natural gasoline/condensate product.' }
};

function setOverlay(title, desc1, desc2) {
  document.getElementById('selectedTitle').textContent = title;
  document.getElementById('selectedDesc1').textContent = desc1;
  document.getElementById('selectedDesc2').textContent = desc2;
}

function clearActive() {
  document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
}

function populateTables() {
  const unitBody = document.querySelector('#unitSummaryTable tbody');
  const streamBody = document.querySelector('#streamSummaryTable tbody');

  unitBody.innerHTML = Object.values(unitData).map(unit => `
    <tr>
      <td>${unit.title}</td>
      <td>${unit.function}</td>
      <td>${unit.equipment}</td>
    </tr>
  `).join('');

  streamBody.innerHTML = Object.values(streamData).map(stream => `
    <tr>
      <td>${stream.title}</td>
      <td>${stream.from}</td>
      <td>${stream.to}</td>
      <td>${stream.purpose}</td>
    </tr>
  `).join('');
}

function bindDiagramEvents() {
  document.querySelectorAll('.unit-block').forEach(block => {
    block.addEventListener('click', () => {
      const key = block.dataset.unit;
      const item = unitData[key];
      clearActive();
      block.classList.add('active');
      setOverlay(item.title, item.desc1, item.desc2);
    });
  });

  Object.keys(streamData).forEach(id => {
    const stream = document.getElementById(id);
    if (!stream) return;
    stream.addEventListener('click', () => {
      const item = streamData[id];
      clearActive();
      stream.classList.add('active');
      setOverlay(item.title, `${item.from} → ${item.to}`, item.purpose);
    });
  });
}

function bindButtons() {
  const btnAnimate = document.getElementById('btnAnimate');
  const btnReset = document.getElementById('btnReset');

  btnAnimate.addEventListener('click', () => {
    document.body.classList.toggle('flow-paused');
    btnAnimate.textContent = document.body.classList.contains('flow-paused') ? 'Resume Flow' : 'Pause Flow';
  });

  btnReset.addEventListener('click', () => {
    clearActive();
    setOverlay('Click any block or stream', 'The diagram highlights the selected LNG process section.', 'Use this as a high-level plant block diagram.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
