import assert from 'node:assert/strict';
import { optionsByField } from '@/data/options';
import { createBlankSnapshot } from '@/lib/guided-builder';
import { inferFromNote } from '@/lib/inference/infer-from-note';
import { inferenceDecisionKey } from '@/lib/inference/types';
import { createEmptyNoteWorkspace, parseNoteWorkspace } from '@/lib/inference/note-workspace';
import { DEFAULT_STUDIO_PREFERENCES, encodeShareSnapshot, exportStudioData } from '@/lib/storage';
import { exportStudioBackup, MAX_BACKUP_BYTES, parseAnyStudioImport, parseStudioBackup, type StudioWorkspace } from '@/lib/studio-backup';
import { createShareUrl, prepareShareSnapshot, readShareUrl } from '@/lib/share-snapshot';
import { diffSnapshots } from '@/lib/character-insights';

const note = '銀髪で青い目の成人女性。穏やかで、白いドレスを着ている。';
const result = inferFromNote({ text: note, level: 'standard' });
assert.ok(result.values.length > 1);
const candidate = result.values[0];
const candidateKey = inferenceDecisionKey(candidate);
const noteWorkspace = {
  ...createEmptyNoteWorkspace(), note, result,
  decisions: { [candidateKey]: { valueId: candidate.valueId, adopted: false, locked: true } },
  mergeMode: 'append' as const,
};
const restoredNote = parseNoteWorkspace(noteWorkspace)!;
assert.equal(restoredNote.note, note, 'メモ下書きを復元');
assert.equal(restoredNote.mergeMode, 'append');
assert.deepEqual(restoredNote.decisions[candidateKey], noteWorkspace.decisions[candidateKey], '採用の解除・ロックを復元');
const alternative = optionsByField[candidate.category]?.find((choice) => choice.id !== candidate.valueId);
assert.ok(alternative);
const alternativeId = alternative.id;
assert.equal(parseNoteWorkspace({ ...noteWorkspace, decisions: { [candidateKey]: { valueId: alternativeId, adopted: true, locked: true } } })!.decisions[candidateKey].valueId, alternativeId, '変更した代替候補も復元');
assert.equal(parseNoteWorkspace({ ...noteWorkspace, note: `${note}変更` })!.result, null, '古いメモに対する候補を適用しない');
assert.equal(parseNoteWorkspace({ ...noteWorkspace, level: 'strict' })!.result, null, '推測レベルの異なる候補を復元しない');
assert.equal(parseNoteWorkspace({ ...noteWorkspace, note: 'a'.repeat(5001) }), null);
assert.equal(parseNoteWorkspace(null), null);
assert.equal(parseNoteWorkspace([]), null);
assert.equal(parseNoteWorkspace({ ...noteWorkspace, decisions: { [candidateKey]: { valueId: 'invalid', adopted: 'yes' } } })!.decisions[candidateKey].valueId, candidate.valueId);

const current = createBlankSnapshot();
current.draft.gender = 'female';
current.draft.custom.outfit = '未公開の衣装案';
current.draft.custom.scene = '一般公開してよい背景の補足';
current.locks.gender = true;
current.draft.generatedGap = {
  seedId: 'test', labelJa: '検証用', labelEn: 'Test', segmentIndexes: [],
  changes: [{ field: 'gender', previous: 'private-old-value', applied: 'female' }],
};
const date = '2026-09-18T00:00:00.000Z';
const history = [{ id: 'h1', label: '変更前', createdAt: date, snapshot: createBlankSnapshot(), pinned: true, source: 'random' as const }];
const workspace: StudioWorkspace = {
  current, presets: [{ id: 'p1', name: '大切な設定', createdAt: date, updatedAt: date, snapshot: current, pinned: true }],
  history, randomHistory: history,
  preferences: { ...DEFAULT_STUDIO_PREFERENCES, onboardingSeen: true, favoriteChoices: { gender: ['female'] }, recentChoices: { gender: ['male'] }, colorMode: 'dark' },
  noteWorkspace, editorMode: 'note',
};
const raw = exportStudioBackup(workspace);
const backup = parseStudioBackup(raw)!;
assert.ok(backup);
assert.equal(backup.noteWorkspace.note, note);
assert.deepEqual(backup.noteWorkspace.decisions[candidateKey], noteWorkspace.decisions[candidateKey]);
assert.equal(backup.current.draft.custom.outfit, '未公開の衣装案');
assert.equal(backup.current.locks.gender, true);
assert.deepEqual(backup.preferences.favoriteChoices, workspace.preferences.favoriteChoices);
assert.deepEqual(backup.preferences.recentChoices, workspace.preferences.recentChoices);
assert.equal(backup.preferences.colorMode, 'dark');
assert.equal(backup.editorMode, 'note');
assert.equal(backup.presets[0].name, '大切な設定');
assert.equal(backup.history[0].pinned, true);
assert.equal(backup.randomHistory[0].id, 'h1');
const manyFavorites = optionsByField.outfit!.slice(0, 40).map((choice) => choice.id);
const manyFavoritesBackup = parseStudioBackup(exportStudioBackup({ ...workspace, preferences: { ...workspace.preferences, favoriteChoices: { outfit: manyFavorites } } }))!;
assert.deepEqual(manyFavoritesBackup.preferences.favoriteChoices.outfit, manyFavorites, '30件を超えるお気に入りを切り捨てない');
assert.deepEqual(parseStudioBackup(exportStudioBackup(backup)), backup, '完全バックアップの再書出・再読込は安定');
assert.ok(parseAnyStudioImport(raw)?.workspace);
assert.equal(parseAnyStudioImport(exportStudioData(current, workspace.presets))?.current.draft.custom.outfit, '未公開の衣装案', '従来のJSONも移行');
assert.equal(parseAnyStudioImport(JSON.stringify(current))?.current.draft.gender, 'female', '従来の単体設定も移行');
assert.equal(parseStudioBackup(raw.replace('"version":2', '"version":99')), null);
assert.equal(parseAnyStudioImport(raw.replace('"version":2', '"version":99')), null);
assert.equal(parseStudioBackup('{bad'), null);
assert.equal(parseStudioBackup(JSON.stringify({ ...JSON.parse(raw), noteWorkspace: null })), null);
assert.equal(parseStudioBackup(JSON.stringify({ ...JSON.parse(raw), history: null })), null);
assert.equal(parseStudioBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), null);

const original = JSON.stringify(current);
const sanitized = prepareShareSnapshot(current);
assert.deepEqual(sanitized.draft.custom, {}, '自由入力を初期状態では共有しない');
assert.deepEqual(sanitized.locks, {}, 'ロックは共有しない');
assert.equal(sanitized.draft.generatedGap, undefined, '以前の値を含むギャップ履歴を共有しない');
assert.equal(JSON.stringify(current), original, '共有設定の選択は元の入力を変更しない');
assert.deepEqual(prepareShareSnapshot(current, ['scene']).draft.custom, { scene: '一般公開してよい背景の補足' });
const share = createShareUrl('https://example.com/character-order-room/?unrelated=1#preview', sanitized);
assert.equal(new URL(share).search, '', '共有内容をクエリで送らない');
assert.ok(new URL(share).hash.startsWith('#state='));
assert.ok(!JSON.stringify(readShareUrl(share).snapshot).includes('未公開'));
assert.ok(!JSON.stringify(readShareUrl(share).snapshot).includes('private-old-value'));
assert.equal(readShareUrl(share).snapshot!.draft.gender, 'female');
assert.equal(readShareUrl(share).cleanUrl, 'https://example.com/character-order-room/');
const oldShare = `https://example.com/?state=${encodeShareSnapshot(current)}&other=1`;
assert.equal(readShareUrl(oldShare).snapshot!.draft.custom.outfit, '未公開の衣装案', '既存リンクは受信時に確認して読み込める');
assert.equal(readShareUrl(oldShare).cleanUrl, 'https://example.com/?other=1');
assert.equal(readShareUrl('https://example.com/#state=invalid').snapshot, null);
assert.equal(readShareUrl('https://example.com/').present, false);
assert.equal(readShareUrl('https://example.com/#state=').present, true);
assert.equal(readShareUrl(`https://example.com/#state=${'a'.repeat(100_001)}`).snapshot, null);
const changes = diffSnapshots(createBlankSnapshot(), current);
assert.ok(changes.some((change) => change.id === 'field-gender'), '項目単位の差分を保持');
assert.ok(changes.length >= 3, '自由入力を含む全変更を確認できる');
console.log('Input protection, backup, sharing, and note restoration tests passed.');
