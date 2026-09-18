import { translateFreeText } from '@/data/translations';
import { isSceneComposition } from '@/data/camera-expansion';
import { blankPerson, castChoiceLabel, castInteractions, castPositions, castRelationships, isCastActive, memberDraft, PERSON_CUSTOM_KEYS, PERSON_FIELDS, syncCast } from './character-cast';
import {
  englishFor,
  findChoice,
  labelFor,
  optionsByField,
} from '@/data/options';
import { normalizeAgeInput } from './age-utils';
import { buildAntiAiBlock, defaultStyleAvoid, defaultStyleAvoidJa, findAntiAiBlock, findStylePreset, normalizeStylePack } from './style-pack';
import {
  backgroundConflictsWithTime,
  lightingConflictsWithTime,
  resolveDraftConflicts,
} from './random-engine';
import type { CharacterDraft, Choice, ExportProfile, LockKey, OutputMode } from './character-types';

const compact = <T,>(values: Array<T | null | undefined | false>): T[] =>
  values.filter(Boolean) as T[];

const canonical = (value: string) => value
  .toLowerCase()
  .normalize('NFKC')
  .replace(/\b(a|an|the|with|and)\b/g, ' ')
  .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const uniqueSemantic = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = canonical(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const joinJa = (values: string[]) => {
  const items = uniqueSemantic(values);
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]}と${items[1]}`;
  return `${items.slice(0, -1).join('、')}、${items.at(-1)}`;
};

const joinEn = (values: string[]) => {
  const items = uniqueSemantic(values);
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

const sentenceJa = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[。！？!?]$/.test(trimmed) ? trimmed : `${trimmed}。`;
};

const sentenceEn = (value: string) => {
  const trimmed = value
    .trim()
    .replace(/。$/, '.')
    .replace(/！$/, '!')
    .replace(/？$/, '?');
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const article = (value: string) => (/^[aeiou]/i.test(value.trim()) ? 'an' : 'a');
const withArticle = (value: string) => `${article(value)} ${value}`;

const choicesFor = (field: LockKey, ids: string[]) => ids
  .map((id) => findChoice(field, id))
  .filter(Boolean) as Choice[];

const dedupeChoices = (choices: Choice[]) => {
  const winners = new Map<string, Choice>();
  for (const choice of choices) {
    for (const group of choice.groups ?? []) {
      const current = winners.get(group);
      if (!current || (choice.specificity ?? 1) > (current.specificity ?? 1)) winners.set(group, choice);
    }
  }
  const seen = new Set<string>();
  return choices.filter((choice) => {
    if ((choice.groups ?? []).some((group) => winners.get(group)?.id !== choice.id)) return false;
    const key = canonical(choice.labelEn);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const labelList = (field: LockKey, ids: string[], language: 'ja' | 'en') =>
  dedupeChoices(choicesFor(field, ids)).map((choice) => language === 'ja' ? choice.labelJa : choice.labelEn);

const genderJa = (gender: string) => ({
  male: '男性', female: '女性', androgynous: '中性的な人物', unspecified: '人物',
}[gender] ?? '人物');

const genderEn = (gender: string) => ({
  male: 'man', female: 'woman', androgynous: 'androgynous person', unspecified: 'person',
}[gender] ?? 'person');

const numericAgeSubjectJa = (age: number, gender: string) => {
  if (age <= 12) return gender === 'male' ? '男の子' : gender === 'female' ? '女の子' : '子ども';
  if (age <= 17) return gender === 'male' ? '少年' : gender === 'female' ? '少女' : '10代の人物';
  return genderJa(gender);
};

const numericAgeSubjectEn = (age: number, gender: string, asSpeciesDescriptor = false) => {
  if (asSpeciesDescriptor) return gender === 'male' ? 'male' : gender === 'female' ? 'female' : gender === 'androgynous' ? 'androgynous' : '';
  if (age <= 12) return gender === 'male' ? 'boy' : gender === 'female' ? 'girl' : gender === 'androgynous' ? 'androgynous child' : 'child';
  if (age <= 17) return gender === 'male' ? 'boy' : gender === 'female' ? 'girl' : gender === 'androgynous' ? 'androgynous teenager' : 'teenager';
  return genderEn(gender);
};

const buildJaSubject = (draft: CharacterDraft) => {
  const numericAge = normalizeAgeInput(draft.ageNumber);
  let subject: string;
  if (numericAge) {
    subject = `${numericAge}歳の${numericAgeSubjectJa(Number(numericAge), draft.gender)}`;
  } else {
    switch (draft.ageGroup) {
      case 'boy': subject = '少年'; break;
      case 'girl': subject = '少女'; break;
      case 'teen': subject = draft.gender === 'male' ? '10代の男性' : draft.gender === 'female' ? '10代の女性' : draft.gender === 'androgynous' ? '10代の中性的な人物' : '10代の人物'; break;
      case 'child': subject = draft.gender === 'male' ? '男の子' : draft.gender === 'female' ? '女の子' : '子ども'; break;
      case 'young': subject = draft.gender === 'male' ? '若い男性' : draft.gender === 'female' ? '若い女性' : '若い人物'; break;
      case 'adult': subject = draft.gender === 'male' ? '成人男性' : draft.gender === 'female' ? '成人女性' : draft.gender === 'androgynous' ? '成人の中性的な人物' : '成人の人物'; break;
      case 'middle': subject = draft.gender === 'male' ? '中年男性' : draft.gender === 'female' ? '中年女性' : '中年の人物'; break;
      case 'elderly': subject = draft.gender === 'male' ? '高齢男性' : draft.gender === 'female' ? '高齢女性' : '高齢の人物'; break;
      case 'ageless': subject = `年齢不詳の${genderJa(draft.gender)}`; break;
      default: subject = genderJa(draft.gender); break;
    }
  }
  const species = draft.species && draft.species !== 'human' ? labelFor('species', draft.species) : '';
  return species ? `${subject}で、種族は${species}` : subject;
};

const buildEnSubject = (draft: CharacterDraft) => {
  const numericAge = normalizeAgeInput(draft.ageNumber);
  const species = draft.species && draft.species !== 'human' ? englishFor('species', draft.species) : '';
  if (species) {
    const ageDescriptor = numericAge
      ? `${numericAge}-year-old`
      : ({ teen: 'teenage', boy: 'teenage', girl: 'teenage', child: 'young', young: 'young adult', adult: 'adult', middle: 'middle-aged', elderly: 'elderly', ageless: 'ageless' } as Record<string, string>)[draft.ageGroup] ?? '';
    const genderDescriptor = numericAge
      ? numericAgeSubjectEn(Number(numericAge), draft.gender, true)
      : draft.ageGroup === 'boy'
      ? 'male'
      : draft.ageGroup === 'girl'
        ? 'female'
        : draft.gender === 'male' ? 'male' : draft.gender === 'female' ? 'female' : draft.gender === 'androgynous' ? 'androgynous' : '';
    return [ageDescriptor, genderDescriptor, species].filter(Boolean).join(' ');
  }
  let subject: string;
  if (numericAge) {
    subject = `${numericAge}-year-old ${numericAgeSubjectEn(Number(numericAge), draft.gender)}`;
  } else {
    switch (draft.ageGroup) {
      case 'boy': subject = 'teenage boy'; break;
      case 'girl': subject = 'teenage girl'; break;
      case 'teen': subject = draft.gender === 'male' ? 'teenage boy' : draft.gender === 'female' ? 'teenage girl' : draft.gender === 'androgynous' ? 'androgynous teenager' : 'teenager'; break;
      case 'child': subject = draft.gender === 'male' ? 'young boy' : draft.gender === 'female' ? 'young girl' : 'child'; break;
      case 'young': subject = draft.gender === 'male' ? 'young man' : draft.gender === 'female' ? 'young woman' : 'young adult'; break;
      case 'adult': subject = draft.gender === 'male' ? 'adult man' : draft.gender === 'female' ? 'adult woman' : draft.gender === 'androgynous' ? 'adult androgynous person' : 'adult person'; break;
      case 'middle': subject = draft.gender === 'male' ? 'middle-aged man' : draft.gender === 'female' ? 'middle-aged woman' : 'middle-aged person'; break;
      case 'elderly': subject = draft.gender === 'male' ? 'elderly man' : draft.gender === 'female' ? 'elderly woman' : 'elderly person'; break;
      case 'ageless': subject = `ageless ${genderEn(draft.gender)}`; break;
      default: subject = genderEn(draft.gender); break;
    }
  }
  return subject;
};

const ensureHairPhrase = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return '';
  return /\bhair\b/i.test(cleaned) ? cleaned : `${cleaned} hair`;
};

const hairColorEn = (draft: CharacterDraft) =>
  labelList('hairColors', draft.hairColors, 'en').map(ensureHairPhrase);

const draftHasTag = (draft: CharacterDraft, tag: string) =>
  (Object.keys(optionsByField) as LockKey[]).some((field) => {
    if (field === 'negatives') return false;
    const raw = draft[field];
    const values = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
    return choicesFor(field, values).some((choice) => choice.tags.includes(tag));
  });

const splitCustomNegatives = (value: string) => value
  .split(/[,、。;；\n！？!?]+/)
  .map((item) => item.trim())
  .filter(Boolean);

const conceptPattern = (concept: 'wings' | 'horns' | 'animal-ears') => ({
  wings: /\bwing(?:s)?\b|翼/i,
  horns: /\bhorn(?:s)?\b|角/i,
  'animal-ears': /animal ears?|獣耳|けもの耳/i,
}[concept]);

const hasPositiveConcept = (
  concept: 'wings' | 'horns' | 'animal-ears',
  draft: CharacterDraft,
  customPositive: string[],
) => draftHasTag(draft, concept)
  || customPositive.some((value) => conceptPattern(concept).test(`${value} ${translateFreeText(value)}`));

const conflictsWithPositive = (value: string, draft: CharacterDraft, customPositive: string[]) =>
  (['wings', 'horns', 'animal-ears'] as const).some((concept) =>
    conceptPattern(concept).test(`${value} ${translateFreeText(value)}`)
    && hasPositiveConcept(concept, draft, customPositive),
  );

const negativeInstructionEn = (value: string) => {
  const cleaned = value.trim().replace(/[.!?]+$/, '');
  if (!cleaned) return '';
  if (/^single character only$/i.test(cleaned)) return 'Exactly one character';
  if (/^(?:no\b|avoid\b|do not\b|without\b|exactly\b)/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return `Avoid ${cleaned}`;
};

const tagPhrase = (value: string) => value
  .replace(/^(?:a|an|the)\s+/i, '')
  .replace(/\bthe\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim();

const excludeSemanticDuplicates = (values: string[], existing: string[]) => {
  const existingKeys = new Set(existing.map(canonical));
  return values.filter((value) => !existingKeys.has(canonical(value)));
};

const isEmptyBackground = (choice: Choice | undefined) =>
  Boolean(choice?.tags.some((tag) => ['transparent', 'no-background'].includes(tag)));

const isAtmosphericEffect = (choice: Choice) =>
  choice.tags.some((tag) => ['mist', 'rain', 'snow', 'smoke', 'flower', 'sparkles'].includes(tag))
  || /mist|fog|rain|snow|petals?|feathers?|embers?|smoke|particles?|霧|雨|雪|花びら|羽|火の粉|煙|粒子/i.test(`${choice.labelJa} ${choice.labelEn}`);

export type PromptOutputs = Record<OutputMode, string> & {
  positiveJa: string;
  negativeJa: string;
  positiveEn: string;
  negativeEn: string;
};

export type PromptNotice = {
  id: string;
  kind: 'excluded' | 'info' | 'translation';
  field?: LockKey;
  labelJa: string;
  labelEn: string;
  reasonJa: string;
  reasonEn: string;
};

const multiValueFields: LockKey[] = [
  'styleTraits', 'personality', 'hairColors', 'hairEffects', 'faceFeatures',
  'outfitColors', 'outfitDetails', 'accessories', 'lighting', 'negatives',
];

const fieldNames: Partial<Record<LockKey, [string, string]>> = {
  styleTraits: ['仕上げ', 'Style details'], personality: ['印象', 'Personality'],
  hairColors: ['髪色', 'Hair color'], hairEffects: ['髪の配色効果', 'Hair effects'],
  faceFeatures: ['顔・身体の特徴', 'Features'], outfitColors: ['衣装色', 'Outfit colors'],
  outfitDetails: ['衣装の詳細', 'Outfit details'], accessories: ['小物・身体特徴', 'Accessories'],
  lighting: ['光・演出', 'Lighting'], negatives: ['禁止事項', 'Constraints'],
};

const fieldName = (field: LockKey, language: 'ja' | 'en') =>
  fieldNames[field]?.[language === 'ja' ? 0 : 1] ?? field;

/** Returns user-facing explanations for values that are intentionally omitted or normalized. */
export function analyzePromptNotices(sourceDraft: CharacterDraft): PromptNotice[] {
  if (isCastActive(sourceDraft)) {
    const draft = syncCast({ draft: sourceDraft, locks: {} }).draft;
    const notices = draft.cast!.members.flatMap((member, index) => analyzePromptNotices(memberDraft(draft, member)).map((notice) => ({
      ...notice, id: `${member.id}-${notice.id}`, labelJa: `人物${index + 1}：${notice.labelJa}`, labelEn: `Person ${index + 1}: ${notice.labelEn}`,
    })));
    if (draft.negatives.includes('one-person') || draft.negatives.includes('no-people')) notices.push({
      id: 'cast-count-override', kind: 'excluded', field: 'negatives', labelJa: '人数指定を優先', labelEn: 'Group count takes priority',
      reasonJa: '複数人モードでは「人物は1人だけ」「人物なし」を出力せず、設定した人数を使います。', reasonEn: 'Single-person and no-people constraints are omitted; the configured group count is used.',
    });
    if (draft.cast!.interaction) notices.push({ id: 'cast-action-override', kind: 'info', field: 'pose', labelJa: '全員の動作を優先', labelEn: 'Group action takes priority', reasonJa: '個別ポーズとポーズ専用メモだけを出力から外します。表情と旧・表情／ポーズメモは保持して出力します。旧メモに動作が含まれる場合は、ポーズ専用欄へ移してください。', reasonEn: 'Individual poses and pose-only notes are omitted. Expressions and legacy mixed notes remain in output; move any legacy pose instructions into the pose-only field.' });
    return notices;
  }
  const draft = resolveDraftConflicts(sourceDraft);
  const activeStyle = findStylePreset(draft.stylePack?.presetId);
  const notices: PromptNotice[] = [];
  const add = (notice: PromptNotice) => {
    if (!notices.some((item) => item.id === notice.id)) notices.push(notice);
  };

  if (activeStyle) add({
    id: 'style-pack-overrides-classic', kind: 'info', field: 'style',
    labelJa: '画風ライブラリを優先', labelEn: 'Style library takes priority',
    reasonJa: '従来の絵柄・仕上げ・絵柄の自由入力は保持したまま、今回の出力には含めません。AVOIDには画風パック標準の禁止事項も追加します。',
    reasonEn: 'Classic style, traits, and custom style are retained but not output. The pack also adds its default exclusions.',
  });

  for (const field of multiValueFields) {
    const before = Array.isArray(sourceDraft[field]) ? sourceDraft[field] as string[] : [];
    const after = new Set(Array.isArray(draft[field]) ? draft[field] as string[] : []);
    for (const id of before.filter((value) => !after.has(value))) {
      const choice = findChoice(field, id);
      add({
        id: `normalized-${field}-${id}`,
        kind: 'excluded',
        field,
        labelJa: choice?.labelJa ?? id,
        labelEn: choice?.labelEn ?? id,
        reasonJa: `${fieldName(field, 'ja')}内の重複または肯定指定との矛盾を避けるため、出力から外しています。`,
        reasonEn: `Omitted to avoid a duplicate or a conflict with a positive ${fieldName(field, 'en').toLowerCase()} choice.`,
      });
    }
  }

  const backgroundOnly = draft.purpose === 'background';
  if (backgroundOnly) {
    add({
      id: 'background-only-person-fields',
      kind: 'info',
      labelJa: '人物関連の設定',
      labelEn: 'Character settings',
      reasonJa: '背景用途では人物・顔・衣装・表情・ポーズを保持したまま、今回の出力には含めません。',
      reasonEn: 'Background mode keeps character, face, outfit, expression, and pose settings but does not include them in this output.',
    });
    const hidden = compact([
      draft.cameraAngle ? ['cameraAngle', labelFor('cameraAngle', draft.cameraAngle), englishFor('cameraAngle', draft.cameraAngle)] as const : null,
      draft.composition && !isSceneComposition(draft.composition)
        ? ['composition', labelFor('composition', draft.composition), englishFor('composition', draft.composition)] as const : null,
      draft.generatedGap
        ? ['generatedGap', draft.generatedGap.labelJa, draft.generatedGap.labelEn] as const : null,
    ]);
    for (const [key, labelJa, labelEn] of hidden) {
      add({
        id: `background-hidden-${key}`,
        kind: 'excluded',
        field: key === 'generatedGap' ? undefined : key,
        labelJa,
        labelEn,
        reasonJa: '背景用途では人物向けの指定として扱うため、今回の出力から外しています。設定自体は保持されます。',
        reasonEn: 'Omitted as a character-oriented setting in background mode. The saved setting is preserved.',
      });
    }
    for (const [key, value] of Object.entries(draft.custom)) {
      if (!value.trim() || ['style', 'scene', 'negatives', 'gap', 'gapEn'].includes(key)) continue;
      add({
        id: `background-custom-${key}`,
        kind: 'excluded',
        labelJa: '人物向けの自由入力',
        labelEn: 'Character custom text',
        reasonJa: '背景用途では「絵柄」と「背景」の自由入力だけを出力します。この内容は保持されています。',
        reasonEn: 'Only style and scene custom text is output in background mode. This text remains saved.',
      });
    }
  }

  const backgroundChoice = draft.background ? findChoice('background', draft.background) : undefined;
  const timeChoice = draft.timeOfDay ? findChoice('timeOfDay', draft.timeOfDay) : undefined;
  const noScene = isEmptyBackground(backgroundChoice) || draft.aspectRatio === 'transparent';
  if (draft.aspectRatio === 'transparent' && backgroundChoice && !isEmptyBackground(backgroundChoice)) {
    add({
      id: 'transparent-background', kind: 'excluded', field: 'background',
      labelJa: backgroundChoice.labelJa, labelEn: backgroundChoice.labelEn,
      reasonJa: '透過出力が優先されるため、詳細な背景は出力から外しています。',
      reasonEn: 'Omitted because transparent output takes priority over a detailed background.',
    });
  }
  const backgroundContainsTime = Boolean(
    timeChoice && backgroundChoice
    && (canonical(backgroundChoice.labelEn).includes(canonical(timeChoice.labelEn))
      || backgroundChoice.tags.some((tag) => timeChoice.tags.includes(tag))),
  );
  if (noScene && timeChoice) {
    add({
      id: 'no-scene-time', kind: 'excluded', field: 'timeOfDay',
      labelJa: timeChoice.labelJa, labelEn: timeChoice.labelEn,
      reasonJa: '背景なし・透過出力では時間帯を描写しないため、出力から外しています。',
      reasonEn: 'Omitted because time-of-day is not rendered for transparent or no-background output.',
    });
  } else if (timeChoice && backgroundChoice && backgroundContainsTime) {
    add({
      id: 'background-includes-time', kind: 'info', field: 'timeOfDay',
      labelJa: timeChoice.labelJa, labelEn: timeChoice.labelEn,
      reasonJa: `背景「${backgroundChoice.labelJa}」に同じ時間表現が含まれるため、重複を避けて時間帯の単独出力を省いています。`,
      reasonEn: `Not repeated because “${backgroundChoice.labelEn}” already conveys the same time of day.`,
    });
  } else if (timeChoice && backgroundChoice && backgroundConflictsWithTime(timeChoice.id, backgroundChoice)) {
    add({
      id: 'background-time-conflict', kind: 'excluded', field: 'timeOfDay',
      labelJa: timeChoice.labelJa, labelEn: timeChoice.labelEn,
      reasonJa: `背景「${backgroundChoice.labelJa}」の時間表現と矛盾するため、時間帯を出力から外しています。`,
      reasonEn: `Omitted because it conflicts with the time implied by “${backgroundChoice.labelEn}”.`,
    });
  }

  for (const id of draft.lighting) {
    const choice = findChoice('lighting', id);
    if (!choice) continue;
    if (noScene) {
      add({
        id: `no-scene-light-${id}`, kind: 'excluded', field: 'lighting',
        labelJa: choice.labelJa, labelEn: choice.labelEn,
        reasonJa: '背景なし・透過出力では光や環境演出を描写しないため、出力から外しています。',
        reasonEn: 'Omitted because lighting is not rendered for transparent or no-background output.',
      });
    } else if (draft.timeOfDay && lightingConflictsWithTime(draft.timeOfDay, choice)) {
      add({
        id: `time-light-conflict-${id}`, kind: 'excluded', field: 'lighting',
        labelJa: choice.labelJa, labelEn: choice.labelEn,
        reasonJa: `時間帯「${timeChoice?.labelJa ?? draft.timeOfDay}」と矛盾するため、出力から外しています。`,
        reasonEn: `Omitted because it conflicts with “${timeChoice?.labelEn ?? draft.timeOfDay}”.`,
      });
    }
  }

  const customPositive = Object.entries(draft.custom)
    .filter(([key, value]) => !['negatives', 'gap', 'gapEn'].includes(key)
      && (!activeStyle || key !== 'style')
      && (!backgroundOnly || ['style', 'scene'].includes(key)) && value.trim())
    .map(([, value]) => value.trim());
  for (const id of draft.negatives) {
    const choice = findChoice('negatives', id);
    if (!choice) continue;
    const wrongPurpose = (backgroundOnly && id === 'one-person') || (!backgroundOnly && id === 'no-people');
    const positiveConflict = conflictsWithPositive(choice.labelEn, draft, customPositive);
    if (wrongPurpose || positiveConflict) {
      add({
        id: `negative-conflict-${id}`, kind: 'excluded', field: 'negatives',
        labelJa: choice.labelJa, labelEn: choice.labelEn,
        reasonJa: wrongPurpose ? '現在の用途と一致しない禁止事項のため、出力から外しています。' : '肯定指定と矛盾する禁止事項のため、肯定指定を優先しています。',
        reasonEn: wrongPurpose ? 'Omitted because this constraint does not match the current purpose.' : 'Omitted because it conflicts with a positive choice; the positive choice takes priority.',
      });
    }
  }

  for (const value of splitCustomNegatives(draft.custom.negatives ?? '')) {
    if (!conflictsWithPositive(value, draft, customPositive)) continue;
    add({
      id: `custom-negative-conflict-${canonical(value)}`,
      kind: 'excluded',
      field: 'negatives',
      labelJa: value,
      labelEn: translateFreeText(value),
      reasonJa: '肯定指定と矛盾する自由入力の禁止事項のため、肯定指定を優先して出力から外しています。',
      reasonEn: 'Omitted because this custom constraint conflicts with a positive choice; the positive choice takes priority.',
    });
  }

  for (const [key, value] of Object.entries(draft.custom)) {
    const trimmed = value.trim();
    if (!trimmed || ['negatives', 'gap', 'gapEn'].includes(key)
      || (activeStyle && key === 'style')
      || (backgroundOnly && !['style', 'scene', 'must', 'preference', 'layout'].includes(key))) continue;
    const translated = translateFreeText(trimmed);
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(translated)) {
      add({
        id: `translation-${key}`, kind: 'translation',
        labelJa: '自由入力', labelEn: 'Custom text',
        reasonJa: '辞書にない日本語が英語出力へ原文のまま残っています。コピー前に確認してください。',
        reasonEn: 'Some Japanese custom text is not in the local dictionary and remains unchanged in English output.',
      });
    }
  }

  const outputCustomNegatives = splitCustomNegatives(draft.custom.negatives ?? '')
    .filter((value) => !conflictsWithPositive(value, draft, customPositive));
  if (outputCustomNegatives.some((value) => /[\u3040-\u30ff\u3400-\u9fff]/.test(translateFreeText(value)))) {
    add({
      id: 'translation-negatives', kind: 'translation', field: 'negatives',
      labelJa: '自由入力の禁止事項', labelEn: 'Custom exclusions',
      reasonJa: '辞書にない日本語が英語の制約へ原文のまま残っています。コピー前に確認してください。',
      reasonEn: 'Some Japanese custom exclusions are not in the local dictionary and remain unchanged in English output.',
    });
  }

  return notices;
}

export function generatePrompts(sourceDraft: CharacterDraft, negativeContexts?: CharacterDraft[]): PromptOutputs {
  if (isCastActive(sourceDraft)) return generateCastPrompts(sourceDraft);
  const draft = resolveDraftConflicts(sourceDraft);
  const backgroundOnly = draft.purpose === 'background';
  const purposeJa = draft.purpose ? labelFor('purpose', draft.purpose) : '';
  const purposeEn = draft.purpose ? englishFor('purpose', draft.purpose) : '';
  const stylePack = normalizeStylePack(draft.stylePack);
  const activeStyle = findStylePreset(stylePack?.presetId);
  const styleJa = activeStyle?.nameJa ?? (draft.style ? labelFor('style', draft.style) : '');
  const styleEn = activeStyle?.stylePrompt ?? (draft.style ? englishFor('style', draft.style) : '');
  const styleTraitsJa = activeStyle ? [] : labelList('styleTraits', draft.styleTraits, 'ja');
  const styleTraitsEn = activeStyle ? [] : labelList('styleTraits', draft.styleTraits, 'en');
  const antiAiEn = activeStyle ? buildAntiAiBlock(stylePack?.antiAiIds ?? []) : '';
  const antiAiJa = activeStyle ? (stylePack?.antiAiIds ?? []).map((id) => findAntiAiBlock(id)?.nameJa).filter(Boolean).join('、') : '';
  const subjectJa = buildJaSubject(draft);
  const subjectEn = buildEnSubject(draft);
  const buildJa = draft.build ? labelFor('build', draft.build) : '';
  const buildEn = draft.build ? englishFor('build', draft.build) : '';
  const hairColorsJa = labelList('hairColors', draft.hairColors, 'ja');
  const hairColorsEn = hairColorEn(draft);
  const hairstyleJa = draft.hairstyle ? labelFor('hairstyle', draft.hairstyle) : '';
  const hairstyleEn = draft.hairstyle ? englishFor('hairstyle', draft.hairstyle) : '';
  const hairEffectsJa = labelList('hairEffects', draft.hairEffects, 'ja');
  const hairEffectsEn = labelList('hairEffects', draft.hairEffects, 'en');
  const eyeColorJa = draft.eyeColor ? labelFor('eyeColor', draft.eyeColor) : '';
  const eyeColorEn = draft.eyeColor ? englishFor('eyeColor', draft.eyeColor) : '';
  const eyeShapeJa = draft.eyeShape ? labelFor('eyeShape', draft.eyeShape) : '';
  const eyeShapeEn = draft.eyeShape ? englishFor('eyeShape', draft.eyeShape) : '';
  const eyeImpressionJa = draft.eyeImpression ? labelFor('eyeImpression', draft.eyeImpression) : '';
  const eyeImpressionEn = draft.eyeImpression ? englishFor('eyeImpression', draft.eyeImpression) : '';
  const faceJa = labelList('faceFeatures', draft.faceFeatures, 'ja');
  const faceEn = labelList('faceFeatures', draft.faceFeatures, 'en');
  const personalityJa = labelList('personality', draft.personality, 'ja');
  const personalityEn = labelList('personality', draft.personality, 'en');
  const outfitJa = draft.outfit ? labelFor('outfit', draft.outfit) : '';
  const outfitEn = draft.outfit ? englishFor('outfit', draft.outfit) : '';
  const outfitColorsJa = labelList('outfitColors', draft.outfitColors, 'ja');
  const outfitColorsEn = labelList('outfitColors', draft.outfitColors, 'en');
  const detailsJa = labelList('outfitDetails', draft.outfitDetails, 'ja');
  const detailsEn = labelList('outfitDetails', draft.outfitDetails, 'en');
  const accessoriesJa = excludeSemanticDuplicates(labelList('accessories', draft.accessories, 'ja'), detailsJa);
  const accessoriesEn = excludeSemanticDuplicates(labelList('accessories', draft.accessories, 'en'), detailsEn);
  const expressionJa = draft.expression ? labelFor('expression', draft.expression) : '';
  const expressionEn = draft.expression ? englishFor('expression', draft.expression) : '';
  const poseJa = draft.pose ? labelFor('pose', draft.pose) : '';
  const poseEn = draft.pose ? englishFor('pose', draft.pose) : '';
  const gazeJa = draft.gaze ? labelFor('gaze', draft.gaze) : '';
  const gazeEn = draft.gaze ? englishFor('gaze', draft.gaze) : '';
  const outputCameraAngle = backgroundOnly ? '' : draft.cameraAngle;
  const outputComposition = backgroundOnly && !isSceneComposition(draft.composition) ? '' : draft.composition;
  const cameraJa = compact([
    outputCameraAngle ? `視点：${labelFor('cameraAngle', outputCameraAngle)}` : '',
    outputComposition ? `構図：${labelFor('composition', outputComposition)}` : '',
    draft.aspectRatio ? `画面：${labelFor('aspectRatio', draft.aspectRatio)}` : '',
  ]);
  const cameraEn = compact([
    outputCameraAngle ? englishFor('cameraAngle', outputCameraAngle) : '',
    outputComposition ? englishFor('composition', outputComposition) : '',
    draft.aspectRatio ? englishFor('aspectRatio', draft.aspectRatio) : '',
  ]);
  const backgroundChoice = draft.background ? findChoice('background', draft.background) : undefined;
  const timeChoice = draft.timeOfDay ? findChoice('timeOfDay', draft.timeOfDay) : undefined;
  const backgroundJa = backgroundChoice?.labelJa ?? '';
  const backgroundEn = backgroundChoice?.labelEn ?? '';
  const noScene = isEmptyBackground(backgroundChoice) || draft.aspectRatio === 'transparent';
  const showBackground = Boolean(backgroundChoice && (draft.aspectRatio !== 'transparent' || isEmptyBackground(backgroundChoice)));
  const backgroundContainsTime = Boolean(
    timeChoice && backgroundChoice
    && (canonical(backgroundEn).includes(canonical(timeChoice.labelEn))
      || backgroundChoice.tags.some((tag) => timeChoice.tags.includes(tag))),
  );
  const showTime = Boolean(timeChoice && !noScene && !backgroundContainsTime
    && (!backgroundChoice || !backgroundConflictsWithTime(timeChoice.id, backgroundChoice)));
  const lightingChoices = noScene ? [] : dedupeChoices(choicesFor('lighting', draft.lighting))
    .filter((choice) => !draft.timeOfDay || !lightingConflictsWithTime(draft.timeOfDay, choice));
  const lightChoices = lightingChoices.filter((choice) => !isAtmosphericEffect(choice));
  const effectChoices = lightingChoices.filter(isAtmosphericEffect);
  const lightingJa = lightChoices.map((choice) => choice.labelJa);
  const lightingEn = lightChoices.map((choice) => choice.labelEn);
  const effectsJa = effectChoices.map((choice) => choice.labelJa);
  const effectsEn = effectChoices.map((choice) => choice.labelEn);
  const customEntries = Object.entries(draft.custom)
    .filter(([key, value]) => !['negatives', 'gap', 'gapEn'].includes(key)
      && (!activeStyle || key !== 'style')
      && (!backgroundOnly || ['style', 'scene', 'must', 'preference', 'layout'].includes(key))
      && value.trim())
    .map(([key, value]) => [key, value.trim()] as const);
  const legacyGapJa = draft.custom.gap?.trim().replace(/^ギャップ要素[：:]\s*/, '') ?? '';
  const legacyGapEn = draft.custom.gapEn?.trim().replace(/^Visual contrast:\s*/i, '') ?? '';
  const gapLabelJa = backgroundOnly ? '' : draft.generatedGap?.labelJa.trim() || legacyGapJa;
  const gapLabelEn = backgroundOnly ? '' : draft.generatedGap?.labelEn.trim() || legacyGapEn || (gapLabelJa ? translateFreeText(gapLabelJa) : '');
  const customPositive = compact([
    antiAiJa ? `画風の補助：${antiAiJa}` : '',
    gapLabelJa ? `ギャップ要素：${gapLabelJa}` : '',
    ...customEntries.map(([key, value]) => `${key === 'must' ? '必須条件：' : key === 'preference' ? '希望条件（可能なら）：' : ''}${value}`),
  ]);
  const customPositiveEn = compact([
    antiAiEn,
    gapLabelEn ? `Visual contrast: ${gapLabelEn}` : '',
    ...customEntries.map(([key, value]) => `${key === 'must' ? 'Required: ' : key === 'preference' ? 'Preferred if possible: ' : ''}${translateFreeText(value)}`),
  ]);

  const purposeLeadJa = purposeJa ? (purposeJa.endsWith('用') ? `${purposeJa}の` : `${purposeJa}向けの`) : '';
  const hasLeadDirection = Boolean(purposeJa || styleJa || styleTraitsJa.length);
  const hasSubjectDirection = Boolean(draft.ageNumber || draft.ageGroup || draft.gender || draft.species);
  const jaParts = compact([
    hasLeadDirection ? sentenceJa(`${purposeLeadJa}${styleJa || 'キャラクターイラスト'}${styleTraitsJa.length ? `。仕上げの特徴：${joinJa(styleTraitsJa)}` : ''}`) : '',
    !backgroundOnly && hasSubjectDirection ? sentenceJa(`人物：${subjectJa}`) : '',
    !backgroundOnly && buildJa ? sentenceJa(`体格：${buildJa}`) : '',
    !backgroundOnly && draft.skinTone ? sentenceJa(`肌：${labelFor('skinTone', draft.skinTone)}`) : '',
    !backgroundOnly && hairColorsJa.length ? sentenceJa(`髪色：${joinJa(hairColorsJa)}`) : '',
    !backgroundOnly && hairstyleJa ? sentenceJa(`髪型：${hairstyleJa}`) : '',
    !backgroundOnly && hairEffectsJa.length ? sentenceJa(`髪の配色・効果：${joinJa(hairEffectsJa)}`) : '',
    !backgroundOnly && eyeColorJa ? sentenceJa(`瞳の色：${eyeColorJa}`) : '',
    !backgroundOnly && eyeShapeJa ? sentenceJa(`目の形：${eyeShapeJa}`) : '',
    !backgroundOnly && eyeImpressionJa ? sentenceJa(`目元の印象：${eyeImpressionJa}`) : '',
    !backgroundOnly && faceJa.length ? sentenceJa(`顔・身体の特徴：${joinJa(faceJa)}`) : '',
    !backgroundOnly && personalityJa.length ? sentenceJa(`性格・雰囲気：${joinJa(personalityJa)}`) : '',
    !backgroundOnly && outfitJa ? sentenceJa(`衣装：${outfitColorsJa.length ? `${joinJa(outfitColorsJa)}を基調とした` : ''}${outfitJa}`) : '',
    !backgroundOnly && detailsJa.length ? sentenceJa(`衣装の素材・装飾：${joinJa(detailsJa)}`) : '',
    !backgroundOnly && accessoriesJa.length ? sentenceJa(`アクセサリー・持ち物・身体特徴：${joinJa(accessoriesJa)}`) : '',
    !backgroundOnly && expressionJa ? sentenceJa(`表情の指定：「${expressionJa}」`) : '',
    !backgroundOnly && poseJa ? sentenceJa(`ポーズ・動作：「${poseJa}」`) : '',
    !backgroundOnly && gazeJa ? sentenceJa(`視線の指定：「${gazeJa}」`) : '',
    cameraJa.length ? sentenceJa(`カメラ・構図：${cameraJa.join('／')}`) : '',
    showBackground ? sentenceJa(`背景：${backgroundJa}`) : '',
    showTime ? sentenceJa(`時間帯：${timeChoice?.labelJa ?? ''}`) : '',
    lightingJa.length ? sentenceJa(`照明：${joinJa(lightingJa)}`) : '',
    effectsJa.length ? sentenceJa(`環境演出：${joinJa(effectsJa)}`) : '',
    ...customPositive.map(sentenceJa),
  ]);

  const enParts = compact([
    (purposeEn || styleEn || styleTraitsEn.length) ? sentenceEn(`Create ${withArticle(purposeEn || 'character illustration')}${styleEn ? ` in ${styleEn}` : ''}${styleTraitsEn.length ? `, with ${joinEn(styleTraitsEn)}` : ''}`) : '',
    !backgroundOnly && hasSubjectDirection && subjectEn ? sentenceEn(`Subject: ${subjectEn}`) : '',
    !backgroundOnly && buildEn ? sentenceEn(`Build: ${buildEn}`) : '',
    !backgroundOnly && draft.skinTone ? sentenceEn(`Skin: ${englishFor('skinTone', draft.skinTone)}`) : '',
    !backgroundOnly && hairColorsEn.length ? sentenceEn(`Hair color: ${joinEn(hairColorsEn)}`) : '',
    !backgroundOnly && hairstyleEn ? sentenceEn(`Hairstyle: ${hairstyleEn}`) : '',
    !backgroundOnly && hairEffectsEn.length ? sentenceEn(`Hair color effects: ${joinEn(hairEffectsEn)}`) : '',
    !backgroundOnly && eyeColorEn ? sentenceEn(`Eye color: ${eyeColorEn}`) : '',
    !backgroundOnly && eyeShapeEn ? sentenceEn(`Eye shape: ${eyeShapeEn}`) : '',
    !backgroundOnly && eyeImpressionEn ? sentenceEn(`Eye impression: ${eyeImpressionEn}`) : '',
    !backgroundOnly && faceEn.length ? sentenceEn(`Facial and physical features: ${joinEn(faceEn)}`) : '',
    !backgroundOnly && personalityEn.length ? sentenceEn(`Personality and presence: ${joinEn(personalityEn)}`) : '',
    !backgroundOnly && outfitEn ? sentenceEn(`Outfit: ${outfitColorsEn.length ? `${joinEn(outfitColorsEn)} ` : ''}${outfitEn}`) : '',
    !backgroundOnly && detailsEn.length ? sentenceEn(`Outfit materials and details: ${joinEn(detailsEn)}`) : '',
    !backgroundOnly && accessoriesEn.length ? sentenceEn(`Accessories, props, and character details: ${joinEn(accessoriesEn)}`) : '',
    !backgroundOnly && expressionEn ? sentenceEn(`Expression: ${expressionEn}`) : '',
    !backgroundOnly && poseEn ? sentenceEn(`Pose/action: ${poseEn}`) : '',
    !backgroundOnly && gazeEn ? sentenceEn(`Gaze: ${gazeEn}`) : '',
    cameraEn.length ? sentenceEn(`Camera and composition: ${cameraEn.join('; ')}`) : '',
    showBackground ? sentenceEn(`Background: ${backgroundEn}`) : '',
    showTime ? sentenceEn(`Time of day: ${timeChoice?.labelEn ?? ''}`) : '',
    lightingEn.length ? sentenceEn(`Lighting: ${joinEn(lightingEn)}`) : '',
    effectsEn.length ? sentenceEn(`Atmospheric effects: ${joinEn(effectsEn)}`) : '',
    ...customPositiveEn.map((value) => sentenceEn(`Additional direction: ${value}`)),
  ]);

  const hasNegativeConflict = (value: string) => negativeContexts
    ? negativeContexts.some((context) => conflictsWithPositive(value, context, [...customPositive, ...Object.entries(context.custom).filter(([key]) => key !== 'negatives').map(([, text]) => text)]))
    : conflictsWithPositive(value, draft, customPositive);
  const fixedNegativeChoices = dedupeChoices(choicesFor('negatives', draft.negatives))
    .filter((choice) => backgroundOnly ? choice.id !== 'one-person' : choice.id !== 'no-people')
    .filter((choice) => !hasNegativeConflict(choice.labelEn));
  const customNegativeItems = splitCustomNegatives(draft.custom.negatives ?? '')
    .filter((value) => !hasNegativeConflict(value));
  const negativeItemsJa = uniqueSemantic([
    ...(activeStyle ? defaultStyleAvoidJa : []),
    ...fixedNegativeChoices.map((choice) => choice.labelJa),
    ...customNegativeItems,
  ]);
  const negativeInstructionsEn = uniqueSemantic([
    ...(activeStyle ? defaultStyleAvoid : []),
    ...fixedNegativeChoices.map((choice) => negativeInstructionEn(choice.labelEn)),
    ...customNegativeItems.map((value) => negativeInstructionEn(translateFreeText(value))),
  ]);
  const negativeJa = negativeItemsJa.length
    ? `必須の制約：${negativeItemsJa.map(sentenceJa).join('')}`
    : '';
  const negativeEn = negativeInstructionsEn.length
    ? `Constraints: ${negativeInstructionsEn.map(sentenceEn).join(' ')}`
    : '';
  const positiveJa = jaParts.join('');
  const positiveEn = enParts.join(' ');

  const translatedCustom = customPositiveEn;
  const sharedTokens = uniqueSemantic(compact([
    purposeEn,
    styleEn,
    ...styleTraitsEn,
    backgroundOnly || !hasSubjectDirection ? '' : subjectEn,
    backgroundOnly ? '' : buildEn,
    !backgroundOnly && draft.skinTone ? englishFor('skinTone', draft.skinTone) : '',
    ...(backgroundOnly ? [] : hairColorsEn),
    backgroundOnly ? '' : hairstyleEn,
    ...(backgroundOnly ? [] : hairEffectsEn),
    backgroundOnly ? '' : eyeColorEn,
    backgroundOnly ? '' : eyeShapeEn,
    backgroundOnly ? '' : eyeImpressionEn,
    ...(backgroundOnly ? [] : faceEn),
    ...(backgroundOnly ? [] : personalityEn),
    ...(backgroundOnly ? [] : outfitColorsEn),
    backgroundOnly ? '' : outfitEn,
    ...(backgroundOnly ? [] : detailsEn),
    ...(backgroundOnly ? [] : accessoriesEn),
    backgroundOnly ? '' : expressionEn,
    backgroundOnly ? '' : poseEn,
    backgroundOnly ? '' : gazeEn,
    ...cameraEn,
    showBackground ? backgroundEn : '',
    showTime ? timeChoice?.labelEn ?? '' : '',
    ...lightingEn,
    ...effectsEn,
  ]).map(tagPhrase));
  const short = `${sharedTokens.join(', ')}${translatedCustom.length ? `\nAdditional direction: ${translatedCustom.join('; ')}` : ''}${negativeInstructionsEn.length ? `\nConstraints: ${negativeInstructionsEn.join('; ')}` : ''}`;
  const tags = `${sharedTokens.join(', ')}${translatedCustom.length ? `\ncustom direction: ${translatedCustom.join('; ')}` : ''}${negativeInstructionsEn.length ? `\nConstraints: ${negativeInstructionsEn.join(', ')}` : ''}`;

  return {
    positiveJa,
    negativeJa,
    positiveEn,
    negativeEn,
    ja: [positiveJa, negativeJa].filter(Boolean).join('\n\n'),
    en: [positiveEn, negativeEn].filter(Boolean).join('\n\n'),
    both: (positiveJa || negativeJa || positiveEn || negativeEn)
      ? `【日本語】\n${[positiveJa, negativeJa].filter(Boolean).join('\n\n')}\n\n【English】\n${[positiveEn, negativeEn].filter(Boolean).join('\n\n')}`
      : '',
    short,
    tags,
  };
}

export function buildCastPromptParts(source: CharacterDraft) {
  const draft = syncCast({ draft: source, locks: {} }).draft;
  const cast = draft.cast!;
  const people = cast.members.map((member) => {
    const person = memberDraft(draft, member);
    return cast.interaction ? { ...person, pose: '', custom: { ...person.custom, pose: '' } } : person;
  });
  const incompatibleCount = /人物は?\s*[1一]人|人物なし|一人だけ|ひとり|複数.*(?:禁止|なし)|no people|single character|exactly one|\bsolo\b|no (?:other |extra )?(?:characters|people)|multiple (?:characters|people)/i;
  const shared = blankPerson(draft);
  shared.negatives = draft.negatives.filter((id) => !['one-person', 'no-people', 'avoid-multiple-heads'].includes(id));
  shared.custom = Object.fromEntries(Object.entries(shared.custom).filter(([key]) => !PERSON_CUSTOM_KEYS.includes(key)));
  shared.custom.negatives = splitCustomNegatives(draft.custom.negatives ?? '').filter((value) => !incompatibleCount.test(value)).join('\n');
  const common = generatePrompts(shared, people.map((person) => resolveDraftConflicts(person)));
  const individual = people.map((person) => generatePrompts({ ...person,
    ...Object.fromEntries((Object.keys(optionsByField) as LockKey[]).filter((field) => !PERSON_FIELDS.includes(field)).map((field) => [field, Array.isArray(person[field]) ? [] : ''])),
    stylePack: undefined, custom: Object.fromEntries(Object.entries(person.custom).filter(([key]) => PERSON_CUSTOM_KEYS.includes(key))),
  }));
  const groupJa = `登場人物は${cast.members.length}人。人物ごとの髪・瞳・衣装を混同しない。指定した人物以外は追加しない。`;
  const groupEn = `Exactly ${cast.members.length} distinct characters. Keep each person's hair, eyes, and clothing separate. Do not add any unlisted characters.`;
  const directions = (language: 'ja' | 'en') => [
    cast.relationship ? `${language === 'ja' ? '関係' : 'Relationship'}: ${castChoiceLabel(castRelationships, cast.relationship, language)}` : '',
    cast.interaction ? `${language === 'ja' ? '全員の動作' : 'Group action'}: ${castChoiceLabel(castInteractions, cast.interaction, language)}` : '',
    cast.relationshipNote ? `${language === 'ja' ? '関係の補足' : 'Relationship notes'}: ${language === 'ja' ? cast.relationshipNote : translateFreeText(cast.relationshipNote)}` : '',
  ].filter(Boolean).join('; ');
  const label = (index: number, language: 'ja' | 'en') => {
    const member = cast.members[index];
    const name = language === 'en' ? member.nameEn || member.name : member.name;
    return `${language === 'ja' ? '人物' : 'Person '}${index + 1}${name ? ` (${name})` : ''}${member.position ? ` — ${castChoiceLabel(castPositions, member.position, language)}` : ''}`;
  };
  return { cast, common, individual, groupJa, groupEn, directions, label };
}

function generateCastPrompts(source: CharacterDraft): PromptOutputs {
  const { common, individual, groupJa, groupEn, directions, label } = buildCastPromptParts(source);
  const positiveJa = [groupJa, common.positiveJa, directions('ja'), ...individual.map((output, index) => `【${label(index, 'ja')}】\n${output.positiveJa || '詳細は未指定。'}`)].filter(Boolean).join('\n\n');
  const positiveEn = [groupEn, common.positiveEn, directions('en'), ...individual.map((output, index) => `[${label(index, 'en')}]\n${output.positiveEn || 'Details unspecified.'}`)].filter(Boolean).join('\n\n');
  const compactGroup = (mode: 'short' | 'tags') => [groupEn, common[mode].replace(/\nConstraints:[\s\S]*$/i, ''), directions('en'), ...individual.map((output, index) => `[${label(index, 'en')}]: ${output[mode].replace(/\nConstraints:[\s\S]*$/i, '') || 'Details unspecified'}`), common.negativeEn].filter(Boolean).join('\n');
  const ja = [positiveJa, common.negativeJa].filter(Boolean).join('\n\n');
  const en = [positiveEn, common.negativeEn].filter(Boolean).join('\n\n');
  return { positiveJa, positiveEn, negativeJa: common.negativeJa, negativeEn: common.negativeEn,
    ja, en, both: `【日本語】\n${ja}\n\n【English】\n${en}`, short: compactGroup('short'), tags: compactGroup('tags') };
}

const aspectParameter = (aspectRatio: string) => ({
  square: '1:1', portrait: '2:3', landscape: '3:2', wide: '16:9',
  vertical: '9:16', transparent: '2:3',
}[aspectRatio] ?? '');

/** Formats the same generated content for common image tools without model-version-specific flags. */
export function formatProfileOutput(
  outputs: PromptOutputs,
  draft: CharacterDraft,
  profile: ExportProfile,
): {
  labelJa: string;
  labelEn: string;
  positive: string;
  negative: string;
  combined: string;
  hintJa: string;
  hintEn: string;
} {
  const negativeBody = outputs.negativeEn.replace(/^Constraints:\s*/i, '');
  const hasOutput = Boolean(outputs.positiveJa || outputs.negativeJa || outputs.positiveEn || outputs.negativeEn);
  const undesired = negativeBody
    .replace(/\bExactly one character\b/gi, 'multiple characters')
    .replace(/\b(?:Avoid|No|Do not|Without)\s+/gi, '')
    .replace(/[.;]+/g, ',')
    .replace(/,\s*,/g, ',')
    .trim();
  switch (profile) {
    case 'stable-diffusion':
      return {
        labelJa: 'Stable Diffusion', labelEn: 'Stable Diffusion',
        positive: outputs.tags.replace(/\nConstraints:[\s\S]*$/i, ''),
        negative: undesired,
        combined: `${outputs.tags.replace(/\nConstraints:[\s\S]*$/i, '')}${undesired ? `\n\nNegative prompt:\n${undesired}` : ''}`,
        hintJa: '肯定プロンプトとNegative promptを分けて貼り付けます。',
        hintEn: 'Paste the positive and negative prompts into their separate fields.',
      };
    case 'midjourney':
      return {
        labelJa: 'Midjourney', labelEn: 'Midjourney',
        positive: `${outputs.positiveEn}${aspectParameter(draft.aspectRatio) ? ` --ar ${aspectParameter(draft.aspectRatio)}` : ''}`,
        negative: undesired,
        combined: `${outputs.positiveEn}${undesired ? ` --no ${undesired}` : ''}${aspectParameter(draft.aspectRatio) ? ` --ar ${aspectParameter(draft.aspectRatio)}` : ''}`,
        hintJa: 'Discord等の /imagine prompt: の後へ貼り付けます。',
        hintEn: 'Paste after /imagine prompt: in Discord or the web prompt field.',
      };
    case 'novelai':
      return {
        labelJa: 'NovelAI', labelEn: 'NovelAI',
        positive: outputs.tags.replace(/\nConstraints:[\s\S]*$/i, ''),
        negative: undesired,
        combined: `${outputs.tags.replace(/\nConstraints:[\s\S]*$/i, '')}${undesired ? `\n\nUndesired Content:\n${undesired}` : ''}`,
        hintJa: '上段をPrompt、下段をUndesired Contentへ貼り付けます。',
        hintEn: 'Paste the first block into Prompt and the second into Undesired Content.',
      };
    case 'human-brief':
      return {
        labelJa: '人へ渡す依頼文', labelEn: 'Human-readable brief',
        positive: outputs.positiveJa,
        negative: outputs.negativeJa,
        combined: hasOutput
          ? `【依頼の要約】\n人数：${draft.purpose === 'background' ? '人物なし（背景のみ）' : isCastActive(draft) ? `${draft.cast!.members.length}人` : '1人'}${isCastActive(draft) ? `\n配置：${draft.cast!.members.map((member, index) => `人物${index + 1}${member.name ? `（${member.name}）` : ''}＝${castChoiceLabel(castPositions, member.position, 'ja')}`).join('／')}` : ''}\n必須：${draft.custom.must || '特になし'}\n希望（可能なら）：${draft.custom.preference || '特になし'}\n\n【制作内容】\n${outputs.positiveJa}\n\n【避けたい要素】\n${outputs.negativeJa || '特になし'}\n\n【参考用英語】\n${outputs.positiveEn}`
          : '',
        hintJa: 'イラストレーターへの依頼やチーム共有向けの読みやすい形式です。',
        hintEn: 'A readable format for illustrators and team handoffs.',
      };
    default:
      return {
        labelJa: '汎用', labelEn: 'Generic',
        positive: outputs.positiveEn,
        negative: outputs.negativeEn,
        combined: outputs.both,
        hintJa: '日本語と英語をまとめて保持する汎用形式です。',
        hintEn: 'A general-purpose format containing both Japanese and English.',
      };
  }
}
