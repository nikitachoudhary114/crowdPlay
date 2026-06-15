"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/use-socket";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/utils";
import { BOOST_PRICES } from "@/lib/constants";
import { openRazorpayCheckout, type BoostType } from "@/lib/razorpay-checkout";
import { BoostDialog } from "@/components/room/BoostDialog";
import {
  ThumbsUp, ThumbsDown, Search, Send, SkipForward, Trash2, Users, Zap, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { YouTubeSearchResult } from "@/lib/youtube";

export function RoomView({ roomCode }: { roomCode: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [guestName] = useState("Guest");
  const [boostTarget, setBoostTarget] = useState<{ id: string; title: string } | null>(null);
  const [boostLoading, setBoostLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      fetch("/api/guest", { method: "POST" })
        .then((r) => r.json())
        .then((d) => setGuestId(d.guestId));
    }
  }, [session]);

  const userId = session?.user?.id;
  const {
    state, messages, activeUsers, connected, error,
    addToQueue, vote, sendMessage, trackEnded, adminSkip, adminRemove, refreshState, applyRoomState,
  } = useSocket(roomCode, userId, guestId ?? undefined);

  const isAdmin = state?.room.ownerId === userId;

  const onEnded = useCallback(() => trackEnded(), [trackEnded]);
  const { containerRef } = useYouTubePlayer({
    videoId: state?.nowPlaying?.youtubeId ?? null,
    onEnded,
  });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search/youtube?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddToQueue(item: YouTubeSearchResult) {
    const result = await addToQueue({
      youtubeId: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      channel: item.channel,
      duration: item.duration,
    });
    if (!result.success) toast({ title: "Couldn't add song", description: result.error, variant: "error" });
    else toast({ title: "Added to queue", variant: "success" });
  }

  async function handleBoost(queueItemId: string, boostType: BoostType) {
    setBoostLoading(true);
    try {
      const res = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, queueItemId, boostType }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Payment failed", description: data.error ?? "Could not start payment", variant: "error" });
        return;
      }

      if (data.demo) {
        await refreshState();
        toast({ title: "Song boosted!", description: "Demo mode — boost applied", variant: "success" });
        setBoostTarget(null);
        return;
      }

      const boostLabel = {
        BOOST: "Boost Song",
        PRIORITY_BOOST: "Priority Boost",
        PLAY_NEXT: "Play Next",
        SUPER_PRIORITY: "Super Priority",
      }[boostType];

      await openRazorpayCheckout({
        keyId: data.keyId,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        description: boostLabel,
        userName: session?.user?.name,
        userEmail: session?.user?.email,
        onDismiss: () => setBoostLoading(false),
        onFailure: (msg) => toast({ title: "Payment failed", description: msg, variant: "error" }),
        onSuccess: async (response) => {
          const verifyRes = await fetch("/api/payments/razorpay", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: data.paymentId,
              roomCode,
              queueItemId,
              boostType,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            if (verifyData.state) applyRoomState(verifyData.state);
            else await refreshState();
            const boosted = verifyData.state?.queue?.find(
              (q: { id: string }) => q.id === queueItemId
            );
            const position =
              verifyData.state?.queue?.findIndex((q: { id: string }) => q.id === queueItemId) ?? -1;
            toast({
              title: "Payment successful!",
              description:
                position >= 0
                  ? `Song boosted to #${position + 1} in queue (boost level ${boosted?.boostLevel ?? "—"})`
                  : "Song boosted in queue",
              variant: "success",
            });
            setBoostTarget(null);
          } else {
            toast({
              title: "Verification failed",
              description: verifyData.error ?? "Payment could not be verified",
              variant: "error",
            });
          }
        },
      });
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "error" });
    } finally {
      setBoostLoading(false);
    }
  }

  if (!connected && !state) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-bg">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{state?.room.name ?? roomCode}</h1>
            <p className="text-sm text-white/50">Room: {roomCode}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />{activeUsers}</Badge>
            {state?.room.queueLocked && <Badge variant="warning">Queue Locked</Badge>}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => adminSkip()}>
                <SkipForward className="mr-1 h-4 w-4" /> Skip
              </Button>
            )}
          </div>
        </div>

        {error && <p className="mb-4 text-red-400">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  {state?.nowPlaying ? (
                    <div ref={containerRef} className="h-full w-full" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      No media playing — add songs to the queue!
                    </div>
                  )}
                </div>
                {state?.nowPlaying && (
                  <div className="p-4">
                    <h3 className="font-semibold">{state.nowPlaying.title}</h3>
                    <p className="text-sm text-white/50">{state.nowPlaying.channel}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" /> Search YouTube
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                  <Input
                    placeholder="Search for songs or videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </form>
                <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                      <img src={item.thumbnail} alt="" className="h-12 w-20 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-white/50">{item.channel} · {formatDuration(item.duration)}</p>
                      </div>
                      <Button size="sm" onClick={() => handleAddToQueue(item)}>Add</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="queue">
              <TabsList className="w-full">
                <TabsTrigger value="queue" className="flex-1">Queue</TabsTrigger>
                <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1">Board</TabsTrigger>
              </TabsList>

              <TabsContent value="queue">
                <Card>
                  <CardContent className="max-h-[500px] space-y-2 overflow-y-auto p-4 scrollbar-thin">
                    {state?.queue.length === 0 && (
                      <p className="py-8 text-center text-white/40">Queue is empty</p>
                    )}
                    {state?.queue.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-bold text-violet-300">
                          {i + 1}
                        </span>
                        <img src={item.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs font-medium">{item.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-violet-400">{item.voteScore} votes</span>
                            {item.boostLevel > 0 && (
                              <Badge variant="warning" className="text-[10px]">
                                <Zap className="mr-0.5 h-2 w-2" />Boost {item.boostLevel}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={async () => {
                              const r = await vote(item.id, "UP");
                              if (r.success) await refreshState();
                              else if (r.error) toast({ title: "Vote failed", description: r.error, variant: "error" });
                            }}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={async () => {
                              const r = await vote(item.id, "DOWN");
                              if (r.success) await refreshState();
                              else if (r.error) toast({ title: "Vote failed", description: r.error, variant: "error" });
                            }}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          {session && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setBoostTarget({ id: item.id, title: item.title })}
                            >
                              <Zap className="h-3 w-3 text-amber-400" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adminRemove(item.id)}>
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card>
                  <CardContent className="flex h-[400px] flex-col p-4">
                    <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={msg.user?.image ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(msg.user?.name ?? msg.guestName ?? "G")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-xs font-medium text-violet-300">
                              {msg.user?.name ?? msg.guestName ?? "Guest"}
                            </span>
                            <p className="text-sm text-white/80">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className="mt-2 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (chatInput.trim()) {
                          sendMessage(chatInput, guestName);
                          setChatInput("");
                        }
                      }}
                    >
                      <Input
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <Button size="icon" type="submit"><Send className="h-4 w-4" /></Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-white/50">Vote for songs to climb the leaderboard!</p>
                    <div className="mt-4 space-y-2">
                      {state?.queue.slice(0, 5).map((item, i) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                          <span className="text-sm">#{i + 1} {item.title.slice(0, 30)}...</span>
                          <Badge>{item.voteScore} votes</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {session && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Boost Prices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-white/60">
                  <p>Boost: ₹{BOOST_PRICES.BOOST}</p>
                  <p>Priority: ₹{BOOST_PRICES.PRIORITY_BOOST}</p>
                  <p>Play Next: ₹{BOOST_PRICES.PLAY_NEXT}</p>
                  <p>Super: ₹{BOOST_PRICES.SUPER_PRIORITY}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {boostTarget && (
        <BoostDialog
          songTitle={boostTarget.title}
          loading={boostLoading}
          onClose={() => !boostLoading && setBoostTarget(null)}
          onSelect={(boostType) => handleBoost(boostTarget.id, boostType)}
        />
      )}
    </div>
  );
}
