'use client';

import { Check, Dices, Lock, Search, Star, Unlock, X } from 'lucide-react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import type { Choice, LockKey, UiLanguage } from '@/lib/character-types';
import { categoriesForField, choiceCategoryLabel } from '@/data/choice-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FieldActions({
  label,
  locked,
  onRandom,
  onToggleLock,
  language = 'ja',
}: {
  label: string;
  locked: boolean;
  onRandom?: () => void;
  onToggleLock: () => void;
  language?: UiLanguage;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleLock}
        aria-label={language === 'ja' ? `${label}を${locked ? 'ロック解除' : 'ロック'}` : `${locked ? 'Unlock' : 'Lock'} ${label}`}
        aria-pressed={locked}
        className={locked ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
      >
        {locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
      </Button>
      {onRandom && <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRandom}
        disabled={locked}
        aria-label={language === 'ja' ? `${label}だけランダムに変える` : `Randomize only ${label}`}
        className="text-muted-foreground hover:text-primary"
      >
        <Dices className="size-3.5" />
      </Button>}
    </div>
  );
}

export function FormRow({
  label,
  hint,
  actions,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const labelId = useId();
  return (
    <fieldset aria-labelledby={labelId} className={`m-0 min-w-0 rounded-2xl border border-border/80 bg-background/55 p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p id={labelId} className="text-sm font-bold">{label}</p>
          {hint && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </fieldset>
  );
}

export function SingleSelect({
  label,
  value,
  options,
  onChange,
  placeholder = '指定なし',
  language = 'ja',
  field,
  favorites = [],
  recents = [],
  onToggleFavorite,
  onRecordRecent,
}: {
  label: string;
  value: string;
  options: Array<Pick<Choice, 'id' | 'labelJa' | 'labelEn'>>;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: UiLanguage;
  field?: LockKey;
  favorites?: string[];
  recents?: string[];
  onToggleFavorite?: (id: string) => void;
  onRecordRecent?: (id: string) => void;
}) {
  const [view, setView] = useState<'all' | 'favorites' | 'recent'>('all');
  const [categoryId, setCategoryId] = useState('');
  const selectedOption = options.find((option) => option.id === value);
  const categories = useMemo(
    () => categoriesForField(field).filter((item) => options.some((option) => item.matches(option as Choice))),
    [field, options],
  );
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const catalogOptions = useMemo(() => {
    const categoryValue = categories.find((item) => item.id === categoryId);
    return options
      .filter((option) => view === 'all' || (view === 'favorites' ? favorites.includes(option.id) : recents.includes(option.id)))
      .filter((option) => !categoryValue || categoryValue.matches(option as Choice))
      .sort((left, right) => {
        if (left.id === value) return -1;
        if (right.id === value) return 1;
        const leftFavorite = favorites.includes(left.id);
        const rightFavorite = favorites.includes(right.id);
        if (leftFavorite !== rightFavorite) return leftFavorite ? -1 : 1;
        return (recents.indexOf(left.id) < 0 ? 99 : recents.indexOf(left.id))
          - (recents.indexOf(right.id) < 0 ? 99 : recents.indexOf(right.id));
      });
  }, [categoryId, categories, favorites, options, recents, value, view]);
  const selectValue = (next: string) => {
    onRecordRecent?.(next);
    onChange(next);
  };
  if (options.length >= 30) {
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {(['all', 'favorites', 'recent'] as const).map((item) => (
            <Button key={item} type="button" variant={view === item ? 'secondary' : 'ghost'} size="sm" className="min-h-11 rounded-xl px-3 text-sm" aria-pressed={view === item} onClick={() => setView(item)}>
              {{ all: language === 'ja' ? 'すべて' : 'All', favorites: language === 'ja' ? 'お気に入り' : 'Favorites', recent: language === 'ja' ? '最近' : 'Recent' }[item]}
            </Button>
          ))}
          {categories.length > 0 && (
            <Select value={categoryId || 'all'} onValueChange={(next) => setCategoryId(next === 'all' ? '' : String(next))}>
              <SelectTrigger aria-label={language === 'ja' ? `${label}のカテゴリ` : `${label} category`} className="h-11 w-full rounded-xl bg-card sm:w-44">
                <SelectValue>{selectedCategory ? choiceCategoryLabel(selectedCategory, language) : language === 'ja' ? '全カテゴリ' : 'All categories'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="min-h-11">{language === 'ja' ? '全カテゴリ' : 'All categories'}</SelectItem>
                {categories.map((item) => <SelectItem key={item.id} value={item.id} className="min-h-11">{choiceCategoryLabel(item, language)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Combobox
            items={catalogOptions}
            value={selectedOption ?? null}
            onValueChange={(next) => next && selectValue(next.id)}
            itemToStringLabel={(option) => language === 'ja' ? option.labelJa : option.labelEn}
            itemToStringValue={(option) => option.id}
            isItemEqualToValue={(option, selected) => option.id === selected.id}
            filter={(option, query) => {
              const keyword = query.trim().toLocaleLowerCase('ja');
              return `${option.labelJa} ${option.labelEn}`.toLocaleLowerCase('ja').includes(keyword);
            }}
          >
            <ComboboxInput
              aria-label={label}
              triggerAriaLabel={language === 'ja' ? `${label}の候補を開く` : `Open ${label} options`}
              placeholder={placeholder}
              className="h-11 w-full rounded-xl bg-card"
            />
            <ComboboxContent>
              <ComboboxEmpty>{language === 'ja' ? '一致する候補がありません' : 'No matching options'}</ComboboxEmpty>
              <ComboboxList>
                {(option: Pick<Choice, 'id' | 'labelJa' | 'labelEn'>, index: number) => (
                  <ComboboxItem key={option.id} value={option} index={index} className="min-h-11">
                    <span>{language === 'ja' ? option.labelJa : option.labelEn}</span>
                    {favorites.includes(option.id) && <Star className="ml-auto size-4 fill-current text-amber-500" />}
                    <span className="truncate text-sm text-muted-foreground">{language === 'ja' ? option.labelEn : option.labelJa}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {selectedOption && onToggleFavorite && <Button type="button" variant="outline" size="icon" aria-label={language === 'ja' ? `${selectedOption.labelJa}をお気に入り切替` : `Toggle ${selectedOption.labelEn} favorite`} aria-pressed={favorites.includes(selectedOption.id)} onClick={() => onToggleFavorite(selectedOption.id)}><Star className={`size-4 ${favorites.includes(selectedOption.id) ? 'fill-current text-amber-500' : ''}`} /></Button>}
          {value && <Button type="button" variant="ghost" size="icon" aria-label={language === 'ja' ? `${label}の選択をクリア` : `Clear ${label}`} onClick={() => onChange('')}><X className="size-4" /></Button>}
        </div>
      </div>
    );
  }
  return (
    <Select value={value || null} onValueChange={(next) => next && selectValue(String(next))}>
      <SelectTrigger aria-label={label} className="h-11 w-full rounded-xl bg-card px-3">
        <SelectValue placeholder={placeholder}>{selectedOption ? (language === 'ja' ? selectedOption.labelJa : selectedOption.labelEn) : placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id} className="min-h-11">
            {language === 'ja' ? option.labelJa : option.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ChoiceChips({
  label,
  options,
  selected,
  onChange,
  limit = 14,
  searchable = true,
  field,
  language = 'ja',
  favorites = [],
  recents = [],
  onToggleFavorite,
  onRecordRecent,
}: {
  label: string;
  options: Choice[];
  selected: string[];
  onChange: (values: string[]) => void;
  limit?: number;
  searchable?: boolean;
  field?: LockKey;
  language?: UiLanguage;
  favorites?: string[];
  recents?: string[];
  onToggleFavorite?: (id: string) => void;
  onRecordRecent?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'all' | 'selected' | 'favorites' | 'recent'>('all');
  const [categoryId, setCategoryId] = useState('');
  const categories = useMemo(
    () => categoriesForField(field).filter((item) => options.some(item.matches)),
    [field, options],
  );
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const categoryValue = categories.find((item) => item.id === categoryId);
    return options.filter((option) => {
      if (view === 'selected' && !selected.includes(option.id)) return false;
      if (view === 'favorites' && !favorites.includes(option.id)) return false;
      if (view === 'recent' && !recents.includes(option.id)) return false;
      if (categoryValue && !categoryValue.matches(option)) return false;
      if (!keyword) return true;
      return option.labelJa.toLowerCase().includes(keyword) || option.labelEn.toLowerCase().includes(keyword);
    });
  }, [categoryId, categories, favorites, options, query, recents, selected, view]);
  const ordered = useMemo(() => [
    ...filtered.filter((option) => selected.includes(option.id)),
    ...filtered.filter((option) => !selected.includes(option.id)),
  ], [filtered, selected]);
  const selectedCount = filtered.filter((option) => selected.includes(option.id)).length;
  const visible = expanded || query ? ordered : ordered.slice(0, Math.max(limit, selectedCount));

  const toggle = (id: string) => {
    onRecordRecent?.(id);
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <div className="min-w-0">
      {options.length > 18 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['all', 'selected', 'favorites', 'recent'] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={view === item ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={view === item}
              onClick={() => setView(item)}
              className="min-h-11 rounded-xl px-3 text-sm"
            >
              {{
                all: language === 'ja' ? 'すべて' : 'All',
                selected: language === 'ja' ? `選択中 ${selected.length}` : `Selected ${selected.length}`,
                favorites: language === 'ja' ? `お気に入り ${favorites.length}` : `Favorites ${favorites.length}`,
                recent: language === 'ja' ? '最近' : 'Recent',
              }[item]}
            </Button>
          ))}
          {selected.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} className="min-h-11 gap-1 rounded-xl text-sm text-destructive">
              <X className="size-4" />{language === 'ja' ? '選択をクリア' : 'Clear selected'}
            </Button>
          )}
        </div>
      )}
      {categories.length > 0 && options.length > 18 && (
        <Select value={categoryId || 'all'} onValueChange={(value) => setCategoryId(value === 'all' ? '' : String(value))}>
          <SelectTrigger aria-label={language === 'ja' ? `${label}のカテゴリ` : `${label} category`} className="mb-3 h-11 w-full rounded-xl bg-card px-3 sm:w-56">
            <SelectValue>{selectedCategory ? choiceCategoryLabel(selectedCategory, language) : language === 'ja' ? 'すべてのカテゴリ' : 'All categories'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="min-h-11">{language === 'ja' ? 'すべてのカテゴリ' : 'All categories'}</SelectItem>
            {categories.map((item) => <SelectItem key={item.id} value={item.id} className="min-h-11">{choiceCategoryLabel(item, language)}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {searchable && options.length > 18 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={language === 'ja' ? `${label}の選択肢を検索` : `Search ${label} options`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === 'ja' ? '選択肢を検索' : 'Search options'}
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {visible.map((option) => {
          const active = selected.includes(option.id);
          const favorite = favorites.includes(option.id);
          return (
            <span key={option.id} className="inline-flex overflow-hidden rounded-full border border-border bg-card">
              <Button
                type="button"
                variant={active ? 'default' : 'ghost'}
                size="sm"
                aria-pressed={active}
                onClick={() => toggle(option.id)}
                className={`min-h-11 rounded-none border-0 px-3 text-sm ${active ? 'shadow-sm' : 'hover:bg-accent'}`}
              >
                {active && <Check className="mr-1 size-4" />}{language === 'ja' ? option.labelJa : option.labelEn}
              </Button>
              {onToggleFavorite && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={language === 'ja' ? `${option.labelJa}を${favorite ? 'お気に入りから外す' : 'お気に入りに追加'}` : `${favorite ? 'Remove' : 'Add'} ${option.labelEn} ${favorite ? 'from' : 'to'} favorites`}
                  aria-pressed={favorite}
                  onClick={() => onToggleFavorite(option.id)}
                  className="min-h-11 min-w-11 rounded-none border-l border-border text-muted-foreground"
                >
                  <Star className={`size-4 ${favorite ? 'fill-current text-amber-500' : ''}`} />
                </Button>
              )}
            </span>
          );
        })}
      </div>
      {filtered.length > limit && !query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 min-h-11 text-sm text-primary"
        >
          {expanded ? (language === 'ja' ? '折りたたむ' : 'Show less') : (language === 'ja' ? `すべて表示（${filtered.length}）` : `Show all (${filtered.length})`)}
        </Button>
      )}
      {filtered.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{language === 'ja' ? '条件に合う候補がありません。' : 'No options match these filters.'}</p>}
    </div>
  );
}
