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
let economicsTable = document.getElementById("economicsTable");

function ensureEconomicsTable() {
  economicsTable = document.getElementById("economicsTable");
  if (economicsTable) return economicsTable;

  const panelGrid = document.querySelector(".panel-grid");
  if (!panelGrid) return null;

  const panel = document.createElement("section");
  panel.className = "economics-panel";
  panel.innerHTML = `
    <h2>Economics</h2>
    <table>
      <tbody id="economicsTable"></tbody>
    </table>
  `;
  panelGrid.appendChild(panel);
  economicsTable = document.getElementById("economicsTable");
  return economicsTable;
}

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
  "Streams": { title: "Single Stream View", subtitle: "One selected feed/product stream with live property and economics summary", units: ["Selected Stream"], factor: 1.000, density: 46.0, viscosity: 1.10, dT: 0, dP: 0, energy: 0.00, operating: 0.000 },
  "Units": { title: "Unit Operation View", subtitle: "Major equipment blocks and unit operation boundaries", units: ["Pump", "Heat Exchanger", "Furnace", "Column/Reactor", "Separator"], factor: 0.965, density: 47.5, viscosity: 1.25, dT: 80, dP: -12, energy: 0.38, operating: 0.038 },
  "Plants": { title: "Plant View", subtitle: "Integrated process plant with utilities and product routing", units: ["Feed System", "Process Plant", "Utility Plant", "Storage", "Loading"], factor: 0.950, density: 44.0, viscosity: 0.90, dT: 25, dP: -10, energy: 0.30, operating: 0.030 },
  "Sites": { title: "Site View", subtitle: "Multiple plants connected by site-wide utilities and logistics", units: ["Refinery", "LNG", "Petchem", "Tank Farm", "Export"], factor: 0.940, density: 43.0, viscosity: 0.85, dT: 15, dP: -8, energy: 0.24, operating: 0.024 },
  "Regions": { title: "Regional View", subtitle: "Sites, pipelines, storage hubs, and product markets", units: ["Supply Basin", "Pipeline Hub", "Storage Hub", "Market", "Export Dock"], factor: 0.930, density: 41.5, viscosity: 0.78, dT: 5, dP: -6, energy: 0.18, operating: 0.018 }
};


const streamMaterials = {
  "Natural Gas": { feedFlowGpm: 900, densityLbFt3: 3.2, viscosityCp: 0.012, temperatureF: 80, pressurePsig: 850, priceLb: 0.065, priceMMBtu: 3.75 },
  "Crude": { feedFlowGpm: 1500, densityLbFt3: 53.0, viscosityCp: 12.0, temperatureF: 90, pressurePsig: 80, priceLb: 0.46, priceMMBtu: 13.50 },
  "LPG": { feedFlowGpm: 950, densityLbFt3: 31.0, viscosityCp: 0.18, temperatureF: 85, pressurePsig: 160, priceLb: 0.34, priceMMBtu: 10.50 },
  "NGLs": { feedFlowGpm: 1100, densityLbFt3: 34.0, viscosityCp: 0.24, temperatureF: 85, pressurePsig: 220, priceLb: 0.30, priceMMBtu: 9.50 },
  "Light Naphtha": { feedFlowGpm: 1200, densityLbFt3: 42.0, viscosityCp: 0.35, temperatureF: 95, pressurePsig: 75, priceLb: 0.42, priceMMBtu: 13.20 },
  "Heavy Naphtha": { feedFlowGpm: 1200, densityLbFt3: 46.0, viscosityCp: 0.70, temperatureF: 100, pressurePsig: 75, priceLb: 0.40, priceMMBtu: 12.80 },
  "Gasoil": { feedFlowGpm: 1000, densityLbFt3: 52.0, viscosityCp: 3.2, temperatureF: 120, pressurePsig: 70, priceLb: 0.44, priceMMBtu: 14.00 },
  "VGO": { feedFlowGpm: 900, densityLbFt3: 57.0, viscosityCp: 14.0, temperatureF: 150, pressurePsig: 60, priceLb: 0.36, priceMMBtu: 11.60 },
  "Fueloil": { feedFlowGpm: 850, densityLbFt3: 60.0, viscosityCp: 90.0, temperatureF: 180, pressurePsig: 50, priceLb: 0.28, priceMMBtu: 8.90 },
  "Slurry": { feedFlowGpm: 650, densityLbFt3: 64.0, viscosityCp: 180.0, temperatureF: 250, pressurePsig: 45, priceLb: 0.22, priceMMBtu: 7.20 },
  "Residue": { feedFlowGpm: 700, densityLbFt3: 62.5, viscosityCp: 220.0, temperatureF: 300, pressurePsig: 40, priceLb: 0.20, priceMMBtu: 6.80 }
};
const streamMaterialNames = Object.keys(streamMaterials);

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
  if (selection.type === "objectLevel" && selection.key === "Streams") {
    const materialName = document.getElementById("streamMaterial")?.value || "Natural Gas";
    const m = streamMaterials[materialName] || streamMaterials["Natural Gas"];
    const massFlow = m.feedFlowGpm * 60 * 0.133681 * m.densityLbFt3;
    const priceGal = m.priceLb * m.densityLbFt3 * 0.133681;
    return {
      streamMaterial: materialName,
      feedFlowGpm: m.feedFlowGpm,
      massFlowLbHr: massFlow,
      densityLbFt3: m.densityLbFt3,
      viscosityCp: m.viscosityCp,
      temperatureF: m.temperatureF,
      pressurePsig: m.pressurePsig,
      priceLb: m.priceLb,
      priceGal,
      priceMMBtu: m.priceMMBtu
    };
  }

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

function renderInputFormLegacyInitial(selection) {
  const d = defaultInputs(selection);
  const isStreamView = selection.type === "objectLevel" && selection.key === "Streams";
  currentInputIds = formFields.map(f => f.id);

  const streamSelectorHtml = isStreamView ? `
      <label class="wide-field">Stream / Feed Material
        <select id="streamMaterial">
          ${streamMaterialNames.map(name => `<option value="${name}" ${name === d.streamMaterial ? "selected" : ""}>${name}</option>`).join("")}
        </select>
      </label>
  ` : "";

  inputForm.innerHTML = `
    <h2>${selection.config.title} Inputs</h2>
    <p class="panel-note">Dynamic basis: ${isStreamView ? "Single stream property view" : selection.type === "objectLevel" ? "Object Level" : selection.type === "processArea" ? "Process Area" : "Default"}</p>
    <div class="field-grid">
      ${streamSelectorHtml}
      ${formFields.map(f => `
        <label>${f.label}, ${f.unit}
          <input id="${f.id}" type="number" value="${formatInputValue(d[f.id])}" ${f.min !== undefined ? `min="${f.min}"` : ""} step="${f.step}">
        </label>
      `).join("")}
    </div>
  `;

  const materialSelect = document.getElementById("streamMaterial");
  if (materialSelect) {
    materialSelect.addEventListener("change", () => {
      const m = streamMaterials[materialSelect.value] || streamMaterials["Natural Gas"];
      document.getElementById("feedFlowGpm").value = formatInputValue(m.feedFlowGpm);
      document.getElementById("densityLbFt3").value = formatInputValue(m.densityLbFt3);
      document.getElementById("viscosityCp").value = formatInputValue(m.viscosityCp);
      document.getElementById("temperatureF").value = formatInputValue(m.temperatureF);
      document.getElementById("pressurePsig").value = formatInputValue(m.pressurePsig);
      document.getElementById("priceLb").value = formatInputValue(m.priceLb);
      document.getElementById("priceMMBtu").value = formatInputValue(m.priceMMBtu);
      const massFlow = m.feedFlowGpm * 60 * 0.133681 * m.densityLbFt3;
      document.getElementById("massFlowLbHr").value = formatInputValue(massFlow);
      document.getElementById("priceGal").value = formatInputValue(m.priceLb * m.densityLbFt3 * 0.133681);
      render();
    });
  }

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
    sections: document.getElementById("layerSections"),
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
function drawSectionGrid() {
  if (!layers.sections) return;

  const width = 1400;
  const height = 850;
  const sectionWidth = width / 3;
  const sectionHeight = height / 3;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = col * sectionWidth;
      const y = row * sectionHeight;
      const sectionId = `pfd-section-r${row + 1}c${col + 1}`;
      const g = svgEl("g", {
        id: sectionId,
        class: "pfd-section",
        "data-section-row": row + 1,
        "data-section-col": col + 1
      });

      g.appendChild(svgEl("rect", {
        x,
        y,
        width: sectionWidth,
        height: sectionHeight,
        class: "pfd-section-cell"
      }));

      addText(g, sectionId, x + 14, y + 22, "pfd-section-label");
      layers.sections.appendChild(g);
    }
  }

  [sectionWidth, sectionWidth * 2].forEach(x => {
    layers.sections.appendChild(svgEl("line", {
      x1: x,
      y1: 0,
      x2: x,
      y2: height,
      class: "pfd-section-boundary"
    }));
  });

  [sectionHeight, sectionHeight * 2].forEach(y => {
    layers.sections.appendChild(svgEl("line", {
      x1: 0,
      y1: y,
      x2: width,
      y2: y,
      class: "pfd-section-boundary"
    }));
  });

  layers.sections.appendChild(svgEl("rect", {
    x: 0,
    y: 0,
    width,
    height,
    class: "pfd-section-boundary"
  }));
}

function drawGrid() {
  for (let x = 0; x <= 1400; x += 50) layers.grid.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: 850, class: x % 100 === 0 ? "grid-major" : "grid-line" }));
  for (let y = 0; y <= 850; y += 50) layers.grid.appendChild(svgEl("line", { x1: 0, y1: y, x2: 1400, y2: y, class: y % 100 === 0 ? "grid-major" : "grid-line" }));
  drawSectionGrid();
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

  g.appendChild(svgEl("line", { x1: inletX1, y1: cy, x2: inletX2, y2: cy, class: "pump-stream-line" }));
  g.appendChild(svgEl("line", { x1: outletX1, y1: cy, x2: outletX2, y2: cy, class: "pump-stream-line" }));
  g.appendChild(svgEl("circle", { cx, cy, r: 30, class: "pump-body" }));
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
  if (outputTitle) outputTitle.textContent = `${model.selection.config.title} Product Properties`;
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
  if (outputTable) {
    outputTable.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  }
  if (activeViewName) activeViewName.textContent = model.selection.config.title;
}

function updateEconomicsTableBaseBeforeAmine(model) {
  const e = model.economics;
  const rows = [
    ["Feed input cost", `${money(e.feedInputCost, 2)}/hr`],
    ["Energy input cost", `${money(e.energyInputCost, 2)}/hr`],
    ["Operating cost", `${money(e.operatingCost, 2)}/hr`],
    ["Product prices", `${money(model.product.priceLb, 3)}/lb | ${money(model.product.priceGal, 2)}/gal | ${money(model.product.priceMMBtu, 2)}/MMBtu`],
    ["Spread vs feed", `${money(e.spreadLb, 3)}/lb | ${money(e.spreadGal, 2)}/gal | ${money(e.spreadMMBtu, 2)}/MMBtu`],
    ["Estimated net margin", `${money(e.netMargin, 2)}/hr`]
  ];
  const table = ensureEconomicsTable();
  if (table) {
    table.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  }
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
  drawStreamInputTable(model);
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


function buildSingleStreamPfd(model) {
  const materialName = document.getElementById("streamMaterial")?.value || "Natural Gas";
  const streamKind = /Natural Gas|LPG|NGLs/i.test(materialName) ? "vapor" : "liquid";
  const y = 395;
  const stream = {
    id: "S-100",
    name: materialName,
    type: streamKind,
    utility: false,
    path: [{ x: 430, y }, { x: 1120, y }],
    label: { x: 710, y: 285 },
    lines: [`${fmt(model.inputs.feedFlowGpm, 1)} gpm`, `${fmt(model.inputs.temperature, 1)} °F | ${fmt(model.inputs.pressure, 1)} psig`],
    tooltip: `${materialName}\nFlow: ${fmt(model.inputs.feedFlowGpm, 1)} gpm\nMass Flow: ${fmt(model.inputs.massFlowLbHr, 0)} lb/hr\nDensity: ${fmt(model.inputs.density, 2)} lb/ft³\nViscosity: ${fmt(model.inputs.viscosity, 3)} cP\nTemperature: ${fmt(model.inputs.temperature, 1)} °F\nPressure: ${fmt(model.inputs.pressure, 1)} psig`
  };
  return { units: [], streams: [stream] };
}

function drawStreamInputTable(model) {
  if (!(model.selection.type === "objectLevel" && model.selection.key === "Streams")) return;
  const materialName = document.getElementById("streamMaterial")?.value || "Natural Gas";
  const g = svgEl("g", { class: "svg-input-table" });
  g.appendChild(svgEl("rect", { x: 35, y: 125, width: 345, height: 430, rx: 10, class: "overlay-box" }));
  addText(g, "Stream Input Table", 55, 155, "overlay-title");
  addText(g, `Selected: ${materialName}`, 55, 180, "overlay-text");
  const rows = [
    ["Feed flow", `${fmt(model.inputs.feedFlowGpm, 1)} gpm`],
    ["Mass flow", `${fmt(model.inputs.massFlowLbHr, 0)} lb/hr`],
    ["Density", `${fmt(model.inputs.density, 2)} lb/ft³`],
    ["Viscosity", `${fmt(model.inputs.viscosity, 3)} cP`],
    ["Temperature", `${fmt(model.inputs.temperature, 1)} °F`],
    ["Pressure", `${fmt(model.inputs.pressure, 1)} psig`],
    ["Price", `${money(model.inputs.priceLb, 3)}/lb`],
    ["Price", `${money(model.inputs.priceGal, 2)}/gal`],
    ["Price", `${money(model.inputs.priceMMBtu, 2)}/MMBtu`]
  ];
  rows.forEach(([k, v], i) => {
    const yy = 215 + i * 34;
    g.appendChild(svgEl("line", { x1: 55, y1: yy + 9, x2: 355, y2: yy + 9, class: "svg-table-row-line" }));
    addText(g, k, 55, yy, "svg-table-key");
    addText(g, v, 355, yy, "svg-table-value", "end");
  });
  layers.overlays.appendChild(g);
}
function buildDynamicPfd(model) {
  if (model.selection.type === "objectLevel" && model.selection.key === "Streams") {
    return buildSingleStreamPfd(model);
  }
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
  const g = svgEl("g", { class: "legend-overlay" });
  const boxX = 1095;
  const boxY = 610;
  const rowStartY = boxY + 49;
  g.appendChild(svgEl("rect", { x: boxX, y: boxY, width: 255, height: 205, rx: 10, class: "legend-box" }));
  addText(g, "Legend", boxX + 18, boxY + 25, "legend-title");
  [["liquid","Liquid Stream"],["vapor","Vapor Stream"],["energy","Energy Stream"],["fuel","Fuel"],["utility","Utility"],["flue","Vent / Flue"]].forEach(([cls,label],i)=>{
    const y = rowStartY + i * 24;
    g.appendChild(svgEl("line", { x1: boxX + 20, y1: y, x2: boxX + 68, y2: y, class: `stream ${cls}` }));
    addText(g, label, boxX + 82, y + 4, "legend-text");
  });
  layers.overlays.appendChild(g);
}


/* ------------------------------------------------------------------
   Unit-operation view upgrade
   - Object Level = Units now displays one selected unit symbol
   - Adds SVG-canvas dropdown overlay for unit operation selection
   - Input form includes feed selector + unit-specific inputs
   - Output table branches calculations for pressure, temperature, and V/L split
------------------------------------------------------------------ */
const unitOperationNames = [
  "Valve", "Pump", "Separator", "Vessel", "Pipe", "Compressor", "Turbine",
  "Heat Exchanger", "Heater", "Column", "Reactor"
];

const unitOperationDefaults = {
  "Valve": { dP: -25, dT: 0, efficiency: 100, vaporFraction: 0.05, dutyFactor: 0, opex: 0.003 },
  "Pump": { dP: 145, dT: 2, efficiency: 72, vaporFraction: 0.00, dutyFactor: 0, opex: 0.006 },
  "Separator": { dP: -8, dT: -3, efficiency: 100, vaporFraction: 0.22, dutyFactor: 0, opex: 0.008 },
  "Vessel": { dP: -5, dT: -1, efficiency: 100, vaporFraction: 0.12, dutyFactor: 0, opex: 0.006 },
  "Pipe": { dP: -18, dT: 0, efficiency: 100, vaporFraction: 0.00, dutyFactor: 0, opex: 0.004 },
  "Compressor": { dP: 250, dT: 75, efficiency: 76, vaporFraction: 1.00, dutyFactor: 0, opex: 0.018 },
  "Turbine": { dP: -180, dT: -45, efficiency: 82, vaporFraction: 1.00, dutyFactor: -0.15, opex: 0.010 },
  "Heat Exchanger": { dP: -10, dT: 80, efficiency: 100, vaporFraction: 0.02, dutyFactor: 1, opex: 0.010 },
  "Heater": { dP: -7, dT: 220, efficiency: 87, vaporFraction: 0.15, dutyFactor: 1, opex: 0.024 },
  "Column": { dP: -20, dT: 35, efficiency: 100, vaporFraction: 0.35, dutyFactor: 0.65, opex: 0.045 },
  "Reactor": { dP: -35, dT: 60, efficiency: 100, vaporFraction: 0.10, dutyFactor: 0.50, opex: 0.060 }
};

function selectedUnitOperation() {
  return document.getElementById("unitOperation")?.value || document.getElementById("svgUnitOperation")?.value || "Pump";
}

function ensureUnitOperationOverlay() {
  let overlay = document.getElementById("unitOperationOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "unitOperationOverlay";
    overlay.className = "svg-control-overlay";
    overlay.innerHTML = `
      <label>Unit Operation
        <select id="svgUnitOperation">
          ${unitOperationNames.map(name => `<option value="${name}">${name}</option>`).join("")}
        </select>
      </label>
    `;
    svgWrap.appendChild(overlay);
    overlay.querySelector("select").addEventListener("change", () => {
      const panelSelect = document.getElementById("unitOperation");
      if (panelSelect) panelSelect.value = overlay.querySelector("select").value;
      renderInputForm(getSelection());
      const refreshed = document.getElementById("unitOperation");
      if (refreshed) refreshed.value = overlay.querySelector("select").value;
      render();
    });
  }
  return overlay;
}

function syncUnitOperationOverlay(selection) {
  const overlay = ensureUnitOperationOverlay();
  const isUnits = selection.type === "objectLevel" && selection.key === "Units";
  overlay.style.display = isUnits ? "block" : "none";
  if (isUnits) {
    const current = selectedUnitOperation();
    const svgSelect = document.getElementById("svgUnitOperation");
    if (svgSelect) svgSelect.value = current;
  }
}

function materialInputDefaults() {
  const materialName = document.getElementById("feedMaterial")?.value || document.getElementById("streamMaterial")?.value || "Natural Gas";
  const m = streamMaterials[materialName] || streamMaterials["Natural Gas"];
  const massFlow = m.feedFlowGpm * 60 * 0.133681 * m.densityLbFt3;
  const priceGal = m.priceLb * m.densityLbFt3 * 0.133681;
  return { materialName, m, massFlow, priceGal };
}

function defaultInputs(selection) {
  if (selection.type === "objectLevel" && (selection.key === "Streams" || selection.key === "Units")) {
    const { materialName, m, massFlow, priceGal } = materialInputDefaults();
    return {
      streamMaterial: materialName,
      feedMaterial: materialName,
      unitOperation: selectedUnitOperation(),
      feedFlowGpm: m.feedFlowGpm,
      massFlowLbHr: massFlow,
      densityLbFt3: m.densityLbFt3,
      viscosityCp: m.viscosityCp,
      temperatureF: m.temperatureF,
      pressurePsig: m.pressurePsig,
      priceLb: m.priceLb,
      priceGal,
      priceMMBtu: m.priceMMBtu
    };
  }
  const c = selection.config;
  const feedFlow = selection.type === "objectLevel" ? 1200 : selection.key === "LNG" ? 4200 : selection.key === "Amine" ? 850 : 1500;
  const density = c.density;
  const massFlow = feedFlow * 60 * 0.133681 * density;
  const priceLb = selection.key === "LNG" ? 0.18 : selection.key === "Petchem" ? 0.55 : selection.key === "Amine" ? 0.08 : 0.22;
  const priceGal = priceLb * density * 0.133681;
  const priceMMBtu = selection.key === "LNG" ? 9.50 : selection.key === "Refinery" ? 14.00 : 11.00;
  return { feedFlowGpm: feedFlow, massFlowLbHr: massFlow, densityLbFt3: density, viscosityCp: c.viscosity, temperatureF: selection.key === "LNG" ? -250 : selection.key === "Dehydration" ? 95 : 100, pressurePsig: selection.key === "LNG" ? 45 : selection.key === "Amine" ? 950 : 150, priceLb, priceGal, priceMMBtu };
}

function renderInputFormBaseBeforeAmine(selection) {
  const d = defaultInputs(selection);
  const isStreamView = selection.type === "objectLevel" && selection.key === "Streams";
  const isUnitView = selection.type === "objectLevel" && selection.key === "Units";
  currentInputIds = formFields.map(f => f.id);
  const feedSelectHtml = (isStreamView || isUnitView) ? `
      <label class="wide-field">Feed Type
        <select id="${isStreamView ? "streamMaterial" : "feedMaterial"}">
          ${streamMaterialNames.map(name => `<option value="${name}" ${name === (d.feedMaterial || d.streamMaterial) ? "selected" : ""}>${name}</option>`).join("")}
        </select>
      </label>` : "";
  const unitSelectHtml = isUnitView ? `
      <label class="wide-field">Unit Operation Symbol
        <select id="unitOperation">
          ${unitOperationNames.map(name => `<option value="${name}" ${name === d.unitOperation ? "selected" : ""}>${name}</option>`).join("")}
        </select>
      </label>
      <label>Pressure Change, psig
        <input id="unitDeltaP" type="number" value="${unitOperationDefaults[d.unitOperation].dP}" step="1">
      </label>
      <label>Temperature Change, °F
        <input id="unitDeltaT" type="number" value="${unitOperationDefaults[d.unitOperation].dT}" step="1">
      </label>
      <label>Efficiency, %
        <input id="unitEfficiency" type="number" value="${unitOperationDefaults[d.unitOperation].efficiency}" min="1" max="100" step="1">
      </label>
      <label>Vapor Split, fraction
        <input id="unitVaporFraction" type="number" value="${unitOperationDefaults[d.unitOperation].vaporFraction}" min="0" max="1" step="0.01">
      </label>` : "";

  inputForm.innerHTML = `
    <h2>${selection.config.title} Inputs</h2>
    <p class="panel-note">Dynamic basis: ${isStreamView ? "Single stream property view" : isUnitView ? "Single unit-operation view" : selection.type === "objectLevel" ? "Object Level" : selection.type === "processArea" ? "Process Area" : "Default"}</p>
    <div class="field-grid">
      ${feedSelectHtml}
      ${unitSelectHtml}
      ${formFields.map(f => `
        <label>${f.label}, ${f.unit}
          <input id="${f.id}" type="number" value="${formatInputValue(d[f.id])}" ${f.min !== undefined ? `min="${f.min}"` : ""} step="${f.step}">
        </label>`).join("")}
    </div>`;

  const materialSelect = document.getElementById(isStreamView ? "streamMaterial" : "feedMaterial");
  if (materialSelect) {
    materialSelect.addEventListener("change", () => {
      const m = streamMaterials[materialSelect.value] || streamMaterials["Natural Gas"];
      document.getElementById("feedFlowGpm").value = formatInputValue(m.feedFlowGpm);
      document.getElementById("densityLbFt3").value = formatInputValue(m.densityLbFt3);
      document.getElementById("viscosityCp").value = formatInputValue(m.viscosityCp);
      document.getElementById("temperatureF").value = formatInputValue(m.temperatureF);
      document.getElementById("pressurePsig").value = formatInputValue(m.pressurePsig);
      document.getElementById("priceLb").value = formatInputValue(m.priceLb);
      document.getElementById("priceMMBtu").value = formatInputValue(m.priceMMBtu);
      document.getElementById("massFlowLbHr").value = formatInputValue(m.feedFlowGpm * 60 * 0.133681 * m.densityLbFt3);
      document.getElementById("priceGal").value = formatInputValue(m.priceLb * m.densityLbFt3 * 0.133681);
      render();
    });
  }
  const unitSelect = document.getElementById("unitOperation");
  if (unitSelect) {
    unitSelect.addEventListener("change", () => {
      const dft = unitOperationDefaults[unitSelect.value];
      document.getElementById("unitDeltaP").value = dft.dP;
      document.getElementById("unitDeltaT").value = dft.dT;
      document.getElementById("unitEfficiency").value = dft.efficiency;
      document.getElementById("unitVaporFraction").value = dft.vaporFraction;
      const svgSelect = document.getElementById("svgUnitOperation");
      if (svgSelect) svgSelect.value = unitSelect.value;
      render();
    });
    currentInputIds.push("unitDeltaP", "unitDeltaT", "unitEfficiency", "unitVaporFraction");
  }
  currentInputIds.forEach(id => document.getElementById(id)?.addEventListener("input", render));
  syncUnitOperationOverlay(selection);
}

function unitTypeFromOperation(op) {
  if (op === "Pump") return "pump";
  if (op === "Compressor") return "compressor";
  if (op === "Turbine") return "turbine";
  if (op === "Heat Exchanger") return "exchanger";
  if (op === "Heater") return "furnace";
  if (op === "Column") return "column";
  if (op === "Separator") return "separator";
  if (op === "Vessel") return "vessel";
  if (op === "Valve") return "valve";
  if (op === "Pipe") return "pipe";
  if (op === "Reactor") return "reactor";
  return "box";
}

function unitIdFromOperation(op) {
  return { Valve:"XV-101", Pump:"P-101", Separator:"V-101", Vessel:"D-101", Pipe:"PL-101", Compressor:"C-101", Turbine:"GT-101", "Heat Exchanger":"E-101", Heater:"F-101", Column:"T-101", Reactor:"R-101" }[op] || "U-101";
}

function computeModelBaseBeforeAmine() {
  const selection = getSelection();
  const c = selection.config;
  const isUnitView = selection.type === "objectLevel" && selection.key === "Units";
  const op = selectedUnitOperation();
  const opDefaults = unitOperationDefaults[op] || unitOperationDefaults.Pump;
  const feedFlowGpm = n("feedFlowGpm");
  const density = n("densityLbFt3");
  const enteredMassFlow = n("massFlowLbHr");
  const hydraulicMassFlow = feedFlowGpm * 60 * 0.133681 * density;
  const massFlowLbHr = enteredMassFlow > 0 ? enteredMassFlow : hydraulicMassFlow;
  const inletTemp = n("temperatureF");
  const inletPressure = n("pressurePsig");
  const deltaP = isUnitView ? n("unitDeltaP") : c.dP;
  const deltaT = isUnitView ? n("unitDeltaT") : c.dT;
  const efficiency = Math.max(isUnitView ? n("unitEfficiency") : 100, 1);
  const vaporFraction = Math.min(Math.max(isUnitView ? n("unitVaporFraction") : 0, 0), 1);
  const factor = isUnitView ? 1.0 : c.factor;
  let productFlowGpm = feedFlowGpm * factor;
  let productMassFlow = massFlowLbHr * factor;
  let productDensity = density;
  let productViscosity = Math.max(n("viscosityCp"), 0.001);
  let productTemp = inletTemp;
  let productPressure = Math.max(inletPressure, 0);
  let dutyMMBtuHr = 0;
  let hydraulicHp = 0;
  let vaporFlowLbHr = 0;
  let liquidFlowLbHr = productMassFlow;
  let resultMode = "Property Transfer";

  if (isUnitView && /Pump|Compressor|Valve|Pipe|Turbine/.test(op)) {
    resultMode = /Pump|Compressor/.test(op) ? "Pressure Change" : op === "Turbine" ? "Pressure Letdown / Power Recovery" : "Pressure Drop";
    productPressure = Math.max(inletPressure + deltaP, 0);
    productTemp = inletTemp + deltaT;
    hydraulicHp = Math.abs(feedFlowGpm * deltaP) / (1714 * (efficiency / 100 || 1));
    if (op === "Turbine") hydraulicHp *= -1;
    productViscosity = Math.max(n("viscosityCp") * (deltaT > 0 ? 0.97 : 1.00), 0.001);
  } else if (isUnitView && /Heat Exchanger|Heater|Column|Reactor/.test(op)) {
    resultMode = "Temperature Change / Duty";
    productTemp = inletTemp + deltaT;
    productPressure = Math.max(inletPressure + deltaP, 0);
    productDensity = Math.max(density * (1 - 0.00025 * deltaT), 0.01);
    productViscosity = Math.max(n("viscosityCp") * Math.exp(-0.006 * deltaT), 0.001);
    dutyMMBtuHr = massFlowLbHr * 0.62 * deltaT / 1_000_000 / (efficiency / 100 || 1);
  } else if (isUnitView && /Separator|Vessel/.test(op)) {
    resultMode = "Vapor-Liquid Separation";
    productTemp = inletTemp + deltaT;
    productPressure = Math.max(inletPressure + deltaP, 0);
    vaporFlowLbHr = massFlowLbHr * vaporFraction;
    liquidFlowLbHr = massFlowLbHr - vaporFlowLbHr;
    productMassFlow = liquidFlowLbHr;
    productFlowGpm = productMassFlow / Math.max(density * 60 * 0.133681, 0.001);
    productDensity = density * 1.01;
    productViscosity = n("viscosityCp");
  } else {
    productFlowGpm = feedFlowGpm * c.factor;
    productMassFlow = massFlowLbHr * c.factor;
    productDensity = density * (1 + (c.dT < -100 ? 0.10 : c.dT > 80 ? -0.025 : -0.01));
    productViscosity = Math.max(n("viscosityCp") * (c.dT > 0 ? 0.72 : 1.08), 0.001);
    productTemp = inletTemp + c.dT;
    productPressure = Math.max(inletPressure + c.dP, 0);
    dutyMMBtuHr = massFlowLbHr * 0.62 * c.dT / 1_000_000;
  }

  const productPriceLb = n("priceLb") * (isUnitView ? 1.02 : 1.08 + (1 - c.factor) * 0.55);
  const productPriceGal = productPriceLb * productDensity * 0.133681;
  const productPriceMMBtu = n("priceMMBtu") * (isUnitView ? 1.01 : 1.06 + c.energy * 0.08);
  const energyInputCost = Math.abs(dutyMMBtuHr) * n("priceMMBtu") + Math.max(hydraulicHp, 0) * 0.746 * 0.075;
  const opCostFactor = isUnitView ? opDefaults.opex : c.operating;
  const feedInputCost = massFlowLbHr * n("priceLb");
  const operatingCost = massFlowLbHr * opCostFactor;
  const productRevenue = productMassFlow * productPriceLb;
  const spreadLb = productPriceLb - n("priceLb");
  const spreadGal = productPriceGal - n("priceGal");
  const spreadMMBtu = productPriceMMBtu - n("priceMMBtu");
  const netMargin = productRevenue - feedInputCost - energyInputCost - operatingCost;

  return {
    selection, unitOperation: op, resultMode, hydraulicHp, dutyMMBtuHr, vaporFlowLbHr, liquidFlowLbHr,
    inputs: { feedFlowGpm, massFlowLbHr, density, viscosity: n("viscosityCp"), temperature: inletTemp, pressure: inletPressure, priceLb: n("priceLb"), priceGal: n("priceGal"), priceMMBtu: n("priceMMBtu") },
    product: { flowGpm: productFlowGpm, massFlowLbHr: productMassFlow, density: productDensity, viscosity: productViscosity, temperature: productTemp, pressure: productPressure, priceLb: productPriceLb, priceGal: productPriceGal, priceMMBtu: productPriceMMBtu },
    economics: { feedInputCost, energyInputCost, operatingCost, productRevenue, spreadLb, spreadGal, spreadMMBtu, netMargin }
  };
}


function getUnitStreamY(unit) {
  if (!unit) return 375;
  const cx = unit.x + unit.width / 2;
  if (unit.type === "pump" || unit.type === "compressor" || unit.type === "turbine") return unit.y + 48;
  if (unit.type === "exchanger" || unit.type === "valve") return unit.y + 50;
  if (unit.type === "separator" || unit.type === "pipe") return unit.y + 52;
  if (unit.type === "column") {
    const top = unit.y - 20;
    const h = unit.height + 65;
    return top + h * 0.45;
  }
  if (unit.type === "furnace") return unit.y + unit.height / 2;
  if (unit.type === "vessel") return unit.y + 54;
  if (unit.type === "reactor") return unit.y + unit.height / 2;
  return unit.y + unit.height / 2;
}

function buildUnitSymbolShowcase(model) {
  const op = model.unitOperation || selectedUnitOperation();
  const unitType = unitTypeFromOperation(op);
  const unit = { id: unitIdFromOperation(op), name: op, type: unitType, x: 610, y: 310, width: op === "Column" ? 170 : op === "Pipe" ? 260 : 190, height: op === "Column" ? 190 : 125 };
  const feedName = document.getElementById("feedMaterial")?.value || "Natural Gas";
  const streamType = /Natural Gas|LPG|NGLs/i.test(feedName) || op === "Compressor" || op === "Turbine" ? "vapor" : "liquid";
  const y = getUnitStreamY(unit);
  const inletEndX = unit.x + 5;
  const outletStartX = unit.x + unit.width - 5;
  const streams = [
    { id: "S-101", name: `${feedName} Feed`, type: streamType, utility: false, path: [{x:180,y},{x:inletEndX,y}], label:{x:215,y:230}, lines:[`${fmt(model.inputs.massFlowLbHr,0)} lb/hr`,`${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure,0)} psig`], tooltip:`Feed to ${op}` },
    { id: "S-102", name: `${op} Outlet`, type: streamType, utility: false, path: [{x:outletStartX,y},{x:1220,y}], label:{x:980,y:230}, lines:[`${fmt(model.product.massFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:`Outlet from ${op}` }
  ];
  if (/Heat Exchanger|Heater|Column|Reactor/.test(op)) streams.push({ id: "Q-101", name: "Energy", type: "energy", utility: true, path: [{x:unit.x + unit.width/2,y:625},{x:unit.x + unit.width/2,y:unit.y+unit.height}], label:{x:760,y:585}, lines:[`Duty: ${fmt(model.dutyMMBtuHr,2)} MMBtu/h`, `ΔT: ${fmt(model.product.temperature-model.inputs.temperature,0)} °F`], tooltip:"Energy stream" });
  if (/Separator|Vessel/.test(op)) {
    streams.push({ id: "V-101", name: "Vapor Product", type: "vapor", utility: false, path: [{x:unit.x+unit.width/2,y:unit.y},{x:unit.x+unit.width/2,y:210},{x:1220,y:210}], label:{x:980,y:115}, lines:[`${fmt(model.vaporFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:"Separated vapor product" });
    streams[1].name = "Liquid Product";
    streams[1].lines[0] = `${fmt(model.liquidFlowLbHr,0)} lb/hr`;
  }
  return { units: [unit], streams };
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
  else if (unit.type === "reactor") drawReactorShape(g, unit);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}

function updateOutputTableBaseBeforeAmine(model) {
  outputTitle.textContent = model.selection.type === "objectLevel" && model.selection.key === "Units" ? `${model.unitOperation} Output Results` : `${model.selection.config.title} Product Properties`;
  const unitRows = model.selection.type === "objectLevel" && model.selection.key === "Units" ? `
    <tr><td>Calculation Mode</td><td>${model.resultMode}</td></tr>
    <tr><td>Pressure Change</td><td>${fmt(model.product.pressure - model.inputs.pressure, 1)} psig</td></tr>
    <tr><td>Temperature Change</td><td>${fmt(model.product.temperature - model.inputs.temperature, 1)} °F</td></tr>
    <tr><td>Hydraulic / Shaft Power</td><td>${fmt(model.hydraulicHp, 2)} hp</td></tr>
    <tr><td>Heat Duty</td><td>${fmt(model.dutyMMBtuHr, 3)} MMBtu/h</td></tr>
    <tr><td>Vapor Flow</td><td>${fmt(model.vaporFlowLbHr, 0)} lb/hr</td></tr>
    <tr><td>Liquid Flow</td><td>${fmt(model.liquidFlowLbHr, 0)} lb/hr</td></tr>` : "";
  outputTable.innerHTML = `
    ${unitRows}
    <tr><td>Product flow</td><td>${fmt(model.product.flowGpm, 1)} gpm</td></tr>
    <tr><td>Mass flow rate</td><td>${fmt(model.product.massFlowLbHr, 0)} lb/hr</td></tr>
    <tr><td>Density</td><td>${fmt(model.product.density, 2)} lb/ft³</td></tr>
    <tr><td>Viscosity</td><td>${fmt(model.product.viscosity, 3)} cP</td></tr>
    <tr><td>Temperature</td><td>${fmt(model.product.temperature, 1)} °F</td></tr>
    <tr><td>Pressure</td><td>${fmt(model.product.pressure, 1)} psig</td></tr>
    <tr><td>Price</td><td>${money(model.product.priceLb, 3)}/lb</td></tr>
    <tr><td>Price</td><td>${money(model.product.priceGal, 2)}/gal</td></tr>
    <tr><td>Price</td><td>${money(model.product.priceMMBtu, 2)}/MMBtu</td></tr>`;
}

function drawUnitInputTable(model) {
  if (!(model.selection.type === "objectLevel" && model.selection.key === "Units")) return;
  const feedName = document.getElementById("feedMaterial")?.value || "Natural Gas";
  const g = svgEl("g", { class: "svg-input-table" });
  g.appendChild(svgEl("rect", { x: 35, y: 125, width: 345, height: 365, rx: 10, class: "overlay-box" }));
  addText(g, "Unit Input Table", 55, 155, "overlay-title");
  addText(g, `Feed: ${feedName}`, 55, 180, "overlay-text");
  addText(g, `Unit: ${model.unitOperation}`, 55, 202, "overlay-text");
  const rows = [
    ["Feed flow", `${fmt(model.inputs.feedFlowGpm, 1)} gpm`],
    ["Mass flow", `${fmt(model.inputs.massFlowLbHr, 0)} lb/hr`],
    ["Density", `${fmt(model.inputs.density, 2)} lb/ft³`],
    ["Viscosity", `${fmt(model.inputs.viscosity, 3)} cP`],
    ["Temperature", `${fmt(model.inputs.temperature, 1)} °F`],
    ["Pressure", `${fmt(model.inputs.pressure, 1)} psig`],
    ["Price", `${money(model.inputs.priceLb, 3)}/lb`],
    ["Price", `${money(model.inputs.priceGal, 2)}/gal`],
    ["Price", `${money(model.inputs.priceMMBtu, 2)}/MMBtu`]
  ];
  rows.forEach(([k, v], i) => {
    const yy = 235 + i * 26;
    addText(g, k, 55, yy, "svg-table-key");
    addText(g, v, 355, yy, "svg-table-value", "end");
  });
  layers.overlays.appendChild(g);
}

function renderBaseBeforeAmine() {
  if (!layers) return;
  const selection = getSelection();
  syncUnitOperationOverlay(selection);
  clearLayers();
  const model = computeModel();
  const pfd = buildDynamicPfd(model);
  activeViewName.textContent = model.selection.type === "objectLevel" && model.selection.key === "Units" ? `Units - ${model.unitOperation}` : model.selection.config.title;
  drawGrid();
  drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);
  drawOverlays(model);
  drawStreamInputTable(model);
  drawUnitInputTable(model);
  updateOutputTable(model);
  updateEconomicsTable(model);
}

startPfdTemplate();


/* ------------------------------------------------------------------
   Final layout updates
   - Energy stream header branches to every displayed unit with arrowheads
   - SVG energy table shows MMBtu/h and hp
   - Separator / vessel view includes water phase outlet
   - Heater uses a single clean box symbol
   - Unit tags remain explicit on each symbol
------------------------------------------------------------------ */
function unitConnectionY(unit) {
  return getUnitStreamY(unit);
}

function unitEnergyTarget(unit) {
  const x = unit.x + unit.width / 2;
  let y = unit.y + unit.height + 8;
  if (unit.type === "column") y = unit.y + unit.height + 35;
  if (unit.type === "furnace") y = unit.y + unit.height + 5;
  if (unit.type === "pipe") y = unit.y + 92;
  return { x, y };
}

function addEnergyNetworkToPfd(pfd, model) {
  if (!pfd.units || !pfd.units.length) return pfd;
  const busY = 705;
  const firstX = Math.min(...pfd.units.map(u => u.x + u.width / 2)) - 35;
  const lastX = Math.max(...pfd.units.map(u => u.x + u.width / 2)) + 35;
  pfd.streams = pfd.streams.filter(s => !/^Q-|^E-BUS/.test(s.id));
  pfd.streams.push({
    id: "E-BUS",
    name: "Energy Header",
    type: "energy",
    utility: true,
    path: [{ x: firstX, y: busY }, { x: lastX, y: busY }],
    label: { x: 515, y: 728 },
    lines: [`Total: ${fmt(Math.abs(totalEnergyMMBtu(model)), 2)} MMBtu/h`, `${fmt(Math.abs(totalEnergyHp(model)), 1)} hp`],
    tooltip: "Energy header supplying/receiving duty for all displayed units"
  });
  pfd.units.forEach((u, i) => {
    const target = unitEnergyTarget(u);
    pfd.streams.push({
      id: `Q-${101 + i}`,
      name: `${u.id} Energy`,
      type: "energy",
      utility: true,
      path: [{ x: target.x, y: busY }, { x: target.x, y: target.y }],
      label: { x: -9999, y: -9999 },
      lines: [`${fmt(Math.abs(unitEnergyMMBtu(model, i)), 2)} MMBtu/h`, `${fmt(Math.abs(unitEnergyHp(model, i)), 1)} hp`],
      tooltip: `${u.id} ${u.name}\nEnergy: ${fmt(Math.abs(unitEnergyMMBtu(model, i)), 2)} MMBtu/h\nPower equivalent: ${fmt(Math.abs(unitEnergyHp(model, i)), 1)} hp`
    });
  });
  return pfd;
}

function totalEnergyMMBtu(model) {
  const duty = Number(model.dutyMMBtuHr || 0);
  const hpMMBtu = Number(model.hydraulicHp || 0) * 2544.43 / 1_000_000;
  const processFactor = Number(model.selection?.config?.energy || 0) * Number(model.inputs?.massFlowLbHr || 0) / 1000;
  return Math.abs(duty) + Math.abs(hpMMBtu) + Math.abs(processFactor);
}

function totalEnergyHp(model) {
  const hpFromDuty = totalEnergyMMBtu(model) * 1_000_000 / 2544.43;
  return Math.abs(Number(model.hydraulicHp || 0)) + hpFromDuty;
}

function unitEnergyMMBtu(model, i) {
  const base = totalEnergyMMBtu(model);
  if (!base) return 0;
  return base * (0.75 + i * 0.08) / Math.max(1, (model.selection?.config?.units?.length || 1));
}

function unitEnergyHp(model, i) {
  return unitEnergyMMBtu(model, i) * 1_000_000 / 2544.43;
}

function buildDynamicPfd(model) {
  let pfd;
  if (model.selection.type === "objectLevel" && model.selection.key === "Streams") {
    pfd = buildSingleStreamPfd(model);
    return pfd;
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Units") {
    pfd = buildUnitSymbolShowcase(model);
    return addEnergyNetworkToPfd(pfd, model);
  }
  const unitNames = model.selection.config.units;
  const unitX = [105, 335, 570, 815, 1050];
  const y = model.selection.type === "objectLevel" ? 340 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 180 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i];
    const to = units[i + 1];
    const sy = unitConnectionY(from);
    const ty = unitConnectionY(to);
    const labelSlots = [{ x: 105, y: 115 }, { x: 370, y: 115 }, { x: 635, y: 115 }, { x: 900, y: 115 }];
    streams.push({
      id: `S-${101 + i}`,
      name: ["Feed", "Intermediate", "Treated", "Product"][i],
      type: streamTypeFor(model, i),
      utility: false,
      path: sy === ty ? [{ x: from.x + from.width, y: sy }, { x: to.x, y: ty }] : [{ x: from.x + from.width, y: sy }, { x: (from.x + from.width + to.x)/2, y: sy }, { x: (from.x + from.width + to.x)/2, y: ty }, { x: to.x, y: ty }],
      label: labelSlots[i],
      lines: streamLinesFor(model, i),
      tooltip: `${["Feed", "Intermediate", "Treated", "Product"][i]}\n${streamLinesFor(model, i).join("\n")}`
    });
  }
  pfd = { units, streams };
  return addEnergyNetworkToPfd(pfd, model);
}

function buildUnitSymbolShowcase(model) {
  const op = model.unitOperation || selectedUnitOperation();
  const unitType = unitTypeFromOperation(op);
  const unit = { id: unitIdFromOperation(op), name: op, type: unitType, x: 610, y: 310, width: op === "Column" ? 170 : op === "Pipe" ? 260 : 190, height: op === "Column" ? 190 : 125 };
  const feedName = document.getElementById("feedMaterial")?.value || "Natural Gas";
  const streamType = /Natural Gas|LPG|NGLs/i.test(feedName) || op === "Compressor" || op === "Turbine" ? "vapor" : "liquid";
  const y = unitConnectionY(unit);
  const inletEndX = unit.x;
  const outletStartX = unit.x + unit.width;
  const streams = [
    { id: "S-101", name: `${feedName} Feed`, type: streamType, utility: false, path: [{x:180,y},{x:inletEndX,y}], label:{x:215,y:230}, lines:[`${fmt(model.inputs.massFlowLbHr,0)} lb/hr`,`${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure,0)} psig`], tooltip:`Feed to ${op}` },
    { id: "S-102", name: `${op} Outlet`, type: streamType, utility: false, path: [{x:outletStartX,y},{x:1220,y}], label:{x:980,y:230}, lines:[`${fmt(model.product.massFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:`Outlet from ${op}` }
  ];
  if (/Separator|Vessel/.test(op)) {
    streams.push({ id: "V-101", name: "Vapor Product", type: "vapor", utility: false, path: [{x:unit.x+unit.width/2,y:unit.y+25},{x:unit.x+unit.width/2,y:210},{x:1220,y:210}], label:{x:980,y:115}, lines:[`${fmt(model.vaporFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:"Separated vapor product" });
    streams.push({ id: "W-101", name: "Water Phase", type: "liquid", utility: false, path: [{x:unit.x+unit.width/2,y:unit.y+90},{x:unit.x+unit.width/2,y:535},{x:1220,y:535}], label:{x:980,y:548}, lines:[`${fmt(model.liquidFlowLbHr * 0.08,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], tooltip:"Separated water phase" });
    streams[1].name = "Hydrocarbon Liquid";
    streams[1].lines[0] = `${fmt(model.liquidFlowLbHr * 0.92,0)} lb/hr`;
  }
  return { units: [unit], streams };
}

function drawFurnaceShape(g, u, model) {
  const cx = u.x + u.width / 2;
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx: 12, class: "unit-shape heater-single-box" }));
  for (let i = 0; i < 4; i++) {
    g.appendChild(svgEl("path", { d: `M ${u.x + 28} ${u.y + 34 + i * 20} H ${u.x + u.width - 28}`, class: "unit-coil" }));
  }
  addText(g, u.id, cx, u.y + 26, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + u.height + 22, "unit-name", "middle");
  addText(g, `${fmt(Math.abs(model.dutyMMBtuHr || model.selection.config.energy), 2)} MMBtu/h`, cx, u.y + u.height - 18, "unit-name energy-text", "middle");
}

function drawSeparatorShape(g, u) {
  const cx = u.x + u.width / 2, cy = u.y + 52;
  const x = u.x + 20, y = u.y + 25, w = u.width - 40, h = 55;
  g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: h/2, class: "separator-shell" }));
  g.appendChild(svgEl("line", { x1: x + 18, y1: y + h*0.48, x2: x + w - 18, y2: y + h*0.48, class: "separator-level" }));
  g.appendChild(svgEl("line", { x1: x + 18, y1: y + h*0.70, x2: x + w - 18, y2: y + h*0.70, class: "separator-water-level" }));
  g.appendChild(svgEl("line", { x1: u.x, y1: cy, x2: x, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: x+w, y1: cy, x2: u.x + u.width, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx, y1: y, x2: cx, y2: y - 24, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx, y1: y + h, x2: cx, y2: y + h + 28, class: "symbol-stream-line" }));
  addText(g, u.id, cx, u.y + 108, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 128, "unit-name", "middle");
}

function drawEnergyTableBaseBeforeRegions(model) {
  if (!showOverlays) return;
  if (!(model.selection.type === "objectLevel" && model.selection.key === "Units") && model.selection.type !== "processArea" && model.selection.type !== "objectLevel") return;
  const x = 405, y = 635;
  const g = svgEl("g", { class: "svg-energy-table" });
  g.appendChild(svgEl("rect", { x, y, width: 275, height: 78, rx: 10, class: "overlay-box" }));
  addText(g, "Energy Summary", x + 16, y + 24, "overlay-title");
  addText(g, `Duty: ${fmt(Math.abs(totalEnergyMMBtu(model)), 2)} MMBtu/h`, x + 16, y + 48, "overlay-text energy-text");
  addText(g, `Power Eq.: ${fmt(Math.abs(totalEnergyHp(model)), 1)} hp`, x + 16, y + 66, "overlay-text energy-text");
  layers.overlays.appendChild(g);
}

function drawLegendOverlay() {
  const g = svgEl("g", { class: "legend-overlay" });
  const boxX = 1095;
  const boxY = 610;
  const rowStartY = boxY + 49;
  g.appendChild(svgEl("rect", { x: boxX, y: boxY, width: 255, height: 205, rx: 10, class: "legend-box" }));
  addText(g, "Legend", boxX + 18, boxY + 25, "legend-title");
  [["liquid","Liquid Stream"],["vapor","Vapor Stream"],["energy","Energy Stream"],["fuel","Fuel"],["utility","Utility"],["flue","Vent / Flue"]].forEach(([cls,label],i)=>{
    const yy = rowStartY + i * 24;
    g.appendChild(svgEl("line", { x1: boxX + 20, y1: yy, x2: boxX + 68, y2: yy, class: `stream ${cls}` }));
    addText(g, label, boxX + 82, yy + 4, "legend-text");
  });
  layers.overlays.appendChild(g);
}

function drawStreamLabel(stream) {
  if (!showLabels || (!showUtilities && stream.utility)) return;
  if (stream.label?.x < 0 || stream.label?.y < 0) return;
  const x = stream.label.x, y = stream.label.y, w = 182, h = 58;
  const g = svgEl("g", { class: "stream-label stream-table" });
  g.appendChild(svgEl("rect", { x, y, width: w, height: h, rx: 7, class: "stream-label-box" }));
  addText(g, `${stream.id} ${stream.name}`, x + 8, y + 17, "stream-label-title");
  addText(g, stream.lines[0], x + 8, y + 35, "stream-label-text");
  addText(g, stream.lines[1], x + 8, y + 51, "stream-label-text");
  layers.labels.appendChild(g);
}

function render() {
  if (!layers) return;
  const selection = getSelection();
  syncUnitOperationOverlay(selection);
  clearLayers();
  const model = computeModel();
  const pfd = buildDynamicPfd(model);
  activeViewName.textContent = model.selection.type === "objectLevel" && model.selection.key === "Units" ? `Units - ${model.unitOperation}` : model.selection.config.title;
  drawGrid();
  drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);
  drawOverlays(model);
  drawStreamInputTable(model);
  drawUnitInputTable(model);
  drawEnergyTable(model);
  updateOutputTable(model);
  updateEconomicsTable(model);
}

startPfdTemplate();

/* ------------------------------------------------------------------
   Final tooltip update
   - Stream tooltips: name, gpm, bpd, lb/hr, °F, psig, enthalpy MMBtu/h
   - Unit tooltips: tag, gpm, lb/hr, duty, hp, plus unit-specific details
------------------------------------------------------------------ */
let currentRenderModel = null;

function gpmToBpd(gpm) {
  return Number(gpm || 0) * 1440 / 42;
}

function massFlowToGpm(lbHr, densityLbFt3) {
  return Number(lbHr || 0) / Math.max(Number(densityLbFt3 || 0) * 60 * 0.133681, 0.000001);
}

function streamEnthalpyMMBtuHr(flowLbHr, tempF, referenceF = 60, cp = 0.62) {
  return Number(flowLbHr || 0) * cp * (Number(tempF || 0) - referenceF) / 1_000_000;
}

function pressureHeadFt(deltaPpsig, densityLbFt3) {
  return Number(deltaPpsig || 0) * 144 / Math.max(Number(densityLbFt3 || 0), 0.000001);
}

function streamDataForTooltipBaseBeforeRegions(stream, model) {
  const input = model?.inputs || {};
  const product = model?.product || {};
  const density = input.density || product.density || 50;
  let name = stream?.name || "Stream";
  let gpm = input.feedFlowGpm || 0;
  let lbHr = input.massFlowLbHr || 0;
  let temp = input.temperature || 0;
  let pressure = input.pressure || 0;
  let enthalpy = streamEnthalpyMMBtuHr(lbHr, temp);

  if (/S-102|outlet|product|treated|intermediate/i.test(`${stream?.id || ""} ${stream?.name || ""}`)) {
    gpm = product.flowGpm || gpm;
    lbHr = product.massFlowLbHr || lbHr;
    temp = product.temperature || temp;
    pressure = product.pressure || pressure;
    enthalpy = streamEnthalpyMMBtuHr(lbHr, temp);
  }
  if (/^V-|vapor/i.test(`${stream?.id || ""} ${stream?.name || ""}`)) {
    lbHr = model?.vaporFlowLbHr || product.massFlowLbHr || lbHr;
    gpm = massFlowToGpm(lbHr, Math.max(density * 0.08, 0.1));
    temp = product.temperature || temp;
    pressure = product.pressure || pressure;
    enthalpy = streamEnthalpyMMBtuHr(lbHr, temp, 60, 0.52);
  }
  if (/^W-|water/i.test(`${stream?.id || ""} ${stream?.name || ""}`)) {
    lbHr = (model?.liquidFlowLbHr || lbHr) * 0.08;
    gpm = massFlowToGpm(lbHr, 62.4);
    temp = product.temperature || temp;
    pressure = product.pressure || pressure;
    enthalpy = streamEnthalpyMMBtuHr(lbHr, temp, 60, 1.0);
  }
  if (/^Q-|^E-|energy/i.test(`${stream?.id || ""} ${stream?.name || ""} ${stream?.type || ""}`)) {
    name = stream?.name || "Energy Stream";
    gpm = 0;
    lbHr = 0;
    temp = 0;
    pressure = 0;
    enthalpy = Math.abs(unitEnergyMMBtu(model || {}, 0) || totalEnergyMMBtu(model || {}) || model?.dutyMMBtuHr || 0);
  }

  const streamKey = `${stream?.id || ""} ${stream?.name || ""}`;
  const useProductPrice = /S-102|S-106|S-107|S-108|S-109|outlet|product|treated|intermediate|storage|export|petrochemical/i.test(streamKey);
  const priceMMBtu = useProductPrice ? Number(product.priceMMBtu || input.priceMMBtu || 0) : Number(input.priceMMBtu || product.priceMMBtu || 0);
  const priceGal = useProductPrice ? Number(product.priceGal || input.priceGal || 0) : Number(input.priceGal || product.priceGal || 0);
  const priceBbl = priceGal * 42;

  return { name, gpm, bpd: gpmToBpd(gpm), lbHr, temp, pressure, enthalpy, priceMMBtu, priceBbl };
}

function buildStreamTooltipBaseBeforeRegions(stream, model) {
  const d = streamDataForTooltip(stream, model);
  return [
    `Name: ${d.name}`,
    `Volumetric flow rate: ${fmt(d.gpm, 1)} gpm`,
    `Volumetric flow rate: ${fmt(d.bpd, 1)} bpd`,
    `Mass flow rate: ${fmt(d.lbHr, 0)} lb/hr`,
    `Temperature: ${fmt(d.temp, 1)} °F`,
    `Pressure: ${fmt(d.pressure, 1)} psig`,
    `Enthalpy: ${fmt(d.enthalpy, 3)} MMBtu/hr`,
    `Price: ${money(d.priceMMBtu, 2)}/MMBtu`,
    `Price: ${money(d.priceBbl, 2)}/bbl`
  ].join("\n");
}

function buildUnitTooltipBaseBeforeAmine(unit, model) {
  const input = model?.inputs || {};
  const product = model?.product || {};
  const deltaP = Number(product.pressure || 0) - Number(input.pressure || 0);
  const deltaT = Number(product.temperature || 0) - Number(input.temperature || 0);
  const duty = Number(model?.dutyMMBtuHr || 0);
  const hp = Number(model?.hydraulicHp || 0);
  const headFt = pressureHeadFt(deltaP, input.density);
  const vaporLbHr = Number(model?.vaporFlowLbHr || 0);
  const liquidLbHr = Number(model?.liquidFlowLbHr || product.massFlowLbHr || 0);
  const vaporGpm = massFlowToGpm(vaporLbHr, Math.max(Number(input.density || 50) * 0.08, 0.1));
  const liquidGpm = massFlowToGpm(liquidLbHr, Number(input.density || 50));

  const rows = [
    `Tag name: ${unit.id}`,
    `Volumetric flow rate: ${fmt(input.feedFlowGpm, 1)} gpm`,
    `Mass flow rate: ${fmt(input.massFlowLbHr, 0)} lb/hr`,
    `Duty: ${fmt(duty, 3)} MMBtu/hr`,
    `Power: ${fmt(hp, 2)} hp`,
    `Price: ${money(input.priceMMBtu || 0, 2)}/MMBtu`,
    `Price: ${money((input.priceGal || 0) * 42, 2)}/bbl`
  ];

  if (/pump|compressor|turbine/i.test(unit.type)) {
    rows.push(`Pressure change: ${fmt(deltaP, 1)} psig`);
    rows.push(`Head change: ${fmt(headFt, 1)} ft`);
  }

  if (/furnace|exchanger/i.test(unit.type) || /heater|cooler|heat exchanger/i.test(unit.name)) {
    rows.push(`Temperature change: ${fmt(deltaT, 1)} °F`);
    rows.push(`Duty: ${fmt(duty, 3)} MMBtu/hr`);
  }

  if (/column/i.test(unit.type)) {
    rows.push(`Feed stream flow rate: ${fmt(input.feedFlowGpm, 1)} gpm / ${fmt(input.massFlowLbHr, 0)} lb/hr`);
    rows.push(`Product stream flow rate: ${fmt(product.flowGpm, 1)} gpm / ${fmt(product.massFlowLbHr, 0)} lb/hr`);
    rows.push(`Feed stream T/P: ${fmt(input.temperature, 1)} °F / ${fmt(input.pressure, 1)} psig`);
    rows.push(`Product stream T/P: ${fmt(product.temperature, 1)} °F / ${fmt(product.pressure, 1)} psig`);
  }

  if (/separator|vessel/i.test(unit.type)) {
    rows.push(`Vapor flow rate: ${fmt(vaporGpm, 1)} gpm / ${fmt(vaporLbHr, 0)} lb/hr`);
    rows.push(`Liquid flow rate: ${fmt(liquidGpm, 1)} gpm / ${fmt(liquidLbHr, 0)} lb/hr`);
  }

  return rows.join("\n");
}

function drawStream(stream) {
  if (!showUtilities && stream.utility) return;
  const g = svgEl("g", { class: `stream-group ${stream.type}` });
  const line = svgEl("polyline", { points: pointsToString(stream.path), class: `stream ${stream.type}` });
  const hit = svgEl("polyline", { points: pointsToString(stream.path), class: "stream-hitbox" });
  hit.dataset.tooltip = buildStreamTooltip(stream, currentRenderModel || computeModel());
  g.appendChild(line);
  g.appendChild(hit);
  layers.streams.appendChild(g);
  attachTooltip(hit);
}

function drawUnit(unit, model) {
  const g = svgEl("g", { class: "selectable unit" });
  g.dataset.tooltip = buildUnitTooltip(unit, model);
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
  else if (unit.type === "reactor") drawReactorShape(g, unit);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}

function buildUnitSymbolShowcase(model) {
  const op = model.unitOperation || selectedUnitOperation();
  const unitType = unitTypeFromOperation(op);
  const unit = { id: unitIdFromOperation(op), name: op, type: unitType, x: 610, y: 310, width: op === "Column" ? 170 : op === "Pipe" ? 260 : 190, height: op === "Column" ? 190 : 125 };
  const feedName = document.getElementById("feedMaterial")?.value || "Natural Gas";
  const streamType = /Natural Gas|LPG|NGLs/i.test(feedName) || op === "Compressor" || op === "Turbine" ? "vapor" : "liquid";
  const y = unitConnectionY(unit);
  const inletEndX = unit.x + 5;
  const outletStartX = unit.x + unit.width - 5;
  const streams = [
    { id: "S-101", name: `${feedName} Feed`, type: streamType, utility: false, path: [{x:180,y},{x:inletEndX,y}], label:{x:215,y:230}, lines:[`${fmt(model.inputs.massFlowLbHr,0)} lb/hr`,`${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure,0)} psig`] },
    { id: "S-102", name: `${op} Outlet`, type: streamType, utility: false, path: [{x:outletStartX,y},{x:1220,y}], label:{x:980,y:230}, lines:[`${fmt(model.product.massFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`] }
  ];
  if (/Separator|Vessel/.test(op)) {
    streams.push({ id: "V-101", name: "Vapor Product", type: "vapor", utility: false, path: [{x:unit.x+unit.width/2,y:unit.y+25},{x:unit.x+unit.width/2,y:210},{x:1220,y:210}], label:{x:980,y:115}, lines:[`${fmt(model.vaporFlowLbHr,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`] });
    streams.push({ id: "W-101", name: "Water Phase", type: "liquid", utility: false, path: [{x:unit.x+unit.width/2,y:unit.y+90},{x:unit.x+unit.width/2,y:535},{x:1220,y:535}], label:{x:980,y:548}, lines:[`${fmt(model.liquidFlowLbHr * 0.08,0)} lb/hr`,`${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`] });
    streams[1].name = "Hydrocarbon Liquid";
    streams[1].lines[0] = `${fmt(model.liquidFlowLbHr * 0.92,0)} lb/hr`;
  }
  return { units: [unit], streams };
}

function render() {
  if (!layers) return;
  const selection = getSelection();
  syncUnitOperationOverlay(selection);
  clearLayers();
  const model = computeModel();
  currentRenderModel = model;
  const pfd = buildDynamicPfd(model);
  activeViewName.textContent = model.selection.type === "objectLevel" && model.selection.key === "Units" ? `Units - ${model.unitOperation}` : model.selection.config.title;
  drawGrid();
  drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);
  drawOverlays(model);
  drawStreamInputTable(model);
  drawUnitInputTable(model);
  drawEnergyTable(model);
  updateOutputTable(model);
  updateEconomicsTable(model);
}

/* ------------------------------------------------------------------
   Final override: corrected Plants object-level layout
   - Utility Plant moved lower on the SVG.
   - Utility outlet connects upward to the Process Plant.
   - Process Plant outlet connects directly to Storage.
   - Storage outlet connects to Loading.
------------------------------------------------------------------ */
function buildPlantViewPfd(model) {
  const y = 315;
  const plantUnits = [
    { id: "FS-101", name: "Feed System", type: "box", x: 105, y, width: 155, height: 95 },
    { id: "PLT-101", name: "Process Plant", type: "box", x: 365, y, width: 205, height: 105 },
    { id: "UT-101", name: "Utility Plant", type: "box", x: 375, y: 545, width: 185, height: 95 },
    { id: "TK-101", name: "Storage", type: "tank", x: 705, y: 315, width: 170, height: 105 },
    { id: "LD-101", name: "Loading", type: "box", x: 1010, y: 315, width: 155, height: 95 }
  ];

  const feed = plantUnits[0];
  const plant = plantUnits[1];
  const utilities = plantUnits[2];
  const storage = plantUnits[3];
  const loading = plantUnits[4];
  const feedY = unitConnectionY(feed);
  const plantY = unitConnectionY(plant);
  const storageY = unitConnectionY(storage);
  const loadingY = unitConnectionY(loading);
  const utilityOutletX = utilities.x + utilities.width / 2;
  const plantUtilityInletX = plant.x + plant.width / 2;

  const streams = [
    {
      id: "S-101",
      name: "Plant Feed",
      type: streamTypeFor(model, 0),
      utility: false,
      path: [{ x: feed.x + feed.width, y: feedY }, { x: plant.x, y: plantY }],
      label: { x: 275, y: 205 },
      lines: streamLinesFor(model, 0)
    },
    {
      id: "S-102",
      name: "Plant Outlet",
      type: streamTypeFor(model, 1),
      utility: false,
      path: [{ x: plant.x + plant.width, y: plantY }, { x: storage.x, y: storageY }],
      label: { x: 585, y: 205 },
      lines: streamLinesFor(model, 1)
    },
    {
      id: "S-103",
      name: "Storage Outlet",
      type: streamTypeFor(model, 2),
      utility: false,
      path: [{ x: storage.x + storage.width, y: storageY }, { x: loading.x, y: loadingY }],
      label: { x: 885, y: 205 },
      lines: streamLinesFor(model, 2)
    },
    {
      id: "U-101",
      name: "Utilities to Plant",
      type: "utility",
      utility: true,
      path: [
        { x: utilityOutletX, y: utilities.y },
        { x: utilityOutletX, y: 485 },
        { x: plantUtilityInletX, y: 485 },
        { x: plantUtilityInletX, y: plant.y + plant.height }
      ],
      label: { x: 575, y: 495 },
      lines: [`Utility Load: ${fmt(model.selection.config.energy, 2)} MMBtu/klb`, `Opex: ${money(model.selection.config.operating, 3)}/lb`]
    }
  ];

  return addEnergyNetworkToPfd({ units: plantUnits, streams }, model);
}

function buildDynamicPfd(model) {
  let pfd;
  if (model.selection.type === "objectLevel" && model.selection.key === "Streams") {
    return buildSingleStreamPfd(model);
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Units") {
    pfd = buildUnitSymbolShowcase(model);
    return addEnergyNetworkToPfd(pfd, model);
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Plants") {
    return buildPlantViewPfd(model);
  }

  const unitNames = model.selection.config.units;
  const unitX = [105, 335, 570, 815, 1050];
  const y = model.selection.type === "objectLevel" ? 340 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 180 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i];
    const to = units[i + 1];
    const sy = unitConnectionY(from);
    const ty = unitConnectionY(to);
    const labelSlots = [{ x: 105, y: 115 }, { x: 370, y: 115 }, { x: 635, y: 115 }, { x: 900, y: 115 }];
    streams.push({
      id: `S-${101 + i}`,
      name: ["Feed", "Intermediate", "Treated", "Product"][i],
      type: streamTypeFor(model, i),
      utility: false,
      path: sy === ty ? [{ x: from.x + from.width, y: sy }, { x: to.x, y: ty }] : [{ x: from.x + from.width, y: sy }, { x: (from.x + from.width + to.x)/2, y: sy }, { x: (from.x + from.width + to.x)/2, y: ty }, { x: to.x, y: ty }],
      label: labelSlots[i],
      lines: streamLinesFor(model, i)
    });
  }
  return addEnergyNetworkToPfd({ units, streams }, model);
}

/* ------------------------------------------------------------------
   Final override: Sites object-level inter-site routing
   - Natural Gas feeds both LNG and Refinery.
   - Crude Oil and Condensate feed Refinery.
   - Condensate also feeds NGLs.
   - Refinery products route to Fuels Storage, Petrochemical Units,
     and Loading / Export.
------------------------------------------------------------------ */
function buildSitesViewPfd(model) {
  const units = [
    { id: "NG-101", name: "Natural Gas", type: "box", x: 55, y: 120, width: 155, height: 75 },
    { id: "CR-101", name: "Crude Oil", type: "box", x: 55, y: 295, width: 155, height: 75 },
    { id: "CD-101", name: "Condensate", type: "box", x: 55, y: 470, width: 155, height: 75 },

    { id: "LNG-101", name: "LNG Facility", type: "box", x: 430, y: 105, width: 180, height: 90 },
    { id: "REF-101", name: "Refinery", type: "box", x: 430, y: 300, width: 180, height: 105 },
    { id: "NGL-101", name: "NGLs Facility", type: "box", x: 430, y: 500, width: 180, height: 90 },

    { id: "TK-101", name: "Fuels Storage\nGasoline / Diesel\nNaphtha / Gasoil", type: "tank", x: 805, y: 215, width: 190, height: 125 },
    { id: "PC-101", name: "Petrochemical Units", type: "reactor", x: 805, y: 405, width: 190, height: 120 },
    { id: "LD-101", name: "Loading / Export", type: "box", x: 1110, y: 315, width: 180, height: 100 }
  ];

  const midY = u => u.y + u.height / 2;
  const leftX = u => u.x;
  const rightX = u => u.x + u.width;
  const streams = [
    {
      id: "S-101",
      name: "Natural Gas to LNG",
      type: "vapor",
      utility: false,
      path: [{ x: rightX(units[0]), y: midY(units[0]) }, { x: 300, y: midY(units[0]) }, { x: 300, y: midY(units[3]) }, { x: leftX(units[3]), y: midY(units[3]) }],
      label: { x: 245, y: 55 },
      lines: [`${fmt(model.inputs.massFlowLbHr * 0.45, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`]
    },
    {
      id: "S-102",
      name: "Natural Gas to Refinery",
      type: "vapor",
      utility: false,
      path: [{ x: rightX(units[0]), y: midY(units[0]) }, { x: 280, y: midY(units[0]) }, { x: 280, y: midY(units[4]) }, { x: leftX(units[4]), y: midY(units[4]) }],
      label: { x: 235, y: 210 },
      lines: [`${fmt(model.inputs.massFlowLbHr * 0.20, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`]
    },
    {
      id: "S-103",
      name: "Crude Oil to Refinery",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[1]), y: midY(units[1]) }, { x: leftX(units[4]), y: midY(units[4]) }],
      label: { x: 225, y: 300 },
      lines: [`${fmt(model.inputs.massFlowLbHr * 0.55, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`]
    },
    {
      id: "S-104",
      name: "Condensate to Refinery",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[2]), y: midY(units[2]) }, { x: 330, y: midY(units[2]) }, { x: 330, y: midY(units[4]) + 30 }, { x: leftX(units[4]), y: midY(units[4]) + 30 }],
      label: { x: 225, y: 405 },
      lines: [`${fmt(model.inputs.massFlowLbHr * 0.25, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`]
    },
    {
      id: "S-105",
      name: "Condensate to NGLs",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[2]), y: midY(units[2]) }, { x: 315, y: midY(units[2]) }, { x: leftX(units[5]), y: midY(units[5]) }],
      label: { x: 245, y: 560 },
      lines: [`${fmt(model.inputs.massFlowLbHr * 0.18, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`]
    },
    {
      id: "S-106",
      name: "Refinery Products to Fuels Storage",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[4]), y: midY(units[4]) - 25 }, { x: 700, y: midY(units[4]) - 25 }, { x: 700, y: midY(units[6]) }, { x: leftX(units[6]), y: midY(units[6]) }],
      label: { x: 610, y: 215 },
      lines: [`${fmt(model.product.massFlowLbHr * 0.70, 0)} lb/hr`, `${fmt(model.product.temperature, 0)} °F | ${fmt(model.product.pressure, 0)} psig`]
    },
    {
      id: "S-107",
      name: "Refinery Products to Petrochemicals",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[4]), y: midY(units[4]) + 20 }, { x: leftX(units[7]), y: midY(units[7]) }],
      label: { x: 610, y: 405 },
      lines: [`${fmt(model.product.massFlowLbHr * 0.20, 0)} lb/hr`, `${fmt(model.product.temperature, 0)} °F | ${fmt(model.product.pressure, 0)} psig`]
    },
    {
      id: "S-108",
      name: "Storage to Loading / Export",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[6]), y: midY(units[6]) }, { x: 1050, y: midY(units[6]) }, { x: 1050, y: midY(units[8]) - 20 }, { x: leftX(units[8]), y: midY(units[8]) - 20 }],
      label: { x: 1005, y: 205 },
      lines: [`${fmt(model.product.massFlowLbHr * 0.65, 0)} lb/hr`, `${fmt(model.product.temperature, 0)} °F | ${fmt(model.product.pressure, 0)} psig`]
    },
    {
      id: "S-109",
      name: "Direct Refinery Exports",
      type: "liquid",
      utility: false,
      path: [{ x: rightX(units[4]), y: midY(units[4]) }, { x: 1035, y: midY(units[4]) }, { x: 1035, y: midY(units[8]) + 20 }, { x: leftX(units[8]), y: midY(units[8]) + 20 }],
      label: { x: 920, y: 545 },
      lines: [`${fmt(model.product.massFlowLbHr * 0.10, 0)} lb/hr`, `${fmt(model.product.temperature, 0)} °F | ${fmt(model.product.pressure, 0)} psig`]
    }
  ];

  // Sites view intentionally does not include an energy stream/header.
  return { units, streams };
}

function buildDynamicPfdBaseBeforeRegions(model) {
  let pfd;
  if (model.selection.type === "objectLevel" && model.selection.key === "Streams") {
    return buildSingleStreamPfd(model);
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Units") {
    pfd = buildUnitSymbolShowcase(model);
    return addEnergyNetworkToPfd(pfd, model);
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Plants") {
    return buildPlantViewPfd(model);
  }
  if (model.selection.type === "objectLevel" && model.selection.key === "Sites") {
    return buildSitesViewPfd(model);
  }

  const unitNames = model.selection.config.units;
  const unitX = [105, 335, 570, 815, 1050];
  const y = model.selection.type === "objectLevel" ? 340 : 315;
  const units = unitNames.map((name, i) => ({ id: unitIdFor(model.selection, i), name, type: unitTypeFor(name, i), x: unitX[i], y, width: i === 2 ? 180 : 155, height: i === 2 ? 130 : 95 }));
  const streams = [];
  for (let i = 0; i < units.length - 1; i++) {
    const from = units[i];
    const to = units[i + 1];
    const sy = unitConnectionY(from);
    const ty = unitConnectionY(to);
    const labelSlots = [{ x: 105, y: 115 }, { x: 370, y: 115 }, { x: 635, y: 115 }, { x: 900, y: 115 }];
    streams.push({
      id: `S-${101 + i}`,
      name: ["Feed", "Intermediate", "Treated", "Product"][i],
      type: streamTypeFor(model, i),
      utility: false,
      path: sy === ty ? [{ x: from.x + from.width, y: sy }, { x: to.x, y: ty }] : [{ x: from.x + from.width, y: sy }, { x: (from.x + from.width + to.x)/2, y: sy }, { x: (from.x + from.width + to.x)/2, y: ty }, { x: to.x, y: ty }],
      label: labelSlots[i],
      lines: streamLinesFor(model, i)
    });
  }
  return addEnergyNetworkToPfd({ units, streams }, model);
}

/* ------------------------------------------------------------------
   Final override: Regions object-level routing
   - Energy stream routes only to Supply Hub.
   - Three site feeds plus imports enter Supply Hub near sea ports.
   - Exports leave Supply Hub.
   - Supply Hub, Site Storage, and Plant all feed Market.
   - Market routes product to Consumers.
   - Regional process-stream tooltips show bpd, gpm, lb/hr,
     $/MMBtu, MMBtu/bbl, and MMBtu/lb.
------------------------------------------------------------------ */
const previousBuildDynamicPfdForRegions = buildDynamicPfdBaseBeforeRegions;
const previousDrawEnergyTableForRegions = drawEnergyTableBaseBeforeRegions;

function regionalStreamMeta(model, options = {}) {
  const bpd = Number(options.bpd || 0);
  const gpm = bpd * 42 / 1440;
  const density = Number(options.density || model.inputs?.density || 45);
  const lbHr = gpm * 60 * 0.133681 * density;
  const mmbtuBbl = Number(options.mmbtuBbl || 5.8);
  const mmbtuLb = mmbtuBbl / Math.max(density * 5.61458, 0.000001);
  const priceMMBtu = Number(options.priceMMBtu || model.inputs?.priceMMBtu || 10);
  return { bpd, gpm, lbHr, mmbtuBbl, mmbtuLb, priceMMBtu };
}

function regionalStream(id, name, type, path, label, model, metaOptions) {
  const meta = regionalStreamMeta(model, metaOptions);
  return {
    id,
    name,
    type,
    utility: false,
    path,
    label,
    lines: [`${fmt(meta.bpd, 0)} bpd`, `${fmt(meta.gpm, 1)} gpm | ${fmt(meta.lbHr, 0)} lb/hr`],
    meta
  };
}

function buildRegionsViewPfd(model) {
  const units = [
    { id: "SITE-A", name: "Site 1 Terminal", type: "box", x: 55, y: 95, width: 170, height: 70 },
    { id: "SITE-B", name: "Site 2 Terminal", type: "box", x: 55, y: 215, width: 170, height: 70 },
    { id: "SITE-C", name: "Site 3 Terminal", type: "box", x: 55, y: 335, width: 170, height: 70 },
    { id: "IMP-101", name: "Imports", type: "box", x: 55, y: 555, width: 170, height: 70 },
    { id: "HUB-101", name: "Supply Hub (Near Sea Port)", type: "tank", x: 405, y: 245, width: 215, height: 135 },
    { id: "ST-101", name: "Site Storage Terminal", type: "tank", x: 725, y: 95, width: 205, height: 120 },
    { id: "PLT-101", name: "Plant", type: "box", x: 735, y: 455, width: 185, height: 95 },
    { id: "MKT-101", name: "Market", type: "box", x: 1015, y: 275, width: 180, height: 100 },
    { id: "CONS-101", name: "Consumers", type: "box", x: 1235, y: 275, width: 140, height: 100 },
    { id: "EXP-101", name: "Exports", type: "box", x: 725, y: 655, width: 190, height: 80 },
    { id: "Q-REG", name: "Energy Supply", type: "box", x: 405, y: 665, width: 185, height: 70 }
  ];

  const byId = Object.fromEntries(units.map(u => [u.id, u]));
  const midY = u => u.y + u.height / 2;
  const midX = u => u.x + u.width / 2;
  const leftX = u => u.x;
  const rightX = u => u.x + u.width;
  const topY = u => u.y;
  const botY = u => u.y + u.height;
  const hub = byId["HUB-101"];
  const market = byId["MKT-101"];

  const streams = [
    regionalStream("R-101", "Site 1 Supply to Hub", "liquid", [{x:rightX(byId["SITE-A"]),y:midY(byId["SITE-A"])},{x:310,y:midY(byId["SITE-A"])},{x:310,y:hub.y+25},{x:leftX(hub),y:hub.y+25}], {x:230,y:82}, model, {bpd: 85000, density: 48, mmbtuBbl: 5.75, priceMMBtu: 11.25}),
    regionalStream("R-102", "Site 2 Supply to Hub", "liquid", [{x:rightX(byId["SITE-B"]),y:midY(byId["SITE-B"])},{x:leftX(hub),y:hub.y+58}], {x:230,y:205}, model, {bpd: 65000, density: 50, mmbtuBbl: 5.85, priceMMBtu: 10.90}),
    regionalStream("R-103", "Site 3 Supply to Hub", "liquid", [{x:rightX(byId["SITE-C"]),y:midY(byId["SITE-C"])},{x:310,y:midY(byId["SITE-C"])},{x:310,y:hub.y+95},{x:leftX(hub),y:hub.y+95}], {x:230,y:405}, model, {bpd: 52000, density: 46, mmbtuBbl: 5.55, priceMMBtu: 10.40}),
    regionalStream("R-104", "Imports to Supply Hub", "vapor", [{x:rightX(byId["IMP-101"]),y:midY(byId["IMP-101"])},{x:350,y:midY(byId["IMP-101"])},{x:350,y:midY(hub)},{x:leftX(hub),y:midY(hub)}], {x:230,y:575}, model, {bpd: 72000, density: 32, mmbtuBbl: 4.25, priceMMBtu: 8.75}),
    regionalStream("R-105", "Supply Hub to Market", "liquid", [{x:rightX(hub),y:midY(hub)},{x:leftX(market),y:midY(market)}], {x:690,y:285}, model, {bpd: 120000, density: 45, mmbtuBbl: 5.60, priceMMBtu: 12.00}),
    regionalStream("R-106", "Supply Hub Exports", "liquid", [{x:midX(hub),y:botY(hub)},{x:midX(hub),y:620},{x:leftX(byId["EXP-101"]),y:midY(byId["EXP-101"])}], {x:520,y:585}, model, {bpd: 60000, density: 43, mmbtuBbl: 5.35, priceMMBtu: 12.50}),
    regionalStream("R-107", "Site Storage to Market", "liquid", [{x:rightX(byId["ST-101"]),y:midY(byId["ST-101"])},{x:965,y:midY(byId["ST-101"])},{x:965,y:market.y+25},{x:leftX(market),y:market.y+25}], {x:940,y:140}, model, {bpd: 45000, density: 48, mmbtuBbl: 5.70, priceMMBtu: 12.20}),
    regionalStream("R-108", "Plant Direct Supply to Market", "liquid", [{x:rightX(byId["PLT-101"]),y:midY(byId["PLT-101"])},{x:970,y:midY(byId["PLT-101"])},{x:970,y:market.y+78},{x:leftX(market),y:market.y+78}], {x:900,y:485}, model, {bpd: 38000, density: 42, mmbtuBbl: 5.20, priceMMBtu: 13.10}),
    regionalStream("R-109", "Market to Consumers", "liquid", [{x:rightX(market),y:midY(market)},{x:leftX(byId["CONS-101"]),y:midY(byId["CONS-101"])}], {x:1190,y:230}, model, {bpd: 165000, density: 44, mmbtuBbl: 5.45, priceMMBtu: 14.00})
  ];

  // Energy is intentionally routed only to the Supply Hub, with no branches to other units.
  streams.push({
    id: "E-REG",
    name: "Energy to Supply Hub Only",
    type: "energy",
    utility: true,
    path: [{x:midX(byId["Q-REG"]),y:topY(byId["Q-REG"])},{x:midX(byId["Q-REG"]),y:515},{x:midX(hub),y:515},{x:midX(hub),y:botY(hub)}],
    label: {x:390,y:545},
    lines: [`Energy to hub only`, `${fmt(totalEnergyMMBtu(model),2)} MMBtu/h`],
    tooltip: `Energy stream routed only to HUB-101 Supply Hub\nDuty: ${fmt(totalEnergyMMBtu(model),2)} MMBtu/h\nPower equivalent: ${fmt(totalEnergyHp(model),1)} hp`
  });

  return { units, streams };
}

function buildDynamicPfdBaseBeforeAmineFinal(model) {
  if (model.selection.type === "objectLevel" && model.selection.key === "Regions") {
    return buildRegionsViewPfd(model);
  }
  return previousBuildDynamicPfdForRegions(model);
}

function drawEnergyTable(model) {
  if (model?.selection?.type === "objectLevel" && model?.selection?.key === "Regions") return;
  return previousDrawEnergyTableForRegions(model);
}

const previousStreamDataForTooltipRegions = streamDataForTooltipBaseBeforeRegions;
function streamDataForTooltipBaseBeforeAmineFinal(stream, model) {
  if (model?.selection?.type === "objectLevel" && model?.selection?.key === "Regions" && stream?.meta) {
    return {
      name: stream.name,
      gpm: stream.meta.gpm,
      bpd: stream.meta.bpd,
      lbHr: stream.meta.lbHr,
      temp: model.inputs?.temperature || 0,
      pressure: model.inputs?.pressure || 0,
      enthalpy: stream.meta.bpd * stream.meta.mmbtuBbl / 24,
      priceMMBtu: stream.meta.priceMMBtu,
      priceBbl: stream.meta.priceMMBtu * stream.meta.mmbtuBbl,
      mmbtuBbl: stream.meta.mmbtuBbl,
      mmbtuLb: stream.meta.mmbtuLb
    };
  }
  return previousStreamDataForTooltipRegions(stream, model);
}

const previousBuildStreamTooltipRegions = buildStreamTooltipBaseBeforeRegions;
function buildStreamTooltip(stream, model) {
  if (model?.selection?.type === "objectLevel" && model?.selection?.key === "Regions" && stream?.meta) {
    const d = streamDataForTooltip(stream, model);
    return [
      `Name: ${d.name}`,
      `Flow rate: ${fmt(d.bpd, 1)} bpd`,
      `Volumetric flow: ${fmt(d.gpm, 1)} gpm`,
      `Mass flow: ${fmt(d.lbHr, 0)} lb/hr`,
      `Energy value: ${money(d.priceMMBtu, 2)}/MMBtu`,
      `Energy content: ${fmt(d.mmbtuBbl, 3)} MMBtu/bbl`,
      `Energy content: ${fmt(d.mmbtuLb, 5)} MMBtu/lb`
    ].join("\n");
  }
  return previousBuildStreamTooltipRegions(stream, model);
}


/* ------------------------------------------------------------------
   Final toggle-control repair
   Ensures toolbar buttons continue to work after all dynamic view
   overrides.  Labels, Utilities, and Overlays are now applied in the
   final render path, including Streams, Units, Sites, and Regions.
------------------------------------------------------------------ */
function setToggleButtonState(buttonId, enabled, label) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.dataset.enabled = enabled ? "true" : "false";
  btn.textContent = `${label}: ${enabled ? "On" : "Off"}`;
  btn.classList.toggle("toggle-off", !enabled);
}

function updateToggleButtons() {
  setToggleButtonState("btnLabels", showLabels, "Labels");
  setToggleButtonState("btnUtilities", showUtilities, "Utilities");
  setToggleButtonState("btnOverlays", showOverlays, "Overlays");
}

function bindButtonClick(id, handler) {
  const oldButton = document.getElementById(id);
  if (!oldButton) return null;
  const newButton = oldButton.cloneNode(true);
  oldButton.parentNode.replaceChild(newButton, oldButton);
  newButton.addEventListener("click", handler);
  return newButton;
}

function initializeControls() {
  renderInputForm(getSelection());

  bindButtonClick("btnReset", () => {
    showLabels = true;
    showUtilities = true;
    showOverlays = true;
    renderInputForm(getSelection());
    render();
  });

  bindButtonClick("btnLabels", () => {
    showLabels = !showLabels;
    render();
  });

  bindButtonClick("btnUtilities", () => {
    showUtilities = !showUtilities;
    render();
  });

  bindButtonClick("btnOverlays", () => {
    showOverlays = !showOverlays;
    render();
  });

  bindButtonClick("btnClearBusinessView", () => {
    document.querySelectorAll('input[name="businessView"]').forEach(radio => { radio.checked = false; });
    render();
  });

  document.querySelectorAll('input[name="businessView"]').forEach(radio => {
    radio.addEventListener("change", render);
  });

  objectLevelSelect?.addEventListener("change", () => {
    if (objectLevelSelect.value) processAreaSelect.value = "";
    refreshSelectionInputs();
  });

  processAreaSelect?.addEventListener("change", () => {
    if (processAreaSelect.value) objectLevelSelect.value = "";
    refreshSelectionInputs();
  });

  updateToggleButtons();
}

function render() {
  if (!layers) return;
  const selection = getSelection();
  syncUnitOperationOverlay(selection);
  clearLayers();
  const model = computeModel();
  currentRenderModel = model;
  const pfd = buildDynamicPfd(model);

  if (activeViewName) {
    activeViewName.textContent = model.selection.type === "objectLevel" && model.selection.key === "Units"
      ? `Units - ${model.unitOperation}`
      : model.selection.config.title;
  }

  drawGrid();
  if (showLabels) drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);

  if (showOverlays) {
    drawOverlays(model);
    drawStreamInputTable(model);
    drawUnitInputTable(model);
    drawEnergyTable(model);
  }

  updateOutputTable(model);
  updateEconomicsTable(model);
  updateToggleButtons();
}

/* ------------------------------------------------------------------
   Amine process-area detailed view
   Basis: sour gas sweetening with MDEA absorption/regeneration loop.
   This override is applied only when processArea = Amine.
------------------------------------------------------------------ */
const previousRenderInputFormBeforeAmine = renderInputFormBaseBeforeAmine;
const previousComputeModelBeforeAmine = computeModelBaseBeforeAmine;
const previousBuildDynamicPfdBeforeAmine = buildDynamicPfdBaseBeforeAmineFinal;
const previousUpdateOutputTableBeforeAmine = updateOutputTableBaseBeforeAmine;
const previousUpdateEconomicsTableBeforeAmine = updateEconomicsTableBaseBeforeAmine;
const previousStreamDataForTooltipBeforeAmine = streamDataForTooltipBaseBeforeAmineFinal;
const previousBuildUnitTooltipBeforeAmine = buildUnitTooltipBaseBeforeAmine;

function isAmineSelection(selection = getSelection()) {
  return selection?.type === "processArea" && selection?.key === "Amine";
}

const amineInputFields = [
  { id: "sourGasMmscfd", label: "Sour gas feed", unit: "MMSCFD", value: 10, min: 0, step: 0.1 },
  { id: "h2sMolPct", label: "H₂S in sour gas", unit: "mol%", value: 2.0, min: 0, step: 0.1 },
  { id: "co2MolPct", label: "CO₂ in sour gas", unit: "mol%", value: 1.0, min: 0, step: 0.1 },
  { id: "gasTemperatureF", label: "Sour gas temperature", unit: "°F", value: 100, step: 1 },
  { id: "gasPressurePsig", label: "Absorber pressure", unit: "psig", value: 950, step: 5 },
  { id: "mdeaWtPct", label: "MDEA solution strength", unit: "wt%", value: 40, min: 1, max: 70, step: 1 },
  { id: "leanLoading", label: "Lean loading", unit: "mol/mol", value: 0.05, min: 0, step: 0.01 },
  { id: "richLoading", label: "Rich loading", unit: "mol/mol", value: 0.40, min: 0, step: 0.01 },
  { id: "circulationFactor", label: "Design circulation factor", unit: "× theoretical", value: 1.35, min: 1, step: 0.05 },
  { id: "solutionDensity", label: "Amine solution density", unit: "lb/gal", value: 8.75, min: 1, step: 0.05 },
  { id: "leanAmineTemperatureF", label: "Lean amine to absorber", unit: "°F", value: 110, step: 1 },
  { id: "richAmineTemperatureF", label: "Rich amine from absorber", unit: "°F", value: 125, step: 1 },
  { id: "stripperPressurePsig", label: "Regenerator pressure", unit: "psig", value: 15, step: 1 },
  { id: "acidGasRemovalPct", label: "Acid-gas removal", unit: "%", value: 99.0, min: 0, max: 100, step: 0.1 },
  { id: "reboilerDutyPerGal", label: "Reboiler duty factor", unit: "Btu/gal circulated", value: 950, min: 0, step: 25 },
  { id: "pumpDischargePsig", label: "Lean amine pump discharge", unit: "psig", value: 1000, step: 5 },
  { id: "powerCost", label: "Power cost", unit: "$/kWh", value: 0.075, min: 0, step: 0.005 },
  { id: "fuelCostMMBtu", label: "Reboiler fuel cost", unit: "$/MMBtu", value: 4.50, min: 0, step: 0.05 },
  { id: "solventMakeupCost", label: "Solvent makeup cost", unit: "$/day", value: 250, min: 0, step: 10 }
];

function renderInputForm(selection) {
  if (!isAmineSelection(selection)) {
    return previousRenderInputFormBeforeAmine(selection);
  }

  currentInputIds = amineInputFields.map(f => f.id);
  inputForm.innerHTML = `
    <h2>Amine Gas-Sweetening Inputs</h2>
    <p class="panel-note">Basis: sour gas + MDEA absorber/regenerator closed-loop solvent treating.</p>
    <div class="field-grid amine-field-grid">
      ${amineInputFields.map(f => `
        <label>${f.label}, ${f.unit}
          <input id="${f.id}" type="number" value="${f.value}" ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""} step="${f.step}">
        </label>
      `).join("")}
    </div>
  `;
  currentInputIds.forEach(id => document.getElementById(id)?.addEventListener("input", render));
}

function nLocal(id, fallback = 0) {
  const el = document.getElementById(id);
  return el ? Number(el.value || fallback) : Number(fallback || 0);
}

function computeAmineModel() {
  const selection = getSelection();
  const gasMmscfd = nLocal("sourGasMmscfd", 10);
  const h2sPct = nLocal("h2sMolPct", 2.0);
  const co2Pct = nLocal("co2MolPct", 1.0);
  const gasTemp = nLocal("gasTemperatureF", 100);
  const gasPressure = nLocal("gasPressurePsig", 950);
  const mdeaWt = nLocal("mdeaWtPct", 40);
  const leanLoading = nLocal("leanLoading", 0.05);
  const richLoading = nLocal("richLoading", 0.40);
  const circulationFactor = nLocal("circulationFactor", 1.35);
  const solutionDensityLbGal = nLocal("solutionDensity", 8.75);
  const leanTemp = nLocal("leanAmineTemperatureF", 110);
  const richTemp = nLocal("richAmineTemperatureF", 125);
  const stripperPressure = nLocal("stripperPressurePsig", 15);
  const removalPct = nLocal("acidGasRemovalPct", 99.0);
  const reboilerDutyPerGal = nLocal("reboilerDutyPerGal", 950);
  const pumpDischarge = nLocal("pumpDischargePsig", 1000);
  const powerCost = nLocal("powerCost", 0.075);
  const fuelCost = nLocal("fuelCostMMBtu", 4.50);
  const solventMakeupCost = nLocal("solventMakeupCost", 250);

  const gasLbmolDay = gasMmscfd * 1_000_000 / 379.5;
  const h2sLbmolDay = gasLbmolDay * h2sPct / 100;
  const co2LbmolDay = gasLbmolDay * co2Pct / 100;
  const acidGasLbmolDay = h2sLbmolDay + co2LbmolDay;
  const removedAcidGasLbmolDay = acidGasLbmolDay * removalPct / 100;
  const workingCapacity = Math.max(richLoading - leanLoading, 0.0001);
  const mdeaLbmolDay = removedAcidGasLbmolDay / workingCapacity;
  const pureMdeaLbDay = mdeaLbmolDay * 119.16;
  const solutionLbDayTheoretical = pureMdeaLbDay / Math.max(mdeaWt / 100, 0.0001);
  const theoreticalGalDay = solutionLbDayTheoretical / solutionDensityLbGal;
  const theoreticalGph = theoreticalGalDay / 24;
  const designGph = theoreticalGph * circulationFactor;
  const designGpm = designGph / 60;
  const solutionLbHr = designGph * solutionDensityLbGal;
  const treatedGasMmscfd = gasMmscfd * (1 - removedAcidGasLbmolDay / Math.max(gasLbmolDay, 1));
  const acidGasLbmolHr = removedAcidGasLbmolDay / 24;
  const acidGasLbHr = (h2sLbmolDay * 34.08 + co2LbmolDay * 44.01) * removalPct / 100 / 24;
  const sweetGasPressure = Math.max(gasPressure - 10, 0);
  const richAminePressure = Math.max(gasPressure - 15, 0);
  const flashDrumPressure = 65;
  const exchangerRichOutF = 205;
  const regeneratorBottomF = 245;
  const leanCoolerOutF = leanTemp;
  const reboilerDutyMMBtuHr = designGph * reboilerDutyPerGal / 1_000_000;
  const exchangerDutyMMBtuHr = solutionLbHr * 0.82 * Math.max(exchangerRichOutF - richTemp, 0) / 1_000_000;
  const coolerDutyMMBtuHr = solutionLbHr * 0.82 * Math.max(regeneratorBottomF - leanCoolerOutF, 0) / 1_000_000;
  const pumpDeltaP = Math.max(pumpDischarge - 65, 0);
  const pumpHp = designGpm * pumpDeltaP / (1714 * 0.70);
  const fuelCostHr = reboilerDutyMMBtuHr * fuelCost;
  const powerCostHr = pumpHp * 0.746 * powerCost;
  const operatingCostHr = fuelCostHr + powerCostHr + solventMakeupCost / 24;
  const acidGasRemovalLbHr = acidGasLbHr;

  return {
    selection,
    isAmine: true,
    inputs: {
      feedFlowGpm: gasMmscfd * 694.4,
      massFlowLbHr: gasMmscfd * 1_000_000 / 24 * 0.045,
      density: 3.2,
      viscosity: 0.012,
      temperature: gasTemp,
      pressure: gasPressure,
      priceLb: 0,
      priceGal: 0,
      priceMMBtu: fuelCost,
      gasMmscfd, h2sPct, co2Pct, mdeaWt, leanLoading, richLoading, circulationFactor,
      solutionDensityLbGal, leanTemp, richTemp, stripperPressure, removalPct, reboilerDutyPerGal,
      pumpDischarge, powerCost, fuelCost, solventMakeupCost
    },
    product: {
      flowGpm: treatedGasMmscfd * 694.4,
      massFlowLbHr: treatedGasMmscfd * 1_000_000 / 24 * 0.043,
      density: 3.0,
      viscosity: 0.011,
      temperature: gasTemp + 5,
      pressure: sweetGasPressure,
      priceLb: 0,
      priceGal: 0,
      priceMMBtu: 3.75
    },
    amine: {
      gasLbmolDay, h2sLbmolDay, co2LbmolDay, acidGasLbmolDay, removedAcidGasLbmolDay,
      workingCapacity, mdeaLbmolDay, pureMdeaLbDay, solutionLbDayTheoretical,
      theoreticalGalDay, theoreticalGph, designGph, designGpm, solutionLbHr,
      treatedGasMmscfd, acidGasLbmolHr, acidGasLbHr, acidGasRemovalLbHr,
      richAminePressure, flashDrumPressure, exchangerRichOutF, regeneratorBottomF,
      leanCoolerOutF, reboilerDutyMMBtuHr, exchangerDutyMMBtuHr, coolerDutyMMBtuHr,
      pumpDeltaP, pumpHp, fuelCostHr, powerCostHr, operatingCostHr
    },
    dutyMMBtuHr: reboilerDutyMMBtuHr,
    hydraulicHp: pumpHp,
    vaporFlowLbHr: acidGasLbHr,
    liquidFlowLbHr: solutionLbHr,
    economics: {
      feedInputCost: 0,
      energyInputCost: fuelCostHr + powerCostHr,
      operatingCost: operatingCostHr,
      productRevenue: 0,
      spreadLb: 0,
      spreadGal: 0,
      spreadMMBtu: 0,
      netMargin: -operatingCostHr
    }
  };
}

function computeModel() {
  if (isAmineSelection()) return computeAmineModel();
  return previousComputeModelBeforeAmine();
}

function amineStreamMeta(model, { name, gpm = 0, lbHr = 0, temp = 100, pressure = 0, cp = 0.62 }) {
  return {
    name,
    gpm,
    bpd: gpmToBpd(gpm),
    lbHr,
    temp,
    pressure,
    enthalpy: streamEnthalpyMMBtuHr(lbHr, temp, 60, cp),
    priceMMBtu: model.inputs.fuelCost || model.inputs.priceMMBtu || 0,
    priceBbl: 0
  };
}

function streamFromMeta(id, name, type, path, label, lines, meta, utility = false) {
  return { id, name, type, utility, path, label, lines, meta };
}

function buildAminePfd(model) {
  const a = model.amine;
  const units = [
    { id: "V-101", name: "Inlet Separator", type: "separator", x: 55, y: 355, width: 150, height: 100 },
    { id: "T-101", name: "Amine Absorber", type: "column", x: 300, y: 225, width: 150, height: 230 },
    { id: "LV-101", name: "LCV", type: "valve", x: 500, y: 505, width: 80, height: 70 },
    { id: "V-102", name: "Rich Amine Flash Drum", type: "separator", x: 635, y: 505, width: 165, height: 105 },
    { id: "F-101", name: "Rich Amine Filters", type: "box", x: 825, y: 520, width: 150, height: 75 },
    { id: "E-101", name: "Rich/Lean Exchanger", type: "exchanger", x: 1005, y: 500, width: 185, height: 110 },
    { id: "T-102", name: "Amine Regenerator", type: "column", x: 850, y: 185, width: 155, height: 230 },
    { id: "E-102", name: "Overhead Condenser", type: "exchanger", x: 1085, y: 85, width: 175, height: 90 },
    { id: "V-103", name: "Reflux Drum", type: "separator", x: 1095, y: 230, width: 165, height: 95 },
    { id: "E-103", name: "Lean Amine Cooler", type: "exchanger", x: 565, y: 90, width: 185, height: 90 },
    { id: "V-104", name: "Lean Amine Surge Drum", type: "tank", x: 75, y: 80, width: 165, height: 100 },
    { id: "P-101A/B", name: "Lean Amine Pumps", type: "pump", x: 75, y: 205, width: 165, height: 120 },
    { id: "H-101", name: "Regenerator Reboiler", type: "furnace", x: 1030, y: 645, width: 170, height: 140 }
  ];
  const u = Object.fromEntries(units.map(x => [x.id, x]));
  const cx = x => x.x + x.width / 2;
  const cy = x => unitConnectionY(x);
  const lx = x => x.x;
  const rx = x => x.x + x.width;

  const absorberBottomFeedY = u["T-101"].y + u["T-101"].height - 35;
  const richBottomY = u["T-101"].y + u["T-101"].height + 68;
  const lvCenterY = cy(u["LV-101"]);
  const v102CenterY = cy(u["V-102"]);
  const e101CenterY = cy(u["E-101"]);
  const t102FeedY = u["T-102"].y + 72;
  const t102TopY = u["T-102"].y + 18;
  const t102BottomOutletY = u["T-102"].y + u["T-102"].height + 40;
  const e102CenterY = cy(u["E-102"]);
  const v103CenterY = cy(u["V-103"]);
  const e103CenterY = cy(u["E-103"]);
  const v104CenterY = cy(u["V-104"]);
  const p101CenterY = cy(u["P-101A/B"]);

  const streams = [];

  // Sour gas enters V-101 from the top and the conditioned vapor leaves V-101 aligned with
  // the T-101 bottom-stage sour-gas feed inlet.
  streams.push(streamFromMeta("S-101", "Sour Gas Feed", "vapor", [
    {x:cx(u["V-101"]),y:300},
    {x:cx(u["V-101"]),y:u["V-101"].y}
  ], {x:55,y:288}, [`${fmt(model.inputs.gasMmscfd,1)} MMSCFD`, `${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure,0)} psig`], amineStreamMeta(model,{name:"Sour Gas Feed",gpm:model.inputs.feedFlowGpm,lbHr:model.inputs.massFlowLbHr,temp:model.inputs.temperature,pressure:model.inputs.pressure,cp:0.52})));
  streams.push(streamFromMeta("S-102", "Conditioned Sour Gas", "vapor", [
    {x:cx(u["V-101"]),y:u["V-101"].y},
    {x:cx(u["V-101"]),y:absorberBottomFeedY},
    {x:lx(u["T-101"])+35,y:absorberBottomFeedY}
  ], {x:175,y:405}, [`${fmt(model.inputs.gasMmscfd,1)} MMSCFD`, `${fmt(model.inputs.temperature,0)} °F | ${fmt(model.inputs.pressure-3,0)} psig`], amineStreamMeta(model,{name:"Conditioned Sour Gas",gpm:model.inputs.feedFlowGpm,lbHr:model.inputs.massFlowLbHr,temp:model.inputs.temperature,pressure:model.inputs.pressure-3,cp:0.52})));
  streams.push(streamFromMeta("S-103", "Sweet Gas Product", "vapor", [
    {x:cx(u["T-101"]),y:u["T-101"].y-20},
    {x:cx(u["T-101"]),y:55},
    {x:1280,y:55}
  ], {x:1010,y:25}, [`${fmt(a.treatedGasMmscfd,2)} MMSCFD`, `${fmt(model.product.temperature,0)} °F | ${fmt(model.product.pressure,0)} psig`], amineStreamMeta(model,{name:"Sweet Gas Product",gpm:model.product.flowGpm,lbHr:model.product.massFlowLbHr,temp:model.product.temperature,pressure:model.product.pressure,cp:0.52})));

  // Rich amine pressure letdown and flash: T-101 bottom outlet -> LV-101 -> V-102, all aligned.
  streams.push(streamFromMeta("S-104", "Rich Amine to LV-101", "liquid", [
    {x:cx(u["T-101"]),y:u["T-101"].y+u["T-101"].height+36},
    {x:cx(u["T-101"]),y:lvCenterY},
    {x:lx(u["LV-101"]),y:lvCenterY}
  ], {x:365,y:525}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.richTemp,0)} °F | ${fmt(a.richAminePressure,0)} psig`], amineStreamMeta(model,{name:"Rich Amine to LV-101",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.richTemp,pressure:a.richAminePressure,cp:0.82})));
  streams.push(streamFromMeta("S-105", "Flashed Rich Amine", "liquid", [
    {x:rx(u["LV-101"]),y:lvCenterY},
    {x:lx(u["V-102"]),y:lvCenterY}
  ], {x:550,y:540}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.richTemp,0)} °F | ${fmt(a.flashDrumPressure,0)} psig`], amineStreamMeta(model,{name:"Flashed Rich Amine",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.richTemp,pressure:a.flashDrumPressure,cp:0.82})));
  streams.push(streamFromMeta("S-106", "Flash Vapor to Fuel/Flare", "vapor", [
    {x:cx(u["V-102"]),y:u["V-102"].y},
    {x:cx(u["V-102"]),y:455},
    {x:830,y:455}
  ], {x:690,y:425}, [`${fmt(a.acidGasLbHr*0.06,0)} lb/hr`, `${fmt(model.inputs.richTemp,0)} °F | ${fmt(a.flashDrumPressure,0)} psig`], amineStreamMeta(model,{name:"Flash Vapor to Fuel/Flare",gpm:0,lbHr:a.acidGasLbHr*0.06,temp:model.inputs.richTemp,pressure:a.flashDrumPressure,cp:0.52})));

  // V-102 liquid outlet -> E-101 inlet, then E-101 outlet aligned with the T-102/V-103 feed corridor.
  streams.push(streamFromMeta("S-107", "Rich Amine Liquid to E-101", "liquid", [
    {x:rx(u["V-102"]),y:v102CenterY},
    {x:lx(u["F-101"]),y:v102CenterY},
    {x:rx(u["F-101"]),y:v102CenterY},
    {x:lx(u["E-101"]),y:e101CenterY}
  ], {x:810,y:585}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.richTemp,0)} °F | ${fmt(a.flashDrumPressure-3,0)} psig`], amineStreamMeta(model,{name:"Rich Amine Liquid to E-101",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.richTemp,pressure:a.flashDrumPressure-3,cp:0.82})));
  streams.push(streamFromMeta("S-108", "Preheated Rich Amine to T-102", "liquid", [
    {x:rx(u["E-101"]),y:e101CenterY},
    {x:1275,y:e101CenterY},
    {x:1275,y:t102FeedY},
    {x:rx(u["T-102"])-25,y:t102FeedY}
  ], {x:1185,y:440}, [`${fmt(a.designGph,0)} gph`, `${fmt(a.exchangerRichOutF,0)} °F | ${fmt(a.flashDrumPressure-8,0)} psig`], amineStreamMeta(model,{name:"Preheated Rich Amine to Regenerator",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:a.exchangerRichOutF,pressure:a.flashDrumPressure-8,cp:0.82})));

  // Regenerator overhead vapor -> E-102 inlet. E-102 outlet -> V-103 inlet.
  streams.push(streamFromMeta("S-109", "T-102 Overhead Vapor", "vapor", [
    {x:cx(u["T-102"]),y:u["T-102"].y-18},
    {x:cx(u["T-102"]),y:e102CenterY},
    {x:lx(u["E-102"]),y:e102CenterY}
  ], {x:930,y:95}, [`${fmt(a.acidGasLbHr,0)} lb/hr`, `${fmt(a.acidGasLbmolHr,1)} lbmol/hr`], amineStreamMeta(model,{name:"T-102 Overhead Vapor",gpm:0,lbHr:a.acidGasLbHr,temp:210,pressure:model.inputs.stripperPressure,cp:0.50})));
  streams.push(streamFromMeta("S-110", "Condenser Outlet to V-103", "liquid", [
    {x:rx(u["E-102"]),y:e102CenterY},
    {x:1300,y:e102CenterY},
    {x:1300,y:v103CenterY},
    {x:rx(u["V-103"]),y:v103CenterY}
  ], {x:1195,y:168}, [`Water reflux + acid gas`, `${fmt(model.inputs.stripperPressure,0)} psig`], amineStreamMeta(model,{name:"Condenser Outlet to V-103",gpm:a.designGpm*0.04,lbHr:a.solutionLbHr*0.04,temp:120,pressure:model.inputs.stripperPressure,cp:1.0})));
  streams.push(streamFromMeta("S-110A", "Acid Gas to Sulfur/CO₂ Recovery", "vapor", [
    {x:cx(u["V-103"]),y:u["V-103"].y},
    {x:cx(u["V-103"]),y:205},
    {x:1325,y:205}
  ], {x:1195,y:196}, [`${fmt(a.acidGasLbHr,0)} lb/hr`, `H₂S + CO₂`], amineStreamMeta(model,{name:"Acid Gas to Sulfur/CO₂ Recovery",gpm:0,lbHr:a.acidGasLbHr,temp:110,pressure:model.inputs.stripperPressure,cp:0.50})));
  streams.push(streamFromMeta("S-110B", "Reflux Return to T-102", "liquid", [
    {x:lx(u["V-103"]),y:v103CenterY},
    {x:1035,y:v103CenterY},
    {x:1035,y:t102TopY},
    {x:rx(u["T-102"])-20,y:t102TopY}
  ], {x:1000,y:250}, [`Reflux water`, `${fmt(model.inputs.stripperPressure,0)} psig`], amineStreamMeta(model,{name:"Reflux Return to T-102 Top",gpm:a.designGpm*0.025,lbHr:a.solutionLbHr*0.025,temp:115,pressure:model.inputs.stripperPressure,cp:1.0})));

  // Hot lean amine from T-102 bottom enters E-101 tube side, then flows to E-103 and V-104.
  streams.push(streamFromMeta("S-111", "Hot Lean Amine to E-101", "liquid", [
    {x:cx(u["T-102"]),y:t102BottomOutletY},
    {x:cx(u["T-102"]),y:e101CenterY+34},
    {x:rx(u["E-101"]),y:e101CenterY+34}
  ], {x:915,y:635}, [`${fmt(a.designGph,0)} gph`, `${fmt(a.regeneratorBottomF,0)} °F | ${fmt(model.inputs.stripperPressure,0)} psig`], amineStreamMeta(model,{name:"Hot Lean Amine to E-101",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:a.regeneratorBottomF,pressure:model.inputs.stripperPressure,cp:0.82})));
  streams.push(streamFromMeta("S-112", "Lean Amine E-101 Outlet to E-103", "liquid", [
    {x:lx(u["E-101"]),y:e101CenterY+34},
    {x:650,y:e101CenterY+34},
    {x:650,y:e103CenterY},
    {x:rx(u["E-103"]),y:e103CenterY}
  ], {x:630,y:365}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.leanTemp+35,0)} °F | ${fmt(model.inputs.stripperPressure-5,0)} psig`], amineStreamMeta(model,{name:"Lean Amine E-101 Outlet to Cooler",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.leanTemp+35,pressure:model.inputs.stripperPressure-5,cp:0.82})));
  streams.push(streamFromMeta("S-113", "Cooled Lean Amine to V-104", "liquid", [
    {x:lx(u["E-103"]),y:e103CenterY},
    {x:rx(u["V-104"]),y:v104CenterY}
  ], {x:315,y:100}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.leanTemp,0)} °F | ${fmt(model.inputs.pumpDischarge,0)} psig`], amineStreamMeta(model,{name:"Cooled Lean Amine to V-104",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.leanTemp,pressure:model.inputs.pumpDischarge,cp:0.82})));
  streams.push(streamFromMeta("S-114", "V-104 Liquid to P-101 A/B", "liquid", [
    {x:cx(u["V-104"]),y:u["V-104"].y+u["V-104"].height},
    {x:cx(u["V-104"]),y:u["P-101A/B"].y}
  ], {x:160,y:184}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.leanTemp,0)} °F`], amineStreamMeta(model,{name:"V-104 Liquid to Pumps",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.leanTemp,pressure:model.inputs.pumpSuction,cp:0.82})));
  streams.push(streamFromMeta("S-115", "Lean Amine to Absorber", "liquid", [
    {x:rx(u["P-101A/B"]),y:p101CenterY},
    {x:270,y:p101CenterY},
    {x:270,y:u["T-101"].y+35},
    {x:lx(u["T-101"])+35,y:u["T-101"].y+35}
  ], {x:238,y:185}, [`${fmt(a.designGph,0)} gph`, `${fmt(model.inputs.leanTemp,0)} °F | ${fmt(model.inputs.pumpDischarge,0)} psig`], amineStreamMeta(model,{name:"Lean Amine to Absorber",gpm:a.designGpm,lbHr:a.solutionLbHr,temp:model.inputs.leanTemp,pressure:model.inputs.pumpDischarge,cp:0.82})));

  streams.push(streamFromMeta("Q-101", "Reboiler Duty", "energy", [
    {x:1115,y:630},
    {x:1115,y:u["H-101"].y}
  ], {x:1135,y:600}, [`${fmt(a.reboilerDutyMMBtuHr,2)} MMBtu/hr`, `${fmt(a.reboilerDutyMMBtuHr*393.014,0)} hp equiv.`], amineStreamMeta(model,{name:"Reboiler Duty",gpm:0,lbHr:0,temp:0,pressure:0,cp:0}), true));
  streams.push(streamFromMeta("Q-102", "Lean Cooler Duty", "energy", [
    {x:650,y:230},
    {x:650,y:u["E-103"].y+u["E-103"].height}
  ], {x:735,y:200}, [`${fmt(a.coolerDutyMMBtuHr,2)} MMBtu/hr`, `Cooling duty`], amineStreamMeta(model,{name:"Lean Cooler Duty",gpm:0,lbHr:0,temp:0,pressure:0,cp:0}), true));

  return { units, streams };
}

function buildDynamicPfd(model) {
  if (model?.isAmine || isAmineSelection(model?.selection)) return buildAminePfd(model);
  return previousBuildDynamicPfdBeforeAmine(model);
}

function streamDataForTooltip(stream, model) {
  if ((model?.isAmine || isAmineSelection(model?.selection)) && stream?.meta) {
    return stream.meta;
  }
  return previousStreamDataForTooltipBeforeAmine(stream, model);
}

function buildUnitTooltip(unit, model) {
  if (!(model?.isAmine || isAmineSelection(model?.selection))) return previousBuildUnitTooltipBeforeAmine(unit, model);
  const a = model.amine;
  const rows = [
    `Tag name: ${unit.id}`,
    `Service: ${unit.name}`,
    `Amine circulation: ${fmt(a.designGpm,1)} gpm / ${fmt(a.solutionLbHr,0)} lb/hr`,
    `Acid gas removed: ${fmt(a.removedAcidGasLbmolDay,1)} lbmol/day`,
    `Reboiler duty: ${fmt(a.reboilerDutyMMBtuHr,2)} MMBtu/hr`,
    `Pump power: ${fmt(a.pumpHp,1)} hp`
  ];
  if (/P-101/.test(unit.id)) rows.push(`Pressure change: ${fmt(a.pumpDeltaP,1)} psig`, `Head change: ${fmt(pressureHeadFt(a.pumpDeltaP, a.solutionDensityLbGal / 0.133681),0)} ft`);
  if (/E-101/.test(unit.id)) rows.push(`Temperature change: ${fmt(a.exchangerRichOutF - model.inputs.richTemp,1)} °F`, `Duty: ${fmt(a.exchangerDutyMMBtuHr,2)} MMBtu/hr`);
  if (/E-103/.test(unit.id)) rows.push(`Temperature change: ${fmt(a.regeneratorBottomF - model.inputs.leanTemp,1)} °F`, `Duty: ${fmt(a.coolerDutyMMBtuHr,2)} MMBtu/hr`);
  if (/H-101/.test(unit.id)) rows.push(`Duty: ${fmt(a.reboilerDutyMMBtuHr,2)} MMBtu/hr`);
  if (/T-101/.test(unit.id)) rows.push(`Feed gas: ${fmt(model.inputs.gasMmscfd,1)} MMSCFD`, `Sweet gas: ${fmt(a.treatedGasMmscfd,2)} MMSCFD`, `T/P: ${fmt(model.inputs.temperature,0)} °F / ${fmt(model.inputs.pressure,0)} psig`);
  if (/T-102/.test(unit.id)) rows.push(`Rich amine feed: ${fmt(a.designGpm,1)} gpm / ${fmt(a.solutionLbHr,0)} lb/hr`, `Acid gas overhead: ${fmt(a.acidGasLbHr,0)} lb/hr`, `Regenerator pressure: ${fmt(model.inputs.stripperPressure,0)} psig`);
  if (/V-101|V-102|V-103/.test(unit.id)) rows.push(`Vapor flow: ${fmt(a.acidGasLbHr,0)} lb/hr`, `Liquid flow: ${fmt(a.solutionLbHr,0)} lb/hr`);
  return rows.join("\n");
}

function drawAmineSvgSummary(model) {
  if (!(model?.isAmine || isAmineSelection(model?.selection))) return;
  const a = model.amine;
  const g = svgEl("g", { class: "amine-svg-summary" });
  g.appendChild(svgEl("rect", { x: 25, y: 645, width: 430, height: 175, rx: 10, class: "overlay-box" }));
  addText(g, "Amine Design Basis", 45, 672, "overlay-title");
  addMultilineText(g, [
    `Sour gas: ${fmt(model.inputs.gasMmscfd,1)} MMSCFD | H₂S ${fmt(model.inputs.h2sPct,1)} mol% | CO₂ ${fmt(model.inputs.co2Pct,1)} mol%`,
    `Total acid gas load: ${fmt(a.acidGasLbmolDay,1)} lbmol/day`,
    `MDEA working capacity: ${fmt(a.workingCapacity,2)} mol acid/mol amine`,
    `Theoretical circulation: ${fmt(a.theoreticalGph,0)} gph`,
    `Design circulation: ${fmt(a.designGph,0)} gph (${fmt(a.designGpm,1)} gpm)`,
    `Reboiler duty: ${fmt(a.reboilerDutyMMBtuHr,2)} MMBtu/hr | Pump: ${fmt(a.pumpHp,1)} hp`
  ], 45, 698, "overlay-text", 18);
  layers.overlays.appendChild(g);
}

function updateOutputTable(model) {
  if (!(model?.isAmine || isAmineSelection(model?.selection))) return previousUpdateOutputTableBeforeAmine(model);
  if (outputTitle) outputTitle.textContent = "Amine Sweetening Calculated Outputs";
  const a = model.amine;
  const rows = [
    ["Sour gas feed", `${fmt(model.inputs.gasMmscfd,2)} MMSCFD`],
    ["H₂S load", `${fmt(a.h2sLbmolDay,1)} lbmol/day`],
    ["CO₂ load", `${fmt(a.co2LbmolDay,1)} lbmol/day`],
    ["Total acid gas load", `${fmt(a.acidGasLbmolDay,1)} lbmol/day`],
    ["Acid gas removed", `${fmt(a.removedAcidGasLbmolDay,1)} lbmol/day`],
    ["Working capacity", `${fmt(a.workingCapacity,2)} mol/mol`],
    ["Pure MDEA required", `${fmt(a.pureMdeaLbDay,0)} lb/day`],
    ["40 wt% solution circulation, theoretical", `${fmt(a.theoreticalGph,0)} gph`],
    ["Design amine circulation", `${fmt(a.designGph,0)} gph / ${fmt(a.designGpm,1)} gpm`],
    ["Amine mass circulation", `${fmt(a.solutionLbHr,0)} lb/hr`],
    ["Sweet gas product", `${fmt(a.treatedGasMmscfd,2)} MMSCFD`],
    ["Rich/lean exchanger duty", `${fmt(a.exchangerDutyMMBtuHr,2)} MMBtu/hr`],
    ["Regenerator reboiler duty", `${fmt(a.reboilerDutyMMBtuHr,2)} MMBtu/hr`],
    ["Lean cooler duty", `${fmt(a.coolerDutyMMBtuHr,2)} MMBtu/hr`],
    ["Lean amine pump power", `${fmt(a.pumpHp,1)} hp`]
  ];
  if (outputTable) outputTable.innerHTML = rows.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  if (activeViewName) activeViewName.textContent = "Amine Gas Sweetening - Absorption and Regeneration";
}

function updateEconomicsTable(model) {
  if (!(model?.isAmine || isAmineSelection(model?.selection))) return previousUpdateEconomicsTableBeforeAmine(model);
  const a = model.amine;
  const rows = [
    ["Reboiler fuel cost", `${money(a.fuelCostHr,2)}/hr`],
    ["Lean amine pump power cost", `${money(a.powerCostHr,2)}/hr`],
    ["Solvent makeup allowance", `${money(model.inputs.solventMakeupCost/24,2)}/hr`],
    ["Total operating cost", `${money(a.operatingCostHr,2)}/hr`],
    ["Operating cost per MMSCFD sour gas", `${money(a.operatingCostHr / Math.max(model.inputs.gasMmscfd,0.001),2)}/hr per MMSCFD`],
    ["Acid gas removal cost", `${money(a.operatingCostHr / Math.max(a.removedAcidGasLbmolDay/24,0.001),2)}/lbmol removed`]
  ];
  const table = ensureEconomicsTable();
  if (table) table.innerHTML = rows.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
}

const previousRenderBeforeAmine = renderBaseBeforeAmine;
function render() {
  if (!layers || !isAmineSelection()) return previousRenderBeforeAmine();
  const selection = getSelection();
  clearLayers();
  const model = computeModel();
  currentRenderModel = model;
  const pfd = buildDynamicPfd(model);
  if (activeViewName) activeViewName.textContent = "Amine Gas Sweetening - Absorption and Regeneration";
  drawGrid();
  if (showLabels) drawViewTitle(model);
  pfd.streams.forEach(drawStream);
  pfd.units.forEach(unit => drawUnit(unit, model));
  pfd.streams.forEach(drawStreamLabel);
  if (showOverlays) {
    drawOverlays(model);
    drawAmineSvgSummary(model);
  }
  updateOutputTable(model);
  updateEconomicsTable(model);
  updateToggleButtons();
}

/* ------------------------------------------------------------------
   Amine detailed routing update override
   - V-101 relocated to bottom-left and drawn as vertical vessel
   - Sour gas enters V-101 from top; liquids drain from bottom
   - V-104 above P-101A/B; P-101A/B suction from V-104
   - New shell-and-tube E-101 with shell-side rich amine and tube-side lean amine
   - V-102 flash gas/liquid routing; T-102 overhead condenser/reflux drum routing
------------------------------------------------------------------ */
function buildAminePfd(model) {
  const a = model.amine;
  const units = [
    { id: "V-101", name: "Inlet Separator", type: "vessel", x: 55, y: 548, width: 150, height: 120 },
    { id: "P-101A/B", name: "Lean Amine Pumps", type: "pump", x: 85, y: 305, width: 165, height: 120 },
    { id: "V-104", name: "Lean Amine Surge Drum", type: "vessel", x: 85, y: 120, width: 165, height: 120 },
    { id: "T-101", name: "Amine Absorber", type: "column", x: 410, y: 395, width: 150, height: 250 },
    { id: "LV-101", name: "Rich Amine LCV", type: "valve", x: 610, y: 635, width: 90, height: 75 },
    { id: "V-102", name: "Rich Amine Flash Drum", type: "separator", x: 760, y: 633, width: 180, height: 120 },
    { id: "E-101", name: "Shell & Tube Rich/Lean Exchanger", type: "exchanger", x: 985, y: 635, width: 190, height: 115 },
    { id: "T-102", name: "Amine Regenerator", type: "column", x: 1120, y: 305, width: 155, height: 245 },
    { id: "E-102", name: "Overhead Condenser", type: "exchanger", x: 1015, y: 95, width: 185, height: 90 },
    { id: "V-103", name: "Reflux Drum", type: "separator", x: 1210, y: 185, width: 175, height: 110 },
    { id: "E-103", name: "Lean Amine Cooler", type: "exchanger", x: 430, y: 120, width: 190, height: 100 },
    { id: "H-101", name: "Regenerator Reboiler", type: "furnace", x: 1210, y: 600, width: 165, height: 130 },
    { id: "SRU-101", name: "Sulfur & CO₂ Recovery", type: "box", x: 1265, y: 60, width: 115, height: 90 }
  ];

  const u = Object.fromEntries(units.map(unit => [unit.id, unit]));
  const cx = unit => unit.x + unit.width / 2;
  const midY = unit => unitConnectionY(unit);
  const lx = unit => unit.x;
  const rx = unit => unit.x + unit.width;
  const top = unit => unit.y;
  const bottom = unit => unit.y + unit.height;
  const streams = [];
  const t101SourGasY = u["T-101"].y + 207;
  const richAmineY = midY(u["LV-101"]);
  const e103InletY = midY(u["E-103"]);

  streams.push(streamFromMeta(
    "S-101", "Sour Gas Feed", "vapor",
    [{ x: cx(u["V-101"]), y: top(u["V-101"]) - 80 }, { x: cx(u["V-101"]), y: top(u["V-101"]) }],
    { x: 52, y: 430 },
    [`${fmt(model.inputs.gasMmscfd, 1)} MMSCFD`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure, 0)} psig`],
    amineStreamMeta(model, { name: "Sour Gas Feed", gpm: model.inputs.feedFlowGpm, lbHr: model.inputs.massFlowLbHr, temp: model.inputs.temperature, pressure: model.inputs.pressure, cp: 0.52 })
  ));

  streams.push(streamFromMeta(
    "S-102", "Separated Liquids", "liquid",
    [{ x: cx(u["V-101"]), y: bottom(u["V-101"]) }, { x: cx(u["V-101"]), y: 770 }, { x: 235, y: 770 }],
    { x: 70, y: 780 },
    [`${fmt(model.inputs.massFlowLbHr * 0.015, 0)} lb/hr`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure - 2, 0)} psig`],
    amineStreamMeta(model, { name: "Inlet Separator Liquid", gpm: model.inputs.feedFlowGpm * 0.015, lbHr: model.inputs.massFlowLbHr * 0.015, temp: model.inputs.temperature, pressure: model.inputs.pressure - 2, cp: 0.65 })
  ));

  streams.push(streamFromMeta(
    "S-103", "Conditioned Sour Gas", "vapor",
    [{ x: rx(u["V-101"]), y: t101SourGasY }, { x: lx(u["T-101"]) + 38, y: t101SourGasY }],
    { x: 245, y: 455 },
    [`${fmt(model.inputs.gasMmscfd, 1)} MMSCFD`, `${fmt(model.inputs.temperature, 0)} °F | ${fmt(model.inputs.pressure - 3, 0)} psig`],
    amineStreamMeta(model, { name: "Conditioned Sour Gas", gpm: model.inputs.feedFlowGpm, lbHr: model.inputs.massFlowLbHr, temp: model.inputs.temperature, pressure: model.inputs.pressure - 3, cp: 0.52 })
  ));

  streams.push(streamFromMeta(
    "S-104", "Sweet Gas Product", "vapor",
    [{ x: cx(u["T-101"]), y: u["T-101"].y - 18 }, { x: cx(u["T-101"]), y: 80 }, { x: 900, y: 80 }],
    { x: 610, y: 25 },
    [`${fmt(a.treatedGasMmscfd, 2)} MMSCFD`, `${fmt(model.product.temperature, 0)} °F | ${fmt(model.product.pressure, 0)} psig`],
    amineStreamMeta(model, { name: "Sweet Gas Product", gpm: model.product.flowGpm, lbHr: model.product.massFlowLbHr, temp: model.product.temperature, pressure: model.product.pressure, cp: 0.52 })
  ));

  streams.push(streamFromMeta(
    "S-105", "Rich Amine to LV-101", "liquid",
    [{ x: cx(u["T-101"]), y: bottom(u["T-101"]) }, { x: cx(u["T-101"]), y: richAmineY }, { x: lx(u["LV-101"]), y: richAmineY }],
    { x: 455, y: 665 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.richAminePressure, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine to LV-101", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.richAminePressure, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-106", "LV-101 Outlet to V-102", "liquid",
    [{ x: rx(u["LV-101"]), y: richAmineY }, { x: lx(u["V-102"]), y: richAmineY }],
    { x: 680, y: 665 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.flashDrumPressure, 0)} psig`],
    amineStreamMeta(model, { name: "LV-101 Outlet to V-102", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.flashDrumPressure, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-107", "Flash Gas to Fuel/Flare", "vapor",
    [{ x: cx(u["V-102"]), y: top(u["V-102"]) }, { x: cx(u["V-102"]), y: top(u["V-102"]) - 55 }, { x: 940, y: top(u["V-102"]) - 55 }],
    { x: 780, y: 515 },
    [`${fmt(a.acidGasLbHr * 0.06, 0)} lb/hr`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.flashDrumPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Flash Gas to Fuel/Flare", gpm: 0, lbHr: a.acidGasLbHr * 0.06, temp: model.inputs.richTemp, pressure: a.flashDrumPressure, cp: 0.52 })
  ));

  streams.push(streamFromMeta(
    "S-108", "Rich Amine Shell Side Inlet", "liquid",
    [{ x: rx(u["V-102"]), y: richAmineY }, { x: lx(u["E-101"]), y: richAmineY }],
    { x: 915, y: 665 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.flashDrumPressure - 3, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine to E-101 Shell Side", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.flashDrumPressure - 3, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-109", "Preheated Rich Amine to T-102", "liquid",
    [{ x: rx(u["E-101"]), y: top(u["E-101"]) + 35 }, { x: 1195, y: top(u["E-101"]) + 35 }, { x: 1195, y: u["T-102"].y + 120 }, { x: rx(u["T-102"]), y: u["T-102"].y + 120 }],
    { x: 1185, y: 565 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(a.exchangerRichOutF, 0)} °F | ${fmt(a.flashDrumPressure - 8, 0)} psig`],
    amineStreamMeta(model, { name: "Preheated Rich Amine to Regenerator", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.exchangerRichOutF, pressure: a.flashDrumPressure - 8, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-110", "T-102 Overhead H₂S + CO₂", "vapor",
    [{ x: cx(u["T-102"]), y: top(u["T-102"]) - 18 }, { x: cx(u["T-102"]), y: 132 }, { x: lx(u["E-102"]), y: 132 }],
    { x: 885, y: 92 },
    [`${fmt(a.acidGasLbHr, 0)} lb/hr`, `${fmt(a.acidGasLbmolHr, 1)} lbmol/hr`],
    amineStreamMeta(model, { name: "T-102 Overhead H₂S + CO₂", gpm: 0, lbHr: a.acidGasLbHr, temp: 210, pressure: model.inputs.stripperPressure, cp: 0.50 })
  ));

  streams.push(streamFromMeta(
    "S-111", "Condenser Outlet to V-103", "liquid",
    [{ x: cx(u["E-102"]), y: bottom(u["E-102"]) }, { x: cx(u["E-102"]), y: top(u["V-103"]) }],
    { x: 1245, y: 142 },
    [`Acid gas + reflux`, `${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Condensed Overhead to V-103", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04 + a.acidGasLbHr, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  ));

  streams.push(streamFromMeta(
    "S-112", "H₂S + CO₂ to Recovery", "vapor",
    [{ x: rx(u["V-103"]), y: top(u["V-103"]) + 40 }, { x: lx(u["SRU-101"]), y: top(u["V-103"]) + 40 }],
    { x: 1250, y: 125 },
    [`${fmt(a.acidGasLbHr, 0)} lb/hr`, `To sulfur & CO₂ recovery`],
    amineStreamMeta(model, { name: "Overhead Gas to Sulfur and CO₂ Recovery", gpm: 0, lbHr: a.acidGasLbHr, temp: 115, pressure: model.inputs.stripperPressure, cp: 0.50 })
  ));

  streams.push(streamFromMeta(
    "S-113", "Reflux to T-102", "liquid",
    [{ x: cx(u["V-103"]), y: bottom(u["V-103"]) }, { x: cx(u["V-103"]), y: 500 }, { x: rx(u["T-102"]), y: 500 }, { x: rx(u["T-102"]), y: 420 }],
    { x: 1195, y: 470 },
    [`Reflux water`, `${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "V-103 Bottoms Reflux to T-102", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  ));

  streams.push(streamFromMeta(
    "S-114", "Lean Amine Tube Side Inlet", "liquid",
    [{ x: cx(u["T-102"]), y: bottom(u["T-102"]) + 25 }, { x: cx(u["T-102"]), y: bottom(u["E-101"]) + 35 }, { x: cx(u["E-101"]), y: bottom(u["E-101"]) + 35 }, { x: cx(u["E-101"]), y: bottom(u["E-101"]) }],
    { x: 960, y: 760 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(a.regeneratorBottomF, 0)} °F | ${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Lean Amine from T-102 Bottom to E-101 Tube Side", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.regeneratorBottomF, pressure: model.inputs.stripperPressure, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-115", "E-101 Tube Outlet to E-103", "liquid",
    [{ x: lx(u["E-101"]), y: top(u["E-101"]) + 35 }, { x: 820, y: top(u["E-101"]) + 35 }, { x: 820, y: e103InletY }, { x: rx(u["E-103"]), y: e103InletY }],
    { x: 660, y: 220 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(a.leanCoolerOutF + 25, 0)} °F | ${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "E-101 Tube Outlet to Lean Amine Cooler", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.leanCoolerOutF + 25, pressure: model.inputs.stripperPressure, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-116", "E-103 Outlet to V-104", "liquid",
    [{ x: lx(u["E-103"]), y: midY(u["E-103"]) }, { x: rx(u["V-104"]), y: midY(u["V-104"]) }],
    { x: 285, y: 165 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.leanTemp, 0)} °F | ${fmt(model.inputs.stripperPressure - 3, 0)} psig`],
    amineStreamMeta(model, { name: "Cooled Lean Amine to V-104", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 3, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-117", "P-101A/B Suction from V-104", "liquid",
    [{ x: cx(u["V-104"]), y: bottom(u["V-104"]) }, { x: cx(u["V-104"]), y: top(u["P-101A/B"]) }, { x: cx(u["P-101A/B"]), y: top(u["P-101A/B"]) }],
    { x: 120, y: 285 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.leanTemp, 0)} °F | ${fmt(model.inputs.stripperPressure - 3, 0)} psig`],
    amineStreamMeta(model, { name: "Lean Amine Pump Suction", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 3, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "S-118", "Lean Amine to Absorber", "liquid",
    [{ x: rx(u["P-101A/B"]), y: midY(u["P-101A/B"]) }, { x: 360, y: midY(u["P-101A/B"]) }, { x: 360, y: u["T-101"].y + 48 }, { x: lx(u["T-101"]) + 38, y: u["T-101"].y + 48 }],
    { x: 280, y: 320 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.leanTemp, 0)} °F | ${fmt(model.inputs.pumpDischarge, 0)} psig`],
    amineStreamMeta(model, { name: "Lean Amine to Absorber", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.pumpDischarge, cp: 0.82 })
  ));

  streams.push(streamFromMeta(
    "Q-101", "Reboiler Duty", "energy",
    [{ x: 1292, y: 745 }, { x: 1292, y: bottom(u["H-101"]) }],
    { x: 1125, y: 735 },
    [`${fmt(a.reboilerDutyMMBtuHr, 2)} MMBtu/hr`, `${fmt(a.reboilerDutyMMBtuHr * 393.014, 0)} hp equiv.`],
    amineStreamMeta(model, { name: "Regenerator Reboiler Duty", gpm: 0, lbHr: 0, temp: 0, pressure: 0, cp: 0 }),
    true
  ));

  streams.push(streamFromMeta(
    "Q-102", "Lean Cooler Duty", "energy",
    [{ x: 560, y: 105 }, { x: 560, y: top(u["E-103"]) }],
    { x: 575, y: 95 },
    [`${fmt(a.coolerDutyMMBtuHr, 2)} MMBtu/hr`, `Cooling duty`],
    amineStreamMeta(model, { name: "Lean Cooler Duty", gpm: 0, lbHr: 0, temp: 0, pressure: 0, cp: 0 }),
    true
  ));

  return { units, streams };
}

/* ------------------------------------------------------------------
   Final Amine 3x3 grid placement override
   - Reduces dependency on previous crowded Amine layout.
   - Positions equipment in requested grid sections.
   - Keeps sweet-gas product inside pfd-section-r2c2.
------------------------------------------------------------------ */
function buildAminePfd(model) {
  const a = model.amine;
  const units = [
    // Row 1
    { id: "V-104", name: "Lean Amine Surge Drum", type: "vessel", x: 150, y: 80, width: 165, height: 120 },
    { id: "E-103", name: "Lean Amine Cooler", type: "exchanger", x: 525, y: 120, width: 180, height: 95 },
    { id: "E-102", name: "Lean Amine Cooler", type: "exchanger", x: 750, y: 120, width: 180, height: 95 },
    { id: "V-103", name: "Reflux Drum / Accumulator", type: "separator", x: 1085, y: 95, width: 170, height: 120 },

    // Row 2
    { id: "P-101A/B", name: "Lean Amine Pumps", type: "pump", x: 150, y: 305, width: 165, height: 120 },
    { id: "V-101", name: "Inlet Separator", type: "vessel", x: 155, y: 430, width: 155, height: 125 },
    { id: "T-101", name: "Absorber", type: "column", x: 390, y: 325, width: 150, height: 235 },
    { id: "T-102", name: "Amine Regenerator", type: "column", x: 1094, y: 313, width: 145, height: 225 },

    // Row 3 / lower rich-amine loop
    { id: "LV-101", name: "Level Control Valve", type: "valve", x: 580, y: 570, width: 90, height: 70 },
    { id: "V-102", name: "Rich Amine Flash Drum", type: "separator", x: 710, y: 548, width: 175, height: 125 },
    { id: "E-101", name: "Rich / Lean Amine Exchanger", type: "exchanger", x: 835, y: 610, width: 190, height: 100 },
    { id: "H-101", name: "Regenerator Reboiler", type: "heater", x: 1165, y: 680, width: 130, height: 85 },
    { id: "SRU-101", name: "Sulfur + CO₂ Recovery", type: "box", x: 1245, y: 110, width: 130, height: 90 }
  ];

  const u = Object.fromEntries(units.map(unit => [unit.id, unit]));
  const left = unit => unit.x;
  const right = unit => unit.x + unit.width;
  const top = unit => unit.y;
  const bottom = unit => unit.y + unit.height;
  const cx = unit => unit.x + unit.width / 2;
  const cy = unit => unit.y + unit.height / 2;

  const t101FeedY = 505;       // Bottom-stage sour-gas feed elevation
  const richLineY = 605;       // Straight absorber-bottom / LV / flash line
  const e101LeanY = 650;       // Lean amine tube outlet elevation
  const overheadY = 150;       // T-102 overhead / condenser line elevation
  const refluxY = 300;         // V-103 liquid reflux return elevation
  const leanHeaderY = 365;     // Pump discharge / absorber lean inlet elevation

  const streams = [];
  const add = (id, name, type, path, label, lines, meta, utility = false) => {
    streams.push(streamFromMeta(id, name, type, path, label, lines, meta, utility));
  };

  add(
    "S-100", "Sour Gas Feed", "vapor",
    [{ x: 70, y: top(u["V-101"]) - 40 }, { x: cx(u["V-101"]), y: top(u["V-101"]) - 40 }, { x: cx(u["V-101"]), y: top(u["V-101"]) }],
    { x: 35, y: 365 },
    [`${fmt(model.inputs.gasMmscfd, 1)} MMSCFD`, `${fmt(model.inputs.h2sMolPct, 2)}% H₂S | ${fmt(model.inputs.co2MolPct, 2)}% CO₂`],
    amineStreamMeta(model, { name: "Sour Gas Feed", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: 95, pressure: model.inputs.absorberPressure, cp: 0.55 })
  );

  add(
    "S-101", "V-101 Vapor to T-101", "vapor",
    [{ x: right(u["V-101"]), y: t101FeedY }, { x: left(u["T-101"]), y: t101FeedY }],
    { x: 290, y: 465 },
    [`To absorber bottom stage`, `${fmt(model.inputs.absorberPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Conditioned Sour Gas to Absorber", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: 95, pressure: model.inputs.absorberPressure - 2, cp: 0.55 })
  );

  add(
    "S-102", "V-101 Liquid Drain", "liquid",
    [{ x: cx(u["V-101"]), y: bottom(u["V-101"]) }, { x: cx(u["V-101"]), y: 580 }, { x: 340, y: 580 }],
    { x: 230, y: 585 },
    [`Condensate / water`, `to drain`],
    amineStreamMeta(model, { name: "V-101 Liquid Drain", gpm: 3, lbHr: 1200, temp: 95, pressure: model.inputs.absorberPressure - 3, cp: 0.90 })
  );

  add(
    "S-103", "Sweet Gas Product", "vapor",
    [{ x: right(u["T-101"]), y: top(u["T-101"]) + 55 }, { x: 900, y: top(u["T-101"]) + 55 }],
    { x: 665, y: 345 },
    [`${fmt(a.treatedGasMmscfd, 2)} MMSCFD`, `inside pfd-section-r2c2`],
    amineStreamMeta(model, { name: "Sweet Gas Product", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: model.inputs.leanTemp + 10, pressure: model.inputs.absorberPressure - 8, cp: 0.55 })
  );

  add(
    "S-104", "Rich Amine to LV-101", "liquid",
    [{ x: cx(u["T-101"]), y: bottom(u["T-101"]) }, { x: cx(u["T-101"]), y: richLineY }, { x: left(u["LV-101"]), y: richLineY }],
    { x: 465, y: 575 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.richAminePressure, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine from T-101 Bottom", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.richAminePressure, cp: 0.82 })
  );

  add(
    "S-105", "LV-101 Outlet to V-102", "liquid",
    [{ x: right(u["LV-101"]), y: richLineY }, { x: left(u["V-102"]), y: richLineY }],
    { x: 640, y: 585 },
    [`Pressure letdown`, `${fmt(a.flashDrumPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine Letdown to V-102", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp - 3, pressure: a.flashDrumPressure, cp: 0.82 })
  );

  add(
    "S-106", "V-102 Flash Gas", "vapor",
    [{ x: cx(u["V-102"]), y: top(u["V-102"]) }, { x: cx(u["V-102"]), y: 515 }, { x: 925, y: 515 }],
    { x: 805, y: 500 },
    [`Flash gas`, `to fuel gas / flare`],
    amineStreamMeta(model, { name: "V-102 Flash Gas", gpm: 0, lbHr: a.acidGasLbHr * 0.08, temp: model.inputs.richTemp - 5, pressure: a.flashDrumPressure, cp: 0.50 })
  );

  add(
    "S-107", "Rich Amine to E-101", "liquid",
    [{ x: right(u["V-102"]), y: richLineY }, { x: left(u["E-101"]), y: richLineY }],
    { x: 760, y: 585 },
    [`Shell side inlet`, `${fmt(a.designGph, 0)} gph`],
    amineStreamMeta(model, { name: "V-102 Liquid Outlet to E-101 Shell Side", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.flashDrumPressure - 3, cp: 0.82 })
  );

  add(
    "S-108", "Preheated Rich Amine to T-102", "liquid",
    [{ x: right(u["E-101"]), y: richLineY }, { x: left(u["T-102"]), y: richLineY }, { x: left(u["T-102"]), y: top(u["T-102"]) + 125 }],
    { x: 920, y: 575 },
    [`Preheated rich amine`, `${fmt(a.exchangerRichOutF, 0)} °F`],
    amineStreamMeta(model, { name: "E-101 Shell Outlet to T-102 Feed", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.exchangerRichOutF, pressure: a.flashDrumPressure - 8, cp: 0.82 })
  );

  add(
    "S-109", "T-102 Overhead Vapor", "vapor",
    [{ x: cx(u["T-102"]), y: top(u["T-102"]) }, { x: cx(u["T-102"]), y: overheadY }, { x: left(u["E-102"]), y: overheadY }],
    { x: 935, y: 120 },
    [`H₂S + CO₂ + H₂O`, `${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "T-102 Overhead Vapor to E-102", gpm: 0, lbHr: a.acidGasLbHr + a.solutionLbHr * 0.04, temp: 220, pressure: model.inputs.stripperPressure, cp: 0.65 })
  );

  add(
    "S-110", "E-102 Outlet to V-103", "liquid",
    [{ x: right(u["E-102"]), y: overheadY }, { x: left(u["V-103"]), y: overheadY }],
    { x: 940, y: 175 },
    [`Condensed overhead`, `to accumulator`],
    amineStreamMeta(model, { name: "E-102 Condenser Outlet to V-103", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04 + a.acidGasLbHr, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  );

  add(
    "S-111", "Acid Gas to Recovery", "vapor",
    [{ x: right(u["V-103"]), y: top(u["V-103"]) + 45 }, { x: left(u["SRU-101"]), y: top(u["V-103"]) + 45 }],
    { x: 1230, y: 165 },
    [`H₂S + CO₂`, `to sulfur / CO₂ recovery`],
    amineStreamMeta(model, { name: "V-103 Overhead Gas to Sulfur and CO₂ Recovery", gpm: 0, lbHr: a.acidGasLbHr, temp: 115, pressure: model.inputs.stripperPressure, cp: 0.50 })
  );

  add(
    "S-112", "Reflux Return to T-102", "liquid",
    [{ x: cx(u["V-103"]), y: bottom(u["V-103"]) }, { x: cx(u["V-103"]), y: refluxY }, { x: right(u["T-102"]), y: refluxY }, { x: right(u["T-102"]), y: top(u["T-102"]) + 35 }],
    { x: 1135, y: 285 },
    [`Reflux water`, `to T-102 top section`],
    amineStreamMeta(model, { name: "V-103 Liquid Outlet Reflux to T-102", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  );

  add(
    "S-113", "Lean Amine from T-102 Bottom", "liquid",
    [{ x: cx(u["T-102"]), y: bottom(u["T-102"]) }, { x: cx(u["T-102"]), y: e101LeanY }, { x: right(u["E-101"]), y: e101LeanY }],
    { x: 1030, y: 665 },
    [`Tube side inlet`, `${fmt(a.regeneratorBottomF, 0)} °F`],
    amineStreamMeta(model, { name: "Lean Amine from T-102 Bottom to E-101 Tube Side", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.regeneratorBottomF, pressure: model.inputs.stripperPressure, cp: 0.82 })
  );

  add(
    "S-114", "E-101 Outlet to E-103", "liquid",
    [{ x: left(u["E-101"]), y: e101LeanY }, { x: 735, y: e101LeanY }, { x: 735, y: cy(u["E-103"]) }, { x: right(u["E-103"]), y: cy(u["E-103"]) }],
    { x: 650, y: 240 },
    [`Lean amine to cooler`, `${fmt(a.leanCoolerOutF + 25, 0)} °F`],
    amineStreamMeta(model, { name: "E-101 Tube Outlet to E-103 Inlet", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.leanCoolerOutF + 25, pressure: model.inputs.stripperPressure - 2, cp: 0.82 })
  );

  add(
    "S-115", "E-103 Outlet to V-104", "liquid",
    [{ x: left(u["E-103"]), y: cy(u["E-103"]) }, { x: right(u["V-104"]), y: cy(u["V-104"]) }],
    { x: 335, y: 135 },
    [`Cooled lean amine`, `${fmt(model.inputs.leanTemp, 0)} °F`],
    amineStreamMeta(model, { name: "E-103 Outlet to Lean Amine Surge Drum", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 3, cp: 0.82 })
  );

  add(
    "S-116", "V-104 to P-101A/B", "liquid",
    [{ x: cx(u["V-104"]), y: bottom(u["V-104"]) }, { x: cx(u["V-104"]), y: top(u["P-101A/B"]) }, { x: cx(u["P-101A/B"]), y: top(u["P-101A/B"]) }],
    { x: 150, y: 245 },
    [`Pump suction`, `${fmt(model.inputs.leanTemp, 0)} °F`],
    amineStreamMeta(model, { name: "V-104 Liquid Outlet to P-101A/B Suction", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 3, cp: 0.82 })
  );

  add(
    "S-117", "Lean Amine to Absorber", "liquid",
    [{ x: right(u["P-101A/B"]), y: leanHeaderY }, { x: left(u["T-101"]), y: leanHeaderY }, { x: left(u["T-101"]), y: top(u["T-101"]) + 45 }],
    { x: 280, y: 330 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.pumpDischarge, 0)} psig`],
    amineStreamMeta(model, { name: "Lean Amine Pump Discharge to Absorber Top", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.pumpDischarge, cp: 0.82 })
  );

  add(
    "Q-101", "Reboiler Duty", "energy",
    [{ x: 1230, y: bottom(u["T-102"]) + 20 }, { x: 1230, y: top(u["H-101"]) }],
    { x: 1110, y: 735 },
    [`${fmt(a.reboilerDutyMMBtuHr, 2)} MMBtu/hr`, `${fmt(a.reboilerDutyMMBtuHr * 393.014, 0)} hp equiv.`],
    amineStreamMeta(model, { name: "Regenerator Reboiler Duty", gpm: 0, lbHr: 0, temp: 0, pressure: 0, cp: 0 }),
    true
  );

  add(
    "Q-102", "Lean Cooler Duty", "energy",
    [{ x: 615, y: 82 }, { x: 615, y: top(u["E-103"]) }],
    { x: 625, y: 82 },
    [`${fmt(a.coolerDutyMMBtuHr, 2)} MMBtu/hr`, `Cooler duty`],
    amineStreamMeta(model, { name: "Lean Cooler Duty", gpm: 0, lbHr: 0, temp: 0, pressure: 0, cp: 0 }),
    true
  );

  return { units, streams };
}

/* ------------------------------------------------------------------
   Final Amine grid/routing adjustment override
   Requested changes:
   - P-101A/B centered in pfd-section-r2c1
   - V-101 centered in pfd-section-r3c1
   - Sweet gas product routed along r1/r2 border in section c2
   - LV-101 reduced and aligned with T-101 bottom liquid outlet
   - V-102 aligned with LV-101 outlet
   - E-101 treated as shell-and-tube rich/lean exchanger
   - Tube side: V-102 liquid -> E-101 -> T-102 feed
   - Shell side: T-102 bottom -> E-101 -> E-103 -> V-104
   - Sour gas enters V-101 from left; V-101 vapor enters T-101 below bottom tray from left
------------------------------------------------------------------ */
function drawValveShape(g, u) {
  const cx = u.x + u.width / 2;
  const cy = unitConnectionY(u);
  const scale = u.id === "LV-101" ? 0.45 : 1.0;
  const half = 34 * scale;
  const height = 22 * scale;
  const stem = 42 * scale;
  g.appendChild(svgEl("line", { x1: u.x, y1: cy, x2: cx - half, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: cx + half, y1: cy, x2: u.x + u.width, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("polygon", { points: `${cx-half},${cy-height} ${cx},${cy} ${cx-half},${cy+height}`, class: "valve-body" }));
  g.appendChild(svgEl("polygon", { points: `${cx+half},${cy-height} ${cx},${cy} ${cx+half},${cy+height}`, class: "valve-body" }));
  g.appendChild(svgEl("line", { x1: cx, y1: cy, x2: cx, y2: cy - stem, class: "valve-stem" }));
  g.appendChild(svgEl("line", { x1: cx - 22 * scale, y1: cy - stem, x2: cx + 22 * scale, y2: cy - stem, class: "valve-stem" }));
  addText(g, u.id, cx, cy + 46, "unit-tag", "middle");
  addText(g, u.name, cx, cy + 64, "unit-name", "middle");
}

function buildAminePfd(model) {
  const a = model.amine;
  const units = [
    { id: "V-104", name: "Lean Amine Surge Drum", type: "vessel", x: 150, y: 80, width: 165, height: 120 },
    { id: "E-102", name: "Lean Amine Cooler", type: "exchanger", x: 750, y: 120, width: 180, height: 95 },
    { id: "V-103", name: "Reflux Drum / Accumulator", type: "separator", x: 1085, y: 95, width: 170, height: 120 },

    { id: "P-101A/B", name: "Lean Amine Pumps", type: "pump", x: 150, y: 365, width: 165, height: 120 },
    { id: "T-101", name: "Absorber", type: "column", x: 520, y: 340, width: 145, height: 230 },
    { id: "T-102", name: "Amine Regenerator", type: "column", x: 1094, y: 313, width: 145, height: 225 },

    { id: "V-101", name: "Inlet Separator", type: "vessel", x: 155, y: 646, width: 155, height: 125 },
    { id: "LV-101", name: "Level Control Valve", type: "valve", x: 610, y: 570, width: 42, height: 32 },
    { id: "V-102", name: "Rich Amine Flash Drum", type: "separator", x: 690, y: 568, width: 175, height: 125 },
    { id: "E-101", name: "Rich / Lean Amine Exchanger (Shell & Tube)", type: "exchanger", x: 823, y: 660, width: 220, height: 100 },
    { id: "H-101", name: "Regenerator Reboiler", type: "heater", x: 1165, y: 680, width: 130, height: 85 },
    { id: "SRU-101", name: "Sulfur + CO₂ Recovery", type: "box", x: 1245, y: 110, width: 130, height: 90 }
  ];

  // Resize all Amine PFD unit bounding boxes to 67% of their prior size.
  // Centers are preserved so existing routing remains readable while symbols are smaller.
  const AMINE_UNIT_SCALE = 0.67;
  units.forEach(unit => {
    const unitCx = unit.x + unit.width / 2;
    const unitCy = unit.y + unit.height / 2;
    unit.width = unit.width * AMINE_UNIT_SCALE;
    unit.height = unit.height * AMINE_UNIT_SCALE;
    unit.x = unitCx - unit.width / 2;
    unit.y = unitCy - unit.height / 2;
  });

  // Place T-101 on the vertical boundary between pfd-section-r2c1 and pfd-section-r2c2.
  // SVG viewBox width is 1400, so the column boundary is 1400 / 3.
  const t101BoundaryX = 1400 / 3;
  const t101Unit = units.find(unit => unit.id === "T-101");
  if (t101Unit) {
    t101Unit.x = t101BoundaryX - t101Unit.width / 2;
  }

  // Place E-102 at the center of pfd-section-r1c2.
  // Grid: 1400 x 850, so r1c2 center is approximately (700, 142).
  const e102Unit = units.find(unit => unit.id === "E-102");
  if (e102Unit) {
    e102Unit.x = 700 - e102Unit.width / 2;
    e102Unit.y = 142 - e102Unit.height / 2;
  }

  const u = Object.fromEntries(units.map(unit => [unit.id, unit]));
  const left = unit => unit.x;
  const right = unit => unit.x + unit.width;
  const top = unit => unit.y;
  const bottom = unit => unit.y + unit.height;
  const cx = unit => unit.x + unit.width / 2;
  const cy = unit => unit.y + unit.height / 2;
  const unitY = unit => unitConnectionY(unit);

  const sweetGasY = 283;       // Border between pfd-section-r1c2 and pfd-section-r2c2
  const sourGasY = 708;        // V-101 side feed elevation
  const t101BottomFeedY = 520; // Below bottom tray, left-side feed to T-101
  const richLineY = bottom(u["T-101"]); // T-101 bottom liquid outlet -> LV-101 -> V-102 straight line

  // Align LV-101 and V-102 centerlines with the T-101 bottom liquid outlet.
  u["LV-101"].y = richLineY - u["LV-101"].height / 2;
  u["V-102"].y = richLineY - u["V-102"].height / 2;

  const e101RichY = 710;       // E-101 tube-side rich amine elevation
  const e101LeanY = 742;       // E-101 shell-side lean amine elevation
  const overheadY = 150;
  const refluxY = 300;
  const leanHeaderY = unitY(u["P-101A/B"]);

  const streams = [];
  const add = (id, name, type, path, label, lines, meta, utility = false) => {
    streams.push(streamFromMeta(id, name, type, path, label, lines, meta, utility));
  };

  add("S-100", "Sour Gas Feed", "vapor",
    [{ x: 70, y: sourGasY }, { x: left(u["V-101"]), y: sourGasY }],
    { x: 35, y: 665 },
    [`${fmt(model.inputs.gasMmscfd, 1)} MMSCFD`, `${fmt(model.inputs.h2sMolPct, 2)}% H₂S | ${fmt(model.inputs.co2MolPct, 2)}% CO₂`],
    amineStreamMeta(model, { name: "Sour Gas Feed", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: 95, pressure: model.inputs.absorberPressure, cp: 0.55 })
  );

  add("S-101", "V-101 Vapor to T-101", "vapor",
    [{ x: right(u["V-101"]), y: sourGasY }, { x: 342, y: sourGasY }, { x: 342, y: t101BottomFeedY }, { x: left(u["T-101"]), y: t101BottomFeedY }],
    { x: 275, y: 530 },
    [`Enters below bottom tray`, `${fmt(model.inputs.absorberPressure - 2, 0)} psig`],
    amineStreamMeta(model, { name: "Conditioned Sour Gas to Absorber Bottom Stage", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: 95, pressure: model.inputs.absorberPressure - 2, cp: 0.55 })
  );

  add("S-102", "V-101 Liquid Drain", "liquid",
    [{ x: cx(u["V-101"]), y: bottom(u["V-101"]) }, { x: cx(u["V-101"]), y: 795 }, { x: 340, y: 795 }],
    { x: 230, y: 785 },
    [`Condensate / water`, `to drain`],
    amineStreamMeta(model, { name: "V-101 Liquid Drain", gpm: 3, lbHr: 1200, temp: 95, pressure: model.inputs.absorberPressure - 3, cp: 0.90 })
  );

  add("S-103", "Sweet Gas Product", "vapor",
    [{ x: cx(u["T-101"]), y: top(u["T-101"]) - 18 }, { x: cx(u["T-101"]), y: sweetGasY }, { x: 680, y: sweetGasY }],
    { x: 610, y: 238 },
    [`${fmt(a.treatedGasMmscfd, 2)} MMSCFD`, `along r1c2/r2c2 border`],
    amineStreamMeta(model, { name: "Sweet Gas Product", gpm: 0, lbHr: model.inputs.gasMmscfd * 1000000 * 18 / 379.5 / 24, temp: model.inputs.leanTemp + 10, pressure: model.inputs.absorberPressure - 8, cp: 0.55 })
  );

  add("S-104", "Rich Amine to LV-101", "liquid",
    [{ x: cx(u["T-101"]), y: bottom(u["T-101"]) }, { x: cx(u["T-101"]), y: richLineY }, { x: left(u["LV-101"]), y: richLineY }],
    { x: 465, y: 590 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.richTemp, 0)} °F | ${fmt(a.richAminePressure, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine from T-101 Bottom to LV-101", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.richAminePressure, cp: 0.82 })
  );

  add("S-105", "LV-101 Outlet to V-102", "liquid",
    [{ x: right(u["LV-101"]), y: richLineY }, { x: left(u["V-102"]), y: richLineY }],
    { x: 645, y: 590 },
    [`Pressure letdown`, `${fmt(a.flashDrumPressure, 0)} psig`],
    amineStreamMeta(model, { name: "Rich Amine Letdown to V-102", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp - 3, pressure: a.flashDrumPressure, cp: 0.82 })
  );

  add("S-106", "V-102 Flash Gas", "vapor",
    [{ x: cx(u["V-102"]), y: top(u["V-102"]) }, { x: cx(u["V-102"]), y: 535 }, { x: 925, y: 535 }],
    { x: 805, y: 515 },
    [`Flash gas`, `to fuel gas / flare`],
    amineStreamMeta(model, { name: "V-102 Flash Gas", gpm: 0, lbHr: a.acidGasLbHr * 0.08, temp: model.inputs.richTemp - 5, pressure: a.flashDrumPressure, cp: 0.50 })
  );

  add("S-107", "V-102 Liquid to E-101 Tube Inlet", "liquid",
    [{ x: right(u["V-102"]), y: richLineY }, { x: 910, y: richLineY }, { x: 910, y: e101RichY }, { x: left(u["E-101"]), y: e101RichY }],
    { x: 760, y: 640 },
    [`Tube-side inlet`, `${fmt(a.designGph, 0)} gph`],
    amineStreamMeta(model, { name: "V-102 Liquid Outlet to E-101 Tube Side Inlet", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.richTemp, pressure: a.flashDrumPressure - 3, cp: 0.82 })
  );

  add("S-108", "E-101 Tube Outlet to T-102 Feed", "liquid",
    [{ x: right(u["E-101"]), y: e101RichY }, { x: left(u["T-102"]), y: e101RichY }, { x: left(u["T-102"]), y: top(u["T-102"]) + 125 }],
    { x: 935, y: 600 },
    [`Preheated rich amine`, `${fmt(a.exchangerRichOutF, 0)} °F`],
    amineStreamMeta(model, { name: "E-101 Tube Outlet to T-102 Feed Inlet", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.exchangerRichOutF, pressure: a.flashDrumPressure - 8, cp: 0.82 })
  );

  add("S-109", "T-102 Overhead Vapor to V-103", "vapor",
    [{ x: cx(u["T-102"]), y: top(u["T-102"]) }, { x: cx(u["T-102"]), y: overheadY }, { x: left(u["V-103"]), y: overheadY }],
    { x: 925, y: 120 },
    [`H₂S + CO₂ + H₂O`, `${fmt(model.inputs.stripperPressure, 0)} psig`],
    amineStreamMeta(model, { name: "T-102 Overhead Vapor to V-103 Accumulator", gpm: 0, lbHr: a.acidGasLbHr + a.solutionLbHr * 0.04, temp: 220, pressure: model.inputs.stripperPressure, cp: 0.65 })
  );

  add("S-110", "V-103 Condensate / Reflux Inventory", "liquid",
    [{ x: left(u["V-103"]), y: top(u["V-103"]) + 78 }, { x: left(u["V-103"]) - 85, y: top(u["V-103"]) + 78 }],
    { x: 990, y: 195 },
    [`Condensed liquid`, `accumulator section`],
    amineStreamMeta(model, { name: "V-103 Condensed Overhead Inventory", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04 + a.acidGasLbHr, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  );

  add("S-111", "Acid Gas to Recovery", "vapor",
    [{ x: right(u["V-103"]), y: top(u["V-103"]) + 45 }, { x: left(u["SRU-101"]), y: top(u["V-103"]) + 45 }],
    { x: 1230, y: 165 },
    [`H₂S + CO₂`, `to sulfur / CO₂ recovery`],
    amineStreamMeta(model, { name: "V-103 Overhead Gas to Sulfur and CO₂ Recovery", gpm: 0, lbHr: a.acidGasLbHr, temp: 115, pressure: model.inputs.stripperPressure, cp: 0.50 })
  );

  add("S-112", "Reflux Return to T-102", "liquid",
    [{ x: cx(u["V-103"]), y: bottom(u["V-103"]) }, { x: cx(u["V-103"]), y: refluxY }, { x: right(u["T-102"]), y: refluxY }, { x: right(u["T-102"]), y: top(u["T-102"]) + 35 }],
    { x: 1135, y: 285 },
    [`Reflux water`, `to T-102 top section`],
    amineStreamMeta(model, { name: "V-103 Liquid Outlet Reflux to T-102", gpm: a.designGpm * 0.04, lbHr: a.solutionLbHr * 0.04, temp: 120, pressure: model.inputs.stripperPressure, cp: 1.0 })
  );

  add("S-113", "T-102 Bottom to E-101 Shell Inlet", "liquid",
    [{ x: cx(u["T-102"]), y: bottom(u["T-102"]) }, { x: cx(u["T-102"]), y: e101LeanY }, { x: right(u["E-101"]), y: e101LeanY }],
    { x: 1040, y: 720 },
    [`Shell-side inlet`, `${fmt(a.regeneratorBottomF, 0)} °F`],
    amineStreamMeta(model, { name: "T-102 Bottom Liquid Outlet to E-101 Shell Side Inlet", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.regeneratorBottomF, pressure: model.inputs.stripperPressure, cp: 0.82 })
  );

  add("S-114", "E-101 Shell Outlet to E-102 Inlet", "liquid",
    [{ x: left(u["E-101"]), y: e101LeanY }, { x: 625, y: e101LeanY }, { x: 625, y: cy(u["E-102"]) }, { x: left(u["E-102"]), y: cy(u["E-102"]) }],
    { x: 600, y: 210 },
    [`E-102 inlet`, `${fmt(a.leanCoolerOutF + 25, 0)} °F`],
    amineStreamMeta(model, { name: "E-101 Shell Side Outlet to E-102 Inlet", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: a.leanCoolerOutF + 25, pressure: model.inputs.stripperPressure - 2, cp: 0.82 })
  );

  add("S-115", "E-102 Outlet to V-104", "liquid",
    [{ x: left(u["E-102"]), y: cy(u["E-102"]) }, { x: 430, y: cy(u["E-102"]) }, { x: 430, y: cy(u["V-104"]) }, { x: right(u["V-104"]), y: cy(u["V-104"]) }],
    { x: 405, y: 120 },
    [`Cooled lean amine`, `${fmt(model.inputs.leanTemp, 0)} °F`],
    amineStreamMeta(model, { name: "E-102 Outlet to V-104 Lean Amine Surge Drum", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 4, cp: 0.82 })
  );

  add("S-116", "V-104 to P-101A/B", "liquid",
    [{ x: cx(u["V-104"]), y: bottom(u["V-104"]) }, { x: cx(u["V-104"]), y: top(u["P-101A/B"]) }, { x: cx(u["P-101A/B"]), y: top(u["P-101A/B"]) }],
    { x: 140, y: 300 },
    [`Pump suction`, `${fmt(model.inputs.leanTemp, 0)} °F`],
    amineStreamMeta(model, { name: "V-104 Liquid Outlet to P-101A/B Suction", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.stripperPressure - 3, cp: 0.82 })
  );

  add("S-117", "Lean Amine to Absorber", "liquid",
    [{ x: right(u["P-101A/B"]), y: leanHeaderY }, { x: 360, y: leanHeaderY }, { x: 360, y: top(u["T-101"]) + 45 }, { x: left(u["T-101"]), y: top(u["T-101"]) + 45 }],
    { x: 280, y: 330 },
    [`${fmt(a.designGph, 0)} gph`, `${fmt(model.inputs.pumpDischarge, 0)} psig`],
    amineStreamMeta(model, { name: "Lean Amine Pump Discharge to Absorber Top", gpm: a.designGpm, lbHr: a.solutionLbHr, temp: model.inputs.leanTemp, pressure: model.inputs.pumpDischarge, cp: 0.82 })
  );

  add("Q-101", "Reboiler Duty", "energy",
    [{ x: 1230, y: bottom(u["T-102"]) + 20 }, { x: 1230, y: top(u["H-101"]) }],
    { x: 1110, y: 735 },
    [`${fmt(a.reboilerDutyMMBtuHr, 2)} MMBtu/hr`, `${fmt(a.reboilerDutyMMBtuHr * 393.014, 0)} hp equiv.`],
    amineStreamMeta(model, { name: "Regenerator Reboiler Duty", gpm: 0, lbHr: 0, temp: 0, pressure: 0, cp: 0 }),
    true
  );

  return { units, streams };
}


/* ------------------------------------------------------------------
   Final exchanger symbol override: shell-and-tube display for E-101
   and consistent shell-and-tube style for exchanger symbols.
------------------------------------------------------------------ */
function drawHeatExchangerShape(g, u) {
  const cx = u.x + u.width / 2;
  const cy = u.y + 50;
  const shellW = Math.min(u.width - 28, 190);
  const shellH = Math.min(54, Math.max(40, u.height - 38));
  const x = cx - shellW / 2;
  const y = cy - shellH / 2;
  const capR = shellH / 2;

  // Unit inlet / outlet centerlines; no unit arrowheads.
  g.appendChild(svgEl("line", { x1: u.x + 5, y1: cy, x2: x, y2: cy, class: "symbol-stream-line" }));
  g.appendChild(svgEl("line", { x1: x + shellW, y1: cy, x2: u.x + u.width - 5, y2: cy, class: "symbol-stream-line" }));

  // Shell barrel with rounded heads.
  g.appendChild(svgEl("rect", { x, y, width: shellW, height: shellH, rx: capR, class: "exchanger-shell" }));
  g.appendChild(svgEl("line", { x1: x + 24, y1: y - 8, x2: x + 24, y2: y + shellH + 8, class: "unit-detail" }));
  g.appendChild(svgEl("line", { x1: x + shellW - 24, y1: y - 8, x2: x + shellW - 24, y2: y + shellH + 8, class: "unit-detail" }));

  // Tube bundle.
  for (let i = 0; i < 5; i++) {
    const yy = y + 12 + i * ((shellH - 24) / 4);
    g.appendChild(svgEl("line", { x1: x + 34, y1: yy, x2: x + shellW - 34, y2: yy, class: "exchanger-tube" }));
  }

  // Shell-side nozzles for E-101 to clarify rich/lean exchanger connections.
  if (u.id === "E-101") {
    g.appendChild(svgEl("line", { x1: cx - 45, y1: y, x2: cx - 45, y2: y - 22, class: "unit-detail" }));
    g.appendChild(svgEl("line", { x1: cx + 45, y1: y + shellH, x2: cx + 45, y2: y + shellH + 22, class: "unit-detail" }));
    addText(g, "Shell & Tube", cx, u.y + 98, "unit-name", "middle");
  }

  addText(g, u.id, cx, u.y + 112, "unit-tag", "middle");
  addText(g, u.name, cx, u.y + 130, "unit-name", "middle");
}


/* ------------------------------------------------------------------
   Amine-Treating-1.svg symbol replacement layer
   Unit wrappers, IDs, tooltips, event listeners, and calculation mappings
   are preserved; only the internal geometry is replaced by symbols from
   pfd-template.svg that were derived from the attached Amine-Treating-1.svg.
------------------------------------------------------------------ */
function addSourceSymbolUse(g, u, symbolId, vbW, vbH, labelOffset = 18) {
  const use = svgEl("use", {
    href: `#${symbolId}`,
    x: u.x,
    y: u.y,
    width: u.width,
    height: u.height,
    class: "source-symbol-use"
  });
  use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbolId}`);
  g.appendChild(use);
  g.dataset.unitId = u.id;
  g.dataset.unitType = u.type || "unit";
  addText(g, u.id, u.x + u.width / 2, u.y + u.height + labelOffset, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + u.height + labelOffset + 18, "unit-name", "middle");
}

function drawPumpShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-pump", 120, 90, 18);
}

function drawVesselShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-vertical-vessel", 90, 150, 18);
}

function drawSeparatorShape(g, u) {
  const vertical = u.height >= u.width * 0.75;
  addSourceSymbolUse(g, u, vertical ? "src-symbol-vertical-vessel" : "src-symbol-horizontal-vessel", vertical ? 90 : 160, vertical ? 150 : 90, 18);
}

function drawTankShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-vertical-vessel", 90, 150, 18);
}

function drawColumnShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-column", 100, 190, 18);
}

function drawHeatExchangerShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-shell-tube", 190, 90, 18);
  if (u.id === "E-101") {
    addText(g, "Shell & Tube", u.x + u.width / 2, u.y + u.height + 54, "unit-name", "middle");
  }
}

function drawValveShape(g, u) {
  addSourceSymbolUse(g, u, "src-symbol-valve", 90, 60, 14);
}

function drawFurnaceShape(g, u, model) {
  addSourceSymbolUse(g, u, "src-symbol-heater", 120, 120, 18);
}

function drawBoxShape(g, u) {
  const rx = Math.min(10, Math.max(4, u.height / 8));
  g.appendChild(svgEl("rect", { x: u.x, y: u.y, width: u.width, height: u.height, rx, class: "unit-muted" }));
  addText(g, u.id, u.x + u.width / 2, u.y + u.height / 2 - 4, "unit-tag", "middle");
  addText(g, u.name, u.x + u.width / 2, u.y + u.height / 2 + 16, "unit-name", "middle");
}

const drawUnitBeforeSourceSymbolReplacement = typeof drawUnit === "function" ? drawUnit : null;
function drawUnit(unit, model) {
  const g = svgEl("g", { id: `unit-${unit.id.replace(/[^A-Za-z0-9_-]/g, "-")}`, class: "selectable unit" });
  g.dataset.tooltip = `${unit.id} ${unit.name}\
View: ${model.selection.config.title}`;
  if (unit.type === "pump") drawPumpShape(g, unit);
  else if (unit.type === "exchanger") drawHeatExchangerShape(g, unit);
  else if (unit.type === "column") drawColumnShape(g, unit);
  else if (unit.type === "separator") drawSeparatorShape(g, unit);
  else if (unit.type === "vessel") drawVesselShape(g, unit);
  else if (unit.type === "valve") drawValveShape(g, unit);
  else if (unit.type === "furnace" || unit.type === "heater") drawFurnaceShape(g, unit, model);
  else if (unit.type === "tank") drawTankShape(g, unit);
  else drawBoxShape(g, unit);
  layers.units.appendChild(g);
  attachTooltip(g);
}
