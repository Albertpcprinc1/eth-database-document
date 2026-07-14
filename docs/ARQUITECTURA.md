# Arquitectura — ETH Database Document

## 1. Visión general

ETH Database Document utiliza una arquitectura descentralizada cliente-blockchain.

No existe un backend tradicional ni una base de datos central. El navegador se comunica directamente con un nodo Ethereum mediante Ethers.js.

```text
Usuario
   |
   v
Navegador web
   |
   +-- Next.js y React
   +-- Web Crypto API
   +-- Ethers.js
   |
   v
Nodo Ethereum Anvil
   |
   v
DocumentRegistry.sol
```

## 2. Principio de privacidad

El archivo original permanece en el equipo del usuario.

La aplicación calcula localmente su hash SHA-256 y registra únicamente:

- Hash SHA-256 de 32 bytes.
- Timestamp Unix.
- Dirección Ethereum del firmante.
- Firma digital EIP-191.

El contenido del documento no se transmite ni se almacena en Ethereum.

## 3. Capas de la solución

### 3.1 Capa de presentación

Implementada con Next.js, React y Tailwind CSS.

Responsabilidades:

- Seleccionar archivos.
- Mostrar el hash calculado.
- Seleccionar y conectar wallets.
- Presentar transacciones y resultados.
- Verificar documentos.
- Mostrar el historial blockchain.

### 3.2 Capa de integración blockchain

Implementada con Ethers.js v6.

Responsabilidades:

- Crear el proveedor JSON-RPC.
- Derivar wallets locales de Anvil.
- Firmar los bytes reales del hash.
- Enviar transacciones.
- Consultar funciones de solo lectura.
- Convertir resultados Solidity a tipos TypeScript.

### 3.3 Capa de contrato inteligente

Implementada mediante `DocumentRegistry.sol`.

Responsabilidades:

- Validar los datos recibidos.
- Comprobar la firma EIP-191.
- Recuperar criptográficamente al firmante.
- Evitar registros duplicados.
- Almacenar datos documentales.
- Emitir eventos.
- Permitir consultas e iteración.

### 3.4 Capa de red local

Anvil proporciona:

- Nodo JSON-RPC local.
- Chain ID 31337.
- Diez cuentas determinísticas.
- Fondos de prueba.
- Minado inmediato de transacciones.

## 4. Modelo de datos

El contrato define la siguiente estructura:

```solidity
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
}
```

### Significado de los campos

| Campo | Tipo Solidity | Descripción |
|---|---|---|
| `hash` | `bytes32` | Huella SHA-256 del archivo |
| `timestamp` | `uint256` | Fecha y hora Unix del registro |
| `signer` | `address` | Wallet que firmó y registró |
| `signature` | `bytes` | Firma EIP-191 del hash |

## 5. Estructuras de almacenamiento

El contrato utiliza conceptualmente:

```solidity
mapping(bytes32 => Document) private documents;
bytes32[] private documentHashes;
```

El mapping permite recuperar un documento por hash.

El arreglo permite contar e iterar los documentos registrados.

La existencia se determina verificando que el firmante almacenado no sea la dirección cero.

## 6. Flujo de registro

```text
Archivo seleccionado
   |
   v
Lectura mediante arrayBuffer
   |
   v
SHA-256 con Web Crypto API
   |
   v
Conversión a bytes32
   |
   v
Firma EIP-191 con la wallet
   |
   v
storeDocumentHash
   |
   v
Validación ECDSA
   |
   v
Almacenamiento y evento
```

### Validaciones durante el registro

1. El hash debe ser distinto de cero.
2. El timestamp debe ser mayor que cero.
3. El firmante debe ser distinto de la dirección cero.
4. El firmante declarado debe coincidir con `msg.sender`.
5. La firma debe tener 65 bytes.
6. La firma debe utilizar un valor `s` bajo.
7. La recuperación ECDSA debe coincidir con el firmante.
8. El hash no debe haber sido registrado previamente.

## 7. Flujo de verificación

```text
Archivo consultado
   |
   v
Nuevo cálculo SHA-256
   |
   v
isDocumentStored
   |
   +-- No existe: documento no registrado
   |
   v
getDocumentInfo
   |
   v
verifyDocument
   |
   v
Documento auténtico y firma válida
```

La verificación utiliza consultas de solo lectura y no requiere conectar una wallet.

## 8. Flujo del historial

El frontend ejecuta:

```text
getDocumentCount
getDocumentHashByIndex
getDocumentInfo
verifyDocument
```

Los hashes y sus datos se recuperan mediante consultas paralelas.

Los resultados se invierten para mostrar primero el registro más reciente.

## 9. Firma digital

La wallet firma los 32 bytes reales del hash:

```typescript
wallet.signMessage(ethers.getBytes(documentHash))
```

No se firman los caracteres de texto que representan el hash hexadecimal.

Ethers.js incorpora el prefijo EIP-191 antes de producir la firma.

El contrato reconstruye el mismo mensaje prefijado y recupera la dirección mediante ECDSA.

## 10. Propiedades garantizadas

El sistema garantiza:

- Detección de cualquier modificación que cambie el hash.
- Correspondencia criptográfica entre hash y firma.
- Correspondencia entre firmante declarado y remitente.
- Inmutabilidad del registro dentro de la blockchain.
- Prevención de registros duplicados.
- Trazabilidad mediante transacción, bloque y evento.

## 11. Límites de confianza

El sistema no garantiza:

- La identidad civil del propietario de una wallet.
- La legalidad del contenido del documento.
- La veracidad de la información contenida en el archivo.
- La conservación del archivo original.
- La disponibilidad permanente de una red local Anvil.

## 12. Entorno de desarrollo

```text
RPC:              http://127.0.0.1:8545
Chain ID:         31337
Solidity:         0.8.20
Foundry:          1.7.1
Next.js:          16.2.10
React:            19.2.4
Ethers.js:        6.17.0
TypeScript:       5.9.3
```

## 13. Consideraciones para una red pública

Antes de desplegar en una red pública se debe:

- Eliminar el mnemonic de desarrollo del frontend.
- Integrar una wallet externa segura.
- Administrar secretos mediante variables protegidas.
- Evaluar costos de gas.
- Configurar una red de pruebas pública antes de producción.
- Auditar nuevamente el contrato.
- Definir persistencia e indexación para historiales extensos.

## 14. Advertencia de seguridad

Las claves y cuentas generadas por Anvil son públicas, conocidas y determinísticas. No deben utilizarse para custodiar fondos reales.
