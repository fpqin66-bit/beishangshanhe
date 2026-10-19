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
async function enter(page: any) {
  await page.goto("/?mode=3d&zone=4");
  const g = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(g.locator("canvas")).toHaveAttribute(
    "data-position",
    "0.000,2.950,-37.650",
    { timeout: 30000 },
  );
  await expect(g.locator(".gallery-loading")).toHaveCount(0, {
    timeout: 30000,
  });
  const help = g.getByRole("button", { name: "关闭操作说明" });
  if (await help.isVisible()) await help.click();
  return g;
}
test("mouse drag orbits the cabinet without lock, wheel changes FOV, dragging never opens details", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().includes("Shader Error"))
      errors.push(m.text());
  });
  const g = await enter(page);
  await expect(g.locator(".island-item-label")).toHaveCount(12);
  await page.screenshot({ path: "/tmp/standalone-display.png" });
  const c = g.locator("canvas"),
    before = await c.getAttribute("data-position"),
    box = (await c.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.42);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45, {
    steps: 12,
  });
  await page.mouse.up();
  await expect.poll(() => c.getAttribute("data-position")).not.toBe(before);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const fov = Number(await c.getAttribute("data-fov"));
  await page.mouse.wheel(0, -300);
  await expect
    .poll(async () => Number(await c.getAttribute("data-fov")))
    .toBeLessThan(fov);
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
test("glass does not block product hover or click", async ({ page }) => {
  const g = await enter(page);
  const xy = await g
    .locator("canvas")
    .evaluate(async (canvas: HTMLCanvasElement) => {
      const { PerspectiveCamera, Vector3 } =
        await import("/node_modules/three/build/three.module.js");
      const rect = canvas.getBoundingClientRect();
      const camera = new PerspectiveCamera(
        Number(canvas.dataset.fov),
        rect.width / rect.height,
        0.08,
        65,
      );
      camera.position.fromArray(
        canvas.dataset.position!.split(",").map(Number),
      );
      camera.quaternion.fromArray(canvas.dataset.view!.split(",").map(Number));
      camera.updateMatrixWorld();
      const p = new Vector3(-0.94, 1.0, -40.65).project(camera);
      return {
        x: rect.x + ((p.x + 1) * rect.width) / 2,
        y: rect.y + ((1 - p.y) * rect.height) / 2,
      };
    });
  await page.mouse.move(xy.x, xy.y);
  await expect(
    g.getByRole("button", { name: "查看文创：花语随行杯", exact: true }),
  ).toHaveClass(/is-hovered/);
  await page.mouse.click(xy.x, xy.y);
  await expect(
    page.getByRole("dialog").locator(".wenchuang-copy h3"),
  ).toHaveText("花语随行杯");
  await page.keyboard.press("Escape");
  await expect(g).toBeVisible();
});
test("WASD still moves when preview refuses pointer lock", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error("preview blocks lock"));
  });
  const g = await enter(page);
  await g.getByRole("button", { name: "开始WASD漫游" }).click();
  await expect(g.getByRole("button", { name: "停止WASD漫游" })).toBeVisible();
  const c = g.locator("canvas");
  const initial = await c.getAttribute("data-position");
  await page.keyboard.down("a");
  await expect.poll(() => c.getAttribute("data-position")).not.toBe(initial);
  await page.keyboard.up("a");
  await expect
    .poll(async () =>
      Number((await c.getAttribute("data-position"))!.split(",")[1]),
    )
    .toBe(1.6);
  await page.keyboard.press("Escape");
  await expect(g.getByRole("button", { name: "开始WASD漫游" })).toBeVisible();
});

test("standalone cabinet preview opens the cabinet directly offline", async ({
  page,
}) => {
  await page.context().setOffline(true);
  await page.setContent(
    fs.readFileSync("dist/背上的山河-3D展柜预览.html", "utf8"),
  );
  const gallery = page.getByRole("region", { name: "第一人称3D展厅" });
  await expect(gallery).toBeVisible();
  await expect(gallery.locator("canvas")).toHaveAttribute(
    "data-position",
    "0.000,2.950,-37.650",
    { timeout: 30000 },
  );
  await expect(
    gallery.getByRole("button", { name: "关闭操作说明" }),
  ).toHaveCount(0);
  await expect(gallery.locator(".island-item-label")).toHaveCount(12);
});
