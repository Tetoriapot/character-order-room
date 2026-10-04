'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  Bookmark,
  ChevronRight,
  CircleHelp,
  History,
  Languages,
  Megaphone,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudioHeader({
  title,
  subtitle,
  icon,
  roomHref,
  roomLabel,
  roomIcon,
  language = 'ja',
  dark,
  onToggleLanguage,
  onToggleColorMode,
  onChangelog,
  onHelp,
  onHistory,
  onSaveLoad,
  saveLoadLabel,
  helpShortcut,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  roomHref: string;
  roomLabel: string;
  roomIcon: ReactNode;
  language?: 'ja' | 'en';
  dark: boolean;
  onToggleLanguage: () => void;
  onToggleColorMode: () => void;
  onChangelog: () => void;
  onHelp: () => void;
  onHistory: () => void;
  onSaveLoad: () => void;
  saveLoadLabel?: string;
  helpShortcut?: string;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const tr = (ja: string, en: string) => (language === 'ja' ? ja : en);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () =>
      document.documentElement.style.setProperty(
        '--studio-header-height',
        `${header.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(update);
    update();
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border bg-card"
    >
      <div className="mx-auto flex min-h-16 max-w-[1680px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight sm:text-lg">
              {title}
            </h1>
            <p className="hidden text-xs font-bold tracking-[0.08em] text-muted-foreground sm:block">
              {subtitle}
            </p>
          </div>
        </div>
        <nav
          aria-label={tr('発注室のメニュー', 'Studio menu')}
          className="flex w-full flex-wrap items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-2"
        >
          <a
            href={roomHref}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {roomIcon}
            {roomLabel}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </a>
          <Button
            aria-label={tr('表示言語を切り替える', 'Switch display language')}
            title={tr('表示言語を切り替える', 'Switch display language')}
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 rounded-lg"
            onClick={onToggleLanguage}
          >
            <Languages className="size-4" />
          </Button>
          <Button
            aria-label={tr('明るさを切り替える', 'Toggle color mode')}
            title={tr('明るさを切り替える', 'Toggle color mode')}
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 rounded-lg"
            onClick={onToggleColorMode}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            aria-label={tr('更新履歴を開く', 'Open changelog')}
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 gap-2 rounded-lg px-2.5 xl:px-3"
            title={tr('更新履歴', 'What’s new')}
            onClick={onChangelog}
          >
            <Megaphone className="hidden size-4 sm:block" />
            <span>{tr('更新履歴', 'What’s new')}</span>
          </Button>
          <Button
            aria-label={tr('ヘルプを開く', 'Open help')}
            aria-keyshortcuts={helpShortcut}
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 gap-2 rounded-lg px-2.5 xl:px-3"
            title={tr('ヘルプ', 'Help')}
            onClick={onHelp}
          >
            <CircleHelp className="hidden size-4 sm:block" />
            <span>{tr('ヘルプ', 'Help')}</span>
          </Button>
          <Button
            aria-label={tr('履歴を開く', 'Open history')}
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 gap-2 rounded-lg px-2.5 sm:px-3"
            title={tr('編集履歴', 'Edit history')}
            onClick={onHistory}
          >
            <History className="size-4" />
            <span className="hidden xl:inline">{tr('履歴', 'History')}</span>
          </Button>
          <Button
            aria-label={
              saveLoadLabel ??
              tr('設定を保存・読み込み', 'Save or load settings')
            }
            variant="outline"
            size="sm"
            className="min-h-11 min-w-11 gap-2 rounded-lg bg-card px-2.5 sm:px-3"
            title={
              saveLoadLabel ??
              tr('設定を保存・読み込み', 'Save or load settings')
            }
            onClick={onSaveLoad}
          >
            <Bookmark className="hidden size-4 sm:block" />
            <span>{tr('保存・読込', 'Save / Load')}</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
