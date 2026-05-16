"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiBase } from "@/lib/api";
import { userSubToPathSegment } from "@/lib/user-sub-path";

type JobDetail = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  errorMessage?: string | null;
  processedKey?: string;
  videoUrl?: string;
  snapshots: Array<{ key: string; url: string }>;
  surfSessionId?: string | null;
};

export function StudioJobDetail() {
  const params = useParams();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const sessionIdFromRoute =
    typeof params.sessionId === "string" ? params.sessionId : null;
  const { user } = useUser();
  const userPathPrefix = user?.sub ? `/${userSubToPathSegment(user.sub)}` : "";

  const backHref =
    sessionIdFromRoute != null
      ? `${userPathPrefix}/studio/sessions/${sessionIdFromRoute}`
      : `${userPathPrefix}/studio`;
  const backLabel =
    sessionIdFromRoute != null ? "← Back to session" : "← Back to Studio";

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(jobId ? null : "Missing video.");

  const loadDetail = useCallback(async (): Promise<JobDetail> => {
    if (!jobId) {
      throw new Error("Missing video.");
    }
    const base = getApiBase();
    const res = await fetch(`${base}/videos/${jobId}`, {
      credentials: "include",
    });
    if (res.status === 404) {
      throw new Error("This upload was not found.");
    }
    if (!res.ok) {
      throw new Error(await res.text().catch(() => res.statusText));
    }
    return (await res.json()) as JobDetail;
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await loadDetail();
          if (!cancelled) {
            setDetail(data);
          }
        } catch (e) {
          if (!cancelled) {
            setDetail(null);
            setError(e instanceof Error ? e.message : "Failed to load job");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [jobId, loadDetail]);

  const isProcessing = detail?.status === "processing";

  useEffect(() => {
    if (!jobId || !isProcessing) return;
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const data = await loadDetail();
          setDetail(data);
        } catch {
          /* keep last good detail */
        }
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [jobId, isProcessing, loadDetail]);

  if (!jobId) {
    return (
      <div className="space-y-4">
        {userPathPrefix ? (
          <Button
            variant="link"
            nativeButton={false}
            className="h-auto p-0 text-primary"
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            ← Back to Studio
          </Button>
        ) : null}
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Missing video.
        </p>
      </div>
    );
  }

  if (!userPathPrefix) {
    return <div className="text-sm text-zinc-400">Loading…</div>;
  }

  return (
    <div className="text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="mb-2 -ml-2 text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            render={<Link href={backHref} />}
          >
            {backLabel}
          </Button>
        </div>

        {detail && !sessionIdFromRoute && detail.surfSessionId ? (
          <p className="text-sm text-zinc-500">
            <Link
              href={`${userPathPrefix}/studio/sessions/${detail.surfSessionId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Open this video’s session folder
            </Link>
          </p>
        ) : null}

        {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {detail && !loading ? (
          <>
            <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{detail.originalFilename}</CardTitle>
                <CardDescription className="text-zinc-500">
                  {new Date(detail.createdAt).toLocaleString()}
                  {detail.status === "processing" ? (
                    <span className="mt-2 block text-sm text-zinc-400">
                      Processing on the server. You can leave or refresh — status is saved in your
                      library.
                    </span>
                  ) : null}
                  {detail.status === "failed" ? (
                    <span className="mt-2 block text-sm text-red-400">
                      {detail.errorMessage ?? "Processing failed."}
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
            </Card>

            {detail.status === "processing" ? (
              <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
                <CardContent className="py-10">
                  <div className="mx-auto max-w-md space-y-3 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-zinc-400">Transcoding and uploading…</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {detail.status === "completed" && detail.videoUrl ? (
              <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-base">Processed video</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                    <video
                      key={detail.videoUrl}
                      className="aspect-video w-full"
                      controls
                      playsInline
                      preload="metadata"
                      src={detail.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {detail.status === "completed" ? (
              <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-base">Snapshots ({detail.snapshots.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {detail.snapshots.length === 0 ? (
                    <p className="text-sm text-zinc-500">No frames for this job.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {detail.snapshots.map((s, i) => (
                        <a
                          key={s.key}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 transition hover:border-primary/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URLs */}
                          <img
                            src={s.url}
                            alt={`Frame ${i + 1}`}
                            className="aspect-video w-full object-cover transition group-hover:opacity-95"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
