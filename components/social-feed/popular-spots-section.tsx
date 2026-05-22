import type { PopularSpot } from "@/lib/social-feed-placeholder";
import { PopularSpotRow } from "./popular-spot-row";

export function PopularSpotsSection({ spots }: { spots: PopularSpot[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-zinc-100">Popular spots</h2>
      <div className="flex flex-col">
        {spots.map((s) => (
          <PopularSpotRow key={s.id} spot={s} />
        ))}
      </div>
    </section>
  );
}
