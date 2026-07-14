"use client";

import { useCallback, useMemo } from "react";
import {
  Contract,
  getAddress,
  isAddress,
  isHexString,
  type ContractTransactionResponse,
  type InterfaceAbi,
} from "ethers";
import DocumentRegistryAbi from "@/abi/DocumentRegistry.json";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import type {
  StoredDocument,
  StoreDocumentResult,
} from "@/types/document";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() || "";

function validateDocumentHash(hash: string): void {
  if (!isHexString(hash, 32)) {
    throw new Error("The document hash must contain exactly 32 bytes.");
  }
}

function validateSignature(signature: string): void {
  if (!isHexString(signature, 65)) {
    throw new Error("The Ethereum signature must contain exactly 65 bytes.");
  }
}

export function useContract() {
  const { provider, getSigner } = useMetaMask();

  const contract = useMemo(() => {
    if (!isAddress(CONTRACT_ADDRESS)) {
      return null;
    }

    return new Contract(
      getAddress(CONTRACT_ADDRESS),
      DocumentRegistryAbi as InterfaceAbi,
      provider,
    );
  }, [provider]);

  const requireContract = useCallback(() => {
    if (!contract) {
      throw new Error(
        "NEXT_PUBLIC_CONTRACT_ADDRESS is missing or invalid.",
      );
    }

    return contract;
  }, [contract]);

  const storeDocumentHash = useCallback(
    async (
      hash: string,
      timestamp: bigint,
      signature: string,
      signerAddress: string,
    ): Promise<StoreDocumentResult> => {
      validateDocumentHash(hash);
      validateSignature(signature);

      if (timestamp <= 0n) {
        throw new Error("The timestamp must be greater than zero.");
      }

      if (!isAddress(signerAddress)) {
        throw new Error("The signer address is invalid.");
      }

      const currentContract = requireContract();
      const signer = await getSigner();
      const connectedAddress = getAddress(await signer.getAddress());
      const expectedAddress = getAddress(signerAddress);

      if (connectedAddress !== expectedAddress) {
        throw new Error(
          "The connected wallet does not match the document signer.",
        );
      }

      const writableContract = currentContract.connect(signer);
      const storeFunction = writableContract.getFunction(
        "storeDocumentHash",
      );

      const transaction = (await storeFunction(
        hash,
        timestamp,
        signature,
        expectedAddress,
      )) as ContractTransactionResponse;

      const receipt = await transaction.wait();

      if (!receipt) {
        throw new Error("The transaction receipt was not generated.");
      }

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    },
    [getSigner, requireContract],
  );

  const verifyDocument = useCallback(
    async (
      hash: string,
      signerAddress: string,
      signature: string,
    ): Promise<boolean> => {
      validateDocumentHash(hash);

      if (!isAddress(signerAddress)) {
        return false;
      }

      if (!isHexString(signature, 65)) {
        return false;
      }

      const currentContract = requireContract();
      const verifyFunction = currentContract.getFunction("verifyDocument");

      return (await verifyFunction.staticCall(
        hash,
        getAddress(signerAddress),
        signature,
      )) as boolean;
    },
    [requireContract],
  );

  const getDocumentInfo = useCallback(
    async (hash: string): Promise<StoredDocument> => {
      validateDocumentHash(hash);

      const currentContract = requireContract();
      const getInfoFunction = currentContract.getFunction(
        "getDocumentInfo",
      );

      const result = (await getInfoFunction.staticCall(hash)) as unknown as
        readonly [string, bigint, string, string];

      return {
        hash: result[0],
        timestamp: result[1],
        signer: getAddress(result[2]),
        signature: result[3],
      };
    },
    [requireContract],
  );

  const isDocumentStored = useCallback(
    async (hash: string): Promise<boolean> => {
      validateDocumentHash(hash);

      const currentContract = requireContract();
      const storedFunction = currentContract.getFunction(
        "isDocumentStored",
      );

      return (await storedFunction.staticCall(hash)) as boolean;
    },
    [requireContract],
  );

  const getDocumentCount = useCallback(async (): Promise<bigint> => {
    const currentContract = requireContract();
    const countFunction = currentContract.getFunction("getDocumentCount");
    const result = await countFunction.staticCall();

    return BigInt(result.toString());
  }, [requireContract]);

  const getDocumentHashByIndex = useCallback(
    async (index: number | bigint): Promise<string> => {
      const normalizedIndex = BigInt(index);

      if (normalizedIndex < 0n) {
        throw new Error("The document index cannot be negative.");
      }

      const currentContract = requireContract();
      const hashFunction = currentContract.getFunction(
        "getDocumentHashByIndex",
      );

      return (await hashFunction.staticCall(normalizedIndex)) as string;
    },
    [requireContract],
  );

  const getAllDocuments = useCallback(async (): Promise<StoredDocument[]> => {
    const count = await getDocumentCount();
    const documents: StoredDocument[] = [];

    for (let index = 0n; index < count; index += 1n) {
      const hash = await getDocumentHashByIndex(index);
      documents.push(await getDocumentInfo(hash));
    }

    return documents;
  }, [getDocumentCount, getDocumentHashByIndex, getDocumentInfo]);

  return {
    contractAddress: CONTRACT_ADDRESS,
    storeDocumentHash,
    verifyDocument,
    getDocumentInfo,
    isDocumentStored,
    getDocumentCount,
    getDocumentHashByIndex,
    getAllDocuments,
  };
}
