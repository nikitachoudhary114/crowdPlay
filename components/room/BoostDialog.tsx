"use client";

import { BOOST_PRICES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, X } from "lucide-react";
import type { BoostType } from "@/lib/razorpay-checkout";

const BOOST_OPTIONS: { type: BoostType; label: string; description: string }[] = [
  { type: "BOOST", label: "Boost Song", description: "Move higher in the queue" },
  { type: "PRIORITY_BOOST", label: "Priority Boost", description: "Significant queue priority" },
  { type: "PLAY_NEXT", label: "Play Next", description: "Play after the current song" },
  { type: "SUPER_PRIORITY", label: "Super Priority", description: "Jump to the front" },
];

interface BoostDialogProps {
  songTitle: string;
  onClose: () => void;
  onSelect: (boostType: BoostType) => void;
  loading?: boolean;
}

export function BoostDialog({ songTitle, onClose, onSelect, loading }: BoostDialogProps) {
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
        <CardContent className="space-y-2">
          {BOOST_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={loading}
              onClick={() => onSelect(option.type)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-violet-500/40 hover:bg-violet-600/10 disabled:opacity-50"
            >
              <div>
                <p className="font-medium text-white">{option.label}</p>
                <p className="text-xs text-white/50">{option.description}</p>
              </div>
              <span className="text-lg font-bold text-violet-400">₹{BOOST_PRICES[option.type]}</span>
            </button>
          ))}
          <p className="pt-2 text-center text-xs text-white/40">
            Pay with UPI, card, or net banking via Razorpay
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
