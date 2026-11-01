import Phaser from "phaser";
import { Fighter } from "./Fighter";
export class Player extends Fighter {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, "hero", x, y);
  }
  /** Ground-plane locomotion stays independent from visual animation. */
  move(input: { x: number; y: number }, dt: number) {
    if (!["idle", "walk", "attack"].includes(this.state)) return;
    const attacking = this.state === "attack";
    const speed = attacking ? 42 : 145;
    this.x += input.x * speed * dt;
    this.y += input.y * speed * dt;
    if (input.x && !attacking) this.facing = input.x > 0 ? 1 : -1;
    if (!attacking) this.state = input.x || input.y ? "walk" : "idle";
  }
}
