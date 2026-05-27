"use client";

import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudioSessionMode = "free" | "commercial";

type ModeOption = {
  id: StudioSessionMode;
  icon: LucideIcon;
  title: string;
  description: string;
  objective: string;
};

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "free",
    icon: Waves,
    title: "Free Surf",
    description: "Standard session on Discover with no paid unlocks.",
    objective:
      "Share waves on Discover for free claims. Surfers claim and watch your videos without paying to unlock.",
  },
  {
    id: "commercial",
    icon: BadgeDollarSign,
    title: "Commercial",
    description: "Commercial session selling Discover waves in your currency.",
    objective:
      "Waves show snapshot carousels until unlocked. Set the price (in your settlement currency) for buy & claim, or sponsor unlock for claimants.",
  },
];

export function StudioSessionModeChoice({
  value,
  onChange,
}: {
  value: StudioSessionMode | null;
  onChange: (mode: StudioSessionMode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:items-stretch">
      {MODE_OPTIONS.map((option) => {
        const selected = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={cn(
              "flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
              "hover:border-primary/40 hover:bg-white/[0.04]",
              selected
                ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                : "border-border bg-white/[0.02]",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground",
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-sm font-semibold text-foreground">
                  {option.title}
                </span>
                <span className="block min-h-10 text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </div>
            <p className="min-h-[3.75rem] flex-1 text-xs leading-relaxed text-muted-foreground">
              {option.objective}
            </p>
          </button>
        );
      })}
    </div>
  );
}
