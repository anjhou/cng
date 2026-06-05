class ProductCuts {
  static cuts = [
    {name:"Refinery Gas / LPG", min:0, max:100},
    {name:"Light Naphtha", min:100, max:180},
    {name:"Heavy Naphtha", min:180, max:350},
    {name:"Middle Distillate / Kero", min:350, max:450},
    {name:"Diesel", min:450, max:650},
    {name:"Atmospheric Gas Oil", min:650, max:850},
    {name:"Heavy Gas Oil", min:850, max:1050},
    {name:"Residue", min:1050, max:2500}
  ];
  static estimate(tbpCurve, feedRate){
    return this.cuts.map(c=>{
      const v1=tbpCurve.volumeAtTemperature(c.min);
      const v2=tbpCurve.volumeAtTemperature(c.max);
      const volPct=Math.max(0,v2-v1);
      return {...c, volPct, bpd: feedRate*volPct/100};
    });
  }
}
