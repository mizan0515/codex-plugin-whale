# 웨일 제어 가이드

이 플러그인은 Chromium DevTools Protocol(CDP)로 네이버 웨일을 제어합니다. CDP는 웨일을 `--remote-debugging-port=<port>` 옵션으로 실행했을 때만 사용할 수 있습니다.

## 기본 포트

기본 포트는 `9223`입니다. 일반 Chrome 디버깅 세션에서 자주 쓰는 `9222`와 충돌하지 않도록 분리했습니다.

## 웨일 설치 확인

```powershell
node .\scripts\whale.mjs detect
```

탐지기는 일반적인 설치 경로와 브라우저 데이터 루트만 확인합니다. 쿠키, 저장된 로그인 데이터, local storage, 세션 저장소는 읽지 않습니다.

## 격리 프로필로 웨일 실행

```powershell
node .\scripts\whale.mjs launch --port 9223
```

기본값은 운영체제 임시 폴더 아래의 새 프로필입니다. 사용자의 일반 브라우징 상태가 노출되지 않기 때문에 가장 안전한 기본값입니다.

## 기존 로그인 상태 사용

기존 프로필은 사용자가 명시적으로 요청한 경우에만 사용합니다. 선택한 `--user-data-dir`과 디버깅 포트로 웨일을 실행합니다.

```powershell
node .\scripts\whale.mjs launch --port 9223 --user-data-dir "<intended-data-dir>"
```

이 방식은 로그인된 사이트를 Codex에 노출할 수 있습니다. 사용 전 정확한 프로필 선택을 확인해야 합니다.

## 자주 쓰는 명령

```powershell
node .\scripts\whale.mjs list --port 9223
node .\scripts\whale.mjs new-page --port 9223 --url https://developers.whale.naver.com/api/
node .\scripts\whale.mjs read-text --port 9223 --target <targetId>
node .\scripts\whale.mjs screenshot --port 9223 --target <targetId> --out .\artifacts\whale.png
node .\scripts\whale.mjs eval --port 9223 --target <targetId> --expression "document.title"
```

## 샘플 사이드바 확장앱 로드 및 표시

```powershell
node .\scripts\whale.mjs launch --port 9223 --load-extension .\samples\whale-sidebar-extension --disable-extensions-except .\samples\whale-sidebar-extension
node .\scripts\whale.mjs new-page --port 9223 --url chrome://version/
node .\scripts\whale.mjs sidebar-show --port 9223 --extension-name "웨일 사이드바 Codex 샘플"
```

`sidebar-show` 명령은 확장앱 컨텍스트에서 `whale.sidebarAction.show()`를 호출하고 `lastError`를 보고합니다. 성공 결과는 `showCalled: true`, `lastError: null`입니다.

## 웨일 전용 창 target

웨일은 링크의 `rel` 값과 `window.open()`의 세 번째 인자로 브라우저 전용 창 target을 지원합니다.

- `whale-sidebar`
- `whale-space`
- `whale-mobile`
- `web-app`

사용 예시:

```powershell
node .\scripts\whale.mjs open-special --port 9223 --target <targetId> --url https://m.naver.com/ --kind whale-mobile
```

## Chrome식 브라우저 작업과의 대응

이 공개 플러그인은 Chromium 브라우저 플러그인에서 기대하는 실무 제어 흐름을 다룹니다.

- 실행과 연결
- 탭 목록 확인
- 탭 열기와 이동
- URL, 제목, 텍스트 읽기
- 페이지 JavaScript 평가
- 클릭과 입력
- 스크린샷 저장
- CDP 평가 결과를 통한 런타임 오류 확인
- 웨일 전용 확장앱/Web API 테스트

번들 Chrome 플러그인의 비공개 확장 브리지와 동일하다고 주장하지 않습니다. 권한 있는 설치 브리지가 없으면 CDP는 이미 떠 있는 일반 웨일 프로필에 임의로 붙을 수 없습니다. 디버깅 포트로 실행된 웨일만 사용합니다.
