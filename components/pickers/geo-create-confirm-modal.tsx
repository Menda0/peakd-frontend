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
      <Card className="w-full max-w-md border-border bg-popover text-foreground">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="whitespace-pre-wrap text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        {error ? (
          <CardContent className="pt-0">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        ) : null}
        <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent text-foreground"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
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
