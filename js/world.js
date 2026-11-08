// 世界：地圖載入、碰撞、角色移動、NPC 行為、互動判定。
import { TILE as T } from './config.js';
import { MAPS } from './data/maps.js';
import { OBJ_DEFS } from './data/objects.js';
import { Art } from './assets.js';
import { mkCanvas, rng } from './placeholder.js';

export const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const TILE_OF = { '.': 'grass', '=': 'road', '#': 'stone', '~': 'water', b: 'dock', s: 'sand' };
const SOLID_TILES = new Set(['~']);
const WALK_CYCLE = [1, 0, 2, 0];

export const world = {
  map: null, w: 0, h: 0, grid: [],
  objects: [], npcs: [], critters: [], actors: [], exits: [],
  player: null, focus: null, groundCanvases: [],
};

export class Actor {
  constructor(o) {
    Object.assign(this, { kind: 'actor', dir: 'down', speed: 28, wander: 0, talk: null, name: '' }, o);
    this.home = { x: this.x, y: this.y };
    this.moving = false; this.anim = 0;
    this.wait = 0.5 + Math.random() * 2; this.target = null; this.stuck = 0;
    this.busy = false; this.peck = 0; this.flee = 0;
  }
  get sortY() { return this.y; }
  frame() {
    if (this.kind === 'critter') return this.moving ? Math.floor(this.anim * 8) % 2 : (this.peck > 0 ? 2 : 0);
    return this.moving ? WALK_CYCLE[Math.floor(this.anim * 7) % 4] : 0;
  }
}

// 格子 → 角色腳底座標（x 置中，y 是腳底）
export const tileCenter = (tx, ty) => ({ x: tx * T + T / 2, y: ty * T + T - 2 });
const footRect = (x, y) => ({ x: x - 5, y: y - 5, w: 10, h: 5 });
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) return null;
  return world.grid[ty][tx];
}

export function blocked(r, self, actorsToo = true) {
  const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w - 0.001) / T);
  const y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h - 0.001) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const ch = tileAt(tx, ty);
    if (ch === null || SOLID_TILES.has(ch)) return true;
  }
  for (const o of world.objects) if (o.solid && overlap(r, o.solid)) return true;
  if (actorsToo) for (const a of world.actors) if (a !== self && overlap(r, footRect(a.x, a.y))) return true;
  return false;
}

const free = (a, x, y, act) => !blocked(footRect(x, y), a, act);

export function moveActor(a, dx, dy, act = true) {
  if (dx) {
    if (free(a, a.x + dx, a.y, act)) a.x += dx;
    else if (Math.abs(dy) < Math.abs(dx) * 0.5) slide(a, 'y', dx, act);
  }
  if (dy) {
    if (free(a, a.x, a.y + dy, act)) a.y += dy;
    else if (Math.abs(dx) < Math.abs(dy) * 0.5) slide(a, 'x', dy, act);
  }
}

// 撞到牆角時往側邊推一點，讓角色能自然繞過去（觸控操作很需要）
function slide(a, axis, d, act) {
  const step = Math.abs(d);
  for (let k = 1; k <= 7; k++) for (const s of [-1, 1]) {
    const ox = axis === 'x' ? s * k : 0, oy = axis === 'y' ? s * k : 0;
    const tx = a.x + ox + (axis === 'y' ? d : 0), ty = a.y + oy + (axis === 'x' ? d : 0);
    if (free(a, a.x + ox, a.y + oy, act) && free(a, tx, ty, act)) {
      if (axis === 'x') a.x += s * Math.min(step, k); else a.y += s * Math.min(step, k);
      return true;
    }
  }
  return false;
}

export function dirFrom(x, y, cur) {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (ax > ay * 1.15) return x < 0 ? 'left' : 'right';
  if (ay > ax * 1.15) return y < 0 ? 'up' : 'down';
  return cur;
}

export function loadMap(id) {
  const m = MAPS[id];
  if (!m) throw new Error('找不到地圖：' + id);
  world.map = m; world.w = m.w; world.h = m.h; world.grid = m.ground;
  world.objects = m.objects.map((o) => {
    const def = OBJ_DEFS[o.t];
    if (!def) throw new Error('未定義的物件類型：' + o.t);
    const art = Art.objects[o.s || o.t];
    if (!art) throw new Error('缺少物件圖：' + (o.s || o.t));
    const fx = o.at[0] * T + T / 2, fy = o.at[1] * T + T;
    const s = def.solid;
    return {
      kind: 'obj', type: o.t, talk: o.talk || null, art, fx, fy, sortY: fy,
      dx: Math.round(fx - art.img.width / 2), dy: fy - art.img.height,
      solid: s ? { x: fx + s[0], y: fy + s[1], w: s[2], h: s[3] } : null,
    };
  });
  world.npcs = m.npcs.map((n) => new Actor({ ...n, ...tileCenter(n.at[0], n.at[1]) }));
  world.critters = (m.critters || []).map((c) => new Actor({
    kind: 'critter', sprite: c.sprite, ...tileCenter(c.at[0], c.at[1]),
    dir: Math.random() < 0.5 ? 'left' : 'right', wander: c.wander, speed: 16,
  }));
  world.exits = m.exits || [];
  world.focus = null;
  buildGround();
}

export function setPlayer(p) {
  world.player = p;
  world.actors = [p, ...world.npcs];
}

/* ── 地面預先畫成一張大圖（水面兩幀動畫）── */
function hash(x, y) { let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0; h ^= h >>> 13; return h >>> 0; }

function buildGround() {
  world.groundCanvases = [0, 1].map((frame) => {
    const [c, ctx] = mkCanvas(world.w * T, world.h * T);
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
      const key = TILE_OF[world.grid[y][x]] || 'grass';
      const art = Art.tiles[key];
      const sz = art.img.height;
      const idx = key === 'water' ? frame % art.n : hash(x, y) % art.n;
      ctx.drawImage(art.img, idx * sz, 0, sz, sz, x * T, y * T, T, T);
    }
    decorate(ctx);
    return c;
  });
}

// 邊緣修飾：水岸陰影、路邊草叢
function decorate(ctx) {
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
    const ch = world.grid[y][x];
    const up = tileAt(x, y - 1);
    if (ch === '~' && up !== null && up !== '~') {
      if (up === 'b') R(x * T, y * T, T, 2, '#122326');
      else { R(x * T, y * T, T, 2, '#2b261f'); R(x * T, y * T + 2, T, 1, '#122326'); }
    }
    if (ch !== '.' && ch !== '~') {
      const r = rng(hash(x, y) + 1);
      for (const [sx, sy] of sides) {
        if (tileAt(x + sx, y + sy) !== '.') continue;
        for (let i = 0; i < 6; i++) {
          const t = r() * T | 0, d = r() < 0.6 ? 0 : 1;
          const px = sx === 0 ? x * T + t : (sx < 0 ? x * T + d : x * T + T - 1 - d);
          const py = sy === 0 ? y * T + t : (sy < 0 ? y * T + d : y * T + T - 1 - d);
          R(px, py, 1, 1, r() < 0.5 ? '#2d4529' : '#33502e');
        }
      }
    }
  }
}

/* ── NPC 與小動物 ── */
export function updateNPCs(dt) {
  for (const n of world.npcs) wander(n, dt, true);
  const p = world.player;
  for (const c of world.critters) {
    const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy);
    if (d < 22 && d > 0.01) { c.target = { x: c.x + dx / d * 30, y: c.y + dy / d * 30 }; c.flee = 0.6; c.stuck = 0; }
    if (c.flee > 0) c.flee -= dt;
    wander(c, dt, false);
    if (!c.moving) {
      c.peckT = (c.peckT ?? 1 + Math.random() * 3) - dt;
      if (c.peckT <= 0) { c.peck = 0.4; c.peckT = 1.5 + Math.random() * 4; }
      if (c.peck > 0) c.peck -= dt;
    }
  }
}

function wander(n, dt, act) {
  if (n.busy || (!n.wander && !n.target)) { n.moving = false; return; }
  if (!n.target) {
    n.moving = false;
    n.wait -= dt;
    if (n.wait <= 0) {
      const R = n.wander * T;
      n.target = { x: n.home.x + (Math.random() * 2 - 1) * R, y: n.home.y + (Math.random() * 2 - 1) * R };
      n.stuck = 0;
    }
    return;
  }
  const dx = n.target.x - n.x, dy = n.target.y - n.y, d = Math.hypot(dx, dy);
  if (d < 1.5 || n.stuck > 0.5) { n.target = null; n.wait = 1.5 + Math.random() * 3; n.moving = false; return; }
  const sp = n.flee > 0 ? n.speed * 2.8 : n.speed;
  const ox = n.x, oy = n.y;
  moveActor(n, dx / d * sp * dt, dy / d * sp * dt, act);
  if (Math.hypot(n.x - ox, n.y - oy) < sp * dt * 0.3) n.stuck += dt;
  n.moving = true; n.anim += dt;
  n.dir = n.kind === 'critter' ? (dx < 0 ? 'left' : 'right') : dirFrom(dx, dy, n.dir);
}

/* ── 互動與出口 ── */
export function findInteract() {
  const p = world.player;
  const [fx, fy] = DIRV[p.dir];
  const px = p.x + fx * 12, py = p.y - 3 + fy * 12;
  let best = null, bd = 14;
  for (const n of world.npcs) {
    if (!n.talk) continue;
    const d = Math.hypot(n.x - px, n.y - 3 - py);
    if (d < bd) { best = n; bd = d; }
  }
  if (best) return best;
  for (const o of world.objects) {
    if (!o.talk || !o.solid) continue;
    const s = o.solid;
    if (px >= s.x - 4 && px <= s.x + s.w + 4 && py >= s.y - 4 && py <= s.y + s.h + 4) return o;
  }
  return null;
}

export function exitAt(x, y) {
  for (const e of world.exits) {
    const [tx, ty, w, h] = e.rect;
    if (x >= tx * T && x < (tx + w) * T && y - 1 >= ty * T && y - 1 < (ty + h) * T) return e;
  }
  return null;
}
