function calculateColumnHydraulics() {

    const type = document.getElementById("columnType").value;

    const vaporFlow =
        parseFloat(document.getElementById("vaporFlow").value);

    const liquidFlow =
        parseFloat(document.getElementById("liquidFlow").value);

    const rhoV =
        parseFloat(document.getElementById("rhoV").value);

    const rhoL =
        parseFloat(document.getElementById("rhoL").value);

    const diameter =
        parseFloat(document.getElementById("diameter").value);

    const traySpacing =
        parseFloat(document.getElementById("traySpacing").value);

    const area =
        Math.PI * Math.pow(diameter,2) / 4;

    const vaporVelocity =
        vaporFlow / area / 60;

    let floodVelocity;

    if(type === "tray")
    {
        const C = 0.30;

        floodVelocity =
            C * Math.sqrt((rhoL - rhoV)/rhoV);
    }
    else
    {
        const K = 0.22;

        floodVelocity =
            K * Math.sqrt((rhoL - rhoV)/rhoV);
    }

    const percentFlood =
        vaporVelocity / floodVelocity * 100;

    let status = "";
    let recommendation = "";

    if(type === "tray")
    {
        if(percentFlood < 70)
        {
            status = "Low Loading";
            recommendation =
                "Below optimal tray loading.";
        }
        else if(percentFlood <= 85)
        {
            status = "Good";
            recommendation =
                "Within recommended tray operating range.";
        }
        else if(percentFlood <= 100)
        {
            status = "Warning";
            recommendation =
                "Approaching flooding.";
        }
        else
        {
            status = "Flooding";
            recommendation =
                "Column likely flooded.";
        }
    }
    else
    {
        if(percentFlood < 60)
        {
            status = "Low Loading";
            recommendation =
                "Below optimal packing loading.";
        }
        else if(percentFlood <= 80)
        {
            status = "Good";
            recommendation =
                "Within recommended packed-column range.";
        }
        else if(percentFlood <= 100)
        {
            status = "Warning";
            recommendation =
                "Approaching flooding.";
        }
        else
        {
            status = "Flooding";
            recommendation =
                "Packed bed likely flooded.";
        }
    }

    const pressureDrop =
        Math.pow(vaporVelocity,2) * rhoV / 64.4;

    document.getElementById("columnResults").innerHTML = `
        <h3>Results</h3>

        <table class="resultTable">
            <tr>
                <td>Column Area</td>
                <td>${area.toFixed(2)} ft²</td>
            </tr>

            <tr>
                <td>Liquid Flow</td>
                <td>${liquidFlow.toFixed(2)} GPM</td>
            </tr>

            <tr>
                <td>Superficial Vapor Velocity</td>
                <td>${vaporVelocity.toFixed(2)} ft/s</td>
            </tr>

            <tr>
                <td>Flood Velocity</td>
                <td>${floodVelocity.toFixed(2)} ft/s</td>
            </tr>

            <tr>
                <td>Percent Flood</td>
                <td>${percentFlood.toFixed(1)} %</td>
            </tr>

            <tr>
                <td>Estimated Pressure Drop</td>
                <td>${pressureDrop.toFixed(3)}</td>
            </tr>

            <tr>
                <td>Status</td>
                <td><b>${status}</b></td>
            </tr>

            <tr>
                <td>Recommendation</td>
                <td>${recommendation}</td>
            </tr>
        </table>
    `;
}