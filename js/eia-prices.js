const EIA_API_KEY = "KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

const seriesLibrary = [
  { type:"Feedstock", label:"WTI Crude Oil", seriesId:"PET.RWTC.D", unit:"$/bbl", axis:"y" },
  { type:"Feedstock", label:"Brent Crude Oil", seriesId:"PET.RBRTE.D", unit:"$/bbl", axis:"y" },
  { type:"Feedstock", label:"Henry Hub Natural Gas", seriesId:"NG.RNGWHHD.D", unit:"$/MMBtu", axis:"y1" },
  { type:"Feedstock", label:"Waha Natural Gas", seriesId:"NG.RNGC1TX3.D", unit:"$/MMBtu", axis:"y1" },
  { type:"Product", label:"Gasoline Retail US", seriesId:"PET.EMM_EPM0_PTE_NUS_DPG.W", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Diesel Retail US", seriesId:"PET.EMD_EPD2D_PTE_NUS_DPG.W", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Jet Fuel Spot NY Harbor", seriesId:"PET.EER_EPJK_PF4_RGC_DPG.D", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Propane Mont Belvieu", seriesId:"PET.EER_EPLLPA_PF4_Y44MB_DPG.D", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Ethane Mont Belvieu", seriesId:"PET.EER_EPLEM_PF4_Y44MB_DPG.D", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Normal Butane Mont Belvieu", seriesId:"PET.EER_EPLBN_PF4_Y44MB_DPG.D", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Isobutane Mont Belvieu", seriesId:"PET.EER_EPLBI_PF4_Y44MB_DPG.D", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Natural Gasoline Mont Belvieu", seriesId:"PET.EER_EPLNG_PF4_Y44MB_DPG.D", unit:"$/gal", axis:"y1" }
];

const defaultSeriesIds = ["PET.RWTC.D","PET.RBRTE.D","NG.RNGWHHD.D","PET.EMM_EPM0_PTE_NUS_DPG.W","PET.EMD_EPD2D_PTE_NUS_DPG.W","PET.EER_EPLLPA_PF4_Y44MB_DPG.D"];

let selectedSeries = [];
let selectedSpreads = [];
let rawData = {};
let alignedLabels = [];
let priceChart = null;
let spreadChart = null;
let normalChart = null;

window.addEventListener("DOMContentLoaded", init);

function init(){
  bindEvents();
  loadLibraryDropdown();
  resetDefaults();
  setStatus("Ready. Select series and click Load / Refresh EIA Data.");
}

function bindEvents(){
  document.getElementById("btnAddSeries").addEventListener("click", addSelectedLibrarySeries);
  document.getElementById("btnLoad").addEventListener("click", loadPrices);
  document.getElementById("btnExport").addEventListener("click", exportCsv);
  document.getElementById("btnReset").addEventListener("click", resetDefaults);
  document.getElementById("btnAddSpread").addEventListener("click", addSpread);
  document.getElementById("normalSeriesSelect").addEventListener("change", renderNormalChart);
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));
}

function activateTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === id));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.toggle("active", t.id === id));
}

function loadLibraryDropdown(){
  const sel = document.getElementById("seriesLibrarySelect");
  sel.innerHTML = "";
  seriesLibrary.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.seriesId;
    opt.textContent = `${s.type} - ${s.label} (${s.unit})`;
    sel.appendChild(opt);
  });
}

function resetDefaults(){
  selectedSeries = seriesLibrary.filter(s => defaultSeriesIds.includes(s.seriesId)).map(s => ({...s, plot:true}));
  selectedSpreads = [];
  renderSeriesTable();
  renderSpreadTable();
  refreshSelectors();
  setStatus("Defaults restored.");
}

function addSelectedLibrarySeries(){
  const id = document.getElementById("seriesLibrarySelect").value;
  const item = seriesLibrary.find(s => s.seriesId === id);
  if(!item) return;
  if(selectedSeries.some(s => s.seriesId === id)){
    setStatus("Series already selected.");
    return;
  }
  selectedSeries.push({...item, plot:true});
  renderSeriesTable();
  refreshSelectors();
}

function renderSeriesTable(){
  const tbody = document.querySelector("#seriesTable tbody");
  tbody.innerHTML = "";
  selectedSeries.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" ${s.plot ? "checked" : ""} data-idx="${idx}" data-field="plot"></td>
      <td><select data-idx="${idx}" data-field="axis"><option value="y" ${s.axis === "y" ? "selected" : ""}>Left</option><option value="y1" ${s.axis === "y1" ? "selected" : ""}>Right</option></select></td>
      <td><select data-idx="${idx}" data-field="type"><option ${s.type === "Feedstock" ? "selected" : ""}>Feedstock</option><option ${s.type === "Product" ? "selected" : ""}>Product</option></select></td>
      <td><input value="${escapeHtml(s.label)}" data-idx="${idx}" data-field="label"></td>
      <td><input value="${escapeHtml(s.seriesId)}" data-idx="${idx}" data-field="seriesId"></td>
      <td><input value="${escapeHtml(s.unit)}" data-idx="${idx}" data-field="unit"></td>
      <td><button class="danger" data-remove="${idx}">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("input,select").forEach(el => el.addEventListener("change", updateSeriesFromInput));
  tbody.querySelectorAll("button[data-remove]").forEach(btn => btn.addEventListener("click", () => removeSeries(Number(btn.dataset.remove))));
}

function updateSeriesFromInput(e){
  const idx = Number(e.target.dataset.idx);
  const field = e.target.dataset.field;
  if(field === "plot") selectedSeries[idx][field] = e.target.checked;
  else selectedSeries[idx][field] = e.target.value;
  refreshSelectors();
}

function removeSeries(idx){
  selectedSeries.splice(idx,1);
  renderSeriesTable();
  refreshSelectors();
}

function refreshSelectors(){
  const spreadProduct = document.getElementById("spreadProductSelect");
  const spreadFeed = document.getElementById("spreadFeedSelect");
  const normalSel = document.getElementById("normalSeriesSelect");
  [spreadProduct, spreadFeed, normalSel].forEach(sel => sel.innerHTML = "");

  selectedSeries.forEach(s => {
    const opt1 = new Option(s.label, s.seriesId);
    const opt2 = new Option(s.label, s.seriesId);
    const opt3 = new Option(`${s.label} (${s.unit})`, s.seriesId);
    spreadProduct.add(opt1);
    spreadFeed.add(opt2);
    normalSel.add(opt3);
  });
}

async function loadPrices(){
  setStatus("Loading EIA API v2 data...");
  rawData = {};
  alignedLabels = [];
  const frequency = document.getElementById("frequencySelect").value;
  const lookbackYears = Number(document.getElementById("lookbackSelect").value);
  const active = selectedSeries.filter(s => s.plot && s.seriesId);
  const failures = [];

  for(const item of active){
    try{
      const data = await fetchSeriesV2(item.seriesId, frequency, lookbackYears);
      rawData[item.seriesId] = data;
    }catch(err){
      failures.push(`${item.label}: ${err.message}`);
      console.error(err);
    }
  }

  alignedLabels = buildAlignedLabels(rawData);
  renderPriceChart();
  renderSpreadChart();
  renderNormalChart();
  renderDataTable();

  if(failures.length){
    setStatus(`Loaded ${Object.keys(rawData).length} series. Some failed: ${failures.join(" | ")}`);
  }else{
    setStatus(`Loaded ${Object.keys(rawData).length} EIA series successfully.`);
  }
}

async function fetchSeriesV2(seriesId, frequency, lookbackYears){
  const start = new Date();
  start.setFullYear(start.getFullYear() - lookbackYears);
  const startDate = start.toISOString().slice(0,10);
  const url = `https://api.eia.gov/v2/seriesid/${encodeURIComponent(seriesId)}?api_key=${EIA_API_KEY}&frequency=${frequency}&start=${startDate}`;
  const response = await fetch(url);
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if(!json.response || !Array.isArray(json.response.data)) throw new Error("Invalid EIA v2 response");
  return json.response.data
    .map(r => ({date:normalizeDate(r.period), value:Number(r.value)}))
    .filter(r => Number.isFinite(r.value))
    .sort((a,b) => a.date.localeCompare(b.date));
}

function buildAlignedLabels(dataObj){
  const dates = new Set();
  Object.values(dataObj).forEach(arr => arr.forEach(r => dates.add(r.date)));
  return [...dates].sort();
}

function renderPriceChart(){
  const ctx = document.getElementById("priceChart").getContext("2d");
  if(priceChart) priceChart.destroy();

  const datasets = selectedSeries
    .filter(s => s.plot && rawData[s.seriesId])
    .map(s => {
      const map = new Map(rawData[s.seriesId].map(r => [r.date,r.value]));
      return {
        label:`${s.label} (${s.unit})`,
        data:alignedLabels.map(d => map.get(d) ?? null),
        yAxisID:s.axis || "y",
        borderWidth:2,
        pointRadius:0,
        tension:0.2
      };
    });

  priceChart = new Chart(ctx, {
    type:"line",
    data:{labels:alignedLabels,datasets},
    options:{
      responsive:true,
      interaction:{mode:"index",intersect:false},
      plugins:{title:{display:true,text:"Feedstock and Product Prices - Dual Axis"},legend:{position:"bottom"}},
      scales:{
        x:{title:{display:true,text:"Date"},ticks:{maxTicksLimit:14}},
        y:{type:"linear",position:"left",title:{display:true,text:"Left Axis"}},
        y1:{type:"linear",position:"right",title:{display:true,text:"Right Axis"},grid:{drawOnChartArea:false}}
      }
    }
  });
}

function addSpread(){
  const productId = document.getElementById("spreadProductSelect").value;
  const feedId = document.getElementById("spreadFeedSelect").value;
  if(productId === feedId){ setStatus("Select two different series for spread calculation."); return; }
  const p = selectedSeries.find(s => s.seriesId === productId);
  const f = selectedSeries.find(s => s.seriesId === feedId);
  selectedSpreads.push({plot:true, productId, feedId, label:`${p.label} - ${f.label}`});
  renderSpreadTable();
  renderSpreadChart();
}

function renderSpreadTable(){
  const tbody = document.querySelector("#spreadTable tbody");
  tbody.innerHTML = "";
  selectedSpreads.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" ${s.plot ? "checked" : ""} data-spread-idx="${idx}"></td>
      <td>${escapeHtml(s.label)}</td>
      <td>Product - Feedstock</td>
      <td><button class="danger" data-remove-spread="${idx}">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll("input[data-spread-idx]").forEach(i => i.addEventListener("change", e => { selectedSpreads[Number(e.target.dataset.spreadIdx)].plot = e.target.checked; renderSpreadChart(); }));
  tbody.querySelectorAll("button[data-remove-spread]").forEach(b => b.addEventListener("click", () => { selectedSpreads.splice(Number(b.dataset.removeSpread),1); renderSpreadTable(); renderSpreadChart(); }));
}

function renderSpreadChart(){
  const ctx = document.getElementById("spreadChart").getContext("2d");
  if(spreadChart) spreadChart.destroy();
  const datasets = selectedSpreads.filter(s => s.plot && rawData[s.productId] && rawData[s.feedId]).map(s => {
    const pMap = new Map(rawData[s.productId].map(r => [r.date,r.value]));
    const fMap = new Map(rawData[s.feedId].map(r => [r.date,r.value]));
    return {label:s.label,data:alignedLabels.map(d => (pMap.has(d) && fMap.has(d)) ? pMap.get(d) - fMap.get(d) : null),borderWidth:2,pointRadius:0,tension:0.2};
  });
  spreadChart = new Chart(ctx,{type:"line",data:{labels:alignedLabels,datasets},options:{responsive:true,interaction:{mode:"index",intersect:false},plugins:{title:{display:true,text:"Price Spread Calculations"},legend:{position:"bottom"}},scales:{x:{ticks:{maxTicksLimit:14}},y:{title:{display:true,text:"Spread"}}}}});
}

function renderNormalChart(){
  const id = document.getElementById("normalSeriesSelect").value;
  const source = rawData[id] || [];
  const ctx = document.getElementById("normalChart").getContext("2d");
  if(normalChart) normalChart.destroy();
  if(!source.length) return;
  const item = selectedSeries.find(s => s.seriesId === id);
  const avg = source.reduce((a,b) => a + b.value,0) / source.length;
  const sd = Math.sqrt(source.reduce((a,b) => a + Math.pow(b.value - avg,2),0) / source.length);
  const labels = source.map(r => r.date);
  const values = source.map(r => ((r.value - avg) / (sd || 1)));
  normalChart = new Chart(ctx,{type:"line",data:{labels,datasets:[{label:`${item ? item.label : id} z-score`,data:values,borderWidth:2,pointRadius:0,tension:0.2},{label:"Mean",data:labels.map(() => 0),borderWidth:1,pointRadius:0},{label:"+1 Std Dev",data:labels.map(() => 1),borderWidth:1,pointRadius:0},{label:"-1 Std Dev",data:labels.map(() => -1),borderWidth:1,pointRadius:0}]},options:{responsive:true,plugins:{title:{display:true,text:`Normalization Plot | Mean ${avg.toFixed(3)}, Std Dev ${sd.toFixed(3)}`},legend:{position:"bottom"}},scales:{x:{ticks:{maxTicksLimit:14}},y:{title:{display:true,text:"Z-score"}}}}});
}

function renderDataTable(){
  const table = document.getElementById("dataTable");
  const active = selectedSeries.filter(s => rawData[s.seriesId]);
  let html = "<thead><tr><th>Date</th>" + active.map(s => `<th>${escapeHtml(s.label)}<br>${escapeHtml(s.unit)}</th>`).join("") + "</tr></thead><tbody>";
  const maps = active.map(s => new Map(rawData[s.seriesId].map(r => [r.date,r.value])));
  alignedLabels.forEach(d => {
    html += `<tr><td>${d}</td>` + maps.map(m => `<td>${m.has(d) ? m.get(d) : ""}</td>`).join("") + "</tr>";
  });
  html += "</tbody>";
  table.innerHTML = html;
}

function exportCsv(){
  if(!alignedLabels.length){ setStatus("No data available to export."); return; }
  const active = selectedSeries.filter(s => rawData[s.seriesId]);
  const maps = active.map(s => new Map(rawData[s.seriesId].map(r => [r.date,r.value])));
  const header = ["Date", ...active.map(s => `${s.label} (${s.unit})`)];
  const rows = alignedLabels.map(d => [d, ...maps.map(m => m.has(d) ? m.get(d) : "")]);
  const csv = [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eia_price_data.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v){
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

function normalizeDate(period){
  const p = String(period);
  if(/^\d{8}$/.test(p)) return `${p.slice(0,4)}-${p.slice(4,6)}-${p.slice(6,8)}`;
  if(/^\d{6}$/.test(p)) return `${p.slice(0,4)}-${p.slice(4,6)}-01`;
  if(/^\d{4}-\d{2}$/.test(p)) return `${p}-01`;
  return p;
}

function setStatus(msg){ document.getElementById("status").textContent = msg; }
function escapeHtml(text){ return String(text ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]); }
