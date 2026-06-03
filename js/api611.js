
// API 611/612 turbine framework
function api611Turbine(i){
 const hin=steamProps(i.pin,i.tin).h;
 const hout=steamProps(i.pout,i.tout).h;
 return {deltaH:hin-hout};
}
