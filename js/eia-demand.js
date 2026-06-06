"use strict";

/*
  EIA demand chart
  Data source: U.S. Energy Information Administration petroleum API.
  API key is intentionally kept outside the HTML file.
*/

const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

const SERIES = [
  {
    category: "Feedstock",
    label: "Crude Oil Refinery Inputs",
    seriesId: "WCRRIUS2",
    unit: "Thousand barrels per day"
  },
  {
    category: "Feedstock",
    label: "Other Oils Refinery Inputs",
    seriesId: "WORRIUS2",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Finished Motor Gasoline Product Supplied",
    seriesId: "WGFUPUS2",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Distillate Fuel Oil Product Supplied",
    seriesId: "WDIUPUS2",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Kerosene-Type Jet Fuel Product Supplied",
    seriesId: "WKJUPUS2",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Propane / Propylene Product Supplied",
    seriesId: "WPRUPUS2",
    unit: "Thousand barrels per day"
  }
];

let demandChart = null;

document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadDemandBtn");
  const resetBtn = document.getElementById("resetZoomBtn");

  loadBtn.addEventListener("click", loadDemandData);
  resetBtn.addEventListener("click", () => {
    if (demandChart) {
      demandChart.resetZoom?.();
      demandChart.update();
    }
  });

  populateSeriesTable();
  loadDemandData();
});

function populateSeriesTable() {
  const tbody = document.getElementById("seriesTable");
  tbody.innerHTML = "";

  SERIES.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.category}</td>
      <td>${item.label} <br><small>${item.seriesId}</small></td>
      <td>${item.unit}</td>
    `;

    tbody.appendChild(row);
  });
}

async function loadDemandData() {
  const status = document.getElementById("statusText");
  const weeks = Number(document.getElementById("dateRange").value);

  try {
    status.textContent = "Loading EIA demand data...";

    const seriesResults = await Promise.all(
      SERIES.map(series => fetchEiaSeries(series.seriesId, weeks))
    );

    const labels = buildUnifiedDateLabels(seriesResults);
    const datasets = seriesResults.map((result, index) => {
      const lookup = new Map(result.data.map(point => [point.period, point.value]));

      return {
        label: SERIES[index].label,
        data: labels.map(period => lookup.get(period) ?? null),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: true
      };
    });

    renderChart(labels, datasets);
    status.textContent = `Loaded ${SERIES.length} EIA demand series. Click legend items to show or hide lines. Hover over the chart to view values.`;
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading EIA data: ${error.message}`;
  }
}

async function fetchEiaSeries(seriesId, limit) {
  const url = new URL("https://api.eia.gov/v2/petroleum/sum/sndw/data/");

  url.searchParams.set("api_key", EIA_API_KEY);
  url.searchParams.set("frequency", "weekly");
  url.searchParams.append("data[0]", "value");
  url.searchParams.append("facets[series][]", seriesId);
  url.searchParams.append("sort[0][column]", "period");
  url.searchParams.append("sort[0][direction]", "desc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", String(limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`EIA API request failed for ${seriesId}: HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!json.response || !Array.isArray(json.response.data)) {
    throw new Error(`Invalid EIA response format for ${seriesId}`);
  }

  const data = json.response.data
    .map(row => ({
      period: row.period,
      value: Number(row.value)
    }))
    .filter(row => row.period && Number.isFinite(row.value))
    .sort((a, b) => a.period.localeCompare(b.period));

  if (!data.length) {
    throw new Error(`No EIA data returned for ${seriesId}`);
  }

  return { seriesId, data };
}

function buildUnifiedDateLabels(seriesResults) {
  const dateSet = new Set();

  seriesResults.forEach(result => {
    result.data.forEach(point => dateSet.add(point.period));
  });

  return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
}

function renderChart(labels, datasets) {
  const ctx = document.getElementById("demandChart").getContext("2d");

  if (demandChart) {
    demandChart.destroy();
  }

  demandChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets
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
          labels: {
            usePointStyle: true
          },
          onClick: (event, legendItem, legend) => {
            const chart = legend.chart;
            const index = legendItem.datasetIndex;
            chart.setDatasetVisibility(index, !chart.isDatasetVisible(index));
            chart.update();
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: items => `Week: ${items[0].label}`,
            label: item => {
              const value = item.parsed.y;
              if (value === null || value === undefined) {
                return `${item.dataset.label}: no data`;
              }
              return `${item.dataset.label}: ${value.toLocaleString()} Mbbl/d`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Week"
          },
          ticks: {
            maxTicksLimit: 14
          }
        },
        y: {
          title: {
            display: true,
            text: "Thousand barrels per day"
          },
          beginAtZero: false,
          ticks: {
            callback: value => Number(value).toLocaleString()
          }
        }
      }
    }
  });
}