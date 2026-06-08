'use strict';

const unitData = {
  crude: {
    title: 'Crude Feed, Desalter & Preheat',
    capacity: '300 kbpd crude',
    desc1: 'Receives 300 kbpd fresh crude, removes salts/water, and recovers heat before CDU furnace charging.',
    desc2: 'Design basis: full crude charge to atmospheric tower after desalting and preheat.',
    function: 'Prepare crude feed by salt/water removal, solids control, and heat recovery before atmospheric fractionation.',
    conditions: 'Desalter: 250–320 °F, 150–300 psig; CDU feed after furnace: 650–725 °F.',
    yield: '300 kbpd desalted crude to CDU; 0.5–2 vol% brine/water/sludge reject, assay dependent.',
    equipment: 'Crude tanks, charge pumps, desalter, preheat exchangers, fired heater'
  },
  cdu: {
    title: 'Crude Distillation Unit (CDU)',
    capacity: '300 kbpd fresh crude',
    desc1: 'Separates crude into light ends, naphtha, kerosene, gas oils, and atmospheric residue.',
    desc2: 'CDU side draws feed hydrotreating; atmospheric residue feeds the VDU.',
    function: 'Primary atmospheric separation of full crude charge into straight-run refinery cuts.',
    conditions: 'Tower top: 220–300 °F, 5–25 psig; flash zone: 650–725 °F; furnace outlet: 650–725 °F.',
    yield: 'Indicative yields: LPG 3–5%, naphtha 18–25%, kero/jet 8–12%, diesel/LGO 18–25%, HGO 5–10%, AR 35–50%.',
    equipment: 'Atmospheric tower, side strippers, pumparounds, overhead system, furnace'
  },
  vdu: {
    title: 'Vacuum Distillation Unit (VDU)',
    capacity: '135 kbpd AR feed (45% of crude)',
    desc1: 'Processes atmospheric residue to recover LVGO/HVGO while minimizing thermal cracking.',
    desc2: 'Vacuum residue is routed to asphalt/fuel oil or optional residue upgrading.',
    function: 'Recover vacuum gas oils from atmospheric residue and separate vacuum residue bottoms.',
    conditions: 'Vacuum tower flash zone: 700–780 °F; pressure: 20–80 mmHg abs; heater outlet: 720–790 °F.',
    yield: 'From AR feed: LVGO 20–30%, HVGO 25–35%, vacuum residue 35–50%; equals ~27–41 kbpd LVGO, ~34–47 kbpd HVGO, ~47–68 kbpd VR.',
    equipment: 'Vacuum tower, ejectors/vacuum system, wash section, fired heater, residue pumps'
  },
  nht: {
    title: 'Naphtha Hydrotreater (NHT)',
    capacity: '60 kbpd naphtha feed',
    desc1: 'Treats light/heavy naphtha to remove sulfur, nitrogen, metals, and olefins.',
    desc2: 'Hydrotreated heavy naphtha is routed to the reformer; light naphtha may route to isomerization or gasoline blending.',
    function: 'Clean naphtha feed to protect reformer catalyst and improve gasoline blend stability.',
    conditions: 'Reactor: 550–700 °F, 250–600 psig H₂ partial pressure; LHSV 2–6 hr⁻¹.',
    yield: 'Liquid yield typically 98–100 vol% hydrotreated naphtha; 0.5–2% light ends/sour gas depending on feed sulfur.',
    equipment: 'Feed/effluent exchangers, reactor, separator, stripper, recycle gas compressor'
  },
  kero: {
    title: 'Kerosene / Jet Hydrotreater',
    capacity: '30 kbpd kerosene/jet feed',
    desc1: 'Treats kerosene to meet jet/kerosene sulfur, mercaptan, smoke point, and freezing point constraints.',
    desc2: 'Product is routed to the jet/kerosene pool after fractionation and quality control.',
    function: 'Produce on-spec jet/kerosene blending component.',
    conditions: 'Reactor: 550–700 °F, 400–900 psig; moderate H₂ circulation for sulfur/mercaptan removal.',
    yield: 'Liquid yield typically 98–100 vol%; ~29–30 kbpd jet/kerosene blendstock plus sour gas/light ends.',
    equipment: 'Hydrotreating reactor, stripper, fractionator, H₂ recycle, sulfur handling tie-in'
  },
  diesel: {
    title: 'Diesel Hydrotreater',
    capacity: '70 kbpd diesel/LGO feed',
    desc1: 'Deep-desulfurizes LGO and selected gas oils to ULSD-range sulfur specification.',
    desc2: 'Hydrogen consumption depends on crude sulfur, feed endpoint, and severity.',
    function: 'Produce low-sulfur diesel blendstock with improved cetane and stability.',
    conditions: 'Reactor: 600–750 °F, 600–1,200 psig; higher severity for ULSD and aromatic saturation.',
    yield: 'Liquid yield typically 96–99 vol%; ~67–69 kbpd diesel blendstock plus sour gas/naphtha-range byproduct.',
    equipment: 'Reactor system, recycle compressor, hot/cold separators, stripper, fractionator'
  },
  vgo: {
    title: 'VGO Hydrotreater / Conversion Tie',
    capacity: '75 kbpd LVGO/HVGO feed',
    desc1: 'Treats LVGO/HVGO before FCC, hydrocracker, or other conversion service where installed.',
    desc2: 'In this block diagram, VGO can route to conversion, diesel blending, or external upgrading.',
    function: 'Upgrade vacuum gas oil quality and protect downstream conversion catalysts.',
    conditions: 'Reactor: 650–800 °F, 1,000–2,000 psig; severe HDS/HDN/metals control service.',
    yield: 'Hydrotreated VGO 95–99 vol%; minor naphtha/diesel/light gas make depending on severity.',
    equipment: 'High-pressure reactor system, separators, stripper, H₂ recycle compressor'
  },
  reformer: {
    title: 'Catalytic Reformer',
    capacity: '45 kbpd hydrotreated heavy naphtha',
    desc1: 'Converts hydrotreated naphtha into high-octane reformate and produces H₂-rich off-gas.',
    desc2: 'Severity balances gasoline octane, aromatics feed to BTX recovery, and hydrogen make.',
    function: 'Increase gasoline octane and generate hydrogen for refinery hydrotreaters.',
    conditions: 'Reactors: 900–980 °F, 50–350 psig; continuous catalyst regeneration or semi-regenerative operation.',
    yield: 'Reformate 80–88 vol%; LPG/light ends 8–15%; H₂ make ~1,200–2,500 scf/bbl feed.',
    equipment: 'Reactor train, fired heaters, stabilizer, compressor, H₂ recovery interface'
  },
  aromatics: {
    title: 'Aromatics Complex',
    capacity: '25 kbpd reformate heart-cut/feed',
    desc1: 'Processes reformate or C7–C9 heart cut to recover petrochemical-grade benzene, toluene, and xylenes.',
    desc2: 'Extraction, fractionation, isomerization, and transalkylation are configured around target BTX slate.',
    function: 'Shift reformate value into petrochemical aromatics and return raffinate as blendstock where allowed.',
    conditions: 'Extraction/fractionation: 150–400 °F, near-atmospheric to 150 psig; xylene loop/isom: 650–850 °F, 150–400 psig.',
    yield: 'From aromatics feed: BTX 45–65 vol%; raffinate/heavy aromatics 35–55 vol%, depending on cut and extraction severity.',
    equipment: 'Extraction unit, clay treater, splitters, xylene loop, isomerization, transalkylation'
  },
  alky: {
    title: 'Alkylation Unit',
    capacity: '20 kbpd alkylate product',
    desc1: 'Converts isobutane and C3/C4 olefins into high-octane, low-RVP, low-sulfur alkylate.',
    desc2: 'Alkylate supports gasoline octane when aromatics content is constrained.',
    function: 'Produce premium gasoline blendstock from light olefins and isobutane.',
    conditions: 'HF alky: 80–110 °F, 100–200 psig; sulfuric alky: 35–55 °F, 50–150 psig.',
    yield: 'Alkylate volume typically 1.6–1.8 bbl per bbl olefin; ~20 kbpd alkylate plus propane/n-butane byproducts.',
    equipment: 'Reactor/contactor, acid regeneration, deisobutanizer, product fractionation'
  },
  gasoline: {
    title: 'Gasoline Pool',
    capacity: '95 kbpd finished gasoline',
    desc1: 'Blends reformate, alkylate, raffinate, light naphtha, and other gasoline components.',
    desc2: 'Blend constraints include octane, RVP, sulfur, benzene, aromatics, distillation, and oxygenate rules.',
    function: 'Finalize gasoline blending components into marketable gasoline.',
    conditions: 'Ambient tankage/blending: 60–120 °F, atmospheric to low transfer pressure.',
    yield: 'Finished gasoline target ~30–35 vol% of crude, or ~90–105 kbpd for 300 kbpd crude basis.',
    equipment: 'Blend headers, component tanks, analyzers, additives, product rundown'
  },
  middle: {
    title: 'Jet / Diesel Product Pools',
    capacity: '95 kbpd total middle distillates',
    desc1: 'Receives hydrotreated kerosene and diesel blendstocks for final product blending.',
    desc2: 'Jet controls freezing point/smoke point; diesel controls sulfur/cetane/density/cold-flow.',
    function: 'Blend on-spec jet/kerosene and diesel products.',
    conditions: 'Ambient tankage/blending: 60–120 °F, atmospheric to low transfer pressure.',
    yield: 'Jet/kerosene ~25–35 kbpd; diesel/ULSD ~60–75 kbpd, depending on crude and cut-point strategy.',
    equipment: 'Blend tanks, product analyzers, additive systems, product pumps'
  },
  residue: {
    title: 'Residue / Asphalt / Fuel Oil',
    capacity: '50 kbpd VR/residue disposition',
    desc1: 'Handles vacuum residue as asphalt, fuel oil, or feed to external residue upgrading.',
    desc2: 'Optional future blocks can include coker, visbreaker, SDA, or residue hydrocracker.',
    function: 'Manage heavy residue disposition and minimize low-value bottoms.',
    conditions: 'Residue handling: 250–450 °F heated transfer/storage, near-atmospheric to pump discharge pressure.',
    yield: 'Vacuum residue typically 15–25 vol% of crude, or ~45–75 kbpd before any residue conversion.',
    equipment: 'Residue tanks, asphalt handling, fuel oil blending, external upgrading tie-ins'
  },
  sgp: {
    title: 'Sour Gas Plant (SGP)',
    capacity: '150 MMSCFD sour gas + 250 LTPD sulfur basis',
    desc1: 'Treats sour off-gases from CDU/VDU, hydrotreaters, reformer, and fuel gas systems.',
    desc2: 'Amine treats gas; Claus SRU converts H₂S to sulfur; TGTU polishes tail gas.',
    function: 'Remove acid gases, recover elemental sulfur, and return treated fuel gas.',
    conditions: 'Amine absorber: 90–130 °F, 50–400 psig; SRU furnace: 1,800–2,400 °F; TGTU per emissions target.',
    yield: 'Treated fuel gas recovery >95%; sulfur recovery typically 99.5%+ with TGTU; sulfur production depends on crude sulfur.',
    equipment: 'Amine absorbers/regenerators, SRU Claus trains, TGTU, sulfur pit/loading, fuel gas KO'
  },
  h2: {
    title: 'Hydrogen Network',
    capacity: '120 MMSCFD H₂ circulation/make-up basis',
    desc1: 'Balances reformer hydrogen make with hydrotreating demand; optional SMR H₂ plant supplements the balance.',
    desc2: 'Consumers include NHT, Kero HDS, Diesel HDS, VGO HDS, and future hydrocracking service.',
    function: 'Recover, distribute, and supplement refinery hydrogen.',
    conditions: 'H₂ headers: 300–2,000 psig depending on service; ambient to compressor discharge temperatures.',
    yield: 'Reformer H₂ supplies a major share; shortfall is covered by PSA/SMR/imported H₂ as required by sulfur severity.',
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
