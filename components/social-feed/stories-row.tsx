import type { StoryItem } from "@/lib/social-feed-placeholder";
import { StoryAvatar } from "./story-avatar";

export function StoriesRow({ stories }: { stories: StoryItem[] }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {stories.map((s) => (
        <StoryAvatar key={s.id} name={s.name} active={s.active} />
      ))}
    </div>
  );
}
