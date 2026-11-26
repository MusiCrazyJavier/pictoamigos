/* ============================================================================
   SECCIÓN: MICRÓFONO-PRACTICA  (js/mic.js)
   ---------------------------------------------------------------------------
   Qué controla: que el niño practique la PRONUNCIACIÓN con el micrófono y la
   app le diga si ha acertado (con felicitación) o le pida repetir.

   SUBSECCIONES:
     A) SECCIÓN: COMPARADOR-DE-VOZ   -> normaliza y compara lo dicho con la palabra
     B) SECCIÓN: MOTOR-NAVEGADOR     -> Web Speech API (0 MB, con modo sin conexión
                                        cuando el navegador lo permite)
     C) SECCIÓN: MOTOR-OFFLINE-VOSK  -> modelo Vosk local (34 MB, funciona sin internet)
     D) SECCIÓN: SELECCION-DE-MOTOR  -> qué motor usar y qué pasa si falla

   API pública:
     Mic.activo()                 -> bool (si el botón de micrófono está activo)
     Mic.umbral()                 -> 0.5 fácil | 0.7 normal | 0.85 estricto
     Mic.comprobar(palabra)       -> Promise<{ok, similitud, texto, motor}>
                                     rechaza con {codigo} cuando no se puede evaluar
     Mic.comparar(objetivo, [textos])  -> {ok, similitud, texto}   (para pruebas)
     Mic.estadoModelo()           -> "listo" | "descargando" | "disponible" | "no"
     Mic.descargarModelo(onPct)   -> Promise<void>  (prepara la voz sin conexión)
     Mic.mensajes[codigo]         -> texto amable para el niño
   Configuración (SECCIÓN: PANTALLA-AJUSTES):
     Mic.config = { activado, umbral, modo }
       umbral: "facil" | "normal" | "estricto"
       modo:   "auto" | "navegador" | "offline"
   Reglas (no romper):
     - Nunca castigar: si falla, se repite la palabra en voz alta y se anima a
       intentarlo otra vez. Sin signos rojos ni mensajes de error al niño.
     - Respeta prefers-reduced-motion (ver UI.felicitar).
   ========================================================================== */

window.Mic = (function () {

  const RUTA_BIBLIOTECA = "js/vendor/vosk.js";
  const RUTA_MODELO = "modelos/vosk-model-small-es-0.3.tar.gz";
  const CACHE_MODELO = "pictoamigos-modelo";
  const TIEMPO_ESPERA = 8000;                 // ms que se escucha antes de rendirse
  const UMBRALES = { facil: 0.5, normal: 0.7, estricto: 0.85 };

  /* ¿App empaquetada (Tauri)? WebKitGTK expone webkitSpeechRecognition pero
     NO funciona (y puede bloquear la ventana), así que en escritorio se usa
     directamente el motor sin conexión (Vosk), igual que con la voz. */
  const EN_ESCRITORIO = !!(window.Voz && window.Voz.escritorio);

  /* Textos amables que ve el niño cuando algo falla */
  const mensajes = {
    desactivado:  "El micrófono está apagado en Ajustes",
    "sin-permiso":"Hay que permitir el micrófono en el navegador (icono de candado/cámara). Si no aparece el aviso, recarga la página.",
    "sin-voz":    "No te he oído… ¡inténtalo otra vez!",
    tiempo:       "Tardaste un poco… repite la palabra, tú puedes",
    "sin-motor":  "Este navegador no deja practicar la voz",
    "sin-modelo": "La voz sin conexión aún no está lista: ve a Ajustes y pulsa «Descargar voz sin conexión»",
    "escritorio-sin-mic": "La práctica de micrófono no está disponible en esta app de escritorio. Ábrela en el navegador (PWA) para practicar la pronunciación.",
    "modelo-no-encontrado": "No encuentro el fichero del modelo en la carpeta «modelos»: falta vosk-model-small-es-0.3.tar.gz",
    "modelo-fallo": "La voz sin conexión no ha arrancado: vuelve a descargarla en Ajustes",
    "sin-biblioteca": "Falta la biblioteca de voz (js/vendor/vosk.js): recarga la página",
    red:          "Sin conexión: la voz sin conexión se descarga la primera vez (Ajustes)",
    vacio:        "No he escuchado nada… ¡otra vez!",
    "no-iniciado":"No pude abrir el micrófono… inténtalo otra vez"
  };

  /* ============================ CONFIGURACIÓN ============================ */
  const cfg = { activado: true, umbral: "normal", modo: "auto" };
  try {
    const g = JSON.parse(localStorage.getItem("pictoamigos.mic") || "null");
    if (g) Object.assign(cfg, g);
  } catch (e) {}
  function guardar() {
    try { localStorage.setItem("pictoamigos.mic", JSON.stringify(cfg)); } catch (e) {}
  }
  function configurar(nuevo) { Object.assign(cfg, nuevo || {}); guardar(); }

  /* ======================================================================
     A) SECCIÓN: COMPARADOR-DE-VOZ
     ==================================================================== */
  function normalizar(t) {
    return String(t || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // quita acentos
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9\s]/g, " ")                       // quita puntuación
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const fila = [i];
      for (let j = 1; j <= n; j++) {
        fila[j] = Math.min(
          prev[j] + 1,
          fila[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = fila;
    }
    return prev[n];
  }

  /** Similitud 0..1 entre dos textos (1 = igual). */
  function similitud(a, b) {
    const x = normalizar(a), y = normalizar(b);
    if (!x && !y) return 1;
    if (!x || !y) return 0;
    if (x === y) return 1;
    const largo = Math.max(x.length, y.length);
    return 1 - levenshtein(x, y) / largo;
  }

  /**
   * Compara la palabra objetivo con lo que el navegador/modelo entendió.
   * candidatos: array de textos (hipótesis) o un solo texto.
   * Devuelve { ok, similitud, texto }.
   */
  function comparar(objetivo, candidatos, umbralNumero) {
    const umbral = umbralNumero != null ? umbralNumero : umbralActual();
    const lista = Array.isArray(candidatos) ? candidatos : [candidatos];
    const obj = normalizar(objetivo);

    let mejor = 0, mejorTexto = "";
    for (const crudo of lista) {
      if (!crudo) continue;
      const t = normalizar(crudo);
      if (!t) continue;

      let s = similitud(obj, t);

      // la palabra sola dentro de una frase ("come" en "come dulces")
      if (s < 1 && obj.length >= 3 && t.includes(obj)) s = Math.max(s, 0.95);
      // varias palabras: también se mira cada palabra suelta
      for (const palabra of t.split(" ")) {
        if (palabra.length >= 3) s = Math.max(s, similitud(obj, palabra));
      }
      if (s > mejor) { mejor = s; mejorTexto = crudo; }
    }
    return { ok: mejor >= umbral, similitud: Math.round(mejor * 100) / 100, texto: mejorTexto };
  }

  function umbralActual() { return UMBRALES[cfg.umbral] != null ? UMBRALES[cfg.umbral] : UMBRALES.normal; }

  /* ======================================================================
     B) SECCIÓN: MOTOR-NAVEGADOR  (Web Speech API)
     ==================================================================== */
  function claseReconocimiento() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }
  function hayNavegador() { return !!claseReconocimiento(); }
  function hayMicrofono() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /** ¿Puede el navegador reconocer sin enviar audio a internet? (Chrome 135+) */
  let modoLocal = null;   // null = desconocido, true/false = conocido
  async function detectarModoLocal() {
    if (modoLocal !== null) return modoLocal;
    try {
      const R = window.SpeechRecognition;
      if (R && typeof R.available === "function") {
        // En WebKitGTK esta promesa puede no resolver NUNCA: tiempo límite.
        const estado = await Promise.race([
          R.available({ langs: ["es-ES"], processLocally: true }),
          new Promise((_, rechazar) =>
            setTimeout(() => rechazar(new Error("timeout")), 3000))
        ]);
        modoLocal = (estado === "available");
      } else modoLocal = false;
    } catch (e) { modoLocal = false; }
    return modoLocal;
  }

  function comprobarNavegador(palabra) {
    const Clase = claseReconocimiento();
    if (!Clase) return Promise.reject({ codigo: "sin-motor" });

    return new Promise((resolve, reject) => {
      let r;
      try { r = new Clase(); } catch (e) { return reject({ codigo: "sin-motor" }); }

      r.lang = "es-ES";
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.continuous = false;
      if (modoLocal === true && "processLocally" in r) {
        try { r.processLocally = true; } catch (e) {}
      }

      let cerrado = false;
      const cerrar = (fn, valor) => {
        if (cerrado) return;
        cerrado = true;
        clearTimeout(temporizador);
        try { r.abort(); } catch (e) {}
        fn(valor);
      };
      const temporizador = setTimeout(() => cerrar(reject, { codigo: "tiempo" }), TIEMPO_ESPERA);

      r.onresult = (ev) => {
        const textos = [];
        for (const res of ev.results) {
          for (const alt of res) textos.push(alt.transcript);
        }
        cerrar(resolve, comparar(palabra, textos));
      };
      r.onerror = (ev) => {
        const err = ev && ev.error;
        const mapa = {
          "not-allowed": "sin-permiso", "service-not-allowed": "sin-permiso",
          "audio-capture": "sin-permiso", "network": "red", "language-not-supported": "red",
          "no-speech": "sin-voz", "aborted": "sin-voz"
        };
        cerrar(reject, { codigo: mapa[err] || (err === "no-speech" ? "sin-voz" : "sin-voz") });
      };
      r.onend = () => { if (!cerrado) cerrar(reject, { codigo: "vacio" }); };

      try { r.start(); }
      catch (e) { cerrar(reject, { codigo: "no-iniciado" }); }
    });
  }

  /* ======================================================================
     C) SECCIÓN: MOTOR-OFFLINE-VOSK  (modelo local, sin internet)
     ==================================================================== */
  let bibliotecaCargando = null;
  let modeloVosk = null;
  let modeloCargando = null;
  let estadoDescarga = "no";     // "no" | "descargando" | "listo"

  function cargarBiblioteca() {
    if (window.Vosk) return Promise.resolve();
    if (bibliotecaCargando) return bibliotecaCargando;
    bibliotecaCargando = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = RUTA_BIBLIOTECA;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { bibliotecaCargando = null; reject({ codigo: "sin-biblioteca" }); };
      document.head.appendChild(s);
    });
    return bibliotecaCargando;
  }

  /** Devuelve la URL del modelo: la caché si existe, o el propio fichero
   *  cuando la app va empaquetada (Tauri) y no hay API de caché. */
  async function obtenerModeloURL(onProgreso) {
    // App de escritorio: el modelo ya va dentro del paquete (dist/modelos/).
    // Se usa la URL ABSOLUTA directa: sin copiar34 MB a un blob ni a la caché
    // (el trabajador de Vosk la descarga desde el origen de la app).
    if (EN_ESCRITORIO || typeof caches === "undefined" || caches === null) {
      onProgreso && onProgreso(1);
      estadoDescarga = "listo";
      try {
        // Blob: el trabajador de Vosk no siempre puede leer tauri://, pero un
        // blob del mismo origen sí (y el fetch del paquete ya funciona).
        const respuesta = await fetch(new URL(RUTA_MODELO, location.href).href);
        if (respuesta.ok) {
          window.Diag && Diag("MIC: modelo leído (" +
            Math.round((Number(respuesta.headers.get("content-length")) || 0) / 1048576) + " MB)");
          return URL.createObjectURL(await respuesta.blob());
        }
      } catch (e) {
        window.Diag && Diag("MIC: blob no disponible → " + e.message);
      }
      return new URL(RUTA_MODELO, location.href).href;
    }

    try {
      const cache = await caches.open(CACHE_MODELO);
      const guardado = await cache.match(RUTA_MODELO);
      if (guardado) {
        estadoDescarga = "listo";
        onProgreso && onProgreso(1);
        return URL.createObjectURL(await guardado.blob());
      }
    } catch (e) { /* sin caché disponible */ }

    let respuesta;
    try {
      respuesta = await fetch(RUTA_MODELO);
    } catch (e) {
      throw { codigo: "red" };                    // sin internet y no está en caché
    }
    if (!respuesta.ok) throw { codigo: "modelo-no-encontrado" };   // 404: falta el fichero

    const total = Number(respuesta.headers.get("content-length")) || 0;
    const partes = [];
    let recibido = 0;
    const lector = respuesta.body.getReader();
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      partes.push(value);
      recibido += value.length;
      onProgreso && onProgreso(total ? Math.min(0.99, recibido / total) : 0);
    }
    const blob = new Blob(partes, { type: "application/gzip" });
    try {
      const cache = await caches.open(CACHE_MODELO);
      await cache.put(RUTA_MODELO, new Response(blob));
    } catch (e) { /* si no se puede guardar, se usa en esta sesión */ }
    estadoDescarga = "listo";
    onProgreso && onProgreso(1);
    return URL.createObjectURL(blob);
  }

  /** Descarga (o recupera) el modelo y lo deja listo para usar sin conexión.
   *  DEVUELVE SIEMPRE el modelo cargado (antes devolvía undefined si ya estaba
   *  en memoria y eso hacía fallar el reconocedor con "sin-modelo"). */
  function descargarModelo(onProgreso) {
    if (modeloVosk) return Promise.resolve(modeloVosk);
    if (modeloCargando) return modeloCargando;
    estadoDescarga = "descargando";
    modeloCargando = (async () => {
      window.Diag && Diag("MIC: cargando biblioteca Vosk…");
      await cargarBiblioteca();
      window.Diag && Diag("MIC: preparando modelo (34 MB)…");
      const url = await obtenerModeloURL(onProgreso);
      window.Diag && Diag("MIC: modelo listo, creando reconocedor…");
      let modelo;
      try {
        modelo = await Promise.race([
          window.Vosk.createModel(url),
          new Promise((_, rechazar) =>
            setTimeout(() => rechazar({ timeout: true }), 25000))
        ]);
      } catch (e) {
        const motivo = e && e.timeout ? "timeout25s"
          : (e && (e.message || e.name)) || (e ? String(e) : "rechazado sin motivo");
        window.Diag && Diag("MIC: createModel falló → " + motivo);
        throw { codigo: "modelo-fallo" };
      }
      if (!modelo) { window.Diag && Diag("MIC: createModel devolvió vacío"); throw { codigo: "modelo-fallo" }; }
      window.Diag && Diag("MIC: reconocedor de Vosk creado ✓");
      modeloVosk = modelo;
      return modelo;
    })().catch((e) => {
      modeloCargando = null;
      estadoDescarga = "no";
      throw (e && e.codigo) ? e : { codigo: "modelo-fallo" };
    });
    return modeloCargando;
  }

  /** ¿Está el modelo listo? (rápido, no lo carga) */
  async function modeloListo() {
    if (modeloVosk) return true;
    //1) ¿ya está en la caché?
    try {
      const cache = await caches.open(CACHE_MODELO);
      if (await cache.match(RUTA_MODELO)) return true;
    } catch (e) { /* seguimos */ }
    // 2) ¿viene integrado en el propio paquete? (dist/modelos/)
    try {
      const r = await fetch(RUTA_MODELO, { method: "HEAD" });
      if (r.ok) return true;
    } catch (e) { /* seguimos */ }
    try {
      return false;
    } catch (e) {
      // Sin API de caché (app empaquetada con Tauri): el modelo viene en el
      // propio paquete, así que basta con que exista el fichero.
      try {
        const r = await fetch(RUTA_MODELO, { method: "HEAD" });
        return r.ok;
      } catch (e2) { return false; }
    }
  }

  /** Escucha con Vosk y devuelve la comparación con la palabra. */
  async function comprobarOffline(palabra, onProgreso) {
    if (!hayMicrofono()) throw { codigo: "sin-permiso" };
    const modelo = await descargarModelo(onProgreso);
    if (!modelo || typeof modelo.KaldiRecognizer !== "function") {
      throw { codigo: "modelo-fallo" };
    }

    window.Diag && Diag("MIC: pidiendo el micrófono al sistema…");
    let stream;
    try {
      const peticion = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });
      // Timeout: en apps empaquetadas (Tauri/Linux) puede no aparecer el
      // diálogo de permiso y la promesa no termina nunca; así el botón
      // vuelve de "escuchando" a su sitio en vez de quedarse para siempre.
      peticion.then(
        (s) => { if (stream !== s) s.getTracks().forEach(t => t.stop()); },
        () => {}
      );
      stream = await Promise.race([
        peticion,
        //20 s: margen para que el usuario lea y acepte el aviso de permiso
        new Promise((_, rechazar) =>
          setTimeout(() => rechazar({ codigo: "sin-permiso" }), 20000))
      ]);
    } catch (e) {
      throw (e && e.codigo) ? e : { codigo: "sin-permiso" };
    }

    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    try { if (contexto.state === "suspended") await contexto.resume(); } catch (e) {}

    let reconocedor;
    try { reconocedor = new modelo.KaldiRecognizer(contexto.sampleRate); }
    catch (e) {
      stream.getTracks().forEach(t => t.stop());
      contexto.close();
      throw { codigo: "modelo-fallo" };
    }

    window.Diag && Diag("MIC: escuchando (espera5 s)…");
    return new Promise((resolve, reject) => {
      let cerrado = false;
      let final = "", parcial = "";
      let temporizador = null;

      const limpiar = () => {
        clearTimeout(temporizador);
        try { reconocedor.remove(); } catch (e) {}
        try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        try { contexto.close(); } catch (e) {}
      };
      const cerrar = (fn, valor) => {
        if (cerrado) return;
        cerrado = true;
        limpiar();
        fn(valor);
      };

      reconocedor.on("result", (msg) => {
        final = (msg && msg.result && msg.result.text) || "";
        if (final.trim()) cerrar(resolve, comparar(palabra, [final]));
      });
      reconocedor.on("partialresult", (msg) => {
        parcial = (msg && msg.result && msg.result.partial) || parcial;
      });

      temporizador = setTimeout(() => {
        try { reconocedor.retrieveFinalResult(); } catch (e) {}
        setTimeout(() => {
          const texto = final || parcial;
          if (texto && texto.trim()) cerrar(resolve, comparar(palabra, [texto]));
          else cerrar(reject, { codigo: "sin-voz" });
        }, 500);
      }, TIEMPO_ESPERA);

      try {
        const fuente = contexto.createMediaStreamSource(stream);
        const proceso = contexto.createScriptProcessor(4096, 1, 1);
        proceso.onaudioprocess = (ev) => {
          try { reconocedor.acceptWaveform(ev.inputBuffer); } catch (e) {}
        };
        fuente.connect(proceso);
        proceso.connect(contexto.destination);   // necesario para que dispare
      } catch (e) {
        cerrar(reject, { codigo: "sin-voz" });
      }
    });
  }

  /* ======================================================================
     D) SECCIÓN: SELECCION-DE-MOTOR
     ==================================================================== */
  function activo() { return !!cfg.activado && hayMicrofono(); }

  async function comprobar(palabra, opciones) {
    // Nunca se queda colgado: si algo se atasca, se avisa en vez de esperar eternamente.
    return await Promise.race([
      comprobarInterno(palabra, opciones),
      new Promise((_, rechazar) =>
        setTimeout(() => rechazar({ codigo: "sin-voz" }), 60000))
    ]);
  }

  async function comprobarInterno(palabra, opciones) {
    const onProgreso = opciones && opciones.onProgreso;
    if (!cfg.activado) throw { codigo: "desactivado" };
    if (!hayMicrofono()) throw { codigo: "sin-permiso" };

    if (cfg.modo === "offline") return comprobarOffline(palabra, onProgreso);

    if (hayNavegador() && !EN_ESCRITORIO) {
      // ATENCIÓN: NO se consulta SpeechRecognition.available() antes: en varios
      // navegadores deja el servicio de reconocimiento colgado y el start()
      // posterior graba sin devolver resultados nunca (micrófono "encendido"
      // pero nada reconocido). Se va directo a start().
      try {
        return await comprobarNavegador(palabra);
      } catch (e) {
        // Solo si el MOTOR falló (sin red, sin soporte…) se usa el sin conexión.
        // Si simplemente no se oyó nada ("sin-voz") no se cambia de motor.
        const reintentables = ["red", "sin-motor", "no-iniciado",
                               "tiempo", "sin-voz", "vacio"];
        if (cfg.modo === "auto" && reintentables.indexOf(e.codigo) >= 0) {
          try {
            return await comprobarOffline(palabra, onProgreso);
          } catch (e2) {
            // Se informa el error REAL del intento con el modelo local
            throw (e2 && e2.codigo) ? e2 : e;
          }
        }
        throw e;
      }
    }
    // Escritorio (o navegador sin reconocimiento): motor sin conexión Vosk.
    // Si el modelo no está descargado, se carga ahora del propio paquete.
    window.Diag && Diag("MIC: usando motor sin conexión (Vosk)…");
    try {
      return await comprobarOffline(palabra, onProgreso);
    } catch (e) {
      // En la app de escritorio, si Vosk no arranca, se avisa con claridad
      // en lugar de dejar el botón esperando.
      if (EN_ESCRITORIO && e && e.codigo === "modelo-fallo") {
        throw { codigo: "escritorio-sin-mic" };
      }
      throw (e && e.codigo) ? e : { codigo: "sin-modelo" };
    }
  }

  async function estadoModelo() {
    if (estadoDescarga === "descargando") return "descargando";
    if (modeloVosk) return "listo";
    return (await modeloListo()) ? "disponible" : "no";
  }

  return {
    activo, comprobar, comparar, similitud, normalizar, umbralActual,
    estadoModelo, descargarModelo, configurar, mensajes,
    hayNavegador, hayMicrofono,
    get config() { return Object.assign({}, cfg); },
    get UMBRALES() { return Object.assign({}, UMBRALES); }
  };
})();
