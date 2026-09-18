import { findChoice } from '@/data/options';
import { inferenceDecisionKey } from './types';
import type { InferenceDecision, InferenceLevel, InferenceMergeMode, InferenceResult } from './types';
import { validateInferenceResult } from './validate-inference-result';

export type NoteWorkspace = {
  note: string;
  level: InferenceLevel;
  result: InferenceResult | null;
  decisions: Record<string, InferenceDecision>;
  mergeMode: InferenceMergeMode;
};

export const createEmptyNoteWorkspace = (): NoteWorkspace => ({
  note: '', level: 'standard', result: null, decisions: {}, mergeMode: 'overwrite',
});

export function parseNoteWorkspace(value: unknown): NoteWorkspace | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (typeof source.note !== 'string' || source.note.length > 5000) return null;
  const level = ['strict', 'standard', 'rich'].includes(String(source.level)) ? source.level as InferenceLevel : 'standard';
  const mergeMode = ['overwrite', 'append', 'skip'].includes(String(source.mergeMode)) ? source.mergeMode as InferenceMergeMode : 'overwrite';
  const rawResult = source.result as Partial<InferenceResult> | null;
  // Never restore candidates generated from a different revision of the note.
  const result = rawResult && rawResult.rawText === source.note && rawResult.level === level
    ? validateInferenceResult(rawResult, { text: source.note, level }) : null;
  const saved = source.decisions && typeof source.decisions === 'object'
    ? source.decisions as Record<string, Partial<InferenceDecision>> : {};
  const decisions = Object.fromEntries((result?.values ?? []).map((candidate) => {
    const key = inferenceDecisionKey(candidate);
    const decision = saved[key];
    return [key, {
      valueId: decision && typeof decision.valueId === 'string' && findChoice(candidate.category, decision.valueId)
        ? decision.valueId : candidate.valueId,
      adopted: typeof decision?.adopted === 'boolean' ? decision.adopted : Boolean(candidate.adopted),
      locked: typeof decision?.locked === 'boolean' ? decision.locked : Boolean(candidate.locked),
    }];
  }));
  return { note: source.note, level, result, decisions, mergeMode };
}
