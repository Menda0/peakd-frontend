import Image from "next/image";
import Link from "next/link";

export function FeedLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <Image
        src="/logos/logo_horizontal.png"
        alt="Peakd"
        width={120}
        height={28}
        className="h-7 w-auto object-contain object-left"
        priority
      />
    </Link>
  );
}
