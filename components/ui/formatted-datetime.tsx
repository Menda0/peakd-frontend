"use client";

import { useEffect, useState } from "react";
import { formatDateTimeMedium } from "@/lib/format-datetime";

/**
 * Renders a datetime only after mount so SSR and hydration never disagree.
 * Prefer `createdAtLabel` from a Server Component when available.
 */
export function FormattedDateTime({
  value,
  fallback = "—",
}: {
  value: string;
  fallback?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatDateTimeMedium(value));
  }, [value]);

  return <span suppressHydrationWarning>{label ?? fallback}</span>;
}
