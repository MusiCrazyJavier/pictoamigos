/* ============================================================================
   SECCIÓN: MOTOR-DE-VOZ  (js/audio.js)
   ---------------------------------------------------------------------------
   Qué controla: TODO el sonido de la app.
   Tiene DOS fuentes de voz (por eso se oye en cualquier dispositivo):
     1) VOZ INCLUIDA  -> MP3 generados en /audio (SECCIÓN: SONIDOS-LOCALES).
        Funciona siempre, aunque el sistema no tenga voces instaladas.
     2) VOZ DEL DISPOSITIVO -> Web Speech API (speechSynthesis). Más natural,
        pero solo si el sistema tiene voces en español.
   API pública:
     Voz.hablar(texto)                     -> pronuncia una palabra/frase
     Voz.detener()                         -> corta lo que esté sonando
     Voz.configurar({activado, velocidad, modo})
     Voz.config = { activado, velocidad, modo }
        modo: "auto"     -> voz del dispositivo si hay, si no la incluida
              "sistema"  -> siempre voz del dispositivo
              "local"    -> siempre voz incluida
     Voz.estado() -> { vocesSistema, audiosLocales, modo }   (para Ajustes)
   Cómo modificar:
     - Idioma de la voz del dispositivo: CAMBIAR_IDIOMA.
     - Velocidad inicial: VER velInicial (para los MP3 usar tools/generar-audios.py).
     - Campanita de acierto: VER sonidoExito().
   Nota: los navegadores exigen un gesto del usuario antes de sonar;
   por eso Voz.desbloquearAudio() se llama en el primer toque.
   ========================================================================== */

window.Voz = (function () {

  const CAMBIAR_IDIOMA = "es";                       // voz del dispositivo
  const velInicial = { activado: true, velocidad: 0.95, modo: "auto" };
  let cfg = Object.assign({}, velInicial);

  let listaVoces = [];
  let ctxAudio = null;
  let elementoAudio = null;      // reproductor de los MP3 incluidos

  function soportado() { return "speechSynthesis" in window; }

  /* ---------------- voces del dispositivo ---------------- */
  function cargarVoces() {
    if (!soportado()) return;
    listaVoces = window.speechSynthesis.getVoices() || [];
  }
  if (soportado()) {
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;   // llegan tarde
  }

  function vozEspanola() {
    if (!listaVoces.length) cargarVoces();
    const es = listaVoces.filter(v => (v.lang || "").toLowerCase().startsWith(CAMBIAR_IDIOMA));
    return es.find(v => v.localService) || es[0] || null;
  }

  /* ---------------- MP3 incluidos ---------------- */
  function ficheroDe(texto) {
    const mapa = window.SONIDOS || {};
    const t = String(texto || "").trim();
    if (mapa[t]) return mapa[t];
    // tolerancia a mayúsculas/minúsculas
    const clave = Object.keys(mapa).find(k => k.toLowerCase() === t.toLowerCase());
    return clave ? mapa[clave] : null;
  }

  function hablarLocal(texto) {
    const fichero = ficheroDe(texto);
    if (!fichero) return false;
    try {
      if (!elementoAudio) {
        elementoAudio = new Audio();
        elementoAudio.preload = "auto";
      }
      elementoAudio.pause();
      elementoAudio.src = "audio/" + fichero;
      elementoAudio.currentTime = 0;
      const p = elementoAudio.play();
      if (p && p.catch) p.catch(err => console.warn("No se pudo reproducir el audio:", err));
      return true;
    } catch (e) {
      console.warn("Audio local no disponible:", e);
      return false;
    }
  }

  function hablarSistema(texto) {
    const t = String(texto || "").trim();
    if (!t || !soportado()) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      const v = vozEspanola();
      if (v) { u.voice = v; u.lang = v.lang; }
      else { u.lang = CAMBIAR_IDIOMA + "-" + CAMBIAR_IDIOMA.toUpperCase(); }
      u.rate = cfg.velocidad;
      u.pitch = 1.05;
      u.volume = 1;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      console.warn("No se pudo pronunciar:", e);
      return false;
    }
  }

  /** Pronuncia el texto usando el modo elegido, con respaldo automático. */
  function hablar(texto) {
    const t = String(texto || "").trim();
    if (!t || !cfg.activado) return;

    const haySistema = !!vozEspanola();

    if (cfg.modo === "local") {
      if (!hablarLocal(t)) hablarSistema(t);
      return;
    }
    if (cfg.modo === "sistema") {
      if (!hablarSistema(t)) hablarLocal(t);
      return;
    }
    // automático: la más fiable de las dos disponibles
    if (haySistema) { if (!hablarSistema(t)) hablarLocal(t); }
    else { if (!hablarLocal(t)) hablarSistema(t); }
  }

  function detener() {
    if (soportado()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (elementoAudio) { try { elementoAudio.pause(); } catch (e) {} }
  }

  function configurar(nuevo) {
    Object.assign(cfg, nuevo || {});
    guardar();
  }

  function estado() {
    cargarVoces();
    return {
      modo: cfg.modo,
      velocidad: cfg.velocidad,
      activado: cfg.activado,
      vocesSistema: listaVoces.filter(v => (v.lang || "").toLowerCase().startsWith(CAMBIAR_IDIOMA)).length,
      audiosLocales: Object.keys(window.SONIDOS || {}).length
    };
  }

  function guardar() {
    try { localStorage.setItem("pictoamigos.voz", JSON.stringify(cfg)); } catch (e) {}
  }
  function cargarGuardado() {
    try {
      const g = JSON.parse(localStorage.getItem("pictoamigos.voz") || "null");
      if (g) cfg = Object.assign(cfg, g);
    } catch (e) {}
  }

  /* ---- Campanita suave al completar una frase (sin estridencias) ---- */
  function sonidoExito() {
    if (!cfg.activado || cfg.campana === false) return;
    try {
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      if (ctxAudio.state === "suspended") ctxAudio.resume();
      [659.25, 783.99].forEach((f, i) => {          // Mi5 y Sol5
        const o = ctxAudio.createOscillator();
        const g = ctxAudio.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const t0 = ctxAudio.currentTime + i * 0.16;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
        o.connect(g); g.connect(ctxAudio.destination);
        o.start(t0); o.stop(t0 + 0.5);
      });
    } catch (e) { /* sin audio disponible */ }
  }

  /** Primer gesto del usuario: desbloquea el audio (requisito de navegadores). */
  function desbloquearAudio() {
    try {
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      if (ctxAudio.state === "suspended") ctxAudio.resume();
      if (soportado()) window.speechSynthesis.getVoices();
      // Reproducir un WAV silencioso "despierta" el audio en iOS/Safari
      const silencio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      const p = silencio.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  cargarGuardado();

  return { hablar, detener, configurar, sonidoExito, desbloquearAudio,
           soportado, estado,
           get config() { return Object.assign({}, cfg); } };
})();
