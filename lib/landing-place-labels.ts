import { englishCountryLabel } from "@/lib/countries";

export type LandingPlaceInput = {
  spotName: string | null;
  regionName: string;
  countryCode: string;
  isUndisclosed?: boolean;
};

/** Primary line is the spot (or region when no spot); secondary is region + country. */
export function splitLandingPlace(location: LandingPlaceInput): {
  primary: string;
  secondary: string | null;
  fullLabel: string;
} {
  const country =
    englishCountryLabel(location.countryCode) ?? location.countryCode;
  const region = location.regionName.trim() || "Unknown";
  const spot = location.spotName?.trim() || null;

  if (location.isUndisclosed) {
    return {
      primary: region,
      secondary: country,
      fullLabel: `${region} · ${country}`,
    };
  }

  if (spot) {
    const secondary = `${region} · ${country}`;
    return {
      primary: spot,
      secondary,
      fullLabel: `${spot} · ${secondary}`,
    };
  }

  return {
    primary: region,
    secondary: country,
    fullLabel: `${region} · ${country}`,
  };
}
