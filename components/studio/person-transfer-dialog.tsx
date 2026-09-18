'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PERSON_CUSTOM_KEYS, PERSON_FIELDS } from '@/lib/character-cast';
import { OUTFIT_FIELDS, personName, transferPersonFields } from '@/lib/cast-workflow';
import { customFieldLabels, diffSnapshots, fieldLabels } from '@/lib/character-insights';
import type { CharacterSnapshot, LockKey, UiLanguage } from '@/lib/character-types';
import { ChangeList } from './change-list';

export function PersonTransferDialog({ source, target, language, title, outfitOnly = false, onClose, onApply }: {
  source: CharacterSnapshot; target: CharacterSnapshot; language: UiLanguage; title: string; outfitOnly?: boolean;
  onClose: () => void; onApply: (next: CharacterSnapshot) => void;
}) {
  const [fields, setFields] = useState<LockKey[]>(outfitOnly ? OUTFIT_FIELDS : PERSON_FIELDS);
  const [custom, setCustom] = useState<string[]>(outfitOnly ? ['outfit'] : PERSON_CUSTOM_KEYS);
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const next = useMemo(() => transferPersonFields(target, source, fields, custom), [target, source, fields, custom]);
  const changes = diffSnapshots(target, next);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{tr(`反映先：${personName(target, language)}。ロック済み項目、画風・背景・他の人物・識別名・配置・設定メモは変更しません。安全上の関連調整も変更一覧に表示します。`, `Apply to ${personName(target, language)}. Locked fields, shared style/scene, other people, labels, placement, and notes are preserved. Related safety adjustments appear in the preview.`)}</DialogDescription></DialogHeader>
      <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => { setFields(PERSON_FIELDS); setCustom(PERSON_CUSTOM_KEYS); }}>{tr('人物全体', 'Whole person')}</Button>
          <Button variant="outline" className="min-h-11" onClick={() => { setFields(OUTFIT_FIELDS); setCustom(['outfit']); }}>{tr('衣装だけ', 'Outfit only')}</Button>
          <Button variant="ghost" className="min-h-11" onClick={() => { setFields([]); setCustom([]); }}>{tr('すべて外す', 'Deselect all')}</Button>
        </div>
        <details><summary className="min-h-11 cursor-pointer text-sm font-semibold">{tr('コピーする項目を個別に選ぶ', 'Choose individual fields')}</summary>
          <div className="grid gap-2 sm:grid-cols-2">{PERSON_FIELDS.map((field) => <label key={field} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={fields.includes(field)} disabled={Boolean(target.locks[field])} onCheckedChange={(checked) => setFields((current) => checked ? [...current, field] : current.filter((key) => key !== field))} />{fieldLabels[field][language]}{target.locks[field] ? tr('（ロック中）', ' (locked)') : ''}</label>)}
            {PERSON_CUSTOM_KEYS.map((key) => <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={custom.includes(key)} onCheckedChange={(checked) => setCustom((current) => checked ? [...current, key] : current.filter((item) => item !== key))} />{customFieldLabels[key]?.[language] ?? key}</label>)}
          </div>
        </details>
        <p className="text-sm font-bold">{tr(`変更プレビュー：${changes.length}件`, `Change preview: ${changes.length}`)}</p><ChangeList changes={changes} language={language} />
      </div>
      <DialogFooter><Button variant="outline" className="min-h-11" onClick={onClose}>{tr('キャンセル', 'Cancel')}</Button><Button className="min-h-11" disabled={!changes.length} onClick={() => { onApply(next); onClose(); }}>{tr('確認した項目を反映', 'Apply reviewed fields')}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
