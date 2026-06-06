'use strict';

const R = 10.7316; // psia ft3 / lbmol R
const EPS = 1e-12;

const componentLibrary = [
  // Light gases and inerts
  {group:'Light gases',name:'Hydrogen',MW:2.016,Tc:59.7,Pc:187.5,omega:-0.216,Zra:0.305,Tb:36.7,liqSG:0.071,cpA:3.42,muV:0.0090,muL:0.013,kV:0.095},
  {group:'Light gases',name:'Nitrogen',MW:28.014,Tc:227.2,Pc:492.3,omega:0.037,Zra:0.290,Tb:139.3,liqSG:0.808,cpA:0.249,muV:0.0178,muL:0.160,kV:0.015},
  {group:'Light gases',name:'Oxygen',MW:31.999,Tc:278.2,Pc:731.4,omega:0.022,Zra:0.288,Tb:162.3,liqSG:1.141,cpA:0.219,muV:0.0200,muL:0.200,kV:0.015},
  {group:'Light gases',name:'Carbon Monoxide',MW:28.010,Tc:239.2,Pc:507.5,omega:0.049,Zra:0.289,Tb:146.0,liqSG:0.793,cpA:0.249,muV:0.0175,muL:0.150,kV:0.014},
  {group:'Light gases',name:'Carbon Dioxide',MW:44.010,Tc:547.6,Pc:1071.0,omega:0.225,Zra:0.274,Tb:350.4,liqSG:0.770,cpA:0.200,muV:0.0148,muL:0.080,kV:0.009},
  {group:'Light gases',name:'Hydrogen Sulfide',MW:34.081,Tc:672.4,Pc:1306.0,omega:0.100,Zra:0.284,Tb:383.1,liqSG:0.790,cpA:0.240,muV:0.0120,muL:0.120,kV:0.008},
  {group:'Light gases',name:'Helium',MW:4.003,Tc:9.35,Pc:33.2,omega:-0.390,Zra:0.302,Tb:7.6,liqSG:0.125,cpA:1.24,muV:0.0196,muL:0.004,kV:0.085},
  {group:'Light gases',name:'Argon',MW:39.948,Tc:271.0,Pc:705.8,omega:-0.004,Zra:0.291,Tb:157.1,liqSG:1.395,cpA:0.125,muV:0.0225,muL:0.250,kV:0.010},

  // Hydrocarbons
  {group:'Paraffins',name:'Methane',MW:16.043,Tc:343.01,Pc:666.4,omega:0.0115,Zra:0.289,Tb:201.0,liqSG:0.300,cpA:0.53,muV:0.011,muL:0.012,kV:0.020},
  {group:'Paraffins',name:'Ethane',MW:30.070,Tc:549.58,Pc:706.5,omega:0.0995,Zra:0.281,Tb:332.0,liqSG:0.356,cpA:0.42,muV:0.009,muL:0.020,kV:0.018},
  {group:'Paraffins',name:'Propane',MW:44.097,Tc:665.73,Pc:616.0,omega:0.1523,Zra:0.276,Tb:416.0,liqSG:0.508,cpA:0.39,muV:0.008,muL:0.090,kV:0.016},
  {group:'Paraffins',name:'i-Butane',MW:58.124,Tc:734.13,Pc:529.1,omega:0.1848,Zra:0.275,Tb:470.5,liqSG:0.563,cpA:0.39,muV:0.0077,muL:0.130,kV:0.015},
  {group:'Paraffins',name:'n-Butane',MW:58.124,Tc:765.29,Pc:550.6,omega:0.2002,Zra:0.274,Tb:491.7,liqSG:0.584,cpA:0.40,muV:0.0075,muL:0.150,kV:0.015},
  {group:'Paraffins',name:'i-Pentane',MW:72.151,Tc:828.77,Pc:490.4,omega:0.2274,Zra:0.270,Tb:541.8,liqSG:0.620,cpA:0.40,muV:0.0072,muL:0.210,kV:0.014},
  {group:'Paraffins',name:'n-Pentane',MW:72.151,Tc:845.47,Pc:489.5,omega:0.2515,Zra:0.268,Tb:556.7,liqSG:0.626,cpA:0.41,muV:0.0070,muL:0.240,kV:0.014},
  {group:'Paraffins',name:'n-Hexane',MW:86.178,Tc:913.41,Pc:436.9,omega:0.3013,Zra:0.264,Tb:615.3,liqSG:0.659,cpA:0.42,muV:0.0068,muL:0.310,kV:0.013},
  {group:'Paraffins',name:'n-Heptane',MW:100.205,Tc:972.4,Pc:397.0,omega:0.349,Zra:0.260,Tb:669.8,liqSG:0.684,cpA:0.43,muV:0.0066,muL:0.390,kV:0.012},
  {group:'Paraffins',name:'n-Octane',MW:114.232,Tc:1024.9,Pc:361.0,omega:0.398,Zra:0.256,Tb:703.0,liqSG:0.703,cpA:0.44,muV:0.0064,muL:0.510,kV:0.011},
  {group:'Paraffins',name:'n-Nonane',MW:128.259,Tc:1070.0,Pc:332.0,omega:0.443,Zra:0.252,Tb:755.7,liqSG:0.718,cpA:0.45,muV:0.0062,muL:0.660,kV:0.010},
  {group:'Paraffins',name:'n-Decane',MW:142.286,Tc:1111.8,Pc:304.0,omega:0.490,Zra:0.247,Tb:805.7,liqSG:0.730,cpA:0.46,muV:0.0060,muL:0.840,kV:0.010},

  {group:'Olefins',name:'Ethylene',MW:28.054,Tc:508.3,Pc:731.0,omega:0.087,Zra:0.281,Tb:305.4,liqSG:0.568,cpA:0.37,muV:0.010,muL:0.060,kV:0.017},
  {group:'Olefins',name:'Propylene',MW:42.081,Tc:656.0,Pc:667.0,omega:0.142,Zra:0.277,Tb:407.0,liqSG:0.522,cpA:0.38,muV:0.008,muL:0.080,kV:0.016},
  {group:'Olefins',name:'1-Butene',MW:56.108,Tc:755.4,Pc:583.0,omega:0.191,Zra:0.274,Tb:480.6,liqSG:0.595,cpA:0.39,muV:0.0075,muL:0.140,kV:0.015},

  {group:'Aromatics',name:'Benzene',MW:78.114,Tc:1011.4,Pc:714.2,omega:0.210,Zra:0.271,Tb:636.0,liqSG:0.879,cpA:0.42,muV:0.0085,muL:0.650,kV:0.010},
  {group:'Aromatics',name:'Toluene',MW:92.141,Tc:1069.8,Pc:596.0,omega:0.263,Zra:0.264,Tb:696.5,liqSG:0.867,cpA:0.43,muV:0.0082,muL:0.590,kV:0.009},
  {group:'Aromatics',name:'Ethylbenzene',MW:106.168,Tc:1111.7,Pc:523.0,omega:0.303,Zra:0.263,Tb:734.4,liqSG:0.867,cpA:0.43,muV:0.0080,muL:0.700,kV:0.009},
  {group:'Aromatics',name:'p-Xylene',MW:106.168,Tc:1108.0,Pc:511.0,omega:0.324,Zra:0.260,Tb:741.7,liqSG:0.861,cpA:0.43,muV:0.0080,muL:0.650,kV:0.009},
  {group:'Aromatics',name:'m-Xylene',MW:106.168,Tc:1117.0,Pc:512.0,omega:0.326,Zra:0.260,Tb:748.0,liqSG:0.864,cpA:0.43,muV:0.0080,muL:0.620,kV:0.009},
  {group:'Aromatics',name:'o-Xylene',MW:106.168,Tc:1136.0,Pc:542.0,omega:0.310,Zra:0.260,Tb:760.0,liqSG:0.880,cpA:0.43,muV:0.0080,muL:0.810,kV:0.009},

  {group:'Polar',name:'Water',MW:18.015,Tc:1165.1,Pc:3200.1,omega:0.344,Zra:0.233,Tb:671.7,liqSG:1.000,cpA:1.00,muV:0.013,muL:1.000,kV:0.014},
  {group:'Polar',name:'Methanol',MW:32.042,Tc:923.0,Pc:1172.0,omega:0.559,Zra:0.224,Tb:607.6,liqSG:0.792,cpA:0.60,muV:0.010,muL:0.590,kV:0.012},
  {group:'Polar',name:'Ethanol',MW:46.069,Tc:925.0,Pc:890.0,omega:0.645,Zra:0.250,Tb:633.9,liqSG:0.789,cpA:0.58,muV:0.010,muL:1.200,kV:0.010},
  {group:'Polar',name:'Acetone',MW:58.080,Tc:916.0,Pc:682.0,omega:0.307,Zra:0.247,Tb:610.0,liqSG:0.791,cpA:0.52,muV:0.008,muL:0.320,kV:0.009},

  // Petroleum pseudo components, representative values
  {group:'Petroleum pseudo',name:'C6-C7 Light Naphtha',MW:85,Tc:910,Pc:420,omega:0.31,Zra:0.263,Tb:620,liqSG:0.670,cpA:0.43,muV:0.0068,muL:0.35,kV:0.012},
  {group:'Petroleum pseudo',name:'C8-C10 Heavy Naphtha',MW:115,Tc:1040,Pc:350,omega:0.42,Zra:0.255,Tb:735,liqSG:0.735,cpA:0.45,muV:0.0062,muL:0.70,kV:0.010},
  {group:'Petroleum pseudo',name:'Kerosene / Jet Cut',MW:170,Tc:1225,Pc:260,omega:0.58,Zra:0.240,Tb:900,liqSG:0.800,cpA:0.48,muV:0.0055,muL:1.60,kV:0.008},
  {group:'Petroleum pseudo',name:'Diesel / AGO Cut',MW:230,Tc:1380,Pc:210,omega:0.75,Zra:0.225,Tb:1060,liqSG:0.850,cpA:0.50,muV:0.0050,muL:4.00,kV:0.007},
  {group:'Petroleum pseudo',name:'VGO Pseudo',MW:360,Tc:1580,Pc:150,omega:1.05,Zra:0.205,Tb:1250,liqSG:0.920,cpA:0.52,muV:0.0045,muL:20.0,kV:0.006},
  {group:'Petroleum pseudo',name:'Resid Pseudo',MW:650,Tc:1850,Pc:95,omega:1.45,Zra:0.180,Tb:1500,liqSG:1.020,cpA:0.54,muV:0.0040,muL:250.0,kV:0.005}
];

let activeComponents = [];
let customCounter = 1;
const defaultNames = ['Methane','Ethane','Propane','i-Butane','n-Butane','i-Pentane','n-Pentane','n-Hexane','Benzene','Toluene','Water','Ethanol'];
const defaultZByName = {'Methane':0.72,'Ethane':0.08,'Propane':0.06,'i-Butane':0.02,'n-Butane':0.04,'i-Pentane':0.01,'n-Pentane':0.02,'n-Hexane':0.02,'Benzene':0.01,'Toluene':0.01,'Water':0.00,'Ethanol':0.01};

function $(id){ return document.getElementById(id); }
function fmt(v,n=5){ return Number.isFinite(v) ? Number(v).toFixed(n) : '—'; }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }
function clamp(v,lo,hi){ return Math.min(Math.max(v,lo),hi); }
function byName(name){ return componentLibrary.find(c=>c.name===name); }
function cloneComp(c,z=0){ return {...c, z}; }

function init(){
  activeComponents = defaultNames.map(n=>cloneComp(byName(n), defaultZByName[n] || 0));
  initLibraryControls();
  renderCompositionTable();
  $('normalizeBtn').addEventListener('click', normalizeComposition);
  $('calculateBtn').addEventListener('click', calculate);
  $('resetBtn').addEventListener('click', resetExample);
  $('clearBtn').addEventListener('click', clearStream);
  $('addComponentBtn').addEventListener('click', addSelectedComponent);
  $('addCustomBtn').addEventListener('click', addCustomComponent);
  calculate();
}

function initLibraryControls(){
  const groups = [...new Set(componentLibrary.map(c=>c.group))];
  $('componentGroup').innerHTML = groups.map(g=>`<option value="${g}">${g}</option>`).join('');
  $('componentGroup').addEventListener('change', populateComponentPicker);
  populateComponentPicker();
}
function populateComponentPicker(){
  const g = $('componentGroup').value;
  $('componentPicker').innerHTML = componentLibrary.filter(c=>c.group===g).map(c=>`<option value="${c.name}">${c.name} | MW ${fmt(c.MW,2)} | Tc ${fmt(c.Tc,1)} °R</option>`).join('');
}

function renderCompositionTable(){
  const body = $('compositionBody');
  body.innerHTML = activeComponents.map((c,i)=>`
    <tr>
      <td>${c.name}</td><td>${fmt(c.MW,3)}</td><td>${fmt(c.Tc,1)}</td><td>${fmt(c.Pc,1)}</td><td>${fmt(c.omega,4)}</td>
      <td><input class="composition-input" id="z${i}" type="number" min="0" step="0.0001" value="${Number(c.z||0).toFixed(6)}"></td>
      <td><button class="remove-btn" data-index="${i}">Remove</button></td>
    </tr>`).join('');
  [...document.querySelectorAll('.remove-btn')].forEach(btn=>btn.addEventListener('click', e=>removeComponent(Number(e.target.dataset.index))));
}
function syncZFromInputs(){
  activeComponents.forEach((c,i)=>{ c.z = Math.max(0, Number($('z'+i)?.value)||0); });
}
function getZ(){
  syncZFromInputs();
  const raw = activeComponents.map(c=>Math.max(0, Number(c.z)||0));
  const s = sum(raw);
  if(s <= EPS && raw.length){ raw[0]=1; return raw; }
  return raw.map(v=>v/s);
}
function normalizeComposition(){
  const z = getZ();
  activeComponents.forEach((c,i)=>{ c.z=z[i]; $('z'+i).value = z[i].toFixed(6); });
}
function addSelectedComponent(){
  syncZFromInputs();
  const name = $('componentPicker').value;
  if(activeComponents.some(c=>c.name===name)){ setStatus(`${name} is already in the stream.`, 'warn'); return; }
  activeComponents.push(cloneComp(byName(name),0));
  renderCompositionTable();
  setStatus(`${name} added. Enter mole fraction and run calculation.`, 'ok');
}
function addCustomComponent(){
  syncZFromInputs();
  const name = $('customName').value.trim() || `Custom-${customCounter++}`;
  const MW = Number($('customMW').value), Tc=Number($('customTc').value), Pc=Number($('customPc').value), omega=Number($('customOmega').value);
  const liqSG = Number($('customSG').value), Tb=Number($('customTb').value), cpA=Number($('customCp').value);
  if(!(MW>0 && Tc>0 && Pc>0 && liqSG>0)){ setStatus('Custom component requires MW, Tc, Pc, and liquid SG greater than zero.', 'warn'); return; }
  const c = {group:'Custom', name, MW, Tc, Pc, omega:Number.isFinite(omega)?omega:0.5, Zra:0.25, Tb:Number.isFinite(Tb)&&Tb>0?Tb:0.65*Tc, liqSG, cpA:Number.isFinite(cpA)&&cpA>0?cpA:0.45, muV:0.006, muL:1.0, kV:0.008};
  componentLibrary.push(c);
  activeComponents.push(cloneComp(c,0));
  initLibraryControls();
  renderCompositionTable();
  setStatus(`${name} added as a custom pseudo-component.`, 'ok');
}
function removeComponent(i){
  syncZFromInputs();
  const removed = activeComponents.splice(i,1)[0];
  renderCompositionTable();
  setStatus(`${removed.name} removed from stream.`, 'ok');
}
function resetExample(){ activeComponents = defaultNames.map(n=>cloneComp(byName(n), defaultZByName[n] || 0)); renderCompositionTable(); calculate(); }
function clearStream(){ activeComponents = []; renderCompositionTable(); ['flashResults','vaporResults','liquidResults','phaseComposition'].forEach(id=>$(id).innerHTML=''); setStatus('Stream cleared. Add components from the library.', 'warn'); }
function setStatus(msg, cls='ok'){ $('status').className = `status ${cls}`; $('status').textContent = msg; }

function wilsonK(T,P, comps=activeComponents){ return comps.map(c => clamp((c.Pc/P) * Math.exp(5.373*(1+c.omega)*(1 - c.Tc/T)), 1e-8, 1e8)); }
function rachfordRice(z,K){ return beta => sum(z.map((zi,i)=> zi*(K[i]-1)/(1 + beta*(K[i]-1)))); }
function solveBeta(z,K){
  const f = rachfordRice(z,K); const f0=f(0), f1=f(1);
  if(f0 < 0) return 0; if(f1 > 0) return 1;
  let lo=0, hi=1, mid=0.5;
  for(let it=0; it<100; it++){ mid=0.5*(lo+hi); const fm=f(mid); if(Math.abs(fm)<1e-12) break; if(fm>0) lo=mid; else hi=mid; }
  return mid;
}
function prParams(T, comps=activeComponents){
  return comps.map(c=>{ const kappa=0.37464+1.54226*c.omega-0.26992*c.omega*c.omega; const alpha=Math.pow(1+kappa*(1-Math.sqrt(T/c.Tc)),2); return {a:0.45724*R*R*c.Tc*c.Tc/c.Pc*alpha,b:0.07780*R*c.Tc/c.Pc}; });
}
function mixAB(T,P,x, comps=activeComponents){
  const p=prParams(T,comps); let aMix=0;
  for(let i=0;i<comps.length;i++) for(let j=0;j<comps.length;j++) aMix += x[i]*x[j]*Math.sqrt(p[i].a*p[j].a); // kij = 0 default
  const bMix=sum(x.map((xi,i)=>xi*p[i].b));
  return {A:aMix*P/(R*R*T*T), B:bMix*P/(R*T), aMix, bMix, params:p};
}
function cubicRealRoots(a,b,c,d){
  b/=a; c/=a; d/=a; const q=(3*c-b*b)/9; const r=(9*b*c-27*d-2*b*b*b)/54; const disc=q*q*q+r*r; let roots=[];
  if(disc>=0){ const s=Math.cbrt(r+Math.sqrt(disc)); const t=Math.cbrt(r-Math.sqrt(disc)); roots.push(-b/3+s+t); }
  else{ const theta=Math.acos(clamp(r/Math.sqrt(-q*q*q),-1,1)); for(let k=0;k<3;k++) roots.push(2*Math.sqrt(-q)*Math.cos((theta+2*Math.PI*k)/3)-b/3); }
  return roots.filter(v=>Number.isFinite(v)&&v>0).sort((x,y)=>x-y);
}
function prZ(T,P,x,phase, comps=activeComponents){
  const {A,B}=mixAB(T,P,x,comps); const roots=cubicRealRoots(1, -(1-B), A-3*B*B-2*B, -(A*B-B*B-B*B*B));
  if(!roots.length) return 1; return phase==='L'?roots[0]:roots[roots.length-1];
}
function lnPhiPR(T,P,x,phase, comps=activeComponents){
  const m=mixAB(T,P,x,comps); const Z=prZ(T,P,x,phase,comps); const sqrt2=Math.sqrt(2); const logTerm=Math.log((Z+(1+sqrt2)*m.B)/(Z+(1-sqrt2)*m.B));
  return comps.map((_,i)=>{ let sumAij=0; for(let j=0;j<comps.length;j++) sumAij += x[j]*Math.sqrt(m.params[i].a*m.params[j].a); const biOverB=m.params[i].b/Math.max(m.bMix,EPS); const first=biOverB*(Z-1)-Math.log(Math.max(Z-m.B,EPS)); const second=(m.A/(2*sqrt2*Math.max(m.B,EPS)))*(2*sumAij/Math.max(m.aMix,EPS)-biOverB)*logTerm; return first-second; });
}
function tpFlashPR(T,P,z, comps=activeComponents){
  let K=wilsonK(T,P,comps); let beta=solveBeta(z,K), x=[], y=[];
  for(let it=0; it<80; it++){
    beta=solveBeta(z,K); x=z.map((zi,i)=>zi/(1+beta*(K[i]-1))); y=x.map((xi,i)=>K[i]*xi); const sx=sum(x), sy=sum(y); x=x.map(v=>v/sx); y=y.map(v=>v/sy);
    if(beta<=1e-10 || beta>=1-1e-10) break;
    const lnPhiL=lnPhiPR(T,P,x,'L',comps), lnPhiV=lnPhiPR(T,P,y,'V',comps);
    const Knew=K.map((_,i)=>clamp(Math.exp(lnPhiL[i]-lnPhiV[i]),1e-8,1e8)); const err=Math.max(...Knew.map((v,i)=>Math.abs(Math.log(v/K[i])))); K=Knew; if(err<1e-8) break;
  }
  beta=solveBeta(z,K); x=z.map((zi,i)=>zi/(1+beta*(K[i]-1))); y=x.map((xi,i)=>K[i]*xi); const sx=sum(x), sy=sum(y);
  return {beta,x:x.map(v=>v/sx),y:y.map(v=>v/sy),K};
}
function pseudoLKZ(T,P,z, comps=activeComponents){ const Tc=sum(z.map((zi,i)=>zi*comps[i].Tc)); const Pc=sum(z.map((zi,i)=>zi*comps[i].Pc)); const omega=sum(z.map((zi,i)=>zi*comps[i].omega)); const Tr=T/Tc, Pr=P/Pc; return clamp(1-0.08*Pr/Math.pow(Tr,1.2)-0.04*omega*Pr/Math.pow(Tr,2),0.20,1.20); }
function nrtlGamma(x,T, comps=activeComponents){
  const alpha=0.30;
  return comps.map((ci,i)=>{ let lnG=0; for(let j=0;j<comps.length;j++){ if(i===j) continue; const polar=(ci.name.includes('Water')||comps[j].name.includes('Water')||ci.group==='Polar'||comps[j].group==='Polar')?0.55:0; const tau=0.12+0.015*Math.abs(ci.MW-comps[j].MW)+polar; const G=Math.exp(-alpha*tau); lnG += x[j]*x[j]*tau*G; } return Math.exp(lnG); });
}
function mixtureMW(x, comps=activeComponents){ return sum(x.map((xi,i)=>xi*comps[i].MW)); }
function idealCp(x, comps=activeComponents){ return sum(x.map((xi,i)=>xi*comps[i].cpA)); }
function vaporDensity(T,P,x,Z, comps=activeComponents){ return P*mixtureMW(x,comps)/(Z*R*T); }
function liquidDensityRackett(T,x, comps=activeComponents){
  const MW=mixtureMW(x,comps); let molarVol=0;
  for(let i=0;i<comps.length;i++){ const c=comps[i]; const Tr=clamp(T/c.Tc,0.20,0.99); const Vc=R*c.Tc/c.Pc; const Vm=Vc*Math.pow(c.Zra,1+Math.pow(1-Tr,2/7)); molarVol += x[i]*Vm; }
  return MW/Math.max(molarVol,EPS);
}
function liquidDensityIdeal(x, comps=activeComponents){ const MW=mixtureMW(x,comps); const molarVol=sum(x.map((xi,i)=>xi*comps[i].MW/(comps[i].liqSG*62.4))); return MW/Math.max(molarVol,EPS); }
function vaporViscosity(x, comps=activeComponents){ return sum(x.map((xi,i)=>xi*comps[i].muV)); }
function liquidViscosity(x, comps=activeComponents){ return Math.exp(sum(x.map((xi,i)=>xi*Math.log(Math.max(comps[i].muL,1e-6))))); }
function thermalConductivityVapor(x, comps=activeComponents){ return sum(x.map((xi,i)=>xi*comps[i].kV)); }
function apiGravity(rho){ const sg=rho/62.4; return 141.5/sg-131.5; }
function phaseProps(T,P,comp,phase,Z, comps=activeComponents){
  const MW=mixtureMW(comp,comps), Cp=idealCp(comp,comps);
  if(phase==='V'){ const rho=vaporDensity(T,P,comp,Z,comps); return {MW,Cp,Z,rho,mu:vaporViscosity(comp,comps),k:thermalConductivityVapor(comp,comps),sg:MW/28.967,api:null,h:Cp*((T-459.67)-60)}; }
  const rho=$('densityMethod').value==='ideal'?liquidDensityIdeal(comp,comps):liquidDensityRackett(T,comp,comps); return {MW,Cp,Z,rho,mu:liquidViscosity(comp,comps),k:null,sg:rho/62.4,api:apiGravity(rho),h:Cp*((T-459.67)-60)};
}
function rowTable(rows){ return rows.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join(''); }

function calculate(){
  try{
    if(!activeComponents.length) throw new Error('Add at least one component to the stream.');
    const pkg=$('propertyPackage').value, T=Number($('temperature').value)+459.67, P=Number($('pressure').value), z=getZ();
    if(T<=0 || P<=0) throw new Error('Temperature and pressure must be positive.');
    activeComponents.forEach((c,i)=>{ c.z=z[i]; if($('z'+i)) $('z'+i).value=z[i].toFixed(6); });
    let flash, status;
    if(pkg==='PR'){ flash=tpFlashPR(T,P,z); status='PR EOS flash converged. Fugacity coefficients used for K-value update.'; }
    else if(pkg==='LK'){ const K=wilsonK(T,P); const beta=solveBeta(z,K); let x=z.map((zi,i)=>zi/(1+beta*(K[i]-1))); let y=x.map((xi,i)=>K[i]*xi); const sx=sum(x), sy=sum(y); flash={beta,x:x.map(v=>v/sx),y:y.map(v=>v/sy),K}; status='Lee-Kesler mode uses corresponding-states Z with Wilson flash estimate.'; }
    else { const gamma=nrtlGamma(z,T); const K=wilsonK(T,P).map((v,i)=>clamp(v*gamma[i],1e-8,1e8)); const beta=solveBeta(z,K); let x=z.map((zi,i)=>zi/(1+beta*(K[i]-1))); let y=x.map((xi,i)=>K[i]*xi); const sx=sum(x), sy=sum(y); flash={beta,x:x.map(v=>v/sx),y:y.map(v=>v/sy),K,gamma}; status='NRTL mode applies simplified activity coefficients. Replace with real binary parameters for design.'; }
    const Zv=pkg==='LK'?pseudoLKZ(T,P,flash.y):prZ(T,P,flash.y,'V'); const Zl=pkg==='LK'?0.05:prZ(T,P,flash.x,'L'); const vap=phaseProps(T,P,flash.y,'V',Zv); const liq=phaseProps(T,P,flash.x,'L',Zl);
    setStatus(status,'ok');
    $('flashResults').innerHTML=rowTable([['Temperature',fmt(T-459.67,2)+' °F'],['Pressure',fmt(P,2)+' psia'],['Vapor Fraction β',fmt(flash.beta,6)],['Liquid Fraction',fmt(1-flash.beta,6)],['Components in Stream',String(activeComponents.length)],['Overall MW',fmt(mixtureMW(z),3)+' lb/lbmol'],['Package',pkg]]);
    $('vaporResults').innerHTML=rowTable([['MW',fmt(vap.MW,3)],['Z',fmt(vap.Z,5)],['Density',fmt(vap.rho,5)+' lb/ft³'],['Gas SG, air=1',fmt(vap.sg,4)],['Cp',fmt(vap.Cp,4)+' Btu/lb-°F'],['Viscosity',fmt(vap.mu,5)+' cP'],['Thermal Conductivity',fmt(vap.k,5)+' Btu/hr-ft-°F'],['Relative Enthalpy',fmt(vap.h,2)+' Btu/lb']]);
    $('liquidResults').innerHTML=rowTable([['MW',fmt(liq.MW,3)],['EOS Z root',fmt(liq.Z,5)],['Density',fmt(liq.rho,5)+' lb/ft³'],['Liquid SG',fmt(liq.sg,4)],['API Gravity',fmt(liq.api,2)],['Cp',fmt(liq.Cp,4)+' Btu/lb-°F'],['Viscosity',fmt(liq.mu,5)+' cP'],['Relative Enthalpy',fmt(liq.h,2)+' Btu/lb']]);
    $('phaseComposition').innerHTML=activeComponents.map((c,i)=>`<tr><td>${c.name}</td><td>${fmt(z[i],6)}</td><td>${fmt(flash.x[i],6)}</td><td>${fmt(flash.y[i],6)}</td><td>${fmt(flash.K[i],5)}</td></tr>`).join('');
  } catch(err){ setStatus(err.message,'warn'); }
}

document.addEventListener('DOMContentLoaded', init);
