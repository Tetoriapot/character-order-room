import { stylePresets } from '@/data/style-presets';
import { antiAiBlocks } from '@/data/anti-ai-blocks';
import { styleCategories, styleCompatibility } from '@/data/style-categories';
import { promptBlockNames, type PromptBlocks, type PromptBlockName, type StyleCategory, type StylePackSelection } from './style-pack-types';

export const MAX_ANTI_AI = 5;
export const emptyStylePack = (): StylePackSelection => ({ presetId: '', antiAiIds: [], excludedBlocks: [] });
export const findStylePreset = (id?: string) => stylePresets.find((preset) => preset.id === id);
export const findAntiAiBlock = (id: string) => antiAiBlocks.find((block) => block.id === id);

const exclusiveGroups = [
  ['line_irregularity_light', 'line_irregularity_strong'],
  ['subtle_paper_texture', 'rough_paper_grain'],
  ['registration_shift_light', 'registration_shift_print'],
  ['limited_palette_5', 'limited_palette_8'],
];

export const antiAiReplaces = (id: string, previous: string) => id === previous
  || exclusiveGroups.some((group) => group.includes(id) && group.includes(previous));

export function addAntiAi(ids: string[], id: string): string[] {
  if (!findAntiAiBlock(id)) return ids;
  const remaining = ids.filter((previous) => !antiAiReplaces(id, previous));
  return remaining.length < MAX_ANTI_AI ? [...remaining, id] : ids;
}

export function normalizeStylePack(value: unknown): StylePackSelection | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  return {
    presetId: typeof source.presetId === 'string' && findStylePreset(source.presetId) ? source.presetId : '',
    antiAiIds: Array.isArray(source.antiAiIds)
      ? source.antiAiIds.reduce<string[]>((ids, id) => typeof id === 'string' ? addAntiAi(ids, id) : ids, []) : [],
    excludedBlocks: promptBlockNames.filter((name) => Array.isArray(source.excludedBlocks) && source.excludedBlocks.includes(name)),
  };
}

export const recommendAntiAiBlocks = (category: StyleCategory) => styleCompatibility[category]
  .slice(0, 3).flatMap((id) => { const block = findAntiAiBlock(id); return block ? [block] : []; });

export function filterStylePresets(query: string, category: StyleCategory | 'all' = 'all', favorites?: string[]) {
  const terms = query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  return stylePresets.filter((preset) => {
    if (category !== 'all' && preset.category !== category) return false;
    if (favorites && !favorites.includes(preset.id)) return false;
    const categoryName = styleCategories.find((item) => item.id === preset.category)?.nameJa ?? '';
    const text = [preset.nameJa, preset.nameEn, preset.category, categoryName, ...preset.tags, ...preset.useCases].join(' ').normalize('NFKC').toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function pickRandomStyle(category: StyleCategory | 'all', currentId?: string, random = Math.random) {
  const candidates = stylePresets.filter((preset) => (category === 'all' || preset.category === category) && preset.id !== currentId);
  const weights = candidates.map((preset) => preset.weight * (styleCategories.find((item) => item.id === preset.category)?.weight ?? 1));
  let cursor = Math.min(0.999999999, Math.max(0, random())) * weights.reduce((sum, weight) => sum + weight, 0);
  return candidates.find((_, index) => { cursor -= weights[index]; return cursor < 0; }) ?? candidates[0];
}

export function buildAntiAiBlock(ids: string[]) {
  const selected = normalizeStylePack({ antiAiIds: ids })?.antiAiIds ?? [];
  return [...new Set(selected.flatMap((id) => findAntiAiBlock(id)?.antiAiPrompt.split(',').map((part) => part.trim()).filter(Boolean) ?? []))].join(', ');
}

export const defaultStyleAvoid = ['no text', 'no logo', 'no watermark', 'avoid photorealism', 'avoid cluttered background', 'avoid random decorative props'];
export const defaultStyleAvoidJa = ['文字なし', 'ロゴなし', '透かしなし', '写実的な写真表現を避ける', '背景を過密にしない', '無関係な装飾小物を加えない'];

export function stylePackWarnings(selection?: StylePackSelection) {
  const style = findStylePreset(selection?.presetId);
  if (!style || !selection) return [];
  const warnings: { ja: string; en: string }[] = [];
  const has = (id: string) => selection.antiAiIds.includes(id);
  if (selection.antiAiIds.length > 3) warnings.push({ ja: '補助が4件以上です。まず1〜3件で試すと画風を保ちやすくなります。', en: 'More than 3 helpers selected. Start with 1–3 to preserve the style.' });
  if (style.category === 'anime_webtoon' && has('registration_shift_print')) warnings.push({ ja: '強い版ズレはアニメの線を崩す場合があります。', en: 'Strong registration shifts can disrupt anime linework.' });
  if (style.category === 'education_diagram' && has('human_proportion_variance')) warnings.push({ ja: '比率の揺らぎは教材・図解の正確さに影響する場合があります。', en: 'Proportion variation may reduce diagram accuracy.' });
  if (style.id === 'glossy_anime' && (has('matte_finish') || has('reduced_polish'))) warnings.push({ ja: 'マット化・整いすぎの抑制により、光沢のある画風が変わる場合があります。', en: 'Matte / reduced polish helpers may change the glossy finish.' });
  return warnings;
}

export function includedPromptBlocks(blocks: PromptBlocks, excluded: PromptBlockName[] = []) {
  return Object.fromEntries(promptBlockNames.filter((name) => !excluded.includes(name) && blocks[name].trim()).map((name) => [name, blocks[name]]));
}

export function formatPromptBlocks(blocks: PromptBlocks, excluded: PromptBlockName[] = [], mode: 'formatted' | 'line' | 'json' = 'formatted') {
  const included = includedPromptBlocks(blocks, excluded);
  const entries = Object.entries(included);
  if (!entries.length) return '';
  if (mode === 'json') return JSON.stringify(included, null, 2);
  if (mode === 'line') return entries.map(([name, value]) => `${name}: ${value.replace(/\s+/g, ' ').trim()}`).join(' / ');
  return entries.map(([name, value]) => `[${name}]\n${value}`).join('\n\n');
}
