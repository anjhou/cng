// /scripts/rbob-3mo.js
// Fetches RBOB spot prices (NY Harbor) for last 3 months using EIA API
// Series ID: PET.EER_EPMRR_PF4_Y35_DPG (Daily RBOB Spot Price, NY Harbor)

(async function () {
    const apiKey = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";
    const seriesId = "PET.EER_EPMRR_PF4_Y35_DPG";

    // Calculate date range for last 3 months
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);

    const format = (d) => d.toISOString().split("T")[0];

    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[series][]=EER_EPMRR_PF4_Y35_DPG&start=${format(start)}&end=${format(end)}`;

    const response = await fetch(url);
    const json = await response.json();

    // Extract and sort data by date ascending
    const records = json.response.data
        .map(r => ({ date: r.period, value: r.value }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = records.map(r => r.date);
    const values = records.map(r => r.value);

    // Build Chart.js line chart
    const ctx = document.getElementById("rbobChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "RBOB Spot Price (NY Harbor) — USD/gal",
                data: values,
                borderColor: "#1e90ff",
                backgroundColor: "rgba(30,144,255,0.2)",
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: "USD per Gallon" }
                }
            }
        }
    });
})();
