'use strict';

const unitData = {
  filter: {
    title: 'Ambient Air Filter',
    desc1: 'Ambient air is screened and filtered to remove dust and coarse particulate matter.',
    desc2: 'Protects the main air compressor and downstream exchangers from fouling and erosion.',
    function: 'Raw air intake filtration and equipment protection.',
    equipment: 'Inlet filter house, silencer, weather hood; ambient pressure and temperature.'
  },
  compressor: {
    title: 'Main Air Compressor',
    desc1: 'Filtered air is compressed in multiple stages with interstage cooling.',
    desc2: 'Typical ASU air compression pressure is approximately 75–150 psig, depending on cycle design.',
    function: 'Raise air pressure for purification, heat exchange, and cryogenic separation.',
    equipment: 'Centrifugal compressor, interstage coolers, KO drums; discharge about 75–150 psig.'
  },
  aftercooler: {
    title: 'After-Coolers and Condensate Removal',
    desc1: 'Compressed air is cooled and condensed water is separated in knock-out drums.',
    desc2: 'Reduces moisture load to the dryer and molecular sieve purification system.',
    function: 'Remove heat of compression and condensed water.',
    equipment: 'After-coolers, separator drums, condensate drains; near cooling-water temperature.'
  },
  dryer: {
    title: 'Dryer',
    desc1: 'Bulk moisture is removed before final CO₂/H₂O polishing.',
    desc2: 'Drying prevents hydrate, ice, and exchanger freezing in the cryogenic section.',
    function: 'Reduce water content before molecular sieve beds.',
    equipment: 'Refrigerated dryer or adsorbent dryer, water separator, drain system.'
  },
  molsieve: {
    title: 'Molecular Sieve Purification',
    desc1: 'CO₂ and remaining water vapor are removed to very low levels.',
    desc2: 'Molecular sieve beds operate in adsorption/regeneration cycles to protect the cold box.',
    function: 'Final removal of CO₂ and H₂O to prevent freeze-out during cryogenic cooling.',
    equipment: 'Twin or multi-bed mol sieve adsorbers, regeneration heater, coolers, switching valves.'
  },
  coldbox: {
    title: 'Cold Box / Main Heat Exchanger',
    desc1: 'Clean dry air is cooled by returning cold product and waste gas streams.',
    desc2: 'The air approaches cryogenic temperatures and becomes partially liquefied before column feed.',
    function: 'Cryogenic cooling and heat integration for air liquefaction.',
    equipment: 'Plate-fin main heat exchanger, cold box piping, phase separators.'
  },
  expander: {
    title: 'Turbo-Expander',
    desc1: 'A portion of clean air expands through a turbine to generate refrigeration.',
    desc2: 'Rapid expansion cools the stream and supports low-temperature operation in the distillation system.',
    function: 'Generate refrigeration and partially liquefy air.',
    equipment: 'Turbo-expander, brake compressor or generator, inlet guide vanes, cold separator.'
  },
  hpColumn: {
    title: 'High-Pressure Column',
    desc1: 'Partially liquefied air enters the first distillation step.',
    desc2: 'The high-pressure column makes nitrogen-rich vapor and oxygen-enriched liquid for further separation.',
    function: 'Initial cryogenic fractionation of air.',
    equipment: 'Cryogenic distillation trays/packing; elevated pressure column service.'
  },
  lpColumn: {
    title: 'Low-Pressure Column',
    desc1: 'Fractional distillation separates nitrogen overhead from oxygen-rich bottoms.',
    desc2: 'Nitrogen rises because it has a lower boiling point, while oxygen collects near the bottom.',
    function: 'Final N₂/O₂ separation by cryogenic distillation.',
    equipment: 'Low-pressure distillation column, condenser/reboiler, structured packing or trays.'
  },
  argonColumn: {
    title: 'Argon Side Column',
    desc1: 'Argon is withdrawn from an intermediate column location because its volatility lies between N₂ and O₂.',
    desc2: 'The stream may be purified as argon product or purged depending on plant design.',
    function: 'Argon recovery or argon-rich purge handling.',
    equipment: 'Crude argon column, condenser, side-draw controls, optional argon purification.'
  },
  n2Product: {
    title: 'Nitrogen Product',
    desc1: 'High-purity nitrogen is withdrawn from the top of the low-pressure column.',
    desc2: 'Product may be warmed as gaseous N₂ or collected as liquid nitrogen.',
    function: 'Produce high-purity nitrogen for utility, inerting, or liquid product service.',
    equipment: 'Product exchanger, N₂ compressor, liquid nitrogen tank or gaseous product header.'
  },
  o2Product: {
    title: 'Oxygen Product',
    desc1: 'Oxygen-rich liquid or vapor is withdrawn from the lower section of the column system.',
    desc2: 'Product can be delivered as gaseous oxygen or liquid oxygen after pumping/vaporization.',
    function: 'Produce oxygen for industrial or medical-grade downstream service as specified.',
    equipment: 'LOX pump, vaporizer, product compressor, oxygen storage.'
  },
  argonProduct: {
    title: 'Argon Product / Purge',
    desc1: 'Argon-rich side draw is recovered or purged to maintain column composition.',
    desc2: 'Additional purification is required for high-purity argon product.',
    function: 'Recover crude/refined argon or purge argon-rich stream.',
    equipment: 'Argon purification, storage, vent/purge controls.'
  },
  waste: {
    title: 'Waste / Vent Gas',
    desc1: 'Impurity purge and regeneration vent gases are routed to safe disposal or reuse.',
    desc2: 'Waste nitrogen may also be used for regeneration, cooling, or inerting applications.',
    function: 'Handle non-product gas, regeneration exhaust, and impurity purge.',
    equipment: 'Vent stack, muffler, regeneration gas heater/cooler, safe discharge system.'
  }
};

const streamData = {
  s1: { title: 'Ambient Air', from: 'Atmosphere', to: 'Air filter', purpose: 'Raw air enters the ASU battery limit.' },
  s2: { title: 'Filtered Air', from: 'Air filter', to: 'Main air compressor', purpose: 'Particulate-free air is routed to compression.' },
  s3: { title: 'Compressed Air', from: 'Main air compressor', to: 'After-coolers', purpose: 'Hot compressed air is cooled and condensed water is removed.' },
  s4: { title: 'Cooled Compressed Air', from: 'After-coolers', to: 'Dryer', purpose: 'Air is routed for bulk moisture removal.' },
  s5: { title: 'Dried Air', from: 'Dryer', to: 'Molecular sieve beds', purpose: 'Partially dried air receives final CO₂ and H₂O removal.' },
  s6: { title: 'Clean Dry Air', from: 'Molecular sieve beds', to: 'Turbo-expander', purpose: 'CO₂/H₂O-free air is expanded to generate refrigeration.' },
  s7: { title: 'Expanded Cold Air', from: 'Turbo-expander', to: 'High-pressure column / cold box', purpose: 'Cooled and partially liquefied air enters cryogenic distillation.' },
  s8: { title: 'HP Column Transfer', from: 'High-pressure column', to: 'Low-pressure column', purpose: 'Intermediate streams are transferred for final N₂/O₂ separation.' },
  s9: { title: 'Argon-Rich Side Draw', from: 'Low-pressure column', to: 'Argon column', purpose: 'Intermediate boiling argon is extracted for recovery or purge.' },
  s10: { title: 'Cold Return Stream', from: 'Column system', to: 'Main exchanger', purpose: 'Cold return streams recover refrigeration in the cold box.' },
  s11: { title: 'Argon-Rich Column Feed', from: 'Low-pressure column side draw', to: 'Argon column', purpose: 'Argon-rich vapor/liquid is routed to the argon recovery section.' },
  s12: { title: 'Nitrogen Overhead', from: 'Low-pressure column top', to: 'Nitrogen product', purpose: 'High-purity nitrogen is withdrawn overhead because N₂ is more volatile.' },
  s13: { title: 'Oxygen Bottoms', from: 'Low-pressure column bottom', to: 'Oxygen product', purpose: 'Oxygen-rich liquid or vapor is removed from the lower column.' },
  s14: { title: 'Argon Product / Purge', from: 'Argon column', to: 'Argon product or purge handling', purpose: 'Argon-rich stream is recovered or purged depending on plant design.' },
  s15: { title: 'Regeneration / Impurity Vent', from: 'Molecular sieve / purification system', to: 'Waste / vent system', purpose: 'Regeneration exhaust and impurity purge are safely discharged or reused.' }
};

function safeText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setOverlay(title, desc1, desc2) {
  safeText('selectedTitle', title);
  safeText('selectedDesc1', desc1);
  safeText('selectedDesc2', desc2);
}
function clearActive() {
  document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
}
function populateTables() {
  const unitBody = document.querySelector('#unitSummaryTable tbody');
  const streamBody = document.querySelector('#streamSummaryTable tbody');
  if (unitBody) {
    unitBody.innerHTML = Object.values(unitData).map(unit => `
      <tr><td>${unit.title}</td><td>${unit.function}</td><td>${unit.equipment}</td></tr>
    `).join('');
  }
  if (streamBody) {
    streamBody.innerHTML = Object.values(streamData).map(stream => `
      <tr><td>${stream.title}</td><td>${stream.from}</td><td>${stream.to}</td><td>${stream.purpose}</td></tr>
    `).join('');
  }
}
function bindDiagramEvents() {
  document.querySelectorAll('.unit-block').forEach(block => {
    block.addEventListener('click', () => {
      const item = unitData[block.dataset.unit];
      if (!item) return;
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
  if (btnAnimate) {
    btnAnimate.addEventListener('click', () => {
      document.body.classList.toggle('flow-paused');
      btnAnimate.textContent = document.body.classList.contains('flow-paused') ? 'Resume Flow' : 'Pause Flow';
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      clearActive();
      setOverlay('Click any block or stream', 'The diagram highlights the selected cryogenic air separation section.', 'The optimized layout uses the full SVG canvas with visible inline arrowheads.');
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
