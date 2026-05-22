"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SurferProfile } from "@/lib/surfer-profile";
import type { SurfLevel } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_SURFERS = 8;

function collectUniqueSurfers(surfers: SurferProfile[]): SurferProfile[] {
  const byId = new Map<string, SurferProfile>();
  for (const surfer of surfers) {
    if (!surfer.userId) continue;
    if (!byId.has(surfer.userId)) {
      byId.set(surfer.userId, surfer);
    }
  }
  return Array.from(byId.values());
}

function surferLabel(surfer: SurferProfile): string {
  return surfer.displayName?.trim() || "Surfer";
}

function surferLocationLine(surfer: SurferProfile): string | null {
  const region = surfer.regionName?.trim() || null;
  const countryCode = surfer.countryCode?.trim().toUpperCase() || null;
  const parts = [region, countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function surfLevelLabel(level: SurfLevel | null): string | null {
  if (!level) return null;
  const labels: Record<SurfLevel, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return labels[level];
}

function SurferAvatar({
  surfer,
  className,
}: {
  surfer: SurferProfile;
  className?: string;
}) {
  const name = surferLabel(surfer);
  return surfer.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={surfer.avatarUrl}
      alt=""
      className={cn(
        "size-9 shrink-0 rounded-full object-cover ring-2 ring-[#050a0f]",
        className,
      )}
    />
  ) : (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200 ring-2 ring-[#050a0f]",
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SurferTooltipDetails({ surfer }: { surfer: SurferProfile }) {
  const name = surferLabel(surfer);
  const location = surferLocationLine(surfer);
  const level = surfLevelLabel(surfer.surfLevel);

  return (
    <div className="flex min-w-[10rem] max-w-[14rem] items-start gap-2.5 text-left">
      {surfer.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={surfer.avatarUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/20"
        />
      ) : (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-200 ring-1 ring-white/20"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold leading-tight text-zinc-50">
          {name}
        </p>
        {location ? (
          <p className="text-xs leading-snug text-zinc-400">{location}</p>
        ) : (
          <p className="text-xs text-zinc-600">Location not set</p>
        )}
        {level ? (
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-600">Level · </span>
            {level}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SurferWithTooltip({
  surfer,
  children,
  side = "bottom",
}: {
  surfer: SurferProfile;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="border-white/10 bg-[#0a1218] p-2.5">
        <SurferTooltipDetails surfer={surfer} />
      </TooltipContent>
    </Tooltip>
  );
}

function SurferOverflowTooltipList({ surfers }: { surfers: SurferProfile[] }) {
  return (
    <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
      {surfers.map((surfer) => (
        <li
          key={surfer.userId}
          className="border-b border-white/5 pb-3 last:border-0 last:pb-0"
        >
          <SurferTooltipDetails surfer={surfer} />
        </li>
      ))}
    </ul>
  );
}

export function SharedSessionSurferList({
  surfers,
  className,
}: {
  surfers: SurferProfile[];
  className?: string;
}) {
  const unique = collectUniqueSurfers(surfers);
  if (unique.length === 0) return null;

  const visible = unique.slice(0, MAX_VISIBLE_SURFERS);
  const overflow = unique.slice(MAX_VISIBLE_SURFERS);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("space-y-2", className)}>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Surfers in this session
        </p>
        <div className="flex items-center">
          <div className="flex items-center -space-x-2">
            {visible.map((surfer) => (
              <SurferWithTooltip key={surfer.userId} surfer={surfer}>
                <button
                  type="button"
                  className="relative cursor-default rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050a0f]"
                  aria-label={surferLabel(surfer)}
                >
                  <SurferAvatar surfer={surfer} />
                </button>
              </SurferWithTooltip>
            ))}
          </div>
          {overflow.length > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative z-10 -ml-2 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-800 text-xs font-semibold text-zinc-200 ring-2 ring-[#050a0f] outline-none hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label={`${overflow.length} more surfers`}
                >
                  +{overflow.length}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="w-72 border-white/10 bg-[#0a1218] p-2.5">
                <p className="mb-2 text-xs font-medium text-zinc-400">
                  All surfers ({unique.length})
                </p>
                <SurferOverflowTooltipList surfers={unique} />
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
