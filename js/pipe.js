
/*****************************************************************
 * 1. CONFIGURATION
 *****************************************************************/

const PIPE_DB = [
    {nps:0.5,id:0.622},{nps:0.75,id:0.824},{nps:1,id:1.049},
    {nps:1.5,id:1.610},{nps:2,id:2.067},{nps:2.5,id:2.469},
    {nps:3,id:3.068},{nps:4,id:4.026},{nps:5,id:5.047},
    {nps:6,id:6.065},{nps:8,id:7.981},{nps:10,id:10.020},
    {nps:12,id:11.938},{nps:14,id:13.124},{nps:16,id:15.000},
    {nps:18,id:17.000},{nps:20,id:19.000},{nps:24,id:23.000}
];

const GRAVITY = 32.174;
const STEEL_ROUGHNESS_FT = 0.00015;
const PSI_PER_FT2 = 144;


/*****************************************************************
 * 2. SHARED UTILITIES
 *****************************************************************/

function getEl(id){
    return document.getElementById(id);
}

function num(id){
    const v = parseFloat(getEl(id).value);
    return isNaN(v) ? 0 : v;
}

function checkNumber(value, name){
    if(isNaN(value)) throw new Error(name + " is required");
    return value;
}

function pickPipe(idReq){
    for (let p of PIPE_DB){
        if (p.id >= idReq) return p;
    }
    return PIPE_DB[PIPE_DB.length - 1];
}


/************* UNIT CONVERSIONS *************/

function liquidFlow_ft3s(rate, unit){
    switch(unit){
        case "gpm": return rate * 0.002228;
        case "bpd": return rate * 5.61458 / 86400;
        case "ft3s": return rate;
        default: return 0;
    }
}

function gasFlow_ft3s(rate, unit){
    switch(unit){
        case "scfd": return rate / 86400;
        case "mscfd": return rate * 1000 / 86400;
        case "mmscfd": return rate * 1e6 / 86400;
        case "ft3s": return rate;
        default: return 0;
    }
}


/************* FLUID PROPERTIES *************/

function frictionFactor(Re, eD){
    if (Re < 2100) return 64 / Re;

    return 0.25 / Math.pow(
        Math.log10(eD/3.7 + 5.74/Math.pow(Re,0.9)),
        2
    );
}


/*****************************************************************
 * 3. SINGLE PHASE ENGINE
 *****************************************************************/

function liquidCalc(){

    const sg = num("sg");
    const gpm = num("gpm");
    const vmax = num("vmax_liq");
    const mu = num("mu_liq");

    const q = gpm * 0.002228;

    const dreq = Math.sqrt((4*q)/(Math.PI*vmax));
    const pipe = pickPipe(dreq * 12);
    const D = pipe.id / 12;

    const rho = sg * 62.4;

    let v = q / (Math.PI*D*D/4);
    let Re = (rho * v * D) / (mu * 0.000672);

    const f = frictionFactor(Re, STEEL_ROUGHNESS_FT / D);

    const dp = f * (100/D) * (rho*v*v/2) / PSI_PER_FT2;

    return {
        mode: "liquid",
        pipe,
        diameter_req: dreq*12,
        velocity: v,
        density: rho,
        Re,
        f,
        dp
    };
}


function vaporCalc(){

    const mw = num("mw");
    const z = num("z");
    const scfd = num("scfd");
    const T = num("temp") + 459.67;
    const P = num("psig") + 14.7;
    const vmax = num("vmax_vap");
    const mu = num("mu_vap");

    const R = 10.7316;

    const rho = (P * mw) / (z * R * T);

    const q = scfd / 86400;

    const dreq = Math.sqrt((4*q)/(Math.PI*vmax));
    const pipe = pickPipe(dreq * 12);
    const D = pipe.id / 12;

    let v = q / (Math.PI*D*D/4);
    let Re = (rho * v * D) / (mu * 0.000672);

    const f = frictionFactor(Re, STEEL_ROUGHNESS_FT / D);

    const dp = f * (100/D) * (rho*v*v/2) / PSI_PER_FT2;

    return {
        mode: "vapor",
        pipe,
        diameter_req: dreq*12,
        velocity: v,
        density: rho,
        Re,
        f,
        dp
    };
}


/*****************************************************************
 * 4. MULTIPHASE ENGINE (BEGGS-BRILL REGIME ONLY)
 *****************************************************************/

function beggsBrillRegime(pipeID_in, qL, qG){

    const D = pipeID_in / 12;
    const area = Math.PI * D * D / 4;

    const Vsl = qL / area;
    const Vsg = qG / area;
    const Vm = Vsl + Vsg;

    const lambdaL = Vsl / Vm;

    const Fr = (Vm*Vm) / (GRAVITY * D);

    const L1 = 316 * Math.pow(lambdaL,0.302);
    const L2 = 0.0009252 * Math.pow(lambdaL,-2.4684);
    const L3 = 0.1 * Math.pow(lambdaL,-1.4516);
    const L4 = 0.5 * Math.pow(lambdaL,-6.738);

    let regime;

    if ((lambdaL < 0.01 && Fr < L1) || (lambdaL >= 0.01 && Fr < L2)){
        regime = "Segregated";
    }
    else if (Fr >= L2 && Fr <= L3){
        regime = "Transition";
    }
    else if (
        (lambdaL < 0.4 && Fr >= L3 && Fr <= L1) ||
        (lambdaL >= 0.4 && Fr >= L3 && Fr <= L4)
    ){
        regime = "Intermittent";
    }
    else {
        regime = "Distributed";
    }

    return {
        regime,
        lambdaL,
        Vsl,
        Vsg,
        Vm,
        Fr
    };
}


/*****************************************************************
 * 5. UI CONTROLLERS
 *****************************************************************/

function toggle(){

    const fluid =
        document.querySelector('input[name="fluid"]:checked').value;

    getEl("liq").style.display = (fluid==="liquid") ? "block":"none";
    getEl("vap").style.display = (fluid==="vapor") ? "block":"none";
    getEl("mixed").style.display = (fluid==="mixed") ? "block":"none";
}

window.onload = toggle;


/******** SINGLE PHASE DRIVER ********/

function calc(){

    const fluid =
        document.querySelector('input[name="fluid"]:checked').value;

    let r;

    if(fluid === "liquid") r = liquidCalc();
    else r = vaporCalc();

    getEl("out").innerHTML = `
        <b>Mode:</b> ${r.mode}<br>
        <b>Pipe:</b> NPS ${r.pipe.nps} (ID ${r.pipe.id} in)<br>
        <b>Velocity:</b> ${r.velocity.toFixed(2)} ft/s<br>
        <b>Re:</b> ${r.Re.toExponential(3)}<br>
        <b>f:</b> ${r.f.toFixed(4)}<br>
        <b>ΔP:</b> ${r.dp.toFixed(4)} psi/100ft
    `;
}


/******** MULTIPHASE DRIVER ********/

function calculateBeggsBrillRegime(){

    const pipeID = num("pipeID");

    const qL = liquidFlow_ft3s(
        num("liquidRate"),
        getEl("liquidUnit").value
    );

    const qG = gasFlow_ft3s(
        num("gasRate"),
        getEl("gasUnit").value
    );

    const r =
        beggsBrillRegime(pipeID, qL, qG);

    getEl("out").innerHTML = `
        <b>Flow Regime:</b> ${r.regime}<br>
        <b>λL:</b> ${r.lambdaL.toFixed(4)}<br>
        <b>Vsl:</b> ${r.Vsl.toFixed(2)} ft/s<br>
        <b>Vsg:</b> ${r.Vsg.toFixed(2)} ft/s<br>
        <b>Vm:</b> ${r.Vm.toFixed(2)} ft/s<br>
        <b>Fr:</b> ${r.Fr.toFixed(3)}
    `;
}