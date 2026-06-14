# NAVER Whale API Map

Source basis: NAVER Whale browser API documentation at https://developers.whale.naver.com/api/.

## Compatibility Model

Whale supports browser-compatible extension APIs and most Chrome extension APIs. NAVER documents that Whale supports both the `whale.*` namespace and the `chrome.*` namespace, so many existing Chrome extensions can run without changes when they do not depend on Google-service-specific APIs.

## Extension API Inventory

| API | Category | Whale difference |
| --- | --- | --- |
| `whale.alarms` | service | Same as Chrome |
| `whale.bookmarks` | browser | Same as Chrome |
| `whale.action` | UI | Same as Chrome; cannot be used with `sidebar_action` |
| `whale.browsingData` | settings | Same as Chrome |
| `whale.commands` | settings | Same as Chrome |
| `whale.contentSettings` | settings | Same as Chrome |
| `whale.contextMenus` | UI | Same as Chrome |
| `whale.cookies` | service | Same as Chrome |
| `whale.debugger` | DevTools | Same as Chrome |
| `whale.declarativeContent` | service | Same as Chrome |
| `whale.declarativeNetRequest` | service | Same as Chrome |
| `whale.desktopCapture` | capture | Same as Chrome |
| `whale.devtools.inspectedWindow` | DevTools | Same as Chrome |
| `whale.devtools.network` | DevTools | Same as Chrome |
| `whale.devtools.panels` | DevTools | Same as Chrome |
| `whale.devtools.recorder` | DevTools | Same as Chrome |
| `whale.downloads` | browser | Same as Chrome |
| `whale.events` | data type | Same as Chrome |
| `whale.extension` | extension | Same as Chrome |
| `whale.fontSettings` | settings | Same as Chrome |
| `whale.history` | browser | Same as Chrome |
| `whale.i18n` | utility | Same as Chrome |
| `whale.identity` | service | Partially supported; Whale documents `launchWebAuthFlow()` only |
| `whale.idle` | service | Same as Chrome |
| `whale.management` | extension | Same as Chrome |
| `whale.notifications` | UI | Same as Chrome |
| `whale.offscreen` | utility | Same as Chrome |
| `whale.omnibox` | UI | Same as Chrome |
| `whale.pageCapture` | capture | Same as Chrome |
| `whale.permissions` | extension | Same as Chrome |
| `whale.power` | settings | Same as Chrome |
| `whale.privacy` | settings | Same as Chrome |
| `whale.proxy` | settings | Same as Chrome |
| `whale.runtime` | extension | Same as Chrome |
| `whale.scripting` | utility | Same as Chrome |
| `whale.sessions` | service | Unsupported in Whale |
| `whale.storage` | service | Same as Chrome |
| `whale.system.cpu` | system | Same as Chrome |
| `whale.system.memory` | system | Same as Chrome |
| `whale.system.storage` | system | Same as Chrome |
| `whale.tabCapture` | tab/window | Same as Chrome |
| `whale.tabs` | tab/window | Same as Chrome |
| `whale.topSites` | browser | Adds delete, update, and search methods |
| `whale.types` | data type | Same as Chrome |
| `whale.webNavigation` | network | Same as Chrome |
| `whale.webRequest` | network | Same as Chrome |
| `whale.windows` | tab/window | Same as Chrome |
| `whale.sidebarAction` | UI | Whale-specific |

## Manifest Keys

Whale extension manifests use Manifest V3. Store submission requires at least:

- `manifest_version: 3`
- `name`
- `version`
- `description`
- `icons`

Whale-specific or important keys:

- `minimum_whale_version`: oldest compatible Whale version. Users below that version see an incompatibility warning and cannot install/update.
- `sidebar_action`: defines a Whale sidebar app. Cannot be combined with `action`.
- `action`: defines a toolbar button. Cannot be combined with `sidebar_action`.
- `default_locale`: required for internationalized extensions and invalid when locale files are absent.
- `host_permissions` and `optional_host_permissions`: URL match patterns shown to users as host access.
- `permissions` and `optional_permissions`: extension API permissions.

## `sidebar_action`

`sidebar_action` creates a Whale sidebar app whose button appears in Whale's sidebar rather than the toolbar.

Required fields:

- `default_page`: local HTML page shown in the sidebar. Remote URLs are not allowed.
- `default_icon`: icon path map.

Optional fields:

- `default_title`: tooltip text.
- `use_navigation_bar`: whether to show the bottom navigation bar. Default is `true`.
- `mobile_user_agent`: whether to use a mobile user agent. Default is `true`.

Important notes:

- Sidebar width is user-adjustable. NAVER documents a default around 390 px and a maximum around 590 px.
- The sidebar may be on the left or right depending on user settings.
- Design sidebar UI as responsive and narrow.

## `whale.sidebarAction` Methods

- `show(windowId?, details?, callback?)`: open/focus the sidebar. `details.url` can load a page URL; `details.reload` can force reload when URL matches.
- `hide(windowId?, callback?)`: close the sidebar when the extension has focus.
- `setTitle(details)`: set tooltip text across windows.
- `getTitle(callback)`: read tooltip text.
- `setIcon(details)`: set sidebar icon across windows.
- `setPage(details)`: set the local page loaded on click; empty string shows an empty sidebar.
- `getPage(callback)`: read the configured page.
- `setBadgeText(details)`: set sidebar badge text.
- `getBadgeText(callback)`: read sidebar badge text.
- `setBadgeBackgroundColor(details)`: set badge color as hex or RGBA array.
- `getBadgeBackgroundColor(callback)`: read badge color.
- `dock(windowId, details?, callback)`: dock a popup window or tab into the sidebar.
- `undock(parentWindowId, callback)`: restore a docked window/tab. Modern callback result is an object containing `popupId` and/or `tabId`.

## `whale.sidebarAction` Event

- `onClicked`: fires when the sidebar app icon is clicked. Callback receives `windowId` and `opened`.

## Whale Web API Targets

Whale extends standard links through `rel` values:

- `whale-sidebar`: open in a sidebar panel.
- `whale-space`: open in Whale Space.
- `whale-mobile`: open in a new mobile window.
- `web-app`: open in a web app window.

JavaScript can request the same behavior through the third `window.open()` argument:

```js
window.open("https://m.naver.com/", "_blank", "whale-mobile");
```

If multiple Whale targets are present, NAVER documents priority as:

```text
whale-space > whale-sidebar > whale-mobile > web-app
```

## Content Script Constraint

Content scripts can access only a limited subset of extension APIs. If an API is declared in `permissions` but appears undefined in a content script, move the call to the service worker, extension page, popup, or sidebar page and communicate by message passing.

