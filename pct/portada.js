/* PCT · Portada con video de bienvenida, debajo de la barra superior.
   · El video empieza solo, sin sonido y en bucle (los navegadores solo reproducen solos los videos sin sonido).
     «Escuchar» lo pasa desde el inicio con sonido y al terminar vuelve al bucle en silencio.
   · Se pausa cuando no se ve (al bajar en la página, otra pestaña del navegador o la pantalla de acceso).
   · «Ocultar» deja una franja para volver a mostrarla; se recuerda en este equipo.
   · Accesos con los números del padrón: pacientes, en tratamiento, contactos con TPT, citas de hoy y vencidos. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const LS="pct_portada";
const quieto=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); // el equipo pide menos movimiento: no empieza solo
let oculta=false;try{oculta=localStorage.getItem(LS)==="oculta";}catch(e){}
const svg=d=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const IC={play:svg("M8 5.5v13l10.5-6.5z"),pausa:svg("M7 5h3.6v14H7zm6.4 0H17v14h-3.6z"),x:svg("M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"),
  son:svg("M3 9v6h4l5 4V5L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"),
  mudo:svg("M3 9v6h4l5 4V5L7 9H3zm12.6.4L17 8l2.1 2.1L21.2 8l1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z")};

document.querySelector('.topbar').insertAdjacentHTML('afterend',`
<section class="hero no-print${oculta?' min':''}" id="hero" aria-label="Portada del Programa de Control de Tuberculosis">
  <div class="hero-in">
    <div class="hero-txt">
      <span class="hero-eti"><i></i>Prevención y control de la tuberculosis</span>
      <h2>Programa de Control de Tuberculosis</h2>
      <p><b id="heroEstab"></b>Padrón, REGISTRO HIS, terapia preventiva, monitoreo y anemia en un solo lugar, según la NTS N° 221-MINSA/DGIESP-2024.</p>
    </div>
    <div class="hero-kpi" id="heroKpi"></div>
    <div class="hero-media pausado" id="heroMedia">
      <video id="heroVideo" muted loop playsinline preload="metadata" poster="video/bienvenida.jpg" disablepictureinpicture aria-label="Video de bienvenida del programa">
        <source src="video/bienvenida.mp4" type='video/mp4; codecs="avc1.64001F, mp4a.40.2"'>
        <source src="video/bienvenida.webm" type='video/webm; codecs="vp9, opus"'>
      </video>
      <button type="button" class="hero-play" id="heroPlay" aria-label="Reproducir el video">${IC.play}</button>
      <div class="hero-ctl">
        <button type="button" id="heroSonido" title="Ver el video desde el inicio con sonido">${IC.son}<span class="txt">Escuchar</span></button>
        <button type="button" id="heroPausa" title="Pausar" aria-label="Pausar">${IC.pausa}</button>
        <button type="button" id="heroOcultar" class="hero-ocultar" title="Ocultar la portada (puede volver a mostrarla)">${IC.x}<span class="txt">Ocultar</span></button>
      </div>
      <div class="hero-barra" id="heroBarra"></div>
    </div>
  </div>
  <div class="hero-mini"><span>🎬 Programa de Control de Tuberculosis</span><button type="button" id="heroMostrar">${IC.play}Mostrar video de bienvenida</button></div>
</section>`);

/* ======================= VIDEO ======================= */
const hero=$('hero'),media=$('heroMedia'),v=$('heroVideo');
v.muted=true; // iPhone: el video sin sonido puede empezar solo
let quiere=!quieto,visible=true; // quiere = el usuario no lo ha pausado
function pintar(){const p=v.paused;media.classList.toggle('pausado',p);
  $('heroPausa').innerHTML=p?IC.play:IC.pausa;$('heroPausa').title=p?"Reproducir":"Pausar";$('heroPausa').setAttribute('aria-label',$('heroPausa').title);
  const son=!v.muted;$('heroSonido').classList.toggle('on',son);$('heroSonido').innerHTML=son?IC.mudo+'<span class="txt">Silenciar</span>':IC.son+'<span class="txt">Escuchar</span>';
  $('heroSonido').title=son?"Quitar el sonido":"Ver el video desde el inicio con sonido";}
function reproducir(){const p=v.play();if(p&&p.catch)p.catch(()=>{if(!v.muted){v.muted=true;v.loop=true;const q=v.play();if(q&&q.catch)q.catch(()=>{});}pintar();});}
function evaluar(){const debe=quiere&&visible&&!oculta&&!document.hidden&&!document.body.classList.contains('login-abierto');
  if(debe&&v.paused)reproducir();else if(!debe&&!v.paused)v.pause();pintar();}
['play','pause','volumechange'].forEach(t=>v.addEventListener(t,pintar));
v.addEventListener('timeupdate',()=>{if(v.duration)$('heroBarra').style.width=(v.currentTime/v.duration*100)+"%";});
v.addEventListener('ended',()=>{v.muted=true;v.loop=true;v.currentTime=0;evaluar();}); // terminó con sonido: vuelve al bucle en silencio
$('heroPlay').onclick=()=>{quiere=true;evaluar();};
$('heroPausa').onclick=()=>{quiere=v.paused;if(quiere)evaluar();else{v.pause();pintar();}};
$('heroSonido').onclick=()=>{if(v.muted){v.muted=false;v.loop=false;v.currentTime=0;quiere=true;reproducir();}else{v.muted=true;v.loop=true;}pintar();};
function guardar(){try{localStorage.setItem(LS,oculta?"oculta":"visible");}catch(e){}}
$('heroOcultar').onclick=()=>{oculta=true;hero.classList.add('min');v.muted=true;v.loop=true;guardar();evaluar();};
$('heroMostrar').onclick=()=>{oculta=false;hero.classList.remove('min');quiere=true;guardar();evaluar();};
if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;evaluar();},{threshold:.2}).observe(media);
document.addEventListener('visibilitychange',evaluar);
new MutationObserver(evaluar).observe(document.body,{attributes:true,attributeFilter:['class']}); // pantalla de acceso abierta o cerrada

/* ======================= ACCESOS CON LOS NÚMEROS DEL PADRÓN ======================= */
const ir={datos:()=>showView('datos'),tto:()=>{$('tptFiltro').value="todos";showView('tpt');},con:()=>{$('tptFiltro').value="tpt";showView('tpt');},
  hoy:()=>MON.verLista('hoy'),venc:()=>MON.verLista('venc')};
function kpis(){if(typeof pacientes==="undefined")return;let tto=0,con=0;
  if(window.TPT)pacientes.forEach(r=>{const m=TPT.modoDe(r);if(m==="sens"||m==="otro")tto++;else if(m==="tpt")con++;});
  const c=window.MON&&MON.contar?MON.contar():null,pl=(n,s,p)=>n===1?s:p;
  const l=[["datos",pacientes.length,pl(pacientes.length,"paciente en el padrón","pacientes en el padrón"),"Ver el padrón (DATOS)"],
    ["tto",tto,"en tratamiento","Ver esquemas y dosis (TPT)"],["con",con,pl(con,"contacto con TPT","contactos con TPT"),"Ver los contactos con terapia preventiva (TPT)"]];
  if(c){l.push(["hoy",c.hoy,pl(c.hoy,"cita pendiente hoy","citas pendientes hoy"),"Ver las citas de hoy (MONITOREO)"]);if(c.venc)l.push(["venc",c.venc,pl(c.venc,"control vencido","controles vencidos"),"Ver los controles vencidos (MONITOREO)","alerta"]);}
  $('heroKpi').innerHTML=l.map(([k,n,t,ti,cls])=>`<button type="button" data-ir="${k}" class="${cls||""}" title="${ti}"><b>${n}</b><span>${t}</span></button>`).join("");
  $('heroEstab').textContent=config.estab?config.estab+" · ":"";}
$('heroKpi').addEventListener('click',e=>{const b=e.target.closest('[data-ir]');if(b&&ir[b.dataset.ir])ir[b.dataset.ir]();});
const showBase=window.showView;window.showView=function(x){showBase(x);kpis();};
const pacBase=window.alCambiarPacientes;window.alCambiarPacientes=function(){if(pacBase)pacBase();kpis();};
const cfgBase=window.alCambiarConfig;window.alCambiarConfig=function(){if(cfgBase)cfgBase();kpis();};
setInterval(kpis,60000); // las citas de hoy cambian con la hora y al marcar en MONITOREO
kpis();evaluar();
})();
