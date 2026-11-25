#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SECCIÓN: REVISIÓN-DE-IMÁGENES  (tools/revision-cuerpo.py)
---------------------------------------------------------------------------
Genera una página con TODOS los pictogramas de la sección restringida
«Mi cuerpo y mi seguridad», agrupados por sub-nivel, para que un adulto
(familia, maestro o terapeuta) los revise antes de activar la sección.

Uso:
    python3 tools/revision-cuerpo.py
    -> abre http://localhost:8137/tools/revision-cuerpo/index.html

Por qué: en contenido sobre cuerpo, higiene y seguridad es obligatorio
validar las imágenes con personas adultas (criterio de la investigación:
validar con usuarios, nunca dar por buena una imagen sin verla).
"""

import html
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "js", "data", "cuerpo.js")
SALIDA = os.path.join(RAIZ, "tools", "revision-cuerpo", "index.html")


def leer():
    texto = open(ORIGEN, encoding="utf-8").read()
    bloque = texto.split("window.PICTOS_CUERPO = {", 1)[1].split("};", 1)[0]
    niveles, actual = {}, "sin nivel"
    for linea in bloque.splitlines():
        m_comentario = re.match(r"\s*//\s*(.+)$", linea)
        if m_comentario:
            actual = m_comentario.group(1).strip()
            niveles.setdefault(actual, [])
            continue
        m = re.match(r'\s*"([^"]+)":\s*(\d+),\s*$', linea)
        if m:
            niveles.setdefault(actual, []).append((m.group(1), int(m.group(2))))
    return niveles


def main():
    niveles = leer()
    secciones = []
    for nivel, palabras in niveles.items():
        celdas = "".join(
            f'<figure><img loading="lazy" src="https://static.arasaac.org/pictograms/{i}/{i}_300.png" '
            f'alt="{html.escape(w)}"><figcaption>{html.escape(w)}<small>#{i}</small></figcaption></figure>'
            for w, i in palabras)
        secciones.append(f"<h2>{html.escape(nivel)} <small>({len(palabras)})</small></h2>"
                         f"<div class='rejilla'>{celdas}</div>")

    doc = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisión de imágenes — Mi cuerpo y mi seguridad</title>
<style>
 body {{ font-family: system-ui, sans-serif; margin: 24px auto; max-width: 1100px; padding: 0 16px; color:#1F2A37; }}
 h1 {{ font-size: 24px; }} h2 {{ margin-top: 28px; font-size: 20px; }}
 .rejilla {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }}
 figure {{ margin: 0; border: 1px solid #E4E9F0; border-radius: 16px; padding: 8px; text-align: center; background:#fff; }}
 img {{ width: 100%; height: 120px; object-fit: contain; }}
 figcaption {{ font-weight: 700; font-size: 15px; }}
 figcaption small {{ display: block; color:#5B6775; font-weight: 400; }}
 .nota {{ background:#FFF9EC; border:2px dashed #F2C14E; border-radius:14px; padding:14px; }}
</style></head>
<body>
<h1>Revisión de imágenes — «Mi cuerpo y mi seguridad»</h1>
<p class="nota">Revisa cada imagen con un adulto antes de activar la sección en
<strong>Ajustes → Sección «Mi cuerpo y mi seguridad»</strong>. Si alguna no encaja,
anota la palabra y el nº de ID y se cambia en <code>js/data/cuerpo.js</code>.</p>
{''.join(secciones)}
</body></html>"""

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    open(SALIDA, "w", encoding="utf-8").write(doc)
    total = sum(len(p) for p in niveles.values())
    print(f"Página generada: {SALIDA}")
    print(f"Sub-niveles: {len(niveles)} · imágenes: {total}")
    print("Ábrela en: http://localhost:8137/tools/revision-cuerpo/index.html")


if __name__ == "__main__":
    main()
