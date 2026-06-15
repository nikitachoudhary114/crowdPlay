"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, BarChart3, Wallet, Settings } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Array<{ id: string; code: string; name: string }>>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/rooms").then((r) => r.json()).then((d) => setRooms(d.rooms ?? []));
    }
  }, [session]);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: Music, label: "My Rooms", href: "#rooms" },
            { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
            { icon: Wallet, label: "Wallet", href: "/wallet" },
            { icon: Settings, label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card className="cursor-pointer transition-colors hover:border-violet-500/30">
                <CardContent className="flex items-center gap-3 p-6">
                  <item.icon className="h-6 w-6 text-violet-400" />
                  <span className="font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section id="rooms">
          <h2 className="mb-4 text-xl font-semibold">Your Rooms</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle>{room.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-white/50">Code: {room.code}</p>
                  <Link href={`/room/${room.code}`}>
                    <Button variant="glow" size="sm">Open Room</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {rooms.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center text-white/50">
                  No rooms yet.{" "}
                  <Link href="/room/create" className="text-violet-400 hover:underline">Create one</Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <div className="mt-8">
          <Link href="/dashboard/creator">
            <Button variant="secondary">Creator Dashboard →</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
