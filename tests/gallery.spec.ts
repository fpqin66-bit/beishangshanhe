import { test, expect } from "@playwright/test";
import fs from "node:fs";
test.use({
  launchOptions: {
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
    ],
  },
});
test("3D five zones, missing SVG fallback, pattern quiz, card export, return to preserved 2D", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByPlaceholder("写下你的祝福").fill("二维状态保留");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const gallery = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator("canvas")).toHaveAttribute(
    "data-position",
    /1.600/,
    { timeout: 30000 },
  );
  await expect(gallery.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(gallery.locator(".gallery-resource-warning")).toContainText(
    "素材未就绪",
  );
  await page.getByRole("button", { name: "关闭操作说明" }).click();
  await page.screenshot({ path: "/tmp/gallery-desktop.png" });
  const nav = page.getByRole("navigation", { name: "3D展区跳转" });
  await nav.getByRole("button", { name: "前往纹 · 锦绣里的秘密" }).click();
  await expect
    .poll(async () =>
      Number(
        (await gallery.locator("canvas").getAttribute("data-position"))!.split(
          ",",
        )[2],
      ),
    )
    .toBeCloseTo(-17, 1);
  await gallery.getByRole("button", { name: "查看本区展品" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("花中有花");
  await dialog.getByRole("button", { name: "花卉", exact: true }).click();
  await expect(dialog.locator(".answer")).toContainText("观察得很仔细");
  await dialog.getByRole("button", { name: "怀中玉燕", exact: true }).click();
  await dialog.getByRole("button", { name: "鸟兽", exact: true }).click();
  await expect(dialog.locator(".answer")).toContainText("鸟兽");
  await expect(dialog).toContainText("verified: false");
  await page.keyboard.press("Escape");
  await nav.getByRole("button", { name: "前往续 · 把祝福带走" }).click();
  await gallery.getByRole("button", { name: "浏览岛台文创" }).click();
  await dialog.getByRole("button", { name: "创作我的数字祝福卡" }).click();
  await dialog.getByPlaceholder("写下你的祝福").fill("三维展厅祝福");
  const dl = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "保存我的祝福卡" }).click();
  const download = await dl;
  const bytes = fs.readFileSync((await download.path())!);
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
    1200, 1600,
  ]);
  await page.keyboard.press("Escape");
  await gallery.getByRole("button", { name: "返回叙事网页" }).click();
  await expect(page.getByPlaceholder("写下你的祝福")).toHaveValue(
    "二维状态保留",
  );
  await expect(page.locator("main section[id]")).toHaveCount(5);
  await expect(
    page.getByRole("button", { name: "进入3D沉浸式展厅" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("WASD moves, walls stop visitor, no vertical movement, unlock pauses", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  const start = g.getByRole("button", { name: "开始WASD漫游" });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(g.getByRole("button", { name: "解锁鼠标" })).toBeVisible();
  const position = async () =>
    (await g.locator("canvas").getAttribute("data-position"))!
      .split(",")
      .map(Number);
  await page.keyboard.down("w");
  await expect
    .poll(async () => (await position())[0], { timeout: 15000 })
    .toBeLessThan(-3.4);
  await page.keyboard.up("w");
  expect((await position())[0]).toBeGreaterThanOrEqual(-3.5);
  expect((await position())[1]).toBe(1.6);
  await page.keyboard.press("Space");
  await page.keyboard.press("r");
  expect((await position())[1]).toBe(1.6);
  const view = await g.locator("canvas").getAttribute("data-view");
  await page.mouse.move(400, 300);
  await expect
    .poll(() => g.locator("canvas").getAttribute("data-view"))
    .not.toBe(view);
  await page.keyboard.press("Escape");
  await expect(g.getByRole("button", { name: "开始WASD漫游" })).toBeVisible();
  const stopped = await position();
  await page.keyboard.down("w");
  await page.waitForTimeout(200);
  await page.keyboard.up("w");
  expect(await position()).toEqual(stopped);
});
test("mobile has point jumps only", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator("canvas")).toHaveAttribute("data-position", /1.600/, {
    timeout: 30000,
  });
  await expect(g.getByRole("button", { name: "开始WASD漫游" })).toHaveCount(0);
  await g.getByRole("button", { name: "关闭操作说明" }).click();
  await page
    .getByRole("navigation", { name: "3D展区跳转" })
    .getByRole("button", { name: "前往续 · 把祝福带走" })
    .click();
  await expect
    .poll(async () =>
      Number(
        (await g.locator("canvas").getAttribute("data-position"))!.split(
          ",",
        )[2],
      ),
    )
    .toBeCloseTo(-37.65, 1);
  await page.screenshot({ path: "/tmp/gallery-mobile.png" });
});
test("WebGL unavailable hides entrance and retains 2D", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "进入3D沉浸式展厅" }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("背上的");
});
test("SVG loader ignores white artboard, extrudes black fill and strokes without replacement assets", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const module =
      await import("/src/components/FirstPersonGallery/Relief.tsx");
    const a = module.createRelief(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><path d="M20 20H80V80H20Z" fill="black"/></svg>',
    );
    const b = module.createRelief(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L40 20L0 40" fill="none" stroke="black" stroke-width="2"/></svg>',
    );
    const mesh = a.children[0];
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const result = {
      draws: a.children.length,
      metal: mesh.material.metalness,
      width: box.max.x - box.min.x,
      depth: box.max.z - box.min.z,
      stroke: b.children.length,
    };
    module.disposeRelief(a);
    module.disposeRelief(b);
    return result;
  });
  expect(result.draws).toBe(1);
  expect(result.stroke).toBe(1);
  expect(result.width).toBeCloseTo(1.45);
  expect(result.depth).toBeCloseTo(0.035);
  expect(result.metal).toBe(0.75);
});
test("inline offline 3D and context loss fallback", async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().startsWith("http")) requests.push(r.url());
  });
  await page.context().setOffline(true);
  await page.setContent(
    fs.readFileSync("dist/背上的山河-独立展览.html", "utf8"),
  );
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator("canvas")).toHaveAttribute("data-position", /1.600/, {
    timeout: 30000,
  });
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  await g.getByRole("button", { name: "查看本区展品" }).click();
  await expect(page.getByRole("dialog")).toContainText("艺术化改编");
  await page.keyboard.press("Escape");
  await g
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) =>
      canvas
        .getContext("webgl2")!
        .getExtension("WEBGL_lose_context")!
        .loseContext(),
    );
  await expect(g).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "进入3D沉浸式展厅" }),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("背上的");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
test("SVG resource references create reliefs when files are supplied", async ({
  page,
}) => {
  await page.route("**/assets/textures/*.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><path d="M25 25H75V75H25Z" fill="black"/></svg>',
    }),
  );
  await page.route("**/assets/patterns/*.webp", (route) =>
    route.fulfill({ path: "public/assets/image6.webp" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator("canvas")).toHaveAttribute("data-position", /1.600/, {
    timeout: 30000,
  });
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(g.locator(".gallery-resource-warning")).toHaveCount(0);
  await expect(g.getByText("SVG 素材待提供")).toHaveCount(0);
});
