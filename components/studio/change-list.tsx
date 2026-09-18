import type { CharacterChange } from '@/lib/character-insights';
import type { UiLanguage } from '@/lib/character-types';

export function ChangeList({ changes, language }: { changes: CharacterChange[]; language: UiLanguage }) {
  if (!changes.length) return <p className="py-3 text-sm text-muted-foreground">{language === 'ja' ? '入力項目の変更はありません。' : 'No field changes.'}</p>;
  const groups = new Map<string, CharacterChange[]>();
  for (const change of changes) {
    const label = (language === 'ja' ? change.groupJa : change.groupEn) ?? (language === 'ja' ? '共通・全体' : 'Shared / general');
    groups.set(label, [...(groups.get(label) ?? []), change]);
  }
  return <div className="space-y-4">{[...groups].map(([label, items]) => <section key={label}>
    <h3 className="rounded-lg bg-muted/60 px-3 py-2 text-sm font-bold">{label}</h3>
    <dl className="divide-y divide-border text-sm">
    {items.map((change) => <div key={change.id} className="grid gap-2 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)]">
      <dt className="font-semibold">{language === 'ja' ? change.labelJa : change.labelEn}</dt>
      <dd className="min-w-0 break-words text-muted-foreground"><span className="mr-2 text-xs">{language === 'ja' ? '変更前' : 'Before'}</span>{language === 'ja' ? change.beforeJa : change.beforeEn}</dd>
      <dd className="min-w-0 break-words font-medium"><span className="mr-2 text-xs text-primary">{language === 'ja' ? '変更後' : 'After'}</span>{language === 'ja' ? change.afterJa : change.afterEn}</dd>
    </div>)}
  </dl></section>)}</div>;
}
