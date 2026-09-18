'use client';

import { useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CharacterSnapshot, UiLanguage } from '@/lib/character-types';
import { addCastMember, castChoiceLabel, castInteractions, castPositions, castRelationships, MAX_CAST_MEMBERS, removeCastMember, selectCastMember, setCastEnabled, syncCast } from '@/lib/character-cast';

export function CharacterCastPanel({ snapshot, language, onChange }: {
  snapshot: CharacterSnapshot; language: UiLanguage;
  onChange: (next: CharacterSnapshot, action: string, coalesceKey?: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const current = syncCast(snapshot);
  const cast = current.draft.cast;
  const active = cast?.members.find((member) => member.id === cast.activeId);
  const backgroundOnly = snapshot.draft.purpose === 'background';
  const update = (key: 'relationship' | 'interaction', value: string) => {
    if (cast) onChange({ ...current, draft: { ...current.draft, cast: { ...cast, [key]: value } } }, tr('人物同士の指定を変更', 'Changed group direction'));
  };
  const updateMember = (key: 'name' | 'position', value: string) => {
    if (cast && active) onChange({ ...current, draft: { ...current.draft, cast: { ...cast, members: cast.members.map((member) => member.id === active.id ? { ...member, [key]: value } : member) } } }, tr('人物の識別・配置を変更', 'Changed person label or placement'), `cast-${active.id}-${key}`);
  };
  const select = (label: string, value: string, choices: ReadonlyArray<readonly [string, string, string]>, onValue: (value: string) => void) => <label className="grid min-w-0 gap-2 text-sm font-semibold">
    {label}<Select value={value || 'unset'} onValueChange={(next) => onValue(next === 'unset' ? '' : String(next))}>
      <SelectTrigger aria-label={label} className="min-h-11 w-full bg-card"><SelectValue>{castChoiceLabel(choices, value, language)}</SelectValue></SelectTrigger>
      <SelectContent>{choices.map(([id, ja, en]) => <SelectItem key={id} value={id || 'unset'} className="min-h-11">{language === 'ja' ? ja : en}</SelectItem>)}</SelectContent>
    </Select>
  </label>;
  return <section aria-label={tr('人数モード', 'Character count mode')} className="mb-5 rounded-[22px] border border-primary/20 bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold"><Users className="size-5 text-primary" />{tr('人数モード', 'Character count')}</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant={!cast?.enabled ? 'default' : 'outline'} aria-pressed={!cast?.enabled} className="min-h-11" onClick={() => onChange(setCastEnabled(current, false), tr('1人モードに切替', 'Switched to single-person mode'))}>{tr('1人', 'One person')}</Button>
        <Button variant={cast?.enabled ? 'default' : 'outline'} aria-pressed={Boolean(cast?.enabled)} disabled={backgroundOnly} className="min-h-11" onClick={() => onChange(setCastEnabled(current, true), tr('複数人数モードに切替', 'Switched to multi-person mode'))}>{tr('複数人（2〜6人）', 'Multiple (2–6)')}</Button>
      </div>
    </div>
    {backgroundOnly ? <p className="mt-3 text-sm text-muted-foreground">{tr('背景用途では人物を出力しません。人物設定は保持されます。', 'Background mode omits people but keeps their settings.')}</p>
      : !cast?.enabled ? <p className="mt-3 text-sm text-muted-foreground">{tr(cast ? '現在選択中の1人だけを出力します。他の人物設定は複数人モードに戻すと使えます。' : 'ペア・集合絵は複数人モードへ。人物ごとに外見や衣装を設定できます。', cast ? 'Only the selected person is output. Other people remain available in multiple-person mode.' : 'Use multiple-person mode for pairs and groups with separate character settings.')}</p>
      : <>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tr('人物・顔・衣装・表情は選択中の1人を編集。用途・画風・カメラ・背景・禁止事項は全員共通です。おまかせと設定メモも選択中の人物に反映します。', 'Edit character, appearance, outfit, and expression for the selected person. Purpose, style, camera, scene, and exclusions are shared. Randomize and note inference target the selected person.')}</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={tr('編集する人物', 'Person to edit')}>
          {cast.members.map((member, index) => <Button key={member.id} variant={member.id === cast.activeId ? 'secondary' : 'outline'} aria-pressed={member.id === cast.activeId} className="h-auto min-h-11 max-w-full whitespace-normal break-words py-2" onClick={() => { setConfirmRemove(null); onChange(selectCastMember(current, member.id), tr(`人物${index + 1}を編集中`, `Editing person ${index + 1}`)); }}>{tr(`人物${index + 1}`, `Person ${index + 1}`)}{member.name ? ` · ${member.name}` : ''}</Button>)}
          <Button variant="outline" className="min-h-11 gap-1" disabled={cast.members.length >= MAX_CAST_MEMBERS} onClick={() => onChange(addCastMember(current), tr('空欄の人物を追加', 'Added a blank person'))}><Plus className="size-4" />{tr('人物を追加', 'Add person')}</Button>
        </div>
        {active && <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">{tr('識別名（任意）', 'Label (optional)')}<Input aria-label={tr('人物の識別名', 'Person label')} maxLength={60} value={active.name} onChange={(event) => updateMember('name', event.target.value)} placeholder={tr('例：黒髪の剣士', 'e.g. Black-haired swordsman')} className="min-h-11 bg-background" /></label>
          {select(tr('人物の配置', 'Person placement'), active.position, castPositions, (value) => updateMember('position', value))}
          {select(tr('人物同士の関係', 'Relationship'), cast.relationship, castRelationships, (value) => update('relationship', value))}
          {select(tr('全員の動作', 'Group action'), cast.interaction, castInteractions, (value) => update('interaction', value))}
        </div>}
        {cast.interaction && <p className="mt-3 text-sm text-muted-foreground">{tr('全員の動作を優先し、個別のポーズとその自由入力は保持したまま出力から外します。', 'Group action takes priority. Individual poses and custom action notes are kept but omitted from output.')}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmRemove === active?.id ? <>
            <span className="text-sm">{tr('選択中の人物を削除しますか？「元に戻す」で復元できます。', 'Remove this person? Undo can restore them.')}</span>
            <Button variant="destructive" className="min-h-11" onClick={() => { onChange(removeCastMember(current, active!.id), tr('人物を削除', 'Removed a person')); setConfirmRemove(null); }}>{tr('この人物を削除する', 'Confirm removal')}</Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setConfirmRemove(null)}>{tr('キャンセル', 'Cancel')}</Button>
          </> : <Button variant="ghost" className="min-h-11 gap-1 text-muted-foreground" disabled={cast.members.length <= 2} onClick={() => setConfirmRemove(active?.id ?? null)}><Trash2 className="size-4" />{tr('選択中の人物を削除', 'Remove selected person')}</Button>}
          <span className="text-sm text-muted-foreground">{tr(`${cast.members.length}人を出力 · 配置は画面から見た左右`, `${cast.members.length} people in output · Left/right are image-relative`)}</span>
        </div>
      </>}
  </section>;
}
