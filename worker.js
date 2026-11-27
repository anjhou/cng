const routes={"PET.RWTC.D": "petroleum/pri/spt", "PET.RBRTE.D": "petroleum/pri/spt", "NG.RNGWHHD.D": "natural-gas/pri/fut", "NG.RNGC1TX3.D": "natural-gas/pri/fut", "PET.EMM_EPM0_PTE_NUS_DPG.W": "petroleum/pri/gnd", "PET.EMD_EPD2D_PTE_NUS_DPG.W": "petroleum/pri/gnd", "PET.EER_EPJK_PF4_RGC_DPG.D": "petroleum/pri/spt", "PET.EER_EPLLPA_PF4_Y44MB_DPG.D": "petroleum/pri/spt", "PET.EER_EPLEM_PF4_Y44MB_DPG.D": "petroleum/pri/spt", "PET.EER_EPLBN_PF4_Y44MB_DPG.D": "petroleum/pri/spt", "PET.EER_EPLBI_PF4_Y44MB_DPG.D": "petroleum/pri/spt", "PET.EER_EPLNG_PF4_Y44MB_DPG.D": "petroleum/pri/spt"};
async function eia({request,env}) {
 const input=new URL(request.url).searchParams;
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(input.get('health')==='1')return reply({configured:Boolean(env.EIA_API_KEY),version:'worker-v6',message:'Upstream connectivity not tested.'});
 if(!env.EIA_API_KEY)return reply({error:'Cloudflare EIA_API_KEY secret is not configured'},503);
 if(input.get('health')==='1')return reply({configured:true,message:'Proxy deployed; API key configured. Upstream connectivity not tested.'});
 const series=input.get('series')||'';
 if(!Object.hasOwn(routes,series))return reply({error:'Invalid or unsupported petroleum/natural gas series ID'},400);
 const frequency=({D:'daily',W:'weekly',M:'monthly',Q:'quarterly',A:'annual'})[series.split('.').pop()];
 const start=input.get('start')||''; const offset=Number(input.get('offset')||0);
 if(!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(start)||!Number.isInteger(offset)||offset<0||offset>50000)return reply({error:'Invalid start date or offset'},400);
 const url=new URL('https://api.eia.gov/v2/'+routes[series]+'/data/');
 url.search=new URLSearchParams({api_key:env.EIA_API_KEY,frequency,start,'data[0]':'value','facets[series][]':series.split('.')[1],length:'5000',offset:String(offset),'sort[0][column]':'period','sort[0][direction]':'desc'});
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try {
   const upstream=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!upstream.ok){if(attempt===0&&[429,502,503,504].includes(upstream.status))continue;return reply({error:'EIA upstream HTTP '+upstream.status},502);}
   const json=await upstream.json();if(!Array.isArray(json.response?.data))return reply({error:'Unexpected EIA response'},502);
   return reply({response:{data:json.response.data.map(r=>({period:r.period,value:r.value})),total:json.response.total}});
  }catch(e){if(attempt===1)return reply({error:e.name==='AbortError'?'EIA upstream timed out after retry':'EIA upstream connection or response failed'},504);}finally{clearTimeout(timer);}
 }
 return reply({error:'EIA unavailable'},502);
}

export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/health')return Response.json({status:'OK',version:'worker-v6'},{headers:{'Cache-Control':'no-store'}});
 if(path==='/api/eia') {if(request.method!=='GET')return new Response('Method not allowed',{status:405});return eia({request,env});}
 return env.ASSETS.fetch(request);
}};
