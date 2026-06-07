const cycleSteps = ["Adsorption", "Regeneration (Heating)", "Cooling", "Standby"];
const bedOffsets = { "Bed A": 0, "Bed B": 1, "Bed C": 2, "Bed D": 3 };

const unitData = {
    inletManifold: { name: "Inlet Manifold", temperature: "95 °F", pressure: "950 psig", duty: "-", notes: "Routes wet gas to the bed currently in adsorption." },
    bedA: { name: "Bed A", temperature: "95 - 105 °F", pressure: "940 - 950 psig", duty: "-", notes: "Current step: Adsorption. Removes moisture using molecular sieve." },
    bedB: { name: "Bed B", temperature: "430 - 520 °F", pressure: "900 - 920 psig", duty: "Regeneration heat", notes: "Current step: Regeneration (Heating) with hot dry gas." },
    bedC: { name: "Bed C", temperature: "100 - 180 °F", pressure: "910 - 925 psig", duty: "Cooling service", notes: "Current step: Cooling after regeneration." },
    bedD: { name: "Bed D", temperature: "95 - 105 °F", pressure: "940 psig", duty: "-", notes: "Current step: Standby, ready for adsorption." },
    regenHeater: { name: "Regeneration Heater", temperature: "520 °F", pressure: "920 psig", duty: "Hot gas service", notes: "Heats dry regeneration gas before entering the regenerating bed." },
    regenCooler: { name: "Regeneration Gas Cooler", temperature: "120 °F", pressure: "890 psig", duty: "Cooling service", notes: "Cools wet regeneration gas before water knockout." },
    separator: { name: "Regeneration Gas KO Separator", temperature: "100 - 120 °F", pressure: "880 - 890 psig", duty: "-", notes: "Separates condensed water from regeneration gas." }
};

const streamData = {
    1: { name: "Wet Gas Feed", phase: "Gas", flow: "120 MMSCFD", temperature: "95 °F", pressure: "950 psig", boundary: "Yes - Inlet Feed" },
    2: { name: "Dehydrated Gas Product", phase: "Gas", flow: "119.8 MMSCFD", temperature: "100 °F", pressure: "940 psig", boundary: "Yes - Product" },
    3: { name: "Hot Dry Regeneration Gas", phase: "Gas", flow: "8 MMSCFD", temperature: "520 °F", pressure: "920 psig", boundary: "No - Internal" },
    4: { name: "Wet Regeneration Gas", phase: "Gas", flow: "8.2 MMSCFD", temperature: "430 °F", pressure: "900 psig", boundary: "No - Internal" },
    5: { name: "Cooled Regeneration Gas", phase: "Gas", flow: "8.1 MMSCFD", temperature: "120 °F", pressure: "890 psig", boundary: "No - Internal" },
    6: { name: "Knockout Water", phase: "Liquid", flow: "2.5 GPM", temperature: "100 °F", pressure: "880 psig", boundary: "Yes - Water Draw" },
    7: { name: "Fuel Gas to Heater", phase: "Gas", flow: "0.25 MMSCFD", temperature: "80 °F", pressure: "60 psig", boundary: "Yes - Utility Boundary" },
    8: { name: "Cooling Gas", phase: "Gas", flow: "8 MMSCFD", temperature: "100 °F", pressure: "925 psig", boundary: "No - Internal" }
};

document.addEventListener("DOMContentLoaded", () => {
    initializeTooltips();
    initializeLegendToggle();
    initializeFooterDate();
    populateTimeStepTable();
    initializeDewPointCalculator();
    updateCycleOperatingConditionTable();
});

function populateCurrentCycleTable(currentHour = 0) {
    const body = document.getElementById("currentCycleTableBody");
    if (!body) return;

    const currentStepIndex = (currentHour / 6) % 4;
    const notes = {
        "Adsorption": "Wet gas dehydration; dry product gas outlet.",
        "Regeneration (Heating)": "Hot dry gas removes adsorbed water from the molecular sieve bed.",
        "Cooling": "Cool dry gas lowers bed temperature before standby/adsorption.",
        "Standby": "Waiting bed; ready to switch into adsorption."
    };

    body.innerHTML = "";
    Object.entries(bedOffsets).forEach(([bedName, offset]) => {
        const step = cycleSteps[(currentStepIndex + offset) % cycleSteps.length];
        const row = document.createElement("tr");
        row.innerHTML = `<td>${bedName}</td><td>${step}</td><td>6 hr</td><td>24 hr full cycle</td><td>${notes[step] || "-"}</td>`;
        body.appendChild(row);
    });
}

function populateTimeStepTable() {
    populateCurrentCycleTable(0);
    const body = document.getElementById("timeStepTableBody");
    if (!body) return;

    body.innerHTML = "";
    for (let hour = 0; hour <= 36; hour += 6) {
        const stepIndex = (hour / 6) % 4;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${hour}</td>
            <td>${cycleSteps[(stepIndex + bedOffsets["Bed A"]) % 4]}</td>
            <td>${cycleSteps[(stepIndex + bedOffsets["Bed B"]) % 4]}</td>
            <td>${cycleSteps[(stepIndex + bedOffsets["Bed C"]) % 4]}</td>
            <td>${cycleSteps[(stepIndex + bedOffsets["Bed D"]) % 4]}</td>
        `;
        body.appendChild(row);
    }
}

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
            const isHidden = legendItem.classList.contains("legend-disabled");
            document.querySelectorAll(`[data-layer="${layer}"]`).forEach(element => element.classList.toggle("svg-hidden", !isHidden));
            legendItem.classList.toggle("legend-disabled");
        });
    });
}

function initializeFooterDate() {
    document.querySelectorAll(".footer-date").forEach(element => { element.textContent = new Date().toLocaleDateString(); });
}

function updateCycleOperatingConditionTable() {
    const currentHour = 0;
    const currentStepIndex = (currentHour / 6) % 4;
    const conditionRows = buildCycleOperatingConditions(currentStepIndex);

    conditionRows.forEach((row, index) => {
        setSvgText(`cycleStepName${index}`, row.step);
        setSvgText(`cycleStepBed${index}`, row.bed);
        setSvgText(`cycleStepPressure${index}`, row.pressureText);
        setSvgText(`cycleStepTemperature${index}`, row.temperatureText);
        setSvgText(`cycleStepMoisture${index}`, row.moistureText);
    });
}

function buildCycleOperatingConditions(stepIndex = 0) {
    const userOutletPressure = readNumber("outletPressurePsig");
    const userDewPoint = readNumber("waterDewPointF");
    const adsorptionPressurePsig = Number.isFinite(userOutletPressure) ? userOutletPressure : 940;
    const adsorptionDewPointF = Number.isFinite(userDewPoint) ? userDewPoint : -40;

    const stepConditions = [
        {
            step: "Adsorption",
            pressureText: `${formatNumber(adsorptionPressurePsig, 0)} psig`,
            pressurePsig: adsorptionPressurePsig,
            temperatureText: "95-105 °F",
            dewPointF: adsorptionDewPointF
        },
        {
            step: "Regen Heating",
            pressureText: "900-920 psig",
            pressurePsig: 920,
            temperatureText: "430-520 °F",
            dewPointF: 80
        },
        {
            step: "Cooling",
            pressureText: "910-925 psig",
            pressurePsig: 925,
            temperatureText: "100-180 °F",
            dewPointF: -10
        },
        {
            step: "Standby",
            pressureText: "940 psig",
            pressurePsig: 940,
            temperatureText: "95-105 °F",
            dewPointF: adsorptionDewPointF
        }
    ];

    return stepConditions.map((condition, conditionIndex) => ({
        ...condition,
        bed: findBedInStep(conditionIndex, stepIndex),
        moistureText: `${formatNumber(calculateMoisturePpmv(condition.pressurePsig, condition.dewPointF), 2)} ppmv`
    }));
}

function findBedInStep(targetStepIndex, currentStepIndex = 0) {
    const match = Object.entries(bedOffsets).find(([, offset]) => {
        return ((currentStepIndex + offset) % cycleSteps.length) === targetStepIndex;
    });

    return match ? match[0].replace("Bed ", "") : "-";
}

function initializeDewPointCalculator() {
    const button = document.getElementById("calculateDewPoint");
    if (button) button.addEventListener("click", () => {
        calculateMoistureFromDewPoint();
        updateCycleOperatingConditionTable();
    });

    ["outletPressurePsig", "waterDewPointF", "dryGasFlowMmscfd"].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", () => {
                calculateMoistureFromDewPoint();
                updateCycleOperatingConditionTable();
            });
        }
    });

    calculateMoistureFromDewPoint();
}

function calculateMoisturePpmv(pressurePsig, dewPointF) {
    if (!Number.isFinite(pressurePsig) || !Number.isFinite(dewPointF) || pressurePsig <= -14.7) return NaN;

    const pressurePsia = pressurePsig + 14.6959;
    const dewPointC = (dewPointF - 32) * 5 / 9;
    const waterVpPsia = waterVaporPressurePsia(dewPointC);

    return Math.max(0, (waterVpPsia / pressurePsia) * 1_000_000);
}

function calculateMoistureFromDewPoint() {
    const pressurePsig = readNumber("outletPressurePsig");
    const dewPointF = readNumber("waterDewPointF");
    const dryGasFlow = readNumber("dryGasFlowMmscfd");

    if (![pressurePsig, dewPointF, dryGasFlow].every(Number.isFinite) || pressurePsig <= -14.7 || dryGasFlow < 0) {
        setText("dewPointNote", "Enter valid pressure, dew point, and gas flow values.");
        return;
    }

    const pressurePsia = pressurePsig + 14.6959;
    const dewPointC = (dewPointF - 32) * 5 / 9;
    const waterVpPsia = waterVaporPressurePsia(dewPointC);
    const ppmv = calculateMoisturePpmv(pressurePsig, dewPointF);
    const lbPerMmscf = ppmvToLbPerMmscf(ppmv);
    const waterLbPerDay = lbPerMmscf * dryGasFlow;

    setText("dewPointPressureResult", `${formatNumber(pressurePsia, 1)} psia`);
    setText("waterVpResult", `${formatNumber(waterVpPsia, 5)} psia`);
    setText("moisturePpmvResult", `${formatNumber(ppmv, 2)} ppmv`);
    setText("moistureLbResult", `${formatNumber(lbPerMmscf, 3)} lb/MMscf`);
    setText("waterRateResult", `${formatNumber(waterLbPerDay, 2)} lb/day`);
    setText("dewPointNote", "Method: water vapor pressure at the specified dew point divided by outlet absolute pressure. Uses Antoine correlation above 0 °C and Murphy-Koop ice correlation below 0 °C. Screening calculation; confirm with vendor/simulator for design.");
}

function waterVaporPressurePsia(tempC) {
    if (tempC >= 0) {
        const a = 8.07131, b = 1730.63, c = 233.426;
        const mmHg = Math.pow(10, a - b / (c + tempC));
        return mmHg * 0.0193368;
    }
    const tempK = tempC + 273.15;
    const lnPa = 9.550426 - (5723.265 / tempK) + 3.53068 * Math.log(tempK) - 0.00728332 * tempK;
    return Math.exp(lnPa) * 0.000145038;
}

function ppmvToLbPerMmscf(ppmv) {
    return ppmv * 18.01528 / 379.482 / 1_000_000 * 1_000_000;
}

function normalizePhase(phase) {
    const value = String(phase || "").trim().toLowerCase();
    if (value.includes("gas") || value.includes("vapor")) return "gas";
    if (value.includes("liquid")) return "liquid";
    return "other";
}

function setFlowRange(minElementId, maxElementId, flowItems) {
    if (!flowItems.length) { setSvgText(minElementId, "-"); setSvgText(maxElementId, "-"); return; }
    const grouped = groupFlowsByUnit(flowItems);
    setSvgText(minElementId, Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.min(...values), 2)} ${unit}`).join(" / "));
    setSvgText(maxElementId, Object.entries(grouped).map(([unit, values]) => `${formatNumber(Math.max(...values), 2)} ${unit}`).join(" / "));
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
        if (!groups[item.unit]) groups[item.unit] = [];
        groups[item.unit].push(item.value);
        return groups;
    }, {});
}

function formatNumber(value, digits = 1) {
    if (!Number.isFinite(value)) return "-";
    if (Math.abs(value) >= 100) return value.toFixed(digits).replace(/\.0$/, "");
    return value.toFixed(digits).replace(/\.?0+$/, "");
}

function readNumber(id) {
    const element = document.getElementById(id);
    return element ? Number(element.value) : NaN;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setSvgText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
