/* ============================================================
   GLOBAL CHART DEFAULTS (Deep Blue / Silver Theme)
   ============================================================ */
Chart.defaults.font.family = "Arial, sans-serif";
Chart.defaults.color = "#222";
Chart.defaults.borderColor = "#999";

Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.boxHeight = 12;

Chart.defaults.elements.line.tension = 0.15;
Chart.defaults.elements.point.radius = 0;

/* ============================================================
   UTILITY: AUTO COLORS
   ============================================================ */
const colorPalette = [
    "#1f77b4", "#ff7f0e", "#2ca02c",
    "#d62728", "#9467bd", "#8c564b",
    "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

/* ============================================================
   1. EXPONENTIAL DECAY CHART
   ============================================================ */
export function renderExpCurve(canvasId, inputId, buttonId) {

    function clampK(k) {
        if (k < 0.1) return 0.1;
        if (k > 10) return 10;
        return k;
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
            ctx.fillStyle = chart.options.color || "#000";

            const pad = 10;
            ctx.fillText(`k = ${options.kValue}`, pad, pad + 10);
            ctx.fillText(`y = exp(-k·x)`, pad, pad + 30);

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
                    borderColor: "#1f77b4",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    topLeftTextPlugin: { kValue: k }
                },
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

/* ============================================================
   2. TEMPERATURE CONVERSION CHART
   ============================================================ */
export function renderTemperatureChart(canvasId) {

    document.addEventListener("DOMContentLoaded", () => {
        const canvas = document.getElementById(canvasId);

        const celsius = [];
        const fahrenheit = [];

        for (let c = -40; c <= 120; c += 5) {
            celsius.push(c);
            fahrenheit.push(c * 9/5 + 32);
        }

        new Chart(canvas, {
            type: "line",
            data: {
                labels: celsius,
                datasets: [{
                    label: "Fahrenheit (°F)",
                    data: fahrenheit,
                    borderColor: "#ff7f0e",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: "Celsius (°C)" } },
                    y: { title: { display: true, text: "Fahrenheit (°F)" } }
                }
            }
        });
    });
}

/* ============================================================
   3. CSV MULTI‑SERIES CHART (FILE INPUT)
   ============================================================ */
export function renderMultiSeriesCSV(canvasId, fileInputId) {

    document.addEventListener("DOMContentLoaded", () => {
        const canvas = document.getElementById(canvasId);
        const fileInput = document.getElementById(fileInputId);

        let chart = null;

        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const text = await file.text();
            const rows = text.trim().split("\n").map(r => r.split(","));

            const headers = rows[0];
            const dataRows = rows.slice(1);

            const labels = dataRows.map(r => r[0]);
            const datasets = [];

            for (let col = 1; col < headers.length; col++) {
                datasets.push({
                    label: headers[col],
                    data: dataRows.map(r => parseFloat(r[col])),
                    borderColor: colorPalette[col % colorPalette.length],
                    borderWidth: 2
                });
            }

            if (chart) chart.destroy();

            chart = new Chart(canvas, {
                type: "line",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    scales: {
                        x: { title: { display: true, text: headers[0] } },
                        y: { title: { display: true, text: "Values" } }
                    }
                }
            });
        });
    });
}

/* ============================================================
   4. CSV MULTI‑SERIES CHART (STATIC CSV PATH)
   ============================================================ */
export function renderCsvMultiSeriesChart({ 
    canvasId, csvPath, xKey, yKeys, chartTitle, yLabel 
}) {

    document.addEventListener("DOMContentLoaded", async () => {
        const canvas = document.getElementById(canvasId);

        const response = await fetch(csvPath);
        const text = await response.text();

        const rows = text.trim().split("\n").map(r => r.split(","));
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const labels = dataRows.map(r => r[headers.indexOf(xKey)]);

        const datasets = yKeys.map((key, idx) => ({
            label: key,
            data: dataRows.map(r => parseFloat(r[headers.indexOf(key)])),
            borderColor: colorPalette[idx % colorPalette.length],
            borderWidth: 2
        }));

        new Chart(canvas, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: chartTitle }
                },
                scales: {
                    x: { title: { display: true, text: xKey } },
                    y: { title: { display: true, text: yLabel } }
                }
            }
        });
    });
}
