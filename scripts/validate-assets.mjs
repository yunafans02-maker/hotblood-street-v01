import fs from "node:fs";
import assert from "node:assert/strict";
import { checkSheet, decodePng } from "../src/tactics-sprite/check-sheet.mjs";
const data = JSON.parse(
    fs.readFileSync("src/tactics-sprite/tactics-sprite-data.json"),
  ),
  art = JSON.parse(fs.readFileSync("src/character/static-art.json"));
const bytes = fs.readFileSync("public/zhaoyun-sheet.png"),
  report = checkSheet(bytes, data.cells),
  image = decodePng(bytes);
assert(report.ok);
const used = [...new Set(art.frames.flat().map((t) => t[0]))];
assert(used.length === art.usedCells.length);
for (const id of used)
  assert(!report.emptyCells.includes(id), `Missing visible cell ${id}`);
for (const [id, [x, y]] of Object.entries(art.hands)) {
  const c = data.cells.find((c) => c.id === id);
  assert(image.at(c.x + x, c.y + y)[3] === 255, `Empty grip ${id}`);
}
const pole = decodePng(fs.readFileSync("public/zhaoyun-spear.png"));
let visible = 0,
  transparent = 0,
  partial = 0,
  bad = 0;
for (let y = 0; y < pole.height; y++)
  for (let x = 0; x < pole.width; x++) {
    const [r, g, b, a] = pole.at(x, y);
    if (a === 0) {
      transparent++;
      if (r || g || b) bad++;
    } else visible++;
    if (a !== 0 && a !== 255) partial++;
  }
assert(visible && transparent && !partial && !bad);
assert(
  art.animations.Walk === "not-created" &&
    art.animations["Poke Mid"] === "not-created",
);
const result = {
  ok: true,
  phase: art.phase,
  artApproval: "pending user review",
  official: report,
  requiredStaticCells: used,
  requiredStaticCellsComplete: true,
  newGrips: Object.keys(art.hands).length,
  weapon: {
    width: pole.width,
    height: pole.height,
    visible,
    transparent,
    partialAlpha: partial,
    coloredTransparentPixels: bad,
  },
  animations: art.animations,
};
fs.writeFileSync(
  "docs/sheet-check.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `PASS: ${used.length} required static cells, ${Object.keys(art.hands).length} measured grips, transparent independent spear. Art approval pending.`,
);
