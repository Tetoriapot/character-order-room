import type { LockKey } from '@/lib/character-types';

export type GapBlueprintAssignment = {
  field: LockKey;
  optionId: string;
};

export type GapBlueprintSegment = {
  fields: LockKey[];
  assignments: GapBlueprintAssignment[];
  adultOnly: boolean;
};

export type GapBlueprint = {
  id: string;
  segments: GapBlueprintSegment[];
};

// One line per curated gap seed in data/gapSeeds.ts. Each ×-separated segment
// declares every field it semantically affects; `field=optionId` also applies a
// concrete catalog choice. `!adult` excludes the segment for minors.
const raw = `
build=powerful,outfit=knight × accessories=floral-apron × expression=awkward-smile
outfit=mafia,personality=cold × personality × accessories=pink-cardigan
personality=pure,expression=pure-expression × personality × outfit=military,outfitColors=black
personality=rebellious × personality × accessories=bouquet
build=large,personality=commanding × expression=innocent-smile × outfit=chef-outfit
species=vampire,personality=noble × expression=sleepy × outfit=loungewear
outfit=teacher-like-outfit,personality=serious × faceFeatures=glasses × personality
outfit=military,expression=neutral × accessories=rabbit-plush
outfit=yakuza-style-kimono × personality=refined × eyeImpression=gentle
outfit=idol × expression=neutral,personality=cool
outfit=royal,personality=luxurious × expression=blushing,personality=shy
outfit=adventurer-outfit,faceFeatures=scar × accessories=flower-crown
outfit=mage,personality=suspicious × expression=friendly-smile
outfit=gothic-aristocrat-outfit,personality=noble × build=athletic-build-2
outfit=suit,personality=mature,!adult × personality=boyish,personality=innocent
outfit=cyberpunk,personality=intellectual × outfitDetails=embroidery
build=frail-build × expression=bold-grin
outfit=sister × expression=teasing-smile,!adult
outfit=priest-outfit,personality=gentle × expression=mad,personality=mad
species=ghost,personality=haunting × expression=shy-smile
species=beastfolk,personality=wild × pose=reading,personality=scholarly
outfit=royal-robe-2 × pose=standing-in-a-relaxed-pose
outfit=detective × background=rainy-alley-2,expression=yearning-expression
build=muscular × accessories=flower-hair-ornament
expression=innocent-smile × outfit=assassin-outfit
outfit=teacher-like-outfit,personality=unreliable × gaze=intense-gaze,personality=commanding
species=vampire,outfit=vampire-noble-attire × expression=awkward-smile
species=dark-elf × lighting=dappled,personality=gentle
outfit=paladin-armor × faceFeatures=dark-circles
personality=flirtatious,expression=flirtatious-smile,!adult × personality=serious
gender=androgynous,ageGroup=boy,personality=androgynous × outfit=heavy-armor
build=large,outfit=adventurer-outfit × accessories
outfit=demon-lord-outfit × eyeImpression=gentle
outfit=aristocrat,outfitColors=white × pose=hide-face,expression=embarrassed
build=powerful,personality=commanding × pose=reading
outfit=school-uniform-jacket,personality=rebellious × eyeShape=round,eyeImpression=innocent
species=ghost,outfit=kimono × expression=playful-expression
outfit=lab-coat,personality=intellectual × hairstyle=messy
personality=sensual,!adult × expression=innocent-smile
personality=cold,expression=cold-expression × personality=protective
build=athletic-build-2,personality=energetic × accessories=lace-gloves
outfit=shrine-maiden-outfit,personality=ethereal × pose=arms-open-wide,personality=energetic
outfit=punk × pose=prayer-pose
build=powerful,outfit=knight × gaze=downcast,personality=fragile
outfit=royal,personality=luxurious × hairstyle=bedhead-hair
ageGroup=elderly,outfit=classical-robe × accessories=stole,personality=fashionable
personality=commanding,expression=serious × faceFeatures=glasses × outfit=cardigan
outfit=desert-mage-outfit × background=rainy-alley-2,lighting=rain-effect
outfit=futuristic-suit-2 × pose=hands-politely-placed-together,personality=refined
hairColors=black,personality=cool × expression=shy-smile
`;

const parseSegment = (source: string): GapBlueprintSegment => {
  const fields: LockKey[] = [];
  const assignments: GapBlueprintAssignment[] = [];
  let adultOnly = false;

  for (const token of source.split(',').map((value) => value.trim()).filter(Boolean)) {
    if (token === '!adult') {
      adultOnly = true;
      continue;
    }
    const [rawField, optionId] = token.split('=');
    const field = rawField as LockKey;
    if (!fields.includes(field)) fields.push(field);
    if (optionId) assignments.push({ field, optionId });
  }

  return { fields, assignments, adultOnly };
};

export const gapBlueprints: GapBlueprint[] = raw
  .trim()
  .split('\n')
  .map((line, index) => ({
    id: `gap-${String(index + 1).padStart(2, '0')}`,
    segments: line.split('×').map((segment) => parseSegment(segment.trim())),
  }));

export const gapBlueprintById = new Map(gapBlueprints.map((blueprint) => [blueprint.id, blueprint]));
