import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en as Parameters<typeof countries.registerLocale>[0]);

export type CountryOption = { value: string; label: string };

let optionsCache: CountryOption[] | null = null;

export function getEnglishCountryOptions(): CountryOption[] {
  if (optionsCache) return optionsCache;
  const codes = countries.getAlpha2Codes();
  optionsCache = Object.keys(codes)
    .map((code) => ({
      value: code,
      label: countries.getName(code, "en", { select: "official" }) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return optionsCache;
}

/** Official English country name for an ISO 3166-1 alpha-2 code, or null if unknown. */
export function englishCountryLabel(code: string | null | undefined): string | null {
  if (code == null || typeof code !== "string") return null;
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;
  return countries.getName(c, "en", { select: "official" }) ?? c;
}
