const EIA_API_KEY =
"KXFkqy8m6vsXRW215DNxwLKWeQq52XG9kdS4UMLT";

let priceChart = null;

const defaultSeries = [

{
    plot:true,
    type:"Feedstock",
    label:"WTI Crude Oil",
    seriesId:"PET.RWTC.D",
    unit:"$/bbl"
},

{
    plot:true,
    type:"Feedstock",
    label:"Brent Crude Oil",
    seriesId:"PET.RBRTE.D",
    unit:"$/bbl"
},

{
    plot:true,
    type:"Feedstock",
    label:"Henry Hub Natural Gas",
    seriesId:"NG.RNGWHHD.D",
    unit:"$/MMBtu"
},

{
    plot:true,
    type:"Product",
    label:"Gasoline Retail",
    seriesId:"PET.EMM_EPM0_PTE_NUS_DPG.W",
    unit:"$/gal"
},

{
    plot:true,
    type:"Product",
    label:"Diesel Retail",
    seriesId:"PET.EMD_EPD2D_PTE_NUS_DPG.W",
    unit:"$/gal"
},

{
    plot:true,
    type:"Product",
    label:"Jet Fuel Spot",
    seriesId:"PET.EER_EPJK_PF4_RGC_DPG.D",
    unit:"$/gal"
},

{
    plot:true,
    type:"Product",
    label:"Propane Mont Belvieu",
    seriesId:"PET.EER_EPLLPA_PF4_Y44MB_DPG.D",
    unit:"$/gal"
}

];

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("btnLoad")
        .addEventListener("click", loadPrices);

    document
        .getElementById("btnAdd")
        .addEventListener("click", () => addSeriesRow());

    document
        .getElementById("btnReset")
        .addEventListener("click", resetDefaults);

    resetDefaults();
});

function resetDefaults(){

    const tbody =
        document.querySelector("#seriesTable tbody");

    tbody.innerHTML = "";

    defaultSeries.forEach(addSeriesRow);
}

function addSeriesRow(row = {

    plot:true,
    type:"Product",
    label:"New Series",
    seriesId:"",
    unit:""

}){

    const tbody =
        document.querySelector("#seriesTable tbody");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>
            <input type="checkbox"
            ${row.plot ? "checked" : ""}>
        </td>

        <td>
            <select>
                <option
                ${row.type==="Feedstock"?"selected":""}>
                Feedstock
                </option>

                <option
                ${row.type==="Product"?"selected":""}>
                Product
                </option>
            </select>
        </td>

        <td>
            <input value="${escapeHtml(row.label)}">
        </td>

        <td>
            <input value="${escapeHtml(row.seriesId)}">
        </td>

        <td>
            <input value="${escapeHtml(row.unit)}">
        </td>
    `;

    tbody.appendChild(tr);
}

function getSeriesConfig(){

    return [...document.querySelectorAll(
        "#seriesTable tbody tr"
    )]
    .map(tr => {

        const td = tr.querySelectorAll("td");

        return {

            plot:
                td[0].querySelector("input").checked,

            type:
                td[1].querySelector("select").value,

            label:
                td[2].querySelector("input").value,

            seriesId:
                td[3].querySelector("input").value,

            unit:
                td[4].querySelector("input").value
        };
    })
    .filter(r => r.plot && r.seriesId);
}

async function loadPrices(){

    const status =
        document.getElementById("status");

    status.innerHTML =
        "Loading EIA data...";

    const series = getSeriesConfig();

    const allDates = new Set();

    const datasets = [];

    for(const item of series){

        try{

            const values =
                await fetchSeries(item.seriesId);

            values.forEach(x =>
                allDates.add(x.date));

            datasets.push({

                label:
                    `${item.label} (${item.unit})`,

                map:
                    new Map(
                        values.map(
                            x => [x.date,x.value]
                        )
                    )
            });
        }
        catch(err){

            console.error(err);

            status.innerHTML =
                "Error loading " + item.label;
        }
    }

    const labels =
        [...allDates].sort();

    const chartData =
        datasets.map(ds => ({

            label:ds.label,

            data:
                labels.map(
                    d => ds.map.get(d) ?? null
                ),

            borderWidth:2,

            tension:0.2,

            pointRadius:0
        }));

    buildChart(labels, chartData);

    status.innerHTML =
        `${chartData.length} series loaded`;
}

async function fetchSeries(seriesId){

    const url =
        `https://api.eia.gov/series/?api_key=${EIA_API_KEY}&series_id=${encodeURIComponent(seriesId)}`;

    const response =
        await fetch(url);

    const json =
        await response.json();

    if(
        !json.series ||
        !json.series.length
    ){
        throw new Error(
            "Series not found: " + seriesId
        );
    }

    return json.series[0].data
        .map(r => ({

            date:normalizeDate(r[0]),

            value:Number(r[1])
        }))
        .filter(r =>
            Number.isFinite(r.value)
        )
        .sort(
            (a,b)=>
            a.date.localeCompare(b.date)
        );
}

function normalizeDate(date){

    date = String(date);

    if(/^\d{8}$/.test(date)){

        return `${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`;
    }

    if(/^\d{6}$/.test(date)){

        return `${date.substring(0,4)}-${date.substring(4,6)}-01`;
    }

    return date;
}

function buildChart(labels,datasets){

    const ctx =
        document
        .getElementById("priceChart")
        .getContext("2d");

    if(priceChart)
        priceChart.destroy();

    priceChart =
        new Chart(ctx, {

        type:"line",

        data:{
            labels,
            datasets
        },

        options:{

            responsive:true,

            interaction:{
                mode:"index",
                intersect:false
            },

            plugins:{

                title:{
                    display:true,
                    text:
                    "Feedstock and Product Prices"
                },

                legend:{
                    position:"bottom"
                }
            },

            scales:{

                x:{
                    title:{
                        display:true,
                        text:"Date"
                    }
                },

                y:{
                    title:{
                        display:true,
                        text:"Price"
                    }
                }
            }
        }
    });
}

function escapeHtml(text){

    return String(text).replace(
        /[&<>"']/g,
        c => ({
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            "\"":"&quot;",
            "'":"&#039;"
        })[c]
    );
}