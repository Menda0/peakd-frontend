import Image from "next/image";
import { cn } from "@/lib/utils";

export const PEAK_ICON_LIGHT = "/logos/peak-icon-light.png";
export const PEAK_ICON_DARK = "/logos/peak-icon-dark.png";

export function PeakIcon({
  className,
  size = 20,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={PEAK_ICON_LIGHT}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 object-contain dark:hidden", className)}
        priority={priority}
        aria-hidden
      />
      <Image
        src={PEAK_ICON_DARK}
        alt=""
        width={size}
        height={size}
        className={cn("hidden shrink-0 object-contain dark:block", className)}
        priority={priority}
        aria-hidden
      />
    </>
  );
}
