"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { readApiErrorMessage } from "@/lib/api-error";
import { getApiBase } from "@/lib/api";
import { FormattedDateTime } from "@/components/ui/formatted-datetime";
import { publishVideoToDiscover } from "@/lib/discover-feed";
import {
  formatSessionPublishedAt,
  isSessionPublished,
} from "@/lib/surf-session-status";
import {
  absoluteSharedSessionUrl,
  ensureSessionShareToken,
} from "@/lib/shared-session";
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
import {
  DEFAULT_COMMERCIAL_SETTINGS,
  normalizeCommercialSettings,
  type CommercialSettings,
} from "@/lib/commercial-settings";
import { normalizePartnerProfileDto } from "@/lib/partner-profile";
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
import { ChevronDown, Copy, Download, Loader2, Share2, Trash2 } from "lucide-react";

type ExportKind = "processed" | "raw";

/** Same-origin path proxied by `/api/peakd/*` (streams ZIP from API; not S3 URLs). */
function sessionExportPath(sessionId: string, kind: ExportKind): string {
  const branch =
    kind === "processed" ? "export/download" : "export/raw/download";
  return `/studio/sessions/${sessionId}/${branch}`;
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

function SessionShareModal({
  open,
  url,
  copied,
  shareError,
  loading,
  onClose,
  onCopyLink,
}: {
  open: boolean;
  url: string;
  copied: boolean;
  shareError: string | null;
  loading: boolean;
  onClose: () => void;
  onCopyLink: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg border-border bg-popover text-foreground">
        <CardHeader>
          <CardTitle className="text-lg">Share session</CardTitle>
          <CardDescription className="text-muted-foreground">
            Anyone with this link can view all waves in this session — no Peakd
            account required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 border-t border-border pt-4">
          {shareError ? (
            <p className="text-sm text-red-400">{shareError}</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <Input
              readOnly
              value={loading ? "Preparing link…" : url}
              className="border-border bg-black/30 font-mono text-xs text-foreground"
              aria-label="Share link"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-border bg-transparent text-foreground sm:w-auto"
              disabled={loading || !url}
              onClick={onCopyLink}
            >
              <Copy className="size-4" aria-hidden />
              <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          {copied ? (
            <p className="text-xs text-emerald-400">Link copied to clipboard.</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end border-border bg-transparent py-4">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent text-foreground"
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
  shareToken?: string | null;
  isCommercial?: boolean;
  commercialSettings?: CommercialSettings | null;
  effectiveCommercialSettings?: CommercialSettings | null;
};

function sessionToFormValues(session: SessionDetail): StudioSessionFormValues {
  const sessionCommercial = normalizeCommercialSettings(session.commercialSettings);
  return {
    countryCode: session.countryCode,
    regionId: session.regionId,
    spotId: session.spotId,
    sessionDate: session.sessionDate,
    sessionTime: session.sessionTime ?? "12:00",
    durationMinutes: session.durationMinutes ?? 120,
    conditionsRating: session.conditionsRating,
    waveTypes: (session.waveTypes ?? []) as WaveTypeId[],
    isCommercial: session.isCommercial === true,
    customizeCommercialPricing: Boolean(sessionCommercial),
    commercialSettings: sessionCommercial ?? DEFAULT_COMMERCIAL_SETTINGS,
  };
}

function commercialFieldsForApi(values: StudioSessionFormValues): {
  isCommercial?: boolean;
  commercialSettings?: CommercialSettings | null;
} {
  if (!values.isCommercial) {
    return { isCommercial: false, commercialSettings: null };
  }
  return {
    isCommercial: true,
    commercialSettings: values.customizeCommercialPricing
      ? values.commercialSettings ?? null
      : null,
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
  discoverPublishedAt?: string | null;
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
  "min-w-[260px] border border-border bg-popover p-1 text-foreground shadow-lg ring-1 ring-white/10";

function SessionActionsBar({
  session,
  hasProcessingJob,
  sessionIsPublished,
  showExportActions,
  exportProcessing,
  exportReady,
  exportFailed,
  rawExportProcessing,
  rawExportReady,
  rawExportFailed,
  rawDaysLeft,
  anyExportProcessing,
  publishingSession,
  sessionPublishError,
  downloadError,
  rawDownloadError,
  onPublishClick,
  onEditClick,
  onDownloadPick,
  shareDisabled,
  sharingSession,
  onShareClick,
}: {
  session: SessionDetail;
  hasProcessingJob: boolean;
  sessionIsPublished: boolean;
  showExportActions: boolean;
  exportProcessing: boolean;
  exportReady: boolean;
  exportFailed: boolean;
  rawExportProcessing: boolean;
  rawExportReady: boolean;
  rawExportFailed: boolean;
  rawDaysLeft: number;
  anyExportProcessing: boolean;
  publishingSession: boolean;
  sessionPublishError: string | null;
  downloadError: string | null;
  rawDownloadError: string | null;
  onPublishClick: () => void;
  onEditClick: () => void;
  onDownloadPick: (kind: ExportKind) => void;
  shareDisabled: boolean;
  sharingSession: boolean;
  onShareClick: () => void;
}) {
  const processedDownloadDisabled =
    !exportReady || exportProcessing;
  const rawDownloadDisabled =
    !rawExportReady ||
    rawExportProcessing ||
    rawDaysLeft <= 0;

  const downloadTriggerLabel = anyExportProcessing
    ? "Preparing exports…"
    : "Download";

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {showExportActions || sessionIsPublished ? (
          <div className="flex flex-wrap items-center gap-2 sm:mr-auto">
            {showExportActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-border bg-transparent text-foreground data-popup-open:bg-muted",
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
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-accent"
                  onClick={() => onDownloadPick("processed")}
                >
                  <span className="font-medium text-foreground">Processed</span>
                  <span className="text-xs text-muted-foreground">
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
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-accent"
                  onClick={() => onDownloadPick("raw")}
                >
                  <span className="font-medium text-foreground">Raw originals</span>
                  <span className="text-xs text-muted-foreground">
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
            ) : null}

            {sessionIsPublished ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border bg-transparent text-foreground"
                disabled={shareDisabled || sharingSession}
                title={
                  shareDisabled
                    ? hasProcessingJob
                      ? "Wait until all waves finish processing."
                      : "Add at least one completed wave to share."
                    : undefined
                }
                onClick={onShareClick}
              >
                {sharingSession ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Share2 className="size-4 shrink-0" aria-hidden />
                )}
                <span className="ml-2">Share</span>
              </Button>
            ) : null}
          </div>
        ) : null}
        {!sessionIsPublished ? (
          <>
            <span
              title={
                hasProcessingJob
                  ? "Wait until all videos finish processing before publishing this session."
                  : undefined
              }
              className="inline-flex"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border bg-transparent text-foreground"
                disabled={hasProcessingJob || publishingSession}
                onClick={onPublishClick}
              >
                {publishingSession ? "Publishing…" : "Publish session"}
              </Button>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border bg-transparent text-foreground"
              onClick={onEditClick}
            >
              Edit session
            </Button>
          </>
        ) : null}
      </div>
      {sessionPublishError ? (
        <p className="text-sm text-red-400">{sessionPublishError}</p>
      ) : null}
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
      {sessionIsPublished ? (
        <p className="text-xs text-muted-foreground">
          This session is published. Uploads are disabled.
          {formatSessionPublishedAt(session.closedAt)}
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
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishingSession, setPublishingSession] = useState(false);
  const [sessionPublishError, setSessionPublishError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [rawDownloadError, setRawDownloadError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharingSession, setSharingSession] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [publishingJobId, setPublishingJobId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [removeConfirmJobId, setRemoveConfirmJobId] = useState<string | null>(null);
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);

  const isPartner = (user as { isPartner?: boolean } | undefined)?.isPartner === true;
  const [partnerCommercialDefaults, setPartnerCommercialDefaults] =
    useState<CommercialSettings | null>(null);

  useEffect(() => {
    if (!isPartner) return;
    void (async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/partners/me`, { credentials: "include" });
        if (!res.ok) return;
        const dto = normalizePartnerProfileDto(await res.json());
        setPartnerCommercialDefaults(dto?.commercialSettings ?? null);
      } catch {
        /* ignore */
      }
    })();
  }, [isPartner]);

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
        shareToken: data.shareToken ?? null,
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
  const completedJobCount = jobs.filter(
    (j) => (j.status ?? "completed") === "completed",
  ).length;
  const sessionIsPublished = isSessionPublished(session?.status);
  const shareDisabled =
    !sessionIsPublished || hasProcessingJob || completedJobCount < 1;
  const exportProcessing = session?.exportStatus === "processing";
  const exportReady = session?.exportStatus === "ready";
  const exportFailed = session?.exportStatus === "failed";
  const rawExportProcessing = session?.rawExportStatus === "processing";
  const rawExportReady = session?.rawExportStatus === "ready";
  const rawExportFailed = session?.rawExportStatus === "failed";
  const rawDaysLeft = rawDaysRemaining(session?.rawExportExpiresAt);
  const anyExportProcessing = exportProcessing || rawExportProcessing;
  const showExportActions =
    sessionIsPublished ||
    (session?.exportStatus != null && session.exportStatus !== "idle") ||
    (session?.rawExportStatus != null && session.rawExportStatus !== "idle");
  const uploadDisabled =
    !!sessionError || loading || !session || editing || sessionIsPublished;

  const handlePublishToDiscover = useCallback(
    async (jobId: string) => {
      setPublishError(null);
      setPublishingJobId(jobId);
      try {
        await publishVideoToDiscover(jobId);
        await loadJobs();
      } catch (e) {
        setPublishError(e instanceof Error ? e.message : "Failed to publish");
      } finally {
        setPublishingJobId(null);
      }
    },
    [loadJobs],
  );

  const handleRemoveVideo = useCallback(
    async (jobId: string) => {
      setRemovingJobId(jobId);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/videos/${jobId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(
            await readApiErrorMessage(res, "Failed to remove video"),
          );
        }
        setRemoveConfirmJobId(null);
        toast.success("Video removed");
        await loadJobs();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to remove video";
        toast.error(message);
      } finally {
        setRemovingJobId(null);
      }
    },
    [loadJobs],
  );

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
    setShareModalOpen(false);
    setShareError(null);
    setShareCopied(false);
    if (shareCopyResetRef.current) {
      clearTimeout(shareCopyResetRef.current);
      shareCopyResetRef.current = null;
    }
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
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
  }, [shareUrl]);

  const handleShareClick = useCallback(async () => {
    if (!sessionId || shareDisabled) return;
    setShareCopied(false);
    setShareError(null);
    setShareModalOpen(true);
    setSharingSession(true);
    setShareUrl("");
    try {
      let token =
        typeof session?.shareToken === "string" && session.shareToken.trim()
          ? session.shareToken.trim()
          : null;
      if (!token) {
        token = await ensureSessionShareToken(sessionId);
        setSession((prev) =>
          prev ? { ...prev, shareToken: token } : prev,
        );
      }
      const url = absoluteSharedSessionUrl(window.location.origin, token);
      setShareUrl(url);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "Failed to create share link");
    } finally {
      setSharingSession(false);
    }
  }, [sessionId, shareDisabled, session?.shareToken]);

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

  const handlePublishSession = useCallback(async () => {
    if (!sessionId) return;
    setSessionPublishError(null);
    setPublishingSession(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/sessions/${sessionId}/close`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(
          await readApiErrorMessage(res, "Failed to publish session"),
        );
      }
      setPublishConfirmOpen(false);
      toast.success("Session published");
      await loadSession();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to publish session";
      setSessionPublishError(message);
      toast.error(message);
    } finally {
      setPublishingSession(false);
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
    return <div className="text-sm text-muted-foreground">Loading workspace…</div>;
  }

  if (!sessionId) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        This session link is invalid.
      </p>
    );
  }

  return (
    <div className="text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="mb-2 -ml-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            render={<Link href={`${userPathPrefix}/studio`} />}
          >
            ← Back to Studio
          </Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

        {sessionError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {sessionError}
          </p>
        ) : null}

        {session && !sessionError ? (
          <section className="space-y-4">
            {editing && editValues ? (
              <Card className="border-border bg-card text-foreground">
                <CardHeader>
                  <CardTitle>Edit session</CardTitle>
                  <CardDescription className="text-muted-foreground">
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
                    showCommercialFields={isPartner}
                    partnerCommercialDefaults={partnerCommercialDefaults}
                  />
                  {editError ? (
                    <p className="text-sm text-red-400">{editError}</p>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border bg-transparent text-foreground"
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
                                ...commercialFieldsForApi(editValues),
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
                          toast.success("Session saved");
                        } catch (e) {
                          const message =
                            e instanceof Error ? e.message : "Failed to save session";
                          setEditError(message);
                          toast.error(message);
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
                  sessionIsPublished={sessionIsPublished}
                  showExportActions={showExportActions}
                  exportProcessing={exportProcessing}
                  exportReady={exportReady}
                  exportFailed={exportFailed}
                  rawExportProcessing={rawExportProcessing}
                  rawExportReady={rawExportReady}
                  rawExportFailed={rawExportFailed}
                  rawDaysLeft={rawDaysLeft}
                  anyExportProcessing={anyExportProcessing}
                  publishingSession={publishingSession}
                  sessionPublishError={sessionPublishError}
                  downloadError={downloadError}
                  rawDownloadError={rawDownloadError}
                  onPublishClick={() => {
                    setSessionPublishError(null);
                    setPublishConfirmOpen(true);
                  }}
                  onEditClick={() => {
                    setEditValues(sessionToFormValues(session));
                    setEditError(null);
                    setEditing(true);
                  }}
                  onDownloadPick={handleDownloadPick}
                  shareDisabled={shareDisabled}
                  sharingSession={sharingSession}
                  onShareClick={() => void handleShareClick()}
                />
                <SessionSummaryCard
                  session={session}
                  previewSlotCount={SESSION_PREVIEW_SLOTS_DETAIL}
                />
              </div>
            )}
          </section>
        ) : null}

        <Card className="border-border bg-card text-foreground">
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription className="text-muted-foreground">
              {sessionIsPublished
                ? "This session is published. You can't add more videos."
                : (
                    <>
                      Import videos into the queue below, then use{" "}
                      <span className="text-muted-foreground">Upload to session</span> to start. You will be
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
                  ? "border-border bg-secondary/20 opacity-60"
                  : dragActive
                    ? "border-primary/50 bg-muted/50"
                    : "border-border bg-secondary/30",
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
              <p className="text-sm font-medium text-foreground">
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
                className="mt-4 border-border bg-muted/50 text-foreground hover:bg-accent"
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
                      className="flex items-center gap-3 rounded-lg border border-border bg-black/25 px-3 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={file.name}>
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-muted-foreground hover:text-foreground"
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
                <p className="mt-6 text-xs text-muted-foreground">
                  No files in the queue yet. Use Import or drag files here — they will show in this area
                  before uploading.
                </p>
              )}

              {uploadError ? (
                <p className="mt-4 text-left text-sm text-red-400">{uploadError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
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
          open={removeConfirmJobId != null}
          title="Remove this video?"
          description="This deletes the wave from the session and removes its files from storage. This cannot be undone."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={() => {
            if (removeConfirmJobId) void handleRemoveVideo(removeConfirmJobId);
          }}
          onCancel={() => {
            if (!removingJobId) setRemoveConfirmJobId(null);
          }}
          isSubmitting={removingJobId != null}
        />

        <GeoCreateConfirmModal
          open={publishConfirmOpen}
          title="Publish this session?"
          description={
            "Publishing ends uploads for this session and starts building a ZIP with all completed videos and their snapshot images. You can download the archive when it is ready."
          }
          confirmLabel="Publish session"
          cancelLabel="Cancel"
          onConfirm={() => void handlePublishSession()}
          onCancel={() => {
            if (!publishingSession) setPublishConfirmOpen(false);
          }}
          isSubmitting={publishingSession}
        />

        <SessionShareModal
          open={shareModalOpen}
          url={shareUrl}
          copied={shareCopied}
          shareError={shareError}
          loading={sharingSession}
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
              className="border-border bg-transparent text-foreground hover:bg-accent"
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

          {publishError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {publishError}
            </p>
          ) : null}

          {!loading &&
          jobs.length === 0 &&
          pendingUploads.length === 0 &&
          !listError &&
          session ? (
            <p className="text-sm text-muted-foreground">No videos in this session yet.</p>
          ) : null}

          <ul className="flex flex-col gap-3">
            {pendingUploads.map((p) => (
              <li key={p.clientId}>
                <Card className="border-border bg-card">
                  <CardContent className="flex gap-4 p-4">
                    <div
                      className={cn(
                        "relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted",
                        p.phase === "uploading" && "animate-pulse",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                      <span className="truncate font-medium text-foreground" title={p.fileName}>
                        {p.fileName}
                      </span>
                      {p.phase === "uploading" ? (
                        <div className="space-y-1.5">
                          <div className="h-2.5 w-40 max-w-full animate-pulse rounded bg-zinc-700/80" />
                          <span className="text-xs text-muted-foreground">
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
                            className="w-fit shrink-0 border-border text-foreground"
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
              const isCompleted = status === "completed";
              const isPublished = Boolean(job.discoverPublishedAt);
              const showPublishButton =
                sessionIsPublished &&
                !isPartner &&
                isCompleted &&
                !isPublished;
              return (
                <li key={job.jobId}>
                  <Card
                    className={cn(
                      "border-border bg-card",
                      isFailed && "border-red-500/20",
                    )}
                  >
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <Link
                        href={`${userPathPrefix}/studio/sessions/${sessionId}/videos/${job.jobId}`}
                        className="flex min-w-0 flex-1 flex-col gap-4 transition-colors hover:opacity-90 sm:flex-row sm:items-center"
                      >
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
                          <span className="truncate font-medium text-foreground">
                            {job.originalFilename}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {isProcessing
                              ? "Processing on server — safe to refresh; status is saved."
                              : isFailed
                                ? (job.errorMessage ?? "Processing failed.")
                                : isPublished ? (
                                  <>
                                    On discover feed ·{" "}
                                    <FormattedDateTime value={job.createdAt} />
                                  </>
                                ) : (
                                  <FormattedDateTime value={job.createdAt} />
                                )}
                          </span>
                        </div>
                      </Link>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                        {!sessionIsPublished ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                            disabled={removingJobId === job.jobId}
                            onClick={() => setRemoveConfirmJobId(job.jobId)}
                          >
                            {removingJobId === job.jobId ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="size-4" aria-hidden />
                            )}
                            <span className="ml-2">Remove</span>
                          </Button>
                        ) : null}
                        {showPublishButton ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground"
                            disabled={publishingJobId === job.jobId}
                            onClick={() => void handlePublishToDiscover(job.jobId)}
                          >
                            {publishingJobId === job.jobId ? (
                              <>
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                <span className="ml-2">Publishing…</span>
                              </>
                            ) : (
                              "Publish to discover"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
