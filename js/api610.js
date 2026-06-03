
// API 610 framework
function viscosityCorrection(viscCst){
 if(viscCst<10) return {CQ:1,CH:1,CE:1};
 return {CQ:0.98,CH:0.99,CE:0.95};
}
function npshMargin(npsha,npshr){
 return npsha-npshr;
}
function api610Pump(i){
 const tdh=((i.pd-i.ps)*2.31/i.sg)+(i.elevation||0);
 const corr=viscosityCorrection(i.visc||1);
 return {tdh,corr,npsh:npshMargin(i.npsha||0,i.npshr||0)};
}
