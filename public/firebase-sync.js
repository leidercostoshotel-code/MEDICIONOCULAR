/* Sincronización con Firestore (pacientes y evaluaciones). Guardado local siempre; la nube cuando está configurada. */
(function(){
  const cfg=window.FIREBASE_CONFIG||{},opt=Object.assign({requiereLogin:true},window.APP_CONFIG||{});
  const st=document.getElementById('syncStatus'),lg=document.getElementById('login'),salir=document.getElementById('btnSalir');
  const estado=(t,c)=>{st.textContent=t;st.className='syncStatus '+(c||'');};
  const S=window.Sync={programarPacientes(){},programarEvaluaciones(){},entrar(e){e.preventDefault();},cerrarSesion(){}};
  if(!cfg.apiKey||/^PEGAR/.test(cfg.apiKey)){estado("Sin Firebase · guardado solo en este navegador","off");return;}
  if(typeof firebase==="undefined"){estado("No se pudo cargar Firebase · guardado local","err");return;}
  firebase.initializeApp(cfg);
  const db=firebase.firestore(),auth=firebase.auth();
  try{db.enablePersistence({synchronizeTabs:true}).catch(()=>{});}catch(e){}
  const colPac=db.collection('pacientes'),colEval=db.collection('evaluaciones');
  let cachePac={},cacheEval={},tPac=null,tEval=null,escribiendo=0,paros=[],semilla=false;

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
  function subirPacientes(){tPac=null;const a={};pacientes.forEach(r=>{if(!r.id)r.id=uid();a[r.id]=JSON.stringify(r);});return reconciliar(colPac,cachePac,a);}
  function subirEvaluaciones(){tEval=null;const a={};for(const n in evaluaciones)a[String(n)]=JSON.stringify({n:parseInt(n),campos:evaluaciones[n]});return reconciliar(colEval,cacheEval,a);}
  S.programarPacientes=()=>{clearTimeout(tPac);tPac=setTimeout(subirPacientes,600);};
  S.programarEvaluaciones=()=>{clearTimeout(tEval);tEval=setTimeout(subirEvaluaciones,300);};

  function focoActual(){const el=document.activeElement;const tr=el&&el.closest&&el.closest('#tbodyDatos tr');return tr?{id:tr.dataset.id,k:el.dataset.k,s:el.selectionStart}:null;}
  function restaurarFoco(f){if(!f)return;const el=document.querySelector(`#tbodyDatos tr[data-id="${f.id}"] [data-k="${f.k}"]`);if(el){el.focus();try{el.setSelectionRange(f.s,f.s);}catch(e){}}}
  function aplicarPacientes(snap){
    const remoto={};snap.forEach(d=>{remoto[d.id]=JSON.stringify(normalizar(Object.assign({},d.data(),{id:d.id})));});
    if(!snap.metadata.fromCache&&!semilla){semilla=true;if(!snap.size&&pacientes.length){cachePac={};subirPacientes();return;}}
    cachePac=remoto;
    if(snap.metadata.hasPendingWrites||tPac||escribiendo)return;
    const lista=Object.values(remoto).map(j=>JSON.parse(j)).sort((a,b)=>(parseInt(a.n)||1e9)-(parseInt(b.n)||1e9));
    if(JSON.stringify(lista)===JSON.stringify(pacientes))return;
    pacientes=lista;try{localStorage.setItem(LS_PAC,JSON.stringify(pacientes));}catch(e){}
    const f=focoActual();renderDatos();restaurarFoco(f);
    if(document.getElementById('evaluacion').classList.contains('active'))setAutos(buscarPaciente(numActual));
  }
  function aplicarEvaluaciones(snap){
    const remoto={},obj={};snap.forEach(d=>{const v=d.data();obj[d.id]=v.campos||{};remoto[d.id]=JSON.stringify({n:parseInt(d.id),campos:obj[d.id]});});
    if(!snap.metadata.fromCache&&!snap.size&&Object.keys(evaluaciones).length&&!Object.keys(cacheEval).length){subirEvaluaciones();return;}
    cacheEval=remoto;
    if(snap.metadata.hasPendingWrites||tEval||escribiendo)return;
    const antes=numActual!=null?JSON.stringify(evaluaciones[numActual]||null):null;
    evaluaciones=obj;try{localStorage.setItem(LS_EVAL,JSON.stringify(evaluaciones));}catch(e){}
    const ahora=numActual!=null?JSON.stringify(evaluaciones[numActual]||null):null;
    if(numActual!=null&&antes!==ahora&&JSON.stringify(leerForm())===antes)cargarPaciente(numActual);
  }
  function escuchar(){
    parar();estado("Conectando…");
    paros.push(colPac.onSnapshot({includeMetadataChanges:true},s=>{aplicarPacientes(s);if(!s.metadata.fromCache&&!s.metadata.hasPendingWrites)estado("☁ Sincronizado","ok");},e=>{console.error(e);estado("Sin permiso o sin conexión · guardado local","err");}));
    paros.push(colEval.onSnapshot({includeMetadataChanges:true},aplicarEvaluaciones,e=>console.error(e)));
  }
  function parar(){paros.forEach(f=>f());paros=[];}
  window.addEventListener('offline',()=>estado("Sin conexión · se guarda local y se sube al reconectar","off"));

  const ERR={"auth/invalid-email":"El correo no es válido","auth/user-not-found":"No existe un usuario con ese correo","auth/wrong-password":"Contraseña incorrecta","auth/invalid-credential":"Correo o contraseña incorrectos","auth/too-many-requests":"Demasiados intentos; espere unos minutos","auth/network-request-failed":"Sin conexión a internet","auth/user-disabled":"Usuario deshabilitado"};
  S.entrar=e=>{e.preventDefault();const err=document.getElementById('lgErr'),btn=document.getElementById('lgBtn');err.textContent="";
    const em=document.getElementById('lgEmail').value.trim(),pw=document.getElementById('lgPass').value;if(!em||!pw){err.textContent="Escriba su correo y contraseña";return;}
    btn.disabled=true;btn.textContent="Entrando…";
    auth.signInWithEmailAndPassword(em,pw).catch(x=>{err.textContent=ERR[x.code]||"No se pudo iniciar sesión";}).finally(()=>{btn.disabled=false;btn.textContent="Entrar";});};
  S.cerrarSesion=()=>auth.signOut();
  if(opt.requiereLogin){
    auth.onAuthStateChanged(u=>{lg.style.display=u?'none':'flex';salir.style.display=u?'':'none';if(u)escuchar();else{parar();estado("Inicie sesión para sincronizar","off");}});
  }else escuchar();
})();
