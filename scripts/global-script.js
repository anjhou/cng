/* ============================================================================
   Houston Chemical & Energy AI Consulting
   global-script.js — Unified Script File (Header Loader + Chart Library)
   ============================================================================ */

/* ============================================================================
   0. MODULAR HEADER LOADER
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header");
    if (!headerContainer) return;

    fetch("/header.html")
        .then(res => res.ok ? res.text() : "")
        .then(html => headerContainer.innerHTML = html)
        .catch(err => console.error("Header load error:", err));
});

/* ============================================================================
   1. GLOBAL CHART DEFAULTS — Deep Blue / Silver Theme
   ============================================================================ */
Chart.defaults.color = "#e0e0e0";
Chart.defaults.font.family = "Arial, sans-serif";
Chart.defaults.font.size = 14;
Chart.defaults.borderColor = "rgba(255,255,255,0.15)";

Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = "line";
Chart.defaults.plugins.legend.labels.boxWidth = 12;

Chart.defaults.elements.line.borderWidth = 2;
Chart.defaults.elements.line.tension = 0.20;

Chart.defaults.elements.point.radius = 0;
Chart.defaults.elements.point.hoverRadius = 4;

Chart.defaults.layout.padding = 20;
Chart.defaults.animation.duration = 600;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

/* ============================================================================
   2. THEME + COLOR UTILITIES
   ============================================================================ */
const theme = {
    text: "#e0e0e0",
    blue: "#1e90ff",
    cyan: "#00bcd4",
    silver: "#c0c0c0",
    palette: [
        "rgba(31,119,180,ALPHA)",
        "rgba(255,127,14,ALPHA)",
        "rgba(44,160,44,ALPHA)",
        "rgba(214,39,40,ALPHA)",
        "rgba(148,103,189,ALPHA)",
        "rgba(140,86,75,ALPHA)"
    ]
};

function getColor(index, alpha = 1) {
    return theme.palette[index % theme.palette.length].replace("ALPHA", alpha);
}

function setCanvasSize(canvasId, width = 900, height = 450) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
}

/* ============================================================================
   3. EXPONENTIAL DECAY CHART
   ============================================================================ */
export function renderExpCurve(canvasId, inputId, buttonId) {
    function clampK(k) {
        return Math.min(Math.max(k, 0.1), 10);
    }

    function generateCurve(k) {
        const xmin = -Math.log(10) / k;
        const xmax =  Math.log(10) / k;

        const xValues = [];
        const yValues = [];

        const steps = 200;
        for (let i = 0; i <= steps; i++) {
            const x = xmin + (i / steps) * (xmax - xmin);
            xValues.push(x);
            yValues.push(Math.exp(-k * x));
        }
        return { xValues, yValues };
    }

    const topLeftTextPlugin = {
        id: "topLeftTextPlugin",
        afterDraw(chart, args, options) {
            const { ctx } = chart;
            ctx.save();
            ctx.font = "14px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(`k = ${options.kValue}`, 10, 20);
            ctx.fillText(`y = exp(-k·x)`, 10, 40);
            ctx.restore();
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const canvas = document.getElementById(canvasId);
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        let k = clampK(parseFloat(input.value) || 2.72);
        input.value = k;

        let { xValues, yValues } = generateCurve(k);

        const chart = new Chart(canvas, {
            type: "line",
            data: {
                labels: xValues,
                datasets: [{
                    label: `exp(-${k}x)`,
                    data: yValues,
                    borderColor: theme.blue
                }]
            },
            options: {
                plugins: { topLeftTextPlugin: { kValue: k } },
                scales: {
                    x: { title: { display: true, text: "x" } },
                    y: { title: { display: true, text: "exp(-k·x)" } }
                }
            },
            plugins: [topLeftTextPlugin]
        });

        button.addEventListener("click", () => {
            let newK = clampK(parseFloat(input.value));
            input.value = newK;

            const { xValues, yValues } = generateCurve(newK);

            chart.data.labels = xValues;
            chart.data.datasets[0].data = yValues;
            chart.data.datasets[0].label = `exp(-${newK}x)`;
            chart.options.plugins.topLeftTextPlugin.kValue = newK;

            chart.update();
        });
    });
}

/* ============================================================================
   4. TEMPERATURE CONVERSION CHART (F → C/K/R)
   ============================================================================ */
export function renderTemperatureChart(canvasId) {
    setCanvasSize(canvasId);

    const F = [];
    for (let t = -150; t <= 1150; t += 10) F.push(t);

    const C = F.map(f => (f - 32) * 5/9);
    const K = C.map(c => c + 273.15);
    const R = F.map(f => f + 459.67);

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: F,
            datasets: [
                { label: "Celsius (°C)", data: C, borderColor: theme.blue },
                { label: "Kelvin (K)", data: K, borderColor: theme.cyan },
                { label: "Rankine (°R)", data: R, borderColor: theme.silver }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Temperature (°F)" } },
                y: { title: { display: true, text: "Converted Temperature" } }
            }
        }
    });
}

/* ============================================================================
   5. CSV MULTI‑SERIES CHART (AUTO-DETECT COLUMNS)
   ============================================================================ */
export async function renderCSVChart(csvPath, canvasId) {
    setCanvasSize(canvasId);

    const response = await fetch(csvPath);
    const csvText = await response.text();

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    const labels = [];
    const datasets = [];

    for (let i = 1; i < headers.length; i++) {
        datasets.push({
            label: headers[i],
            data: [],
            borderColor: getColor(i - 1),
            backgroundColor: getColor(i - 1, 0.2)
        });
    }

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        labels.push(cols[0]);

        for (let j = 1; j < cols.length; j++) {
            datasets[j - 1].data.push(parseFloat(cols[j]));
        }
    }

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            scales: {
                x: { title: { display: true, text: headers[0] } },
                y: { title: { display: true, text: "Values" } }
            }
        }
    });
}

/* ============================================================================
   6. SIMPLE CSV CHART (Single-Series)
   ============================================================================ */
export async function renderSimpleCSVChart({
    csvPath = "/data/mydata.csv",
    canvasId = "csvChart",
    label = "CSV Trend"
}) {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n").slice(1);

    const labels = [];
    const values = [];

    rows.forEach(row => {
        const [date, value] = row.split(",");
        labels.push(date);
        values.push(parseFloat(value));
    });

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                borderColor: "#1f77b4",
                backgroundColor: "rgba(31,119,180,0.2)",
                borderWidth: 2,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "Date" }},
                y: { title: { display: true, text: "Value" }}
            }
        }
    });
}

/* ============================================================================
   7. MULTI‑SERIES CSV CHART (Multi-Series)
   ============================================================================ */
export async function renderMultiSeriesCSVChart({
    csvPath = "/data/multiseries.csv",
    canvasId = "multiSeriesChart"
}) {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    const labels = [];
    const datasets = [];

    for (let i = 1; i < headers.length; i++) {
        datasets.push({
            label: headers[i],
            data: [],
            borderWidth: 2,
            tension: 0.25,
            borderColor: getColor(i),
            backgroundColor: getColor(i, 0.2)
        });
    }

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        labels.push(cols[0]);

        for (let j = 1; j < cols.length; j++) {
            datasets[j - 1].data.push(parseFloat(cols[j]));
        }
    }

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top" }
            },
            scales: {
                x: { title: { display: true, text: "Date" }},
                y: { title: { display: true, text: "Value" }}
            }
        }
    });
}

/* ============================================================================
   8. PRICE TABLE LOADER (Your new script merged)
   ============================================================================ */
export async function renderPriceTable({
    csvPath = "/data/prices.csv",
    containerId = "priceTableContainer"
} = {}) {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const rows = csvText.trim().split("\n");
    const headers = rows[0].split(",");

    let html = `<table class="price-table"><thead><tr>`;

    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });

    html += `</tr></thead><tbody>`;

    rows.slice(1).forEach(row => {
        const cols = row.split(",");
        html += "<tr>";
        cols.forEach(c => {
            html += `<td>${c}</td>`;
        });
        html += "</tr>";
    });

    html += "</tbody></table>";

    document.getElementById(containerId).innerHTML = html;
}
