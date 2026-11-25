# 📖 DOCUMENTACIÓN DE PictoAmigos

> **Para humanos y para IAs.** Este documento es el **índice de secciones** de la app.
> Cada sección tiene un **NOMBRE PROPIO** para que puedas dar indicaciones precisas,
> por ejemplo: *«En la sección **DATOS-NIVELES** añade el nivel "Mascotas"»*.

---

## Cómo pedir un cambio (plantilla)

Copia y pega esta plantilla en cualquier IA:

```
Proyecto: PictoAmigos (app de pictogramas para niños autistas)
Documentación: lee /docs/DOCUMENTACION.md

CAMBIOS PEDIDOS:
1. [NOMBRE DE SECCIÓN] → qué cambiar, añadir o quitar.
2. ...

REGLAS A RESPETAR:
- No romper: tarjetas con esquinas redondeadas, sonido al tocar cada pictograma,
  fondos claros y simples, sin parpadeos ni colores chillones.
- Si tocas un fichero con caché (sw.js), subir CACHE_VERSION.
- No editar imágenes de ARASAAC; solo sus IDs.
```

---

## 🗂 Mapa de secciones

| NOMBRE DE SECCIÓN | Fichero | Qué controla |
|---|---|---|
| **NÚCLEO-HTML** | `index.html` | Estructura base: cabecera, área de pantalla, avisos y orden de los `<script>`. |
| **SISTEMA-DISEÑO** | `css/styles.css` | Todo el aspecto visual: colores, tarjetas redondeadas, tipografía, animaciones, móvil/tablet/PC, accesibilidad. |
| **DATOS-PICTOGRAMAS** | `js/data/pictos.js` | Relación `palabra → ID de pictograma ARASAAC` (153 palabras, todas verificadas). |
| **DATOS-NIVELES** | `js/data/niveles.js` | Los niveles del HOME (Familia, Necesidades, Colores, Formas, Números, Animales, Comidas, Emociones, Ropa, Escuela) y sus palabras. |
| **DATOS-FRASES** | `js/data/frases.js` | Las 12 frases de 3–4 palabras de la sección «Formar Frases». |
| **DATOS-CUERPO-Y-SEGURIDAD** | `js/data/cuerpo.js` | ⚠ **Sección restringida, desactivada por defecto**: Mi cuerpo · Higiene · Público y privado · Límites y seguridad · Pubertad. |
| **SONIDOS-LOCALES** | `js/data/sonidos.js` | Mapa `texto → MP3 incluido` (195 audios). Se genera solo; **no editar a mano**. |
| **GENERADOR-DE-AUDIOS** | `tools/generar-audios.py` | Script que regenera los MP3 de voz (Piper TTS, con espeak-ng de respaldo). |
| **REVISIÓN-DE-IMÁGENES** | `tools/revision-cuerpo.py` | Genera la página para que un adulto revise los pictogramas de la sección restringida. |
| **EMPACADO-TAURI** | `src-tauri/` + `tools/preparar-dist.mjs` | Versión de escritorio/móvil (Tauri v2) que no depende de un navegador. |
| **MOTOR-DE-VOZ** | `js/audio.js` | Todo el sonido: voz incluida (MP3) y voz del dispositivo (Web Speech API), velocidad, campanita. **En la app de escritorio (Tauri) usa solo los MP3** por `EN_ESCRITORIO`, para evitar bloqueos de WebKitGTK. |
| **COMPONENTES-UI** | `js/ui.js` | Tarjetas, botones, imágenes con respaldo, avisos y barajado. |
| **GESTOS-NAVEGACION** | `js/gestos.js` | Deslizar (izquierda/derecha/borde), ratón y teclado. |
| **PANTALLAS** | `js/screens.js` | Contenido y lógica de las 4 pantallas (ver subsecciones abajo). |
| **MICRÓFONO-PRACTICA** | `js/mic.js` | Práctica de pronunciación: comparador de voz, motor del navegador y motor offline (Vosk). Códigos de error: `sin-permiso`, `sin-voz`, `tiempo`, `red`, `sin-motor`, `modelo-no-encontrado`, `modelo-fallo`, `sin-biblioteca`, `sin-modelo`. |
| **CONTROLADOR-PRINCIPAL** | `js/main.js` | Estado, navegación, cabecera, arranque y registro del modo offline. |
| **VOZ-OFFLINE (Vosk)** | `js/vendor/vosk.js` | Biblioteca de reconocimiento sin conexión (fichero de terceros, no editar). |
| **MODELO-DE-VOZ** | `modelos/vosk-model-small-es-0.3.tar.gz` | Modelo de español (34 MB) para practicar sin internet. |
| **PWA-IDENTIDAD** | `manifest.json` | Nombre, iconos, colores e instalación como app. |
| **PWA-OFFLINE** | `sw.js` | Caché: que la app funcione sin internet. |
| **ICONOS** | `icons/*.png` | Logotipo de la app (192, 512 y favicon). |
| **INVESTIGACIÓN** | `docs/INVESTIGACION.md` | Por qué la app está diseñada así (buenas prácticas AAC/TEA). |

### Subsecciones dentro de **PANTALLAS** (`js/screens.js`)

| NOMBRE DE SECCIÓN | Qué controla |
|---|---|
| **PANTALLA-HOME** | Menú principal con las tarjetas de nivel y «Formar Frases». |
| **PANTALLA-NIVEL** | Rejilla de pictogramas que suenan al tocarlos + cambio de nivel con gesto. |
| **PRACTICA-DE-PRONUNCIACION** | Botón de micrófono de cada tarjeta: escucha, compara, felicita o pide repetir. |
| **PANTALLA-FRASES** | Lógica de «arma la frase»: imagen, huecos, opciones, acierto/error, frase completa. |
| **PANTALLA-AJUSTES** | Velocidad de la voz, origen de la voz, micrófono, sonido y probar voz. |
| **PANTALLA-CREDITOS** | Autoría (Francisco Javier Fuentes Rodriguez), licencias de ARASAAC/piper/Vosk y **CREDITOS-DE-IA**. Botón «Créditos y licencias» al final de Ajustes. |
| **PUERTA-DE-ADULTO** | Dos interruptores (apagados por defecto) con pregunta de adulto: *Autocuidado* (Mi cuerpo + Higiene) y *Temas sensibles* (privacidad, límites, pubertad). |
| **AJUSTES-DEL-MICRÓFONO** | Interruptor del micrófono, exigencia (fácil/normal/estricto), motor y descarga sin conexión. |

### Subsecciones dentro de **MICRÓFONO-PRACTICA** (`js/mic.js`)

| NOMBRE DE SECCIÓN | Qué controla |
|---|---|
| **COMPARADOR-DE-VOZ** | Normaliza y compara lo dicho con la palabra (Levenshtein + tolerancias). |
| **MOTOR-NAVEGADOR** | Web Speech API (0 MB), con modo sin conexión si el navegador lo permite. |
| **MOTOR-OFFLINE-VOSK** | Modelo Vosk local (34 MB): descarga, caché y reconocimiento sin internet. |
| **SELECCION-DE-MOTOR** | Qué motor usar, reintentos y códigos de error. |

### Subsecciones dentro de **COMPONENTES-UI** (`js/ui.js`)

| NOMBRE DE SECCIÓN | Qué controla |
|---|---|
| **BOTÓN-DE-MICRÓFONO** | Botón redondeado encima de cada tarjeta (nunca dentro de otro botón). |
| **FELICITACIONES** | Animación de estrellas «¡Muy bien!» y burbuja «¡Otra vez!». |

### Subsecciones dentro de **SISTEMA-DISEÑO** (`css/styles.css`)

`A) TOKENS` · `B) BASE` · `C) CABECERA` · `D) TARJETAS` · `E) REJILLAS` ·
`F) PANTALLA-FRASES` · `G) AJUSTES` · `H) AVISOS` · `I) ANIMACIONES` ·
`J) RESPONSIVE` (tablet/PC/móvil pequeño) · `K) ACCIBILIDAD` (foco, contraste, movimiento reducido)

---

## 🧭 Recetas rápidas

### 1. Añadir un nivel nuevo
Archivo: **DATOS-NIVELES** (`js/data/niveles.js`)
```js
{ id: "mascotas", nombre: "Mascotas", icono: "perro",
  color: "#E8F6EC", palabras: ["perro", "gato", "pez", "mariposa"] },
```
Si una palabra no está en **DATOS-PICTOGRAMAS**, la tarjeta sale sin imagen (solo texto) y aun así se pronuncia.

### 2. Añadir una palabra a un nivel existente
1. Buscar el ID: `https://api.arasaac.org/api/pictograms/es/search/PALABRA` → campo `_id`.
2. Añadir `"palabra": ID,` en **DATOS-PICTOGRAMAS**.
3. Añadir `"palabra"` en la lista `palabras` del nivel en **DATOS-NIVELES**.
4. **Comprobar visualmente** que la imagen corresponde a la palabra.

### 3. Añadir una frase
Archivo: **DATOS-FRASES** (`js/data/frases.js`)
```js
{ id: "f13", imagen: 7202, palabras: [
    { t: "El" }, { t: "gato", p: "gato" }, { t: "come", p: "come" } ] },
```
- `t` = texto que se muestra y se pronuncia.
- `p` = clave de **DATOS-PICTOGRAMAS** (opcional; sin `p` es tarjeta de solo texto, ideal para artículos).
- `imagen` = ID ARASAAC de la imagen grande (pista).

### 4. Cambiar la voz o su velocidad
Archivo: **MOTOR-DE-VOZ** → `CAMBIAR_IDIOMA` y velocidad inicial.
El usuario también puede ajustarla en **PANTALLA-AJUSTES** (se guarda en el dispositivo).

**La app tiene DOS fuentes de voz** (por eso suena en cualquier dispositivo):

| Modo (`Voz.config.modo`) | Comportamiento |
|---|---|
| `auto` (por defecto) | Voz del sistema si hay voces en español; si no, los MP3 incluidos. |
| `local` | Siempre los MP3 incluidos (`/audio`). |
| `sistema` | Siempre la Web Speech API del dispositivo. |

**Si una palabra nueva no tiene MP3**: ejecuta
`python3 tools/generar-audios.py` y sube `CACHE_VERSION` en **PWA-OFFLINE**.
(Sin regenerar, la palabra se pronuncia con la voz del sistema o no suena).

**Cambiar la voz de la app** (ahora usa **Piper TTS**, voz neuronal natural):

```bash
python3 tools/generar-audios.py --listar-voces      # ver voces instaladas
python3 tools/generar-audios.py --muestra           # escuchar muestras y elegir
python3 tools/generar-audios.py --voz es_MX-claude-high   # regenerar con esa voz
```
- Las vives en `~/.local/share/piper/voices/` (FUERA de la carpeta de la app).
- Sin Piper instalado, el script cae automáticamente a `espeak-ng` (voz robótica).
- Instrucciones de instalación de Piper: cabecera de `tools/generar-audios.py`.

### 4bis. Solucionar «no se escucha la voz»
1. **PANTALLA-AJUSTES → Origen de la voz**: mira cuántas voces detecta el dispositivo.
2. Si dice *«no tiene voces en español»*, deja **Automática** o elige **Voz de la app**.
3. Comprueba que existe `audio/<palabra>.mp3` y que `js/data/sonidos.js` la mapea.
4. Sube `CACHE_VERSION` y recarga con Ctrl+F5 (o vacía la caché del navegador).

### 5. Cambiar colores, tamaños o esquinas
Archivo: **SISTEMA-DISEÑO** → sección `A) TOKENS`.
Los radios de las tarjetas están en `--radio-tarjeta`.

### 6. Añadir una pantalla nueva
1. Crear la función en **PANTALLAS** (`js/screens.js`), siguiendo el patrón de `home()`.
2. Registrarla en **CONTROLADOR-PRINCIPAL** (`js/main.js`) dentro de `PANTALLAS_DE_ABAJO` y `TITULOS`.
3. Navegar con `ctx.irA("miPantalla", { datos })`.

### 7. Cambiar los gestos
Archivo: **GESTOS-NAVEGACION** → constantes `UMBRAL` y `BORDE`.
Las acciones por pantalla se declaran con `Gestos.actualizar({ siguiente, anterior, volver })`.

### 8. Cambiar la práctica de pronunciación (micrófono)
- **Exigencia** (cuánto se parece para contar como acierto): `UMBRALES` en **COMPARADOR-DE-VOZ**
  (`0.5` fácil · `0.7` normal · `0.85` estricto). El usuario lo cambia en **AJUSTES-DEL-MICRÓFONO**.
- **Textos de premio / repetición**: **FELICITACIONES** (`UI.felicitar`, `UI.burbuja`) y
  **PRACTICA-DE-PRONUNCIACION** (`practicar()` en `js/screens.js`).
- **Activar o desactivar el botón**: `Mic.configurar({ activado: false })` desde Ajustes,
  o la constante `puedePracticar` de **PANTALLA-NIVEL**.
- **Motor de escucha**: `Mic.config.modo` = `auto` | `navegador` | `offline`.
- **Si el navegador no permite reconocimiento** (p. ej. Firefox): se usa el modelo offline
  si está descargado; si no, el botón muestra «Pide ayuda a un adulto».

### 9. Actualizar el modelo de voz sin conexión (34 MB)
1. Descargar un modelo nuevo de `alphacephei.com/vosk/models` (o copiar el actual).
   ⚠ Ese servidor **no permite CORS**: el modelo debe alojarse en `modelos/` de la app.
2. Reemplazar `modelos/vosk-model-small-es-0.3.tar.gz` (formato `.tar.gz`, sin ficheros `._*`).
3. Actualizar `RUTA_MODELO` en **MOTOR-OFFLINE-VOSK** (`js/mic.js`).
4. Borrar la caché vieja: `caches.delete("pictoamigos-modelo")` o subir `CACHE_VERSION`.
5. Subir `CACHE_VERSION` en **PWA-OFFLINE**.
   Nota: `js/vendor/vosk.js` (5,6 MB) es la biblioteca; solo se actualiza si cambia la versión
   de vosk-browser.

### 10. Activar o desactivar la sección «Mi cuerpo y mi seguridad»
- **Estado por defecto: TODO DESACTIVADO** (no aparece nada en la app).
- En **Ajustes** hay **dos interruptores independientes**, cada uno con su **puerta de adulto**
  (pregunta matemática):
  1. **Autocuidado: Mi cuerpo y Higiene** → vida diaria (CHOP/Vanderbilt: agendas visuales
     de higiene que el niño puede usar solo).
  2. **Temas sensibles: privacidad, límites y pubertad** → para trabajar **siempre con un adulto**.
- Al activar uno, **solo aparecen las tarjetas de ese grupo**, al final del HOME, con el rótulo
  «Sección activada por un adulto». Apagar es inmediato y el estado se guarda por dispositivo.
- Si alguna vez hay que entregarlo ya activado (p. ej. aula concreta), cambiar en
  **DATOS-CUERPO-Y-SEGURIDAD** el `estado` inicial: `{ autocuidado: true, sensibles: true }`.
  ⚠ Solo con decisión explícita de un adulto responsable.

### 11. Cambiar el contenido de esa sección
Archivo: **DATOS-CUERPO-Y-SEGURIDAD** (`js/data/cuerpo.js`)
- Añadir palabra: buscar el ID en `https://api.arasaac.org/api/pictograms/es/search/PALABRA`,
  añadirla a `PICTOS_CUERPO` y a la lista `palabras` del sub-nivel.
- **Obligatorio después**: revisar la imagen en `python3 tools/revision-cuerpo.py`
  → `http://localhost:8137/tools/revision-cuerpo/index.html` (**REVISIÓN-DE-IMÁGENES**),
  regenerar audios (`python3 tools/generar-audios.py`) y subir `CACHE_VERSION`.
- Quitar una palabra o un sub-nivel: borrar su línea.

### 12. Quitar la sección entera
1. Borrar `js/data/cuerpo.js`.
2. Borrar su `<script>` en **NÚCLEO-HTML** (`index.html`).
3. Borrar el bloque **PUERTA-DE-ADULTO** y el de `listaNiveles()`/HOME en `js/screens.js`.
4. Regenerar audios y subir `CACHE_VERSION`.

### 13. Cambiar los créditos (o añadir una licencia)
Archivo: **PANTALLA-CREDITOS** (`js/screens.js`).
- **Nunca borrar ni reformular la cita de ARASAAC**: es obligatoria por licencia
  CC BY-NC-SA (ver `docs/INVESTIGACION.md` §5).
- Para añadir un componente nuevo, añadir su ficha con: nombre, autoría, licencia y enlace.
- La **SECCIÓN: CREDITOS-DE-IA** lista los modelos usados por la app (Piper TTS, Vosk)
  y los usados para crearla (MiMo, OpenCode): si se añade otro modelo, añadirlo ahí.

### 14. Compilar la versión de escritorio / móvil (Tauri)
Archivo: **EMPACADO-TAURI** (`src-tauri/`) + `tools/preparar-dist.mjs`.

```bash
# 1) Binario de Linux (funciona ya mismo)
cd src-tauri && cargo build --release
./target/release/pictoamigos

# 2) Instaladores (deb, AppImage, msi, dmg)
cargo install tauri-cli          # una sola vez
cd src-tauri && cargo tauri build   # salen en target/release/bundle/

# 3) Desarrollo con recarga
python3 -m http.server 8137      # en otra terminal
cargo tauri dev
```

- **CSP** (`tauri.conf.json > app > security > csp`): permite imágenes de
  `static.arasaac.org`, `blob:` (trabajador de Vosk) y MP3 locales. Si añades un
  dominio externo, añádelo también ahí, si no el navegador lo bloqueará.
- **Iconos**: `src-tauri/icons/` (PNG32/128/256/512 + `icon.ico`). Para regenerarlos
  desde el logo: `python3 tools/generar-iconos.py` (o `cargo tauri icon logo.png`).
- **Android** exige Android Studio + SDK; **iOS/macOS** exigen un Mac con Xcode.
- **AppImage y audio**: `bundle.linux.appimage.bundleMediaFramework = true` es
  **obligatorio**; sin él el AppImage no lleva los plugins de GStreamer y la app se
  congela al pronunciar un pictograma (README, «bloqueos en la app de escritorio»).
  Para recompilarlo en Arch/Linux hacen falta:
  `export PATH="$HOME/.local/bin:$PATH"` (patchelf) y
  `export GSTREAMER_HELPERS_DIR=/usr/lib/gstreamer-1.0`.
- El modelo de voz (34 MB) **se incluye en `dist/`** para que el reconocimiento
  funcione sin internet. Si quieres un instalador más ligero, quita `"modelos"` de
  `INCLUIR` en `tools/preparar-dist.mjs` (la práctica de pronunciación pedirá
  descargarlo, pero sin servidor no podrá: mejor mantenerlo).

---

## ⚠ Reglas que no deben romperse

1. **Sonido obligatorio**: tocar cualquier pictograma o palabra debe pronunciarlo.
2. **Tarjetas redondeadas**: conservar `border-radius` en `.tarjeta`.
3. **Fondo claro y simple**, sin parpadeos, sin animaciones agresivas, sin autoplay de sonidos.
4. **Objetivos táctiles grandes**: mínimo 72 px de alto (`--tactil`).
5. **Contraste alto** en texto (`--tinta` sobre `--fondo`).
6. **Consistencia**: misma barra superior, mismo botón atrás, mismo estilo en todas las pantallas.
7. **No editar imágenes de ARASAAC**: solo se referencian por ID.
8. **Tras modificar cualquier fichero cacheado**, subir `CACHE_VERSION` en **PWA-OFFLINE** (`sw.js`), o los usuarios no verán el cambio.
   ⚠ El `activate` de `sw.js` solo debe borrar cachés `pictoamigos-v*` (versiones de la app):
   **nunca `pictoamigos-modelo`**, ahí vive la voz sin conexión de 34 MB que descargó el usuario.
9. **Tras añadir palabras o frases nuevas**, ejecutar `python3 tools/generar-audios.py` (**GENERADOR-DE-AUDIOS**) para que tengan MP3; después subir `CACHE_VERSION`.
10. **Nunca castigar en la práctica de pronunciación**: si falla, burbuja «¡Otra vez!» y
    volver a pronunciar la palabra. Sin cruces rojas ni mensajes de error para el niño
    (los mensajes para el adulto van en el aviso flotante).
11. **Licencia**: los pictogramas son de ARASAAC (CC BY-NC-SA, no comercial). Mantener la atribución (ver README).
12. **La sección «Mi cuerpo y mi seguridad» permanece DESACTIVADA por defecto** (los dos
    interruptores de **PUERTA-DE-ADULTO** apagados) y solo un adulto puede activarlas.
    No cambiar ese comportamiento sin que lo pida un adulto responsable, y revisar siempre
    las imágenes con **REVISIÓN-DE-IMÁGENES**.

---

## 🔄 Cómo fluyen los datos

```
index.html
   ├── css/styles.css ................ SISTEMA-DISEÑO
   └── js/
         ├── data/pictos.js .......... DATOS-PICTOGRAMAS  (palabra → ID ARASAAC)
         ├── data/niveles.js ......... DATOS-NIVELES      (qué se ve en el HOME)
         ├── data/frases.js .......... DATOS-FRASES       (frases de 3-4 palabras)
         ├── data/sonidos.js ......... SONIDOS-LOCALES    (texto → MP3 incluido)
         ├── audio.js ................ MOTOR-DE-VOZ       (habla, detiene, campanita)
         ├── ui.js ................... COMPONENTES-UI     (tarjetas, botones, avisos)
         ├── gestos.js ............... GESTOS-NAVEGACION  (swipe, ratón, teclado)
         ├── screens.js .............. PANTALLAS          (home, nivel, frases, ajustes)
         └── main.js ................. CONTROLADOR-PRINCIPAL (estado + navegación)

Imágenes: https://static.arasaac.org/pictograms/{ID}/{ID}_300.png  (y _500.png)
Voz:      1) MP3 incluidos en /audio (SECCIÓN: SONIDOS-LOCALES, generados con
             tools/generar-audios.py)  2) Web Speech API si el sistema tiene voces
Offline:  sw.js (caché de app + imágenes + audios)
```

---

## 🧪 Cómo probar un cambio

```bash
cd "App Autismo"
python3 -m http.server 8137
# abrir http://localhost:8137/
```

Comprobaciones mínimas:
1. HOME → se ven todas las tarjetas con su pictograma.
2. Nivel → al tocar un pictograma **suena su palabra**.
3. Nivel → cada tarjeta tiene **botón de micrófono** (esquina superior derecha):
   - Acierto → animación «¡Muy bien!» + campanita.
   - Casi → burbuja «¡Otra vez!» y se vuelve a pronunciar la palabra.
   - Sin permiso / sin conexión → aviso para el adulto (nunca un error rojo para el niño).
4. Ajustes → aparecen *Botón de micrófono*, *Cuán estricto*, *Cómo escucha* y *Descargar voz sin conexión*.
5. Gesto deslizar → cambia de nivel / de frase; el borde izquierdo = atrás.
6. Formar Frases → al tocar opciones suenan; al ordenarlas bien aparece **«¡Muy bien!»** y se lee la frase.
7. Ajustes → cambiar velocidad y probar la voz.
8. **Sección restringida**: en Ajustes los **dos interruptores** (Autocuidado · Temas sensibles)
   deben estar **apagados** por defecto; al encender uno aparece su **puerta de adulto**
   (pregunta): respuesta incorrecta → no se activa; correcta → aparece el rótulo
   «Sección activada por un adulto» y **solo** las tarjetas de ese grupo en el HOME.
   Apagarlos los oculta al instante.
9. **Créditos**: en Ajustes, el botón «Créditos y licencias» abre **PANTALLA-CREDITOS**
   con la autoría, la cita obligatoria de ARASAAC, las licencias de voz y la
   **SECCIÓN: CREDITOS-DE-IA**; el botón Atrás regresa a Ajustes (no al HOME).
10. Sin consola con errores rojos (pestaña *Console* del navegador).
11. Tras un cambio, recargar y comprobar que aparece (si un fichero cacheado no cambia, subir `CACHE_VERSION`).
12. **Escritorio (Tauri)**: `cd src-tauri && cargo build --release` compila sin errores y
    `./target/release/pictoamigos` abre la app con pictogramas, voz y micrófono funcionando
    (comprobar también que las imágenes de ARASAAC cargan: el CSP de `tauri.conf.json`
    debe incluir `https://static.arasaac.org`).

> Nota: para probar el micrófono sin voz real se puede sustituir `window.SpeechRecognition`
> por una clase falsa que llame a `onresult({results:[[{transcript:"palabra"}]]})`.

---

## 📁 Estructura completa

```
App Autismo/
├── index.html               NÚCLEO-HTML
├── manifest.json            PWA-IDENTIDAD
├── sw.js                    PWA-OFFLINE
├── README.md
├── audio/                   SONIDOS-LOCALES (MP3 de voz, generados)
├── modelos/                 MODELO-DE-VOZ (Vosk español, 34 MB, sin conexión)
├── tools/
│   ├── generar-audios.py    GENERADOR-DE-AUDIOS
│   ├── revision-cuerpo.py   REVISIÓN-DE-IMÁGENES
│   ├── preparar-dist.mjs     EMPACADO-TAURI (prepara dist/)
│   ├── revision-cuerpo/     (salida: página de revisión)
│   └── voces-ejemplo/       (muestras para comparar voces)
├── src-tauri/               EMPACADO-TAURI (proyecto Tauri v2)
│   ├── tauri.conf.json      ventana, CSP, iconos, bundle
│   ├── capabilities/        permisos
│   ├── src/                 main.rs + lib.rs
│   └── icons/               PNG + ICO
├── dist/                    (generado por preparar-dist.mjs; no se sube a git)
├── css/
│   └── styles.css           SISTEMA-DISEÑO
├── icons/                   ICONOS (icon-192, icon-512, favicon)
├── js/
│   ├── audio.js             MOTOR-DE-VOZ
│   ├── mic.js               MICRÓFONO-PRACTICA (4 subsecciones)
│   ├── vendor/
│   │   └── vosk.js          VOZ-OFFLINE (Vosk, 5,6 MB, no editar)
│   ├── ui.js                COMPONENTES-UI (incluye BOTÓN-DE-MICRÓFONO y FELICITACIONES)
│   ├── gestos.js            GESTOS-NAVEGACION
│   ├── screens.js           PANTALLAS (+ 4 subsecciones)
│   ├── main.js              CONTROLADOR-PRINCIPAL
│   └── data/
│       ├── pictos.js        DATOS-PICTOGRAMAS
│       ├── cuerpo.js        DATOS-CUERPO-Y-SEGURIDAD (restringida)
│       ├── niveles.js       DATOS-NIVELES
│       ├── frases.js        DATOS-FRASES
│       └── sonidos.js       SONIDOS-LOCALES (mapa, generado)
└── docs/
    ├── DOCUMENTACION.md     ← este fichero
    └── INVESTIGACION.md     INVESTIGACIÓN (buenas prácticas aplicadas)
```
