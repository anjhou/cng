const svgNS = "http://www.w3.org/2000/svg";
let svg, layers;
let showLabels = true, showStreams = true, showTables = true;

const svgWrap = document.getElementById("svgWrap");
const tooltip = document.getElementById("pfdTooltip");
const mount = document.getElementById("pfdSvgMount");
const inputForm = document.getElementById("inputForm");
const outputTable = document.getElementById("outputTable");
const streamTable = document.getElementById("streamTable");

const inputIds = ["sourGasMmscfd","h2sMolPct","co2MolPct","feedPressure","feedTemperature","mdeaWtPct","leanLoading","richLoading","designFactor","reboilerBtuGal","leanAmineTemp","pumpPressure"];

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}
function addText(g, text, x, y, cls = "", anchor = "start") {
  const t = svgEl("text", { x, y, class: cls, "text-anchor": anchor });
  t.textContent = text;
  g.appendChild(t);
  return t;
}
function n(id) { return Number(document.getElementById(id)?.value || 0); }
function fmt(v, d = 1) { return Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits:d, minimumFractionDigits:d }) : "—"; }
function points(points) { return points.map(p => `${p.x},${p.y}`).join(" "); }

async function loadSvg() {
  const path = mount.dataset.svgSrc || "svg/pfd-template.svg";
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Unable to load ${path}`);
  mount.innerHTML = await res.text();
  svg = document.getElementById("pfdSvg");
  layers = {
    streams: document.getElementById("layerStreams"),
    units: document.getElementById("layerUnits"),
    labels: document.getElementById("layerLabels"),
    tables: document.getElementById("layerTables")
  };
}

function computeModel() {
  const gas = n("sourGasMmscfd");
  const h2s = n("h2sMolPct") / 100;
  const co2 = n("co2MolPct") / 100;
  const acidFrac = h2s + co2;
  const lbmolDayGas = gas * 1_000_000 / 379.5;
  const acidLbmolDay = lbmolDayGas * acidFrac;
  const workingCapacity = Math.max(n("richLoading") - n("leanLoading"), 0.001);
  const mdeaLbmolDay = acidLbmolDay / workingCapacity;
  const pureMdeaLbDay = mdeaLbmolDay * 119.16;
  const solutionLbDay = pureMdeaLbDay / Math.max(n("mdeaWtPct") / 100, 0.01);
  const solutionGpd = solutionLbDay / 8.72;
  const theoreticalGph = solutionGpd / 24;
  const designGph = theoreticalGph * n("designFactor");
  const designGpm = designGph / 60;
  const designLbHr = designGph * 8.72;
  const reboilerMMBtuHr = designGph * n("reboilerBtuGal") / 1_000_000;
  const condenserMMBtuHr = reboilerMMBtuHr * 0.78;
  const coolerMMBtuHr = designGph * 120 / 1_000_000;
  const pumpDp = Math.max(n("pumpPressure") - n("feedPressure"), 0);
  const pumpHp = designGpm * pumpDp / (1714 * 0.72);
  const sweetGasMmscfd = gas * Math.max(1 - acidFrac * 0.97, 0);
  return {
    gas, h2sPct:n("h2sMolPct"), co2Pct:n("co2MolPct"), feedP:n("feedPressure"), feedT:n("feedTemperature"), leanT:n("leanAmineTemp"), pumpP:n("pumpPressure"),
    acidLbmolDay, mdeaLbmolDay, pureMdeaLbDay, solutionLbDay, theoreticalGph, designGph, designGpm, designLbHr,
    reboilerMMBtuHr, condenserMMBtuHr, coolerMMBtuHr, pumpDp, pumpHp, sweetGasMmscfd
  };
}

const unitLayout = {
  V104: { id:"V-104", name:"Lean Amine\nSurge Drum", type:"vessel", x:250, y:150, w:58, h:125, vertical:true },
  P101: { id:"P-101 A/B", name:"Lean Amine\nPumps", type:"pumpPair", x:248, y:405, w:130, h:60 },
  V101: { id:"V-101", name:"Inlet\nSeparator", type:"vessel", x:250, y:705, w:56, h:120, vertical:true },
  T101: { id:"T-101", name:"Absorber", type:"tower", x:475, y:370, w:74, h:210 },
  LV101:{ id:"LV-101", name:"Level Control\nValve", type:"valve", x:640, y:720, w:38, h:28 },
  V102: { id:"V-102", name:"Rich Amine\nFlash Drum", type:"vessel", x:555, y:705, w:56, h:100, vertical:true },
  E101: { id:"E-101", name:"Rich/Lean Amine\nExchanger", type:"shellTube", x:800, y:690, w:190, h:72 },
  E102: { id:"E-102", name:"Overhead\nCondenser", type:"shellTube", x:652, y:120, w:180, h:66 },
  V103: { id:"V-103", name:"Reflux Drum /\nAccumulator", type:"vessel", x:1220, y:120, w:68, h:135, vertical:true },
  T102: { id:"T-102", name:"Amine Regenerator\nStripper", type:"tower", x:1210, y:370, w:78, h:205 }
};

function unitTooltip(u, m) {
  const base = `Tag name: ${u.id}\nVolumetric flow rate: ${fmt(m.designGpm,1)} gpm\nMass flow rate: ${fmt(m.designLbHr,0)} lb/hr`;
  if (u.type === "pumpPair") return `${base}\nDuty: — MMBtu/hr\nPower: ${fmt(m.pumpHp,1)} hp\nPressure change: ${fmt(m.pumpDp,0)} psig\nHead change: ${fmt(m.pumpDp*2.31/1.0,0)} ft`;
  if (u.type === "shellTube") return `${base}\nDuty: ${fmt(u.id==='E-102'?m.condenserMMBtuHr:m.reboilerMMBtuHr*0.45,2)} MMBtu/hr\nPower: — hp\nTemperature change: ${u.id==='E-102'?'-70':'120'} °F`;
  if (u.type === "tower") return `${base}\nDuty: ${u.id==='T-102'?fmt(m.reboilerMMBtuHr,2):'—'} MMBtu/hr\nPower: — hp\nFeed: ${fmt(m.gas,2)} MMSCFD / ${fmt(m.designGpm,1)} gpm\nProducts: sweet gas, acid gas, regenerated amine`;
  if (u.type === "vessel") return `${base}\nDuty: — MMBtu/hr\nPower: — hp\nVapor flow: ${fmt(m.gas*0.95,2)} MMSCFD\nLiquid flow: ${fmt(m.designGpm,1)} gpm`;
  return base;
}

function drawVessel(g, u) {
  const x=u.x, y=u.y, w=u.w, h=u.h;
  g.appendChild(svgEl("rect",{x:x+8,y:y+14,width:w-16,height:h-28,rx:(w-16)/2,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+w/2,cy:y+14,rx:(w-16)/2,ry:12,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+w/2,cy:y+h-14,rx:(w-16)/2,ry:12,class:"unit-shell"}));
  g.appendChild(svgEl("line",{x1:x+w/2,y1:y+4,x2:x+w/2,y2:y+14,class:"unit-detail"}));
  g.appendChild(svgEl("line",{x1:x+w/2,y1:y+h-14,x2:x+w/2,y2:y+h-2,class:"unit-detail"}));
}
function drawTower(g,u){
  const x=u.x,y=u.y,w=u.w,h=u.h;
  g.appendChild(svgEl("rect",{x:x+8,y:y+18,width:w-16,height:h-36,rx:(w-16)/2,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+w/2,cy:y+18,rx:(w-16)/2,ry:14,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+w/2,cy:y+h-18,rx:(w-16)/2,ry:14,class:"unit-shell"}));
  [0.24,0.42,0.62,0.80].forEach(f=>g.appendChild(svgEl("line",{x1:x+18,y1:y+h*f,x2:x+w-18,y2:y+h*f,class:"tower-tray"})));
  g.appendChild(svgEl("path",{d:`M ${x+18} ${y+h*0.45} L ${x+w-18} ${y+h*0.65} M ${x+w-18} ${y+h*0.45} L ${x+18} ${y+h*0.65}`,class:"packed"}));
}
function drawPumpPair(g,u){
  const x=u.x,y=u.y;
  [0,68].forEach(dx=>{
    g.appendChild(svgEl("circle",{cx:x+25+dx,cy:y+22,r:18,class:"unit-shell"}));
    g.appendChild(svgEl("circle",{cx:x+25+dx,cy:y+22,r:4,fill:"#fff",stroke:"#111827","stroke-width":"1.2"}));
    g.appendChild(svgEl("path",{d:`M ${x+4+dx} ${y+50} H ${x+48+dx} M ${x+10+dx} ${y+42} H ${x+42+dx}`,class:"pump-base"}));
  });
  g.appendChild(svgEl("line",{x1:x+43,y1:y+22,x2:x+68,y2:y+22,class:"unit-detail"}));
}
function drawShellTube(g,u){
  const x=u.x,y=u.y,w=u.w,h=u.h;
  g.appendChild(svgEl("rect",{x:x+25,y:y+15,width:w-50,height:h-30,rx:6,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+25,cy:y+h/2,rx:22,ry:h/2-16,class:"unit-shell"}));
  g.appendChild(svgEl("ellipse",{cx:x+w-25,cy:y+h/2,rx:22,ry:h/2-16,class:"unit-shell"}));
  [0.32,0.44,0.56,0.68].forEach(f=>g.appendChild(svgEl("line",{x1:x+30,y1:y+h*f,x2:x+w-30,y2:y+h*f,class:"exchanger-tube"})));
  g.appendChild(svgEl("line",{x1:x+42,y1:y+8,x2:x+42,y2:y+h-8,class:"unit-detail"}));
  g.appendChild(svgEl("line",{x1:x+w-42,y1:y+8,x2:x+w-42,y2:y+h-8,class:"unit-detail"}));
}
function drawValve(g,u){
  const x=u.x,y=u.y,w=u.w,h=u.h;
  g.appendChild(svgEl("polygon",{points:`${x},${y+h/2} ${x+w/2},${y} ${x+w/2},${y+h} ${x},${y+h/2}`,class:"valve-body"}));
  g.appendChild(svgEl("polygon",{points:`${x+w},${y+h/2} ${x+w/2},${y} ${x+w/2},${y+h} ${x+w},${y+h/2}`,class:"valve-body"}));
  g.appendChild(svgEl("line",{x1:x+w/2,y1:y,x2:x+w/2,y2:y-12,class:"unit-detail"}));
  g.appendChild(svgEl("rect",{x:x+w/2-5,y:y-18,width:10,height:6,class:"valve-body"}));
}
function drawUnit(u, m) {
  const g = svgEl("g", { id:`unit-${u.id.replace(/[^A-Za-z0-9]/g,'')}`, class:"unit selectable", "data-tag":u.id });
  g.dataset.tooltip = unitTooltip(u,m);
  if (u.type === "vessel") drawVessel(g,u);
  else if (u.type === "tower") drawTower(g,u);
  else if (u.type === "pumpPair") drawPumpPair(g,u);
  else if (u.type === "shellTube") drawShellTube(g,u);
  else if (u.type === "valve") drawValve(g,u);
  addText(g,u.id,u.x+u.w/2,u.y+u.h+18,"unit-tag","middle");
  u.name.split("\n").forEach((line,i)=>addText(g,line,u.x+u.w/2,u.y+u.h+34+i*14,"unit-name","middle"));
  layers.units.appendChild(g); attachTooltip(g);
}

function streamTooltip(s,m){
  const gpm = s.gpm ?? m.designGpm;
  const bpd = gpm*34.2857;
  const lbhr = s.lbhr ?? gpm*60*8.72;
  const enth = s.enthalpy ?? (lbhr*250/1_000_000);
  return `Name: ${s.name}\nVolumetric flow rate: ${fmt(gpm,1)} gpm\nVolumetric flow rate: ${fmt(bpd,0)} bpd\nMass flow rate: ${fmt(lbhr,0)} lb/hr\nTemperature: ${fmt(s.temp,1)} °F\nPressure: ${fmt(s.pressure,1)} psig\nEnthalpy: ${fmt(enth,2)} MMBtu/hr`;
}
function drawStream(s,m){
  if(!showStreams) return;
  const g=svgEl("g",{id:`stream-${s.id}`});
  const line=svgEl("polyline",{points:points(s.path),class:`stream ${s.cls}`});
  const hit=svgEl("polyline",{points:points(s.path),class:"stream-hitbox"});
  hit.dataset.tooltip=streamTooltip(s,m);
  g.appendChild(line); g.appendChild(hit); layers.streams.appendChild(g); attachTooltip(hit);
  if(showLabels && s.label){ addText(layers.labels,s.label,s.labelX,s.labelY,"stream-label"); }
}
function buildStreams(m){
  return [
    {id:"SG-001",name:"Sour Gas Feed",cls:"sour-gas",path:[{x:110,y:765},{x:250,y:765}],label:"Sour Gas Feed",labelX:95,labelY:735,gpm:0,lbhr:m.gas*1000000/24*0.045,temp:m.feedT,pressure:m.feedP,enthalpy:m.gas*1000},
    {id:"SG-002",name:"Conditioned Sour Gas",cls:"sour-gas",path:[{x:306,y:735},{x:390,y:735},{x:390,y:520},{x:475,y:520}],label:"Sour Gas to Absorber",labelX:330,labelY:500,gpm:0,lbhr:m.gas*1000000/24*0.044,temp:m.feedT,pressure:m.feedP-5},
    {id:"COND-001",name:"Inlet Separator Liquid",cls:"water",path:[{x:278,y:825},{x:278,y:850},{x:330,y:850}],label:"Condensate to Drain",labelX:318,labelY:840,gpm:3,lbhr:1500,temp:m.feedT,pressure:30},
    {id:"LA-001",name:"Lean Amine from V-104",cls:"lean-amine",path:[{x:279,y:275},{x:279,y:405}],label:"Lean Amine",labelX:300,labelY:338,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.leanT,pressure:30},
    {id:"LA-002",name:"Lean Amine to Absorber",cls:"lean-amine",path:[{x:378,y:435},{x:475,y:435}],label:"Lean Amine to Absorber",labelX:385,labelY:420,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.leanT,pressure:m.pumpP},
    {id:"SWG-001",name:"Sweet Gas Product",cls:"sweet-gas",path:[{x:549,y:430},{x:615,y:430}],label:"Sweet Gas Product",labelX:625,labelY:427,gpm:0,lbhr:m.sweetGasMmscfd*1000000/24*0.043,temp:m.feedT+5,pressure:m.feedP-12,enthalpy:m.sweetGasMmscfd*980},
    {id:"RA-001",name:"Rich Amine from Absorber",cls:"rich-amine",path:[{x:512,y:580},{x:512,y:715},{x:555,y:715}],label:"Rich Amine",labelX:525,labelY:700,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.feedT+18,pressure:m.feedP-15},
    {id:"FG-001",name:"Flash Gas",cls:"sour-gas",path:[{x:583,y:705},{x:583,y:670},{x:640,y:670}],label:"Flash Gas",labelX:612,labelY:662,gpm:0,lbhr:1200,temp:m.feedT+10,pressure:60},
    {id:"RA-002",name:"Rich Amine through LV-101",cls:"rich-amine",path:[{x:611,y:755},{x:640,y:755}],label:"",labelX:0,labelY:0,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.feedT+20,pressure:60},
    {id:"RA-003",name:"Rich Amine to E-101 Tube Inlet",cls:"rich-amine",path:[{x:678,y:734},{x:800,y:734}],label:"Rich Amine",labelX:690,labelY:720,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.feedT+20,pressure:58},
    {id:"RA-004",name:"Preheated Rich Amine to T-102",cls:"acid-gas",path:[{x:990,y:726},{x:1160,y:726},{x:1160,y:485},{x:1210,y:485}],label:"Rich Amine Preheated",labelX:1030,labelY:712,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.feedT+170,pressure:32},
    {id:"HL-001",name:"Hot Lean Amine from T-102 Bottom",cls:"hot-lean",path:[{x:1249,y:575},{x:1249,y:805},{x:895,y:805},{x:895,y:762}],label:"Hot Lean Amine",labelX:1260,labelY:610,gpm:m.designGpm,lbhr:m.designLbHr,temp:245,pressure:35},
    {id:"LA-003",name:"Lean Amine from E-101 Shell Outlet to E-102",cls:"lean-amine",path:[{x:895,y:690},{x:895,y:165},{x:832,y:165}],label:"Lean Amine to Cooler",labelX:905,labelY:300,gpm:m.designGpm,lbhr:m.designLbHr,temp:150,pressure:32},
    {id:"LA-004",name:"Cooled Lean Amine to V-104",cls:"lean-amine",path:[{x:652,y:165},{x:308,y:165}],label:"Cooled Lean Amine",labelX:420,labelY:152,gpm:m.designGpm,lbhr:m.designLbHr,temp:m.leanT,pressure:28},
    {id:"AG-001",name:"T-102 Overhead Acid Gas",cls:"acid-gas",path:[{x:1249,y:370},{x:1249,y:75},{x:742,y:75},{x:742,y:120}],label:"H₂S + CO₂ Vapor",labelX:770,labelY:65,gpm:0,lbhr:m.acidLbmolDay*44/24,temp:210,pressure:18},
    {id:"AG-002",name:"Condenser Outlet to V-103",cls:"water",path:[{x:742,y:186},{x:742,y:250},{x:1254,y:250},{x:1254,y:255}],label:"Condensate",labelX:940,labelY:238,gpm:15,lbhr:7500,temp:120,pressure:16},
    {id:"AG-003",name:"Acid Gas Product",cls:"acid-gas",path:[{x:1288,y:185},{x:1420,y:185}],label:"H₂S + CO₂ to Recovery",labelX:1330,labelY:170,gpm:0,lbhr:m.acidLbmolDay*44/24,temp:105,pressure:14},
    {id:"REF-001",name:"Reflux Return",cls:"acid-gas",path:[{x:1254,y:255},{x:1254,y:340},{x:1210,y:340}],label:"Reflux",labelX:1265,labelY:325,gpm:12,lbhr:6000,temp:110,pressure:16}
  ];
}

function drawSvgTables(m){
  if(!showTables) return;
  const g=svgEl("g",{class:"svg-table",id:"svg-amine-summary"});
  g.appendChild(svgEl("rect",{x:25,y:55,width:315,height:118,rx:8}));
  addText(g,"Amine Design Basis",42,80,"svg-table-title");
  [["Sour Gas",`${fmt(m.gas,2)} MMSCFD`],["Acid Gas Load",`${fmt(m.acidLbmolDay,0)} lbmol/day`],["Lean Amine",`${fmt(m.designGpm,1)} gpm`],["Reboiler Duty",`${fmt(m.reboilerMMBtuHr,2)} MMBtu/hr`],["Pump Power",`${fmt(m.pumpHp,1)} hp`]].forEach(([k,v],i)=>{const y=102+i*15; addText(g,k,42,y,"svg-table-text"); addText(g,v,320,y,"svg-table-text","end");});
  layers.tables.appendChild(g);
}

function render(){
  if(!layers) return;
  Object.values(layers).forEach(l=>l.innerHTML="");
  const m=computeModel();
  addText(layers.labels,"Amine Gas Sweetening Unit",560,36,"view-title");
  addText(layers.labels,"Absorption, flash, rich/lean exchange, regeneration, condenser/accumulator, and lean amine recirculation",560,58,"view-subtitle");
  Object.values(unitLayout).forEach(u=>drawUnit(u,m));
  buildStreams(m).forEach(s=>drawStream(s,m));
  drawSvgTables(m);
  updateTables(m);
}
function updateTables(m){
  outputTable.innerHTML = [
    ["Total acid gas load",`${fmt(m.acidLbmolDay,0)} lbmol/day`],
    ["Theoretical MDEA",`${fmt(m.mdeaLbmolDay,0)} lbmol/day`],
    ["Pure MDEA",`${fmt(m.pureMdeaLbDay,0)} lb/day`],
    ["40 wt% solution basis",`${fmt(m.solutionLbDay,0)} lb/day`],
    ["Theoretical circulation",`${fmt(m.theoreticalGph,0)} gal/hr`],
    ["Design circulation",`${fmt(m.designGph,0)} gal/hr / ${fmt(m.designGpm,1)} gpm`],
    ["Reboiler duty",`${fmt(m.reboilerMMBtuHr,2)} MMBtu/hr`],
    ["Condenser duty",`${fmt(m.condenserMMBtuHr,2)} MMBtu/hr`],
    ["Lean pump power",`${fmt(m.pumpHp,1)} hp`]
  ].map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  const rows = buildStreams(m).filter(s=>s.label).slice(0,8).map(s=>[s.name, `${s.gpm?fmt(s.gpm,1)+' gpm':fmt(s.lbhr,0)+' lb/hr'} | ${fmt(s.temp,0)} °F | ${fmt(s.pressure,0)} psig`]);
  streamTable.innerHTML = rows.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join("");
}
function attachTooltip(el){
  el.addEventListener("mouseenter",()=>{tooltip.textContent=el.dataset.tooltip||"";tooltip.style.display="block";});
  el.addEventListener("mousemove",ev=>{const r=svgWrap.getBoundingClientRect(); tooltip.style.left=`${ev.clientX-r.left+svgWrap.scrollLeft+14}px`; tooltip.style.top=`${ev.clientY-r.top+svgWrap.scrollTop+14}px`;});
  el.addEventListener("mouseleave",()=>{tooltip.style.display="none";});
}
function initControls(){
  inputIds.forEach(id=>document.getElementById(id).addEventListener("input",render));
  document.getElementById("btnReset").addEventListener("click",()=>{inputForm.reset();render();});
  document.getElementById("btnLabels").addEventListener("click",()=>{showLabels=!showLabels;render();});
  document.getElementById("btnStreams").addEventListener("click",()=>{showStreams=!showStreams;render();});
  document.getElementById("btnTables").addEventListener("click",()=>{showTables=!showTables;render();});
}
(async function start(){
  try{ await loadSvg(); initControls(); render(); }
  catch(e){ svgWrap.insertAdjacentHTML("beforeend",`<div class="svg-load-error">${e.message}</div>`); console.error(e); }
})();
