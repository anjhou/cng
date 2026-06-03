
// API 610 pump methods
function api610Pump(input){
 const head=((input.pd-input.ps)*2.31/input.sg);
 return {head:head,bhp:(input.q*head*input.sg)/(3960*input.eff)};
}
