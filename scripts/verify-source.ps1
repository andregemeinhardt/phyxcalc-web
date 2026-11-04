param(
    [switch]$RestoreImages
)

$ErrorActionPreference = 'Stop'
$revision = 'c952bc8fecda1f5c14e05ed33656492564bc6cd4'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Join-Path $workspaceRoot 'PhyxCalc'
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) ('phyxcalc-' + [guid]::NewGuid().ToString() + '.zip')
$archive = $null

function Get-EntryHash($Entry) {
    $stream = $Entry.Open()
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '')
    }
    finally {
        $algorithm.Dispose()
        $stream.Dispose()
    }
}

try {
    Invoke-WebRequest -Uri "https://codeload.github.com/machinekoder/PhyxCalc/zip/$revision" -OutFile $archivePath -UseBasicParsing
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    $entries = @($archive.Entries | Where-Object { $_.Name })

    if ($RestoreImages) {
        $iconPath = Join-Path $projectRoot 'images/phyxcalc.png'
        $iconEntry = $entries | Where-Object { $_.FullName.EndsWith('/images/phyxcalc.png', [StringComparison]::Ordinal) }
        if (Test-Path -LiteralPath $iconPath) {
            if ((Get-FileHash -LiteralPath $iconPath -Algorithm SHA256).Hash -ne (Get-EntryHash $iconEntry)) {
                throw 'The local application icon was modified; refusing to overwrite it.'
            }
            $currentIcon = Get-Item -LiteralPath $iconPath
            if ($currentIcon.Name -cne 'phyxcalc.png') {
                $temporaryIcon = Join-Path $projectRoot ('images/' + [guid]::NewGuid().ToString() + '.png')
                Move-Item -LiteralPath $currentIcon.FullName -Destination $temporaryIcon
                Move-Item -LiteralPath $temporaryIcon -Destination $iconPath
            }
        }
        else {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($iconEntry, $iconPath, $false)
        }

        $alternateEntry = $entries | Where-Object { $_.FullName.EndsWith('/images/PhyxCalc.png', [StringComparison]::Ordinal) }
        $alternatePath = Join-Path $projectRoot 'images/phyxcalc-original.png'
        if (!(Test-Path -LiteralPath $alternatePath)) {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($alternateEntry, $alternatePath, $false)
        }
    }

    $issues = @()
    $checkedFiles = 0
    $seenPaths = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $entries) {
        $relativePath = $entry.FullName.Substring($entry.FullName.IndexOf('/') + 1)
        if ($relativePath -ceq 'images/PhyxCalc.png') {
            $relativePath = 'images/phyxcalc-original.png'
        }
        if (!$seenPaths.Add($relativePath)) {
            $issues += "Case-colliding path: $relativePath"
        }
        $localPath = Join-Path $projectRoot $relativePath
        if (!(Test-Path -LiteralPath $localPath -PathType Leaf)) {
            $issues += "Missing: $relativePath"
            continue
        }
        if ((Get-Item -LiteralPath $localPath).Name -cne $entry.Name -and $relativePath -cne 'images/phyxcalc-original.png') {
            $issues += "Incorrect filename casing: $relativePath"
        }
        if ((Get-FileHash -LiteralPath $localPath -Algorithm SHA256).Hash -ne (Get-EntryHash $entry)) {
            $issues += "Modified: $relativePath"
        }
        $checkedFiles++
    }
    if ($issues.Count -gt 0) {
        throw ($issues -join [Environment]::NewLine)
    }

    [pscustomobject]@{
        Revision = $revision
        VerifiedFiles = $checkedFiles
        ArchiveSHA256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
        Result = 'All upstream files match; only the documented image path is renamed.'
    } | Format-List
}
finally {
    if ($null -ne $archive) {
        $archive.Dispose()
    }
    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath
    }
}