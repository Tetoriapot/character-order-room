import type { StylePreset, AntiAiBlock } from '@/lib/style-pack-types';

// User-provided Smooth Clean add-on. Existing catalog IDs remain unchanged.
export const smoothCleanPresets = [
  {
    "id": "sleek_clean_boy",
    "nameJa": "シンプルつるっと美少年",
    "nameEn": "Sleek Clean Boy",
    "category": "smooth_clean",
    "useCases": [
      "チャットアプリ",
      "男性アイコン",
      "きれいめ"
    ],
    "stylePrompt": "smooth clean anime illustration, simplified hair rendering, large separated hair clumps, minimal flyaway strands, soft hair tips, sleek facial rendering, light glossy finish, reduced accessory detail, refined simple styling, clean and polished overall appearance",
    "tags": [
      "smooth",
      "male",
      "clean",
      "chat-app"
    ],
    "weight": 1.05
  },
  {
    "id": "refined_smooth_portrait",
    "nameJa": "洗練スムース肖像",
    "nameEn": "Refined Smooth Portrait",
    "category": "smooth_clean",
    "useCases": [
      "肖像",
      "アバター",
      "汎用"
    ],
    "stylePrompt": "refined anime portrait, smooth soft rendering, clean silhouette design, restrained hair detail, softly grouped bangs, minimal ornamentation, elegant simplified styling, polished yet not overly detailed finish",
    "tags": [
      "portrait",
      "smooth",
      "refined"
    ],
    "weight": 1.05
  },
  {
    "id": "minimal_gloss_character",
    "nameJa": "ミニマルグロスキャラ",
    "nameEn": "Minimal Gloss Character",
    "category": "smooth_clean",
    "useCases": [
      "アバター",
      "立ち絵",
      "汎用"
    ],
    "stylePrompt": "minimal gloss anime character illustration, smooth surfaces, tidy hair masses, reduced strand complexity, subtle highlights, simple accessories, clean modern stylization, uncluttered design",
    "tags": [
      "gloss",
      "minimal",
      "clean"
    ],
    "weight": 1.05
  },
  {
    "id": "soft_simplified_hair",
    "nameJa": "髪簡略化ソフト",
    "nameEn": "Soft Simplified Hair",
    "category": "smooth_clean",
    "useCases": [
      "やさしめ",
      "男女兼用"
    ],
    "stylePrompt": "soft anime-style illustration, simplified hair structure, broad hair clumps, minimal internal strand detail, smooth hair shading, limited decorative elements, delicate face with clean visual balance",
    "tags": [
      "soft",
      "hair",
      "simple"
    ],
    "weight": 1.05
  },
  {
    "id": "clean_chat_app_style",
    "nameJa": "チャットアプリ向け整理絵柄",
    "nameEn": "Clean Chat-App Style",
    "category": "smooth_clean",
    "useCases": [
      "チャットアプリ",
      "キャラクター会話"
    ],
    "stylePrompt": "clean stylized anime portrait for chat-app character art, tidy facial rendering, simplified hairstyle, reduced visual clutter, smooth polished coloring, controlled highlights, minimal outfit decoration, readable and elegant design",
    "tags": [
      "chat-app",
      "portrait"
    ],
    "weight": 1.05
  },
  {
    "id": "sleek_silver_noir",
    "nameJa": "銀髪ノワール簡潔",
    "nameEn": "Sleek Silver Noir",
    "category": "smooth_clean",
    "useCases": [
      "美青年",
      "ダーク寄り"
    ],
    "stylePrompt": "sleek anime portrait with silver hair, smooth grouped hair clumps, restrained strand detail, soft hair tips, pale refined skin, defined but clean eye area, minimal accessories, moody yet uncluttered noir styling",
    "tags": [
      "silver",
      "noir",
      "male"
    ],
    "weight": 1.05
  },
  {
    "id": "soft_black_hair_boy",
    "nameJa": "黒髪すっきり美少年",
    "nameEn": "Soft Black-Hair Boy",
    "category": "smooth_clean",
    "useCases": [
      "黒髪男性",
      "汎用"
    ],
    "stylePrompt": "clean anime boy illustration with black hair, broad tidy hair groups, simplified bangs, minimal flyaways, smooth skin rendering, restrained clothing detail, subtle highlights, stylish but simple overall finish",
    "tags": [
      "black-hair",
      "male",
      "simple"
    ],
    "weight": 1.05
  },
  {
    "id": "pink_cute_smooth",
    "nameJa": "ピンクかわいい整理絵",
    "nameEn": "Pink Cute Smooth",
    "category": "smooth_clean",
    "useCases": [
      "かわいい女の子",
      "アイドル系"
    ],
    "stylePrompt": "cute anime girl illustration, smooth clean rendering, grouped pink hair masses, reduced hair micro-detail, controlled decorative elements, glossy but simple finish, bright facial appeal, uncluttered cute styling",
    "tags": [
      "pink",
      "cute",
      "female"
    ],
    "weight": 1.05
  },
  {
    "id": "blue_airy_simple",
    "nameJa": "青系エアリー簡潔",
    "nameEn": "Blue Airy Simple",
    "category": "smooth_clean",
    "useCases": [
      "透明感",
      "少女"
    ],
    "stylePrompt": "airy anime girl portrait, cool blue palette, simplified flowing hair, large soft hair clumps, minimal ornament, smooth luminous shading, clean and elegant feminine styling",
    "tags": [
      "blue",
      "airy",
      "female"
    ],
    "weight": 1.05
  },
  {
    "id": "maid_doll_clean",
    "nameJa": "ドール系メイド簡潔",
    "nameEn": "Maid Doll Clean",
    "category": "smooth_clean",
    "useCases": [
      "可愛い衣装",
      "ドール調"
    ],
    "stylePrompt": "stylized maid-inspired anime portrait, smooth clean surfaces, short grouped hair shapes, reduced lace complexity, minimal but charming accessories, doll-like facial appeal, tidy and readable design",
    "tags": [
      "maid",
      "doll",
      "cute"
    ],
    "weight": 1.05
  },
  {
    "id": "pretty_boy_face_priority",
    "nameJa": "顔優先の美少年絵柄",
    "nameEn": "Pretty Boy Face Priority",
    "category": "smooth_clean",
    "useCases": [
      "美少年",
      "顔重視"
    ],
    "stylePrompt": "pretty-boy anime portrait, prioritize facial appeal over hair detail, tidy layered bangs, reduced strand noise, sleek skin finish, minimal ornament, refined expression, simple but attractive styling",
    "tags": [
      "pretty-boy",
      "face-priority",
      "male"
    ],
    "weight": 1.05
  },
  {
    "id": "luxury_minimal_prince",
    "nameJa": "簡潔ラグジュアリ王子",
    "nameEn": "Luxury Minimal Prince",
    "category": "smooth_clean",
    "useCases": [
      "王子",
      "上品"
    ],
    "stylePrompt": "prince-like anime illustration, elegant facial rendering, smooth grouped hair, controlled glossy highlights, reduced jewelry detail, clean luxurious styling, simplified but high-end visual impression",
    "tags": [
      "prince",
      "luxury",
      "minimal"
    ],
    "weight": 1.05
  },
  {
    "id": "soft_blond_silhouette",
    "nameJa": "金髪シルエット整理",
    "nameEn": "Soft Blond Silhouette",
    "category": "smooth_clean",
    "useCases": [
      "金髪男性",
      "女性"
    ],
    "stylePrompt": "anime portrait with blond hair, broad silhouette-first hair design, reduced internal hair detail, soft tapered tips, smooth matte-gloss balance, simple accessories, clean stylish finish",
    "tags": [
      "blond",
      "silhouette",
      "smooth"
    ],
    "weight": 1.05
  },
  {
    "id": "cool_model_clean",
    "nameJa": "クールモデル整理絵",
    "nameEn": "Cool Model Clean",
    "category": "smooth_clean",
    "useCases": [
      "ファッション",
      "中性的"
    ],
    "stylePrompt": "fashionable anime portrait, model-like facial balance, sleek clean rendering, grouped hair masses, reduced decorative noise, polished color treatment, cool and simple modern styling",
    "tags": [
      "fashion",
      "cool",
      "androgynous"
    ],
    "weight": 1.05
  },
  {
    "id": "cute_idol_simple",
    "nameJa": "簡潔アイドルキュート",
    "nameEn": "Cute Idol Simple",
    "category": "smooth_clean",
    "useCases": [
      "アイドル",
      "女の子"
    ],
    "stylePrompt": "cute idol-style anime illustration, controlled hair volume, simplified ornamentation, smooth glossy rendering, bright face focus, readable ribbons and accessories, overall tidy and sweet design",
    "tags": [
      "idol",
      "cute",
      "female"
    ],
    "weight": 1.05
  },
  {
    "id": "calm_school_clean",
    "nameJa": "すっきり学園絵柄",
    "nameEn": "Calm School Clean",
    "category": "smooth_clean",
    "useCases": [
      "制服",
      "学園"
    ],
    "stylePrompt": "school-themed anime portrait, neat grouped hairstyle, reduced hair strand detail, smooth surface shading, simple uniform details, soft friendly expression, clean and approachable character finish",
    "tags": [
      "school",
      "uniform",
      "clean"
    ],
    "weight": 1.05
  },
  {
    "id": "pastel_smooth_avatar",
    "nameJa": "パステルつるっとアバター",
    "nameEn": "Pastel Smooth Avatar",
    "category": "smooth_clean",
    "useCases": [
      "アプリ",
      "アイコン"
    ],
    "stylePrompt": "pastel anime avatar illustration, simple grouped hair, minimal stray strands, smooth pastel rendering, uncluttered outfit design, glossy but controlled highlight accents, clean avatar-friendly readability",
    "tags": [
      "pastel",
      "avatar",
      "app"
    ],
    "weight": 1.05
  },
  {
    "id": "pale_dream_clean",
    "nameJa": "淡色ドリーム整理",
    "nameEn": "Pale Dream Clean",
    "category": "smooth_clean",
    "useCases": [
      "夢かわ",
      "やさしい絵"
    ],
    "stylePrompt": "dreamy anime portrait with pale colors, smooth soft finish, simplified hair flow, low ornament density, gentle facial emphasis, clean fantasy sweetness, controlled detail density",
    "tags": [
      "dreamy",
      "pale",
      "sweet"
    ],
    "weight": 1.05
  },
  {
    "id": "dark_clean_beauty",
    "nameJa": "ダーク整理美形",
    "nameEn": "Dark Clean Beauty",
    "category": "smooth_clean",
    "useCases": [
      "ダーク寄り",
      "耽美"
    ],
    "stylePrompt": "dark elegant anime portrait, simplified moody hair masses, restrained strand detail, soft polished shading, minimal jewelry, sharp but clean facial styling, stylish dark beauty aesthetic",
    "tags": [
      "dark",
      "beauty",
      "elegant"
    ],
    "weight": 1.05
  },
  {
    "id": "short_hair_clean_cut",
    "nameJa": "短髪クリーンカット",
    "nameEn": "Short-Hair Clean Cut",
    "category": "smooth_clean",
    "useCases": [
      "短髪",
      "スタイリッシュ"
    ],
    "stylePrompt": "short-hair anime portrait, clean haircut silhouette, simplified strand organization, smooth skin rendering, low visual clutter, minimal styling accents, crisp and polished design",
    "tags": [
      "short-hair",
      "crisp",
      "simple"
    ],
    "weight": 1.05
  },
  {
    "id": "bob_doll_smooth",
    "nameJa": "ボブドールつるっと",
    "nameEn": "Bob Doll Smooth",
    "category": "smooth_clean",
    "useCases": [
      "ボブヘア",
      "女の子"
    ],
    "stylePrompt": "anime girl portrait with bob haircut, tidy rounded hair masses, reduced fine strand detail, smooth glossy shading, cute simple accessories, doll-like clean styling",
    "tags": [
      "bob",
      "girl",
      "doll"
    ],
    "weight": 1.05
  },
  {
    "id": "white_shirt_clean_boy",
    "nameJa": "白シャツ整理男子",
    "nameEn": "White-Shirt Clean Boy",
    "category": "smooth_clean",
    "useCases": [
      "カジュアル美青年"
    ],
    "stylePrompt": "anime boy portrait in a white shirt, grouped soft hair strands, reduced micro-detail, smooth facial rendering, minimal accessories, casual and polished clean aesthetic",
    "tags": [
      "white-shirt",
      "male",
      "casual"
    ],
    "weight": 1.05
  },
  {
    "id": "simple_gothic_smooth",
    "nameJa": "簡潔ゴシックつるっと",
    "nameEn": "Simple Gothic Smooth",
    "category": "smooth_clean",
    "useCases": [
      "ゴシック",
      "少女"
    ],
    "stylePrompt": "gothic-cute anime portrait, simplified dark hair rendering, limited lace detail, smooth polished shading, controlled contrast, clean decorative restraint, elegant cute gothic appeal",
    "tags": [
      "gothic",
      "cute",
      "smooth"
    ],
    "weight": 1.05
  },
  {
    "id": "minimal_mint_character",
    "nameJa": "ミント系ミニマルキャラ",
    "nameEn": "Minimal Mint Character",
    "category": "smooth_clean",
    "useCases": [
      "爽やか",
      "中性的"
    ],
    "stylePrompt": "mint-toned anime character illustration, soft grouped hairstyle, minimal ornamentation, smooth clean rendering, modern simple styling, gentle but polished visual clarity",
    "tags": [
      "mint",
      "minimal",
      "fresh"
    ],
    "weight": 1.05
  }
] satisfies StylePreset[];

export const smoothCleanHelpers = [
  {
    "id": "anti_overdetailed_hair",
    "nameJa": "髪の過描写抑制",
    "nameEn": "Anti Overdetailed Hair",
    "intent": "髪を細かくしすぎない",
    "antiAiPrompt": "avoid overly intricate hair strands, reduce excessive strand separation, avoid too much inner hair line detail",
    "tags": [
      "hair",
      "detail",
      "avoid"
    ],
    "caution": "髪の情報量を落としたい時"
  },
  {
    "id": "anti_spiky_hair_ends",
    "nameJa": "毛先の尖りすぎ抑制",
    "nameEn": "Anti Spiky Hair Ends",
    "intent": "毛先を鋭くしすぎない",
    "antiAiPrompt": "avoid overly sharp or overly thin hair ends, keep hair tips soft and simplified",
    "tags": [
      "hair",
      "tips",
      "soft"
    ],
    "caution": "今回の方向にかなり重要"
  },
  {
    "id": "anti_flyaway_noise",
    "nameJa": "飛び毛ノイズ抑制",
    "nameEn": "Anti Flyaway Noise",
    "intent": "飛び毛を減らす",
    "antiAiPrompt": "minimize stray hairs and unnecessary flyaway strands, keep the hair silhouette clean",
    "tags": [
      "hair",
      "noise",
      "clean"
    ],
    "caution": "髪の輪郭を整理する"
  },
  {
    "id": "smooth_surface_finish",
    "nameJa": "つるっとした面",
    "nameEn": "Smooth Surface Finish",
    "intent": "塗りをなめらかにする",
    "antiAiPrompt": "smooth surface rendering, sleek clean shading, polished but simplified visual finish",
    "tags": [
      "smooth",
      "surface",
      "finish"
    ],
    "caution": "全体のつるっと感を増す"
  },
  {
    "id": "face_over_hair_priority",
    "nameJa": "顔優先",
    "nameEn": "Face Over Hair Priority",
    "intent": "顔の魅力を優先",
    "antiAiPrompt": "prioritize facial appeal over hair detail, keep the face refined while simplifying the hair rendering",
    "tags": [
      "face",
      "priority",
      "portrait"
    ],
    "caution": "顔に情報を寄せる"
  },
  {
    "id": "clean_visual_editing",
    "nameJa": "画面整理",
    "nameEn": "Clean Visual Editing",
    "intent": "全体の情報量を整理",
    "antiAiPrompt": "clean visual editing, reduced clutter, simplified detail distribution, elegant restraint",
    "tags": [
      "clean",
      "layout",
      "editing"
    ],
    "caution": "髪・衣装・背景全体を整理"
  },
  {
    "id": "anti_chatgpt_hair_noise",
    "nameJa": "汎用AI髪ノイズ回避",
    "nameEn": "Anti Generic Hair Noise",
    "intent": "既製品っぽい髪描写を避ける",
    "antiAiPrompt": "avoid generic over-detailed hair rendering, avoid unnecessary micro-detail in hair and clothing",
    "tags": [
      "avoid",
      "generic",
      "hair"
    ],
    "caution": "ChatGPTっぽさ回避"
  },
  {
    "id": "restrained_ornament",
    "nameJa": "装飾抑制",
    "nameEn": "Restrained Ornament",
    "intent": "衣装装飾を控えめにする",
    "antiAiPrompt": "restrained ornamentation, limited decorative detail, clean outfit design",
    "tags": [
      "ornament",
      "clothing",
      "clean"
    ],
    "caution": "アクセ過多防止"
  },
  {
    "id": "simple_but_stylish",
    "nameJa": "シンプルだけどおしゃれ",
    "nameEn": "Simple but Stylish",
    "intent": "地味すぎず洗練",
    "antiAiPrompt": "simple but stylish, minimal but attractive, refined and uncluttered character styling",
    "tags": [
      "simple",
      "stylish",
      "refined"
    ],
    "caution": "総仕上げ向け"
  },
  {
    "id": "large_hair_clumps_prompt",
    "nameJa": "大きめ毛束",
    "nameEn": "Large Hair Clumps",
    "intent": "毛束を大きくまとめる",
    "antiAiPrompt": "hair grouped into larger clumps, broader strand organization, simplified internal separation",
    "tags": [
      "hair",
      "clumps",
      "broad"
    ],
    "caution": "細かい毛束化を防ぐ"
  },
  {
    "id": "soft_grouped_bangs",
    "nameJa": "前髪を大きく整理",
    "nameEn": "Soft Grouped Bangs",
    "intent": "前髪を整理する",
    "antiAiPrompt": "softly grouped bangs, broad fringe sections, reduced micro-strand complexity in the front hair",
    "tags": [
      "bangs",
      "fringe",
      "hair"
    ],
    "caution": "前髪の情報量を抑える"
  },
  {
    "id": "reduced_accessory_count",
    "nameJa": "アクセ点数を減らす",
    "nameEn": "Reduced Accessory Count",
    "intent": "アクセ数を減らす",
    "antiAiPrompt": "use fewer accessories, keep visible adornments minimal and intentional",
    "tags": [
      "accessory",
      "minimal"
    ],
    "caution": "耳飾りやリボンを盛りすぎない"
  },
  {
    "id": "clean_silhouette_priority",
    "nameJa": "シルエット優先",
    "nameEn": "Clean Silhouette Priority",
    "intent": "シルエット重視",
    "antiAiPrompt": "prioritize a clean silhouette, avoid noisy contour breakup, preserve simple readable outer shapes",
    "tags": [
      "silhouette",
      "clean",
      "shape"
    ],
    "caution": "輪郭を整理する"
  },
  {
    "id": "controlled_highlights",
    "nameJa": "ハイライト制御",
    "nameEn": "Controlled Highlights",
    "intent": "光沢を暴れさせない",
    "antiAiPrompt": "controlled highlights, restrained specular accents, keep shine elegant and simple",
    "tags": [
      "highlight",
      "gloss",
      "control"
    ],
    "caution": "テカテカしすぎ防止"
  },
  {
    "id": "reduced_texture_buildup",
    "nameJa": "質感盛りすぎ抑制",
    "nameEn": "Reduced Texture Buildup",
    "intent": "質感を増やしすぎない",
    "antiAiPrompt": "avoid excessive texture buildup, keep surfaces smooth and intentionally simplified",
    "tags": [
      "texture",
      "surface",
      "smooth"
    ],
    "caution": "情報量増加を抑える"
  },
  {
    "id": "balanced_face_refinement",
    "nameJa": "顔は繊細に",
    "nameEn": "Balanced Face Refinement",
    "intent": "顔だけは魅力を保つ",
    "antiAiPrompt": "maintain refined eyes and facial features while simplifying secondary details",
    "tags": [
      "face",
      "refinement",
      "portrait"
    ],
    "caution": "のっぺり回避"
  },
  {
    "id": "minimal_outfit_folds",
    "nameJa": "服のシワ簡略化",
    "nameEn": "Minimal Outfit Folds",
    "intent": "服のシワ情報量を減らす",
    "antiAiPrompt": "reduce complex clothing folds, keep garment shapes tidy and readable",
    "tags": [
      "clothing",
      "folds",
      "simple"
    ],
    "caution": "衣装ノイズ削減"
  },
  {
    "id": "low_clutter_character_finish",
    "nameJa": "低ノイズ仕上げ",
    "nameEn": "Low-Clutter Character Finish",
    "intent": "最終的なノイズ低減",
    "antiAiPrompt": "low-clutter character finish, controlled detail density, clear focal hierarchy, elegant simplification",
    "tags": [
      "finish",
      "clutter",
      "hierarchy"
    ],
    "caution": "全体仕上げ"
  }
] satisfies AntiAiBlock[];
