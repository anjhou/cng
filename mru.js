const unitData = {
    inletFilter: { name: "Inlet Coalescing Filter", temperature: "70 - 110 °F", pressure: "760 - 820 psig", duty: "Solids / liquid mist removal", notes: "Protects mercury adsorbent from aerosol liquids, corrosion products, and entrained solids." },
    leadAdsorber: { name: "MRU Lead Fixed-Bed Adsorber", temperature: "70 - 110 °F", pressure: "750 - 815 psig", duty: "Mercury capture", notes: "Primary sulfur-impregnated activated carbon bed; designed for bulk elemental mercury removal." },
    lagAdsorber: { name: "MRU Lag / Guard Fixed-Bed Adsorber", temperature: "70 - 110 °F", pressure: "745 - 810 psig", duty: "Polishing / guard service", notes: "Second bed provides breakthrough protection and allows lead-lag switching during adsorbent replacement." },
    bypassValve: { name: "MRU Bypass Valve", temperature: "70 - 110 °F", pressure: "760 - 820 psig", duty: "Maintenance bypass", notes: "Normally closed; shown for maintenance or controlled commissioning bypass only." },
    outletFilter: { name: "Outlet Dust Filter", temperature: "70 - 110 °F", pressure: "740 - 805 psig", duty: "Carbon fines removal", notes: "Captures adsorbent fines before gas continues to NGL / heavy hydrocarbon removal." },
    hgAnalyzer: { name: "Mercury Analyzer / Sample Panel", temperature: "Ambient", pressure: "Sample conditioning", duty: "Online monitoring", notes: "Monitors MRU outlet mercury concentration and supports breakthrough surveillance." },
    drainDrum: { name: "Closed Drain / Spent Carbon Handling", temperature: "Ambient", pressure: "0 - 5 psig", duty: "Maintenance containment", notes: "Receives filter liquids and supports contained handling during bed change-out." }
};

const streamData = {
    1: { name: "Dry Gas Feed", phase: "Gas", flow: "100 MMSCFD", temperature: "90 °F", pressure: "800 psig", boundary: "Yes - Inlet from dehydration" },
    2: { name: "Filtered Dry Gas", phase: "Gas", flow: "100 MMSCFD", temperature: "90 °F", pressure: "795 psig", boundary: "No - Internal" },
    3: { name: "Lead Bed Effluent", phase: "Gas", flow: "100 MMSCFD", temperature: "92 °F", pressure: "785 psig", boundary: "No - Internal" },
    4: { name: "Lag Bed Effluent", phase: "Gas", flow: "100 MMSCFD", temperature: "92 °F", pressure: "775 psig", boundary: "No - Internal" },
    5: { name: "Treated Gas to NGL / Heavy HC Removal", phase: "Gas", flow: "100 MMSCFD", temperature: "92 °F", pressure: "770 psig", boundary: "Yes - Product to NGL removal" },
    6: { name: "Maintenance Bypass Gas", phase: "Gas", flow: "100 MMSCFD", temperature: "90 °F", pressure: "790 psig", boundary: "Normally closed / maintenance" },
    7: { name: "Analyzer Sample Gas", phase: "Gas", flow: "0.02 MMSCFD", temperature: "90 °F", pressure: "50 psig", boundary: "Yes - Sample vent / return" },
    8: { name: "Filter Liquid Drain", phase: "Liquid", flow: "2 GPM", temperature: "90 °F", pressure: "5 psig", boundary: "Yes - Closed drain" },
    9: { name: "Spent Carbon Removal", phase: "Solid", flow: "Batch", temperature: "Ambient", pressure: "0 psig", boundary: "Maintenance boundary" }
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
    if (value.includes("solid")) return "solid";
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
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function setSvgText(id, value) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Range table SVG element not found: ${id}`);
        return;
    }
    element.textContent = value;
}
