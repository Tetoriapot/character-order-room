import { findChoice } from '@/data/options';
import { scoreConfidence } from './score-confidence';
import { isNegatedSpan } from './text-context';
import type { InferenceLevel, InferenceField, InferredValue } from './types';

const createRegexValue = (
  category: InferenceField,
  valueId: string,
  evidence: string,
  level: InferenceLevel,
  ambiguous = false,
): InferredValue | null => {
  const choice = findChoice(category, valueId);
  if (!choice) return null;
  return {
    category,
    valueId,
    labelJa: choice.labelJa,
    labelEn: choice.labelEn,
    source: 'explicit',
    confidence: scoreConfidence('explicit', level, category, { regex: true, ambiguous }),
    evidence,
    reason: `「${evidence}」の表現を読み取りました。`,
    reasonEn: `Read from the phrase “${evidence}”.`,
  };
};

const decadeToAgeGroup = (age: number, gender?: string) => {
  if (age < 10) return 'child';
  if (age < 20) return gender === 'female' ? 'girl' : gender === 'male' ? 'boy' : 'teen';
  if (age < 30) return 'young';
  if (age < 50) return 'adult';
  if (age < 70) return 'middle';
  return 'elderly';
};

const hairColorPatterns: Array<[RegExp, string]> = [
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*青みがかった黒(?:色)?/gu, 'blue-black-hair'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*黒(?:い|く|色)?/gu, 'black'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*白(?:い|く|色)?/gu, 'white'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*銀(?:色)?/gu, 'silver'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*金(?:色)?/gu, 'blonde'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*茶(?:色)?/gu, 'brown'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*赤(?:い|色)?/gu, 'red'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*青(?:い|色)?/gu, 'blue'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*緑(?:色)?/gu, 'green'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*紫(?:色)?/gu, 'purple'],
  [/(?:髪(?:色)?(?:は|が)?|髪の色(?:は|が)?)\s*ピンク(?:色)?/gu, 'pink'],
];

const eyeColorPatterns: Array<[RegExp, string]> = [
  [/(?:金色|金)(?:の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'gold'],
  [/(?:青色|青)(?:い|の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'blue'],
  [/(?:緑色|緑)(?:の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'green'],
  [/(?:赤色|赤)(?:い|の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'red'],
  [/(?:銀色|銀)(?:の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'silver'],
  [/琥珀色(?:の)?(?:切れ長|つり目|たれ目|丸い)?(?:の)?目/gu, 'amber'],
];

export function extractExplicitValues(
  text: string,
  level: InferenceLevel,
  knownValues: InferredValue[] = [],
) {
  const values: InferredValue[] = [];
  const warnings: string[] = [];
  const knownGenders = [...new Set(knownValues
    .filter((value) => value.category === 'gender' && ['male', 'female'].includes(value.valueId))
    .map((value) => value.valueId))];
  const knownGender = knownGenders.length === 1 ? knownGenders[0] : undefined;

  for (const match of text.matchAll(/(10|20|30|40|50|60|70|80|90)代(?:くらい|前半|後半)?/gu)) {
    const span = { start: match.index, end: match.index + match[0].length };
    if (isNegatedSpan(text, span)) {
      warnings.push(`「${match[0]}」は否定表現のため候補から外しました。`);
      continue;
    }
    const age = Number(match[1]);
    const value = createRegexValue('ageGroup', decadeToAgeGroup(age, knownGender), match[0], level);
    if (value) values.push(value);
  }

  for (const [pattern, valueId] of hairColorPatterns) {
    for (const match of text.matchAll(pattern)) {
      if (isNegatedSpan(text, { start: match.index, end: match.index + match[0].length })) {
        warnings.push(`「${match[0]}」は否定表現のため候補から外しました。`);
        continue;
      }
      const value = createRegexValue('hairColors', valueId, match[0], level);
      if (value) values.push(value);
    }
  }

  for (const match of text.matchAll(/髪(?:の長さ)?(?:は|が)?\s*(?:[^。！？\n、,]{1,8}?(?:くて|で)\s*)?(?:少し|やや)(?:長い|長め)/gu)) {
    if (isNegatedSpan(text, { start: match.index, end: match.index + match[0].length })) {
      warnings.push(`「${match[0]}」は否定表現のため候補から外しました。`);
      continue;
    }
    const value = createRegexValue('hairstyle', 'medium', match[0], level);
    if (value) values.push(value);
  }

  for (const [pattern, valueId] of eyeColorPatterns) {
    for (const match of text.matchAll(pattern)) {
      if (isNegatedSpan(text, { start: match.index, end: match.index + match[0].length })) {
        warnings.push(`「${match[0]}」は否定表現のため候補から外しました。`);
        continue;
      }
      const value = createRegexValue('eyeColor', valueId, match[0], level);
      if (value) values.push(value);
    }
  }

  return { values, warnings: [...new Set(warnings)] };
}
