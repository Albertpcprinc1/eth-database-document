param(
    [ValidateRange(1, [int]::MaxValue)]
    [int]$ChainId = 31337,

    [ValidateRange(1, 65535)]
    [int]$Port = 8545
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command anvil -ErrorAction SilentlyContinue)) {
    throw "Anvil no está disponible en PATH. Verifique la instalación de Foundry."
}

$RpcUrl = "http://127.0.0.1:$Port"

Write-Host "===== ETH DATABASE DOCUMENT =====" -ForegroundColor Cyan
Write-Host "Iniciando blockchain local Anvil" -ForegroundColor Cyan
Write-Host ""
Write-Host "RPC:      $RpcUrl" -ForegroundColor Yellow
Write-Host "Chain ID: $ChainId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Mantenga esta terminal abierta mientras utiliza la dApp." -ForegroundColor Green
Write-Host "Para detener Anvil, presione Ctrl + C." -ForegroundColor Green
Write-Host ""

& anvil `
    --host "127.0.0.1" `
    --port $Port `
    --chain-id $ChainId

if ($LASTEXITCODE -ne 0) {
    throw "Anvil finalizó con código de error $LASTEXITCODE."
}
