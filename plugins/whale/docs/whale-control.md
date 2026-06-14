# Whale Control Guide

This plugin controls NAVER Whale through Chromium DevTools Protocol (CDP). CDP is available only when Whale is started with `--remote-debugging-port=<port>`.

## Default Port

The plugin defaults to port `9223` to avoid colliding with common Chrome debugging sessions on `9222`.

## Detect Whale

```powershell
node .\scripts\whale.mjs detect
```

The detector checks common install paths and common browser data roots. It does not read cookies, saved login data, local storage, or session stores.

## Launch Isolated Whale

```powershell
node .\scripts\whale.mjs launch --port 9223
```

By default this uses a temporary profile under the operating system temp directory. This is the safest default because it avoids exposing the user's normal browsing state.

## Use Existing Logged-In State

Only use an existing profile when the user explicitly asks for it. Start Whale with a selected `--user-data-dir` and the debugging port:

```powershell
node .\scripts\whale.mjs launch --port 9223 --user-data-dir "<intended-data-dir>"
```

This can expose logged-in sites to Codex. Confirm the exact profile choice before using it.

## Common Commands

```powershell
node .\scripts\whale.mjs list --port 9223
node .\scripts\whale.mjs new-page --port 9223 --url https://developers.whale.naver.com/api/
node .\scripts\whale.mjs read-text --port 9223 --target <targetId>
node .\scripts\whale.mjs screenshot --port 9223 --target <targetId> --out .\artifacts\whale.png
node .\scripts\whale.mjs eval --port 9223 --target <targetId> --expression "document.title"
```

## Load And Show The Sample Sidebar Extension

```powershell
node .\scripts\whale.mjs launch --port 9223 --load-extension .\samples\whale-sidebar-extension --disable-extensions-except .\samples\whale-sidebar-extension
node .\scripts\whale.mjs new-page --port 9223 --url chrome://version/
node .\scripts\whale.mjs sidebar-show --port 9223 --extension-name "Whale Sidebar Codex Sample"
```

The `sidebar-show` command calls `whale.sidebarAction.show()` from the extension context and reports `lastError`. A successful result has `showCalled: true` and `lastError: null`.

## Special Whale Targets

Whale supports browser-specific window targets through link `rel` values and through the third argument of `window.open()`:

- `whale-sidebar`
- `whale-space`
- `whale-mobile`
- `web-app`

Use:

```powershell
node .\scripts\whale.mjs open-special --port 9223 --target <targetId> --url https://m.naver.com/ --kind whale-mobile
```

## Equivalence To Chrome-Style Browser Tasks

This public plugin covers the practical browser-control workflows expected from a Chromium browser plugin:

- launch/connect
- list tabs
- open/navigate tabs
- read URL/title/text
- evaluate page JavaScript
- click/type
- capture screenshots
- inspect console/runtime errors through CDP evaluation results
- exercise browser-specific extension/web APIs

It does not claim private extension-bridge parity with the bundled Chrome plugin. Without a privileged installed bridge, CDP cannot attach to an arbitrary already-running normal Whale profile. Use debug-enabled Whale only.
