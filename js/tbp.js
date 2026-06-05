class TBPCurve {
  constructor(points){
    this.points = [
      {v:0,t:Number(points[0])},{v:10,t:Number(points[10])},{v:30,t:Number(points[30])},
      {v:50,t:Number(points[50])},{v:70,t:Number(points[70])},{v:90,t:Number(points[90])},{v:100,t:Number(points[100])}
    ];
  }
  temperatureAt(volPct){
    for(let i=0;i<this.points.length-1;i++){
      const a=this.points[i], b=this.points[i+1];
      if(volPct>=a.v && volPct<=b.v) return a.t+(b.t-a.t)*(volPct-a.v)/(b.v-a.v);
    }
    return null;
  }
  volumeAtTemperature(temp){
    const T=Number(temp);
    if(T<=this.points[0].t) return 0;
    if(T>=this.points[this.points.length-1].t) return 100;
    for(let i=0;i<this.points.length-1;i++){
      const a=this.points[i], b=this.points[i+1];
      if(T>=a.t && T<=b.t) return a.v+(b.v-a.v)*(T-a.t)/(b.t-a.t);
    }
    return 100;
  }
  sampled(step=1){const out=[];for(let v=0;v<=100;v+=step)out.push({volume:v,temperature:this.temperatureAt(v)});return out;}
}
