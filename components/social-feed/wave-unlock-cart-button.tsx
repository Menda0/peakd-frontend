"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useWaveUnlockCart } from "@/lib/wave-unlock-cart";
import { cn } from "@/lib/utils";
import { WaveUnlockCartDialog } from "./wave-unlock-cart-dialog";

export function WaveUnlockCartButton() {
  const { count } = useWaveUnlockCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative rounded-full p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200",
        )}
        aria-label={`Shopping cart, ${count} items`}
      >
        <ShoppingCart className="size-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      <WaveUnlockCartDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
