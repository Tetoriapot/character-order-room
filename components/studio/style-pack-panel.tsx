'use client';

import { useMemo, useState } from 'react';
import { Check, Dices, Search, Star, X } from 'lucide-react';
import { antiAiBlocks } from '@/data/anti-ai-blocks';
import { antiAiStrengths, styleCategories } from '@/data/style-categories';
import type { UiLanguage } from '@/lib/character-types';
import type { StyleCategory, StylePackSelection } from '@/lib/style-pack-types';
import { addAntiAi, antiAiReplaces, emptyStylePack, filterStylePresets, findAntiAiBlock, findStylePreset, MAX_ANTI_AI, pickRandomStyle, recommendAntiAiBlocks, stylePackWarnings } from '@/lib/style-pack';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = {
  selection?: StylePackSelection;
  language: UiLanguage;
  favorites: string[];
  locked: boolean;
  onChange: (selection: StylePackSelection) => void;
  onToggleFavorite: (id: string) => void;
  onSaveTemplate: () => void;
  onPreview: () => void;
};

export function StylePackPanel({ selection, language, favorites, locked, onChange, onToggleFavorite, onSaveTemplate, onPreview }: Props) {
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const value = selection ?? emptyStylePack();
  const style = findStylePreset(value.presetId);
  const [category, setCategory] = useState<StyleCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const presets = useMemo(() => filterStylePresets(query, category, favoritesOnly ? favorites : undefined), [query, category, favoritesOnly, favorites]);
  const recommendations = style ? recommendAntiAiBlocks(style.category) : [];
  const warnings = stylePackWarnings(value);
  const select = (presetId: string) => onChange({ ...value, presetId });

  return (
    <section className="min-w-0 space-y-4" aria-label={tr('画風ライブラリ', 'Style library')}>
      <div>
        <h3 className="font-bold">{style ? tr(style.nameJa, style.nameEn) : tr('画風ライブラリは未選択', 'No library style selected')}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{style ? tr('この画風を優先して出力します。従来の絵柄設定は保持されます。', 'This style takes priority in output. Classic settings are retained.') : tr('80種類から1つ選択。または下の絵柄設定で作れます。', 'Choose one of 80 styles, or use the classic settings below.')}</p>
      </div>
      <details className="border-y border-border">
      <summary className="py-3 text-sm font-semibold">{tr('画風を選ぶ・変更する（80種類）', 'Choose or change a style (80 styles)')}</summary>
      <div className="space-y-3 pb-3">
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input className="h-11 rounded-lg pl-9" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={tr('画風を検索', 'Search styles')} placeholder={tr('名前・用途・タグで検索', 'Search name, use case, or tag')} />
        </label>
        <Button variant={favoritesOnly ? 'secondary' : 'outline'} aria-pressed={favoritesOnly} className="min-h-11 rounded-lg" onClick={() => setFavoritesOnly(!favoritesOnly)}><Star className="size-4" />{tr('お気に入り', 'Favorites')}</Button>
      </div>
      <Tabs value={category} onValueChange={(next) => setCategory(next as StyleCategory | 'all')}>
        <TabsList variant="line" aria-label={tr('画風カテゴリ', 'Style categories')} className="w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="all" className="min-h-11 flex-none px-3">{tr('すべて', 'All')}</TabsTrigger>
          {styleCategories.map((item) => <TabsTrigger key={item.id} value={item.id} className="min-h-11 flex-none px-3">{tr(item.nameJa, item.nameEn)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={category}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" role="status">{tr(`${presets.length}件 · 1つ選択`, `${presets.length} styles · choose one`)}</p>
            <Button variant="ghost" className="min-h-11 rounded-lg" disabled={locked} onClick={() => { const next = pickRandomStyle(category, value.presetId); if (next) select(next.id); }}><Dices className="size-4" />{tr('このカテゴリからランダム', 'Random in category')}</Button>
          </div>
          {!style && <p className="mb-3 text-sm text-muted-foreground">{tr('迷ったら：やわらかさは「手描き」、伝わりやすさは「フラット・挿絵」、キャラ表現は「アニメ・Webtoon」から。', 'Try Hand drawn for warmth, Flat / editorial for clarity, or Anime / webtoon for character art.')}</p>}
          <div className="max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-border p-2" tabIndex={0} role="region" aria-label={tr('画風の候補一覧', 'Style results')}>
            <div className="grid gap-2 sm:grid-cols-2">
              {presets.map((preset, index) => {
                const active = value.presetId === preset.id;
                const favorite = favorites.includes(preset.id);
                return <div key={preset.id} className={`relative min-w-0 rounded-lg border ${active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <button type="button" className="h-full min-h-24 w-full rounded-lg p-3 pr-12 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring" aria-pressed={active} aria-label={tr(preset.nameJa, preset.nameEn)} onClick={() => select(preset.id)}>
                    <span className="block text-sm font-semibold">{active && <Check className="mr-1 inline size-4 text-primary" />}{tr(preset.nameJa, preset.nameEn)}</span>
                    <span className="mt-1 block break-words text-xs text-muted-foreground">{tr(preset.nameEn, preset.nameJa)}</span>
                    <span className="mt-2 block break-words text-xs text-muted-foreground">{preset.useCases.join(' / ')}</span>
                    {!style && category !== 'all' && index < 3 && <span className="mt-1 block text-xs text-primary">{tr('最初に試すおすすめ', 'Suggested starting point')}</span>}
                  </button>
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 size-11 rounded-lg" aria-pressed={favorite} aria-label={tr(`${preset.nameJa}をお気に入り${favorite ? 'から外す' : 'に追加'}`, `${favorite ? 'Unfavorite' : 'Favorite'} ${preset.nameEn}`)} onClick={() => onToggleFavorite(preset.id)}><Star className={`size-4 ${favorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} /></Button>
                </div>;
              })}
            </div>
            {!presets.length && <p className="p-4 text-sm text-muted-foreground">{tr('一致する画風がありません。検索・カテゴリ・お気に入りの条件を変更してください。', 'No matches. Change the search, category, or favorites filter.')}</p>}
          </div>
        </TabsContent>
      </Tabs>
      </div>
      </details>
      {style && <details className="border-b border-border pb-3">
        <summary className="py-3 text-sm font-semibold">{tr('選択中の画風：指示文・保存・解除', 'Selected style: prompt, save, or clear')}</summary>
        <div className="space-y-3">
        <p className="break-words text-sm leading-relaxed" lang="en">{style.stylePrompt}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{tr('選択中は、従来の絵柄・追加の雰囲気・絵柄の自由入力を出力しません（入力は保持）。人物のランダム生成でもこの画風は維持します。', 'While selected, classic style, style traits, and custom style text are retained but not output. Character randomization keeps this style.')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11 rounded-lg" onClick={onPreview}>{tr('ブロックを確認', 'Preview blocks')}</Button>
          <Button variant="outline" className="min-h-11 rounded-lg" onClick={onSaveTemplate}>{tr('テンプレ保存', 'Save template')}</Button>
          <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => select('')}>{tr('解除して従来の絵柄へ', 'Use classic style')}</Button>
        </div>
        </div>
      </details>}
      {warnings.map((warning) => <p key={warning.en} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm" role="status">{tr(warning.ja, warning.en)}</p>)}
      {style && <details className="border-b border-border pb-3">
        <summary className="py-3 text-sm font-semibold">{tr(`画風の補助を調整（${value.antiAiIds.length}/${MAX_ANTI_AI}）`, `Adjust style helpers (${value.antiAiIds.length}/${MAX_ANTI_AI})`)}</summary>
        <div className="space-y-3">
        <div>
          <h4 className="font-semibold">{tr('画風の補助', 'Style helpers')} <span className="ml-2 text-sm font-normal text-muted-foreground">ANTI_AI · {value.antiAiIds.length}/{MAX_ANTI_AI}</span></h4>
          <p className="mt-1 text-sm text-muted-foreground">{tr('1〜3件を推奨、最大5件。生成画像の質感を調整する指示です。効果はモデルにより異なり、AI判定の回避を保証するものではありません。', 'Recommended: 1–3, maximum 5. These adjust visual texture; results vary by model and do not guarantee evading AI detection.')}</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="text-sm font-semibold">{tr('この画風へのおすすめ（自動適用しません）', 'Recommended for this style (not applied automatically)')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{recommendations.map((item) => tr(item.nameJa, item.nameEn)).join(' / ')}</p>
          <Button variant="outline" className="mt-2 min-h-11 rounded-lg" onClick={() => onChange({ ...value, antiAiIds: recommendations.map((item) => item.id) })}>{tr('補助をおすすめ3件に置換', 'Replace helpers with these 3')}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{tr('補助を置換：', 'Replace helpers: ')}</span>
          {(['weak', 'medium', 'strong'] as const).map((level, index) => <Button key={level} variant="outline" className="min-h-11 rounded-lg" onClick={() => onChange({ ...value, antiAiIds: [...antiAiStrengths[level]] })}>{tr(['弱（2件）', '中（3件）', '強（5件）'][index], `${level} (${antiAiStrengths[level].length})`)}</Button>)}
          <Button variant="ghost" className="min-h-11 rounded-lg" disabled={!value.antiAiIds.length} onClick={() => onChange({ ...value, antiAiIds: [] })}>{tr('補助を解除', 'Clear helpers')}</Button>
        </div>
        {!!value.antiAiIds.length && <div className="flex flex-wrap gap-2" aria-label={tr('選択中の補助', 'Selected helpers')}>
          {value.antiAiIds.map((id) => { const block = findAntiAiBlock(id); return block ? <Button key={id} variant="secondary" className="h-auto min-h-11 max-w-full whitespace-normal rounded-lg py-2 text-left" aria-label={tr(`${block.nameJa}を解除`, `Remove ${block.nameEn}`)} onClick={() => onChange({ ...value, antiAiIds: value.antiAiIds.filter((item) => item !== id) })}>{tr(block.nameJa, block.nameEn)}<X className="size-3.5" /></Button> : null; })}
        </div>}
        <details className="rounded-lg border border-border p-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{tr(`補助30種から選ぶ・目的と注意を見る（${value.antiAiIds.length}件選択中）`, `Browse 30 helpers, intent and cautions (${value.antiAiIds.length} selected)`)}</summary>
          <div className="max-h-96 space-y-2 overflow-y-auto overscroll-contain pr-1" tabIndex={0} role="region" aria-label={tr('画風の補助一覧', 'Style helper list')}>
            {antiAiBlocks.map((block) => {
              const selected = value.antiAiIds.includes(block.id);
              const disabled = !selected && value.antiAiIds.length >= MAX_ANTI_AI && !value.antiAiIds.some((id) => antiAiReplaces(id, block.id));
              return <label key={block.id} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 ${selected ? 'border-primary/40 bg-primary/5' : 'border-border'} ${disabled ? 'opacity-60' : ''}`}>
                <Checkbox checked={selected} disabled={disabled} className="mt-1 shrink-0" onCheckedChange={() => onChange({ ...value, antiAiIds: selected ? value.antiAiIds.filter((id) => id !== block.id) : addAntiAi(value.antiAiIds, block.id) })} />
                <span className="min-w-0 text-sm"><span className="block font-semibold">{tr(block.nameJa, block.nameEn)}</span><span className="mt-1 block text-muted-foreground">{block.intent}</span><span className="mt-1 block text-xs text-muted-foreground">{tr('注意：', 'Caution: ')}{block.caution}</span></span>
              </label>;
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{tr('線の強弱・紙の粗さ・版ズレ・色数の別案は、同種の設定を置き換えます。', 'Alternative line, paper, registration, and palette settings replace each other.')}</p>
        </details>
        </div>
      </details>}
    </section>
  );
}
