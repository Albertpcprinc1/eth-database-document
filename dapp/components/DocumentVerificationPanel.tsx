"use client";

import { useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Clock3,
  FileQuestion,
  FileSearch2,
  FileUp,
  Fingerprint,
  Hash,
  KeyRound,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { useContract } from "@/hooks/useContract";
import type { StoredDocument } from "@/types/document";
import { calculateFileSha256 } from "@/utils/fileHash";

type VerificationStatus =
  | "idle"
  | "hashing"
  | "ready"
  | "checking"
  | "verified"
  | "not-found"
  | "invalid";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurri\u00f3 un error inesperado durante la verificaci\u00f3n.";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 bytes";
  }

  const units = ["bytes", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function formatTimestamp(timestamp: bigint): string {
  const seconds = Number(timestamp);

  if (!Number.isSafeInteger(seconds)) {
    return "Timestamp fuera de rango";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "medium",
  }).format(new Date(seconds * 1000));
}

function getStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    idle: "Seleccione un archivo",
    hashing: "Calculando SHA-256",
    ready: "Archivo listo para verificar",
    checking: "Consultando Ethereum",
    verified: "Documento aut\u00e9ntico",
    "not-found": "Documento no registrado",
    invalid: "Registro o firma inv\u00e1lida",
  };

  return labels[status];
}

export function DocumentVerificationPanel() {
  const {
    getDocumentInfo,
    isDocumentStored,
    verifyDocument,
  } = useContract();

  const [file, setFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState("");
  const [storedDocument, setStoredDocument] =
    useState<StoredDocument | null>(null);
  const [signatureValid, setSignatureValid] =
    useState<boolean | null>(null);
  const [hashMatches, setHashMatches] =
    useState<boolean | null>(null);
  const [status, setStatus] =
    useState<VerificationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isProcessing =
    status === "hashing" || status === "checking";

  const resetVerification = () => {
    setStoredDocument(null);
    setSignatureValid(null);
    setHashMatches(null);
    setError(null);
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setDocumentHash("");
    resetVerification();

    if (!selectedFile) {
      setStatus("idle");
      return;
    }

    setStatus("hashing");

    try {
      const calculatedHash =
        await calculateFileSha256(selectedFile);

      setDocumentHash(calculatedHash);
      setStatus("ready");
    } catch (hashError) {
      setStatus("idle");
      setError(getErrorMessage(hashError));
    }
  };

  const handleVerify = async () => {
    setError(null);
    setStoredDocument(null);
    setSignatureValid(null);
    setHashMatches(null);

    if (!file || !documentHash) {
      setError(
        "Seleccione primero el archivo que desea verificar.",
      );
      return;
    }

    setStatus("checking");

    try {
      const stored = await isDocumentStored(documentHash);

      if (!stored) {
        setStatus("not-found");
        return;
      }

      const document = await getDocumentInfo(documentHash);

      const returnedHashMatches =
        document.hash.toLowerCase() ===
        documentHash.toLowerCase();

      const validSignature = await verifyDocument(
        documentHash,
        document.signer,
        document.signature,
      );

      setStoredDocument(document);
      setHashMatches(returnedHashMatches);
      setSignatureValid(validSignature);

      if (returnedHashMatches && validSignature) {
        setStatus("verified");
      } else {
        setStatus("invalid");
      }
    } catch (verificationError) {
      setStatus("ready");
      setError(getErrorMessage(verificationError));
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="mb-6 flex items-start gap-3">
        <FileSearch2
          className="mt-1 shrink-0 text-amber-400"
          size={26}
        />

        <div>
          <h2 className="text-xl font-semibold">
            Verificaci&oacute;n independiente
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Seleccione un archivo para comprobar si su hash existe
            en Ethereum y si la firma almacenada es v&aacute;lida.
            No es necesario conectar una wallet.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <label
            htmlFor="verification-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-6 py-10 text-center transition hover:border-amber-400"
          >
            <FileUp className="mb-4 text-amber-400" size={36} />

            <span className="font-semibold">
              Seleccionar archivo para verificar
            </span>

            <span className="mt-2 text-sm text-slate-500">
              El archivo se procesa localmente en el navegador
            </span>

            <input
              id="verification-file"
              type="file"
              disabled={isProcessing}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="break-all font-medium text-slate-200">
                {file.name}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                <span>{formatFileSize(file.size)}</span>
                <span>{file.type || "Tipo no especificado"}</span>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estado de verificaci&oacute;n
            </p>

            <div className="mt-3 flex items-center gap-3">
              {isProcessing ? (
                <LoaderCircle
                  className="animate-spin text-amber-400"
                  size={20}
                />
              ) : status === "verified" ? (
                <CheckCircle2
                  className="text-emerald-400"
                  size={20}
                />
              ) : status === "not-found" ||
                status === "invalid" ? (
                <ShieldX className="text-red-400" size={20} />
              ) : (
                <Fingerprint
                  className="text-slate-500"
                  size={20}
                />
              )}

              <span className="font-medium">
                {getStatusLabel(status)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={
              !file ||
              !documentHash ||
              isProcessing
            }
            onClick={handleVerify}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <SearchCheck size={18} />
            )}

            Verificar autenticidad
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Hash size={17} />

              <span className="text-xs font-semibold uppercase tracking-wider">
                SHA-256 calculado
              </span>
            </div>

            <p className="break-all font-mono text-sm text-cyan-300">
              {documentHash || "Pendiente de calcular"}
            </p>
          </div>

          {status === "not-found" && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
              <div className="flex items-center gap-3 text-red-300">
                <FileQuestion size={24} />

                <h3 className="font-semibold">
                  Documento no registrado
                </h3>
              </div>

              <p className="mt-3 text-sm text-red-200/80">
                No existe un registro asociado con este hash en
                el contrato DocumentRegistry.
              </p>
            </div>
          )}

          {storedDocument && (
            <div
              className={
                status === "verified"
                  ? "rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5"
                  : "rounded-xl border border-red-500/40 bg-red-500/10 p-5"
              }
            >
              <div className="mb-5 flex items-center gap-3">
                {status === "verified" ? (
                  <ShieldCheck
                    className="text-emerald-400"
                    size={26}
                  />
                ) : (
                  <ShieldX
                    className="text-red-400"
                    size={26}
                  />
                )}

                <div>
                  <h3 className="font-semibold">
                    {status === "verified"
                      ? "Documento aut\u00e9ntico"
                      : "Verificaci\u00f3n fallida"}
                  </h3>

                  <p className="text-sm text-slate-400">
                    Resultado obtenido directamente desde Ethereum.
                  </p>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="flex items-center gap-2 text-slate-400">
                    <UserRound size={16} />
                    Firmante
                  </dt>

                  <dd className="mt-1 break-all font-mono text-slate-100">
                    {storedDocument.signer}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center gap-2 text-slate-400">
                    <Clock3 size={16} />
                    Fecha del registro
                  </dt>

                  <dd className="mt-1 text-slate-100">
                    {formatTimestamp(storedDocument.timestamp)}
                  </dd>

                  <dd className="mt-1 font-mono text-xs text-slate-500">
                    Unix: {storedDocument.timestamp.toString()}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center gap-2 text-slate-400">
                    <KeyRound size={16} />
                    Firma almacenada
                  </dt>

                  <dd className="mt-1 break-all font-mono text-xs text-violet-300">
                    {storedDocument.signature}
                  </dd>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-950/70 p-3">
                    <dt className="text-slate-500">
                      Coincidencia del hash
                    </dt>

                    <dd className="mt-1 font-semibold">
                      {hashMatches ? "Correcta" : "Incorrecta"}
                    </dd>
                  </div>

                  <div className="rounded-lg bg-slate-950/70 p-3">
                    <dt className="text-slate-500">
                      Firma criptogr&aacute;fica
                    </dt>

                    <dd className="mt-1 font-semibold">
                      {signatureValid ? "V\u00e1lida" : "Inv\u00e1lida"}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}