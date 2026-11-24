// A snap with the camera overridden (window.__cam): for trying a view before writing it into the shots.
//   PATH=~/.local/node/bin:$PATH node tools/headless/snapcam.mjs 150 '{"pos":[3.78,-0.5,180.4],"look":[1.65,-0.8,187.6],"up":[0,-1,0]}' name [width]
import { createRequire } from 'node:module';
const require = createRequire('/Users/macminim6/Documents/op50-pv/tools/headless/package.json');
const puppeteer = require('puppeteer');
const [t, cam, name = 'cam', width = '1280'] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: true, protocolTimeout: 0, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:5197/?w=1920', { waitUntil: 'load' });
await page.waitForFunction(() => window.__film, { timeout: 90000 });
const r = await page.evaluate((t, cam, n, wd) => { window.__cam = cam ? JSON.parse(cam) : null; return window.__film.snap(Number(t), n, wd, 1).then(() => 'ok', (e) => String(e)); }, t, cam, name, Number(width));
console.log(r); await browser.close();
