import { purposeRecommendations } from '@/data/presets';
import type { CharacterDraft, LockKey } from './character-types';
import { clearGeneratedGap } from './random-engine';

export function applyPurposeRecommendation(
  draft: CharacterDraft,
  locks: Partial<Record<LockKey, boolean>>,
  purposeId: string,
): CharacterDraft {
  const recommendation = purposeRecommendations[purposeId] ?? {};
  const next = { ...clearGeneratedGap(draft, locks), purpose: purposeId } as CharacterDraft;
  for (const [key, value] of Object.entries(recommendation)) {
    const field = key as LockKey;
    if (locks[field] || value === undefined) continue;
    (next as unknown as Record<string, unknown>)[field] = Array.isArray(value) ? [...value] : value;
  }
  return next;
}
