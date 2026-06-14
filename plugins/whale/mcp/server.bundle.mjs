#!/usr/bin/env node
import {
  DEFAULT_PORT,
  apiProbe,
  click,
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
} from "../scripts/whale-client.mjs";

const tools = [
  {
    name: "whale_detect",
    description: "Detect common NAVER Whale executable paths and default plugin settings.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "whale_launch",
    description: "Launch NAVER Whale with a remote debugging port and an isolated user-data directory by default.",
    inputSchema: {
      type: "object",
      properties: {
        port: { type: "number", default: DEFAULT_PORT },
        executable: { type: "string" },
        userDataDir: { type: "string" },
        url: { type: "string" },
        loadExtension: { type: "string" },
        disableExtensionsExcept: { type: "string" },
        timeoutMs: { type: "number", default: 10000 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "whale_version",
    description: "Read the CDP /json/version metadata from a debug-enabled Whale instance.",
    inputSchema: portSchema(),
  },
  {
    name: "whale_list_pages",
    description: "List debug-visible Whale tabs/pages.",
    inputSchema: portSchema(),
  },
  {
    name: "whale_new_page",
    description: "Open a new Whale tab through CDP.",
    inputSchema: withPortSchema({ url: { type: "string", default: "about:blank" } }),
  },
  {
    name: "whale_navigate",
    description: "Navigate a Whale target to a URL.",
    inputSchema: withPortSchema({ target: { type: "string" }, url: { type: "string" } }, ["target", "url"]),
  },
  {
    name: "whale_read_text",
    description: "Read page title, URL, and visible text from a Whale target.",
    inputSchema: withPortSchema({ target: { type: "string" }, maxChars: { type: "number", default: 12000 } }, ["target"]),
  },
  {
    name: "whale_evaluate",
    description: "Evaluate JavaScript in a Whale target. Use for inspection, not for unsafe data extraction.",
    inputSchema: withPortSchema({ target: { type: "string" }, expression: { type: "string" } }, ["target", "expression"]),
  },
  {
    name: "whale_click",
    description: "Click viewport coordinates in a Whale target.",
    inputSchema: withPortSchema({ target: { type: "string" }, x: { type: "number" }, y: { type: "number" } }, ["target", "x", "y"]),
  },
  {
    name: "whale_type_text",
    description: "Type text into the currently focused element in a Whale target.",
    inputSchema: withPortSchema({ target: { type: "string" }, text: { type: "string" } }, ["target", "text"]),
  },
  {
    name: "whale_screenshot",
    description: "Save a PNG screenshot for a Whale target.",
    inputSchema: withPortSchema({ target: { type: "string" }, outFile: { type: "string" }, fullPage: { type: "boolean" } }, ["target", "outFile"]),
  },
  {
    name: "whale_open_special_target",
    description: "Open a URL using Whale-specific window target kind: whale-sidebar, whale-space, whale-mobile, or web-app.",
    inputSchema: withPortSchema({
      target: { type: "string" },
      url: { type: "string" },
      kind: { type: "string", enum: ["whale-sidebar", "whale-space", "whale-mobile", "web-app"] },
    }, ["target", "url", "kind"]),
  },
  {
    name: "whale_api_probe",
    description: "Probe a page for window.whale, window.chrome, user agent, and available namespace keys.",
    inputSchema: withPortSchema({ target: { type: "string" } }, ["target"]),
  },
  {
    name: "whale_sidebar_show",
    description: "Find a Whale extension by manifest name and call whale.sidebarAction.show() from its extension context.",
    inputSchema: withPortSchema({
      extensionName: { type: "string", default: "Whale Sidebar Codex Sample" },
      pagePath: { type: "string", default: "sidebar.html" },
    }),
  },
  {
    name: "whale_validate_extension",
    description: "Validate a Whale MV3 extension manifest for common Whale Store and sidebar_action issues.",
    inputSchema: {
      type: "object",
      properties: { extensionDir: { type: "string" } },
      required: ["extensionDir"],
      additionalProperties: false,
    },
  },
];

async function callTool(name, input) {
  const result = await dispatchTool(name, input);
  return {
    content: [
      {
        type: "text",
        text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function dispatchTool(name, input) {
  const cdp = { port: Number(input.port ?? DEFAULT_PORT), host: input.host };
  switch (name) {
    case "whale_detect":
      return detectWhale();
    case "whale_launch": {
      const extraArgs = [];
      if (input.loadExtension) extraArgs.push(`--load-extension=${input.loadExtension}`);
      if (input.disableExtensionsExcept) extraArgs.push(`--disable-extensions-except=${input.disableExtensionsExcept}`);
      const launched = launchWhale({ ...input, extraArgs });
      await waitForCdp({ port: Number(input.port ?? DEFAULT_PORT), timeoutMs: Number(input.timeoutMs ?? 10000) });
      return launched;
    }
    case "whale_version":
      return getVersion(cdp);
    case "whale_list_pages":
      return listPages(cdp);
    case "whale_new_page":
      return newPage(input.url ?? "about:blank", cdp);
    case "whale_navigate":
      return navigate(input.target, input.url, cdp);
    case "whale_read_text":
      return readText(input.target, { ...cdp, maxChars: input.maxChars });
    case "whale_evaluate":
      return evaluate(input.target, input.expression, cdp);
    case "whale_click":
      return click(input.target, input.x, input.y, cdp);
    case "whale_type_text":
      return typeText(input.target, input.text, cdp);
    case "whale_screenshot":
      return screenshot(input.target, input.outFile, { ...cdp, fullPage: input.fullPage });
    case "whale_open_special_target":
      return openSpecialTarget(input.target, input.url, input.kind, cdp);
    case "whale_api_probe":
      return apiProbe(input.target, cdp);
    case "whale_sidebar_show":
      return showSidebarAction(input.extensionName ?? "Whale Sidebar Codex Sample", { ...cdp, pagePath: input.pagePath ?? "sidebar.html" });
    case "whale_validate_extension":
      return validateExtensionManifest(input.extensionDir);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function portSchema() {
  return withPortSchema({});
}

function withPortSchema(properties, required = []) {
  return {
    type: "object",
    properties: {
      port: { type: "number", default: DEFAULT_PORT },
      host: { type: "string", default: "127.0.0.1" },
      ...properties,
    },
    required,
    additionalProperties: false,
  };
}

class JsonRpcStdioServer {
  constructor() {
    this.buffer = Buffer.alloc(0);
    this.onRequest = async () => ({});
  }

  start() {
    process.stdin.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.drain().catch((error) => this.writeError(null, error));
    });
  }

  async drain() {
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = this.buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) throw new Error("Missing Content-Length header");
      const length = Number(match[1]);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + length;
      if (this.buffer.length < messageEnd) return;
      const raw = this.buffer.slice(messageStart, messageEnd).toString("utf8");
      this.buffer = this.buffer.slice(messageEnd);
      const request = JSON.parse(raw);
      await this.handle(request);
    }
  }

  async handle(request) {
    if (!request.id) return;
    try {
      const result = await this.onRequest(request);
      this.write({ jsonrpc: "2.0", id: request.id, result });
    } catch (error) {
      this.writeError(request.id, error);
    }
  }

  writeError(id, error) {
    this.write({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error.message,
      },
    });
  }

  write(payload) {
    const body = JSON.stringify(payload);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
  }
}

const server = new JsonRpcStdioServer();
server.onRequest = async (request) => {
  if (request.method === "initialize") {
    return {
      protocolVersion: request.params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "whale", version: "0.1.1" },
    };
  }
  if (request.method === "tools/list") return { tools };
  if (request.method === "tools/call") return callTool(request.params?.name, request.params?.arguments ?? {});
  if (request.method === "ping") return {};
  return {};
};
server.start();
