// 地圖資料。
// 地面字元：.草地  =泥路  #石板  ~水（不能走）  b木棧道  s沙地
// 座標都是「格子」：x 往右、y 往下，一格 16 像素。

function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(g, x, y, w, h, ch) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch;
}
const O = (t, x, y, extra = {}) => ({ t, at: [x, y], ...extra });
const N = (id, name, sprite, x, y, dir, extra = {}) => ({ id, name, sprite, at: [x, y], dir, talk: id, ...extra });
const C = (sprite, x, y, wander = 3) => ({ sprite, at: [x, y], wander });

/* ───────────── 青石鎮 ───────────── */
function town() {
  const W = 40, H = 28;
  const g = grid(W, H, '.');
  fill(g, 0, 13, W, 3, '=');      // 東西大路
  fill(g, 19, 0, 3, 25, '=');     // 南北大路
  fill(g, 16, 12, 9, 6, '#');     // 中央廣場
  fill(g, 4, 7, 6, 1, '#'); fill(g, 9, 7, 1, 6, '#');      // 西北小巷
  fill(g, 30, 7, 6, 1, '#'); fill(g, 30, 7, 1, 6, '#');    // 東北小巷
  fill(g, 4, 23, 11, 1, '#'); fill(g, 9, 16, 1, 8, '#');   // 西南小巷
  fill(g, 25, 23, 11, 1, '#'); fill(g, 30, 16, 1, 8, '#'); // 東南小巷

  const objects = [
    // 臨街房屋（北）
    O('house', 6, 12, { s: 'house', talk: 'door' }),
    O('house', 12, 12, { s: 'shop_herb' }),
    O('house', 27, 12, { s: 'inn' }),
    O('house', 33, 12, { s: 'shop_smith' }),
    // 後排
    O('house', 6, 6, { s: 'house2', talk: 'door' }),
    O('house', 33, 6, { s: 'house', talk: 'door' }),
    // 南側
    O('house', 6, 22, { s: 'house2', talk: 'door' }),
    O('house', 12, 22, { s: 'house', talk: 'door' }),
    O('house', 27, 22, { s: 'house', talk: 'door' }),
    O('house', 33, 22, { s: 'house2', talk: 'door' }),
    // 廣場
    O('tree', 20, 14),
    O('well', 17, 15, { talk: 'well' }),
    O('stall', 17, 12),
    O('stall', 23, 17),
    O('sign', 22, 12, { talk: 'sign_town' }),
    O('lantern', 15, 12), O('lantern', 25, 17),
    O('jar', 24, 11), O('jar', 24, 12), O('barrel', 24, 10),
    // 出入口
    O('barricade', 20, 2, { talk: 'barricade' }),
    O('sign', 2, 12, { talk: 'sign_west' }),
    O('rock', 0, 14), O('rock', 1, 13), O('rock', 0, 15),
    // 樹林
    O('tree', 1, 3), O('tree2', 11, 4), O('tree', 15, 2), O('tree2', 24, 2), O('tree', 28, 4), O('tree2', 38, 3),
    O('tree2', 2, 9), O('tree', 37, 9), O('tree', 16, 6), O('tree2', 25, 6),
    O('tree2', 1, 18), O('tree', 2, 25), O('tree', 16, 20), O('tree2', 17, 26), O('tree', 23, 26),
    O('tree2', 24, 20), O('tree', 38, 18), O('tree2', 37, 25), O('tree2', 9, 26), O('tree', 30, 26), O('tree', 14, 26),
    O('deadtree', 16, 9), O('deadtree', 23, 9), O('deadtree', 3, 16), O('deadtree', 36, 16), O('deadtree', 1, 22),
    O('bush', 18, 25), O('bush', 22, 25), O('bush', 15, 17), O('bush', 0, 26), O('bush', 39, 26), O('bush', 39, 11),
  ];

  const npcs = [
    N('innkeeper', '錢掌櫃', 'innkeeper', 27, 13, 'down'),
    N('herbalist', '林大夫', 'herbalist', 12, 13, 'down'),
    N('smith', '老韓', 'smith', 33, 13, 'down'),
    N('storyteller', '說書先生', 'storyteller', 23, 15, 'left'),
    N('child', '阿福', 'child', 18, 17, 'down', { wander: 3 }),
    N('granny', '王婆婆', 'granny', 9, 24, 'down', { wander: 2 }),
    N('guard', '守衛', 'guard', 19, 4, 'down'),
  ];

  return {
    id: 'town', name: '青石鎮', w: W, h: H, ground: g.map((r) => r.join('')),
    objects, npcs,
    critters: [C('goose', 14, 16), C('goose', 15, 17), C('goose', 26, 16)],
    exits: [{ rect: [39, 13, 1, 3], to: 'dock', spawn: 'west' }],
    spawns: { start: { at: [20, 19], dir: 'up' }, east: { at: [38, 14], dir: 'left' } },
  };
}

/* ───────────── 江畔渡口 ───────────── */
function dock() {
  const W = 30, H = 20;
  const g = grid(W, H, '.');
  fill(g, 0, 7, 16, 3, '=');      // 從鎮上來的路
  fill(g, 13, 7, 3, 4, '=');      // 轉向江邊
  fill(g, 0, 10, W, 2, 's');      // 沙岸
  fill(g, 0, 12, W, 8, '~');      // 江水
  fill(g, 13, 11, 3, 7, 'b');     // 木棧道

  const objects = [
    O('hut', 5, 5, { talk: 'door' }),
    O('jar', 7, 5), O('jar', 8, 5), O('crate', 3, 6),
    O('sign', 11, 6, { talk: 'sign_dock' }),
    O('boat', 18, 15, { talk: 'boat' }),
    O('barrel', 13, 17), O('crate', 15, 17),
    O('reeds', 2, 12), O('reeds', 5, 12), O('reeds', 9, 12), O('reeds', 21, 12), O('reeds', 24, 12), O('reeds', 27, 12),
    O('reeds', 3, 13), O('reeds', 26, 13),
    O('rock', 1, 11), O('rock', 20, 11), O('rock', 27, 10),
    O('tree', 2, 1), O('tree2', 9, 2), O('tree', 13, 1), O('tree2', 18, 2), O('tree', 23, 1), O('tree2', 28, 2),
    O('tree', 27, 6), O('tree2', 20, 5), O('tree2', 1, 5),
    O('deadtree', 24, 8), O('deadtree', 10, 3),
    O('bush', 17, 5), O('bush', 22, 9),
  ];

  const npcs = [
    N('boatman', '老周', 'boatman', 15, 15, 'right'),
    N('fisher', '漁翁', 'fisher', 8, 11, 'down'),
  ];

  return {
    id: 'dock', name: '江畔渡口', w: W, h: H, ground: g.map((r) => r.join('')),
    objects, npcs, critters: [],
    exits: [{ rect: [0, 7, 1, 3], to: 'town', spawn: 'east' }],
    spawns: { start: { at: [2, 8], dir: 'right' }, west: { at: [1, 8], dir: 'right' } },
  };
}

export const MAPS = { town: town(), dock: dock() };
