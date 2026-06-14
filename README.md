# NAVER Whale용 Codex 플러그인

Codex에서 네이버 웨일 브라우저를 제어하고, 웨일 확장앱 API를 테스트하기 위한 공개 GitHub marketplace 플러그인입니다.

이 플러그인은 **사용자 컴퓨터에서 로컬로 실행**됩니다. 웨일 탭 제어, 사이드바 테스트, 확장앱 검사는 각 사용자의 PC에서 처리되며, 이 저장소 소유자가 사용자 브라우저 트래픽을 중계하지 않습니다.

## 설치

PowerShell에서 아래 두 줄을 실행하세요.

```powershell
codex plugin marketplace add https://github.com/mizan0515/codex-plugin-whale.git
codex plugin add whale@whale-codex
```

설치 후 새 Codex 대화를 열면 `@whale` 플러그인과 도구가 로드됩니다.

## 할 수 있는 일

- 이 컴퓨터에 설치된 네이버 웨일 실행 파일을 찾습니다.
- 기본적으로 별도 브라우저 데이터 폴더를 만들어 안전하게 웨일을 실행합니다.
- 웨일 탭 열기, 이동, 읽기, 클릭, 입력, 스크린샷을 처리합니다.
- 웨일 Manifest V3 확장앱을 검사합니다.
- `sidebar_action` 기반 사이드바 확장앱 샘플을 제공합니다.
- `whale.sidebarAction.show()`를 실제 웨일 확장앱 컨텍스트에서 호출합니다.
- `whale-sidebar`, `whale-space`, `whale-mobile`, `web-app` 같은 웨일 전용 창 열기 방식을 테스트합니다.
- 웨일 API 문서 요약, 안전 가이드, 문제 해결 문서, 배포 체크리스트를 포함합니다.

## 빠른 실사용 테스트

```powershell
$plugin = ".\plugins\whale"
$sample = Join-Path $plugin "samples\whale-sidebar-extension"
node "$plugin\scripts\whale.mjs" detect
node "$plugin\scripts\whale.mjs" launch --port 9223 --load-extension $sample --disable-extensions-except $sample
node "$plugin\scripts\whale.mjs" sidebar-show --port 9223 --extension-name "웨일 사이드바 Codex 샘플"
```

정상이라면 마지막 결과에 아래 값이 보입니다.

```json
{
  "showCalled": true,
  "lastError": null
}
```

## 저장소 구조

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

## 웨일 공식 문서 갱신 대응

웨일 API 문서는 시간이 지나면 바뀔 수 있습니다. 이 저장소는 GitHub Actions로 웨일 API 문서를 정기 확인합니다.

- 감시 대상: `https://developers.whale.naver.com/api/` 아래 API 문서
- 실행 주기: 매일 1회, 수동 실행 가능
- 문서 변경 감지 시: GitHub issue를 자동 생성 또는 기존 issue에 댓글 추가
- 자동 이슈 내용: 바뀐 문서 URL, 이전 해시, 새 해시, 로컬 갱신 명령
- Codex가 처리할 일: 생성된 issue를 기준으로 `plugins/whale/docs/whale-api.md`, skill, 샘플 확장앱, 검사 스크립트를 함께 갱신

수동 확인:

```powershell
node .\scripts\check-whale-docs.mjs --check
```

현재 기준 스냅샷을 새로 저장:

```powershell
node .\scripts\check-whale-docs.mjs --update
```

## 안전 원칙

기본 실행은 별도 브라우저 데이터 폴더를 사용합니다. 사용자가 명시적으로 원하지 않는 한 개인 웨일 세션을 대상으로 쓰지 마세요.

플러그인 지침은 아래 항목을 읽지 않도록 제한합니다.

- 쿠키
- 저장된 로그인 정보
- 세션 저장소
- 개인 키
- 인증 파일
- 브라우저 저장소 데이터베이스

## 상표와 로고

NAVER Whale 이름, 로고, 관련 표장은 NAVER 또는 해당 권리자에게 있습니다. 이 저장소는 독립 Codex 통합이며, NAVER가 직접 게시한 공식 제품이 아닙니다.

포함된 플러그인 아이콘은 Windows용 NAVER Whale 설치 패키지에 포함된 공식 애플리케이션 리소스에서 만들었습니다.

## 출처

- NAVER Whale 브라우저 API: https://developers.whale.naver.com/api/
- NAVER Whale 웹사이트: https://whale.naver.com/
- Codex 플러그인 문서: https://developers.openai.com/codex/plugins/build
