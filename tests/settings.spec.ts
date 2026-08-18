import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "diagadmin@test.local");
  await page.fill('input[type="password"]', "Diag1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/**", { timeout: 20000 });
}

test.describe("CMS settings — ekstraksi konten AI", () => {
  test("tab Sejarah menampilkan ekstraktor upload dokumen/gambar", async ({ page }) => {
    await login(page);
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Sejarah/ }).first().click();
    await expect(page.getByText("Buat Timeline Otomatis")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Ekstrak dengan AI/ })).toBeVisible();
    await expect(page.getByText("Terapkan ke form", { exact: true })).toBeHidden();
  });

  test("tab Filosofi Logo & Sekolah juga punya ekstraktor", async ({ page }) => {
    await login(page);
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Filosofi Logo/ }).first().click();
    await expect(page.getByText("Buat Makna Logo dengan AI")).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /Sekolah/ }).first().click();
    await expect(page.getByText("Buat Kartu Sekolah dengan AI")).toBeVisible({ timeout: 15000 });
  });

  test("file format tidak didukung → pesan error tanpa panggil AI", async ({ page }) => {
    await login(page);
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Sejarah/ }).first().click();
    await expect(page.getByText("Buat Timeline Otomatis")).toBeVisible({ timeout: 15000 });

    await page.setInputFiles(
      'input[type="file"]',
      { name: "arsip.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ....") }
    );
    await page.getByRole("button", { name: /Ekstrak dengan AI/ }).click();
    await expect(page.getByText(/Format tidak didukung/)).toBeVisible({ timeout: 20000 });
  });

  test("daftar anggota publik tidak lagi menampilkan kolom divisi", async ({ page }) => {
    await page.goto("/pengurus", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Daftar Anggota Satria Cengkara")).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Divisi");
  });
});