"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  current: number;
  total: number;
  exitHref?: string;
};

export function ProgressCard({ current, total, exitHref = "/" }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div
      className="bg-[#0F3A5C]/85 backdrop-blur-sm text-white rounded-2xl p-3 sm:p-4 w-48 sm:w-60"
      style={{ boxShadow: "0 4px 24px rgba(78,175,90,0.25), 0 1px 6px rgba(0,0,0,0.3)" }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-sm">
          Question {String(current).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        <span className="font-bold text-sm">{pct}%</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "#4CAF5A" }}
        />
      </div>
      <Link
        href={exitHref}
        className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft size={13} />
        Quitter le module
      </Link>
    </div>
  );
}
