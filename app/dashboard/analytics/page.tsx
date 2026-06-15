"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsDashboardPage() {
  const [platform, setPlatform] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("/api/analytics/platform")
      .then((r) => r.json())
      .then(setPlatform)
      .catch(() => {});
  }, []);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Daily Active Users", value: platform?.dau ?? 0 },
            { label: "Monthly Active Users", value: platform?.mau ?? 0 },
            { label: "Total Users", value: platform?.totalUsers ?? 0 },
            { label: "Active Rooms", value: platform?.activeRooms ?? 0 },
            { label: "Revenue", value: `₹${platform?.revenue ?? 0}` },
            { label: "Token Transactions", value: platform?.tokenTransactions ?? 0 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader><CardTitle className="text-sm text-white/60">{stat.label}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{stat.value}</p></CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
