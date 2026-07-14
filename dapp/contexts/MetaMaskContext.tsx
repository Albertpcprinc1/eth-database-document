"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  HDNodeWallet,
  JsonRpcProvider,
  Wallet,
  getAddress,
  type Signer,
} from "ethers";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL?.trim() || "http://127.0.0.1:8545";

const CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "31337",
);

const ANVIL_MNEMONIC =
  process.env.NEXT_PUBLIC_MNEMONIC?.trim() || "";

interface DerivedAnvilWallet {
  index: number;
  address: string;
  privateKey: string;
}

export interface AnvilWalletInfo {
  index: number;
  address: string;
  label: string;
}

interface MetaMaskContextValue {
  provider: JsonRpcProvider;
  rpcUrl: string;
  chainId: number;
  wallets: AnvilWalletInfo[];
  selectedWalletIndex: number | null;
  currentAddress: string | null;
  isConnected: boolean;
  connect: (walletIndex: number) => Promise<string>;
  disconnect: () => void;
  switchWallet: (walletIndex: number) => Promise<string>;
  signMessage: (message: string | Uint8Array) => Promise<string>;
  getSigner: () => Promise<Signer>;
}

const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID);

function deriveAnvilWallets(): DerivedAnvilWallet[] {
  if (!ANVIL_MNEMONIC) {
    return [];
  }

  return Array.from({ length: 10 }, (_, index) => {
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = HDNodeWallet.fromPhrase(
      ANVIL_MNEMONIC,
      undefined,
      path,
    );

    return {
      index,
      address: getAddress(wallet.address),
      privateKey: wallet.privateKey,
    };
  });
}

const derivedWallets = deriveAnvilWallets();

const publicWallets: AnvilWalletInfo[] = derivedWallets.map((wallet) => ({
  index: wallet.index,
  address: wallet.address,
  label: `Wallet ${wallet.index}`,
}));

const MetaMaskContext = createContext<MetaMaskContextValue | undefined>(
  undefined,
);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [selectedWalletIndex, setSelectedWalletIndex] = useState<
    number | null
  >(null);

  const connect = useCallback(async (walletIndex: number) => {
    const selectedWallet = derivedWallets[walletIndex];

    if (!selectedWallet) {
      throw new Error(`Wallet ${walletIndex} is not available.`);
    }

    const network = await provider.getNetwork();

    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error(
        `Unexpected chain ID. Expected ${CHAIN_ID} but received ${network.chainId.toString()}.`,
      );
    }

    setSelectedWalletIndex(walletIndex);

    return selectedWallet.address;
  }, []);

  const disconnect = useCallback(() => {
    setSelectedWalletIndex(null);
  }, []);

  const switchWallet = useCallback(
    async (walletIndex: number) => connect(walletIndex),
    [connect],
  );

  const getSigner = useCallback(async (): Promise<Signer> => {
    if (selectedWalletIndex === null) {
      throw new Error("Connect an Anvil wallet first.");
    }

    const selectedWallet = derivedWallets[selectedWalletIndex];

    if (!selectedWallet) {
      throw new Error("The selected wallet is not available.");
    }

    return new Wallet(selectedWallet.privateKey, provider);
  }, [selectedWalletIndex]);

  const signMessage = useCallback(
    async (message: string | Uint8Array) => {
      const signer = await getSigner();
      return signer.signMessage(message);
    },
    [getSigner],
  );

  const currentAddress =
    selectedWalletIndex === null
      ? null
      : derivedWallets[selectedWalletIndex]?.address ?? null;

  const value = useMemo<MetaMaskContextValue>(
    () => ({
      provider,
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      wallets: publicWallets,
      selectedWalletIndex,
      currentAddress,
      isConnected: selectedWalletIndex !== null,
      connect,
      disconnect,
      switchWallet,
      signMessage,
      getSigner,
    }),
    [
      selectedWalletIndex,
      currentAddress,
      connect,
      disconnect,
      switchWallet,
      signMessage,
      getSigner,
    ],
  );

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask(): MetaMaskContextValue {
  const context = useContext(MetaMaskContext);

  if (!context) {
    throw new Error("useMetaMask must be used inside MetaMaskProvider.");
  }

  return context;
}
