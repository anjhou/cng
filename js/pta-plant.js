'use strict';

const unitData = {
  feed: { title: 'Feed Preparation', desc1: 'p-Xylene, acetic acid solvent, and Co–Mn–Br catalyst are metered to the oxidation loop.', desc2: 'Feed quality and solvent/catalyst balance control oxidation performance.', function: 'Prepare and meter p-xylene, solvent, and catalyst to the oxidation reactor.', equipment: 'Feed tanks, pumps, catalyst addition, solvent recycle tie-in', conditions: 'Feed typically near 100–180 °F before reactor preheat; acetic acid recycle integrated with mother liquor recovery.' },
  oxidation: { title: 'Oxidation Reactor', desc1: 'p-Xylene is oxidized in acetic acid solvent to crude terephthalic acid and water.', desc2: 'Co–Mn–Br catalyst system; oxygen supplied with air or enriched air.', function: 'Liquid-phase catalytic oxidation of p-xylene to CTA slurry.', equipment: 'Agitated oxidation reactor, air sparger, heat removal, off-gas condenser/scrubber', conditions: '430–500 °F; 300–450 psig; acetic acid solvent; Co/Mn/Br catalyst.' },
  flasher: { title: 'Slurry Flasher', desc1: 'Hot oxidation slurry is depressurized to remove off-gas and recover volatile solvent.', desc2: 'Off-gas contains COx, nitrogen/oxygen/inerts, water, and acetic acid vapor traces.', function: 'Pressure letdown, vapor disengagement, and solvent/off-gas handling.', equipment: 'Flash vessel, condensers, vent treatment, solvent recovery', conditions: '150–250 psig after letdown; hot CTA slurry remains in acetic acid/water mother liquor.' },
  ctaSep: { title: 'CTA Solid–Liquid Separation', desc1: 'Crude terephthalic acid crystals are recovered from oxidation mother liquor.', desc2: 'Mother liquor contains acetic acid, water, catalyst, and soluble organics for recycle/purge.', function: 'Recover CTA crystals and route mother liquor to solvent/catalyst recovery.', equipment: 'Crystallizer/settler, centrifuge/filter, wash system, mother liquor tank', conditions: 'Hot slurry service; pressure near flash downstream conditions; mother liquor recycled to oxidation.' },
  hydrogenation: { title: 'Hydrogenation Reactor', desc1: 'CTA impurities such as 4-CBA and color bodies are hydrogenated to improve PTA purity.', desc2: 'Hydrogen partial pressure and catalyst activity are key purification variables.', function: 'Reduce 4-CBA and color-forming impurities in CTA slurry.', equipment: 'Hydrogenation reactor, H₂ feed, noble-metal catalyst bed, heat exchangers', conditions: '500–550 °F; 400–600 psig H₂.' },
  crystallizer: { title: 'PTA Crystallizers', desc1: 'Purified terephthalic acid crystallizes from the treated slurry during controlled cooling.', desc2: 'Crystal size distribution and purity are set by cooling and residence time.', function: 'Produce high-purity PTA crystals from hydrogenated slurry.', equipment: 'Staged crystallizers, coolers, agitators, vapor handling', conditions: '250–300 °F crystallization range.' },
  filter: { title: 'Filtration & Washing', desc1: 'PTA crystals are filtered and washed to remove residual mother liquor and impurities.', desc2: 'Wash liquor and filtrate are normally recovered to solvent handling.', function: 'Separate and wash PTA solids before final drying.', equipment: 'Rotary pressure filter, centrifuge, wash system, filtrate receivers', conditions: 'Wet PTA cake handling; mother liquor and wash liquor recycled to recovery.' },
  dryer: { title: 'PTA Dryer and Cooler', desc1: 'Washed PTA cake is dried, then cooled before pneumatic conveying.', desc2: 'Final product temperature is reduced for silo storage and downstream handling.', function: 'Dry PTA crystals and cool finished product.', equipment: 'Steam-tube dryer, fluid bed dryer/cooler, dust collection', conditions: 'Dryer 300–350 °F; cooled product 100–140 °F.' },
  storage: { title: 'PTA Product Silos', desc1: 'Dry PTA product is pneumatically conveyed to storage silos.', desc2: 'Product purity target is typically greater than 99.8 wt% PTA.', function: 'Store and dispatch purified terephthalic acid product.', equipment: 'Pneumatic conveying, silos, bin vents, truck/rail loading', conditions: 'Product 100–140 °F; dry solids; >99.8 wt% PTA.' },
  recycle: { title: 'Solvent / Catalyst Recovery', desc1: 'Recovered acetic acid and catalyst-bearing mother liquor are returned to the oxidation loop.', desc2: 'Purge controls by-products, corrosion species, and heavy impurities.', function: 'Recover and recycle acetic acid solvent and catalyst species.', equipment: 'Mother liquor tanks, distillation/evaporation, purge handling, catalyst makeup', conditions: 'Recovered acetic acid/catalyst recycle to oxidation; purge as required.' }
};


const applicationData = [
  {
    application: 'Polyethylene Terephthalate (PET) Resin',
    role: 'PTA reacts with ethylene glycol to produce PET resin.',
    endUses: 'Bottles, beverage containers, food packaging, thermoformed trays, and clear rigid packaging.',
    significance: 'Major high-volume outlet tied to packaging and beverage container demand.'
  },
  {
    application: 'Polyester Fibers',
    role: 'PTA is the primary acid monomer for polyester staple fiber and filament yarn.',
    endUses: 'Textiles, apparel, home furnishings, carpets, industrial fabrics, and nonwovens.',
    significance: 'Largest global use of PTA and the main driver of polyester chain demand.'
  },
  {
    application: 'Polyester Films',
    role: 'PTA-based polyester is converted into PET film, including biaxially oriented PET (BOPET).',
    endUses: 'Electronics, solar-panel backsheets, flexible packaging films, insulation, labels, and specialty media.',
    significance: 'Premium film-grade outlet requiring consistent polymer quality and clarity.'
  },
  {
    application: 'Engineering Plastics',
    role: 'Specialty polyesters derived from PTA provide strength, thermal resistance, and dimensional stability.',
    endUses: 'Automotive components, electrical/electronic parts, high-strength composites, and molded industrial parts.',
    significance: 'Smaller volume than fibers/resin but higher value and performance-oriented.'
  },
  {
    application: 'Coatings & Adhesives',
    role: 'PTA-based polyester resins are used as binders and film-forming materials.',
    endUses: 'Powder coatings, can coatings, laminates, industrial adhesives, and specialty surface coatings.',
    significance: 'Diversifies PTA demand into durable goods, packaging coatings, and industrial materials.'
  }
];

const streamData = {
  s1: { title: 'Fresh Feed', from: 'Battery limit / storage', to: 'Feed preparation', purpose: 'Fresh p-xylene, acetic acid makeup, and catalyst components enter the PTA plant.', conditions: 'Ambient to preheated feed conditions.' },
  s2: { title: 'Prepared Oxidation Feed', from: 'Feed preparation', to: 'Oxidation reactor', purpose: 'Metered p-xylene, solvent, catalyst, and recycle solvent enter oxidation.', conditions: 'Preheated feed; reactor target 430–500 °F and 300–450 psig.' },
  s3: { title: 'Hot CTA Slurry', from: 'Oxidation reactor', to: 'Slurry flasher', purpose: 'CTA slurry, water, acetic acid, catalyst, and by-products leave oxidation.', conditions: '430–500 °F; 300–450 psig before pressure letdown.' },
  s4: { title: 'Flashed CTA Slurry', from: 'Slurry flasher', to: 'CTA solid–liquid separation', purpose: 'Degassed slurry is routed for crude crystal recovery.', conditions: '150–250 psig after flashing; hot slurry service.' },
  s5: { title: 'Off-Gas / Vent', from: 'Flasher / oxidation loop', to: 'Vent treatment / solvent recovery', purpose: 'Remove COx, inerts, water vapor, and volatile acetic acid traces.', conditions: 'Reduced pressure vapor; typically condensed/scrubbed before vent treatment.' },
  s6: { title: 'CTA Slurry to Purification', from: 'CTA separation', to: 'Hydrogenation reactor', purpose: 'Recovered CTA crystals/slurry continue to impurity reduction.', conditions: 'Hydrogenation target 500–550 °F and 400–600 psig H₂.' },
  s7: { title: 'Hydrogen Feed', from: 'Hydrogen supply', to: 'Hydrogenation reactor', purpose: 'Hydrogen reduces 4-CBA and color bodies.', conditions: 'H₂ service; reactor pressure 400–600 psig.' },
  s8: { title: 'Hydrogenated PTA Slurry', from: 'Hydrogenation reactor', to: 'PTA crystallizers', purpose: 'Purified slurry is cooled to crystallize high-purity PTA.', conditions: 'Leaves hydrogenation near 500–550 °F; cooled to 250–300 °F.' },
  s9: { title: 'PTA Crystal Slurry', from: 'PTA crystallizers', to: 'Filtration and washing', purpose: 'Crystallized PTA solids are separated and washed.', conditions: '250–300 °F crystallizer outlet range.' },
  s10: { title: 'Washed PTA Cake', from: 'Filtration and washing', to: 'PTA dryer', purpose: 'Wet washed PTA cake is dried.', conditions: 'Wet solids to dryer; dryer 300–350 °F.' },
  s11: { title: 'Finished PTA Product', from: 'Dryer and cooler', to: 'PTA silos', purpose: 'Dry high-purity PTA is cooled and pneumatically conveyed to storage.', conditions: '100–140 °F product; >99.8 wt% PTA.' },
  s12: { title: 'Mother Liquor / Wash Liquor', from: 'Filtration and washing', to: 'Solvent/catalyst recovery', purpose: 'Recover acetic acid, catalyst, and wash liquor value.', conditions: 'Acetic acid/water/catalyst liquor; recovered for recycle.' },
  s13: { title: 'Recovered Solvent and Catalyst', from: 'Solvent/catalyst recovery', to: 'Oxidation reactor', purpose: 'Recycle acetic acid and catalyst-bearing liquor to oxidation.', conditions: 'Recycle to oxidation loop; purge and makeup control impurities.' }
};

function byId(id) { return document.getElementById(id); }
function setOverlay(title, desc1, desc2) {
  const titleEl = byId('selectedTitle'); const desc1El = byId('selectedDesc1'); const desc2El = byId('selectedDesc2');
  if (titleEl) titleEl.textContent = title; if (desc1El) desc1El.textContent = desc1; if (desc2El) desc2El.textContent = desc2;
}
function clearActive() { document.querySelectorAll('.active').forEach(el => el.classList.remove('active')); }
function populateTables() {
  const unitBody = document.querySelector('#unitSummaryTable tbody'); const streamBody = document.querySelector('#streamSummaryTable tbody');
  const appBody = document.querySelector('#applicationSummaryTable tbody');
  if (unitBody) unitBody.innerHTML = Object.values(unitData).map(u => `<tr><td>${u.title}</td><td>${u.function}</td><td>${u.equipment}</td><td>${u.conditions}</td></tr>`).join('');
  if (streamBody) streamBody.innerHTML = Object.values(streamData).map(s => `<tr><td>${s.title}</td><td>${s.from}</td><td>${s.to}</td><td>${s.purpose}</td><td>${s.conditions}</td></tr>`).join('');
  if (appBody) appBody.innerHTML = applicationData.map(a => `<tr><td>${a.application}</td><td>${a.role}</td><td>${a.endUses}</td><td>${a.significance}</td></tr>`).join('');
}
function bindDiagramEvents() {
  document.querySelectorAll('.unit-block').forEach(block => block.addEventListener('click', () => {
    const item = unitData[block.dataset.unit]; if (!item) return; clearActive(); block.classList.add('active'); setOverlay(item.title, item.desc1, item.desc2);
  }));
  Object.keys(streamData).forEach(id => { const stream = byId(id); if (!stream) return; stream.addEventListener('click', () => { const item = streamData[id]; clearActive(); stream.classList.add('active'); setOverlay(item.title, `${item.from} → ${item.to}`, `${item.purpose} Conditions: ${item.conditions}`); }); });
}
function bindButtons() {
  const btnAnimate = byId('btnAnimate'); const btnReset = byId('btnReset');
  if (btnAnimate) btnAnimate.addEventListener('click', () => { document.body.classList.toggle('flow-paused'); btnAnimate.textContent = document.body.classList.contains('flow-paused') ? 'Resume Flow' : 'Pause Flow'; });
  if (btnReset) btnReset.addEventListener('click', () => { clearActive(); setOverlay('Click any block or stream', 'The PTA process section will be highlighted here.', 'Unit and stream tables below include typical conditions.'); });
}
document.addEventListener('DOMContentLoaded', () => { populateTables(); bindDiagramEvents(); bindButtons(); });
