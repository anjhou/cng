'use strict';

const unitData = {
  feed: {
    title: 'Ethane Feed System + Dilution Steam',
    capacity: 'Ethane feed basis: ~1.25–1.35 million tpy for 1.0 million tpy ethylene',
    desc1: 'Receives ethane, controls feed rate, preheats feed, and mixes dilution steam before the cracking furnaces.',
    desc2: 'Dilution steam reduces hydrocarbon partial pressure and limits coke formation in furnace coils.',
    function: 'Feed conditioning, feed preheat, and dilution steam mixing.',
    conditions: 'Feed preheat typically 300–1,100°F before radiant coil; dilution steam ratio 0.3–0.5 lb steam/lb ethane.',
    yield: 'Prepared ethane + dilution steam feed to steam cracking furnaces.',
    equipment: 'Feed filters, vaporizers/preheaters, dilution steam control, mixing header'
  },
  furnace: {
    title: 'Steam Cracking Furnaces',
    capacity: 'Ethylene design basis: 1,000,000 tpy; multiple parallel cracking furnaces',
    desc1: 'Cracks ethane at very high temperature and very short residence time to maximize ethylene selectivity.',
    desc2: 'Products include ethylene-rich cracked gas with H₂, CH₄, C₂H₂, C₃–C₄, CO, CO₂, and trace heavies.',
    function: 'Thermal conversion of ethane to ethylene-rich cracked gas.',
    conditions: 'Coil outlet temperature 1500–1600°F; residence time 0.1–0.3 sec; near low pressure through coils.',
    yield: 'Ethylene yield typically ~78–82 wt% of fresh ethane feed; hot cracked gas to TLEs.',
    equipment: 'Radiant coils, convection section, burners, decoke system, transfer line piping'
  },
  tle: {
    title: 'Transfer Line Exchangers (TLEs)',
    capacity: 'Handles full hot cracked gas furnace effluent',
    desc1: 'Rapidly quenches furnace effluent to stop secondary reactions and recover heat as high-pressure steam.',
    desc2: 'Fast cooling preserves ethylene yield and reduces fouling/coking downstream.',
    function: 'Immediate heat recovery and reaction quench after cracking.',
    conditions: 'Cracked gas cooled to ~660–750°F; HP steam generated typically at 600–900 psig.',
    yield: 'Cooled cracked gas to quench tower plus high-pressure steam export to plant steam system.',
    equipment: 'TLE exchangers, steam drums, blowdown, decoke connections'
  },
  quench: {
    title: 'Quench Tower / Primary Cooling',
    capacity: 'Full cracked gas rate plus quench water/oil circulation',
    desc1: 'Further cools cracked gas and removes tars, heavy hydrocarbons, water, and condensables.',
    desc2: 'Produces pyrolysis gasoline, pyrolysis fuel oil/gas oil, and quench water blowdown streams.',
    function: 'Primary cooling, heavy hydrocarbon removal, and water condensation.',
    conditions: 'Cracked gas cooled to ~100–150°F; tower operates near low pressure with circulating quench media.',
    yield: 'Quenched cracked gas to compression; pygas, PGO/PFO, and quench water side products.',
    equipment: 'Quench tower, oil/water circuits, primary fractionator, pumps, coolers, separators'
  },
  compressor: {
    title: 'Cracked Gas Compression',
    capacity: 'Full dry cracked gas compression train',
    desc1: 'Raises cracked gas pressure for caustic treating, drying, chilling, and cryogenic distillation.',
    desc2: 'Interstage cooling and knockout drums remove condensate, aerosols, and water between stages.',
    function: 'Multi-stage cracked gas pressure boost with condensate removal.',
    conditions: '4–5 stages; inlet near atmospheric; discharge ~450–500 psig with interstage cooling.',
    yield: 'Compressed cracked gas to caustic wash and dryers; condensate routed to liquid recovery.',
    equipment: 'Centrifugal compressor, interstage coolers, KO drums, seal system, antisurge controls'
  },
  caustic: {
    title: 'Caustic Wash + Molecular Sieve Dryers',
    capacity: 'Full compressed cracked gas treating capacity',
    desc1: 'Removes acid gases such as CO₂ and H₂S with caustic, then dries gas before cryogenic service.',
    desc2: 'Dryers protect cold box exchangers and distillation towers from ice/hydrate formation.',
    function: 'Acid gas removal and deep dehydration.',
    conditions: 'Caustic wash near compressor discharge pressure; molecular sieve drying to <1 ppmv H₂O.',
    yield: 'Acid-gas-free, dry cracked gas to chilling train.',
    equipment: 'Caustic tower, spent caustic handling, water wash, molecular sieve beds, regeneration heater/cooler'
  },
  chilling: {
    title: 'Chilling Train / Cold Box',
    capacity: 'Full treated cracked gas refrigeration load',
    desc1: 'Cools treated cracked gas to cryogenic temperatures for methane/hydrogen rejection and C₂ recovery.',
    desc2: 'Uses integrated refrigeration and heat exchange with demethanizer and product streams.',
    function: 'Cryogenic cooling and partial condensation upstream of separation.',
    conditions: 'Gas chilled down to approximately −150 to −200°F depending on demethanizer scheme.',
    yield: 'Cryogenic feed to demethanizer with high C₂ recovery.',
    equipment: 'Cold box exchangers, expansion valves/turbines, refrigeration loops, separators'
  },
  demethanizer: {
    title: 'Demethanizer',
    capacity: 'Full chilled cracked gas separation capacity',
    desc1: 'Separates H₂ and methane overhead from C₂+ components in the bottoms stream.',
    desc2: 'Overhead is routed to fuel gas and hydrogen recovery; bottoms feed C₂ fractionation.',
    function: 'Reject light gases and recover C₂+ material.',
    conditions: 'Feed temperature −150 to −200°F; operating pressure ~300–450 psig.',
    yield: 'H₂/CH₄ overhead to fuel gas/H₂ recovery; C₂+ bottoms to ethylene recovery.',
    equipment: 'Demethanizer column, reboiler/condensers, reflux drum, cold separators'
  },
  c2splitter: {
    title: 'Ethylene Tower / C₂ Splitter',
    capacity: '1,000,000 tpy polymer-grade ethylene product',
    desc1: 'Separates ethylene overhead from ethane bottoms using a tall, high-reflux C₂ splitter.',
    desc2: 'Ethane bottoms are recycled to the furnace feed system to maximize ethylene recovery.',
    function: 'Final ethylene/ethane fractionation.',
    conditions: 'Typically 250–350 psig; tall tower with 100+ trays or equivalent structured packing.',
    yield: 'Polymer-grade ethylene overhead; ethane recycle bottoms to cracking furnaces.',
    equipment: 'C₂ splitter, reflux system, reboiler, ethylene product condenser, ethane recycle pumps'
  },
  acetylene: {
    title: 'Acetylene Converter',
    capacity: 'C₂ stream selective hydrogenation capacity',
    desc1: 'Selectively hydrogenates acetylene to ethylene to meet polymer-grade ethylene specifications.',
    desc2: 'May be placed front-end or back-end depending on selected licensed process configuration.',
    function: 'Acetylene removal from C₂ fractionation feed/product loop.',
    conditions: 'Typical temperature 150–250°F; pressure aligned with C₂ splitter feed, ~250–350 psig.',
    yield: 'Acetylene converted primarily to ethylene with controlled ethane make.',
    equipment: 'Hydrogenation reactors, guard beds, feed heaters/coolers, temperature controls'
  },
  debutanizer: {
    title: 'Debutanizer / C₃+ Heavy Product Recovery',
    capacity: 'C₃+ liquid recovery and fractionation capacity',
    desc1: 'Separates C₄/LPG-range material overhead from pyrolysis gasoline bottoms.',
    desc2: 'Heavy aromatic-rich PGO/PFO from primary fractionation is routed to fuel, FCC feed, or hydrotreating.',
    function: 'Recover C₃+ byproducts, C₄ cut, pygas, and heavy oil streams.',
    conditions: 'Typical debutanizer service: ~100–250 psig, 100–350°F column profile depending on composition.',
    yield: 'C₄/LPG overhead; C₅–C₉ pyrolysis gasoline bottoms; PGO/PFO from quench/primary section.',
    equipment: 'Debutanizer, reflux drum, reboiler, C₄ handling, pygas storage, PGO/PFO rundown'
  },
  products: {
    title: 'Products & Offsites',
    capacity: 'Ethylene: 1,000,000 tpy plus byproducts/offgas systems',
    desc1: 'Handles polymer-grade ethylene, ethane recycle, H₂/CH₄ fuel gas, pygas, C₄/LPG, and PGO/PFO.',
    desc2: 'Includes product storage, export, flare, fuel gas, wastewater, and spent caustic systems.',
    function: 'Product storage/export and byproduct disposition.',
    conditions: 'Ethylene storage/export conditions depend on pipeline, refrigerated, or pressure storage design.',
    yield: 'Major product: polymer-grade ethylene; byproducts include H₂/CH₄ fuel gas, C₄/LPG, pygas, and PGO/PFO.',
    equipment: 'Ethylene storage, pumps/compressors, product analyzers, fuel gas header, flare, wastewater'
  },
  utilities: {
    title: 'Utilities & Integration',
    capacity: 'Supports entire 1,000,000 tpy ethylene complex',
    desc1: 'Provides dilution steam, boiler feedwater, HP steam recovery, refrigeration, cooling, power, flare, and wastewater.',
    desc2: 'TLE steam generation and furnace firing are major energy integration points.',
    function: 'Plant utilities, energy recovery, relief, and environmental systems.',
    conditions: 'HP steam commonly 600–900 psig from TLEs; other utility headers per site standard.',
    yield: 'HP steam export from TLEs offsets plant steam demand; fuel gas supports furnace firing.',
    equipment: 'Steam drums, boilers, cooling water, refrigeration compressors, flare, wastewater, firewater'
  }
};

const streamData = {
  s1: { title: 'Fresh Ethane Feed', from: 'Ethane supply / storage', to: 'Ethane feed system', purpose: 'Fresh ethane enters the cracker battery limit.' },
  s2: { title: 'Dilution Steam', from: 'Steam system', to: 'Feed/furnace inlet', purpose: 'Dilution steam reduces hydrocarbon partial pressure and limits coke formation.' },
  s3: { title: 'Ethane + Steam Feed', from: 'Feed system', to: 'Steam cracking furnaces', purpose: 'Prepared feed enters radiant coils for thermal cracking.' },
  s4: { title: 'Hot Cracked Gas', from: 'Furnaces', to: 'TLEs', purpose: 'Very hot furnace effluent is immediately quenched to stop secondary reactions.' },
  s5: { title: 'TLE Effluent', from: 'TLEs', to: 'Quench tower', purpose: 'Rapidly cooled cracked gas continues to primary cooling and heavy removal.' },
  s6: { title: 'Quenched Cracked Gas', from: 'Quench / primary cooling', to: 'Cracked gas compressor', purpose: 'Gas cooled to roughly 100–150°F enters multi-stage compression.' },
  s7: { title: 'Compressed Cracked Gas', from: 'Cracked gas compressor', to: 'Caustic wash + dryers', purpose: 'Compressed gas is treated for acid gases and dried for cryogenic service.' },
  s8: { title: 'Dry Treated Cracked Gas', from: 'Caustic wash + dryers', to: 'Chilling train', purpose: 'Acid-gas-free, dry gas is chilled for demethanizer separation.' },
  s9: { title: 'Chilled Cracked Gas', from: 'Chilling train', to: 'Demethanizer', purpose: 'Cryogenic feed enters methane/hydrogen rejection section.' },
  s10: { title: 'H₂ + Methane Overhead', from: 'Demethanizer', to: 'Products/offsites', purpose: 'Light gases are sent to hydrogen recovery and fuel gas systems.' },
  s11: { title: 'C₂+ Bottoms', from: 'Demethanizer', to: 'C₂ splitter', purpose: 'C₂+ stream continues to ethylene/ethane separation.' },
  s12: { title: 'C₂ Cut to Acetylene Converter', from: 'C₂ splitter loop', to: 'Acetylene converter', purpose: 'C₂ stream receives selective hydrogenation to remove acetylene.' },
  s13: { title: 'Ethylene/Ethane Product Loop', from: 'C₂ splitter', to: 'Products/offsites', purpose: 'Ethylene product and ethane recycle are routed to storage/export and recycle systems.' },
  s14: { title: 'Polymer-Grade Ethylene', from: 'Products/offsites', to: 'Ethylene storage/export', purpose: '1,000,000 tpy ethylene product leaves the unit.' },
  s15: { title: 'Fuel Gas / Hydrogen', from: 'Products/offsites', to: 'Fuel gas / H₂ recovery', purpose: 'H₂ and methane support fuel gas or hydrogen recovery.' },
  s16: { title: 'C₃+ Liquids', from: 'Quench / recovery section', to: 'Debutanizer / C₃+ recovery', purpose: 'Condensed C₃+ material is routed for byproduct recovery.' },
  s17: { title: 'PGO / Heavy Oil', from: 'Debutanizer / primary fractionation', to: 'PGO/PFO handling', purpose: 'Heavy aromatic oil goes to fuel, FCC feed, or hydrotreating/aromatics recovery.' },
  s18: { title: 'Pygas / C₄ Products', from: 'Debutanizer / C₃+ recovery', to: 'Products/offsites', purpose: 'C₄/LPG and pyrolysis gasoline are routed to product handling.' },
  s19: { title: 'Pyrolysis Gasoline', from: 'Products/offsites', to: 'Pygas storage/export', purpose: 'C₅–C₉ aromatic-rich pygas byproduct.' },
  s20: { title: 'C₄ / LPG Cut', from: 'Products/offsites', to: 'C₄/LPG handling', purpose: 'C₄/butene/butadiene-rich cut depending on downstream scheme.' },
  s21: { title: 'High-Pressure Steam', from: 'TLEs', to: 'Utilities / steam system', purpose: 'Recovered heat generates 600–900 psig HP steam.' },
  s22: { title: 'Ethane Recycle', from: 'C₂ splitter bottoms', to: 'Feed system / furnaces', purpose: 'Unconverted ethane is recycled to cracking furnaces.' }
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
      <td><strong>${unit.title}</strong><br><span class="table-note">${unit.capacity}</span></td>
      <td>${unit.function}</td>
      <td>${unit.conditions}</td>
      <td>${unit.yield}</td>
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
      setOverlay(
        'Click any block or stream',
        'The diagram highlights the selected ethane cracker section.',
        'Use this as a high-level petchem block diagram.'
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
