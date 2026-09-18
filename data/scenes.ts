import type { Choice } from '@/lib/character-types';

const c = (id: string, ja: string, en: string): Choice => ({
  id, labelJa: ja, labelEn: en, ja, en, tags: [id], weight: 1,
});

export const gazes = [
  c('camera', 'カメラを見る', 'looking at the viewer'), c('side', '横を見る', 'looking to the side'),
  c('downcast', '伏し目', 'with a downcast gaze'), c('up', '見上げる', 'looking upward'),
  c('down', '見下ろす', 'looking downward'), c('back', '振り返ってこちらを見る', 'looking back at the viewer'),
  c('closed', '目を閉じる', 'eyes closed'), c('distant', '遠くを見る', 'gazing into the distance'),
];

export const cameraAngles = [
  c('front', '正面', 'front view'), c('three-quarter', '斜め', 'three-quarter view'),
  c('profile', '横顔', 'side profile'), c('high', '上から', 'high-angle view'),
  c('low', '下から', 'low-angle view'), c('eye', 'アイレベル', 'eye-level view'),
  c('tilted', 'ダッチアングル', 'Dutch angle'), c('over-shoulder', '肩越し', 'over-the-shoulder view'),
];

export const compositions = [
  c('close', '顔アップ', 'face close-up'), c('bust', 'バストアップ', 'bust-up composition'),
  c('waist', '腰上', 'waist-up composition'), c('knees', '膝上', 'knee-up composition'),
  c('full', '全身', 'full-body composition'), c('sheet', '設定画構図', 'character reference sheet composition'),
];

export const aspectRatios = [
  c('portrait', '縦長', 'portrait orientation'), c('square', '正方形', 'square format'),
  c('landscape', '横長', 'landscape orientation'), c('transparent', '透過用縦長', 'portrait format for transparent output'),
];

export const backgrounds = [
  c('none', '背景なし', 'no background'), c('solid', '単色', 'solid-color background'),
  c('white', '白背景', 'white background'), c('black', '黒背景', 'black background'),
  c('transparent', '透過想定', 'transparent-background composition'), c('room', '部屋', 'cozy room'),
  c('classroom', '教室', 'classroom'), c('palace', '王宮', 'royal palace'),
  c('garden', '庭園', 'elegant garden'), c('forest', '森', 'lush forest'),
  c('beach', '海辺', 'seaside'), c('night-city', '夜の街', 'city street at night'),
  c('alley', '路地', 'narrow alley'), c('bar', 'バー', 'stylish bar'),
  c('cafe', 'カフェ', 'cafe'), c('library', '図書館', 'grand library'),
  c('church', '教会', 'church interior'), c('ruins', '遺跡', 'ancient ruins'),
  c('desert', '砂漠', 'desert'), c('snow', '雪原', 'snowfield'),
  c('fantasy-city', 'ファンタジー都市', 'fantasy city'), c('scifi-city', 'SF都市', 'futuristic city'),
  c('marble-room', '大理石の部屋', 'marble hall'), c('rooftop', '屋上', 'rooftop'),
  c('station', '駅のホーム', 'train platform'), c('rain-window', '雨の窓辺', 'rainy window'),
  c('festival', '祭り', 'festival street'), c('shrine', '神社', 'Shinto shrine'),
  c('castle', '古城', 'old castle'), c('laboratory', '研究室', 'laboratory'),
  c('spaceship', '宇宙船', 'spaceship interior'), c('battlefield', '戦場', 'battlefield'),
  c('flower-field', '花畑', 'field of flowers'), c('underwater', '水中', 'underwater setting'),
  c('sky', '空中', 'open sky'), c('stage', 'ステージ', 'performance stage'),
];

export const timesOfDay = [
  c('morning', '朝', 'morning'), c('day', '昼', 'daytime'), c('evening', '夕方', 'sunset'),
  c('night', '夜', 'night'), c('midnight', '深夜', 'midnight'), c('dawn', '未明', 'pre-dawn'),
];

export const lighting = [
  c('natural', '自然光', 'natural light'), c('soft', '柔らかな光', 'soft light'),
  c('backlight', '強い逆光', 'strong backlighting'), c('dappled', '木漏れ日', 'dappled sunlight'),
  c('moon', '月明かり', 'moonlight'), c('neon', 'ネオン', 'neon lighting'),
  c('candle', 'キャンドル', 'candlelight'), c('stained-glass', 'ステンドグラス', 'stained-glass light'),
  c('indoor', '室内照明', 'indoor lighting'), c('dramatic', 'ドラマチックな光', 'dramatic lighting'),
  c('rim', 'リムライト', 'rim lighting'), c('volumetric', 'ボリュームライト', 'volumetric light'),
  c('spotlight', 'スポットライト', 'spotlight'), c('golden-hour', 'ゴールデンアワー', 'golden-hour light'),
  c('blue-hour', 'ブルーアワー', 'blue-hour light'), c('fluorescent', '蛍光灯', 'fluorescent light'),
  c('fire', '炎の光', 'firelight'), c('magic', '魔法の光', 'magical glow'),
  c('hologram', 'ホログラムの光', 'holographic light'), c('rain-reflection', '雨の反射光', 'rain reflections'),
  c('sparkles', '光の粒子', 'floating light particles'), c('bokeh', 'ボケ光', 'soft bokeh lights'),
  c('soft-shadow', '柔らかな影', 'soft shadows'), c('hard-shadow', 'コントラストの強い影', 'high-contrast shadows'),
];

export const negatives = [
  c('no-text', '文字なし', 'text'), c('no-logo', 'ロゴなし', 'logos'),
  c('no-watermark', '透かしなし', 'watermarks'), c('no-realism', '写実的表現禁止', 'photorealism'),
  c('no-real-face', '写実的な顔禁止', 'photorealistic facial features'), c('no-real-nose', 'リアルな鼻禁止', 'realistic nose rendering'),
  c('no-real-lips', 'リアルな唇禁止', 'realistic lip rendering'), c('no-3d', '3D表現禁止', '3D rendering'),
  c('one-person', '人物を複数描かない', 'multiple characters'), c('no-crowd', '背景人物なし', 'background people'),
  c('good-hands', '不自然な手を避ける', 'malformed hands'), c('good-fingers', '指の崩れを避ける', 'malformed fingers'),
  c('no-muscle', '過剰な筋肉を避ける', 'exaggerated muscles'), c('no-decoration', '過剰な装飾を避ける', 'excessive ornamentation'),
  c('no-exposure', '過剰な露出を避ける', 'excessive skin exposure'), c('no-blur', 'ぼやけを避ける', 'blur'),
  c('no-lowres', '低解像度を避ける', 'low resolution'), c('no-crop', '不自然な見切れを避ける', 'awkward cropping'),
  c('no-duplicate', '手足の重複を避ける', 'duplicated limbs'), c('no-extra-limbs', '余分な手足を避ける', 'extra limbs'),
  c('no-bad-anatomy', '不自然な骨格を避ける', 'bad anatomy'), c('no-flat-light', '平坦な光を避ける', 'flat lighting'),
  c('no-clutter', '散らかった背景を避ける', 'cluttered background'), c('no-signature', 'サインなし', 'artist signatures'),
];
