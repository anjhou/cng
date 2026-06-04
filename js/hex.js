function toggleHEXMode()
{
    const mode =
        document.getElementById("serviceType").value;

    document.getElementById("singlePhaseSection")
        .style.display =
        (mode === "single") ? "block" : "none";

    document.getElementById("phaseChangeSection")
        .style.display =
        (mode === "phase") ? "block" : "none";
}

function calculateHEXDuty()
{
    const mode =
        document.getElementById("serviceType").value;

    const gpm =
        parseFloat(document.getElementById("hexFlow").value) || 0;

    const sg =
        parseFloat(document.getElementById("hexSG").value) || 0;

    const lbhr =
        gpm * 60 * 8.34 * sg;

    let duty = 0;
    let output = "";

    if(mode === "single")
    {
        const cp =
            parseFloat(document.getElementById("hexCp").value) || 0;

        const dT =
            parseFloat(document.getElementById("hexDT").value) || 0;

        const UA =
            parseFloat(document.getElementById("hexUA").value) || 0;

        duty = lbhr * cp * dT;

        const lmtd =
            UA > 0 ? duty / UA : 0;

        output += `
            <h3>Single Phase Results</h3>

            <table class="result-table">
                <tr>
                    <td>Mass Flow</td>
                    <td>${lbhr.toLocaleString(undefined,{maximumFractionDigits:0})} lb/hr</td>
                </tr>

                <tr>
                    <td>Duty</td>
                    <td>${duty.toLocaleString(undefined,{maximumFractionDigits:0})} Btu/hr</td>
                </tr>

                <tr>
                    <td>Duty</td>
                    <td>${(duty/1000000).toFixed(4)} MMBtu/hr</td>
                </tr>

                <tr>
                    <td>Calculated LMTD</td>
                    <td>${lmtd.toFixed(2)} °F</td>
                </tr>
            </table>
        `;
    }
    else
    {
        const vfStart =
            parseFloat(document.getElementById("vfStart").value) || 0;

        const vfEnd =
            parseFloat(document.getElementById("vfEnd").value) || 0;

        const hvap =
            parseFloat(document.getElementById("hvap").value) || 0;

        const deltaVF =
            Math.abs(vfEnd - vfStart);

        duty =
            lbhr * deltaVF * hvap;

        output += `
            <h3>Phase Change Results</h3>

            <table class="result-table">

                <tr>
                    <td>Mass Flow</td>
                    <td>${lbhr.toLocaleString(undefined,{maximumFractionDigits:0})} lb/hr</td>
                </tr>

                <tr>
                    <td>Vapor Fraction Change</td>
                    <td>${deltaVF.toFixed(3)}</td>
                </tr>

                <tr>
                    <td>Duty</td>
                    <td>${duty.toLocaleString(undefined,{maximumFractionDigits:0})} Btu/hr</td>
                </tr>

                <tr>
                    <td>Duty</td>
                    <td>${(duty/1000000).toFixed(4)} MMBtu/hr</td>
                </tr>

            </table>
        `;
    }

    document.getElementById("hexResults").innerHTML =
        output;
}