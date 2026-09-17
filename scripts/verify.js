/* Comprobaciones automáticas de la web de BeCool.

   Uso: NODE_PATH=/c/Users/alvar/node_modules node scripts/verify.js
   (con `python -m http.server 8099` levantado en la raiz del proyecto)

   Deja el resultado en scripts/verify-report.json y sale con codigo 1 si
   algo falla.
*/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.URL || 'http://127.0.0.1:8099/index.html';
const resultados = [];
const ok = (n, cond, detalle) => resultados.push({ prueba: n, ok: !!cond, detalle: detalle == null ? '' : String(detalle) });

/* Con Lenis, window.scrollTo no dispara los ScrollTrigger del final:
   hay que bajar con la rueda y esperar a que termine la animacion. */
async function recorre(page) {
  const alto = await page.evaluate(() => document.body.scrollHeight);
  let y = 0;
  while (y < alto) { await page.mouse.wheel(0, 700); y += 700; await page.waitForTimeout(70); }
  await page.waitForTimeout(2800);
}

const RESPUESTA_HOJA = `/*O_o*/
google.visualization.Query.setResponse({"version":"0.6","status":"ok","table":{"cols":[
{"id":"A","label":"nombre","type":"string"},
{"id":"B","label":"categoria","type":"string"},
{"id":"C","label":"precio","type":"string"},
{"id":"D","label":"tallas","type":"string"},
{"id":"E","label":"foto","type":"string"},
{"id":"F","label":"instagram","type":"string"}],
"rows":[
{"c":[{"v":"Prenda de prueba uno"},{"v":"ropa"},{"v":"19 €"},{"v":"S · M"},{"v":"https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz12345/view?usp=sharing"},{"v":"https://www.instagram.com/becoolcarballo/"}]},
{"c":[{"v":"Prenda de prueba dos"},{"v":"calzado"},{"v":"49 €"},{"v":"37 · 38"},null,null]}]}});`;

/* El ID de la hoja vive en un <script> dentro del propio index.html, asi
   que un addInitScript no sirve: el HTML lo pisa al cargarse. Para probar
   la hoja hay que servir el HTML con el ID ya puesto, que es ademas como
   quedara de verdad. */
async function conHojaConfigurada(page, id) {
  await page.route(URL, async (route) => {
    const r = await route.fetch();
    const cuerpo = (await r.text()).replace('ID-DE-LA-HOJA-PENDIENTE', id);
    await route.fulfill({ response: r, body: cuerpo });
  });
}

(async () => {
  const browser = await chromium.launch();

  /* ---------- 1. Carga normal ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errores = [];
    const peticiones = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
    page.on('request', (r) => peticiones.push(r.url()));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    ok('sin errores de JavaScript', errores.length === 0, errores.join(' | '));

    /* mapa: ni una peticion a Google Maps antes de pulsar */
    ok('el mapa no se carga solo',
      !peticiones.some((u) => /maps\.google|google\.[a-z.]+\/maps/.test(u)),
      peticiones.filter((u) => /google/.test(u)).length + ' peticiones a google (fuentes)');
    ok('no hay iframe antes del consentimiento', (await page.locator('.map-consent iframe').count()) === 0);

    /* aviso de cookies: se ve y el boton lo cierra de verdad */
    const banner = page.locator('.cookie-banner');
    ok('el aviso de cookies aparece', await banner.isVisible());
    await page.locator('.cookie-ack').click();
    await page.waitForTimeout(250);
    ok('el boton del aviso lo cierra', !(await banner.isVisible()));

    /* estructura y accesibilidad basica */
    const a11y = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      imgSinAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
      idsRepetidos: (() => {
        const v = {}, r = [];
        document.querySelectorAll('[id]').forEach((e) => { if (v[e.id]) r.push(e.id); v[e.id] = 1; });
        return r;
      })(),
      anclasRotas: [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h.length > 1 && !document.querySelector(h)),
      lang: document.documentElement.lang,
    }));
    ok('un solo h1', a11y.h1 === 1, 'h1=' + a11y.h1);
    ok('todas las imagenes con alt', a11y.imgSinAlt === 0, a11y.imgSinAlt + ' sin alt');
    ok('sin id repetidos', a11y.idsRepetidos.length === 0, a11y.idsRepetidos.join(','));
    ok('sin anclas rotas', a11y.anclasRotas.length === 0, a11y.anclasRotas.join(','));
    ok('idioma declarado', a11y.lang === 'es', a11y.lang);

    /* hero: la barra pasa por dentro del aro de cada percha */
    const hero = await page.evaluate(() => {
      const b = document.querySelector('.hero-barra').getBoundingClientRect();
      const centroBarra = b.top + b.height / 2;
      const desvios = [...document.querySelectorAll('.percha')]
        .filter((li) => getComputedStyle(li).display !== 'none')
        .map((li) => {
          const r = li.getBoundingClientRect();
          const aro = r.top + r.height * (16 / 470);   /* el aro del gancho */
          return Math.abs(aro - centroBarra);
        });
      return { max: Math.max(...desvios), n: desvios.length };
    });
    ok('las perchas cuelgan de la barra', hero.max < 6, 'desvio maximo ' + hero.max.toFixed(1) + 'px en ' + hero.n + ' prendas');

    /* el contenido del hero no cruza ningun paño */
    const panos = await page.evaluate(() => {
      const c = document.querySelector('.hero-contenido').getBoundingClientRect();
      const lineas = [...document.querySelectorAll('.hero-panos i')]
        .filter((i) => getComputedStyle(i).display !== 'none')
        .map((i) => i.getBoundingClientRect());
      return lineas.filter((l) => l.right > c.left && l.left < c.right).length;
    });
    ok('el vinilo no cruza el marco', panos === 0, panos + ' paños cruzados');

    /* recorrido de la pagina */
    const p0 = await page.evaluate(() => document.querySelector('.progreso-recorrido').style.transform);
    await recorre(page);
    const p1 = await page.evaluate(() => document.querySelector('.progreso-recorrido').style.transform);
    ok('el recorrido empieza a cero', /scaleX\(0(\.0+)?\)/.test(p0), p0);
    ok('el recorrido llega al final', /scaleX\(1(\.0+)?\)/.test(p1), p1);

    /* los marcos se han dibujado al pasar */
    const marcos = await page.evaluate(() => {
      const lados = [...document.querySelectorAll('[data-pano] .pano-marco i')];
      const sinDibujar = lados.filter((i) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(i).transform);
        return m.a < 0.98 || m.d < 0.98;
      });
      return { total: lados.length, sinDibujar: sinDibujar.length };
    });
    ok('los marcos se dibujan enteros', marcos.sinDibujar === 0, marcos.sinDibujar + ' de ' + marcos.total + ' sin dibujar');

    /* contador de reseñas */
    ok('el contador llega a 10', (await page.locator('[data-contador-num]').innerText()) === '10');

    /* horario: la escala cae sobre las barras */
    const escala = await page.evaluate(() => {
      const pista = document.querySelector('.dia[data-dia="6"] .dia-pista').getBoundingClientRect();
      const marca14 = [...document.querySelectorAll('.franjas-escala span')].find((s) => s.textContent.trim() === '14');
      const m = marca14.getBoundingClientRect();
      const tramo = document.querySelector('.dia[data-dia="6"] .tramo').getBoundingClientRect();
      return { centroMarca: m.left + m.width / 2, finTramo: tramo.right, anchoPista: pista.width };
    });
    ok('la escala horaria cae sobre las barras',
      Math.abs(escala.centroMarca - escala.finTramo) < 4,
      'marca de las 14 a ' + (escala.centroMarca - escala.finTramo).toFixed(1) + 'px del fin del tramo del sabado');

    /* mapa: al pulsar aparece el iframe con la URL de embed sin API key */
    await page.locator('#contacto').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('.map-consent button').click();
    await page.waitForTimeout(700);
    const src = await page.locator('.map-consent iframe').getAttribute('src');
    ok('el mapa carga al pulsar', !!src && src.includes('output=embed') && !src.includes('key='), src || 'sin iframe');

    /* carrusel: arrastre y cambio de vista */
    await page.locator('#novedades').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const caja = await page.locator('#lista-novedades').boundingBox();
    await page.mouse.move(caja.x + caja.width - 60, caja.y + 120);
    await page.mouse.down();
    await page.mouse.move(caja.x + 120, caja.y + 120, { steps: 14 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    const desplazado = await page.evaluate(() => document.querySelector('#lista-novedades').scrollLeft);
    ok('el carrusel se arrastra', desplazado > 40, 'scrollLeft=' + desplazado);

    await page.locator('.vista-btn[data-vista="rejilla"]').click();
    await page.waitForTimeout(400);
    const rejilla = await page.evaluate(() => getComputedStyle(document.querySelector('#lista-novedades')).display);
    ok('el cambio a rejilla funciona', rejilla === 'grid', rejilla);

    await page.close();
  }

  /* ---------- 2. Sin desbordamiento horizontal ---------- */
  for (const w of [1680, 1440, 1100, 900, 700, 500, 400]) {
    const page = await browser.newPage({ viewport: { width: w, height: 860 } });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    await recorre(page);
    const desborde = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return {
        scroll: document.documentElement.scrollWidth - w,
        culpables: [...document.querySelectorAll('body *')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && (r.right > w + 2 || r.left < -2) &&
              getComputedStyle(e).position !== 'fixed' && !e.closest('#lista-novedades') &&
              !e.closest('.marquesina') && !e.closest('.hero-perchas');
          })
          .slice(0, 4).map((e) => e.className || e.tagName),
      };
    });
    ok('sin desborde horizontal a ' + w + 'px', desborde.scroll <= 1,
      'sobran ' + desborde.scroll + 'px · ' + desborde.culpables.join(', '));
    await page.close();
  }

  /* ---------- 3. Novedades: la hoja falla y no se nota ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
    await conHojaConfigurada(page, '1PRUEBAdePRUEBA');
    let pedida = false;
    await page.route('**/docs.google.com/**', (r) => { pedida = true; return r.abort(); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    ok('con la hoja configurada se pide la hoja', pedida);
    const n = await page.locator('#lista-novedades .prenda').count();
    const texto = await page.locator('#lista-novedades').innerText();
    ok('con la hoja caida siguen los 6 ejemplos', n === 6, n + ' prendas');
    ok('con la hoja caida siguen marcados como ejemplo', texto.includes('[EJEMPLO — SUSTITUIR]'));
    ok('con la hoja caida no salta ningun error',
      errores.filter((e) => !/Failed to load resource|net::ERR_FAILED/.test(e)).length === 0,
      errores.join(' | '));
    await page.close();
  }

  /* ---------- 4. Novedades: la hoja responde y sustituye ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await conHojaConfigurada(page, '1PRUEBAdePRUEBA');
    await page.route('**/docs.google.com/**', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'text/javascript; charset=utf-8',
        /* Google responde con CORS abierto en /gviz/tq (comprobado), asi
           que la respuesta simulada tiene que traerlo tambien. */
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: RESPUESTA_HOJA,
      }));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    const datos = await page.evaluate(() => ({
      n: document.querySelectorAll('#lista-novedades .prenda').length,
      texto: document.querySelector('#lista-novedades').innerText,
      avisoEjemplo: !!document.querySelector('[data-aviso-ejemplo]'),
      foto: (document.querySelector('#lista-novedades img') || {}).getAttribute
        ? document.querySelector('#lista-novedades img').getAttribute('src') : '',
      enlace: (document.querySelector('#lista-novedades .prenda-caja') || {}).href || '',
      avisoWhatsapp: document.querySelector('#novedades').innerText.includes('[WHATSAPP PENDIENTE]'),
    }));
    ok('la hoja sustituye las prendas', datos.n === 2, datos.n + ' prendas');
    ok('se pintan los datos de la hoja', datos.texto.includes('Prenda de prueba uno') && datos.texto.includes('19 €'));
    ok('se quita el aviso de ejemplo', !datos.avisoEjemplo);
    ok('se mantiene el aviso del WhatsApp pendiente', datos.avisoWhatsapp);
    ok('el enlace de Drive se convierte en miniatura',
      datos.foto === 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz12345&sz=w1200', datos.foto);
    ok('cada prenda enlaza a su post de Instagram',
      datos.enlace === 'https://www.instagram.com/becoolcarballo/', datos.enlace);
    await page.close();
  }

  /* ---------- 5. Movimiento reducido ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    const r = await page.evaluate(() => {
      const perchas = [...document.querySelectorAll('.percha')].filter((p) => getComputedStyle(p).display !== 'none');
      const fuera = perchas.filter((p) => p.getBoundingClientRect().left > window.innerWidth).length;
      const marcos = [...document.querySelectorAll('[data-pano] .pano-marco i')].filter((i) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(i).transform);
        return m.a < 0.98 || m.d < 0.98;
      }).length;
      return {
        fuera,
        marcos,
        conMovimiento: document.documentElement.classList.contains('has-motion'),
        contador: document.querySelector('[data-contador-num]').textContent,
        estado: document.querySelector('[data-estado]').textContent,
        hoy: !!document.querySelector('.dia[data-hoy]'),
        progreso: document.querySelector('.progreso-recorrido').style.transform,
      };
    });
    ok('movimiento reducido: no se anima', !r.conMovimiento);
    ok('movimiento reducido: las prendas ya estan colgadas', r.fuera === 0, r.fuera + ' fuera de pantalla');
    ok('movimiento reducido: los marcos ya estan dibujados', r.marcos === 0, r.marcos + ' sin dibujar');
    ok('movimiento reducido: el contador sigue dando 10', r.contador === '10', r.contador);
    ok('movimiento reducido: el horario sigue diciendo si esta abierto', /Abierto|Cerrado/.test(r.estado), r.estado);
    ok('movimiento reducido: el horario sigue marcando hoy', r.hoy);
    ok('movimiento reducido: el recorrido sigue funcionando', r.progreso.includes('scaleX'), r.progreso);
    await page.close();
  }

  /* ---------- 6. Sin GSAP ni Lenis (CDN caido) ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.route('**/cdnjs.cloudflare.com/**', (r) => r.abort());
    await page.route('**/cdn.jsdelivr.net/**', (r) => r.abort());
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    const r = await page.evaluate(() => {
      const marcos = [...document.querySelectorAll('[data-pano] .pano-marco i')].filter((i) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(i).transform);
        return m.a < 0.98 || m.d < 0.98;
      }).length;
      const perchas = [...document.querySelectorAll('.percha')].filter((p) => getComputedStyle(p).display !== 'none');
      return {
        sinGsap: document.documentElement.classList.contains('sin-gsap'),
        marcos,
        fuera: perchas.filter((p) => p.getBoundingClientRect().left > window.innerWidth).length,
        titular: document.querySelector('#novedades .titular').innerText.trim(),
        contador: document.querySelector('[data-contador-num]').textContent,
      };
    });
    ok('sin GSAP: se marca la pagina', r.sinGsap);
    ok('sin GSAP: los marcos se ven', r.marcos === 0, r.marcos + ' sin dibujar');
    ok('sin GSAP: las prendas se ven', r.fuera === 0, r.fuera + ' fuera de pantalla');
    ok('sin GSAP: los titulares se leen', r.titular === 'Recién colgado', r.titular);
    ok('sin GSAP: el contador se pone', r.contador === '10', r.contador);
    ok('sin GSAP: sin errores', errores.length === 0, errores.join(' | '));
    await page.close();
  }

  /* ---------- 7. El aviso de cookies no vuelve tras aceptarlo ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    await page.locator('.cookie-ack').click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    ok('el aviso no vuelve tras aceptarlo', !(await page.locator('.cookie-banner').isVisible()));
    await ctx.close();
  }

  /* ---------- 8. La 404 funciona ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await page.goto(URL.replace('index.html', '404.html'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    ok('la 404 se pinta', (await page.locator('.perdido h1').isVisible()));
    await page.close();
  }

  await browser.close();

  const fallos = resultados.filter((r) => !r.ok);
  fs.writeFileSync(path.join(__dirname, 'verify-report.json'),
    JSON.stringify({ fecha: new Date().toISOString(), total: resultados.length, fallos: fallos.length, resultados }, null, 2));
  resultados.forEach((r) => console.log((r.ok ? 'OK   ' : 'FALLA') + '  ' + r.prueba + (r.detalle ? '  — ' + r.detalle : '')));
  console.log('\n' + (resultados.length - fallos.length) + '/' + resultados.length + ' pruebas pasadas');
  process.exit(fallos.length ? 1 : 0);
})();
