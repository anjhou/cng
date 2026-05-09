// 20260509 Start
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
// 20260509 END