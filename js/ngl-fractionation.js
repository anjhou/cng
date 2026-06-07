const unitData = {
    feedCooler: { name: "Feed Chiller / Gas-Gas Exchanger", temperature: "-20 to 20 °F", pressure: "760 - 820 psig", duty: "Cold recovery", notes: "Cools treated gas before heavy hydrocarbon removal using residue gas and refrigerant integration." },
    scrubColumn: { name: "Scrub Column / Demethanizer Feed Column", temperature: "-35 to 10 °F", pressure: "730 - 800 psig", duty: "Cold reflux wash", notes: "High-pressure column removes C5+ and optional C3+ using cold reflux from the liquefaction / refrigeration loop." },
    refluxDrum: { name: "Cold Reflux Drum", temperature: "-55 to -35 °F", pressure: "720 - 790 psig", duty: "Phase separation", notes: "Provides cold reflux to wash heavy hydrocarbons from the treated gas." },
    expander: { name: "Turbo-Expander", temperature: "-120 to -70 °F", pressure: "250 - 450 psig", duty: "Power recovery", notes: "Optional NGL recovery path for C2/C3+ recovery before demethanizer." },
    demethanizer: { name: "Demethanizer", temperature: "-140 to 80 °F", pressure: "250 - 450 psig", duty: "Methane rejection", notes: "Separates methane-rich residue gas overhead from Y-grade NGL bottoms." },
    deethanizer: { name: "Deethanizer", temperature: "-20 to 160 °F", pressure: "380 - 520 psig", duty: "Ethane cut", notes: "Produces ethane overhead when ethane recovery is required; otherwise can be bypassed." },
    depropanizer: { name: "Depropanizer", temperature: "90 - 220 °F", pressure: "180 - 260 psig", duty: "Propane recovery", notes: "Separates propane overhead from C4+ bottoms." },
    debutanizer: { name: "Debutanizer", temperature: "120 - 300 °F", pressure: "80 - 150 psig", duty: "Butane / natural gasoline split", notes: "Separates mixed butanes overhead from C5+ natural gasoline bottoms." },
    residueCompressor: { name: "Residue Gas Compressor", temperature: "80 - 120 °F", pressure: "760 - 850 psig", duty: "Compression", notes: "Raises lean gas / residue gas pressure for the main cryogenic exchanger or LNG liquefaction section." },
    nglPump: { name: "NGL Product Pump", temperature: "80 - 120 °F", pressure: "250 - 450 psig", duty: "Product transfer", notes: "Transfers C5+ or Y-grade NGL to storage/fractionation." }
};

const streamData = {
    1: { name: "Treated Gas Feed", phase: "Gas", flow: "100 MMSCFD", temperature: "80 °F", pressure: "800 psig", boundary: "Yes - Inlet from treating/dehydration" },
    2: { name: "Chilled Treated Gas", phase: "Gas", flow: "100 MMSCFD", temperature: "-10 °F", pressure: "785 psig", boundary: "No - Internal" },
    3: { name: "Cold Reflux", phase: "Liquid", flow: "220 GPM", temperature: "-45 °F", pressure: "775 psig", boundary: "No - Internal" },
    4: { name: "Lean Gas to Main Cryogenic Exchanger", phase: "Gas", flow: "92 MMSCFD", temperature: "-30 °F", pressure: "770 psig", boundary: "Yes - Product to liquefaction" },
    5: { name: "Scrub Column Bottoms", phase: "Liquid", flow: "540 GPM", temperature: "20 °F", pressure: "760 psig", boundary: "No - Internal" },
    6: { name: "Expander Feed / NGL Recovery Gas", phase: "Gas", flow: "92 MMSCFD", temperature: "-30 °F", pressure: "770 psig", boundary: "Optional - Turbo-expander route" },
    7: { name: "Demethanizer Overhead Residue Gas", phase: "Gas", flow: "88 MMSCFD", temperature: "-105 °F", pressure: "360 psig", boundary: "No - Internal" },
    8: { name: "Y-Grade NGL", phase: "Liquid", flow: "430 GPM", temperature: "85 °F", pressure: "390 psig", boundary: "No - Internal" },
    9: { name: "Ethane Product", phase: "Gas", flow: "4 MMSCFD", temperature: "35 °F", pressure: "450 psig", boundary: "Yes - Optional product" },
    10: { name: "C3+ to Depropanizer", phase: "Liquid", flow: "360 GPM", temperature: "145 °F", pressure: "430 psig", boundary: "No - Internal" },
    11: { name: "Propane Product", phase: "Liquid", flow: "135 GPM", temperature: "110 °F", pressure: "220 psig", boundary: "Yes - Product" },
    12: { name: "C4+ to Debutanizer", phase: "Liquid", flow: "225 GPM", temperature: "180 °F", pressure: "215 psig", boundary: "No - Internal" },
    13: { name: "Mixed Butanes Product", phase: "Liquid", flow: "95 GPM", temperature: "125 °F", pressure: "120 psig", boundary: "Yes - Product" },
    14: { name: "C5+ Natural Gasoline", phase: "Liquid", flow: "130 GPM", temperature: "170 °F", pressure: "95 psig", boundary: "Yes - Product" },
    15: { name: "Residue Gas to Main Cryogenic Exchanger", phase: "Gas", flow: "88 MMSCFD", temperature: "100 °F", pressure: "815 psig", boundary: "Yes - Product to cryogenic exchanger" }
};

document.addEventListener("DOMContentLoaded", () => {
    initializeTooltips();
    initializeLegendToggle();
    initializeFooterDate();
    updateRangeTable();
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

        element.addEventListener("mouseout", () => {
            tooltip.style.display = "none";
        });
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

            matchingElements.forEach(element => {
                element.classList.toggle("svg-hidden", !isHidden);
            });

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
    if (!streams.length) return;

    const temperatureValues = streams.map(stream => parseNumber(stream.temperature)).filter(Number.isFinite);
    const pressureValues = streams.map(stream => parseNumber(stream.pressure)).filter(Number.isFinite);

    const allFlows = streams
        .map(stream => ({ phase: normalizePhase(stream.phase), flow: parseFlow(stream.flow) }))
        .filter(item => item.flow && Number.isFinite(item.flow.value));

    const gasFlows = allFlows.filter(item => item.phase === "gas" || item.phase === "vapor");
    const liquidFlows = allFlows.filter(item => item.phase === "liquid");

    setSvgText("minTemperature", temperatureValues.length ? `${Math.min(...temperatureValues)} °F` : "-");
    setSvgText("maxTemperature", temperatureValues.length ? `${Math.max(...temperatureValues)} °F` : "-");
    setSvgText("minPressure", pressureValues.length ? `${Math.min(...pressureValues)} psig` : "-");
    setSvgText("maxPressure", pressureValues.length ? `${Math.max(...pressureValues)} psig` : "-");

    setFlowRange("minGasFlow", "maxGasFlow", gasFlows);
    setFlowRange("minLiquidFlow", "maxLiquidFlow", liquidFlows);
}

function normalizePhase(phase) {
    const value = String(phase || "").trim().toLowerCase();
    if (value.includes("gas")) return "gas";
    if (value.includes("vapor")) return "vapor";
    if (value.includes("liquid")) return "liquid";
    if (value.includes("mixed")) return "mixed";
    return "other";
}

function setFlowRange(minElementId, maxElementId, flowItems) {
    if (!flowItems.length) {
        setSvgText(minElementId, "-");
        setSvgText(maxElementId, "-");
        return;
    }

    const grouped = groupFlowsByUnit(flowItems.map(item => item.flow));
    const minText = Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.min(...values))} ${unit}`).join(" / ");
    const maxText = Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.max(...values))} ${unit}`).join(" / ");

    setSvgText(minElementId, minText);
    setSvgText(maxElementId, maxText);
}

function parseNumber(value) {
    if (!value) return NaN;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
}

function parseFlow(flowText) {
    if (!flowText) return null;
    const match = String(flowText).trim().match(/^(-?\d+(\.\d+)?)\s*(.+)$/);
    if (!match) return null;
    return { value: Number(match[1]), unit: match[3].trim() };
}

function groupFlowsByUnit(flowItems) {
    return flowItems.reduce((groups, item) => {
        if (!groups[item.unit]) groups[item.unit] = [];
        groups[item.unit].push(item.value);
        return groups;
    }, {});
}

function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function setSvgText(id, value) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Range table SVG element not found: ${id}`);
        return;
    }
    element.textContent = value;
}
