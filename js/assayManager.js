class AssayManager {
  static assays = {};
  static async load(){
    const res = await fetch("data/crudeAssays.json");
    this.assays = await res.json();
  }
  static populateDropdown(selectId){
    const select = document.getElementById(selectId);
    select.innerHTML = "";
    Object.entries(this.assays).forEach(([key, assay])=>{
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = assay.displayName || key;
      select.appendChild(opt);
    });
  }
  static get(key){ return this.assays[key]; }
  static applyToForm(key){
    const a = this.get(key);
    if(!a) return;
    document.getElementById("apiGravity").value = a.api;
    document.getElementById("sulfur").value = a.sulfur;
    document.getElementById("tan").value = a.tan;
    document.getElementById("ccr").value = a.ccr;
    document.getElementById("chloride").value = a.chloride;
    document.getElementById("nitrogen").value = a.nitrogen;
    document.getElementById("ponaParaffins").value = a.pona.paraffins;
    document.getElementById("ponaOlefins").value = a.pona.olefins;
    document.getElementById("ponaNaphthenes").value = a.pona.naphthenes;
    document.getElementById("ponaAromatics").value = a.pona.aromatics;
    document.getElementById("tbp0").value = a.tbp[0];
    document.getElementById("tbp10").value = a.tbp[10];
    document.getElementById("tbp30").value = a.tbp[30];
    document.getElementById("tbp50").value = a.tbp[50];
    document.getElementById("tbp70").value = a.tbp[70];
    document.getElementById("tbp90").value = a.tbp[90];
    document.getElementById("tbp100").value = a.tbp[100];
    CrudeTowerApp.updatePONACheck();
    CrudeTowerApp.previewTBP();
  }
}
