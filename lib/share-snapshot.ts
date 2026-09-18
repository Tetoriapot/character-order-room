import type { CharacterSnapshot, UiLanguage } from './character-types';
import { customFieldLabels } from './character-insights';
import { decodeShareSnapshot, encodeShareSnapshot } from './storage';
import { PERSON_CUSTOM_KEYS, syncCast } from './character-cast';

export const MAX_SHARE_URL_LENGTH = 16_000;

export function shareCustomEntries(source: CharacterSnapshot, language: UiLanguage = 'ja'): Array<{ key: string; label: string; value: string }> {
  const snapshot = syncCast(source);
  const cast = snapshot.draft.cast;
  const includeCast = cast?.enabled && snapshot.draft.purpose !== 'background';
  const entries = Object.entries(snapshot.draft.custom).filter(([key, value]) => value.trim() && (!includeCast || !PERSON_CUSTOM_KEYS.includes(key)))
    .map(([key, value]) => ({ key, label: customFieldLabels[key]?.[language] ?? key, value }));
  if (includeCast && cast.relationshipNote) entries.push({ key: 'cast:relationshipNote', label: language === 'ja' ? '関係の補足' : 'Relationship notes', value: cast.relationshipNote });
  if (includeCast) cast.members.forEach((member, index) => {
    const person = language === 'ja' ? `人物${index + 1}` : `Person ${index + 1}`;
    if (member.name) entries.push({ key: `cast:${member.id}:name`, label: `${person}: ${language === 'ja' ? '識別名' : 'Label'}`, value: member.name });
    if (member.nameEn) entries.push({ key: `cast:${member.id}:nameEn`, label: `${person}: ${language === 'ja' ? '英語識別名' : 'English label'}`, value: member.nameEn });
    for (const [key, value] of Object.entries(member.custom)) if (value.trim()) entries.push({ key: `cast:${member.id}:custom:${key}`, label: `${person}: ${customFieldLabels[key]?.[language] ?? key}`, value });
  });
  return entries;
}

export function prepareShareSnapshot(source: CharacterSnapshot, customKeys: string[] = []): CharacterSnapshot {
  const snapshot: CharacterSnapshot = JSON.parse(JSON.stringify(syncCast(source)));
  snapshot.locks = {};
  snapshot.draft.custom = Object.fromEntries(Object.entries(snapshot.draft.custom).filter(([key]) => customKeys.includes(key)));
  // Gap provenance includes previous values, which are not part of the shared brief.
  delete snapshot.draft.generatedGap;
  const cast = snapshot.draft.cast;
  if (cast?.enabled && snapshot.draft.purpose !== 'background') {
    if (!customKeys.includes('cast:relationshipNote')) delete cast.relationshipNote;
    cast.members = cast.members.map((member) => ({
      ...member, locks: {}, generatedGap: undefined,
      name: customKeys.includes(`cast:${member.id}:name`) ? member.name : '',
      nameEn: customKeys.includes(`cast:${member.id}:nameEn`) ? member.nameEn : undefined,
      custom: Object.fromEntries(Object.entries(member.custom).filter(([key]) => customKeys.includes(`cast:${member.id}:custom:${key}`))),
    }));
    const active = cast.members.find((member) => member.id === cast.activeId)!;
    snapshot.draft.custom = { ...snapshot.draft.custom, ...active.custom };
  } else {
    delete snapshot.draft.cast;
  }
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
