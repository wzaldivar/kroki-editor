import { defineConfig } from "@playwright/test";

// The deployed self-hosted stack: kroki-editor (fork build) in front of
// the local Kroki gateway. See ~/work/services/kroki/docker-compose.yml.
const BASE_URL = process.env.KROKI_EDITOR_URL ?? "http://localhost:44812";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // Unset = bundled Chromium (reproducible). Set to "chrome" to use the
    // system Google Chrome instead: KROKI_EDITOR_BROWSER_CHANNEL=chrome.
    channel: process.env.KROKI_EDITOR_BROWSER_CHANNEL as "chrome" | undefined,
  },
});
