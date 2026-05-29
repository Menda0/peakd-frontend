"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadFromUrl } from "@/lib/shared-session";
import type { SocialVideoVariant } from "@/lib/social-video-variant";

function downloadFilename(base: string, kind: string): string {
  const stem = base.replace(/\.[^.]+$/, "") || "video";
  return `${stem}-${kind}.mp4`;
}

export function SocialVideoPreview({
  variants,
  originalFilename,
  className,
}: {
  variants: SocialVideoVariant[];
  originalFilename: string;
  className?: string;
}) {
  const available = variants.filter((v) => v.videoUrl);
  const [activeKind, setActiveKind] = useState(
    () => available[0]?.kind ?? variants[0]?.kind ?? "reel",
  );

  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Social edits are not available for this wave yet.
      </p>
    );
  }

  const active =
    available.find((v) => v.kind === activeKind) ?? available[0] ?? variants[0];

  const aspectClass =
    active.aspectRatio === "1:1"
      ? "aspect-square max-w-md mx-auto"
      : "aspect-[9/16] max-w-sm mx-auto";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <Button
            key={v.kind}
            type="button"
            size="sm"
            variant={v.kind === active.kind ? "default" : "outline"}
            className={cn(
              "border-border",
              v.kind !== active.kind && "bg-transparent text-foreground",
            )}
            disabled={!v.videoUrl}
            onClick={() => setActiveKind(v.kind)}
          >
            {v.label}
          </Button>
        ))}
      </div>

      {active.videoUrl ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-black",
            aspectClass,
          )}
        >
          <video
            key={active.videoUrl}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            src={active.videoUrl}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {active.label} preview is still processing.
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Includes branded outro: more at peakd.surf
      </p>

      {active.downloadUrl ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border text-foreground"
            onClick={() =>
              downloadFromUrl(
                active.downloadUrl!,
                downloadFilename(originalFilename, active.kind),
              )
            }
          >
            <Download className="size-3.5" aria-hidden />
            <span className="ml-1.5">Download {active.label}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
