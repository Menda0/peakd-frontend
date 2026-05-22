import { BadgeCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Admin-verified region or spot indicator (matches feed verified badge styling). */
export function GeoVerifiedIcon({ className }: { className?: string }) {
  return (
    <BadgeCheckIcon
      className={cn("size-4 shrink-0 text-sky-400", className)}
      aria-label="Verified"
    />
  );
}
