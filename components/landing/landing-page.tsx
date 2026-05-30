import type { LandingPageData, LandingHeroBackgroundVideo } from "@/lib/landing";
import { LandingAbout } from "./landing-about";
import { LandingFeaturedWaves } from "./landing-featured-waves";
import { LandingLatestSessions } from "./landing-latest-sessions";
import { LandingTop } from "./landing-top";

function pickHeroVideoFromFeatured(
  data: LandingPageData,
): LandingHeroBackgroundVideo | null {
  if (data.heroBackgroundVideo?.videoUrl) return data.heroBackgroundVideo;
  const playable = data.featuredWaves.filter((wave) => wave.videoUrl);
  if (playable.length === 0) return null;
  const pick = playable[Math.floor(Math.random() * playable.length)]!;
  return {
    videoUrl: pick.videoUrl!,
    thumbnailUrl: pick.thumbnailUrl,
  };
}

export function LandingPage({ data }: { data: LandingPageData }) {
  const countryCode = data.visitorCountryCode;
  const heroBackgroundVideo = pickHeroVideoFromFeatured(data);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <LandingTop heroBackgroundVideo={heroBackgroundVideo} />
      <main className="flex-1">
        <LandingAbout />
        <LandingFeaturedWaves waves={data.featuredWaves} countryCode={countryCode} />
        <LandingLatestSessions sessions={data.sessions} />
      </main>
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        Peakd — videographer and media tools for surf sessions.
      </footer>
    </div>
  );
}
