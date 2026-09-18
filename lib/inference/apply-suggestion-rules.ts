import { compatibilityRules, type CompatibilitySelector } from '@/data/compatibility';
import { optionsByField } from '@/data/options';
import { scoreConfidence } from './score-confidence';
import type { Choice } from '@/lib/character-types';
import type { InferenceField, InferenceLevel, InferredValue } from './types';

const curatedCompatibilityTargets: Record<string, string> = {
  'species:elf>outfit': 'forest-elf-outfit',
  'species:elf>background': 'forest',
  'species:dark-elf>outfit': 'dark-elf-outfit',
  'species:dark-elf>background': 'ruins',
  'species:vampire>outfit': 'vampire-noble-attire',
  'species:vampire>background': 'moonlit-night',
  'species:angel>outfit': 'clergy',
  'species:angel>accessories': 'wings',
  'species:angel>background': 'heavenly-scene',
  'species:angel>lighting': 'holy-light',
  'species:fallen-angel>outfit': 'torn-clothes',
  'species:fallen-angel>background': 'ominous-sky',
  'species:demon>outfit': 'demon-lord-outfit',
  'species:demon>faceFeatures': 'horns',
  'species:ghost>outfit': 'kimono',
  'species:ghost>background': 'moonlit-night',
  'species:android>outfit': 'android-like-outfit',
  'species:android>background': 'scifi-city',
  'personality:gentle>expression': 'gentle-smile-2',
  'personality:friendly>expression': 'friendly-smile',
  'personality:confident>expression': 'bold-grin',
  'personality:confident>pose': 'arms-crossed',
  'personality:suspicious>expression': 'mysterious-smile',
  'personality:mad>expression': 'mad',
  'personality:tired>expression': 'tired',
  'personality:teacher-like>pose': 'glasses',
  'personality:scholarly>pose': 'reading',
  'outfit:teacher-like-outfit>accessories': 'book',
  'outfit:teacher-like-outfit>expression': 'gentle-smile-2',
  'outfit:mage>accessories': 'staff',
  'outfit:mage>pose': 'casting-magic',
  'outfit:mage>background': 'ruins',
  'outfit:court-mage-outfit>accessories': 'staff',
  'outfit:court-mage-outfit>pose': 'casting-magic',
  'outfit:court-mage-outfit>background': 'ruins',
  'outfit:knight>pose': 'posing-with-sword-ready',
  'outfit:knight>background': 'palace',
  'outfit:clergy>pose': 'prayer-pose',
  'outfit:clergy>background': 'church',
  'outfit:sister>pose': 'prayer-pose',
  'outfit:sister>background': 'church',
  'outfit:priest-outfit>pose': 'prayer-pose',
  'outfit:priest-outfit>background': 'church',
  'outfit:school>background': 'classroom',
  'outfit:suit>background': 'office',
  'outfit:doctor>background': 'hospital-room',
  'outfit:bartender-outfit>background': 'bar',
  'outfit:royal>background': 'palace',
  'outfit:cyberpunk>background': 'neon-lit-city',
  'outfit:idol>background': 'stage',
  'background:forest>lighting': 'dappled',
  'background:garden>lighting': 'soft',
  'background:palace>lighting': 'golden-light',
  'background:cathedral>lighting': 'holy-light',
  'background:moonlit-night>lighting': 'moon',
  'background:neon-lit-city>lighting': 'neon',
  'background:snow>lighting': 'cool-lighting',
  'background:desert>lighting': 'warm-lighting',
};

const choiceMatchesSelector = (choice: Choice, selector: CompatibilitySelector) => {
  if (selector.ids?.length && !selector.ids.includes(choice.id)) return false;
  if (selector.tags?.length && !selector.tags.some((tag) => choice.tags.includes(tag))) return false;
  return Boolean(selector.ids?.length || selector.tags?.length);
};

const inferredChoiceMatches = (value: InferredValue, selector: CompatibilitySelector) => {
  if (value.category !== selector.field) return false;
  const choice = optionsByField[value.category]?.find((item) => item.id === value.valueId);
  return Boolean(choice && choiceMatchesSelector(choice, selector));
};

const semanticChoiceScore = (choice: Choice, trigger: InferredValue, selector: CompatibilitySelector) => {
  if (trigger.valueId === 'elf' && choice.tags.includes('dark-elf')) return -1;
  const targetTokens = selector.ids?.length ? selector.ids : selector.tags ?? [];
  const exactTarget = targetTokens.some((token) => choice.id === token) ? 200 : 0;
  const targetInId = targetTokens.some((token) => choice.id.includes(token)) ? 100 : 0;
  const triggerInId = choice.id.includes(trigger.valueId) || trigger.valueId.includes(choice.id) ? 80 : 0;
  return exactTarget + targetInId + triggerInId;
};

const selectDeterministicChoice = (
  category: InferenceField,
  trigger: InferredValue,
  selector: CompatibilitySelector,
) => {
  const preferredId = curatedCompatibilityTargets[`${trigger.category}:${trigger.valueId}>${category}`];
  const choices = (optionsByField[category] ?? []).filter((item) => choiceMatchesSelector(item, selector));
  const preferred = preferredId ? choices.find((item) => item.id === preferredId) : undefined;
  if (preferred) return preferred;
  return choices
    .map((choice) => ({ choice, score: semanticChoiceScore(choice, trigger, selector) }))
    .filter((item) => item.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || (right.choice.specificity ?? 0) - (left.choice.specificity ?? 0)
      || right.choice.weight - left.choice.weight
      || left.choice.id.localeCompare(right.choice.id),
    )[0]?.choice;
};

export function applyCompatibilitySuggestions(values: InferredValue[], level: InferenceLevel) {
  if (level === 'strict') return [];
  const filled = new Set(values.map((value) => value.category));
  const bestByField = new Map<InferenceField, { value: InferredValue; multiplier: number }>();

  for (const rule of compatibilityRules) {
    const category = rule.target.field as InferenceField;
    if (rule.multiplier <= 1 || filled.has(category)) continue;
    if (!values.some((value) => inferredChoiceMatches(value, rule.when))) continue;
    const trigger = values.find((value) => inferredChoiceMatches(value, rule.when));
    if (!trigger) continue;
    const choice = selectDeterministicChoice(category, trigger, rule.target);
    if (!choice) continue;
    const value: InferredValue = {
      category,
      valueId: choice.id,
      labelJa: choice.labelJa,
      labelEn: choice.labelEn,
      source: 'suggested',
      confidence: scoreConfidence('suggested', level, category, {
        compatibility: true,
        strongAffinity: rule.multiplier >= 1.8,
        commonCompletion: rule.multiplier >= 1.4,
      }),
      reason: `${trigger?.labelJa ?? '読み取った設定'}と相性のよい候補です。`,
      reasonEn: `Suggested because it is compatible with ${trigger?.labelEn ?? 'the inferred settings'}.`,
    };
    const current = bestByField.get(category);
    if (!current || rule.multiplier > current.multiplier) {
      bestByField.set(category, { value, multiplier: rule.multiplier });
    }
  }

  return [...bestByField.values()].map((entry) => entry.value);
}
