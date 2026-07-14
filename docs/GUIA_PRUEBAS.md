# Guía de pruebas — ETH Database Document

## 1. Objetivo

Esta guía describe las pruebas automatizadas, técnicas y funcionales utilizadas para validar ETH Database Document.

Las validaciones se dividen en:

- Pruebas unitarias del smart contract.
- Cobertura del código Solidity.
- Validaciones estáticas del frontend.
- Construcción de producción.
- Auditoría de dependencias.
- Pruebas funcionales de registro.
- Pruebas de autenticidad.
- Pruebas de alteración.
- Pruebas de historial.
- Verificación directa mediante Cast.

## 2. Requisitos previos

Antes de ejecutar las pruebas funcionales debe existir:

- Anvil activo en `http://127.0.0.1:8545`.
- Chain ID 31337.
- `DocumentRegistry` desplegado.
- Dirección correcta en `dapp/.env.local`.
- Dependencias de Foundry instaladas.
- Dependencias npm instaladas.

## 3. Pruebas automatizadas del smart contract

Ejecutar desde la raíz del proyecto:

```powershell
$ErrorActionPreference = "Stop"

$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$SC_PATH = Join-Path $PROJECT_PATH "sc"

Push-Location $SC_PATH

try {
    forge test -vv

    if ($LASTEXITCODE -ne 0) {
        throw "Las pruebas Solidity fallaron."
    }
}
finally {
    Pop-Location
}
```

## 4. Casos automatizados implementados

El archivo `sc/test/DocumentRegistry.t.sol` contiene 11 pruebas.

### 4.1 Almacenamiento correcto

`testStoreDocumentHashCorrectly` valida que el contrato almacene correctamente hash, timestamp, firmante y firma.

### 4.2 Emisión del evento

`testEmitDocumentStored` confirma la emisión del evento `DocumentStored`.

### 4.3 Recuperación de información

`testGetDocumentInfoCorrectly` comprueba que los datos recuperados coincidan con los almacenados.

### 4.4 Verificación criptográfica

`testVerifyStoredDocument` valida una firma correcta.

### 4.5 Firma o firmante incorrectos

`testVerifyReturnsFalseForWrongSignerAndSignature` comprueba el rechazo de datos incompatibles.

### 4.6 Rechazo de duplicados

`testRejectDuplicateDocument` impide registrar dos veces el mismo hash.

### 4.7 Entradas inválidas

`testRejectInvalidStoreInputs` comprueba:

- Hash cero.
- Timestamp cero.
- Firmante cero.
- Firmante diferente de `msg.sender`.
- Firma inválida.

### 4.8 Documento inexistente

`testRejectMissingDocumentOperations` valida el comportamiento ante hashes no registrados.

### 4.9 Conteo

`testCountDocuments` comprueba el incremento del contador.

### 4.10 Iteración

`testIterateDocumentsByIndex` valida la recuperación de hashes mediante índice.

### 4.11 Índice fuera de rango

`testRejectOutOfBoundsIndex` comprueba el rechazo de índices inexistentes.

## 5. Resultado automatizado esperado

```text
Ran 11 tests
11 passed
0 failed
0 skipped
```

## 6. Cobertura Solidity

Ejecutar:

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$SC_PATH = Join-Path $PROJECT_PATH "sc"

Push-Location $SC_PATH

try {
    forge coverage --report summary

    if ($LASTEXITCODE -ne 0) {
        throw "No fue posible obtener la cobertura."
    }
}
finally {
    Pop-Location
}
```

Resultados validados para `DocumentRegistry.sol`:

```text
Lines:      92.16 %
Statements: 92.59 %
Branches:   84.00 %
Functions:  100.00 %
```

La cobertura total también incluye `Deploy.s.sol`, que no contiene lógica de negocio.

## 7. Formato y compilación Solidity

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$SC_PATH = Join-Path $PROJECT_PATH "sc"

Push-Location $SC_PATH

try {
    forge fmt --check
    forge build
}
finally {
    Pop-Location
}
```

Resultado esperado:

- Sin errores de formato.
- Compilación exitosa.
- Solidity 0.8.20.

## 8. Validación TypeScript

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"
$DAPP_PATH = Join-Path $PROJECT_PATH "dapp"

Push-Location $DAPP_PATH

try {
    npx tsc --noEmit

    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript presenta errores."
    }
}
finally {
    Pop-Location
}
```

Resultado esperado: ninguna salida de error.

## 9. Validación ESLint

```powershell
Push-Location .\dapp

try {
    npm run lint

    if ($LASTEXITCODE -ne 0) {
        throw "ESLint presenta errores."
    }
}
finally {
    Pop-Location
}
```

Resultado esperado:

```text
> eslint
```

sin errores ni advertencias.

## 10. Build de producción

```powershell
Push-Location .\dapp

try {
    npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "El build presenta errores."
    }
}
finally {
    Pop-Location
}
```

Resultado esperado:

```text
Compiled successfully
Finished TypeScript
Generating static pages
```

## 11. Auditoría de dependencias

```powershell
Push-Location .\dapp

try {
    npm audit --omit=dev

    if ($LASTEXITCODE -ne 0) {
        throw "La auditoría detectó vulnerabilidades."
    }
}
finally {
    Pop-Location
}
```

Resultado validado:

```text
found 0 vulnerabilities
```

## 12. Prueba funcional de conexión

### Procedimiento

1. Iniciar Anvil.
2. Desplegar `DocumentRegistry`.
3. Iniciar la dApp.
4. Seleccionar Wallet 0.
5. Pulsar `Connect Wallet`.

### Resultado esperado

- Dirección de Wallet 0 visible.
- RPC local correcto.
- Chain ID 31337.
- Dirección de contrato visible.
- Contador de documentos accesible.

## 13. Prueba funcional de registro

### Procedimiento

1. Crear un archivo de prueba.
2. Seleccionarlo en el formulario.
3. Comparar el SHA-256 con PowerShell.
4. Firmar y registrar.
5. Esperar la confirmación.

Calcular SHA-256 desde PowerShell:

```powershell
$FILE_PATH = "C:\RUTA\documento-prueba.txt"

$HASH = (
    Get-FileHash `
        -Path $FILE_PATH `
        -Algorithm SHA256
).Hash.ToLower()

Write-Host "0x$HASH"
```

### Resultado esperado

- Hash del navegador igual al hash de PowerShell.
- Transacción confirmada.
- Número de bloque visible.
- Gas utilizado visible.
- Firma válida.
- Contador incrementado.

## 14. Prueba de documento duplicado

### Procedimiento

Intentar registrar nuevamente el mismo archivo.

### Resultado esperado

```text
Este documento ya se encuentra registrado en Ethereum.
```

No debe enviarse una segunda transacción.

## 15. Prueba de autenticidad

### Procedimiento

1. Seleccionar el archivo original en Verificación independiente.
2. Pulsar `Verificar autenticidad`.

### Resultado esperado

```text
Documento auténtico
Coincidencia del hash: Correcta
Firma criptográfica: Válida
```

También deben mostrarse:

- Wallet firmante.
- Fecha del registro.
- Firma almacenada.
- Hash calculado.
- Hash registrado.

## 16. Prueba de archivo alterado

### Procedimiento

1. Copiar el archivo original.
2. Modificar un carácter o byte.
3. Seleccionar la copia alterada.
4. Ejecutar la verificación.

### Resultado esperado

```text
Documento no registrado
```

El SHA-256 debe ser diferente al documento original.

## 17. Prueba con un segundo firmante

### Procedimiento

1. Seleccionar Wallet 1.
2. Conectarla.
3. Crear un segundo archivo.
4. Firmarlo y registrarlo.

Wallet 1 de la configuración predeterminada:

```text
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Resultado esperado

- Segundo documento registrado.
- Firmante diferente al primer registro.
- Contador total igual a 2.
- Firma válida.

## 18. Prueba del historial

### Procedimiento

1. Registrar dos documentos.
2. Abrir Historial blockchain.
3. Pulsar `Actualizar historial`.

### Resultado esperado

```text
Total recuperado: 2
Registro #2 antes de Registro #1
```

Cada registro debe mostrar:

- Hash.
- Firmante.
- Timestamp.
- Firma.
- Estado de validación.

## 19. Verificación mediante Cast

Definir variables:

```powershell
$RPC_URL = "http://127.0.0.1:8545"
$CONTRACT_ADDRESS = "0xDIRECCION_CONTRATO"
```

Consultar el total:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentCount()(uint256)" `
    --rpc-url $RPC_URL
```

Consultar el primer hash:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentHashByIndex(uint256)(bytes32)" `
    0 `
    --rpc-url $RPC_URL
```

Consultar el segundo hash:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentHashByIndex(uint256)(bytes32)" `
    1 `
    --rpc-url $RPC_URL
```

Los hashes deben coincidir con los calculados para cada archivo.

## 20. Validación Git

```powershell
$PROJECT_PATH = "E:\MAESTRIAS\MAESTRIA EN INGENIERIA EN BLOCKCHAIN\TRAB\9 SEMANA\ETH_DATABASE_DOCUMENT"

git -C $PROJECT_PATH diff --check
git -C $PROJECT_PATH status --short
```

`diff --check` no debe reportar errores de espacios ni conflictos.

## 21. Criterios de aceptación

El proyecto se considera validado cuando:

- Las 11 pruebas Solidity están aprobadas.
- La cobertura de líneas, sentencias y ramas supera el 80 %.
- Todas las funciones del contrato están cubiertas.
- TypeScript no presenta errores.
- ESLint no presenta errores.
- Next.js genera el build de producción.
- npm audit reporta cero vulnerabilidades de producción.
- El documento original se registra correctamente.
- Un duplicado es rechazado.
- El archivo original se verifica como auténtico.
- El archivo alterado se reporta como no registrado.
- El historial muestra todos los registros en orden descendente.
- Los resultados de Cast coinciden con la interfaz.

## 22. Advertencia

Las pruebas se ejecutan con cuentas determinísticas de Anvil. Ninguna clave privada local debe utilizarse con fondos reales.
