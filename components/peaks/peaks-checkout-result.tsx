"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { PeakIcon } from "@/components/peaks/peak-icon";
import { PEAKS_BALANCE_REFRESH_EVENT } from "@/lib/billing";

export function PeaksCheckoutResult({
  status,
  homeHref,
}: {
  status: "success" | "cancel" | null;
  homeHref: string;
}) {
  useEffect(() => {
    if (status === "success") {
      window.dispatchEvent(new Event(PEAKS_BALANCE_REFRESH_EVENT));
    }
  }, [status]);

  if (!status) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <PeakIcon size={48} className="mx-auto size-12" />
        <h1 className="text-xl font-semibold text-foreground">Peaks</h1>
        <p className="text-sm text-muted-foreground">
          Use the peaks balance in the top bar to buy packs and top up your wallet.
        </p>
        <Link
          href={homeHref}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  const success = status === "success";

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      {success ? (
        <CheckCircle2Icon className="mx-auto size-12 text-emerald-400" aria-hidden />
      ) : (
        <XCircleIcon className="mx-auto size-12 text-muted-foreground" aria-hidden />
      )}
      <h1 className="text-xl font-semibold text-foreground">
        {success ? "Payment successful" : "Checkout cancelled"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {success
          ? "Your peaks will appear in your balance shortly once payment is confirmed."
          : "No charge was made. You can try again from the top bar."}
      </p>
      <Link
        href={homeHref}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#26c2c9] px-4 text-sm font-medium text-[#040A10] transition hover:bg-[#2dd4dc]"
      >
        Back to feed
      </Link>
    </div>
  );
}
