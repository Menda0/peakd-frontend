"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiBase } from "@/lib/api";
import type { WaveTypeId } from "@/lib/surf-session-waves";
import { defaultUndisclosedGeoForCountry } from "@/lib/geo-undisclosed";
import {
  StudioSessionFormFields,
  validateStudioSessionFormValues,
  type StudioSessionFormValues,
} from "@/components/studio/studio-session-form-fields";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeCountryCode(code: string | null | undefined): string | null {
  const cc = code?.trim().toUpperCase();
  return cc && /^[A-Z]{2}$/.test(cc) ? cc : null;
}

const initialFormValues = (
  defaultCountryCode?: string | null,
): StudioSessionFormValues => {
  const countryCode = normalizeCountryCode(defaultCountryCode);
  const undisclosed = countryCode
    ? defaultUndisclosedGeoForCountry(countryCode)
    : { regionId: null, spotId: null };
  return {
  countryCode,
  regionId: undisclosed.regionId,
  spotId: undisclosed.spotId,
  sessionDate: todayYmd(),
  sessionTime: "09:00",
  durationMinutes: 120,
  conditionsRating: null,
  waveTypes: [],
  };
};

export function StudioNewSessionDialog({
  open,
  onOpenChange,
  onCreated,
  defaultCountryCode = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
  /** Pre-select country (e.g. partner profile country). */
  defaultCountryCode?: string | null;
}) {
  const [values, setValues] = useState<StudioSessionFormValues>(() =>
    initialFormValues(defaultCountryCode),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setValues(initialFormValues(defaultCountryCode));
    setError(null);
  }, [defaultCountryCode]);

  useEffect(() => {
    if (open) {
      setValues(initialFormValues(defaultCountryCode));
      setError(null);
    }
  }, [open, defaultCountryCode]);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const patchValues = (patch: Partial<StudioSessionFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  if (!open) {
    return null;
  }

  const submit = async () => {
    const validationError = validateStudioSessionFormValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: values.countryCode,
          regionId: values.regionId,
          spotId: values.spotId,
          sessionDate: values.sessionDate,
          sessionTime: values.sessionTime,
          durationMinutes: values.durationMinutes,
          conditionsRating: values.conditionsRating,
          waveTypes: values.waveTypes as WaveTypeId[],
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as { sessionId: string };
      if (!data.sessionId) {
        throw new Error("Invalid response");
      }
      close();
      onCreated(data.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-title"
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-[#0a1218] py-0 text-zinc-100 ring-white/10"
      >
        <CardHeader className="shrink-0 space-y-1 border-b border-white/10 px-6 pt-6 pb-4">
          <CardTitle id="new-session-title">New surf session</CardTitle>
          <CardDescription className="text-zinc-500">
            Pick where and when you surfed. Use Undisclosed if you prefer not to share
            the exact region or spot.
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <StudioSessionFormFields values={values} onChange={patchValues} />
        </CardContent>

        <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-white/10 bg-[#0a1218] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">{error}</p>
          ) : (
            <span className="hidden sm:block sm:flex-1" aria-hidden />
          )}
          <div className="flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-zinc-200"
              disabled={submitting}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Creating…" : "Create session"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
