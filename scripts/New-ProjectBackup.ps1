param(
    [string]$Description = "backup"
)

$ErrorActionPreference = "Stop"

$ProjectPath = Split-Path -Parent $PSScriptRoot
$BasePath = Split-Path -Parent $ProjectPath
$BackupRoot = Join-Path $BasePath "ETH_DATABASE_DOCUMENT_BACKUPS"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SafeDescription = $Description -replace '[^a-zA-Z0-9_-]', '_'
$BackupName = "ETH_DATABASE_DOCUMENT_${Timestamp}_${SafeDescription}"
$BackupDirectory = Join-Path $BackupRoot $BackupName
$ZipPath = "$BackupDirectory.zip"

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

Write-Host "Creando backup temporal..." -ForegroundColor Cyan

$TempPath = Join-Path $env:TEMP $BackupName

if (Test-Path $TempPath) {
    Remove-Item $TempPath -Recurse -Force
}

New-Item -ItemType Directory -Path $TempPath -Force | Out-Null

$ExcludedDirectories = @(
    ".git",
    "node_modules",
    ".next",
    "out",
    "cache",
    "lib",
    "broadcast",
    "coverage"
)

$RobocopyArguments = @(
    $ProjectPath,
    $TempPath,
    "/E",
    "/R:1",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP",
    "/XD"
) + $ExcludedDirectories

& robocopy @RobocopyArguments | Out-Null

if ($LASTEXITCODE -gt 7) {
    throw "Robocopy finalizó con código de error $LASTEXITCODE."
}

Compress-Archive `
    -Path "$TempPath\*" `
    -DestinationPath $ZipPath `
    -Force

Remove-Item $TempPath -Recurse -Force

Push-Location $ProjectPath

try {
    git rev-parse --verify HEAD 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
        $BundlePath = Join-Path $BackupRoot "$BackupName.bundle"

        git bundle create $BundlePath --all

        if ($LASTEXITCODE -ne 0) {
            throw "No fue posible crear el Git bundle."
        }

        Write-Host "Git bundle creado:" -ForegroundColor Green
        Write-Host $BundlePath -ForegroundColor Yellow
    }
    else {
        Write-Host "Aún no existe un commit. No se creó Git bundle." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Backup ZIP creado correctamente:" -ForegroundColor Green
Write-Host $ZipPath -ForegroundColor Yellow
