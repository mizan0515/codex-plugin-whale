# Codex Plugin for NAVER Whale

Codex marketplace plugin for controlling and testing NAVER Whale from Codex.

This repository is a Codex plugin marketplace source. The plugin runs locally on the user's machine. It does not send browser-control traffic to this repository owner.

## Install

```powershell
codex plugin marketplace add https://github.com/mizan0515/codex-plugin-whale.git
codex plugin add whale@whale-codex
```

Start a new Codex thread after installation so the new skill and MCP tools are loaded.

## What It Does

- Detect common NAVER Whale executable paths.
- Launch Whale with a remote debugging port and an isolated data directory by default.
- List, open, navigate, read, click, type, and screenshot Whale tabs through Chromium DevTools Protocol.
- Load and validate Whale Manifest V3 extensions.
- Exercise Whale-specific browser surfaces such as sidebar, space, mobile window, and web-app link targets.
- Call `whale.sidebarAction.show()` from a loaded Whale extension context.
- Package Whale API notes, safety guidance, troubleshooting, and a sidebar extension sample.

## Quick Smoke Test

```powershell
$plugin = ".\plugins\whale"
$sample = Join-Path $plugin "samples\whale-sidebar-extension"
node "$plugin\scripts\whale.mjs" detect
node "$plugin\scripts\whale.mjs" launch --port 9223 --load-extension $sample --disable-extensions-except $sample
node "$plugin\scripts\whale.mjs" sidebar-show --port 9223 --extension-name "Whale Sidebar Codex Sample"
```

Successful sidebar output includes:

```json
{
  "showCalled": true,
  "lastError": null
}
```

## Repository Layout

```text
.agents/plugins/marketplace.json
plugins/whale/.codex-plugin/plugin.json
plugins/whale/.mcp.json
plugins/whale/skills/control-whale/SKILL.md
plugins/whale/scripts/
plugins/whale/mcp/
plugins/whale/docs/
plugins/whale/samples/whale-sidebar-extension/
```

## Safety

By default, the plugin launches Whale with a separate data directory. Do not point it at a personal browser data directory unless you intentionally want Codex to access that session. The plugin instructions prohibit inspecting cookies, saved login data, session stores, private keys, credentials, or browser storage databases.

## Trademark

NAVER Whale names, logos, and related marks belong to NAVER or their respective rights holders. This repository is an independent Codex integration and is not an official NAVER product unless NAVER publishes it.

The included plugin icons are derived from NAVER Whale application resources installed with NAVER Whale for Windows.

## Sources

- NAVER Whale browser API: https://developers.whale.naver.com/api/
- NAVER Whale website: https://whale.naver.com/
- Codex plugin documentation: https://developers.openai.com/codex/plugins/build
