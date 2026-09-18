import type { CharacterSnapshot, LockKey, UiLanguage } from './character-types';
import { blankPerson, captureMember, castRandomLocks, isCastActive, MAX_CAST_MEMBERS, memberDraft, PERSON_CUSTOM_KEYS, PERSON_FIELDS, selectCastMember, syncCast } from './character-cast';
import { releaseGeneratedGapField, randomizeAll, resolveDraftConflicts } from './random-engine';
import { createBlankSnapshot } from './guided-builder';

export const OUTFIT_FIELDS: LockKey[] = ['outfit', 'outfitColors', 'outfitDetails', 'accessories'];
export function personTemplate(source: CharacterSnapshot, scope: 'person' | 'outfit'): CharacterSnapshot {
  const blank = createBlankSnapshot();
  const fields = scope === 'outfit' ? OUTFIT_FIELDS : PERSON_FIELDS;
  const custom = scope === 'outfit' ? ['outfit'] : PERSON_CUSTOM_KEYS;
  return { draft: { ...blank.draft, ...Object.fromEntries(fields.map((field) => [field, source.draft[field]])),
    custom: Object.fromEntries(custom.map((key) => [key, source.draft.custom[key] ?? ''])) }, locks: {} };
}
export function resetPeople(source: CharacterSnapshot, scope: 'person' | 'people'): CharacterSnapshot {
  let snapshot = syncCast(source);
  const activeId = snapshot.draft.cast?.activeId;
  const ids = scope === 'people' ? snapshot.draft.cast?.members.map((member) => member.id) ?? [] : activeId ? [activeId] : [];
  const clear = (value: CharacterSnapshot) => syncCast({
    draft: { ...blankPerson(value.draft), cast: value.draft.cast },
    locks: Object.fromEntries(Object.entries(value.locks).filter(([field]) => !PERSON_FIELDS.includes(field as LockKey))),
  });
  if (!ids.length) return clear(snapshot);
  for (const id of ids) snapshot = clear(selectCastMember(snapshot, id));
  return selectCastMember(snapshot, activeId!);
}

export function duplicatePerson(source: CharacterSnapshot): CharacterSnapshot {
  const snapshot = syncCast(source);
  const cast = snapshot.draft.cast;
  if (!cast || cast.members.length >= MAX_CAST_MEMBERS) return snapshot;
  const active = cast.members.find((member) => member.id === cast.activeId)!;
  const copy = captureMember(snapshot, { ...active, id: crypto.randomUUID(), name: active.name ? `${active.name} (copy)`.slice(0, 60) : '', position: '' });
  return selectCastMember({ ...snapshot, draft: { ...snapshot.draft, cast: { ...cast, members: [...cast.members, copy] } } }, copy.id);
}

/** Explicitly scoped transfer. Existing locks always win; scene/style and other people stay untouched. */
export function transferPersonFields(target: CharacterSnapshot, source: CharacterSnapshot, fields: LockKey[], customKeys: string[]): CharacterSnapshot {
  const allowed = fields.filter((field) => PERSON_FIELDS.includes(field) && !target.locks[field]);
  let base = target.draft;
  for (const field of allowed) base = releaseGeneratedGapField(base, field);
  const custom = { ...base.custom };
  for (const key of customKeys.filter((key) => PERSON_CUSTOM_KEYS.includes(key))) custom[key] = source.draft.custom[key] ?? '';
  const sharedLocks = Object.fromEntries(Object.keys(base).filter((field) => !PERSON_FIELDS.includes(field as LockKey)).map((field) => [field, true]));
  const draft = resolveDraftConflicts({ ...base,
    ...Object.fromEntries(allowed.map((field) => [field, Array.isArray(source.draft[field]) ? [...source.draft[field]] : source.draft[field]])), custom,
  }, { ...target.locks, ...sharedLocks });
  return syncCast({ draft, locks: { ...target.locks } });
}

export function randomizePeople(source: CharacterSnapshot, ids: string[], themeId?: string): CharacterSnapshot {
  let snapshot = syncCast(source);
  const activeId = snapshot.draft.cast?.activeId;
  if (!activeId || !isCastActive(snapshot.draft)) return snapshot;
  for (const id of ids) {
    if (!snapshot.draft.cast!.members.some((member) => member.id === id)) continue;
    snapshot = selectCastMember(snapshot, id);
    snapshot = syncCast({ ...snapshot, draft: randomizeAll(snapshot.draft, castRandomLocks(snapshot.draft, snapshot.locks), themeId) });
  }
  return selectCastMember(snapshot, activeId);
}

export type CastCheck = { id: string; personId?: string; ja: string; en: string };
export function castChecks(source: CharacterSnapshot): CastCheck[] {
  if (!isCastActive(source.draft)) return [];
  const { draft } = syncCast(source);
  const cast = draft.cast!;
  const result: CastCheck[] = [];
  const positions = new Map<string, number[]>();
  cast.members.forEach((member, index) => {
    const person = memberDraft(draft, member);
    if (!PERSON_FIELDS.some((field) => Array.isArray(person[field]) ? person[field].length : Boolean(person[field])) && !PERSON_CUSTOM_KEYS.some((key) => person.custom[key]?.trim())) {
      result.push({ id: `empty-${member.id}`, personId: member.id, ja: `人物${index + 1}${member.name ? `（${member.name}）` : ''}の詳細が空欄です。意図した未指定なら、そのまま使えます。`, en: `Person ${index + 1} has no details. Leave it blank if intentional.` });
    }
    if (member.position) positions.set(member.position, [...(positions.get(member.position) ?? []), index + 1]);
  });
  for (const [position, people] of positions) if (people.length > 1) result.push({ id: `position-${position}`, ja: `人物${people.join('・')}は同じ配置です。重なりが意図どおりか確認してください。`, en: `People ${people.join(', ')} share a placement. Check whether this is intentional.` });
  const texts = [draft.custom, ...cast.members.map((member) => member.custom)].flatMap((custom) => Object.values(custom));
  if (cast.relationshipNote) texts.push(cast.relationshipNote);
  const numbers: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  if (texts.some((text) => [...text.matchAll(/([0-9０-９]+|[一二三四五六])\s*人|\b(one|two|three|four|five|six|\d+)\s+(?:people|persons?|characters?)\b|\b(solo)\b/gi)].some((match) => {
    const raw = (match[1] ?? match[2] ?? 'one').toLowerCase().replace(/[０-９]/g, (n) => String(n.charCodeAt(0) - 0xFF10));
    return (numbers[raw] ?? Number(raw)) !== cast.members.length;
  }))) result.push({ id: 'custom-count', ja: '自由入力に、設定した人数と異なる人数指定があります。元の文章を確認してください（自動修正しません）。', en: 'Custom text specifies a different person count. Review the text; it is not automatically rewritten.' });
  return result;
}

export const personName = (source: CharacterSnapshot, language: UiLanguage) => {
  const member = source.draft.cast?.members.find((item) => item.id === source.draft.cast?.activeId);
  return member ? (language === 'ja' ? member.name : member.nameEn || member.name) || `${language === 'ja' ? '人物' : 'Person '}${source.draft.cast!.members.indexOf(member) + 1}` : language === 'ja' ? '現在の人物' : 'Current person';
};
