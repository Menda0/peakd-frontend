/** Surfline-style conditions scale stored as integers 1–5 in the API. */
export type ConditionsRating = 1 | 2 | 3 | 4 | 5;

export const SURFLINE_CONDITION_RATINGS: ReadonlyArray<{
  value: ConditionsRating;
  label: string;
}> = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Poor-Fair" },
  { value: 3, label: "Fair" },
  { value: 4, label: "Fair-Good" },
  { value: 5, label: "Good" },
];

export function isConditionsRating(value: unknown): value is ConditionsRating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export function surflineConditionsLabel(
  rating: number | null | undefined,
): string | null {
  if (!isConditionsRating(rating)) return null;
  return (
    SURFLINE_CONDITION_RATINGS.find((entry) => entry.value === rating)?.label ??
    null
  );
}
