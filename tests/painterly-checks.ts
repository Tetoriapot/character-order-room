import assert from 'node:assert/strict';
import { painterlyPresets } from '@/data/painterly-presets';
import { painterlyAvoidChoices, painterlyControls } from '@/data/painterly-options';
import { stylePresets } from '@/data/style-presets';
import { normalizePainterly, painterlyAvoids } from '@/lib/painterly-style';
import { buildStylePrompt } from '@/lib/smooth-clean';
import { emptyStylePack, normalizeStylePack, stylePackWarnings } from '@/lib/style-pack';
import { buildPromptBlocks, generateStudioPrompts } from '@/lib/prompt-blocks';
import { createBlankSnapshot } from '@/lib/guided-builder';
import { decodeShareSnapshot, encodeShareSnapshot, exportStudioData, hydrateDraft, parseStudioImport, DEFAULT_STUDIO_PREFERENCES } from '@/lib/storage';
import { exportStudioBackup, parseStudioBackup, type StudioWorkspace } from '@/lib/studio-backup';
import { createEmptyNoteWorkspace } from '@/lib/inference/note-workspace';
import { prepareShareSnapshot } from '@/lib/share-snapshot';
import { diffSnapshots } from '@/lib/character-insights';
import { commitEditorTimeline, createEditorTimeline, redoEditorTimeline, undoEditorTimeline } from '@/lib/editor-timeline';
import { setCastEnabled } from '@/lib/character-cast';
import { randomizeAll } from '@/lib/random-engine';
import type { PainterlySettings } from '@/lib/style-pack-types';

assert.equal(painterlyPresets.length, 5);
assert.equal(painterlyAvoidChoices.length, 18);
assert.equal(normalizePainterly({ brushTexture: 'invalid', excludedAvoidIds: ['invalid'] }), undefined);
for (const bad of [null, [], 5, 'bold']) assert.equal(normalizePainterly(bad), undefined);
assert.deepEqual(normalizePainterly({ brushTexture: 'gouache', unknown: true, excludedAvoidIds: ['muddy_colors', 'muddy_colors', 'invalid'] }), { brushTexture: 'gouache', excludedAvoidIds: ['muddy_colors'] });
assert.deepEqual(normalizeStylePack({ ...emptyStylePack(), painterly: {} }), emptyStylePack());
const settings: PainterlySettings = { brushTexture: 'gouache', hairRendering: 'sharp', colorLight: 'pastel', backgroundTreatment: 'bright', excludedAvoidIds: ['cel_shading', 'muddy_colors'] };
const snapshot = createBlankSnapshot();
snapshot.draft.custom.character = 'A character with green hair and a red coat';
snapshot.draft.stylePack = { ...emptyStylePack(), presetId: painterlyPresets[0].id, painterly: settings };
const original = JSON.stringify(snapshot);
const blocks = buildPromptBlocks(snapshot.draft);
assert.ok(blocks.CONTENT.includes(snapshot.draft.custom.character));
assert.ok(!blocks.CONTENT.includes('gouache'));
assert.ok(blocks.STYLE.includes('sharp and delicate anime facial features'));
assert.ok(!blocks.STYLE.includes('silver hair') && !blocks.STYLE.includes('lemonade'));
assert.equal(blocks.ANTI_AI, '');
const outputs = generateStudioPrompts(snapshot.draft);
for (const control of painterlyControls) {
  for (const option of control.options) {
    const selection = { [control.key]: option.id };
    const prompt = buildStylePrompt(painterlyPresets[0], undefined, normalizePainterly(selection));
    assert.ok(prompt.includes(option.prompt));
    for (const other of control.options.filter((item) => item.id !== option.id)) assert.ok(!prompt.includes(other.prompt), 'replace the control instead of appending conflicting options');
  }
  assert.ok(outputs.positiveJa.includes(control.options.find((item) => item.id === settings[control.key])!.ja));
}
for (const avoid of painterlyAvoidChoices) {
  const expected = !settings.excludedAvoidIds?.includes(avoid.id);
  for (const text of [blocks.AVOID, outputs.en, outputs.short, outputs.tags]) assert.equal(text.includes(avoid.prompt), expected, avoid.id);
  assert.equal(outputs.negativeJa.includes(avoid.ja), expected, avoid.id);
}
assert.equal(JSON.stringify(snapshot), original, 'generating prompts must not mutate inputs');
assert.equal(painterlyAvoids(painterlyPresets[0], { excludedAvoidIds: painterlyAvoidChoices.map((item) => item.id) }).length, 0);
const classic = stylePresets.find((style) => !style.painterly)!;
assert.equal(buildStylePrompt(classic, undefined, settings), classic.stylePrompt);
assert.deepEqual(painterlyAvoids(classic, settings), []);
assert.ok(!generateStudioPrompts({ ...snapshot.draft, stylePack: { ...snapshot.draft.stylePack, presetId: classic.id } }).en.includes('avoid airbrushed finish'));
assert.ok(!generateStudioPrompts({ ...snapshot.draft, stylePack: { ...snapshot.draft.stylePack, presetId: '' } }).ja.includes('厚塗りの設定'));
for (const style of painterlyPresets) {
  assert.equal(buildStylePrompt(style), style.stylePrompt);
  const switched = buildStylePrompt(style, undefined, settings);
  assert.ok(switched.includes('gouache-like digital painting'));
  assert.ok(switched.includes('sharp simplified hair silhouettes'));
}
assert.equal(stylePackWarnings(snapshot.draft.stylePack).length, 0);
assert.ok(stylePackWarnings({ ...snapshot.draft.stylePack, smoothClean: { smoothnessLevel: 'smooth', hairClumpSize: 'large' } }).length >= 2);
assert.ok(buildStylePrompt(painterlyPresets[0], { hairDetailLevel: 'low' }, settings).includes('override conflicting preset detail directions'));
assert.deepEqual(hydrateDraft(snapshot.draft).stylePack, snapshot.draft.stylePack);
assert.deepEqual(decodeShareSnapshot(encodeShareSnapshot(prepareShareSnapshot(snapshot)))?.draft.stylePack, snapshot.draft.stylePack);
assert.deepEqual(parseStudioImport(exportStudioData(snapshot, []))?.current.draft.stylePack, snapshot.draft.stylePack);
const workspace: StudioWorkspace = { current: snapshot, presets: [], history: [], randomHistory: [], preferences: DEFAULT_STUDIO_PREFERENCES, noteWorkspace: createEmptyNoteWorkspace(), editorMode: 'form' };
assert.deepEqual(parseStudioBackup(exportStudioBackup(workspace))?.current.draft.stylePack, snapshot.draft.stylePack);
const blank = createBlankSnapshot();
const changes = diffSnapshots(blank, snapshot);
for (const control of painterlyControls) assert.ok(changes.some((item) => item.id === `painterly-${control.key}`));
assert.ok(changes.some((item) => item.id === 'painterly-avoid'));
const timeline = commitEditorTimeline(createEditorTimeline(blank), snapshot, { action: 'Painterly controls' });
assert.deepEqual(undoEditorTimeline(timeline).present.snapshot, blank);
assert.deepEqual(redoEditorTimeline(undoEditorTimeline(timeline)).present.snapshot, snapshot);
assert.deepEqual(randomizeAll(snapshot.draft, { style: true }, undefined, [], () => 0.4).stylePack, snapshot.draft.stylePack);
const cast = setCastEnabled(snapshot, true);
assert.equal(generateStudioPrompts(cast.draft).positiveEn.split('expressive anime painterly illustration').length - 1, 1, 'group mode outputs one shared style');
assert.deepEqual(hydrateDraft(cast.draft).stylePack, snapshot.draft.stylePack);
assert.equal(createBlankSnapshot().draft.stylePack, undefined);
console.log('Painterly checks passed: 5 profiles, 12 control choices, 18 negatives, non-mutating output, compatibility, save/import/share, undo and group mode.');
