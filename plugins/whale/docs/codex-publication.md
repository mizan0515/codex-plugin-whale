# Codex 플러그인 공개 배포 메모

이 번들은 공개 Codex 플러그인 제출과 GitHub marketplace 배포를 모두 염두에 둔 구조입니다.

## 포함 항목

- `.codex-plugin/plugin.json` manifest
- manifest에서 참조하는 로고와 composer 아이콘
- README, 안전 가이드, 문제 해결, 웨일 API map, MCP 서버, CLI, 샘플 확장앱
- 공개 저장소에서 바로 설치할 수 있는 `marketplace.json`

## 게시자와 출처 표기

`plugin.json`의 `author`, `repository`, `homepage` 값은 이 플러그인 게시자와 저장소를 가리켜야 합니다. NAVER가 직접 게시한 플러그인이 아니므로 게시자 필드를 NAVER처럼 보이게 작성하면 안 됩니다.

NAVER 문서는 참고 출처로 링크합니다.

- https://developers.whale.naver.com/api/
- https://github.com/naver/whale-browser-developers

## 로고와 상표

플러그인 아이콘은 Windows용 NAVER Whale 설치 리소스에서 생성했습니다. NAVER Whale 이름, 로고, 관련 표장은 NAVER 또는 해당 권리자에게 있습니다. 이 저장소는 독립 Codex 통합입니다.

## 로컬 marketplace 항목

저장소의 `.agents/plugins/marketplace.json`은 Codex에서 공개 GitHub marketplace로 설치하기 위한 항목입니다.

```powershell
codex plugin marketplace add https://github.com/mizan0515/codex-plugin-whale.git
codex plugin add whale@whale-codex
```

## 공개 전 점검

배포 전에는 다음을 모두 실행합니다.

```powershell
python <plugin-creator>\scripts\validate_plugin.py .\plugins\whale
node .\plugins\whale\scripts\validate-whale-plugin.mjs .\plugins\whale
node .\scripts\check-whale-docs.mjs --check
git diff --check
```

문서 감시 워크플로우는 웨일 개발자 문서가 바뀌면 GitHub issue를 자동 생성합니다. 관리자가 직접 변경점을 찾거나 티켓을 만들 필요가 없도록 하기 위한 장치입니다.
