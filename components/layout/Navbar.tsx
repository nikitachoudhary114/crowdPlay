"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Music2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/room/join", label: "Join Room" },
  { href: "/governance", label: "Governance" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <Music2 className="h-5 w-5" />
          </div>
          <span className="text-lg">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-white",
                pathname === link.href ? "text-white" : "text-white/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary" size="sm">Profile</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => signIn("google")}>Sign in</Button>
              <Link href="/room/create">
                <Button variant="glow" size="sm">Create Room</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-black/90 p-4 md:hidden">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block py-2 text-white/80" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            {session?.user ? (
              <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
            ) : (
              <Button variant="glow" onClick={() => signIn("google")}>Sign in with Google</Button>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
}
