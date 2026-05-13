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

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  thumbnailUrl?: string;
};

export default function VideographerDashboardPage() {
  const { user, isLoading: userLoading } = useUser();
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

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Peakd</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Videographer
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Upload a video to transcode, watermark, and capture frames. Past
              uploads are listed below; open one for playback and snapshots.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {!userLoading && user?.email ? (
              <span className="max-w-[240px] truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            ) : null}
            <Button variant="outline" size="sm" nativeButton={false} render={<a href="/auth/logout" />}>
              Log out
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>
              Processing runs on the server; large files may take a while.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragActive
                  ? "border-primary bg-muted"
                  : "border-border bg-card",
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
              <p className="text-sm font-medium">Drop a video here or choose a file</p>
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
                className="mt-4"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Select video"}
              </Button>
              {uploadError ? (
                <p className="mt-4 text-left text-sm text-destructive">{uploadError}</p>
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
              onClick={() => void loadJobs()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {listError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {listError}
            </p>
          ) : null}

          {loading && !listError ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {!loading && jobs.length === 0 && !listError ? (
            <p className="text-sm text-muted-foreground">
              No uploads yet. Upload a video above.
            </p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.jobId}>
                <Link href={`/videographer/${job.jobId}`} className="block">
                  <Card className="transition-colors hover:border-primary/40 hover:shadow-sm">
                    <CardContent className="flex gap-4 p-4">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {job.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No preview
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                        <span className="truncate font-medium">{job.originalFilename}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {job.jobId}
                        </span>
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
