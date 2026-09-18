import type { Choice, LockKey, UiLanguage } from '@/lib/character-types';

export type ChoiceCategory = {
  id: string;
  labelJa: string;
  labelEn: string;
  matches: (choice: Choice) => boolean;
};

const textFor = (choice: Choice) => `${choice.id} ${choice.tags.join(' ')}`;
const category = (id: string, labelJa: string, labelEn: string, pattern: RegExp): ChoiceCategory => ({
  id,
  labelJa,
  labelEn,
  matches: (choice) => pattern.test(textFor(choice)),
});

const visualCategories = [
  category('fantasy', 'ファンタジー', 'Fantasy', /fantasy|magic|mage|witch|angel|demon|vampire|elf|fairy|dragon|royal|knight|gothic|ghost|holy|myth/i),
  category('modern', '現代・日常', 'Modern & everyday', /modern|casual|school|office|suit|doctor|teacher|idol|street|cafe|city|room|urban/i),
  category('nature', '自然', 'Nature', /forest|flower|garden|beach|sea|ocean|snow|rain|desert|mountain|sky|sun|moon|nature/i),
  category('dramatic', 'ドラマチック', 'Dramatic', /dark|battle|injur|tragic|ominous|villain|dynamic|glow|neon|stage|cinematic/i),
];

const emotionCategories = [
  category('positive', '明るい', 'Positive', /smile|bright|happy|cheer|friendly|gentle|calm|warm|kind|confident/i),
  category('quiet', '静か・繊細', 'Quiet & subtle', /shy|quiet|soft|fragile|sleep|tired|wistful|lonely|mysterious|reserved/i),
  category('intense', '強い感情', 'Intense', /angry|cry|sad|fear|shock|serious|insane|villain|commanding|fierce/i),
];

const colorCategories = [
  category('natural', '自然色', 'Natural', /black|brown|blond|gold|white|gray|grey|auburn|beige|navy/i),
  category('cool', '寒色', 'Cool', /blue|cyan|aqua|green|teal|purple|violet|indigo|silver/i),
  category('warm', '暖色', 'Warm', /red|orange|yellow|pink|rose|coral|gold|cream/i),
  category('special', '特殊色', 'Special', /rainbow|gradient|iridescent|neon|pastel|transparent|glow|metal/i),
];

const hairCategories = [
  category('short', '短め', 'Short', /short|bob|pixie|crop|buzz|shaved|undercut/i),
  category('long', '長め', 'Long', /long|waist|hip|floor|flowing/i),
  category('arranged', 'まとめ髪', 'Tied & styled', /ponytail|braid|bun|updo|twintail|pigtail|tied/i),
  category('texture', '質感・くせ', 'Texture', /curl|wave|straight|messy|fluffy|spiky/i),
];

const actionCategories = [
  category('standing', '立ち姿', 'Standing', /stand|upright|contrapposto|arms-crossed|hand-hip/i),
  category('sitting', '座る・休む', 'Sitting & resting', /sit|chair|kneel|crouch|sleep|rest/i),
  category('action', '動き', 'Action', /run|jump|fight|sword|magic|dance|reach|turn|walk|dynamic/i),
  category('gesture', '手・小物', 'Gestures & props', /hand|hold|book|glasses|phone|cup|weapon|prayer|wave/i),
];

const negativeCategories = [
  category('marks', '文字・ロゴ', 'Text & marks', /text|logo|watermark|signature|frame/i),
  category('anatomy', '人体・顔', 'Anatomy & face', /hand|finger|limb|anatomy|face|eye|teeth|neck|head|asymmetry/i),
  category('quality', '画質・絵柄', 'Quality & style', /blur|lowres|real|3d|noise|color|saturation|render|style|exposure|light/i),
  category('composition', '構図・内容', 'Composition & content', /crop|crowd|people|character|clutter|object|background|perspective|silhouette/i),
];

const cameraCategories = [
  category('direction', '向き・左右', 'Direction & sides', /camera-direction|^(front|three-quarter|profile|over-shoulder)\b/),
  category('height', '高さ・俯瞰・あおり', 'Height & elevation', /camera-height|^(eye|high|low|dramatic-low-angle|top-down-angle)\b/),
  category('effect', '演出・距離', 'Effect & distance', /camera-dramatic|^(tilted|close-up-framing|distant-shot|cinematic-angle|portrait-oriented-framing)\b/),
];

const compositionCategories = [
  category('framing', '写す範囲', 'Framing', /composition-framing|^(close|headshot|bust|waist|knees|full|dynamic-full-body-composition|upper-body-focused-composition|silhouette-focused-composition)\b/),
  category('placement', '配置・視線誘導', 'Placement & visual flow', /composition-placement|^(centered-composition|slightly-off-center-composition)\b/),
  category('space', '余白', 'Negative space', /composition-space/),
  category('depth', '背景・奥行き', 'Setting & depth', /composition-depth|^composition-showing-more-background\b/),
  category('format', '画面形・設定画', 'Format & reference', /^(vertical-portrait-composition|square-icon-composition|sheet)\b/),
];

export function categoriesForField(field: LockKey | undefined): ChoiceCategory[] {
  if (!field) return [];
  if (['hairColors', 'outfitColors', 'eyeColor'].includes(field)) return colorCategories;
  if (['personality', 'expression'].includes(field)) return emotionCategories;
  if (field === 'hairstyle') return hairCategories;
  if (field === 'pose') return actionCategories;
  if (field === 'negatives') return negativeCategories;
  if (field === 'cameraAngle') return cameraCategories;
  if (field === 'composition') return compositionCategories;
  if (['outfit', 'accessories', 'background', 'lighting', 'styleTraits', 'faceFeatures'].includes(field)) return visualCategories;
  return [];
}

export function choiceCategoryLabel(categoryValue: ChoiceCategory, language: UiLanguage) {
  return language === 'ja' ? categoryValue.labelJa : categoryValue.labelEn;
}
