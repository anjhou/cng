'use strict';

const unitData = {
  ethylene: {
    title: 'Ethylene Feed',
    desc1: 'Polymer-grade ethylene is dried and purified before reactor injection.',
    desc2: 'Impurities such as H₂O, O₂, CO, sulfur, and acetylene must be controlled to protect catalyst activity.',
    function: 'Primary monomer feed for LLDPE polymerization.',
    equipment: 'Feed filters, molecular sieve dryer, oxygenate / sulfur guard beds, flow control'
  },
  comonomer: {
    title: 'α-Olefin Comonomer Feed',
    desc1: '1-butene, 1-hexene, or 1-octene is added at controlled concentration.',
    desc2: 'Comonomer creates short-chain branching, improving toughness, flexibility, and puncture resistance.',
    function: 'Controls density and short-chain branching.',
    equipment: 'Storage, pumps, dryers, guard beds, metering injection'
  },
  hydrogen: {
    title: 'Hydrogen Feed',
    desc1: 'Hydrogen is used as a chain-transfer agent to control molecular weight and melt index.',
    desc2: 'Hydrogen concentration is tightly regulated with reactor composition control.',
    function: 'Controls molecular weight distribution and melt index.',
    equipment: 'H₂ purification, pressure control, metering injection'
  },
  catalyst: {
    title: 'Catalyst Feed System',
    desc1: 'Ziegler-Natta or metallocene catalyst is prepared and fed to the reactor.',
    desc2: 'Catalyst, cocatalyst, and modifiers are handled under inert dry conditions.',
    function: 'Initiates and controls polymerization reaction.',
    equipment: 'Catalyst feeder, cocatalyst tanks, inerting, injection nozzles'
  },
  purification: {
    title: 'Feed Purification',
    desc1: 'Feeds are dried and polished to remove catalyst poisons before polymerization.',
    desc2: 'Typical contaminants include water, oxygen, CO, CO₂, sulfur species, and polar compounds.',
    function: 'Protects polymerization catalyst and reactor stability.',
    equipment: 'Molecular sieve dryers, activated alumina, copper beds, sulfur guard beds'
  },
  reactor: {
    title: 'Gas-Phase Fluidized-Bed Reactor',
    desc1: 'Ethylene and comonomer polymerize over catalyst to form LLDPE powder.',
    desc2: 'Typical operation is moderate temperature and pressure with recycle gas cooling to remove heat of reaction.',
    function: 'Main LLDPE polymerization step.',
    equipment: 'Fluidized-bed reactor, distributor plate, product discharge system, temperature / composition control'
  },
  recycle: {
    title: 'Recycle Gas Loop',
    desc1: 'Unreacted ethylene, comonomer, hydrogen, and inert gas are compressed, cooled, and returned to the reactor.',
    desc2: 'Recycle provides fluidization and heat removal for stable gas-phase operation.',
    function: 'Recovers monomer and controls reactor heat balance.',
    equipment: 'Recycle compressor, gas cooler, separator, analyzers, purge control'
  },
  powder: {
    title: 'Powder Discharge & Degassing',
    desc1: 'Polymer powder leaves the reactor through discharge valves and is separated from entrained gases.',
    desc2: 'Residual hydrocarbons are stripped and catalyst residues are deactivated before finishing.',
    function: 'Transfers reactor powder to finishing while recovering gas.',
    equipment: 'Product discharge tanks, degassing vessel, purge bin, cyclone / filter'
  },
  offgas: {
    title: 'Purge / Off-Gas Recovery',
    desc1: 'Purge gas removes inerts and light ends from the recycle loop.',
    desc2: 'Recovered hydrocarbons can be recycled; non-recovered gas may route to fuel gas or flare systems.',
    function: 'Controls inert buildup and recovers valuable monomers.',
    equipment: 'Purge compressor, membrane / condensation recovery, fuel gas tie-in'
  },
  drying: {
    title: 'Powder Drying',
    desc1: 'Nitrogen purge removes residual monomer, comonomer, and moisture from polymer powder.',
    desc2: 'Dry powder is suitable for additive blending and extrusion.',
    function: 'Removes residual volatiles before melt processing.',
    equipment: 'Purge bin, nitrogen heater / cooler, vent recovery, filters'
  },
  extruder: {
    title: 'Extruder & Additive Blending',
    desc1: 'Stabilizers, antioxidants, slip agents, or processing aids are added to the polymer powder.',
    desc2: 'The extruder melts, homogenizes, and filters the polymer before pellet formation.',
    function: 'Converts powder into stabilized molten polymer.',
    equipment: 'Loss-in-weight feeders, twin-screw extruder, melt pump, screen changer'
  },
  pelletizer: {
    title: 'Pelletizing & Cooling',
    desc1: 'Molten polymer is cut into pellets and cooled in water or air systems.',
    desc2: 'Pellets are dried, classified, and conveyed to storage.',
    function: 'Forms saleable LLDPE pellets.',
    equipment: 'Underwater pelletizer, pellet water system, dryer, classifier'
  },
  storage: {
    title: 'Pellet Silos & Quality Control',
    desc1: 'Pellets are conveyed to silos for blending, homogenization, and quality release.',
    desc2: 'Key product properties include density, melt index, comonomer content, and additive package.',
    function: 'Stores and blends finished pellets before shipment.',
    equipment: 'Pneumatic conveying, blending silos, analyzers, sampling station'
  },
  packaging: {
    title: 'Packaging & Shipment',
    desc1: 'Released pellets are shipped in bulk trucks, railcars, supersacks, or bags.',
    desc2: 'LLDPE is used in films, packaging, liners, pipe, molding, and flexible applications.',
    function: 'Final product handling and logistics.',
    equipment: 'Bagging line, bulk loading, weigh scale, warehouse'
  }
};

const streamData = {
  s1: { title: 'Ethylene to Feed Header', from: 'Ethylene feed', to: 'Feed purification', purpose: 'Supplies purified monomer to the reactor system.' },
  s2: { title: 'Comonomer to Feed Header', from: 'α-olefin storage', to: 'Feed purification', purpose: 'Controls density and short-chain branching.' },
  s3: { title: 'Hydrogen to Feed Header', from: 'Hydrogen system', to: 'Feed purification', purpose: 'Controls melt index / molecular weight.' },
  s4: { title: 'Ethylene Feed Drop', from: 'Ethylene feed', to: 'Feed purification', purpose: 'Routes ethylene to polishing beds.' },
  s5: { title: 'Comonomer Feed Drop', from: 'Comonomer feed', to: 'Feed purification', purpose: 'Routes α-olefin through driers and guard beds.' },
  s6: { title: 'Hydrogen Feed Drop', from: 'Hydrogen feed', to: 'Feed purification', purpose: 'Routes hydrogen to reactor composition control.' },
  s7: { title: 'Catalyst Injection', from: 'Catalyst system', to: 'Gas-phase reactor', purpose: 'Introduces catalyst / cocatalyst under inert dry conditions.' },
  s8: { title: 'Purified Feed', from: 'Feed purification', to: 'Gas-phase reactor', purpose: 'Clean monomers and hydrogen enter polymerization reactor.' },
  s9: { title: 'Reactor Gas', from: 'Gas-phase reactor', to: 'Recycle gas loop', purpose: 'Unreacted gas is cooled, compressed, and recovered.' },
  s10: { title: 'Recycle Gas', from: 'Recycle gas loop', to: 'Gas-phase reactor', purpose: 'Provides fluidization, heat removal, and monomer recycle.' },
  s11: { title: 'LLDPE Powder', from: 'Gas-phase reactor', to: 'Powder drying', purpose: 'Polymer powder transfers to finishing system.' },
  s12: { title: 'Purge Gas', from: 'Powder discharge', to: 'Off-gas recovery', purpose: 'Removes residual monomer and inerts from powder/recycle system.' },
  s13: { title: 'Dry Powder', from: 'Powder drying', to: 'Extruder', purpose: 'Prepared polymer powder enters melt compounding.' },
  s14: { title: 'Molten Polymer', from: 'Extruder', to: 'Pelletizer', purpose: 'Stabilized polymer melt is pelletized.' },
  s15: { title: 'Wet / Cooled Pellets', from: 'Pelletizer', to: 'Pellet silos', purpose: 'Pellets are dried, classified, and conveyed to storage.' },
  s16: { title: 'Released Pellets', from: 'Pellet silos', to: 'Packaging', purpose: 'On-spec product transfers to packaging or bulk loading.' },
  s17: { title: 'LLDPE Product', from: 'Packaging', to: 'Shipment', purpose: 'Finished LLDPE pellets leave the plant.' }
};

function safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
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
      <tr>
        <td>${unit.title}</td>
        <td>${unit.function}</td>
        <td>${unit.equipment}</td>
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
      setOverlay('Click any block or stream', 'LLDPE gas-phase polymerization and finishing flowsheet.', 'Animation can be paused from the top control.');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
