'use strict';

const unitData = {
  intake: { title: 'River Water Intake & Screening', desc1: 'Raw river water is pumped through coarse and fine screens to remove debris.', desc2: 'Protects the clarification train from trash, leaves, sticks, and large suspended solids.', function: 'Raw water withdrawal and gross debris removal.', equipment: 'Intake pumps, traveling screens, coarse/fine screens, intake channel.' },
  coag: { title: 'Coagulation', desc1: 'Rapid mixing disperses coagulant to destabilize suspended and colloidal solids.', desc2: 'Typical chemicals include alum, ferric chloride, polymer, acid/caustic for pH control.', function: 'Destabilize colloids and promote particle agglomeration.', equipment: 'Rapid mixer, chemical dosing skids, pH control; typical retention: seconds to minutes.' },
  floc: { title: 'Flocculation', desc1: 'Gentle mixing grows larger floc particles for improved settling.', desc2: 'Polymer may be added to improve floc strength and clarifier performance.', function: 'Grow settleable flocs from coagulated suspended solids.', equipment: 'Flocculation basins, slow mixers, polymer dosing; typical retention: 15–45 min.' },
  sediment: { title: 'Sedimentation / Clarifier', desc1: 'Settles flocculated suspended solids and removes sludge from the bottom.', desc2: 'Produces clarified water as the common base feed for downstream systems.', function: 'Remove suspended solids and generate clarified water.', equipment: 'Clarifier, lamella plates, sludge scraper, blowdown pumps; low turbidity clarified effluent.' },
  clarified: { title: 'Clarified Water Header / Tank', desc1: 'Clarified water is collected as the common feed for cooling, potable, and demineralized water systems.', desc2: 'This is the central distribution point for downstream water treatment branches.', function: 'Intermediate storage and distribution of clarified water.', equipment: 'Clarified water tank, transfer pumps, distribution headers.' },
  cwFilter: { title: 'Cooling Water Filtration', desc1: 'Clarified water is filtered through strainers or multimedia filters before chemical conditioning.', desc2: 'Cooling water requires lower purity than potable or demin water but must control solids and fouling.', function: 'Remove remaining particles for cooling-tower makeup service.', equipment: 'Strainers, multimedia filters, side-stream filters; target low suspended solids.' },
  cwChem: { title: 'Cooling Water Chemical Conditioning', desc1: 'Scale inhibitor, corrosion inhibitor, and biocide are dosed into cooling water makeup.', desc2: 'Chemical program protects heat exchangers, cooling tower fill, and circulating-water piping.', function: 'Control scaling, corrosion, biological fouling, and deposition.', equipment: 'Chemical tanks, metering pumps, analyzers, blowdown control.' },
  coolingTower: { title: 'Cooling Tower / Circulating Water', desc1: 'Conditioned water is used as cooling-tower makeup and circulated through heat exchangers.', desc2: 'System includes makeup, circulating pumps, cooling tower, blowdown, and heat-exchange users.', function: 'Supply cooling duty to process heat exchangers.', equipment: 'Cooling tower, basin, makeup header, circulating pumps, heat exchangers.' },
  potFilter: { title: 'Potable Water Filtration', desc1: 'Clarified water is polished through rapid sand filters and optional activated carbon.', desc2: 'Removes fine turbidity, taste, odor, and trace organics before disinfection.', function: 'Polish water for drinking-water treatment.', equipment: 'Rapid sand filters, activated carbon filters, backwash system.' },
  disinfection: { title: 'Disinfection & pH Adjustment', desc1: 'Chlorine or UV disinfects water; pH adjustment stabilizes finished water.', desc2: 'Chlorine residual control may be included for distribution system protection.', function: 'Pathogen control and finished-water stabilization.', equipment: 'Chlorination or UV, caustic/lime/CO₂ dosing, residual analyzer.' },
  potableStorage: { title: 'Potable Water Storage / Distribution', desc1: 'Finished potable water is stored in a clearwell or product tank.', desc2: 'Distribution pumps send water to domestic, utility, or community users.', function: 'Store and distribute drinking-quality water.', equipment: 'Clearwell, potable tank, transfer pumps, distribution header.' },
  uf: { title: 'Ultrafiltration', desc1: 'Clarified water is polished through UF membranes to remove fine particles and colloids.', desc2: 'UF protects downstream RO from fouling and stabilizes feed quality.', function: 'Fine solids and colloid removal upstream of RO.', equipment: 'UF membrane skids, backwash, chemically enhanced backwash, filtrate tank.' },
  ro: { title: 'Reverse Osmosis', desc1: 'RO removes most dissolved salts from UF filtrate to produce low-conductivity permeate.', desc2: 'RO reject is routed to waste or recycle depending on plant design.', function: 'Bulk dissolved solids removal for demineralized water production.', equipment: 'High-pressure pump, RO pressure vessels, CIP system, antiscalant dosing.' },
  edi: { title: 'Ion Exchange / EDI Polisher', desc1: 'Final polishing reduces conductivity and silica to ultra-low levels.', desc2: 'Product water is suitable for boilers and high-purity industrial applications.', function: 'Final ionic and silica polishing.', equipment: 'Mixed-bed ion exchange or EDI, regenerant systems or DC power supply.' },
  deminStorage: { title: 'Demin Water Storage / Export', desc1: 'High-purity demineralized water is stored and pumped to boilers or process users.', desc2: 'Typically monitored for conductivity, silica, sodium, pH, and TOC where required.', function: 'Store and distribute high-purity water.', equipment: 'Demin tank, nitrogen blanket if required, transfer pumps, polish loop.' },
  waste: { title: 'Waste / Reject Handling', desc1: 'Collects sludge, filter backwash, UF backwash, and RO reject streams.', desc2: 'Streams may be sent to wastewater treatment, sludge handling, or permitted discharge.', function: 'Handle residual solids, backwash, and reject water.', equipment: 'Sludge pumps, thickener, waste neutralization, reject tank.' }
};

const streamData = {
  s1: { title: 'Raw River Water', from: 'River', to: 'Intake screens', purpose: 'Raw water enters the plant battery limit.' },
  s2: { title: 'Screened River Water', from: 'Intake screens', to: 'Coagulation', purpose: 'Debris-free water enters chemical destabilization.' },
  s3: { title: 'Coagulated Water', from: 'Coagulation', to: 'Flocculation', purpose: 'Coagulated particles move to slow mixing for floc growth.' },
  s4: { title: 'Flocculated Water', from: 'Flocculation', to: 'Sedimentation', purpose: 'Large flocs are routed to settling.' },
  s5: { title: 'Clarified Water', from: 'Sedimentation', to: 'Clarified water tank/header', purpose: 'Suspended-solids-reduced water becomes the base feed for downstream systems.' },
  s6: { title: 'Clarified Water Users', from: 'Clarified water header', to: 'General clarified water users', purpose: 'Clarified water can be exported directly to low-purity users.' },
  s7: { title: 'Clarified Water to Cooling Water', from: 'Clarified water header', to: 'Cooling water filtration', purpose: 'Branch feed for cooling-tower makeup conditioning.' },
  s8: { title: 'Clarified Water to Potable Water', from: 'Clarified water header', to: 'Potable filtration', purpose: 'Branch feed for drinking-water production.' },
  s9: { title: 'Clarified Water to Demin Water', from: 'Clarified water header', to: 'Ultrafiltration', purpose: 'Branch feed for high-purity demineralized water production.' },
  s10: { title: 'Filtered Cooling Water Makeup', from: 'CW filtration', to: 'CW chemical conditioning', purpose: 'Filtered clarified water enters chemical dosing.' },
  s11: { title: 'Conditioned Cooling Water', from: 'CW chemical conditioning', to: 'Cooling tower', purpose: 'Chemically conditioned water is used as cooling-tower makeup.' },
  s12: { title: 'Cooling Water Product', from: 'Cooling tower', to: 'Heat-exchange system', purpose: 'Cooling water makeup supports circulating cooling-water service.' },
  s13: { title: 'Filtered Potable Water', from: 'Rapid sand/carbon filtration', to: 'Disinfection', purpose: 'Polished water enters microbial control and pH adjustment.' },
  s14: { title: 'Finished Potable Water', from: 'Disinfection', to: 'Potable storage', purpose: 'Drinking-quality water is routed to storage.' },
  s15: { title: 'Potable Water Export', from: 'Potable storage', to: 'Distribution', purpose: 'Potable water is pumped to users.' },
  s16: { title: 'UF Filtrate', from: 'Ultrafiltration', to: 'RO system', purpose: 'Fine-particle-polished water enters RO desalting.' },
  s17: { title: 'RO Permeate', from: 'RO system', to: 'IX / EDI polisher', purpose: 'Low-TDS permeate receives final ionic polishing.' },
  s18: { title: 'Polished Demin Water', from: 'IX / EDI polisher', to: 'Demin storage', purpose: 'Ultra-low-conductivity product enters high-purity storage.' },
  s19: { title: 'Demin Water Export', from: 'Demin storage', to: 'Boilers / high-purity users', purpose: 'Demin water is delivered to boilers and industrial applications.' },
  s20: { title: 'Clarifier Sludge', from: 'Sedimentation', to: 'Waste handling', purpose: 'Settled solids are removed for sludge handling.' },
  s21: { title: 'RO Reject / Filter Backwash', from: 'RO / filters / UF', to: 'Waste handling', purpose: 'Reject and backwash streams are collected for treatment or disposal.' }
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
      setOverlay('Click any block or stream', 'The diagram highlights the selected water treatment section.', 'Use this as a high-level utility water block diagram.');
    });
  }
}
document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
