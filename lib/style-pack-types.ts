export type StyleCategory = 'hand_drawn' | 'flat_editorial' | 'pop_character' | 'printmaking' | 'education_diagram' | 'fantasy_game' | 'anime_webtoon' | 'retro_misc' | 'smooth_clean';

export type SmoothCleanControls = {
  hairDetailLevel?: 'low' | 'medium' | 'high';
  hairClumpSize?: 'large' | 'medium' | 'small';
  hairTipStyle?: 'soft' | 'balanced' | 'sharp';
  ornamentLevel?: 'minimal' | 'standard' | 'rich';
  smoothnessLevel?: 'smooth' | 'balanced' | 'textured';
};
export type SmoothCleanSettings = SmoothCleanControls & { avoidIds?: string[] };

export type StylePreset = {
  id: string;
  nameJa: string;
  nameEn: string;
  category: StyleCategory;
  useCases: string[];
  stylePrompt: string;
  tags: string[];
  weight: number;
};

export type AntiAiBlock = {
  id: string;
  nameJa: string;
  nameEn: string;
  intent: string;
  antiAiPrompt: string;
  tags: string[];
  caution: string;
};

export const promptBlockNames = ['CONTENT', 'STYLE', 'ANTI_AI', 'AVOID'] as const;
export type PromptBlockName = typeof promptBlockNames[number];
export type PromptBlocks = Record<PromptBlockName, string>;
export type StylePackSelection = {
  presetId: string;
  antiAiIds: string[];
  excludedBlocks: PromptBlockName[];
  smoothClean?: SmoothCleanSettings;
};
