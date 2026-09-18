export type OutputMode = 'ja' | 'en' | 'both' | 'short' | 'tags';
export type UiLanguage = 'ja' | 'en';
export type ExportProfile = 'generic' | 'stable-diffusion' | 'midjourney' | 'novelai' | 'human-brief';
export type ColorMode = 'system' | 'light' | 'dark';
export type GuidedSectionId = 'purpose' | 'style' | 'character' | 'appearance' | 'outfit' | 'action' | 'camera' | 'scene' | 'negative';

export type OptionItem = {
  id: string;
  labelJa: string;
  labelEn: string;
  ja: string;
  en: string;
  tags: string[];
  weight: number;
  groups?: string[];
  specificity?: number;
};

export type Choice = OptionItem;

export type CharacterFields = {
  purpose: string;
  style: string;
  styleTraits: string[];
  gender: string;
  ageGroup: string;
  ageNumber: string;
  species: string;
  build: string;
  skinTone: string;
  personality: string[];
  hairColors: string[];
  hairEffects: string[];
  hairstyle: string;
  eyeColor: string;
  eyeShape: string;
  eyeImpression: string;
  faceFeatures: string[];
  outfit: string;
  outfitColors: string[];
  outfitDetails: string[];
  accessories: string[];
  expression: string;
  pose: string;
  gaze: string;
  cameraAngle: string;
  composition: string;
  aspectRatio: string;
  background: string;
  timeOfDay: string;
  lighting: string[];
  negatives: string[];
};

export type LockKey = keyof CharacterFields;

export type GeneratedGapChange = {
  field: LockKey;
  previous: string | string[];
  applied: string | string[];
};

export type GeneratedGapState = {
  seedId: string;
  labelJa: string;
  labelEn: string;
  segmentIndexes: number[];
  changes: GeneratedGapChange[];
};

export type CharacterDraft = CharacterFields & {
  custom: Record<string, string>;
  generatedGap?: GeneratedGapState;
};

export type CharacterSnapshot = {
  draft: CharacterDraft;
  locks: Partial<Record<LockKey, boolean>>;
};

export type SavedPreset = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  snapshot: CharacterSnapshot;
  builtIn?: boolean;
  pinned?: boolean;
  useCount?: number;
  lastUsedAt?: string;
  parentId?: string;
  note?: string;
};

export type HistoryEntry = {
  id: string;
  createdAt: string;
  label: string;
  name?: string;
  snapshot: CharacterSnapshot;
  source?: 'random' | 'gap' | 'copy' | 'load' | 'save' | 'manual' | 'batch';
  pinned?: boolean;
};

export type StudioPreferences = {
  language: UiLanguage;
  colorMode: ColorMode;
  simpleMode: boolean;
  guidedMode: boolean;
  guidedStep: GuidedSectionId;
  onboardingSeen: boolean;
  exportProfile: ExportProfile;
  favoriteChoices: Record<string, string[]>;
  recentChoices: Record<string, string[]>;
};

export type RandomTheme = {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  preferredTags: string[];
  secondaryTags: string[];
  excludedTags: string[];
  core: Array<{
    field: LockKey;
    ids?: string[];
    tags?: string[];
  }>;
};

export type GapSeed = {
  id: string;
  label: string;
  labelEn: string;
  segments: string[];
  segmentsEn: string[];
};
