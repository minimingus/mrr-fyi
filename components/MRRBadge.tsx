"use client";

import { formatMRR } from "@/lib/utils";

interface MRRBadgeProps {
  mrr: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}

export function MRRBadge({ mrr, currency = "USD", size = "md" }: MRRBadgeProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <span
      className={`mono font-semibold text-[var(--amber)] tabular-nums ${sizeClasses[size]}`}
    >
      {formatMRR(mrr, currency)}
      <span className="text-[var(--text-dim)] text-xs ml-1 font-normal">/mo</span>
    </span>
  );
}
