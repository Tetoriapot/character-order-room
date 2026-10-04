'use client';

import { useAssetUi } from './asset-ui-context';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import {
  assetCategories,
  assetSubjects,
  type AssetDraft,
} from '@/data/asset-options';
import {
  effectCatalog,
  effectCategories,
  filterEffects,
} from '@/data/asset-effect-catalog';

export function AssetSubjectPicker({
  draft,
  onChange,
  filter,
  onFilter,
  query,
  onQuery,
  actions,
}: {
  draft: AssetDraft;
  onChange: (id: string) => void;
  filter: string;
  onFilter: (value: string) => void;
  query: string;
  onQuery: (value: string) => void;
  actions: ReactNode;
}) {
  const { language, tr } = useAssetUi();
  const isEffect = draft.category === 'effect';
  const filteredEffects = isEffect ? filterEffects(filter, query) : [];
  const options = isEffect
    ? filteredEffects
    : assetSubjects[draft.category].filter((item) => item.id !== 'custom');
  const current = assetSubjects[draft.category].find(
    (item) => item.id === draft.subjects[draft.category],
  );
  const currentHidden =
    current &&
    current.id !== 'custom' &&
    !options.some((item) => item.id === current.id);
  const fieldClass =
    'min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
  const subjectCategory = assetCategories.find(
    (item) => item.id === draft.category,
  )!;
  const label =
    language === 'ja'
      ? `${subjectCategory.ja}の種類`
      : `${subjectCategory.en} type`;

  return (
    <div className="min-w-0 space-y-3">
      {isEffect && (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-secondary/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-primary">
              {tr('エフェクトライブラリ')}
            </p>
            <span className="text-xs text-muted-foreground">
              {effectCategories.length}
              {tr('カテゴリ・')}
              {effectCatalog.length}
              {tr('種類')}
            </span>
          </div>
          <label className="block text-sm font-medium">
            <span className="mb-2 block">{tr('エフェクトのカテゴリ')}</span>
            <select
              className={fieldClass}
              value={filter}
              onChange={(event) => onFilter(event.target.value)}
            >
              <option value="all">
                {tr('すべてのカテゴリ（')}
                {effectCatalog.length}）
              </option>
              <option value="rpg">
                {tr('RPGゲーム用すべて（')}
                {filterEffects('rpg').length}）
              </option>
              <option value="manga">
                {tr('漫画の1コマ用すべて（')}
                {filterEffects('manga').length}）
              </option>
              {effectCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category[language]}（
                  {
                    effectCatalog.filter(
                      (item) => item.category === category.id,
                    ).length
                  }
                  ）
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{tr('エフェクトを検索')}</span>
            <div className="relative">
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
                placeholder={tr('例：回復、斬撃、集中線、RPG')}
              />
            </div>
          </label>
          <output className="block text-xs text-muted-foreground">
            {tr('検索結果')}
            {options.length}
            {tr('件')}
            {options.length === 0
              ? tr(
                  '。検索語やカテゴリを変更してください。選択中の設定は保持されます。',
                )
              : tr('。種類のランダムは、この候補から選びます。')}
          </output>
        </div>
      )}
      <div>
        <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
          <label htmlFor="asset-subject-select" className="text-sm font-medium">
            {label}
          </label>
          {actions}
        </div>
        <select
          id="asset-subject-select"
          className={fieldClass}
          value={draft.subjects[draft.category]}
          onChange={(event) => onChange(event.target.value)}
        >
          {currentHidden && (
            <option value={current.id}>
              {tr('選択中：')}
              {current[language]}
              {tr('（絞り込み対象外）')}
            </option>
          )}
          {isEffect
            ? effectCategories.map((category) => {
                const items = filteredEffects.filter(
                  (item) => item.category === category.id,
                );
                return items.length ? (
                  <optgroup key={category.id} label={category[language]}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item[language]}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })
            : options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item[language]}
                </option>
              ))}
          <option value="custom">{tr('自由に指定')}</option>
        </select>
        {current?.promptJa && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {language === 'ja' ? current.promptJa : current.en}
          </p>
        )}
        {!isEffect && (
          <p className="mt-2 text-xs text-muted-foreground">
            {options.length}
            {tr('種類の候補から選べます。')}
          </p>
        )}
      </div>
    </div>
  );
}
