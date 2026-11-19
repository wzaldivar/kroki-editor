import type { Page } from "@playwright/test";

// The deployed fork build of kroki-editor (see
// ~/work/services/kroki/docker-compose.yml). Overridable for other
// environments.
export const BASE_URL = process.env.KROKI_EDITOR_URL ?? "http://localhost:44812";

// The local Kroki gateway the editor must render through (never the
// public kroki.io).
export const KROKI_GATEWAY = process.env.KROKI_GATEWAY_URL ?? "http://localhost:44053";

export async function openEditor(page: Page): Promise<void> {
  await page.goto(BASE_URL);
  await page.locator(".toolbar").waitFor({ state: "visible" });
}

// The preview image renders once the gateway returned the diagram.
export async function waitForPreview(page: Page): Promise<void> {
  await page.locator('.preview img[alt="diagram"]').waitFor({ state: "visible" });
}

export async function setTheme(page: Page, theme: "dark" | "light"): Promise<void> {
  // Ensure we are on the app origin (localStorage is unavailable on
  // about:blank).
  await page.goto(BASE_URL);
  await page.evaluate((t) => {
    localStorage.setItem("kroki-theme", t);
    location.reload();
  }, theme);
  await page.waitForFunction(
    (t) => document.documentElement.dataset.theme === t,
    theme,
  );
  await page.locator(".toolbar").waitFor({ state: "visible" });
}

export async function computedStyle(
  page: Page,
  selector: string,
  properties: string[],
): Promise<Record<string, string>> {
  return page.evaluate(
    ({ sel, props }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`element not found: ${sel}`);
      const s = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, s.getPropertyValue(p)]));
    },
    { sel: selector, props: properties },
  );
}

// --- color helpers (computed styles come back as rgb()/rgba()) ---

export function rgbValues(css: string): [number, number, number] {
  const m = css.match(/[\d.]+/g);
  if (!m) throw new Error(`cannot parse color: ${css}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
