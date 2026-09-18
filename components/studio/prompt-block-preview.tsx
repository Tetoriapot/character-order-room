'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { UiLanguage } from '@/lib/character-types';
import { promptBlockNames, type PromptBlocks, type StylePackSelection } from '@/lib/style-pack-types';
import { formatPromptBlocks } from '@/lib/style-pack';

export function PromptBlockPreview({ blocks, selection, language, onChange, onCopy }: {
  blocks: PromptBlocks;
  selection: StylePackSelection;
  language: UiLanguage;
  onChange: (selection: StylePackSelection) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const formatted = formatPromptBlocks(blocks, selection.excludedBlocks);
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">{tr('チェックしたブロックを表示・コピーします。この切替はブロック形式のコピーにだけ反映されます。', 'Checked blocks are shown and copied. These toggles apply only to block-format copies.')}</p>
    {promptBlockNames.map((name) => {
      const included = !selection.excludedBlocks.includes(name);
      return <div key={name} className="rounded-xl border border-border bg-background/70 p-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
          <Checkbox checked={included} disabled={!blocks[name]} onCheckedChange={(checked) => onChange({ ...selection, excludedBlocks: checked ? selection.excludedBlocks.filter((item) => item !== name) : [...selection.excludedBlocks, name] })} />
          <span>{name}</span><span className="font-normal text-muted-foreground">{tr('を含める', 'included')}</span>
        </label>
        {included && blocks[name] ? <p className="whitespace-pre-wrap break-words text-sm leading-7" lang={name === 'CONTENT' ? 'ja' : 'en'}>{blocks[name]}</p> : <p className="text-xs text-muted-foreground">{!blocks[name] ? tr('未設定（コピーされません）', 'Not set (not copied)') : tr('非表示・コピー対象外', 'Hidden and excluded from copy')}</p>}
      </div>;
    })}
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="min-h-11 rounded-xl" disabled={!formatted} onClick={() => onCopy(formatPromptBlocks(blocks, selection.excludedBlocks, 'line'), tr('1行形式をコピー', 'Copied one-line format'))}>{tr('1行コピー', 'Copy one line')}</Button>
      <Button variant="outline" className="min-h-11 rounded-xl" disabled={!formatted} onClick={() => onCopy(formatPromptBlocks(blocks, selection.excludedBlocks, 'json'), tr('プロンプトJSONをコピー', 'Copied prompt JSON'))}>{tr('プロンプトJSON', 'Prompt JSON')}</Button>
    </div>
    <p className="text-xs text-muted-foreground">{tr('JSONはプロンプト受け渡し用です。編集内容の復元には「完全バックアップ」を使ってください。', 'This JSON is for prompt interchange. Use Full backup to restore the editor.')}</p>
  </div>;
}
