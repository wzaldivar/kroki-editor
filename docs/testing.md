# E2E testing

Playwright (TypeScript, bun) tests for the fork's editor build,
exercising the deployed stack: `kroki-editor` (fork-fix build, port
44812) rendering through the local Kroki gateway (port 44053).

## Prerequisites

- The stack must be running (see `~/work/services/kroki/`): the editor
  must be the fork build (`kroki-editor:fork-fix`) — the theme-fix
  assertions fail on the upstream image.
- `bun` (test tooling only; the app itself stays on pnpm).

## Run

```sh
mise run test-e2e                  # = cd e2e && bun run test
cd e2e && bun run test:headed      # watch it run in a real browser
```

Environment overrides:

| Variable | Default | Purpose |
|----------|---------|---------|
| `KROKI_EDITOR_URL` | `http://localhost:44812` | Editor under test |
| `KROKI_GATEWAY_URL` | `http://localhost:44053` | Expected render endpoint |
| `KROKI_EDITOR_BROWSER_CHANNEL` | bundled Chromium | Set to `chrome` for system Chrome |

## Coverage

| Test | Verifies |
|------|----------|
| Config points at local gateway | `__KROKI_CONFIG__.endpoint` ≠ kroki.io |
| Default diagram renders via gateway | PlantUML response from the local Kroki, preview visible |
| Theme toggle switches and persists | `data-theme` flips, `localStorage` updated |
| Toolbar select readable in both themes | Themed surface/text + WCAG AA contrast (fork fix) |
| Zoom controls readable, separator subtle | Overlay text color per theme; separator ≠ text color (upstream PR #3 regression) |
| Zoom controls work | Zoom in changes percent, reset restores 100% |
| Type switch re-renders | Mermaid response from the local gateway, new preview blob |

## How rendering is detected

- The preview fetches the diagram from the gateway and displays it via
  a `blob:` URL — the tests assert on the HTTP responses
  (`/plantuml/svg/`, `/mermaid/svg/`) rather than image URLs.
- Theme correctness is asserted via computed styles (background, color)
  and WCAG contrast ratios; the expected values come from
  `src/styles.css` (`--surface`, `--overlay-color`, `--overlay-border`).

## Findings (2026-09-07)

- Rendering through the local gateway is fast (~300 ms per test step).
- The blob-URL preview and the share-dialog-less theme flow are stable;
  the theme-fix assertions pass against the fork-fix build.
