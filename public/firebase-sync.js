/* Sincronización con Firestore (pacientes, evaluaciones y REGISTRO HIS). Guardado local siempre; la nube cuando está configurada. */
(function(){
  const cfg=window.FIREBASE_CONFIG||{},opt=Object.assign({requiereLogin:true},window.APP_CONFIG||{});
  const st=document.getElementById('syncStatus'),lg=document.getElementById('login'),salir=document.getElementById('btnSalir');
  const estado=(t,c)=>{st.textContent=t;st.className='syncStatus '+(c||'');};
  // JSON con las claves ordenadas: Firestore devuelve los campos en orden alfabético y el navegador en el orden en que se crearon.
  // Sin esto cada guardado parecía un cambio: se volvía a subir todo y la hoja HIS se redibujaba mientras se escribía.
  const estable=o=>JSON.stringify(o,(k,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
  // ¿Se está escribiendo en un campo? Entonces la hoja no se redibuja (se perdería lo que se escribe); se redibuja al salir del campo.
  const editando=()=>{const a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!a.closest('#login'));};
  const S=window.Sync={programarPacientes(){},programarEvaluaciones(){},programarAtenciones(){},programarConfig(){},subirPendiente(){},entrar(e){e.preventDefault();},cerrarSesion(){}};
  if(!cfg.apiKey||/^PEGAR/.test(cfg.apiKey)){estado("Sin Firebase · guardado solo en este navegador","off");return;}
  if(typeof firebase==="undefined"){estado("No se pudo cargar Firebase · guardado local","err");return;}
  firebase.initializeApp(cfg);
  const db=firebase.firestore(),auth=firebase.auth();
  try{db.enablePersistence({synchronizeTabs:true}).catch(()=>{});}catch(e){}
  const colPac=db.collection('pacientes'),colEval=db.collection('evaluaciones'),colAt=db.collection('his_atenciones'),docCfg=db.collection('his_config').doc('general');
  let cachePac={},cacheEval={},cacheAt={},cacheCfg=null,tPac=null,tEval=null,tAt=null,tCfg=null,escribiendo=0,paros=[],semilla=false,semillaAt=false;

  async function ejecutar(col,ops){ // ops: {id,data} para guardar, {id,del:true} para borrar; lotes de 400
    for(let i=0;i<ops.length;i+=400){const b=db.batch();ops.slice(i,i+400).forEach(o=>o.del?b.delete(col.doc(o.id)):b.set(col.doc(o.id),o.data));await b.commit();}
  }
  function reconciliar(col,cache,actual){
    const ops=[];for(const id in actual)if(cache[id]!==actual[id])ops.push({id,data:JSON.parse(actual[id])});
    for(const id in cache)if(!(id in actual))ops.push({id,del:true});
    ops.forEach(o=>{if(o.del)delete cache[o.id];else cache[o.id]=actual[o.id];});
    if(!ops.length)return Promise.resolve();
    escribiendo++;estado("Guardando en la nube…");
    return ejecutar(col,ops).then(()=>estado("☁ Sincronizado","ok")).catch(e=>{console.error(e);estado("Error al guardar en la nube (se guardó local)","err");}).finally(()=>escribiendo--);
  }
  function subirPacientes(){tPac=null;const a={};pacientes.forEach(r=>{if(!r.id)r.id=uid();a[r.id]=estable(r);});return reconciliar(colPac,cachePac,a);}
  function subirEvaluaciones(){tEval=null;const a={};for(const n in evaluaciones)a[String(n)]=estable({n:parseInt(n),campos:evaluaciones[n]});return reconciliar(colEval,cacheEval,a);}
  // REGISTRO HIS (his.js): atenciones y configuración de la hoja
  const H=()=>window.HIS;
  function subirAtenciones(){tAt=null;if(!H())return;const at=H().atenciones(),a={};for(const id in at)a[id]=estable(Object.assign({},at[id],{id}));return reconciliar(colAt,cacheAt,a);}
  function subirConfig(){tCfg=null;if(!H())return;const c=H().config(),j=estable(c);if(j===cacheCfg)return;cacheCfg=j;escribiendo++;docCfg.set(c).then(()=>estado("☁ Sincronizado","ok")).catch(e=>{console.error(e);estado("Error al guardar en la nube (se guardó local)","err");}).finally(()=>escribiendo--);}
  S.programarAtenciones=()=>{clearTimeout(tAt);tAt=setTimeout(subirAtenciones,300);};
  S.programarConfig=()=>{clearTimeout(tCfg);tCfg=setTimeout(subirConfig,600);};
  S.programarPacientes=()=>{clearTimeout(tPac);tPac=setTimeout(subirPacientes,600);};
  S.programarEvaluaciones=()=>{clearTimeout(tEval);tEval=setTimeout(subirEvaluaciones,300);};
  S.subirPendiente=()=>{if(tEval){clearTimeout(tEval);subirEvaluaciones();}if(tPac){clearTimeout(tPac);subirPacientes();}};

  function focoActual(){const el=document.activeElement;const tr=el&&el.closest&&el.closest('#tbodyDatos tr');return tr?{id:tr.dataset.id,k:el.dataset.k,s:el.selectionStart}:null;}
  function restaurarFoco(f){if(!f)return;const el=document.querySelector(`#tbodyDatos tr[data-id="${f.id}"] [data-k="${f.k}"]`);if(el){el.focus();try{el.setSelectionRange(f.s,f.s);}catch(e){}}}
  function aplicarPacientes(snap){
    const remoto={};snap.forEach(d=>{remoto[d.id]=estable(normalizar(Object.assign({},d.data(),{id:d.id})));});
    if(!snap.metadata.fromCache&&!semilla){semilla=true;if(!snap.size&&pacientes.length){cachePac={};subirPacientes();return;}}
    cachePac=remoto;
    if(snap.metadata.hasPendingWrites||tPac||escribiendo)return;
    const lista=Object.values(remoto).map(j=>JSON.parse(j)).sort((a,b)=>(parseInt(a.n)||1e9)-(parseInt(b.n)||1e9));
    if(estable(lista)===estable(pacientes))return;
    pacientes=lista;try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){}
    const f=focoActual();renderDatos();restaurarFoco(f);
    if(document.getElementById('evaluacion').classList.contains('active'))setAutos(buscarPaciente(numActual));
    if(H())H().alCambiarPacientes();
  }
  function aplicarAtenciones(snap){
    if(!H())return;const remoto={},obj={};snap.forEach(d=>{obj[d.id]=Object.assign({},d.data(),{id:d.id});remoto[d.id]=estable(obj[d.id]);});
    if(!snap.metadata.fromCache&&!semillaAt){semillaAt=true;if(!snap.size&&Object.keys(H().atenciones()).length){cacheAt={};subirAtenciones();return;}}
    cacheAt=remoto;
    if(snap.metadata.hasPendingWrites||tAt||escribiendo)return;
    recibirAt(obj);
  }
  let atPend=false; // cambios de la nube que esperan a que se salga del campo para redibujar el REGISTRO HIS
  function recibirAt(obj){const at=H().atenciones();
    if(estable(obj)===estable(at)){atPend=false;return;}
    if(editando()){ // los datos se actualizan ya (menos la sección donde se escribe) y la hoja se redibuja al salir del campo
      const b=document.activeElement.closest('.bloque[data-id]'),id=b&&b.dataset.id;if(id&&at[id])obj[id]=at[id];
      H().recibirAtenciones(obj,true);atPend=true;return;}
    atPend=false;H().recibirAtenciones(obj);
  }
  document.addEventListener('focusout',()=>setTimeout(()=>{if(atPend&&!editando()&&H()){atPend=false;H().repintar();}},0));
  function aplicarConfig(snap){
    if(!H())return;
    if(!snap.exists){if(!snap.metadata.fromCache&&cacheCfg==null){cacheCfg="";subirConfig();}return;}
    const j=estable(snap.data());cacheCfg=j;
    if(snap.metadata.hasPendingWrites||tCfg||escribiendo)return;
    if(j===estable(H().config()))return;
    H().recibirConfig(snap.data());
  }
  function aplicarEvaluaciones(snap){
    const remoto={},obj={};snap.forEach(d=>{const v=d.data();obj[d.id]=v.campos||{};remoto[d.id]=estable({n:parseInt(d.id),campos:obj[d.id]});});
    if(!snap.metadata.fromCache&&!snap.size&&Object.keys(evaluaciones).length&&!Object.keys(cacheEval).length){subirEvaluaciones();return;}
    cacheEval=remoto;
    if(snap.metadata.hasPendingWrites||tEval||escribiendo)return;
    const antes=numActual!=null?estable(evaluaciones[numActual]||null):null;
    evaluaciones=obj;if(window.migrarCodigos)migrarCodigos(evaluaciones);try{localStorage.setItem(LS_EVAL,JSON.stringify(evaluaciones));}catch(e){}
    const ahora=numActual!=null?estable(evaluaciones[numActual]||null):null;
    if(numActual!=null&&antes!==ahora&&estable(leerForm())===antes)cargarPaciente(numActual);
  }
  function escuchar(){
    parar();estado("Conectando…");
    paros.push(colPac.onSnapshot({includeMetadataChanges:true},s=>{aplicarPacientes(s);if(!s.metadata.fromCache&&!s.metadata.hasPendingWrites)estado("☁ Sincronizado","ok");},e=>{console.error(e);estado("Sin permiso o sin conexión · guardado local","err");}));
    paros.push(colEval.onSnapshot({includeMetadataChanges:true},aplicarEvaluaciones,e=>console.error(e)));
    paros.push(colAt.onSnapshot({includeMetadataChanges:true},aplicarAtenciones,e=>console.error(e)));
    paros.push(docCfg.onSnapshot({includeMetadataChanges:true},aplicarConfig,e=>console.error(e)));
  }
  function parar(){paros.forEach(f=>f());paros=[];}
  window.addEventListener('offline',()=>estado("Sin conexión · se guarda local y se sube al reconectar","off"));

  const ERR={"auth/invalid-email":"El correo no es válido","auth/user-not-found":"No existe un usuario con ese correo","auth/wrong-password":"Contraseña incorrecta","auth/invalid-credential":"Correo o contraseña incorrectos","auth/too-many-requests":"Demasiados intentos; espere unos minutos","auth/network-request-failed":"Sin conexión a internet","auth/user-disabled":"Usuario deshabilitado"};
  S.entrar=e=>{e.preventDefault();const err=document.getElementById('lgErr'),btn=document.getElementById('lgBtn');err.textContent="";
    const em=document.getElementById('lgEmail').value.trim(),pw=document.getElementById('lgPass').value;if(!em||!pw){err.textContent="Escriba su correo y contraseña";return;}
    btn.disabled=true;btn.textContent="Entrando…";
    auth.signInWithEmailAndPassword(em,pw).catch(x=>{err.textContent=(ERR[x.code]||"No se pudo iniciar sesión")+(x.code?" · "+x.code.replace("auth/",""):"");}).finally(()=>{btn.disabled=false;btn.textContent="Entrar";});};
  S.cerrarSesion=()=>auth.signOut();
  if(opt.requiereLogin){
    auth.onAuthStateChanged(u=>{lg.style.display=u?'none':'flex';document.body.classList.toggle('login-abierto',!u);salir.style.display=u?'':'none';if(u)escuchar();else{parar();estado("Inicie sesión para sincronizar","off");}});
  }else escuchar();
})();
