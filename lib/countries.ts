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
