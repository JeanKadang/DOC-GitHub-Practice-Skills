# ChatGPT adapter

ChatGPT has no local skill-directory discovery mechanism the way Claude,
Codex, and Copilot CLI do — there is no per-tool "home" this installer can
target. Coverage here means a **Custom GPT** with this repo's skill files
uploaded as Knowledge, exported via `-Target ChatGPT` instead of installed
into a directory. Full walkthrough, the Custom GPT Instructions text to
paste, and the manual-paste fallback for accounts without Custom GPT access
(OpenAI's help center gives 2026-12-11 as the retirement date; read its
"Availability" section first, and "The plugin and skills route" for the
untested replacement):
[`docs/chatgpt.md`](../../docs/chatgpt.md). See ADR 0006 for why this shape
was chosen over an Actions schema or documentation-only coverage.

## At a glance

- **Installer target:** `-Target ChatGPT`. It exports files; it installs
  nothing.
- **Exports to:** `~/chatgpt-skills-export`. The `-ChatGPTExportPath` option
  changes the folder.
- **What it writes:** one flat file per skill file, named
  `<skill-name>-<relative-path>`, plus `LICENSE` and a `manifest.json` that
  maps each exported name back to its original path. The `agents/openai.yaml`
  sidecars are left out.
- **Preview first:** the dry run lists the files before anything is written.
- **After exporting:** upload the skill files to a Custom GPT's Knowledge, or
  use the manual-paste fallback. Knowledge uploads are static, so re-export and
  replace the files after a repository update.
- **Check availability first:** Custom GPTs are being retired. The guide says
  which route is open to which account, so read it before exporting.
- **How well it has been checked:** nothing has been tried in a real ChatGPT
  workspace. See [`docs/compatibility.md`](../../docs/compatibility.md).

```powershell
pwsh -NoProfile -File .\scripts\install-skills.ps1 -Target ChatGPT -DryRun
```
