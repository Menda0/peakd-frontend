import { defaultUndisclosedGeoForCountry, isUndisclosedRegionId } from "@/lib/geo-undisclosed";
import type { StudioSessionFormValues } from "@/components/studio/studio-session-form-fields";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeCountryCode(code: string | null | undefined): string | null {
  const cc = code?.trim().toUpperCase();
  return cc && /^[A-Z]{2}$/.test(cc) ? cc : null;
}

export function initialStudioSessionFormValues(options?: {
  countryCode?: string | null;
  regionId?: string | null;
  spotId?: string | null;
}): StudioSessionFormValues {
  const countryCode = normalizeCountryCode(options?.countryCode);
  let regionId = options?.regionId?.trim() || null;
  let spotId = options?.spotId?.trim() || null;

  if (countryCode && !regionId) {
    const undisclosed = defaultUndisclosedGeoForCountry(countryCode);
    regionId = undisclosed.regionId;
    spotId = undisclosed.spotId;
  } else if (
    countryCode &&
    regionId &&
    isUndisclosedRegionId(regionId, countryCode)
  ) {
    spotId = defaultUndisclosedGeoForCountry(countryCode).spotId;
  }

  return {
    countryCode,
    regionId,
    spotId,
    sessionDate: todayYmd(),
    sessionTime: "09:00",
    durationMinutes: 120,
    conditionsRating: null,
    waveTypes: [],
  };
}

export function initialStudioSessionFormValuesFromProfile(profile: {
  countryCode: string | null;
  homeRegionId: string | null;
} | null): StudioSessionFormValues {
  const countryCode = normalizeCountryCode(profile?.countryCode);
  const regionId = profile?.homeRegionId?.trim() || null;
  return initialStudioSessionFormValues({ countryCode, regionId, spotId: null });
}

/** Personal upload: country and region from profile; spot Undisclosed when region is Undisclosed. */
export function initialPersonalUploadFormValuesFromProfile(profile: {
  countryCode: string | null;
  homeRegionId: string | null;
} | null): StudioSessionFormValues {
  const countryCode = normalizeCountryCode(profile?.countryCode);
  const regionId = profile?.homeRegionId?.trim() || null;
  return initialStudioSessionFormValues({ countryCode, regionId, spotId: null });
}
