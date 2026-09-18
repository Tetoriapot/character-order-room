import type { InferenceField, InferenceLevel, InferenceSource } from './types';

type ConfidenceFactors = {
  base?: number;
  exact?: boolean;
  regex?: boolean;
  longPhrase?: boolean;
  occurrences?: number;
  consistent?: boolean;
  naturalAssociation?: boolean;
  compatibility?: boolean;
  supportedByTwo?: boolean;
  themeAligned?: boolean;
  strongAffinity?: boolean;
  commonCompletion?: boolean;
  ambiguous?: boolean;
  multipleInterpretations?: boolean;
  competing?: boolean;
  lowCompatibility?: boolean;
  noContext?: boolean;
};

const sourceBase: Record<InferenceSource, number> = {
  explicit: 0.92,
  inferred: 0.68,
  suggested: 0.48,
};

const levelMultiplier: Record<InferenceLevel, Record<InferenceSource, number>> = {
  strict: { explicit: 1, inferred: 0.78, suggested: 0.45 },
  standard: { explicit: 1, inferred: 1, suggested: 0.9 },
  rich: { explicit: 1, inferred: 1.08, suggested: 1.15 },
};

const inferredCaps: Partial<Record<InferenceField, number>> = {
  hairstyle: 0.92,
  eyeShape: 0.92,
  outfit: 0.92,
  personality: 0.92,
  background: 0.86,
  lighting: 0.86,
  pose: 0.86,
  composition: 0.72,
  accessories: 0.72,
  outfitDetails: 0.72,
};

const clamp = (value: number, maximum = 1) => Math.max(0, Math.min(maximum, value));

export function scoreConfidence(
  source: InferenceSource,
  level: InferenceLevel,
  category: InferenceField,
  factors: ConfidenceFactors = {},
) {
  let score = factors.base ?? sourceBase[source];
  if (factors.exact) score += 0.08;
  if (factors.regex) score += 0.06;
  if (factors.longPhrase) score += 0.1;
  if ((factors.occurrences ?? 0) > 1) score += 0.05;
  if (factors.consistent) score += 0.04;
  if (factors.naturalAssociation) score += 0.06;
  if (factors.compatibility) score += 0.08;
  if (factors.supportedByTwo) score += 0.1;
  if (factors.themeAligned) score += 0.05;
  if (factors.strongAffinity) score += 0.1;
  if (factors.commonCompletion) score += 0.06;
  if (level === 'rich' && source === 'suggested') score += 0.08;
  if (factors.ambiguous) score -= 0.12;
  if (factors.multipleInterpretations) score -= 0.1;
  if (factors.competing) score -= 0.08;
  if (factors.lowCompatibility) score -= 0.1;
  if (factors.noContext) score -= 0.06;

  score *= levelMultiplier[level][source];
  const maximum = source === 'explicit' ? 1 : inferredCaps[category] ?? 1;
  return Number(clamp(score, maximum).toFixed(2));
}

export function confidenceLabel(confidence: number, language: 'ja' | 'en') {
  if (confidence >= 0.9) return language === 'ja' ? '非常に高い' : 'Very high';
  if (confidence >= 0.75) return language === 'ja' ? '高い' : 'High';
  if (confidence >= 0.55) return language === 'ja' ? '中程度' : 'Medium';
  if (confidence >= 0.35) return language === 'ja' ? '低め' : 'Low';
  return language === 'ja' ? '弱い' : 'Weak';
}
