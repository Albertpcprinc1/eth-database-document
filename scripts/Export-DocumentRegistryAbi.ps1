param(
    [string]$ProjectPath = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$ScPath = Join-Path $ProjectPath "sc"
$DappPath = Join-Path $ProjectPath "dapp"
$ArtifactPath = Join-Path $ScPath "out\DocumentRegistry.sol\DocumentRegistry.json"
$AbiDirectory = Join-Path $DappPath "abi"
$AbiPath = Join-Path $AbiDirectory "DocumentRegistry.json"

Write-Host "Compilando DocumentRegistry..." -ForegroundColor Cyan

Push-Location $ScPath

try {
    forge build

    if ($LASTEXITCODE -ne 0) {
        throw "forge build falló."
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $ArtifactPath)) {
    throw "No se encontró el artefacto: $ArtifactPath"
}

New-Item -ItemType Directory -Path $AbiDirectory -Force | Out-Null

$Artifact = Get-Content $ArtifactPath -Raw | ConvertFrom-Json

if ($null -eq $Artifact.abi) {
    throw "El artefacto no contiene un ABI."
}

$AbiJson = $Artifact.abi | ConvertTo-Json -Depth 100
$Utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    $AbiPath,
    $AbiJson,
    $Utf8WithoutBom
)

Write-Host "ABI exportado correctamente:" -ForegroundColor Green
Write-Host $AbiPath -ForegroundColor Yellow
