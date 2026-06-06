"use strict";

const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

const SERIES = [
  {
    category: "Feedstock",
    label: "Crude Oil Refinery Inputs",
    seriesId: "WCRRIUS2",
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
    label: "Jet Fuel Product Supplied",
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
    tbody.innerHTML += `
      <tr>
        <td>${item.category}</td>
        <td>${item.label}<br><small>${item.seriesId}</small></td>
        <td>${item.unit}</td>
      </tr>
    `;
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

    const validResults = settled
      .filter(result => result.status === "fulfilled")
      .map(result => result.value);

    if (!validResults.length) {
      throw new Error("No valid EIA demand series returned.");
    }

    const labels = buildUnifiedDateLabels(validResults);

    const datasets = validResults.map(result => {
      const lookup = new Map(result.data.map(point => [point.period, point.value]));

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

    const failedCount = settled.filter(result => result.status === "rejected").length;

    status.textContent =
      failedCount > 0
        ? `Loaded ${validResults.length} series. ${failedCount} unavailable series skipped.`
        : `Loaded ${validResults.length} EIA demand series.`;
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading EIA data: ${error.message}`;
  }
}

async function fetchEiaSeries(series, limit) {
  const url = new URL(`https://api.eia.gov/v2/seriesid/${series.seriesId}`);

  url.searchParams.set("api_key", EIA_API_KEY);
  url.searchParams.set("length", String(limit));
  url.searchParams.append("sort[0][column]", "period");
  url.searchParams.append("sort[0][direction]", "desc");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`${series.seriesId} failed with HTTP ${response.status}`);
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
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: items => `Week: ${items[0].label}`,
            label: item => {
              const value = item.parsed.y;
              return `${item.dataset.label}: ${value?.toLocaleString() ?? "No data"} Mbbl/d`;
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