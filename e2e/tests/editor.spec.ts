import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  KROKI_GATEWAY,
  computedStyle,
  contrast,
  openEditor,
  rgbValues,
  setTheme,
  waitForPreview,
} from "./helpers";

// Expected colors from the fork's theme fix (src/styles.css):
//   dark:  --surface #1e1e1e, text #e6e6e6, --overlay-border #3a3a3a
//   light: --surface #fff,   text #1a1a1a, --overlay-border #ddd
const EXPECTED = {
  dark: {
    selectBg: "rgb(30, 30, 30)",
    selectFg: "rgb(230, 230, 230)",
    zoomColor: "rgb(230, 230, 230)",
    sep: "rgb(58, 58, 58)",
  },
  light: {
    selectBg: "rgb(255, 255, 255)",
    selectFg: "rgb(26, 26, 26)",
    zoomColor: "rgb(26, 26, 26)",
    sep: "rgb(221, 221, 221)",
  },
} as const;

const THEMES = ["dark", "light"] as const;

test.describe("kroki-editor", () => {
  test("config points at the local Kroki gateway", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForFunction(() => (window as never as { __KROKI_CONFIG__?: { endpoint?: string } }).__KROKI_CONFIG__?.endpoint != null);
    const endpoint = await page.evaluate(
      () => (window as never as { __KROKI_CONFIG__: { endpoint: string } }).__KROKI_CONFIG__.endpoint,
    );
    expect(endpoint).toBe(KROKI_GATEWAY);
  });

  test("loads and renders the default diagram through the local gateway", async ({ page }) => {
    const render = page.waitForResponse(
      (r) => r.url().includes("/plantuml/svg/") && r.status() === 200,
    );
    await page.goto(BASE_URL);
    await render;
    await expect(page.locator('.preview img[alt="diagram"]')).toBeVisible();
    await expect(page.locator(".cm-editor")).toBeVisible();
  });

  test("theme toggle switches and persists", async ({ page }) => {
    await openEditor(page);
    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.locator('[data-act="theme"]').click();
    const after = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(after).not.toBe(before);
    const stored = await page.evaluate(() => localStorage.getItem("kroki-theme"));
    expect(stored).toBe(after);
  });

  test("toolbar select is readable in both themes (fork fix)", async ({ page }) => {
    for (const theme of THEMES) {
      await setTheme(page, theme);
      const style = await computedStyle(page, "header.toolbar select", [
        "background-color",
        "color",
      ]);
      const ratio = contrast(
        rgbValues(style.color),
        rgbValues(style["background-color"]),
      );
      // Regression: the old hardcoded #222 background made the select
      // unreadable in light mode. Expect the themed surface + text with
      // WCAG AA contrast.
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(style["background-color"]).toBe(EXPECTED[theme].selectBg);
      expect(style.color).toBe(EXPECTED[theme].selectFg);
    }
  });

  test("zoom controls readable in both themes, separator stays subtle (fork fix)", async ({
    page,
  }) => {
    for (const theme of THEMES) {
      await setTheme(page, theme);
      await waitForPreview(page);
      const zoom = await computedStyle(page, ".zoom-controls", ["color"]);
      const sep = await computedStyle(page, ".zoom-controls .sep", [
        "background-color",
      ]);
      expect(zoom.color).toBe(EXPECTED[theme].zoomColor);
      // The separator must not reuse the text color (upstream PR #3
      // made it a bright line in dark mode) — it stays a subtle border.
      expect(sep["background-color"]).not.toBe(zoom.color);
      expect(sep["background-color"]).toBe(EXPECTED[theme].sep);
    }
  });

  test("zoom controls work", async ({ page }) => {
    await openEditor(page);
    await waitForPreview(page);
    const percent = page.locator(".zoom-controls .percent");
    await expect(percent).toHaveText("100%");

    await page.locator('.zoom-controls button[data-act="in"]').click();
    await expect(percent).not.toHaveText("100%");

    await page.locator('.zoom-controls button[data-act="reset"]').click();
    await expect(percent).toHaveText("100%");
  });

  test("switching diagram type re-renders through the gateway", async ({ page }) => {
    await openEditor(page);
    const mermaid = page.waitForResponse(
      (r) => r.url().includes("/mermaid/svg/") && r.status() === 200,
    );
    await page.locator("header.toolbar select").selectOption("mermaid");
    await mermaid;
    // The preview fetches the diagram and shows it via a blob URL.
    await expect(page.locator('.preview img[alt="diagram"]')).toHaveAttribute(
      "src",
      /^blob:/,
    );
  });
});
