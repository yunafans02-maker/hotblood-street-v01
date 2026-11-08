// 佔位像素美術：全部用程式畫出來。
// 只要 assets/ 裡有同名 PNG，就會自動改用你的圖，這裡的圖不會出現。
import { TILE } from './config.js';

export function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// 固定種子的亂數，讓每次生成的圖一樣
export function rng(seed) {
  let s = (Math.imul(seed | 0, 2654435761) >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17; s >>>= 0;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const EYE = '#1a1412';

function ellipse(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}
const disc = (ctx, cx, cy, r, c) => ellipse(ctx, cx, cy, r, r, c);

/* ───────────── 地磚 ───────────── */

function strip(n, seed, draw) {
  const [c, ctx] = mkCanvas(TILE * n, TILE);
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.beginPath(); ctx.rect(i * TILE, 0, TILE, TILE); ctx.clip();
    ctx.translate(i * TILE, 0);
    draw(ctx, rng(seed + i * 101), i);
    ctx.restore();
  }
  return c;
}

const TILES = {
  grass: [4, (ctx, r) => {
    R(ctx, 0, 0, 16, 16, '#2d4529');
    for (let i = 0; i < 46; i++) R(ctx, r() * 16 | 0, r() * 16 | 0, 1, 1, pick(r, ['#273e25', '#33502e', '#2a4227', '#3a5733']));
    for (let i = 0; i < 3; i++) { const x = r() * 15 | 0, y = r() * 14 | 0; R(ctx, x, y, 1, 2, '#44663a'); R(ctx, x + 1, y + 1, 1, 1, '#3a5733'); }
  }],
  road: [4, (ctx, r) => {
    R(ctx, 0, 0, 16, 16, '#5c5548');
    for (let i = 0; i < 40; i++) R(ctx, r() * 16 | 0, r() * 16 | 0, 1, 1, pick(r, ['#544d41', '#655d4f', '#6c6455']));
    for (let i = 0; i < 3; i++) { const x = r() * 14 | 0, y = r() * 14 | 0; R(ctx, x, y, 2, 1, '#7a7262'); R(ctx, x, y + 1, 2, 1, '#4a443a'); }
  }],
  stone: [4, (ctx, r) => {
    R(ctx, 0, 0, 16, 16, '#3c3a35');
    for (let row = 0; row < 4; row++) {
      let x = -(r() * 5 | 0);
      const y = row * 4;
      while (x < 16) {
        const w = 4 + (r() * 4 | 0);
        R(ctx, x + 1, y + 1, w - 1, 3, pick(r, ['#6c695f', '#646157', '#737066', '#5f5c53']));
        R(ctx, x + 1, y + 1, w - 1, 1, '#7e7a70');
        R(ctx, x + 1, y + 3, w - 1, 1, '#57544c');
        x += w;
      }
    }
  }],
  water: [2, (ctx, _r, frame) => {
    const r = rng(77);
    R(ctx, 0, 0, 16, 16, '#1d3639');
    for (let i = 0; i < 30; i++) R(ctx, r() * 16 | 0, r() * 16 | 0, 1, 1, pick(r, ['#1a3134', '#213d40', '#24434a']));
    for (let i = 0; i < 4; i++) {
      const x = r() * 16 | 0, y = r() * 16 | 0, w = 2 + (r() * 3 | 0);
      R(ctx, (x + frame * 2) % 16, y, w, 1, '#355e60');
    }
  }],
  dock: [2, (ctx, r) => {
    for (let row = 0; row < 4; row++) {
      R(ctx, 0, row * 4, 16, 3, pick(r, ['#6b4a32', '#634430', '#704e35']));
      R(ctx, 0, row * 4, 16, 1, '#7a5940');
      R(ctx, 0, row * 4 + 3, 16, 1, '#3a281c');
      R(ctx, 2, row * 4 + 1, 1, 1, '#2a1d14'); R(ctx, 13, row * 4 + 1, 1, 1, '#2a1d14');
    }
  }],
  sand: [4, (ctx, r) => {
    R(ctx, 0, 0, 16, 16, '#6f6550');
    for (let i = 0; i < 40; i++) R(ctx, r() * 16 | 0, r() * 16 | 0, 1, 1, pick(r, ['#655b47', '#7b705a', '#5d5442']));
  }],
};

export function makeTile(key) {
  const [n, draw] = TILES[key];
  return strip(n, key.length * 31 + 7, draw);
}

/* ───────────── 角色（16×24，3 幀 × 4 方向）───────────── */

function drawHat(L, o, side) {
  const c = o.hatC, s = o.hatS, h = o.hatH || c;
  switch (o.hat) {
    case 'douli': // 斗笠
      L(7, 1, 2, 1, c); L(6, 2, 4, 1, c); L(5, 3, 6, 1, c); L(3, 4, 10, 1, c); L(1, 5, 14, 1, c); L(2, 6, 12, 1, s);
      L(6, 2, 1, 2, h); L(4, 4, 2, 1, h); L(2, 5, 3, 1, h);
      break;
    case 'bun': // 髮髻
      if (side) { L(8, 2, 3, 2, o.hair); L(9, 1, 2, 1, o.hair); }
      else { L(6, 2, 4, 2, o.hair); L(7, 1, 2, 1, o.hair); L(10, 2, 1, 1, '#c9a54a'); }
      break;
    case 'cap': // 小帽
      if (side) { L(5, 3, 6, 3, c); L(5, 5, 6, 1, s); L(6, 3, 2, 1, h); }
      else { L(4, 3, 8, 3, c); L(4, 5, 8, 1, s); L(5, 3, 3, 1, h); }
      break;
    case 'band': // 頭巾帶
      if (side) { L(5, 5, 6, 1, c); L(10, 6, 2, 1, c); L(11, 7, 1, 1, c); }
      else L(4, 5, 8, 1, c);
      break;
    case 'scholar': // 方巾
      if (side) { L(6, 1, 5, 4, c); L(5, 4, 6, 1, s); }
      else { L(5, 1, 6, 4, c); L(4, 4, 8, 1, s); L(6, 1, 2, 1, h); }
      break;
  }
}

function drawFront(ctx, o, f, back) {
  const L = (x, y, w, h, c) => R(ctx, x, y, w, h, c);
  const lu = f === 1 ? 1 : 0, ru = f === 2 ? 1 : 0;
  // 腿
  L(5, 20, 2, 3 - lu, o.pants); L(5, 23 - lu, 2, 1, o.shoe);
  L(9, 20, 2, 3 - ru, o.pants); L(9, 23 - ru, 2, 1, o.shoe);
  // 長袍
  L(5, 12, 6, 1, o.robe); L(4, 13, 8, 4, o.robe); L(3, 17, 10, 3, o.robe); L(3, 20, 10, 1, o.robeS);
  L(11, 13, 1, 4, o.robeS); L(12, 17, 1, 3, o.robeS); L(4, 13, 1, 4, o.robeH);
  if (!back) { L(6, 12, 1, 1, o.trim); L(9, 12, 1, 1, o.trim); L(7, 13, 2, 1, o.trim); }
  L(4, 16, 8, 1, o.belt);
  // 手臂擺動
  const sw = f === 1 ? -1 : f === 2 ? 1 : 0;
  L(2, 13, 2, 4 + sw, o.robeS); L(2, 17 + sw, 2, 1, o.skin);
  L(12, 13, 2, 4 - sw, o.robeS); L(12, 17 - sw, 2, 1, o.skin);
  // 頭
  L(5, 11, 6, 1, o.skinS);
  L(4, 4, 8, 7, o.hair);
  if (back) {
    L(4, 8, 1, 2, o.skinS); L(11, 8, 1, 2, o.skinS);
    L(7, 10, 2, 2, o.hair);
  } else {
    L(5, 6, 6, 5, o.skin); L(5, 6, 6, 1, o.hair); L(4, 7, 1, 3, o.hair); L(11, 7, 1, 3, o.hair);
    L(6, 8, 1, 1, EYE); L(9, 8, 1, 1, EYE); L(5, 10, 6, 1, o.skinS);
  }
  drawHat(L, o, false);
}

function drawSide(ctx, o, f) { // 面向左
  const L = (x, y, w, h, c) => R(ctx, x, y, w, h, c);
  if (f === 0) { L(8, 20, 2, 3, o.pants); L(8, 23, 2, 1, o.shoe); L(6, 20, 2, 3, o.pants); L(5, 23, 3, 1, o.shoe); }
  else if (f === 1) { L(9, 20, 2, 2, o.pants); L(9, 22, 2, 1, o.shoe); L(5, 20, 2, 3, o.pants); L(4, 23, 3, 1, o.shoe); }
  else { L(8, 20, 2, 3, o.pants); L(8, 23, 3, 1, o.shoe); L(6, 20, 2, 2, o.pants); L(5, 22, 2, 1, o.shoe); }
  L(5, 12, 6, 1, o.robe); L(5, 13, 6, 4, o.robe); L(4, 17, 8, 3, o.robe); L(4, 20, 8, 1, o.robeS);
  L(10, 13, 1, 4, o.robeS); L(11, 17, 1, 3, o.robeS);
  L(5, 12, 2, 2, o.trim);
  L(5, 16, 6, 1, o.belt);
  const ax = 7 + (f === 1 ? -1 : f === 2 ? 1 : 0);
  L(ax, 13, 2, 4, o.robeS); L(ax, 17, 2, 1, o.skin);
  L(5, 4, 6, 7, o.hair);
  L(5, 6, 3, 5, o.skin); L(4, 8, 1, 1, o.skin); L(5, 6, 3, 1, o.hair);
  L(5, 8, 1, 1, EYE); L(8, 8, 1, 1, o.skinS); L(5, 10, 3, 1, o.skinS); L(6, 11, 3, 1, o.skinS);
  drawHat(L, o, true);
}

// 排列：列 0 下、1 左、2 右、3 上；欄 0 站立、1 左腳、2 右腳
export function makeCharSheet(o) {
  const [c, ctx] = mkCanvas(48, 96);
  const [tmp, tctx] = mkCanvas(16, 24);
  for (let f = 0; f < 3; f++) {
    ctx.save(); ctx.translate(f * 16, 0); drawFront(ctx, o, f, false); ctx.restore();
    ctx.save(); ctx.translate(f * 16, 24); drawSide(ctx, o, f); ctx.restore();
    tctx.clearRect(0, 0, 16, 24); drawSide(tctx, o, f);
    ctx.save(); ctx.translate(f * 16 + 16, 48); ctx.scale(-1, 1); ctx.drawImage(tmp, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(f * 16, 72); drawFront(ctx, o, f, true); ctx.restore();
  }
  return c;
}

// 鵝：16×12，3 幀（走 1、走 2、啄地）× 2 方向（左、右）
function drawGoose(ctx, f) {
  const L = (x, y, w, h, c) => R(ctx, x, y, w, h, c);
  const W = '#e6e1d5', S = '#b9b3a6', B = '#d98c2b';
  ellipse(ctx, 9, 7, 5, 3, W);
  L(9, 8, 4, 2, S); L(13, 5, 2, 2, W);
  if (f === 2) { L(4, 6, 2, 3, W); L(2, 8, 3, 2, W); L(0, 9, 2, 1, B); L(2, 8, 1, 1, EYE); }
  else { L(4, 2, 2, 5, W); L(3, 0, 3, 3, W); L(1, 1, 2, 1, B); L(4, 1, 1, 1, EYE); }
  if (f === 1) { L(7, 10, 1, 2, B); L(11, 10, 1, 1, B); }
  else { L(8, 10, 1, 2, B); L(10, 10, 1, 2, B); }
}
export function makeGooseSheet() {
  const [c, ctx] = mkCanvas(48, 24);
  const [tmp, tctx] = mkCanvas(16, 12);
  for (let f = 0; f < 3; f++) {
    ctx.save(); ctx.translate(f * 16, 0); drawGoose(ctx, f); ctx.restore();
    tctx.clearRect(0, 0, 16, 12); drawGoose(tctx, f);
    ctx.save(); ctx.translate(f * 16 + 16, 12); ctx.scale(-1, 1); ctx.drawImage(tmp, 0, 0); ctx.restore();
  }
  return c;
}

/* ───────────── 物件 ───────────── */

function lanternAt(ctx, x, y) {
  R(ctx, x, y - 2, 1, 2, '#2a1d14');
  R(ctx, x - 2, y, 5, 1, '#2a1d14');
  ellipse(ctx, x, y + 3, 3, 2, '#a8382a');
  R(ctx, x - 1, y + 2, 1, 2, '#d4553f');
  R(ctx, x - 2, y + 6, 5, 1, '#2a1d14');
  R(ctx, x, y + 7, 1, 2, '#c9a54a');
}

function glyph(ctx, ch, x, y) {
  ctx.fillStyle = '#1a1412';
  ctx.font = 'bold 8px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, x, y);
}

const GOODS = ['#6e3a24', '#8a7a4a', '#4f6b45', '#7a5940', '#b5402e', '#d6ccb0'];

function house(kind, seed, accent, ch) {
  const [c, ctx] = mkCanvas(80, 80);
  const r = rng(seed);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  // 牆
  L(3, 44, 74, 34, '#c6bca5');
  for (let i = 0; i < 160; i++) L(3 + (r() * 74 | 0), 47 + (r() * 27 | 0), 1, 1, pick(r, ['#bfb49c', '#cec5af', '#b8ad95']));
  L(3, 74, 74, 6, '#57534c'); L(3, 74, 74, 1, '#6c685f');
  for (let x = 5; x < 77; x += 7) L(x, 75, 1, 5, '#46433d');
  L(3, 44, 4, 30, '#4a3324'); L(73, 44, 4, 30, '#4a3324'); L(3, 44, 1, 30, '#5a3e2b'); L(76, 44, 1, 30, '#3a281c');
  L(3, 44, 74, 3, '#3e2b1f');
  L(7, 47, 66, 2, 'rgba(20,16,12,0.35)');

  if (kind === 'house') {
    L(32, 56, 16, 18, '#3a281c'); L(33, 57, 14, 17, '#5a3e2b'); L(39, 57, 2, 17, '#3a281c');
    L(37, 64, 1, 2, '#c9a54a'); L(42, 64, 1, 2, '#c9a54a');
    L(30, 74, 20, 3, '#6c685f');
    for (const wx of [12, 54]) {
      L(wx, 53, 14, 12, '#3a281c'); L(wx + 1, 54, 12, 10, '#1e1814');
      for (let i = wx + 1; i < wx + 13; i += 3) L(i, 54, 1, 10, '#6b4a32');
      for (let j = 54; j < 64; j += 3) L(wx + 1, j, 12, 1, '#6b4a32');
    }
  } else {
    // 開放式店面
    L(9, 50, 62, 24, '#1e1814');
    L(11, 55, 58, 1, '#4a3324'); L(11, 60, 58, 1, '#4a3324');
    for (let x = 12; x < 66; x += 5) { L(x, 52, 3, 3, pick(r, GOODS)); L(x + 1, 57, 3, 3, pick(r, GOODS)); }
    L(9, 64, 62, 10, '#5a3e2b'); L(9, 64, 62, 2, '#7a5940'); L(9, 73, 62, 1, '#3a281c');
    for (let x = 12; x < 66; x += 7) L(x, 61, 4, 3, pick(r, GOODS));
    L(7, 47, 66, 5, accent);
    for (let x = 7; x < 73; x += 6) L(x, 52, 3, 2, accent);
    L(7, 47, 66, 1, 'rgba(255,255,255,0.15)');
    if (kind === 'shop') {
      L(0, 50, 8, 22, '#d6ccb0'); L(0, 50, 8, 1, '#3a281c'); L(0, 71, 8, 1, '#3a281c');
      glyph(ctx, ch, 4, 57);
    }
  }
  // 屋頂
  for (let y = 6; y <= 41; y++) {
    const t = (y - 6) / 35;
    const x0 = Math.round(6 - 6 * t), x1 = Math.round(73 + 6 * t);
    L(x0, y, x1 - x0 + 1, 1, '#373a42');
    for (let x = x0 + 2; x < x1; x += 4) L(x, y, 1, 1, '#292b31');
    if ((y - 8) % 6 === 0) L(x0, y, x1 - x0 + 1, 1, '#464a53');
  }
  for (let i = 0; i < 30; i++) L(8 + (r() * 64 | 0), 8 + (r() * 32 | 0), 1, 1, pick(r, ['#3f4a3c', '#2e3036', '#4a4e57']));
  L(4, 2, 72, 5, '#1d1f24'); L(4, 2, 72, 1, '#3a3d45'); L(6, 6, 68, 1, '#15161a');
  L(0, 0, 4, 2, '#1d1f24'); L(2, 2, 4, 3, '#1d1f24'); L(76, 0, 4, 2, '#1d1f24'); L(74, 2, 4, 3, '#1d1f24');
  L(0, 41, 80, 3, '#202227');
  for (let x = 1; x < 80; x += 4) L(x, 42, 2, 2, '#4a4e57');

  if (kind === 'inn') {
    lanternAt(ctx, 12, 46); lanternAt(ctx, 68, 46);
    L(70, 50, 9, 15, '#d6ccb0'); L(70, 50, 9, 1, '#7d2d24'); L(70, 64, 9, 1, '#7d2d24');
    glyph(ctx, ch, 74, 57);
  }
  return c;
}

function hut() {
  const [c, ctx] = mkCanvas(48, 48);
  const r = rng(3);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(4, 24, 40, 24, '#5a3e2b');
  for (let x = 4; x < 44; x += 4) L(x, 24, 1, 24, '#45301f');
  L(20, 32, 9, 16, '#1e1814'); L(19, 31, 11, 1, '#3a281c');
  L(8, 32, 7, 6, '#1e1814'); L(8, 32, 7, 1, '#3a281c');
  const span = (y) => { const t = (y - 2) / 24; return [Math.round(10 - 10 * t), Math.round(37 + 10 * t)]; };
  for (let y = 2; y <= 26; y++) { const [x0, x1] = span(y); L(x0, y, x1 - x0 + 1, 1, '#6e5f3e'); }
  for (let i = 0; i < 160; i++) {
    const y = 2 + (r() * 24 | 0); const [x0, x1] = span(y);
    L(x0 + (r() * (x1 - x0) | 0), y, 1, 2, pick(r, ['#5a4e33', '#857350', '#7a6a45']));
  }
  L(0, 26, 48, 2, '#4a3f28'); L(10, 1, 28, 2, '#4a3f28');
  return c;
}

function tree(seed) {
  const [c, ctx] = mkCanvas(48, 64);
  const r = rng(seed);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(20, 40, 8, 24, '#3a2b21'); L(20, 40, 2, 24, '#4a3829'); L(26, 40, 2, 24, '#2a1f18');
  L(17, 60, 14, 4, '#3a2b21'); L(15, 62, 3, 2, '#2a1f18'); L(30, 62, 3, 2, '#2a1f18');
  const blobs = [[24, 20, 18], [11, 30, 11], [37, 30, 11], [24, 34, 13], [15, 15, 10], [33, 15, 10]];
  for (const [x, y, rr] of blobs) disc(ctx, x, y + 1, rr + 1, '#111c12');
  for (const [x, y, rr] of blobs) disc(ctx, x, y, rr, '#1f3320');
  for (const [x, y, rr] of blobs) disc(ctx, x - 2, y - 3, rr - 4, '#2a4529');
  for (const [x, y, rr] of blobs) disc(ctx, x - 4, y - 5, Math.max(1, rr - 9), '#365a33');
  const data = ctx.getImageData(0, 0, 48, 48).data;
  for (let i = 0; i < 160; i++) {
    const x = r() * 48 | 0, y = r() * 47 | 0;
    if (data[(y * 48 + x) * 4 + 3] > 0) L(x, y, 1, 1, pick(r, ['#2a4529', '#1a2c1b', '#3d6338', '#15241a']));
  }
  return c;
}

function deadTree(seed) {
  const [c, ctx] = mkCanvas(40, 56);
  const r = rng(seed);
  const cols = ['#3d342b', '#4a4036', '#2e2721'];
  function branch(x, y, ang, len, w, depth) {
    for (let i = 0; i < len; i++) R(ctx, Math.round(x + Math.cos(ang) * i), Math.round(y + Math.sin(ang) * i), w, w, cols[depth % 3]);
    if (depth > 0) {
      const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      for (let k = 0; k < 2; k++) branch(ex, ey, ang + (r() - 0.5) * 1.5, len * 0.62, Math.max(1, w - 1), depth - 1);
    }
  }
  R(ctx, 18, 30, 4, 26, '#3d342b'); R(ctx, 18, 30, 1, 26, '#4a4036'); R(ctx, 15, 54, 10, 2, '#2e2721');
  branch(20, 32, -Math.PI / 2, 14, 2, 3);
  branch(20, 40, -Math.PI / 2 - 0.8, 10, 2, 2);
  branch(21, 37, -Math.PI / 2 + 0.8, 10, 2, 2);
  return c;
}

function bush() {
  const [c, ctx] = mkCanvas(24, 16);
  for (const [x, y, rr] of [[7, 10, 6], [16, 10, 6], [12, 7, 6]]) disc(ctx, x, y + 1, rr, '#111c12');
  for (const [x, y, rr] of [[7, 10, 6], [16, 10, 6], [12, 7, 6]]) disc(ctx, x, y, rr - 1, '#22381f');
  for (const [x, y, rr] of [[7, 10, 6], [16, 10, 6], [12, 7, 6]]) disc(ctx, x - 1, y - 2, rr - 4, '#2f4c2b');
  return c;
}

function well() {
  const [c, ctx] = mkCanvas(24, 24);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  ellipse(ctx, 12, 17, 11, 6, '#4f4c45');
  ellipse(ctx, 12, 16, 11, 6, '#6b675e');
  ellipse(ctx, 12, 15, 8, 4, '#141a1b');
  L(5, 13, 3, 1, '#7e7a70'); L(15, 20, 4, 1, '#57544c');
  L(2, 2, 2, 14, '#4a3324'); L(20, 2, 2, 14, '#4a3324');
  L(1, 1, 22, 2, '#5a3e2b');
  L(12, 3, 1, 6, '#9a8a6a'); L(10, 9, 5, 4, '#5a3e2b'); L(10, 9, 5, 1, '#7a5940');
  return c;
}

function stall(seed) {
  const [c, ctx] = mkCanvas(32, 28);
  const r = rng(seed);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(2, 6, 2, 22, '#4a3324'); L(28, 6, 2, 22, '#4a3324');
  for (let x = 0; x < 32; x++) L(x, 1, 1, 6, Math.floor(x / 4) % 2 ? '#d6ccb0' : '#7d2d24');
  for (let x = 0; x < 32; x += 4) L(x + 1, 7, 2, 1, Math.floor(x / 4) % 2 ? '#d6ccb0' : '#7d2d24');
  L(0, 0, 32, 1, '#3a281c');
  L(1, 17, 30, 3, '#7a5940'); L(1, 20, 30, 4, '#5a3e2b'); L(3, 24, 2, 4, '#3a281c'); L(27, 24, 2, 4, '#3a281c');
  for (let x = 4; x < 28; x += 5) ellipse(ctx, x + 2, 15, 2, 2, pick(r, ['#4f7a3e', '#d8d2c0', '#c97a2b', '#8a3a2e']));
  return c;
}

function barrel() {
  const [c, ctx] = mkCanvas(12, 16);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(1, 2, 10, 13, '#5a3e2b'); L(0, 4, 12, 9, '#5a3e2b');
  L(3, 2, 1, 13, '#6b4a32'); L(9, 3, 1, 11, '#45301f');
  L(0, 4, 12, 1, '#2a2622'); L(0, 11, 12, 1, '#2a2622');
  ellipse(ctx, 6, 2, 5, 1, '#4a3324');
  L(1, 15, 10, 1, '#3a281c');
  return c;
}

function jar() {
  const [c, ctx] = mkCanvas(12, 14);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  ellipse(ctx, 6, 8, 5, 5, '#6e3a24');
  L(3, 6, 1, 4, '#8a4a30');
  L(4, 2, 4, 3, '#5a2e1c');
  L(3, 0, 6, 2, '#d6ccb0'); L(3, 2, 6, 1, '#8c2f25');
  L(4, 7, 4, 4, '#b5402e'); L(5, 8, 2, 2, '#e0c27a');
  return c;
}

function crate() {
  const [c, ctx] = mkCanvas(14, 14);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(0, 0, 14, 14, '#7a5940'); L(0, 0, 14, 1, '#8f6c4f');
  L(0, 13, 14, 1, '#4a3324'); L(0, 0, 1, 14, '#4a3324'); L(13, 0, 1, 14, '#4a3324');
  L(1, 4, 12, 1, '#5a3e2b'); L(1, 9, 12, 1, '#5a3e2b');
  return c;
}

function lanternPost() {
  const [c, ctx] = mkCanvas(12, 34);
  R(ctx, 2, 4, 2, 30, '#3a281c'); R(ctx, 2, 4, 9, 2, '#3a281c'); R(ctx, 0, 32, 6, 2, '#2a1d14');
  lanternAt(ctx, 8, 8);
  return c;
}

function fence() {
  const [c, ctx] = mkCanvas(16, 16);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(1, 3, 2, 13, '#4a3324'); L(13, 3, 2, 13, '#4a3324');
  L(0, 6, 16, 2, '#5a3e2b'); L(0, 11, 16, 2, '#5a3e2b');
  L(0, 6, 16, 1, '#6b4a32'); L(0, 11, 16, 1, '#6b4a32');
  return c;
}

function barricade() {
  const [c, ctx] = mkCanvas(48, 20);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  for (const ox of [0, 24]) {
    for (let i = 0; i < 16; i++) { L(ox + 3 + i, 3 + i, 3, 2, '#6b4a32'); L(ox + 19 - i, 3 + i, 3, 2, '#5a3e2b'); }
  }
  L(0, 9, 48, 3, '#4a3324'); L(0, 9, 48, 1, '#6b4a32');
  for (const x of [2, 23, 44]) L(x, 1, 2, 19, '#3a281c');
  return c;
}

function sign() {
  const [c, ctx] = mkCanvas(16, 22);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  L(7, 9, 2, 13, '#4a3324');
  L(1, 1, 14, 9, '#7a5940'); L(1, 1, 14, 1, '#8f6c4f'); L(1, 9, 14, 1, '#4a3324');
  L(4, 4, 8, 1, '#2a1d14'); L(4, 6, 6, 1, '#2a1d14');
  return c;
}

function boat() {
  const [c, ctx] = mkCanvas(64, 24);
  const L = (x, y, w, h, col) => R(ctx, x, y, w, h, col);
  for (let x = 18; x < 46; x++) { const t = (x - 32) / 14; const top = Math.round(2 + 5 * t * t); L(x, top, 1, 12 - top, '#4a4033'); }
  for (let x = 20; x < 46; x += 4) L(x, 4, 1, 8, '#3a3228');
  for (let y = 12; y < 20; y++) { const inset = Math.round((y - 12) * 0.9); L(2 + inset, y, 60 - inset * 2, 1, y < 14 ? '#6b4a32' : '#4a3324'); }
  L(0, 11, 64, 2, '#7a5940');
  L(6, 20, 52, 1, '#2f5257'); L(10, 21, 44, 1, '#264548');
  return c;
}

function reeds(seed) {
  const [c, ctx] = mkCanvas(16, 20);
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const x = 1 + i * 2, h = 8 + (r() * 9 | 0);
    R(ctx, x, 20 - h, 1, h, pick(r, ['#5a6b3a', '#4a5a30', '#6b7a44']));
    if (r() > 0.5) R(ctx, x, 20 - h, 1, 3, '#8a7a4a');
  }
  return c;
}

function rock() {
  const [c, ctx] = mkCanvas(14, 10);
  ellipse(ctx, 7, 6, 6, 3, '#4f4c45');
  ellipse(ctx, 6, 5, 5, 3, '#6b675e');
  R(ctx, 4, 3, 2, 1, '#7e7a70');
  return c;
}

export function makeObject(key) {
  switch (key) {
    case 'house': return house('house', 11);
    case 'house2': return house('house', 23);
    case 'inn': return house('inn', 31, '#7d2d24', '酒');
    case 'shop_herb': return house('shop', 41, '#3d5a44', '藥');
    case 'shop_smith': return house('shop', 53, '#4a5560', '鐵');
    case 'hut': return hut();
    case 'tree': return tree(7);
    case 'tree2': return tree(19);
    case 'deadtree': return deadTree(5);
    case 'bush': return bush();
    case 'well': return well();
    case 'stall': return stall(3);
    case 'barrel': return barrel();
    case 'jar': return jar();
    case 'crate': return crate();
    case 'lantern': return lanternPost();
    case 'fence': return fence();
    case 'barricade': return barricade();
    case 'sign': return sign();
    case 'boat': return boat();
    case 'reeds': return reeds(9);
    case 'rock': return rock();
  }
  throw new Error('未知的物件圖：' + key);
}
