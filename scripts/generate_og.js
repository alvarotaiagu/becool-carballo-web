/* Imagen de Open Graph (1200x630) de BeCool: el escaparate en miniatura.
   Uso: NODE_PATH=/c/Users/alvar/node_modules node scripts/generate_og.js */
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto(pathToFileURL(path.join(__dirname, 'og.html')).href);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(__dirname, '..', 'assets', 'img', 'og-becool.jpg'), type: 'jpeg', quality: 88 });
  await b.close();
  console.log('og-becool.jpg listo');
})();
