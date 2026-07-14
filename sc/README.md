# Smart Contracts - ETH Database Document

Este módulo contiene los contratos inteligentes, pruebas automatizadas y scripts de despliegue de la dApp ETH Database Document.

## Estructura

- src/: contratos Solidity.
- test/: pruebas automatizadas con Forge.
- script/: scripts de despliegue.
- lib/: dependencias locales de Foundry, excluidas de Git.
- out/: artefactos de compilación, excluidos de Git.
- cache/: caché de compilación, excluida de Git.
- broadcast/: resultados de despliegues, excluidos de Git.

## Versión de Solidity

El proyecto utiliza Solidity 0.8.20.

## Dependencias

Para instalar Forge Standard Library:

    forge install foundry-rs/forge-std --no-git

## Comandos principales

    forge build
    forge test -vv
    forge coverage
    forge fmt

## Nodo Ethereum local

Para iniciar Anvil:

    anvil

RPC local:

    http://127.0.0.1:8545

Chain ID:

    31337

## Estado

Foundry configurado. Implementación de DocumentRegistry.sol pendiente.
