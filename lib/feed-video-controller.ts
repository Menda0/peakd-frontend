/** Ensures only one feed video plays at a time (Instagram-style). */

type ActiveEntry = { id: string; pause: () => void };

let active: ActiveEntry | null = null;

export function requestFeedVideoPlay(id: string, pause: () => void): void {
  if (active && active.id !== id) {
    active.pause();
  }
  active = { id, pause };
}

export function releaseFeedVideoPlay(id: string): void {
  if (active?.id === id) {
    active = null;
  }
}
