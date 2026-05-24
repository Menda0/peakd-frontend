"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getApiBase } from "@/lib/api";
import {
  initialStudioSessionFormValues,
  normalizeCountryCode,
} from "@/lib/studio-session-form-defaults";
import type { CommercialSettings } from "@/lib/commercial-settings";
import type { WaveTypeId } from "@/lib/surf-session-waves";
import {
  buildNewSessionWizardSteps,
  validateWizardStep,
  WIZARD_STEP_META,
  type NewSessionWizardStepId,
} from "@/lib/studio-new-session-wizard";
import {
  StudioSessionCommercialPricingFields,
  StudioSessionConditionsFields,
  StudioSessionRegionDateFields,
  type StudioSessionFormValues,
} from "@/components/studio/studio-session-form-fields";
import {
  StudioSessionModeChoice,
  type StudioSessionMode,
} from "@/components/studio/studio-session-mode-choice";
import { StudioNewSessionSummary } from "@/components/studio/studio-new-session-summary";
import { cn } from "@/lib/utils";

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

function WizardProgress({
  steps,
  stepIndex,
}: {
  steps: NewSessionWizardStepId[];
  stepIndex: number;
}) {
  return (
    <nav
      className="flex gap-1.5"
      aria-label={`Step ${stepIndex + 1} of ${steps.length}`}
    >
      {steps.map((id, i) => (
        <div
          key={id}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= stepIndex ? "bg-primary" : "bg-muted",
          )}
          title={WIZARD_STEP_META[id].title}
        />
      ))}
    </nav>
  );
}

export function StudioNewSessionDialog({
  open,
  onOpenChange,
  onCreated,
  defaultCountryCode = null,
  showCommercialFields = false,
  partnerCommercialDefaults = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (sessionId: string) => void;
  defaultCountryCode?: string | null;
  showCommercialFields?: boolean;
  partnerCommercialDefaults?: CommercialSettings | null;
}) {
  const countryCode = normalizeCountryCode(defaultCountryCode);
  const showTypeStep = showCommercialFields;

  const [values, setValues] = useState<StudioSessionFormValues>(() =>
    initialStudioSessionFormValues({ countryCode }),
  );
  const [sessionMode, setSessionMode] = useState<StudioSessionMode | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(
    () => buildNewSessionWizardSteps(showTypeStep, values.isCommercial === true),
    [showTypeStep, values.isCommercial],
  );

  const currentStep = steps[stepIndex] ?? steps[0];
  const stepMeta = WIZARD_STEP_META[currentStep];
  const isSummary = currentStep === "summary";
  const isFirst = stepIndex === 0;

  const reset = useCallback(() => {
    setValues(initialStudioSessionFormValues({ countryCode }));
    setSessionMode(null);
    setStepIndex(0);
    setError(null);
  }, [countryCode]);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const patchValues = (patch: Partial<StudioSessionFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const applyModeToValues = (mode: StudioSessionMode) => {
    setValues((prev) => ({
      ...prev,
      isCommercial: mode === "commercial",
      customizeCommercialPricing: false,
      commercialSettings: null,
    }));
  };

  const goNext = () => {
    const err = validateWizardStep(
      currentStep,
      values,
      sessionMode,
      showTypeStep,
      partnerCommercialDefaults,
    );
    if (err) {
      setError(err);
      return;
    }
    if (currentStep === "type" && sessionMode) {
      applyModeToValues(sessionMode);
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const submit = async () => {
    const err = validateWizardStep(
      "summary",
      values,
      sessionMode,
      showTypeStep,
      partnerCommercialDefaults,
    );
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/studio/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: values.countryCode,
          regionId: values.regionId,
          spotId: values.spotId,
          sessionDate: values.sessionDate,
          sessionTime: values.sessionTime,
          durationMinutes: values.durationMinutes,
          conditionsRating: values.conditionsRating,
          waveTypes: values.waveTypes as WaveTypeId[],
          ...commercialFieldsForApi(values),
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text().catch(() => res.statusText));
      }
      const data = (await res.json()) as { sessionId: string };
      if (!data.sessionId) {
        throw new Error("Invalid response");
      }
      toast.success("Session created");
      close();
      onCreated(data.sessionId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create session";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-title"
        className="flex max-h-[min(90dvh,720px)] w-full max-w-3xl flex-col gap-0 overflow-hidden border-border bg-popover py-0 text-foreground ring-white/10"
      >
        <CardHeader className="shrink-0 space-y-3 border-b border-border px-6 pt-6 pb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <CardTitle id="new-session-title">{stepMeta.title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {stepMeta.description}
            </CardDescription>
          </div>
          <WizardProgress steps={steps} stepIndex={stepIndex} />
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {currentStep === "type" ? (
            <StudioSessionModeChoice
              value={sessionMode}
              onChange={(mode) => {
                setSessionMode(mode);
                applyModeToValues(mode);
              }}
            />
          ) : null}
          {currentStep === "region-date" ? (
            <StudioSessionRegionDateFields
              values={values}
              onChange={patchValues}
              idPrefix="new-session"
            />
          ) : null}
          {currentStep === "conditions" ? (
            <StudioSessionConditionsFields
              values={values}
              onChange={patchValues}
              idPrefix="new-session"
            />
          ) : null}
          {currentStep === "commercial" ? (
            <StudioSessionCommercialPricingFields
              values={values}
              onChange={patchValues}
              idPrefix="new-session"
              partnerCommercialDefaults={partnerCommercialDefaults}
            />
          ) : null}
          {currentStep === "summary" ? (
            <StudioNewSessionSummary
              values={values}
              sessionMode={sessionMode}
              showTypeStep={showTypeStep}
              partnerCommercialDefaults={partnerCommercialDefaults}
            />
          ) : null}
        </CardContent>

        <CardFooter className="shrink-0 flex-col items-stretch gap-3 border-border bg-popover px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <p className="text-sm text-red-400 sm:min-w-0 sm:flex-1 sm:pr-4">{error}</p>
          ) : (
            <span className="hidden sm:block sm:flex-1" aria-hidden />
          )}
          <div className="flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent text-foreground"
              disabled={submitting}
              onClick={close}
            >
              Cancel
            </Button>
            {!isFirst ? (
              <Button
                type="button"
                variant="outline"
                className="border-border bg-transparent text-foreground"
                disabled={submitting}
                onClick={goBack}
              >
                Back
              </Button>
            ) : null}
            {isSummary ? (
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={submitting}
                onClick={() => void submit()}
              >
                {submitting ? "Creating…" : "Create session"}
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={goNext}
              >
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
