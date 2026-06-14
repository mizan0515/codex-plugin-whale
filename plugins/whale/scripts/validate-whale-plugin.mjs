#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateExtensionManifest } from "./whale-client.mjs";

const pluginRoot = resolve(process.argv[2] ?? ".");
const errors = [];

const requiredFiles = [
  ".codex-plugin/plugin.json",
  ".mcp.json",
  "README.md",
  "skills/control-whale/SKILL.md",
  "mcp/server.bundle.mjs",
  "scripts/whale-client.mjs",
  "scripts/whale.mjs",
  "docs/whale-api.md",
  "docs/whale-control.md",
  "docs/extension-store-checklist.md",
  "docs/safety.md",
  "docs/troubleshooting.md",
  "assets/whale-composer.png",
  "assets/whale-logo.png",
  "samples/whale-sidebar-extension/manifest.json",
];

for (const file of requiredFiles) {
  if (!existsSync(join(pluginRoot, file))) errors.push(`Missing required file: ${file}`);
}

const manifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.name !== "whale") errors.push("plugin.json name must be whale.");
  if (manifest.mcpServers !== "./.mcp.json") errors.push("plugin.json must reference ./.mcp.json.");
  if (!Array.isArray(manifest.interface?.defaultPrompt)) errors.push("interface.defaultPrompt must be an array.");
  for (const asset of [manifest.interface?.composerIcon, manifest.interface?.logo]) {
    if (asset && !existsSync(join(pluginRoot, asset))) errors.push(`Manifest asset missing: ${asset}`);
  }
}

const sampleValidation = await validateExtensionManifest(join(pluginRoot, "samples", "whale-sidebar-extension"));
if (!sampleValidation.ok) {
  errors.push(...sampleValidation.errors.map((error) => `Sample extension: ${error}`));
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: requiredFiles.length, sampleWarnings: sampleValidation.warnings }, null, 2));

