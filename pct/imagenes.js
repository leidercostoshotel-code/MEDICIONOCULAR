/* PCT · Pestaña DIAGNÓSTICO POR IMAGEN: estudios de imágenes de cada paciente (radiografía y tomografía de tórax, ecografía,
   informes…) en PDF o foto. Los pacientes son los mismos de DATOS: un paciente nuevo o un nombre cambiado aparece aquí solo,
   porque cada estudio queda unido al paciente por su id (no por el nombre).
   Nube (Firestore del plan gratuito, sin Firebase Storage):
   · pct_imagenes: datos de cada estudio (paciente, tipo, fecha, nota, archivo); se sincroniza por cambios, como los pacientes.
   · pct_archivos: el archivo en partes de 900 KB ({id}_0, {id}_1…) y su miniatura ({id}_t). Se bajan solo al abrir el paciente
     o el archivo y quedan guardados en el equipo (IndexedDB): la segunda vez no se vuelven a leer de la nube.
   · Las fotos se achican antes de subir (lado mayor 2200 px, JPG); PDF hasta 15 MB. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const LS="pct_imagenes",PARTE=900000,MAX_PDF=15*1024*1024,MAX_FOTO=40*1024*1024;
const TIPOS=["Radiografía de tórax","Tomografía de tórax","Ecografía","Informe de imagen","Otro"];
const HUERFANOS="__sin_paciente";
let imagenes={};try{const x=JSON.parse(localStorage.getItem(LS));if(x&&typeof x==="object")imagenes=x;}catch(e){}
let sel=null,editar=null,form={tipo:TIPOS[0],fecha:"",nota:""},urls=[],verUrl=null,subiendo=false;
try{sel=localStorage.getItem('pct_img_sel')||null;}catch(e){}
const p2=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
const deIso=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?m[3]+"/"+m[2]+"/"+m[1]:"";};
const aIso=f=>{const d=parseFecha(f);return d?iso(d):"";};
const mb=n=>n>=1048576?(n/1048576).toFixed(1).replace(".0","")+" MB":Math.max(1,Math.round(n/1024))+" KB";
const nube=()=>window.Sync&&Sync.nube?Sync.nube():null;
const esPdf=r=>r.mime==="application/pdf";
const slug=t=>normTxt(t).replace(/[^a-z]+/g,"-").replace(/^-|-$/g,"");
const ICO_PDF=`<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#e53935" d="M30 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14z"/><path fill="#ffcdd2" d="M30 4v10h10z"/><text x="24" y="33" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="Arial">PDF</text></svg>`;
const ICO_IMG=`<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="9" width="36" height="30" rx="4" fill="#90a4ae"/><circle cx="17" cy="19" r="4" fill="#eceff1"/><path fill="#eceff1" d="m10 35 10-11 7 7 5-5 7 9z"/></svg>`;

/* ======================= ARCHIVOS EN EL EQUIPO (IndexedDB; si no hay, en memoria) ======================= */
const IDB=(()=>{const mem=new Map();let p=null;
  const abrir=()=>p||(p=new Promise((ok,mal)=>{try{const r=indexedDB.open("pct_archivos",1);r.onupgradeneeded=()=>r.result.createObjectStore("a");r.onsuccess=()=>ok(r.result);r.onerror=()=>mal(r.error);}catch(e){mal(e);}}));
  const tx=(modo,f)=>abrir().then(db=>new Promise((ok,mal)=>{const t=db.transaction("a",modo),q=f(t.objectStore("a"));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>mal(t.error);}));
  return {get:k=>tx("readonly",s=>s.get(k)).catch(()=>mem.get(k)),
    put:(k,v)=>tx("readwrite",s=>s.put(v,k)).catch(()=>{mem.set(k,v);}),
    del:k=>tx("readwrite",s=>s.delete(k)).catch(()=>{mem.delete(k);})};})();

/* ======================= VISTA ======================= */
$('tabAne').insertAdjacentHTML('afterend',`<button id="tabImg" onclick="showView('imagenes')" title="Radiografías, tomografías, ecografías e informes de cada paciente (PDF o foto)">DIAGNÓSTICO POR IMAGEN</button>`);
$('anemia').insertAdjacentHTML('afterend',`
<div id="imagenes" class="view">
  <div class="toolbar">
    <input type="text" id="imgBuscar" placeholder="Buscar paciente (N°, DNI, HC, nombre…)" autocomplete="off">
    <label class="lbl">Tipo <select id="imgTipo"><option value="">Todos los estudios</option>${TIPOS.map(t=>`<option>${t}</option>`).join("")}</select></label>
    <label class="lbl img-con"><input type="checkbox" id="imgCon"> Solo pacientes con estudios</label>
    <span class="status" id="imgInfo"></span>
  </div>
  <div class="img-cuerpo">
    <aside class="img-lista" id="imgLista" aria-label="Pacientes"></aside>
    <section class="img-panel" id="imgPanel"></section>
  </div>
</div>
<div class="dlg-fondo img-modal no-print" id="imgModal"><div class="img-ver" role="dialog" aria-modal="true" aria-label="Ver estudio"><div id="imgVer"></div></div></div>`);

/* ======================= DATOS ======================= */
function guardar(){try{localStorage.setItem(LS,JSON.stringify(imagenes));}catch(e){msg("No se pudo guardar en el navegador");}if(window.Sync&&Sync.programar)Sync.programar(LS);}
function estudiosDe(pacId){const t=$('imgTipo').value,ids=new Set(pacientes.map(r=>r.id));
  return Object.values(imagenes).filter(x=>(pacId===HUERFANOS?!ids.has(x.pacId):x.pacId===pacId)&&(!t||x.tipo===t))
    .sort((a,b)=>(aIso(b.fecha)||"").localeCompare(aIso(a.fecha)||"")||String(b.creado).localeCompare(String(a.creado)));}
function cuenta(){const m={};for(const id in imagenes){const k=imagenes[id].pacId;m[k]=(m[k]||0)+1;}return m;}
// sincronización (firebase-sync.js la toma al iniciar): solo lo que cambió, como los pacientes
(window.SYNC_EXTRA=window.SYNC_EXTRA||[]).push({col:LS,
  local:()=>imagenes,
  norm:(id,x)=>Object.assign({},x,{id}),
  aplicar:c=>{for(const id in c){if(c[id])imagenes[id]=c[id];else{delete imagenes[id];IDB.del(id);IDB.del(id+"_t");}}
    try{localStorage.setItem(LS,JSON.stringify(imagenes));}catch(e){}render();}});

/* ======================= FOTOS: se achican antes de subir ======================= */
async function leerImagen(f){
  try{return await createImageBitmap(f,{imageOrientation:"from-image"});}catch(e){}
  return await new Promise((ok,mal)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);ok(im);};im.onerror=()=>{URL.revokeObjectURL(u);mal(new Error("formato de imagen no compatible (use JPG o PNG)"));};im.src=u;});}
async function comprimir(f){const im=await leerImagen(f),w=im.width,h=im.height;
  const dib=(max,q)=>{const s=Math.min(1,max/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);return new Promise(ok=>c.toBlob(ok,"image/jpeg",q));};
  const chica=f.type==="image/jpeg"&&f.size<=1.5*1048576&&Math.max(w,h)<=2600; // JPG ya liviano: se guarda tal cual
  return {blob:chica?f:await dib(2200,.86),thumb:await dib(360,.72)};}

/* ======================= NUBE: archivo en partes y miniatura ======================= */
async function subirNube(rec,blob,thumb,avance){const n=nube();if(!n)return "local";
  const u8=new Uint8Array(await blob.arrayBuffer()),col=n.db.collection("pct_archivos"),envios=[];let b=n.db.batch(),k0=0;
  const cerrar=()=>{envios.push(b.commit());b=n.db.batch();k0=0;};
  if(thumb){b.set(col.doc(rec.id+"_t"),{id:rec.id,d:n.Blob.fromUint8Array(new Uint8Array(await thumb.arrayBuffer()))});k0++;}
  for(let k=0;k<rec.partes;k++){b.set(col.doc(rec.id+"_"+k),{id:rec.id,k,n:rec.partes,d:n.Blob.fromUint8Array(u8.slice(k*PARTE,(k+1)*PARTE))});if(++k0>=8)cerrar();}
  if(k0)cerrar();if(!navigator.onLine){avance(1);return "cola";}let hechos=0;envios.forEach(p=>p.then(()=>{hechos++;avance(hechos/envios.length);}).catch(()=>{}));
  // sin conexión la escritura queda en cola en el equipo y se sube sola al reconectar
  return await Promise.race([Promise.all(envios).then(()=>"nube"),new Promise(ok=>setTimeout(()=>ok("cola"),25000))]);}
async function bajarNube(rec){const n=nube();if(!n)throw new Error("sin-nube");const col=n.db.collection("pct_archivos");
  const ds=await Promise.all(Array.from({length:rec.partes},(_,k)=>col.doc(rec.id+"_"+k).get()));
  if(ds.some(d=>!d.exists))throw new Error("incompleto");
  return new Blob(ds.map(d=>d.data().d.toUint8Array()),{type:rec.mime});}
async function archivo(rec){let b=await IDB.get(rec.id);if(b)return b;b=await bajarNube(rec);IDB.put(rec.id,b);return b;}
async function miniatura(rec){let b=await IDB.get(rec.id+"_t");if(b)return b;const n=nube();if(!n||!rec.mini)return null;
  try{const d=await n.db.collection("pct_archivos").doc(rec.id+"_t").get();if(!d.exists)return null;b=new Blob([d.data().d.toUint8Array()],{type:"image/jpeg"});IDB.put(rec.id+"_t",b);return b;}catch(e){return null;}}

/* ======================= SUBIR ======================= */
async function subirUno(f,pac,meta,avance){
  const pdf=f.type==="application/pdf"||/\.pdf$/i.test(f.name),img=/^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name);
  if(!pdf&&!img)throw new Error("solo se aceptan PDF o fotos");
  let blob,thumb=null,mime;
  if(pdf){if(f.size>MAX_PDF)throw new Error(`pesa ${mb(f.size)}; el máximo es 15 MB`);blob=f;mime="application/pdf";}
  else{if(f.size>MAX_FOTO)throw new Error(`pesa ${mb(f.size)}`);const c=await comprimir(f);blob=c.blob;thumb=c.thumb;mime="image/jpeg";}
  const id=uid(),rec={id,pacId:pac.id,tipo:meta.tipo,fecha:meta.fecha,nota:meta.nota,nombre:f.name.slice(0,120),mime,tam:blob.size,partes:Math.max(1,Math.ceil(blob.size/PARTE)),
    mini:thumb?1:0,creado:new Date().toISOString(),por:(window.Sync&&Sync.usuario&&Sync.usuario())||""};
  await IDB.put(id,blob);if(thumb)await IDB.put(id+"_t",thumb);
  const r=await subirNube(rec,blob,thumb,avance); // primero el archivo y luego sus datos: los otros equipos no ven un estudio sin archivo
  imagenes[id]=rec;guardar();return r;}
function progreso(t,f){const p=$('imgProg');if(!p)return;if(t==null){p.hidden=true;return;}p.hidden=false;p.querySelector('span').textContent=t;p.querySelector('i').style.width=Math.round((f||0)*100)+"%";}
async function subir(files){const pac=pacientes.find(x=>x.id===sel);files=[...(files||[])];if(!pac||!files.length||subiendo)return;
  subiendo=true;const meta={tipo:form.tipo,fecha:deIso(form.fecha)||fmtFecha(new Date()),nota:form.nota.trim()},err=[];let ok=0,cola=0,local=0;
  for(let i=0;i<files.length;i++){const f=files[i];progreso(`Preparando ${i+1} de ${files.length}: ${f.name}`,i/files.length);
    try{const r=await subirUno(f,pac,meta,p=>progreso(`Subiendo ${i+1} de ${files.length}: ${f.name}`,(i+p)/files.length));ok++;if(r==="cola")cola++;if(r==="local")local++;}
    catch(e){console.error(e);err.push(f.name+": "+(e&&e.message||e));}}
  subiendo=false;progreso(null);form.nota="";render(true);
  if(ok)msg(`${ok} estudio${ok>1?"s":""} guardado${ok>1?"s":""}`+(local?" en este equipo (sin nube)":cola?" · se termina de subir al reconectar":" y sincronizado"+(ok>1?"s":"")));
  if(err.length)avisar("No se pudieron subir algunos archivos",err.join("\n"),"peligro");}

/* ======================= DIBUJO ======================= */
function pintarLista(){const q=normTxt($('imgBuscar').value).trim(),solo=$('imgCon').checked,t=$('imgTipo').value,c=cuenta(),ids=new Set(pacientes.map(r=>r.id));
  const cT=t?(()=>{const m={};Object.values(imagenes).forEach(x=>{if(x.tipo===t)m[x.pacId]=(m[x.pacId]||0)+1;});return m;})():c;
  const l=ordenarPacientes(pacientes).filter(r=>(!(solo||t)||cT[r.id])&&(!q||normTxt([r.n,r.dni,r.hc,r.nom].join(" ")).includes(q)));
  const huer=Object.values(imagenes).filter(x=>!ids.has(x.pacId)).length,total=Object.keys(imagenes).length;
  $('imgLista').innerHTML=(huer?`<button type="button" class="img-pac huer${sel===HUERFANOS?" sel":""}" data-pac="${HUERFANOS}"><span class="img-pn">⚠</span><span class="img-pt"><b>Estudios sin paciente en DATOS</b><small>El paciente se eliminó del padrón</small></span><span class="img-cnt">${huer}</span></button>`:"")+
    (l.length?l.map(r=>`<button type="button" class="img-pac${sel===r.id?" sel":""}${cT[r.id]?" con":""}" data-pac="${esc(r.id)}"><span class="img-pn">${esc(r.n)}</span><span class="img-pt"><b>${esc(r.nom||"(sin nombre)")}</b><small>DNI ${esc(r.dni||"—")}${r.hc?" · HC "+esc(r.hc):""}</small></span>${cT[r.id]?`<span class="img-cnt">${cT[r.id]}</span>`:""}</button>`).join(""):`<div class="img-vacio">No hay pacientes para esta búsqueda.</div>`);
  $('imgInfo').textContent=`${total} estudio${total===1?"":"s"} · ${Object.keys(c).filter(k=>ids.has(k)).length} paciente(s) con estudios · ${l.length} en la lista`;}
const meta=r=>[r.n&&"N° "+esc(r.n),r.dni&&"DNI "+esc(r.dni),r.hc&&"HC "+esc(r.hc),/\d/.test(edadDe(r))&&esc(edadDe(r))+" años",r.sexo&&esc(r.sexo),r.dx&&esc(r.dx),r.tto&&"Tto. "+esc(r.tto)].filter(Boolean).join(" · ");
function tarjeta(x,conPac){const r=conPac&&pacientes.find(p=>p.id===x.pacId);
  if(editar===x.id)return `<article class="img-card editando" data-id="${esc(x.id)}"><div class="img-edit">
    <label>Tipo<select data-e="tipo">${TIPOS.concat(TIPOS.includes(x.tipo)?[]:[x.tipo]).map(t=>`<option ${t===x.tipo?"selected":""}>${esc(t)}</option>`).join("")}</select></label>
    <label>Fecha<input type="date" data-e="fecha" value="${aIso(x.fecha)}"></label>
    <label class="ancho">Resultado / nota<input type="text" data-e="nota" value="${esc(x.nota)}" maxlength="300"></label>
    <div class="img-acc"><button type="button" class="btn primary" data-acc="guardar">✔ Guardar</button><button type="button" class="btn" data-acc="cancelar">Cancelar</button></div></div></article>`;
  return `<article class="img-card" data-id="${esc(x.id)}">
    <button type="button" class="img-mini${esPdf(x)?" pdf":""}" data-acc="ver" title="Ver ${esc(x.nombre)}">${esPdf(x)?ICO_PDF:`<img alt="" data-mini="${esc(x.id)}">${ICO_IMG}`}</button>
    <div class="img-dat">
      <div class="img-l1"><span class="img-tipo t-${slug(x.tipo)}">${esc(x.tipo)}</span><b>${esc(x.fecha||"Sin fecha")}</b></div>
      ${r?`<button type="button" class="img-dpac" data-abrir="${esc(r.id)}" title="Abrir los estudios de este paciente">${esc(r.nom)} · N° ${esc(r.n)} ›</button>`:""}
      ${x.nota?`<p>${esc(x.nota)}</p>`:""}
      <small>${esPdf(x)?"PDF":"Foto"} · ${mb(x.tam)} · ${esc(x.nombre)}${x.por?" · subido por "+esc(x.por):""}</small>
      <div class="img-acc"><button type="button" class="btn" data-acc="ver">👁 Ver</button><button type="button" class="btn" data-acc="bajar">⬇ Descargar</button>${conPac?"":`<button type="button" class="btn" data-acc="editar" title="Cambiar tipo, fecha o nota">✏️ Editar</button><button type="button" class="btn danger" data-acc="borrar" title="Eliminar el estudio">🗑</button>`}</div>
    </div></article>`;}
function pintarPanel(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[];const r=pacientes.find(x=>x.id===sel),P=$('imgPanel');
  if(sel===HUERFANOS){const l=estudiosDe(HUERFANOS);
    P.innerHTML=`<div class="img-cab"><div><h2>Estudios sin paciente en DATOS</h2><p>Su paciente se eliminó del padrón. Puede verlos, descargarlos o eliminarlos.</p></div></div><div class="img-grid">${l.map(x=>tarjeta(x,false)).join("")||`<div class="img-vacio">No hay estudios.</div>`}</div>`;}
  else if(!r){const l=Object.values(imagenes).sort((a,b)=>String(b.creado).localeCompare(String(a.creado))).slice(0,12);
    P.innerHTML=`<div class="img-cab"><div><h2>Diagnóstico por imagen</h2><p>Elija un paciente de la lista para ver sus estudios o subir un PDF o una foto. Los pacientes son los de DATOS: los nuevos aparecen aquí solos.</p></div></div>
      ${l.length?`<h3 class="img-sub">Últimos estudios subidos</h3><div class="img-grid">${l.map(x=>tarjeta(x,true)).join("")}</div>`:`<div class="img-vacio grande">📂 Todavía no hay estudios.<br><small>Elija un paciente y suba su radiografía, tomografía, ecografía o informe.</small></div>`}`;}
  else{const l=estudiosDe(r.id),t=$('imgTipo').value;if(!form.fecha)form.fecha=iso(new Date());
    P.innerHTML=`<div class="img-cab"><div><h2>${esc(r.nom||"(sin nombre)")}</h2><p>${meta(r)}</p></div><span class="img-ncab">${l.length} estudio${l.length===1?"":"s"}${t?" · "+esc(t):""}</span></div>
      <div class="img-subir no-print">
        <div class="img-campos">
          <label>Tipo de estudio<select id="imgNTipo">${TIPOS.map(x=>`<option ${x===form.tipo?"selected":""}>${x}</option>`).join("")}</select></label>
          <label>Fecha del estudio<input type="date" id="imgNFecha" value="${esc(form.fecha)}"></label>
          <label class="ancho">Resultado / nota (opcional)<input type="text" id="imgNNota" value="${esc(form.nota)}" maxlength="300" placeholder="Ej.: infiltrado apical derecho, cavitación…"></label>
        </div>
        <div class="img-zona" id="imgZona">
          <div class="img-zona-ico">⬆</div><b>Arrastre aquí el PDF o las fotos</b>
          <div class="img-zona-btns"><label class="btn primary">📎 Elegir PDF o fotos<input type="file" id="imgArch" accept="application/pdf,image/*" multiple hidden></label><label class="btn img-cam">📷 Tomar foto<input type="file" id="imgCam" accept="image/*" capture="environment" hidden></label></div>
          <small>PDF hasta 15 MB · las fotos se achican solas para ocupar poco espacio</small>
        </div>
        <div class="img-prog" id="imgProg" hidden><div class="img-pbar"><i></i></div><span></span></div>
      </div>
      <div class="img-grid">${l.map(x=>tarjeta(x,false)).join("")||`<div class="img-vacio">${t?"No hay estudios de este tipo.":"Este paciente aún no tiene estudios. Súbalos arriba."}</div>`}</div>`;}
  P.querySelectorAll('img[data-mini]').forEach(async im=>{const x=imagenes[im.dataset.mini];if(!x)return;const b=await miniatura(x);if(!b||!im.isConnected)return;const u=URL.createObjectURL(b);urls.push(u);im.src=u;im.parentNode.classList.add('lista');});}
function render(forzar){if(!$('imagenes').classList.contains('active'))return;pintarLista();
  const a=document.activeElement;if(!forzar&&a&&a.closest&&a.closest('#imgPanel')&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName))return; // no borrar lo que se escribe
  pintarPanel();}

/* ======================= VER Y DESCARGAR ======================= */
function cerrarVer(){$('imgModal').classList.remove('abierto');$('imgVer').innerHTML="";if(verUrl){URL.revokeObjectURL(verUrl);verUrl=null;}}
async function ver(x){const r=pacientes.find(p=>p.id===x.pacId),cab=`<div class="img-vcab"><div><b>${esc(x.tipo)} · ${esc(x.fecha||"")}</b><small>${r?esc(r.nom)+" · N° "+esc(r.n)+" · ":""}${esc(x.nombre)}${x.nota?" · "+esc(x.nota):""}</small></div><div class="img-vbtn" id="imgVBtn"></div><button type="button" class="btn" data-v="cerrar">✕ Cerrar</button></div>`;
  $('imgVer').innerHTML=cab+`<div class="img-vcuerpo"><div class="img-cargando">Abriendo…</div></div>`;$('imgModal').classList.add('abierto');
  try{const b=await archivo(x);if(!$('imgModal').classList.contains('abierto'))return;if(verUrl)URL.revokeObjectURL(verUrl);verUrl=URL.createObjectURL(b);
    $('imgVBtn').innerHTML=`<a class="btn" href="${verUrl}" target="_blank" rel="noopener">↗ Abrir en otra pestaña</a><a class="btn" href="${verUrl}" download="${esc(x.nombre)}">⬇ Descargar</a>`;
    $('imgVer').querySelector('.img-vcuerpo').innerHTML=esPdf(x)?`<iframe src="${verUrl}" title="${esc(x.nombre)}"></iframe>`:`<img src="${verUrl}" alt="${esc(x.tipo)}" class="img-foto" title="Clic para ver en tamaño real">`;}
  catch(e){$('imgVer').querySelector('.img-vcuerpo').innerHTML=`<div class="img-cargando err">${e.message==="incompleto"?"El archivo aún no termina de subir a la nube desde el equipo donde se cargó. Intente en unos minutos.":e.message==="sin-nube"?"Este archivo se cargó en otro equipo y aquí no hay conexión con la nube.":"No se pudo abrir el archivo (¿sin conexión?)."}</div>`;}}
async function bajar(x){try{const b=await archivo(x),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=x.nombre||"estudio";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
  catch(e){msg(e.message==="incompleto"?"El archivo aún no termina de subir a la nube":"No se pudo descargar (¿sin conexión?)");}}
async function borrar(x){if(!await confirmar("Eliminar estudio",`Se eliminará «${x.tipo}» del ${x.fecha||"(sin fecha)"} (${x.nombre}) en este equipo y en la nube.`,{ok:"Eliminar",peligro:true}))return;
  delete imagenes[x.id];guardar();IDB.del(x.id);IDB.del(x.id+"_t");
  const n=nube();if(n){const b=n.db.batch(),col=n.db.collection("pct_archivos");for(let k=0;k<x.partes;k++)b.delete(col.doc(x.id+"_"+k));b.delete(col.doc(x.id+"_t"));b.commit().catch(e=>console.error(e));}
  render(true);msg("Estudio eliminado");}

/* ======================= EVENTOS ======================= */
$('imgLista').addEventListener('click',e=>{const b=e.target.closest('[data-pac]');if(!b)return;sel=b.dataset.pac;editar=null;try{localStorage.setItem('pct_img_sel',sel);}catch(x){}render(true);
  if(window.innerWidth<900)$('imgPanel').scrollIntoView({behavior:"smooth",block:"start"});});
['imgBuscar','imgTipo','imgCon'].forEach(id=>$(id).addEventListener(id==='imgBuscar'?'input':'change',()=>{if(id==='imgBuscar')pintarLista();else render(true);}));
$('imgPanel').addEventListener('input',e=>{const t=e.target;if(t.id==='imgNNota')form.nota=t.value;});
$('imgPanel').addEventListener('change',e=>{const t=e.target;if(t.id==='imgNTipo')form.tipo=t.value;else if(t.id==='imgNFecha'){if(fechaIsoValida(t.value))form.fecha=t.value;}
  else if(t.id==='imgArch'||t.id==='imgCam'){subir(t.files);t.value="";}});
$('imgPanel').addEventListener('click',e=>{const ab=e.target.closest('[data-abrir]');if(ab){sel=ab.dataset.abrir;try{localStorage.setItem('pct_img_sel',sel);}catch(x){}render(true);return;}
  const b=e.target.closest('[data-acc]');if(!b)return;const card=b.closest('[data-id]'),x=card&&imagenes[card.dataset.id];if(!x)return;const a=b.dataset.acc;
  if(a==="ver")ver(x);else if(a==="bajar")bajar(x);else if(a==="borrar")borrar(x);else if(a==="editar"){editar=x.id;render(true);}else if(a==="cancelar"){editar=null;render(true);}
  else if(a==="guardar"){const v=k=>card.querySelector(`[data-e="${k}"]`).value,f=v("fecha");if(!fechaIsoValida(f)){msg("Fecha no válida");return;}
    imagenes[x.id]=Object.assign({},x,{tipo:v("tipo"),fecha:deIso(f),nota:v("nota").trim()});editar=null;guardar();render(true);msg("Estudio actualizado");}});
// arrastrar y soltar
['dragenter','dragover'].forEach(t=>$('imgPanel').addEventListener(t,e=>{const z=e.target.closest&&e.target.closest('#imgZona');if(!z)return;e.preventDefault();z.classList.add('sobre');}));
['dragleave','drop'].forEach(t=>$('imgPanel').addEventListener(t,e=>{const z=e.target.closest&&e.target.closest('#imgZona');if(!z)return;e.preventDefault();z.classList.remove('sobre');if(t==='drop')subir(e.dataTransfer.files);}));
$('imgModal').addEventListener('click',e=>{if(e.target===$('imgModal')||e.target.closest('[data-v="cerrar"]'))cerrarVer();else if(e.target.classList.contains('img-foto'))e.target.classList.toggle('real');});
document.addEventListener('keydown',e=>{if(e.key==="Escape"&&$('imgModal').classList.contains('abierto'))cerrarVer();});

/* ======================= ENLACES CON EL RESTO DE LA APP ======================= */
const showBase=window.showView;
window.showView=function(v){showBase(v);$('tabImg').classList.toggle('active',v==='imagenes');document.body.classList.toggle('ver-img',v==='imagenes');if(v==='imagenes')render(true);};
const alCambiarBase=window.alCambiarPacientes;
window.alCambiarPacientes=function(){if(alCambiarBase)alCambiarBase();render();}; // nombre nuevo o cambiado en DATOS: aparece aquí solo
window.IMG={render,estudiosDe};
})();
