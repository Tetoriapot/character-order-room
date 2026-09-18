'use client';

import { Check, FileSearch, Lightbulb, Lock, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { optionsByField } from '@/data/options';
import { confidenceLabel } from '@/lib/inference/score-confidence';
import { ruleBasedInferenceEngine } from '@/lib/inference/infer-from-note';
import { validateInferenceResult } from '@/lib/inference/validate-inference-result';
import { inferenceDecisionKey, multiValueInferenceFields } from '@/lib/inference/types';
import type {
  InferenceDecision,
  InferenceEngine,
  InferenceField,
  InferenceLevel,
  InferenceMergeMode,
  InferenceResult,
  InferredValue,
} from '@/lib/inference/types';
import type { CharacterDraft, LockKey, UiLanguage } from '@/lib/character-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SingleSelect } from './form-controls';

const fieldLabels: Record<InferenceField, { ja: string; en: string }> = {
  gender: { ja: '性別・表現', en: 'Gender / presentation' },
  ageGroup: { ja: '年齢層', en: 'Age group' },
  species: { ja: '種族', en: 'Species' },
  build: { ja: '体格', en: 'Build' },
  skinTone: { ja: '肌の印象', en: 'Skin tone' },
  personality: { ja: 'キャラクターの印象', en: 'Character traits' },
  hairColors: { ja: '髪色', en: 'Hair color' },
  hairstyle: { ja: '髪型', en: 'Hairstyle' },
  eyeColor: { ja: '目の色', en: 'Eye color' },
  eyeShape: { ja: '目の形', en: 'Eye shape' },
  faceFeatures: { ja: '顔の特徴', en: 'Facial features' },
  outfit: { ja: '衣装', en: 'Outfit' },
  outfitColors: { ja: '衣装の色', en: 'Outfit colors' },
  outfitDetails: { ja: '衣装の詳細', en: 'Outfit details' },
  accessories: { ja: 'アクセサリー', en: 'Accessories' },
  expression: { ja: '表情', en: 'Expression' },
  pose: { ja: 'ポーズ', en: 'Pose' },
  gaze: { ja: '視線', en: 'Gaze' },
  background: { ja: '背景', en: 'Background' },
  timeOfDay: { ja: '時間帯', en: 'Time of day' },
  lighting: { ja: '光・演出', en: 'Lighting & effects' },
  composition: { ja: '構図', en: 'Composition' },
  negatives: { ja: '禁止事項', en: 'Exclusions' },
};

const levelOptions: Array<{
  id: InferenceLevel;
  labelJa: string;
  labelEn: string;
  hintJa: string;
  hintEn: string;
}> = [
  { id: 'strict', labelJa: '厳密（strict）', labelEn: 'Strict', hintJa: '明記された内容を中心に読む', hintEn: 'Prioritize directly stated details' },
  { id: 'standard', labelJa: '標準（standard）', labelEn: 'Standard', hintJa: '自然な推測も候補にする', hintEn: 'Include natural inferences' },
  { id: 'rich', labelJa: '豊富（rich）', labelEn: 'Rich', hintJa: '背景・光・構図・衣装詳細まで広く提案', hintEn: 'Suggest scene, lighting, composition, and outfit details' },
];

const sourceMeta = {
  explicit: {
    ja: '明示', en: 'Explicit',
    className: 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  inferred: {
    ja: '推測', en: 'Inferred',
    className: 'border-sky-600/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  suggested: {
    ja: '提案', en: 'Suggested',
    className: 'border-violet-600/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
} as const;

const candidateKey = (value: InferredValue) => inferenceDecisionKey(value);

const initialDecisions = (result: InferenceResult) => Object.fromEntries(
  result.values.map((value) => [candidateKey(value), {
    valueId: value.valueId,
    adopted: Boolean(value.adopted),
    locked: Boolean(value.locked),
  } satisfies InferenceDecision]),
);

const warningForDisplay = (warning: string, language: UiLanguage) => {
  if (language === 'ja') return warning;
  const negated = warning.match(/^「(.+)」は否定表現/u);
  if (negated) return `“${negated[1]}” was excluded because it is negated.`;
  if (warning.includes('現在の年齢区分では')) return 'A gender-neutral teen value is not available in the current form, so this age was left unset. Use 少年 or 少女 to specify it.';
  if (warning.includes('対応する項目を現在のデータから')) return 'A matching option could not be found in the current form data.';
  if (warning.includes('優先し、同じ項目')) return 'The highest-priority option was kept and conflicting alternatives were organized.';
  if (warning.includes('対照的な候補')) return 'These candidates may conflict; review them before applying.';
  if (warning.includes('競合するため')) return 'Conflicting candidates were resolved using source and confidence priority.';
  if (warning.includes('現在の辞書で読み取れる表現')) return 'No matching phrase was found in the current Japanese dictionary.';
  if (warning.includes('設定メモを入力')) return 'Enter a character note.';
  return 'Review the inferred candidates before applying.';
};

export function CharacterNoteInferencePanel({
  language,
  draft,
  locks,
  engine = ruleBasedInferenceEngine,
  onApply,
}: {
  language: UiLanguage;
  draft: CharacterDraft;
  locks: Partial<Record<LockKey, boolean>>;
  engine?: InferenceEngine;
  onApply: (
    result: InferenceResult,
    decisions: Record<string, InferenceDecision>,
    mode: InferenceMergeMode,
  ) => boolean;
}) {
  const tr = (ja: string, en: string) => language === 'ja' ? ja : en;
  const [note, setNote] = useState('');
  const [level, setLevel] = useState<InferenceLevel>('standard');
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [decisions, setDecisions] = useState<Record<string, InferenceDecision>>({});
  const [mergeMode, setMergeMode] = useState<InferenceMergeMode>('overwrite');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const analysisRequestRef = useRef(0);

  const adoptedCount = result?.values.reduce((count, value) =>
    count + Number(Boolean(decisions[candidateKey(value)]?.adopted)), 0) ?? 0;
  const lockedAdoptedCount = result?.values.reduce((count, value) =>
    count + Number(Boolean(decisions[candidateKey(value)]?.adopted) && Boolean(locks[value.category])), 0) ?? 0;
  const applicableAdoptedCount = adoptedCount - lockedAdoptedCount;
  const groupedValues = useMemo(() => {
    if (!result) return [];
    const groups = new Map<InferenceField, InferredValue[]>();
    result.values.forEach((value) => {
      const group = groups.get(value.category) ?? [];
      group.push(value);
      groups.set(value.category, group);
    });
    return [...groups.entries()];
  }, [result]);

  useEffect(() => {
    if (!result) return;
    const frame = window.requestAnimationFrame(() => resultHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const analyze = async () => {
    const input = { text: note, level } as const;
    const requestId = ++analysisRequestRef.current;
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const received = await engine.infer(input);
      if (requestId !== analysisRequestRef.current) return;
      const next = validateInferenceResult(received, input);
      setResult(next);
      setDecisions(initialDecisions(next));
    } catch {
      if (requestId !== analysisRequestRef.current) return;
      setAnalysisError(tr('設定メモを読み取れませんでした。内容を確認して、もう一度お試しください。', 'The note could not be read. Check it and try again.'));
    } finally {
      if (requestId === analysisRequestRef.current) setAnalyzing(false);
    }
  };

  const toggleAdopted = (value: InferredValue, adopted: boolean) => {
    const key = candidateKey(value);
    setDecisions((current) => {
      const next = { ...current };
      if (adopted && !multiValueInferenceFields.has(value.category)) {
        result?.values.forEach((candidate) => {
          if (candidate.category !== value.category) return;
          const candidateId = candidateKey(candidate);
          next[candidateId] = { ...next[candidateId], adopted: false };
        });
      }
      next[key] = { ...next[key], adopted };
      return next;
    });
  };

  const changeCandidate = (value: InferredValue, valueId: string) => {
    const key = candidateKey(value);
    setDecisions((current) => ({
      ...current,
      [key]: { ...current[key], valueId, adopted: true },
    }));
  };

  const toggleCategoryLock = (category: InferenceField, locked: boolean) => {
    setDecisions((current) => {
      const next = { ...current };
      result?.values.forEach((value) => {
        if (value.category !== category) return;
        const key = candidateKey(value);
        next[key] = { ...next[key], locked };
      });
      return next;
    });
  };

  const resetResult = () => {
    setResult(null);
    setDecisions({});
  };

  const updateNote = (value: string) => {
    analysisRequestRef.current += 1;
    setAnalyzing(false);
    setAnalysisError('');
    setNote(value.slice(0, 5000));
    if (result) resetResult();
  };

  const updateLevel = (value: InferenceLevel) => {
    analysisRequestRef.current += 1;
    setAnalyzing(false);
    setAnalysisError('');
    setLevel(value);
    if (result) resetResult();
  };

  const currentLabels = (category: InferenceField) => {
    const current = draft[category];
    const ids = Array.isArray(current) ? current : typeof current === 'string' && current ? [current] : [];
    return ids.map((id) => {
      const option = optionsByField[category]?.find((item) => item.id === id);
      return language === 'ja' ? option?.labelJa ?? id : option?.labelEn ?? id;
    });
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[22px] border border-primary/20 bg-card shadow-[0_12px_34px_rgba(78,42,68,0.06)]">
        <div className="border-b border-border bg-primary/[0.045] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-primary"><FileSearch className="size-4" />{tr('設定メモを読み取る', 'Read a character note')}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr('自由文から候補を作ります。フォームは「反映」を押すまで変わりません。', 'Create candidates from free text. The form will not change until you apply them.')}</p>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="character-note" className="text-sm font-bold">{tr('設定メモ', 'Character note')}</label>
              <span className="text-xs text-muted-foreground">{note.length.toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')} / 5000</span>
            </div>
            <Textarea
              id="character-note"
              value={note}
              onChange={(event) => updateNote(event.target.value)}
              placeholder={tr('例：30代くらいの男。疲れている教師。眼鏡。髪は黒くて少し長い。', 'Japanese example: 30代くらいの男。疲れている教師。眼鏡。髪は黒くて少し長い。')}
              className="min-h-36 resize-y rounded-2xl bg-background text-base leading-7"
              maxLength={5000}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-bold">{tr('読み取りレベル', 'Reading level')}</legend>
            <RadioGroup
              value={level}
              onValueChange={(value) => value && updateLevel(value as InferenceLevel)}
              className="mt-2 grid gap-2 sm:grid-cols-3"
            >
              {levelOptions.map((option) => (
                <label htmlFor={`inference-level-${option.id}`} key={option.id} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${level === option.id ? 'border-primary bg-primary/[0.055]' : 'border-border bg-background hover:border-primary/35'}`}>
                  <RadioGroupItem id={`inference-level-${option.id}`} value={option.id} aria-labelledby={`inference-level-${option.id}-label`} aria-describedby={`inference-level-${option.id}-hint`} className="mt-0.5" />
                  <span><span id={`inference-level-${option.id}-label`} className="block text-sm font-bold">{language === 'ja' ? option.labelJa : option.labelEn}</span><span id={`inference-level-${option.id}-hint`} className="mt-1 block text-xs leading-relaxed text-muted-foreground">{language === 'ja' ? option.hintJa : option.hintEn}</span></span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><span>{tr('初期版は日本語の設定メモに対応しています。外部AIやサーバーへ送らず、この端末内の辞書とルールだけで解析します。', 'This initial version reads Japanese notes using only local dictionaries and rules. Nothing is sent to an external AI or server.')}</span></p>
            <Button className="min-h-11 shrink-0 gap-2 rounded-xl" disabled={!note.trim() || analyzing} onClick={() => void analyze()}><Sparkles className="size-4" />{analyzing ? tr('読み取り中…', 'Reading…') : tr('設定を読み取る', 'Read settings')}</Button>
          </div>
          {analysisError && <p role="alert" className="text-sm font-semibold text-destructive">{analysisError}</p>}
        </div>
      </section>

      {result && (
        <section className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_12px_34px_rgba(78,42,68,0.05)]">
          <div className="flex flex-col gap-3 border-b border-border bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 ref={resultHeadingRef} tabIndex={-1} className="text-sm font-bold outline-none">{tr('推測結果', 'Inferred candidates')}</h2>
              <output className="mt-1 block text-sm text-muted-foreground">
                {tr(
                  `${result.values.length}件を表示・${adoptedCount}件を採用中${lockedAdoptedCount ? `（ロック済み${lockedAdoptedCount}件は反映対象外）` : ''}`,
                  `${result.values.length} shown · ${adoptedCount} selected${lockedAdoptedCount ? ` · ${lockedAdoptedCount} locked and excluded` : ''}`,
                )}
              </output>
            </div>
            <Button variant="ghost" size="sm" className="min-h-11 gap-2 rounded-xl" onClick={resetResult}><RotateCcw className="size-4" />{tr('結果をクリア', 'Clear results')}</Button>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            {result.warnings.length > 0 && (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3.5">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300"><Lightbulb className="size-4" />{tr('確認ポイント', 'Review notes')}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {result.warnings.map((warning) => <li key={warning}>• {warningForDisplay(warning, language)}</li>)}
                </ul>
              </div>
            )}

            {groupedValues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-7 text-center">
                <FileSearch className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-bold">{tr('候補を見つけられませんでした', 'No candidates found')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tr('表現を少し具体的にするか、通常入力で設定してください。', 'Try more specific wording or use the regular form.')}</p>
              </div>
            ) : groupedValues.map(([category, candidates]) => {
              const categoryLocked = Boolean(locks[category]);
              const inferredLock = candidates.some((value) => decisions[candidateKey(value)]?.locked);
              const categoryHasAdopted = candidates.some((value) => decisions[candidateKey(value)]?.adopted);
              const categoryLabel = language === 'ja' ? fieldLabels[category].ja : fieldLabels[category].en;
              const existingLabels = currentLabels(category);
              return (
                <div key={category}>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold">{categoryLabel}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tr('現在：', 'Current: ')}{existingLabels.length ? existingLabels.join(tr('、', ', ')) : tr('未設定', 'Not set')}
                      </p>
                    </div>
                    {categoryLocked ? (
                      <Badge variant="outline" className="gap-1.5"><Lock className="size-3" />{tr('フォームでロック済み', 'Already locked in form')}</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant={inferredLock ? 'secondary' : 'outline'}
                        size="sm"
                        className="min-h-11 gap-2 rounded-xl"
                        aria-label={tr(`${categoryLabel}を反映後にロック`, `Lock ${categoryLabel} after applying`)}
                        aria-pressed={inferredLock}
                        disabled={!categoryHasAdopted}
                        onClick={() => toggleCategoryLock(category, !inferredLock)}
                      >
                        {inferredLock ? <Check className="size-4" /> : <Lock className="size-4" />}
                        {tr('反映後、この項目をロック', 'Lock this field after applying')}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {candidates.map((value) => {
                      const key = candidateKey(value);
                      const decision = decisions[key] ?? { valueId: value.valueId, adopted: false, locked: false };
                      const options = optionsByField[value.category] ?? [];
                      const selectedByOtherCandidates = new Set(candidates
                        .filter((candidate) => candidateKey(candidate) !== key)
                        .filter((candidate) => decisions[candidateKey(candidate)]?.adopted)
                        .map((candidate) => decisions[candidateKey(candidate)]?.valueId)
                        .filter((valueId): valueId is string => Boolean(valueId)));
                      const availableOptions = options.filter((option) =>
                        option.id === decision.valueId || !selectedByOtherCandidates.has(option.id),
                      );
                      const currentOption = options.find((option) => option.id === decision.valueId);
                      const currentLabelJa = currentOption?.labelJa ?? value.labelJa ?? decision.valueId;
                      const currentLabelEn = currentOption?.labelEn ?? value.labelEn ?? decision.valueId;
                      const source = sourceMeta[value.source];
                      const manuallyChanged = decision.valueId !== value.valueId;
                      const checkboxId = `inference-adopt-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
                      const checkboxLabelId = `${checkboxId}-label`;
                      return (
                        <article key={key} className={`rounded-2xl border p-3.5 transition sm:p-4 ${decision.adopted ? 'border-primary/25 bg-primary/[0.035]' : 'border-border bg-muted/15 opacity-75'}`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <label htmlFor={checkboxId} className={`flex min-h-11 items-center gap-3 sm:min-w-36 ${categoryLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <Checkbox
                                id={checkboxId}
                                checked={decision.adopted}
                                disabled={categoryLocked}
                                aria-labelledby={checkboxLabelId}
                                onCheckedChange={(checked) => toggleAdopted(value, Boolean(checked))}
                              />
                              <span id={checkboxLabelId} className="sr-only">{tr(`${currentLabelJa}を候補に含める`, `Include ${currentLabelEn} as a candidate`)}</span>
                              <span aria-hidden="true" className="text-sm font-bold">{decision.adopted ? tr('採用', 'Selected') : tr('不採用', 'Not selected')}</span>
                            </label>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold">{language === 'ja' ? currentLabelJa : currentLabelEn}</p>
                                {manuallyChanged ? (
                                  <Badge variant="outline" className="border-primary/20 bg-primary/8 text-primary">{tr('手動選択', 'Manual choice')}</Badge>
                                ) : (
                                  <>
                                    <Badge variant="outline" className={source.className}>{language === 'ja' ? source.ja : source.en}</Badge>
                                    <span className="text-xs font-semibold text-muted-foreground">{confidenceLabel(value.confidence, language)} {Math.round(value.confidence * 100)}%</span>
                                  </>
                                )}
                              </div>
                              {!manuallyChanged && (value.evidence || value.reason) && (
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                  {value.evidence && <span className="mr-2 rounded-md bg-muted px-1.5 py-0.5 font-semibold text-foreground/75">「{value.evidence}」</span>}
                                  {language === 'ja' ? value.reason : value.reasonEn ?? value.reason}
                                </p>
                              )}
                              {manuallyChanged && <p className="mt-1.5 text-sm text-muted-foreground">{tr(`自動候補は「${value.labelJa}」でした。`, `The inferred candidate was “${value.labelEn}”.`)}</p>}
                            </div>
                          </div>
                          <div className="mt-3 border-t border-border/70 pt-3">
                            {categoryLocked ? (
                              <div aria-disabled="true" className="flex min-h-11 items-center rounded-xl border border-border bg-muted/35 px-3 text-sm text-muted-foreground">
                                {language === 'ja'
                                  ? options.find((option) => option.id === decision.valueId)?.labelJa ?? value.labelJa
                                  : options.find((option) => option.id === decision.valueId)?.labelEn ?? value.labelEn}
                              </div>
                            ) : (
                              <SingleSelect
                                language={language}
                                field={category}
                                label={tr(`${categoryLabel}の別候補`, `Alternative ${categoryLabel}`)}
                                value={decision.valueId}
                                options={availableOptions}
                                onChange={(next) => changeCandidate(value, next)}
                              />
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {groupedValues.length > 0 && (
            <div className="border-t border-border bg-muted/25 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <p id="inference-merge-label" className="mb-2 block text-sm font-bold">{tr('既存フォームへの反映方法', 'How to merge with the form')}</p>
                  <Select value={mergeMode} onValueChange={(value) => value && setMergeMode(value as InferenceMergeMode)}>
                    <SelectTrigger aria-labelledby="inference-merge-label" className="h-11 w-full rounded-xl bg-card">
                      <SelectValue>{({
                        overwrite: tr('候補がある項目を上書き', 'Overwrite fields with candidates'),
                        append: tr('複数選択は追加・単一選択は空欄だけ', 'Append lists; fill empty single fields'),
                        skip: tr('入力済みの項目はすべてスキップ', 'Skip every field that already has a value'),
                      } as Record<InferenceMergeMode, string>)[mergeMode]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="overwrite" className="min-h-11">{tr('候補がある項目を上書き', 'Overwrite fields with candidates')}</SelectItem>
                      <SelectItem value="append" className="min-h-11">{tr('複数選択は追加・単一選択は空欄だけ', 'Append lists; fill empty single fields')}</SelectItem>
                      <SelectItem value="skip" className="min-h-11">{tr('入力済みの項目はすべてスキップ', 'Skip every field that already has a value')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="min-h-12 gap-2 rounded-xl px-5" disabled={applicableAdoptedCount === 0} onClick={() => onApply(result, decisions, mergeMode)}>
                  <Check className="size-4" />{tr(`${applicableAdoptedCount}件をフォームへ反映`, `Apply ${applicableAdoptedCount} selected`) }
                </Button>
              </div>
              <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><X className="mt-0.5 size-3.5 shrink-0" />{tr('現在ロック中の項目は、どの反映方法でも変更しません。', 'Fields already locked in the form are never changed.')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
