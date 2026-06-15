"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function GovernancePage() {
  const { data: session } = useSession();
  const [proposals, setProposals] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    votesFor: number;
    votesAgainst: number;
    endsAt: string;
    proposer: { name: string | null };
  }>>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/governance/proposals").then((r) => r.json()).then((d) => setProposals(d.proposals ?? []));
  }, []);

  async function createProposal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/governance/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (res.ok) {
      setTitle("");
      setDescription("");
      const data = await fetch("/api/governance/proposals").then((r) => r.json());
      setProposals(data.proposals ?? []);
    }
  }

  async function vote(proposalId: string, support: boolean) {
    await fetch("/api/governance/proposals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId, support }),
    });
    const data = await fetch("/api/governance/proposals").then((r) => r.json());
    setProposals(data.proposals ?? []);
  }

  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-16">
        <h1 className="mb-4 text-3xl font-bold">DAO Governance</h1>
        <p className="mb-8 text-white/60">CROWD token holders vote on platform parameters.</p>

        {session && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Create Proposal</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createProposal} className="space-y-3">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <Button type="submit" variant="glow">Submit Proposal</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.title}</CardTitle>
                  <Badge>{p.status}</Badge>
                </div>
                <p className="text-sm text-white/50">by {p.proposer?.name} · ends {new Date(p.endsAt).toLocaleDateString()}</p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-white/70">{p.description}</p>
                <div className="mb-4 flex gap-4 text-sm">
                  <span className="text-emerald-400">For: {p.votesFor}</span>
                  <span className="text-red-400">Against: {p.votesAgainst}</span>
                </div>
                {session && p.status === "ACTIVE" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="glow" onClick={() => vote(p.id, true)}>Vote For</Button>
                    <Button size="sm" variant="outline" onClick={() => vote(p.id, false)}>Vote Against</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {proposals.length === 0 && <p className="text-white/50">No proposals yet.</p>}
        </div>
      </main>
    </div>
  );
}
