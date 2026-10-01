import assert from 'node:assert/strict';
import { smoothCleanPresets, smoothCleanHelpers } from '@/data/smooth-clean-addon';
import { smoothCleanAvoidChoices, smoothCleanControls } from '@/data/smooth-clean-options';
import { styleCategories } from '@/data/style-categories';
import { automaticSmoothCleanHelpers, buildStylePrompt, normalizeSmoothClean } from '@/lib/smooth-clean';
import { buildAntiAiBlock, effectiveStyleHelperIds, emptyStylePack, normalizeStylePack, recommendAntiAiBlocks, stylePackWarnings } from '@/lib/style-pack';
import { buildPromptBlocks, generateStudioPrompts } from '@/lib/prompt-blocks';
import { createBlankSnapshot } from '@/lib/guided-builder';
import { decodeShareSnapshot, encodeShareSnapshot, exportStudioData, hydrateDraft, parseStudioImport, DEFAULT_STUDIO_PREFERENCES } from '@/lib/storage';
import { exportStudioBackup, parseStudioBackup, type StudioWorkspace } from '@/lib/studio-backup';
import { createEmptyNoteWorkspace } from '@/lib/inference/note-workspace';
import { prepareShareSnapshot } from '@/lib/share-snapshot';
import { diffSnapshots } from '@/lib/character-insights';
import { commitEditorTimeline, createEditorTimeline, redoEditorTimeline, undoEditorTimeline } from '@/lib/editor-timeline';
import { randomizeAll } from '@/lib/random-engine';
import type { SmoothCleanSettings } from '@/lib/style-pack-types';

assert.equal(smoothCleanPresets.length, 24);
assert.equal(smoothCleanHelpers.length, 18);
assert.equal(styleCategories.find((item) => item.id === 'smooth_clean')?.weight, 1.2);
assert.ok(smoothCleanPresets.every((item) => item.category === 'smooth_clean' && item.weight === 1.05));
assert.deepEqual(recommendAntiAiBlocks('smooth_clean').map((item) => item.id), ['anti_overdetailed_hair', 'smooth_surface_finish', 'restrained_ornament']);
const settings: SmoothCleanSettings = { hairDetailLevel: 'low', hairClumpSize: 'large', hairTipStyle: 'soft', ornamentLevel: 'minimal', smoothnessLevel: 'smooth', avoidIds: smoothCleanAvoidChoices.map((item) => item.id) };
const automatic = automaticSmoothCleanHelpers(settings);
assert.deepEqual(automatic, ['anti_overdetailed_hair', 'anti_flyaway_noise', 'face_over_hair_priority', 'reduced_texture_buildup', 'large_hair_clumps_prompt', 'clean_silhouette_priority', 'anti_spiky_hair_ends', 'soft_grouped_bangs', 'restrained_ornament', 'reduced_accessory_count', 'minimal_outfit_folds', 'smooth_surface_finish', 'controlled_highlights', 'low_clutter_character_finish']);
assert.equal(normalizeSmoothClean({ hairDetailLevel: 'wrong', avoidIds: ['invalid'] }), undefined);
assert.deepEqual(normalizeSmoothClean({ hairDetailLevel: 'low', unknown: 'bad', avoidIds: ['flyaways', 'flyaways', 'invalid'] }), { hairDetailLevel: 'low', avoidIds: ['flyaways'] });
assert.deepEqual(normalizeStylePack({ ...emptyStylePack(), smoothClean: { unknown: true } }), emptyStylePack());
const snapshot = createBlankSnapshot();
snapshot.draft.custom.character = 'Keep this character';
snapshot.draft.stylePack = { presetId: smoothCleanPresets[0].id, antiAiIds: ['anti_overdetailed_hair', 'matte_finish', 'line_irregularity_light', 'subtle_paper_texture', 'limited_palette_5'], excludedBlocks: [], smoothClean: settings };
const selection = normalizeStylePack(snapshot.draft.stylePack)!;
snapshot.draft.stylePack = selection;
const manual = [...selection.antiAiIds];
assert.equal(manual.length, 5);
assert.equal(effectiveStyleHelperIds(selection).length, 18, '5 manual + 14 auto - 1 duplicate');
for (const helper of smoothCleanHelpers.filter((item) => automatic.includes(item.id))) {
  for (const phrase of helper.antiAiPrompt.split(',').map((item) => item.trim())) assert.ok(buildAntiAiBlock(manual, settings).includes(phrase), helper.id);
}
const withoutControl = { ...selection, smoothClean: { ...settings, hairDetailLevel: undefined } };
assert.ok(effectiveStyleHelperIds(withoutControl).includes('anti_overdetailed_hair'), 'manual choice survives clearing control');
assert.ok(!effectiveStyleHelperIds(withoutControl).includes('anti_flyaway_noise'), 'auto-only choice is removed');
assert.deepEqual(effectiveStyleHelperIds({ ...selection, smoothClean: undefined }), manual);
const blocks = buildPromptBlocks(snapshot.draft);
assert.ok(blocks.CONTENT.includes('Keep this character'));
assert.ok(!blocks.CONTENT.includes('Rendering controls'));
assert.ok(blocks.STYLE.includes('preserving refined eyes and facial features'));
assert.ok(blocks.STYLE.includes('override conflicting preset detail directions'));
assert.equal(blocks.ANTI_AI, buildAntiAiBlock(manual, settings));
const outputs = generateStudioPrompts(snapshot.draft);
for (const avoid of smoothCleanAvoidChoices) {
  assert.ok(blocks.AVOID.includes(avoid.prompt));
  for (const text of [outputs.en, outputs.short, outputs.tags]) assert.ok(text.includes(avoid.prompt));
  assert.ok(outputs.negativeJa.includes(avoid.ja));
}
for (const control of smoothCleanControls) {
  for (const option of control.options) {
    const individual = normalizeSmoothClean({ [control.key]: option.id });
    assert.ok(buildStylePrompt(smoothCleanPresets[0], individual).includes(option.prompt));
    assert.deepEqual(automaticSmoothCleanHelpers(individual), option.helperIds);
  }
}
assert.ok(stylePackWarnings({ ...selection, smoothClean: { hairDetailLevel: 'high' } }).length);
assert.ok(!generateStudioPrompts({ ...snapshot.draft, stylePack: { ...selection, presetId: '' } }).en.includes('Rendering controls'), 'classic output ignores inactive controls');
assert.deepEqual(hydrateDraft(snapshot.draft).stylePack, selection);
assert.deepEqual(decodeShareSnapshot(encodeShareSnapshot(prepareShareSnapshot(snapshot)))?.draft.stylePack, selection);
assert.deepEqual(parseStudioImport(exportStudioData(snapshot, []))?.current.draft.stylePack, selection);
const workspace: StudioWorkspace = { current: snapshot, presets: [], history: [], randomHistory: [], preferences: DEFAULT_STUDIO_PREFERENCES, noteWorkspace: createEmptyNoteWorkspace(), editorMode: 'form' };
assert.deepEqual(parseStudioBackup(exportStudioBackup(workspace))?.current.draft.stylePack, selection);
const blank = createBlankSnapshot();
const changes = diffSnapshots(blank, snapshot);
for (const control of smoothCleanControls) assert.ok(changes.some((item) => item.id === `smooth-${control.key}`));
assert.ok(changes.some((item) => item.id === 'smooth-avoid'));
const timeline = commitEditorTimeline(createEditorTimeline(blank), snapshot, { action: 'Smooth controls' });
assert.deepEqual(undoEditorTimeline(timeline).present.snapshot, blank);
assert.deepEqual(redoEditorTimeline(undoEditorTimeline(timeline)).present.snapshot, snapshot);
assert.deepEqual(randomizeAll(snapshot.draft, { style: true }, undefined, [], () => 0.4).stylePack, selection);
console.log('Smooth clean checks passed: catalog, 15 control options, 14 auto helpers, 10 exclusions, persistence, diff, undo and sharing.');
