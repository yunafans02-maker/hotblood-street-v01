import Phaser from "phaser";
import { normalized } from "./combat";
export class Controls {
  x = 0;
  y = 0;
  pressed = false;
  held = false;
  private stick: number | null = null;
  private attackId: number | null = null;
  private origin = { x: 120, y: 419 };
  private knob: Phaser.GameObjects.Arc;
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private lastHeld = false;
  reset = () => {};
  private cleanup: () => void;
  constructor(scene: Phaser.Scene) {
    const fixed = (o: Phaser.GameObjects.Shape) =>
      o.setScrollFactor(0).setDepth(10010);
    fixed(
      scene.add
        .circle(120, 419, 55, 0x14283b, 0.66)
        .setStrokeStyle(2, 0xb9d9db, 0.3),
    );
    fixed(scene.add.circle(120, 419, 37, 0x7da8ac, 0.12));
    this.knob = fixed(
      scene.add.circle(120, 419, 23, 0xc5e1d7, 0.62),
    ) as Phaser.GameObjects.Arc;
    fixed(
      scene.add
        .circle(850, 416, 53, 0xf5ad54, 0.9)
        .setStrokeStyle(4, 0xffdb96, 0.5),
    );
    scene.add
      .text(850, 415, "攻擊", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#23323c",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10011);
    this.keys = scene.input.keyboard!.addKeys(
      "W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
    const attackKey = (event: KeyboardEvent) => {
      if (!event.repeat) this.pressed = true;
    };
    scene.input.keyboard!.on("keydown-J", attackKey);
    scene.input.keyboard!.on("keydown-SPACE", attackKey);
    const down = (p: Phaser.Input.Pointer) => {
      if (p.x < 330 && p.y > 300 && this.stick === null) {
        this.stick = p.id;
        this.move(p);
      } else if (p.x > 730 && p.y > 300 && this.attackId === null) {
        this.attackId = p.id;
        this.pressed = true;
        this.held = true;
      }
    };
    const move = (p: Phaser.Input.Pointer) => {
      if (p.id === this.stick) this.move(p);
    };
    const up = (p: Phaser.Input.Pointer) => {
      if (p.id === this.stick) {
        this.stick = null;
        this.x = this.y = 0;
        this.knob.setPosition(120, 419);
      }
      if (p.id === this.attackId) {
        this.attackId = null;
        this.held = false;
      }
    };
    scene.input.on("pointerdown", down);
    scene.input.on("pointermove", move);
    scene.input.on("pointerup", up);
    scene.input.on("pointerupoutside", up);
    const reset = (this.reset = () => {
      this.stick = this.attackId = null;
      this.x = this.y = 0;
      this.held = this.pressed = this.lastHeld = false;
      this.knob.setPosition(120, 419);
      this.keys && Object.values(this.keys).forEach((k) => k.reset());
    });
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    document.addEventListener("visibilitychange", reset);
    scene.game.canvas.addEventListener("pointercancel", reset);
    scene.game.canvas.addEventListener("touchcancel", reset);
    this.cleanup = () => {
      scene.input.keyboard?.off("keydown-J", attackKey);
      scene.input.keyboard?.off("keydown-SPACE", attackKey);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", reset);
      scene.game.canvas.removeEventListener("pointercancel", reset);
      scene.game.canvas.removeEventListener("touchcancel", reset);
      scene.input.off("pointerdown", down);
      scene.input.off("pointermove", move);
      scene.input.off("pointerup", up);
      scene.input.off("pointerupoutside", up);
    };
    scene.events.once("shutdown", () => this.cleanup());
  }
  private move(p: Phaser.Input.Pointer) {
    const dx = p.x - this.origin.x,
      dy = p.y - this.origin.y,
      n = Math.hypot(dx, dy),
      s = Math.min(1, n / 45);
    this.x = n > 8 ? (dx / n) * s : 0;
    this.y = n > 8 ? (dy / n) * s : 0;
    this.knob.setPosition(120 + this.x * 32, 419 + this.y * 32);
  }
  read() {
    const k = this.keys;
    const keyboard = normalized(
      Number(k.D.isDown || k.RIGHT.isDown) -
        Number(k.A.isDown || k.LEFT.isDown),
      Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown),
    );
    const h = k.J.isDown || k.SPACE.isDown;
    if (h && !this.lastHeld) this.pressed = true;
    this.lastHeld = h;
    return {
      ...(keyboard.x || keyboard.y ? keyboard : normalized(this.x, this.y)),
      attack: this.pressed,
      held: this.held || h,
    };
  }
  consume() {
    this.pressed = false;
  }
}
