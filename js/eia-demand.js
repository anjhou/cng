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
  }
];

let demandChart = null;

document.addEventListener("DOMContentLoaded", () => {

  document
    .getElementById("loadDemandBtn")
    .addEventListener("click", loadDemandData);

  document
    .getElementById("resetZoomBtn")
    .addEventListener("click", () => {
      if (demandChart) {
        demandChart.update();
      }
    });

  populateSeriesTable();
  loadDemandData();
});

function populateSeriesTable() {

  const tbody = document.getElementById("seriesTable");
  tbody.innerHTML = "";

  SERIES.forEach(series => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${series.category}</td>
      <td>
        ${series.label}
        <br>
        <small>${series.seriesId}</small>
      </td>
      <td>${series.unit}</td>
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

    const failedSeries = settled
      .filter(result => result.status === "rejected");

    failedSeries.forEach(result => {
      console.warn("Skipped series:", result.reason.message);
    });

    if (successfulSeries.length === 0) {
      throw new Error("No valid EIA demand series returned.");
    }

    const labels = buildUnifiedDateLabels(successfulSeries);

    const datasets = successfulSeries.map(result => {

      const lookup = new Map(
        result.data.map(item => [item.period, item.value])
      );

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
      (failedSeries.length
        ? ` (${failedSeries.length} skipped)`
        : "");

  }
  catch (error) {

    console.error(error);

    status.textContent =
      `Error loading EIA demand data: ${error.message}`;
  }
}

async function fetchEiaSeries(series, limit) {

  const url =
    `https://api.eia.gov/v2/seriesid/${series.seriesId}` +
    `?api_key=${EIA_API_KEY}` +
    `&length=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error(
      `${series.seriesId} failed. HTTP ${response.status}`
    );
  }

  const json = await response.json();

  const rows = json?.response?.data || [];

  const data = rows
    .map(row => ({
      period: row.period,
      value: Number(row.value)
    }))
    .filter(row =>
      row.period &&
      Number.isFinite(row.value)
    )
    .sort((a, b) =>
      a.period.localeCompare(b.period)
    );

  if (!data.length) {

    throw new Error(
      `No EIA data returned for ${series.seriesId}`
    );
  }

  return {
    ...series,
    data
  };
}

function buildUnifiedDateLabels(seriesResults) {

  const labels = new Set();

  seriesResults.forEach(series => {

    series.data.forEach(point => {
      labels.add(point.period);
    });
  });

  return Array.from(labels)
    .sort((a, b) => a.localeCompare(b));
}

function renderChart(labels, datasets) {

  const ctx =
    document.getElementById("demandChart")
      .getContext("2d");

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

          position: "bottom",

          labels: {
            usePointStyle: true
          },

          onClick: (e, legendItem, legend) => {

            const chart = legend.chart;

            const index =
              legendItem.datasetIndex;

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

            title: items =>
              `Week: ${items[0].label}`,

            label: item =>
              `${item.dataset.label}: ${Number(
                item.parsed.y
              ).toLocaleString()} Mbbl/d`
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
            callback: value =>
              Number(value).toLocaleString()
          }
        }
      }
    }
  });
}