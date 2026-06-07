const unitData = {
    absorber: { name: "Glycol Absorber", temperature: "95 - 115 °F", pressure: "830 - 875 psig", duty: "-", notes: "Wet gas contacts lean TEG; water transfers from gas to glycol." },
    regenerator: { name: "TEG Regenerator", temperature: "360 - 400 °F", pressure: "0 - 5 psig", duty: "-", notes: "Strips water from rich glycol to regenerate lean TEG." },
    reboiler: { name: "Glycol Reboiler", temperature: "380 - 400 °F", pressure: "0 - 5 psig", duty: "1.8 MMBtu/hr", notes: "Provides heat for TEG reconcentration." },
    condenser: { name: "Still Overhead Condenser", temperature: "110 - 130 °F", pressure: "0 - 5 psig", duty: "0.4 MMBtu/hr", notes: "Condenses water vapor from regenerator overhead." },
    surgeDrum: { name: "Glycol Surge Drum", temperature: "130 - 160 °F", pressure: "0 - 15 psig", duty: "-", notes: "Lean TEG inventory and pump suction vessel." },
    circulationPump: { name: "TEG Circulation Pump", temperature: "120 - 150 °F", pressure: "875 psig discharge", duty: "25 hp", notes: "Pumps lean glycol to absorber pressure." },
    leanCooler: { name: "Lean Glycol Cooler", temperature: "100 - 115 °F", pressure: "850 - 875 psig", duty: "Cooling Service", notes: "Cools lean TEG before absorber feed." },
    glycolExchanger: { name: "Lean/Rich Glycol Exchanger", temperature: "120 - 300 °F", pressure: "40 - 875 psig", duty: "Heat Recovery", notes: "Preheats rich glycol and cools regenerated lean glycol." }
};

const streamData = {
    1: { name: "Wet Gas Feed", phase: "Gas", flow: "85 MMSCFD", temperature: "100 °F", pressure: "850 psig", boundary: "Yes - Inlet Feed" },
    2: { name: "Dry Gas Product", phase: "Gas", flow: "84.8 MMSCFD", temperature: "105 °F", pressure: "835 psig", boundary: "Yes - Product" },
    3: { name: "Lean TEG to Absorber", phase: "Liquid", flow: "9.0 GPM", temperature: "105 °F", pressure: "875 psig", boundary: "No - Internal" },
    4: { name: "Rich TEG from Absorber", phase: "Liquid", flow: "9.4 GPM", temperature: "115 °F", pressure: "850 psig", boundary: "No - Internal" },
    5: { name: "Still Overhead Water Vapor", phase: "Vapor", flow: "0.20 MMSCFD", temperature: "212 °F", pressure: "2 psig", boundary: "Yes - Vent / Condenser Feed" },
    6: { name: "Condensed Water", phase: "Liquid", flow: "1.2 GPM", temperature: "120 °F", pressure: "2 psig", boundary: "Yes - Water Draw" },
    7: { name: "Fuel Gas to Reboiler", phase: "Gas", flow: "0.04 MMSCFD", temperature: "80 °F", pressure: "50 psig", boundary: "Yes - Utility Boundary" },
    8: { name: "Lean TEG from Surge Drum", phase: "Liquid", flow: "9.0 GPM", temperature: "140 °F", pressure: "10 psig", boundary: "No - Pump Suction" },
    9: { name: "Pump Discharge Lean TEG", phase: "Liquid", flow: "9.0 GPM", temperature: "145 °F", pressure: "875 psig", boundary: "No - Internal" },
    10: { name: "Regenerated Lean TEG", phase: "Liquid", flow: "9.0 GPM", temperature: "390 °F", pressure: "3 psig", boundary: "No - Internal" }
};

document.addEventListener("DOMContentLoaded", () => {
    initializeTooltips();
    initializeLegendToggle();
    initializeFooterDate();
    updateRangeTable();
    initializeDewPointCalculator();
});

function initializeTooltips() {
    const tooltip = document.getElementById("pfdTooltip");
    if (!tooltip) return;

    document.querySelectorAll("[data-type][data-id]").forEach(element => {
        element.addEventListener("mouseover", () => {
            const html = buildTooltip(element.dataset.type, element.dataset.id);
            if (!html) return;
            tooltip.innerHTML = html;
            tooltip.style.display = "block";
        });
        element.addEventListener("mousemove", event => {
            tooltip.style.left = `${event.clientX + 14}px`;
            tooltip.style.top = `${event.clientY + 14}px`;
        });
        element.addEventListener("mouseout", () => { tooltip.style.display = "none"; });
    });
}

function buildTooltip(type, id) {
    if (type === "unit") {
        const unit = unitData[id];
        if (!unit) return "";
        return `<strong>${unit.name}</strong><br>Temperature: ${unit.temperature}<br>Pressure: ${unit.pressure}<br>Duty: ${unit.duty}<br>Notes: ${unit.notes}`;
    }
    if (type === "stream") {
        const stream = streamData[id];
        if (!stream) return "";
        return `<strong>Stream ${id}: ${stream.name}</strong><br>Phase: ${stream.phase}<br>Flow: ${stream.flow}<br>Temperature: ${stream.temperature}<br>Pressure: ${stream.pressure}<br>Boundary: ${stream.boundary}`;
    }
    return "";
}

function initializeLegendToggle() {
    document.querySelectorAll(".legend-item").forEach(legendItem => {
        legendItem.addEventListener("click", () => {
            const layer = legendItem.dataset.targetLayer;
            if (!layer) return;
            const matchingElements = document.querySelectorAll(`[data-layer="${layer}"]`);
            const isHidden = legendItem.classList.contains("legend-disabled");
            matchingElements.forEach(element => element.classList.toggle("svg-hidden", !isHidden));
            legendItem.classList.toggle("legend-disabled");
        });
    });
}

function initializeFooterDate() {
    document.querySelectorAll(".footer-date").forEach(element => {
        element.textContent = new Date().toLocaleDateString();
    });
}

function updateRangeTable() {
    const streams = Object.values(streamData || {});
    const temperatureValues = streams.map(s => parseNumber(s.temperature)).filter(Number.isFinite);
    const pressureValues = streams.map(s => parseNumber(s.pressure)).filter(Number.isFinite);
    const allFlows = streams.map(stream => ({ phase: normalizePhase(stream.phase), flow: parseFlow(stream.flow) })).filter(item => item.flow && Number.isFinite(item.flow.value));
    setSvgText("minTemperature", temperatureValues.length ? `${Math.min(...temperatureValues)} °F` : "-");
    setSvgText("maxTemperature", temperatureValues.length ? `${Math.max(...temperatureValues)} °F` : "-");
    setSvgText("minPressure", pressureValues.length ? `${Math.min(...pressureValues)} psig` : "-");
    setSvgText("maxPressure", pressureValues.length ? `${Math.max(...pressureValues)} psig` : "-");
    setFlowRange("minGasFlow", "maxGasFlow", allFlows.filter(item => item.phase === "gas" || item.phase === "vapor"));
    setFlowRange("minLiquidFlow", "maxLiquidFlow", allFlows.filter(item => item.phase === "liquid"));
}

function normalizePhase(phase) {
    const value = String(phase || "").trim().toLowerCase();
    if (value.includes("gas")) return "gas";
    if (value.includes("vapor")) return "vapor";
    if (value.includes("liquid")) return "liquid";
    return "other";
}

function setFlowRange(minElementId, maxElementId, flowItems) {
    if (!flowItems.length) { setSvgText(minElementId, "-"); setSvgText(maxElementId, "-"); return; }
    const grouped = groupFlowsByUnit(flowItems.map(item => item.flow));
    setSvgText(minElementId, Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.min(...values))} ${unit}`).join(" / "));
    setSvgText(maxElementId, Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.max(...values))} ${unit}`).join(" / "));
}

function parseNumber(value) {
    const match = String(value || "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
}

function parseFlow(flowText) {
    const match = String(flowText || "").trim().match(/^(-?\d+(\.\d+)?)\s*(.+)$/);
    return match ? { value: Number(match[1]), unit: match[3].trim() } : null;
}

function groupFlowsByUnit(flowItems) {
    return flowItems.reduce((groups, item) => {
        groups[item.unit] = groups[item.unit] || [];
        groups[item.unit].push(item.value);
        return groups;
    }, {});
}

function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function setSvgText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function initializeDewPointCalculator() {
    const button = document.getElementById("calculateDewPoint");
    if (!button) return;
    button.addEventListener("click", calculateMoistureFromDewPoint);
    calculateMoistureFromDewPoint();
}

function calculateMoistureFromDewPoint() {
    const pressurePsig = getInputNumber("outletPressurePsig", 835);
    const dewPointF = getInputNumber("waterDewPointF", -10);
    const gasFlow = getInputNumber("dryGasFlowMmscfd", 84.8);
    const pressurePsia = pressurePsig + 14.696;
    const waterVaporPressure = waterVaporPressurePsia(dewPointF);
    const moleFraction = Math.min(waterVaporPressure / pressurePsia, 1);
    const ppmv = moleFraction * 1_000_000;
    const lbPerMMscf = moleFraction * 1_000_000 * 18.01528 / 379.482;
    const lbPerDay = lbPerMMscf * gasFlow;
    setText("dewPointPressureResult", `${formatNumber(pressurePsia)} psia`);
    setText("waterVpResult", `${formatNumber(waterVaporPressure)} psia`);
    setText("moisturePpmvResult", `${formatNumber(ppmv)} ppmv`);
    setText("moistureLbResult", `${formatNumber(lbPerMMscf)} lb/MMscf`);
    setText("waterRateResult", `${formatNumber(lbPerDay)} lb/day`);
    setText("dewPointNote", `Calculated from water saturation at ${formatNumber(dewPointF)} °F and outlet pressure of ${formatNumber(pressurePsig)} psig.`);
}

function waterVaporPressurePsia(tempF) {
    const tempC = (tempF - 32) * 5 / 9;
    const constants = tempC < 99 ? { A: 8.07131, B: 1730.63, C: 233.426 } : { A: 8.14019, B: 1810.94, C: 244.485 };
    const pressureMmHg = Math.pow(10, constants.A - constants.B / (constants.C + tempC));
    return pressureMmHg * 0.0193368;
}

function getInputNumber(id, fallback) {
    const element = document.getElementById(id);
    const value = element ? Number(element.value) : NaN;
    return Number.isFinite(value) ? value : fallback;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
