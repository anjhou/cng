'use strict';

const unitData = {
  feed: {
    title: 'Propylene Feed System',
    desc1: 'Receives propylene feed and routes it to purification before polymerization.',
    desc2: 'Target contaminants include water, oxygen, sulfur species, dienes, and other catalyst poisons.',
    function: 'Provide controlled propylene feed to the PP unit.',
    equipment: 'Feed drum, filters, analyzers, feed control valves',
    conditions: 'Typically near storage / transfer conditions; conditioned before compression.'
  },
  purification: {
    title: 'Feed Purification & Drying',
    desc1: 'Removes catalyst poisons and dries propylene to very low moisture levels.',
    desc2: 'Clean feed protects Ziegler–Natta or metallocene catalyst activity and selectivity.',
    function: 'Remove H₂O, O₂, sulfur species, dienes, CO/CO₂ traces, and polar impurities.',
    equipment: 'Guard beds, molecular sieve dryers, selective hydrogenation / adsorbers as required',
    conditions: 'Dry product target: <1 ppm H₂O; low poison levels per catalyst specification.'
  },
  compression: {
    title: 'Feed Compression & Final Conditioning',
    desc1: 'Compresses clean propylene to reactor feed pressure and provides final drying/conditioning.',
    desc2: 'The feed enters the polymerization section at controlled pressure, temperature, and composition.',
    function: 'Raise propylene feed pressure and stabilize reactor feed conditions.',
    equipment: 'Feed compressor, coolers, KO drum, final dryer, flow control',
    conditions: 'Feed compression: 150–350 psig; dry to <1 ppm H₂O.'
  },
  catalyst: {
    title: 'Catalyst System',
    desc1: 'Meters catalyst, cocatalyst, and external donor where applicable into the reactor.',
    desc2: 'Catalyst choice controls activity, stereoregularity, molecular weight, and product grade.',
    function: 'Initiate and control propylene polymerization.',
    equipment: 'Catalyst feed pot, metering system, cocatalyst system, nitrogen blanketing',
    conditions: 'Inert handling under dry nitrogen; catalyst-specific feed rates.'
  },
  reactor: {
    title: 'Polymerization Reactor',
    desc1: 'Propylene contacts catalyst and forms solid polypropylene particles.',
    desc2: 'Common technologies include gas-phase fluidized-bed or bulk/slurry loop reactors.',
    function: 'Convert propylene monomer to PP polymer particles.',
    equipment: 'Fluidized-bed reactor or loop reactor, cycle gas compressor, heat removal system',
    conditions: 'Gas phase: 300–450 psig, 140–185°F. Bulk/slurry loop: 300–600 psig, 120–185°F.'
  },
  flash: {
    title: 'Degassing / Flash System',
    desc1: 'Reduces pressure and vaporizes unreacted propylene from polymer solids.',
    desc2: 'Monomer-rich vapor is routed to recovery and recycle.',
    function: 'Separate polymer solids from unreacted monomer.',
    equipment: 'Flash vessel, degasser, purge bin, cyclone/filter, vapor KO drum',
    conditions: 'Flash / degassing pressure: 0–30 psig.'
  },
  recycle: {
    title: 'Monomer Recovery & Recycle',
    desc1: 'Compresses, cools, and returns recovered propylene to polymerization.',
    desc2: 'Maintains feed efficiency and reduces hydrocarbon losses to flare or fuel.',
    function: 'Recover propylene vapor and recycle it to the reactor loop.',
    equipment: 'Recycle compressor, condenser/cooler, KO drum, purification guard bed as needed',
    conditions: 'Recycle compression: 300–450 psig; cooler outlet: 80–120°F.'
  },
  deactivation: {
    title: 'Catalyst Deactivation & Powder Drying',
    desc1: 'Neutralizes catalyst residues and removes remaining volatiles from PP powder.',
    desc2: 'Produces dry polymer powder suitable for extrusion.',
    function: 'Stop catalyst activity, purge residual monomer, and dry polymer powder.',
    equipment: 'Deactivation vessel, purge bin, nitrogen system, dryer, fines separator',
    conditions: 'Low residual monomer target; nitrogen purge / drying conditions set by grade.'
  },
  extruder: {
    title: 'Extrusion & Additive Blending',
    desc1: 'Melts polymer powder and blends antioxidants, stabilizers, and grade additives.',
    desc2: 'Creates homogeneous molten PP for pelletizing.',
    function: 'Melt, homogenize, and stabilize polypropylene.',
    equipment: 'Twin-screw extruder, additive feeders, melt filters, die plate',
    conditions: 'Melt temperature: 400–500°F.'
  },
  pelletizing: {
    title: 'Pelletizing, Cooling & Drying',
    desc1: 'Cuts the polymer melt into pellets, cools them, and removes surface water.',
    desc2: 'Pellets are conveyed to silos after drying and classification.',
    function: 'Convert molten PP into dry commercial pellets.',
    equipment: 'Underwater pelletizer, pellet water system, centrifugal dryer, classifier',
    conditions: 'Pellet water temperature: 60–90°F.'
  },
  storage: {
    title: 'Product Storage & Packaging',
    desc1: 'Stores PP pellets and ships them by bag, box, railcar, or bulk truck.',
    desc2: 'Final product is polypropylene pellets for molding, fiber, film, or extrusion grades.',
    function: 'Store, blend, package, and load out PP pellets.',
    equipment: 'Product silos, pneumatic conveyors, blenders, bagging, bulk loading',
    conditions: 'Ambient storage; moisture and contamination control required.'
  },
  utilities: {
    title: 'Utilities, Additives & Safety Systems',
    desc1: 'Supports safe and continuous PP operation with inerting, cooling, flare, and additives.',
    desc2: 'Vent recovery and flare systems handle hydrocarbons from flash and purge operations.',
    function: 'Provide support systems, additive handling, cooling, inerting, and relief disposal.',
    equipment: 'Nitrogen, cooling water, flare, vent recovery, instrument air, additive packages',
    conditions: 'Utility conditions depend on site; nitrogen inerting required for catalyst/feed systems.'
  }
};

const streamData = {
  s1: { title: 'Propylene Feed', from: 'Battery limit', to: 'Feed system', purpose: 'Fresh propylene feed enters the PP unit.' },
  s2: { title: 'Raw Propylene to Purification', from: 'Feed system', to: 'Purification', purpose: 'Feed is treated to remove catalyst poisons.' },
  s3: { title: 'Purified Propylene', from: 'Purification', to: 'Compression', purpose: 'Dry, clean propylene advances to pressure control.' },
  s4: { title: 'Clean Reactor Feed', from: 'Compression', to: 'Polymerization reactor', purpose: 'Compressed propylene feed at 150–350 psig and <1 ppm H₂O.' },
  s5: { title: 'Catalyst Feed', from: 'Catalyst system', to: 'Polymerization reactor', purpose: 'Ziegler–Natta or metallocene catalyst promotes PP formation.' },
  s6: { title: 'Reactor Discharge', from: 'Polymerization reactor', to: 'Degassing / flash', purpose: 'PP solids plus unreacted propylene leave the reactor.' },
  s7: { title: 'Recovered Propylene Vapor', from: 'Degassing / flash', to: 'Monomer recovery', purpose: 'Pressure reduction vaporizes unreacted propylene at 0–30 psig.' },
  s8: { title: 'Recycle Propylene', from: 'Monomer recovery', to: 'Reactor feed loop', purpose: 'Recovered monomer compressed to 300–450 psig, cooled to 80–120°F, and recycled.' },
  s9: { title: 'Polymer Solids', from: 'Degassing / flash', to: 'Deactivation & drying', purpose: 'Polymer powder moves to catalyst deactivation and drying.' },
  s10: { title: 'Dry PP Powder', from: 'Deactivation & drying', to: 'Extrusion', purpose: 'Dry, deactivated powder enters melt extrusion.' },
  s11: { title: 'Additive Feed', from: 'Additive systems', to: 'Extrusion', purpose: 'Antioxidants, stabilizers, and grade additives are blended into PP.' },
  s12: { title: 'Molten PP', from: 'Extrusion', to: 'Pelletizing', purpose: 'Melt at 400–500°F is filtered and pelletized.' },
  s13: { title: 'Dried PP Pellets', from: 'Pelletizing', to: 'Storage & packaging', purpose: 'Pellets cooled with 60–90°F water, dried, and conveyed to silos.' },
  s14: { title: 'PP Product', from: 'Storage & packaging', to: 'Loadout', purpose: 'Finished polypropylene pellets to packaging or bulk distribution.' },
  s15: { title: 'Vent / Purge Gas', from: 'Degassing / flash', to: 'Vent recovery / flare', purpose: 'Hydrocarbon purge routed to recovery, fuel, or flare system.' }
};

function setOverlay(title, desc1, desc2) {
  const titleEl = document.getElementById('selectedTitle');
  const desc1El = document.getElementById('selectedDesc1');
  const desc2El = document.getElementById('selectedDesc2');
  if (titleEl) titleEl.textContent = title;
  if (desc1El) desc1El.textContent = desc1;
  if (desc2El) desc2El.textContent = desc2;
}

function clearActive() {
  document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
}

function populateTables() {
  const unitBody = document.querySelector('#unitSummaryTable tbody');
  const streamBody = document.querySelector('#streamSummaryTable tbody');
  if (unitBody) {
    unitBody.innerHTML = Object.values(unitData).map(unit => `
      <tr>
        <td>${unit.title}</td>
        <td>${unit.function}</td>
        <td>${unit.equipment}</td>
        <td>${unit.conditions}</td>
      </tr>
    `).join('');
  }
  if (streamBody) {
    streamBody.innerHTML = Object.values(streamData).map(stream => `
      <tr>
        <td>${stream.title}</td>
        <td>${stream.from}</td>
        <td>${stream.to}</td>
        <td>${stream.purpose}</td>
      </tr>
    `).join('');
  }
}

function bindDiagramEvents() {
  document.querySelectorAll('.unit-block').forEach(block => {
    block.addEventListener('click', () => {
      const key = block.dataset.unit;
      const item = unitData[key];
      if (!item) return;
      clearActive();
      block.classList.add('active');
      setOverlay(item.title, item.desc1, item.conditions);
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
      setOverlay('Click any block or stream', 'The diagram highlights PP process sections.', 'Process conditions are included in the summary table.');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
