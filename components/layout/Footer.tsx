import Link from "next/link";
import { Music2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 py-12 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2 font-bold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Music2 className="h-4 w-4" />
            </div>
            {APP_NAME}
          </div>
          <p className="text-sm text-white/50">Democratic media queues for communities.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Product</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <Link href="/features" className="hover:text-white">Features</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/room/create" className="hover:text-white">Create Room</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Account</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/wallet" className="hover:text-white">Wallet</Link>
            <Link href="/settings" className="hover:text-white">Settings</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Legal</h4>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
