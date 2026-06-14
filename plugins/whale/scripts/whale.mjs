#!/usr/bin/env node
import {
  DEFAULT_PORT,
  apiProbe,
  click,
  closePage,
  detectWhale,
  evaluate,
  getVersion,
  launchWhale,
  listPages,
  navigate,
  newPage,
  openSpecialTarget,
  readText,
  screenshot,
  typeText,
  validateExtensionManifest,
  waitForCdp,
  showSidebarAction,
} from "./whale-client.mjs";

const command = process.argv[2] ?? "help";
const args = parseArgs(process.argv.slice(3));

try {
  const result = await run(command, args);
  if (typeof result === "string") console.log(result);
  else console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function run(name, options) {
  const cdp = { port: Number(options.port ?? DEFAULT_PORT), host: options.host };
  switch (name) {
    case "help":
      return usage();
    case "detect":
      return detectWhale();
    case "launch": {
      const extraArgs = [];
      if (options["load-extension"]) extraArgs.push(`--load-extension=${options["load-extension"]}`);
      if (options["disable-extensions-except"]) extraArgs.push(`--disable-extensions-except=${options["disable-extensions-except"]}`);
      const launched = launchWhale({
        port: cdp.port,
        executable: options.executable,
        userDataDir: options["user-data-dir"],
        url: options.url,
        extraArgs,
      });
      await waitForCdp({ port: cdp.port, timeoutMs: Number(options.timeout ?? 10000) });
      return launched;
    }
    case "version":
      return getVersion(cdp);
    case "list":
      return listPages(cdp);
    case "new-page":
      return newPage(options.url ?? "about:blank", cdp);
    case "close":
      requireOption(options, "target");
      return closePage(options.target, cdp);
    case "navigate":
      requireOption(options, "target");
      requireOption(options, "url");
      return navigate(options.target, options.url, cdp);
    case "read-text":
      requireOption(options, "target");
      return readText(options.target, cdp);
    case "eval":
      requireOption(options, "target");
      requireOption(options, "expression");
      return evaluate(options.target, options.expression, cdp);
    case "click":
      requireOption(options, "target");
      requireOption(options, "x");
      requireOption(options, "y");
      return click(options.target, Number(options.x), Number(options.y), cdp);
    case "type":
      requireOption(options, "target");
      requireOption(options, "text");
      return typeText(options.target, options.text, cdp);
    case "screenshot":
      requireOption(options, "target");
      requireOption(options, "out");
      return screenshot(options.target, options.out, { ...cdp, fullPage: Boolean(options["full-page"]) });
    case "api-probe":
      requireOption(options, "target");
      return apiProbe(options.target, cdp);
    case "open-special":
      requireOption(options, "target");
      requireOption(options, "url");
      requireOption(options, "kind");
      return openSpecialTarget(options.target, options.url, options.kind, cdp);
    case "sidebar-show":
      return showSidebarAction(options["extension-name"] ?? "웨일 사이드바 Codex 샘플", { ...cdp, pagePath: options.page ?? "sidebar.html" });
    case "validate-extension":
      requireOption(options, "extension");
      return validateExtensionManifest(options.extension);
    default:
      throw new Error(`Unknown command: ${name}\n\n${usage()}`);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function requireOption(options, key) {
  if (options[key] === undefined || options[key] === "") throw new Error(`Missing required --${key}`);
}

function usage() {
  return `Whale Codex 플러그인 CLI

Commands:
  detect
  launch --port 9223 [--executable path] [--user-data-dir path] [--url url]
         [--load-extension path] [--disable-extensions-except path]
  version --port 9223
  list --port 9223
  new-page --port 9223 --url url
  close --port 9223 --target targetId
  navigate --port 9223 --target targetId --url url
  read-text --port 9223 --target targetId
  eval --port 9223 --target targetId --expression "document.title"
  click --port 9223 --target targetId --x 100 --y 200
  type --port 9223 --target targetId --text "hello"
  screenshot --port 9223 --target targetId --out .\\whale.png [--full-page]
  api-probe --port 9223 --target targetId
  open-special --port 9223 --target targetId --url url --kind whale-sidebar|whale-space|whale-mobile|web-app
  sidebar-show --port 9223 [--extension-name "웨일 사이드바 Codex 샘플"] [--page sidebar.html]
  validate-extension --extension path
`;
}
