#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SNAPSHOT_PATH = resolve("docs/whale-api-source-snapshot.json");
const DEFAULT_OUTPUT = resolve("whale-docs-change.md");
const SEED_URLS = ["https://developers.whale.naver.com/api/"];
const MAX_PAGES = 80;

const args = new Set(process.argv.slice(2));
const update = args.has("--update");
const check = args.has("--check") || !update;
const outputPath = readOption("--output") ?? DEFAULT_OUTPUT;

const current = await crawlWhaleApiDocs();
if (update) {
  writeJson(SNAPSHOT_PATH, current);
  console.log(`Updated Whale API docs snapshot: ${SNAPSHOT_PATH}`);
  console.log(`Pages: ${current.pages.length}`);
  process.exit(0);
}

const previous = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
const diff = compareSnapshots(previous, current);
if (diff.changed.length === 0 && diff.added.length === 0 && diff.removed.length === 0) {
  console.log(`Whale API docs unchanged. Pages checked: ${current.pages.length}`);
  process.exit(0);
}

const report = renderReport(previous, current, diff);
writeFileSync(outputPath, report, "utf8");
console.error(report);
process.exit(2);

async function crawlWhaleApiDocs() {
  const queue = [...SEED_URLS];
  const seen = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const url = normalizeUrl(queue.shift());
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const html = await fetchText(url);
    const text = normalizeHtml(html);
    const hash = sha256(text);
    pages.push({
      url,
      title: extractTitle(html),
      hash,
      textLength: text.length,
    });

    for (const href of extractLinks(html, url)) {
      const next = normalizeUrl(href);
      if (next && !seen.has(next) && next.startsWith("https://developers.whale.naver.com/api/")) {
        queue.push(next);
      }
    }
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));
  return {
    generatedAt: new Date().toISOString(),
    source: "NAVER Whale developer API docs",
    seedUrls: SEED_URLS,
    pages,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "codex-plugin-whale-doc-monitor/0.1 (+https://github.com/mizan0515/codex-plugin-whale)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.text();
}

function normalizeHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(html, baseUrl) {
  const links = [];
  const pattern = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    try {
      links.push(new URL(match[1], baseUrl).href);
    } catch {
      // Ignore malformed hrefs from source HTML.
    }
  }
  return links;
}

function normalizeUrl(raw) {
  try {
    const url = new URL(raw);
    if (url.hostname !== "developers.whale.naver.com") return null;
    if (!url.pathname.startsWith("/api/")) return null;
    url.hash = "";
    url.search = "";
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    return url.href;
  } catch {
    return null;
  }
}

function extractTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? normalizeHtml(match[1]) : "";
}

function compareSnapshots(previous, current) {
  const previousByUrl = new Map(previous.pages.map((page) => [page.url, page]));
  const currentByUrl = new Map(current.pages.map((page) => [page.url, page]));
  const added = current.pages.filter((page) => !previousByUrl.has(page.url));
  const removed = previous.pages.filter((page) => !currentByUrl.has(page.url));
  const changed = current.pages.filter((page) => {
    const old = previousByUrl.get(page.url);
    return old && old.hash !== page.hash;
  });
  return { added, removed, changed };
}

function renderReport(previous, current, diff) {
  const lines = [
    "# Whale API docs changed",
    "",
    "NAVER Whale developer API docs changed compared with the committed snapshot.",
    "",
    `Previous snapshot: ${previous.generatedAt}`,
    `Current check: ${current.generatedAt}`,
    "",
    "## Changed pages",
    ...formatPages(diff.changed),
    "",
    "## Added pages",
    ...formatPages(diff.added),
    "",
    "## Removed pages",
    ...formatPages(diff.removed),
    "",
    "## Required maintainer action",
    "",
    "1. Read the changed NAVER Whale docs pages.",
    "2. Update `plugins/whale/docs/whale-api.md` and related skill/script behavior if needed.",
    "3. Run `node scripts/check-whale-docs.mjs --update` after the docs have been reviewed.",
    "4. Run plugin validation and publish a new release.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function formatPages(pages) {
  if (pages.length === 0) return ["- None"];
  return pages.map((page) => `- ${page.url} (${page.title || "untitled"})`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}
