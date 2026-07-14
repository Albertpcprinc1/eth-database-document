# Smart Contracts — ETH Database Document

Este módulo contiene el smart contract, las pruebas automatizadas y el script de despliegue del proyecto ETH Database Document.

## Contrato principal

```text
src/DocumentRegistry.sol
```

El contrato almacena un registro inmutable por cada hash documental.

```solidity
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
}
```

## Datos almacenados

- `hash`: huella SHA-256 del archivo.
- `timestamp`: fecha Unix proporcionada por la dApp.
- `signer`: dirección Ethereum que registró y firmó el documento.
- `signature`: firma digital EIP-191 de los 32 bytes del hash.

El archivo original nunca se almacena en Ethereum.

## Funciones públicas

### `storeDocumentHash`

Almacena un documento después de validar el hash, timestamp, firmante y firma.

### `verifyDocument`

Comprueba que la firma almacenada corresponde al hash y al firmante indicados.

### `getDocumentInfo`

Recupera hash, timestamp, firmante y firma.

### `isDocumentStored`

Indica si un hash ya está registrado.

### `getDocumentCount`

Devuelve la cantidad total de documentos registrados.

### `getDocumentHashByIndex`

Permite recorrer los hashes almacenados mediante índice.

## Evento

```solidity
event DocumentStored(
    bytes32 indexed hash,
    address indexed signer,
    uint256 timestamp
);
```

## Validaciones de seguridad

- El hash no puede ser `bytes32(0)`.
- El timestamp debe ser mayor que cero.
- El firmante no puede ser la dirección cero.
- El firmante declarado debe coincidir con `msg.sender`.
- La firma debe tener exactamente 65 bytes.
- La firma debe recuperar criptográficamente al firmante.
- Se valida el prefijo EIP-191.
- Se rechazan firmas ECDSA con valor `s` alto.
- No se permite registrar dos veces el mismo hash.
- Se rechazan índices fuera de rango.

## Estructura del módulo

```text
src/DocumentRegistry.sol       Contrato principal
test/DocumentRegistry.t.sol    Pruebas automatizadas
script/Deploy.s.sol            Script de despliegue
foundry.toml                   Configuración Foundry
```

Las carpetas `lib`, `out`, `cache` y `broadcast` están excluidas del repositorio.

## Requisitos

- Solidity 0.8.20.
- Foundry 1.7.1.
- Forge.
- Cast.
- Anvil.

## Instalar dependencias

Desde la carpeta `sc`:

```powershell
forge install foundry-rs/forge-std --no-git
```

## Compilar

```powershell
forge build
```

## Formatear

```powershell
forge fmt
forge fmt --check
```

## Ejecutar pruebas

```powershell
forge test -vv
```

Resultado validado:

```text
11 passed
0 failed
0 skipped
```

## Casos de prueba cubiertos

1. Almacenamiento correcto de documentos.
2. Emisión del evento `DocumentStored`.
3. Recuperación de la información almacenada.
4. Verificación de firma válida.
5. Rechazo de firma o firmante incorrectos.
6. Rechazo de documentos duplicados.
7. Rechazo de entradas inválidas.
8. Operaciones sobre documentos inexistentes.
9. Conteo de documentos.
10. Iteración mediante índices.
11. Rechazo de índices fuera de rango.

## Cobertura

```powershell
forge coverage --report summary
```

Cobertura validada para `DocumentRegistry.sol`:

```text
Lines:      92.16 %
Statements: 92.59 %
Branches:   84.00 %
Functions:  100.00 %
```

La cobertura total también incluye `Deploy.s.sol`, que no contiene lógica de negocio.

## Iniciar la red local

```powershell
anvil
```

Configuración predeterminada:

```text
RPC:      http://127.0.0.1:8545
Chain ID: 31337
```

## Desplegar el contrato

```powershell
forge script `
    "script/Deploy.s.sol:Deploy" `
    --rpc-url "http://127.0.0.1:8545" `
    --broadcast `
    --private-key "<CLAVE_PRIVADA_LOCAL_ANVIL>" `
    -vv
```

## Verificar el despliegue

```powershell
cast code `
    0xDIRECCION_CONTRATO `
    --rpc-url "http://127.0.0.1:8545"
```

```powershell
cast call `
    0xDIRECCION_CONTRATO `
    "getDocumentCount()(uint256)" `
    --rpc-url "http://127.0.0.1:8545"
```

## Exportar el ABI

Desde la raíz del proyecto:

```powershell
.\scripts\Export-DocumentRegistryAbi.ps1
```

El ABI se genera en:

```text
dapp/abi/DocumentRegistry.json
```

## Advertencia

Las claves privadas generadas por Anvil son públicas y deben utilizarse únicamente en entornos locales de desarrollo.
