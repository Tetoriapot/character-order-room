import { effectCatalog } from './asset-effect-catalog';
import { advancedAssetStyles, rpgMangaChoices } from './asset-style-catalog';
import {
  extraAssetChoices,
  extraAssetSubjects,
} from './asset-choice-expansion';

export type AssetCategory = 'effect' | 'object' | 'motion';
export type AssetFormat = 'still' | 'video' | 'sprites';
export type AssetOption = {
  id: string;
  ja: string;
  en: string;
  promptJa?: string;
};
const choices = (rows: string[][]): AssetOption[] =>
  rows.map(([id, ja, en]) => ({ id, ja, en }));

export const assetCategories = [
  {
    id: 'effect',
    ja: 'エフェクト',
    en: 'Effect',
    description: '光・炎・煙・魔法・粒子',
  },
  {
    id: 'object',
    ja: 'モノ',
    en: 'Object',
    description: '小物・道具・武器・プロダクト',
  },
  {
    id: 'motion',
    ja: 'モーション',
    en: 'Motion',
    description: '回転・軌跡・変形・ループ',
  },
] as const;

export const assetSubjects: Record<AssetCategory, AssetOption[]> = {
  effect: [...effectCatalog, { id: 'custom', ja: '自由に指定', en: '' }],
  object: [
    ...choices([
      ['bottle', 'ポーション瓶', 'a potion bottle'],
      ['sword', '剣・武器', 'a fantasy sword'],
      ['gem', '宝石・鉱石', 'a gemstone'],
      ['book', '本・魔導書', 'a spellbook'],
      ['key', '鍵', 'an ornate key'],
      ['chest', '宝箱', 'a treasure chest'],
      ['device', '機械・装置', 'a mechanical device'],
      ['cup', 'カップ・器', 'a ceramic cup'],
      ['plant', '鉢植え', 'a potted plant'],
      ['furniture', '家具', 'a piece of furniture'],
      ['food', '食べ物', 'a food item'],
    ]),
    ...extraAssetSubjects.object,
    { id: 'custom', ja: '自由に指定', en: '' },
  ],
  motion: [
    ...choices([
      ['ribbon', '光のリボン', 'a ribbon of light'],
      ['orb', '発光する球体', 'a glowing sphere'],
      ['ring', 'リング', 'an abstract ring'],
      ['cube', 'キューブ', 'a geometric cube'],
      ['liquid', '液体', 'an abstract liquid form'],
      ['wave', '波紋', 'concentric ripples'],
      ['particles', 'パーティクル', 'abstract particles'],
      ['cloth', '布', 'a piece of fabric'],
      ['geometric', '幾何学模様', 'a geometric pattern'],
    ]),
    ...extraAssetSubjects.motion,
    { id: 'custom', ja: '自由に指定', en: '' },
  ],
};

export const assetChoices = {
  format: choices([
    ['still', '静止画', 'a still image'],
    ['video', '動画', 'an animation'],
    ['sprites', 'スプライトシート', 'an animation sprite sheet'],
  ]),
  style: [
    ...choices([
      ['anime', 'アニメ・セル調', 'anime-style cel shading'],
      ['paint', '厚塗り', 'painterly rendering'],
      ['watercolor', '水彩', 'watercolor illustration'],
      ['pixel', 'ピクセルアート', 'pixel art'],
      ['flat', 'フラット', 'flat vector-like illustration'],
      ['3d', '3Dレンダー', '3D rendering'],
      ['real', 'フォトリアル', 'photorealistic rendering'],
      ['sketch', '線画', 'clean line art'],
    ]),
    ...extraAssetChoices.style,
    ...advancedAssetStyles,
  ],
  palette: [
    ...choices([
      ['blue', 'ブルー・シアン', 'blue and cyan'],
      ['warm', '赤・オレンジ', 'red and orange'],
      ['purple', 'パープル・ピンク', 'purple and pink'],
      ['green', 'グリーン', 'green'],
      ['gold', 'ゴールド', 'gold'],
      ['white', '白・シルバー', 'white and silver'],
      ['pastel', 'パステル', 'soft pastel colors'],
      ['mono', 'モノクロ', 'monochrome'],
    ]),
    ...extraAssetChoices.palette,
  ],
  background: [
    ...choices([
      [
        'transparent',
        '透過背景を希望',
        'transparent background with an alpha channel, no painted checkerboard',
      ],
      ['white', '白背景', 'a plain white background'],
      ['black', '黒背景', 'a plain black background'],
      [
        'green',
        'グリーンバック',
        'a flat chroma-key green background, no green spill',
      ],
      ['studio', '撮影スタジオ', 'a minimal studio backdrop'],
      ['space', '宇宙', 'outer space'],
      ['abstract', '抽象背景', 'a restrained abstract background'],
    ]),
    ...extraAssetChoices.background,
    ...rpgMangaChoices.background,
  ],
  lighting: [
    ...choices([
      ['emission', '自己発光', 'self-illumination'],
      ['soft', '柔らかい光', 'soft diffused lighting'],
      ['rim', 'リムライト', 'rim lighting'],
      ['dramatic', '強い明暗', 'dramatic high-contrast lighting'],
      ['natural', '自然光', 'natural daylight'],
      ['unlit', '均一・影なし', 'even lighting without shadows'],
    ]),
    ...extraAssetChoices.lighting,
  ],
  camera: [
    ...choices([
      ['front', '正面', 'front view'],
      ['three-quarter', '斜め45度', 'three-quarter view'],
      ['side', '真横', 'side view'],
      ['top', '真上', 'top-down view'],
      ['low', 'ローアングル', 'low-angle view'],
      ['iso', 'アイソメトリック', 'isometric view'],
    ]),
    ...extraAssetChoices.camera,
  ],
  framing: [
    ...choices([
      [
        'center',
        '中央・全体を収める',
        'centered composition, the entire subject inside the frame',
      ],
      ['close', 'ディテールを寄りで', 'close-up on surface details'],
      ['space', '広めの余白', 'generous negative space around the subject'],
      ['diagonal', '対角線に配置', 'a diagonal composition'],
    ]),
    ...extraAssetChoices.framing,
    ...rpgMangaChoices.framing,
  ],
  ratio: choices([
    ['1:1', '1:1 正方形', '1:1 square'],
    ['16:9', '16:9 横長', '16:9 landscape'],
    ['9:16', '9:16 縦長', '9:16 portrait'],
    ['4:3', '4:3 横長', '4:3 landscape'],
    ['3:4', '3:4 縦長', '3:4 portrait'],
  ]),
  effectShape: [
    ...choices([
      ['radial', '中心から放射', 'radiating outward from the center'],
      ['spiral', 'らせん状', 'a spiral shape'],
      ['rising', '下から立ち上る', 'rising from below'],
      ['ring', '輪状に広がる', 'an expanding ring shape'],
      ['trail', '尾を引く', 'a trailing streak'],
      ['scatter', '全体に散らす', 'scattered across the composition'],
    ]),
    ...extraAssetChoices.effectShape,
  ],
  density: choices([
    ['sparse', '控えめ・少なめ', 'sparse and subtle'],
    ['medium', '中程度', 'moderate density'],
    ['dense', '高密度・迫力', 'dense and powerful'],
  ]),
  material: [
    ...choices([
      ['glass', 'ガラス', 'glass'],
      ['metal', '金属', 'metal'],
      ['wood', '木', 'wood'],
      ['ceramic', '陶器', 'ceramic'],
      ['stone', '石', 'stone'],
      ['crystal', 'クリスタル', 'crystal'],
      ['fabric', '布', 'fabric'],
      ['plastic', '樹脂', 'plastic'],
    ]),
    ...extraAssetChoices.material,
  ],
  condition: [
    ...choices([
      ['new', '新品・整った状態', 'pristine condition'],
      ['worn', '使い込まれた状態', 'worn with signs of use'],
      ['ancient', '古代・風化', 'ancient and weathered'],
      ['ornate', '繊細な装飾', 'intricate decorative details'],
    ]),
    ...extraAssetChoices.condition,
  ],
  motion: [
    ...choices([
      ['rotate', '回転', 'rotation'],
      ['float', '浮遊', 'floating'],
      ['expand', '拡散・広がる', 'outward expansion'],
      ['converge', '収束・集まる', 'convergence toward the center'],
      ['flow', '流れる', 'flowing movement'],
      ['bounce', 'バウンド', 'bouncing'],
      ['pulse', '明滅・脈動', 'pulsation'],
      ['morph', '変形', 'smooth shape morphing'],
      ['dissolve', '消散', 'dissipation'],
    ]),
    ...extraAssetChoices.motion,
  ],
  direction: [
    ...choices([
      ['up', '下から上', 'upward'],
      ['down', '上から下', 'downward'],
      ['right', '左から右', 'left to right'],
      ['left', '右から左', 'right to left'],
      ['clockwise', '時計回り', 'clockwise'],
      ['out', '中心から外側', 'from the center outward'],
      ['in', '外側から中心', 'from the outside toward the center'],
    ]),
    ...extraAssetChoices.direction,
  ],
  speed: [
    ...choices([
      ['slow', 'ゆっくり', 'slow'],
      ['normal', '中程度', 'moderate'],
      ['fast', '速い', 'fast'],
      ['burst', '一瞬の勢い', 'an explosive burst'],
    ]),
    ...extraAssetChoices.speed,
  ],
  timing: [
    ...choices([
      ['linear', '一定速度', 'constant speed'],
      ['ease', '滑らかな加減速', 'smooth ease-in and ease-out'],
      ['accelerate', '徐々に加速', 'gradual acceleration'],
      ['decelerate', '徐々に減速', 'gradual deceleration'],
    ]),
    ...extraAssetChoices.timing,
  ],
  cameraMotion: [
    ...choices([
      ['fixed', 'カメラ固定', 'locked-off camera'],
      ['orbit', '周囲を回り込む', 'camera orbit around the subject'],
      ['in', 'ゆっくり寄る', 'slow camera push-in'],
      ['out', 'ゆっくり引く', 'slow camera pull-out'],
    ]),
    ...extraAssetChoices.cameraMotion,
  ],
  duration: choices([
    ['2', '2秒', '2 seconds'],
    ['3', '3秒', '3 seconds'],
    ['5', '5秒', '5 seconds'],
    ['8', '8秒', '8 seconds'],
    ['10', '10秒', '10 seconds'],
  ]),
  loop: choices([
    ['once', '1回で完結', 'play once with a clear ending'],
    [
      'seamless',
      'シームレスループ',
      'seamless loop; match the first and last frames and their motion',
    ],
    [
      'pingpong',
      '往復ループ',
      'ping-pong loop; reverse the motion smoothly at each end',
    ],
  ]),
  frameCount: choices([
    ['8', '8コマ', '8 frames'],
    ['12', '12コマ', '12 frames'],
    ['16', '16コマ', '16 frames'],
    ['24', '24コマ', '24 frames'],
  ]),
  fps: choices([
    ['12', '12 fps', '12 fps'],
    ['24', '24 fps', '24 fps'],
    ['30', '30 fps', '30 fps'],
    ['60', '60 fps', '60 fps'],
  ]),
  exclusions: choices([
    ['text', '文字・ロゴ・透かし', 'text, logos, watermarks'],
    ['clutter', '不要な小物', 'unrelated props'],
    ['cropped', '見切れ', 'cropped subject'],
    ['blur', '意図しないぼけ', 'unintentional blur'],
    ['flicker', '意図しないちらつき', 'unintentional flicker'],
    ['shake', '手ぶれ', 'camera shake'],
  ]),
};

export type AssetSelectField = Exclude<keyof typeof assetChoices, 'exclusions'>;
export type AssetRandomField = Exclude<AssetSelectField, 'format'> | 'subject';
export type AssetDraft = Omit<Record<AssetSelectField, string>, 'format'> & {
  category: AssetCategory;
  format: AssetFormat;
  subjects: Record<AssetCategory, string>;
  details: Record<AssetCategory, string>;
  phases: { start: string; peak: string; end: string };
  notes: string;
  negativeNotes: string;
  exclusions: string[];
  randomLocks: AssetRandomField[];
};

export function createAssetDraft(): AssetDraft {
  return {
    category: 'effect',
    format: 'still',
    subjects: { effect: 'particles', object: 'bottle', motion: 'ribbon' },
    details: { effect: '', object: '', motion: '' },
    style: 'anime',
    palette: 'blue',
    background: 'transparent',
    lighting: 'emission',
    camera: 'front',
    framing: 'center',
    ratio: '1:1',
    effectShape: 'radial',
    density: 'medium',
    material: '',
    condition: '',
    motion: '',
    direction: '',
    speed: '',
    timing: '',
    cameraMotion: 'fixed',
    duration: '3',
    loop: 'once',
    frameCount: '16',
    fps: '24',
    phases: { start: '', peak: '', end: '' },
    notes: '',
    negativeNotes: '',
    exclusions: ['text', 'clutter', 'cropped'],
    randomLocks: [],
  };
}

export const assetPresets: {
  id: string;
  name: string;
  description: string;
  category: AssetCategory;
  values: Partial<AssetDraft>;
}[] = [
  {
    id: 'rpg-slash-sheet',
    name: 'RPG・斬撃8コマ',
    description: '16bitドット × 半月の一閃',
    category: 'effect',
    values: {
      format: 'sprites',
      subjects: {
        effect: 'rpg-crescent-cut',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'rpg-pixel-16bit',
      palette: 'white',
      effectShape: 'arc',
      motion: 'sweep',
      direction: 'right',
      speed: 'fast',
      timing: 'ease-out',
      frameCount: '8',
      fps: '12',
      framing: 'rpg-hit-anchor',
    },
  },
  {
    id: 'rpg-heal-sheet',
    name: 'RPG・回復12コマ',
    description: '手描き魔法 × 上昇する光の泉',
    category: 'effect',
    values: {
      format: 'sprites',
      subjects: {
        effect: 'rpg-heal-fountain',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'rpg-vfx-painted',
      palette: 'green',
      effectShape: 'rising',
      motion: 'flow',
      direction: 'up',
      speed: 'slow',
      timing: 'ease',
      frameCount: '12',
      fps: '12',
      framing: 'rpg-ground-anchor',
    },
  },
  {
    id: 'rpg-barrier-loop',
    name: 'RPG・防御ループ',
    description: 'セル塗り × 積層する透明な結界',
    category: 'effect',
    values: {
      format: 'video',
      duration: '3',
      subjects: {
        effect: 'rpg-guard-shell',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'rpg-vfx-cel',
      palette: 'blue',
      effectShape: 'sphere',
      motion: 'pulse',
      direction: '',
      speed: 'slow',
      timing: 'ease',
      loop: 'seamless',
      framing: 'rpg-overlay-space',
    },
  },
  {
    id: 'manga-focus-panel',
    name: '漫画・集中線',
    description: 'Gペン × 中央に白い余白',
    category: 'effect',
    values: {
      subjects: {
        effect: 'manga-focus-bold',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'manga-gpen',
      palette: 'mono',
      background: 'manga-paper-white',
      lighting: 'unlit',
      effectShape: '',
      density: 'dense',
      framing: 'manga-center-open',
      ratio: '4:3',
    },
  },
  {
    id: 'manga-impact-panel',
    name: '漫画・衝撃の1コマ',
    description: '黒ベタと白抜き × 破裂する衝撃',
    category: 'effect',
    values: {
      subjects: {
        effect: 'manga-impact-white',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'manga-tone-shonen',
      palette: 'mono',
      background: 'manga-paper-white',
      lighting: 'unlit',
      effectShape: '',
      density: 'dense',
      framing: 'manga-panel-fit',
      ratio: '4:3',
    },
  },
  {
    id: 'manga-flower-panel',
    name: '漫画・華やぐ余白',
    description: '繊細なペン線 × 花の飾り縁',
    category: 'effect',
    values: {
      subjects: {
        effect: 'manga-flower-border',
        object: 'bottle',
        motion: 'ribbon',
      },
      style: 'manga-shojo-line',
      palette: 'mono',
      background: 'manga-paper-white',
      lighting: 'unlit',
      effectShape: '',
      density: 'sparse',
      framing: 'manga-center-open',
      ratio: '3:4',
    },
  },
  {
    id: 'magic',
    name: '魔法のきらめき',
    description: '青い光の粒子 × 透過素材',
    category: 'effect',
    values: {},
  },
  {
    id: 'fire',
    name: '炎のバースト',
    description: '一気に燃え上がる3秒の演出',
    category: 'effect',
    values: {
      format: 'video',
      subjects: { effect: 'flame', object: 'bottle', motion: 'ribbon' },
      palette: 'warm',
      background: 'black',
      effectShape: 'rising',
      density: 'dense',
      motion: 'expand',
      direction: 'up',
      speed: 'burst',
    },
  },
  {
    id: 'spell',
    name: '魔法陣ループ',
    description: '回転する紋様 × 16コマ',
    category: 'effect',
    values: {
      format: 'sprites',
      subjects: { effect: 'magic', object: 'bottle', motion: 'ribbon' },
      palette: 'purple',
      effectShape: 'ring',
      motion: 'rotate',
      direction: 'clockwise',
      speed: 'slow',
      timing: 'linear',
      loop: 'seamless',
    },
  },
  {
    id: 'potion',
    name: 'ポーション瓶',
    description: 'ガラスの質感 × アイテム素材',
    category: 'object',
    values: {
      material: 'glass',
      condition: 'ornate',
      lighting: 'soft',
      camera: 'three-quarter',
      palette: 'purple',
    },
  },
  {
    id: 'sword',
    name: '古びた剣',
    description: '金属の傷 × ファンタジー',
    category: 'object',
    values: {
      subjects: { effect: 'particles', object: 'sword', motion: 'ribbon' },
      material: 'metal',
      condition: 'worn',
      style: 'paint',
      palette: 'white',
      lighting: 'rim',
      ratio: '3:4',
    },
  },
  {
    id: 'product',
    name: 'プロダクト撮影',
    description: '白い陶器 × スタジオの柔らかな光',
    category: 'object',
    values: {
      subjects: { effect: 'particles', object: 'cup', motion: 'ribbon' },
      material: 'ceramic',
      condition: 'new',
      style: 'real',
      palette: 'white',
      lighting: 'soft',
      background: 'studio',
      camera: 'three-quarter',
    },
  },
  {
    id: 'ribbon',
    name: '光のリボン',
    description: 'なめらかに流れる5秒ループ',
    category: 'motion',
    values: {
      format: 'video',
      duration: '5',
      background: 'black',
      motion: 'flow',
      direction: 'right',
      speed: 'slow',
      timing: 'linear',
      loop: 'seamless',
      ratio: '16:9',
    },
  },
  {
    id: 'cube',
    name: '回転するキューブ',
    description: '3D × 一定速度の回転',
    category: 'motion',
    values: {
      format: 'video',
      subjects: { effect: 'particles', object: 'bottle', motion: 'cube' },
      style: '3d',
      palette: 'pastel',
      lighting: 'soft',
      background: 'white',
      camera: 'iso',
      motion: 'rotate',
      direction: 'clockwise',
      speed: 'slow',
      timing: 'linear',
      loop: 'seamless',
    },
  },
  {
    id: 'ripples',
    name: '広がる波紋',
    description: '静かな水面 × 12コマのアニメーション',
    category: 'motion',
    values: {
      format: 'sprites',
      subjects: { effect: 'particles', object: 'bottle', motion: 'wave' },
      style: 'flat',
      motion: 'expand',
      direction: 'out',
      speed: 'slow',
      frameCount: '12',
      fps: '12',
      camera: 'top',
      lighting: 'soft',
    },
  },
];

export function draftFromAssetPreset(id: string): AssetDraft {
  const preset = assetPresets.find((item) => item.id === id);
  return preset
    ? structuredClone({
        ...createAssetDraft(),
        ...preset.values,
        category: preset.category,
      })
    : createAssetDraft();
}
