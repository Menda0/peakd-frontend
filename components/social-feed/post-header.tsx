import { IconCalendar } from "@tabler/icons-react";

export function PostHeader({
  authorName,
  authorAvatarUrl,
  partnerUpload,
  timeAgo,
}: {
  authorName: string;
  authorAvatarUrl?: string | null;
  partnerUpload?: boolean;
  timeAgo: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {authorAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={authorAvatarUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-foreground">{authorName}</span>
          {partnerUpload ? (
            <span className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300/90">
              Partner upload
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconCalendar className="size-3.5 shrink-0 opacity-80" aria-hidden />
          <span>{timeAgo}</span>
        </p>
      </div>
    </div>
  );
}
