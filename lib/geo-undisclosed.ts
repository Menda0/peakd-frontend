export const UNDISCLOSED_DISPLAY_NAME = "Undisclosed";

function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

export function undisclosedRegionId(countryCode: string): string {
  return `undisclosed:region:${normalizeCountryCode(countryCode)}`;
}

export function undisclosedSpotId(countryCode: string): string {
  return `undisclosed:spot:${normalizeCountryCode(countryCode)}`;
}

export function isUndisclosedRegionId(
  regionId: string,
  countryCode: string,
): boolean {
  return regionId === undisclosedRegionId(countryCode);
}

export function isUndisclosedSpotId(spotId: string, countryCode: string): boolean {
  return spotId === undisclosedSpotId(countryCode);
}

export function undisclosedRegionOption(countryCode: string): {
  regionId: string;
  name: string;
  verified: boolean;
} {
  return {
    regionId: undisclosedRegionId(countryCode),
    name: UNDISCLOSED_DISPLAY_NAME,
    verified: false,
  };
}

export function undisclosedSpotOption(countryCode: string): {
  spotId: string;
  name: string;
  verified: boolean;
} {
  return {
    spotId: undisclosedSpotId(countryCode),
    name: UNDISCLOSED_DISPLAY_NAME,
    verified: false,
  };
}

export function defaultUndisclosedGeoForCountry(countryCode: string): {
  regionId: string;
  spotId: string;
} {
  return {
    regionId: undisclosedRegionId(countryCode),
    spotId: undisclosedSpotId(countryCode),
  };
}
