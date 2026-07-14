export interface StoredDocument {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
}

export interface StoreDocumentResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}
