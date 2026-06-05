class Report {
  static build(data){
	  
	const timestamp =
    SystemInfo.getTimestamp();
	
    const p=data.assayProps;
	
	let txt =

`====================================================
ENGINEERING SIMULATION REPORT
====================================================

Timestamp:
${timestamp}

====================================================


Selected Assay: ${data.assayName}
Feed Rate: ${Units.fmt(data.feedRate,0)} BPD
API Gravity: ${p.api}
Specific Gravity: ${data.sg.toFixed(4)}

PETROLEUM PROPERTIES
Sulfur: ${p.sulfur} wt%
TAN: ${p.tan} mg KOH/g
CCR: ${p.ccr} wt%
Chloride: ${p.chloride} ppm
Nitrogen: ${p.nitrogen} ppm

PONA
Paraffins: ${p.pona.paraffins} vol%
Olefins: ${p.pona.olefins} vol%
Naphthenes: ${p.pona.naphthenes} vol%
Aromatics: ${p.pona.aromatics} vol%

TBP CURVE, °F
IBP: ${p.tbp[0]}
10%: ${p.tbp[10]}
30%: ${p.tbp[30]}
50%: ${p.tbp[50]}
70%: ${p.tbp[70]}
90%: ${p.tbp[90]}
FBP: ${p.tbp[100]}

PRODUCT ESTIMATE
`;
    data.products.forEach(x=>{
      txt += `${x.name.padEnd(28)} ${String(x.min+"-"+x.max).padEnd(12)} ${x.volPct.toFixed(2).padStart(8)} vol% ${Units.fmt(x.bpd,0).padStart(12)} BPD\n`;
    });
    return txt;
  }

  static exportCSV(data){
    let csv="Section,Parameter,Value,Units\n";
    const p=data.assayProps;
    csv += `Assay,Selected,${data.assayName},\n`;
    csv += `Feed,Rate,${data.feedRate},BPD\n`;
    csv += `Property,API,${p.api},deg API\n`;
    csv += `Property,Sulfur,${p.sulfur},wt%\n`;
    csv += `Property,TAN,${p.tan},mg KOH/g\n`;
    csv += `Property,CCR,${p.ccr},wt%\n`;
    csv += `Property,Chloride,${p.chloride},ppm\n`;
    csv += `Property,Nitrogen,${p.nitrogen},ppm\n`;
    Object.entries(p.pona).forEach(([k,v])=>csv += `PONA,${k},${v},vol%\n`);
    Object.entries(p.tbp).forEach(([k,v])=>csv += `TBP,${k},${v},deg F\n`);
    data.products.forEach(x=>csv += `Product,${x.name},${x.volPct.toFixed(3)} vol%,${x.bpd.toFixed(0)} BPD\n`);
    const blob=new Blob([csv],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="crude_assay_simulation.csv";
    a.click();
  }
}
