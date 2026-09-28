/* PCT · Lógica de la aplicación: padrón, atenciones HIS, registro mensual, importar/exportar y guardado local. */
/* ======================= DATOS INICIALES ======================= */
const DATA_INICIAL = [];
const COLS = ["n","nom","hc","dni","fn","edad","sexo","dx","peso","talla","tto"];
const HEADERS = ["N° Reg","APELLIDOS Y NOMBRES","HISTORIA CLINICA","DNI","FECHA DE NACIMIENTO","EDAD","SEXO","DIAGNOSTICO","PESO","TALLA","TRATAMIENTO"];
const OPC_SEXO = ["M","F","RM"];
const OPC_DX = ["Pulmonar","Extra-pulmonar","Resistente","R-H","R-H (Resistente)","R"];
const OPC_TTO = ["con","sensible","ECA MDR","ECA BLC MDR","ESQ Modif","Esquema A","Esquema B MDR"];
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SET","OCT","NOV","DIC"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
const LS_PAC = "pct_pacientes_v1", LS_AT = "pct_atenciones_v1", LS_CFG = "pct_config_v1";
const BLOQUES_POR_PAGINA = 5;

let pacientes = [];
let atenciones = {};
let config = {estab:"C.S HUASCAR II",ups:"MEDICINA",resp:"MARI ALVA MAS",digit:"",lote:"",financia:"2",etnia:"58",distrito:""};
let pacActual = null;   // paciente elegido en ATENCIÓN
let atActual = null;    // id de la atención en edición

/* ======================= UTILIDADES ======================= */
function msg(t){const m=document.getElementById('msg');m.textContent=t;m.classList.add('show');clearTimeout(msg._t);msg._t=setTimeout(()=>m.classList.remove('show'),2200);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(v){if(v===""||v==null)return null;const n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n;}
function parseFecha(s){if(!s)return null;const m=String(s).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);if(!m)return null;let y=parseInt(m[3]);if(y<100)y+=y<30?2000:1900;const d=new Date(y,parseInt(m[2])-1,parseInt(m[1]));return isNaN(d)?null:d;}
function fmtFecha(d){return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();}
function hoy(){return fmtFecha(new Date());}
function calcEdad(fn){const d=parseFecha(fn);if(!d)return "";const h=new Date();let e=h.getFullYear()-d.getFullYear();const m=h.getMonth()-d.getMonth();if(m<0||(m===0&&h.getDate()<d.getDate()))e--;return e<0?"":String(e);}
function edadDe(r){return (r&&r.fn&&calcEdad(r.fn))||(r?String(r.edad||""):"");}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}
function normTxt(s){return String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");}
function resaltar(txt,q){const toks=normTxt(q).trim().split(/\s+/).filter(Boolean);let out="",i=0;const n=normTxt(txt);
  while(i<txt.length){let hit=null;for(const t of toks){if(n.startsWith(t,i)&&(!hit||t.length>hit.length))hit=t;}
    if(hit){out+="<mark>"+esc(txt.slice(i,i+hit.length))+"</mark>";i+=hit.length;}else{out+=esc(txt[i]);i++;}}
  return out;}
function nuevoRegistro(){return {id:uid(),n:"",nom:"",hc:"",dni:"",fn:"",edad:"",sexo:"",dx:"",peso:"",talla:"",tto:""};}
function normalizar(r){const o=nuevoRegistro();for(const k in o){if(r[k]!=null)o[k]=r[k];}o.id=String(o.id||uid());o.n=parseInt(o.n);if(isNaN(o.n))o.n="";o.dni=String(o.dni||"").replace(/\D/g,"");return o;}

/* ======================= PERSISTENCIA ======================= */
function cargar(){
  try{const p=JSON.parse(localStorage.getItem(LS_PAC));if(Array.isArray(p)&&p.length)pacientes=p.map(normalizar);}catch(e){}
  if(!pacientes.length)pacientes=DATA_INICIAL.map(normalizar);
  try{atenciones=JSON.parse(localStorage.getItem(LS_AT))||{};}catch(e){atenciones={};}
  try{config=Object.assign(config,JSON.parse(localStorage.getItem(LS_CFG))||{});}catch(e){}
}
function guardarPacientes(){try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarPacientes();}
function guardarAtenciones(){try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync)Sync.programarAtenciones();}
function guardarConfig(){try{localStorage.setItem(LS_CFG,JSON.stringify(config));}catch(e){}if(window.Sync)Sync.programarConfig();}

/* ======================= VISTAS ======================= */
function showView(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));
  document.getElementById('tabDatos').classList.toggle('active',v==='datos');
  document.getElementById('tabAtencion').classList.toggle('active',v==='atencion');
  document.getElementById('tabRegistro').classList.toggle('active',v==='registro');
  if(v==='atencion')pintarFicha();
  if(v==='registro')renderRegistro();
}

/* ======================= TABLA DATOS ======================= */
function contarAt(r){let c=0;for(const id in atenciones){const a=atenciones[id];if(a.pacId===r.id||(r.dni&&a.dni===r.dni))c++;}return c;}
function renderDatos(){
  const q=document.getElementById('search').value.trim().toLowerCase();
  const tb=document.getElementById('tbodyDatos');
  const rows=pacientes.map((r,i)=>({r,i})).filter(({r})=>{if(!q)return true;return normTxt([r.n,r.hc,r.dni,r.nom,r.sexo,r.dx,r.tto].join(" ")).includes(normTxt(q));});
  tb.innerHTML=rows.map(({r,i})=>`
  <tr data-i="${i}" data-id="${esc(r.id)}">
    <td class="num"><input class="w-num" data-k="n" value="${esc(r.n)}" style="text-align:center;font-weight:bold"></td>
    <td><input data-k="nom" value="${esc(r.nom)}"></td>
    <td><input data-k="hc" value="${esc(r.hc)}"></td>
    <td><input data-k="dni" value="${esc(r.dni)}" maxlength="8" inputmode="numeric" class="${r.dni&&r.dni.length!==8?'invalid':''}"></td>
    <td><span class="fn-wrap"><input data-k="fn" value="${esc(r.fn)}" placeholder="dd/mm/aaaa" class="${r.fn&&!parseFecha(r.fn)?'invalid':''}"><button type="button" class="cal-mini" tabindex="-1" title="Elegir fecha en el calendario (puede cambiar mes y año)">📅</button></span></td>
    <td><input data-k="edad" value="${esc(edadDe(r))}" style="text-align:center" ${r.fn&&parseFecha(r.fn)?'readonly class="auto" title="Calculada desde la fecha de nacimiento"':''}></td>
    <td><input data-k="sexo" value="${esc(r.sexo)}" class="mp" data-opc="sexo" style="text-align:center"></td>
    <td><input data-k="dx" value="${esc(r.dx)}" class="mp" data-opc="dx"></td>
    <td><input data-k="peso" value="${esc(r.peso)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="talla" value="${esc(r.talla)}" inputmode="decimal" style="text-align:center"></td>
    <td><input data-k="tto" value="${esc(r.tto)}" class="mp" data-opc="tto"></td>
    <td class="calc" style="text-align:center"><a href="#" onclick="irAtencion('${esc(r.id)}');return false" title="Ver atenciones HIS de este paciente">${contarAt(r)} · abrir</a></td>
    <td class="actions"><button title="Eliminar fila" onclick="delRow(${i})">✕</button></td>
  </tr>`).join("");
  document.getElementById('emptyMsg').style.display=rows.length?'none':'block';
  document.getElementById('countInfo').textContent=`${rows.length} de ${pacientes.length} registros`;
  tb.querySelectorAll('input.mp').forEach(el=>activarPredictivo(el,()=>opcionesDe(el.dataset.opc)));
}
function opcionesDe(k){const base=k==='sexo'?OPC_SEXO:k==='dx'?OPC_DX:OPC_TTO;const usados=[...new Set(pacientes.map(r=>String(r[k]||"").trim()).filter(Boolean))];return [...new Set(base.concat(usados))];}
document.getElementById('tbodyDatos').addEventListener('input',e=>{
  const el=e.target,tr=el.closest('tr');if(!tr||!el.dataset.k)return;
  const r=pacientes[+tr.dataset.i];let v=el.value;
  if(el.dataset.k==='dni'){v=v.replace(/\D/g,"").slice(0,8);el.value=v;el.classList.toggle('invalid',v.length>0&&v.length!==8);}
  if(el.dataset.k==='n'){const n=parseInt(v);v=isNaN(n)?"":n;}
  if(el.dataset.k==='fn'){el.classList.toggle('invalid',!!v&&!parseFecha(v));const ed=tr.querySelector('[data-k=edad]');if(parseFecha(v)){r.edad=calcEdad(v);ed.value=r.edad;ed.readOnly=true;ed.classList.add('auto');}else{ed.readOnly=false;ed.classList.remove('auto');}}
  r[el.dataset.k]=v;guardarPacientes();
});
// calendario para la fecha de nacimiento del padrón
(function(){const cal=document.getElementById('calTabla');let destino=null;
  document.getElementById('tbodyDatos').addEventListener('click',e=>{const b=e.target.closest('.cal-mini');if(!b)return;destino=b.parentElement.querySelector('input[data-k=fn]');
    const d=parseFecha(destino.value)||new Date(2010,0,1);cal.value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    const r=b.getBoundingClientRect();cal.style.left=r.left+"px";cal.style.top=r.bottom+"px";try{cal.showPicker();}catch(x){cal.focus();cal.click();}});
  document.getElementById('tbodyDatos').addEventListener('dblclick',e=>{const i=e.target.closest('input[data-k=fn]');if(i)i.parentElement.querySelector('.cal-mini').click();});
  cal.addEventListener('change',()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(cal.value);if(!m||!destino)return;destino.value=m[3]+"/"+m[2]+"/"+m[1];destino.dispatchEvent(new Event('input',{bubbles:true}));});
  document.getElementById('tbodyDatos').addEventListener('focusout',e=>{const i=e.target;if(i.dataset&&i.dataset.k==='fn'){const d=parseFecha(i.value);if(d){i.value=fmtFecha(d);i.dispatchEvent(new Event('input',{bubbles:true}));}}});
})();
function addRow(){
  const max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);
  const r=nuevoRegistro();r.n=max+1;pacientes.push(r);guardarPacientes();
  document.getElementById('search').value="";renderDatos();
  const wrap=document.getElementById('datosWrap');wrap.scrollTop=wrap.scrollHeight;
  const last=document.querySelector('#tbodyDatos tr:last-child input[data-k=nom]');if(last)last.focus();
  msg("Fila N° "+r.n+" agregada");
}
function delRow(i){const r=pacientes[i];if(!confirm(`¿Eliminar la fila N° ${r.n} (${r.nom||'sin nombre'})?`))return;pacientes.splice(i,1);guardarPacientes();renderDatos();msg("Fila eliminada");}
function resetData(){if(!confirm("Se reemplazará el padrón actual por los datos originales del Excel. ¿Continuar?"))return;pacientes=DATA_INICIAL.map(normalizar);guardarPacientes();renderDatos();msg("Datos originales restaurados");}

/* ======================= IMPORTAR / EXPORTAR ======================= */
function parseCSV(text){
  text=text.replace(/^﻿/,"");const sep=(text.match(/;/g)||[]).length>(text.match(/,/g)||[]).length?";":",";
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;}
    else if(c==='"')q=true;else if(c===sep){row.push(cell);cell="";}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell="";}
    else cell+=c;}
  if(cell!==""||row.length){row.push(cell);rows.push(row);}
  return rows.filter(r=>r.some(x=>String(x).trim()!==""));
}
function filasAPacientes(rows){
  if(!rows.length)return [];
  const norm=s=>normTxt(s).replace(/[^a-z0-9]/g,"");const hdr=rows[0].map(norm);
  const map={n:["nreg","n","no","num","numero","nro","nregistro"],nom:["apellidosynombres","nombres","nombre","paciente"],hc:["historiaclinica","hc","historia","nhistoria"],dni:["dni","documento","numerodedocumento"],fn:["fechadenacimiento","fechanacimiento","fnac","nacimiento"],edad:["edad"],sexo:["sexo","genero"],dx:["dx","diagnostico","diagnostico"],peso:["peso","pesokg"],talla:["talla","tallam"],tto:["tto","tratamiento","esquema"]};
  const idx={};let hits=0;for(const k in map){const j=hdr.findIndex(h=>map[k].includes(h));if(j>=0){idx[k]=j;hits++;}}
  let body=rows.slice(1);
  if(hits<4){body=rows;COLS.forEach((k,j)=>{idx[k]=j;});if(isNaN(parseInt(rows[0][0])))body=rows.slice(1);}
  // el Excel original trae SEXO y DX intercambiados: corregir si los valores lo delatan
  const out=[];
  for(const r of body){const o=nuevoRegistro();for(const k in idx){let v=r[idx[k]];if(v==null)v="";o[k]=String(v).trim();}
    if(/^(pulmonar|extra|resist|r-h|r)$/i.test(o.sexo)&&/^(m|f|rm)$/i.test(o.dx)){const t=o.sexo;o.sexo=o.dx;o.dx=t;}
    if(o.fn&&/^\d{4,5}$/.test(o.fn)){const d=new Date(Date.UTC(1899,11,30)+parseInt(o.fn)*86400000);o.fn=String(d.getUTCDate()).padStart(2,"0")+"/"+String(d.getUTCMonth()+1).padStart(2,"0")+"/"+d.getUTCFullYear();}
    if(o.n===""&&o.dni===""&&o.nom==="")continue;out.push(normalizar(o));}
  return out;
}
function importFile(inp){
  const f=inp.files[0];if(!f)return;inp.value="";
  const done=rows=>{const nuevos=filasAPacientes(rows);if(!nuevos.length){msg("No se encontraron registros válidos");return;}
    const modo=confirm(`Se leyeron ${nuevos.length} registros.\n\nAceptar = REEMPLAZAR el padrón actual\nCancelar = AGREGAR al padrón actual`);
    if(modo){pacientes=nuevos;}else{let max=pacientes.reduce((m,r)=>Math.max(m,parseInt(r.n)||0),0);nuevos.forEach(r=>{if(r.n===""||pacientes.some(p=>p.n===r.n))r.n=++max;else max=Math.max(max,r.n);pacientes.push(r);});}
    guardarPacientes();renderDatos();msg(`${nuevos.length} registros importados`);};
  if(/\.(xlsx|xls)$/i.test(f.name)){
    if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Importe el archivo como CSV.");return;}
    const rd=new FileReader();rd.onload=e=>{const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});const name=wb.SheetNames.find(n=>/pacientes|datos/i.test(n))||wb.SheetNames[0];
      let rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:""});rows=rows.filter(r=>r.some(x=>String(x).trim()!==""));done(rows);};
    rd.readAsArrayBuffer(f);
  }else{const rd=new FileReader();rd.onload=e=>done(parseCSV(e.target.result));rd.readAsText(f,"UTF-8");}
}
function filaExport(r){return [r.n,r.nom,r.hc,r.dni,r.fn,edadDe(r),r.sexo,r.dx,r.peso,r.talla,r.tto];}
function descargar(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportCSV(){const q=v=>{v=String(v==null?"":v);return /[";\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  const lines=[HEADERS.map(q).join(";")].concat(pacientes.map(r=>filaExport(r).map(q).join(";")));
  descargar(new Blob(["﻿"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"PCT_pacientes.csv");}
function exportXLSX(){
  if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión). Use Exportar CSV.");return;}
  const aoa=[HEADERS].concat(pacientes.map(filaExport));const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[7,34,14,12,14,6,6,18,8,8,16].map(w=>({wch:w}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"PACIENTES");
  const ats=Object.values(atenciones).sort(ordenAt);
  if(ats.length){const ws2=XLSX.utils.aoa_to_sheet([CAB_AT].concat(ats.map(filaAt)));XLSX.utils.book_append_sheet(wb,ws2,"ATENCIONES");}
  XLSX.writeFile(wb,"PCT_pacientes.xlsx");}

/* ======================= MENÚ PREDICTIVO (lista flotante) ======================= */
const MP=document.createElement('div');MP.className='mp-lista no-print';document.body.appendChild(MP);
let mpInput=null,mpItems=[],mpSel=-1,mpSilencio=false,mpOnPick=null;
function mpMostrar(input,opciones,alElegir,render){
  if(mpSilencio)return;const q=input.value,toks=normTxt(q).trim().split(/\s+/).filter(Boolean);
  const lista=typeof opciones==='function'?opciones(q,toks):opciones;
  mpItems=lista;mpInput=input;mpSel=0;mpOnPick=alElegir||null;
  if(!mpItems.length){mpOcultar();return;}
  MP.innerHTML=mpItems.map((o,i)=>`<div class="mp-item${i?'':' act'}" data-i="${i}">${render?render(o,q):resaltar(String(o),q)}</div>`).join("");
  const r=input.getBoundingClientRect();MP.style.left=Math.min(r.left,window.innerWidth-Math.max(r.width,300)-8)+"px";MP.style.top=(r.bottom+3)+"px";MP.style.minWidth=Math.max(r.width,300)+"px";MP.style.display="block";
}
function mpOcultar(){MP.style.display="none";mpInput=null;}
function mpElegir(i){const el=mpInput,v=mpItems[i];if(!el||v==null)return;const fn=mpOnPick;mpOcultar();mpSilencio=true;if(fn)fn(v,el);else{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}mpSilencio=false;}
MP.addEventListener('mousedown',e=>{const it=e.target.closest('.mp-item');if(it){e.preventDefault();mpElegir(+it.dataset.i);}});
function activarPredictivo(input,opciones,alElegir,render){
  if(input.dataset.mp)return;input.dataset.mp="1";
  const mostrar=()=>mpMostrar(input,opciones,alElegir,render);
  input.addEventListener('focus',mostrar);input.addEventListener('input',mostrar);
  input.addEventListener('blur',()=>setTimeout(()=>{if(mpInput===input)mpOcultar();},150));
  input.addEventListener('keydown',e=>{
    if(MP.style.display!=="block"||mpInput!==input)return;
    if(e.key==='ArrowDown'){e.preventDefault();mpSel=Math.min(mpItems.length-1,mpSel+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();mpSel=Math.max(0,mpSel-1);}
    else if(e.key==='Enter'||e.key==='Tab'){if(e.key==='Enter')e.preventDefault();mpElegir(mpSel);return;}
    else if(e.key==='Escape'){mpOcultar();return;}
    else return;
    MP.querySelectorAll('.mp-item').forEach((el,i)=>el.classList.toggle('act',i===mpSel));
    const act=MP.querySelector('.mp-item.act');if(act)act.scrollIntoView({block:'nearest'});
  });
}
window.addEventListener('scroll',mpOcultar,true);window.addEventListener('resize',mpOcultar);

/* ======================= CIE-10 (15 000 códigos, carga diferida) ======================= */
let CIE=null,CIE_N=null,cieCargando=null;
function cargarCIE(){if(CIE||cieCargando)return cieCargando;cieCargando=fetch('cie10.json').then(r=>r.json()).then(d=>{CIE=d;CIE_N=d.map(([c,t])=>normTxt(c+" "+t));return d;}).catch(()=>{cieCargando=null;msg("No se pudo cargar la lista CIE-10");return null;});return cieCargando;}
function codigosPropios(){return Array.isArray(config.codigos)?config.codigos:[];}
function buscarCIE(q,toks){
  if(!toks.length)return [];const out=[];const cod=toks[0].toUpperCase();
  codigosPropios().forEach(o=>{if(toks.every(t=>normTxt(o.c+" "+o.t).includes(t)))out.push([o.c,o.t,true]);});
  if(CIE)for(let i=0;i<CIE.length&&out.length<40;i++){const s=CIE_N[i];if(toks.every(t=>s.includes(t))){out.push(CIE[i]);}}
  out.sort((a,b)=>{if(!!a[2]!==!!b[2])return a[2]?-1:1;const da=a[0].startsWith(cod),db=b[0].startsWith(cod);if(da!==db)return da?-1:1;return 0;});
  return out.slice(0,12);
}
function renderCIE(o,q){return `<span class="cie-cod">${resaltar(o[0],q)}</span><span class="cie-txt">${resaltar(o[1],q)}</span>${o[2]?'<span class="cie-propio">propio</span>':''}`;}
function pintarCodigos(){const li=document.getElementById('cpLista');const lst=codigosPropios();
  li.innerHTML=lst.length?lst.map((o,i)=>`<span class="cpchip"><b>${esc(o.c)}</b> ${esc(o.t)}<button type="button" title="Quitar" onclick="quitarCodigo(${i})">✕</button></span>`).join(""):'<span class="ficha-lbl">Aún no hay códigos propios.</span>';}
function agregarCodigo(){const c=document.getElementById('cpCod').value.trim().toUpperCase(),t=document.getElementById('cpTxt').value.trim();
  if(!c||!t){alert("Escriba el código y su descripción.");return;}
  const lst=codigosPropios().filter(o=>o.c!==c);lst.push({c,t});config.codigos=lst;guardarConfig();pintarCodigos();
  document.getElementById('cpCod').value="";document.getElementById('cpTxt').value="";msg("Código "+c+" agregado");}
function quitarCodigo(i){const lst=codigosPropios();const o=lst[i];if(!o||!confirm(`¿Quitar el código ${o.c} · ${o.t}?`))return;lst.splice(i,1);config.codigos=lst;guardarConfig();pintarCodigos();}
function elegirCIE(v,el){const m=/^dx(\d)_txt$/.exec(el.dataset.f);el.value=v[1];if(m){const c=document.querySelector(`#formAt [data-f="dx${m[1]}_cie"]`);if(c)c.value=v[0];}marcarCambio();}
document.querySelectorAll('#formAt .dxtxt').forEach(el=>{el.addEventListener('focus',cargarCIE,{once:true});activarPredictivo(el,(q,toks)=>buscarCIE(q,toks),elegirCIE,renderCIE);});

/* ======================= BÚSQUEDA PREDICTIVA DE PACIENTES ======================= */
const bq=document.getElementById('buscarPac'),bqL=document.getElementById('buscarLista');let bqItems=[],bqSel=-1;
function sugerencias(q){const toks=normTxt(q).trim().split(/\s+/).filter(Boolean);if(!toks.length)return [];
  return pacientes.filter(r=>{const s=normTxt([r.n,r.dni,r.hc,r.nom].join(" "));return toks.every(t=>s.includes(t));})
    .sort((a,b)=>{const da=String(a.dni).startsWith(toks[0])||String(a.n)===toks[0],db=String(b.dni).startsWith(toks[0])||String(b.n)===toks[0];if(da!==db)return da?-1:1;return (parseInt(a.n)||0)-(parseInt(b.n)||0);}).slice(0,8);}
function renderSug(){const q=bq.value;bqItems=sugerencias(q);bqSel=bqItems.length?0:-1;
  if(!q.trim()){bqL.style.display="none";bqL.innerHTML="";return;}
  bqL.innerHTML=bqItems.length?bqItems.map((r,i)=>`<div class="bq-item${i===bqSel?' act':''}" data-i="${i}" role="option"><span class="bq-n">N° ${esc(r.n)}</span><span class="bq-nom">${resaltar(r.nom||"(sin nombre)",q)}</span><span class="bq-dni">DNI ${resaltar(r.dni||"—",q)}${contarAt(r)?' · <b>'+contarAt(r)+' atenc.</b>':''}</span></div>`).join("")
    :`<div class="bq-vacio">Sin coincidencias para “${esc(q)}”</div>`;bqL.style.display="block";}
function elegirSug(i){const r=bqItems[i];if(!r)return;bq.value="";bqL.style.display="none";elegirPaciente(r.id);}
bq.addEventListener('input',renderSug);bq.addEventListener('focus',()=>{if(bq.value.trim())renderSug();});
bq.addEventListener('keydown',e=>{if(bqL.style.display!=="block")return;
  if(e.key==='ArrowDown'){e.preventDefault();bqSel=Math.min(bqItems.length-1,bqSel+1);}else if(e.key==='ArrowUp'){e.preventDefault();bqSel=Math.max(0,bqSel-1);}
  else if(e.key==='Enter'){e.preventDefault();elegirSug(bqSel);return;}else if(e.key==='Escape'){bqL.style.display="none";return;}else return;
  bqL.querySelectorAll('.bq-item').forEach((el,i)=>el.classList.toggle('act',i===bqSel));});
bqL.addEventListener('mousedown',e=>{const it=e.target.closest('.bq-item');if(it){e.preventDefault();elegirSug(+it.dataset.i);}});
document.addEventListener('click',e=>{if(!e.target.closest('.bq'))bqL.style.display="none";});

/* ======================= ATENCIÓN HIS ======================= */
function campos(){return document.querySelectorAll('#formAt [data-f]');}
function leerForm(){const o={};campos().forEach(el=>{o[el.dataset.f]=el.classList.contains('chk')?(el.classList.contains('on')?"X":""):el.value;});return o;}
function escribirForm(o){campos().forEach(el=>{const v=o&&o[el.dataset.f]!=null?o[el.dataset.f]:"";if(el.classList.contains('chk'))el.classList.toggle('on',v==="X");else el.value=v;});}
function pacPorId(id){return pacientes.find(r=>r.id===id)||null;}
function atencionesDe(r){return Object.values(atenciones).filter(a=>a.pacId===r.id||(r.dni&&a.dni===r.dni)).sort(ordenAt);}
function ordenAt(a,b){const da=parseFecha(a.fecha),db=parseFecha(b.fecha);return (da?da.getTime():0)-(db?db.getTime():0)||(parseInt(a.n)||0)-(parseInt(b.n)||0);}
function elegirPaciente(id){pacActual=pacPorId(id);atActual=null;pintarFicha();if(pacActual){const prev=atencionesDe(pacActual);if(prev.length)cargarAtencion(prev[prev.length-1].id);else nuevaAtencion(true);}}
function irAtencion(id){showView('atencion');elegirPaciente(id);}
function pintarFicha(){
  const r=pacActual,nom=document.getElementById('fpNombre'),sub=document.getElementById('fpSub'),li=document.getElementById('fpLista'),info=document.getElementById('evalInfo');
  document.querySelector('#formAt [data-auto=edad]').value=r?edadDe(r):"";
  if(!r){nom.textContent="Busque o elija un paciente";sub.textContent="Los datos de DNI, historia clínica, edad y sexo se toman de la pestaña DATOS.";li.innerHTML="";info.textContent="";return;}
  nom.textContent=`N° ${r.n} · ${r.nom||"(sin nombre)"}`;
  sub.textContent=`DNI ${r.dni||"—"} · HC ${r.hc||"—"} · ${edadDe(r)?edadDe(r)+" años":"edad —"} · Sexo ${r.sexo||"—"} · ${r.dx||""} ${r.tto?"· "+r.tto:""}`;
  const prev=atencionesDe(r);
  li.innerHTML=(prev.length?`<span class="ficha-lbl">Atenciones:</span>`:`<span class="ficha-lbl">Sin atenciones registradas</span>`)+prev.map(a=>`<button type="button" class="chip${a.id===atActual?' act':''}" onclick="cargarAtencion('${a.id}')">${esc(a.fecha)}</button>`).join("")+`<button type="button" class="chip nuevo" onclick="nuevaAtencion()">+ nueva</button>`;
  info.textContent=atActual?`Editando atención del ${atenciones[atActual].fecha}`:"Nueva atención (sin guardar)";
}
function defaults(){const ult=Object.values(atenciones).sort(ordenAt).pop()||{};
  return {fecha:hoy(),turno:ult.turno||"M",financia:config.financia||"2",distrito:ult.distrito||config.distrito||"",etnia:config.etnia||"58",cpoblado:ult.cpoblado||"",edadU:"A",est_c:"X",ser_c:"X"};}
function nuevaAtencion(silencio){if(!pacActual){alert("Primero busque y elija un paciente.");return;}atActual=null;const d=defaults();if(pacActual.peso)d.peso=pacActual.peso;if(pacActual.talla)d.talla=pacActual.talla;escribirForm(d);document.getElementById('savedTag').textContent="";pintarFicha();if(!silencio)msg("Nueva atención para N° "+pacActual.n);}
function cargarAtencion(id){const a=atenciones[id];if(!a)return;atActual=id;if(!pacActual||(pacActual.id!==a.pacId&&pacActual.dni!==a.dni))pacActual=pacPorId(a.pacId)||pacientes.find(r=>r.dni&&r.dni===a.dni)||pacActual;escribirForm(a);document.getElementById('savedTag').textContent="✔ Atención guardada";pintarFicha();}
function marcarCambio(){document.getElementById('savedTag').textContent="";}
document.getElementById('formAt').addEventListener('input',marcarCambio);
document.getElementById('formAt').addEventListener('click',e=>{const c=e.target.closest('.chk');if(!c)return;c.classList.toggle('on');
  const g=/^(est|ser|dx\d)_/.exec(c.dataset.f);if(g&&c.classList.contains('on'))c.parentElement.querySelectorAll('.chk').forEach(x=>{if(x!==c)x.classList.remove('on');});marcarCambio();});
function guardarAtencion(){
  if(!pacActual){alert("Primero busque y elija un paciente.");return;}
  const f=leerForm();const d=parseFecha(f.fecha);if(!d){alert("Escriba una fecha de atención válida (dd/mm/aaaa).");return;}
  f.fecha=fmtFecha(d);
  if(!f.dx1_txt.trim()&&!f.dx2_txt.trim()&&!f.dx3_txt.trim()){if(!confirm("No hay ningún diagnóstico o actividad. ¿Guardar de todos modos?"))return;}
  const id=atActual||uid();const r=pacActual;
  atenciones[id]=Object.assign({},f,{id,pacId:r.id,n:r.n,nombre:r.nom,dni:r.dni,hc:r.hc,sexo:r.sexo,edad:edadDe(r),anio:d.getFullYear(),mes:d.getMonth()+1,dia:d.getDate(),guardado:new Date().toISOString()});
  atActual=id;guardarAtenciones();document.getElementById('savedTag').textContent="✔ Atención guardada";pintarFicha();
  if(f.peso&&f.peso!==r.peso||f.talla&&f.talla!==r.talla){r.peso=f.peso||r.peso;r.talla=f.talla||r.talla;guardarPacientes();}
  msg(`Atención del ${f.fecha} guardada para N° ${r.n}`);
}
function eliminarAtencion(){if(!atActual||!atenciones[atActual]){msg("No hay una atención guardada seleccionada");return;}
  if(!confirm(`¿Eliminar la atención del ${atenciones[atActual].fecha}?`))return;delete atenciones[atActual];guardarAtenciones();atActual=null;nuevaAtencion(true);msg("Atención eliminada");}
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='s'&&document.getElementById('atencion').classList.contains('active')){e.preventDefault();guardarAtencion();}});
window.alCambiarPacientes=()=>{if(pacActual)pacActual=pacPorId(pacActual.id)||pacActual;pintarFicha();};
window.alCambiarAtenciones=()=>{pintarFicha();if(document.getElementById('registro').classList.contains('active'))renderRegistro();if(document.getElementById('datos').classList.contains('active'))renderDatos();};
window.alCambiarConfig=()=>{pintarConfig();pintarCodigos();if(document.getElementById('registro').classList.contains('active'))renderRegistro();};

/* ======================= CALENDARIO PARA LA FECHA ======================= */
(function(){const txt=document.querySelector('#formAt [data-f="fecha"]'),cal=document.getElementById('calFecha'),btn=document.getElementById('btnCal');
  function abrir(){const d=parseFecha(txt.value)||new Date();cal.value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");try{cal.showPicker();}catch(e){cal.focus();cal.click();}}
  cal.addEventListener('change',()=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(cal.value);if(!m)return;txt.value=m[3]+"/"+m[2]+"/"+m[1];txt.dispatchEvent(new Event('input',{bubbles:true}));});
  btn.addEventListener('click',abrir);txt.addEventListener('dblclick',abrir);
  document.querySelectorAll('#formAt [data-f="fecha"],#formAt [data-f="fechaHb"],#formAt [data-f="fechaRegla"]').forEach(el=>el.addEventListener('blur',()=>{const d=parseFecha(el.value);if(d)el.value=fmtFecha(d);}));
})();

/* ======================= REGISTRO HIS (mensual, impresión) ======================= */
const CAB_AT=["FECHA","TURNO","N° REG","APELLIDOS Y NOMBRES","DNI","HC","EDAD","SEXO","FINANCIA","DISTRITO","ETNIA","C. POBLADO","GESTANTE","PC","PAB","PESO","TALLA","HB","F. HB","F. REGLA","ESTABLEC","SERVICIO","DX1","TIPO1","LAB1","CIE1","DX2","TIPO2","LAB2","CIE2","DX3","TIPO3","LAB3","CIE3"];
function tipoDe(a,n){return a[`dx${n}_p`]==="X"?"P":a[`dx${n}_d`]==="X"?"D":a[`dx${n}_r`]==="X"?"R":"";}
function ncrDe(a,p){return a[p+"_n"]==="X"?"N":a[p+"_c"]==="X"?"C":a[p+"_r"]==="X"?"R":"";}
function filaAt(a){const lab=n=>[a[`dx${n}_l1`],a[`dx${n}_l2`],a[`dx${n}_l3`]].filter(Boolean).join(" ");
  return [a.fecha,a.turno,a.n,a.nombre,a.dni,a.hc,a.edad,a.sexo,a.financia,a.distrito,a.etnia,a.cpoblado,a.gestante,a.pc,a.pab,a.peso,a.talla,a.hb,a.fechaHb,a.fechaRegla,ncrDe(a,'est'),ncrDe(a,'ser'),a.dx1_txt,tipoDe(a,1),lab(1),a.dx1_cie,a.dx2_txt,tipoDe(a,2),lab(2),a.dx2_cie,a.dx3_txt,tipoDe(a,3),lab(3),a.dx3_cie].map(v=>v==null?"":v);}
function pintarConfig(){for(const [id,k] of [['cfgEstab','estab'],['cfgUps','ups'],['cfgResp','resp'],['cfgDigit','digit'],['cfgLote','lote']]){const el=document.getElementById(id);if(document.activeElement!==el)el.value=config[k]||"";}}
document.querySelectorAll('.cfg').forEach(el=>el.addEventListener('input',()=>{const k={cfgEstab:'estab',cfgUps:'ups',cfgResp:'resp',cfgDigit:'digit',cfgLote:'lote'}[el.id];config[k]=el.value;guardarConfig();clearTimeout(pintarConfig._t);pintarConfig._t=setTimeout(renderRegistro,400);}));
(function(){const h=new Date();const ms=document.getElementById('regMes');ms.innerHTML=MESES_LARGO.map((m,i)=>`<option value="${i+1}">${m}</option>`).join("");ms.value=h.getMonth()+1;document.getElementById('regAnio').value=h.getFullYear();
  ['regAnio','regMes','regDia'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(id!=='regDia')llenarDias();renderRegistro();}));llenarDias();})();
function llenarDias(){const a=+document.getElementById('regAnio').value,m=+document.getElementById('regMes').value,sel=document.getElementById('regDia');const dias=new Set(Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m).map(x=>x.dia));
  sel.innerHTML=`<option value="">Todos los días</option>`+[...dias].sort((x,y)=>x-y).map(d=>`<option value="${d}">${String(d).padStart(2,"0")}</option>`).join("");}
function atencionesPeriodo(){const a=+document.getElementById('regAnio').value,m=+document.getElementById('regMes').value,d=document.getElementById('regDia').value;
  return Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m&&(!d||x.dia===+d)).sort(ordenAt);}
function renderRegistro(){
  const lista=atencionesPeriodo(),a=+document.getElementById('regAnio').value,m=+document.getElementById('regMes').value;
  document.getElementById('regInfo').textContent=`${lista.length} atención(es) · ${MESES_LARGO[m-1]} ${a}`;
  const paginas=[];for(let i=0;i<Math.max(1,lista.length);i+=BLOQUES_POR_PAGINA)paginas.push(lista.slice(i,i+BLOQUES_POR_PAGINA));
  const total=paginas.length;
  document.getElementById('hoja').innerHTML=paginas.map((bl,pi)=>paginaHIS(bl,pi+1,total,a,m)).join("");
}
function cab(v){return esc(v==null?"":v);}
function paginaHIS(bloques,np,total,anio,mes){
  const ini=(np-1)*BLOQUES_POR_PAGINA;const fecha=bloques.length?bloques[0].fecha:"";
  let h=`<div class="pagina"><table class="hcab"><colgroup><col style="width:22mm"><col style="width:120mm"><col style="width:40mm"><col style="width:30mm"><col style="width:60mm"></colgroup>
  <tr><td class="lbl">LOTE</td><td rowspan="4" class="tit"><img src="${LOGO_MINSA}" alt=""><div><b>MINISTERIO DE SALUD</b><br>OFICINA GENERAL DE ESTADÍSTICA E INFORMÁTICA<br><b class="grande">Registro Diario de Atención y Otras Actividades de Salud</b></div></td><td class="lbl c" colspan="3">FIRMA Y SELLO RESPONSABLE DEL HIS</td></tr>
  <tr><td class="lbl">${cab(config.lote)}&nbsp;</td><td rowspan="3" colspan="3" class="firma"></td></tr>
  <tr><td class="lbl">PÁGINA ${np} de ${total}</td></tr>
  <tr><td class="lbl">FECHA ${cab(fecha)}</td></tr>
  <tr><td class="lbl">DIGITADOR ${cab(config.digit)}</td><td class="c small">TURNO: &nbsp; ${["M","T","N"].map(t=>t+" "+(bloques.some(b=>b.turno===t)?"☒":"☐")).join(" &nbsp; ")}</td><td colspan="3"></td></tr>
  </table>
  <table class="hdatos"><tr><th style="width:14mm">AÑO</th><th style="width:14mm">MES</th><th>NOMBRE DE ESTABLECIMIENTO DE SALUD (IPRESS)</th><th style="width:50mm">UNIDAD PRODUCTORA DE SALUD (UPS)</th><th style="width:70mm">NOMBRE DEL RESPONSABLE DE LA ATENCIÓN</th></tr>
  <tr><td class="c">${anio}</td><td class="c">${MESES[mes-1]}</td><td>${cab(config.estab)}</td><td>${cab(config.ups)}</td><td>${cab(config.resp)}</td></tr></table>
  <table class="hreg"><colgroup>${[7,9,22,11,22,9,5,8,9,11,11,11,9,9,62,5,5,5,7,7,7,16].map(w=>`<col style="width:${w}mm">`).join("")}</colgroup>
  <tr class="nums"><td></td><td>7</td><td>8</td><td>9</td><td>11</td><td colspan="2">13</td><td>14</td><td colspan="2">15</td><td colspan="2">16</td><td>17</td><td>18</td><td>19</td><td colspan="3">20</td><td colspan="3">21</td><td>22</td></tr>
  <tr class="th"><td rowspan="3">N°</td><td rowspan="3">DÍA</td><td>DNI</td><td>FINANCIA</td><td>DISTRITO DE PROCEDENCIA</td><td colspan="2" rowspan="3">EDAD</td><td rowspan="3">SEXO</td><td colspan="2" rowspan="3">PERÍMETRO CEFÁLICO Y ABDOMINAL</td><td colspan="2" rowspan="3">EVALUACIÓN ANTROPOMÉTRICA HEMOGLOBINA</td><td rowspan="3">ESTABLEC</td><td rowspan="3">SERVICIO</td><td rowspan="3">DIAGNÓSTICO MOTIVO DE CONSULTA Y/O ACTIVIDAD DE SALUD</td><td colspan="3" rowspan="2">TIPOS DE DIAGNÓSTICO</td><td colspan="3" rowspan="2">VALOR LAB</td><td rowspan="3">CÓDIGO</td></tr>
  <tr class="th"><td>HISTORIA CLÍNICA</td><td>10</td><td>12</td></tr>
  <tr class="th"><td>GESTANTE / PUÉRPERA</td><td>ETNIA</td><td>CENTRO POBLADO</td><td>P</td><td>D</td><td>R</td><td>1</td><td>2</td><td>3</td></tr>`;
  for(let i=0;i<BLOQUES_POR_PAGINA;i++){const a=bloques[i];h+=bloqueHIS(a,ini+i+1);}
  h+=`</table><div class="pie">Página ${np} de ${total}</div></div>`;return h;
}
function bloqueHIS(a,n){
  const v=k=>a?cab(a[k]):"";const x=k=>a&&a[k]==="X"?"X":"";
  const ncr=(p,l)=>a?(a[p+"_"+l.toLowerCase()]==="X"?"X":l):l;
  const dx=i=>a?[a[`dx${i}_txt`],a[`dx${i}_p`],a[`dx${i}_d`],a[`dx${i}_r`],a[`dx${i}_l1`],a[`dx${i}_l2`],a[`dx${i}_l3`],a[`dx${i}_cie`]].map(s=>cab(s)):["","","","","","","",""];
  const pd=(i,l)=>a?(a[`dx${i}_${l.toLowerCase()}`]==="X"?"X":l):l;
  const [d1,,,,l11,l12,l13,c1]=dx(1),[d2,,,,l21,l22,l23,c2]=dx(2),[d3,,,,l31,l32,l33,c3]=dx(3);
  return `<tr class="bn"><td class="c b">${a?n:""}</td><td colspan="2" class="lbl">NOMBRE DEL PACIENTE:</td><td colspan="19" class="nom">${a?cab(a.nombre):""}</td></tr>
  <tr class="bf"><td></td><td colspan="2" class="lbl">FECHA DE NACIMIENTO</td><td colspan="4">${a?cab((pacPorId(a.pacId)||{}).fn):""}</td><td colspan="3" class="lbl">FECHA DE HB</td><td colspan="4">${v('fechaHb')}</td><td class="lbl">FECHA DE REGLA</td><td colspan="7">${v('fechaRegla')}</td></tr>
  <tr class="b1"><td></td><td rowspan="3" class="c">${a?a.dia:""}</td><td class="c">${v('dni')}</td><td rowspan="2" class="c">${v('financia')}</td><td rowspan="2">${v('distrito')}</td><td rowspan="3" class="c b">${v('edad')}</td><td class="c">${a?(a.edadU==="A"?"X":"A"):"A"}</td><td rowspan="3" class="c">${v('sexo')}</td><td class="lbl">PC</td><td class="c">${v('pc')}</td><td class="lbl">PESO</td><td class="c">${v('peso')}</td><td class="c">${ncr('est','N')}</td><td class="c">${ncr('ser','N')}</td><td class="dx">${d1}</td><td class="c">${pd(1,'P')}</td><td class="c">${pd(1,'D')}</td><td class="c">${pd(1,'R')}</td><td class="c">${l11}</td><td class="c">${l12}</td><td class="c">${l13}</td><td class="c cod">${c1}</td></tr>
  <tr class="b2"><td></td><td class="c">${v('hc')}</td><td class="c">${a?(a.edadU==="M"?"X":"M"):"M"}</td><td class="lbl">PAB</td><td class="c">${v('pab')}</td><td class="lbl">TALLA</td><td class="c">${v('talla')}</td><td class="c">${ncr('est','C')}</td><td class="c">${ncr('ser','C')}</td><td class="dx">${d2}</td><td class="c">${pd(2,'P')}</td><td class="c">${pd(2,'D')}</td><td class="c">${pd(2,'R')}</td><td class="c">${l21}</td><td class="c">${l22}</td><td class="c">${l23}</td><td class="c cod">${c2}</td></tr>
  <tr class="b3"><td></td><td class="c">${v('gestante')}</td><td class="c">${v('etnia')}</td><td>${v('cpoblado')}</td><td class="c">${a?(a.edadU==="D"?"X":"D"):"D"}</td><td colspan="2"></td><td class="lbl">HB</td><td class="c">${v('hb')}</td><td class="c">${ncr('est','R')}</td><td class="c">${ncr('ser','R')}</td><td class="dx">${d3}</td><td class="c">${pd(3,'P')}</td><td class="c">${pd(3,'D')}</td><td class="c">${pd(3,'R')}</td><td class="c">${l31}</td><td class="c">${l32}</td><td class="c">${l33}</td><td class="c cod">${c3}</td></tr>`;
}
function exportRegistroXLSX(){if(typeof XLSX==="undefined"){alert("No se pudo cargar la librería de Excel (sin conexión).");return;}
  const lista=atencionesPeriodo();if(!lista.length){msg("No hay atenciones en el periodo");return;}
  const a=+document.getElementById('regAnio').value,m=+document.getElementById('regMes').value;
  const ws=XLSX.utils.aoa_to_sheet([CAB_AT].concat(lista.map(filaAt)));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"HIS "+MESES[m-1]+" "+a);XLSX.writeFile(wb,`PCT_HIS_${a}_${String(m).padStart(2,"0")}.xlsx`);}

/* ======================= INICIO ======================= */
cargar();renderDatos();escribirForm(null);pintarConfig();pintarCodigos();
