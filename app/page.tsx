"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Music, Users, Zap, Vote, Crown, Wallet, Radio } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Vote, title: "Democratic Voting", desc: "Upvote and downvote to shape the queue in real time." },
  { icon: Zap, title: "Premium Boosts", desc: "Razorpay INR or CROWD tokens — 4 boost tiers." },
  { icon: Users, title: "Live Rooms", desc: "Synced YouTube playback for everyone in the room." },
  { icon: Crown, title: "Creator Economy", desc: "Earn 70% from every boost in your rooms." },
  { icon: Wallet, title: "Fiat + Crypto", desc: "Razorpay for India, MetaMask CROWD on Polygon." },
  { icon: Radio, title: "Instant Play", desc: "First song in an empty queue starts automatically." },
];

const steps = [
  { n: "1", title: "Create a room", desc: "Get a 6-letter code in seconds." },
  { n: "2", title: "Share the code", desc: "Friends join from any device." },
  { n: "3", title: "Queue & vote", desc: "Search YouTube, add songs, shape the playlist." },
  { n: "4", title: "Boost to skip", desc: "Pay to move up or play next instantly." },
];

export default function HomePage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="pt-16">
        <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-28 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-600/10 px-4 py-1.5 text-sm text-violet-300">
              <Music className="h-4 w-4" />
              Parties · Cafés · Events · Live streams
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
              Let the crowd{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                decide what plays
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
              CrowdPlay is a real-time collaborative music queue. Search YouTube, vote, chat, boost songs with Razorpay or CROWD tokens, and sync playback for the whole room.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/room/create">
                <Button variant="glow" size="lg" className="gap-2 px-8">
                  Create a Room <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/room/join">
                <Button variant="secondary" size="lg" className="px-8">Join with Code</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-semibold">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <Card key={s.n} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/30 text-lg font-bold text-violet-300">
                    {s.n}
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full transition-colors hover:border-violet-500/30">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
                      <f.icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Card className="border-fuchsia-500/20 bg-fuchsia-500/5">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to host?</CardTitle>
              <CardDescription className="text-base">
                Create a room, share the code, and start earning from boosts.
              </CardDescription>
              <Link href="/room/create" className="mt-4 inline-block">
                <Button variant="glow" size="lg">Get started free</Button>
              </Link>
            </CardHeader>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
