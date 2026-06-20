const svgNS = "http://www.w3.org/2000/svg";

let svg;
let layers;
let showLabels = true;
let showUtilities = true;
let showOverlays = true;
let currentInputIds = [];

const svgWrap = document.getElementById("svgWrap");
const tooltip = document.getElementById("pfdTooltip");
const pfdSvgMount = document.getElementById("pfdSvgMount");
const objectLevelSelect = document.getElementById("objectLevel");
const processAreaSelect = document.getElementById("processArea");
const activeViewName = document.getElementById("activeViewName");
const outputTitle = document.getElementById("outputTitle");
const inputForm = document.getElementById("inputForm");
const outputTable = document.getElementById("outputTable");
const economicsTable = document.getElementById("economicsTable");

const processAreas = {
  "Amine": { title: "Amine Treating", subtitle: "Acid gas absorber, lean/rich exchanger, regenerator", units: ["Acid Gas Feed", "Absorber", "Lean/Rich Exchanger", "Regenerator", "Sweet Gas"], factor: 0.985, density: 61.5, viscosity: 1.8, dT: -8, dP: -6, energy: 0.18, operating: 0.020 },
  "Dehydration": { title: "Molecular Sieve Dehydration", subtitle: "Wet gas dehydration with adsorption and regeneration", units: ["Wet Gas", "Adsorber A/B", "Regen Heater", "Cooler", "Dry Gas"], factor: 0.995, density: 4.2, viscosity: 0.013, dT: -15, dP: -8, energy: 0.11, operating: 0.014 },
  "HDS": { title: "Hydrodesulfurization", subtitle: "Feed heater, reactor, separator, stripper", units: ["Feed", "Charge Heater", "HDS Reactor", "HP Separator", "Stripper"], factor: 0.975, density: 52.0, viscosity: 2.6, dT: 95, dP: -18, energy: 0.42, operating: 0.040 },
  "Mercury Removal": { title: "Mercury Removal Unit", subtitle: "Fixed-bed guard system upstream of cryogenic service", units: ["Dry Gas", "Guard Bed A", "Guard Bed B", "Hg Analyzer", "Treated Gas"], factor: 0.998, density: 3.7, viscosity: 0.012, dT: 2, dP: -4, energy: 0.04, operating: 0.006 },
  "Fractionation": { title: "NGL Fractionation", subtitle: "Deethanizer, depropanizer, debutanizer train", units: ["NGL Feed", "Deethanizer", "Depropanizer", "Debutanizer", "C5+ Product"], factor: 0.940, density: 34.8, viscosity: 0.22, dT: 35, dP: -22, energy: 0.55, operating: 0.055 },
  "Stabilizer": { title: "Condensate Stabilizer", subtitle: "Light-ends removal and stabilized condensate product", units: ["Condensate Feed", "Preheater", "Stabilizer", "Reboiler", "Stabilized Condensate"], factor: 0.960, density: 45.0, viscosity: 0.65, dT: 45, dP: -12, energy: 0.34, operating: 0.035 },
  "LNG": { title: "LNG Train", subtitle: "Pretreatment, liquefaction, refrigerant compression, storage", units: ["Treated Gas", "MCHE", "MR Compressor", "LNG Drum", "LNG Tank"], factor: 0.920, density: 26.5, viscosity: 0.11, dT: -310, dP: -35, energy: 0.95, operating: 0.080 },
  "NGLs": { title: "NGL Recovery", subtitle: "Turbo-expander, demethanizer, residue compression", units: ["Rich Gas", "Expander", "Demethanizer", "Residue Compressor", "NGL Product"], factor: 0.900, density: 32.0, viscosity: 0.18, dT: -85, dP: -28, energy: 0.48, operating: 0.048 },
  "Refinery": { title: "Refinery Heater View", subtitle: "Fired heater with hydrocarbon feed and stack losses", units: ["Feed Sources", "Charge Furnace", "Fuel Gas Skid", "Combustion Air", "Heated Product"], factor: 0.990, density: 48.0, viscosity: 1.4, dT: 260, dP: -7, energy: 0.62, operating: 0.032 },
  "Petchem": { title: "Petrochemical Reactor Section", subtitle: "Feed preparation, reactor, separator, recycle loop", units: ["Feed Prep", "Reactor", "Quench", "Separator", "Product Recovery"], factor: 0.870, density: 42.5, viscosity: 0.72, dT: 60, dP: -15, energy: 0.70, operating: 0.070 }
};

const objectLevels = {
  "Streams": { title: "Stream Network View", subtitle: "Feed, intermediate, utility, and product stream focus", units: ["Feed Stream", "Mixing Node", "Process Stream", "Utility Header", "Product Stream"], factor: 0.980, density: 46.0, viscosity: 1.10, dT: 35, dP: -5, energy: 0.20, operating: 0.020 },
  "Units": { title: "Unit Operation View", subtitle: "Major equipment blocks and unit operation boundaries", units: ["Pump", "Heat Exchanger", "Furnace", "Column/Reactor", "Separator"], factor: 0.965, density: 47.5, viscosity: 1.25, dT: 80, dP: -12, energy: 0.38, operating: 0.038 },
  "Plants": { title: "Plant View", subtitle: "Integrated process plant with utilities and product routing", units: ["Feed System", "Process Plant", "Utility Plant", "Storage", "Loading"], factor: 0.950, density: 44.0, viscosity: 0.90, dT: 25, dP: -10, energy: 0.30, operating: 0.030 },
  "Sites": { title: "Site View", subtitle: "Multiple plants connected by site-wide utilities and logistics", units: ["Refinery", "LNG", "Petchem", "Tank Farm", "Export"], factor: 0.940, density: 43.0, viscosity: 0.85, dT: 15, dP: -8, energy: 0.24, operating: 0.024 },
  "Regions": { title: "Regional View", subtitle: "Sites, pipelines, storage hubs, and product markets", units: ["Supply Basin", "Pipeline Hub", "Storage Hub", "Market", "Export Dock"], factor: 0.930, density: 41.5, viscosity: 0.78, dT: 5, dP: -6, energy: 0.18, operating: 0.018 }
};

const formFields = [
  { id: "feedFlowGpm", label: "Feed flow", unit: "gpm", min: 0, step: 1 },
  { id: "massFlowLbHr", label: "Mass flow rate", unit: "lb/hr", min: 0, step: 100 },
  { id: "densityLbFt3", label: "Density", unit: "lb/ft³", min: 0.1, step: 0.1 },
  { id: "viscosityCp", label: "Viscosity", unit: "cP", min: 0, step: 0.01 },
  { id: "temperatureF", label: "Temperature", unit: "°F", step: 1 },
  { id: "pressurePsig", label: "Pressure", unit: "psig", step: 1 },
  { id: "priceLb", label: "Price", unit: "$/lb", min: 0, step: 0.001 },
  { id: "priceGal", label: "Price", unit: "$/gal", min: 0, step: 0.01 },
  { id: "priceMMBtu", label: "Price", unit: "$/MMBtu", min: 0, step: 0.01 }
];

function getSelection() {
  if (processAreaSelect.value) return { type: "processArea", key: processAreaSelect.value, config: processAreas[processAreaSelect.value] };
  if (objectLevelSelect.value) return { type: "objectLevel", key: objectLevelSelect.value, config: objectLevels[objectLevelSelect.value] };
  return { type: "default", key: "Refinery", config: processAreas.Refinery };
}

function defaultInputs(selection) {
  const c = selection.config;
  const feedFlow = selection.type === "objectLevel" ? 1200 : selection.key === "LNG" ? 4200 : selection.key === "Amine" ? 850 : 1500;
  const density = c.density;
  const massFlow = feedFlow * 60 * 0.133681 * density;
  const priceLb = selection.key === "LNG" ? 0.18 : selection.key === "Petchem" ? 0.55 : selection.key === "Amine" ? 0.08 : 0.22;
  const priceGal = priceLb * density * 0.133681;
  const priceMMBtu = selection.key === "LNG" ? 9.50 : selection.key === "Refinery" ? 14.00 : 11.00;
  return {
    feedFlowGpm: feedFlow,
    massFlowLbHr: massFlow,
    densityLbFt3: density,
    viscosityCp: c.viscosity,
    temperatureF: selection.key === "LNG" ? -250 : selection.key === "Dehydration" ? 95 : 100,
    pressurePsig: selection.key === "LNG" ? 45 : selection.key === "Amine" ? 950 : 150,
    priceLb,
    priceGal,
    priceMMBtu
  };
}

function renderInputForm(selection) {
  const d = defaultInputs(selection);
  currentInputIds = formFields.map(f => f.id);
  inputForm.innerHTML = `
    <h2>${selection.config.title} Inputs</h2>
    <p class="panel-note">Dynamic basis: ${selection.type === "objectLevel" ? "Object Level" : selection.type === "processArea" ? "Process Area" : "Default"}</p>
    <div class="field-grid">
      ${formFields.map(f => `
        <label>${f.label}, ${f.unit}
          <input id="${f.id}" type="number" value="${formatInputValue(d[f.id])}" ${f.min !== undefined ? `min="${f.min}"` : ""} step="${f.step}">
        </label>
      `).join("")}
    </div>
  `;
  currentInputIds.forEach(id => document.getElementById(id).addEventListener("input", render));
}

function formatInputValue(value) {
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2).replace(/\.00$/, "");
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

async function loadExternalSvg() {
  const svgPath = pfdSvgMount?.dataset.svgSrc || "svg/pfd-template.svg";
  if (!pfdSvgMount) throw new Error("SVG mount element #pfdSvgMount was not found.");
  const response = await fetch(svgPath, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${svgPath}. Check folder path: svg/pfd-template.svg`);
  pfdSvgMount.innerHTML = await response.text();
}

function initializeSvgReferences() {
  svg = document.getElementById("pfdSvg");
  layers = {
    grid: document.getElementById("layerGrid"),
    streams: document.getElementById("layerStreams"),
    units: document.getElementById("layerUnits"),
    labels: document.getElementById("layerLabels"),
    overlays: document.getElementById("layerOverlays")
  };
  if (!svg || Object.values(layers).some(layer => !layer)) throw new Error("Missing required SVG layer IDs in pfd-template.svg.");
}

function n(id) { return Number(document.getElementById(id)?.value || 0); }
function fmt(value, digits = 1) { return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—"; }
function money(value, digits = 2) { return `$${fmt(value, digits)}`; }
function svgEl(name, attrs = {}) { const el = document.createElementNS(svgNS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; }
function addText(group, text, x, y, cls = "", anchor = "start") { const t = svgEl("text", { x, y, class: cls, "text-anchor": anchor }); t.textContent = text; group.appendChild(t); return t; }
function addMultilineText(group, lines, x, y, cls = "overlay-text", lineHeight = 16) { lines.forEach((line, i) => addText(group, line, x, y + i * lineHeight, cls)); }
function pointsToString(points) { return points.map(p => `${p.x},${p.y}`).join(" "); }

function computeModel() {
  const selection = getSelection();
  const c = selection.config;
  const feedFlowGpm = n("feedFlowGpm");
  const density = n("densityLbFt3");
  const enteredMassFlow = n("massFlowLbHr");
  const hydraulicMassFlow = feedFlowGpm * 60 * 0.133681 * density;
  const massFlowLbHr = enteredMassFlow > 0 ? enteredMassFlow : hydraulicMassFlow;
  const productFlowGpm = feedFlowGpm * c.factor;
  const productMassFlow = massFlowLbHr * c.factor;
  const productDensity = density * (1 + (c.dT < -100 ? 0.10 : c.dT > 80 ? -0.025 : -0.01));
  const productViscosity = Math.max(n("viscosityCp") * (c.dT > 0 ? 0.72 : 1.08), 0.001);
  const productTemp = n("temperatureF") + c.dT;
  const productPressure = Math.max(n("pressurePsig") + c.dP, 0);
  const productPriceLb = n("priceLb") * (1.08 + (1 - c.factor) * 0.55);
  const productPriceGal = productPriceLb * productDensity * 0.133681;
  const productPriceMMBtu = n("priceMMBtu") * (1.06 + c.energy * 0.08);
  const feedInputCost = massFlowLbHr * n("priceLb");
  const energyInputCost = massFlowLbHr * c.energy / 1000 * n("priceMMBtu");
  const operatingCost = massFlowLbHr * c.operating;
  const productRevenue = productMassFlow * productPriceLb;
  const feedRevenueBasis = massFlowLbHr * n("priceLb");
  const spreadLb = productPriceLb - n("priceLb");
  const spreadGal = productPriceGal - n("priceGal");
  const spreadMMBtu = productPriceMMBtu - n("priceMMBtu");
  const netMargin = productRevenue - feedInputCost - energyInputCost - operatingCost;

  return {
    selection,
    inputs: {
      feedFlowGpm, massFlowLbHr, density, viscosity: n("viscosityCp"), temperature: n("temperatureF"), pressure: n("pressurePsig"),
      priceLb: n("priceLb"), priceGal: n("priceGal"), priceMMBtu: n("priceMMBtu")
    },
    product: {
      flowGpm: productFlowGpm, massFlowLbHr: productMassFlow, density: productDensity, viscosity: productViscosity,
      temperature: productTemp, pressure: productPressure, priceLb: productPriceLb, priceGal: productPriceGal, priceMMBtu: productPriceMMBtu
    },
    economics: { feedInputCost, energyInputCost, operatingCost, productRevenue, feedRevenueBasis, spreadLb, spreadGal, spreadMMBtu, netMargin }
  };
}

function clearLayers() { Object.values(layers).forEach(layer => layer.innerHTML = ""); }
function drawGrid() {
  for (let x = 0; x <= 1400; x += 50) layers.grid.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: 850, class: x % 100 === 0 ? "grid-major" : "grid-line" }));
  for (let y = 0; y <= 850; y += 50) layers.grid.appendChild(svgEl("line", { x1: 0, y1: y, x2: 1400, y2: y, class: y % 100 === 0 ? "grid-major" : "grid-line" }));
}

function buildDynamicPfd(model) {
  const unitNames = model.selection.config.units;
  const unitX = [105, 335, 570, 815, 1050];
  const y = model.selection.type === "objectLevel" ? 340 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 180 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i];
    const to = units[i + 1];
    const sy = y + from.height / 2;
    streams.push({
      id: `S-${101 + i}`,
      name: ["Feed", "Intermediate", "Treated", "Product"][i],
      type: i === 2 ? "gas" : "process",
      utility: false,
      path: [{ x: from.x + from.width, y: sy }, { x: to.x, y: sy }],
      label: { x: from.x + from.width + 18, y: sy - 64 },
      lines: streamLinesFor(model, i),
      tooltip: `${["Feed", "Intermediate", "Treated", "Product"][i]}\n${streamLinesFor(model, i).join("\n")}`
    });
  }
  streams.push({ id: "U-101", name: "Utility", type: "utility", utility: true, path: [{ x: 650, y: 625 }, { x: 650, y: y + 135 }], label: { x: 670, y: 548 }, lines: [`Energy: ${fmt(model.selection.config.energy, 2)} MMBtu/klb`, `Opex: ${money(model.selection.config.operating, 3)}/lb`], tooltip: "Utility and operating-cost tie-in" });
  return { units, streams };
}

function unitIdFor(selection, i) {
  const prefix = selection.type === "objectLevel" ? ["OBJ", "N", "U", "SYS", "OUT"] : ["IN", "U", "X", "V", "OUT"];
  if (/furnace|heater/i.test(selection.config.units[i])) return `F-${101 + i}`;
  if (/column|absorber|regenerator|stabilizer|deethanizer|depropanizer|debutanizer|demethanizer/i.test(selection.config.units[i])) return `T-${101 + i}`;
  if (/reactor|bed|adsorber|guard/i.test(selection.config.units[i])) return `R-${101 + i}`;
  if (/compressor|blower|expander/i.test(selection.config.units[i])) return `C-${101 + i}`;
  if (/tank|storage/i.test(selection.config.units[i])) return `TK-${101 + i}`;
  return `${prefix[i]}-${101 + i}`;
}

function unitTypeFor(name, i) {
  if (/pump/i.test(name)) return "pump";
  if (/furnace|heater|reboiler/i.test(name)) return "furnace";
  if (/compressor|blower|expander/i.test(name)) return "blower";
  if (/tank|storage/i.test(name)) return "tank";
  if (/column|absorber|regenerator|deethanizer|depropanizer|debutanizer|stabilizer|stripper|demethanizer/i.test(name)) return "column";
  if (/reactor|bed|adsorber|guard/i.test(name)) return "reactor";
  return i === 0 || i === 4 ? "box" : "skid";
}

function streamLinesFor(model, i) {
  const m = i === 0 ? model.inputs.massFlowLbHr : model.product.massFlowLbHr * (0.98 + i * 0.005);
  const temp = i === 0 ? model.inputs.temperature : model.inputs.temperature + model.selection.config.dT * (i / 3);
  const pressure = i === 0 ? model.inputs.pressure : model.inputs.pressure + model.selection.config.dP * (i / 3);
  return [`${fmt(m, 0)} lb/hr`, `${fmt(temp, 0)} °F | ${fmt(Math.max(pressure, 0), 0)} psig`];
}

function drawViewTitle(model) {
  const cfg = model.selection.config;
  addText(layers.labels, cfg.title, 35, 35, "view-title");
  addText(layers.labels, cfg.subtitle, 35, 58, "view-subtitle");
}

function drawUnit(unit, model) {
  const g = svgEl("g", { class: "selectable unit" });
  g.dataset.tooltip = `${unit.id} ${unit.name}\nView: ${model.selection.config.title}`;
  if (unit.type === "furnace") drawFurnaceShape(g, unit, model);
  else if (unit.type === "pump") drawPumpShape(g, unit);
  else if (unit.type === "blower") drawBlowerShape(g, unit);
  else if (unit.type === "column") drawColumnShape(g, unit);
  else if (unit.type === "reactor") drawReactorShape(g, unit);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}


function drawPumpShape(g, u) {
  const cx = u.x + u.width / 2;
  const cy = u.y + 48;
  const inletX1 = u.x + 5;
  const inletX2 = cx - 30;
  const outletX1 = cx + 30;
  const outletX2 = u.x + u.width - 5;

  g.appendChild(svgEl("line", { x1: inletX1, y1: cy, x2: inletX2, y2: cy, class: "pump-stream-line", "marker-end": "url(#pumpArrowHead)" }));
  g.appendChild(svgEl("line", { x1: outletX1, y1: cy, x2: outletX2, y2: cy, class: "pump-stream-line", "marker-end": "url(#pumpArrowHead)" }));
  g.appendChild(svgEl("circle", { cx, cy, r: 30, class: "pump-body" }));
  g.appendChild(svgEl("polygon", { points: `${cx},${cy - 40} ${cx + 20},${cy - 10} ${cx - 20},${cy - 10}`, class: "pump-orientation" }));
  addText(g, u.id.replace(/^OBJ-101$/, "P-101"), cx, u.y + 108, "pump-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawBoxShape(g, u) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" })); addText(g, u.id, u.x + u.width / 2, u.y + 30, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + 52, "unit-name", "middle"); }
function drawFurnaceShape(g, u, model) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 12, class: "unit-shape" })); g.appendChild(svgEl("rect", { x: u.x + 22, y: u.y + 25, width: u.width - 44, height: 95, rx: 8, class: "unit-muted" })); for (let i = 0; i < 4; i++) g.appendChild(svgEl("path", { d: `M ${u.x + 38} ${u.y + 45 + i * 20} H ${u.x + u.width - 38}`, class: "unit-coil" })); g.appendChild(svgEl("path", { d: `M ${u.x + 62} ${u.y + 155} L ${u.x + 88} ${u.y + 125} L ${u.x + 114} ${u.y + 155} Z`, fill: "#fee2e2", stroke: "#991b1b", "stroke-width": 2 })); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 22, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 40, "unit-name", "middle"); addText(g, `${fmt(model.selection.config.energy, 2)} MMBtu/klb`, u.x + u.width / 2, u.y + 142, "unit-name energy-text", "middle"); }
function drawBlowerShape(g, u) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" })); g.appendChild(svgEl("circle", { cx: u.x + 42, cy: u.y + 35, r: 24, fill: "#fff", stroke: "#334155", "stroke-width": 2 })); g.appendChild(svgEl("path", { d: `M ${u.x + 42} ${u.y + 35} L ${u.x + 65} ${u.y + 26} L ${u.x + 63} ${u.y + 45} Z`, fill: "#e0f2fe", stroke: "#334155", "stroke-width": 1.5 })); addText(g, u.id, u.x + 105, u.y + 30, "unit-tag", "middle"); addText(g, u.name, u.x + 105, u.y + 50, "unit-name", "middle"); }
function drawColumnShape(g, u) { g.appendChild(svgEl("rect", { x: u.x + 42, y: u.y - 25, width: 72, height: u.height + 80, rx: 34, class: "unit-shape" })); for (let i = 0; i < 4; i++) g.appendChild(svgEl("line", { x1: u.x + 50, y1: u.y + i * 28, x2: u.x + 106, y2: u.y + i * 28, class: "unit-detail" })); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 72, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 90, "unit-name", "middle"); }
function drawReactorShape(g, u) { g.appendChild(svgEl("rect", { x: u.x + 18, y: u.y - 10, width: u.width - 36, height: u.height + 45, rx: 26, class: "unit-highlight" })); addText(g, "CAT", u.x + u.width / 2, u.y + 45, "unit-name", "middle"); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 52, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 70, "unit-name", "middle"); }
function drawTankShape(g, u) { g.appendChild(svgEl("ellipse", { cx: u.x + u.width/2, cy: u.y + 18, rx: u.width/2 - 12, ry: 18, class: "unit-shape" })); g.appendChild(svgEl("rect", { x: u.x + 12, y: u.y + 18, width: u.width - 24, height: u.height - 8, class: "unit-shape" })); addText(g, u.id, u.x + u.width / 2, u.y + 52, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + 72, "unit-name", "middle"); }
function drawStream(stream) { if (!showUtilities && stream.utility) return; const g = svgEl("g", { class: `stream-group ${stream.type}` }); const line = svgEl("polyline", { points: pointsToString(stream.path), class: `stream ${stream.type}` }); const hit = svgEl("polyline", { points: pointsToString(stream.path), class: "stream-hitbox" }); hit.dataset.tooltip = stream.tooltip; g.appendChild(line); g.appendChild(hit); layers.streams.appendChild(g); attachTooltip(hit); }
function drawStreamLabel(stream) {
  if (!showLabels || (!showUtilities && stream.utility)) return;
  const x = stream.label.x, y = stream.label.y, w = 182, h = 58;
  const g = svgEl("g", { class: "stream-label stream-table" });
  g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: 7, class: "stream-label-box" }));
  addText(g, `${stream.id} ${stream.name}`, x + 8, y + 17, "stream-label-title");
  addText(g, stream.lines[0], x + 8, y + 35, "stream-label-text");
  addText(g, stream.lines[1], x + 8, y + 51, "stream-label-text");
  layers.labels.appendChild(g);
}

function drawOverlays(model) {
  if (!showOverlays) return;
  const g = svgEl("g");
  g.appendChild(svgEl("rect", { x: 30, y: 665, width: 345, height: 145, rx: 10, class: "overlay-box" }));
  addText(g, "Selection Basis", 48, 692, "overlay-title");
  addMultilineText(g, [
    `Object Level: ${objectLevelSelect.value || "—"}`,
    `Process Area: ${processAreaSelect.value || "—"}`,
    `Business View: ${document.querySelector('input[name="businessView"]:checked')?.value || "—"}`,
    `Feed: ${fmt(model.inputs.feedFlowGpm, 0)} gpm / ${fmt(model.inputs.massFlowLbHr, 0)} lb/hr`,
    `Product: ${fmt(model.product.flowGpm, 0)} gpm / ${fmt(model.product.massFlowLbHr, 0)} lb/hr`
  ], 48, 717);
  layers.overlays.appendChild(g);
  drawLegendOverlay();
}
function drawLegendOverlay() { const g = svgEl("g"); g.appendChild(svgEl("rect", { x: 1110, y: 35, width: 235, height: 165, rx: 10, class: "legend-box" })); addText(g, "Legend", 1128, 60, "legend-title"); [["process","Process"],["fuel","Fuel"],["gas","Gas"],["utility","Utility"],["flue","Vent / Flue"]].forEach(([cls,label],i)=>{ const y=84+i*24; g.appendChild(svgEl("line", { x1: 1130, y1: y, x2: 1178, y2: y, class: `stream ${cls}` })); addText(g, label, 1192, y + 4, "legend-text"); }); layers.overlays.appendChild(g); }

function updateOutputTable(model) {
  outputTitle.textContent = `${model.selection.config.title} Product Properties`;
  const p = model.product;
  const rows = [
    ["Product flow", `${fmt(p.flowGpm, 1)} gpm`],
    ["Mass flow rate", `${fmt(p.massFlowLbHr, 0)} lb/hr`],
    ["Density", `${fmt(p.density, 2)} lb/ft³`],
    ["Viscosity", `${fmt(p.viscosity, 3)} cP`],
    ["Temperature", `${fmt(p.temperature, 1)} °F`],
    ["Pressure", `${fmt(p.pressure, 1)} psig`],
    ["Price", `${money(p.priceLb, 3)}/lb`],
    ["Price", `${money(p.priceGal, 2)}/gal`],
    ["Price", `${money(p.priceMMBtu, 2)}/MMBtu`]
  ];
  outputTable.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  activeViewName.textContent = model.selection.config.title;
}

function updateEconomicsTable(model) {
  const e = model.economics;
  const rows = [
    ["Feed input cost", `${money(e.feedInputCost, 2)}/hr`],
    ["Energy input cost", `${money(e.energyInputCost, 2)}/hr`],
    ["Operating cost", `${money(e.operatingCost, 2)}/hr`],
    ["Product prices", `${money(model.product.priceLb, 3)}/lb | ${money(model.product.priceGal, 2)}/gal | ${money(model.product.priceMMBtu, 2)}/MMBtu`],
    ["Spread vs feed", `${money(e.spreadLb, 3)}/lb | ${money(e.spreadGal, 2)}/gal | ${money(e.spreadMMBtu, 2)}/MMBtu`],
    ["Estimated net margin", `${money(e.netMargin, 2)}/hr`]
  ];
  economicsTable.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
}

function attachTooltip(el) { el.addEventListener("mouseenter", () => { tooltip.textContent = el.dataset.tooltip || ""; tooltip.style.display = "block"; }); el.addEventListener("mousemove", (event) => { const rect = svgWrap.getBoundingClientRect(); tooltip.style.left = `${event.clientX - rect.left + svgWrap.scrollLeft + 14}px`; tooltip.style.top = `${event.clientY - rect.top + svgWrap.scrollTop + 14}px`; }); el.addEventListener("mouseleave", () => { tooltip.style.display = "none"; }); }

function render() {
  if (!layers) return;
  clearLayers();
  const model = computeModel();
  const pfd = buildDynamicPfd(model);
  drawGrid();
  drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);
  drawOverlays(model);
  updateOutputTable(model);
  updateEconomicsTable(model);
}

function refreshSelectionInputs() {
  const selection = getSelection();
  renderInputForm(selection);
  render();
}

function resetInputs() {
  showLabels = true;
  showUtilities = true;
  showOverlays = true;
  renderInputForm(getSelection());
  render();
}

function initializeControls() {
  renderInputForm(getSelection());
  document.getElementById("btnReset").addEventListener("click", resetInputs);
  document.getElementById("btnLabels").addEventListener("click", () => { showLabels = !showLabels; render(); });
  document.getElementById("btnUtilities").addEventListener("click", () => { showUtilities = !showUtilities; render(); });
  document.getElementById("btnOverlays").addEventListener("click", () => { showOverlays = !showOverlays; render(); });
  document.getElementById("btnClearBusinessView").addEventListener("click", () => { document.querySelectorAll('input[name="businessView"]').forEach(radio => radio.checked = false); render(); });
  document.querySelectorAll('input[name="businessView"]').forEach(radio => radio.addEventListener("change", render));
  objectLevelSelect.addEventListener("change", () => { if (objectLevelSelect.value) processAreaSelect.value = ""; refreshSelectionInputs(); });
  processAreaSelect.addEventListener("change", () => { if (processAreaSelect.value) objectLevelSelect.value = ""; refreshSelectionInputs(); });
}

async function startPfdTemplate() {
  try {
    await loadExternalSvg();
    initializeSvgReferences();
    initializeControls();
    render();
  } catch (error) {
    svgWrap.insertAdjacentHTML("beforeend", `<div class="svg-load-error">${error.message}</div>`);
    console.error(error);
  }
}



/* ------------------------------------------------------------------
   Reusable HYSYS / UniSim-style symbol library
   These overrides let the renderer use standard symbols whenever a
   dynamic view contains pump, compressor, turbine, heat exchanger,
   column, separator, vessel, valve, pipe, liquid/vapor/energy stream.
------------------------------------------------------------------ */
function unitTypeFor(name, i) {
  if (/pump/i.test(name)) return "pump";
  if (/compressor|blower/i.test(name)) return "compressor";
  if (/turbine|expander/i.test(name)) return "turbine";
  if (/exchanger|preheater|cooler|heater|reboiler|condenser|mche/i.test(name)) return "exchanger";
  if (/furnace|fired heater/i.test(name)) return "furnace";
  if (/column|absorber|regenerator|deethanizer|depropanizer|debutanizer|stabilizer|stripper|demethanizer/i.test(name)) return "column";
  if (/separator|drum|knockout|ko drum/i.test(name)) return "separator";
  if (/vessel|reactor|bed|adsorber|guard/i.test(name)) return "vessel";
  if (/tank|storage/i.test(name)) return "tank";
  if (/valve|control/i.test(name)) return "valve";
  if (/pipe|pipeline|header/i.test(name)) return "pipe";
  return i === 0 || i === 4 ? "box" : "skid";
}

function streamTypeFor(model, i) {
  const key = model.selection.key;
  if (i === 0) return /LNG|Dehydration|Mercury Removal|NGLs/.test(key) ? "vapor" : "liquid";
  if (i === 1) return /LNG|NGLs|Dehydration|Mercury Removal|Amine/.test(key) ? "vapor" : "liquid";
  if (i === 2) return /Fractionation|Stabilizer|Refinery|Petchem|HDS/.test(key) ? "liquid" : "vapor";
  return "liquid";
}

function buildDynamicPfd(model) {
  if (model.selection.type === "objectLevel" && model.selection.key === "Units") {
    return buildUnitSymbolShowcase(model);
  }
  const unitNames = model.selection.config.units;
  const unitX = [105, 335, 570, 815, 1050];
  const y = model.selection.type === "objectLevel" ? 340 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 180 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i];
    const to = units[i + 1];
    const sy = y + from.height / 2;
    // Keep stream label/table boxes in the open upper band of the SVG.
    // This prevents overlap with unit symbols and the stream centerlines.
    const labelSlots = [
      { x: 105, y: 115 },
      { x: 370, y: 115 },
      { x: 635, y: 115 },
      { x: 900, y: 115 }
    ];
    streams.push({
      id: `S-${101 + i}`,
      name: ["Feed", "Intermediate", "Treated", "Product"][i],
      type: streamTypeFor(model, i),
      utility: false,
      path: [{ x: from.x + from.width, y: sy }, { x: to.x, y: sy }],
      label: labelSlots[i],
      lines: streamLinesFor(model, i),
      tooltip: `${["Feed", "Intermediate", "Treated", "Product"][i]}\n${streamLinesFor(model, i).join("\n")}`
    });
  }
  streams.push({ id: "E-101", name: "Energy", type: "energy", utility: true, path: [{ x: 650, y: 625 }, { x: 650, y: y + 135 }], label: { x: 760, y: 690 }, lines: [`Energy: ${fmt(model.selection.config.energy, 2)} MMBtu/klb`, `Opex: ${money(model.selection.config.operating, 3)}/lb`], tooltip: "Energy stream / duty input" });
  return { units, streams };
}

function buildUnitSymbolShowcase(model) {
  const units = [
    { id: "P-101", name: "Pump", type: "pump", x: 60, y: 230, width: 165, height: 120 },
    { id: "C-101", name: "Compressor", type: "compressor", x: 280, y: 230, width: 165, height: 120 },
    { id: "GT-101", name: "Turbine", type: "turbine", x: 500, y: 230, width: 165, height: 120 },
    { id: "E-101", name: "Heat Exchanger", type: "exchanger", x: 720, y: 230, width: 175, height: 120 },
    { id: "T-101", name: "Column", type: "column", x: 955, y: 205, width: 150, height: 180 },
    { id: "V-101", name: "Separator", type: "separator", x: 80, y: 500, width: 185, height: 120 },
    { id: "D-101", name: "Vessel", type: "vessel", x: 335, y: 500, width: 170, height: 120 },
    { id: "XV-101", name: "Valve", type: "valve", x: 575, y: 500, width: 150, height: 110 },
    { id: "PL-101", name: "Pipe", type: "pipe", x: 785, y: 500, width: 220, height: 110 }
  ];
  const streams = [
    { id: "L-101", name: "Liquid Stream", type: "liquid", utility: false, path: [{x:1050,y:525},{x:1260,y:525}], label:{x:1110,y:285}, lines:[`${fmt(model.inputs.massFlowLbHr,0)} lb/hr`,`${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure,0)} psig`], tooltip:"Liquid process stream" },
    { id: "V-101", name: "Vapor Stream", type: "vapor", utility: false, path: [{x:1050,y:570},{x:1260,y:570}], label:{x:1110,y:360}, lines:[`${fmt(model.product.massFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:"Vapor process stream" },
    { id: "Q-101", name: "Energy Stream", type: "energy", utility: true, path: [{x:1050,y:615},{x:1260,y:615}], label:{x:1110,y:435}, lines:[`Duty basis`, `${fmt(model.selection.config.energy,2)} MMBtu/klb`], tooltip:"Energy stream" }
  ];
  return { units, streams };
}

function drawUnit(unit, model) {
  const g = svgEl("g", { class: "selectable unit" });
  g.dataset.tooltip = `${unit.id} ${unit.name}\nSymbol: ${unit.type}\nView: ${model.selection.config.title}`;
  if (unit.type === "furnace") drawFurnaceShape(g, unit, model);
  else if (unit.type === "pump") drawPumpShape(g, unit);
  else if (unit.type === "compressor") drawCompressorShape(g, unit);
  else if (unit.type === "turbine") drawTurbineShape(g, unit);
  else if (unit.type === "exchanger") drawHeatExchangerShape(g, unit);
  else if (unit.type === "column") drawColumnShape(g, unit);
  else if (unit.type === "separator") drawSeparatorShape(g, unit);
  else if (unit.type === "vessel") drawVesselShape(g, unit);
  else if (unit.type === "valve") drawValveShape(g, unit);
  else if (unit.type === "pipe") drawPipeShape(g, unit);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}

function drawCompressorShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 48;
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: cx - 34, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx + 34, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("path", { d: `M ${cx-35} ${cy-30} L ${cx+35} ${cy-18} L ${cx+35} ${cy+18} L ${cx-35} ${cy+30} Z`, class: "compressor-body" }));
  g.appendChild(svgEl("path", { d: `M ${cx-12} ${cy-18} Q ${cx+12} ${cy} ${cx-12} ${cy+18}`, class: "compressor-blade" }));
  addText(g, u.id, cx, u.y + 108, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawTurbineShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 48;
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: cx - 36, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx + 36, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("path", { d: `M ${cx-36} ${cy-18} L ${cx+36} ${cy-30} L ${cx+36} ${cy+30} L ${cx-36} ${cy+18} Z`, class: "turbine-body" }));
  g.appendChild(svgEl("path", { d: `M ${cx+12} ${cy-20} Q ${cx-10} ${cy} ${cx+12} ${cy+20}`, class: "turbine-blade" }));
  g.appendChild(svgEl("line", { x1: cx, y1: cy+32, x2: cx, y2: cy+55, class: "symbol-energy-line" }));
  addText(g, u.id, cx, u.y + 108, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawHeatExchangerShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 50;
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: cx - 45, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx + 45, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("ellipse", { cx, cy, rx: 45, ry: 28, class: "exchanger-shell" }));
  g.appendChild(svgEl("path", { d: `M ${cx-36} ${cy} C ${cx-18} ${cy-22}, ${cx+18} ${cy+22}, ${cx+36} ${cy}`, class: "exchanger-tube" }));
  g.appendChild(svgEl("path", { d: `M ${cx-36} ${cy} C ${cx-18} ${cy+22}, ${cx+18} ${cy-22}, ${cx+36} ${cy}`, class: "exchanger-tube" }));
  addText(g, u.id, cx, u.y + 108, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawColumnShape(g, u) {
  const cx = u.x + u.width / 2;
  const top = u.y - 20, h = u.height + 65;
  g.appendChild(svgEl("rect", { x: cx - 36, y: top, width: 72, height: h, rx: 34, class: "column-shell" }));
  for (let i = 1; i <= 5; i++) {
    const yy = top + i * h / 6;
    g.appendChild(svgEl("line", { x1: cx - 28, y1: yy, x2: cx + 28, y2: yy, class: "column-tray" }));
  }
  g.appendChild(svgEl("line", { x1: cx - 72, y1: top + h * 0.45, x2: cx - 36, y2: top + h * 0.45, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx, y1: top, x2: cx, y2: top - 38, class: "symbol-stream-line" }));
  addText(g, u.id, cx, top + h + 28, "unit-tag", "middle");
  addText(g, u.name, cx, top + h + 46, "unit-name", "middle");
}

function drawSeparatorShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 52;
  const x = u.x + 20, y = u.y + 25, w = u.width - 40, h = 55;
  g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: h/2, class: "separator-shell" }));
  g.appendChild(svgEl("line", { x1: x + 18, y1: y + h*0.62, x2: x + w - 18, y2: y + h*0.62, class: "separator-level" }));
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: x, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: x+w, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));
  addText(g, u.id, cx, u.y + 108, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawVesselShape(g, u) {
  const cx = u.x + u.width / 2;
  g.appendChild(svgEl("ellipse", { cx, cy: u.y + 28, rx: 42, ry: 20, class: "vessel-shell" }));
  g.appendChild(svgEl("rect", { x: cx - 42, y: u.y + 28, width: 84, height: 52, class: "vessel-shell" }));
  g.appendChild(svgEl("ellipse", { cx, cy: u.y + 80, rx: 42, ry: 20, class: "vessel-shell" }));
  addText(g, u.id, cx, u.y + 112, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 130, "unit-name", "middle");
}

function drawValveShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 50;
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: cx - 34, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx + 34, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("polygon", { points: `${cx-34},${cy-22} ${cx},${cy} ${cx-34},${cy+22}`, class: "valve-body" }));
  g.appendChild(svgEl("polygon", { points: `${cx+34},${cy-22} ${cx},${cy} ${cx+34},${cy+22}`, class: "valve-body" }));
  g.appendChild(svgEl("line", { x1: cx, y1: cy, x2: cx, y2: cy - 42, class: "valve-stem" }));
  g.appendChild(svgEl("line", { x1: cx - 22, y1: cy - 42, x2: cx + 22, y2: cy - 42, class: "valve-stem" }));
  addText(g, u.id, cx, u.y + 102, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 120, "unit-name", "middle");
}

function drawPipeShape(g, u) {
  const y = u.y + 52;
  g.appendChild(svgEl("line", { x1: u.x + 12, y1: y, x2: u.x + u.width - 12, y2: y, class: "pipe-body" }));
  g.appendChild(svgEl("line", { x1: u.x + 12, y1: y, x2: u.x + u.width - 12, y2: y, class: "pipe-centerline" }));
  g.appendChild(svgEl("line", { x1: u.x + u.width - 54, y1: y, x2: u.x + u.width - 12, y2: y, class: "symbol-stream-line" }));
  addText(g, u.id, u.x + u.width/2, u.y + 102, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width/2, u.y + 120, "unit-name", "middle");
}

function drawStream(stream) {
  if (!showUtilities && stream.utility) return;
  const g = svgEl("g", { class: `stream-group ${stream.type}` });
  const line = svgEl("polyline", { points: pointsToString(stream.path), class: `stream ${stream.type}` });
  const hit = svgEl("polyline", { points: pointsToString(stream.path), class: "stream-hitbox" });
  hit.dataset.tooltip = stream.tooltip;
  g.appendChild(line);
  g.appendChild(hit);
  layers.streams.appendChild(g);
  attachTooltip(hit);
}

function drawLegendOverlay() {
  const g = svgEl("g");
  g.appendChild(svgEl("rect", { x: 1095, y: 35, width: 255, height: 210, rx: 10, class: "legend-box" }));
  addText(g, "Legend", 1113, 60, "legend-title");
  [["liquid","Liquid Stream"],["vapor","Vapor Stream"],["energy","Energy Stream"],["fuel","Fuel"],["utility","Utility"],["flue","Vent / Flue"]].forEach(([cls,label],i)=>{
    const y=84+i*24;
    g.appendChild(svgEl("line", { x1: 1115, y1: y, x2: 1163, y2: y, class: `stream ${cls}` }));
    addText(g, label, 1177, y + 4, "legend-text");
  });
  layers.overlays.appendChild(g);
}

startPfdTemplate();
