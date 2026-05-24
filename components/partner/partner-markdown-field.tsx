"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export function PartnerMarkdownField({
  value,
  onChange,
  height = 280,
}: {
  value: string;
  onChange: (v: string) => void;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const colorMode = mounted && resolvedTheme === "light" ? "light" : "dark";

  return (
    <div
      data-color-mode={colorMode}
      className="overflow-hidden rounded-lg border border-border [&_.w-md-editor]:bg-popover [&_.w-md-editor-text]:text-foreground"
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        preview="edit"
        visibleDragbar={false}
      />
    </div>
  );
}
