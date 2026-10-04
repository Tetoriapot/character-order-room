import assert from 'node:assert/strict';
import {
  assetChoices,
  assetSubjects,
  createAssetDraft,
  type AssetDraft,
} from '@/data/asset-options';
import {
  effectCatalog,
  effectCategories,
  filterEffects,
} from '@/data/asset-effect-catalog';
import { assetRandomFields, randomizeAsset } from '@/lib/asset-random';
import {
  buildAssetOutputs,
  buildAssetPrompt,
  parseAssetDraft,
  serializeAssetDraft,
} from '@/lib/asset-prompt';

assert.equal(effectCatalog.length, 384);
assert.equal(effectCategories.length, 32);
assert.equal(assetSubjects.object.length - 1, 51);
assert.equal(assetSubjects.motion.length - 1, 39);
for (const [name, choices] of Object.entries({
  ...assetChoices,
  ...assetSubjects,
})) {
  assert.equal(
    new Set(choices.map((item) => item.id)).size,
    choices.length,
    `Duplicate IDs: ${name}`,
  );
  for (const item of choices) {
    assert.ok(item.ja.trim(), `${name}:${item.id} missing Japanese`);
    if (item.id !== 'custom')
      assert.ok(item.en.trim(), `${name}:${item.id} missing English`);
  }
}
assert.equal(new Set(effectCatalog.map((item) => item.promptJa)).size, 384);
assert.equal(new Set(effectCatalog.map((item) => item.en)).size, 384);
for (const category of effectCategories) {
  assert.equal(filterEffects(category.id).length, 12);
  for (const [field, ids] of [
    ['effectShape', category.shapes],
    ['motion', category.motions],
    ['palette', category.palettes],
    ['lighting', category.lights],
  ] as const) {
    for (const id of ids)
      assert.ok(
        assetChoices[field].some((item) => item.id === id),
        `Unknown ${field}: ${id}`,
      );
  }
}
assert.ok(
  filterEffects('water', '渦').some((item) => item.id === 'water-vortex'),
);
assert.ok(
  filterEffects('all', 'WATER transparent').some(
    (item) => item.id === 'splash',
  ),
);
assert.ok(filterEffects('all', '宇宙').length >= 12);
assert.equal(filterEffects('fire', 'water-vortex').length, 0);
assert.equal(filterEffects('all', 'NO_MATCH_確実に存在しない').length, 0);

// Every real record reaches both languages and all six output formats.
for (const effect of effectCatalog) {
  const draft = createAssetDraft();
  draft.subjects.effect = effect.id;
  assert.ok(buildAssetPrompt(draft, 'ja').positive.includes(effect.promptJa));
  assert.ok(buildAssetPrompt(draft, 'en').positive.includes(effect.en));
  const outputs = buildAssetOutputs(draft);
  for (const mode of ['ja', 'en', 'both', 'short', 'tags', 'blocks'] as const) {
    const output = outputs[mode];
    assert.doesNotMatch(output, /undefined|NaN/);
    assert.match(output, /人物|people/);
  }
}

let seed = 73291;
const random = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
for (const category of ['effect', 'object', 'motion'] as const) {
  for (const format of ['still', 'video', 'sprites'] as const) {
    const source: AssetDraft = { ...createAssetDraft(), category, format };
    source.notes = '必ず残す追加指定';
    source.negativeNotes = '必ず残す禁止指定';
    source.phases = { start: '開始', peak: '展開', end: '終了' };
    source.randomLocks = ['style', 'background'];
    const before = structuredClone(source);
    for (let run = 0; run < 60; run++) {
      const group = effectCategories[run % effectCategories.length];
      const subjectIds =
        category === 'effect'
          ? filterEffects(group.id).map((item) => item.id)
          : undefined;
      const { draft: result, changed } = randomizeAsset(source, {
        random,
        subjectIds,
      });
      assert.deepEqual(source, before, 'Randomization mutated its input');
      assert.deepEqual(parseAssetDraft(serializeAssetDraft(result)), result);
      assert.equal(result.category, category);
      assert.equal(result.format, format);
      assert.equal(result.style, source.style);
      assert.equal(result.background, source.background);
      assert.equal(result.notes, source.notes);
      assert.equal(result.negativeNotes, source.negativeNotes);
      assert.deepEqual(result.details, source.details);
      assert.deepEqual(result.phases, source.phases);
      assert.deepEqual(result.exclusions, source.exclusions);
      assert.deepEqual(result.randomLocks, source.randomLocks);
      assert.notEqual(result.subjects[category], 'custom');
      for (const field of Object.keys(assetChoices)) {
        if (!assetRandomFields(source).includes(field as never)) {
          assert.deepEqual(
            result[field as keyof AssetDraft],
            source[field as keyof AssetDraft],
            `Changed hidden field: ${field}`,
          );
        }
      }
      for (const other of ['effect', 'object', 'motion'] as const) {
        if (other !== category)
          assert.equal(result.subjects[other], source.subjects[other]);
      }
      if (subjectIds) {
        assert.ok(subjectIds.includes(result.subjects.effect));
        assert.ok(group.palettes.includes(result.palette));
        assert.ok(group.shapes.includes(result.effectShape));
        assert.ok(group.lights.includes(result.lighting));
        if (format !== 'still')
          assert.ok(group.motions.includes(result.motion));
      }
      assert.ok(changed.length > 0);
      assert.match(
        buildAssetPrompt(result, 'en').negative,
        /people, characters, mascots/,
      );
      assert.notEqual(result.framing, 'close');
    }
    for (const field of assetRandomFields(source)) {
      const { draft: one, changed } = randomizeAsset(source, { field, random });
      assert.ok(changed.every((changedField) => changedField === field));
      const expected = structuredClone(source);
      if (field === 'subject')
        expected.subjects[category] = one.subjects[category];
      else expected[field] = one[field];
      assert.deepEqual(
        one,
        expected,
        `Single-field shuffle changed other values: ${field}`,
      );
    }
    source.randomLocks = assetRandomFields(source);
    assert.deepEqual(randomizeAsset(source, { random }).draft, source);
    assert.deepEqual(randomizeAsset(source, { random }).changed, []);
  }
}

const detailed = createAssetDraft();
detailed.details.effect = '編集済みの具体的な指定';
assert.equal(
  randomizeAsset(detailed, { random }).draft.subjects.effect,
  detailed.subjects.effect,
);
const explicit = randomizeAsset(detailed, {
  random,
  field: 'subject',
  subjectIds: ['fire-ring'],
}).draft;
assert.equal(explicit.subjects.effect, 'fire-ring');
assert.deepEqual(explicit.details, detailed.details);
assert.deepEqual(
  randomizeAsset(detailed, { random, field: 'subject', subjectIds: [] }).draft,
  detailed,
);
assert.equal(
  randomizeAsset(createAssetDraft(), { random, subjectIds: [] }).draft.subjects
    .effect,
  'particles',
);
const rotating = {
  ...createAssetDraft(),
  format: 'video' as const,
  motion: 'rotate',
};
assert.ok(
  ['clockwise', 'counterclockwise'].includes(
    randomizeAsset(rotating, { field: 'direction', random }).draft.direction,
  ),
);
assert.equal(
  randomizeAsset(
    { ...rotating, motion: 'pulse' },
    { field: 'direction', random },
  ).draft.direction,
  '',
);
assert.equal(
  randomizeAsset(
    { ...rotating, randomLocks: ['direction'] },
    { field: 'direction', random },
  ).draft.direction,
  rotating.direction,
);

// New locks round-trip, while old backups load with no locks.
const locked = { ...createAssetDraft(), randomLocks: ['subject', 'style'] };
const backup = JSON.parse(serializeAssetDraft(locked as AssetDraft));
assert.deepEqual(
  parseAssetDraft(JSON.stringify(backup)).randomLocks,
  locked.randomLocks,
);
delete backup.draft.randomLocks;
assert.deepEqual(parseAssetDraft(JSON.stringify(backup)).randomLocks, []);
for (const invalid of [null, 'style', ['format'], ['notes'], ['bogus'], [1]]) {
  backup.draft.randomLocks = invalid;
  assert.throws(() => parseAssetDraft(JSON.stringify(backup)), /ロック/);
}
console.log(
  'Asset catalog/random checks passed: 384 bilingual effects, categories/search, constrained randomization, locks, preservation, and legacy backups.',
);
