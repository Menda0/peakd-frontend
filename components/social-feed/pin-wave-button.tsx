"use client";

import { PinIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { pinWave, unpinWave } from "@/lib/pinned-waves";
import { cn } from "@/lib/utils";

export function PinWaveButton({
  jobId,
  pinned,
  onPinnedChange,
}: {
  jobId: string;
  pinned: boolean;
  onPinnedChange: (jobIds: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const jobIds = pinned ? await unpinWave(jobId) : await pinWave(jobId);
      onPinnedChange(jobIds);
      toast.success(pinned ? "Unpinned from profile" : "Pinned to profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update pin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={pinned ? "Unpin from profile" : "Pin to profile"}
      aria-pressed={pinned}
      disabled={busy}
      onClick={() => void toggle()}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition hover:bg-accent hover:text-foreground",
        pinned && "border-primary/40 bg-primary/10 text-primary",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <PinIcon
        className={cn("size-4", pinned && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
