const svgNS = "http://www.w3.org/2000/svg";

let svg;
let layers;
let showLabels = true;
let showUtilities = true;
let showOverlays = true;

const svgWrap = document.getElementById("svgWrap");
const tooltip = document.getElementById("pfdTooltip");
const pfdSvgMount = document.getElementById("pfdSvgMount");
const objectLevelSelect = document.getElementById("objectLevel");
const processAreaSelect = document.getElementById("processArea");
const activeViewName = document.getElementById("activeViewName");
const outputTitle = document.getElementById("outputTitle");

const inputIds = ["naphthaFlow", "vgoFlow", "feedTin", "feedTout", "feedPressure", "cp", "fuelLhv", "efficiency", "stackTemp", "excessAir"];

const areaData = {
  "Amine": { title: "Amine Treating", subtitle: "Acid gas absorber, lean/rich exchanger, regenerator", units: ["Acid Gas Feed", "Absorber", "Lean/Rich Exchanger", "Regenerator", "Sweet Gas"], rows: [["Circulation Rate", "420 gpm"], ["H2S Removal", "99.2%"], ["Reboiler Duty", "18.5 MMBtu/h"], ["Lean Amine", "35 wt% MDEA"], ["Rich Loading", "0.42 mol/mol"]] },
  "Dehydration": { title: "Molecular Sieve Dehydration", subtitle: "Four-bed adsorption / regeneration cycle", units: ["Wet Gas", "Adsorber A/B", "Regeneration Heater", "Cooler", "Dry Gas"], rows: [["Outlet Moisture", "< 0.1 ppmv"], ["Cycle Time", "6 h / bed"], ["Regen Gas", "8.5 MMSCFD"], ["Regen Heater", "6.2 MMBtu/h"], ["Pressure Drop", "7.5 psi"]] },
  "HDS": { title: "Hydrodesulfurization", subtitle: "Feed heater, reactor, separator, recycle hydrogen", units: ["Feed", "Charge Heater", "HDS Reactor", "HP Separator", "Stripper"], rows: [["Sulfur In", "1.20 wt%"], ["Sulfur Out", "8 ppmw"], ["H2 Consumption", "420 scf/bbl"], ["Reactor Temp", "690 °F"], ["LHSV", "1.4 h⁻¹"]] },
  "Mercury Removal": { title: "Mercury Removal Unit", subtitle: "Fixed-bed adsorber upstream of cryogenic service", units: ["Dry Gas", "Guard Bed A", "Guard Bed B", "Hg Analyzer", "Treated Gas"], rows: [["Inlet Hg", "80 ng/Nm³"], ["Outlet Hg", "< 10 ng/Nm³"], ["Bed Lead/Lag", "A / B"], ["Bed ΔP", "3.8 psi"], ["Online Factor", "99.5%"]] },
  "Fractionation": { title: "NGL Fractionation", subtitle: "Deethanizer, depropanizer, debutanizer train", units: ["NGL Feed", "Deethanizer", "Depropanizer", "Debutanizer", "C5+ Product"], rows: [["Ethane Recovery", "93%"], ["Propane Purity", "96 mol%"], ["Butane Purity", "94 mol%"], ["Reboiler Duty", "42 MMBtu/h"], ["Condenser Duty", "35 MMBtu/h"]] },
  "Stabilizer": { title: "Condensate Stabilizer", subtitle: "Light-ends removal with stabilized liquid product", units: ["Condensate Feed", "Preheater", "Stabilizer", "Reboiler", "Stabilized Condensate"], rows: [["RVP", "9.0 psia"], ["C4- Overhead", "3,200 lb/h"], ["Bottoms Rate", "18,500 bpd"], ["Reboiler Duty", "15.8 MMBtu/h"], ["Column Pressure", "165 psig"]] },
  "LNG": { title: "LNG Train", subtitle: "Pretreatment, liquefaction, refrigerant compression, storage", units: ["Treated Gas", "MCHE", "MR Compressor", "LNG Drum", "LNG Tank"], rows: [["LNG Production", "5.0 MTPA"], ["Specific Power", "285 kWh/t LNG"], ["End Flash", "0.08 mol% N2"], ["Storage Temp", "-260 °F"], ["Boil-off Gas", "0.05%/day"]] },
  "NGLs": { title: "NGL Recovery", subtitle: "Turbo-expander, demethanizer, residue compression", units: ["Rich Gas", "Expander", "Demethanizer", "Residue Compressor", "NGL Product"], rows: [["C3+ Recovery", "88%"], ["Expander Power", "7,800 hp"], ["Demethanizer Duty", "22 MMBtu/h"], ["Residue Gas", "515 MMSCFD"], ["NGL Product", "28,000 bpd"]] },
  "Refinery": { title: "Refinery Heater View", subtitle: "Fired heater with hydrocarbon feeds and stack losses", units: ["Feed Sources", "Charge Furnace", "Fuel Gas Skid", "Combustion Air", "Heated Product"], rows: null },
  "Petchem": { title: "Petrochemical Reactor Section", subtitle: "Feed preparation, reactor, separator, recycle loop", units: ["Feed Prep", "Reactor", "Quench", "Separator", "Product Recovery"], rows: [["Conversion", "82%"], ["Selectivity", "91%"], ["Recycle Ratio", "2.8"], ["Reactor Duty", "12.4 MMBtu/h"], ["Product Rate", "145 kta"]] }
};

const levelData = {
  "Streams": { title: "Stream Network View", subtitle: "Feed, intermediate, utility, and product stream focus", units: ["Feeds", "Mixing Node", "Process Unit", "Utility Tie-ins", "Products"], rows: [["Total Process Streams", "18"], ["Utility Streams", "6"], ["Active Material Balance", "Closed"], ["Max Temperature", "680 °F"], ["Max Pressure", "60 psig"]] },
  "Units": { title: "Unit Operation View", subtitle: "Major equipment blocks and unit operation boundaries", units: ["Pump", "Heat Exchanger", "Furnace", "Reactor/Column", "Separator"], rows: [["Major Units", "12"], ["Rotating Equipment", "4"], ["Heat Transfer Units", "5"], ["Pressure Vessels", "3"], ["Controls Shown", "8 loops"]] },
  "Plants": { title: "Plant View", subtitle: "Integrated process plant with utilities and product routing", units: ["Feed System", "Process Plant", "Utility Plant", "Storage", "Loading"], rows: [["Plant Throughput", "75,000 bpd"], ["Availability", "96.5%"], ["Fuel Demand", "52 MMBtu/h"], ["Power Demand", "18 MW"], ["Product Tanks", "8"]] },
  "Sites": { title: "Site View", subtitle: "Multiple plants connected by site-wide utilities and logistics", units: ["Refinery", "LNG", "Petchem", "Tank Farm", "Export"], rows: [["Plants Online", "5"], ["Site Steam Header", "650 psig"], ["Total Power", "85 MW"], ["Tankage", "2.4 MMbbl"], ["Flare Header", "Normal"]] },
  "Regions": { title: "Regional View", subtitle: "Sites, pipelines, storage hubs, and product markets", units: ["Gulf Coast", "Pipeline Hub", "Storage Hub", "Market", "Export Dock"], rows: [["Regional Sites", "7"], ["Pipeline Capacity", "1.2 MMbpd"], ["Storage Capacity", "18 MMbbl"], ["Export Capacity", "650 kbpd"], ["Demand Index", "Strong"]] }
};

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

function n(id) { return Number(document.getElementById(id).value || 0); }
function fmt(value, digits = 1) { return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "—"; }
function svgEl(name, attrs = {}) { const el = document.createElementNS(svgNS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); return el; }
function addText(group, text, x, y, cls = "", anchor = "start") { const t = svgEl("text", { x, y, class: cls, "text-anchor": anchor }); t.textContent = text; group.appendChild(t); return t; }
function addMultilineText(group, lines, x, y, cls = "overlay-text", lineHeight = 16) { lines.forEach((line, i) => addText(group, line, x, y + i * lineHeight, cls)); }
function pointsToString(points) { return points.map(p => `${p.x},${p.y}`).join(" "); }

function getSelection() {
  const processArea = processAreaSelect.value;
  const objectLevel = objectLevelSelect.value;
  if (processArea) return { type: "processArea", key: processArea, config: areaData[processArea] };
  if (objectLevel) return { type: "objectLevel", key: objectLevel, config: levelData[objectLevel] };
  return { type: "default", key: "Default", config: areaData.Refinery };
}

function computeModel() {
  const naphtha = n("naphthaFlow");
  const vgo = n("vgoFlow");
  const totalFeed = naphtha + vgo;
  const tin = n("feedTin");
  const tout = n("feedTout");
  const pressure = n("feedPressure");
  const cp = n("cp");
  const effPct = Math.max(n("efficiency"), 0.1);
  const fuelLhv = Math.max(n("fuelLhv"), 1);
  const stackTemp = n("stackTemp");
  const excessAir = n("excessAir");
  const deltaT = tout - tin;
  const processDutyMMBtuHr = Math.max(totalFeed * cp * deltaT, 0) / 1_000_000;
  const firedDutyMMBtuHr = processDutyMMBtuHr / (effPct / 100);
  const fuelScfh = firedDutyMMBtuHr * 1_000_000 / fuelLhv;
  const fuelMscfd = fuelScfh * 24 / 1000;
  const stackLossMMBtuHr = Math.max(firedDutyMMBtuHr - processDutyMMBtuHr, 0);
  const airScfh = fuelScfh * 10.2 * (1 + excessAir / 100);
  const selection = getSelection();
  return { inputs: { naphtha, vgo, totalFeed, tin, tout, pressure, cp, effPct, fuelLhv, stackTemp, excessAir }, results: { processDutyMMBtuHr, firedDutyMMBtuHr, fuelScfh, fuelMscfd, stackLossMMBtuHr, airScfh }, selection };
}

function clearLayers() { Object.values(layers).forEach(layer => layer.innerHTML = ""); }
function drawGrid() { for (let x = 0; x <= 1400; x += 50) layers.grid.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: 850, class: x % 100 === 0 ? "grid-major" : "grid-line" })); for (let y = 0; y <= 850; y += 50) layers.grid.appendChild(svgEl("line", { x1: 0, y1: y, x2: 1400, y2: y, class: y % 100 === 0 ? "grid-major" : "grid-line" })); }

function buildDynamicPfd(model) {
  const cfg = model.selection.config;
  const unitNames = cfg.units;
  const unitX = [110, 340, 575, 810, 1045];
  const y = model.selection.type === "objectLevel" ? 335 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 175 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i], to = units[i + 1];
    const sy = y + from.height / 2;
    streams.push({
      id: `S-${String(i + 101).padStart(3, "0")}`,
      name: streamNameFor(model.selection, i),
      type: i === 0 ? "process" : i === 2 ? "gas" : "process",
      utility: false,
      path: [{ x: from.x + from.width, y: sy }, { x: to.x, y: sy }],
      label: { x: from.x + from.width + 18, y: sy - 64 },
      lines: streamLinesFor(model, i),
      tooltip: `${streamNameFor(model.selection, i)}\n${streamLinesFor(model, i).join("\n")}`
    });
  }
  streams.push({ id: "U-101", name: "Utility Header", type: "utility", utility: true, path: [{ x: 650, y: 620 }, { x: 650, y: y + 130 }], label: { x: 670, y: 548 }, lines: ["Steam / Power / Fuel", "Available"], tooltip: "Utility Header\nSteam / power / fuel tie-in" });
  if (model.selection.key === "Refinery" || model.selection.type === "default") addFiredHeaterDetails(units, streams, model);
  return { units, streams };
}

function unitIdFor(selection, i) {
  const processPrefixes = { "Amine": ["AG", "A", "E", "R", "SG"], "Dehydration": ["WG", "D", "H", "C", "DG"], "HDS": ["FD", "F", "R", "V", "T"], "Mercury Removal": ["DG", "MR", "MR", "AI", "TG"], "Fractionation": ["NGL", "T", "T", "T", "C5"], "Stabilizer": ["CD", "E", "T", "E", "SC"], "LNG": ["TG", "E", "C", "V", "TK"], "NGLs": ["RG", "EXP", "T", "C", "NGL"], "Petchem": ["FP", "R", "Q", "V", "PR"], "Refinery": ["FEED", "F", "FG", "B", "PROD"] };
  const levelPrefixes = { "Streams": ["S-IN", "M", "U", "UT", "S-OUT"], "Units": ["P", "E", "F", "R", "V"], "Plants": ["FD", "PLT", "UTL", "TK", "LD"], "Sites": ["REF", "LNG", "PCH", "TKF", "EXP"], "Regions": ["GC", "PL", "ST", "MKT", "DOC"] };
  const arr = selection.type === "processArea" || selection.type === "default" ? processPrefixes[selection.key] || processPrefixes.Refinery : levelPrefixes[selection.key];
  return `${arr[i]}-${String(101 + i).padStart(3, "0")}`;
}

function unitTypeFor(name, i) {
  if (/furnace|heater|reboiler/i.test(name)) return "furnace";
  if (/compressor|blower|expander/i.test(name)) return "blower";
  if (/stack/i.test(name)) return "stack";
  if (/tank|storage/i.test(name)) return "tank";
  if (/column|absorber|regenerator|deethanizer|depropanizer|debutanizer|stabilizer|stripper|demethanizer/i.test(name)) return "column";
  if (/reactor|bed|adsorber|guard/i.test(name)) return "reactor";
  return i === 0 || i === 4 ? "box" : "skid";
}

function streamNameFor(selection, i) {
  const defaultNames = ["Feed", "Treated / Heated Stream", "Intermediate Product", "Final Product"];
  if (selection.key === "Streams") return ["Raw Feed", "Mixed Feed", "Processed Stream", "Product Header"][i];
  if (selection.key === "Regions") return ["Regional Supply", "Pipeline Transfer", "Storage Draw", "Market Delivery"][i];
  return defaultNames[i];
}

function streamLinesFor(model, i) {
  const { inputs } = model;
  const flow = [inputs.naphtha, inputs.totalFeed, inputs.totalFeed * 0.96, inputs.totalFeed * 0.94][i] || inputs.totalFeed;
  const temp = [inputs.tin, (inputs.tin + inputs.tout) / 2, inputs.tout - 20, inputs.tout][i] || inputs.tout;
  const pressure = inputs.pressure - i * 4;
  return [`${fmt(flow, 0)} lb/h`, `${fmt(temp, 0)} °F | ${fmt(pressure, 0)} psig`];
}

function addFiredHeaterDetails(units, streams, model) {
  units[1] = { id: "F-101", name: "Charge Furnace", type: "furnace", x: 555, y: 255, width: 175, height: 190 };
  units[2] = { id: "FG-101", name: "Fuel Gas Skid", type: "skid", x: 555, y: 555, width: 175, height: 70 };
  units[3] = { id: "B-101", name: "Combustion Air", type: "blower", x: 260, y: 555, width: 155, height: 70 };
  units[4] = { id: "PROD", name: "Heated Feed", type: "box", x: 1030, y: 320, width: 155, height: 70 };
  streams.length = 0;
  streams.push(
    { id: "S-101", name: "Heavy Naphtha", type: "process", utility: false, path: [{x:220,y:315},{x:410,y:315},{x:410,y:300},{x:555,y:300}], label: {x:270,y:260}, lines: [`${fmt(model.inputs.naphtha,0)} lb/h`, `${fmt(model.inputs.tin,0)} °F | ${fmt(model.inputs.pressure,0)} psig`], tooltip: "Heavy Naphtha feed" },
    { id: "S-102", name: "VGO Feed", type: "process", utility: false, path: [{x:220,y:365},{x:555,y:365}], label: {x:300,y:386}, lines: [`${fmt(model.inputs.vgo,0)} lb/h`, `${fmt(model.inputs.tin + 60,0)} °F | ${fmt(model.inputs.pressure + 5,0)} psig`], tooltip: "VGO feed" },
    { id: "S-103", name: "Heated Feed", type: "process", utility: false, path: [{x:730,y:350},{x:1030,y:350}], label: {x:790,y:300}, lines: [`${fmt(model.inputs.totalFeed,0)} lb/h`, `${fmt(model.inputs.tout,0)} °F | ${fmt(model.inputs.pressure - 7,0)} psig`], tooltip: "Heated feed product" },
    { id: "FG-101", name: "Fuel Gas", type: "fuel", utility: true, path: [{x:642,y:555},{x:642,y:445}], label: {x:660,y:490}, lines: [`${fmt(model.results.fuelScfh,0)} scf/h`, `${fmt(model.inputs.fuelLhv,0)} Btu/scf`], tooltip: "Fuel gas to burners" },
    { id: "AIR-101", name: "Combustion Air", type: "gas", utility: true, path: [{x:415,y:590},{x:500,y:590},{x:500,y:420},{x:555,y:420}], label: {x:405,y:608}, lines: [`${fmt(model.results.airScfh,0)} scf/h`, `${fmt(model.inputs.excessAir,0)}% excess air`], tooltip: "Combustion air" },
    { id: "FLUE-101", name: "Flue Gas", type: "flue", utility: true, path: [{x:642,y:255},{x:642,y:185}], label: {x:662,y:205}, lines: [`Stack: ${fmt(model.inputs.stackTemp,0)} °F`, `Loss: ${fmt(model.results.stackLossMMBtuHr,2)} MMBtu/h`], tooltip: "Flue gas to stack" }
  );
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
  else if (unit.type === "blower") drawBlowerShape(g, unit);
  else if (unit.type === "column") drawColumnShape(g, unit);
  else if (unit.type === "reactor") drawReactorShape(g, unit);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}

function drawBoxShape(g, u) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" })); addText(g, u.id, u.x + u.width / 2, u.y + 30, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + 52, "unit-name", "middle"); }
function drawFurnaceShape(g, u, model) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 12, class: "unit-shape" })); g.appendChild(svgEl("rect", { x: u.x + 22, y: u.y + 25, width: u.width - 44, height: 95, rx: 8, class: "unit-muted" })); for (let i = 0; i < 4; i++) g.appendChild(svgEl("path", { d: `M ${u.x + 38} ${u.y + 45 + i * 20} H ${u.x + u.width - 38}`, class: "unit-coil" })); g.appendChild(svgEl("path", { d: `M ${u.x + 62} ${u.y + 155} L ${u.x + 88} ${u.y + 125} L ${u.x + 114} ${u.y + 155} Z`, fill: "#fee2e2", stroke: "#991b1b", "stroke-width": 2 })); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 22, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 40, "unit-name", "middle"); addText(g, `${fmt(model.results.processDutyMMBtuHr,1)} MMBtu/h`, u.x + u.width / 2, u.y + 142, "unit-name energy-text", "middle"); }
function drawBlowerShape(g, u) { g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" })); g.appendChild(svgEl("circle", { cx: u.x + 42, cy: u.y + 35, r: 24, fill: "#fff", stroke: "#334155", "stroke-width": 2 })); g.appendChild(svgEl("path", { d: `M ${u.x + 42} ${u.y + 35} L ${u.x + 65} ${u.y + 26} L ${u.x + 63} ${u.y + 45} Z`, fill: "#e0f2fe", stroke: "#334155", "stroke-width": 1.5 })); addText(g, u.id, u.x + 105, u.y + 30, "unit-tag", "middle"); addText(g, u.name, u.x + 105, u.y + 50, "unit-name", "middle"); }
function drawColumnShape(g, u) { g.appendChild(svgEl("rect", { x: u.x + 42, y: u.y - 25, width: 72, height: u.height + 80, rx: 34, class: "unit-shape" })); for (let i = 0; i < 4; i++) g.appendChild(svgEl("line", { x1: u.x + 50, y1: u.y + i * 28, x2: u.x + 106, y2: u.y + i * 28, class: "unit-detail" })); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 72, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 90, "unit-name", "middle"); }
function drawReactorShape(g, u) { g.appendChild(svgEl("rect", { x: u.x + 18, y: u.y - 10, width: u.width - 36, height: u.height + 45, rx: 26, class: "unit-highlight" })); addText(g, "CAT", u.x + u.width / 2, u.y + 45, "unit-name", "middle"); addText(g, u.id, u.x + u.width / 2, u.y + u.height + 52, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + u.height + 70, "unit-name", "middle"); }
function drawTankShape(g, u) { g.appendChild(svgEl("ellipse", { cx: u.x + u.width/2, cy: u.y + 18, rx: u.width/2 - 12, ry: 18, class: "unit-shape" })); g.appendChild(svgEl("rect", { x: u.x + 12, y: u.y + 18, width: u.width - 24, height: u.height - 8, class: "unit-shape" })); addText(g, u.id, u.x + u.width / 2, u.y + 52, "unit-tag", "middle"); addText(g, u.name, u.x + u.width / 2, u.y + 72, "unit-name", "middle"); }

function drawStream(stream) { if (!showUtilities && stream.utility) return; const g = svgEl("g", { class: `stream-group ${stream.type}` }); const line = svgEl("polyline", { points: pointsToString(stream.path), class: `stream ${stream.type}` }); const hit = svgEl("polyline", { points: pointsToString(stream.path), class: "stream-hitbox" }); hit.dataset.tooltip = stream.tooltip; g.appendChild(line); g.appendChild(hit); layers.streams.appendChild(g); attachTooltip(hit); }
function drawStreamLabel(stream) { if (!showLabels || (!showUtilities && stream.utility)) return; const x = stream.label.x, y = stream.label.y, w = 168, h = 58; const g = svgEl("g", { class: "stream-label" }); g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: 7, class: "stream-label-box" })); addText(g, `${stream.id} ${stream.name}`, x + 8, y + 17, "stream-label-title"); addText(g, stream.lines[0], x + 8, y + 35, "stream-label-text"); addText(g, stream.lines[1], x + 8, y + 51, "stream-label-text"); layers.labels.appendChild(g); }

function drawOverlays(model) { if (!showOverlays) return; const g = svgEl("g"); g.appendChild(svgEl("rect", { x: 30, y: 665, width: 325, height: 145, rx: 10, class: "overlay-box" })); addText(g, "Selection Basis", 48, 692, "overlay-title"); addMultilineText(g, [`Object Level: ${objectLevelSelect.value || "—"}`, `Process Area: ${processAreaSelect.value || "—"}`, `Business View: ${document.querySelector('input[name="businessView"]:checked')?.value || "—"}`, `Active SVG: ${model.selection.config.title}`, `Table: ${model.selection.type === "processArea" ? "Process area KPIs" : model.selection.type === "objectLevel" ? "Object level KPIs" : "Heater calculations"}`], 48, 717); layers.overlays.appendChild(g); drawLegendOverlay(); }
function drawLegendOverlay() { const g = svgEl("g"); g.appendChild(svgEl("rect", { x: 1110, y: 35, width: 235, height: 165, rx: 10, class: "legend-box" })); addText(g, "Legend", 1128, 60, "legend-title"); [["process","Process"],["fuel","Fuel"],["gas","Gas"],["utility","Utility"],["flue","Vent / Flue"]].forEach(([cls,label],i)=>{ const y=84+i*24; g.appendChild(svgEl("line", { x1: 1130, y1: y, x2: 1178, y2: y, class: `stream ${cls}` })); addText(g, label, 1192, y + 4, "legend-text"); }); layers.overlays.appendChild(g); }

function updateOutputTable(model) {
  const cfg = model.selection.config;
  const rows = cfg.rows || [["Process Duty", `${fmt(model.results.processDutyMMBtuHr,2)} MMBtu/h`], ["Fired Duty", `${fmt(model.results.firedDutyMMBtuHr,2)} MMBtu/h`], ["Fuel Gas Rate", `${fmt(model.results.fuelScfh,0)} scf/h`], ["Fuel Gas Rate", `${fmt(model.results.fuelMscfd,1)} MSCFD`], ["Combustion Air", `${fmt(model.results.airScfh,0)} scf/h`], ["Estimated Stack Loss", `${fmt(model.results.stackLossMMBtuHr,2)} MMBtu/h`]];
  outputTitle.textContent = `${cfg.title} Outputs`;
  document.getElementById("outputTable").innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  activeViewName.textContent = cfg.title;
}

function attachTooltip(el) { el.addEventListener("mouseenter", () => { tooltip.textContent = el.dataset.tooltip || ""; tooltip.style.display = "block"; }); el.addEventListener("mousemove", (event) => { const rect = svgWrap.getBoundingClientRect(); tooltip.style.left = `${event.clientX - rect.left + svgWrap.scrollLeft + 14}px`; tooltip.style.top = `${event.clientY - rect.top + svgWrap.scrollTop + 14}px`; }); el.addEventListener("mouseleave", () => { tooltip.style.display = "none"; }); }

function render() {
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
}

function resetInputs() {
  const defaults = { naphthaFlow: 15000, vgoFlow: 22000, feedTin: 420, feedTout: 680, feedPressure: 55, cp: 0.62, fuelLhv: 950, efficiency: 87, stackTemp: 650, excessAir: 15 };
  Object.entries(defaults).forEach(([id, value]) => document.getElementById(id).value = value);
  showLabels = true; showUtilities = true; showOverlays = true;
  render();
}

function initializeControls() {
  inputIds.forEach(id => document.getElementById(id).addEventListener("input", render));
  document.getElementById("btnReset").addEventListener("click", resetInputs);
  document.getElementById("btnLabels").addEventListener("click", () => { showLabels = !showLabels; render(); });
  document.getElementById("btnUtilities").addEventListener("click", () => { showUtilities = !showUtilities; render(); });
  document.getElementById("btnOverlays").addEventListener("click", () => { showOverlays = !showOverlays; render(); });
  document.getElementById("btnClearBusinessView").addEventListener("click", () => { document.querySelectorAll('input[name="businessView"]').forEach(radio => radio.checked = false); render(); });
  document.querySelectorAll('input[name="businessView"]').forEach(radio => radio.addEventListener("change", render));
  objectLevelSelect.addEventListener("change", () => { if (objectLevelSelect.value) processAreaSelect.value = ""; render(); });
  processAreaSelect.addEventListener("change", () => { if (processAreaSelect.value) objectLevelSelect.value = ""; render(); });
}

async function startPfdTemplate() {
  try { await loadExternalSvg(); initializeSvgReferences(); initializeControls(); render(); }
  catch (error) { svgWrap.insertAdjacentHTML("beforeend", `<div class="svg-load-error">${error.message}</div>`); console.error(error); }
}

startPfdTemplate();
