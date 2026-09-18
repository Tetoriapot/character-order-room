import type { CharacterSnapshot, HistoryEntry, SavedPreset, StudioPreferences } from './character-types';
import type { NoteWorkspace, PersonNoteWorkspaces } from './inference/note-workspace';
import { parseNoteWorkspace, parsePersonNotes } from './inference/note-workspace';
import { migrateSnapshot, parseHistory, parsePresets, parseStudioImport, parseStudioPreferences } from './storage';

export const WORKSPACE_KEY = 'character-order-maker:workspace:v2';
export const RECOVERY_KEY = 'character-order-maker:before-import:v2';
export const MAX_BACKUP_BYTES = 10_000_000;

export type StudioWorkspace = {
  current: CharacterSnapshot;
  presets: SavedPreset[];
  history: HistoryEntry[];
  randomHistory: HistoryEntry[];
  preferences: StudioPreferences;
  noteWorkspace: NoteWorkspace;
  personNotes?: PersonNoteWorkspaces;
  editorMode: 'form' | 'note';
};

export type StudioImport = {
  current: CharacterSnapshot;
  presets: SavedPreset[];
  workspace?: StudioWorkspace;
};

export function exportStudioBackup(workspace: StudioWorkspace): string {
  return JSON.stringify({ format: 'character-order-room', version: 2, exportedAt: new Date().toISOString(), ...workspace });
}

export function parseStudioBackup(raw: string | null): StudioWorkspace | null {
  if (!raw || new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.format !== 'character-order-room' || value.version !== 2
      || !Array.isArray(value.presets) || !Array.isArray(value.history) || !Array.isArray(value.randomHistory)
      || !value.preferences || typeof value.preferences !== 'object') return null;
    const current = migrateSnapshot(value.current);
    const noteWorkspace = parseNoteWorkspace(value.noteWorkspace);
    if (!current || !noteWorkspace) return null;
    return {
      current,
      presets: parsePresets(JSON.stringify(value.presets)),
      history: parseHistory(JSON.stringify(value.history)),
      randomHistory: parseHistory(JSON.stringify(value.randomHistory)),
      preferences: parseStudioPreferences(JSON.stringify(value.preferences)),
      noteWorkspace,
      ...(value.personNotes ? { personNotes: parsePersonNotes(value.personNotes) } : {}),
      editorMode: value.editorMode === 'note' ? 'note' : 'form',
    };
  } catch { return null; }
}

export function parseAnyStudioImport(raw: string): StudioImport | null {
  const workspace = parseStudioBackup(raw);
  if (workspace) return { current: workspace.current, presets: workspace.presets, workspace };
  return parseStudioImport(raw);
}
