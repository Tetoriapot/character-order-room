import { applyInferenceRules } from './apply-inference-rules';
import { applyCompatibilitySuggestions } from './apply-suggestion-rules';
import { extractExplicitValues } from './extract-explicit-values';
import { matchInferenceAliases } from './match-aliases';
import { normalizeInferenceText } from './normalize-text';
import { resolveInferenceConflicts } from './resolve-conflicts';
import { inferenceFields } from './types';
import type { InferenceEngine, InferenceInput, InferenceResult } from './types';

export function inferFromNote({ text, level }: InferenceInput): InferenceResult {
  const normalizedText = normalizeInferenceText(text);
  if (!normalizedText) {
    return { rawText: text, normalizedText, level, values: [], warnings: ['設定メモを入力してください。'] };
  }

  const aliasResult = matchInferenceAliases(normalizedText, level);
  const explicitResult = extractExplicitValues(normalizedText, level, aliasResult.values);
  const directlyRead = [...aliasResult.values, ...explicitResult.values];
  const directResolved = resolveInferenceConflicts(
    directlyRead,
    level,
    [...aliasResult.warnings, ...explicitResult.warnings],
  );
  const directSeeds = directResolved.values.filter((value) => value.adopted);
  const inferred = applyInferenceRules(directSeeds, level);
  const suggestionPasses = level === 'rich' ? 3 : 1;
  const suggestions = [] as typeof inferred;
  let suggestionSeeds = [...directSeeds, ...inferred];
  for (let pass = 0; pass < suggestionPasses; pass += 1) {
    const generated = applyCompatibilitySuggestions(suggestionSeeds, level).filter((candidate) =>
      !suggestionSeeds.some((value) => value.category === candidate.category && value.valueId === candidate.valueId),
    );
    if (!generated.length) break;
    suggestions.push(...generated);
    suggestionSeeds = [...suggestionSeeds, ...generated];
  }
  const resolved = resolveInferenceConflicts(
    [...directResolved.values, ...inferred, ...suggestions],
    level,
    directResolved.warnings,
  );

  const warnings = [...resolved.warnings];
  if (!resolved.values.length) {
    warnings.push('現在の辞書で読み取れる表現がありませんでした。言い換えるか、通常入力で設定してください。');
  }

  return { rawText: text, normalizedText, level, values: resolved.values, warnings };
}

export const ruleBasedInferenceEngine: InferenceEngine = {
  id: 'rules-v1',
  supportedFields: inferenceFields,
  infer: inferFromNote,
};
