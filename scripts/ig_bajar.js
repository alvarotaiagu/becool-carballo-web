/* Descarga a tamaño original las publicaciones de @becoolcarballo que se
   van a usar en la web. Son fotos de la propia tienda (su producto, su
   local), no de banco. Uso:
     node bajar.js <carpeta> <codigo>[:reel] ...  */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const [OUT, ...codigos] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: 1400, height: 1100 }, locale: 'es-ES' });
  const page = await ctx.newPage();
  let cookiesHechas = false;
  for (const codigo of codigos) {
    const [sc, tipo] = codigo.split(':');
    const url = 'https://www.instagram.com/' + (tipo === 'reel' ? 'reel' : 'p') + '/' + sc + '/';
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
      if (!cookiesHechas) {
        for (const t of ['Rechazar cookies opcionales', 'Decline optional cookies']) {
          const bt = page.locator('button', { hasText: t });
          if (await bt.count()) { try { await bt.first().click({ timeout: 3000 }); cookiesHechas = true; } catch (e) {} }
        }
        await page.waitForTimeout(2500);
      }
      const mejor = await page.evaluate(() =>
        [...document.querySelectorAll('img')]
          .filter((i) => /cdninstagram|fbcdn/.test(i.src) && i.naturalWidth > 600)
          .map((i) => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight }))
          .sort((a, b) => b.w * b.h - a.w * a.h)[0]);
      if (!mejor) { console.log(sc, 'sin imagen grande'); continue; }
      const r = await page.request.get(mejor.src);
      fs.writeFileSync(path.join(OUT, sc + '.jpg'), await r.body());
      console.log('ok', sc, mejor.w + 'x' + mejor.h);
    } catch (e) { console.log(sc, 'ERROR', e.message.slice(0, 70)); }
  }
  await b.close();
})();
