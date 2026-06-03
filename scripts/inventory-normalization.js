/*
=====================================================
Inventory Normalization Module
File:
js/inventory-normalization.js
=====================================================
*/

let normalizationInventoryData = [];

let normalizationChart = null;

/* ------------------------------------
   Initialize
------------------------------------ */

document.addEventListener(

    "DOMContentLoaded",

    function(){

        loadNormalizationData();

        document
        .getElementById(
            "normStream"
        )
        .addEventListener(

            "change",

            updateInventoryNormalization

        );

        document
        .getElementById(
            "normYears"
        )
        .addEventListener(

            "change",

            updateInventoryNormalization

        );

    }

);

/* ------------------------------------
   Load CSV
------------------------------------ */

async function loadNormalizationData(){

    try{

        const response =
            await fetch(
                "https://houstoncng.com/data/us_inventory.csv"
            );

        const csv =
            await response.text();

        parseNormalizationCSV(csv);

        initializeNormalizationChart();

        updateInventoryNormalization();

    }
    catch(error){

        console.error(
            "Normalization CSV Load Error",
            error
        );

    }

}

/* ------------------------------------
   Parse CSV
------------------------------------ */

function parseNormalizationCSV(csv){

    const rows =
        csv
        .replace(/\r/g,"")
        .trim()
        .split("\n");

    normalizationInventoryData = [];

    rows.slice(1).forEach(row=>{

        const cols =
            row.split(",");

        normalizationInventoryData.push({

            date:
                cols[0],

            Crude:
                Number(cols[1]),

            Gasoline:
                Number(cols[2]),

            Diesel:
                Number(cols[3]),

            Jet:
                Number(cols[4]),

            FuelOil:
                Number(cols[5])

        });

    });

}

/* ------------------------------------
   Initialize ECharts
------------------------------------ */

function initializeNormalizationChart(){

    const chartDiv =
        document.getElementById(
            "inventoryNormalizationChart"
        );

    if(!chartDiv){

        console.error(
            "inventoryNormalizationChart not found"
        );

        return;

    }

    normalizationChart =
        echarts.init(chartDiv);

}

/* ------------------------------------
   Statistics
------------------------------------ */

function calculateMean(values){

    return values.reduce(

        (a,b)=>a+b,

        0

    ) / values.length;

}

function calculateStdDev(
    values,
    mean
){

    const variance =

        values.reduce(

            (sum,val)=>

                sum +

                Math.pow(
                    val - mean,
                    2
                ),

            0

        ) / values.length;

    return Math.sqrt(
        variance
    );

}

/* ------------------------------------
   Normal Distribution Curve
------------------------------------ */

function buildNormalCurve(
    mean,
    stdDev
){

    const curve = [];

    const start =
        mean -
        (4 * stdDev);

    const end =
        mean +
        (4 * stdDev);

    const step =
        (
            end - start
        ) / 100;

    for(

        let x = start;

        x <= end;

        x += step

    ){

        const y =

            (
                1 /

                (
                    stdDev *

                    Math.sqrt(
                        2 * Math.PI
                    )

                )

            )

            *

            Math.exp(

                -

                Math.pow(

                    x - mean,

                    2

                )

                /

                (

                    2 *

                    Math.pow(
                        stdDev,
                        2
                    )

                )

            );

        curve.push([

            Number(
                x.toFixed(2)
            ),

            y

        ]);

    }

    return curve;

}

/* ------------------------------------
   Update Chart
------------------------------------ */

function updateInventoryNormalization(){

    if(
        normalizationInventoryData.length === 0
    ){

        return;

    }

    const stream =

        document
        .getElementById(
            "normStream"
        )
        .value;

    const years =

        parseInt(

            document
            .getElementById(
                "normYears"
            )
            .value

        );

    const months =
        years * 12;

    const subset =

        normalizationInventoryData.slice(
            -months
        );

    const values =

        subset.map(

            row =>

            Number(
                row[stream]
            )

        );

    if(values.length < 2){

        return;

    }

    const mean =
        calculateMean(values);

    const stdDev =
        calculateStdDev(
            values,
            mean
        );

    const current =

        values[
            values.length - 1
        ];

    const zScore =

        (
            current - mean
        )

        /

        stdDev;

    const minValue =
        Math.min(
            ...values
        );

    const maxValue =
        Math.max(
            ...values
        );

    const curve =
        buildNormalCurve(
            mean,
            stdDev
        );

    const currentY =

        (

            1 /

            (

                stdDev *

                Math.sqrt(
                    2 *
                    Math.PI
                )

            )

        )

        *

        Math.exp(

            -

            Math.pow(

                current -
                mean,

                2

            )

            /

            (

                2 *

                Math.pow(
                    stdDev,
                    2
                )

            )

        );

    normalizationChart.setOption({

        title:{

            text:

                stream +

                " Inventory Normalization"

        },

        tooltip:{

            trigger:"axis"

        },

        legend:{

            data:[

                "Distribution",

                "Current Inventory"

            ]

        },

        xAxis:{

            type:"value",

            name:

                "Inventory"

        },

        yAxis:{

            type:"value",

            name:

                "Probability"

        },

        series:[

            {

                name:
                    "Distribution",

                type:
                    "line",

                smooth:
                    true,

                data:
                    curve

            },

            {

                name:
                    "Current Inventory",

                type:
                    "scatter",

                symbolSize:
                    16,

                data:[

                    [

                        current,

                        currentY

                    ]

                ]

            }

        ]

    });

    updateNormalizationStats(

        stream,
        years,
        mean,
        stdDev,
        current,
        zScore,
        minValue,
        maxValue

    );

}

/* ------------------------------------
   Statistics Table
------------------------------------ */

function updateNormalizationStats(

    stream,
    years,
    mean,
    stdDev,
    current,
    zScore,
    minValue,
    maxValue

){

    const tbody =

        document.querySelector(

            "#inventoryNormalizationStats tbody"

        );

    if(!tbody){

        return;

    }

    tbody.innerHTML =

    `
    <tr>
        <td>Stream</td>
        <td>${stream}</td>
    </tr>

    <tr>
        <td>Lookback Period</td>
        <td>${years} Years</td>
    </tr>

    <tr>
        <td>Mean Inventory</td>
        <td>${mean.toFixed(2)}</td>
    </tr>

    <tr>
        <td>Standard Deviation</td>
        <td>${stdDev.toFixed(2)}</td>
    </tr>

    <tr>
        <td>Current Inventory</td>
        <td>${current.toFixed(2)}</td>
    </tr>

    <tr>
        <td>Z-Score</td>
        <td>${zScore.toFixed(2)}</td>
    </tr>

    <tr>
        <td>Minimum Inventory</td>
        <td>${minValue.toFixed(2)}</td>
    </tr>

    <tr>
        <td>Maximum Inventory</td>
        <td>${maxValue.toFixed(2)}</td>
    </tr>
    `;

}