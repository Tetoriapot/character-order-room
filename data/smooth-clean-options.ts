import type { SmoothCleanControls } from '@/lib/style-pack-types';

type ControlOption = { id: string; ja: string; en: string; prompt: string; helperIds: string[] };
export const smoothCleanControls: Array<{
  key: keyof SmoothCleanControls; ja: string; en: string; hintJa: string; hintEn: string; options: ControlOption[];
}> = [
  { key: 'hairDetailLevel', ja: '髪の描き込み量', en: 'Hair detail', hintJa: '少：細かい線を減らし、顔の魅力を優先します。', hintEn: 'Low reduces fine strands while preserving facial appeal.', options: [
    { id: 'low', ja: '少', en: 'Low', prompt: 'low hair detail, simplified internal hair lines while preserving refined eyes and facial features', helperIds: ['anti_overdetailed_hair', 'anti_flyaway_noise', 'face_over_hair_priority', 'reduced_texture_buildup'] },
    { id: 'medium', ja: '中', en: 'Medium', prompt: 'moderate hair detail, balanced strand definition', helperIds: [] },
    { id: 'high', ja: '多', en: 'High', prompt: 'high hair detail, carefully defined individual strands', helperIds: [] },
  ] },
  { key: 'hairClumpSize', ja: '毛束の大きさ', en: 'Hair clump size', hintJa: '大：大きめのまとまりで、輪郭をすっきり見せます。', hintEn: 'Large groups create a clear, readable silhouette.', options: [
    { id: 'large', ja: '大', en: 'Large', prompt: 'large grouped hair clumps', helperIds: ['large_hair_clumps_prompt', 'clean_silhouette_priority'] },
    { id: 'medium', ja: '中', en: 'Medium', prompt: 'medium-sized hair clumps', helperIds: [] },
    { id: 'small', ja: '小', en: 'Small', prompt: 'small, finely separated hair clumps', helperIds: [] },
  ] },
  { key: 'hairTipStyle', ja: '毛先の処理', en: 'Hair tips', hintJa: 'やわらかい：尖らせすぎず、前髪も整理します。', hintEn: 'Soft simplifies sharp tips and groups the fringe.', options: [
    { id: 'soft', ja: 'やわらかい', en: 'Soft', prompt: 'soft simplified hair tips', helperIds: ['anti_spiky_hair_ends', 'soft_grouped_bangs'] },
    { id: 'balanced', ja: 'バランス', en: 'Balanced', prompt: 'balanced hair tips, neither overly soft nor overly sharp', helperIds: [] },
    { id: 'sharp', ja: 'シャープ', en: 'Sharp', prompt: 'sharp, clearly defined hair tips', helperIds: [] },
  ] },
  { key: 'ornamentLevel', ja: '装飾量', en: 'Ornament density', hintJa: '少：アクセサリーや衣装装飾を控えめにします。', hintEn: 'Minimal reduces accessory and outfit decoration.', options: [
    { id: 'minimal', ja: '少', en: 'Minimal', prompt: 'minimal ornament density, restrained outfit decoration', helperIds: ['restrained_ornament', 'reduced_accessory_count', 'minimal_outfit_folds'] },
    { id: 'standard', ja: '標準', en: 'Standard', prompt: 'standard ornament density, balanced decorative accents', helperIds: [] },
    { id: 'rich', ja: '多', en: 'Rich', prompt: 'rich ornamentation with clearly defined decorative details', helperIds: [] },
  ] },
  { key: 'smoothnessLevel', ja: '塗りの滑らかさ', en: 'Surface finish', hintJa: 'なめらか：光沢を抑え、つるっとした面に整理します。', hintEn: 'Smooth controls highlights for a sleek finish.', options: [
    { id: 'smooth', ja: 'なめらか', en: 'Smooth', prompt: 'smooth polished surface finish with controlled highlights', helperIds: ['smooth_surface_finish', 'controlled_highlights', 'low_clutter_character_finish'] },
    { id: 'balanced', ja: 'バランス', en: 'Balanced', prompt: 'balanced surface finish, subtle texture with restrained polish', helperIds: [] },
    { id: 'textured', ja: '質感を残す', en: 'Textured', prompt: 'visible tactile surface texture, preserve material grain', helperIds: [] },
  ] },
];

export const smoothCleanAvoidChoices = [
  { id: 'intricate_hair', ja: '細かすぎる髪の線', en: 'Overly intricate hair strands', prompt: 'avoid overly intricate hair strands' },
  { id: 'thin_tips', ja: '細すぎる毛先', en: 'Too many thin hair tips', prompt: 'avoid too many thin hair tips' },
  { id: 'flyaways', ja: '過剰な飛び毛', en: 'Excessive flyaway hairs', prompt: 'avoid excessive flyaway hairs' },
  { id: 'accessory_clutter', ja: 'アクセサリーの盛りすぎ', en: 'Cluttered accessories', prompt: 'avoid cluttered accessories' },
  { id: 'decorative_clothing', ja: '衣装の過剰な装飾', en: 'Overly decorative clothing', prompt: 'avoid overly decorative clothing' },
  { id: 'fine_noise', ja: '細部のノイズ', en: 'Noisy fine detail', prompt: 'avoid noisy fine detail' },
  { id: 'texture_buildup', ja: '質感の盛りすぎ', en: 'Excessive texture buildup', prompt: 'avoid excessive texture buildup' },
  { id: 'complex_bangs', ja: '複雑すぎる前髪', en: 'Unnecessarily complex bangs', prompt: 'avoid unnecessarily complex bangs' },
  { id: 'dense_ornament', ja: '高密度の装飾', en: 'Dense ornamentation', prompt: 'avoid dense ornamentation' },
  { id: 'generic_detail', ja: '画一的な過描写', en: 'Generic over-detailed rendering', prompt: 'avoid generic over-detailed rendering' },
];
