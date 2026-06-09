'use strict';

const unitData = {
  feedPrep: {
    title: 'Feed Vaporization & Conditioning',
    desc1: 'Methanol and recycled methyl acetate are vaporized and conditioned before entering the carbonylation loop.',
    desc2: 'Typical feed temperature: 300–400°F before reactor mixing.',
    function: 'Vaporizes methanol and recycled methyl acetate; stabilizes feed temperature.',
    conditions: '300–400°F; feed routed to high-pressure reactor loop.',
    equipment: 'Vaporizer, preheater, feed controls, recycle feed mixer'
  },
  coFeed: {
    title: 'Carbon Monoxide Feed System',
    desc1: 'CO is compressed and metered into the reactor loop for methanol carbonylation.',
    desc2: 'Typical pressure: 400–600 psig to match reactor operating pressure.',
    function: 'Supplies controlled CO feed to maintain carbonylation stoichiometry and reactor pressure.',
    conditions: '400–600 psig; dry CO feed; pressure-controlled injection.',
    equipment: 'CO compressor or supply header, flow metering, control valves'
  },
  reactor: {
    title: 'Carbonylation Reactor',
    desc1: 'Methanol reacts with CO in the presence of rhodium or iridium catalyst and iodide promoter to form acetic acid.',
    desc2: 'Typical operation: 350–420°F and 400–600 psig.',
    function: 'Main acetic acid synthesis reaction by methanol carbonylation.',
    conditions: '350–420°F; 400–600 psig; liquid-phase catalyst/iodide system.',
    equipment: 'Agitated reactor or loop reactor, catalyst inventory, iodide promoter loop'
  },
  flash: {
    title: 'Flash Separator',
    desc1: 'Reactor effluent is flashed to remove light gases while retaining crude liquid acid and catalyst solution.',
    desc2: 'Typical flash pressure: 150–250 psig.',
    function: 'Separates CO-rich light gases from liquid acetic-acid-containing reactor effluent.',
    conditions: '150–250 psig; hot reactor effluent; vapor/liquid disengagement.',
    equipment: 'High-pressure flash drum, vapor demister, liquid level control'
  },
  gasRecycle: {
    title: 'Light Gas Recycle / Purge',
    desc1: 'CO-rich flash gas is recycled to the reactor loop with purge control for inert removal.',
    desc2: 'Maintains CO utilization while preventing buildup of inerts and byproduct gases.',
    function: 'Recovers CO-containing gas and controls purge for inerts/byproducts.',
    conditions: 'Recycle routed back toward reactor pressure; purge to treatment/flare as required.',
    equipment: 'Recycle compressor/ejector, purge control, vent treatment tie-in'
  },
  lights: {
    title: 'Light-Ends Column',
    desc1: 'Methyl iodide and methyl acetate are recovered overhead and returned to the reactor loop.',
    desc2: 'Bottoms contain crude acetic acid, water, and heavier impurities for further purification.',
    function: 'Recovers volatile iodide/promoter and methyl acetate for recycle.',
    conditions: 'Distillation service; overhead recycle; bottoms to drying column.',
    equipment: 'Distillation column, condenser, reflux drum, reboiler, recycle pumps'
  },
  drying: {
    title: 'Drying Column',
    desc1: 'Water is removed from crude acetic acid to concentrate the product before final purification.',
    desc2: 'Typical operation: 220–260°F.',
    function: 'Removes water and improves acetic acid concentration.',
    conditions: '220–260°F; distillation; water-rich overhead/side removal.',
    equipment: 'Drying column, condenser, reboiler, water draw system'
  },
  finishing: {
    title: 'Finishing Column',
    desc1: 'Final purification removes heavy impurities, aldehydes, and trace contaminants.',
    desc2: 'Produces glacial acetic acid >99.8 wt% at about 250–300°F and near-atmospheric pressure.',
    function: 'Final fractionation to glacial acetic acid product quality.',
    conditions: '250–300°F; near-atmospheric pressure; product >99.8 wt% AcOH.',
    equipment: 'Finishing column, condenser, reboiler, product cooler, impurity draw'
  },
  storage: {
    title: 'Product Cooling & Storage',
    desc1: 'Purified glacial acetic acid is cooled and routed to storage tanks.',
    desc2: 'Typical storage inlet temperature: 80–120°F.',
    function: 'Cools, stores, and transfers final glacial acetic acid product.',
    conditions: '80–120°F product to storage; atmospheric or low-pressure tank service.',
    equipment: 'Product cooler, storage tanks, transfer pumps, tank blanketing'
  },
  utilities: {
    title: 'Utilities, Safety & Offsites',
    desc1: 'Provides heat, cooling, relief, flare, wastewater, and safe containment systems for the iodide/catalyst loop.',
    desc2: 'Supports corrosion control, inerting, emissions management, and product logistics.',
    function: 'Plant support systems, environmental controls, and safe handling infrastructure.',
    conditions: 'Steam/cooling water; inerting; relief/flare; wastewater and off-gas treatment.',
    equipment: 'Steam, cooling water, flare, scrubbers, wastewater treatment, tank blanketing'
  }
};

const streamData = {
  s1: { title: 'Methanol Feed', from: 'Battery limit', to: 'Feed vaporization', condition: 'Fresh methanol, routed to 300–400°F vaporization service.', purpose: 'Primary reactant for carbonylation.' },
  s2: { title: 'Carbon Monoxide Feed', from: 'CO supply / compressor', to: 'CO feed system', condition: '400–600 psig dry CO feed.', purpose: 'Carbonylation reactant and reactor pressure support.' },
  s3: { title: 'Vaporized Methanol / Recycle Feed', from: 'Feed vaporization', to: 'Carbonylation reactor', condition: '300–400°F vapor feed.', purpose: 'Methanol and recycled methyl acetate enter reactor loop.' },
  s4: { title: 'CO to Reactor', from: 'CO feed system', to: 'Carbonylation reactor', condition: '400–600 psig.', purpose: 'Controlled CO injection for acetic acid synthesis.' },
  s5: { title: 'Reactor Effluent', from: 'Carbonylation reactor', to: 'Flash separator', condition: '350–420°F; 400–600 psig before letdown.', purpose: 'Contains acetic acid, methyl iodide, water, catalyst solution, and byproducts.' },
  s6: { title: 'Light Gases', from: 'Flash separator', to: 'Light gas recycle / purge', condition: '150–250 psig flash vapor.', purpose: 'CO-rich gases recovered or purged for inert control.' },
  s7: { title: 'CO-Rich Gas Recycle', from: 'Light gas recycle', to: 'Carbonylation reactor', condition: 'Recompressed/recycled toward reactor pressure.', purpose: 'Improves CO utilization and reduces raw CO consumption.' },
  s8: { title: 'Liquid Flash Bottoms', from: 'Flash separator', to: 'Light-ends column', condition: '150–250 psig liquid phase.', purpose: 'Sends acid-containing liquid to promoter/recycle recovery.' },
  s9: { title: 'Light-Ends Overhead', from: 'Light-ends column', to: 'MI / methyl acetate recycle', condition: 'Overhead distillate containing methyl iodide and methyl acetate.', purpose: 'Recovers iodide promoter and recycle reactants.' },
  s10: { title: 'MI / Methyl Acetate Recycle', from: 'Recycle header', to: 'Carbonylation reactor', condition: 'Returned to reactor feed loop.', purpose: 'Maintains iodide promoter and methyl acetate inventory.' },
  s11: { title: 'Crude Acetic Acid Bottoms', from: 'Light-ends column', to: 'Drying column', condition: 'Crude acetic acid with water.', purpose: 'Feeds water removal step.' },
  s12: { title: 'Water-Rich Draw', from: 'Drying column', to: 'Wastewater / recovery', condition: '220–260°F column water removal service.', purpose: 'Removes water from crude acid.' },
  s13: { title: 'Dry Acetic Acid', from: 'Drying column', to: 'Finishing column', condition: '220–260°F acid-rich stream.', purpose: 'Feeds final product purification.' },
  s14: { title: 'Purified Acetic Acid', from: 'Finishing column', to: 'Product cooling', condition: '250–300°F; near-atmospheric pressure.', purpose: 'Glacial acetic acid before final cooling.' },
  s15: { title: 'Glacial Acetic Acid Product', from: 'Product storage', to: 'Distribution', condition: '80–120°F; >99.8 wt% acetic acid.', purpose: 'Final product to storage/export.' },
  s16: { title: 'Purge / Vent Gas', from: 'Flash / recycle system', to: 'Treatment / flare', condition: 'Controlled purge stream.', purpose: 'Controls inert and byproduct accumulation.' }
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
        <td>${unit.conditions}</td>
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
        <td>${stream.condition}</td>
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
      setOverlay(item.title, `${item.from} → ${item.to}`, `${item.condition} | ${item.purpose}`);
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
      setOverlay('Click any block or stream', 'The diagram highlights the selected acetic acid process section.', 'Unit and stream tables include representative process conditions.');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateTables();
  bindDiagramEvents();
  bindButtons();
});
