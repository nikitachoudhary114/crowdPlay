"use client";

import dynamic from "next/dynamic";
import { WalletProviders } from "@/components/providers/wallet-providers";

const WalletContent = dynamic(() => import("@/components/wallet/WalletContent").then((m) => m.WalletContent), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <p className="text-white/50">Loading wallet...</p>
    </div>
  ),
});

export default function WalletPage() {
  return (
    <WalletProviders>
      <WalletContent />
    </WalletProviders>
  );
}
