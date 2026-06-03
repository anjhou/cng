
// API 611/612 turbine methods
function api611Turbine(i){
 return {hp:(i.massFlow*(i.hin-i.hout)*i.eff)/2545};
}
