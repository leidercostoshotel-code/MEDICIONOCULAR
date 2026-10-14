/* Lógica de la aplicación: padrón, importar/exportar, hoja de evaluación y guardado local. */
/* ======================= DATOS INICIALES ======================= */
const DATA_INICIAL = [];
const ANT_OFT = ["AMETROPÍA","BLEFARITIS","CATARATA","CONJUNTIVITIS","ESTRABISMO","GLAUCOMA","RETINOPATÍA","TRAUMATISMOS"];
const ANT_GEN = ["ALERGIAS","CARDIOPATÍAS","COLAGENOPATÍAS","CONVULSIONES","DIABETES","ENDOCRINOPATÍAS","HIPERTENSIÓN","MIGRAÑA","NEUROPATÍAS","OPERACIONES","PSIQUIÁTRICOS","TEC / TRAUMA","TOXICOLOGÍA","TUBERCULOSIS","TUMORES"];
const COLS = ["n","hc","dni","ap","am","nom","sexo","fn","t","fr","fc","pa","sat","peso","talla","imc","edad","nombre","od","oi","resultado","ao","ao_od","ao_oi","ag","ag_p","ag_f","obs"];
const HEADERS = ["N°","HC","Número de Documento","Apellido Paterno","Apellido Materno","Nombres","Sexo","Fecha de Nacimiento","T","FR","FC","PA","SAT","PESO","TALLA","IMC","Edad","Apellidos y Nombres","OD","OI","RESULTADO","ANTECEDENTES OFTALMOLÓGICOS","AO OD","AO OI","ANTECEDENTES GENERALES","AG P","AG F","OBSERVACIÓN"];
const LS_PAC = "salud_ocular_pacientes_v1";
const LS_EVAL = "salud_ocular_evaluaciones_v1";

let pacientes = [];
let evaluaciones = {};
let numActual = null;
let tAuto = null; // guardado automático pendiente de la evaluación

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
// Agudeza visual: ALTERADO si OD u OI es mayor o igual a 50 (criterio indicado por el establecimiento); sin medidas = vacío
function calcResultado(r){const a=num(r.od),b=num(r.oi);if(a==null&&b==null)return "";return ((a!=null&&a>=50)||(b!=null&&b>=50))?"ALTERADO":"NO ALTERADO";}
function celdaResultado(r){const v=calcResultado(r);return v?`<span class="res ${v==="ALTERADO"?"alt":"ok"}">${v}</span>`:"";}
function calcNombre(r){return [r.ap,r.am,r.nom].map(x=>String(x||"").trim()).filter(Boolean).join(" ");}
function hoy(){const d=new Date();return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
function nuevoRegistro(){return {id:uid(),n:"",hc:"",dni:"",ap:"",am:"",nom:"",sexo:"",fn:"",t:"",fr:"",fc:"",pa:"",sat:"",peso:"",talla:"",od:"",oi:"",ao:"",ao_od:"",ao_oi:"",ag:"",ag_p:"",ag_f:"",obs:""};}
function normalizar(r){const o=nuevoRegistro();for(const k in o){if(r[k]!=null)o[k]=r[k];}o.id=String(o.id||uid());o.n=parseInt(o.n);if(isNaN(o.n))o.n="";o.dni=String(o.dni||"").replace(/\D/g,"");return o;}

// Examen físico en DATOS: T, FR, FC, PA y SAT (los mismos de la hoja de evaluación, campos ef_*)
const VITALES=["t","fr","fc","pa","sat"];
function vital(r,k){const v=String(r[k]??"").trim();if(v)return v;const e=evaluaciones[r.n];return e?String(e["ef_"+k]??"").trim():"";} // evaluaciones antiguas: se muestra lo que ya tenían
function normPA(v){return String(v).replace(/\s*[ .,\-*]\s*/g,"/").replace(/\/+/g,"/");} // 110.70 / 110 70 -> 110/70 (teclado numérico del celular)

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
    const s=[r.n,r.hc,r.dni,r.ap,r.am,r.nom,calcNombre(r),r.sexo,r.fn,calcResultado(r),r.ao,r.ag,r.obs].join(" ").toLowerCase();
    return s.includes(q);
  });
  const html=rows.map(({r,i})=>`
  <tr data-i="${i}" data-id="${esc(r.id)}">
    <td class="num"><input class="w-num" data-k="n" value="${esc(r.n)}" style="text-align:center;font-weight:bold"></td>
    <td><input data-k="hc" value="${esc(r.hc)}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" title="Solo números"></td>
    <td><input data-k="dni" value="${esc(r.dni)}" maxlength="8" inputmode="numeric" pattern="[0-9]*" autocomplete="off" title="Solo números (8 dígitos)" class="${r.dni&&r.dni.length!==8?'invalid':''}"></td>
    <td><input data-k="ap" value="${esc(r.ap)}"></td>
    <td><input data-k="am" value="${esc(r.am)}"></td>
    <td><input data-k="nom" value="${esc(r.nom)}"></td>
    <td><select data-k="sexo"><option value=""></option><option ${r.sexo==='Hombre'?'selected':''}>Hombre</option><option ${r.sexo==='Mujer'?'selected':''}>Mujer</option></select></td>
    <td><input data-k="fn" value="${esc(r.fn)}" placeholder="dd/mm/aaaa" class="${r.fn&&!parseFecha(r.fn)?'invalid':''}"></td>
    <td><input data-k="t" value="${esc(vital(r,'t'))}" inputmode="decimal" autocomplete="off" style="text-align:center" title="Temperatura (°C)"></td>
    <td><input data-k="fr" value="${esc(vital(r,'fr'))}" inputmode="numeric" autocomplete="off" style="text-align:center" title="Frecuencia respiratoria"></td>
    <td><input data-k="fc" value="${esc(vital(r,'fc'))}" inputmode="numeric" autocomplete="off" style="text-align:center" title="Frecuencia cardiaca"></td>
    <td><input data-k="pa" value="${esc(vital(r,'pa'))}" inputmode="decimal" autocomplete="off" style="text-align:center" title="Presión arterial, ej. 110/70 (en el celular también 110.70)"></td>
    <td><input data-k="sat" value="${esc(vital(r,'sat'))}" inputmode="numeric" autocomplete="off" style="text-align:center" title="Saturación de oxígeno (%)"></td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="talla" value="${esc(r.talla)}" inputmode="decimal" style="text-align:center"></td>
    <td class="calc" data-c="imc">${calcIMC(r.peso,r.talla)}</td>
    <td class="calc" data-c="edad">${calcEdad(r.fn)}</td>
    <td class="calc" data-c="nombre" style="text-align:left">${esc(calcNombre(r))}</td>
    <td><input data-k="od" value="${esc(r.od)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="oi" value="${esc(r.oi)}" inputmode="decimal" style="text-align:center"></td>
    <td class="calc" data-c="resultado">${celdaResultado(r)}</td>
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
  if(el.dataset.k==='hc'){const c=v.replace(/\D/g,"");if(c!==v){v=c;el.value=v;}} // HC: solo números
  if(el.dataset.k==='dni'){v=v.replace(/\D/g,"").slice(0,8);el.value=v;el.classList.toggle('invalid',v.length>0&&v.length!==8);}
  if(el.dataset.k==='n'){const n=parseInt(v);v=isNaN(n)?"":n;}
  if(el.dataset.k==='fn'){el.classList.toggle('invalid',!!v&&!parseFecha(v));}
  if(el.dataset.k==='pa'){const c=normPA(v);if(c!==v){v=c;el.value=v;}}
  r[el.dataset.k]=v;
  if(VITALES.includes(el.dataset.k)){const ev=evaluaciones[r.n];if(ev){ev["ef_"+el.dataset.k]=v;guardarEvaluaciones();}} // misma dato en la evaluación
  tr.querySelector('[data-c=imc]').textContent=calcIMC(r.peso,r.talla);
  tr.querySelector('[data-c=edad]').textContent=calcEdad(r.fn);
  tr.querySelector('[data-c=nombre]').textContent=calcNombre(r);
  tr.querySelector('[data-c=resultado]').innerHTML=celdaResultado(r);
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
  const map={n:["n","no","num","numero","nro"],hc:["hc","historia","nhistoria","historiaclinica"],dni:["numerodedocumento","dni","documento","nrodocumento","numdoc"],ap:["apellidopaterno","appaterno","paterno"],am:["apellidomaterno","apmaterno","materno"],nom:["nombres","nombre"],sexo:["sexo","genero"],fn:["fechadenacimiento","fechanacimiento","fnac","nacimiento"],peso:["peso","pesokg"],talla:["talla","tallam"],od:["od","ojoderecho"],oi:["oi","ojoizquierdo"],ao:["antecedentesoftalmologicos","antecedentesoftamologicos","antoftalmologicos","oftalmologicos"],ao_od:["aood","antoftod","ojoderechoantecedente"],ao_oi:["aooi","antoftoi","ojoizquierdoantecedente"],ag:["antecedentesgenerales","antgenerales","generales"],ag_p:["agp","personales"],ag_f:["agf","familiares"],obs:["observacion","observaciones","obs"],t:["t","temperatura","temp"],fr:["fr","frecuenciarespiratoria"],fc:["fc","frecuenciacardiaca"],pa:["pa","presionarterial"],sat:["sat","saturacion","sato2","spo2"]};
  const idx={};let hits=0;
  for(const k in map){const j=hdr.findIndex(h=>map[k].includes(h));if(j>=0){idx[k]=j;hits++;}}
  let body=rows.slice(1);
  if(hits<4){ // sin encabezado reconocible: usar orden de columnas
    body=rows;COLS.forEach((k,j)=>{idx[k]=j;});delete idx.imc;delete idx.edad;delete idx.nombre;delete idx.resultado;
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
function filaExport(r){return [r.n,r.hc,r.dni,r.ap,r.am,r.nom,r.sexo,r.fn,...VITALES.map(k=>vital(r,k)),r.peso,r.talla,calcIMC(r.peso,r.talla),calcEdad(r.fn),calcNombre(r),r.od,r.oi,calcResultado(r),r.ao,r.ao_od,r.ao_oi,r.ag,r.ag_p,r.ag_f,r.obs];}
function descargar(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportCSV(){
  const q=v=>{v=String(v==null?"":v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[HEADERS.map(q).join(";")].concat(pacientes.map(r=>filaExport(r).map(q).join(";")));
  descargar(new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"Datos_Salud_Ocular.csv");msg("CSV exportado");
}
/* Excel con formato (ExcelJS, incluido en lib/): encabezado en color, bordes, encabezado inmovilizado, filtros y RESULTADO en color */
function cargarExcelJS(){if(window.ExcelJS)return Promise.resolve(window.ExcelJS);
  return cargarExcelJS._p||(cargarExcelJS._p=new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='lib/exceljs.min.js';
    sc.onload=()=>window.ExcelJS?ok(window.ExcelJS):no(new Error('ExcelJS'));sc.onerror=()=>{cargarExcelJS._p=null;no(new Error('sin conexión'));};document.head.appendChild(sc);}));}
async function excelConFormato(hojas,nombre){
  const ExcelJS=await cargarExcelJS();const wb=new ExcelJS.Workbook();wb.creator="Salud Ocular";wb.created=new Date();
  const relleno=c=>({type:'pattern',pattern:'solid',fgColor:{argb:c}});const linea=c=>({style:'thin',color:{argb:c}});
  const bordes={top:linea('FF9FB3C8'),left:linea('FF9FB3C8'),bottom:linea('FF9FB3C8'),right:linea('FF9FB3C8')};
  for(const h of hojas){
    const n=h.cab.length,ws=wb.addWorksheet(h.nombre,{views:[{state:'frozen',xSplit:h.fijarCols||0,ySplit:1,activeCell:'A2',showGridLines:true}]});
    ws.columns=h.cab.map((t,j)=>({header:t,width:(h.anchos&&h.anchos[j])||14}));
    h.filas.forEach(f=>ws.addRow(f.map(v=>v===""||v==null?null:v)));
    const cab=ws.getRow(1);cab.height=34;
    for(let j=1;j<=n;j++){const c=cab.getCell(j);c.fill=relleno('FF1F4E79');c.font={name:'Calibri',size:11,bold:true,color:{argb:'FFFFFFFF'}};
      c.alignment={vertical:'middle',horizontal:'center',wrapText:true};c.border={top:linea('FF0D2F4F'),left:linea('FF0D2F4F'),bottom:{style:'medium',color:{argb:'FF0D2F4F'}},right:linea('FF0D2F4F')};}
    for(let i=2;i<=ws.rowCount;i++){const row=ws.getRow(i);row.height=18;
      for(let j=1;j<=n;j++){const c=row.getCell(j);c.border=bordes;c.font={name:'Calibri',size:11};
        c.alignment={vertical:'middle',horizontal:(h.centrar||[]).includes(j-1)?'center':'left'};
        if((h.calculadas||[]).includes(j-1))c.fill=relleno('FFEEF3F8');
        if(h.formatos&&h.formatos[j-1])c.numFmt=h.formatos[j-1];}
      if(h.resultado!=null){const c=row.getCell(h.resultado+1);
        if(c.value==="ALTERADO"){c.fill=relleno('FFFDECEA');c.font={name:'Calibri',size:11,bold:true,color:{argb:'FFB00020'}};}
        else if(c.value==="NO ALTERADO"){c.fill=relleno('FFE6F4EA');c.font={name:'Calibri',size:11,bold:true,color:{argb:'FF1A7F37'}};}}}
    ws.autoFilter={from:{row:1,column:1},to:{row:1,column:n}};
    ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.3,right:.3,top:.4,bottom:.4,header:.2,footer:.2}};
    ws.pageSetup.printTitlesRow='1:1';
  }
  const buf=await wb.xlsx.writeBuffer();
  descargar(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),nombre);
}
const NUM_COLS=[0,13,14,15,16,18,19],VIT_COLS=[8,9,10,12]; // N°, peso, talla, IMC, edad, OD, OI | T, FR, FC, SAT (número solo si es un número)
function filasDatosExcel(){return pacientes.map(r=>filaExport(r).map((v,j)=>{if(NUM_COLS.includes(j)){const x=num(v);return x==null?"":x;}
  if(VIT_COLS.includes(j)&&/^\s*\d+([.,]\d+)?\s*%?\s*$/.test(v))return num(v);return v;}));}
async function exportXLSX(){
  const hojas=[{nombre:"Datos",cab:HEADERS,filas:filasDatosExcel(),anchos:[6,10,14,16,16,24,9,13,7,6,6,9,6,9,9,8,7,36,7,7,15,24,7,7,24,6,6,28],
    centrar:[0,1,2,6,7,8,9,10,11,12,13,14,15,16,18,19,20,22,23,25,26],calculadas:[15,16,17],resultado:20,formatos:{15:'0.00'}}];
  const he=hojaEvaluaciones();if(he)hojas.push(he); // evaluaciones guardadas, una fila por paciente
  await descargarExcel(hojas,"Datos_Salud_Ocular.xlsx");
}
async function descargarExcel(hojas,nombre){
  msg("Preparando Excel…");
  try{await excelConFormato(hojas,nombre);msg("Excel exportado");return;}
  catch(e){console.error(e);}
  // respaldo sin formato si no se pudo cargar ExcelJS
  if(typeof XLSX==="undefined"){msg("Sin librería Excel (sin conexión): se exporta CSV");exportCSV();return;}
  const wb=XLSX.utils.book_new();
  hojas.forEach(h=>{const ws=XLSX.utils.aoa_to_sheet([h.cab].concat(h.filas));if(h.anchos)ws['!cols']=h.anchos.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,h.nombre);});
  XLSX.writeFile(wb,nombre);msg("Excel exportado (sin formato)");
}
/* Excel de EVALUACIÓN OCULAR: una fila por evaluación guardada, con las secciones de la hoja en columnas legibles */
const EX_SEC=[["PÁRPADOS",["INFLAMACIÓN","ENROJECIMIENTO","LAGRIMEO","ARDOR / ESCOZOR"]],["PESTAÑAS",["DESCAMACIÓN / ESCOZOR","CAÍDA","DESVIACIÓN"]],
  ["CONJUNTIVA",["ENROJECIMIENTO","ARDOR / ESCOZOR","SECRECIÓN"]],["ESCLERÓTICA",["ENROJECIMIENTO / MANCHA","DOLOR OCULAR","SENSIBILIDAD A LA LUZ","LAGRIMEO / SEQUEDAD"]],
  ["CÓRNEA",["OPACIDAD","DOLOR OCULAR","SENSIBILIDAD A LA LUZ","VISIÓN BORROSA"]],["IRIS",["VISIÓN BORROSA / DOBLE","DOLOR OCULAR"]],["PUPILA",["VISIÓN BORROSA / DOBLE","DOLOR OCULAR"]]];
function evVacia(e){return !Object.keys(e).some(k=>k!=="ev_nombre"&&String(e[k]||"").trim()!=="");}
function exUnir(a,sep){return a.map(x=>String(x==null?"":x).trim()).filter(Boolean).join(sep||"; ");}
function exMarcas(e,lista,pre,sufs,etq){ // ANTECEDENTES: "AMETROPÍA (OD, OI)"
  return exUnir(lista.map(a=>{const k=slug(a),m=sufs.filter(x=>e[`${pre}_${k}_${x}`]==="X");return m.length?`${a} (${m.map((x,i)=>etq[sufs.indexOf(x)]).join(", ")})`:"";}));
}
function exSeccion(e,s,items){ // III. EXAMEN OCULAR EXTERNO: lo marcado SI (u ojo descrito) y OTROS
  const g=k=>String(e[k]||"").trim(),out=[];let no=false;
  [...items,"OTROS"].forEach((nom,i)=>{const b=`s${s}_${i+1}`,si=e[b+"_si"]==="X",od=g(b+"_od"),oi=g(b+"_oi"),txt=nom==="OTROS"?g(b+"_txt"):"";
    if(e[b+"_no"]==="X")no=true;
    if(si||od||oi||txt){const ojos=exUnir([od&&"OD: "+od,oi&&"OI: "+oi],", ");out.push((nom==="OTROS"?"OTROS"+(txt?": "+txt:""):nom)+(ojos?` (${ojos})`:""));}});
  return out.length?out.join("; "):(no?"Sin alteraciones":"");
}
function exDx(e,n){const g=k=>String(e[`dx${n}_${k}`]||"").trim();if(!g('txt')&&!g('cie'))return "";
  const t=["p","d","r"].filter(k=>e[`dx${n}_${k}`]==="X").map(k=>k.toUpperCase()).join("/");
  return exUnir([g('txt'),t,exUnir([g('v1'),g('v2'),g('v3')]," "),g('cie')&&"CIE "+g('cie')]," · ");}
const EX_COLS=[ // [cabecera, ancho, valor, tipo] tipo: n = número, c = centrado, r = RESULTADO
  ["N°",6,(e,r,n)=>n,"n"],["HC",10,(e,r)=>r.hc,"c"],["DNI",11,(e,r)=>r.dni,"c"],["Apellidos y Nombres",34,(e,r)=>calcNombre(r)],["Edad",6,(e,r)=>calcEdad(r.fn),"n"],["Sexo",8,(e,r)=>r.sexo,"c"],
  ["OD",6,(e,r)=>r.od,"n"],["OI",6,(e,r)=>r.oi,"n"],["RESULTADO",15,(e,r)=>calcResultado(r),"r"],["Fecha evaluación",12,e=>e.fecha,"c"],
  ["Antecedentes oftalmológicos",30,e=>exMarcas(e,ANT_OFT,"ao",["od","oi"],["OD","OI"])],["Antecedentes generales",30,e=>exMarcas(e,ANT_GEN,"ag",["p","f"],["P","F"])],
  ["Especificar antecedentes",40,e=>exUnir(Object.keys(e).filter(k=>/^ant_especificar\d*$/.test(k)).sort((x,y)=>(+x.slice(15)||1)-(+y.slice(15)||1)).map(k=>e[k])," ")],
  ["T°",6,e=>e.ef_t,"c"],["FR",6,e=>e.ef_fr,"c"],["FC",6,e=>e.ef_fc,"c"],["PA",8,e=>e.ef_pa,"c"],["SatO2",7,e=>e.ef_sat,"c"],["PAB",7,e=>e.ef_pab,"c"],
  ["AV OD con lentes",9,e=>e.av_od_con,"c"],["AV OD estenopeico",10,e=>e.av_od_est,"c"],["AV OI con lentes",9,e=>e.av_oi_con,"c"],["AV OI estenopeico",10,e=>e.av_oi_est,"c"],
  ...EX_SEC.map(([nom,it],i)=>[nom.charAt(0)+nom.slice(1).toLowerCase(),26,e=>exSeccion(e,i+1,it)]),
  ...[1,2,3,4,5].map(n=>["Diagnóstico "+n,40,e=>exDx(e,n)]),
  ["Plan de trabajo",28,e=>exUnir([e.plan1,e.plan2,e.plan3])],["Exámenes auxiliares",28,e=>exUnir([e.exa1,e.exa2,e.exa3])],
  ["Tratamiento",11,e=>e.trat_si==="X"?"SI":e.trat_no==="X"?"NO":"","c"],
  ["Medicamentos",40,e=>exUnir([1,2,3].map(i=>exUnir([e["med"+i],e["pres"+i],e["dosis"+i],e["dur"+i]]," - ")))],
  ["Referencia",26,e=>exUnir([e.ref_eess&&"EE.SS: "+e.ref_eess,e.ref_hospital&&"HOSPITAL: "+e.ref_hospital,e.ref_instituto&&"INSTITUTO: "+e.ref_instituto])],
  ["Evaluador",24,e=>e.ev_nombre],["Profesión",16,e=>e.ev_profesion],["EE.SS del evaluador",20,e=>e.ev_eess]];
function hojaEvaluaciones(){
  const ns=Object.keys(evaluaciones).map(k=>parseInt(k)).filter(n=>!isNaN(n)&&evaluaciones[n]&&!evVacia(evaluaciones[n])).sort((a,b)=>a-b);
  if(!ns.length)return null;
  let filas=ns.map(n=>{const e=evaluaciones[n],r=buscarPaciente(n)||{};
    return EX_COLS.map(c=>{const v=c[2](e,r,n);if(c[3]==="n"){const x=num(v);return x==null?"":x;}return v==null?"":String(v).trim();});});
  const usar=EX_COLS.map((c,j)=>j<10||filas.some(f=>f[j]!==""));// datos del paciente siempre; el resto solo si tiene algo
  const cols=EX_COLS.filter((c,j)=>usar[j]);filas=filas.map(f=>f.filter((v,j)=>usar[j]));
  return {nombre:"Evaluaciones",cab:cols.map(c=>c[0]),filas,anchos:cols.map(c=>c[1]),fijarCols:4,
    centrar:cols.map((c,j)=>c[3]?j:-1).filter(j=>j>=0),resultado:cols.findIndex(c=>c[3]==="r")};
}
async function exportEvaluacionesXLSX(){
  if(tAuto)guardarAhora();
  const he=hojaEvaluaciones();if(!he){alert("Todavía no hay evaluaciones guardadas para exportar.");return;}
  await descargarExcel([he],"Evaluaciones_Salud_Ocular.xlsx");
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
  PARRAFOS.forEach(P=>P.preparar(o)); // líneas extra de ESPECIFICAR
  campos().forEach(el=>{const f=el.dataset.f,v=o&&o[f]!=null?o[f]:(f==='ev_nombre'?"Dra. Mari Alva Mas":esNo(f)?"X":""); // evaluación nueva: NO marcado en el examen externo
    if(el.classList.contains('chk'))el.classList.toggle('on',v==="X");else el.value=v;});
  syncTodoNo();
  if(ajustarParrafos()&&o&&numActual!=null)autoGuardar(); // texto antiguo de una sola línea: se reacomoda y se guarda así
}
function ponerVitales(r){ // T, FR, FC, PA y SAT escritos en DATOS pasan a la hoja; devuelve true si cambió algo
  let c=false;if(r)VITALES.forEach(k=>{const v=String(r[k]??"").trim(),el=document.querySelector(`#sheet [data-f="ef_${k}"]`);if(v&&el.value!==v){el.value=v;c=true;}});return c;
}
function cargarPaciente(n){
  if(tAuto)guardarAhora(); // guardar lo escrito del paciente anterior antes de cambiar
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
  if(ponerVitales(r)&&ev)autoGuardar(); // T, FR, FC, PA y SAT desde DATOS
  autoDxTodos();
}
function slug(s){return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"");}
/* Guardado automático: cada cambio del formulario se guarda solo (antes se perdía al pasar a otro paciente sin pulsar Guardar) */
function autoGuardar(){if(numActual==null)return;document.getElementById('savedTag').textContent="Guardando…";clearTimeout(tAuto);tAuto=setTimeout(guardarAhora,400);}
function guardarAhora(){
  clearTimeout(tAuto);tAuto=null;if(numActual==null)return;
  evaluaciones[numActual]=leerForm();guardarEvaluaciones();
  const d=new Date();document.getElementById('savedTag').textContent=`✔ Guardado ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function guardarEval(){
  if(numActual==null){alert("Primero escriba un N° de paciente válido.");return;}
  guardarAhora();msg(`Evaluación del N° ${numActual} guardada`);
}
function limpiarEval(){
  const pend=tAuto!=null;clearTimeout(tAuto);tAuto=null;
  if(numActual!=null&&(evaluaciones[numActual]||pend)){
    if(!confirm(`¿Borrar la evaluación guardada del N° ${numActual}?`)){if(pend)guardarAhora();return;}
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

/* ======================= DIAGNÓSTICOS: marcas, valores y CIE-10 automáticos ======================= */
const DX_OPCIONES=["Examen de los ojos y de la visión","Determinación de la agudeza visual","Trastorno de la refracción","Consejería en salud ocular"];
const DX_CIE={"examen de los ojos y de la vision":"Z01.0","determinacion de la agudeza visual":"99173","trastorno de la refraccion":"H52.7","consejeria en salud ocular":"9940116"}; // mismos códigos que el REGISTRO HIS
const DX_TIPO={"examen de los ojos y de la vision":"d","determinacion de la agudeza visual":"d","trastorno de la refraccion":"p","consejeria en salud ocular":"d"}; // marca automática P / D / R
// Búsqueda de diagnósticos por código o nombre: salud ocular, códigos propios y los 15 082 de CIE-10 (his.js)
const DX_ETIQUETA={Z010:DX_OPCIONES[0],"99173":DX_OPCIONES[1],H527:DX_OPCIONES[2],"9940116":DX_OPCIONES[3]};
function codCIE(c){c=String(c||"").toUpperCase().replace(/\s/g,"");return /^[A-Z]\d{2}[0-9A-Z]+$/.test(c)?c.slice(0,3)+"."+c.slice(3):c;} // H527 -> H52.7 (como en la hoja)
function elegirDxEval(v,el){ // v = [código, descripción, origen]
  const n=+/^dx(\d)_/.exec(el.dataset.f)[1],g=k=>document.querySelector(`#sheet [data-f="dx${n}_${k}"]`),c=String(v[0]).toUpperCase().replace(/\./g,"");
  g('txt').value=DX_ETIQUETA[c]||String(v[1]).trim().replace(/\.$/,"");g('cie').value=codCIE(c);
  autoDx(n,true);autoGuardar();
}
document.addEventListener('DOMContentLoaded',()=>{if(!window.HIS||!HIS.predictivoCIE)return;
  document.querySelectorAll('#sheet input[data-f]').forEach(el=>{if(/^dx\d_(txt|cie)$/.test(el.dataset.f))HIS.predictivoCIE(el,elegirDxEval);});});
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
// T, FR, FC, PA y SAT escritos en la hoja también quedan en DATOS (y al revés: ver tbodyDatos)
document.getElementById('sheet').addEventListener('input',e=>{const m=/^ef_(t|fr|fc|pa|sat)$/.exec(e.target.dataset.f||"");if(!m)return;
  const el=e.target;if(m[1]==='pa'){const c=normPA(el.value);if(c!==el.value)el.value=c;}
  const r=buscarPaciente(numActual);if(!r)return;r[m[1]]=el.value.trim();guardarPacientes();
  const cel=document.querySelector(`#tbodyDatos tr[data-id="${CSS.escape(String(r.id))}"] [data-k="${m[1]}"]`);if(cel)cel.value=r[m[1]];
});

/* ======================= ESPECIFICAR: líneas que funcionan como un solo párrafo ======================= */
// Al escribir, las palabras que no entran pasan solas a la línea siguiente (y vuelven al borrar);
// si el texto es muy extenso se agregan líneas debajo (hasta "max") y se quitan al borrar;
// solo si ni así alcanza, la letra se achica lo necesario para que se vean todas las palabras.
function parrafoFluido(prefijo,fijas,max){
  const L=fijas.map(f=>document.querySelector(`#sheet [data-f="${f}"]`)),nf=L.length,tb=L[nf-1].closest('tbody'),ctx=document.createElement('canvas').getContext('2d');
  const base=L.map(el=>parseFloat(getComputedStyle(el).fontSize)),fam=getComputedStyle(L[0]).fontFamily;
  const mod=i=>L[Math.min(i,nf-1)]; // las líneas extra miden como la última línea fija
  const cabe=(i,t,k)=>{ctx.font=`${base[Math.min(i,nf-1)]*k}px ${fam}`;return ctx.measureText(t.trimEnd()).width<=mod(i).clientWidth-4;};
  function cortar(T,k,forzar){ // reparte el texto en líneas; null si no entra en "max" líneas con ese tamaño de letra
    const out=[];let r=T;
    for(let i=0;i<max&&r!=null;i++){
      if(cabe(i,r,k)||(forzar&&i===max-1)){out.push(r);r=null;break;}
      if(i===max-1)return null;
      let p=-1;for(let j=r.indexOf(" ");j>=0;j=r.indexOf(" ",j+1)){if(cabe(i,r.slice(0,j),k))p=j;else break;}
      if(p<0){if(!forzar)return null;p=r.indexOf(" ");if(p<0){out.push(r);r=null;break;}}
      out.push(r.slice(0,p));r=r.slice(p+1);
    }
    while(out.length<nf)out.push("");
    return out;
  }
  function lineas(n){ // deja n líneas en pantalla: agrega o quita las extra (nunca las fijas)
    n=Math.max(nf,Math.min(max,n));
    while(L.length<n){const tr=document.createElement('tr');tr.className='lin-extra';
      tr.innerHTML=`<td class="bb" style="height:3.6mm"><input class="f" data-f="${prefijo}${L.length+1}" autocomplete="off"></td>`;
      tb.appendChild(tr);const el=tr.querySelector('input');conectar(el,L.length);L.push(el);}
    while(L.length>n)L.pop().closest('tr').remove();
  }
  function ajustar(activo){ // activo = línea donde está el cursor (null al cargar un paciente)
    if(!L[0].clientWidth)return false; // vista oculta: no se puede medir
    const v=L.map(el=>el.value);let c=null;
    if(activo!=null){c=L[activo].selectionStart??v[activo].length;for(let i=0;i<activo;i++)if(v[i]!=="")c+=v[i].length+1;}
    let T=v.filter(x=>x!=="").join(" ");const ini=T.length-T.trimStart().length;T=T.slice(ini);
    if(c!=null)c=Math.max(0,Math.min(T.length,c-ini));
    let k=1,ls=cortar(T,1,false);
    if(!ls){for(k=.96;k>=.6;k=Math.round((k-.04)*100)/100){ls=cortar(T,k,false);if(ls)break;}}
    if(!ls){k=.6;ls=cortar(T,k,true);}
    const antes=L.length;lineas(ls.length);let cambio=L.length!==antes;
    L.forEach((el,i)=>{if(el.value!==ls[i]){el.value=ls[i];cambio=true;}el.style.fontSize=k<1?(base[Math.min(i,nf-1)]*k).toFixed(2)+"px":"";});
    if(c!=null&&cambio){let st=0,j=0;for(;j<L.length-1;j++){if(c<=st+ls[j].length)break;st+=ls[j].length+1;}
      const el=L[j],pos=Math.min(c-st,ls[j].length);if(document.activeElement!==el)el.focus();el.setSelectionRange(pos,pos);}
    return cambio;
  }
  function conectar(el,i){
    el.addEventListener('input',()=>ajustar(i));
    el.addEventListener('keydown',e=>{ // moverse entre líneas como en un solo cuadro de texto
      const a=el.selectionStart,b=el.selectionEnd,n=L.length;if(a!==b||e.shiftKey||e.ctrlKey||e.altKey)return;
      const ir=(j,pos)=>{e.preventDefault();const x=L[j];x.focus();pos=Math.min(pos,x.value.length);x.setSelectionRange(pos,pos);return x;};
      if(e.key==='Backspace'&&a===0&&i>0){const x=ir(i-1,1e9);if(x.value){x.value=x.value.slice(0,-1);x.dispatchEvent(new Event('input',{bubbles:true}));}}
      else if(e.key==='ArrowLeft'&&a===0&&i>0)ir(i-1,1e9);
      else if(e.key==='ArrowRight'&&a===el.value.length&&i<n-1)ir(i+1,0);
      else if(e.key==='ArrowUp'&&i>0)ir(i-1,a);
      else if((e.key==='ArrowDown'||e.key==='Enter')&&i<n-1)ir(i+1,e.key==='Enter'?0:a);
    });
  }
  L.forEach(conectar);
  function preparar(o){ // antes de escribir una evaluación guardada: crear las líneas extra que tenga
    let n=nf;if(o)for(const key in o){const m=key.startsWith(prefijo)&&/^\d+$/.exec(key.slice(prefijo.length));if(m&&+m[0]>n&&String(o[key]).trim())n=+m[0];}
    lineas(n);
  }
  return {ajustar,preparar};
}
const PARRAFOS=[parrafoFluido("ant_especificar",["ant_especificar","ant_especificar2","ant_especificar3"],12)];
function ajustarParrafos(){return PARRAFOS.map(P=>P.ajustar(null)).some(Boolean);}

/* ======================= III. EXAMEN OCULAR EXTERNO: NO marcado por defecto ======================= */
// En una evaluación nueva todos los signos/síntomas vienen con NO (la mayoría de pacientes está bien);
// el control "Todo NO" marca o quita todos a la vez y los que tienen SI no se tocan.
function esNo(f){return /^s\d+_\d+_no$/.test(f||"");}
function chkNo(){return [...document.querySelectorAll('#sheet .chk[data-f]')].filter(c=>esNo(c.dataset.f));}
function parSiNo(c){const m=/^(s\d+_\d+)_(si|no)$/.exec(c.dataset.f||"");return m?document.querySelector(`#sheet .chk[data-f="${m[1]}_${m[2]==="si"?"no":"si"}"]`):null;}
function syncTodoNo(){const ok=chkNo().every(c=>c.classList.contains('on')||parSiNo(c).classList.contains('on'));document.querySelectorAll('#sheet .todoNo input').forEach(x=>x.checked=ok);}
document.querySelectorAll('#sheet .todoNo input').forEach(x=>x.addEventListener('change',()=>{
  chkNo().forEach(c=>c.classList.toggle('on',x.checked&&!parSiNo(c).classList.contains('on')));
  syncTodoNo();autoGuardar();msg(x.checked?"NO marcado en todo el examen externo":"Se quitaron todos los NO");
}));

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
    const d=parseFecha(txt.value);if(!d)return;const v=String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
    if(v!==txt.value){txt.value=v;autoGuardar();}
  });
})();

document.getElementById('numPac').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,"");cargarPaciente(e.target.value);});
document.getElementById('sheet').addEventListener('click',e=>{
  const c=e.target.closest('.chk');if(!c)return;c.classList.toggle('on');
  if(c.dataset.f==='trat_si'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_no]').classList.remove('on');
  if(c.dataset.f==='trat_no'&&c.classList.contains('on'))document.querySelector('.chk[data-f=trat_si]').classList.remove('on');
  const par=parSiNo(c);if(par&&c.classList.contains('on'))par.classList.remove('on'); // SI y NO del mismo signo se excluyen
  syncTodoNo();autoGuardar();
});
['input','change'].forEach(t=>document.getElementById('sheet').addEventListener(t,e=>{if(e.target.dataset&&e.target.dataset.f)autoGuardar();}));
// al salir de la app o cambiar de pestaña/aplicación en el celular: guardar y subir lo pendiente
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='hidden')return;if(tAuto)guardarAhora();if(window.Sync&&Sync.subirPendiente)Sync.subirPendiente();});
window.addEventListener('pagehide',()=>{if(tAuto)guardarAhora();});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.key.toLowerCase()==='s'&&document.getElementById('evaluacion').classList.contains('active')){e.preventDefault();guardarEval();}
});

/* ======================= INICIO ======================= */
cargar();renderDatos();escribirForm(null);

/* ======================= APP INSTALABLE (PWA) Y AVISO DE NUEVA VERSIÓN ======================= */
(function(){
  let versionActual=null,avisado=false;
  function avisar(){
    if(avisado)return;avisado=true;
    const d=document.createElement('div');d.className='actualizar no-print';
    d.innerHTML='<span>🆕 Hay una nueva versión de la aplicación.</span><button type="button">Actualizar ahora</button><button type="button" class="luego" title="Cerrar">✕</button>';
    d.querySelector('button').onclick=()=>{d.querySelector('button').textContent="Actualizando…";navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{}).then(()=>location.reload(true));};
    d.querySelector('.luego').onclick=()=>{d.remove();avisado=false;};
    document.body.appendChild(d);
  }
  async function verVersion(){
    try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const j=await r.json();
      if(versionActual==null)versionActual=j.v;else if(j.v!==versionActual)avisar();}catch(e){}
  }
  window.addEventListener('load',()=>{
    verVersion();setInterval(verVersion,5*60*1000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)verVersion();});
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("sw.js").catch(()=>{});
      let habiaControl=!!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(habiaControl)avisar();habiaControl=true;});
    }
  });
  window.verVersion=verVersion;
})();
