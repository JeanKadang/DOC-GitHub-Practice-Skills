# Runs one prompt through Claude Code in the isolated sandbox and summarizes what it did.
# Usage: .\run-case.ps1 -Name sel1 -Prompt "..." [-Scenario s1]
param(
  [Parameter(Mandatory)][string]$Name,
  [Parameter(Mandatory)][string]$Prompt,
  [string]$Scenario = '',
  [int]$Budget = 2
)
$root = "$env:TEMP\skill-eval"
$sb = "$root\sandbox-claude"
$out = "$root\results"; New-Item -ItemType Directory -Force $out | Out-Null
$ghLog = "$out\$Name.gh.log"; Remove-Item $ghLog -ErrorAction SilentlyContinue
$env:GH_MOCK_LOG = $ghLog
$env:GH_MOCK_SCENARIO = $Scenario
$env:GH_MOCK_DIR = "$root\mock"
$oldPath = $env:PATH
$safe = ($env:PATH -split ';' | Where-Object { $_ -and -not (Test-Path (Join-Path $_ 'gh.exe')) -and -not (Test-Path (Join-Path $_ 'gh.cmd')) }) -join ';'
$env:PATH = "$root\mock-bin;$safe"
Push-Location $sb
try {
  $raw = claude -p $Prompt --setting-sources project --strict-mcp-config --no-session-persistence `
    --tools "Skill,Read,Grep,Glob,Bash,Edit,Write" --permission-mode acceptEdits --allowedTools "Skill" "Read" "Grep" "Glob" "Edit" "Write" "Bash" `
    --permission-prompts none --max-budget-usd $Budget --output-format stream-json --verbose 2>&1 | Out-String
} finally { Pop-Location; $env:PATH = $oldPath }
$raw | Set-Content "$out\$Name.raw.jsonl" -Encoding utf8
$events = foreach ($l in ($raw -split "`r?`n")) { if ($l.StartsWith('{')) { try { $l | ConvertFrom-Json } catch {} } }
$skills = @(); $cmds = @(); $other = @()
foreach ($e in $events) {
  if ($e.type -eq 'assistant') {
    foreach ($b in $e.message.content) {
      if ($b.type -eq 'tool_use') {
        if ($b.name -eq 'Skill') { $skills += ($b.input.skill ?? $b.input.name ?? ($b.input | ConvertTo-Json -Compress)) }
        elseif ($b.name -eq 'Bash') { $cmds += $b.input.command }
        else { $other += "$($b.name): " + (($b.input | ConvertTo-Json -Compress -Depth 4)) }
      }
    }
  }
}
$result = ($events | Where-Object { $_.type -eq 'result' } | Select-Object -Last 1)
$summary = [ordered]@{
  name = $Name; prompt = $Prompt; scenario = $Scenario
  version = ($events | Where-Object { $_.subtype -eq 'init' } | Select-Object -First 1).claude_code_version
  model = ($events | Where-Object { $_.subtype -eq 'init' } | Select-Object -First 1).model
  skills_loaded = $skills; bash_commands = $cmds; other_tool_calls = $other
  gh_calls = @(if (Test-Path $ghLog) { Get-Content $ghLog })
  denied = @($result.permission_denials | ForEach-Object { "$($_.tool_name): " + ($_.tool_input | ConvertTo-Json -Compress -Depth 3) })
  final_text = $result.result; turns = $result.num_turns; cost_usd = $result.total_cost_usd; is_error = $result.is_error
}
$summary | ConvertTo-Json -Depth 6 | Set-Content "$out\$Name.summary.json" -Encoding utf8
[pscustomobject]$summary
