'use client';

import {
  Download,
  Upload,
  History,
  CircleHelp,
  Megaphone,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { assetCategories, assetSubjects } from '@/data/asset-options';
import type { AssetHistoryEntry } from '@/lib/asset-history';
import { useAssetUi } from './asset-ui-context';

export type AssetMenu = 'help' | 'changelog' | 'history' | 'save' | null;
export function AssetStudioMenu({
  panel,
  onClose,
  ready,
  entries,
  historyIssue,
  onRestore,
  onExport,
  onImport,
}: {
  panel: AssetMenu;
  onClose: () => void;
  ready: boolean;
  entries: AssetHistoryEntry[];
  historyIssue: boolean;
  onRestore: (entry: AssetHistoryEntry) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const { language, tr } = useAssetUi();
  const titles = {
    help: tr('ヘルプ', 'Help'),
    changelog: tr('更新履歴', 'What’s new'),
    history: tr('履歴', 'History'),
    save: tr('保存・読込', 'Save / Load'),
  };
  const icons = {
    help: CircleHelp,
    changelog: Megaphone,
    history: History,
    save: Bookmark,
  };
  const Icon = panel ? icons[panel] : CircleHelp;
  const actionNames: Record<string, string> = {
    edit: tr('設定変更前', 'Before editing'),
    random: tr('ランダム変更前', 'Before randomizing'),
    replace: tr('設定の置換前', 'Before replacing settings'),
    undo: tr('元に戻す前', 'Before undo'),
    history: tr('履歴の復元前', 'Before restoring history'),
  };
  return (
    <Dialog
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="asset-studio flex max-h-[85dvh] flex-col overflow-hidden bg-card sm:max-w-2xl">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-primary" />
            {panel && titles[panel]}
          </DialogTitle>
          <DialogDescription>
            {tr(
              '素材・演出発注室の設定と使い方',
              'Settings and guidance for the asset and motion studio',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-1 text-sm leading-relaxed">
          {panel === 'save' && (
            <>
              <p>
                {tr(
                  '入力内容はこのブラウザに自動保存されます。別の端末でも使うにはJSONで保存してください。',
                  'Settings are autosaved in this browser. Export JSON to use them on another device.',
                )}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  disabled={!ready}
                  className="min-h-11"
                  onClick={onExport}
                >
                  <Download />
                  {tr('JSON保存')}
                </Button>
                <Button
                  disabled={!ready}
                  variant="outline"
                  className="min-h-11"
                  onClick={onImport}
                >
                  <Upload />
                  {tr('JSON読込')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  'JSONには素材の設定・自由入力・禁止事項・ランダムのロックを含みます。履歴・表示設定は含みません。読込前に内容を確認でき、反映後は「元に戻す」で戻せます。',
                  'JSON includes asset settings, custom text, exclusions and random locks. History and display preferences are not included. Review imports before applying them; Undo restores the previous settings.',
                )}
              </p>
            </>
          )}
          {panel === 'history' && (
            <>
              <p>
                {tr(
                  '変更前の設定を最大50件、このブラウザに保存します。復元する内容を確認してから反映できます。',
                  'Up to 50 previous settings are stored in this browser. Review a snapshot before restoring it.',
                )}
              </p>
              {historyIssue && (
                <p role="alert" className="rounded-lg bg-muted p-3">
                  {tr(
                    '履歴を保存・読込できませんでした。この画面では今回の履歴を表示しています。現在の設定はJSONで保存できます。',
                    'History could not be saved or loaded. This list shows the current session. You can export your current settings as JSON.',
                  )}
                </p>
              )}
              {!entries.length && (
                <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  {tr(
                    '履歴はまだありません。項目を編集すると追加されます。',
                    'No history yet. Edit a field to create a snapshot.',
                  )}
                </p>
              )}
              {entries.map((entry) => {
                const category = assetCategories.find(
                  (item) => item.id === entry.draft.category,
                )!;
                const subject = assetSubjects[entry.draft.category].find(
                  (item) =>
                    item.id === entry.draft.subjects[entry.draft.category],
                );
                return (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => onRestore(entry)}
                    className="block min-h-11 w-full rounded-lg border border-border p-4 text-left hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="block font-semibold">
                      {actionNames[entry.action.split(':')[0]] ??
                        actionNames.edit}
                    </span>
                    <span className="mt-1 block text-muted-foreground">
                      {category[language]} ·{' '}
                      {subject?.[language] || tr('自由に指定')}
                    </span>
                    <time
                      dateTime={new Date(entry.createdAt).toISOString()}
                      className="mt-2 block text-xs text-muted-foreground"
                    >
                      {new Date(entry.createdAt).toLocaleString(
                        language === 'ja' ? 'ja-JP' : 'en-US',
                      )}
                    </time>
                  </button>
                );
              })}
            </>
          )}
          {panel === 'help' && (
            <>
              {[
                [
                  tr(
                    '1. 対象と仕上がりを選ぶ',
                    '1. Choose a subject and finish',
                  ),
                  tr(
                    'エフェクト・モノ・モーションから対象を選び、静止画・動画・スプライトシートの形式を指定します。テンプレートからも始められます。',
                    'Choose effects, objects or motion, then a still image, video or sprite sheet. Templates provide a starting point.',
                  ),
                ],
                [
                  tr('2. ランダムとロック', '2. Randomize and lock'),
                  tr(
                    '鍵で項目を固定、サイコロで1項目だけ変更。出力の種類・自由入力・禁止事項は保持します。詳細が入力済みの対象は、おまかせでは種類を変えません。',
                  ),
                ],
                [
                  tr('3. 指示書を使う', '3. Use the brief'),
                  tr(
                    'ブロック・日本語・English・日英・短縮・タグを切り替えてコピー、またはTXTで保存できます。表示言語と指示書の出力言語は別々に選べます。',
                    'Choose Blocks, Japanese, English, JP + EN, Short or Tags, then copy or save TXT. Interface language and output language are selected separately.',
                  ),
                ],
                [
                  tr('4. 保存と復元', '4. Save and restore'),
                  tr(
                    '入力は自動保存。「保存・読込」からJSONを書き出し・読み込みできます。「履歴」では変更前の設定を選んで復元できます。',
                    'Settings autosave. Save / Load exports and imports JSON. History lets you restore previous settings.',
                  ),
                ],
              ].map(([title, body]) => (
                <section key={title}>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-muted-foreground">{body}</p>
                </section>
              ))}
              <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                {tr(
                  'このページは指示書を作るツールです。画像・動画の生成は行いません。入力内容はこのブラウザに保存されます。',
                )}
              </p>
            </>
          )}
          {panel === 'changelog' && (
            <>
              <time className="text-xs text-muted-foreground">2026-10-05</time>
              <h3 className="font-bold">
                {tr(
                  '共通ヘッダーと素材専用メニュー',
                  'Shared header and asset studio menus',
                )}
              </h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  {tr(
                    'キャラクター発注室とヘッダーの構成を統一しました。素材ページの配色とサイト名は保持しています。',
                    'Aligned the header with the character studio while keeping the asset studio name and colors.',
                  )}
                </li>
                <li>
                  {tr(
                    '表示言語・明暗の切替、更新履歴、ヘルプ、編集履歴、保存・読込をヘッダーにまとめました。',
                    'The header now includes language, color mode, updates, help, edit history and Save / Load.',
                  )}
                </li>
              </ul>
              <h3 className="border-t border-border pt-4 font-bold">
                {tr('収録済みの機能', 'Available features')}
              </h3>
              <p>
                {tr(
                  'RPG・漫画向けを含むエフェクト384種類、画風68種類。カテゴリ検索、項目別ランダム、ロック、6種類の出力形式に対応しています。',
                  '384 effects and 68 styles, including RPG and manga choices, with category search, per-field randomization, locks and six output formats.',
                )}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
