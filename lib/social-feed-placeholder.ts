import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  CircleDollarSignIcon,
  ClapperboardIcon,
  CompassIcon,
  MountainIcon,
  MapPinIcon,
  NewspaperIcon,
  SquarePlayIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

export type NavItemConfig = {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type StoryItem = {
  id: string;
  name: string;
  active?: boolean;
};

export type PlaceholderPost = {
  id: string;
  authorName: string;
  verified?: boolean;
  location: string;
  timeAgo: string;
  title: string;
  description: string;
  hashtags: string[];
  duration: string;
  likes: number;
  comments: number;
  shares: number;
};

export type TrendingItem = {
  id: string;
  rank: number;
  title: string;
  creator: string;
  views: string;
};

export type SuggestedUser = {
  id: string;
  name: string;
  handle: string;
};

export type PopularSpot = {
  id: string;
  name: string;
  region: string;
};

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { id: "explore", label: "Explore", icon: CompassIcon },
  { id: "my-videos", label: "My Videos", icon: SquarePlayIcon },
  { id: "badges", label: "Badges", icon: AwardIcon },
  { id: "surf-report", label: "Surf Report", icon: NewspaperIcon },
  { id: "friends", label: "Friends", icon: UsersIcon },
];

export const PARTNER_NAV_ITEMS: NavItemConfig[] = [
  { id: "studio", label: "Studio", icon: ClapperboardIcon },
  { id: "profile", label: "Profile", icon: UserRoundIcon },
  { id: "income", label: "Income", icon: CircleDollarSignIcon },
];

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { id: "regions", label: "Regions", icon: MapPinIcon },
  { id: "peaks", label: "Peaks", icon: MountainIcon },
];

/*
export const CATEGORY_ITEMS: NavItemConfig[] = [
  { id: "big", label: "Big Waves", icon: WavesIcon },
  { id: "clips", label: "Surf Clips", icon: VideoIcon },
  { id: "edits", label: "Edits", icon: SparklesIcon },
  { id: "travel", label: "Travel", icon: MapPinIcon },
  { id: "life", label: "Lifestyle", icon: HeartIcon },
  { id: "howto", label: "How To", icon: FilmIcon },
];
*/

export const MOCK_STORIES: StoryItem[] = [
  { id: "1", name: "Kai", active: true },
  { id: "2", name: "Malia", active: true },
  { id: "3", name: "Noa" },
  { id: "4", name: "Leo" },
  { id: "5", name: "Tia" },
  { id: "6", name: "Jon" },
];

export const MOCK_POSTS: PlaceholderPost[] = [
  {
    id: "p1",
    authorName: "Kai Nakamura",
    verified: true,
    location: "Oahu, Hawaii",
    timeAgo: "2h ago",
    title: "Morning session in Pipeline \u{1F30A}",
    description: "Glassy walls and light offshore — hard to beat a dawn patrol here.",
    hashtags: ["#pipeline", "#oahu", "#surf"],
    duration: "0:48",
    likes: 2400,
    comments: 128,
    shares: 56,
  },
  {
    id: "p2",
    authorName: "Sofia Martins",
    verified: false,
    location: "Ericeira, Portugal",
    timeAgo: "5h ago",
    title: "Golden hour at Ribeira",
    description: "Long rights and empty lineup. Already counting the days until next trip.",
    hashtags: ["#ericeira", "#travel", "#longboard"],
    duration: "1:12",
    likes: 892,
    comments: 44,
    shares: 12,
  },
];

export const MOCK_TRENDING: TrendingItem[] = [
  { id: "t1", rank: 1, title: "Teahupo'o highlights", creator: "Wave Films", views: "1.2M" },
  { id: "t2", rank: 2, title: "Indonesia barrel reel", creator: "Salt Line", views: "890K" },
  { id: "t3", rank: 3, title: "Nazaré tow-in day", creator: "Big Blue", views: "720K" },
  { id: "t4", rank: 4, title: "J-Bay lines", creator: "Point Break Co", views: "540K" },
  { id: "t5", rank: 5, title: "Maldives crystal water", creator: "Drift", views: "410K" },
];

export const MOCK_SUGGESTED_USERS: SuggestedUser[] = [
  { id: "u1", name: "Alex Rivera", handle: "arivera" },
  { id: "u2", name: "Jordan Lee", handle: "jdlee" },
  { id: "u3", name: "Sam Okonkwo", handle: "samok" },
];

export const MOCK_SPOTS: PopularSpot[] = [
  { id: "s1", name: "Pipeline, Oahu", region: "Hawaii, USA" },
  { id: "s2", name: "Jeffreys Bay", region: "Eastern Cape, ZA" },
  { id: "s3", name: "Uluwatu", region: "Bali, Indonesia" },
];
