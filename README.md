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
4. Comprobar: en la pestaña **Actions** del repositorio, cada fusión en `main` crea una ejecución «Publicar en Firebase (Hosting y reglas)». Con el secreto configurado, el paso «Publicar sitios (ocular y PCT) y reglas de Firestore» aparece en verde (no «skipped») y la app muestra el aviso de nueva versión. Ya no hace falta `firebase deploy` desde Cloud Shell.

## iPhone / iPad: pantalla quieta

En las dos apps (Salud Ocular y PCT), `vista.js` agrega `maximum-scale=1` al viewport **solo en iPhone / iPad**: Safari ya no acerca la página al tocar un campo con letra pequeña (antes quedaba acercada y se movía de lado). El zoom con dos dedos sigue funcionando; Android y PC no cambian. Las tablas usan el alto visible del celular (`100svh`, con `100vh` de respaldo) y la página no rebota (`overscroll-behavior: none`).

## REGISTRO HIS de salud ocular

Pestaña **REGISTRO HIS** de `https://medicion-ocular.web.app` (archivos `public/his.js` y `public/his.css`), con la misma mecánica que el Registro HIS de PCT y las fórmulas de la pestaña HIS de la plantilla Excel ocular:

- En cada sección se escribe el **N°** del paciente de DATOS (o se busca por nombre / DNI) y se llenan solos nombre, fecha de nacimiento, DNI, HC, edad, sexo, peso y talla.
- Por defecto cada sección lleva **1. Examen de los ojos y de la visión** (Z010, tipo D, VALOR LAB «ALT» si OD u OI ≥ 50, si no «N»; mismo criterio que la columna RESULTADO de DATOS) y **2. Determinación de la agudeza visual** (99173, tipo D, VALOR LAB = OD y OI). Esos valores se actualizan solos desde DATOS.
- En el predictivo de diagnósticos aparecen primero los códigos de salud ocular (Z010, 99173, H527 trastorno de la refracción con «RF» si OD u OI ≥ 50, 99401.16 consejería en salud ocular), luego los códigos propios y los 15 082 de CIE-10 (`public/cie10.json`).
- Igual que PCT: secciones de continuación (N° 0), orden de llegada, una hoja por turno con reloj y turno automático, 10 secciones por página en A4 vertical con encabezado completo solo en páginas impares, diálogos propios, códigos propios con búsqueda y edición, exportación a Excel.
- Se guarda en el navegador y en Firestore, colecciones `his_atenciones` y `his_config` (por eso hay que publicar también las reglas).

## Sistema PCT (Paciente con Tuberculosis)

Segunda aplicación del mismo proyecto Firebase, en la carpeta `pct/`, con la misma estructura que la de salud ocular: `index.html` de 19 líneas, `vista.js`, `app.js`, `estilos.css`, `firebase-sync.js`. Comparte los usuarios de acceso y usa las colecciones `pct_pacientes`, `pct_atenciones` y `pct_config` en Firestore.

- **DATOS**: padrón de pacientes (N° Reg, apellidos y nombres, HC, DNI, fecha de nacimiento, edad, sexo, diagnóstico, peso, talla, tratamiento). Importa/exporta CSV y Excel.
- **ATENCIÓN HIS**: registra una atención por paciente y fecha con los campos del formato HIS (financiador, distrito, etnia, centro poblado, edad, PC/PAB, peso, talla, Hb, establecimiento y servicio N/C/R) y hasta 3 diagnósticos con búsqueda predictiva sobre los 15 082 códigos CIE-10 (`pct/cie10.json`).
- **REGISTRO HIS**: arma el "Registro Diario de Atención y Otras Actividades de Salud" del mes (o de un día), con encabezado editable (establecimiento, UPS, responsable, digitador, lote), 5 pacientes por página en A4 horizontal, impresión y exportación a Excel.
- **TPT** (`pct/tpt.js`, `pct/tpt.css`): toma de DATOS la edad, el peso y el tratamiento de cada paciente y calcula solo la dosis según la **NTS N° 221-MINSA/DGIESP-2024** (`6873271-nts-para-la-prevencion-y-control-de-la-tb-2024.pdf`):
  - Contactos (tratamiento «con»): terapia preventiva según el caso índice: TB-DS → 3HP en mayores de 2 años (Tablas N° 3 y 4), 3HR en DFC dispersable en 2 años o menos (Tabla N° 5), con opción de 3HR monofármacos, 6H o 4R; TB-Hr → 4R (Tabla N° 6); TB-RR/MDR → 6Lfx (Tabla N° 7); pre-XDR/XDR → no indicada. Con H se agrega piridoxina 50 mg por dosis.
  - Esquema sensible (tratamiento «sensible»): 2HREZ/4HR (150 dosis, lunes a sábado) con tabletas DFC por peso (Tablas N° 11 y 12) y las variantes de la pág. 36 (miliar/SNC/osteoarticular: 2ª fase de 10 meses; TB no grave en niños: 2ª fase de 2 meses).
  - Con la fecha de inicio calcula la 12ª dosis semanal o el término (TPT), y el fin de la 1ª fase, el inicio de la 2ª y el término (esquema sensible). Peso, tratamiento y datos de TPT se guardan en el paciente (Firestore `pct_pacientes`). Exporta a Excel e imprime en A4 horizontal.
  - Junto a la fecha de inicio, el check **Conforme** confirma que el inicio ya se dio (guarda la fecha de conformidad).
- **MONITOREO** (`pct/monitoreo.js`, `pct/monitoreo.css`): calendario de seguimiento que empieza con la fecha de inicio puesta en TPT. Para cada paciente arma solo el estudio basal y los controles mensuales con los exámenes y evaluaciones de la NTS 221-2024: Tabla N° 13 (esquema sensible, pág. 37, con las variantes de 4 y 12 meses), Tabla N° 15 (TB-Hr, págs. 39–40), Tabla N° 16 (BPaLM/BPaL/BLC/modificado, pág. 43) y Tabla N° 17 (BLCC/XDR/modificado, págs. 44–45). Las citas que caen domingo o feriado nacional pasan al siguiente día hábil.
  - Vista de calendario del mes y agenda de 30 días, con encabezado de color que resume el periodo (citas, pacientes, realizadas, vencidas, fechas clave); al hacer clic en un día se ven los pacientes citados con sus exámenes agrupados (laboratorio, bacteriología, imágenes/ECG, evaluaciones), para marcarlos como realizados, reprogramar la cita o abrir el plan completo.
  - Estados: programado, próximo (7 días), hoy, vencido y realizado; resumen de citas de hoy, de la semana, vencidas, inicios sin conformidad y pacientes sin fecha de inicio.
  - Los indicadores de arriba (hoy, próximos 7 días, vencidos, programados, realizados, pacientes con plan, inicio sin conformidad y sin fecha de inicio) se pulsan para abrir su **lista**: cada fila muestra solo el DNI y el nombre; al hacer clic en el nombre se abre el detalle (datos, avance, exámenes realizados y los que faltan) con botones para marcar, reprogramar, ver el día en el calendario, dar la conformidad del inicio o escribir la fecha de inicio; cada lista se exporta a Excel o se imprime.
  - **Reprogramar citas**: botón «↪ Reprogramar» en cada cita (día, agenda, listas y plan) o «Reprogramar pendientes del día» cuando no alcanzó el tiempo. Ventana con fechas rápidas (siguiente día hábil, 2 días, 1 y 2 semanas) u otra fecha, aviso de domingo/feriado y de cuántos pacientes hay ese día, motivo y observación. Los exámenes ya hechos se conservan, el día anterior muestra «↪» hacia la nueva fecha, queda el historial de cambios (también en Excel), se puede volver a la fecha de la norma y hay una lista «Reprogramadas».
  - Plan completo por paciente (esquema de monitoreo editable en TB resistente), impresión del calendario (A4 horizontal) y del plan (A4 vertical), y exportación a Excel. Se guarda en el paciente (`mon_esq`, `mon`).

### Publicar PCT (una sola vez, crear el sitio)

1. Consola Firebase → **Hosting** → al final de la página "Agregar otro sitio" → ID del sitio: `pct-huascar` (queda en `https://pct-huascar.web.app`).
2. En Cloud Shell:

```bash
cd ~/MEDICIONOCULAR && git pull
firebase deploy --project medicion-ocular --only hosting:pct,firestore:rules
```

Para publicar solo la app ocular: `firebase deploy --project medicion-ocular --only hosting:ocular`. Para ambas: `firebase deploy --project medicion-ocular --only hosting,firestore:rules`.
