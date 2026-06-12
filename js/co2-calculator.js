// co2-calculator.js
import { calculateCO2MassBalance } from './co2-core.js';
import { renderCO2Chart } from './co2-chart.js';
import { parseCSV, processCSVRows } from './co2-csv.js';
import { generatePDF } from './co2-pdf.js';

const resultsBox = document.getElementById('resultsBox');
const chartCanvas = document.getElementById('co2Chart');
const csvResults = document.getElementById('csvResults');

// ----------------------------
// 1. Single Calculation
// ----------------------------
document.getElementById('calculateBtn').addEventListener('click', () => {
    const inputs = {
        gasFlow: parseFloat(document.getElementById('gasFlow').value),
        gasTemp: parseFloat(document.getElementById('gasTemp').value),
        gasPressure: parseFloat(document.getElementById('gasPressure').value),
        co2Conc: parseFloat(document.getElementById('co2Conc').value),
        captureEff: parseFloat(document.getElementById('captureEff').value),
        mwGas: parseFloat(document.getElementById('mwGas').value)
    };

    const results = calculateCO2MassBalance(inputs);

    resultsBox.innerHTML = `
        <p><strong>CO₂ In:</strong> ${results.nCO2_in.toFixed(2)} lb-mol/hr</p>
        <p><strong>Captured:</strong> ${results.nCaptured.toFixed(2)} lb-mol/hr</p>
        <p><strong>Emitted:</strong> ${results.nEmitted.toFixed(2)} lb-mol/hr</p>
        <p><strong>Avoided:</strong> ${results.nAvoided.toFixed(2)} lb-mol/hr</p>
    `;

    renderCO2Chart(chartCanvas, results);

    window._latestResults = results;
});

// ----------------------------
// 2. PDF Export
// ----------------------------
document.getElementById('exportPdfBtn').addEventListener('click', () => {
    if (!window._latestResults) return;
    generatePDF(window._latestResults);
});

// ----------------------------
// 3. CSV Batch Processing
// ----------------------------
document.getElementById('processCsvBtn').addEventListener('click', () => {
    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const rows = parseCSV(e.target.result);
        const results = processCSVRows(rows);

        csvResults.innerHTML = `
            <h3>CSV Results</h3>
            <pre>${JSON.stringify(results, null, 2)}</pre>
        `;
    };

    reader.readAsText(file);
});
