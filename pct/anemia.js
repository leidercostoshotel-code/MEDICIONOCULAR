/* PCT · Pestaña ANEMIA: diagnóstico y tratamiento de la anemia por deficiencia de hierro con control mensual durante 6 meses.
   Fuente: NTS N° 213-MINSA/DGIESP-2024 «Prevención y control de la anemia por deficiencia de hierro…» (RM N° 251-2024/MINSA,
   modificada por RM N° 429-2024/MINSA): puntos de corte de hemoglobina de la OMS 2024 con ajuste por altitud (Tabla N° 1),
   hierro elemental 3 mg/kg/día en niños y 120 mg/día en adolescentes y adultos durante 6 meses, control de hemoglobina al mes
   (debe subir ≥ 1 g/dL), a los 3 y a los 6 meses, y entrega mensual del hierro con control de la toma diaria.
   La norma no incluye a varones adultos: se les aplica la dosis de adultos (120 mg/día). Los valores se cargan para que el
   médico los valide; cada cita entra al calendario de MONITOREO (cid «a1»…«a6», marcas en r.mon) y se reprograma igual que las de TB. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const FUENTE="NTS N° 213-MINSA/DGIESP-2024 (RM 251-2024 y RM 429-2024/MINSA) · puntos de corte OMS 2024";

/* ======================= DIAGNÓSTICO ======================= */
// Puntos de corte de hemoglobina (g/dL) a nivel del mar: sin anemia ≥ ok · leve ≥ leve · moderada ≥ mod · severa por debajo
function corte(r){const e=num(edadDe(r)),s=String(r.sexo||"").toUpperCase(),g=(r.ane||{}).gest;
  if(g)return {grupo:"Gestante"+(g==="2"?" · 2.º trimestre":" · 1.er o 3.er trimestre"),ok:g==="2"?10.5:11.0,leve:g==="2"?9.5:10.0,mod:7.0};
  if(e==null)return null;
  if(e<2)return {grupo:"6 a 23 meses",ok:10.5,leve:9.5,mod:7.0};
  if(e<5)return {grupo:"24 a 59 meses",ok:11.0,leve:10.0,mod:7.0};
  if(e<12)return {grupo:"5 a 11 años",ok:11.5,leve:11.0,mod:8.0};
  if(e<15)return {grupo:"12 a 14 años",ok:12.0,leve:11.0,mod:8.0};
  if(s==="M")return {grupo:"Varón de 15 años a más",ok:13.0,leve:11.0,mod:8.0};
  return {grupo:(s==="F"?"Mujer":"Adulto (sexo sin registrar)")+" de 15 años a más",ok:12.0,leve:11.0,mod:8.0};}
// Ajuste por altitud (Tabla N° 1 de la NTS 213-2024): se resta a la Hb medida. Los tramos intermedios siguen la misma curva de la OMS.
const ALTITUD=[[500,0],[1000,0.4],[1500,0.8],[2000,1.1],[2500,1.4],[3000,1.8],[3500,2.1],[4000,2.5],[4500,2.9],[5000,3.4],[Infinity,4.0]];
function ajusteAltitud(){const m=num(config.msnm)||0;for(const [tope,aj] of ALTITUD)if(m<tope)return aj;return 4.0;}
function clasif(r,hb){const c=corte(r);hb=num(hb);if(c==null||hb==null)return null;const h=+(hb-ajusteAltitud()).toFixed(1);
  const sev=h>=c.ok?"":h>=c.leve?"leve":h>=c.mod?"moderada":"severa";return {sev,hbAj:h,c,txt:sev?"Anemia "+sev:"Sin anemia"};}

/* ======================= TRATAMIENTO ======================= */
function dosis(r){const e=num(edadDe(r)),w=num(r.peso),g=(r.ane||{}).gest;
  if(e!=null&&e<12){if(w==null)return {mg:null,txt:"Falta el peso para calcular la dosis (3 mg/kg/día)",como:""};
    const mg=Math.min(Math.round(3*w),120);
    return {mg,txt:`${mg} mg de hierro elemental al día (3 mg/kg) · gotas 25 mg/ml: ${(mg/25).toFixed(1)} ml · jarabe 15 mg/5 ml: ${(mg/3).toFixed(1)} ml`,como:"Sulfato ferroso o hierro polimaltosado · 1 vez al día, lejos de las comidas"};}
  return {mg:120,txt:"120 mg de hierro elemental al día"+(g?" + ácido fólico 800 µg":"")+" · sulfato ferroso 300 mg (60 mg Fe): 2 tabletas al día · 60 tabletas por mes",
    como:"1 h antes o 2 h después de las comidas, con agua o jugo cítrico; no con lácteos, café, té, calcio ni antiácidos. Si hay molestias: empezar con 1 tableta y subir en 4 a 5 días. Alternativa: hierro polimaltosado con la misma cantidad de hierro."};}

/* ======================= PLAN: 6 controles mensuales (entran al calendario de MONITOREO) ======================= */
function plan(r){const a=r.ane||{},ini=parseFecha(a.f_ini);if(!ini)return null;const d=dosis(r);
  const est=(r.mon&&typeof r.mon==="object")?r.mon:{};const controles=[];
  for(let m=1;m<=6;m++){const items=[];if(m===1||m===3||m===6)items.push("an_hb");items.push("an_fe","an_adh");if(m===1)items.push("an_nut");
    const base=MON.masMeses(ini,m),aj=MON.habil(base),st=est["a"+m]||{},rep=parseFecha(st.f),fecha=rep||aj.f,hechos=items.filter(k=>st.ok&&st.ok[k]);
    const notas=[];if(m===1)notas.push("Al mes la hemoglobina debe subir ≥ 1 g/dL; si no, revisar la toma diaria y los efectos adversos, y descartar otra causa.");
    if(m===6)notas.push("Fin del tratamiento: con hemoglobina normal pasa a la suplementación preventiva según la norma; si sigue con anemia, evaluar y referir.");
    controles.push({m,cid:"a"+m,nombre:`Mes ${m} · anemia`,fecha,base,movido:rep?"reprogramada":aj.motivo,hist:Array.isArray(st.hist)?st.hist:[],items,hechos,notas,completo:hechos.length===items.length});}
  return {r,tipo:"ane",E:{txt:"🩸 Anemia · "+(d.mg?d.mg+" mg de hierro al día":"hierro")},T:{nombre:"NTS N° 213-MINSA/DGIESP-2024 (anemia)",pag:"",notas:[]},meses:6,ini,fin:MON.masMeses(ini,6),controles};}
function situacion(r){const a=r.ane||{},hb=num(a.hb0);
  if(hb==null)return {k:"sin",txt:"Sin dosaje de Hb"};const cl=clasif(r,hb);if(!cl)return {k:"nd",txt:"Falta la edad (o el sexo)"};
  if(!cl.sev)return {k:"ok",txt:"Sin anemia"};
  if(!parseFecha(a.f_ini))return {k:"ini",txt:"Anemia "+cl.sev+" · por iniciar"};
  const hb1=num(a.hb1),hb6=num(a.hb6);
  if(hb6!=null){const c6=clasif(r,hb6);return c6.sev?{k:"nores",txt:"Termina con anemia "+c6.sev+" · evaluar"}:{k:"fin",txt:"Anemia corregida · Hb "+hb6};}
  if(hb1!=null&&hb1-hb<1)return {k:"nores",txt:"Sin respuesta al mes (+"+(hb1-hb).toFixed(1)+" g/dL) · revisar"};
  const p=plan(r),hechos=p.controles.filter(c=>c.completo).length;return {k:"tto",txt:`En tratamiento · ${hechos} de 6 meses`};}
// Última hemoglobina registrada en el REGISTRO HIS del paciente (HB y F. HB de la hoja)
function hbHIS(r){let mejor=null;for(const id in atenciones){const a=atenciones[id];if(!(a.pacId===r.id||(r.dni&&a.dni===r.dni)))continue;const v=num(a.hb);if(v==null)continue;
    const f=parseFecha(a.fechaHb)||parseFecha(a.fecha)||new Date(0);if(!mejor||f>mejor.f)mejor={hb:v,f,txt:a.fechaHb||a.fecha||""};}return mejor;}

/* ======================= VISTA ======================= */
$('tabMon').insertAdjacentHTML('afterend',`<button id="tabAne" onclick="showView('anemia')" title="Anemia: diagnóstico, tratamiento con hierro y control mensual por 6 meses (NTS 213-2024)">ANEMIA</button>`);
$('monitoreo').insertAdjacentHTML('afterend',`
<div id="anemia" class="view">
  <div class="toolbar">
    <label class="lbl">Mostrar <select id="aneFiltro">
      <option value="todos" selected>Todos los pacientes de DATOS</option><option value="anemia">Con anemia</option><option value="tto">En tratamiento</option><option value="nores">Sin respuesta / evaluar</option><option value="fin">Corregida</option><option value="sin">Sin dosaje de Hb</option></select></label>
    <input type="text" id="aneBuscar" placeholder="Buscar paciente…" autocomplete="off">
    <span class="status" id="aneInfo"></span>
    <span class="sep"></span>
    <label class="lbl" title="Altitud del establecimiento: la norma resta a la hemoglobina medida 0,4 g/dL desde 500 msnm, 0,8 desde 1000, 1,4 desde 2000, 2,1 desde 3000… (Tabla N° 1). Lima = 0">Altitud (msnm) <input type="number" id="aneMsnm" min="0" max="5500" step="1" style="width:80px"></label>
    <button class="btn" onclick="ANE.exportar()">Exportar Excel</button>
    <button class="btn" onclick="ANE.imprimir()">🖨 Imprimir</button>
  </div>
  <div class="ane-info"><b>Cómo se calcula</b> · Anemia según los puntos de corte de la ${esc(FUENTE)}, por edad, sexo y gestación, con ajuste por altitud.
    Tratamiento: niños 3 mg/kg/día; adolescentes y adultos 120 mg/día de hierro elemental (gestantes + ácido fólico), durante <b>6 meses</b>.
    Controles mensuales: entrega del hierro y control de la toma; <b>dosaje de hemoglobina al mes 1, 3 y 6</b> (al mes debe subir ≥ 1 g/dL). Las citas aparecen en <b>MONITOREO</b> con 🩸 y se marcan o reprograman allí.
    <i>La norma no incluye varones adultos: se usa la dosis de adultos. Valide los valores con el texto oficial.</i></div>
  <div id="aneWrap"><table class="datos ane-tabla" id="tblAne">
    <colgroup><col style="width:46px"><col style="width:250px"><col style="width:150px"><col style="width:170px"><col style="width:300px"><col style="width:140px"><col style="width:430px"><col style="width:190px"><col style="width:170px"></colgroup>
    <thead><tr><th>N°</th><th>Paciente</th><th>Hb inicial (g/dL)</th><th>Diagnóstico</th><th>Tratamiento (hierro)</th><th>Inicio</th><th>Controles mensuales (6 meses)</th><th>Situación</th><th>Observación</th></tr></thead>
    <tbody id="tbodyAne"></tbody></table></div>
</div>`);
function ane(r){if(!r.ane||typeof r.ane!=="object")r.ane={};return r.ane;}
function filtrar(r){const f=$('aneFiltro').value,q=normTxt($('aneBuscar').value).trim();
  if(q&&!normTxt([r.n,r.dni,r.hc,r.nom].join(" ")).includes(q))return false;if(f==="todos")return true;const s=situacion(r).k;
  if(f==="anemia")return ["ini","tto","nores","fin"].includes(s);if(f==="tto")return s==="tto";if(f==="nores")return s==="nores";if(f==="fin")return s==="fin";if(f==="sin")return s==="sin";return true;}
const isoDe=s=>{const d=parseFecha(s);return d?d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"):"";};
function deIso(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||"");return m?m[3]+"/"+m[2]+"/"+m[1]:"";}
function fila(r){const i=pacientes.indexOf(r),a=ane(r),e=edadDe(r),sx=String(r.sexo||"").toUpperCase(),en=num(e),cl=clasif(r,a.hb0),c=corte(r),d=dosis(r),p=plan(r),st=situacion(r),his=hbHIS(r);
  const gestOk=sx!=="M"&&(en==null||(en>=10&&en<=55));
  const ctrl=p?p.controles.map(x=>{const [cls,txt]=MON.estado(x),hbk="hb"+x.m,conHb=x.items.includes("an_hb");
      return `<div class="ane-ctrl st-${cls}" data-cid="${x.cid}"><button type="button" class="ane-mes" data-acc="dia" data-f="${isoDe(fmtFecha(x.fecha))}" title="Ver este día en MONITOREO">M${x.m} · ${fmtFecha(x.fecha).slice(0,5)}</button><span class="ane-st">${x.completo?"✔":txt}</span>${conHb?`<input type="number" step="0.1" min="2" max="25" data-k="${hbk}" value="${esc(a[hbk]||"")}" placeholder="Hb" title="Hemoglobina del control del mes ${x.m}">`:""}${x.completo?"":`<button type="button" class="ane-ok" data-acc="todo" title="Marcar todo el control como realizado">✔</button>`}</div>`;}).join(""):
    (num(a.hb0)!=null&&cl&&cl.sev?`<span class="ane-gris">Ponga la fecha de inicio: se programan 6 controles mensuales.</span>`:`<span class="ane-gris">—</span>`);
  return `<tr data-i="${i}" data-id="${esc(r.id)}" class="s-${st.k}">
    <td class="num">${esc(r.n)}</td>
    <td class="ane-nom"><div>${esc(r.nom||"(sin nombre)")}</div><small>DNI ${esc(r.dni||"—")} · ${esc(e||"edad ?")} años · ${sx||"sexo ?"} · ${r.peso?esc(r.peso)+" kg":"peso ?"}</small>
      ${gestOk?`<label class="ane-gest"><select data-k="gest"><option value="">No gestante</option><option value="1" ${a.gest==="1"?"selected":""}>Gestante 1.er / 3.er trim.</option><option value="2" ${a.gest==="2"?"selected":""}>Gestante 2.º trim.</option></select></label>`:""}</td>
    <td><input type="number" step="0.1" min="2" max="25" data-k="hb0" value="${esc(a.hb0||"")}" placeholder="g/dL" style="width:70px;text-align:center"><input type="date" data-k="f_hb0" value="${isoDe(a.f_hb0)}" title="Fecha del dosaje">
      ${his&&num(a.hb0)==null?`<button type="button" class="ane-his" data-acc="his" data-hb="${his.hb}" data-f="${esc(his.txt)}" title="Tomar la hemoglobina registrada en el REGISTRO HIS">HIS: ${his.hb} (${esc(his.txt)})</button>`:""}</td>
    <td>${cl?`<span class="ane-dx sev-${cl.sev||"ok"}">${esc(cl.txt)}</span><small>${esc(cl.c.grupo)} · anemia &lt; ${cl.c.ok}${ajusteAltitud()?` · Hb ajustada ${cl.hbAj}`:""}</small>`:c?`<small>${esc(c.grupo)} · anemia &lt; ${c.ok} g/dL</small>`:`<small class="ane-gris">Falta la edad en DATOS</small>`}</td>
    <td class="ane-tto">${cl&&cl.sev?`<b>${esc(d.txt)}</b><small>${esc(d.como)}</small>${cl.sev==="severa"?`<div class="ane-aviso">⚠ Anemia severa: evaluar referencia a un establecimiento de mayor capacidad.</div>`:""}`:`<small class="ane-gris">${cl?"No requiere tratamiento; suplementación preventiva según la norma.":"Escriba la hemoglobina inicial."}</small>`}</td>
    <td><input type="date" data-k="f_ini" value="${isoDe(a.f_ini)}" title="Fecha de inicio del hierro: desde aquí se programan los 6 controles"></td>
    <td class="ane-ctrls">${ctrl}</td>
    <td><span class="ane-sit s-${st.k}">${esc(st.txt)}</span>${p&&num(a.hb0)!=null?`<small>Inicio ${fmtFecha(p.ini)} · fin ${fmtFecha(p.fin)}</small>`:""}</td>
    <td><input data-k="obs" value="${esc(a.obs||"")}" placeholder="—"></td></tr>`;}
function render(){if(!$('anemia').classList.contains('active'))return;$('aneMsnm').value=config.msnm||"";
  const lista=pacientes.filter(filtrar);$('tbodyAne').innerHTML=lista.map(fila).join("");
  const n={anemia:0,tto:0,fin:0,sin:0};pacientes.forEach(r=>{const k=situacion(r).k;if(["ini","tto","nores","fin"].includes(k))n.anemia++;if(k==="tto")n.tto++;if(k==="fin")n.fin++;if(k==="sin")n.sin++;});
  $('aneInfo').textContent=`${lista.length} en la lista · ${n.anemia} con anemia · ${n.tto} en tratamiento · ${n.fin} corregidas · ${n.sin} sin dosaje`;}
// Redibuja la fila; si se está escribiendo en una celda (fecha, Hb…), esa celda se conserva y solo se actualizan las demás
function refrescar(tr,activo){const r=pacientes[+tr.dataset.i];if(!r)return;const t=document.createElement('tbody');t.innerHTML=fila(r);const nuevo=t.firstElementChild;
  if(!activo||!tr.contains(activo)){tr.replaceWith(nuevo);return;}
  tr.className=nuevo.className;const v=tr.children,n=nuevo.children;for(let i=0;i<v.length;i++){if(v[i].contains(activo))continue;v[i].innerHTML=n[i].innerHTML;}}
$('tbodyAne').addEventListener('change',e=>{const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k)return;const r=pacientes[+tr.dataset.i],a=ane(r),k=el.dataset.k;
  if(k==="f_ini"||k==="f_hb0"){if(!fechaIsoValida(el.value))return;a[k]=deIso(el.value);}else if(k==="obs")a.obs=el.value.trim();else a[k]=el.value.trim();
  guardarPacientes();if(window.MON)MON.render();
  // la celda del campo que se está editando no se toca (en un campo de fecha, Chrome avisa cada cambio mientras se escribe): así no pierde el foco
  refrescar(tr,el.type==="date"||document.activeElement===el?el:null);if(k==="f_ini")avisoInicio(r);});
$('tbodyAne').addEventListener('focusout',e=>{const el=e.target;if(el.type!=="date"||!el.dataset.k)return;const tr=el.closest('tr');if(tr)setTimeout(()=>{if(tr.isConnected&&!tr.contains(document.activeElement))refrescar(tr);},0);}); // al salir de la fecha se redibuja completa
function avisoInicio(r){const a=ane(r);msg(`N° ${r.n}: ${a.f_ini?"tratamiento de anemia desde el "+a.f_ini+" · 6 controles programados en MONITOREO":"inicio retirado"}`);}
$('tbodyAne').addEventListener('input',e=>{const el=e.target;if(el.dataset.k==="obs"){const r=pacientes[+el.closest('tr').dataset.i];ane(r).obs=el.value.trim();guardarPacientes();}});
$('tbodyAne').addEventListener('click',e=>{const b=e.target.closest('[data-acc]');if(!b)return;const tr=b.closest('tr'),r=pacientes[+tr.dataset.i];
  if(b.dataset.acc==="his"){const a=ane(r);a.hb0=b.dataset.hb;a.f_hb0=b.dataset.f;guardarPacientes();refrescar(tr);msg(`N° ${r.n}: hemoglobina ${a.hb0} tomada del REGISTRO HIS`);}
  else if(b.dataset.acc==="dia"){MON.irDia(b.dataset.f);}
  else if(b.dataset.acc==="todo"){const cid=b.closest('[data-cid]').dataset.cid,p=plan(r),c=p&&p.controles.find(x=>x.cid===cid);if(!c)return;
    r.mon=(r.mon&&typeof r.mon==="object")?r.mon:{};const st=r.mon[cid]=r.mon[cid]||{};st.ok=st.ok||{};c.items.forEach(k=>{st.ok[k]=1;});guardarPacientes();refrescar(tr);if(window.MON)MON.render();msg(`N° ${r.n}: ${c.nombre} realizado`);}});
$('aneFiltro').addEventListener('change',render);$('aneBuscar').addEventListener('input',render);
$('aneMsnm').addEventListener('change',()=>{config.msnm=num($('aneMsnm').value)||0;guardarConfig();render();msg("Altitud: "+config.msnm+" msnm · ajuste de Hb −"+ajusteAltitud()+" g/dL");});

/* ======================= EXCEL E IMPRESIÓN ======================= */
function exportar(){if(typeof XLSX==="undefined"){msg("No se pudo cargar la librería de Excel (sin conexión)");return;}
  const cab=["N° Reg","Apellidos y Nombres","DNI","Edad","Sexo","Peso (kg)","Gestante","Hb inicial","Fecha Hb","Hb ajustada","Grupo","Diagnóstico","Tratamiento","Inicio","Fin","M1","M2","M3","M4","M5","M6","Hb mes 1","Hb mes 3","Hb mes 6","Situación","Observación"];
  const filas=pacientes.filter(filtrar).map(r=>{const a=ane(r),cl=clasif(r,a.hb0),d=dosis(r),p=plan(r),m=k=>{const c=p&&p.controles.find(x=>x.cid===k);return c?fmtFecha(c.fecha)+(c.completo?" ✔":" · "+MON.estado(c)[1]):"";};
    return [r.n,r.nom,r.dni,edadDe(r),r.sexo,r.peso,a.gest?(a.gest==="2"?"2.º trim.":"Sí"):"",a.hb0||"",a.f_hb0||"",cl?cl.hbAj:"",cl?cl.c.grupo:"",cl?cl.txt:"",cl&&cl.sev?d.txt:"",a.f_ini||"",p?fmtFecha(p.fin):"",m("a1"),m("a2"),m("a3"),m("a4"),m("a5"),m("a6"),a.hb1||"",a.hb3||"",a.hb6||"",situacion(r).txt,a.obs||""];});
  const ws=XLSX.utils.aoa_to_sheet([cab].concat(filas));ws['!cols']=[7,34,11,6,6,8,10,9,11,10,22,16,60,11,11,16,16,16,16,16,16,9,9,9,30,24].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"ANEMIA");XLSX.writeFile(wb,"Anemia_PCT.xlsx");msg("Excel exportado");}
function imprimir(){window.print();}

/* ======================= ENLACES CON EL RESTO DE LA APP ======================= */
const showBase=window.showView;
window.showView=function(v){showBase(v);$('tabAne').classList.toggle('active',v==='anemia');document.body.classList.toggle('ver-ane',v==='anemia');if(v==='anemia')render();};
const alCambiarBase=window.alCambiarPacientes;
window.alCambiarPacientes=function(){if(alCambiarBase)alCambiarBase();const a=document.activeElement;if(!(a&&a.closest&&a.closest('#tbodyAne')))render();};
const alCfgBase=window.alCambiarConfig;window.alCambiarConfig=function(){if(alCfgBase)alCfgBase();render();};
window.ANE={plan,clasif,dosis,situacion,render,exportar,imprimir,corte,ajusteAltitud};
})();
