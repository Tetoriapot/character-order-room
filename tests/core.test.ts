import assert from 'node:assert/strict';
import './safety-checks';
import './style-pack-checks';
import {
  accessories,
  backgrounds,
  eyeColors,
  expressions,
  findChoice,
  hairColors,
  hairstyles,
  lighting,
  negatives,
  optionsByField,
  outfits,
  personalities,
  poses,
} from '@/data/options';
import { gapSeeds } from '@/data/gapSeeds';
import { gapBlueprints } from '@/data/gapBlueprints';
import { builtInPresets, defaultDraft } from '@/data/presets';
import { themes } from '@/data/randomThemes';
import { inferenceAliases } from '@/data/inference-aliases';
import { translateFreeText, translations } from '@/data/translations';
import { analyzePromptNotices, formatProfileOutput, generatePrompts } from '@/lib/prompt-engine';
import { isMinorAge, normalizeAgeInput } from '@/lib/age-utils';
import {
  backgroundConflictsWithTime,
  calculateFinalWeight,
  chooseGapMode,
  clearGeneratedGap,
  discardGeneratedGap,
  generateGap,
  generateBatchVariations,
  generatedGapConflictsWithAge,
  getDiversityMultiplier,
  getThemeMultiplier,
  lightingConflictsWithTime,
  randomizeAll,
  randomizeField,
  reconcileGeneratedGapDerivedChanges,
  releaseGeneratedGapField,
  resolveDraftConflicts,
  weightedPick,
  type WeightContext,
} from '@/lib/random-engine';
import { applyPurposeRecommendation } from '@/lib/purpose-engine';
import {
  BACKGROUND_GUIDED_SECTIONS,
  CHARACTER_GUIDED_SECTIONS,
  createBlankSnapshot,
  guidedSectionsForPurpose,
  normalizeGuidedStep,
  selectGuidedPurpose,
} from '@/lib/guided-builder';
import {
  appendHistory,
  decodeShareSnapshot,
  encodeShareSnapshot,
  exportStudioData,
  hydrateDraft,
  parseHistory,
  parsePresets,
  parseSnapshot,
  parseStudioPreferences,
  parseStudioImport,
} from '@/lib/storage';
import {
  commitEditorTimeline,
  createEditorTimeline,
  redoEditorTimeline,
  undoEditorTimeline,
} from '@/lib/editor-timeline';
import { getShortcutAction } from '@/lib/shortcuts';
import { inferFromNote } from '@/lib/inference/infer-from-note';
import { inferenceRules } from '@/lib/inference/apply-inference-rules';
import { mergeInferenceIntoFormState } from '@/lib/inference/merge-into-form-state';
import { resolveInferenceConflicts } from '@/lib/inference/resolve-conflicts';
import { validateInferenceResult } from '@/lib/inference/validate-inference-result';
import type { InferenceDecision, InferenceResult } from '@/lib/inference/types';
import type {
  CharacterDraft,
  CharacterSnapshot,
  Choice,
  HistoryEntry,
  LockKey,
} from '@/lib/character-types';

const counts = {
  personalities: personalities.length,
  hairstyles: hairstyles.length,
  hairColors: hairColors.length,
  eyes: eyeColors.length,
  outfits: outfits.length,
  accessories: accessories.length,
  expressions: expressions.length,
  poses: poses.length,
  backgrounds: backgrounds.length,
  lighting: lighting.length,
  negatives: negatives.length,
  presets: builtInPresets.length,
  themes: themes.length,
  gapSeeds: gapSeeds.length,
  translations: translations.length,
};

assert.ok(counts.personalities >= 80, '性格・属性80件以上');
assert.ok(counts.hairstyles >= 72, '髪型72件以上');
assert.ok(counts.hairColors >= 36, '髪色36件以上');
assert.ok(counts.eyes >= 24, '目の色24件以上');
assert.ok(counts.outfits >= 120, '衣装120件以上');
assert.ok(counts.accessories >= 60, 'アクセサリー60件以上');
assert.ok(counts.expressions >= 80, '表情80件以上');
assert.ok(counts.poses >= 100, 'ポーズ100件以上');
assert.ok(counts.backgrounds >= 90, '背景90件以上');
assert.ok(counts.lighting >= 50, '光・演出50件以上');
assert.ok(counts.negatives >= 60, '禁止事項60件以上');
assert.equal(counts.presets, 30, '初期プリセット30件');
assert.equal(counts.themes, 40, 'テーマ40件');
assert.ok(themes.every((theme) => !/[ぁ-んァ-ン一-龯]/.test(theme.labelEn)), '全テーマに英語表示名');
assert.equal(counts.gapSeeds, 50, 'ギャップネタ50件');
assert.ok(counts.translations >= 300, '端末内翻訳辞書300件以上');

for (const [field, options] of Object.entries(optionsByField) as Array<[LockKey, Choice[]]>) {
  const ids = new Set<string>();
  for (const option of options) {
    assert.ok(option.id && option.labelJa && option.labelEn, field + 'の固定データが完全');
    assert.ok(Array.isArray(option.tags), field + '/' + option.id + 'にtags');
    assert.ok(Number.isFinite(option.weight) && option.weight > 0, field + '/' + option.id + 'に正のweight');
    assert.ok(!ids.has(option.id), field + '内のIDが一意: ' + option.id);
    ids.add(option.id);
  }
}

assert.equal(gapBlueprints.length, gapSeeds.length, '全ギャップに構造化定義がある');
for (let index = 0; index < gapBlueprints.length; index += 1) {
  const blueprint = gapBlueprints[index];
  const seedItem = gapSeeds[index];
  assert.equal(blueprint.id, seedItem.id, `ギャップ${index + 1}のIDが一致`);
  assert.equal(blueprint.segments.length, seedItem.segments.length, `ギャップ${index + 1}の文節数が一致`);
  const assignmentFields = new Set<LockKey>();
  for (const segment of blueprint.segments) {
    assert.ok(segment.fields.length > 0, `ギャップ${index + 1}の全ての文節にロック対象がある`);
    for (const assignment of segment.assignments) {
      assignmentFields.add(assignment.field);
      assert.ok(segment.fields.includes(assignment.field), `ギャップ${index + 1}の割当項目が文節対象に含まれる`);
      assert.ok(
        optionsByField[assignment.field]?.some((option) => option.id === assignment.optionId),
        `ギャップ${index + 1}の${assignment.field}/${assignment.optionId}が固定データに存在`,
      );
    }
  }
  assert.ok(assignmentFields.size >= 2, `ギャップ${index + 1}は2項目以上を構造変更する`);
}

const missingPresetIds: string[] = [];
for (const preset of builtInPresets) {
  for (const [rawField, value] of Object.entries(preset.snapshot.draft)) {
    if (rawField === 'custom' || rawField === 'generatedGap') continue;
    const field = rawField as LockKey;
    const options = optionsByField[field];
    if (!options) continue;
    const ids = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : typeof value === 'string' && value ? [value] : [];
    for (const id of ids) {
      if (!options.some((option) => option.id === id)) missingPresetIds.push(preset.name + '/' + field + '/' + id);
    }
  }
}
assert.deepEqual(missingPresetIds, [], '全プリセット参照が固定データに存在');

const outputs = generatePrompts(defaultDraft);
for (const value of Object.values(outputs)) {
  assert.ok(value.length > 0, '各出力モードが空でない');
  assert.ok(!value.includes('undefined'), 'undefinedを出力しない');
  assert.ok(!/\bhair\s+hair\b/i.test(value), 'hair hairを出力しない');
  assert.ok(!/\beyes\s+eyes\b/i.test(value), 'eyes eyesを出力しない');
}
assert.match(outputs.ja, /成人男性/);
assert.match(outputs.ja, /黒/);
assert.match(outputs.ja, /必須の制約/);
assert.ok(!/[、]{2,}|[。]{2,}/.test(outputs.ja), '不自然な句読点なし');
assert.match(outputs.en, /adult man/i);
assert.match(outputs.en, /black/i);
assert.match(outputs.en, /Constraints:/);
assert.doesNotMatch(outputs.en, /Avoid:\s*(?:no|avoid|do not|exactly)/i, 'ネガティブ命令を二重否定にしない');
assert.ok(!/\ba adult\b/i.test(outputs.en), 'a adultは出力しない');
assert.ok(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(outputs.en), '固定生成の英語出力に日本語が混ざらない');
assert.match(outputs.both, /【日本語】/);
assert.match(outputs.both, /【English】/);
assert.match(outputs.short, /adult man/i);
assert.match(outputs.tags, /vibrant anime style/i);
assert.ok(!/\b(?:a|an|the|They)\b/.test(outputs.tags.split('\n')[0]), 'Tagsは冠詞・主語なし');
assert.equal(outputs.tags, generatePrompts(defaultDraft).tags, 'Tagsの並び順は安定');

const draftWith = (partial: Partial<CharacterDraft>): CharacterDraft => ({
  ...structuredClone(defaultDraft),
  ...partial,
  custom: { ...defaultDraft.custom, ...partial.custom },
});

const idFor = (field: LockKey, labelJa: string) => {
  const option = optionsByField[field]?.find((item) => item.labelJa === labelJa);
  assert.ok(option, field + 'に「' + labelJa + '」が存在');
  return option.id;
};

const idMatching = (field: LockKey, pattern: RegExp) => {
  const option = optionsByField[field]?.find((item) => pattern.test(`${item.labelJa} ${item.labelEn}`));
  assert.ok(option, `${field}に${pattern}へ一致する候補が存在`);
  return option.id;
};

// A: 成人男性 / 筋肉質 / 黒髪 / 金眼 / Tシャツ / はにかみ笑顔
const caseA = draftWith({
  gender: 'male',
  ageGroup: 'adult',
  build: idFor('build', '筋肉質'),
  hairColors: [idFor('hairColors', '黒髪')],
  hairstyle: idFor('hairstyle', 'ショート'),
  eyeColor: idFor('eyeColor', '金色の目'),
  outfit: idFor('outfit', 'Tシャツ'),
  expression: idFor('expression', 'はにかんだ笑顔'),
  accessories: [],
});
const outputA = generatePrompts(caseA);
for (const token of ['adult man', 'muscular', 'black hair', 'golden', 'T-shirt', 'bashful smile']) {
  assert.match(outputA.en, new RegExp(token, 'i'), 'A English: ' + token);
  assert.match(outputA.tags, new RegExp(token, 'i'), 'A Tags: ' + token);
}
assert.match(outputA.ja, /成人男性/);
assert.match(outputA.ja, /筋肉質/);
assert.ok(!/\bhair\s+hair\b|\beyes\s+eyes\b/i.test(outputA.en));

// B: 吸血鬼 / 貴族服 / 夜 / 月明かり
const caseB = draftWith({
  species: idFor('species', '吸血鬼'),
  outfit: idFor('outfit', '貴族服'),
  background: idFor('background', '月夜'),
  timeOfDay: 'night',
  lighting: [idFor('lighting', '月明かり')],
});
const outputB = generatePrompts(caseB);
for (const token of ['vampire', 'noble outfit', 'night', 'moonlight']) {
  assert.match(outputB.en, new RegExp(token, 'i'), 'B English: ' + token);
  assert.match(outputB.tags, new RegExp(token, 'i'), 'B Tags: ' + token);
}

// C: 教師 / 眼鏡 / カーディガン / 頼りなさそうな笑顔
const caseC = draftWith({
  personality: [idFor('personality', '教師っぽい'), idFor('personality', '少し頼りなさそう')],
  faceFeatures: [idFor('faceFeatures', '眼鏡')],
  outfit: idFor('outfit', 'カーディガン'),
  accessories: [idFor('accessories', '本')],
  expression: idFor('expression', '困った笑顔'),
});
const outputC = generatePrompts(caseC);
for (const token of ['teacher-like', 'glasses', 'cardigan', 'troubled smile']) {
  assert.match(outputC.en, new RegExp(token, 'i'), 'C English: ' + token);
  assert.match(outputC.tags, new RegExp(token, 'i'), 'C Tags: ' + token);
}

// D: 天使 / 負傷 / 汚れた服 / 不穏な空。明示した翼をno-wingsより優先。
const caseD = draftWith({
  species: idFor('species', '天使'),
  personality: [idFor('personality', '傷ついた')],
  outfit: idFor('outfit', '汚れた服'),
  accessories: [idFor('accessories', '翼')],
  background: idFor('background', '不穏な空'),
  lighting: [idFor('lighting', '不穏な発光')],
  negatives: [...defaultDraft.negatives, idFor('negatives', '翼は指定時のみ')],
});
const caseDBefore = structuredClone(caseD);
const outputD = generatePrompts(caseD);
for (const token of ['angel', 'wounded', 'dirty clothes', 'ominous']) {
  assert.match(outputD.en, new RegExp(token, 'i'), 'D English: ' + token);
  assert.match(outputD.tags, new RegExp(token, 'i'), 'D Tags: ' + token);
}
assert.doesNotMatch(outputD.en, /no wings unless specified/i);
assert.deepEqual(caseD, caseDBefore, '出力整理は元draftを変更しない');

// E: 最初のギャップ種で、騎士と花柄エプロンと困った笑顔を両立。
const gap = generateGap(defaultDraft, {}, () => 0);
assert.equal(gap.changed, true);
assert.match(gap.label, /屈強な騎士/);
const outputE = generatePrompts(gap.draft);
for (const token of ['knight', 'floral apron', 'troubled smile']) {
  assert.match(outputE.en, new RegExp(token, 'i'), 'E English: ' + token);
  assert.match(outputE.tags, new RegExp(token, 'i'), 'E Tags: ' + token);
}

assert.equal(translateFreeText('小麦色'), 'tan skin', 'aliasを端末内辞書で翻訳');
assert.equal(
  translateFreeText('長い髪を一つに結んでいる'),
  'long hair tied at the back',
  '最長一致の語句を1フレーズで翻訳',
);
const freeInputDraft = draftWith({
  custom: { ...defaultDraft.custom, appearance: '小麦色、古い紋章' },
});
const freeInputOutputs = generatePrompts(freeInputDraft);
assert.match(freeInputOutputs.en, /tan skin/i);
assert.match(freeInputOutputs.en, /古い紋章/);
assert.match(freeInputOutputs.short, /古い紋章/);
assert.match(freeInputOutputs.tags, /古い紋章/);

assert.equal(translateFreeText('黒髪の青年'), '黒髪の青年', '一部だけ英訳した日英混在句を作らない');
assert.equal(normalizeAgeInput('0'), '0');
assert.equal(normalizeAgeInput('999'), '999');
for (const invalidAge of ['-1', '1000', '1.5', '1e2', ' 24 ']) {
  assert.equal(normalizeAgeInput(invalidAge), invalidAge === ' 24 ' ? '24' : '', `数値年齢を正規化: ${invalidAge}`);
}

const childMale = generatePrompts(draftWith({ ageGroup: 'child', gender: 'male', ageNumber: '' }));
const childFemale = generatePrompts(draftWith({ ageGroup: 'child', gender: 'female', ageNumber: '' }));
const mismatchedBoy = generatePrompts(draftWith({ ageGroup: 'boy', gender: 'female', ageNumber: '' }));
const androgynousDragon = generatePrompts(draftWith({
  ageGroup: 'adult', gender: 'androgynous', ageNumber: '', species: idFor('species', '竜人'),
}));
const unspecifiedAdult = generatePrompts(draftWith({ ageGroup: 'adult', gender: 'unspecified', ageNumber: '' }));
assert.match(childMale.ja, /男の子/);
assert.match(childFemale.ja, /女の子/);
assert.doesNotMatch(childMale.ja, /子ども男性/);
assert.doesNotMatch(childMale.en, /child man/i);
assert.match(mismatchedBoy.ja, /少年/);
assert.doesNotMatch(mismatchedBoy.ja, /少年.*女性|女性.*少年/);
assert.doesNotMatch(mismatchedBoy.en, /boy male|boy female/i);
const mismatchedElfBoy = generatePrompts(draftWith({ ageGroup: 'boy', gender: 'female', ageNumber: '', species: 'elf' }));
assert.match(mismatchedElfBoy.en, /teenage male elf/i);
assert.doesNotMatch(mismatchedElfBoy.en, /teenage female elf/i);
assert.match(androgynousDragon.ja, /成人の中性的な人物で、種族は竜人/);
assert.match(androgynousDragon.en, /adult androgynous dragonkin/i);
assert.doesNotMatch(androgynousDragon.en, /person dragonkin/i);
const femaleVampire = generatePrompts(draftWith({ ageGroup: 'adult', gender: 'female', species: 'vampire' }));
assert.match(femaleVampire.en, /adult female vampire/i);
assert.doesNotMatch(femaleVampire.en, /adult woman vampire/i);
assert.match(unspecifiedAdult.ja, /成人の人物/);
assert.doesNotMatch(unspecifiedAdult.ja, /成人人物/);
assert.match(unspecifiedAdult.en, /adult person/i);
assert.doesNotMatch(unspecifiedAdult.en, /adult androgynous/i);
const numericBoy = generatePrompts(draftWith({ ageNumber: '12', gender: 'male', species: 'human' }));
const numericGirl = generatePrompts(draftWith({ ageNumber: '12', gender: 'female', species: 'human' }));
const numericChild = generatePrompts(draftWith({ ageNumber: '12', gender: 'unspecified', species: 'human' }));
assert.match(numericBoy.ja, /12歳の男の子/);
assert.match(numericGirl.ja, /12歳の女の子/);
assert.match(numericChild.ja, /12歳の子ども/);
assert.match(numericBoy.en, /12-year-old boy/i);
assert.match(numericGirl.en, /12-year-old girl/i);
assert.match(numericChild.en, /12-year-old child/i);
assert.doesNotMatch(numericBoy.en, /12-year-old man/i);
assert.doesNotMatch(numericGirl.en, /12-year-old woman/i);
const numericVampire = generatePrompts(draftWith({ ageNumber: '12', gender: 'male', species: 'vampire' }));
assert.match(numericVampire.en, /12-year-old male vampire/i);
assert.doesNotMatch(numericVampire.en, /12-year-old boy vampire/i);
for (const invalidAge of ['-1', '1000', '1.5']) {
  const invalidOutput = generatePrompts(draftWith({ ageNumber: invalidAge }));
  assert.doesNotMatch(invalidOutput.ja, new RegExp(`${invalidAge.replace('.', '\\.')}歳`));
  assert.doesNotMatch(invalidOutput.en, new RegExp(`${invalidAge.replace('.', '\\.')}[- ]year`, 'i'));
}

const grammarDraft = draftWith({
  expression: idMatching('expression', /少し口を開け|slightly parted lips/i),
  pose: idMatching('pose', /戦闘態勢|battle stance/i),
});
const grammarOutput = generatePrompts(grammarDraft);
assert.match(grammarOutput.en, /Expression: slightly parted lips/i);
assert.match(grammarOutput.en, /Pose\/action: battle stance/i);
assert.doesNotMatch(grammarOutput.en, /with a slightly parted lips|They are shown battle stance/i);

const legacyGoldHair = generatePrompts(draftWith({ hairColors: ['gold'], hairstyle: '' }));
assert.match(legacyGoldHair.en, /golden hair/i);
assert.doesNotMatch(legacyGoldHair.en, /hair\s+hair/i);
const separatedEyes = generatePrompts(draftWith({
  eyeColor: idFor('eyeColor', 'ヘーゼルの目'),
  eyeShape: idMatching('eyeShape', /たれ目|droopy/i),
  eyeImpression: idMatching('eyeImpression', /無垢|innocent/i),
}));
assert.match(separatedEyes.ja, /瞳の色：ヘーゼルの目。目の形：たれ目。目元の印象：/);
assert.doesNotMatch(separatedEyes.ja, /なで|でで/);
assert.doesNotMatch(separatedEyes.en, /eyes\s+eyes/i);

const noBackground = generatePrompts(draftWith({
  background: idMatching('background', /^背景なし | no background$/i),
  timeOfDay: 'night',
  lighting: [idFor('lighting', '柔らかな光')],
}));
assert.doesNotMatch(noBackground.ja, /時間帯：|照明：/);
assert.doesNotMatch(noBackground.en, /Time of day:|Lighting:/i);
const timeWithoutBackground = generatePrompts(draftWith({ background: '', timeOfDay: 'night' }));
assert.match(timeWithoutBackground.ja, /時間帯：夜/);
assert.match(timeWithoutBackground.en, /Time of day: night/i);
const midnightAtNight = generatePrompts(draftWith({
  background: idMatching('background', /夜の街|city at night/i), timeOfDay: 'midnight',
}));
assert.match(midnightAtNight.en, /Time of day: midnight/i);
const transparentWithPalace = generatePrompts(draftWith({
  aspectRatio: 'transparent', background: idMatching('background', /^王宮 | palace$/i),
}));
assert.doesNotMatch(transparentWithPalace.en, /Background:.*palace/i);
assert.doesNotMatch(transparentWithPalace.ja, /背景：王宮/);

const dawnSky = findChoice('background', 'dawn-sky');
const starrySky = findChoice('background', 'starry-sky');
const dawnLight = findChoice('lighting', 'dawn-light');
const moonLight = findChoice('lighting', 'moon');
const naturalLight = findChoice('lighting', 'natural');
const sunsetLight = findChoice('lighting', 'sunset-lighting');
assert.ok(dawnSky && starrySky && dawnLight && moonLight && naturalLight && sunsetLight);
assert.ok(dawnSky.tags.includes('dawn'));
assert.ok(!dawnSky.tags.includes('night') && !dawnSky.tags.includes('moon'), '夜明けを夜・月へ誤分類しない');
assert.ok(dawnLight.tags.includes('dawn'));
assert.ok(!dawnLight.tags.includes('night') && !dawnLight.tags.includes('moon'), '夜明けの光を月明かりへ誤分類しない');
assert.ok(starrySky.tags.includes('night'), '星空を夜背景として扱う');
assert.equal(backgroundConflictsWithTime('day', starrySky), true);
assert.equal(backgroundConflictsWithTime('morning', dawnSky), false);
assert.equal(lightingConflictsWithTime('day', moonLight), true);
assert.equal(lightingConflictsWithTime('night', dawnLight), true);
const dawnMorning = generatePrompts(draftWith({ background: 'dawn-sky', timeOfDay: 'morning' }));
assert.match(dawnMorning.en, /Time of day: morning/i, '互換性判定を生成と出力で共通化');
const dayMoon = generatePrompts(draftWith({ timeOfDay: 'day', lighting: ['moon'] }));
assert.doesNotMatch(dayMoon.en, /Lighting: moonlight/i, '昼と月明かりを同時出力しない');

for (let index = 1; index <= 120; index += 1) {
  let randomState = index;
  const variedRandom = () => {
    randomState = (1664525 * randomState + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  const dayLocked = randomizeAll(draftWith({ timeOfDay: 'day' }), { timeOfDay: true }, undefined, [], variedRandom);
  const pickedBackground = findChoice('background', dayLocked.background);
  assert.ok(!pickedBackground || !backgroundConflictsWithTime('day', pickedBackground), '昼ロック時に夜景・星空・夜明けを選ばない');
  for (const lightId of dayLocked.lighting) {
    const pickedLight = findChoice('lighting', lightId);
    assert.ok(!pickedLight || !lightingConflictsWithTime('day', pickedLight), '昼ロック時に矛盾する光を選ばない');
  }

  const nightBackgroundLocked = randomizeAll(
    draftWith({ background: 'night-city' }),
    { background: true },
    undefined,
    [],
    variedRandom,
  );
  assert.ok(['night', 'midnight'].includes(nightBackgroundLocked.timeOfDay), '夜景ロック時の時間帯を夜へ合わせる');
}

for (const lockedLightingId of ['natural', 'dawn-light', 'sunset-lighting', 'moon']) {
  for (let index = 1; index <= 160; index += 1) {
    let randomState = index;
    const variedRandom = () => {
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      return randomState / 0x100000000;
    };
    const lightingLocked = randomizeAll(
      draftWith({ lighting: [lockedLightingId] }),
      { lighting: true },
      undefined,
      [],
      variedRandom,
    );
    const pickedBackground = findChoice('background', lightingLocked.background);
    const pickedLighting = findChoice('lighting', lockedLightingId);
    assert.ok(!pickedBackground || !backgroundConflictsWithTime(lightingLocked.timeOfDay, pickedBackground), '照明ロック時も背景と時間帯を両立');
    assert.ok(!pickedLighting || !lightingConflictsWithTime(lightingLocked.timeOfDay, pickedLighting), '照明ロック時も照明と時間帯を両立');
  }
}

const sameRandomValue = () => 0.37;
const randomFromOldMoon = randomizeAll(draftWith({ lighting: ['moon'] }), {}, undefined, [], sameRandomValue);
const randomFromOldSoft = randomizeAll(draftWith({ lighting: ['soft'] }), {}, undefined, [], sameRandomValue);
assert.equal(randomFromOldMoon.timeOfDay, randomFromOldSoft.timeOfDay, '全体生成で未確定の古い照明が時間抽選を歪めない');

for (let mask = 1; mask < 8; mask += 1) {
  const cameraOutput = generatePrompts(draftWith({
    cameraAngle: mask & 1 ? defaultDraft.cameraAngle : '',
    composition: mask & 2 ? defaultDraft.composition : '',
    aspectRatio: mask & 4 ? defaultDraft.aspectRatio : '',
  }));
  assert.doesNotMatch(cameraOutput.ja, /、で|、・|：／|／。/);
  assert.doesNotMatch(cameraOutput.en, /Camera and composition:\s*[;,]/i);
}

const propsOutput = generatePrompts(draftWith({
  accessories: [idFor('accessories', '本'), idFor('accessories', '翼')],
}));
assert.match(propsOutput.en, /Accessories, props, and character details:.*book.*wings/i);
assert.doesNotMatch(propsOutput.en, /paired with|carry or wear/i);
assert.doesNotMatch(propsOutput.ja, /本.*を合わせる|翼.*を合わせる/);

const customPunctuation = generatePrompts(draftWith({
  custom: { ...defaultDraft.custom, appearance: '古い紋章！雨の日？' },
}));
assert.doesNotMatch(customPunctuation.en, /！\.|？\.|！。|？。/);
const positiveWings = draftWith({
  accessories: [idFor('accessories', '翼')],
  negatives: [...defaultDraft.negatives, idFor('negatives', '翼は指定時のみ')],
  custom: { ...defaultDraft.custom, negatives: '翼を描かない、without wings' },
});
const positiveWingsBefore = structuredClone(positiveWings);
const positiveWingsOutput = generatePrompts(positiveWings);
assert.doesNotMatch(positiveWingsOutput.negativeJa, /翼/);
assert.doesNotMatch(positiveWingsOutput.negativeEn, /wings/i);
assert.deepEqual(positiveWings, positiveWingsBefore, 'ネガティブ整理でも元draftを変更しない');

for (const token of ['simple background', 'daytime', 'soft light', 'portrait orientation']) {
  assert.match(outputs.short, new RegExp(token, 'i'), `Shortへ主要設定を含める: ${token}`);
  assert.match(outputs.tags, new RegExp(token, 'i'), `Tagsへ主要設定を含める: ${token}`);
}

const duplicateFaceDraft = draftWith({
  faceFeatures: [idFor('faceFeatures', '眼鏡'), idFor('faceFeatures', '丸眼鏡')],
});
const normalizedFace = resolveDraftConflicts(duplicateFaceDraft);
assert.deepEqual(normalizedFace.faceFeatures, [idFor('faceFeatures', '丸眼鏡')], 'specificな同義語を残す');

const locked = randomizeAll(defaultDraft, { gender: true, outfit: true, hairColors: true }, 'dark-fantasy', [], () => 0.42);
assert.equal(locked.gender, defaultDraft.gender);
assert.equal(locked.outfit, defaultDraft.outfit);
assert.deepEqual(locked.hairColors, defaultDraft.hairColors);

const beforeSingle = structuredClone(defaultDraft);
const afterSingle = randomizeField(beforeSingle, 'background', undefined, [], () => 0.2);
for (const key of Object.keys(beforeSingle) as Array<keyof CharacterDraft>) {
  if (key !== 'background') assert.deepEqual(afterSingle[key], beforeSingle[key], '個別ランダムは' + key + 'を変えない');
}

const randomizedAge = randomizeField({ ...defaultDraft, ageGroup: 'adult' }, 'ageNumber', undefined, [], () => 0.5);
assert.ok(Number(randomizedAge.ageNumber) >= 20 && Number(randomizedAge.ageNumber) <= 45);

const darkTheme = themes.find((theme) => theme.label === 'ダークファンタジー');
assert.ok(darkTheme);
const vampire = findChoice('species', idFor('species', '吸血鬼'));
const beach = findChoice('background', idFor('background', '海辺'));
assert.ok(vampire && beach);
assert.equal(getThemeMultiplier(vampire, darkTheme), 1.8);
assert.equal(getThemeMultiplier(beach, darkTheme), 0.1);

const draftMatchesThemeCore = (candidate: CharacterDraft, theme: (typeof themes)[number]) =>
  theme.core.every((core) => {
    if (core.field === 'faceFeatures') return true;
    const ids = Array.isArray(candidate[core.field])
      ? candidate[core.field] as string[]
      : [candidate[core.field] as string];
    const selected = optionsByField[core.field]?.filter((option) => ids.includes(option.id)) ?? [];
    return selected.some((option) =>
      (core.ids?.includes(option.id) ?? false)
      || (core.tags?.some((tag) => option.tags.includes(tag)) ?? false),
    );
  });

for (const theme of themes) {
  for (const core of theme.core) {
    assert.ok(
      optionsByField[core.field]?.some((option) =>
        (core.ids?.includes(option.id) ?? false)
        || (core.tags?.some((tag) => option.tags.includes(tag)) ?? false),
      ),
      `${theme.label}の核候補が固定データに存在`,
    );
  }
  const themed = randomizeAll(defaultDraft, {}, theme.id, [], () => 0.37);
  assert.ok(draftMatchesThemeCore(themed, theme), `${theme.label}の核要素を必ず反映`);
  assert.deepEqual(themed.faceFeatures, [], `${theme.label}でも顔の特徴は自動設定しない`);
}
const manualFace = draftWith({ faceFeatures: ['glasses'] });
assert.deepEqual(randomizeAll(manualFace, {}, undefined, [], () => 0.99).faceFeatures, [], '全体ランダムで未ロックの顔の特徴を未設定にする');
assert.deepEqual(randomizeAll(manualFace, { faceFeatures: true }, undefined, [], () => 0.99).faceFeatures, ['glasses'], '顔の特徴のロックを保持');
assert.deepEqual(randomizeField(manualFace, 'faceFeatures', undefined, [], () => 0.99).faceFeatures, [], '単独ランダムからも顔の特徴を追加しない');
assert.deepEqual(manualFace.faceFeatures, ['glasses'], '手動選択の元データは変更しない');
const vampireTheme = themes.find((theme) => theme.label === '吸血鬼');
assert.ok(vampireTheme);
for (let index = 0; index < 10; index += 1) {
  const themed = randomizeAll(defaultDraft, {}, vampireTheme.id, Array.from({ length: 20 }, () => draftWith({ species: 'vampire' })), () => index / 10);
  assert.equal(themed.species, 'vampire', '吸血鬼テーマの核を履歴に負けさせない');
}
const lockedVampireTheme = randomizeAll(defaultDraft, { species: true }, vampireTheme.id, [], () => 0.5);
assert.equal(lockedVampireTheme.species, defaultDraft.species, 'テーマよりロックを優先');

const purposeLockedDraft = draftWith({
  aspectRatio: 'square',
  composition: 'bust',
  background: 'library',
  negatives: ['no-text'],
  gaze: 'looking-away',
});
const purposeApplied = applyPurposeRecommendation(
  purposeLockedDraft,
  { aspectRatio: true, composition: true, background: true, negatives: true },
  'standing',
);
assert.equal(purposeApplied.purpose, 'standing');
assert.equal(purposeApplied.aspectRatio, 'square');
assert.equal(purposeApplied.composition, 'bust');
assert.equal(purposeApplied.background, 'library');
assert.deepEqual(purposeApplied.negatives, ['no-text']);
assert.equal(purposeApplied.gaze, 'camera', '用途おすすめは未ロック項目だけ更新');

const backgroundPurpose = applyPurposeRecommendation(defaultDraft, {}, 'background');
assert.deepEqual(backgroundPurpose.personality, defaultDraft.personality, '背景用途へ切替時も人物の印象を保持');
assert.deepEqual(backgroundPurpose.faceFeatures, defaultDraft.faceFeatures, '背景用途へ切替時も顔の特徴を保持');
const backgroundPurposeOutput = generatePrompts(backgroundPurpose);
assert.match(backgroundPurposeOutput.en, /background illustration/i);
assert.match(backgroundPurposeOutput.negativeEn, /no people/i);
assert.match(backgroundPurposeOutput.en, /composition showing more background/i);
assert.doesNotMatch(backgroundPurposeOutput.en, /Subject:|adult man|Outfit:|Exactly one character/i, '背景用途へ人物指定を混ぜない');
assert.doesNotMatch(backgroundPurposeOutput.short, /adult man|cardigan|troubled smile|full-body|bust-up|face close-up|character reference sheet/i, '背景用途の短文にも人物指定を混ぜない');
const backgroundWithCustomText = generatePrompts({
  ...backgroundPurpose,
  custom: { ...backgroundPurpose.custom, character: '赤髪の男性', scene: '古い石造りの街' },
});
assert.doesNotMatch(backgroundWithCustomText.en, /赤髪の男性|red-haired man/i, '背景用途では人物の自由入力を除外');
assert.match(backgroundWithCustomText.en, /古い石造りの街/, '背景用途では背景の自由入力を維持');

const historyDrafts = Array.from({ length: 20 }, () => structuredClone(defaultDraft));
const black = findChoice('hairColors', idFor('hairColors', '黒髪'));
assert.ok(black);
assert.equal(getDiversityMultiplier(black, 'hairColors', historyDrafts), 0.25);
assert.equal(getDiversityMultiplier({ ...black, id: 'never-used' }, 'hairColors', historyDrafts), 1.15);

assert.equal(chooseGapMode(() => 0.7999), 'coherent');
assert.equal(chooseGapMode(() => 0.8), 'slight-gap');
assert.equal(chooseGapMode(() => 0.9499), 'slight-gap');
assert.equal(chooseGapMode(() => 0.95), 'strong-gap');

const weightedItems: Choice[] = [
  { id: 'one', labelJa: '1', labelEn: 'one', ja: '1', en: 'one', tags: [], weight: 1 },
  { id: 'three', labelJa: '3', labelEn: 'three', ja: '3', en: 'three', tags: [], weight: 3 },
];
const weightContext: WeightContext = {
  field: 'species',
  draft: defaultDraft,
  history: [],
  resolvedFields: new Set(),
  gapMode: 'coherent',
};
assert.equal(weightedPick(weightedItems, weightContext, () => 0.24)?.id, 'one');
assert.equal(weightedPick(weightedItems, weightContext, () => 0.26)?.id, 'three');

const vampireContext: WeightContext = {
  field: 'outfit',
  draft: draftWith({ species: idFor('species', '吸血鬼') }),
  history: [],
  resolvedFields: new Set<LockKey>(['species']),
  gapMode: 'coherent',
};
const nobleOutfit = findChoice('outfit', idFor('outfit', '貴族服'));
const tshirt = findChoice('outfit', idFor('outfit', 'Tシャツ'));
assert.ok(nobleOutfit && tshirt);
assert.ok(calculateFinalWeight(nobleOutfit, vampireContext) > calculateFinalWeight(tshirt, vampireContext), '吸血鬼×貴族服の相性補正');

const allLocked = Object.fromEntries(
  Object.keys(defaultDraft).filter((key) => key !== 'custom').map((key) => [key, true]),
) as Partial<Record<LockKey, boolean>>;
assert.equal(generateGap(defaultDraft, allLocked, () => 0).changed, false, '成立不能時は状態を変えない');

const neutralGapDraft = draftWith({
  gender: 'male',
  ageGroup: 'adult',
  ageNumber: '',
  species: 'human',
  build: 'average',
  personality: [],
  hairColors: ['brown'],
  hairstyle: 'short',
  eyeShape: 'almond',
  eyeImpression: 'clear',
  faceFeatures: [],
  outfit: 'tshirt',
  outfitColors: ['red'],
  outfitDetails: [],
  accessories: [],
  expression: 'neutral',
  pose: 'front',
  gaze: 'camera',
  background: 'solid',
  lighting: ['soft'],
});
const facialFeatureFreeGapSeeds = gapSeeds.filter((seed) => !['gap-12', 'gap-29'].includes(seed.id));
const neutralGapRandomFor = (pattern: RegExp) => {
  const index = facialFeatureFreeGapSeeds.findIndex((seed) => pattern.test(seed.label));
  assert.ok(index >= 0, `${pattern}のギャップ候補が存在`);
  return () => (index + 0.01) / facialFeatureFreeGapSeeds.length;
};
for (let index = 0; index < facialFeatureFreeGapSeeds.length; index += 1) {
  const seed = facialFeatureFreeGapSeeds[index];
  const result = generateGap(neutralGapDraft, {}, () => (index + 0.01) / facialFeatureFreeGapSeeds.length);
  const segments = ['gap-07', 'gap-47'].includes(seed.id) ? [0, 2] : seed.segments.map((_, i) => i);
  const expectedJa = segments.map((i) => seed.segments[i]).join(' × ');
  const expectedEn = segments.map((i) => seed.segmentsEn[i]).join(' × ');
  assert.equal(result.label, expectedJa, `ギャップ${index + 1}を指定位置どおり選ぶ`);
  assert.equal(result.changed, true, `ギャップ${index + 1}が成立`);
  assert.equal(result.draft.generatedGap?.seedId, seed.id);
  assert.equal(result.draft.generatedGap?.labelJa, expectedJa);
  assert.equal(result.draft.generatedGap?.labelEn, expectedEn);
  assert.deepEqual(result.draft.faceFeatures, [], 'ギャップから顔の特徴を追加しない');
  assert.ok(!result.draft.generatedGap?.changes.some((change) => change.field === 'faceFeatures'), '顔の特徴の自動変更を記録しない');
  assert.ok((result.draft.generatedGap?.changes.length ?? 0) >= 2, `ギャップ${index + 1}は2項目以上を構造変更`);
  assert.equal(result.draft.custom.gap, undefined, '内部ギャップを自由入力へ混ぜない');
  assert.equal(result.draft.custom.gapEn, undefined, '内部英語ギャップを自由入力へ混ぜない');
  assert.doesNotMatch(generatePrompts(result.draft).positiveEn, /[\u3040-\u30ff\u3400-\u9fff]/, `ギャップ${index + 1}の英語出力に日本語を混ぜない`);
}
const vampireGapIndex = gapSeeds.findIndex((seedItem) => /吸血鬼/.test(seedItem.label));
assert.ok(vampireGapIndex >= 0);
const lockedSpeciesGap = generateGap(defaultDraft, { species: true }, () => (vampireGapIndex + 0.01) / gapSeeds.length);
assert.equal(lockedSpeciesGap.draft.species, defaultDraft.species);
assert.doesNotMatch(lockedSpeciesGap.draft.generatedGap?.labelJa ?? '', /吸血鬼/, 'ギャップ文でも種族ロックを迂回しない');
assert.doesNotMatch(lockedSpeciesGap.label, /吸血鬼/, 'ギャップの表示名もロック後の実内容へ合わせる');

const firstGap = generateGap(neutralGapDraft, {}, () => 0);
const secondGap = generateGap(firstGap.draft, {}, () => 0);
assert.notEqual(secondGap.draft.generatedGap?.seedId, firstGap.draft.generatedGap?.seedId, '同じ乱数でも直前のギャップを繰り返さない');
const sameStructureWithoutMetadata = discardGeneratedGap(firstGap.draft);
const changedFromSameStructure = generateGap(sameStructureWithoutMetadata, {}, () => 0);
assert.notEqual(changedFromSameStructure.draft.generatedGap?.seedId, firstGap.draft.generatedGap?.seedId, '実値が同じギャップを固定結果として再採用しない');
assert.ok((changedFromSameStructure.draft.generatedGap?.changes.length ?? 0) >= 2, '再抽選では実際に2項目以上を変更する');
assert.ok(!secondGap.draft.accessories.includes('floral-apron'), '再抽選時に前のギャップ小物を残さない');
assert.doesNotMatch(secondGap.draft.generatedGap?.labelJa ?? '', /花柄エプロン/, '前のギャップ文を残さない');
const historyAvoidedGap = generateGap(
  neutralGapDraft,
  {},
  () => 0,
  [firstGap.draft, secondGap.draft],
);
assert.ok(![firstGap.draft.generatedGap?.seedId, secondGap.draft.generatedGap?.seedId]
  .includes(historyAvoidedGap.draft.generatedGap?.seedId), '直近履歴のギャップを優先的に避ける');

const clearedGap = clearGeneratedGap(firstGap.draft);
assert.deepEqual(clearedGap, neutralGapDraft, 'ギャップ解除で適用前の設定へ戻す');
const manuallyEditedGap = { ...firstGap.draft, expression: 'serious' };
assert.equal(clearGeneratedGap(manuallyEditedGap).expression, 'serious', 'ギャップ後に手動変更した値は解除で上書きしない');
const lockedClear = clearGeneratedGap(firstGap.draft, { outfit: true });
assert.equal(lockedClear.outfit, firstGap.draft.outfit, '後からロックした値は解除時に維持');

const gapWithUserText = {
  ...firstGap.draft,
  custom: { ...firstGap.draft.custom, character: '古い紋章' },
};
const fullAfterGap = randomizeAll(gapWithUserText, {}, undefined, [], () => 0.42);
assert.equal(fullAfterGap.generatedGap, undefined, '通常生成で内部ギャップを外す');
assert.equal(fullAfterGap.custom.character, '古い紋章', '通常生成でもユーザー自由入力を維持');

const beforeGapFieldRandom = structuredClone(firstGap.draft);
const afterGapFieldRandom = randomizeField(firstGap.draft, 'expression', undefined, [], () => 0.42);
for (const field of Object.keys(beforeGapFieldRandom) as Array<keyof CharacterDraft>) {
  if (field === 'expression' || field === 'generatedGap') continue;
  assert.deepEqual(afterGapFieldRandom[field], beforeGapFieldRandom[field], `ギャップ後の部分ランダムでも${field}を変えない`);
}
assert.ok(afterGapFieldRandom.generatedGap, '部分変更後も残りのギャップ要素を追跡');
assert.doesNotMatch(afterGapFieldRandom.generatedGap?.labelJa ?? '', /困った笑顔/, '変更した文節を固定ラベルから外す');
assert.match(afterGapFieldRandom.generatedGap?.labelJa ?? '', /屈強な騎士.*花柄エプロン/, '未変更の文節は維持');
const afterTwoGapFieldsRandom = randomizeField(afterGapFieldRandom, 'accessories', undefined, [], () => 0.42);
assert.equal(afterTwoGapFieldsRandom.generatedGap?.labelJa, '', '対照が1文節だけならギャップ文として出力しない');
assert.doesNotMatch(generatePrompts(afterTwoGapFieldsRandom).positiveEn, /Visual contrast:/i);
const rerolledAfterPartial = generateGap(afterGapFieldRandom, {}, () => 0);
assert.ok(!rerolledAfterPartial.draft.accessories.includes('floral-apron'), '部分変更後の再抽選でも旧ギャップ小物を残さない');
assert.equal(rerolledAfterPartial.draft.build, neutralGapDraft.build, '部分変更後の再抽選で旧ギャップ体格を戻す');

const chefGapIndex = gapSeeds.findIndex((seedItem) => /料理人服/.test(seedItem.label));
const chefWithOutfitLock = generateGap(neutralGapDraft, { outfit: true }, () => (chefGapIndex + 0.01) / gapSeeds.length);
assert.equal(chefWithOutfitLock.draft.outfit, neutralGapDraft.outfit);
assert.doesNotMatch(chefWithOutfitLock.label, /料理人服/, '衣装ロックをギャップ文で迂回しない');
assert.doesNotMatch(generatePrompts(chefWithOutfitLock.draft).positiveEn, /chef outfit/i);
const outfitLockedGapIds = Array.from({ length: 50 }, (_, index) =>
  generateGap(neutralGapDraft, { outfit: true }, () => (index + 0.5) / 50).draft.generatedGap?.seedId,
).filter((id): id is string => Boolean(id));
const outfitLockedCounts = [...new Map(outfitLockedGapIds.map((id) => [id, outfitLockedGapIds.filter((value) => value === id).length])).values()];
assert.ok(new Set(outfitLockedGapIds).size > 10, '衣装ロック中も成立候補を広く抽選');
assert.ok(Math.max(...outfitLockedCounts) - Math.min(...outfitLockedCounts) <= 1, 'ロック時も成立候補を一様に抽選');

const readingGapIndex = gapSeeds.findIndex((seedItem) => /獣人.*読書家/.test(seedItem.label));
const underwaterReading = generateGap(
  draftWith({ background: 'underwater' }),
  { background: true },
  () => (readingGapIndex + 0.01) / gapSeeds.length,
);
assert.doesNotMatch(underwaterReading.label, /読書/, '水中背景と読書を組み合わせない');
assert.doesNotMatch(generatePrompts(underwaterReading.draft).positiveEn, /reading a book|avid reader/i);

for (const adultGapPattern of [/シスター服/, /チャラそう/, /大人の色気/]) {
  const adultGapIndex = gapSeeds.findIndex((seedItem) => adultGapPattern.test(seedItem.label));
  const minorGap = generateGap(draftWith({ ageGroup: 'child', ageNumber: '12' }), { ageNumber: true }, () => (adultGapIndex + 0.01) / gapSeeds.length);
  assert.doesNotMatch(minorGap.label, /挑発的|チャラそう|大人の色気/, '未成年へ成人向けギャップを付けない');
  assert.doesNotMatch(generatePrompts(minorGap.draft).positiveEn, /provocative|flirtatious|mature sensuality/i);
}
assert.equal(generatedGapConflictsWithAge(secondGap.draft, '12', 'child'), false, '安全なギャップは年齢変更後も維持可能');
const sensualGap = generateGap(neutralGapDraft, {}, neutralGapRandomFor(/大人の色気/));
assert.equal(generatedGapConflictsWithAge(sensualGap.draft, '12', 'child'), true, '成人向けギャップは未成年化前に検出');

const noAnimalEarsId = idFor('negatives', '獣耳は指定時のみ');
const beastReaderGap = generateGap(
  draftWith({ negatives: [...defaultDraft.negatives, noAnimalEarsId] }),
  {},
  neutralGapRandomFor(/獣人.*読書家/),
);
assert.ok(!beastReaderGap.draft.negatives.includes(noAnimalEarsId), 'ギャップ種族と矛盾する禁止事項を一時除去');
assert.ok(clearGeneratedGap(beastReaderGap.draft).negatives.includes(noAnimalEarsId), 'ギャップ解除で一時除去した禁止事項を戻す');
const releasedBeastSpecies = releaseGeneratedGapField(beastReaderGap.draft, 'species');
const humanizedBeastReader = reconcileGeneratedGapDerivedChanges({ ...releasedBeastSpecies, species: 'human' });
assert.ok(humanizedBeastReader.negatives.includes(noAnimalEarsId), '原因要素の変更時に一時除去した禁止事項をすぐ戻す');
const humanizedWithNegativesLock = reconcileGeneratedGapDerivedChanges(
  { ...releasedBeastSpecies, species: 'human' },
  { negatives: true },
);
assert.deepEqual(humanizedWithNegativesLock.negatives, releasedBeastSpecies.negatives, '派生変更の復元でも禁止事項ロックを維持');

const intentionallyConflicting = draftWith({
  faceFeatures: [idFor('faceFeatures', '眼鏡'), idFor('faceFeatures', '丸眼鏡')],
  accessories: [idFor('accessories', '翼')],
  negatives: [...defaultDraft.negatives, idFor('negatives', '翼は指定時のみ')],
});
const backgroundOnly = randomizeField(intentionallyConflicting, 'background', undefined, [], () => 0.33);
for (const key of Object.keys(intentionallyConflicting) as Array<keyof CharacterDraft>) {
  if (key !== 'background') assert.deepEqual(backgroundOnly[key], intentionallyConflicting[key], `矛盾draftでも背景以外の${key}を変えない`);
}
assert.ok(Array.isArray(randomizeField(defaultDraft, 'styleTraits', undefined, [], () => 0.4).styleTraits));
assert.ok(Array.isArray(randomizeField(defaultDraft, 'negatives', undefined, [], () => 0.4).negatives));
for (let index = 0; index < 200; index += 1) {
  const personNegatives = randomizeField(defaultDraft, 'negatives', undefined, [], () => (index + 0.5) / 200);
  assert.ok(!personNegatives.negatives.includes('no-people'), '人物用途の禁止事項に「人物なし」を選ばない');
  const sceneNegatives = randomizeField(backgroundPurpose, 'negatives', undefined, [], () => (index + 0.5) / 200);
  assert.ok(!sceneNegatives.negatives.includes('one-person'), '背景用途の禁止事項に「人物1人」を選ばない');
}

for (const numericAge of ['12', '40']) {
  for (let index = 0; index < 40; index += 1) {
    const aged = randomizeAll(draftWith({ ageNumber: numericAge }), { ageNumber: true }, undefined, [], () => (index + 0.5) / 40);
    if (Number(numericAge) < 18) assert.ok(['child', 'teen', 'boy', 'girl'].includes(aged.ageGroup), '未成年の数値年齢には未成年の年齢層');
    else assert.ok(!['child', 'teen', 'boy', 'girl'].includes(aged.ageGroup), '成人の数値年齢には成人の年齢層');
    assert.ok(!(aged.ageGroup === 'boy' && aged.gender === 'female'));
    assert.ok(!(aged.ageGroup === 'girl' && aged.gender === 'male'));
    if (Number(numericAge) < 18) {
      assert.ok(!['succubus', 'incubus'].includes(aged.species));
      assert.ok(!aged.personality.some((id) => ['sensual', 'flirtatious'].includes(id)));
      assert.ok(!['athletic-swimwear', 'oiran-inspired-outfit'].includes(aged.outfit));
      assert.ok(!['muscular', 'powerful', 'large'].includes(aged.build), '12歳には成人向け体格を選ばない');
      const selectedFaces = optionsByField.faceFeatures?.filter((option) => aged.faceFeatures.includes(option.id)) ?? [];
      assert.ok(!selectedFaces.some((option) => /beard|mustache|goatee|髭|ひげ/i.test(`${option.labelJa} ${option.labelEn}`)), '12歳には髭を選ばない');
    }
  }
}
const expectedGroupsByAge: Record<string, string[]> = {
  '12': ['child'],
  '17': ['teen', 'boy', 'girl'],
  '40': ['adult', 'middle'],
  '70': ['elderly'],
};
for (const [numericAge, expectedGroups] of Object.entries(expectedGroupsByAge)) {
  for (let index = 0; index < 20; index += 1) {
    const aged = randomizeAll(draftWith({ ageNumber: numericAge }), { ageNumber: true }, undefined, [], () => (index + 0.5) / 20);
    assert.ok(expectedGroups.includes(aged.ageGroup), `${numericAge}歳と年齢層を整合させる`);
  }
}

const elderlyGap = generateGap(neutralGapDraft, {}, neutralGapRandomFor(/老師風/));
assert.equal(elderlyGap.draft.ageGroup, 'elderly');
const ageAfterElderlyGap = randomizeField(elderlyGap.draft, 'ageNumber', undefined, [], () => 0.5);
assert.equal(ageAfterElderlyGap.ageGroup, 'elderly', '数値年齢だけのランダムではギャップ年齢層を維持');
assert.ok(Number(ageAfterElderlyGap.ageNumber) >= 65 && Number(ageAfterElderlyGap.ageNumber) <= 90, '現在の年齢層範囲で数値年齢を生成');

const lockedGapSeedIndex = gapSeeds.findIndex((seedItem) => /シスター服/.test(seedItem.label));
assert.ok(lockedGapSeedIndex >= 0);
const retriedGap = generateGap(defaultDraft, { outfit: true, expression: true }, () => (lockedGapSeedIndex + 0.01) / gapSeeds.length);
assert.equal(retriedGap.changed, true, '開始候補がロック中でも別候補へ再試行');
assert.notEqual(retriedGap.draft.generatedGap?.seedId, gapSeeds[lockedGapSeedIndex].id);

assert.equal(parseSnapshot('{broken'), null, '壊れた現在設定は安全に無視');
assert.deepEqual(parsePresets('{}'), [], 'プリセット形式不正は空配列');
assert.deepEqual(parseHistory('not json'), [], '履歴の不正JSONは安全に無視');
const migrated = parseSnapshot(JSON.stringify({
  draft: { gender: 'female', custom: { character: '古い設定' } },
  locks: { gender: true },
}));
assert.equal(migrated?.draft.gender, 'female');
assert.deepEqual(migrated?.draft.accessories, [], '旧保存へaccessoriesを補完');
assert.equal(migrated?.draft.purpose, defaultDraft.purpose, '欠落フィールドは既定値で補完');
assert.equal(migrated?.draft.custom.character, '古い設定');
assert.equal(migrated?.locks.gender, true);
assert.deepEqual(hydrateDraft({ personality: 'broken' }).personality, defaultDraft.personality, '壊れた配列型を既定値で補完');
const migratedLegacyGap = hydrateDraft({
  custom: {
    character: '既存の自由入力',
    gap: 'ギャップ要素：以前のギャップ',
    gapEn: 'Visual contrast: Previous contrast',
  },
});
assert.equal(migratedLegacyGap.generatedGap?.seedId, 'legacy', '旧ギャップ保存を専用状態へ移行');
assert.equal(migratedLegacyGap.generatedGap?.labelJa, '以前のギャップ');
assert.equal(migratedLegacyGap.custom.gap, undefined);
assert.equal(migratedLegacyGap.custom.character, '既存の自由入力');
const editedLegacyGap = randomizeField(migratedLegacyGap, 'background', undefined, [], () => 0.2);
assert.equal(editedLegacyGap.generatedGap, undefined, '旧固定ギャップも個別変更時に外す');
const malformedStoredGap = hydrateDraft({
  generatedGap: {
    seedId: 'gap-01',
    labelJa: '壊れた保存',
    labelEn: 'broken saved gap',
    segmentIndexes: [0],
    changes: [{ field: 'gender', previous: ['male'], applied: ['female'] }],
  },
});
assert.deepEqual(malformedStoredGap.generatedGap?.changes, [], '壊れたギャップ復元値の型を無視');

const oldPresetJson = JSON.stringify([{
  id: 'old',
  name: '旧プリセット',
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
  snapshot: { draft: { gender: 'male' }, locks: {} },
}]);
assert.deepEqual(parsePresets(oldPresetJson)[0].snapshot.draft.accessories, [], '旧プリセットも共通移行');

let storedHistory: HistoryEntry[] = [];
for (let index = 0; index < 55; index += 1) {
  storedHistory = appendHistory(storedHistory, {
    id: String(index),
    createdAt: new Date(index).toISOString(),
    label: 'item-' + index,
    source: 'random',
    snapshot: { draft: { ...structuredClone(defaultDraft), ageNumber: String(index) }, locks: {} },
  });
}
assert.equal(storedHistory.length, 50, '履歴は最大50件');
const duplicateHistory = appendHistory(storedHistory, {
  id: 'newest',
  createdAt: new Date().toISOString(),
  label: 'same draft',
  source: 'random',
  snapshot: storedHistory[5].snapshot,
});
assert.equal(
  duplicateHistory.filter((item) => JSON.stringify(item.snapshot.draft) === JSON.stringify(storedHistory[5].snapshot.draft)).length,
  1,
  '同一内容の履歴は重複しない',
);

let seed = 0x12345678;
const seededRandom = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0x100000000;
};
for (let index = 1; index <= 500; index += 1) {
  let minorSeed = index;
  const minorRandom = () => {
    minorSeed = (1664525 * minorSeed + 1013904223) >>> 0;
    return minorSeed / 0x100000000;
  };
  const minorRandomDraft = randomizeAll(
    draftWith({ ageNumber: '12', ageGroup: 'child' }),
    { ageNumber: true },
    undefined,
    [],
    minorRandom,
  );
  const minorBuild = findChoice('build', minorRandomDraft.build);
  assert.ok(minorRandomDraft.expression !== 'teasing-smile', '12歳へ挑発的な表情を選ばない');
  assert.ok(!['curvy', 'powerful'].includes(minorRandomDraft.build)
    && !minorBuild?.tags.some((tag) => ['muscular', 'large'].includes(tag)), '12歳へ成人向け体格を選ばない');
  assert.ok(!['holding-a-cigarette', 'holding-a-cigar', 'smoking-pose'].includes(minorRandomDraft.pose), '12歳へ喫煙ポーズを選ばない');
  assert.ok(!minorRandomDraft.accessories.some((id) => ['cigar', 'pipe'].includes(id)), '12歳へ煙草小物を選ばない');
}
for (let index = 0; index < 200; index += 1) {
  const randomDraft = randomizeAll(defaultDraft, {}, undefined, storedHistory.map((item) => item.snapshot.draft), seededRandom);
  assert.deepEqual(randomDraft.faceFeatures, [], '通常ランダムで顔の特徴を追加しない');
  const randomOutputs = generatePrompts(randomDraft);
  assert.ok(!randomOutputs.en.includes('undefined'));
  assert.ok(!/\ba adult\b/i.test(randomOutputs.en));
  assert.ok(!/\bhair\s+hair\b|\beyes\s+eyes\b/i.test(randomOutputs.en));
  assert.ok(!/[、]{2,}|[。]{2,}/.test(randomOutputs.ja));
  const gaze = findChoice('gaze', randomDraft.gaze);
  const expression = findChoice('expression', randomDraft.expression);
  assert.ok(!(gaze?.tags.includes('intense-gaze') && expression?.tags.includes('eyes-closed')), '視線の明白な矛盾なし');
}

const backgroundBase = draftWith({
  purpose: 'background',
  background: 'fantasy-city',
  timeOfDay: 'night',
  lighting: ['moon'],
});
let backgroundSeed = 42;
const backgroundRng = () => {
  backgroundSeed = (1664525 * backgroundSeed + 1013904223) >>> 0;
  return backgroundSeed / 0x100000000;
};
const backgroundRandom = randomizeAll(backgroundBase, {}, 'vampire', [], backgroundRng, 'background');
for (const field of [
  'gender', 'ageGroup', 'ageNumber', 'species', 'build', 'skinTone', 'personality',
  'hairColors', 'hairEffects', 'hairstyle', 'eyeColor', 'eyeShape', 'eyeImpression',
  'faceFeatures', 'outfit', 'outfitColors', 'outfitDetails', 'accessories', 'expression',
  'pose', 'gaze', 'cameraAngle',
] as LockKey[]) {
  assert.deepEqual(backgroundRandom[field], backgroundBase[field], `背景おまかせで${field}を保持`);
}

let batchSeed = 9;
const batchRng = () => {
  batchSeed = (1103515245 * batchSeed + 12345) >>> 0;
  return batchSeed / 0x100000000;
};
const batch = generateBatchVariations(defaultDraft, { gender: true }, { count: 4, rng: batchRng });
assert.equal(batch.length, 4, 'バッチで4つの一意な案を生成');
assert.equal(new Set(batch.map((item) => JSON.stringify(item))).size, 4, 'バッチ案は重複しない');
assert.ok(batch.every((item) => item.gender === defaultDraft.gender), 'バッチでロックを保持');
assert.ok(batch.every((item) => item.faceFeatures.length === 0), '4案すべてで顔の特徴を自動設定しない');
assert.deepEqual(defaultDraft.gender, 'male', 'バッチは元データを変更しない');
const batchAllLocked = Object.fromEntries((Object.keys(optionsByField) as LockKey[]).map((field) => [field, true]));
assert.deepEqual(generateBatchVariations(defaultDraft, batchAllLocked, { count: 4, rng: batchRng }), [], '全対象ロックならバッチを生成しない');

const transparentNotices = analyzePromptNotices(draftWith({
  aspectRatio: 'transparent', background: 'palace', timeOfDay: 'night', lighting: ['moon'],
}));
assert.ok(transparentNotices.some((item) => item.id === 'transparent-background'), '透過時の背景除外理由を表示');
assert.ok(transparentNotices.some((item) => item.id === 'no-scene-time'), '透過時の時間除外理由を表示');
assert.ok(transparentNotices.some((item) => item.id === 'no-scene-light-moon'), '透過時の照明除外理由を表示');
const backgroundNotices = analyzePromptNotices({
  ...backgroundBase,
  cameraAngle: 'front',
  composition: 'bust',
  custom: { ...backgroundBase.custom, character: '赤い翼', style: '水彩' },
  generatedGap: { seedId: 'test', labelJa: '秘密のギャップ', labelEn: 'secret contrast', segmentIndexes: [], changes: [] },
});
assert.ok(backgroundNotices.some((item) => item.id === 'background-hidden-cameraAngle'), '背景用途でカメラ角度の除外理由を表示');
assert.ok(backgroundNotices.some((item) => item.id === 'background-hidden-composition'), '背景用途で人物構図の除外理由を表示');
assert.ok(backgroundNotices.some((item) => item.id === 'background-hidden-generatedGap'), '背景用途でギャップの除外理由を表示');
assert.ok(backgroundNotices.some((item) => item.id === 'background-custom-character'), '背景用途で自由入力の除外理由を表示');
const conflictNotices = analyzePromptNotices(draftWith({
  accessories: ['wings'],
  custom: { ...defaultDraft.custom, negatives: '翼を描かない' },
}));
assert.ok(conflictNotices.some((item) => item.id.startsWith('custom-negative-conflict-')), '自由入力の否定矛盾を説明');

const profileSource = draftWith({ negatives: ['no-text', 'one-person', 'good-hands'] });
const profilePrompts = generatePrompts(profileSource);
for (const profile of ['generic', 'stable-diffusion', 'midjourney', 'novelai', 'human-brief'] as const) {
  const formatted = formatProfileOutput(profilePrompts, profileSource, profile);
  assert.ok(formatted.positive && formatted.combined, `${profile}の肯定・統合出力`);
  assert.ok(typeof formatted.negative === 'string', `${profile}の否定出力`);
}
const stableOutput = formatProfileOutput(profilePrompts, profileSource, 'stable-diffusion');
assert.ok(!stableOutput.positive.includes('Constraints:'), 'Stable Diffusionの肯定側に制約を混ぜない');
assert.match(stableOutput.negative, /multiple characters/i, '一人だけ指定を複数人物の回避へ正規化');
const novelOutput = formatProfileOutput(profilePrompts, profileSource, 'novelai');
assert.equal((novelOutput.combined.match(/Undesired Content:/g) ?? []).length, 1, 'NovelAI制約見出しを重複しない');
assert.match(formatProfileOutput(profilePrompts, draftWith({ aspectRatio: 'square' }), 'midjourney').combined, /--ar 1:1$/, 'Midjourneyへ比率を付与');
assert.doesNotMatch(formatProfileOutput(profilePrompts, draftWith({ aspectRatio: '' }), 'midjourney').combined, /--ar/, '未指定の比率を推測しない');

const blankSnapshot = createBlankSnapshot();
const secondBlankSnapshot = createBlankSnapshot();
for (const field of Object.keys(defaultDraft).filter((field) => field !== 'custom') as LockKey[]) {
  const value = blankSnapshot.draft[field];
  if (Array.isArray(value)) assert.deepEqual(value, [], `空欄開始で${field}を空配列にする`);
  else assert.equal(value, '', `空欄開始で${field}を空文字にする`);
}
assert.deepEqual(blankSnapshot.locks, {}, '空欄開始ですべてのロックを解除');
assert.equal(blankSnapshot.draft.generatedGap, undefined, '空欄開始でギャップを解除');
assert.deepEqual(Object.keys(blankSnapshot.draft.custom).sort(), [
  'action', 'appearance', 'character', 'negatives', 'outfit', 'purpose', 'scene', 'style',
], '空欄開始で標準の自由入力だけを用意');
assert.ok(Object.values(blankSnapshot.draft.custom).every((value) => value === ''), '自由入力をすべて空にする');
assert.notEqual(blankSnapshot.draft.styleTraits, secondBlankSnapshot.draft.styleTraits, '空欄配列は生成ごとに独立');
assert.notEqual(blankSnapshot.draft.custom, secondBlankSnapshot.draft.custom, '自由入力オブジェクトは生成ごとに独立');
blankSnapshot.draft.styleTraits.push('test-only');
blankSnapshot.draft.custom.character = 'test-only';
assert.deepEqual(secondBlankSnapshot.draft.styleTraits, [], '別の空欄状態を変更しない');
assert.equal(secondBlankSnapshot.draft.custom.character, '', '別の自由入力を変更しない');
assert.ok(!defaultDraft.styleTraits.includes('test-only'), '既定値を変更しない');

assert.deepEqual(guidedSectionsForPurpose('chat'), CHARACTER_GUIDED_SECTIONS, '人物は9ステップを順番に表示');
assert.deepEqual(guidedSectionsForPurpose('background'), BACKGROUND_GUIDED_SECTIONS, '背景は5ステップを順番に表示');
assert.equal(normalizeGuidedStep('outfit', 'background'), 'camera', '背景で除外された現在位置を次の有効ステップへ補正');
assert.equal(normalizeGuidedStep('broken', 'chat'), 'purpose', '不正なステップは用途へ補正');
const guidedPurposeDraft = selectGuidedPurpose(secondBlankSnapshot.draft, 'icon');
assert.equal(guidedPurposeDraft.purpose, 'icon', 'ガイド中の用途だけを変更');
for (const field of ['composition', 'aspectRatio', 'background', 'negatives'] as LockKey[]) {
  assert.deepEqual(guidedPurposeDraft[field], secondBlankSnapshot.draft[field], `ガイド用途選択で${field}を自動入力しない`);
}

const resetSource: CharacterSnapshot = {
  draft: {
    ...structuredClone(defaultDraft),
    purpose: 'background',
    custom: { ...defaultDraft.custom, character: '非表示の人物設定', unknown: '読み込み由来' },
    generatedGap: {
      seedId: 'test-reset', labelJa: '解除対象', labelEn: 'clear me', segmentIndexes: [0], changes: [],
    },
  },
  locks: { gender: true, background: true },
};
let resetTimeline = createEditorTimeline(resetSource, 'before-reset', 0);
resetTimeline = commitEditorTimeline(resetTimeline, createBlankSnapshot(), { action: 'reset', committedAt: 10 });
assert.equal(resetTimeline.past.length, 1, '全リセットを1回のUndo履歴として記録');
resetTimeline = undoEditorTimeline(resetTimeline);
assert.deepEqual(resetTimeline.present.snapshot, resetSource, 'Undoでリセット前の非表示設定・ロック・ギャップを復元');
resetTimeline = redoEditorTimeline(resetTimeline);
assert.deepEqual(resetTimeline.present.snapshot, createBlankSnapshot(), 'Redoで完全な空欄へ戻す');
assert.equal(commitEditorTimeline(resetTimeline, createBlankSnapshot(), { action: 'reset-again', committedAt: 20 }), resetTimeline, '空欄の再リセットは履歴を増やさない');

const blankRoundTrip = createBlankSnapshot();
assert.deepEqual(parseSnapshot(JSON.stringify(blankRoundTrip)), blankRoundTrip, '空欄状態を端末保存で維持');
assert.deepEqual(parseStudioImport(exportStudioData(blankRoundTrip, []))?.current, blankRoundTrip, '空欄状態をJSONで維持');
assert.deepEqual(decodeShareSnapshot(encodeShareSnapshot(blankRoundTrip)), blankRoundTrip, '空欄状態を共有リンクで維持');
const blankOutputs = generatePrompts(blankRoundTrip.draft);
assert.ok(Object.values(blankOutputs).every((value) => value === ''), '全空欄では推測したプロンプトを表示しない');

const legacyPreferences = parseStudioPreferences(JSON.stringify({ language: 'en', simpleMode: true }));
assert.equal(legacyPreferences.guidedMode, false, '旧表示設定は通常モードへ移行');
assert.equal(legacyPreferences.guidedStep, 'purpose', '旧表示設定の開始位置を補完');
const restoredGuidePreferences = parseStudioPreferences(JSON.stringify({ guidedMode: true, guidedStep: 'scene' }));
assert.equal(restoredGuidePreferences.guidedMode, true, '順番作成モードを再読込');
assert.equal(restoredGuidePreferences.guidedStep, 'scene', '順番作成の現在位置を再読込');
assert.equal(parseStudioPreferences(JSON.stringify({ guidedMode: true, guidedStep: 'broken' })).guidedStep, 'purpose', '不正な保存位置を用途へ補正');

const initialSnapshot: CharacterSnapshot = { draft: structuredClone(defaultDraft), locks: {} };
let editor = createEditorTimeline(initialSnapshot, 'initial', 0);
const styleSnapshot: CharacterSnapshot = { draft: draftWith({ style: 'watercolor' }), locks: {} };
editor = commitEditorTimeline(editor, styleSnapshot, { action: 'style', committedAt: 10 });
const lockedSnapshot: CharacterSnapshot = { draft: styleSnapshot.draft, locks: { style: true } };
editor = commitEditorTimeline(editor, lockedSnapshot, { action: 'lock', committedAt: 20 });
assert.equal(editor.past.length, 2, '手動変更とロックをUndo履歴へ積む');
editor = undoEditorTimeline(editor);
assert.equal(editor.present.snapshot.locks.style, undefined, 'Undoでロックを戻す');
editor = undoEditorTimeline(editor);
assert.equal(editor.present.snapshot.draft.style, defaultDraft.style, '複数回Undoできる');
editor = redoEditorTimeline(editor);
assert.equal(editor.present.snapshot.draft.style, 'watercolor', 'Redoできる');
editor = commitEditorTimeline(editor, { draft: draftWith({ style: 'oil-painting' }), locks: {} }, { action: 'new', committedAt: 30 });
assert.equal(editor.future.length, 0, 'Undo後の新規編集でRedoを破棄');

const portable = exportStudioData(initialSnapshot, parsePresets(oldPresetJson));
const importedPortable = parseStudioImport(portable);
assert.equal(importedPortable?.current.draft.gender, defaultDraft.gender, 'JSON書出・読込を往復');
const sharedSnapshot = decodeShareSnapshot(encodeShareSnapshot(initialSnapshot));
assert.equal(sharedSnapshot?.draft.outfit, defaultDraft.outfit, '共有リンク用データを往復');

assert.equal(getShortcutAction({ key: 'Enter', ctrlKey: true }), 'random', 'Ctrl+Enterでおまかせ');
assert.equal(getShortcutAction({ key: 'Enter', metaKey: true, shiftKey: true }), 'gap', 'Cmd+Shift+Enterでギャップ');
assert.equal(getShortcutAction({ key: 'z', ctrlKey: true }), 'undo', 'Ctrl+ZでUndo');
assert.equal(getShortcutAction({ key: 'z', metaKey: true, shiftKey: true }), 'redo', 'Cmd+Shift+ZでRedo');
assert.equal(getShortcutAction({ key: 'Enter', ctrlKey: true, editable: true }), null, '入力欄ではショートカットを抑止');
assert.equal(getShortcutAction({ key: 'Enter', ctrlKey: true, isComposing: true }), null, 'IME変換中はショートカットを抑止');

const pinnedEntry: HistoryEntry = { ...storedHistory[0], id: 'pinned-old', name: 'keep name', pinned: true };
const updatedPinned = appendHistory([pinnedEntry], { ...pinnedEntry, id: 'pinned-new', name: undefined, pinned: undefined });
assert.equal(updatedPinned[0].name, 'keep name', '同一履歴の名前を保持');
assert.equal(updatedPinned[0].pinned, true, '同一履歴のピン留めを保持');

assert.ok(inferenceAliases.length >= 337, '追加仕様の全aliasを収録');
assert.equal(new Set(inferenceAliases.map((alias) => alias.key)).size, inferenceAliases.length, '推測aliasキーが一意');
for (const alias of inferenceAliases) {
  assert.ok(alias.key.trim(), '推測aliasに空キーがない');
  assert.ok(alias.targets.length > 0, `${alias.key}に推測先がある`);
  for (const target of alias.targets) {
    assert.ok(findChoice(target.category, target.valueId), `${alias.key}の${target.category}/${target.valueId}が現行データに存在`);
  }
}
for (const rule of inferenceRules) {
  assert.ok(findChoice(rule.when.category, rule.when.valueId), `推測ルール条件${rule.when.category}/${rule.when.valueId}が現行データに存在`);
  for (const target of rule.targets) {
    assert.ok(findChoice(target.category, target.valueId), `推測ルール候補${target.category}/${target.valueId}が現行データに存在`);
  }
}

const inferenceCases = {
  A: '30代くらいの男。疲れてる感じの教師。眼鏡。髪は黒くて少し長い。生徒には優しいけど本人はあんまり自信なさそう。',
  B: '無口な吸血鬼の公爵。長年生きていて、人間に疲れている。黒い礼服。月の見える洋館にいそう。',
  C: '飄々としている長身の宮廷魔術師。青みがかった黒髪で、金色の切れ長の目。笑うと意外と人懐こい。',
  D: '優しそうなシスター。白髪で青い目。少し儚い。教会のステンドグラスの光が似合いそう。',
} as const;

const inferredCases = Object.fromEntries(Object.entries(inferenceCases).map(([key, text]) => [
  key,
  inferFromNote({ text, level: 'standard' }),
])) as Record<keyof typeof inferenceCases, InferenceResult>;

const inferredIds = (result: InferenceResult, category: LockKey) => result.values
  .filter((value) => value.category === category)
  .map((value) => value.valueId);
const includesInference = (result: InferenceResult, category: LockKey, valueId: string) =>
  inferredIds(result, category).includes(valueId);

for (const value of Object.values(inferredCases).flatMap((result) => result.values)) {
  assert.ok(value.confidence >= 0 && value.confidence <= 1, '推測信頼度が0〜1');
  assert.equal(Boolean(value.adopted), value.confidence >= 0.78 && !value.requiresConfirmation, '信頼度0.78以上かつ要確認でない候補だけ初期採用');
  assert.ok(findChoice(value.category, value.valueId), `推測結果${value.category}/${value.valueId}が現行データに存在`);
}

for (const [field, id] of [
  ['gender', 'male'], ['ageGroup', 'adult'], ['outfit', 'teacher-like-outfit'],
  ['faceFeatures', 'glasses'], ['hairColors', 'black'], ['hairstyle', 'medium'],
  ['personality', 'gentle'], ['personality', 'tired'], ['personality', 'unreliable'],
] as Array<[LockKey, string]>) {
  assert.ok(includesInference(inferredCases.A, field, id), `Case A: ${field}/${id}`);
}
for (const [field, id] of [
  ['species', 'vampire'], ['personality', 'quiet'], ['personality', 'noble'],
  ['personality', 'tired'], ['outfit', 'vampire-noble-attire'],
  ['background', 'mansion-interior'], ['lighting', 'moon'],
] as Array<[LockKey, string]>) {
  assert.ok(includesInference(inferredCases.B, field, id), `Case B: ${field}/${id}`);
}
assert.ok(!includesInference(inferredCases.B, 'species', 'human'), '「人間に疲れている」を人間種族と誤認しない');
for (const [field, id] of [
  ['personality', 'aloof'], ['personality', 'friendly'], ['build', 'tall'],
  ['outfit', 'court-mage-outfit'], ['hairColors', 'blue-black-hair'],
  ['eyeColor', 'gold'], ['eyeShape', 'almond'],
] as Array<[LockKey, string]>) {
  assert.ok(includesInference(inferredCases.C, field, id), `Case C: ${field}/${id}`);
}
assert.ok(!includesInference(inferredCases.C, 'hairColors', 'black'), '青みがかった黒髪を黒髪と二重抽出しない');
assert.ok(!includesInference(inferredCases.C, 'outfit', 'mage'), '宮廷魔術師を汎用魔術師と二重抽出しない');
for (const [field, id] of [
  ['outfit', 'sister'], ['personality', 'gentle'], ['personality', 'fragile'],
  ['hairColors', 'white'], ['eyeColor', 'blue'], ['background', 'church'],
  ['lighting', 'light-through-stained-glass'],
] as Array<[LockKey, string]>) {
  assert.ok(includesInference(inferredCases.D, field, id), `Case D: ${field}/${id}`);
}

const overlapChecks = [
  ['堕天使', 'species', 'angel'],
  ['ダークエルフ', 'species', 'elf'],
  ['超ロング', 'hairstyle', 'long'],
  ['姫カット', 'outfit', 'princess-outfit'],
  ['傷ついた', 'faceFeatures', 'scar'],
  ['明るい光', 'personality', 'bright'],
] as const;
for (const [text, field, unexpected] of overlapChecks) {
  assert.ok(!includesInference(inferFromNote({ text, level: 'standard' }), field, unexpected), `${text}を${field}/${unexpected}と誤認しない`);
}
assert.ok(!includesInference(inferFromNote({ text: '眼鏡なしの吸血鬼ではない人物', level: 'standard' }), 'faceFeatures', 'glasses'), '否定された眼鏡を抽出しない');
assert.ok(!includesInference(inferFromNote({ text: '眼鏡なしの吸血鬼ではない人物', level: 'standard' }), 'species', 'vampire'), '否定された吸血鬼を抽出しない');
for (const [text, field, id] of [
  ['青い目ではない', 'eyeColor', 'blue'],
  ['髪は黒くない', 'hairColors', 'black'],
  ['30代ではない', 'ageGroup', 'adult'],
  ['30代前半ではない', 'ageGroup', 'adult'],
  ['30代くらいではありません', 'ageGroup', 'adult'],
  ['眼鏡をかけない', 'faceFeatures', 'glasses'],
  ['眼鏡はかけていません', 'faceFeatures', 'glasses'],
  ['吸血鬼ではありません', 'species', 'vampire'],
  ['吸血鬼ではなかった', 'species', 'vampire'],
  ['吸血鬼以外', 'species', 'vampire'],
  ['眼鏡を外している', 'faceFeatures', 'glasses'],
] as Array<[string, LockKey, string]>) {
  assert.ok(!includesInference(inferFromNote({ text, level: 'rich' }), field, id), `${text}の否定対象を採用しない`);
}
for (const text of ['男性でも女性でもない', '吸血鬼でも天使でもない', '黒髪でも白髪でもない']) {
  assert.equal(inferFromNote({ text, level: 'rich' }).values.length, 0, `${text}の並列否定をすべて除外`);
}
for (const [text, field, id] of [
  ['カメラ角度は正面', 'faceFeatures', 'horns'],
  ['三角形の飾り', 'faceFeatures', 'horns'],
  ['深く傷ついている', 'faceFeatures', 'scar'],
  ['明るい髪色', 'personality', 'bright'],
  ['明るい服', 'personality', 'bright'],
  ['ロングコートを着た男性', 'hairstyle', 'long'],
  ['ショートパンツを履く女性', 'hairstyle', 'short'],
  ['ボブという名の男', 'hairstyle', 'bob'],
  ['髪は黒いが、爪が少し長い', 'hairstyle', 'medium'],
  ['森田という名前', 'background', 'forest'],
  ['寺田という名前', 'background', 'temple-grounds'],
  ['姫路に住む', 'outfit', 'princess-outfit'],
  ['歌姫', 'outfit', 'princess-outfit'],
  ['袴田という名前', 'outfit', 'hakama'],
  ['隈なく探す', 'faceFeatures', 'dark-circles'],
  ['大人気のアイドル', 'ageGroup', 'adult'],
  ['象牙色の衣装', 'faceFeatures', 'sharp-canines'],
  ['豪華な部屋', 'personality', 'luxurious'],
  ['上品な服', 'personality', 'elegant'],
  ['ダークな背景', 'personality', 'dark'],
  ['男性向け衣装', 'gender', 'male'],
  ['女性ものの服', 'gender', 'female'],
  ['吸血鬼風の衣装を着た人間', 'species', 'vampire'],
  ['天使のコスプレをした女性', 'species', 'angel'],
  ['悪魔モチーフの服', 'species', 'demon'],
  ['エルフ耳のカチューシャ', 'species', 'elf'],
] as Array<[string, LockKey, string]>) {
  assert.ok(!includesInference(inferFromNote({ text, level: 'rich' }), field, id), `${text}を${field}/${id}と誤認しない`);
}
assert.ok(includesInference(inferFromNote({ text: '若い男装の女性', level: 'standard' }), 'gender', 'female'), '男装の修飾より本人の女性指定を優先');
assert.ok(includesInference(inferFromNote({ text: '若い女装の男性', level: 'standard' }), 'gender', 'male'), '女装の修飾より本人の男性指定を優先');
for (const [text, field, id] of [
  ['悪魔と戦う騎士', 'species', 'demon'],
  ['吸血鬼を狩る騎士', 'species', 'vampire'],
  ['悪魔を召喚する魔術師', 'species', 'demon'],
  ['天使に仕える司祭', 'species', 'angel'],
  ['天使のような女性', 'species', 'angel'],
  ['女性を守る騎士', 'gender', 'female'],
  ['教師と話す学生', 'outfit', 'teacher-like-outfit'],
  ['青白い光', 'skinTone', 'pale'],
  ['青白い炎', 'skinTone', 'pale'],
  ['頭角を現す若者', 'faceFeatures', 'horns'],
] as Array<[string, LockKey, string]>) {
  assert.ok(!includesInference(inferFromNote({ text, level: 'rich' }), field, id), `${text}の関係・修飾対象を本人属性として誤認しない`);
}
assert.ok(includesInference(inferFromNote({ text: '悪魔と戦う騎士', level: 'standard' }), 'outfit', 'knight'), '関係対象を除外して本人の騎士設定は保持');
assert.ok(includesInference(inferFromNote({ text: '教師と話す学生', level: 'standard' }), 'outfit', 'blazer-school-uniform'), '第三者の教師を除外して本人の学生設定は保持');
for (const text of ['悪魔である騎士', '悪魔に変身した騎士', '悪魔として戦う騎士', '悪魔キャラクター']) {
  assert.ok(includesInference(inferFromNote({ text, level: 'standard' }), 'species', 'demon'), `${text}は本人の種族として保持`);
}
for (const [text, expectedGender] of [['男ではなく女', 'female'], ['女ではなく男', 'male'], ['男ではない女', 'female']] as const) {
  const contrast = inferFromNote({ text, level: 'standard' });
  assert.ok(includesInference(contrast, 'gender', expectedGender), `${text}の対比後を採用`);
  assert.equal(contrast.values.filter((value) => value.category === 'gender').length, 1, `${text}の否定側を除外`);
}
for (const text of ['黒髪にしない', '黒髪にはしない', '黒髪にしません', '天使を除外する', '金色の切れ長の目ではない']) {
  const negated = inferFromNote({ text, level: 'rich' });
  if (text.startsWith('黒髪')) assert.ok(!includesInference(negated, 'hairColors', 'black'), `${text}を除外`);
  if (text.startsWith('天使')) assert.ok(!includesInference(negated, 'species', 'angel'), `${text}を除外`);
  if (text.includes('切れ長')) assert.ok(!includesInference(negated, 'eyeShape', 'almond'), `${text}の目形を除外`);
}
assert.ok(includesInference(inferFromNote({ text: '黒髪にしたい', level: 'standard' }), 'hairColors', 'black'), '肯定の黒髪指定は保持');
assert.ok(includesInference(inferFromNote({ text: '青白い肌', level: 'standard' }), 'skinTone', 'pale'), '青白い肌は肌色として保持');
const explicitNoHorns = inferFromNote({ text: '悪魔。角なし', level: 'rich' });
assert.ok(includesInference(explicitNoHorns, 'negatives', 'no-horns-unless-specified'), '明示した角なしを抽出');
assert.ok(!includesInference(explicitNoHorns, 'faceFeatures', 'horns'), '角なし指定時は悪魔から角を再提案しない');
const glassesAction = inferFromNote({ text: '眼鏡を直す', level: 'standard' });
assert.ok(includesInference(glassesAction, 'pose', 'glasses'), '眼鏡を直すポーズを抽出');
assert.ok(includesInference(glassesAction, 'faceFeatures', 'glasses'), '眼鏡を直す人物の眼鏡も抽出');

const levelText = '疲れている吸血鬼の教師';
const strictInference = inferFromNote({ text: levelText, level: 'strict' });
const standardInference = inferFromNote({ text: levelText, level: 'standard' });
const richInference = inferFromNote({ text: levelText, level: 'rich' });
assert.ok(strictInference.values.filter((value) => value.adopted).every((value) => value.source === 'explicit'), 'strictの初期採用は明示だけ');
assert.ok(strictInference.values.every((value) => value.source !== 'suggested'), 'strictでは提案候補を表示しない');
assert.ok(standardInference.values.some((value) => value.source === 'inferred'), 'standardで推測候補を表示');
assert.ok(standardInference.values.some((value) => value.source === 'suggested'), 'standardで提案候補を表示');
assert.ok(richInference.values.length >= standardInference.values.length, 'richはstandard以上の候補を表示');
assert.ok(richInference.values.filter((value) => value.source === 'suggested').some((value) => value.adopted), 'richで強い提案を初期採用');
assert.deepEqual(inferFromNote({ text: levelText, level: 'rich' }), richInference, '同じメモの推測結果が決定的');

const plainVampireStandard = inferFromNote({ text: '吸血鬼', level: 'standard' });
const plainVampireRich = inferFromNote({ text: '吸血鬼', level: 'rich' });
assert.ok(!includesInference(plainVampireStandard, 'expression', 'cold-expression'), 'standardでは弱い吸血鬼表情を広げすぎない');
assert.ok(!includesInference(plainVampireStandard, 'composition', 'waist'), 'standardでは弱い吸血鬼構図を広げすぎない');
assert.ok(includesInference(plainVampireRich, 'expression', 'cold-expression'), 'richでは吸血鬼表情まで提案');
assert.ok(includesInference(plainVampireRich, 'composition', 'waist'), 'richでは吸血鬼構図まで提案');

const richElf = inferFromNote({ text: 'エルフ', level: 'rich' });
assert.ok(includesInference(richElf, 'outfit', 'forest-elf-outfit'), 'エルフには森のエルフ衣装を提案');
assert.ok(!includesInference(richElf, 'outfit', 'dark-elf-outfit'), 'エルフへダークエルフ衣装を誤提案しない');
assert.ok(includesInference(richElf, 'lighting', 'dappled'), 'richの相性補完を背景から照明まで段階適用');
const richTeen = inferFromNote({ text: '10代の男', level: 'rich' });
assert.ok(includesInference(richTeen, 'outfit', 'school'), '10代男性には実在する学生服候補を提案');
assert.ok(!['air-force-uniform', 'android-like-outfit'].some((id) => includesInference(richTeen, 'outfit', id)), '年齢だけで軍・SF衣装を提案しない');
const neutralTeen = inferFromNote({ text: '10代のキャラクター', level: 'standard' });
assert.ok(includesInference(neutralTeen, 'ageGroup', 'teen'), '性別未指定の10代を専用年齢層として抽出');
assert.ok(!includesInference(neutralTeen, 'ageGroup', 'young'), '10代を若い成人へ置き換えない');
assert.ok(includesInference(inferFromNote({ text: '10代の女性', level: 'standard' }), 'ageGroup', 'girl'), '性別指定の10代女性は少女として抽出');
assert.ok(!includesInference(inferFromNote({ text: '10代ではない', level: 'standard' }), 'ageGroup', 'teen'), '否定された10代は抽出しない');
assert.equal(isMinorAge('', 'teen'), true, '性別未指定の10代にも未成年向け安全ルールを適用');
const neutralTeenPrompt = generatePrompts(draftWith({ ageGroup: 'teen', gender: 'unspecified', ageNumber: '' }));
assert.match(neutralTeenPrompt.ja, /10代の人物/, '性別未指定10代の日本語主語を生成');
assert.match(neutralTeenPrompt.en, /teenager/i, '性別未指定10代の英語主語を生成');
const richAdult = inferFromNote({ text: '成人', level: 'rich' });
assert.ok(!includesInference(richAdult, 'outfit', 'android-like-outfit'), '成人だけでSF衣装を提案しない');

for (const text of ['男性か女性', '短髪か長髪', '天使または悪魔']) {
  const ambiguous = inferFromNote({ text, level: 'rich' });
  assert.ok(ambiguous.values.some((value) => value.requiresConfirmation && !value.adopted), `${text}は自動採用せず確認を求める`);
  assert.ok(!ambiguous.values.some((value) => value.source === 'suggested'), `${text}の未確定候補から提案を派生しない`);
}
const androidConflict = inferFromNote({ text: '天使でアンドロイド', level: 'rich' });
assert.ok(!androidConflict.values.some((value) => ['wings', 'holy-light', 'heavenly-scene'].includes(value.valueId)), '敗れた種族候補から提案を派生しない');

const rainyNightClassroom = inferFromNote({ text: '雨の夜の教室', level: 'standard' });
assert.ok(includesInference(rainyNightClassroom, 'background', 'classroom'), '複合シーンから教室を抽出');
assert.ok(includesInference(rainyNightClassroom, 'timeOfDay', 'night'), '複合シーンから夜を抽出');
assert.ok(includesInference(rainyNightClassroom, 'lighting', 'rain-effect'), '複合シーンから雨演出を抽出');
const nightCityInference = inferFromNote({ text: '夜の街', level: 'standard' });
assert.ok(includesInference(nightCityInference, 'background', 'night-city'), '夜の街の背景を抽出');
assert.ok(includesInference(nightCityInference, 'timeOfDay', 'night'), '長い背景aliasからも時間帯を保持');
const rainyAlleyInference = inferFromNote({ text: '雨の路地', level: 'standard' });
assert.ok(includesInference(rainyAlleyInference, 'background', 'rainy-alley-2'), '雨の路地の背景を抽出');
assert.ok(includesInference(rainyAlleyInference, 'lighting', 'rain-effect'), '長い背景aliasからも雨演出を保持');
for (const text of ['雨宮という名前', '夜神という名前']) {
  const nameInference = inferFromNote({ text, level: 'rich' });
  assert.ok(!nameInference.values.some((value) => value.category === 'timeOfDay' || value.valueId === 'rain-effect'), `${text}を天候・時間として誤認しない`);
}
const dryNight = inferFromNote({ text: '雨ではない夜の教室', level: 'standard' });
assert.ok(!includesInference(dryNight, 'lighting', 'rain-effect'), '否定された雨は抽出しない');
assert.ok(includesInference(dryNight, 'timeOfDay', 'night'), '雨の否定後に続く夜は抽出');

const softConflictInput = [
  { category: 'personality', valueId: 'cute', source: 'explicit', confidence: 0.85 },
  { category: 'personality', valueId: 'cruel', source: 'explicit', confidence: 0.85 },
] as InferenceResult['values'];
const softConflictBefore = structuredClone(softConflictInput);
const softOnce = resolveInferenceConflicts(softConflictInput, 'standard');
const softTwice = resolveInferenceConflicts(softConflictInput, 'standard');
assert.deepEqual(softConflictInput, softConflictBefore, '衝突解決は入力候補を変更しない');
assert.deepEqual(softTwice, softOnce, '衝突解決を再実行しても減点が累積しない');
const sourcePriorityResult = resolveInferenceConflicts([
  { category: 'outfit', valueId: 'suit', source: 'explicit', confidence: 0.7 },
  { category: 'outfit', valueId: 'mage', source: 'inferred', confidence: 0.9 },
], 'standard');
assert.equal(sourcePriorityResult.values[0]?.valueId, 'suit', '単一項目は信頼度よりexplicitを優先');
const wingsConflictResult = resolveInferenceConflicts([
  { category: 'negatives', valueId: 'no-wings-unless-specified', labelJa: '翼なし', source: 'explicit', confidence: 0.96, evidence: '翼なし' },
  { category: 'accessories', valueId: 'wings', labelJa: '翼', source: 'suggested', confidence: 0.9, evidence: '天使' },
], 'rich');
assert.ok(includesInference({ rawText: '', normalizedText: '', level: 'rich', ...wingsConflictResult }, 'negatives', 'no-wings-unless-specified'), '明示された翼なしを優先');
assert.ok(!includesInference({ rawText: '', normalizedText: '', level: 'rich', ...wingsConflictResult }, 'accessories', 'wings'), '翼なしと競合する翼提案を除外');

const normalizedInference = inferFromNote({ text: '３０代の男', level: 'standard' });
assert.equal(normalizedInference.rawText, '３０代の男', 'NFKC正規化後も元メモを保持');
assert.ok(includesInference(normalizedInference, 'ageGroup', 'adult'), '全角年代を正規化して抽出');
assert.equal(new Set(normalizedInference.values.map((value) => value.candidateId)).size, normalizedInference.values.length, '候補IDが安定かつ一意');
const validatedInference = validateInferenceResult({
  rawText: 'x', level: 'rich', values: [
    { category: 'species', valueId: 'vampire', source: 'explicit', confidence: 4 },
    { category: 'unknown', valueId: 'bad', source: 'explicit', confidence: 1 },
  ], warnings: [],
}, { text: 'x', level: 'standard' });
assert.equal(validatedInference.values.length, 1, '将来エンジンの無効な構造化候補を除外');
assert.equal(validatedInference.values[0]?.confidence, 1, '将来エンジンの信頼度を0〜1へ正規化');
const confirmationGuard = validateInferenceResult({
  values: [{
    category: 'gender', valueId: 'male', source: 'explicit', confidence: 1,
    adopted: true, requiresConfirmation: true,
  }],
}, { text: '男性か女性', level: 'standard' });
assert.equal(confirmationGuard.values[0]?.adopted, false, '外部エンジン候補も要確認なら自動採用しない');

const inferenceDecisions = (result: InferenceResult, selected?: Set<string>, lockField?: LockKey) => Object.fromEntries(
  result.values.map((value) => {
    const key = value.candidateId ?? `${value.category}:${value.valueId}`;
    return [key, {
      valueId: value.valueId,
      adopted: selected ? selected.has(`${value.category}:${value.valueId}`) : Boolean(value.adopted),
      locked: value.category === lockField,
    } satisfies InferenceDecision];
  }),
);

const caseCBlank = createBlankSnapshot();
const mergedCaseC = mergeInferenceIntoFormState(caseCBlank, inferredCases.C.values, inferenceDecisions(inferredCases.C), 'overwrite');
assert.deepEqual(caseCBlank, createBlankSnapshot(), '推測マージは元snapshotを変更しない');
assert.equal(mergedCaseC.snapshot.draft.outfit, 'court-mage-outfit', '推測衣装を空フォームへ反映');
assert.deepEqual(mergedCaseC.snapshot.draft.hairColors, ['blue-black-hair'], '推測髪色を空フォームへ反映');
assert.equal(mergedCaseC.snapshot.draft.eyeColor, 'gold', '推測目色を空フォームへ反映');
const mergedCaseCOutput = generatePrompts(mergedCaseC.snapshot.draft);
assert.match(mergedCaseCOutput.en, /court mage outfit/i, '反映後の英語指示書へ宮廷魔術師衣装を接続');
assert.match(mergedCaseCOutput.en, /blue-black hair/i, '反映後の英語指示書へ青みがかった黒髪を接続');
assert.match(mergedCaseCOutput.en, /golden eyes/i, '反映後の英語指示書へ金色の目を接続');
assert.doesNotMatch(mergedCaseCOutput.en, /undefined|court-mage-outfit|blue-black-hair/i, '英語指示書に生IDやundefinedを出さない');

const caseDAllSelected = new Set(inferredCases.D.values.map((value) => `${value.category}:${value.valueId}`));
const mergedCaseD = mergeInferenceIntoFormState(createBlankSnapshot(), inferredCases.D.values, inferenceDecisions(inferredCases.D, caseDAllSelected), 'overwrite');
const mergedCaseDOutput = generatePrompts(mergedCaseD.snapshot.draft);
assert.match(mergedCaseDOutput.en, /nun outfit/i, '反映後の英語指示書へシスター服を接続');
assert.match(mergedCaseDOutput.en, /light through stained glass/i, '反映後の英語指示書へステンドグラス光を接続');

const mergeFixture: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [
    { category: 'gender', valueId: 'female', source: 'explicit', confidence: 1, adopted: true },
    { category: 'personality', valueId: 'tired', source: 'explicit', confidence: 1, adopted: true, locked: true },
  ],
};
const mergeFixtureDecisions = inferenceDecisions(mergeFixture, undefined, 'personality');
const overwriteMerged = mergeInferenceIntoFormState(initialSnapshot, mergeFixture.values, mergeFixtureDecisions, 'overwrite');
assert.equal(overwriteMerged.snapshot.draft.gender, 'female', 'overwriteは候補項目だけ置換');
assert.deepEqual(overwriteMerged.snapshot.draft.personality, ['tired'], 'overwriteは複数選択も候補で置換');
assert.equal(overwriteMerged.snapshot.locks.personality, true, '反映したロック候補でカテゴリをロック');
const appendMerged = mergeInferenceIntoFormState(initialSnapshot, mergeFixture.values, mergeFixtureDecisions, 'append');
assert.equal(appendMerged.snapshot.draft.gender, defaultDraft.gender, 'appendは入力済み単一選択を保持');
assert.deepEqual(appendMerged.snapshot.draft.personality, [...defaultDraft.personality, 'tired'], 'appendは複数選択へ重複なく追加');
const skipMerged = mergeInferenceIntoFormState(initialSnapshot, mergeFixture.values, mergeFixtureDecisions, 'skip');
assert.equal(skipMerged.snapshot.draft.gender, defaultDraft.gender, 'skipは入力済み単一選択を保持');
assert.deepEqual(skipMerged.snapshot.draft.personality, defaultDraft.personality, 'skipは入力済み複数選択も保持');
const existingLockMerged = mergeInferenceIntoFormState({ ...initialSnapshot, locks: { gender: true } }, mergeFixture.values, mergeFixtureDecisions, 'overwrite');
assert.equal(existingLockMerged.snapshot.draft.gender, defaultDraft.gender, '既存ロックは上書きでも保持');
assert.deepEqual(existingLockMerged.report.skippedLocked, ['gender'], '既存ロックのスキップ理由を返す');

const manualChoiceFixture: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'gender', valueId: 'male', source: 'explicit', confidence: 1, adopted: true }],
};
const manualChoiceMerged = mergeInferenceIntoFormState(
  createBlankSnapshot(),
  manualChoiceFixture.values,
  { 'gender:male': { valueId: 'female', adopted: true, locked: false } },
  'overwrite',
);
assert.equal(manualChoiceMerged.snapshot.draft.gender, 'female', '別候補への手動変更をフォームへ反映');
const rejectedChoiceMerged = mergeInferenceIntoFormState(
  initialSnapshot,
  manualChoiceFixture.values,
  { 'gender:male': { valueId: 'female', adopted: false, locked: true } },
  'overwrite',
);
assert.deepEqual(rejectedChoiceMerged.snapshot, initialSnapshot, '不採用候補は値もロックも変更しない');

const duplicateAppendSnapshot = { draft: draftWith({ personality: ['tired'] }), locks: {} };
const duplicateAppendResult: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'personality', valueId: 'tired', source: 'explicit', confidence: 1, adopted: true }],
};
const duplicateAppendMerged = mergeInferenceIntoFormState(
  duplicateAppendSnapshot,
  duplicateAppendResult.values,
  inferenceDecisions(duplicateAppendResult),
  'append',
);
assert.deepEqual(duplicateAppendMerged.snapshot.draft.personality, ['tired'], 'appendでも候補を重複させない');
assert.equal(duplicateAppendMerged.report.applied.length, 0, '同一値のappendを反映済みとして報告しない');
assert.ok(duplicateAppendMerged.report.skippedExisting.includes('personality'), '同一値のappendを既存値として報告');

const glassesAppendResult: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'faceFeatures', valueId: 'glasses', source: 'explicit', confidence: 1, adopted: true }],
};
const specificGlassesSnapshot = { draft: draftWith({ faceFeatures: ['round-glasses'] }), locks: {} };
const redundantGlassesAppend = mergeInferenceIntoFormState(
  specificGlassesSnapshot,
  glassesAppendResult.values,
  inferenceDecisions(glassesAppendResult),
  'append',
);
assert.deepEqual(redundantGlassesAppend.snapshot.draft.faceFeatures, ['round-glasses'], '具体的な眼鏡があるとき一般眼鏡をappendしない');
assert.equal(redundantGlassesAppend.report.applied.length, 0, '正規化で消える候補を反映済みとして報告しない');
assert.ok(redundantGlassesAppend.report.skippedConflict.some((item) => item.valueId === 'glasses'), '正規化で消えた理由を競合として報告');
assert.deepEqual(specificGlassesSnapshot.draft.faceFeatures, ['round-glasses'], '正規化付きappendでも元snapshotを変更しない');
const specificGlassesResult: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'faceFeatures', valueId: 'round-glasses', source: 'explicit', confidence: 1, adopted: true }],
};
const upgradedGlassesAppend = mergeInferenceIntoFormState(
  { draft: draftWith({ faceFeatures: ['glasses'] }), locks: {} },
  specificGlassesResult.values,
  inferenceDecisions(specificGlassesResult),
  'append',
);
assert.deepEqual(upgradedGlassesAppend.snapshot.draft.faceFeatures, ['round-glasses'], 'より具体的な眼鏡候補へ正規化してappend');
assert.ok(upgradedGlassesAppend.report.applied.some((item) => item.valueId === 'round-glasses'), '最終状態に残る具体候補だけを反映済みとして報告');
const removedLockedGlasses = mergeInferenceIntoFormState(
  specificGlassesSnapshot,
  glassesAppendResult.values,
  { 'faceFeatures:glasses': { valueId: 'glasses', adopted: true, locked: true } },
  'append',
);
assert.equal(removedLockedGlasses.snapshot.locks.faceFeatures, undefined, '正規化で消えた候補は項目をロックしない');

const lockedCandidateMerged = mergeInferenceIntoFormState(
  initialSnapshot,
  manualChoiceFixture.values,
  { 'gender:male': { valueId: 'female', adopted: true, locked: true } },
  'overwrite',
);
assert.equal(lockedCandidateMerged.snapshot.locks.gender, true, '候補ロックをフォームの項目ロックへ接続');
assert.equal(
  randomizeAll(lockedCandidateMerged.snapshot.draft, lockedCandidateMerged.snapshot.locks, undefined, [], () => 0.1).gender,
  'female',
  '候補ロック後のランダム生成でも値を保持',
);

const elderlyInference: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'ageGroup', valueId: 'elderly', source: 'explicit', confidence: 1, adopted: true }],
};
const numericAgeSnapshot = { draft: draftWith({ ageGroup: 'adult', ageNumber: '35' }), locks: {} };
const overwrittenNumericAge = mergeInferenceIntoFormState(
  numericAgeSnapshot,
  elderlyInference.values,
  inferenceDecisions(elderlyInference),
  'overwrite',
);
assert.equal(overwrittenNumericAge.snapshot.draft.ageGroup, 'elderly', '年代の上書きを反映');
assert.equal(overwrittenNumericAge.snapshot.draft.ageNumber, '', '年代上書き時は未ロックの数値年齢を消して矛盾を防ぐ');
const lockedNumericAge = mergeInferenceIntoFormState(
  { ...numericAgeSnapshot, locks: { ageNumber: true } },
  elderlyInference.values,
  inferenceDecisions(elderlyInference),
  'overwrite',
);
assert.equal(lockedNumericAge.snapshot.draft.ageGroup, 'adult', '数値年齢ロック時は矛盾する年代を反映しない');
assert.ok(lockedNumericAge.report.skippedConflict.some((item) => item.category === 'ageGroup'), '数値年齢との競合理由を返す');
for (const mode of ['append', 'skip'] as const) {
  const preservedNumericAge = mergeInferenceIntoFormState(
    numericAgeSnapshot,
    elderlyInference.values,
    inferenceDecisions(elderlyInference),
    mode,
  );
  assert.equal(preservedNumericAge.snapshot.draft.ageNumber, '35', `${mode}では数値年齢を既存値として保持`);
  assert.equal(preservedNumericAge.snapshot.draft.ageGroup, 'adult', `${mode}では既存年代を保持`);
}

const girlInference: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [
    { category: 'gender', valueId: 'female', source: 'explicit', confidence: 1, adopted: true },
    { category: 'ageGroup', valueId: 'girl', source: 'explicit', confidence: 1, adopted: true },
  ],
};
const genderLockedGirl = mergeInferenceIntoFormState(
  { draft: draftWith({ gender: 'male', ageGroup: 'adult' }), locks: { gender: true } },
  girlInference.values,
  inferenceDecisions(girlInference),
  'overwrite',
);
assert.equal(genderLockedGirl.snapshot.draft.gender, 'male', '性別ロックを保持');
assert.equal(genderLockedGirl.snapshot.draft.ageGroup, 'adult', '性別ロックと矛盾する少女年代も反映しない');
assert.ok(genderLockedGirl.report.skippedConflict.some((item) => item.valueId === 'girl'), '性別と年代の競合理由を返す');

const boyInference = inferFromNote({ text: '少年', level: 'standard' });
const boyDecisions = inferenceDecisions(boyInference);
const boyGender = boyInference.values.find((value) => value.category === 'gender');
assert.ok(boyGender);
boyDecisions[boyGender.candidateId ?? `${boyGender.category}:${boyGender.valueId}`] = {
  valueId: 'female', adopted: true, locked: false,
};
const manuallyConflictingGender = mergeInferenceIntoFormState(
  createBlankSnapshot(), boyInference.values, boyDecisions, 'overwrite',
);
assert.equal(manuallyConflictingGender.snapshot.draft.gender, 'female', '手動変更した性別を優先');
assert.notEqual(manuallyConflictingGender.snapshot.draft.ageGroup, 'boy', '手動性別と矛盾する自動年代を除外');

const noWingsSnapshot = {
  draft: draftWith({ accessories: [], negatives: ['no-wings-unless-specified'] }),
  locks: { negatives: true },
};
const wingsInference: InferenceResult = {
  rawText: '', normalizedText: '', level: 'rich', warnings: [],
  values: [{ category: 'accessories', valueId: 'wings', source: 'suggested', confidence: 0.9, adopted: true }],
};
const blockedWings = mergeInferenceIntoFormState(
  noWingsSnapshot, wingsInference.values, inferenceDecisions(wingsInference), 'overwrite',
);
assert.deepEqual(blockedWings.snapshot.draft.accessories, [], 'ロック済み翼なしに反する翼候補を除外');
assert.ok(blockedWings.report.skippedConflict.some((item) => item.valueId === 'wings'), '翼競合のスキップ理由を返す');

const incomingNoWings: InferenceResult = {
  rawText: '', normalizedText: '', level: 'rich', warnings: [],
  values: [{ category: 'negatives', valueId: 'no-wings-unless-specified', source: 'explicit', confidence: 1, adopted: true }],
};
const blockedNoWings = mergeInferenceIntoFormState(
  { draft: draftWith({ accessories: ['wings'], negatives: [] }), locks: { accessories: true } },
  incomingNoWings.values,
  inferenceDecisions(incomingNoWings),
  'overwrite',
);
assert.deepEqual(blockedNoWings.snapshot.draft.negatives, [], 'ロック済み翼と矛盾する翼なし候補を除外');
assert.ok(blockedNoWings.report.skippedConflict.some((item) => item.valueId === 'no-wings-unless-specified'), '逆向きの翼競合理由も返す');

const hornsAndTraitInference: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [
    { category: 'negatives', valueId: 'no-horns-unless-specified', source: 'explicit', confidence: 1, adopted: true },
    { category: 'personality', valueId: 'gentle', source: 'explicit', confidence: 1, adopted: true },
  ],
};
const existingHornsMerge = mergeInferenceIntoFormState(
  { draft: draftWith({ faceFeatures: ['horns'], negatives: [], personality: [] }), locks: {} },
  hornsAndTraitInference.values,
  inferenceDecisions(hornsAndTraitInference),
  'overwrite',
);
assert.deepEqual(existingHornsMerge.snapshot.draft.negatives, [], '未ロックの既存角とも矛盾する角なし候補を除外');
assert.deepEqual(existingHornsMerge.snapshot.draft.personality, ['gentle'], '別の有効候補は同時に反映');
assert.ok(existingHornsMerge.report.skippedConflict.some((item) => item.valueId === 'no-horns-unless-specified'), '最終状態で消える角なし候補を競合として報告');
assert.ok(!existingHornsMerge.report.applied.some((item) => item.valueId === 'no-horns-unless-specified'), '消える角なし候補を反映済みとして報告しない');

const incomingHorns: InferenceResult = {
  rawText: '', normalizedText: '', level: 'standard', warnings: [],
  values: [{ category: 'faceFeatures', valueId: 'horns', source: 'explicit', confidence: 1, adopted: true }],
};
for (const mode of ['overwrite', 'append', 'skip'] as const) {
  const preservedNoHorns = mergeInferenceIntoFormState(
    { draft: draftWith({ faceFeatures: [], negatives: ['no-horns-unless-specified'] }), locks: {} },
    incomingHorns.values,
    inferenceDecisions(incomingHorns),
    mode,
  );
  assert.deepEqual(preservedNoHorns.snapshot.draft.faceFeatures, [], `${mode}で既存の角なしに反する角候補を除外`);
  assert.deepEqual(preservedNoHorns.snapshot.draft.negatives, ['no-horns-unless-specified'], `${mode}で既存の角なしを保持`);
  assert.ok(preservedNoHorns.report.skippedConflict.some((item) => item.valueId === 'horns'), `${mode}で角候補の競合理由を返す`);
}

const mergeSafety = (
  snapshot: CharacterSnapshot,
  values: InferenceResult['values'],
) => {
  const result: InferenceResult = {
    rawText: '', normalizedText: '', level: 'standard', warnings: [], values,
  };
  return mergeInferenceIntoFormState(snapshot, values, inferenceDecisions(result), 'overwrite');
};

const minorAdultConflict = mergeSafety(createBlankSnapshot(), [
  { category: 'ageGroup', valueId: 'girl', source: 'explicit', confidence: 1, adopted: true },
  { category: 'personality', valueId: 'sensual', source: 'explicit', confidence: 1, adopted: true },
]);
assert.equal(minorAdultConflict.snapshot.draft.ageGroup, 'girl', '未成年年代の明示候補を保持');
assert.deepEqual(minorAdultConflict.snapshot.draft.personality, [], '未成年と成人向け属性を同時反映しない');
assert.ok(minorAdultConflict.report.skippedConflict.some((item) => item.valueId === 'sensual'), '未成年との安全競合を報告');

const lockedChildSnapshot: CharacterSnapshot = {
  draft: { ...createBlankSnapshot().draft, ageGroup: 'child', ageNumber: '12' },
  locks: { ageNumber: true },
};
const childSafetyConflict = mergeSafety(lockedChildSnapshot, [
  { category: 'species', valueId: 'succubus', source: 'explicit', confidence: 1, adopted: true },
  { category: 'build', valueId: 'powerful', source: 'explicit', confidence: 1, adopted: true },
  { category: 'outfit', valueId: 'athletic-swimwear', source: 'explicit', confidence: 1, adopted: true },
  { category: 'expression', valueId: 'seductive-expression', source: 'explicit', confidence: 1, adopted: true },
]);
assert.equal(childSafetyConflict.snapshot.draft.species, '', '12歳ロック時に成人向け種族を反映しない');
assert.equal(childSafetyConflict.snapshot.draft.build, '', '12歳ロック時に不適切な体格を反映しない');
assert.equal(childSafetyConflict.snapshot.draft.outfit, '', '12歳ロック時に成人向け衣装を反映しない');
assert.equal(childSafetyConflict.snapshot.draft.expression, '', '12歳ロック時に成人向け表情を反映しない');
assert.equal(childSafetyConflict.report.skippedConflict.length, 4, '年齢安全ルールの除外をすべて報告');

const genderSpeciesConflict = mergeSafety(createBlankSnapshot(), [
  { category: 'gender', valueId: 'male', source: 'explicit', confidence: 1, adopted: true },
  { category: 'species', valueId: 'succubus', source: 'explicit', confidence: 1, adopted: true },
]);
assert.equal(genderSpeciesConflict.snapshot.draft.gender, 'male', '同順位の本人属性では性別を保持');
assert.equal(genderSpeciesConflict.snapshot.draft.species, '', '男性とサキュバスを同時反映しない');

const lockedUnderwater = mergeSafety({
  draft: { ...createBlankSnapshot().draft, background: 'underwater' },
  locks: { background: true },
}, [{ category: 'pose', valueId: 'reading', source: 'explicit', confidence: 1, adopted: true }]);
assert.equal(lockedUnderwater.snapshot.draft.pose, '', '水中背景ロック時に読書ポーズを反映しない');
const lockedReading = mergeSafety({
  draft: { ...createBlankSnapshot().draft, pose: 'reading' },
  locks: { pose: true },
}, [{ category: 'background', valueId: 'underwater', source: 'explicit', confidence: 1, adopted: true }]);
assert.equal(lockedReading.snapshot.draft.background, '', '読書ポーズロック時に水中背景を反映しない');

const incomingSceneConflict = mergeSafety(createBlankSnapshot(), [
  { category: 'background', valueId: 'underwater', source: 'explicit', confidence: 1, adopted: true },
  { category: 'pose', valueId: 'reading', source: 'suggested', confidence: 0.6, adopted: true },
]);
assert.equal(incomingSceneConflict.snapshot.draft.background, 'underwater', '候補同士の競合では高優先候補を保持');
assert.equal(incomingSceneConflict.snapshot.draft.pose, '', '候補同士の競合では低優先候補だけを除外');

const lockedDay = mergeSafety({
  draft: { ...createBlankSnapshot().draft, timeOfDay: 'day' },
  locks: { timeOfDay: true },
}, [{ category: 'lighting', valueId: 'moon', source: 'explicit', confidence: 1, adopted: true }]);
assert.deepEqual(lockedDay.snapshot.draft.lighting, [], '昼ロック時に月明かりを反映しない');
assert.ok(lockedDay.report.skippedConflict.some((item) => item.valueId === 'moon'), '時間帯と照明の競合を報告');

console.log(JSON.stringify({
  ok: true,
  counts,
  samples: {
    A: outputA.en.slice(0, 140),
    B: outputB.en.slice(0, 140),
    C: outputC.en.slice(0, 140),
    D: outputD.en.slice(0, 140),
    E: outputE.en.slice(0, 140),
  },
}, null, 2));
