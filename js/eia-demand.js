"use strict";
const STORAGE_KEY="eiaDemandV2";
const DEFAULT_SERIES=[{"category": "Feedstock", "label": "Crude Oil Refinery Inputs", "seriesId": "PET.WCRRIUS2.W", "unit": "kbbl/d"}, {"category": "Product", "label": "Finished Motor Gasoline Product Supplied", "seriesId": "PET.WGFUPUS2.W", "unit": "kbbl/d"}, {"category": "Product", "label": "Distillate Fuel Oil Product Supplied", "seriesId": "PET.WDIUPUS2.W", "unit": "kbbl/d"}, {"category": "Product", "label": "Kerosene-Type Jet Fuel Product Supplied", "seriesId": "PET.WKJUPUS2.W", "unit": "kbbl/d"}];
const MONTHLY_SERIES=[{"label": "Distillate Fuel Oil Product Supplied", "seriesId": "PET.MDIUPUS2.M", "unit": "kbbl/d"}, {"label": "Crude Oil Inputs to Refineries", "seriesId": "PET.MCRRIUS2.M", "unit": "kbbl/d"}, {"label": "Residual Fuel Oil Product Supplied", "seriesId": "PET.MREUPUS2.M", "unit": "kbbl/d"}, {"label": "Residual Fuel Oil Imports", "seriesId": "PET.MREIMUS2.M", "unit": "kbbl/d"}, {"label": "Residual Fuel Oil Exports", "seriesId": "PET.MREEXUS2.M", "unit": "kbbl/d"}, {"label": "Finished Motor Gasoline Product Supplied", "seriesId": "PET.MGFUPUS2.M", "unit": "kbbl/d"}, {"label": "Kerosene-Type Jet Fuel Product Supplied", "seriesId": "PET.MKJUPUS2.M", "unit": "kbbl/d"}];
let SERIES = [];
let demandChart = null;
let monthlyDemandChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeSeries();
  populateMonthlyDropdown();

  document.getElementById("loadDemandBtn").addEventListener("click", ()=>{cache=null;loadDemandData();});
  document.getElementById("addSeriesBtn").addEventListener("click", addSeries);
  document.getElementById("loadMonthlyBtn").addEventListener("click", ()=>{cache=null;loadMonthlyData();});

  document.getElementById("resetZoomBtn").addEventListener("click", () => {
    if (demandChart) {
      demandChart.update();
    }
  });

  document.addEventListener("click", handleDeleteSeries);

  populateSeriesTable();
  loadDemandData();
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
        else if(targetTab === "monthlyTab") loadMonthlyData();
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
    if(Array.isArray(SERIES)) SERIES=SERIES.filter(s=>DEFAULT_SERIES.some(d=>d.seriesId===s.seriesId));

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

  const known=DEFAULT_SERIES.find(s=>s.seriesId===seriesId);
  if(!known){status.textContent="Only configured weekly demand series can be added. Extend the retrieval catalog first.";return;}
  const newSeries = {
    category,
    label: label || seriesId,
    seriesId,
    unit: "kbbl/d"
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

    for(const value of [series.category,series.label+' ('+series.seriesId+')',series.unit]) row.insertCell().textContent=value;
    const btn=document.createElement('button');btn.className='delete-series-btn';btn.dataset.seriesId=series.seriesId;btn.textContent='Delete';row.insertCell().append(btn);
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

    const datasets = successfulSeries.map((result,i) => {
      const lookup = new Map(result.data.map(item => [item.period, item.value]));

      return {
        label: result.label,
        borderColor: ["#36A2EB","#FF6384","#FF9F40","#4BC0C0"][i%4],
        backgroundColor: ["#36A2EB66","#FF638466","#FF9F4066","#4BC0C066"][i%4],
        data: labels.map(label => lookup.get(label) ?? null),
        borderWidth: 2,
        showLine: true,
        pointRadius: labels.length === 1 ? 3 : 0,
        pointHitRadius: 12,
        pointHoverRadius: 5,
        tension: 0,
        spanGaps: false
      };
    });

    renderWeeklyChart(labels, datasets);
    summary("weeklyTab",successfulSeries);

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
        borderColor: ["#FF9F40","#36A2EB","#9966FF","#4BC0C0","#FFCD56","#FF6384","#4BC0C0"][MONTHLY_SERIES.indexOf(selectedSeries)],
        backgroundColor: ["#FF9F4066","#36A2EB66","#9966FF66","#4BC0C066","#FFCD5666","#FF638466","#4BC0C066"][MONTHLY_SERIES.indexOf(selectedSeries)],
        data: values,
        borderWidth: 2,
        showLine: true,
        pointRadius: labels.length === 1 ? 3 : 0,
        pointHitRadius: 12,
        pointHoverRadius: 5,
        tension: 0,
        spanGaps: false
      }
    ]);

    summary("monthlyTab",[result]);
    status.textContent = `Loaded monthly series: ${result.seriesId}`;
  } catch (error) {
    console.error(error);
    status.textContent = `Error loading monthly EIA data: ${error.message}`;
  }
}

async function fetchEiaSeries(series, limit) {
 const rows=(await snapshot()).get(series.seriesId)||[];
 const data=rows.slice(-limit); if(!data.length) throw new Error('No cached observations for '+series.seriesId);
 return {...series,data};
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
    options: buildChartOptions("Month", "Thousand Barrels per Day")
  });
}

function buildChartOptions(xAxisTitle, yAxisTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    animation: false,
    layout: {padding: 8},
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      title: {display:true,text: xAxisTitle === "Week" ? "U.S. Weekly Refinery Inputs and Product Supplied" : "U.S. Monthly Petroleum Trends"},
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: false,
          boxWidth: 36,
          boxHeight: 12,
          padding: 16
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
        mode: "index",
        intersect: false,
        displayColors: true,
        callbacks: {
          title: items => `${xAxisTitle}: ${items[0].label}`,
          label: item => {
            const value = item.parsed.y;

            if (value === null || value === undefined) {
              return `${item.dataset.label}: no data`;
            }

            return `${item.dataset.label}: ${whole(value)} kbbl/d`;
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
          callback: value => whole(value)
        }
      }
    }
  };
}
let cache=null;
function snapshot(){if(!cache)cache=(async()=>{const r=await fetch('/static/data/eia-demand.csv',{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Snapshot unavailable: run demand GitHub workflow');const text=await r.text();const lines=text.trim().split(/\r?\n/);if(lines.shift()!=='series_id,period,value,retrieved_at,source')throw Error('Invalid demand CSV');const m=new Map();for(const line of lines){const [id,period,v,retrieved_at,source]=line.split(',');if(!v||!Number.isFinite(Number(v))||!/^\d{4}-\d{2}(-\d{2})?$/.test(period))continue;if(!m.has(id))m.set(id,[]);m.get(id).push({period,value:Number(v),retrieved_at,source});}for(const rows of m.values())rows.sort((a,b)=>a.period.localeCompare(b.period));return m;})().catch(e=>{cache=null;throw e});return cache;}
function table(id,heads,rows){const el=document.getElementById(id);const t=document.createElement('table');const h=t.createTHead().insertRow();for(const v of heads){const th=document.createElement('th');th.scope="col";th.textContent=v;h.append(th)}const body=t.createTBody();for(const row of rows){const tr=body.insertRow();for(const v of row)tr.insertCell().textContent=v;}el.replaceChildren(t);}
const whole=v=>Number.isFinite(Number(v)) && v!==null && v!==undefined ? Number(v).toLocaleString("en-US",{maximumFractionDigits:0}):"—";
const fmt=v=>Number.isFinite(v)?v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
function summary(tab,series){table(tab+'Summary',['Year-Month','Observation date','Series','Volume (kbbl/d)','Year-over-year %','Retrieved UTC','Source'],series.map(s=>{const a=s.data.at(-1);const d=new Date(a.period+'-01'.slice(0,a.period.length===7?3:0)+'T00:00:00Z');const target=new Date(d);target.setUTCFullYear(target.getUTCFullYear()-1);const prev=s.data.reduce((best,r)=>{const t=new Date(r.period.length===7?r.period+'-01':r.period);return Math.abs(t-target)<Math.abs(new Date(best.period.length===7?best.period+'-01':best.period)-target)?r:best},s.data[0]);const delta=Math.abs(new Date(prev.period.length===7?prev.period+'-01':prev.period)-target);return [a.period.slice(0,7),a.period,s.label,whole(a.value),fmt(delta<=7*86400000&&prev.value!==0?100*(a.value/prev.value-1):NaN),a.retrieved_at,a.source];}));table(tab+'Season',['Series (kbbl/d)','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Source'],series.map(s=>[s.label,...Array.from({length:12},(_,i)=>{const a=s.data.filter(r=>Number(r.period.slice(5,7))===i+1);return whole(a.length?a.reduce((n,r)=>n+r.value,0)/a.length:NaN)}),[...new Set(s.data.map(r=>r.source).filter(Boolean))].join("; ")||"—"]));}
