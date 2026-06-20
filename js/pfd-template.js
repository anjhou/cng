const svgNS = "http://www.w3.org/2000/svg";

const svg = document.getElementById("pfdSvg");
const svgWrap = document.getElementById("svgWrap");
const tooltip = document.getElementById("pfdTooltip");

const layers = {
  grid: document.getElementById("layerGrid"),
  streams: document.getElementById("layerStreams"),
  units: document.getElementById("layerUnits"),
  labels: document.getElementById("layerLabels"),
  overlays: document.getElementById("layerOverlays")
};

let showLabels = true;
let showUtilities = true;
let showOverlays = true;

const inputIds = [
  "naphthaFlow", "vgoFlow", "feedTin", "feedTout", "feedPressure",
  "cp", "fuelLhv", "efficiency", "stackTemp", "excessAir"
];

function n(id) {
  return Number(document.getElementById(id).value || 0);
}

function fmt(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function addText(group, text, x, y, cls = "", anchor = "start") {
  const t = svgEl("text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = text;
  group.appendChild(t);
  return t;
}

function addMultilineText(group, lines, x, y, cls = "overlay-text", lineHeight = 16) {
  lines.forEach((line, i) => addText(group, line, x, y + i * lineHeight, cls));
}

function pointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
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
  const processDutyBtuHr = Math.max(totalFeed * cp * deltaT, 0);
  const processDutyMMBtuHr = processDutyBtuHr / 1_000_000;
  const firedDutyMMBtuHr = processDutyMMBtuHr / (effPct / 100);
  const fuelScfh = firedDutyMMBtuHr * 1_000_000 / fuelLhv;
  const fuelMscfd = fuelScfh * 24 / 1000;
  const stackLossMMBtuHr = Math.max(firedDutyMMBtuHr - processDutyMMBtuHr, 0);
  const airScfh = fuelScfh * 10.2 * (1 + excessAir / 100);

  return {
    inputs: { naphtha, vgo, totalFeed, tin, tout, pressure, cp, effPct, fuelLhv, stackTemp, excessAir },
    results: { processDutyMMBtuHr, firedDutyMMBtuHr, fuelScfh, fuelMscfd, stackLossMMBtuHr, airScfh },
    units: {
      feed: { id: "FEED", name: "Feed Sources", type: "source", x: 90, y: 285, width: 135, height: 110 },
      furnace: { id: "F-101", name: "Charge Furnace", type: "furnace", x: 560, y: 255, width: 165, height: 190 },
      fuelSkid: { id: "FG-101", name: "Fuel Gas Skid", type: "skid", x: 560, y: 555, width: 165, height: 70 },
      airBlower: { id: "B-101", name: "Combustion Air", type: "blower", x: 250, y: 555, width: 145, height: 70 },
      stack: { id: "ST-101", name: "Stack", type: "stack", x: 580, y: 80, width: 125, height: 105 },
      product: { id: "PROD", name: "Heated Feed", type: "sink", x: 1030, y: 320, width: 145, height: 70 }
    },
    streams: []
  };
}

function buildStreams(model) {
  const { inputs, results } = model;
  model.streams = [
    {
      id: "S-101", name: "Heavy Naphtha", type: "process", utility: false,
      path: [{x: 225,y: 315},{x: 410,y: 315},{x: 410,y: 300},{x: 560,y: 300}],
      label: { x: 270, y: 260 },
      lines: [`${fmt(inputs.naphtha,0)} lb/h`, `${fmt(inputs.tin,0)} °F | ${fmt(inputs.pressure,0)} psig`],
      tooltip: `S-101 Heavy Naphtha Feed\nFlow: ${fmt(inputs.naphtha,0)} lb/h\nTemperature: ${fmt(inputs.tin,0)} °F\nPressure: ${fmt(inputs.pressure,0)} psig\nPhase: Liquid`
    },
    {
      id: "S-102", name: "VGO Feed", type: "process", utility: false,
      path: [{x: 225,y: 365},{x: 560,y: 365}],
      label: { x: 300, y: 386 },
      lines: [`${fmt(inputs.vgo,0)} lb/h`, `${fmt(inputs.tin + 60,0)} °F | ${fmt(inputs.pressure + 5,0)} psig`],
      tooltip: `S-102 VGO Feed\nFlow: ${fmt(inputs.vgo,0)} lb/h\nTemperature: ${fmt(inputs.tin + 60,0)} °F\nPressure: ${fmt(inputs.pressure + 5,0)} psig\nPhase: Liquid`
    },
    {
      id: "S-103", name: "Heated Feed", type: "process", utility: false,
      path: [{x: 725,y: 350},{x: 1030,y: 350}],
      label: { x: 790, y: 300 },
      lines: [`${fmt(inputs.totalFeed,0)} lb/h`, `${fmt(inputs.tout,0)} °F | ${fmt(inputs.pressure - 7,0)} psig`],
      tooltip: `S-103 Heated Feed Product\nFlow: ${fmt(inputs.totalFeed,0)} lb/h\nTemperature: ${fmt(inputs.tout,0)} °F\nPressure: ${fmt(inputs.pressure - 7,0)} psig\nPhase: Liquid/Vapor`
    },
    {
      id: "FG-101", name: "Fuel Gas", type: "fuel", utility: true,
      path: [{x: 642,y: 555},{x: 642,y: 445}],
      label: { x: 660, y: 490 },
      lines: [`${fmt(results.fuelScfh,0)} scf/h`, `${fmt(inputs.fuelLhv,0)} Btu/scf`],
      tooltip: `FG-101 Fuel Gas\nFuel Rate: ${fmt(results.fuelScfh,0)} scf/h\nLHV: ${fmt(inputs.fuelLhv,0)} Btu/scf\nEstimated Use: ${fmt(results.fuelMscfd,1)} MSCFD`
    },
    {
      id: "AIR-101", name: "Combustion Air", type: "gas", utility: true,
      path: [{x: 395,y: 590},{x: 500,y: 590},{x: 500,y: 420},{x: 560,y: 420}],
      label: { x: 405, y: 608 },
      lines: [`${fmt(results.airScfh,0)} scf/h`, `${fmt(inputs.excessAir,0)}% excess air`],
      tooltip: `AIR-101 Combustion Air\nEstimated Air Rate: ${fmt(results.airScfh,0)} scf/h\nExcess Air: ${fmt(inputs.excessAir,0)}%`
    },
    {
      id: "FLUE-101", name: "Flue Gas", type: "flue", utility: true,
      path: [{x: 642,y: 255},{x: 642,y: 185}],
      label: { x: 662, y: 205 },
      lines: [`Stack: ${fmt(inputs.stackTemp,0)} °F`, `Loss: ${fmt(results.stackLossMMBtuHr,2)} MMBtu/h`],
      tooltip: `FLUE-101 Flue Gas\nStack Temperature: ${fmt(inputs.stackTemp,0)} °F\nEstimated Stack Loss: ${fmt(results.stackLossMMBtuHr,2)} MMBtu/h`
    }
  ];
}

function clearLayers() {
  Object.values(layers).forEach(layer => layer.innerHTML = "");
}

function drawGrid() {
  for (let x = 0; x <= 1400; x += 50) {
    layers.grid.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: 850, class: x % 100 === 0 ? "grid-major" : "grid-line" }));
  }
  for (let y = 0; y <= 850; y += 50) {
    layers.grid.appendChild(svgEl("line", { x1: 0, y1: y, x2: 1400, y2: y, class: y % 100 === 0 ? "grid-major" : "grid-line" }));
  }
}

function drawUnit(unit, model) {
  const g = svgEl("g", { class: "selectable unit" });
  g.dataset.tooltip = unitTooltip(unit, model);

  if (unit.type === "furnace") drawFurnaceShape(g, unit, model);
  else if (unit.type === "skid") drawSkidShape(g, unit);
  else if (unit.type === "blower") drawBlowerShape(g, unit);
  else if (unit.type === "stack") drawStackShape(g, unit);
  else drawBoxShape(g, unit);

  layers.units.appendChild(g);
  attachTooltip(g);
}

function drawBoxShape(g, u) {
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" }));
  addText(g, u.id, u.x + u.width / 2, u.y + 28, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + 50, "unit-name", "middle");
}

function drawFurnaceShape(g, u, model) {
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 12, class: "unit-shape" }));
  g.appendChild(svgEl("rect", { x: u.x + 20, y: u.y + 25, width: u.width - 40, height: 95, rx: 8, class: "unit-muted" }));
  for (let i = 0; i < 4; i++) {
    const y = u.y + 45 + i * 20;
    g.appendChild(svgEl("path", { d: `M ${u.x + 35} ${y} H ${u.x + u.width - 35}`, class: "unit-coil" }));
  }
  g.appendChild(svgEl("path", { d: `M ${u.x + 58} ${u.y + 155} L ${u.x + 82} ${u.y + 125} L ${u.x + 106} ${u.y + 155} Z`, fill: "#fee2e2", stroke: "#991b1b", "stroke-width": 2 }));
  g.appendChild(svgEl("rect", { x: u.x + 68, y: u.y - 42, width: 48, height: 42, class: "unit-shape" }));
  addText(g, u.id, u.x + u.width / 2, u.y + u.height + 22, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + u.height + 40, "unit-name", "middle");
  addText(g, `${fmt(model.results.processDutyMMBtuHr,1)} MMBtu/h`, u.x + u.width / 2, u.y + 142, "unit-name energy-text", "middle");
}

function drawSkidShape(g, u) {
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" }));
  g.appendChild(svgEl("circle", { cx: u.x + 35, cy: u.y + 36, r: 16, fill: "#fff", stroke: "#334155", "stroke-width": 2 }));
  g.appendChild(svgEl("line", { x1: u.x + 55, y1: u.y + 36, x2: u.x + 130, y2: u.y + 36, class: "unit-detail" }));
  addText(g, u.id, u.x + u.width / 2, u.y + 22, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + 60, "unit-name", "middle");
}

function drawBlowerShape(g, u) {
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 10, class: "unit-muted" }));
  g.appendChild(svgEl("circle", { cx: u.x + 42, cy: u.y + 35, r: 24, fill: "#fff", stroke: "#334155", "stroke-width": 2 }));
  g.appendChild(svgEl("path", { d: `M ${u.x + 42} ${u.y + 35} L ${u.x + 65} ${u.y + 26} L ${u.x + 63} ${u.y + 45} Z`, fill: "#e0f2fe", stroke: "#334155", "stroke-width": 1.5 }));
  addText(g, u.id, u.x + 100, u.y + 30, "unit-tag", "middle");
  addText(g, u.name, u.x + 100, u.y + 50, "unit-name", "middle");
}

function drawStackShape(g, u) {
  g.appendChild(svgEl("path", { d: `M ${u.x + 35} ${u.y + u.height} L ${u.x + 50} ${u.y} H ${u.x + 90} L ${u.x + 105} ${u.y + u.height} Z`, class: "unit-shape" }));
  addText(g, u.id, u.x + u.width / 2, u.y + 42, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + 62, "unit-name", "middle");
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

function drawStreamLabel(stream) {
  if (!showLabels || (!showUtilities && stream.utility)) return;

  const x = stream.label.x;
  const y = stream.label.y;
  const w = 168;
  const h = 58;
  const g = svgEl("g", { class: "stream-label" });
  g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: 7, class: "stream-label-box" }));
  addText(g, `${stream.id} ${stream.name}`, x + 8, y + 17, "stream-label-title");
  addText(g, stream.lines[0], x + 8, y + 35, "stream-label-text");
  addText(g, stream.lines[1], x + 8, y + 51, "stream-label-text");
  layers.labels.appendChild(g);
}

function drawUnitCallout(model) {
  if (!showLabels) return;
  const g = svgEl("g", { class: "unit-callout" });
  g.appendChild(svgEl("rect", { x: 750, y: 405, width: 205, height: 72, rx: 8, class: "callout-box" }));
  addText(g, "F-101 Performance", 762, 426, "callout-title");
  addText(g, `Process Duty: ${fmt(model.results.processDutyMMBtuHr,2)} MMBtu/h`, 762, 445, "callout-text energy-text");
  addText(g, `Fired Duty: ${fmt(model.results.firedDutyMMBtuHr,2)} MMBtu/h`, 762, 462, "callout-text");
  layers.labels.appendChild(g);
}

function drawOverlays(model) {
  if (!showOverlays) return;
  drawInputOverlay(model);
  drawOutputOverlay(model);
  drawLegendOverlay();
}

function drawInputOverlay(model) {
  const { inputs } = model;
  const g = svgEl("g");
  g.appendChild(svgEl("rect", { x: 30, y: 30, width: 285, height: 155, rx: 10, class: "overlay-box" }));
  addText(g, "Input Summary", 48, 55, "overlay-title");
  addMultilineText(g, [
    `Total Feed: ${fmt(inputs.totalFeed,0)} lb/h`,
    `Feed Inlet: ${fmt(inputs.tin,0)} °F`,
    `Feed Outlet: ${fmt(inputs.tout,0)} °F`,
    `Pressure: ${fmt(inputs.pressure,0)} psig`,
    `Average Cp: ${fmt(inputs.cp,2)} Btu/lb-°F`,
    `Heater Efficiency: ${fmt(inputs.effPct,1)}%`
  ], 48, 80);
  layers.overlays.appendChild(g);
}

function drawOutputOverlay(model) {
  const { results } = model;
  const g = svgEl("g");
  g.appendChild(svgEl("rect", { x: 1080, y: 585, width: 285, height: 170, rx: 10, class: "overlay-box" }));
  addText(g, "Calculated Outputs", 1098, 610, "overlay-title");
  addMultilineText(g, [
    `Process Duty: ${fmt(results.processDutyMMBtuHr,2)} MMBtu/h`,
    `Fired Duty: ${fmt(results.firedDutyMMBtuHr,2)} MMBtu/h`,
    `Fuel Gas: ${fmt(results.fuelScfh,0)} scf/h`,
    `Fuel Gas: ${fmt(results.fuelMscfd,1)} MSCFD`,
    `Combustion Air: ${fmt(results.airScfh,0)} scf/h`,
    `Stack Loss: ${fmt(results.stackLossMMBtuHr,2)} MMBtu/h`
  ], 1098, 635);
  layers.overlays.appendChild(g);
}

function drawLegendOverlay() {
  const g = svgEl("g");
  g.appendChild(svgEl("rect", { x: 1110, y: 35, width: 235, height: 140, rx: 10, class: "legend-box" }));
  addText(g, "Legend", 1128, 60, "legend-title");
  drawLegendLine(g, 1130, 82, "process", "Process Liquid");
  drawLegendLine(g, 1130, 107, "fuel", "Fuel Gas");
  drawLegendLine(g, 1130, 132, "gas", "Air / Gas Utility");
  drawLegendLine(g, 1130, 157, "flue", "Flue Gas / Vent");
  layers.overlays.appendChild(g);
}

function drawLegendLine(g, x, y, cls, label) {
  g.appendChild(svgEl("line", { x1: x, y1: y, x2: x + 48, y2: y, class: `stream ${cls}` }));
  addText(g, label, x + 62, y + 4, "legend-text");
}

function unitTooltip(unit, model) {
  const { inputs, results } = model;
  if (unit.id === "F-101") {
    return `F-101 Charge Furnace\nProcess Duty: ${fmt(results.processDutyMMBtuHr,2)} MMBtu/h\nFired Duty: ${fmt(results.firedDutyMMBtuHr,2)} MMBtu/h\nEfficiency: ${fmt(inputs.effPct,1)}%\nStack Temp: ${fmt(inputs.stackTemp,0)} °F`;
  }
  if (unit.id === "FG-101") return `FG-101 Fuel Gas Skid\nFuel Gas: ${fmt(results.fuelScfh,0)} scf/h\nFuel LHV: ${fmt(inputs.fuelLhv,0)} Btu/scf`;
  if (unit.id === "B-101") return `B-101 Combustion Air Blower\nAir Flow: ${fmt(results.airScfh,0)} scf/h\nExcess Air: ${fmt(inputs.excessAir,0)}%`;
  if (unit.id === "ST-101") return `ST-101 Stack\nStack Temperature: ${fmt(inputs.stackTemp,0)} °F\nStack Loss: ${fmt(results.stackLossMMBtuHr,2)} MMBtu/h`;
  return `${unit.id} ${unit.name}`;
}

function attachTooltip(el) {
  el.addEventListener("mouseenter", () => {
    tooltip.textContent = el.dataset.tooltip || "";
    tooltip.style.display = "block";
  });
  el.addEventListener("mousemove", (event) => {
    const rect = svgWrap.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + svgWrap.scrollLeft + 14}px`;
    tooltip.style.top = `${event.clientY - rect.top + svgWrap.scrollTop + 14}px`;
  });
  el.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
}

function updateOutputTable(model) {
  const { results } = model;
  document.getElementById("outputTable").innerHTML = `
    <tr><td>Process Duty</td><td>${fmt(results.processDutyMMBtuHr,2)} MMBtu/h</td></tr>
    <tr><td>Fired Duty</td><td>${fmt(results.firedDutyMMBtuHr,2)} MMBtu/h</td></tr>
    <tr><td>Fuel Gas Rate</td><td>${fmt(results.fuelScfh,0)} scf/h</td></tr>
    <tr><td>Fuel Gas Rate</td><td>${fmt(results.fuelMscfd,1)} MSCFD</td></tr>
    <tr><td>Combustion Air</td><td>${fmt(results.airScfh,0)} scf/h</td></tr>
    <tr><td>Estimated Stack Loss</td><td>${fmt(results.stackLossMMBtuHr,2)} MMBtu/h</td></tr>
  `;
}

function render() {
  clearLayers();
  const model = computeModel();
  buildStreams(model);
  drawGrid();
  model.streams.forEach(drawStream);
  Object.values(model.units).forEach(unit => drawUnit(unit, model));
  model.streams.forEach(drawStreamLabel);
  drawUnitCallout(model);
  drawOverlays(model);
  updateOutputTable(model);
}

function resetInputs() {
  const defaults = {
    naphthaFlow: 15000,
    vgoFlow: 22000,
    feedTin: 420,
    feedTout: 680,
    feedPressure: 55,
    cp: 0.62,
    fuelLhv: 950,
    efficiency: 87,
    stackTemp: 650,
    excessAir: 15
  };
  Object.entries(defaults).forEach(([id, value]) => document.getElementById(id).value = value);
  showLabels = true;
  showUtilities = true;
  showOverlays = true;
  render();
}

inputIds.forEach(id => document.getElementById(id).addEventListener("input", render));
document.getElementById("btnReset").addEventListener("click", resetInputs);
document.getElementById("btnLabels").addEventListener("click", () => { showLabels = !showLabels; render(); });
document.getElementById("btnUtilities").addEventListener("click", () => { showUtilities = !showUtilities; render(); });
document.getElementById("btnOverlays").addEventListener("click", () => { showOverlays = !showOverlays; render(); });

const clearBusinessViewButton = document.getElementById("btnClearBusinessView");
if (clearBusinessViewButton) {
  clearBusinessViewButton.addEventListener("click", () => {
    document.querySelectorAll('input[name="businessView"]').forEach(radio => {
      radio.checked = false;
    });
  });
}

render();
