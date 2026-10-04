import assert from 'node:assert/strict';
import {
  assetChoices,
  createAssetDraft,
  draftFromAssetPreset,
} from '@/data/asset-options';
import {
  advancedAssetStyles,
  assetStyleCategories,
  rpgMangaChoices,
} from '@/data/asset-style-catalog';
import { rpgMangaEffects } from '@/data/asset-rpg-manga-effects';
import { filterEffects, effectCategories } from '@/data/asset-effect-catalog';
import { assetStyles, filterAssetStyles } from '@/lib/asset-style';
import {
  buildAssetOutputs,
  buildAssetPrompt,
  serializeAssetDraft,
  parseAssetDraft,
} from '@/lib/asset-prompt';
import { randomizeAsset } from '@/lib/asset-random';

assert.equal(rpgMangaEffects.length, 192);
assert.equal(filterEffects('rpg').length, 96);
assert.equal(filterEffects('manga').length, 96);
assert.equal(assetStyles.length, 68);
assert.equal(advancedAssetStyles.length, 48);
assert.equal(assetStyleCategories.length, 5);
assert.equal(new Set(assetStyles.map((style) => style.id)).size, 68);
assert.equal(
  new Set(advancedAssetStyles.map((style) => style.promptJa)).size,
  48,
);
assert.equal(new Set(advancedAssetStyles.map((style) => style.en)).size, 48);
assert.equal(filterAssetStyles('rpg').length, 24);
assert.equal(filterAssetStyles('manga').length, 24);
assert.equal(filterAssetStyles('general').length, 20);
assert.ok(
  filterEffects('rpg', '回復').some((item) => item.id === 'rpg-heal-fountain'),
);
assert.ok(
  filterEffects('manga', '集中線').some(
    (item) => item.id === 'manga-focus-thin',
  ),
);
assert.ok(filterEffects('all', 'manga halftone').length > 0);
assert.equal(filterEffects('manga', 'RPG').length, 0);
assert.ok(
  filterAssetStyles('rpg', '16bit').some(
    (item) => item.id === 'rpg-pixel-16bit',
  ),
);
assert.ok(
  filterAssetStyles('all', 'manga crosshatching').some(
    (item) => item.id === 'manga-tone-crosshatch',
  ),
);
assert.equal(filterAssetStyles('manga', '16bit').length, 0);
assert.equal(filterAssetStyles('all', '存在しない画風_123').length, 0);
for (const category of assetStyleCategories.filter(
  (item) => item.id !== 'general',
))
  assert.equal(filterAssetStyles(category.id).length, 12);
for (const [field, additions] of Object.entries(rpgMangaChoices)) {
  for (const item of additions)
    assert.ok(
      assetChoices[field as 'background' | 'framing'].some(
        (option) => option.id === item.id,
      ),
    );
}

for (const style of advancedAssetStyles) {
  const draft = { ...createAssetDraft(), style: style.id, palette: 'blue' };
  const before = structuredClone(draft);
  const outputs = buildAssetOutputs(draft);
  assert.ok(outputs.ja.includes(style.promptJa!));
  assert.ok(outputs.en.includes(style.en));
  assert.ok(outputs.blocks.includes(style.en));
  assert.ok(outputs.short.includes(style.en));
  assert.ok(outputs.tags.includes(style.en));
  if (style.monochrome) {
    assert.match(outputs.ja, /配色: モノクロ/);
    for (const mode of ['en', 'short', 'tags', 'both', 'blocks'] as const)
      assert.doesNotMatch(outputs[mode], /blue and cyan|ブルー・シアン/);
    assert.match(outputs.en, /Palette: monochrome/);
  }
  assert.deepEqual(draft, before, 'Output changed stored palette');
  assert.deepEqual(parseAssetDraft(serializeAssetDraft(draft)), draft);
}
assert.match(
  buildAssetPrompt(createAssetDraft(), 'en').positive,
  /Palette: blue and cyan/,
);

let seed = 90833;
const random = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
for (const usage of ['rpg', 'manga'] as const) {
  for (const format of ['still', 'video', 'sprites'] as const) {
    for (let i = 0; i < 40; i++) {
      const draft = { ...createAssetDraft(), format };
      const result = randomizeAsset(draft, {
        subjectIds: filterEffects(usage).map((item) => item.id),
        random,
      }).draft;
      assert.ok(
        filterEffects(usage).some((item) => item.id === result.subjects.effect),
      );
      assert.equal(
        advancedAssetStyles.find((item) => item.id === result.style)?.usage,
        usage,
      );
      if (usage === 'manga') {
        assert.equal(result.palette, 'mono');
        assert.ok(['front', 'orthographic'].includes(result.camera));
        assert.ok(!result.framing.startsWith('rpg-'));
        assert.ok(
          ['white', 'black', 'transparent'].includes(result.background) ||
            result.background.startsWith('manga-'),
        );
      } else assert.ok(!result.background.startsWith('manga-'));
      assert.deepEqual(parseAssetDraft(serializeAssetDraft(result)), result);
    }
  }
}
for (const family of effectCategories.filter((item) => item.usage)) {
  const draft = createAssetDraft();
  draft.subjects.effect = filterEffects(family.id)[0].id;
  const result = randomizeAsset(draft, { field: 'style', random }).draft;
  assert.equal(
    advancedAssetStyles.find((item) => item.id === result.style)?.usage,
    family.usage,
  );
}
const empty = createAssetDraft();
assert.deepEqual(
  randomizeAsset(empty, { field: 'style', styleIds: [], random }).draft,
  empty,
);
assert.equal(
  randomizeAsset(empty, { styleIds: [], random }).draft.style,
  empty.style,
);
const filtered = randomizeAsset(empty, {
  field: 'style',
  styleIds: ['manga-gpen'],
  random,
}).draft;
assert.equal(filtered.style, 'manga-gpen');
assert.equal(
  filtered.palette,
  empty.palette,
  'A style-only shuffle must preserve the palette setting',
);
assert.equal(
  randomizeAsset(
    { ...empty, randomLocks: ['style'] },
    { styleIds: ['manga-gpen'], random },
  ).draft.style,
  empty.style,
);
for (const id of [
  'rpg-slash-sheet',
  'rpg-heal-sheet',
  'rpg-barrier-loop',
  'manga-focus-panel',
  'manga-impact-panel',
  'manga-flower-panel',
]) {
  const draft = draftFromAssetPreset(id);
  assert.notEqual(draft.style, 'anime');
  assert.deepEqual(parseAssetDraft(serializeAssetDraft(draft)), draft);
  assert.match(
    buildAssetPrompt(draft, 'en').negative,
    /people, characters, mascots/,
  );
}
console.log(
  'RPG/manga checks passed: 192 new effects, 48 detailed styles, filters, contextual randomization, monochrome output, and six presets.',
);
