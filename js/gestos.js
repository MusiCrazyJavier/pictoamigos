/* ============================================================================
   SECCIÓN: GESTOS-NAVEGACION  (js/gestos.js)
   ---------------------------------------------------------------------------
   Qué controla: cómo se mueve el usuario entre pantallas con el dedo (o el
   ratón/teclado en PC).
   Gestos disponibles:
     - DESLIZAR HACIA LA IZQUIERDA  -> siguiente pantalla/nivel/frase
     - DESLIZAR HACIA LA DERECHA    -> pantalla anterior
     - DESLIZAR DESDE EL BORDE IZQUIERDO (arrancando pegado al borde) -> ATRÁS
     - TECLADO: flechas ← → , Escape = atrás   (PC)
     - RATÓN: arrastrar horizontalmente (equivalente a deslizar)
   Cómo modificar:
     - Sensibilidad: cambiar UMBRAL (píxeles) y BORDE.
     - Quitar el gesto en una pantalla: llama a Gestos.actualizar({}) allí.
   Uso:  Gestos.instalar(document.getElementById("vista"));   (una sola vez)
         Gestos.actualizar({ siguiente, anterior, volver });  (en cada pantalla)
   Nota: tras un deslizarse cancela el clic accidental que venga detrás.
   ========================================================================== */

window.Gestos = (function () {

  const UMBRAL = 60;   // píxeles mínimos de desplazamiento para contar como gesto
  const BORDE = 32;    // zona pegada al borde izquierdo que significa "atrás"

  let estado = { x0: 0, y0: 0, activo: false, eje: null, edge: false };
  let suprimirClic = false;
  let callbacks = {};
  let instalado = false;

  function instalar(el) {
    if (!el || instalado) return;
    instalado = true;
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    document.addEventListener("click", onTapPosterior, true);
    window.addEventListener("keydown", onTecla);
  }

  /** Se llama en cada pantalla para definir qué hacen los gestos allí. */
  function actualizar(cbs) {
    callbacks = cbs || {};
  }

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Un toque nuevo cancela la protección contra clics accidentales:
    // así un gesto no "come" el clic siguiente del usuario.
    suprimirClic = false;
    estado = { x0: e.clientX, y0: e.clientY, activo: true, eje: null,
               edge: e.clientX <= BORDE };
  }

  function onMove(e) {
    if (!estado.activo) return;
    const dx = e.clientX - estado.x0;
    const dy = e.clientY - estado.y0;
    if (!estado.eje) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      estado.eje = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (estado.eje === "horizontal" && e.pointerId != null) {
        try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }
    if (estado.eje === "horizontal" && e.cancelable) e.preventDefault();
  }

  function onUp(e) {
    if (!estado.activo) return;
    const dx = e.clientX - estado.x0;
    const dy = e.clientY - estado.y0;
    const horizontal = estado.eje === "horizontal" && Math.abs(dx) >= UMBRAL;
    const vertical = Math.abs(dy) > Math.abs(dx);
    const edge = estado.edge;
    estado.activo = false;

    if (!horizontal || vertical) return;

    suprimirClic = true;
    setTimeout(() => { suprimirClic = false; }, 350);

    if (edge && dx > UMBRAL && callbacks.volver) {
      callbacks.volver();                       // deslizar desde el borde = atrás
    } else if (dx < -UMBRAL && callbacks.siguiente) {
      callbacks.siguiente();                    // a la izquierda -> siguiente
    } else if (dx > UMBRAL && callbacks.anterior) {
      callbacks.anterior();                     // a la derecha -> anterior
    }
  }

  function onTapPosterior(ev) {
    // Solo se cancela el clic generado por el dedo/ratón (detail > 0).
    // Los clics de teclado o programáticos (detail 0) nunca se cancelan.
    if (suprimirClic && ev.detail > 0) {
      ev.stopPropagation();
      ev.preventDefault();
      suprimirClic = false;
    }
  }

  function onTecla(ev) {
    const tag = (ev.target && ev.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (ev.key === "ArrowRight") { callbacks.siguiente && callbacks.siguiente(); }
    else if (ev.key === "ArrowLeft") { callbacks.anterior && callbacks.anterior(); }
    else if (ev.key === "Escape" || ev.key === "Backspace") { callbacks.volver && callbacks.volver(); }
  }

  return { instalar, actualizar };
})();
