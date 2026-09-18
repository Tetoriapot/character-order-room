import type {
  CharacterDraft,
  CharacterSnapshot,
  LockKey,
  SavedPreset,
} from '@/lib/character-types';

export const defaultDraft: CharacterDraft = {
  purpose: 'chat',
  style: 'vibrant-anime',
  styleTraits: ['glass-gloss', 'translucent'],
  gender: 'male',
  ageGroup: 'adult',
  ageNumber: '',
  species: 'human',
  build: 'tall',
  skinTone: 'warm',
  personality: ['friendly', 'gentle'],
  hairColors: ['black'],
  hairEffects: [],
  hairstyle: 'loose-curl',
  eyeColor: 'gold',
  eyeShape: 'almond',
  eyeImpression: 'gentle',
  faceFeatures: [],
  outfit: 'cardigan',
  outfitColors: ['navy', 'white'],
  outfitDetails: ['simple'],
  accessories: [],
  expression: 'shy-smile',
  pose: 'natural',
  gaze: 'camera',
  cameraAngle: 'three-quarter',
  composition: 'waist',
  aspectRatio: 'portrait',
  background: 'solid',
  timeOfDay: 'day',
  lighting: ['soft'],
  negatives: ['no-text', 'no-logo', 'no-watermark', 'one-person', 'good-hands', 'good-fingers'],
  custom: {
    purpose: '', style: '', character: '', appearance: '', outfit: '', action: '', scene: '', negatives: '',
  },
};

export const purposeRecommendations: Record<string, Partial<CharacterDraft>> = {
  chat: {
    aspectRatio: 'portrait', composition: 'waist', background: 'solid', gaze: 'camera', cameraAngle: 'three-quarter',
    negatives: ['no-text', 'no-logo', 'no-watermark', 'one-person', 'no-crowd', 'good-hands', 'good-fingers'],
  },
  standing: {
    aspectRatio: 'transparent', composition: 'full', background: 'transparent', gaze: 'camera', cameraAngle: 'front',
    negatives: ['no-text', 'no-logo', 'no-watermark', 'one-person', 'no-crop', 'good-hands', 'good-fingers'],
  },
  icon: {
    aspectRatio: 'square', composition: 'bust', background: 'solid', gaze: 'camera', cameraAngle: 'front',
    negatives: ['no-text', 'no-logo', 'no-watermark', 'one-person', 'good-hands'],
  },
  bust: { aspectRatio: 'portrait', composition: 'bust', gaze: 'camera', cameraAngle: 'three-quarter' },
  waist: { aspectRatio: 'portrait', composition: 'waist', gaze: 'camera', cameraAngle: 'three-quarter' },
  full: { aspectRatio: 'portrait', composition: 'full', background: 'solid', cameraAngle: 'front', negatives: ['no-text', 'no-logo', 'no-watermark', 'one-person', 'no-crop', 'good-hands', 'good-fingers'] },
  trpg: { aspectRatio: 'portrait', composition: 'bust', background: 'library', gaze: 'camera', cameraAngle: 'three-quarter' },
  event: { aspectRatio: 'landscape', composition: 'knees', background: 'fantasy-city', cameraAngle: 'three-quarter' },
  still: { aspectRatio: 'landscape', composition: 'waist', background: 'room', cameraAngle: 'three-quarter' },
  sns: { aspectRatio: 'square', composition: 'bust', background: 'solid', gaze: 'camera' },
  reference: { aspectRatio: 'landscape', composition: 'sheet', background: 'white', cameraAngle: 'front' },
  background: {
    aspectRatio: 'landscape',
    composition: 'composition-showing-more-background',
    background: 'fantasy-city',
    negatives: ['no-text', 'no-logo', 'no-watermark', 'no-people', 'no-clutter'],
  },
  custom: {},
};

const snapshot = (draft: Partial<CharacterDraft>, locks: Partial<Record<LockKey, boolean>> = {}): CharacterSnapshot => ({
  draft: { ...defaultDraft, ...draft, custom: { ...defaultDraft.custom, ...draft.custom } },
  locks,
});

const builtAt = '2026-08-30T00:00:00.000Z';

export const builtInPresets: SavedPreset[] = [
  {
    id: 'builtin-zeta-male', name: 'Zeta男性キャラ', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ purpose: 'chat', gender: 'male', ageGroup: 'adult', style: 'vibrant-anime', composition: 'waist', aspectRatio: 'portrait', background: 'solid' }),
  },
  {
    id: 'builtin-zeta-female', name: 'Zeta女性キャラ', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ purpose: 'chat', gender: 'female', ageGroup: 'young', style: 'vibrant-anime', personality: ['beautiful', 'friendly'], hairstyle: 'long', composition: 'waist', aspectRatio: 'portrait', background: 'solid' }),
  },
  {
    id: 'builtin-trpg', name: 'TRPG NPC', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ purpose: 'trpg', style: 'painterly', personality: ['mysterious', 'intellectual'], outfit: 'adventurer', expression: 'serious', composition: 'bust', background: 'library' }),
  },
  {
    id: 'builtin-otome', name: '乙女ゲーム風男性', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ purpose: 'chat', style: 'otome', styleTraits: ['glamorous', 'glass-gloss', 'light-focus'], gender: 'male', personality: ['beautiful', 'noble'], outfit: 'aristocrat', composition: 'waist', aspectRatio: 'portrait', lighting: ['soft', 'sparkles'] }),
  },
  {
    id: 'builtin-webtoon', name: 'Webtoon', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ purpose: 'chat', style: 'webtoon', styleTraits: ['glass-gloss', 'translucent', 'glamorous'], negatives: ['no-text', 'no-logo', 'no-watermark', 'no-realism', 'one-person', 'good-hands'] }),
  },
  {
    id: 'builtin-fantasy-prince', name: 'ファンタジー王子', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'male', ageGroup: 'young', personality: ['noble', 'elegant'], outfit: 'royal', background: 'palace', lighting: ['golden-light', 'sparkles'] }),
  },
  {
    id: 'builtin-fantasy-knight', name: 'ファンタジー騎士', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ personality: ['brave', 'loyal'], build: 'muscular', outfit: 'knight', accessories: ['sword'], pose: 'posing-with-sword-ready', background: 'castle-wall' }),
  },
  {
    id: 'builtin-dark-noble', name: 'ダークファンタジー貴人', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ style: 'dark-fantasy', personality: ['noble', 'mysterious'], outfit: 'dark-noble-outfit', background: 'ruins', lighting: ['moon', 'foggy-atmosphere'] }),
  },
  {
    id: 'builtin-school-boy', name: '学園男子', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'male', ageGroup: 'boy', outfit: 'school', background: 'classroom', expression: 'bright-smile' }),
  },
  {
    id: 'builtin-school-girl', name: '学園女子', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'female', ageGroup: 'girl', outfit: 'school-uniform-with-cardigan', background: 'rooftop', expression: 'shy-smile' }),
  },
  {
    id: 'builtin-teacher', name: '教師風', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ ageGroup: 'adult', personality: ['teacher-like', 'unreliable'], outfit: 'cardigan', faceFeatures: ['glasses'], accessories: ['book'], expression: 'awkward-smile', pose: 'glasses', background: 'classroom' }),
  },
  {
    id: 'builtin-mafia', name: 'マフィアボス', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ personality: ['commanding', 'charismatic'], outfit: 'mafia', accessories: ['cigar'], expression: 'smirk', background: 'luxurious-room', lighting: ['underlighting'] }),
  },
  {
    id: 'builtin-angel', name: '天使系', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'angel', personality: ['holy', 'gentle'], outfit: 'clergy', accessories: ['wings', 'halo-like-accessory'], background: 'heavenly-scene', lighting: ['holy-light'] }),
  },
  {
    id: 'builtin-fallen-angel', name: '傷ついた堕天使', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'fallen-angel', personality: ['wounded', 'tragic'], outfit: 'dirty-clothes', accessories: ['wings'], expression: 'wounded-expression', pose: 'kneeling-while-injured', background: 'ominous-sky', lighting: ['ominous-glow'] }),
  },
  {
    id: 'builtin-vampire', name: '吸血鬼貴族', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'vampire', personality: ['noble', 'mysterious'], outfit: 'vampire-noble-attire', faceFeatures: ['fangs'], background: 'moonlit-night', timeOfDay: 'night', lighting: ['moon'] }),
  },
  {
    id: 'builtin-japanese-ghost', name: '和風幽霊', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'ghost', outfit: 'kimono', pose: 'floating', background: 'bamboo-grove', lighting: ['moon', 'light-mist'] }),
  },
  {
    id: 'builtin-alluring-man', name: 'メロいお兄さん', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'male', ageGroup: 'adult', personality: ['alluring', 'gentle'], outfit: 'cardigan', expression: 'smile', composition: 'waist' }),
  },
  {
    id: 'builtin-pretty-boy', name: '美少年', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'androgynous', ageGroup: 'boy', build: 'delicate', personality: ['beautiful', 'ethereal'], style: 'shojo', composition: 'bust' }),
  },
  {
    id: 'builtin-pretty-girl', name: '美少女', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'female', ageGroup: 'girl', build: 'petite', personality: ['cute', 'beautiful'], hairstyle: 'long', style: 'vibrant-anime', composition: 'bust' }),
  },
  {
    id: 'builtin-gothic', name: 'ゴシック系', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ personality: ['dark', 'elegant'], outfit: 'gothic', background: 'cathedral', lighting: ['candle', 'moon'] }),
  },
  {
    id: 'builtin-cyberpunk', name: 'サイバーパンクハッカー', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'android', personality: ['intellectual', 'cool'], outfit: 'cyberpunk', accessories: ['headphones'], background: 'neon-lit-city', lighting: ['neon'] }),
  },
  {
    id: 'builtin-miko', name: '巫女', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'female', personality: ['holy', 'mysterious'], outfit: 'shrine-maiden-outfit', background: 'shrine', lighting: ['dappled'] }),
  },
  {
    id: 'builtin-sister', name: 'シスター', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ gender: 'female', personality: ['holy', 'gentle'], outfit: 'sister', accessories: ['rosary'], pose: 'prayer-pose', background: 'church', lighting: ['stained-glass'] }),
  },
  {
    id: 'builtin-desert-mage', name: '砂漠の魔術師', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ outfit: 'desert-mage-outfit', accessories: ['staff'], pose: 'casting-magic', background: 'desert', lighting: ['warm-lighting', 'magic'] }),
  },
  {
    id: 'builtin-forest-elf', name: '森のエルフ', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'elf', personality: ['gentle', 'ethereal'], outfit: 'forest-elf-outfit', background: 'forest', lighting: ['dappled'] }),
  },
  {
    id: 'builtin-office-worker', name: '会社員', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ species: 'human', ageGroup: 'adult', outfit: 'suit', background: 'office', lighting: ['indoor'] }),
  },
  {
    id: 'builtin-idol', name: 'アイドル', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ ageGroup: 'young', personality: ['bright', 'charismatic'], outfit: 'idol', accessories: ['microphone'], expression: 'bright-smile', background: 'stage', lighting: ['stage-lighting'] }),
  },
  {
    id: 'builtin-doctor', name: '医者', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ ageGroup: 'adult', personality: ['intellectual', 'reliable'], outfit: 'doctor', background: 'hospital-room', lighting: ['bright-lighting'] }),
  },
  {
    id: 'builtin-villain', name: '悪役', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ personality: ['villainous', 'commanding'], outfit: 'demon-lord-outfit', expression: 'smirk', background: 'dark-hall', lighting: ['underlighting'] }),
  },
  {
    id: 'builtin-pastel', name: 'やわらかパステル', createdAt: builtAt, updatedAt: builtAt, builtIn: true,
    snapshot: snapshot({ style: 'vibrant-anime', styleTraits: ['pastel', 'soft-colors', 'translucent'], personality: ['gentle', 'soft-looking'], background: 'pastel-background', lighting: ['soft'] }),
  },
];
