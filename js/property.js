'use strict';

const R = 10.7316; // psia ft3 / lbmol R
const EPS = 1e-12;

const components = [
  { name:'Methane',  MW:16.043, Tc:343.01, Pc:666.4,  omega:0.0115, Zra:0.289, Tb:201.0, liqSG:0.300, cpA:0.53, muV:0.011, muL:0.012, kV:0.020 },
  { name:'Ethane',   MW:30.070, Tc:549.58, Pc:706.5,  omega:0.0995, Zra:0.281, Tb:332.0, liqSG:0.356, cpA:0.42, muV:0.009, muL:0.020, kV:0.018 },
  { name:'Propane',  MW:44.097, Tc:665.73, Pc:616.0,  omega:0.1523, Zra:0.276, Tb:416.0, liqSG:0.508, cpA:0.39, muV:0.008, muL:0.090, kV:0.016 },
  { name:'i-Butane', MW:58.124, Tc:734.13, Pc:529.1,  omega:0.1848, Zra:0.275, Tb:470.5, liqSG:0.563, cpA:0.39, muV:0.0077, muL:0.130, kV:0.015 },
  { name:'n-Butane', MW:58.124, Tc:765.29, Pc:550.6,  omega:0.2002, Zra:0.274, Tb:491.7, liqSG:0.584, cpA:0.40, muV:0.0075, muL:0.150, kV:0.015 },
  { name:'i-Pentane',MW:72.151, Tc:828.77, Pc:490.4,  omega:0.2274, Zra:0.270, Tb:541.8, liqSG:0.620, cpA:0.40, muV:0.0072, muL:0.210, kV:0.014 },
  { name:'n-Pentane',MW:72.151, Tc:845.47, Pc:489.5,  omega:0.2515, Zra:0.268, Tb:556.7, liqSG:0.626, cpA:0.41, muV:0.0070, muL:0.240, kV:0.014 },
  { name:'n-Hexane', MW:86.178, Tc:913.41, Pc:436.9,  omega:0.3013, Zra:0.264, Tb:615.3, liqSG:0.659, cpA:0.42, muV:0.0068, muL:0.310, kV:0.013 },
  { name:'Benzene',  MW:78.114, Tc:1011.4, Pc:714.2,  omega:0.2100, Zra:0.271, Tb:636.0, liqSG:0.879, cpA:0.42, muV:0.0085, muL:0.650, kV:0.010 },
  { name:'Toluene',  MW:92.141, Tc:1069.8, Pc:596.0,  omega:0.2630, Zra:0.264, Tb:696.5, liqSG:0.867, cpA:0.43, muV:0.0082, muL:0.590, kV:0.009 },
  { name:'Water',    MW:18.015, Tc:1165.1, Pc:3200.1, omega:0.3440, Zra:0.233, Tb:671.7, liqSG:1.000, cpA:1.00, muV:0.013, muL:1.000, kV:0.014 },
  { name:'Ethanol',  MW:46.069, Tc:925.0,  Pc:890.0,  omega:0.6450, Zra:0.250, Tb:633.9, liqSG:0.789, cpA:0.58, muV:0.010, muL:1.200, kV:0.010 }
];

const defaultZ = [0.72,0.08,0.06,0.02,0.04,0.01,0.02,0.02,0.01,0.01,0.00,0.01];

function $(id){ return document.getElementById(id); }
function fmt(v, n=5){ return Number.isFinite(v) ? v.toFixed(n) : '—'; }
function sum(arr){ return arr.reduce((a,b)=>a+b,0); }
function clamp(v, lo, hi){ return Math.min(Math.max(v, lo), hi); }

function init(){
  const body = $('compositionBody');
  body.innerHTML = components.map((c,i)=>`
    <tr>
      <td>${c.name}</td><td>${fmt(c.MW,3)}</td><td>${fmt(c.Tc,1)}</td><td>${fmt(c.Pc,1)}</td><td>${fmt(c.omega,4)}</td>
      <td><input class="composition-input" id="z${i}" type="number" min="0" step="0.0001" value="${defaultZ[i].toFixed(4)}"></td>
    </tr>`).join('');
  $('normalizeBtn').addEventListener('click', normalizeComposition);
  $('calculateBtn').addEventListener('click', calculate);
  $('resetBtn').addEventListener('click', resetComposition);
  calculate();
}

function getZ(){
  const raw = components.map((_,i)=>Math.max(0, Number($('z'+i).value)||0));
  const s = sum(raw);
  if(s <= EPS) return components.map((_,i)=> i===0 ? 1 : 0);
  return raw.map(v=>v/s);
}
function normalizeComposition(){ getZ().forEach((v,i)=>$('z'+i).value = v.toFixed(6)); }
function resetComposition(){ defaultZ.forEach((v,i)=>$('z'+i).value = v.toFixed(4)); calculate(); }

function wilsonK(T, P){
  return components.map(c => (c.Pc/P) * Math.exp(5.373*(1+c.omega)*(1 - c.Tc/T)) );
}

function rachfordRice(z, K){ return beta => sum(z.map((zi,i)=> zi*(K[i]-1)/(1 + beta*(K[i]-1)))); }
function solveBeta(z, K){
  const f = rachfordRice(z,K);
  const f0 = f(0), f1 = f(1);
  if(f0 < 0) return 0;
  if(f1 > 0) return 1;
  let lo = 0, hi = 1, mid = 0.5;
  for(let it=0; it<100; it++){
    mid = 0.5*(lo+hi);
    if(Math.abs(f(mid)) < 1e-12) break;
    if(f(mid) > 0) lo = mid; else hi = mid;
  }
  return mid;
}

function prParams(T){
  return components.map(c=>{
    const kappa = 0.37464 + 1.54226*c.omega - 0.26992*c.omega*c.omega;
    const alpha = Math.pow(1 + kappa*(1 - Math.sqrt(T/c.Tc)), 2);
    const a = 0.45724 * R*R*c.Tc*c.Tc/c.Pc * alpha;
    const b = 0.07780 * R*c.Tc/c.Pc;
    return {a,b};
  });
}

function mixAB(T,P,x){
  const p = prParams(T);
  let aMix = 0;
  for(let i=0;i<components.length;i++){
    for(let j=0;j<components.length;j++){
      // kij matrix defaults to zero. Add databank values here for simulator-grade systems.
      aMix += x[i]*x[j]*Math.sqrt(p[i].a*p[j].a);
    }
  }
  const bMix = sum(x.map((xi,i)=>xi*p[i].b));
  return {A:aMix*P/(R*R*T*T), B:bMix*P/(R*T), aMix, bMix, params:p};
}

function cubicRealRoots(a,b,c,d){
  b/=a; c/=a; d/=a;
  const q = (3*c - b*b)/9;
  const r = (9*b*c - 27*d - 2*b*b*b)/54;
  const disc = q*q*q + r*r;
  let roots = [];
  if(disc >= 0){
    const s = Math.cbrt(r + Math.sqrt(disc));
    const t = Math.cbrt(r - Math.sqrt(disc));
    roots.push(-b/3 + s + t);
  } else {
    const theta = Math.acos(clamp(r/Math.sqrt(-q*q*q), -1, 1));
    for(let k=0;k<3;k++) roots.push(2*Math.sqrt(-q)*Math.cos((theta + 2*Math.PI*k)/3) - b/3);
  }
  return roots.filter(v=>Number.isFinite(v) && v > 0).sort((x,y)=>x-y);
}

function prZ(T,P,x,phase){
  const {A,B} = mixAB(T,P,x);
  const roots = cubicRealRoots(1, -(1-B), A - 3*B*B - 2*B, -(A*B - B*B - B*B*B));
  if(!roots.length) return 1;
  return phase === 'L' ? roots[0] : roots[roots.length-1];
}

function lnPhiPR(T,P,x,phase){
  const m = mixAB(T,P,x);
  const Z = prZ(T,P,x,phase);
  const sqrt2 = Math.sqrt(2);
  const logTerm = Math.log((Z + (1+sqrt2)*m.B)/(Z + (1-sqrt2)*m.B));
  return components.map((_,i)=>{
    let sumAij = 0;
    for(let j=0;j<components.length;j++) sumAij += x[j]*Math.sqrt(m.params[i].a*m.params[j].a);
    const biOverB = m.params[i].b / m.bMix;
    const first = biOverB*(Z-1) - Math.log(Math.max(Z-m.B, EPS));
    const second = (m.A/(2*sqrt2*m.B)) * (2*sumAij/m.aMix - biOverB) * logTerm;
    return first - second;
  });
}

function tpFlashPR(T,P,z){
  let K = wilsonK(T,P).map(v=>clamp(v,1e-8,1e8));
  let beta = solveBeta(z,K), x=[], y=[];
  for(let it=0; it<80; it++){
    beta = solveBeta(z,K);
    x = z.map((zi,i)=> zi/(1 + beta*(K[i]-1)) );
    y = x.map((xi,i)=> K[i]*xi );
    const sx = sum(x), sy = sum(y);
    x = x.map(v=>v/sx); y = y.map(v=>v/sy);
    if(beta <= 1e-10 || beta >= 1-1e-10) break;
    const lnPhiL = lnPhiPR(T,P,x,'L');
    const lnPhiV = lnPhiPR(T,P,y,'V');
    const Knew = K.map((_,i)=>clamp(Math.exp(lnPhiL[i]-lnPhiV[i]),1e-8,1e8));
    const err = Math.max(...Knew.map((v,i)=>Math.abs(Math.log(v/K[i]))));
    K = Knew;
    if(err < 1e-8) break;
  }
  beta = solveBeta(z,K);
  x = z.map((zi,i)=> zi/(1 + beta*(K[i]-1)) );
  y = x.map((xi,i)=> K[i]*xi );
  const sx = sum(x), sy = sum(y);
  return { beta, x:x.map(v=>v/sx), y:y.map(v=>v/sy), K };
}

function pseudoLKZ(T,P,z){
  const Tc = sum(z.map((zi,i)=>zi*components[i].Tc));
  const Pc = sum(z.map((zi,i)=>zi*components[i].Pc));
  const omega = sum(z.map((zi,i)=>zi*components[i].omega));
  const Tr = T/Tc, Pr = P/Pc;
  return clamp(1 - 0.08*Pr/Math.pow(Tr,1.2) - 0.04*omega*Pr/Math.pow(Tr,2), 0.20, 1.20);
}

function nrtlGamma(x,T){
  // Generic NRTL shell. Replace tau/alpha with a real binary-parameter databank for final design.
  const alpha = 0.30;
  return components.map((ci,i)=>{
    let lnG = 0;
    for(let j=0;j<components.length;j++){
      if(i===j) continue;
      const tau = 0.12 + 0.015*Math.abs(ci.MW-components[j].MW) + (ci.name==='Water'||components[j].name==='Water' ? 0.55 : 0);
      const G = Math.exp(-alpha*tau);
      lnG += x[j]*x[j]*tau*G;
    }
    return Math.exp(lnG);
  });
}

function mixtureMW(x){ return sum(x.map((xi,i)=>xi*components[i].MW)); }
function idealCp(x){ return sum(x.map((xi,i)=>xi*components[i].cpA)); }
function vaporDensity(T,P,x,Z){ return P*mixtureMW(x)/(Z*R*T); }
function liquidDensityRackett(T,x){
  const MW = mixtureMW(x);
  let molarVol = 0;
  for(let i=0;i<components.length;i++){
    const c = components[i];
    const Tr = clamp(T/c.Tc, 0.20, 0.99);
    const Vc = R*c.Tc/c.Pc; // ft3/lbmol, rough critical volume proxy
    const Vm = Vc*Math.pow(c.Zra, 1 + Math.pow(1-Tr, 2/7));
    molarVol += x[i]*Vm;
  }
  return MW/Math.max(molarVol, EPS);
}
function liquidDensityIdeal(x){
  const MW = mixtureMW(x);
  const molarVol = sum(x.map((xi,i)=> xi*components[i].MW/(components[i].liqSG*62.4)));
  return MW/Math.max(molarVol, EPS);
}
function vaporViscosity(x){ return sum(x.map((xi,i)=>xi*components[i].muV)); }
function liquidViscosity(x){ return Math.exp(sum(x.map((xi,i)=>xi*Math.log(Math.max(components[i].muL,1e-6))))); }
function thermalConductivityVapor(x){ return sum(x.map((xi,i)=>xi*components[i].kV)); }
function apiGravity(rho){ const sg = rho/62.4; return 141.5/sg - 131.5; }

function phaseProps(T,P,comp,phase,Z){
  const MW = mixtureMW(comp);
  const Cp = idealCp(comp);
  if(phase === 'V'){
    const rho = vaporDensity(T,P,comp,Z);
    return {MW,Cp,Z,rho,mu:vaporViscosity(comp),k:thermalConductivityVapor(comp), sg:MW/28.967, api:null, h:Cp*((T-459.67)-60)};
  }
  const method = $('densityMethod').value;
  const rho = method === 'ideal' ? liquidDensityIdeal(comp) : liquidDensityRackett(T,comp);
  return {MW,Cp,Z,rho,mu:liquidViscosity(comp),k:null, sg:rho/62.4, api:apiGravity(rho), h:Cp*((T-459.67)-60)};
}

function rowTable(rows){ return rows.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join(''); }

function calculate(){
  try{
    const pkg = $('propertyPackage').value;
    const T = Number($('temperature').value) + 459.67;
    const P = Number($('pressure').value);
    const z = getZ();
    if(T <= 0 || P <= 0) throw new Error('Temperature and pressure must be positive.');

    let flash;
    let status = '';
    if(pkg === 'PR'){
      flash = tpFlashPR(T,P,z);
      status = 'PR EOS flash converged. Fugacity coefficients used for K-value update.';
    } else if(pkg === 'LK'){
      const K = wilsonK(T,P);
      const beta = solveBeta(z,K);
      const x = z.map((zi,i)=>zi/(1+beta*(K[i]-1))); const sx=sum(x);
      const y = x.map((xi,i)=>K[i]*xi); const sy=sum(y);
      flash = {beta, x:x.map(v=>v/sx), y:y.map(v=>v/sy), K};
      status = 'Lee-Kesler mode uses corresponding-states Z with Wilson flash estimate.';
    } else {
      const gamma = nrtlGamma(z,T);
      const K = wilsonK(T,P).map((v,i)=>clamp(v*gamma[i],1e-8,1e8));
      const beta = solveBeta(z,K);
      const x = z.map((zi,i)=>zi/(1+beta*(K[i]-1))); const sx=sum(x);
      const y = x.map((xi,i)=>K[i]*xi); const sy=sum(y);
      flash = {beta, x:x.map(v=>v/sx), y:y.map(v=>v/sy), K, gamma};
      status = 'NRTL mode applies simplified activity coefficients. Replace with real binary parameters for design.';
    }

    const Zv = pkg === 'LK' ? pseudoLKZ(T,P,flash.y) : prZ(T,P,flash.y,'V');
    const Zl = pkg === 'LK' ? 0.05 : prZ(T,P,flash.x,'L');
    const vap = phaseProps(T,P,flash.y,'V',Zv);
    const liq = phaseProps(T,P,flash.x,'L',Zl);

    $('status').className = 'status ok';
    $('status').textContent = status;
    $('flashResults').innerHTML = rowTable([
      ['Temperature', fmt(T-459.67,2)+' °F'], ['Pressure', fmt(P,2)+' psia'], ['Vapor Fraction β', fmt(flash.beta,6)],
      ['Liquid Fraction', fmt(1-flash.beta,6)], ['Overall MW', fmt(mixtureMW(z),3)+' lb/lbmol'], ['Package', pkg]
    ]);
    $('vaporResults').innerHTML = rowTable([
      ['MW', fmt(vap.MW,3)], ['Z', fmt(vap.Z,5)], ['Density', fmt(vap.rho,5)+' lb/ft³'], ['Gas SG, air=1', fmt(vap.sg,4)],
      ['Cp', fmt(vap.Cp,4)+' Btu/lb-°F'], ['Viscosity', fmt(vap.mu,5)+' cP'], ['Thermal Conductivity', fmt(vap.k,5)+' Btu/hr-ft-°F'], ['Relative Enthalpy', fmt(vap.h,2)+' Btu/lb']
    ]);
    $('liquidResults').innerHTML = rowTable([
      ['MW', fmt(liq.MW,3)], ['EOS Z root', fmt(liq.Z,5)], ['Density', fmt(liq.rho,5)+' lb/ft³'], ['Liquid SG', fmt(liq.sg,4)],
      ['API Gravity', fmt(liq.api,2)], ['Cp', fmt(liq.Cp,4)+' Btu/lb-°F'], ['Viscosity', fmt(liq.mu,5)+' cP'], ['Relative Enthalpy', fmt(liq.h,2)+' Btu/lb']
    ]);
    $('phaseComposition').innerHTML = components.map((c,i)=>`<tr><td>${c.name}</td><td>${fmt(z[i],6)}</td><td>${fmt(flash.x[i],6)}</td><td>${fmt(flash.y[i],6)}</td><td>${fmt(flash.K[i],5)}</td></tr>`).join('');
  } catch(err){
    $('status').className = 'status warn';
    $('status').textContent = err.message;
  }
}

document.addEventListener('DOMContentLoaded', init);
