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
test("central island items, JSON preview, switching, backdrop, editor and export", async ({
  page,
}) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  await g.getByRole("button", { name: "关闭操作说明" }).click();
  await g.getByRole("button", { name: "前往续 · 把祝福带走" }).click();
  await expect
    .poll(async () =>
      Number(
        (await g.locator("canvas").getAttribute("data-position"))!.split(
          ",",
        )[2],
      ),
    )
    .toBeCloseTo(-37.65, 1);
  await expect(g.locator(".island-item-label")).toHaveCount(12);
  await expect(
    g.locator(".gallery-plaque").filter({ hasText: "续 · 把祝福带走" }),
  ).toHaveCount(0);
  await page.screenshot({ path: "/tmp/island-gallery.png" });
  await g
    .getByRole("button", { name: "查看文创：花卉纹手机壳", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".wenchuang-copy h3")).toHaveText("花卉纹手机壳");
  await expect(dialog).toContainText("纹样原始出处与图像授权待核");
  await dialog.getByRole("button", { name: "下一件文创" }).click();
  await expect(dialog.locator(".wenchuang-copy h3")).toHaveText("锦绣花鸟抱枕");
  await dialog
    .getByRole("button", { name: "花背带娃娃挂件", exact: true })
    .click();
  await expect(dialog.locator(".wenchuang-copy h3")).toHaveText(
    "花背带娃娃挂件",
  );
  await page.screenshot({ path: "/tmp/island-preview.png" });
  await dialog.getByRole("button", { name: "创作我的数字祝福卡" }).click();
  await dialog.getByPlaceholder("写下你的祝福").fill("把心意带回家");
  await dialog.getByRole("button", { name: "靛青", exact: true }).click();
  await dialog.getByRole("button", { name: "山川", exact: true }).click();
  await dialog.getByRole("button", { name: "返回文创图录" }).click();
  await dialog.getByRole("button", { name: "创作我的数字祝福卡" }).click();
  await expect(dialog.getByPlaceholder("写下你的祝福")).toHaveValue(
    "把心意带回家",
  );
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "保存我的祝福卡" }).click();
  const bytes = fs.readFileSync((await (await download).path())!);
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
    1200, 1600,
  ]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await g.getByRole("button", { name: "浏览岛台文创" }).click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  await expect(g.locator("canvas")).toHaveAttribute(
    "data-position",
    /0.000,2.950,-37.650/,
  );
  expect(errors).toEqual([]);
});
test("island collision and smooth travel routes never cross cabinet", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { Vector3 } =
      await import("/node_modules/three/build/three.module.js");
    const { constrainPosition, galleryRoute } =
      await import("/src/components/FirstPersonGallery/navigation.ts");
    const { ISLAND_BOUNDS: b } =
      await import("/src/components/FirstPersonGallery/islandLayout.ts");
    const front = constrainPosition(
      new Vector3(0, 8, -40.5),
      new Vector3(0, 1.6, -39),
    );
    const back = constrainPosition(
      new Vector3(0, 1.6, b.minZ+.3),
      new Vector3(0, 1.6, -44.5),
    );
    const side = constrainPosition(
      new Vector3(1.6, 1.6, -41.8),
      new Vector3(2.8, 1.6, -41.8),
    );
    const start = new Vector3(0, 1.6, -44.5);
    const route = galleryRoute(start, new Vector3(2.65, 1.6, -37));
    let from = start,
      safe = true;
    for (const to of route) {
      for (let t = 0; t <= 1; t += 0.01) {
        const p = from.clone().lerp(to, t);
        if (p.x > b.minX && p.x < b.maxX && p.z > b.minZ && p.z < b.maxZ)
          safe = false;
      }
      from = to;
    }
    return {
      front: front.toArray(),
      back: back.toArray(),
      side: side.toArray(),
      bounds: b,
      safe,
      legs: route.length,
    };
  });
  expect(result.front[1]).toBe(1.6);
  expect(result.front[2]).toBe(result.bounds.maxZ);
  expect(result.back[2]).toBe(result.bounds.minZ);
  expect(result.side[0]).toBe(result.bounds.maxX);
  expect(result.safe).toBe(true);
  expect(result.legs).toBeGreaterThan(1);
});
test("product WebP textures and preview load from the referenced assets", async ({
  page,
}) => {
  await page.route("**/assets/patterns/*.webp", (route) =>
    route.fulfill({ path: "public/assets/image6.webp" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "进入3D沉浸式展厅" }).click();
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(g.locator(".island-item-label small")).toHaveCount(0);
  await g.getByRole("button", { name: "前往续 · 把祝福带走" }).click();
  await g.getByRole("button", { name: "浏览岛台文创" }).click();
  const dialog = page.getByRole("dialog");
  await expect
    .poll(() =>
      dialog
        .locator(".wenchuang-large-image img")
        .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await expect(dialog.locator(".wenchuang-large-image img")).toHaveAttribute(
    "src",
    /(?:data:image\/webp;base64,|assets\/wenchuan\/fanbudai1\.webp$)/,
  );
});
