"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { useUserProfileModal } from "@/components/user-profile/user-profile-provider";
import {
  StudioSessionFormFields,
  validateStudioSessionFormValues,
  type StudioSessionFormValues,
} from "@/components/studio/studio-session-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PERSONAL_UPLOAD_EVENT } from "@/lib/discover-feed";
import { initialStudioSessionFormValuesFromProfile } from "@/lib/studio-session-form-defaults";
import { uploadPersonalVideos } from "@/lib/personal-upload";
import { cn } from "@/lib/utils";

function isProbablyVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|wmv)$/i.test(file.name);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadVideoModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile } = useUserProfileModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<StudioSessionFormValues>(() =>
    initialStudioSessionFormValuesFromProfile(profile),
  );
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setValues(initialStudioSessionFormValuesFromProfile(profile));
    setVideoFiles([]);
    setDragActive(false);
    setError(null);
  }, [profile]);

  useEffect(() => {
    if (open) {
      setValues(initialStudioSessionFormValuesFromProfile(profile));
      setVideoFiles([]);
      setError(null);
    }
  }, [open, profile]);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const patchValues = (patch: Partial<StudioSessionFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter(isProbablyVideoFile);
    if (list.length === 0) {
      setError("Choose one or more video files.");
      return;
    }
    setError(null);
    setVideoFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const f of list) {
        const key = f.name + f.size;
        if (!names.has(key)) {
          names.add(key);
          merged.push(f);
        }
      }
      return merged;
    });
  };

  const removeFile = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const validationError = validateStudioSessionFormValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (videoFiles.length === 0) {
      setError("Add at least one video file.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await uploadPersonalVideos(values, videoFiles);
      reset();
      onOpenChange(false);
      window.dispatchEvent(
        new CustomEvent(PERSONAL_UPLOAD_EVENT, {
          detail: { jobIds: result.jobs.map((j) => j.jobId) },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={submitting}
    >
      <DialogContent
        showCloseButton={!submitting}
        className={cn(
          "flex max-h-[min(92dvh,800px)] w-full max-w-lg flex-col gap-0 overflow-hidden",
          "border-white/10 bg-[#0a1218] p-0 text-zinc-100 ring-white/10 sm:max-w-lg",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-white/10 px-6 pt-6 pb-4 text-left">
          <DialogTitle className="text-lg font-semibold text-zinc-100">
            Upload video
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Add your surf video to the feed. Session details are prefilled from your
            profile when available.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-200">Videos</p>
            <div
              className={cn(
                "rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragActive
                  ? "border-primary/50 bg-white/5"
                  : "border-white/15 bg-zinc-900/30",
                submitting && "pointer-events-none opacity-60",
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
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length) {
                  addFiles(e.dataTransfer.files);
                }
              }}
            >
              <UploadIcon className="mx-auto size-8 text-zinc-500" aria-hidden />
              <p className="mt-2 text-sm text-zinc-300">Drop videos here or browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.mpeg,.mpg,.wmv"
                multiple
                className="sr-only"
                disabled={submitting}
                onChange={(e) => {
                  if (e.target.files?.length) {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </Button>
            </div>

            {videoFiles.length > 0 ? (
              <ul className="space-y-2">
                {videoFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-sm text-zinc-100"
                      title={file.name}
                    >
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
                      disabled={submitting}
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-500">Add one or more video files to upload.</p>
            )}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-6">
            <p className="text-sm font-medium text-zinc-200">Session details</p>
            <StudioSessionFormFields
              values={values}
              onChange={patchValues}
              idPrefix="upload"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col items-stretch gap-3 border-t border-white/10 bg-[#0a1218] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-none">
          {error ? (
            <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">{error}</p>
          ) : (
            <span className="hidden sm:block sm:flex-1" aria-hidden />
          )}
          <div className="flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-zinc-200"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={submitting || videoFiles.length === 0}
              onClick={() => void submit()}
            >
              {submitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  <span className="ml-2">Uploading…</span>
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
