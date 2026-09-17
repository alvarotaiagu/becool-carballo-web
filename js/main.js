/* BeCool · Carballo — movimiento y utilidades.

   GSAP, ScrollTrigger y Lenis llegan de un CDN. Si fallan (bloqueador,
   red, CDN caido) nada de aqui puede romper la pagina: las prendas
   salen colgadas en su sitio, los marcos dibujados, el horario y el
   mapa funcionan igual. Por eso los estados "vacios" del CSS viven
   bajo html.has-motion, que solo se enciende desde este archivo.

   Movimiento de esta plantilla: DE TIENDA. Cosas que se deslizan por
   una barra y frenan con el balanceo minimo de una percha. Nada de
   canvas, nada de pendulos largos, nada de blur por frame. */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const motion = gsapReady && !reduce;
  const html = document.documentElement;
  if (gsapReady) gsap.registerPlugin(ScrollTrigger);
  if (motion) html.classList.add("has-motion");
  if (!gsapReady) html.classList.add("sin-gsap");

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ================================================================
     Aviso de cookies
     El boton tiene que cerrarlo de verdad: se oculta con [hidden] y en
     el CSS el display flex esta en :not([hidden]), no en la clase, asi
     que nada puede ganarle.
     ================================================================ */
  (function avisoCookies() {
    const banner = $(".cookie-banner");
    const ack = $(".cookie-ack");
    if (!banner || !ack) return;
    const CLAVE = "becool-cookie-ack";
    let visto = false;
    try { visto = localStorage.getItem(CLAVE) === "1"; } catch (e) {}
    if (!visto) banner.hidden = false;
    ack.addEventListener("click", () => {
      banner.hidden = true;
      try { localStorage.setItem(CLAVE, "1"); } catch (e) {}
    });
  })();

  /* ================================================================
     Menu movil
     ================================================================ */
  (function menuMovil() {
    const boton = $(".nav-boton");
    const menu = $("#nav-movil");
    if (!boton || !menu) return;
    const cerrar = () => { menu.hidden = true; boton.setAttribute("aria-expanded", "false"); };
    boton.addEventListener("click", () => {
      const abierto = boton.getAttribute("aria-expanded") === "true";
      menu.hidden = abierto;
      boton.setAttribute("aria-expanded", String(!abierto));
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", cerrar));
    window.addEventListener("resize", () => { if (window.innerWidth > 900) cerrar(); });
  })();

  /* ================================================================
     Mapa con consentimiento
     El iframe de Google NO existe hasta que se pulsa el boton: es lo
     unico coherente con el aviso de "sin cookies de terceros".
     ================================================================ */
  (function mapa() {
    const caja = $("[data-mapa]");
    if (!caja) return;
    const boton = $("button", caja);
    if (!boton) return;
    boton.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = caja.dataset.src;
      iframe.loading = "lazy";
      iframe.title = "Mapa de BeCool en Rúa Hórreo, 14, Carballo";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      caja.innerHTML = "";
      caja.classList.add("cargado");
      caja.appendChild(iframe);
    });
  })();

  /* ================================================================
     Horario: qué día es hoy y si la tienda está abierta ahora
     Esto NO es movimiento: tiene que pasar tambien con movimiento
     reducido y sin GSAP.
     ================================================================ */
  (function horario() {
    const tramos = {
      0: [[10.5, 14]],
      1: [[10.5, 13.75], [17, 20.5]],
      2: [[10.5, 13.75], [17, 20.5]],
      3: [[10.5, 13.75], [17, 20.5]],
      4: [[10.5, 13.75], [17, 20.5]],
      5: [[10.5, 13.75], [17, 20.5]],
      6: [[10.5, 14]]
    };
    const ahora = new Date();
    const dia = ahora.getDay();
    const hora = ahora.getHours() + ahora.getMinutes() / 60;

    const fila = $('.dia[data-dia="' + dia + '"]');
    if (fila) fila.setAttribute("data-hoy", "");

    const estado = $("[data-estado]");
    if (!estado) return;
    const abierto = (tramos[dia] || []).some(([a, b]) => hora >= a && hora < b);
    estado.textContent = abierto ? "Abierto ahora" : "Cerrado ahora";
    estado.setAttribute("data-abierto", abierto ? "si" : "no");
    estado.hidden = false;
  })();

  /* ================================================================
     Recorrido de la pagina
     Cuanto llevas visto. Es informacion, no adorno: se actualiza
     tambien con movimiento reducido y sin GSAP. Solo toca transform,
     nada de layout, y se limita a un fotograma con rAF.
     ================================================================ */
  (function recorrido() {
    const barra = $(".progreso-recorrido");
    const percha = $(".progreso-percha");
    if (!barra || !percha) return;
    let pendiente = false;

    function pinta() {
      pendiente = false;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const p = alto > 0 ? Math.min(1, Math.max(0, window.scrollY / alto)) : 0;
      barra.style.transform = "scaleX(" + p.toFixed(4) + ")";
      /* la percha recorre de 14 a ancho-14 para no quedarse medio fuera
         de pantalla ni al principio ni al final */
      const ancho = document.documentElement.clientWidth;
      percha.style.transform = "translateX(" + (14 + p * (ancho - 28)).toFixed(1) + "px)";
    }
    function pide() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pinta);
    }
    window.addEventListener("scroll", pide, { passive: true });
    window.addEventListener("resize", pide);
    pinta();
  })();

  /* ================================================================
     Contador de reseñas
     Con movimiento reducido no se anima, pero el numero tiene que
     quedar puesto igual: el contenido no depende del movimiento.
     ================================================================ */
  (function contador() {
    $$("[data-contador-num]").forEach((el) => {
      const fin = parseInt(el.dataset.contadorNum, 10) || 0;
      if (!motion) { el.textContent = String(fin); return; }
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: fin,
            duration: 1.1,
            ease: "power2.out",
            onUpdate: () => { el.textContent = String(Math.round(obj.v)); }
          });
        }
      });
    });
  })();

  /* ================================================================
     Novedades: "Recién colgado" desde una hoja de Google
     ----------------------------------------------------------------
     Las 6 prendas de ejemplo ya estan pintadas en el HTML. Aqui solo
     se intenta sustituirlas. Si la hoja no esta configurada, no
     responde, viene vacia o viene rota, NO se toca nada y NO se
     enseña ningun error: se queda lo pintado.

     Como se rellena la hoja: ver el comentario grande de index.html
     y el README.
     ================================================================ */
  function pintarNovedades(filas) {
    const lista = $("#lista-novedades");
    if (!lista || !filas.length) return false;

    const etiquetaSVG =
      '<svg viewBox="0 0 116 86" width="116" height="86">' +
      '<path d="M38,0 V52" stroke="#111" stroke-width="1.5" fill="none"/>' +
      '<path d="M14,56 L32,34 H108 a4,4 0 0 1 4,4 V74 a4,4 0 0 1 -4,4 H32 Z" fill="var(--acento)"/>' +
      '<circle cx="38" cy="56" r="5.5" fill="#FFF"/></svg>';

    /* Un enlace de Drive copiado a mano (".../file/d/ID/view") no sirve
       como src de una imagen: hay que pedirle la miniatura. Se hace aqui
       para que la tienda pueda pegar el enlace tal cual lo copia. */
    const aImagen = (url) => {
      const m = String(url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^#]*id=)([-\w]{20,})/);
      return m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1200" : url;
    };

    const esc = (t) => String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    lista.innerHTML = filas.map((p, i) => {
      const enlace = p.instagram || "https://www.instagram.com/becoolcarballo/";
      const foto = p.foto
        ? '<span class="prenda-foto"><img src="' + esc(aImagen(p.foto)) + '" alt="' + esc(p.nombre) + '" loading="lazy" decoding="async"></span>'
        : '<span class="prenda-foto" data-sin-foto><span class="prenda-vacio">[FOTO PENDIENTE]</span></span>';
      const precio = p.precio
        ? '<span class="etiqueta" aria-hidden="true">' + etiquetaSVG + "<b>" + esc(p.precio) + "</b></span>" +
          '<span class="sr">' + esc(p.precio) + "</span>"
        : "";
      return (
        '<li class="prenda" style="--n:' + i + '">' +
          '<a class="prenda-caja" href="' + esc(enlace) + '" target="_blank" rel="noopener">' +
            '<span class="prenda-gancho" aria-hidden="true"></span>' +
            foto +
            '<span class="prenda-datos">' +
              '<span class="prenda-cat">' + esc(p.categoria || "") + "</span>" +
              '<span class="prenda-nombre">' + esc(p.nombre || "") + "</span>" +
              '<span class="prenda-tallas">' + esc(p.tallas || "") + "</span>" +
            "</span>" +
            precio +
          "</a>" +
        "</li>"
      );
    }).join("");

    /* fuera la nota de "estas prendas salen de su Instagram": al
       conectar la hoja ya no vienen de ahi. El aviso del WhatsApp
       pendiente se queda, que ese sigue haciendo falta. */
    const aviso = $("[data-aviso-ejemplo]");
    if (aviso) aviso.remove();
    return true;
  }

  (function novedades() {
    const cfg = window.BECOOL_NOVEDADES || {};
    /* mientras el ID siga sin poner, ni se pide nada */
    if (!cfg.id || /PENDIENTE/i.test(cfg.id)) return;

    const url = "https://docs.google.com/spreadsheets/d/" + encodeURIComponent(cfg.id) +
      "/gviz/tq?tqx=out:json&sheet=" + encodeURIComponent(cfg.hoja || "Novedades");

    const limpia = (t) => String(t || "").trim().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");

    /* credentials "omit": la respuesta de Google trae un Set-Cookie y
       sin esto se guardaria una cookie de terceros, que es justo lo que
       el aviso de la web promete que no pasa. */
    fetch(url, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((txt) => {
        /* la respuesta de gviz viene envuelta en una llamada JS */
        const i = txt.indexOf("{");
        const j = txt.lastIndexOf("}");
        if (i < 0 || j < 0) throw new Error("respuesta inesperada");
        const datos = JSON.parse(txt.slice(i, j + 1));
        const tabla = datos.table || {};
        const cols = (tabla.cols || []).map((c) => limpia(c.label || c.id));
        const filas = (tabla.rows || []).map((fila) => {
          const p = {};
          (fila.c || []).forEach((celda, n) => {
            const clave = cols[n];
            if (!clave) return;
            p[clave] = celda ? (celda.f != null ? celda.f : celda.v) : "";
          });
          return p;
        }).filter((p) => p.nombre);

        if (!filas.length) return;
        if (pintarNovedades(filas) && motion) {
          prepararPrendas();
          ScrollTrigger.refresh();
        }
      })
      .catch(() => { /* silencio: se quedan los ejemplos ya pintados */ });
  })();

  /* ================================================================
     Carrusel de novedades: arrastre + cambio de vista
     Es arrastre y scroll-snap nativo a proposito. Un pinned
     horizontal con scrub arrastra el retraso de Lenis y se ve como
     si el contenido tirase hacia el lado contrario.
     ================================================================ */
  (function carrusel() {
    const lista = $("#lista-novedades");
    const colgador = lista && lista.closest(".colgador");
    if (!lista || !colgador) return;

    let arrastrando = false, xInicio = 0, scrollInicio = 0, movido = 0;

    lista.addEventListener("pointerdown", (e) => {
      if (colgador.dataset.vistaActual !== "carrusel") return;
      if (e.pointerType === "touch") return;   /* el tactil ya arrastra solo */
      arrastrando = true;
      movido = 0;
      xInicio = e.clientX;
      scrollInicio = lista.scrollLeft;
      lista.setPointerCapture(e.pointerId);
      lista.classList.add("arrastrando");
    });
    lista.addEventListener("pointermove", (e) => {
      if (!arrastrando) return;
      const dx = e.clientX - xInicio;
      movido = Math.max(movido, Math.abs(dx));
      lista.scrollLeft = scrollInicio - dx;
    });
    const soltar = (e) => {
      if (!arrastrando) return;
      arrastrando = false;
      lista.classList.remove("arrastrando");
      try { lista.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    lista.addEventListener("pointerup", soltar);
    lista.addEventListener("pointercancel", soltar);
    /* un arrastre no debe acabar abriendo Instagram */
    lista.addEventListener("click", (e) => { if (movido > 6) { e.preventDefault(); movido = 0; } }, true);

    const pista = $("[data-pista-arrastre]");
    const revisaPista = () => {
      if (!pista) return;
      const hayMas = lista.scrollWidth - lista.clientWidth > 8;
      pista.style.visibility = hayMas && colgador.dataset.vistaActual === "carrusel" ? "visible" : "hidden";
    };
    lista.addEventListener("scroll", revisaPista, { passive: true });
    window.addEventListener("resize", revisaPista);
    revisaPista();

    $$(".vista-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const vista = btn.dataset.vista;
        colgador.dataset.vistaActual = vista;
        $$(".vista-btn").forEach((b) => {
          const activa = b === btn;
          b.classList.toggle("activa", activa);
          b.setAttribute("aria-pressed", String(activa));
        });
        if (vista === "rejilla") lista.scrollLeft = 0;
        revisaPista();
        if (gsapReady) ScrollTrigger.refresh();
      });
    });
  })();

  /* ================================================================
     A partir de aqui, solo movimiento.
     ================================================================ */
  if (!motion) return;

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, lerp: 0.12, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const destino = document.querySelector(a.getAttribute("href"));
        if (!destino) return;
        e.preventDefault();
        const nav = parseFloat(getComputedStyle(html).getPropertyValue("--nav-h")) *
          (parseFloat(getComputedStyle(html).fontSize) || 16);
        lenis.scrollTo(destino, { offset: -(nav || 72) - 8 });
      });
    });
  }

  /* ---------- División en caracteres (accesible) ----------
     El texto se sustituye por spans, asi que la frase entera se
     conserva en aria-label y los spans quedan ocultos al lector.
     La palabra va en inline-block + nowrap: si no, con las letras en
     inline-block el navegador parte las palabras por la mitad. */
  function partirEnLetras(el) {
    const texto = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", texto);
    el.textContent = "";
    const letras = [];
    texto.split(" ").forEach((palabra, i, todas) => {
      const ws = document.createElement("span");
      ws.className = "split-word";
      ws.setAttribute("aria-hidden", "true");
      Array.from(palabra).forEach((ch) => {
        const cs = document.createElement("span");
        cs.className = "split-char";
        cs.textContent = ch;
        ws.appendChild(cs);
        letras.push(cs);
      });
      el.appendChild(ws);
      if (i < todas.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return letras;
  }

  $$("[data-split-char]").forEach((el) => {
    const letras = partirEnLetras(el);
    gsap.set(letras, { yPercent: 55, opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(letras, {
        yPercent: 0,
        opacity: 1,
        duration: 0.95,
        ease: "power3.out",
        stagger: 0.022
      })
    });
  });

  /* ---------- Los marcos de los paños se dibujan ---------- */
  $$("[data-pano] .pano-marco").forEach((marco) => {
    const lados = $$("i", marco);
    if (lados.length < 4) return;
    ScrollTrigger.create({
      trigger: marco.parentElement,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { duration: 0.38, ease: "power2.inOut" } });
        tl.to(lados[0], { scaleX: 1 })
          .to(lados[1], { scaleY: 1 }, "-=0.12")
          .to(lados[2], { scaleX: 1 }, "-=0.12")
          .to(lados[3], { scaleY: 1 }, "-=0.12");
      }
    });
  });

  /* ---------- Hero: las prendas entran deslizando por la barra ----------
     Balanceo minimo de percha al frenar: una oscilacion de +-2 grados y
     se acabo. Nada de pendulo largo. */
  (function heroPerchas() {
    const perchas = $$(".percha");
    if (!perchas.length) return;
    const desde = window.innerWidth + 120;
    gsap.set(perchas, { x: desde, rotation: 0 });
    const tl = gsap.timeline({ delay: 0.15 });
    perchas.forEach((p, i) => {
      const t = i * 0.085;
      tl.to(p, { x: 0, duration: 0.78, ease: "power3.out" }, t)
        .to(p, { rotation: -2.1, duration: 0.3, ease: "sine.out" }, t + 0.62)
        .to(p, { rotation: 0, duration: 0.85, ease: "sine.inOut" }, t + 0.92);
    });
  })();

  /* ---------- Hero: el resto del vinilo ---------- */
  (function heroTexto() {
    const partes = [
      $(".hero-vinilo"), $(".hero-linea"), $(".hero-insignia"), $(".hero-botones")
    ].filter(Boolean);
    if (!partes.length) return;
    gsap.from(partes, {
      y: 22,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.5
    });
    const raya = $(".hero-entrar i");
    if (raya) gsap.from(raya, { scaleY: 0, duration: 0.9, ease: "power2.out", delay: 1.2 });
  })();

  /* ---------- Las tarjetas se deslizan a su sitio en la barra ----------
     Se envuelve en una funcion porque hay que volver a llamarla si la
     hoja de novedades sustituye las tarjetas. */
  function prepararPrendas() {
    const prendas = $$("#lista-novedades .prenda");
    if (!prendas.length) return;
    gsap.killTweensOf(prendas);
    gsap.set(prendas, { x: 90, opacity: 0, rotation: 0 });
    ScrollTrigger.create({
      trigger: "#lista-novedades",
      start: "top 82%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline();
        prendas.forEach((p, i) => {
          const t = i * 0.07;
          tl.to(p, { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, t)
            .to(p, { rotation: -1.6, duration: 0.26, ease: "sine.out" }, t + 0.55)
            .to(p, { rotation: 0, duration: 0.8, ease: "sine.inOut" }, t + 0.81);
        });
      }
    });
  }
  prepararPrendas();

  /* ---------- Fotos y huecos que suben al entrar ---------- */
  $$(".hueco figure, .insta-rejilla li, .pano-cat .pano-dentro > *").forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });

  /* ---------- Las barras del horario crecen desde la izquierda ---------- */
  $$(".franjas-dias .dia").forEach((dia, i) => {
    const tramos = $$(".tramo", dia);
    if (!tramos.length) return;
    gsap.from(tramos, {
      scaleX: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.08,
      scrollTrigger: { trigger: dia, start: "top 92%", once: true },
      delay: i * 0.03
    });
  });

  /* ---------- Marquesina: lenta y continua ----------
     La pista lleva el texto 4 veces; moverla un cuarto y repetir es un
     bucle sin costura y sin recalcular nada por frame. */
  (function marquesina() {
    const pista = $(".marquesina-pista");
    if (!pista) return;
    gsap.to(pista, { xPercent: -25, duration: 38, ease: "none", repeat: -1 });
  })();

  /* ---------- Botones magneticos ---------- */
  $$(".magnetico").forEach((el) => {
    const fuerza = 0.28;
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * fuerza,
        y: (e.clientY - (r.top + r.height / 2)) * fuerza,
        duration: 0.45,
        ease: "power3.out"
      });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    });
  });

  /* ---------- La cabecera se retira al bajar ---------- */
  (function cabecera() {
    const nav = $("#barra-nav");
    if (!nav) return;
    let ultimo = 0;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        if (y < 120 || $("#nav-movil") && !$("#nav-movil").hidden) {
          gsap.to(nav, { yPercent: 0, duration: 0.35, overwrite: true });
        } else if (y > ultimo + 6) {
          gsap.to(nav, { yPercent: -100, duration: 0.4, overwrite: true });
        } else if (y < ultimo - 6) {
          gsap.to(nav, { yPercent: 0, duration: 0.35, overwrite: true });
        }
        ultimo = y;
      }
    });
  })();

})();
