'use strict';

const unitData = {
  eoFeed: { title:'EO Feed System', desc1:'Ethylene oxide from the oxidation unit is combined with recovered EO recycle before hydration.', function:'Receives fresh EO and recovered EO recycle for controlled feed to hydration.', conditions:'EO supply from upstream unit; recycle returned from recovery system.', equipment:'EO feed drum, metering, controls, recycle tie-in' },
  waterFeed: { title:'Process Water System', desc1:'Fresh and recycled water are supplied to maintain the EO hydration water ratio.', function:'Provides process water and absorbs recovered water recycle from evaporator/flash.', conditions:'Fresh water plus recycled water from flash/evaporator.', equipment:'Water feed tank, pumps, recycle line' },
  mixer: { title:'Feed Mixing', desc1:'EO and water are blended before entering the hydration reactor.', function:'Combines EO, water, and recycle streams at controlled ratio.', conditions:'Liquid-phase feed; controlled EO/water ratio.', equipment:'Static mixer, feed exchanger/pump, ratio control' },
  hydration: { title:'Hydration Reactor', desc1:'EO reacts with water to form MEG with smaller quantities of DEG and TEG.', function:'Converts ethylene oxide to mono-ethylene glycol.', conditions:'350–430°F; 150–300 psig.', equipment:'Hydration reactor; MEG-rich reactor effluent' },
  flash: { title:'Evaporator / Flash System', desc1:'Pressure is reduced to remove excess water and concentrate the glycol mixture.', function:'Water removal and recovery of unreacted EO/water for recycle.', conditions:'0–30 psig flash pressure; water vapor removed for recycle.', equipment:'Flash drum, evaporator, condensers, recycle pumps' },
  megColumn: { title:'MEG Fractionation Column', desc1:'Separates high-purity MEG from heavier glycols.', function:'Produces high-purity mono-ethylene glycol.', conditions:'150–250°F; 5–20 psig.', equipment:'MEG column, reboiler, condenser, MEG side draw/overhead' },
  heavyColumn: { title:'DEG / TEG Fractionation Column', desc1:'Separates heavier glycol co-products from MEG column bottoms.', function:'Recovers DEG and TEG products or by-product cuts.', conditions:'250–350°F; 5–15 psig.', equipment:'DEG/TEG column, reboiler, condenser, heavy glycol products' },
  coolFilter: { title:'MEG Cooling and Filtration', desc1:'Final MEG product is cooled and filtered before tankage.', function:'Finishes MEG product for storage and shipment.', conditions:'Product cooled to 80–120°F.', equipment:'Product cooler, filters, transfer pumps' },
  storage: { title:'MEG Product Storage', desc1:'Final MEG is routed to storage tanks and product loading.', function:'Stores and distributes high-purity MEG product.', conditions:'Ambient / cooled storage, typically 80–120°F product receipt.', equipment:'MEG tanks, loading pumps, transfer headers' },
  recycle: { title:'Recycle Recovery', desc1:'Recovered water and unreacted EO are returned to the feed section to maximize yield.', function:'Condenses, recovers, and recycles water and EO.', conditions:'Recovered vapors condensed; recycle to water/EO feed systems.', equipment:'Condensers, separators, recycle pumps, controls' }
};


const applicationData = [
  {
    area: 'Polyester Production — Largest Use',
    uses: 'PET resin for bottles, food packaging, and thermoformed trays; polyester fibers for textiles, apparel, carpets, and industrial yarns; BOPET films for packaging, electrical insulation, and solar panel back-sheets.',
    role: 'EG reacts with PTA or DMT to form PET and polyester intermediates; this is the dominant demand outlet for MEG.'
  },
  {
    area: 'Antifreeze & Coolants',
    uses: 'Automotive radiator antifreeze, aircraft de-icing fluids, HVAC heat-transfer fluids, chillers, and geothermal systems.',
    role: 'Provides freezing-point depression, boiling-point elevation, and heat-transfer performance in water-glycol blends.'
  },
  {
    area: 'Chemical Intermediates',
    uses: 'Unsaturated polyester resins for composites, fiberglass, and marine parts; alkyd resins for paints, coatings, and varnishes; plasticizers and specialty solvent formulations.',
    role: 'Serves as a reactive diol building block in condensation reactions and specialty chemical synthesis.'
  },
  {
    area: 'Industrial & Consumer Uses',
    uses: 'Water-glycol hydraulic fluids, electronics/data-center coolants, battery thermal management fluids, inks, adhesives, and personal-care humectant formulations.',
    role: 'Used where controlled viscosity, moisture retention, thermal stability, and heat-transfer properties are required.'
  }
];

const streamData = {
  s1:{ title:'EO Feed', from:'EO feed system', to:'Feed mixer', conditions:'Fresh EO plus recovered EO recycle to hydration feed.' },
  s2:{ title:'Process Water', from:'Water system', to:'Feed mixer', conditions:'Fresh and recovered process water to maintain hydration ratio.' },
  s3:{ title:'EO / Water Mixed Feed', from:'Feed mixer', to:'Hydration reactor', conditions:'Mixed liquid feed to reactor at hydration pressure.' },
  s4:{ title:'Reactor Effluent', from:'Hydration reactor', to:'Evaporator / flash', conditions:'MEG, DEG, TEG, excess water, trace EO; reactor outlet 350–430°F.' },
  s5:{ title:'Concentrated Glycol Mixture', from:'Evaporator / flash', to:'MEG column', conditions:'Excess water removed; glycol-rich feed to fractionation.' },
  s6:{ title:'MEG Product Cut', from:'MEG column', to:'MEG product routing', conditions:'High-purity MEG; MEG column 150–250°F and 5–20 psig.' },
  s7:{ title:'Heavy Glycol Bottoms', from:'MEG column', to:'DEG / TEG column', conditions:'DEG/TEG-rich bottoms routed to heavy glycol separation.' },
  s8:{ title:'DEG Product', from:'DEG / TEG column', to:'DEG product handling', conditions:'Separated DEG by-product.' },
  s9:{ title:'TEG Product', from:'DEG / TEG column', to:'TEG product handling', conditions:'Separated TEG/heavier glycol by-product.' },
  s10:{ title:'MEG to Finishing', from:'MEG column', to:'Cooling / filtration', conditions:'MEG routed to final cooling and filtration.' },
  s11:{ title:'Filtered MEG', from:'Cooling / filtration', to:'MEG storage', conditions:'Final MEG cooled to 80–120°F and filtered.' },
  s12:{ title:'Water / EO Recovery', from:'Evaporator / flash', to:'Recycle recovery', conditions:'Recovered water and unreacted EO condensed for recycle.' },
  s13:{ title:'Water Recycle', from:'Recycle recovery', to:'Process water system', conditions:'Recovered water returned to hydration feed.' },
  s14:{ title:'EO Recycle', from:'Recycle recovery', to:'EO feed system', conditions:'Recovered EO returned to feed system to improve yield.' }
};

function el(id){ return document.getElementById(id); }
function setOverlay(title, desc1){ const t=el('selectedTitle'), d=el('selectedDesc1'); if(t) t.textContent=title; if(d) d.textContent=desc1; }
function clearActive(){ document.querySelectorAll('.active').forEach(node=>node.classList.remove('active')); }
function populateTables(){
  const unitBody = document.querySelector('#unitSummaryTable tbody');
  const streamBody = document.querySelector('#streamSummaryTable tbody');
  if(unitBody){ unitBody.innerHTML = Object.values(unitData).map(u=>`<tr><td>${u.title}</td><td>${u.function}</td><td>${u.conditions}</td><td>${u.equipment}</td></tr>`).join(''); }
  const appBody = document.querySelector('#applicationSummaryTable tbody');
  if(appBody){ appBody.innerHTML = applicationData.map(a=>`<tr><td>${a.area}</td><td>${a.uses}</td><td>${a.role}</td></tr>`).join(''); }
  if(streamBody){ streamBody.innerHTML = Object.values(streamData).map(s=>`<tr><td>${s.title}</td><td>${s.from}</td><td>${s.to}</td><td>${s.conditions}</td></tr>`).join(''); }
}
function bindDiagramEvents(){
  document.querySelectorAll('.unit-block').forEach(block=>{
    block.addEventListener('click',()=>{ const item=unitData[block.dataset.unit]; if(!item) return; clearActive(); block.classList.add('active'); setOverlay(item.title, item.desc1); });
  });
  Object.keys(streamData).forEach(id=>{ const stream=el(id); if(!stream) return; stream.addEventListener('click',()=>{ const item=streamData[id]; clearActive(); stream.classList.add('active'); setOverlay(item.title, `${item.from} → ${item.to}. ${item.conditions}`); }); });
}
function bindButtons(){
  const btnAnimate=el('btnAnimate'), btnReset=el('btnReset');
  if(btnAnimate) btnAnimate.addEventListener('click',()=>{ document.body.classList.toggle('flow-paused'); btnAnimate.textContent = document.body.classList.contains('flow-paused') ? 'Resume Flow' : 'Pause Flow'; });
  if(btnReset) btnReset.addEventListener('click',()=>{ clearActive(); setOverlay('Click any block or stream','The diagram highlights the selected ethylene glycol process section.'); });
}
document.addEventListener('DOMContentLoaded',()=>{ populateTables(); bindDiagramEvents(); bindButtons(); });
