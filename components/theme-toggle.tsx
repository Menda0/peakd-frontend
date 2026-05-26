"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "rounded-full p-2.5 text-muted-foreground",
          className,
        )}
        aria-label="Toggle theme"
        disabled
      >
        <SunIcon className="size-5" aria-hidden />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "rounded-full p-2.5 text-muted-foreground transition hover:bg-accent hover:text-foreground",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <SunIcon className="size-5" aria-hidden />
      ) : (
        <MoonIcon className="size-5" aria-hidden />
      )}
    </button>
  );
}
