/* PCT · Portada con video de fondo, como las portadas de Leitime: el video ocupa todo el ancho del recuadro y el texto va encima,
   a la izquierda, sobre un degradado oscuro. Solo video (sin audio) y sin botones: corre solo cuando se ve y con la pestaña activa
   (iPhone en bajo consumo: arranca con el primer toque). Uso diario: completa la primera vez del día y luego compacta (sin la
   descripción; video, título y accesos siguen); se recuerda en el equipo. Accesos con los números del padrón. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const CLAVE="pct:portada",hoy=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
let compacta=false;try{compacta=localStorage.getItem(CLAVE)===hoy();localStorage.removeItem("pct_portada");}catch(e){}
const ICONO=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3zm-1 5h2v4h4v2h-4v4h-2v-4H7v-2h4V7z"/></svg>`;

document.querySelector('.topbar').insertAdjacentHTML('afterend',`
<section class="hero no-print${compacta?' compacta':''}" id="hero" aria-label="Programa de Control de Tuberculosis">
  <video class="hero-video" id="heroVideo" muted playsinline loop preload="metadata" poster="video/bienvenida.jpg" disablepictureinpicture aria-hidden="true">
    <source src="video/bienvenida.mp4" type='video/mp4; codecs="avc1.64001F"'>
    <source src="video/bienvenida.webm" type='video/webm; codecs="vp9"'>
  </video>
  <div class="hero-sombra"></div>
  <div class="hero-txt">
    <span class="hero-eti">${ICONO}<span>Prevención y control de la tuberculosis</span></span>
    <h2>Programa de Control de Tuberculosis</h2>
    <p><b id="heroEstab"></b>Padrón, REGISTRO HIS, terapia preventiva, monitoreo y anemia en un solo lugar, según la NTS N° 221-MINSA/DGIESP-2024.</p>
    <div class="hero-kpi" id="heroKpi"></div>
  </div>
</section>`);

/* ======================= VIDEO DE FONDO ======================= */
const v=$('heroVideo');
v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('webkit-playsinline',''); // iPhone: Safari no siempre lo toma del HTML
let visible=!('IntersectionObserver' in window),bloqueado=false;
const acceso=()=>document.body.classList.contains('login-abierto');
const vista=()=>{if(acceso())return;try{localStorage.setItem(CLAVE,hoy());}catch(e){}}; // vista hoy: la próxima vez sale compacta
const toque=()=>{if(!bloqueado)return;bloqueado=false;sync();};
function sync(){if(!visible||document.hidden||acceso()){v.pause();return;}
  const p=v.play();if(p&&p.catch)p.catch(e=>{if(!e||e.name!=="NotAllowedError")return;bloqueado=true;document.addEventListener('pointerdown',toque,{once:true,passive:true});});}
if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)vista();sync();},{threshold:.25}).observe(v);
else vista();
document.addEventListener('visibilitychange',sync);
new MutationObserver(()=>{if(visible)vista();sync();}).observe(document.body,{attributes:true,attributeFilter:['class']}); // pantalla de acceso abierta o cerrada

/* ======================= ACCESOS CON LOS NÚMEROS DEL PADRÓN ======================= */
const ir={datos:()=>showView('datos'),tto:()=>{$('tptFiltro').value="todos";showView('tpt');},con:()=>{$('tptFiltro').value="tpt";showView('tpt');},
  hoy:()=>MON.verLista('hoy'),venc:()=>MON.verLista('venc')};
function kpis(){if(typeof pacientes==="undefined")return;let tto=0,con=0;
  if(window.TPT)pacientes.forEach(r=>{const m=TPT.modoDe(r);if(m==="sens"||m==="otro")tto++;else if(m==="tpt")con++;});
  const c=window.MON&&MON.contar?MON.contar():null,pl=(n,s,p)=>n===1?s:p;
  const l=[["datos",pacientes.length,pl(pacientes.length,"paciente","pacientes"),"Ver el padrón (DATOS)"],
    ["tto",tto,"en tratamiento","Ver esquemas y dosis (TPT)"],["con",con,pl(con,"contacto con TPT","contactos con TPT"),"Ver los contactos con terapia preventiva (TPT)"]];
  if(c){l.push(["hoy",c.hoy,pl(c.hoy,"cita hoy","citas hoy"),"Ver las citas pendientes de hoy (MONITOREO)"]);if(c.venc)l.push(["venc",c.venc,pl(c.venc,"vencido","vencidos"),"Ver los controles vencidos (MONITOREO)","alerta"]);}
  $('heroKpi').innerHTML=l.map(([k,n,t,ti,cls])=>`<button type="button" data-ir="${k}" class="${cls||""}" title="${ti}"><b>${n}</b>${t}</button>`).join("");
  $('heroEstab').textContent=config.estab?config.estab+" · ":"";}
$('heroKpi').addEventListener('click',e=>{const b=e.target.closest('[data-ir]');if(b&&ir[b.dataset.ir])ir[b.dataset.ir]();});
const showBase=window.showView;window.showView=function(x){showBase(x);kpis();};
const pacBase=window.alCambiarPacientes;window.alCambiarPacientes=function(){if(pacBase)pacBase();kpis();};
const cfgBase=window.alCambiarConfig;window.alCambiarConfig=function(){if(cfgBase)cfgBase();kpis();};
setInterval(kpis,60000); // las citas de hoy cambian con la hora y al marcar en MONITOREO
kpis();sync();
})();
