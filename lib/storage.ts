import { defaultDraft } from '@/data/presets';
import { normalizeAgeInput } from './age-utils';
import { normalizeStylePack } from './style-pack';
import { isGuidedSectionId } from './guided-builder';
import type {
  CharacterDraft,
  CharacterSnapshot,
  GeneratedGapState,
  HistoryEntry,
  LockKey,
  SavedPreset,
  StudioPreferences,
} from './character-types';

export const STORAGE_KEYS = {
  current: 'character-order-maker:current:v1',
  presets: 'character-order-maker:presets:v1',
  history: 'character-order-maker:history:v1',
  randomHistory: 'character-order-maker:random-history:v1',
  preferences: 'character-order-maker:preferences:v1',
} as const;

export const DEFAULT_STUDIO_PREFERENCES: StudioPreferences = {
  language: 'ja',
  colorMode: 'system',
  simpleMode: false,
  guidedMode: false,
  guidedStep: 'purpose',
  onboardingSeen: false,
  exportProfile: 'generic',
  favoriteChoices: {},
  recentChoices: {},
};

const stringFields: LockKey[] = [
  'purpose', 'style', 'gender', 'ageGroup', 'ageNumber', 'species', 'build', 'skinTone',
  'hairstyle', 'eyeColor', 'eyeShape', 'eyeImpression', 'outfit', 'expression', 'pose',
  'gaze', 'cameraAngle', 'composition', 'aspectRatio', 'background', 'timeOfDay',
];

const arrayFields: LockKey[] = [
  'styleTraits', 'personality', 'hairColors', 'hairEffects', 'faceFeatures', 'outfitColors',
  'outfitDetails', 'accessories', 'lighting', 'negatives',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const lockKeyNames = new Set<string>([...stringFields, ...arrayFields]);
const arrayFieldNames = new Set<LockKey>(arrayFields);

const cleanGapValue = (value: unknown): string | string[] | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return [...value];
  return null;
};

const hydrateGeneratedGap = (value: unknown): GeneratedGapState | undefined => {
  if (!isRecord(value)
    || typeof value.seedId !== 'string'
    || typeof value.labelJa !== 'string'
    || typeof value.labelEn !== 'string') return undefined;
  const changes = Array.isArray(value.changes) ? value.changes.flatMap((item) => {
    if (!isRecord(item) || typeof item.field !== 'string' || !lockKeyNames.has(item.field)) return [];
    const previous = cleanGapValue(item.previous);
    const applied = cleanGapValue(item.applied);
    if (previous === null || applied === null) return [];
    const field = item.field as LockKey;
    if (Array.isArray(previous) !== arrayFieldNames.has(field)
      || Array.isArray(applied) !== arrayFieldNames.has(field)) return [];
    return [{ field, previous, applied }];
  }) : [];
  const segmentIndexes = Array.isArray(value.segmentIndexes)
    ? value.segmentIndexes.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 0)
    : [];
  return {
    seedId: value.seedId,
    labelJa: value.labelJa,
    labelEn: value.labelEn,
    segmentIndexes,
    changes,
  };
};

const cleanStringArray = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
  : [];

export function hydrateDraft(value: unknown): CharacterDraft {
  const source = isRecord(value) ? value : {};
  const hydrated: CharacterDraft = {
    ...defaultDraft,
    styleTraits: [...defaultDraft.styleTraits],
    personality: [...defaultDraft.personality],
    hairColors: [...defaultDraft.hairColors],
    hairEffects: [...defaultDraft.hairEffects],
    faceFeatures: [...defaultDraft.faceFeatures],
    outfitColors: [...defaultDraft.outfitColors],
    outfitDetails: [...defaultDraft.outfitDetails],
    accessories: [...defaultDraft.accessories],
    lighting: [...defaultDraft.lighting],
    negatives: [...defaultDraft.negatives],
    custom: { ...defaultDraft.custom },
  };

  for (const field of stringFields) {
    if (typeof source[field] === 'string') {
      (hydrated as unknown as Record<string, unknown>)[field] = source[field];
    }
  }
  for (const field of arrayFields) {
    if (Array.isArray(source[field])) {
      (hydrated as unknown as Record<string, unknown>)[field] = cleanStringArray(source[field]);
    }
  }
  if (isRecord(source.custom)) {
    hydrated.custom = Object.fromEntries(
      Object.entries({ ...defaultDraft.custom, ...source.custom })
        .filter(([, item]) => typeof item === 'string'),
    ) as Record<string, string>;
  }
  const stylePack = normalizeStylePack(source.stylePack);
  if (stylePack) hydrated.stylePack = stylePack;
  const generatedGap = hydrateGeneratedGap(source.generatedGap);
  const legacyGapJa = hydrated.custom.gap?.trim().replace(/^ギャップ要素[：:]\s*/, '') ?? '';
  const legacyGapEn = hydrated.custom.gapEn?.trim().replace(/^Visual contrast:\s*/i, '') ?? '';
  if (generatedGap) {
    hydrated.generatedGap = generatedGap;
  } else if (legacyGapJa) {
    hydrated.generatedGap = {
      seedId: 'legacy',
      labelJa: legacyGapJa,
      labelEn: legacyGapEn,
      segmentIndexes: [],
      changes: [],
    };
  }
  delete hydrated.custom.gap;
  delete hydrated.custom.gapEn;
  hydrated.ageNumber = normalizeAgeInput(hydrated.ageNumber);
  return hydrated;
}

export function migrateSnapshot(value: unknown): CharacterSnapshot | null {
  if (!isRecord(value) || !isRecord(value.draft)) return null;
  const locks: Partial<Record<LockKey, boolean>> = {};
  if (isRecord(value.locks)) {
    for (const [key, locked] of Object.entries(value.locks)) {
      if (typeof locked === 'boolean' && key in defaultDraft && key !== 'custom') {
        locks[key as LockKey] = locked;
      }
    }
  }
  return { draft: hydrateDraft(value.draft), locks };
}

export function parseSnapshot(raw: string | null): CharacterSnapshot | null {
  if (!raw) return null;
  try {
    return migrateSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

const parseJsonArray = (raw: string | null): unknown[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function parsePresets(raw: string | null): SavedPreset[] {
  return parseJsonArray(raw).flatMap((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return [];
    const snapshot = migrateSnapshot(value.snapshot);
    if (!snapshot) return [];
    const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString();
    return [{
      id: value.id,
      name: value.name,
      createdAt,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
      snapshot,
      builtIn: value.builtIn === true,
      pinned: value.pinned === true,
      useCount: typeof value.useCount === 'number' && Number.isFinite(value.useCount) ? Math.max(0, Math.floor(value.useCount)) : 0,
      lastUsedAt: typeof value.lastUsedAt === 'string' ? value.lastUsedAt : undefined,
      parentId: typeof value.parentId === 'string' ? value.parentId : undefined,
      note: typeof value.note === 'string' ? value.note.slice(0, 240) : undefined,
    }];
  });
}

export function parseHistory(raw: string | null): HistoryEntry[] {
  return parseJsonArray(raw).flatMap((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') return [];
    const snapshot = migrateSnapshot(value.snapshot);
    if (!snapshot) return [];
    const source = ['random', 'gap', 'copy', 'load', 'save', 'manual', 'batch'].includes(String(value.source))
      ? value.source as HistoryEntry['source']
      : undefined;
    return [{
      id: value.id,
      label: value.label,
      name: typeof value.name === 'string' ? value.name.slice(0, 80) : undefined,
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
      snapshot,
      source,
      pinned: value.pinned === true,
    }];
  }).slice(0, 50);
}

export function appendHistory(current: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const fingerprint = JSON.stringify(entry.snapshot);
  const existing = current.find((item) => JSON.stringify(item.snapshot) === fingerprint);
  const combined = [
    existing ? {
      ...entry,
      name: entry.name ?? existing.name,
      pinned: entry.pinned ?? existing.pinned,
    } : entry,
    ...current.filter((item) => JSON.stringify(item.snapshot) !== fingerprint),
  ];
  const pinned = combined.filter((item) => item.pinned);
  const unpinned = combined.filter((item) => !item.pinned).slice(0, Math.max(0, 50 - pinned.length));
  return [...pinned, ...unpinned].slice(0, 50);
}

export function parseStudioPreferences(raw: string | null): StudioPreferences {
  if (!raw) return { ...DEFAULT_STUDIO_PREFERENCES, favoriteChoices: {}, recentChoices: {} };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return { ...DEFAULT_STUDIO_PREFERENCES, favoriteChoices: {}, recentChoices: {} };
    const cleanChoiceMap = (candidate: unknown, limit = Number.POSITIVE_INFINITY) => isRecord(candidate)
      ? Object.fromEntries(Object.entries(candidate).flatMap(([field, ids]) =>
        Array.isArray(ids) ? [[field, cleanStringArray(ids).slice(0, limit)]] : []))
      : {};
    return {
      language: value.language === 'en' ? 'en' : 'ja',
      colorMode: ['light', 'dark', 'system'].includes(String(value.colorMode))
        ? value.colorMode as StudioPreferences['colorMode'] : 'system',
      simpleMode: value.simpleMode === true,
      guidedMode: value.guidedMode === true,
      guidedStep: isGuidedSectionId(value.guidedStep) ? value.guidedStep : 'purpose',
      onboardingSeen: value.onboardingSeen === true,
      exportProfile: ['generic', 'stable-diffusion', 'midjourney', 'novelai', 'human-brief'].includes(String(value.exportProfile))
        ? value.exportProfile as StudioPreferences['exportProfile'] : 'generic',
      favoriteChoices: cleanChoiceMap(value.favoriteChoices),
      recentChoices: cleanChoiceMap(value.recentChoices, 30),
    };
  } catch {
    return { ...DEFAULT_STUDIO_PREFERENCES, favoriteChoices: {}, recentChoices: {} };
  }
}

type PortableStudioData = {
  format: 'character-order-room';
  version: 1;
  exportedAt: string;
  current: CharacterSnapshot;
  presets: SavedPreset[];
};

export function exportStudioData(current: CharacterSnapshot, presets: SavedPreset[]): string {
  const payload: PortableStudioData = {
    format: 'character-order-room',
    version: 1,
    exportedAt: new Date().toISOString(),
    current,
    presets,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseStudioImport(raw: string): { current: CharacterSnapshot; presets: SavedPreset[] } | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    const legacySnapshot = migrateSnapshot(value);
    if (legacySnapshot) return { current: legacySnapshot, presets: [] };
    if (!isRecord(value) || value.format !== 'character-order-room' || value.version !== 1) return null;
    const current = migrateSnapshot(value.current);
    if (!current) return null;
    const presets = parsePresets(JSON.stringify(Array.isArray(value.presets) ? value.presets : []));
    return { current, presets };
  } catch {
    return null;
  }
}

export function encodeShareSnapshot(snapshot: CharacterSnapshot): string {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeShareSnapshot(value: string): CharacterSnapshot | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return migrateSnapshot(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
