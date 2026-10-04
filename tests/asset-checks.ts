import assert from 'node:assert/strict';
import {
  assetCategories,
  assetPresets,
  createAssetDraft,
  draftFromAssetPreset,
} from '@/data/asset-options';
import {
  ASSET_STORAGE_KEY,
  buildAssetPrompt,
  buildAssetOutputs,
  parseAssetDraft,
  serializeAssetDraft,
} from '@/lib/asset-prompt';
import { STORAGE_KEYS } from '@/lib/storage';
import { WORKSPACE_KEY } from '@/lib/studio-backup';
import { formatPromptBlocks } from '@/lib/style-pack';
import { promptBlockNames } from '@/lib/style-pack-types';
import { outputTabs } from '@/lib/prompt-output-tabs';

for (const category of assetCategories) {
  for (const format of ['still', 'video', 'sprites'] as const) {
    for (const language of ['ja', 'en'] as const) {
      const draft = { ...createAssetDraft(), category: category.id, format };
      const output = buildAssetPrompt(draft, language);
      assert.match(
        output.positive,
        language === 'ja'
          ? /人物・キャラクター・マスコットを描かず/
          : /No people, characters, mascots/,
      );
      assert.match(
        output.negative,
        language === 'ja'
          ? /人体のシルエット、擬人化/
          : /human silhouettes, anthropomorphism/,
      );
      assert.ok(output.full.includes(output.negative));
      assert.doesNotMatch(output.full, /undefined|NaN/);
      assert.deepEqual(parseAssetDraft(serializeAssetDraft(draft)), draft);
    }
  }
}

const configured = createAssetDraft();
configured.details = {
  effect: '効果用の指定',
  object: 'オブジェクト用の指定',
  motion: '動作用の指定',
};
configured.phases = {
  start: '開始の指定',
  peak: 'ピークの指定',
  end: '終了の指定',
};
configured.material = 'glass';
configured.motion = 'rotate';
configured.cameraMotion = 'orbit';
configured.loop = 'seamless';
configured.exclusions.push('flicker', 'shake');
const still = buildAssetPrompt(configured, 'ja').full;
assert.match(still, /効果用の指定/);
assert.doesNotMatch(
  still,
  /オブジェクト用の指定|動作用の指定|ガラス|開始の指定|ピークの指定|終了の指定|回転|カメラの動き|尺・フレームレート|ループ|ちらつき|手ぶれ/,
);
const object = buildAssetPrompt(
  { ...configured, category: 'object' },
  'ja',
).full;
assert.match(object, /オブジェクト用の指定/);
assert.match(object, /ガラス/);
assert.doesNotMatch(object, /効果用の指定|動作用の指定|エフェクトの形・密度/);
const motionStill = buildAssetPrompt(
  { ...configured, category: 'motion' },
  'en',
).full;
assert.match(
  motionStill,
  /Moment of motion captured in a single still image: rotation/,
);
assert.doesNotMatch(motionStill, /Playback:|Duration|Start:|Camera movement:/);
const video = buildAssetPrompt({ ...configured, format: 'video' }, 'ja').full;
assert.match(video, /開始: 開始の指定/);
assert.match(video, /シームレスループ/);
assert.match(video, /周囲を回り込む/);
assert.match(video, /3秒、24 fps/);
const sprites = buildAssetPrompt(
  { ...configured, format: 'sprites', frameCount: '12' },
  'ja',
).full;
assert.match(sprites, /横4列 × 縦3行/);
assert.match(sprites, /カメラ固定/);
assert.doesNotMatch(sprites, /周囲を回り込む|尺・フレームレート|3秒/);

assert.equal(
  buildAssetPrompt(createAssetDraft(), 'en').warnings.some((warning) =>
    warning.includes('原文'),
  ),
  false,
);
assert.ok(
  buildAssetPrompt(configured, 'en').warnings.some((warning) =>
    warning.includes('原文'),
  ),
);
const custom = createAssetDraft();
custom.subjects.effect = 'custom';
assert.ok(
  buildAssetPrompt(custom, 'ja').warnings.some((warning) =>
    warning.includes('対象の詳細'),
  ),
);
custom.details.effect = '青い炎';
assert.match(buildAssetPrompt(custom, 'ja').positive, /対象: 青い炎/);
assert.doesNotMatch(
  buildAssetPrompt(custom, 'en').positive,
  /glowing particles/,
);

for (const preset of assetPresets) {
  const draft = draftFromAssetPreset(preset.id);
  assert.equal(draft.category, preset.category);
  assert.deepEqual(parseAssetDraft(serializeAssetDraft(draft)), draft);
  // All built-in templates produce genuinely English output without free-text remnants.
  assert.doesNotMatch(
    buildAssetPrompt(draft, 'en').full,
    /[\u3040-\u30ff\u4e00-\u9fff]/,
  );
}
const first = draftFromAssetPreset('fire');
first.subjects.effect = 'custom';
first.exclusions.push('blur');
assert.equal(
  draftFromAssetPreset('fire').subjects.effect,
  'flame',
  'presets must not share mutable nested values',
);
assert.equal(draftFromAssetPreset('fire').exclusions.includes('blur'), false);

for (const raw of [
  '{}',
  'null',
  '[]',
  '{',
  JSON.stringify({
    app: 'character-order-room',
    version: 1,
    draft: createAssetDraft(),
  }),
]) {
  assert.throws(() => parseAssetDraft(raw));
}
for (const patch of [
  { category: 'character' },
  { format: 'unknown' },
  { material: 'unknown' },
  { duration: '' },
  { notes: 'x'.repeat(2001) },
  { frameCount: '13' },
  { exclusions: ['unknown'] },
  { subjects: null },
  { phases: null },
]) {
  assert.throws(() =>
    parseAssetDraft(
      JSON.stringify({
        app: 'asset-order-room',
        version: 1,
        draft: { ...createAssetDraft(), ...patch },
      }),
    ),
  );
}
assert.throws(() =>
  parseAssetDraft(
    JSON.stringify({
      app: 'asset-order-room',
      version: 2,
      draft: createAssetDraft(),
    }),
  ),
);
assert.throws(() => parseAssetDraft(' '.repeat(100001)));
assert.ok(
  ![...Object.values(STORAGE_KEYS), WORKSPACE_KEY].includes(ASSET_STORAGE_KEY),
  'asset storage is isolated from character data',
);

for (const category of assetCategories) {
  for (const format of ['still', 'video', 'sprites'] as const) {
    const draft = {
      ...configured,
      category: category.id,
      format,
      notes: '追加指示を保持: line one\nline two',
      negativeNotes: 'extra clutter',
    };
    const outputs = buildAssetOutputs(draft);
    for (const tab of outputTabs) {
      assert.ok(
        outputs[tab.value].length > 0,
        `${tab.value} must generate usable output`,
      );
      assert.match(outputs[tab.value], /追加指示を保持/);
      assert.match(outputs[tab.value], /extra clutter/);
      assert.doesNotMatch(outputs[tab.value], /undefined|NaN/);
      if (format === 'still')
        assert.doesNotMatch(
          outputs[tab.value],
          /開始の指定|ピークの指定|終了の指定|Duration and frame rate|Sprite layout/,
        );
      else assert.match(outputs[tab.value], /開始の指定/);
    }
    assert.equal(
      outputs.both,
      `【日本語】\n${outputs.ja}\n\n【English】\n${outputs.en}`,
    );
    assert.ok(
      outputs.short.length < outputs.en.length,
      'compact output removes boilerplate without dropping instructions',
    );
    assert.match(outputs.short, /Constraints: people, characters/);
    assert.match(outputs.tags, /\n\nNegative prompt: people, characters/);
    assert.doesNotMatch(
      outputs.tags.split('\n\nNegative prompt:')[0],
      /extra clutter/,
    );
    assert.match(outputs.blocks, /\[CONTENT\]/);
    assert.match(outputs.blocks, /\[STYLE\]/);
    assert.match(outputs.blocks, /\[AVOID\]/);
    assert.doesNotMatch(outputs.blocks, /\[ANTI_AI\]/);
    assert.doesNotMatch(outputs.promptBlocks.CONTENT, /画風:/);
    assert.equal(outputs.promptBlocks.STYLE, 'anime-style cel shading');
    const filtered = buildAssetOutputs(draft, ['STYLE', 'AVOID']);
    assert.doesNotMatch(filtered.blocks, /\[STYLE\]|\[AVOID\]/);
    assert.equal(
      filtered.ja,
      outputs.ja,
      'block selection must not affect other formats',
    );
    assert.equal(filtered.tags, outputs.tags);
    const json = JSON.parse(
      formatPromptBlocks(filtered.promptBlocks, ['STYLE', 'AVOID'], 'json'),
    );
    assert.deepEqual(Object.keys(json), ['CONTENT']);
    assert.equal(buildAssetOutputs(draft, [...promptBlockNames]).blocks, '');
  }
}

console.log(
  'Asset checks passed: category isolation, bilingual output, still/video/sprites, presets, persistence, and import validation.',
);
