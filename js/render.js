// 畫面繪製：地面 → 依 y 排序的物件與角色 → 互動提示 → 落葉 → 暗角
import { TILE as T } from './config.js';
import { world } from './world.js';
import { Art } from './assets.js';
import { mkCanvas } from './placeholder.js';

const ROW = { down: 0, left: 1, right: 2, up: 3 };
let vignette = null, vw = 0, vh = 0;
const leaves = Array.from({ length: 14 }, () => ({
  x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 0.6, p: Math.random() * 6.28,
  c: Math.random() < 0.5 ? '#6b5a2a' : '#8a6a2e',
}));

function buildVignette(w, h) {
  const [c, ctx] = mkCanvas(w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(8,12,10,0)');
  g.addColorStop(1, 'rgba(8,12,10,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  vignette = c; vw = w; vh = h;
}

export function render(ctx, view, t, dt) {
  if (!world.map || !world.player) return;
  if (vw !== view.w || vh !== view.h) buildVignette(view.w, view.h);
  const p = world.player, mw = world.w * T, mh = world.h * T;
  const camX = mw <= view.w ? Math.round((mw - view.w) / 2) : Math.max(0, Math.min(mw - view.w, Math.round(p.x - view.w / 2)));
  const camY = mh <= view.h ? Math.round((mh - view.h) / 2) : Math.max(0, Math.min(mh - view.h, Math.round(p.y - 10 - view.h / 2)));

  ctx.fillStyle = '#0b0f0d';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.drawImage(world.groundCanvases[Math.floor(t * 1.5) % 2], -camX, -camY);

  const list = [];
  const x0 = camX - 64, x1 = camX + view.w + 64, y0 = camY - 16, y1 = camY + view.h + 96;
  for (const o of world.objects) if (o.fx > x0 && o.fx < x1 && o.fy > y0 && o.fy < y1) list.push(o);
  for (const a of world.actors) list.push(a);
  for (const c of world.critters) list.push(c);
  list.sort((a, b) => a.sortY - b.sortY);
  for (const d of list) {
    if (d.kind === 'obj') ctx.drawImage(d.art.img, d.dx - camX, d.dy - camY);
    else drawActor(ctx, d, camX, camY);
  }

  const f = world.focus;
  if (f) {
    const bx = Math.round(f.kind === 'obj' ? f.fx : f.x) - camX;
    const by = Math.round(f.kind === 'obj' ? Math.max(f.dy + 6, f.fy - 44) : f.y - 27) - camY + (Math.sin(t * 6) > 0 ? 0 : -1);
    drawBubble(ctx, bx, by);
  }

  for (const l of leaves) {
    l.x += (0.012 + 0.012 * l.s) * dt; l.y += 0.035 * l.s * dt;
    if (l.x > 1.05) l.x -= 1.1; if (l.y > 1.05) { l.y -= 1.1; l.x = Math.random(); }
    const lx = Math.round(l.x * view.w + Math.sin(t * 1.3 + l.p) * 5), ly = Math.round(l.y * view.h);
    ctx.fillStyle = l.c; ctx.fillRect(lx, ly, l.s > 0.7 ? 2 : 1, 1);
  }
  ctx.drawImage(vignette, 0, 0);
}

function drawActor(ctx, a, cx, cy) {
  const art = Art.chars[a.sprite];
  const fw = art.img.width / art.cols, fh = art.img.height / art.rows;
  const row = art.rows === 2 ? (a.dir === 'right' ? 1 : 0) : ROW[a.dir];
  const col = a.frame();
  const x = Math.round(a.x) - cx, y = Math.round(a.y) - cy;
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(x - 4, y - 2, 9, 2); ctx.fillRect(x - 3, y - 3, 7, 1); ctx.fillRect(x - 3, y, 7, 1);
  ctx.drawImage(art.img, col * fw, row * fh, fw, fh, x - Math.floor(fw / 2), y - fh + 1, fw, fh);
}

function drawBubble(ctx, x, y) {
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  R(x - 5, y - 8, 11, 1, '#1a1412'); R(x - 5, y - 1, 11, 1, '#1a1412');
  R(x - 6, y - 7, 1, 6, '#1a1412'); R(x + 6, y - 7, 1, 6, '#1a1412');
  R(x - 5, y - 7, 11, 6, '#efe6cf');
  R(x - 3, y - 4, 1, 1, '#1a1412'); R(x, y - 4, 1, 1, '#1a1412'); R(x + 3, y - 4, 1, 1, '#1a1412');
  R(x - 1, y - 1, 3, 1, '#efe6cf'); R(x, y, 1, 1, '#1a1412'); R(x - 1, y, 1, 1, '#1a1412'); R(x + 1, y, 1, 1, '#1a1412');
}
