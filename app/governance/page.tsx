"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PieChart, Users, Building2, Coins, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/app/generated/prisma";

interface GovernanceStats {
  breakdown: {
    totalRevenue: number;
    creatorPool: number;
    platformPool: number;
    fiatRevenue: number;
    cryptoRevenue: number;
    boostCount: number;
    split: { creatorSharePercent: number; platformSharePercent: number };
  };
  config: {
    boostPrice: number;
    priorityBoostPrice: number;
    playNextPrice: number;
    superPriorityPrice: number;
    creatorSharePercent: number;
    platformSharePercent: number;
    cooldownMinutes: number;
    maxQueueSize: number;
  } | null;
  roomBreakdown: Array<{
    roomName: string;
    roomCode: string;
    isActive: boolean;
    ownerName: string | null;
    totalRevenue: number;
    creatorShare: number;
    platformShare: number;
  }>;
  isAdmin: boolean;
}

export default function GovernancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [proposals, setProposals] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    votesFor: number;
    votesAgainst: number;
    endsAt: string;
    proposer: { name: string | null };
  }>>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creatorShare, setCreatorShare] = useState(70);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [statsRes, proposalsRes] = await Promise.all([
      fetch("/api/governance/stats"),
      fetch("/api/governance/proposals"),
    ]);
    const statsData = await statsRes.json();
    const proposalsData = await proposalsRes.json();
    setStats(statsData);
    setProposals(proposalsData.proposals ?? []);
    if (statsData.config?.creatorSharePercent) {
      setCreatorShare(statsData.config.creatorSharePercent);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createProposal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/governance/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      await loadData();
    }
  }

  async function vote(proposalId: string, support: boolean) {
    await fetch("/api/governance/proposals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId, support }),
    });
    await loadData();
  }

  async function saveRevenueSplit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/governance/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorSharePercent: creatorShare }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Revenue split updated", variant: "success" });
        await loadData();
      } else {
        toast({ title: "Update failed", description: data.error, variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  const b = stats?.breakdown;
  const cfg = stats?.config;
  const isPlatformAdmin = session?.user?.role === UserRole.PLATFORM_ADMIN;

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        <h1 className="mb-2 text-3xl font-bold">DAO Governance</h1>
        <p className="mb-8 text-white/60">
          Platform economics, revenue distribution, and community proposals.
        </p>

        <Card className="mb-8 border-white/10 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-base">What are proposals?</CardTitle>
            <CardDescription>
              Proposals let the community vote on platform changes — like revenue split %, boost prices, or queue rules.
              They are <strong>not payments</strong>. Actual boosts happen in a live room via Razorpay (INR) or CROWD tokens (Web3).
              Token holders and NFT members get extra voting weight.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Revenue overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white/60">
                <IndianRupee className="h-4 w-4" /> Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{b?.totalRevenue?.toFixed(0) ?? 0}</p>
              <p className="text-xs text-white/40">{b?.boostCount ?? 0} boosts</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-400/80">
                <Users className="h-4 w-4" /> Creator Pool ({b?.split.creatorSharePercent ?? 70}%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">₹{b?.creatorPool?.toFixed(0) ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-violet-400/80">
                <Building2 className="h-4 w-4" /> Platform ({b?.split.platformSharePercent ?? 30}%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-violet-400">₹{b?.platformPool?.toFixed(0) ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white/60">
                <Coins className="h-4 w-4" /> By method
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Fiat: ₹{b?.fiatRevenue?.toFixed(0) ?? 0}</p>
              <p className="text-fuchsia-400">Crypto: {b?.cryptoRevenue?.toFixed(0) ?? 0} CROWD</p>
            </CardContent>
          </Card>
        </div>

        {/* Split visual */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-violet-400" />
              Revenue Split
            </CardTitle>
            <CardDescription>
              Every boost payment is split between room creators and the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-4 overflow-hidden rounded-full">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${b?.split.creatorSharePercent ?? 70}%` }}
              />
              <div
                className="bg-violet-500 transition-all"
                style={{ width: `${b?.split.platformSharePercent ?? 30}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400">Creators {b?.split.creatorSharePercent ?? 70}%</span>
              <span className="text-violet-400">Platform {b?.split.platformSharePercent ?? 30}%</span>
            </div>

            {isPlatformAdmin && (
              <form onSubmit={saveRevenueSplit} className="mt-4 flex flex-wrap items-end gap-4 border-t border-white/10 pt-4">
                <p className="w-full text-xs text-amber-400/80">Platform admin only</p>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Creator share %</label>
                  <Input
                    type="number"
                    min={50}
                    max={95}
                    value={creatorShare}
                    onChange={(e) => setCreatorShare(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <p className="text-sm text-white/50">Platform gets {100 - creatorShare}%</p>
                <Button type="submit" variant="glow" disabled={saving}>
                  {saving ? "Saving…" : "Update split"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Per-room breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Room Revenue Breakdown</CardTitle>
            <CardDescription>How income is distributed per room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.roomBreakdown?.length ? (
              stats.roomBreakdown.map((room) => (
                <div
                  key={room.roomCode}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {room.roomName}{" "}
                      <span className="text-white/40">({room.roomCode})</span>
                      {!room.isActive && <Badge className="ml-2" variant="secondary">Ended</Badge>}
                    </p>
                    <p className="text-xs text-white/40">Host: {room.ownerName ?? "Unknown"}</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-white/40 text-xs">Total</p>
                      <p className="font-medium">₹{room.totalRevenue.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-emerald-400/60 text-xs">Creator</p>
                      <p className="text-emerald-400">₹{room.creatorShare.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-violet-400/60 text-xs">Platform</p>
                      <p className="text-violet-400">₹{room.platformShare.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/50">No room revenue yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Boost pricing */}
        {cfg && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Boost Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-white/50">Boost</p>
                <p className="text-lg font-bold">₹{cfg.boostPrice}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-white/50">Priority</p>
                <p className="text-lg font-bold">₹{cfg.priorityBoostPrice}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-white/50">Play Next</p>
                <p className="text-lg font-bold">₹{cfg.playNextPrice}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-white/50">Super Priority</p>
                <p className="text-lg font-bold">₹{cfg.superPriorityPrice}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposals */}
        <h2 className="mb-4 text-xl font-semibold">Community Proposals</h2>

        {session && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Create Proposal</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createProposal} className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <Button type="submit" variant="glow">Submit Proposal</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.title}</CardTitle>
                  <Badge>{p.status}</Badge>
                </div>
                <p className="text-sm text-white/50">
                  by {p.proposer?.name} · ends {new Date(p.endsAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-white/70">{p.description}</p>
                <div className="mb-4 flex gap-4 text-sm">
                  <span className="text-emerald-400">For: {p.votesFor}</span>
                  <span className="text-red-400">Against: {p.votesAgainst}</span>
                </div>
                {session && p.status === "ACTIVE" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="glow" onClick={() => vote(p.id, true)}>Vote For</Button>
                    <Button size="sm" variant="outline" onClick={() => vote(p.id, false)}>Vote Against</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {proposals.length === 0 && <p className="text-white/50">No proposals yet.</p>}
        </div>
      </main>
    </div>
  );
}
