param(
    [string]$ProjectPath = (Split-Path -Parent $PSScriptRoot),

    [switch]$Coverage
)

$ErrorActionPreference = "Stop"

function Assert-LastExitCode {
    param(
        [Parameter(Mandatory)]
        [string]$Message
    )

    if ($LASTEXITCODE -ne 0) {
        throw $Message
    }
}

function Write-Section {
    param(
        [Parameter(Mandatory)]
        [string]$Title
    )

    Write-Host ""
    Write-Host "===== $Title =====" -ForegroundColor Cyan
}

$ScPath = Join-Path $ProjectPath "sc"
$DappPath = Join-Path $ProjectPath "dapp"
$EnvPath = Join-Path $DappPath ".env.local"

Write-Host "==============================================" -ForegroundColor DarkGray
Write-Host "  VALIDACION - ETH DATABASE DOCUMENT" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor DarkGray

if (-not (Test-Path $ProjectPath)) {
    throw "No existe el proyecto: $ProjectPath"
}

if (-not (Test-Path $ScPath)) {
    throw "No existe la carpeta sc."
}

if (-not (Test-Path $DappPath)) {
    throw "No existe la carpeta dapp."
}

Write-Section "HERRAMIENTAS"

$RequiredCommands = @(
    "git",
    "forge",
    "node",
    "npm",
    "npx"
)

foreach ($CommandName in $RequiredCommands) {
    $Command = Get-Command $CommandName -ErrorAction SilentlyContinue

    if ($null -eq $Command) {
        throw "$CommandName no esta disponible en PATH."
    }

    Write-Host "OK: $CommandName" -ForegroundColor Green
}

Write-Host ""

& node --version
Assert-LastExitCode "No fue posible consultar Node.js."

& npm --version
Assert-LastExitCode "No fue posible consultar npm."

& forge --version
Assert-LastExitCode "No fue posible consultar Foundry."

& git --version
Assert-LastExitCode "No fue posible consultar Git."

Write-Section "ARCHIVOS ESENCIALES"

$RequiredFiles = @(
    "README.md",
    "sc\foundry.toml",
    "sc\src\DocumentRegistry.sol",
    "sc\test\DocumentRegistry.t.sol",
    "sc\script\Deploy.s.sol",
    "dapp\package.json",
    "dapp\package-lock.json",
    "dapp\tsconfig.json",
    "dapp\abi\DocumentRegistry.json",
    "dapp\app\page.tsx"
)

foreach ($RelativePath in $RequiredFiles) {
    $FullPath = Join-Path $ProjectPath $RelativePath

    if (-not (Test-Path $FullPath)) {
        throw "Falta el archivo esencial: $RelativePath"
    }

    Write-Host "OK: $RelativePath" -ForegroundColor Green
}

Write-Section "SMART CONTRACT - FORMATO"

Push-Location $ScPath

try {
    & forge fmt --check
    Assert-LastExitCode "forge fmt --check detecto problemas."

    Write-Section "SMART CONTRACT - BUILD"

    & forge build
    Assert-LastExitCode "forge build fallo."

    Write-Section "SMART CONTRACT - PRUEBAS"

    & forge test --summary
    Assert-LastExitCode "Las pruebas del smart contract fallaron."

    if ($Coverage) {
        Write-Section "SMART CONTRACT - COBERTURA"

        & forge coverage --report summary
        Assert-LastExitCode "forge coverage fallo."
    }
}
finally {
    Pop-Location
}

Write-Section "FRONTEND - CONFIGURACION LOCAL"

if (-not (Test-Path $EnvPath)) {
    throw "No existe dapp\.env.local."
}

$EnvLines = [System.IO.File]::ReadAllLines(
    $EnvPath,
    [System.Text.Encoding]::UTF8
)

$RequiredEnvironmentKeys = @(
    "NEXT_PUBLIC_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_RPC_URL",
    "NEXT_PUBLIC_CHAIN_ID",
    "NEXT_PUBLIC_MNEMONIC"
)

foreach ($Key in $RequiredEnvironmentKeys) {
    $Prefix = "$Key="

    $EnvLine = $EnvLines |
        Where-Object {
            $_.StartsWith($Prefix)
        } |
        Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($EnvLine)) {
        throw "Falta la variable $Key en dapp\.env.local."
    }

    if ($EnvLine.Length -le $Prefix.Length) {
        throw "La variable $Key esta vacia."
    }

    Write-Host "OK: $Key" -ForegroundColor Green
}

$TrackedEnvLocal = @(
    & git -C $ProjectPath ls-files -- "dapp/.env.local"
)

Assert-LastExitCode "No fue posible revisar dapp/.env.local en Git."

if ($TrackedEnvLocal.Count -gt 0) {
    throw "SEGURIDAD: dapp/.env.local esta versionado en Git."
}

Write-Host "OK: dapp/.env.local no esta versionado." -ForegroundColor Green

Write-Section "FRONTEND - TYPESCRIPT"

Push-Location $DappPath

try {
    & npx tsc --noEmit
    Assert-LastExitCode "TypeScript presenta errores."

    Write-Section "FRONTEND - ESLINT"

    & npm run lint
    Assert-LastExitCode "ESLint presenta errores."

    Write-Section "FRONTEND - BUILD"

    & npm run build
    Assert-LastExitCode "El build de Next.js fallo."

    Write-Section "FRONTEND - AUDITORIA"

    & npm audit --omit=dev
    Assert-LastExitCode "npm audit detecto vulnerabilidades de produccion."
}
finally {
    Pop-Location
}

Write-Section "DOCUMENTACION UTF-8"

$DocumentationFiles = @(
    "README.md",
    "sc\README.md",
    "dapp\README.md",
    "docs\ARQUITECTURA.md",
    "docs\GUIA_EJECUCION_LOCAL.md",
    "docs\GUIA_PRUEBAS.md",
    "docs\EVIDENCIAS_ENTREGA.md"
)

$StrictUtf8 = [System.Text.UTF8Encoding]::new(
    $false,
    $true
)

foreach ($RelativePath in $DocumentationFiles) {
    $FullPath = Join-Path $ProjectPath $RelativePath

    if (-not (Test-Path $FullPath)) {
        throw "Falta el documento: $RelativePath"
    }

    $Bytes = [System.IO.File]::ReadAllBytes($FullPath)

    if ($Bytes.Length -eq 0) {
        throw "El documento esta vacio: $RelativePath"
    }

    try {
        $null = $StrictUtf8.GetString($Bytes)
    }
    catch {
        throw "El documento no contiene UTF-8 valido: $RelativePath"
    }

    Write-Host "OK UTF-8: $RelativePath" -ForegroundColor Green
}

Write-Section "SINTAXIS DE SCRIPTS POWERSHELL"

$OperationalScripts = @(
    "scripts\Start-Anvil.ps1",
    "scripts\Deploy-Local.ps1",
    "scripts\Start-Dapp.ps1",
    "scripts\Validate-Project.ps1"
)

foreach ($RelativePath in $OperationalScripts) {
    $FullPath = Join-Path $ProjectPath $RelativePath

    if (-not (Test-Path $FullPath)) {
        throw "Falta el script: $RelativePath"
    }

    $Tokens = $null
    $ParseErrors = $null

    $null = [System.Management.Automation.Language.Parser]::ParseFile(
        $FullPath,
        [ref]$Tokens,
        [ref]$ParseErrors
    )

    if ($ParseErrors.Count -gt 0) {
        $FirstError = $ParseErrors | Select-Object -First 1

        throw "Error de sintaxis en $RelativePath`: $($FirstError.Message)"
    }

    Write-Host "OK: $RelativePath" -ForegroundColor Green
}

Write-Section "GIT - FORMATO"

& git -C $ProjectPath diff --check
Assert-LastExitCode "Git detecto errores de espacios o formato."

Write-Section "GIT - ESTADO"

& git -C $ProjectPath status --short
Assert-LastExitCode "No fue posible consultar el estado Git."

Write-Host ""
Write-Host "==============================================" -ForegroundColor DarkGray
Write-Host "  PROYECTO VALIDADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor DarkGray

if (-not $Coverage) {
    Write-Host ""
    Write-Host "Nota: ejecute con -Coverage para incluir cobertura Solidity." -ForegroundColor Yellow
}
