
// API 617 compressor methods
function api617Compressor(i){
 const hp=(i.k/(i.k-1))*(i.z*1545/i.mw)*i.t1*
 (Math.pow(i.p2/i.p1,((i.k-1)/(i.k*i.eff)))-1);
 return {hp};
}
