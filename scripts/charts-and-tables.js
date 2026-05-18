/* ============================================================
   charts-and-tables.js
   Unified CSV loader + Chart.js + Table renderer
   Deep‑blue/silver theme + dark mode aware
   With error handling + loading spinners
   ============================================================ */

/* ------------------------------------------------------------
   GLOBAL THEME (Deep‑Blue / Silver)
------------------------------------------------------------ */
const THEME = {
    blue: "#1f3b73",
    silver: "#c0c7d1",
    darkBg: "#0d1117",
    lightBg: "#ffffff"
};

/* ------------------------------------------------------------
   DARK MODE DETECTION
------------------------------------------------------------ */
function isDarkMode() {
    return document.documentElement.classList.contains("dark-mode");
}

/* ------------------------------------------------------------
   SPINNER UTILITY
------------------------------------------------------------ */
function showSpinner(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="spinner"></div>`;
}

function hideSpinner(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
}

/* ------------------------------------------------------------
   GENERIC CSV PARSER
------------------------------------------------------------ */
async function parseCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        const rows = text.trim().split("\n").map(r => r.split(","));
        return { headers: rows[0], rows: rows.slice(1) };

    } catch (err) {
        console.error(`CSV Load Error (${url}):`, err);
        return null;
    }
}

/* ------------------------------------------------------------
   COLOR PALETTE (Deep‑blue/silver friendly)
------------------------------------------------------------ */
function getColor(index, alpha = 1) {
    const palette = [
        `rgba(31,119,180,ALPHA)`,
        `rgba(255,127,14,ALPHA)`,
        `rgba(44,160,44,ALPHA)`,
        `rgba(214,39,40,ALPHA)`,
        `rgba(148,103,189,ALPHA)`,
        `rgba(140,86,75,ALPHA)`
    ];
    return palette[(index - 1) % palette.length].replace("ALPHA", alpha);
}

/* ------------------------------------------------------------
   SINGLE‑SERIES CHART LOADER
------------------------------------------------------------ */
async function loadCSVChart(url, canvasId) {
    showSpinner(canvasId + "-spinner");

    const data = await parseCSV(url);
    if (!data) return;

    const labels = data.rows.map(r => r[0]);
    const values = data.rows.map(r => parseFloat(r[1]));

    hideSpinner(canvasId + "-spinner");

    new Chart(document.getElementById(canvasId), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: data.headers[1],
                data: values,
                borderColor: THEME.blue,
                backgroundColor: "rgba(31,119,180,0.2)",
                borderWidth: 2,
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: data.headers[0] }},
                y: { title: { display: true, text: data.headers[1] }}
            }
        }
    });
}

/* ------------------------------------------------------------
   MULTI‑SERIES CHART LOADER
------------------------------------------------------------ */
async function loadMultiSeriesChart(url, canvasId) {
    showSpinner(canvasId + "-spinner");

    const data = await parseCSV(url);
    if (!data) return;

    const labels = data.rows.map(r => r[0]);
    const datasets = [];

    for (let i = 1; i < data.headers.length; i++) {
        datasets.push({
            label: data.headers[i],
            data: data.rows.map(r => parseFloat(r[i])),
            borderColor: getColor(i),
            backgroundColor: getColor(i, 0.2),
            borderWidth: 2,
            tension: 0.25
        });
    }

    hideSpinner(canvasId + "-spinner");

    new Chart(document.getElementById(canvasId), {
        type: "line",
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { position: "top" }},
            scales: {
                x: { title: { display: true, text: data.headers[0] }},
                y: { title: { display: true, text: "Value" }}
            }
        }
    });
}

/* ------------------------------------------------------------
   PRICE TABLE LOADER
------------------------------------------------------------ */
async function loadPriceTable(url, containerId) {
    showSpinner(containerId);

    const data = await parseCSV(url);
    if (!data) return;

    const { headers, rows } = data;

    let html = `<table class="price-table ${isDarkMode() ? "dark" : ""}">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
        </tbody>
    </table>`;

    hideSpinner(containerId);
    document.getElementById(containerId).innerHTML = html;
}

/* ------------------------------------------------------------
   EXPORT MODULE API
------------------------------------------------------------ */
export {
    loadCSVChart,
    loadMultiSeriesChart,
    loadPriceTable
};
