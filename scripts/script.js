// 20260509-A Start
// 20260509-A exp(-k * x)
document.addEventListener("DOMContentLoaded", function () {

    function generateCurve(k) {
        const xValues = [];
        const yValues = [];
        for (let i = 0; i <= 200; i++) {
            const x = i / 200;
            xValues.push(x);
            yValues.push(Math.exp(-k * x));
        }
        return { xValues, yValues };
    }

    // Initial curve with k = 2.72
    let { xValues, yValues } = generateCurve(2.72);

    const ctx = document.getElementById("expPlot");
    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: xValues,
            datasets: [{
                label: "exp(-2.72x)",
                data: yValues,
                borderColor: "#1f77b4",
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: "x" } },
                y: { title: { display: true, text: "exp(-k·x)" } }
            }
        }
    });

    document.getElementById("updateBtn").addEventListener("click", function () {
        const k = parseFloat(document.getElementById("kInput").value);
        if (isNaN(k) || k < 0) return;

        const { xValues, yValues } = generateCurve(k);

        chart.data.labels = xValues;
        chart.data.datasets[0].data = yValues;
        chart.data.datasets[0].label = `exp(-${k}x)`;
        chart.update();
    });
});
// 20260509-A END
	

// 20260509-B Start
// tempChart
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
                    borderColor: "#1e90ff",
                    backgroundColor: "rgba(30,144,255,0.2)",
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: "Kelvin (K)",
                    data: K,
                    borderColor: "#00bcd4",
                    backgroundColor: "rgba(0,188,212,0.2)",
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: "Rankine (°R)",
                    data: R,
                    borderColor: "#c0c0c0",
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
                    labels: {
                        color: "#e0e0e0",
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Temperature (°F)",
                        color: "#e0e0e0"
                    },
                    ticks: { color: "#e0e0e0" }
                },
                y: {
                    title: {
                        display: true,
                        text: "Converted Temperature",
                        color: "#e0e0e0"
                    },
                    ticks: { color: "#e0e0e0" }
                }
            }
        }
    });
}
// 20260509-B END