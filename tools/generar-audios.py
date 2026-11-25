#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SECCIÓN: GENERADOR-DE-AUDIOS  (tools/generar-audios.py)
---------------------------------------------------------------------------
Qué hace: genera los MP3 de la app (los que se oyen cuando el dispositivo no
tiene voces instaladas). Usa **Piper TTS** (voz neuronal, natural) y si no
está instalado, cae a **espeak-ng** (voz robótica de antes).

Uso:
    python3 tools/generar-audios.py                     # todos los audios
    python3 tools/generar-audios.py --listar-voces      # voces disponibles
    python3 tools/generar-audios.py --voz es_MX-ald-medium
    python3 tools/generar-audios.py --muestra            # muestras para elegir voz

Instalar Piper (una sola vez, queda FUERA de la carpeta de la app):
    python3 -m venv ~/.local/share/piper/venv
    ~/.local/share/piper/venv/bin/pip install piper-tts
    mkdir -p ~/.local/share/piper/voices && cd ~/.local/share/piper/voices
    curl -sL -o es_MX-claude-high.onnx      "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx"
    curl -sL -o es_MX-claude-high.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx.json"
    (otras voces en https://huggingface.co/rhasspy/piper-voices/tree/main/es)

Dependencias de respaldo: espeak-ng + ffmpeg (o lame).
    Ubuntu/Debian: sudo apt install espeak-ng ffmpeg

Cuándo regenerarlo:
    - Cuando añadas palabras o frases nuevas.
    - Cuando quieras cambiar la voz de la app (--voz).
    Después: sube CACHE_VERSION en sw.js (SECCIÓN: PWA-OFFLINE).
"""

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARPETA_AUDIO = os.path.join(RAIZ, "audio")
CARPETA_MUESTRAS = os.path.join(RAIZ, "tools", "voces-ejemplo")
SALIDA_JS = os.path.join(RAIZ, "js", "data", "sonidos.js")

PIPER_VENV = os.path.expanduser("~/.local/share/piper/venv/bin/piper")
DIR_VOZES = os.path.expanduser("~/.local/share/piper/voices")
VOZ_DEFECTO = "es_MX-claude-high"   # voz elegida por el usuario (cambiar con --voz)

# espeak-ng (respaldo)
VELOCIDAD = 140     # palabras por minuto
TONO = 45
AMPLITUD = 180
VOZ_ESPEAK = "es+f3"

# Textos de la interfaz que se pronuncian
UI = [
    "Hola, soy tu voz", "Voz activada", "Voz de la app",
    "Elige una opción para empezar", "¡Muy bien!", "Muy bien",
    "Formar Frases", "Ajustes", "Anterior", "Siguiente",
    "Borrar", "Repetir frase", "Volver", "Familia", "Necesidades",
    "Colores", "Formas", "Números", "Animales", "Comidas",
    "Emociones", "Ropa", "Escuela",
]

# Textos para comparar voces (con --muestra). Incluyen las palabras que han
# dado problemas de pronunciación para poder comparar voz por voz.
TEXTOS_MUESTRA = [
    "rojo", "rosa", "mamá", "tío", "bebé", "baño", "ayuda", "rectángulo", "cruz",
    "uno", "seis", "ocho", "pez", "ratón", "pollo", "pantalón", "sombrero",
    "gafas", "El perro juega", "¡Muy bien!",
]

# Carpeta extra: voz por defecto a velocidad más lenta (más claridad)
CARPETA_LENTA = VOZ_DEFECTO + "-lento"
ESCALA_LENTA = 1.25


# ------------------------------------------------------------------ lectura
def leer_claves(ruta):
    texto = open(ruta, encoding="utf-8").read()
    return re.findall(r'"([^"]+)":\s*\d+,', texto)


def leer_frases(ruta):
    texto = open(ruta, encoding="utf-8").read()
    frases = []
    for bloque in re.finditer(r'palabras:\s*\[(.*?)\]\s*\}', texto, re.S):
        palabras = re.findall(r't:\s*"([^"]+)"', bloque.group(1))
        if palabras:
            frases.append(" ".join(palabras))
    return frases


def nombre_fichero(texto):
    """Nombre seguro de fichero: '¡Muy bien!' -> 'muy-bien'"""
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or "audio"


# --------------------------------------------------------------- localizar
def hay(cmd):
    return subprocess.call(["which", cmd], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL) == 0


def piper_binario():
    """piper-tts (instalado en un venv) o el comando del sistema."""
    if os.path.exists(PIPER_VENV) and os.access(PIPER_VENV, os.X_OK):
        return PIPER_VENV
    return "piper" if hay("piper") else None


def voces_piper():
    if not os.path.isdir(DIR_VOZES):
        return []
    return sorted(f[:-5] for f in os.listdir(DIR_VOZES) if f.endswith(".onnx"))


def ruta_voz(nombre):
    """Devuelve la ruta .onnx de una voz (admite coincidencia parcial)."""
    for v in voces_piper():
        if v == nombre or v.startswith(nombre):
            return os.path.join(DIR_VOZES, v + ".onnx")
    return None


def hay_ffmpeg():
    return hay("ffmpeg") or hay("lame")


# --------------------------------------------------------------- sintetizar
def a_mp3(wav, destino_mp3):
    # 96 kbps mono: calidad clara para consonantes (r, s, p…) sin apenas pesar
    if hay("ffmpeg"):
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
               "-codec:a", "libmp3lame", "-b:a", "96k", "-ac", "1", destino_mp3]
    elif hay("lame"):
        cmd = ["lame", "--quiet", "-b", "96", "--mono", wav, destino_mp3]
    else:
        nuevo = destino_mp3[:-4] + ".wav"
        os.replace(wav, nuevo)
        return nuevo
    r = subprocess.run(cmd, capture_output=True)
    if os.path.exists(wav):
        os.remove(wav)
    if r.returncode != 0:
        print("  ! fallo al convertir:", r.stderr.decode()[:120])
        return False
    return destino_mp3


def generar_piper(texto, destino_mp3, binario, voz, longitud=1.0):
    wav = destino_mp3 + ".tmp.wav"
    # piper-tts recibe el texto por la entrada estándar
    cmd = [binario, "--model", voz, "--output_file", wav,
           "--length_scale", str(longitud), "--sentence_silence", "0.25"]
    r = subprocess.run(cmd, input=texto.encode("utf-8"), capture_output=True)
    if r.returncode != 0 or not os.path.exists(wav) or os.path.getsize(wav) < 200:
        if os.path.exists(wav):
            os.remove(wav)
        print("  ! piper falló con:", texto, r.stderr.decode()[:120])
        return False
    return a_mp3(wav, destino_mp3)


def generar_espeak(texto, destino_mp3):
    wav = destino_mp3 + ".tmp.wav"
    r = subprocess.run(
        ["espeak-ng", "-v", VOZ_ESPEAK, "-s", str(VELOCIDAD), "-p", str(TONO),
         "-a", str(AMPLITUD), "-w", wav, texto], capture_output=True)
    if r.returncode != 0 or not os.path.exists(wav) or os.path.getsize(wav) < 100:
        if os.path.exists(wav):
            os.remove(wav)
        print("  ! espeak falló con:", texto, r.stderr.decode()[:120])
        return False
    return a_mp3(wav, destino_mp3)


def main():
    ap = argparse.ArgumentParser(description="Genera los MP3 de voz de la app")
    ap.add_argument("--voz", default=VOZ_DEFECTO,
                    help="Voz de Piper a usar (ver --listar-voces)")
    ap.add_argument("--listar-voces", action="store_true",
                    help="Muestra las voces de Piper instaladas")
    ap.add_argument("--muestra", action="store_true",
                    help="Genera muestras de cada voz para compararlas")
    args = ap.parse_args()

    binario = piper_binario()
    voces = voces_piper()

    if args.listar_voces:
        print("Voces de Piper instaladas en", DIR_VOZES)
        for v in voces:
            print("  -", v)
        if not voces:
            print("  (ninguna: mira las instrucciones de instalación arriba)")
        print("\nMotor actual:", "Piper" if (binario and voces) else "espeak-ng (robótico)")
        return

    # --------- MUESTRAS: una carpeta por voz + página para escuchar ---------
    if args.muestra:
        if not (binario and voces):
            sys.exit("Hacen falta Piper + voces para generar muestras.")
        os.makedirs(CARPETA_MUESTRAS, exist_ok=True)
        for voz in voces:
            ruta_voz_ = os.path.join(DIR_VOZES, voz + ".onnx")
            carpeta = os.path.join(CARPETA_MUESTRAS, voz)
            os.makedirs(carpeta, exist_ok=True)
            for t in TEXTOS_MUESTRA:
                generar_piper(t, os.path.join(carpeta, nombre_fichero(t) + ".mp3"),
                              binario, ruta_voz_)
            print("  muestras de", voz)

        # Variante lenta de la voz por defecto (más claridad para algunos niños)
        if ruta_voz(args.voz):
            carpeta = os.path.join(CARPETA_MUESTRAS, CARPETA_LENTA)
            os.makedirs(carpeta, exist_ok=True)
            for t in TEXTOS_MUESTRA:
                generar_piper(t, os.path.join(carpeta, nombre_fichero(t) + ".mp3"),
                              binario, ruta_voz(args.voz), longitud=ESCALA_LENTA)
            print("  muestras lentas de", args.voz)

        voces_html = voces + ([CARPETA_LENTA] if os.path.isdir(
            os.path.join(CARPETA_MUESTRAS, CARPETA_LENTA)) else [])
        filas = []
        for voz in voces_html:
            celdas = "".join(
                f'<div><p>{t}</p><audio controls preload="none" src="{voz}/{nombre_fichero(t)}.mp3"></audio></div>'
                for t in TEXTOS_MUESTRA if os.path.exists(
                    os.path.join(CARPETA_MUESTRAS, voz, nombre_fichero(t) + ".mp3")))
            filas.append(f"<section><h2>{voz}</h2>{celdas}</section>")
        html = ("<!doctype html><meta charset='utf-8'><title>Comparar voces</title>"
                "<style>body{font-family:sans-serif;max-width:900px;margin:24px auto;padding:0 16px}"
                "section{border:1px solid #ddd;border-radius:14px;padding:14px;margin:14px 0}"
                "div{display:flex;gap:12px;align-items:center;justify-content:space-between}"
                "p{margin:4px 0;flex:1}</style>"
                "<h1>Compara las voces</h1><p>Elige la que te guste y ejecuta:<br>"
                "<code>python3 tools/generar-audios.py --voz NOMBRE_DE_LA_VOZ</code></p>"
                + "".join(filas))
        open(os.path.join(CARPETA_MUESTRAS, "index.html"), "w", encoding="utf-8").write(html)
        print("\nAbre tools/voces-ejemplo/index.html en el navegador para escucharlas.")
        return

    # ------------------------- AUDIOS COMPLETOS ----------------------------
    if binario and voces:
        voz = ruta_voz(args.voz)
        if not voz:
            sys.exit("No encuentro la voz «%s». Disponibles: %s"
                     % (args.voz, ", ".join(voces)))
        generador = lambda t, d: generar_piper(t, d, binario, voz)
        print(f"Motor: Piper · voz {os.path.basename(voz)}")
    else:
        if not hay("espeak-ng"):
            sys.exit("Falta Piper (recomendado) o espeak-ng.\n"
                     "Instala piper con las instrucciones de este fichero, o:\n"
                     "  sudo apt install espeak-ng ffmpeg")
        generador = generar_espeak
        print("Motor: espeak-ng (voz robótica) — instala Piper para una voz natural")

    os.makedirs(CARPETA_AUDIO, exist_ok=True)
    for f in os.listdir(CARPETA_AUDIO):
        if f.endswith((".mp3", ".wav")):
            os.remove(os.path.join(CARPETA_AUDIO, f))

    pictos = leer_claves(os.path.join(RAIZ, "js", "data", "pictos.js"))
    # Sección restringida (opcional): sus palabras también necesitan MP3
    ruta_cuerpo = os.path.join(RAIZ, "js", "data", "cuerpo.js")
    if os.path.exists(ruta_cuerpo):
        pictos += leer_claves(ruta_cuerpo)
    frases = leer_frases(os.path.join(RAIZ, "js", "data", "frases.js"))
    sueltas = set()
    for f in frases:
        sueltas.update(f.split())

    textos = []
    for t in list(pictos) + frases + UI + sorted(sueltas):
        if t not in textos:
            textos.append(t)

    mapa, base_usada = {}, {}
    for i, t in enumerate(textos, 1):
        base = nombre_fichero(t)
        n = base_usada.get(base, 0) + 1
        base_usada[base] = n
        nombre = base if n == 1 else f"{base}-{n}"
        destino = os.path.join(CARPETA_AUDIO, nombre + ".mp3")

        res = generador(t, destino)
        if res:
            mapa[t] = os.path.basename(res)
        if i % 25 == 0:
            print(f"  ... {i}/{len(textos)}")

    contenido = '''/* ============================================================================
   SECCIÓN: SONIDOS-LOCALES  (js/data/sonidos.js)
   ---------------------------------------------------------------------------
   Qué controla: los MP3 de voz incluidos en la app (respaldo cuando el
   dispositivo no tiene voces instaladas o el usuario elige "Voz de la app").
   Se genera automáticamente con tools/generar-audios.py — NO editar a mano.
   Para regenerar o cambiar de voz:
       python3 tools/generar-audios.py --voz NOMBRE   (ver --listar-voces)
   y después sube CACHE_VERSION en sw.js (SECCIÓN: PWA-OFFLINE).
   ========================================================================== */
window.SONIDOS = '''
    contenido += json.dumps(mapa, ensure_ascii=False, indent=2, sort_keys=True)
    contenido += ";\n"
    open(SALIDA_JS, "w", encoding="utf-8").write(contenido)

    total = sum(os.path.getsize(os.path.join(CARPETA_AUDIO, f))
                for f in os.listdir(CARPETA_AUDIO))
    print(f"\nListo: {len(mapa)} audios, {total/1024/1024:.1f} MB")
    print("Fichero:", SALIDA_JS)


if __name__ == "__main__":
    main()
