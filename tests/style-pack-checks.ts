import assert from 'node:assert/strict';
import { stylePresets } from '@/data/style-presets';
import { antiAiBlocks } from '@/data/anti-ai-blocks';
import { styleCategories, styleCompatibility, antiAiStrengths } from '@/data/style-categories';
import { defaultDraft } from '@/data/presets';
import { addAntiAi, buildAntiAiBlock, emptyStylePack, filterStylePresets, findAntiAiBlock, formatPromptBlocks, normalizeStylePack, pickRandomStyle, recommendAntiAiBlocks, stylePackWarnings } from '@/lib/style-pack';
import { promptBlockNames, type StylePackSelection } from '@/lib/style-pack-types';
import { buildPromptBlocks, generateStudioPrompts } from '@/lib/prompt-blocks';
import { analyzePromptNotices, generatePrompts } from '@/lib/prompt-engine';
import { DEFAULT_STUDIO_PREFERENCES, decodeShareSnapshot, encodeShareSnapshot, exportStudioData, hydrateDraft, parseStudioImport } from '@/lib/storage';
import { createBlankSnapshot } from '@/lib/guided-builder';
import { createEmptyNoteWorkspace } from '@/lib/inference/note-workspace';
import { exportStudioBackup, parseStudioBackup, type StudioWorkspace } from '@/lib/studio-backup';
import { prepareShareSnapshot } from '@/lib/share-snapshot';
import { diffSnapshots } from '@/lib/character-insights';
import { commitEditorTimeline, createEditorTimeline, redoEditorTimeline, undoEditorTimeline } from '@/lib/editor-timeline';
import { randomizeAll } from '@/lib/random-engine';

assert.equal(stylePresets.length, 80);
assert.equal(new Set(stylePresets.map((item) => item.id)).size, 80);
assert.equal(antiAiBlocks.length, 30);
assert.equal(new Set(antiAiBlocks.map((item) => item.id)).size, 30);
assert.equal(styleCategories.length, 8);
for (const category of styleCategories) {
  assert.ok(stylePresets.some((item) => item.category === category.id));
  assert.equal(recommendAntiAiBlocks(category.id).length, 3);
  for (const id of styleCompatibility[category.id]) assert.ok(findAntiAiBlock(id), id);
  const selected = pickRandomStyle(category.id, undefined, () => 0.999999);
  assert.equal(selected.category, category.id);
}
for (const preset of stylePresets) {
  assert.ok(preset.stylePrompt && preset.nameJa && preset.nameEn && preset.useCases.length && preset.tags.length);
  assert.ok(!/[\u3040-\u30ff\u3400-\u9fff]/.test(preset.stylePrompt));
  assert.ok(filterStylePresets(preset.nameJa).some((item) => item.id === preset.id));
  assert.ok(filterStylePresets(preset.nameEn.toUpperCase()).some((item) => item.id === preset.id));
  const draft = { ...hydrateDraft(defaultDraft), stylePack: { ...emptyStylePack(), presetId: preset.id } };
  const before = JSON.stringify(draft);
  const blocks = buildPromptBlocks(draft);
  assert.equal(blocks.STYLE, preset.stylePrompt);
  assert.equal(blocks.ANTI_AI, '', '補助を勝手に追加しない');
  assert.ok(blocks.AVOID.includes('no watermark'));
  assert.ok(generatePrompts(draft).positiveEn.includes(preset.stylePrompt));
  assert.equal(JSON.stringify(draft), before, '出力で入力を変更しない');
}
for (const block of antiAiBlocks) assert.ok(block.intent && block.caution && block.antiAiPrompt);
assert.equal(filterStylePresets('', 'all', []).length, 0);
assert.equal(filterStylePresets('', 'all', [stylePresets[0].id]).length, 1);
assert.equal(filterStylePresets('存在しない画風').length, 0);
assert.ok(filterStylePresets('版画').every((item) => item.category === 'printmaking'));
assert.notEqual(pickRandomStyle('all', stylePresets[0].id, () => 0).id, stylePresets[0].id);
assert.equal(normalizeStylePack(null), undefined);
assert.equal(normalizeStylePack([]), undefined);
assert.deepEqual(normalizeStylePack({ presetId: 'bad', antiAiIds: ['bad', null], excludedBlocks: ['BAD'] }), emptyStylePack());
assert.deepEqual(addAntiAi(['line_irregularity_light'], 'line_irregularity_strong'), ['line_irregularity_strong']);
assert.deepEqual(addAntiAi(['limited_palette_5'], 'limited_palette_8'), ['limited_palette_8']);
assert.equal(normalizeStylePack({ antiAiIds: antiAiBlocks.map((item) => item.id) })?.antiAiIds.length, 5);
assert.deepEqual(addAntiAi(antiAiStrengths.strong, 'matte_finish'), antiAiStrengths.strong);
assert.equal(addAntiAi(antiAiStrengths.strong, 'line_irregularity_strong').length, 5);
assert.ok(addAntiAi(antiAiStrengths.strong, 'line_irregularity_strong').includes('line_irregularity_strong'));
assert.equal(buildAntiAiBlock(['reduced_polish', 'reduced_polish']), findAntiAiBlock('reduced_polish')?.antiAiPrompt);

const snapshot = createBlankSnapshot();
snapshot.draft.custom.character = 'CONTENT検証用の人物';
snapshot.draft.custom.style = '保存するが混ぜない画風';
snapshot.draft.style = defaultDraft.style;
snapshot.draft.styleTraits = [...defaultDraft.styleTraits];
const selection: StylePackSelection = { presetId: stylePresets[0].id, antiAiIds: [...antiAiStrengths.medium], excludedBlocks: [] };
snapshot.draft.stylePack = selection;
snapshot.locks.style = true;
const blocks = buildPromptBlocks(snapshot.draft);
assert.ok(blocks.CONTENT.includes('CONTENT検証用の人物'));
assert.ok(!blocks.CONTENT.includes(snapshot.draft.custom.style));
assert.ok(!blocks.CONTENT.includes(blocks.STYLE));
assert.equal(blocks.ANTI_AI, buildAntiAiBlock(selection.antiAiIds));
assert.ok(!generatePrompts(snapshot.draft).ja.includes(snapshot.draft.custom.style));
assert.ok(generatePrompts({ ...snapshot.draft, stylePack: undefined }).ja.includes(snapshot.draft.custom.style));
assert.ok(!analyzePromptNotices(snapshot.draft).some((notice) => notice.id === 'translation-style'));
assert.ok(stylePackWarnings({ ...selection, presetId: 'glossy_anime', antiAiIds: ['matte_finish'] }).length);
assert.ok(stylePackWarnings({ ...selection, antiAiIds: antiAiStrengths.strong }).length);
const excluded = ['ANTI_AI', 'AVOID'] as const;
for (const mode of ['formatted', 'line', 'json'] as const) {
  const output = formatPromptBlocks(blocks, [...excluded], mode);
  assert.ok(!output.includes('ANTI_AI') && !output.includes('AVOID'));
  assert.ok(output.includes(blocks.STYLE));
  assert.equal(formatPromptBlocks(blocks, [...promptBlockNames], mode), '');
}
assert.deepEqual(Object.keys(JSON.parse(formatPromptBlocks(blocks, [], 'json'))), [...promptBlockNames]);
assert.ok(!formatPromptBlocks(blocks, [], 'line').includes('\n'));
assert.ok(!formatPromptBlocks({ ...blocks, ANTI_AI: '' }).includes('[ANTI_AI]'));
assert.equal(generateStudioPrompts({ ...snapshot.draft, stylePack: { ...selection, excludedBlocks: ['AVOID'] } }).blocks, formatPromptBlocks(blocks, ['AVOID']));
assert.equal(generateStudioPrompts(createBlankSnapshot().draft).blocks, '');
assert.equal(hydrateDraft(defaultDraft).stylePack, undefined, '旧入力に画風を追加しない');
assert.deepEqual(hydrateDraft(snapshot.draft).stylePack, selection);
assert.deepEqual(decodeShareSnapshot(encodeShareSnapshot(prepareShareSnapshot(snapshot)))?.draft.stylePack, selection);
assert.deepEqual(parseStudioImport(exportStudioData(snapshot, []))?.current.draft.stylePack, selection);
const date = '2026-09-18T00:00:00Z';
const workspace: StudioWorkspace = {
  current: snapshot, presets: [{ id: 'style-template', name: '画風テンプレート', createdAt: date, updatedAt: date, snapshot }],
  history: [{ id: 'style-history', label: '画風を選択', createdAt: date, snapshot }], randomHistory: [],
  preferences: { ...DEFAULT_STUDIO_PREFERENCES, favoriteChoices: { stylePack: stylePresets.map((item) => item.id) } },
  noteWorkspace: createEmptyNoteWorkspace(), editorMode: 'form',
};
const restored = parseStudioBackup(exportStudioBackup(workspace))!;
assert.deepEqual(restored.current, snapshot);
assert.deepEqual(restored.presets[0].snapshot, snapshot);
assert.deepEqual(restored.history[0].snapshot, snapshot);
assert.equal(restored.preferences.favoriteChoices.stylePack.length, 80);
const reset = createBlankSnapshot();
assert.equal(reset.draft.stylePack, undefined);
const changes = diffSnapshots(reset, { ...snapshot, draft: { ...snapshot.draft, stylePack: { ...selection, excludedBlocks: ['AVOID'] } } });
for (const id of ['style-pack', 'style-helpers', 'style-blocks']) assert.ok(changes.some((item) => item.id === id));
const timeline = commitEditorTimeline(createEditorTimeline(reset), snapshot, { action: '画風を選択' });
assert.deepEqual(undoEditorTimeline(timeline).present.snapshot, reset);
assert.deepEqual(redoEditorTimeline(undoEditorTimeline(timeline)).present.snapshot, snapshot);
const randomized = randomizeAll(snapshot.draft, snapshot.locks, undefined, [], () => 0.41);
assert.deepEqual(randomized.stylePack, selection);
assert.notEqual(randomized.stylePack, selection, 'ランダム案と元入力が同じ参照を共有しない');
assert.deepEqual(randomized.faceFeatures, []);
console.log('Style pack checks passed: 80 styles, 30 helpers, block formats, persistence, sharing, diff, undo, reset.');
