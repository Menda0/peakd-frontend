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
    description: "A standard session with no Peaks charges.",
    objective:
      "Share waves on Discover for free claims. Surfers can claim and watch your videos without paying you.",
  },
  {
    id: "commercial",
    icon: BadgeDollarSign,
    title: "Commercial",
    description: "Commercially sold assets and wave videos on Discover.",
    objective:
      "Waves show snapshot carousels until unlocked. Set Peaks pricing so surfers buy & claim waves or sponsors unlock video for someone who already claimed.",
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
    <div className="grid gap-3 sm:grid-cols-2">
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
              "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
              "hover:border-primary/40 hover:bg-white/[0.04]",
              selected
                ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                : "border-white/10 bg-white/[0.02]",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-primary/20 text-primary" : "bg-white/5 text-zinc-400",
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 space-y-1">
                <span className="block text-sm font-semibold text-zinc-50">
                  {option.title}
                </span>
                <span className="block text-xs leading-relaxed text-zinc-500">
                  {option.description}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">{option.objective}</p>
          </button>
        );
      })}
    </div>
  );
}
