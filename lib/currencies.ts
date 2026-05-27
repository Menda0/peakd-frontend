/**
 * Currency utilities — replaces the old Peaks-denominated `lib/billing.ts`
 * helpers. Prices are stored as integer minor units (e.g. cents) so we never
 * touch floating-point on the wire; everything renders through `formatMoney`
 * (which also handles zero-decimal currencies like JPY).
 */

/**
 * Subset of Stripe-supported ISO 4217 currencies surfaced in the partner
 * commercial profile dropdown. Add more here as needed — the backend accepts
 * any 3-letter code Stripe knows about.
 */
export const SUPPORTED_CURRENCIES: readonly string[] = [
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "JPY",
  "MXN",
  "NOK",
  "NZD",
  "PLN",
  "SEK",
  "SGD",
  "USD",
  "ZAR",
];

/** Currencies that have no minor unit — `videoPriceMinor` is the full amount. */
export const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

export function isSupportedCurrency(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return SUPPORTED_CURRENCIES.includes(value.toUpperCase());
}

export function normalizeCurrency(value: string): string {
  return value.trim().toUpperCase();
}

/** Convert a minor-unit integer to a decimal major-unit number. */
export function minorToMajor(amountMinor: number, currency: string): number {
  const decimals = currencyDecimals(currency);
  return amountMinor / 10 ** decimals;
}

/** Convert a major-unit decimal to a minor-unit integer (rounded). */
export function majorToMinor(amountMajor: number, currency: string): number {
  const decimals = currencyDecimals(currency);
  return Math.round(amountMajor * 10 ** decimals);
}

/**
 * Render `amountMinor` in `currency` using the user's browser locale. Falls
 * back to "en" if `Intl` rejects a custom locale (e.g. on stale runtimes).
 */
export function formatMoney(
  amountMinor: number,
  currency: string,
  options: { locale?: string; maximumFractionDigits?: number } = {},
): string {
  const cur = normalizeCurrency(currency);
  const decimals = currencyDecimals(cur);
  const value = amountMinor / 10 ** decimals;
  const formatterOpts: Intl.NumberFormatOptions = {
    style: "currency",
    currency: cur,
    minimumFractionDigits: decimals,
    maximumFractionDigits:
      options.maximumFractionDigits != null
        ? Math.max(decimals, options.maximumFractionDigits)
        : decimals,
  };
  const locale =
    options.locale ??
    (typeof navigator !== "undefined" ? navigator.language : "en");
  try {
    return new Intl.NumberFormat(locale, formatterOpts).format(value);
  } catch {
    return new Intl.NumberFormat("en", formatterOpts).format(value);
  }
}

/** Step (in major units) suitable for `<input type="number" step={...}>`. */
export function priceInputStep(currency: string): string {
  const decimals = currencyDecimals(currency);
  if (decimals === 0) return "1";
  return `0.${"0".repeat(decimals - 1)}1`;
}
