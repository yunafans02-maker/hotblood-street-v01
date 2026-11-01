import Phaser from "phaser";
import { createCharacters } from "../art/characters";
import { street } from "../art/street";
import { Player } from "../actors/Player";
import { resolveCombat } from "../systems/CombatSystem";
import { Fighter } from "../actors/Fighter";
import { updateEnemy } from "../actors/Enemy";
import { Controls } from "../systems/input";
export class StreetScene extends Phaser.Scene {
  player!: Player;
  enemies: Fighter[] = [];
  controls!: Controls;
  elapsed = 0;
  freeze = 0;
  spawned = 0;
  kills = 0;
  ended = false;
  wave = 0;
  private hud!: Phaser.GameObjects.Text;
  private health!: Phaser.GameObjects.Graphics;
  private banner!: Phaser.GameObjects.Text;
  private nextWave = 0;
  private bufferedAttack = 0;
  private bannerUntil = 3;
  private comboText!: Phaser.GameObjects.Text;
  constructor() {
    super("street");
  }
  init() {
    this.enemies = [];
    this.elapsed =
      this.freeze =
      this.spawned =
      this.kills =
      this.wave =
      this.nextWave =
      this.bufferedAttack =
        0;
    this.bannerUntil = 3;
    this.ended = false;
  }
  create() {
    this.enemies = [];
    this.elapsed =
      this.freeze =
      this.spawned =
      this.kills =
      this.wave =
      this.nextWave =
        0;
    this.ended = false;
    createCharacters(this);
    street(this);
    this.player = new Player(this, 220, 345);
    this.controls = new Controls(this);
    this.cameras.main.setBounds(0, 0, 1800, 540);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08, 0, 0);
    this.cameras.main.setDeadzone(230, 160);
    this.add
      .rectangle(480, 40, 920, 58, 0x122637, 0.92)
      .setScrollFactor(0)
      .setDepth(10000)
      .setStrokeStyle(1, 0x59757e);
    this.add
      .text(36, 18, "熱血街頭", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffcc78",
      })
      .setScrollFactor(0)
      .setDepth(10001);
    this.add
      .text(38, 46, "PROTOTYPE 0.1  /  青嶺高校前", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#afc4c9",
      })
      .setScrollFactor(0)
      .setDepth(10001);
    this.health = this.add.graphics().setScrollFactor(0).setDepth(10001);
    this.hud = this.add
      .text(710, 22, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f0dfbd",
      })
      .setScrollFactor(0)
      .setDepth(10001);
    this.banner = this.add
      .text(480, 108, "放課後的街道，由你守住。", {
        fontSize: "20px",
        fontFamily: "sans-serif",
        color: "#ffe4ac",
        stroke: "#1b3041",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10002);
    this.comboText = this.add
      .text(480, 151, "", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#ffd07b",
        stroke: "#1b3041",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10002);
    this.add
      .text(
        480,
        489,
        "八方向移動  ·  連按攻擊：三段連擊  |  WASD / ↑↓←→  ·  J / SPACE",
        { fontFamily: "sans-serif", fontSize: "12px", color: "#c6d3cf" },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10012);
    this.spawnWave();
    this.events.once("shutdown", () => {
      this.input.keyboard?.resetKeys();
    });
    // Development-only state inspection; excluded unless explicitly requested via URL.
    if (new URLSearchParams(location.search).has("test"))
      (window as unknown as { __game: StreetScene }).__game = this;
  }
  spawnWave() {
    this.wave++;
    const n = this.wave === 1 ? 2 : this.wave === 2 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Clamp(this.player.x + 310 + i * 90, 90, 1720);
      const e = new Fighter(this, "enemy", x, 305 + i * 65, this.spawned++);
      e.cooldown = 0.8 + i * 0.4;
      this.enemies.push(e);
    }
    this.bannerUntil = this.elapsed + 2.5;
    this.banner.setAlpha(1).setText(`第 ${this.wave} 波  /  ${n} 名對手`);
  }
  update(_t: number, ms: number) {
    const dt = Math.min(ms / 1000, 0.033);
    if (document.hidden || innerHeight > innerWidth) {
      this.controls.reset();
      this.bufferedAttack = 0;
      return;
    }
    const input = this.controls.read();
    this.controls.consume();
    if (this.ended) return;
    if (input.attack) this.bufferedAttack = 0.15;
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    this.elapsed += dt;
    const p = this.player;
    if (
      this.bufferedAttack > 0 &&
      (["idle", "walk"].includes(p.state) ||
        (p.state === "attack" && p.time > 0.09))
    ) {
      p.attack(this.elapsed);
      this.bufferedAttack = 0;
    }
    this.bufferedAttack = Math.max(0, this.bufferedAttack - dt);
    if (input.held && p.state === "attack" && p.time > 0.12)
      p.attack(this.elapsed);
    p.move(input, dt);
    this.enemies.forEach((e, i) => updateEnemy(e, p, dt, i));
    for (const f of [p, ...this.enemies]) f.tick(dt, this.elapsed);
    resolveCombat(p, this.enemies, (x, y) => {
      this.freeze = 0.055;
      this.cameras.main.shake(65, 0.002);
      this.impact(x, y);
    });
    this.kills = this.enemies.filter((e) => e.hp <= 0).length;
    this.health
      .clear()
      .fillStyle(0x344b5a)
      .fillRect(236, 27, 250, 15)
      .fillStyle(0x55c6a6)
      .fillRect(236, 27, (250 * p.hp) / p.maxHp, 15);
    this.hud.setText(`擊敗 ${this.kills} / 5\nWAVE ${this.wave} / 3`);
    this.comboText.setText(
      p.state === "attack"
        ? `${["壹 · 直拳", "貳 · 追擊", "參 · 重擊"][p.combo]}`
        : "",
    );
    if (this.elapsed > this.bannerUntil) this.banner.setAlpha(0);
    if (p.hp <= 0 && p.state === "dead") {
      this.finish(false);
      return;
    }
    if (this.enemies.every((e) => e.state === "dead")) {
      if (this.spawned < 5) {
        this.nextWave += dt;
        if (this.nextWave > 0.9) {
          this.nextWave = 0;
          this.spawnWave();
        }
      } else this.finish(true);
    }
  }
  impact(x: number, y: number) {
    const g = this.add.graphics().setDepth(9000);
    g.lineStyle(3, 0xffe5a0);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.lineBetween(
        x + Math.cos(a) * 5,
        y + Math.sin(a) * 5,
        x + Math.cos(a) * 19,
        y + Math.sin(a) * 19,
      );
    }
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 150,
      onComplete: () => g.destroy(),
    });
  }
  finish(win: boolean) {
    this.ended = true;
    if (win) this.player.setState("victory");
    if (win)
      this.time.addEvent({
        delay: 120,
        repeat: 15,
        callback: () => {
          this.player.time += 0.12;
          this.player.render();
        },
      });
    this.add
      .rectangle(480, 253, 960, 506, 0x091727, 0.77)
      .setScrollFactor(0)
      .setDepth(11000);
    this.add
      .text(480, 186, win ? "街頭，守住了。" : "再站起來一次。", {
        fontFamily: "sans-serif",
        fontStyle: "bold",
        fontSize: "42px",
        color: win ? "#ffcf7f" : "#e9b2a1",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11001);
    this.add
      .text(
        480,
        246,
        win
          ? "STAGE CLEAR  /  5 名對手全數擊敗"
          : "GAME OVER  /  青嶺通り等你再戰",
        { fontSize: "17px", color: "#c5d7d9" },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11001);
    const b = this.add
      .text(480, 322, "  重新開始  ↻  ", {
        fontSize: "24px",
        backgroundColor: "#e8b46c",
        color: "#152c3c",
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11002)
      .setInteractive({ useHandCursor: true });
    b.once("pointerdown", () => this.scene.restart());
  }
}
