import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

export const DEFAULT_PORT = 9223;
export const DEFAULT_HOST = "127.0.0.1";

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

export function candidateExecutables(environment = process["env"]) {
  const candidates = [];
  if (environment.WHALE_EXECUTABLE) candidates.push(environment.WHALE_EXECUTABLE);

  if (isWindows) {
    const localAppData = environment.LOCALAPPDATA;
    const programFiles = environment.ProgramFiles;
    const programFilesX86 = environment["ProgramFiles(x86)"];
    if (localAppData) candidates.push(join(localAppData, "Naver", "Naver Whale", "Application", "whale.exe"));
    if (programFiles) candidates.push(join(programFiles, "Naver", "Naver Whale", "Application", "whale.exe"));
    if (programFilesX86) candidates.push(join(programFilesX86, "Naver", "Naver Whale", "Application", "whale.exe"));
  } else if (isMac) {
    candidates.push("/Applications/Naver Whale.app/Contents/MacOS/Naver Whale");
    candidates.push("/Applications/Whale.app/Contents/MacOS/Whale");
  } else {
    candidates.push("/usr/bin/naver-whale");
    candidates.push("/usr/bin/whale");
    candidates.push("/opt/naver/whale/naver-whale");
  }

  return [...new Set(candidates)];
}

export function detectWhale() {
  const executableCandidates = candidateExecutables();
  const foundExecutables = executableCandidates.filter((candidate) => existsSync(candidate));
  return {
    platform: process.platform,
    found: foundExecutables.length > 0,
    executable: foundExecutables[0] ?? null,
    executableCandidates,
    defaultPort: DEFAULT_PORT,
    defaultUserDataDir: defaultUserDataDir(),
  };
}

export function defaultUserDataDir() {
  return join(tmpdir(), "codex-whale-profile");
}

export function launchWhale(options = {}) {
  const port = Number(options.port ?? DEFAULT_PORT);
  const executable = resolve(options.executable ?? detectWhale().executable ?? "");
  if (!executable || !existsSync(executable)) {
    throw new Error("NAVER Whale executable not found. Set WHALE_EXECUTABLE or pass --executable.");
  }

  const userDataDir = resolve(options.userDataDir ?? defaultUserDataDir());
  mkdirSync(userDataDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
  ];

  if (options.url) args.push(String(options.url));
  if (Array.isArray(options.extraArgs)) args.push(...options.extraArgs);

  const child = spawn(executable, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  return {
    executable,
    pid: child.pid,
    port,
    userDataDir,
    args,
  };
}

export async function waitForCdp(options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? 10000);
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      return await getVersion(options);
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }
  throw new Error(`Timed out waiting for Whale CDP endpoint: ${lastError?.message ?? "unknown error"}`);
}

export async function getVersion(options = {}) {
  return cdpHttpJson("/json/version", options);
}

export async function listPages(options = {}) {
  const pages = await cdpHttpJson("/json/list", options);
  return pages.map((page) => ({
    id: page.id,
    type: page.type,
    title: page.title,
    url: page.url,
    webSocketDebuggerUrl: page.webSocketDebuggerUrl,
  }));
}

export async function newPage(url = "about:blank", options = {}) {
  const encoded = encodeURIComponent(url);
  const page = await cdpHttpJson(`/json/new?${encoded}`, { ...options, method: "PUT" });
  return {
    id: page.id,
    type: page.type,
    title: page.title,
    url: page.url,
    webSocketDebuggerUrl: page.webSocketDebuggerUrl,
  };
}

export async function closePage(targetId, options = {}) {
  return cdpHttpText(`/json/close/${encodeURIComponent(targetId)}`, options);
}

export async function navigate(targetId, url, options = {}) {
  return withPageSession(targetId, options, async (session) => {
    await session.send("Page.enable");
    const result = await session.send("Page.navigate", { url });
    if (options.wait !== false) {
      await Promise.race([
        session.waitFor("Page.loadEventFired", Number(options.timeoutMs ?? 15000)),
        delay(Number(options.timeoutMs ?? 15000)),
      ]);
    }
    return result;
  });
}

export async function evaluate(targetId, expression, options = {}) {
  return withPageSession(targetId, options, async (session) => {
    await session.send("Runtime.enable");
    const result = await session.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: Boolean(options.userGesture),
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
    }
    return result.result?.value ?? result.result?.description ?? null;
  });
}

export async function readText(targetId, options = {}) {
  return evaluate(
    targetId,
    `(() => {
      const title = document.title;
      const url = location.href;
      const text = document.body ? document.body.innerText : "";
      return { title, url, text: text.slice(0, ${Number(options.maxChars ?? 12000)}) };
    })()`,
    options,
  );
}

export async function click(targetId, x, y, options = {}) {
  return withPageSession(targetId, options, async (session) => {
    await session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: Number(x),
      y: Number(y),
      button: "left",
      clickCount: 1,
    });
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: Number(x),
      y: Number(y),
      button: "left",
      clickCount: 1,
    });
    return { clicked: true, x: Number(x), y: Number(y) };
  });
}

export async function typeText(targetId, text, options = {}) {
  return withPageSession(targetId, options, async (session) => {
    for (const char of String(text)) {
      await session.send("Input.dispatchKeyEvent", { type: "char", text: char });
    }
    return { typed: String(text).length };
  });
}

export async function screenshot(targetId, outFile, options = {}) {
  const { writeFileSync } = await import("node:fs");
  return withPageSession(targetId, options, async (session) => {
    await session.send("Page.enable");
    const result = await session.send("Page.captureScreenshot", {
      format: options.format ?? "png",
      captureBeyondViewport: Boolean(options.fullPage),
    });
    writeFileSync(outFile, Buffer.from(result.data, "base64"));
    return { outFile: resolve(outFile), bytes: Buffer.byteLength(result.data, "base64") };
  });
}

export async function apiProbe(targetId, options = {}) {
  return evaluate(
    targetId,
    `(() => {
      const ownKeys = (value) => value ? Object.keys(value).sort() : [];
      return {
        url: location.href,
        title: document.title,
        userAgent: navigator.userAgent,
        hasWhaleNamespace: typeof window.whale !== "undefined",
        whaleKeys: ownKeys(window.whale),
        hasChromeNamespace: typeof window.chrome !== "undefined",
        chromeKeys: ownKeys(window.chrome),
      };
    })()`,
    options,
  );
}

export async function openSpecialTarget(targetId, url, kind, options = {}) {
  const allowed = new Set(["whale-sidebar", "whale-space", "whale-mobile", "web-app"]);
  if (!allowed.has(kind)) {
    throw new Error(`Unsupported Whale target kind: ${kind}`);
  }
  return evaluate(
    targetId,
    `window.open(${JSON.stringify(url)}, "_blank", ${JSON.stringify(kind)}); true`,
    { ...options, userGesture: true },
  );
}

export async function findExtensionTargetsByName(extensionName, options = {}) {
  const pages = await listPages(options);
  const matches = [];
  for (const page of pages.filter((candidate) => /^chrome-extension:\/\//.test(candidate.url ?? ""))) {
    try {
      const manifest = await evaluate(
        page.id,
        `(() => {
          const api = globalThis.whale ?? globalThis.chrome;
          return api?.runtime?.getManifest?.() ?? null;
        })()`,
        options,
      );
      if (manifest?.name === extensionName) matches.push({ page, manifest });
    } catch {
      // Not every extension target is an inspectable extension page.
    }
  }
  return matches;
}

export async function showSidebarAction(extensionName, options = {}) {
  const pagePath = options.pagePath ?? "sidebar.html";
  const targets = await findExtensionTargetsByName(extensionName, options);
  if (targets.length === 0) {
    throw new Error(`No debug-visible extension target found with manifest name: ${extensionName}`);
  }

  const target = targets[0];
  const result = await evaluate(
    target.page.id,
    `(async () => new Promise((resolve) => {
      const api = globalThis.whale ?? globalThis.chrome;
      const base = {
        extensionName: ${JSON.stringify(extensionName)},
        hasWhale: typeof globalThis.whale !== "undefined",
        hasChrome: typeof globalThis.chrome !== "undefined",
        hasSidebarAction: Boolean(api?.sidebarAction),
        methods: api?.sidebarAction ? Object.keys(api.sidebarAction).sort() : [],
      };
      if (!api?.sidebarAction?.show) {
        resolve({ ...base, showCalled: false, reason: "sidebarAction.show missing" });
        return;
      }
      try {
        api.sidebarAction.setTitle?.({ title: "Codex Whale Sidebar" });
        api.sidebarAction.setBadgeText?.({ text: "OK" });
        api.sidebarAction.setBadgeBackgroundColor?.({ color: "#05C3DD" });
        api.sidebarAction.show(undefined, { url: ${JSON.stringify(pagePath)}, reload: true }, () => {
          resolve({ ...base, showCalled: true, lastError: api.runtime?.lastError?.message ?? null });
        });
      } catch (error) {
        resolve({ ...base, showCalled: false, error: error.message });
      }
    }))()`,
    options,
  );

  return { target, result };
}

export async function validateExtensionManifest(extensionDir) {
  const { readFileSync } = await import("node:fs");
  const manifestPath = join(resolve(extensionDir), "manifest.json");
  const errors = [];
  const warnings = [];
  if (!existsSync(manifestPath)) {
    return { ok: false, errors: [`Missing manifest.json at ${manifestPath}`], warnings };
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`Invalid JSON: ${error.message}`], warnings };
  }

  if (manifest.manifest_version !== 3) errors.push("manifest_version must be 3 for Whale MV3 extensions.");
  for (const key of ["name", "version", "description"]) {
    if (!manifest[key]) errors.push(`Missing required store field: ${key}`);
  }
  if (!manifest.icons || Object.keys(manifest.icons).length === 0) errors.push("Missing icons; Whale Store requires extension icons.");
  if (manifest.action && manifest.sidebar_action) errors.push("Whale does not allow action and sidebar_action in the same manifest.");
  if (manifest.sidebar_action) {
    if (!manifest.sidebar_action.default_page) errors.push("sidebar_action.default_page is required.");
    if (/^https?:\/\//i.test(manifest.sidebar_action.default_page ?? "")) {
      errors.push("sidebar_action.default_page must be a local HTML file, not a remote URL.");
    }
    if (!manifest.sidebar_action.default_icon) errors.push("sidebar_action.default_icon is required.");
  }
  if (manifest.default_locale && !existsSync(join(resolve(extensionDir), "_locales", manifest.default_locale, "messages.json"))) {
    errors.push("default_locale is set but the matching _locales/<locale>/messages.json file is missing.");
  }
  if (manifest.permissions?.includes("debugger")) warnings.push("debugger permission is high-risk and should be justified for store review.");
  if (manifest.host_permissions?.includes("<all_urls>")) warnings.push("<all_urls> is broad; prefer optional_host_permissions if possible.");
  if (manifest.minimum_whale_version && typeof manifest.minimum_whale_version !== "string") {
    errors.push("minimum_whale_version must be a string.");
  }

  return { ok: errors.length === 0, errors, warnings, manifest };
}

async function cdpHttpJson(path, options = {}) {
  const text = await cdpHttpText(path, options);
  return JSON.parse(text);
}

async function cdpHttpText(path, options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = Number(options.port ?? DEFAULT_PORT);
  const method = options.method ?? "GET";
  const response = await fetch(`http://${host}:${port}${path}`, { method });
  if (!response.ok) throw new Error(`CDP HTTP ${method} ${path} failed: ${response.status} ${response.statusText}`);
  return response.text();
}

async function withPageSession(targetId, options, callback) {
  const pages = await listPages(options);
  const page = pages.find((candidate) => candidate.id === targetId || candidate.url === targetId);
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`No debug-visible Whale page found for target: ${targetId}`);
  }
  const session = await CdpSession.connect(page.webSocketDebuggerUrl);
  try {
    return await callback(session);
  } finally {
    session.close();
  }
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
    socket.addEventListener("message", (event) => this.onMessage(event));
    socket.addEventListener("error", (event) => {
      for (const { reject } of this.pending.values()) reject(new Error(`CDP socket error: ${event.message ?? "unknown"}`));
      this.pending.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolveConnect, rejectConnect) => {
      const timeout = setTimeout(() => rejectConnect(new Error("Timed out connecting to CDP WebSocket")), 10000);
      socket.addEventListener("open", () => {
        clearTimeout(timeout);
        resolveConnect();
      }, { once: true });
      socket.addEventListener("error", () => {
        clearTimeout(timeout);
        rejectConnect(new Error("Failed to connect to CDP WebSocket"));
      }, { once: true });
    });
    return new CdpSession(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = { id, method, params };
    const promise = new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
    });
    this.socket.send(JSON.stringify(payload));
    return promise;
  }

  waitFor(method, timeoutMs = 10000) {
    return new Promise((resolveWait, rejectWait) => {
      const timeout = setTimeout(() => {
        const waiters = this.eventWaiters.get(method) ?? [];
        this.eventWaiters.set(method, waiters.filter((entry) => entry.resolve !== resolveWait));
        rejectWait(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const waiters = this.eventWaiters.get(method) ?? [];
      waiters.push({
        resolve: (value) => {
          clearTimeout(timeout);
          resolveWait(value);
        },
      });
      this.eventWaiters.set(method, waiters);
    });
  }

  onMessage(event) {
    const data = JSON.parse(event.data);
    if (data.id && this.pending.has(data.id)) {
      const { resolve: resolvePending, reject } = this.pending.get(data.id);
      this.pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message ?? JSON.stringify(data.error)));
      else resolvePending(data.result ?? {});
      return;
    }
    if (data.method && this.eventWaiters.has(data.method)) {
      const [first, ...rest] = this.eventWaiters.get(data.method);
      this.eventWaiters.set(data.method, rest);
      first?.resolve(data.params ?? {});
    }
  }

  close() {
    this.socket.close();
  }
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}
