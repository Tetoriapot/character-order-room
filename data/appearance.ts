import type { Choice } from '@/lib/character-types';

const c = (id: string, ja: string, en: string): Choice => ({
  id, labelJa: ja, labelEn: en, ja, en, tags: [id], weight: 1,
});

export const hairColors = [
  c('black', '黒', 'black'), c('brown', '茶', 'brown'), c('blonde', '金', 'blonde'),
  c('silver', '銀', 'silver'), c('white', '白', 'white'), c('red', '赤', 'red'),
  c('blue', '青', 'blue'), c('green', '緑', 'green'), c('purple', '紫', 'purple'),
  c('pink', 'ピンク', 'pink'), c('orange', 'オレンジ', 'orange'), c('navy', '紺', 'navy'),
  c('ash', 'アッシュ', 'ash gray'), c('beige', 'ベージュ', 'beige'), c('copper', '赤銅', 'copper'),
  c('wine', 'ワインレッド', 'wine red'), c('lavender', 'ラベンダー', 'lavender'),
  c('mint', 'ミント', 'mint green'), c('teal', '青緑', 'teal'), c('cyan', '水色', 'sky blue'),
  c('peach', 'ピーチ', 'peach'), c('gold', '黄金色', 'golden'), c('rainbow', '虹色', 'rainbow-colored'),
  c('iridescent', '偏光色', 'iridescent'),
];

export const hairEffects = [
  c('highlights', 'メッシュ', 'contrasting highlights'),
  c('inner', 'インナーカラー', 'inner color'),
  c('gradient', 'グラデーション', 'color gradient'),
  c('tips', '毛先だけ別色', 'contrasting tips'),
  c('streak', '一房だけ別色', 'single colored streak'),
];

export const hairstyles = [
  c('short', 'ショート', 'short hair'), c('bob', 'ボブ', 'bob cut'),
  c('medium', 'ミディアム', 'medium-length hair'), c('long', 'ロング', 'long hair'),
  c('very-long', '超ロング', 'very long hair'), c('wave', 'ウェーブ', 'wavy hair'),
  c('loose-curl', 'ゆる巻き', 'loosely curled hair'), c('straight', 'ストレート', 'straight hair'),
  c('ponytail', 'ポニーテール', 'ponytail'), c('half-up', 'ハーフアップ', 'half-up hairstyle'),
  c('low-tie', '一つ結び', 'low tied hair'), c('twintails', 'ツインテール', 'twin tails'),
  c('braid', '編み込み', 'braided hair'), c('slicked', 'オールバック', 'slicked-back hair'),
  c('center-part', 'センター分け', 'center-parted hair'), c('bangs', '前髪あり', 'hair with bangs'),
  c('one-eye', '片目隠れ', 'hair covering one eye'), c('pixie', 'ベリーショート', 'pixie cut'),
  c('wolf', 'ウルフカット', 'wolf cut'), c('mullet', 'マレット', 'modern mullet'),
  c('hime', '姫カット', 'hime cut'), c('side-tail', 'サイドテール', 'side ponytail'),
  c('bun', 'お団子', 'hair bun'), c('double-bun', 'ツインお団子', 'double buns'),
  c('messy', '無造作ヘア', 'tousled hair'), c('spiky', 'ツンツンヘア', 'spiky hair'),
  c('undercut', 'ツーブロック', 'undercut'), c('shaved', '坊主', 'buzz cut'),
  c('afro', 'アフロ', 'afro'), c('ringlets', '縦ロール', 'ringlet curls'),
  c('wet', '濡れ髪', 'wet-look hair'), c('fluffy', 'ふわふわヘア', 'fluffy hair'),
  c('asymmetry', 'アシンメトリー', 'asymmetrical hair'), c('side-part', '七三分け', 'side-parted hair'),
  c('crown-braid', 'クラウンブレイド', 'crown braid'), c('dreadlocks', 'ドレッド', 'dreadlocks'),
];

export const eyeColors = [
  c('black', '黒', 'black'), c('brown', '茶', 'brown'), c('gold', '金', 'golden'),
  c('silver', '銀', 'silver'), c('red', '赤', 'red'), c('blue', '青', 'blue'),
  c('green', '緑', 'green'), c('purple', '紫', 'purple'), c('pink', 'ピンク', 'pink'),
  c('amber', '琥珀', 'amber'), c('hazel', 'ヘーゼル', 'hazel'), c('gray', '灰', 'gray'),
  c('cyan', '水色', 'sky blue'), c('navy', '紺', 'navy'), c('emerald', 'エメラルド', 'emerald'),
  c('violet', 'バイオレット', 'violet'), c('wine', 'ワインレッド', 'wine red'),
  c('white', '白', 'white'), c('heterochromia', 'オッドアイ', 'heterochromatic'),
  c('gradient', 'グラデーション', 'gradient-colored'), c('glowing', '発光色', 'glowing'),
  c('rainbow', '虹色', 'rainbow-colored'),
];

export const eyeShapes = [
  c('droopy', 'たれ目', 'soft downturned'), c('upturned', 'つり目', 'upturned'),
  c('almond', '切れ長', 'almond-shaped'), c('round', '丸目', 'round'),
  c('half-lidded', '半目', 'half-lidded'), c('narrow', '細目', 'narrow'),
  c('large', '大きな目', 'large'), c('small', '小さな目', 'small'),
  c('sharp', '鋭い目', 'sharp'), c('cat', '猫目', 'cat-like'),
  c('sanpaku', '三白眼', 'sanpaku'), c('hooded', '奥二重', 'hooded'),
];

export const eyeImpressions = [
  c('gentle', '優しい目', 'gentle'), c('clear', '澄んだ目', 'clear'),
  c('sleepy', '眠たげな目', 'sleepy'), c('cold', '冷たい目', 'cold'),
  c('strong', '意志の強い目', 'strong-willed'), c('innocent', '無垢な目', 'innocent'),
  c('seductive', '色っぽい目', 'seductive'), c('piercing', '射抜くような目', 'piercing'),
  c('vacant', '虚ろな目', 'vacant'), c('sparkling', 'きらきらした目', 'sparkling'),
  c('tearful', '潤んだ目', 'tearful'), c('mischievous', 'いたずらっぽい目', 'mischievous'),
];

export const faceFeatures = [
  c('glasses', '眼鏡', 'glasses'), c('mole', 'ほくろ', 'beauty mark'),
  c('freckles', 'そばかす', 'freckles'), c('scar', '傷', 'facial scar'),
  c('burn', '火傷跡', 'burn scar'), c('tattoo', '刺青', 'facial tattoo'),
  c('beard', '髭', 'facial hair'), c('piercing', 'ピアス', 'piercings'),
  c('horns', '角', 'horns'), c('animal-ears', '獣耳', 'animal ears'),
  c('pointed-ears', '尖った耳', 'pointed ears'), c('eyepatch', '眼帯', 'eyepatch'),
  c('fangs', '牙', 'visible fangs'), c('elf-brows', '長い眉', 'long elegant eyebrows'),
  c('heavy-lashes', '長いまつ毛', 'long eyelashes'), c('dark-circles', '目の下のクマ', 'dark circles under the eyes'),
  c('dimples', 'えくぼ', 'dimples'), c('makeup', '華やかなメイク', 'glamorous makeup'),
  c('natural-makeup', 'ナチュラルメイク', 'natural makeup'), c('mechanical', '機械的な顔のパーツ', 'mechanical facial details'),
];
