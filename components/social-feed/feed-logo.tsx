import Image from "next/image";
import Link from "next/link";

export function FeedLogo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center">
      <Image
        src="/logos/logo_horizontal_white.png"
        alt="Peakd"
        width={168}
        height={40}
        className="h-9 w-auto object-contain object-left sm:h-14"
        priority
      />
    </Link>
  );
}
