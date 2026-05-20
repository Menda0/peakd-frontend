/** Keep in sync with `peakd-api/src/studio/studio.constants.ts` WAVE_TYPE_IDS */

export const WAVE_TYPE_IDS = [
  "mushy",
  "clean",
  "closeouts",
  "barreling",
  "big_wave",
] as const;

export type WaveTypeId = (typeof WAVE_TYPE_IDS)[number];

export type WaveTypeOption = {
  id: WaveTypeId;
  title: string;
  description: string;
};

export const WAVE_TYPE_OPTIONS: WaveTypeOption[] = [
  {
    id: "mushy",
    title: "Mushy waves",
    description: "Weak, soft, slow.",
  },
  {
    id: "clean",
    title: "Clean waves",
    description: "Smooth face, good conditions.",
  },
  {
    id: "closeouts",
    title: "Closeouts",
    description: "Break all at once, hard to ride.",
  },
  {
    id: "barreling",
    title: "Barreling waves",
    description: "Hollow tube sections.",
  },
  {
    id: "big_wave",
    title: "Big-wave surf",
    description: "Giant waves (often 20 ft+).",
  },
];

export function waveTypeTitle(id: string): string {
  return WAVE_TYPE_OPTIONS.find((w) => w.id === id)?.title ?? id;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
