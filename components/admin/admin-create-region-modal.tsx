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
import { FormCheckboxField, FormField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { formInputClassName } from "@/lib/form-styles";

export function AdminCreateRegionModal({
  open,
  countryCode,
  onClose,
  onCreate,
  isSubmitting,
  error,
}: {
  open: boolean;
  countryCode: string | null;
  onClose: () => void;
  onCreate: (input: { name: string; verified: boolean }) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const nameId = useId();
  const [name, setName] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setName("");
      setVerified(false);
    });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <Card className="w-full max-w-md border-white/10 bg-[#0a1218] text-zinc-100">
        <CardHeader>
          <CardTitle className="text-lg">Add region</CardTitle>
          <CardDescription className="text-zinc-400">
            {countryCode
              ? `Create a new region in ${countryCode}.`
              : "Select a country before adding a region."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Name" htmlFor={nameId}>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ericeira"
              disabled={!countryCode || isSubmitting}
              className={formInputClassName}
              autoFocus
            />
          </FormField>
          <FormCheckboxField
            label="Verified"
            checked={verified}
            onCheckedChange={setVerified}
            disabled={!countryCode || isSubmitting}
          />
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
            onClick={() => onCreate({ name: name.trim(), verified })}
            disabled={!countryCode || !name.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create region"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
