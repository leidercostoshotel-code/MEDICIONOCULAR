/* PCT · Pestaña MONITOREO: calendario de seguimiento y monitoreo del tratamiento.
   A partir de la fecha de inicio (pestaña TPT) y del esquema arma solo, para cada paciente, las citas del estudio basal y de cada
   mes con los exámenes y evaluaciones que tocan, según la NTS N° 221-MINSA/DGIESP-2024:
   · Tabla N° 13 (pág. 37): esquema sensible TB-DS.        · Tabla N° 15 (págs. 39–40): esquema TB-Hr.
   · Tabla N° 16 (pág. 43): BPaLM / BPaL / BLC / modificado. · Tabla N° 17 (págs. 44–45): BLCC / TB-XDR / modificado.
   Las citas que caen domingo o feriado nacional pasan al siguiente día hábil; se pueden reprogramar y marcar como realizadas. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const p2=n=>String(n).padStart(2,"0");
const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const DIAS_C=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

/* ======================= EXÁMENES Y EVALUACIONES ======================= */
// [nombre, grupo] · grupos: lab = laboratorio, bac = bacteriología, img = imágenes / ECG, eva = evaluaciones y controles
const EX={
  hemo:["Hemograma completo","lab"],gluc:["Glicemia en ayunas","lab"],crea:["Creatinina","lab"],hep:["Perfil hepático","lab"],tgo:["Transaminasas (TGO-TGP)","lab"],
  vih:["Prueba rápida para VIH","lab"],emb:["Prueba de embarazo (mujer en edad fértil)","lab"],
  ps:["Prueba de sensibilidad (PDRm, LPA o cultivo líquido)","bac"],bk:["Baciloscopía de esputo de control","bac"],cult:["Cultivo de esputo","bac"],
  rx:["Radiografía de tórax","img"],tem:["Tomografía de tórax (según criterio del médico consultor)","img"],ecg:["Electrocardiograma","img"],
  enf:["Evaluación por enfermería","eva"],med:["Evaluación por médico cirujano del E.S.","eva"],cons:["Evaluación por médico consultor","eva"],
  ts:["Evaluación por trabajador social","eva"],psi:["Evaluación por psicología","eva"],nut:["Evaluación nutricional","eva"],
  pf:["Control por planificación familiar","eva"],peso:["Control de peso","eva"],esp:["Evaluación por especialidad según comorbilidad o localización de TB","eva"],
  card:["Evaluación por cardiología (si el ECG es anormal)","eva"],av:["Evaluación de agudeza visual y visión de colores","eva"],psiq:["Evaluación por psiquiatría (según criterio del médico consultor)","eva"],
  an_hb:["Dosaje de hemoglobina","lab"],an_fe:["Entrega del hierro del mes y revisión de la toma diaria","eva"],an_adh:["Adherencia y efectos adversos del hierro","eva"],an_nut:["Consejería nutricional (alimentos ricos en hierro)","eva"]}; // an_* = tratamiento de anemia (pestaña ANEMIA)
const GRUPO={lab:"Laboratorio",bac:"Bacteriología",img:"Imágenes y ECG",eva:"Evaluaciones y controles"};
const M="M"; // basal + mensual hasta el final del tratamiento

/* ======================= TABLAS DE MONITOREO (NTS 221-2024) ======================= */
const TABLAS={
  13:{nombre:"Tabla N° 13 · Monitoreo del esquema para TB-DS",pag:"pág. 37",filas:{hemo:[0],gluc:[0],crea:[0],hep:[0,2],vih:[0],emb:[0],rx:[0,2,6],ps:[0],bk:M,cult:[0,2,6],enf:M,med:[0,1,2,6],ts:[0],psi:[0,2,6],nut:[0,2],pf:M,peso:M,esp:[0]},
    notas:["Las evaluaciones del 6.º mes se realizan en el último mes en esquemas de 4 meses, y en los meses 9 y 12 en el esquema de 12 meses.","En TB extrapulmonar y en niños menores de 5 años el seguimiento microbiológico es según criterio clínico."]},
  15:{nombre:"Tabla N° 15 · Monitoreo del esquema para TB-Hr",pag:"págs. 39–40",filas:{hemo:[0],gluc:[0],crea:[0],hep:[0,3,6],vih:[0],emb:[0],rx:[0,3,6],tem:[0,3,6],bk:M,cult:M,enf:M,med:M,cons:[0,3,6],ts:[0],psi:[0,2,4,6],nut:[0,2,6],pf:M,peso:M,esp:[0]},
    notas:["Tomografía según criterio del médico consultor.","En TB extrapulmonar y en niños menores de 5 años el seguimiento microbiológico es según criterio clínico."]},
  16:{nombre:"Tabla N° 16 · Monitoreo de esquemas BPaLM / BPaL / BLC / modificado",pag:"pág. 43",filas:{hemo:[0,1,2,3,6],gluc:[0],crea:[0],tgo:[0,3,6],vih:[0],emb:[0],rx:[0,3,6],tem:[0,3,6],bk:M,cult:M,med:M,cons:M,enf:M,ts:[0],psi:[0,2,4,6],nut:[0,2,6],ecg:[0,1,2,3,6],card:[0],av:[0,1,2,3,4,5,6],pf:M,peso:M},
    ecgSegun:[4],notas:["La evaluación médica del E.S. y del médico consultor incluye el examen para detectar polineuropatía.","Cardiología si el ECG es anormal. Si el esquema se amplía, se repiten las evaluaciones del 6.º mes cada 3 meses."]},
  17:{nombre:"Tabla N° 17 · Monitoreo de esquemas BLCC, parenteral XDR y modificado",pag:"págs. 44–45",filas:{hemo:[0,3,6,9,12,15],gluc:[0],crea:[0],tgo:[0],vih:[0],emb:[0],rx:[0,3,6,9,12,15,18],tem:[0,3,6,12,18],bk:M,cult:M,med:M,cons:M,enf:M,ts:[0],psi:[0,2,4,6,9,12,15,18],nut:[0,2,6,12,18],ecg:[0,1,2,3,6],card:[0],av:[0,1,2,3,4,5,6,9,12,15,18],psiq:[0],pf:M,peso:M},
    ecgSegun:[4],notas:["La evaluación médica incluye el examen de polineuropatía si usa linezolid.","Si usa bedaquilina más de 6 meses, monitoreo cada 3 meses hasta terminar el fármaco. Cardiología si el ECG es anormal."]}};
// esquemas: tabla, meses de tratamiento, «ampliado» = repetir el 6.º mes cada 3 meses (Tabla 16)
const ESQUEMAS={
  ds:{txt:"TB sensible · 2HREZ / 4HR",tabla:13,meses:6},
  hr:{txt:"TB-Hr · 6 (Lfx-R-E-Z)",tabla:15,meses:6},
  bpalm:{txt:"BPaLM / BPaL · 6 meses",tabla:16,meses:6},
  blc:{txt:"BLC · 9 meses (esquema de elección TB-RR/MDR)",tabla:16,meses:9,ampliado:true},
  mod16:{txt:"Esquema modificado · 9 meses (Tabla 16)",tabla:16,meses:9,ampliado:true},
  blcc:{txt:"BLCC · 18 meses",tabla:17,meses:18},
  xdr:{txt:"TB-XDR parenteral · 18 meses",tabla:17,meses:18},
  mod17:{txt:"Esquema modificado · 18 meses (Tabla 17)",tabla:17,meses:18}};
function esqAuto(r){const m=TPT.modoDe(r);if(m==="sens")return "ds";if(m!=="otro")return "";const t=normTxt(r.tto+" "+r.dx+" "+(r.tto_med||""));
  if(t.includes("blcc"))return "blcc";if(t.includes("blc"))return "blc";if(t.includes("bpal"))return "bpalm";if(t.includes("xdr"))return "xdr";if(t.includes("hr")&&!t.includes("mdr"))return "hr";
  if(t.includes("modif"))return "mod16";return "blc";}
function esqDe(r){return ESQUEMAS[r.mon_esq]?r.mon_esq:esqAuto(r);}

/* ======================= FECHAS: domingos y feriados nacionales del Perú ======================= */
function pascua(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mes=Math.floor((h+l-7*m+114)/31),dia=((h+l-7*m+114)%31)+1;return new Date(y,mes-1,dia);}
const FERIADOS={"01-01":"Año Nuevo","05-01":"Día del Trabajo","06-07":"Batalla de Arica","06-29":"San Pedro y San Pablo","07-23":"Día de la Fuerza Aérea","07-28":"Fiestas Patrias","07-29":"Fiestas Patrias","08-06":"Batalla de Junín","08-30":"Santa Rosa de Lima","10-08":"Combate de Angamos","11-01":"Todos los Santos","12-08":"Inmaculada Concepción","12-09":"Batalla de Ayacucho","12-25":"Navidad"};
function feriado(d){const k=p2(d.getMonth()+1)+"-"+p2(d.getDate());if(FERIADOS[k])return FERIADOS[k];const p=pascua(d.getFullYear()),dd=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-p)/864e5);return dd===-3?"Jueves Santo":dd===-2?"Viernes Santo":"";}
function habil(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());let motivo="";while(x.getDay()===0||feriado(x)){motivo=motivo||(x.getDay()===0?"domingo":feriado(x));x.setDate(x.getDate()+1);}return {f:x,motivo};}
function masMeses(d,n){const y=d.getFullYear(),m=d.getMonth()+n,ult=new Date(y,m+1,0).getDate();return new Date(y,m,Math.min(d.getDate(),ult));}
const clave=d=>d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
const iso=clave;
function deIso(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?m[3]+"/"+m[2]+"/"+m[1]:"";}
function hoy0(){const h=new Date();return new Date(h.getFullYear(),h.getMonth(),h.getDate());}
function largo(d){const s=DIAS[d.getDay()];return s.charAt(0).toUpperCase()+s.slice(1)+" "+d.getDate()+" de "+MESES_LARGO[d.getMonth()].toLowerCase()+" de "+d.getFullYear();}

/* ======================= PLAN DE MONITOREO DE UN PACIENTE ======================= */
function plan(r){
  const ini=parseFecha(r.f_ini),id=esqDe(r);if(!ini||!id)return null;
  const E=ESQUEMAS[id],T=TABLAS[E.tabla];let meses=E.meses,col6=[6];
  if(id==="ds"){const s=r.tto_sit||"normal";if(s==="grave"){meses=12;col6=[9,12];}else if(s==="nograve"){meses=4;col6=[4];}}
  if(E.ampliado)col6=[6];for(let m=9;E.ampliado&&m<=meses;m+=3)col6.push(m);
  const sexo=String(r.sexo||"").toUpperCase(),edad=num(edadDe(r)),extra=/extra/i.test(r.dx||"");
  const est=(r.mon&&typeof r.mon==="object")?r.mon:{};const controles=[];
  for(let m=0;m<=meses;m++){
    const items=[];
    for(const [k,cols] of Object.entries(T.filas)){
      let toca=false;
      if(cols===M)toca=true;
      else if(m===0)toca=cols.includes(0);
      else if(cols.includes(6)&&col6.includes(m))toca=true; // evaluaciones del «6.º mes» (o del último mes / cada 3 meses)
      else if(m!==6&&cols.includes(m))toca=true;
      else if(m===6&&cols.includes(6)&&col6.includes(6))toca=true;
      if(!toca)continue;
      if(k==="emb"&&(sexo==="M"||(edad!=null&&(edad<10||edad>55))))continue; // solo mujeres en edad fértil
      if(k==="esp"&&m>0)continue;
      items.push(k);
    }
    const notas=[];if(T.ecgSegun&&T.ecgSegun.includes(m))notas.push("Electrocardiograma: según indicación médica.");
    if(items.includes("bk")&&(extra||(edad!=null&&edad<5)))notas.push("Baciloscopía: en TB extrapulmonar y en niños menores de 5 años, según criterio clínico.");
    if(m===0&&T.filas.esp)notas.push("Evaluación por especialidad: luego, según indicación médica.");
    const base=m===0?new Date(ini):masMeses(ini,m),aj=habil(base),st=est["m"+m]||{};
    const rep=parseFecha(st.f);const fecha=rep||aj.f;const hechos=items.filter(k=>st.ok&&st.ok[k]);
    controles.push({m,cid:"m"+m,nombre:m===0?"Estudio basal":`Control del mes ${m}`,fecha,base,movido:rep?"reprogramada":aj.motivo,hist:Array.isArray(st.hist)?st.hist:[],items,hechos,notas,
      completo:items.length>0&&hechos.length===items.length});
  }
  return {r,id,E,T,meses,ini,controles,fin:masMeses(ini,meses)};
}
function estado(c){const h=hoy0();if(c.completo)return ["ok","Realizado"];const d=c.fecha-h;if(d<0)return ["vencido","Vencido"];if(d===0)return ["hoy","Hoy"];if(d<=7*864e5)return ["prox","Próximo"];return ["prog","Programado"];}
function hitos(r){ // fechas clave sin exámenes: cambio de fase, término de tratamiento o de TPT
  const c=TPT.calcular(r);return TPT.fechas(r,c).filter(([k])=>!/^Dosis/.test(k)).map(([k,v])=>({txt:(c.modo==="tpt"?"TPT · ":"")+k,f:parseFecha(v),r}));}

/* ======================= VISTA ======================= */
$('tabTPT').insertAdjacentHTML('afterend',`<button id="tabMon" onclick="showView('monitoreo')" title="Calendario de seguimiento y monitoreo (NTS 221-2024, Tablas 13, 15, 16 y 17)">MONITOREO</button>`);
$('tpt').insertAdjacentHTML('afterend',`
<div id="monitoreo" class="view">
  <div class="toolbar mon-bar">
    <button class="btn" id="monPrev" title="Mes anterior">‹</button>
    <b class="mon-mes" id="monMes"></b>
    <button class="btn" id="monNext" title="Mes siguiente">›</button>
    <button class="btn" id="monHoy">Hoy</button>
    <label class="lbl">Ver <select id="monVista"><option value="cal">Calendario del mes</option><option value="agenda">Agenda (próximos 30 días)</option></select></label>
    <label class="lbl">Pacientes <select id="monFiltro"><option value="todos">Todos</option><option value="ds">Esquema sensible</option><option value="dr">TB resistente</option><option value="tpt">TPT (contactos)</option></select></label>
    <input type="text" id="monBuscar" placeholder="Buscar paciente…" autocomplete="off">
    <span class="sep"></span>
    <button class="btn" onclick="MON.exportar()">Exportar Excel</button>
    <button class="btn" onclick="MON.imprimir()">🖨 Imprimir</button>
  </div>
  <div class="mon-imp-cab solo-print" id="monImpCab"></div>
  <div class="mon-resumen" id="monResumen"></div>
  <div class="mon-cuerpo">
    <div class="mon-izq"><div id="monCal"></div></div>
    <aside class="mon-der" id="monDia"></aside>
  </div>
</div>
<div class="dlg-fondo mon-modal no-print" id="monModal"><div class="mon-plan" role="dialog" aria-modal="true"><div id="monPlan"></div></div></div>
<div class="dlg-fondo mon-repmodal no-print" id="monRepModal"><div class="mon-rep" role="dialog" aria-modal="true" aria-label="Reprogramar cita"><div id="monRep"></div></div></div>`);
let mesVista=(()=>{const h=new Date();return new Date(h.getFullYear(),h.getMonth(),1);})(),diaSel=hoy0(),planAbierto=null;

/* ======================= DATOS DEL CALENDARIO ======================= */
function filtrar(r){const f=$('monFiltro').value,q=normTxt($('monBuscar').value).trim(),m=TPT.modoDe(r);
  if(q&&!normTxt([r.n,r.dni,r.hc,r.nom].join(" ")).includes(q))return false;
  if(f==="ds")return m==="sens";if(f==="dr")return m==="otro";if(f==="tpt")return m==="tpt";return true;}
function eventos(){ // {clave: [{tipo:'c', p, c} | {tipo:'h', h}]}
  const ev={},add=(d,o)=>{(ev[clave(d)]=ev[clave(d)]||[]).push(o);};
  const addPlan=p=>p.controles.forEach(c=>{add(c.fecha,{tipo:"c",p,c});
      const vistos=new Set([clave(c.fecha)]);c.hist.forEach(x=>{const d=parseFecha(x.de);if(d&&!vistos.has(clave(d))){vistos.add(clave(d));add(d,{tipo:"m",p,c,x});}});}); // «m» = cita que se reprogramó a otro día
  pacientes.filter(filtrar).forEach(r=>{planes(r).forEach(addPlan);hitos(r).forEach(h=>{if(h.f)add(h.f,{tipo:"h",h});});});
  return ev;}

// planes de un paciente: el de TB (plan) y el de anemia (pestaña ANEMIA, cid «a1»…«a6»); comparten las marcas en r.mon
function planes(r){const l=[],p=plan(r);if(p)l.push(p);const a=window.ANE&&ANE.plan(r);if(a)l.push(a);return l;}
function controlDe(r,cid){const p=/^a/.test(cid||"")?(window.ANE&&ANE.plan(r)):plan(r);return p&&p.controles.find(x=>x.cid===cid)||null;}

/* ======================= DIBUJO ======================= */
const nom=r=>`N° ${esc(r.n)} · ${esc(r.nom||"(sin nombre)")}`;
function chipsItems(c,editable){
  const por={};c.items.forEach(k=>{(por[EX[k][1]]=por[EX[k][1]]||[]).push(k);});
  return Object.keys(GRUPO).filter(g=>por[g]).map(g=>`<div class="mon-grupo g-${g}"><span class="mon-gt">${GRUPO[g]}</span>${por[g].map(k=>{const ok=c.hechos.includes(k);
    return editable?`<label class="mon-ex${ok?' ok':''}"><input type="checkbox" data-k="${k}" ${ok?'checked':''}> <span>${esc(EX[k][0])}</span>${ok?'<em class="mon-hecho">✔ Realizado</em>':''}</label>`:`<span class="mon-ex${ok?' ok':''}">${ok?'✔ ':''}${esc(EX[k][0])}</span>`;}).join("")}</div>`).join("")+
    c.notas.map(n=>`<div class="mon-nota">${esc(n)}</div>`).join("");}
function tarjeta(p,c){const [cls,txt]=estado(c),r=p.r;
  return `<div class="mon-card st-${cls}${p.tipo==="ane"?" ane":""}" data-id="${esc(r.id)}" data-cid="${c.cid}">
    <div class="mon-card-cab"><div><b>${nom(r)}</b><small>${esc(p.E.txt)} · ${esc(c.nombre)}${c.m===0?(r.f_ini_ok?' · <span class="conf-t ok">✔ inicio conforme</span>':' · <span class="conf-t pend">'+(c.fecha>hoy0()?'inicio por confirmar':'⚠ inicio sin conformidad')+'</span>'):""}${c.movido?` · <i class="mon-mov">${movTxt(c)}</i>`:""}</small></div><span class="mon-st st-${cls}">${txt}</span></div>
    <div class="mon-items">${chipsItems(c,true)}</div>
    <div class="mon-acc"><button class="btn primary" data-acc="todo">✔ Todo realizado</button>
      ${c.completo?"":`<button class="btn mon-btn-rep" data-acc="repro" title="Cambiar la cita a otro día (falta de tiempo, no acudió, etc.)">↪ Reprogramar</button>`}
      <button class="btn" data-acc="plan">📋 Plan completo</button></div></div>`;}
function cabCal(tit,sub,stats){ // encabezado de color del calendario y de la agenda, con el resumen del periodo
  return `<div class="mon-calcab"><div class="mon-calt"><span class="mon-calico">📅</span><div><h2>${tit}</h2><p>${sub}</p></div></div>
    <div class="mon-calstats">${stats.map(([n,t,c])=>`<span class="${c||""}"><b>${n}</b>${t}</span>`).join("")}</div></div>`;}
function cuentaEv(lst){const pac=new Set();let c=0,ok=0,v=0,hi=0;lst.forEach(e=>{if(e.tipo==="m")return;if(e.tipo==="h"){hi++;return;}c++;pac.add(e.p.r.id);const s=estado(e.c)[0];if(s==="ok")ok++;else if(s==="vencido")v++;});return {c,pac:pac.size,ok,v,hi};}
function pintarCal(ev){
  const y=mesVista.getFullYear(),mo=mesVista.getMonth(),prim=new Date(y,mo,1),offset=(prim.getDay()+6)%7,dias=new Date(y,mo+1,0).getDate(),h=hoy0(),antes=new Date(y,mo,0).getDate();
  const n=cuentaEv([].concat(...Array.from({length:dias},(_,i)=>ev[clave(new Date(y,mo,i+1))]||[])));
  let html=`<div class="mon-calcard">`+cabCal(MESES_LARGO[mo]+" "+y,"Calendario de monitoreo y seguimiento · NTS N° 221-MINSA/DGIESP-2024",
      [[n.c,n.c===1?"cita":"citas"],[n.pac,n.pac===1?"paciente":"pacientes"],[n.ok,"realizadas","ok"],[n.v,"vencidas","venc"],[n.hi,"fechas clave","hito"]])+
    `<div class="mon-semana">${DIAS_C.map((d,i)=>`<div class="${i===6?"dom":""}">${d}</div>`).join("")}</div><div class="mon-grid">`;
  for(let i=0;i<offset;i++)html+=`<div class="mon-d vacio"><div class="mon-dnum"><span class="mon-n">${antes-offset+1+i}</span></div></div>`;
  for(let d=1;d<=dias;d++){const f=new Date(y,mo,d),k=clave(f),l=ev[k]||[],cs=l.filter(e=>e.tipo==="c"),hs=l.filter(e=>e.tipo==="h"),ms=l.filter(e=>e.tipo==="m"),fer=feriado(f);
    const venc=cs.some(e=>estado(e.c)[0]==="vencido");
    html+=`<div class="mon-d${+f===+h?' hoy':''}${+f===+diaSel?' sel':''}${f.getDay()===0?' dom':''}${fer?' fer':''}${venc?' venc':''}" data-dia="${k}" title="${fer?esc(fer):""}">
      <div class="mon-dnum"><span class="mon-n">${d}</span>${cs.length?`<span class="mon-cnt" title="${cs.length} paciente(s) citado(s)">${cs.length}</span>`:""}${fer?`<span class="mon-fer">${esc(fer)}</span>`:""}</div>
      ${cs.slice(0,3).map(e=>`<div class="mon-ev st-${estado(e.c)[0]}${e.p.tipo==="ane"?" ane":""}">${e.c.movido==="reprogramada"?"↪ ":""}${e.p.tipo==="ane"?"🩸 ":""}N° ${esc(e.p.r.n)} · ${e.c.m===0?"Basal":"Mes "+e.c.m}${e.c.completo?" ✔":e.c.hechos.length?` ${e.c.hechos.length}/${e.c.items.length}`:""}</div>`).join("")}
      ${cs.length>3?`<div class="mon-mas">+${cs.length-3} más</div>`:""}
      ${ms.slice(0,2).map(e=>`<div class="mon-ev movida" title="Cita reprogramada al ${fmtFecha(e.c.fecha)}">N° ${esc(e.p.r.n)} ↪ ${p2(e.c.fecha.getDate())}/${p2(e.c.fecha.getMonth()+1)}</div>`).join("")}${ms.length>2?`<div class="mon-mas">+${ms.length-2} reprogramadas</div>`:""}
      ${hs.slice(0,2).map(e=>`<div class="mon-hito">◆ ${esc(e.h.txt)} · N° ${esc(e.h.r.n)}</div>`).join("")}${hs.length>2?`<div class="mon-mas">+${hs.length-2} fechas clave</div>`:""}
    </div>`;}
  const resto=(7-(offset+dias)%7)%7;for(let i=1;i<=resto;i++)html+=`<div class="mon-d vacio"><div class="mon-dnum"><span class="mon-n">${i}</span></div></div>`;
  $('monCal').innerHTML=html+"</div></div>";$('monMes').textContent=MESES_LARGO[mo]+" "+y;}
function chips(c){return `<div class="mon-chips">${c.items.map(k=>{const ok=c.hechos.includes(k);return `<label class="mon-chip${ok?' ok':''}" title="${ok?'Realizado':'Falta · marque cuando se haga'}"><input type="checkbox" data-k="${k}" ${ok?'checked':''}>${esc(EX[k][0])}${ok?' · Realizado':''}</label>`;}).join("")}</div>`;}
function filaAgenda(e,fecha){const c=e.c,r=e.p.r,[cls,txt]=estado(c),falta=c.items.filter(k=>!c.hechos.includes(k));
  return `<div class="mon-arow st-${cls}" data-dia="${clave(c.fecha)}" data-id="${esc(r.id)}" data-cid="${c.cid}">
    <div class="mon-arow-cab">${fecha?`<b>${fmtFecha(c.fecha)}</b> `:""}<b>${nom(r)}</b> · ${esc(c.nombre)} · ${esc(e.p.E.txt)}
      <span class="mon-st st-${cls}">${c.completo?"✔ Realizado":txt+(c.hechos.length?` · ${c.hechos.length}/${c.items.length}`:"")}</span></div>
    ${chips(c)}
    ${c.completo?"":`<small class="mon-falta">Falta: ${falta.map(k=>esc(EX[k][0])).join(" · ")}</small><div class="mon-arow-acc no-print"><button class="btn mon-btn-rep" data-acc="repro">↪ Reprogramar</button></div>`}</div>`;}
function pintarAgenda(ev){const h=hoy0(),fin=new Date(h.getFullYear(),h.getMonth(),h.getDate()+30);let html="",todo=[];
  const venc=Object.values(ev).flatMap(l=>l.filter(e=>e.tipo==="c"&&estado(e.c)[0]==="vencido"));
  if(venc.length)html+=`<h3 class="mon-ah venc"><span>⚠ Vencidos</span><small>${venc.length} control${venc.length>1?"es":""} con exámenes que faltan</small></h3>`+venc.sort((a,b)=>a.c.fecha-b.c.fecha).map(e=>filaAgenda(e,true)).join("");
  for(let i=0;i<=30;i++){const f=new Date(h.getFullYear(),h.getMonth(),h.getDate()+i),l=ev[clave(f)]||[];if(!l.length)continue;todo=todo.concat(l);const nc=l.filter(e=>e.tipo==="c").length,nm=l.filter(e=>e.tipo==="m").length;
    html+=`<h3 class="mon-ah${i===0?' hoy':''}"><span>${largo(f)}${i===0?" · HOY":""}</span><small>${nc?nc+" paciente"+(nc>1?"s":"")+" citado"+(nc>1?"s":""):nm?"citas pasadas a otro día":"fecha clave"}</small></h3>`+l.map(e=>e.tipo==="c"?filaAgenda(e,false):e.tipo==="m"?`<div class="mon-arow movida" data-dia="${clave(e.c.fecha)}">↪ ${nom(e.p.r)} · ${esc(e.c.nombre)}: reprogramada al <b>${largo(e.c.fecha)}</b>${e.x.mot?` · ${esc(e.x.mot)}`:""}</div>`:`<div class="mon-arow hito" data-dia="${clave(f)}">◆ ${esc(e.h.txt)} · ${nom(e.h.r)}</div>`).join("");}
  const n=cuentaEv(todo);
  $('monCal').innerHTML=`<div class="mon-calcard agenda">`+cabCal("Agenda · próximos 30 días",`Del ${fmtFecha(h)} al ${fmtFecha(fin)} · NTS N° 221-MINSA/DGIESP-2024`,
      [[n.c,n.c===1?"cita":"citas"],[n.pac,n.pac===1?"paciente":"pacientes"],[n.ok,"realizadas","ok"],[venc.length,"vencidas","venc"],[n.hi,"fechas clave","hito"]])+
    `<div class="mon-agbody">${html||`<div class="mon-vacio">No hay citas en los próximos 30 días.</div>`}</div></div>`;$('monMes').textContent="Próximos 30 días";}
function pintarDia(ev){const k=clave(diaSel),l=ev[k]||[],cs=l.filter(e=>e.tipo==="c"),hs=l.filter(e=>e.tipo==="h"),ms=l.filter(e=>e.tipo==="m"),fer=feriado(diaSel),pend=cs.filter(e=>!e.c.completo).length;
  $('monDia').innerHTML=`<div class="mon-dcab"><b>${largo(diaSel)}</b><span>${cs.length} paciente(s) citado(s)${fer?" · Feriado: "+esc(fer):""}${diaSel.getDay()===0?" · Domingo":""}</span>
      ${pend?`<button class="btn mon-btn-repdia no-print" data-repdia="1" title="Si no alcanzó el tiempo: pasa a otro día todas las citas de este día que faltan">↪ Reprogramar pendientes del día (${pend})</button>`:""}</div>`+
    (hs.length?`<div class="mon-hitos">${hs.map(e=>`<div>◆ <b>${esc(e.h.txt)}</b> · ${nom(e.h.r)}</div>`).join("")}</div>`:"")+
    (ms.length?`<div class="mon-movidas">${ms.map(e=>`<div>↪ <b>${nom(e.p.r)}</b> · ${esc(e.c.nombre)}: reprogramada al <b>${largo(e.c.fecha)}</b>${e.x.mot?` · ${esc(e.x.mot)}`:""} <button type="button" class="mon-link" data-ver="${clave(e.c.fecha)}">ver</button></div>`).join("")}</div>`:"")+
    (cs.length?cs.map(e=>tarjeta(e.p,e.c)).join(""):`<div class="mon-vacio">No hay controles programados este día.<br><small>Haga clic en un día del calendario para ver sus citas.</small></div>`);}
function pintarResumen(D){ // indicadores = leyenda de colores; cada uno abre su lista detallada
  const b=(k,cls,txt,dot)=>`<button type="button" class="mr ${cls}${lista===k?' activo':''}" data-lista="${k}" title="Ver la lista detallada">${dot?`<i class="st-${dot}"></i>`:""}${txt}: <b>${D[k].length}</b></button>`;
  $('monResumen').innerHTML=b("hoy","hoy","Hoy","hoy")+b("prox","prox","Próximos 7 días","prox")+b("venc","venc","Vencidos","vencido")+b("prog","prog","Programados","prog")+b("ok","ok","Realizados","ok")+(D.repro.length||lista==="repro"?b("repro","repro","Reprogramadas"):"")+b("pac","pac","Pacientes con plan")+
    (D.noconf.length||lista==="noconf"?b("noconf","falta","Inicio sin conformidad"):"")+(D.sin.length||lista==="sin"?b("sin","falta","Sin fecha de inicio"):"")+
    `<span class="mr-ayuda no-print">👆 Haga clic en un indicador para ver la lista detallada</span>`;}

/* ======================= LISTAS DETALLADAS (clic en los indicadores) ======================= */
const LISTAS={
  hoy:{t:"Citas de hoy",ico:"📅",d:"Controles de hoy con exámenes o evaluaciones por realizar.",vacio:"No hay controles pendientes para hoy."},
  prox:{t:"Próximos 7 días",ico:"⏳",d:"Controles de hoy y de los próximos 7 días que aún no se realizan.",vacio:"No hay controles pendientes en los próximos 7 días."},
  venc:{t:"Controles vencidos",ico:"⚠️",d:"La fecha ya pasó y faltan exámenes o evaluaciones: comuníquese con el paciente y reprograme la cita.",vacio:"¡Muy bien! No hay controles vencidos."},
  prog:{t:"Controles programados",ico:"🗓️",d:"Controles a más de 7 días, agendados según la NTS N° 221-2024.",vacio:"No hay controles programados."},
  ok:{t:"Controles realizados",ico:"✅",d:"Controles con todos sus exámenes y evaluaciones marcados como realizados.",vacio:"Todavía no hay controles completos.<br><small>Marque los exámenes en el calendario, la agenda o el plan del paciente.</small>"},
  pac:{t:"Pacientes con plan de monitoreo",ico:"👥",d:"Avance de cada paciente: controles realizados, vencidos y su próxima cita.",vacio:"Ningún paciente tiene plan: ponga la fecha de inicio en la pestaña TPT."},
  noconf:{t:"Inicio sin conformidad",ico:"☑️",d:"La fecha de inicio ya pasó y falta marcar la conformidad del médico.",vacio:"Todos los inicios tienen conformidad. ✔"},
  repro:{t:"Citas reprogramadas",ico:"↪️",d:"Controles pendientes que se pasaron a otro día: fecha anterior, nueva fecha y motivo.",vacio:"No hay citas reprogramadas pendientes."},
  sin:{t:"Sin fecha de inicio",ico:"✏️",d:"Pacientes en tratamiento sin fecha de inicio: escríbala aquí y el plan de monitoreo se arma solo.",vacio:"Todos los pacientes en tratamiento tienen fecha de inicio. ✔"}};
const LISTAS_CTRL=["hoy","prox","venc","prog","ok","repro"];
let lista=null;
function datosListas(){const h=hoy0(),sem=new Date(h);sem.setDate(h.getDate()+7);const D={};Object.keys(LISTAS).forEach(k=>{D[k]=[];});
  pacientes.filter(filtrar).forEach(r=>{const m=TPT.modoDe(r),p=plan(r);
    if(p)D.pac.push({r,p});
    planes(r).forEach(pl=>pl.controles.forEach(c=>{const e={p:pl,c},s=estado(c)[0];
      if(c.movido==="reprogramada"&&!c.completo)D.repro.push(e);
      if(s==="ok")D.ok.push(e);else if(s==="vencido")D.venc.push(e);else{if(s==="hoy")D.hoy.push(e);if(c.fecha<=sem)D.prox.push(e);else D.prog.push(e);}}));
    if(m==="sens"||m==="otro"){const ini=parseFecha(r.f_ini);if(!ini)D.sin.push({r,p});else if(!r.f_ini_ok&&ini<=h)D.noconf.push({r,p});}});
  const porN=(a,b)=>(+a.n||0)-(+b.n||0),porF=(a,b)=>a.c.fecha-b.c.fecha||porN(a.p.r,b.p.r);
  ["hoy","prox","venc","prog","repro"].forEach(k=>D[k].sort(porF));D.ok.sort((a,b)=>porF(b,a)); // realizados: lo más reciente primero
  ["pac","noconf","sin"].forEach(k=>D[k].sort((a,b)=>porN(a.r,b.r)));
  return D;}
const dias=d=>Math.round((d-hoy0())/864e5);
function relTxt(d,venc){const n=dias(d),a=Math.abs(n),u=a===1?"día":"días";if(n===0)return "Hoy";if(n<0)return (venc?"Venció hace ":"Hace ")+a+" "+u;return n===1?"Mañana":"En "+a+" "+u;}
const confTxt=r=>r.f_ini_ok?`<span class="conf-t ok">✔ inicio conforme</span>`:`<span class="conf-t pend">⚠ inicio sin conformidad</span>`;
function meta(r){const e=edadDe(r),sx=String(r.sexo||"").toUpperCase();
  return ["N° "+esc(r.n),r.hc&&"HC "+esc(r.hc),/\d/.test(e)&&esc(e)+" años",sx==="F"?"Femenino":sx==="M"?"Masculino":"",r.peso&&esc(r.peso)+" kg",r.dx&&esc(r.dx)].filter(Boolean).join(" · ");}
const cabDet=(r,est)=>`<div class="mon-li-cab"><div class="mon-li-meta">${meta(r)}</div><div class="mon-li-est">${est}</div></div>`;
const avance=(n,t,txt)=>`<div class="mon-avance"><div class="mon-pbar"><i style="width:${t?Math.round(n*100/t):0}%"></i></div><span>${n} de ${t} ${txt}</span></div>`;
// cada fila muestra solo DNI y nombre; al hacer clic en el nombre se abre su detalle
const abiertos=new Set();
function fila(r,key,cls,detalle){const ab=abiertos.has(key);
  return `<div class="mon-fila st-${cls}${ab?' abierta':''}"><button type="button" class="mon-fnom" data-fila="${esc(key)}" aria-expanded="${ab}" title="${ab?"Ocultar":"Ver"} el detalle">
    <span class="mon-fpunto"></span><span class="mon-fdni">${r.dni?"DNI "+esc(r.dni):"Sin DNI"}</span><b>${esc(r.nom||"(sin nombre)")}</b><span class="mon-fflecha">${ab?"▲":"▼"}</span></button>${ab?detalle():""}</div>`;}
function itemCtrl(e){const c=e.c,p=e.p,r=p.r,[cls,txt]=estado(c),falta=c.items.filter(k=>!c.hechos.includes(k));
  return fila(r,r.id+"|"+c.cid,cls,()=>`<div class="mon-det" data-id="${esc(r.id)}" data-cid="${c.cid}">
    ${cabDet(r,`<span class="mon-st st-${cls}">${c.completo?"✔ Realizado":txt}</span><small>${relTxt(c.fecha,cls==="vencido")}</small>`)}
    <div class="mon-li-ctrl">📌 <b>${esc(c.nombre)}</b>${c.m?` de ${p.meses}`:""} · ${fmtFecha(c.fecha)} (${DIAS[c.fecha.getDay()]}) · ${esc(p.E.txt)} · Inicio ${fmtFecha(p.ini)} ${p.tipo==="ane"?"":confTxt(r)}${c.movido?` · <i class="mon-mov">${movTxt(c)}</i>`:""}</div>
    ${avance(c.hechos.length,c.items.length,"exámenes y evaluaciones realizados")}${chips(c)}
    ${falta.length?`<div class="mon-li-falta"><b>Falta (${falta.length}):</b> ${falta.map(k=>esc(EX[k][0])).join(" · ")}</div>`:""}${c.notas.map(n=>`<div class="mon-nota">${esc(n)}</div>`).join("")}${c.hist.length?histHtml(c):""}
    <div class="mon-acc no-print">${c.completo?"":`<button class="btn primary" data-acc="todo">✔ Todo realizado</button>`}${c.completo?"":`<button class="btn mon-btn-rep" data-acc="repro">↪ Reprogramar</button>`}<button class="btn" data-acc="plan">📋 Plan completo</button><button class="btn" data-acc="ver" data-f="${clave(c.fecha)}">📅 Ver en el calendario</button></div>
  </div>`);}
function itemPac(o){const r=o.r,p=o.p;
  return fila(r,lista+"|"+r.id,lista==="pac"?"pac":"falta",()=>{let est,cuerpo="",acc;
  if(lista==="sin"){est=`<span class="mon-st st-falta">Sin fecha de inicio</span>`;cuerpo=`<div class="mon-li-ctrl">💊 Tratamiento: <b>${esc(r.tto||"—")}</b> · ${TPT.modoDe(r)==="sens"?"se monitoreará con la Tabla N° 13 (TB-DS)":"TB resistente: luego elija el esquema en el plan completo"}</div>`;
    acc=`<label class="lbl mon-li-ini">Fecha de inicio <input type="date" data-acc="ini"></label><button class="btn" data-acc="tpt">Ir a TPT</button>`;}
  else{const C=p?p.controles:[],venc=C.filter(c=>estado(c)[0]==="vencido").length,hech=C.filter(c=>c.completo).length,sig=C.find(c=>!c.completo),sv=sig&&estado(sig)[0]==="vencido";
    est=lista==="noconf"?`<span class="mon-st st-falta">Falta conformidad</span><small>Inicio ${relTxt(parseFecha(r.f_ini)).toLowerCase()}</small>`:venc?`<span class="mon-st st-vencido">${venc} control${venc>1?"es":""} vencido${venc>1?"s":""}</span>`:`<span class="mon-st st-ok">${C.length&&hech===C.length?"✔ Completo":"Al día"}</span>`;
    if(p)cuerpo=`<div class="mon-li-datos"><div><span>Esquema</span><b>${esc(p.E.txt)}</b></div><div><span>Inicio</span><b>${fmtFecha(p.ini)}</b>${confTxt(r)}</div>
      <div><span>Próximo control</span><b>${sig?esc(sig.nombre)+" · "+fmtFecha(sig.fecha):"—"}</b>${sig?`<small class="${sv?"rojo":""}">${relTxt(sig.fecha,sv)}</small>`:""}</div><div><span>Último control</span><b>${C.length?fmtFecha(C[C.length-1].fecha):"—"}</b></div></div>
      ${avance(hech,C.length,"controles realizados")}`;
    acc=(lista==="noconf"?`<label class="mon-li-conf"><input type="checkbox" data-acc="conf"> Marcar inicio conforme</label>`:"")+`<button class="btn" data-acc="plan">📋 Plan completo</button>`+(sig?`<button class="btn" data-acc="ver" data-f="${clave(sig.fecha)}">📅 Ver próximo control</button>`:"");}
  return `<div class="mon-det" data-id="${esc(r.id)}">${cabDet(r,est)}${cuerpo}<div class="mon-acc no-print">${acc}</div></div>`;});}
const claves=arr=>arr.map(e=>e.c?e.p.r.id+"|"+e.c.cid:lista+"|"+e.r.id);
function pintarLista(D){const def=LISTAS[lista],arr=D[lista],ctrl=LISTAS_CTRL.includes(lista),pl=(n,s,p)=>n+" "+(n===1?s:p),todas=arr.length&&claves(arr).every(k=>abiertos.has(k));
  const kpi=ctrl?[[arr.length,arr.length===1?"control":"controles"],[new Set(arr.map(e=>e.p.r.id)).size,"pacientes"],lista==="ok"?[arr.reduce((s,e)=>s+e.c.hechos.length,0),"exámenes realizados"]:[arr.reduce((s,e)=>s+e.c.items.length-e.c.hechos.length,0),"exámenes por realizar"]]:[[arr.length,arr.length===1?"paciente":"pacientes"]];
  const f=$('monFiltro'),q=$('monBuscar').value.trim(),filtro=[f.value!=="todos"?f.options[f.selectedIndex].text:"",q?"búsqueda «"+q+"»":""].filter(Boolean).join(" · ");
  let html=`<section class="mon-lista l-${lista}"><header class="mon-lcab"><div class="mon-ltit"><span class="mon-lico">${def.ico}</span><div><h2>${def.t}</h2><p>${def.d}</p>${filtro?`<p class="mon-lfil">Filtro: ${esc(filtro)}</p>`:""}</div></div>
    <div class="mon-lkpi">${kpi.map(([n,t])=>`<div><b>${n}</b><span>${t}</span></div>`).join("")}</div>
    <div class="mon-lbtn no-print">${arr.length?`<button class="btn" data-l="todos">${todas?"▲ Cerrar todos":"▼ Abrir todos"}</button>`:""}<button class="btn" data-l="xls">📥 Excel</button><button class="btn" data-l="imp">🖨 Imprimir</button><button class="btn" data-l="cerrar">✕ Volver al calendario</button></div></header>`;
  if(!arr.length)html+=`<div class="mon-vacio mon-lvacio">${def.vacio}</div>`;
  else if(ctrl){const cuenta={};arr.forEach(e=>{const k=clave(e.c.fecha);cuenta[k]=(cuenta[k]||0)+1;});let k0="";
    arr.forEach(e=>{const k=clave(e.c.fecha);if(k!==k0){k0=k;html+=`<div class="mon-lfecha"><b>${largo(e.c.fecha)}</b><span>${relTxt(e.c.fecha,lista==="venc")} · ${pl(cuenta[k],"control","controles")}</span></div>`;}html+=itemCtrl(e);});}
  else html+=`<div class="mon-lfecha"><b>${lista==="pac"?"Pacientes":"Pacientes por atender"}</b><span>Haga clic en el nombre para ver el detalle</span></div>`+arr.map(itemPac).join("");
  $('monCal').innerHTML=html+"</section>";$('monMes').textContent=def.t;}
function verDia(k){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(k||"");if(!m)return;diaSel=new Date(+m[1],+m[2]-1,+m[3]);mesVista=new Date(+m[1],+m[2]-1,1);lista=null;$('monVista').value="cal";render();
  if(window.innerWidth<900)$('monDia').scrollIntoView({behavior:"smooth",block:"start"});else window.scrollTo({top:0,behavior:"smooth"});}

function render(){if(!$('monitoreo').classList.contains('active'))return;const ev=eventos(),D=datosListas();
  const tit=lista?"Monitoreo y seguimiento · "+LISTAS[lista].t+" ("+D[lista].length+")":"Calendario de monitoreo y seguimiento · "+($('monVista').value==="agenda"?"Próximos 30 días":MESES_LARGO[mesVista.getMonth()]+" "+mesVista.getFullYear());
  $('monImpCab').innerHTML=`<b>${esc(tit)}</b><span>${esc(config.estab||"")} · Programa de Control de Tuberculosis · NTS N° 221-MINSA/DGIESP-2024 · Impreso el ${fmtFecha(new Date())}</span>`;
  document.querySelector('#monitoreo .mon-cuerpo').classList.toggle('con-lista',!!lista);
  if(lista)pintarLista(D);else if($('monVista').value==="agenda")pintarAgenda(ev);else pintarCal(ev);pintarDia(ev);pintarResumen(D);if(planAbierto)abrirPlan(planAbierto,true);}

/* ======================= PLAN COMPLETO (ventana) ======================= */
function abrirPlan(id,refrescar){const r=pacientes.find(x=>x.id===id);if(!r)return;planAbierto=id;const p=plan(r);
  const opc=Object.entries(ESQUEMAS).filter(([k])=>TPT.modoDe(r)==="sens"?k==="ds":k!=="ds").map(([k,e])=>`<option value="${k}" ${esqDe(r)===k?'selected':''}>${esc(e.txt)}</option>`).join("");
  const cab=`<div class="mon-pcab"><div><h2>Plan de monitoreo y seguimiento</h2><div class="mon-psub">${nom(r)} · DNI ${esc(r.dni||"—")} · HC ${esc(r.hc||"—")} · Edad ${esc(edadDe(r)||"—")} · Peso ${esc(r.peso||"—")} kg · ${esc(r.dx||"")}</div></div>
    <div class="mon-pbtn no-print"><button class="btn" onclick="MON.imprimirPlan()">🖨 Imprimir plan</button><button class="btn" onclick="MON.cerrarPlan()">✕ Cerrar</button></div></div>`;
  if(!p){$('monPlan').innerHTML=cab+`<div class="mon-vacio">${TPT.modoDe(r)==="tpt"?"Los contactos con TPT no tienen tabla de monitoreo en estas páginas de la norma; vea sus fechas en la pestaña TPT.":"Falta la <b>fecha de inicio</b> del tratamiento: póngala en la pestaña TPT."}</div>`;}
  else{const h=hitos(r);
    $('monPlan').innerHTML=cab+`<div class="mon-pinfo">
      <div><span>Esquema</span><b>${TPT.modoDe(r)==="sens"?esc(p.E.txt):`<select id="monEsq" class="no-print-sel">${opc}</select><b class="solo-print">${esc(p.E.txt)}</b>`}</b></div>
      <div class="${r.f_ini_ok?'conf-ok':'conf-pend'}"><span>Inicio</span><b>${fmtFecha(p.ini)}</b><small>${r.f_ini_ok?"✔ Inicio conforme ("+esc(r.f_ini_ok)+")":"⚠ Inicio sin conformidad"}</small><label class="no-print"><input type="checkbox" id="monConf" ${r.f_ini_ok?'checked':''}> Conforme</label></div>${h.map(x=>`<div><span>${esc(x.txt)}</span><b>${x.f?fmtFecha(x.f):"—"}</b></div>`).join("")}
      ${r.tto_med?`<div><span>Medicamentos (médico consultor)</span><b>${esc(r.tto_med)}</b></div>`:""}<div><span>Monitoreo</span><b>${esc(p.T.nombre)} (${p.T.pag})</b></div></div>
      <table class="mon-ptab"><thead><tr><th>Control</th><th>Fecha</th><th>Exámenes y evaluaciones</th><th>Estado</th></tr></thead><tbody>${p.controles.map(c=>{const [cls,txt]=estado(c);
        return `<tr class="st-${cls}" data-id="${esc(r.id)}" data-cid="${c.cid}"><td><b>${esc(c.nombre)}</b></td><td class="mon-pf"><b>${fmtFecha(c.fecha)}</b><br>${DIAS[c.fecha.getDay()]}${c.movido?`<br><i class="mon-mov">${movTxt(c)}</i>`:""}${c.completo?"":`<br><button class="btn no-print mon-btn-rep" data-acc="repro">↪ Reprogramar</button>`}</td>
          <td>${chipsItems(c,true)}</td><td><span class="mon-st st-${cls}">${txt}</span><br><small>${c.hechos.length}/${c.items.length}</small><br><button class="btn no-print" data-acc="todo">✔ Todo</button></td></tr>`;}).join("")}</tbody></table>
      <div class="mon-pnotas">${p.T.notas.map(n=>`<div>• ${esc(n)}</div>`).join("")}<div>• Las citas que caen domingo o feriado pasan al siguiente día hábil. Fuente: NTS N° 221-MINSA/DGIESP-2024.</div></div>`;}
  if(!refrescar)$('monModal').classList.add('abierto');
  const sel=$('monEsq');if(sel)sel.onchange=()=>{r.mon_esq=sel.value;guardar(r);};
  const cf=$('monConf');if(cf)cf.onchange=()=>{r.f_ini_ok=cf.checked?fmtFecha(new Date()):"";guardar(r);msg(`N° ${r.n}: ${r.f_ini_ok?"inicio conforme":"conformidad retirada"}`);};}
function cerrarPlan(){planAbierto=null;$('monModal').classList.remove('abierto');}

/* ======================= ACCIONES (marcar, reprogramar) ======================= */
function ordenar(o){if(!o||typeof o!=="object"||Array.isArray(o))return o;const x={};Object.keys(o).sort().forEach(k=>{x[k]=ordenar(o[k]);});return x;}
function guardar(r){r.mon=ordenar(r.mon&&typeof r.mon==="object"?r.mon:{});guardarPacientes();render();if(window.TPT)TPT.render();}
function accion(e){const t=e.target,cont=t.closest('[data-id]');if(!cont)return;const r=pacientes.find(x=>x.id===cont.dataset.id);if(!r)return;const acc=t.dataset.acc,clic=e.type==="click",cambio=e.type==="change";
  if(acc==="plan"&&clic){if(/^a/.test(cont.dataset.cid||""))showView('anemia');else abrirPlan(r.id);return;}
  if(acc==="ver"&&clic){verDia(t.dataset.f);return;}
  if(acc==="tpt"&&clic){showView('tpt');return;}
  if(acc==="conf"&&cambio){r.f_ini_ok=t.checked?fmtFecha(new Date()):"";guardar(r);msg(`N° ${r.n}: ${r.f_ini_ok?"inicio conforme":"conformidad retirada"}`);return;}
  if(acc==="ini"&&cambio){const f=deIso(t.value);if(!f)return;r.f_ini=f;guardar(r);msg(`N° ${r.n}: inicio ${f} · plan de monitoreo armado`);return;}
  if(!cont.dataset.cid)return;
  r.mon=(r.mon&&typeof r.mon==="object")?r.mon:{};const st=r.mon[cont.dataset.cid]=r.mon[cont.dataset.cid]||{};st.ok=st.ok||{};
  if(t.matches('input[type=checkbox][data-k]')){if(!cambio)return;if(t.checked)st.ok[t.dataset.k]=1;else delete st.ok[t.dataset.k];guardar(r);return;}
  if(acc==="todo"&&clic){const c=controlDe(r,cont.dataset.cid);if(c)c.items.forEach(k=>{st.ok[k]=1;});guardar(r);msg(`N° ${r.n}: ${c?c.nombre.toLowerCase():"control"} realizado`);}
  else if(acc==="repro"&&clic)abrirRepro([{id:r.id,cid:cont.dataset.cid}]);}
['click','change'].forEach(tp=>{$('monDia').addEventListener(tp,accion);$('monPlan').addEventListener(tp,accion);$('monCal').addEventListener(tp,accion);});
$('monResumen').addEventListener('click',e=>{const b=e.target.closest('[data-lista]');if(!b)return;lista=lista===b.dataset.lista?null:b.dataset.lista;render();});
$('monCal').addEventListener('click',e=>{const fl=e.target.closest('[data-fila]');if(fl){const k=fl.dataset.fila;if(abiertos.has(k))abiertos.delete(k);else abiertos.add(k);render();return;}
  const b=e.target.closest('[data-l]');if(!b)return;const a=b.dataset.l;
  if(a==="cerrar"){lista=null;render();}else if(a==="xls")exportarLista();else if(a==="imp")imprimir();
  else if(a==="todos"){const ks=claves(datosListas()[lista]),todas=ks.every(k=>abiertos.has(k));ks.forEach(k=>{if(todas)abiertos.delete(k);else abiertos.add(k);});render();}});
$('monCal').addEventListener('click',e=>{if(e.target.closest('.mon-chip,[data-acc]'))return;const d=e.target.closest('[data-dia]');if(!d)return;const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d.dataset.dia);diaSel=new Date(+m[1],+m[2]-1,+m[3]);render();
  if(window.innerWidth<900)$('monDia').scrollIntoView({behavior:"smooth",block:"start"});});
$('monPrev').onclick=()=>{mesVista=new Date(mesVista.getFullYear(),mesVista.getMonth()-1,1);lista=null;$('monVista').value="cal";render();};
$('monNext').onclick=()=>{mesVista=new Date(mesVista.getFullYear(),mesVista.getMonth()+1,1);lista=null;$('monVista').value="cal";render();};
$('monHoy').onclick=()=>{const h=hoy0();diaSel=h;mesVista=new Date(h.getFullYear(),h.getMonth(),1);lista=null;render();};
$('monVista').addEventListener('change',()=>{lista=null;render();});$('monFiltro').addEventListener('change',render);$('monBuscar').addEventListener('input',render);
$('monModal').addEventListener('mousedown',e=>{if(e.target===$('monModal'))cerrarPlan();});
document.addEventListener('keydown',e=>{if(e.key!=="Escape")return;if($('monRepModal').classList.contains('abierto'))cerrarRepro();else if($('monModal').classList.contains('abierto'))cerrarPlan();});

/* ======================= REPROGRAMAR CITAS (una o todas las pendientes del día) ======================= */
// st.f = fecha nueva · st.hist = [{de, a, mot, obs, reg}] (cada cambio queda registrado; los exámenes ya hechos se conservan)
const MOTIVOS=["Falta de tiempo en la atención","Paciente no acudió","Paciente pidió otra fecha","Falta de insumos o de resultados de laboratorio","Personal no disponible","Otro"];
function movTxt(c){const u=c.hist[c.hist.length-1];return c.movido==="reprogramada"?`↪ reprogramada${u?` (antes ${esc(u.de)}${u.mot?" · "+esc(u.mot):""})`:""}`:"pasó del "+esc(c.movido);}
function obsFecha(c){const u=c.hist[c.hist.length-1];if(c.movido==="reprogramada"&&u)return `Reprogramada del ${u.de} al ${u.a}${u.mot?" · "+u.mot:""}${u.obs?" ("+u.obs+")":""}`;return c.movido?(c.movido==="reprogramada"?"Reprogramada":"Pasó del "+c.movido):"";}
function histHtml(c){return `<ul class="mon-hist">${c.hist.slice().reverse().map(x=>`<li><b>${esc(x.de)} → ${esc(x.a)}</b>${x.mot?" · "+esc(x.mot):""}${x.obs?` · <i>${esc(x.obs)}</i>`:""}<small>Registrado el ${esc(x.reg||"")}</small></li>`).join("")}</ul>`;}
let repSel=[];
function objetivos(){return repSel.map(o=>{const r=pacientes.find(x=>x.id===o.id);if(!r)return null;const p=/^a/.test(o.cid)?(window.ANE&&ANE.plan(r)):plan(r),c=p&&p.controles.find(x=>x.cid===o.cid);return c?{r,p,c}:null;}).filter(Boolean);}
const sigHabil=(d,n)=>habil(new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)).f;
function abrirRepro(lst){repSel=lst;const T=objetivos();if(!T.length)return;pintarRepro(T);$('monRepModal').classList.add('abierto');
  setTimeout(()=>{const b=$('monRep').querySelector('.mon-rap.sel');if(b)b.focus();},50);}
function cerrarRepro(){repSel=[];$('monRepModal').classList.remove('abierto');}
function pintarRepro(T){const h=hoy0(),uno=T.length===1,c0=T[0].c,dia1=sigHabil(h,1);
  const rap=[["Siguiente día hábil",dia1],["En 2 días hábiles",sigHabil(dia1,1)],["En 1 semana",sigHabil(h,7)],["En 2 semanas",sigHabil(h,14)]];
  $('monRep').innerHTML=`<div class="mon-rep-cab"><div><h3>↪ ${uno?"Reprogramar cita":`Reprogramar ${T.length} citas pendientes`}</h3><p>${uno?"La cita pasa a la nueva fecha; los exámenes ya realizados se conservan.":"Citas del "+largo(c0.fecha).toLowerCase()+" que aún tienen exámenes por realizar."}</p></div><button type="button" class="mon-x" data-r="cerrar" title="Cerrar (Esc)">✕</button></div>
    <div class="mon-rep-pacs">${T.map(({r,c})=>`<div class="mon-rep-pac"><b>${nom(r)}</b><small>DNI ${esc(r.dni||"—")} · ${esc(c.nombre)} · cita del ${DIAS[c.fecha.getDay()]} ${fmtFecha(c.fecha)} · ${c.items.length-c.hechos.length} de ${c.items.length} por realizar</small></div>`).join("")}</div>
    <div class="mon-rep-sec"><label>Nueva fecha</label><div class="mon-raps">${rap.map(([t,d])=>`<button type="button" class="mon-rap" data-f="${iso(d)}"><b>${t}</b><span>${DIAS[d.getDay()]} ${fmtFecha(d)}</span></button>`).join("")}</div>
      <div class="mon-rep-otra"><span>u otra fecha:</span><input type="date" id="repFecha" value="${iso(dia1)}" min="${iso(h)}"></div><div id="repAviso" class="mon-rep-aviso"></div></div>
    <div class="mon-rep-sec"><label for="repMot">Motivo</label><select id="repMot">${MOTIVOS.map(m=>`<option>${m}</option>`).join("")}</select><input type="text" id="repObs" placeholder="Observación (opcional)" maxlength="120" autocomplete="off"></div>
    ${uno&&c0.hist.length?`<div class="mon-rep-sec"><label>Historial de esta cita</label>${histHtml(c0)}</div>`:""}
    <div class="mon-rep-pie">${uno&&c0.movido==="reprogramada"?`<button type="button" class="btn" data-r="original" title="Quita la reprogramación">↺ Volver a la fecha de la norma (${fmtFecha(habil(c0.base).f)})</button>`:""}<span class="sep"></span><button type="button" class="btn" data-r="cerrar">Cancelar</button><button type="button" class="btn primary" data-r="ok" id="repOk">✔ Reprogramar</button></div>`;
  validarRepro();}
function validarRepro(){const v=$('repFecha').value,d=v?parseFecha(deIso(v)):null,T=objetivos(),h=hoy0();let av="",ok=!!d,bien=false;
  $('monRep').querySelectorAll('.mon-rap').forEach(b=>b.classList.toggle('sel',b.dataset.f===v));
  if(!d)av="Elija la nueva fecha.";
  else if(d<h){av=`⚠ El ${fmtFecha(d)} ya pasó: elija hoy o una fecha futura.`;ok=false;}
  else if(T.length===1&&+d===+T[0].c.fecha){av="Es la misma fecha de la cita.";ok=false;}
  else{const fer=feriado(d),n=(eventos()[clave(d)]||[]).filter(e=>e.tipo==="c").length;
    if(d.getDay()===0||fer){const s=habil(d).f;av=`⚠ El ${DIAS[d.getDay()]} ${fmtFecha(d)} no es día hábil${fer?" ("+esc(fer)+")":""}. <button type="button" class="mon-link" data-f="${iso(s)}">Usar el ${DIAS[s.getDay()]} ${fmtFecha(s)}</button>`;}
    else{bien=true;av=`✔ ${largo(d)} · ${n?n+" paciente"+(n>1?"s":"")+" ya citado"+(n>1?"s":"")+" ese día":"sin otras citas ese día"}`;}}
  $('repAviso').innerHTML=av;$('repAviso').className="mon-rep-aviso"+(bien?" ok":"");$('repOk').disabled=!ok;}
function guardarRepro(original){const T=objetivos();if(!T.length)return;const ahora=new Date(),reg=fmtFecha(ahora)+" "+p2(ahora.getHours())+":"+p2(ahora.getMinutes());
  const mot=original?"Vuelve a la fecha de la norma":$('repMot').value,obs=$('repObs').value.trim();let nueva="";
  if(!original){nueva=deIso($('repFecha').value);if(!nueva)return;}
  T.forEach(({r,c})=>{const a=original?fmtFecha(habil(c.base).f):nueva;if(a===fmtFecha(c.fecha))return;
    r.mon=(r.mon&&typeof r.mon==="object")?r.mon:{};const st=r.mon[c.cid]=r.mon[c.cid]||{};
    st.hist=(Array.isArray(st.hist)?st.hist:[]).concat([{de:fmtFecha(c.fecha),a,mot,obs,reg}]);if(original)delete st.f;else st.f=a;r.mon=ordenar(r.mon);});
  cerrarRepro();guardarPacientes();render();if(window.TPT)TPT.render();
  msg(T.length===1?`N° ${T[0].r.n}: cita ${original?"devuelta al "+fmtFecha(habil(T[0].c.base).f):"reprogramada al "+DIAS[parseFecha(nueva).getDay()]+" "+nueva}`:`${T.length} citas reprogramadas al ${DIAS[parseFecha(nueva).getDay()]} ${nueva}`);}
$('monRep').addEventListener('click',e=>{const b=e.target.closest('[data-r],[data-f]');if(!b)return;
  if(b.dataset.f){$('repFecha').value=b.dataset.f;validarRepro();return;}
  if(b.dataset.r==="cerrar")cerrarRepro();else if(b.dataset.r==="ok"&&!$('repOk').disabled)guardarRepro(false);else if(b.dataset.r==="original")guardarRepro(true);});
$('monRep').addEventListener('input',e=>{if(e.target.id==="repFecha")validarRepro();});
$('monRepModal').addEventListener('mousedown',e=>{if(e.target===$('monRepModal'))cerrarRepro();});
$('monDia').addEventListener('click',e=>{const v=e.target.closest('[data-ver]');if(v){verDia(v.dataset.ver);return;}
  if(e.target.closest('[data-repdia]')){const l=(eventos()[clave(diaSel)]||[]).filter(x=>x.tipo==="c"&&!x.c.completo);abrirRepro(l.map(x=>({id:x.p.r.id,cid:x.c.cid})));}});

/* ======================= EXCEL E IMPRESIÓN ======================= */
function exportar(){if(typeof XLSX==="undefined"){msg("No se pudo cargar la librería de Excel (sin conexión)");return;}
  const cab=["Fecha","Día","N° Reg","Apellidos y Nombres","DNI","Inicio conforme","Esquema","Tabla NTS","Control","Exámenes y evaluaciones","Realizados","Estado","Observación de fecha"];
  const filas=[];pacientes.filter(filtrar).forEach(r=>planes(r).forEach(p=>{p.controles.forEach(c=>filas.push([c.fecha,fmtFecha(c.fecha),DIAS[c.fecha.getDay()],r.n,r.nom,r.dni,p.tipo==="ane"?"":(r.f_ini_ok?"Sí ("+r.f_ini_ok+")":"Pendiente"),p.E.txt,p.T.nombre,c.nombre,c.items.map(k=>EX[k][0]).join(" | "),c.hechos.length+"/"+c.items.length,estado(c)[1],obsFecha(c)]));}));
  filas.sort((a,b)=>a[0]-b[0]);const ws=XLSX.utils.aoa_to_sheet([cab].concat(filas.map(f=>f.slice(1))));ws['!cols']=[11,10,7,34,11,16,30,40,18,90,10,11,22].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Monitoreo");XLSX.writeFile(wb,"Monitoreo_PCT.xlsx");msg("Excel exportado");}
function exportarLista(){if(typeof XLSX==="undefined"){msg("No se pudo cargar la librería de Excel (sin conexión)");return;}if(!lista)return;
  const D=datosListas(),arr=D[lista],def=LISTAS[lista],si=r=>r.f_ini_ok?"Sí ("+r.f_ini_ok+")":(r.f_ini?"Pendiente":"");let filas;
  if(LISTAS_CTRL.includes(lista))filas=[["Fecha","Día","Situación","N° Reg","Apellidos y Nombres","DNI","HC","Edad","Sexo","Esquema","Control","Estado","Realizados","Exámenes realizados","Exámenes que faltan","Inicio conforme","Observación de fecha"]].concat(arr.map(({p,c})=>{const r=p.r;
    return [fmtFecha(c.fecha),DIAS[c.fecha.getDay()],relTxt(c.fecha,estado(c)[0]==="vencido"),r.n,r.nom,r.dni,r.hc,edadDe(r),r.sexo,p.E.txt,c.nombre,estado(c)[1],c.hechos.length+"/"+c.items.length,c.hechos.map(k=>EX[k][0]).join(" | "),c.items.filter(k=>!c.hechos.includes(k)).map(k=>EX[k][0]).join(" | "),si(r),obsFecha(c)];}));
  else filas=[["N° Reg","Apellidos y Nombres","DNI","HC","Edad","Sexo","Diagnóstico","Tratamiento","Esquema","Inicio","Inicio conforme","Controles realizados","Controles vencidos","Próximo control","Fecha del próximo control"]].concat(arr.map(({r,p})=>{const C=p?p.controles:[],sig=C.find(c=>!c.completo);
    return [r.n,r.nom,r.dni,r.hc,edadDe(r),r.sexo,r.dx,r.tto,p?p.E.txt:"",r.f_ini,si(r),p?C.filter(c=>c.completo).length+"/"+C.length:"",p?C.filter(c=>estado(c)[0]==="vencido").length:"",sig?sig.nombre:"",sig?fmtFecha(sig.fecha):""];}));
  const ws=XLSX.utils.aoa_to_sheet(filas);ws['!cols']=filas[0].map(h=>({wch:/Exámenes|Nombres|Esquema|Diagnóstico|Tratamiento/.test(h)?40:14}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,def.t.slice(0,31));XLSX.writeFile(wb,"Monitoreo_"+def.t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"_")+".xlsx");msg("Excel exportado: "+def.t);}
function imprimir(){document.body.classList.remove('imp-plan');window.print();}
function imprimirPlan(){document.body.classList.add('imp-plan');window.print();setTimeout(()=>document.body.classList.remove('imp-plan'),500);}

/* ======================= ENLACES CON EL RESTO DE LA APP ======================= */
const showBase=window.showView;
window.showView=function(v){showBase(v);$('tabMon').classList.toggle('active',v==='monitoreo');document.body.classList.toggle('ver-mon',v==='monitoreo');if(v==='monitoreo')render();};
const alCambiarBase=window.alCambiarPacientes;
window.alCambiarPacientes=function(){if(alCambiarBase)alCambiarBase();const a=document.activeElement;if(!(a&&a.closest&&a.closest('#monitoreo,#monPlan')))render();};
window.MON={plan,abrirPlan:id=>{showView('monitoreo');abrirPlan(id);},cerrarPlan,exportar,exportarLista,imprimir,imprimirPlan,render,feriado,abrirRepro,cerrarRepro,habil,masMeses,estado,hoy0,irDia:k=>{showView('monitoreo');verDia(k);},
  verLista:k=>{lista=LISTAS[k]?k:null;showView('monitoreo');}};
})();
