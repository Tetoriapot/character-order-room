'use client';

import { useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { englishFor, labelFor } from '@/data/options';
import { duplicatePerson, randomizePeople, castChecks } from '@/lib/cast-workflow';
import { PersonTransferDialog } from './person-transfer-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CharacterSnapshot, UiLanguage } from '@/lib/character-types';
import { addCastMember, castChoiceLabel, castInteractions, castPositions, castRelationships, MAX_CAST_MEMBERS, removeCastMember, selectCastMember, setCastEnabled, syncCast } from '@/lib/character-cast';

export function CharacterCastPanel({ snapshot, language, onChange }: {
  snapshot: CharacterSnapshot; language: UiLanguage;
  onChange: (next: CharacterSnapshot, action: string, coalesceKey?: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copyFrom, setCopyFrom] = useState('');
  const [transferSource, setTransferSource] = useState<CharacterSnapshot | null>(null);
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const current = syncCast(snapshot);
  const cast = current.draft.cast;
  const active = cast?.members.find((member) => member.id === cast.activeId);
  const backgroundOnly = snapshot.draft.purpose === 'background';
  const update = (key: 'relationship' | 'interaction' | 'relationshipNote', value: string) => {
    if (cast) onChange({ ...current, draft: { ...current.draft, cast: { ...cast, [key]: value } } }, tr('人物同士の指定を変更', 'Changed group direction'));
  };
  const updateMember = (key: 'name' | 'nameEn' | 'position', value: string) => {
    if (cast && active) onChange({ ...current, draft: { ...current.draft, cast: { ...cast, members: cast.members.map((member) => member.id === active.id ? { ...member, [key]: value } : member) } } }, tr('人物の識別・配置を変更', 'Changed person label or placement'), `cast-${active.id}-${key}`);
  };
  if (backgroundOnly) return <section className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">{tr(`背景のみを出力中。人物設定${cast?.members.length ?? 1}人分は保持しています。用途を戻すと再編集できます。`, `Outputting background only. Settings for ${cast?.members.length ?? 1} people are retained; change purpose to edit them again.`)}</section>;
  const emptyIds = new Set(castChecks(current).filter((check) => check.id.startsWith('empty-')).map((check) => check.personId));
  const selected = selectedIds.filter((id) => cast?.members.some((member) => member.id === id));
  const select = (label: string, value: string, choices: ReadonlyArray<readonly [string, string, string]>, onValue: (value: string) => void) => <label className="grid min-w-0 gap-2 text-sm font-semibold">
    {label}<Select value={value || 'unset'} onValueChange={(next) => onValue(next === 'unset' ? '' : String(next))}>
      <SelectTrigger aria-label={label} className="min-h-11 w-full bg-card"><SelectValue>{castChoiceLabel(choices, value, language)}</SelectValue></SelectTrigger>
      <SelectContent>{choices.map(([id, ja, en]) => <SelectItem key={id} value={id || 'unset'} className="min-h-11">{language === 'ja' ? ja : en}</SelectItem>)}</SelectContent>
    </Select>
  </label>;
  return <section aria-label={tr('人数モード', 'Character count mode')} className="mb-3 border-b border-border pb-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold"><Users className="size-5 text-primary" />{tr('人数モード', 'Character count')}</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant={!cast?.enabled ? 'default' : 'outline'} aria-pressed={!cast?.enabled} className="min-h-11" onClick={() => onChange(setCastEnabled(current, false), tr('1人モードに切替', 'Switched to single-person mode'))}>{tr('1人', 'One person')}</Button>
        <Button variant={cast?.enabled ? 'default' : 'outline'} aria-pressed={Boolean(cast?.enabled)} disabled={backgroundOnly} className="min-h-11" onClick={() => onChange(setCastEnabled(current, true), tr('複数人数モードに切替', 'Switched to multi-person mode'))}>{tr('複数人（2〜6人）', 'Multiple (2–6)')}</Button>
      </div>
    </div>
    {backgroundOnly ? <p className="mt-3 text-sm text-muted-foreground">{tr('背景用途では人物を出力しません。人物設定は保持されます。', 'Background mode omits people but keeps their settings.')}</p>
      : !cast?.enabled ? <p className="mt-3 text-sm text-muted-foreground">{tr(cast ? '現在選択中の1人だけを出力します。他の人物設定は複数人モードに戻すと使えます。' : 'ペア・集合絵は複数人モードへ。人物ごとに外見や衣装を設定できます。', cast ? 'Only the selected person is output. Other people remain available in multiple-person mode.' : 'Use multiple-person mode for pairs and groups with separate character settings.')}</p>
      : <details id="cast-details" className="mt-3 border-t border-border">
        <summary className="py-3 text-sm font-semibold">{tr(`人数・配置・関係の設定（${cast.members.length}人）`, `People, placement & relationships (${cast.members.length})`)}</summary>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tr('人物・顔・衣装・表情は選択中の1人を編集。用途・画風・カメラ・背景・禁止事項は全員共通です。設定メモは人物別と共通を切り替えて使えます。', 'Appearance, outfit, and expression belong to the selected person. Purpose, style, camera, scene, and exclusions are shared. Note drafts are separate for each person and the shared scene.')}</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={tr('編集する人物', 'Person to edit')}>
          {cast.members.map((member, index) => <Button key={member.id} variant={member.id === cast.activeId ? 'secondary' : 'outline'} aria-pressed={member.id === cast.activeId} className="h-auto min-h-11 min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2" onClick={() => { setConfirmRemove(null); onChange(selectCastMember(current, member.id), tr(`人物${index + 1}${member.name ? `・${member.name}` : ''}を編集中`, `Editing person ${index + 1}${member.nameEn || member.name ? ` · ${member.nameEn || member.name}` : ''}`)); }}>{tr(`人物${index + 1}`, `Person ${index + 1}`)}{(language === 'en' ? member.nameEn || member.name : member.name) ? ` · ${language === 'en' ? member.nameEn || member.name : member.name}` : ''}{emptyIds.has(member.id) ? tr('（未入力）', ' (blank)') : ''}</Button>)}
          <Button variant="outline" className="min-h-11 gap-1" disabled={cast.members.length >= MAX_CAST_MEMBERS} onClick={() => onChange(addCastMember(current), tr('空欄の人物を追加', 'Added a blank person'))}><Plus className="size-4" />{tr('人物を追加', 'Add person')}</Button>
        </div>
        {active && <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">{tr('識別名（任意）', 'Label (optional)')}<Input aria-label={tr('人物の識別名', 'Person label')} maxLength={60} value={active.name} onChange={(event) => updateMember('name', event.target.value)} placeholder={tr('例：黒髪の剣士', 'e.g. Black-haired swordsman')} className="min-h-11 bg-background" /></label>
          <label className="grid gap-2 text-sm font-semibold">{tr('英語の識別名（任意）', 'English label (optional)')}<Input id="cast-nameEn" aria-label={tr('人物の英語識別名', 'Person English label')} maxLength={60} value={active.nameEn ?? ''} onChange={(event) => updateMember('nameEn', event.target.value)} placeholder="e.g. Black-haired swordsman" className="min-h-11 bg-background" /></label>
          {select(tr('人物の配置', 'Person placement'), active.position, castPositions, (value) => updateMember('position', value))}
          {select(tr('人物同士の関係', 'Relationship'), cast.relationship, castRelationships, (value) => update('relationship', value))}
          {select(tr('全員の動作', 'Group action'), cast.interaction, castInteractions, (value) => update('interaction', value))}
        </div>}
        <label className="mt-4 grid gap-2 text-sm font-semibold">{tr('関係の補足（任意）', 'Relationship notes (optional)')}<Input id="cast-relationshipNote" maxLength={500} value={cast.relationshipNote ?? ''} onChange={(event) => update('relationshipNote', event.target.value)} placeholder={tr('例：人物1は人物2の師匠。人物2は人物1を尊敬している。', 'e.g. Person 1 mentors Person 2; Person 2 admires Person 1.')} className="min-h-11" /></label>
        {cast.interaction && <p className="mt-3 text-sm text-muted-foreground">{tr('全員の動作を優先し、個別ポーズとポーズ専用メモだけを出力から外します。表情のメモは出力します。', 'Group action replaces individual poses and pose-only notes. Expression notes stay in output.')}</p>}
        <details className="mt-4 rounded-lg border border-border p-3">
          <summary className="min-h-11 cursor-pointer text-sm font-bold">{tr('人物一覧・比較・まとめて編集', 'Compare and edit people together')}</summary>
          <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><caption className="sr-only">{tr('人物ごとの髪・衣装・配置', 'Hair, outfit, and placement by person')}</caption><thead><tr>{[tr('対象・人物', 'Select / person'), tr('髪色', 'Hair'), tr('衣装', 'Outfit'), tr('配置', 'Placement')].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{cast.members.map((member, index) => <tr key={member.id} className="border-t border-border">
            <td className="p-2"><label className="flex min-h-11 items-center gap-2"><Checkbox checked={selected.includes(member.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...ids, member.id] : ids.filter((id) => id !== member.id))} /><span>{tr(`人物${index + 1}`, `Person ${index + 1}`)}{(language === 'en' ? member.nameEn || member.name : member.name) ? ` · ${language === 'en' ? member.nameEn || member.name : member.name}` : ''}{emptyIds.has(member.id) ? tr('（未入力）', ' (blank)') : ''}</span></label></td>
            <td className="p-2">{member.fields.hairColors?.map((id) => language === 'ja' ? labelFor('hairColors', id) : englishFor('hairColors', id)).join(', ') || '—'}</td><td className="p-2">{member.fields.outfit ? language === 'ja' ? labelFor('outfit', member.fields.outfit) : englishFor('outfit', member.fields.outfit) : '—'}</td><td className="p-2">{castChoiceLabel(castPositions, member.position, language)}</td>
          </tr>)}</tbody></table></div>
          <Button variant="outline" className="mt-3 min-h-11" disabled={!selected.length} onClick={() => onChange(randomizePeople(current, selected), tr(`選択した${selected.length}人をランダム生成`, `Randomized ${selected.length} selected people`))}>{tr(`選択した${selected.length}人をおまかせ`, `Randomize ${selected.length} selected`)}</Button>
          <p className="mt-2 text-sm text-muted-foreground">{tr('ロックと共通設定は保持。「元に戻す」でまとめて戻せます。', 'Locks and shared settings stay unchanged. Undo restores the whole batch.')}</p>
        </details>
        <details className="mt-3 rounded-lg border border-border p-3">
          <summary className="min-h-11 cursor-pointer text-sm font-bold">{tr('複製・項目コピー・左右の配置', 'Duplicate, copy fields, and placement')}</summary>
          <Button variant="outline" className="min-h-11" disabled={cast.members.length >= MAX_CAST_MEMBERS} onClick={() => onChange(duplicatePerson(current), tr('人物を複製（設定メモは別管理）', 'Duplicated person (note drafts stay separate)'))}>{tr('現在の人物を複製', 'Duplicate current person')}</Button>
          <div className="mt-3 flex flex-wrap items-end gap-2">{select(tr('コピー元の人物', 'Copy from person'), copyFrom, [['', '選択してください', 'Choose a person'], ...cast.members.filter((member) => member.id !== active?.id).map((member) => [member.id, member.name || `人物${cast.members.indexOf(member) + 1}`, member.nameEn || member.name || `Person ${cast.members.indexOf(member) + 1}`] as const)], setCopyFrom)}<Button variant="outline" className="min-h-11" disabled={!cast.members.some((member) => member.id === copyFrom && member.id !== active?.id)} onClick={() => setTransferSource(selectCastMember(current, copyFrom))}>{tr('項目を選んでコピー', 'Choose fields to copy')}</Button></div>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-center text-sm" role="img" aria-label={tr('画面から見た配置：左・中央・右', 'Image-relative placement: left, center, right')}>{(['left', 'center', 'right'] as const).map((position) => <div key={position}><p className="font-bold">{castChoiceLabel(castPositions, position, language)}</p><p className="mt-2 break-words text-muted-foreground">{cast.members.filter((member) => member.position === position).map((member) => member.name || tr(`人物${cast.members.indexOf(member) + 1}`, `Person ${cast.members.indexOf(member) + 1}`)).join(' / ') || '—'}</p></div>)}</div>
          <p className="mt-2 text-sm text-muted-foreground">{tr('配置は完成画像から見た左右。カメラの左右は被写体に対する撮影方向です。正面向きの人物では「人物自身の左」は画像の右になります。', 'Placement uses the finished image’s left/right. Camera sides describe the shooting direction relative to the subject. A front-facing person’s own left appears on the image’s right.')}</p>
          <Button variant="outline" className="mt-2 min-h-11" onClick={() => onChange({ ...current, draft: { ...current.draft, cast: { ...cast, members: cast.members.map((member) => ({ ...member, position: member.position === 'left' ? 'right' : member.position === 'right' ? 'left' : member.position })) } } }, tr('左右の配置を入れ替え', 'Swapped left/right placement'))}>{tr('全員の左右を入れ替え', 'Swap left/right placements')}</Button>
        </details>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmRemove === active?.id ? <>
            <span className="text-sm">{tr('選択中の人物を削除しますか？「元に戻す」で復元できます。', 'Remove this person? Undo can restore them.')}</span>
            <Button variant="destructive" className="min-h-11" onClick={() => { onChange(removeCastMember(current, active!.id), tr('人物を削除', 'Removed a person')); setConfirmRemove(null); }}>{tr('この人物を削除する', 'Confirm removal')}</Button>
            <Button variant="ghost" className="min-h-11" onClick={() => setConfirmRemove(null)}>{tr('キャンセル', 'Cancel')}</Button>
          </> : <Button variant="ghost" className="min-h-11 gap-1 text-muted-foreground" disabled={cast.members.length <= 2} onClick={() => setConfirmRemove(active?.id ?? null)}><Trash2 className="size-4" />{tr('選択中の人物を削除', 'Remove selected person')}</Button>}
          <span className="text-sm text-muted-foreground">{tr(`${cast.members.length}人を出力 · 配置は画面から見た左右`, `${cast.members.length} people in output · Left/right are image-relative`)}</span>
        </div>
      </details>}
    {transferSource && <PersonTransferDialog source={transferSource} target={current} language={language} title={tr('人物間で項目をコピー', 'Copy fields between people')} onClose={() => setTransferSource(null)} onApply={(next) => onChange(next, tr('確認した人物項目をコピー', 'Copied reviewed person fields'))} />}
  </section>;
}
