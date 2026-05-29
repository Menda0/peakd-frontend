import { SessionTagsRow } from "@/components/conditions/session-tags-row";
import type { DiscoverFeedSession } from "@/lib/discover-feed";
import { waveTypeTitle } from "@/lib/surf-session-waves";

export function PostSessionInfo({ session }: { session: DiscoverFeedSession }) {
  const waveLabels = session.waveTypes.map((id) => waveTypeTitle(id));

  return (
    <div className="mt-3">
      <SessionTagsRow
        conditionsRating={session.conditionsRating}
        waveLabels={waveLabels}
      />
    </div>
  );
}
