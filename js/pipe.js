// ------------------ Schedule 40 IDs (inches) ------------------
const pipeDB = [
{nps:0.5,id:0.622},{nps:0.75,id:0.824},{nps:1,id:1.049},
{nps:1.5,id:1.610},{nps:2,id:2.067},{nps:2.5,id:2.469},
{nps:3,id:3.068},{nps:4,id:4.026},{nps:5,id:5.047},
{nps:6,id:6.065},{nps:8,id:7.981},{nps:10,id:10.020},
{nps:12,id:11.938},{nps:14,id:13.124},{nps:16,id:15.000},
{nps:18,id:17.000},{nps:20,id:19.000},{nps:24,id:23.000}
];

// ------------------ Toggle ------------------
function toggle(){
let f=document.querySelector('input[name="fluid"]:checked').value;
document.getElementById("liq").classList.toggle("hidden",f!=="liquid");
document.getElementById("vap").classList.toggle("hidden",f!=="vapor");
}

// ------------------ Pipe Selection ------------------
function pick(idReq){
for(let p of pipeDB) if(p.id>=idReq) return p;
return pipeDB[pipeDB.length-1];
}

// ------------------ Swamee-Jain friction factor ------------------
function frictionFactor(Re, eD){
if(Re < 2100) return 64/Re;
return 0.25 / Math.pow(Math.log10(eD/3.7 + 5.74/Math.pow(Re,0.9)),2);
}

// ------------------ LIQUID ------------------
function liquid(){
let sg=parseFloat(sg.value);
let gpm=parseFloat(gpm.value);
let vmax=parseFloat(vmax_liq.value);
let mu=parseFloat(mu_liq.value)*0.001; // cP -> Pa.s approx (relative use)

let q = gpm*0.002228; // ft3/s

let dreq = Math.sqrt((4*q)/(Math.PI*vmax));
let din = dreq*12;

let pipe=pick(din);
let dft=pipe.id/12;

let rho=sg*62.4;

// iteration for friction factor consistency
let v=q/(Math.PI*dft*dft/4);
let Re = (rho*v*dft)/(mu*0.000672); // pseudo conversion factor USCS

let e=0.00015; // ft steel roughness
let f=frictionFactor(Re,e/dft);

v=q/(Math.PI*dft*dft/4);
Re=(rho*v*dft)/(mu*0.000672);
f=frictionFactor(Re,e/dft);

let dp = f*(100/dft)*(rho*v*v/2)/144;

return {din,pipe,v,dp,rho,Re,f};
}

// ------------------ VAPOR ------------------
function vapor(){
let mw=parseFloat(mw.value);
let z=parseFloat(z.value);
let scfd=parseFloat(scfd.value);
let T=parseFloat(temp.value)+459.67;
let P=(parseFloat(psig.value)+14.7)*144;
let vmax=parseFloat(vmax_vap.value);
let mu=parseFloat(mu_vap.value)*0.001;

let R=10.7316;

let rho = (P*mw)/(z*R*T);

let q = scfd/86400;

let dreq=Math.sqrt((4*q)/(Math.PI*vmax));
let din=dreq*12;

let pipe=pick(din);
let dft=pipe.id/12;

// actual velocity
let v=q/(Math.PI*dft*dft/4);

// Reynolds
let Re=(rho*v*dft)/(mu*0.000672);

// roughness
let e=0.00015;

// friction factor
let f=frictionFactor(Re,e/dft);

// recompute velocity consistency
v=q/(Math.PI*dft*dft/4);

// pressure drop
let dp=f*(100/dft)*(rho*v*v/2)/144;

return {din,pipe,v,dp,rho,Re,f};
}

// ------------------ MAIN ------------------
function calc(){
let type=document.querySelector('input[name="fluid"]:checked').value;
let r = (type==="liquid") ? liquid() : vapor();

out.innerHTML=`
<b>Required Diameter:</b> ${r.din.toFixed(2)} in<br>
<b>Selected Pipe:</b> NPS ${r.pipe.nps} (ID ${r.pipe.id} in)<br>
<b>Velocity:</b> ${r.v.toFixed(2)} ft/s<br>
<b>Reynolds Number:</b> ${r.Re.toExponential(3)}<br>
<b>Friction Factor:</b> ${r.f.toFixed(4)}<br>
<b>Pressure Drop:</b> ${r.dp.toFixed(4)} psi / 100 ft<br>
${r.rho?`<b>Density:</b> ${r.rho.toFixed(3)} lb/ft³<br>`:""}
`;
}
