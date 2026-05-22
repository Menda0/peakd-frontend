"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RemoveFromCartDialog({
  open,
  onOpenChange,
  videoName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoName: string;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const close = () => onOpenChange(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-cart-title"
        className="w-full max-w-sm border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
      >
        <CardHeader className="pb-2">
          <CardTitle id="remove-cart-title" className="text-lg">
            Remove from cart?
          </CardTitle>
          <CardDescription className="text-zinc-500">
            <span className="font-medium text-zinc-300">{videoName}</span> will be
            removed from your unlock cart. You can add it again later.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-zinc-200"
            onClick={close}
          >
            Keep in cart
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            Remove from cart
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
