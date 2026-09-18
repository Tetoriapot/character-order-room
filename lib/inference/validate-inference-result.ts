import { findChoice } from '@/data/options';
import { normalizeInferenceText } from './normalize-text';
import { inferenceFields } from './types';
import type {
  InferenceField,
  InferenceInput,
  InferenceLevel,
  InferenceResult,
  InferenceSource,
  InferredValue,
} from './types';

const sources = new Set<InferenceSource>(['explicit', 'inferred', 'suggested']);
const levels = new Set<InferenceLevel>(['strict', 'standard', 'rich']);
const fields = new Set<string>(inferenceFields);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function validateInferenceResult(value: unknown, fallback: InferenceInput): InferenceResult {
  const record = isRecord(value) ? value : {};
  const rawValues = Array.isArray(record.values) ? record.values : [];
  const values: InferredValue[] = [];
  let discarded = 0;

  for (const rawValue of rawValues) {
    if (!isRecord(rawValue)
      || typeof rawValue.category !== 'string'
      || !fields.has(rawValue.category)
      || typeof rawValue.valueId !== 'string'
      || typeof rawValue.source !== 'string'
      || !sources.has(rawValue.source as InferenceSource)
      || typeof rawValue.confidence !== 'number'
      || !Number.isFinite(rawValue.confidence)) {
      discarded += 1;
      continue;
    }
    const category = rawValue.category as InferenceField;
    const choice = findChoice(category, rawValue.valueId);
    if (!choice) {
      discarded += 1;
      continue;
    }
    const confidence = Math.min(1, Math.max(0, rawValue.confidence));
    const requiresConfirmation = Boolean(rawValue.requiresConfirmation);
    values.push({
      candidateId: typeof rawValue.candidateId === 'string' && rawValue.candidateId
        ? rawValue.candidateId
        : `${category}:${choice.id}`,
      category,
      valueId: choice.id,
      labelJa: choice.labelJa,
      labelEn: choice.labelEn,
      source: rawValue.source as InferenceSource,
      confidence,
      evidence: typeof rawValue.evidence === 'string' ? rawValue.evidence : undefined,
      reason: typeof rawValue.reason === 'string' ? rawValue.reason : undefined,
      reasonEn: typeof rawValue.reasonEn === 'string' ? rawValue.reasonEn : undefined,
      adopted: requiresConfirmation
        ? false
        : typeof rawValue.adopted === 'boolean' ? rawValue.adopted : confidence >= 0.78,
      locked: Boolean(rawValue.locked),
      requiresConfirmation,
    });
  }

  const warnings = Array.isArray(record.warnings)
    ? record.warnings.filter((warning): warning is string => typeof warning === 'string')
    : [];
  if (discarded) warnings.push(`${discarded}件の無効な候補を安全のため除外しました。`);

  return {
    rawText: typeof record.rawText === 'string' ? record.rawText : fallback.text,
    normalizedText: typeof record.normalizedText === 'string'
      ? record.normalizedText
      : normalizeInferenceText(fallback.text),
    level: typeof record.level === 'string' && levels.has(record.level as InferenceLevel)
      ? record.level as InferenceLevel
      : fallback.level,
    values: [...new Map(values.map((candidate) => [`${candidate.category}:${candidate.valueId}`, candidate])).values()],
    warnings: [...new Set(warnings)],
  };
}
