"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<{
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
      crowdBalance: number;
      badges: Array<{ type: string }>;
      ownedRooms: Array<{ name: string; code: string }>;
    };
    leaderboard: Array<{ user: { name: string | null }; votes: number }>;
  } | null>(null);

  useEffect(() => {
    if (session) fetch("/api/profile").then((r) => r.json()).then(setProfile);
  }, [session]);

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <div className="mb-8 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.user?.image ?? session?.user?.image ?? undefined} />
            <AvatarFallback>{(profile?.user?.name ?? "U")[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile?.user?.name ?? session?.user?.name}</h1>
            <p className="text-white/50">{profile?.user?.email}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">CROWD Balance</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-fuchsia-400">{profile?.user?.crowdBalance ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Rooms Created</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{profile?.user?.ownedRooms?.length ?? 0}</p></CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Badges</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile?.user?.badges?.map((b) => (
              <Badge key={b.type} variant="success">{b.type.replace("_", " ")}</Badge>
            )) ?? <p className="text-white/50">No badges yet — start voting and contributing!</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile?.leaderboard?.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>#{i + 1} {entry.user?.name ?? "Anonymous"}</span>
                <Badge>{entry.votes} votes</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
