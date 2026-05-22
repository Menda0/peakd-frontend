export type SampleVideo = {
  id: string;
  src: string;
  username: string;
  handle: string;
  caption: string;
  likes: string;
};

/** Public sample MP4s for UI-only demos (no uploads). */
export const sampleVideos: SampleVideo[] = [
  {
    id: "1",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    username: "Maya Costa",
    handle: "mayaswell",
    caption: "Dawn session — glassy lefts before work",
    likes: "12.4K",
  },
  {
    id: "2",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    username: "João Ferreira",
    handle: "pipeline_joao",
    caption: "Travel clip from last swell",
    likes: "8.2K",
  },
  {
    id: "3",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    username: "Sky Nakamura",
    handle: "sky_lineup",
    caption: "Fun-sized shorebreak with the crew",
    likes: "21K",
  },
  {
    id: "4",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    username: "Alex Weber",
    handle: "alex_waves",
    caption: "Longboard trim — nothing beats this feeling",
    likes: "5.1K",
  },
  {
    id: "5",
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    username: "Sam Okonkwo",
    handle: "sam_salt",
    caption: "When the set catches everyone inside",
    likes: "902",
  },
];
