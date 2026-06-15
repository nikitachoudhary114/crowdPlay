"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CreatorDashboardPage() {
  const [data, setData] = useState<{
    totalEarnings: number;
    boostCount: number;
    topSupporters: Array<{ user: { name: string | null }; amount: number | null }>;
    rooms: Array<{ name: string; code: string; analytics: { totalRevenue: number } | null }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics/creator").then((r) => r.json()).then(setData);
  }, []);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Creator Dashboard</h1>
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm text-white/60">Total Earnings (70%)</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-emerald-400">₹{data?.totalEarnings?.toFixed(0) ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-white/60">Boost Purchases</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.boostCount ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-white/60">Active Rooms</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.rooms?.length ?? 0}</p></CardContent>
          </Card>
        </div>

        <h2 className="mb-4 text-xl font-semibold">Top Supporters</h2>
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

        <h2 className="mb-4 text-xl font-semibold">Room Revenue</h2>
        <div className="space-y-2">
          {data?.rooms?.map((room) => (
            <Card key={room.code}>
              <CardContent className="flex items-center justify-between p-4">
                <span>{room.name} ({room.code})</span>
                <Badge>₹{room.analytics?.totalRevenue ?? 0}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
