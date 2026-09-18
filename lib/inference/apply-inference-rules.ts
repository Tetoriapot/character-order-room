import { findChoice } from '@/data/options';
import { scoreConfidence } from './score-confidence';
import type {
  InferenceField,
  InferenceLevel,
  InferenceSource,
  InferredValue,
} from './types';

type RuleTarget = {
  category: InferenceField;
  valueId: string;
  source: Exclude<InferenceSource, 'explicit'>;
  base?: number;
  natural?: boolean;
  compatibility?: boolean;
  strong?: boolean;
};

type InferenceRule = {
  when: { category: InferenceField; valueId: string };
  targets: RuleTarget[];
};

export const inferenceRules: InferenceRule[] = [
  {
    when: { category: 'outfit', valueId: 'teacher-like-outfit' },
    targets: [
      { category: 'personality', valueId: 'teacher-like', source: 'inferred', base: 0.7, natural: true },
      { category: 'background', valueId: 'classroom', source: 'suggested', compatibility: true },
      { category: 'faceFeatures', valueId: 'glasses', source: 'suggested', compatibility: true },
      { category: 'outfitDetails', valueId: 'simple', source: 'suggested', compatibility: true },
      { category: 'composition', valueId: 'bust', source: 'suggested' },
    ],
  },
  {
    when: { category: 'species', valueId: 'vampire' },
    targets: [
      { category: 'outfit', valueId: 'vampire-noble-attire', source: 'inferred', natural: true, compatibility: true },
      { category: 'background', valueId: 'moonlit-night', source: 'suggested', compatibility: true, strong: true },
      { category: 'lighting', valueId: 'moon', source: 'suggested', compatibility: true, strong: true },
      { category: 'faceFeatures', valueId: 'fangs', source: 'suggested', compatibility: true },
      { category: 'expression', valueId: 'cold-expression', source: 'suggested' },
      { category: 'outfitDetails', valueId: 'velvet', source: 'suggested', compatibility: true },
      { category: 'composition', valueId: 'waist', source: 'suggested' },
    ],
  },
  {
    when: { category: 'personality', valueId: 'tired' },
    targets: [
      { category: 'expression', valueId: 'tired', source: 'inferred', natural: true, compatibility: true },
      { category: 'eyeShape', valueId: 'sleepy-eyes', source: 'suggested', strong: true },
    ],
  },
  {
    when: { category: 'personality', valueId: 'gentle' },
    targets: [{ category: 'expression', valueId: 'gentle-smile-2', source: 'inferred', natural: true, compatibility: true }],
  },
  {
    when: { category: 'personality', valueId: 'friendly' },
    targets: [{ category: 'expression', valueId: 'friendly-smile', source: 'inferred', natural: true, compatibility: true }],
  },
  {
    when: { category: 'personality', valueId: 'holy' },
    targets: [
      { category: 'background', valueId: 'church', source: 'suggested', compatibility: true },
      { category: 'lighting', valueId: 'holy-light', source: 'suggested', compatibility: true, strong: true },
      { category: 'outfit', valueId: 'priest-outfit', source: 'suggested', compatibility: true },
    ],
  },
  {
    when: { category: 'outfit', valueId: 'sister' },
    targets: [
      { category: 'background', valueId: 'church', source: 'suggested', compatibility: true, strong: true },
      { category: 'lighting', valueId: 'light-through-stained-glass', source: 'suggested', compatibility: true },
      { category: 'outfitDetails', valueId: 'modest', source: 'suggested', compatibility: true },
      { category: 'composition', valueId: 'bust', source: 'suggested' },
    ],
  },
  {
    when: { category: 'outfit', valueId: 'court-mage-outfit' },
    targets: [
      { category: 'accessories', valueId: 'staff', source: 'suggested', compatibility: true },
      { category: 'pose', valueId: 'casting-magic', source: 'suggested', compatibility: true, strong: true },
      { category: 'outfitDetails', valueId: 'ornate', source: 'suggested', compatibility: true },
      { category: 'composition', valueId: 'full', source: 'suggested' },
    ],
  },
  {
    when: { category: 'background', valueId: 'moonlit-night' },
    targets: [{ category: 'lighting', valueId: 'moon', source: 'suggested', compatibility: true, strong: true }],
  },
  {
    when: { category: 'background', valueId: 'church' },
    targets: [{ category: 'lighting', valueId: 'light-through-stained-glass', source: 'suggested', compatibility: true }],
  },
];

const hasValue = (values: InferredValue[], category: InferenceField, valueId: string) =>
  values.some((value) => value.category === category && value.valueId === valueId);

export function applyInferenceRules(values: InferredValue[], level: InferenceLevel) {
  const generated: InferredValue[] = [];
  for (const rule of inferenceRules) {
    if (!hasValue(values, rule.when.category, rule.when.valueId)) continue;
    for (const target of rule.targets) {
      if (level === 'strict' && target.source === 'suggested') continue;
      const choice = findChoice(target.category, target.valueId);
      if (!choice) continue;
      generated.push({
        category: target.category,
        valueId: target.valueId,
        labelJa: choice.labelJa,
        labelEn: choice.labelEn,
        source: target.source,
        confidence: scoreConfidence(target.source, level, target.category, {
          base: target.base,
          naturalAssociation: target.natural,
          compatibility: target.compatibility,
          strongAffinity: target.strong,
        }),
        reason: `${findChoice(rule.when.category, rule.when.valueId)?.labelJa ?? rule.when.valueId}との組み合わせから補完しました。`,
        reasonEn: `Added because it pairs naturally with ${findChoice(rule.when.category, rule.when.valueId)?.labelEn ?? rule.when.valueId}.`,
      });
    }
  }
  return generated;
}
