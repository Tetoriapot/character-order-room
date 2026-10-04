import type { Metadata } from 'next';
import { AssetStudio } from '@/components/studio/asset-studio';

export const metadata: Metadata = {
  title: '素材・演出発注室 | エフェクト・モノ・モーションの指示書メーカー',
  description:
    'キャラクターなしで、エフェクト・モノ・モーションの日本語・英語プロンプトを作るブラウザツール。',
  openGraph: {
    title: '素材・演出発注室',
    description: 'エフェクト・モノ・モーション専用の指示書メーカー。',
    url: '/assets/',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: '素材・演出発注室',
    description: 'エフェクト・モノ・モーション専用の指示書メーカー。',
    images: [],
  },
};

export default function AssetsPage() {
  return <AssetStudio />;
}
