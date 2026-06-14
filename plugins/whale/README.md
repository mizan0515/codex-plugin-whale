# Whale Codex Plugin

Control NAVER Whale from Codex through a public, local plugin bundle.

This plugin is modeled on the user-facing shape of the bundled Chrome plugin: it provides a browser-control skill, a local MCP server, packaged documentation, setup/troubleshooting guidance, and examples. The implementation is public-source friendly and does not copy OpenAI's proprietary Chrome extension host. It uses the Chromium DevTools Protocol exposed by Whale when Whale is started with remote debugging.

## What It Provides

- Detect common NAVER Whale executable locations on Windows, macOS, and Linux.
- Launch Whale with `--remote-debugging-port` and an isolated default user-data directory.
- Connect to an already debug-enabled Whale instance.
- List tabs, open tabs, navigate, read page text, run JavaScript, click coordinates, type text, and capture screenshots through CDP.
- Exercise Whale-specific targets: `whale-sidebar`, `whale-space`, `whale-mobile`, and `web-app`.
- Probe the page for `window.whale`, `window.chrome`, user agent, and extension namespace availability.
- Validate and scaffold Whale MV3 extensions, including `sidebar_action` samples.
- Document Whale extension APIs, compatibility notes, manifest keys, sidebarAction methods/events, and public review requirements.

## Important Limit

Whale must be launched with remote debugging before Codex can control it through this public plugin. That is different from the bundled Chrome plugin's private extension bridge, which can interact with an installed Chrome extension host. For existing logged-in Whale sessions, start Whale yourself with remote debugging and only use a profile you intentionally want Codex to access.

## Quick Local Smoke Test

```powershell
node .\scripts\whale.mjs detect
node .\scripts\whale.mjs launch --port 9223 --load-extension .\samples\whale-sidebar-extension --disable-extensions-except .\samples\whale-sidebar-extension
node .\scripts\whale.mjs new-page --url https://developers.whale.naver.com/api/
node .\scripts\whale.mjs list
node .\scripts\whale.mjs sidebar-show --extension-name "Whale Sidebar Codex Sample"
```

## Plugin Contents

- `.codex-plugin/plugin.json`: Codex plugin manifest.
- `.mcp.json`: Local MCP server registration.
- `skills/control-whale/SKILL.md`: Runtime instructions Codex follows when `@whale` or Whale control is requested.
- `mcp/server.bundle.mjs`: Dependency-free stdio MCP server.
- `scripts/whale-client.mjs`: CDP client and Whale process helpers.
- `scripts/whale.mjs`: Command-line wrapper for smoke testing.
- `scripts/validate-whale-plugin.mjs`: Local bundle validation.
- `docs/`: Whale API map, control guide, safety, troubleshooting, and store checklist.
- `samples/whale-sidebar-extension/`: MV3 sidebar extension sample using Whale-specific APIs.

## Sources

- NAVER Whale browser API: https://developers.whale.naver.com/api/
- NAVER Whale developer docs repository: https://github.com/naver/whale-browser-developers
- Chrome extension API reference for shared Chromium APIs: https://developer.chrome.com/docs/extensions/reference/api

## Brand Assets

Plugin icons and the sample extension icons are derived from the official NAVER Whale application images installed with NAVER Whale for Windows:

- `VisualElements/Logo.png`
- `VisualElements/SmallLogo.png`

NAVER Whale names, logos, and related marks belong to NAVER or their respective rights holders. This plugin is an independent Codex integration and is not an official NAVER product unless NAVER publishes it.
