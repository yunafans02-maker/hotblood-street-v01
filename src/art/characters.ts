import Phaser from "phaser";
export type Pose =
  "idle" | "walk" | "attack" | "hurt" | "down" | "rise" | "victory";
export const poses: Record<Pose, number> = {
  idle: 4,
  walk: 6,
  attack: 9,
  hurt: 2,
  down: 3,
  rise: 3,
  victory: 4,
};
/** Original pixel artwork; every pose is rasterized on the same 64×56 grid. */
export function createCharacters(scene: Phaser.Scene) {
  for (const kind of ["hero", "enemy"])
    for (const [pose, count] of Object.entries(poses))
      for (let f = 0; f < count; f++) {
        const key = `${kind}-${pose}-${f}`;
        if (scene.textures.exists(key)) continue;
        const t = scene.textures.createCanvas(key, 64, 56)!;
        const c = t.context;
        c.imageSmoothingEnabled = false;
        c.translate(8, 4);
        const ink = "#141a27",
          skin = "#edb17f",
          shade = "#bc745c",
          cloth = kind === "hero" ? "#35aa9d" : "#9260af",
          dark = kind === "hero" ? "#1d696d" : "#573b73",
          hair = kind === "hero" ? "#263443" : "#633a37";
        const r = (
          x: number,
          y: number,
          w: number,
          h: number,
          color: string,
        ) => {
          c.fillStyle = color;
          c.fillRect(Math.round(x), Math.round(y), w, h);
        };
        const box = (
          x: number,
          y: number,
          w: number,
          h: number,
          color: string,
        ) => {
          r(x - 1, y - 1, w + 2, h + 2, ink);
          r(x, y, w, h, color);
        };
        let bob =
          pose === "idle"
            ? f === 1 || f === 2
              ? 1
              : 0
            : pose === "walk"
              ? f % 3 === 1
                ? -1
                : 0
              : 0;
        if (pose === "down" || (pose === "rise" && f === 0)) {
          const shift = pose === "down" ? Math.min(f, 1) : 0;
          box(7, 33 + shift, 22, 10, dark);
          box(28, 27 + shift, 17, 16, skin);
          r(29, 27 + shift, 15, 5, hair);
          r(35, 34 + shift, 5, 2, ink);
          r(37, 38 + shift, 5, 1, shade);
          box(1, 38, 10, 5, "#e1d6ba");
          box(16, 31 + shift, 10, 8, cloth);
          box(22, 37 + shift, 8, 5, skin);
          t.refresh();
          continue;
        }
        if (pose === "rise") bob = 5 - f * 2;
        if (pose === "hurt") bob = f === 0 ? 1 : 2;
        const stride =
          pose === "walk"
            ? [0, 2, 4, 0, -2, -4][f]
            : pose === "attack"
              ? f % 3 === 2
                ? 3
                : 0
              : 0;
        box(17 + stride, 35 + bob, 6, 8, "#27394d");
        box(26 - stride, 35 + bob, 6, 8, "#27394d");
        box(15 + stride, 42 + bob, 9, 3, "#e6d9b5");
        box(25 - stride, 42 + bob, 10, 3, "#e6d9b5");
        box(15, 24 + bob, 18, 13, cloth);
        r(16, 32 + bob, 16, 4, dark);
        r(23, 26 + bob, 2, 9, "#f5d58d");
        r(17, 25 + bob, 3, 5, "#b6e2cc");
        r(29, 27 + bob, 2, 3, "#f5d58d");
        // Oversized head, sculpted cheek, ear and strong eyebrows.
        box(14, 8 + bob, 20, 17, skin);
        r(14, 20 + bob, 3, 4, shade);
        r(16, 24 + bob, 15, 2, shade);
        box(33, 15 + bob, 3, 6, skin);
        r(13, 6 + bob, 21, 8, hair);
        r(15, 4 + bob, 8, 4, hair);
        r(22, 3 + bob, 7, 5, hair);
        r(29, 6 + bob, 6, 5, hair);
        r(14, 13 + bob, 3, 5, hair);
        r(16, 7 + bob, 12, 2, kind === "hero" ? "#455669" : "#945047");
        r(20, 14 + bob, 5, 2, ink);
        r(28, 13 + bob, 5, 2, ink);
        r(23, 16 + bob, 2, 3, ink);
        r(30, 16 + bob, 2, 3, ink);
        r(26, 19 + bob, 3, 2, shade);
        r(25, 22 + bob, 6, 1, ink);
        if (kind === "hero") {
          r(13, 11 + bob, 21, 2, "#f2c45a");
          r(12, 12 + bob, 4, 4, "#d98644");
        }
        let reach = 0;
        if (pose === "attack") reach = [0, 3, 10, 0, 5, 12, 0, 7, 14][f];
        box(11, 26 + bob, 6, 9, dark);
        box(11, 32 + bob, 6, 6, skin);
        if (pose === "victory") {
          box(29, 21 - (f % 2), 6, 10, cloth);
          box(29, 16 - (f % 2), 7, 7, skin);
          r(25, 21 + bob, 7, 2, ink);
          r(26, 21 + bob, 5, 1, "#fff0cd");
        } else {
          const armY =
            26 + bob + (pose === "attack" && f >= 3 ? (f >= 6 ? -5 : 2) : 0);
          box(29, armY, 6 + reach, 6, cloth);
          box(31 + reach, armY, 7, 7, skin);
          r(33 + reach, armY + 1, 4, 2, "#ffd6a0");
        }
        if (pose === "hurt") {
          r(20, 17 + bob, 5, 1, ink);
          r(28, 17 + bob, 5, 1, ink);
          r(26, 22 + bob, 5, 2, ink);
        }
        t.refresh();
      }
}
