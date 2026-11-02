import { handPoint } from "../tactics-sprite/tactics-sprite.mjs";
import art from "./art.json";

export const gripArt = art;
export function characterData(official) {
  const data = structuredClone(official);
  data.sheet.file = "zhaoyun.png";
  // Grip locations belong only to our newly drawn tiles. No a1.png grips or holds survive.
  data.hands = structuredClone(art.grips);
  data.holds = null;
  return data;
}
export function spearPose(atlas, pose, view) {
  const hand = handPoint(atlas, pose, "last");
  if (!hand)
    throw Error(`Missing Zhao Yun grip on ${pose.tiles[pose.count - 1].id}`);
  const last = pose.tiles[pose.count - 1].id;
  // New wrist poses, authored against our own joint landmarks. No inherited slide/offset table.
  const tilt = /LG20|LG51/.test(last)
    ? -0.16
    : /LG23|LG43/.test(last)
      ? 0.25
      : 1.2;
  const elevation = Math.atan2(0.3, Math.SQRT1_2),
    azimuth = Math.atan2(0.5, -0.5) + ((view - 1) * Math.PI) / 4;
  const sx = (Math.cos(tilt) * Math.cos(azimuth)) / 0.75;
  const sy =
    -(
      Math.sin(tilt) * Math.cos(elevation) -
      Math.cos(tilt) * Math.sin(elevation) * Math.sin(azimuth)
    ) / 0.9;
  return {
    hand,
    angle: Math.atan2(sy, sx),
    over: pose.back ? pose.count : 1,
    tilt,
  };
}

/** CPU nearest-neighbour compositor: export native, transparent pixels, without WebGL lighting. */
export function renderPosePng(atlas, pose, view, sheet, spear) {
  const size = 128,
    ox = 64,
    oy = 72,
    canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  const spec = spearPose(atlas, pose, view),
    insert = pose.count - spec.over;
  const drawSpear = () => {
    const tmp = document.createElement("canvas");
    tmp.width = 64;
    tmp.height = 7;
    const c = tmp.getContext("2d");
    c.drawImage(spear, 0, 0);
    const src = c.getImageData(0, 0, 64, 7).data;
    const dst = ctx.getImageData(0, 0, size, size),
      co = Math.cos(spec.angle),
      si = Math.sin(spec.angle);
    const hx = ox + spec.hand[0],
      hy = oy + spec.hand[1];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const dx = x - hx,
          dy = y - hy,
          u = Math.round(dx * co + dy * si + 18),
          v = Math.round(-dx * si + dy * co + 3);
        if (u < 0 || u >= 64 || v < 0 || v >= 7) continue;
        const from = (v * 64 + u) * 4;
        if (!src[from + 3]) continue;
        const to = (y * size + x) * 4;
        for (let k = 0; k < 4; k++) dst.data[to + k] = src[from + k];
      }
    ctx.putImageData(dst, 0, 0);
  };
  for (let i = 0; i <= pose.count; i++) {
    if (i === insert) drawSpear();
    if (i === pose.count) break;
    const t = pose.tiles[i],
      x = ox + t.x + pose.moveX,
      y = oy + t.y + pose.moveY;
    ctx.save();
    ctx.translate(Math.round(x) + (t.flipX ? t.w : 0), Math.round(y));
    ctx.scale(t.flipX ? -1 : 1, 1);
    ctx.drawImage(sheet, t.sx, t.sy, t.w, t.h, 0, 0, t.w, t.h);
    ctx.restore();
  }
  return canvas;
}
