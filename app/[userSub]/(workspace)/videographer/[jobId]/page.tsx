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

export default function VideographerJobDetailPage() {
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
      <div className="px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {userPathPrefix ? (
            <Button variant="link" nativeButton={false} className="h-auto p-0" render={<Link href={`${userPathPrefix}/videographer`} />}>
              ← Back to uploads
            </Button>
          ) : null}
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Missing job id.
          </p>
        </div>
      </div>
    );
  }

  if (!userPathPrefix) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="mb-2 -ml-2"
            render={<Link href={`${userPathPrefix}/videographer`} />}
          >
            ← Back to uploads
          </Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {detail && !loading ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{detail.originalFilename}</CardTitle>
                <CardDescription>{new Date(detail.createdAt).toLocaleString()}</CardDescription>
                <p className="break-all font-mono text-xs text-muted-foreground">{detail.jobId}</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processed video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-border bg-black">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snapshots ({detail.snapshots.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.snapshots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No frames for this job.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {detail.snapshots.map((s, i) => (
                      <a
                        key={s.key}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/40"
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
