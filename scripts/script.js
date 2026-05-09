// assets/js/engineeringCharts.js

// -----------------------------
// Shared color theme
// -----------------------------
const theme = {
    text: "#e0e0e0",
    blue: "#1e90ff",
    cyan: "#00bcd4",
    silver: "#c0c0c0"
};

// -----------------------------
// 1. Exponential Curve Chart
// -----------------------------
export function renderExpCurve(canvasId, k = 2.72) {
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
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: "x", color: theme.text },
                    ticks: { color: theme.text }
                },
                y: {
                    title: { display: true, text: `exp(-kx)`, color: theme.text },
                    ticks: { color: theme.text }
                }
            },
            plugins: {
                legend: {
                    labels: { color: theme.text }
                }
            }
        }
    });
}

// -----------------------------
// 2. Temperature Conversion Chart
// -----------------------------
export function renderTemperatureChart(canvasId) {
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
                    backgroundColor: "rgba(30,144,255,0.2)",
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: "Kelvin (K)",
                    data: K,
                    borderColor: theme.cyan,
                    backgroundColor: "rgba(0,188,212,0.2)",
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: "Rankine (°R)",
                    data: R,
                    borderColor: theme.silver,
                    backgroundColor: "rgba(192,192,192,0.2)",
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: theme.text }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: "Temperature (°F)", color: theme.text },
                    ticks: { color: theme.text }
                },
                y: {
                    title: { display: true, text: "Converted Temperature", color: theme.text },
                    ticks: { color: theme.text }
                }
            }
        }
    });
}
