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

/*
function toggle(){
let f=document.querySelector('input[name="fluid"]:checked').value;
document.getElementById("liq").classList.toggle("hidden",f!=="liquid");
document.getElementById("vap").classList.toggle("hidden",f!=="vapor");
}
*/
function toggle() {

    const fluid =
        document.querySelector(
            'input[name="fluid"]:checked'
        ).value;

    const liquidDiv =
        document.getElementById("liq");

    const vaporDiv =
        document.getElementById("vap");

    const mixedDiv =
        document.getElementById("mixed");

    if(liquidDiv){
        liquidDiv.style.display =
            fluid === "liquid"
            ? "block"
            : "none";
    }

    if(vaporDiv){
        vaporDiv.style.display =
            fluid === "vapor"
            ? "block"
            : "none";
    }

    if(mixedDiv){
        mixedDiv.style.display =
            fluid === "mixed"
            ? "block"
            : "none";
    }
}

window.onload = function() {
    toggle();
};

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
	
const sgVal =
    parseFloat(document.getElementById("sg").value);

const gpmVal =
    parseFloat(document.getElementById("gpm").value);

const vmaxVal =
    parseFloat(document.getElementById("vmax_liq").value);

const muVal =
    parseFloat(document.getElementById("mu_liq").value);	
	

let q = gpmVal*0.002228; // ft3/s

let dreq = Math.sqrt((4*q)/(Math.PI*vmaxVal));
let din = dreq*12;

let pipe=pick(din);
let dft=pipe.id/12; // ft

let rho=sgVal*62.4; // lb/ft3


// iteration for friction factor consistency
let v=q/(Math.PI*dft*dft/4);
let Re = (rho*v*dft)/(muVal*0.000672); // pseudo conversion factor USCS

let e=0.00015; // ft steel roughness
let f=frictionFactor(Re,e/dft);

v=q/(Math.PI*dft*dft/4);
Re=(rho*v*dft)/(muVal*0.000672);
f=frictionFactor(Re,e/dft);

let dp = f*(100/dft)*(rho*v*v/2)/144;

return {din,pipe,v,dp,rho,Re,f};
}

// ------------------ VAPOR ------------------
function vapor(){
	
	/*
let mw=parseFloat(mw.value);
let z=parseFloat(z.value);
let scfd=parseFloat(scfd.value);
let T=parseFloat(temp.value)+459.67;
let P=(parseFloat(psig.value)+14.7)*144;
*/

const mwVal =
    parseFloat(document.getElementById("mw").value);

const zVal =
    parseFloat(document.getElementById("z").value);

const scfdVal =
    parseFloat(document.getElementById("scfd").value);

const tempVal =
    parseFloat(document.getElementById("temp").value);

const psigVal =
    parseFloat(document.getElementById("psig").value);

const vmaxVal =
    parseFloat(document.getElementById("vmax_vap").value);

const muVal =
    parseFloat(document.getElementById("mu_vap").value);
	
let R=10.7316;

const P = psigVal + 14.7;

let rho = (P*mwVal)/(zVal*R*tempVal);

let q = scfdVal/86400;

let dreq=Math.sqrt((4*q)/(Math.PI*vmaxVal));
let din=dreq*12;

let pipe=pick(din);
let dft=pipe.id/12;

// actual velocity
let v=q/(Math.PI*dft*dft/4);

// Reynolds
let Re=(rho*v*dft)/(muVal*0.000672);

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
	
const sgVal = checkNumber(
    parseFloat(document.getElementById("sg").value),
    "Specific Gravity"
);
	
let type=document.querySelector('input[name="fluid"]:checked').value;
let r = (type==="liquid") ? liquid() : vapor();

document.getElementById("out").innerHTML =`
<b>Required Diameter:</b> ${r.din.toFixed(2)} in<br>
<b>Selected Pipe:</b> NPS ${r.pipe.nps} (ID ${r.pipe.id} in)<br>
<b>Velocity:</b> ${r.v.toFixed(2)} ft/s<br>
<b>Reynolds Number:</b> ${r.Re.toExponential(3)}<br>
<b>Friction Factor:</b> ${r.f.toFixed(4)}<br>
<b>Pressure Drop:</b> ${r.dp.toFixed(4)} psi / 100 ft<br>
${r.rho?`<b>Density:</b> ${r.rho.toFixed(3)} lb/ft³<br>`:""}
`;
}

// ------------------ input validation before calculations ------------------
function checkNumber(value,name){

    if(isNaN(value)){
        throw new Error(name + " is required");
    }

    return value;
}

/*****************************************************************
* Beggs-Brill Flow Regime Determination
*
* Inputs:
*   pipeID_in      = Pipe inside diameter (in)
*   qLiquid_ft3s   = Liquid flow rate (ft³/s)
*   qGas_ft3s      = Gas flow rate (ft³/s)
*
* Returns:
*   lambdaL
*   Froude Number
*   Flow Regime
*****************************************************************/
/******************************************************************
 * Liquid Flow Conversion
 * Returns flow in ft³/s
 ******************************************************************/
function getLiquidFlowFt3Sec(rate, unit) {

    switch(unit) {

        case "gpm":
            return rate * 0.002228009;

        case "bpd":
            return rate * 5.614583 / 86400;

        case "ft3s":
            return rate;

        default:
            return 0;
    }
}

/******************************************************************
 * Gas Flow Conversion
 * Returns flow in ft³/s
 ******************************************************************/
function getGasFlowFt3Sec(rate, unit) {

    switch(unit) {

        case "scfd":
            return rate / 86400;

        case "mscfd":
            return rate * 1000 / 86400;

        case "mmscfd":
            return rate * 1000000 / 86400;

        case "ft3s":
            return rate;

        default:
            return 0;
    }
}
/****************************************

function determineBeggsBrillRegime(
    pipeID_in,
    qLiquid_ft3s,
    qGas_ft3s
) {

    // Pipe diameter (ft)
    const D = pipeID_in / 12;

    // Pipe area (ft²)
    const area =
        Math.PI * Math.pow(D, 2) / 4;

    // Superficial velocities
    const Vsl =
        qLiquid_ft3s / area;

    const Vsg =
        qGas_ft3s / area;

    const Vm =
        Vsl + Vsg;

    // No-slip liquid fraction
    const lambdaL =
        Vsl / Vm;

    // Froude number
    const Fr =
        Math.pow(Vm, 2) /
        (32.174 * D);

    // Beggs-Brill boundaries
    const L1 =
        316 *
        Math.pow(lambdaL, 0.302);

    const L2 =
        0.0009252 *
        Math.pow(lambdaL, -2.4684);

    const L3 =
        0.1 *
        Math.pow(lambdaL, -1.4516);

    const L4 =
        0.5 *
        Math.pow(lambdaL, -6.738);

    let regime;

    if (
        (lambdaL < 0.01 && Fr < L1) ||
        (lambdaL >= 0.01 && Fr < L2)
    ) {

        regime = "Segregated";

    } else if (
        Fr >= L2 &&
        Fr <= L3
    ) {

        regime = "Transition";

    } else if (
        (lambdaL < 0.4 && Fr >= L3 && Fr <= L1) ||
        (lambdaL >= 0.4 && Fr >= L3 && Fr <= L4)
    ) {

        regime = "Intermittent";

    } else {

        regime = "Distributed";

    }

    return {
        liquidFraction: lambdaL,
        superficialLiquidVelocity: Vsl,
        superficialGasVelocity: Vsg,
        mixtureVelocity: Vm,
        froudeNumber: Fr,
        flowRegime: regime
    };
	
}

function calculateBeggsBrillRegime(){

    const pipeID =
        parseFloat(
            document.getElementById("pipeID").value
        );

    const liquidRate =
        parseFloat(
            document.getElementById("liquidRate").value
        );

    const gasRate =
        parseFloat(
            document.getElementById("gasRate").value
        );

    const liquidUnit =
        document.getElementById("liquidUnit").value;

    const gasUnit =
        document.getElementById("gasUnit").value;

    const qLiquid_ft3s =
        getLiquidFlowFt3Sec(
            liquidRate,
            liquidUnit
        );

    const qGas_ft3s =
        getGasFlowFt3Sec(
            gasRate,
            gasUnit
        );

    const result =
        determineBeggsBrillRegime(
            pipeID,
            qLiquid_ft3s,
            qGas_ft3s
        );

    // DISPLAY RESULTS HERE
    document.getElementById("out").innerHTML = `
        <h3>Beggs–Brill Results</h3>

        <p><b>Flow Regime:</b>
        ${result.flowRegime}</p>

        <p><b>Liquid Fraction:</b>
        ${result.liquidFraction.toFixed(4)}</p>

        <p><b>Superficial Liquid Velocity:</b>
        ${result.superficialLiquidVelocity.toFixed(2)} ft/s</p>

        <p><b>Superficial Gas Velocity:</b>
        ${result.superficialGasVelocity.toFixed(2)} ft/s</p>

        <p><b>Mixture Velocity:</b>
        ${result.mixtureVelocity.toFixed(2)} ft/s</p>

        <p><b>Froude Number:</b>
        ${result.froudeNumber.toFixed(3)}</p>
    `;
}

