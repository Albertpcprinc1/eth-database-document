"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Clock3,
  FileStack,
  Hash,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { useContract } from "@/hooks/useContract";
import type { StoredDocument } from "@/types/document";

interface HistoryEntry extends StoredDocument {
  index: bigint;
  signatureValid: boolean;
}

interface DocumentHistoryPanelProps {
  refreshKey?: number;
  onCountChange?: (count: bigint) => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurri\u00f3 un error al consultar el historial.";
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

export function DocumentHistoryPanel({
  refreshKey = 0,
  onCountChange,
}: DocumentHistoryPanelProps) {
  const {
    getAllDocuments,
    verifyDocument,
  } = useContract();

  const [documents, setDocuments] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storedDocuments = await getAllDocuments();

      const signatureResults = await Promise.all(
        storedDocuments.map(async (document) => {
          try {
            return await verifyDocument(
              document.hash,
              document.signer,
              document.signature,
            );
          } catch {
            return false;
          }
        }),
      );

      const historyEntries = storedDocuments
        .map((document, index) => ({
          ...document,
          index: BigInt(index),
          signatureValid: signatureResults[index],
        }))
        .reverse();

      setDocuments(historyEntries);
      onCountChange?.(BigInt(storedDocuments.length));
    } catch (historyError) {
      setDocuments([]);
      setError(getErrorMessage(historyError));
    } finally {
      setLoading(false);
    }
  }, [getAllDocuments, onCountChange, verifyDocument]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadHistory, refreshKey]);

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <History
            className="mt-1 shrink-0 text-sky-400"
            size={26}
          />

          <div>
            <h2 className="text-xl font-semibold">
              Historial blockchain
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Registros recuperados directamente desde
              DocumentRegistry, ordenados del m&aacute;s reciente
              al m&aacute;s antiguo.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void loadHistory()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-sky-500 px-4 py-2.5 font-semibold text-sky-300 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={loading ? "animate-spin" : ""}
            size={17}
          />
          Actualizar historial
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Total recuperado
        </p>

        <p className="mt-2 text-3xl font-bold text-sky-400">
          {loading ? "..." : documents.length}
        </p>
      </div>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-10 text-slate-400">
          <LoaderCircle
            className="animate-spin text-sky-400"
            size={22}
          />
          Consultando documentos en Ethereum...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center">
          <FileStack className="text-slate-500" size={36} />

          <h3 className="mt-4 font-semibold">
            No existen documentos registrados
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            El historial se completar&aacute; cuando se almacene el
            primer hash documental.
          </p>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <div className="mt-6 space-y-4">
          {documents.map((document) => (
            <article
              key={document.hash}
              className="rounded-xl border border-slate-800 bg-slate-950 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Registro #{(document.index + 1n).toString()}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Unix: {document.timestamp.toString()}
                  </p>
                </div>

                <div
                  className={
                    document.signatureValid
                      ? "inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-300"
                      : "inline-flex w-fit items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-300"
                  }
                >
                  {document.signatureValid ? (
                    <ShieldCheck size={17} />
                  ) : (
                    <ShieldX size={17} />
                  )}

                  {document.signatureValid
                    ? "Firma v\u00e1lida"
                    : "Firma inv\u00e1lida"}
                </div>
              </div>

              <dl className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-slate-900 p-4 lg:col-span-2">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <Hash size={16} />
                    SHA-256
                  </dt>

                  <dd className="mt-2 break-all font-mono text-sm text-cyan-300">
                    {document.hash}
                  </dd>
                </div>

                <div className="rounded-lg bg-slate-900 p-4">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <UserRound size={16} />
                    Firmante
                  </dt>

                  <dd className="mt-2 break-all font-mono text-sm text-slate-200">
                    {document.signer}
                  </dd>
                </div>

                <div className="rounded-lg bg-slate-900 p-4">
                  <dt className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={16} />
                    Fecha de registro
                  </dt>

                  <dd className="mt-2 text-sm text-slate-200">
                    {formatTimestamp(document.timestamp)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}