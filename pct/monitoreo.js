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
  card:["Evaluación por cardiología (si el ECG es anormal)","eva"],av:["Evaluación de agudeza visual y visión de colores","eva"],psiq:["Evaluación por psiquiatría (según criterio del médico consultor)","eva"]};
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
function esqAuto(r){const m=TPT.modoDe(r);if(m==="sens")return "ds";if(m!=="otro")return "";const t=normTxt(r.tto+" "+r.dx);
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
    controles.push({m,cid:"m"+m,nombre:m===0?"Estudio basal":`Control del mes ${m}`,fecha,base,movido:rep?"reprogramada":aj.motivo,items,hechos,notas,
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
<div class="dlg-fondo mon-modal no-print" id="monModal"><div class="mon-plan" role="dialog" aria-modal="true"><div id="monPlan"></div></div></div>`);
let mesVista=(()=>{const h=new Date();return new Date(h.getFullYear(),h.getMonth(),1);})(),diaSel=hoy0(),planAbierto=null;

/* ======================= DATOS DEL CALENDARIO ======================= */
function filtrar(r){const f=$('monFiltro').value,q=normTxt($('monBuscar').value).trim(),m=TPT.modoDe(r);
  if(q&&!normTxt([r.n,r.dni,r.hc,r.nom].join(" ")).includes(q))return false;
  if(f==="ds")return m==="sens";if(f==="dr")return m==="otro";if(f==="tpt")return m==="tpt";return true;}
function eventos(){ // {clave: [{tipo:'c', p, c} | {tipo:'h', h}]}
  const ev={},add=(d,o)=>{(ev[clave(d)]=ev[clave(d)]||[]).push(o);};
  pacientes.filter(filtrar).forEach(r=>{const p=plan(r);if(p)p.controles.forEach(c=>add(c.fecha,{tipo:"c",p,c}));hitos(r).forEach(h=>{if(h.f)add(h.f,{tipo:"h",h});});});
  return ev;}
function sinInicio(){return pacientes.filter(r=>{const m=TPT.modoDe(r);return (m==="sens"||m==="otro")&&!parseFecha(r.f_ini);});}

/* ======================= DIBUJO ======================= */
const nom=r=>`N° ${esc(r.n)} · ${esc(r.nom||"(sin nombre)")}`;
function chipsItems(c,editable){
  const por={};c.items.forEach(k=>{(por[EX[k][1]]=por[EX[k][1]]||[]).push(k);});
  return Object.keys(GRUPO).filter(g=>por[g]).map(g=>`<div class="mon-grupo g-${g}"><span class="mon-gt">${GRUPO[g]}</span>${por[g].map(k=>{const ok=c.hechos.includes(k);
    return editable?`<label class="mon-ex${ok?' ok':''}"><input type="checkbox" data-k="${k}" ${ok?'checked':''}> <span>${esc(EX[k][0])}</span>${ok?'<em class="mon-hecho">✔ Realizado</em>':''}</label>`:`<span class="mon-ex${ok?' ok':''}">${ok?'✔ ':''}${esc(EX[k][0])}</span>`;}).join("")}</div>`).join("")+
    c.notas.map(n=>`<div class="mon-nota">${esc(n)}</div>`).join("");}
function tarjeta(p,c){const [cls,txt]=estado(c),r=p.r;
  return `<div class="mon-card st-${cls}" data-id="${esc(r.id)}" data-cid="${c.cid}">
    <div class="mon-card-cab"><div><b>${nom(r)}</b><small>${esc(p.E.txt)} · ${esc(c.nombre)}${c.m===0?(r.f_ini_ok?' · <span class="conf-t ok">✔ inicio conforme</span>':' · <span class="conf-t pend">'+(c.fecha>hoy0()?'inicio por confirmar':'⚠ inicio sin conformidad')+'</span>'):""}${c.movido?` · <i>${c.movido==="reprogramada"?"reprogramada":"pasó del "+esc(c.movido)}</i>`:""}</small></div><span class="mon-st st-${cls}">${txt}</span></div>
    <div class="mon-items">${chipsItems(c,true)}</div>
    <div class="mon-acc"><button class="btn primary" data-acc="todo">✔ Todo realizado</button>
      <label class="lbl">Reprogramar <input type="date" data-acc="rep" value="${iso(c.fecha)}"></label>
      <button class="btn" data-acc="plan">📋 Plan completo</button></div></div>`;}
function pintarCal(ev){
  const y=mesVista.getFullYear(),mo=mesVista.getMonth(),prim=new Date(y,mo,1),offset=(prim.getDay()+6)%7,dias=new Date(y,mo+1,0).getDate(),h=hoy0();
  let html=`<div class="mon-grid">${DIAS_C.map(d=>`<div class="mon-dn">${d}</div>`).join("")}`;
  for(let i=0;i<offset;i++)html+=`<div class="mon-d vacio"></div>`;
  for(let d=1;d<=dias;d++){const f=new Date(y,mo,d),k=clave(f),l=ev[k]||[],cs=l.filter(e=>e.tipo==="c"),hs=l.filter(e=>e.tipo==="h"),fer=feriado(f);
    const venc=cs.some(e=>estado(e.c)[0]==="vencido");
    html+=`<div class="mon-d${+f===+h?' hoy':''}${+f===+diaSel?' sel':''}${f.getDay()===0?' dom':''}${fer?' fer':''}${venc?' venc':''}" data-dia="${k}" title="${fer?esc(fer):""}">
      <div class="mon-dnum">${d}${fer?`<span class="mon-fer">${esc(fer)}</span>`:""}</div>
      ${cs.slice(0,3).map(e=>`<div class="mon-ev st-${estado(e.c)[0]}">N° ${esc(e.p.r.n)} · ${e.c.m===0?"Basal":"Mes "+e.c.m}${e.c.completo?" ✔":e.c.hechos.length?` ${e.c.hechos.length}/${e.c.items.length}`:""}</div>`).join("")}
      ${cs.length>3?`<div class="mon-mas">+${cs.length-3} más</div>`:""}
      ${hs.slice(0,2).map(e=>`<div class="mon-hito">◆ ${esc(e.h.txt)} · N° ${esc(e.h.r.n)}</div>`).join("")}${hs.length>2?`<div class="mon-mas">+${hs.length-2} fechas clave</div>`:""}
    </div>`;}
  $('monCal').innerHTML=html+"</div>";$('monMes').textContent=MESES_LARGO[mo]+" "+y;}
function filaAgenda(e,fecha){const c=e.c,r=e.p.r,[cls,txt]=estado(c),falta=c.items.filter(k=>!c.hechos.includes(k));
  return `<div class="mon-arow st-${cls}" data-dia="${clave(c.fecha)}" data-id="${esc(r.id)}" data-cid="${c.cid}">
    <div class="mon-arow-cab">${fecha?`<b>${fmtFecha(c.fecha)}</b> `:""}<b>${nom(r)}</b> · ${esc(c.nombre)} · ${esc(e.p.E.txt)}
      <span class="mon-st st-${cls}">${c.completo?"✔ Realizado":txt+(c.hechos.length?` · ${c.hechos.length}/${c.items.length}`:"")}</span></div>
    <div class="mon-chips">${c.items.map(k=>{const ok=c.hechos.includes(k);return `<label class="mon-chip${ok?' ok':''}" title="${ok?'Realizado':'Falta · marque cuando se haga'}"><input type="checkbox" data-k="${k}" ${ok?'checked':''}>${esc(EX[k][0])}${ok?' · Realizado':''}</label>`;}).join("")}</div>
    ${c.completo?"":`<small class="mon-falta">Falta: ${falta.map(k=>esc(EX[k][0])).join(" · ")}</small>`}</div>`;}
function pintarAgenda(ev){const h=hoy0();let html="";
  const venc=Object.values(ev).flatMap(l=>l.filter(e=>e.tipo==="c"&&estado(e.c)[0]==="vencido"));
  if(venc.length)html+=`<h3 class="mon-ah venc">Vencidos (${venc.length}) · controles con exámenes que faltan</h3>`+venc.sort((a,b)=>a.c.fecha-b.c.fecha).map(e=>filaAgenda(e,true)).join("");
  for(let i=0;i<=30;i++){const f=new Date(h.getFullYear(),h.getMonth(),h.getDate()+i),l=ev[clave(f)]||[];if(!l.length)continue;
    html+=`<h3 class="mon-ah${i===0?' hoy':''}">${largo(f)}${i===0?" · HOY":""}</h3>`+l.map(e=>e.tipo==="c"?filaAgenda(e,false):`<div class="mon-arow hito" data-dia="${clave(f)}">◆ ${esc(e.h.txt)} · ${nom(e.h.r)}</div>`).join("");}
  $('monCal').innerHTML=html||`<div class="mon-vacio">No hay citas en los próximos 30 días.</div>`;$('monMes').textContent="Próximos 30 días";}
function pintarDia(ev){const k=clave(diaSel),l=ev[k]||[],cs=l.filter(e=>e.tipo==="c"),hs=l.filter(e=>e.tipo==="h"),fer=feriado(diaSel);
  $('monDia').innerHTML=`<div class="mon-dcab"><b>${largo(diaSel)}</b><span>${cs.length} paciente(s) citado(s)${fer?" · Feriado: "+esc(fer):""}${diaSel.getDay()===0?" · Domingo":""}</span></div>`+
    (hs.length?`<div class="mon-hitos">${hs.map(e=>`<div>◆ <b>${esc(e.h.txt)}</b> · ${nom(e.h.r)}</div>`).join("")}</div>`:"")+
    (cs.length?cs.map(e=>tarjeta(e.p,e.c)).join(""):`<div class="mon-vacio">No hay controles programados este día.<br><small>Haga clic en un día del calendario para ver sus citas.</small></div>`);}
function pintarResumen(){const h=hoy0(),semana=new Date(h);semana.setDate(h.getDate()+7);let hoy=0,sem=0,venc=0,con=0;
  pacientes.filter(filtrar).forEach(r=>{const p=plan(r);if(!p)return;con++;p.controles.forEach(c=>{const s=estado(c)[0];if(s==="hoy")hoy++;if(s==="vencido")venc++;if(!c.completo&&c.fecha>=h&&c.fecha<=semana)sem++;});});
  const sin=sinInicio().filter(filtrar),noConf=pacientes.filter(filtrar).filter(r=>{const p=TPT.modoDe(r);return (p==="sens"||p==="otro")&&r.f_ini&&!r.f_ini_ok&&parseFecha(r.f_ini)<=h;});
  $('monResumen').innerHTML=`<span class="mr hoy">Hoy: <b>${hoy}</b></span><span class="mr prox">Próximos 7 días: <b>${sem}</b></span><span class="mr venc">Vencidos: <b>${venc}</b></span><span class="mr">Pacientes con plan: <b>${con}</b></span>`+
    (noConf.length?`<span class="mr falta" title="${esc(noConf.map(r=>"N° "+r.n+" "+r.nom+" · inicio "+r.f_ini).join("\n"))}">Inicio sin conformidad: <b>${noConf.length}</b></span>`:"")+
    (sin.length?`<span class="mr falta" title="${esc(sin.map(r=>"N° "+r.n+" "+r.nom).join("\n"))}">Sin fecha de inicio: <b>${sin.length}</b> · <a href="#" onclick="showView('tpt');return false">póngala en TPT</a></span>`:"")+
    `<span class="mr leyenda"><i class="st-prog"></i>Programado <i class="st-prox"></i>Próximo <i class="st-hoy"></i>Hoy <i class="st-vencido"></i>Vencido <i class="st-ok"></i>Realizado</span>`;}
function render(){if(!$('monitoreo').classList.contains('active'))return;const ev=eventos();
  $('monImpCab').innerHTML=`<b>Calendario de monitoreo y seguimiento · ${$('monVista').value==="agenda"?"Próximos 30 días":MESES_LARGO[mesVista.getMonth()]+" "+mesVista.getFullYear()}</b><span>${esc(config.estab||"")} · Programa de Control de Tuberculosis · NTS N° 221-MINSA/DGIESP-2024 · Impreso el ${fmtFecha(new Date())}</span>`;
  if($('monVista').value==="agenda")pintarAgenda(ev);else pintarCal(ev);pintarDia(ev);pintarResumen();if(planAbierto)abrirPlan(planAbierto,true);}

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
      <div><span>Monitoreo</span><b>${esc(p.T.nombre)} (${p.T.pag})</b></div></div>
      <table class="mon-ptab"><thead><tr><th>Control</th><th>Fecha</th><th>Exámenes y evaluaciones</th><th>Estado</th></tr></thead><tbody>${p.controles.map(c=>{const [cls,txt]=estado(c);
        return `<tr class="st-${cls}" data-id="${esc(r.id)}" data-cid="${c.cid}"><td><b>${esc(c.nombre)}</b></td><td class="mon-pf"><b>${fmtFecha(c.fecha)}</b><br>${DIAS[c.fecha.getDay()]}${c.movido?`<br><i>${c.movido==="reprogramada"?"reprogramada":"pasó del "+esc(c.movido)}</i>`:""}<br><input type="date" class="no-print" data-acc="rep" value="${iso(c.fecha)}" title="Reprogramar"></td>
          <td>${chipsItems(c,true)}</td><td><span class="mon-st st-${cls}">${txt}</span><br><small>${c.hechos.length}/${c.items.length}</small><br><button class="btn no-print" data-acc="todo">✔ Todo</button></td></tr>`;}).join("")}</tbody></table>
      <div class="mon-pnotas">${p.T.notas.map(n=>`<div>• ${esc(n)}</div>`).join("")}<div>• Las citas que caen domingo o feriado pasan al siguiente día hábil. Fuente: NTS N° 221-MINSA/DGIESP-2024.</div></div>`;}
  if(!refrescar)$('monModal').classList.add('abierto');
  const sel=$('monEsq');if(sel)sel.onchange=()=>{r.mon_esq=sel.value;guardar(r);};
  const cf=$('monConf');if(cf)cf.onchange=()=>{r.f_ini_ok=cf.checked?fmtFecha(new Date()):"";guardar(r);msg(`N° ${r.n}: ${r.f_ini_ok?"inicio conforme":"conformidad retirada"}`);};}
function cerrarPlan(){planAbierto=null;$('monModal').classList.remove('abierto');}

/* ======================= ACCIONES (marcar, reprogramar) ======================= */
function ordenar(o){if(!o||typeof o!=="object"||Array.isArray(o))return o;const x={};Object.keys(o).sort().forEach(k=>{x[k]=ordenar(o[k]);});return x;}
function guardar(r){r.mon=ordenar(r.mon&&typeof r.mon==="object"?r.mon:{});guardarPacientes();render();if(window.TPT)TPT.render();}
function accion(e){const t=e.target,cont=t.closest('[data-cid]');if(!cont)return;const r=pacientes.find(x=>x.id===cont.dataset.id);if(!r)return;
  r.mon=(r.mon&&typeof r.mon==="object")?r.mon:{};const st=r.mon[cont.dataset.cid]=r.mon[cont.dataset.cid]||{};st.ok=st.ok||{};
  if(t.matches('input[type=checkbox][data-k]')){if(e.type!=="change")return;if(t.checked)st.ok[t.dataset.k]=1;else delete st.ok[t.dataset.k];guardar(r);return;}
  const acc=t.dataset.acc;if(!acc)return;
  if(acc==="todo"&&e.type==="click"){const p=plan(r),c=p&&p.controles.find(x=>x.cid===cont.dataset.cid);if(c)c.items.forEach(k=>{st.ok[k]=1;});guardar(r);msg(`N° ${r.n}: ${c?c.nombre.toLowerCase():"control"} realizado`);}
  else if(acc==="rep"&&e.type==="change"){const f=deIso(t.value);if(!f)return;st.f=f;guardar(r);const d=parseFecha(f);diaSel=d;mesVista=new Date(d.getFullYear(),d.getMonth(),1);render();msg(`N° ${r.n}: cita reprogramada al ${f}`);}
  else if(acc==="plan"&&e.type==="click")abrirPlan(r.id);}
['click','change'].forEach(tp=>{$('monDia').addEventListener(tp,accion);$('monPlan').addEventListener(tp,accion);$('monCal').addEventListener(tp,accion);});
$('monCal').addEventListener('click',e=>{if(e.target.closest('.mon-chip'))return;const d=e.target.closest('[data-dia]');if(!d)return;const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d.dataset.dia);diaSel=new Date(+m[1],+m[2]-1,+m[3]);render();
  if(window.innerWidth<900)$('monDia').scrollIntoView({behavior:"smooth",block:"start"});});
$('monPrev').onclick=()=>{mesVista=new Date(mesVista.getFullYear(),mesVista.getMonth()-1,1);$('monVista').value="cal";render();};
$('monNext').onclick=()=>{mesVista=new Date(mesVista.getFullYear(),mesVista.getMonth()+1,1);$('monVista').value="cal";render();};
$('monHoy').onclick=()=>{const h=hoy0();diaSel=h;mesVista=new Date(h.getFullYear(),h.getMonth(),1);render();};
['monVista','monFiltro'].forEach(id=>$(id).addEventListener('change',render));$('monBuscar').addEventListener('input',render);
$('monModal').addEventListener('mousedown',e=>{if(e.target===$('monModal'))cerrarPlan();});
document.addEventListener('keydown',e=>{if(e.key==="Escape"&&$('monModal').classList.contains('abierto'))cerrarPlan();});

/* ======================= EXCEL E IMPRESIÓN ======================= */
function exportar(){if(typeof XLSX==="undefined"){msg("No se pudo cargar la librería de Excel (sin conexión)");return;}
  const cab=["Fecha","Día","N° Reg","Apellidos y Nombres","DNI","Inicio conforme","Esquema","Tabla NTS","Control","Exámenes y evaluaciones","Realizados","Estado","Observación de fecha"];
  const filas=[];pacientes.filter(filtrar).forEach(r=>{const p=plan(r);if(!p)return;p.controles.forEach(c=>filas.push([c.fecha,fmtFecha(c.fecha),DIAS[c.fecha.getDay()],r.n,r.nom,r.dni,r.f_ini_ok?"Sí ("+r.f_ini_ok+")":"Pendiente",p.E.txt,p.T.nombre,c.nombre,c.items.map(k=>EX[k][0]).join(" | "),c.hechos.length+"/"+c.items.length,estado(c)[1],c.movido?(c.movido==="reprogramada"?"Reprogramada":"Pasó del "+c.movido):""]));});
  filas.sort((a,b)=>a[0]-b[0]);const ws=XLSX.utils.aoa_to_sheet([cab].concat(filas.map(f=>f.slice(1))));ws['!cols']=[11,10,7,34,11,16,30,40,18,90,10,11,22].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Monitoreo");XLSX.writeFile(wb,"Monitoreo_PCT.xlsx");msg("Excel exportado");}
function imprimir(){document.body.classList.remove('imp-plan');window.print();}
function imprimirPlan(){document.body.classList.add('imp-plan');window.print();setTimeout(()=>document.body.classList.remove('imp-plan'),500);}

/* ======================= ENLACES CON EL RESTO DE LA APP ======================= */
const showBase=window.showView;
window.showView=function(v){showBase(v);$('tabMon').classList.toggle('active',v==='monitoreo');document.body.classList.toggle('ver-mon',v==='monitoreo');if(v==='monitoreo')render();};
const alCambiarBase=window.alCambiarPacientes;
window.alCambiarPacientes=function(){if(alCambiarBase)alCambiarBase();const a=document.activeElement;if(!(a&&a.closest&&a.closest('#monitoreo,#monPlan')))render();};
window.MON={plan,abrirPlan:id=>{showView('monitoreo');abrirPlan(id);},cerrarPlan,exportar,imprimir,imprimirPlan,render,feriado};
})();
