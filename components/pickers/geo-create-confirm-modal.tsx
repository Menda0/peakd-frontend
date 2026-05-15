"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GeoCreateConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Create",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isSubmitting,
  error,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <Card className="w-full max-w-md border-white/10 bg-[#0a1218] text-zinc-100">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="whitespace-pre-wrap text-zinc-400">{description}</CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="pt-0">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        ) : null}
        <CardFooter className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-zinc-200"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="bg-[#26c2c9] text-[#040A10] hover:bg-[#2dd4dc]"
            disabled={isSubmitting}
            onClick={() => onConfirm()}
          >
            {isSubmitting ? "Please wait…" : confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
