"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminCreateSpotInput = {
  name: string;
  level: string | null;
  breakType: string | null;
  consistency: string | null;
  verified: boolean;
};

const emptyForm = () => ({
  name: "",
  level: "",
  breakType: "",
  consistency: "",
  verified: false,
});

export function AdminCreateSpotModal({
  open,
  regionName,
  onClose,
  onCreate,
  isSubmitting,
  error,
}: {
  open: boolean;
  regionName: string;
  onClose: () => void;
  onCreate: (input: AdminCreateSpotInput) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const nameId = useId();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setForm(emptyForm()));
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onCreate({
      name: form.name.trim(),
      level: form.level.trim() || null,
      breakType: form.breakType.trim() || null,
      consistency: form.consistency.trim() || null,
      verified: form.verified,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <Card className="w-full max-w-lg border-white/10 bg-[#0a1218] text-zinc-100">
        <CardHeader>
          <CardTitle className="text-lg">Add spot</CardTitle>
          <CardDescription className="text-zinc-400">
            Create a new surf spot in {regionName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-400" htmlFor={nameId}>
              Name
            </label>
            <Input
              id={nameId}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Spot name"
              disabled={isSubmitting}
              className="border-white/15 bg-white/5 text-zinc-100"
              autoFocus
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Level</label>
              <Input
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                placeholder="e.g. Intermediate"
                disabled={isSubmitting}
                className="border-white/15 bg-white/5 text-zinc-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Break type</label>
              <Input
                value={form.breakType}
                onChange={(e) => setForm((f) => ({ ...f, breakType: e.target.value }))}
                placeholder="e.g. Beach break"
                disabled={isSubmitting}
                className="border-white/15 bg-white/5 text-zinc-100"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm text-zinc-400">Consistency</label>
              <Input
                value={form.consistency}
                onChange={(e) => setForm((f) => ({ ...f, consistency: e.target.value }))}
                placeholder="e.g. High"
                disabled={isSubmitting}
                className="border-white/15 bg-white/5 text-zinc-100"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
              disabled={isSubmitting}
              className="rounded border-white/20"
            />
            Verified
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-white/15 bg-transparent text-zinc-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!form.name.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create spot"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
