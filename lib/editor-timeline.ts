import type { CharacterSnapshot } from './character-types';

export type EditorRevision = {
  snapshot: CharacterSnapshot;
  action: string;
  coalesceKey?: string;
  committedAt: number;
};

export type EditorTimeline = {
  past: EditorRevision[];
  present: EditorRevision;
  future: EditorRevision[];
};

const MAX_REVISIONS = 80;
const COALESCE_WINDOW_MS = 700;

const cloneSnapshot = (snapshot: CharacterSnapshot): CharacterSnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as CharacterSnapshot;

const sameSnapshot = (left: CharacterSnapshot, right: CharacterSnapshot) =>
  JSON.stringify(left) === JSON.stringify(right);

export function createEditorTimeline(
  snapshot: CharacterSnapshot,
  action = 'initial',
  committedAt = Date.now(),
): EditorTimeline {
  return {
    past: [],
    present: { snapshot: cloneSnapshot(snapshot), action, committedAt },
    future: [],
  };
}

export function commitEditorTimeline(
  timeline: EditorTimeline,
  snapshot: CharacterSnapshot,
  metadata: { action: string; coalesceKey?: string; committedAt?: number },
): EditorTimeline {
  if (sameSnapshot(timeline.present.snapshot, snapshot)) return timeline;
  const committedAt = metadata.committedAt ?? Date.now();
  const shouldCoalesce = Boolean(
    metadata.coalesceKey
      && timeline.present.coalesceKey === metadata.coalesceKey
      && committedAt - timeline.present.committedAt <= COALESCE_WINDOW_MS,
  );
  return {
    past: shouldCoalesce
      ? timeline.past
      : [...timeline.past, timeline.present].slice(-MAX_REVISIONS),
    present: {
      snapshot: cloneSnapshot(snapshot),
      action: metadata.action,
      coalesceKey: metadata.coalesceKey,
      committedAt,
    },
    future: [],
  };
}

export function undoEditorTimeline(timeline: EditorTimeline): EditorTimeline {
  const previous = timeline.past.at(-1);
  if (!previous) return timeline;
  return {
    past: timeline.past.slice(0, -1),
    present: previous,
    future: [timeline.present, ...timeline.future].slice(0, MAX_REVISIONS),
  };
}

export function redoEditorTimeline(timeline: EditorTimeline): EditorTimeline {
  const next = timeline.future[0];
  if (!next) return timeline;
  return {
    past: [...timeline.past, timeline.present].slice(-MAX_REVISIONS),
    present: next,
    future: timeline.future.slice(1),
  };
}

export function replaceEditorTimeline(
  snapshot: CharacterSnapshot,
  action = 'loaded',
  committedAt = Date.now(),
): EditorTimeline {
  return createEditorTimeline(snapshot, action, committedAt);
}
