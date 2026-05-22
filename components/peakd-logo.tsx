import Image from "next/image";
import { cn } from "@/lib/utils";

export const PEAKD_LOGO_LIGHT = "/logos/logo_horizontal_light.png";
export const PEAKD_LOGO_DARK = "/logos/logo_horizontal_dark.png";

export function PeakdLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  const imgClass = cn("w-auto object-contain object-left", className);

  return (
    <>
      <Image
        src={PEAKD_LOGO_LIGHT}
        alt="Peakd"
        width={600}
        height={600}
        className={cn(imgClass, "dark:hidden")}
        priority={priority}
      />

      <Image
        src={PEAKD_LOGO_LIGHT}
        alt="Peakd"
        width={600}
        height={600}
        className={cn(imgClass, "hidden dark:block")}
        priority={priority}
      />

    </>
  );
}
