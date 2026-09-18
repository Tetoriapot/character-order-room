import { findChoice } from '@/data/options';
import { inferenceFields, multiValueInferenceFields } from './types';
import type { InferenceLevel, InferenceResult, InferredValue } from './types';

const sourcePriority = { explicit: 3, inferred: 2, suggested: 1 } as const;
const fieldOrder = new Map(inferenceFields.map((field, index) => [field, index]));

const softConflicts = [
  ['cute', 'cruel'],
  ['gentle', 'villainous'],
  ['fragile', 'powerful'],
] as const;

const sortValues = (left: InferredValue, right: InferredValue) =>
  (fieldOrder.get(left.category) ?? 999) - (fieldOrder.get(right.category) ?? 999)
  || sourcePriority[right.source] - sourcePriority[left.source]
  || right.confidence - left.confidence
  || (right.evidence?.length ?? 0) - (left.evidence?.length ?? 0)
  || left.valueId.localeCompare(right.valueId);

const comparePriority = (left: InferredValue, right: InferredValue) =>
  sourcePriority[left.source] - sourcePriority[right.source]
  || left.confidence - right.confidence
  || (left.evidence?.length ?? 0) - (right.evidence?.length ?? 0);

const exclusionConflicts = [
  { negativeId: 'no-wings-unless-specified', positiveTag: 'wings' },
  { negativeId: 'no-horns-unless-specified', positiveTag: 'horns' },
  { negativeId: 'no-animal-ears-unless-specified', positiveTag: 'animal-ears' },
] as const;

export function resolveInferenceConflicts(
  values: InferredValue[],
  level: InferenceLevel,
  initialWarnings: string[] = [],
): Pick<InferenceResult, 'values' | 'warnings'> {
  const warnings = [...initialWarnings];
  const deduped = new Map<string, InferredValue>();

  for (const value of values) {
    const key = `${value.category}:${value.valueId}`;
    const current = deduped.get(key);
    if (!current
      || sourcePriority[value.source] > sourcePriority[current.source]
      || (sourcePriority[value.source] === sourcePriority[current.source] && value.confidence > current.confidence)) {
      deduped.set(key, { ...value });
    }
  }

  const candidates = [...deduped.values()].map((value) => ({ ...value }));
  if (level !== 'rich') {
    for (const [leftId, rightId] of softConflicts) {
      const left = candidates.find((value) => value.valueId === leftId);
      const right = candidates.find((value) => value.valueId === rightId);
      if (!left || !right) continue;
      const lower = left.confidence <= right.confidence ? left : right;
      lower.confidence = Number(Math.max(0, lower.confidence - 0.08).toFixed(2));
      warnings.push(`「${left.labelJa}」と「${right.labelJa}」は対照的な候補です。`);
    }
  }

  let withoutCrossConflicts = candidates;
  for (const conflict of exclusionConflicts) {
    const negative = withoutCrossConflicts.find((value) =>
      value.category === 'negatives' && value.valueId === conflict.negativeId,
    );
    if (!negative) continue;
    const positives = withoutCrossConflicts.filter((value) =>
      value !== negative
      && Boolean(findChoice(value.category, value.valueId)?.tags.includes(conflict.positiveTag)),
    );
    for (const positive of positives) {
      if (!withoutCrossConflicts.includes(negative)) break;
      const removed = comparePriority(negative, positive) >= 0 ? positive : negative;
      withoutCrossConflicts = withoutCrossConflicts.filter((value) => value !== removed);
      warnings.push(`「${negative.labelJa}」と「${positive.labelJa}」が競合するため、優先度の高い候補を残しました。`);
    }
  }

  const visible = withoutCrossConflicts.filter((value) => value.confidence >= 0.45);
  const resolved: InferredValue[] = [];
  for (const field of inferenceFields) {
    const group = visible.filter((value) => value.category === field).sort(sortValues);
    if (!group.length) continue;
    if (multiValueInferenceFields.has(field)) {
      resolved.push(...group.map((value) => ({
        ...value,
        candidateId: value.candidateId ?? `${value.category}:${value.valueId}`,
        adopted: value.confidence >= 0.78,
        locked: false,
      })));
      continue;
    }
    if (group.length > 1) {
      warnings.push(`${group[0].labelJa ?? field}を優先し、同じ項目の別候補を整理しました。`);
    }
    const equallyPlausible = group.length > 1
      && group[0].source === group[1].source
      && Math.abs(group[0].confidence - group[1].confidence) < 0.05;
    const requiresConfirmation = Boolean(group[0].requiresConfirmation || equallyPlausible);
    if (equallyPlausible) warnings.push(`${group[0].labelJa ?? field}には同程度の別解釈があるため、採用前に確認してください。`);
    resolved.push({
      ...group[0],
      candidateId: group[0].candidateId ?? `${group[0].category}:${group[0].valueId}`,
      adopted: !requiresConfirmation && group[0].confidence >= 0.78,
      locked: false,
      requiresConfirmation,
    });
  }

  return { values: resolved.sort(sortValues), warnings: [...new Set(warnings)] };
}
