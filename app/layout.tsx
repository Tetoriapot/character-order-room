import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://character-order-room.tetoriapot.chatgpt.site';
const siteTitle = 'キャラクター発注室 | イラスト指示書メーカー';
const siteDescription =
  '選ぶだけで、キャラクターイラストの日本語・英語プロンプトを作れるブラウザツール。';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: { icon: '/favicon.svg' },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteUrl,
    siteName: 'キャラクター発注室',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1740,
        height: 910,
        alt: 'キャラクター発注室—選ぶだけで、イラスト指示書ができあがる。',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
