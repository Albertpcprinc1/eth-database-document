"use client";

import { useState } from "react";
import {
  Database,
  Link2,
  LoaderCircle,
  RefreshCw,
  Unplug,
  WalletCards,
} from "lucide-react";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { useContract } from "@/hooks/useContract";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function Home() {
  const {
    wallets,
    currentAddress,
    isConnected,
    connect,
    disconnect,
    rpcUrl,
    chainId,
  } = useMetaMask();

  const { contractAddress, getDocumentCount } = useContract();

  const [walletIndex, setWalletIndex] = useState(0);
  const [documentCount, setDocumentCount] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      await connect(walletIndex);
      const count = await getDocumentCount();
      setDocumentCount(count);
    } catch (connectError) {
      setError(getErrorMessage(connectError));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const count = await getDocumentCount();
      setDocumentCount(count);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setDocumentCount(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Ethereum Document Registry
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ETH Database Document
          </h1>
          <p className="mt-4 max-w-3xl text-slate-400">
            Prueba inicial de conexión entre Next.js, las wallets locales
            de Anvil y el contrato DocumentRegistry.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <WalletCards className="text-cyan-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Wallet local</h2>
                <p className="text-sm text-slate-400">
                  Seleccione una de las diez cuentas de Anvil.
                </p>
              </div>
            </div>

            <label
              className="mb-2 block text-sm font-medium text-slate-300"
              htmlFor="wallet"
            >
              Cuenta de prueba
            </label>

            <select
              id="wallet"
              value={walletIndex}
              disabled={loading}
              onChange={(event) => setWalletIndex(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-500"
            >
              {wallets.map((wallet) => (
                <option key={wallet.address} value={wallet.index}>
                  {wallet.label} - {wallet.address}
                </option>
              ))}
            </select>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Link2 size={18} />
                )}
                Connect Wallet
              </button>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:border-red-400 hover:text-red-300"
                >
                  <Unplug size={18} />
                  Disconnect
                </button>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Estado
              </p>
              <p className="mt-2 font-medium">
                {isConnected ? "Conectado" : "Desconectado"}
              </p>
              <p className="mt-2 break-all text-sm text-slate-400">
                {currentAddress ?? "Sin dirección seleccionada"}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <Database className="text-emerald-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Contrato</h2>
                <p className="text-sm text-slate-400">
                  Lectura directa mediante JsonRpcProvider.
                </p>
              </div>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">RPC</dt>
                <dd className="mt-1 break-all">{rpcUrl}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Chain ID</dt>
                <dd className="mt-1">{chainId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contrato</dt>
                <dd className="mt-1 break-all">{contractAddress}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Documentos registrados</dt>
                <dd className="mt-1 text-3xl font-bold text-emerald-400">
                  {documentCount === null
                    ? "Sin consultar"
                    : documentCount.toString()}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={loading}
              onClick={handleRefresh}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={18} />
              Refresh Document Count
            </button>
          </article>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
