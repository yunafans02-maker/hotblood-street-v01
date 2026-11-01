import { Pose, poses } from "../art/characters";
import { attacks } from "./combat";
export function frameFor(
  pose: Pose,
  time: number,
  combo = 0,
  attack = attacks[combo],
) {
  if (pose === "attack") {
    const a = attack;
    return (
      combo * 3 + (time < a.windup ? 0 : time < a.windup + a.active ? 2 : 1)
    );
  }
  const fps = pose === "walk" ? 10 : pose === "idle" ? 5 : 8;
  return ["hurt", "down", "rise"].includes(pose)
    ? Math.min(poses[pose] - 1, Math.floor(time * fps))
    : Math.floor(time * fps) % poses[pose];
}
