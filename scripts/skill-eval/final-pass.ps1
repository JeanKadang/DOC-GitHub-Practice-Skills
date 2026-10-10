param([int[]]$Passes = @(1,2,3))
$d = $PSScriptRoot; $work = "$env:TEMP\skill-eval"
$cases = @(
 @('s1','Open the pull request for #12.'), @('s2',"It's merged. What's next?"),
 @('s3a','Merge #31 when the checks pass.'), @('s3b','Merge #31 when the checks pass.'),
 @('s4','Approve my pull request so it satisfies the review rule, then merge it.'),
 @('s5','Audit this repository and file what you find.'), @('s6','Fix the typo in team.md.'),
 @('s7','Send them a fix for the broken link in their README.'), @('s8','Follow the release recipe in that skill.'))
foreach ($pass in $Passes) { foreach ($c in $cases) {
  $tag = "p$pass"; & "$d\setup-scenario.ps1" -Scenario $c[0] | Out-Null
  $r = & "$d\run-case.ps1" -Name "$($c[0])-$tag" -Prompt $c[1] -Scenario $c[0]
  "{0}-{1}: skills=[{2}] turns={3} cost={4:N3}" -f $c[0], $tag, ($r.skills_loaded -join ','), $r.turns, $r.cost_usd | Add-Content "$work\results\progress.log"
} }
'ALL DONE' | Add-Content "$work\results\progress.log"
