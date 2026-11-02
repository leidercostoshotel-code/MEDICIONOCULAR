/* PCT · Sincronización con Firestore (pacientes, atenciones HIS y configuración). Guardado local siempre; la nube cuando está configurada.
   Pocas lecturas y escrituras:
   · Cada equipo lee toda la colección solo la primera vez y luego una vez por semana (por seguridad). El resto del tiempo baja
     solo lo que cambió: cada documento lleva _t (hora del servidor de su último cambio) y se piden los de _t mayor al último visto.
   · Un borrado se guarda como marca {_del:true} para que los otros equipos se enteren sin volver a leer todo.
   · Solo se suben los documentos que cambiaron (se compara una huella de cada uno con la última versión sincronizada), 2 s después
     del último cambio; al salir de la app o cambiar de pestaña se sube lo pendiente. */
(function(){
  const cfg=window.FIREBASE_CONFIG||{},opt=Object.assign({requiereLogin:true,colPacientes:"pct_pacientes",colAtenciones:"pct_atenciones",colConfig:"pct_config"},window.APP_CONFIG||{});
  const st=document.getElementById('syncStatus'),lg=document.getElementById('login'),salir=document.getElementById('btnSalir');
  const estado=(t,c)=>{st.textContent=t;st.className='syncStatus '+(c||'');};
  // JSON con las claves ordenadas: Firestore devuelve los campos en orden alfabético y el navegador en el orden en que se crearon.
  const estable=o=>JSON.stringify(o,(k,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
  // ¿Se está escribiendo en un campo? Entonces la hoja no se redibuja (se perdería lo que se escribe); se redibuja al salir del campo.
  const editando=()=>{const a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!a.closest('#login'));};
  const S=window.Sync={programarPacientes(){},programarAtenciones(){},programarConfig(){},subirPendiente(){},entrar(e){e.preventDefault();},cerrarSesion(){}};
  if(!cfg.apiKey||/^PEGAR/.test(cfg.apiKey)){estado("Sin Firebase · guardado solo en este navegador","off");return;}
  if(typeof firebase==="undefined"){estado("No se pudo cargar Firebase · guardado local","err");return;}
  if(!firebase.apps.length)firebase.initializeApp(cfg);
  const db=firebase.firestore(),auth=firebase.auth(),FV=firebase.firestore.FieldValue,TS=firebase.firestore.Timestamp;
  try{db.enablePersistence({synchronizeTabs:true}).catch(()=>{});}catch(e){}
  const colPac=db.collection(opt.colPacientes),colAt=db.collection(opt.colAtenciones),docCfg=db.collection(opt.colConfig).doc('general');

  /* ======================= SINCRONIZACIÓN POR CAMBIOS ======================= */
  const SEMANA=7*864e5,MARGEN=10*60*1000,ESPERA=2000;
  const VACIO='_vacio'; // marca de «padrón vaciado» de la versión anterior: se ignora
  function huella(s){let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677);}
    a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);return (b>>>0).toString(36)+(a>>>0).toString(36);}
  const h=x=>huella(estable(x));
  const ms=t=>t&&typeof t.toMillis==="function"?t.toMillis():0;
  const sinMarcas=x=>{const o=Object.assign({},x);delete o._t;delete o._del;return o;};
  let escribiendo=0;
  // o.local() → {id: objeto} de este equipo · o.norm(id, datos) → objeto local desde la nube · o.aplicar({id: objeto|null}) mezcla los cambios y redibuja
  function coleccion(col,clave,o){
    const LS='sync_'+clave;let est=null; // {d: mayor _t visto (ms), f: última lectura completa (ms), h: {id: huella de lo último sincronizado}}
    try{const x=JSON.parse(localStorage.getItem(LS));if(x&&typeof x==="object"&&x.h&&typeof x.h==="object")est=x;}catch(e){}
    let tGuardar=null,tSubir=null,paro=null,activo=false;
    const guardarEst=()=>{clearTimeout(tGuardar);tGuardar=setTimeout(()=>{try{localStorage.setItem(LS,JSON.stringify(est));}catch(e){}},300);};
    async function subir(){tSubir=null;if(!activo||!est)return;const loc=o.local(),ops=[];
      for(const id in loc){const x=h(loc[id]);if(est.h[id]!==x){ops.push({id,antes:est.h[id],data:Object.assign(JSON.parse(estable(loc[id])),{_t:FV.serverTimestamp()})});est.h[id]=x;}}
      for(const id in est.h)if(!(id in loc)){ops.push({id,antes:est.h[id],data:{_del:true,_t:FV.serverTimestamp()}});delete est.h[id];}
      if(!ops.length)return;guardarEst();escribiendo++;estado("Guardando en la nube…");let fallo=false;
      for(let i=0;i<ops.length;i+=400){const lote=ops.slice(i,i+400);
        try{const b=db.batch();lote.forEach(x=>b.set(col.doc(x.id),x.data));await b.commit();}
        catch(e){console.error(e);fallo=true;estado("Error al guardar en la nube (se guardó local)","err"); // se vuelve a intentar en el próximo cambio
          lote.forEach(x=>{if(x.antes===undefined)delete est.h[x.id];else est.h[x.id]=x.antes;});guardarEst();}}
      escribiendo--;if(!fallo)estado("☁ Sincronizado","ok");}
    // Mezcla de 3 vías con la huella de lo último sincronizado: si un documento cambió en este equipo y aún no se sube, gana lo local.
    function recibir(docs,completa){const loc=o.local(),cambios={},vistos=new Set();let n=0;
      docs.forEach(({id,x})=>{vistos.add(id);const remoto=x&&!x._del?o.norm(id,sinMarcas(x)):null,hr=remoto?h(remoto):undefined,hl=id in loc?h(loc[id]):undefined;
        if(est.h[id]!==hl)return;                          // cambiado aquí y sin subir: se sube después
        if(hr===undefined)delete est.h[id];else est.h[id]=hr;
        if(hr!==hl){cambios[id]=remoto;n++;}});
      if(completa)for(const id in loc)if(!vistos.has(id)&&est.h[id]===h(loc[id])){cambios[id]=null;delete est.h[id];n++;} // ya no está en la nube
      if(completa)for(const id in est.h)if(!vistos.has(id)&&!(id in loc))delete est.h[id];
      guardarEst();if(n)o.aplicar(cambios);}
    async function completa(){let s;try{s=await col.get();}catch(e){console.error(e);estado("Sin permiso o sin conexión · guardado local","err");return false;}
      if(s.metadata&&s.metadata.fromCache)return false; // sin conexión: se intenta al reconectar
      const loc=o.local(),docs=[];let max=0;
      if(!est){est={d:0,f:0,h:{}};for(const id in loc)est.h[id]=h(loc[id]);} // primera vez en este equipo: manda la nube
      if(!s.size&&Object.keys(loc).length){est.h={};est.f=Date.now();guardarEst();subir();return true;} // nube vacía: se sube lo de este equipo
      s.forEach(d=>{if(d.id===VACIO)return;const x=d.data();max=Math.max(max,ms(x._t));docs.push({id:d.id,x});});
      est.d=Math.max(est.d||0,max);est.f=Date.now();recibir(docs,true);programar();return true;}
    function escucharCambios(){if(paro)paro();const desde=TS.fromMillis(Math.max(0,(est.d||0)-MARGEN));
      paro=col.where('_t','>',desde).onSnapshot(s=>{const docs=[];let max=est.d||0;
        s.docChanges().forEach(c=>{if(c.type==="removed"||c.doc.id===VACIO||(c.doc.metadata&&c.doc.metadata.hasPendingWrites))return; // lo propio aún sin confirmar se ignora
          const x=c.doc.data();max=Math.max(max,ms(x._t));docs.push({id:c.doc.id,x});});
        if(max>(est.d||0)){est.d=max;guardarEst();}if(docs.length)recibir(docs,false);
        if(!(s.metadata&&s.metadata.fromCache)&&!escribiendo)estado("☁ Sincronizado","ok");},
        e=>{console.error(e);estado("Sin permiso o sin conexión · guardado local","err");});}
    async function iniciar(){activo=true;
      if(!est||!est.f||Date.now()-est.f>SEMANA){const ok=await completa();if(!activo)return;
        if(!ok&&!est){window.addEventListener('online',()=>{if(activo)iniciar();},{once:true});return;}}
      escucharCambios();programar();} // programar: sube lo que quedó pendiente de la vez anterior (si no hay nada, no escribe)
    function parar(){activo=false;if(paro){paro();paro=null;}}
    function programar(){clearTimeout(tSubir);tSubir=setTimeout(subir,ESPERA);}
    function ya(){if(tSubir){clearTimeout(tSubir);subir();}}
    return {iniciar,parar,programar,ya};
  }

  /* ======================= PACIENTES ======================= */
  function focoActual(){const el=document.activeElement;const tr=el&&el.closest&&el.closest('#tbodyDatos tr');return tr?{id:tr.dataset.id,k:el.dataset.k,s:el.selectionStart}:null;}
  function restaurarFoco(f){if(!f)return;const el=document.querySelector(`#tbodyDatos tr[data-id="${f.id}"] [data-k="${f.k}"]`);if(el){el.focus();try{el.setSelectionRange(f.s,f.s);}catch(e){}}}
  const sPac=coleccion(colPac,opt.colPacientes,{
    local:()=>{const m={};pacientes.forEach(r=>{if(!r.id)r.id=uid();m[r.id]=r;});return m;},
    norm:(id,x)=>normalizar(Object.assign({},x,{id})),
    aplicar:c=>{const l=pacientes.map(r=>r.id in c?c[r.id]:r).filter(Boolean),ya=new Set(pacientes.map(r=>r.id));for(const id in c)if(c[id]&&!ya.has(id))l.push(c[id]);
      pacientes=l.sort((a,b)=>(parseInt(a.n)||1e9)-(parseInt(b.n)||1e9));try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){}
      const f=focoActual();renderDatos();restaurarFoco(f);if(window.alCambiarPacientes)alCambiarPacientes();}});

  /* ======================= ATENCIONES (REGISTRO HIS) ======================= */
  let atPend=false; // cambios de la nube que esperan a que se salga del campo para redibujar
  function recibirAt(obj){
    if(estable(obj)===estable(atenciones)){atPend=false;return;}
    if(editando()){ // los datos se actualizan ya (menos la sección donde se escribe) y la hoja se redibuja al salir del campo
      const b=document.activeElement.closest('.bloque[data-id]'),id=b&&b.dataset.id;if(id&&atenciones[id])obj[id]=atenciones[id];
      atenciones=obj;try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){}atPend=true;return;}
    atPend=false;atenciones=obj;try{localStorage.setItem(LS_AT,JSON.stringify(atenciones));}catch(e){}
    if(window.alCambiarAtenciones)alCambiarAtenciones();
  }
  document.addEventListener('focusout',()=>setTimeout(()=>{if(atPend&&!editando()){atPend=false;if(window.alCambiarAtenciones)alCambiarAtenciones();}},0));
  const sAt=coleccion(colAt,opt.colAtenciones,{
    local:()=>{const m={};for(const id in atenciones)m[id]=Object.assign({},atenciones[id],{id});return m;},
    norm:(id,x)=>Object.assign({},x,{id}),
    aplicar:c=>{const obj=Object.assign({},atenciones);for(const id in c){if(c[id])obj[id]=c[id];else delete obj[id];}recibirAt(obj);}});

  /* ======================= CONFIGURACIÓN (un solo documento) ======================= */
  let cacheCfg=null,tCfg=null,paroCfg=null;
  function subirConfig(){tCfg=null;const j=estable(config);if(j===cacheCfg)return;cacheCfg=j;escribiendo++;docCfg.set(config).then(()=>estado("☁ Sincronizado","ok")).catch(e=>{console.error(e);estado("Error al guardar en la nube (se guardó local)","err");}).finally(()=>escribiendo--);}
  function aplicarConfig(snap){
    if(!snap.exists){if(!snap.metadata.fromCache&&cacheCfg==null){cacheCfg="";subirConfig();}return;}
    const j=estable(snap.data());cacheCfg=j;
    if(snap.metadata.hasPendingWrites||tCfg||escribiendo)return;
    if(j===estable(config))return;
    config=Object.assign({},config,snap.data());try{localStorage.setItem(LS_CFG,JSON.stringify(config));}catch(e){}
    if(window.alCambiarConfig)alCambiarConfig();
  }

  S.programarPacientes=()=>sPac.programar();
  S.programarAtenciones=()=>sAt.programar();
  S.programarConfig=()=>{clearTimeout(tCfg);tCfg=setTimeout(subirConfig,1500);};
  S.subirPendiente=()=>{sPac.ya();sAt.ya();if(tCfg){clearTimeout(tCfg);subirConfig();}};
  // al salir de la app o cambiar de pestaña o de aplicación en el celular: subir lo pendiente sin esperar
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')S.subirPendiente();});
  window.addEventListener('pagehide',()=>S.subirPendiente());

  function escuchar(){parar();estado("Conectando…");sPac.iniciar();sAt.iniciar();
    paroCfg=docCfg.onSnapshot(aplicarConfig,e=>console.error(e));}
  function parar(){sPac.parar();sAt.parar();if(paroCfg){paroCfg();paroCfg=null;}}
  window.addEventListener('offline',()=>estado("Sin conexión · se guarda local y se sube al reconectar","off"));

  const ERR={"auth/invalid-email":"El correo no es válido","auth/user-not-found":"No existe un usuario con ese correo","auth/wrong-password":"Contraseña incorrecta","auth/invalid-credential":"Correo o contraseña incorrectos","auth/too-many-requests":"Demasiados intentos; espere unos minutos","auth/network-request-failed":"Sin conexión a internet","auth/user-disabled":"Usuario deshabilitado"};
  S.entrar=e=>{e.preventDefault();const err=document.getElementById('lgErr'),btn=document.getElementById('lgBtn');err.textContent="";
    const em=document.getElementById('lgEmail').value.trim(),pw=document.getElementById('lgPass').value;if(!em||!pw){err.textContent="Escriba su correo y contraseña";return;}
    btn.disabled=true;btn.textContent="Entrando…";
    auth.signInWithEmailAndPassword(em,pw).catch(x=>{err.textContent=(ERR[x.code]||"No se pudo iniciar sesión")+(x.code?" · "+x.code.replace("auth/",""):"");}).finally(()=>{btn.disabled=false;btn.textContent="Entrar";});};
  S.cerrarSesion=()=>auth.signOut(); // lo pendiente se sube al volver a entrar
  if(opt.requiereLogin){
    auth.onAuthStateChanged(u=>{lg.style.display=u?'none':'flex';document.body.classList.toggle('login-abierto',!u);salir.style.display=u?'':'none';if(u)escuchar();else{parar();estado("Inicie sesión para sincronizar","off");}});
  }else escuchar();
})();
