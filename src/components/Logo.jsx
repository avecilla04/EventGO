import React from "react";
import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="EventGo, inicio">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
        <Ticket className="h-[18px] w-[18px] -rotate-12 text-accent" strokeWidth={2.4} />
      </span>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        EventGo
      </span>
    </Link>
  );
}
