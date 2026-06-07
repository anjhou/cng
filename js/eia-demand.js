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

const MONTHLY_SERIES = [
  {
    label: "Distillate Fuel Oil Product Supplied",
    seriesId: "PET.MDIUPUS2.M",
    unit: "Thousand barrels per day"
  },
  {
    label: "Sulfur Product Demand / Consumption",
    seriesId: "PET.EPC0_SULF_NUS_DPC",
    unit: "EIA reported unit"
  },
  {
    label: "Crude Oil Stock Change / Supply Series",
    seriesId: "PET.MCRSPUS1.M",
    unit: "EIA reported unit"
  },
  {
    label: "Crude Oil Refinery Inputs - Hydrocracking",
    seriesId: "PET.MCRHCPUS1.M",
    unit: "EIA reported unit"
  },
  {
    label: "Crude Oil Refinery Inputs - Hydrotreating / Processing",
    seriesId: "PET.MCRHPPUS1.M",
    unit: "EIA reported unit"
  },
  {
    label: "Natural Gas Industrial Consumption",
    seriesId: "NG.N9130US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Electric Power Consumption",
    seriesId: "NG.N9130US3.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Residential Consumption",
    seriesId: "NG.N9130US1.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Total Consumption",
    seriesId: "NG.NGTOTALUS.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Lease Fuel",
    seriesId: "NG.N3010US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Pipeline Fuel",
    seriesId: "NG.N3020US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Plant Fuel",
    seriesId: "NG.N3030US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Vehicle Fuel",
    seriesId: "NG.N3045US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Natural Gas Delivered to Consumers",
    seriesId: "NG.N3050US2.M",
    unit: "Million cubic feet"
  },
  {
    label: "Kerosene-Type Jet Fuel Product Supplied",
    seriesId: "PET.MCKCPUS1.M",
    unit: "EIA reported unit"
  },
  {
    label: "Kerosene Product Supplied",
    seriesId: "PET.MCKPPUS1.M",
    unit: "EIA reported unit"
  }
];

let SERIES = [];
let demandChart = null;
let monthlyDemandChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeSeries();
  populateMonthlyDropdown();

  document.getElementById("loadDemandBtn").addEventListener("click", loadDemandData);
  document.getElementById("addSeriesBtn").addEventListener("click", addSeries);
  document.getElementById("loadMonthlyBtn").addEventListener("click", loadMonthlyData);

  document.getElementById("resetZoomBtn").addEventListener("click", () => {
    if (demandChart) {
      demandChart.update();
    }
  });

  document.addEventListener("click", handleDeleteSeries);

  populateSeriesTable();
  loadDemandData();
  loadMonthlyData();
});

function initializeTabs() {
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;

      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
      });

      document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
      });

      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");

      setTimeout(() => {
        if (demandChart) demandChart.resize();
        if (monthlyDemandChart) monthlyDemandChart.resize();
      }, 100);
    });
  });
}

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

function populateMonthlyDropdown() {
  const select = document.getElementById("monthlySeriesSelect");
  select.innerHTML = "";

  MONTHLY_SERIES.forEach(series => {
    const option = document.createElement("option");
    option.value = series.seriesId;
    option.textContent = `${series.seriesId} - ${series.label}`;
    select.appendChild(option);
  });
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

  const seriesId = normalizeWeeklySeriesId(rawId);

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

function normalizeWeeklySeriesId(value) {
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
    status.textContent = "Loading weekly EIA demand data...";

    const settled = await Promise.allSettled(
      SERIES.map(series => fetchEiaSeries(series, weeks))
    );

    const successfulSeries = settled
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    const failedSeries = settled.filter(result => result.status === "rejected");

    failedSeries.forEach(result => {
      console.warn("Skipped weekly series:", result.reason.message);
    });

    if (successfulSeries.length === 0) {
      throw new Error("No valid weekly EIA demand series returned.");
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

    renderWeeklyChart(labels, datasets);

    status.textContent =
      `Loaded ${successfulSeries.length} weekly series` +
      (failedSeries.length ? ` (${failedSeries.length} skipped)` : "");
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading weekly EIA data: ${error.message}`;
  }
}

async function loadMonthlyData() {
  const status = document.getElementById("monthlyStatusText");
  const select = document.getElementById("monthlySeriesSelect");
  const months = Number(document.getElementById("monthlyDateRange").value);

  const selectedId = select.value;
  const selectedSeries = MONTHLY_SERIES.find(item => item.seriesId === selectedId);

  if (!selectedSeries) {
    status.textContent = "Select a valid monthly EIA series.";
    return;
  }

  try {
    status.textContent = `Loading monthly data for ${selectedSeries.seriesId}...`;

    const result = await fetchEiaSeries(selectedSeries, months);

    const labels = result.data.map(item => item.period);
    const values = result.data.map(item => item.value);

    renderMonthlyChart(labels, [
      {
        label: `${result.seriesId} - ${result.label}`,
        data: values,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: true
      }
    ]);

    status.textContent = `Loaded monthly series: ${result.seriesId}`;
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading monthly EIA data: ${error.message}`;
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

function renderWeeklyChart(labels, datasets) {
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
    options: buildChartOptions("Week", "Thousand Barrels per Day")
  });
}

function renderMonthlyChart(labels, datasets) {
  const canvas = document.getElementById("monthlyDemandChart");
  const ctx = canvas.getContext("2d");

  if (monthlyDemandChart) {
    monthlyDemandChart.destroy();
    monthlyDemandChart = null;
  }

  monthlyDemandChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets
    },
    options: buildChartOptions("Month", "EIA Reported Value")
  });
}

function buildChartOptions(xAxisTitle, yAxisTitle) {
  return {
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
          title: items => `${xAxisTitle}: ${items[0].label}`,
          label: item => {
            const value = item.parsed.y;

            if (value === null || value === undefined) {
              return `${item.dataset.label}: no data`;
            }

            return `${item.dataset.label}: ${Number(value).toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisTitle
        },
        ticks: {
          maxTicksLimit: 12
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisTitle
        },
        ticks: {
          callback: value => Number(value).toLocaleString()
        }
      }
    }
  };
}