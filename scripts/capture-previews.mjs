import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
await mkdir("public/previews", { recursive: true });
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  await page.goto(process.env.PREVIEW_BASE || "http://127.0.0.1:5173/?test");
  await page.waitForFunction(() => window.__sprite);
  const shots = await page.evaluate(() => {
    const s = window.__sprite;
    const result = [];
    for (const name of ["Idle", "Walk", "Poke Mid"])
      for (let view = 0; view < 8; view++) {
        const ticks =
          name === "Idle"
            ? [0]
            : name === "Walk"
              ? [0, 10, 22, 38, 54]
              : [0, 12, 16, 20, 34];
        for (const tick of ticks)
          result.push({ name, view, tick, data: s.capture(name, view, tick) });
      }
    return result;
  });
  for (const shot of shots)
    await writeFile(
      `public/previews/${shot.name.replaceAll(" ", "-")}-${shot.view}-${shot.tick}.png`,
      Buffer.from(shot.data.split(",")[1], "base64"),
    );
  await writeFile(
    "public/zhaoyun-idle.png",
    Buffer.from(
      shots.find((s) => s.name === "Idle" && s.view === 1).data.split(",")[1],
      "base64",
    ),
  );
  await page.screenshot({ path: "artifacts/viewer-desktop.png" });
  console.log(
    `Captured ${shots.length} original composed poses, including independent standing PNG.`,
  );
} finally {
  await browser.close();
}
