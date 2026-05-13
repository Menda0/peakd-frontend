"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

type SessionDetail = {
  sessionId: string;
  countryCode: string;
  regionId: string;
  spotId: string;
  sessionDate: string;
  createdAt: string;
  spotName?: string;
  regionName?: string;
};

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  thumbnailUrl?: string;
};

export function StudioSessionFolder() {
  const params = useParams();
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const { user } = useUser();
  const userPathPrefix = user?.sub ? `/${userSubToPathSegment(user.sub)}` : "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setSessionError(null);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/sessions/${sessionId}`, {
        credentials: "include",
      });
      if (res.status === 404) {
        throw new Error("Session not found.");
      }
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      setSession((await res.json()) as SessionDetail);
    } catch (e) {
      setSession(null);
      setSessionError(e instanceof Error ? e.message : "Failed to load session");
    }
  }, [sessionId]);

  const loadJobs = useCallback(async () => {
    if (!sessionId) return;
    setListError(null);
    try {
      const base = getApiBase();
      const res = await fetch(
        `${base}/videos?surfSessionId=${encodeURIComponent(sessionId)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as JobListItem[];
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load videos");
      setJobs([]);
    }
  }, [sessionId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSession(), loadJobs()]);
    setLoading(false);
  }, [loadSession, loadJobs]);

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    queueMicrotask(() => {
      void loadAll();
    });
  }, [sessionId, loadAll]);

  const uploadFile = async (file: File) => {
    if (!sessionId) return;
    setUploadError(null);
    setUploading(true);
    try {
      const base = getApiBase();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("surfSessionId", sessionId);
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

  if (!sessionId) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Missing session id.
      </p>
    );
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
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            ← Back to Studio
          </Button>
        </div>

        {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

        {sessionError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {sessionError}
          </p>
        ) : null}

        {session && !sessionError ? (
          <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">
                {session.spotName ?? "Surf session"} · {session.sessionDate}
              </CardTitle>
              <CardDescription className="text-zinc-500">
                {session.regionName ?? session.regionId} · {session.countryCode}
              </CardDescription>
              <p className="font-mono text-xs text-zinc-600">{session.sessionId}</p>
            </CardHeader>
          </Card>
        ) : null}

        <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription className="text-zinc-500">
              Videos are stored in this session folder.
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
              <p className="text-sm font-medium text-zinc-200">
                Drop a video here or choose a file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="sr-only"
                disabled={uploading || !!sessionError}
                onChange={onInputChange}
              />
              <Button
                type="button"
                className="mt-4 bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
                disabled={uploading || !!sessionError}
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
            <h2 className="text-lg font-semibold tracking-tight">Videos in this session</h2>
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

          {!loading && jobs.length === 0 && !listError && session ? (
            <p className="text-sm text-zinc-500">No videos in this session yet.</p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {jobs.map((job) => (
              <li key={job.jobId}>
                <Link
                  href={`${userPathPrefix}/studio/sessions/${sessionId}/videos/${job.jobId}`}
                  className="block"
                >
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
      </div>
    </div>
  );
}
