
// API 617 framework
function outletTemperature(i){
 const ratio=i.p2/i.p1;
 return i.t1*Math.pow(ratio,(i.k-1)/(i.k*i.eff));
}
function api617Compressor(i){
 return {
   ratio:i.p2/i.p1,
   tout:outletTemperature(i)
 };
}
