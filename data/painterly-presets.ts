import type { PainterlyControls, StylePreset } from '@/lib/style-pack-types';
import { composePainterlyPrompt, painterlyBasePrompt } from './painterly-options';

const profiles: Array<{ id: string; ja: string; en: string; base: string; defaults: Required<PainterlyControls>; tags: string[] }> = [
  { id: 'iridescent_painterly_anime', ja: '虹色反射の厚塗りアニメ', en: 'Iridescent Painterly Anime', base: painterlyBasePrompt,
    defaults: { brushTexture: 'bold', hairRendering: 'chunky', colorLight: 'iridescent', backgroundTreatment: 'dark' }, tags: ['虹色', '偏光', '厚塗り', 'brushwork', 'iridescent'] },
  { id: 'teal_yellow_gouache_anime', ja: '青緑と黄色のガッシュアニメ', en: 'Teal and Yellow Gouache Anime', base: `${painterlyBasePrompt}, teal and turquoise color accents with lemon-yellow highlights and warm ivory paint, lively broken color patches`,
    defaults: { brushTexture: 'gouache', hairRendering: 'soft', colorLight: 'natural', backgroundTreatment: 'bright' }, tags: ['青緑', '黄色', '夏', '不透明水彩', 'gouache', 'teal'] },
  { id: 'dark_jewel_painterly_anime', ja: '暗色と宝石光沢の厚塗りアニメ', en: 'Dark Jewel Painterly Anime', base: `${painterlyBasePrompt}, dark fantasy painting, jewel-like painted highlights, warm orange edge accents, detailed anime eyes against broad painted hair and clothing`,
    defaults: { brushTexture: 'bold', hairRendering: 'chunky', colorLight: 'iridescent', backgroundTreatment: 'dark' }, tags: ['ダーク', '宝石', '反射光', 'dark', 'jewel'] },
  { id: 'pastel_gouache_fantasy_anime', ja: 'パステル幻想ガッシュアニメ', en: 'Pastel Fantasy Gouache Anime', base: `${painterlyBasePrompt}, translucent color washes layered with opaque painted accents, delicate decorative brushwork, soft canvas texture`,
    defaults: { brushTexture: 'gouache', hairRendering: 'soft', colorLight: 'pastel', backgroundTreatment: 'bright' }, tags: ['パステル', '幻想', '画布', 'pastel', 'fantasy'] },
  { id: 'monochrome_flatbrush_anime', ja: '白黒基調の平筆アニメ', en: 'Monochrome Flat-Brush Anime', base: `${painterlyBasePrompt}, loose painterly coloring, muted near-monochromatic palette, soft lavender-tinted shadows, selective small accent colors, crisp facial linework`,
    defaults: { brushTexture: 'bold', hairRendering: 'sharp', colorLight: 'natural', backgroundTreatment: 'simple' }, tags: ['白黒', '平筆', '省略', 'monochrome', 'flat-brush'] },
];

export const painterlyPresets: StylePreset[] = profiles.map((profile) => ({
  id: profile.id, nameJa: profile.ja, nameEn: profile.en, category: 'painterly_anime',
  useCases: ['人物イラスト', 'アイコン', '画風調整'], tags: profile.tags, weight: 1,
  stylePrompt: composePainterlyPrompt(profile.base, profile.defaults),
  painterly: { basePrompt: profile.base, defaults: profile.defaults },
}));
