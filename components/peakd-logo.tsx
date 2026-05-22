import Image from "next/image";
import { cn } from "@/lib/utils";

export const PEAKD_LOGO_LIGHT = "/logos/logo_horizontal_light.png";

export function PeakdLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={PEAKD_LOGO_LIGHT}
      alt="Peakd"
      width={600}
      height={600}
      className={cn("w-auto object-contain object-left", className)}
      priority={priority}
    />
  );
}
