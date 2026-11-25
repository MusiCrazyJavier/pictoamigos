/* ============================================================================
   SECCIÓN: DATOS-CUERPO-Y-SEGURIDAD  (js/data/cuerpo.js)
   ---------------------------------------------------------------------------
   ⚠ SECCIÓN RESTRINGIDA — DESACTIVADA POR DEFECTO.
   Contenido de apoyo para el trabajo que hacen familias, maestros y terapeutas
   con niños con TEA: nombres del cuerpo, higiene, público/privado, límites y
   pubertad. No se muestra en el HOME hasta que un adulto la activa en Ajustes
   (con puerta de adulto). Ver docs/INVESTIGACION.md §6 (investigación y criterios).

   Qué controla:
     - PICTOS_CUERPO  → palabra → ID de pictograma ARASAAC (se fusiona con PICTOS).
     - CUERPO_NIVELES → los sub-niveles que aparecen en el HOME si está activada.
     - window.Cuerpo  → estado de activación (guardado en el dispositivo).

   Cómo modificar:
     - Añadir palabra: añádela a PICTOS_CUERPO (ID de
       https://api.arasaac.org/api/pictograms/es/search/PALABRA) y a la lista
       `palabras` del sub-nivel. Después ejecuta `python3 tools/generar-audios.py`
       y sube CACHE_VERSION en sw.js.
     - Quitar palabra o sub-nivel: borra su línea.
     - Cambiar el contenido completo: borra este fichero y su <script> en index.html.

   Criterios seguidos (docs/INVESTIGACION.md §6):
     - Terminología correcta y directa, sin metáforas.
     - Concreto, visual y repetitivo (apoyos visuales y narrativas sociales).
     - Sin tono de castigo ni vergüenza: se enseña lo que SÍ se puede hacer.
     - Enfocado en seguridad, autocuidado, límites y consentimiento.
   ========================================================================== */

window.PICTOS_CUERPO = {
  // Mi cuerpo
  "cabeza": 2673,
  "cuello": 2727,
  "hombros": 2977,
  "brazos": 2669,
  "manos": 9830,
  "dedos": 9826,
  "barriga": 2786,
  "espalda": 2748,
  "piernas": 8666,
  "rodillas": 2810,
  "pies": 37227,
  "ojos": 2876,
  "orejas": 2871,
  "nariz": 2887,
  "boca": 2663,
  "dientes": 2737,
  "lengua": 2944,
  "pelo": 2851,
  "cara": 2684,
  "piel": 2840,
  // Higiene
  "lavarse las manos": 8975,
  "ducharse": 27529,
  "cepillarse los dientes": 27489,
  "peinado": 16331,
  "cortarse las uñas": 10152,
  "jabón": 8094,
  "toalla": 2593,
  "cepillo de dientes": 2694,
  "calzoncillo": 2303,
  "desodorante": 2735,
  "inodoro": 2430,
  "lavarse la cara": 34611,
  // Público y privado
  "público": 24783,
  "intimidad": 25702,
  "desnudo": 11234,
  "ropa": 7233,
  "puerta": 3244,
  "cerrar": 24976,
  "ventana": 2611,
  "habitación": 5988,
  "baño": 6929,
  "espejo": 8573,
  "casa": 6964,
  "cubrir": 26024,
  // Límites y seguridad
  "no": 5526,
  "parar": 7196,
  "decidir": 30510,
  "respeto": 14660,
  "ayuda": 12252,
  "verdad": 8715,
  "confiar": 36694,
  "abrazar": 6023,
  "tocar": 3293,
  "no me gusta": 38890,
  "sí": 5584,
  "contar a alguien": 5973,
  "no quiero": 6156,
  "límite": 32765,
  // Pubertad
  "crecer": 7002,
  "crecimiento": 16631,
  "cambio": 28833,
  "sudor": 35721,
  "barba": 2657,
  "adolescente": 10206,
  "desodorante": 2735,
  "sangre": 2803,
  "menstruación": 32490,
  "voz": 39687,
  "madurez": 20397,
  "cuerpo": 6473,
  "espejo": 8573,
};

window.CUERPO_NIVELES = [
  {
    id: "cuerpo-1",
    nombre: "Mi cuerpo",
    grupo: "autocuidado",
    icono: "cabeza",
    color: "#FDECEC",
    palabras: ["cabeza", "cuello", "hombros", "brazos", "manos", "dedos", "barriga", "espalda", "piernas", "rodillas", "pies", "ojos", "orejas", "nariz", "boca", "dientes", "lengua", "pelo", "cara", "piel"]
  },
  {
    id: "cuerpo-2",
    nombre: "Higiene",
    grupo: "autocuidado",
    icono: "cepillo de dientes",
    color: "#E9F2FF",
    palabras: ["lavarse las manos", "ducharse", "cepillarse los dientes", "peinado", "cortarse las uñas", "jabón", "toalla", "cepillo de dientes", "calzoncillo", "desodorante", "inodoro", "lavarse la cara"]
  },
  {
    id: "cuerpo-3",
    nombre: "Público y privado",
    grupo: "sensibles",
    icono: "habitación",
    color: "#F0ECFF",
    palabras: ["público", "intimidad", "desnudo", "ropa", "puerta", "cerrar", "ventana", "habitación", "baño", "espejo", "casa", "cubrir"]
  },
  {
    id: "cuerpo-4",
    nombre: "Límites y seguridad",
    grupo: "sensibles",
    icono: "no",
    color: "#FFF4E0",
    palabras: ["no", "parar", "decidir", "respeto", "ayuda", "verdad", "confiar", "abrazar", "tocar", "no me gusta", "sí", "contar a alguien", "no quiero", "límite"]
  },
  {
    id: "cuerpo-5",
    nombre: "Pubertad",
    grupo: "sensibles",
    icono: "adolescente",
    color: "#E7F7F1",
    palabras: ["crecer", "crecimiento", "cambio", "sudor", "barba", "adolescente", "desodorante", "sangre", "menstruación", "voz", "madurez", "cuerpo", "espejo"]
  },
];

/* Estado de la sección (por defecto: TODO DESACTIVADO).
   Dos grupos independientes, cada uno con su interruptor en Ajustes:
     "autocuidado" -> Mi cuerpo + Higiene
     "sensibles"   -> Público y privado + Límites y seguridad + Pubertad   */
window.Cuerpo = (function () {
  const CLAVE = "pictoamigos.cuerpo";
  const estado = { autocuidado: false, sensibles: false };

  // Compatibilidad con la primera versión ("si"/"no" activaba/desactivaba todo)
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo === "si") { estado.autocuidado = true; estado.sensibles = true; }
    else if (crudo && crudo !== "no") { Object.assign(estado, JSON.parse(crudo)); }
  } catch (e) {}

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }
  function grupoActivo(grupo) { return !!estado[grupo]; }
  function algoActivo() { return estado.autocuidado || estado.sensibles; }
  function activar(grupo) { if (grupo in estado) { estado[grupo] = true; guardar(); } }
  function desactivar(grupo) { if (grupo in estado) { estado[grupo] = false; guardar(); } }

  return { grupoActivo, algoActivo, activar, desactivar,
           ver: () => Object.assign({}, estado) };
})();

/* Fusiona los pictogramas de esta sección en el mapa general. */
if (window.PICTOS && window.PICTOS_CUERPO) {
  Object.assign(window.PICTOS, window.PICTOS_CUERPO);
}
