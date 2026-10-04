'use client';

import { useState } from 'react';
import { Clipboard, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildAssetOutputs } from '@/lib/asset-prompt';
import { outputTabs, type StudioOutputMode } from '@/lib/prompt-output-tabs';
import type { AssetDraft } from '@/data/asset-options';
import type { StylePackSelection } from '@/lib/style-pack-types';
import { PromptBlockPreview } from './prompt-block-preview';

export function AssetOutputPreview({
  draft,
  ready,
  onCopy,
  onDownload,
}: {
  draft: AssetDraft;
  ready: boolean;
  onCopy: (text: string) => void;
  onDownload: (text: string, filename: string, mime: string) => void;
}) {
  const [mode, setMode] = useState<StudioOutputMode>('ja');
  const [blockSelection, setBlockSelection] = useState<StylePackSelection>({
    presetId: '',
    antiAiIds: [],
    excludedBlocks: [],
  });
  const outputs = buildAssetOutputs(draft, blockSelection.excludedBlocks);
  const activeOutput = outputs[mode];
  const activeTab = outputTabs.find((tab) => tab.value === mode)!;
  const warnings = mode === 'ja' ? outputs.warningsJa : outputs.warningsEn;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground">
            LIVE PREVIEW
          </p>
          <h2 id="asset-preview-title" className="mt-1 text-lg font-bold">
            できあがりの指示書
          </h2>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-success/25 bg-success/10 text-success"
        >
          <span className="size-1.5 rounded-full bg-success" />
          自動更新
        </Badge>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-none">
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as StudioOutputMode)}
          className="gap-0"
        >
          <div className="border-b border-border px-2 pt-2 pb-1">
            <TabsList
              variant="line"
              className="grid w-full grid-cols-3 gap-1 group-data-horizontal/tabs:h-auto"
              aria-label="指示書の出力方法"
            >
              {outputTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-11 min-w-0 px-2 text-sm group-data-horizontal/tabs:after:bottom-0"
                >
                  {tab.labelJa}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              disabled={!ready || !activeOutput}
              className="my-2 min-h-11 w-full gap-2"
              onClick={() => onCopy(activeOutput)}
            >
              <Clipboard className="size-4" />
              {activeTab.labelJa}をコピー
            </Button>
          </div>
          {outputTabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="min-h-[330px] p-5"
            >
              <p className="mb-4 rounded-lg bg-muted/55 p-3 text-sm text-muted-foreground">
                {tab.hintJa}
              </p>
              {tab.value === 'blocks' ? (
                <PromptBlockPreview
                  blocks={outputs.promptBlocks}
                  selection={blockSelection}
                  language="ja"
                  onChange={setBlockSelection}
                  onCopy={onCopy}
                />
              ) : tab.value === 'ja' || tab.value === 'en' ? (
                <div>
                  <p className="whitespace-pre-wrap text-[14px] leading-7 text-foreground/86 [overflow-wrap:anywhere]">
                    {tab.value === 'ja'
                      ? outputs.positiveJa
                      : outputs.positiveEn}
                  </p>
                  <div className="mt-5 rounded-lg border border-negative-foreground/10 bg-negative p-3.5 text-sm leading-6 text-negative-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {tab.value === 'ja'
                      ? outputs.negativeJa
                      : outputs.negativeEn}
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground/86 [overflow-wrap:anywhere]">
                  {outputs[tab.value]}
                </pre>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <div className="border-t border-border bg-muted/35 p-3">
          {(mode === 'ja' || mode === 'en') && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                disabled={!ready}
                variant="outline"
                size="sm"
                className="min-h-11 rounded-lg bg-card"
                onClick={() =>
                  onCopy(
                    mode === 'ja' ? outputs.positiveJa : outputs.positiveEn,
                  )
                }
              >
                肯定だけ
              </Button>
              <Button
                disabled={!ready}
                variant="outline"
                size="sm"
                className="min-h-11 rounded-lg bg-card"
                onClick={() =>
                  onCopy(
                    mode === 'ja' ? outputs.negativeJa : outputs.negativeEn,
                  )
                }
              >
                制約だけ
              </Button>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            <span>{activeOutput.length.toLocaleString('ja-JP')}文字</span>
            <span>タブで用途別に切替</span>
          </div>
          <Button
            disabled={!ready || !activeOutput}
            variant="outline"
            className="mt-3 min-h-11 w-full"
            onClick={() =>
              onDownload(
                activeOutput,
                `asset-brief-${mode}.txt`,
                'text/plain;charset=utf-8',
              )
            }
          >
            <Download />
            {activeTab.labelJa}をTXT保存
          </Button>
        </div>
      </div>
      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((warning) => (
            <p
              key={warning}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
