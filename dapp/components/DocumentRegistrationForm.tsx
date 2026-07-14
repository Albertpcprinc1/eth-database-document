"use client";

import { useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  FileCheck2,
  FileUp,
  Fingerprint,
  Hash,
  LoaderCircle,
  PenLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import { getBytes } from "ethers";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useContract } from "@/hooks/useContract";
import type { StoreDocumentResult } from "@/types/document";
import { calculateFileSha256 } from "@/utils/fileHash";

interface DocumentRegistrationFormProps {
  onStored?: () => void | Promise<void>;
}

type ProcessStatus =
  | "idle"
  | "hashing"
  | "ready"
  | "signing"
  | "submitting"
  | "verifying"
  | "success";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado durante el registro.";
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

function getStatusLabel(status: ProcessStatus): string {
  const labels: Record<ProcessStatus, string> = {
    idle: "Seleccione un archivo",
    hashing: "Calculando SHA-256",
    ready: "Archivo listo para firmar",
    signing: "Firmando hash",
    submitting: "Enviando transacción",
    verifying: "Verificando registro",
    success: "Documento registrado y verificado",
  };

  return labels[status];
}

export function DocumentRegistrationForm({
  onStored,
}: DocumentRegistrationFormProps) {
  const {
    currentAddress,
    isConnected,
    signMessage,
  } = useMetaMask();

  const {
    isDocumentStored,
    storeDocumentHash,
    verifyDocument,
  } = useContract();

  const [file, setFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState("");
  const [signature, setSignature] = useState("");
  const [timestamp, setTimestamp] = useState<bigint | null>(null);
  const [transaction, setTransaction] =
    useState<StoreDocumentResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isProcessing = [
    "hashing",
    "signing",
    "submitting",
    "verifying",
  ].includes(status);

  const resetResult = () => {
    setSignature("");
    setTimestamp(null);
    setTransaction(null);
    setIsVerified(false);
    setError(null);
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setDocumentHash("");
    resetResult();

    if (!selectedFile) {
      setStatus("idle");
      return;
    }

    setStatus("hashing");

    try {
      const hash = await calculateFileSha256(selectedFile);

      setDocumentHash(hash);
      setStatus("ready");
    } catch (hashError) {
      setStatus("idle");
      setError(getErrorMessage(hashError));
    }
  };

  const handleRegister = async () => {
    setError(null);
    setTransaction(null);
    setIsVerified(false);

    if (!file || !documentHash) {
      setError("Seleccione primero un archivo válido.");
      return;
    }

    if (!isConnected || !currentAddress) {
      setError("Conecte una wallet de Anvil antes de registrar.");
      return;
    }

    try {
      const alreadyStored = await isDocumentStored(documentHash);

      if (alreadyStored) {
        throw new Error(
          "Este documento ya se encuentra registrado en Ethereum.",
        );
      }

      setStatus("signing");

      /*
       * Se firman los 32 bytes reales del SHA-256.
       * No se firman los caracteres de la cadena hexadecimal.
       */
      const generatedSignature = await signMessage(
        getBytes(documentHash),
      );

      const generatedTimestamp = BigInt(
        Math.floor(Date.now() / 1000),
      );

      setSignature(generatedSignature);
      setTimestamp(generatedTimestamp);
      setStatus("submitting");

      const result = await storeDocumentHash(
        documentHash,
        generatedTimestamp,
        generatedSignature,
        currentAddress,
      );

      setTransaction(result);
      setStatus("verifying");

      const verified = await verifyDocument(
        documentHash,
        currentAddress,
        generatedSignature,
      );

      if (!verified) {
        throw new Error(
          "El contrato almacenó la transacción, pero la verificación criptográfica devolvió false.",
        );
      }

      setIsVerified(true);
      setStatus("success");

      await onStored?.();
    } catch (registrationError) {
      setStatus(documentHash ? "ready" : "idle");
      setError(getErrorMessage(registrationError));
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="mb-6 flex items-start gap-3">
        <FileCheck2
          className="mt-1 shrink-0 text-violet-400"
          size={26}
        />

        <div>
          <h2 className="text-xl font-semibold">
            Registrar documento
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            El archivo no se envía a Ethereum. Solo se almacena su
            hash SHA-256, la fecha, el firmante y la firma digital.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <label
            htmlFor="document-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-6 py-10 text-center transition hover:border-violet-400"
          >
            <FileUp className="mb-4 text-violet-400" size={36} />

            <span className="font-semibold">
              Seleccionar documento
            </span>

            <span className="mt-2 text-sm text-slate-500">
              PDF, Word, imagen, texto u otro archivo
            </span>

            <input
              id="document-file"
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
              Estado del proceso
            </p>

            <div className="mt-3 flex items-center gap-3">
              {isProcessing ? (
                <LoaderCircle
                  className="animate-spin text-violet-400"
                  size={20}
                />
              ) : status === "success" ? (
                <CheckCircle2
                  className="text-emerald-400"
                  size={20}
                />
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
              !isConnected ||
              isProcessing ||
              status === "success"
            }
            onClick={handleRegister}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}

            Firmar y registrar en Ethereum
          </button>

          {!isConnected && (
            <p className="mt-3 text-sm text-amber-300">
              Conecte una wallet de Anvil para habilitar el registro.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <Hash size={17} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                SHA-256
              </span>
            </div>

            <p className="break-all font-mono text-sm text-cyan-300">
              {documentHash || "Pendiente de calcular"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <PenLine size={17} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Firma Ethereum
              </span>
            </div>

            <p className="break-all font-mono text-sm text-violet-300">
              {signature || "Pendiente de firmar"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Timestamp Unix
            </p>

            <p className="mt-2 font-mono text-sm text-slate-200">
              {timestamp?.toString() ?? "Pendiente"}
            </p>
          </div>

          {transaction && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="mb-4 flex items-center gap-2 text-emerald-300">
                <ShieldCheck size={20} />
                <span className="font-semibold">
                  Transacción confirmada
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-emerald-200/60">
                    Transaction hash
                  </dt>
                  <dd className="mt-1 break-all font-mono text-emerald-100">
                    {transaction.transactionHash}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-emerald-200/60">
                      Bloque
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {transaction.blockNumber}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-emerald-200/60">
                      Gas utilizado
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {transaction.gasUsed.toString()}
                    </dd>
                  </div>
                </div>

                <div>
                  <dt className="text-emerald-200/60">
                    Verificación criptográfica
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {isVerified
                      ? "Firma válida"
                      : "Pendiente"}
                  </dd>
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