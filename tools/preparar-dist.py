#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SECCIÓN: EMPACADO-TAURI — prepara la carpeta `dist/` que Tauri empaqueta.

Por qué existe: si Tauri apuntara a la raíz del proyecto empaquetaría también
.git (43 MB), docs/ y tools/. Este script copia SOLO lo que la app necesita
para funcionar (incluidos los MP3, el modelo de voz y la licencia).

Uso:
    python3 tools/preparar-dist.py     (lo ejecuta Tauri automáticamente
                                         con `beforeBuildCommand`)

Salida: dist/  (añadida a .gitignore)
"""

import os
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "dist")

# Ficheros y carpetas que la app necesita en tiempo de ejecución
INCLUIR = [
    "index.html",
    "manifest.json",
    "sw.js",
    "README.md",
    "LICENSE",
    "css",
    "js",
    "icons",
    "audio",
    "modelos",      # modelo Vosk (34 MB) -> reconocimiento de voz sin conexión
]


def main():
    if os.path.exists(DESTINO):
        shutil.rmtree(DESTINO)
    os.makedirs(DESTINO, exist_ok=True)

    copiados = 0
    for elemento in INCLUIR:
        origen = os.path.join(RAIZ, elemento)
        if not os.path.exists(origen):
            print(f"  ! falta: {elemento}")
            continue
        destino = os.path.join(DESTINO, elemento)
        if os.path.isdir(origen):
            shutil.copytree(origen, destino)
        else:
            shutil.copy2(origen, destino)
        copiados += 1

    total = sum(
        os.path.getsize(os.path.join(ruta, f))
        for ruta, _, archivos in os.walk(DESTINO)
        for f in archivos
    )
    print(f"dist/ listo: {copiados} elementos, {total / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
