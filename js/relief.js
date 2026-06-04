const api526 = [
{letter:"D", area:0.110},
{letter:"E", area:0.196},
{letter:"F", area:0.307},
{letter:"G", area:0.503},
{letter:"H", area:0.785},
{letter:"J", area:1.287},
{letter:"K", area:1.838},
{letter:"L", area:2.853},
{letter:"M", area:3.600},
{letter:"N", area:4.340},
{letter:"P", area:6.380},
{letter:"Q", area:11.050},
{letter:"R", area:16.000},
{letter:"T", area:26.000}
];

document.querySelectorAll('input[name="valveType"]')
.forEach(r=>{
    r.addEventListener('change', updateBackpressure);
});

function updateBackpressure(){

    const type =
    document.querySelector(
    'input[name="valveType"]:checked').value;

    let pct = 10;

    if(type==="balanced")
        pct = 50;

    if(type==="pilot")
        pct = 90;

    document.getElementById(
    "backpressurePct").value = pct;
}

function gasConstantK(k){

    return Math.sqrt(
        k *
        Math.pow(
            (2/(k+1)),
            ((k+1)/(k-1))
        )
    );
}

function findApi526(requiredArea){

    for(let i=0;i<api526.length;i++){

        if(api526[i].area >= requiredArea){
            return api526[i];
        }
    }

    return {
        letter:"Larger Than T",
        area:requiredArea
    };
}

function calculateRelief(){

    const W =
    parseFloat(document.getElementById("W").value);

    const Pset =
    parseFloat(document.getElementById("Pset").value);

    const TdegF =
    parseFloat(document.getElementById("T").value);

    const MW =
    parseFloat(document.getElementById("MW").value);

    const k =
    parseFloat(document.getElementById("k").value);

    const Z =
    parseFloat(document.getElementById("Z").value);

    const Kd =
    parseFloat(document.getElementById("Kd").value);

    const Kb =
    parseFloat(document.getElementById("Kb").value);

    const bpPct =
    parseFloat(
    document.getElementById("backpressurePct").value);

    const backpressure =
    Pset * bpPct / 100;

    /*
      API relief pressure
      10% overpressure assumed
    */
    const P1 =
    (Pset * 1.10) + 14.7;

    const T =
    TdegF + 459.67;

    const C =
    520 * gasConstantK(k);

    /*
      API 520 gas sizing
      W = C*Kd*Kb*A*P1*sqrt(MW/(T*Z))

      Solve for A
    */

    const A =
    W /
    (
        C *
        Kd *
        Kb *
        P1 *
        Math.sqrt(
            MW/(T*Z)
        )
    );

    const diameter =
    Math.sqrt(
        4*A/Math.PI
    );

    const api =
    findApi526(A);

    document.getElementById("area")
    .innerHTML = A.toFixed(4);

    document.getElementById("diameter")
    .innerHTML = diameter.toFixed(4);

    document.getElementById("orifice")
    .innerHTML =
    api.letter +
    " (" +
    api.area.toFixed(3) +
    " in²)";

    document.getElementById("relievingPressure")
    .innerHTML =
    P1.toFixed(2);

    document.getElementById("backpressure")
    .innerHTML =
    backpressure.toFixed(2);
}

calculateRelief();