import type { AssetOption } from './asset-options';

export const assetStyleCategories = [
  { id: 'general', ja: '汎用', en: 'General', usage: 'general' },
  {
    id: 'rpg-pixel',
    ja: 'RPG：ドット・ゲーム素材',
    en: 'RPG pixel game assets',
    usage: 'rpg',
  },
  {
    id: 'rpg-art',
    ja: 'RPG：イラスト・立体表現',
    en: 'RPG illustration rendering',
    usage: 'rpg',
  },
  {
    id: 'manga-ink',
    ja: '漫画：ペン・筆・線画',
    en: 'Manga ink linework',
    usage: 'manga',
  },
  {
    id: 'manga-tone',
    ja: '漫画：トーン・印刷表現',
    en: 'Manga halftone printing',
    usage: 'manga',
  },
] as const;

export type AssetStyle = AssetOption & {
  category: string;
  usage: 'rpg' | 'manga';
  monochrome: boolean;
};
type Row = [id: string, ja: string, promptJa: string, en: string];
const group = (
  category: string,
  usage: AssetStyle['usage'],
  monochrome: boolean,
  rows: Row[],
): AssetStyle[] =>
  rows.map(([id, ja, promptJa, en]) => ({
    id,
    ja,
    promptJa,
    en,
    category,
    usage,
    monochrome,
  }));

export const advancedAssetStyles: AssetStyle[] = [
  ...group('rpg-pixel', 'rpg', false, [
    [
      'rpg-pixel-8bit',
      '8bit・少色数ドット',
      '少数の明確な色と大きなドット塊で描く。輪郭は階段状、ぼかしや中間色のにじみを使わない',
      '8-bit-inspired limited-palette pixel clusters, deliberate stair-step contours, no blur or blended intermediate colors',
    ],
    [
      'rpg-pixel-16bit',
      '16bit・戦闘エフェクト',
      '細かなドット塊と数段階の明暗で、芯・中間・外縁を分けた読みやすい戦闘素材にする',
      '16-bit-inspired battle effect with fine pixel clusters and distinct core, midtone and outer-edge values',
    ],
    [
      'rpg-pixel-handheld',
      '携帯機風・4階調',
      '四段階の明度だけで面を整理し、輪郭と内部の模様を1ドット単位で描き分ける',
      'handheld-inspired four-value pixel art with single-pixel separation of silhouettes and internal patterns',
    ],
    [
      'rpg-pixel-dither',
      'ディザによる疑似階調',
      '粗さを揃えた規則的なディザで陰影をつなぎ、画素の輪郭を鮮明に保つ',
      'pixel art using consistent ordered dithering for value transitions and crisp pixel boundaries',
    ],
    [
      'rpg-pixel-no-outline',
      '輪郭線なしドット',
      '黒い外枠を使わず、色面と明暗差で外形が読めるドット素材にする',
      'outline-free pixel assets with silhouettes defined by color clusters and value contrast',
    ],
    [
      'rpg-pixel-bold',
      '太い輪郭のドット',
      '1〜2ドットの濃い外枠と単純な色面で、小さく表示しても形が読めるように描く',
      'readable small-scale pixel assets with one-to-two-pixel dark outlines and simple color clusters',
    ],
    [
      'rpg-pixel-subpixel',
      '細密な高密度ドット',
      '小さな画素の束を丁寧に組み、必要な輪郭だけ中間色で整える。連続的なぼかしは使わない',
      'detailed high-density pixel clusters with selective edge colors and no continuous blur',
    ],
    [
      'rpg-pixel-glow',
      'ドットの階段発光',
      '明るい芯の外へ段階的な色の輪を重ね、発光をドットの境界で表現する',
      'pixel glow built from stepped color bands around a bright core rather than smooth bloom',
    ],
    [
      'rpg-pixel-chunky',
      '大粒ドット・力強い塊',
      '大きく角張った画素群で面を作り、細かい粒を減らして太い外形を優先する',
      'chunky pixel clusters emphasizing bold silhouettes with minimal tiny particles',
    ],
    [
      'rpg-pixel-tactical',
      'タクティカル素材の精密ドット',
      '斜めの辺を規則的なドット段差で描き、立体面の明度を明確に分離する',
      'tactical-game pixel rendering with regular diagonal step patterns and clearly separated plane values',
    ],
    [
      'rpg-pixel-pastel',
      '柔らかな淡色ドット',
      '淡い色の画素群と控えめな輪郭で描き、影も硬い境界の色面として置く',
      'soft-looking pale pixel clusters with restrained outlines and discrete hard-edged shadow colors',
    ],
    [
      'rpg-pixel-neon',
      '暗部を残すネオンドット',
      '暗い内部と鋭い発光の縁をドットで分け、局所的な高輝度の点を少数置く',
      'neon pixel rendering with dark interiors, sharp luminous rims and a few concentrated bright pixels',
    ],
  ]),
  ...group('rpg-art', 'rpg', false, [
    [
      'rpg-vfx-cel',
      'セル塗りのVFX素材',
      '外形・中間色・明るい芯を硬い境界で分け、細部を整理したゲーム用VFX素材として描く',
      'cel-shaded game VFX with clean separation of silhouette, midtone and bright core using hard edges',
    ],
    [
      'rpg-vfx-painted',
      '手描きの魔法素材',
      '筆の勢いを残す色面と控えめなにじみで、中心の明るさと外縁の抜けを描き分ける',
      'hand-painted spell VFX with energetic brush masses, restrained soft edges and a readable luminous core',
    ],
    [
      'rpg-icon-enamel',
      'エナメル調のアイコン素材',
      '丸みのある色面、硬い光沢、小さな反射で、枠や文字のないアイコン用素材にする',
      'enamel-like icon asset rendering with rounded color masses, hard gloss and small reflections, no frame or text',
    ],
    [
      'rpg-icon-carved',
      '彫金レリーフ風',
      '浅い彫りの縁、細かな刻み、局所的な金属反射で凹凸を表す。文字なし',
      'shallow engraved relief with fine incisions and localized metallic reflections, no lettering',
    ],
    [
      'rpg-storybook',
      '冒険絵本のガッシュ',
      '不透明な絵具の面と少量の紙の粒で、温かく簡潔な形を描く',
      'adventure-storybook gouache with opaque paint masses, subtle paper grain and warm simplified forms',
    ],
    [
      'rpg-dark-painterly',
      '重厚なダークファンタジー',
      '低彩度の厚い筆致と限られた鋭い光で、素材の傷や影の厚みを描き分ける',
      'dark-fantasy painterly rendering with muted heavy brushwork, restrained sharp highlights and textured shadows',
    ],
    [
      'rpg-watercolor-map',
      '水彩とペンの冒険画',
      '淡い水彩のにじみに細いペン線を重ね、塗り残しの白場を活かす。地図文字は入れない',
      'adventure illustration with pale watercolor washes, fine pen contours and reserved paper whites, no map lettering',
    ],
    [
      'rpg-lowpoly-flat',
      '面色で見せるローポリ',
      '少ない多角形の面ごとに明暗を分け、細かな表面テクスチャを使わず形を見せる',
      'low-poly rendering with distinct plane colors and minimal surface texture',
    ],
    [
      'rpg-toon-3d',
      '輪郭付きトゥーン3D',
      '立体を二〜三段のセル影で分け、必要な外周にだけ細い輪郭を引く',
      'toon 3D rendering with two or three cel-shadow levels and selective thin outer contours',
    ],
    [
      'rpg-miniature',
      '卓上ミニチュア塗装',
      '小さな模型を塗ったような面の塗り分け、縁の明るい筆跡、溝の陰影をつける',
      'tabletop-miniature paint treatment with separated surfaces, dry-brushed edges and shaded recesses',
    ],
    [
      'rpg-parchment-etch',
      '羊皮紙の魔術図版',
      '細い版画線と点描で質感を示し、色数を抑えた古い図版の表現にする。文字なし',
      'antique magical-plate rendering with fine engraving and stippling in restrained colors, no lettering',
    ],
    [
      'rpg-prismatic',
      'プリズムの面分割',
      '透明感のある鋭い面に色の反射を分け、局所的な光点で結晶の硬さを出す',
      'prismatic faceted rendering with separated translucent reflections and localized crisp crystal glints',
    ],
  ]),
  ...group('manga-ink', 'manga', true, [
    [
      'manga-gpen',
      'Gペン・強弱のある主線',
      '黒インクと白地だけを使い、入り抜きの鋭いGペン風の強弱線と選択的な黒ベタで描く',
      'black-and-white manga ink with pressure-sensitive G-pen-like tapered strokes and selective solid blacks',
    ],
    [
      'manga-maru',
      '丸ペン・細密な線',
      '白黒の極細線で細部を描き、線の重なりを抑えて明るい余白を保つ',
      'black-and-white fine-nib manga linework with delicate details, limited overlap and airy white space',
    ],
    [
      'manga-brush-bold',
      '筆ペン・太い勢い線',
      '太い黒い筆線を一気に引き、先端を鋭く抜いて大きな白場と対比させる',
      'bold black brush-pen strokes with sharply tapered ends against broad white space',
    ],
    [
      'manga-drybrush',
      'かすれ筆・荒い迫力',
      '乾いた黒い筆跡の欠けと白い紙目を残し、荒い勢いを白黒で表す',
      'rough black-and-white dry-brush energy retaining broken ink edges and white paper texture',
    ],
    [
      'manga-clean-digital',
      '均一線・デジタル漫画',
      '均一な細さの鮮明な黒線と整理された白場で描き、にじみや色を使わない',
      'clean digital manga in black and white with consistent line weight and organized negative space',
    ],
    [
      'manga-gekiga',
      '劇画・重いベタとハッチ',
      '太い黒ベタと密な短いハッチを組み合わせ、明暗の落差で重量感を出す',
      'dramatic black-and-white gekiga treatment using heavy solid blacks and dense short hatching',
    ],
    [
      'manga-shojo-line',
      '繊細な装飾ペン線',
      '細い黒線、短い点描、余白を活かす細い飾り線で軽やかな白黒表現にする',
      'delicate black-and-white decorative manga linework with fine contours, sparse stipples and open white space',
    ],
    [
      'manga-gag-bold',
      'コミカルな太線',
      '丸みのある太い黒線と単純な白い面で、縮小しても読める軽快な形にする',
      'playful black-and-white manga with rounded bold contours and simple readable white shapes',
    ],
    [
      'manga-scratch-ink',
      '引っかき線の硬質表現',
      '短く硬い黒い引っかき線を重ね、面の境界に細い白抜きを残す',
      'hard-edged black-and-white scratch-ink strokes with thin white separations at plane boundaries',
    ],
    [
      'manga-woodcut',
      '木版風の黒白',
      '太い黒い面を白い彫り筋で分割し、不均一な縁を活かした木版風にする',
      'black-and-white woodcut-like rendering with broad ink masses carved by white grooves and uneven edges',
    ],
    [
      'manga-pencil-ink',
      '鉛筆下描き風の白黒線',
      '細い灰色の鉛筆線と一部の濃い輪郭で描き、紙の白さを多く残す',
      'monochrome pencil-like manga linework with fine gray strokes, selective dark contours and ample paper whites',
    ],
    [
      'manga-ink-wash',
      '墨の濃淡・余白',
      '黒から薄墨までの濃淡とにじみを使い、硬い筆先の線と柔らかい面を共存させる',
      'monochrome ink-wash manga balancing sharp brush-tip strokes and soft diluted-ink masses',
    ],
  ]),
  ...group('manga-tone', 'manga', true, [
    [
      'manga-tone-standard',
      '網点と主線の標準漫画',
      '鮮明な黒い主線、均一な細かい網点、純白の抜きを使う白黒漫画表現',
      'black-and-white manga with crisp primary contours, regular fine halftone dots and pure white cutouts',
    ],
    [
      'manga-tone-shonen',
      'アクション向けの強コントラスト',
      '黒ベタと白抜きを大きく分け、必要な中間部だけに網点を置く迫力ある白黒表現',
      'high-contrast action manga with broad solid blacks, sharp white cutouts and selectively placed halftones',
    ],
    [
      'manga-tone-soft',
      '淡い網点・柔らかな空気',
      '薄い細かな網点と軽い輪郭を用い、密な黒ベタを減らして柔らかい白黒にする',
      'soft black-and-white manga with pale fine halftones, light contours and minimal dense black fills',
    ],
    [
      'manga-tone-retro',
      '粗い網点・レトロ印刷',
      '大きな網点と少し揺れる輪郭で、古い漫画印刷の手触りを白黒で表現する',
      'retro monochrome manga printing with coarse halftone dots and subtly irregular contours',
    ],
    [
      'manga-tone-horror',
      '暗い網点・ホラー調',
      '密度の高い網点、細い白い傷、局所的な黒ベタで重い暗部を作る',
      'dark monochrome horror manga with dense halftones, fine white scratches and localized solid blacks',
    ],
    [
      'manga-tone-scratchlight',
      '削りトーンの光表現',
      '濃い網点から細い白線と小点を削り出し、光の筋と粒を描く',
      'monochrome scraped-screentone lighting with fine white streaks and dots cut from dark halftone fields',
    ],
    [
      'manga-tone-crosshatch',
      '網点なし・交差ハッチ',
      '色や網点を使わず、角度を変えた細い黒線の重なりだけで陰影をつける',
      'black-and-white manga shading entirely through layered crosshatching, without color or halftone dots',
    ],
    [
      'manga-tone-stipple',
      '点描だけの陰影',
      '黒い点の密度だけで陰影を作り、輪郭付近は点を整理して形を読みやすくする',
      'monochrome stipple shading using black dot density with organized edge dots for clear silhouettes',
    ],
    [
      'manga-tone-negative',
      '黒地・白抜き主体',
      '黒い面の中に白い輪郭と光の抜きを置き、少ない線で形を浮かび上がらせる',
      'negative-space monochrome manga with white contours and light cutouts emerging from solid black areas',
    ],
    [
      'manga-tone-twolevel',
      '二値のベタ面',
      '中間の灰色を使わず、黒ベタと白場だけで明暗と形を明確に分ける',
      'strict two-value manga rendering using only solid black and white, with no gray shading',
    ],
    [
      'manga-tone-grain',
      '砂目トーン・ざらつき',
      '不規則な細かな黒点を使い、均一な網点よりざらついた白黒の階調にする',
      'grainy monochrome manga tone built from irregular fine black speckles rather than regular dot screens',
    ],
    [
      'manga-tone-airbrush',
      '白黒エアブラシ調',
      '黒から白への柔らかな濃淡に鮮明な主線を組み合わせ、色相を含めない',
      'monochrome airbrush-like gradients combined with crisp ink contours and no color hues',
    ],
  ]),
];

const choices = (rows: [string, string, string][]): AssetOption[] =>
  rows.map(([id, ja, en]) => ({ id, ja, en }));
export const rpgMangaChoices = {
  background: choices([
    [
      'rpg-empty-arena',
      'RPG：空の戦闘床',
      'an empty restrained battle-floor backdrop without characters',
    ],
    [
      'rpg-stone-circle',
      'RPG：円形の石床',
      'an empty circular stone floor with subtle joints',
    ],
    [
      'rpg-tile-grid',
      'RPG：タイルの床',
      'a quiet empty tiled floor with clear grid spacing',
    ],
    [
      'rpg-dark-dungeon',
      'RPG：暗いダンジョン',
      'a minimally detailed empty dark dungeon backdrop',
    ],
    [
      'rpg-sacred-platform',
      'RPG：聖域の台座',
      'an empty sanctuary platform with restrained geometric decoration, no text',
    ],
    [
      'rpg-skill-void',
      'RPG：スキル演出の暗幕',
      'a plain dark abstract skill-effect backdrop with generous negative space',
    ],
    [
      'rpg-battle-sky',
      'RPG：抽象的な戦闘空間',
      'an empty abstract battle space with simple layered color bands',
    ],
    [
      'rpg-grass-patch',
      'RPG：小さな草地',
      'a small empty grassy ground patch with a subdued background',
    ],
    [
      'manga-paper-white',
      '漫画：白い紙面',
      'a clean white manga-panel field without a border or lettering',
    ],
    [
      'manga-tone-pale',
      '漫画：薄い網点',
      'a pale evenly dotted monochrome screentone backdrop',
    ],
    [
      'manga-ink-black',
      '漫画：黒ベタ背景',
      'a solid black ink backdrop with no texture or lettering',
    ],
    [
      'manga-panel-space',
      '漫画：中央に白い余白',
      'a monochrome manga backdrop with broad blank central space and sparse corner shading',
    ],
    [
      'manga-fade-top',
      '漫画：上から薄くなる網点',
      'a monochrome halftone backdrop dense at the top and fading into white below',
    ],
    [
      'manga-brush-edge',
      '漫画：縁のかすれ筆',
      'a white field bordered by sparse dry black brush marks',
    ],
    [
      'manga-vertical-tone',
      '漫画：縦ハッチ背景',
      'a sparse monochrome vertical-hatching backdrop with a clear central area',
    ],
    [
      'manga-grain-pale',
      '漫画：淡い砂目',
      'a pale monochrome speckled backdrop with ample white paper showing through',
    ],
  ]),
  framing: choices([
    [
      'rpg-hit-anchor',
      'RPG：命中点を中央に',
      'the impact origin aligned precisely to the center, all effect tips within the frame',
    ],
    [
      'rpg-ground-anchor',
      'RPG：下中央を接地点に',
      'the ground-contact origin at the lower center with clear margins around the entire effect',
    ],
    [
      'rpg-icon-fit',
      'RPG：アイコン内に収める',
      'a compact readable silhouette entirely inside generous square margins, no icon frame',
    ],
    [
      'rpg-overlay-space',
      'RPG：重ねる対象の空間を空ける',
      'an empty central target area surrounded by the effect, no target or character depicted',
    ],
    [
      'rpg-side-travel',
      'RPG：横方向の軌道',
      'the complete effect arranged along a horizontal travel path with clear start and end margins',
    ],
    [
      'rpg-area-ellipse',
      'RPG：足元範囲の楕円',
      'the entire effect arranged as a ground-plane ellipse with the center empty',
    ],
    [
      'manga-panel-fit',
      '漫画：1コマ内に収める',
      'a single manga-panel composition keeping all effect marks within the canvas, no lettering or drawn panel border',
    ],
    [
      'manga-center-open',
      '漫画：中心の白場を残す',
      'manga effect marks arranged around a broad blank center reserved for later compositing',
    ],
    [
      'manga-corner-origin',
      '漫画：隅からの視線誘導',
      'effect strokes originating at a corner and guiding attention toward an empty interior focal point',
    ],
    [
      'manga-top-open',
      '漫画：上部を空ける',
      'effect details concentrated below with broad blank upper space, no speech balloon or text',
    ],
    [
      'manga-diagonal-gap',
      '漫画：斜めの抜けをつくる',
      'effect masses separated by a clear diagonal white corridor through the composition',
    ],
    [
      'manga-border-inset',
      '漫画：周囲に貼り込み余白',
      'the entire manga effect inset from the edges with clean margins for panel compositing',
    ],
  ]),
};
