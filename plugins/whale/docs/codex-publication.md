# Codex Plugin Store Publication Notes

This bundle is structured for public Codex plugin submission:

- `.codex-plugin/plugin.json` is present and validates.
- `skills` points at `./skills/`.
- `mcpServers` points at `./.mcp.json`.
- assets referenced by the manifest exist inside the plugin.
- the plugin includes a README, safety notes, troubleshooting, API map, MCP server, CLI, and sample extension.

## Before Publishing From A Real Repository

Update these fields in `.codex-plugin/plugin.json` when the public source repository and project policies exist:

- `repository`: HTTPS URL for the public source repository.
- `interface.privacyPolicyURL`: HTTPS URL for the plugin publisher's privacy policy, if the marketplace requires it.
- `interface.termsOfServiceURL`: HTTPS URL for the plugin publisher's terms, if the marketplace requires it.

Do not point those fields at unrelated NAVER documentation unless NAVER is the actual publisher of the Codex plugin.

## Local Validation Commands

```powershell
python <plugin-creator-skill-root>\scripts\validate_plugin.py <path-to-plugin>
node <path-to-plugin>\scripts\validate-whale-plugin.mjs <path-to-plugin>
node <path-to-plugin>\scripts\whale.mjs detect
```

## Local Marketplace Entry

This task also generated `outputs/marketplace.json` for local inspection in Codex. It is a test marketplace entry, not a claim that the plugin is already accepted by a public marketplace.
