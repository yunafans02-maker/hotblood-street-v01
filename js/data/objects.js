// 物件類型：碰撞範圍。
// 物件用「腳底格子」擺放：圖片底部置中對齊那一格的底邊。
// solid = [左, 上, 寬, 高]，以「底部中心點」為原點（上方是負數）。null 代表可穿過。
export const OBJ_DEFS = {
  house:     { solid: [-40, -60, 80, 60] },
  hut:       { solid: [-22, -30, 44, 30] },
  tree:      { solid: [-6, -8, 12, 8] },
  tree2:     { solid: [-6, -8, 12, 8] },
  deadtree:  { solid: [-3, -6, 6, 6] },
  bush:      { solid: [-10, -8, 20, 8] },
  well:      { solid: [-11, -14, 22, 14] },
  stall:     { solid: [-15, -12, 30, 12] },
  barrel:    { solid: [-5, -5, 10, 5] },
  jar:       { solid: [-5, -5, 10, 5] },
  crate:     { solid: [-7, -7, 14, 7] },
  lantern:   { solid: [-5, -3, 4, 3] },
  fence:     { solid: [-8, -6, 16, 6] },
  barricade: { solid: [-24, -10, 48, 10] },
  sign:      { solid: [-3, -4, 6, 4] },
  boat:      { solid: [-32, -14, 64, 14] },
  reeds:     { solid: null },
  rock:      { solid: [-6, -6, 12, 6] },
};
