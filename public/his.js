/* Salud Ocular · REGISTRO HIS: hoja editable como la pestaña HIS del Excel (misma mecánica que PCT).
   Cada sección jala del padrón DATOS por N°: nombre, DNI, HC, fecha de nacimiento, edad, sexo, peso, talla y OD / OI.
   Por defecto lleva «Examen de los ojos y de la visión» (Z010) y «Determinación de la agudeza visual» (99173). */
(function(){
"use strict";
/* ======================= CONSTANTES ======================= */
const MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SET","OCT","NOV","DIC"];
const MESES_LARGO=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEM=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const NOMBRE_TURNO={M:"Turno mañana",T:"Turno tarde",N:"Turno noche"};
const LS_AT="ocular_his_atenciones_v1",LS_CFG="ocular_his_config_v1";
const BLOQUES_POR_PAGINA=10;
const LOGO="img/logo-minsa.jpg";
// Diagnósticos de salud ocular (como el Excel): código, descripción, tipo que se marca y fórmula del VALOR LAB
const DX_OCULAR=[
  {c:"Z010",t:"EXAMEN DE LOS OJOS Y DE LA VISIÓN",tipo:"d",re:/^(\d+\.\s*)?examen de (los )?ojos/},
  {c:"99173",t:"DETERMINACIÓN DE LA AGUDEZA VISUAL",tipo:"d",re:/^(\d+\.\s*)?determinacion de (la )?agudeza/},
  {c:"H527",t:"TRASTORNO DE LA REFRACCIÓN",tipo:"p",re:/^(\d+\.\s*)?trastorno de (la )?refraccion/},
  {c:"9940116",t:"CONSEJERÍA EN SALUD OCULAR",tipo:"d",re:/^(\d+\.\s*)?consejeria (en|de) salud ocular/}];
const CAB_AT=["FECHA","TURNO","N° REG","APELLIDOS Y NOMBRES","DNI","HC","EDAD","SEXO","FINANCIA","DISTRITO","ETNIA","C. POBLADO","GESTANTE","PC","PAB","PESO","TALLA","HB","F. HB","F. REGLA","ESTABLEC","SERVICIO","DX1","TIPO1","LAB1","CÓDIGO1","DX2","TIPO2","LAB2","CÓDIGO2","DX3","TIPO3","LAB3","CÓDIGO3"];

let atenciones={};
let config={estab:"C.S HUASCAR II",ups:"MEDICINA",resp:"MARI ALVA MAS",digit:"",lote:"",financia:"2",etnia:"58"};

/* ======================= UTILIDADES ======================= */
const $=id=>document.getElementById(id);
const p2=n=>String(n).padStart(2,"0");
function fmtFecha(d){return p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear();}
function cab(v){return esc(v==null?"":v);}
function sexoHIS(s){s=String(s||"").trim();if(/^h/i.test(s)||/^m(asc)?$/i.test(s))return "M";if(/^(mu|f)/i.test(s))return "F";return s.toUpperCase();}
function pacPorId(id){return pacientes.find(r=>r.id===id)||null;}
function pacPorN(n){n=parseInt(n);if(isNaN(n))return null;return pacientes.find(r=>parseInt(r.n)===n)||null;}
function nombreDe(r){return calcNombre(r).toUpperCase();}

/* ======================= PERSISTENCIA ======================= */
function cargar(){
  try{atenciones=JSON.parse(localStorage.getItem(LS_AT))||{};}catch(e){atenciones={};}
  try{config=Object.assign(config,JSON.parse(localStorage.getItem(LS_CFG))||{});}catch(e){}
}
function guardarAtenciones(){try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync&&Sync.programarAtenciones)Sync.programarAtenciones();}
function guardarConfig(){try{localStorage.setItem(LS_CFG,JSON.stringify(config));}catch(e){}if(window.Sync&&Sync.programarConfig)Sync.programarConfig();}

/* ======================= PANTALLA ======================= */
document.querySelector('.topbar .tabs').insertAdjacentHTML('beforebegin',`<div class="reloj no-print" id="reloj" title="Hora del equipo · el turno se selecciona solo (M 7:00–13:30 · T 13:35–20:00)"><div class="reloj-hora" id="relojHora">--:--:--</div><div class="reloj-info"><span class="reloj-fecha" id="relojFecha"></span><span class="reloj-turno" id="relojTurno"></span></div></div>`);
$('tabEval').insertAdjacentHTML('afterend',`<button id="tabRegistro" onclick="showView('registro')">REGISTRO HIS</button>`);
$('evaluacion').insertAdjacentHTML('afterend',`
<div id="registro" class="view">
  <div class="toolbar">
    <label class="lbl">Año <input type="number" id="regAnio" class="corto" min="2020" max="2100"></label>
    <label class="lbl">Mes <select id="regMes"></select></label>
    <label class="lbl">Día <select id="regDia"><option value="">Todos</option></select></label>
    <label class="lbl">Turno <select id="regTurno"><option value="M">M · Mañana</option><option value="T">T · Tarde</option><option value="N">N · Noche</option></select></label>
    <span class="status" id="regInfo"></span>
    <span class="savedTag" id="regSaved" title="Todo lo que escribe se guarda solo">Se guarda solo</span>
    <span class="sep"></span>
    <button class="btn" id="regAgregar" title="Añade otra sección al final de la hoja">＋ Agregar sección</button>
    <button class="btn primary" id="regGuardar" title="Guarda ahora (también se guarda automáticamente)">💾 Guardar</button>
    <button class="btn" id="regExcel">Exportar Excel</button>
    <button class="btn" onclick="window.print()">🖨 Imprimir / PDF</button>
  </div>
  <div class="toolbar cfgbar">
    <label class="lbl">Establecimiento (IPRESS) <input id="cfgEstab" class="cfg"></label>
    <label class="lbl">UPS <input id="cfgUps" class="cfg corto2"></label>
    <label class="lbl">Responsable <input id="cfgResp" class="cfg"></label>
    <label class="lbl">Digitador <input id="cfgDigit" class="cfg corto2"></label>
    <label class="lbl">Lote <input id="cfgLote" class="cfg corto"></label>
    <span class="sep"></span>
    <button class="btn" type="button" id="cpAbrir">Códigos propios</button>
  </div>
  <div id="cpPanel" class="toolbar cfgbar cppanel no-print">
    <form class="codform" id="cpForm" autocomplete="off"><input id="cpCod" name="cp-cod-nohist" placeholder="CÓDIGO (EJ. 9940116)" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase"><input id="cpTxt" name="cp-txt-nohist" placeholder="DESCRIPCIÓN (EJ. CONSEJERÍA EN SALUD OCULAR)" autocomplete="off" autocapitalize="characters" spellcheck="false" style="text-transform:uppercase"><button type="submit" class="btn primary" id="cpBtn">+ Agregar código</button><button type="button" class="btn" id="cpCancelar" style="display:none">Cancelar</button></form>
    <div class="codbusca"><input id="cpBuscar" placeholder="🔎 Buscar código o descripción…" autocomplete="off"><span id="cpCuenta" class="status"></span></div>
    <div id="cpLista" class="cplista"></div>
  </div>
  <div id="regWrap"><div id="hoja" class="his"></div></div>
</div>`);
const HOJA=$('hoja');

/* ======================= DIÁLOGOS PROPIOS ======================= */
const DLG=document.createElement('div');DLG.className='dlg-fondo no-print';DLG.innerHTML='<div class="dlg" role="dialog" aria-modal="true"><div class="dlg-ico"></div><div class="dlg-cuerpo"><h3 class="dlg-tit"></h3><p class="dlg-txt"></p></div><div class="dlg-btns"></div></div>';document.body.appendChild(DLG);
function dialogo(o){return new Promise(res=>{
  DLG.querySelector('.dlg-ico').textContent={pregunta:'?',peligro:'!',info:'i',ok:'✓'}[o.tipo||'pregunta'];DLG.querySelector('.dlg').dataset.tipo=o.tipo||'pregunta';
  DLG.querySelector('.dlg-tit').textContent=o.titulo||"";DLG.querySelector('.dlg-txt').textContent=o.texto||"";
  const bs=DLG.querySelector('.dlg-btns');bs.innerHTML="";const prev=document.activeElement;
  const cerrar=v=>{DLG.classList.remove('abierto');document.removeEventListener('keydown',tecla);if(prev&&prev.focus)prev.focus();res(v);};
  const tecla=e=>{if(e.key==='Escape'){e.preventDefault();cerrar(o.escape===undefined?false:o.escape);}};
  (o.botones||[{txt:"Cancelar",val:false},{txt:"Aceptar",val:true,clase:"primario"}]).forEach(b=>{const el=document.createElement('button');el.type="button";el.className="dlg-btn "+(b.clase||"");el.textContent=b.txt;el.onclick=()=>cerrar(b.val);bs.appendChild(el);});
  document.addEventListener('keydown',tecla);DLG.classList.add('abierto');
  const foco=bs.querySelector('.primario, .peligro')||bs.lastElementChild;if(foco)foco.focus();
});}
function confirmar(titulo,texto,opc){opc=opc||{};return dialogo({tipo:opc.peligro?'peligro':'pregunta',titulo,texto,botones:[{txt:opc.cancelar||"Cancelar",val:false},{txt:opc.ok||"Aceptar",val:true,clase:opc.peligro?"peligro":"primario"}]});}
function avisar(titulo,texto,tipo){return dialogo({tipo:tipo||'info',titulo,texto,botones:[{txt:"Entendido",val:true,clase:"primario"}],escape:true});}
DLG.addEventListener('mousedown',e=>{if(e.target===DLG){const b=DLG.querySelector('.dlg-btn');if(b)b.click();}});

/* ======================= MENÚ PREDICTIVO PROPIO DE LA HOJA ======================= */
const MP=document.createElement('div');MP.className='mp-lista his-mp no-print';document.body.appendChild(MP);
let mpInput=null,mpItems=[],mpSel=-1,mpSilencio=false,mpOnPick=null,mpNav=false;
function mpMostrar(input,opciones,alElegir,render){
  if(mpSilencio)return;const q=input.value,toks=normTxt(q).trim().split(/\s+/).filter(Boolean);
  mpItems=opciones(q,toks);mpInput=input;mpSel=0;mpNav=false;mpOnPick=alElegir;
  if(!mpItems.length){mpOcultar();return;}
  MP.innerHTML=mpItems.map((o,i)=>`<div class="mp-item${i?'':' act'}" data-i="${i}">${render(o,q)}</div>`).join("");
  const r=input.getBoundingClientRect();MP.style.left=Math.max(4,Math.min(r.left,window.innerWidth-Math.max(r.width,300)-8))+"px";MP.style.top=(r.bottom+3)+"px";MP.style.minWidth=Math.max(r.width,300)+"px";MP.style.display="block";
}
function mpOcultar(){MP.style.display="none";mpInput=null;}
function mpElegir(i){const el=mpInput,v=mpItems[i];if(!el||v==null)return;const fn=mpOnPick;mpOcultar();mpSilencio=true;try{fn(v,el);}finally{mpSilencio=false;}}
MP.addEventListener('mousedown',e=>{const it=e.target.closest('.mp-item');if(it){e.preventDefault();mpElegir(+it.dataset.i);}});
function activarPredictivo(input,opciones,alElegir,render,opts){opts=opts||{};
  if(input.dataset.mp)return;input.dataset.mp="1";
  const mostrar=()=>mpMostrar(input,opciones,alElegir,render);input._mpMostrar=mostrar;
  if(!opts.sinFoco)input.addEventListener('focus',mostrar);input.addEventListener('input',mostrar);
  input.addEventListener('blur',()=>setTimeout(()=>{if(mpInput===input)mpOcultar();},150));
  input.addEventListener('keydown',e=>{
    if(MP.style.display!=="block"||mpInput!==input)return;
    if(e.key==='ArrowDown'){e.preventDefault();mpSel=Math.min(mpItems.length-1,mpSel+1);mpNav=true;}
    else if(e.key==='ArrowUp'){e.preventDefault();mpSel=Math.max(0,mpSel-1);mpNav=true;}
    else if(e.key==='Enter'||e.key==='Tab'){if(e.key==='Enter')e.preventDefault();let k=mpSel;if(!mpNav){const v=normTxt(input.value).trim();const ex=mpItems.findIndex(o=>Array.isArray(o)&&normTxt(String(o[0]))===v);if(ex>=0)k=ex;}mpElegir(k);return;}
    else if(e.key==='Escape'){mpOcultar();return;}
    else return;
    MP.querySelectorAll('.mp-item').forEach((el,i)=>el.classList.toggle('act',i===mpSel));
    const act=MP.querySelector('.mp-item.act');if(act)act.scrollIntoView({block:'nearest'});
  });
}
window.addEventListener('scroll',e=>{if(e.target!==mpInput)mpOcultar();},true);window.addEventListener('resize',mpOcultar);

/* ======================= CÓDIGOS: salud ocular + propios + CIE-10 ======================= */
let CIE=null,CIE_N=null,cieCargando=null;
function cargarCIE(){if(CIE||cieCargando)return cieCargando;cieCargando=fetch('cie10.json').then(r=>r.json()).then(d=>{CIE=d;CIE_N=d.map(([c,t])=>normTxt(c+" "+t));return d;}).catch(()=>{cieCargando=null;msg("No se pudo cargar la lista CIE-10");return null;});return cieCargando;}
function codigosPropios(){return Array.isArray(config.codigos)?config.codigos.map(o=>({c:String(o.c||'').toUpperCase(),t:String(o.t||'').toUpperCase()})):[];}
function buscarCIE(q,toks){
  if(!toks.length)return [];const out=[],vistos=new Set();const cod=toks[0].toUpperCase();
  const add=(o)=>{const k=String(o[0]).toUpperCase();if(vistos.has(k))return;vistos.add(k);out.push(o);};
  DX_OCULAR.forEach(o=>{if(toks.every(t=>normTxt(o.c+" "+o.t).includes(t)))add([o.c,o.t,'ocular']);});
  codigosPropios().forEach(o=>{if(toks.every(t=>normTxt(o.c+" "+o.t).includes(t)))add([o.c,o.t,'propio']);});
  if(CIE)for(let i=0;i<CIE.length&&out.length<40;i++){if(toks.every(t=>CIE_N[i].includes(t)))add(CIE[i]);}
  const rk=o=>{const c=String(o[0]).toUpperCase();const extra=o[2]?0:1;if(c===cod)return 0;if(c.startsWith(cod))return 1+extra;return 3+extra;};
  out.sort((a,b)=>rk(a)-rk(b));return out.slice(0,12);
}
function renderCIE(o,q){return `<span class="cie-cod">${resaltar(o[0],q)}</span><span class="cie-txt">${resaltar(o[1],q)}</span>${o[2]==='propio'?'<span class="cie-propio">propio</span>':o[2]==='ocular'?'<span class="cie-ocular">salud ocular</span>':''}`;}
let cpEditando=null;
function pintarCodigos(){const li=$('cpLista');const lst=codigosPropios();const q=normTxt($('cpBuscar').value||"").trim();
  const vis=lst.map((o,i)=>[o,i]).filter(([o])=>!q||normTxt(o.c+" "+o.t).includes(q));
  $('cpCuenta').textContent=lst.length?(q?`${vis.length} de ${lst.length}`:`${lst.length} código(s) guardado(s)`):"";
  li.innerHTML=lst.length?(vis.length?vis.map(([o,i])=>`<span class="cpchip${cpEditando===o.c?' editando':''}"><b>${resaltar(o.c,q)}</b> ${resaltar(o.t,q)}<button type="button" class="cp-edit" title="Editar" data-ed="${i}">✎</button><button type="button" title="Quitar" data-qu="${i}">✕</button></span>`).join(""):'<span class="status">Ningún código coincide con la búsqueda.</span>'):'<span class="status">Aún no hay códigos propios. Los de salud ocular (Z010, 99173, H527, 9940116) ya están incluidos.</span>';}
function editarCodigo(i){const o=codigosPropios()[i];if(!o)return;cpEditando=o.c;$('cpCod').value=o.c;$('cpTxt').value=o.t;$('cpBtn').textContent="Guardar cambios";$('cpCancelar').style.display="";pintarCodigos();$('cpTxt').focus();}
function cancelarEdicionCodigo(){cpEditando=null;$('cpCod').value="";$('cpTxt').value="";$('cpBtn').textContent="+ Agregar código";$('cpCancelar').style.display="none";pintarCodigos();}
async function agregarCodigo(){const c=$('cpCod').value.trim().toUpperCase(),t=$('cpTxt').value.trim().toUpperCase();
  if(!c||!t){avisar("Datos incompletos","Escriba el código y su descripción.");return;}
  const lst=codigosPropios();
  if(cpEditando){const k=lst.findIndex(o=>o.c===cpEditando);if(k>=0){
      if(c!==cpEditando&&lst.some(o=>o.c===c)){avisar("Código repetido",`Ya existe otro código ${c}. Cambie el código o edite ese.`);return;}
      lst[k]={c,t};config.codigos=lst;guardarConfig();cancelarEdicionCodigo();msg("Código "+c+" actualizado");return;}cpEditando=null;}
  const rep=lst.find(o=>o.c===c);
  if(rep&&!await confirmar("Código existente",`El código ${c} ya existe con la descripción «${rep.t}». ¿Reemplazarla por «${t}»?`,{ok:"Reemplazar"}))return;
  config.codigos=lst.filter(o=>o.c!==c).concat([{c,t}]);guardarConfig();pintarCodigos();
  $('cpCod').value="";$('cpTxt').value="";$('cpCod').focus();msg("Código "+c+(rep?" actualizado":" agregado"));}
async function quitarCodigo(i){const lst=codigosPropios();const o=lst[i];if(!o||!await confirmar("Quitar código propio",`Se quitará el código ${o.c} · ${o.t} de la lista.`,{ok:"Quitar",peligro:true}))return;if(cpEditando===o.c)cancelarEdicionCodigo();lst.splice(i,1);config.codigos=lst;guardarConfig();pintarCodigos();}
$('cpAbrir').addEventListener('click',()=>$('cpPanel').classList.toggle('abierto'));
$('cpForm').addEventListener('submit',e=>{e.preventDefault();agregarCodigo();});
$('cpCancelar').addEventListener('click',cancelarEdicionCodigo);
$('cpBuscar').addEventListener('input',pintarCodigos);
$('cpLista').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ed!=null)editarCodigo(+b.dataset.ed);else if(b.dataset.qu!=null)quitarCodigo(+b.dataset.qu);});

/* ======================= FÓRMULAS DEL EXCEL (VALOR LAB desde DATOS) ======================= */
function dxOcular(txt,cod){const k=normTxt(txt).trim(),c=String(cod||"").toUpperCase().replace(/\./g,"");
  return DX_OCULAR.find(o=>(k&&o.re.test(k))||(!k&&c&&o.c===c))||null;}
// Excel HIS: Examen → =SI(O(OD>35;OI>35);"ALT";"N") · Agudeza → OD y OI · Trastorno de la refracción → RF si OD u OI ≥ 50
function labsFormula(o,pac){const od=num(pac&&pac.od),oi=num(pac&&pac.oi);const hay=od!=null||oi!=null;
  if(o.c==="Z010")return [hay?((od!=null&&od>35)||(oi!=null&&oi>35)?"ALT":"N"):"","",""];
  if(o.c==="99173")return [od==null?"":String(pac.od).trim(),oi==null?"":String(pac.oi).trim(),""];
  if(o.c==="H527")return [(od!=null&&od>=50)||(oi!=null&&oi>=50)?"RF":"","",""];
  return null;}
function formulaFila(a,i){if(!a)return null;const o=dxOcular(a[`dx${i}_txt`],a[`dx${i}_cie`]);if(!o)return null;const l=labsFormula(o,pacPorId(a.pacId));return l?{o,l}:null;}
// Igual que las fórmulas del Excel: los datos del paciente y los valores de OD / OI se actualizan solos desde DATOS
function aplicarFormulas(rec){if(!rec)return false;const pac=pacPorId(rec.pacId);let cambio=false;const pon=(k,v)=>{v=v==null?"":String(v);if((rec[k]==null?"":String(rec[k]))!==v){rec[k]=v;cambio=true;}};
  if(pac&&!esCont(rec)){pon('n',pac.n);pon('nombre',nombreDe(pac));pon('dni',pac.dni);pon('hc',pac.hc);pon('edad',calcEdad(pac.fn));pon('sexo',sexoHIS(pac.sexo));if(String(pac.peso||"").trim())pon('peso',pac.peso);if(String(pac.talla||"").trim())pon('talla',pac.talla);}
  for(let i=1;i<=3;i++){const f=formulaFila(rec,i);if(f)['l1','l2','l3'].forEach((k,j)=>pon(`dx${i}_${k}`,f.l[j]));}
  return cambio;}
function refrescarLabs(bloque,rec,i){const f=formulaFila(rec,i);
  ['l1','l2','l3'].forEach((k,j)=>{const el=bloque.querySelector(`[data-f="dx${i}_${k}"]`);if(!el)return;
    if(f){el.value=f.l[j];el.readOnly=true;el.classList.add('auto');el.tabIndex=-1;el.title="Automático desde DATOS (OD / OI), como la fórmula del Excel";}
    else{if(el.readOnly){el.readOnly=false;el.classList.remove('auto');el.tabIndex=0;el.title="";el.value=rec[`dx${i}_${k}`]||"";}}});}

/* ======================= REGISTRO HIS EDITABLE ======================= */
function creadoDe(a){return String(a.creado||a.guardado||"");}
function ordenAt(a,b){return creadoDe(a).localeCompare(creadoDe(b));} // orden de llegada, nunca por N°
function tipoDe(a,n){return a[`dx${n}_p`]==="X"?"P":a[`dx${n}_d`]==="X"?"D":a[`dx${n}_r`]==="X"?"R":"";}
function ncrDe(a,p){return a[p+"_n"]==="X"?"N":a[p+"_c"]==="X"?"C":a[p+"_r"]==="X"?"R":"";}
function esCont(a){return !!(a&&a.contDe);}
function principalDe(a){return a&&a.contDe?atenciones[a.contDe]||null:null;}
function filaAt(a){if(esCont(a)){const pr=principalDe(a);a=Object.assign({},a,{n:"",nombre:pr?`(continuación de N° ${pr.n} · ${pr.nombre})`:"(continuación)",dni:"",hc:"",edad:"",sexo:""});}const lab=n=>[a[`dx${n}_l1`],a[`dx${n}_l2`],a[`dx${n}_l3`]].filter(Boolean).join(" ");
  return [a.fecha,a.turno,a.n,a.nombre,a.dni,a.hc,a.edad,a.sexo,a.financia,a.distrito,a.etnia,a.cpoblado,a.gestante,a.pc,a.pab,a.peso,a.talla,a.hb,a.fechaHb,a.fechaRegla,ncrDe(a,'est'),ncrDe(a,'ser'),a.dx1_txt,tipoDe(a,1),lab(1),a.dx1_cie,a.dx2_txt,tipoDe(a,2),lab(2),a.dx2_cie,a.dx3_txt,tipoDe(a,3),lab(3),a.dx3_cie].map(v=>v==null?"":v);}
function pintarConfig(){for(const [id,k] of [['cfgEstab','estab'],['cfgUps','ups'],['cfgResp','resp'],['cfgDigit','digit'],['cfgLote','lote']]){const el=$(id);if(document.activeElement!==el)el.value=config[k]||"";}}
document.querySelectorAll('#registro .cfg').forEach(el=>el.addEventListener('input',()=>{const k={cfgEstab:'estab',cfgUps:'ups',cfgResp:'resp',cfgDigit:'digit',cfgLote:'lote'}[el.id];config[k]=el.value;guardarConfig();clearTimeout(pintarConfig._t);pintarConfig._t=setTimeout(()=>{HOJA.querySelectorAll('.hdatos tr:nth-child(2) td:nth-child(3)').forEach(t=>t.textContent=config.estab||"");HOJA.querySelectorAll('.hdatos tr:nth-child(2) td:nth-child(4)').forEach(t=>t.textContent=config.ups||"");HOJA.querySelectorAll('.hdatos tr:nth-child(2) td:nth-child(5)').forEach(t=>t.textContent=config.resp||"");HOJA.querySelectorAll('.cab-lote').forEach(t=>t.textContent=config.lote||"");HOJA.querySelectorAll('.cab-digit').forEach(t=>t.textContent=config.digit||"");},300);}));
function periodo(){return {a:+$('regAnio').value,m:+$('regMes').value,d:$('regDia').value};}
function llenarDias(){const {a,m}=periodo(),sel=$('regDia'),act=sel.value;const dias=new Set(Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m).map(x=>x.dia));
  sel.innerHTML=`<option value="">Todos los días</option>`+[...dias].sort((x,y)=>x-y).map(d=>`<option value="${d}">${p2(d)}</option>`).join("");if([...dias].includes(+act))sel.value=act;}
function turnoSel(){return $('regTurno').value||"M";}
// Cada turno es una hoja aparte: se muestran solo las atenciones del turno seleccionado (las demás quedan guardadas)
function atencionesPeriodo(){const {a,m,d}=periodo();const t=turnoSel();const todas=Object.values(atenciones).filter(x=>x.anio===a&&x.mes===m&&(x.turno||"M")===t);
  const conts={};todas.forEach(x=>{if(x.contDe&&atenciones[x.contDe])(conts[x.contDe]=conts[x.contDe]||[]).push(x);});
  const princ=todas.filter(x=>!(x.contDe&&atenciones[x.contDe])).filter(x=>!d||x.dia===+d).sort(ordenAt);
  const out=[];princ.forEach(x=>{out.push(x);(conts[x.id]||[]).sort(ordenAt).forEach(c=>out.push(c));});return out;}
function diaPorDefecto(){const {a,m,d}=periodo();if(d)return +d;const h=new Date();return (h.getFullYear()===a&&h.getMonth()+1===m)?h.getDate():"";}
function focoHoja(){const el=document.activeElement;const bl=el&&el.closest&&el.closest('#hoja .bloque');return bl?{id:bl.dataset.id,f:el.dataset.f,s:el.selectionStart}:null;}
function restaurarFocoHoja(f){if(!f||!f.id)return;const el=HOJA.querySelector(`.bloque[data-id="${f.id}"] [data-f="${f.f}"]`);if(el){el.focus();try{el.setSelectionRange(f.s,f.s);}catch(e){}}}
function infoPeriodo(n){const {a,m}=periodo();$('regInfo').textContent=`${n} atención(es) · ${MESES_LARGO[m-1]} ${a} · ${NOMBRE_TURNO[turnoSel()]}`;}
let bloquesExtra=0;
function renderRegistro(){
  const lista=atencionesPeriodo(),{a,m}=periodo();
  let cambio=false;lista.forEach(x=>{if(aplicarFormulas(x))cambio=true;});if(cambio)guardarAtenciones();
  infoPeriodo(lista.length);
  const bloques=lista.concat(Array(1+bloquesExtra).fill(null)); // siempre al menos una sección vacía al final
  const paginas=[];for(let i=0;i<bloques.length;i+=BLOQUES_POR_PAGINA)paginas.push(bloques.slice(i,i+BLOQUES_POR_PAGINA));
  const f=focoHoja();
  HOJA.innerHTML=paginas.map((bl,pi)=>paginaHIS(bl,pi+1,paginas.length,a,m)).join("");
  activarHoja();restaurarFocoHoja(f);asegurarBloqueVacio();
}
function asegurarBloqueVacio(){if(HOJA.querySelector('.bloque[data-nuevo]'))return;const tablas=HOJA.querySelectorAll('.hreg');const t=tablas[tablas.length-1];if(!t)return;t.insertAdjacentHTML('beforeend',bloqueHIS(null,HOJA.querySelectorAll('.bloque').length+1));activarHoja();}
new MutationObserver(()=>{clearTimeout(asegurarBloqueVacio._t);asegurarBloqueVacio._t=setTimeout(asegurarBloqueVacio,50);}).observe(HOJA,{childList:true,subtree:true});
function paginaHIS(bloques,np,total,anio,mes){
  const ini=(np-1)*BLOQUES_POR_PAGINA;const {d}=periodo();const fecha=d?p2(d)+"/"+p2(mes)+"/"+anio:"";const ts=turnoSel();
  const reverso=np%2===0; // como la hoja física por ambas caras: el reverso solo lleva la fila AÑO / MES / ESTABLECIMIENTO
  let h=`<div class="pagina${reverso?' reverso':''}">`+(reverso?'':`<div class="logo-linea"><img src="${LOGO}" alt="Ministerio de Salud"></div>
  <table class="hcab"><colgroup><col style="width:24mm"><col style="width:24mm"><col style="width:148mm"><col style="width:22mm"><col style="width:22mm"><col style="width:22mm"></colgroup>
  <tr><td class="rot">LOTE</td><td class="caja cab-lote">${cab(config.lote)}</td><td rowspan="4" class="tit"><div><b class="minsa">MINISTERIO DE SALUD</b><br>OFICINA GENERAL DE TECNOLOGÍAS DE LA INFORMACIÓN<br>OFICINA DE GESTIÓN DE LA INFORMACIÓN<br><b class="grande">Registro Diario de Atención y Otras Actividades de Salud</b></div></td><td colspan="3" rowspan="2" class="firma"><div class="firma-tit">FIRMA Y SELLO RESPONSABLE HIS MINSA</div></td></tr>
  <tr><td class="rot">PÁGINA</td><td class="caja">${np} de ${total}</td></tr>
  <tr><td class="rot">FECHA PROCES.</td><td class="caja">${cab(fecha)}</td><td class="tn tn-num">1</td><td colspan="2" class="tn tn-tit">TURNO</td></tr>
  <tr><td class="rot">DNI DIGITADOR</td><td class="caja cab-digit">${cab(config.digit)}</td>${["M","T","N"].map(t=>`<td class="tn turno-cab${t===ts?' on':''}" data-t="${t}">${t}${t===ts?' ☒':''}</td>`).join("")}</tr>
  </table>`)+`
  <table class="hdatos"><tr><th style="width:14mm"><i>2</i> AÑO</th><th style="width:14mm"><i>3</i> MES</th><th><i>4</i> NOMBRE DE ESTABLECIMIENTO DE SALUD (IPRESS)</th><th style="width:55mm"><i>5</i> UNIDAD PRODUCTORA DE SERVICIOS (UPSS)</th><th style="width:70mm"><i>6</i> NOMBRE DEL RESPONSABLE DE LA ATENCIÓN</th></tr>
  <tr><td class="c">${anio}</td><td class="c">${MESES[mes-1]}</td><td>${cab(config.estab)}</td><td>${cab(config.ups)}</td><td>${cab(config.resp)}</td></tr></table>
  <table class="hreg"><colgroup>${[10,9,22,11,22,9,5,8,9,11,11,13,9,9,42,5,5,5,10,10,10,22].map(w=>`<col style="width:${w}mm">`).join("")}</colgroup>
  <tr class="nums"><td></td><td>7</td><td>8</td><td>9</td><td>11</td><td colspan="2">13</td><td>14</td><td colspan="2">15</td><td colspan="2">16</td><td>17</td><td>18</td><td>19</td><td colspan="3">20</td><td colspan="3">21</td><td>22</td></tr>
  <tr class="th"><td rowspan="3">N°</td><td rowspan="3">DÍA</td><td>DNI</td><td>FINANCIA</td><td>DISTRITO DE PROCEDENCIA</td><td colspan="2" rowspan="3">EDAD</td><td rowspan="3">SEXO</td><td colspan="2" rowspan="3">PERÍMETRO CEFÁLICO Y ABDOMINAL</td><td colspan="2" rowspan="3">EVALUACIÓN ANTROPOMÉTRICA HEMOGLOBINA</td><td rowspan="3">ESTABLEC</td><td rowspan="3">SERVICIO</td><td rowspan="3">DIAGNÓSTICO MOTIVO DE CONSULTA Y/O ACTIVIDAD DE SALUD</td><td colspan="3" rowspan="2">TIPOS DE DIAGNÓSTICO</td><td colspan="3" rowspan="2">VALOR LAB</td><td rowspan="3">CÓDIGO</td></tr>
  <tr class="th"><td>HISTORIA CLÍNICA</td><td>10</td><td>12</td></tr>
  <tr class="th"><td>GESTANTE / PUÉRPERA</td><td>ETNIA</td><td>CENTRO POBLADO</td><td>P</td><td>D</td><td>R</td><td>1</td><td>2</td><td>3</td></tr>`;
  for(let i=0;i<bloques.length;i++)h+=bloqueHIS(bloques[i],ini+i+1);
  h+=`</table><div class="pie">Página ${np} de ${total}</div></div>`;return h;
}
function inp(a,f,cls,extra){return `<input class="hi ${cls||''}" data-f="${f}" value="${a?cab(a[f]):''}" ${extra||''}>`;}
// el diagnóstico va en dos líneas cuando el texto es largo (pantalla e impresión)
function txtDx(a,f){return `<textarea class="hi dxtxt" data-f="${f}" rows="2" autocomplete="off" spellcheck="false">${a?cab(a[f]):''}</textarea>`;}
function ajustarDx(el){if(!el||el.tagName!=='TEXTAREA')return;el.style.fontSize="";if(!el.value||!el.offsetParent)return;let f=parseFloat(getComputedStyle(el).fontSize);while(el.scrollHeight>el.clientHeight+1&&f>11){f-=.5;el.style.fontSize=f+"px";}}
function tog(a,f,letra,grupo){const on=a&&a[f]==="X";return `<span class="tg${on?' on':''}" data-f="${f}" data-g="${grupo}">${on?'X':letra}</span>`;}
function labCelda(a,i,k){const f=formulaFila(a,i);return f?`<input class="hi c lab auto" data-f="dx${i}_${k}" value="${cab(a[`dx${i}_${k}`])}" readonly tabindex="-1" title="Automático desde DATOS (OD / OI), como la fórmula del Excel">`:inp(a,`dx${i}_${k}`,'c lab','maxlength="3"');}
function bloqueHIS(a,n){
  const id=a?a.id:"nuevo-"+n;const cont=esCont(a);const pac=(a&&!cont)?(pacPorId(a.pacId)||{}):{};const pr=cont?principalDe(a):null;
  const fila=i=>`<td class="dx">${txtDx(a,`dx${i}_txt`)}</td><td class="c">${tog(a,`dx${i}_p`,'P','dx'+i)}</td><td class="c">${tog(a,`dx${i}_d`,'D','dx'+i)}</td><td class="c">${tog(a,`dx${i}_r`,'R','dx'+i)}</td><td class="c">${labCelda(a,i,'l1')}</td><td class="c">${labCelda(a,i,'l2')}</td><td class="c">${labCelda(a,i,'l3')}</td><td class="c cod">${inp(a,`dx${i}_cie`,'dxcod c b','autocomplete="off"')}</td>`;
  return `<tbody class="bloque${cont?' cont':''}" data-id="${id}" ${a?'':'data-nuevo="1"'}>
  <tr class="bn"><td class="c b">${cont?'<span class="npac-bloq" title="Sección ligada al paciente anterior: no lleva N°">🔒</span>':`<input class="hi npac c b" data-f="npac" value="${a?cab(a.n):''}" autocomplete="off" title="N° del paciente en DATOS (o escriba nombre / DNI)">`}</td><td colspan="2" class="lbl">NOMBRES Y APELLIDOS:</td><td colspan="18" class="nom" data-auto="nombre" ${cont?`data-cont-de="${cab(pr?pr.n:'')}"`:''}>${a&&!cont?cab(a.nombre):''}</td><td class="c no-print"><button type="button" class="quitar" title="${a?'Quitar esta atención':'Quitar esta sección vacía'}">✕</button></td></tr>
  <tr class="bf"><td></td><td colspan="2" class="lbl">FECHA DE NACIMIENTO</td><td colspan="4" data-auto="fn">${cab(pac.fn)}</td><td colspan="3" class="lbl">FECHA ÚLT. RESULT. Hb</td><td colspan="4">${inp(a,'fechaHb')}</td><td class="lbl">FECHA DE ÚLTIMA REGLA</td><td colspan="7">${inp(a,'fechaRegla')}</td></tr>
  <tr class="b1"><td></td><td rowspan="3" class="c">${cont?'<input class="hi c b" data-f="dia" value="" readonly title="Continuación: el día es el de la sección anterior">':inp(a,'dia','c b','inputmode="numeric" maxlength="2"')}</td><td class="c" data-auto="dni">${a&&!cont?cab(a.dni):''}</td><td rowspan="2" class="c">${inp(a,'financia','c')}</td><td rowspan="2">${inp(a,'distrito')}</td><td rowspan="3" class="c b" data-auto="edad">${a&&!cont?cab(a.edad):''}</td><td class="c">${tog(a,'edad_a','A','edad')}</td><td rowspan="3" class="c" data-auto="sexo">${a&&!cont?cab(a.sexo):''}</td><td class="lbl">PC</td><td class="c">${inp(a,'pc','c')}</td><td class="lbl">PESO</td><td class="c">${inp(a,'peso','c')}</td><td class="c">${tog(a,'est_n','N','est')}</td><td class="c">${tog(a,'ser_n','N','ser')}</td>${fila(1)}</tr>
  <tr class="b2"><td></td><td class="c" data-auto="hc">${a&&!cont?cab(a.hc):''}</td><td class="c">${tog(a,'edad_m','M','edad')}</td><td class="lbl">PAB</td><td class="c">${inp(a,'pab','c')}</td><td class="lbl">TALLA</td><td class="c">${inp(a,'talla','c')}</td><td class="c">${tog(a,'est_c','C','est')}</td><td class="c">${tog(a,'ser_c','C','ser')}</td>${fila(2)}</tr>
  <tr class="b3"><td></td><td class="c">${inp(a,'gestante','c','maxlength="1"')}</td><td class="c">${inp(a,'etnia','c')}</td><td>${inp(a,'cpoblado')}</td><td class="c">${tog(a,'edad_d','D','edad')}</td><td colspan="2"></td><td class="lbl">HB</td><td class="c">${inp(a,'hb','c')}</td><td class="c">${tog(a,'est_r','R','est')}</td><td class="c">${tog(a,'ser_r','R','ser')}</td>${fila(3)}</tr>
  </tbody>`;
}
function defaultsAt(){const ult=Object.values(atenciones).sort((x,y)=>String(x.guardado||"").localeCompare(String(y.guardado||""))).pop()||{};
  return {turno:turnoSel(),financia:config.financia||"2",distrito:ult.distrito||"",etnia:config.etnia||"58",cpoblado:ult.cpoblado||"",edad_a:"X",est_c:"X",ser_c:"X",
    // como cada sección del Excel: 1. Examen de los ojos y de la visión (D) y 2. Determinación de la agudeza visual (D)
    dx1_txt:DX_OCULAR[0].t,dx1_d:"X",dx1_cie:DX_OCULAR[0].c,dx2_txt:DX_OCULAR[1].t,dx2_d:"X",dx2_cie:DX_OCULAR[1].c};}
function crearContinuacion(principal){const {a,m}=periodo();const id=uid();const ahora=new Date().toISOString();
  const rec={id,contDe:principal.id,pacId:principal.pacId,n:"",nombre:"",dni:"",hc:"",sexo:"",edad:"",anio:a,mes:m,dia:principal.dia,fecha:principal.fecha,turno:principal.turno,creado:ahora,guardado:ahora};
  atenciones[id]=rec;guardarAtenciones();return rec;}
function ultimaPrincipal(){const l=atencionesPeriodo().filter(x=>!esCont(x));return l.length?l[l.length-1]:null;}
function principalAnterior(bloque){let b=bloque.previousElementSibling;while(b){if(b.classList.contains('bloque')){const r=atenciones[b.dataset.id];if(r)return esCont(r)?principalDe(r):r;}b=b.previousElementSibling;}return null;}
function crearAtencion(bloque,pac){
  const {a,m}=periodo();const dia=parseInt(bloque.querySelector('[data-f=dia]').value)||diaPorDefecto()||1;const ahora=new Date().toISOString();
  const rec=Object.assign({},defaultsAt(),{id:uid(),pacId:pac.id,peso:pac.peso||"",talla:pac.talla||"",anio:a,mes:m,dia,fecha:p2(dia)+"/"+p2(m)+"/"+a,creado:ahora,guardado:ahora});
  // conservar lo que ya se escribió en la sección vacía
  bloque.querySelectorAll('.hi').forEach(i=>{if(i.dataset.f!=='npac'&&i.dataset.f!=='dia'&&!i.readOnly&&i.value.trim())rec[i.dataset.f]=i.value.replace(/\s*\n\s*/g,' ').toUpperCase();});
  bloque.querySelectorAll('.tg.on').forEach(t=>rec[t.dataset.f]="X");
  aplicarFormulas(rec);atenciones[rec.id]=rec;guardarAtenciones();return rec;
}
function asignarPaciente(bloque,pac){
  let rec=atenciones[bloque.dataset.id];
  if(!rec){rec=crearAtencion(bloque,pac);bloque.dataset.id=rec.id;bloque.removeAttribute('data-nuevo');if(bloquesExtra>0&&HOJA.querySelector('.bloque[data-nuevo]'))bloquesExtra--;}
  else{rec.pacId=pac.id;aplicarFormulas(rec);guardarAtenciones();}
  // llenar las celdas automáticas como las fórmulas BUSCARV del Excel
  bloque.querySelector('[data-f=npac]').value=pac.n;
  bloque.querySelector('[data-auto=nombre]').textContent=rec.nombre||"";bloque.querySelector('[data-auto=fn]').textContent=pac.fn||"";
  bloque.querySelector('[data-auto=dni]').textContent=rec.dni||"";bloque.querySelector('[data-auto=hc]').textContent=rec.hc||"";
  bloque.querySelector('[data-auto=edad]').textContent=rec.edad||"";bloque.querySelector('[data-auto=sexo]').textContent=rec.sexo||"";
  bloque.querySelectorAll('.hi').forEach(i=>{const k=i.dataset.f;if(k==='npac')return;if(rec[k]!=null&&i.value!==String(rec[k]))i.value=rec[k];});
  bloque.querySelectorAll('textarea.dxtxt').forEach(ajustarDx);
  bloque.querySelectorAll('.tg').forEach(t=>{const on=rec[t.dataset.f]==="X";t.classList.toggle('on',on);t.textContent=on?'X':t.dataset.f.split('_')[1].toUpperCase();});
  for(let i=1;i<=3;i++)refrescarLabs(bloque,rec,i);
  marcarGuardado();llenarDias();infoPeriodo(atencionesPeriodo().length);
  if(!HOJA.querySelector('.bloque[data-nuevo]')){clearTimeout(asignarPaciente._t);asignarPaciente._t=setTimeout(renderRegistro,0);}
}
function guardarCelda(el){
  const bloque=el.closest('.bloque');if(!bloque)return;const rec=atenciones[bloque.dataset.id];if(!rec||el.readOnly&&!el.classList.contains('tg'))return;
  const k=el.dataset.f;let v=el.classList.contains('tg')?(el.classList.contains('on')?"X":""):el.value;
  if(!el.classList.contains('tg')&&typeof v==='string'){const u=v.replace(/\s*\n\s*/g,' ').toUpperCase();if(u!==v){v=u;el.value=v;}} // en las secciones todo va en mayúsculas y en una sola línea de texto
  if(k==='dia'){const d=parseInt(v);if(!isNaN(d)&&d>=1&&d<=31){rec.dia=d;rec.fecha=p2(d)+"/"+p2(rec.mes)+"/"+rec.anio;}}
  else rec[k]=v;
  if((k==='peso'||k==='talla')&&!esCont(rec)){const p=pacPorId(rec.pacId);if(p&&v&&p[k]!==v){p[k]=v;guardarPacientes();}}
  const m=/^dx(\d)_(txt|cie)$/.exec(k);if(m){const i=+m[1];const antes=el._formula;const f=formulaFila(rec,i);if(!f&&antes){['l1','l2','l3'].forEach(x=>rec[`dx${i}_${x}`]="");}aplicarFormulas(rec);refrescarLabs(bloque,rec,i);el._formula=!!f;}
  rec.guardado=new Date().toISOString();guardarAtenciones();marcarGuardado();
}
function elegirCIE(v,el){const tr=el.closest('tr'),bl=el.closest('.bloque');const txt=tr.querySelector('[data-f$="_txt"]'),cod=tr.querySelector('[data-f$="_cie"]');
  const i=+/^dx(\d)/.exec(txt.dataset.f)[1];const rec=atenciones[bl.dataset.id];
  txt._formula=!!formulaFila(rec,i);txt.value=String(v[1]).toUpperCase();cod.value=v[0];guardarCelda(txt);guardarCelda(cod);ajustarDx(txt);
  // marcar el tipo de diagnóstico (P / D / R) que corresponde al código de salud ocular
  const o=dxOcular(txt.value,cod.value);if(o&&rec){bl.querySelectorAll(`.tg[data-g="dx${i}"]`).forEach(t=>{const on=t.dataset.f===`dx${i}_${o.tipo}`;t.classList.toggle('on',on);t.textContent=on?'X':t.dataset.f.split('_')[1].toUpperCase();guardarCelda(t);});}}
function sugerirPaciente(q,toks){if(!toks.length)return [];const qn=q.trim(),esNum=/^\d+$/.test(qn);if(/^0+$/.test(qn))return []; // 0 = continuación del paciente anterior
  const rank=r=>{const n=String(r.n);if(esNum){if(n===qn)return 0;if(n.startsWith(qn))return 1;if(String(r.dni||"").startsWith(qn)||String(r.hc||"").replace(/\s/g,"").startsWith(qn))return 2;return 9;}
    return toks.every(t=>normTxt([r.n,r.dni,r.hc,calcNombre(r)].join(" ")).includes(t))?3:9;};
  return pacientes.map(r=>[rank(r),r]).filter(x=>x[0]<9).sort((x,y)=>x[0]-y[0]||(parseInt(x[1].n)||0)-(parseInt(y[1].n)||0)).slice(0,8).map(x=>x[1]);}
function renderPac(r,q){return `<span class="cie-cod">N° ${resaltar(String(r.n),q)}</span><span class="cie-txt">${resaltar(calcNombre(r)||"(sin nombre)",q)} · DNI ${resaltar(r.dni||"—",q)}</span>`;}
function activarHoja(){
  HOJA.querySelectorAll('input.npac').forEach(el=>activarPredictivo(el,sugerirPaciente,(r,i)=>asignarPaciente(i.closest('.bloque'),r),renderPac));
  HOJA.querySelectorAll('textarea.dxtxt').forEach(el=>{ajustarDx(el);if(el.dataset.ent)return;el.dataset.ent="1";el.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});el.addEventListener('input',()=>ajustarDx(el));});
  HOJA.querySelectorAll('.dxtxt,input.dxcod').forEach(el=>{if(el.dataset.mp)return;el.addEventListener('focus',()=>{const pr=cargarCIE();if(pr&&!CIE)pr.then(()=>{if(document.activeElement===el&&el.value.trim())el._mpMostrar();});},{once:true});
    el.addEventListener('focus',()=>{const bl=el.closest('.bloque'),rec=atenciones[bl.dataset.id];const i=+/^dx(\d)/.exec(el.dataset.f)[1];el._formula=!!formulaFila(rec,i);});
    activarPredictivo(el,buscarCIE,elegirCIE,renderCIE,{sinFoco:true});});
}
HOJA.addEventListener('change',e=>{const el=e.target;if(!el.classList.contains('hi'))return;
  const bl=el.closest('.bloque');
  if(el.dataset.f==='npac'){const v=el.value.trim();
    if(v==="0"&&!atenciones[bl.dataset.id]){const pr=principalAnterior(bl);if(!pr){el.value="";msg("No hay un paciente anterior al que pertenezca esta sección");return;}
      const rec=crearContinuacion(pr);bl.dataset.id=rec.id;bl.removeAttribute('data-nuevo');el.value="";
      bl.querySelectorAll('.hi').forEach(i=>{if(i.dataset.f!=='npac'&&!i.readOnly&&i.value.trim())rec[i.dataset.f]=i.value.replace(/\s*\n\s*/g,' ').toUpperCase();});guardarAtenciones();marcarGuardado();
      if(bloquesExtra>0&&HOJA.querySelector('.bloque[data-nuevo]'))bloquesExtra--;setTimeout(renderRegistro,0);msg("Sección de continuación de N° "+pr.n);return;}
    const p=pacPorN(v);if(p)asignarPaciente(bl,p);else if(v&&!atenciones[bl.dataset.id])msg("No existe un paciente con N° "+v+" en DATOS");return;}
  if(!atenciones[bl.dataset.id]){if(el.value.trim())msg("Primero escriba el N° del paciente en esta sección");return;}
  if(/^(fechaHb|fechaRegla)$/.test(el.dataset.f)){const d=parseFecha(el.value);if(d)el.value=fmtFecha(d);}
  guardarCelda(el);});
HOJA.addEventListener('input',e=>{const el=e.target;if(!el.classList.contains('hi')||el.dataset.f==='npac'||el.readOnly)return;const bl=el.closest('.bloque');if(atenciones[bl.dataset.id]){const st=$('regSaved');st.textContent="Guardando…";st.classList.remove('ok');clearTimeout(el._t);el._t=setTimeout(()=>{el._t=null;guardarCelda(el);},500);}});
HOJA.addEventListener('click',async e=>{
  const q=e.target.closest('.quitar');if(q){const bl=q.closest('.bloque'),rec=atenciones[bl.dataset.id];
    if(!rec){if(HOJA.querySelectorAll('.bloque[data-nuevo]').length<=1){msg("Debe quedar al menos una sección vacía para registrar");return;}bloquesExtra=Math.max(0,bloquesExtra-1);bl.remove();return;}
    const conts=Object.values(atenciones).filter(x=>x.contDe===rec.id);const pr=principalDe(rec);
    const txt=esCont(rec)?`Se quitará esta sección de continuación${pr?` de N° ${pr.n} · ${pr.nombre}`:''}.`:`Se quitará de la hoja la atención de N° ${rec.n} · ${rec.nombre} del ${rec.fecha||''}${conts.length?` y sus ${conts.length} sección(es) de continuación`:''}.`;
    if(!await confirmar(esCont(rec)?"Quitar continuación":"Quitar atención",txt,{ok:"Quitar",peligro:true}))return;if(!atenciones[bl.dataset.id])return;
    conts.forEach(c=>delete atenciones[c.id]);delete atenciones[bl.dataset.id];guardarAtenciones();renderRegistro();msg("Atención quitada");return;}
  const t=e.target.closest('.tg');if(!t)return;const bl=t.closest('.bloque');if(!atenciones[bl.dataset.id]){msg("Primero escriba el N° del paciente en esta sección");return;}
  const on=!t.classList.contains('on');
  bl.querySelectorAll(`.tg[data-g="${t.dataset.g}"]`).forEach(x=>{const xon=x===t?on:false;x.classList.toggle('on',xon);x.textContent=xon?'X':x.dataset.f.split('_')[1].toUpperCase();guardarCelda(x);});
});
function marcarGuardado(){const st=$('regSaved');const h=new Date();st.textContent="✔ Guardado "+p2(h.getHours())+":"+p2(h.getMinutes());st.classList.add('ok');}
async function agregarSeccion(){
  const ult=ultimaPrincipal();let cont=false;
  if(ult){const r=await dialogo({tipo:'pregunta',titulo:"Agregar sección",texto:`¿La nueva sección es de otro paciente o es continuación de N° ${ult.n} · ${ult.nombre} (más diagnósticos)?\nLa continuación va sin N°, nombre ni datos: pertenece al paciente anterior.`,botones:[{txt:"Cancelar",val:null},{txt:"Continuación de N° "+ult.n,val:"cont"},{txt:"Nuevo paciente",val:"nuevo",clase:"primario"}],escape:null});
    if(r===null)return;cont=r==="cont";}
  if(cont){const rec=crearContinuacion(ult);renderRegistro();const b=HOJA.querySelector(`.bloque[data-id="${rec.id}"]`);if(b){b.scrollIntoView({block:'center',behavior:'smooth'});b.querySelector('[data-f=dx1_txt]').focus();}msg("Sección de continuación de N° "+ult.n+" añadida");return;}
  bloquesExtra++;renderRegistro();const nuevos=HOJA.querySelectorAll('.bloque[data-nuevo]');const b=nuevos[nuevos.length-1];if(b){b.scrollIntoView({block:'center',behavior:'smooth'});b.querySelector('.npac').focus();}msg("Sección añadida: escriba el N° del paciente");}
function guardarTodo(){const el=document.activeElement;if(el&&el.classList&&el.classList.contains('hi'))el.blur();
  HOJA.querySelectorAll('.hi').forEach(i=>{if(i._t){clearTimeout(i._t);i._t=null;guardarCelda(i);}});
  guardarPacientes();guardarAtenciones();guardarConfig();marcarGuardado();
  const n=atencionesPeriodo().length;msg(n?`Guardado: ${n} atención(es) de este periodo`:"No hay atenciones que guardar: escriba el N° del paciente en una sección");}
function exportRegistroXLSX(){if(typeof XLSX==="undefined"){avisar("Sin conexión","No se pudo cargar la librería de Excel.");return;}
  const lista=atencionesPeriodo();if(!lista.length){msg("No hay atenciones en el periodo");return;}
  const {a,m}=periodo();const ws=XLSX.utils.aoa_to_sheet([CAB_AT].concat(lista.map(filaAt)));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"HIS "+MESES[m-1]+" "+a);XLSX.writeFile(wb,`OCULAR_HIS_${a}_${p2(m)}_${turnoSel()}.xlsx`);}
$('regAgregar').addEventListener('click',agregarSeccion);$('regGuardar').addEventListener('click',guardarTodo);$('regExcel').addEventListener('click',exportRegistroXLSX);
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='s'&&$('registro').classList.contains('active')){e.preventDefault();guardarTodo();}});

/* ======================= PERIODO, RELOJ Y TURNO AUTOMÁTICO ======================= */
(function(){const h=new Date();$('regMes').innerHTML=MESES_LARGO.map((m,i)=>`<option value="${i+1}">${m}</option>`).join("");$('regMes').value=h.getMonth()+1;$('regAnio').value=h.getFullYear();
  ['regAnio','regMes','regDia'].forEach(id=>$(id).addEventListener('change',()=>{if(id!=='regDia')llenarDias();renderRegistro();}));})();
const activa=()=>$('registro').classList.contains('active');
// M = 7:00 a 13:30 · T = 13:35 a 20:00 · fuera de ese horario = N
function turnoActual(d){const min=d.getHours()*60+d.getMinutes();if(min>=7*60&&min<=13*60+34)return "M";if(min>=13*60+35&&min<=20*60)return "T";return "N";}
let turnoManual=false;$('regTurno').addEventListener('change',()=>{turnoManual=true;if(activa())renderRegistro();});
function tickReloj(){const d=new Date();
  $('relojHora').textContent=`${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  const ds=DIAS_SEM[d.getDay()];$('relojFecha').textContent=`${ds.charAt(0).toUpperCase()+ds.slice(1)} ${d.getDate()} de ${MESES_LARGO[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  const t=turnoActual(d);const rt=$('relojTurno');rt.textContent=NOMBRE_TURNO[t];rt.dataset.t=t;
  const sel=$('regTurno');if(!turnoManual&&sel.value!==t){sel.value=t;if(activa()){renderRegistro();msg("Empieza el "+NOMBRE_TURNO[t].toLowerCase()+": hoja nueva (las atenciones del turno anterior quedan guardadas)");}}}
tickReloj();setInterval(tickReloj,1000);
(function(){const tb=document.querySelector('.topbar');const fija=()=>document.documentElement.style.setProperty('--tb',tb.offsetHeight+'px');fija();window.addEventListener('resize',fija);})();

/* ======================= PESTAÑA ======================= */
const showViewBase=window.showView;
window.showView=function(v){showViewBase(v);$('tabRegistro').classList.toggle('active',v==='registro');document.body.classList.toggle('ver-his',v==='registro');if(v==='registro'){llenarDias();renderRegistro();}};

/* ======================= ENLACE CON LA SINCRONIZACIÓN (firebase-sync.js) ======================= */
window.HIS={
  atenciones:()=>atenciones,config:()=>config,
  recibirAtenciones(obj){atenciones=obj;try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){}if(activa()){llenarDias();renderRegistro();}},
  recibirConfig(c){config=Object.assign({},config,c);try{localStorage.setItem(LS_CFG,JSON.stringify(config));}catch(e){}pintarConfig();pintarCodigos();if(activa())renderRegistro();},
  alCambiarPacientes(){if(activa())renderRegistro();},
  LS_AT,LS_CFG
};
cargar();pintarConfig();pintarCodigos();
})();
