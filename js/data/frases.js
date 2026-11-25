/* ============================================================================
   SECCIÓN: DATOS-FRASES
   ---------------------------------------------------------------------------
   Qué controla: las frases de la pantalla "Formar Frases".
   Estructura de una frase:
     {
       id: "f1",                       // identificador único y estable
       imagen: 7202,                   // ID ARASAAC de la imagen GRANDE (pista)
       palabras: [                     // 3 o 4 palabras, en el orden correcto
         { t: "El" },                  // sin pictograma -> tarjeta de solo texto
         { t: "perro", p: "perro" },   // p = clave de SECCIÓN: DATOS-PICTOGRAMAS
         { t: "juega", p: "jugar" }
       ]
     }
   Cómo modificar:
     - AÑADIR FRASE: copia un bloque y pegalo en el array.
     - QUITAR FRASE: borra su bloque.
     - CAMBIAR IMAGEN: usa el ID de https://api.arasaac.org/api/pictograms/es/search/PALABRA
     - PALABRA SIN PICTOGRAMA: déjala solo con { t: "El" } (artículos, etc.).
   Reglas (no romper):
     - Las opciones que se muestran son las palabras de la frase, desordenadas.
     - Al tocar cualquier opción se pronuncia esa palabra.
   ========================================================================== */

window.FRASES = [
  { id: "f01", imagen: 7202, palabras: [
      { t: "El" }, { t: "perro", p: "perro" }, { t: "juega", p: "jugar" } ] },

  { id: "f02", imagen: 7176, palabras: [
      { t: "El" }, { t: "niño", p: "niño" }, { t: "come", p: "come" },
      { t: "dulces", p: "dulces" } ] },

  { id: "f03", imagen: 2458, palabras: [
      { t: "La" }, { t: "mamá", p: "mamá" }, { t: "cocina", p: "cocina" } ] },

  { id: "f04", imagen: 7114, palabras: [
      { t: "El" }, { t: "gato", p: "gato" }, { t: "duerme", p: "dormir" } ] },

  { id: "f05", imagen: 32464, palabras: [
      { t: "Yo" }, { t: "quiero", p: "quiero" }, { t: "agua", p: "agua" } ] },

  { id: "f06", imagen: 2490, palabras: [
      { t: "El" }, { t: "pájaro", p: "pájaro" }, { t: "vuela", p: "volar" } ] },

  { id: "f07", imagen: 28643, palabras: [
      { t: "El" }, { t: "niño", p: "niño" }, { t: "lee", p: "leer" } ] },

  { id: "f08", imagen: 2484, palabras: [
      { t: "La" }, { t: "niña", p: "niña" }, { t: "salta", p: "saltar" } ] },

  { id: "f09", imagen: 7176, palabras: [
      { t: "El" }, { t: "niño", p: "niño" }, { t: "corre", p: "correr" } ] },

  { id: "f10", imagen: 2276, palabras: [
      { t: "El" }, { t: "niño", p: "niño" }, { t: "bebe", p: "beber" },
      { t: "agua", p: "agua" } ] },

  { id: "f11", imagen: 2380, palabras: [
      { t: "El" }, { t: "niño", p: "niño" }, { t: "escribe", p: "escribir" } ] },

  { id: "f12", imagen: 2494, palabras: [
      { t: "Yo" }, { t: "como", p: "comer" }, { t: "pan", p: "pan" } ] }
];
