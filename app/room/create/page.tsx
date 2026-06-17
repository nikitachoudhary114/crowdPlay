"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    router.prefetch("/room/join");
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace(`/room/${data.room.code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 pt-24 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Create a Room</CardTitle>
            <CardDescription>
              {session ? "Set up your collaborative media queue." : "Sign in to create a room."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <Input placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" variant="glow" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </form>
            ) : (
              <Button variant="glow" className="w-full" onClick={() => router.push("/auth/signin")}>
                Sign in to Create
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
