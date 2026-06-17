"use client";

import dynamic from "next/dynamic";
import { WalletProviders } from "@/components/providers/wallet-providers";
import type { BoostType } from "@/lib/razorpay-checkout";

const CryptoBoostInner = dynamic(
  () => import("@/components/room/CryptoBoostInner").then((m) => m.CryptoBoostInner),
  { ssr: false }
);

interface CryptoBoostOverlayProps {
  roomCode: string;
  queueItemId: string;
  boostType: BoostType;
  onSuccess: (state: unknown) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export function CryptoBoostOverlay(props: CryptoBoostOverlayProps) {
  return (
    <WalletProviders>
      <CryptoBoostInner {...props} />
    </WalletProviders>
  );
}
