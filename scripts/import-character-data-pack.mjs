import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [initialDataPath, translationsPath] = process.argv.slice(2);

if (!initialDataPath || !translationsPath) {
  throw new Error('Usage: node scripts/import-character-data-pack.mjs <01_initial_data.txt> <02_translations_dictionary.txt>');
}

const projectRoot = process.cwd();
const initialText = readFileSync(resolve(initialDataPath), 'utf8').replace(/\r\n/g, '\n');
const translationText = readFileSync(resolve(translationsPath), 'utf8').replace(/\r\n/g, '\n');

const section = (text, heading) => {
  const marker = new RegExp(`^## ${heading}[^\\n]*$`, 'm');
  const match = marker.exec(text);
  if (!match) throw new Error(`Section not found: ${heading}`);
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const next = /^## /m.exec(rest);
  return rest.slice(0, next?.index ?? rest.length);
};

const cleanPipeRows = (block) => block
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.includes('|') && !line.startsWith('#'));

const cleanListRows = (block) => block
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('=') && !line.startsWith('#') && !line.startsWith('概算'));

// Gap seeds have a hand-maintained semantic blueprint. Refuse a partial import
// if labels or ordering changed, because stale assignments could bypass locks or
// age-safety rules. Update gapSeeds.ts and gapBlueprints.ts together instead.
const gapRows = cleanListRows(section(initialText, 'ギャップ生成ネタ')).join('\n');
const existingGapSource = readFileSync(resolve(projectRoot, 'data', 'gapSeeds.ts'), 'utf8');
const rawLiteral = /^const raw = (.+);$/m.exec(existingGapSource)?.[1];
const rawEnLiteral = /^const rawEn = (.+);$/m.exec(existingGapSource)?.[1];
if (!rawLiteral || !rawEnLiteral) {
  throw new Error('Existing gap seeds or English translations were not found; import stopped to avoid data loss.');
}
if (JSON.parse(rawLiteral) !== gapRows) {
  throw new Error('Gap seeds changed; update data/gapSeeds.ts and data/gapBlueprints.ts together before importing.');
}
const gapEnglishRows = JSON.parse(rawEnLiteral);
if (gapEnglishRows.split('\n').length !== gapRows.split('\n').length) {
  throw new Error('Gap seed and English translation counts differ; update translations before importing.');
}

const parseLegacy = (relativePath, exportName) => {
  const source = readFileSync(resolve(projectRoot, relativePath), 'utf8');
  const startToken = `export const ${exportName} = [`;
  const start = source.indexOf(startToken);
  if (start < 0) return [];
  const end = source.indexOf('\n];', start);
  if (end < 0) return [];
  const block = source.slice(start, end);
  const rows = [];
  const matcher = /c\('([^']*)',\s*'([^']*)',\s*'([^']*)'\)/g;
  for (const match of block.matchAll(matcher)) {
    rows.push({ id: match[1], ja: match[2], en: match[3] });
  }
  return rows;
};

const normalize = (value) => value
  .toLowerCase()
  .replace(/\b(the|a|an|with|style|inspired|character|appearance|looking)\b/g, ' ')
  .replace(/\b(hair|eyes?|outfit|attire|clothes|clothing|expression|pose|composition|background|lighting|light|build|built|frame|features?)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const slugify = (value) => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || `item-${Math.random().toString(36).slice(2, 10)}`;
};

const MANUAL_LEGACY_MATCH = {
  personality: {
    '少し頼りなさそう': 'unreliable',
    '儚い': 'fragile',
    '冷たい': 'cold',
    'カリスマ的': 'charismatic',
    '守ってくれそう': 'protective',
  },
  build: {
    '柔らかそうな体型': 'soft',
    '引き締まった体': 'athletic',
    'スポーツ体型': 'athletic',
  },
  hairstyle: {
    'ベリーショート': 'pixie',
    'ゆるいウェーブ': 'wave',
    'カール': 'loose-curl',
    'サイドポニー': 'side-tail',
    'アンダーカット': 'undercut',
    '片側刈り上げ': 'undercut',
  },
  eyeShape: {
    '切れ長の目': 'almond',
    '丸い目': 'round',
    '小さめの目': 'small',
    'つり目': 'upturned',
    'たれ目': 'droopy',
  },
  faceFeature: {
    '顔の傷': 'scar',
    '顔の刺青': 'tattoo',
    '八重歯': 'fangs',
    '耳ピアス': 'piercing',
    '長いまつ毛': 'heavy-lashes',
    '隈': 'dark-circles',
  },
  species: {
    '獣人': 'beastfolk',
    '人外': 'nonhuman',
  },
  outfit: {
    'カジュアル服': 'casual',
    '学校制服': 'school',
    '騎士鎧': 'knight',
    '魔法使いのローブ': 'mage',
    '聖職者服': 'clergy',
    '王族の礼装': 'royal',
    '王子衣装': 'royal',
    '貴族服': 'aristocrat',
    '近未来スーツ': 'scifi',
    'SF風衣装': 'scifi',
  },
  expression: {
    '柔らかな笑顔': 'smile',
    '明るい笑顔': 'bright-smile',
    'はにかんだ笑顔': 'shy-smile',
    '困った笑顔': 'awkward-smile',
    '赤面': 'blushing',
    '照れ': 'embarrassed',
    '戸惑い': 'confused',
    '泣いている': 'crying',
    '不機嫌': 'pouting',
    '狂気の笑み': 'mad',
  },
  pose: {
    '正面立ち': 'front',
    '自然に立つ': 'natural',
    '腰に手を当てる': 'hand-waist',
    '手を差し出す': 'hand-out',
    '椅子に座る': 'chair',
    '床に座る': 'floor',
    '壁にもたれる': 'wall',
    '走っている': 'running',
    '膝をつく': 'kneeling',
    '片膝をつく': 'kneeling',
    '眼鏡を直す': 'glasses',
    '傘を持つ': 'umbrella',
  },
  gaze: {
    'こちらを見る': 'camera',
    '横を見る': 'side',
    '伏し目': 'downcast',
    '見上げる': 'up',
    '目を閉じる': 'closed',
    '遠くを見る': 'distant',
  },
  cameraAngle: {
    '正面': 'front',
    '斜め前': 'three-quarter',
    '横顔': 'profile',
    'やや上から': 'high',
    'やや下から': 'low',
    'アイレベル': 'eye',
  },
  composition: {
    '顔アップ': 'close',
    'バストアップ': 'bust',
    '腰上': 'waist',
    '膝上': 'knees',
    '全身': 'full',
  },
  background: {
    'シンプル背景': 'solid',
    '透過想定': 'transparent',
    '夜の街': 'night-city',
    '雨の路地': 'alley',
    '海辺': 'beach',
    'SF都市': 'scifi-city',
    '大理石の部屋': 'marble-room',
    '戦場跡': 'battlefield',
  },
  lighting: {
    '逆光': 'backlight',
    'ドラマチックな光': 'dramatic',
    '月明かり': 'moon',
    'ネオン光': 'neon',
    'キャンドル光': 'candle',
    '発光粒子': 'sparkles',
    '魔法の発光': 'magic',
    '木漏れ日': 'dappled',
  },
  negative: {
    '人物は1人だけ': 'one-person',
    '不自然な手を避ける': 'good-hands',
    '指の崩れを避ける': 'good-fingers',
    '余分な腕脚を避ける': 'no-extra-limbs',
    '不自然な人体を避ける': 'no-bad-anatomy',
    'ぼやけを避ける': 'no-blur',
    '低解像感を避ける': 'no-lowres',
    '平坦すぎる光を避ける': 'no-flat-light',
    '画面のごちゃつきを避ける': 'no-clutter',
  },
};

const catalogs = [
  { heading: '性格・印象タグ', file: 'traits.ts', exportName: 'traits', category: 'personality', legacy: ['data/character.ts', 'personalities'] },
  { heading: '髪色', file: 'hairColors.ts', exportName: 'hairColors', category: 'hairColor', legacy: ['data/appearance.ts', 'hairColors'] },
  { heading: '髪型', file: 'hairstyles.ts', exportName: 'hairstyles', category: 'hairstyle', legacy: ['data/appearance.ts', 'hairstyles'] },
  { heading: '目の色', file: 'eyeColors.ts', exportName: 'eyeColors', category: 'eyeColor', legacy: ['data/appearance.ts', 'eyeColors'] },
  { heading: '目の形', file: 'eyeShapes.ts', exportName: 'eyeShapes', category: 'eyeShape', legacy: ['data/appearance.ts', 'eyeShapes'] },
  { heading: '顔の特徴', file: 'faceFeatures.ts', exportName: 'faceFeatures', category: 'faceFeature', legacy: ['data/appearance.ts', 'faceFeatures'] },
  { heading: '種族', file: 'species.ts', exportName: 'species', category: 'species', legacy: ['data/character.ts', 'species'] },
  { heading: '体格', file: 'bodyTypes.ts', exportName: 'bodyTypes', category: 'build', legacy: ['data/character.ts', 'builds'] },
  { heading: '衣装', file: 'outfits.ts', exportName: 'outfits', category: 'outfit', legacy: ['data/outfits.ts', 'outfits'] },
  { heading: 'アクセサリー', file: 'accessories.ts', exportName: 'accessories', category: 'accessory' },
  { heading: '表情', file: 'expressions.ts', exportName: 'expressions', category: 'expression', legacy: ['data/outfits.ts', 'expressions'] },
  { heading: 'ポーズ', file: 'poses.ts', exportName: 'poses', category: 'pose', legacy: ['data/outfits.ts', 'poses'] },
  { heading: '視線', file: 'gaze.ts', exportName: 'gazes', category: 'gaze', legacy: ['data/scenes.ts', 'gazes'] },
  { heading: 'カメラ角度', file: 'cameraAngles.ts', exportName: 'cameraAngles', category: 'cameraAngle', legacy: ['data/scenes.ts', 'cameraAngles'] },
  { heading: '構図', file: 'compositions.ts', exportName: 'compositions', category: 'composition', legacy: ['data/scenes.ts', 'compositions'] },
  { heading: '背景', file: 'backgrounds.ts', exportName: 'backgrounds', category: 'background', legacy: ['data/scenes.ts', 'backgrounds'] },
  { heading: '光・演出', file: 'lighting.ts', exportName: 'lighting', category: 'lighting', legacy: ['data/scenes.ts', 'lighting'] },
  { heading: '禁止事項', file: 'negativePrompts.ts', exportName: 'negativePrompts', category: 'negative', legacy: ['data/scenes.ts', 'negatives'] },
];

const legacyOnlyCatalogs = [
  { file: 'outfitColors.ts', exportName: 'outfitColors', category: 'outfitColor', legacy: ['data/outfits.ts', 'outfitColors'] },
  { file: 'outfitDetails.ts', exportName: 'outfitDetails', category: 'outfitDetail', legacy: ['data/outfits.ts', 'outfitDetails'] },
];

const legacyCache = new Map();
for (const catalog of [...catalogs, ...legacyOnlyCatalogs]) {
  if (!catalog.legacy) continue;
  const key = catalog.legacy.join('#');
  if (!legacyCache.has(key)) legacyCache.set(key, parseLegacy(...catalog.legacy));
}

const getLegacy = (legacy) => legacy ? (legacyCache.get(legacy.join('#')) ?? []) : [];

const usedIdsByCategory = new Map();

for (const catalog of catalogs) {
  const packRows = cleanPipeRows(section(initialText, catalog.heading)).map((line) => {
    const [ja, en, tags = ''] = line.split('|').map((part) => part.trim());
    return { ja, en, tags };
  });
  const legacyRows = getLegacy(catalog.legacy);
  const unmatched = new Set(legacyRows.map((row) => row.id));
  const usedIds = usedIdsByCategory.get(catalog.category) ?? new Set();
  usedIdsByCategory.set(catalog.category, usedIds);

  const outputRows = packRows.map((row) => {
    const manualId = MANUAL_LEGACY_MATCH[catalog.category]?.[row.ja];
    const legacy = legacyRows.find((item) => item.id === manualId)
      ?? legacyRows.find((item) => item.ja === row.ja)
      ?? legacyRows.find((item) => normalize(item.en) && normalize(item.en) === normalize(row.en));
    if (legacy) unmatched.delete(legacy.id);
    let id = legacy?.id ?? slugify(row.en);
    let suffix = 2;
    while (usedIds.has(id)) id = `${slugify(row.en)}-${suffix++}`;
    usedIds.add(id);
    return [id, row.ja, row.en, row.tags];
  });

  for (const item of legacyRows.filter((row) => unmatched.has(row.id))) {
    if (usedIds.has(item.id)) continue;
    usedIds.add(item.id);
    outputRows.push([item.id, item.ja.replaceAll('儊', '儚').replace('複色', '褐色'), item.en, 'legacy']);
  }

  const raw = outputRows.map((parts) => parts.join('|')).join('\n');
  const moduleSource = `// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.\nimport { createCatalog } from './catalog-utils';\n\nconst raw = ${JSON.stringify(raw)};\n\nexport const ${catalog.exportName} = createCatalog(${JSON.stringify(catalog.category)}, raw);\n`;
  writeFileSync(resolve(projectRoot, 'data', catalog.file), moduleSource, 'utf8');
}

for (const catalog of legacyOnlyCatalogs) {
  const rows = getLegacy(catalog.legacy).map((item) => [item.id, item.ja, item.en, ''].join('|')).join('\n');
  writeFileSync(
    resolve(projectRoot, 'data', catalog.file),
    `// Preserved from the original catalog for saved-setting compatibility.\nimport { createCatalog } from './catalog-utils';\n\nconst raw = ${JSON.stringify(rows)};\n\nexport const ${catalog.exportName} = createCatalog(${JSON.stringify(catalog.category)}, raw);\n`,
    'utf8',
  );
}

const themeRows = cleanListRows(section(initialText, 'テーマ付きランダム')).join('\n');
writeFileSync(
  resolve(projectRoot, 'data', 'randomThemes.ts'),
  `// Generated from 01_initial_data.txt.\nimport { createThemes } from './theme-utils';\n\nconst raw = ${JSON.stringify(themeRows)};\n\nexport const themes = createThemes(raw);\n`,
  'utf8',
);

writeFileSync(
  resolve(projectRoot, 'data', 'gapSeeds.ts'),
  `// Generated from 01_initial_data.txt.\nimport { createGapSeeds } from './theme-utils';\n\nconst raw = ${JSON.stringify(gapRows)};\n\nconst rawEn = ${JSON.stringify(gapEnglishRows)};\n\nexport const gapSeeds = createGapSeeds(raw, rawEn);\n`,
  'utf8',
);

const translationRows = [...new Set(
  translationText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && !line.startsWith('#') && !line.startsWith('type?') && !line.includes('string;')),
)];
writeFileSync(
  resolve(projectRoot, 'data', 'translations.ts'),
  `// Generated from 02_translations_dictionary.txt.\nimport { createTranslations, translateWithDictionary } from './translation-utils';\n\nconst raw = ${JSON.stringify(translationRows.join('\n'))};\n\nexport const translations = createTranslations(raw);\nexport const translateFreeText = (value: string) => translateWithDictionary(value, translations);\n`,
  'utf8',
);

console.log(JSON.stringify({ catalogs: catalogs.length, translations: translationRows.length, themes: themeRows.split('\n').length, gaps: gapRows.split('\n').length }, null, 2));
