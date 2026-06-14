# 문제 해결

## 웨일을 찾지 못함

먼저 자동 탐지를 실행합니다.

```powershell
node .\scripts\whale.mjs detect
```

일반 설치 경로에 없으면 웨일 실행 파일을 직접 지정합니다.

```powershell
node .\scripts\whale.mjs launch --executable "C:\Path\To\whale.exe"
```

## CDP 연결 실패

원격 디버깅 포트로 웨일을 실행해야 합니다.

```powershell
node .\scripts\whale.mjs launch --port 9223
node .\scripts\whale.mjs version --port 9223
```

다른 프로세스가 포트를 쓰고 있으면 포트를 바꿉니다.

```powershell
node .\scripts\whale.mjs launch --port 9323
node .\scripts\whale.mjs list --port 9323
```

## 탭 목록이 비어 있음

CDP는 디버깅 포트로 실행된 웨일 인스턴스의 페이지만 볼 수 있습니다. 이미 일반 웨일이 같은 프로필로 실행 중이면 새 인스턴스가 막힐 수 있습니다. 일반 웨일을 닫거나 별도 `--user-data-dir`을 사용합니다.

## 확장앱 API가 undefined임

가능한 원인은 아래와 같습니다.

- 확장앱 페이지가 아니라 일반 웹 페이지에서 코드를 실행했습니다.
- 콘텐츠 스크립트에서 사용할 수 없는 API를 호출했습니다.
- `manifest.json`에 필요한 권한이 없습니다.
- `whale.sessions`처럼 웨일에서 지원하지 않거나 `whale.identity`처럼 일부만 지원하는 API입니다.

확장앱 API 호출은 서비스 워커, 확장앱 페이지, popup, 사이드바 페이지에서 실행하고, 콘텐츠 스크립트와는 message passing으로 연결합니다.
