'use strict';

const unitData = {
  pta:{title:'PTA Feed',desc1:'Purified terephthalic acid solids are fed to slurry preparation.',desc2:'Primary acid component for PET formation.',condition:'Ambient solids handling',function:'Provides terephthalic acid monomer.',output:'PTA powder to slurry mixer'},
  eg:{title:'Ethylene Glycol Feed',desc1:'Fresh and recovered EG are combined and metered to the slurry system.',desc2:'Excess EG promotes esterification and is later recovered.',condition:'Liquid feed; recycle EG after purification',function:'Provides glycol component and reaction medium.',output:'EG to slurry mixer'},
  slurry:{title:'Slurry Mixing',desc1:'PTA, EG, catalyst, and additives are mixed into a pumpable slurry.',desc2:'Controls PTA/EG molar ratio and feed consistency.',condition:'Preheated slurry service',function:'Creates uniform feed to esterification.',output:'PTA/EG slurry'},
  ester:{title:'Esterification Reactor',desc1:'PTA reacts with EG to form mono-ethylene terephthalate and oligomers.',desc2:'Water vapor is removed as a reaction by-product.',condition:'480–550°F; 20–60 psig',function:'Converts PTA + EG to MET/oligomer melt.',output:'MET/oligomers + water vapor'},
  prepoly:{title:'Prepolymerization',desc1:'Oligomer melt is advanced while EG vapor is removed.',desc2:'Reduces volatile EG load before final finisher.',condition:'Elevated temperature; vacuum service',function:'Builds low-molecular-weight PET prepolymer.',output:'Prepolymer melt + EG vapor'},
  polycond:{title:'Polycondensation / Finisher',desc1:'Vacuum polycondensation builds PET intrinsic viscosity.',desc2:'Excess EG is continuously removed, condensed, and recycled.',condition:'520–560°F; 1–10 mmHg',function:'Builds final PET molecular weight / IV.',output:'PET melt to resin or fiber line'},
  egrec:{title:'EG Recovery',desc1:'EG and process vapors are condensed and purified.',desc2:'Recovered EG is recycled to reduce raw material consumption.',condition:'Condensation, purification, recycle service',function:'Recovers EG from esterification and polycondensation off-gas.',output:'Recovered EG to slurry system'},
  meltfilter:{title:'Melt Filtration',desc1:'PET melt is filtered before pelletizing to remove gels and particulates.',desc2:'Improves resin quality and downstream processing reliability.',condition:'520–560°F melt service',function:'Final melt cleanup for resin line.',output:'Filtered PET melt'},
  pellet:{title:'Extrusion & Pelletizing',desc1:'Filtered PET melt is extruded and cut into chips or pellets.',desc2:'Pellets are cooled and dried before storage or SSP.',condition:'520–560°F extrusion; water-cooled pelletizing',function:'Converts PET melt into resin pellets.',output:'Amorphous PET chips/pellets'},
  ssp:{title:'Crystallization / SSP',desc1:'Optional solid-state polymerization increases intrinsic viscosity.',desc2:'Used for bottle-grade and high-IV PET resin.',condition:'350–430°F; inert gas or vacuum',function:'Raises IV and crystallizes PET chips.',output:'Bottle-grade PET resin'},
  resinstorage:{title:'PET Resin Storage',desc1:'Finished resin is stored, bagged, or conveyed to downstream users.',desc2:'Applications include bottles, films, packaging, and engineering resin.',condition:'Cooled solids handling',function:'Stores and ships PET resin.',output:'PET resin product'},
  spinpack:{title:'Spin Packs / Spinnerets',desc1:'Molten PET is filtered and extruded through spinnerets.',desc2:'Creates continuous filaments for polyester fiber production.',condition:'500–550°F melt spinning',function:'Forms PET filaments.',output:'Molten filaments'},
  drawing:{title:'Quench / Drawing',desc1:'Filaments are cooled and stretched to orient polymer chains.',desc2:'Drawing sets tensile properties and denier.',condition:'Quench air; draw zones 150–400°F',function:'Solidifies and orients filaments.',output:'Drawn polyester filaments'},
  crimpdry:{title:'Crimping / Drying',desc1:'Fiber is crimped, dried, and finished depending on staple or filament route.',desc2:'Prepares fiber for baling or winding.',condition:'Fiber finishing and drying service',function:'Finishes polyester fiber morphology.',output:'Finished fiber tow/staple'},
  fiberstorage:{title:'Polyester Fiber Packaging',desc1:'Finished polyester fiber is baled, packaged, or wound.',desc2:'Used in textiles, apparel, carpet, industrial fabrics, and nonwovens.',condition:'Ambient solids/fiber handling',function:'Stores and ships polyester fiber.',output:'Polyester fiber product'}
};

const streamData = {
  s1:{title:'PTA Feed',from:'PTA storage',to:'Slurry mixing',purpose:'Solid PTA feed to polyester reaction section; ambient solids handling.'},
  s2:{title:'EG Feed',from:'Fresh/recovered EG',to:'Slurry mixing',purpose:'EG feed and recycle to control esterification stoichiometry.'},
  s3:{title:'PTA/EG Slurry',from:'Slurry mixer',to:'Esterification reactor',purpose:'Pumpable feed slurry to 480–550°F, 20–60 psig esterification.'},
  s4:{title:'MET / Oligomer Melt',from:'Esterification',to:'Prepolymerization',purpose:'Reaction mixture containing MET and low oligomers.'},
  s5:{title:'Prepolymer Melt',from:'Prepolymerization',to:'Polycondensation',purpose:'PET prepolymer to vacuum finisher.'},
  s6:{title:'Water / EG Vapors',from:'Esterification',to:'EG recovery',purpose:'Water by-product and EG vapor are condensed and separated.'},
  s7:{title:'EG Vapors',from:'Prepolymer / finisher',to:'EG recovery',purpose:'Excess EG removed under vacuum and recovered.'},
  s8:{title:'Recovered EG Recycle',from:'EG recovery',to:'Slurry mixing',purpose:'Purified EG recycled to reduce fresh EG consumption.'},
  s9:{title:'PET Melt to Resin Line',from:'Polycondensation',to:'Melt filtration',purpose:'520–560°F PET melt routed to resin pelletizing.'},
  s10:{title:'Filtered PET Melt',from:'Melt filtration',to:'Extrusion / pelletizing',purpose:'Clean melt for chip production.'},
  s11:{title:'PET Chips',from:'Pelletizing',to:'Crystallizer / SSP',purpose:'Pellets sent to optional 350–430°F SSP for higher IV.'},
  s12:{title:'PET Resin Product',from:'SSP / pelletizing',to:'Resin storage',purpose:'Finished resin to silos, bags, or bulk loading.'},
  s13:{title:'PET Melt to Fiber Line',from:'Polycondensation',to:'Spin packs',purpose:'500–550°F melt routed directly to fiber spinning.'},
  s14:{title:'Fresh Filaments',from:'Spin packs',to:'Quench / draw',purpose:'Extruded filaments are cooled and oriented.'},
  s15:{title:'Drawn Fiber',from:'Quench / draw',to:'Crimp / dry',purpose:'Fiber finishing at draw-zone temperatures of 150–400°F.'},
  s16:{title:'Polyester Fiber Product',from:'Crimp / dry',to:'Fiber packaging',purpose:'Finished filament or staple fiber to baling/packaging.'}
};

const applicationData = [
  {family:'PET Resin', application:'Beverage bottles', endUses:'Carbonated soft drinks, bottled water, juices, sports drinks, and beverage containers.', driver:'Clear, lightweight, tough resin with good CO2 barrier and high bottle productivity.'},
  {family:'PET Resin', application:'Food packaging', endUses:'Trays, clamshells, thermoformed containers, microwaveable packaging, and food-service packs.', driver:'Clarity, stiffness, food-contact suitability, thermoformability, and recyclability.'},
  {family:'PET Resin', application:'Industrial packaging', endUses:'Detergent bottles, personal-care containers, household chemical bottles, and rigid containers.', driver:'Chemical resistance, toughness, dimensional stability, and low package weight.'},
  {family:'PET Resin', application:'BOPET films', endUses:'Packaging films, laminates, electrical insulation, solar panel back-sheets, and specialty films.', driver:'High tensile strength, dimensional stability, clarity, and thermal/electrical insulation performance.'},
  {family:'PET Resin', application:'Engineering plastics', endUses:'PET blends for automotive parts, electronics housings, appliance components, and molded articles.', driver:'Strength, heat resistance, electrical properties, and compatibility with glass-fiber reinforcement.'},
  {family:'PET Resin', application:'Recycled PET (rPET)', endUses:'Fibers, strapping, sheet, and bottle-to-bottle recycling loops.', driver:'Circular-material use, lower virgin-resin demand, and broad mechanical-recycling infrastructure.'},
  {family:'Polyester Fiber', application:'Textiles and apparel', endUses:'Clothing, sportswear, activewear, fast-fashion fabrics, and blended yarns.', driver:'Durability, wrinkle resistance, dyeability, quick drying, and cost-effective high-volume production.'},
  {family:'Polyester Fiber', application:'Home furnishings', endUses:'Carpets, rugs, upholstery, curtains, bedding, and decorative fabrics.', driver:'Abrasion resistance, color retention, resilience, and easy-care performance.'},
  {family:'Polyester Fiber', application:'Industrial fibers', endUses:'Conveyor belts, ropes, tire cord, geotextiles, and industrial fabrics.', driver:'High tensile strength, fatigue resistance, dimensional stability, and weathering performance.'},
  {family:'Polyester Fiber', application:'Nonwovens', endUses:'Hygiene products, wipes, filtration media, and disposable/technical fabrics.', driver:'Processability into spunbond/meltblown/staple webs, strength, and controlled porosity.'},
  {family:'Polyester Fiber', application:'Fiberfill', endUses:'Pillows, cushions, insulation, stuffed products, comforters, and padding.', driver:'Loft, resilience, softness, low moisture pickup, and washable performance.'},
  {family:'Polyester Fiber', application:'Technical yarns', endUses:'High-tenacity yarns for automotive, safety, industrial sewing, and reinforcement applications.', driver:'High strength-to-weight ratio, controlled elongation, abrasion resistance, and thermal stability.'}
];

function setOverlay(title, desc1, desc2, cond='') {
  const ids = ['selectedTitle','selectedDesc1','selectedDesc2','selectedCond'];
  if (!ids.every(id => document.getElementById(id))) return;
  document.getElementById('selectedTitle').textContent = title;
  document.getElementById('selectedDesc1').textContent = desc1;
  document.getElementById('selectedDesc2').textContent = desc2;
  document.getElementById('selectedCond').textContent = cond;
}
function clearActive(){document.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));}
function populateTables(){
  const unitBody=document.querySelector('#unitSummaryTable tbody');
  const streamBody=document.querySelector('#streamSummaryTable tbody');
  const applicationBody=document.querySelector('#applicationSummaryTable tbody');

  if(unitBody){
    unitBody.innerHTML=Object.values(unitData).map(u=>`<tr><td>${u.title}</td><td>${u.function}</td><td>${u.condition}</td><td>${u.output}</td></tr>`).join('');
  }

  if(streamBody){
    streamBody.innerHTML=Object.values(streamData).map(s=>`<tr><td>${s.title}</td><td>${s.from}</td><td>${s.to}</td><td>${s.purpose}</td></tr>`).join('');
  }

  if(applicationBody){
    applicationBody.innerHTML=applicationData.map(a=>`<tr><td>${a.family}</td><td>${a.application}</td><td>${a.endUses}</td><td>${a.driver}</td></tr>`).join('');
  }
}
function bindDiagramEvents(){
  document.querySelectorAll('.unit-block').forEach(block=>{
    block.addEventListener('click',()=>{const item=unitData[block.dataset.unit]; if(!item)return; clearActive(); block.classList.add('active'); setOverlay(item.title,item.desc1,item.desc2,item.condition);});
  });
  Object.keys(streamData).forEach(id=>{const stream=document.getElementById(id); if(!stream)return; stream.addEventListener('click',()=>{const item=streamData[id]; clearActive(); stream.classList.add('active'); setOverlay(item.title,`${item.from} → ${item.to}`,item.purpose,'Stream condition / purpose shown in table.');});});
}
function bindButtons(){
  const btnAnimate=document.getElementById('btnAnimate'); const btnReset=document.getElementById('btnReset');
  if(btnAnimate){btnAnimate.addEventListener('click',()=>{document.body.classList.toggle('flow-paused'); btnAnimate.textContent=document.body.classList.contains('flow-paused')?'Resume Flow':'Pause Flow';});}
  if(btnReset){btnReset.addEventListener('click',()=>{clearActive(); setOverlay('Click block or stream','Interactive PET/polyester','process flowsheet.','Conditions shown in tables.');});}
}
document.addEventListener('DOMContentLoaded',()=>{populateTables(); bindDiagramEvents(); bindButtons();});
