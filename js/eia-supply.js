let supplyChart = null;
let mergedRows = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loadBtn").addEventListener("click", loadEiaSupply);
    document.getElementById("exportBtn").addEventListener("click", exportCsv);
});

async function fetchSeries(seriesId, apiKey, limit) {
    const url =
        `https://api.eia.gov/v2/seriesid/${encodeURIComponent(seriesId)}?api_key=${apiKey}`;

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
    const apiKey = document.getElementById("apiKey").value.trim();
    const limit = Number(document.getElementById("limit").value || 60);
    const status = document.getElementById("status");

    const selected = getSelectedSeries();

    if (!apiKey) {
        alert("Enter EIA API Key");
        return;
    }

    if (selected.length === 0) {
        alert("Select one or more series");
        return;
    }

    try {
        status.innerHTML = "Loading...";

        const allData = await Promise.all(
            selected.map(series =>
                fetchSeries(series.id, apiKey, limit)
            )
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
        .sort((a, b) =>
            String(a.period).localeCompare(String(b.period))
        );
}

function drawChart(selected) {
    const canvas = document.getElementById("supplyChart");
    const ctx = canvas.getContext("2d");

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
                    position: "bottom",
                    onClick: (event, legendItem, legend) => {
                        const chart = legend.chart;
                        const index = legendItem.datasetIndex;

                        chart.setDatasetVisibility(
                            index,
                            !chart.isDatasetVisible(index)
                        );

                        chart.update();
                    }
                },

                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: context => {
                            const value = context.parsed.y;

                            if (value === null || value === undefined) {
                                return `${context.dataset.label}: N/A`;
                            }

                            return `${context.dataset.label}: ${value.toLocaleString()}`;
                        }
                    }
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
                    },

                    ticks: {
                        callback: value => Number(value).toLocaleString()
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

            html += `<td>${
                value === undefined || value === null
                    ? ""
                    : value.toLocaleString()
            }</td>`;
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
            ...selected.map(series => {
                const value = row[series.id];
                return value === undefined || value === null ? "" : value;
            })
        ];

        csvRows.push(values.join(","));
    });

    const blob = new Blob(
        [csvRows.join("\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "eia_supply_data.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}