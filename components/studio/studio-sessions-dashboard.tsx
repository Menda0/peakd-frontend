"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApiBase } from "@/lib/api";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import { StudioNewSessionDialog } from "@/components/studio/studio-new-session-dialog";
import { SessionSummaryCard } from "@/components/studio/session-summary-card";


type SurfSessionRow = {
  sessionId: string;
  status?: "open" | "closed";
  countryCode: string;
  regionId: string;
  spotId: string;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
  conditionsRating: number | null;
  waveTypes: string[];
  createdAt: string;
  spotName?: string;
  regionName?: string;
  videoCount: number;
  previewThumbnailUrls: string[];
};

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  status?: "processing" | "completed" | "failed";
  errorMessage?: string | null;
  thumbnailUrl?: string;
  surfSessionId?: string | null;
};


export function StudioSessionsDashboard() {
  const router = useRouter();
  const { user } = useUser();
  const userPathPrefix = user?.sub ? `/${userSubToPathSegment(user.sub)}` : "";

  const [sessions, setSessions] = useState<SurfSessionRow[]>([]);
  const [legacyJobs, setLegacyJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const base = getApiBase();
      const [sRes, jRes] = await Promise.all([
        fetch(`${base}/studio/sessions`, { credentials: "include" }),
        fetch(`${base}/videos`, { credentials: "include" }),
      ]);
      if (!sRes.ok) {
        throw new Error(await sRes.text().catch(() => sRes.statusText));
      }
      if (!jRes.ok) {
        throw new Error(await jRes.text().catch(() => jRes.statusText));
      }
      const sData = (await sRes.json()) as SurfSessionRow[];
      const jData = (await jRes.json()) as JobListItem[];
      setSessions(
        Array.isArray(sData)
          ? sData.map((s) => ({
              ...s,
              status: s.status ?? "open",
              videoCount: s.videoCount ?? 0,
              previewThumbnailUrls: s.previewThumbnailUrls ?? [],
            }))
          : [],
      );
      const jobs = Array.isArray(jData) ? jData : [];
      setLegacyJobs(jobs.filter((j) => !j.surfSessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load studio");
      setSessions([]);
      setLegacyJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, [loadAll]);

  if (!userPathPrefix) {
    return <div className="text-sm text-zinc-400">Loading workspace…</div>;
  }

  return (
    <div className="text-zinc-100">
      <StudioNewSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(sessionId) => {
          void loadAll();
          router.push(`${userPathPrefix}/studio/sessions/${sessionId}`);
        }}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Studio</h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              Surf sessions work like folders. Open a session to upload and manage videos from
              that day and place.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
            onClick={() => setDialogOpen(true)}
          >
            New surf session
          </Button>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Your sessions</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
              onClick={() => void loadAll()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {loading && !error ? <p className="text-sm text-zinc-500">Loading…</p> : null}

          {!loading && sessions.length === 0 && !error ? (
            <p className="text-sm text-zinc-500">
              No sessions yet. Create one to start organizing uploads.
            </p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.sessionId}>
                <Link
                  href={`${userPathPrefix}/studio/sessions/${s.sessionId}`}
                  className="block transition-colors hover:[&_.session-summary-card]:border-[#26c2c9]/30 hover:[&_.session-summary-card]:shadow-sm"
                >
                  <SessionSummaryCard
                    session={s}
                    className="session-summary-card"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {legacyJobs.length > 0 ? (
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h2 className="text-lg font-semibold tracking-tight">Legacy uploads</h2>
            <p className="text-sm text-zinc-500">
              Videos uploaded before sessions existed. Open to view; new uploads should use a
              session folder.
            </p>
            <ul className="flex flex-col gap-3">
              {legacyJobs.map((job) => (
                <li key={job.jobId}>
                  <Link href={`${userPathPrefix}/studio/${job.jobId}`} className="block">
                    <Card className="border-white/10 bg-white/[0.03] transition-colors hover:border-[#26c2c9]/30">
                      <CardContent className="flex gap-4 p-4">
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          {job.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={job.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                              No preview
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                          <span className="truncate font-medium text-zinc-100">
                            {job.originalFilename}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
