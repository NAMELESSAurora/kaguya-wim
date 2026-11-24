// Headless snaps of the film (puppeteer + Chrome for Testing, after op50-pv/tools/headless/render.mjs) against the project's
// own server (port 5197): for checking frames while the in-app pane is busy.
//   PATH=~/.local/node/bin:$PATH node tools/headless/snap.mjs 60.2,80.6 prefix [width 1280] [samples 3] [w 1920]
import { createRequire } from 'node:module';
const require = createRequire('/Users/macminim6/Documents/op50-pv/tools/headless/package.json');
const puppeteer = require('puppeteer');
const [times, prefix = 'h', width = '1280', samples = '3', w = '1920'] = process.argv.slice(2);
const browser = await puppeteer.launch({
  headless: true, protocolTimeout: 0,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1280,800'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
await page.goto(`http://127.0.0.1:5197/?w=${w}${process.env.Q ? '&' + process.env.Q : ''}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__film || /rror/.test(document.getElementById('status')?.textContent || ''), { timeout: 400000 });
const errs = await page.evaluate(() => (window.__shaderErrors || []).map((e) => e.slice(0, 500)));
if (errs.length) console.log('shader errors:', errs);
for (const [i, t] of times.split(',').map(Number).entries()) {
  const r = await page.evaluate((t, n, wd, s) => window.__film.snap(t, n, wd, s).then(() => 'ok', (e) => String(e)), t, `${prefix}${String(i).padStart(2, '0')}`, Number(width), Number(samples));
  console.log(t, r);
}
await browser.close();
