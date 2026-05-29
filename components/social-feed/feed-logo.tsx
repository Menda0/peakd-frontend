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
      <span className="inline-flex sm:hidden">
        <PeakIcon size={36} className="size-9" priority />
      </span>
      <span className="hidden sm:inline-flex">
        <PeakdLogo className="h-14" priority />
      </span>
    </Link>
  );
}
