/* Service worker: permite instalar la app y abrirla sin conexión.
   Archivos propios: primero red, si falla usa la copia guardada. Librerías externas: copia guardada y actualización en segundo plano. */
const CACHE='salud-ocular-v1';
const PROPIOS=['/','/index.html','/estilos.css','/vista.js','/app.js','/firebase-config.js','/firebase-sync.js','/favicon.svg','/img/fondo.svg','/manifest.json','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PROPIOS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET')return;
  if(u.origin===location.origin){ // red primero, respaldo en caché
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))));
  }else if(/gstatic\.com\/firebasejs|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host+u.pathname)){ // librerías: caché primero
    e.respondWith(caches.match(e.request).then(r=>{const red=fetch(e.request).then(x=>{const cp=x.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return x;}).catch(()=>r);return r||red;}));
  }
});
