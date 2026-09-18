import type {
  CharacterDraft,
  CharacterSnapshot,
  GuidedSectionId,
} from './character-types';

export const CHARACTER_GUIDED_SECTIONS: GuidedSectionId[] = [
  'purpose',
  'style',
  'character',
  'appearance',
  'outfit',
  'action',
  'camera',
  'scene',
  'negative',
];

export const BACKGROUND_GUIDED_SECTIONS: GuidedSectionId[] = [
  'purpose',
  'style',
  'camera',
  'scene',
  'negative',
];

export function createBlankDraft(): CharacterDraft {
  return {
    purpose: '',
    style: '',
    styleTraits: [],
    gender: '',
    ageGroup: '',
    ageNumber: '',
    species: '',
    build: '',
    skinTone: '',
    personality: [],
    hairColors: [],
    hairEffects: [],
    hairstyle: '',
    eyeColor: '',
    eyeShape: '',
    eyeImpression: '',
    faceFeatures: [],
    outfit: '',
    outfitColors: [],
    outfitDetails: [],
    accessories: [],
    expression: '',
    pose: '',
    gaze: '',
    cameraAngle: '',
    composition: '',
    aspectRatio: '',
    background: '',
    timeOfDay: '',
    lighting: [],
    negatives: [],
    custom: {
      purpose: '',
      style: '',
      character: '',
      appearance: '',
      outfit: '',
      action: '',
      scene: '',
      negatives: '',
    },
  };
}

export function createBlankSnapshot(): CharacterSnapshot {
  return { draft: createBlankDraft(), locks: {} };
}

export function guidedSectionsForPurpose(purpose: string): GuidedSectionId[] {
  return [...(purpose === 'background' ? BACKGROUND_GUIDED_SECTIONS : CHARACTER_GUIDED_SECTIONS)];
}

export function isGuidedSectionId(value: unknown): value is GuidedSectionId {
  return typeof value === 'string'
    && CHARACTER_GUIDED_SECTIONS.includes(value as GuidedSectionId);
}

export function normalizeGuidedStep(
  requested: unknown,
  purpose: string,
): GuidedSectionId {
  const sections = guidedSectionsForPurpose(purpose);
  if (isGuidedSectionId(requested) && sections.includes(requested)) return requested;
  if (!isGuidedSectionId(requested)) return sections[0];

  const requestedIndex = CHARACTER_GUIDED_SECTIONS.indexOf(requested);
  return sections.find((section) =>
    CHARACTER_GUIDED_SECTIONS.indexOf(section) >= requestedIndex) ?? sections.at(-1)!;
}

export function selectGuidedPurpose(
  draft: CharacterDraft,
  purpose: string,
): CharacterDraft {
  return { ...draft, purpose };
}
