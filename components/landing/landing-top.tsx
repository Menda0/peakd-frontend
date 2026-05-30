"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PeakdLogo } from "@/components/peakd-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LandingHeroBackgroundVideo } from "@/lib/landing";
import { LandingHeroBackgroundVideo as LandingHeroBackgroundVideoPlayer } from "./landing-hero-background-video";
import { SIGN_IN_HREF } from "./landing-header";

export function LandingTop({
  heroBackgroundVideo,
}: {
  heroBackgroundVideo: LandingHeroBackgroundVideo | null;
}) {
  const heroLogoRef = useRef<HTMLDivElement>(null);
  const [barLogoVisible, setBarLogoVisible] = useState(false);

  useEffect(() => {
    const target = heroLogoRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setBarLogoVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-64px 0px 0px 0px",
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:h-16 sm:px-6",
            barLogoVisible ? "justify-between" : "justify-end",
          )}
        >
          {barLogoVisible ? (
            <Link
              href="/"
              className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <PeakdLogo className="h-7 sm:h-8" />
            </Link>
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href={SIGN_IN_HREF} />}
            size="sm"
          >
            Sign in
          </Button>
        </div>
      </header>

      <section className="relative min-h-[32rem] overflow-hidden border-b border-border px-4 py-12 sm:min-h-[36rem] sm:px-6 sm:py-20">
        {heroBackgroundVideo?.videoUrl ? (
          <LandingHeroBackgroundVideoPlayer
            videoUrl={heroBackgroundVideo.videoUrl}
            thumbnailUrl={heroBackgroundVideo.thumbnailUrl}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-b from-accent/50 to-background"
            aria-hidden
          />
        )}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div
            ref={heroLogoRef}
            className="mb-8 flex justify-center sm:mb-10"
          >
            <PeakdLogo className="h-16 sm:h-20 md:h-24" priority />
          </div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Surf session media
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Find your waves. Claim your clips.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Peakd connects videographers and surfers — discover session clips by
            location, claim your waves for free, and unlock commercial footage
            when partners publish premium sessions.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              nativeButton={false}
              render={<Link href={SIGN_IN_HREF} />}
              size="lg"
              className="h-10 px-6 text-base"
            >
              Sign in to explore
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
