"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/room/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 pt-24 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Join a Room</CardTitle>
            <CardDescription>Enter the room code shared by the host.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                placeholder="Room code (e.g. ABC123)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
              <Button type="submit" variant="glow" className="w-full">Join Room</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
