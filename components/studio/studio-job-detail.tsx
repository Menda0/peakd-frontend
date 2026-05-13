"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
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
  processedKey: string;
  videoUrl: string;
  snapshots: Array<{ key: string; url: string }>;
};

export function StudioJobDetail() {
  const params = useParams();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const { user } = useUser();
  const userPathPrefix = user?.sub ? `/${userSubToPathSegment(user.sub)}` : "";

  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState<string | null>(jobId ? null : "Missing job id");

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
          const res = await fetch(`${base}/videos/${jobId}`, {
            credentials: "include",
          });
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
      <div className="space-y-4">
        {userPathPrefix ? (
          <Button
            variant="link"
            nativeButton={false}
            className="h-auto p-0 text-[#26c2c9]"
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            ← Back to Studio
          </Button>
        ) : null}
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Missing job id.
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
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            ← Back to Studio
          </Button>
        </div>

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
                </CardDescription>
                <p className="break-all font-mono text-xs text-zinc-500">{detail.jobId}</p>
              </CardHeader>
            </Card>

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
                        className="group overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 transition hover:border-[#26c2c9]/40"
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
          </>
        ) : null}
      </div>
    </div>
  );
}
