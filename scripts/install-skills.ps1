[CmdletBinding()]
param(
    [ValidateSet('Codex', 'Claude', 'Both')]
    [string]$Target = 'Both',
    [string]$SourceRoot = (Split-Path $PSScriptRoot -Parent),
    [string]$CodexHome = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex'),
    [string]$ClaudeHome = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.claude'),
    [switch]$DryRun,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$markerName = '.doc-github-practice-skills.json'
$packageName = 'doc-github-practice-skills'
$canonicalRequiredFiles = [ordered]@{
    'github-for-ado-users' = @('SKILL.md', 'agents/openai.yaml')
    'github-hygiene' = @('SKILL.md', 'agents/openai.yaml')
    'github-issue-first' = @('SKILL.md', 'agents/openai.yaml')
    'github-pr-review' = @('SKILL.md', 'agents/openai.yaml')
    'github-projects' = @('SKILL.md', 'agents/openai.yaml')
    'github-repo-bootstrap' = @('SKILL.md', 'agents/openai.yaml')
    'github-repo-review' = @('SKILL.md', 'agents/openai.yaml', 'review-prompt.md')
    'github-security-response' = @('SKILL.md', 'agents/openai.yaml')
}
$expectedSkillNames = @($canonicalRequiredFiles.Keys)

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

function Assert-NoReparseInExistingAncestry {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Description
    )

    $currentPath = Get-FullPath -Path $Path
    while (-not [string]::IsNullOrEmpty($currentPath)) {
        if (Test-Path -LiteralPath $currentPath) {
            $item = Get-Item -LiteralPath $currentPath -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "$Description contains a reparse point: $currentPath"
            }
        }
        $parentPath = [IO.Path]::GetDirectoryName($currentPath)
        if ([string]::IsNullOrEmpty($parentPath) -or
            $parentPath.Equals($currentPath, [StringComparison]::OrdinalIgnoreCase)) {
            break
        }
        $currentPath = $parentPath
    }
}

function Assert-PathWithin {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Parent,
        [Parameter(Mandatory)][string]$Description
    )

    $fullPath = Get-FullPath -Path $Path
    $fullParent = Get-FullPath -Path $Parent
    $parentPrefix = $fullParent + [IO.Path]::DirectorySeparatorChar
    if (-not $fullPath.StartsWith($parentPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "$Description is outside its intended parent: $fullPath"
    }
}

function Assert-SafeTargetPaths {
    param(
        [Parameter(Mandatory)]$Plan,
        [string]$Destination,
        [string]$BackupPath
    )

    Assert-NoReparseInExistingAncestry -Path $Plan.SkillRoot -Description "$($Plan.Name) skill root"
    if (-not [string]::IsNullOrEmpty($Destination)) {
        Assert-PathWithin -Path $Destination -Parent $Plan.SkillRoot -Description "$($Plan.Name) skill destination"
        Assert-NoReparseInExistingAncestry -Path $Destination -Description "$($Plan.Name) skill destination"
    }
    if (-not [string]::IsNullOrEmpty($BackupPath)) {
        $backupRoot = Join-Path $Plan.PlatformPath 'skill-backups'
        $backupParent = [IO.Path]::GetDirectoryName($BackupPath)
        Assert-PathWithin -Path $BackupPath -Parent $backupRoot -Description "$($Plan.Name) backup path"
        Assert-NoReparseInExistingAncestry -Path $backupParent -Description "$($Plan.Name) backup parent"
        Assert-NoReparseInExistingAncestry -Path $BackupPath -Description "$($Plan.Name) backup path"
    }
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

    $markerProperties = @(Get-OrdinalSortedStrings -Values $marker.psobject.Properties.Name)
    $expectedMarkerProperties = @(Get-OrdinalSortedStrings -Values @(
        'schemaVersion', 'packageName', 'packageVersion', 'skillName', 'requiredFiles'
    ))
    if (($markerProperties -join "`n") -ne ($expectedMarkerProperties -join "`n") -or
        $marker.schemaVersion -ne 1 -or
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
        $sourceFile = Join-Path $resolvedSource (Join-Path 'skills' (Join-Path $Skill.name $relativeFile))
        $sourceHash = Get-FileHashHex -LiteralPath $sourceFile
        if ($recordedHash -notmatch '^[0-9a-fA-F]{64}$' -or
            $recordedHash -ne $sourceHash -or
            (Get-FileHashHex -LiteralPath $installedFile) -ne $sourceHash) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: hash mismatch for '$relativeFile'" }
        }
    }

    return [pscustomobject]@{ Valid = $true; Reason = $null }
}

# Validate the complete canonical source before inspecting or creating destinations.
if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
    throw "Source repository does not exist: $SourceRoot"
}
$sourcePath = Get-FullPath -Path $SourceRoot
Assert-NoReparseInExistingAncestry -Path $sourcePath -Description 'Source repository path'
$resolvedSource = (Resolve-Path -LiteralPath $sourcePath).Path.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
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
    if ([IO.Path]::GetFileName($skill.name) -ne $skill.name -or
        -not $canonicalRequiredFiles.Contains($skill.name) -or
        $skill.requiredFiles -is [string] -or
        @($skill.requiredFiles).Count -eq 0) {
        throw "Source inventory contains an unsafe skill entry: $($skill.name)"
    }

    $requiredFiles = [string[]]@($skill.requiredFiles)
    $uniqueRequiredFiles = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($relativeFile in $requiredFiles) {
        if ([string]::IsNullOrWhiteSpace($relativeFile) -or
            [IO.Path]::IsPathRooted($relativeFile) -or
            $relativeFile -split '[\\/]' -contains '..' -or
            -not $uniqueRequiredFiles.Add($relativeFile)) {
            throw "Source inventory contains an unsafe required path: $relativeFile"
        }
    }

    $actualRequiredFiles = @(Get-OrdinalSortedStrings -Values $requiredFiles)
    $expectedRequiredFiles = @(Get-OrdinalSortedStrings -Values $canonicalRequiredFiles[$skill.name])
    if (($actualRequiredFiles -join "`n") -cne ($expectedRequiredFiles -join "`n")) {
        throw "Source inventory requiredFiles are not canonical for '$($skill.name)'."
    }

    $skillSourceRoot = Get-FullPath -Path (Join-Path $resolvedSource (Join-Path 'skills' $skill.name))
    if (-not (Test-Path -LiteralPath $skillSourceRoot -PathType Container)) {
        throw "Source skill directory is missing: $skillSourceRoot"
    }
    Assert-NoReparseInExistingAncestry -Path $skillSourceRoot -Description "Source skill '$($skill.name)'"
    foreach ($relativeFile in $requiredFiles) {
        $requiredPath = Get-FullPath -Path (Join-Path $skillSourceRoot $relativeFile)
        $skillPrefix = $skillSourceRoot + [IO.Path]::DirectorySeparatorChar
        if (-not $requiredPath.StartsWith($skillPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Source inventory required file escapes its skill tree: $relativeFile"
        }
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw "Source inventory required file is missing: $requiredPath"
        }
        Assert-NoReparseInExistingAncestry -Path $requiredPath -Description "Source required file '$relativeFile'"
        $requiredItem = Get-Item -LiteralPath $requiredPath -Force
        if ($requiredItem.PSIsContainer -or
            ($requiredItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Source required file is not a regular file: $requiredPath"
        }
    }
}

$targetSpecs = @()
if ($Target -in @('Codex', 'Both')) {
    $platformPath = Get-FullPath -Path $CodexHome
    $targetSpecs += [pscustomobject]@{
        Name = 'Codex'
        PlatformPath = $platformPath
        SkillRoot = Join-Path $platformPath 'skills'
    }
}
if ($Target -in @('Claude', 'Both')) {
    $platformPath = Get-FullPath -Path $ClaudeHome
    $targetSpecs += [pscustomobject]@{
        Name = 'Claude'
        PlatformPath = $platformPath
        SkillRoot = Join-Path $platformPath 'skills'
    }
}

foreach ($spec in $targetSpecs) {
    Assert-NoReparseInExistingAncestry -Path $spec.PlatformPath -Description "$($spec.Name) platform-home path"
    Assert-NoReparseInExistingAncestry -Path $spec.SkillRoot -Description "$($spec.Name) skill root"
    if (Test-PathOverlap -Left $resolvedSource -Right $spec.PlatformPath) {
        throw "Source and destination paths overlap: $resolvedSource and $($spec.PlatformPath)"
    }
}

for ($leftIndex = 0; $leftIndex -lt $targetSpecs.Count; $leftIndex++) {
    for ($rightIndex = $leftIndex + 1; $rightIndex -lt $targetSpecs.Count; $rightIndex++) {
        $leftSpec = $targetSpecs[$leftIndex]
        $rightSpec = $targetSpecs[$rightIndex]
        foreach ($leftPath in @($leftSpec.PlatformPath, $leftSpec.SkillRoot)) {
            foreach ($rightPath in @($rightSpec.PlatformPath, $rightSpec.SkillRoot)) {
                if (Test-PathOverlap -Left $leftPath -Right $rightPath) {
                    throw "Selected target paths overlap: $($leftSpec.Name) '$leftPath' and $($rightSpec.Name) '$rightPath'"
                }
            }
        }
    }
}

$backupTimestamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')
$plans = @()
foreach ($spec in $targetSpecs) {
    $skillRoot = $spec.SkillRoot
    $replacements = @()
    foreach ($skill in $inventory.skills) {
        $destination = Get-FullPath -Path (Join-Path $skillRoot $skill.name)
        Assert-PathWithin -Path $destination -Parent $skillRoot -Description "$($spec.Name) skill destination"
        Assert-NoReparseInExistingAncestry -Path $destination -Description "$($spec.Name) skill destination"
        if (Test-Path -LiteralPath $destination) {
            $installedMarker = Join-Path $destination $markerName
            if (Test-Path -LiteralPath $installedMarker) {
                Assert-PathWithin -Path $installedMarker -Parent $destination -Description "$($spec.Name) installed marker"
                Assert-NoReparseInExistingAncestry -Path $installedMarker -Description "$($spec.Name) installed marker"
            }
            foreach ($relativeFile in $skill.requiredFiles) {
                $installedRequiredFile = Get-FullPath -Path (Join-Path $destination $relativeFile)
                Assert-PathWithin -Path $installedRequiredFile -Parent $destination -Description "$($spec.Name) installed required file"
                if (Test-Path -LiteralPath $installedRequiredFile) {
                    Assert-NoReparseInExistingAncestry -Path $installedRequiredFile -Description "$($spec.Name) installed required file"
                }
            }
            $tracked = Test-TrackedSkill -SkillPath $destination -Skill $skill -Inventory $inventory
            if (-not $tracked.Valid -and -not $Force) {
                throw $tracked.Reason
            }
            $backupPath = Join-Path $spec.PlatformPath (Join-Path 'skill-backups' (Join-Path $backupTimestamp $skill.name))
            $backupRoot = Join-Path $spec.PlatformPath 'skill-backups'
            $backupParent = [IO.Path]::GetDirectoryName($backupPath)
            Assert-PathWithin -Path $backupPath -Parent $backupRoot -Description "$($spec.Name) backup path"
            Assert-NoReparseInExistingAncestry -Path $backupParent -Description "$($spec.Name) backup parent"
            Assert-NoReparseInExistingAncestry -Path $backupPath -Description "$($spec.Name) backup path"
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
        StageParent = [IO.Path]::GetDirectoryName($spec.PlatformPath)
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

$ownedStages = [Collections.Generic.List[object]]::new()
try {
    # Stage every selected target completely before changing either target.
    foreach ($plan in $plans) {
        New-Item -ItemType Directory -Path $plan.StageParent -Force | Out-Null
        Assert-NoReparseInExistingAncestry -Path $plan.StageParent -Description "$($plan.Name) staging parent"
        if (Test-Path -LiteralPath $plan.StagePath) {
            throw "Installer staging path already exists: $($plan.StagePath)"
        }
        New-Item -ItemType Directory -Path $plan.StagePath | Out-Null
        $ownedStages.Add([pscustomobject]@{ Path = $plan.StagePath; Parent = $plan.StageParent })
        foreach ($skill in $inventory.skills) {
            $stagedSkill = Join-Path $plan.StagePath $skill.name
            Copy-Item -LiteralPath (Join-Path $resolvedSource (Join-Path 'skills' $skill.name)) -Destination $stagedSkill -Recurse
            Set-Content -LiteralPath (Join-Path $stagedSkill $markerName) -Value (Get-MarkerJson -Inventory $inventory -Skill $skill) -NoNewline -Encoding utf8
        }
    }

    foreach ($plan in $plans) {
        Assert-SafeTargetPaths -Plan $plan
        New-Item -ItemType Directory -Path $plan.SkillRoot -Force | Out-Null
        Assert-SafeTargetPaths -Plan $plan
        foreach ($skill in $inventory.skills) {
            $destination = Join-Path $plan.SkillRoot $skill.name
            $replacement = $plan.Replacements | Where-Object { $_.Skill.name -eq $skill.name }
            if ($null -ne $replacement) {
                if ($Force) {
                    $backupParent = [IO.Path]::GetDirectoryName($replacement.BackupPath)
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination -BackupPath $replacement.BackupPath
                    New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination -BackupPath $replacement.BackupPath
                    Move-Item -LiteralPath $replacement.Destination -Destination $replacement.BackupPath
                }
                else {
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination
                    Remove-Item -LiteralPath $replacement.Destination -Recurse
                }
            }
            Assert-SafeTargetPaths -Plan $plan -Destination $destination
            Move-Item -LiteralPath (Join-Path $plan.StagePath $skill.name) -Destination $destination
        }
    }
}
finally {
    foreach ($ownedStage in $ownedStages) {
        if (Test-Path -LiteralPath $ownedStage.Path -PathType Container) {
            $resolvedStage = (Resolve-Path -LiteralPath $ownedStage.Path).Path
            $resolvedParent = (Resolve-Path -LiteralPath $ownedStage.Parent).Path
            $stageItem = Get-Item -LiteralPath $resolvedStage -Force
            $isOwnedName = [IO.Path]::GetFileName($resolvedStage) -match '^\.doc-github-practice-skills-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            $isDirectChild = [IO.Path]::GetDirectoryName($resolvedStage).Equals(
                $resolvedParent,
                [StringComparison]::OrdinalIgnoreCase
            )
            $isReparse = ($stageItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
            if ($isOwnedName -and $isDirectChild -and -not $isReparse) {
                Remove-Item -LiteralPath $resolvedStage -Recurse -Force
            }
        }
    }
}

Write-Output "Installed 8 skills to: $($targetSpecs.Name -join ', ')"
