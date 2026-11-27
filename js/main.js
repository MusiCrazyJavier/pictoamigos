/* ============================================================================
   SECCIÓN: CONTROLADOR-PRINCIPAL  (js/main.js)
   ---------------------------------------------------------------------------
   Qué controla: en qué pantalla estamos, cómo se navega y el arranque de la app.
   - Estado: { pantalla, nivelId, fraseIdx, retorno }
   - Pantallas disponibles: "home" | "nivel" | "frases" | "ajustes"
   - Cambia el título de la cabecera y muestra/oculta el botón de atrás.
   - Arranca los gestos (SECCIÓN: GESTOS-NAVEGACION) y el service worker.
   Cómo modificar:
     - Pantalla inicial: buscar PANTALLA_INICIAL.
     - Añadir una pantalla nueva:
         1. Crea la función en SECCIÓN: PANTALLAS (js/screens.js).
         2. Añádela al mapa PANTALLAS_DE_ABAJO.
         3. Llámala desde donde quieras: ctx.irA("miPantalla", { datos }).
     - Título de cada pantalla: mapa TITULOS.
   ========================================================================== */

(function () {

  const PANTALLA_INICIAL = "home";

  const estado = {
    pantalla: PANTALLA_INICIAL,
    nivelId: null,
    fraseIdx: 0,
    retorno: null          // pantalla desde la que se abrió Ajustes
  };

  const TITULOS = {
    home: "PictoAmigos",
    nivel: () => {
      const todos = (window.NIVELES || []).concat(window.CUERPO_NIVELES || []);
      const n = todos.find(x => x.id === estado.nivelId);
      return n ? n.nombre : "Nivel";
    },
    frases: "Formar Frases",
    ajustes: "Ajustes",
    creditos: "Créditos"
  };

  const PANTALLAS_DE_ABAJO = {
    home: () => Pantallas.home(ctx),
    nivel: () => Pantallas.nivel(ctx),
    frases: () => Pantallas.frases(ctx),
    ajustes: () => Pantallas.ajustes(ctx),
    creditos: () => Pantallas.creditos(ctx)
  };

  /* ---------- NAVEGACIÓN ---------- */
  function irA(pantalla, datos, sinApilar) {
    if (!PANTALLAS_DE_ABAJO[pantalla]) return;
    // Pantallas "apilables" (Ajustes, Créditos): al volver se regresa a la anterior
    if (!sinApilar && (pantalla === "ajustes" || pantalla === "creditos")
        && estado.pantalla !== pantalla) {
      estado.retorno = {
        pantalla: estado.pantalla,
        nivelId: estado.nivelId,
        fraseIdx: estado.fraseIdx,
        anterior: estado.retorno || null      // pila para no perder el origen
      };
    }
    if (pantalla === "home") estado.retorno = null;
    estado.pantalla = pantalla;
    Object.assign(estado, datos || {});
    render();
  }

  function volver() {
    if (estado.retorno) {
      const r = estado.retorno;
      estado.retorno = r.anterior || null;
      irA(r.pantalla, { nivelId: r.nivelId, fraseIdx: r.fraseIdx }, true);
      return;
    }
    if (estado.pantalla !== PANTALLA_INICIAL) irA(PANTALLA_INICIAL);
  }

  const ctx = { irA, volver, estado };

  /* ---------- PINTAR PANTALLA ---------- */
  function render() {
    const vista = document.getElementById("vista");
    const titulo = document.getElementById("titulo-cabecera");
    const botonVolver = document.getElementById("boton-volver");

    Voz.detener();                       // nada de voces encadenadas al cambiar
    vista.innerHTML = "";

    const construir = PANTALLAS_DE_ABAJO[estado.pantalla] || PANTALLAS_DE_ABAJO.home;
    vista.appendChild(construir());

    const t = TITULOS[estado.pantalla];
    titulo.textContent = typeof t === "function" ? t() : t;
    botonVolver.hidden = estado.pantalla === PANTALLA_INICIAL;
    document.title = (typeof t === "function" ? t() : t) + " — PictoAmigos";

    vista.scrollTop = 0;
    UI.anunciar(titulo.textContent);
  }

  /* ---------- PANTALLA DE CARGA ----------
     Mientras llegan los pictogramas (y GStreamer termina de prepararse en la
     app de escritorio) se muestra una pantalla amable. Se oculta cuando las
     imágenes de la PRIMERA pantalla están cargadas, o a los 6 s como máximo
     (así, sin internet, no se queda bloqueada nunca). */
  function iniciarCarga() {
    const pantalla = document.getElementById("pantalla-carga");
    if (!pantalla) return;
    const t0 = Date.now();
    let ocultada = false;

    const esconder = () => {
      if (ocultada) return;
      ocultada = true;
      // Mínimo1,5 s visible: si no, la ventana de escritorio termina de
      // aparecer cuando la pantalla ya se fue y el usuario ni la ve.
      const espera = Math.max(0, 1500 - (Date.now() - t0));
      setTimeout(() => {
        pantalla.classList.add("oculta");
        // se retira del DOM al terminar la transición (no estorba al foco)
        setTimeout(() => { try { pantalla.remove(); } catch (e) {} }, 500);
      }, espera);
    };

    // 1) esperar a que carguen las <img> ya pintadas en la primera pantalla
    const imagenes = Array.from(document.querySelectorAll("#vista img"));
    if (imagenes.length) {
      let pendientes = imagenes.length;
      const unaMenos = () => { if (--pendientes <= 0) esconder(); };
      imagenes.forEach(img => {
        if (img.complete) { unaMenos(); return; }
        img.addEventListener("load", unaMenos, { once: true });
        img.addEventListener("error", unaMenos, { once: true });
      });
    } else {
      esconder();
    }

    // 2) red de seguridad: nunca más de 6 s (por si una imagen no responde)
    setTimeout(esconder, 6000);   // tope máximo
  }

  /* ---------- ARRANQUE ---------- */
  function iniciar() {
    const vista = document.getElementById("vista");

    /* ======================================================================
       SECCIÓN: DIAGNÓSTICO — línea de estado abajo a la izquierda, solo en
       la app empaquetada. Si la ventana se bloquea, esa línea indica en qué
       paso se quedó (README: «bloqueos en la app de escritorio»).
       ==================================================================== */
    const cajaDiag = document.createElement("div");
    cajaDiag.id = "diagnostico";
    cajaDiag.hidden = true;   // se muestra solo si hay un error
    document.body.appendChild(cajaDiag);
    window._diagLineas = [];
    window.Diag = function (txt) {
      try {
        window._diagLineas.push(txt);
        if (window._diagLineas.length > 14) window._diagLineas.shift();
        cajaDiag.textContent = window._diagLineas.join("  ·  ");
        console.log("[PictoAmigos]", txt);
      } catch (e) {}
    };
    cajaDiag.hidden = true;   // se muestra SOLO si hay un error
    window.Diag("[" + (window.__BUILD_STAMP__ || "sin marca") + "] esc=" + (window.Voz && Voz.escritorio) +
                " · esc=" + (window.Voz ? String(Voz.escritorio) : "s/Voz") +
                " · proto=" + location.protocol +
                " · tauri=" + (window.__TAURI_INTERNALS__ ? "si" : "no"));

    // Registro de errores: sirve para diagnosticar la app empaquetada
    // (verlos con: WEBKIT_DEBUG=1 ./pictoamigos)
    window.addEventListener("error", (e) => {
      console.error("[PictoAmigos] error:", e.message, "|", e.filename, ":", e.lineno);
      cajaDiag.hidden = false;   // se muestra SOLO si hay un error
      window.Diag && window.Diag("ERROR: " + e.message + " (" + e.lineno + ")");
    });
    window.addEventListener("unhandledrejection", (e) => {
      console.error("[PictoAmigos] promesa rechazada:", e.reason);
    });



    // El primer toque desbloquea el audio (requisito de los navegadores)
    const desbloquear = () => { Voz.desbloquearAudio(); };
    window.addEventListener("pointerdown", desbloquear, { once: true });
    window.addEventListener("keydown", desbloquear, { once: true });


    // PRECARGA: en la app de escritorio se cargan los MP3 y se calienta el
    // reproductor (GStreamer) desde que se abre, para que el primer clic en
    // una tarjeta suene YA (antes tardaba 9-10 s en escanear plugins).
    if (window.Voz && Voz.precargar) {
      setTimeout(() => { try { Voz.precargar(); } catch (e) {} }, 300);
    }

    // Botones de la cabecera
    document.getElementById("boton-volver").addEventListener("click", volver);
    document.getElementById("boton-ajustes").addEventListener("click", () => {
      if (estado.pantalla !== "ajustes") irA("ajustes");
    });

    // Gestos (se instalan una sola vez; cada pantalla define sus acciones)
    Gestos.instalar(vista);
    Gestos.actualizar({});

    render();

    // PANTALLA-DE-CARGA: se oculta cuando las imágenes de la primera pantalla
    // han llegado (o a los 6 s como máximo, por si no hay red). Se muestra
    // al menos 700 ms para que no parpadee.
    iniciarCarga();

    // PWA: solo en el navegador. En la app empaquetada todo es local y el
    // Service Worker solo podría servir contenido cacheado antiguo: se omite
    // su registro y se desregistra el que hubiera de versiones anteriores.
    if ("serviceWorker" in navigator) {
      const enEscritorio = !!(window.Voz && Voz.escritorio);
      window.addEventListener("load", () => {
        if (enEscritorio) {
          navigator.serviceWorker.getRegistrations()
            .then((rs) => rs.forEach((r) => r.unregister()))
            .catch(() => {});
          return;
        }
        navigator.serviceWorker.register("sw.js")
          .catch((err) => console.warn("Sin modo offline:", err));
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

})();
