import { englishFor, labelFor } from '@/data/options';
import type { CharacterSnapshot, LockKey, UiLanguage } from './character-types';
import { emptyStylePack, findAntiAiBlock, findStylePreset } from './style-pack';
import { blankPerson, castChoiceLabel, castInteractions, castPositions, castRelationships, memberDraft, PERSON_CUSTOM_KEYS, PERSON_FIELDS, syncCast } from './character-cast';

export type CharacterChange = {
  id: string;
  field?: LockKey;
  labelJa: string;
  labelEn: string;
  beforeJa: string;
  beforeEn: string;
  afterJa: string;
  afterEn: string;
};

export const fieldLabels: Record<LockKey, { ja: string; en: string }> = {
  purpose: { ja: '用途', en: 'Purpose' }, style: { ja: '絵柄', en: 'Style' },
  styleTraits: { ja: '仕上げ', en: 'Style details' }, gender: { ja: '性別', en: 'Gender' },
  ageGroup: { ja: '年齢層', en: 'Age group' }, ageNumber: { ja: '数値年齢', en: 'Numeric age' },
  species: { ja: '種族', en: 'Species' }, build: { ja: '体格', en: 'Build' },
  skinTone: { ja: '肌', en: 'Skin' }, personality: { ja: '印象', en: 'Personality' },
  hairColors: { ja: '髪色', en: 'Hair colors' }, hairEffects: { ja: '髪の配色効果', en: 'Hair effects' },
  hairstyle: { ja: '髪型', en: 'Hairstyle' }, eyeColor: { ja: '目の色', en: 'Eye color' },
  eyeShape: { ja: '目の形', en: 'Eye shape' }, eyeImpression: { ja: '目の印象', en: 'Eye impression' },
  faceFeatures: { ja: '顔の特徴', en: 'Features' }, outfit: { ja: '衣装', en: 'Outfit' },
  outfitColors: { ja: '衣装の色', en: 'Outfit colors' }, outfitDetails: { ja: '衣装の詳細', en: 'Outfit details' },
  accessories: { ja: 'アクセサリー', en: 'Accessories' }, expression: { ja: '表情', en: 'Expression' },
  pose: { ja: 'ポーズ', en: 'Pose' }, gaze: { ja: '視線', en: 'Gaze' },
  cameraAngle: { ja: 'カメラ角度', en: 'Camera angle' }, composition: { ja: '構図', en: 'Composition' },
  aspectRatio: { ja: '画面の縦横', en: 'Aspect ratio' }, background: { ja: '背景', en: 'Background' },
  timeOfDay: { ja: '時間帯', en: 'Time of day' }, lighting: { ja: '光・演出', en: 'Lighting' },
  negatives: { ja: '禁止事項', en: 'Constraints' },
};

const formatValue = (field: LockKey, value: string | string[], language: UiLanguage) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  if (!values.length) return language === 'ja' ? '指定なし' : 'Not set';
  if (field === 'ageNumber') return language === 'ja' ? `${values[0]}歳` : `${values[0]} years old`;
  return values.map((id) => language === 'ja' ? labelFor(field, id) : englishFor(field, id)).join(language === 'ja' ? '、' : ', ');
};

const sameValue = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const customFieldLabels: Record<string, { ja: string; en: string }> = {
  purpose: { ja: '用途の自由入力', en: 'Purpose notes' },
  style: { ja: '絵柄の自由入力', en: 'Custom style' },
  character: { ja: '人物の自由入力', en: 'Custom character' },
  appearance: { ja: '顔・髪の自由入力', en: 'Custom appearance' },
  outfit: { ja: '衣装の自由入力', en: 'Custom outfit' },
  action: { ja: '表情・ポーズの自由入力', en: 'Custom pose' },
  scene: { ja: '背景・光の自由入力', en: 'Custom scene' },
  negatives: { ja: '独自の禁止事項', en: 'Custom exclusions' },
};

export function diffSnapshots(before: CharacterSnapshot, after: CharacterSnapshot): CharacterChange[] {
  before = syncCast(before);
  after = syncCast(after);
  const changes: CharacterChange[] = [];
  const hasCast = Boolean(before.draft.cast || after.draft.cast);
  for (const field of Object.keys(fieldLabels) as LockKey[]) {
    if (hasCast && PERSON_FIELDS.includes(field)) continue;
    const previous = before.draft[field] as string | string[];
    const next = after.draft[field] as string | string[];
    if (!sameValue(previous, next)) {
      changes.push({
        id: `field-${field}`, field,
        labelJa: fieldLabels[field].ja, labelEn: fieldLabels[field].en,
        beforeJa: formatValue(field, previous, 'ja'), beforeEn: formatValue(field, previous, 'en'),
        afterJa: formatValue(field, next, 'ja'), afterEn: formatValue(field, next, 'en'),
      });
    }
    if (Boolean(before.locks[field]) !== Boolean(after.locks[field])) {
      changes.push({
        id: `lock-${field}`,
        field,
        labelJa: `${fieldLabels[field].ja}のロック`, labelEn: `${fieldLabels[field].en} lock`,
        beforeJa: before.locks[field] ? 'ロック中' : '未ロック', beforeEn: before.locks[field] ? 'Locked' : 'Unlocked',
        afterJa: after.locks[field] ? 'ロック中' : '未ロック', afterEn: after.locks[field] ? 'Locked' : 'Unlocked',
      });
    }
  }
  const customKeys = new Set([...Object.keys(before.draft.custom), ...Object.keys(after.draft.custom)]);
  for (const key of customKeys) {
    if (hasCast && PERSON_CUSTOM_KEYS.includes(key)) continue;
    if ((before.draft.custom[key] ?? '') === (after.draft.custom[key] ?? '')) continue;
    const labels = customFieldLabels[key] ?? { ja: '自由入力', en: 'Custom text' };
    changes.push({
      id: `custom-${key}`,
      labelJa: labels.ja, labelEn: labels.en,
      beforeJa: before.draft.custom[key] || '空欄', beforeEn: before.draft.custom[key] || 'Empty',
      afterJa: after.draft.custom[key] || '空欄', afterEn: after.draft.custom[key] || 'Empty',
    });
  }
  const beforeGap = before.draft.generatedGap;
  const afterGap = after.draft.generatedGap;
  if (!hasCast && (beforeGap?.seedId !== afterGap?.seedId || beforeGap?.labelJa !== afterGap?.labelJa)) {
    changes.push({
      id: 'generated-gap',
      labelJa: 'ギャップ案', labelEn: 'Contrast concept',
      beforeJa: beforeGap?.labelJa || 'なし', beforeEn: beforeGap?.labelEn || 'None',
      afterJa: afterGap?.labelJa || 'なし', afterEn: afterGap?.labelEn || 'None',
    });
  }
  const previousStyle = before.draft.stylePack ?? emptyStylePack();
  const nextStyle = after.draft.stylePack ?? emptyStylePack();
  if (previousStyle.presetId !== nextStyle.presetId) changes.push({
    id: 'style-pack', labelJa: '画風プリセット', labelEn: 'Style preset',
    beforeJa: findStylePreset(previousStyle.presetId)?.nameJa ?? '従来の絵柄',
    beforeEn: findStylePreset(previousStyle.presetId)?.nameEn ?? 'Classic style',
    afterJa: findStylePreset(nextStyle.presetId)?.nameJa ?? '従来の絵柄',
    afterEn: findStylePreset(nextStyle.presetId)?.nameEn ?? 'Classic style',
  });
  if (!sameValue(previousStyle.antiAiIds, nextStyle.antiAiIds)) changes.push({
    id: 'style-helpers', labelJa: '画風の補助', labelEn: 'Style helpers',
    beforeJa: previousStyle.antiAiIds.map((id) => findAntiAiBlock(id)?.nameJa).join('、') || 'なし',
    beforeEn: previousStyle.antiAiIds.map((id) => findAntiAiBlock(id)?.nameEn).join(', ') || 'None',
    afterJa: nextStyle.antiAiIds.map((id) => findAntiAiBlock(id)?.nameJa).join('、') || 'なし',
    afterEn: nextStyle.antiAiIds.map((id) => findAntiAiBlock(id)?.nameEn).join(', ') || 'None',
  });
  if (!sameValue(previousStyle.excludedBlocks, nextStyle.excludedBlocks)) changes.push({
    id: 'style-blocks', labelJa: 'コピーから除外するブロック', labelEn: 'Blocks excluded from copy',
    beforeJa: previousStyle.excludedBlocks.join('、') || 'なし', beforeEn: previousStyle.excludedBlocks.join(', ') || 'None',
    afterJa: nextStyle.excludedBlocks.join('、') || 'なし', afterEn: nextStyle.excludedBlocks.join(', ') || 'None',
  });
  if (hasCast) {
    const previous = before.draft.cast;
    const next = after.draft.cast;
    const push = (id: string, ja: string, en: string, beforeJa: string, afterJa: string, beforeEn = beforeJa, afterEn = afterJa) => {
      if (beforeJa !== afterJa || beforeEn !== afterEn) changes.push({ id, labelJa: ja, labelEn: en, beforeJa, afterJa, beforeEn, afterEn });
    };
    push('cast-mode', '人数モード', 'Character count mode', previous?.enabled ? `${previous.members.length}人` : '1人', next?.enabled ? `${next.members.length}人` : '1人', previous?.enabled ? `${previous.members.length} people` : 'One person', next?.enabled ? `${next.members.length} people` : 'One person');
    for (const [field, choices, ja, en] of [
      ['relationship', castRelationships, '人物同士の関係', 'Relationship'], ['interaction', castInteractions, '全員の動作', 'Group action'],
    ] as const) push(`cast-${field}`, ja, en, castChoiceLabel(choices, previous?.[field] ?? '', 'ja'), castChoiceLabel(choices, next?.[field] ?? '', 'ja'), castChoiceLabel(choices, previous?.[field] ?? '', 'en'), castChoiceLabel(choices, next?.[field] ?? '', 'en'));
    const ids = [...new Set([...(next?.members ?? []).map((item) => item.id), ...(previous?.members ?? []).map((item) => item.id)])];
    for (const [index, id] of ids.entries()) {
      const oldMember = previous?.members.find((member) => member.id === id);
      const newMember = next?.members.find((member) => member.id === id);
      const ja = `人物${index + 1}`;
      const en = `Person ${index + 1}`;
      push(`cast-${id}-present`, ja, en, oldMember ? 'あり' : 'なし', newMember ? 'あり' : 'なし', oldMember ? 'Present' : 'None', newMember ? 'Present' : 'None');
      push(`cast-${id}-name`, `${ja}の識別名`, `${en} label`, oldMember?.name ?? '', newMember?.name ?? '');
      push(`cast-${id}-position`, `${ja}の配置`, `${en} placement`, castChoiceLabel(castPositions, oldMember?.position ?? '', 'ja'), castChoiceLabel(castPositions, newMember?.position ?? '', 'ja'), castChoiceLabel(castPositions, oldMember?.position ?? '', 'en'), castChoiceLabel(castPositions, newMember?.position ?? '', 'en'));
      const base = { ...after.draft, cast: undefined };
      const oldDraft = oldMember ? memberDraft(base, oldMember) : !previous && index === 0 ? { ...base, ...Object.fromEntries(PERSON_FIELDS.map((field) => [field, before.draft[field]])), custom: { ...base.custom, ...Object.fromEntries(PERSON_CUSTOM_KEYS.map((key) => [key, before.draft.custom[key] ?? ''])) }, generatedGap: before.draft.generatedGap } : blankPerson(base);
      const newDraft = newMember ? memberDraft(base, newMember) : !next && index === 0 ? base : blankPerson(base);
      changes.push(...diffSnapshots({ draft: oldDraft, locks: oldMember?.locks ?? {} }, { draft: newDraft, locks: newMember?.locks ?? {} }).map((change) => ({ ...change, id: `cast-${id}-${change.id}`, labelJa: `${ja}：${change.labelJa}`, labelEn: `${en}: ${change.labelEn}` })));
    }
  }
  return changes;
}

export function snapshotSummary(snapshot: CharacterSnapshot, language: UiLanguage = 'ja') {
  const { draft } = snapshot;
  const parts = [
    draft.cast?.enabled ? (language === 'ja' ? `${draft.cast.members.length}人` : `${draft.cast.members.length} people`) : '',
    language === 'ja' ? findStylePreset(draft.stylePack?.presetId)?.nameJa : findStylePreset(draft.stylePack?.presetId)?.nameEn,
    formatValue('purpose', draft.purpose, language),
    formatValue('species', draft.species, language),
    formatValue('outfit', draft.outfit, language),
    formatValue('expression', draft.expression, language),
  ].filter(Boolean);
  return parts.join(language === 'ja' ? '・' : ' · ');
}
