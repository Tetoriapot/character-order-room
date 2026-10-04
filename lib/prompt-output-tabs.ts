import type { OutputMode } from './character-types';

export type StudioOutputMode = OutputMode | 'blocks';

export const outputTabs: Array<{
  value: StudioOutputMode;
  labelJa: string;
  labelEn: string;
  hintJa: string;
  hintEn: string;
}> = [
  {
    value: 'blocks',
    labelJa: 'ブロック',
    labelEn: 'Blocks',
    hintJa: '内容（日本語）・画風・補助・禁止事項を分離',
    hintEn: 'Japanese content, English style, helpers, and exclusions',
  },
  {
    value: 'ja',
    labelJa: '日本語',
    labelEn: 'Japanese',
    hintJa: '人への依頼・内容確認向け',
    hintEn: 'For review or a Japanese-language commission',
  },
  {
    value: 'en',
    labelJa: 'English',
    labelEn: 'English',
    hintJa: '英語対応の画像生成AI向け',
    hintEn: 'For image tools that accept natural English',
  },
  {
    value: 'both',
    labelJa: '日英',
    labelEn: 'JP + EN',
    hintJa: '共有・保存用の完全版',
    hintEn: 'Complete bilingual version for sharing',
  },
  {
    value: 'short',
    labelJa: '短縮',
    labelEn: 'Short',
    hintJa: '文字数を抑えたいサービス向け',
    hintEn: 'For tools with tighter prompt limits',
  },
  {
    value: 'tags',
    labelJa: 'タグ',
    labelEn: 'Tags',
    hintJa: 'カンマ区切り入力向け',
    hintEn: 'For comma-separated tag prompts',
  },
];
