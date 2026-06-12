// co2-core.js
// Core CO₂ mass-balance equations

export function calculateCO2MassBalance(inputs) {
    const {
        gasFlow,
        gasTemp,
        gasPressure,
        co2Conc,
        captureEff,
        mwGas
    } = inputs;

    const R = 10.73; // psia·ft³/(lb-mol·°R)
    const tempR = (gasTemp + 459.67);

    // Convert vol% to mole fraction
    const yCO2 = co2Conc / 100;

    // Convert MMSCFD → ft³/hr if needed
    const Q = gasFlow * 1e6; // assume MMSCFD for now

    // CO₂ molar flow in
    const nCO2_in = Q * yCO2 * (gasPressure / (R * tempR));

    // Captured
    const nCaptured = nCO2_in * (captureEff / 100);

    // Emitted
    const nEmitted = nCO2_in - nCaptured;

    // Avoided (no penalty yet)
    const nAvoided = nCaptured;

    return {
        nCO2_in,
        nCaptured,
        nEmitted,
        nAvoided
    };
}
