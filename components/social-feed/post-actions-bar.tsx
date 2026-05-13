import { BookmarkIcon, HeartIcon, MessageCircleIcon, Share2Icon } from "lucide-react";

function countLabel(n: number) {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

export function PostActionsBar({
  likes,
  comments,
  shares,
}: {
  likes: number;
  comments: number;
  shares: number;
}) {
  return (
    <div className="mt-4 flex items-center gap-6 text-zinc-400">
      <button type="button" className="flex items-center gap-1.5 hover:text-[#26c2c9]">
        <HeartIcon className="size-5" />
        <span className="text-sm">{countLabel(likes)}</span>
      </button>
      <button type="button" className="flex items-center gap-1.5 hover:text-[#26c2c9]">
        <MessageCircleIcon className="size-5" />
        <span className="text-sm">{comments}</span>
      </button>
      <button type="button" className="flex items-center gap-1.5 hover:text-[#26c2c9]">
        <Share2Icon className="size-5" />
        <span className="text-sm">{shares}</span>
      </button>
      <button
        type="button"
        className="ml-auto rounded-lg p-1.5 hover:bg-white/5 hover:text-zinc-200"
        aria-label="Save"
      >
        <BookmarkIcon className="size-5" />
      </button>
    </div>
  );
}
