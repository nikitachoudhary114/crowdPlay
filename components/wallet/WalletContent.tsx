"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CROWD_PRICES, CONTRACT_ADDRESSES } from "@/lib/constants";
import { Gem, Coins } from "lucide-react";

export function WalletContent() {
  const { data: session } = useSession();
  const { address, isConnected } = useAccount();
  const [wallet, setWallet] = useState<{
    crowdBalance: number;
    badges: Array<{ type: string }>;
    nftMembership: { tokenId: string } | null;
    transactions: Array<{ amount: number; type: string; createdAt: string }>;
  } | null>(null);

  useEffect(() => {
    if (session) fetch("/api/wallet").then((r) => r.json()).then((d) => setWallet(d.user));
  }, [session]);

  useEffect(() => {
    if (isConnected && address && session) {
      fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
    }
  }, [isConnected, address, session]);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Wallet</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-fuchsia-400" /> CROWD Balance
            </CardTitle>
            <CardDescription>Platform utility token on Polygon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-fuchsia-400">{wallet?.crowdBalance ?? 0} CROWD</p>
            <div className="mt-4 space-y-1 text-sm text-white/50">
              <p>Vote Boost: {CROWD_PRICES.VOTE_BOOST} CROWD</p>
              <p>Queue Jump: {CROWD_PRICES.QUEUE_JUMP} CROWD</p>
              <p>Play Next: {CROWD_PRICES.PLAY_NEXT} CROWD</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>MetaMask on Polygon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConnectButton />
            {isConnected && <p className="text-sm text-white/50">Connected: {address}</p>}
            <div className="text-xs text-white/30">
              <p>Token: {CONTRACT_ADDRESSES.CROWD_TOKEN}</p>
              <p>QueueBoost: {CONTRACT_ADDRESSES.QUEUE_BOOST}</p>
            </div>
          </CardContent>
        </Card>

        {wallet?.nftMembership && (
          <Card className="mb-6 border-fuchsia-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" /> NFT Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success">Token #{wallet.nftMembership.tokenId}</Badge>
              <p className="mt-2 text-sm text-white/50">Double voting power · Exclusive rooms · Priority access</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {wallet?.transactions?.map((tx, i) => (
              <div key={i} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                <span>{tx.type}</span>
                <span className={tx.amount < 0 ? "text-red-400" : "text-emerald-400"}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} CROWD
                </span>
              </div>
            )) ?? <p className="text-white/50">No transactions yet</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
