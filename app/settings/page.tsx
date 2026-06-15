"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Settings</h1>
        <Card className="mb-4">
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-white/50">Email notifications for room activity (coming soon)</p></CardContent>
        </Card>
        <Card className="mb-4">
          <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-white/50">Control profile visibility and data sharing</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Connected Accounts</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-white/50">Google OAuth · MetaMask wallet</p></CardContent>
        </Card>
      </main>
    </div>
  );
}
