# 웨일 확장앱 스토어 체크리스트

웨일 확장앱이나 Codex가 생성한 샘플을 웨일 스토어에 올리기 전에 이 목록을 확인합니다.

## manifest 기본값

- `manifest_version`은 `3`입니다.
- `name`은 있고 웨일 스토어에 표시될 만큼 짧습니다.
- `version`은 있고 확장앱 버전 규칙을 따릅니다.
- `description`은 있고 사용자가 기능을 이해할 수 있습니다.
- `icons`는 필요한 크기의 로컬 파일을 가리킵니다.
- `default_locale`은 `_locales`가 있는 다국어 확장앱에만 씁니다.

## 웨일 전용 manifest key

- `action`과 `sidebar_action`은 한 manifest에서 함께 쓰지 않습니다.
- `minimum_whale_version`은 실제로 최신 웨일 기능에 의존할 때만 씁니다.
- `permissions`, `optional_permissions`, `host_permissions`, `optional_host_permissions`는 필요한 최소 범위로 제한합니다.

## 사이드바 확장앱

- `sidebar_action.default_page`는 확장앱 내부의 로컬 HTML 파일이어야 합니다.
- 사이드바 UI는 기본 폭 약 390 px에서도 사용할 수 있어야 합니다.
- `sidebar_action.default_icon`은 로컬 아이콘 파일을 가리켜야 합니다.
- 열림 상태, 배지, 페이지, 제목을 바꾸는 경우 `whale.sidebarAction.onClicked`를 처리합니다.
- 같은 manifest에 `action`을 넣지 않습니다.

## 웨일 Web target

웹 페이지에서 웨일 전용 창을 열 때는 아래 값을 테스트합니다.

- `rel="whale-sidebar"`
- `rel="whale-space"`
- `rel="whale-mobile"`
- `rel="web-app"`

JavaScript에서는 `window.open(url, "_blank", "<kind>")` 형식을 사용합니다.

```js
window.open("https://m.naver.com/", "_blank", "whale-mobile");
```

## 개인정보와 안전

- 핵심 기능에 필요하지 않은 방문 기록, 페이지 내용, 쿠키, 식별자는 수집하지 않습니다.
- 권한 요청 문구와 실제 기능이 일치해야 합니다.
- 원격 코드 실행, 원격 스크립트 로드, 과도한 host 권한은 피합니다.
- 확장앱 검증 중 일반 사용자 프로필을 쓰지 않습니다.

## 로컬 검증

```powershell
node .\scripts\whale.mjs validate-extension --extension .\samples\whale-sidebar-extension
node .\scripts\whale.mjs launch --port 9223 --load-extension .\samples\whale-sidebar-extension --disable-extensions-except .\samples\whale-sidebar-extension
node .\scripts\whale.mjs sidebar-show --port 9223 --extension-name "웨일 사이드바 Codex 샘플"
```

확장앱을 압축할 때는 상위 폴더가 아니라 확장앱 파일 자체가 zip의 루트에 오도록 만듭니다. 업로드 전 `whale://extensions` 개발자 모드에서 한 번 더 설치해 확인합니다.
