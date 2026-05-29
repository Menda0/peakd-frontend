"use client";

import { useMemo, useState } from "react";
import type { DiscoverFeedPost } from "@/lib/discover-feed";
import {
  formatProfileLocation,
  publicProfileWaveToPost,
  type PublicProfile,
} from "@/lib/public-profile";
import { englishCountryLabel } from "@/lib/countries";
import { FeedList } from "@/components/social-feed/feed-list";
import { ShareBackButton } from "@/components/share/share-back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const SURF_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const displayName = profile.displayName?.trim() || `@${profile.handle}`;
  const location =
    formatProfileLocation(profile.countryCode, profile.homeRegionName) ??
    englishCountryLabel(profile.countryCode);
  const surfLabel = profile.surfLevel
    ? SURF_LEVEL_LABELS[profile.surfLevel] ?? profile.surfLevel
    : null;

  return (
    <div className="flex flex-col items-center gap-4 border-b border-border px-4 pb-8 pt-2 text-center sm:flex-row sm:items-start sm:text-left">
      <div className="size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">@{profile.handle}</p>
        {location ? (
          <p className="mt-2 text-sm text-muted-foreground">{location}</p>
        ) : null}
        {surfLabel ? (
          <p className="mt-1 text-sm text-muted-foreground">{surfLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  const pinnedSet = useMemo(
    () => new Set(profile.pinnedJobIds),
    [profile.pinnedJobIds],
  );

  const allPosts: DiscoverFeedPost[] = useMemo(
    () =>
      profile.waves.map((wave) =>
        publicProfileWaveToPost(
          wave,
          profile.displayName,
          profile.avatarUrl,
        ),
      ),
    [profile],
  );

  const pinnedPosts = useMemo(
    () => allPosts.filter((p) => pinnedSet.has(p.id)),
    [allPosts, pinnedSet],
  );

  const hasPinned = profile.pinnedJobIds.length > 0;
  const [tab, setTab] = useState<"pinned" | "all">("pinned");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 px-4 sm:px-0">
        <ShareBackButton />
      </div>
      <ProfileHeader profile={profile} />
      <div className="px-0 sm:px-0">
        {allPosts.length === 0 ? (
          <div className="mx-4 mt-8 rounded-2xl border border-border bg-card px-4 py-12 text-center sm:mx-0">
            <p className="text-sm font-medium text-foreground">No waves yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This surfer has not claimed or uploaded any completed waves.
            </p>
          </div>
        ) : hasPinned ? (
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "pinned" | "all")}
            className="mt-4"
          >
            <TabsList
              className={cn(
                "mx-4 grid w-[calc(100%-2rem)] grid-cols-2 sm:mx-0 sm:w-full",
              )}
            >
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="pinned" className="mt-0">
              {pinnedPosts.length === 0 ? (
                <div className="mx-4 mt-6 rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground sm:mx-0">
                  No pinned waves to show.
                </div>
              ) : (
                <FeedList posts={pinnedPosts} hideActionsBar />
              )}
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <FeedList posts={allPosts} hideActionsBar />
            </TabsContent>
          </Tabs>
        ) : (
          <FeedList posts={allPosts} hideActionsBar />
        )}
      </div>
    </div>
  );
}
