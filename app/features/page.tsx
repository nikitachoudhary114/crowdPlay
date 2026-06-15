import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Vote, MessageSquare, BarChart3, Wallet, Shield, Music, Clock, Users, Gem, Landmark,
} from "lucide-react";

const features = [
  { icon: Music, title: "YouTube Integration", desc: "Search and queue YouTube videos with synced playback across all devices." },
  { icon: Vote, title: "Voting System", desc: "Upvote/downvote with anti-abuse: one vote per user, cooldowns, bot protection." },
  { icon: Clock, title: "Cooldown System", desc: "Recently played songs enter cooldown — configurable by room admins." },
  { icon: MessageSquare, title: "Room Chat", desc: "Real-time chat with emoji, mentions, moderation, and mute controls." },
  { icon: Wallet, title: "Fiat & Crypto Payments", desc: "Razorpay for INR boosts, CROWD token on Polygon for Web3 actions." },
  { icon: BarChart3, title: "Analytics", desc: "Room, creator, and platform dashboards with revenue tracking." },
  { icon: Users, title: "Role System", desc: "Guest, registered user, room admin, and platform admin permissions." },
  { icon: Gem, title: "NFT Memberships", desc: "ERC-721 NFTs grant double voting power and exclusive access." },
  { icon: Landmark, title: "DAO Governance", desc: "Token holders vote on cooldowns, queue size, boost prices, and rules." },
  { icon: Shield, title: "Moderation", desc: "Skip, remove, ban users, lock queue, and configure voting rules." },
];

export default function FeaturesPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-4 text-4xl font-bold">Features</h1>
        <p className="mb-12 max-w-2xl text-white/60">
          Everything you need to run democratic media queues at scale.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="mb-2 h-8 w-8 text-violet-400" />
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
