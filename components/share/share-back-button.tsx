"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareBackButton({ rootHref = "/" }: { rootHref?: string }) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sameOriginReferrer =
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    setCanGoBack(window.history.length > 1 && Boolean(sameOriginReferrer));
  }, []);

  const handleClick = useCallback(() => {
    if (canGoBack) {
      router.back();
      return;
    }
    router.push(rootHref);
  }, [canGoBack, rootHref, router]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 text-muted-foreground hover:text-foreground"
      onClick={handleClick}
      aria-label="Go back"
    >
      <ArrowLeft className="size-4" aria-hidden />
      <span className="ml-1.5">Back</span>
    </Button>
  );
}
