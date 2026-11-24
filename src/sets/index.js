// The sets of the film, in time order (each { t0, t1, planes, cam, bg, post?, extras? }).
import { sample, cardShow, opening, interlude, film2 } from './s1.js';
import { setCardWatermark } from '../space.js';
export async function buildSets(kit, env) {
  // the cards' watermark: GPT-drawn SVG engravings (materials/gpt/watermark_*.svg) rasterised to alpha (materials/cards/watermark_*.png)
  setCardWatermark(await kit.img('materials/cards/watermark_tile.png'), await kit.img('materials/cards/watermark_emblem.png'));
  const card = new URLSearchParams(location.search).get('card');
  if (card) return [await cardShow(kit, card)];          // (the holo card alone, for its GIF preview)
  const main = await sample(kit, env);
  return [...(await opening(kit)), ...main, ...(await interlude(kit)), ...(await film2(kit))];
}
