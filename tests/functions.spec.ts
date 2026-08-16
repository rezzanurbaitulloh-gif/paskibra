import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "diagadmin@test.local");
  await page.fill('input[type="password"]', "Diag1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/**", { timeout: 20000 });
}

test.describe("Smoke fungsional (bukti overhaul tidak merusak fungsi)", () => {
  test("login admin & dashboard render", async ({ page }) => {
    await login(page);
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("halaman dashboard menampilkan chart recharts (svg)", async ({ page }) => {
    await login(page);
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".recharts-wrapper")).toHaveCount(1, { timeout: 30000 });
  });

  test("galeri publik render tanpa error (konten atau empty state)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/galeri", { waitUntil: "domcontentloaded" });
    await expect(page.locator("div.min-h-screen").first()).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test("form saran publik bisa diisi & submit tanpa error", async ({ page }) => {
    await page.goto("/saran", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const inputs = await page.locator("form input, form textarea").count();
    expect(inputs).toBeGreaterThanOrEqual(2);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.locator("form input").first().fill("Penguji TDD");
    await page.locator("form textarea").first().fill("Test dari harness TDD tema Paskibra.");
    await page.locator("form button[type='submit']").first().click();
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test("beranda menampilkan logo.png & hero", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await expect(page.locator("img[src*='logo']").first()).toBeVisible();
    await expect(page.locator("main, section").first()).toBeVisible();
  });
});
