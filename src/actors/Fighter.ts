import Phaser from "phaser";
import { Pose } from "../art/characters";
import { frameFor } from "../systems/animation";
import { attacks, enemyAttack } from "../systems/combat";
export type State = Pose | "dead";
export class Fighter {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  hp: number;
  maxHp: number;
  state: State = "idle";
  time = 0;
  facing = 1;
  combo = 0;
  queued = false;
  hit = new Set<Fighter>();
  cooldown = 0;
  invulnerable = 0;
  vx = 0;
  lastCombo = -99;
  hitsTaken = 0;
  constructor(
    public scene: Phaser.Scene,
    public kind: "hero" | "enemy",
    public x: number,
    public y: number,
    public index = 0,
  ) {
    this.hp = this.maxHp = kind === "hero" ? 120 : 64;
    this.shadow = scene.add.ellipse(x, y, 39, 11, 0x111a28, 0.35);
    this.sprite = scene.add
      .image(x, y, `${kind}-idle-0`)
      .setOrigin(0.5, 50 / 56)
      .setScale(2);
  }
  get attackData() {
    return this.kind === "hero" ? attacks[this.combo] : enemyAttack;
  }
  setState(s: State) {
    this.state = s;
    this.time = 0;
  }
  attack(now: number) {
    if (this.state === "attack") {
      if (this.time > 0.09) this.queued = true;
      return;
    }
    if (this.state === "idle" || this.state === "walk") {
      this.combo =
        this.kind === "hero" && now - this.lastCombo < 0.6
          ? (this.combo + 1) % 3
          : 0;
      this.beginAttack();
    }
  }
  beginAttack() {
    this.setState("attack");
    this.hit.clear();
    this.queued = false;
  }
  damage(amount: number, dir: number, knock: number, down: boolean) {
    if (
      this.invulnerable > 0 ||
      ["dead", "down", "rise", "victory"].includes(this.state)
    )
      return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.kind === "hero") this.invulnerable = 0.45;
    this.vx = dir * knock * 7;
    this.queued = false;
    this.hitsTaken++;
    this.setState(
      this.hp === 0 ||
        down ||
        (this.kind === "hero" && this.hitsTaken % 3 === 0)
        ? "down"
        : "hurt",
    );
    return true;
  }
  tick(dt: number, now: number) {
    this.cooldown -= dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.time += dt;
    this.x += this.vx * dt;
    this.vx *= Math.exp(-dt * 10);
    this.x = Phaser.Math.Clamp(this.x, 35, 1770);
    this.y = Phaser.Math.Clamp(this.y, 257, 424);
    if (this.state === "attack") {
      const a = this.attackData;
      if (this.time >= a.windup + a.active + a.recovery) {
        this.lastCombo = now;
        if (this.queued && this.kind === "hero" && this.combo < 2) {
          this.combo++;
          this.beginAttack();
        } else {
          this.setState("idle");
          this.cooldown = 0.65 + this.index * 0.12;
        }
      }
    }
    if (this.state === "hurt" && this.time > 0.29) this.setState("idle");
    if (this.state === "down" && this.time > 0.85) {
      if (this.hp <= 0) this.setState("dead");
      else this.setState("rise");
    }
    if (this.state === "rise" && this.time > 0.46) {
      this.setState("idle");
      this.invulnerable = 0.65;
    }
    this.render();
  }
  render() {
    const pose = this.state === "dead" ? "down" : this.state;
    const a = this.attackData;
    this.sprite
      .setTexture(
        `${this.kind}-${pose}-${frameFor(pose, this.time, this.combo, a)}`,
      )
      .setPosition(Math.round(this.x), Math.round(this.y))
      .setFlipX(this.facing < 0)
      .setDepth(this.y)
      .setAlpha(this.state === "dead" ? 0.25 : 1);
    this.shadow
      .setPosition(this.x, this.y - 3)
      .setDepth(this.y - 1)
      .setAlpha(this.state === "dead" ? 0.1 : 1);
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 15) % 2)
      this.sprite.setAlpha(0.5);
  }
}
