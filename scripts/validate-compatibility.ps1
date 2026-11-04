param(
    [object]$Fixture
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$compatibilityRoot = Join-Path $workspaceRoot 'compatibility'
if ($null -eq $Fixture) {
    $Fixture = Get-Content -LiteralPath (Join-Path $compatibilityRoot 'cases.json') -Raw -Encoding UTF8 | ConvertFrom-Json
}

if ($Fixture.schemaVersion -ne 1 -or $Fixture.upstreamRevision -ne 'c952bc8fecda1f5c14e05ed33656492564bc6cd4') {
    throw 'The fixture schema or upstream revision does not match the baseline.'
}
if (!(Test-Path -LiteralPath (Join-Path $workspaceRoot $Fixture.profile.startupDefinitions) -PathType Leaf)) {
    throw 'Startup definitions are missing.'
}
if ($Fixture.profile.decimalPrecision -ne 6 -or $Fixture.profile.numberFormat -cne 'g' -or $Fixture.profile.imaginaryUnit -cne 'j') {
    throw 'The default fixture formatting profile changed without baseline review.'
}

$matrix = Get-Content -LiteralPath (Join-Path $compatibilityRoot 'FEATURES.md') -Raw -Encoding UTF8
$featureIdentifiers = @{}
foreach ($match in [regex]::Matches($matrix, '(?m)^\| (?<id>[a-z][a-z0-9-]+) \|[^\r\n]*\| (?:not started|in progress|implemented|verified|explicitly deferred) \|')) {
    if ($featureIdentifiers.ContainsKey($match.Groups['id'].Value)) {
        throw "Duplicate feature matrix ID: $($match.Groups['id'].Value)"
    }
    $featureIdentifiers[$match.Groups['id'].Value] = $true
}
if ($featureIdentifiers.Count -eq 0) {
    throw 'The feature matrix has no tracked rows.'
}
foreach ($match in [regex]::Matches($matrix, '\]\((?<path>\.\./PhyxCalc/[^)]+)\)')) {
    if (!(Test-Path -LiteralPath (Join-Path $compatibilityRoot $match.Groups['path'].Value) -PathType Leaf)) {
        throw "Broken feature evidence link: $($match.Groups['path'].Value)"
    }
}

$header = Get-Content -LiteralPath (Join-Path $workspaceRoot 'PhyxCalc/phyxcalculator.h') -Raw -Encoding UTF8
$errorEnum = [regex]::Match($header, '(?s)enum CalculationError\s*\{(?<members>.*?)\}')
$errorNames = @([regex]::Matches($errorEnum.Groups['members'].Value, '\b[A-Za-z]+Error\b') | ForEach-Object { $_.Value })
$caseIdentifiers = @{}
$stepCount = 0
$probeCount = 0
$observationCount = 0
$coveredFeatures = @{}
$numberPattern = '^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$'

if (@($Fixture.cases).Count -eq 0) {
    throw 'The fixture corpus is empty.'
}
foreach ($case in $Fixture.cases) {
    if ($case.id -notmatch '^[a-z][a-z0-9-]+$' -or $caseIdentifiers.ContainsKey($case.id)) {
        throw "Invalid or duplicate case ID: $($case.id)"
    }
    $caseIdentifiers[$case.id] = $true
    if (!$featureIdentifiers.ContainsKey([string]$case.feature)) {
        throw "Unknown feature for case $($case.id): $($case.feature)"
    }
    $coveredFeatures[$case.feature] = $true
    if ($case.evidence -notin @('documentation', 'source-derived', 'probe')) {
        throw "Unknown evidence category: $($case.id)"
    }
    if (!$case.source -or !(Test-Path -LiteralPath (Join-Path $workspaceRoot $case.source) -PathType Leaf)) {
        throw "Missing source evidence: $($case.id)"
    }
    foreach ($settingName in @($case.settings.PSObject.Properties.Name)) {
        if ($settingName -and $settingName -notin $Fixture.profile.PSObject.Properties.Name) {
            throw "Unknown setting override in $($case.id): $settingName"
        }
    }
    if ($case.PSObject.Properties.Name -notcontains 'observation') {
        throw "Case lacks an explicit observation field: $($case.id)"
    }
    if ($null -ne $case.observation) {
        foreach ($fieldName in @('referenceBuild', 'platform', 'settings', 'steps', 'date')) {
            if ($case.observation.PSObject.Properties.Name -notcontains $fieldName) {
                throw "Incomplete reference observation in $($case.id): $fieldName"
            }
        }
        if (@($case.observation.steps).Count -ne @($case.steps).Count) {
            throw "Observation step count mismatch: $($case.id)"
        }
        $observationCount++
    }
    if (@($case.steps).Count -eq 0) {
        throw "Case contains no steps: $($case.id)"
    }
    foreach ($step in $case.steps) {
        if ($step.input -isnot [string]) {
            throw "Step input must be a string, including a blank list terminator: $($case.id)"
        }
        $expectation = $step.expect
        switch ($expectation.kind) {
            'value' {
                foreach ($componentName in @('real', 'imaginary')) {
                    if ($expectation.$componentName -isnot [string] -or $expectation.$componentName -notmatch $numberPattern) {
                        throw "Invalid decimal-string component in $($case.id): $componentName"
                    }
                }
                if ($expectation.unit -isnot [string]) {
                    throw "Numeric expectation requires an explicit unit string: $($case.id)"
                }
            }
            'display' {
                if ($expectation.text -isnot [string]) {
                    throw "Display expectation requires text: $($case.id)"
                }
            }
            'error' {
                if ($expectation.code -notin $errorNames) {
                    throw "Unknown legacy error class: $($case.id)"
                }
            }
            'silent' { }
            'probe' {
                if (![string]::IsNullOrWhiteSpace($expectation.question)) {
                    $probeCount++
                }
                else {
                    throw "Probe requires a specific question: $($case.id)"
                }
            }
            default { throw "Unknown expectation kind in $($case.id): $($expectation.kind)" }
        }
        $stepCount++
    }
}

$engine = Get-Content -LiteralPath (Join-Path $workspaceRoot 'PhyxCalc/phyxcalculator.cpp') -Raw -Encoding UTF8
$actionNames = @{}
foreach ($match in [regex]::Matches($engine, 'functionMap\.insert\("(?<name>[A-Za-z0-9_]+)"')) {
    $actionNames[$match.Groups['name'].Value] = $true
}
$actionNames['bufferParameter'] = $true
$grammar = Get-Content -LiteralPath (Join-Path $workspaceRoot 'PhyxCalc/settings/grammar.txt') -Encoding UTF8
$usedActions = @{}
foreach ($line in $grammar) {
    $rule = ($line -split '//', 2)[0].Trim()
    if (!$rule -or $rule.StartsWith('#')) { continue }
    $ruleParts = [regex]::Split($rule, '(?<!\\);')
    if ($ruleParts.Count -lt 2) { continue }
    foreach ($action in ($ruleParts[-1] -split ',')) {
        $actionName = $action.Trim()
        if (!$actionName) { continue }
        if (!$actionNames.ContainsKey($actionName)) {
            throw "Grammar calls an unknown engine action: $actionName"
        }
        $usedActions[$actionName] = $true
    }
}

$uiActionCount = 0
foreach ($uiPath in Get-ChildItem -LiteralPath (Join-Path $workspaceRoot 'PhyxCalc') -Filter '*.ui' -File) {
    [xml]$designerFile = Get-Content -LiteralPath $uiPath.FullName -Raw -Encoding UTF8
    $uiActionCount += $designerFile.SelectNodes('//action').Count
}

[pscustomobject]@{
    FeatureRows = $featureIdentifiers.Count
    Cases = $caseIdentifiers.Count
    Steps = $stepCount
    CalculationFeatureGroups = $coveredFeatures.Count
    ProbeSteps = $probeCount
    RecordedObservations = $observationCount
    GrammarActionsResolved = $usedActions.Count
    DesignerActionsInventoried = $uiActionCount
    Scope = 'Offline specification validation only; no calculator was executed.'
} | Format-List