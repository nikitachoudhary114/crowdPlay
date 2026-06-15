import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BOOST_PRICES, CROWD_PRICES } from "@/lib/constants";
import { Check } from "lucide-react";
import Link from "next/link";

const fiatPlans = [
  { name: "Boost Song", price: BOOST_PRICES.BOOST, desc: "Move your song higher in the queue" },
  { name: "Priority Boost", price: BOOST_PRICES.PRIORITY_BOOST, desc: "Significant queue priority" },
  { name: "Play Next", price: BOOST_PRICES.PLAY_NEXT, desc: "Play after the current song" },
  { name: "Super Priority", price: BOOST_PRICES.SUPER_PRIORITY, desc: "Jump to the front instantly" },
];

const crowdPlans = [
  { name: "Vote Boost", price: CROWD_PRICES.VOTE_BOOST, desc: "5 CROWD tokens" },
  { name: "Queue Jump", price: CROWD_PRICES.QUEUE_JUMP, desc: "20 CROWD tokens" },
  { name: "Play Next", price: CROWD_PRICES.PLAY_NEXT, desc: "50 CROWD tokens" },
];

export default function PricingPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <h1 className="mb-4 text-4xl font-bold">Pricing</h1>
        <p className="mb-12 text-white/60">Boost songs with fiat (Razorpay) or CROWD tokens on Polygon.</p>

        <h2 className="mb-6 text-2xl font-semibold">Fiat Boosts (INR)</h2>
        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {fiatPlans.map((plan) => (
            <Card key={plan.name} className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-400">₹{plan.price}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mb-6 text-2xl font-semibold">CROWD Token Actions</h2>
        <div className="mb-16 grid gap-6 md:grid-cols-3">
          {crowdPlans.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-fuchsia-400">{plan.price} CROWD</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle>Creator Revenue Split</CardTitle>
            <CardDescription>Room owners earn from every boost and tip</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400"><Check className="h-4 w-4" /> 70% to Creator</div>
            <div className="flex items-center gap-2 text-white/60"><Check className="h-4 w-4" /> 30% to Platform</div>
            <Link href="/room/create">
              <Button variant="glow" className="mt-4">Start Earning</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
