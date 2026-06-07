"use strict";

const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

const SERIES = [
  {
    category: "Feedstock",
    label: "Crude Oil Refinery Inputs",
    seriesId: "PET.WCRRIUS2.W",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Finished Motor Gasoline Product Supplied",
    seriesId: "PET.WGFUPUS2.W",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Distillate Fuel Oil Product Supplied",
    seriesId: "PET.WDIUPUS2.W",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Kerosene-Type Jet Fuel Product Supplied",
    seriesId: "PET.WKJUPUS2.W",
    unit: "Thousand barrels per day"
  },
  {
    category: "Product",
    label: "Propane / Propylene Product Supplied",
    seriesId: "PET.WPRUPUS2.W",
    unit: "Thousand barrels per day"
  }
];

let demandChart = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadDemandBtn").addEventListener("click", loadDemandData);
  document.getElementById("resetZoomBtn").addEventListener("click", () => {
    if (demandChart) demandChart.update();
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
      <td>${item.label}<br><small>${item.seriesId}</small></td>
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

    const results = await Promise.all(
      SERIES.map(series => fetchEiaSeries(series, weeks))
    );

    const labels = buildUnifiedDateLabels(results);

    const datasets = results.map(result => {
      const lookup = new Map(result.data.map(p => [p.period, p.value]));

      return {
        label: result.label,
        data: labels.map(period => lookup.get(period) ?? null),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: true
      };
    });

    renderChart(labels, datasets);
    status.textContent = `Loaded ${results.length} EIA demand series.`;
  } catch (error) {
    console.error(error);
    status.textContent = `Error: ${error.message}`;
  }
}

async function fetchEiaSeries(series, limit) {
  const url = new URL(`https://api.eia.gov/v2/seriesid/${series.seriesId}`);

  url.searchParams.set("api_key", EIA_API_KEY);
  url.searchParams.set("length", String(limit));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${series.seriesId} failed. HTTP ${response.status}`);
  }

  const json = await response.json();
  const rows = json.response?.data || [];

  const data = rows
    .map(row => ({
      period: row.period,
      value: Number(row.value)
    }))
    .filter(row => row.period && Number.isFinite(row.value))
    .sort((a, b) => a.period.localeCompare(b.period));

  if (!data.length) {
    throw new Error(`No EIA data returned for ${series.seriesId}`);
  }

  return {
    ...series,
    data
  };
}

function buildUnifiedDateLabels(results) {
  const periods = new Set();

  results.forEach(result => {
    result.data.forEach(point => periods.add(point.period));
  });

  return Array.from(periods).sort();
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
          position: "bottom"
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: item => {
              const value = item.parsed.y;
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
          ticks: {
            callback: value => Number(value).toLocaleString()
          }
        }
      }
    }
  });
}