"use client";

import { signIn } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-md px-4 pt-24 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to CrowdPlay</CardTitle>
            <CardDescription>Create rooms, earn badges, and boost songs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="glow" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              Continue with Google
            </Button>
            <p className="text-center text-xs text-white/40">
              Guests can join rooms without signing in.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
