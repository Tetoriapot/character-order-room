export type ShortcutAction = 'undo' | 'redo' | 'random' | 'gap' | 'copy' | 'help';

export function getShortcutAction(input: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  editable?: boolean;
  isComposing?: boolean;
  repeat?: boolean;
  modalOpen?: boolean;
}): ShortcutAction | null {
  if (input.editable || input.isComposing || input.repeat || input.modalOpen) return null;
  const modifier = Boolean(input.ctrlKey || input.metaKey);
  const key = input.key.toLowerCase();
  if (!modifier && !input.altKey && input.key === '?') return 'help';
  if (input.altKey && !modifier && key === 'c') return 'copy';
  if (!modifier || input.altKey) return null;
  if (key === 'enter') return input.shiftKey ? 'gap' : 'random';
  if (key === 'z') return input.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !input.shiftKey) return 'redo';
  return null;
}
