import { compatibilityRules, type CompatibilitySelector } from '@/data/compatibility';
import { gapBlueprintById, type GapBlueprintSegment } from '@/data/gapBlueprints';
import { gapSeeds } from '@/data/gapSeeds';
import { optionsByField } from '@/data/options';
import { isSceneComposition } from '@/data/camera-expansion';
import { themes } from '@/data/randomThemes';
import { isMinorAge, normalizeAgeInput } from './age-utils';
import type {
  CharacterDraft,
  Choice,
  GapSeed,
  GeneratedGapChange,
  LockKey,
  RandomTheme,
} from './character-types';

export type GapMode = 'coherent' | 'slight-gap' | 'strong-gap';
export type RandomSource = () => number;

export type WeightContext = {
  field: LockKey;
  draft: CharacterDraft;
  theme?: RandomTheme;
  history: CharacterDraft[];
  resolvedFields: Set<LockKey>;
  gapMode: GapMode;
};

const multiConfig: Partial<Record<LockKey, [number, number]>> = {
  styleTraits: [1, 2],
  personality: [2, 3],
  hairColors: [1, 2],
  hairEffects: [0, 1],
  faceFeatures: [0, 0],
  outfitColors: [1, 2],
  outfitDetails: [0, 1],
  accessories: [0, 2],
  lighting: [1, 2],
  negatives: [3, 5],
};

export const RANDOM_FIELDS: LockKey[] = [
  'gender',
  'ageGroup',
  'species',
  'build',
  'personality',
  'hairColors',
  'hairEffects',
  'hairstyle',
  'eyeColor',
  'eyeShape',
  'eyeImpression',
  'faceFeatures',
  'outfit',
  'outfitColors',
  'outfitDetails',
  'accessories',
  'expression',
  'pose',
  'gaze',
  'background',
  'timeOfDay',
  'lighting',
  'cameraAngle',
  'composition',
  'aspectRatio',
];

const asIds = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string')
  : typeof value === 'string' && value ? [value] : [];

const fieldOptions = (field: LockKey) => optionsByField[field] ?? [];

const selectedOptions = (draft: CharacterDraft, field: LockKey) => {
  const ids = asIds(draft[field]);
  return fieldOptions(field).filter((option) => ids.includes(option.id));
};

const optionHasAnyTag = (option: Choice, tags: string[] = []) =>
  tags.some((tag) => option.tags.includes(tag));

const selectorMatchesChoice = (selector: CompatibilitySelector, field: LockKey, choice: Choice) => {
  if (selector.field !== field) return false;
  if (selector.ids?.length && !selector.ids.includes(choice.id)) return false;
  if (selector.tags?.length && !optionHasAnyTag(choice, selector.tags)) return false;
  return Boolean(selector.ids?.length || selector.tags?.length);
};

const selectorMatchesDraft = (
  selector: CompatibilitySelector,
  draft: CharacterDraft,
  resolvedFields: Set<LockKey>,
) => {
  if (!resolvedFields.has(selector.field)) return false;
  const ids = asIds(draft[selector.field]);
  if (selector.ids?.length && !ids.some((id) => selector.ids?.includes(id))) return false;
  if (selector.tags?.length) {
    const choices = selectedOptions(draft, selector.field);
    if (!choices.some((choice) => optionHasAnyTag(choice, selector.tags))) return false;
  }
  return Boolean(selector.ids?.length || selector.tags?.length);
};

const selectedHasTag = (context: WeightContext, field: LockKey, tag: string) =>
  context.resolvedFields.has(field)
  && selectedOptions(context.draft, field).some((choice) => choice.tags.includes(tag));

export function lightingConflictsWithTime(timeOfDay: string, lightingChoice: Choice) {
  const lightingIds = new Set([lightingChoice.id, ...lightingChoice.tags]);
  const has = (...ids: string[]) => ids.some((id) => lightingIds.has(id));
  if (timeOfDay === 'morning' && has('moon', 'sunset-lighting')) return true;
  if (timeOfDay === 'day' && has('moon', 'sunset-lighting', 'dawn-light')) return true;
  if (['night', 'midnight'].includes(timeOfDay)
    && has('natural', 'dappled', 'sunset-lighting', 'dawn-light', 'golden-hour', 'golden-light')) return true;
  if (timeOfDay === 'evening' && has('dawn-light')) return true;
  if (timeOfDay === 'dawn' && has('sunset-lighting')) return true;
  return false;
}

export function backgroundConflictsWithTime(timeOfDay: string, backgroundChoice: Choice) {
  const temporalTags = new Set(
    [backgroundChoice.id, ...backgroundChoice.tags]
      .filter((value) => ['morning', 'day', 'dawn', 'sunset', 'evening', 'night', 'moon'].includes(value)),
  );
  if (!temporalTags.size) return false;
  const compatible = ({
    morning: ['morning', 'dawn'],
    day: ['day'],
    evening: ['evening', 'sunset'],
    night: ['night', 'moon'],
    midnight: ['night', 'moon'],
    dawn: ['dawn', 'morning'],
  } as Record<string, string[]>)[timeOfDay] ?? [timeOfDay];
  return !compatible.some((value) => temporalTags.has(value));
}

export function getThemeMultiplier(choice: Choice, theme?: RandomTheme) {
  if (!theme) return 1;
  if (optionHasAnyTag(choice, theme.excludedTags)) return 0.1;
  if (optionHasAnyTag(choice, theme.preferredTags)) return 1.8;
  if (optionHasAnyTag(choice, theme.secondaryTags)) return 1.35;
  return 1;
}

export function getCompatibilityMultiplier(choice: Choice, context: WeightContext) {
  return compatibilityRules.reduce((multiplier, rule) => {
    const forward = selectorMatchesChoice(rule.target, context.field, choice)
      && selectorMatchesDraft(rule.when, context.draft, context.resolvedFields);
    const reverse = selectorMatchesChoice(rule.when, context.field, choice)
      && selectorMatchesDraft(rule.target, context.draft, context.resolvedFields);
    return forward || reverse ? multiplier * rule.multiplier : multiplier;
  }, 1);
}

export function getDiversityMultiplier(choice: Choice, field: LockKey, history: CharacterDraft[]) {
  const nearest = history.slice(0, 20).findIndex((draft) => asIds(draft[field]).includes(choice.id));
  if (nearest === 0) return 0.25;
  if (nearest > 0 && nearest < 5) return 0.55;
  if (nearest >= 5 && nearest < 10) return 0.75;
  if (nearest >= 10) return 0.9;
  return 1.15;
}

const isDetailedBackground = (choice: Choice) =>
  !choice.tags.some((tag) => ['transparent', 'no-background'].includes(tag));

const hardConflict = (choice: Choice, context: WeightContext) => {
  const { field } = context;
  if (field === 'composition' && context.draft.purpose === 'background' && !isSceneComposition(choice.id)) return true;
  const resolvedIds = (target: LockKey) => context.resolvedFields.has(target) ? asIds(context.draft[target]) : [];
  const minorAges = new Set(['child', 'teen', 'boy', 'girl']);
  const adultOnly = (target: LockKey, item: Choice) => {
    if (target === 'species') return ['succubus', 'incubus'].includes(item.id);
    if (target === 'personality') return ['sensual', 'flirtatious'].includes(item.id);
    if (target === 'build') return item.id === 'curvy';
    if (target === 'outfit') return ['athletic-swimwear', 'oiran-inspired-outfit'].includes(item.id);
    if (target === 'outfitDetails') return ['open', 'transparent'].includes(item.id);
    if (target === 'accessories') return ['cigar', 'pipe'].includes(item.id);
    if (target === 'eyeShape') return item.id === 'seductive-eyes';
    if (target === 'eyeImpression') return /seductive|色気|誘惑/i.test(`${item.labelJa} ${item.labelEn}`);
    if (target === 'expression') return /seductive|flirtatious|teasing|provocative|inviting|kiss|biting.*lip|誘惑|色気|挑発|唇を噛/i.test(`${item.labelJa} ${item.labelEn}`);
    if (target === 'gaze') return /teasing|seductive|誘惑|挑発/i.test(`${item.labelJa} ${item.labelEn}`);
    if (target === 'pose') return ['holding-a-cigarette', 'holding-a-cigar', 'smoking-pose'].includes(item.id)
      || /blowing a kiss|finger.*lips|投げキス|唇/i.test(`${item.labelJa} ${item.labelEn}`);
    return false;
  };
  const resolvedHasAdultOnly = [...context.resolvedFields].some((target) =>
    selectedOptions(context.draft, target).some((item) => adultOnly(target, item)),
  );
  const selectedMinor = context.resolvedFields.has('ageGroup')
    || Boolean(normalizeAgeInput(context.draft.ageNumber));
  const isSelectedMinor = selectedMinor
    && isMinorAge(context.draft.ageNumber, resolvedIds('ageGroup')[0] ?? '');
  const numericAge = normalizeAgeInput(context.draft.ageNumber);
  const ageGroupFitsNumber = (group: string, age: number) => {
    if (age <= 12) return group === 'child';
    if (age <= 17) return group === 'teen' || group === 'boy' || group === 'girl';
    if (age <= 19) return group === 'teen' || group === 'young';
    if (age <= 25) return group === 'young' || group === 'adult';
    if (age <= 39) return group === 'adult';
    if (age <= 45) return group === 'adult' || group === 'middle';
    if (age <= 64) return group === 'middle';
    if (age <= 90) return group === 'elderly';
    return group === 'ageless';
  };
  const selectedChild = numericAge
    ? Number(numericAge) < 13
    : context.resolvedFields.has('ageGroup') && resolvedIds('ageGroup').includes('child');
  const childIncompatible = (target: LockKey, item: Choice) =>
    (target === 'build' && (['muscular', 'large'].some((tag) => item.tags.includes(tag))
      || ['powerful', 'curvy'].includes(item.id)))
    || (target === 'faceFeatures' && /beard|mustache|goatee|髭|ひげ/i.test(`${item.labelJa} ${item.labelEn}`));
  const resolvedHasChildIncompatible = [...context.resolvedFields].some((target) =>
    selectedOptions(context.draft, target).some((item) => childIncompatible(target, item)),
  );
  if (field === 'negatives' && choice.id === 'no-people' && context.draft.purpose !== 'background') return true;
  if (field === 'negatives' && choice.id === 'one-person' && context.draft.purpose === 'background') return true;
  if (field === 'gender' && choice.id === 'female' && resolvedIds('ageGroup').includes('boy')) return true;
  if (field === 'gender' && choice.id === 'male' && resolvedIds('ageGroup').includes('girl')) return true;
  if (field === 'gender' && choice.id === 'male' && resolvedIds('species').includes('succubus')) return true;
  if (field === 'gender' && choice.id === 'female' && resolvedIds('species').includes('incubus')) return true;
  if (field === 'ageGroup' && choice.id === 'boy' && resolvedIds('gender').includes('female')) return true;
  if (field === 'ageGroup' && choice.id === 'girl' && resolvedIds('gender').includes('male')) return true;
  if (field === 'ageGroup' && numericAge && !ageGroupFitsNumber(choice.id, Number(numericAge))) return true;
  if (field === 'ageGroup' && choice.id === 'child' && resolvedHasChildIncompatible) return true;
  if (field === 'species' && choice.id === 'succubus' && resolvedIds('gender').includes('male')) return true;
  if (field === 'species' && choice.id === 'incubus' && resolvedIds('gender').includes('female')) return true;
  if (field === 'ageGroup' && minorAges.has(choice.id) && resolvedHasAdultOnly) return true;
  if (isSelectedMinor && adultOnly(field, choice)) return true;
  if (selectedChild && childIncompatible(field, choice)) return true;
  if (field === 'gaze' && choice.tags.includes('intense-gaze') && selectedHasTag(context, 'expression', 'eyes-closed')) return true;
  if (field === 'expression' && choice.tags.includes('eyes-closed') && selectedHasTag(context, 'gaze', 'intense-gaze')) return true;
  if (field === 'composition' && choice.tags.includes('background-emphasis')
    && (selectedHasTag(context, 'background', 'transparent') || selectedHasTag(context, 'background', 'no-background'))) return true;
  if (field === 'background' && (choice.tags.includes('transparent') || choice.tags.includes('no-background'))
    && selectedHasTag(context, 'composition', 'background-emphasis')) return true;
  if (field === 'pose' && choice.tags.includes('reading') && selectedHasTag(context, 'background', 'aquatic')) return true;
  if (field === 'background' && choice.tags.includes('aquatic') && selectedHasTag(context, 'pose', 'reading')) return true;
  if (field === 'background' && !context.resolvedFields.has('timeOfDay')
    && context.resolvedFields.has('lighting')) {
    const resolvedLights = selectedOptions(context.draft, 'lighting');
    const hasCompatibleTime = fieldOptions('timeOfDay').some((time) =>
      !time.tags.includes('legacy')
      && !backgroundConflictsWithTime(time.id, choice)
      && resolvedLights.every((light) => !lightingConflictsWithTime(time.id, light)),
    );
    if (!hasCompatibleTime) return true;
  }
  if (field === 'background' && resolvedIds('timeOfDay').some((time) => backgroundConflictsWithTime(time, choice))) return true;
  if (field === 'timeOfDay' && context.resolvedFields.has('background')
    && selectedOptions(context.draft, 'background').some((background) => backgroundConflictsWithTime(choice.id, background))) return true;
  if (field === 'lighting' && resolvedIds('timeOfDay').some((time) => lightingConflictsWithTime(time, choice))) return true;
  if (field === 'timeOfDay' && context.resolvedFields.has('lighting')
    && selectedOptions(context.draft, 'lighting').some((light) => lightingConflictsWithTime(choice.id, light))) return true;
  return false;
};

/**
 * Reuse the random generator's hard safety rules when another input path wants
 * to place a known option into a completed draft. Keeping this wrapper here
 * prevents note inference (and future engines) from growing a second, drifting
 * copy of the same age, identity, scene, and lighting rules.
 */
export function choiceConflictsWithDraft(
  draft: CharacterDraft,
  field: LockKey,
  valueId: string,
  resolvedFields: ReadonlySet<LockKey> = new Set(Object.keys(optionsByField) as LockKey[]),
) {
  const choice = fieldOptions(field).find((option) => option.id === valueId);
  if (!choice) return true;
  const exclusionPairs = [
    { negativeTag: 'no-wings', positiveTag: 'wings' },
    { negativeTag: 'no-horns', positiveTag: 'horns' },
    { negativeTag: 'no-animal-ears', positiveTag: 'animal-ears' },
  ] as const;
  for (const pair of exclusionPairs) {
    const existingPositive = [...resolvedFields].some((target) =>
      target !== 'negatives'
      && selectedOptions(draft, target).some((item) => item.tags.includes(pair.positiveTag)),
    );
    if (field === 'negatives' && choice.tags.includes(pair.negativeTag) && existingPositive) return true;
    if (field !== 'negatives' && choice.tags.includes(pair.positiveTag)
      && resolvedFields.has('negatives')
      && selectedOptions(draft, 'negatives').some((item) => item.tags.includes(pair.negativeTag))) return true;
  }
  return hardConflict(choice, {
    field,
    draft,
    history: [],
    resolvedFields: new Set(resolvedFields),
    gapMode: 'coherent',
  });
}

export function generatedGapConflictsWithAge(
  draft: CharacterDraft,
  ageNumber = draft.ageNumber,
  ageGroup = draft.ageGroup,
) {
  if (!draft.generatedGap || !isMinorAge(ageNumber, ageGroup)) return false;
  if (draft.generatedGap.seedId === 'legacy') return true;
  const blueprint = gapBlueprintById.get(draft.generatedGap.seedId);
  if (draft.generatedGap.segmentIndexes.some((index) => blueprint?.segments[index]?.adultOnly)) return true;
  const candidate = { ...draft, ageNumber, ageGroup };
  const resolvedFields = new Set<LockKey>(Object.keys(optionsByField) as LockKey[]);
  return draft.generatedGap.changes.some((change) =>
    asIds(change.applied).some((id) => {
      const choice = fieldOptions(change.field).find((option) => option.id === id);
      return Boolean(choice && hardConflict(choice, {
        field: change.field,
        draft: candidate,
        history: [],
        resolvedFields,
        gapMode: 'strong-gap',
      }));
    }),
  );
}

export function getSafetyMultiplier(choice: Choice, context: WeightContext) {
  let multiplier = 1;
  if (context.field === 'composition' && choice.tags.includes('face-closeup') && selectedHasTag(context, 'pose', 'cover-face')) multiplier *= 0.35;
  if (context.field === 'pose' && choice.tags.includes('cover-face') && selectedHasTag(context, 'composition', 'face-closeup')) multiplier *= 0.35;
  if (context.field === 'outfit' && choice.tags.includes('heavy-armor') && selectedHasTag(context, 'build', 'delicate')) multiplier *= 0.6;
  if (context.field === 'build' && choice.tags.includes('delicate') && selectedHasTag(context, 'outfit', 'heavy-armor')) multiplier *= 0.6;
  if (context.field === 'background' && isDetailedBackground(choice) && selectedHasTag(context, 'aspectRatio', 'transparent')) multiplier *= 0.05;
  if (context.field === 'aspectRatio' && choice.tags.includes('transparent')
    && selectedOptions(context.draft, 'background').some(isDetailedBackground)) multiplier *= 0.05;
  return multiplier;
}

export function getGapMultiplier(choice: Choice, context: WeightContext) {
  if (context.gapMode === 'coherent') return 1;
  const strength = context.gapMode === 'strong-gap' ? 2.2 : 1.45;
  const intimidating = selectedHasTag(context, 'build', 'muscular')
    || selectedHasTag(context, 'build', 'large')
    || selectedHasTag(context, 'outfit', 'knight')
    || selectedHasTag(context, 'outfit', 'mafia')
    || selectedHasTag(context, 'personality', 'commanding');
  if (intimidating && ['expression', 'accessories'].includes(context.field)
    && optionHasAnyTag(choice, ['soft', 'troubled-smile', 'bashful', 'flower', 'apron'])) return strength;
  if (selectedHasTag(context, 'build', 'delicate') && context.field === 'outfit' && choice.tags.includes('heavy-armor')) return strength;
  if (selectedHasTag(context, 'outfit', 'clergy') && context.field === 'expression' && optionHasAnyTag(choice, ['smirk', 'insane'])) return strength;
  if (selectedHasTag(context, 'personality', 'cool') && context.field === 'expression' && optionHasAnyTag(choice, ['bashful', 'blushing'])) return strength;
  if (selectedHasTag(context, 'outfit', 'sf') && context.field === 'pose' && optionHasAnyTag(choice, ['praying', 'reading'])) return strength;
  return 1;
}

export function calculateFinalWeight(choice: Choice, context: WeightContext) {
  if (choice.tags.includes('legacy') || hardConflict(choice, context)) return 0;
  const weight = choice.weight
    * getThemeMultiplier(choice, context.theme)
    * getCompatibilityMultiplier(choice, context)
    * getDiversityMultiplier(choice, context.field, context.history)
    * getSafetyMultiplier(choice, context)
    * getGapMultiplier(choice, context);
  return Number.isFinite(weight) ? Math.max(0, weight) : 0;
}

export function weightedPick(
  items: Choice[],
  context: WeightContext,
  rng: RandomSource = Math.random,
): Choice | undefined {
  const scored = items.map((item) => ({ item, weight: calculateFinalWeight(item, context) }));
  const total = scored.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return undefined;
  const target = Math.max(0, Math.min(0.999999999999, rng())) * total;
  let cursor = 0;
  for (const scoredItem of scored) {
    cursor += scoredItem.weight;
    if (target < cursor) return scoredItem.item;
  }
  return scored.at(-1)?.item;
}

export function chooseGapMode(rng: RandomSource = Math.random): GapMode {
  const value = rng();
  if (value < 0.8) return 'coherent';
  if (value < 0.95) return 'slight-gap';
  return 'strong-gap';
}

const randomCount = ([min, max]: [number, number], rng: RandomSource) =>
  min + Math.floor(Math.max(0, Math.min(0.999999999999, rng())) * (max - min + 1));

const setField = (draft: CharacterDraft, field: LockKey, value: string | string[]) => {
  (draft as unknown as Record<string, unknown>)[field] = value;
};

const randomizeValue = (
  draft: CharacterDraft,
  field: LockKey,
  context: Omit<WeightContext, 'field' | 'draft'>,
  rng: RandomSource,
) => {
  const candidates = fieldOptions(field);
  if (!candidates.length) return;
  const range = multiConfig[field];
  if (!range) {
    const picked = weightedPick(candidates, { ...context, field, draft }, rng);
    if (picked) setField(draft, field, picked.id);
    return;
  }

  const desired = randomCount(range, rng);
  const chosen: Choice[] = [];
  for (let index = 0; index < desired; index += 1) {
    const blockedGroups = new Set(chosen.flatMap((choice) => choice.groups ?? []));
    const remaining = candidates.filter((choice) =>
      !chosen.some((selected) => selected.id === choice.id)
      && !(choice.groups ?? []).some((group) => blockedGroups.has(group)),
    );
    const picked = weightedPick(remaining, { ...context, field, draft }, rng);
    if (!picked) break;
    chosen.push(picked);
    setField(draft, field, chosen.map((choice) => choice.id));
  }
  setField(draft, field, chosen.map((choice) => choice.id));
};

const cloneDraft = (draft: CharacterDraft): CharacterDraft => ({
  ...draft,
  styleTraits: [...draft.styleTraits],
  personality: [...draft.personality],
  hairColors: [...draft.hairColors],
  hairEffects: [...draft.hairEffects],
  faceFeatures: [...draft.faceFeatures],
  outfitColors: [...draft.outfitColors],
  outfitDetails: [...draft.outfitDetails],
  accessories: [...draft.accessories],
  lighting: [...draft.lighting],
  negatives: [...draft.negatives],
  custom: { ...draft.custom },
  ...(draft.stylePack ? { stylePack: { ...draft.stylePack, antiAiIds: [...draft.stylePack.antiAiIds], excludedBlocks: [...draft.stylePack.excludedBlocks] } } : {}),
  ...(draft.generatedGap ? {
    generatedGap: {
      ...draft.generatedGap,
      segmentIndexes: [...draft.generatedGap.segmentIndexes],
      changes: draft.generatedGap.changes.map((change) => ({
        ...change,
        previous: Array.isArray(change.previous) ? [...change.previous] : change.previous,
        applied: Array.isArray(change.applied) ? [...change.applied] : change.applied,
      })),
    },
  } : {}),
});

const sameGapValue = (left: string | string[], right: string | string[]) =>
  Array.isArray(left) && Array.isArray(right)
    ? JSON.stringify(left) === JSON.stringify(right)
    : left === right;

const cloneGapValue = (value: string | string[]) => Array.isArray(value) ? [...value] : value;

export function discardGeneratedGap(draft: CharacterDraft): CharacterDraft {
  const next = cloneDraft(draft);
  delete next.generatedGap;
  delete next.custom.gap;
  delete next.custom.gapEn;
  return next;
}

export function clearGeneratedGap(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>> = {},
): CharacterDraft {
  const next = cloneDraft(draft);
  for (const change of draft.generatedGap?.changes ?? []) {
    if (locks[change.field]) continue;
    const current = next[change.field] as string | string[];
    if (sameGapValue(current, change.applied)) setField(next, change.field, cloneGapValue(change.previous));
  }
  delete next.generatedGap;
  delete next.custom.gap;
  delete next.custom.gapEn;
  return resolveDraftConflicts(next, locks);
}

export function generatedGapUsesField(draft: CharacterDraft, field: LockKey) {
  if (!draft.generatedGap) return false;
  if (draft.generatedGap.seedId === 'legacy') return true;
  const blueprint = draft.generatedGap ? gapBlueprintById.get(draft.generatedGap.seedId) : undefined;
  return Boolean(blueprint && draft.generatedGap?.segmentIndexes.some((index) =>
    blueprint.segments[index]?.fields.includes(field),
  ));
}

export function releaseGeneratedGapField(draft: CharacterDraft, field: LockKey): CharacterDraft {
  if (!generatedGapUsesField(draft, field)) return cloneDraft(draft);
  if (draft.generatedGap?.seedId === 'legacy') return discardGeneratedGap(draft);
  const next = cloneDraft(draft);
  const blueprint = draft.generatedGap ? gapBlueprintById.get(draft.generatedGap.seedId) : undefined;
  const seed = draft.generatedGap ? gapSeeds.find((item) => item.id === draft.generatedGap?.seedId) : undefined;
  if (!next.generatedGap || !blueprint || !seed) return discardGeneratedGap(next);
  const segmentIndexes = next.generatedGap.segmentIndexes.filter((index) =>
    !blueprint.segments[index]?.fields.includes(field),
  );
  const changes = next.generatedGap.changes.filter((change) => change.field !== field);
  if (!segmentIndexes.length && !changes.length) return discardGeneratedGap(next);
  const keepContrastLabel = segmentIndexes.length >= 2;
  next.generatedGap = {
    ...next.generatedGap,
    segmentIndexes,
    changes,
    labelJa: keepContrastLabel ? segmentIndexes.map((index) => seed.segments[index]).filter(Boolean).join(' × ') : '',
    labelEn: keepContrastLabel ? segmentIndexes.map((index) => seed.segmentsEn[index]).filter(Boolean).join(' × ') : '',
  };
  return next;
}

export function reconcileGeneratedGapDerivedChanges(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>> = {},
): CharacterDraft {
  const trackedNegatives = draft.generatedGap?.changes.filter((change) => change.field === 'negatives') ?? [];
  if (!trackedNegatives.length || locks.negatives) return draft;
  const next = cloneDraft(draft);
  const candidates = trackedNegatives.filter((change) => {
    const current = next.negatives;
    if (!sameGapValue(current, change.applied)) return false;
    setField(next, 'negatives', cloneGapValue(change.previous));
    return true;
  });
  const resolved = resolveDraftConflicts(next, locks);
  if (!resolved.generatedGap) return resolved;
  resolved.generatedGap.changes = resolved.generatedGap.changes.filter((change) =>
    change.field !== 'negatives'
    || candidates.some((candidate) => sameGapValue(resolved.negatives, candidate.applied)),
  );
  return resolved;
}

export const dedupeChoiceGroups = (field: LockKey, ids: string[]) => {
  const choices = ids.map((id) => fieldOptions(field).find((option) => option.id === id)).filter(Boolean) as Choice[];
  const winnerByGroup = new Map<string, Choice>();
  for (const choice of choices) {
    for (const group of choice.groups ?? []) {
      const current = winnerByGroup.get(group);
      if (!current || (choice.specificity ?? 1) > (current.specificity ?? 1)) winnerByGroup.set(group, choice);
    }
  }
  return [...new Set(ids)].filter((id) => {
    const choice = choices.find((item) => item.id === id);
    if (!choice?.groups?.length) return true;
    return choice.groups.every((group) => winnerByGroup.get(group)?.id === id);
  });
};

const draftHasPositiveTag = (draft: CharacterDraft, tag: string) =>
  (Object.keys(optionsByField) as LockKey[]).some((field) =>
    field !== 'negatives' && selectedOptions(draft, field).some((choice) => choice.tags.includes(tag)),
  );

export function resolveDraftConflicts(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>> = {},
): CharacterDraft {
  const next = cloneDraft(draft);
  (Object.entries(multiConfig) as Array<[LockKey, [number, number]]>).forEach(([field]) => {
    if (!locks[field]) setField(next, field, dedupeChoiceGroups(field, asIds(next[field])));
  });
  if (!locks.negatives) {
    next.negatives = next.negatives.filter((id) => {
      const choice = fieldOptions('negatives').find((option) => option.id === id);
      if (!choice) return true;
      if (choice.tags.includes('no-wings') && draftHasPositiveTag(next, 'wings')) return false;
      if (choice.tags.includes('no-horns') && draftHasPositiveTag(next, 'horns')) return false;
      if (choice.tags.includes('no-animal-ears') && draftHasPositiveTag(next, 'animal-ears')) return false;
      return true;
    });
  }
  return next;
}

const themeFor = (themeId?: string) => themes.find((theme) => theme.id === themeId);

export type RandomScope = 'character' | 'background';

const BACKGROUND_RANDOM_FIELDS = new Set<LockKey>([
  'background', 'timeOfDay', 'lighting', 'composition', 'aspectRatio',
]);

const coreMatches = (choice: Choice, core: RandomTheme['core'][number]) =>
  (core.ids?.includes(choice.id) ?? false)
  || (core.tags?.some((tag) => choice.tags.includes(tag)) ?? false);

const applyThemeCore = (
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
  theme: RandomTheme | undefined,
  context: Omit<WeightContext, 'field' | 'draft'>,
  rng: RandomSource,
  allowedFields?: ReadonlySet<LockKey>,
) => {
  const forced = new Set<LockKey>();
  if (!theme) return forced;
  for (const core of theme.core) {
    if (core.field === 'faceFeatures') continue;
    if (allowedFields && !allowedFields.has(core.field)) continue;
    const currentMatches = selectedOptions(draft, core.field).some((choice) => coreMatches(choice, core));
    if (locks[core.field]) {
      if (currentMatches) forced.add(core.field);
      continue;
    }
    const candidates = fieldOptions(core.field).filter((choice) => coreMatches(choice, core));
    const picked = weightedPick(candidates, { ...context, field: core.field, draft }, rng);
    if (!picked) continue;
    setField(draft, core.field, multiConfig[core.field] ? [picked.id] : picked.id);
    forced.add(core.field);
    context.resolvedFields.add(core.field);
  }
  return forced;
};

export function randomizeField(
  draft: CharacterDraft,
  field: LockKey,
  themeId?: string,
  history: CharacterDraft[] = [],
  rng: RandomSource = Math.random,
  locks: Partial<Record<LockKey, boolean>> = {},
): CharacterDraft {
  const next = releaseGeneratedGapField(draft, field);
  if (field === 'faceFeatures' && locks.faceFeatures) return cloneDraft(draft);
  if (field === 'ageNumber') {
    const ranges: Record<string, [number, number]> = {
      child: [6, 12], teen: [13, 19], boy: [13, 17], girl: [13, 17], young: [18, 25], adult: [20, 45],
      middle: [40, 64], elderly: [65, 90], ageless: [18, 120],
    };
    const [min, max] = ranges[next.ageGroup] ?? [18, 45];
    next.ageNumber = String(min + Math.floor(rng() * (max - min + 1)));
    return reconcileGeneratedGapDerivedChanges(next, locks);
  }
  const resolvedFields = new Set<LockKey>(
    (Object.keys(optionsByField) as LockKey[]).filter((candidate) => candidate !== field),
  );
  randomizeValue(next, field, {
    theme: themeFor(themeId), history, resolvedFields, gapMode: 'coherent',
  }, rng);
  return reconcileGeneratedGapDerivedChanges(next, locks);
}

export function randomizeAll(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
  themeId?: string,
  history: CharacterDraft[] = [],
  rng: RandomSource = Math.random,
  scope: RandomScope = 'character',
): CharacterDraft {
  const next = discardGeneratedGap(draft);
  if (scope === 'character' && !locks.faceFeatures) next.faceFeatures = [];
  if (scope === 'character' && !locks.ageNumber) next.ageNumber = '';
  const allowedFields = scope === 'background' ? BACKGROUND_RANDOM_FIELDS : undefined;
  const effectiveLocks: Partial<Record<LockKey, boolean>> = scope === 'background'
    ? Object.fromEntries((Object.keys(optionsByField) as LockKey[]).map((field) => [
      field,
      !BACKGROUND_RANDOM_FIELDS.has(field) || Boolean(locks[field]),
    ]))
    : locks;
  const resolvedFields = new Set<LockKey>(
    (Object.entries(effectiveLocks) as Array<[LockKey, boolean]>).filter(([, locked]) => locked).map(([field]) => field),
  );
  resolvedFields.add('purpose');
  resolvedFields.add('style');
  resolvedFields.add('styleTraits');
  resolvedFields.add('negatives');
  const context = {
    theme: themeFor(themeId),
    history,
    resolvedFields,
    gapMode: chooseGapMode(rng),
  };
  const forcedFields = applyThemeCore(next, effectiveLocks, context.theme, context, rng, allowedFields);

  for (const field of RANDOM_FIELDS) {
    if (allowedFields && !allowedFields.has(field)) continue;
    if (!effectiveLocks[field] && !forcedFields.has(field)) randomizeValue(next, field, context, rng);
    resolvedFields.add(field);
  }
  return resolveDraftConflicts(next, effectiveLocks);
}

export type BatchVariationOptions = {
  count?: number;
  themeId?: string;
  history?: CharacterDraft[];
  rng?: RandomSource;
  scope?: RandomScope;
};

export function generateBatchVariations(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
  options: BatchVariationOptions = {},
): CharacterDraft[] {
  const count = Math.min(8, Math.max(1, Math.floor(options.count ?? 4)));
  const scope = options.scope ?? (draft.purpose === 'background' ? 'background' : 'character');
  const allowed = scope === 'background' ? BACKGROUND_RANDOM_FIELDS : new Set(RANDOM_FIELDS);
  if ([...allowed].every((field) => locks[field])) return [];
  const results: CharacterDraft[] = [];
  const fingerprints = new Set<string>([JSON.stringify(draft)]);
  const rollingHistory = [...(options.history ?? [])];
  const rng = options.rng ?? Math.random;
  for (let attempt = 0; attempt < count * 8 && results.length < count; attempt += 1) {
    const next = randomizeAll(draft, locks, options.themeId, rollingHistory, rng, scope);
    const fingerprint = JSON.stringify(next);
    if (fingerprints.has(fingerprint)) continue;
    fingerprints.add(fingerprint);
    results.push(next);
    rollingHistory.push(next);
  }
  return results;
}

const applyGapSeed = (
  seed: GapSeed,
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
) => {
  const next = clearGeneratedGap(draft, locks);
  if (RANDOM_FIELDS.every((field) => locks[field])) {
    return { draft: next, changed: false, effectiveLabel: '' };
  }
  const blueprint = gapBlueprintById.get(seed.id);
  if (!blueprint || blueprint.segments.length !== seed.segments.length) {
    return { draft: next, changed: false, effectiveLabel: '' };
  }

  let working = next;
  const safeIndexes: number[] = [];
  const previousByField = new Map<LockKey, string | string[]>();
  const resolvedFields = new Set<LockKey>(Object.keys(optionsByField) as LockKey[]);

  const trySegment = (plan: GapBlueprintSegment) => {
    if (plan.fields.includes('faceFeatures')) return null;
    if (!plan.fields.length || plan.fields.some((field) => locks[field])) return null;
    if (plan.adultOnly && isMinorAge(working.ageNumber, working.ageGroup)) return null;
    const candidate = cloneDraft(working);
    const localPrevious = new Map<LockKey, string | string[]>();
    for (const assignment of plan.assignments) {
      const choice = fieldOptions(assignment.field).find((option) => option.id === assignment.optionId);
      if (!choice || hardConflict(choice, {
        field: assignment.field,
        draft: candidate,
        history: [],
        resolvedFields,
        gapMode: 'strong-gap',
      })) return null;
      const current = candidate[assignment.field] as string | string[];
      if (!localPrevious.has(assignment.field)) localPrevious.set(assignment.field, cloneGapValue(current));
      setField(candidate, assignment.field, Array.isArray(current)
        ? [...new Set([...current, assignment.optionId])]
        : assignment.optionId);
    }
    return { candidate, localPrevious };
  };

  for (let index = 0; index < blueprint.segments.length; index += 1) {
    const applied = trySegment(blueprint.segments[index]);
    if (!applied) continue;
    working = applied.candidate;
    safeIndexes.push(index);
    for (const [field, value] of applied.localPrevious) {
      if (!previousByField.has(field)) previousByField.set(field, value);
    }
  }
  if (safeIndexes.length < 2) return { draft: next, changed: false, effectiveLabel: '' };

  const safeSegments = safeIndexes.map((index) => seed.segments[index]);
  const safeSegmentsEn = safeIndexes.map((index) => seed.segmentsEn[index]).filter(Boolean);
  const resolved = resolveDraftConflicts(working, locks);
  for (const field of Object.keys(optionsByField) as LockKey[]) {
    const before = working[field] as string | string[];
    const after = resolved[field] as string | string[];
    if (!sameGapValue(before, after) && !previousByField.has(field)) {
      previousByField.set(field, cloneGapValue(before));
    }
  }
  const changes: GeneratedGapChange[] = [...previousByField]
    .filter(([field, previous]) => !sameGapValue(previous, resolved[field] as string | string[]))
    .map(([field, previous]) => ({
      field,
      previous: cloneGapValue(previous),
      applied: cloneGapValue(resolved[field] as string | string[]),
    }));
  if (!changes.length) return { draft: next, changed: false, effectiveLabel: '' };
  resolved.generatedGap = {
    seedId: seed.id,
    labelJa: safeSegments.join(' × '),
    labelEn: safeSegmentsEn.join(' × '),
    segmentIndexes: safeIndexes,
    changes,
  };
  return {
    draft: resolved,
    changed: JSON.stringify(resolved) !== JSON.stringify(draft),
    effectiveLabel: safeSegments.join(' × '),
  };
};

export function generateGap(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
  rng: RandomSource = Math.random,
  history: CharacterDraft[] = [],
): { draft: CharacterDraft; label: string; changed: boolean } {
  if (!gapSeeds.length) return { draft, label: '', changed: false };
  const randomValue = Math.max(0, Math.min(0.999999999999, rng()));
  const currentSeedId = draft.generatedGap?.seedId;
  const recentSeedIds = new Set(history.slice(0, 20).map((item) => item.generatedGap?.seedId).filter(Boolean));
  const evaluated = gapSeeds.map((seed) => ({ seed, result: applyGapSeed(seed, draft, locks) }));
  const priorityBuckets = [
    evaluated.filter(({ seed }) => seed.id !== currentSeedId && !recentSeedIds.has(seed.id)),
    evaluated.filter(({ seed }) => seed.id !== currentSeedId && recentSeedIds.has(seed.id)),
    evaluated.filter(({ seed }) => seed.id === currentSeedId),
  ];
  for (const bucket of priorityBuckets) {
    const viable = bucket.filter(({ result }) => result.changed);
    if (!viable.length) continue;
    const picked = viable[Math.floor(randomValue * viable.length)];
    return {
      draft: picked.result.draft,
      label: picked.result.effectiveLabel || 'ロックを維持したギャップ',
      changed: true,
    };
  }
  return { draft, label: '', changed: false };
}

export const themeById = themeFor;
export { themes };
