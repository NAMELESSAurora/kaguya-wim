// Headless export (puppeteer from op50-pv, against this project's server on 5197), for when the in-app pane is busy or paused.
//   PATH=~/.local/node/bin:$PATH node tools/headless/export.mjs <name> [w 854] [fps 30] [samples 1] [from] [to]
import { createRequire } from 'node:module';
const require = createRequire('/Users/macminim6/Documents/op50-pv/tools/headless/package.json');
const puppeteer = require('puppeteer');
const [name, w = '854', fps = '30', samples = '1', from = '', to = ''] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 0,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1280,800'] });
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
await page.goto(`http://127.0.0.1:5197/?w=${w}&fps=${fps}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}${process.env.Q ? '&' + process.env.Q : ''}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__film, { timeout: 120000 });
const t0 = Date.now();
page.evaluate((n, s) => window.__film.export({ name: n, samples: Number(s) }), name, samples);
for (;;) {
  await new Promise((r) => setTimeout(r, 5000));
  const st = await page.evaluate(() => window.__film.status);
  if (st.state !== 'running') { console.log(JSON.stringify(st)); break; }
  if (((Date.now() - t0) / 1000) % 30 < 5) console.log(`${st.frame}/${st.total}`);
}
await browser.close();
