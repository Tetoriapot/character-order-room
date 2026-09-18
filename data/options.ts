import type { Choice, LockKey } from '@/lib/character-types';
import {
  ageGroups,
  genders,
  purposes,
  skinTones,
  styleModifiers,
  styles,
} from './character';
import {
  eyeImpressions,
  hairEffects,
} from './appearance';
import {
  aspectRatios,
  timesOfDay,
} from './scenes';
import { traits as personalities } from './traits';
import { hairColors } from './hairColors';
import { hairstyles } from './hairstyles';
import { eyeColors } from './eyeColors';
import { eyeShapes } from './eyeShapes';
import { faceFeatures } from './faceFeatures';
import { species } from './species';
import { bodyTypes as builds } from './bodyTypes';
import { outfits as baseOutfits } from './outfits';
import { outfitColors } from './outfitColors';
import { outfitDetails } from './outfitDetails';
import { accessories as baseAccessories } from './accessories';
import { gapAccessories } from './gapAccessories';
import { expressions } from './expressions';
import { poses } from './poses';
import { gazes } from './gaze';
import { cameraAngles as baseCameraAngles } from './cameraAngles';
import { compositions as baseCompositions } from './compositions';
import { expandedCameraAngles, expandedCompositions } from './camera-expansion';
import { backgrounds } from './backgrounds';
import { lighting } from './lighting';
import { negativePrompts as baseNegatives } from './negativePrompts';
import { supplementalNegatives, supplementalOutfits } from './supplemental';

const accessories = [...baseAccessories, ...gapAccessories];
const outfits = [...baseOutfits, ...supplementalOutfits];
const negatives = [...baseNegatives, ...supplementalNegatives];
const cameraAngles = [...baseCameraAngles, ...expandedCameraAngles];
const compositions = [...baseCompositions, ...expandedCompositions];

export const optionsByField: Partial<Record<LockKey, Choice[]>> = {
  purpose: purposes,
  style: styles,
  styleTraits: styleModifiers,
  gender: genders,
  ageGroup: ageGroups,
  species,
  build: builds,
  skinTone: skinTones,
  personality: personalities,
  hairColors,
  hairEffects,
  hairstyle: hairstyles,
  eyeColor: eyeColors,
  eyeShape: eyeShapes,
  eyeImpression: eyeImpressions,
  faceFeatures,
  outfit: outfits,
  outfitColors,
  outfitDetails,
  accessories,
  expression: expressions,
  pose: poses,
  gaze: gazes,
  cameraAngle: cameraAngles,
  composition: compositions,
  aspectRatio: aspectRatios,
  background: backgrounds,
  timeOfDay: timesOfDay,
  lighting,
  negatives,
};

export const allChoiceGroups = Object.values(optionsByField).filter(Boolean) as Choice[][];

export const translationDictionary = Object.fromEntries(
  allChoiceGroups.flat().map((choice) => [choice.labelJa, choice.labelEn]),
);

export const findChoice = (field: LockKey, id: string) =>
  optionsByField[field]?.find((choice) => choice.id === id);

export const labelFor = (field: LockKey, id: string) => findChoice(field, id)?.labelJa ?? id;
export const englishFor = (field: LockKey, id: string) => findChoice(field, id)?.labelEn ?? id;

export {
  ageGroups,
  accessories,
  aspectRatios,
  backgrounds,
  builds,
  cameraAngles,
  compositions,
  eyeColors,
  eyeImpressions,
  eyeShapes,
  expressions,
  faceFeatures,
  gazes,
  genders,
  hairColors,
  hairEffects,
  hairstyles,
  lighting,
  negatives,
  outfitColors,
  outfitDetails,
  outfits,
  personalities,
  poses,
  purposes,
  skinTones,
  species,
  styleModifiers,
  styles,
  timesOfDay,
};
