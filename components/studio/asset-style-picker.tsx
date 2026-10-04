'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import {
  advancedAssetStyles,
  assetStyleCategories,
} from '@/data/asset-style-catalog';
import { assetStyles, filterAssetStyles } from '@/lib/asset-style';

export function AssetStylePicker({
  value,
  onChange,
  category,
  onCategory,
  query,
  onQuery,
  actions,
}: {
  value: string;
  onChange: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
  query: string;
  onQuery: (value: string) => void;
  actions: ReactNode;
}) {
  const options = filterAssetStyles(category, query);
  const current = assetStyles.find((item) => item.id === value);
  const currentHidden = current && !options.some((item) => item.id === value);
  const monochrome = advancedAssetStyles.find(
    (item) => item.id === value,
  )?.monochrome;
  const fieldClass =
    'min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  return (
    <div className="mb-5 min-w-0 space-y-3 rounded-lg border border-primary/20 bg-secondary/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-primary">画風ライブラリ</h3>
        <span className="text-xs text-muted-foreground">
          {assetStyleCategories.length}カテゴリ・{assetStyles.length}種類
        </span>
      </div>
      <label
        className="block text-sm font-medium"
        htmlFor="asset-style-category"
      >
        画風のカテゴリ
      </label>
      <select
        id="asset-style-category"
        className={fieldClass}
        value={category}
        onChange={(event) => onCategory(event.target.value)}
      >
        <option value="all">すべての画風（{assetStyles.length}）</option>
        <option value="rpg">
          RPGゲーム用すべて（{filterAssetStyles('rpg').length}）
        </option>
        <option value="manga">
          漫画用すべて（{filterAssetStyles('manga').length}）
        </option>
        {assetStyleCategories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.ja}（
            {assetStyles.filter((style) => style.category === item.id).length}）
          </option>
        ))}
      </select>
      <label className="relative block">
        <span className="sr-only">画風を検索</span>
        <Search
          className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          className={`${fieldClass} pl-9`}
          maxLength={100}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="例：ドット、Gペン、網点、pixel"
        />
      </label>
      <output className="block text-xs text-muted-foreground">
        検索結果 {options.length}件。
        {options.length
          ? '画風のランダムも絞り込みに従います。'
          : '検索語やカテゴリを変更してください。選択中の画風は保持されます。'}
      </output>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <label htmlFor="asset-style" className="text-sm font-medium">
          画風
        </label>
        {actions}
      </div>
      <select
        id="asset-style"
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">指定なし</option>
        {currentHidden && (
          <option value={value}>選択中：{current.ja}（絞り込み対象外）</option>
        )}
        {assetStyleCategories.map((item) => {
          const matches = options.filter((style) => style.category === item.id);
          return matches.length ? (
            <optgroup key={item.id} label={item.ja}>
              {matches.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.ja}
                </option>
              ))}
            </optgroup>
          ) : null;
        })}
      </select>
      {current?.promptJa && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {current.promptJa}
        </p>
      )}
      {monochrome && (
        <p className="text-xs leading-relaxed font-medium text-primary">
          この画風は白黒です。配色の設定は保持し、指示書はモノクロで出力します。
        </p>
      )}
    </div>
  );
}
