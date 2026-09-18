import assert from 'node:assert/strict';
import { cameraAngles, compositions, findChoice, optionsByField } from '@/data/options';
import { cameraAngles as originalAngles } from '@/data/cameraAngles';
import { compositions as originalCompositions } from '@/data/compositions';
import { expandedCameraAngles, expandedCompositions, isSceneComposition } from '@/data/camera-expansion';
import { categoriesForField } from '@/data/choice-categories';
import { defaultDraft } from '@/data/presets';
import { analyzePromptNotices, generatePrompts } from '@/lib/prompt-engine';
import { calculateFinalWeight, randomizeAll, randomizeField, type WeightContext } from '@/lib/random-engine';
import { decodeShareSnapshot, encodeShareSnapshot, hydrateDraft } from '@/lib/storage';
import { diffSnapshots } from '@/lib/character-insights';
import type { CharacterSnapshot } from '@/lib/character-types';

assert.equal(cameraAngles.length, 30);
assert.equal(compositions.length, 35);
assert.equal(new Set(cameraAngles.map((choice) => choice.id)).size, 30);
assert.equal(new Set(compositions.map((choice) => choice.id)).size, 35);
for (const [field, oldOptions] of [['cameraAngle', originalAngles], ['composition', originalCompositions]] as const) {
  for (const choice of oldOptions) assert.deepEqual(findChoice(field, choice.id), choice, '保存済みのID・名称・重みを維持');
  for (const choice of optionsByField[field]!) assert.ok(categoriesForField(field).some((category) => category.matches(choice)), `カテゴリ未分類: ${choice.id}`);
}
for (const [field, additions] of [['cameraAngle', expandedCameraAngles], ['composition', expandedCompositions]] as const) {
  for (const choice of additions) {
    const draft = { ...hydrateDraft(defaultDraft), [field]: choice.id };
    const output = generatePrompts(draft);
    assert.ok(output.ja.includes(choice.labelJa), `${choice.id}の日本語出力`);
    assert.ok(output.en.includes(choice.labelEn), `${choice.id}の英語出力`);
    assert.ok(output.tags.includes(choice.labelEn.replace(/\bthe\b/gi, '').replace(/\s+/g, ' ').trim()), `${choice.id}のタグ出力`);
    assert.ok(!choice.tags.includes('horns'), '三角形などを身体の特徴と誤解釈しない');
    const snapshot: CharacterSnapshot = { draft, locks: { [field]: true } };
    assert.deepEqual(decodeShareSnapshot(encodeShareSnapshot(snapshot)), snapshot, '共有・保存の往復');
  }
}
const source: CharacterSnapshot = { draft: hydrateDraft(defaultDraft), locks: {} };
const selected: CharacterSnapshot = { draft: { ...source.draft, cameraAngle: 'rear-left', composition: 'space-right' }, locks: { cameraAngle: true, composition: true } };
const changes = diffSnapshots(source, selected);
assert.ok(changes.some((change) => change.field === 'cameraAngle' && change.afterJa === '左斜め後ろから'));
assert.ok(changes.some((change) => change.field === 'composition' && change.afterJa === '右側に広い余白'));
const randomized = randomizeAll(selected.draft, selected.locks, undefined, [], () => 0.53);
assert.equal(randomized.cameraAngle, 'rear-left');
assert.equal(randomized.composition, 'space-right');
assert.deepEqual(randomized.faceFeatures, []);

const background = { ...hydrateDraft(defaultDraft), purpose: 'background', background: 'forest', composition: 'layered-depth' };
for (const choice of expandedCompositions.filter((item) => isSceneComposition(item.id))) {
  const draft = { ...background, composition: choice.id };
  assert.ok(generatePrompts(draft).en.includes(choice.labelEn), `背景出力に${choice.id}を反映`);
  assert.ok(!analyzePromptNotices(draft).some((notice) => notice.id === 'background-hidden-composition'));
}
assert.ok(!generatePrompts({ ...background, composition: 'eye-detail' }).en.includes('extreme close-up focused on the eyes'));
const backgroundContext: WeightContext = { field: 'composition', draft: background, history: [], resolvedFields: new Set(['purpose']), gapMode: 'coherent' };
assert.equal(calculateFinalWeight(findChoice('composition', 'eye-detail')!, backgroundContext), 0);
assert.ok(calculateFinalWeight(findChoice('composition', 'layered-depth')!, backgroundContext) > 0);
for (let index = 0; index < 12; index++) {
  const draft = randomizeField(background, 'composition', undefined, [], () => index / 12);
  assert.ok(isSceneComposition(draft.composition), '背景のサイコロで人物専用構図を選ばない');
  assert.ok(generatePrompts(draft).en.includes(findChoice('composition', draft.composition)!.labelEn));
}
const noHorns = generatePrompts({ ...defaultDraft, composition: 'triangular-balance', negatives: ['no-horns-unless-specified'] });
assert.ok(noHorns.negativeEn.toLowerCase().includes('horn'), '三角構図が角の禁止指定を消さない');
console.log('Camera checks passed: 30 angles, 35 compositions, categories, bilingual output, locks, sharing, and backgrounds.');
