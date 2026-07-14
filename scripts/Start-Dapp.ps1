param(
    [string]$ProjectPath = (Split-Path -Parent $PSScriptRoot),

    [ValidateRange(1, 65535)]
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$DappPath = Join-Path $ProjectPath "dapp"
$EnvPath = Join-Path $DappPath ".env.local"
$PackageJsonPath = Join-Path $DappPath "package.json"
$NodeModulesPath = Join-Path $DappPath "node_modules"

if (-not (Test-Path $DappPath)) {
    throw "No existe la carpeta del frontend: $DappPath"
}

if (-not (Test-Path $PackageJsonPath)) {
    throw "No existe dapp\package.json."
}

foreach ($CommandName in @("node", "npm")) {
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName no está disponible en PATH."
    }
}

if (-not (Test-Path $EnvPath)) {
    throw "No existe dapp\.env.local. Configure o despliegue primero el contrato."
}

Write-Host "===== VALIDANDO ENTORNO FRONTEND =====" -ForegroundColor Cyan

$NodeVersion = (& node --version).ToString().Trim()
$NpmVersion = (& npm --version).ToString().Trim()

if ($LASTEXITCODE -ne 0) {
    throw "No fue posible consultar las versiones de Node.js o npm."
}

Write-Host "Node.js: $NodeVersion" -ForegroundColor Green
Write-Host "npm:     $NpmVersion" -ForegroundColor Green

$EnvLines = [System.IO.File]::ReadAllLines(
    $EnvPath,
    [System.Text.Encoding]::UTF8
)

$EnvironmentValues = @{}

foreach ($Line in $EnvLines) {
    if ($Line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
        $EnvironmentValues[$Matches[1]] = $Matches[2].Trim()
    }
}

$RequiredKeys = @(
    "NEXT_PUBLIC_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_RPC_URL",
    "NEXT_PUBLIC_CHAIN_ID",
    "NEXT_PUBLIC_MNEMONIC"
)

foreach ($Key in $RequiredKeys) {
    if (-not $EnvironmentValues.ContainsKey($Key)) {
        throw "Falta la variable $Key en dapp\.env.local."
    }

    if ([string]::IsNullOrWhiteSpace($EnvironmentValues[$Key])) {
        throw "La variable $Key está vacía."
    }
}

$ContractAddress = $EnvironmentValues["NEXT_PUBLIC_CONTRACT_ADDRESS"]
$RpcUrl = $EnvironmentValues["NEXT_PUBLIC_RPC_URL"]
$ChainId = $EnvironmentValues["NEXT_PUBLIC_CHAIN_ID"]

if ($ContractAddress -notmatch "^0x[a-fA-F0-9]{40}$") {
    throw "NEXT_PUBLIC_CONTRACT_ADDRESS no tiene un formato válido."
}

if ($RpcUrl -notmatch "^https?://") {
    throw "NEXT_PUBLIC_RPC_URL no tiene un formato HTTP o HTTPS válido."
}

if ($ChainId -notmatch "^\d+$") {
    throw "NEXT_PUBLIC_CHAIN_ID debe contener un número entero."
}

Write-Host "Contrato: $ContractAddress" -ForegroundColor Yellow
Write-Host "RPC:      $RpcUrl" -ForegroundColor Yellow
Write-Host "Chain ID: $ChainId" -ForegroundColor Yellow

Push-Location $DappPath

try {
    if (-not (Test-Path $NodeModulesPath)) {
        Write-Host "`n===== INSTALANDO DEPENDENCIAS =====" -ForegroundColor Cyan

        & npm ci

        if ($LASTEXITCODE -ne 0) {
            throw "npm ci falló."
        }
    }
    else {
        Write-Host "Dependencias instaladas: node_modules disponible." -ForegroundColor Green
    }

    Write-Host "`n===== INICIANDO ETH DATABASE DOCUMENT =====" -ForegroundColor Cyan
    Write-Host "URL: http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "Para detener Next.js, presione Ctrl + C." -ForegroundColor Green
    Write-Host ""

    & npm run dev -- --port $Port

    if ($LASTEXITCODE -ne 0) {
        throw "El servidor Next.js finalizó con código de error $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
