/* PCT · Pestaña DIAGNÓSTICO POR IMAGEN: estudios de imágenes de cada paciente (radiografía y tomografía de tórax, ecografía,
   informes…) en PDF o foto. Los pacientes son los mismos de DATOS: un paciente nuevo o un nombre cambiado aparece aquí solo,
   porque cada estudio queda unido al paciente por su id (no por el nombre).
   Nube (Firestore del plan gratuito, sin Firebase Storage):
   · pct_imagenes: datos de cada estudio (paciente, tipo, fecha, nota, archivo); se sincroniza por cambios, como los pacientes.
   · pct_archivos: el archivo en partes de 900 KB ({id}_0, {id}_1…) y su miniatura ({id}_t). Se bajan solo al abrir el paciente
     o el archivo y quedan guardados en el equipo (IndexedDB): la segunda vez no se vuelven a leer de la nube.
   · Las fotos se achican antes de subir (lado mayor 2200 px, JPG); PDF hasta 30 MB.
   · «Traer de Drive»: con solo el enlace de la carpeta (compartida con «Cualquier persona con el enlace»), la app la lee con la API de
     Drive (solo lectura, con la clave de API del proyecto) y guarda cada PDF o foto como un estudio más: se ve aquí sin entrar a Drive.
     🔄 Automático: lo NUEVO que se sube a esa carpeta se guarda solo (en los equipos con la app abierta, al abrirla y cada 30 minutos).
     También acepta el ZIP que baja Google Drive (o la carpeta descomprimida, o varios archivos). Reconoce al paciente por
     el nombre de su carpeta o del archivo (o el DNI), la fecha por el nombre del archivo (16-10-26, 24-10-2026, 16 JULIO 2026) y el
     tipo por las palabras del nombre; se revisa en una lista y se sube todo junto. Lo ya importado no se repite.
   · Sin descargar nada: «🔗 Enlazar con Drive» guarda el enlace de cada PDF o foto (o de la carpeta) del paciente. Queda como una tarjeta
     igual a las demás y se ve aquí mismo con el visor de Drive incrustado (el archivo sigue en Drive y no se copia a la nube de la app).
     Sin enlace guardado, «🔍 Buscar en Google Drive» abre Drive con la búsqueda del paciente. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const LS="pct_imagenes",PARTE=900000,MAX_PDF=30*1024*1024,MAX_FOTO=40*1024*1024;
const TIPOS=["Radiografía de tórax","Tomografía de tórax","Ecografía","Informe de imagen","Otro"],CARPETA="Carpeta de Drive",TIPOS_ENL=[CARPETA].concat(TIPOS);
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
const esEnlace=r=>!!r.url; // estudio que vive en Google Drive: solo se guarda su enlace
const URL_DRIVE=/https?:\/\/(?:drive|docs)\.google\.com\/[^\s"'<>]+/i;
const hrefDrive=u=>/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(u||"")?u:"#"; // solo enlaces de Google Drive (aunque lleguen de otro equipo)
// el estudio de Drive se ve dentro de la app (visor de Drive incrustado), sin ir a Drive. Las direcciones se arman solo con el id del archivo
const idDrive=u=>{u=String(u||"");const m=/\/(?:file\/d|folders|document\/d|presentation\/d|spreadsheets\/d)\/([\w-]{10,})/.exec(u)||/[?&]id=([\w-]{10,})/.exec(u);return m?m[1]:"";};
const esCarpeta=x=>/\/folders\/|embeddedfolderview/.test(x.url||"");
const claseDe=n=>/\.pdf$/i.test(n||"")?"pdf":/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(n||"")?"img":"";
const vistaDrive=x=>{const id=idDrive(x.url);return !id?"":esCarpeta(x)?"https://drive.google.com/embeddedfolderview?id="+id+"#grid":"https://drive.google.com/file/d/"+id+"/preview";};
const miniDrive=x=>{const id=idDrive(x.url);return id&&!esCarpeta(x)?"https://drive.google.com/thumbnail?id="+id+"&sz=w400":"";};
const mismoDrive=(a,b)=>{const x=idDrive(a),y=idDrive(b);return x?x===y:a===b;};
const urlLimpia=u=>{const id=idDrive(u);return !id?u:/\/folders\//.test(u)?"https://drive.google.com/drive/folders/"+id:/docs\.google\.com/.test(u)?u:"https://drive.google.com/file/d/"+id+"/view";};
const buscarDrive=r=>"https://drive.google.com/drive/search?q="+encodeURIComponent(String(r.nom||"").trim().split(/\s+/).slice(0,2).join(" ")); // los dos apellidos
const slug=t=>normTxt(t).replace(/[^a-z]+/g,"-").replace(/^-|-$/g,"");
const ICO_PDF=`<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#e53935" d="M30 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14z"/><path fill="#ffcdd2" d="M30 4v10h10z"/><text x="24" y="33" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="Arial">PDF</text></svg>`;
const ICO_DRIVE=`<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#1e88e5" d="M15.5 42h17l7-12H8.5z"/><path fill="#43a047" d="M17 6 8.5 30h0l7 12L24 18z"/><path fill="#fbc02d" d="M31 6H17l7 12 7.5 12h8.5z"/><path fill="#1565c0" d="M8.5 30h31l-7 12h-17z" opacity=".25"/></svg>`;
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
    <label class="lbl">Tipo <select id="imgTipo"><option value="">Todos los estudios</option>${TIPOS_ENL.map(t=>`<option>${t}</option>`).join("")}</select></label>
    <label class="lbl img-con"><input type="checkbox" id="imgCon"> Solo pacientes con estudios</label>
    <span class="status" id="imgInfo"></span>
    <span class="sep"></span>
    <a class="btn no-print" id="imgRaiz" target="_blank" rel="noopener" title="Abrir en Google Drive la carpeta principal de los estudios" hidden>📂 Carpeta en Drive</a>
    <button type="button" class="btn no-print" id="imgEnlazar" title="Guardar los enlaces de Google Drive de las carpetas de los pacientes (sin descargar nada)">🔗 Enlazar con Drive</button>
    <button type="button" class="btn primary no-print" id="imgImportar" title="Guardar en la app, de una vez, los PDF y fotos de una carpeta de Google Drive (con su enlace, sin descargar nada)">📥 Traer de Drive</button>
  </div>
  <div class="img-cuerpo">
    <aside class="img-lista" id="imgLista" aria-label="Pacientes"></aside>
    <section class="img-panel" id="imgPanel"></section>
  </div>
</div>
<div class="dlg-fondo img-modal no-print" id="imgModal"><div class="img-ver" role="dialog" aria-modal="true" aria-label="Ver estudio"><div id="imgVer"></div></div></div>
<div class="dlg-fondo img-impmodal no-print" id="imgImpModal"><div class="img-imp" role="dialog" aria-modal="true" aria-label="Importar estudios"><div id="imgImp"></div></div>
  <input type="file" id="imgImpZip" accept=".zip,application/zip,application/x-zip-compressed" multiple hidden>
  <input type="file" id="imgImpCarpeta" webkitdirectory directory multiple hidden>
  <input type="file" id="imgImpArch" accept="application/pdf,image/*" multiple hidden>
  <input type="file" id="imgEnlArch" accept=".txt,.csv,text/plain,text/csv" hidden></div>`);

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
  if(pdf){if(f.size>MAX_PDF)throw new Error(`pesa ${mb(f.size)}; el máximo es 30 MB`);blob=f;mime="application/pdf";}
  else{if(f.size>MAX_FOTO)throw new Error(`pesa ${mb(f.size)}`);const c=await comprimir(f);blob=c.blob;thumb=c.thumb;mime="image/jpeg";}
  const id=meta.gid?"d_"+meta.gid:uid(),rec={id,pacId:pac.id,tipo:meta.tipo,fecha:meta.fecha,nota:meta.nota,nombre:f.name.slice(0,120),mime,tam:blob.size,partes:Math.max(1,Math.ceil(blob.size/PARTE)),
    mini:thumb?1:0,creado:new Date().toISOString(),por:(window.Sync&&Sync.usuario&&Sync.usuario())||"",otam:f.size};
  if(meta.origen)rec.origen=meta.origen.slice(0,300); // carpeta de donde se importó
  if(meta.gid)rec.gid=meta.gid; // id del archivo en Google Drive (para no traerlo dos veces)
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
  const conE=Object.keys(c).filter(k=>ids.has(k)).length;$('imgInfo').textContent=`${total} estudio${total===1?"":"s"} · ${conE} paciente${conE===1?"":"s"} con estudios`+(l.length<pacientes.length?` · ${l.length} en la lista`:"");}
const meta=r=>[r.n&&"N° "+esc(r.n),r.dni&&"DNI "+esc(r.dni),r.hc&&"HC "+esc(r.hc),/\d/.test(edadDe(r))&&esc(edadDe(r))+" años",r.sexo&&esc(r.sexo),r.dx&&esc(r.dx),r.tto&&"Tto. "+esc(r.tto)].filter(Boolean).join(" · ");
function tarjeta(x,conPac){const r=conPac&&pacientes.find(p=>p.id===x.pacId);
  if(editar===x.id)return `<article class="img-card editando" data-id="${esc(x.id)}"><div class="img-edit">
    <label>Tipo<select data-e="tipo">${(esEnlace(x)?TIPOS_ENL:TIPOS).concat(TIPOS_ENL.includes(x.tipo)?[]:[x.tipo]).map(t=>`<option ${t===x.tipo?"selected":""}>${esc(t)}</option>`).join("")}</select></label>
    <label>Fecha<input type="date" data-e="fecha" value="${aIso(x.fecha)}"></label>
    <label class="ancho">Resultado / nota<input type="text" data-e="nota" value="${esc(x.nota)}" maxlength="300"></label>
    <div class="img-acc"><button type="button" class="btn primary" data-acc="guardar">✔ Guardar</button><button type="button" class="btn" data-acc="cancelar">Cancelar</button></div></div></article>`;
  if(esEnlace(x)){const dir=esCarpeta(x),cl=x.dm||claseDe(x.nombre),mi=miniDrive(x);
    return `<article class="img-card enlace${dir?" carpeta":""}" data-id="${esc(x.id)}">
    <button type="button" class="img-mini drive${cl==="pdf"?" pdf":""}" data-acc="ver" title="Ver ${esc(x.nombre||x.tipo)}">${mi?`<img alt="" loading="lazy" referrerpolicy="no-referrer" data-dmini="${esc(mi)}">`:""}${dir?ICO_DRIVE:cl==="pdf"?ICO_PDF:ICO_IMG}<span class="img-gd" title="Está en Google Drive">${ICO_DRIVE}</span></button>
    <div class="img-dat">
      <div class="img-l1"><span class="img-tipo t-${slug(x.tipo)}">${esc(x.tipo)}</span>${x.fecha?`<b>${esc(x.fecha)}</b>`:""}</div>
      ${r?`<button type="button" class="img-dpac" data-abrir="${esc(r.id)}" title="Abrir los estudios de este paciente">${esc(r.nom)} · N° ${esc(r.n)} ›</button>`:""}
      ${x.nota?`<p>${esc(x.nota)}</p>`:""}
      <small>${dir?"Carpeta":cl==="pdf"?"PDF":cl==="img"?"Foto":"Archivo"} en Google Drive · ${esc(x.nombre||"")}${x.por?" · guardado por "+esc(x.por):""}</small>
      ${x.origen&&x.origen.includes("/")?`<small class="img-origen" title="${esc(x.origen)}">📁 ${esc(x.origen.split("/").slice(0,-1).join(" › "))}</small>`:""}
      <div class="img-acc"><button type="button" class="btn" data-acc="ver">👁 ${dir?"Ver carpeta":"Ver"}</button>${conPac?"":`<button type="button" class="btn primary" data-acc="traer" title="${dir?"Traer y guardar en la app los PDF y fotos de esta carpeta":"Guardar este archivo en la app (ya no hará falta Drive para verlo)"}">⬇ ${dir?"Guardar sus estudios":"Guardar en la app"}</button><button type="button" class="btn" data-acc="editar" title="Cambiar tipo, fecha o nota">✏️ Editar</button><button type="button" class="btn danger" data-acc="borrar" title="Quitar el enlace (en Drive no se borra nada)">🗑</button>`}</div>
    </div></article>`;}
  return `<article class="img-card" data-id="${esc(x.id)}">
    <button type="button" class="img-mini${esPdf(x)?" pdf":""}" data-acc="ver" title="Ver ${esc(x.nombre)}">${esPdf(x)?ICO_PDF:`<img alt="" data-mini="${esc(x.id)}">${ICO_IMG}`}</button>
    <div class="img-dat">
      <div class="img-l1"><span class="img-tipo t-${slug(x.tipo)}">${esc(x.tipo)}</span><b>${esc(x.fecha||"Sin fecha")}</b></div>
      ${r?`<button type="button" class="img-dpac" data-abrir="${esc(r.id)}" title="Abrir los estudios de este paciente">${esc(r.nom)} · N° ${esc(r.n)} ›</button>`:""}
      ${x.nota?`<p>${esc(x.nota)}</p>`:""}
      <small>${esPdf(x)?"PDF":"Foto"} · ${mb(x.tam)} · ${esc(x.nombre)}${x.por?" · subido por "+esc(x.por):""}</small>
      ${x.origen?`<small class="img-origen" title="${esc(x.origen)}">📁 ${esc(x.origen.split("/").slice(0,-1).join(" › "))}</small>`:""}
      <div class="img-acc"><button type="button" class="btn" data-acc="ver">👁 Ver</button><button type="button" class="btn" data-acc="bajar">⬇ Descargar</button>${conPac?"":`<button type="button" class="btn" data-acc="editar" title="Cambiar tipo, fecha o nota">✏️ Editar</button><button type="button" class="btn danger" data-acc="borrar" title="Eliminar el estudio">🗑</button>`}</div>
    </div></article>`;}
function pintarPanel(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[];const r=pacientes.find(x=>x.id===sel),P=$('imgPanel');
  if(sel===HUERFANOS){const l=estudiosDe(HUERFANOS);
    P.innerHTML=`<div class="img-cab"><div><h2>Estudios sin paciente en DATOS</h2><p>Su paciente se eliminó del padrón. Puede verlos, descargarlos o eliminarlos.</p></div></div><div class="img-grid">${l.map(x=>tarjeta(x,false)).join("")||`<div class="img-vacio">No hay estudios.</div>`}</div>`;}
  else if(!r){const l=Object.values(imagenes).sort((a,b)=>String(b.creado).localeCompare(String(a.creado))).slice(0,12);
    P.innerHTML=`<div class="img-cab"><div><h2>Diagnóstico por imagen</h2><p>Elija un paciente de la lista para ver sus estudios o subir un PDF o una foto. Los pacientes son los de DATOS: los nuevos aparecen aquí solos.</p></div></div>
      ${l.length?`<h3 class="img-sub">Últimos estudios subidos</h3><div class="img-grid">${l.map(x=>tarjeta(x,true)).join("")}</div>`:`<div class="img-vacio grande">📂 Todavía no hay estudios.<br><small>Elija un paciente y suba su radiografía, tomografía, ecografía o informe.</small></div>`}`;}
  else{const l=estudiosDe(r.id),t=$('imgTipo').value;if(!form.fecha)form.fecha=iso(new Date());
    const carp=Object.values(imagenes).find(x=>x.pacId===r.id&&esEnlace(x)&&esCarpeta(x));
    P.innerHTML=`<div class="img-cab"><div><h2>${esc(r.nom||"(sin nombre)")}</h2><p>${meta(r)}</p></div><div class="img-cabd"><span class="img-ncab">${l.length} estudio${l.length===1?"":"s"}${t?" · "+esc(t):""}</span>
        ${carp?`<button type="button" class="btn img-bdrive" data-vcarp="${esc(carp.id)}" title="Ver aquí su carpeta de Google Drive">📂 Ver su carpeta de Drive</button>`:`<a class="btn img-bdrive" href="${buscarDrive(r)}" target="_blank" rel="noopener" title="Buscar sus estudios en Google Drive por sus apellidos (sin descargar nada)">🔍 Buscar en Google Drive</a>`}</div></div>
      <div class="img-subir no-print">
        <div class="img-campos">
          <label>Tipo de estudio<select id="imgNTipo">${TIPOS.map(x=>`<option ${x===form.tipo?"selected":""}>${x}</option>`).join("")}</select></label>
          <label>Fecha del estudio<input type="date" id="imgNFecha" value="${esc(form.fecha)}"></label>
          <label class="ancho">Resultado / nota (opcional)<input type="text" id="imgNNota" value="${esc(form.nota)}" maxlength="300" placeholder="Ej.: infiltrado apical derecho, cavitación…"></label>
        </div>
        <div class="img-zona" id="imgZona">
          <div class="img-zona-ico">⬆</div><b>Arrastre aquí el PDF o las fotos</b>
          <div class="img-zona-btns"><label class="btn primary">📎 Elegir PDF o fotos<input type="file" id="imgArch" accept="application/pdf,image/*" multiple hidden></label><label class="btn img-cam">📷 Tomar foto<input type="file" id="imgCam" accept="image/*" capture="environment" hidden></label></div>
          <small>PDF hasta 30 MB · las fotos se achican solas para ocupar poco espacio</small>
        </div>
        <div class="img-enl"><span>🔗 o, sin subir nada, pegue el enlace de Google Drive del estudio (o de su carpeta): se verá aquí mismo.</span><input type="url" id="imgNUrl" placeholder="https://drive.google.com/drive/folders/…" autocomplete="off"><button type="button" class="btn" data-acc2="url">Guardar enlace</button></div>
        <div class="img-prog" id="imgProg" hidden><div class="img-pbar"><i></i></div><span></span></div>
      </div>
      <div class="img-grid">${l.map(x=>tarjeta(x,false)).join("")||`<div class="img-vacio">${t?"No hay estudios de este tipo.":"Este paciente aún no tiene estudios. Súbalos arriba."}</div>`}</div>`;}
  P.querySelectorAll('img[data-dmini]').forEach(im=>{im.onload=()=>{if(im.naturalWidth>1)im.parentNode.classList.add('lista');};im.onerror=()=>im.remove();im.src=im.dataset.dmini;});
  P.querySelectorAll('img[data-mini]').forEach(async im=>{const x=imagenes[im.dataset.mini];if(!x)return;const b=await miniatura(x);if(!b||!im.isConnected)return;const u=URL.createObjectURL(b);urls.push(u);im.src=u;im.parentNode.classList.add('lista');});}
function render(forzar){if(!$('imagenes').classList.contains('active'))return;pintarLista();
  const rz=$('imgRaiz');if(config.driveRaiz){rz.hidden=false;rz.href=hrefDrive(config.driveRaiz);}else rz.hidden=true;
  const a=document.activeElement;if(!forzar&&a&&a.closest&&a.closest('#imgPanel')&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName))return; // no borrar lo que se escribe
  pintarPanel();}

/* ======================= VER Y DESCARGAR ======================= */
function cerrarVer(){$('imgModal').classList.remove('abierto');$('imgVer').innerHTML="";if(verUrl){URL.revokeObjectURL(verUrl);verUrl=null;}}
async function ver(x){const r=pacientes.find(p=>p.id===x.pacId),cab=`<div class="img-vcab"><div><b>${esc(x.tipo)} · ${esc(x.fecha||"")}</b><small>${r?esc(r.nom)+" · N° "+esc(r.n)+" · ":""}${esc(x.nombre)}${x.nota?" · "+esc(x.nota):""}</small></div><div class="img-vbtn" id="imgVBtn"></div><button type="button" class="btn" data-v="cerrar">✕ Cerrar</button></div>`;
  if(esEnlace(x)){const src=vistaDrive(x);
    $('imgVer').innerHTML=cab+`<div class="img-vcuerpo">${src?`<iframe src="${esc(src)}" title="${esc(x.nombre||x.tipo)}" allow="autoplay; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>`:`<div class="img-cargando err">El enlace no es de un archivo o carpeta de Google Drive.</div>`}</div>`;
    $('imgVBtn').innerHTML=`<a class="btn" href="${esc(hrefDrive(x.url))}" target="_blank" rel="noopener" title="Abrir en Google Drive (otra pestaña)">↗ Drive</a>`;
    $('imgModal').classList.add('abierto');return;}
  $('imgVer').innerHTML=cab+`<div class="img-vcuerpo"><div class="img-cargando">Abriendo…</div></div>`;$('imgModal').classList.add('abierto');
  try{const b=await archivo(x);if(!$('imgModal').classList.contains('abierto'))return;if(verUrl)URL.revokeObjectURL(verUrl);verUrl=URL.createObjectURL(b);
    $('imgVBtn').innerHTML=`<a class="btn" href="${verUrl}" target="_blank" rel="noopener">↗ Abrir en otra pestaña</a><a class="btn" href="${verUrl}" download="${esc(x.nombre)}">⬇ Descargar</a>`;
    $('imgVer').querySelector('.img-vcuerpo').innerHTML=esPdf(x)?`<iframe src="${verUrl}" title="${esc(x.nombre)}"></iframe>`:`<img src="${verUrl}" alt="${esc(x.tipo)}" class="img-foto" title="Clic para ver en tamaño real">`;}
  catch(e){$('imgVer').querySelector('.img-vcuerpo').innerHTML=`<div class="img-cargando err">${e.message==="incompleto"?"El archivo aún no termina de subir a la nube desde el equipo donde se cargó. Intente en unos minutos.":e.message==="sin-nube"?"Este archivo se cargó en otro equipo y aquí no hay conexión con la nube.":"No se pudo abrir el archivo (¿sin conexión?)."}</div>`;}}
async function bajar(x){if(esEnlace(x)){ver(x);return;}try{const b=await archivo(x),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=x.nombre||"estudio";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
  catch(e){msg(e.message==="incompleto"?"El archivo aún no termina de subir a la nube":"No se pudo descargar (¿sin conexión?)");}}
async function borrar(x){if(!await confirmar(esEnlace(x)?"Quitar enlace":"Eliminar estudio",esEnlace(x)?`Se quitará el enlace «${x.nombre||x.tipo}» de la app. En Google Drive no se borra nada.`:`Se eliminará «${x.tipo}» del ${x.fecha||"(sin fecha)"} (${x.nombre}) en este equipo y en la nube.`,{ok:esEnlace(x)?"Quitar":"Eliminar",peligro:true}))return;
  delete imagenes[x.id];guardar();IDB.del(x.id);IDB.del(x.id+"_t");
  if(x.gid&&config.driveAuto){const o=config.driveAuto.omitidos||[];if(!o.includes(x.gid)){config.driveAuto=Object.assign({},config.driveAuto,{omitidos:o.concat(x.gid).slice(-3000)});guardarConfig();}}
  const n=!esEnlace(x)&&nube();if(n){const b=n.db.batch(),col=n.db.collection("pct_archivos");for(let k=0;k<x.partes;k++)b.delete(col.doc(x.id+"_"+k));b.delete(col.doc(x.id+"_t"));b.commit().catch(e=>console.error(e));}
  render(true);msg(esEnlace(x)?"Enlace quitado":"Estudio eliminado");}
function nuevoEnlace(pac,url,o){url=urlLimpia(url);const id=uid(),carpeta=/\/folders\//.test(url);
  imagenes[id]={id,pacId:pac.id,tipo:o.tipo||(carpeta?CARPETA:TIPOS[0]),fecha:o.fecha||"",nota:o.nota||"",nombre:(o.nombre||(carpeta?"Carpeta en Google Drive":"Archivo en Google Drive")).slice(0,160),
    url:url.slice(0,500),dm:carpeta?"dir":o.dm||claseDe(o.nombre),mime:"enlace",tam:0,partes:0,mini:0,creado:new Date().toISOString(),por:(window.Sync&&Sync.usuario&&Sync.usuario())||""};
  if(o.origen)imagenes[id].origen=o.origen.slice(0,300);return id;}

/* ======================= IMPORTAR VARIOS (carpeta o ZIP de Google Drive) ======================= */
const MESES_TXT={ene:1,enero:1,feb:2,febrero:2,mar:3,marzo:3,abr:4,abril:4,may:5,mayo:5,jun:6,junio:6,jul:7,julio:7,ago:8,agosto:8,set:9,sep:9,setiembre:9,septiembre:9,oct:10,octubre:10,nov:11,noviembre:11,dic:12,diciembre:12};
const VACIAS=new Set(["de","del","la","las","los","y","e","pdf","jpg","jpeg","png","webp","heic","img","imagen","foto","scan","rx","tx","torax","placa","radiografia","tomografia","tem","tac","ecografia","eco","informe",
  "contacto","contactos","evaluacion","control","seguimiento","seguimientos","no","mod","ram","blc","bpal","bpalm","pat","esquema","sensible","sensibles","mdr","tptb","tpt","altas","alta","truenat","sri","copia","nuevo","nueva"]);
// fechas escritas con el mes («16 JULIO 2026», «OCTUBRE 2026»): se quitan enteras; el mes suelto queda, porque puede ser un nombre (Julio, Abril)
const FECHA_TXT=new RegExp("(^|[^a-z])(?:\\d{1,2}\\s*(?:de\\s*)?)?(?:"+Object.keys(MESES_TXT).sort((a,b)=>b.length-a.length).join("|")+")\\.?\\s*(?:del?\\s*)?\\d{2,4}","g");
const EXT_MIME={pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",bmp:"image/bmp",heic:"image/heic",heif:"image/heif"};
const extDe=n=>(/\.([a-z0-9]+)$/i.exec(n||"")||[])[1]?.toLowerCase()||"";
const palabras=t=>normTxt(t).replace(/\.[a-z0-9]{2,4}$/,"").replace(FECHA_TXT,"$1 ").replace(/[^a-z0-9ñ]+/g," ").split(" ").filter(w=>w.length>1&&!/\d/.test(w)&&!VACIAS.has(w));
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m||!n)return m||n; // letras de más, de menos, cambiadas o al revés (ALRACON / ALARCON)
  const d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){let v=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,d[i-2][j-2]+1);d[i][j]=v;}
  return d[m][n];}
const igual=(a,b)=>a===b||(Math.min(a.length,b.length)>=4&&lev(a,b)<=(Math.max(a.length,b.length)>=8?2:1)); // tolera errores de tipeo (MARCANTINCO / MARCATINCO)
let PALP=null; // palabras de cada paciente (se arma al abrir el importador)
// {r, dud}: dud = parecido pero no seguro (solo coinciden dos palabras y a cada lado sobra otra, como dos hermanos con los mismos
// apellidos, u otro paciente coincide en tantas palabras como él): se sugiere sin marcar, para que el usuario lo confirme
function quienEs(texto){const tt=[...new Set(palabras(texto))];if(tt.length<2)return null;let mej=null,seg=null;
  for(const {r,w} of PALP){const usados=new Set();let hits=0,exac=0;
    for(const t of tt){let j=w.findIndex((p,i)=>!usados.has(i)&&p===t);if(j>=0)exac++;else j=w.findIndex((p,i)=>!usados.has(i)&&igual(t,p));if(j>=0){hits++;usados.add(j);}}
    if(hits<2||hits/tt.length<.6||hits/w.length<.5)continue;const sc=hits*10+exac*.5+hits/tt.length+hits/w.length,o={r,sc,hits,dud:hits<3&&hits<tt.length&&hits<w.length};
    if(!mej||sc>mej.sc){seg=mej;mej=o;}else if(!seg||sc>seg.sc)seg=o;}
  if(!mej||(seg&&Math.abs(seg.sc-mej.sc)<.01))return null; // dos pacientes igual de parecidos: que elija el usuario
  return {r:mej.r,dud:mej.dud||!!(seg&&seg.hits===mej.hits)};}
function porDni(texto){const ds=String(texto).match(/\b\d{8}\b/g);if(!ds)return null;for(const d of ds){const r=pacientes.find(x=>x.dni===d);if(r)return r;}return null;}
function fechaDe(t){const s=normTxt(t);let m,d,mo,y;
  if((m=/(\d{4})[-_.](\d{1,2})[-_.](\d{1,2})/.exec(s))){y=+m[1];mo=+m[2];d=+m[3];}
  else if((m=/(\d{1,2})[-_. ](\d{1,2})[-_. ](\d{4}|\d{2})(?!\d)/.exec(s))){d=+m[1];mo=+m[2];y=+m[3];}
  else if((m=/(\d{1,2})\s*(?:de\s*)?([a-z]{3,10})\.?\s*(?:de[l]?\s*)?(\d{4}|\d{2})(?!\d)/.exec(s))&&MESES_TXT[m[2]]){d=+m[1];mo=MESES_TXT[m[2]];y=+m[3];}
  else return "";
  if(y<100)y+=2000;const f=new Date(y,mo-1,d);if(y<2000||y>2100||f.getMonth()!==mo-1||f.getDate()!==d)return "";return fmtFecha(f);}
function tipoDe(ruta){const s=normTxt(ruta);if(/tomograf|\btem\b|\btac\b/.test(s))return "Tomografía de tórax";if(/ecograf|\beco\b/.test(s))return "Ecografía";if(/informe/.test(s))return "Informe de imagen";return "Radiografía de tórax";}
// a quién pertenece cada archivo: DNI en la ruta, luego el nombre del archivo, luego las carpetas de adentro hacia afuera
// (sin pasar de una carpeta CONTACTOS: lo que está ahí es de los contactos, no del caso índice)
// carpetas de contactos: CONTACTOS, EVALUACION DE CONTACTOS, I / II / III EVALUACION (también con errores de tipeo: EVAUACION, VALUACION)
const LIMITE=t=>/contact|evaluac|evauac|valuac/.test(normTxt(t));
function detectar(ruta){const seg=ruta.split("/"),arch=seg.pop(),b=seg.findIndex(LIMITE); // de esa carpeta hacia adentro es de un contacto, no del caso índice
  const adentro=b<0?seg:seg.slice(b+1);let r=porDni([arch].concat(adentro).join("/"));if(r)return {r,por:"DNI"};
  let q=quienEs(arch),dud=null;if(q){if(!q.dud)return {r:q.r,por:"archivo"};dud={r:q.r,por:"archivo",dud:true};}
  for(let i=adentro.length-1;i>=0;i--){if(LIMITE(adentro[i]))continue;q=quienEs(adentro[i]); // la carpeta del contacto sí cuenta (puede estar en DATOS)
    if(q){if(!q.dud)return {r:q.r,por:"carpeta"};if(!dud)dud={r:q.r,por:"carpeta",dud:true};}}
  return dud||{r:null,por:b<0?"":"contactos"};} // uno dudoso solo si no hay otro seguro
const mismaRuta=(a,b)=>!!a&&!!b&&(a===b||a.endsWith("/"+b)||b.endsWith("/"+a)); // el ZIP empieza en «RX TORAX 2026/…»; una carpeta elegida puede traer una carpeta más arriba
const yaEsta=(pacId,nombre,tam,origen)=>Object.values(imagenes).some(x=>!x.url&&((mismaRuta(x.origen,origen)&&(!x.otam||x.otam===tam))||(x.pacId===pacId&&x.nombre===nombre&&(!x.otam||x.otam===tam)))); // los enlaces no cuentan
function cargarZip(){return window.JSZip?Promise.resolve(window.JSZip):new Promise((ok,mal)=>{const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  sc.onload=()=>ok(window.JSZip);sc.onerror=()=>mal(new Error("No se pudo cargar el lector de ZIP (¿sin conexión?)."));document.head.appendChild(sc);});}
async function leerZips(files){const Z=await cargarZip(),l=[];
  for(const z of files){const zip=await Z.loadAsync(z);const ents=Object.values(zip.files).filter(e=>!e.dir);
    for(const e of ents){const ruta=e.name.replace(/\\/g,"/"),base=ruta.split("/").pop(),ext=extDe(base);if(!base||base.startsWith(".")||/__macosx/i.test(ruta))continue;
      if(!EXT_MIME[ext]){l.push({ruta,f:null,ext});continue;}l.push({ruta,f:new File([await e.async("blob")],base,{type:EXT_MIME[ext],lastModified:e.date?+e.date:Date.now()})});}}
  return l;}
let IMP=[],impEstado="elegir";
const seguro=x=>x.pac&&!x.dud?1:0;
const DUD="⚠ Parecido, no seguro: confirme que es este paciente (márquelo) o elija otro";
/* ---- Traer directo de Google Drive con el enlace (sin descargar nada): la app lee la carpeta compartida con «Cualquier persona con el
   enlace» usando la API de Drive (solo lectura, con la clave de API del proyecto) y guarda cada PDF o foto como un estudio más. ---- */
const GAPI="https://www.googleapis.com/drive/v3/files",CARP_MIME="application/vnd.google-apps.folder";
const proyecto=()=>(window.FIREBASE_CONFIG&&FIREBASE_CONFIG.projectId)||"";
const claveDrive=()=>config.driveClave||(window.FIREBASE_CONFIG&&FIREBASE_CONFIG.apiKey)||"";
const esperar=ms=>new Promise(ok=>setTimeout(ok,ms*(window.__imgRapido?.01:1))); // (__imgRapido: solo para las pruebas)
function errDrive(cod,m){const e=new Error(m||cod);e.cod=cod;return e;}
async function api(ruta,intento){const k=claveDrive();if(!k)throw errDrive("clave","Falta la clave de API");let r;
  const n=intento||0,otra=async ms=>{await esperar(ms);return api(ruta,n+1);};
  try{r=await fetch(GAPI+ruta+(ruta.includes("?")?"&":"?")+"supportsAllDrives=true&key="+encodeURIComponent(k));}
  catch(e){if(n<2)return otra([3000,8000][n]); // Google corta cuando se piden muchas descargas seguidas (o se cayó internet un momento)
    throw errDrive("red","Google Drive no respondió (muchas descargas seguidas o se cortó internet)");}
  if(r.ok)return r;let j=null;try{j=await r.json();}catch(e){}const e=(j&&j.error)||{},t=(e.message||"")+" "+JSON.stringify(e.errors||"")+JSON.stringify(e.details||"");
  if((r.status===429||r.status>=500||/rateLimit/i.test(t))&&n<3)return otra([3000,8000,20000][n]);
  if(/downloadQuotaExceeded/i.test(t))throw errDrive("cuota","Google limitó por hoy las descargas de este archivo; se puede reintentar mañana");
  throw errDrive(/SERVICE_DISABLED|accessNotConfigured|has not been used/i.test(t)?"api-apagada":/API_KEY|keyInvalid|API key not valid|are blocked/i.test(t)?"clave":r.status===404||r.status===403?"sin-permiso":"red",e.message||("Error "+r.status));}
const esArch=d=>d.mime==="application/pdf"||/^image\//.test(d.mime||"")||!!EXT_MIME[extDe(d.name)];
const limpio=n=>String(n||"").replace(/[\/\\]/g,"-");
const CAMPOS="files(id,name,mimeType,size,createdTime,parents)";
const archD=(f,ruta)=>({ruta,id:f.id,name:f.name,mime:f.mimeType,size:+f.size||0,creado:f.createdTime||""});
// recorre la carpeta y sus subcarpetas; «carpetas» (opcional) se llena con {id: ruta} de cada carpeta
async function listarDrive(raiz,avance,carpetas,rutaRaiz){const m=await (await api("/"+raiz+"?fields=id,name,mimeType,size,createdTime")).json();
  if(m.mimeType!==CARP_MIME)return [archD(m,limpio(m.name))];
  const out=[],pend=[{id:m.id,ruta:rutaRaiz||limpio(m.name)}];let n=0;if(carpetas)carpetas[m.id]=pend[0].ruta;
  while(pend.length&&n<600&&out.length<4000){const c=pend.shift();let tok="";
    do{const j=await (await api("?q="+encodeURIComponent(`'${c.id}' in parents and trashed=false`)+"&fields=nextPageToken,"+CAMPOS+"&pageSize=1000&includeItemsFromAllDrives=true"+(tok?"&pageToken="+encodeURIComponent(tok):""))).json();
      for(const f of j.files||[]){const ruta=c.ruta+"/"+limpio(f.name);if(f.mimeType===CARP_MIME){pend.push({id:f.id,ruta});if(carpetas)carpetas[f.id]=ruta;}else out.push(archD(f,ruta));}
      tok=j.nextPageToken||"";}while(tok);
    if(avance)avance(++n,out.length);}
  return out;}
async function bajarDrive(d){d=Object.assign({},d,{id:d.id||d.drive});if(!d.name||!/\.[a-z0-9]{2,4}$/i.test(d.name)||!d.type){const m=await (await api("/"+d.id+"?fields=name,mimeType,size")).json();d=Object.assign({},d,{name:/\.[a-z0-9]{2,4}$/i.test(d.name||"")?d.name:m.name,type:d.type||m.mimeType});}
  const b=await (await api("/"+d.id+"?alt=media")).blob();return new File([b],d.name,{type:d.type||b.type});}
let drvErr=null,drvUrl=""; // último enlace pegado (se conserva al volver a dibujar)
function panelDrvErr(){if(!drvErr)return "";const pj=proyecto(),q=pj?"?project="+encodeURIComponent(pj):"";
  const campo=`<div class="img-idfila"><input type="text" id="imgDrvClave" value="${esc(config.driveClave||"")}" placeholder="Pegue aquí la clave (AIza…)" autocomplete="off"><button type="button" class="btn primary" data-i="drvClave">Guardar clave</button></div>`;
  const cred=`<a href="https://console.cloud.google.com/apis/credentials${q}" target="_blank" rel="noopener">Credenciales de Google Cloud</a>`;
  if(drvErr.cod==="clave")return `<div class="img-iaviso"><b>${config.driveClave?"La clave guardada no tiene permiso para usar Google Drive.":"Google Drive API ya está activa, pero la clave de la app no tiene permiso para usarla."}</b>
    <span>Cree una clave solo para Drive (unos 2 minutos), con la cuenta dueña del proyecto de Firebase:</span>
    <ol><li>Abra ${cred} y arriba presione <b>+ Crear credenciales → Clave de API</b>.</li>
      <li>Copie la clave que aparece (empieza con <b>AIza</b>), péguela aquí abajo y presione <b>Guardar clave</b>: la app vuelve a leer la carpeta sola.</li>
      <li>Recomendado: en esa misma clave, <b>Restricciones de API → Restringir clave → Google Drive API</b>, y en <b>Restricciones de aplicaciones → Sitios web</b> agregue <b>pct-huascar.web.app/*</b> y <b>pct-huascar.firebaseapp.com/*</b>. Guarde (tarda hasta 5 minutos en aplicarse).</li></ol>
    ${campo}<small>No cambie la clave que ya existe («Browser key (auto created by Firebase)»): la usa el inicio de sesión de la app.</small>
    <small class="img-ierrt">${esc(drvErr.msg||"")}</small></div>`;
  if(drvErr.cod==="api-apagada")return `<div class="img-iaviso"><b>Falta activar una sola vez la conexión con Google Drive</b>
    <ol><li>Entre con la cuenta dueña del proyecto de Firebase a <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com${q}" target="_blank" rel="noopener">Google Drive API</a> y presione <b>Habilitar</b>.</li>
      <li>Espere uno o dos minutos y presione otra vez <b>«Leer la carpeta»</b>.</li></ol>
    <small class="img-ierrt">${esc(drvErr.msg||"")}</small></div>`;
  return `<div class="img-iaviso">${drvErr.cod==="url"?"<b>Pegue el enlace de una carpeta o de un archivo de Google Drive.</b>":drvErr.cod==="sin-permiso"?"<b>No se pudo abrir la carpeta.</b> Revise el enlace y que en Drive esté compartida como <b>«Cualquier persona con el enlace»</b> (Compartir → Acceso general).":"<b>No hay conexión con Google Drive.</b> Intente de nuevo."}<small class="img-ierrt">${esc(drvErr.msg||"")}</small></div>`;}
async function leerDrive(u){u=drvUrl=String(u||"").trim();const id=idDrive(u)||(/^[\w-]{20,}$/.test(u)?u:"");if(!id){drvErr={cod:"url"};impEstado="elegir";pintarImp();return;}
  impEstado="leyendo";pintarImp();const B=$('imgImp');B.querySelector('h3').textContent="Leyendo la carpeta de Google Drive…";
  try{const l=await listarDrive(id,(nc,na)=>{const c=B.querySelector('.img-cargando');if(c)c.textContent=`⏳ ${nc} carpeta${nc===1?"":"s"} · ${na} archivo${na===1?"":"s"}`;});
    drvErr=null;if(/\/folders\//.test(u)&&!config.driveRaiz){config.driveRaiz=urlLimpia(u);guardarConfig();}if(puedeAuto())autoInicial();
    await preparar(l.map(d=>({ruta:d.ruta,f:esArch(d)?{name:d.name,size:d.size,type:EXT_MIME[extDe(d.name)]&&!/^image\/|pdf/.test(d.mime||"")?EXT_MIME[extDe(d.name)]:d.mime,drive:d.id}:null})));}
  catch(e){console.error(e);drvErr={cod:e.cod||"red",msg:e.message};impEstado="elegir";pintarImp();}}
/* ---- Automático: solo lo NUEVO que se sube a la carpeta. Corre en los equipos con la app abierta (al abrirla y cada 30 minutos):
   el plan gratuito de Firebase no tiene un servidor que lo haga solo. Nuevo = creado en Drive después de activarlo. Lo que se reconoce
   con seguridad se guarda solo; lo demás queda «por revisar» (número en el botón «Traer de Drive»). ---- */
const LS_AUTO="pct_drive_auto",CADA=30*60000;
let AUTO={},autoCorriendo=false;try{AUTO=JSON.parse(localStorage.getItem(LS_AUTO))||{};}catch(e){}
const guardarAuto=()=>{try{localStorage.setItem(LS_AUTO,JSON.stringify(AUTO));}catch(e){}};
const autoCfg=()=>config.driveAuto&&config.driveAuto.on&&idDrive(config.driveAuto.raiz)?config.driveAuto:null;
function autoInicial(){if(config.driveAuto||!/\/folders\//.test(config.driveRaiz||""))return; // se enciende solo la primera vez (luego se puede apagar)
  config.driveAuto={on:true,raiz:urlLimpia(config.driveRaiz),desde:new Date().toISOString(),omitidos:[]};AUTO={};guardarAuto();guardarConfig();}
const yaTraido=d=>!!imagenes["d_"+d.id]||Object.values(imagenes).some(x=>!x.url&&(x.gid===d.id||(d.ruta&&mismaRuta(x.origen,d.ruta)&&(!x.otam||x.otam===d.size))));
const omitido=id=>((config.driveAuto||{}).omitidos||[]).includes(id);
const pendientes=()=>(AUTO.pend||[]).filter(d=>!yaTraido(d)&&!omitido(d.id));
const isoD=ms=>new Date(ms).toISOString().slice(0,19); // formato de las consultas de Drive (UTC)
async function nuevosDrive(desdeMs){const car=AUTO.carpetas,ids=Object.keys(car),out=[],nuevas=[],desde=isoD(desdeMs);
  const consultar=async g=>{let tok="",falta=false;const res=[];
    do{const q=`(${g.map(id=>`'${id}' in parents`).join(" or ")}) and trashed=false and createdTime > '${desde}'`;
      const j=await (await api("?q="+encodeURIComponent(q)+"&fields=nextPageToken,"+CAMPOS+"&pageSize=1000&includeItemsFromAllDrives=true"+(tok?"&pageToken="+encodeURIComponent(tok):""))).json();
      for(const f of j.files||[]){const p=g.length===1?g[0]:(f.parents||[]).find(x=>car[x]);if(!p){falta=true;break;}res.push([f,p]);}
      tok=falta?"":j.nextPageToken||"";}while(tok);
    if(falta&&g.length>1){for(const id of g)await consultar([id]);return;} // sin «parents» en la respuesta: carpeta por carpeta
    for(const [f,p] of res){const ruta=car[p]+"/"+limpio(f.name);if(f.mimeType===CARP_MIME){if(!car[f.id]){car[f.id]=ruta;nuevas.push({id:f.id,ruta});}}else out.push(archD(f,ruta));}};
  for(let i=0;i<ids.length;i+=40)await consultar(ids.slice(i,i+40));
  for(const c of nuevas)out.push(...await listarDrive(c.id,null,car,c.ruta)); // carpeta nueva (paciente nuevo): todo lo de adentro es nuevo
  return out;}
const puedeAuto=()=>!document.body.classList.contains('login-abierto')&&(nube()||!window.firebase); // con nube: solo con sesión iniciada
async function revisarAuto(forzar){if(puedeAuto())autoInicial();const c=autoCfg();if(!c||autoCorriendo||!claveDrive()||!puedeAuto())return;if(!forzar&&Date.now()-(AUTO.ult||0)<CADA)return;
  autoCorriendo=true;const ini=Date.now(),raiz=idDrive(c.raiz),desdeAct=Date.parse(c.desde)||ini;let ok=0;pintarBadge();
  try{let lista;
    if(AUTO.raiz!==raiz||!AUTO.carpetas||ini-(AUTO.completo||0)>7*864e5){const car={};lista=await listarDrive(raiz,null,car);AUTO.carpetas=car;AUTO.raiz=raiz;AUTO.completo=ini;} // completo: la primera vez y cada semana
    else lista=await nuevosDrive(Math.max(desdeAct,(AUTO.ult||0)-864e5)); // un día de margen; lo repetido se descarta
    const nuevos=lista.filter(d=>esArch(d)&&Date.parse(d.creado||0)>desdeAct&&!yaTraido(d)&&!omitido(d.id)&&!(AUTO.pend||[]).some(p=>p.id===d.id)).concat(pendientes());
    PALP=pacientes.map(r=>({r,w:[...new Set(palabras(r.nom))]})).filter(x=>x.w.length);AUTO.pend=AUTO.pend||[];
    for(const d of nuevos){const det=detectar(d.ruta),pac=det.r&&!det.dud?det.r:null;
      if(!pac){if(!AUTO.pend.some(p=>p.id===d.id))AUTO.pend.push(d);continue;}
      try{await esperar(600);const f=await bajarDrive({id:d.id,name:d.name,type:EXT_MIME[extDe(d.name)]&&!/^image\/|pdf/.test(d.mime||"")?EXT_MIME[extDe(d.name)]:d.mime});
        const fecha=fechaDe(d.name)||fechaDe(d.ruta.split("/").slice(-2,-1)[0]||"")||(d.creado?fmtFecha(new Date(d.creado)):"");
        await subirUno(f,pac,{tipo:tipoDe(d.ruta),fecha,nota:"",origen:d.ruta,gid:d.id},()=>{});ok++;quitarEnlaces(d.id,pac.id);}
      catch(e){if(e.cod==="clave"||e.cod==="api-apagada"||e.cod==="red")throw e;console.error(e);if(!AUTO.pend.some(p=>p.id===d.id))AUTO.pend.push(d);}}
    AUTO.pend=AUTO.pend.filter(d=>!yaTraido(d)&&!omitido(d.id)).slice(-500);AUTO.ult=ini;AUTO.err="";
    if(ok)msg(`🔄 Drive: ${ok} estudio${ok>1?"s":""} nuevo${ok>1?"s":""} guardado${ok>1?"s":""}`);}
  catch(e){console.error(e);AUTO.err=e.cod||"red";AUTO.errMsg=String(e.message||e).slice(0,200);AUTO.ultIntento=ini;}
  finally{AUTO.traidos=(AUTO.traidos||0)+ok;guardarAuto();autoCorriendo=false;pintarBadge();render(true);if(impEstado==="elegir"&&$('imgImpModal').classList.contains('abierto'))pintarImp();}}
function pintarBadge(){const b=$('imgImportar'),n=pendientes().length,c=autoCfg();
  b.innerHTML=`📥 Traer de Drive${c?` <span class="img-auto${autoCorriendo?" gira":""}" title="Automático activo">🔄</span>`:""}${n?` <span class="img-badge" title="${n} estudio${n>1?"s":""} nuevo${n>1?"s":""} en Drive por revisar">${n}</span>`:""}`;}
function activarAuto(on){const prev=config.driveAuto||{};
  if(on){const u=(($('imgDrvUrl')||{}).value||drvUrl||config.driveRaiz||"").trim();if(!/\/folders\//.test(u)||!idDrive(u)){msg("Pegue primero el enlace de la carpeta de Drive");pintarImp();return;}
    config.driveAuto={on:true,raiz:urlLimpia(u),desde:new Date().toISOString(),omitidos:prev.omitidos||[]};AUTO={};guardarAuto();}
  else config.driveAuto=Object.assign({},prev,{on:false});
  guardarConfig();pintarBadge();pintarImp();if(on){msg("Automático activado: se traerán los estudios nuevos");revisarAuto(true);}}
const haceTxt=ms=>{const m=Math.round((Date.now()-ms)/60000);return !ms?"todavía no":m<1?"recién":m<60?`hace ${m} min`:m<1440?`hace ${Math.round(m/60)} h`:`hace ${Math.round(m/1440)} d`;};
function panelAuto(){const c=autoCfg(),n=pendientes().length;
  return `<div class="img-iauto"><label><input type="checkbox" data-i="autoOn" ${c?"checked":""}> 🔄 <b>Automático:</b> traer solos los estudios <b>nuevos</b> que se suban a esta carpeta</label>
    <small>${c?`Activo desde el ${esc(fmtFecha(new Date(c.desde)))} · última revisión: ${autoCorriendo?"revisando ahora…":haceTxt(AUTO.ult)}${AUTO.traidos?` · ${AUTO.traidos} traído${AUTO.traidos>1?"s":""} en este equipo`:""}. Se revisa al abrir la app y cada 30 minutos en los equipos con la app abierta; lo que no se reconoce con seguridad queda para revisar.`:"Cuenta como nuevo solo lo que se suba desde que lo active (lo que ya está en Drive se trae con «Leer la carpeta»)."}</small>
    ${c&&AUTO.err&&!autoCorriendo&&(AUTO.ultIntento||0)>(AUTO.ult||0)?`<small class="img-ierrt">⚠ La última revisión falló: ${esc(AUTO.err==="clave"||AUTO.err==="api-apagada"?"la clave de API no puede usar Google Drive (presione «Leer la carpeta» para ver los pasos)":AUTO.errMsg||"sin conexión")}</small>`:""}
    <div class="img-ibtns">${c?`<button type="button" class="btn" data-i="autoYa" ${autoCorriendo?"disabled":""}>🔄 Revisar ahora</button>`:""}${n?`<button type="button" class="btn primary" data-i="revPend">🆕 Revisar ${n} nuevo${n>1?"s":""} sin paciente seguro</button>`:""}</div></div>`;}
let impPend=false; // la revisión es de los nuevos que dejó el automático
function quitarEnlaces(gid,pacId){let n=0;for(const k in imagenes){const x=imagenes[k];if(x.url&&x.pacId===pacId&&!esCarpeta(x)&&idDrive(x.url)===gid){delete imagenes[k];n++;}}if(n)guardar();} // ya está guardado en la app
async function traerEnlace(x){const pac=pacientes.find(p=>p.id===x.pacId),id=idDrive(x.url);if(!pac||!id||subiendo)return;
  if(esCarpeta(x)){abrirImp();leerDrive(x.url);return;}
  if(Object.values(imagenes).some(y=>!y.url&&y.gid===id&&y.pacId===pac.id)){delete imagenes[x.id];guardar();render(true);msg("Ya estaba guardado en la app");return;}
  subiendo=true;progreso("Trayendo de Google Drive: "+(x.nombre||""),.05);
  try{const f=await bajarDrive({id,name:x.nombre,type:x.dm==="pdf"?"application/pdf":""});
    const r=await subirUno(f,pac,{tipo:x.tipo,fecha:x.fecha,nota:x.nota||"",origen:x.origen||"",gid:id},p=>progreso("Guardando en la app: "+f.name,.3+.7*p));
    delete imagenes[x.id];guardar();msg("Guardado en la app"+(r==="cola"?" · se termina de subir al reconectar":r==="local"?" (en este equipo)":""));}
  catch(e){console.error(e);if(e.cod==="api-apagada"||e.cod==="clave"){subiendo=false;progreso(null);abrirImp();drvErr={cod:e.cod,msg:e.message};drvUrl=x.url;pintarImp();return;}
    avisar("No se pudo traer de Google Drive",e.cod==="sin-permiso"?"El archivo no está compartido como «Cualquier persona con el enlace» o ya no existe.":String(e&&e.message||e),"peligro");}
  finally{subiendo=false;progreso(null);render(true);}}
function pintarImp(){const B=$('imgImp');if(impEstado.startsWith("enl")){pintarEnl();return;}
  if(impEstado==="elegir"){const u=drvUrl||config.driveRaiz||"";
    B.innerHTML=`<div class="img-icab"><div><h3>📥 Traer estudios de Google Drive</h3><p>Los PDF y fotos quedan guardados en la app, como los que se suben a mano: se ven aquí sin entrar a Drive.</p></div><button type="button" class="btn" data-i="cerrar">✕</button></div>
    <div class="img-idrive"><b>🔗 Directo de Drive, sin descargar nada</b>
      <div class="img-idfila"><input type="url" id="imgDrvUrl" value="${esc(u)}" placeholder="Pegue el enlace de la carpeta (o de un archivo) de Google Drive" autocomplete="off"><button type="button" class="btn primary" data-i="drvLeer">Leer la carpeta</button></div>
      <small>Se leen todas sus subcarpetas. La app reconoce al <b>paciente</b> por el nombre de su carpeta o del archivo (o por el DNI), la <b>fecha</b> por el nombre del archivo (16-10-26, 24-10-2026, 16 JULIO 2026) y el <b>tipo</b> por sus palabras; usted revisa la lista y se guarda todo junto. La carpeta debe estar compartida como «Cualquier persona con el enlace».</small>
      ${panelDrvErr()}${panelAuto()}</div>
    <details class="img-iotro"><summary>O, si ya lo descargó: el ZIP, la carpeta o varios archivos</summary>
      <ol class="img-ipasos"><li>En <b>Google Drive</b>, clic derecho en la carpeta → <b>Descargar</b> (Drive la baja en un <b>.zip</b>).</li><li>Elija aquí ese ZIP (o, si lo descomprimió, la carpeta).</li></ol>
      <div class="img-ibtns"><button type="button" class="btn" data-i="zip">🗜 Elegir el ZIP</button><button type="button" class="btn" data-i="carpeta">📁 Elegir la carpeta</button><button type="button" class="btn" data-i="arch">📄 Elegir varios archivos</button></div></details>
    <small class="img-inota">Los archivos de una carpeta <b>CONTACTOS</b> no se asignan al caso índice: elija a quién pertenecen. Lo que ya se guardó antes no se repite.</small>`;return;}
  if(impEstado==="leyendo"){B.innerHTML=`<div class="img-icab"><div><h3>Leyendo los archivos…</h3><p>Un momento, se reconocen pacientes y fechas.</p></div></div><div class="img-cargando oscuro">⏳</div>`;return;}
  if(impEstado==="subiendo"||impEstado==="listo"){return;}
  const ok=IMP.filter(x=>x.f),sel=ok.filter(x=>x.si&&x.pac),rec=ok.filter(x=>x.por&&x.pac&&x.por!=="contactos"&&!x.dud).length,dud=ok.filter(x=>x.pac&&x.dud).length,sin=ok.filter(x=>!x.pac).length,ya=ok.filter(x=>x.ya).length,otros=IMP.length-ok.length;
  const opc=`<option value="">— Elija el paciente —</option>`+ordenarPacientes(pacientes).slice().sort((a,b)=>normTxt(a.nom).localeCompare(normTxt(b.nom))).map(r=>`<option value="${esc(r.id)}">${esc(r.nom||"(sin nombre)")} · N° ${esc(r.n)}${r.dni?" · "+esc(r.dni):""}</option>`).join("");
  B.innerHTML=`<div class="img-icab"><div><h3>Revise antes de subir</h3><p>${ok.length} archivo${ok.length===1?"":"s"} · <b class="v">${rec} reconocido${rec===1?"":"s"}</b>${dud?` · <b class="a">${dud} por confirmar</b>`:""} · <b class="a">${sin} sin paciente</b>${ya?` · ${ya} ya importado${ya===1?"":"s"}`:""}${otros?` · ${otros} no son PDF ni foto (se omiten)`:""}</p></div><button type="button" class="btn" data-i="cerrar">✕</button></div>
    <div class="img-ibar"><label>Tipo para todos <select data-i="tipoTodos"><option value="">— no cambiar —</option>${TIPOS.map(t=>`<option>${t}</option>`).join("")}</select></label><label><input type="checkbox" data-i="soloSin"> Ver solo los que faltan revisar</label></div>
    <div class="img-itabla"><table><thead><tr><th><input type="checkbox" data-i="todos" ${sel.length&&sel.length===ok.filter(x=>x.pac&&!x.ya&&!x.dud).length?"checked":""} title="Marcar todos"></th><th>Archivo</th><th>Paciente</th><th>Fecha</th><th>Tipo</th></tr></thead><tbody>
    ${ok.map((x,i)=>`<tr data-k="${IMP.indexOf(x)}" class="${x.ya?"ya":!x.pac||x.dud?"falta":""}"><td><input type="checkbox" data-c="si" ${x.si?"checked":""} ${x.pac?"":"disabled"}></td>
      <td><b>${esc(x.f.name)}</b><small>${esc(x.ruta.split("/").slice(0,-1).join(" › "))}</small></td>
      <td><select data-c="pac">${opc.replace(`value="${esc(x.pac||"")}"`,`value="${esc(x.pac||"")}" selected`)}</select><small class="img-ipor">${x.ya?"Ya importado antes":x.pac&&x.dud?DUD:x.pac?(x.por==="DNI"?"✔ por el DNI":x.por==="archivo"?"✔ por el nombre del archivo":x.por==="carpeta"?"✔ por el nombre de la carpeta":"elegido a mano"):x.por==="contactos"?"⚠ Carpeta de contactos: elija a quién pertenece":"⚠ No se reconoció: elija el paciente"}</small></td>
      <td><input type="date" data-c="fecha" value="${aIso(x.fecha)}">${x.fecha?"":`<small class="img-ipor">sin fecha en el nombre</small>`}</td>
      <td><select data-c="tipo">${TIPOS.map(t=>`<option ${t===x.tipo?"selected":""}>${t}</option>`).join("")}</select></td></tr>`).join("")||`<tr><td colspan="5" class="img-vacio">No se encontraron PDF ni fotos.</td></tr>`}
    </tbody></table></div>
    <div class="img-ipie"><span>${sel.length} para subir</span>${impPend?`<button type="button" class="btn" data-i="omitir" title="Los que no marque no volverán a aparecer como nuevos (siguen en Drive)">🙈 No volver a mostrar los no marcados</button>`:""}<button type="button" class="btn" data-i="otra">↺ Elegir otros</button><button type="button" class="btn primary" data-i="subir" ${sel.length?"":"disabled"}>⬆ Subir ${sel.length} estudio${sel.length===1?"":"s"}</button></div>`;
  if($('imgImp').dataset.soloSin==="1"){B.querySelector('[data-i="soloSin"]').checked=true;B.querySelectorAll('tbody tr').forEach(tr=>{if(!tr.classList.contains('falta'))tr.hidden=true;});}}
function abrirImp(){impEstado="elegir";IMP=[];drvErr=null;impPend=false;$('imgImp').dataset.soloSin="";pintarImp();$('imgImpModal').classList.add('abierto');}
function cerrarImp(){if(impEstado==="subiendo")return;$('imgImpModal').classList.remove('abierto');IMP=[];}
async function preparar(lista){impEstado="leyendo";pintarImp();
  try{PALP=pacientes.map(r=>({r,w:[...new Set(palabras(r.nom))]})).filter(x=>x.w.length);
    IMP=lista.map(({ruta,f})=>{if(!f)return {ruta,f:null};const fecha=fechaDe(f.name)||fechaDe(ruta.split("/").slice(-2,-1)[0]||""),tipo=tipoDe(ruta);
      const prev=Object.values(imagenes).find(x=>!x.url&&((f.drive&&x.gid===f.drive)||(mismaRuta(x.origen,ruta)&&(!x.otam||x.otam===f.size)))); // ya se importó (aunque se haya asignado a mano)
      if(prev)return {ruta,f,pac:prev.pacId,por:"ya",ya:true,si:false,fecha:prev.fecha||fecha,tipo:prev.tipo||tipo};
      const d=detectar(ruta),pac=d.r?d.r.id:"",ya=!!pac&&yaEsta(pac,f.name,f.size,ruta);
      return {ruta,f,pac,por:d.por,dud:!!d.dud,ya,si:!!pac&&!ya&&!d.dud,fecha,tipo};});
    IMP.sort((a,b)=>(!!b.f-!!a.f)||(seguro(a)-seguro(b))||a.ruta.localeCompare(b.ruta)); // primero los que faltan revisar
    impEstado="revisar";}
  catch(e){console.error(e);impEstado="elegir";pintarImp();avisar("No se pudo leer",String(e&&e.message||e),"peligro");return;}
  pintarImp();}
async function subirTodo(){const l=IMP.filter(x=>x.f&&x.si&&x.pac&&!x.hecho);if(!l.length)return;impEstado="subiendo";const B=$('imgImp');let ok=0,cola=0,local=0,cortes=0;const err=[];
  B.innerHTML=`<div class="img-icab"><div><h3>Guardando estudios en la app…</h3><p>No cierre la app hasta que termine.</p></div></div><div class="img-prog grande"><div class="img-pbar"><i></i></div><span></span></div>`;
  const pr=(t,f)=>{B.querySelector('.img-prog span').textContent=t;if(f!=null)B.querySelector('.img-pbar i').style.width=Math.round(f*100)+"%";};
  const pausa=async seg=>{for(let k=seg;k>0;k--){pr(`Google Drive pidió una pausa: se reanuda solo en ${k} s…`,null);await esperar(1000);}};
  let parar=false;
  for(let i=0;i<l.length&&!parar;i++){const x=l[i],pac=pacientes.find(r=>r.id===x.pac);pr(`${i+1} de ${l.length}: ${x.f.name}`,i/l.length);
    if(!pac){err.push(x.f.name+": paciente no encontrado");continue;}
    for(let intento=0;;intento++){
      try{let f=x.f;if(f.drive){pr(`${i+1} de ${l.length}: trayendo de Drive ${f.name}`,i/l.length);if(i)await esperar(600);f=await bajarDrive(f);} // sin apuro: Google corta si se piden muchas seguidas
        const r=await subirUno(f,pac,{tipo:x.tipo,fecha:x.fecha,nota:"",origen:x.ruta,gid:x.f.drive},p=>pr(`${i+1} de ${l.length}: ${x.f.name}`,(i+p)/l.length));ok++;if(r==="cola")cola++;if(r==="local")local++;
        x.hecho=true;cortes=0;if(x.f.drive)quitarEnlaces(x.f.drive,pac.id);break;}
      catch(e){console.error(e);
        if(e.cod==="red"&&intento<2){await pausa(intento?90:45);continue;} // se espera y se intenta otra vez el mismo
        if(e.cod==="red"&&++cortes>=2)parar=true; // Google sigue sin responder: se deja el resto para «Reintentar»
        err.push(x.f.name+": "+(e&&e.message||e));break;}}}
  const faltan=IMP.filter(x=>x.f&&x.si&&x.pac&&!x.hecho).length;
  impEstado="listo";pr("Listo",1);
  B.innerHTML=`<div class="img-icab"><div><h3>✔ ${ok} estudio${ok===1?"":"s"} importado${ok===1?"":"s"}</h3><p>${local?"Guardados en este equipo (sin nube).":cola?"Se terminan de subir a la nube al reconectar.":"Guardados y sincronizados con los demás equipos."}${faltan?` · <b class="a">Faltan ${faltan}</b>`:""}</p></div></div>
    ${parar?`<div class="img-ierr"><b>Google Drive dejó de responder y se detuvo para no insistir.</b> Espere unos minutos y presione «Reintentar»: solo se traen los que faltan.</div>`:""}
    ${err.length?`<div class="img-ierr"><b>No se pudieron subir ${err.length}:</b><ul>${err.map(e=>`<li>${esc(e)}</li>`).join("")}</ul></div>`:""}
    <div class="img-ipie"><span></span>${faltan?`<button type="button" class="btn" data-i="reintentar">↻ Reintentar los ${faltan} que faltan</button>`:""}<button type="button" class="btn primary" data-i="fin">Listo</button></div>`;
  render(true);}
/* ======================= ENLAZAR CON DRIVE (sin descargar ni copiar nada) ======================= */
// Lista de enlaces, una línea por paciente: «GRUPO / APELLIDOS NOMBRES   https://drive.google.com/drive/folders/…» (o el enlace primero).
// «CARPETA PRINCIPAL … enlace» guarda la carpeta raíz para abrirla desde la barra.
let ENL=[],enlRaiz="",enlConRaiz=true;
function leerEnlaces(txt){const l=[];let raiz="";
  String(txt||"").split(/\r?\n/).forEach(lin=>{const m=URL_DRIVE.exec(lin);if(!m)return;const url=m[0].replace(/[),.;]+$/,""),resto=lin.replace(m[0]," ").replace(/[\t|;"]+/g," ").trim();
    if(/carpeta\s+principal/i.test(resto)){raiz=url;return;}
    const seg=resto.split(/\s*[›\/>]\s*/).map(x=>x.trim()).filter(Boolean),ruta=seg.join("/"),nombre=seg[seg.length-1]||"",carpeta=/\/folders\//.test(url);
    const d=ruta?detectar(ruta):{r:null,por:""},pac=d.r?d.r.id:"";
    const ya=Object.values(imagenes).some(x=>x.url&&mismoDrive(x.url,url)&&(!pac||x.pacId===pac));
    l.push({url,ruta,nombre,carpeta,pac,por:d.por,dud:!!d.dud,ya,si:!!pac&&!ya&&!d.dud,tipo:carpeta?CARPETA:tipoDe(ruta),fecha:carpeta?"":fechaDe(nombre),nota:"",origen:ruta,lugar:seg.slice(0,-1).join(" › ")});});
  l.sort((a,b)=>(seguro(a)-seguro(b))||a.ruta.localeCompare(b.ruta)); // primero los que faltan revisar
  return {l,raiz};}
function pintarEnl(){const B=$('imgImp');
  if(impEstado==="enl"){B.innerHTML=`<div class="img-icab"><div><h3>🔗 Enlazar los estudios de Google Drive</h3><p>Sin descargar nada: cada PDF o foto queda en el paciente y se ve aquí mismo, como los demás estudios (el archivo sigue en Drive).</p></div><button type="button" class="btn" data-i="cerrar">✕</button></div>
    <ol class="img-ipasos"><li>Pegue la lista de enlaces: una línea por estudio (o por carpeta), con el paciente y su enlace (en Drive: clic derecho → <b>Compartir → Copiar enlace</b>).<br><small>Ejemplo: <code>PAT ESQUEMA SENSIBLES 2026 / MARCATINCO POMA CHEYLA / 16-10-26 RX.pdf   https://drive.google.com/file/d/…</code></small></li>
      <li>O elija el archivo <b>.txt</b> con la lista.</li><li>La app reconoce a cada paciente por el nombre; revise y guarde. En Drive no se mueve ni se borra nada.</li></ol>
    <div class="img-enltxt"><textarea id="imgEnlTxt" rows="7" placeholder="GRUPO / APELLIDOS NOMBRES   https://drive.google.com/drive/folders/…"></textarea></div>
    <div class="img-ibtns"><button type="button" class="btn primary" data-i="enlRevisar">Revisar la lista</button><button type="button" class="btn" data-i="enlArch">📄 Elegir la lista (.txt)</button></div>
    <small class="img-inota">Se ve dentro de la app si la carpeta de Drive está compartida como «Cualquier persona con el enlace»; si no, quien lo abra debe tener acceso con su cuenta de Google.</small>`;return;}
  if(impEstado==="enl-fin")return;
  const sel=ENL.filter(x=>x.si&&x.pac),rec=ENL.filter(x=>x.pac&&x.por&&x.por!=="mano"&&!x.dud).length,dud=ENL.filter(x=>x.pac&&x.dud).length,sin=ENL.filter(x=>!x.pac).length,ya=ENL.filter(x=>x.ya).length;
  const opc=`<option value="">— Elija el paciente —</option>`+pacientes.slice().sort((a,b)=>normTxt(a.nom).localeCompare(normTxt(b.nom))).map(r=>`<option value="${esc(r.id)}">${esc(r.nom||"(sin nombre)")} · N° ${esc(r.n)}${r.dni?" · "+esc(r.dni):""}</option>`).join("");
  B.innerHTML=`<div class="img-icab"><div><h3>Revise los enlaces</h3><p>${ENL.length} enlace${ENL.length===1?"":"s"} · <b class="v">${rec} reconocido${rec===1?"":"s"}</b>${dud?` · <b class="a">${dud} por confirmar</b>`:""} · <b class="a">${sin} sin paciente</b>${ya?` · ${ya} ya guardado${ya===1?"":"s"}`:""}</p></div><button type="button" class="btn" data-i="cerrar">✕</button></div>
    ${enlRaiz?`<div class="img-ibar"><label><input type="checkbox" data-i="conRaiz" ${enlConRaiz?"checked":""}> Guardar también la <b>carpeta principal</b> para abrirla desde la barra («📂 Carpeta en Drive»)</label></div>`:""}
    <div class="img-itabla"><table><thead><tr><th></th><th>En Google Drive</th><th>Paciente</th><th>Tipo y fecha</th></tr></thead><tbody>
    ${ENL.map((x,i)=>`<tr data-k="${i}" class="${x.ya?"ya":!x.pac||x.dud?"falta":""}"><td><input type="checkbox" data-c="si" ${x.si?"checked":""} ${x.pac&&!x.ya?"":"disabled"}></td>
      <td><b>${x.carpeta?"📁":claseDe(x.nombre)==="pdf"?"📄":"🖼"} ${esc(x.nombre||"(sin nombre)")}</b><small>${esc(x.lugar)}${x.lugar?" · ":""}<a href="${esc(hrefDrive(x.url))}" target="_blank" rel="noopener">abrir</a></small></td>
      <td><select data-c="pac">${opc.replace(`value="${esc(x.pac||"")}"`,`value="${esc(x.pac||"")}" selected`)}</select><small class="img-ipor">${x.ya?"Ya guardado antes":x.pac&&x.dud?DUD:x.pac?(x.por==="DNI"?"✔ por el DNI":x.por==="mano"?"elegido a mano":"✔ por el nombre"):x.por==="contactos"?"⚠ Carpeta de contactos: elija a quién pertenece":"⚠ No está en DATOS o no se reconoció: elija el paciente o déjelo"}</small></td>
      <td><select data-c="tipo">${(x.carpeta?TIPOS_ENL:TIPOS).map(t=>`<option ${t===x.tipo?"selected":""}>${t}</option>`).join("")}</select>${x.carpeta?"":`<input type="date" data-c="fecha" value="${aIso(x.fecha)}">`}</td></tr>`).join("")||`<tr><td colspan="4" class="img-vacio">No se encontraron enlaces de Google Drive en la lista.</td></tr>`}
    </tbody></table></div>
    <div class="img-ipie"><span>${sel.length} para guardar</span><button type="button" class="btn" data-i="enlOtra">↺ Pegar otra lista</button><button type="button" class="btn primary" data-i="enlGuardar" ${sel.length||(enlRaiz&&enlConRaiz)?"":"disabled"}>🔗 Guardar ${sel.length} enlace${sel.length===1?"":"s"}</button></div>`;}
function revisarEnl(txt){PALP=pacientes.map(r=>({r,w:[...new Set(palabras(r.nom))]})).filter(x=>x.w.length);const {l,raiz}=leerEnlaces(txt);ENL=l;enlRaiz=raiz;enlConRaiz=true;impEstado="enl-rev";pintarEnl();}
function guardarEnl(){const l=ENL.filter(x=>x.si&&x.pac&&!x.ya);let n=0;
  l.forEach(x=>{const pac=pacientes.find(r=>r.id===x.pac);if(!pac)return;nuevoEnlace(pac,x.url,{tipo:x.tipo,fecha:x.fecha,nota:x.nota,nombre:x.nombre,origen:x.origen});n++;});
  if(n)guardar();if(enlRaiz&&enlConRaiz&&config.driveRaiz!==enlRaiz){config.driveRaiz=enlRaiz;guardarConfig();}
  impEstado="enl-fin";$('imgImp').innerHTML=`<div class="img-icab"><div><h3>✔ ${n} enlace${n===1?"":"s"} guardado${n===1?"":"s"}</h3><p>Cada estudio quedó en su paciente y se ve aquí mismo con un clic, también en los otros equipos.</p></div></div><div class="img-ipie"><span></span><button type="button" class="btn primary" data-i="fin">Listo</button></div>`;
  render(true);}
$('imgEnlazar').addEventListener('click',()=>{impEstado="enl";ENL=[];pintarEnl();$('imgImpModal').classList.add('abierto');setTimeout(()=>{const t=$('imgEnlTxt');if(t)t.focus();},50);});
$('imgImportar').addEventListener('click',abrirImp);
$('imgImpModal').addEventListener('click',e=>{if(e.target===$('imgImpModal')){cerrarImp();return;}const b=e.target.closest('[data-i]');if(!b)return;const a=b.dataset.i;
  if(a==="cerrar"||a==="fin"){impEstado="elegir";cerrarImp();}else if(a==="zip")$('imgImpZip').click();else if(a==="carpeta")$('imgImpCarpeta').click();else if(a==="arch")$('imgImpArch').click();
  else if(a==="otra"){impEstado="elegir";IMP=[];impPend=false;pintarImp();}else if(a==="subir"||a==="reintentar")subirTodo();
  else if(a==="drvLeer")leerDrive(($('imgDrvUrl')||{}).value);
  else if(a==="autoYa")revisarAuto(true);
  else if(a==="revPend"){const l=pendientes();impPend=true;preparar(l.map(d=>({ruta:d.ruta,f:{name:d.name,size:d.size,type:d.mime,drive:d.id}})));}
  else if(a==="omitir"){const ids=IMP.filter(x=>x.f&&x.f.drive&&!x.si&&!x.ya).map(x=>x.f.drive);if(!ids.length){msg("Todos están marcados");return;}
    const o=(config.driveAuto||{}).omitidos||[];config.driveAuto=Object.assign({},config.driveAuto||{},{omitidos:o.concat(ids.filter(i=>!o.includes(i))).slice(-3000)});guardarConfig();
    IMP=IMP.filter(x=>!(x.f&&ids.includes(x.f.drive)));pintarBadge();msg(`${ids.length} no se volverán a mostrar como nuevos`);if(!IMP.some(x=>x.f)){impEstado="elegir";impPend=false;}pintarImp();}
  else if(a==="drvClave"){const v=(($('imgDrvClave')||{}).value||"").trim();if(v&&!/^AIza[\w-]{30,}$/.test(v)){msg("La clave de API empieza con «AIza…»");return;}config.driveClave=v;guardarConfig();msg(v?"Clave guardada":"Se usará la clave del proyecto");leerDrive(($('imgDrvUrl')||{}).value);}
  else if(a==="enlRevisar")revisarEnl(($('imgEnlTxt')||{}).value);else if(a==="enlArch")$('imgEnlArch').click();else if(a==="enlOtra"){impEstado="enl";ENL=[];pintarEnl();}else if(a==="enlGuardar")guardarEnl();
  else if(a==="todos"){IMP.forEach(x=>{if(x.f&&x.pac&&!x.ya&&!x.dud)x.si=b.checked;});pintarImp();}});
$('imgImpModal').addEventListener('change',async e=>{const t=e.target;
  if(t.id==="imgEnlArch"){const f=t.files[0];t.value="";if(f)revisarEnl(await f.text());return;}
  if(t.dataset.i==="autoOn"){activarAuto(t.checked);return;}
  if(t.dataset.i==="conRaiz"){enlConRaiz=t.checked;pintarEnl();return;}
  if(impEstado==="enl-rev"){const tr=t.closest('tr[data-k]');if(!tr)return;const x=ENL[+tr.dataset.k];if(!x)return;const c=t.dataset.c;
    if(c==="si"){x.si=t.checked;if(t.checked)x.dud=false;}else if(c==="tipo")x.tipo=t.value;
    else if(c==="fecha"){if(fechaIsoValida(t.value))x.fecha=deIso(t.value);return;}
    else if(c==="pac"){x.pac=t.value;x.por=t.value?"mano":"";x.dud=false;x.ya=!!x.pac&&Object.values(imagenes).some(i=>i.url&&mismoDrive(i.url,x.url)&&i.pacId===x.pac);x.si=!!x.pac&&!x.ya;}
    pintarEnl();return;}
  if(t.id==="imgImpZip"){const fs=[...t.files];t.value="";if(!fs.length)return;impEstado="leyendo";pintarImp();try{await preparar(await leerZips(fs));}catch(x){impEstado="elegir";pintarImp();avisar("No se pudo abrir el ZIP",String(x&&x.message||x),"peligro");}return;}
  if(t.id==="imgImpCarpeta"||t.id==="imgImpArch"){const fs=[...t.files];t.value="";if(!fs.length)return;
    await preparar(fs.map(f=>({ruta:(f.webkitRelativePath||f.name).replace(/\\/g,"/"),f:EXT_MIME[extDe(f.name)]||/^image\/|application\/pdf/.test(f.type)?f:null})));return;}
  if(t.dataset.i==="tipoTodos"&&t.value){IMP.forEach(x=>{if(x.f)x.tipo=t.value;});pintarImp();return;}
  if(t.dataset.i==="soloSin"){$('imgImp').dataset.soloSin=t.checked?"1":"";pintarImp();return;}
  const tr=t.closest('tr[data-k]');if(!tr)return;const x=IMP[+tr.dataset.k];if(!x)return;const c=t.dataset.c;
  if(c==="si"){x.si=t.checked;if(t.checked)x.dud=false;}else if(c==="tipo")x.tipo=t.value;
  else if(c==="fecha"){if(fechaIsoValida(t.value))x.fecha=deIso(t.value);return;}
  else if(c==="pac"){x.pac=t.value;x.por=t.value?"mano":"";x.dud=false;x.ya=!!x.pac&&yaEsta(x.pac,x.f.name,x.f.size,x.ruta);x.si=!!x.pac&&!x.ya;}
  pintarImp();});
document.addEventListener('keydown',e=>{if(e.key==="Escape"&&$('imgImpModal').classList.contains('abierto'))cerrarImp();});
$('imgImpModal').addEventListener('keydown',e=>{if(e.key==="Enter"&&e.target.id==="imgDrvUrl"){e.preventDefault();leerDrive(e.target.value);}});

/* ======================= EVENTOS ======================= */
$('imgLista').addEventListener('click',e=>{const b=e.target.closest('[data-pac]');if(!b)return;sel=b.dataset.pac;editar=null;try{localStorage.setItem('pct_img_sel',sel);}catch(x){}render(true);
  if(window.innerWidth<900)$('imgPanel').scrollIntoView({behavior:"smooth",block:"start"});});
['imgBuscar','imgTipo','imgCon'].forEach(id=>$(id).addEventListener(id==='imgBuscar'?'input':'change',()=>{if(id==='imgBuscar')pintarLista();else render(true);}));
$('imgPanel').addEventListener('input',e=>{const t=e.target;if(t.id==='imgNNota')form.nota=t.value;});
$('imgPanel').addEventListener('change',e=>{const t=e.target;if(t.id==='imgNTipo')form.tipo=t.value;else if(t.id==='imgNFecha'){if(fechaIsoValida(t.value))form.fecha=t.value;}
  else if(t.id==='imgArch'||t.id==='imgCam'){subir(t.files);t.value="";}});
$('imgPanel').addEventListener('click',e=>{const a2=e.target.closest('[data-acc2="url"]');
  if(a2){const pac=pacientes.find(x=>x.id===sel),inp=$('imgNUrl'),m=URL_DRIVE.exec(inp&&inp.value||"");if(!pac)return;
    if(!m){msg("Pegue un enlace de Google Drive (https://drive.google.com/…)");return;}const url=m[0].replace(/[),.;]+$/,"");
    if(Object.values(imagenes).some(x=>x.pacId===pac.id&&x.url&&mismoDrive(x.url,url))){msg("Ese enlace ya está guardado");return;}
    nuevoEnlace(pac,url,/\/folders\//.test(url)?{nota:form.nota.trim()}:{tipo:form.tipo,fecha:deIso(form.fecha),nota:form.nota.trim()});form.nota="";guardar();render(true);msg("Enlace guardado");return;}
  const vc=e.target.closest('[data-vcarp]');if(vc){const x=imagenes[vc.dataset.vcarp];if(x)ver(x);return;}
  const ab=e.target.closest('[data-abrir]');if(ab){sel=ab.dataset.abrir;try{localStorage.setItem('pct_img_sel',sel);}catch(x){}render(true);return;}
  const b=e.target.closest('[data-acc]');if(!b)return;const card=b.closest('[data-id]'),x=card&&imagenes[card.dataset.id];if(!x)return;const a=b.dataset.acc;
  if(a==="ver")ver(x);else if(a==="traer")traerEnlace(x);else if(a==="bajar")bajar(x);else if(a==="borrar")borrar(x);else if(a==="editar"){editar=x.id;render(true);}else if(a==="cancelar"){editar=null;render(true);}
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
const alCfgBase=window.alCambiarConfig;window.alCambiarConfig=function(){if(alCfgBase)alCfgBase();render();}; // carpeta principal de Drive guardada en otro equipo
pintarBadge();
setTimeout(()=>revisarAuto(),20000); // después de que la nube trae los estudios y la configuración
setInterval(()=>{if(!document.hidden)revisarAuto();},5*60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>revisarAuto(),3000);});
window.IMG={render,_auto:f=>revisarAuto(f),estudiosDe,_detectar:r=>{PALP=pacientes.map(x=>({r:x,w:[...new Set(palabras(x.nom))]})).filter(x=>x.w.length);return detectar(r);},_fecha:fechaDe};
})();
