'use client';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translateFreeText } from '@/data/translations';
import { buildCastPromptParts } from '@/lib/prompt-engine';
import { isCastActive, PERSON_CUSTOM_KEYS, syncCast } from '@/lib/character-cast';
import { castChecks } from '@/lib/cast-workflow';
import { customFieldLabels } from '@/lib/character-insights';
import type { CharacterSnapshot, UiLanguage } from '@/lib/character-types';

export function CastOutputTools({ snapshot, language, onCopy, onJump }: {
  snapshot: CharacterSnapshot; language: UiLanguage;
  onCopy: (text: string, label: string, scope: string) => void;
  onJump: (personId: string | undefined, key: string) => void;
}) {
  const [partLanguage, setPartLanguage] = useState<UiLanguage>(language);
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const current = useMemo(() => syncCast(snapshot), [snapshot]);
  const draft = current.draft;
  const checks = castChecks(current);
  const parts = useMemo(() => isCastActive(draft) ? buildCastPromptParts(draft) : null, [draft]);
  const untranslated = useMemo(() => {
    const entries: Array<{ personId?: string; key: string; label: string; text: string }> = [];
    const add = (custom: Record<string, string>, personId?: string, prefix = '') => {
      for (const [key, text] of Object.entries(custom)) {
        if (['gap', 'gapEn'].includes(key) || (draft.stylePack?.presetId && key === 'style') || (parts && draft.cast?.interaction && key === 'pose')) continue;
        if (draft.purpose === 'background' && !['style', 'scene', 'negatives', 'must', 'preference', 'layout'].includes(key)) continue;
        if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(translateFreeText(text))) entries.push({ personId, key, label: prefix + (customFieldLabels[key]?.[language] ?? key), text });
      }
    };
    add(Object.fromEntries(Object.entries(draft.custom).filter(([key]) => !parts || !PERSON_CUSTOM_KEYS.includes(key))));
    if (parts) draft.cast!.members.forEach((member, index) => {
      const prefix = `${tr(`人物${index + 1}`, `Person ${index + 1}`)}: `;
      add(member.custom, member.id, prefix);
      if (!member.nameEn && /[\u3040-\u30ff\u3400-\u9fff]/u.test(member.name)) entries.push({ personId: member.id, key: 'nameEn', label: prefix + tr('英語の識別名', 'English label'), text: member.name });
    });
    if (parts && draft.cast?.relationshipNote && /[\u3040-\u30ff\u3400-\u9fff]/u.test(translateFreeText(draft.cast.relationshipNote))) entries.push({ key: 'relationshipNote', label: tr('関係の補足', 'Relationship notes'), text: draft.cast.relationshipNote });
    return entries;
  }, [draft, parts, language]);
  return <div className="mt-4 space-y-3">
    {checks.length > 0 && <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"><h3 className="text-sm font-bold">{tr('コピー前の確認', 'Before you copy')}</h3><p className="mt-1 text-sm text-muted-foreground">{tr('自動修正はしません。意図どおりなら、そのままコピーできます。', 'Nothing is automatically changed. Copy as-is if intentional.')}</p><ul className="mt-3 space-y-3">{checks.map((check) => <li key={check.id} className="text-sm">{check[language]}{check.personId && <Button variant="link" className="min-h-11" onClick={() => onJump(check.personId, 'character')}>{tr('人物を編集', 'Edit person')}</Button>}</li>)}</ul></section>}
    {parts && <details className="rounded-2xl border border-border bg-card p-4"><summary className="min-h-11 cursor-pointer text-sm font-bold">{tr('共通部分・人物別にコピー', 'Copy shared and person blocks')}</summary>
      <label className="grid gap-2 text-sm">{tr('部分コピーの言語', 'Block language')}<Select value={partLanguage} onValueChange={(value) => setPartLanguage(value as UiLanguage)}><SelectTrigger className="min-h-11 w-full"><SelectValue>{partLanguage === 'ja' ? '日本語' : 'English'}</SelectValue></SelectTrigger><SelectContent><SelectItem value="ja">日本語</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></label>
      <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" onClick={() => onCopy([partLanguage === 'ja' ? parts.groupJa : parts.groupEn, parts.common[partLanguage], parts.directions(partLanguage)].filter(Boolean).join('\n\n'), tr('共通部分をコピー', 'Copy shared block'), tr('共通：人数・画風・背景・制約。個人の外見は含みません。', 'Shared: count, style, scene, constraints. No individual appearance.'))}>{tr('共通部分', 'Shared block')}</Button>{parts.individual.map((output, index) => <Button key={parts.cast.members[index].id} variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => onCopy(`[${parts.label(index, partLanguage)}]\n${output[partLanguage]}`, tr(`人物${index + 1}をコピー`, `Copy person ${index + 1}`), tr('人物1人分のみ。共通部分と組み合わせてください。', 'One person only. Combine with the shared block.'))}>{parts.label(index, language)}</Button>)}</div>
    </details>}
    {untranslated.length > 0 && <details className="rounded-2xl border border-amber-500/25 bg-card p-4"><summary className="min-h-11 cursor-pointer text-sm font-bold">{tr(`英語に変換できない原文（${untranslated.length}件）`, `Untranslated text (${untranslated.length})`)}</summary><p className="text-sm text-muted-foreground">{tr('英語出力にも原文が残ります。必要なら入力欄で英語に直してください。', 'Original text remains in English output. Edit it if needed.')}</p><ul className="mt-3 space-y-3">{untranslated.map((item) => <li key={`${item.personId ?? 'shared'}-${item.key}`} className="text-sm"><p className="font-semibold">{item.label}</p><mark className="my-1 block whitespace-pre-wrap break-words rounded bg-amber-200/30 p-2 text-foreground">{item.text}</mark><Button variant="outline" className="min-h-11" onClick={() => onJump(item.personId, item.key)}>{tr('この入力を編集', 'Edit this input')}</Button></li>)}</ul></details>}
  </div>;
}
