# Troubleshooting

## Whale Not Found

Run:

```powershell
node .\scripts\whale.mjs detect
```

If no executable is found, pass it explicitly:

```powershell
node .\scripts\whale.mjs launch --executable "C:\Path\To\whale.exe"
```

## CDP Port Not Responding

Start Whale with remote debugging:

```powershell
node .\scripts\whale.mjs launch --port 9223
```

Then check:

```powershell
node .\scripts\whale.mjs version --port 9223
```

## Port Already Used

Use another port:

```powershell
node .\scripts\whale.mjs launch --port 9323
node .\scripts\whale.mjs list --port 9323
```

## Page Target Missing

Run `list` and use the exact returned `id`. Do not guess target IDs.

## Existing Profile Did Not Appear

CDP can only see pages in the debug-enabled Whale instance. If a normal Whale instance is already running, launching another copy with the same profile may be blocked by the browser. Close the normal instance or use a separate explicit user-data directory.

## Extension API Is Undefined

Common causes:

- The code is running on a normal webpage rather than an extension page.
- The API is not available in content scripts.
- The permission is missing from `manifest.json`.
- The API is unsupported or partially supported in Whale, such as `whale.sessions` or `whale.identity`.

