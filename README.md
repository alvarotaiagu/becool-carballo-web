# BeCool · Clothing, shoes & more — Carballo

Web de una página para **BeCool**, tienda de ropa de mujer en Rúa Hórreo, 14,
Carballo (A Coruña). HTML, CSS y un archivo de JavaScript. Sin framework, sin
build, sin backend: se sube tal cual a cualquier hosting estático.

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
| `[TELÉFONO PENDIENTE]` | Contacto | No hay teléfono en la ficha de Google |
| `[WHATSAPP PENDIENTE]` | Contacto y Recién colgado | ¿Se reservan prendas por WhatsApp? ¿Con qué número? |
| `[EMAIL PENDIENTE]` | Contacto | Correo de la tienda |
| `[CONFIRMAR CATEGORÍAS Y MARCAS]` | Qué encontrarás (×3) | Marcas que vende y si hay más categorías |
| `[EJEMPLO — SUSTITUIR]` | Recién colgado | Las 6 prendas son de muestra (ver punto 2) |
| `[TEXTOS DE RESEÑA PENDIENTES]` | Reseñas | Textos y nombres de las reseñas de Google |
| `[FOTOS REALES PENDIENTES]` | Dentro de la tienda | 6 fotos del escaparate y del interior |
| `[FOTOS DE INSTAGRAM PENDIENTES]` | Instagram | 6 fotos del feed, puestas a mano |
| `[HORARIO ESPECIAL PENDIENTE]` | Cuándo venir | Festivos y cierre por vacaciones |

Datos **reales y confirmados** que ya están puestos: nombre y tagline, dirección,
categoría (tienda de ropa de mujer), valoración 4,6 ★ con 10 reseñas, horario
completo (incluido el domingo por la mañana), Facebook e Instagram.

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

## 4. Sustituir las fotografías

Las 6 fotos de «Dentro de la tienda» son **imágenes de archivo** (Pexels) y
están marcadas como tales en la propia página. Hay que sustituirlas por fotos
reales de Rúa Hórreo, 14.

Los archivos están en `assets/img/photos/` en dos tamaños:

| Hueco | Archivos | Proporción |
|---|---|---|
| El escaparate desde la calle | `escaparate-640.jpg`, `escaparate-900.jpg` | vertical 3:4 |
| La barra de colgar | `barra-560.jpg`, `barra-900.jpg` | 4:3 |
| El rincón del espejo | `espejo-560.jpg`, `espejo-900.jpg` | 4:3 |
| Detalle de punto | `punto-560.jpg`, `punto-900.jpg` | 4:3 |
| Calzado | `calzado-560.jpg`, `calzado-900.jpg` | 4:3 |
| Todo cuelga, todo se ve | `cristal-700.jpg`, `cristal-1200.jpg` | 4:3 |

Al poner fotos reales, **quitar la marca «Imagen de archivo»** de ese
`figcaption` en `index.html` y borrar el aviso del final de la sección.

`scripts/process_photos.py` recorta y ajusta el color de las de archivo; sirve
igual para las reales (cambiando las rutas de origen).

---

## 5. Estructura

```
index.html                 toda la página
css/style.css              todo el estilo
js/main.js                 movimiento, hoja de novedades, horario, mapa
assets/img/brand/          logotipo vectorizado y favicon
assets/img/prendas/        las 6 prendas dibujadas del escaparate (SVG)
assets/img/photos/         fotografías (de archivo, a sustituir)
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
node scripts/contact_sheets.js "consulta"        # hojas de contacto de Pexels
python scripts/process_photos.py                 # recorte y grado de color
python scripts/trace_logo.py                     # vectorizado del logotipo
```
