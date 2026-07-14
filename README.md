# ETH Database Document

Aplicación descentralizada para almacenar y verificar la autenticidad de documentos utilizando blockchain Ethereum.

## Arquitectura

- `sc/`: smart contracts, pruebas y despliegue con Solidity y Foundry.
- `dapp/`: frontend con Next.js, TypeScript y Ethers.js v6.
- `docs/`: documentación técnica del proyecto.
- `scripts/`: scripts de respaldo y automatización.

## Funcionalidades principales

1. Seleccionar un documento.
2. Calcular su hash criptográfico `keccak256`.
3. Firmar digitalmente el hash.
4. Almacenar hash, firma, firmante y timestamp en Ethereum.
5. Verificar la autenticidad del documento.
6. Consultar el historial de documentos registrados.

## Tecnologías

### Blockchain

- Solidity
- Foundry
- Forge
- Cast
- Anvil

### Frontend

- Next.js
- React
- TypeScript
- Ethers.js v6
- Tailwind CSS
- Lucide React

## Estado actual

Estructura inicial creada. Implementación pendiente.
