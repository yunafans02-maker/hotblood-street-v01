import { test, expect } from "@playwright/test";
const boot = async (p) => {
  await p.goto("/?test");
  await p.waitForFunction(() => window.__review);
};
test("eight original static assemblies reconstruct the native review sprites exactly", async ({
  page,
}) => {
  await boot(page);
  const results = await page.evaluate(async () => {
    const s = window.__review;
    const sheet = new Image();
    sheet.src = "/zhaoyun-sheet.png";
    await sheet.decode();
    const out = [];
    for (let v = 0; v < 8; v++) {
      s.setView(v);
      const pose = s.unit.player.pose,
        c = document.createElement("canvas");
      c.width = 32;
      c.height = 64;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      for (const t of pose.tiles.slice(0, pose.count)) {
        ctx.save();
        ctx.translate(16 + t.x + (t.flipX ? t.w : 0), 40 + t.y);
        ctx.scale(t.flipX ? -1 : 1, 1);
        ctx.drawImage(sheet, t.sx, t.sy, t.w, t.h, 0, 0, t.w, t.h);
        ctx.restore();
      }
      const img = new Image();
      img.src = `/review/view-${v}.png`;
      await img.decode();
      const b = document.createElement("canvas");
      b.width = 32;
      b.height = 64;
      const bx = b.getContext("2d");
      bx.drawImage(img, 0, 0);
      const a = ctx.getImageData(0, 0, 32, 64).data,
        z = bx.getImageData(0, 0, 32, 64).data;
      let different = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== z[i]) different++;
      const grip = s.unit.hand("last"),
        weapon = s.weapon.position
          .clone()
          .applyMatrix4(s.unit.group.matrixWorld);
      out.push({
        ...s.state(),
        different,
        drift: weapon.distanceTo(grip),
        cellCount: pose.count,
      });
    }
    return out;
  });
  for (let v = 0; v < 8; v++) {
    expect(results[v]).toMatchObject({
      view: v,
      animation: "Idle",
      different: 0,
      phase: "static-art-review",
    });
    expect(results[v].drift).toBeLessThan(0.0001);
    expect(results[v].cellCount).toBeLessThanOrEqual(6);
  }
});
test("pure white scene, no ground objects or shadows, and no later-stage animation controls", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  const values = await page.evaluate(() => {
    const s = window.__review;
    s.render();
    const gl = s.renderer.getContext(),
      px = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return {
      ...s.state(),
      pixel: [...px],
      background: getComputedStyle(document.querySelector("#viewport"))
        .backgroundColor,
      orthographic: s.camera.isOrthographicCamera,
    };
  });
  expect(values).toMatchObject({
    shadowMap: false,
    sceneChildren: 1,
    orthographic: true,
    background: "rgb(255, 255, 255)",
    pixel: [255, 255, 255, 255],
  });
  expect(
    await page.getByRole("button", { name: "行走", exact: true }).count(),
  ).toBe(0);
  expect(
    await page.getByRole("button", { name: "刺槍", exact: true }).count(),
  ).toBe(0);
  expect(errors).toEqual([]);
});
test("independent PNG exports have binary alpha, no floor and no clipped content; weapon is optional", async ({
  page,
}) => {
  await boot(page);
  const checks = await page.evaluate(() => {
    const s = window.__review,
      out = [];
    for (let v = 0; v < 8; v++)
      for (const weapon of [false, true]) {
        const c = s.exportPng(v, weapon),
          a = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let partial = 0,
          edge = 0,
          visible = 0,
          bad = 0;
        for (let i = 0; i < a.length; i += 4) {
          const x = (i / 4) % c.width,
            y = Math.floor(i / 4 / c.width);
          if (a[i + 3]) visible++;
          if (a[i + 3] !== 0 && a[i + 3] !== 255) partial++;
          if (
            a[i + 3] &&
            (x === 0 || y === 0 || x === c.width - 1 || y === c.height - 1)
          )
            edge++;
          if (!a[i + 3] && (a[i] || a[i + 1] || a[i + 2])) bad++;
        }
        out.push({ v, weapon, partial, edge, visible, bad });
      }
    return out;
  });
  for (const c of checks) {
    expect(c, JSON.stringify(c)).toMatchObject({ partial: 0, edge: 0, bad: 0 });
    expect(c.visible).toBeGreaterThan(500);
  }
  await page.getByRole("button", { name: "長槍：顯示" }).click();
  expect(await page.evaluate(() => window.__review.weapon.visible)).toBe(false);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 PNG/ }).click();
  expect((await download).suggestedFilename()).toContain("zhaoyun-static-");
});
test("phone controls operate in portrait and landscape without covering the character viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await boot(page);
  for (const [width, height] of [
    [390, 844],
    [375, 667],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(120);
    const geometry = await page.evaluate(() => ({
      a: document.querySelector("#viewport").getBoundingClientRect().toJSON(),
      b: document.querySelector(".controls").getBoundingClientRect().toJSON(),
      max: Math.max(
        ...[...document.querySelectorAll("button")].map(
          (b) => b.getBoundingClientRect().right,
        ),
      ),
      width: document.documentElement.clientWidth,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }));
    expect(
      geometry.a.bottom <= geometry.b.y + 1 ||
        geometry.a.right <= geometry.b.x + 1,
    ).toBe(true);
    expect(geometry.overflow).toBe(false);
    expect(geometry.max).toBeLessThanOrEqual(geometry.width + 1);
    await page.getByRole("button", { name: "背面", exact: true }).tap();
    expect(await page.evaluate(() => window.__review.state().view)).toBe(4);
    await page.getByRole("button", { name: "放大", exact: true }).tap();
    await page.getByRole("button", { name: "縮小", exact: true }).tap();
  }
  await page.screenshot({ path: "artifacts/static-phone-landscape.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: "左前斜角", exact: true }).tap();
  await page.getByRole("button", { name: "長槍：顯示" }).tap();
  await page.screenshot({ path: "artifacts/static-phone-art.png" });
  await context.close();
});
test("web delivery provides the named review assets, with no installation or test API on normal URL", async ({
  page,
}) => {
  const r = await page.goto("/");
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toContain("text/html");
  expect(r.headers()["content-disposition"] || "").not.toContain("attachment");
  await expect(page.locator("#loading")).toHaveCount(0);
  expect(await page.evaluate(() => window.__review)).toBeUndefined();
  for (const name of [
    "zhaoyun-sheet.png",
    "zhaoyun-spear.png",
    "zhaoyun-preview.png",
    "zhaoyun-four-view-comparison.png",
  ]) {
    const response = await page.request.get("/" + name);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }
});
