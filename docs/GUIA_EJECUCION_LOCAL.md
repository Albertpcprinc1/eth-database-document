# Guía de ejecución local — ETH Database Document

## 1. Objetivo

Esta guía describe cómo instalar, desplegar y ejecutar el proyecto completo en una red local Anvil.

El procedimiento contempla:

- Instalación de dependencias.
- Inicio del nodo Ethereum local.
- Despliegue del smart contract.
- Configuración del frontend.
- Ejecución de la dApp.
- Verificación del contrato mediante Cast.
- Reinicio controlado del entorno.

## 2. Requisitos del entorno

El proyecto fue validado con:

```text
Sistema operativo: Windows
PowerShell: 5.1 o superior
Node.js: 22.23.1
npm: 10.9.8
Foundry: 1.7.1
Git: 2.54.0.windows.1
Solidity: 0.8.20
```

Comprobar las herramientas:

```powershell
node --version
npm --version
forge --version
cast --version
anvil --version
git --version
```

## 3. Ubicación del proyecto

Ruta utilizada durante el desarrollo:

```text
E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT
```

En los comandos siguientes puede utilizarse otra ruta, siempre que se actualice la variable `$PROJECT_PATH`.

## 4. Instalar dependencias del smart contract

Abrir PowerShell y ejecutar:

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$SC_PATH = Join-Path $PROJECT_PATH "sc"

Push-Location $SC_PATH

try {
    forge install foundry-rs/forge-std --no-git
    forge build
}
finally {
    Pop-Location
}
```

La carpeta `sc/lib` se genera localmente y no se versiona en Git.

## 5. Instalar dependencias del frontend

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$DAPP_PATH = Join-Path $PROJECT_PATH "dapp"

Push-Location $DAPP_PATH

try {
    npm ci
}
finally {
    Pop-Location
}
```

`npm ci` instala exactamente las versiones declaradas en `package-lock.json`.

## 6. Iniciar Anvil

Abrir una primera terminal PowerShell:

```powershell
anvil
```

Anvil debe mostrar:

```text
RPC: http://127.0.0.1:8545
Chain ID: 31337
10 cuentas locales
10 claves privadas locales
```

Mantener esta terminal abierta mientras se utiliza la aplicación.

## 7. Verificar la red local

Abrir una segunda terminal:

```powershell
$RPC_URL = "http://127.0.0.1:8545"

cast chain-id --rpc-url $RPC_URL
cast block-number --rpc-url $RPC_URL
```

Resultado esperado para Chain ID:

```text
31337
```

## 8. Desplegar el smart contract

Copiar una clave privada mostrada por Anvil. Para las pruebas se utilizó la cuenta 0.

La clave privada debe emplearse únicamente en la red local.

```powershell
$ErrorActionPreference = "Stop"

$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$SC_PATH = Join-Path $PROJECT_PATH "sc"
$RPC_URL = "http://127.0.0.1:8545"
$PRIVATE_KEY = "<CLAVE_PRIVADA_LOCAL_ANVIL>"

Push-Location $SC_PATH

try {
    forge script `
        "script/Deploy.s.sol:Deploy" `
        --rpc-url $RPC_URL `
        --broadcast `
        --private-key $PRIVATE_KEY `
        -vv

    if ($LASTEXITCODE -ne 0) {
        throw "El despliegue del contrato falló."
    }
}
finally {
    Pop-Location
}
```

El despliegue debe mostrar:

- Dirección del contrato.
- Hash de transacción.
- Bloque.
- Gas utilizado.
- Mensaje de ejecución exitosa.

## 9. Obtener la dirección desplegada

Foundry registra el despliegue en:

```text
sc\broadcast\Deploy.s.sol\31337\run-latest.json
```

La dirección también aparece en la salida del comando `forge script`.

Ejemplo de dirección local utilizada durante las pruebas:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

La dirección puede cambiar si Anvil se reinicia y el contrato se despliega nuevamente.

## 10. Verificar el bytecode

```powershell
$RPC_URL = "http://127.0.0.1:8545"
$CONTRACT_ADDRESS = "0xDIRECCION_CONTRATO"

cast code `
    $CONTRACT_ADDRESS `
    --rpc-url $RPC_URL
```

El resultado debe ser diferente de:

```text
0x
```

## 11. Consultar el contador inicial

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentCount()(uint256)" `
    --rpc-url $RPC_URL
```

Después de un despliegue nuevo, el resultado esperado es:

```text
0
```

## 12. Exportar el ABI al frontend

Desde la raíz del proyecto:

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"

Set-Location $PROJECT_PATH

Set-ExecutionPolicy `
    -Scope Process `
    -ExecutionPolicy Bypass `
    -Force

& ".\scripts\Export-DocumentRegistryAbi.ps1"
```

Destino esperado:

```text
dapp\abi\DocumentRegistry.json
```

## 13. Configurar `.env.local`

Crear o actualizar:

```text
dapp\.env.local
```

Contenido:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDIRECCION_CONTRATO
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
```

La dirección debe coincidir con el último despliegue.

El archivo `.env.local` está excluido de Git.

## 14. Iniciar la dApp

Abrir una tercera terminal PowerShell:

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$DAPP_PATH = Join-Path $PROJECT_PATH "dapp"

Set-Location $DAPP_PATH

npm run dev
```

Abrir en el navegador:

```text
http://localhost:3000
```

## 15. Comprobar la conexión

La interfaz debe mostrar:

```text
RPC local: http://127.0.0.1:8545
Chain ID: 31337
Contrato: dirección configurada
Total documentos: contador on-chain
```

## 16. Registrar un documento

1. Seleccionar Wallet 0 o Wallet 1.
2. Pulsar `Connect Wallet`.
3. Seleccionar un archivo.
4. Revisar el hash SHA-256.
5. Pulsar `Firmar y registrar en Ethereum`.
6. Esperar la confirmación.
7. Revisar la transacción, bloque, gas y firma válida.

## 17. Verificar un documento

1. Ir al panel de verificación independiente.
2. Seleccionar el documento original.
3. Pulsar `Verificar autenticidad`.
4. Confirmar que la interfaz muestra `Documento auténtico`.
5. Revisar hash, firmante, timestamp y firma.

La consulta no requiere una wallet conectada.

## 18. Comprobar un archivo alterado

1. Crear una copia del documento.
2. Modificar al menos un carácter.
3. Seleccionar la copia modificada.
4. Ejecutar la verificación.

Resultado esperado:

```text
Documento no registrado
```

## 19. Consultar el historial

El historial se carga automáticamente.

También puede actualizarse manualmente mediante:

```text
Actualizar historial
```

Los documentos deben aparecer del registro más reciente al más antiguo.

## 20. Consultar datos mediante Cast

Total de documentos:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentCount()(uint256)" `
    --rpc-url $RPC_URL
```

Hash por índice:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentHashByIndex(uint256)(bytes32)" `
    0 `
    --rpc-url $RPC_URL
```

Información de un documento:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentInfo(bytes32)(bytes32,uint256,address,bytes)" `
    0xHASH_DOCUMENTO `
    --rpc-url $RPC_URL
```

## 21. Validar el proyecto

Smart contract:

```powershell
Push-Location .\sc

try {
    forge fmt --check
    forge build
    forge test -vv
    forge coverage --report summary
}
finally {
    Pop-Location
}
```

Frontend:

```powershell
Push-Location .\dapp

try {
    npx tsc --noEmit
    npm run lint
    npm run build
    npm audit --omit=dev
}
finally {
    Pop-Location
}
```

## 22. Reiniciar el entorno

Al cerrar Anvil se pierde el estado de la blockchain local.

Después de reiniciar Anvil se debe:

1. Desplegar nuevamente `DocumentRegistry`.
2. Obtener la nueva dirección.
3. Actualizar `dapp/.env.local`.
4. Reiniciar el servidor Next.js.
5. Registrar nuevamente los documentos de prueba.

## 23. Solución de errores frecuentes

### Error de conexión RPC

Comprobar que Anvil esté abierto:

```powershell
cast chain-id --rpc-url http://127.0.0.1:8545
```

### Dirección de contrato incorrecta

Verificar:

```powershell
cast code 0xDIRECCION --rpc-url http://127.0.0.1:8545
```

Si devuelve `0x`, la dirección no contiene un contrato desplegado.

### El frontend conserva una dirección anterior

Actualizar `.env.local` y reiniciar:

```powershell
npm run dev
```

### Puerto 3000 ocupado

Next.js puede iniciar en otro puerto. Revisar la URL informada en la consola.

### Anvil no está disponible

Comprobar que Foundry esté instalado y que su carpeta esté incluida en `PATH`.

## 24. Advertencia de seguridad

Las claves privadas, cuentas y mnemonic de Anvil son públicos y determinísticos.

No deben reutilizarse en Ethereum Mainnet, redes públicas ni wallets con fondos reales.
