<script>
// ===============================
//  GLOBAL COLOR PALETTE
// ===============================
function getColor(index, alpha = 1) {
    const palette = [
        'rgba(31,119,180,ALPHA)',   // blue
        'rgba(255,127,14,ALPHA)',   // orange
        'rgba(44,160,44,ALPHA)',    // green
        'rgba(214,39,40,ALPHA)',    // red
        'rgba(148,103,189,ALPHA)',  // purple
        'rgba(140,86,75,ALPHA)'     // brown
    ];
    const color = palette[(index - 1) % palette.length];
    return color.replace('ALPHA', alpha);
}

// ===============================
//  SINGLE‑SERIES CSV CHART
// ===============================
async function loadCSVChart() {
    const response = await fetch('/data/mydata.csv');
    const csvText = await response.text();

    const rows = csvText.trim().split('\n').slice(1);

    const labels = [];
    const values = [];

    rows.forEach(row => {
        const [date, value] = row.split(',');
        labels.push(date);
        values.push(parseFloat(value));
    });

    const ctx = document.getElementById('csvChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CSV Trend',
                data: values,
                borderColor: '#1f77b4',
                backgroundColor: 'rgba(31,119,180,0.2)',
                borderWidth: 2,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Date' }},
                y: { title: { display: true, text: 'Value' }}
            }
        }
    });
}

// ===============================
//  MULTI‑SERIES CSV CHART
// ===============================
async function loadMultiSeriesCSV() {
    const response = await fetch('/data/multiseries.csv');
    const csvText = await response.text();

    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const labels = [];
    const datasets = [];

    // Create dataset objects
    for (let i = 1; i < headers.length; i++) {
        datasets.push({
            label: headers[i],
            data: [],
            borderWidth: 2,
            tension: 0.25,
            borderColor: getColor(i),
            backgroundColor: getColor(i, 0.2)
        });
    }

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        labels.push(cols[0]);

        for (let j = 1; j < cols.length; j++) {
            datasets[j - 1].data.push(parseFloat(cols[j]));
        }
    }

    const ctx = document.getElementById('multiSeriesChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' }},
            scales: {
                x: { title: { display: true, text: 'Date' }},
                y: { title: { display: true, text: 'Value' }}
            }
        }
    });
}

// ===============================
//  PRICE TABLE FROM CSV
// ===============================
async function loadPriceTable() {
    const response = await fetch('/data/prices.csv');
    const csvText = await response.text();

    const rows = csvText.trim().split('\n');
    const headers = rows[0].split(',');

    let html = '<table class="price-table"><thead><tr>';

    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    rows.slice(1).forEach(row => {
        const cols = row.split(',');
        html += '<tr>';
        cols.forEach(c => html += `<td>${c}</td>`);
        html += '</tr>';
    });

    html += '</tbody></table>';

    document.getElementById('priceTableContainer').innerHTML = html;
}

// ===============================
//  AUTO‑INIT
// ===============================
loadCSVChart();
loadMultiSeriesCSV();
loadPriceTable();
</script>
