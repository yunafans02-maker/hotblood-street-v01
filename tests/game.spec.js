import { test, expect } from "@playwright/test";
const boot = async (page) => {
  await page.goto("/?test");
  await page.waitForFunction(() => window.__game?.player);
};
const isolate = async (page) =>
  page.evaluate(() => {
    const s = window.__game;
    s.enemies.forEach((e) => {
      e.x = 1600;
      e.y = 260;
      e.cooldown = 100;
    });
  });
test("eight directions, normalized speed, bounds and Y ordering", async ({
  page,
}) => {
  await boot(page);
  await isolate(page);
  const vectors = [];
  for (const keys of [
    ["d"],
    ["a"],
    ["w"],
    ["s"],
    ["d", "w"],
    ["d", "s"],
    ["a", "w"],
    ["a", "s"],
  ]) {
    await page.evaluate(() => {
      const p = window.__game.player;
      p.x = 500;
      p.y = 340;
    });
    for (const k of keys) await page.keyboard.down(k);
    await page.waitForTimeout(180);
    for (const k of keys) await page.keyboard.up(k);
    const d = await page.evaluate(() => {
      const p = window.__game.player;
      return { dx: p.x - 500, dy: p.y - 340, depth: p.sprite.depth, y: p.y };
    });
    expect(Math.sign(d.dx)).toBe(
      keys.includes("d") ? 1 : keys.includes("a") ? -1 : 0,
    );
    expect(Math.sign(d.dy)).toBe(
      keys.includes("s") ? 1 : keys.includes("w") ? -1 : 0,
    );
    expect(d.depth).toBeCloseTo(d.y);
    vectors.push(Math.hypot(d.dx, d.dy));
  }
  expect(Math.max(...vectors) / Math.min(...vectors)).toBeLessThan(1.35);
  await page.keyboard.down("w");
  await page.waitForTimeout(800);
  await page.keyboard.up("w");
  expect(await page.evaluate(() => window.__game.player.y)).toBe(257);
  await page.evaluate(() => {
    window.__game.player.x = 1750;
  });
  await page.waitForTimeout(900);
  expect(
    await page.evaluate(() => window.__game.cameras.main.scrollX),
  ).toBeGreaterThan(700);
});
test("three-stage input combo, hit-once, facing and lane checks", async ({
  page,
}) => {
  await boot(page);
  await isolate(page);
  await page.evaluate(() => {
    const s = window.__game;
    const p = s.player,
      e = s.enemies[0];
    p.x = 400;
    p.y = 330;
    p.facing = 1;
    e.x = 438;
    e.y = 330;
    e.maxHp = e.hp = 200;
    e.cooldown = 100;
  });
  await page.keyboard.down("j");
  const seen = new Set();
  for (let i = 0; i < 32; i++) {
    seen.add(await page.evaluate(() => window.__game.player.combo));
    await page.waitForTimeout(45);
  }
  await page.keyboard.up("j");
  expect([...seen].sort()).toEqual([0, 1, 2]);
  expect(await page.evaluate(() => window.__game.enemies[0].hp)).toBeLessThan(
    200,
  );
  for (const [x, y] of [
    [365, 330],
    [438, 380],
  ]) {
    await page.evaluate(
      ([x, y]) => {
        const s = window.__game,
          p = s.player,
          e = s.enemies[0];
        p.x = 400;
        p.y = 330;
        p.facing = 1;
        p.lastCombo = -99;
        p.setState("idle");
        e.x = x;
        e.y = y;
        e.vx = 0;
        e.hp = 200;
        e.setState("idle");
      },
      [x, y],
    );
    await page.keyboard.press("j");
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => window.__game.enemies[0].hp)).toBe(200);
  }
});
test("enemy approaches, attacks; damage, down and rise states work", async ({
  page,
}) => {
  await boot(page);
  const initial = await page.evaluate(() => window.__game.enemies[0].x);
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => window.__game.enemies[0].x)).toBeLessThan(
    initial,
  );
  await page.waitForFunction(
    () => window.__game.player.hp < 120,
    {},
    { timeout: 10000 },
  );
  await page.evaluate(() => {
    const s = window.__game;
    s.enemies.forEach((e) => (e.cooldown = 100));
    s.player.invulnerable = 0;
    s.player.damage(1, 1, 15, true);
  });
  expect(await page.evaluate(() => window.__game.player.state)).toBe("down");
  await page.waitForFunction(() => window.__game.player.state === "rise");
  await page.waitForFunction(() => window.__game.player.state === "idle");
  const states = await page.evaluate(() => {
    const e = window.__game.enemies[0];
    e.invulnerable = 0;
    e.damage(1, 1, 15, true);
    return e.state;
  });
  expect(states).toBe("down");
  await page.waitForFunction(() => window.__game.enemies[0].state === "rise");
});
test("natural combat clears all five enemies; restart resets run and controls", async ({
  page,
}) => {
  await boot(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (let i = 0; i < 240; i++) {
    const info = await page.evaluate(() => {
      const s = window.__game,
        p = s.player;
      const e = s.enemies
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
      return {
        ended: s.ended,
        hp: p.hp,
        dx: e ? e.x - p.x : 0,
        dy: e ? e.y - p.y : 0,
      };
    });
    if (info.ended) break;
    for (const k of ["a", "d", "w", "s"]) await page.keyboard.up(k);
    if (Math.abs(info.dy) > 5)
      await page.keyboard.down(info.dy > 0 ? "s" : "w");
    if (Math.abs(info.dx) > 33)
      await page.keyboard.down(info.dx > 0 ? "d" : "a");
    else if (Math.abs(info.dx) > 5) {
      await page.keyboard.down(info.dx > 0 ? "d" : "a");
      await page.waitForTimeout(15);
      await page.keyboard.up(info.dx > 0 ? "d" : "a");
    }
    await page.keyboard.press("j");
    await page.waitForTimeout(125);
  }
  for (const k of ["a", "d", "w", "s"]) await page.keyboard.up(k);
  expect(
    await page.evaluate(() => ({
      kills: window.__game.kills,
      ended: window.__game.ended,
      hp: window.__game.player.hp,
    })),
  ).toMatchObject({ kills: 5, ended: true });
  await page.screenshot({ path: "artifacts/victory.png" });
  await page.waitForTimeout(100);
  await page.mouse.click(480, 322);
  await page.waitForFunction(() => !window.__game.ended);
  expect(
    await page.evaluate(() => ({
      hp: window.__game.player.hp,
      spawned: window.__game.spawned,
      enemies: window.__game.enemies.length,
      freeze: window.__game.freeze,
    })),
  ).toEqual({ hp: 120, spawned: 2, enemies: 2, freeze: 0 });
  expect(errors).toEqual([]);
});
test("defeat and repeated restart do not leak objects or touch pointers", async ({
  page,
}) => {
  await boot(page);
  const count = await page.evaluate(() => window.__game.children.length);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const p = window.__game.player;
      p.invulnerable = 0;
      p.damage(999, 1, 10, true);
    });
    await page.waitForFunction(() => window.__game.ended);
    await page.waitForTimeout(100);
    await page.mouse.click(480, 322);
    await page.waitForFunction(() => !window.__game.ended);
    expect(await page.evaluate(() => window.__game.children.length)).toBe(
      count,
    );
    expect(
      await page.evaluate(() => window.__game.input.manager.pointers.length),
    ).toBe(5);
  }
});
test("phone layouts, portrait pause, touch movement + attack and cancellation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await boot(page);
  await isolate(page);
  for (const [width, height] of [
    [844, 390],
    [667, 375],
    [932, 430],
  ]) {
    await page.setViewportSize({ width, height });
    // Phaser applies browser resize events on its next scale update.
    await expect
      .poll(async () => {
        const r = await page.locator("canvas").boundingBox();
        return (
          r.y >= 0 &&
          r.x >= 0 &&
          r.x + r.width <= width + 1 &&
          r.y + r.height <= height + 1
        );
      })
      .toBe(true);
    const rect = await page.locator("canvas").boundingBox();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
    expect(rect.y + rect.height).toBeLessThanOrEqual(height + 1);
    expect(rect.width / rect.height).toBeCloseTo(16 / 9);
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(550);
  const r = await page.locator("canvas").boundingBox();
  const point = (x, y) => ({
    x: r.x + (x / 960) * r.width,
    y: r.y + (y / 540) * r.height,
  });
  const client = await context.newCDPSession(page);
  const a = point(156, 419),
    b = point(850, 416);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, ...a },
      { id: 2, ...b },
    ],
  });
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => window.__game.player.x)).toBeGreaterThan(
    220,
  );
  expect(await page.evaluate(() => window.__game.player.state)).toBe("attack");
  await client.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await page.waitForTimeout(50);
  expect(
    await page.evaluate(() => ({
      x: window.__game.controls.x,
      held: window.__game.controls.held,
    })),
  ).toEqual({ x: 0, held: false });
  await page.screenshot({ path: "artifacts/phone-landscape.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#rotate")).toBeVisible();
  const before = await page.evaluate(() => window.__game.elapsed);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__game.elapsed)).toBe(before);
  await context.close();
});
