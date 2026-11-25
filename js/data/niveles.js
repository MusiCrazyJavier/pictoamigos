/* ============================================================================
   SECCIÓN: DATOS-NIVELES
   ---------------------------------------------------------------------------
   Qué controla: los niveles que aparecen en el HOME (Familia, Colores, etc.)
   y las palabras (pictogramas) de cada nivel.
   Cómo modificar:
     - AÑADIR NIVEL: copia un bloque { ... } y pegalo dentro de window.NIVELES.
       Ejemplo:
         { id: "mascotas", nombre: "Mascotas", icono: "perro",
           color: "#E8F6EC", palabras: ["perro", "gato", "pez"] },
     - QUITAR NIVEL: borra su bloque completo.
     - AÑADIR PALABRA: añade la palabra entre comillas. DEBE existir en
       SECCIÓN: DATOS-PICTOGRAMAS (js/data/pictos.js). Si no existe, la tarjeta
       saldrá sin imagen (solo texto), pero igualmente pronunciará la palabra.
     - CAMBIAR COLOR: "color" es el fondo de la tarjeta (formato #RRGGBB).
       Usa colores suaves y claros: no colores vivos ni parpadeantes.
     - ICONO: es la palabra usada como miniatura de la tarjeta del nivel.
   Reglas de diseño (no romper):
     - Cada palabra se pronuncia al tocarla (ver SECCIÓN: MOTOR-DE-VOZ).
     - Las tarjetas tienen esquinas redondeadas (SECCIÓN: SISTEMA-DISEÑO).
   ========================================================================== */

window.NIVELES = [
  {
    id: "familia",
    nombre: "Familia",
    icono: "familia",
    color: "#FDECEC",
    palabras: ["mamá", "papá", "hermano", "hermana", "abuelo", "abuela",
               "hijo", "hija", "tío", "primo", "familia", "bebé"]
  },
  {
    id: "necesidades",
    nombre: "Necesidades",
    icono: "ayuda",
    color: "#FFF4E0",
    palabras: ["hambre", "sed", "baño", "sueño", "dolor", "frío",
               "calor", "ayuda", "quiero", "comer", "beber", "dormir"]
  },
  {
    id: "colores",
    nombre: "Colores",
    icono: "rojo",
    color: "#E9F2FF",
    palabras: ["rojo", "azul", "amarillo", "verde", "naranja", "morado",
               "rosa", "negro", "blanco"]
  },
  {
    id: "formas",
    nombre: "Formas",
    icono: "círculo",
    color: "#F0ECFF",
    palabras: ["círculo", "cuadrado", "triángulo", "rectángulo",
               "estrella", "corazón", "cruz", "luna"]
  },
  {
    id: "numeros",
    nombre: "Números",
    icono: "tres",
    color: "#E7F7F1",
    palabras: ["uno", "dos", "tres", "cuatro", "cinco",
               "seis", "siete", "ocho", "nueve", "diez"]
  },
  {
    id: "animales",
    nombre: "Animales",
    icono: "perro",
    color: "#FFF0E6",
    palabras: ["perro", "gato", "pájaro", "pez", "vaca", "caballo",
               "oveja", "ratón", "mariposa", "conejo", "león", "elefante"]
  },
  {
    id: "comidas",
    nombre: "Comidas",
    icono: "manzana",
    color: "#FDF2E9",
    palabras: ["agua", "leche", "manzana", "plátano", "pan", "galleta",
               "huevo", "queso", "pollo", "arroz", "helado", "zanahoria"]
  },
  {
    id: "emociones",
    nombre: "Emociones",
    icono: "feliz",
    color: "#EAF6FF",
    palabras: ["feliz", "alegre", "triste", "enfadado", "asustado",
               "sorprendido", "cansado", "aburrido", "nervioso"]
  },
  {
    id: "ropa",
    nombre: "Ropa",
    icono: "camisa",
    color: "#F3EFFA",
    palabras: ["camisa", "pantalón", "vestido", "zapatos", "sombrero",
               "calcetines", "abrigo", "gafas"]
  },
  {
    id: "escuela",
    nombre: "Escuela",
    icono: "libro",
    color: "#E9F5FF",
    palabras: ["escuela", "maestro", "libro", "lápiz", "cuaderno",
               "mesa", "silla", "mochila"]
  }
];
