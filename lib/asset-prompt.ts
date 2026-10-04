import {
  assetCategories,
  assetChoices,
  assetSubjects,
  createAssetDraft,
  type AssetDraft,
  type AssetSelectField,
  type AssetRandomField,
} from '@/data/asset-options';
import { formatPromptBlocks } from './style-pack';
import { advancedAssetStyles } from '@/data/asset-style-catalog';
import type { PromptBlockName, PromptBlocks } from './style-pack-types';

export const ASSET_STORAGE_KEY = 'asset-order-room:draft:v1';
export const ASSET_MAX_FILE_BYTES = 100_000;
export const ASSET_TEXT_LIMIT = 2000;
const REQUIRED_FIELDS: AssetSelectField[] = [
  'format',
  'duration',
  'loop',
  'frameCount',
  'fps',
];
const categoryIds = ['effect', 'object', 'motion'] as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function serializeAssetDraft(draft: AssetDraft): string {
  return JSON.stringify(
    { app: 'asset-order-room', version: 1, draft },
    null,
    2,
  );
}

/** Validate before replacing a draft; never reinterpret character-room backups. */
export function parseAssetDraft(raw: string): AssetDraft {
  if (new TextEncoder().encode(raw).length > ASSET_MAX_FILE_BYTES)
    throw new Error('ファイルは100KB以内にしてください。');
  const data: unknown = JSON.parse(raw);
  if (
    !isRecord(data) ||
    data.app !== 'asset-order-room' ||
    data.version !== 1 ||
    !isRecord(data.draft)
  ) {
    throw new Error('素材・演出発注室で保存したJSONを選んでください。');
  }
  const source = data.draft;
  const result = createAssetDraft();
  if (!categoryIds.some((id) => id === source.category))
    throw new Error('制作対象が不正です。');
  result.category = source.category as AssetDraft['category'];
  for (const field of Object.keys(
    assetChoices,
  ) as (keyof typeof assetChoices)[]) {
    if (field === 'exclusions') continue;
    const value = source[field];
    if (
      typeof value !== 'string' ||
      (!(value === '' && !REQUIRED_FIELDS.includes(field)) &&
        !assetChoices[field].some((item) => item.id === value))
    ) {
      throw new Error(`選択項目「${field}」を読み取れません。`);
    }
    Object.assign(result, { [field]: value });
  }
  const text = (value: unknown) => {
    if (typeof value !== 'string' || value.length > ASSET_TEXT_LIMIT)
      throw new Error('自由入力は各2000文字以内にしてください。');
    return value;
  };
  if (
    !isRecord(source.subjects) ||
    !isRecord(source.details) ||
    !isRecord(source.phases)
  )
    throw new Error('素材の設定を読み取れません。');
  for (const category of categoryIds) {
    const subject = source.subjects[category];
    if (
      typeof subject !== 'string' ||
      !assetSubjects[category].some((item) => item.id === subject)
    )
      throw new Error('素材の種類が不正です。');
    result.subjects[category] = subject;
    result.details[category] = text(source.details[category]);
  }
  for (const phase of ['start', 'peak', 'end'] as const)
    result.phases[phase] = text(source.phases[phase]);
  result.notes = text(source.notes);
  result.negativeNotes = text(source.negativeNotes);
  if (
    !Array.isArray(source.exclusions) ||
    source.exclusions.length > assetChoices.exclusions.length ||
    !source.exclusions.every(
      (value) =>
        typeof value === 'string' &&
        assetChoices.exclusions.some((item) => item.id === value),
    )
  ) {
    throw new Error('禁止事項を読み取れません。');
  }
  result.exclusions = [...new Set(source.exclusions as string[])];
  const lockKeys = [
    'subject',
    ...Object.keys(assetChoices).filter(
      (field) => field !== 'format' && field !== 'exclusions',
    ),
  ];
  // Older v1 backups predate random locks and remain valid.
  if (source.randomLocks !== undefined) {
    if (
      !Array.isArray(source.randomLocks) ||
      source.randomLocks.length > lockKeys.length ||
      !source.randomLocks.every(
        (field) => typeof field === 'string' && lockKeys.includes(field),
      )
    )
      throw new Error('ランダムのロック設定を読み取れません。');
    result.randomLocks = [...new Set(source.randomLocks as AssetRandomField[])];
  }
  return result;
}

export function buildAssetPrompt(draft: AssetDraft, language: 'ja' | 'en') {
  const ja = language === 'ja';
  const temporal = draft.format !== 'still';
  const moving = temporal || draft.category === 'motion';
  const label = (field: AssetSelectField) => {
    const id =
      field === 'palette' &&
      advancedAssetStyles.find((style) => style.id === draft.style)?.monochrome
        ? 'mono'
        : draft[field];
    const option = assetChoices[field].find((item) => item.id === id);
    return (ja ? (option?.promptJa ?? option?.ja) : option?.en) ?? '';
  };
  const sections: { key: string; label: string; text: string }[] = [];
  const add = (titleJa: string, titleEn: string, value: string) => {
    if (value.trim())
      sections.push({
        key: titleEn,
        label: ja ? titleJa : titleEn,
        text: value.trim(),
      });
  };
  const join = (values: string[]) =>
    values.filter(Boolean).join(ja ? '、' : ', ');
  const subject = assetSubjects[draft.category].find(
    (item) => item.id === draft.subjects[draft.category],
  );
  const subjectLabel =
    subject?.id === 'custom'
      ? ''
      : ja
        ? (subject?.promptJa ?? subject?.ja ?? '')
        : (subject?.en ?? '');
  add(
    '制作物',
    'Deliverable',
    join([
      assetCategories.find((item) => item.id === draft.category)?.[language] ??
        '',
      label('format'),
    ]),
  );
  add(
    '基本条件',
    'Core requirement',
    ja
      ? '人物・キャラクター・マスコットを描かず、素材と演出だけを制作する。手や顔、人体のシルエット、擬人化を含めない。'
      : 'Create only the asset and its visual treatment. No people, characters, mascots, hands, faces, human silhouettes, or anthropomorphism.',
  );
  add(
    '対象',
    'Subject',
    join([subjectLabel, draft.details[draft.category].trim()]),
  );
  if (draft.category === 'effect')
    add(
      'エフェクトの形・密度',
      'Effect shape and density',
      join([label('effectShape'), label('density')]),
    );
  if (draft.category === 'object')
    add(
      '素材・状態',
      'Material and condition',
      join([label('material'), label('condition')]),
    );
  add('画風', 'Style', label('style'));
  add('配色', 'Palette', label('palette'));
  add('光', 'Lighting', label('lighting'));
  add(
    '視点・構図',
    'View and composition',
    join([label('camera'), label('framing')]),
  );
  add(
    '背景',
    'Background',
    ja && draft.background === 'transparent'
      ? 'アルファチャンネル付きの透過背景を希望。市松模様を描き込まない。'
      : label('background'),
  );
  add(
    draft.format === 'sprites' ? '1コマの縦横比' : '縦横比',
    draft.format === 'sprites' ? 'Aspect ratio per frame' : 'Aspect ratio',
    label('ratio'),
  );
  if (moving)
    add(
      temporal ? '動き' : '静止画に描く動きの瞬間',
      temporal ? 'Motion' : 'Moment of motion captured in a single still image',
      join([label('motion'), label('direction'), label('speed')]),
    );
  if (temporal) {
    add('動きの変化', 'Timing', label('timing'));
    // Sprite sheets need a consistent camera, regardless of retained video settings.
    add(
      'カメラの動き',
      'Camera movement',
      draft.format === 'sprites'
        ? ja
          ? 'カメラ固定。全コマで視点・縮尺・基準位置を統一。'
          : 'Locked camera; consistent viewpoint, scale, and registration across all frames.'
        : label('cameraMotion'),
    );
    if (draft.format === 'video')
      add(
        '尺・フレームレート',
        'Duration and frame rate',
        join([label('duration'), label('fps')]),
      );
    else
      add(
        'コマの仕様',
        'Sprite layout',
        ja
          ? `${label('frameCount')}、横4列 × 縦${Number(draft.frameCount) / 4}行の等間隔グリッド。左上から右へ、行ごとに再生順で配置。想定再生速度 ${label('fps')}。各コマの余白をそろえ、文字や番号は描かない。`
          : `${label('frameCount')}, a uniform grid of 4 columns × ${Number(draft.frameCount) / 4} rows, ordered left to right then top to bottom. Intended playback at ${label('fps')}. Consistent cell padding; no labels or frame numbers.`,
      );
    add('再生', 'Playback', label('loop'));
    add('開始', 'Start', draft.phases.start);
    add('展開・ピーク', 'Development / peak', draft.phases.peak);
    add('終了', 'End', draft.phases.end);
  }
  add('追加指示', 'Additional instructions', draft.notes);
  const negatives = [
    ja
      ? '人物、キャラクター、マスコット、顔、手、人体、人体のシルエット、擬人化'
      : 'people, characters, mascots, faces, hands, human bodies, human silhouettes, anthropomorphism',
  ];
  for (const id of draft.exclusions) {
    if (!temporal && (id === 'flicker' || id === 'shake')) continue;
    const option = assetChoices.exclusions.find((item) => item.id === id);
    if (option) negatives.push(option[language]);
  }
  if (draft.negativeNotes.trim()) negatives.push(draft.negativeNotes.trim());
  const negative = join(negatives);
  const positive = sections
    .map((section) => `${section.label}: ${section.text}`)
    .join('\n');
  const warnings: string[] = [];
  if (subject?.id === 'custom' && !draft.details[draft.category].trim())
    warnings.push('「対象の詳細」に、制作したい素材を入力してください。');
  if (draft.background === 'transparent')
    warnings.push(
      '透過は希望条件です。生成サービスによっては背景除去が必要です。',
    );
  const freeText = [
    draft.details[draft.category],
    draft.notes,
    draft.negativeNotes,
    ...(temporal ? Object.values(draft.phases) : []),
  ].join(' ');
  if (!ja && /[\u0080-\uFFFF]/.test(freeText))
    warnings.push(
      '選択項目は英語で出力します。自由入力は自動翻訳せず、原文を保持しています。',
    );
  return {
    sections,
    positive,
    negative,
    full: `${positive}\n\n${ja ? '【禁止事項 / ネガティブ】' : '[Negative prompt]'}\n${negative}`,
    warnings,
  };
}

export function buildAssetOutputs(
  draft: AssetDraft,
  excludedBlocks: PromptBlockName[] = [],
) {
  const ja = buildAssetPrompt(draft, 'ja');
  const en = buildAssetPrompt(draft, 'en');
  const promptBlocks: PromptBlocks = {
    CONTENT: ja.sections
      .filter((section) => section.key !== 'Style')
      .map((section) => `${section.label}: ${section.text}`)
      .join('\n'),
    STYLE: en.sections.find((section) => section.key === 'Style')?.text ?? '',
    ANTI_AI: '',
    AVOID: en.negative,
  };
  // Keep semantic labels for timing, phases, and frame specifications. Never
  // truncate user instructions or turn exclusion tags into positive directions.
  const bareKeys = new Set([
    'Deliverable',
    'Subject',
    'Style',
    'Palette',
    'Lighting',
    'View and composition',
    'Background',
  ]);
  const compactParts = en.sections.map((section) => {
    if (section.key === 'Core requirement') return 'character-free assets only';
    const text = section.text.replace(/\s+/g, ' ').trim();
    return bareKeys.has(section.key) ? text : `${section.label}: ${text}`;
  });
  return {
    ja: ja.full,
    en: en.full,
    both: `【日本語】\n${ja.full}\n\n【English】\n${en.full}`,
    short: `${compactParts.join('; ')}\n\nConstraints: ${en.negative}`,
    tags: `${compactParts.join(', ')}\n\nNegative prompt: ${en.negative}`,
    blocks: formatPromptBlocks(promptBlocks, excludedBlocks),
    positiveJa: ja.positive,
    negativeJa: ja.negative,
    positiveEn: en.positive,
    negativeEn: en.negative,
    promptBlocks,
    warningsJa: ja.warnings,
    warningsEn: en.warnings,
  };
}
