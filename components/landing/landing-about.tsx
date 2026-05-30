import { CompassIcon, LockIcon, VideoIcon } from "lucide-react";

const FEATURES = [
  {
    icon: CompassIcon,
    title: "Discover",
    description:
      "Browse recently claimed waves and surf sessions by country, region, and spot. See what is happening at breaks near you.",
  },
  {
    icon: VideoIcon,
    title: "Studio",
    description:
      "Partners upload session footage, process clips, and publish waves to the discover feed — with optional commercial pricing.",
  },
  {
    icon: LockIcon,
    title: "Claim & unlock",
    description:
      "Surfers claim free waves from partner sessions. Commercial clips unlock through secure Stripe checkout when you want the full ride.",
  },
] as const;

export function LandingAbout() {
  return (
    <section className="border-b border-border px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built for surf media
          </h2>
          <p className="mt-3 text-muted-foreground">
            Peakd is a videographer studio and social feed for surf sessions.
            Partners capture the lineup; surfers find and claim their waves.
            Everyone stays connected to the spots and sessions that matter.
          </p>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
