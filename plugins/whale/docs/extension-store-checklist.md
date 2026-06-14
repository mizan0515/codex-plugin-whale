# Whale Extension Store Checklist

Use this checklist before publishing a Whale extension or a Codex-generated sample to Whale Store.

## Required Manifest

- `manifest_version` is `3`.
- `name` is present and short enough for Whale Store display.
- `version` is present and follows extension version rules.
- `description` is present and concise.
- `icons` includes real icon files.
- `default_locale` is present only when `_locales/` exists.
- `action` and `sidebar_action` are not both present.
- `minimum_whale_version` is present only when the extension actually depends on a newer Whale feature.

## Permissions

- Prefer the narrowest permissions.
- Move broad host access to `optional_host_permissions` when the workflow allows it.
- Explain why each permission is needed in store review notes.
- Avoid `debugger`, `webRequest`, broad hosts, and browsing-data permissions unless essential.

## Sidebar Apps

- Use `sidebar_action.default_page` with a local HTML file.
- Keep sidebar UI usable at 390 px width.
- Test with `mobile_user_agent: true` and `false` when the app uses responsive web content.
- Handle `whale.sidebarAction.onClicked` if badge/page/title state changes on open.
- Do not use `action` in the same manifest.

## Whale Web Targets

Test each target you advertise:

- `rel="whale-sidebar"`
- `rel="whale-space"`
- `rel="whale-mobile"`
- `rel="web-app"`
- `window.open(url, "_blank", "whale-sidebar")`
- `window.open(url, "_blank", "whale-space")`
- `window.open(url, "_blank", "whale-mobile")`
- `window.open(url, "_blank", "web-app")`

## Privacy And Safety

- Do not collect browsing history, page content, cookies, or identifiers unless the extension's core function requires it.
- If data leaves the user's machine, document the destination, retention, and deletion path.
- Do not inject scripts into financial, medical, identity, or admin sites unless explicitly needed.
- Keep content scripts passive until user activation when possible.

## Packaging

- Validate `manifest.json` with:

```powershell
node .\scripts\whale.mjs validate-extension --extension .\samples\whale-sidebar-extension
```

- Zip only extension contents, not the parent directory.
- Install locally through `whale://extensions` developer mode before upload.
- Re-test on a clean Whale profile.

