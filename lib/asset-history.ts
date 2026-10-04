import type { AssetDraft } from '@/data/asset-options';
import { parseAssetDraft, serializeAssetDraft } from './asset-prompt';

export const ASSET_HISTORY_KEY = 'asset-order-room:history:v1';
export const ASSET_HISTORY_LIMIT = 50;
export type AssetHistoryEntry = {
  id: string;
  createdAt: number;
  action: string;
  draft: AssetDraft;
};

/** Keep the state before an edit, grouping a burst of typing into one undo point. */
export function recordAssetHistory(
  entries: AssetHistoryEntry[],
  before: AssetDraft,
  after: AssetDraft,
  action: string,
  now = Date.now(),
  id = crypto.randomUUID(),
): AssetHistoryEntry[] {
  if (serializeAssetDraft(before) === serializeAssetDraft(after))
    return entries;
  const latest = entries[0];
  if (
    action.startsWith('edit:') &&
    latest?.action === action &&
    now - latest.createdAt < 1000
  )
    return entries;
  return [
    { id, createdAt: now, action, draft: structuredClone(before) },
    ...entries,
  ].slice(0, ASSET_HISTORY_LIMIT);
}

export function parseAssetHistory(raw: string): AssetHistoryEntry[] {
  if (raw.length > 5_000_000) throw new Error('History is too large');
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || data.length > ASSET_HISTORY_LIMIT)
    throw new Error('Invalid history');
  return data.map((entry: unknown) => {
    if (
      !entry ||
      typeof entry !== 'object' ||
      !('id' in entry) ||
      !('createdAt' in entry) ||
      !('action' in entry) ||
      !('draft' in entry) ||
      typeof entry.id !== 'string' ||
      entry.id.length > 100 ||
      typeof entry.action !== 'string' ||
      entry.action.length > 100 ||
      typeof entry.createdAt !== 'number' ||
      !Number.isFinite(entry.createdAt) ||
      entry.createdAt < 0 ||
      entry.createdAt > 8.64e15
    )
      throw new Error('Invalid history item');
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      action: entry.action,
      draft: parseAssetDraft(
        JSON.stringify({
          app: 'asset-order-room',
          version: 1,
          draft: entry.draft,
        }),
      ),
    };
  });
}
