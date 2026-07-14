# ETH Database Document

Aplicación descentralizada para registrar y verificar la autenticidad de documentos mediante Ethereum.

El archivo original nunca se almacena en blockchain. La dApp calcula localmente su huella SHA-256 y registra únicamente el hash, el timestamp, la dirección del firmante y su firma digital.

## Autor

**Ing. Albert Huerta Morales**

Proyecto académico de la Maestría en Ingeniería Blockchain.

## Estado actual

- Smart contract `DocumentRegistry` implementado.
- 11 pruebas automatizadas aprobadas.
- Despliegue local validado mediante Anvil.
- Registro de documentos desde Next.js.
- Firma digital EIP-191.
- Verificación independiente sin conectar una wallet.
- Detección de archivos modificados.
- Historial blockchain ordenado del registro más reciente al más antiguo.
- Auditoría npm con cero vulnerabilidades conocidas.

## Arquitectura

```text
Archivo local
    |
    | SHA-256 mediante Web Crypto API
    v
Frontend Next.js + Ethers.js
    |
    | Firma EIP-191 y transacción
    v
DocumentRegistry.sol
    |
    +-- hash
    +-- timestamp
    +-- signer
    +-- signature
```

## Estructura

```text
sc/       Smart contract, pruebas y despliegue con Foundry
dapp/     Frontend Next.js, React, TypeScript y Ethers.js
docs/     Documentación técnica y evidencias
scripts/  Automatización, exportación de ABI y backups
```

## Tecnologías

### Blockchain

- Solidity 0.8.20
- Foundry 1.7.1
- Forge
- Cast
- Anvil
- EIP-191
- ECDSA secp256k1

### Frontend

- Node.js 22.23.1
- npm 10.9.8
- Next.js 16.2.10
- React 19.2.4
- TypeScript 5.9.3
- Ethers.js 6.17.0
- Tailwind CSS
- Lucide React

## Funcionalidades

1. Selección de cualquier archivo local.
2. Cálculo SHA-256 en el navegador.
3. Selección de una de las diez wallets locales de Anvil.
4. Firma de los 32 bytes reales del hash.
5. Registro del documento en Ethereum.
6. Prevención de registros duplicados.
7. Verificación independiente de autenticidad.
8. Recuperación del firmante, timestamp y firma.
9. Detección de documentos modificados o no registrados.
10. Historial completo de registros blockchain.

## Seguridad implementada

- El hash no puede ser cero.
- El timestamp debe ser mayor que cero.
- El firmante debe coincidir con `msg.sender`.
- La firma debe contener exactamente 65 bytes.
- La firma debe recuperar criptográficamente al firmante.
- Se rechazan firmas ECDSA con valor `s` alto.
- Un mismo hash no puede registrarse dos veces.
- Los archivos originales no se envían a Ethereum.

## Resultados de pruebas

```text
Smart contract: 11 aprobadas, 0 fallidas
DocumentRegistry lines: 92.16 %
DocumentRegistry statements: 92.59 %
DocumentRegistry branches: 84.00 %
DocumentRegistry functions: 100.00 %
npm audit producción: 0 vulnerabilidades
```

## Ejecución básica

### Iniciar Anvil

```powershell
anvil
```

### Desplegar contrato

```powershell
Set-Location .\sc
forge script `
    "script/Deploy.s.sol:Deploy" `
    --rpc-url "http://127.0.0.1:8545" `
    --broadcast `
    --private-key "<CLAVE_PRIVADA_LOCAL_ANVIL>" `
    -vv
```

### Ejecutar frontend

```powershell
Set-Location ..\dapp
npm ci
npm run dev
```

Abrir `http://localhost:3000`.

## Advertencia

Las cuentas y claves de Anvil son públicas y determinísticas. Nunca deben utilizarse con fondos reales ni en una red pública.
