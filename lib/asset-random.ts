import {
  assetChoices,
  assetSubjects,
  type AssetDraft,
  type AssetRandomField,
} from '@/data/asset-options';
import { effectCatalog, effectCategories } from '@/data/asset-effect-catalog';
import { advancedAssetStyles } from '@/data/asset-style-catalog';

export function assetRandomFields(draft: AssetDraft): AssetRandomField[] {
  const fields: AssetRandomField[] = [
    'subject',
    'style',
    'palette',
    'background',
    'lighting',
    'camera',
    'framing',
    'ratio',
  ];
  if (draft.category === 'effect') fields.push('effectShape', 'density');
  if (draft.category === 'object') fields.push('material', 'condition');
  if (draft.format !== 'still' || draft.category === 'motion')
    fields.push('motion', 'direction', 'speed');
  if (draft.format !== 'still') {
    fields.push('timing', 'fps', 'loop');
    if (draft.format === 'video') fields.push('cameraMotion', 'duration');
    else fields.push('frameCount');
  }
  return fields;
}

const directionsForMotion: Record<string, string[]> = {
  rotate: ['clockwise', 'counterclockwise'],
  swirl: ['clockwise', 'counterclockwise'],
  'orbit-motion': ['clockwise', 'counterclockwise'],
  'spiral-motion': ['up', 'down', 'clockwise', 'counterclockwise'],
  expand: ['out'],
  converge: ['in'],
  grow: ['up', 'out'],
  fall: ['down', 'diagonal-down'],
  settle: ['down'],
  bounce: ['vertical', 'horizontal'],
  sway: ['horizontal'],
  oscillate: ['vertical', 'horizontal'],
  ripple: ['out'],
  drip: ['down'],
  pour: ['down', 'diagonal-down'],
  inflate: ['out'],
  deflate: ['in'],
  split: ['out'],
  merge: ['in'],
  assemble: ['in'],
  disassemble: ['out'],
  sweep: ['right', 'left', 'up', 'down'],
  scan: ['right', 'left', 'up', 'down'],
  flow: ['right', 'left', 'up', 'down', 'forward', 'backward'],
  pulse: [''],
  flicker: [''],
  glitch: [''],
  morph: [''],
  dissolve: [''],
};

export function randomizeAsset(
  draft: AssetDraft,
  options: {
    field?: AssetRandomField;
    subjectIds?: string[];
    styleIds?: string[];
    random?: () => number;
  } = {},
) {
  const random = options.random ?? Math.random;
  const next = structuredClone(draft);
  const changed: AssetRandomField[] = [];
  const activeFields = assetRandomFields(draft);
  const fields = options.field
    ? activeFields.filter((field) => field === options.field)
    : activeFields;
  const pick = (ids: string[], current: string) => {
    const different = ids.filter((id) => id !== current);
    const pool = different.length ? different : ids;
    const sample = random();
    const index = Math.floor(
      Math.max(0, Math.min(0.999999999, Number.isFinite(sample) ? sample : 0)) *
        pool.length,
    );
    return pool[index] ?? current;
  };
  for (const field of fields) {
    if (draft.randomLocks.includes(field)) continue;
    if (field === 'subject') {
      // Keep the identity tied to the user's description during a full shuffle.
      // An explicit subject-only shuffle is intentional and retains their text.
      if (!options.field && draft.details[draft.category].trim()) continue;
      const pool = assetSubjects[draft.category].filter(
        (item) =>
          item.id !== 'custom' &&
          (!options.subjectIds || options.subjectIds.includes(item.id)),
      );
      const selected = pick(
        pool.map((item) => item.id),
        next.subjects[draft.category],
      );
      if (selected !== next.subjects[draft.category]) {
        next.subjects[draft.category] = selected;
        changed.push(field);
      }
      continue;
    }
    let pool = assetChoices[field].map((item) => item.id);
    const effect =
      draft.category === 'effect'
        ? effectCatalog.find((item) => item.id === next.subjects.effect)
        : undefined;
    const family = effectCategories.find(
      (item) => item.id === effect?.category,
    );
    const recommendations =
      family &&
      (
        {
          effectShape: family.shapes,
          motion: family.motions,
          palette: family.palettes,
          lighting: family.lights,
        } as Partial<Record<AssetRandomField, string[]>>
      )[field];
    if (recommendations)
      pool = pool.filter((id) => recommendations.includes(id));
    if (field === 'style') {
      if (options.styleIds !== undefined)
        pool = pool.filter((id) => options.styleIds!.includes(id));
      else if (family?.usage)
        pool = pool.filter((id) =>
          advancedAssetStyles.some(
            (style) => style.id === id && style.usage === family.usage,
          ),
        );
    }
    const monochrome = advancedAssetStyles.find(
      (style) => style.id === next.style,
    )?.monochrome;
    if (monochrome && field === 'palette') pool = ['mono'];
    if (monochrome && field === 'lighting') {
      const inkLighting = pool.filter((id) =>
        ['unlit', 'dramatic'].includes(id),
      );
      pool = inkLighting.length ? inkLighting : ['unlit', 'dramatic'];
    }
    if (field === 'camera' && family?.usage === 'manga')
      pool = ['front', 'orthographic'];
    if (field === 'framing') {
      const mangaTreatment = monochrome || family?.usage === 'manga';
      pool = pool.filter((id) =>
        mangaTreatment ? !id.startsWith('rpg-') : !id.startsWith('manga-'),
      );
    }
    if (field === 'background') {
      if (monochrome || family?.usage === 'manga')
        pool = pool.filter(
          (id) =>
            ['transparent', 'white', 'black'].includes(id) ||
            id.startsWith('manga-'),
        );
      else pool = pool.filter((id) => !id.startsWith('manga-'));
    }
    // Match directions to the movement when possible, while preserving locks.
    // A blank direction avoids arbitrary travel for pulses and local distortion.
    if (
      field === 'motion' &&
      draft.randomLocks.includes('direction') &&
      draft.direction
    ) {
      const compatible = pool.filter(
        (id) =>
          !directionsForMotion[id] ||
          directionsForMotion[id].includes(draft.direction),
      );
      if (compatible.length) pool = compatible;
    }
    if (field === 'direction' && directionsForMotion[next.motion])
      pool = directionsForMotion[next.motion].filter(
        (id) => id === '' || pool.includes(id),
      );
    if (field === 'background' && next.palette === 'green')
      pool = pool.filter((id) => id !== 'green');
    if (field === 'framing' && next.exclusions.includes('cropped'))
      pool = pool.filter((id) => id !== 'close');
    const value = pick(pool, next[field]);
    if (value !== next[field]) {
      next[field] = value;
      changed.push(field);
    }
  }
  return { draft: next, changed };
}
