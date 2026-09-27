/* Lógica de la aplicación: padrón, importar/exportar, hoja de evaluación y guardado local. */
/* ======================= DATOS INICIALES ======================= */
const DATA_INICIAL = [];
const ANT_OFT = ["AMETROPÍA","BLEFARITIS","CATARATA","CONJUNTIVITIS","ESTRABISMO","GLAUCOMA","RETINOPATÍA","TRAUMATISMOS"];
const ANT_GEN = ["ALERGIAS","CARDIOPATÍAS","COLAGENOPATÍAS","CONVULSIONES","DIABETES","ENDOCRINOPATÍAS","HIPERTENSIÓN","MIGRAÑA","NEUROPATÍAS","OPERACIONES","PSIQUIÁTRICOS","TEC / TRAUMA","TOXICOLOGÍA","TUBERCULOSIS","TUMORES"];
const COLS = ["n","hc","dni","ap","am","nom","sexo","fn","peso","talla","imc","edad","nombre","od","oi","ao","ao_od","ao_oi","ag","ag_p","ag_f","obs"];
const HEADERS = ["N°","HC","Número de Documento","Apellido Paterno","Apellido Materno","Nombres","Sexo","Fecha de Nacimiento","PESO","TALLA","IMC","Edad","Apellidos y Nombres","OD","OI","ANTECEDENTES OFTALMOLÓGICOS","AO OD","AO OI","ANTECEDENTES GENERALES","AG P","AG F","OBSERVACIÓN"];
const LS_PAC = "salud_ocular_pacientes_v1";
const LS_EVAL = "salud_ocular_evaluaciones_v1";

let pacientes = [];
let evaluaciones = {};
let numActual = null;

/* ======================= UTILIDADES ======================= */
function msg(t){const m=document.getElementById('msg');m.textContent=t;m.classList.add('show');clearTimeout(msg._t);msg._t=setTimeout(()=>m.classList.remove('show'),2200);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(v){if(v===""||v==null)return null;const n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n;}
function parseFecha(s){ // dd/mm/aaaa
  if(!s)return null;const m=String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(!m)return null;
  let y=parseInt(m[3]);if(y<100)y+=y<30?2000:1900;const d=new Date(y,parseInt(m[2])-1,parseInt(m[1]));
  return isNaN(d)?null:d;
}
function calcEdad(fn){const d=parseFecha(fn);if(!d)return "";const h=new Date();let e=h.getFullYear()-d.getFullYear();const m=h.getMonth()-d.getMonth();if(m<0||(m===0&&h.getDate()<d.getDate()))e--;return e<0?"":String(e);}
function calcIMC(p,t){const P=num(p),T=num(t);if(P==null||T==null||T<=0)return "";return (P/(T*T)).toFixed(2);}
function calcNombre(r){return [r.ap,r.am,r.nom].map(x=>String(x||"").trim()).filter(Boolean).join(" ");}
function hoy(){const d=new Date();return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
function nuevoRegistro(){return {id:uid(),n:"",hc:"",dni:"",ap:"",am:"",nom:"",sexo:"",fn:"",peso:"",talla:"",od:"",oi:"",ao:"",ao_od:"",ao_oi:"",ag:"",ag_p:"",ag_f:"",obs:""};}
function normalizar(r){const o=nuevoRegistro();for(const k in o){if(r[k]!=null)o[k]=r[k];}o.id=String(o.id||uid());o.n=parseInt(o.n);if(isNaN(o.n))o.n="";o.dni=String(o.dni||"").replace(/\D/g,"");return o;}

/* ======================= PERSISTENCIA ======================= */
function cargar(){
  try{const p=JSON.parse(localStorage.getItem(LS_PAC));if(Array.isArray(p)&&p.length)pacientes=p.map(normalizar);}catch(e){}
  if(!pacientes.length)pacientes=DATA_INICIAL.map(normalizar);
  try{evaluaciones=JSON.parse(localStorage.getItem(LS_EVAL))||{};}catch(e){evaluaciones={};}
}
function guardarPacientes(){try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarPacientes();}
function guardarEvaluaciones(){try{localStorage.setItem(LS_EVAL,JSON.stringify(evaluaciones));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarEvaluaciones();}

/* ======================= VISTAS ======================= */
function showView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));
  document.getElementById('tabDatos').classList.toggle('active',v==='datos');
  document.getElementById('tabEval').classList.toggle('active',v==='evaluacion');
  if(v==='evaluacion'){cargarPaciente(document.getElementById('numPac').value);}
}

/* ======================= TABLA DATOS ======================= */
function renderDatos(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const tb=document.getElementById('tbodyDatos');
  const rows=pacientes.map((r,i)=>({r,i})).filter(({r})=>{
    if(!q)return true;
    const s=[r.n,r.hc,r.dni,r.ap,r.am,r.nom,calcNombre(r),r.sexo,r.fn,r.ao,r.ag,r.obs].join(" ").toLowerCase();
    return s.includes(q);
  });
  const html=rows.map(({r,i})=>`
  <tr data-i="${i}" data-id="${esc(r.id)}">
    <td class="num"><input class="w-num" data-k="n" value="${esc(r.n)}" style="text-align:center;font-weight:bold"></td>
    <td><input data-k="hc" value="${esc(r.hc)}"></td>
    <td><input data-k="dni" value="${esc(r.dni)}" maxlength="8" inputmode="numeric" class="${r.dni&&r.dni.length!==8?'invalid':''}"></td>
    <td><input data-k="ap" value="${esc(r.ap)}"></td>
    <td><input data-k="am" value="${esc(r.am)}"></td>
    <td><input data-k="nom" value="${esc(r.nom)}"></td>
    <td><select data-k="sexo"><option value=""></option><option ${r.sexo==='Hombre'?'selected':''}>Hombre</option><option ${r.sexo==='Mujer'?'selected':''}>Mujer</option></select></td>
    <td><input data-k="fn" value="${esc(r.fn)}" placeholder="dd/mm/aaaa" class="${r.fn&&!parseFecha(r.fn)?'invalid':''}"></td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="talla" value="${esc(r.talla)}" inputmode="decimal" style="text-align:center"></td>
    <td class="calc" data-c="imc">${calcIMC(r.peso,r.talla)}</td>
    <td class="calc" data-c="edad">${calcEdad(r.fn)}</td>
    <td class="calc" data-c="nombre" style="text-align:left">${esc(calcNombre(r))}</td>
    <td><input data-k="od" value="${esc(r.od)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="oi" value="${esc(r.oi)}" inputmode="decimal" style="text-align:center"></td>
    <td><div class="ao-cell"><select data-k="ao"><option value=""></option>${ANT_OFT.map(a=>`<option ${r.ao===a?'selected':''}>${a}</option>`).join("")}</select><label title="Ojo derecho"><input type="checkbox" data-k="ao_od" ${r.ao_od==="X"?"checked":""}>OD</label><label title="Ojo izquierdo"><input type="checkbox" data-k="ao_oi" ${r.ao_oi==="X"?"checked":""}>OI</label></div></td>
    <td><div class="ao-cell"><select data-k="ag"><option value=""></option>${(ANT_GEN.includes(r.ag)||!r.ag?ANT_GEN:ANT_GEN.concat(r.ag)).map(a=>`<option ${r.ag===a?'selected':''}>${esc(a)}</option>`).join("")}</select><label title="Personales"><input type="checkbox" data-k="ag_p" ${r.ag_p==="X"?"checked":""}>P</label><label title="Familiares"><input type="checkbox" data-k="ag_f" ${r.ag_f==="X"?"checked":""}>F</label></div></td>
    <td><input data-k="obs" value="${esc(r.obs)}"></td>
    <td class="actions"><button title="Eliminar fila" onclick="delRow(${i})">✕</button></td>
  </tr>`).join("");
  tb.innerHTML=html;
  document.getElementById('emptyMsg').style.display=rows.length?'none':'block';
  document.getElementById('countInfo').textContent=`${rows.length} de ${pacientes.length} registros`;
}
document.getElementById('tbodyDatos').addEventListener('input',e=>{
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k||el.type==='checkbox')return;
  const r=pacientes[+tr.dataset.i];let v=el.value;
  if(el.dataset.k==='dni'){v=v.replace(/\D/g,"").slice(0,8);el.value=v;el.classList.toggle('invalid',v.length>0&&v.length!==8);}
  if(el.dataset.k==='n'){const n=parseInt(v);v=isNaN(n)?"":n;}
  if(el.dataset.k==='fn'){el.classList.toggle('invalid',!!v&&!parseFecha(v));}
  r[el.dataset.k]=v;
  tr.querySelector('[data-c=imc]').textContent=calcIMC(r.peso,r.talla);
  tr.querySelector('[data-c=edad]').textContent=calcEdad(r.fn);
  tr.querySelector('[data-c=nombre]').textContent=calcNombre(r);
  guardarPacientes();
});
document.getElementById('tbodyDatos').addEventListener('change',e=>{ // selects y casillas OD/OI
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k)return;
  if(el.type==='checkbox'){pacientes[+tr.dataset.i][el.dataset.k]=el.checked?"X":"";guardarPacientes();return;}
  if(el.tagName!=='SELECT')return;
  pacientes[+tr.dataset.i][el.dataset.k]=el.value;guardarPacientes();
});
function addRow(){
  const max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);
  const r=nuevoRegistro();r.n=max+1;pacientes.push(r);guardarPacientes();
  document.getElementById('search').value="";renderDatos();
  const wrap=document.getElementById('datosWrap');wrap.scrollTop=wrap.scrollHeight;
  const last=document.querySelector('#tbodyDatos tr:last-child input[data-k=hc]');if(last)last.focus();
  msg("Fila N° "+r.n+" agregada");
}
function delRow(i){
  const r=pacientes[i];if(!confirm(`¿Eliminar la fila N° ${r.n} (${calcNombre(r)||'sin nombre'})?`))return;
  pacientes.splice(i,1);guardarPacientes();renderDatos();msg("Fila eliminada");
}
function resetData(){
  if(!confirm("Se reemplazará el padrón actual por los datos originales del archivo. ¿Continuar?"))return;
  pacientes=DATA_INICIAL.map(normalizar);guardarPacientes();renderDatos();msg("Datos originales restaurados");
}

/* ======================= IMPORTAR / EXPORTAR ======================= */
function parseCSV(text){
  text=text.replace(/^﻿/,"");
  const first=text.split(/\r?\n/)[0]||"";
  const delim=(first.split(";").length>first.split(",").length)?";":(first.split("\t").length>first.split(",").length?"\t":",");
  const rows=[];let row=[],cur="",inq=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(inq){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++;}else inq=false;}else cur+=c;}
    else{if(c==='"')inq=true;else if(c===delim){row.push(cur);cur="";}else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur="";}else if(c==='\r'){}else cur+=c;}
  }
  if(cur!==""||row.length){row.push(cur);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""));
}
function filasAPacientes(rows){
  if(!rows.length)return [];
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");
  const hdr=rows[0].map(norm);
  const map={n:["n","no","num","numero","nro"],hc:["hc","historia","nhistoria","historiaclinica"],dni:["numerodedocumento","dni","documento","nrodocumento","numdoc"],ap:["apellidopaterno","appaterno","paterno"],am:["apellidomaterno","apmaterno","materno"],nom:["nombres","nombre"],sexo:["sexo","genero"],fn:["fechadenacimiento","fechanacimiento","fnac","nacimiento"],peso:["peso","pesokg"],talla:["talla","tallam"],od:["od","ojoderecho"],oi:["oi","ojoizquierdo"],ao:["antecedentesoftalmologicos","antecedentesoftamologicos","antoftalmologicos","oftalmologicos"],ao_od:["aood","antoftod","ojoderechoantecedente"],ao_oi:["aooi","antoftoi","ojoizquierdoantecedente"],ag:["antecedentesgenerales","antgenerales","generales"],ag_p:["agp","personales"],ag_f:["agf","familiares"],obs:["observacion","observaciones","obs"]};
  const idx={};let hits=0;
  for(const k in map){const j=hdr.findIndex(h=>map[k].includes(h));if(j>=0){idx[k]=j;hits++;}}
  let body=rows.slice(1);
  if(hits<4){ // sin encabezado reconocible: usar orden de columnas
    body=rows;COLS.forEach((k,j)=>{idx[k]=j;});delete idx.imc;delete idx.edad;delete idx.nombre;
    if(isNaN(parseInt(rows[0][0])))body=rows.slice(1);
  }
  const out=[];
  for(const r of body){const o=nuevoRegistro();for(const k in idx){let v=r[idx[k]];if(v==null)v="";o[k]=String(v).trim();}
    if(o.fn&&/^\d{4,5}$/.test(o.fn)){const d=new Date(Date.UTC(1899,11,30)+parseInt(o.fn)*86400000);o.fn=String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0")+"/"+d.getUTCFullYear();}
    if(o.n===""&&o.dni===""&&o.ap===""&&o.nom==="")continue;
    out.push(normalizar(o));}
  return out;
}
function importFile(inp){
  const f=inp.files[0];if(!f)return;inp.value="";
  const done=rows=>{
    const nuevos=filasAPacientes(rows);
    if(!nuevos.length){msg("No se encontraron registros válidos");return;}
    const modo=confirm(`Se leyeron ${nuevos.length} registros.\n\nAceptar = REEMPLAZAR el padrón actual\nCancelar = AGREGAR al padrón actual`);
    if(modo){pacientes=nuevos;}else{let max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);nuevos.forEach(r=>{if(r.n===""||pacientes.some(p=>p.n===r.n))r.n=++max;else max=Math.max(max,r.n);pacientes.push(r);});}
    guardarPacientes();renderDatos();msg(`${nuevos.length} registros importados`);
  };
  if(/\.(xlsx|xls)$/i.test(f.name)){
    if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Importe el archivo como CSV.");return;}
    const rd=new FileReader();rd.onload=e=>{const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});
      const name=wb.SheetNames.find(n=>/datos/i.test(n))||wb.SheetNames[0];
      let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:""});
      rows=rows.filter(r=>r.some(x=>String(x).trim()!==""));done(rows);};
    rd.readAsArrayBuffer(f);
  }else{
    const rd=new FileReader();rd.onload=e=>done(parseCSV(e.target.result));rd.readAsText(f,"UTF-8");
  }
}
function filaExport(r){return [r.n,r.hc,r.dni,r.ap,r.am,r.nom,r.sexo,r.fn,r.peso,r.talla,calcIMC(r.peso,r.talla),calcEdad(r.fn),calcNombre(r),r.od,r.oi,r.ao,r.ao_od,r.ao_oi,r.ag,r.ag_p,r.ag_f,r.obs];}
function descargar(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportCSV(){
  const q=v=>{v=String(v==null?"":v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[HEADERS.map(q).join(";")].concat(pacientes.map(r=>filaExport(r).map(q).join(";")));
  descargar(new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"Datos_Salud_Ocular.csv");msg("CSV exportado");
}
function exportXLSX(){
  if(typeof XLSX==="undefined"){msg("Sin librería Excel (sin conexión): se exporta CSV");exportCSV();return;}
  const aoa=[HEADERS].concat(pacientes.map(r=>filaExport(r).map((v,j)=>{ if([0,8,9,10,11,13,14].includes(j)){const n=num(v);return n==null?"":n;} return v;})));
  const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[6,8,14,16,16,24,8,14,8,8,8,6,34,6,6,26,7,7,26,6,6,26].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Datos");
  // Hoja de evaluaciones guardadas
  const evs=Object.keys(evaluaciones).sort((a,b)=>a-b);
  if(evs.length){const keys=[...new Set(evs.flatMap(k=>Object.keys(evaluaciones[k])))];
    const ws2=XLSX.utils.aoa_to_sheet([["N°",...keys]].concat(evs.map(k=>[parseInt(k),...keys.map(x=>evaluaciones[k][x]||"")])));
    XLSX.utils.book_append_sheet(wb,ws2,"Evaluaciones");}
  XLSX.writeFile(wb,"Datos_Salud_Ocular.xlsx");msg("Excel exportado");
}

/* ======================= EVALUACIÓN OCULAR ======================= */
const AUTO_KEYS={
  hc:r=>r.hc, dni:r=>r.dni, nombre:r=>calcNombre(r), edad:r=>calcEdad(r.fn), sexo:r=>r.sexo,
  peso:r=>r.peso, talla:r=>r.talla, imc:r=>calcIMC(r.peso,r.talla), od:r=>r.od, oi:r=>r.oi,
  dx1:r=>{const a=num(r.od),b=num(r.oi);return ((a!=null&&a>=50)||(b!=null&&b>=50))?"A":"N";}
};
function buscarPaciente(n){n=parseInt(n);if(isNaN(n))return null;return pacientes.find(r=>parseInt(r.n)===n)||null;}
function setAutos(r){
  document.querySelectorAll('#sheet [data-auto]').forEach(el=>{el.value=r?String(AUTO_KEYS[el.dataset.auto](r)??""):"";});
}
function campos(){return document.querySelectorAll('#sheet [data-f]');}
function leerForm(){
  const o={};campos().forEach(el=>{if(el.classList.contains('chk'))o[el.dataset.f]=el.classList.contains('on')?"X":"";else o[el.dataset.f]=el.value;});return o;
}
function escribirForm(o){
  document.querySelectorAll('#sheet input[data-f^="dx"][readonly]').forEach(el=>campoLibre(el,false));
  campos().forEach(el=>{const v=o&&o[el.dataset.f]!=null?o[el.dataset.f]:(el.dataset.f==='ev_nombre'?"Dra Mari Alba Mas":"");
    if(el.classList.contains('chk'))el.classList.toggle('on',v==="X");else el.value=v;});
}
function cargarPaciente(n){
  const r=buscarPaciente(n);numActual=r?parseInt(r.n):null;
  setAutos(r);
  const info=document.getElementById('evalInfo'),tag=document.getElementById('savedTag');
  if(!r){escribirForm(null);info.textContent=String(n||"").trim()?`N° ${n}: no existe en DATOS`:"Busque al paciente por DNI, N° o nombre, o escriba el N° en el formulario";tag.textContent="";return;}
  info.textContent=`N° ${r.n} · ${calcNombre(r)}`;
  const ev=evaluaciones[r.n];
  if(ev){escribirForm(ev);tag.textContent="✔ Evaluación guardada";}
  else{
    escribirForm(null);tag.textContent="";
    // marcar automáticamente la patología oftalmológica elegida en DATOS
    if(r.ao){const key=slug(r.ao),ambos=r.ao_od!=="X"&&r.ao_oi!=="X";const od=document.querySelector(`#sheet .chk[data-f="ao_${key}_od"]`),oi=document.querySelector(`#sheet .chk[data-f="ao_${key}_oi"]`);if(od&&(ambos||r.ao_od==="X"))od.classList.add('on');if(oi&&(ambos||r.ao_oi==="X"))oi.classList.add('on');}
    // marcar automáticamente el antecedente general elegido en DATOS (P = personales, F = familiares)
    if(r.ag){const key=slug(r.ag);const p=document.querySelector(`#sheet .chk[data-f="ag_${key}_p"]`),f=document.querySelector(`#sheet .chk[data-f="ag_${key}_f"]`);if(p&&r.ag_p==="X")p.classList.add('on');if(f&&r.ag_f==="X")f.classList.add('on');}
  }
  autoDxTodos();
}
function slug(s){return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");}
function guardarEval(){
  if(numActual==null){alert("Primero escriba un N° de paciente válido.");return;}
  evaluaciones[numActual]=leerForm();guardarEvaluaciones();
  document.getElementById('savedTag').textContent="✔ Evaluación guardada";msg(`Evaluación del N° ${numActual} guardada`);
}
function limpiarEval(){
  if(numActual!=null&&evaluaciones[numActual]){
    if(!confirm(`¿Borrar la evaluación guardada del N° ${numActual}?`))return;
    delete evaluaciones[numActual];guardarEvaluaciones();
  }
  cargarPaciente(document.getElementById('numPac').value);msg("Formulario limpio");
}
function navPaciente(dir){
  const ns=[...new Set(pacientes.map(r=>parseInt(r.n)).filter(n=>!isNaN(n)))].sort((a,b)=>a-b);
  if(!ns.length)return;
  let cur=parseInt(document.getElementById('numPac').value);let next;
  if(isNaN(cur))next=dir>0?ns[0]:ns[ns.length-1];
  else{const i=ns.indexOf(cur);
    if(i>=0)next=ns[Math.min(ns.length-1,Math.max(0,i+dir))];
    else{next=dir>0?(ns.find(n=>n>cur)??ns[ns.length-1]):([...ns].reverse().find(n=>n<cur)??ns[0]);}}
  document.getElementById('numPac').value=next;cargarPaciente(next);
}
/* ======================= BÚSQUEDA PREDICTIVA DE PACIENTES ======================= */
const bq=document.getElementById('buscarPac'),bqL=document.getElementById('buscarLista');let bqItems=[],bqSel=-1;
function normTxt(s){return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function sugerencias(q){
  const toks=normTxt(q).trim().split(/\s+/).filter(Boolean);if(!toks.length)return [];
  return pacientes.filter(r=>{const s=normTxt([r.n,r.dni,r.hc,calcNombre(r)].join(" "));return toks.every(t=>s.includes(t));})
    .sort((a,b)=>{const da=String(a.dni).startsWith(toks[0])||String(a.n)===toks[0],db=String(b.dni).startsWith(toks[0])||String(b.n)===toks[0];if(da!==db)return da?-1:1;return (parseInt(a.n)||0)-(parseInt(b.n)||0);})
    .slice(0,8);
}
function resaltar(txt,q){
  const toks=normTxt(q).trim().split(/\s+/).filter(Boolean);let out="",i=0;const n=normTxt(txt);
  while(i<txt.length){let hit=null;for(const t of toks){if(n.startsWith(t,i)&&(!hit||t.length>hit.length))hit=t;}
    if(hit){out+="<mark>"+esc(txt.slice(i,i+hit.length))+"</mark>";i+=hit.length;}else{out+=esc(txt[i]);i++;}}
  return out;
}
function renderSug(){
  const q=bq.value;bqItems=sugerencias(q);bqSel=bqItems.length?0:-1;
  if(!q.trim()){bqL.style.display="none";bqL.innerHTML="";return;}
  bqL.innerHTML=bqItems.length?bqItems.map((r,i)=>`<div class="bq-item${i===bqSel?' act':''}" data-i="${i}" role="option"><span class="bq-n">N° ${esc(r.n)}</span><span class="bq-nom">${resaltar(calcNombre(r)||"(sin nombre)",q)}</span><span class="bq-dni">DNI ${resaltar(r.dni||"—",q)}${evaluaciones[r.n]?' · <b>✔ evaluado</b>':''}</span></div>`).join("")
    :`<div class="bq-vacio">Sin coincidencias para “${esc(q)}”</div>`;
  bqL.style.display="block";
}
function elegirSug(i){const r=bqItems[i];if(!r)return;document.getElementById('numPac').value=r.n;cargarPaciente(r.n);bq.value="";bqL.style.display="none";msg(`Paciente N° ${r.n} · ${calcNombre(r)}`);}
bq.addEventListener('input',renderSug);
bq.addEventListener('focus',()=>{if(bq.value.trim())renderSug();});
bq.addEventListener('keydown',e=>{
  if(bqL.style.display!=="block")return;
  if(e.key==='ArrowDown'){e.preventDefault();bqSel=Math.min(bqItems.length-1,bqSel+1);}
  else if(e.key==='ArrowUp'){e.preventDefault();bqSel=Math.max(0,bqSel-1);}
  else if(e.key==='Enter'){e.preventDefault();elegirSug(bqSel);return;}
  else if(e.key==='Escape'){bqL.style.display="none";return;}
  else return;
  bqL.querySelectorAll('.bq-item').forEach((el,i)=>el.classList.toggle('act',i===bqSel));
  const act=bqL.querySelector('.bq-item.act');if(act)act.scrollIntoView({block:'nearest'});
});
bqL.addEventListener('mousedown',e=>{const it=e.target.closest('.bq-item');if(it){e.preventDefault();elegirSug(+it.dataset.i);}});
document.addEventListener('click',e=>{if(!e.target.closest('.bq'))bqL.style.display="none";});

/* ======================= MENÚ PREDICTIVO (lista flotante propia) ======================= */
const MP=document.createElement('div');MP.className='mp-lista no-print';document.body.appendChild(MP);
let mpInput=null,mpItems=[],mpSel=-1,mpSilencio=false;
function mpMostrar(input,opciones){
  if(mpSilencio)return;const q=input.value,toks=normTxt(q).trim().split(/\s+/).filter(Boolean);
  mpItems=opciones.filter(o=>toks.every(t=>normTxt(o).includes(t)));mpInput=input;mpSel=0;
  if(!mpItems.length){mpOcultar();return;}
  MP.innerHTML=mpItems.map((o,i)=>`<div class="mp-item${i?'':' act'}" data-i="${i}">${resaltar(o,q)}</div>`).join("");
  const r=input.getBoundingClientRect();MP.style.left=r.left+"px";MP.style.top=(r.bottom+3)+"px";MP.style.minWidth=Math.max(r.width,280)+"px";MP.style.display="block";
}
function mpOcultar(){MP.style.display="none";mpInput=null;}
function mpElegir(i){const el=mpInput,v=mpItems[i];if(!el||v==null)return;el.value=v;mpOcultar();mpSilencio=true;el.dispatchEvent(new Event('input',{bubbles:true}));mpSilencio=false;}
MP.addEventListener('mousedown',e=>{const it=e.target.closest('.mp-item');if(it){e.preventDefault();mpElegir(+it.dataset.i);}});
function activarPredictivo(input,opciones){
  input.addEventListener('focus',()=>mpMostrar(input,opciones));
  input.addEventListener('input',()=>mpMostrar(input,opciones));
  input.addEventListener('blur',()=>setTimeout(()=>{if(mpInput===input)mpOcultar();},150));
  input.addEventListener('keydown',e=>{
    if(MP.style.display!=="block"||mpInput!==input)return;
    if(e.key==='ArrowDown'){e.preventDefault();mpSel=Math.min(mpItems.length-1,mpSel+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();mpSel=Math.max(0,mpSel-1);}
    else if(e.key==='Enter'||e.key==='Tab'){if(e.key==='Enter')e.preventDefault();mpElegir(mpSel);return;}
    else if(e.key==='Escape'){mpOcultar();return;}
    else return;
    MP.querySelectorAll('.mp-item').forEach((el,i)=>el.classList.toggle('act',i===mpSel));
  });
}
window.addEventListener('scroll',mpOcultar,true);window.addEventListener('resize',mpOcultar);

/* ======================= DIAGNÓSTICOS: marcas, valores y CIE-10 automáticos ======================= */
const DX_OPCIONES=["Examen de los ojos y de la visión","Determinación de la agudeza visual","Trastorno de la refracción","Consejería en salud ocular"];
const DX_CIE={"examen de los ojos y de la vision":"Z01.0","trastorno de la refraccion":"H52.7"};
const DX_TIPO={"examen de los ojos y de la vision":"d","determinacion de la agudeza visual":"d","trastorno de la refraccion":"p","consejeria en salud ocular":"d"}; // marca automática P / D / R
document.querySelectorAll('#sheet input[data-f$="_txt"]').forEach(el=>{if(/^dx\d_txt$/.test(el.dataset.f))activarPredictivo(el,DX_OPCIONES);});
function campoAuto(el,valor){el.value=valor==null?"":String(valor);el.readOnly=true;el.classList.add('auto');el.tabIndex=-1;}
function campoLibre(el,limpiar){if(el.readOnly){el.readOnly=false;el.classList.remove('auto');el.tabIndex=0;if(limpiar)el.value="";}}
function autoDx(n,forzar){
  const r=buscarPaciente(numActual);const g=k=>document.querySelector(`#sheet [data-f="dx${n}_${k}"]`);
  const key=normTxt(g('txt').value).trim();const v=[g('v1'),g('v2'),g('v3')];
  if(key.startsWith("examen de los ojos")){campoAuto(v[0],r?AUTO_KEYS.dx1(r):"");campoLibre(v[1],forzar);campoLibre(v[2],forzar);} // A = alterado, N = normal (fórmula del Excel)
  else if(key.startsWith("determinacion de la agudeza")){campoAuto(v[0],r?r.od:"");campoAuto(v[1],r?r.oi:"");campoLibre(v[2],forzar);} // OD / OI desde la hoja DATOS
  else if(key.startsWith("trastorno de la refraccion")){campoAuto(v[0],r&&AUTO_KEYS.dx1(r)==="A"?"RF":"");campoLibre(v[1],forzar);campoLibre(v[2],forzar);} // RF solo si OD u OI >= 50, igual que la A del examen
  else v.forEach(el=>campoLibre(el,forzar));
  if(!key)return;
  if(DX_CIE[key]&&(forzar||!g('cie').value.trim()))g('cie').value=DX_CIE[key];
  if(forzar&&DX_TIPO[key]){["p","d","r"].forEach(k=>g(k).classList.toggle('on',k===DX_TIPO[key]));}
}
function autoDxTodos(){for(let n=1;n<=5;n++)autoDx(n,false);}
document.getElementById('sheet').addEventListener('input',e=>{const m=/^dx(\d)_txt$/.exec(e.target.dataset.f||"");if(m)autoDx(+m[1],true);});

/* ======================= CALENDARIO PARA LA FECHA ======================= */
(function(){
  const txt=document.querySelector('#sheet [data-f="fecha"]'),cal=document.getElementById('calFecha'),btn=document.getElementById('btnCal');
  function abrir(){
    const d=parseFecha(txt.value)||new Date();
    cal.value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    try{cal.showPicker();}catch(e){cal.focus();cal.click();}
  }
  cal.addEventListener('change',()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(cal.value);if(!m)return;txt.value=m[3]+"/"+m[2]+"/"+m[1];txt.dispatchEvent(new Event('input',{bubbles:true}));});
  btn.addEventListener('click',abrir);
  txt.addEventListener('dblclick',abrir);
  txt.addEventListener('blur',()=>{ // normalizar 5/9/26 -> 05/09/2026
    const d=parseFecha(txt.value);if(d)txt.value=String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
  });
})();

document.getElementById('numPac').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,"");cargarPaciente(e.target.value);});
document.getElementById('sheet').addEventListener('click',e=>{
  const c=e.target.closest('.chk');if(!c)return;c.classList.toggle('on');
  if(c.dataset.f==='trat_si'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_no]').classList.remove('on');
  if(c.dataset.f==='trat_no'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_si]').classList.remove('on');
});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key.toLowerCase()==='s'&&document.getElementById('evaluacion').classList.contains('active')){e.preventDefault();guardarEval();}
});

/* ======================= INICIO ======================= */
cargar();renderDatos();escribirForm(null);

/* ======================= APP INSTALABLE (PWA) ======================= */
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
