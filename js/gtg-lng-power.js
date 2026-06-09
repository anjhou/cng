"use strict";
const unitData={
 fgs:{title:"F-101 — Fuel Supply & Conditioning",desc1:"Dry, filtered natural gas is pressure-controlled and superheated so no liquid enters the turbine fuel skid.",function:"Provides clean, stable, liquid-free fuel gas to the combustors.",conditions:"Fuel gas pressure per turbine skid requirement; superheat margin above hydrocarbon/water dew point; filtered dry gas from LNG feed/fuel system.",equipment:"KO drum, filters/coalescers, pressure-control valve, fuel gas heater/superheater, shutdown valves"},
 air:{title:"Combustion Air Intake",desc1:"Ambient air is filtered, silenced, and optionally chilled before the turbine axial compressor.",function:"Supplies clean combustion air and protects compressor blades.",conditions:"Ambient inlet; pressure drop minimized across filters/silencer; optional inlet chilling for hot climates.",equipment:"Weather hood, inlet filters, silencer, anti-icing/inlet chilling package"},
 aux:{title:"Auxiliaries",desc1:"Lube oil, starting, controls, fuel heating, fire/gas and protection systems support reliable GTG operation.",function:"Supports start-up, trip protection, lubrication, controls, and plant load-following.",conditions:"Package-specific oil temperature/pressure; starter duty during start-up; controls integrated with plant DCS/ESD.",equipment:"Lube-oil console, starter motor/turbine, control system, seal/vent systems, battery/UPS interface"},
 gtg:{title:"GTG-201 — Gas Turbine Generator Train",desc1:"A heavy-duty or aeroderivative turbine drives an electrical generator for a 1 MTPA LNG train.",function:"Converts conditioned fuel gas into shaft power and electrical generation.",conditions:"Typical gross output 30–60 MW for 1 MTPA LNG service; exact value depends on liquefaction technology, ambient conditions, and driver selection.",equipment:"Axial compressor, combustors, turbine stages, reduction gear if required, generator, excitation system"},
 hrsg:{title:"HRSG-301 — Optional Heat Recovery Steam Generator",desc1:"Turbine exhaust generates steam for process heating, regeneration, or power augmentation.",function:"Recovers exhaust heat and improves plant thermal efficiency.",conditions:"Exhaust heat recovery service; steam pressure level selected for LNG plant users such as regeneration or utility steam.",equipment:"Economizer, evaporator, superheater, steam drum, stack, duct burner if required"},
 swgr:{title:"SWGR-401 / MCC-402 — Electrical Distribution",desc1:"Generated power is stepped up and distributed to refrigeration motors, utilities, and balance-of-plant loads.",function:"Controls, protects, transforms, and distributes GTG electrical power.",conditions:"Medium/high-voltage switchgear; transformer step-up/down as required; protection, synchronization, and load-shedding logic.",equipment:"Generator breaker, transformers, MV switchgear, LV MCCs, protection relays, synchronization panel"},
 loads:{title:"LNG Train Electrical Loads",desc1:"Power feeds refrigeration compressor motors, BOG compression, pumps, air coolers, utilities, and offsites.",function:"Consumes generated electrical power for liquefaction and support systems.",conditions:"Major load blocks depend on LNG process selection; plant load-following and load-shedding required for reliability.",equipment:"Compressor motors, BOG compressors, pumps, cooling systems, air/instrument systems, utility drives"}
};
const streamData={
 s1:{title:"Dry Fuel Gas",from:"LNG plant fuel/feed system",to:"F-101",purpose:"Filtered dry natural gas enters fuel conditioning."},
 s2:{title:"Conditioned Fuel",from:"F-101",to:"GTG-201 combustors",purpose:"Pressure-controlled, heated fuel gas feeds the turbine combustors."},
 s3:{title:"Combustion Air",from:"Air intake",to:"GTG-201 axial compressor",purpose:"Filtered air is compressed and mixed with fuel for combustion."},
 s4:{title:"Electrical Power",from:"GTG-201 generator",to:"SWGR-401 / MCC-402",purpose:"Generated electrical power is routed to distribution."},
 s5:{title:"Hot Turbine Exhaust",from:"GTG-201",to:"HRSG-301",purpose:"Exhaust heat is recovered to make useful steam when HRSG is installed."},
 s6:{title:"HP / Utility Steam",from:"HRSG-301",to:"Steam users / export header",purpose:"Steam supports regeneration, process heating, or power augmentation."},
 s7:{title:"Distribution Feeders",from:"SWGR-401 / MCC-402",to:"LNG train loads",purpose:"Switchgear and MCCs distribute power to process and utility consumers."},
 s8:{title:"Auxiliary Services",from:"Auxiliary systems",to:"GTG-201",purpose:"Lube oil, starting, controls, and fuel heating support turbine operation."},
 s9:{title:"LNG Train Load Feed",from:"Electrical load center",to:"Refrigeration/utilities/BOP",purpose:"Power is consumed by LNG train motors and utility systems."},
 s10:{title:"Stack Exhaust",from:"HRSG-301",to:"Atmosphere / stack",purpose:"Cooled exhaust leaves after heat recovery or bypasses HRSG if not installed."}
};
function setOverlay(t,d){document.getElementById("selectedTitle").textContent=t;document.getElementById("selectedDesc1").textContent=d}
function clearActive(){document.querySelectorAll(".active").forEach(e=>e.classList.remove("active"))}
function populateTables(){
 const ub=document.querySelector("#unitSummaryTable tbody"), sb=document.querySelector("#streamSummaryTable tbody");
 if(ub)ub.innerHTML=Object.values(unitData).map(u=>`<tr><td>${u.title}</td><td>${u.function}</td><td>${u.conditions}</td><td>${u.equipment}</td></tr>`).join("");
 if(sb)sb.innerHTML=Object.values(streamData).map(s=>`<tr><td>${s.title}</td><td>${s.from}</td><td>${s.to}</td><td>${s.purpose}</td></tr>`).join("");
}
function bindDiagramEvents(){
 document.querySelectorAll(".unit-block").forEach(b=>b.addEventListener("click",()=>{const item=unitData[b.dataset.unit];if(!item)return;clearActive();b.classList.add("active");setOverlay(item.title,item.desc1)}));
 Object.keys(streamData).forEach(id=>{const el=document.getElementById(id); if(!el)return; el.addEventListener("click",()=>{const s=streamData[id];clearActive();el.classList.add("active");setOverlay(s.title,`${s.from} → ${s.to}. ${s.purpose}`)})});
}
function bindButtons(){
 const a=document.getElementById("btnAnimate"), r=document.getElementById("btnReset");
 if(a)a.addEventListener("click",()=>{document.body.classList.toggle("flow-paused");a.textContent=document.body.classList.contains("flow-paused")?"Resume Flow":"Pause Flow"});
 if(r)r.addEventListener("click",()=>{clearActive();setOverlay("Click any block or stream","The diagram highlights the selected gas turbine power-system section.")});
}
document.addEventListener("DOMContentLoaded",()=>{populateTables();bindDiagramEvents();bindButtons()});
