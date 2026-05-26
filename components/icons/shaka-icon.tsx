import type { HTMLAttributes } from "react";

type ShakaIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  filled?: boolean;
};

/**
 * The classic shaka ("hang loose") sign. Sized via `className` (e.g. `size-5`)
 * and colored via `currentColor`.
 *
 * Renders the brand silhouette as a CSS mask (see `.shaka-icon` in
 * `app/globals.css`) so it inherits the surrounding text color and stays sharp
 * at any size. `filled` distinguishes the active state (full opacity) from idle
 * (slightly muted).
 */
export function ShakaIcon({
  filled = false,
  className,
  ...rest
}: ShakaIconProps) {
  return (
    <span
      role="img"
      aria-hidden="true"
      className={`shaka-icon ${filled ? "opacity-100" : "opacity-90"} ${className ?? ""}`}
      {...rest}
    />
  );
}
