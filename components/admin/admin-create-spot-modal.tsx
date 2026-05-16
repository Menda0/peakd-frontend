"use client";

import { useEffect, useId, useState } from "react";
import {
  SpotBreakTypeSelect,
  SpotConsistencySelect,
  SpotLevelMultiSelect,
} from "@/components/admin/spot-attribute-fields";
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
import {
  formatSpotLevels,
  type SpotBreakType,
  type SpotConsistency,
  type SpotLevelId,
} from "@/lib/spot-attributes";

export type AdminCreateSpotInput = {
  name: string;
  level: string | null;
  breakType: string | null;
  consistency: string | null;
  verified: boolean;
};

const emptyForm = () => ({
  name: "",
  levels: [] as SpotLevelId[],
  breakType: "" as SpotBreakType | "",
  consistency: "" as SpotConsistency | "",
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
  const levelId = useId();
  const breakId = useId();
  const consistencyId = useId();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setForm(emptyForm()));
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onCreate({
      name: form.name.trim(),
      level: formatSpotLevels(form.levels),
      breakType: form.breakType || null,
      consistency: form.consistency || null,
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
          <FormField label="Name" htmlFor={nameId}>
            <Input
              id={nameId}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Spot name"
              disabled={isSubmitting}
              className={formInputClassName}
              autoFocus
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Level" htmlFor={levelId}>
              <SpotLevelMultiSelect
                id={levelId}
                value={form.levels}
                onChange={(levels) => setForm((f) => ({ ...f, levels }))}
                disabled={isSubmitting}
              />
            </FormField>
            <SpotBreakTypeSelect
              id={breakId}
              value={form.breakType}
              onChange={(breakType) => setForm((f) => ({ ...f, breakType }))}
              disabled={isSubmitting}
            />
            <SpotConsistencySelect
              id={consistencyId}
              value={form.consistency}
              onChange={(consistency) => setForm((f) => ({ ...f, consistency }))}
              disabled={isSubmitting}
              className="sm:col-span-2"
            />
          </div>
          <FormCheckboxField
            label="Verified"
            checked={form.verified}
            onCheckedChange={(verified) => setForm((f) => ({ ...f, verified }))}
            disabled={isSubmitting}
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
