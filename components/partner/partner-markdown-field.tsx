"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sm text-zinc-500">
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
  return (
    <div data-color-mode="dark" className="overflow-hidden rounded-lg border border-white/15 [&_.w-md-editor]:bg-[#0a1218] [&_.w-md-editor-text]:text-zinc-100">
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
