import type { LucideIcon } from "lucide-react";
import {
  AwardIcon,
  CircleDollarSignIcon,
  ClapperboardIcon,
  CompassIcon,
  LandmarkIcon,
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
  { id: "finance", label: "Finance", icon: LandmarkIcon },
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

