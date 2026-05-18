"use client";

import { useState } from "react";
import { GeoCreateConfirmModal } from "@/components/pickers/geo-create-confirm-modal";
import { Button } from "@/components/ui/button";
import {
  claimWave,
  dispatchWaveClaimedEvent,
} from "@/lib/claim-wave";
import type { SurferProfile } from "@/lib/surfer-profile";

export function ClaimWaveButton({
  jobId,
  partnerName,
  location,
  isOwnUpload,
  onClaimed,
}: {
  jobId: string;
  partnerName: string;
  location: string;
  isOwnUpload?: boolean;
  onClaimed: (surfer: SurferProfile) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { surfer } = await claimWave(jobId);
      dispatchWaveClaimedEvent();
      setConfirmOpen(false);
      onClaimed(surfer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to claim wave");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        Claim this wave
      </Button>
      <GeoCreateConfirmModal
        open={confirmOpen}
        title="Claim this wave?"
        description={
          isOwnUpload ? (
            <>
              This clip at {location} will be added to your videos as-is. You will appear
              as the surfer on this wave.
            </>
          ) : (
            <>
              This partner upload from {partnerName} at {location} will be added to your
              videos as-is. You will appear as the surfer on this wave.
            </>
          )
        }
        confirmLabel="Claim wave"
        cancelLabel="Cancel"
        isSubmitting={submitting}
        error={error}
        onConfirm={() => void handleConfirm()}
        onCancel={() => {
          if (!submitting) {
            setConfirmOpen(false);
            setError(null);
          }
        }}
      />
    </>
  );
}
