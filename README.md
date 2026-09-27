# Evaluación de Salud Ocular – Niñas y Niños

Aplicación web (HTML + JavaScript) para el padrón de pacientes y la hoja de evaluación ocular.
Los datos se guardan en el navegador y, si Firebase está configurado, también en **Firestore** (nube), sincronizados entre dispositivos y con soporte sin conexión.

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `public/index.html` | Página principal (19 líneas): solo carga los demás archivos |
| `public/estilos.css` | Estilos de la aplicación |
| `public/vista.js` | Estructura de la pantalla (padrón, hoja de evaluación, acceso) |
| `public/app.js` | Lógica: padrón, importar/exportar, hoja de evaluación, guardado local |
| `public/firebase-config.js` | Datos de conexión a su proyecto Firebase (**editar**) |
| `public/firebase-sync.js` | Sincronización con Firestore y pantalla de acceso |
| `firebase.json`, `.firebaserc` | Configuración de Firebase Hosting |
| `firestore.rules` | Reglas de seguridad: solo usuarios con sesión iniciada |
| `.github/workflows/deploy.yml` | Publicación automática al hacer push a `main` (opcional) |

## Paso 1 · Crear el proyecto en Firebase

1. Entre a <https://console.firebase.google.com> y cree un proyecto.
2. **Firestore Database** → Crear base de datos → modo producción → región cercana.
3. **Authentication** → Comenzar → habilite **Correo electrónico/contraseña**.
4. **Authentication → Usuarios → Agregar usuario**: cree el correo y contraseña con los que entrará al sistema.
5. **Configuración del proyecto → Tus apps → Web (`</>`)** → registre la app y copie el objeto `firebaseConfig`.

## Paso 2 · Pegar la configuración

Abra `public/firebase-config.js` y reemplace los valores `PEGAR_...` con los de su `firebaseConfig`.
En `.firebaserc` reemplace `PEGAR_PROYECTO` por el ID del proyecto.

## Paso 3 · Reglas de Firestore

En la consola: **Firestore → Reglas** → pegue el contenido de `firestore.rules` → Publicar.
(O se publican solas con `firebase deploy`.)

## Paso 4 · Publicar en Firebase Hosting

Opción A, desde su computadora (requiere Node.js):

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

Opción B, automático desde GitHub:

1. En la consola de Firebase: **Configuración → Cuentas de servicio → Generar nueva clave privada** (descarga un JSON).
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nombre `FIREBASE_SERVICE_ACCOUNT`, valor = todo el contenido del JSON.
3. Cada push a `main` publica la app en `https://medicion-ocular.web.app`.

## Cómo se guardan los datos

- Colección `pacientes`: un documento por fila del padrón (campos N°, DNI, apellidos, etc.).
- Colección `evaluaciones`: un documento por N° de paciente con los campos de la hoja.
- Si no hay internet, se guarda en el navegador y se sube al reconectar.
- La primera vez que la nube está vacía, se suben los datos que ya estaban en el navegador.

## Instalar en Android / generar APK

La app es una PWA (instalable, con ícono propio y funciona sin conexión). Hay dos formas de llevarla a Android:

**Opción rápida, sin APK**: en el celular abra <https://medicion-ocular.web.app> en Chrome, menú ⋮ → "Instalar aplicación" (o "Añadir a pantalla de inicio"). Queda como una app más, a pantalla completa.

**Opción con APK (para repartir el archivo)**, desde Cloud Shell:

```bash
npm install -g @bubblewrap/cli
mkdir -p ~/apk && cd ~/apk
bubblewrap init --manifest https://medicion-ocular.web.app/manifest.json
bubblewrap build
```

`bubblewrap init` pregunta si instala el JDK y el Android SDK (responda Y a ambos) y luego los datos de la app; se puede aceptar todo con Enter. Al final pide crear una clave de firma: anote la contraseña. `bubblewrap build` genera `app-release-signed.apk` (para instalar en celulares) y `app-release-bundle.aab` (para Google Play), y muestra la huella SHA-256 del certificado.

Para que la app abra a pantalla completa, sin la barra del navegador, copie esa huella en `public/.well-known/assetlinks.json` (reemplazando `PEGAR_SHA256`) y vuelva a publicar con `firebase deploy --only hosting`.

Para descargar la APK desde Cloud Shell: menú ⋮ de la terminal → "Descargar" → `apk/app-release-signed.apk`.
