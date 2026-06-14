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
    description: "일반적인 네이버 웨일 실행 파일 경로와 플러그인 기본 설정을 확인합니다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "whale_launch",
    description: "네이버 웨일을 원격 디버깅 포트와 기본 격리 사용자 데이터 폴더로 실행합니다.",
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
    description: "디버깅이 켜진 웨일 인스턴스의 CDP /json/version 메타데이터를 읽습니다.",
    inputSchema: portSchema(),
  },
  {
    name: "whale_list_pages",
    description: "디버깅 포트에서 보이는 웨일 탭과 페이지를 나열합니다.",
    inputSchema: portSchema(),
  },
  {
    name: "whale_new_page",
    description: "CDP로 새 웨일 탭을 엽니다.",
    inputSchema: withPortSchema({ url: { type: "string", default: "about:blank" } }),
  },
  {
    name: "whale_navigate",
    description: "웨일 target을 지정한 URL로 이동합니다.",
    inputSchema: withPortSchema({ target: { type: "string" }, url: { type: "string" } }, ["target", "url"]),
  },
  {
    name: "whale_read_text",
    description: "웨일 target의 페이지 제목, URL, 보이는 텍스트를 읽습니다.",
    inputSchema: withPortSchema({ target: { type: "string" }, maxChars: { type: "number", default: 12000 } }, ["target"]),
  },
  {
    name: "whale_evaluate",
    description: "웨일 target에서 JavaScript를 평가합니다. 검사용으로만 쓰고 민감 데이터 추출에는 쓰지 마세요.",
    inputSchema: withPortSchema({ target: { type: "string" }, expression: { type: "string" } }, ["target", "expression"]),
  },
  {
    name: "whale_click",
    description: "웨일 target의 viewport 좌표를 클릭합니다.",
    inputSchema: withPortSchema({ target: { type: "string" }, x: { type: "number" }, y: { type: "number" } }, ["target", "x", "y"]),
  },
  {
    name: "whale_type_text",
    description: "웨일 target에서 현재 포커스된 요소에 텍스트를 입력합니다.",
    inputSchema: withPortSchema({ target: { type: "string" }, text: { type: "string" } }, ["target", "text"]),
  },
  {
    name: "whale_screenshot",
    description: "웨일 target의 PNG 스크린샷을 저장합니다.",
    inputSchema: withPortSchema({ target: { type: "string" }, outFile: { type: "string" }, fullPage: { type: "boolean" } }, ["target", "outFile"]),
  },
  {
    name: "whale_open_special_target",
    description: "웨일 전용 창 target 종류인 whale-sidebar, whale-space, whale-mobile, web-app으로 URL을 엽니다.",
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
    description: "manifest 이름으로 웨일 확장앱을 찾아 확장앱 컨텍스트에서 whale.sidebarAction.show()를 호출합니다.",
    inputSchema: withPortSchema({
      extensionName: { type: "string", default: "웨일 사이드바 Codex 샘플" },
      pagePath: { type: "string", default: "sidebar.html" },
    }),
  },
  {
    name: "whale_validate_extension",
    description: "웨일 MV3 확장앱 manifest의 웨일 스토어 및 sidebar_action 관련 흔한 문제를 검사합니다.",
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
      return showSidebarAction(input.extensionName ?? "웨일 사이드바 Codex 샘플", { ...cdp, pagePath: input.pagePath ?? "sidebar.html" });
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
      serverInfo: { name: "whale", version: "0.1.4" },
    };
  }
  if (request.method === "tools/list") return { tools };
  if (request.method === "tools/call") return callTool(request.params?.name, request.params?.arguments ?? {});
  if (request.method === "ping") return {};
  return {};
};
server.start();
