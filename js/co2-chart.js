// co2-chart.js
// Chart.js bar chart for CO₂ captured/emitted/avoided

let chartInstance = null;

export function renderCO2Chart(ctx, data) {
    const { nCaptured, nEmitted, nAvoided } = data;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Captured', 'Emitted', 'Avoided'],
            datasets: [{
                label: 'CO₂ Flow (lb-mol/hr)',
                data: [nCaptured, nEmitted, nAvoided],
                backgroundColor: [
                    'rgba(0, 102, 204, 0.7)',
                    'rgba(200, 50, 50, 0.7)',
                    'rgba(0, 153, 102, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
