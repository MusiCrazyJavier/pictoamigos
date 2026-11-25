/* ============================================================================
   SECCIÓN: COMPONENTES-UI  (js/ui.js)
   ---------------------------------------------------------------------------
   Qué controla: las piezas gráficas reutilizables (tarjetas, botones, avisos).
   Si quieres cambiar CÓMO se ve una tarjeta de pictograma, cambia aquí.
   API pública:
     UI.urlPicto(id, tam)              -> URL de la imagen ARASAAC
     UI.imagenPicto(id, texto, tam)    -> elemento <img> con respaldo de texto
     UI.tarjetaPictograma(opciones)    -> tarjeta redondeada grande (niveles)
     UI.tarjetaPalabra(opciones)       -> tarjeta de opción (pantalla de frases)
     UI.tarjetaNivel(nivel, onClic)    -> tarjeta de nivel (home)
     UI.boton(texto, clase, onClic)    -> botón redondeado
     UI.barajar(array)                 -> copia desordenada
     UI.anunciar(texto)                -> aviso para lectores de pantalla
     UI.mostrarAviso(texto)            -> aviso flotante visible
   Reglas de diseño (no romper):
     - Esquinas redondeadas: la clase .tarjeta aplica border-radius.
     - Objetivo táctil mínimo: 72px de alto (accesibilidad motriz).
     - Nunca usar colores vivos de fondo ni parpadeos.
   ========================================================================== */

window.UI = (function () {

  const CDN = "https://static.arasaac.org/pictograms/";

  function urlPicto(id, tam = 300) {
    if (!id) return null;
    return CDN + id + "/" + id + "_" + tam + ".png";
  }

  /** <img> con respaldo: si falla la imagen, queda el texto en su lugar. */
  function imagenPicto(id, texto, tam = 300) {
    const caja = document.createElement("span");
    caja.className = "contenedor-imagen";
    const src = urlPicto(id, tam);
    if (!src) { caja.classList.add("sin-imagen"); caja.textContent = texto || ""; return caja; }

    const img = document.createElement("img");
    img.className = "pictograma";
    img.src = src;
    img.alt = texto || "";
    // Carga inmediata (no "lazy"): son pocas imágenes pequeñas y así quedan
    // guardadas en la caché para funcionar sin conexión.
    img.decoding = "async";
    img.draggable = false;
    img.addEventListener("error", function () {
      caja.classList.add("sin-imagen");
      caja.textContent = texto || "";
    }, { once: true });
    caja.appendChild(img);
    return caja;
  }

  function construir({ clase, etiqueta, picto, texto, tam, color, onClic, aria }) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = clase;
    if (color) b.style.background = color;
    if (aria) b.setAttribute("aria-label", aria);

    if (picto) b.appendChild(imagenPicto(picto, texto, tam || 300));

    const t = document.createElement("span");
    t.className = "etiqueta";
    t.textContent = texto || "";
    b.appendChild(t);

    b.addEventListener("click", (ev) => { ev.preventDefault(); onClic && onClic(ev); });
    return b;
  }

  /* ==========================================================================
     SECCIÓN: BOTÓN-DE-MICRÓFONO
     --------------------------------------------------------------------------
     Tarjeta de pictograma con un botón de micrófono encima (esquina superior
     derecha) para practicar la pronunciación. El botón es un hermano de la
     tarjeta (nunca un botón dentro de otro botón: eso no es válido en HTML).
     ======================================================================== */
  const ICONO_MICROFONO =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 1 0-7 0v5A3.5 3.5 0 0 0 12 15zm6-3.5a6 6 0 0 1-5 5.91V20h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.59A6 6 0 0 1 6 11.5h2a4 4 0 1 0 8 0h2z"/></svg>';

  function botonMic(palabra, onMic) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton-mic";
    b.innerHTML = ICONO_MICROFONO;
    b.setAttribute("aria-label", "Practicar la pronunciación de " + palabra);
    b.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();                 // que no abra/nombre la tarjeta
      onMic && onMic(palabra, b);
    });
    return b;
  }

  /** Tarjeta grande con pictograma + palabra (pantalla de nivel). */
  function tarjetaPictograma({ palabra, pictoId, onClic, onMic }) {
    const tarjeta = construir({
      clase: "tarjeta tarjeta-pictograma",
      picto: pictoId,
      texto: palabra,
      tam: 300,
      aria: "Pronunciar " + palabra,
      onClic
    });
    if (!onMic) return tarjeta;

    const envoltura = document.createElement("div");
    envoltura.className = "envoltura-tarjeta";
    envoltura.appendChild(tarjeta);
    envoltura.appendChild(botonMic(palabra, onMic));
    return envoltura;
  }

  /** Tarjeta de opción de palabra (pantalla formar frases). */
  function tarjetaPalabra({ palabra, pictoId, onClic, claseExtra }) {
    return construir({
      clase: "tarjeta tarjeta-palabra" + (claseExtra ? " " + claseExtra : ""),
      picto: pictoId,
      texto: palabra,
      tam: 300,
      aria: "Palabra " + palabra,
      onClic
    });
  }

  /** Tarjeta de nivel del home. */
  function tarjetaNivel(nivel, onClic) {
    const idPicto = window.PICTOS ? window.PICTOS[nivel.icono] : null;
    const b = construir({
      clase: "tarjeta tarjeta-nivel",
      picto: idPicto,
      texto: nivel.nombre,
      tam: 300,
      color: nivel.color,
      aria: "Abrir nivel " + nivel.nombre,
      onClic
    });
    return b;
  }

  function boton(texto, clase, onClic) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton " + (clase || "");
    b.textContent = texto;
    b.addEventListener("click", (ev) => { ev.preventDefault(); onClic && onClic(ev); });
    return b;
  }

  function barajar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function anunciar(texto) {
    const n = document.getElementById("anuncio");
    if (n) { n.textContent = ""; setTimeout(() => { n.textContent = texto; }, 30); }
  }

  let temporizadorAviso = null;
  function mostrarAviso(texto) {
    const n = document.getElementById("aviso");
    if (!n) return;
    n.textContent = texto;
    n.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { n.hidden = true; }, 2200);
    anunciar(texto);
  }

  /* ==========================================================================
     SECCIÓN: FELICITACIONES
     --------------------------------------------------------------------------
     Animación breve de premio cuando el niño pronuncia bien, y burbuja suave
     de "otra vez" cuando hay que repetir. Nada de castigos ni colores rojos.
     ======================================================================== */
  const PARTICULAS = ["★", "♥", "✦", "●", "✚"];

  function felicitar(contenedor, texto) {
    if (!contenedor) return;
    contenedor.classList.add("con-celebracion");

    const caja = document.createElement("div");
    caja.className = "celebracion";
    caja.setAttribute("aria-hidden", "true");

    const distintivo = document.createElement("span");
    distintivo.className = "distintivo-exito";
    distintivo.textContent = texto || "¡Muy bien!";
    caja.appendChild(distintivo);

    const reducido = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reducido) {
      for (let i = 0; i < 12; i++) {
        const p = document.createElement("span");
        p.className = "chispa";
        p.textContent = PARTICULAS[i % PARTICULAS.length];
        p.style.left = (6 + Math.random() * 88) + "%";
        p.style.setProperty("--retraso", (Math.random() * 0.35).toFixed(2) + "s");
        p.style.setProperty("--giro", (Math.random() * 60 - 30).toFixed(0) + "deg");
        caja.appendChild(p);
      }
    }
    contenedor.appendChild(caja);
    setTimeout(() => {
      caja.remove();
      contenedor.classList.remove("con-celebracion");
    }, 1700);
  }

  /** Burbuja corta de aviso sobre la tarjeta ("¡Otra vez!", "Permite el micrófono"). */
  function burbuja(contenedor, texto, larga) {
    if (!contenedor) return;
    const vieja = contenedor.querySelector(".burbuja");
    if (vieja) vieja.remove();
    const b = document.createElement("span");
    b.className = "burbuja" + (larga ? " burbuja-larga" : "");
    b.textContent = texto;
    b.setAttribute("role", "status");
    contenedor.appendChild(b);
    setTimeout(() => b.remove(), larga ? 3200 : 1900);
  }

  return { urlPicto, imagenPicto, tarjetaPictograma, tarjetaPalabra, tarjetaNivel,
           boton, barajar, anunciar, mostrarAviso, felicitar, burbuja };
})();
