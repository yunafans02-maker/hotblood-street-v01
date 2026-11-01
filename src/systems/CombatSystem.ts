import Phaser from "phaser";
import type { Fighter } from "../actors/Fighter";
import { inRange } from "./combat";

/** Ground bodies and independent facing/depth-gated strike volumes. */
export function resolveCombat(
  p: Fighter,
  enemies: Fighter[],
  onHit: (x: number, y: number) => void,
) {
  // Ground-plane bodies prevent standing inside one another without blocking punches.
  const live = [
    p,
    ...enemies.filter((e) => !["down", "dead"].includes(e.state)),
  ];
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i],
        b = live[j],
        dx = b.x - a.x,
        dy = b.y - a.y;
      if (Math.abs(dx) < 25 && Math.abs(dy) < 12) {
        const push = (25 - Math.abs(dx)) * 0.5;
        const sign = dx >= 0 ? 1 : -1;
        a.x -= push * sign;
        b.x += push * sign;
      }
    }
  for (const f of [p, ...enemies]) {
    f.x = Phaser.Math.Clamp(f.x, 35, 1770);
    f.render();
  }
  for (const a of [p, ...enemies]) {
    if (a.state !== "attack") continue;
    const spec = a.attackData;
    if (a.time < spec.windup || a.time > spec.windup + spec.active) continue;
    for (const b of a === p ? enemies : [p]) {
      if (a.hit.has(b) || !inRange(a, b, spec.range, spec.depth)) continue;
      if (
        b.damage(
          a === p ? spec.damage : 9,
          a.facing,
          spec.knock,
          a === p && a.combo === 2,
        )
      ) {
        a.hit.add(b);
        onHit((a.x + b.x) / 2, b.y - 48);
      }
    }
  }
}
