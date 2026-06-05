class CrudeTowerApp {
  static lastResult = null;

  static async init(){
    await AssayManager.load();
    AssayManager.populateDropdown("assaySelect");

    document.getElementById("assaySelect").addEventListener("change", e=>AssayManager.applyToForm(e.target.value));
    document.getElementById("resetAssayBtn").addEventListener("click", ()=>AssayManager.applyToForm(document.getElementById("assaySelect").value));
    document.getElementById("runBtn").addEventListener("click", ()=>this.run());
    document.getElementById("csvBtn").addEventListener("click", ()=>{
      if(this.lastResult) Report.exportCSV(this.lastResult);
      else alert("Run simulation first.");
    });

    ["ponaParaffins","ponaOlefins","ponaNaphthenes","ponaAromatics"].forEach(id=>document.getElementById(id).addEventListener("input",()=>this.updatePONACheck()));
    ["tbp0","tbp10","tbp30","tbp50","tbp70","tbp90","tbp100"].forEach(id=>document.getElementById(id).addEventListener("input",()=>this.previewTBP()));

    AssayManager.applyToForm(document.getElementById("assaySelect").value);
    this.run();
  }

  static getCurrentAssayProps(){
    return {
      api:Number(document.getElementById("apiGravity").value),
      sulfur:Number(document.getElementById("sulfur").value),
      tan:Number(document.getElementById("tan").value),
      ccr:Number(document.getElementById("ccr").value),
      chloride:Number(document.getElementById("chloride").value),
      nitrogen:Number(document.getElementById("nitrogen").value),
      pona:{
        paraffins:Number(document.getElementById("ponaParaffins").value),
        olefins:Number(document.getElementById("ponaOlefins").value),
        naphthenes:Number(document.getElementById("ponaNaphthenes").value),
        aromatics:Number(document.getElementById("ponaAromatics").value)
      },
      tbp:{
        0:Number(document.getElementById("tbp0").value),
        10:Number(document.getElementById("tbp10").value),
        30:Number(document.getElementById("tbp30").value),
        50:Number(document.getElementById("tbp50").value),
        70:Number(document.getElementById("tbp70").value),
        90:Number(document.getElementById("tbp90").value),
        100:Number(document.getElementById("tbp100").value)
      }
    };
  }

  static updatePONACheck(){
    const p=this.getCurrentAssayProps().pona;
    const sum=p.paraffins+p.olefins+p.naphthenes+p.aromatics;
    document.getElementById("ponaCheck").textContent = `PONA total = ${sum.toFixed(1)} vol%. ${Math.abs(sum-100)<=0.5 ? "OK." : "Adjust values to total approximately 100 vol%."}`;
  }

  static validateTBP(tbp){
    const arr=[tbp[0],tbp[10],tbp[30],tbp[50],tbp[70],tbp[90],tbp[100]];
    for(let i=1;i<arr.length;i++) if(arr[i]<=arr[i-1]) return false;
    return true;
  }

  static previewTBP(){
    const props=this.getCurrentAssayProps();
    if(this.validateTBP(props.tbp)) ChartManager.drawTBP(new TBPCurve(props.tbp).sampled(1));
  }

  static run(){
    const assayKey=document.getElementById("assaySelect").value;
    const assayName=AssayManager.get(assayKey)?.displayName || assayKey;
    const feedRate=Number(document.getElementById("feedRate").value);
    const assayProps=this.getCurrentAssayProps();

    if(!this.validateTBP(assayProps.tbp)){
      alert("TBP curve must be strictly increasing from IBP to FBP.");
      return;
    }

    const sg=Units.apiToSG(assayProps.api);
    const tbpCurve=new TBPCurve(assayProps.tbp);
    const products=ProductCuts.estimate(tbpCurve, feedRate);

    this.updatePONACheck();
    ChartManager.drawTBP(tbpCurve.sampled(1));
    this.renderProductTable(products);

    const result={assayName,feedRate,assayProps,sg,products};
    this.lastResult=result;
    document.getElementById("report").textContent=Report.build(result);
  }

  static renderProductTable(products){
    const tbody=document.querySelector("#productTable tbody");
    tbody.innerHTML="";
    products.forEach(p=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${p.name}</td><td>${p.min} - ${p.max}</td><td>${p.volPct.toFixed(2)}</td><td>${Units.fmt(p.bpd,0)}</td>`;
      tbody.appendChild(tr);
    });
  }
}
document.addEventListener("DOMContentLoaded",()=>CrudeTowerApp.init());
