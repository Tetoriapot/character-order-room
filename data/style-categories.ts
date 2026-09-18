import type { StyleCategory } from '@/lib/style-pack-types';

export const styleCategories: { id: StyleCategory; nameJa: string; nameEn: string; weight: number }[] = [
  { id: 'hand_drawn', nameJa: '手描き', nameEn: 'Hand drawn', weight: 1.20 },
  { id: 'flat_editorial', nameJa: 'フラット・挿絵', nameEn: 'Flat / editorial', weight: 1.25 },
  { id: 'pop_character', nameJa: 'ポップ・キャラ', nameEn: 'Pop / character', weight: 1.10 },
  { id: 'printmaking', nameJa: '印刷・版画', nameEn: 'Printmaking', weight: 0.95 },
  { id: 'education_diagram', nameJa: '教材・図解', nameEn: 'Education / diagram', weight: 1.05 },
  { id: 'fantasy_game', nameJa: '幻想・ゲーム', nameEn: 'Fantasy / game', weight: 1.10 },
  { id: 'anime_webtoon', nameJa: 'アニメ・Webtoon', nameEn: 'Anime / webtoon', weight: 1.15 },
  { id: 'retro_misc', nameJa: 'レトロ・工芸', nameEn: 'Retro / craft', weight: 0.90 },
];

export const styleCompatibility: Record<StyleCategory, string[]> = {
  hand_drawn: ['subtle_paper_texture', 'line_irregularity_light', 'brush_trace', 'restrained_detail'],
  flat_editorial: ['gentle_asymmetry', 'imperfect_spacing', 'avoid_stock_feel', 'limited_palette_5', 'reduce_background_clutter'],
  pop_character: ['line_irregularity_light', 'avoid_overcute_polish', 'negative_space_boost'],
  printmaking: ['registration_shift_light', 'ink_coverage_variation', 'halftone_soft', 'print_age_soft'],
  education_diagram: ['reduce_background_clutter', 'prop_purpose_only', 'limited_palette_5', 'quiet_composition'],
  fantasy_game: ['restrained_detail', 'reduce_background_clutter', 'soften_gradients', 'matte_finish'],
  anime_webtoon: ['reduced_polish', 'soften_gradients', 'avoid_overcute_polish', 'simplify_face'],
  retro_misc: ['subtle_paper_texture', 'print_age_soft', 'gentle_asymmetry', 'limited_palette_8'],
};

export const antiAiStrengths = {
  weak: ['reduced_polish', 'restrained_detail'],
  medium: ['reduced_polish', 'subtle_paper_texture', 'reduce_background_clutter'],
  strong: ['reduced_polish', 'line_irregularity_light', 'subtle_paper_texture', 'imperfect_spacing', 'avoid_stock_feel'],
};
