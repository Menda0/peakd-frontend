"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startCartGroupCheckout } from "@/lib/commercial-cart";
import { formatMoney } from "@/lib/currencies";
import { intentLabel } from "@/lib/wave-unlock-wizard";
import {
  clearWaveUnlockCart,
  removeFromWaveUnlockCart,
  useWaveUnlockCart,
  type WaveUnlockCartGroup,
  type WaveUnlockCartGroupedLine,
} from "@/lib/wave-unlock-cart";

function CartLineRow({
  line,
  currency,
  onRemove,
}: {
  line: WaveUnlockCartGroupedLine;
  currency: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-secondary">
        {line.thumbnailUrl ? (
          <Image
            src={line.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
            Wave
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {line.videoName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {line.sessionLabel}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {intentLabel(line.intent)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">
            List:{" "}
            <span className="text-muted-foreground">
              {formatMoney(line.listPriceMinor, currency)}
            </span>
          </span>
          {line.discountPercent > 0 ? (
            <span className="text-emerald-400/90">
              {line.discountPercent}% off (−
              {formatMoney(line.discountSavedMinor, currency)})
            </span>
          ) : null}
          <span className="font-medium text-foreground">
            {formatMoney(line.totalMinor, currency)}
          </span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Remove from cart"
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

function CartGroupCard({
  group,
  submittingPartnerId,
  onCheckout,
  onRemoveLine,
}: {
  group: WaveUnlockCartGroup;
  submittingPartnerId: string | null;
  onCheckout: (group: WaveUnlockCartGroup) => void;
  onRemoveLine: (jobId: string) => void;
}) {
  const submitting = submittingPartnerId === group.partnerUserId;
  const intent = group.lines[0]?.intent ?? "buy_claim";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-white/[0.01] p-3">
      <div className="flex items-center gap-2">
        {group.partnerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.partnerAvatarUrl}
            alt=""
            className="size-7 shrink-0 rounded-full object-cover ring-1 ring-white/15"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {group.partnerName}
          </p>
          <p className="text-xs text-muted-foreground">{group.currency}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {group.lines.map((line) => (
          <CartLineRow
            key={line.jobId}
            line={line}
            currency={group.currency}
            onRemove={() => onRemoveLine(line.jobId)}
          />
        ))}
      </ul>
      <dl className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Partner total</dt>
          <dd>{formatMoney(group.partnerSubtotalMinor, group.currency)}</dd>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <dt>Platform commission</dt>
          <dd>{formatMoney(group.platformCommissionMinor, group.currency)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
          <dt>You pay</dt>
          <dd>{formatMoney(group.totalAmountMinor, group.currency)}</dd>
        </div>
      </dl>
      <Button
        type="button"
        size="sm"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={submitting || group.lines.length === 0}
        onClick={() => onCheckout(group)}
      >
        {submitting
          ? "Redirecting…"
          : `Pay ${formatMoney(group.totalAmountMinor, group.currency)} · ${intent === "sponsor" ? "Sponsor" : "Unlock"}`}
      </Button>
    </div>
  );
}

/** Cart list + per-partner checkout actions (used inside app-bar popover). */
export function WaveUnlockCartPanel({ onClose: _onClose }: { onClose?: () => void }) {
  const { groups, count, quoteLoading, refresh } = useWaveUnlockCart();
  const [submittingPartnerId, setSubmittingPartnerId] = useState<
    string | null
  >(null);

  const onCheckoutGroup = async (group: WaveUnlockCartGroup) => {
    if (group.lines.length === 0) return;
    const intent = group.lines[0]!.intent;
    if (group.lines.some((l) => l.intent !== intent)) {
      toast.error("Mixed buy/sponsor in one group — split first");
      return;
    }
    setSubmittingPartnerId(group.partnerUserId);
    try {
      const { url } = await startCartGroupCheckout({
        partnerUserId: group.partnerUserId,
        intent,
        jobIds: group.lines.map((l) => l.jobId),
      });
      window.location.href = url;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not start checkout",
      );
      setSubmittingPartnerId(null);
    }
  };

  return (
    <div className="flex max-h-[min(80dvh,640px)] w-full flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Unlock cart</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Items are grouped by partner — each group checks out in the
          partner&apos;s currency.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {count === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Your cart is empty.
          </p>
        ) : quoteLoading && groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Updating prices…
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <CartGroupCard
                key={group.partnerUserId}
                group={group}
                submittingPartnerId={submittingPartnerId}
                onCheckout={(g) => void onCheckoutGroup(g)}
                onRemoveLine={(jobId) => {
                  removeFromWaveUnlockCart(jobId);
                  refresh();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border px-4 py-3">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border bg-transparent text-foreground"
            disabled={count === 0}
            onClick={() => {
              clearWaveUnlockCart();
              refresh();
              toast.success("Cart cleared");
            }}
          >
            Clear cart
          </Button>
        </div>
      </div>
    </div>
  );
}
