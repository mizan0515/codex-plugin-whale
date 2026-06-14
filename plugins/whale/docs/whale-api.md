# NAVER Whale API Map

기준 문서: https://developers.whale.naver.com/api/

이 문서는 Codex 플러그인이 웨일 확장앱과 웨일 전용 Web API를 다룰 때 필요한 범위를 요약합니다. 상세한 매개변수와 최신 제약은 NAVER 공식 문서를 우선합니다.

## 호환성 모델

웨일은 브라우저 호환 확장앱 API 규격과 대부분의 Chrome 확장 API를 지원합니다. NAVER 문서에 따르면 `whale.*` 네임스페이스뿐 아니라 `chrome.*` 네임스페이스도 지원하므로, Google 서비스 전용 API에 의존하지 않는 많은 Chrome 확장앱은 큰 수정 없이 웨일에서 동작할 수 있습니다.

## 확장앱 API 목록

| API | 분류 | 웨일 차이 |
| --- | --- | --- |
| `whale.alarms` | 서비스 | Chrome과 동일 |
| `whale.bookmarks` | 브라우저 기능 | Chrome과 동일 |
| `whale.action` | UI | Chrome과 동일, `sidebar_action`과 함께 사용 불가 |
| `whale.browsingData` | 설정 | Chrome과 동일 |
| `whale.commands` | 설정 | Chrome과 동일 |
| `whale.contentSettings` | 설정 | Chrome과 동일 |
| `whale.contextMenus` | UI | Chrome과 동일 |
| `whale.cookies` | 서비스 | Chrome과 동일 |
| `whale.debugger` | 개발자도구 | Chrome과 동일 |
| `whale.declarativeContent` | 서비스 | Chrome과 동일 |
| `whale.declarativeNetRequest` | 서비스 | Chrome과 동일 |
| `whale.desktopCapture` | 캡처 | Chrome과 동일 |
| `whale.devtools.inspectedWindow` | 개발자도구 | Chrome과 동일 |
| `whale.devtools.network` | 개발자도구 | Chrome과 동일 |
| `whale.devtools.panels` | 개발자도구 | Chrome과 동일 |
| `whale.devtools.recorder` | 개발자도구 | Chrome과 동일 |
| `whale.downloads` | 브라우저 기능 | Chrome과 동일 |
| `whale.events` | 자료형 | Chrome과 동일 |
| `whale.extension` | 확장앱 | Chrome과 동일 |
| `whale.fontSettings` | 설정 | Chrome과 동일 |
| `whale.history` | 브라우저 기능 | Chrome과 동일 |
| `whale.i18n` | 유틸리티 | Chrome과 동일 |
| `whale.identity` | 서비스 | 부분 지원, `launchWebAuthFlow()` 문서화 |
| `whale.idle` | 서비스 | Chrome과 동일 |
| `whale.management` | 확장앱 | Chrome과 동일 |
| `whale.notifications` | UI | Chrome과 동일 |
| `whale.offscreen` | 유틸리티 | Chrome과 동일 |
| `whale.omnibox` | UI | Chrome과 동일 |
| `whale.pageCapture` | 캡처 | Chrome과 동일 |
| `whale.permissions` | 확장앱 | Chrome과 동일 |
| `whale.power` | 설정 | Chrome과 동일 |
| `whale.privacy` | 설정 | Chrome과 동일 |
| `whale.proxy` | 설정 | Chrome과 동일 |
| `whale.runtime` | 확장앱 | Chrome과 동일 |
| `whale.scripting` | 유틸리티 | Chrome과 동일 |
| `whale.sessions` | 서비스 | 웨일에서 지원되지 않음 |
| `whale.storage` | 서비스 | Chrome과 동일 |
| `whale.system.cpu` | 시스템 | Chrome과 동일 |
| `whale.system.memory` | 시스템 | Chrome과 동일 |
| `whale.system.storage` | 시스템 | Chrome과 동일 |
| `whale.tabCapture` | 탭/창 | Chrome과 동일 |
| `whale.tabs` | 탭/창 | Chrome과 동일 |
| `whale.topSites` | 브라우저 기능 | 삭제, 수정, 검색 메소드 추가 제공 |
| `whale.types` | 자료형 | Chrome과 동일 |
| `whale.webNavigation` | 네트워크 | Chrome과 동일 |
| `whale.webRequest` | 네트워크 | Chrome과 동일 |
| `whale.windows` | 탭/창 | Chrome과 동일 |
| `whale.sidebarAction` | UI | 웨일 전용 |

## Manifest key

웨일 확장앱은 Manifest V3를 사용합니다. 스토어 제출에 필요한 최소 항목은 아래와 같습니다.

- `manifest_version: 3`
- `name`
- `version`
- `description`
- `icons`

웨일 전용이거나 중요도가 높은 key:

- `minimum_whale_version`: 호환되는 가장 낮은 웨일 버전입니다. 낮은 버전 사용자에게는 설치나 업데이트가 막힐 수 있습니다.
- `sidebar_action`: 웨일 사이드바앱을 정의합니다. `action`과 함께 사용할 수 없습니다.
- `action`: 툴바 버튼을 정의합니다. `sidebar_action`과 함께 사용할 수 없습니다.
- `default_locale`: 다국어 확장앱에 필요하며, locale 파일이 없을 때 넣으면 오류가 됩니다.
- `host_permissions`, `optional_host_permissions`: 사용자에게 표시되는 사이트 접근 권한입니다.
- `permissions`, `optional_permissions`: 확장 API 권한입니다.

## `sidebar_action`

`sidebar_action`은 툴바가 아니라 웨일 사이드바 영역에 버튼과 페이지를 표시하는 웨일 전용 manifest key입니다.

필수 필드:

- `default_page`: 사이드바에 표시할 확장앱 내부 HTML 파일입니다. 원격 URL은 허용되지 않습니다.
- `default_icon`: 아이콘 경로 map입니다.

선택 필드:

- `default_title`: tooltip 텍스트입니다.
- `use_navigation_bar`: 하단 탐색 바 표시 여부입니다. 기본값은 `true`입니다.
- `mobile_user_agent`: 모바일 user agent 사용 여부입니다. 기본값은 `true`입니다.

주의사항:

- 사이드바 폭은 사용자가 조절할 수 있습니다. NAVER 문서는 기본 약 390 px, 최대 약 590 px 폭을 안내합니다.
- 사용자의 설정에 따라 사이드바는 왼쪽이나 오른쪽에 있을 수 있습니다.
- UI는 좁은 폭에서도 사용할 수 있게 반응형으로 설계합니다.

## `whale.sidebarAction` 메소드

- `show(windowId?, details?, callback?)`: 사이드바를 열거나 포커스합니다. `details.url`로 페이지 URL을 지정할 수 있고, `details.reload`로 같은 URL도 다시 로드할 수 있습니다.
- `hide(windowId?, callback?)`: 확장앱에 포커스가 있을 때 사이드바를 닫습니다.
- `setTitle(details)`: window 전반의 tooltip 텍스트를 설정합니다.
- `getTitle(callback)`: tooltip 텍스트를 읽습니다.
- `setIcon(details)`: 사이드바 아이콘을 설정합니다.
- `setPage(details)`: 클릭 시 로드할 로컬 페이지를 설정합니다. 빈 문자열은 빈 사이드바를 의미합니다.
- `getPage(callback)`: 설정된 페이지를 읽습니다.
- `setBadgeText(details)`: 사이드바 배지 텍스트를 설정합니다.
- `getBadgeText(callback)`: 사이드바 배지 텍스트를 읽습니다.
- `setBadgeBackgroundColor(details)`: 배지 색상을 hex 또는 RGBA 배열로 설정합니다.
- `getBadgeBackgroundColor(callback)`: 배지 색상을 읽습니다.
- `dock(windowId, details?, callback)`: popup 창이나 탭을 사이드바로 dock합니다.
- `undock(parentWindowId, callback)`: dock된 창이나 탭을 되돌립니다. 최신 callback 결과는 `popupId` 또는 `tabId`를 포함한 객체입니다.

## `whale.sidebarAction` 이벤트

- `onClicked`: 사이드바앱 아이콘을 클릭했을 때 발생합니다. callback은 `windowId`와 `opened` 상태를 받습니다.

## 웨일 Web API target

웨일은 표준 링크에 `rel` 값을 추가해 전용 창 target을 엽니다.

- `whale-sidebar`: 사이드바 패널로 열기
- `whale-space`: 웨일 스페이스로 열기
- `whale-mobile`: 새 모바일 창으로 열기
- `web-app`: 웹 앱 창으로 열기

JavaScript에서는 `window.open()`의 세 번째 인자로 같은 동작을 요청합니다.

```js
window.open("https://m.naver.com/", "_blank", "whale-mobile");
```

target 값이 여러 개 있으면 NAVER 문서의 우선순위는 아래와 같습니다.

```text
whale-space > whale-sidebar > whale-mobile > web-app
```

## 콘텐츠 스크립트 제약

콘텐츠 스크립트는 제한된 일부 확장 API만 사용할 수 있습니다. `permissions`에 선언했는데도 API가 undefined로 보이면 서비스 워커, 확장앱 페이지, popup, 사이드바 페이지로 호출 위치를 옮기고 message passing으로 연결합니다.

## 문서 갱신 처리

이 저장소는 `scripts/check-whale-docs.mjs`와 GitHub Actions로 NAVER Whale API 문서를 정기 확인합니다. 해시가 바뀌면 `docs-sync` issue가 자동 생성되며, issue 본문에 바뀐 URL과 갱신 명령이 들어갑니다.
