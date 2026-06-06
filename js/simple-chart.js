/* Interactive local line-chart renderer with a small Chart.js-compatible surface.
   Supports: new Chart(ctx,{type:'line',data,options}), destroy(), clickable legend,
   hover tooltip, vertical crosshair, nearest-point display, and dual y-axes. */
(function(){
  class SimpleChart{
    constructor(ctx, config){
      this.ctx = ctx;
      this.canvas = ctx.canvas;
      this.config = config || {};
      this.hidden = new Set();
      this.hover = null;
      this.legendItems = [];
      this.layout = null;
      this.palette = ['#2563eb','#dc2626','#16a34a','#9333ea','#ea580c','#0891b2','#4f46e5','#be123c','#0f766e','#a16207','#7c3aed','#0369a1'];
      this._resize = () => this.draw();
      this._mousemove = e => this.onMouseMove(e);
      this._mouseleave = () => { this.hover = null; this.draw(); };
      this._click = e => this.onClick(e);
      window.addEventListener('resize', this._resize);
      this.canvas.addEventListener('mousemove', this._mousemove);
      this.canvas.addEventListener('mouseleave', this._mouseleave);
      this.canvas.addEventListener('click', this._click);
      this.canvas.style.cursor = 'crosshair';
      this.draw();
    }
    destroy(){
      window.removeEventListener('resize', this._resize);
      this.canvas.removeEventListener('mousemove', this._mousemove);
      this.canvas.removeEventListener('mouseleave', this._mouseleave);
      this.canvas.removeEventListener('click', this._click);
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    data(){ return this.config.data || {labels:[],datasets:[]}; }
    allDatasets(){ return (this.data().datasets || []).filter(ds => Array.isArray(ds.data)); }
    visibleDatasets(){ return this.allDatasets().filter((_,i) => !this.hidden.has(i)); }
    draw(){
      const canvas = this.canvas;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = Math.max(720, Math.floor(rect.width || canvas.clientWidth || 900));
      const cssHeight = Math.max(420, Math.floor(rect.height || canvas.clientHeight || 520));
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
      this._draw(cssWidth, cssHeight);
    }
    _draw(w,h){
      const ctx = this.ctx;
      const cfg = this.config;
      const data = this.data();
      const labels = data.labels || [];
      const allSets = this.allDatasets();
      const visibleSets = this.visibleDatasets();
      const title = cfg.options?.plugins?.title?.text || '';
      const xTitle = cfg.options?.scales?.x?.title?.text || 'Date';
      const yTitle = cfg.options?.scales?.y?.title?.text || 'Left Axis';
      const y1Title = cfg.options?.scales?.y1?.title?.text || 'Right Axis';
      const hasRight = visibleSets.some(ds => ds.yAxisID === 'y1');
      const margin = {left:82,right:hasRight?84:30,top:title?56:30,bottom:118};
      const pw = Math.max(50, w - margin.left - margin.right);
      const ph = Math.max(50, h - margin.top - margin.bottom);
      const leftSets = visibleSets.filter(ds => ds.yAxisID !== 'y1');
      const rightSets = visibleSets.filter(ds => ds.yAxisID === 'y1');
      const leftRange = rangeFor(leftSets.length ? leftSets : visibleSets);
      const rightRange = rangeFor(rightSets.length ? rightSets : leftSets);
      this.layout = {w,h,margin,pw,ph,leftRange,rightRange,hasRight,labels};
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
      drawTitle(ctx,title,w);
      drawPlotBox(ctx,margin,pw,ph);
      drawYAxis(ctx,margin,pw,ph,leftRange,false,yTitle);
      if(hasRight) drawYAxis(ctx,margin,pw,ph,rightRange,true,y1Title);
      drawXAxis(ctx,margin,pw,ph,labels,xTitle);
      allSets.forEach((ds,i) => {
        if(this.hidden.has(i)) return;
        const range = ds.yAxisID === 'y1' ? rightRange : leftRange;
        drawDataset(ctx,margin,pw,ph,labels,ds,range,this.palette[i % this.palette.length]);
      });
      this.legendItems = drawLegend(ctx,allSets,this.palette,w,h,this.hidden);
      if(this.hover) this.drawHover();
    }
    onMouseMove(e){
      if(!this.layout) return;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const {margin,pw,ph,labels} = this.layout;
      const overLegend = this.legendItems.some(item => x >= item.x && x <= item.x + item.w && y >= item.y - 14 && y <= item.y + 6);
      this.canvas.style.cursor = overLegend ? 'pointer' : 'crosshair';
      if(x < margin.left || x > margin.left + pw || y < margin.top || y > margin.top + ph){
        this.hover = null; this.draw(); return;
      }
      const n = labels.length;
      const idx = n <= 1 ? 0 : Math.max(0, Math.min(n-1, Math.round(((x - margin.left) / pw) * (n - 1))));
      this.hover = {index:idx, mouseX:x, mouseY:y};
      this.draw();
    }
    onClick(e){
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const item = this.legendItems.find(it => x >= it.x && x <= it.x + it.w && y >= it.y - 14 && y <= it.y + 6);
      if(item){
        if(this.hidden.has(item.index)) this.hidden.delete(item.index);
        else this.hidden.add(item.index);
        this.draw();
      }
    }
    drawHover(){
      const ctx = this.ctx;
      const {margin,pw,ph,labels,leftRange,rightRange} = this.layout;
      const idx = this.hover.index;
      const x = xFor(idx, labels.length, margin, pw);
      ctx.save();
      ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(x,margin.top); ctx.lineTo(x,margin.top+ph); ctx.stroke(); ctx.setLineDash([]);
      const rows = [];
      this.allDatasets().forEach((ds,i) => {
        if(this.hidden.has(i)) return;
        const raw = ds.data[idx];
        const v = Number(raw);
        if(!Number.isFinite(v)) return;
        const range = ds.yAxisID === 'y1' ? rightRange : leftRange;
        const y = yFor(v,range,margin,ph);
        const color = this.palette[i % this.palette.length];
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill();
        rows.push({label:ds.label || `Series ${i+1}`, value:v, color});
      });
      if(rows.length){
        drawTooltip(ctx, labels[idx] || '', rows, x, this.hover.mouseY, this.layout.w, this.layout.h);
      }
      ctx.restore();
    }
  }
  function rangeFor(sets){
    const vals = [];
    sets.forEach(ds => ds.data.forEach(v => { const n = Number(v); if(Number.isFinite(n)) vals.push(n); }));
    if(!vals.length) return {min:0,max:1};
    let min = Math.min(...vals), max = Math.max(...vals);
    if(min === max){ min -= 1; max += 1; }
    const pad = (max - min) * 0.08;
    return {min:min-pad,max:max+pad};
  }
  function yFor(v,range,m,ph){ return m.top + ph - ((v - range.min) / (range.max - range.min)) * ph; }
  function xFor(i,n,m,pw){ return m.left + (n <= 1 ? 0 : (i / (n - 1)) * pw); }
  function nice(v){
    if(!Number.isFinite(v)) return '';
    if(Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
    if(Math.abs(v) >= 10) return v.toFixed(2);
    return v.toFixed(3);
  }
  function drawTitle(ctx,title,w){
    if(!title) return;
    ctx.fillStyle = '#111827'; ctx.font = 'bold 16px Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title,w/2,30);
  }
  function drawPlotBox(ctx,m,pw,ph){
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(m.left,m.top,pw,ph);
    ctx.strokeStyle = '#eef2f7';
    for(let i=1;i<5;i++){ const y = m.top + i*ph/5; ctx.beginPath(); ctx.moveTo(m.left,y); ctx.lineTo(m.left+pw,y); ctx.stroke(); }
  }
  function drawYAxis(ctx,m,pw,ph,range,right,title){
    const x = right ? m.left + pw : m.left;
    ctx.fillStyle = '#374151'; ctx.strokeStyle = '#9ca3af'; ctx.textAlign = right ? 'left' : 'right'; ctx.font = '11px Arial, sans-serif';
    for(let i=0;i<=5;i++){
      const val = range.max - i*(range.max-range.min)/5;
      const y = m.top + i*ph/5;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x + (right?5:-5),y); ctx.stroke();
      ctx.fillText(nice(val), x + (right?8:-8), y+4);
    }
    ctx.save(); ctx.translate(right ? m.left+pw+62 : 18, m.top+ph/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center'; ctx.font = '12px Arial, sans-serif'; ctx.fillStyle = '#374151'; ctx.fillText(title,0,0); ctx.restore();
  }
  function drawXAxis(ctx,m,pw,ph,labels,title){
    ctx.fillStyle = '#374151'; ctx.strokeStyle = '#9ca3af'; ctx.font = '11px Arial, sans-serif'; ctx.textAlign = 'center';
    const n = labels.length; const ticks = Math.min(12, n);
    for(let k=0;k<ticks;k++){
      const i = ticks <= 1 ? 0 : Math.round(k*(n-1)/(ticks-1));
      const x = xFor(i,n,m,pw);
      ctx.beginPath(); ctx.moveTo(x,m.top+ph); ctx.lineTo(x,m.top+ph+5); ctx.stroke();
      ctx.save(); ctx.translate(x,m.top+ph+20); ctx.rotate(-Math.PI/6); ctx.fillText(labels[i] || '',0,0); ctx.restore();
    }
    if(title){ ctx.font = '12px Arial, sans-serif'; ctx.fillText(title,m.left+pw/2,m.top+ph+82); }
  }
  function drawDataset(ctx,m,pw,ph,labels,ds,range,color){
    ctx.strokeStyle = color; ctx.lineWidth = ds.borderWidth || 2; ctx.beginPath();
    let started = false;
    ds.data.forEach((raw,i) => {
      const v = Number(raw);
      if(!Number.isFinite(v)){ started = false; return; }
      const x = xFor(i,labels.length,m,pw); const y = yFor(v,range,m,ph);
      if(!started){ ctx.moveTo(x,y); started = true; } else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }
  function drawLegend(ctx,datasets,palette,w,h,hidden){
    const items = [];
    ctx.font = '11px Arial, sans-serif'; ctx.textAlign = 'left';
    let x = 24, y = h - 54;
    datasets.forEach((ds,i) => {
      const label = ds.label || `Series ${i+1}`;
      const textW = ctx.measureText(label).width;
      const boxW = textW + 50;
      if(x + boxW > w - 24){ x = 24; y += 20; }
      const off = hidden.has(i);
      ctx.globalAlpha = off ? 0.35 : 1;
      ctx.strokeStyle = palette[i % palette.length]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x,y-4); ctx.lineTo(x+22,y-4); ctx.stroke();
      ctx.fillStyle = '#374151'; ctx.fillText(label,x+30,y);
      if(off){ ctx.strokeStyle = '#111827'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x,y-13); ctx.lineTo(x+boxW-10,y+2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      items.push({x,y,w:boxW,h:18,index:i});
      x += boxW + 10;
    });
    ctx.fillStyle = '#6b7280'; ctx.font = '10px Arial, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('Click legend to show/hide. Hover plot for values.', w-24, h-12);
    return items;
  }
  function drawTooltip(ctx,date,rows,x,mouseY,w,h){
    ctx.font = '12px Arial, sans-serif';
    const pad = 8;
    const lineH = 17;
    const maxText = Math.max(ctx.measureText(date).width, ...rows.map(r => ctx.measureText(`${r.label}: ${nice(r.value)}`).width));
    const tw = Math.min(w - 20, maxText + 36);
    const th = pad*2 + lineH*(rows.length+1);
    let tx = x + 14;
    if(tx + tw > w - 8) tx = x - tw - 14;
    let ty = Math.max(8, Math.min(h - th - 8, mouseY - th/2));
    ctx.fillStyle = 'rgba(17,24,39,0.92)';
    roundRect(ctx,tx,ty,tw,th,6); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(date,tx+pad,ty+pad+10);
    ctx.font = '12px Arial, sans-serif';
    rows.forEach((r,i) => {
      const y = ty + pad + 10 + lineH*(i+1);
      ctx.fillStyle = r.color; ctx.fillRect(tx+pad,y-9,10,10);
      ctx.fillStyle = '#ffffff'; ctx.fillText(`${r.label}: ${nice(r.value)}`,tx+pad+16,y);
    });
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }
  window.Chart = SimpleChart;
})();
