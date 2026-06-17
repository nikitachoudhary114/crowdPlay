"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCryptoBoost } from "@/hooks/use-crypto-boost";
import { createPublicClient, http } from "viem";
import { SUPPORTED_CHAIN } from "@/lib/contracts";
import type { BoostType } from "@/lib/razorpay-checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CryptoBoostInnerProps {
  roomCode: string;
  queueItemId: string;
  boostType: BoostType;
  onSuccess: (state: unknown) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export function CryptoBoostInner({
  roomCode,
  queueItemId,
  boostType,
  onSuccess,
  onError,
  onClose,
}: CryptoBoostInnerProps) {
  const { payBoost, isConnected, address } = useCryptoBoost();
  const [step, setStep] = useState<"connect" | "pay" | "verify">("connect");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (isConnected && address && step === "connect") setStep("pay");
  }, [isConnected, address, step]);

  async function handlePay() {
    if (!address) return;
    setPaying(true);
    setStep("verify");
    try {
      const txHash = await payBoost({ roomCode, queueItemId, boostType });
      const client = createPublicClient({ chain: SUPPORTED_CHAIN, transport: http() });
      await client.waitForTransactionReceipt({ hash: txHash });

      const verifyRes = await fetch("/api/payments/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, queueItemId, boostType, txHash, walletAddress: address }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verification failed");
      onSuccess(verifyData.state);
    } catch (e) {
      onError((e as Error).message);
      setStep("pay");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-fuchsia-500/30">
        <CardHeader>
          <CardTitle className="text-lg">Pay with CROWD</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "connect" && (
            <>
              <p className="text-sm text-white/60">Connect MetaMask on Polygon Amoy to continue.</p>
              <ConnectButton />
            </>
          )}
          {step === "pay" && (
            <>
              <p className="text-sm text-white/60">Wallet connected. Confirm the on-chain boost payment.</p>
              <Button variant="glow" className="w-full" onClick={handlePay} disabled={paying}>
                Confirm payment
              </Button>
            </>
          )}
          {step === "verify" && (
            <div className="flex items-center justify-center gap-2 py-4 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              {paying ? "Waiting for wallet & blockchain…" : "Done"}
            </div>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={paying}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
