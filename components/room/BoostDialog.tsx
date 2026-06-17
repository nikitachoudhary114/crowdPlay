"use client";

import { useState } from "react";
import { BOOST_PRICES, CROWD_PRICES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, X } from "lucide-react";
import type { BoostType } from "@/lib/razorpay-checkout";

export type PaymentMethod = "FIAT" | "CRYPTO";

const BOOST_OPTIONS: { type: BoostType; label: string; description: string }[] = [
  { type: "BOOST", label: "Boost Song", description: "Move higher in the queue" },
  { type: "PRIORITY_BOOST", label: "Priority Boost", description: "Significant queue priority" },
  { type: "PLAY_NEXT", label: "Play Next", description: "Play after the current song" },
  { type: "SUPER_PRIORITY", label: "Super Priority", description: "Play immediately for everyone" },
];

const CROWD_PRICE_MAP: Record<BoostType, number> = {
  BOOST: CROWD_PRICES.VOTE_BOOST,
  PRIORITY_BOOST: CROWD_PRICES.QUEUE_JUMP,
  PLAY_NEXT: CROWD_PRICES.PLAY_NEXT,
  SUPER_PRIORITY: CROWD_PRICES.SUPER_PRIORITY,
};

interface BoostDialogProps {
  songTitle: string;
  onClose: () => void;
  onSelect: (boostType: BoostType, method: PaymentMethod) => void;
  loading?: boolean;
  cryptoConfigured?: boolean;
}

export function BoostDialog({
  songTitle,
  onClose,
  onSelect,
  loading,
  cryptoConfigured = false,
}: BoostDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("FIAT");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-violet-500/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Boost this song
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{songTitle}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 rounded-xl bg-white/5 p-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => setMethod("FIAT")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                method === "FIAT" ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              Razorpay (INR)
            </button>
            <button
              type="button"
              disabled={loading || !cryptoConfigured}
              onClick={() => setMethod("CRYPTO")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                method === "CRYPTO" ? "bg-fuchsia-600 text-white" : "text-white/60 hover:text-white"
              } ${!cryptoConfigured ? "opacity-40" : ""}`}
            >
              CROWD (Web3)
            </button>
          </div>

          {!cryptoConfigured && (
            <p className="text-xs text-white/40">Web3: set contract addresses in .env to enable CROWD payments.</p>
          )}

          {BOOST_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={loading}
              onClick={() => onSelect(option.type, method)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-violet-500/40 hover:bg-violet-600/10 disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-white">{option.label}</p>
                <p className="text-xs text-white/50">{option.description}</p>
              </div>
              <span className="text-lg font-bold text-violet-400">
                {method === "FIAT"
                  ? `₹${BOOST_PRICES[option.type]}`
                  : `${CROWD_PRICE_MAP[option.type]} CROWD`}
              </span>
            </button>
          ))}

          <p className="pt-1 text-center text-xs text-white/40">
            {method === "FIAT"
              ? "UPI, card, or net banking via Razorpay"
              : "MetaMask on Polygon Amoy — all 4 boost tiers supported"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
