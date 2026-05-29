"use client";

import type { MouseEvent } from "react";
import { Download, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PublicSharedSessionWave } from "@/lib/shared-session";
import { downloadFromUrl } from "@/lib/shared-session";
import { cn } from "@/lib/utils";

function downloadFilename(base: string, suffix: string): string {
  const stem = base.replace(/\.[^.]+$/, "") || "video";
  return `${stem}${suffix}`;
}

function waveHasDownloads(wave: PublicSharedSessionWave): boolean {
  return Boolean(
    wave.processedDownloadUrl ||
      (wave.hasOriginal && wave.originalDownloadUrl) ||
      wave.socialVariants.some((variant) => variant.downloadUrl),
  );
}

function stopBubble(event: MouseEvent) {
  event.stopPropagation();
}

export function SharedSessionWaveDownloadMenu({
  wave,
  className,
}: {
  wave: PublicSharedSessionWave;
  className?: string;
}) {
  if (!waveHasDownloads(wave)) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        type="button"
        onClick={stopBubble}
        onPointerDown={stopBubble}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground outline-none transition hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60",
          className,
        )}
        aria-label={`Download ${wave.originalFilename}`}
      >
        <MoreVertical className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-50 w-52 border-border bg-popover p-1 text-popover-foreground"
        onClick={stopBubble}
      >
        {wave.processedDownloadUrl ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-foreground focus:bg-accent focus:text-foreground"
            onClick={() =>
              downloadFromUrl(
                wave.processedDownloadUrl!,
                downloadFilename(wave.originalFilename, ".webm"),
              )
            }
          >
            <Download className="size-4 opacity-80" aria-hidden />
            Download processed
          </DropdownMenuItem>
        ) : null}
        {wave.socialVariants
          .filter((variant) => variant.downloadUrl)
          .map((variant) => (
            <DropdownMenuItem
              key={variant.kind}
              className="cursor-pointer gap-2 text-foreground focus:bg-accent focus:text-foreground"
              onClick={() =>
                downloadFromUrl(
                  variant.downloadUrl!,
                  downloadFilename(
                    wave.originalFilename,
                    `-${variant.kind}.mp4`,
                  ),
                )
              }
            >
              <Download className="size-4 opacity-80" aria-hidden />
              Download {variant.label}
            </DropdownMenuItem>
          ))}
        {wave.hasOriginal && wave.originalDownloadUrl ? (
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-foreground focus:bg-accent focus:text-foreground"
            onClick={() =>
              downloadFromUrl(
                wave.originalDownloadUrl!,
                wave.originalFilename,
              )
            }
          >
            <Download className="size-4 opacity-80" aria-hidden />
            Download original
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
