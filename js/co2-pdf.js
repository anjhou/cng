// co2-pdf.js
// jsPDF-based report generator

export function generatePDF(results) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("CO₂ Capture Report", 14, 20);

    doc.setFontSize(12);
    let y = 40;

    Object.entries(results).forEach(([key, value]) => {
        doc.text(`${key}: ${value.toFixed(2)}`, 14, y);
        y += 10;
    });

    doc.save("CO2_Capture_Report.pdf");
}
