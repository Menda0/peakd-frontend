"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWaveUnlockCart } from "@/lib/wave-unlock-cart";
import { cn } from "@/lib/utils";
import { WaveUnlockCartPanel } from "./wave-unlock-cart-dialog";

export function WaveUnlockCartButton() {
  const { count } = useWaveUnlockCart();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-full p-2.5 text-muted-foreground transition hover:bg-accent hover:text-foreground",
            "data-[state=open]:bg-muted/50 data-[state=open]:text-foreground",
          )}
          aria-label={`Shopping cart, ${count} items`}
          aria-expanded={open}
        >
          <ShoppingCart className="size-5" aria-hidden />
          {count > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="z-[100] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      >
        <WaveUnlockCartPanel onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
