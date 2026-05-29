import { IconCalendar } from "@tabler/icons-react";
import { PartnerUploadIndicator } from "./partner-upload-indicator";

export function PostHeader({
  authorName,
  authorAvatarUrl,
  partnerUpload,
  timeAgo,
  location,
}: {
  authorName: string;
  authorAvatarUrl?: string | null;
  partnerUpload?: boolean;
  timeAgo: string;
  location?: string | null;
}) {
  return (
    <div className="mb-2 flex items-start gap-3 sm:mb-0">
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
          {partnerUpload ? <PartnerUploadIndicator /> : null}
        </div>
        <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex shrink-0 items-center gap-1">
            <IconCalendar className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span>{timeAgo}</span>
          </span>
          {location ? (
            <>
              <span aria-hidden>·</span>
              <span className="min-w-0">{location}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
