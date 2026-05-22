import Link from "next/link";
import { PeakdLogo } from "@/components/peakd-logo";

export function FeedLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <PeakdLogo className="h-9 sm:h-14" priority />
    </Link>
  );
}
