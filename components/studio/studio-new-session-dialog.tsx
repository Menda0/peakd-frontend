"use client";

import { useCallback, useState } from "react";
import { CountryPicker } from "@/components/pickers/country-picker";
import { RegionPicker } from "@/components/pickers/region-picker";
import { SpotPicker } from "@/components/pickers/spot-picker";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCountryCode(null);
    setRegionId(null);
    setSpotId(null);
    setSessionDate(todayYmd());
    setError(null);
  }, []);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  if (!open) {
    return null;
  }

  const submit = async () => {
    if (!countryCode || !regionId || !spotId || !sessionDate) {
      setError("Country, region, spot, and date are required.");
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
          <div>
            <label
              htmlFor="surf-session-date"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Session date
            </label>
            <Input
              id="surf-session-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="border-white/15 bg-white/5 text-zinc-100"
            />
          </div>
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
