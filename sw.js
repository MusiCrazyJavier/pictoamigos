/* ============================================================================
   SECCIÓN: PWA-OFFLINE  (sw.js — Service Worker)
   ---------------------------------------------------------------------------
   Qué controla: que la app funcione SIN conexión (una vez visitada).
   - Guarda en caché la "cáscara" de la app (HTML, CSS, JS, iconos).
   - Guarda también las imágenes ARASAAC que se vayan usando.
   Cómo modificar:
     - Nombre de la caché: CAMBIAR CACHE_VERSION (sube el número al actualizar
       para que los usuarios descarguen la nueva versión).
     - Añadir un archivo nuevo a la precarga: añádelo a la lista SHELL.
   Nota: los archivos deben servirse por HTTP(S) (no abriendo index.html con
   doble clic) para que el modo offline active.
   ========================================================================== */

const CACHE_VERSION = "pictoamigos-v18";
const CACHE = CACHE_VERSION;

// En localhost se usa "red primero" para que los cambios se vean al instante
// al desarrollar; en producción se usa "caché primero con actualización".
const ES_LOCALHOST = location.hostname === "localhost" ||
                     location.hostname === "127.0.0.1" ||
                     location.hostname === "[::1]";

const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data/pictos.js",
  "./js/data/niveles.js",
  "./js/data/frases.js",
  "./js/data/sonidos.js",
  "./js/data/cuerpo.js",
  "./js/mic.js",
  "./js/audio.js",
  "./js/ui.js",
  "./js/gestos.js",
  "./js/screens.js",
  "./js/main.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(SHELL.map((ruta) =>
        cache.add(ruta).catch(() => {})   // un archivo que falle no rompe la instalación
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          // Solo se borran las versiones viejas de la APP (pictoamigos-v1, v2…).
          // NUNCA se borra "pictoamigos-modelo": ahí está la voz sin conexión
          // de 34 MB que descargó el usuario (SECCIÓN: MOTOR-OFFLINE-VOSK).
          .filter((n) => n.indexOf("pictoamigos-v") === 0 && n !== CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  const esImagen = req.destination === "image";
  const esLocal = url.origin === self.location.origin;
  const esModelo = url.pathname.indexOf("/modelos/") >= 0;   // modelo Vosk (34 MB)

  // Navegación: primero red (siempre fresca), si no hay red -> index guardado
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req, { cache: ES_LOCALHOST ? "no-store" : "no-cache" })
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Estáticos locales (HTML/CSS/JS)
  if (esLocal) {
    // El modelo de voz (34 MB) lo guarda y sirve MICRÓFONO-PRACTICA en su
    // propia caché (pictoamigos-modelo): aquí no se cachea para no duplicarlo.
    if (esModelo) {
      evento.respondWith(fetch(req));
      return;
    }

    // Desarrollo (localhost): red primero SIEMPRE fresca (sin caché del
    // navegador) -> cualquier cambio se ve al recargar.
    if (ES_LOCALHOST) {
      evento.respondWith(
        fetch(req, { cache: "no-store" }).then((r) => {
          if (r && r.ok) {
            const copia = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          }
          return r;
        }).catch(() => caches.match(req))
      );
      return;
    }
    // Producción: caché inmediata + actualización con revalidación real
    evento.respondWith(
      caches.match(req).then((guardado) => {
        const actualizar = fetch(req, { cache: "no-cache" }).then((r) => {
          if (r && r.ok) {
            const copia = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          }
          return r;
        }).catch(() => guardado);
        return guardado || actualizar;
      })
    );
    return;
  }

  // Imágenes (pictogramas): primero caché para que funcione sin conexión
  if (esImagen) {
    evento.respondWith(
      caches.match(req).then((guardado) => {
        if (guardado) return guardado;
        return fetch(req).then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          return r;
        }).catch(() => guardado);
      })
    );
  }
});
