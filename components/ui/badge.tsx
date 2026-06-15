import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-violet-600/20 text-violet-300 border border-violet-500/30",
        variant === "secondary" && "bg-white/10 text-white/70 border border-white/10",
        variant === "success" && "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30",
        variant === "warning" && "bg-amber-600/20 text-amber-300 border border-amber-500/30",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
