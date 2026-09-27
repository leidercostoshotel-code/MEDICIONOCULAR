// Genera public/version.json en cada publicación (predeploy de Firebase Hosting).
// La app compara este valor para avisar cuando hay una versión nueva.
const fs = require('fs');
const path = require('path');
const destino = path.join(__dirname, '..', 'public', 'version.json');
const datos = { v: Date.now(), fecha: new Date().toISOString() };
fs.writeFileSync(destino, JSON.stringify(datos));
console.log('version.json ->', datos.fecha);
