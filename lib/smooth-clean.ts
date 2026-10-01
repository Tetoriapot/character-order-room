import { smoothCleanAvoidChoices, smoothCleanControls } from '@/data/smooth-clean-options';
import type { SmoothCleanControls, SmoothCleanSettings, StylePreset } from './style-pack-types';

export function normalizeSmoothClean(value: unknown): SmoothCleanSettings | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const result: Partial<Record<keyof SmoothCleanControls, string>> = {};
  for (const control of smoothCleanControls) {
    if (control.options.some((option) => option.id === source[control.key])) result[control.key] = String(source[control.key]);
  }
  const avoidIds = smoothCleanAvoidChoices.filter((item) => Array.isArray(source.avoidIds) && source.avoidIds.includes(item.id)).map((item) => item.id);
  return Object.keys(result).length || avoidIds.length
    ? { ...result as SmoothCleanControls, ...(avoidIds.length ? { avoidIds } : {}) } : undefined;
}

export function smoothCleanSelections(settings?: SmoothCleanSettings) {
  return smoothCleanControls.flatMap((control) => {
    const option = control.options.find((item) => item.id === settings?.[control.key]);
    return option ? [{ control, option }] : [];
  });
}

// Derived separately from the five manually selected helpers. Never truncate
// automatic rules or write them back into the user's manual selections.
export function automaticSmoothCleanHelpers(settings?: SmoothCleanSettings): string[] {
  return [...new Set(smoothCleanSelections(settings).flatMap(({ option }) => option.helperIds))];
}

export function smoothCleanAvoids(settings?: SmoothCleanSettings) {
  return smoothCleanAvoidChoices.filter((item) => settings?.avoidIds?.includes(item.id));
}

export function smoothCleanSummary(settings: SmoothCleanSettings | undefined, language: 'ja' | 'en') {
  return smoothCleanSelections(settings).map(({ control, option }) => `${control[language]}: ${option[language]}`).join(language === 'ja' ? '、' : '; ');
}

export function buildStylePrompt(style: StylePreset, settings?: SmoothCleanSettings) {
  const adjustments = smoothCleanSelections(settings);
  if (!adjustments.length) return style.stylePrompt;
  return `${style.stylePrompt}. Rendering controls (override conflicting preset detail directions): ${adjustments.map(({ option }) => option.prompt).join(', ')}. Preserve the specified character identities, hair colors, and outfit choices; refine rendering rather than replacing them`;
}
