import { PlayIcon } from "lucide-react";

export function PostMedia({ duration }: { duration: string }) {
  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80">
      <div className="aspect-video w-full bg-gradient-to-br from-cyan-950/50 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
          <PlayIcon className="size-7 translate-x-0.5 fill-white" aria-hidden />
        </span>
      </div>
      <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 font-mono text-xs text-zinc-100">
        {duration}
      </span>
    </div>
  );
}
