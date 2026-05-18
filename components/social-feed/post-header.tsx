import { BadgeCheckIcon } from "lucide-react";

export function PostHeader({
  authorName,
  authorAvatarUrl,
  verified,
  location,
  timeAgo,
}: {
  authorName: string;
  authorAvatarUrl?: string | null;
  verified?: boolean;
  location: string;
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
          <span className="font-semibold text-zinc-100">{authorName}</span>
          {verified ? (
            <BadgeCheckIcon className="size-4 shrink-0 text-sky-400" aria-label="Verified" />
          ) : null}
        </div>
        <p className="text-xs text-zinc-500">
          {location} · {timeAgo}
        </p>
      </div>
    </div>
  );
}
