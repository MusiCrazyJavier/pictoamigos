/* ============================================================================
   SECCIÓN: PANTALLAS  (js/screens.js)
   ---------------------------------------------------------------------------
   Qué controla: el contenido y el comportamiento de CADA pantalla.
   Pantallas incluidas (con su nombre para dar indicaciones a una IA):
     1) SECCIÓN: PANTALLA-HOME     -> menú con los niveles + "Formar Frases"
     2) SECCIÓN: PANTALLA-NIVEL    -> rejilla de pictogramas que suenan al tocarlos
     3) SECCIÓN: PANTALLA-FRASES   -> arma frases de 3 a 4 palabras
     4) SECCIÓN: PANTALLA-AJUSTES  -> velocidad de voz, micrófono, exigencia,
                                      descarga sin conexión, probar voz
   API:  Pantallas.home(ctx) / nivel(ctx) / frases(ctx) / ajustes(ctx)
   ctx = { irA(pantalla, datos), estado }   (lo crea js/main.js)
   Reglas (no romper):
     - Tocar cualquier pictograma debe pronunciar su palabra.
     - Las tarjetas conservan esquinas redondeadas (SECCIÓN: SISTEMA-DISEÑO).
     - Las pantallas usan los gestos de SECCIÓN: GESTOS-NAVEGACION.
   ========================================================================== */

window.Pantallas = (function () {

  const P = window.PICTOS;
  const idDe = (clave) => (P && P[clave]) || null;

  /** Sub-niveles de la sección restringida que están ACTIVADOS ahora mismo.
   *  Cada sub-nivel declara su grupo: "autocuidado" (Mi cuerpo, Higiene) o
   *  "sensibles" (Público y privado, Límites y seguridad, Pubertad).
   *  Ver SECCIÓN: DATOS-CUERPO-Y-SEGURIDAD y SECCIÓN: PUERTA-DE-ADULTO. */
  function nivelesRestringidos() {
    if (!window.Cuerpo || !window.CUERPO_NIVELES) return [];
    return window.CUERPO_NIVELES.filter(n => Cuerpo.grupoActivo(n.grupo));
  }

  /** Todos los niveles del HOME: los normales + los restringidos activados. */
  function listaNiveles() {
    return (window.NIVELES || []).concat(nivelesRestringidos());
  }

  /* ==========================================================================
     SECCIÓN: PANTALLA-HOME
     --------------------------------------------------------------------------
     Qué cambia aquí: los botones del menú principal y su texto de bienvenida.
     Para añadir un nivel nuevo, NO edites esta sección: añádelo en
     SECCIÓN: DATOS-NIVELES (js/data/niveles.js).
     ======================================================================== */
  function home(ctx) {
    const raiz = document.createElement("section");
    raiz.className = "pantalla pantalla-home";

    const bienvenida = document.createElement("p");
    bienvenida.className = "texto-bienvenida";
    bienvenida.textContent = "Elige una opción para empezar";
    raiz.appendChild(bienvenida);

    const rejilla = document.createElement("div");
    rejilla.className = "rejilla-niveles";
    raiz.appendChild(rejilla);

    // Tarjeta especial: Formar Frases (siempre la primera)
    const tarjetaFrases = UI.tarjetaNivel({
      nombre: "Formar Frases",
      icono: "niño",
      color: "#E7F1FF"
    }, () => ctx.irA("frases", { fraseIdx: 0 }));
    tarjetaFrases.classList.add("tarjeta-destacada");
    rejilla.appendChild(tarjetaFrases);

    (window.NIVELES || []).forEach(n => {
      rejilla.appendChild(UI.tarjetaNivel(n, () => ctx.irA("nivel", { nivelId: n.id })));
    });

    // SECCIÓN: DATOS-CUERPO-Y-SEGURIDAD — solo aparece lo que un adulto activó
    const restringidos = nivelesRestringidos();
    if (restringidos.length) {
      const separador = document.createElement("p");
      separador.className = "seccion-restringida";
      separador.textContent = "Sección activada por un adulto";
      rejilla.appendChild(separador);
      restringidos.forEach(n => {
        rejilla.appendChild(UI.tarjetaNivel(n, () => ctx.irA("nivel", { nivelId: n.id })));
      });
    }

    const pista = document.createElement("p");
    pista.className = "pista-gestos";
    pista.textContent = "Toca una tarjeta para empezar";
    raiz.appendChild(pista);

    // En el home los gestos horizontales no hacen nada (es la pantalla raíz)
    Gestos.actualizar({});
    return raiz;
  }

  /* ==========================================================================
     SECCIÓN: PRACTICA-DE-PRONUNCIACION  (dentro de PANTALLA-NIVEL)
     --------------------------------------------------------------------------
     Qué hace: gestiona el botón de micrófono de cada tarjeta.
       - Escucha, compara con la palabra (SECCIÓN: MICRÓFONO-PRACTICA).
       - Si acierta -> felicitación (SECCIÓN: FELICITACIONES) + "¡Muy bien!".
       - Si falla  -> burbuja "¡Otra vez!" y se vuelve a pronunciar la palabra.
       - Si falla el sistema -> aviso adulto (nunca un castigo para el niño).
     Cómo modificar: textos, duración y animaciones.
     ======================================================================== */
  let practicando = false;

  function practicar(palabra, boton) {
    if (practicando || !window.Mic) return;
    practicando = true;

    const envoltura = boton.closest(".envoltura-tarjeta") || boton.parentElement;
    const etiquetaOriginal = boton.getAttribute("aria-label");
    boton.classList.remove("exito", "otra-vez");
    boton.classList.add("escuchando");
    boton.setAttribute("aria-label", "Escuchando: " + palabra);
    UI.anunciar("Escuchando… di: " + palabra);

    const reposicionar = () => {
      boton.classList.remove("escuchando", "descargando");
      if (etiquetaOriginal) boton.setAttribute("aria-label", etiquetaOriginal);
    };

    Mic.comprobar(palabra, {
      onProgreso: (p) => boton.classList.toggle("descargando", p > 0 && p < 1)
    })
      .then((res) => {
        practicando = false;
        reposicionar();
        if (res.ok) {
          boton.classList.add("exito");
          UI.felicitar(envoltura, "¡Muy bien!");
          Voz.hablar("¡Muy bien!");
          if (navigator.vibrate) { try { navigator.vibrate(70); } catch (e) {} }
          UI.anunciar("¡Muy bien! Has dicho " + palabra);
          setTimeout(() => boton.classList.remove("exito"), 2200);
        } else {
          boton.classList.add("otra-vez");
          UI.burbuja(envoltura, "¡Otra vez!");
          Voz.hablar(palabra);              // vuelve a oír la palabra correcta
          UI.anunciar("Casi. Repite: " + palabra);
          setTimeout(() => boton.classList.remove("otra-vez"), 1800);
        }
      })
      .catch((err) => {
        practicando = false;
        reposicionar();
        const codigo = (err && err.codigo) || "sin-voz";
        const texto = (window.Mic && Mic.mensajes[codigo]) || "¡Otra vez!";

        if (codigo === "sin-permiso") {
          UI.burbuja(envoltura, "Permite el micrófono", true);
          UI.mostrarAviso(texto);
        } else if (codigo === "sin-modelo" || codigo === "sin-biblioteca" ||
                   codigo === "red" || codigo === "modelo-no-encontrado" ||
                   codigo === "modelo-fallo") {
          UI.burbuja(envoltura, "Pide ayuda a un adulto", true);
          UI.mostrarAviso(texto);           // instrucción para el adulto
        } else {
          UI.burbuja(envoltura, "¡Otra vez!");
          Voz.hablar(palabra);
        }
        UI.anunciar(texto);
      });
  }

  /* ==========================================================================
     SECCIÓN: PANTALLA-NIVEL
     --------------------------------------------------------------------------
     Qué cambia aquí: cómo se comporta la rejilla de pictogramas de un nivel.
     Para cambiar el contenido de un nivel: SECCIÓN: DATOS-NIVELES.
     ======================================================================== */
  function nivel(ctx) {
    const lista = listaNiveles();
    const id = ctx.estado.nivelId || (lista[0] && lista[0].id);
    const indice = Math.max(0, lista.findIndex(n => n.id === id));
    const nivel = lista[indice] || lista[0];

    const raiz = document.createElement("section");
    raiz.className = "pantalla pantalla-nivel";

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera-nivel";
    const h2 = document.createElement("h2");
    h2.textContent = nivel.nombre;
    const contador = document.createElement("span");
    contador.className = "contador";
    contador.textContent = `Nivel ${indice + 1} de ${lista.length}`;
    cabecera.append(h2, contador);
    raiz.appendChild(cabecera);

    const rejilla = document.createElement("div");
    rejilla.className = "rejilla-pictogramas";
    const puedePracticar = !!(window.Mic && Mic.activo());
    nivel.palabras.forEach(palabra => {
      rejilla.appendChild(UI.tarjetaPictograma({
        palabra,
        pictoId: idDe(palabra),
        onClic: () => {
          Voz.hablar(palabra);
          UI.anunciar(palabra);
        },
        onMic: puedePracticar ? practicar : null
      }));
    });
    raiz.appendChild(rejilla);

    const pista = document.createElement("p");
    pista.className = "pista-gestos";
    pista.textContent = puedePracticar
      ? "Toca un pictograma para escucharlo · pulsa el micrófono para practicar"
      : "Toca un pictograma para escucharlo · desliza para cambiar de nivel";
    raiz.appendChild(pista);

    // Gestos: izquierda/derecha = siguiente/anterior nivel · borde = volver
    Gestos.actualizar({
      siguiente: () => {
        const sig = (indice + 1) % lista.length;
        ctx.irA("nivel", { nivelId: lista[sig].id });
      },
      anterior: () => {
        const ant = (indice - 1 + lista.length) % lista.length;
        ctx.irA("nivel", { nivelId: lista[ant].id });
      },
      volver: () => ctx.volver()
    });

    return raiz;
  }

  /* ==========================================================================
     SECCIÓN: PANTALLA-FRASES
     --------------------------------------------------------------------------
     Qué cambia aquí: la lógica de "arma la frase" (huecos, opciones, aciertos).
     Para cambiar o añadir frases: SECCIÓN: DATOS-FRASES (js/data/frases.js).
     ======================================================================== */

  let estadoFrase = { idx: -1, orden: [], elegidas: [] };

  function prepararFrase(indice) {
    const frases = window.FRASES || [];
    const frase = frases[indice] || frases[0];
    if (!frase) return null;
    if (estadoFrase.idx !== indice) {
      estadoFrase = {
        idx: indice,
        orden: UI.barajar(frase.palabras.map((p, i) => i)),   // opciones desordenadas
        elegidas: []                                          // aciertos acumulados
      };
    }
    return frase;
  }

  function frases(ctx) {
    const frases = window.FRASES || [];
    const indice = ((ctx.estado.fraseIdx || 0) % frases.length + frases.length) % frases.length;
    const frase = prepararFrase(indice);
    const raiz = document.createElement("section");
    raiz.className = "pantalla pantalla-frases";
    if (!frase) { raiz.textContent = "No hay frases. Añade en DATOS-FRASES."; return raiz; }

    const contador = document.createElement("div");
    contador.className = "contador";
    contador.textContent = `Frase ${indice + 1} de ${frases.length}`;
    raiz.appendChild(contador);

    // --- Imagen grande (pista visual de la frase) ---
    const zonaImagen = document.createElement("div");
    zonaImagen.className = "zona-imagen";
    zonaImagen.appendChild(UI.imagenPicto(frase.imagen, "", 500));
    raiz.appendChild(zonaImagen);

    // --- Huecos donde se colocan las palabras en orden ---
    const huecos = document.createElement("div");
    huecos.className = "huecos";
    frase.palabras.forEach((p, i) => {
      const hueco = document.createElement("div");
      hueco.className = "hueco";
      hueco.dataset.pos = i;
      huecos.appendChild(hueco);
    });
    raiz.appendChild(huecos);

    // --- Opciones de palabras (desordenadas) ---
    const opciones = document.createElement("div");
    opciones.className = "opciones";
    raiz.appendChild(opciones);

    function pintarOpciones() {
      opciones.innerHTML = "";
      estadoFrase.orden.forEach(ind => {
        if (estadoFrase.elegidas.includes(ind)) return;   // ya colocada
        const p = frase.palabras[ind];
        const tarjeta = UI.tarjetaPalabra({
          palabra: p.t,
          pictoId: p.p ? idDe(p.p) : null,
          onClic: () => alTocarOpcion(ind, tarjeta)
        });
        opciones.appendChild(tarjeta);
      });
    }

    function pintarHuecos() {
      Array.from(huecos.children).forEach((hueco, i) => {
        hueco.innerHTML = "";
        hueco.classList.remove("lleno", "pulsa");
        const ind = estadoFrase.elegidas[i];
        if (ind === undefined) return;
        const p = frase.palabras[ind];
        hueco.classList.add("lleno");
        if (p.p && idDe(p.p)) hueco.appendChild(UI.imagenPicto(idDe(p.p), p.t, 300));
        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta";
        etiqueta.textContent = p.t;
        hueco.appendChild(etiqueta);
        hueco.onclick = () => Voz.hablar(p.t);      // tocar una palabra ya colocada la repite
      });
    }

    function alTocarOpcion(ind, tarjeta) {
      const p = frase.palabras[ind];
      const esperado = estadoFrase.elegidas.length;

      Voz.hablar(p.t);                    // SIEMPRE suena la palabra tocada
      UI.anunciar(p.t);

      if (ind === esperado) {             // acierto: se coloca en el hueco
        estadoFrase.elegidas.push(ind);
        tarjeta.classList.add("colocada");
        setTimeout(() => { pintarHuecos(); pintarOpciones(); comprobar(); }, 180);
      } else {                            // error: feedback suave, sin castigo
        tarjeta.classList.remove("sacudir");
        void tarjeta.offsetWidth;
        tarjeta.classList.add("sacudir");
        const hueco = huecos.children[esperado];
        if (hueco) { hueco.classList.remove("pulsa"); void hueco.offsetWidth; hueco.classList.add("pulsa"); }
      }
    }

    function comprobar() {
      if (estadoFrase.elegidas.length !== frase.palabras.length) return;
      const texto = frase.palabras.map(p => p.t).join(" ");
      setTimeout(() => {
        Voz.hablar(texto);                // lee la frase completa
        Voz.sonidoExito();                // campanita suave
        UI.anunciar("Frase completa: " + texto);
        acciones.innerHTML = "";
        const bien = document.createElement("div");
        bien.className = "mensaje-exito";
        bien.textContent = "¡Muy bien!";
        acciones.appendChild(bien);
        acciones.appendChild(UI.boton("Siguiente frase", "boton-primario",
          () => ctx.irA("frases", { fraseIdx: (indice + 1) % frases.length })));
        acciones.appendChild(UI.boton("Repetir frase", "boton-secundario",
          () => Voz.hablar(texto)));
      }, 250);
    }

    // --- Botones de acción ---
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    restaurarAcciones();

    function restaurarAcciones() {
      acciones.innerHTML = "";
      acciones.appendChild(UI.boton("Borrar", "boton-secundario", () => {
        estadoFrase.elegidas = []; pintarHuecos(); pintarOpciones(); restaurarAcciones();
      }));
      acciones.appendChild(UI.boton("Repetir frase", "boton-secundario",
        () => Voz.hablar(frase.palabras.map(p => p.t).join(" "))));
      acciones.appendChild(UI.boton("Anterior", "boton-secundario",
        () => ctx.irA("frases", { fraseIdx: (indice - 1 + frases.length) % frases.length })));
      acciones.appendChild(UI.boton("Siguiente", "boton-primario",
        () => ctx.irA("frases", { fraseIdx: (indice + 1) % frases.length })));
    }

    raiz.appendChild(acciones);

    pintarHuecos();
    pintarOpciones();

    const pista = document.createElement("p");
    pista.className = "pista-gestos";
    pista.textContent = "Toca las palabras en el orden correcto · desliza para cambiar de frase";
    raiz.appendChild(pista);

    Gestos.actualizar({
      siguiente: () => ctx.irA("frases", { fraseIdx: (indice + 1) % frases.length }),
      anterior: () => ctx.irA("frases", { fraseIdx: (indice - 1 + frases.length) % frases.length }),
      volver: () => ctx.volver()
    });

    return raiz;
  }

  /* ==========================================================================
     SECCIÓN: PANTALLA-AJUSTES
     --------------------------------------------------------------------------
     Qué cambia aquí: los controles de ajustes (velocidad, origen de la voz,
     micrófono y práctica de pronunciación, sonido, probar voz).
     ======================================================================== */
  function ajustes(ctx) {
    const raiz = document.createElement("section");
    raiz.className = "pantalla pantalla-ajustes";
    raiz.innerHTML = `<h2>Ajustes</h2>`;

    const ficha = document.createElement("div");
    ficha.className = "ficha-ajustes";

    // Velocidad de la voz
    const filaVel = document.createElement("label");
    filaVel.className = "fila-ajuste";
    filaVel.innerHTML = `<span>Velocidad de la voz</span>`;
    const rango = document.createElement("input");
    rango.type = "range"; rango.min = "0.5"; rango.max = "1.2"; rango.step = "0.05";
    rango.value = String(Voz.config.velocidad);
    const valor = document.createElement("strong");
    valor.textContent = (Voz.config.velocidad < 0.8 ? "Lenta" : Voz.config.velocidad > 1.05 ? "Rápida" : "Normal");
    rango.addEventListener("input", () => {
      const v = parseFloat(rango.value);
      Voz.configurar({ velocidad: v });
      valor.textContent = (v < 0.8 ? "Lenta" : v > 1.05 ? "Rápida" : "Normal");
    });
    rango.addEventListener("change", () => { Voz.hablar("Hola, soy tu voz"); });
    filaVel.append(rango, valor);

    // Origen de la voz: incluida (MP3) o del dispositivo (Web Speech API)
    const filaOrigen = document.createElement("label");
    filaOrigen.className = "fila-ajuste";
    filaOrigen.innerHTML = `<span>Origen de la voz</span>`;
    const selector = document.createElement("select");
    selector.className = "selector-voz";
    [
      ["auto", "Automática (recomendada)"],
      ["local", "Voz de la app (incluida)"],
      ["sistema", "Voz del dispositivo"]
    ].forEach(([valor, texto]) => {
      const op = document.createElement("option");
      op.value = valor; op.textContent = texto;
      selector.appendChild(op);
    });
    selector.value = Voz.config.modo || "auto";
    selector.addEventListener("change", () => {
      Voz.configurar({ modo: selector.value });
      Voz.hablar("Hola, soy tu voz");
      UI.mostrarAviso("Voz actualizada");
    });
    filaOrigen.appendChild(selector);

    // Estado: cuántas voces tiene el dispositivo y cuántos audios trae la app
    const estadoVoz = Voz.estado();
    const estadoFila = document.createElement("p");
    estadoFila.className = "nota-ajustes";
    estadoFila.textContent = estadoVoz.vocesSistema > 0
      ? `Este dispositivo tiene ${estadoVoz.vocesSistema} voz(es) en español. La app incluye ${estadoVoz.audiosLocales} audios de respaldo.`
      : `Este dispositivo no tiene voces en español: se usarán los ${estadoVoz.audiosLocales} audios incluidos en la app.`;

    /* ======================================================================
       SECCIÓN: AJUSTES-DEL-MICRÓFONO  (dentro de PANTALLA-AJUSTES)
       Qué cambia aquí: activar el micrófono, exigencia, motor y descarga de
       la voz sin conexión (modelo de 34 MB).
       ==================================================================== */
    const filasMic = [];
    if (window.Mic && Mic.hayMicrofono()) {
      filasMic.push(crearInterruptor("Botón de micrófono (practicar la pronunciación)",
        Mic.config.activado, (on) => {
          Mic.configurar({ activado: on });
          UI.mostrarAviso(on ? "Micrófono activado" : "Micrófono apagado");
        }));

      filasMic.push(crearSelector(
        "Cuán estricto al juzgar la pronunciación",
        [["facil", "Fácil (casi cualquier intento cuenta)"],
         ["normal", "Normal (recomendado)"],
         ["estricto", "Estricto (hay que decirlo casi igual)"]],
        Mic.config.umbral || "normal",
        (v) => { Mic.configurar({ umbral: v }); UI.mostrarAviso("Exigencia actualizada"); }));

      filasMic.push(crearSelector(
        "Cómo escucha",
        [["auto", "Automático (recomendado)"],
         ["navegador", "Solo el navegador"],
         ["offline", "Solo sin conexión (modelo local)"]],
        Mic.config.modo || "auto",
        (v) => { Mic.configurar({ modo: v }); UI.mostrarAviso("Modo de práctica actualizado"); }));

      // Estado y descarga del modelo sin conexión
      const cajaModelo = document.createElement("div");
      cajaModelo.className = "ficha-modelo";
      const textoModelo = document.createElement("p");
      textoModelo.className = "nota-ajustes";
      const botonDescarga = UI.boton("Descargar voz sin conexión (34 MB)", "boton-secundario", iniciarDescarga);
      cajaModelo.append(textoModelo, botonDescarga);
      filasMic.push(cajaModelo);

      (function actualizarEstadoModelo() {
        Mic.estadoModelo().then((e) => {
          const motorNav = Mic.hayNavegador()
            ? "Reconocimiento del navegador: disponible."
            : "Este navegador no reconoce voz: se usará la voz sin conexión.";
          if (e === "listo" || e === "disponible") {
            textoModelo.textContent = motorNav + " Voz sin conexión: lista. Ya se puede practicar sin internet.";
            botonDescarga.hidden = true;
          } else if (e === "descargando") {
            textoModelo.textContent = "Descargando la voz sin conexión…";
          } else {
            textoModelo.textContent = motorNav +
              " Voz sin conexión: sin descargar. Se descargará (34 MB) la primera vez que se practique, o ahora con el botón.";
            botonDescarga.hidden = false;
          }
        }).catch(() => {});
      })();

      function iniciarDescarga() {
        botonDescarga.disabled = true;
        botonDescarga.textContent = "Descargando… 0 %";
        Mic.descargarModelo((p) => {
          botonDescarga.textContent = "Descargando… " + Math.round(p * 100) + " %";
        }).then(() => {
          botonDescarga.hidden = true;
          textoModelo.textContent = "¡Voz sin conexión lista! Ya funciona sin internet.";
          UI.mostrarAviso("Voz sin conexión lista");
          UI.anunciar("Voz sin conexión lista");
        }).catch((e) => {
          botonDescarga.disabled = false;
          botonDescarga.textContent = "Reintentar la descarga (34 MB)";
          const cod = e && e.codigo;
          let texto = (window.Mic && Mic.mensajes[cod]) || "No se pudo descargar: comprueba tu conexión";
          if (!window.isSecureContext) {
            texto += " · Abre la app con HTTPS para poder guardarla";
          }
          UI.mostrarAviso(texto);
        });
      }
    } else if (window.Mic) {
      const notaMic = document.createElement("p");
      notaMic.className = "nota-ajustes";
      notaMic.textContent = window.isSecureContext
        ? "Este dispositivo no tiene micrófono: no se puede practicar la pronunciación."
        : "El micrófono está bloqueado porque la app está en HTTP (red local). " +
          "Ábrela con HTTPS o desde localhost para practicar la pronunciación.";
      filasMic.push(notaMic);
    }

    /* ======================================================================
       SECCIÓN: PUERTA-DE-ADULTO  (dentro de PANTALLA-AJUSTES)
       Dos interruptores independientes, ambos APAGADOS por defecto:
         1) Autocuidado -> «Mi cuerpo» + «Higiene» (vida diaria)
         2) Sensibles   -> «Público y privado» + «Límites y seguridad» + «Pubertad»
       Cada uno pide una pregunta de adulto para encenderse (así un niño no
       puede activarlas por accidente) y apagarlos es inmediato. Al activarlos,
       SOLO aparecen las tarjetas de ese grupo, en su sitio (al final del HOME).
       Ver SECCIÓN: DATOS-CUERPO-Y-SEGURIDAD.
       ==================================================================== */
    const filasCuerpo = [];
    if (window.Cuerpo && window.CUERPO_NIVELES) {
      filasCuerpo.push(crearFilaSeccion({
        grupo: "autocuidado",
        titulo: "Autocuidado: Mi cuerpo y Higiene",
        nota: "Partes del cuerpo y hábitos de higiene (vida diaria)."
      }));
      filasCuerpo.push(crearFilaSeccion({
        grupo: "sensibles",
        titulo: "Temas sensibles: privacidad, límites y pubertad",
        nota: "Para trabajar siempre con un adulto: privacidad, seguridad y cambios corporales."
      }));
    }

    // Interruption: voz activada
    const filaVoz = crearInterruptor("Pronunciar al tocar", Voz.config.activado, (on) => {
      Voz.configurar({ activado: on });
      if (on) Voz.hablar("Voz activada");
      else Voz.detener();
    });

    // Interruptor: campanita de acierto
    const filaCampana = crearInterruptor("Sonido al completar la frase", Voz.config.campana !== false, (on) => {
      Voz.configurar({ campana: on });
      if (on) Voz.sonidoExito();
    });

    // Botón de prueba
    const prueba = UI.boton("Probar la voz", "boton-primario", () => Voz.hablar("Hola, soy tu voz"));

    ficha.append(filaVel, filaOrigen, estadoFila, ...filasMic, ...filasCuerpo, filaVoz, filaCampana, prueba);
    const botonCreditos = UI.boton("Créditos y licencias", "boton-secundario",
      () => ctx.irA("creditos"));
    botonCreditos.classList.add("boton-ancho");
    ficha.appendChild(botonCreditos);

    raiz.appendChild(ficha);

    const nota = document.createElement("p");
    nota.className = "nota-ajustes";
    nota.textContent = "Los ajustes se guardan en este dispositivo.";
    raiz.appendChild(nota);

    Gestos.actualizar({ volver: () => ctx.volver() });
    return raiz;
  }

  /* ==========================================================================
     SECCIÓN: PANTALLA-CREDITOS
     --------------------------------------------------------------------------
     Qué cambia aquí: textos de autoría, licencias y créditos. Incluye la
     SECCIÓN: CREDITOS-DE-IA (modelos de inteligencia artificial usados).
     IMPORTANTE: la atribución de ARASAAC es OBLIGATORIA por licencia
     (CC BY-NC-SA). No borrar ni reformular la cita de pictogramas.
     ======================================================================== */
  function creditos(ctx) {
    const raiz = document.createElement("section");
    raiz.className = "pantalla pantalla-creditos";
    raiz.innerHTML = `
      <h2>Créditos y licencias</h2>

      <div class="ficha-credito">
        <h3>Autoría</h3>
        <p class="autor">Francisco Javier Fuentes Rodriguez</p>
        <p class="nota-ajustes">Autor de PictoAmigos: diseño, desarrollo y contenido.</p>
      </div>

      <div class="ficha-credito">
        <h3>Licencia de la app</h3>
        <p><strong>PictoAmigos — software libre gratuito.</strong>
        Licencia del código: <strong>GNU GPL-3.0 o superior</strong> (texto completo en el
        fichero <code>LICENSE</code> del proyecto).</p>
        <p class="nota-ajustes">Los pictogramas ARASAAC mantienen su licencia
        <strong>CC BY-NC-SA</strong> (uso no comercial + atribución), por lo que la app
        completa no puede usarse con fines comerciales.</p>
        <ul class="enlaces">
          <li><a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener">GNU GPL-3.0</a></li>
          <li><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0 (pictogramas)</a></li>
        </ul>
      </div>

      <div class="ficha-credito">
        <h3>Pictogramas — ARASAAC</h3>
        <p>Los símbolos pictográficos utilizados son propiedad del Gobierno de Aragón
        y han sido creados por <strong>Sergio Palao</strong> para
        <strong>ARASAAC</strong> (arasaac.org), que los distribuye bajo licencia
        <strong>Creative Commons BY-NC-SA</strong>.</p>
        <p class="cita">Autor pictogramas: Sergio Palao · Origen: ARASAAC (arasaac.org) ·
        Licencia: CC (BY-NC-SA) · Propiedad: Gobierno de Aragón (España)</p>
        <ul class="enlaces">
          <li><a href="https://arasaac.org" target="_blank" rel="noopener">arasaac.org</a></li>
          <li><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">Licencia CC BY-NC-SA 4.0</a></li>
        </ul>
        <p class="nota-ajustes">Uso no comercial. Cualquier material derivado debe
        compartirse con la misma licencia y citando la fuente.</p>
      </div>

      <div class="ficha-credito">
        <h3>Voz de la app</h3>
        <p>Síntesis de voz con <strong>Piper TTS</strong> (GPL-3.0), que genera los
        MP3 incluidos en <code>audio/</code>.</p>
        <ul class="lista-credito">
          <li><strong>es_MX-claude-high</strong> — voz de la app · dataset <em>apache-2.0</em></li>
          <li>es_MX-ald-medium · dataset <em>Unlicense</em></li>
          <li>es_AR-daniela-high · dataset <em>CC BY-SA 4.0</em></li>
          <li>es_ES-sharvard-medium · dataset <em>CC BY 3.0</em></li>
          <li>es_ES-davefx-medium · dataset <em>CC0</em></li>
        </ul>
        <p class="nota-ajustes">Respaldo si Piper no está instalado: espeak-ng (GPL-3.0).</p>
      </div>

      <div class="ficha-credito">
        <h3>Modelos de inteligencia artificial</h3>
        <p class="subtitulo">Usados por la app:</p>
        <ul class="lista-credito">
          <li><strong>Piper TTS · es_MX-claude-high</strong> — síntesis de voz neuronal (TTS).</li>
          <li><strong>Vosk / Kaldi · vosk-model-small-es-0.3</strong> — reconocimiento de voz (ASR) · Apache 2.0.</li>
          <li><strong>Vosk-Browser</strong> — compilación WebAssembly de Vosk · Apache 2.0 (Ciaran O'Reilly; bindings WASM originales de Denis Treskunov).</li>
        </ul>
        <p class="subtitulo">Usados para crear esta app:</p>
        <ul class="lista-credito">
          <li><strong>MiMo</strong> (opencode-go) — modelo de IA que asistió el desarrollo.</li>
          <li><strong>OpenCode</strong> — entorno de programación con IA.</li>
        </ul>
      </div>

      <div class="ficha-credito">
        <h3>Otras herramientas</h3>
        <ul class="lista-credito">
          <li><strong>ffmpeg / LAME</strong> — conversión de audio a MP3.</li>
          <li><strong>espeak-ng</strong> — motor de voz de respaldo · GPL-3.0.</li>
          <li><strong>ARASAAC API</strong> — consulta de pictogramas (api.arasaac.org).</li>
        </ul>
      </div>
    `;
    Gestos.actualizar({ volver: () => ctx.volver() });
    return raiz;
  }

  /* ======================================================================
     SECCIÓN: PUERTA-DE-ADULTO — fila de Ajustes con interruptor + pregunta.
     Devuelve la fila lista para añadir a la ficha de Ajustes.
     ==================================================================== */
  function crearFilaSeccion({ grupo, titulo, nota }) {
    const fila = document.createElement("div");
    fila.className = "fila-ajuste";

    const conmutador = document.createElement("label");
    conmutador.className = "fila-interruptor";
    const etiqueta = document.createElement("span");
    etiqueta.textContent = titulo;
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    const pista = document.createElement("span");
    pista.className = "interruptor";
    conmutador.append(etiqueta, casilla, pista);

    const detalle = document.createElement("p");
    detalle.className = "nota-ajustes";

    const pintar = () => {
      const activo = window.Cuerpo && Cuerpo.grupoActivo(grupo);
      casilla.checked = !!activo;
      detalle.textContent = activo
        ? "Activado: sus tarjetas aparecen al final del HOME."
        : "Desactivado (por defecto). " + nota;
    };
    pintar();

    function abrirPuerta() {
      if (fila.querySelector(".puerta-adulto")) return;
      const a = 4 + Math.floor(Math.random() * 6);     //4..9
      const b = 3 + Math.floor(Math.random() * 6);     //3..8

      const panel = document.createElement("div");
      panel.className = "puerta-adulto";

      const avisoPuerta = document.createElement("p");
      avisoPuerta.className = "nota-ajustes";
      avisoPuerta.textContent = "Puerta de adulto: confirma antes de mostrar el contenido.";

      const pregunta = document.createElement("p");
      pregunta.className = "pregunta-adulto";
      pregunta.textContent = `¿Cuánto es ${a} × ${b}?`;

      const campo = document.createElement("input");
      campo.type = "number";
      campo.inputMode = "numeric";
      campo.min = "0";
      campo.setAttribute("aria-label", "Respuesta");

      const avisos = document.createElement("span");
      avisos.className = "nota-ajustes";

      const botones = document.createElement("div");
      botones.className = "acciones";
      const aceptar = UI.boton("Activar", "boton-primario", () => {
        if (Number(campo.value) === a * b) {
          window.Cuerpo.activar(grupo);
          panel.remove();
          pintar();
          UI.mostrarAviso("Activado: sus tarjetas aparecen en el HOME.");
          UI.anunciar(titulo + " activado");
        } else {
          avisos.textContent = "Respuesta incorrecta. Inténtalo de nuevo.";
          campo.value = "";
          campo.focus();
        }
      });
      const cancelar = UI.boton("Cancelar", "boton-secundario", () => {
        panel.remove();
        pintar();
      });
      botones.append(aceptar, cancelar);

      panel.append(avisoPuerta, pregunta, campo, avisos, botones);
      fila.appendChild(panel);
      campo.focus();
    }

    casilla.addEventListener("change", () => {
      if (casilla.checked) {
        casilla.checked = false;      // todavía NO activado: falta la puerta
        abrirPuerta();
      } else {
        window.Cuerpo.desactivar(grupo);
        pintar();
        UI.mostrarAviso("Sección desactivada");
        UI.anunciar(titulo + " desactivada");
      }
    });

    fila.append(conmutador, detalle);
    return fila;
  }

  /** Fila con un desplegable (selector) de opciones. */
  function crearSelector(texto, opciones, valorActual, onChange) {
    const fila = document.createElement("label");
    fila.className = "fila-ajuste";
    const titulo = document.createElement("span");
    titulo.textContent = texto;
    const sel = document.createElement("select");
    sel.className = "selector-voz";
    opciones.forEach(([valor, etiqueta]) => {
      const op = document.createElement("option");
      op.value = valor;
      op.textContent = etiqueta;
      sel.appendChild(op);
    });
    sel.value = valorActual;
    sel.addEventListener("change", () => onChange(sel.value));
    fila.append(titulo, sel);
    return fila;
  }

  function crearInterruptor(texto, activado, onChange) {
    const fila = document.createElement("label");
    fila.className = "fila-ajuste fila-interruptor";
    const span = document.createElement("span");
    span.textContent = texto;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!activado;
    const pista = document.createElement("span");
    pista.className = "interruptor";
    input.addEventListener("change", () => onChange(input.checked));
    fila.append(span, input, pista);
    return fila;
  }

  return { home, nivel, frases, ajustes, creditos };
})();
