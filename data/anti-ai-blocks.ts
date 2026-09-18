import type { AntiAiBlock } from '@/lib/style-pack-types';

// Converted from the user-provided style expansion pack; no external API required.
export const antiAiBlocks = [
  {
    "id": "line_irregularity_light",
    "nameJa": "軽い線のゆらぎ",
    "nameEn": "Light Line Irregularity",
    "intent": "線が均一すぎるのを避ける",
    "antiAiPrompt": "slightly varied line thickness, faint contour irregularity, hand-guided line rhythm",
    "tags": [
      "linework",
      "handmade"
    ],
    "caution": "ベクター寄り画風と相性良い"
  },
  {
    "id": "line_irregularity_strong",
    "nameJa": "強めの線の不均一",
    "nameEn": "Strong Line Variation",
    "intent": "人の手の線らしさを強める",
    "antiAiPrompt": "noticeable variation in line pressure, organic contour wobble, drawn-by-hand imperfection",
    "tags": [
      "linework",
      "organic"
    ],
    "caution": "細密系では効きすぎ注意"
  },
  {
    "id": "subtle_paper_texture",
    "nameJa": "薄い紙の質感",
    "nameEn": "Subtle Paper Texture",
    "intent": "デジタルのツルツル感を弱める",
    "antiAiPrompt": "subtle paper texture, faint fibrous surface, low-key tactile background feel",
    "tags": [
      "paper",
      "texture"
    ],
    "caution": "多くの画風に足しやすい"
  },
  {
    "id": "rough_paper_grain",
    "nameJa": "ざらつく紙目",
    "nameEn": "Rough Paper Grain",
    "intent": "印刷物・アナログ感を増やす",
    "antiAiPrompt": "visible paper grain, dry tactile surface, slightly coarse substrate feel",
    "tags": [
      "paper",
      "grain"
    ],
    "caution": "清潔感重視UI絵では弱め推奨"
  },
  {
    "id": "matte_finish",
    "nameJa": "マット仕上げ",
    "nameEn": "Matte Finish",
    "intent": "光沢の出すぎを抑える",
    "antiAiPrompt": "matte surface character, restrained sheen, non-glossy material impression",
    "tags": [
      "finish",
      "matte"
    ],
    "caution": "グロッシーアニメ系を抑える時に有効"
  },
  {
    "id": "reduced_polish",
    "nameJa": "デジタル磨き込み抑制",
    "nameEn": "Reduced Digital Polish",
    "intent": "AIのつるんとした完成感を弱める",
    "antiAiPrompt": "minimal digital polish, human-level finish, avoid overly perfected surfaces",
    "tags": [
      "polish",
      "natural"
    ],
    "caution": "汎用"
  },
  {
    "id": "gentle_asymmetry",
    "nameJa": "自然な非対称",
    "nameEn": "Gentle Asymmetry",
    "intent": "左右対称すぎる印象を減らす",
    "antiAiPrompt": "gentle asymmetry, natural imbalance, slightly human arrangement",
    "tags": [
      "asymmetry",
      "layout"
    ],
    "caution": "フラット系で有効"
  },
  {
    "id": "imperfect_spacing",
    "nameJa": "不完全な余白",
    "nameEn": "Imperfect Spacing",
    "intent": "機械的すぎる配置を避ける",
    "antiAiPrompt": "natural spacing variation, slightly imperfect alignment, human layout rhythm",
    "tags": [
      "spacing",
      "layout"
    ],
    "caution": "図解にも使える"
  },
  {
    "id": "registration_shift_light",
    "nameJa": "軽い版ズレ",
    "nameEn": "Light Registration Shift",
    "intent": "色と線がぴったりすぎる印象を崩す",
    "antiAiPrompt": "slight misregistration between color and line, barely offset print-like layering",
    "tags": [
      "print",
      "registration"
    ],
    "caution": "印刷・水彩系向け"
  },
  {
    "id": "registration_shift_print",
    "nameJa": "印刷ズレ強調",
    "nameEn": "Print Registration Drift",
    "intent": "小印刷物っぽい味を入れる",
    "antiAiPrompt": "visible registration drift, layered color offset, small-press print imperfection",
    "tags": [
      "print",
      "riso"
    ],
    "caution": "用途を選ぶ"
  },
  {
    "id": "ink_coverage_variation",
    "nameJa": "インク濃度ムラ",
    "nameEn": "Ink Coverage Variation",
    "intent": "均一塗りを避ける",
    "antiAiPrompt": "uneven ink density, slight fill inconsistency, tactile printed variation",
    "tags": [
      "ink",
      "print"
    ],
    "caution": "印刷・版画系向け"
  },
  {
    "id": "halftone_soft",
    "nameJa": "控えめ網点",
    "nameEn": "Soft Halftone",
    "intent": "デジタル平滑感を弱める",
    "antiAiPrompt": "subtle halftone texture, printed tonal breakup, restrained dot pattern",
    "tags": [
      "halftone",
      "print"
    ],
    "caution": "使いすぎると古く見える"
  },
  {
    "id": "grain_overlay_soft",
    "nameJa": "微粒グレイン",
    "nameEn": "Soft Grain Overlay",
    "intent": "なめらかすぎる面を崩す",
    "antiAiPrompt": "fine grain overlay, soft surface breakup, gentle low-noise texture",
    "tags": [
      "grain",
      "surface"
    ],
    "caution": "汎用"
  },
  {
    "id": "brush_trace",
    "nameJa": "筆跡を残す",
    "nameEn": "Brush Trace",
    "intent": "塗りが均一すぎるのを防ぐ",
    "antiAiPrompt": "visible brush traces, paint application variation, hand-worked stroke memory",
    "tags": [
      "brush",
      "paint"
    ],
    "caution": "ペイント系向け"
  },
  {
    "id": "pencil_stroke_visibility",
    "nameJa": "鉛筆跡を残す",
    "nameEn": "Visible Pencil Strokes",
    "intent": "ラフすぎない手描き感",
    "antiAiPrompt": "visible pencil stroke direction, hand pressure evidence, sketch-like construction presence",
    "tags": [
      "pencil",
      "stroke"
    ],
    "caution": "鉛筆系向け"
  },
  {
    "id": "cut_paper_edge",
    "nameJa": "切り紙の縁感",
    "nameEn": "Cut-Paper Edge",
    "intent": "工作っぽさを出す",
    "antiAiPrompt": "slight cut-paper edge irregularity, layered paper seams, handmade cutout quality",
    "tags": [
      "paper",
      "collage"
    ],
    "caution": "コラージュ向け"
  },
  {
    "id": "reduce_background_clutter",
    "nameJa": "背景小物抑制",
    "nameEn": "Reduce Background Clutter",
    "intent": "意味のない小物増殖を抑える",
    "antiAiPrompt": "restrained background detail, purposeful props only, avoid incidental clutter",
    "tags": [
      "background",
      "clarity"
    ],
    "caution": "かなり実用的"
  },
  {
    "id": "simplify_face",
    "nameJa": "顔の整理",
    "nameEn": "Simplify Facial Detail",
    "intent": "整いすぎる顔を少し外す",
    "antiAiPrompt": "simplified facial features, restrained face detail, natural human stylization over idealized perfection",
    "tags": [
      "face",
      "simplify"
    ],
    "caution": "かわいさは残しやすい"
  },
  {
    "id": "soften_gradients",
    "nameJa": "グラデーション弱化",
    "nameEn": "Soften Gradient Dependence",
    "intent": "滑らかすぎるCG感を抑える",
    "antiAiPrompt": "limited gradient smoothness, more shape-based shading, restrained airbrushed transitions",
    "tags": [
      "gradient",
      "shade"
    ],
    "caution": "フラット〜アニメ向け"
  },
  {
    "id": "limited_palette_5",
    "nameJa": "5色前後に制限",
    "nameEn": "Limit Palette to 5 Colors",
    "intent": "色数を絞りノイズを減らす",
    "antiAiPrompt": "limited palette of around five main colors, cohesive restrained color logic",
    "tags": [
      "palette",
      "cohesion"
    ],
    "caution": "図解/印刷で特に有効"
  },
  {
    "id": "limited_palette_8",
    "nameJa": "8色前後に制限",
    "nameEn": "Limit Palette to 8 Colors",
    "intent": "やや自由度を残してまとめる",
    "antiAiPrompt": "limited palette of around eight main colors, controlled harmony, reduced accidental accents",
    "tags": [
      "palette",
      "control"
    ],
    "caution": "幅広く使える"
  },
  {
    "id": "flatten_depth",
    "nameJa": "奥行き抑制",
    "nameEn": "Flattened Depth",
    "intent": "過剰な立体感を弱める",
    "antiAiPrompt": "flattened depth cues, reduced perspective drama, slightly planar composition",
    "tags": [
      "depth",
      "flat"
    ],
    "caution": "版画/教材/装飾向け"
  },
  {
    "id": "restrained_detail",
    "nameJa": "細部描き込み抑制",
    "nameEn": "Restrained Detail",
    "intent": "細部過密を防ぐ",
    "antiAiPrompt": "restrained detail density, simplified secondary elements, clarity over decorative overload",
    "tags": [
      "detail",
      "clarity"
    ],
    "caution": "汎用"
  },
  {
    "id": "human_proportion_variance",
    "nameJa": "わずかな比率ゆらぎ",
    "nameEn": "Human Proportion Variance",
    "intent": "完璧すぎる比率を避ける",
    "antiAiPrompt": "subtle human proportion variance, slight natural irregularity, not perfectly idealized",
    "tags": [
      "proportion",
      "human"
    ],
    "caution": "キャラ絵向け"
  },
  {
    "id": "quiet_composition",
    "nameJa": "静かな構図",
    "nameEn": "Quiet Composition",
    "intent": "画面の騒がしさを抑える",
    "antiAiPrompt": "understated composition, calm visual rhythm, no unnecessary dramatic staging",
    "tags": [
      "composition",
      "quiet"
    ],
    "caution": "資料・広報向け"
  },
  {
    "id": "negative_space_boost",
    "nameJa": "余白を増やす",
    "nameEn": "Boost Negative Space",
    "intent": "見やすさと人間設計感を増す",
    "antiAiPrompt": "generous negative space, breathing room around forms, intentional empty areas",
    "tags": [
      "negative-space",
      "layout"
    ],
    "caution": "スライドやバナー向け"
  },
  {
    "id": "print_age_soft",
    "nameJa": "わずかな経年感",
    "nameEn": "Soft Printed Age",
    "intent": "新しすぎるCG感を和らげる",
    "antiAiPrompt": "slight aged print feeling, faint wear, subtle analog patina without looking damaged",
    "tags": [
      "age",
      "print"
    ],
    "caution": "レトロ向け"
  },
  {
    "id": "avoid_stock_feel",
    "nameJa": "ストック素材感回避",
    "nameEn": "Avoid Stock-Art Feel",
    "intent": "ありがちな既製素材感を避ける",
    "antiAiPrompt": "avoid stock-art aesthetics, favor editorial specificity and human-made nuance",
    "tags": [
      "editorial",
      "avoid"
    ],
    "caution": "Web系で使いやすい"
  },
  {
    "id": "avoid_overcute_polish",
    "nameJa": "可愛すぎる磨き込み回避",
    "nameEn": "Avoid Over-Cute Overpolish",
    "intent": "整いすぎ・艶すぎを抑える",
    "antiAiPrompt": "avoid overly polished cuteness, keep charm with restraint and slight imperfection",
    "tags": [
      "cute",
      "restraint"
    ],
    "caution": "チャットアプリ向けにも相性良い"
  },
  {
    "id": "prop_purpose_only",
    "nameJa": "小物の必然性",
    "nameEn": "Purposeful Props Only",
    "intent": "不要小物を減らす",
    "antiAiPrompt": "use only purposeful props, each object should support the scene, avoid random accessory noise",
    "tags": [
      "props",
      "clarity"
    ],
    "caution": "背景や衣装の暴走防止"
  }
] satisfies AntiAiBlock[];
