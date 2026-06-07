"use strict";

const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";
const STORAGE_KEY = "eiaDemandCustomSeries";

const DEFAULT_SERIES = [
  {
    category: "Feedstock",
    label: "Crude Oil Refinery Inputs",
    seriesId: "PET.WCRRIUS2.W",
    unit: "Mbbl/d"
  },
  {
    category: "Product",
    label: "Finished Motor Gasoline Product Supplied",
    seriesId: "PET.WGFUPUS2.W",
    unit: "Mbbl/d"
  },
  {
    category: "Product",
    label: "Distillate Fuel Oil Product Supplied",
    seriesId: "PET.WDIUPUS2.W",
    unit: "Mbbl/d"
  },
  {
    category: "Product",
    label: "Kerosene-Type Jet Fuel Product Supplied",
    seriesId: "PET.WKJUPUS2.W",
    unit: "Mbbl/d"
  }
];

let SERIES = [];
let demandChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeSeries();

  document.getElementById("loadDemandBtn").addEventListener("click", loadDemandData);
  document.getElementById("addSeriesBtn").addEventListener("click", addSeries);

  document.getElementById("resetZoomBtn").addEventListener("click", () => {
    if (demandChart) {
      demandChart.update();
    }
  });

  document.addEventListener("click", handleDeleteSeries);

  populateSeriesTable();
  loadDemandData();
});

function initializeSeries() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    SERIES = [...DEFAULT_SERIES];
    saveSeries();
    return;
  }

  try {
    SERIES = JSON.parse(saved);

    if (!Array.isArray(SERIES) || SERIES.length === 0) {
      SERIES = [...DEFAULT_SERIES];
      saveSeries();
    }
  } catch {
    SERIES = [...DEFAULT_SERIES];
    saveSeries();
  }
}

function saveSeries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SERIES));
}

async function addSeries() {
  const status = document.getElementById("statusText");
  const idInput = document.getElementById("newSeriesId");
  const labelInput = document.getElementById("newSeriesLabel");
  const categoryInput = document.getElementById("newSeriesCategory");

  const rawId = idInput.value.trim();
  const label = labelInput.value.trim();
  const category = categoryInput.value || "Custom";

  if (!rawId) {
    status.textContent = "Enter an EIA series ID.";
    return;
  }

  const seriesId = normalizeSeriesId(rawId);

  const exists = SERIES.some(
    item => item.seriesId.toUpperCase() === seriesId.toUpperCase()
  );

  if (exists) {
    status.textContent = `${seriesId} is already added.`;
    return;
  }

  const newSeries = {
    category,
    label: label || seriesId,
    seriesId,
    unit: "Mbbl/d"
  };

  try {
    status.textContent = `Validating ${seriesId}...`;

    await fetchEiaSeries(newSeries, 5);

    SERIES.push(newSeries);
    saveSeries();

    idInput.value = "";
    labelInput.value = "";

    populateSeriesTable();
    await loadDemandData();

    status.textContent = `${seriesId} added successfully.`;
  } catch (error) {
    console.error(error);
    status.textContent = `Could not add ${seriesId}: ${error.message}`;
  }
}

function normalizeSeriesId(value) {
  const clean = value.trim().toUpperCase();

  if (clean.startsWith("PET.") && clean.endsWith(".W")) {
    return clean;
  }

  if (clean.startsWith("PET.")) {
    return `${clean}.W`;
  }

  if (clean.endsWith(".W")) {
    return `PET.${clean}`;
  }

  return `PET.${clean}.W`;
}

function handleDeleteSeries(event) {
  if (!event.target.classList.contains("delete-series-btn")) {
    return;
  }

  const seriesId = event.target.dataset.seriesId;

  SERIES = SERIES.filter(item => item.seriesId !== seriesId);
  saveSeries();

  populateSeriesTable();
  loadDemandData();
}

function populateSeriesTable() {
  const tbody = document.getElementById("seriesTable");
  tbody.innerHTML = "";

  SERIES.forEach(series => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${series.category}</td>
      <td>${series.label}<br><small>${series.seriesId}</small></td>
      <td>${series.unit}</td>
      <td>
        <button class="delete-series-btn" data-series-id="${series.seriesId}">
          Delete
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

async function loadDemandData() {
  const status = document.getElementById("statusText");
  const weeks = Number(document.getElementById("dateRange").value);

  try {
    status.textContent = "Loading EIA demand data...";

    const settled = await Promise.allSettled(
      SERIES.map(series => fetchEiaSeries(series, weeks))
    );

    const successfulSeries = settled
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    const failedSeries = settled.filter(result => result.status === "rejected");

    failedSeries.forEach(result => {
      console.warn("Skipped series:", result.reason.message);
    });

    if (successfulSeries.length === 0) {
      throw new Error("No valid EIA demand series returned.");
    }

    const labels = buildUnifiedDateLabels(successfulSeries);

    const datasets = successfulSeries.map(result => {
      const lookup = new Map(result.data.map(item => [item.period, item.value]));

      return {
        label: result.label,
        data: labels.map(label => lookup.get(label) ?? null),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: true
      };
    });

    renderChart(labels, datasets);

    status.textContent =
      `Loaded ${successfulSeries.length} series` +
      (failedSeries.length ? ` (${failedSeries.length} skipped)` : "");
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading EIA demand data: ${error.message}`;
  }
}

async function fetchEiaSeries(series, limit) {
  const url =
    `https://api.eia.gov/v2/seriesid/${series.seriesId}` +
    `?api_key=${EIA_API_KEY}` +
    `&length=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${series.seriesId} failed. HTTP ${response.status}`);
  }

  const json = await response.json();
  const rows = json?.response?.data || [];

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

function buildUnifiedDateLabels(seriesResults) {
  const labels = new Set();

  seriesResults.forEach(series => {
    series.data.forEach(point => labels.add(point.period));
  });

  return Array.from(labels).sort((a, b) => a.localeCompare(b));
}

function renderChart(labels, datasets) {
  const canvas = document.getElementById("demandChart");
  const ctx = canvas.getContext("2d");

  if (demandChart) {
    demandChart.destroy();
    demandChart = null;
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
      resizeDelay: 150,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true
          },
          onClick: (e, legendItem, legend) => {
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
            title: items => `Week: ${items[0].label}`,
            label: item => {
              const value = item.parsed.y;

              if (value === null || value === undefined) {
                return `${item.dataset.label}: no data`;
              }

              return `${item.dataset.label}: ${Number(value).toLocaleString()} Mbbl/d`;
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
            maxTicksLimit: 12
          }
        },
        y: {
          title: {
            display: true,
            text: "Thousand Barrels per Day"
          },
          ticks: {
            callback: value => Number(value).toLocaleString()
          }
        }
      }
    }
  });
}