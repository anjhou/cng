'use strict';

const unitData = {
  crude: {
    title: 'Crude Feed, Desalter & Preheat',
    desc1: 'Receives about 300 kbpd fresh crude, removes salts/water, and recovers heat before the CDU furnace.',
    desc2: 'Main interfaces: crude tanks, desalter, preheat train, furnace, CDU feed inlet.',
    function: 'Prepare fresh crude feed for atmospheric fractionation.',
    equipment: 'Crude tanks, charge pumps, desalter, exchangers, fired heater'
  },
  cdu: {
    title: 'Crude Distillation Unit (CDU)',
    desc1: 'Separates desalted crude into LPG/naphtha overhead, naphtha, kerosene, gas oils, and atmospheric residue.',
    desc2: 'CDU side draws feed the hydrotreating train; atmospheric residue feeds the VDU.',
    function: 'Primary atmospheric separation of 300 kbpd crude into straight-run cuts.',
    equipment: 'Atmospheric tower, side strippers, pumparounds, overhead system, furnace'
  },
  vdu: {
    title: 'Vacuum Distillation Unit (VDU)',
    desc1: 'Processes atmospheric residue to recover LVGO/HVGO while minimizing thermal cracking.',
    desc2: 'Vacuum residue is routed to asphalt/fuel oil or optional residue upgrading.',
    function: 'Recover vacuum gas oils and separate vacuum residue from CDU bottoms.',
    equipment: 'Vacuum tower, vacuum system, wash section, fired heater, residue pumps'
  },
  nht: {
    title: 'Naphtha Hydrotreater (NHT)',
    desc1: 'Treats light/heavy naphtha to remove sulfur, nitrogen, metals, and olefins.',
    desc2: 'Hydrotreated heavy naphtha is routed to the catalytic reformer; light naphtha can route to isomerization or gasoline blending if added later.',
    function: 'Clean naphtha feed to protect reformer catalyst and improve gasoline blend stability.',
    equipment: 'Feed/effluent exchangers, reactor, separator, stripper, recycle gas compressor'
  },
  kero: {
    title: 'Kerosene / Jet Hydrotreater',
    desc1: 'Treats kerosene to meet jet/kerosene sulfur, mercaptan, smoke point, and freezing point constraints.',
    desc2: 'Product is routed to the jet/kerosene pool after fractionation and quality control.',
    function: 'Produce on-spec jet/kerosene blending component.',
    equipment: 'Hydrotreating reactor, stripper, fractionator, H₂ recycle, sulfur handling tie-in'
  },
  diesel: {
    title: 'Diesel Hydrotreater',
    desc1: 'Deep-desulfurizes LGO and selected gas oils to ULSD-range sulfur specification.',
    desc2: 'Hydrogen consumption depends on crude sulfur, feed endpoint, and severity.',
    function: 'Produce low-sulfur diesel blendstock with improved cetane and stability.',
    equipment: 'Reactor system, recycle compressor, hot/cold separators, stripper, fractionator'
  },
  vgo: {
    title: 'VGO Hydrotreater / Conversion Tie',
    desc1: 'Treats LVGO/HVGO before FCC, hydrocracker, or other conversion service where installed.',
    desc2: 'In a simplified block diagram, VGO may route to diesel blend, external conversion, or future FCC/HCU blocks.',
    function: 'Upgrade vacuum gas oil quality and protect downstream conversion catalysts.',
    equipment: 'High-pressure reactor system, separators, stripper, H₂ recycle compressor'
  },
  reformer: {
    title: 'Catalytic Reformer',
    desc1: 'Converts hydrotreated naphtha into high-octane reformate and produces H₂-rich off-gas.',
    desc2: 'Severity balances gasoline octane, aromatics feed to BTX recovery, and hydrogen make.',
    function: 'Increase gasoline octane and generate hydrogen for refinery hydrotreaters.',
    equipment: 'Reactor train, fired heaters, stabilizer, compressor, H₂ recovery interface'
  },
  aromatics: {
    title: 'Aromatics Complex',
    desc1: 'Processes reformate or a C7–C9 heart cut to recover petrochemical-grade benzene, toluene, and xylenes.',
    desc2: 'Extraction, fractionation, isomerization, and transalkylation can be configured around the target product slate.',
    function: 'Shift reformate value into petrochemical aromatics and return raffinate as blendstock where allowed.',
    equipment: 'Extraction unit, clay treater, splitters, xylene loop, isomerization, transalkylation'
  },
  alky: {
    title: 'Alkylation Unit',
    desc1: 'Converts isobutane and C3/C4 olefins into high-octane, low-RVP, low-sulfur alkylate.',
    desc2: 'Alkylate supports gasoline octane when aromatics content is constrained.',
    function: 'Produce premium gasoline blendstock from light olefins and isobutane.',
    equipment: 'Reactor/contactor, acid regeneration, deisobutanizer, product fractionation'
  },
  gasoline: {
    title: 'Gasoline Pool',
    desc1: 'Blends reformate, alkylate, raffinate, and other gasoline components to meet octane, RVP, sulfur, benzene, and aromatics limits.',
    desc2: 'Receives aromatics-lean raffinate depending on product specs and petrochemical extraction severity.',
    function: 'Finalize gasoline blending components into marketable gasoline.',
    equipment: 'Blend headers, component tanks, analyzers, additives, product rundown'
  },
  middle: {
    title: 'Jet / Diesel Product Pools',
    desc1: 'Receives hydrotreated kerosene and diesel blendstocks for final product blending.',
    desc2: 'Jet pool controls freezing point, smoke point, sulfur, flash point, and distillation; diesel pool controls sulfur, cetane, density, and cold-flow properties.',
    function: 'Blend on-spec middle distillate products.',
    equipment: 'Blend tanks, product analyzers, additive systems, product pumps'
  },
  residue: {
    title: 'Residue / Asphalt / Fuel Oil',
    desc1: 'Handles vacuum residue as asphalt, fuel oil, or feed to external residue upgrading.',
    desc2: 'Optional future blocks can include coker, visbreaker, solvent deasphalting, or residue hydrocracker.',
    function: 'Manage heavy residue disposition and minimize low-value bottoms.',
    equipment: 'Residue tanks, asphalt handling, fuel oil blending, external upgrading tie-ins'
  },
  sgp: {
    title: 'Sour Gas Plant (SGP)',
    desc1: 'Treats sour off-gases from CDU/VDU, hydrotreaters, reformer, and fuel gas systems.',
    desc2: 'Amine treats gas; Claus SRU converts H₂S to sulfur; TGTU polishes tail gas for emissions compliance.',
    function: 'Remove acid gases, recover elemental sulfur, and return treated fuel gas.',
    equipment: 'Amine absorbers/regenerators, SRU Claus trains, TGTU, sulfur pit/loading, fuel gas KO'
  },
  h2: {
    title: 'Hydrogen Network',
    desc1: 'Balances reformer hydrogen make with hydrotreating demand; optional SMR H₂ plant supplements the balance.',
    desc2: 'Consumers include NHT, Kero HDS, Diesel HDS, VGO HDS, and any future hydrocracking service.',
    function: 'Recover, distribute, and supplement refinery hydrogen.',
    equipment: 'H₂ recovery, PSA/membrane, compressors, headers, optional SMR H₂ plant'
  }
};

const streamData = {
  s1: { title: 'Fresh Crude Feed', from: 'Crude supply / storage', to: 'Crude feed system', purpose: '300 kbpd fresh crude enters the refinery battery limit.' },
  s2: { title: 'Desalted Crude', from: 'Desalter / preheat train', to: 'CDU', purpose: 'Prepared crude feed enters atmospheric distillation.' },
  s3: { title: 'Straight-Run Naphtha', from: 'CDU', to: 'Naphtha hydrotreater', purpose: 'Light/heavy naphtha routed for sulfur/nitrogen removal before reforming or blending.' },
  s4: { title: 'Kerosene Cut', from: 'CDU', to: 'Kero / Jet HDS', purpose: 'Kerosene draw is hydrotreated to meet jet/kerosene specifications.' },
  s5: { title: 'LGO / HGO', from: 'CDU', to: 'Diesel HDS', purpose: 'Gas oil streams are hydrotreated into low-sulfur diesel blendstocks.' },
  s6: { title: 'Atmospheric Residue', from: 'CDU bottoms', to: 'VDU', purpose: 'Atmospheric residue is vacuum distilled to recover gas oil and residue products.' },
  s7: { title: 'LVGO / HVGO', from: 'VDU', to: 'VGO HDS / conversion tie', purpose: 'Vacuum gas oils are treated for conversion service, diesel blending, or external upgrading.' },
  s8: { title: 'Vacuum Residue', from: 'VDU', to: 'Residue / asphalt / fuel oil', purpose: 'Heavy residue is sent to asphalt, fuel oil, or optional residue upgrading.' },
  s9: { title: 'Hydrotreated Naphtha', from: 'Naphtha hydrotreater', to: 'Catalytic reformer', purpose: 'Clean naphtha feed protects reformer catalyst and enables high-octane reformate production.' },
  s10: { title: 'Reformate to Aromatics', from: 'Catalytic reformer', to: 'Aromatics complex', purpose: 'Aromatics-rich reformate or heart-cut feeds BTX recovery.' },
  s11: { title: 'Reformate to Gasoline Pool', from: 'Catalytic reformer', to: 'Gasoline pool', purpose: 'High-octane reformate supports gasoline blending.' },
  s12: { title: 'Benzene Product', from: 'Aromatics complex', to: 'Petrochemical product handling', purpose: 'Recovered petrochemical-grade benzene.' },
  s13: { title: 'Toluene Product', from: 'Aromatics complex', to: 'Petrochemical product handling', purpose: 'Recovered toluene or transalkylation feed/product.' },
  s14: { title: 'Xylenes Product', from: 'Aromatics complex', to: 'Petrochemical product handling', purpose: 'Recovered mixed xylenes or para-xylene-rich product.' },
  s15: { title: 'Finished Gasoline', from: 'Gasoline pool', to: 'Gasoline storage/export', purpose: 'Blended gasoline product leaves the refinery blending system.' },
  s16: { title: 'Alkylate', from: 'Alkylation unit', to: 'Gasoline pool', purpose: 'Premium low-sulfur, high-octane gasoline component.' },
  s17: { title: 'LPG / Olefins / Isobutane Feed', from: 'Gas plant and light ends', to: 'Alkylation unit', purpose: 'Isobutane and C3/C4 olefins feed alkylate production.' },
  s18: { title: 'Hydrotreated Jet Blendstock', from: 'Kero / Jet HDS', to: 'Jet / diesel pools', purpose: 'On-spec kerosene routed to jet/kerosene product pool.' },
  s19: { title: 'Hydrotreated Diesel Blendstock', from: 'Diesel HDS', to: 'Jet / diesel pools', purpose: 'Low-sulfur diesel blendstock routed to diesel product blending.' },
  s20: { title: 'Jet Product', from: 'Jet / diesel pools', to: 'Jet storage/export', purpose: 'Finished jet/kerosene product.' },
  s21: { title: 'Diesel Product', from: 'Jet / diesel pools', to: 'Diesel storage/export', purpose: 'Finished ULSD product.' },
  s22: { title: 'NHT Sour Off-Gas', from: 'Naphtha hydrotreater', to: 'Sour gas plant', purpose: 'Hydrotreater acid gas and sour off-gas routed to amine/SRU systems.' },
  s23: { title: 'Hydrotreater Sour Off-Gas', from: 'Diesel / gas oil hydrotreaters', to: 'Sour gas plant', purpose: 'H₂S-bearing off-gas is treated before fuel gas use or sulfur recovery.' },
  s24: { title: 'Reformer Off-Gas to Fuel Gas Treating', from: 'Catalytic reformer', to: 'Sour gas plant / fuel gas system', purpose: 'Off-gas is recovered for hydrogen or treated as fuel gas.' },
  s25: { title: 'Elemental Sulfur', from: 'SRU / TGTU', to: 'Sulfur storage/export', purpose: 'Recovered sulfur product from H₂S conversion.' },
  s26: { title: 'Treated Fuel Gas', from: 'Amine treating', to: 'Refinery fuel gas header', purpose: 'Sweetened gas is returned to the refinery fuel system.' },
  s27: { title: 'Reformer Hydrogen Make', from: 'Catalytic reformer', to: 'Hydrogen network', purpose: 'H₂-rich reformer off-gas supplies the hydrogen balance.' },
  s28: { title: 'Hydrogen to VGO HDS', from: 'Hydrogen network', to: 'VGO HDS', purpose: 'Hydrogen supports gas oil hydrotreating severity and catalyst protection.' },
  s29: { title: 'Hydrogen to Diesel HDS', from: 'Hydrogen network', to: 'Diesel HDS', purpose: 'Hydrogen supports deep desulfurization to ULSD specs.' },
  s30: { title: 'Hydrogen to Kero HDS', from: 'Hydrogen network', to: 'Kero / Jet HDS', purpose: 'Hydrogen supports mercaptan/sulfur removal and stability improvement.' },
  s31: { title: 'Hydrogen to NHT', from: 'Hydrogen network', to: 'Naphtha hydrotreater', purpose: 'Hydrogen removes sulfur/nitrogen and saturates olefins upstream of reformer.' }
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
        'The diagram highlights the selected refinery process section.',
        'Use this as a high-level 300 kbpd refinery block diagram.'
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
