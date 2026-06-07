const unitData = {
    absorber: {
        name: "Absorber",
        temperature: "100 - 130 °F",
        pressure: "830 - 875 psig",
        duty: "-",
        notes: "Sour gas contacting with lean amine"
    },
    regenerator: {
        name: "Regenerator",
        temperature: "220 - 260 °F",
        pressure: "10 - 15 psig",
        duty: "-",
        notes: "Acid gas stripping from rich amine"
    },
    reboiler: {
        name: "Reboiler",
        temperature: "250 - 270 °F",
        pressure: "12 - 18 psig",
        duty: "25 MMBtu/hr",
        notes: "Provides stripping vapor to regenerator"
    },
    condenser: {
        name: "Condenser",
        temperature: "100 - 120 °F",
        pressure: "8 - 12 psig",
        duty: "3 MMBtu/hr",
        notes: "Condenses overhead water vapor"
    },
    makeupWater: {
        name: "Makeup Water Tank",
        temperature: "80 °F",
        pressure: "0 psig",
        duty: "-",
        notes: "Water makeup to amine circulation loop"
    },
    leanCooler: {
        name: "Lean Amine Cooler",
        temperature: "115 °F",
        pressure: "875 psig",
        duty: "Cooling Service",
        notes: "Cools regenerated lean amine before absorber"
    },
    amineExchanger: {
        name: "Lean/Rich Amine Exchanger",
        temperature: "130 - 220 °F",
        pressure: "850 - 875 psig",
        duty: "Heat Recovery",
        notes: "Preheats rich amine and cools lean amine"
    },
    refluxDrum: {
        name: "Reflux Drum",
        temperature: "105 - 115 °F",
        pressure: "8 - 12 psig",
        duty: "-",
        notes: "Separates reflux water and acid gas"
    }
};

const streamData = {
    1: { name: "Sour Gas Feed", phase: "Gas", flow: "85 MMSCFD", temperature: "100 °F", pressure: "850 psig", boundary: "Yes - Inlet Feed" },
    2: { name: "Sweet Gas Product", phase: "Gas", flow: "83 MMSCFD", temperature: "105 °F", pressure: "830 psig", boundary: "Yes - Product" },
    3: { name: "Lean Amine", phase: "Liquid", flow: "650 GPM", temperature: "115 °F", pressure: "875 psig", boundary: "No - Internal" },
    4: { name: "Rich Amine", phase: "Liquid", flow: "655 GPM", temperature: "130 °F", pressure: "860 psig", boundary: "No - Internal" },
    5: { name: "Acid Gas", phase: "Gas", flow: "2.5 MMSCFD", temperature: "110 °F", pressure: "12 psig", boundary: "Yes - Offgas" },
    6: { name: "Makeup Water", phase: "Liquid", flow: "15 GPM", temperature: "80 °F", pressure: "0 psig", boundary: "Yes - Utility Boundary" },
    7: { name: "Steam to Reboiler", phase: "Vapor", flow: "12 klb/hr", temperature: "350 °F", pressure: "150 psig", boundary: "Yes - Utility Boundary" },
    8: { name: "Condensate from Reboiler", phase: "Liquid", flow: "25 GPM", temperature: "250 °F", pressure: "50 psig", boundary: "Yes - Utility Boundary" },
    9: { name: "Reflux Water", phase: "Liquid", flow: "40 GPM", temperature: "110 °F", pressure: "10 psig", boundary: "No - Internal" },
    10: { name: "Regenerator Overhead Vapor", phase: "Gas", flow: "3.0 MMSCFD", temperature: "220 °F", pressure: "12 psig", boundary: "No - Internal" }
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

        return `
            <strong>${unit.name}</strong><br>
            Temperature: ${unit.temperature}<br>
            Pressure: ${unit.pressure}<br>
            Duty: ${unit.duty}<br>
            Notes: ${unit.notes}
        `;
    }

    if (type === "stream") {
        const stream = streamData[id];

        if (!stream) return "";

        return `
            <strong>Stream ${id}: ${stream.name}</strong><br>
            Phase: ${stream.phase}<br>
            Flow: ${stream.flow}<br>
            Temperature: ${stream.temperature}<br>
            Pressure: ${stream.pressure}<br>
            Boundary: ${stream.boundary}
        `;
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
                if (isHidden) {
                    element.classList.remove("svg-hidden");
                } else {
                    element.classList.add("svg-hidden");
                }
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
/**/
function updateRangeTable() {
    const streams = Object.values(streamData);

    const temperatureValues = streams
        .map(stream => parseNumber(stream.temperature))
        .filter(Number.isFinite);

    const pressureValues = streams
        .map(stream => parseNumber(stream.pressure))
        .filter(Number.isFinite);

    const allFlows = streams
        .map(stream => ({
            phase: normalizePhase(stream.phase),
            flow: parseFlow(stream.flow)
        }))
        .filter(item => item.flow && Number.isFinite(item.flow.value));

    const gasFlows = allFlows.filter(item => item.phase === "gas");
    const liquidFlows = allFlows.filter(item => item.phase === "liquid");
    const mixedFlows = allFlows.filter(item => item.phase === "mixed" || item.phase === "vapor" || item.phase === "other");

    setSvgText("minTemperature", `${Math.min(...temperatureValues)} °F`);
    setSvgText("maxTemperature", `${Math.max(...temperatureValues)} °F`);

    setSvgText("minPressure", `${Math.min(...pressureValues)} psig`);
    setSvgText("maxPressure", `${Math.max(...pressureValues)} psig`);

    setFlowRange("minTotalFlow", "maxTotalFlow", allFlows);
    setFlowRange("minGasFlow", "maxGasFlow", gasFlows);
    setFlowRange("minLiquidFlow", "maxLiquidFlow", liquidFlows);
    setFlowRange("minMixedFlow", "maxMixedFlow", mixedFlows);
}

function normalizePhase(phase) {
    const value = String(phase || "").trim().toLowerCase();

    if (value.includes("gas")) return "gas";
    if (value.includes("liquid")) return "liquid";
    if (value.includes("vapor")) return "vapor";
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

    const minText = Object.entries(grouped)
        .map(([unit, values]) => `${formatNumber(Math.min(...values))} ${unit}`)
        .join(" / ");

    const maxText = Object.entries(grouped)
        .map(([unit, values]) => `${formatNumber(Math.max(...values))} ${unit}`)
        .join(" / ");

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

    return {
        value: Number(match[1]),
        unit: match[3].trim()
    };
}

function groupFlowsByUnit(flowItems) {
    return flowItems.reduce((groups, item) => {
        if (!groups[item.unit]) {
            groups[item.unit] = [];
        }

        groups[item.unit].push(item.value);
        return groups;
    }, {});
}

function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function setSvgText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}
}
/**/
function parseNumber(value) {
    if (!value) return NaN;

    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
}

function parseFlow(flowText) {
    if (!flowText) return null;

    const match = String(flowText).trim().match(/^(-?\d+(\.\d+)?)\s*(.+)$/);

    if (!match) return null;

    return {
        value: Number(match[1]),
        unit: match[3].trim()
    };
}

function groupFlowsByUnit(flowItems) {
    return flowItems.reduce((groups, item) => {
        if (!groups[item.unit]) {
            groups[item.unit] = [];
        }

        groups[item.unit].push(item.value);
        return groups;
    }, {});
}
/*
function setSvgText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}
*/
/**/
function setSvgText(id, value) {
    const element = document.querySelector(`#${id}`);

    if (!element) {
        console.warn(`SVG range-table element not found: ${id}`);
        return;
    }

    element.textContent = value;
}
