import type { PainterlyControls } from '@/lib/style-pack-types';

export const painterlyBasePrompt = 'expressive anime painterly illustration, semi-thick digital painting, sharp and delicate anime facial features, refined expressive eyes, clean and selective linework, soft blended skin shading, contrast between hard and soft edges, sophisticated color harmony, 2D illustration, non-photorealistic';

export const painterlyControls: Array<{
  key: keyof PainterlyControls; ja: string; en: string;
  options: Array<{ id: string; ja: string; en: string; prompt: string }>;
}> = [
  { key: 'brushTexture', ja: 'ブラシの質感', en: 'Brush texture', options: [
    { id: 'bold', ja: '大胆な厚塗り', en: 'Bold opaque brushwork', prompt: 'bold opaque brushwork, visible broad flat brush strokes, large grouped color shapes' },
    { id: 'gouache', ja: 'ガッシュ・ざらざら塗り', en: 'Textured gouache', prompt: 'gouache-like digital painting, textured opaque paint, visible bristle marks, dry-brush texture, large grouped color shapes' },
    { id: 'soft', ja: '柔らかい厚塗り', en: 'Soft painterly brushwork', prompt: 'soft painterly brushwork, broad gently blended paint strokes, visible subtle brush texture, softly connected color shapes' },
  ] },
  { key: 'hairRendering', ja: '髪の描き方', en: 'Painterly hair', options: [
    { id: 'chunky', ja: '太い毛束・面で描く', en: 'Chunky locks and color planes', prompt: 'chunky layered hair locks, angular brush-shaped highlights, simplified internal hair strands' },
    { id: 'soft', ja: '柔らかい毛束', en: 'Soft grouped locks', prompt: 'softly grouped hair locks, flowing broad hair shapes, gentle painted highlights, restrained internal strand detail' },
    { id: 'sharp', ja: 'シャープ・省略多め', en: 'Sharp simplified hair shapes', prompt: 'sharp simplified hair silhouettes, angular hair color masses, selective fine outlines, reduced interior hair lines' },
  ] },
  { key: 'colorLight', ja: '光と色', en: 'Light and color', options: [
    { id: 'iridescent', ja: '虹色・偏光ライティング', en: 'Iridescent reflected light', prompt: 'iridescent purple and blue reflections, vibrant rim lighting, rich colored shadows, luminous reflected light' },
    { id: 'pastel', ja: 'パステル・幻想的', en: 'Pastel luminous colors', prompt: 'pastel iridescent colors, lavender and turquoise highlights, luminous atmospheric lighting, soft colored shadows' },
    { id: 'natural', ja: '控えめ・自然な発色', en: 'Restrained natural colors', prompt: 'restrained natural color harmony, subtle reflected light, controlled saturation, softly colored shadows' },
  ] },
  { key: 'backgroundTreatment', ja: '背景の描き方', en: 'Painterly background', options: [
    { id: 'dark', ja: '暗い幻想背景', en: 'Dark atmospheric background', prompt: 'dark atmospheric painterly background, deep painted shadows, subtle sparkling particles' },
    { id: 'bright', ja: '明るい幻想背景', en: 'Bright atmospheric background', prompt: 'bright atmospheric painterly background, luminous painted color patches, softly lit depth' },
    { id: 'simple', ja: 'シンプルなブラシ背景', en: 'Simple brushwork background', prompt: 'simple abstract brushwork background, broad uncluttered painted shapes, minimal background detail' },
  ] },
];

export const painterlyAvoidChoices = [
  { id: 'photorealistic', ja: '写実的な写真表現', en: 'Photorealism', prompt: 'avoid photorealism' },
  { id: 'realistic_face', ja: '写実的な顔', en: 'Realistic face', prompt: 'avoid realistic face rendering' },
  { id: 'realistic_skin', ja: '写実的な肌の質感', en: 'Realistic skin texture', prompt: 'avoid realistic skin texture' },
  { id: 'render_3d', ja: '3Dレンダリング', en: '3D render', prompt: 'avoid 3d render' },
  { id: 'plastic_skin', ja: 'プラスチックのような肌', en: 'Plastic skin', prompt: 'avoid plastic skin' },
  { id: 'airbrushed', ja: 'エアブラシだけの仕上げ', en: 'Airbrushed finish', prompt: 'avoid airbrushed finish' },
  { id: 'smooth_shading', ja: '滑らかすぎる陰影', en: 'Overly smooth shading', prompt: 'avoid overly smooth shading' },
  { id: 'gradients', ja: '過剰なグラデーション', en: 'Excessive gradients', prompt: 'avoid excessive gradients' },
  { id: 'thin_hair', ja: '細すぎる髪の線', en: 'Ultra-thin hair strands', prompt: 'avoid ultra-thin hair strands' },
  { id: 'hair_detail', ja: '髪の描き込みすぎ', en: 'Excessive hair detail', prompt: 'avoid excessive hair detail' },
  { id: 'texture_detail', ja: '細密すぎる質感', en: 'Hyper-detailed textures', prompt: 'avoid hyper-detailed textures' },
  { id: 'ornamentation', ja: '過剰な装飾', en: 'Excessive ornamentation', prompt: 'avoid excessive ornamentation' },
  { id: 'over_rendered', ja: '全体の描き込みすぎ', en: 'Over-rendered finish', prompt: 'avoid over-rendered finish' },
  { id: 'glossy_plastic', ja: 'プラスチックのような光沢', en: 'Glossy plastic', prompt: 'avoid glossy plastic' },
  { id: 'cel_shading', ja: '平坦なセル塗り', en: 'Flat cel shading', prompt: 'avoid flat cel shading' },
  { id: 'uniform_lines', ja: '均一な線の太さ', en: 'Uniform line thickness', prompt: 'avoid uniform line thickness' },
  { id: 'muddy_colors', ja: '濁った色', en: 'Muddy colors', prompt: 'avoid muddy colors' },
  { id: 'oversharpening', ja: '過剰なシャープ化', en: 'Oversharpening', prompt: 'avoid oversharpening' },
];

export function composePainterlyPrompt(base: string, controls: PainterlyControls) {
  return [base, ...painterlyControls.map((control) => control.options.find((option) => option.id === controls[control.key])?.prompt)].filter(Boolean).join(', ');
}
