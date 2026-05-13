import Link from "next/link";
import { BellIcon, MessageCircleIcon, UploadIcon } from "lucide-react";

function initialsFrom(name: string | undefined, email: string | undefined) {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
    }
    return n.charAt(0).toUpperCase();
  }
  const e = email?.trim();
  return e ? e.charAt(0).toUpperCase() : "?";
}

export function FeedAppBarActions({
  userPicture,
  userName,
  userEmail,
  uploadHref,
}: {
  userPicture?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  uploadHref: string;
}) {
  const initials = initialsFrom(userName ?? undefined, userEmail ?? undefined);

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <Link
        href={uploadHref}
        className="inline-flex items-center gap-2 rounded-full bg-[#26c2c9] px-4 py-2 text-sm font-medium text-[#040A10] transition hover:bg-[#2dd4dc]"
      >
        <UploadIcon className="size-4" aria-hidden />
        <span className="hidden sm:inline">Upload</span>
      </Link>
      <button
        type="button"
        className="rounded-full p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
        aria-label="Messages"
      >
        <MessageCircleIcon className="size-5" />
      </button>
      <button
        type="button"
        className="rounded-full p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
        aria-label="Notifications"
      >
        <BellIcon className="size-5" />
      </button>
      <div className="size-9 overflow-hidden rounded-full border border-white/15 bg-zinc-800">
        {userPicture ? (
          // eslint-disable-next-line @next/next/no-img-element -- Auth0 URL
          <img src={userPicture} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-medium text-zinc-200">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}
