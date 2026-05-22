import Image from "next/image";
import { cn } from "@/lib/utils";

export function PeakIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logos/peak-icon.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
