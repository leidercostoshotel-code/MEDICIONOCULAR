/* PCT · Pestaña TPT: terapia preventiva (contactos) y esquema sensible, calculados con la edad y el peso de DATOS.
   Fuente: NTS N° 221-MINSA/DGIESP-2024 (RM N° 894-2024-MINSA)
   · TPT: Tablas N° 3, 4 y 5 (pág. 26), 6 y 7 (pág. 27) y esquema 6H.
   · Esquema sensible: Tabla N° 10 (pág. 35), fases y variantes (pág. 36), Tablas N° 11 y 12 (pág. 37). */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const IND={ds:"TB sensible (TB-DS)",hr:"TB-Hr",mdr:"TB-RR/MDR",xdr:"TB pre-XDR / XDR"};
const SIT={normal:"Normal · 2HREZ / 4HR",grave:"Miliar / SNC / osteoarticular · 2ª fase 10 meses",nograve:"No grave en niños · 2ª fase 2 meses"};
const ESQ={"3HP":"3HP · semanal, 12 dosis","3HP-DFC":"3HP en DFC (H+P 300/300)","3HR-DFC":"3HR en DFC dispersable (H+R 50/75)","3HR":"3HR monofármacos","6H":"6H · diario, 6 meses","4R":"4R · rifampicina diaria, 4 meses","6Lfx":"6Lfx · levofloxacino diario, 6 meses"};
const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

/* ======================= VISTA ======================= */
$('tabRegistro').insertAdjacentHTML('afterend',`<button id="tabTPT" onclick="showView('tpt')" title="Terapia preventiva y esquema sensible según peso y edad (NTS 221-2024)">TPT</button>`);
$('registro').insertAdjacentHTML('afterend',`
<div id="tpt" class="view">
  <div class="toolbar">
    <label class="lbl">Mostrar <select id="tptFiltro">
      <option value="tpt">Contactos · TPT</option><option value="sens">Esquema sensible (TB-DS)</option><option value="todos">Todos los pacientes</option></select></label>
    <input type="text" id="tptBuscar" placeholder="Buscar (N°, DNI, nombre…)" autocomplete="off">
    <span class="status" id="tptInfo"></span>
    <span class="sep"></span>
    <button class="btn" onclick="TPT.exportar()">Exportar Excel</button>
    <button class="btn" onclick="window.print()">🖨 Imprimir / PDF</button>
  </div>
  <div class="tpt-nota no-print">Dosis calculadas con la <b>edad</b> y el <b>peso</b> de DATOS según la <b>NTS N° 221-MINSA/DGIESP-2024</b>: TPT (Tablas N° 3 a 7, págs. 26–27) y esquema sensible (Tablas N° 10 a 12, págs. 35–37). Cambie el peso o el tratamiento aquí o en DATOS: todo se recalcula solo. La indicación final es del médico.</div>
  <div id="tptWrap">
    <table class="datos tpt-tabla" id="tblTPT">
      <colgroup><col style="width:52px"><col style="width:250px"><col style="width:56px"><col style="width:70px"><col style="width:110px"><col style="width:190px"><col style="width:200px"><col style="width:380px"><col style="width:118px"><col style="width:190px"><col style="width:160px"></colgroup>
      <thead><tr><th>N° Reg</th><th>Apellidos y Nombres</th><th>Edad</th><th>Peso (kg)</th><th>Tratamiento</th><th>Caso índice / Situación</th><th>Esquema</th><th>Dosis según peso y edad</th><th>Inicio</th><th>Fechas</th><th>Observación</th></tr></thead>
      <tbody id="tbodyTPT"></tbody>
    </table>
    <div id="tptVacio" class="empty" style="display:none">No hay pacientes para este filtro.</div>
  </div>
</div>`);

/* ======================= UTILIDADES ======================= */
const p2=n=>String(n).padStart(2,"0");
function iso(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());}
function deIso(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?m[3]+"/"+m[2]+"/"+m[1]:"";}
function masMeses(d,n){const x=new Date(d.getFullYear(),d.getMonth()+n,d.getDate());x.setDate(x.getDate()-1);return x;}
function masDias(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function dosisLS(ini,n){const d=new Date(ini);let c=0;for(;;){if(d.getDay()!==0){c++;if(c===n)return new Date(d);}d.setDate(d.getDate()+1);}} // fecha de la dosis n, de lunes a sábado
function sigLS(d){const x=masDias(d,1);if(x.getDay()===0)x.setDate(x.getDate()+1);return x;}
function cuarto(x){const q=Math.round(x*4)/4,e=Math.floor(q),f=q-e;const fr=f===.25?"¼":f===.5?"½":f===.75?"¾":"";return (e?String(e):"")+(fr||(e?"":"0"));} // 2.75 -> 2¾
function tabs(mg,mgTab){return `${Math.round(mg)} mg ≈ ${cuarto(mg/mgTab)} tab de ${mgTab} mg`;}
function modoDe(r){const t=normTxt(r.tto).trim();if(!t)return "";if(t==="con"||t.startsWith("contact")||t.startsWith("tpt"))return "tpt";if(t.startsWith("sensible")||t==="ds"||t==="tb-ds")return "sens";return "otro";}
function edadNum(r){const e=num(edadDe(r));return e==null||e<0||e>120?null:e;} // edad inválida (p. ej. 220) = sin edad
function banda(w,lims){for(let i=0;i<lims.length;i++)if(w<lims[i])return i;return lims.length;} // índice de la franja de peso

/* ======================= CÁLCULO: TPT (págs. 26–27) ======================= */
function esqAuto(e,ind){if(ind==="hr")return "4R";if(ind==="mdr")return "6Lfx";if(ind==="xdr")return "";if(e==null)return "";return e<=2?"3HR-DFC":"3HP";}
function opcionesEsq(e,ind){if(ind==="hr")return ["4R"];if(ind==="mdr")return ["6Lfx"];if(ind==="xdr")return [];
  const o=["3HP"];if(e==null||e>14)o.push("3HP-DFC");if(e==null||e<=2)o.push("3HR-DFC");o.push("3HR","6H","4R");return o;}
function calcTPT(r){
  const e=edadNum(r),w=num(r.peso),ind=r.tpt_ind||"ds";const out={lin:[],aviso:[],nota:[],tabla:"",esq:"",piri:false,dur:null};
  if(ind==="xdr"){out.aviso.push("La TPT no está indicada en contactos de TB pre-XDR y TB-XDR.");return out;}
  const esq=r.tpt_esq&&opcionesEsq(e,ind).includes(r.tpt_esq)?r.tpt_esq:esqAuto(e,ind);out.esq=esq;
  if(e==null)out.aviso.push(edadDe(r)?`Edad no válida en DATOS (${edadDe(r)}): corríjala.`:"Falta la edad (escriba la fecha de nacimiento o la edad en DATOS).");
  if(w==null)out.aviso.push("Falta el peso.");
  if(!esq||e==null||w==null)return out;
  if(esq==="3HP"){
    out.piri=true;out.dur={semanas:12};out.frec="1 vez por semana · 12 dosis (3 meses)";
    if(e<=2)out.aviso.push("3HP es la primera elección en mayores de 2 años; en ≤ 2 años se indica 3HR (Tabla N° 5).");
    if(e>14&&w>30){out.tabla="Tabla N° 4";out.lin.push("H (tab. 100 mg): 9 tab","P (tab. 150 mg): 6 tab");}
    else{out.tabla="Tabla N° 3";
      if(w<10){out.aviso.push("Peso menor de 10 kg: fuera de la Tabla N° 3, consultar al médico.");return out;}
      const i=banda(w,[16,24,31]);out.lin.push(`H (tab. 100 mg): ${[3,5,6,7][i]} tab`,`P (tab. 150 mg): ${[2,3,4,5][i]} tab`);
      if(e>14)out.nota.push("Mayor de 14 años con 30 kg o menos: dosis por peso de la Tabla N° 3.");}
  }else if(esq==="3HP-DFC"){
    out.piri=true;out.dur={semanas:12};out.frec="1 vez por semana · 12 dosis (3 meses)";out.tabla="Tabla N° 4";
    if(e<=14||w<=30)out.aviso.push("3HP en DFC es para mayores de 14 años con más de 30 kg (Tabla N° 4).");
    out.lin.push("H + P (tab. 300/300 mg): 3 tab");
  }else if(esq==="3HR-DFC"){
    out.piri=true;out.dur={meses:3};out.frec="Diario (lunes a domingo, incluye feriados) · 3 meses";out.tabla="Tabla N° 5";
    if(e>2)out.aviso.push("3HR en DFC dispersable es para niños de 2 años o menos (Tabla N° 5).");
    if(w<4||w>=25){out.aviso.push("Peso fuera de la Tabla N° 5 (4 a 24 kg): consultar al médico.");return out;}
    out.lin.push(`H + R dispersable (tab. 50/75 mg): ${[1,2,3,4][banda(w,[8,12,16])]} tab/día`);
  }else if(esq==="3HR"){
    out.piri=true;out.dur={meses:3};out.frec="Diario (lunes a domingo, incluye feriados) · 3 meses";
    let h,rr;if(e<=2){out.tabla="Tabla N° 5";h=10;rr=15;}else{out.tabla="Tabla N° 3";if(e<10){h=15;rr=10;}else{h=5;rr=10;}}
    if(e>2)out.nota.push("3HR es esquema alternativo (Tabla N° 3).");
    out.lin.push(`H (tab. 100 mg) ${h} mg/kg: ${tabs(Math.min(h*w,300),100)}`,`R (tab. 300 mg) ${rr} mg/kg: ${tabs(Math.min(rr*w,600),300)}`);
    out.nota.push("Dosis máxima: H 300 mg/día, R 600 mg/día.");
  }else if(esq==="6H"){
    out.piri=true;out.dur={meses:6};out.frec="Diario · 6 meses";out.tabla="Esquema 6H";const h=e<10?10:5;
    out.lin.push(`H (tab. 100 mg) ${h} mg/kg: ${tabs(Math.min(h*w,300),100)}`);out.nota.push("Solo si no hay 3HP/3HR en el E.S. Dosis máxima 300 mg/día.");
  }else if(esq==="4R"){
    out.dur={meses:4};out.frec="Diario · 4 meses";out.tabla=ind==="hr"?"Tabla N° 6":"RAM a H · Tabla N° 6";
    if(e>14)out.lin.push(`R (tab. 300 mg): ${w>=50?"2 tab (600 mg)":"1 tab (300 mg)"}`);
    else out.lin.push(`R (tab. 300 mg) 15 mg/kg: ${tabs(Math.min(15*w,600),300)}`);
    if(ind!=="hr")out.nota.push("4R se usa en caso de RAM a H.");
  }else if(esq==="6Lfx"){
    out.dur={meses:6};out.frec="Diario · 6 meses (DOT)";out.tabla="Tabla N° 7";
    if(e>14)out.lin.push(w>45?"Lfx: 2 tab de 500 mg (1000 mg)":"Lfx: 1 tab de 500 mg + 1 tab de 250 mg (750 mg)");
    else out.lin.push(`Lfx 15–20 mg/kg: ${Math.round(Math.min(15*w,750))}–${Math.round(Math.min(20*w,750))} mg/día (máx. 750 mg)`);
    out.nota.push("Indicado por el médico consultor. Dar 2 h antes o después de lácteos, antiácidos, hierro, calcio, zinc o vitaminas.");
  }
  if(out.piri)out.lin.push("Piridoxina 50 mg por cada dosis de H");
  return out;
}

/* ======================= CÁLCULO: ESQUEMA SENSIBLE (págs. 35–37) ======================= */
function calcSens(r){
  const e=edadNum(r),w=num(r.peso),sit=r.tto_sit||"normal";const out={lin:[],aviso:[],nota:[],tabla:"",esq:"",piri:true,fases:null};
  const d2=sit==="grave"?250:sit==="nograve"?50:100,m2=sit==="grave"?10:sit==="nograve"?2:4;
  out.esq=`2 (HREZ) / ${m2} (HR) · ${50+d2} dosis`;out.fases=[50,d2];out.frec="Diario de lunes a sábado (sin domingos, incluye feriados)";
  if(sit==="nograve"&&e!=null&&e>16)out.aviso.push("La 2ª fase de 2 meses es para TB no grave en niños de 3 meses a 16 años.");
  if(w==null){out.aviso.push("Falta el peso.");return out;}
  if(w>=25){out.tabla="Tabla N° 11";const n=[2,2,3,4,5][banda(w,[30,38,55,70])];
    out.lin.push(`1ª fase (50 dosis) · RHZE (R 150 + H 75 + Z 400 + E 275 mg): ${n} tab/día`,`2ª fase (${d2} dosis) · RH (R 150 + H 75 mg): ${n} tab/día`);}
  else if(w>=4){out.tabla="Tabla N° 12";const n=[1,2,3,4,5][banda(w,[7,11,15,20])];
    out.lin.push(`1ª fase (50 dosis) · RHZ dispersable (R 75 + H 50 + Z 150 mg): ${n} tab + E dispersable 100 mg: ${n} tab/día`,`2ª fase (${d2} dosis) · RH dispersable (R 75 + H 50 mg): ${n} tab/día`);}
  else{out.aviso.push("Peso menor de 4 kg: fuera de las Tablas N° 11 y 12, consultar al médico.");return out;}
  out.lin.push("Piridoxina 50 mg/día");
  if(sit==="grave")out.nota.push(`TB del SNC, pericarditis o miliar: prednisona 1–1.5 mg/kg/día = ${Math.round(w)}–${Math.round(w*1.5)} mg/día por 2 a 4 semanas, luego bajar 30 % cada semana.`);
  return out;
}
function calcular(r){const m=modoDe(r);if(m==="tpt")return Object.assign(calcTPT(r),{modo:m});if(m==="sens")return Object.assign(calcSens(r),{modo:m});
  return {modo:m,lin:[],aviso:[m?"Esquema para TB resistente u otro: lo indica el médico consultor (Tabla N° 10).":"Indique el tratamiento («con» para contactos o «sensible»)."],nota:[],tabla:"",esq:""};}

/* ======================= FECHAS ======================= */
function fechas(r,c){
  const ini=parseFecha(r.f_ini);if(!ini)return [];
  if(c.modo==="sens"&&c.fases){const f1=dosisLS(ini,c.fases[0]),i2=sigLS(f1),fin=dosisLS(ini,c.fases[0]+c.fases[1]);
    return [["Fin 1ª fase",fmtFecha(f1)],["Inicio 2ª fase",fmtFecha(i2)],["Término",fmtFecha(fin)]];}
  if(c.modo==="tpt"&&c.dur){if(c.dur.semanas)return [["Dosis",`cada ${DIAS[ini.getDay()]}`],["Última (12ª)",fmtFecha(masDias(ini,7*(c.dur.semanas-1)))]];
    return [["Término",fmtFecha(masMeses(ini,c.dur.meses))]];}
  return [];
}

/* ======================= TABLA ======================= */
function opcionesTto(v){const l=[...new Set(OPC_TTO.concat(v?[v]:[]))];return `<option value=""></option>`+l.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join("");}
function celdaSel(r,m){
  if(m==="tpt")return `<select data-k="tpt_ind" title="Tipo de caso índice del contacto">${Object.entries(IND).map(([k,t])=>`<option value="${k}" ${(r.tpt_ind||"ds")===k?'selected':''}>${t}</option>`).join("")}</select>`;
  if(m==="sens")return `<select data-k="tto_sit" title="Situación clínica (pág. 36)">${Object.entries(SIT).map(([k,t])=>`<option value="${k}" ${(r.tto_sit||"normal")===k?'selected':''}>${t}</option>`).join("")}</select>`;
  return `<span class="tpt-gris">—</span>`;}
function celdaEsq(r,c){
  if(c.modo==="tpt"){const ops=opcionesEsq(edadNum(r),r.tpt_ind||"ds");if(!ops.length)return `<span class="tpt-gris">No indicada</span>`;
    const auto=esqAuto(edadNum(r),r.tpt_ind||"ds");
    return `<select data-k="tpt_esq">${`<option value="">Automático${auto?" · "+auto:""}</option>`}${ops.map(o=>`<option value="${o}" ${r.tpt_esq===o?'selected':''}>${ESQ[o]}</option>`).join("")}</select>`;}
  if(c.modo==="sens")return `<span class="tpt-esq">${esc(c.esq)}</span>`;
  return `<span class="tpt-gris">—</span>`;}
function celdaDosis(c){
  return (c.lin.length?`<div class="tpt-lin">${c.lin.map(l=>`<div${/^Piridoxina/.test(l)?' class="piri"':""}>${esc(l)}</div>`).join("")}</div>`:"")+
    (c.frec&&c.lin.length?`<div class="tpt-frec">${esc(c.frec)}${c.tabla?` · <b>${esc(c.tabla)}</b>`:""}</div>`:"")+
    c.aviso.map(a=>`<div class="tpt-aviso">⚠ ${esc(a)}</div>`).join("")+c.nota.map(a=>`<div class="tpt-nota-l">${esc(a)}</div>`).join("");}
function celdaFechas(r,c){const f=fechas(r,c);if(!f.length)return r.f_ini?"":`<span class="tpt-gris">Ponga la fecha de inicio</span>`;return f.map(([k,v])=>`<div><span class="tpt-gris">${k}:</span> <b>${v}</b></div>`).join("");}
function filaTPT(r){const i=pacientes.indexOf(r),c=calcular(r);const e=edadDe(r);
  return `<tr data-i="${i}" data-id="${esc(r.id)}" class="m-${c.modo||'nd'}">
    <td class="num">${esc(r.n)}</td>
    <td class="tpt-nom"><div>${esc(r.nom||"(sin nombre)")}</div><small>DNI ${esc(r.dni||"—")}${r.dx?" · "+esc(r.dx):""}</small></td>
    <td class="calc" title="Edad desde DATOS">${esc(e||"—")}</td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center" class="${num(r.peso)==null?'invalid':''}" title="Peso en kg (se guarda también en DATOS)"></td>
    <td><select data-k="tto" title="Tratamiento (el mismo de DATOS)">${opcionesTto(r.tto)}</select></td>
    <td data-c="sel">${celdaSel(r,c.modo)}</td>
    <td data-c="esq">${celdaEsq(r,c)}</td>
    <td class="tpt-dosis" data-c="dosis">${celdaDosis(c)}</td>
    <td><input type="date" required data-k="f_ini" value="${(d=>d?iso(d):"")(parseFecha(r.f_ini))}" title="Fecha de inicio del tratamiento"></td>
    <td class="tpt-fechas" data-c="fechas">${celdaFechas(r,c)}</td>
    <td><input data-k="tpt_obs" value="${esc(r.tpt_obs)}" placeholder="—"></td>
  </tr>`;}
function lista(){const f=$('tptFiltro').value,q=normTxt($('tptBuscar').value).trim();
  return pacientes.filter(r=>{const m=modoDe(r);if(f!=="todos"&&m!==f)return false;return !q||normTxt([r.n,r.dni,r.hc,r.nom].join(" ")).includes(q);});}
function render(){if(!$('tpt').classList.contains('active'))return;const l=lista();
  $('tbodyTPT').innerHTML=l.map(filaTPT).join("");$('tptVacio').style.display=l.length?'none':'block';
  const tot=pacientes.filter(r=>modoDe(r)==="tpt").length,sen=pacientes.filter(r=>modoDe(r)==="sens").length;
  $('tptInfo').textContent=`${l.length} en la lista · ${tot} contacto(s) con TPT · ${sen} en esquema sensible`;}
function refrescarFila(tr){const r=pacientes[+tr.dataset.i];if(!r)return;const c=calcular(r);
  tr.className="m-"+(c.modo||"nd");tr.querySelector('[data-c=esq]').innerHTML=celdaEsq(r,c);tr.querySelector('[data-c=dosis]').innerHTML=celdaDosis(c);tr.querySelector('[data-c=fechas]').innerHTML=celdaFechas(r,c);}
let datosSucio=false;
$('tbodyTPT').addEventListener('input',e=>{const el=e.target,tr=el.closest('tr');if(!tr||el.dataset.k!=="peso"&&el.dataset.k!=="tpt_obs")return;const r=pacientes[+tr.dataset.i];
  r[el.dataset.k]=el.value.trim();if(el.dataset.k==="peso")el.classList.toggle('invalid',num(el.value)==null);guardarPacientes();datosSucio=true;refrescarFila(tr);});
$('tbodyTPT').addEventListener('change',e=>{const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k||el.dataset.k==="peso"||el.dataset.k==="tpt_obs")return;const r=pacientes[+tr.dataset.i];
  if(el.dataset.k==="f_ini")r.f_ini=deIso(el.value);else r[el.dataset.k]=el.value;
  if(el.dataset.k==="tpt_ind")r.tpt_esq=""; // otro caso índice: volver al esquema automático
  guardarPacientes();datosSucio=true;
  if(el.dataset.k==="tto"){const nuevo=document.createElement('tbody');nuevo.innerHTML=filaTPT(r);tr.replaceWith(nuevo.firstElementChild);msg(`N° ${r.n}: tratamiento «${r.tto||"—"}»`);}
  else{if(el.dataset.k==="tpt_ind")tr.querySelector('[data-c=sel]').innerHTML=celdaSel(r,modoDe(r));refrescarFila(tr);}});
$('tptFiltro').addEventListener('change',render);$('tptBuscar').addEventListener('input',render);

/* ======================= EXCEL ======================= */
function exportar(){if(typeof XLSX==="undefined"){msg("No se pudo cargar la librería de Excel (sin conexión)");return;}
  const cab=["N° Reg","Apellidos y Nombres","DNI","Edad","Peso (kg)","Tratamiento","Caso índice / Situación","Esquema","Dosis","Frecuencia","Tabla NTS 221-2024","Avisos","Inicio","Fechas","Observación"];
  const filas=lista().map(r=>{const c=calcular(r),m=c.modo;
    return [r.n,r.nom,r.dni,edadDe(r),r.peso,r.tto,m==="tpt"?IND[r.tpt_ind||"ds"]:m==="sens"?SIT[r.tto_sit||"normal"]:"",m==="tpt"?(ESQ[c.esq]||""):c.esq,c.lin.join(" | "),c.frec||"",c.tabla,c.aviso.concat(c.nota).join(" | "),r.f_ini,fechas(r,c).map(([k,v])=>k+": "+v).join(" | "),r.tpt_obs];});
  const ws=XLSX.utils.aoa_to_sheet([cab].concat(filas));ws['!cols']=[7,34,11,6,8,12,26,26,60,30,14,40,11,40,24].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"TPT");XLSX.writeFile(wb,"TPT_PCT.xlsx");msg("Excel exportado");}

/* ======================= ENLACES CON EL RESTO DE LA APP ======================= */
const showBase=window.showView;
window.showView=function(v){showBase(v);$('tabTPT').classList.toggle('active',v==='tpt');document.body.classList.toggle('ver-tpt',v==='tpt');if(v==='tpt')render();if(v==='datos'&&datosSucio){datosSucio=false;renderDatos();}};
const alCambiarBase=window.alCambiarPacientes;
window.alCambiarPacientes=function(){if(alCambiarBase)alCambiarBase();const a=document.activeElement;if(!(a&&a.closest&&a.closest('#tbodyTPT')))render();};
window.TPT={exportar,calcular,render};
})();
