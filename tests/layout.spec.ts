import { test, expect, type Page } from "@playwright/test";

const WIDTHS = [320, 360, 390, 768, 1024, 1440];
const PUBLIC_PAGES = ["/", "/galeri", "/layanan", "/lomba", "/pengurus", "/saran", "/login"];
const ADMIN_PAGES = [
  "/admin/dashboard",
  "/admin/pengurus",
  "/admin/galeri",
  "/admin/lomba",
  "/admin/inventaris",
  "/admin/keuangan",
  "/admin/users",
];

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "diagadmin@test.local");
  await page.fill('input[type="password"]', "Diag1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/**", { timeout: 20000 }).catch(() => {});
}

async function checkPage(page: Page, errors: string[], path: string, w: number) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `overflow ${overflow}px ${path} @${w}`).toBeLessThanOrEqual(0);
  expect(errors, `errors ${path} @${w}: ${errors.join("; ")}`).toEqual([]);
}

test.describe("Regresi layout: no horizontal overflow, no broken resources, no JS errors", () => {
  for (const w of WIDTHS) {
    test(`semua halaman @${w}px`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: w, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });

      for (const p of PUBLIC_PAGES) {
        await checkPage(page, errors, p, w);
      }

      await login(page);
      for (const p of ADMIN_PAGES) {
        await checkPage(page, errors, p, w);
      }
    });
  }
});