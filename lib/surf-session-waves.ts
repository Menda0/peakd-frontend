/** Keep in sync with `peakd-api/src/studio/studio.constants.ts` WAVE_TYPE_IDS */

/** Legacy session tags (still accepted by API; hidden from new-session picker). */
export const LEGACY_WAVE_TYPE_IDS = [
  "mushy",
  "clean",
  "closeouts",
  "barreling",
  "big_wave",
] as const;

export const WAVE_TYPE_IDS = [
  ...LEGACY_WAVE_TYPE_IDS,
  "point_breaks",
  "reef_breaks",
  "beach_breaks",
  "a_frames",
  "shorebreak",
  "reform_waves",
  "choppy_waves",
  "left_handers",
  "right_handers",
  "wedge_waves",
  "slab_waves",
  "rolling_waves",
] as const;

export type WaveTypeId = (typeof WAVE_TYPE_IDS)[number];

export type WaveTypeOption = {
  id: WaveTypeId;
  title: string;
  description: string;
};

const LEGACY_WAVE_TYPE_OPTIONS: WaveTypeOption[] = [
  { id: "mushy", title: "Mushy waves", description: "Weak, soft, slow." },
  { id: "clean", title: "Clean waves", description: "Smooth face, good conditions." },
  { id: "closeouts", title: "Closeouts", description: "Break all at once, hard to ride." },
  { id: "barreling", title: "Barreling waves", description: "Hollow tube sections." },
  { id: "big_wave", title: "Big-wave surf", description: "Giant waves (often 20 ft+)." },
];

/** Options shown when creating or editing a session. */
export const WAVE_TYPE_OPTIONS: WaveTypeOption[] = [
  {
    id: "point_breaks",
    title: "Point breaks",
    description: "Long peeling sections along the wave.",
  },
  {
    id: "reef_breaks",
    title: "Reef breaks",
    description: "Waves breaking over shallow reef.",
  },
  {
    id: "beach_breaks",
    title: "Beach breaks",
    description: "Sandbar-shaped peaks that shift constantly.",
  },
  {
    id: "a_frames",
    title: "A-frames",
    description: "Peaks that break both left and right.",
  },
  {
    id: "shorebreak",
    title: "Shorebreak",
    description: "Waves breaking directly on the sand.",
  },
  {
    id: "reform_waves",
    title: "Reform waves",
    description: "Waves that break, then reform farther inside.",
  },
  {
    id: "choppy_waves",
    title: "Choppy waves",
    description: "Bumpy, wind-textured surface.",
  },
  {
    id: "left_handers",
    title: "Left-handers",
    description: "Waves peeling to the surfer's left.",
  },
  {
    id: "right_handers",
    title: "Right-handers",
    description: "Waves peeling to the surfer's right.",
  },
  {
    id: "wedge_waves",
    title: "Wedge waves",
    description: "Two swells collide and create steep peaks.",
  },
  {
    id: "slab_waves",
    title: "Slab waves",
    description: "Thick, heavy, fast-breaking waves.",
  },
  {
    id: "rolling_waves",
    title: "Rolling waves",
    description: "Gentle, slow-building waves with soft shoulders.",
  },
];

const WAVE_TYPE_TITLE_BY_ID = new Map<string, string>(
  [...LEGACY_WAVE_TYPE_OPTIONS, ...WAVE_TYPE_OPTIONS].map((w) => [w.id, w.title]),
);

export function waveTypeTitle(id: string): string {
  return WAVE_TYPE_TITLE_BY_ID.get(id) ?? id;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
