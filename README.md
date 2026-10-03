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
| `.github/workflows/deploy.yml` | Publicación automática (sitios y reglas) al fusionar en `main` (requiere el secreto `FIREBASE_SERVICE_ACCOUNT`) |

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

Opción B, automático desde GitHub (publicación automática):

Se configura una sola vez. Después, cada vez que se fusiona un cambio en `main`, GitHub publica los dos sitios (`medicion-ocular.web.app` y `pct-huascar.web.app`) y las reglas de Firestore.

1. En Cloud Shell, crear una cuenta de servicio con permiso de administrador de Firebase y su clave:

```bash
gcloud iam service-accounts create github-publicar --project medicion-ocular --display-name "Publicar desde GitHub"
gcloud projects add-iam-policy-binding medicion-ocular --member "serviceAccount:github-publicar@medicion-ocular.iam.gserviceaccount.com" --role roles/firebase.admin
gcloud iam service-accounts keys create clave.json --iam-account github-publicar@medicion-ocular.iam.gserviceaccount.com
cat clave.json
```

2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nombre `FIREBASE_SERVICE_ACCOUNT`, valor = todo el contenido de `clave.json`.
3. Borrar la clave de Cloud Shell: `rm clave.json`. No la pegue en chats ni la suba al repositorio.

## REGISTRO HIS de salud ocular

Pestaña **REGISTRO HIS** de `https://medicion-ocular.web.app` (archivos `public/his.js` y `public/his.css`), con la misma mecánica que el Registro HIS de PCT y las fórmulas de la pestaña HIS de la plantilla Excel ocular:

- En cada sección se escribe el **N°** del paciente de DATOS (o se busca por nombre / DNI) y se llenan solos nombre, fecha de nacimiento, DNI, HC, edad, sexo, peso y talla.
- Por defecto cada sección lleva **1. Examen de los ojos y de la visión** (Z010, tipo D, VALOR LAB «ALT» si OD u OI > 35, si no «N») y **2. Determinación de la agudeza visual** (99173, tipo D, VALOR LAB = OD y OI). Esos valores se actualizan solos desde DATOS.
- En el predictivo de diagnósticos aparecen primero los códigos de salud ocular (Z010, 99173, H527 trastorno de la refracción con «RF» si OD u OI ≥ 50, 9940116 consejería en salud ocular), luego los códigos propios y los 15 082 de CIE-10 (`public/cie10.json`).
- Igual que PCT: secciones de continuación (N° 0), orden de llegada, una hoja por turno con reloj y turno automático, 10 secciones por página en A4 vertical con encabezado completo solo en páginas impares, diálogos propios, códigos propios con búsqueda y edición, exportación a Excel.
- Se guarda en el navegador y en Firestore, colecciones `his_atenciones` y `his_config` (por eso hay que publicar también las reglas).

## Sistema PCT (Paciente con Tuberculosis)

Segunda aplicación del mismo proyecto Firebase, en la carpeta `pct/`, con la misma estructura que la de salud ocular: `index.html` de 19 líneas, `vista.js`, `app.js`, `estilos.css`, `firebase-sync.js`. Comparte los usuarios de acceso y usa las colecciones `pct_pacientes`, `pct_atenciones` y `pct_config` en Firestore.

- **DATOS**: padrón de pacientes (N° Reg, apellidos y nombres, HC, DNI, fecha de nacimiento, edad, sexo, diagnóstico, peso, talla, tratamiento). Importa/exporta CSV y Excel.
- **ATENCIÓN HIS**: registra una atención por paciente y fecha con los campos del formato HIS (financiador, distrito, etnia, centro poblado, edad, PC/PAB, peso, talla, Hb, establecimiento y servicio N/C/R) y hasta 3 diagnósticos con búsqueda predictiva sobre los 15 082 códigos CIE-10 (`pct/cie10.json`).
- **REGISTRO HIS**: arma el "Registro Diario de Atención y Otras Actividades de Salud" del mes (o de un día), con encabezado editable (establecimiento, UPS, responsable, digitador, lote), 5 pacientes por página en A4 horizontal, impresión y exportación a Excel.

### Publicar PCT (una sola vez, crear el sitio)

1. Consola Firebase → **Hosting** → al final de la página "Agregar otro sitio" → ID del sitio: `pct-huascar` (queda en `https://pct-huascar.web.app`).
2. En Cloud Shell:

```bash
cd ~/MEDICIONOCULAR && git pull
firebase deploy --project medicion-ocular --only hosting:pct,firestore:rules
```

Para publicar solo la app ocular: `firebase deploy --project medicion-ocular --only hosting:ocular`. Para ambas: `firebase deploy --project medicion-ocular --only hosting,firestore:rules`.
