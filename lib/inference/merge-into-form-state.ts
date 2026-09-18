import { findChoice } from '@/data/options';
import type { CharacterDraft, CharacterSnapshot, LockKey } from '@/lib/character-types';
import { choiceConflictsWithDraft, dedupeChoiceGroups } from '@/lib/random-engine';
import { inferenceDecisionKey, multiValueInferenceFields } from './types';
import type {
  InferenceDecision,
  InferenceField,
  InferenceMergeMode,
  InferenceMergeResult,
  InferredValue,
} from './types';

type SelectedInferenceValue = {
  valueId: string;
  locked: boolean;
  source: InferredValue['source'];
  confidence: number;
  manuallyChanged: boolean;
};

const sourcePriority = { explicit: 3, inferred: 2, suggested: 1 } as const;
const compareSelected = (left: SelectedInferenceValue, right: SelectedInferenceValue) =>
  Number(left.manuallyChanged) - Number(right.manuallyChanged)
  || sourcePriority[left.source] - sourcePriority[right.source]
  || left.confidence - right.confidence;

const cloneSnapshot = (snapshot: CharacterSnapshot): CharacterSnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as CharacterSnapshot;

const hasExistingValue = (value: string | string[]) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

const hardConflictFieldOrder = new Map<InferenceField, number>([
  'ageGroup',
  'gender',
  'species',
  'background',
  'timeOfDay',
  'composition',
  'build',
  'skinTone',
  'personality',
  'hairColors',
  'hairstyle',
  'eyeColor',
  'eyeShape',
  'faceFeatures',
  'outfit',
  'outfitColors',
  'outfitDetails',
  'accessories',
  'expression',
  'gaze',
  'pose',
  'lighting',
  'negatives',
].map((field, index) => [field as InferenceField, index]));

const setDraftField = (draft: CharacterDraft, field: InferenceField, value: string | string[]) => {
  (draft as unknown as Record<InferenceField, string | string[]>)[field] = value;
};

export function mergeInferenceIntoFormState(
  snapshot: CharacterSnapshot,
  values: InferredValue[],
  decisions: Record<string, InferenceDecision>,
  mode: InferenceMergeMode,
): InferenceMergeResult {
  const next = cloneSnapshot(snapshot);
  const report: InferenceMergeResult['report'] = {
    applied: [],
    skippedLocked: [],
    skippedExisting: [],
    skippedConflict: [],
  };
  const selectedByField = new Map<InferenceField, SelectedInferenceValue[]>();

  values.forEach((value) => {
    const key = inferenceDecisionKey(value);
    const decision = decisions[key] ?? {
      valueId: value.valueId,
      adopted: Boolean(value.adopted),
      locked: Boolean(value.locked),
    };
    if (!decision.adopted || !findChoice(value.category, decision.valueId)) return;
    const selected = selectedByField.get(value.category) ?? [];
    if (!selected.some((item) => item.valueId === decision.valueId)) {
      selected.push({
        valueId: decision.valueId,
        locked: decision.locked,
        source: value.source,
        confidence: value.confidence,
        manuallyChanged: decision.valueId !== value.valueId,
      });
    }
    selectedByField.set(value.category, selected);
  });

  const removeSelected = (field: InferenceField, valueId: string, reason: string) => {
    const selected = selectedByField.get(field);
    if (!selected?.some((item) => item.valueId === valueId)) return;
    const remaining = selected.filter((item) => item.valueId !== valueId);
    if (remaining.length) selectedByField.set(field, remaining);
    else selectedByField.delete(field);
    report.skippedConflict.push({ category: field, valueId, reason });
  };

  const exclusionRules = [
    { negativeId: 'no-wings-unless-specified', positiveTag: 'wings' },
    { negativeId: 'no-horns-unless-specified', positiveTag: 'horns' },
    { negativeId: 'no-animal-ears-unless-specified', positiveTag: 'animal-ears' },
  ] as const;
  for (const rule of exclusionRules) {
    const lockedNegative = Boolean(next.locks.negatives && next.draft.negatives.includes(rule.negativeId));
    if (lockedNegative) {
      for (const [field, selected] of selectedByField) {
        if (field === 'negatives') continue;
        for (const item of selected) {
          if (findChoice(field, item.valueId)?.tags.includes(rule.positiveTag)) {
            removeSelected(field, item.valueId, rule.negativeId);
          }
        }
      }
    }
    const lockedPositive = (Object.keys(next.locks) as LockKey[]).some((field) =>
      field !== 'negatives'
      && next.locks[field]
      && (Array.isArray(next.draft[field]) ? next.draft[field] : [next.draft[field]])
        .some((id) => typeof id === 'string' && findChoice(field, id)?.tags.includes(rule.positiveTag)),
    );
    if (lockedPositive) removeSelected('negatives', rule.negativeId, rule.positiveTag);

    const selectedNegative = selectedByField.get('negatives')?.find((item) => item.valueId === rule.negativeId);
    if (!selectedNegative) continue;
    const selectedPositives = [...selectedByField.entries()].flatMap(([field, selected]) =>
      field === 'negatives'
        ? []
        : selected
          .filter((item) => findChoice(field, item.valueId)?.tags.includes(rule.positiveTag))
          .map((item) => ({ field, item })),
    );
    for (const positive of selectedPositives) {
      if (!selectedByField.get('negatives')?.some((item) => item.valueId === rule.negativeId)) break;
      const priority = compareSelected(selectedNegative, positive.item);
      if (priority > 0) removeSelected(positive.field, positive.item.valueId, rule.negativeId);
      else if (priority < 0) removeSelected('negatives', rule.negativeId, rule.positiveTag);
      else {
        removeSelected(positive.field, positive.item.valueId, `ambiguous ${rule.negativeId}`);
        removeSelected('negatives', rule.negativeId, `ambiguous ${rule.positiveTag}`);
      }
    }
  }

  if (next.locks.gender && next.draft.gender === 'male') removeSelected('ageGroup', 'girl', 'gender:male');
  if (next.locks.gender && next.draft.gender === 'female') removeSelected('ageGroup', 'boy', 'gender:female');
  if (next.locks.ageGroup && next.draft.ageGroup === 'boy') removeSelected('gender', 'female', 'ageGroup:boy');
  if (next.locks.ageGroup && next.draft.ageGroup === 'girl') removeSelected('gender', 'male', 'ageGroup:girl');

  const selectedGender = selectedByField.get('gender')?.[0];
  const selectedAge = selectedByField.get('ageGroup')?.[0];
  if (selectedGender && selectedAge
    && ((selectedGender.valueId === 'female' && selectedAge.valueId === 'boy')
      || (selectedGender.valueId === 'male' && selectedAge.valueId === 'girl'))) {
    const priority = compareSelected(selectedGender, selectedAge);
    if (priority > 0) removeSelected('ageGroup', selectedAge.valueId, `gender:${selectedGender.valueId}`);
    else if (priority < 0) removeSelected('gender', selectedGender.valueId, `ageGroup:${selectedAge.valueId}`);
    else {
      removeSelected('gender', selectedGender.valueId, 'ambiguous gender/ageGroup');
      removeSelected('ageGroup', selectedAge.valueId, 'ambiguous gender/ageGroup');
    }
  }

  const fieldWillApply = (field: InferenceField) => {
    if (next.locks[field]) return false;
    const current = next.draft[field] as string | string[];
    if (field === 'ageGroup' && next.draft.ageNumber) {
      return mode === 'overwrite' && !next.locks.ageNumber;
    }
    if (mode === 'skip' && hasExistingValue(current)) return false;
    if (mode === 'append' && !multiValueInferenceFields.has(field) && hasExistingValue(current)) return false;
    return true;
  };

  const buildProspectiveDraft = (clearIncomingFields: boolean) => {
    const draft = cloneSnapshot(snapshot).draft;
    for (const [field, selected] of selectedByField) {
      if (!fieldWillApply(field)) continue;
      const current = draft[field] as string | string[];
      if (field === 'ageGroup' && mode === 'overwrite') draft.ageNumber = '';
      if (multiValueInferenceFields.has(field)) {
        const incoming = selected.map((item) => item.valueId);
        const value = clearIncomingFields
          ? mode === 'append' && Array.isArray(current) ? [...current] : []
          : mode === 'append' && Array.isArray(current)
            ? [...new Set([...current, ...incoming])]
            : incoming;
        setDraftField(draft, field, value);
      } else {
        setDraftField(draft, field, clearIncomingFields ? '' : selected[0].valueId);
      }
    }
    return draft;
  };

  // Start with fields that are going to be overwritten cleared, while all
  // locked/unrelated form values stay in place. Candidates are then admitted
  // one at a time by user intent priority, using the same hard rules as random
  // generation. This keeps one safe winner instead of dropping both sides of a
  // candidate-vs-candidate conflict.
  let conflictPassChanged = true;
  while (conflictPassChanged) {
    conflictPassChanged = false;
    let prospective = buildProspectiveDraft(true);
    const candidates = [...selectedByField.entries()]
      .filter(([field]) => fieldWillApply(field))
      .flatMap(([field, selected]) => (multiValueInferenceFields.has(field) ? selected : selected.slice(0, 1))
        .map((item) => ({ field, item })))
      .sort((left, right) => {
        const priority = compareSelected(right.item, left.item);
        if (priority) return priority;
        return (hardConflictFieldOrder.get(left.field) ?? 999)
          - (hardConflictFieldOrder.get(right.field) ?? 999);
      });

    for (const { field, item } of candidates) {
      if (!selectedByField.get(field)?.some((candidate) => candidate.valueId === item.valueId)) continue;
      const proposal = cloneSnapshot({ draft: prospective, locks: {} }).draft;
      const current = proposal[field] as string | string[];
      if (multiValueInferenceFields.has(field)) {
        setDraftField(proposal, field, [...new Set([...(Array.isArray(current) ? current : []), item.valueId])]);
      } else {
        setDraftField(proposal, field, item.valueId);
      }
      if (choiceConflictsWithDraft(proposal, field, item.valueId)) {
        removeSelected(field, item.valueId, 'hard conflict with an existing or higher-priority setting');
        conflictPassChanged = true;
      } else {
        prospective = proposal;
      }
    }

    // If rejecting a candidate restores the old value in that field, the old
    // value can expose a second conflict. Validate the exact draft that the
    // merge below would produce, then repeat until it is stable.
    const finalProspective = buildProspectiveDraft(false);
    for (const [field, selected] of selectedByField) {
      if (!fieldWillApply(field)) continue;
      for (const item of selected) {
        if (!choiceConflictsWithDraft(finalProspective, field, item.valueId)) continue;
        removeSelected(field, item.valueId, 'hard conflict with the resulting form');
        conflictPassChanged = true;
      }
    }
  }

  for (const [field, selected] of selectedByField) {
    if (next.locks[field]) {
      report.skippedLocked.push(field);
      continue;
    }
    const current = next.draft[field] as string | string[];
    const existing = hasExistingValue(current);
    let relatedValueChanged = false;
    if (field === 'ageGroup' && next.draft.ageNumber) {
      if (next.locks.ageNumber) {
        report.skippedConflict.push({ category: field, valueId: selected[0].valueId, reason: 'locked ageNumber' });
        continue;
      }
      if (mode !== 'overwrite') {
        report.skippedExisting.push(field);
        continue;
      }
      next.draft.ageNumber = '';
      relatedValueChanged = true;
    }
    if (mode === 'skip' && existing) {
      report.skippedExisting.push(field);
      continue;
    }

    if (multiValueInferenceFields.has(field)) {
      const chosen = selected.map((item) => item.valueId);
      const combined = mode === 'append' && Array.isArray(current)
        ? [...new Set([...current, ...chosen])]
        : chosen;
      const merged = dedupeChoiceGroups(field, combined);
      (next.draft[field] as string[]) = merged;
      const fieldChanged = JSON.stringify(current) !== JSON.stringify(merged);
      const surviving = selected.filter((item) => merged.includes(item.valueId));
      const removed = selected.filter((item) => !merged.includes(item.valueId));
      for (const item of removed) {
        report.skippedConflict.push({
          category: field,
          valueId: item.valueId,
          reason: 'superseded by a more specific value in the same field',
        });
      }
      const shouldLock = surviving.some((item) => item.locked);
      const lockChanged = shouldLock && !next.locks[field];
      for (const item of surviving) {
        const newlyAdded = !Array.isArray(current) || !current.includes(item.valueId);
        if ((mode === 'overwrite' && fieldChanged) || newlyAdded || (lockChanged && item.locked)) {
          report.applied.push({ category: field, valueId: item.valueId });
        }
      }
      if (!fieldChanged && !lockChanged && surviving.length) report.skippedExisting.push(field);
      if (shouldLock) next.locks[field] = true;
    } else {
      if (mode === 'append' && existing) {
        report.skippedExisting.push(field);
        continue;
      }
      const chosen = selected[0];
      (next.draft[field] as string) = chosen.valueId;
      const valueChanged = current !== chosen.valueId;
      const lockChanged = chosen.locked && !next.locks[field];
      if (valueChanged || relatedValueChanged || lockChanged) report.applied.push({ category: field, valueId: chosen.valueId });
      else report.skippedExisting.push(field);
      if (chosen.locked) next.locks[field] = true;
    }
  }

  return {
    snapshot: {
      ...next,
      draft: next.draft as CharacterDraft,
    },
    report: {
      ...report,
      skippedLocked: [...new Set(report.skippedLocked)],
      skippedExisting: [...new Set(report.skippedExisting)],
      skippedConflict: report.skippedConflict.filter((item, index, entries) =>
        entries.findIndex((candidate) => candidate.category === item.category && candidate.valueId === item.valueId) === index,
      ),
    },
  };
}
