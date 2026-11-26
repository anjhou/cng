
const seriesLibrary = [
  { type:"Feedstock", label:"WTI Crude Oil", seriesId:"PET.RWTC.D", unit:"$/bbl", axis:"y" },
  { type:"Feedstock", label:"Brent Crude Oil", seriesId:"PET.RBRTE.D", unit:"$/bbl", axis:"y" },
  { type:"Feedstock", label:"Henry Hub Natural Gas", seriesId:"NG.RNGWHHD.D", unit:"$/MMBtu", axis:"y1" },
  { type:"Feedstock", label:"Waha Natural Gas", seriesId:"NG.RNGC1TX3.D", unit:"$/MMBtu", axis:"y1" },
  { type:"Product", label:"Gasoline Retail US", seriesId:"PET.EMM_EPM0_PTE_NUS_DPG.W", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Diesel Retail US", seriesId:"PET.EMD_EPD2D_PTE_NUS_DPG.W", unit:"$/gal", axis:"y1" },
  { type:"Product", label:"Jet Fuel Spot US Gulf Coast", seriesId:"PET.EER_EPJK_PF4_RGC_DPG.D", unit:"$/gal", axis:"y1" },
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
  onClick("btnAddSeries", addSelectedLibrarySeries);
  onClick("btnLoad", loadPrices);
  onClick("btnExport", exportCsv);
  onClick("btnReset", resetDefaults);
  onClick("btnAddSpread", addSpread);
  onChange("normalSeriesSelect", renderNormalChart);

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
}

function onClick(id, handler){
  const el = document.getElementById(id);
  if(!el){
    console.warn(`Missing element #${id}; event binding skipped.`);
    return;
  }
  el.addEventListener("click", handler);
}

function onChange(id, handler){
  const el = document.getElementById(id);
  if(!el){
    console.warn(`Missing element #${id}; event binding skipped.`);
    return;
  }
  el.addEventListener("change", handler);
}

function activateTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === id));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.toggle("active", t.id === id));
  requestAnimationFrame(()=>{for(const c of [priceChart,spreadChart,normalChart])if(c)c.resize();});
}

function loadLibraryDropdown(){
  const sel = document.getElementById("seriesLibrarySelect");
  if(!sel){
    console.warn("Missing element #seriesLibrarySelect; library dropdown not loaded.");
    return;
  }
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
  rawData={}; alignedLabels=[];
  for(const c of [priceChart,spreadChart,normalChart])if(c)c.destroy();
  priceChart=spreadChart=normalChart=null;
  renderDataTable();
  renderSeriesTable();
  renderSpreadTable();
  refreshSelectors();
  setStatus("Defaults restored.");
}

function addSelectedLibrarySeries(){
  const select = document.getElementById("seriesLibrarySelect");
  if(!select){
    setStatus("Series library selector is missing from the HTML.");
    return;
  }
  const id = select.value;
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
  if(!tbody){
    console.warn("Missing #seriesTable tbody; selected series table not rendered.");
    return;
  }
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
  [spreadProduct, spreadFeed, normalSel].forEach(sel => { if(sel) sel.innerHTML = ""; });

  selectedSeries.forEach(s => {
    if(spreadProduct) spreadProduct.add(new Option(s.label, s.seriesId));
    if(spreadFeed) spreadFeed.add(new Option(s.label, s.seriesId));
    if(normalSel) normalSel.add(new Option(`${s.label} (${s.unit})`, s.seriesId));
  });
}

async function loadPrices(){
 const btn=document.getElementById('btnLoad'); if(btn.disabled)return; btn.disabled=true;
 setStatus('Loading EIA data…');
 try {
 if(typeof Chart==='undefined') throw Error('Chart.js failed to load. Check CDN access.');
 const frequency=document.getElementById('frequencySelect').value;
 const years=Number(document.getElementById('lookbackSelect').value);
 const active=selectedSeries.filter(s=>s.plot && s.seriesId.trim()).map(s=>({...s}));
 if(!active.length) throw Error('Select at least one series.');
 const results=await Promise.allSettled(active.map(s=>fetchSeriesV2(s.seriesId.trim(),frequency,years)));
 const next={}, failures=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled' && r.value.length)next[active[i].seriesId]=r.value;else failures.push(active[i].label+': '+(r.status==='rejected'?r.reason.message:'No observations'));});
 if(!Object.keys(next).length) throw Error('No series loaded. '+failures.join(' | '));
 rawData=next; alignedLabels=buildAlignedLabels(rawData);
 renderPriceChart(); renderSpreadChart(); renderNormalChart(); renderDataTable();
 setStatus('Loaded '+Object.keys(next).length+' series. '+(failures.length?'Unavailable: '+failures.join(' | '):'Refresh complete.'));
 } catch(e){setStatus('Load failed: '+e.message);} finally {btn.disabled=false;}
}
async function fetchSeriesV2(seriesId, frequency, lookbackYears){
 const start=new Date(); start.setUTCFullYear(start.getUTCFullYear()-lookbackYears);
 const native=({D:'daily',W:'weekly',M:'monthly',A:'annual',Q:'quarterly'})[seriesId.split('.').pop()];
 const cutoff=start.toISOString().slice(0,10);
 const params=new URLSearchParams({start:native==='monthly'?cutoff.slice(0,7):native==='annual'?cutoff.slice(0,4):cutoff,length:'5000',offset:'0'});
 if(native)params.set('frequency',native);
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),90000);
 try {
 const rows=[]; let offset=0;
 while(true){params.set('offset',String(offset));
 const response=await fetch('/api/eia?series='+encodeURIComponent(seriesId)+'&'+params,{signal:controller.signal});
 if(!response.ok){const detail=await response.json().catch(()=>({}));throw Error(detail.error || 'Proxy HTTP '+response.status);}
 const json=await response.json(); const data=json.response?.data;
 if(!Array.isArray(data))throw Error('Invalid proxy response; verify Pages Function deployment');
 rows.push(...data); offset+=data.length;
 if(!data.length || offset>=Number(json.response.total||0) || data.length<5000)break;
 if(offset>=50000)throw Error('Response exceeds safety limit');
 }
 const groups=new Map();
 for(const r of rows){if(r.value===null||r.value===undefined||String(r.value).trim()==='')continue; const value=Number(r.value); let date=normalizeDate(r.period); if(!Number.isFinite(value)||date<cutoff)continue;
 if(frequency==='monthly')date=date.slice(0,7)+'-01';
 if(frequency==='weekly' && native==='daily'){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+(5-d.getUTCDay()+7)%7);date=d.toISOString().slice(0,10);}
 const g=groups.get(date)||[0,0];g[0]+=value;g[1]++;groups.set(date,g);
 }
 return [...groups].map(([date,g])=>({date,value:g[0]/g[1]})).sort((a,b)=>a.date.localeCompare(b.date));
 }catch(e){if(e.name==='AbortError')throw Error('Proxy request exceeded 90 seconds');throw e;}finally{clearTimeout(timer);}
}

function buildAlignedLabels(dataObj){
  const dates = new Set();
  Object.values(dataObj).forEach(arr => arr.forEach(r => dates.add(r.date)));
  return [...dates].sort();
}

function renderPriceChart(){
  const canvas = document.getElementById("priceChart");
  if(!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  if(priceChart) {priceChart.destroy();priceChart=null;}

  const datasets = selectedSeries
    .filter(s => s.plot && rawData[s.seriesId])
    .map(s => {
      const map = new Map(rawData[s.seriesId].map(r => [r.date,r.value]));
      return {
        label:`${s.label} (${s.unit})`,
        data:alignedLabels.map(d => map.get(d) ?? null),
        yAxisID:s.axis || "y",
        borderWidth:2,
        pointRadius:0,spanGaps:true,
        tension:0.2
      };
    });

  priceChart = new Chart(ctx, {
    type:"line",
    data:{labels:alignedLabels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
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
  const productId = document.getElementById("spreadProductSelect")?.value;
  const feedId = document.getElementById("spreadFeedSelect")?.value;
  if(!productId || !feedId){ setStatus("Spread selectors are missing or empty."); return; }
  if(selectedSeries.find(s=>s.seriesId===productId)?.unit !== selectedSeries.find(s=>s.seriesId===feedId)?.unit){setStatus("Spread requires matching units; no automatic conversion.");return;}
  if(productId === feedId){ setStatus("Select two different series for spread calculation."); return; }
  const p = selectedSeries.find(s => s.seriesId === productId);
  const f = selectedSeries.find(s => s.seriesId === feedId);
  selectedSpreads.push({plot:true, productId, feedId, label:`${p.label} - ${f.label}`});
  renderSpreadTable();
  renderSpreadChart();
}

function renderSpreadTable(){
  const tbody = document.querySelector("#spreadTable tbody");
  if(!tbody) return;
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
  const canvas = document.getElementById("spreadChart");
  if(!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  if(spreadChart) {spreadChart.destroy();spreadChart=null;}
  const datasets = selectedSpreads.filter(s => s.plot && rawData[s.productId] && rawData[s.feedId]).map(s => {
    const pMap = new Map(rawData[s.productId].map(r => [r.date,r.value]));
    const fMap = new Map(rawData[s.feedId].map(r => [r.date,r.value]));
    return {label:s.label,data:alignedLabels.map(d => (pMap.has(d) && fMap.has(d)) ? pMap.get(d) - fMap.get(d) : null),borderWidth:2,pointRadius:0,spanGaps:true,tension:0.2};
  });
  spreadChart = new Chart(ctx,{type:"line",data:{labels:alignedLabels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{title:{display:true,text:"Price Spread Calculations"},legend:{position:"bottom"}},scales:{x:{ticks:{maxTicksLimit:14}},y:{title:{display:true,text:"Spread"}}}}});
}

function renderNormalChart(){
  const id = document.getElementById("normalSeriesSelect")?.value;
  if(!id) return;
  const source = rawData[id] || [];
  const canvas = document.getElementById("normalChart");
  if(!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  if(normalChart) {normalChart.destroy();normalChart=null;}
  if(!source.length) return;
  const item = selectedSeries.find(s => s.seriesId === id);
  const avg = source.reduce((a,b) => a + b.value,0) / source.length;
  const sd = Math.sqrt(source.reduce((a,b) => a + Math.pow(b.value - avg,2),0) / source.length);
  const labels = source.map(r => r.date);
  const values = source.map(r => ((r.value - avg) / (sd || 1)));
  normalChart = new Chart(ctx,{type:"line",data:{labels,datasets:[{label:`${item ? item.label : id} z-score`,data:values,borderWidth:2,pointRadius:0,spanGaps:true,tension:0.2},{label:"Mean",data:labels.map(() => 0),borderWidth:1,pointRadius:0,spanGaps:true},{label:"+1 Std Dev",data:labels.map(() => 1),borderWidth:1,pointRadius:0,spanGaps:true},{label:"-1 Std Dev",data:labels.map(() => -1),borderWidth:1,pointRadius:0,spanGaps:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:`Normalization Plot | Mean ${avg.toFixed(3)}, Std Dev ${sd.toFixed(3)}`},legend:{position:"bottom"}},scales:{x:{ticks:{maxTicksLimit:14}},y:{title:{display:true,text:"Z-score"}}}}});
}

function renderDataTable(){
  const table = document.getElementById("dataTable");
  if(!table) return;
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

function setStatus(msg){
  const status = document.getElementById("status");
  if(status) status.textContent = msg;
  else console.log(msg);
}
function escapeHtml(text){ return String(text ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[c]); }
