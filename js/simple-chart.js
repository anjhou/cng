/* Lightweight local line-chart renderer with a small Chart.js-compatible surface.
   It supports the subset used by eia-prices.js: new Chart(ctx,{type:'line',data,options}) and destroy(). */
(function(){
  class SimpleChart{
    constructor(ctx, config){
      this.ctx = ctx;
      this.canvas = ctx.canvas;
      this.config = config || {};
      this._resize = () => this.draw();
      window.addEventListener('resize', this._resize);
      this.draw();
    }
    destroy(){
      window.removeEventListener('resize', this._resize);
      const ctx = this.ctx;
      ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    draw(){
      const canvas = this.canvas;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(720, Math.floor(rect.width || canvas.clientWidth || 900));
      const height = Math.max(360, Math.floor(rect.height || canvas.clientHeight || 460));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
      this._draw(width,height);
    }
    _draw(w,h){
      const ctx = this.ctx;
      const cfg = this.config;
      const data = cfg.data || {labels:[],datasets:[]};
      const labels = data.labels || [];
      const datasets = (data.datasets || []).filter(ds => Array.isArray(ds.data));
      const title = cfg.options?.plugins?.title?.text || '';
      const xTitle = cfg.options?.scales?.x?.title?.text || '';
      const yTitle = cfg.options?.scales?.y?.title?.text || 'Left Axis';
      const y1Title = cfg.options?.scales?.y1?.title?.text || 'Right Axis';
      const hasRight = datasets.some(ds => ds.yAxisID === 'y1');
      const margin = {left:78,right:hasRight?78:26,top:title?54:26,bottom:96};
      const pw = w - margin.left - margin.right;
      const ph = h - margin.top - margin.bottom;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,w,h);
      ctx.font = '12px Arial, sans-serif';
      ctx.lineWidth = 1;
      const leftSets = datasets.filter(ds => ds.yAxisID !== 'y1');
      const rightSets = datasets.filter(ds => ds.yAxisID === 'y1');
      const leftRange = rangeFor(leftSets);
      const rightRange = rangeFor(rightSets.length ? rightSets : leftSets);
      drawTitle(ctx,title,w);
      drawPlotBox(ctx,margin,pw,ph);
      drawYAxis(ctx,margin,pw,ph,leftRange,false,yTitle);
      if(hasRight) drawYAxis(ctx,margin,pw,ph,rightRange,true,y1Title);
      drawXAxis(ctx,margin,pw,ph,labels,xTitle);
      const palette = ['#2563eb','#dc2626','#16a34a','#9333ea','#ea580c','#0891b2','#4f46e5','#be123c','#0f766e','#a16207'];
      datasets.forEach((ds,i) => {
        const range = ds.yAxisID === 'y1' ? rightRange : leftRange;
        drawDataset(ctx,margin,pw,ph,labels,ds,range,palette[i % palette.length]);
      });
      drawLegend(ctx,datasets,palette,w,h);
    }
  }
  function rangeFor(sets){
    const vals = [];
    sets.forEach(ds => ds.data.forEach(v => { if(Number.isFinite(Number(v))) vals.push(Number(v)); }));
    if(!vals.length) return {min:0,max:1};
    let min = Math.min(...vals), max = Math.max(...vals);
    if(min === max){ min -= 1; max += 1; }
    const pad = (max - min) * 0.08;
    return {min:min-pad,max:max+pad};
  }
  function yFor(v,range,m,ph){ return m.top + ph - ((v - range.min) / (range.max - range.min)) * ph; }
  function xFor(i,n,m,pw){ return m.left + (n <= 1 ? 0 : (i / (n - 1)) * pw); }
  function nice(v){
    if(Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    if(Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }
  function drawTitle(ctx,title,w){
    if(!title) return;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title,w/2,28);
  }
  function drawPlotBox(ctx,m,pw,ph){
    ctx.strokeStyle = '#d1d5db';
    ctx.strokeRect(m.left,m.top,pw,ph);
    ctx.strokeStyle = '#eef2f7';
    for(let i=1;i<5;i++){
      const y = m.top + i*ph/5;
      ctx.beginPath(); ctx.moveTo(m.left,y); ctx.lineTo(m.left+pw,y); ctx.stroke();
    }
  }
  function drawYAxis(ctx,m,pw,ph,range,right,title){
    const x = right ? m.left + pw : m.left;
    ctx.fillStyle = '#374151';
    ctx.strokeStyle = '#9ca3af';
    ctx.textAlign = right ? 'left' : 'right';
    ctx.font = '11px Arial, sans-serif';
    for(let i=0;i<=5;i++){
      const val = range.max - i*(range.max-range.min)/5;
      const y = m.top + i*ph/5;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x + (right?5:-5),y); ctx.stroke();
      ctx.fillText(nice(val), x + (right?8:-8), y+4);
    }
    ctx.save();
    ctx.translate(right ? m.left+pw+58 : 18, m.top+ph/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(title,0,0);
    ctx.restore();
  }
  function drawXAxis(ctx,m,pw,ph,labels,title){
    ctx.fillStyle = '#374151';
    ctx.strokeStyle = '#9ca3af';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    const n = labels.length;
    const ticks = Math.min(10, n);
    for(let k=0;k<ticks;k++){
      const i = ticks <= 1 ? 0 : Math.round(k*(n-1)/(ticks-1));
      const x = xFor(i,n,m,pw);
      ctx.beginPath(); ctx.moveTo(x,m.top+ph); ctx.lineTo(x,m.top+ph+5); ctx.stroke();
      ctx.save(); ctx.translate(x,m.top+ph+18); ctx.rotate(-Math.PI/6); ctx.fillText(labels[i] || '',0,0); ctx.restore();
    }
    if(title){ ctx.font = '12px Arial, sans-serif'; ctx.fillText(title,m.left+pw/2,m.top+ph+74); }
  }
  function drawDataset(ctx,m,pw,ph,labels,ds,range,color){
    ctx.strokeStyle = color;
    ctx.lineWidth = ds.borderWidth || 2;
    ctx.beginPath();
    let started = false;
    ds.data.forEach((raw,i) => {
      const v = Number(raw);
      if(!Number.isFinite(v)){ started = false; return; }
      const x = xFor(i,labels.length,m,pw);
      const y = yFor(v,range,m,ph);
      if(!started){ ctx.moveTo(x,y); started = true; }
      else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }
  function drawLegend(ctx,datasets,palette,w,h){
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'left';
    let x = 24, y = h - 34;
    datasets.forEach((ds,i) => {
      const label = ds.label || `Series ${i+1}`;
      const color = palette[i % palette.length];
      const textW = ctx.measureText(label).width;
      if(x + textW + 36 > w){ x = 24; y += 18; }
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x,y-4); ctx.lineTo(x+20,y-4); ctx.stroke();
      ctx.fillStyle = '#374151'; ctx.fillText(label,x+26,y);
      x += textW + 56;
    });
  }
  window.Chart = SimpleChart;
})();
