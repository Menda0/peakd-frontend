"use client";

import { useCallback, useState } from "react";
import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { SpotPicker } from "@/components/pickers/spot-picker";
import { SessionDatePicker } from "@/components/studio/session-date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiBase } from "@/lib/api";
import { WAVE_TYPE_OPTIONS, formatDurationMinutes, type WaveTypeId } from "@/lib/surf-session-waves";
import { cn } from "@/lib/utils";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StudioNewSessionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
}) {
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(todayYmd);
  const [sessionTime, setSessionTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [conditionsRating, setConditionsRating] = useState<number | null>(null);
  const [waveTypes, setWaveTypes] = useState<WaveTypeId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCountryCode(null);
    setRegionId(null);
    setSpotId(null);
    setSessionDate(todayYmd());
    setSessionTime("09:00");
    setDurationMinutes(120);
    setConditionsRating(null);
    setWaveTypes([]);
    setError(null);
  }, []);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const toggleWaveType = (id: WaveTypeId) => {
    setWaveTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (!open) {
    return null;
  }

  const submit = async () => {
    if (!countryCode || !regionId || !spotId || !sessionDate) {
      setError("Country, region, spot, and date are required.");
      return;
    }
    if (!sessionTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(sessionTime)) {
      setError("Session time must be HH:mm (24-hour).");
      return;
    }
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 15 ||
      durationMinutes > 1440
    ) {
      setError("Duration must be between 15 and 1440 minutes.");
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
          countryCode,
          regionId,
          spotId,
          sessionDate,
          sessionTime,
          durationMinutes,
          conditionsRating,
          waveTypes,
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
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-white/10 bg-[#0a1218] text-zinc-100">
        <CardHeader>
          <CardTitle>New surf session</CardTitle>
          <CardDescription className="text-zinc-500">
            Pick where and when you surfed. You can add regions and spots on the fly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <CountryPicker
            id="surf-country"
            label="Country"
            countryCode={countryCode}
            onCountryCodeChange={(code) => {
              setCountryCode(code);
              setRegionId(null);
              setSpotId(null);
            }}
          />
          <RegionPicker
            id="surf-region"
            countryCode={countryCode}
            regionId={regionId}
            onRegionIdChange={(id) => {
              setRegionId(id);
              setSpotId(null);
            }}
          />
          <SpotPicker
            id="surf-spot"
            regionId={regionId}
            spotId={spotId}
            onSpotIdChange={setSpotId}
          />

          <SessionDatePicker
            id="surf-session-date"
            label="Session date"
            valueYmd={sessionDate}
            onChangeYmd={setSessionDate}
          />

          <div>
            <label
              htmlFor="surf-session-time"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Session start time
            </label>
            <Input
              id="surf-session-time"
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className="border-white/15 bg-white/5 text-zinc-100"
            />
          </div>

          <div>
            <label
              htmlFor="surf-duration"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Duration ({formatDurationMinutes(durationMinutes)})
            </label>
            <Input
              id="surf-duration"
              type="number"
              min={15}
              max={1440}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
              className="border-white/15 bg-white/5 text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">Minutes in the water (15–1440).</p>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-zinc-300">Conditions rating</span>
            <p className="text-xs text-zinc-500">Optional. How good were the overall conditions?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "border-white/15",
                  conditionsRating === null
                    ? "bg-[#26c2c9]/20 text-zinc-50"
                    : "bg-transparent text-zinc-300",
                )}
                onClick={() => setConditionsRating(null)}
              >
                No rating
              </Button>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "min-w-9 border-white/15",
                    conditionsRating === n
                      ? "bg-[#26c2c9]/25 text-[#2dd4dc]"
                      : "bg-transparent text-zinc-300",
                  )}
                  onClick={() => setConditionsRating(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-300">Wave types</legend>
            <p className="text-xs text-zinc-500">Select all that match. You can pick multiple.</p>
            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
              {WAVE_TYPE_OPTIONS.map((w) => {
                const checked = waveTypes.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className="flex cursor-pointer gap-3 rounded-md p-1 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWaveType(w.id)}
                      className="mt-1 size-4 shrink-0 rounded border-white/30 bg-zinc-900 text-[#26c2c9] accent-[#26c2c9]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-100">{w.title}</span>
                      <span className="block text-xs text-zinc-500">{w.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
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
              className="bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Creating…" : "Create session"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
