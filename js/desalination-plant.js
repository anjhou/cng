'use strict';

const unitData = {
  intake: {
    title: 'Seawater Intake & Screening',
    desc1: 'Draws seawater from ocean intake or beach wells and removes large debris.',
    desc2: 'Typical equipment: intake screens, traveling screens, intake pumps, chlorination/dechlorination tie-ins.',
    function: 'Raw seawater collection and debris protection for downstream treatment.',
    equipment: 'Intake structure, coarse/fine screens, intake pumps; near ambient pressure and temperature.'
  },
  pretreat: {
    title: 'Pretreatment',
    desc1: 'Reduces suspended solids, colloids, biological matter, and fouling potential before RO.',
    desc2: 'May use coagulation/flocculation, DAF, dual-media filtration, ultrafiltration, and cartridge filters.',
    function: 'RO membrane protection by controlling turbidity, SDI, suspended solids, and biofouling risk.',
    equipment: 'Coagulant dosing, filters/UF, cartridge filters; typically low pressure, ambient temperature.'
  },
  hpPump: {
    title: 'High-Pressure Pumping',
    desc1: 'Raises pretreated seawater pressure high enough to overcome osmotic pressure and membrane losses.',
    desc2: 'For seawater RO, typical feed pressure is about 800–1,200 psig depending on salinity and recovery.',
    function: 'RO feed pressurization and flow control.',
    equipment: 'High-pressure pumps, booster pumps, VFDs, feed control valves; 800–1,200 psig typical.'
  },
  ro: {
    title: 'Reverse Osmosis Membrane Trains',
    desc1: 'Semi-permeable membranes separate low-salinity permeate from concentrated brine.',
    desc2: 'Typical seawater recovery is often 35–50%, subject to salinity, temperature, membrane design, and scaling limits.',
    function: 'Primary desalination by salt rejection across RO membrane elements.',
    equipment: 'Pressure vessels, RO elements, manifolds, instrumentation; HP feed with permeate near low pressure.'
  },
  post: {
    title: 'Post-Treatment',
    desc1: 'Stabilizes RO permeate to meet potable water quality and distribution requirements.',
    desc2: 'Includes remineralization, alkalinity/pH adjustment, disinfection, and final water quality monitoring.',
    function: 'Potable water conditioning, corrosion control, and final disinfection.',
    equipment: 'Calcite/limestone contactors, lime/CO2 dosing, NaOCl/UV, final analyzers.'
  },
  storage: {
    title: 'Potable Water Storage / Export',
    desc1: 'Stores finished water and transfers it to the distribution network or product header.',
    desc2: 'Includes clearwell tanks, transfer pumps, distribution pumps, metering, and residual disinfectant control.',
    function: 'Finished water inventory and delivery to users.',
    equipment: 'Potable water tanks, export pumps, meters, distribution header.'
  },
  erd: {
    title: 'Energy Recovery Device',
    desc1: 'Recovers hydraulic energy from high-pressure brine and transfers it to incoming RO feed.',
    desc2: 'Pressure exchangers or turbines substantially reduce specific power consumption in modern SWRO plants.',
    function: 'Energy recovery from RO concentrate.',
    equipment: 'Isobaric pressure exchanger, turbocharger, Pelton turbine, booster pump.'
  },
  brine: {
    title: 'Brine Discharge & Diffusers',
    desc1: 'Routes concentrated brine to an outfall system for controlled dilution and marine discharge.',
    desc2: 'Diffuser design manages mixing, plume behavior, and environmental permit compliance.',
    function: 'Safe disposal of RO concentrate back to the sea.',
    equipment: 'Brine header, outfall pipeline, diffuser ports, monitoring system.'
  },
  chemicals: {
    title: 'Chemical Dosing / CIP Systems',
    desc1: 'Supplies chemicals for pretreatment, RO scaling control, pH adjustment, disinfection, and cleaning.',
    desc2: 'Includes antiscalant, coagulant, acid/caustic, sodium hypochlorite, SMBS, and clean-in-place chemicals.',
    function: 'Chemical support for stable operation, membrane protection, and water quality control.',
    equipment: 'Storage tanks, dosing pumps, mixers, CIP skid, neutralization.'
  }
};

const streamData = {
  s1: { title: 'Raw Seawater', from: 'Ocean / intake basin', to: 'Seawater intake', purpose: 'Raw seawater enters the desalination plant battery limit.' },
  s2: { title: 'Screened Seawater', from: 'Intake screens', to: 'Pretreatment', purpose: 'Debris-screened seawater is routed to solids and fouling control.' },
  s3: { title: 'Conditioned RO Feed', from: 'Pretreatment', to: 'High-pressure pump', purpose: 'Filtered seawater with controlled SDI/turbidity feeds the RO system.' },
  s4: { title: 'High-Pressure RO Feed', from: 'High-pressure pump', to: 'RO membrane trains', purpose: 'Pressurized seawater is forced across semi-permeable membranes.' },
  s5: { title: 'RO Permeate', from: 'RO membranes', to: 'Post-treatment', purpose: 'Low-salinity product water requires stabilization and disinfection.' },
  s6: { title: 'Finished Water', from: 'Post-treatment', to: 'Potable water storage', purpose: 'Remineralized and disinfected water moves to storage.' },
  s7: { title: 'Potable Water Export', from: 'Storage', to: 'Distribution / product header', purpose: 'Finished potable water is pumped to consumers or utility header.' },
  s8: { title: 'High-Pressure Brine', from: 'RO membranes', to: 'Energy recovery device', purpose: 'Concentrated brine carries recoverable hydraulic energy.' },
  s9: { title: 'Depressurized Brine', from: 'Energy recovery device', to: 'Brine discharge', purpose: 'Brine leaves energy recovery and flows to the outfall system.' },
  s10: { title: 'Brine to Sea', from: 'Brine discharge', to: 'Marine diffusers', purpose: 'Concentrated brine is diluted and discharged under permit controls.' },
  s11: { title: 'Recovered Pressure Energy', from: 'Energy recovery device', to: 'RO feed / high-pressure system', purpose: 'Recovered energy reduces pump power demand.' },
  s12: { title: 'Chemical Injection', from: 'Chemical systems', to: 'Pretreatment / RO feed / post-treatment', purpose: 'Chemicals support coagulation, scale control, disinfection, pH control, and CIP.' }
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
      setOverlay('Click any block or stream', 'The diagram highlights the selected desalination section.', 'Use this as a high-level SWRO plant block diagram.');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
