import type { Metadata } from "next";
import { MetaMaskProvider } from "@/contexts/MetaMaskContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETH Database Document",
  description:
    "dApp para almacenar y verificar documentos mediante Ethereum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <MetaMaskProvider>{children}</MetaMaskProvider>
      </body>
    </html>
  );
}
