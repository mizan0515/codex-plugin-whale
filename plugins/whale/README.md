# Whale Codex 플러그인

Codex에서 네이버 웨일을 실제 브라우저로 열고 제어하기 위한 로컬 플러그인입니다.

이 플러그인은 번들 Chrome 플러그인의 사용자 경험을 참고하되, 공개 배포 가능한 방식으로 구현했습니다. OpenAI의 비공개 Chrome 확장 호스트를 복사하지 않고, 웨일이 원격 디버깅 포트로 공개하는 Chromium DevTools Protocol을 사용합니다.

## 제공 기능

- Windows, macOS, Linux의 일반적인 네이버 웨일 실행 파일 위치를 찾습니다.
- `--remote-debugging-port`와 별도 브라우저 데이터 폴더로 웨일을 실행합니다.
- 이미 디버깅 포트가 열린 웨일 인스턴스에 연결합니다.
- 탭 목록 확인, 새 탭 열기, 페이지 이동, 본문 읽기, JavaScript 실행, 클릭, 입력, 스크린샷을 처리합니다.
- 웨일 전용 target인 `whale-sidebar`, `whale-space`, `whale-mobile`, `web-app`을 테스트합니다.
- 페이지에서 `window.whale`, `window.chrome`, user agent, 확장앱 네임스페이스를 확인합니다.
- `sidebar_action` 샘플을 포함한 웨일 Manifest V3 확장앱을 검사합니다.
- 웨일 확장앱 API, 호환성, manifest key, `whale.sidebarAction` 메소드/이벤트, 심사 체크리스트를 문서화합니다.

## 중요한 제한

이 공개 플러그인은 웨일을 원격 디버깅 포트와 함께 실행해야 제어할 수 있습니다. 번들 Chrome 플러그인의 비공개 확장 브리지처럼 이미 열린 일반 브라우저 세션을 자동으로 잡는 구조가 아닙니다.

로그인된 기존 웨일 세션을 쓰려면 사용자가 직접 의도한 데이터 폴더와 디버깅 포트를 지정해야 합니다. 기본값은 안전을 위해 별도 데이터 폴더를 사용합니다.

## 실행 요구사항

- 사용자의 PC에 NAVER Whale이 설치되어 있어야 합니다.
- Codex 플러그인 런타임에서 `node` 명령을 실행할 수 있어야 합니다.
- Windows에서는 `%LOCALAPPDATA%`, `%ProgramFiles%`, `%ProgramFiles(x86)%` 아래의 일반 웨일 설치 경로를 자동 탐지합니다.
- macOS와 Linux는 일반 설치 후보 경로를 확인합니다.
- 자동 탐지가 실패하면 `WHALE_EXECUTABLE` 환경 변수나 `--executable` 옵션으로 웨일 실행 파일을 직접 지정할 수 있습니다.
- 브라우저 제어 트래픽은 사용자의 로컬 PC 안에서 흐릅니다.

## 빠른 로컬 테스트

```powershell
node .\scripts\whale.mjs detect
node .\scripts\whale.mjs launch --port 9223 --load-extension .\samples\whale-sidebar-extension --disable-extensions-except .\samples\whale-sidebar-extension
node .\scripts\whale.mjs new-page --url https://developers.whale.naver.com/api/
node .\scripts\whale.mjs list
node .\scripts\whale.mjs sidebar-show --extension-name "웨일 사이드바 Codex 샘플"
```

## 구성 파일

- `.codex-plugin/plugin.json`: Codex 플러그인 manifest
- `.mcp.json`: 로컬 MCP 서버 등록
- `skills/control-whale/SKILL.md`: `@whale` 사용 시 Codex가 따르는 실행 지침
- `mcp/server.bundle.mjs`: 외부 의존성 없는 stdio MCP 서버
- `scripts/whale-client.mjs`: 웨일 실행/제어 helper
- `scripts/whale.mjs`: 수동 테스트용 명령줄 도구
- `scripts/validate-whale-plugin.mjs`: 플러그인 번들 검사
- `docs/`: 웨일 API 요약, 제어 가이드, 안전 가이드, 문제 해결, 스토어 체크리스트
- `samples/whale-sidebar-extension/`: 웨일 전용 API를 쓰는 MV3 사이드바 확장앱 샘플

## 출처

- NAVER Whale 브라우저 API: https://developers.whale.naver.com/api/
- NAVER Whale 개발자 문서 저장소: https://github.com/naver/whale-browser-developers
- 공통 Chromium 확장 API 참고: https://developer.chrome.com/docs/extensions/reference/api

## 브랜드 이미지

플러그인 아이콘과 샘플 확장앱 아이콘은 Windows용 NAVER Whale 설치 리소스에서 만들었습니다.

- `VisualElements/Logo.png`
- `VisualElements/SmallLogo.png`

NAVER Whale 이름, 로고, 관련 표장은 NAVER 또는 해당 권리자에게 있습니다. 이 플러그인은 독립 Codex 통합이며, NAVER가 직접 게시한 공식 제품이 아닙니다.
