import type { CharacterSnapshot, LockKey } from '@/lib/character-types';

export type InferenceSource = 'explicit' | 'inferred' | 'suggested';
export type InferenceLevel = 'strict' | 'standard' | 'rich';
export type InferenceMergeMode = 'overwrite' | 'append' | 'skip';

export const inferenceFields = [
  'gender',
  'ageGroup',
  'species',
  'build',
  'skinTone',
  'personality',
  'hairColors',
  'hairstyle',
  'eyeColor',
  'eyeShape',
  'faceFeatures',
  'outfit',
  'outfitColors',
  'outfitDetails',
  'accessories',
  'expression',
  'pose',
  'gaze',
  'background',
  'timeOfDay',
  'lighting',
  'composition',
  'negatives',
] as const satisfies readonly LockKey[];

export type InferenceField = (typeof inferenceFields)[number];

export const multiValueInferenceFields = new Set<InferenceField>([
  'personality',
  'hairColors',
  'faceFeatures',
  'outfitColors',
  'outfitDetails',
  'accessories',
  'lighting',
  'negatives',
]);

export type InferredValue = {
  candidateId?: string;
  category: InferenceField;
  valueId: string;
  labelJa?: string;
  labelEn?: string;
  source: InferenceSource;
  confidence: number;
  evidence?: string;
  reason?: string;
  reasonEn?: string;
  adopted?: boolean;
  locked?: boolean;
  requiresConfirmation?: boolean;
};

export type InferenceResult = {
  rawText: string;
  normalizedText: string;
  level: InferenceLevel;
  values: InferredValue[];
  warnings: string[];
};

export type InferenceInput = {
  text: string;
  level: InferenceLevel;
};

export type InferenceEngine = {
  id: string;
  supportedFields: readonly InferenceField[];
  infer: (input: InferenceInput) => InferenceResult | Promise<InferenceResult>;
};

export const inferenceDecisionKey = (value: InferredValue) =>
  value.candidateId ?? `${value.category}:${value.valueId}`;

export type InferenceAliasTarget = {
  category: InferenceField;
  valueId: string;
  source?: InferenceSource;
  confidence?: number;
};

export type InferenceAlias = {
  key: string;
  targets: InferenceAliasTarget[];
  confidence?: number;
  matchMode?: 'substring' | 'standalone' | 'hairstyle';
};

export type InferenceDecision = {
  valueId: string;
  adopted: boolean;
  locked: boolean;
};

export type InferenceMergeReport = {
  applied: Array<{ category: InferenceField; valueId: string }>;
  skippedLocked: InferenceField[];
  skippedExisting: InferenceField[];
  skippedConflict: Array<{ category: InferenceField; valueId: string; reason: string }>;
};

export type InferenceMergeResult = {
  snapshot: CharacterSnapshot;
  report: InferenceMergeReport;
};
