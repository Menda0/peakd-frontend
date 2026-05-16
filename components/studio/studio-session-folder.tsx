"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";
import {
  SESSION_PREVIEW_SLOTS_DETAIL,
  SessionSummaryCard,
  VideoThumbnailStrip,
} from "@/components/studio/session-summary-card";
import {
  StudioSessionFormFields,
  validateStudioSessionFormValues,
  type StudioSessionFormValues,
} from "@/components/studio/studio-session-form-fields";
import type { WaveTypeId } from "@/lib/surf-session-waves";
import { userSubToPathSegment } from "@/lib/user-sub-path";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDown, Copy, Download, Loader2, Share2 } from "lucide-react";

type ExportKind = "processed" | "raw";

/** Same-origin path proxied by `/api/peakd/*` (streams ZIP from API; not S3 URLs). */
function sessionExportPath(sessionId: string, kind: ExportKind): string {
  const branch =
    kind === "processed" ? "export/download" : "export/raw/download";
  return `/studio/sessions/${sessionId}/${branch}`;
}

function absoluteSessionExportShareUrl(
  sessionId: string,
  kind: ExportKind,
): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${getApiBase()}${sessionExportPath(sessionId, kind)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Whole days until expiry for raw-export ZIP UX (aligned with API retention). */
function rawDaysRemaining(expiresAt: string | null | undefined): number {
  if (!expiresAt?.trim()) return 0;
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

function StudioExportShareModal({
  kind,
  url,
  copied,
  rawDaysLeft,
  onClose,
  onCopyLink,
}: {
  kind: ExportKind | null;
  url: string;
  copied: boolean;
  rawDaysLeft: number;
  onClose: () => void;
  onCopyLink: () => void;
}) {
  if (!kind) return null;

  const title =
    kind === "processed" ? "Share processed export" : "Share raw export";
  const description =
    kind === "processed"
      ? "This Peakd link downloads through our site (not direct cloud storage). Anyone who opens it must be signed in as you — share only with people you trust."
      : rawDaysLeft > 0
        ? `Same as processed — link goes through Peakd. Raw ZIP files are removed from storage after about ${rawDaysLeft} more whole day${rawDaysLeft === 1 ? "" : "s"}; until then you can reuse this link while signed in.`
        : "Raw export retention has ended; sharing is no longer available.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg border-white/10 bg-[#0a1218] text-zinc-100">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-zinc-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-white/10 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              readOnly
              value={url}
              className="border-white/15 bg-black/30 font-mono text-xs text-zinc-200"
              aria-label="Share link"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-white/15 bg-transparent text-zinc-200 sm:w-auto"
              onClick={onCopyLink}
            >
              <Copy className="size-4" aria-hidden />
              <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          {copied ? (
            <p className="text-xs text-emerald-400">Link copied to clipboard.</p>
          ) : null}
          <p className="text-xs text-zinc-500">
            Opening the link in a browser starts a logged-in download from Peakd.
          </p>
        </CardContent>
        <CardFooter className="justify-end border-white/10 bg-transparent py-4">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-zinc-200"
            onClick={onClose}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

type SessionDetail = {
  sessionId: string;
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
  status?: "open" | "closed";
  closedAt?: string | null;
  exportStatus?: "idle" | "processing" | "ready" | "failed";
  exportErrorMessage?: string | null;
  rawExportStatus?: "idle" | "processing" | "ready" | "failed";
  rawExportErrorMessage?: string | null;
  rawExportExpiresAt?: string | null;
};

function sessionToFormValues(session: SessionDetail): StudioSessionFormValues {
  return {
    countryCode: session.countryCode,
    regionId: session.regionId,
    spotId: session.spotId,
    sessionDate: session.sessionDate,
    sessionTime: session.sessionTime ?? "12:00",
    durationMinutes: session.durationMinutes ?? 120,
    conditionsRating: session.conditionsRating,
    waveTypes: (session.waveTypes ?? []) as WaveTypeId[],
  };
}

type JobListItem = {
  jobId: string;
  originalFilename: string;
  createdAt: string;
  status?: "processing" | "completed" | "failed";
  errorMessage?: string | null;
  thumbnailUrl?: string;
  thumbnailUrls?: string[];
};

type PendingUpload = {
  clientId: string;
  fileName: string;
  phase: "uploading" | "error";
  errorMessage?: string;
};

type StagedFile = {
  clientId: string;
  file: File;
};

function isProbablyVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|wmv)$/i.test(file.name);
}

const dropdownSurface =
  "min-w-[260px] border border-white/10 bg-[#0a1218] p-1 text-zinc-100 shadow-lg ring-1 ring-white/10";

function SessionActionsBar({
  session,
  hasProcessingJob,
  isSessionClosed,
  showExportActions,
  exportProcessing,
  exportReady,
  exportFailed,
  rawExportProcessing,
  rawExportReady,
  rawExportFailed,
  rawDaysLeft,
  anyExportProcessing,
  closingSession,
  closeError,
  downloadError,
  rawDownloadError,
  onCloseClick,
  onEditClick,
  onDownloadPick,
  onSharePick,
}: {
  session: SessionDetail;
  hasProcessingJob: boolean;
  isSessionClosed: boolean;
  showExportActions: boolean;
  exportProcessing: boolean;
  exportReady: boolean;
  exportFailed: boolean;
  rawExportProcessing: boolean;
  rawExportReady: boolean;
  rawExportFailed: boolean;
  rawDaysLeft: number;
  anyExportProcessing: boolean;
  closingSession: boolean;
  closeError: string | null;
  downloadError: string | null;
  rawDownloadError: string | null;
  onCloseClick: () => void;
  onEditClick: () => void;
  onDownloadPick: (kind: ExportKind) => void;
  onSharePick: (kind: ExportKind) => void;
}) {
  const processedDownloadDisabled =
    !exportReady || exportProcessing;
  const rawDownloadDisabled =
    !rawExportReady ||
    rawExportProcessing ||
    rawDaysLeft <= 0;

  const processedShareDisabled = !exportReady || exportProcessing;
  const rawShareDisabled =
    !rawExportReady || rawExportProcessing || rawDaysLeft <= 0;

  const downloadTriggerLabel = anyExportProcessing
    ? "Preparing exports…"
    : "Download";

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {showExportActions ? (
          <div className="flex flex-wrap items-center gap-2 sm:mr-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/15 bg-transparent text-zinc-200 data-popup-open:bg-white/10",
                )}
                disabled={processedDownloadDisabled && rawDownloadDisabled}
              >
                {anyExportProcessing ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4 shrink-0" aria-hidden />
                )}
                <span className="ml-2">{downloadTriggerLabel}</span>
                <ChevronDown className="ml-1 size-4 shrink-0 opacity-70" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownSurface}>
                <DropdownMenuItem
                  disabled={processedDownloadDisabled}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-white/10"
                  onClick={() => onDownloadPick("processed")}
                >
                  <span className="font-medium text-zinc-100">Processed</span>
                  <span className="text-xs text-zinc-500">
                    WebM + snapshots (ZIP)
                    {exportFailed ? " — build failed" : ""}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={rawDownloadDisabled}
                  title={
                    rawDaysLeft <= 0 && rawExportReady
                      ? "Raw export retention period has ended."
                      : undefined
                  }
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-white/10"
                  onClick={() => onDownloadPick("raw")}
                >
                  <span className="font-medium text-zinc-100">Raw originals</span>
                  <span className="text-xs text-zinc-500">
                    {rawExportReady && rawDaysLeft > 0
                      ? `Original uploads + snapshots · ${rawDaysLeft}d left on Peakd`
                      : rawExportReady
                        ? "Retention ended"
                        : rawExportFailed
                          ? "Build failed"
                          : "ZIP of source files + snapshots"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/15 bg-transparent text-zinc-200 data-popup-open:bg-white/10",
                )}
                disabled={processedShareDisabled && rawShareDisabled}
              >
                {anyExportProcessing ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="size-4 shrink-0" aria-hidden />
                )}
                <span className="ml-2">Share</span>
                <ChevronDown className="ml-1 size-4 shrink-0 opacity-70" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownSurface}>
                <DropdownMenuItem
                  disabled={processedShareDisabled}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-white/10"
                  onClick={() => onSharePick("processed")}
                >
                  <span className="font-medium text-zinc-100">Processed export</span>
                  <span className="text-xs text-zinc-500">
                    Temporary download link (ZIP)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={rawShareDisabled}
                  title={
                    rawDaysLeft <= 0 && rawExportReady
                      ? "Raw export retention period has ended."
                      : undefined
                  }
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-white/10"
                  onClick={() => onSharePick("raw")}
                >
                  <span className="font-medium text-zinc-100">Raw export</span>
                  <span className="text-xs text-zinc-500">
                    {rawExportReady && rawDaysLeft > 0
                      ? `Temporary link · ~${rawDaysLeft}d file retention on Peakd`
                      : "Original uploads + snapshots"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
        {!isSessionClosed ? (
          <>
            <span
              title={
                hasProcessingJob
                  ? "Wait until all videos finish processing before closing this session."
                  : undefined
              }
              className="inline-flex"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/15 bg-transparent text-zinc-200"
                disabled={hasProcessingJob || closingSession}
                onClick={onCloseClick}
              >
                {closingSession ? "Closing…" : "Close session"}
              </Button>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-zinc-200"
              onClick={onEditClick}
            >
              Edit session
            </Button>
          </>
        ) : null}
      </div>
      {closeError ? <p className="text-sm text-red-400">{closeError}</p> : null}
      {downloadError ? <p className="text-sm text-red-400">{downloadError}</p> : null}
      {rawDownloadError ? (
        <p className="text-sm text-red-400">{rawDownloadError}</p>
      ) : null}
      {exportFailed && session.exportErrorMessage ? (
        <p className="text-sm text-red-400">{session.exportErrorMessage}</p>
      ) : null}
      {rawExportFailed && session.rawExportErrorMessage ? (
        <p className="text-sm text-red-400">{session.rawExportErrorMessage}</p>
      ) : null}
      {isSessionClosed ? (
        <p className="text-xs text-zinc-500">
          This session is closed. Uploads are disabled.
          {session.closedAt
            ? ` Closed ${new Date(session.closedAt).toLocaleString()}.`
            : ""}
        </p>
      ) : null}
    </>
  );
}

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
  const [confirmUploadFiles, setConfirmUploadFiles] = useState<File[] | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<StudioSessionFormValues | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [rawDownloadError, setRawDownloadError] = useState<string | null>(null);
  const [shareModalKind, setShareModalKind] = useState<ExportKind | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareDisplayedUrl = useMemo(() => {
    if (!shareModalKind || !sessionId) return "";
    return absoluteSessionExportShareUrl(sessionId, shareModalKind);
  }, [shareModalKind, sessionId]);

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
      const data = (await res.json()) as SessionDetail;
      setSession({
        ...data,
        videoCount: data.videoCount ?? 0,
        previewThumbnailUrls: data.previewThumbnailUrls ?? [],
        status: data.status ?? "open",
        exportStatus: data.exportStatus ?? "idle",
        exportErrorMessage: data.exportErrorMessage ?? null,
        rawExportStatus: data.rawExportStatus ?? "idle",
        rawExportErrorMessage: data.rawExportErrorMessage ?? null,
        rawExportExpiresAt: data.rawExportExpiresAt ?? null,
        closedAt: data.closedAt ?? null,
      });
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
      setJobs(
        Array.isArray(data)
          ? data.map((job) => ({
              ...job,
              thumbnailUrls:
                job.thumbnailUrls ??
                (job.thumbnailUrl ? [job.thumbnailUrl] : []),
            }))
          : [],
      );
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

  const hasProcessingJob = jobs.some((j) => (j.status ?? "completed") === "processing");
  const isSessionClosed = session?.status === "closed";
  const exportProcessing = session?.exportStatus === "processing";
  const exportReady = session?.exportStatus === "ready";
  const exportFailed = session?.exportStatus === "failed";
  const rawExportProcessing = session?.rawExportStatus === "processing";
  const rawExportReady = session?.rawExportStatus === "ready";
  const rawExportFailed = session?.rawExportStatus === "failed";
  const rawDaysLeft = rawDaysRemaining(session?.rawExportExpiresAt);
  const anyExportProcessing = exportProcessing || rawExportProcessing;
  const showExportActions =
    isSessionClosed ||
    (session?.exportStatus != null && session.exportStatus !== "idle") ||
    (session?.rawExportStatus != null && session.rawExportStatus !== "idle");
  const uploadDisabled =
    !!sessionError || loading || !session || editing || isSessionClosed;

  useEffect(() => {
    if (!sessionId || !hasProcessingJob) return;
    const id = window.setInterval(() => {
      void loadJobs();
    }, 2500);
    return () => window.clearInterval(id);
  }, [sessionId, hasProcessingJob, loadJobs]);

  useEffect(() => {
    if (!sessionId || (!exportProcessing && !rawExportProcessing)) return;
    const id = window.setInterval(() => {
      void loadSession();
    }, 2500);
    return () => window.clearInterval(id);
  }, [sessionId, exportProcessing, rawExportProcessing, loadSession]);

  const handleCloseShareModal = useCallback(() => {
    setShareModalKind(null);
    setShareCopied(false);
    if (shareCopyResetRef.current) {
      clearTimeout(shareCopyResetRef.current);
      shareCopyResetRef.current = null;
    }
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareDisplayedUrl) return;
    try {
      await navigator.clipboard.writeText(shareDisplayedUrl);
      setShareCopied(true);
      if (shareCopyResetRef.current) {
        clearTimeout(shareCopyResetRef.current);
      }
      shareCopyResetRef.current = setTimeout(() => {
        setShareCopied(false);
        shareCopyResetRef.current = null;
      }, 2500);
    } catch {
      setShareCopied(false);
    }
  }, [shareDisplayedUrl]);

  const handleDownloadPick = useCallback(
    (kind: ExportKind) => {
      if (kind === "processed" && (!exportReady || exportProcessing)) {
        return;
      }
      if (
        kind === "raw" &&
        (!rawExportReady ||
          rawExportProcessing ||
          rawDaysRemaining(session?.rawExportExpiresAt) <= 0)
      ) {
        return;
      }
      const setErr =
        kind === "processed" ? setDownloadError : setRawDownloadError;
      setErr(null);
      const path = sessionExportPath(sessionId, kind);
      window.open(`${getApiBase()}${path}`, "_blank", "noopener,noreferrer");
    },
    [
      sessionId,
      exportReady,
      exportProcessing,
      rawExportReady,
      rawExportProcessing,
      session?.rawExportExpiresAt,
    ],
  );

  const handleSharePick = useCallback((kind: ExportKind) => {
    setShareCopied(false);
    setShareModalKind(kind);
  }, []);

  const removePending = useCallback((clientId: string) => {
    setPendingUploads((rows) => rows.filter((r) => r.clientId !== clientId));
  }, []);

  const uploadOne = useCallback(
    async (clientId: string, file: File) => {
      if (!sessionId) return;
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
        const text = await res.text();
        let parsed: { jobId?: string; status?: string } = {};
        if (text) {
          try {
            parsed = JSON.parse(text) as { jobId?: string; status?: string };
          } catch {
            /* not JSON */
          }
        }
        if (res.status === 202) {
          if (!parsed.jobId) {
            throw new Error(text || "Invalid upload response");
          }
          setPendingUploads((rows) => rows.filter((r) => r.clientId !== clientId));
          await loadJobs();
          return;
        }
        if (!res.ok) {
          throw new Error(text || `Upload failed (${res.status})`);
        }
        setPendingUploads((rows) => rows.filter((r) => r.clientId !== clientId));
        await loadJobs();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setPendingUploads((rows) =>
          rows.map((r) =>
            r.clientId === clientId ? { ...r, phase: "error", errorMessage: msg } : r,
          ),
        );
      }
    },
    [sessionId, loadJobs],
  );

  const startUploads = useCallback(
    (files: File[]) => {
      const videoFiles = files.filter(isProbablyVideoFile);
      if (videoFiles.length === 0) {
        setUploadError("Choose one or more video files.");
        return;
      }
      setUploadError(null);
      const newRows: PendingUpload[] = videoFiles.map((file) => ({
        clientId: crypto.randomUUID(),
        fileName: file.name,
        phase: "uploading",
      }));
      setPendingUploads((prev) => [...newRows, ...prev]);
      for (let i = 0; i < videoFiles.length; i++) {
        void uploadOne(newRows[i].clientId, videoFiles[i]);
      }
    },
    [uploadOne],
  );

  const handleCloseSession = useCallback(async () => {
    if (!sessionId) return;
    setCloseError(null);
    setClosingSession(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/sessions/${sessionId}/close`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      setCloseConfirmOpen(false);
      await loadSession();
    } catch (e) {
      setCloseError(e instanceof Error ? e.message : "Failed to close session");
    } finally {
      setClosingSession(false);
    }
  }, [sessionId, loadSession]);

  const addStagedFiles = useCallback((files: File[]) => {
    if (uploadDisabled) return;
    const videoFiles = files.filter(isProbablyVideoFile);
    if (videoFiles.length === 0) {
      setUploadError("No video files found. Use MP4, MOV, WebM, MKV, or similar.");
      return;
    }
    setUploadError(null);
    setStagedFiles((prev) => {
      const next = [...prev];
      for (const file of videoFiles) {
        const dup = next.some(
          (s) =>
            s.file.name === file.name &&
            s.file.size === file.size &&
            s.file.lastModified === file.lastModified,
        );
        if (!dup) next.push({ clientId: crypto.randomUUID(), file });
      }
      return next;
    });
  }, [uploadDisabled]);

  const removeStaged = useCallback((clientId: string) => {
    setStagedFiles((rows) => rows.filter((r) => r.clientId !== clientId));
  }, []);

  const clearStaged = useCallback(() => {
    setStagedFiles([]);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    const picked = list?.length ? Array.from(list) : [];
    e.target.value = "";
    if (picked.length) addStagedFiles(picked);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (uploadDisabled) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) addStagedFiles(files);
  };

  const openUploadConfirm = () => {
    if (uploadDisabled || !stagedFiles.length) return;
    setConfirmUploadFiles(stagedFiles.map((s) => s.file));
    setUploadConfirmOpen(true);
  };

  const handleCancelUploadConfirm = () => {
    setUploadConfirmOpen(false);
    setConfirmUploadFiles(null);
  };

  const handleConfirmUpload = () => {
    const files = confirmUploadFiles;
    if (!files?.length) return;
    setUploadConfirmOpen(false);
    setConfirmUploadFiles(null);
    clearStaged();
    startUploads(files);
  };

  const uploadConfirmDescription =
    confirmUploadFiles && confirmUploadFiles.length > 0
      ? `You are about to upload ${confirmUploadFiles.length} file${
          confirmUploadFiles.length === 1 ? "" : "s"
        } to this session. Each file will upload and process on the server in parallel.\n\n${confirmUploadFiles
          .slice(0, 8)
          .map((f) => `· ${f.name}`)
          .join("\n")}${confirmUploadFiles.length > 8 ? `\n· …and ${confirmUploadFiles.length - 8} more` : ""}`
      : "";

  if (!userPathPrefix) {
    return <div className="text-sm text-zinc-400">Loading workspace…</div>;
  }

  if (!sessionId) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        This session link is invalid.
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
          <section className="space-y-4">
            {editing && editValues ? (
              <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
                <CardHeader>
                  <CardTitle>Edit session</CardTitle>
                  <CardDescription className="text-zinc-500">
                    Update where and when you surfed, conditions, and wave types.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <StudioSessionFormFields
                    idPrefix="edit-surf"
                    values={editValues}
                    onChange={(patch) =>
                      setEditValues((prev) => (prev ? { ...prev, ...patch } : prev))
                    }
                  />
                  {editError ? (
                    <p className="text-sm text-red-400">{editError}</p>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-transparent text-zinc-200"
                      disabled={savingEdit}
                      onClick={() => {
                        setEditing(false);
                        setEditValues(null);
                        setEditError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={savingEdit}
                      onClick={() => void (async () => {
                        const validationError = validateStudioSessionFormValues(editValues);
                        if (validationError) {
                          setEditError(validationError);
                          return;
                        }
                        setEditError(null);
                        setSavingEdit(true);
                        try {
                          const base = getApiBase();
                          const res = await fetch(
                            `${base}/studio/sessions/${sessionId}`,
                            {
                              method: "PATCH",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                countryCode: editValues.countryCode,
                                regionId: editValues.regionId,
                                spotId: editValues.spotId,
                                sessionDate: editValues.sessionDate,
                                sessionTime: editValues.sessionTime,
                                durationMinutes: editValues.durationMinutes,
                                conditionsRating: editValues.conditionsRating,
                                waveTypes: editValues.waveTypes,
                              }),
                            },
                          );
                          if (!res.ok) {
                            throw new Error(
                              await res.text().catch(() => res.statusText),
                            );
                          }
                          const updated = (await res.json()) as SessionDetail;
                          setSession({
                            ...updated,
                            videoCount: updated.videoCount ?? session.videoCount,
                            previewThumbnailUrls:
                              updated.previewThumbnailUrls ??
                              session.previewThumbnailUrls,
                            status: updated.status ?? session.status,
                            exportStatus: updated.exportStatus ?? session.exportStatus,
                            exportErrorMessage:
                              updated.exportErrorMessage ?? session.exportErrorMessage,
                            rawExportStatus:
                              updated.rawExportStatus ?? session.rawExportStatus,
                            rawExportErrorMessage:
                              updated.rawExportErrorMessage ??
                              session.rawExportErrorMessage,
                            rawExportExpiresAt:
                              updated.rawExportExpiresAt ??
                              session.rawExportExpiresAt,
                            closedAt: updated.closedAt ?? session.closedAt,
                          });
                          setEditing(false);
                          setEditValues(null);
                        } catch (e) {
                          setEditError(
                            e instanceof Error ? e.message : "Failed to save session",
                          );
                        } finally {
                          setSavingEdit(false);
                        }
                      })()}
                    >
                      {savingEdit ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <SessionActionsBar
                  session={session}
                  hasProcessingJob={hasProcessingJob}
                  isSessionClosed={isSessionClosed}
                  showExportActions={showExportActions}
                  exportProcessing={exportProcessing}
                  exportReady={exportReady}
                  exportFailed={exportFailed}
                  rawExportProcessing={rawExportProcessing}
                  rawExportReady={rawExportReady}
                  rawExportFailed={rawExportFailed}
                  rawDaysLeft={rawDaysLeft}
                  anyExportProcessing={anyExportProcessing}
                  closingSession={closingSession}
                  closeError={closeError}
                  downloadError={downloadError}
                  rawDownloadError={rawDownloadError}
                  onCloseClick={() => {
                    setCloseError(null);
                    setCloseConfirmOpen(true);
                  }}
                  onEditClick={() => {
                    setEditValues(sessionToFormValues(session));
                    setEditError(null);
                    setEditing(true);
                  }}
                  onDownloadPick={handleDownloadPick}
                  onSharePick={handleSharePick}
                />
                <SessionSummaryCard
                  session={session}
                  previewSlotCount={SESSION_PREVIEW_SLOTS_DETAIL}
                />
              </div>
            )}
          </section>
        ) : null}

        <Card className="border-white/10 bg-white/[0.03] text-zinc-100">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription className="text-zinc-500">
              {isSessionClosed
                ? "This session is closed. You can't add more videos."
                : (
                    <>
                      Import videos into the queue below, then use{" "}
                      <span className="text-zinc-400">Upload to session</span> to start. You will be
                      asked to confirm before anything is sent.
                    </>
                  )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:px-6 sm:py-8",
                uploadDisabled
                  ? "border-white/10 bg-zinc-900/20 opacity-60"
                  : dragActive
                    ? "border-primary/50 bg-white/5"
                    : "border-white/15 bg-zinc-900/30",
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                if (uploadDisabled) return;
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (uploadDisabled) return;
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
            >
              <p className="text-sm font-medium text-zinc-200">
                Drop videos here or import files (queue appears below)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.mpeg,.mpg,.wmv"
                multiple
                className="sr-only"
                disabled={uploadDisabled}
                onChange={onInputChange}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-4 border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                disabled={uploadDisabled}
                onClick={() => fileInputRef.current?.click()}
              >
                Import videos
              </Button>

              {stagedFiles.length > 0 ? (
                <ul className="mt-6 space-y-2 text-left">
                  {stagedFiles.map(({ clientId, file }) => (
                    <li
                      key={clientId}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-100" title={file.name}>
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-zinc-400 hover:text-zinc-100"
                        disabled={uploadDisabled}
                        onClick={() => removeStaged(clientId)}
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-xs text-zinc-500">
                  No files in the queue yet. Use Import or drag files here — they will show in this area
                  before uploading.
                </p>
              )}

              {uploadError ? (
                <p className="mt-4 text-left text-sm text-red-400">{uploadError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {stagedFiles.length > 0
                  ? `${stagedFiles.length} file${stagedFiles.length === 1 ? "" : "s"} ready to upload.`
                  : "Add files to the queue to enable upload."}
              </p>
              <Button
                type="button"
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                disabled={uploadDisabled || stagedFiles.length === 0}
                onClick={openUploadConfirm}
              >
                Upload to session
              </Button>
            </div>
          </CardContent>
        </Card>

        <GeoCreateConfirmModal
          open={uploadConfirmOpen}
          title="Start upload?"
          description={uploadConfirmDescription}
          confirmLabel="Upload"
          cancelLabel="Cancel"
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUploadConfirm}
          isSubmitting={false}
        />

        <GeoCreateConfirmModal
          open={closeConfirmOpen}
          title="Close this session?"
          description={
            "Closing ends uploads for this session and starts building a ZIP with all completed videos and their snapshot images. You can download the archive when it is ready."
          }
          confirmLabel="Close session"
          cancelLabel="Cancel"
          onConfirm={() => void handleCloseSession()}
          onCancel={() => {
            if (!closingSession) setCloseConfirmOpen(false);
          }}
          isSubmitting={closingSession}
        />

        <StudioExportShareModal
          kind={shareModalKind}
          url={shareDisplayedUrl}
          copied={shareCopied}
          rawDaysLeft={rawDaysLeft}
          onClose={handleCloseShareModal}
          onCopyLink={() => void handleCopyShareLink()}
        />

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

          {!loading &&
          jobs.length === 0 &&
          pendingUploads.length === 0 &&
          !listError &&
          session ? (
            <p className="text-sm text-zinc-500">No videos in this session yet.</p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {pendingUploads.map((p) => (
              <li key={p.clientId}>
                <Card className="border-white/10 bg-white/[0.03]">
                  <CardContent className="flex gap-4 p-4">
                    <div
                      className={cn(
                        "relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-800",
                        p.phase === "uploading" && "animate-pulse",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                      <span className="truncate font-medium text-zinc-100" title={p.fileName}>
                        {p.fileName}
                      </span>
                      {p.phase === "uploading" ? (
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-40 max-w-full animate-pulse rounded bg-zinc-700/80" />
                          <span className="text-xs text-zinc-500">
                            Uploading to server…
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs text-red-400">{p.errorMessage ?? "Failed"}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit shrink-0 border-white/15 text-zinc-200"
                            onClick={() => removePending(p.clientId)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
            {jobs.map((job) => {
              const status = job.status ?? "completed";
              const isProcessing = status === "processing";
              const isFailed = status === "failed";
              return (
                <li key={job.jobId}>
                  <Link
                    href={`${userPathPrefix}/studio/sessions/${sessionId}/videos/${job.jobId}`}
                    className="block"
                  >
                    <Card
                      className={cn(
                        "border-white/10 bg-white/[0.03] transition-colors hover:border-primary/30 hover:shadow-sm",
                        isFailed && "hover:border-red-500/30",
                      )}
                    >
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                        <VideoThumbnailStrip
                          urls={job.thumbnailUrls ?? []}
                          isProcessing={isProcessing}
                          emptyLabel={
                            isProcessing
                              ? "Processing"
                              : isFailed
                                ? "Failed"
                                : "No preview"
                          }
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                          <span className="truncate font-medium text-zinc-100">
                            {job.originalFilename}
                          </span>
                          <span className="line-clamp-2 text-xs text-zinc-500">
                            {isProcessing
                              ? "Processing on server — safe to refresh; status is saved."
                              : isFailed
                                ? (job.errorMessage ?? "Processing failed.")
                                : new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
