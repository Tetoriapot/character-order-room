import type { CharacterSnapshot } from './character-types';
import { decodeShareSnapshot, encodeShareSnapshot } from './storage';

export const MAX_SHARE_URL_LENGTH = 16_000;

export function prepareShareSnapshot(source: CharacterSnapshot, customKeys: string[] = []): CharacterSnapshot {
  const snapshot: CharacterSnapshot = JSON.parse(JSON.stringify(source));
  snapshot.locks = {};
  snapshot.draft.custom = Object.fromEntries(Object.entries(snapshot.draft.custom).filter(([key]) => customKeys.includes(key)));
  // Gap provenance includes previous values, which are not part of the shared brief.
  delete snapshot.draft.generatedGap;
  return snapshot;
}

export function createShareUrl(base: string, snapshot: CharacterSnapshot): string {
  const url = new URL(base);
  url.search = '';
  // URL fragments are not sent in HTTP requests to the static hosting server.
  url.hash = `state=${encodeShareSnapshot(snapshot)}`;
  return url.toString();
}

export function readShareUrl(href: string): { snapshot: CharacterSnapshot | null; present: boolean; cleanUrl: string } {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const value = fragment.get('state') ?? url.searchParams.get('state');
  const present = value !== null;
  if (fragment.has('state')) url.hash = '';
  url.searchParams.delete('state');
  return {
    snapshot: value && value.length <= 100_000 ? decodeShareSnapshot(value) : null,
    present,
    cleanUrl: url.toString(),
  };
}
