# Evidencias para la entrega — ETH Database Document

## 1. Datos generales

| Campo | Información |
|---|---|
| Proyecto | ETH Database Document |
| Autor | Ing. Albert Huerta Morales |
| Tipo de solución | Aplicación descentralizada |
| Red utilizada | Anvil local |
| Chain ID | 31337 |
| Smart contract | DocumentRegistry |
| Solidity | 0.8.20 |
| Frontend | Next.js, React y TypeScript |
| Integración Ethereum | Ethers.js v6 |

## 2. Objetivo de las evidencias

Las evidencias deben demostrar:

- Implementación del smart contract.
- Pruebas automatizadas aprobadas.
- Cobertura superior al 80 %.
- Despliegue exitoso en Ethereum local.
- Cálculo SHA-256 del documento.
- Firma digital EIP-191.
- Registro on-chain.
- Verificación independiente.
- Detección de documentos alterados.
- Historial completo de documentos.
- Calidad técnica del frontend.
- Versionamiento mediante Git y GitHub.

## 3. Evidencia 1 — Estructura del proyecto

Mostrar en VS Code o PowerShell:

```text
ETH_DATABASE_DOCUMENT
├── dapp
├── docs
├── sc
├── scripts
└── README.md
```

Debe observarse:

- Contrato Solidity.
- Pruebas Forge.
- Script de despliegue.
- Componentes React.
- ABI exportado.
- Documentación técnica.

## 4. Evidencia 2 — Código del smart contract

Archivo:

```text
sc/src/DocumentRegistry.sol
```

La captura debe mostrar:

- Estructura `Document`.
- Mapping de documentos.
- Arreglo de hashes.
- Función `storeDocumentHash`.
- Función `verifyDocument`.
- Evento `DocumentStored`.

## 5. Evidencia 3 — Pruebas automatizadas

Ejecutar:

```powershell
Push-Location .\sc

try {
    forge test --summary
}
finally {
    Pop-Location
}
```

La captura debe mostrar:

```text
Ran 11 tests
11 passed
0 failed
0 skipped
```

## 6. Evidencia 4 — Cobertura Solidity

Ejecutar:

```powershell
Push-Location .\sc

try {
    forge coverage --report summary
}
finally {
    Pop-Location
}
```

La captura debe mostrar la fila de `DocumentRegistry.sol`:

```text
Lines:      92.16 %
Statements: 92.59 %
Branches:   84.00 %
Functions:  100.00 %
```

## 7. Evidencia 5 — Red local Anvil

La captura debe mostrar:

- RPC `http://127.0.0.1:8545`.
- Chain ID 31337.
- Cuentas locales.
- Bloques y transacciones procesadas.

No es necesario mostrar claves privadas completas en la entrega.

## 8. Evidencia 6 — Despliegue del contrato

La captura del despliegue debe mostrar:

- Nombre `DocumentRegistry`.
- Dirección del contrato.
- Transaction hash.
- Bloque.
- Gas utilizado.
- Mensaje de ejecución exitosa.

Ejemplo de dirección obtenida durante las pruebas:

```text
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

La dirección puede cambiar después de reiniciar Anvil.

## 9. Evidencia 7 — Verificación del bytecode

Ejecutar:

```powershell
$RPC_URL = "http://127.0.0.1:8545"
$CONTRACT_ADDRESS = "0xDIRECCION_CONTRATO"

cast code `
    $CONTRACT_ADDRESS `
    --rpc-url $RPC_URL
```

La respuesta debe contener bytecode y no únicamente `0x`.

## 10. Evidencia 8 — Estado inicial de la dApp

La captura principal debe mostrar:

- Título ETH Database Document.
- RPC local.
- Chain ID.
- Dirección del contrato.
- Selector de wallet.
- Contador total de documentos.
- Formularios de registro y verificación.

## 11. Evidencia 9 — Wallet conectada

La captura debe mostrar:

- Wallet seleccionada.
- Dirección conectada.
- Botón de desconexión.
- Estado correcto de la red.

Wallet 0 utilizada en las pruebas:

```text
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 12. Evidencia 10 — Cálculo SHA-256

La interfaz debe mostrar:

- Nombre del archivo.
- Tamaño.
- Hash SHA-256.

Comparar mediante PowerShell:

```powershell
$FILE_PATH = "C:\RUTA\documento.txt"

$HASH = (
    Get-FileHash `
        -Path $FILE_PATH `
        -Algorithm SHA256
).Hash.ToLower()

Write-Host "0x$HASH"
```

El hash de PowerShell debe coincidir con el de la dApp.

## 13. Evidencia 11 — Documento registrado

La captura debe incluir:

- Mensaje de registro exitoso.
- Hash documental.
- Firmante.
- Timestamp.
- Firma digital.
- Transaction hash.
- Bloque.
- Gas utilizado.
- Estado `Firma válida`.

## 14. Evidencia 12 — Documento duplicado

Intentar registrar nuevamente el mismo archivo.

Resultado esperado:

```text
Este documento ya se encuentra registrado en Ethereum.
```

Debe demostrarse que no se genera un segundo registro.

## 15. Evidencia 13 — Verificación auténtica

La captura debe mostrar:

```text
Documento auténtico
Coincidencia del hash: Correcta
Firma criptográfica: Válida
```

Además debe incluir:

- Firmante.
- Fecha de registro.
- Firma almacenada.
- Hash calculado.
- Hash registrado.

## 16. Evidencia 14 — Documento alterado

Modificar una copia del archivo original y verificarla.

Resultado esperado:

```text
Documento no registrado
```

La evidencia debe mostrar un SHA-256 distinto al original.

## 17. Evidencia 15 — Segundo firmante

Registrar un segundo documento utilizando Wallet 1:

```text
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

La captura debe mostrar:

- Segundo documento registrado.
- Firmante Wallet 1.
- Firma válida.
- Contador total igual a 2.

## 18. Evidencia 16 — Historial blockchain

La captura debe mostrar:

```text
Total recuperado: 2
Registro #2
Registro #1
```

El registro más reciente debe aparecer primero.

Cada registro debe incluir:

- Índice.
- Hash.
- Firmante.
- Fecha.
- Firma.
- Estado de validación.

## 19. Evidencia 17 — Verificación mediante Cast

Consultar el total:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentCount()(uint256)" `
    --rpc-url $RPC_URL
```

Resultado probado:

```text
2
```

Consultar el hash del segundo registro:

```powershell
cast call `
    $CONTRACT_ADDRESS `
    "getDocumentHashByIndex(uint256)(bytes32)" `
    1 `
    --rpc-url $RPC_URL
```

Resultado validado durante las pruebas:

```text
0xdb0d2e174eb6214f86c427c7b2446d78f0f6606cdbf9603c6355ed5ffbf5e077
```

## 20. Evidencia 18 — Validación del frontend

Ejecutar:

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

La captura debe mostrar:

```text
Compiled successfully
Finished TypeScript
found 0 vulnerabilities
```

## 21. Evidencia 19 — Repositorio Git

Ejecutar:

```powershell
git status
git log --oneline -10
```

La evidencia final debe mostrar:

- Rama `main`.
- Sincronización con `origin/main`.
- Historial de commits.
- Working tree limpio.

## 22. Evidencia 20 — Backup estable

Mostrar los archivos generados en:

```text
ETH_DATABASE_DOCUMENT_BACKUPS
```

Debe incluir:

- Archivo `.zip`.
- Archivo `.bundle`.
- Fecha y descripción del punto estable.

## 23. Orden recomendado en el informe

1. Portada.
2. Objetivo del proyecto.
3. Arquitectura.
4. Smart contract.
5. Reglas de seguridad.
6. Pruebas automatizadas.
7. Cobertura.
8. Despliegue.
9. Interfaz frontend.
10. Registro documental.
11. Verificación auténtica.
12. Detección de alteración.
13. Historial blockchain.
14. Validaciones técnicas.
15. GitHub y respaldo.
16. Conclusiones.

## 24. Recomendaciones para las capturas

- Recortar áreas que no aporten evidencia.
- Mantener visible el comando ejecutado.
- Mantener visible el resultado completo.
- Evitar incluir claves privadas.
- Utilizar títulos o números de figura.
- Añadir una descripción debajo de cada imagen.
- Mantener una resolución legible.

## 25. Lista de comprobación final

```text
[ ] Proyecto identificado
[ ] Autor identificado
[ ] Arquitectura explicada
[ ] Contrato mostrado
[ ] 11 pruebas aprobadas
[ ] Cobertura superior al 80 %
[ ] Anvil ejecutándose
[ ] Contrato desplegado
[ ] Bytecode verificado
[ ] Wallet conectada
[ ] SHA-256 comprobado
[ ] Documento registrado
[ ] Duplicado rechazado
[ ] Documento auténtico verificado
[ ] Documento alterado detectado
[ ] Segundo firmante validado
[ ] Historial con dos registros
[ ] Cast coincide con la interfaz
[ ] Build exitoso
[ ] Auditoría sin vulnerabilidades
[ ] GitHub sincronizado
[ ] Backup generado
```

## 26. Advertencia

No se deben publicar claves privadas reales, frases semilla personales ni credenciales de redes públicas.
