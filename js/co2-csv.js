// co2-csv.js
// Lightweight CSV parser + batch CO₂ calculator

import { calculateCO2MassBalance } from './co2-core.js';

export function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        const row = {};
        headers.forEach((h, i) => row[h] = parseFloat(cols[i]));
        return row;
    });
}

export function processCSVRows(rows) {
    return rows.map(row => {
        const result = calculateCO2MassBalance({
            gasFlow: row.GasFlow,
            gasTemp: row.TempF,
            gasPressure: row.Pressure,
            co2Conc: row.CO2Conc,
            captureEff: row.CaptureEff,
            mwGas: row.MW
        });

        return {
            ...row,
            ...result
        };
    });
}
