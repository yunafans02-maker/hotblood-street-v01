import Phaser from "phaser";
export function street(s: Phaser.Scene) {
  const g = s.add.graphics();
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    g.fillStyle(c);
    g.fillRect(x, y, w, h);
  };
  rect(0, 0, 1800, 506, 0x92b8bd);
  rect(0, 96, 1800, 80, 0x7b9ca6);
  for (let x = 0; x < 1800; x += 150) {
    rect(x, 85, 130, 115, 0x708b9c);
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 3; b++)
        rect(x + 12 + a * 28, 100 + b * 26, 14, 16, 0xa6c4c7);
  }
  rect(0, 157, 1800, 94, 0xd2bd93);
  rect(0, 151, 1800, 7, 0x47576a);
  rect(0, 242, 1800, 13, 0x677477);
  for (let x = 0; x < 1800; x += 40) {
    rect(x, 161, 2, 78, 0xb19f82);
    rect(x, 196, 40, 2, 0xb19f82);
    rect(x, 229, 40, 2, 0xb19f82);
  }
  // School entrance, fence, shop and original street signage.
  for (let x = 330; x < 920; x += 18) {
    rect(x, 108, 4, 132, 0x42586a);
    rect(x + 1, 110, 1, 120, 0x8ba9af);
  }
  rect(320, 138, 610, 5, 0x42586a);
  rect(320, 175, 610, 5, 0x42586a);
  rect(255, 115, 66, 129, 0xd9ccb0);
  rect(920, 115, 66, 129, 0xd9ccb0);
  rect(250, 107, 76, 10, 0x536775);
  rect(915, 107, 76, 10, 0x536775);
  rect(1100, 83, 320, 158, 0x435c6b);
  rect(1111, 106, 298, 128, 0xe1cda4);
  rect(1120, 144, 135, 90, 0x263f51);
  rect(1268, 144, 132, 90, 0x263f51);
  rect(1090, 116, 340, 27, 0xc86850);
  for (let x = 1090; x < 1430; x += 34) rect(x, 116, 17, 27, 0xf0c58a);
  rect(0, 255, 1800, 251, 0x526676);
  rect(0, 255, 1800, 7, 0xe2d2ae);
  rect(0, 265, 1800, 3, 0x354b60);
  rect(0, 435, 1800, 4, 0x8d9a9b);
  rect(0, 439, 1800, 67, 0x405463);
  for (let x = 0; x < 1800; x += 110) {
    rect(x, 373, 57, 3, 0x819294);
    rect(x + 32, 466, 65, 4, 0xc9bc94);
    rect(x + 6, 284, 28, 2, 0x647b87);
    rect(x + 20, 327, 12, 2, 0x41596c);
  }
  for (const x of [100, 1030, 1560]) {
    rect(x, 86, 6, 170, 0x344b5b);
    rect(x - 15, 80, 36, 9, 0x344b5b);
    rect(x - 11, 83, 28, 3, 0xf5dba2);
  }
  for (const x of [180, 1480]) {
    rect(x, 190, 11, 62, 0x74544c);
    for (let n = 0; n < 5; n++) {
      rect(x - 30 + n * 10, 159 - (n % 2) * 12, 40, 37, 0x365e61);
      rect(x - 24 + n * 10, 156 - (n % 2) * 12, 26, 13, 0x4e8277);
    }
  }
  s.add.text(273, 136, "青\n嶺\n高\n校", {
    fontSize: "15px",
    color: "#344c5c",
    fontFamily: "serif",
    lineSpacing: 1,
  });
  s.add.text(1170, 92, "放課後・食堂", {
    fontSize: "18px",
    color: "#fff0c9",
    fontFamily: "sans-serif",
  });
  g.setDepth(-100);
  s.add
    .text(48, 214, "青嶺通り  /  SEIREI STREET", {
      fontSize: "13px",
      color: "#596b70",
      fontFamily: "monospace",
    })
    .setDepth(-99);
}
