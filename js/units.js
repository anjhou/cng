
// Unit conversion framework
const Units={
 psiToBar:v=>v*0.0689476,
 barToPsi:v=>v/0.0689476,
 gpmToM3h:v=>v*0.227124,
 m3hToGpm:v=>v/0.227124,
 fToC:v=>(v-32)*5/9,
 cToF:v=>v*9/5+32
};
