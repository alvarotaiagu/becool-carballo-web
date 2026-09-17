# BeCool · Clothing, shoes & more — Carballo

Web de una página para **BeCool**, tienda de ropa de mujer en Rúa Hórreo, 14,
Carballo (A Coruña). HTML, CSS y un archivo de JavaScript. Sin framework, sin
build, sin backend: se sube tal cual a cualquier hosting estático.

**Publicada en <https://alvarotaiagu.github.io/becool-carballo-web/>**

El concepto es **«Escaparate»**: la cristalera de marco negro de Rúa Hórreo
llevada a la pantalla. Todo cuelga de una barra, todo se ve desde la calle, y
se entra. No hay carrito ni pagos: se compra en la tienda.

---

## 1. Lo que hay que rellenar (pendiente)

Todo lo que no estaba confirmado aparece en la web con un marcador visible
entre corchetes. No se ha inventado ningún dato. Búsquedas útiles:

```bash
grep -n "PENDIENTE\|EJEMPLO\|CONFIRMAR" index.html
```

| Marcador | Dónde | Qué hace falta |
|---|---|---|
| `[WHATSAPP PENDIENTE]` | Contacto y Recién colgado | ¿Se reservan prendas por WhatsApp? ¿Con qué número? |
| `a confirmar` (correo) | Contacto | El correo solo aparece en Páxinas Galegas, no en fuente propia |
| `[CONFIRMAR EL RESTO DE MARCAS]` | Qué encontrarás | Solo está confirmada **Oraije Paris**, que cita ella en Instagram |
| `[TEXTOS DE RESEÑA PENDIENTES]` | Reseñas | Textos y nombres de las reseñas de Google |
| `[FOTO DEL ESCAPARATE PENDIENTE]` | Dentro de la tienda | Falta la foto del escaparate desde la calle |
| `[HORARIO ESPECIAL PENDIENTE]` | Cuándo venir | Festivos y cierre por vacaciones |
| **Domingos** | Cuándo venir | Google dice «domingo 10:30–14:00»; Páxinas Galegas dice «sábados y **domingos de feria**». Hay que preguntarlo |

Datos **reales y confirmados** que ya están puestos: nombre y tagline, dirección,
categoría, valoración 4,6 ★ con 10 reseñas, horario, Facebook e Instagram,
**teléfono 881 16 81 51** (lo publica ella en su biografía de Instagram y coincide
con Páxinas Galegas), las **seis prendas con su precio y sus tallas** y **todas las
fotografías**, que son suyas.

---

## 2. «Recién colgado»: las novedades desde una hoja de cálculo

Es la única parte pensada para cambiar cada semana, y se cambia **sin tocar
código**: se edita una hoja de Google y la web la lee sola al cargar.

### Cómo se monta, paso a paso

1. Crear una hoja de cálculo en Google Drive.
2. Renombrar la pestaña como **`Novedades`**.
3. Poner en la **fila 1** estas cabeceras, en este orden y escritas así:

   | nombre | categoria | precio | tallas | foto | instagram |
   |---|---|---|---|---|---|

4. Una fila por prenda. Ejemplo:

   | nombre | categoria | precio | tallas | foto | instagram |
   |---|---|---|---|---|---|
   | Vestido midi de punto | ropa | 39 € | S · M · L | https://… | https://www.instagram.com/p/… |
   | Botín de tacón bajo | calzado | 59 € | 36 · 37 · 39 | https://… | https://www.instagram.com/p/… |

   - **nombre** — obligatorio. Las filas sin nombre se ignoran.
   - **categoria** — `ropa`, `calzado` o `complemento`.
   - **precio** — texto libre, se pinta tal cual (`39 €`, `desde 25 €`…).
     Si se deja vacío, esa prenda sale sin etiqueta de precio.
   - **tallas** — texto libre (`S · M · L`, `TALLA ÚNICA`, `36 al 41`…).
   - **foto** — URL pública de la imagen. Vale Drive (compartido como
     «cualquiera con el enlace»), Imgur, o la propia imagen de Instagram.
     El enlace de Drive se puede pegar **tal cual se copia**
     (`drive.google.com/file/d/ID/view`): la web lo convierte sola a la
     miniatura que sí se puede mostrar. Si se deja vacío, sale el hueco con
     `[FOTO PENDIENTE]`.
   - **instagram** — enlace al post de esa prenda. Si se deja vacío, el enlace
     lleva al perfil.

5. **Archivo → Compartir → Publicar en la web.**
6. Copiar el ID de la hoja desde su propia URL:

   ```
   docs.google.com/spreadsheets/d/  ESTO_ES_EL_ID  /edit
   ```

7. Pegarlo en `index.html`, en el bloque que hay justo antes de `</head>`:

   ```js
   window.BECOOL_NOVEDADES = {
     id: "1AbCdEf...",     // <- aquí
     hoja: "Novedades"
   };
   ```

### Qué pasa si algo falla

Por diseño, **nunca se queda un hueco roto en pantalla**:

- Mientras el `id` siga con el valor `ID-DE-LA-HOJA-PENDIENTE`, la web **no
  hace ninguna petición** y se queda con las 6 prendas de ejemplo.
- Si la hoja no responde, está mal compartida, viene vacía o viene rota, se
  queda también con lo que ya estaba pintado y **no se muestra ningún error**.
- Las prendas de ejemplo se pintan en el HTML, no por JavaScript: se ven
  aunque el visitante tenga JS desactivado.

---

## 3. Cambiar el color de temporada

Hay **un solo** color de acento y vive en una variable CSS. Se usa en las
etiquetas de precio, el botón principal y los detalles del domingo.

```css
/* css/style.css, al principio */
:root {
  --acento: #C46A4A;   /* terracota por defecto */
}
```

Cambiar esa línea cambia la temporada entera. El resto de la paleta (blanco
cristal, negro del marco, lino de la tienda) no se toca.

---

## 4. Las fotografías

**Todas las fotos de la web son de la propia tienda**, publicadas por ella en
[@becoolcarballo](https://www.instagram.com/becoolcarballo/). No hay ni una imagen
de banco. Se descargan a tamaño original y se recortan con los dos scripts:

```bash
node scripts/ig_bajar.js scripts/ig_src <codigo> [<codigo>:reel ...]
python scripts/process_ig.py
```

`scripts/process_ig.py` lleva una tabla `SALIDAS` con el recorte de cada imagen.
Hay un detalle que conviene no perder de vista: **varias fotos suyas llevan el
precio rotulado encima**, y en la web el precio ya lo pone la etiqueta de color,
así que el recorte está elegido para dejar ese texto fuera. Si se cambian las
fotos, hay que volver a comprobarlo.

| Dónde | Archivos | Origen |
|---|---|---|
| Recién colgado (6 prendas) | `p-*.jpg` | posts del 11 y 17 de septiembre |
| Dentro de la tienda (6) | `percheros`, `perchas`, `conjunto`, `rayas`, `lechera`, `rail` | recortes de los mismos posts |
| Instagram (6) | `assets/img/insta/ig-*.jpg` | miniaturas de sus seis últimas publicaciones |

Lo único que falta es una **foto del escaparate desde la calle**: es la imagen que
da nombre al concepto de la web y no hay ninguna publicada.

## 5. Estructura

```
index.html                 toda la página
css/style.css              todo el estilo
js/main.js                 movimiento, hoja de novedades, horario, mapa
assets/img/brand/          logotipo vectorizado y favicon
assets/img/prendas/        las 6 prendas dibujadas del escaparate (SVG)
assets/img/tienda/         fotografías reales de la tienda (de su Instagram)
assets/img/insta/          miniaturas del feed de Instagram
scripts/                   utilidades de desarrollo (no hacen falta en producción)
screenshots/               capturas de la verificación
```

### El logotipo

`assets/img/brand/becool-script.svg` es el **script manuscrito real de la
tienda**, vectorizado con `scripts/trace_logo.py` a partir del único archivo
disponible (el avatar de Facebook, 150 × 150 px). No está redibujado a ojo.

El reclamo «Clothing, shoes & more» **no** se vectorizó: en el original mide
7 px de alto y un trazado de 7 px sale sucio. Va compuesto en tipografía
(Manrope 300, en versales espaciadas) al lado del script. Si la tienda facilita
el archivo original del logo, se sustituye y punto.

El script **aparece de golpe**, como un rótulo. No se anima como si se
escribiera solo: ese recurso es de otra plantilla.

---

## 6. Decisiones técnicas

- **Sin cookies de terceros.** El mapa de Google no existe hasta que el
  visitante pulsa «Ver el mapa» (patrón `.map-consent`). El aviso de cookies se
  cierra de verdad: se oculta con `[hidden]` y el `display: flex` vive en
  `:not([hidden])`, así que nada puede ganarle.
- **Sin canvas ni WebGL.** El reflejo del escaparate es un degradado estático.
- **El carrusel es arrastre + scroll-snap nativo**, no un `pinned` horizontal
  con `scrub`: el retraso de Lenis en horizontal se ve como si el contenido
  tirara hacia el lado contrario.
- **Movimiento reducido respetado.** Con `prefers-reduced-motion: reduce` las
  prendas salen ya colgadas y los marcos ya dibujados, pero el contenido sigue
  cambiando: el contador de reseñas se pone a 10, el horario marca el día de
  hoy y si está abierto, y la barra de recorrido sigue funcionando.
- **Sin GSAP tampoco se rompe.** Los estados «vacíos» del CSS viven bajo
  `html.has-motion`, que solo enciende `main.js`. Si el CDN falla, la página se
  ve entera y estática.
- **Fotos con `srcset`** y `loading="lazy"` fuera de la primera pantalla.

## 7. Utilidades de desarrollo

Necesitan Node con Playwright (`NODE_PATH` apuntando a donde esté instalado) y
Python con Pillow.

```bash
python -m http.server 8099                      # servidor local
node scripts/verify.js                           # comprobaciones automáticas
node scripts/shots.js                            # capturas de todas las secciones
node scripts/generate_og.js                      # imagen de Open Graph
node scripts/ig_bajar.js scripts/ig_src <cod>    # baja fotos suyas a tamaño original
python scripts/process_ig.py                     # recorte y grado de color
python scripts/trace_logo.py                     # vectorizado del logotipo
```
