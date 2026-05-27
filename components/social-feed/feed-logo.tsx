import Link from "next/link";
import { PeakdLogo } from "@/components/peakd-logo";
import { PeakIcon } from "@/components/peaks/peak-icon";

export function FeedLogo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center"
      aria-label="Peakd home"
    >
      <PeakIcon size={36} className="size-9 sm:hidden" priority />
      <span className="hidden sm:block">
        <PeakdLogo className="h-14" priority />
      </span>
    </Link>
  );
}
