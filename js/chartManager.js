class ChartManager {
  static tbpChart = null;
  static drawTBP(curve){
    const canvas=document.getElementById("tbpChart");
    if(!canvas || typeof Chart==="undefined") return;
    if(this.tbpChart) this.tbpChart.destroy();
    this.tbpChart = new Chart(canvas.getContext("2d"), {
      type:"line",
      data:{labels:curve.map(p=>p.volume),datasets:[{label:"TBP Temperature, °F",data:curve.map(p=>p.temperature),borderWidth:2,tension:0.15}]},
      options:{responsive:true,scales:{x:{title:{display:true,text:"Volume % Distilled"}},y:{title:{display:true,text:"Temperature, °F"}}}}
    });
  }
}
