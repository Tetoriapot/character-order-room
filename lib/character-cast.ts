import type { CastMember, CharacterCast, CharacterDraft, CharacterSnapshot, LockKey } from './character-types';

export const MAX_CAST_MEMBERS = 6;
export const PERSON_FIELDS: LockKey[] = [
  'gender', 'ageGroup', 'ageNumber', 'species', 'build', 'skinTone', 'personality',
  'hairColors', 'hairEffects', 'hairstyle', 'eyeColor', 'eyeShape', 'eyeImpression',
  'faceFeatures', 'outfit', 'outfitColors', 'outfitDetails', 'accessories', 'expression', 'pose', 'gaze',
];
export const PERSON_CUSTOM_KEYS = ['character', 'appearance', 'outfit', 'action', 'expression', 'pose'];
export const castPositions = [
  ['', '指定なし', 'Not set'], ['left', '画面の左', 'left side of the image'],
  ['center', '画面の中央', 'center of the image'], ['right', '画面の右', 'right side of the image'],
  ['front', '手前', 'foreground'], ['back', '奥', 'background'],
] as const;
export const castRelationships = [
  ['', '指定なし', 'Not set'], ['friends', '友人', 'friends'], ['family', '家族', 'family'],
  ['team', '仲間・チーム', 'teammates'], ['rivals', 'ライバル', 'rivals'],
  ['strangers', '初対面', 'meeting for the first time'],
  ['partners', '恋人・パートナー', 'romantic partners'], ['mentor', '師弟', 'mentor and student'],
  ['siblings', '兄弟姉妹', 'siblings'], ['twins', '双子', 'twins'], ['colleagues', '同僚', 'colleagues'],
] as const;
export const castInteractions = [
  ['', '個別のポーズを使う', 'Use individual poses'], ['standing', '並んで立つ', 'standing side by side'],
  ['talking', '会話する', 'talking together'], ['walking', '一緒に歩く', 'walking together'],
  ['facing', '向かい合う', 'facing each other'], ['team-pose', '集合ポーズ', 'posing together as a group'],
] as const;
export const castChoiceLabel = (choices: ReadonlyArray<readonly [string, string, string]>, id: string, language: 'ja' | 'en') =>
  choices.find((row) => row[0] === id)?.[language === 'ja' ? 1 : 2] ?? '';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const isCastActive = (draft: CharacterDraft) => Boolean(draft.cast?.enabled && draft.cast.members.length >= 2 && draft.purpose !== 'background');
export function castRandomLocks(draft: CharacterDraft, locks: CharacterSnapshot['locks']): CharacterSnapshot['locks'] {
  if (!isCastActive(draft)) return locks;
  return { ...locks, ...Object.fromEntries(Object.keys(draft).filter((field) => !PERSON_FIELDS.includes(field as LockKey)).map((field) => [field, true])) };
}

export function captureMember(snapshot: CharacterSnapshot, metadata: Pick<CastMember, 'id' | 'name' | 'nameEn' | 'position'>): CastMember {
  return {
    id: metadata.id, name: metadata.name, position: metadata.position,
    ...(metadata.nameEn ? { nameEn: metadata.nameEn } : {}),
    fields: Object.fromEntries(PERSON_FIELDS.map((field) => [field, clone(snapshot.draft[field])])),
    custom: Object.fromEntries(PERSON_CUSTOM_KEYS.map((key) => [key, snapshot.draft.custom[key] ?? ''])),
    ...(snapshot.draft.generatedGap ? { generatedGap: clone(snapshot.draft.generatedGap) } : {}),
    locks: Object.fromEntries(PERSON_FIELDS.filter((field) => snapshot.locks[field]).map((field) => [field, true])),
  };
}

export function syncCast(snapshot: CharacterSnapshot): CharacterSnapshot {
  const cast = snapshot.draft.cast;
  if (!cast) return snapshot;
  return { ...snapshot, draft: { ...snapshot.draft, cast: { ...cast, members: cast.members.map((member) =>
    member.id === cast.activeId ? captureMember(snapshot, member) : member) } } };
}

export function memberDraft(draft: CharacterDraft, member: CastMember): CharacterDraft {
  return { ...draft, ...member.fields, cast: undefined, generatedGap: member.generatedGap,
    custom: { ...draft.custom, ...Object.fromEntries(PERSON_CUSTOM_KEYS.map((key) => [key, ''])), ...member.custom } };
}

export function selectCastMember(source: CharacterSnapshot, id: string): CharacterSnapshot {
  const snapshot = syncCast(source);
  const cast = snapshot.draft.cast;
  const member = cast?.members.find((item) => item.id === id);
  if (!cast || !member) return snapshot;
  const sharedLocks = Object.fromEntries(Object.entries(snapshot.locks).filter(([key]) => !PERSON_FIELDS.includes(key as LockKey)));
  return { draft: { ...memberDraft(snapshot.draft, member), cast: { ...cast, activeId: id } }, locks: { ...sharedLocks, ...member.locks } };
}

export function blankPerson(draft: CharacterDraft): CharacterDraft {
  return { ...draft, ...Object.fromEntries(PERSON_FIELDS.map((field) => [field, Array.isArray(draft[field]) ? [] : ''])),
    generatedGap: undefined, cast: undefined,
    custom: { ...draft.custom, ...Object.fromEntries(PERSON_CUSTOM_KEYS.map((key) => [key, ''])) } };
}

export function setCastEnabled(source: CharacterSnapshot, enabled: boolean): CharacterSnapshot {
  const snapshot = syncCast(source);
  if (snapshot.draft.cast) return { ...snapshot, draft: { ...snapshot.draft, cast: { ...snapshot.draft.cast, enabled } } };
  if (!enabled) return snapshot;
  const first = captureMember(snapshot, { id: crypto.randomUUID(), name: '', position: 'left' });
  const second = captureMember({ draft: blankPerson(snapshot.draft), locks: {} }, { id: crypto.randomUUID(), name: '', position: 'right' });
  return { ...snapshot, draft: { ...snapshot.draft, cast: { enabled: true, activeId: first.id, members: [first, second], relationship: '', interaction: '' } } };
}

export function addCastMember(source: CharacterSnapshot): CharacterSnapshot {
  const snapshot = syncCast(source);
  const cast = snapshot.draft.cast;
  if (!cast || cast.members.length >= MAX_CAST_MEMBERS) return snapshot;
  const member = captureMember({ draft: blankPerson(snapshot.draft), locks: {} }, { id: crypto.randomUUID(), name: '', position: '' });
  return selectCastMember({ ...snapshot, draft: { ...snapshot.draft, cast: { ...cast, members: [...cast.members, member] } } }, member.id);
}

export function removeCastMember(source: CharacterSnapshot, id: string): CharacterSnapshot {
  const snapshot = syncCast(source);
  const cast = snapshot.draft.cast;
  if (!cast || cast.members.length <= 2) return snapshot;
  // Switch first so the removed person's values cannot overwrite the next member.
  const switched = cast.activeId === id ? selectCastMember(snapshot, cast.members.find((item) => item.id !== id)!.id) : snapshot;
  return { ...switched, draft: { ...switched.draft, cast: { ...switched.draft.cast!, members: switched.draft.cast!.members.filter((item) => item.id !== id) } } };
}

/** Hydrates only a bounded, non-recursive cast. Person data uses the same validator as legacy drafts. */
export function hydrateCast(value: unknown, hydratePerson: (value: unknown) => CharacterDraft): CharacterCast | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.members)) return;
  const members: CastMember[] = [];
  for (const item of source.members.slice(0, MAX_CAST_MEMBERS)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(row.id) && !['__proto__', 'constructor', 'prototype'].includes(row.id) ? row.id : `person-${members.length + 1}`;
    if (members.some((member) => member.id === id)) continue;
    const fields = row.fields && typeof row.fields === 'object' && !Array.isArray(row.fields) ? row.fields as Record<string, unknown> : {};
    const person = hydratePerson({ ...Object.fromEntries(PERSON_FIELDS.map((field) => [field, fields[field]])), custom: row.custom, generatedGap: row.generatedGap });
    const locks = row.locks && typeof row.locks === 'object' ? row.locks as Record<string, unknown> : {};
    members.push(captureMember({ draft: person, locks: Object.fromEntries(PERSON_FIELDS.filter((field) => locks[field] === true).map((field) => [field, true])) }, {
      id, name: typeof row.name === 'string' ? row.name.slice(0, 60) : '',
      nameEn: typeof row.nameEn === 'string' ? row.nameEn.slice(0, 60) : '',
      position: castPositions.some(([key]) => key === row.position) ? String(row.position) : '',
    }));
  }
  if (members.length < 2) return;
  return { enabled: source.enabled === true, activeId: members.some((member) => member.id === source.activeId) ? String(source.activeId) : members[0].id,
    members, relationship: castRelationships.some(([id]) => id === source.relationship) ? String(source.relationship) : '',
    interaction: castInteractions.some(([id]) => id === source.interaction) ? String(source.interaction) : '',
    ...(typeof source.relationshipNote === 'string' && source.relationshipNote ? { relationshipNote: source.relationshipNote.slice(0, 500) } : {}) };
}
