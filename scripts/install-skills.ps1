[CmdletBinding()]
param(
    [ValidateSet('Codex', 'Claude', 'Copilot', 'ChatGPT', 'Both')]
    [string]$Target = 'Both',
    [string]$SourceRoot = (Split-Path $PSScriptRoot -Parent),
    [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex' }),
    [string]$ClaudeHome = $(if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.claude' }),
    [string]$CopilotHome = $(if ($env:COPILOT_HOME) { $env:COPILOT_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.copilot' }),
    [string]$ChatGPTExportPath = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'chatgpt-skills-export'),
    [ValidateRange(-1, 1000)]
    [int]$KeepBackups = -1,
    [switch]$DryRun,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$markerName = '.doc-github-practice-skills.json'
$packageName = 'doc-github-practice-skills'
$canonicalRequiredFiles = [ordered]@{
    'github-contributing' = @('SKILL.md', 'agents/openai.yaml')
    'github-for-ado-users' = @('SKILL.md', 'agents/openai.yaml')
    'github-for-gitlab-users' = @('SKILL.md', 'agents/openai.yaml')
    'github-hygiene' = @('SKILL.md', 'agents/openai.yaml')
    'github-issue-first' = @('SKILL.md', 'agents/openai.yaml')
    'github-pr-review' = @('SKILL.md', 'agents/openai.yaml')
    'github-projects' = @('SKILL.md', 'agents/openai.yaml')
    'github-releases' = @('SKILL.md', 'agents/openai.yaml')
    'github-repo-bootstrap' = @('SKILL.md', 'agents/openai.yaml')
    'github-repo-configure' = @('SKILL.md', 'agents/openai.yaml', 'templates/bug.yml', 'templates/improvement.yml', 'templates/config.yml', 'templates/pull_request_template.md')
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
    # Walks upward from $Path checking each existing ancestor for a reparse
    # point (junction/symlink), but only up to and including $StopAt - never
    # past it. $StopAt must be the nearest ancestor this script itself owns
    # (SourceRoot on the source side; a target's PlatformPath on the
    # destination side) or, when there is no such ancestor (checking a root
    # itself, e.g. PlatformPath or the resolved SourceRoot), $Path itself.
    #
    # This bound is deliberate, not an oversight: a reparse point *above* the
    # nearest script-owned root is out of this guard's threat model. macOS
    # symlinks /var, /tmp, and /etc at the OS level (unrelated to any specific
    # install) - walking that far up produced a false positive on every macOS
    # path under those roots (#23) with no corresponding security benefit,
    # since this script never reads from or writes to anything above the
    # root it was told to operate on. If an attacker already controls a
    # directory that far up the tree (e.g. /Users or C:\Users itself), the
    # machine is compromised well beyond anything a per-invocation ancestry
    # check could meaningfully defend against. What this still catches:
    # a reparse point planted anywhere between $Path and $StopAt inclusive -
    # e.g. `~/.claude/skills` redirected to another location, or a specific
    # skill's source directory replaced with a junction - which is the real,
    # actionable attack surface for this installer.
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Description,
        [Parameter(Mandatory)][string]$StopAt
    )

    $currentPath = Get-FullPath -Path $Path
    $stopAtPath = Get-FullPath -Path $StopAt
    while (-not [string]::IsNullOrEmpty($currentPath)) {
        if (Test-Path -LiteralPath $currentPath) {
            $item = Get-Item -LiteralPath $currentPath -Force
            if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw "$Description contains a reparse point: $currentPath"
            }
        }
        if ($currentPath.Equals($stopAtPath, [StringComparison]::OrdinalIgnoreCase)) {
            break
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

    Assert-NoReparseInExistingAncestry -Path $Plan.SkillRoot -Description "$($Plan.Name) skill root" -StopAt $Plan.PlatformPath
    if (-not [string]::IsNullOrEmpty($Destination)) {
        Assert-PathWithin -Path $Destination -Parent $Plan.SkillRoot -Description "$($Plan.Name) skill destination"
        Assert-NoReparseInExistingAncestry -Path $Destination -Description "$($Plan.Name) skill destination" -StopAt $Plan.PlatformPath
    }
    if (-not [string]::IsNullOrEmpty($BackupPath)) {
        $backupRoot = Join-Path $Plan.PlatformPath 'skill-backups'
        $backupParent = [IO.Path]::GetDirectoryName($BackupPath)
        Assert-PathWithin -Path $BackupPath -Parent $backupRoot -Description "$($Plan.Name) backup path"
        Assert-NoReparseInExistingAncestry -Path $backupParent -Description "$($Plan.Name) backup parent" -StopAt $Plan.PlatformPath
        Assert-NoReparseInExistingAncestry -Path $BackupPath -Description "$($Plan.Name) backup path" -StopAt $Plan.PlatformPath
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

function Get-RelativeEntries {
    # Lists every file and directory under $Root as a '/'-separated relative
    # path. Does not descend into reparse points, so a planted junction cannot
    # make the walk leave the skill directory.
    param(
        [Parameter(Mandatory)][string]$Root,
        [string]$Prefix = ''
    )

    $current = if ($Prefix) { Join-Path $Root $Prefix } else { $Root }
    foreach ($item in @(Get-ChildItem -LiteralPath $current -Force)) {
        $relative = if ($Prefix) { "$Prefix/$($item.Name)" } else { $item.Name }
        $relative
        if ($item.PSIsContainer -and -not ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            Get-RelativeEntries -Root $Root -Prefix $relative
        }
    }
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
        [string]::IsNullOrWhiteSpace([string]$marker.packageVersion) -or
        $marker.skillName -ne $Skill.name) {
        return [pscustomobject]@{ Valid = $false; Reason = "untracked existing skill '$($Skill.name)' has a non-matching marker" }
    }

    # A marker from the current release is checked against the current source,
    # which also exposes an edited marker. A marker from an earlier release is
    # checked against its own recorded hashes: the source has moved on, so the
    # only question is whether the user changed the installed files (#118).
    $isCurrent = ($marker.packageVersion -eq $Inventory.packageVersion)
    $markerKeys = @(Get-OrdinalSortedStrings -Values $marker.requiredFiles.psobject.Properties.Name)
    $requiredKeys = @(Get-OrdinalSortedStrings -Values $Skill.requiredFiles)
    if ($isCurrent) {
        if (($markerKeys -join "`n") -ne ($requiredKeys -join "`n")) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' has invalid hash data" }
        }
    }
    else {
        if ($markerKeys.Count -eq 0) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' has invalid hash data" }
        }
        foreach ($markerKey in $markerKeys) {
            if ([string]::IsNullOrWhiteSpace($markerKey) -or
                [IO.Path]::IsPathRooted($markerKey) -or
                (($markerKey -split '[\\/]') -contains '..')) {
                return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' has invalid hash data" }
            }
        }
    }

    foreach ($relativeFile in $markerKeys) {
        $installedFile = Join-Path $SkillPath $relativeFile
        if (-not (Test-Path -LiteralPath $installedFile -PathType Leaf)) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: missing '$relativeFile'" }
        }
        $recordedHash = $marker.requiredFiles.psobject.Properties[$relativeFile].Value
        if ($recordedHash -notmatch '^[0-9a-fA-F]{64}$' -or
            (Get-FileHashHex -LiteralPath $installedFile) -ne $recordedHash) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: hash mismatch for '$relativeFile'" }
        }
        if ($isCurrent) {
            $sourceFile = Join-Path $resolvedSource (Join-Path 'skills' (Join-Path $Skill.name $relativeFile))
            if ($recordedHash -ne (Get-FileHashHex -LiteralPath $sourceFile)) {
                return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: hash mismatch for '$relativeFile'" }
            }
        }
    }

    # An entry the release does not ship (and that is not the marker) is
    # user-added content. Treat it as a modification so an ordinary reinstall
    # cannot silently delete it (#140); -Force backs up the whole directory.
    $expectedEntries = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    if ($isCurrent) {
        $sourceSkillRoot = Join-Path $resolvedSource (Join-Path 'skills' $Skill.name)
        foreach ($relativeEntry in @(Get-RelativeEntries -Root $sourceSkillRoot)) {
            [void]$expectedEntries.Add($relativeEntry)
        }
    }
    else {
        foreach ($markerKey in $markerKeys) {
            $parts = @(($markerKey -replace '\\', '/') -split '/')
            for ($i = 1; $i -le $parts.Count; $i++) {
                [void]$expectedEntries.Add(($parts[0..($i - 1)] -join '/'))
            }
        }
    }
    [void]$expectedEntries.Add($markerName)
    foreach ($relativeEntry in @(Get-RelativeEntries -Root $SkillPath)) {
        if (-not $expectedEntries.Contains($relativeEntry)) {
            return [pscustomobject]@{ Valid = $false; Reason = "tracked skill '$($Skill.name)' is modified: unregistered added entry '$relativeEntry'" }
        }
    }

    return [pscustomobject]@{ Valid = $true; Reason = $null; IsCurrent = $isCurrent; InstalledVersion = [string]$marker.packageVersion }
}

function Get-PrunableBackupSets {
    # Backup sets are direct children of skill-backups named by the
    # timestamp format used below. Returns all but the newest $Keep of them.
    param(
        [Parameter(Mandatory)][string]$BackupRoot,
        [Parameter(Mandatory)][int]$Keep
    )

    if ($Keep -lt 0 -or -not (Test-Path -LiteralPath $BackupRoot -PathType Container)) {
        return @()
    }
    $sets = @(Get-ChildItem -LiteralPath $BackupRoot -Directory -Force |
        Where-Object {
            $_.Name -match '^\d{8}T\d{13}Z$' -and
            -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)
        } |
        Sort-Object -Property Name -Descending)
    if ($sets.Count -le $Keep) {
        return @()
    }
    return @($sets | Select-Object -Skip $Keep)
}

# Validate the complete canonical source before inspecting or creating destinations.
if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
    throw "Source repository does not exist: $SourceRoot"
}
$sourcePath = Get-FullPath -Path $SourceRoot
Assert-NoReparseInExistingAncestry -Path $sourcePath -Description 'Source repository path' -StopAt $sourcePath
$resolvedSource = (Resolve-Path -LiteralPath $sourcePath).Path.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$inventoryPath = Join-Path $resolvedSource (Join-Path 'contracts' 'skill-inventory.json')
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
    $inventoryNames.Count -ne $expectedSkillNames.Count -or
    (($inventoryNames -join "`n") -ne (($expectedSkillNames | Sort-Object) -join "`n"))) {
    throw "Source inventory does not contain the canonical $($expectedSkillNames.Count)-skill inventory."
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
    Assert-NoReparseInExistingAncestry -Path $skillSourceRoot -Description "Source skill '$($skill.name)'" -StopAt $resolvedSource
    foreach ($relativeFile in $requiredFiles) {
        $requiredPath = Get-FullPath -Path (Join-Path $skillSourceRoot $relativeFile)
        $skillPrefix = $skillSourceRoot + [IO.Path]::DirectorySeparatorChar
        if (-not $requiredPath.StartsWith($skillPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Source inventory required file escapes its skill tree: $relativeFile"
        }
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw "Source inventory required file is missing: $requiredPath"
        }
        Assert-NoReparseInExistingAncestry -Path $requiredPath -Description "Source required file '$relativeFile'" -StopAt $resolvedSource
        $requiredItem = Get-Item -LiteralPath $requiredPath -Force
        if ($requiredItem.PSIsContainer -or
            ($requiredItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Source required file is not a regular file: $requiredPath"
        }
    }
}

if ($Target -eq 'ChatGPT') {
    # ChatGPT has no local skill-directory discovery mechanism - there is no
    # per-tool "home" this script installs into. Instead it flattens every
    # skill's requiredFiles (skipping agents/openai.yaml, which is Codex-CLI
    # sidecar metadata, not policy content) into one directory of
    # individually-named files a human uploads as Custom GPT Knowledge. This
    # deliberately skips the per-skill-directory marker/backup machinery
    # below - an export folder isn't a persistent, driftable install the way
    # the other three targets are; it's a staging area regenerated before
    # each upload. See ADR 0006 and docs/chatgpt.md.
    #
    # The export carries a manifest.json (#127): package version, source
    # commit, and per file the original path and SHA-256. It is also how a
    # re-export knows which files it owns. Owned files are overwritten, owned
    # files the source no longer has are removed, and anything else in the
    # folder is left alone (and refused without -Force).
    $exportPath = Get-FullPath -Path $ChatGPTExportPath
    Assert-NoReparseInExistingAncestry -Path $exportPath -Description 'ChatGPT export path' -StopAt $exportPath
    if (Test-PathOverlap -Left $resolvedSource -Right $exportPath) {
        throw "Source and ChatGPT export path overlap: $resolvedSource and $exportPath"
    }

    $manifestName = 'manifest.json'
    $skillExportFiles = [ordered]@{}
    foreach ($skill in $inventory.skills) {
        foreach ($relativeFile in $skill.requiredFiles) {
            if ($relativeFile -eq 'agents/openai.yaml') {
                continue
            }
            $flatName = "$($skill.name)-$($relativeFile -replace '[\\/]', '-')"
            $skillExportFiles[$flatName] = [pscustomobject]@{
                Path = Join-Path $resolvedSource (Join-Path 'skills' (Join-Path $skill.name $relativeFile))
                Source = "skills/$($skill.name)/$($relativeFile -replace '\\', '/')"
            }
        }
    }
    $exportFiles = [ordered]@{}
    foreach ($name in $skillExportFiles.Keys) {
        $exportFiles[$name] = $skillExportFiles[$name]
    }
    $licensePath = Join-Path $resolvedSource 'LICENSE'
    if (Test-Path -LiteralPath $licensePath -PathType Leaf) {
        $exportFiles['LICENSE'] = [pscustomobject]@{ Path = $licensePath; Source = 'LICENSE' }
    }

    # Read the previous export's manifest, if it is one this script wrote.
    # Names must be plain file names so a tampered manifest cannot point a
    # later removal outside the export folder.
    $previousHashes = $null
    $previousManifestPath = Join-Path $exportPath $manifestName
    if (Test-Path -LiteralPath $previousManifestPath -PathType Leaf) {
        try {
            $previousManifest = Get-Content -LiteralPath $previousManifestPath -Raw | ConvertFrom-Json
            if ($previousManifest.schemaVersion -eq 1 -and
                $previousManifest.packageName -eq $packageName -and
                $null -ne $previousManifest.files) {
                $candidate = @{}
                $valid = $true
                foreach ($property in $previousManifest.files.psobject.Properties) {
                    $previousName = $property.Name
                    if ([string]::IsNullOrWhiteSpace($previousName) -or
                        $previousName -eq $manifestName -or
                        $previousName -eq '.' -or
                        $previousName -eq '..' -or
                        $previousName -ne [IO.Path]::GetFileName($previousName) -or
                        $previousName -match '[\\/]') {
                        $valid = $false
                        break
                    }
                    $candidate[$previousName] = [string]$property.Value.sha256
                }
                if ($valid) {
                    $previousHashes = $candidate
                }
            }
        }
        catch {
            $previousHashes = $null
        }
    }

    $newHashes = [ordered]@{}
    foreach ($name in $exportFiles.Keys) {
        $newHashes[$name] = Get-FileHashHex -LiteralPath $exportFiles[$name].Path
    }
    $added = @()
    $changed = @()
    $unchanged = @()
    $removed = @()
    if ($null -ne $previousHashes) {
        foreach ($name in $newHashes.Keys) {
            if (-not $previousHashes.ContainsKey($name)) { $added += $name }
            elseif ($previousHashes[$name] -ne $newHashes[$name]) { $changed += $name }
            else { $unchanged += $name }
        }
        foreach ($name in $previousHashes.Keys) {
            if (-not $newHashes.Contains($name)) { $removed += $name }
        }
    }
    $summaryLines = @()
    if ($null -ne $previousHashes) {
        if ($added.Count -gt 0) { $summaryLines += "  added: $((Get-OrdinalSortedStrings -Values $added) -join ', ')" }
        if ($changed.Count -gt 0) { $summaryLines += "  changed: $((Get-OrdinalSortedStrings -Values $changed) -join ', ')" }
        if ($removed.Count -gt 0) { $summaryLines += "  removed: $((Get-OrdinalSortedStrings -Values $removed) -join ', ')" }
        $summaryLines += "  unchanged: $($unchanged.Count)"
    }

    if ($DryRun) {
        Write-Output "Source: $resolvedSource"
        Write-Output "ChatGPT export -> $exportPath"
        Write-Output "Files ($($skillExportFiles.Count)):"
        foreach ($name in $skillExportFiles.Keys) {
            Write-Output "  $name"
        }
        Write-Output "Also written: $(@($exportFiles.Keys | Where-Object { -not $skillExportFiles.Contains($_) }) -join ', '), $manifestName"
        if ($null -ne $previousHashes) {
            Write-Output "Compared with the previous export:"
            $summaryLines | ForEach-Object { Write-Output $_ }
        }
        exit 0
    }

    if (Test-Path -LiteralPath $exportPath) {
        $owned = @()
        if ($null -ne $previousHashes) {
            $owned = @($previousHashes.Keys) + $manifestName
        }
        $unrelated = @(Get-ChildItem -LiteralPath $exportPath -Force -ErrorAction SilentlyContinue |
            Where-Object { $owned -notcontains $_.Name })
        if ($unrelated.Count -gt 0 -and -not $Force) {
            throw "ChatGPT export path already exists and is not empty: $exportPath contains $($unrelated.Count) file(s) this export does not own, e.g. '$($unrelated[0].Name)' (use -Force to write alongside them; they are never deleted)"
        }
    }
    New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
    Assert-NoReparseInExistingAncestry -Path $exportPath -Description 'ChatGPT export path' -StopAt $exportPath
    foreach ($name in $exportFiles.Keys) {
        $exportDestination = Join-Path $exportPath $name
        Assert-PathWithin -Path $exportDestination -Parent $exportPath -Description 'ChatGPT export file'
        Copy-Item -LiteralPath $exportFiles[$name].Path -Destination $exportDestination -Force
    }
    foreach ($name in $removed) {
        $staleDestination = Join-Path $exportPath $name
        Assert-PathWithin -Path $staleDestination -Parent $exportPath -Description 'ChatGPT export file'
        if (Test-Path -LiteralPath $staleDestination -PathType Leaf) {
            $staleItem = Get-Item -LiteralPath $staleDestination -Force
            if (($staleItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) {
                Remove-Item -LiteralPath $staleDestination -Force
            }
        }
    }

    $sourceCommit = $null
    try {
        $head = (& git -C $resolvedSource rev-parse HEAD 2>$null)
        if ($LASTEXITCODE -eq 0 -and ([string]$head) -match '^[0-9a-f]{40}$') {
            $sourceCommit = [string]$head
        }
    }
    catch {
        $sourceCommit = $null
    }
    $fileEntries = [ordered]@{}
    foreach ($name in @(Get-OrdinalSortedStrings -Values @($exportFiles.Keys))) {
        $fileEntries[$name] = [ordered]@{ source = $exportFiles[$name].Source; sha256 = $newHashes[$name] }
    }
    $exportManifest = [ordered]@{
        schemaVersion = 1
        packageName = $packageName
        packageVersion = $inventory.packageVersion
        sourceCommit = $sourceCommit
        files = $fileEntries
    }
    Set-Content -LiteralPath $previousManifestPath -Value (($exportManifest | ConvertTo-Json -Depth 6) + [Environment]::NewLine) -NoNewline -Encoding utf8

    Write-Output "Exported $($exportFiles.Count) files to: $exportPath"
    $summaryLines | ForEach-Object { Write-Output $_ }
    exit 0
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
if ($Target -eq 'Copilot') {
    $platformPath = Get-FullPath -Path $CopilotHome
    $targetSpecs += [pscustomobject]@{
        Name = 'Copilot'
        PlatformPath = $platformPath
        SkillRoot = Join-Path $platformPath 'skills'
    }
}

foreach ($spec in $targetSpecs) {
    Assert-NoReparseInExistingAncestry -Path $spec.PlatformPath -Description "$($spec.Name) platform-home path" -StopAt $spec.PlatformPath
    Assert-NoReparseInExistingAncestry -Path $spec.SkillRoot -Description "$($spec.Name) skill root" -StopAt $spec.PlatformPath
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
        Assert-NoReparseInExistingAncestry -Path $destination -Description "$($spec.Name) skill destination" -StopAt $spec.PlatformPath
        if (Test-Path -LiteralPath $destination) {
            $installedMarker = Join-Path $destination $markerName
            if (Test-Path -LiteralPath $installedMarker) {
                Assert-PathWithin -Path $installedMarker -Parent $destination -Description "$($spec.Name) installed marker"
                Assert-NoReparseInExistingAncestry -Path $installedMarker -Description "$($spec.Name) installed marker" -StopAt $spec.PlatformPath
            }
            foreach ($relativeFile in $skill.requiredFiles) {
                $installedRequiredFile = Get-FullPath -Path (Join-Path $destination $relativeFile)
                Assert-PathWithin -Path $installedRequiredFile -Parent $destination -Description "$($spec.Name) installed required file"
                if (Test-Path -LiteralPath $installedRequiredFile) {
                    Assert-NoReparseInExistingAncestry -Path $installedRequiredFile -Description "$($spec.Name) installed required file" -StopAt $spec.PlatformPath
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
            Assert-NoReparseInExistingAncestry -Path $backupParent -Description "$($spec.Name) backup parent" -StopAt $spec.PlatformPath
            Assert-NoReparseInExistingAncestry -Path $backupPath -Description "$($spec.Name) backup path" -StopAt $spec.PlatformPath
            if ($Force -and (Test-Path -LiteralPath $backupPath)) {
                throw "Backup path already exists: $backupPath"
            }
            $mode = if ($Force) { 'Backup' } elseif ($tracked.IsCurrent) { 'Skip' } else { 'Upgrade' }
            $replacements += [pscustomobject]@{
                Skill = $skill
                Destination = $destination
                BackupPath = $backupPath
                Mode = $mode
                InstalledVersion = $(if ($tracked.Valid) { $tracked.InstalledVersion } else { $null })
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
    Write-Output "Skills ($($inventoryNames.Count)): $($inventoryNames -join ', ')"
    foreach ($plan in $plans) {
        Write-Output "Target: $($plan.Name) -> $($plan.SkillRoot)"
        foreach ($skill in $inventory.skills) {
            $replacement = $plan.Replacements | Where-Object { $_.Skill.name -eq $skill.name }
            if ($null -ne $replacement) {
                switch ($replacement.Mode) {
                    'Backup' { Write-Output "  $($skill.name): overwrite; backup: $($replacement.BackupPath)" }
                    'Upgrade' { Write-Output "  $($skill.name): upgrade from v$($replacement.InstalledVersion) to v$($inventory.packageVersion); backup: none" }
                    default { Write-Output "  $($skill.name): already current; backup: none" }
                }
            }
            else {
                Write-Output "  $($skill.name): install; backup: none"
            }
        }
        if ($KeepBackups -ge 0) {
            $willBackUp = @($plan.Replacements | Where-Object { $_.Mode -eq 'Backup' }).Count -gt 0
            $existingKeep = if ($willBackUp) { [Math]::Max(0, $KeepBackups - 1) } else { $KeepBackups }
            $prunable = @(Get-PrunableBackupSets -BackupRoot (Join-Path $plan.PlatformPath 'skill-backups') -Keep $existingKeep)
            Write-Output "  Backups: keeping the newest $KeepBackups; would prune $($prunable.Count) existing set(s)"
        }
    }
    exit 0
}

$ownedStages = [Collections.Generic.List[object]]::new()
try {
    # Stage every selected target completely before changing either target.
    foreach ($plan in $plans) {
        New-Item -ItemType Directory -Path $plan.StageParent -Force | Out-Null
        Assert-NoReparseInExistingAncestry -Path $plan.StageParent -Description "$($plan.Name) staging parent" -StopAt $plan.StageParent
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
            if ($null -ne $replacement -and $replacement.Mode -eq 'Skip') {
                continue
            }
            if ($null -ne $replacement) {
                if ($replacement.Mode -eq 'Backup') {
                    $backupParent = [IO.Path]::GetDirectoryName($replacement.BackupPath)
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination -BackupPath $replacement.BackupPath
                    New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination -BackupPath $replacement.BackupPath
                    if (Test-Path -LiteralPath $replacement.BackupPath) {
                        throw "Backup destination appeared before exclusive move: $($replacement.BackupPath)"
                    }
                    [IO.Directory]::Move($replacement.Destination, $replacement.BackupPath)
                }
                else {
                    Assert-SafeTargetPaths -Plan $plan -Destination $replacement.Destination
                    Remove-Item -LiteralPath $replacement.Destination -Recurse -Force
                }
            }
            Assert-SafeTargetPaths -Plan $plan -Destination $destination
            if (Test-Path -LiteralPath $destination) {
                throw "Skill destination appeared before exclusive move: $destination"
            }
            [IO.Directory]::Move((Join-Path $plan.StagePath $skill.name), $destination)
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

if ($KeepBackups -ge 0) {
    foreach ($plan in $plans) {
        $backupRoot = Join-Path $plan.PlatformPath 'skill-backups'
        foreach ($set in @(Get-PrunableBackupSets -BackupRoot $backupRoot -Keep $KeepBackups)) {
            Assert-PathWithin -Path $set.FullName -Parent $backupRoot -Description "$($plan.Name) backup set"
            Remove-Item -LiteralPath $set.FullName -Recurse -Force
            Write-Output "Pruned $($plan.Name) backup set: $($set.Name)"
        }
    }
}

Write-Output "Installed $($inventory.skills.Count) skills to: $($targetSpecs.Name -join ', ')"
