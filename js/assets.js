// 素材載入：先用程式生成佔位圖，再嘗試讀取 assets/ 裡的 PNG。
// 找到同名 PNG 就自動替換，不用改代碼。規格見 ASSETS.md。
import * as PH from './placeholder.js';
import { CHARS } from './data/characters.js';

export const TILE_KEYS = ['grass', 'road', 'stone', 'water', 'dock', 'sand'];
export const OBJECT_KEYS = [
  'house', 'house2', 'inn', 'shop_herb', 'shop_smith', 'hut',
  'tree', 'tree2', 'deadtree', 'bush', 'well', 'stall', 'barrel', 'jar', 'crate',
  'lantern', 'fence', 'barricade', 'sign', 'boat', 'reeds', 'rock',
];

export const Art = { tiles: {}, objects: {}, chars: {}, custom: [] };

function load(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

export async function loadArt() {
  for (const k of TILE_KEYS) { const img = PH.makeTile(k); Art.tiles[k] = { img, n: img.width / img.height }; }
  for (const k of OBJECT_KEYS) Art.objects[k] = { img: PH.makeObject(k) };
  for (const [k, c] of Object.entries(CHARS)) {
    Art.chars[k] = c.kind === 'goose'
      ? { img: PH.makeGooseSheet(), cols: 3, rows: 2 }
      : { img: PH.makeCharSheet(c), cols: 3, rows: 4 };
  }

  const jobs = [];
  for (const k of TILE_KEYS) jobs.push(load(`assets/tiles/${k}.png`).then((img) => {
    if (!img) return;
    Art.tiles[k] = { img, n: Math.max(1, Math.round(img.width / img.height)) };
    Art.custom.push(`tiles/${k}`);
  }));
  for (const k of OBJECT_KEYS) jobs.push(load(`assets/objects/${k}.png`).then((img) => {
    if (!img) return;
    Art.objects[k] = { img };
    Art.custom.push(`objects/${k}`);
  }));
  for (const k of Object.keys(CHARS)) jobs.push(load(`assets/chars/${k}.png`).then((img) => {
    if (!img) return;
    Art.chars[k] = { ...Art.chars[k], img };
    Art.custom.push(`chars/${k}`);
  }));
  await Promise.all(jobs);
  if (Art.custom.length) console.info('已載入自訂素材：', Art.custom.join(', '));
}
