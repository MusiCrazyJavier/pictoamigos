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
        if (window._diagLineas.length > 4) window._diagLineas.shift();
        cajaDiag.textContent = window._diagLineas.join("  ·  ");
        console.log("[PictoAmigos]", txt);
      } catch (e) {}
    };
    window.Diag("arranque · esc=" + (window.Voz && Voz.escritorio) +
                " · esc=" + (window.Voz ? String(Voz.escritorio) : "s/Voz") +
                " · proto=" + location.protocol +
                " · tauri=" + (window.__TAURI_INTERNALS__ ? "si" : "no"));

    // Registro de errores: sirve para diagnosticar la app empaquetada
    // (verlos con: WEBKIT_DEBUG=1 ./pictoamigos)
    window.addEventListener("error", (e) => {
      console.error("[PictoAmigos] error:", e.message, "|", e.filename, ":", e.lineno);
      cajaDiag.hidden = false;
      window.Diag && window.Diag("ERROR: " + e.message + " (" + e.lineno + ")");
    });
    window.addEventListener("unhandledrejection", (e) => {
      console.error("[PictoAmigos] promesa rechazada:", e.reason);
    });

    // El primer toque desbloquea el audio (requisito de los navegadores)
    const desbloquear = () => { Voz.desbloquearAudio(); };
    window.addEventListener("pointerdown", desbloquear, { once: true });
    window.addEventListener("keydown", desbloquear, { once: true });

    // Botones de la cabecera
    document.getElementById("boton-volver").addEventListener("click", volver);
    document.getElementById("boton-ajustes").addEventListener("click", () => {
      if (estado.pantalla !== "ajustes") irA("ajustes");
    });

    // Gestos (se instalan una sola vez; cada pantalla define sus acciones)
    Gestos.instalar(vista);
    Gestos.actualizar({});

    render();

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
