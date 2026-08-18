import { test, expect } from "@playwright/test";

const EXPECTED_LIGHT = {
  "--primary": "#010281",
  "--secondary": "#2191d0",
  "--accent": "#a16207",
  "--background": "#fafafa",
};

test.describe("Tema Paskibra (indigo dari logo #010281)", () => {
  test("token :root sesuai palet Paskibra di light mode", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        "--primary": s.getPropertyValue("--primary").trim(),
        "--secondary": s.getPropertyValue("--secondary").trim(),
        "--accent": s.getPropertyValue("--accent").trim(),
        "--background": s.getPropertyValue("--background").trim(),
        "--font-display": s.getPropertyValue("--font-display").trim(),
      };
    });
    expect(tokens["--primary"]).toBe(EXPECTED_LIGHT["--primary"]);
    expect(tokens["--secondary"]).toBe(EXPECTED_LIGHT["--secondary"]);
    expect(tokens["--accent"]).toBe(EXPECTED_LIGHT["--accent"]);
    expect(tokens["--background"]).toBe(EXPECTED_LIGHT["--background"]);
    expect(tokens["--font-display"]).toContain("Bebas Neue");
  });

  test("tema dark memakai navy & primary terang", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        "--background": s.getPropertyValue("--background").trim(),
        "--primary": s.getPropertyValue("--primary").trim(),
      };
    });
    expect(tokens["--background"]).toMatch(/^#070a18$/i);
    expect(tokens["--primary"]).toMatch(/^#6b7bff$/i);
  });

  test("kontras WCAG: teks & primary ≥ 4.5:1 (light & dark)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const lum = (hex: string) => {
      const c = hex.replace("#", "").match(/\w\w/g)!.map((h) => parseInt(h, 16) / 255).map((v) =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
      );
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => {
      const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    };
    const checks = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        primary: s.getPropertyValue("--primary").trim(),
        background: s.getPropertyValue("--background").trim(),
        foreground: s.getPropertyValue("--foreground").trim(),
      };
    });
    expect(ratio(checks.primary, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(checks.foreground, checks.background)).toBeGreaterThanOrEqual(4.5);

    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.reload();
    await page.waitForTimeout(1200);
    const dark = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        primary: s.getPropertyValue("--primary").trim(),
        background: s.getPropertyValue("--background").trim(),
        foreground: s.getPropertyValue("--foreground").trim(),
      };
    });
    expect(ratio(dark.primary, dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(dark.foreground, dark.background)).toBeGreaterThanOrEqual(4.5);
  });
});
