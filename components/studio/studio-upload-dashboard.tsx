"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";
import { userSubToPathSegment } from "@/lib/user-sub-path";

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  thumbnailUrl?: string;
};

export function StudioUploadDashboard() {
  const { user } = useUser();
  const userPathPrefix = user?.sub ? `/${userSubToPathSegment(user.sub)}` : "";

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const res = await fetch(`${base}/videos`, { credentials: "include" });
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
        credentials: "include",
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

  if (!userPathPrefix) {
    return <div className="text-sm text-zinc-400">Loading workspace…</div>;
  }

  return (
    <div className="text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-1 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Studio</h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            Upload a video to transcode, watermark, and capture frames. Past uploads are listed
            below; open one for playback and snapshots.
          </p>
        </header>

        <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription className="text-zinc-500">
              Processing runs on the server; large files may take a while.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragActive ? "border-[#26c2c9]/50 bg-white/5" : "border-white/15 bg-zinc-900/30",
              )}
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
              <p className="text-sm font-medium text-zinc-200">Drop a video here or choose a file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="sr-only"
                disabled={uploading}
                onChange={onInputChange}
              />
              <Button
                type="button"
                className="mt-4 bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Select video"}
              </Button>
              {uploadError ? (
                <p className="mt-4 text-left text-sm text-red-400">{uploadError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Your uploads</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/5"
              onClick={() => void loadJobs()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {listError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {listError}
            </p>
          ) : null}

          {loading && !listError ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : null}

          {!loading && jobs.length === 0 && !listError ? (
            <p className="text-sm text-zinc-500">No uploads yet. Upload a video above.</p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.jobId}>
                <Link href={`${userPathPrefix}/studio/${job.jobId}`} className="block">
                  <Card className="border-white/10 bg-white/[0.03] transition-colors hover:border-[#26c2c9]/30 hover:shadow-sm">
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
                        <span className="truncate font-medium text-zinc-100">{job.originalFilename}</span>
                        <span className="text-xs text-zinc-500">
                          {new Date(job.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">{job.jobId}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
