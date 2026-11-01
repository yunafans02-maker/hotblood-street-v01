import { Fighter } from "./Fighter";
export function updateEnemy(e: Fighter, p: Fighter, dt: number, slot: number) {
  if (p.hp <= 0 || !["idle", "walk"].includes(e.state)) return;
  const dx = p.x - e.x,
    dy = p.y + (slot % 2 ? 7 : -7) - e.y;
  e.facing = dx >= 0 ? 1 : -1;
  if (Math.abs(dx) < 48 && Math.abs(dy) < 14 && e.cooldown <= 0) {
    e.attack(0);
    e.cooldown = 1;
    return;
  }
  const targetX = p.x + (dx > 0 ? -39 : 39);
  const mx = targetX - e.x,
    my = p.y + (slot % 2 ? 7 : -7) - e.y;
  const len = Math.hypot(mx, my);
  if (len > 5) {
    e.x += (mx / len) * 62 * dt;
    e.y += (my / len) * 62 * dt;
    e.state = "walk";
  } else e.state = "idle";
}
