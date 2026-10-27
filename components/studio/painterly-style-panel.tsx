'use client';

import { useId } from 'react';
import { painterlyAvoidChoices, painterlyControls } from '@/data/painterly-options';
import { normalizePainterly, painterlyAvoids } from '@/lib/painterly-style';
import type { PainterlySettings, StylePreset } from '@/lib/style-pack-types';
import type { UiLanguage } from '@/lib/character-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function PainterlyStylePanel({ style, value, language, onChange, onPreview }: {
  style: StylePreset; value?: PainterlySettings; language: UiLanguage;
  onChange: (value: PainterlySettings | undefined) => void; onPreview: () => void;
}) {
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const id = useId();
  if (!style.painterly) return null;
  const selectedAvoids = painterlyAvoids(style, value);
  return <section className="space-y-4 border-b border-border pb-4" aria-label={tr('厚塗りアニメの調整', 'Painterly anime controls')}>
    <div>
      <h4 className="text-sm font-semibold">{tr('厚塗りアニメの調整', 'Painterly anime controls')}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tr('顔は繊細なアニメ調に保ち、髪・衣装・背景に筆跡を残す指定です。人物や服装の入力値は変更しません。複数人物では全員に適用します。', 'Keep refined anime facial features with visible brushwork in hair, clothing and background. Character and outfit inputs are unchanged. Applies to everyone in group mode.')}</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {painterlyControls.map((control) => {
        const fallback = control.options.find((option) => option.id === style.painterly?.defaults[control.key])!;
        return <div key={control.key} className="min-w-0 space-y-1.5">
          <label htmlFor={`${id}-${control.key}`} className="block text-sm font-semibold">{control[language]}</label>
          <select id={`${id}-${control.key}`} aria-describedby={!value?.[control.key] ? `${id}-${control.key}-default` : undefined} value={value?.[control.key] ?? ''} onChange={(event) => onChange(normalizePainterly({ ...value, [control.key]: event.target.value }))} className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm">
            <option value="">{tr('画風の指定（初期値）', 'Style default')}</option>
            {control.options.map((option) => <option key={option.id} value={option.id}>{option[language]}</option>)}
          </select>
          {!value?.[control.key] && <p id={`${id}-${control.key}-default`} className="text-xs leading-relaxed text-muted-foreground">{tr(`現在：${fallback.ja}`, `Current: ${fallback.en}`)}</p>}
        </div>;
      })}
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">{tr('変更した項目は別の厚塗り画風でも保持します。「画風の指定」に戻すと、選択中の画風に従います。背景の明暗はSTEP 8の背景・光と合わせて調整してください。', 'Overrides remain when switching painterly styles. Choose Style default to follow the selected preset. Coordinate background brightness with STEP 8 scene and lighting settings.')}</p>
    <details className="border-t border-border pt-2">
      <summary className="min-h-11 py-2 text-sm font-semibold">{tr(`厚塗り用のネガティブ（${selectedAvoids.length}/${painterlyAvoidChoices.length}）`, `Painterly negatives (${selectedAvoids.length}/${painterlyAvoidChoices.length})`)}</summary>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tr('選択した指定をネガティブ／AVOIDに追加します。共通の禁止事項や自由入力に同じ指定があれば、ここで外しても出力に残ります。', 'Checked items are added to Negative / AVOID. Matching shared exclusions or custom text still apply when unchecked here.')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {painterlyAvoidChoices.map((item) => <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
          <Checkbox className="shrink-0" checked={!value?.excludedAvoidIds?.includes(item.id)} onCheckedChange={(checked) => onChange(normalizePainterly({ ...value, excludedAvoidIds: checked ? value?.excludedAvoidIds?.filter((entry) => entry !== item.id) : [...(value?.excludedAvoidIds ?? []), item.id] }))} />
          <span className="min-w-0">{item[language]}</span>
        </label>)}
      </div>
    </details>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="min-h-11 max-w-full whitespace-normal rounded-lg" onClick={onPreview}>{tr('ブロックで出力を確認', 'Review output in Blocks')}</Button>
      <Button variant="ghost" className="min-h-11 max-w-full whitespace-normal rounded-lg" disabled={!value} onClick={() => onChange(undefined)}>{tr('厚塗り設定を画風の指定に戻す', 'Reset painterly controls to style defaults')}</Button>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">{tr('画像は生成しません。再現性は生成サービスのモデルやLoRAにも左右されます。', 'This tool does not generate images. Results also depend on the generation model and LoRA.')}</p>
  </section>;
}
