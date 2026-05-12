"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "../../lib/api";

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  thumbnailUrl?: string;
};

export default function VideographerDashboardPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadJobs = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/videos`);
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as JobListItem[];
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load uploads");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs();
    });
  }, [loadJobs]);

  const uploadFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const base = getApiBase();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/videos/process`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Upload failed (${res.status})`);
      }
      await loadJobs();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Peakd
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Videographer
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Upload a video to transcode, watermark, and capture frames. Past
            uploads are listed below; open one for playback and snapshots.
          </p>
        </header>

        <section
          className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive
              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900/50"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Drop a video here or choose a file
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Processing runs on the server; large files may take a while.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              disabled={uploading}
              onChange={onInputChange}
            />
            {uploading ? "Uploading…" : "Select video"}
          </label>
          {uploadError ? (
            <p className="mt-4 text-left text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          ) : null}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Your uploads
            </h2>
            <button
              type="button"
              onClick={() => void loadJobs()}
              disabled={loading}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Refresh
            </button>
          </div>

          {listError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {listError}
            </p>
          ) : null}

          {loading && !listError ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : null}

          {!loading && jobs.length === 0 && !listError ? (
            <p className="text-sm text-zinc-500">
              No uploads yet. Upload a video above.
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.jobId}>
                <Link
                  href={`/videographer/${job.jobId}`}
                  className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {job.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        No preview
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {job.originalFilename}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                      {job.jobId}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
