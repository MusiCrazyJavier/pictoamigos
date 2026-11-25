#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SECCIÓN: EMPACADO-TAURI — regenera los iconos de escritorio.

Genera desde cero el logo de PictoAmigos (cuadrado azul redondeado, cara
sonriente y estrella) en todos los tamaños que Tauri necesita:
    src-tauri/icons/32x32.png, 128x128.png, 128x128@2x.png, icon.png, icon.ico

Uso:
    python3 tools/generar-iconos.py
    # alternativa con tu propia imagen: cargo tauri icon mi-logo.png
"""

import math
import os

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "src-tauri", "icons")

AZUL = (47, 111, 237, 255)
BLANCO = (255, 255, 255, 255)
TINTA = (31, 42, 55, 255)
AMARILLO = (255, 196, 0, 255)


def crear(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Cuadrado azul con esquinas redondeadas
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.18), fill=AZUL)

    # Círculo blanco (zona segura para iconos "maskable")
    cx = cy = size // 2
    rad = int(size * 0.34)
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=BLANCO)

    # Ojos
    ojo = int(size * 0.035)
    sep = int(size * 0.12)
    for dx in (-sep, sep):
        d.ellipse([cx + dx - ojo, cy - int(size * 0.10) - ojo,
                   cx + dx + ojo, cy - int(size * 0.10) + ojo], fill=TINTA)

    # Sonrisa
    g = int(size * 0.022)
    d.arc([cx - int(size * 0.16), cy - int(size * 0.08),
           cx + int(size * 0.16), cy + int(size * 0.14)],
          start=20, end=160, fill=TINTA, width=g)

    # Estrella
    ex, ey, er = cx + int(size * 0.26), cy - int(size * 0.26), int(size * 0.10)
    puntos = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = er if i % 2 == 0 else er * 0.45
        puntos.append((ex + rr * math.cos(ang), ey + rr * math.sin(ang)))
    d.polygon(puntos, fill=AMARILLO, outline=TINTA)
    return img


def main():
    os.makedirs(DESTINO, exist_ok=True)
    crear(512).save(os.path.join(DESTINO, "icon.png"))
    crear(32).save(os.path.join(DESTINO, "32x32.png"))
    crear(128).save(os.path.join(DESTINO, "128x128.png"))
    crear(256).save(os.path.join(DESTINO, "128x128@2x.png"))
    crear(256).save(os.path.join(DESTINO, "icon.ico"),
                    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("Iconos generados en", DESTINO)


if __name__ == "__main__":
    main()
