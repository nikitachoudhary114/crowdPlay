"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, IndianRupee, Coins, ArrowRight } from "lucide-react";

export default function CreatorDashboardPage() {
  const [data, setData] = useState<{
    totalEarnings: number;
    totalRevenue: number;
    boostCount: number;
    splitPercent?: number;
    topSupporters: Array<{ user: { name: string | null }; amount: number | null }>;
    rooms: Array<{
      name: string;
      code: string;
      isActive: boolean;
      grossRevenue: number;
      creatorRevenue: number;
    }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics/creator")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const split = data?.splitPercent ?? 70;

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-2 text-3xl font-bold">Creator Dashboard</h1>
        <p className="mb-8 text-white/60">Track earnings from boosts in your rooms. You keep {split}% of all revenue.</p>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-500/20">
            <CardHeader><CardTitle className="text-sm text-emerald-400/80">Your earnings ({split}%)</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-emerald-400">₹{data?.totalEarnings?.toFixed(0) ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-white/60">Gross room revenue</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">₹{data?.totalRevenue?.toFixed(0) ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-white/60">Boost purchases</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.boostCount ?? 0}</p></CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-violet-400" />
              How to get paid
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <IndianRupee className="h-4 w-4 text-violet-400" /> Fiat (Razorpay)
              </div>
              <p className="text-sm text-white/60">
                INR boosts are collected by the platform via Razorpay. Your {split}% share is tracked here.
                Payouts are settled to your linked bank/UPI — contact support or check Settings for payout details.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Coins className="h-4 w-4 text-fuchsia-400" /> Crypto (CROWD)
              </div>
              <p className="text-sm text-white/60">
                On-chain boosts send {split}% of CROWD directly to your connected wallet via the QueueBoost contract.
                Connect your wallet on the Wallet page, then call <strong>withdrawEarnings</strong> on Polygon Amoy.
              </p>
              <Link href="/wallet" className="mt-3 inline-flex items-center gap-1 text-sm text-fuchsia-400 hover:underline">
                Open wallet <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-xl font-semibold">Top supporters</h2>
        <div className="mb-8 space-y-2">
          {data?.topSupporters?.map((s, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <span>{s.user?.name ?? "Anonymous"}</span>
                <Badge variant="success">₹{s.amount ?? 0}</Badge>
              </CardContent>
            </Card>
          )) ?? <p className="text-white/50">No supporters yet</p>}
        </div>

        <h2 className="mb-4 text-xl font-semibold">Room revenue</h2>
        <div className="space-y-2">
          {data?.rooms?.map((room) => (
              <Card key={room.code}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <span className="font-medium">{room.name}</span>
                    <span className="text-white/40"> ({room.code})</span>
                    {!room.isActive && <Badge className="ml-2" variant="secondary">Ended</Badge>}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-white/50">Gross ₹{room.grossRevenue.toFixed(0)}</span>
                    <span className="font-medium text-emerald-400">Yours ₹{room.creatorRevenue.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="mt-8">
          <Link href="/governance">
            <Button variant="outline">View platform revenue split →</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
