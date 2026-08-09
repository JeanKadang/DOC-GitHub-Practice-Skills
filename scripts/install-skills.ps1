[CmdletBinding()]
param(
    [ValidateSet('Codex', 'Claude', 'Both')]
    [string]$Target = 'Both',
    [Parameter(Mandatory)]
    [string]$SourceRoot,
    [string]$CodexHome = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex'),
    [string]$ClaudeHome = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.claude'),
    [switch]$DryRun,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$markerName = '.doc-github-practice-skills.json'
$packageName = 'doc-github-practice-skills'
$expectedSkillNames = @(
    'github-for-ado-users'
    'github-hygiene'
    'github-issue-first'
    'github-pr-review'
    'github-projects'
    'github-repo-bootstrap'
    'github-repo-review'
    'github-security-response'
)

function Get-FullPath {
    param([Parameter(Mandatory)][string]$Path)
    return [IO.Path]::GetFullPath($Path).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
}

function Test-PathOverlap {
    param(
        [Parameter(Mandatory)][string]$Left,
        [Parameter(Mandatory)][string]$Right
    )

    $separator = [IO.Path]::DirectorySeparatorChar
    $leftPrefix = $Left + $separator
    $rightPrefix = $Right + $separator
    return $Left.Equals($Right, [StringComparison]::OrdinalIgnoreCase) -or
        $Left.StartsWith($rightPrefix, [StringComparison]::OrdinalIgnoreCase) -or
        $Right.StartsWith($leftPrefix, [StringComparison]::OrdinalIgnoreCase)
}

function Get-FileHashHex {
    param([Parameter(Mandatory)][string]$LiteralPath)
    return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-OrdinalSortedStrings {
    param([Parameter(Mandatory)][object[]]$Values)
    $sorted = [string[]]@($Values)
    [Array]::Sort($sorted, [StringComparer]::Ordinal)
    return $sorted
}

function Get-MarkerJson {
    param(
        [Parameter(Mandatory)]$Inventory,
        [Parameter(Mandatory)]$Skill
    )

    $hashes = [ordered]@{}
    foreach ($relativeFile in @(Get-OrdinalSortedStrings -Values $Skill.requiredFiles)) {
        $sourceFile = Join-Path $resolvedSource (Join-Path 'skills' (Join-Path $Skill.name $relativeFile))
        $hashes[$relativeFile] = Get-FileHashHex -LiteralPath $sourceFile
    }

    $marker = [ordered]@{
        schemaVersion = 1
        packageName = $packageName
        packageVersion = $Inventory.packageVersion
        skillName = $Skill.name
        requiredFiles = $hashes
    }
    return ($marker | ConvertTo-Json -Depth 6) + "`n"
}

function Test-TrackedSkill {
    param(
        [Parameter(Mandatory)][string]$SkillPath,
        [Parameter(Mandatory)]$Skill,
        [Parameter(Mandatory)]$Inventory
    )

    $markerPath = Join-Path $SkillPath $markerName
    if (-not (Test-Path -LiteralPath $SkillPath -PathType Container) -or
        -not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        return [pscustomobject]@{ Valid = $false; Reason = "untracked existing skill '$($Skill.name)' has no valid marker" }
    }

    try {
        $marker = Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
    }
    catch {
        return [pscustomobject]@{ Valid = $false; Reason = "untracked existing skill '$($Skill.name)' has an invalid marker" }
    }

    if ($marker.schemaVersion -ne 1 -or
        $marker.packageName -ne $packageName -or
        $marker.packageVersion -ne $Inventory.packageVersion -or
        $marker.skillName -ne $Skill.name) {
        return [pscustomobject]@{ Valid = $false; Reason = "untracked existing skill '$($Skill.name)' has a non-matching marker" }
    }

    $markerKeys = @(Get-OrdinalSortedStrings -Values $marker.requiredFiles.psobject.Properties.Name)
    $requiredKeys = @(Get-OrdinalSortedStrings -Values $Skill.requiredFiles)
    if (($markerKeys -join "`n") -ne ($requiredKeys -join "`n")) {
        return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' has invalid hash data" }
    }

    foreach ($relativeFile in $requiredKeys) {
        $installedFile = Join-Path $SkillPath $relativeFile
        if (-not (Test-Path -LiteralPath $installedFile -PathType Leaf)) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: missing '$relativeFile'" }
        }
        $recordedHash = $marker.requiredFiles.psobject.Properties[$relativeFile].Value
        if ((Get-FileHashHex -LiteralPath $installedFile) -ne $recordedHash) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: hash mismatch for '$relativeFile'" }
        }
    }

    return [pscustomobject]@{ Valid = $true; Reason = $null }
}

# Validate the complete canonical source before inspecting or creating destinations.
if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
    throw "Source repository does not exist: $SourceRoot"
}
$resolvedSource = (Resolve-Path -LiteralPath $SourceRoot).Path.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$inventoryPath = Join-Path $resolvedSource 'contracts\skill-inventory.json'
if (-not (Test-Path -LiteralPath $inventoryPath -PathType Leaf)) {
    throw "Source inventory is missing: $inventoryPath"
}

try {
    $inventory = Get-Content -LiteralPath $inventoryPath -Raw | ConvertFrom-Json
}
catch {
    throw "Source inventory is invalid JSON: $($_.Exception.Message)"
}

$inventoryNames = @($inventory.skills.name | Sort-Object)
if ($inventory.schemaVersion -ne 1 -or
    [string]::IsNullOrWhiteSpace([string]$inventory.packageVersion) -or
    $inventoryNames.Count -ne 8 -or
    (($inventoryNames -join "`n") -ne (($expectedSkillNames | Sort-Object) -join "`n"))) {
    throw 'Source inventory does not contain the canonical eight-skill inventory.'
}

foreach ($skill in $inventory.skills) {
    if ([IO.Path]::GetFileName($skill.name) -ne $skill.name -or @($skill.requiredFiles).Count -eq 0) {
        throw "Source inventory contains an unsafe skill entry: $($skill.name)"
    }
    foreach ($relativeFile in @($skill.requiredFiles)) {
        if ([IO.Path]::IsPathRooted($relativeFile) -or $relativeFile -split '[\\/]' -contains '..') {
            throw "Source inventory contains an unsafe required path: $relativeFile"
        }
        $requiredPath = Join-Path $resolvedSource (Join-Path 'skills' (Join-Path $skill.name $relativeFile))
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw "Source inventory required file is missing: $requiredPath"
        }
    }
}

$targetSpecs = @()
if ($Target -in @('Codex', 'Both')) {
    $targetSpecs += [pscustomobject]@{ Name = 'Codex'; PlatformPath = Get-FullPath -Path $CodexHome }
}
if ($Target -in @('Claude', 'Both')) {
    $targetSpecs += [pscustomobject]@{ Name = 'Claude'; PlatformPath = Get-FullPath -Path $ClaudeHome }
}

foreach ($spec in $targetSpecs) {
    if (Test-PathOverlap -Left $resolvedSource -Right $spec.PlatformPath) {
        throw "Source and destination paths overlap: $resolvedSource and $($spec.PlatformPath)"
    }
}

$backupTimestamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')
$plans = @()
foreach ($spec in $targetSpecs) {
    $skillRoot = Join-Path $spec.PlatformPath 'skills'
    $replacements = @()
    foreach ($skill in $inventory.skills) {
        $destination = Join-Path $skillRoot $skill.name
        if (Test-Path -LiteralPath $destination) {
            $tracked = Test-TrackedSkill -SkillPath $destination -Skill $skill -Inventory $inventory
            if (-not $tracked.Valid -and -not $Force) {
                throw $tracked.Reason
            }
            $backupPath = Join-Path $spec.PlatformPath (Join-Path 'skill-backups' (Join-Path $backupTimestamp $skill.name))
            if ($Force -and (Test-Path -LiteralPath $backupPath)) {
                throw "Backup path already exists: $backupPath"
            }
            $replacements += [pscustomobject]@{
                Skill = $skill
                Destination = $destination
                BackupPath = $backupPath
            }
        }
    }
    $plans += [pscustomobject]@{
        Name = $spec.Name
        PlatformPath = $spec.PlatformPath
        SkillRoot = $skillRoot
        Replacements = $replacements
        StagePath = Join-Path ([IO.Path]::GetDirectoryName($spec.PlatformPath)) ('.doc-github-practice-skills-' + [guid]::NewGuid().ToString())
    }
}

if ($DryRun) {
    Write-Output "Source: $resolvedSource"
    Write-Output "Skills (8): $($inventoryNames -join ', ')"
    foreach ($plan in $plans) {
        Write-Output "Target: $($plan.Name) -> $($plan.SkillRoot)"
        foreach ($skill in $inventory.skills) {
            $replacement = $plan.Replacements | Where-Object { $_.Skill.name -eq $skill.name }
            if ($null -ne $replacement) {
                Write-Output "  $($skill.name): overwrite; backup: $($replacement.BackupPath)"
            }
            else {
                Write-Output "  $($skill.name): install; backup: none"
            }
        }
    }
    exit 0
}

$ownedStages = [Collections.Generic.List[string]]::new()
try {
    # Stage every selected target completely before changing either target.
    foreach ($plan in $plans) {
        New-Item -ItemType Directory -Path $plan.StagePath -Force | Out-Null
        $ownedStages.Add($plan.StagePath)
        foreach ($skill in $inventory.skills) {
            $stagedSkill = Join-Path $plan.StagePath $skill.name
            Copy-Item -LiteralPath (Join-Path $resolvedSource (Join-Path 'skills' $skill.name)) -Destination $stagedSkill -Recurse
            Set-Content -LiteralPath (Join-Path $stagedSkill $markerName) -Value (Get-MarkerJson -Inventory $inventory -Skill $skill) -NoNewline -Encoding utf8
        }
    }

    foreach ($plan in $plans) {
        New-Item -ItemType Directory -Path $plan.SkillRoot -Force | Out-Null
        foreach ($skill in $inventory.skills) {
            $replacement = $plan.Replacements | Where-Object { $_.Skill.name -eq $skill.name }
            if ($null -ne $replacement) {
                if ($Force) {
                    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($replacement.BackupPath)) -Force | Out-Null
                    Move-Item -LiteralPath $replacement.Destination -Destination $replacement.BackupPath
                }
                else {
                    Remove-Item -LiteralPath $replacement.Destination -Recurse
                }
            }
            Move-Item -LiteralPath (Join-Path $plan.StagePath $skill.name) -Destination (Join-Path $plan.SkillRoot $skill.name)
        }
    }
}
finally {
    foreach ($stagePath in $ownedStages) {
        if ($stagePath -match '\.doc-github-practice-skills-[0-9a-f-]{36}$' -and
            (Test-Path -LiteralPath $stagePath -PathType Container)) {
            Remove-Item -LiteralPath $stagePath -Recurse -Force
        }
    }
}

Write-Output "Installed 8 skills to: $($targetSpecs.Name -join ', ')"
