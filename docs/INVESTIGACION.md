# 🔬 INVESTIGACIÓN — Cómo se diseñó PictoAmigos

> Sección: **INVESTIGACIÓN** · Fichero: `docs/INVESTIGACION.md`
> Resume qué se investigó, qué conclusiones se aplicaron y **dónde está cada decisión en el código**.
> Si una recomendación entra en conflicto con un cambio pedido, avisar antes de romperla.

---

## 1. Fuentes consultadas

| Fuente | Aportación principal |
|---|---|
| **ARASAAC** (Gobierno de Aragón) — arasaac.org y su API | Banco de +11.000 pictogramas gratuitos, usados por profesionales con niños con TEA; licencia CC BY-NC-SA. |
| *Design Specifications of AAC Apps for Individuals with ASD* (Intl. Journal of Technology in Education, 2023) | Fondo brillante y simple, pantalla a pantalla completa, sin elementos ajenos a la tarea, rejillas con agrupación y pistas espaciales. |
| *User-Centered Design and AAC Apps for Children With ASD* (SAGE, Lubas et al., 2014) | Diseño centrado en el usuario real (niño + terapeuta + familia); probar con usuarios antes de dar por bueno. |
| **Global Symbols – AAC Symbol Design Guidelines** (con UNICEF, 2025) | Iconicidad (que el símbolo se parezca a lo que representa), contornos claros, etiquetas de texto **fuera** de la imagen (para poder traducir), colores por categoría de palabras. |
| *Guía de buenas prácticas en el uso de pictogramas* (Autismo España + Cátedra de Autismo U. de Sevilla, 2026) | Pictogramas estandarizados y universales, mensajes simples y sin ruido visual, validación con personas usuarias, WCAG 2.1/2.2. |
| **Digital Accessibility Toolkit (Gobierno de Canadá)** — *Designing for users on the autism spectrum* | Usar colores simples, lenguaje llano, botones descriptivos, layouts simples y consistentes; **evitar** colores vivos contrastados, metáforas y muros de texto. |
| **OpenAAC — Considerations for Developers** | Mantener la app estable a largo plazo (los usuarios conservan sus dispositivos años), rejilla simple, sin cambios bruscos de interfaz. |
| *Comparison of ARASAAC vs commercial pictograms in children with ASD* (2025) | ARASAAC mostró mejores resultados que sets comerciales en comunicación receptiva/expressiva (iconicidad + personalización). |
| EZ COMMS (2020) y PicEA (Navarra) | Patrón funcional probado: **categorías → rejilla de pictogramas → tocar = escuchar**; y **frases = sujeto + verbo + predicado**. |

---

## 2. Decisiones tomadas (investigación → código)

| # | Hallazgo de la investigación | Decisión en PictoAmigos | Dónde está |
|---|---|---|---|
| 1 | ARASAAC es el set con mejor evidencia con niños con TEA y está en español | Se usan **IDs verificados visualmente** de la API pública de ARASAAC | **DATOS-PICTOGRAMAS** |
| 2 | «Interfaz simple, sin estímulos que distraigan» | Fondo crema liso, una sola tarjeta por concepto, sin publicidad, sin menús anidados, sin parpadeos | **SISTEMA-DISEÑO** (`B) BASE`) |
| 3 | «Tamaño y posición de los visuales deben ser funcionales» + objetivos táctiles | Tarjetas grandes (mín. 72 px), rejillas de 2 columnas en móvil, 4–5 en PC | **SISTEMA-DISEÑO** (`D`, `E`, `J`) |
| 4 | Pictogramas estandarizados y con texto fuera de la imagen | La palabra va **debajo** del pictograma en su propio elemento (permite cambiar idioma y leer) | **COMPONENTES-UI** |
| 5 | Iconicidad: el símbolo debe adivinarse sin aprendizaje previo | Se descartaron imágenes ambiguas (p. ej. «triángulo» = instrumento musical → se cambió por la forma; «rosa» flor → mancha de color rosa) | **DATOS-PICTOGRAMAS** (verificado a mano) |
| 6 | Lenguaje llano, frases cortas | Frases de **3–4 palabras** en estructura sujeto+verbo+predicado | **DATOS-FRASES** |
| 7 | Reforzar positivamente; nada de castigos ni alertas agresivas | Error = sacudida suave + **se pronuncia igualmente** la palabra tocada; acierto = «¡Muy bien!» + campanita suave | **PANTALLA-FRASES** |
| 8 | Consistencia y previsibilidad (reduce la ansiedad) | Barra superior siempre igual, botón atrás siempre en el mismo sitio, la app **siempre arranca en HOME** | **CONTROLADOR-PRINCIPAL** |
| 9 | Movimientos predecibles; algunos usuarios son sensibles al movimiento | Animaciones cortas (≤ 0,35 s) y **respeto a `prefers-reduced-motion`** | **SISTEMA-DISEÑO** (`I`, `K`) |
| 10 | Accesibilidad cognitiva + WCAG | Contraste alto, foco visible, `aria-live` para anunciar, sin parpadeos | **SISTEMA-DISEÑO** (`K`), **NÚCLEO-HTML** |
| 11 | Móvil + tablet + PC (y uso en aula con conexión irregular) | PWA: se instala como app y **funciona sin internet** una vez usada | **PWA-IDENTIDAD**, **PWA-OFFLINE** |
| 12 | Desplazamiento natural entre pantallas | Gestos: deslizar izq/der, volver desde el borde, ratón y flechas del teclado | **GESTOS-NAVEGACION** |
| 13 | Sin fricción operativa | **Doble fuente de voz**: MP3 incluidos (siempre funcionan) + Web Speech API si el sistema tiene voces; velocidad ajustable | **MOTOR-DE-VOZ**, **SONIDOS-LOCALES**, **GENERADOR-DE-AUDIOS** |
| 14 | Diferenciar categorías por color (Goossens'/Fitzgerald) | Cada nivel tiene un fondo de color suave propio (sin saturación) | **DATOS-NIVELES** (`color`) |

---

## 3. Estrategia de voz (decisión tras la investigación)

La primera versión usaba solo **Web Speech API**. En la prueba real apareció el problema
*«no se escucha la voz»*: **el navegador no tenía ninguna voz instalada** (`getVoices()` = 0),
así que `speechSynthesis.speak()` no producía sonido. Solución aplicada (doble fuente):

| Fuente | Ventaja | Límite |
|---|---|---|
| **Voz incluida** (`/audio/*.mp3`, generada con **Piper TTS**, voz neuronal,96 kbps) | Funciona **siempre**: sin instalar voces, offline, mismo sonido en todos los dispositivos, y **suena natural** | Hay que regenerarla al añadir palabras (`tools/generar-audios.py`); necesita Piper instalado una sola vez (ver cabecera del script) |
| **Voz del dispositivo** (Web Speech API) | Natural y gratis, se adapta a cualquier palabra | Depende de que el sistema tenga voces en español |

- Modo **automático** (por defecto): usa la voz del sistema si la hay; si no, la incluida.
- El usuario puede forzar cualquiera de las dos en **PANTALLA-AJUSTES → Origen de la voz**.
- Las palabras sin MP3 caen automáticamente a la otra fuente.
- **Actualización:** la voz incluida se generaba con `espeak-ng` (muy robótica) y se pasó a
  **Piper TTS** (voz neuronal, offline, gratuita) → mismo mecanismo, mucha más naturalidad.
  Para cambiar de voz: `python3 tools/generar-audios.py --muestra` (escuchar opciones) y
  `--voz NOMBRE` (regenerar). Ver `tools/generar-audios.py`.

---

## 3bis. Práctica de pronunciación con micrófono (investigación y decisión)

**Objetivo:** que el niño diga la palabra y la app le diga si ha acertado, con
**refuerzo positivo** (las guías de diseño para TEA recomiendan animar y nunca castigar:
por eso un fallo es una burbuja «¡Otra vez!» + repetir la palabra, jamás un error rojo).

**Opciones estudiadas:**

| Opción | Tamaño | ¿Sin internet? | Veredicto |
|---|---|---|---|
| **Web Speech API** (`SpeechRecognition`) | 0 MB | Solo si el navegador permite modo local (Chrome 135+/Edge con `processLocally`; en el resto el audio va al servidor) | ✅ Motor principal: gratis, en todos los navegadores, sin instalar nada |
| **Vosk en WebAssembly** (modelo español) | 34 MB + 5,6 MB de biblioteca | ✅ Total | ✅ Motor de respaldo: cargado en **2,9 s** en pruebas y **sin necesitar cabeceras COOP/COEP** (verificado con `crossOriginIsolated = false`) |
| Whisper.cpp (WASM) | 75–150 MB | ✅ | ❌ Demasiado grande y lento para tablets |
| Modelo de detección de palabra (TensorFlow.js) | 1–5 MB | ✅ | ❌ Habría que entrenarlo con voz de niños; sin datos, no fiable |
| Comparar grabación con el MP3 de referencia (DTW) | 0 MB | ✅ | ❌ La voz de referencia es sintética (espeak): no distingue bien pronuncias reales |

**Cómo se juzga si acierta** (SECCIÓN: COMPARADOR-DE-VOZ):

- Normalización: minúsculas, sin acentos, `ñ`→`n`, sin puntuación.
- Distancia de Levenshtein → similitud 0–1; se acepta si supera el umbral
  (**0,5 fácil · 0,7 normal · 0,85 estricto**), configurable porque algunos niños tienen
  dislalia o pronunciación atípica: ser demasiado estricto sería desmotador.
- Tolerancias: «come» cuenta dentro de «come dulces»; se mira también cada palabra suelta.

**Datos de privacidad:** con el motor del navegador en modo local el audio no sale del
dispositivo; con Vosk nunca sale. Con el modo nube del navegador, el audio va al servicio
del proveedor (indicado en Ajustes como «Automático»).

**Pendiente:** validar con niños reales y terapeutas (imprescindible según la literatura
de diseño centrado en el usuario) y ajustar el umbral por niño.

---

## 4. Recomendaciones futuras (roadmap informado)

1. **Personalización por niño**: permitir a la familia subir fotos propias (p. ej. «mi mamá») — recomendación de diseño centrado en el usuario.
2. **Tablero de comunicación** (PECS): elegir pictogramas para construir mensajes libres, no solo frases cerradas.
3. **Agenda visual** con pictogramas (rutinas «primero – después»), alta utilidad en TEA.
4. **Modo terapeuta**: medir aciertos/errores y exportar informes (aquí encaja también el **micrófono**: nº de intentos, umbral usado y tiempo de respuesta).
5. **Micrófono en la pantalla de frases**: el niño podría decir la palabra en lugar de tocarla.
6. **Umbral por niño** y calibración automática a partir de los primeros intentos.
7. **Idioma extra** (catalán, inglés, francés): ARASAAC ya tiene traducciones; cambiar `CAMBIAR_IDIOMA` en **MOTOR-DE-VOZ** y las etiquetas.
8. **Validación con usuarios** (obligatorio según la literatura): probar con 2–3 niños y sus terapeutas antes de dar la app por terminada.
9. **Velocidad por palabra**: al comparar voces se vio que algunas palabras suenan mejor con `es_MX-claude-high` y otras con `es_MX-claude-high-lento` (×1,25). Pendiente decidirla palabra a palabra y regenerar solo esas. Comparación actual: `tools/voces-ejemplo/index.html` (6 voces ×20 palabras).

---

## 4bis. Contenido de «Mi cuerpo y mi seguridad» (investigación y criterios)

**Por qué existe:** la sexualidad y el autocuidado de las personas con TEA se ignoran con
frecuencia y es un área que **familias, maestros y terapeutas trabajan desde pequeños**
(CHOP recomienda empezar «cinco años antes de que creas que hace falta», por la repetición).
La app recoge ese contenido en una sección **desactivada por defecto** con **puerta de adulto**.

**Fuentes consultadas:**

| Fuente | Aportación |
|---|---|
| **CHOP – CAR Autism Roadmap** (*Teaching Young Children about Sexuality*, *Sexuality Instruction for Tweens*) | Temas para infantil: partes del cuerpo · niños vs niñas · **público/privado** · toques apropiados/inapropiados · introducción a la pubertad. En mayores: anatomía, actos, relaciones, seguridad/leyes, valores. Enseñar **5 años antes**, repetir, ser **exacto, concreto y visual** (Social Stories™), usar **nombres reales**. |
| **Seattle Children's Autism Center** (2024) | Educación sexual integral también para autistas; consentimiento, habilidades de comunicación, **privado vs público**, «decir no». |
| **Autismo España** – *Educación afectivo-sexual en personas con TEA* (formación para profesionales) | Trabajar con **SAAC y pictogramas**, guías sociales y agendas; **límites corporales**, intimidad, gestión de tiempos y espacios; prevenir y detectar el abuso tempranamente. |
| **Vanderbilt VKC** – *Orientación sobre pubertad, sexo y sexualidad* | Directrices de enseñanza: **terminología correcta y directa, sin metáforas** · apoyos visuales y narrativas sociales · **soluciones concretas** · **repetir** · actitud positiva · **no avergonzar ni castigar** los comportamientos privados: redirigir. |
| **Davies et al. (2022)** – *Sexuality Education for Children and Youth With ASD* (Canadá) | Mismos contenidos que los iguales, pero con **enseñanza explícita**: narrativas sociales, materiales **concretos y visuales**, mucha repetición, modelado en vídeo; **consentimiento** como habilidad; **seguridad personal → capacidad de denunciar**. |
| **Autism Spectrum News** (2017) | Cuatro áreas: **autocuidado** (higiene), **habilidades de relación**, **conocimiento del cuerpo** y **seguridad personal**. |
| **OAR** – *Sex Ed for Self-Advocates* | Público vs privado · cuerpo y pubertad. |
| **Guía escolar (Reino Unido)** – *The Underwear Rule / Kiko* | Regla de la ropa interior, **público/privado**, hablar de masturbación con **calma y sin juicios**, historias sociales y *comic strip conversations*. |
| **Colección Be Safe** (PAAutism) | Historias sociales: partes privadas, toque consentido, qué es el abuso, **a quién contárselo**. |
| **Research Autism** (Cauchi,2026) | Método: **evaluación → objetivos → enseñanza → mantenimiento**; descomponer habilidades grandes en **componentes pequeños** (consentimiento = pedir permiso, esperar, aceptar el «no»…). |

**Cómo se cumple cada criterio en la app:**

| Criterio profesional | Dónde está en PictoAmigos |
|---|---|
| Terminología correcta y directa, sin metáforas | Palabras literales: *verdad, respeto, decidir, desnudo, menstruación, intimidad* (DATOS-CUERPO-Y-SEGURIDAD) |
| Concreto y visual | Cada palabra =1 pictograma + texto + voz al tocarla |
| Repetitivo | Mecánica base de la app: tocar = escuchar, cuantas veces quiera |
| Dividir en trozos pequeños |5 sub-niveles de12–20 palabras: *Mi cuerpo · Higiene · Público y privado · Límites y seguridad · Pubertad* |
| Autocuidado como punto de entrada | Sub-nivel *Higiene* (lavar las manos, ducharse, cepillarse los dientes…) |
| Conocimiento del cuerpo | Sub-nivel *Mi cuerpo* (20 partes) |
| Público/privado | Sub-nivel *Público y privado* (puerta, cerrar, ventana, intimidad, desnudo, espejo) |
| Límites y consentimiento («no funcional», pedir permiso, aceptar el no) | Sub-nivel *Límites y seguridad* (no, parar, decidir, respeto, no me gusta, sí, ayuda, contar a alguien) |
| Seguridad: a quién contárselo | *contar a alguien*, *decir la verdad*, *confiar*, *ayuda* |
| Pubertad antes de que ocurra | Sub-nivel *Pubertad* (crecer, sudor, barba, menstruación, voz, adolescente…) |
| Sin vergüenza ni castigo | Nunca hay errores rojos ni mensajes negativos en esta sección (regla global de la app) |
| Que lo active un adulto | **Desactivados por defecto** y **dos interruptores con puerta de adulto** (autocuidado vs temas sensibles) en Ajustes: el adulto decide qué grupo ve el niño |
| Validar con personas usuarias | Página de revisión de imágenes: `tools/revision-cuerpo.py` |

**Deliberadamente NO incluido en esta versión** (y por qué): actos sexuales, métodos de
contracepción, orientación e identidad de género, pornografía y aspectos legales. Son temas
de **adolescentes/adultos** según CHOP y OAR; la app es para niños. Quedan en el roadmap (§4).
Tampoco se incluyeron anatomías explícitas: solo partes públicas y el **concepto** de privacidad,
que es lo que la guía de infantil prioriza.



Los pictogramas son propiedad del **Gobierno de Aragón**, creados por **Sergio Palao para ARASAAC**
y se distribuyen bajo licencia **Creative Commons BY-NC-SA**:

- **BY** → hay que citar la fuente: *«Autor pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC (BY-NC-SA). Propiedad: Gobierno de Aragón (España)»*.
- **NC** → **no se puede usar con fines comerciales** (vender la app, incluir publicidad, etc.).
- **SA** → las obras derivadas se comparten con la misma licencia.

Si algún día la app se quisiera comercializar, habría que contactar con ARASAAC o cambiar de set de pictogramas.
