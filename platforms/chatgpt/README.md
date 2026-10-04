# ChatGPT adapter

ChatGPT has no local skill-directory discovery mechanism the way Claude,
Codex, and Copilot CLI do — there is no per-tool "home" this installer can
target. Coverage here means a **Custom GPT** with this repo's skill files
uploaded as Knowledge, exported via `-Target ChatGPT` instead of installed
into a directory. Full walkthrough, the Custom GPT Instructions text to
paste, and the manual-paste fallback for accounts without Custom GPT access
(Custom GPTs are announced to retire on 2026-12-11; read its
"Availability" section first):
[`docs/chatgpt.md`](../../docs/chatgpt.md). See ADR 0006 for why this shape
was chosen over an Actions schema or documentation-only coverage.
