const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

let supplyChart = null;
let mergedRows = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loadBtn").addEventListener("click", loadEiaSupply);
    document.getElementById("exportBtn").addEventListener("click", exportCsv);
});

async function fetchSeries(seriesId, limit) {
    const url =
        `https://api.eia.gov/v2/seriesid/${encodeURIComponent(seriesId)}?api_key=${EIA_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Unable to load ${seriesId}`);
    }

    const json = await response.json();

    if (!json.response || !json.response.data) {
        throw new Error(`No data returned for ${seriesId}`);
    }

    return json.response.data
        .slice(0, limit)
        .map(row => ({
            period: row.period,
            value: Number(row.value),
            series: seriesId
        }))
        .filter(row => Number.isFinite(row.value))
        .reverse();
}

async function loadEiaSupply() {
    const limit = Number(document.getElementById("limit").value || 60);
    const status = document.getElementById("status");
    const selected = getSelectedSeries();

    if (selected.length === 0) {
        alert("Select one or more series");
        return;
    }

    try {
        status.innerHTML = "Loading...";

        const allData = await Promise.all(
            selected.map(series => fetchSeries(series.id, limit))
        );

        buildMergedData(allData);
        drawChart(selected);
        drawTable(selected);

        status.innerHTML = `${selected.length} series loaded`;
    } catch (error) {
        console.error(error);
        status.innerHTML = error.message;
    }
}

function getSelectedSeries() {
    return [...document.getElementById("seriesSelect").selectedOptions]
        .map(option => ({
            id: option.value,
            label: option.textContent.trim()
        }));
}

function buildMergedData(allData) {
    const periodMap = new Map();

    allData.flat().forEach(row => {
        if (!periodMap.has(row.period)) {
            periodMap.set(row.period, { period: row.period });
        }

        periodMap.get(row.period)[row.series] = row.value;
    });

    mergedRows = [...periodMap.values()]
        .sort((a, b) => String(a.period).localeCompare(String(b.period)));
}

function drawChart(selected) {
    const ctx = document.getElementById("supplyChart").getContext("2d");

    if (supplyChart) {
        supplyChart.destroy();
    }

    supplyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: mergedRows.map(row => row.period),
            datasets: selected.map(series => ({
                label: series.label,
                data: mergedRows.map(row => row[series.id] ?? null),
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 2,
                spanGaps: true
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Period"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Volume, thousand barrels/day"
                    }
                }
            }
        }
    });
}

function drawTable(selected) {
    const table = document.getElementById("dataTable");

    let html = "<thead><tr><th>Period</th>";

    selected.forEach(series => {
        html += `<th>${series.label}</th>`;
    });

    html += "</tr></thead><tbody>";

    mergedRows.forEach(row => {
        html += `<tr><td>${row.period}</td>`;

        selected.forEach(series => {
            const value = row[series.id];
            html += `<td>${value == null ? "" : value.toLocaleString()}</td>`;
        });

        html += "</tr>";
    });

    html += "</tbody>";
    table.innerHTML = html;
}

function exportCsv() {
    if (!mergedRows.length) {
        alert("No data available to export.");
        return;
    }

    const selected = getSelectedSeries();

    const headers = [
        "Period",
        ...selected.map(series => `"${series.label}"`)
    ];

    const csvRows = [headers.join(",")];

    mergedRows.forEach(row => {
        const values = [
            row.period,
            ...selected.map(series => row[series.id] ?? "")
        ];

        csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "eia_supply_data.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}