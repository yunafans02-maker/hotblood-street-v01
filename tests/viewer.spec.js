import { test, expect } from "@playwright/test";
const boot = async (page) => {
  await page.goto("/?test");
  await page.waitForFunction(() => window.__sprite);
};
test("orthographic original character, three animations and eight camera views keep spear on the new grip", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  for (const name of ["Idle", "Walk", "Poke Mid"])
    for (let view = 0; view < 8; view++)
      for (const tick of name === "Idle" ? [0] : [0, 12, 20, 34]) {
        const state = await page.evaluate(
          ({ name, view, tick }) => {
            const s = window.__sprite;
            s.setTime(100);
            s.play(name);
            s.setView(view);
            s.setTime(100 + tick / 60);
            const h = s.unit.hand("last");
            const w = s.spear.position
              .clone()
              .applyMatrix4(s.unit.group.matrixWorld);
            return { ...s.getState(), drift: w.distanceTo(h) };
          },
          { name, view, tick },
        );
        expect(state.animation).toBe(name);
        expect(state.view).toBe(view);
        expect(state.spearVisible).toBe(true);
        expect(state.orthographic).toBe(true);
        expect(state.drift).toBeLessThan(0.0001);
      }
  expect(errors).toEqual([]);
});
test("walk moves real body/arm frames; thrust uses Poke Mid and returns to idle", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "行走", exact: true }).click();
  const a = await page.evaluate(() => window.__sprite.getState().tiles);
  await page.waitForTimeout(250);
  const b = await page.evaluate(() => window.__sprite.getState().tiles);
  expect(a).not.toEqual(b);
  await page.getByRole("button", { name: /刺槍/ }).click();
  await expect(page.locator("#motion-status")).toHaveText("刺槍");
  await expect(page.locator("#motion-status")).toHaveText("站立", {
    timeout: 3000,
  });
  await page.getByRole("button", { name: "放大", exact: true }).click();
  expect(await page.evaluate(() => window.__sprite.getState().zoom)).toBe(4);
  await page.getByRole("button", { name: "縮小", exact: true }).click();
  expect(await page.evaluate(() => window.__sprite.getState().zoom)).toBe(3);
});
test("independent standing PNG and all animated native previews have only binary alpha and no cropped pixels", async ({
  page,
}) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const out = [];
    for (const name of ["Idle", "Walk", "Poke Mid"])
      for (let view = 0; view < 8; view++)
        for (const tick of name === "Idle" ? [0] : [0, 12, 20, 34]) {
          const image = new Image();
          image.src = window.__sprite.capture(name, view, tick);
          await image.decode();
          const c = document.createElement("canvas");
          c.width = c.height = 128;
          const ctx = c.getContext("2d");
          ctx.drawImage(image, 0, 0);
          const px = ctx.getImageData(0, 0, 128, 128).data;
          let partial = 0,
            edge = 0,
            coloredTransparent = 0,
            visible = 0;
          for (let i = 0; i < px.length; i += 4) {
            const x = (i / 4) % 128,
              y = Math.floor(i / 4 / 128);
            if (px[i + 3] !== 0 && px[i + 3] !== 255) partial++;
            if (px[i + 3] && (x === 0 || y === 0 || x === 127 || y === 127))
              edge++;
            if (!px[i + 3] && (px[i] || px[i + 1] || px[i + 2]))
              coloredTransparent++;
            if (px[i + 3]) visible++;
          }
          out.push({
            name,
            view,
            tick,
            partial,
            edge,
            coloredTransparent,
            visible,
          });
        }
    return out;
  });
  for (const r of result) {
    expect(r, JSON.stringify(r)).toMatchObject({
      partial: 0,
      edge: 0,
      coloredTransparent: 0,
    });
    expect(r.visible).toBeGreaterThan(250);
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出站立 PNG/ }).click();
  expect((await download).suggestedFilename()).toContain("zhaoyun-idle-view-");
});
test("phone portrait and landscape controls stay outside character canvas and operate by touch", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  for (const [width, height] of [
    [390, 844],
    [375, 667],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    const boxes = await page.evaluate(() => ({
      stage: document.querySelector(".stage").getBoundingClientRect().toJSON(),
      controls: document
        .querySelector(".controls")
        .getBoundingClientRect()
        .toJSON(),
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }));
    const a = boxes.stage,
      b = boxes.controls;
    expect(a.right <= b.x + 1 || a.bottom <= b.y + 1).toBe(true);
    expect(boxes.overflow).toBe(false);
    const right = await page.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll("button")].map(
          (b) => b.getBoundingClientRect().right,
        ),
      ),
    );
    expect(right).toBeLessThanOrEqual(width + 1);
    await page.getByRole("button", { name: "行走", exact: true }).tap();
    await expect(page.locator("#motion-status")).toHaveText("行走");
    await page.getByRole("button", { name: "觀察視角 5", exact: true }).tap();
    expect(await page.evaluate(() => window.__sprite.getState().view)).toBe(4);
  }
  await page.screenshot({ path: "artifacts/viewer-phone-landscape.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/viewer-phone-portrait.png" });
  expect(errors).toEqual([]);
  await context.close();
});
test("normal URL loads the web viewer with no testing interface or attachment response", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response.headers()["content-type"]).toContain("text/html");
  expect(response.headers()["content-disposition"] || "").not.toContain(
    "attachment",
  );
  await expect(page.locator("#loading")).toHaveCount(0);
  expect(await page.evaluate(() => window.__sprite)).toBeUndefined();
  for (const asset of ["/zhaoyun.png", "/spear.png", "/zhaoyun-idle.png"]) {
    const r = await page.request.get(asset);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
});
