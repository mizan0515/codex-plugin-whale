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
  process.exitCode = 0;
} else {
  const previous = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  const diff = compareSnapshots(previous, current);
  if (diff.changed.length === 0 && diff.added.length === 0 && diff.removed.length === 0) {
    console.log(`Whale API docs unchanged. Pages checked: ${current.pages.length}`);
    process.exitCode = 0;
  } else {
    const report = renderReport(previous, current, diff);
    writeFileSync(outputPath, report, "utf8");
    console.error(report);
    process.exitCode = 2;
  }
}

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
      "user-agent": "codex-plugin-whale-doc-monitor/0.1.3 (+https://github.com/mizan0515/codex-plugin-whale)",
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
    "# NAVER Whale API 문서 변경 감지",
    "",
    "커밋된 snapshot과 비교했을 때 NAVER Whale 개발자 API 문서가 바뀌었습니다.",
    "",
    `이전 snapshot: ${previous.generatedAt}`,
    `현재 확인: ${current.generatedAt}`,
    "",
    "## 변경된 페이지",
    ...formatPages(diff.changed),
    "",
    "## 추가된 페이지",
    ...formatPages(diff.added),
    "",
    "## 제거된 페이지",
    ...formatPages(diff.removed),
    "",
    "## Codex 처리 항목",
    "",
    "1. 변경된 NAVER Whale 문서 페이지를 읽습니다.",
    "2. 필요한 경우 `plugins/whale/docs/whale-api.md`, skill, script 동작을 갱신합니다.",
    "3. 검토 후 `node scripts/check-whale-docs.mjs --update`를 실행해 snapshot을 갱신합니다.",
    "4. 플러그인 검증을 실행하고 새 release를 게시합니다.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function formatPages(pages) {
  if (pages.length === 0) return ["- 없음"];
  return pages.map((page) => `- ${page.url} (${page.title || "제목 없음"})`);
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
