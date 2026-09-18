'use client';

import {
  Ban,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Clipboard,
  CopyPlus,
  Dices,
  Download,
  FileText,
  FolderOpen,
  History,
  Languages,
  Link2,
  Lightbulb,
  Lock,
  Megaphone,
  Moon,
  Palette,
  Pencil,
  Pin,
  PinOff,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Scissors,
  Shirt,
  Smile,
  Sparkles,
  Sun,
  Trash2,
  Trees,
  Upload,
  UserRound,
  Wand2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import {
  ageGroups,
  accessories,
  aspectRatios,
  backgrounds,
  builds,
  cameraAngles,
  compositions,
  eyeColors,
  eyeImpressions,
  eyeShapes,
  englishFor,
  expressions,
  faceFeatures,
  gazes,
  genders,
  hairColors,
  hairEffects,
  hairstyles,
  labelFor,
  lighting,
  negatives,
  outfitColors,
  outfitDetails,
  outfits,
  personalities,
  poses,
  purposes,
  skinTones,
  species,
  styleModifiers,
  styles,
  timesOfDay,
} from '@/data/options';
import {
  builtInPresets,
  defaultDraft,
  purposeRecommendations,
} from '@/data/presets';
import {
  clearGeneratedGap,
  generateBatchVariations,
  generateGap,
  generatedGapConflictsWithAge,
  generatedGapUsesField,
  randomizeAll,
  randomizeField,
  reconcileGeneratedGapDerivedChanges,
  releaseGeneratedGapField,
  resolveDraftConflicts,
  themeById,
  themes,
} from '@/lib/random-engine';
import { analyzePromptNotices, formatProfileOutput } from '@/lib/prompt-engine';
import { buildPromptBlocks, generateStudioPrompts as generatePrompts } from '@/lib/prompt-blocks';
import { findStylePreset } from '@/lib/style-pack';
import { isSceneComposition } from '@/data/camera-expansion';
import type { StylePackSelection } from '@/lib/style-pack-types';
import { applyPurposeRecommendation } from '@/lib/purpose-engine';
import {
  appendHistory,
  DEFAULT_STUDIO_PREFERENCES,
  exportStudioData,
  migrateSnapshot,
  parseHistory,
  parsePresets,
  parseSnapshot,
  parseStudioPreferences,
  STORAGE_KEYS,
} from '@/lib/storage';
import { createEmptyNoteWorkspace } from '@/lib/inference/note-workspace';
import { useStudioAutosave } from '@/hooks/use-studio-autosave';
import { exportStudioBackup, parseStudioBackup, parseAnyStudioImport, WORKSPACE_KEY, RECOVERY_KEY, MAX_BACKUP_BYTES, type StudioWorkspace, type StudioImport } from '@/lib/studio-backup';
import { createShareUrl, prepareShareSnapshot, readShareUrl, MAX_SHARE_URL_LENGTH } from '@/lib/share-snapshot';
import {
  commitEditorTimeline,
  createEditorTimeline,
  redoEditorTimeline,
  replaceEditorTimeline,
  undoEditorTimeline,
} from '@/lib/editor-timeline';
import {
  createBlankSnapshot,
  guidedSectionsForPurpose,
  normalizeGuidedStep,
  selectGuidedPurpose,
} from '@/lib/guided-builder';
import { diffSnapshots, fieldLabels, snapshotSummary, type CharacterChange } from '@/lib/character-insights';
import { getShortcutAction } from '@/lib/shortcuts';
import { mergeInferenceIntoFormState } from '@/lib/inference/merge-into-form-state';
import type {
  InferenceDecision,
  InferenceMergeMode,
  InferenceResult,
} from '@/lib/inference/types';
import { inferenceDecisionKey } from '@/lib/inference/types';
import type {
  CharacterDraft,
  CharacterSnapshot,
  ExportProfile,
  GuidedSectionId,
  HistoryEntry,
  LockKey,
  OutputMode,
  SavedPreset,
  StudioPreferences,
} from '@/lib/character-types';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';
import { CharacterNoteInferencePanel } from './character-note-inference-panel';
import { ChangeList } from './change-list';
import { StylePackPanel } from './style-pack-panel';
import { PromptBlockPreview } from './prompt-block-preview';
import { ChoiceChips, FieldActions, FormRow, SingleSelect } from './form-controls';

const sectionMeta: Array<{
  id: GuidedSectionId;
  labelJa: string;
  labelEn: string;
  shortJa: string;
  shortEn: string;
  icon: ReactNode;
}> = [
  { id: 'purpose', labelJa: '用途', labelEn: 'Purpose', shortJa: '何に使う？', shortEn: 'What is it for?', icon: <Sparkles /> },
  { id: 'style', labelJa: '絵柄', labelEn: 'Style', shortJa: '仕上がりの雰囲気', shortEn: 'Final look', icon: <Palette /> },
  { id: 'character', labelJa: '人物', labelEn: 'Character', shortJa: '年齢・体格・印象', shortEn: 'Age, build, traits', icon: <UserRound /> },
  { id: 'appearance', labelJa: '顔・髪', labelEn: 'Face & Hair', shortJa: '髪色・髪型・瞳', shortEn: 'Hair and eyes', icon: <Scissors /> },
  { id: 'outfit', labelJa: '衣装', labelEn: 'Outfit', shortJa: '服・色・装飾', shortEn: 'Clothing and details', icon: <Shirt /> },
  { id: 'action', labelJa: '表情・ポーズ', labelEn: 'Expression & Pose', shortJa: '仕草と視線', shortEn: 'Gesture and gaze', icon: <Smile /> },
  { id: 'camera', labelJa: 'カメラ', labelEn: 'Camera', shortJa: '角度・構図・縦横', shortEn: 'Angle and framing', icon: <Camera /> },
  { id: 'scene', labelJa: '背景・光', labelEn: 'Background & Light', shortJa: '場所・時間・演出', shortEn: 'Place, time, effects', icon: <Trees /> },
  { id: 'negative', labelJa: '禁止事項', labelEn: 'Exclusions', shortJa: '描いてほしくないもの', shortEn: 'Elements to avoid', icon: <Ban /> },
];

const inferenceSectionByField: Partial<Record<LockKey, GuidedSectionId>> = {
  gender: 'character',
  ageGroup: 'character',
  species: 'character',
  build: 'character',
  skinTone: 'character',
  personality: 'character',
  hairColors: 'appearance',
  hairstyle: 'appearance',
  eyeColor: 'appearance',
  eyeShape: 'appearance',
  faceFeatures: 'appearance',
  outfit: 'outfit',
  outfitColors: 'outfit',
  outfitDetails: 'outfit',
  accessories: 'outfit',
  expression: 'action',
  pose: 'action',
  gaze: 'action',
  composition: 'camera',
  background: 'scene',
  timeOfDay: 'scene',
  lighting: 'scene',
  negatives: 'negative',
};

type StudioOutputMode = OutputMode | 'blocks';
const outputTabs: Array<{ value: StudioOutputMode; labelJa: string; labelEn: string; hintJa: string; hintEn: string }> = [
  { value: 'blocks', labelJa: 'ブロック', labelEn: 'Blocks', hintJa: '内容（日本語）・画風・補助・禁止事項を分離', hintEn: 'Japanese content, English style, helpers, and exclusions' },
  { value: 'ja', labelJa: '日本語', labelEn: 'Japanese', hintJa: '人への依頼・内容確認向け', hintEn: 'For review or a Japanese-language commission' },
  { value: 'en', labelJa: 'English', labelEn: 'English', hintJa: '英語対応の画像生成AI向け', hintEn: 'For image tools that accept natural English' },
  { value: 'both', labelJa: '日英', labelEn: 'JP + EN', hintJa: '共有・保存用の完全版', hintEn: 'Complete bilingual version for sharing' },
  { value: 'short', labelJa: '短縮', labelEn: 'Short', hintJa: '文字数を抑えたいサービス向け', hintEn: 'For tools with tighter prompt limits' },
  { value: 'tags', labelJa: 'タグ', labelEn: 'Tags', hintJa: 'カンマ区切り入力向け', hintEn: 'For comma-separated tag prompts' },
];

const releaseNotes = [
  {
    date: '2026-09-18',
    titleJa: 'カメラ角度30種・構図35種に拡張',
    titleEn: 'Expanded to 30 camera angles and 35 compositions',
    itemsJa: [
      '背面・左右・上方や下方からの視点、目元のアップ、余白、三分割配置、前景を使う構図などを追加しました。',
      'カメラ角度と構図を検索・カテゴリ・お気に入り・最近から選べるようにしました。',
      '背景用の構図は背景プロンプトにも反映し、背景のランダム生成では人物専用の構図を選ばないようにしました。',
    ],
    itemsEn: [
      'Added rear and side viewpoints, elevation variants, eye close-ups, negative space, thirds, and depth compositions.',
      'Find camera and composition options using search, categories, favorites, and recent selections.',
      'Scene-compatible compositions now appear in background prompts; background randomization excludes portrait-only framing.',
    ],
  },
  {
    date: '2026-09-18',
    titleJa: '画風80種・補助30種とブロック出力',
    titleEn: '80 styles, 30 helpers, and block output',
    itemsJa: [
      '絵柄ステップに8カテゴリ・80種の画風を追加。名前・用途・タグ検索、お気に入り、カテゴリ別ランダムに対応しました。',
      '補助30種から最大5件を選択でき、相性のよい3件の提案・目的・注意点を確認できます。補助は自動適用しません。',
      'CONTENT / STYLE / ANTI_AI / AVOIDの表示切替、改行あり・1行・JSONのコピーを追加しました。',
      '選択は自動保存・テンプレ・履歴・バックアップ・共有・変更比較に対応。従来の絵柄入力も保持します。',
    ],
    itemsEn: [
      'Browse 80 styles in 8 categories with search, favorites, and category-weighted random selection.',
      'Choose up to 5 of 30 optional helpers, with three recommendations, intent, and cautions. Nothing is applied automatically.',
      'Toggle CONTENT / STYLE / ANTI_AI / AVOID and copy formatted, one-line, or JSON prompts.',
      'Selections work with autosave, templates, history, backup, sharing, and comparisons. Classic inputs are preserved.',
    ],
  },
  {
    date: '2026-09-18',
    titleJa: '入力の保護・共有前の確認・全変更の比較',
    titleEn: 'Safer drafts, sharing, and complete comparisons',
    itemsJa: [
      '設定メモと採用候補を下書き保存し、保存状態と失敗時の対処を表示するようにしました。',
      '履歴・お気に入り・表示設定を含む完全バックアップと、読込前の確認・復元に対応しました。',
      '共有する自由入力を選び、内容を確認してからリンクを作成できます。受信側でも読込前に変更点を確認できます。',
      '4案の全変更・変更前後・比較表と、スマホで編集位置に戻る操作を追加しました。',
    ],
    itemsEn: [
      'Note drafts and candidate decisions are saved locally with a visible save status and recovery guidance.',
      'Full backups include history, favorites, preferences, and note drafts. Review imports and recover the previous session.',
      'Review shared content and select custom text before copying a link. Recipients review changes before loading it.',
      'Compare every change across four ideas and return to the previous editing position on mobile.',
    ],
  },
  {
    date: '2026-09-18',
    titleJa: 'ランダム生成と用途表記の調整',
    titleEn: 'Random generation and purpose label updates',
    itemsJa: [
      '顔の特徴はランダム生成では未設定にし、ギャップ生成でも自動追加しないようにしました。手動選択とロックは引き続き使えます。',
      '用途の表記を「チャットアプリ用」に統一しました。',
    ],
    itemsEn: [
      'Random generation now leaves facial features blank, and contrast generation no longer adds them. Manual selection and locks remain available.',
      'Simplified the Japanese chat-app purpose label.',
    ],
  },
  {
    date: '2026-09-13',
    titleJa: '設定メモからの自動推測',
    titleEn: 'Character-note inference',
    itemsJa: [
      '自由文の設定メモから、性別・年齢・種族・外見・衣装・性格・背景などの候補を端末内で推測できるようにしました。',
      '明示・推測・提案と信頼度を確認し、採用・不採用・別候補・反映後のロックを選べます。',
      '上書き・追加・スキップを選んで既存フォームへ安全に反映し、そのまま日本語・英語の指示書を作れます。',
      '否定・対比・第三者との関係を正しく読み分け、雨・時間帯・性別未指定の10代も推測できるよう改善しました。',
      '候補の追加反映、保存画面のスクロール、狭い画面のプレビュー操作、選択欄とキーボード操作を修正しました。',
    ],
    itemsEn: [
      'Added on-device inference for gender, age, species, appearance, outfit, traits, scene, and more from a free-form character note.',
      'Review explicit, inferred, and suggested candidates with confidence, then select, reject, replace, or lock them.',
      'Merge safely with overwrite, append, or skip, then continue directly to Japanese and English brief output.',
      'Improved parsing of negation, contrast, and relationship targets, and added rain, time-of-day, and gender-neutral teen inference.',
      'Fixed candidate merging, saved-item scrolling, narrow-screen preview controls, translated select labels, and keyboard navigation.',
    ],
  },
  {
    date: '2026-09-04',
    titleJa: '順番作成モードと使いやすさの改善',
    titleEn: 'Step-by-step builder and usability improvements',
    itemsJa: [
      '「一から順に作る」を追加し、すべての入力・ロック・ギャップ・選択中のテーマを空にして始められるようにしました。',
      '用途から最大9ステップで進み、背景用途では必要な5ステップへ自動で切り替わります。開始前の内容は履歴と「元に戻す」から復元できます。',
      'ギャップ生成の固定感をなくし、現在の設定に合わせて組み合わせが変わるよう改善しました。',
      'ヘッダーからヘルプと更新履歴をいつでも確認できるようにしました。',
      '検索エンジンへ登録しない設定を追加しました。',
      'テーマ選択、ヘルプ、更新履歴の表示とスクロールを修正しました。',
    ],
    itemsEn: [
      'Added Build step by step, which starts with every field, lock, contrast, and selected theme cleared.',
      'Work through up to nine sections from purpose, or five focused sections for background briefs. The previous brief can be restored from History or Undo.',
      'Improved contrast generation so combinations vary with the current settings instead of feeling fixed.',
      'Added permanent Help and What’s new entries to the header.',
      'Added directives that keep the site out of search-engine results.',
      'Fixed the theme controls, Help layout, and release-note scrolling.',
    ],
  },
  {
    date: '2026-08-30',
    titleJa: '編集・保存・出力機能の拡充',
    titleEn: 'Expanded editing, saving, and export tools',
    itemsJa: [
      '元に戻す・やり直す、変更差分、4案生成、項目検索・お気に入り・最近使った項目を追加しました。',
      'プリセットと編集履歴の管理、JSON入出力、共有リンクに対応しました。',
      '日本語・英語表示、ダークモード、用途別の出力形式、キーボード操作とアクセシビリティを改善しました。',
    ],
    itemsEn: [
      'Added Undo and Redo, change summaries, four-idea generation, search, favorites, and recently used items.',
      'Added preset and edit-history management, JSON import/export, and share links.',
      'Improved Japanese and English display, dark mode, tool-specific output, keyboard use, and accessibility.',
    ],
  },
] as const;

const themeOptions = themes.map((theme) => ({
  id: theme.id,
  labelJa: theme.label,
  labelEn: theme.labelEn,
}));

const cloneSnapshot = (snapshot: CharacterSnapshot): CharacterSnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as CharacterSnapshot;

const freshId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const profileOptions: Array<{ id: ExportProfile; labelJa: string; labelEn: string }> = [
  { id: 'generic', labelJa: '汎用', labelEn: 'Generic' },
  { id: 'stable-diffusion', labelJa: 'Stable Diffusion', labelEn: 'Stable Diffusion' },
  { id: 'midjourney', labelJa: 'Midjourney', labelEn: 'Midjourney' },
  { id: 'novelai', labelJa: 'NovelAI', labelEn: 'NovelAI' },
  { id: 'human-brief', labelJa: '人へ渡す依頼文', labelEn: 'Human-readable brief' },
];

const builtInPresetNamesEn: Record<string, string> = {
  'builtin-zeta-male': 'Zeta Male Character',
  'builtin-zeta-female': 'Zeta Female Character',
  'builtin-trpg': 'TRPG NPC',
  'builtin-otome': 'Romance Game Man',
  'builtin-webtoon': 'Webtoon',
  'builtin-fantasy-prince': 'Fantasy Prince',
  'builtin-fantasy-knight': 'Fantasy Knight',
  'builtin-dark-noble': 'Dark Fantasy Noble',
  'builtin-school-boy': 'School Boy',
  'builtin-school-girl': 'School Girl',
  'builtin-teacher': 'Teacher',
  'builtin-mafia': 'Mafia Boss',
  'builtin-angel': 'Angel',
  'builtin-fallen-angel': 'Wounded Fallen Angel',
  'builtin-vampire': 'Vampire Noble',
  'builtin-japanese-ghost': 'Japanese Ghost',
  'builtin-alluring-man': 'Alluring Older Man',
  'builtin-pretty-boy': 'Pretty Boy',
  'builtin-pretty-girl': 'Pretty Girl',
  'builtin-gothic': 'Gothic',
  'builtin-cyberpunk': 'Cyberpunk Hacker',
  'builtin-miko': 'Shrine Maiden',
  'builtin-sister': 'Sister',
  'builtin-desert-mage': 'Desert Mage',
  'builtin-forest-elf': 'Forest Elf',
  'builtin-office-worker': 'Office Worker',
  'builtin-idol': 'Idol',
  'builtin-doctor': 'Doctor',
  'builtin-villain': 'Villain',
  'builtin-pastel': 'Soft Pastel',
};

function StudioSection({
  value,
  icon,
  eyebrow,
  title,
  summary,
  children,
  hidden = false,
}: {
  value: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <AccordionItem
      id={value}
      value={value}
      className="mb-4 scroll-mt-24 overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_10px_32px_rgba(90,48,74,0.045)]"
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-primary/10 text-primary [&_svg]:size-4.5">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold tracking-[0.13em] text-muted-foreground">
              {eyebrow}
            </span>
            <span className="mt-0.5 block text-base font-bold">{title}</span>
            <span className="mt-0.5 block truncate text-sm font-normal text-muted-foreground">
              {summary}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-5 sm:px-5">{children}</AccordionContent>
    </AccordionItem>
  );
}

export function CharacterStudio() {
  const [timeline, setTimeline] = useState(() => createEditorTimeline({ draft: defaultDraft, locks: {} }));
  const draft = timeline.present.snapshot.draft;
  const locks = timeline.present.snapshot.locks;
  const [openSections, setOpenSections] = useState<string[]>(['purpose', 'style', 'character']);
  const [editorMode, setEditorMode] = useState<'form' | 'note'>('form');
  const [outputMode, setOutputMode] = useState<StudioOutputMode>('ja');
  const [themeId, setThemeId] = useState('');
  const [lastAction, setLastAction] = useState('デフォルトのキャラクターを表示中');
  const [lastChanges, setLastChanges] = useState<CharacterChange[]>([]);
  const [showAllChanges, setShowAllChanges] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<'presets' | 'history'>('presets');
  const [presetName, setPresetName] = useState('');
  const [managerQuery, setManagerQuery] = useState('');
  const [presetSort, setPresetSort] = useState<'recent' | 'used' | 'name'>('recent');
  const [userPresets, setUserPresets] = useState<SavedPreset[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryEntry[]>([]);
  const [randomHistoryItems, setRandomHistoryItems] = useState<HistoryEntry[]>([]);
  const [preferences, setPreferences] = useState<StudioPreferences>(DEFAULT_STUDIO_PREFERENCES);
  const [storageReady, setStorageReady] = useState(false);
  const [storageLoadFailed, setStorageLoadFailed] = useState(false);
  const [noteWorkspace, setNoteWorkspace] = useState(createEmptyNoteWorkspace);
  const [recoveryWorkspace, setRecoveryWorkspace] = useState<StudioWorkspace | null>(null);
  const [pendingImport, setPendingImport] = useState<{ data: StudioImport; name: string } | null>(null);
  const [incomingShare, setIncomingShare] = useState<CharacterSnapshot | null>(null);
  const [shareSource, setShareSource] = useState<CharacterSnapshot | null>(null);
  const [shareCustomKeys, setShareCustomKeys] = useState<string[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [guidedResetOpen, setGuidedResetOpen] = useState(false);
  const [formSessionKey, setFormSessionKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<'guide' | 'shortcuts'>('guide');
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<CharacterDraft[]>([]);
  const [batchBase, setBatchBase] = useState<CharacterSnapshot | null>(null);
  const [renameTarget, setRenameTarget] = useState<SavedPreset | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [historyRenameTarget, setHistoryRenameTarget] = useState<HistoryEntry | null>(null);
  const [historyRenameValue, setHistoryRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SavedPreset | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [previewInView, setPreviewInView] = useState(false);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const lastEditedRef = useRef<HTMLElement | null>(null);
  const editScrollRef = useRef(0);

  const workspace = useMemo<StudioWorkspace>(() => ({
    current: { draft, locks }, presets: userPresets, history: historyItems,
    randomHistory: randomHistoryItems, preferences, noteWorkspace, editorMode,
  }), [draft, locks, userPresets, historyItems, randomHistoryItems, preferences, noteWorkspace, editorMode]);
  const autosave = useStudioAutosave(workspace, storageReady);
  const sharedSnapshot = useMemo(() => shareSource ? prepareShareSnapshot(shareSource, shareCustomKeys) : null, [shareSource, shareCustomKeys]);
  const shareUrl = sharedSnapshot && typeof window !== 'undefined' ? createShareUrl(window.location.href, sharedSnapshot) : '';

  const outputs = useMemo(() => generatePrompts(draft), [draft]);
  const promptBlocks = useMemo(() => buildPromptBlocks(draft, outputs), [draft, outputs]);
  const activeStylePreset = findStylePreset(draft.stylePack?.presetId);
  useEffect(() => {
    setOutputMode(activeStylePreset ? 'blocks' : 'ja');
  }, [activeStylePreset]);
  const notices = useMemo(() => analyzePromptNotices(draft), [draft]);
  const profileOutput = useMemo(
    () => formatProfileOutput(outputs, draft, preferences.exportProfile),
    [draft, outputs, preferences.exportProfile],
  );
  const activeOutput = outputs[outputMode];
  const language = preferences.language;
  const tr = useCallback((ja: string, en: string) => language === 'ja' ? ja : en, [language]);
  const lockCount = Object.values(locks).filter(Boolean).length;
  const activeGapLabel = draft.generatedGap
    ? draft.generatedGap.labelJa || '一部のギャップ要素（編集済み）'
    : draft.custom.gap?.replace(/^ギャップ要素[：:]\s*/, '').trim() || '';
  const legacyGapActive = draft.generatedGap?.seedId === 'legacy';
  const hasUserCustomInput = Object.entries(draft.custom)
    .some(([key, value]) => !['gap', 'gapEn'].includes(key) && (!activeStylePreset || key !== 'style') && value.trim());
  const backgroundOnly = draft.purpose === 'background';
  const visibleSections = useMemo(() => sectionMeta.filter((section) => {
    if (backgroundOnly && ['character', 'appearance', 'outfit', 'action'].includes(section.id)) return false;
    if (!preferences.guidedMode && preferences.simpleMode && ['camera', 'negative'].includes(section.id)) return false;
    return true;
  }), [backgroundOnly, preferences.guidedMode, preferences.simpleMode]);
  const guidedSectionIds = useMemo(() => guidedSectionsForPurpose(draft.purpose), [draft.purpose]);
  const guidedStepId = normalizeGuidedStep(preferences.guidedStep, draft.purpose);
  const guidedStepIndex = guidedSectionIds.indexOf(guidedStepId);
  const guidedStepMeta = sectionMeta.find((section) => section.id === guidedStepId)!;
  const nextGuidedStepMeta = sectionMeta.find((section) => section.id === guidedSectionIds[guidedStepIndex + 1]);
  const displayedSectionIds = preferences.guidedMode
    ? [guidedStepId]
    : visibleSections.map((section) => section.id);
  const sortedPresets = useMemo(() => userPresets
    .filter((preset) => `${preset.name} ${snapshotSummary(preset.snapshot, language)}`.toLocaleLowerCase(language === 'ja' ? 'ja' : 'en').includes(managerQuery.trim().toLocaleLowerCase(language === 'ja' ? 'ja' : 'en')))
    .sort((left, right) => {
      if (Boolean(left.pinned) !== Boolean(right.pinned)) return left.pinned ? -1 : 1;
      if (presetSort === 'used') return (right.useCount ?? 0) - (left.useCount ?? 0);
      if (presetSort === 'name') return left.name.localeCompare(right.name, language === 'ja' ? 'ja' : 'en');
      return new Date(right.lastUsedAt ?? right.updatedAt).getTime() - new Date(left.lastUsedAt ?? left.updatedAt).getTime();
    }), [language, managerQuery, presetSort, userPresets]);
  const filteredHistory = useMemo(() => historyItems.filter((item) =>
    `${item.name ?? item.label} ${snapshotSummary(item.snapshot, language)}`.toLocaleLowerCase(language === 'ja' ? 'ja' : 'en')
      .includes(managerQuery.trim().toLocaleLowerCase(language === 'ja' ? 'ja' : 'en')),
  ).sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned))
    || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()), [historyItems, language, managerQuery]);

  const makeSnapshot = useCallback(
    (): CharacterSnapshot => cloneSnapshot(timeline.present.snapshot),
    [timeline.present.snapshot],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
      const shared = readShareUrl(window.location.href);
      if (shared.present) {
        window.history.replaceState(null, '', shared.cleanUrl);
        if (shared.snapshot) setIncomingShare(shared.snapshot);
        else toast.add({ title: '共有リンクを読み取れませんでした。現在の入力は変更していません。', type: 'warning' });
      }
      const savedWorkspaceRaw = localStorage.getItem(WORKSPACE_KEY);
      const savedWorkspace = parseStudioBackup(savedWorkspaceRaw);
      if (savedWorkspaceRaw && !savedWorkspace) throw new Error('Unreadable workspace');
      setRecoveryWorkspace(parseStudioBackup(localStorage.getItem(RECOVERY_KEY)));
      const savedCurrent = savedWorkspace?.current ?? parseSnapshot(localStorage.getItem(STORAGE_KEYS.current));
      if (savedCurrent) {
        setTimeline(replaceEditorTimeline(savedCurrent, 'restored'));
      }
      const savedPresets = savedWorkspace?.presets ?? parsePresets(localStorage.getItem(STORAGE_KEYS.presets));
      setUserPresets(savedPresets);
      const savedHistory = savedWorkspace?.history ?? parseHistory(localStorage.getItem(STORAGE_KEYS.history));
      setHistoryItems(savedHistory);
      const savedRandomHistory = savedWorkspace?.randomHistory ?? parseHistory(localStorage.getItem(STORAGE_KEYS.randomHistory));
      setRandomHistoryItems(savedRandomHistory.length
        ? savedRandomHistory
        : savedHistory.filter((item) => item.source === 'random' || item.source === 'gap' || /おまかせ|ギャップ|テーマ/.test(item.label)));
      const loadedPreferences = savedWorkspace?.preferences ?? parseStudioPreferences(localStorage.getItem(STORAGE_KEYS.preferences));
      if (savedWorkspace) {
        setNoteWorkspace(savedWorkspace.noteWorkspace);
        setEditorMode(savedWorkspace.editorMode);
      }
      const returningUser = Boolean(savedCurrent || savedPresets.length || savedHistory.length);
      const restoredPreferences = returningUser && !loadedPreferences.onboardingSeen
        ? { ...loadedPreferences, onboardingSeen: true }
        : loadedPreferences;
      setPreferences(restoredPreferences);
      setLastAction(loadedPreferences.language === 'ja' ? '保存済みの設定を表示中' : 'Showing your saved settings');
      setOnboardingOpen(!loadedPreferences.onboardingSeen && !shared.snapshot && !returningUser);
      setStorageReady(true);
      } catch {
        // Preserve unreadable data; never overwrite it with a default workspace.
        setStorageLoadFailed(true);
        toast.add({ title: '保存データを読み込めませんでした', type: 'warning' });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const receiveShare = () => {
      const shared = readShareUrl(window.location.href);
      if (!shared.present) return;
      window.history.replaceState(null, '', shared.cleanUrl);
      if (shared.snapshot) {
        setIncomingShare(shared.snapshot);
        setOnboardingOpen(false);
      } else {
        toast.add({ title: '共有リンクを読み取れませんでした。現在の入力は変更していません。', type: 'warning' });
      }
    };
    window.addEventListener('hashchange', receiveShare);
    window.addEventListener('popstate', receiveShare);
    return () => {
      window.removeEventListener('hashchange', receiveShare);
      window.removeEventListener('popstate', receiveShare);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    document.title = language === 'ja' ? 'キャラクター発注室' : 'Character Brief Studio';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyColorMode = () => {
      const dark = preferences.colorMode === 'dark'
        || (preferences.colorMode === 'system' && media.matches);
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };
    applyColorMode();
    media.addEventListener('change', applyColorMode);
    return () => media.removeEventListener('change', applyColorMode);
  }, [language, preferences.colorMode]);

  const addHistory = useCallback((label: string, snapshot: CharacterSnapshot, source?: HistoryEntry['source']) => {
    const entry: HistoryEntry = {
      id: freshId(),
      createdAt: new Date().toISOString(),
      label,
      snapshot: cloneSnapshot(snapshot),
      source,
    };
    setHistoryItems((current) => appendHistory(current, entry));
    if (source === 'random' || source === 'gap') {
      setRandomHistoryItems((current) => appendHistory(current, entry));
    }
  }, []);

  const commitSnapshot = useCallback((
    next: CharacterSnapshot,
    action: string,
    options: { coalesceKey?: string; historySource?: HistoryEntry['source']; announce?: string } = {},
  ) => {
    const nextTimeline = commitEditorTimeline(timeline, next, {
      action,
      coalesceKey: options.coalesceKey,
    });
    if (nextTimeline === timeline) return false;
    const changes = diffSnapshots(timeline.present.snapshot, nextTimeline.present.snapshot);
    setTimeline(nextTimeline);
    setLastChanges(changes);
    setShowAllChanges(false);
    setLastAction(action);
    setAnnouncement(options.announce ?? action);
    if (options.historySource) addHistory(action, nextTimeline.present.snapshot, options.historySource);
    return true;
  }, [addHistory, timeline]);

  const recordRecent = useCallback((field: LockKey, id: string) => {
    if (!id) return;
    setPreferences((current) => ({
      ...current,
      recentChoices: {
        ...current.recentChoices,
        [field]: [id, ...(current.recentChoices[field] ?? []).filter((item) => item !== id)].slice(0, 12),
      },
    }));
  }, []);

  const toggleFavorite = useCallback((field: LockKey, id: string) => {
    setPreferences((current) => {
      const values = current.favoriteChoices[field] ?? [];
      return {
        ...current,
        favoriteChoices: {
          ...current.favoriteChoices,
          [field]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id],
        },
      };
    });
  }, []);

  const catalogProps = (field: LockKey) => ({
    field,
    language,
    favorites: preferences.favoriteChoices[field] ?? [],
    recents: preferences.recentChoices[field] ?? [],
    onToggleFavorite: (id: string) => toggleFavorite(field, id),
    onRecordRecent: (id: string) => recordRecent(field, id),
  });

  function updateField<K extends LockKey>(field: K, value: CharacterDraft[K]) {
    const nextAgeNumber = field === 'ageNumber' ? String(value) : draft.ageNumber;
    const nextAgeGroup = field === 'ageGroup' ? String(value) : draft.ageGroup;
    const unsafeAgeChange = ['ageNumber', 'ageGroup'].includes(field)
      && generatedGapConflictsWithAge(draft, nextAgeNumber, nextAgeGroup);
    const affectsGap = generatedGapUsesField(draft, field);
    const base = unsafeAgeChange
      ? clearGeneratedGap(draft)
      : affectsGap ? releaseGeneratedGapField(draft, field) : draft;
    const nextDraft = reconcileGeneratedGapDerivedChanges({ ...base, [field]: value }, locks);
    const valueIds = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    const newest = valueIds.at(-1);
    if (newest) recordRecent(field, newest);
    commitSnapshot(
      { draft: nextDraft, locks },
      `${fieldLabels[field][language]}${tr('を変更', ' updated')}`,
      {
        coalesceKey: field === 'ageNumber' ? 'field:ageNumber' : undefined,
        historySource: field === 'ageNumber' ? undefined : 'manual',
      },
    );
  }

  const updateCustom = (field: string, value: string) => {
    commitSnapshot(
      { draft: { ...draft, custom: { ...draft.custom, [field]: value } }, locks },
      tr('自由入力を変更', 'Custom text updated'),
      { coalesceKey: `custom:${field}` },
    );
  };

  const toggleLock = (field: LockKey) => {
    const nextLocks = { ...locks, [field]: !locks[field] };
    commitSnapshot(
      { draft, locks: nextLocks },
      tr(`${fieldLabels[field].ja}のロックを${nextLocks[field] ? '有効化' : '解除'}`, `${nextLocks[field] ? 'Locked' : 'Unlocked'} ${fieldLabels[field].en}`),
      { historySource: 'manual' },
    );
  };

  const randomOne = (field: LockKey, label: string) => {
    if (locks[field]) {
      toast.add({ title: tr(`${label}はロック中です`, `${label} is locked`), type: 'info' });
      return;
    }
    const randomHistory = randomHistoryItems.map((item) => item.snapshot.draft);
    const next = randomizeField(draft, field, themeId || undefined, randomHistory, Math.random, locks);
    const action = tr(`${label}だけおまかせ`, `Randomized ${label}`);
    commitSnapshot({ draft: next, locks }, action, { historySource: 'random' });
  };

  const fieldActions = (field: LockKey, label: string) => (
    <FieldActions
      label={label}
      locked={Boolean(locks[field])}
      onToggleLock={() => toggleLock(field)}
      onRandom={field === 'faceFeatures' ? undefined : () => randomOne(field, label)}
      language={language}
    />
  );

  const applyPurpose = (purposeId: string) => {
    const nextDraft = applyPurposeRecommendation(draft, locks, purposeId);
    const recommendation = purposeRecommendations[purposeId] ?? {};
    const skipped = Object.keys(recommendation).filter((key) => locks[key as LockKey]).length;
    const action = tr(`${labelFor('purpose', purposeId)}のおすすめを適用`, `Applied ${englishFor('purpose', purposeId)} recommendations`);
    const changed = diffSnapshots(makeSnapshot(), { draft: nextDraft, locks }).length;
    commitSnapshot({ draft: nextDraft, locks }, action, { historySource: 'manual' });
    if (purposeId === 'background') {
      setOpenSections(['purpose', 'style', 'camera', 'scene', 'negative']);
    }
    toast.add({
      title: tr(`${changed}項目を更新しました`, `${changed} settings updated`),
      description: skipped ? tr(`ロック中の${skipped}項目は変更していません`, `${skipped} locked settings were left unchanged`) : undefined,
      type: 'success',
    });
  };

  const selectPurpose = (purposeId: string) => {
    if (!preferences.guidedMode) {
      applyPurpose(purposeId);
      return;
    }
    const action = tr(
      `用途「${labelFor('purpose', purposeId)}」を選択`,
      `Selected “${englishFor('purpose', purposeId)}” purpose`,
    );
    const changed = commitSnapshot(
      { draft: selectGuidedPurpose(draft, purposeId), locks },
      action,
      { historySource: 'manual' },
    );
    if (changed && purposeId === 'background') {
      toast.add({
        title: tr('背景用の5ステップに切り替えました', 'Switched to the 5-step background flow'),
        description: tr('後続項目は自動入力せず、空欄のまま進めます。', 'Later fields remain blank until you choose them.'),
        type: 'info',
      });
    }
  };

  const runRandom = (selectedThemeId?: string) => {
    const randomHistory = randomHistoryItems.map((item) => item.snapshot.draft);
    const next = randomizeAll(draft, locks, selectedThemeId, randomHistory, Math.random, backgroundOnly ? 'background' : 'character');
    const theme = selectedThemeId ? themeById(selectedThemeId) : undefined;
    const label = theme
      ? tr(`テーマ「${theme.label}」でおまかせ`, `Randomized with “${theme.labelEn}”`)
      : tr(backgroundOnly ? '背景をおまかせ' : 'キャラをおまかせ', backgroundOnly ? 'Background randomized' : 'Character randomized');
    commitSnapshot({ draft: next, locks }, label, { historySource: 'random' });
    toast.add({ title: tr(backgroundOnly ? '背景案を作りました' : 'キャラ案を作りました', backgroundOnly ? 'Background concept created' : 'Character concept created'), type: 'success' });
  };

  const runTheme = () => {
    if (!themeId) {
      toast.add({ title: tr('先にテーマを選んでください', 'Choose a theme first'), type: 'warning' });
      return;
    }
    runRandom(themeId);
  };

  const runGap = () => {
    const randomHistory = randomHistoryItems.map((item) => item.snapshot.draft);
    const result = generateGap(draft, locks, Math.random, randomHistory);
    if (!result.changed) {
      toast.add({ title: tr('現在のロックではギャップを作れません', 'A contrast cannot be created with the current locks'), description: tr('衣装・印象・表情など、2項目以上のロックを外してください', 'Unlock at least two fields such as outfit, traits, or expression'), type: 'warning' });
      return;
    }
    const gapLabel = language === 'ja' ? result.label : result.draft.generatedGap?.labelEn ?? result.label;
    commitSnapshot({ draft: result.draft, locks }, tr(`ギャップ：${gapLabel}`, `Contrast: ${gapLabel}`), { historySource: 'gap' });
    toast.add({ title: gapLabel, description: tr('意外な組み合わせを作りました', 'Created an unexpected combination'), type: 'success' });
  };

  const removeGap = () => {
    if (!activeGapLabel) return;
    const next = clearGeneratedGap(draft);
    const message = tr(legacyGapActive ? '旧ギャップ文を外しました' : 'ギャップを適用前の設定へ戻しました', legacyGapActive ? 'Removed the legacy contrast note' : 'Restored settings from before the contrast');
    commitSnapshot({ draft: next, locks }, message, { historySource: 'manual' });
    toast.add({ title: message, type: 'success' });
  };

  const applyNoteInference = (
    result: InferenceResult,
    decisions: Record<string, InferenceDecision>,
    mergeMode: InferenceMergeMode,
  ) => {
    const dryRun = mergeInferenceIntoFormState(makeSnapshot(), result.values, decisions, mergeMode);
    if (!dryRun.report.applied.length) {
      const preserved = dryRun.report.skippedLocked.length + dryRun.report.skippedExisting.length;
      const conflicts = dryRun.report.skippedConflict.length;
      const skipped = preserved + conflicts;
      toast.add({
        title: tr('反映できる候補がありません', 'No candidates could be applied'),
        description: skipped
          ? tr(
            conflicts
              ? '安全上の組み合わせ、ロック、または反映方法により、入力済み項目を保持しました。'
              : 'ロックまたは反映方法により、入力済み項目を保持しました。',
            conflicts
              ? 'Existing fields were preserved to avoid unsafe conflicts or because of locks and the merge method.'
              : 'Locked or existing fields were preserved by the selected merge method.',
          )
          : tr('採用する候補を選んでください。', 'Select at least one candidate.'),
        type: 'warning',
      });
      return false;
    }

    const mergeFields = Object.keys(draft)
      .filter((field) => field !== 'custom' && field !== 'generatedGap' && field !== 'stylePack') as LockKey[];
    const changedValueFields = new Set(mergeFields.filter((field) =>
      JSON.stringify(draft[field]) !== JSON.stringify(dryRun.snapshot.draft[field]),
    ));
    const changedLockFields = new Set(mergeFields.filter((field) =>
      Boolean(locks[field]) !== Boolean(dryRun.snapshot.locks[field]),
    ));
    if (!changedValueFields.size && !changedLockFields.size) {
      toast.add({ title: tr('フォームはすでに同じ内容です', 'The form already has these values'), type: 'info' });
      return false;
    }
    let baseDraft = draft;
    if (
      (changedValueFields.has('ageGroup') || changedValueFields.has('ageNumber'))
      && generatedGapConflictsWithAge(draft, dryRun.snapshot.draft.ageNumber, dryRun.snapshot.draft.ageGroup)
    ) {
      baseDraft = clearGeneratedGap(draft, locks);
    }
    for (const field of changedValueFields) {
      if (!locks[field] && generatedGapUsesField(baseDraft, field)) {
        baseDraft = releaseGeneratedGapField(baseDraft, field);
      }
    }

    const merged = mergeInferenceIntoFormState(
      { draft: baseDraft, locks },
      result.values,
      decisions,
      mergeMode,
    );
    const nextDraft = resolveDraftConflicts(
      reconcileGeneratedGapDerivedChanges(merged.snapshot.draft, locks),
      locks,
    );
    const finalLocks = { ...merged.snapshot.locks };
    const requestedLocks = new Map<LockKey, string[]>();
    result.values.forEach((value) => {
      const decision = decisions[inferenceDecisionKey(value)];
      if (!decision?.adopted || !decision.locked) return;
      requestedLocks.set(value.category, [...(requestedLocks.get(value.category) ?? []), decision.valueId]);
    });
    for (const [field, valueIds] of requestedLocks) {
      if (locks[field]) continue;
      const current = nextDraft[field];
      const currentIds = Array.isArray(current) ? current : typeof current === 'string' ? [current] : [];
      if (!valueIds.some((valueId) => currentIds.includes(valueId))) delete finalLocks[field];
    }
    const uniqueFields = [...new Set([...changedValueFields, ...changedLockFields])].filter((field) =>
      JSON.stringify(draft[field]) !== JSON.stringify(nextDraft[field])
      || Boolean(locks[field]) !== Boolean(finalLocks[field]),
    );
    const action = tr(
      `設定メモから${uniqueFields.length}項目を反映`,
      `Applied ${uniqueFields.length} fields from the character note`,
    );
    const changed = commitSnapshot(
      { draft: nextDraft, locks: finalLocks },
      action,
      { historySource: 'manual' },
    );
    if (!changed) {
      toast.add({ title: tr('フォームはすでに同じ内容です', 'The form already has these values'), type: 'info' });
      return false;
    }

    for (const applied of merged.report.applied) recordRecent(applied.category, applied.valueId);
    const sections = uniqueFields
      .map((field) => inferenceSectionByField[field])
      .filter((section): section is GuidedSectionId => Boolean(section));
    setOpenSections((current) => [...new Set([...current, ...sections])]);
    setPreferences((current) => ({ ...current, guidedMode: false }));
    setEditorMode('form');
    const preserved = merged.report.skippedLocked.length + merged.report.skippedExisting.length;
    const conflicts = merged.report.skippedConflict.length;
    const skipped = preserved + conflicts;
    const skippedDescriptionJa = [
      conflicts ? `${conflicts}項目は安全上の競合を避けて除外` : '',
      preserved ? `${preserved}項目はロックまたは反映方法により保持` : '',
    ].filter(Boolean).join('し、');
    const skippedDescriptionEn = [
      conflicts ? `${conflicts} fields were excluded to avoid unsafe conflicts` : '',
      preserved ? `${preserved} fields were preserved because of locks or the merge method` : '',
    ].filter(Boolean).join('; ');
    toast.add({
      title: tr(`${uniqueFields.length}項目をフォームへ反映しました`, `${uniqueFields.length} fields applied to the form`),
      description: skipped
        ? tr(`${skippedDescriptionJa}しました。`, `${skippedDescriptionEn}.`)
        : tr('日本語・英語の指示書へ自動で反映されています。', 'The Japanese and English briefs are now updated.'),
      type: 'success',
    });
    window.setTimeout(() => document.getElementById(sections[0] ?? 'character-inputs')
      ?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      }), 80);
    return true;
  };

  const undo = () => {
    const next = undoEditorTimeline(timeline);
    if (next === timeline) return;
    setLastChanges(diffSnapshots(timeline.present.snapshot, next.present.snapshot));
    setTimeline(next);
    setLastAction(tr('操作を元に戻しました', 'Undid the last change'));
    setAnnouncement(tr('操作を元に戻しました', 'Last change undone'));
  };

  const redo = () => {
    const next = redoEditorTimeline(timeline);
    if (next === timeline) return;
    setLastChanges(diffSnapshots(timeline.present.snapshot, next.present.snapshot));
    setTimeline(next);
    setLastAction(tr('操作をやり直しました', 'Redid the change'));
    setAnnouncement(tr('操作をやり直しました', 'Change redone'));
  };

  const navigateSection = (id: GuidedSectionId) => {
    setEditorMode('form');
    setOpenSections((current) => (current.includes(id) ? current : [...current, id]));
    window.setTimeout(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      target?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    }, 60);
  };

  const goToGuidedStep = (requested: GuidedSectionId) => {
    const nextStep = normalizeGuidedStep(requested, draft.purpose);
    const stepIndex = guidedSectionIds.indexOf(nextStep);
    const meta = sectionMeta.find((section) => section.id === nextStep)!;
    setPreferences((current) => ({ ...current, guidedStep: nextStep }));
    setOpenSections([nextStep]);
    setAnnouncement(tr(
      `ステップ${stepIndex + 1}/${guidedSectionIds.length}、${meta.labelJa}`,
      `Step ${stepIndex + 1} of ${guidedSectionIds.length}, ${meta.labelEn}`,
    ));
    window.setTimeout(() => {
      const target = document.getElementById(nextStep);
      target?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      target?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    }, 60);
  };

  const startGuidedMode = (saveBackup = true) => {
    const previous = makeSnapshot();
    const blank = createBlankSnapshot();
    const action = tr('一から順に作成を開始', 'Started building step by step');
    if (saveBackup && JSON.stringify(previous) !== JSON.stringify(blank)) {
      addHistory(
        tr('一から作る前の設定', 'Backup before starting from scratch'),
        previous,
        'manual',
      );
    }
    const changed = commitSnapshot(blank, action);
    if (!changed) {
      setLastAction(action);
      setAnnouncement(action);
    }
    setThemeId('');
    setEditorMode('form');
    setBatchItems([]);
    setBatchOpen(false);
    setFormSessionKey((current) => current + 1);
    setPreferences((current) => ({
      ...current,
      guidedMode: true,
      guidedStep: 'purpose',
    }));
    setOpenSections(['purpose']);
    setGuidedResetOpen(false);
    toast.add({
      title: tr('すべて空欄にしました', 'Everything was cleared'),
      description: tr('用途から順番に決められます。', 'Start with purpose and work through each section.'),
      type: 'success',
    });
    window.setTimeout(() => document.getElementById('purpose')
      ?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true }), 80);
  };

  const leaveGuidedMode = () => {
    setPreferences((current) => ({ ...current, guidedMode: false }));
    setLastAction(tr('通常表示へ戻りました', 'Returned to the full editor'));
    setAnnouncement(tr('入力内容を保持して通常表示へ戻りました', 'Returned to the full editor and kept your entries'));
  };

  const finishGuidedMode = () => {
    const total = guidedSectionIds.length;
    setPreferences((current) => ({ ...current, guidedMode: false }));
    setLastAction(tr('順番作成を完了', 'Step-by-step build completed'));
    setAnnouncement(tr(
      `全${total}ステップが完了しました。指示書を確認できます。`,
      `All ${total} steps are complete. Your brief is ready to review.`,
    ));
    toast.add({ title: tr('指示書を確認できます', 'Your brief is ready to review'), type: 'success' });
    window.setTimeout(showPreview, 80);
  };

  const moveGuidedStep = (direction: -1 | 1) => {
    const next = guidedSectionIds[guidedStepIndex + direction];
    if (next) goToGuidedStep(next);
    else if (direction === 1) finishGuidedMode();
  };

  const copyText = async (text: string, label: string, saveHistory = true) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      if (saveHistory) addHistory(label, makeSnapshot(), 'copy');
      setAnnouncement(tr('クリップボードへコピーしました', 'Copied to clipboard'));
      toast.add({ title: tr('コピーしました', 'Copied'), type: 'success' });
    } catch {
      toast.add({ title: tr('コピーできませんでした', 'Could not copy'), description: tr('文章を選択してコピーしてください', 'Select the text and copy it manually'), type: 'error' });
    }
  };

  const updateStylePack = (selection: StylePackSelection) => {
    commitSnapshot({ draft: { ...draft, stylePack: selection }, locks }, tr('画風・補助・ブロックを変更', 'Changed style, helpers, or blocks'), { historySource: 'manual' });
  };

  const copyOutput = (mode: StudioOutputMode = outputMode) => {
    const tab = outputTabs.find((item) => item.value === mode);
    return copyText(outputs[mode], tr(`${tab?.labelJa ?? mode}をコピー`, `Copied ${tab?.labelEn ?? mode}`));
  };

  const savePreset = () => {
    const name = presetName.trim().slice(0, 50);
    if (!name) {
      toast.add({ title: tr('プリセット名を入力してください', 'Enter a preset name'), type: 'warning' });
      return;
    }
    const now = new Date().toISOString();
    const item: SavedPreset = {
      id: freshId(),
      name,
      createdAt: now,
      updatedAt: now,
      snapshot: makeSnapshot(),
      pinned: false,
      useCount: 0,
    };
    setUserPresets((current) => [item, ...current]);
    addHistory(tr(`プリセット「${name}」を保存`, `Saved preset “${name}”`), item.snapshot, 'save');
    setPresetName('');
    toast.add({ title: tr(`「${name}」を保存しました`, `Saved “${name}”`), type: 'success' });
  };

  const loadSnapshot = (snapshot: CharacterSnapshot, label: string) => {
    const migrated = migrateSnapshot(snapshot);
    if (!migrated) {
      toast.add({ title: tr('この設定を読み込めませんでした', 'These settings could not be loaded'), type: 'error' });
      return;
    }
    const next = cloneSnapshot(migrated);
    commitSnapshot(next, label, { historySource: 'load' });
    setPreferences((current) => ({ ...current, guidedMode: false }));
    setManagerOpen(false);
    toast.add({ title: tr('設定を読み込みました', 'Settings loaded'), type: 'success' });
  };

  const loadPreset = (preset: SavedPreset) => {
    const now = new Date().toISOString();
    const displayName = preset.builtIn && language === 'en' ? builtInPresetNamesEn[preset.id] ?? preset.name : preset.name;
    if (!preset.builtIn) {
      setUserPresets((current) => current.map((item) => item.id === preset.id
        ? { ...item, useCount: (item.useCount ?? 0) + 1, lastUsedAt: now }
        : item));
    }
    loadSnapshot(preset.snapshot, tr(`プリセット「${displayName}」を読込`, `Loaded preset “${displayName}”`));
  };

  const duplicatePreset = (preset: SavedPreset) => {
    const now = new Date().toISOString();
    const sourceName = preset.builtIn && language === 'en' ? builtInPresetNamesEn[preset.id] ?? preset.name : preset.name;
    const copy: SavedPreset = {
      ...preset,
      id: freshId(),
      name: tr(`${sourceName}（コピー）`, `${sourceName} (copy)`),
      createdAt: now,
      updatedAt: now,
      builtIn: false,
      snapshot: cloneSnapshot(preset.snapshot),
      parentId: preset.id,
      pinned: false,
      useCount: 0,
      lastUsedAt: undefined,
    };
    setUserPresets((current) => [copy, ...current]);
    toast.add({ title: tr('プリセットを複製しました', 'Preset duplicated'), type: 'success' });
  };

  const renamePreset = (preset: SavedPreset) => {
    setRenameTarget(preset);
    setRenameValue(preset.name);
  };

  const deletePreset = (preset: SavedPreset) => {
    setDeleteTarget(preset);
  };

  const confirmRename = () => {
    if (!renameTarget) return;
    const name = renameValue.trim().slice(0, 50);
    if (!name) return;
    setUserPresets((current) => current.map((item) => item.id === renameTarget.id ? { ...item, name, updatedAt: new Date().toISOString() } : item));
    setRenameTarget(null);
    toast.add({ title: tr('名前を変更しました', 'Preset renamed'), type: 'success' });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setUserPresets((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.add({ title: tr('プリセットを削除しました', 'Preset deleted'), type: 'info' });
  };

  const togglePresetPin = (preset: SavedPreset) => {
    setUserPresets((current) => current.map((item) => item.id === preset.id ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() } : item));
  };

  const toggleHistoryPin = (entry: HistoryEntry) => {
    setHistoryItems((current) => current.map((item) => item.id === entry.id ? { ...item, pinned: !item.pinned } : item));
  };

  const renameHistory = (entry: HistoryEntry) => {
    setHistoryRenameTarget(entry);
    setHistoryRenameValue(entry.name ?? entry.label);
  };

  const confirmHistoryRename = () => {
    if (!historyRenameTarget) return;
    const name = historyRenameValue.trim().slice(0, 80);
    if (!name) return;
    setHistoryItems((current) => current.map((item) => item.id === historyRenameTarget.id ? { ...item, name } : item));
    setHistoryRenameTarget(null);
    toast.add({ title: tr('履歴に名前を付けました', 'History item renamed'), type: 'success' });
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  const customField = (label: string, key: string, placeholder: string) => (
    <Input
      aria-label={label}
      value={draft.custom[key] ?? ''}
      onChange={(event) => updateCustom(key, event.target.value)}
      onBlur={() => addHistory(tr(`${label}を編集`, `Edited ${label}`), makeSnapshot(), 'manual')}
      placeholder={placeholder}
      className="h-11 rounded-xl bg-card"
    />
  );

  const activeTab = outputTabs.find((tab) => tab.value === outputMode);
  const activeTabLabel = language === 'ja' ? activeTab?.labelJa ?? '' : activeTab?.labelEn ?? '';

  const downloadJson = (text: string, prefix: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.add({ title: tr('JSONを書き出しました', 'JSON exported'), type: 'success' });
  };
  const exportData = () => downloadJson(exportStudioBackup(workspace), 'character-order-room-backup');

  const importData = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      toast.add({ title: tr('ファイルが大きすぎます', 'File is too large'), description: '10 MB max', type: 'error' });
      if (importInputRef.current) importInputRef.current.value = '';
      return;
    }
    try {
      const parsed = parseAnyStudioImport(await file.text());
      if (!parsed) throw new Error('Unsupported backup');
      setPendingImport({ data: parsed, name: file.name });
    } catch {
      toast.add({ title: tr('JSONを読み込めませんでした。現在の入力は変更していません。', 'Could not read JSON. Your current work was not changed.'), type: 'error' });
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingImport || !storageReady || autosave.status === 'conflict') return;
    const parsed = pendingImport.data;
    const existingIds = new Set(userPresets.map((item) => item.id));
    const imported = parsed.presets.map((item) => existingIds.has(item.id)
      ? { ...item, id: freshId(), name: `${item.name}（import）` } : item);
    const next: StudioWorkspace = parsed.workspace ?? {
      ...workspace, current: parsed.current, presets: [...imported, ...userPresets],
      preferences: { ...preferences, guidedMode: false },
    };
    try {
      // Save the whole previous session before applying any replacement.
      localStorage.setItem(RECOVERY_KEY, exportStudioBackup(workspace));
      localStorage.setItem(WORKSPACE_KEY, exportStudioBackup(next));
    } catch {
      toast.add({ title: tr('安全に保存できないため、読み込みを中止しました', 'Import stopped because it could not be saved safely'), description: tr('現在の入力は変更していません。先に完全バックアップを書き出してください。', 'Your current work is unchanged. Export a full backup first.'), type: 'error' });
      return;
    }
    setRecoveryWorkspace(workspace);
    setLastChanges(diffSnapshots(makeSnapshot(), next.current));
    setShowAllChanges(true);
    setTimeline(replaceEditorTimeline(next.current, 'imported'));
    setUserPresets(next.presets);
    setHistoryItems(next.history);
    setRandomHistoryItems(next.randomHistory);
    setPreferences(next.preferences);
    setNoteWorkspace(next.noteWorkspace);
    setEditorMode(next.editorMode);
    setPendingImport(null);
    setLastAction(tr('確認したデータを読み込みました', 'Imported the reviewed data'));
    toast.add({ title: tr('読み込みました', 'Imported'), description: tr('「保存・読込」から読込前の状態へ戻せます。', 'Use Save / Load to restore the state before this import.'), type: 'success' });
  };

  const acceptIncomingShare = () => {
    if (!incomingShare || autosave.status === 'conflict') return;
    addHistory(tr('共有リンクを読み込む前', 'Before loading shared settings'), makeSnapshot(), 'load');
    commitSnapshot(incomingShare, tr('共有リンクの設定を読み込み', 'Loaded shared settings'), { historySource: 'load' });
    setPreferences((current) => ({ ...current, guidedMode: false, onboardingSeen: true }));
    setEditorMode('form');
    setShowAllChanges(true);
    setIncomingShare(null);
  };

  const copyShareLink = () => {
    setShareCustomKeys([]);
    setShareSource(makeSnapshot());
  };

  const createBatch = () => {
    const items = generateBatchVariations(draft, locks, {
      count: 4,
      themeId: themeId || undefined,
      history: randomHistoryItems.map((item) => item.snapshot.draft),
      scope: backgroundOnly ? 'background' : 'character',
    });
    if (!items.length) {
      toast.add({ title: tr('変更できる項目がありません', 'No fields can be changed'), description: tr('ランダム対象のロックを1つ以上外してください', 'Unlock at least one randomized field'), type: 'warning' });
      return;
    }
    setBatchItems(items);
    setBatchBase(makeSnapshot());
    setBatchOpen(true);
  };

  const adoptBatch = (item: CharacterDraft, index: number) => {
    commitSnapshot({ draft: item, locks }, tr(`バッチ案${index + 1}を採用`, `Adopted batch concept ${index + 1}`), { historySource: 'batch' });
    setPreferences((current) => ({ ...current, guidedMode: false }));
    setBatchOpen(false);
  };

  const finishOnboarding = (mode: 'random' | 'purpose' | 'blank') => {
    setPreferences((current) => ({ ...current, onboardingSeen: true, simpleMode: mode !== 'blank', guidedMode: false }));
    setOnboardingOpen(false);
    if (mode === 'random') runRandom();
    if (mode === 'purpose') navigateSection('purpose');
    if (mode === 'blank') startGuidedMode(false);
  };

  const toggleLanguage = () => {
    const nextLanguage = language === 'ja' ? 'en' : 'ja';
    setPreferences((current) => ({ ...current, language: nextLanguage }));
    setLastAction(nextLanguage === 'ja' ? '表示言語を日本語に変更' : 'Display language changed to English');
    setAnnouncement(nextLanguage === 'ja' ? '日本語表示に切り替えました' : 'Switched to English');
  };

  const toggleColorMode = () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    setPreferences((current) => ({ ...current, colorMode: currentlyDark ? 'light' : 'dark' }));
  };

  const showPreview = () => {
    editScrollRef.current = window.scrollY;
    const preview = document.getElementById('prompt-preview');
    preview?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => previewHeadingRef.current?.focus({ preventScroll: true }), 350);
  };

  const returnToEditing = () => {
    const target = lastEditedRef.current;
    if (target?.isConnected && target.getClientRects().length) {
      target.scrollIntoView({ block: 'center', behavior: 'auto' });
      target.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: editScrollRef.current, behavior: 'auto' });
    }
  };

  const handleEditorTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const nextMode = event.key === 'Home' || event.key === 'ArrowLeft'
      ? 'form'
      : event.key === 'End' || event.key === 'ArrowRight'
        ? 'note'
        : null;
    if (!nextMode) return;
    event.preventDefault();
    setEditorMode(nextMode);
    window.requestAnimationFrame(() => document.getElementById(`editor-tab-${nextMode}`)?.focus());
  };

  useEffect(() => {
    const preview = document.getElementById('prompt-preview');
    if (!preview || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setPreviewInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'));
      const modalOpen = managerOpen || onboardingOpen || guidedResetOpen || helpOpen || changelogOpen || batchOpen || Boolean(renameTarget) || Boolean(historyRenameTarget) || Boolean(deleteTarget) || Boolean(shareSource) || Boolean(incomingShare) || Boolean(pendingImport);
      if (!editable && !modalOpen && event.altKey && /^[1-9]$/.test(event.key)) {
        const section = visibleSections[Number(event.key) - 1];
        if (section) {
          event.preventDefault();
          if (preferences.guidedMode) goToGuidedStep(section.id);
          else navigateSection(section.id);
        }
        return;
      }
      const action = getShortcutAction({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        editable,
        isComposing: event.isComposing,
        repeat: event.repeat,
        modalOpen,
      });
      if (!action) return;
      event.preventDefault();
      if (action === 'undo') undo();
      if (action === 'redo') redo();
      if (action === 'random' && !preferences.guidedMode && editorMode === 'form') runRandom();
      if (action === 'gap' && !backgroundOnly && !preferences.guidedMode && editorMode === 'form') runGap();
      if (action === 'copy') void copyOutput();
      if (action === 'help') {
        setHelpTab('shortcuts');
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <>
      <a href="#character-inputs" className="sr-only z-[100] rounded-lg bg-background p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{tr('キャラクター設定へ移動', 'Skip to character settings')}</a>
      <a href="#prompt-preview" className="sr-only z-[100] rounded-lg bg-background p-3 focus:not-sr-only focus:fixed focus:left-52 focus:top-3">{tr('完成した指示書へ移動', 'Skip to finished brief')}</a>
      <output className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</output>
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1680px] items-center justify-between gap-3 px-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_28%,transparent)]">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="sr-only truncate text-base font-bold tracking-tight sm:not-sr-only sm:text-lg">{tr('キャラクター発注室', 'Character Brief Studio')}</h1>
                <p className="hidden text-xs font-bold tracking-[0.08em] text-muted-foreground sm:block">{tr('イラスト指示書メーカー', 'Illustration Prompt Builder')}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button
                aria-label={tr('表示言語を切り替える', 'Switch display language')}
                variant="ghost"
                size="icon"
                className="hidden min-h-11 min-w-11 rounded-xl sm:inline-flex"
                onClick={toggleLanguage}
              >
                <Languages className="size-4" />
              </Button>
              <Button
                aria-label={tr('明るさを切り替える', 'Toggle color mode')}
                variant="ghost"
                size="icon"
                className="hidden min-h-11 min-w-11 rounded-xl sm:inline-flex"
                onClick={toggleColorMode}
              >
                {preferences.colorMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button
                aria-label={tr('更新履歴を開く', 'Open changelog')}
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 gap-2 rounded-xl px-2.5 xl:px-3"
                title={tr('更新履歴', 'What’s new')}
                onClick={() => setChangelogOpen(true)}
              >
                <Megaphone className="size-4" />
                <span className="hidden xl:inline">{tr('更新履歴', 'What’s new')}</span>
              </Button>
              <Button
                aria-label={tr('ヘルプを開く', 'Open help')}
                aria-keyshortcuts="?"
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 gap-2 rounded-xl px-2.5 xl:px-3"
                title={tr('ヘルプとキーボードショートカット', 'Help and keyboard shortcuts')}
                onClick={() => { setHelpTab('guide'); setHelpOpen(true); }}
              >
                <CircleHelp className="size-4" />
                <span className="hidden xl:inline">{tr('ヘルプ', 'Help')}</span>
              </Button>
              <Button
                aria-label={tr('履歴を開く', 'Open history')}
                variant="ghost"
                size="sm"
                className="hidden min-h-11 min-w-11 gap-2 rounded-xl px-2.5 sm:inline-flex sm:px-3"
                title={tr('編集履歴', 'Edit history')}
                onClick={() => { setManagerTab('history'); setManagerOpen(true); }}
              >
                <History className="size-4" />
                <span className="hidden xl:inline">{tr('履歴', 'History')}</span>
              </Button>
              <Button
                aria-label={tr('プリセットを保存・読み込み', 'Save or load presets')}
                variant="outline"
                size="sm"
                className="min-h-11 min-w-11 gap-2 rounded-xl bg-card px-2.5 sm:px-3"
                title={tr('プリセットを保存・読み込み', 'Save or load presets')}
                onClick={() => { setManagerTab('presets'); setManagerOpen(true); }}
              >
                <Bookmark className="size-4" />
                <span className="hidden xl:inline">{tr('保存・読込', 'Save / Load')}</span>
              </Button>
              {!preferences.guidedMode && editorMode === 'form' && (
                <Button aria-label={tr(backgroundOnly ? '背景をおまかせ生成' : 'キャラクターをおまかせ生成', backgroundOnly ? 'Randomize background' : 'Randomize character')} aria-keyshortcuts="Control+Enter Meta+Enter" size="sm" className="min-h-11 min-w-11 gap-2 rounded-xl px-3" title={tr(backgroundOnly ? '背景をおまかせ生成' : 'キャラクターをおまかせ生成', backgroundOnly ? 'Randomize background' : 'Randomize character')} onClick={() => runRandom()}>
                  <Dices className="size-4" />
                  <span className="hidden xl:inline">{tr('おまかせ', 'Randomize')}</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1680px] grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_410px]">
          <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] overflow-y-auto border-r border-border/70 bg-card/35 px-3 py-6 xl:block">
            <div className="flex items-center justify-between px-3">
              <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground">{tr('発注内容', 'CHARACTER BRIEF')}</p>
              <Badge variant="secondary" className="text-xs">{tr(`${lockCount}ロック`, `${lockCount} locked`)}</Badge>
            </div>
            <nav aria-label={tr('設定カテゴリ', 'Setting categories')} className="mt-3 space-y-1">
              {visibleSections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => preferences.guidedMode ? goToGuidedStep(section.id) : navigateSection(section.id)}
                  aria-keyshortcuts={`Alt+${index + 1}`}
                  aria-current={preferences.guidedMode && section.id === guidedStepId ? 'step' : undefined}
                  className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${(preferences.guidedMode ? section.id === guidedStepId : openSections.includes(section.id)) ? 'bg-primary/8' : 'hover:bg-accent'}`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-[11px] [&_svg]:size-3.5 ${(preferences.guidedMode ? section.id === guidedStepId : openSections.includes(section.id)) ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {preferences.guidedMode && index < guidedStepIndex ? <Check /> : section.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{language === 'ja' ? section.labelJa : section.labelEn}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{language === 'ja' ? section.shortJa : section.shortEn}</span>
                  </span>
                  <ChevronRight className="size-3.5 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </nav>
            <div className="mx-2 mt-5 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
              <div><p className="text-sm font-bold">{tr('かんたん表示', 'Simple mode')}</p><p className="text-xs text-muted-foreground">{tr(preferences.guidedMode ? '順番作成中は全項目を表示' : '主要項目だけ表示', preferences.guidedMode ? 'All fields are shown in step-by-step mode' : 'Show key fields')}</p></div>
              <Switch disabled={preferences.guidedMode} checked={preferences.simpleMode} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, simpleMode: Boolean(checked) }))} aria-label={tr('かんたん表示を切り替える', 'Toggle simple mode')} />
            </div>
            <div className="mx-2 mt-3 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.05] p-3.5">
              <p className="flex items-center gap-2 text-sm font-bold text-primary"><Lock className="size-3.5" />{tr('好きな項目はロック', 'Lock what you want to keep')}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr('鍵をかけた項目は、ランダム生成しても変わりません。', 'Locked fields stay unchanged when randomizing.')}</p>
            </div>
          </aside>

          <section id="character-inputs" aria-label={tr('キャラクター設定', 'Character settings')} onFocusCapture={(event) => {
            if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [role="combobox"], [role="checkbox"], [role="radio"]')) lastEditedRef.current = event.target;
          }} className="min-w-0 scroll-mt-24 px-3 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-24 lg:px-8 xl:pb-7">
            <div className="mx-auto max-w-[790px]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{storageLoadFailed || autosave.status === 'conflict' ? tr('自動保存を停止中', 'Autosave paused') : !storageReady ? tr('保存データを確認中…', 'Loading saved work…') : autosave.status === 'saved' ? tr('保存済み · このブラウザ', 'Saved · this browser') : autosave.status === 'error' ? tr('未保存の変更があります', 'Unsaved changes') : tr('保存中…', 'Saving…')}</span>
                <Button variant="ghost" size="sm" className="min-h-11" onClick={exportData}><Download className="size-4" />{tr('完全バックアップ', 'Full backup')}</Button>
              </div>
              {autosave.status === 'conflict' && <p role="alert" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{tr('別のタブで更新されたため、このタブの自動保存を停止しました。必要なら完全バックアップを書き出してからページを再読み込みしてください。', 'Another tab updated this workspace. Autosave is paused to avoid overwriting it. Export a backup if needed, then reload this page.')}</p>}
              {(storageLoadFailed || autosave.status === 'error') && <div role="alert" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p>{tr(storageLoadFailed ? '保存データを読み取れないため、元のデータを上書きしていません。新しく入力する内容は保存されません。' : 'ブラウザへ保存できません。画面を閉じる前に完全バックアップを書き出してください。', storageLoadFailed ? 'Saved data could not be read, so it has not been overwritten. New input will not be saved.' : 'Browser storage is unavailable. Export a full backup before closing this page.')}</p>
                {!storageLoadFailed && <Button variant="outline" className="mt-3 min-h-11" onClick={() => autosave.flush()}>{tr('保存を再試行', 'Retry saving')}</Button>}
              </div>}
              {!preferences.guidedMode && (
                <div role="tablist" aria-label={tr('入力方法', 'Input method')} aria-orientation="horizontal" className="mb-5 grid min-h-12 w-full grid-cols-2 rounded-2xl bg-muted/65 p-1">
                  <button
                    type="button"
                    id="editor-tab-form"
                    role="tab"
                    aria-selected={editorMode === 'form'}
                    aria-controls="editor-panel-form"
                    tabIndex={editorMode === 'form' ? 0 : -1}
                    className={`min-h-10 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${editorMode === 'form' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setEditorMode('form')}
                    onKeyDown={handleEditorTabKeyDown}
                  >
                    {tr('通常入力', 'Regular form')}
                  </button>
                  <button
                    type="button"
                    id="editor-tab-note"
                    role="tab"
                    aria-selected={editorMode === 'note'}
                    aria-controls="editor-panel-note"
                    tabIndex={editorMode === 'note' ? 0 : -1}
                    className={`min-h-10 rounded-xl px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${editorMode === 'note' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setEditorMode('note')}
                    onKeyDown={handleEditorTabKeyDown}
                  >
                    {tr('設定メモから作る', 'Build from a note')}
                  </button>
                </div>
              )}
              {!preferences.guidedMode && (
                <div id="editor-panel-note" role="tabpanel" aria-labelledby="editor-tab-note" hidden={editorMode !== 'note'}>
                  <CharacterNoteInferencePanel
                    language={language}
                    draft={draft}
                    locks={locks}
                    onApply={applyNoteInference}
                    workspace={noteWorkspace}
                    onWorkspaceChange={setNoteWorkspace}
                  />
                </div>
              )}
              <div
                id={!preferences.guidedMode ? 'editor-panel-form' : undefined}
                role={!preferences.guidedMode ? 'tabpanel' : undefined}
                aria-labelledby={!preferences.guidedMode ? 'editor-tab-form' : undefined}
                hidden={!preferences.guidedMode && editorMode === 'note'}
              >
              {preferences.guidedMode ? (
                <div className="mb-5 overflow-hidden rounded-[22px] border border-primary/25 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_12%,var(--card)),var(--card)_64%)] p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-primary"><FileText className="size-4" />{tr('順番に作成中', 'Step-by-step mode')}</p>
                      <h2 className="mt-1 text-lg font-bold">{tr(`ステップ ${guidedStepIndex + 1} / ${guidedSectionIds.length}：${guidedStepMeta.labelJa}`, `Step ${guidedStepIndex + 1} of ${guidedSectionIds.length}: ${guidedStepMeta.labelEn}`)}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{tr('未選択の項目は空欄のまま進めます。用途を選んでも後続項目は自動入力しません。', 'You can leave any field blank. Choosing a purpose will not prefill later steps.')}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-keyshortcuts="Control+Z Meta+Z" onClick={undo} disabled={timeline.past.length === 0} aria-label={tr('元に戻す', 'Undo')}><RotateCcw className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y" onClick={redo} disabled={timeline.future.length === 0} aria-label={tr('やり直す', 'Redo')}><Redo2 className="size-4" /></Button>
                      <Button variant="outline" size="sm" className="min-h-11 rounded-xl bg-card" onClick={leaveGuidedMode}>{tr('通常表示に戻る', 'Return to full editor')}</Button>
                    </div>
                  </div>
                  <Progress
                    value={((guidedStepIndex + 1) / guidedSectionIds.length) * 100}
                    aria-label={tr(`ステップ${guidedStepIndex + 1}/${guidedSectionIds.length}`, `Step ${guidedStepIndex + 1} of ${guidedSectionIds.length}`)}
                    className="mt-4 gap-0 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none"
                  />
                  <nav aria-label={tr('作成ステップ', 'Build steps')} className="mt-3 overflow-x-auto pb-1">
                    <ol className="flex min-w-max gap-2">
                      {guidedSectionIds.map((sectionId, index) => {
                        const section = sectionMeta.find((item) => item.id === sectionId)!;
                        const current = sectionId === guidedStepId;
                        return (
                          <li key={sectionId}>
                            <button
                              type="button"
                              aria-current={current ? 'step' : undefined}
                              onClick={() => goToGuidedStep(sectionId)}
                              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${current ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'}`}
                            >
                              <span className={`grid size-5 place-items-center rounded-full text-xs ${current ? 'bg-primary-foreground/18' : index < guidedStepIndex ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'}`}>{index < guidedStepIndex ? <Check className="size-3" /> : index + 1}</span>
                              {language === 'ja' ? section.labelJa : section.labelEn}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                </div>
              ) : (
              <div className="mb-5 overflow-hidden rounded-[22px] border border-primary/18 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_8%,var(--card)),var(--card)_58%)] p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold text-primary"><Wand2 className="size-3.5" />{tr(backgroundOnly ? '統一感のある背景を一発生成' : '統一感のあるキャラを一発生成', backgroundOnly ? 'Generate a coherent background' : 'Generate a coherent character')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{lastAction}{language === 'ja' ? '。' : ' — '}{tr(backgroundOnly ? '人物設定は保持したまま、背景項目だけを変更します。' : '通常生成はまとまり重視で、時々小さなギャップを加えます。', backgroundOnly ? 'Only background settings change; character settings are preserved.' : 'Randomization favors coherence and may add a subtle contrast.')}</p>
                    </div>
                    <Button variant="outline" size="sm" className="min-h-11 w-full shrink-0 gap-1.5 rounded-xl bg-card sm:w-auto" onClick={() => setGuidedResetOpen(true)}><FileText className="size-4" />{tr('一から順に作る', 'Build step by step')}</Button>
                  </div>
                  <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <Select value={themeId || null} onValueChange={(value) => value && setThemeId(String(value))}>
                        <SelectTrigger aria-label={tr('ランダム生成テーマ', 'Random theme')} className="h-11 w-full rounded-xl bg-card">
                          <SelectValue placeholder={tr('テーマを選ぶ', 'Choose a theme')}>{themeId
                            ? language === 'ja'
                              ? themeOptions.find((theme) => theme.id === themeId)?.labelJa
                              : themeOptions.find((theme) => theme.id === themeId)?.labelEn
                            : tr('テーマを選ぶ', 'Choose a theme')}</SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start" className="max-h-72">
                          {themeOptions.map((theme) => <SelectItem key={theme.id} value={theme.id} className="min-h-11">{language === 'ja' ? theme.labelJa : theme.labelEn}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="secondary" size="sm" className="min-h-11 w-full rounded-xl sm:w-auto" onClick={runTheme}>{tr('テーマで生成', 'Use theme')}</Button>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="min-h-11 flex-1 gap-1.5 rounded-xl bg-card sm:flex-none" onClick={createBatch}><CopyPlus className="size-4" />{tr('4案', '4 ideas')}</Button>
                    {!backgroundOnly && <Button variant="outline" size="sm" aria-keyshortcuts="Control+Shift+Enter Meta+Shift+Enter" className="min-h-11 flex-1 rounded-xl bg-card sm:flex-none" onClick={runGap}>{activeGapLabel ? tr('別のギャップ', 'New contrast') : tr('ギャップ', 'Contrast')}</Button>}
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-keyshortcuts="Control+Z Meta+Z" onClick={undo} disabled={timeline.past.length === 0} aria-label={tr('元に戻す', 'Undo')}><RotateCcw className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y" onClick={redo} disabled={timeline.future.length === 0} aria-label={tr('やり直す', 'Redo')}><Redo2 className="size-4" /></Button>
                    </div>
                  </div>
                </div>
                {lastChanges.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-border bg-card/80 p-3" aria-label={tr('直前の変更内容', 'Most recent changes')}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{tr(`変更 ${lastChanges.length}項目`, `${lastChanges.length} changes`)}</p>
                      {lastChanges.length > 3 && <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setShowAllChanges((current) => !current)}>{showAllChanges ? tr('閉じる', 'Show less') : tr('詳細', 'Details')}</Button>}
                    </div>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {lastChanges.slice(0, showAllChanges ? undefined : 3).map((change) => (
                        <li key={change.id}><span className="font-semibold text-foreground">{language === 'ja' ? change.labelJa : change.labelEn}:</span> {language === 'ja' ? change.beforeJa : change.beforeEn} → {language === 'ja' ? change.afterJa : change.afterEn}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {backgroundOnly && (
                  <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-3 text-sm">
                    <p className="font-bold">{tr('背景専用モード', 'Background-only mode')}</p>
                    <p className="mt-1 text-muted-foreground">{tr('人物・顔・衣装・表情の設定は非表示ですが保存されています。人物用途へ戻すと同じ内容を再利用できます。', 'Character, face, outfit, and pose settings are hidden but preserved. Switch back to a character purpose to reuse them.')}</p>
                  </div>
                )}
                {activeGapLabel && (
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-primary/15 bg-card/80 p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-[0.12em] text-primary">{tr('適用中のギャップ', 'Active contrast')}</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed">{activeGapLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tr(legacyGapActive ? '旧保存データのギャップ文です。×で文だけを外せます。' : 'もう一度生成すると別案に入れ替わります。×で適用前の設定へ戻せます。通常・テーマ生成では自動的に外れます。', legacyGapActive ? 'This is a legacy contrast note. Remove only the note with ×.' : 'Generate again to replace it, or use × to restore the prior settings. Standard randomization removes it.')}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeGap} aria-label={tr('適用中のギャップを外す', 'Remove active contrast')}><X className="size-4" /></Button>
                  </div>
                )}
              </div>
              )}

              <Accordion
                key={formSessionKey}
                multiple
                value={preferences.guidedMode ? [guidedStepId] : openSections}
                onValueChange={(value) => {
                  const next = value as GuidedSectionId[];
                  if (preferences.guidedMode && !next.includes(guidedStepId)) return;
                  setOpenSections(next);
                }}
              >
                <StudioSection hidden={!displayedSectionIds.includes('purpose')} value="purpose" icon={<Sparkles />} eyebrow="STEP 1" title={tr('何に使うイラスト？', 'What is this illustration for?')} summary={language === 'ja' ? labelFor('purpose', draft.purpose) : englishFor('purpose', draft.purpose)}>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{tr(preferences.guidedMode ? '用途だけを選びます。構図・縦横比・禁止事項は後のステップで自分で決められます。' : '用途を選ぶと構図・縦横比・禁止事項のおすすめを自動設定します。ロック中の項目は変更しません。', preferences.guidedMode ? 'This step selects only the purpose. You will choose composition, aspect ratio, and exclusions later.' : 'Choosing a purpose applies recommended composition, aspect ratio, and exclusions. Locked fields stay unchanged.')}</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {purposes.map((purpose) => {
                      const active = draft.purpose === purpose.id;
                      return (
                        <button
                          key={purpose.id}
                          type="button"
                          onClick={() => selectPurpose(purpose.id)}
                          aria-pressed={active}
                          className={`relative min-h-20 rounded-2xl border p-3 text-left transition ${active ? 'border-primary bg-primary/[0.07] shadow-sm' : 'border-border bg-background hover:-translate-y-0.5 hover:border-primary/35'}`}
                        >
                          {active && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span>}
                          <span className="block pr-5 text-sm font-bold leading-snug">{language === 'ja' ? purpose.labelJa : purpose.labelEn}</span>
                          <span className="mt-2 block text-xs text-muted-foreground">{language === 'ja' ? purpose.labelEn : purpose.labelJa}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4">{customField(tr('用途の補足・自由設定', 'Purpose notes'), 'purpose', tr('用途の補足・自由設定', 'Add purpose-specific notes'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('style')} value="style" icon={<Palette />} eyebrow="STEP 2" title={tr('絵柄と仕上げ', 'Style and finish')} summary={activeStylePreset ? tr(`${activeStylePreset.nameJa}・補助${draft.stylePack?.antiAiIds.length ?? 0}件`, `${activeStylePreset.nameEn} · ${draft.stylePack?.antiAiIds.length ?? 0} helpers`) : tr(`${labelFor('style', draft.style)}・${draft.styleTraits.length}個の追加要素`, `${englishFor('style', draft.style)} · ${draft.styleTraits.length} details`)}>
                  <StylePackPanel
                    selection={draft.stylePack}
                    language={language}
                    favorites={preferences.favoriteChoices.stylePack ?? []}
                    locked={Boolean(locks.style)}
                    onChange={updateStylePack}
                    onToggleFavorite={(id) => setPreferences((current) => {
                      const favorites = current.favoriteChoices.stylePack ?? [];
                      return { ...current, favoriteChoices: { ...current.favoriteChoices, stylePack: favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id] } };
                    })}
                    onSaveTemplate={() => { setPresetName(tr(activeStylePreset?.nameJa ?? '画風', activeStylePreset?.nameEn ?? 'Style') + tr('テンプレート', ' template')); setManagerTab('presets'); setManagerOpen(true); }}
                    onPreview={() => { setOutputMode('blocks'); showPreview(); }}
                  />
                  {activeStylePreset ? <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"><span className="text-sm text-muted-foreground">{tr('画風のランダム変更をロック', 'Lock random style changes')}</span><Button variant="outline" className="min-h-11 rounded-xl" aria-pressed={Boolean(locks.style)} onClick={() => toggleLock('style')}><Lock className="size-4" />{locks.style ? tr('ロック中', 'Locked') : tr('未ロック', 'Unlocked')}</Button></div> : <div className="mt-5 border-t border-border pt-4">
                  <h3 className="mb-3 text-sm font-semibold">{tr('従来の絵柄設定', 'Classic style settings')}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormRow label={tr('絵柄プリセット', 'Style preset')} actions={fieldActions('style', tr('絵柄', 'Style'))}>
                      <SingleSelect language={language} label={tr('絵柄プリセット', 'Style preset')} value={draft.style} options={styles} onChange={(value) => updateField('style', value)} />
                    </FormRow>
                    <FormRow label={tr('追加したい雰囲気', 'Additional style traits')} hint={tr('複数選択できます', 'You can select multiple')} actions={fieldActions('styleTraits', tr('絵柄の追加要素', 'Style traits'))}>
                      <ChoiceChips {...catalogProps('styleTraits')} label={tr('追加したい雰囲気', 'Additional style traits')} options={styleModifiers} selected={draft.styleTraits} onChange={(value) => updateField('styleTraits', value)} limit={8} />
                    </FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('絵柄の自由設定', 'Custom style direction'), 'style', tr('例：墨絵のようなにじみ、色トレ少なめ', 'e.g. soft ink bleed, restrained color grading'))}</div>
                  </div>}
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('character')} value="character" icon={<UserRound />} eyebrow="STEP 3" title={tr('キャラクターの基本', 'Character basics')} summary={tr(`${labelFor('ageGroup', draft.ageGroup)}・${labelFor('gender', draft.gender)}・${labelFor('build', draft.build)}`, `${englishFor('ageGroup', draft.ageGroup)} · ${englishFor('gender', draft.gender)} · ${englishFor('build', draft.build)}`)}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormRow label={tr('性別・表現', 'Gender / presentation')} actions={fieldActions('gender', tr('性別', 'Gender'))}><SingleSelect language={language} label={tr('性別・表現', 'Gender / presentation')} value={draft.gender} options={genders} onChange={(value) => updateField('gender', value)} /></FormRow>
                    <FormRow label={tr('年齢層', 'Age group')} actions={fieldActions('ageGroup', tr('年齢層', 'Age group'))}><SingleSelect language={language} label={tr('年齢層', 'Age group')} value={draft.ageGroup} options={ageGroups} onChange={(value) => updateField('ageGroup', value)} /></FormRow>
                    <FormRow label={tr('数値で年齢指定', 'Exact age')} hint={tr('0〜999の整数。入力すると年齢層より優先します', 'An integer from 0–999; this overrides age group')} actions={fieldActions('ageNumber', tr('数値年齢', 'Exact age'))}>
                      <Input aria-label={tr('数値で年齢指定', 'Exact age')} type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} value={draft.ageNumber} onChange={(event) => { const value = event.target.value; if (/^\d{0,3}$/.test(value)) updateField('ageNumber', value); }} onBlur={() => addHistory(tr('数値年齢を編集', 'Edited exact age'), makeSnapshot(), 'manual')} placeholder={tr('例：24', 'e.g. 24')} className="h-11 rounded-xl bg-card" />
                    </FormRow>
                    <FormRow label={tr('種族', 'Species')} actions={fieldActions('species', tr('種族', 'Species'))}><SingleSelect language={language} label={tr('種族', 'Species')} value={draft.species} options={species} onChange={(value) => updateField('species', value)} /></FormRow>
                    <FormRow label={tr('体格', 'Build')} actions={fieldActions('build', tr('体格', 'Build'))}><SingleSelect language={language} label={tr('体格', 'Build')} value={draft.build} options={builds} onChange={(value) => updateField('build', value)} /></FormRow>
                    <FormRow label={tr('肌の印象', 'Skin tone')} actions={fieldActions('skinTone', tr('肌', 'Skin'))}><SingleSelect language={language} label={tr('肌の印象', 'Skin tone')} value={draft.skinTone} options={skinTones} onChange={(value) => updateField('skinTone', value)} /></FormRow>
                  </div>
                  <div className="mt-3">
                    <FormRow label={tr('キャラクターの印象', 'Character traits')} hint={tr('80種類以上から複数選択。カテゴリ・最近・お気に入りで絞れます', 'Choose multiple from 80+ options; filter by category, recent, or favorites')} actions={fieldActions('personality', tr('キャラクター属性', 'Character traits'))}>
                      <ChoiceChips {...catalogProps('personality')} label={tr('キャラクターの印象', 'Character traits')} options={personalities} selected={draft.personality} onChange={(value) => updateField('personality', value)} limit={14} />
                    </FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('キャラクターの自由設定', 'Custom character direction'), 'character', tr('例：笑うと年下に見える、雨の日は少し寂しげ', 'e.g. looks younger when smiling; wistful on rainy days'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('appearance')} value="appearance" icon={<Scissors />} eyebrow="STEP 4" title={tr('顔・髪・瞳', 'Face, hair, and eyes')} summary={`${draft.hairColors.map((id) => language === 'ja' ? labelFor('hairColors', id) : englishFor('hairColors', id)).join(' × ')} · ${language === 'ja' ? labelFor('hairstyle', draft.hairstyle) : englishFor('hairstyle', draft.hairstyle)}`}>
                  <div className="space-y-3">
                    <FormRow label={tr('髪色', 'Hair color')} hint={tr('1色なら全体色、複数なら主色＋差し色として解釈します', 'One color sets the base; additional colors act as accents')} actions={fieldActions('hairColors', tr('髪色', 'Hair color'))}><ChoiceChips {...catalogProps('hairColors')} label={tr('髪色', 'Hair color')} options={hairColors} selected={draft.hairColors} onChange={(value) => updateField('hairColors', value)} limit={12} /></FormRow>
                    <FormRow label={tr('髪の配色効果', 'Hair color effects')} hint={tr('例：グラデーションは根元から毛先へ色を変えます', 'Example: a gradient changes color from roots to tips')} actions={fieldActions('hairEffects', tr('髪の配色効果', 'Hair effects'))}><ChoiceChips {...catalogProps('hairEffects')} label={tr('髪の配色効果', 'Hair color effects')} options={hairEffects} selected={draft.hairEffects} onChange={(value) => updateField('hairEffects', value)} limit={8} searchable={false} /></FormRow>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormRow label={tr('髪型', 'Hairstyle')} actions={fieldActions('hairstyle', tr('髪型', 'Hairstyle'))}><SingleSelect {...catalogProps('hairstyle')} label={tr('髪型', 'Hairstyle')} value={draft.hairstyle} options={hairstyles} onChange={(value) => updateField('hairstyle', value)} /></FormRow>
                      <FormRow label={tr('目の色', 'Eye color')} actions={fieldActions('eyeColor', tr('目の色', 'Eye color'))}><SingleSelect language={language} label={tr('目の色', 'Eye color')} value={draft.eyeColor} options={eyeColors} onChange={(value) => updateField('eyeColor', value)} /></FormRow>
                      <FormRow label={tr('目の形', 'Eye shape')} actions={fieldActions('eyeShape', tr('目の形', 'Eye shape'))}><SingleSelect language={language} label={tr('目の形', 'Eye shape')} value={draft.eyeShape} options={eyeShapes} onChange={(value) => updateField('eyeShape', value)} /></FormRow>
                      <FormRow label={tr('目の印象', 'Eye impression')} actions={fieldActions('eyeImpression', tr('目の印象', 'Eye impression'))}><SingleSelect language={language} label={tr('目の印象', 'Eye impression')} value={draft.eyeImpression} options={eyeImpressions} onChange={(value) => updateField('eyeImpression', value)} /></FormRow>
                    </div>
                    <FormRow label={tr('顔の特徴', 'Facial features')} actions={fieldActions('faceFeatures', tr('顔の特徴', 'Facial features'))}><ChoiceChips {...catalogProps('faceFeatures')} label={tr('顔の特徴', 'Facial features')} options={faceFeatures} selected={draft.faceFeatures} onChange={(value) => updateField('faceFeatures', value)} limit={12} /></FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('顔・髪・瞳の自由設定', 'Custom appearance direction'), 'appearance', tr('例：左目の下に涙ぼくろ、毛先は透ける', 'e.g. beauty mark under left eye; translucent hair tips'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('outfit')} value="outfit" icon={<Shirt />} eyebrow="STEP 5" title={tr('衣装とアクセサリー', 'Outfit and accessories')} summary={`${language === 'ja' ? labelFor('outfit', draft.outfit) : englishFor('outfit', draft.outfit)} · ${draft.outfitColors.map((id) => language === 'ja' ? labelFor('outfitColors', id) : englishFor('outfitColors', id)).join(' × ')}`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormRow label={tr('衣装カテゴリ', 'Outfit category')} actions={fieldActions('outfit', tr('衣装', 'Outfit'))}><SingleSelect {...catalogProps('outfit')} label={tr('衣装カテゴリ', 'Outfit category')} value={draft.outfit} options={outfits} onChange={(value) => updateField('outfit', value)} /></FormRow>
                    <FormRow label={tr('メイン・サブカラー', 'Main / accent colors')} actions={fieldActions('outfitColors', tr('衣装の色', 'Outfit colors'))}><ChoiceChips {...catalogProps('outfitColors')} label={tr('メイン・サブカラー', 'Main / accent colors')} options={outfitColors} selected={draft.outfitColors} onChange={(value) => updateField('outfitColors', value)} limit={10} /></FormRow>
                  </div>
                  <div className="mt-3">
                    <FormRow label={tr('素材・装飾・露出', 'Materials, details & coverage')} actions={fieldActions('outfitDetails', tr('衣装の詳細', 'Outfit details'))}><ChoiceChips {...catalogProps('outfitDetails')} label={tr('素材・装飾・露出', 'Materials, details & coverage')} options={outfitDetails} selected={draft.outfitDetails} onChange={(value) => updateField('outfitDetails', value)} limit={12} /></FormRow>
                  </div>
                  <div className="mt-3">
                    <FormRow label={tr('アクセサリー・持ち物', 'Accessories & props')} hint={tr('衣装とは別に複数選べます', 'Choose multiple, independently of outfit')} actions={fieldActions('accessories', tr('アクセサリー', 'Accessories'))}><ChoiceChips {...catalogProps('accessories')} label={tr('アクセサリー・持ち物', 'Accessories & props')} options={accessories} selected={draft.accessories} onChange={(value) => updateField('accessories', value)} limit={14} /></FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('衣装の自由設定', 'Custom outfit direction'), 'outfit', tr('例：七分袖、古びた銀の懐中時計', 'e.g. three-quarter sleeves; aged silver pocket watch'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('action')} value="action" icon={<Smile />} eyebrow="STEP 6" title={tr('表情・ポーズ・視線', 'Expression, pose, and gaze')} summary={tr(`${labelFor('expression', draft.expression)}・${labelFor('pose', draft.pose)}・${labelFor('gaze', draft.gaze)}`, `${englishFor('expression', draft.expression)} · ${englishFor('pose', draft.pose)} · ${englishFor('gaze', draft.gaze)}`)}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormRow label={tr('表情', 'Expression')} actions={fieldActions('expression', tr('表情', 'Expression'))}><SingleSelect {...catalogProps('expression')} label={tr('表情', 'Expression')} value={draft.expression} options={expressions} onChange={(value) => updateField('expression', value)} /></FormRow>
                    <FormRow label={tr('ポーズ', 'Pose')} actions={fieldActions('pose', tr('ポーズ', 'Pose'))}><SingleSelect {...catalogProps('pose')} label={tr('ポーズ', 'Pose')} value={draft.pose} options={poses} onChange={(value) => updateField('pose', value)} /></FormRow>
                    <FormRow label={tr('視線', 'Gaze')} actions={fieldActions('gaze', tr('視線', 'Gaze'))}><SingleSelect language={language} label={tr('視線', 'Gaze')} value={draft.gaze} options={gazes} onChange={(value) => updateField('gaze', value)} /></FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('表情・ポーズの自由設定', 'Custom pose direction'), 'action', tr('例：指先で古い手紙をつまんでいる', 'e.g. holding an old letter delicately by the fingertips'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('camera')} value="camera" icon={<Camera />} eyebrow={backgroundOnly ? 'STEP 3' : 'STEP 7'} title={tr('カメラと構図', 'Camera and composition')} summary={tr(`${labelFor('cameraAngle', draft.cameraAngle)}・${labelFor('composition', draft.composition)}・${labelFor('aspectRatio', draft.aspectRatio)}`, `${englishFor('cameraAngle', draft.cameraAngle)} · ${englishFor('composition', draft.composition)} · ${englishFor('aspectRatio', draft.aspectRatio)}`)}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {!backgroundOnly && <FormRow label={tr('カメラ角度', 'Camera angle')} hint={tr(`${cameraAngles.length}種から1つ。左右は人物を基準にしたカメラの位置です。`, `Choose one of ${cameraAngles.length}. Left and right describe the camera position relative to the subject.`)} actions={fieldActions('cameraAngle', tr('カメラ角度', 'Camera angle'))}><SingleSelect {...catalogProps('cameraAngle')} searchable label={tr('カメラ角度', 'Camera angle')} value={draft.cameraAngle} options={cameraAngles} onChange={(value) => updateField('cameraAngle', value)} /></FormRow>}
                    <FormRow label={tr('構図', 'Composition')} hint={tr(backgroundOnly ? '背景にも使える配置・余白・奥行きから選びます。保持中の人物用構図は出力されません。' : `${compositions.length}種から1つ。写す範囲・配置・余白・奥行きで絞れます。`, backgroundOnly ? 'Choose scene-compatible placement, space, or depth. Retained portrait-only framing is not output.' : `Choose one of ${compositions.length}. Filter by framing, placement, space, or depth.`)} actions={fieldActions('composition', tr('構図', 'Composition'))}><SingleSelect {...catalogProps('composition')} searchable label={tr('構図', 'Composition')} value={draft.composition} options={backgroundOnly ? compositions.filter((choice) => isSceneComposition(choice.id) || choice.id === draft.composition) : compositions} onChange={(value) => updateField('composition', value)} /></FormRow>
                    <FormRow label={tr('画面の縦横', 'Aspect ratio')} actions={fieldActions('aspectRatio', tr('画面の縦横', 'Aspect ratio'))}><SingleSelect language={language} label={tr('画面の縦横', 'Aspect ratio')} value={draft.aspectRatio} options={aspectRatios} onChange={(value) => updateField('aspectRatio', value)} /></FormRow>
                  </div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('scene')} value="scene" icon={<Trees />} eyebrow={backgroundOnly ? 'STEP 4' : 'STEP 8'} title={tr('背景・時間・光', 'Background, time, and light')} summary={tr(`${labelFor('background', draft.background)}・${labelFor('timeOfDay', draft.timeOfDay)}・${draft.lighting.length}個の光演出`, `${englishFor('background', draft.background)} · ${englishFor('timeOfDay', draft.timeOfDay)} · ${draft.lighting.length} effects`)}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormRow label={tr('背景', 'Background')} actions={fieldActions('background', tr('背景', 'Background'))}><SingleSelect {...catalogProps('background')} label={tr('背景', 'Background')} value={draft.background} options={backgrounds} onChange={(value) => updateField('background', value)} /></FormRow>
                    <FormRow label={tr('時間帯', 'Time of day')} actions={fieldActions('timeOfDay', tr('時間帯', 'Time of day'))}><SingleSelect language={language} label={tr('時間帯', 'Time of day')} value={draft.timeOfDay} options={timesOfDay} onChange={(value) => updateField('timeOfDay', value)} /></FormRow>
                  </div>
                  <div className="mt-3">
                    <FormRow label={tr('光・演出', 'Lighting & effects')} hint={tr('例：柔らかい光＝影を弱く、逆光＝輪郭を強調。時間帯と矛盾する光は出力時に省きます', 'Example: soft light reduces harsh shadows; backlight emphasizes the silhouette. Conflicting light is omitted at output time')} actions={fieldActions('lighting', tr('光・演出', 'Lighting & effects'))}><ChoiceChips {...catalogProps('lighting')} label={tr('光・演出', 'Lighting & effects')} options={lighting} selected={draft.lighting} onChange={(value) => updateField('lighting', value)} limit={12} /></FormRow>
                  </div>
                  <div className="mt-3">{customField(tr('背景・光の自由設定', 'Custom scene direction'), 'scene', tr('例：窓の外に小雨、雨粒がボケて輝く', 'e.g. light rain outside the window, droplets glowing in bokeh'))}</div>
                </StudioSection>

                <StudioSection hidden={!displayedSectionIds.includes('negative')} value="negative" icon={<Ban />} eyebrow={backgroundOnly ? 'STEP 5' : 'STEP 9'} title={tr('避けたい要素', 'Elements to avoid')} summary={tr(`${draft.negatives.length}個を指定中`, `${draft.negatives.length} selected`)}>
                  <FormRow label={tr('禁止事項・ネガティブ', 'Negative prompt / exclusions')} hint={tr('選んだ内容は通常の描写と分けて出力します', 'These are output separately from positive directions')} actions={fieldActions('negatives', tr('禁止事項', 'Exclusions'))}>
                    <ChoiceChips {...catalogProps('negatives')} label={tr('禁止事項・ネガティブ', 'Negative prompt / exclusions')} options={negatives} selected={draft.negatives} onChange={(value) => updateField('negatives', value)} limit={15} />
                  </FormRow>
                  <Textarea aria-label={tr('独自の禁止事項', 'Custom exclusions')} value={draft.custom.negatives ?? ''} onChange={(event) => updateCustom('negatives', event.target.value)} onBlur={() => addHistory(tr('独自の禁止事項を編集', 'Edited custom exclusions'), makeSnapshot(), 'manual')} placeholder={tr('独自の禁止事項を、句点または改行で入力', 'Enter custom exclusions separated by punctuation or new lines')} className="mt-3 min-h-24 rounded-xl bg-card text-sm" />
                </StudioSection>
              </Accordion>
              {preferences.guidedMode && (
                <div className="mt-4 hidden items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:flex">
                  <Button variant="outline" className="min-h-11 rounded-xl" disabled={guidedStepIndex === 0} onClick={() => moveGuidedStep(-1)}>{tr('戻る', 'Back')}</Button>
                  <p className="text-center text-sm text-muted-foreground">{tr(`ステップ ${guidedStepIndex + 1} / ${guidedSectionIds.length}`, `Step ${guidedStepIndex + 1} of ${guidedSectionIds.length}`)}</p>
                  <Button className="min-h-11 rounded-xl" onClick={() => moveGuidedStep(1)}>
                    {nextGuidedStepMeta
                      ? tr(`次へ：${nextGuidedStepMeta.labelJa}`, `Next: ${nextGuidedStepMeta.labelEn}`)
                      : tr('指示書を確認', 'Review brief')}
                  </Button>
                </div>
              )}
              </div>
            </div>
          </section>

          <aside id="prompt-preview" aria-labelledby="preview-heading" className="scroll-mt-24 border-t border-border bg-preview px-3 py-5 sm:px-6 xl:sticky xl:top-[72px] xl:h-[calc(100vh-72px)] xl:overflow-y-auto xl:border-l xl:border-t-0 xl:px-5 xl:py-7">
            <div className="mx-auto max-w-2xl xl:max-w-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground">LIVE PREVIEW</p>
                  <h2 id="preview-heading" ref={previewHeadingRef} tabIndex={-1} className="mt-1 text-lg font-bold outline-none">{tr('できあがりの指示書', 'Finished brief')}</h2>
                </div>
                <Badge variant="outline" className="gap-1.5 border-success/25 bg-success/10 text-success"><span className="size-1.5 rounded-full bg-success" />{tr('自動更新', 'Auto-updated')}</Badge>
              </div>

              <div className="mt-4 overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_14px_38px_rgba(78,42,68,0.08)]">
                <Tabs value={outputMode} onValueChange={(value) => setOutputMode(value as StudioOutputMode)} className="gap-0">
                  <div className="border-b border-border px-2 pt-2 pb-1">
                    <TabsList variant="line" className="grid w-full grid-cols-3 gap-1 group-data-horizontal/tabs:h-auto">
                      {outputTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="h-11 min-w-0 px-2 text-sm group-data-horizontal/tabs:after:bottom-0">{language === 'ja' ? tab.labelJa : tab.labelEn}</TabsTrigger>)}
                    </TabsList>
                  </div>
                  {outputTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="min-h-[330px] p-5">
                      <p className="mb-4 rounded-xl bg-muted/55 p-3 text-sm text-muted-foreground">{language === 'ja' ? tab.hintJa : tab.hintEn}</p>
                      {tab.value === 'blocks' ? (activeStylePreset && draft.stylePack ? <PromptBlockPreview blocks={promptBlocks} selection={draft.stylePack} language={language} onChange={updateStylePack} onCopy={(text, label) => { void copyText(text, label); }} /> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{tr('STEP 2「絵柄と仕上げ」の画風ライブラリから1つ選ぶと、ブロック形式を使えます。従来の絵柄設定は日本語・Englishなどのタブで確認できます。', 'Select a style from the STEP 2 library to use block output. Classic styles remain available in Japanese, English, and the other tabs.')}</p>) : !outputs[tab.value] ? (
                        <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                          <div><FileText className="mx-auto size-7 text-muted-foreground/45" /><p className="mt-3 text-sm font-bold">{tr('まだ要素が選ばれていません', 'No details selected yet')}</p><p className="mt-1 text-sm text-muted-foreground">{tr('入力した内容だけが、ここに順番に表示されます。', 'Only the details you choose will appear here.')}</p></div>
                        </div>
                      ) : (tab.value === 'ja' || tab.value === 'en') ? (
                        <div>
                          <p className="whitespace-pre-wrap text-[14px] leading-7 text-foreground/86">{tab.value === 'ja' ? outputs.positiveJa : outputs.positiveEn}</p>
                          {(tab.value === 'ja' ? outputs.negativeJa : outputs.negativeEn) && (
                            <div className="mt-5 rounded-xl border border-negative-foreground/10 bg-negative p-3.5 text-sm leading-6 text-negative-foreground">
                              {tab.value === 'ja' ? outputs.negativeJa : outputs.negativeEn}
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground/86">{outputs[tab.value]}</pre>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="border-t border-border bg-muted/35 p-3">
                  <Button disabled={!activeOutput} className="min-h-11 w-full gap-2 rounded-xl" aria-keyshortcuts="Alt+C" onClick={() => copyOutput()}>
                    <Clipboard className="size-4" />{tr(`${activeTabLabel}をコピー`, `Copy ${activeTabLabel}`)}
                  </Button>
                  {(outputMode === 'ja' || outputMode === 'en') && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="min-h-11 rounded-xl bg-card" disabled={!(outputMode === 'ja' ? outputs.positiveJa : outputs.positiveEn)} onClick={() => copyText(outputMode === 'ja' ? outputs.positiveJa : outputs.positiveEn, tr('肯定側をコピー', 'Copied positive prompt'))}>{tr('肯定だけ', 'Positive only')}</Button>
                      <Button variant="outline" size="sm" className="min-h-11 rounded-xl bg-card" disabled={!(outputMode === 'ja' ? outputs.negativeJa : outputs.negativeEn)} onClick={() => copyText(outputMode === 'ja' ? outputs.negativeJa : outputs.negativeEn, tr('制約側をコピー', 'Copied negative prompt'))}>{tr('制約だけ', 'Negative only')}</Button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between px-1 text-sm text-muted-foreground">
                    <span>{tr(`${activeOutput.length.toLocaleString('ja-JP')}文字`, `${activeOutput.length.toLocaleString('en-US')} characters`)}</span>
                    <span>{tr('タブで用途別に切替', 'Switch formats with tabs')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between xl:flex-col xl:items-stretch">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold"><Settings2 className="size-4 text-primary" />{tr('サービス別の形式', 'Tool-specific format')}</p>
                    <SingleSelect
                      language={language}
                      label={tr('出力先サービス', 'Target tool')}
                      value={preferences.exportProfile}
                      options={profileOptions}
                      onChange={(value) => setPreferences((current) => ({ ...current, exportProfile: value as ExportProfile }))}
                    />
                  </div>
                  <Button disabled={!profileOutput.combined} className="min-h-11 gap-2 rounded-xl" onClick={() => copyText(profileOutput.combined, tr(`${profileOutput.labelJa}形式をコピー`, `Copied ${profileOutput.labelEn} format`))}><Clipboard className="size-4" />{tr('形式をコピー', 'Copy format')}</Button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{language === 'ja' ? profileOutput.hintJa : profileOutput.hintEn}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="min-h-11 rounded-xl" disabled={!profileOutput.positive} onClick={() => copyText(profileOutput.positive, tr('肯定側をコピー', 'Copied positive prompt'))}>{tr('肯定側をコピー', 'Copy positive')}</Button>
                  <Button variant="outline" size="sm" className="min-h-11 rounded-xl" disabled={!profileOutput.negative} onClick={() => copyText(profileOutput.negative, tr('制約側をコピー', 'Copied negative prompt'))}>{tr('制約側をコピー', 'Copy negative')}</Button>
                </div>
              </div>

              {notices.length > 0 && (
                <div className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300"><Lightbulb className="size-4" />{tr(`出力の調整理由（${notices.length}件）`, `Output adjustments (${notices.length})`)}</p>
                  <ul className="mt-3 space-y-2">
                    {notices.map((notice) => (
                      <li key={notice.id} className="rounded-xl bg-card/70 p-3 text-sm">
                        <p className="font-semibold">{language === 'ja' ? notice.labelJa : notice.labelEn}</p>
                        <p className="mt-1 text-muted-foreground">{language === 'ja' ? notice.reasonJa : notice.reasonEn}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasUserCustomInput && (
                <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3.5">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300"><Lightbulb className="size-3.5" />{tr('自由入力も末尾に保持します', 'Custom text is preserved')}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{tr(draft.purpose === 'background' ? '背景用途では「スタイル」と「背景」の自由入力だけを出力します。' : '既知の語句は端末内辞書で英語化し、未変換部分は原文のまま残して上で知らせます。', draft.purpose === 'background' ? 'Background mode outputs only style and scene custom text.' : 'Known phrases are translated locally; untranslated Japanese remains as entered and is flagged above.')}</p>
                </div>
              )}

              <div className="mt-3 rounded-2xl border border-primary/15 bg-primary/[0.055] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="size-3.5" />{tr('入力はこのブラウザだけに保存', 'Saved only in this browser')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr('入力内容はこの端末内だけに保存され、サーバーや外部AIへ送信されません。', 'Your entries stay in local browser storage and are not sent to a server or external AI.')}</p>
              </div>
              <Button variant="ghost" size="sm" className="mt-3 min-h-11 w-full rounded-xl xl:hidden" onClick={returnToEditing}>{tr('編集していた場所へ戻る', 'Return to where you were editing')}</Button>
            </div>
          </aside>
        </div>

        {preferences.guidedMode ? (
          <div className="fixed bottom-4 left-1/2 z-30 grid w-[min(94vw,420px)] -translate-x-1/2 grid-cols-[auto_1fr] gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur sm:hidden">
            <Button variant="outline" className="min-h-11 rounded-xl" disabled={guidedStepIndex === 0} onClick={() => moveGuidedStep(-1)}>{tr('戻る', 'Back')}</Button>
            <Button className="min-h-11 rounded-xl" onClick={() => moveGuidedStep(1)}>
              {nextGuidedStepMeta
                ? tr(`次へ：${nextGuidedStepMeta.labelJa}`, `Next: ${nextGuidedStepMeta.labelEn}`)
                : tr('指示書を確認', 'Review brief')}
            </Button>
          </div>
        ) : previewInView ? (
          <Button className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 min-h-11 w-[min(92vw,360px)] -translate-x-1/2 gap-2 rounded-2xl shadow-xl xl:hidden" onClick={returnToEditing}>{tr('編集していた場所へ戻る', 'Back to your edit')}</Button>
        ) : editorMode === 'form' ? (
          <Button
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 min-h-11 w-[min(92vw,360px)] -translate-x-1/2 gap-2 rounded-2xl shadow-xl xl:hidden"
            onClick={showPreview}
          >
            <FileText className="size-4" />{tr('プレビューを見る', 'View preview')}
          </Button>
        ) : null}
      </main>

      <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="relative shrink-0 border-b border-border p-5 pr-16">
            <DialogTitle className="text-lg font-bold">{tr('プリセットと履歴', 'Presets and history')}</DialogTitle>
            <DialogDescription>{tr('お気に入りの発注内容を保存・検索・共有できます。', 'Save, search, and share your favorite briefs.')}</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setManagerOpen(false)} aria-label={tr('閉じる', 'Close')}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="shrink-0 border-b border-border bg-muted/25 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="min-h-11 gap-2 rounded-xl bg-card" onClick={exportData}><Download className="size-4" />{tr('完全バックアップ', 'Full backup')}</Button>
              <Button variant="outline" size="sm" className="min-h-11 gap-2 rounded-xl bg-card" onClick={() => importInputRef.current?.click()}><Upload className="size-4" />{tr('JSON読込', 'Import JSON')}</Button>
              <Button variant="outline" size="sm" className="min-h-11 gap-2 rounded-xl bg-card" onClick={copyShareLink}><Link2 className="size-4" />{tr('共有リンク', 'Share link')}</Button>
              <input ref={importInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void importData(event.target.files?.[0])} />
              <p className="basis-full text-sm leading-relaxed text-muted-foreground">{tr('入力・プリセット・履歴・お気に入り・表示設定・メモ下書きをまとめて保存します。別端末への移行は、このJSONを読み込んでください。ファイルには未公開の設定も含まれます。', 'Back up settings, presets, history, favorites, preferences, and note drafts. Import this JSON on another device. It can contain unpublished material.')}</p>
              {recoveryWorkspace && <Button variant="outline" className="min-h-11" onClick={() => setPendingImport({ name: tr('読込前の退避データ', 'Pre-import recovery data'), data: { current: recoveryWorkspace.current, presets: recoveryWorkspace.presets, workspace: recoveryWorkspace } })}>{tr('読込前の状態に戻す', 'Restore pre-import state')}</Button>}
              <span className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <span className="text-sm font-semibold">{tr('かんたん', 'Simple')}</span>
                <Switch disabled={preferences.guidedMode} checked={preferences.simpleMode} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, simpleMode: Boolean(checked) }))} aria-label={tr('かんたん表示', 'Simple mode')} />
              </span>
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label={tr('表示言語を切り替える', 'Switch display language')}><Languages className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={toggleColorMode} aria-label={tr('明るさを切り替える', 'Toggle color mode')}>{preferences.colorMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            </div>
          </div>
          <Tabs value={managerTab} onValueChange={(value) => setManagerTab(value as 'presets' | 'history')} className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="shrink-0 border-b border-border px-5 pt-3">
              <TabsList variant="line">
                <TabsTrigger value="presets" className="min-h-11 px-4">{tr('プリセット', 'Presets')}</TabsTrigger>
                <TabsTrigger value="history" className="min-h-11 px-4">{tr('履歴', 'History')} <Badge variant="secondary">{historyItems.length}</Badge></TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="presets" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.045] p-4">
                <p className="text-sm font-bold">{tr('現在の設定を保存', 'Save current settings')}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input aria-label={tr('プリセット名', 'Preset name')} value={presetName} onChange={(event) => setPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') savePreset(); }} placeholder={tr('例：いつものWebtoon', 'e.g. My usual Webtoon style')} className="h-11 rounded-xl bg-card" maxLength={50} />
                  <Button onClick={savePreset} className="min-h-11 w-full shrink-0 gap-2 rounded-xl sm:w-auto"><Save className="size-4" />{tr('保存', 'Save')}</Button>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={managerQuery} onChange={(event) => setManagerQuery(event.target.value)} aria-label={tr('プリセットを検索', 'Search presets')} placeholder={tr('名前・内容で検索', 'Search name or summary')} className="h-11 rounded-xl bg-card pl-9" />
                  </div>
                  <Select value={presetSort} onValueChange={(value) => setPresetSort(value as typeof presetSort)}>
                    <SelectTrigger aria-label={tr('プリセットの並び順', 'Preset sorting')} className="h-11 w-full rounded-xl bg-card sm:w-44">
                      <SelectValue>{({
                        recent: tr('最近使った順', 'Recently used'),
                        used: tr('使用回数順', 'Most used'),
                        name: tr('名前順', 'Name'),
                      } as Record<typeof presetSort, string>)[presetSort]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{tr('最近使った順', 'Recently used')}</SelectItem>
                      <SelectItem value="used">{tr('使用回数順', 'Most used')}</SelectItem>
                      <SelectItem value="name">{tr('名前順', 'Name')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="mb-2 text-xs font-bold tracking-[0.13em] text-muted-foreground">MY PRESETS</p>
                {userPresets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{tr('まだ保存したプリセットはありません。', 'No saved presets yet.')}</div>
                ) : sortedPresets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{tr('検索条件に合うプリセットがありません。', 'No presets match your search.')}</div>
                ) : (
                  <div className="space-y-2">
                    {sortedPresets.map((preset) => (
                      <div key={preset.id} className="flex flex-col items-stretch gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{preset.pinned ? <Pin className="size-4" /> : <Bookmark className="size-4" />}</span>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{preset.name}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snapshotSummary(preset.snapshot, language)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(preset.lastUsedAt ?? preset.updatedAt)} · {tr(`${preset.useCount ?? 0}回使用`, `used ${preset.useCount ?? 0} times`)}</p></div>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label={tr(preset.pinned ? 'ピン留めを外す' : 'ピン留め', preset.pinned ? 'Unpin preset' : 'Pin preset')} onClick={() => togglePresetPin(preset)}>{preset.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</Button>
                          <Button variant="ghost" size="icon" aria-label={tr('名前変更', 'Rename')} onClick={() => renamePreset(preset)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" aria-label={tr('複製', 'Duplicate')} onClick={() => duplicatePreset(preset)}><CopyPlus className="size-4" /></Button>
                          <Button variant="ghost" size="icon" aria-label={tr('削除', 'Delete')} className="text-destructive" onClick={() => deletePreset(preset)}><Trash2 className="size-4" /></Button>
                          <Button size="sm" className="ml-1 min-h-11 gap-1.5 rounded-xl" onClick={() => loadPreset(preset)}><FolderOpen className="size-4" />{tr('読込', 'Load')}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-bold tracking-[0.13em] text-muted-foreground">STARTER PRESETS</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {builtInPresets.map((preset) => (
                    <div key={preset.id} className="rounded-2xl border border-border bg-card p-3.5">
                      <div className="flex items-start justify-between gap-2"><div><Badge variant="secondary">{tr('初期プリセット', 'Starter preset')}</Badge><p className="mt-2 text-sm font-bold">{language === 'ja' ? preset.name : builtInPresetNamesEn[preset.id] ?? preset.name}</p><p className="mt-1 text-sm text-muted-foreground">{snapshotSummary(preset.snapshot, language)}</p></div><Sparkles className="size-4 text-primary" /></div>
                      <div className="mt-3 flex gap-2"><Button variant="outline" size="sm" className="min-h-11 flex-1 gap-1.5 rounded-xl" onClick={() => duplicatePreset(preset)}><CopyPlus className="size-4" />{tr('複製', 'Duplicate')}</Button><Button size="sm" className="min-h-11 flex-1 gap-1.5 rounded-xl" onClick={() => loadPreset(preset)}><FolderOpen className="size-4" />{tr('読込', 'Load')}</Button></div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={managerQuery} onChange={(event) => setManagerQuery(event.target.value)} aria-label={tr('履歴を検索', 'Search history')} placeholder={tr('操作名・内容で検索', 'Search action or summary')} className="h-11 rounded-xl bg-card pl-9" />
              </div>
              {historyItems.length === 0 ? (
                <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border text-center"><div><History className="mx-auto size-7 text-muted-foreground/45" /><p className="mt-3 text-sm font-bold">{tr('履歴はまだありません', 'No history yet')}</p><p className="mt-1 text-sm text-muted-foreground">{tr('編集・生成・コピー・読込を最大50件保存します。', 'Up to 50 edits, generations, copies, and loads are saved.')}</p></div></div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{tr('検索条件に合う履歴がありません。', 'No history matches your search.')}</div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
                      <Button variant="ghost" size="icon" aria-label={tr(item.pinned ? '履歴のピン留めを外す' : '履歴をピン留め', item.pinned ? 'Unpin history item' : 'Pin history item')} onClick={() => toggleHistoryPin(item)}>{item.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</Button>
                      <Button variant="ghost" size="icon" aria-label={tr('履歴に名前を付ける', 'Name history item')} onClick={() => renameHistory(item)}><Pencil className="size-4" /></Button>
                      <button type="button" onClick={() => loadSnapshot(item.snapshot, tr(`履歴「${item.label}」を復元`, `Restored history “${item.label}”`))} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition hover:bg-accent/35">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><History className="size-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name ?? item.label}</span><span className="mt-1 block line-clamp-1 text-sm text-muted-foreground">{snapshotSummary(item.snapshot, language)}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDate(item.createdAt)}</span></span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={guidedResetOpen} onOpenChange={setGuidedResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('現在の設定をリセットして、順番に作りますか？', 'Reset the current brief and build it step by step?')}</AlertDialogTitle>
            <AlertDialogDescription>{tr('入力中の設定、自由入力、ロック、ギャップ、選択中のテーマを空にします。保存済みプリセットと履歴、お気に入りは削除されません。開始前の内容は履歴へ退避し、直後なら「元に戻す」でも復元できます。', 'This clears current settings, custom text, locks, the active contrast, and the selected theme. Saved presets, history, and favorites are kept. The current brief is backed up to history and can also be restored immediately with Undo.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">{tr('キャンセル', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => startGuidedMode(true)}>{tr('リセットして開始', 'Reset and start')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={onboardingOpen} onOpenChange={(open) => {
        setOnboardingOpen(open);
        if (!open) setPreferences((current) => ({ ...current, onboardingSeen: true }));
      }}>
        <DialogContent showCloseButton={false} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{tr('最初のキャラクター指示書を作りましょう', 'Create your first character brief')}</DialogTitle>
            <DialogDescription className="text-sm">{tr('始め方はあとから自由に変更できます。入力はこのブラウザだけに保存されます。', 'You can change anything later. Your entries remain in this browser.')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => finishOnboarding('random')} className="min-h-36 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 text-left transition hover:border-primary">
              <Dices className="size-6 text-primary" /><span className="mt-3 block text-base font-bold">{tr('おまかせで開始', 'Start randomly')}</span><span className="mt-2 block text-sm text-muted-foreground">{tr('まとまった案をすぐ作る', 'Generate a coherent concept now')}</span>
            </button>
            <button type="button" onClick={() => finishOnboarding('purpose')} className="min-h-36 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary">
              <Sparkles className="size-6 text-primary" /><span className="mt-3 block text-base font-bold">{tr('用途から選ぶ', 'Choose a purpose')}</span><span className="mt-2 block text-sm text-muted-foreground">{tr('アイコン・立ち絵などから開始', 'Start with an icon, standing art, and more')}</span>
            </button>
            <button type="button" onClick={() => finishOnboarding('blank')} className="min-h-36 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary">
              <FileText className="size-6 text-primary" /><span className="mt-3 block text-base font-bold">{tr('一から順に作る', 'Build step by step')}</span><span className="mt-2 block text-sm text-muted-foreground">{tr('すべて空欄にして用途から決める', 'Clear everything and start with purpose')}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr('プリセット名を変更', 'Rename preset')}</DialogTitle>
            <DialogDescription>{tr('内容は変えず、一覧に表示する名前だけを変更します。', 'Only the displayed name changes; the saved settings stay the same.')}</DialogDescription>
          </DialogHeader>
          <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') confirmRename(); }} maxLength={50} className="h-11" aria-label={tr('新しいプリセット名', 'New preset name')} />
          <DialogFooter className="mx-0 mb-0 rounded-b-xl">
            <Button variant="outline" className="min-h-11" onClick={() => setRenameTarget(null)}>{tr('キャンセル', 'Cancel')}</Button>
            <Button className="min-h-11" onClick={confirmRename} disabled={!renameValue.trim()}>{tr('名前を変更', 'Rename')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyRenameTarget)} onOpenChange={(open) => { if (!open) setHistoryRenameTarget(null); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tr('履歴に名前を付ける', 'Name history item')}</DialogTitle>
            <DialogDescription>{tr('あとで検索しやすい短い名前を付けられます。', 'Add a short name that is easy to find later.')}</DialogDescription>
          </DialogHeader>
          <Input value={historyRenameValue} onChange={(event) => setHistoryRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') confirmHistoryRename(); }} maxLength={80} className="h-11" aria-label={tr('履歴の名前', 'History item name')} />
          <DialogFooter className="mx-0 mb-0 rounded-b-xl">
            <Button variant="outline" className="min-h-11" onClick={() => setHistoryRenameTarget(null)}>{tr('キャンセル', 'Cancel')}</Button>
            <Button className="min-h-11" onClick={confirmHistoryRename} disabled={!historyRenameValue.trim()}>{tr('保存', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('このプリセットを削除しますか？', 'Delete this preset?')}</AlertDialogTitle>
            <AlertDialogDescription>{tr(`「${deleteTarget?.name ?? ''}」は一覧から削除されます。この操作は元に戻せません。`, `“${deleteTarget?.name ?? ''}” will be removed from your presets. This cannot be undone.`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">{tr('キャンセル', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-11 bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>{tr('削除', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="relative shrink-0 border-b border-border p-5 pr-16">
            <DialogTitle className="flex items-center gap-2"><CircleHelp className="size-5 text-primary" />{tr('ヘルプ', 'Help')}</DialogTitle>
            <DialogDescription>{tr('基本の流れと、すばやく操作する方法を確認できます。', 'Learn the basic flow and ways to work faster.')}</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 min-h-11 min-w-11" onClick={() => setHelpOpen(false)} aria-label={tr('閉じる', 'Close')}><X className="size-4" /></Button>
          </DialogHeader>
          <Tabs value={helpTab} onValueChange={(value) => setHelpTab(value as typeof helpTab)} className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="shrink-0 px-5 pt-5">
              <TabsList variant="line" className="max-w-full justify-start p-0 group-data-horizontal/tabs:h-11">
                <TabsTrigger value="guide" className="h-11 flex-none px-4">{tr('使い方', 'Getting started')}</TabsTrigger>
                <TabsTrigger value="shortcuts" className="h-11 flex-none px-4">{tr('ショートカット', 'Shortcuts')}</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="guide" className="mt-0 min-h-0 overflow-y-auto px-5 pb-5 pt-4 overscroll-contain">
              <ol className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: tr('設定メモから始める', 'Start from a character note'),
                    body: tr('「設定メモから作る」で自由文を端末内解析し、明示・推測・提案の候補を確認してからフォームへ反映できます。', 'Use Build from a note to analyze free text on this device, review explicit, inferred, and suggested candidates, then apply them to the form.'),
                  },
                  {
                    title: tr('始め方を選ぶ', 'Choose how to start'),
                    body: tr('「一から順に作る」は全項目を空にして順番に入力。「おまかせ」はまとまった案を一括で作ります。', 'Build step by step clears the brief and guides you in order. Randomize creates a complete concept at once.'),
                  },
                  {
                    title: tr('必要な部分を調整', 'Refine what matters'),
                    body: tr('項目横のサイコロはその項目だけ変更します。鍵をかけた項目は、おまかせやギャップ生成でも維持されます。', 'A field’s die changes only that field. Locked fields stay unchanged during randomization and contrast generation.'),
                  },
                  {
                    title: tr('保存・復元する', 'Save and restore'),
                    body: tr('入力・メモ下書き・候補の採用状態は、このブラウザへ自動保存されます。「完全バックアップ」は履歴やお気に入りも含むJSONです。読込前に置き換える内容を確認でき、読込前の状態へ1世代戻せます。', 'Settings, note drafts, and candidate decisions are autosaved in this browser. Full backup JSON includes history and favorites. Review imports before replacing anything, and restore one pre-import session if needed.'),
                  },
                  {
                    title: tr('画風と内容を分けて作る', 'Separate style and content'),
                    body: tr('STEP 2の画風ライブラリで80種から1つ選び、補助30種を任意で追加します（1〜3件推奨、最大5件）。ブロックタブでコピー対象を切り替え、整形・1行・JSONでコピーできます。テンプレ保存は人物設定も一緒に保存します。解除すれば保持していた従来の絵柄に戻ります。', 'Choose one of 80 styles in STEP 2 and optionally add helpers (1–3 recommended, maximum 5). The Blocks tab offers inclusion toggles and formatted, one-line, or JSON copy. Templates save the character settings too. Clearing the style restores classic inputs.'),
                  },
                  {
                    title: tr('形式を選んでコピー', 'Choose a format and copy'),
                    body: tr('プレビューで日本語・英語・短縮・タグ・サービス別形式を選び、必要な内容をコピーします。', 'In the preview, choose Japanese, English, short, tags, or a tool-specific format, then copy what you need.'),
                  },
                ].map((item, index) => (
                  <li key={item.title} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">{index + 1}</span>
                      <div><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p></div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.055] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-primary"><Lock className="size-4" />{tr('入力はこのブラウザ内に保存', 'Saved in this browser')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tr('入力内容は外部AIへ自動送信されません。共有前に自由入力を含めるか選べます。メモ下書きや履歴は共有リンクに含みませんが、URLを知っている人は内容を読めます。リンクは暗号化されず、後から無効化もできません。', 'Entries are not automatically sent to an external AI. Choose which custom text to include before sharing. Note drafts and history are excluded, but anyone with the URL can read the shared settings. Links are not encrypted and cannot be revoked.')}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr('自動保存は端末・ブラウザ・サイトごとです。ブラウザのデータ削除では失われるため、大切な設定は完全バックアップを保存してください。別タブの更新を検出すると上書きを防ぐため保存を停止します。', 'Autosave is specific to this device, browser, and site. Clearing browser data removes it; keep full backups of important work. If another tab updates the workspace, autosave pauses to prevent overwriting it.')}</p>
              </div>
            </TabsContent>
            <TabsContent value="shortcuts" className="mt-0 min-h-0 overflow-y-auto px-5 pb-5 pt-4 overscroll-contain">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{tr('入力欄の編集中や日本語変換中は発動しません。', 'Shortcuts are disabled while editing text or using an IME.')}</p>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 text-sm">
                {[
                  [tr('おまかせ', 'Randomize'), 'Ctrl/⌘ + Enter'],
                  [tr('ギャップ生成', 'Generate contrast'), 'Ctrl/⌘ + Shift + Enter'],
                  [tr('元に戻す', 'Undo'), 'Ctrl/⌘ + Z'],
                  [tr('やり直す', 'Redo'), 'Ctrl/⌘ + Shift + Z'],
                  [tr('現在の出力をコピー', 'Copy current output'), 'Alt + C'],
                  [tr('カテゴリへ移動', 'Jump to category'), 'Alt + 1…9'],
                  [tr('ショートカット一覧を開く', 'Open the shortcut list'), '?'],
                ].map(([label, key]) => <div key={key} className="contents"><dt>{label}</dt><dd className="rounded-md bg-muted px-2 py-1 font-mono font-semibold">{key}</dd></div>)}
              </dl>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t border-border bg-muted/25 p-4 sm:px-5"><Button className="min-h-11" onClick={() => setHelpOpen(false)}>{tr('閉じる', 'Close')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="relative shrink-0 border-b border-border p-5 pr-16">
            <DialogTitle className="flex items-center gap-2"><Megaphone className="size-5 text-primary" />{tr('更新履歴', 'What’s new')}</DialogTitle>
            <DialogDescription>{tr('主な追加・変更を新しい順に掲載しています。', 'Major additions and changes, newest first.')}</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 min-h-11 min-w-11" onClick={() => setChangelogOpen(false)} aria-label={tr('閉じる', 'Close')}><X className="size-4" /></Button>
          </DialogHeader>
          <section aria-label={tr('更新内容', 'Release notes')} className="min-h-0 flex-1 overflow-y-auto p-5 overscroll-contain">
            <ol className="space-y-3">
              {releaseNotes.map((note, index) => (
                <li key={`${note.date}-${note.titleJa}`}>
                  <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <time dateTime={note.date} className="text-sm font-bold text-muted-foreground">{note.date.replaceAll('-', '.')}</time>
                      {index === 0 && <Badge>{tr('最新', 'Latest')}</Badge>}
                    </div>
                    <h3 className="mt-2 text-base font-bold">{tr(note.titleJa, note.titleEn)}</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                      {(language === 'ja' ? note.itemsJa : note.itemsEn).map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>)}
                    </ul>
                  </article>
                </li>
              ))}
            </ol>
          </section>
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t border-border bg-muted/25 p-4 sm:px-5"><Button className="min-h-11" onClick={() => setChangelogOpen(false)}>{tr('閉じる', 'Close')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(shareSource)} onOpenChange={(open) => { if (!open) setShareSource(null); }}>
        <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0 pr-8">
            <DialogTitle>{tr('共有する内容を確認', 'Review what you share')}</DialogTitle>
            <DialogDescription>{tr('リンクを知っている人は設定を読めます。暗号化やアクセス制限はありません。', 'Anyone with the link can read the settings. It is not encrypted or access-restricted.')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain">
            <p className="rounded-xl bg-muted p-3 text-sm">{tr('選択した項目を共有します。メモ下書き・履歴・プリセット・ロック・ギャップの変更履歴は含めません。自由入力は初期状態では除外します。', 'Selected settings are shared. Note drafts, history, presets, locks, and contrast provenance are excluded. Custom text is excluded by default.')}</p>
            <fieldset className="space-y-2 rounded-xl border border-border p-3">
              <legend className="px-1 font-semibold">{tr('共有に含める自由入力', 'Custom text to include')}</legend>
              {Object.entries(shareSource?.draft.custom ?? {}).filter(([, value]) => value.trim()).length === 0 && <p className="text-sm text-muted-foreground">{tr('自由入力はありません。', 'No custom text.')}</p>}
              {Object.entries(shareSource?.draft.custom ?? {}).filter(([, value]) => value.trim()).map(([key, value]) => <label key={key} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted">
                <Checkbox className="mt-1" checked={shareCustomKeys.includes(key)} onCheckedChange={(checked) => setShareCustomKeys((current) => checked ? [...current, key] : current.filter((item) => item !== key))} />
                <span className="min-w-0 text-sm"><span className="block font-semibold">{({ purpose: tr('用途', 'Purpose'), style: tr('絵柄', 'Style'), character: tr('人物', 'Character'), appearance: tr('顔・髪', 'Appearance'), outfit: tr('衣装', 'Outfit'), action: tr('表情・ポーズ', 'Pose'), scene: tr('背景・光', 'Scene'), negatives: tr('禁止事項', 'Exclusions') } as Record<string, string>)[key] ?? key}</span><span className="block whitespace-pre-wrap break-words text-muted-foreground">{value}</span></span>
              </label>)}
            </fieldset>
            {sharedSnapshot && <>
              <section className="rounded-xl border border-border p-3"><h3 className="font-semibold">{tr('共有内容のプレビュー', 'Shared brief preview')}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{generatePrompts(sharedSnapshot.draft)[language === 'ja' ? 'ja' : 'en'] || tr('未設定', 'Not set')}</p></section>
              <details className="rounded-xl border border-border p-3"><summary className="min-h-11 cursor-pointer font-semibold">{tr('共有される設定をすべて確認', 'Review all included settings')}</summary><ChangeList changes={diffSnapshots(createBlankSnapshot(), sharedSnapshot)} language={language} /></details>
            </>}
            <p className="text-sm text-muted-foreground">{tr('リンクは現在の設定のコピーです。後から編集しても共有済みの内容は変わらず、リンクを無効化することもできません。', 'The link is a snapshot. Later edits do not update an existing link, and links cannot be revoked.')}</p>
            {shareUrl.length <= MAX_SHARE_URL_LENGTH && <label className="block text-sm font-semibold">{tr('共有リンク（手動コピーもできます）', 'Share link (also available for manual copy)')}<Textarea readOnly value={shareUrl} className="mt-2 min-h-20 break-all font-mono text-sm" onFocus={(event) => event.target.select()} /></label>}
            {shareUrl.length > MAX_SHARE_URL_LENGTH && <p role="alert" className="text-sm text-destructive">{tr('内容が長いためリンクでは共有できません。共有用JSONを利用してください。', 'This content is too long for a share link. Use the share JSON instead.')}</p>}
          </div>
          <DialogFooter className="shrink-0 flex-wrap">
            <Button variant="outline" className="min-h-11" onClick={() => setShareSource(null)}>{tr('閉じる', 'Close')}</Button>
            <Button variant="outline" className="min-h-11" onClick={() => sharedSnapshot && downloadJson(exportStudioData(sharedSnapshot, []), 'character-order-room-share')}>{tr('共有用JSON', 'Share JSON')}</Button>
            <Button className="min-h-11" disabled={!sharedSnapshot || shareUrl.length > MAX_SHARE_URL_LENGTH} onClick={() => void copyText(shareUrl, tr('共有リンクをコピー', 'Copied share link'), false)}>{tr('この内容のリンクをコピー', 'Copy this share link')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(incomingShare)} onOpenChange={(open) => { if (!open) setIncomingShare(null); }}>
        <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0 pr-8"><DialogTitle>{tr('共有設定を読み込みますか？', 'Load these shared settings?')}</DialogTitle><DialogDescription>{tr('まだ入力は変更していません。読み込むと現在のフォームを置き換えます。メモ・保存済みプリセットはそのままです。変更前のフォームは履歴へ残します。', 'Nothing has changed yet. Loading replaces the form, but keeps your note and presets. The previous form is retained in history.')}</DialogDescription></DialogHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain">{incomingShare && <ChangeList changes={diffSnapshots(makeSnapshot(), incomingShare)} language={language} />}</div>
          <DialogFooter className="shrink-0"><Button variant="outline" className="min-h-11" onClick={() => setIncomingShare(null)}>{tr('読み込まない', 'Keep my work')}</Button><Button className="min-h-11" disabled={!storageReady || autosave.status === 'conflict'} onClick={acceptIncomingShare}>{tr('確認して読み込む', 'Load reviewed settings')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingImport)} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0 pr-8"><DialogTitle>{tr('JSON読込前の確認', 'Review JSON import')}</DialogTitle><DialogDescription className="break-all">{pendingImport?.name}</DialogDescription></DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain">
            <p className="text-sm leading-relaxed">{pendingImport?.data.workspace
              ? tr('完全バックアップです。現在の入力・プリセット・履歴・お気に入り・表示設定・メモ下書きを置き換えます。読み込み前の全データを1世代退避し、あとから戻せます。', 'This is a full backup. It replaces settings, presets, history, favorites, preferences, and note drafts. One complete pre-import session is kept for recovery.')
              : tr('従来形式のJSONです。現在のフォームを置き換え、プリセットを追加します。メモ・履歴・お気に入りは保持します。読み込み前の全データも退避します。', 'This is a legacy/share JSON. It replaces the form and adds presets, keeping your note, history, and favorites. Your full previous session is also kept for recovery.')}</p>
            <p className="text-sm font-semibold">{tr(`読み込むプリセット：${pendingImport?.data.presets.length ?? 0}件`, `Presets in file: ${pendingImport?.data.presets.length ?? 0}`)}</p>
            {pendingImport?.data.workspace && <p className="text-sm">{tr(`履歴：${pendingImport.data.workspace.history.length}件 · メモ：${pendingImport.data.workspace.noteWorkspace.note.length}文字`, `History: ${pendingImport.data.workspace.history.length} · Note: ${pendingImport.data.workspace.noteWorkspace.note.length} characters`)}</p>}
            {pendingImport && <ChangeList changes={diffSnapshots(makeSnapshot(), pendingImport.data.current)} language={language} />}
          </div>
          <DialogFooter className="shrink-0"><Button variant="outline" className="min-h-11" onClick={() => setPendingImport(null)}>{tr('キャンセル', 'Cancel')}</Button><Button className="min-h-11" disabled={!storageReady || autosave.status === 'conflict'} onClick={confirmImport}>{tr('退避して読み込む', 'Back up and import')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent showCloseButton={false} className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="relative border-b border-border p-5 pr-16">
            <DialogTitle>{tr('4つの差分案', 'Four variations')}</DialogTitle>
            <DialogDescription>{tr('現在の設定とロックを基準に作りました。採用するまで現在の内容は変わりません。', 'These use your current settings and locks. Nothing changes until you adopt one.')}</DialogDescription>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setBatchOpen(false)} aria-label={tr('閉じる', 'Close')}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="grid min-h-0 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
            {batchBase && <details className="min-w-0 rounded-xl border border-border p-3 sm:col-span-2">
              <summary className="min-h-11 cursor-pointer font-semibold">{tr('4案を表で比較（変更のある全項目）', 'Compare all changed fields across four ideas')}</summary>
              <p className="pb-2 text-xs text-muted-foreground">{tr('横にスクロールすると、4案すべてを確認できます。', 'Scroll horizontally to see all four ideas.')}</p>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={tr('4案の比較表。横にスクロールできます', 'Four-idea comparison. Scroll horizontally')}>
                <table className="w-full min-w-[700px] text-left text-sm"><caption className="py-2 text-left text-muted-foreground">{tr('生成時の入力と比較しています。変更がない案には「同じ」と表示します。', 'Compared with the settings at generation time. Unchanged values are marked “Same”.')}</caption>
                  <thead><tr>{[tr('項目', 'Field'), tr('現在', 'Current'), ...batchItems.map((_, index) => tr(`案${index + 1}`, `Idea ${index + 1}`))].map((label) => <th key={label} className="border-b p-3">{label}</th>)}</tr></thead>
                  <tbody>{[...new Map(batchItems.flatMap((item) => diffSnapshots(batchBase, { draft: item, locks: batchBase.locks })).map((change) => [change.id, change])).values()].map((row) => <tr key={row.id}>
                    <th scope="row" className="border-b p-3">{language === 'ja' ? row.labelJa : row.labelEn}</th><td className="max-w-48 break-words border-b p-3 text-muted-foreground">{language === 'ja' ? row.beforeJa : row.beforeEn}</td>
                    {batchItems.map((item, index) => { const change = diffSnapshots(batchBase, { draft: item, locks: batchBase.locks }).find((entry) => entry.id === row.id); return <td key={index} className="max-w-48 break-words border-b p-3">{change ? language === 'ja' ? change.afterJa : change.afterEn : tr('同じ', 'Same')}</td>; })}
                  </tr>)}</tbody>
                </table>
              </div>
            </details>}
            {batchItems.map((item, index) => {
              const snapshot = { draft: item, locks };
              const changes = diffSnapshots(batchBase ?? makeSnapshot(), snapshot);
              const itemOutputs = generatePrompts(item);
              return (
                <article key={`${index}-${JSON.stringify(item).slice(0, 60)}`} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between"><Badge>{tr(`案 ${index + 1}`, `Idea ${index + 1}`)}</Badge><span className="text-sm text-muted-foreground">{tr(`${changes.length}項目変更`, `${changes.length} changes`)}</span></div>
                  <p className="mt-3 text-sm font-semibold">{snapshotSummary(snapshot, language)}</p>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {changes.slice(0, 4).map((change) => <li key={change.id}>{language === 'ja' ? change.labelJa : change.labelEn}: {language === 'ja' ? change.afterJa : change.afterEn}</li>)}
                  </ul>
                  <details className="mt-3 rounded-xl border border-border p-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">{tr(`全${changes.length}件の変更前・変更後`, `Before and after for all ${changes.length} changes`)}</summary><ChangeList changes={changes} language={language} /></details>
                  <details className="mt-2 rounded-xl border border-border p-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">{tr('採用前に指示書を確認', 'Preview the brief before adopting')}</summary><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{itemOutputs[outputMode]}</p></details>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="min-h-11 rounded-xl" onClick={() => copyText(itemOutputs[outputMode], tr(`案${index + 1}をコピー`, `Copied idea ${index + 1}`), false)}><Clipboard className="size-4" />{tr('コピー', 'Copy')}</Button>
                    <Button size="sm" className="min-h-11 rounded-xl" onClick={() => adoptBatch(item, index)}><Check className="size-4" />{tr('採用', 'Adopt')}</Button>
                  </div>
                </article>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
}
