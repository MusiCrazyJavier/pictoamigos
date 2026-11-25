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

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
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
console.log(`dist/ listo: ${elementos} elementos, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
