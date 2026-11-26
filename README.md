> ## 🧪 ESTADO: **ALPHA** (versión de prueba, aún inestable)
> - ✅ Pictogramas con voz, niveles, formar frases, gestos, PWA, instaladores.
> - ⚠️ **Micrófono**: funciona en el **navegador/PWA**; en la **app de escritorio** aún no
>   (WebKitGTK no deja cargar el modelo de reconocimiento — ver README §micrófono).
> - ⚠️ Puede haber cambios incompatibles entre versiones alpha: si algo se rompe,
>   avísame y lo arreglo (diagnóstico: `docs/DOCUMENTACION.md`).
>
> **Política de versiones:** mientras dure la alpha la versión será **0.x**
> (0.1.0, 0.2.0…); **la1.0.0 se publicará cuando la considere madura y estable**.

# 🧩 PictoAmigos — Pictogramas con voz para niños autistas

App de **comunicación aumentativa y alternativa (AAC)** pensada para niños con TEA:
niveles de pictogramas que **suenan al tocarlos** y una sección para **armar frases de 3 a 4 palabras**.
Funciona en **móvil, tablet y PC**, con **gestos** para moverse entre pantallas y **modo sin conexión**.

---

## ✨ Qué incluye

- **HOME** con los niveles: Familia · Necesidades · Colores · Formas · Números · Animales · Comidas · Emociones · Ropa · Escuela + **Formar Frases**.
- **Cada pictograma se pronuncia** al tocarlo: la app incluye **195 audios en español** generados con **Piper TTS (voz neuronal, natural)** que funcionan aunque el dispositivo no tenga voces instaladas, y también puede usar la voz natural del sistema.
- **Micrófono en cada tarjeta** para practicar la pronunciación: el niño dice la palabra, la app la compara y, si acierta, sale una **animación de felicitación** («¡Muy bien!» con estrellas). Si falla, una burbuja suave «¡Otra vez!» y vuelve a pronunciar la palabra. **Nunca hay castigos ni errores en rojo.**
  - Dos motores: el del navegador (0 MB) y, si no hay internet o el navegador no lo permite, un **modelo pequeño sin conexión de 34 MB** incluido en `modelos/`.
  - Exigencia ajustable (Fácil / Normal / Estricto) en **Ajustes**.
- **Formar Frases**: imagen + 3 o 4 palabras desordenadas → el niño las toca en orden (p. ej. *«El perro juega»*, *«El niño come dulces»*) y al terminar se lee la frase completa con un refuerzo positivo.
- **Gestos**: deslizar ← → cambiar de nivel/frase · deslizar desde el borde izquierdo = atrás · ratón y flechas del teclado en PC.
- **Tarjetas amigables** de esquinas redondeadas, fondos claros, sin parpadeos ni estímulos que distraigan.
- **PWA**: se instala como app en el móvil/tablet y funciona **sin internet** una vez usada.

---

## 🚀 Cómo ejecutarla

**Opción A — servidor local (recomendada):**

```bash
cd "App Autismo"
python3 -m http.server 8137
```
Abrir <http://localhost:8137/>

**Opción B — doble clic en `index.html`:**
todo funciona excepto el modo sin conexión (los navegadores exigen HTTP para eso).

**Para instalarla como app (móvil/tablet):**
abrir la URL en el navegador → menú → *«Instalar aplicación»* / *«Añadir a pantalla de inicio»*.

**Para publicarla:** subir la carpeta a cualquier hosting estático (GitHub Pages, Netlify, Vercel, un servidor del colegio). No necesita build ni base de datos.

---

## 🗂 Estructura y documentación

La documentación está pensada para **dar indicaciones a cualquier IA o persona**:
cada parte tiene un nombre de sección.

| Documento | Qué contiene |
|---|---|
| **`docs/DOCUMENTACION.md`** | Índice de secciones, recetas («añadir nivel», «añadir frase»), reglas y cómo probar. **Empezar aquí.** |
| **`docs/INVESTIGACION.md`** | Investigación aplicada: buenas prácticas AAC/TEA y dónde está cada decisión. |

```
index.html            NÚCLEO-HTML          manifest.json    PWA-IDENTIDAD
css/styles.css        SISTEMA-DISEÑO       sw.js            PWA-OFFLINE
js/audio.js           MOTOR-DE-VOZ         js/ui.js         COMPONENTES-UI
js/gestos.js          GESTOS-NAVEGACION    js/screens.js    PANTALLAS (4 pantallas)
js/main.js            CONTROLADOR-PRINCIPAL
js/data/pictos.js     DATOS-PICTOGRAMAS    js/data/niveles.js  DATOS-NIVELES
js/data/frases.js     DATOS-FRASES
```

Ejemplo de petición de cambio:

> *«En la sección **DATOS-NIVELES** añade el nivel "Mascotas" con perro, gato, pez y mariposa;
> y en **DATOS-FRASES** añade la frase "El gato duerme".»*

---

## 🛠 Tecnología

- **HTML + CSS + JavaScript puro** (sin frameworks ni build) → fácil de modificar y de alojar.
- **Pictogramas**: ARASAAC (API pública `api.arasaac.org`), IDs verificados uno a uno.
- **Sonido**: Web Speech API (`speechSynthesis`) en español + campanita suave con WebAudio.
- **Offline**: Service Worker con caché de app y de imágenes.

---

## ⚖️ Licencia y atribución

**PictoAmigos es software libre y gratuito.** Licencia del código: **GNU GPL-3.0 o superior**
(texto completo en [`LICENSE`](LICENSE)). Puedes usarlo, estudiarlo, modificarlo y
redistribuirlo libremente, también gratuitamente, manteniendo la misma licencia.

⚠️ **Límite importante:** los **pictogramas son de ARASAAC** — © Gobierno de Aragón,
creados por **Sergio Palao**, licencia **Creative Commons BY-NC-SA**:

> *Autor pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC (BY-NC-SA). Propiedad: Gobierno de Aragón (España).*

Por eso la app **no puede usarse con fines comerciales** (venderla, monetizarla ni meterle
publicidad), hay que **citar siempre la fuente** y las obras derivadas se comparten con la
misma licencia. Ver `docs/INVESTIGACION.md` §5.

| Parte | Licencia |
|---|---|
| Código de la app | **GPL-3.0-or-later** (`LICENSE`) |
| Pictogramas ARASAAC | **CC BY-NC-SA** (no comercial + atribución + compartir igual) |
| Audios MP3 generados | derivados de las voces Piper (ver licencia de cada voz) |
| Piper TTS · Vosk · Vosk-Browser · espeak-ng | GPL-3.0 · Apache-2.0 · Apache-2.0 · GPL-3.0 |
| Créditos completos | **Ajustes → «Créditos y licencias»** en la app |

Al redistribuir la app, incluye este `README`, el `LICENSE` y no elimines la cita de ARASAAC.

---

## 🎙 Cambiar la voz de la app

La voz incluida se genera con **Piper TTS** (voz neuronal, gratuita y offline):

```bash
# 1) Escuchar las voces disponibles y elegir una
python3 tools/generar-audios.py --muestra
#    -> abre http://localhost:8137/tools/voces-ejemplo/index.html

# 2) Regenerar los 195 audios con la voz elegida
python3 tools/generar-audios.py --voz es_MX-claude-high

# 3) Ver las voces instaladas
python3 tools/generar-audios.py --listar-voces
```

Voces instaladas (5): `es_MX-claude-high` (masculina, calidad alta · **la actual**),
`es_MX-ald-medium`, `es_ES-davefx-medium`, `es_ES-sharvard-medium` (femenina España)
y `es_AR-daniela-high` (femenina Argentina, calidad alta).
La página de muestras incluye las palabras difíciles (rojo, cruz, gafas, pantalón…)
para comparar la pronunciación voz por voz.
Instalación de Piper y de más voces: cabecera de `tools/generar-audios.py`.

## 🧊 Solucionar: «la app de escritorio se traba en el primer clic»

**Causa real (diagnosticada con el indicador de la propia app):** el **AppImage no
incluía los plugins de audio de GStreamer** (`appsink`, `autoaudiosink`). Al pronunciar
un pictograma, WebKit intentaba montar la tubería de audio, no la encontraba y la
ventana **se congelaba** (log: `GStreamer element appsink not found` + `GLib-GObject-CRITICAL`).

**Solución aplicada:**

1. `src-tauri/tauri.conf.json → bundle.linux.appimage.bundleMediaFramework = true`
   → el AppImage empaqueta GStreamer (144 MB → **220 MB**; los `.deb`/`.rpm` siguen en
   38 MB porque usan el GStreamer del sistema, y el binario también).
2. Defensas añadidas en **MOTOR-DE-VOZ**: en escritorio jamás se usa la voz del
   sistema, la campanita es un WAV embebido y el micrófono tiene timeout de8 s.

**Si recompilas el AppImage en Arch/Linux** necesitas `patchelf` y la ruta de helpers:

```bash
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"   # patchelf en ~/.local/bin
export GSTREAMER_HELPERS_DIR=/usr/lib/gstreamer-1.0     # ruta de tu distro
cargo tauri build
```
(En Ubuntu/Debian ya vienen instalados: por eso la CI de GitHub no fallaba.)

**Diagnóstico:** si vuelve a fallar algo, aparece una **línea gris abajo a la izquierda**
con el paso exacto (`ERROR: …`), y los errores de JS también se imprimen en consola.

## 🎤 Práctica de pronunciación (micrófono)

**Dónde funciona:**

| Versión | Micrófono | Voz al tocar |
|---|---|---|
| **Navegador / PWA** (móvil, tablet, PC) | ✅ funciona | ✅ |
| **App de escritorio** (Tauri: exe, deb, AppImage) | ⚠️ **no disponible** (ver abajo) | ✅ |

**Por qué en la app de escritorio no:** WebKitGTK (el motor de la app empaquetada)
**no permite que los trabajadores web lean URLs `blob:`**, y ahí es donde Vosk carga
el modelo de reconocimiento (diagnóstico: `trabajador lee modelo → sin respuesta`).
Además WebKitGTK no implementa `webkitSpeechRecognition`. Al intentarlo, la app muestra
**«La práctica de micrófono no está disponible en esta app de escritorio. Ábrela en el
navegador (PWA) para practicar la pronunciación»** (nunca se queda colgada).

**Cómo se usa la práctica (en el navegador):**
1. Pulsa el **micrófono** de la tarjeta (permiso del navegador la primera vez).
2. Di la palabra → si acierta: animación **«¡Muy bien!»**; si no: burbuja **«¡Otra vez!»**
   y se vuelve a pronunciar la palabra.
3. **Ajustes** → interruptor del micrófono · exigencia (Fácil/Normal/Estricto) ·
   motor (Automático/Navegador/Sin conexión) · descarga de la voz sin conexión (34 MB).

**Posible solución futura en escritorio:** servir la app por un **servidor HTTP local
dentro de la propia app** (con cabeceras COOP/COEP): los trabajadores sí podrían leer
`http://127.0.0.1/…` y Vosk arrancaría. Está en el roadmap (`docs/INVESTIGACION.md` §4).

**El modelo de voz ya viene integrado**: `modelos/vosk-model-small-es-0.3.tar.gz` (34 MB)
va dentro del paquete (`dist/`), así que **no hace falta descargar nada**: Ajustes debe
indicar *«Voz sin conexión: lista»*. Si dice «sin descargar», es que la comprobación
falló (mira `Mic.estadoModelo()` en **MICRÓFONO-PRACTICA**).

**Peso añadido:** `modelos/vosk-model-small-es-0.3.tar.gz` (34 MB) + `js/vendor/vosk.js` (5,6 MB).
Si no quieres la práctica sin conexión, puedes borrar `modelos/` y `js/vendor/`: el resto de la app
funciona igual y el micrófono usará el motor del navegador.

## 🔒 Sección «Mi cuerpo y mi seguridad» (desactivada por defecto)

Contenido de apoyo para el trabajo que hacen **familias, maestros y terapeutas** con niños
con TEA: nombres del cuerpo, higiene, público/privado, límites y pubertad.

- **No aparece en la app** hasta que un adulto lo active. En **Ajustes** hay **dos
  interruptores independientes** (ambos apagados por defecto), cada uno con su
  **puerta de adulto** (pregunta matemática):
  1. **Autocuidado: Mi cuerpo y Higiene** → vida diaria; las guías lo dan para uso
     independiente con agendas visuales (CHOP, Vanderbilt VKC).
  2. **Temas sensibles: privacidad, límites y pubertad** → para trabajar **con un adulto**.
- Al activar uno, **solo aparecen sus tarjetas** al final del HOME (con el rótulo
  «Sección activada por un adulto»). Apagar es inmediato y se guarda por dispositivo.
- Sub-niveles: **Mi cuerpo** (20) · **Higiene** (12) → grupo *autocuidado*;
  **Público y privado** (12) · **Límites y seguridad** (14) · **Pubertad** (13) → grupo *sensibles*.
- **Antes de usarla**: revisa las imágenes con un adulto →
  `python3 tools/revision-cuerpo.py` → `http://localhost:8137/tools/revision-cuerpo/index.html`
- Por qué está así y con qué criterios se diseñó: `docs/INVESTIGACION.md` §4bis
  (guías de CHOP, Autismo España, Vanderbilt VKC, Davies et al., Be Safe…).

## 📦 Instalar sin depender del navegador (Tauri)

La app es 100 % web, pero se puede **empaquetar como programa de escritorio** con
**Tauri v2**: usa el WebView del sistema (no lleva Chrome dentro) → binarios de
**5–15 MB** en vez de ~180 MB de Electron.

| Plataforma | Comando | Resultado |
|---|---|---|
| **Linux** | `cd src-tauri && cargo build --release` | `src-tauri/target/release/pictoamigos` |
| **Instaladores** (deb/AppImage/msi/dmg) | `cargo install tauri-cli` y luego `cargo tauri build` | `src-tauri/target/release/bundle/` |
| **Android** | instalar Android Studio + SDK y `cargo tauri android init/build` | APK |
| **iOS / macOS** | requiere un Mac con Xcode | `.ipa` / `.dmg` |

- En desarrollo: `python3 -m http.server 8137` y `cargo tauri dev` (abre la app apuntando a ese servidor).
- Antes de compilar, `tools/preparar-dist.mjs` crea `dist/` con **solo** lo necesario
  (incluidos los MP3 y el modelo de voz de34 MB → **funciona sin internet**).
- **Sobre la voz en las apps de escritorio:** ninguna usa los modelos de voz de Chrome.
  Aquí se usa la **voz incluida (MP3 de Piper)** + la **voz del sistema** + **Vosk**
  para el micrófono, así que todo funciona **sin conexión** en Tauri.

### Otras opciones valoradas

| Opción | Tamaño | Notas |
|---|---|---|
| **PWA** (ya incluida) |0 MB | Se instala desde el navegador en Android/iOS/Windows |
| **Electron** | ~180 MB | Máxima compatibilidad, más pesado |
| **PWABuilder** | — | Genera un APK desde la PWA sin compilar |
| **Capacitor** | — | Para publicar en App Store / Play Store |

## 📜 Créditos y licencias

En **Ajustes → «Créditos y licencias»** (último botón) está la pantalla **PANTALLA-CREDITOS**:

- **Autoría:** Francisco Javier Fuentes Rodriguez.
- **Pictogramas:** cita obligatoria de ARASAAC (CC BY-NC-SA) con enlaces.
- **Voz:** Piper TTS y licencias de cada voz.
- **Modelos de IA:** los que usa la app (Piper TTS, Vosk/Kaldi, Vosk-Browser) y los
  usados para crearla (MiMo, OpenCode).
- Otras herramientas (ffmpeg, espeak-ng).

## 🔊 Solucionar: «no se escucha la voz»

La app tiene **dos fuentes de voz** y elige sola la que funcione:

1. Entra en **Ajustes** (icono de engranaje) y mira la línea *«Origen de la voz»*:
   - *«Este dispositivo no tiene voces en español»* → se usarán los MP3 incluidos (correcto).
   - *«Este dispositivo tiene N voces»* → puedes cambiar entre **Voz de la app** y **Voz del dispositivo**.
2. Comprueba que no esté en silencio el navegador ni el equipo, y que **Ajustes → Pronunciar al tocar** esté activado.
3. Si añadiste palabras nuevas sin regenerar los audios, ejecuta:
   ```bash
   python3 tools/generar-audios.py     # necesita espeak-ng y ffmpeg
   ```
4. Tras cualquier cambio, recarga con **Ctrl+F5** (o vacía la caché del navegador).

## 🧪 Comprobación rápida

1. HOME → tarjetas con imagen.
2. Tocar un pictograma → **suena la palabra**.
3. Deslizar en un nivel → siguiente/anterior nivel; borde izquierdo → atrás.
4. Formar Frases → tocar palabras (suenan) → ordenarlas → **«¡Muy bien!»** y frase leída.
5. Ajustes → velocidad de voz y prueba.
6. Sin errores en la consola del navegador.

---

## 🗓 Siguientes pasos sugeridos

Fotos personalizadas por la familia, tablero libre tipo PECS, agenda visual de rutinas,
modo terapeuta con métricas, más idiomas y **validación con niños y terapeutas** (imprescindible).
Detalles en `docs/INVESTIGACION.md` §4.
