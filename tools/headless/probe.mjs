// Evaluate an expression in the film's page, headless (after snap.mjs): for asking the built world where things are.
//   PATH=~/.local/node/bin:$PATH node tools/headless/probe.mjs "window.__DROPS.map(d => [d.n, d.tHit.toFixed(2), d.pose(117.5).c.map(v => v.toFixed(2))])"
import { createRequire } from 'node:module';
const require = createRequire('/Users/macminim6/Documents/op50-pv/tools/headless/package.json');
const puppeteer = require('puppeteer');
const [expr, w = '1280'] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 0, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:5197/?w=${w}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__film, { timeout: 400000 });
console.log(JSON.stringify(await page.evaluate((e) => eval(e), expr)));
await browser.close();
