"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBase } from "../../../lib/api";

type JobDetail = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  processedKey: string;
  videoUrl: string;
  snapshots: Array<{ key: string; url: string }>;
};

export default function VideographerJobDetailPage() {
  const params = useParams();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(
    jobId ? null : "Missing job id",
  );

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
          const base = getApiBase();
          const res = await fetch(`${base}/videos/${jobId}`);
          if (res.status === 404) {
            throw new Error("This upload was not found.");
          }
          if (!res.ok) {
            throw new Error(await res.text().catch(() => res.statusText));
          }
          const data = (await res.json()) as JobDetail;
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
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="min-h-full bg-zinc-50 px-4 py-10 font-sans dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/videographer"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            ← Back to uploads
          </Link>
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            Missing job id.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <Link
            href="/videographer"
            className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to uploads
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {detail && !loading ? (
          <>
            <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {detail.originalFilename}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {new Date(detail.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {detail.jobId}
              </p>
            </header>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Processed video
              </h2>
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black dark:border-zinc-800">
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
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Snapshots ({detail.snapshots.length})
              </h2>
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
                      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
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
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
