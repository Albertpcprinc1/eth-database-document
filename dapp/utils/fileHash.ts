import { hexlify } from "ethers";

export async function calculateFileSha256(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();

  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    fileBuffer,
  );

  return hexlify(new Uint8Array(digest));
}