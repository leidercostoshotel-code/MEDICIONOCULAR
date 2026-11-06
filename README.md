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

## Firebase: pocas lecturas y escrituras

Las dos apps (`public/firebase-sync.js` y `pct/firebase-sync.js`) sincronizan **por cambios**, para gastar poco del cupo diario de Firestore (plan gratuito: 50 000 lecturas y 20 000 escrituras al día):

- **Lecturas**: cada equipo lee todas las colecciones solo la primera vez y luego una vez por semana (por seguridad). Al volver a abrir la app solo baja lo que cambió desde la última vez. Cada documento lleva `_t`, la hora del servidor de su último cambio, y se piden los de `_t` mayor al último visto. En las pruebas con 119 pacientes y 1 500 atenciones, volver a abrir PCT pasó de 1 620 lecturas a 3; en Salud Ocular, de 1 418 a 4.
- **Escrituras**: solo se suben los documentos que cambiaron. Se compara una huella de cada uno con la última versión sincronizada, guardada en el navegador (`sync_<colección>`). Además se espera 2 s después del último cambio, en lugar de 0.3 a 0.6 s. Al salir de la app o cambiar de pestaña se sube lo pendiente sin esperar. Escribir una palabra en DATOS, en una evaluación o en la hoja HIS pasó de 3 a 5 escrituras a 1.
- **Borrados**: se guardan como marca `{_del:true}` en lugar de borrar el documento, para que los otros equipos se enteren sin leer todo otra vez.
- **Conflictos**: si un documento cambió en este equipo y aún no se subió, gana lo de este equipo; lo demás se mezcla con lo que llega de la nube.
- **Primera vez en un equipo**: manda la nube. Si la nube está vacía, se sube lo del equipo.
- Los cambios hechos a mano en la consola de Firebase no llevan `_t`: los equipos los ven en la lectura semanal.

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

- **DIAGNÓSTICO POR IMAGEN** (`pct/imagenes.js`, `pct/imagenes.css`): estudios de cada paciente (radiografía y tomografía de tórax, ecografía, informe de imagen u otro) en **PDF o foto**, con tipo, fecha y resultado o nota. La lista de pacientes es la de DATOS: un paciente nuevo o un nombre cambiado aparece solo, porque cada estudio queda unido al paciente por su id (no por el nombre). Se arrastran los archivos o se eligen («📷 Tomar foto» en celular y tableta). Las fotos se achican antes de subir (lado mayor 2200 px, JPG; un PNG de 2.8 MB queda en unos 160 KB) y los PDF aceptan hasta 30 MB. Cada estudio se ve (visor de foto con zoom o PDF), se descarga, se edita o se elimina; los de pacientes borrados del padrón quedan en «Estudios sin paciente en DATOS».
  - **«📥 Traer de Drive»**: guarda en la app, de una vez, los PDF y fotos de muchos pacientes, que quedan como los subidos a mano y se ven sin entrar a Drive.
    - **Directo con el enlace, sin descargar nada:** se pega el enlace de la carpeta (por ejemplo «RX TORAX 2026», compartida como «Cualquier persona con el enlace»). La app la lee en el navegador con la **API de Google Drive** (`drive/v3/files`, solo lectura, con la clave de API del proyecto o con `config.driveClave`), recorre todas sus subcarpetas (hasta 600 carpetas y 4000 archivos), arma la lista para revisar y, al guardar, baja cada archivo (`alt=media`) y lo guarda como un estudio más, con `gid` (id de Drive) para no traerlo dos veces. Si ese archivo estaba enlazado, el enlace se quita.
    - **Activación, una sola vez:** en Google Cloud del proyecto de Firebase hay que **habilitar Google Drive API**. Si la clave del proyecto no puede usarla, se crea una clave de API restringida a Google Drive API y a `pct-huascar.web.app/*` y se pega en el diálogo. La app muestra estos pasos con los enlaces cuando Drive responde que falta.
    - **🔄 Automático, solo lo nuevo**: se enciende solo cuando ya hay una carpeta leída (`config.driveRaiz`) y se puede apagar en el diálogo. Así funciona:
      - **Cuándo revisa:** en los equipos con la app abierta y con sesión iniciada, a los 20 segundos de abrir la app, cada 30 minutos y al volver a la pestaña. El plan gratuito de Firebase no tiene un servidor que lo haga solo, así que se pone al día la próxima vez que alguien abre la app.
      - **Qué cuenta como nuevo:** lo creado en Drive después de activarlo (`config.driveAuto.desde`). Lo que se reconoce con seguridad se guarda solo, con id `d_<id de Drive>`, así que dos equipos no lo duplican.
      - **Lo que no se reconoce o es dudoso:** queda «por revisar», con un número en el botón «📥 Traer de Drive». Se vuelve a intentar en cada revisión, de modo que si se registra al paciente en DATOS sus estudios llegan solos. En la revisión, «🙈 No volver a mostrar» deja de contarlos como nuevos.
      - **Consultas a Drive:** la primera vez (y cada semana) recorre toda la carpeta y guarda el mapa de carpetas en el equipo (`pct_drive_auto`). Después hace una consulta por cada 40 carpetas (`'id' in parents … and createdTime > fecha`); las carpetas nuevas, por ejemplo de un paciente nuevo, se recorren completas.
      - **Estudios borrados:** si se borra en la app un estudio traído de Drive, su id pasa a `config.driveAuto.omitidos` y el automático no lo vuelve a traer.
      - **Archivos movidos:** un archivo movido (no subido) dentro de la carpeta conserva su fecha de creación, así que no cuenta como nuevo; se trae con «Leer la carpeta».
    - Las tarjetas de enlace tienen «⬇ Guardar en la app» (un archivo) o «⬇ Guardar sus estudios» (toda la carpeta).
    - Las carpetas de contactos (CONTACTOS, EVALUACION DE CONTACTOS, I / II / III EVALUACION, también con errores de tipeo) nunca se asignan al caso índice. Un archivo de un contacto va al contacto solo si su nombre o el de su carpeta coincide con alguien de DATOS.
    - **También con el ZIP:** en Google Drive se descarga la carpeta, que Drive baja como **ZIP**. En la app se elige ese ZIP (se lee con JSZip, que se carga solo al usarlo), la carpeta descomprimida o varios archivos. Cada archivo se asigna al paciente de DATOS por el DNI que tenga en la ruta, por el nombre del archivo o por el nombre de su carpeta (de adentro hacia afuera). La comparación tolera errores de tipeo (también letras cambiadas de lugar, como ALRACON/ALARCON), otro orden de las palabras y nombres incompletos. Las fechas escritas con el mes («16 JULIO 2026», «OCTUBRE 2026») se quitan enteras antes de comparar, pero un mes suelto se respeta porque puede ser un nombre (Julio, Abril). Si solo coinciden dos palabras y a cada lado sobra otra (dos hermanos con los mismos apellidos) o hay otro paciente igual de parecido, se sugiere **«por confirmar»** sin marcar, y el usuario lo marca o elige otro. Lo que está en una carpeta **CONTACTOS** no se asigna al caso índice. La fecha sale del nombre (16-10-26, 24-10-2026, 2026-05-03, 16 JULIO 2026) y el tipo de sus palabras (por defecto, radiografía de tórax). Antes de subir se revisa una lista: paciente, fecha y tipo por archivo y «tipo para todos». Lo ya importado no se repite, porque se compara la ruta de origen (`origen`) y el tamaño original (`otam`), y la tarjeta muestra la carpeta de donde vino.
  - **Enlaces de Google Drive, sin descargar ni subir nada, vistos dentro de la app**: cada PDF o foto de Drive queda como una tarjeta igual a las demás (miniatura de Drive, tipo, fecha y carpeta de origen). Con «👁 Ver» se abre en el visor de la app con el visor de Drive incrustado (`/file/d/ID/preview`), sin ir a Drive. Una carpeta se ve igual (`embeddedfolderview`), y la cabecera del paciente tiene «📂 Ver su carpeta de Drive». Si no tiene nada enlazado, aparece «🔍 Buscar en Google Drive» (abre Drive buscando sus dos apellidos). Debajo de la zona de subida se pega el enlace de un estudio o de su carpeta («Guardar enlace»). **«🔗 Enlazar con Drive»** guarda de una vez los enlaces de muchos estudios: se pega una lista o se elige un `.txt`, con una línea por archivo o carpeta (`GRUPO / PACIENTE / archivo.pdf <tab> enlace`). Las líneas sin enlace de Drive o que empiezan con `#` se ignoran. El paciente se reconoce igual que al importar; la fecha y el tipo salen del nombre del archivo; se revisa en una tabla (paciente, tipo y fecha). Una línea `CARPETA PRINCIPAL … enlace` guarda la carpeta raíz en la configuración (`config.driveRaiz`) y aparece en la barra como «📂 Carpeta en Drive». Cada enlace queda en `pct_imagenes` con `url`, `mime:"enlace"`, `dm` (`pdf`, `img` o `dir`) y `origen`, sin partes en `pct_archivos`, y se sincroniza con los demás equipos. Un mismo archivo no se repite aunque su dirección venga escrita de otra forma, porque se compara el id de Drive. Quitarlo no borra nada en Drive. Solo se usan direcciones de Google Drive armadas con el id. Para verse sin iniciar sesión en Google, la carpeta debe estar compartida como «Cualquier persona con el enlace»; si no, quien lo abra necesita acceso con su cuenta.
  - **Nube sin pagar Firebase Storage** (que pide el plan Blaze): los datos de cada estudio van en `pct_imagenes` y se sincronizan por cambios, como los pacientes. El archivo va en `pct_archivos`, partido en documentos de 900 KB (`{id}_0`, `{id}_1`…) más su miniatura (`{id}_t`), y se escribe antes que sus datos, así que ningún equipo ve un estudio sin archivo.
  - **Pocas lecturas**: los archivos se bajan solo al abrir el paciente (miniatura, 1 lectura) o el estudio (1 lectura por cada 900 KB) y quedan guardados en el equipo (IndexedDB): la segunda vez no se lee la nube. Sin conexión la subida queda en cola y se completa al reconectar. Sin Firebase se guarda solo en el equipo.
  - El plan gratuito de Firestore tiene 1 GiB de almacenamiento; con fotos de unos 200 KB caben miles de estudios.
  - Reglas: `pct_imagenes` y `pct_archivos` solo con sesión iniciada (`firestore.rules`). Otros módulos pueden registrar colecciones en la sincronización con `window.SYNC_EXTRA` y usar `Sync.nube()` y `Sync.programar(colección)`.
- **Portada con video de fondo** (`pct/portada.js`, `pct/portada.css`, `pct/video/`), como las portadas de Leitime: debajo de la barra roja, un recuadro horizontal con el video de fondo (solo imagen, sin audio) que se funde con el lado oscuro de la izquierda, donde van el título del programa, el establecimiento y los accesos con los números del padrón (pacientes, en tratamiento, contactos con TPT, citas de hoy y vencidos, que abren DATOS, TPT o la lista de MONITOREO). Sin botones: el video corre solo cuando se ve y con la pestaña activa (en iPhone con bajo consumo, con el primer toque). Uso diario: completa (270 px) la primera vez del día y luego compacta (118 px, sin la descripción), recordado en el equipo (`pct:portada`); en el celular sigue a su contenido con el degradado de abajo hacia arriba. Video MP4 (H.264) con respaldo WebM (VP9), 960×540, e imagen `bienvenida.jpg` mientras carga; el service worker no guarda el video. No sale al imprimir.
- **DATOS**: padrón de pacientes (N° Reg, apellidos y nombres, HC, DNI, fecha de nacimiento, edad, sexo, diagnóstico, peso, talla, tratamiento). Importa/exporta CSV y Excel.
- **ATENCIÓN HIS**: registra una atención por paciente y fecha con los campos del formato HIS (financiador, distrito, etnia, centro poblado, edad, PC/PAB, peso, talla, Hb, establecimiento y servicio N/C/R) y hasta 3 diagnósticos con búsqueda predictiva sobre los 15 082 códigos CIE-10 (`pct/cie10.json`).
- **REGISTRO HIS**: arma el "Registro Diario de Atención y Otras Actividades de Salud" del mes (o de un día), con encabezado editable (establecimiento, UPS, responsable, digitador, lote), 5 pacientes por página en A4 horizontal, impresión y exportación a Excel.
- **TPT** (`pct/tpt.js`, `pct/tpt.css`): toma de DATOS la edad, el peso y el tratamiento de cada paciente y calcula solo la dosis según la **NTS N° 221-MINSA/DGIESP-2024** (`6873271-nts-para-la-prevencion-y-control-de-la-tb-2024.pdf`):
  - Contactos (tratamiento «con»): terapia preventiva según el caso índice: TB-DS → 3HP en mayores de 2 años (Tablas N° 3 y 4), 3HR en DFC dispersable en 2 años o menos (Tabla N° 5), con opción de 3HR monofármacos, 6H o 4R; TB-Hr → 4R (Tabla N° 6); TB-RR/MDR → 6Lfx (Tabla N° 7); pre-XDR/XDR → no indicada. Con H se agrega piridoxina 50 mg por dosis.
  - Esquema sensible (tratamiento «sensible»): 2HREZ/4HR (150 dosis, lunes a sábado) con tabletas DFC por peso (Tablas N° 11 y 12) y las variantes de la pág. 36 (miliar/SNC/osteoarticular: 2ª fase de 10 meses; TB no grave en niños: 2ª fase de 2 meses).
  - Con la fecha de inicio calcula la 12ª dosis semanal o el término (TPT), y el fin de la 1ª fase, el inicio de la 2ª y el término (esquema sensible). Peso, tratamiento y datos de TPT se guardan en el paciente (Firestore `pct_pacientes`). Exporta a Excel e imprime en A4 horizontal.
  - Junto a la fecha de inicio, el check **Conforme** confirma que el inicio ya se dio (guarda la fecha de conformidad).
- **DATOS › Importar CSV/Excel**: la fila de encabezados se busca entre las 10 primeras (se saltan títulos como «REGISTRO CONSOLIDADO…»). Reconoce, además de las columnas de siempre, **N° Caso** (45/2026, 47-26, CA-3242; un esquema como «H-P-B6» no se toma como caso), **Fecha de Inicio** (→ inicio del tratamiento para TPT y MONITOREO), **Dirección** y la columna mixta **Esquema / Diagnóstico** («TPT (H-P-B6)» → tratamiento «con» y observación; «TB MDR (BPALM)» → diagnóstico Resistente y tratamiento «MDR (BPALM)»; «TB Sensible» / «TB Pulmonar» / «TB Pleural» → «sensible» con su localización; «XFX», «Diario» → sin tratamiento, con el texto en la observación TPT). Limpia «No especificada», «S/N», «0.0» y «44.0». Si el archivo no trae N° de registro, al reemplazar el padrón se numera 1, 2, 3… en el orden del archivo. El padrón tiene ahora las columnas **N° Caso** y **Dirección** (también en el Excel/CSV exportado).
- **DATOS › Orden**: las listas de DATOS, TPT y ANEMIA (y el Excel/CSV de DATOS) se ordenan por **inicio de tratamiento, los más antiguos primero** (sin fecha al final, por N°); también por N° de registro o por apellidos (`config.orden`, se recuerda). «Renumerar según este orden» asigna N° 1, 2, 3… en el orden visible y actualiza el N° en las atenciones HIS de cada paciente (pide confirmación).
- **DATOS › «🗑 Vaciar padrón»**: borra todos los pacientes (con sus datos de TPT y MONITOREO) en el equipo y en la nube, para importar una data nueva. Pide escribir BORRAR y ofrece «Descargar Excel y vaciar». Las atenciones del REGISTRO HIS se conservan. Un padrón vaciado queda vacío al recargar (el Excel original solo se carga la primera vez). En la nube cada paciente queda como marca de borrado, así que ningún otro equipo vuelve a subir su copia local. El documento `_vacio` de la versión anterior se ignora.
- **MONITOREO** (`pct/monitoreo.js`, `pct/monitoreo.css`): calendario de seguimiento que empieza con la fecha de inicio puesta en TPT. Para cada paciente arma solo el estudio basal y los controles mensuales con los exámenes y evaluaciones de la NTS 221-2024: Tabla N° 13 (esquema sensible, pág. 37, con las variantes de 4 y 12 meses), Tabla N° 15 (TB-Hr, págs. 39–40), Tabla N° 16 (BPaLM/BPaL/BLC/modificado, pág. 43) y Tabla N° 17 (BLCC/XDR/modificado, págs. 44–45). Las citas que caen domingo o feriado nacional pasan al siguiente día hábil.
  - Vista de calendario del mes y agenda de 30 días, con encabezado de color que resume el periodo (citas, pacientes, realizadas, vencidas, fechas clave); al hacer clic en un día se ven los pacientes citados con sus exámenes agrupados (laboratorio, bacteriología, imágenes/ECG, evaluaciones), para marcarlos como realizados, reprogramar la cita o abrir el plan completo.
  - Estados: programado, próximo (7 días), hoy, vencido y realizado; resumen de citas de hoy, de la semana, vencidas, inicios sin conformidad y pacientes sin fecha de inicio.
  - Los indicadores de arriba (hoy, próximos 7 días, vencidos, programados, realizados, pacientes con plan, inicio sin conformidad y sin fecha de inicio) se pulsan para abrir su **lista**: cada fila muestra solo el DNI y el nombre; al hacer clic en el nombre se abre el detalle (datos, avance, exámenes realizados y los que faltan) con botones para marcar, reprogramar, ver el día en el calendario, dar la conformidad del inicio o escribir la fecha de inicio; cada lista se exporta a Excel o se imprime.
  - **Reprogramar citas**: botón «↪ Reprogramar» en cada cita (día, agenda, listas y plan) o «Reprogramar pendientes del día» cuando no alcanzó el tiempo. Ventana con fechas rápidas (siguiente día hábil, 2 días, 1 y 2 semanas) u otra fecha, aviso de domingo/feriado y de cuántos pacientes hay ese día, motivo y observación. Los exámenes ya hechos se conservan, el día anterior muestra «↪» hacia la nueva fecha, queda el historial de cambios (también en Excel), se puede volver a la fecha de la norma y hay una lista «Reprogramadas».
  - Plan completo por paciente (esquema de monitoreo editable en TB resistente), impresión del calendario (A4 horizontal) y del plan (A4 vertical), y exportación a Excel. Se guarda en el paciente (`mon_esq`, `mon`).
  - **Contactos con TPT** (tratamiento «con»): en el calendario **no van las tomas de la TPT** (se registran en la tarjeta de control de TPT, Anexo N° 6). Después de iniciar la TPT el contacto aparece con 🩺 (verde azulado) en sus **chequeos**, según el control de contactos de la NTS 221-2024 (pág. 24: examen integral; contactos de TB-DS al inicio, al cambio de fase y al término del tratamiento del caso índice; de TB-DR al inicio y cada 3 meses). El control del inicio es el de la indicación de la TPT; los chequeos se cuentan desde el inicio de la TPT y pasan al siguiente día hábil: caso índice TB sensible → 2 y 6 meses; TB-Hr → 3 y 6 meses; TB-RR/MDR → 3, 6 y 9 meses. Cada chequeo: examen integral, descarte de TB activa (tos, fiebre, baja de peso, sudoración nocturna) y peso; mientras dura la TPT, «¿Cómo va la TPT?» (dosis recibidas según la tarjeta y reacciones adversas); en el primero después del término, el resultado de la TPT. Se marcan, reprograman y salen en las listas, el Excel y el plan completo (cid `tc1`, `tc2`… en `mon`); en la pestaña TPT el enlace «🩺 Chequeos del contacto» abre el plan. Los contactos de TB pre-XDR/XDR no tienen plan (TPT no indicada) y los que no tienen fecha de inicio salen en «Sin fecha de inicio».

- **ANEMIA** (`pct/anemia.js`, `pct/anemia.css`): diagnóstico y tratamiento de la anemia por deficiencia de hierro según la NTS N° 213-MINSA/DGIESP-2024 (RM 251-2024 y RM 429-2024/MINSA; puntos de corte de la OMS 2024 por edad, sexo y gestación, con ajuste por altitud configurable en msnm). Hb inicial (o la última del REGISTRO HIS con un clic) → anemia leve / moderada / severa, dosis de hierro (niños 3 mg/kg/día, adolescentes y adultos 120 mg/día, gestantes + ácido fólico) y, con la fecha de inicio, **6 controles mensuales** (entrega del hierro y adherencia; dosaje de Hb al mes 1, 3 y 6) que entran al calendario de **MONITOREO** con 🩸 (cid `a1`…`a6`, marcas en `mon`) y se marcan o reprograman allí. Hb de control → respuesta (al mes debe subir ≥ 1 g/dL) y «Anemia corregida» al final. Excel e impresión. La norma no incluye varones adultos: se aplica la dosis de adultos. Datos en `ane` del paciente; altitud en `config.msnm`.
- **TPT › TB resistente u otro**: la celda «Dosis según peso y edad» tiene un campo para escribir los medicamentos y dosis que indica el médico consultor (Tabla N° 10); se guarda en `tto_med`, sale en el Excel y en el plan de MONITOREO, y ayuda a elegir el esquema de monitoreo (BPaLM / BLC…).

### Publicar PCT (una sola vez, crear el sitio)

1. Consola Firebase → **Hosting** → al final de la página "Agregar otro sitio" → ID del sitio: `pct-huascar` (queda en `https://pct-huascar.web.app`).
2. En Cloud Shell:

```bash
cd ~/MEDICIONOCULAR && git pull
firebase deploy --project medicion-ocular --only hosting:pct,firestore:rules
```

Para publicar solo la app ocular: `firebase deploy --project medicion-ocular --only hosting:ocular`. Para ambas: `firebase deploy --project medicion-ocular --only hosting,firestore:rules`.
