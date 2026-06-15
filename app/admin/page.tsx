"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string | null; role: string }>>([]);
  const [rooms, setRooms] = useState<Array<{ code: string; name: string; owner: { name: string | null } }>>([]);
  const [platform, setPlatform] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => {});
    fetch("/api/admin/rooms").then((r) => r.json()).then((d) => setRooms(d.rooms ?? [])).catch(() => {});
    fetch("/api/analytics/platform").then((r) => r.json()).then(setPlatform).catch(() => {});
  }, []);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Admin Panel</h1>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-sm text-white/50">DAU</p><p className="text-2xl font-bold">{platform?.dau ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-white/50">Users</p><p className="text-2xl font-bold">{platform?.totalUsers ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-white/50">Rooms</p><p className="text-2xl font-bold">{platform?.activeRooms ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-white/50">Revenue</p><p className="text-2xl font-bold">₹{platform?.revenue ?? 0}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <div className="space-y-2">
              {users.map((u) => (
                <Card key={u.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{u.name ?? "—"}</p>
                      <p className="text-sm text-white/50">{u.email}</p>
                    </div>
                    <Badge>{u.role}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="rooms">
            <div className="space-y-2">
              {rooms.map((r) => (
                <Card key={r.code}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-white/50">{r.code} · {r.owner?.name}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="governance">
            <Card>
              <CardHeader><CardTitle>Token Economy Settings</CardTitle></CardHeader>
              <CardContent className="text-sm text-white/60">
                <p>Manage cooldown duration, queue size, boost prices, and voting rules via DAO proposals.</p>
                <a href="/governance" className="mt-4 inline-block text-violet-400 hover:underline">View Governance →</a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
