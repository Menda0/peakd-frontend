"use client";

import { Building2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PARTNER_UPLOAD_TOOLTIP =
  "Uploaded by a surf partner. Claim this wave to add it to your videos.";

export function PartnerUploadIndicator() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
            aria-label={PARTNER_UPLOAD_TOOLTIP}
          >
            <Building2 className="size-3" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          <p className="text-xs">{PARTNER_UPLOAD_TOOLTIP}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
