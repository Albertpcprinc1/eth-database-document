# Frontend dApp — ETH Database Document

Frontend descentralizado desarrollado con Next.js, React, TypeScript y Ethers.js v6.

La aplicación permite registrar, firmar, verificar y consultar documentos almacenando únicamente su hash SHA-256 en Ethereum.

## Funcionalidades

- Selección de documentos desde el navegador.
- Cálculo SHA-256 mediante Web Crypto API.
- Derivación de diez wallets determinísticas de Anvil.
- Selección, conexión y desconexión de wallets locales.
- Firma EIP-191 de los 32 bytes reales del hash.
- Registro del documento mediante `DocumentRegistry`.
- Prevención de documentos duplicados.
- Verificación independiente sin conectar wallet.
- Detección de archivos modificados o no registrados.
- Recuperación del firmante, timestamp y firma.
- Consulta del historial blockchain.
- Ordenamiento del historial desde el registro más reciente.

## Tecnologías

- Node.js 22.23.1.
- npm 10.9.8.
- Next.js 16.2.10.
- React 19.2.4.
- React DOM 19.2.4.
- TypeScript 5.9.3.
- Ethers.js 6.17.0.
- Lucide React 1.24.0.
- Tailwind CSS 4.

## Estructura principal

```text
app/page.tsx
app/layout.tsx
app/globals.css
components/DocumentRegistrationForm.tsx
components/DocumentVerificationPanel.tsx
components/DocumentHistoryPanel.tsx
contexts/MetaMaskContext.tsx
hooks/useContract.ts
types/document.ts
utils/fileHash.ts
abi/DocumentRegistry.json
```

## Responsabilidad de los componentes

### `DocumentRegistrationForm`

Calcula el hash del archivo, solicita la firma y registra el documento en Ethereum.

### `DocumentVerificationPanel`

Permite verificar un archivo mediante consultas de solo lectura. No requiere conectar una wallet.

### `DocumentHistoryPanel`

Recupera todos los documentos registrados, valida sus firmas y muestra primero los registros más recientes.

### `MetaMaskContext`

Administra las wallets locales de Anvil, la conexión, el cambio de cuenta y la firma de mensajes.

### `useContract`

Encapsula las operaciones de lectura y escritura del smart contract.

### `fileHash`

Calcula el hash SHA-256 del archivo mediante Web Crypto API.

## Requisitos

```text
Node.js >= 22.23.1 y < 23
npm 10.9.8 o compatible
Anvil disponible en http://127.0.0.1:8545
DocumentRegistry desplegado
```

La versión recomendada de Node está declarada en `.nvmrc`.

## Instalar dependencias

Desde la carpeta `dapp`:

```powershell
npm ci
```

## Configuración local

Copiar la plantilla de variables:

```powershell
Copy-Item ".env.example" ".env.local"
```

Variables requeridas:

```dotenv
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDIRECCION_CONTRATO
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MNEMONIC="test test test test test test test test test test test junk"
```

`dapp/.env.local` está ignorado por Git y no debe subirse al repositorio.

## Ejecutar en desarrollo

```powershell
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Construir para producción

```powershell
npm run build
```

## Validaciones técnicas

### TypeScript

```powershell
npx tsc --noEmit
```

### ESLint

```powershell
npm run lint
```

### Build

```powershell
npm run build
```

### Auditoría de dependencias

```powershell
npm audit --omit=dev
```

Resultado validado:

```text
TypeScript: sin errores
ESLint: sin errores
Next.js build: compilado correctamente
npm audit producción: 0 vulnerabilidades
```

## Flujo de registro

1. El usuario selecciona un archivo.
2. El navegador obtiene sus bytes.
3. Web Crypto API calcula SHA-256.
4. El hash hexadecimal se convierte en 32 bytes.
5. La wallet firma esos bytes mediante EIP-191.
6. La dApp envía hash, timestamp, firmante y firma.
7. El contrato valida la firma antes de almacenar.
8. La dApp verifica nuevamente el documento.

## Flujo de verificación

1. El usuario selecciona el archivo que desea comprobar.
2. La aplicación calcula nuevamente su SHA-256.
3. Se consulta si el hash está registrado.
4. Se recuperan el firmante, timestamp y firma.
5. El contrato valida criptográficamente la firma.
6. La interfaz muestra documento auténtico o no registrado.

## Historial blockchain

El historial utiliza las funciones:

```text
getDocumentCount
getDocumentHashByIndex
getDocumentInfo
verifyDocument
```

Las consultas se ejecutan en paralelo y los resultados se presentan del índice más reciente al más antiguo.

## Consideraciones de privacidad

- El archivo original permanece en el navegador.
- Solo el hash SHA-256 se envía a Ethereum.
- El hash permite detectar modificaciones, pero no recuperar el archivo.
- La identidad mostrada corresponde a una wallet, no necesariamente a una identidad civil.

## Advertencia

El mnemonic incluido pertenece únicamente al entorno local Anvil. Nunca debe utilizarse con fondos reales ni en redes públicas.
