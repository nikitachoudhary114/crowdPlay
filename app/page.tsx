"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Music, Users, Zap, Vote, Crown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Vote, title: "Democratic Voting", desc: "Upvote and downvote to shape the queue in real time." },
  { icon: Zap, title: "Premium Boosts", desc: "Skip the line with fiat or CROWD token boosts." },
  { icon: Users, title: "Live Rooms", desc: "Join via link, code, or QR — perfect for any gathering." },
  { icon: Crown, title: "Creator Economy", desc: "Room owners earn 70% from boosts and tips." },
];

export default function HomePage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="pt-16">
        <section className="mx-auto max-w-7xl px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-600/10 px-4 py-1.5 text-sm text-violet-300">
              <Music className="h-4 w-4" />
              Real-time collaborative queues
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
              Let the crowd{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                decide what plays
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
              CrowdPlay transforms passive audiences into active participants. Search, queue, vote, and boost — together.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/room/create">
                <Button variant="glow" size="lg" className="gap-2">
                  Create a Room <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/room/join">
                <Button variant="secondary" size="lg">Join a Room</Button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
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
      </main>
      <Footer />
    </div>
  );
}
