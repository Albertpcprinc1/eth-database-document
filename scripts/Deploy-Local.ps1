param(
    [string]$ProjectPath = (Split-Path -Parent $PSScriptRoot),

    [string]$RpcUrl = "http://127.0.0.1:8545",

    [ValidateRange(1, [int]::MaxValue)]
    [int]$ExpectedChainId = 31337,

    [string]$PrivateKey = $env:ANVIL_PRIVATE_KEY
)

$ErrorActionPreference = "Stop"

$ScPath = Join-Path $ProjectPath "sc"
$DappPath = Join-Path $ProjectPath "dapp"
$EnvPath = Join-Path $DappPath ".env.local"
$ExportAbiScript = Join-Path $ProjectPath "scripts\Export-DocumentRegistryAbi.ps1"
$BroadcastPath = Join-Path `
    $ScPath `
    "broadcast\Deploy.s.sol\$ExpectedChainId\run-latest.json"

if (-not (Test-Path $ScPath)) {
    throw "No existe la carpeta del smart contract: $ScPath"
}

if (-not (Test-Path $DappPath)) {
    throw "No existe la carpeta del frontend: $DappPath"
}

foreach ($CommandName in @("forge", "cast")) {
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName no está disponible en PATH."
    }
}

if ([string]::IsNullOrWhiteSpace($PrivateKey)) {
    throw "Defina `$env:ANVIL_PRIVATE_KEY con una clave privada local mostrada por Anvil."
}

if ($PrivateKey -notmatch "^0x[a-fA-F0-9]{64}$") {
    throw "ANVIL_PRIVATE_KEY no tiene el formato hexadecimal esperado."
}

Write-Host "===== VERIFICANDO RED LOCAL =====" -ForegroundColor Cyan

$ChainIdOutput = & cast chain-id --rpc-url $RpcUrl

if ($LASTEXITCODE -ne 0) {
    throw "No fue posible conectar con el RPC $RpcUrl."
}

$ActualChainId = (
    $ChainIdOutput |
        Select-Object -Last 1
).ToString().Trim()

if ($ActualChainId -ne $ExpectedChainId.ToString()) {
    throw "Chain ID inesperado: $ActualChainId. Se esperaba $ExpectedChainId."
}

Write-Host "RPC disponible: $RpcUrl" -ForegroundColor Green
Write-Host "Chain ID correcto: $ActualChainId" -ForegroundColor Green

Write-Host "`n===== COMPILANDO CONTRATO =====" -ForegroundColor Cyan

Push-Location $ScPath

try {
    & forge build

    if ($LASTEXITCODE -ne 0) {
        throw "La compilación del smart contract falló."
    }

    Write-Host "`n===== DESPLEGANDO DOCUMENTREGISTRY =====" -ForegroundColor Cyan

    $ForgeArguments = @(
        "script",
        "script/Deploy.s.sol:Deploy",
        "--rpc-url",
        $RpcUrl,
        "--broadcast",
        "--private-key",
        $PrivateKey,
        "-vv"
    )

    & forge @ForgeArguments

    if ($LASTEXITCODE -ne 0) {
        throw "El despliegue de DocumentRegistry falló."
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $BroadcastPath)) {
    throw "No se encontró el resultado del despliegue: $BroadcastPath"
}

$BroadcastContent = [System.IO.File]::ReadAllText(
    $BroadcastPath,
    [System.Text.Encoding]::UTF8
)

$Broadcast = $BroadcastContent | ConvertFrom-Json

$Deployments = @(
    $Broadcast.transactions |
        Where-Object {
            $_.contractName -eq "DocumentRegistry" -and
            -not [string]::IsNullOrWhiteSpace($_.contractAddress)
        }
)

if ($Deployments.Count -eq 0) {
    throw "No se encontró DocumentRegistry en run-latest.json."
}

$Deployment = $Deployments | Select-Object -Last 1
$ContractAddress = $Deployment.contractAddress.ToString().Trim()

if ($ContractAddress -notmatch "^0x[a-fA-F0-9]{40}$") {
    throw "La dirección desplegada no tiene un formato válido: $ContractAddress"
}

Write-Host "`n===== EXPORTANDO ABI =====" -ForegroundColor Cyan

if (-not (Test-Path $ExportAbiScript)) {
    throw "No se encontró Export-DocumentRegistryAbi.ps1."
}

& $ExportAbiScript

if ($LASTEXITCODE -ne 0) {
    throw "No fue posible exportar el ABI al frontend."
}

Write-Host "`n===== ACTUALIZANDO .ENV.LOCAL =====" -ForegroundColor Cyan

$RequiredValues = @{
    "NEXT_PUBLIC_CONTRACT_ADDRESS" = $ContractAddress
    "NEXT_PUBLIC_RPC_URL" = $RpcUrl
    "NEXT_PUBLIC_CHAIN_ID" = $ExpectedChainId.ToString()
    "NEXT_PUBLIC_MNEMONIC" = '"test test test test test test test test test test test junk"'
}

$RequiredOrder = @(
    "NEXT_PUBLIC_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_RPC_URL",
    "NEXT_PUBLIC_CHAIN_ID",
    "NEXT_PUBLIC_MNEMONIC"
)

$ExistingLines = if (Test-Path $EnvPath) {
    [System.IO.File]::ReadAllLines(
        $EnvPath,
        [System.Text.Encoding]::UTF8
    )
}
else {
    @()
}

$UpdatedLines = New-Object System.Collections.Generic.List[string]
$ProcessedKeys = @{}

foreach ($Line in $ExistingLines) {
    if ($Line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
        $Key = $Matches[1]

        if ($RequiredValues.ContainsKey($Key)) {
            if (-not $ProcessedKeys.ContainsKey($Key)) {
                $UpdatedLines.Add("$Key=$($RequiredValues[$Key])")
                $ProcessedKeys[$Key] = $true
            }

            continue
        }
    }

    $UpdatedLines.Add($Line)
}

foreach ($Key in $RequiredOrder) {
    if (-not $ProcessedKeys.ContainsKey($Key)) {
        $UpdatedLines.Add("$Key=$($RequiredValues[$Key])")
    }
}

$Utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllLines(
    $EnvPath,
    $UpdatedLines,
    $Utf8WithoutBom
)

Write-Host ".env.local actualizado." -ForegroundColor Green

Write-Host "`n===== VERIFICANDO DESPLIEGUE =====" -ForegroundColor Cyan

$BytecodeOutput = & cast code `
    $ContractAddress `
    --rpc-url $RpcUrl

if ($LASTEXITCODE -ne 0) {
    throw "No fue posible consultar el bytecode desplegado."
}

$Bytecode = (
    $BytecodeOutput |
        Select-Object -Last 1
).ToString().Trim()

if ([string]::IsNullOrWhiteSpace($Bytecode) -or $Bytecode -eq "0x") {
    throw "No existe bytecode en la dirección $ContractAddress."
}

$DocumentCountOutput = & cast call `
    $ContractAddress `
    "getDocumentCount()(uint256)" `
    --rpc-url $RpcUrl

if ($LASTEXITCODE -ne 0) {
    throw "No fue posible consultar getDocumentCount."
}

$DocumentCount = (
    $DocumentCountOutput |
        Select-Object -Last 1
).ToString().Trim()

Write-Host "`n===== DESPLIEGUE COMPLETADO =====" -ForegroundColor Green
Write-Host "Contrato:   $ContractAddress" -ForegroundColor Yellow
Write-Host "RPC:        $RpcUrl"
Write-Host "Chain ID:   $ActualChainId"
Write-Host "Documentos: $DocumentCount"
Write-Host ""
Write-Host "Reinicie npm run dev para que Next.js cargue la nueva dirección." -ForegroundColor Yellow
