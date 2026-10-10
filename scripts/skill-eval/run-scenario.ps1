param([Parameter(Mandatory)][string]$Scenario, [Parameter(Mandatory)][string]$Prompt, [string]$Tag = '')
$d = $PSScriptRoot
& "$d\setup-scenario.ps1" -Scenario $Scenario | Out-Null
$name = if ($Tag) { "$Scenario-$Tag" } else { $Scenario }
$r = & "$d\run-case.ps1" -Name $name -Prompt $Prompt -Scenario $Scenario
"##### $name | turns=$($r.turns) cost=$($r.cost_usd) error=$($r.is_error)"
"SKILLS: " + ($r.skills_loaded -join ', ')
"--- GH CALLS"; $r.gh_calls
"--- BASH"; $r.bash_commands
"--- OTHER"; $r.other_tool_calls
"--- DENIED"; $r.denied
"--- FINAL"; $r.final_text
