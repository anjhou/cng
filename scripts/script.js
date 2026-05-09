// ============================================================================
// engineeringCharts.js
// Unified chart library for Houston CNG Consulting
// ============================================================================

// --------------------------------------------------
// Global Chart.js Defaults (Consulting Theme)
// --------------------------------------------------
Chart.defaults.color = "#e0e0e0";
Chart.defaults.font.size = 14;
Chart.defaults.borderColor = "rgba(255,255,255,0.15)";

Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = "line";
Chart.defaults.plugins.legend.labels.boxWidth = 12;

Chart.defaults.elements.line.borderWidth = 2;
Chart.defaults.elements.line.tension = 0.25;

Chart.defaults.elements.point.radius = 0;
Chart.defaults.elements.point.hoverRadius = 4;

Chart.defaults.layout.padding = 20;

Chart.defaults.animation.duration = 600;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// --------------------------------------------------
// Shared Theme
// --------------------------------------------------
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

// --------------------------------------------------
// Shared Utility: Standard Canvas Size
// --------------------------------------------------
function setCanvasSize(canvasId, width = 900, height = 450) {
    const canvas = document.getElementById(canvasId);
    canvas.width = width;
    canvas.height = height;
}

// --------------------------------------------------
// 1. Exponential Curve Chart
// --------------------------------------------------
export function renderExpCurve(canvasId, k = 2.72) {
    setCanvasSize(canvasId);

    const xValues = [];
    const yValues = [];

    for (let i = 0; i <= 200; i++) {
        const x = i / 200;
        xValues.push(x);
        yValues.push(Math.exp(-k * x));
    }

    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: xValues,
            datasets: [{
                label: `exp(-${k}x)`,
                data: yValues,
                borderColor: theme.blue,
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "x" } },
                y: { title: { display: true, text: "exp(-kx)" } }
            }
        }
    });
}

// --------------------------------------------------
// 2. Temperature Conversion Chart (F → C/K/R)
// --------------------------------------------------
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
                {
                    label: "Celsius (°C)",
                    data: C,
                    borderColor: theme.blue,
                    backgroundColor: "rgba(30,144,255,0.2)"
                },
                {
                    label: "Kelvin (K)",
                    data: K,
                    borderColor: theme.cyan,
                    backgroundColor: "rgba(0,188,212,0.2)"
                },
                {
                    label: "Rankine (°R)",
                    data: R,
                    borderColor: theme.silver,
                    backgroundColor: "rgba(192,192,192,0.2)"
                }
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

// --------------------------------------------------
// 3. CSV Multi-Series Chart (Auto-detect columns)
// --------------------------------------------------
export async function renderCSVChart(csvPath, canvasId) {
    setCanvasSize(canvasId);

    const response = await fetch(csvPath);
    const csvText = await response.text();

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    const labels = [];
    const datasets = [];

    // Create dataset objects for each numeric column
    for (let i = 1; i < headers.length; i++) {
        datasets.push({
            label: headers[i],
            data: [],
            borderColor: getColor(i - 1),
            backgroundColor: getColor(i - 1, 0.2)
        });
    }

    // Parse rows
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
