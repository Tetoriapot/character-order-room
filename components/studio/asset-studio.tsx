'use client';

import { useAssetUi, AssetUiProvider } from './asset-ui-context';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Box,
  Check,
  Dices,
  FileText,
  Film,
  Layers3,
  Lightbulb,
  Lock,
  RotateCcw,
  Sparkles,
  Unlock,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudioHeader } from './studio-header';
import { AssetStudioMenu, type AssetMenu } from './asset-studio-menu';
import {
  ASSET_HISTORY_KEY,
  parseAssetHistory,
  recordAssetHistory,
  type AssetHistoryEntry,
} from '@/lib/asset-history';
import { AssetOutputPreview } from './asset-output-preview';
import { AssetSubjectPicker } from './asset-subject-picker';
import { AssetStylePicker } from './asset-style-picker';
import { filterAssetStyles } from '@/lib/asset-style';
import { filterEffects } from '@/data/asset-effect-catalog';
import { assetRandomFields, randomizeAsset } from '@/lib/asset-random';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster, toast } from '@/components/ui/toast';
import {
  assetCategories,
  assetChoices,
  assetPresets,
  createAssetDraft,
  draftFromAssetPreset,
  type AssetDraft,
  type AssetRandomField,
  type AssetSelectField,
} from '@/data/asset-options';
import {
  ASSET_MAX_FILE_BYTES,
  ASSET_STORAGE_KEY,
  ASSET_TEXT_LIMIT,
  buildAssetPrompt,
  parseAssetDraft,
  serializeAssetDraft,
} from '@/lib/asset-prompt';

const categoryIcons = { effect: Sparkles, object: Box, motion: Film };
const fieldClass =
  'min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';
const selectLabels: Record<AssetSelectField, string> = {
  format: '出力の種類',
  style: '画風',
  palette: '配色',
  background: '背景',
  lighting: '光の当て方',
  camera: 'カメラの角度',
  framing: '構図',
  ratio: '縦横比',
  effectShape: '広がり方・形',
  density: '密度・強さ',
  material: '主な素材',
  condition: '質感・状態',
  motion: '動きの種類',
  direction: '動く方向',
  speed: '動きの速さ',
  timing: '速度の変化',
  cameraMotion: 'カメラの動き',
  duration: '動画の長さ',
  loop: '再生方法',
  frameCount: 'コマ数',
  fps: 'フレームレート',
};

function Section({
  number,
  title,
  hint,
  children,
}: {
  number: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-semibold text-primary">
          {number}
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block min-w-0 text-sm font-medium">
      <span className="mb-2 block">{label}</span>
      <textarea
        className={`${fieldClass} resize-y font-normal leading-relaxed`}
        rows={rows}
        maxLength={ASSET_TEXT_LIMIT}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function download(text: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function RandomActions({
  field,
  label,
  locked,
  disabled,
  onToggle,
  onRandom,
}: {
  field: AssetRandomField;
  label: string;
  locked: boolean;
  disabled: boolean;
  onToggle: (field: AssetRandomField) => void;
  onRandom: (field: AssetRandomField) => void;
}) {
  const { language, tr } = useAssetUi();
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        className={`flex size-11 items-center justify-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-primary ${locked ? 'border-primary/30 bg-secondary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted'}`}
        aria-pressed={locked}
        aria-label={
          language === 'ja'
            ? `${label}のランダム変更をロック`
            : `Lock ${label} against random changes`
        }
        title={locked ? tr('ロックを解除') : tr('ランダム変更をロック')}
        onClick={() => onToggle(field)}
      >
        {locked ? (
          <Lock className="size-4" aria-hidden="true" />
        ) : (
          <Unlock className="size-4" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-lg border border-border text-primary transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35"
        disabled={locked || disabled}
        aria-label={
          language === 'ja'
            ? `${label}だけランダムに変更`
            : `Randomize ${label}`
        }
        title={tr('この項目だけランダム')}
        onClick={() => onRandom(field)}
      >
        <Dices className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function AssetStudioContent({
  characterHref = '/',
}: {
  characterHref?: string;
}) {
  const { language, tr, dark, toggleLanguage, toggleColorMode } = useAssetUi();
  const [draft, setDraft] = useState(createAssetDraft);
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState<AssetMenu>(null);
  const [history, setHistory] = useState<AssetHistoryEntry[]>([]);
  const [historyIssue, setHistoryIssue] = useState(false);
  const historyRef = useRef<AssetHistoryEntry[]>([]);
  const historyBlocked = useRef(false);
  const historyStored = useRef<string | null>(null);
  const [storageIssue, setStorageIssue] = useState('');
  const [saved, setSaved] = useState(false);
  const lastStored = useRef<string | null>(null);
  const blocked = useRef(false);
  const [previous, setPrevious] = useState<AssetDraft | null>(null);
  const [effectFilter, setEffectFilter] = useState('all');
  const [effectQuery, setEffectQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const [styleQuery, setStyleQuery] = useState('');
  const [randomMessage, setRandomMessage] = useState('');
  const [pending, setPending] = useState<{
    title: string;
    draft: AssetDraft;
    action?: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLFieldSetElement>(null);
  const temporal = draft.format !== 'still';
  const category = assetCategories.find((item) => item.id === draft.category)!;
  const subjectIds =
    draft.category === 'effect'
      ? filterEffects(effectFilter, effectQuery).map((item) => item.id)
      : undefined;
  const activeLocks = assetRandomFields(draft).filter((field) =>
    draft.randomLocks.includes(field),
  ).length;

  useEffect(() => {
    document.title =
      '素材・演出発注室 | エフェクト・モノ・モーションの指示書メーカー';
    // Hydrate after the first client render so SSR and the initial markup agree.
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(ASSET_STORAGE_KEY);
        lastStored.current = raw;
        if (raw) {
          setDraft(parseAssetDraft(raw));
          setSaved(true);
        }
      } catch {
        blocked.current = true;
        setStorageIssue(
          '保存データを読み取れないため、自動保存を停止しています。元のデータは上書きしていません。入力内容はJSONで保存できます。',
        );
      }
      try {
        const raw = localStorage.getItem(ASSET_HISTORY_KEY);
        historyStored.current = raw;
        historyRef.current = raw ? parseAssetHistory(raw) : [];
        setHistory(historyRef.current);
      } catch {
        historyBlocked.current = true;
        setHistoryIssue(true);
      }
      setReady(true);
    });
    const onStorage = (event: StorageEvent) => {
      if (
        (event.key === ASSET_HISTORY_KEY || event.key === null) &&
        event.newValue !== historyStored.current
      ) {
        historyBlocked.current = true;
        setHistoryIssue(true);
      }
      if (
        (event.key === ASSET_STORAGE_KEY || event.key === null) &&
        event.newValue !== lastStored.current
      ) {
        blocked.current = true;
        setSaved(false);
        setStorageIssue(
          '別のタブで保存内容が変わりました。上書きを防ぐため自動保存を停止しています。必要ならJSONを保存してから再読み込みしてください。',
        );
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function commit(next: AssetDraft, action = 'edit') {
    const entries = recordAssetHistory(historyRef.current, draft, next, action);
    if (entries !== historyRef.current) {
      historyRef.current = entries;
      setHistory(entries);
      if (ready && !historyBlocked.current) {
        try {
          if (localStorage.getItem(ASSET_HISTORY_KEY) !== historyStored.current)
            throw new Error('History changed in another tab');
          const raw = JSON.stringify(entries);
          localStorage.setItem(ASSET_HISTORY_KEY, raw);
          historyStored.current = raw;
        } catch {
          historyBlocked.current = true;
          setHistoryIssue(true);
        }
      }
    }
    setDraft(next);
    setSaved(false);
    if (!ready || blocked.current) return;
    try {
      if (localStorage.getItem(ASSET_STORAGE_KEY) !== lastStored.current) {
        blocked.current = true;
        setSaved(false);
        setStorageIssue(
          '別のタブで保存内容が変わりました。入力内容をJSONで保存してから再読み込みしてください。',
        );
        return;
      }
      const raw = serializeAssetDraft(next);
      localStorage.setItem(ASSET_STORAGE_KEY, raw);
      lastStored.current = raw;
      setSaved(true);
      setStorageIssue('');
    } catch {
      setSaved(false);
      setStorageIssue(
        'ブラウザに保存できませんでした。ページを閉じる前にJSONを保存してください。',
      );
    }
  }

  function update(patch: Partial<AssetDraft>) {
    commit(
      { ...draft, ...patch },
      `edit:${Object.keys(patch).sort().join(',')}`,
    );
  }

  function runRandom(field?: AssetRandomField) {
    const styleIds =
      styleFilter !== 'all' || styleQuery.trim()
        ? filterAssetStyles(styleFilter, styleQuery).map((item) => item.id)
        : undefined;
    const result = randomizeAsset(draft, { field, subjectIds, styleIds });
    if (!result.changed.length) {
      const message = tr(
        '変更できる候補がありません。ロックや絞り込みを確認してください。',
      );
      setRandomMessage(message);
      toast.add({ title: message, type: 'info' });
      return;
    }
    setPrevious(draft);
    commit(result.draft, 'random');
    const message = field
      ? `${field === 'subject' ? category[language] : tr(selectLabels[field])}${tr('をランダムに変更しました。', ' randomized.')}`
      : `${result.changed.length}${tr('項目をランダムに変更しました。', ' fields randomized.')}`;
    setRandomMessage(message);
  }

  function toggleRandomLock(field: AssetRandomField) {
    const locked = draft.randomLocks.includes(field);
    update({
      randomLocks: locked
        ? draft.randomLocks.filter((item) => item !== field)
        : [...draft.randomLocks, field],
    });
  }

  function select(field: AssetSelectField, optional = true) {
    const label =
      field === 'ratio' && draft.format === 'sprites'
        ? tr('1コマの縦横比')
        : tr(selectLabels[field]);
    return (
      <div className="min-w-0 text-sm font-medium" key={field}>
        <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
          <label htmlFor={`asset-${field}`}>{label}</label>
          {field !== 'format' && (
            <RandomActions
              field={field}
              label={label}
              locked={draft.randomLocks.includes(field)}
              disabled={false}
              onToggle={toggleRandomLock}
              onRandom={runRandom}
            />
          )}
        </div>
        <select
          id={`asset-${field}`}
          className={`${fieldClass} font-normal`}
          value={draft[field]}
          onChange={(event) => update({ [field]: event.target.value })}
        >
          {optional && <option value="">{tr('指定なし')}</option>}
          {assetChoices[field].map((option) => (
            <option value={option.id} key={option.id}>
              {option[language]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.add({ title: tr('コピーしました'), type: 'success' });
    } catch {
      toast.add({
        title: tr('コピーできませんでした'),
        description: tr(
          '出力欄を選択してコピーするか、TXTで保存してください。',
        ),
        type: 'error',
      });
    }
  }

  function replace(next: AssetDraft) {
    setPrevious(draft);
    commit(next, pending?.action ?? 'replace');
    setPending(null);
    setRandomMessage('');
    toast.add({
      title: tr('設定を反映しました。「元に戻す」で戻せます。'),
      type: 'success',
    });
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > ASSET_MAX_FILE_BYTES)
        throw new Error(tr('ファイルは100KB以内にしてください。'));
      setPending({
        title: tr('JSONの設定を読み込みますか？'),
        draft: parseAssetDraft(await file.text()),
      });
    } catch (error) {
      toast.add({
        title: tr('読み込めませんでした'),
        description:
          error instanceof SyntaxError
            ? tr('JSONの形式が正しくありません。現在の入力は変更していません。')
            : error instanceof Error
              ? error.message
              : tr('ファイルを確認してください。'),
        type: 'error',
      });
    }
  }

  function jump(target: 'preview' | 'input') {
    const element =
      target === 'preview' ? previewRef.current : inputRef.current;
    element?.scrollIntoView({ behavior: 'auto', block: 'start' });
    element?.focus({ preventScroll: true });
  }

  return (
    <>
      <a
        href="#asset-inputs"
        className="sr-only z-[100] rounded-lg bg-card p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {tr('素材の設定へ移動')}
      </a>
      <div className="asset-studio min-h-screen bg-background text-foreground [overflow-wrap:anywhere]">
        <StudioHeader
          title="素材・演出発注室"
          subtitle="ASSET & MOTION BRIEF STUDIO"
          icon={<Layers3 className="size-5" />}
          roomHref={characterHref}
          roomLabel={tr('キャラクター発注室', 'Character Brief Studio')}
          roomIcon={<Sparkles className="size-4" aria-hidden="true" />}
          language={language}
          dark={dark}
          onToggleLanguage={toggleLanguage}
          onToggleColorMode={toggleColorMode}
          onChangelog={() => setMenu('changelog')}
          onHelp={() => setMenu('help')}
          onHistory={() => setMenu('history')}
          onSaveLoad={() => setMenu('save')}
        />

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-7 sm:px-8 sm:pt-9 lg:pb-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {tr('キャラクターなしの素材づくり')}
              </p>
              <h2 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                {tr('光も、モノも、動きも。')}
                <br className="sm:hidden" />
                {tr('つくりたい演出を指示書に。')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {tr('項目を選ぶだけで、日本語・英語のプロンプトが完成。')}
                <br className="hidden sm:block" />
                {tr('画像・動画生成や、制作の発注に使えます。')}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium">
              <Ban className="size-4 text-primary" aria-hidden="true" />
              {tr('人物・キャラクターを除外')}
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-border py-2">
            <output className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saved && (
                <Check className="size-3.5 text-primary" aria-hidden="true" />
              )}
              {!ready
                ? tr('保存データを確認中…')
                : storageIssue
                  ? tr('自動保存を利用できません')
                  : saved
                    ? tr('このブラウザに保存済み')
                    : tr('入力内容はこのブラウザに自動保存')}
            </output>
            <div className="flex flex-wrap gap-1">
              <Button
                disabled={!previous}
                variant="ghost"
                className="min-h-11 text-xs"
                onClick={() => {
                  if (previous) {
                    commit(previous, 'undo');
                    setPrevious(null);
                    setRandomMessage(tr('直前の設定に戻しました。'));
                  }
                }}
              >
                <RotateCcw />
                {tr('元に戻す')}
              </Button>
              <Button
                disabled={!ready}
                variant="ghost"
                className="min-h-11 text-xs"
                onClick={() =>
                  setPending({
                    title: tr('設定を初期状態に戻しますか？'),
                    draft: createAssetDraft(),
                  })
                }
              >
                {tr('初期化')}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label={tr('素材・演出のJSONを読み込む')}
                onChange={(event) => {
                  void importFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
          </div>
          {storageIssue && (
            <p
              role="alert"
              className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed"
            >
              {tr(storageIssue)}
            </p>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_430px]">
            <fieldset
              ref={inputRef}
              id="asset-inputs"
              tabIndex={-1}
              disabled={!ready}
              className="m-0 min-w-0 scroll-mt-[calc(var(--studio-header-height,64px)+1rem)] space-y-4 border-0 p-0 outline-none"
              aria-label={tr('素材・演出の設定')}
            >
              <Section
                number="01"
                title={tr('何をつくる？')}
                hint={tr(
                  '制作対象と出力の種類を選びます。対象を切り替えても、各対象の詳細は保持されます。',
                )}
              >
                <fieldset
                  className="grid grid-cols-3 gap-2"
                  aria-label={tr('制作対象')}
                >
                  {assetCategories.map((item) => {
                    const Icon = categoryIcons[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={draft.category === item.id}
                        onClick={() => update({ category: item.id })}
                        className={`min-w-0 rounded-lg border p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-primary sm:p-4 ${draft.category === item.id ? 'border-primary bg-secondary text-primary' : 'border-border hover:bg-muted'}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Icon className="size-5" aria-hidden="true" />
                          {draft.category === item.id && (
                            <Check className="size-3.5" aria-hidden="true" />
                          )}
                        </div>
                        <span className="block text-xs font-bold sm:text-sm">
                          {item[language]}
                        </span>
                        <span className="mt-1.5 hidden text-[11px] leading-relaxed text-muted-foreground sm:block">
                          {tr(item.description)}
                        </span>
                      </button>
                    );
                  })}
                </fieldset>
                <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      className="min-h-11"
                      onClick={() => runRandom()}
                    >
                      <Dices />
                      {tr('おまかせランダム')}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {activeLocks}
                      {tr('項目をロック中')}
                    </span>
                    {draft.randomLocks.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 text-xs"
                        onClick={() => update({ randomLocks: [] })}
                      >
                        {tr('すべてのロックを解除')}
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {tr(
                      '鍵で項目を固定、サイコロで1項目だけ変更。出力の種類・自由入力・禁止事項は保持します。詳細が入力済みの対象は、おまかせでは種類を変えません。',
                    )}
                  </p>
                  {draft.category === 'effect' && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {tr(
                        'エフェクトの種類は、下のカテゴリ・検索結果から選びます。',
                      )}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <output aria-live="polite" className="text-xs text-primary">
                      {randomMessage}
                    </output>
                    {previous && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 text-xs"
                        onClick={() => {
                          commit(previous, 'undo');
                          setPrevious(null);
                          setRandomMessage(tr('直前の設定に戻しました。'));
                        }}
                      >
                        <RotateCcw />
                        {tr('直前の設定に戻す')}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <AssetSubjectPicker
                    draft={draft}
                    filter={effectFilter}
                    onFilter={setEffectFilter}
                    query={effectQuery}
                    onQuery={setEffectQuery}
                    onChange={(id) =>
                      update({
                        subjects: { ...draft.subjects, [draft.category]: id },
                      })
                    }
                    actions={
                      <RandomActions
                        field="subject"
                        label={
                          language === 'ja'
                            ? `${category.ja}の種類`
                            : `${category.en} type`
                        }
                        locked={draft.randomLocks.includes('subject')}
                        disabled={subjectIds?.length === 0}
                        onToggle={toggleRandomLock}
                        onRandom={runRandom}
                      />
                    }
                  />
                  {select('format', false)}
                </div>
                <div className="mt-4">
                  <TextField
                    label={tr('対象の詳細')}
                    value={draft.details[draft.category]}
                    onChange={(value) =>
                      update({
                        details: { ...draft.details, [draft.category]: value },
                      })
                    }
                    placeholder={
                      {
                        effect: tr(
                          '例：小さな星形の光。中心は白く、外側に青い残光。',
                        ),
                        object: tr(
                          '例：丸いガラス瓶。コルク栓と真鍮の飾り。中には青い液体。',
                        ),
                        motion: tr(
                          '例：細い光のリボンが、空間に弧を描いて流れる。',
                        ),
                      }[draft.category]
                    }
                  />
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <WandSparkles className="size-3.5" aria-hidden="true" />
                    {tr('テンプレートから始める')}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {assetPresets
                      .filter((preset) => preset.category === draft.category)
                      .map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          className="rounded-lg border border-border p-3 text-left transition hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-primary"
                          onClick={() =>
                            setPending({
                              title:
                                language === 'ja'
                                  ? `「${preset.name}」を適用しますか？`
                                  : `Apply “${tr(preset.name)}”?`,
                              draft: draftFromAssetPreset(preset.id),
                            })
                          }
                        >
                          <span className="flex items-center justify-between gap-1 text-xs font-bold">
                            {tr(preset.name)}
                            <ArrowRight
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                            {tr(preset.description)}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </Section>

              <Section
                number="02"
                title={tr('見た目を決める')}
                hint={tr(
                  '必要な項目だけ選択。指定なしの項目はプロンプトに含めません。',
                )}
              >
                <AssetStylePicker
                  value={draft.style}
                  onChange={(style) => update({ style })}
                  category={styleFilter}
                  onCategory={setStyleFilter}
                  query={styleQuery}
                  onQuery={setStyleQuery}
                  actions={
                    <RandomActions
                      field="style"
                      label={tr('画風')}
                      locked={draft.randomLocks.includes('style')}
                      disabled={
                        filterAssetStyles(styleFilter, styleQuery).length === 0
                      }
                      onToggle={toggleRandomLock}
                      onRandom={runRandom}
                    />
                  }
                />
                {draft.category === 'effect' && (
                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    {select('effectShape')}
                    {select('density')}
                  </div>
                )}
                {draft.category === 'object' && (
                  <div className="mb-4 grid gap-4 sm:grid-cols-2">
                    {select('material')}
                    {select('condition')}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {select('palette')}
                  {select('lighting')}
                  {select('background')}
                </div>
              </Section>

              <Section
                number="03"
                title={tr('構図とサイズ')}
                hint={tr('素材をどこから、どの範囲まで見せるかを指定します。')}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {select('camera')}
                  {select('framing')}
                  {select('ratio')}
                </div>
              </Section>

              {(temporal || draft.category === 'motion') && (
                <Section
                  number="04"
                  title={
                    temporal ? tr('動きと時間の設計') : tr('一瞬の動きを描く')
                  }
                  hint={
                    temporal
                      ? tr(
                          '動き・速度・再生方法を指定。開始から終了までの流れも言葉で補えます。',
                        )
                      : tr(
                          '静止画に収めたい動きを指定します。時間やループを指定するには、出力の種類を動画に切り替えてください。',
                        )
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {select('motion')}
                    {select('direction')}
                    {select('speed')}
                    {temporal && select('timing')}
                    {temporal && (
                      <>
                        {draft.format === 'video' ? (
                          <>
                            {select('cameraMotion')}
                            {select('duration', false)}
                          </>
                        ) : (
                          select('frameCount', false)
                        )}
                        {select('fps', false)}
                        {select('loop', false)}
                      </>
                    )}
                  </div>
                  {draft.format === 'sprites' && (
                    <p className="mt-4 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                      {tr('横4列 × 縦')}
                      {Number(draft.frameCount) / 4}
                      {tr(
                        '行、左上から再生順に配置。カメラ・縮尺・基準位置を固定したシートとして出力します。',
                      )}
                    </p>
                  )}
                  {temporal && (
                    <div className="mt-5 space-y-3 border-t border-border pt-4">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {tr('動きの流れ（任意）')}
                      </p>
                      {(['start', 'peak', 'end'] as const).map((phase) => (
                        <TextField
                          key={phase}
                          label={
                            {
                              start: tr('開始'),
                              peak: tr('展開・ピーク'),
                              end: tr('終了'),
                            }[phase]
                          }
                          value={draft.phases[phase]}
                          onChange={(value) =>
                            update({
                              phases: { ...draft.phases, [phase]: value },
                            })
                          }
                          placeholder={
                            {
                              start: tr('例：中心に小さな光が集まる'),
                              peak: tr('例：輪が広がり、細かな粒子が弾ける'),
                              end:
                                draft.loop === 'seamless'
                                  ? tr(
                                      '例：開始時の形と動きにつながる状態に戻る',
                                    )
                                  : tr('例：余韻を残してゆっくり消える'),
                            }[phase]
                          }
                        />
                      ))}
                    </div>
                  )}
                </Section>
              )}

              <Section
                number={temporal || draft.category === 'motion' ? '05' : '04'}
                title={tr('追加指示と禁止事項')}
                hint={tr(
                  'こだわりや、描いてほしくない要素を仕上げに追加します。',
                )}
              >
                <TextField
                  label={tr('追加の指示')}
                  value={draft.notes}
                  onChange={(notes) => update({ notes })}
                  placeholder={tr(
                    '例：ゲーム画面に重ねるため、周囲に十分な余白を確保する。',
                  )}
                  rows={3}
                />
                <div className="mt-5 rounded-lg bg-secondary/60 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Ban className="size-4" aria-hidden="true" />
                    {tr('人物・キャラクター・マスコットは常に除外')}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {tr(
                      '顔・手・人体のシルエット・擬人化も、禁止事項に含まれます。',
                    )}
                  </p>
                </div>
                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium">
                    {tr('追加で除外するもの')}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {assetChoices.exclusions
                      .filter(
                        (item) =>
                          temporal || !['flicker', 'shake'].includes(item.id),
                      )
                      .map((item) => (
                        <label
                          key={item.id}
                          className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs ${draft.exclusions.includes(item.id) ? 'border-primary/30 bg-secondary/50' : 'border-border'}`}
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--primary)]"
                            checked={draft.exclusions.includes(item.id)}
                            onChange={(event) =>
                              update({
                                exclusions: event.target.checked
                                  ? [...draft.exclusions, item.id]
                                  : draft.exclusions.filter(
                                      (id) => id !== item.id,
                                    ),
                              })
                            }
                          />
                          {item[language]}
                        </label>
                      ))}
                  </div>
                </fieldset>
                <div className="mt-4">
                  <TextField
                    label={tr('その他の禁止事項')}
                    value={draft.negativeNotes}
                    onChange={(negativeNotes) => update({ negativeNotes })}
                    placeholder={tr('例：台座、床面の反射、過剰なレンズフレア')}
                  />
                </div>
              </Section>
            </fieldset>

            <aside
              ref={previewRef}
              id="asset-preview"
              tabIndex={-1}
              aria-labelledby="asset-preview-title"
              className="min-w-0 scroll-mt-[calc(var(--studio-header-height,64px)+1rem)] space-y-4 outline-none lg:sticky lg:top-[calc(var(--studio-header-height,64px)+1.5rem)]"
            >
              <AssetOutputPreview
                draft={draft}
                ready={ready}
                onCopy={(text) => {
                  void copy(text);
                }}
                onDownload={download}
              />
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold">
                  <Lightbulb
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  {tr('使い方のヒント')}
                </h3>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <li>{tr('対象と仕上がりを選ぶ')}</li>
                  <li>{tr('指示書をコピーする')}</li>
                  <li>{tr('生成サービスや制作依頼に貼り付ける')}</li>
                </ol>
                <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {tr(
                    'このページは指示書を作るツールです。画像・動画の生成は行いません。入力内容はこのブラウザに保存されます。',
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 w-full lg:hidden"
                onClick={() => jump('input')}
              >
                <ArrowLeft />
                {tr('設定に戻る')}
              </Button>
            </aside>
          </div>
          <footer className="mt-8 border-t border-border pt-5 text-center text-xs text-muted-foreground">
            素材・演出発注室 <span className="mx-2">/</span>{' '}
            {tr('キャラクターなしの、イラスト・映像指示書メーカー')}
          </footer>
        </main>
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <span className="text-xs font-medium">
            {category[language]}
            {tr('の指示書')}
          </span>
          <Button className="min-h-11" onClick={() => jump('preview')}>
            <FileText />
            {tr('指示書を見る')}
            <ArrowRight />
          </Button>
        </div>
      </div>

      <AssetStudioMenu
        panel={menu}
        onClose={() => setMenu(null)}
        ready={ready}
        entries={history}
        historyIssue={historyIssue}
        onExport={() =>
          download(
            serializeAssetDraft(draft),
            'asset-brief.json',
            'application/json',
          )
        }
        onImport={() => {
          setMenu(null);
          fileInput.current?.click();
        }}
        onRestore={(entry) => {
          setMenu(null);
          setPending({
            title: tr(
              'この履歴の設定を復元しますか？',
              'Restore these settings from history?',
            ),
            draft: entry.draft,
            action: 'history',
          });
        }}
      />
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent className="asset-studio data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                '現在の全設定を、以下の内容で置き換えます。反映後は「元に戻す」で直前の設定に戻せます。',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-relaxed">
            {pending && buildAssetPrompt(pending.draft, language).full}
          </pre>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">
              {tr('キャンセル')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => {
                if (pending) replace(pending.draft);
              }}
            >
              {tr('設定を置き換える')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </>
  );
}

export function AssetStudio({
  characterHref = '/',
}: {
  characterHref?: string;
}) {
  return (
    <AssetUiProvider>
      <AssetStudioContent characterHref={characterHref} />
    </AssetUiProvider>
  );
}
