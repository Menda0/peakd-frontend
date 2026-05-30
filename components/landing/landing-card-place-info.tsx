import { MapPinIcon } from "lucide-react";
import { splitLandingPlace, type LandingPlaceInput } from "@/lib/landing-place-labels";

export function LandingCardPlaceInfo({
  location,
  dateLine,
  meta,
}: {
  location: LandingPlaceInput;
  dateLine: string;
  meta?: string | null;
}) {
  const { primary, secondary, fullLabel } = splitLandingPlace(location);

  return (
    <div className="space-y-1">
      <div className="flex min-w-0 gap-1.5">
        <MapPinIcon
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className="truncate text-sm font-semibold leading-tight text-foreground"
            title={fullLabel}
          >
            {primary}
          </p>
          {secondary ? (
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {secondary}
            </p>
          ) : null}
        </div>
      </div>
      <p className="truncate pl-5 text-xs text-muted-foreground">{dateLine}</p>
      {meta ? (
        <p className="truncate pl-5 text-xs text-muted-foreground">{meta}</p>
      ) : null}
    </div>
  );
}
