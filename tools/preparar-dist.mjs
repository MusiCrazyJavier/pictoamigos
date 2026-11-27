/**
 * SECCIÓN: EMPACADO-TAURI — prepara la carpeta `dist/` que Tauri empaqueta.
 *
 * Por qué existe: si Tauri apuntara a la raíz del proyecto empaquetaría también
 * .git (43 MB), docs/ y tools/. Este script copia SOLO lo que la app necesita
 * para funcionar (incluidos los MP3, el modelo de voz y la licencia).
 *
 * Uso:  node tools/preparar-dist.mjs
 * Lo ejecuta Tauri automáticamente con `beforeBuildCommand`.
 * Está en Node (y no en Python) para que funcione igual en Linux, macOS y
 * Windows, tanto aquí como en los runners de GitHub Actions.
 *
 * Salida: dist/  (añadida a .gitignore)
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const DESTINO = join(RAIZ, "dist");

// Ficheros y carpetas que la app necesita en tiempo de ejecución
const INCLUIR = [
  "index.html",
  "manifest.json",
  "sw.js",
  "README.md",
  "LICENSE",
  "css",
  "js",
  "icons",
  "audio",
  "pictos",  // pictogramas ARASAAC (CC BY-NC-SA) -> imágenes sin internet
  "modelos", // modelo Vosk (34 MB) -> reconocimiento de voz sin conexión
];

function tamano(ruta) {
  const st = statSync(ruta);
  if (st.isFile()) return st.size;
  let total = 0;
  for (const hijo of readdirSync(ruta)) total += tamano(join(ruta, hijo));
  return total;
}

if (existsSync(DESTINO)) rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

let elementos = 0;
for (const elemento of INCLUIR) {
  const origen = join(RAIZ, elemento);
  if (!existsSync(origen)) {
    console.error(`  ! falta: ${elemento}`);
    continue;
  }
  cpSync(origen, join(DESTINO, elemento), { recursive: true });
  elementos++;
}

const bytes = await tamano(DESTINO);

/* ---------------------------------------------------------------------------
 * CACHÉ DEL WEBVIEW (importante): WebKit guarda en disco index.html y los
 * JS/CSS, así que sin medida las actualizaciones seguirían mostrando el código
 * viejo. Solución:
 *   1) subrecursos con ?v=VERSION  (index.html en dist/)
 *   2) la ventana abre index.html?v=VERSION  (tauri.conf.json)
 * La VERSION es la de la app: solo cambia al publicar una nueva versión.
 * ------------------------------------------------------------------------ */
const confRuta = join(RAIZ, "src-tauri", "tauri.conf.json");
const conf = JSON.parse(readFileSync(confRuta, "utf8"));
const version = conf.version;
const indice = join(DESTINO, "index.html");
let html = readFileSync(indice, "utf8");
// Marca de build visible en runtime (diagnóstico de versiones)
const sello = "build " + new Date().toISOString().slice(0, 19).replace("T", " ");
if (!html.includes("__BUILD_STAMP__")) {
  html = html.replace("<head>", `<head>\n  <script>window.__BUILD_STAMP__ = ${JSON.stringify(sello)};</script>`);
} else {
  html = html.replace(/window\.__BUILD_STAMP__ = "[^"]*"/, `window.__BUILD_STAMP__ = ${JSON.stringify(sello)}`);
}
html = html.replace(/(src|href)="([^"?]+\.(?:js|css))"/g, `$1="$2?v=${version}"`);
writeFileSync(indice, html);

const urlVentana = `index.html?v=${version}`;
const ventana = conf.app && conf.app.windows && conf.app.windows[0];
if (ventana && ventana.url !== urlVentana) {
  ventana.url = urlVentana;
  writeFileSync(confRuta, JSON.stringify(conf, null, 2) + "\n");
  console.log(`tauri.conf.json -> app.windows[0].url = ${urlVentana}`);
}

/* IMPORTANTE: tauri::generate_context!() lee los assets al expandir la macro
 * en src/lib.rs. Si lib.rs no cambia, la compilación incremental reutiliza la
 * expansión anterior y el binario se queda con JS/CSS VIEJOS. Tocar lib.rs
 * fuerza la re-expansión en cada build. */
const libRs = join(RAIZ, "src-tauri", "src", "lib.rs");
try {
  // Cambiar el CONTENIDO (no solo el mtime): la compilación incremental de
  // rustc reutiliza la expansión de la macro si el texto no cambia, y el
  // binario se quedaría con los assets viejos aunque dist/ esté actualizado.
  let lib = readFileSync(libRs, "utf8");
  const marca = "// build-stamp: " + Date.now();
  if (lib.includes("// build-stamp:")) {
    lib = lib.replace(/\/\/ build-stamp: .*/, marca);
  } else {
    lib = lib.trimEnd() + "\n\n" + marca + "\n";
  }
  writeFileSync(libRs, lib);
} catch (_) {}

console.log(`dist/ listo: ${elementos} elementos, ${(bytes / 1024 / 1024).toFixed(1)} MB · versión ${version}`);
