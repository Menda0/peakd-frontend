import { cn } from "@/lib/utils";

export function StoryAvatar({
  name,
  active,
}: {
  name: string;
  active?: boolean;
}) {
  return (
    <div className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
      <div
        className={cn(
          "rounded-full p-[3px]",
          active ? "bg-[#26c2c9]" : "bg-white/15",
        )}
      >
        <div className="size-14 overflow-hidden rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 ring-2 ring-[#040F1E]" />
      </div>
      <span className="w-full truncate text-center text-[11px] text-zinc-400">{name}</span>
    </div>
  );
}
