import { composePainterlyPrompt, painterlyAvoidChoices, painterlyControls } from '@/data/painterly-options';
import type { PainterlyControls, PainterlySettings, StylePreset } from './style-pack-types';

export function normalizePainterly(value: unknown): PainterlySettings | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const controls: Partial<Record<keyof PainterlyControls, string>> = {};
  for (const control of painterlyControls) {
    if (control.options.some((option) => option.id === source[control.key])) controls[control.key] = String(source[control.key]);
  }
  const excludedAvoidIds = painterlyAvoidChoices.filter((item) => Array.isArray(source.excludedAvoidIds) && source.excludedAvoidIds.includes(item.id)).map((item) => item.id);
  return Object.keys(controls).length || excludedAvoidIds.length ? { ...controls as PainterlyControls, ...(excludedAvoidIds.length ? { excludedAvoidIds } : {}) } : undefined;
}

export function painterlySelections(style: StylePreset, settings?: PainterlySettings) {
  if (!style.painterly) return [];
  const controls = { ...style.painterly.defaults, ...normalizePainterly(settings) };
  return painterlyControls.flatMap((control) => {
    const option = control.options.find((item) => item.id === controls[control.key]);
    return option ? [{ control, option }] : [];
  });
}

export function painterlyStylePrompt(style: StylePreset, settings?: PainterlySettings) {
  if (!style.painterly) return style.stylePrompt;
  return composePainterlyPrompt(style.painterly.basePrompt, { ...style.painterly.defaults, ...normalizePainterly(settings) });
}

export function painterlyAvoids(style?: StylePreset, settings?: PainterlySettings) {
  return style?.painterly ? painterlyAvoidChoices.filter((item) => !settings?.excludedAvoidIds?.includes(item.id)) : [];
}

export function painterlySummary(style: StylePreset | undefined, settings: PainterlySettings | undefined, language: 'ja' | 'en') {
  return style ? painterlySelections(style, settings).map(({ control, option }) => `${control[language]}: ${option[language]}`).join(language === 'ja' ? '、' : '; ') : '';
}
