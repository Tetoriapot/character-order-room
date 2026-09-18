import type { CharacterDraft } from './character-types';
import type { PromptBlocks } from './style-pack-types';
import { generatePrompts, type PromptOutputs } from './prompt-engine';
import { buildAntiAiBlock, findStylePreset, formatPromptBlocks } from './style-pack';

export function buildPromptBlocks(draft: CharacterDraft, outputs?: PromptOutputs): PromptBlocks {
  const style = findStylePreset(draft.stylePack?.presetId);
  if (!style) return { CONTENT: '', STYLE: '', ANTI_AI: '', AVOID: '' };
  // Retain the original style inputs in the draft, but never mix them into CONTENT.
  const content = generatePrompts({ ...draft, style: '', styleTraits: [], stylePack: undefined, custom: { ...draft.custom, style: '' } });
  return {
    CONTENT: content.positiveJa,
    STYLE: style.stylePrompt,
    ANTI_AI: buildAntiAiBlock(draft.stylePack?.antiAiIds ?? []),
    AVOID: (outputs ?? generatePrompts(draft)).negativeEn.replace(/^Constraints:\s*/, ''),
  };
}

export function generateStudioPrompts(draft: CharacterDraft) {
  const outputs = generatePrompts(draft);
  return { ...outputs, blocks: formatPromptBlocks(buildPromptBlocks(draft, outputs), draft.stylePack?.excludedBlocks) };
}
