export const attacks = [
  {
    damage: 12,
    range: 49,
    depth: 18,
    windup: 0.1,
    active: 0.1,
    recovery: 0.18,
    knock: 11,
  },
  {
    damage: 16,
    range: 55,
    depth: 19,
    windup: 0.12,
    active: 0.1,
    recovery: 0.2,
    knock: 16,
  },
  {
    damage: 26,
    range: 65,
    depth: 22,
    windup: 0.18,
    active: 0.12,
    recovery: 0.3,
    knock: 37,
  },
];
export function inRange(
  a: { x: number; y: number; facing: number },
  b: { x: number; y: number },
  range: number,
  depth: number,
) {
  const dx = b.x - a.x;
  return (
    dx * a.facing >= -5 && Math.abs(dx) <= range && Math.abs(b.y - a.y) <= depth
  );
}
export function normalized(x: number, y: number) {
  const n = Math.hypot(x, y);
  return n > 1 ? { x: x / n, y: y / n } : { x, y };
}

export const enemyAttack = {
  damage: 9,
  range: 48,
  depth: 18,
  windup: 0.3,
  active: 0.1,
  recovery: 0.55,
  knock: 10,
};
