'use strict';

const unitData = {
  ethylene: { title: 'Ethylene Feed', desc1: 'Ethylene is supplied as the primary reactant for EO production.', desc2: 'Feed rate is ratio-controlled with oxygen and recycle gas to maintain safe reactor composition.', function: 'Supplies ethylene reactant to the oxidation loop.', equipment: 'Feed filters, flow control, analyzers, shutdown/interlock valves' },
  oxygen: { title: 'Oxygen Feed', desc1: 'Oxygen or air is added in controlled proportion for partial oxidation.', desc2: 'Oxygen concentration is tightly controlled below flammability and safety limits.', function: 'Provides oxidant for catalytic EO reaction.', equipment: 'O₂ metering, analyzers, ratio control, trip valves' },
  mixer: { title: 'Feed Mixer', desc1: 'Combines ethylene, oxygen, and purified recycle gas.', desc2: 'Stable mixing and composition control protect against explosive mixtures and reactor hot spots.', function: 'Creates conditioned reactor feed mixture.', equipment: 'Static mixer, feed header, analyzers, control valves' },
  feedEffluent: { title: 'Feed–Effluent Heat Exchanger', desc1: 'Uses hot reactor effluent to preheat fresh reactor feed.', desc2: 'Improves energy efficiency before the feed enters the fixed-bed reactor.', function: 'Preheats reactor feed and recovers heat from effluent.', equipment: 'Shell-and-tube exchanger, bypass, temperature control' },
  reactor: { title: 'Fixed-Bed Silver-Catalyst Reactor', desc1: 'Ethylene is partially oxidized to ethylene oxide over a silver catalyst.', desc2: 'Side reactions produce CO₂ and water; temperature control is critical for selectivity.', function: 'Main EO synthesis reactor.', equipment: 'Tubular fixed-bed reactor, silver catalyst, coolant circuit, hot-spot monitoring' },
  cooling: { title: 'Effluent Cooling / Knockout', desc1: 'Cools reactor effluent before EO absorption.', desc2: 'Condensables and liquid carryover can be separated before the absorber.', function: 'Conditions reactor effluent for water absorption.', equipment: 'Effluent cooler, separator / knockout drum, temperature control' },
  absorber: { title: 'EO Absorber', desc1: 'Ethylene oxide is selectively absorbed from reactor effluent into circulating water.', desc2: 'Unabsorbed gas containing ethylene, CO₂, and inerts exits overhead for purification and recycle.', function: 'Recovers EO into water phase.', equipment: 'Water-circulated absorber column, pumps, coolers, demister' },
  cru: { title: 'CO₂ Removal Unit', desc1: 'Removes CO₂ from unabsorbed reactor gas before recycle.', desc2: 'Common systems use carbonate or amine treating with regeneration.', function: 'Controls CO₂ buildup and purifies recycle gas.', equipment: 'Absorber/regenerator, solvent circulation, coolers, KO drums' },
  recycle: { title: 'Recycle Gas Compressor / Purge', desc1: 'Returns unreacted ethylene-rich gas to the reactor feed system.', desc2: 'A purge prevents inert buildup and routes non-recovered gases to fuel gas or flare.', function: 'Maintains EO loop material balance and recovers reactants.', equipment: 'Recycle compressor, purge control, analyzers, fuel gas tie-in' },
  purge: { title: 'Purge / Vent Handling', desc1: 'Removes inert gases and light components from the EO loop.', desc2: 'Purge gas may be recovered, routed to fuel gas, thermal oxidation, or flare depending on design.', function: 'Controls inert buildup and safe disposal.', equipment: 'Purge valve, recovery unit, fuel gas / flare connection' },
  stripper: { title: 'EO Stripper', desc1: 'EO-rich water is stripped to recover ethylene oxide vapor.', desc2: 'Lean water is recycled back to the absorber after cooling and conditioning.', function: 'Desorbs EO from water absorbent.', equipment: 'Stripper column, reboiler, condenser, lean-water pump' },
  eoCompress: { title: 'EO Compression / Condensation', desc1: 'EO vapor is compressed and condensed for downstream purification.', desc2: 'System is designed for safe EO handling with temperature and pressure control.', function: 'Converts EO vapor into condensed intermediate product.', equipment: 'EO compressor, condenser, receiver, safeguards' },
  refining: { title: 'EO Refining', desc1: 'Removes moisture, aldehydes, and heavy impurities from crude EO.', desc2: 'Produces purified EO suitable for storage or downstream ethoxylation/MEG service.', function: 'Purifies crude EO to product specification.', equipment: 'Refining column, driers, condensers, impurity purge' },
  storage: { title: 'Refrigerated EO Storage', desc1: 'Purified EO is cooled and stored in refrigerated tanks.', desc2: 'Storage uses strict temperature, inerting, pressure relief, and contamination control.', function: 'Safe storage of purified EO product.', equipment: 'Refrigerated tanks, nitrogen padding, refrigeration, relief/scrubber systems' },
  product: { title: 'EO Product Distribution', desc1: 'Ethylene oxide product is transferred to downstream users or shipment.', desc2: 'EO is commonly consumed in ethylene glycol, ethoxylates, ethanolamines, and sterilant applications.', function: 'Final product transfer and logistics.', equipment: 'Transfer pumps, loading system, metering, product analyzers' }
};

const streamData = {
  s1: { title: 'Ethylene Feed', from: 'Ethylene supply', to: 'Feed mixer', purpose: 'Provides ethylene reactant for EO synthesis.' },
  s2: { title: 'Oxygen Feed', from: 'Oxygen / air supply', to: 'Feed mixer', purpose: 'Provides controlled oxidant for partial oxidation.' },
  s3: { title: 'Mixed Feed', from: 'Feed mixer', to: 'Feed-effluent exchanger', purpose: 'Reactor feed blend enters heat recovery exchanger.' },
  s4: { title: 'Preheated Feed', from: 'Feed-effluent exchanger', to: 'Fixed-bed reactor', purpose: 'Conditioned feed enters silver-catalyst reactor.' },
  s5: { title: 'Reactor Effluent', from: 'Fixed-bed reactor', to: 'Effluent cooling', purpose: 'Hot gas contains EO, unreacted ethylene, CO₂, water, and inerts.' },
  s6: { title: 'Cooled Effluent', from: 'Effluent cooling', to: 'EO absorber', purpose: 'Cooled gas is routed to water absorption.' },
  s7: { title: 'Unabsorbed Gas', from: 'EO absorber overhead', to: 'CO₂ removal unit', purpose: 'Gas contains CO₂, unreacted ethylene, and inerts.' },
  s8: { title: 'CO₂-Lean Recycle Gas', from: 'CO₂ removal unit', to: 'Recycle gas compressor', purpose: 'Purified gas is prepared for recycle to the feed mixer.' },
  s9: { title: 'Purge Gas', from: 'Recycle gas system', to: 'Purge / vent handling', purpose: 'Controls inert buildup in the reaction loop.' },
  s10: { title: 'Recovered Recycle Gas', from: 'Recycle gas compressor', to: 'Feed mixer', purpose: 'Returns ethylene-rich gas to reactor feed.' },
  s11: { title: 'Direct Recycle Tie-in', from: 'CO₂ removal unit', to: 'Feed mixer', purpose: 'Represents purified gas recycle path to feed blending.' },
  s12: { title: 'EO-Rich Water', from: 'EO absorber bottoms', to: 'EO stripper', purpose: 'Absorbed EO is carried in circulating water.' },
  s13: { title: 'EO Vapor', from: 'EO stripper', to: 'EO compression', purpose: 'EO is desorbed from water as vapor.' },
  s14: { title: 'Condensed EO', from: 'EO compression', to: 'EO refining', purpose: 'Compressed EO is condensed for purification.' },
  s15: { title: 'Purified EO', from: 'EO refining', to: 'Refrigerated storage', purpose: 'On-spec EO transfers to safe refrigerated storage.' },
  s16: { title: 'Stored EO Product', from: 'EO storage', to: 'Product distribution', purpose: 'Product leaves storage for downstream use or shipment.' },
  s17: { title: 'EO Shipment', from: 'Product distribution', to: 'Battery limit', purpose: 'Final ethylene oxide product export.' },
  s18: { title: 'Lean Water Recycle', from: 'EO stripper', to: 'EO absorber', purpose: 'Water absorbent returns to the absorber loop.' }
};

function safeText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function setOverlay(title, desc1, desc2) { safeText('selectedTitle', title); safeText('selectedDesc1', desc1); safeText('selectedDesc2', desc2); }
function clearActive() { document.querySelectorAll('.active').forEach(el => el.classList.remove('active')); }
function populateTables() {
  const unitBody = document.querySelector('#unitSummaryTable tbody');
  const streamBody = document.querySelector('#streamSummaryTable tbody');
  if (unitBody) unitBody.innerHTML = Object.values(unitData).map(unit => `<tr><td>${unit.title}</td><td>${unit.function}</td><td>${unit.equipment}</td></tr>`).join('');
  if (streamBody) streamBody.innerHTML = Object.values(streamData).map(stream => `<tr><td>${stream.title}</td><td>${stream.from}</td><td>${stream.to}</td><td>${stream.purpose}</td></tr>`).join('');
}
function bindDiagramEvents() {
  document.querySelectorAll('.unit-block').forEach(block => {
    block.addEventListener('click', () => {
      const item = unitData[block.dataset.unit]; if (!item) return;
      clearActive(); block.classList.add('active'); setOverlay(item.title, item.desc1, item.desc2);
    });
  });
  Object.keys(streamData).forEach(id => {
    const stream = document.getElementById(id); if (!stream) return;
    stream.addEventListener('click', () => {
      const item = streamData[id]; clearActive(); stream.classList.add('active'); setOverlay(item.title, `${item.from} → ${item.to}`, item.purpose);
    });
  });
}
function bindButtons() {
  const btnAnimate = document.getElementById('btnAnimate');
  const btnReset = document.getElementById('btnReset');
  if (btnAnimate) btnAnimate.addEventListener('click', () => { document.body.classList.toggle('flow-paused'); btnAnimate.textContent = document.body.classList.contains('flow-paused') ? 'Resume Flow' : 'Pause Flow'; });
  if (btnReset) btnReset.addEventListener('click', () => { clearActive(); setOverlay('Click any block or stream', 'EO oxidation, recovery, purification, and storage flowsheet.', 'Use Pause Flow to stop animation.'); });
}
document.addEventListener('DOMContentLoaded', () => { populateTables(); bindDiagramEvents(); bindButtons(); });
