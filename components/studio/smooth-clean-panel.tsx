'use client';

import { useId, useState } from 'react';
import { smoothCleanAvoidChoices, smoothCleanControls } from '@/data/smooth-clean-options';
import { automaticSmoothCleanHelpers, normalizeSmoothClean } from '@/lib/smooth-clean';
import { findAntiAiBlock } from '@/lib/style-pack';
import type { SmoothCleanSettings } from '@/lib/style-pack-types';
import type { UiLanguage } from '@/lib/character-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function SmoothCleanPanel({ value, language, initiallyOpen, onChange }: {
  value?: SmoothCleanSettings; language: UiLanguage; initiallyOpen: boolean;
  onChange: (settings: SmoothCleanSettings | undefined) => void;
}) {
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const id = useId();
  const [open, setOpen] = useState(initiallyOpen);
  const automatic = automaticSmoothCleanHelpers(value);
  return <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="border-b border-border pb-3">
    <summary className="py-3 text-sm font-semibold">{tr('髪・装飾・塗りを調整', 'Refine hair, ornament and finish')}{value && <span className="ml-2 text-xs font-normal text-muted-foreground">{tr('設定あり', 'Customized')}</span>}</summary>
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{tr('顔の魅力を保ちながら描き込みを調整します。未指定なら画風の指定を使います。複数人物では全員共通です。', 'Refine detail while preserving facial appeal. Unset controls follow the style preset. These settings apply to everyone in a group.')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {smoothCleanControls.map((control) => <div key={control.key} className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-${control.key}`} className="block text-sm font-semibold">{control[language]}</label>
          <select id={`${id}-${control.key}`} aria-describedby={`${id}-${control.key}-hint`} value={value?.[control.key] ?? ''} onChange={(event) => onChange(normalizeSmoothClean({ ...value, [control.key]: event.target.value }))} className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm">
            <option value="">{tr('未指定（画風に従う）', 'Unset (follow style)')}</option>
            {control.options.map((option) => <option key={option.id} value={option.id}>{option[language]}</option>)}
          </select>
          <p id={`${id}-${control.key}-hint`} className="text-xs leading-relaxed text-muted-foreground">{tr(control.hintJa, control.hintEn)}</p>
        </div>)}
      </div>
      {!!automatic.length && <div className="space-y-2 border-l-2 border-primary/30 pl-3" role="status">
        <p className="text-sm font-semibold">{tr(`調整に連動する自動補助：${automatic.length}件`, `Automatic helpers from controls: ${automatic.length}`)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{automatic.map((helperId) => { const block = findAntiAiBlock(helperId); return block ? tr(block.nameJa, block.nameEn) : ''; }).join(' / ')}</p>
        <p className="text-xs text-muted-foreground">{tr('手動の最大5件とは別枠です。各調整を未指定に戻すと、その自動補助だけ解除します。', 'Separate from the 5 manual helpers. Unset a control to remove its automatic helpers only.')}</p>
      </div>}
      <details className="border-t border-border pt-2">
        <summary className="min-h-11 py-2 text-sm font-semibold">{tr(`避けたい描写（${value?.avoidIds?.length ?? 0}/10）`, `Rendering to avoid (${value?.avoidIds?.length ?? 0}/10)`)}</summary>
        <p className="mb-2 text-xs text-muted-foreground">{tr('選択したものをネガティブ／AVOIDに追加します。', 'Selected items are added to Negative / AVOID.')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {smoothCleanAvoidChoices.map((item) => <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <Checkbox className="shrink-0" checked={value?.avoidIds?.includes(item.id) ?? false} onCheckedChange={(checked) => onChange(normalizeSmoothClean({ ...value, avoidIds: checked ? [...(value?.avoidIds ?? []), item.id] : value?.avoidIds?.filter((selected) => selected !== item.id) }))} />
            <span className="min-w-0">{item[language]}</span>
          </label>)}
        </div>
      </details>
      <Button variant="ghost" disabled={!value} className="min-h-11 max-w-full whitespace-normal rounded-lg" onClick={() => onChange(undefined)}>{tr('この調整と避けたい描写を解除', 'Clear these controls and avoid choices')}</Button>
    </div>
  </details>;
}
