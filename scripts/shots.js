/* Capturas de la web de BeCool, escritorio y movil.

   Con Lenis, window.scrollTo NO dispara los ScrollTrigger del final de
   la pagina: hay que bajar con la rueda del raton y esperar a que la
   animacion termine antes de medir o capturar.

   Uso: NODE_PATH=/c/Users/alvar/node_modules node scripts/shots.js
*/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.URL || 'http://127.0.0.1:8099/index.html';
const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const SECCIONES = [
  ['01-hero', '#inicio'],
  ['02-novedades', '#novedades'],
  ['03-encontraras', '#encontraras'],
  ['04-dentro', '#dentro'],
  ['05-horario', '#horario'],
  ['06-resenas', '#resenas'],
  ['07-instagram', '#instagram'],
  ['08-contacto', '#contacto'],
];

async function bajarConRueda(page, hasta) {
  let y = 0;
  while (y < hasta) {
    await page.mouse.wheel(0, 600);
    y += 600;
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(2600);
}

(async () => {
  const browser = await chromium.launch();

  for (const [etiqueta, viewport] of [
    ['d', { width: 1440, height: 900 }],
    ['m', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);           // entrada del hero
    const ack = page.locator('.cookie-ack');
    if (await ack.isVisible()) await ack.click();
    await page.waitForTimeout(400);

    const alto = await page.evaluate(() => document.body.scrollHeight);
    await bajarConRueda(page, alto);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);

    for (const [nombre, sel] of SECCIONES) {
      const el = page.locator(sel);
      if (!(await el.count())) continue;
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await el.screenshot({ path: path.join(OUT, etiqueta + '-' + nombre + '.png') });
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.locator('.pie').screenshot({ path: path.join(OUT, etiqueta + '-99-pie.png') });
    await page.close();
    console.log('capturas', etiqueta, 'listas');
  }

  await browser.close();
})();
