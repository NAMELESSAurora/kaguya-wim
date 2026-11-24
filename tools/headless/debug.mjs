// Load the film headless and print every console message and the status line for a while (finding where a build stops).
//   PATH=~/.local/node/bin:$PATH node tools/headless/debug.mjs [seconds 60] [query]
import { createRequire } from 'node:module';
const require = createRequire('/Users/macminim6/Documents/op50-pv/tools/headless/package.json');
const puppeteer = require('puppeteer');
const [secs = '60', q = ''] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 0, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('[' + m.type() + ']', m.text().slice(0, 400)));
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 600)));
await page.goto(`http://127.0.0.1:5197/?w=640${q ? '&' + q : ''}`, { waitUntil: 'load' });
const t0 = Date.now();
while ((Date.now() - t0) / 1000 < Number(secs)) { await new Promise((r) => setTimeout(r, 5000)); const st = await page.evaluate(() => [document.getElementById('status')?.textContent, !!window.__film]); console.log(Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(st)); if (st[1]) break; }
await browser.close();
