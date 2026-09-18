import type { Choice } from '@/lib/character-types';

const c = (id: string, ja: string, en: string): Choice => ({
  id, labelJa: ja, labelEn: en, ja, en, tags: [id], weight: 1,
});

export const purposes = [
  c('chat', 'チャットアプリ用', 'character chat profile'),
  c('standing', 'キャラクター立ち絵', 'character standee'),
  c('icon', 'アイコン', 'profile icon'),
  c('bust', 'バストアップ', 'bust portrait'),
  c('waist', '腰上', 'waist-up portrait'),
  c('full', '全身', 'full-body character art'),
  c('trpg', 'TRPG NPC', 'TRPG NPC portrait'),
  c('event', 'イベントCG', 'event CG'),
  c('still', 'スチル', 'character still'),
  c('sns', 'SNS用', 'social media artwork'),
  c('reference', 'キャラクター設定資料', 'character reference sheet'),
  c('background', '背景イラスト', 'background illustration'),
  c('custom', '自由設定', 'custom illustration'),
];

export const styles = [
  c('webtoon', 'ウェブトゥーン風', 'polished webtoon style'),
  c('vibrant-anime', '華やかなアニメ風', 'vibrant anime style'),
  c('otome', '乙女ゲーム風', 'elegant otome game style'),
  c('social-game', 'ソーシャルゲーム風', 'high-end mobile game illustration'),
  c('shojo', '少女漫画風', 'shojo manga style'),
  c('shonen', '少年漫画風', 'shonen manga style'),
  c('watercolor', '水彩風', 'delicate watercolor illustration'),
  c('cel', 'アニメ塗り', 'clean cel-shaded anime art'),
  c('painterly', '厚塗り', 'rich painterly rendering'),
  c('flat', 'フラットイラスト', 'modern flat illustration'),
  c('chibi', 'デフォルメ', 'stylized chibi illustration'),
  c('sd', 'SDキャラクター', 'super-deformed character art'),
  c('dark-fantasy', 'ダークファンタジー', 'dark fantasy illustration'),
  c('storybook', '絵本風', 'storybook illustration'),
];

export const styleModifiers = [
  c('glass-gloss', 'ガラスのような光沢', 'glass-like highlights'),
  c('translucent', '透明感', 'luminous translucency'),
  c('glamorous', '華やか', 'glamorous details'),
  c('fine-lines', '線画細め', 'fine linework'),
  c('minimal-lines', '線画少なめ', 'minimal linework'),
  c('bold-outline', '輪郭はっきり', 'crisp outlines'),
  c('saturated', '彩度高め', 'high saturation'),
  c('desaturated', '彩度低め', 'muted saturation'),
  c('soft-colors', '柔らかい色', 'soft colors'),
  c('contrast', '高コントラスト', 'high contrast'),
  c('pale', '淡い色', 'pale colors'),
  c('pastel', 'パステル', 'pastel palette'),
  c('light-focus', '光を強調', 'light-focused rendering'),
  c('atmospheric', '空気感重視', 'atmospheric depth'),
  c('textured', '繊細な質感', 'delicate texture'),
  c('cinematic', 'シネマティック', 'cinematic finish'),
  c('clean', 'すっきり', 'clean composition'),
  c('dreamy', '幻想的', 'dreamlike atmosphere'),
];

export const genders = [
  c('male', '男性', 'man'),
  c('female', '女性', 'woman'),
  c('androgynous', '中性的', 'androgynous person'),
  c('unspecified', '指定なし', 'person'),
];

export const ageGroups = [
  c('child', '子ども', 'child'),
  c('teen', '10代', 'teenager'),
  c('boy', '少年', 'teenage boy'),
  c('girl', '少女', 'teenage girl'),
  c('young', '若者', 'young adult'),
  c('adult', '成人', 'adult'),
  c('middle', '中年', 'middle-aged adult'),
  c('elderly', '老人', 'elderly person'),
  c('ageless', '年齢不詳', 'ageless person'),
];

export const species = [
  c('human', '人間', 'human'),
  c('elf', 'エルフ', 'elf'),
  c('vampire', '吸血鬼', 'vampire'),
  c('angel', '天使', 'angel'),
  c('demon', '悪魔', 'demon'),
  c('beastfolk', '獣人', 'beastfolk'),
  c('yokai', '妖怪', 'yokai'),
  c('ghost', '幽霊', 'ghost'),
  c('nonhuman', '人外', 'nonhuman being'),
  c('robot', 'ロボット', 'robot'),
  c('android', 'アンドロイド', 'android'),
  c('fairy', '妖精', 'fairy'),
];

export const builds = [
  c('delicate', '華奢', 'delicately built'),
  c('slim', '細身', 'slim'),
  c('average', '中肉中背', 'average-built'),
  c('tall', '高身長', 'tall'),
  c('petite', '小柄', 'petite'),
  c('muscular', '筋肉質', 'muscular'),
  c('powerful', 'ガチムチ', 'powerfully built'),
  c('large', '大柄', 'large-framed'),
  c('sturdy', '骨太', 'sturdily built'),
  c('model', 'モデル体型', 'model-proportioned'),
  c('soft', '柔らかな体型', 'softly built'),
  c('athletic', '引き締まった体型', 'athletic'),
];

export const skinTones = [
  c('fair', '色白', 'fair skin'),
  c('porcelain', '陶器のような白肌', 'porcelain skin'),
  c('light', '明るい肌', 'light skin'),
  c('warm', '血色のよい肌', 'warm-toned skin'),
  c('tan', '褐色肌', 'tan skin'),
  c('deep', '深い褐色の肌', 'deep brown skin'),
  c('olive', 'オリーブ肌', 'olive skin'),
  c('pale', '青白い肌', 'pale skin'),
  c('gray', '灰色の肌', 'gray skin'),
  c('blue', '青みがかった肌', 'blue-tinted skin'),
  c('gold', '金色の肌', 'golden skin'),
  c('synthetic', '人工的な肌', 'synthetic skin'),
];

export const personalities = [
  c('cute', 'かわいい', 'cute'), c('beautiful', '美しい', 'beautiful'),
  c('alluring', 'メロい', 'captivating'), c('sensual', '色気がある', 'sensual'),
  c('fresh', '爽やか', 'refreshing'), c('cool', 'クール', 'cool'),
  c('gentle', '優しい', 'gentle'), c('friendly', '人懐こい', 'friendly'),
  c('unreliable', '頼りなさそう', 'slightly unreliable'), c('fragile', '儚い', 'fragile'),
  c('aloof', '飄々としている', 'aloof'), c('mysterious', 'ミステリアス', 'mysterious'),
  c('suspicious', '胡散臭い', 'enigmatically suspicious'), c('noble', '高貴', 'noble'),
  c('confident', '自信家', 'self-confident'), c('cheeky', '生意気', 'cheeky'),
  c('quiet', '無口', 'quiet'), c('cold', '冷徹', 'cold'),
  c('mad', '狂気的', 'unhinged'), c('obsessive', '執着が強い', 'obsessive'),
  c('wild', '野性的', 'wild'), c('elegant', '上品', 'elegant'),
  c('intellectual', '知的', 'intellectual'), c('serious', '真面目', 'serious'),
  c('cheerful', '陽気', 'cheerful'), c('listless', '無気力', 'listless'),
  c('brave', '勇敢', 'brave'), c('shy', '恥ずかしがり', 'shy'),
  c('protective', '面倒見がよい', 'protective'), c('lonely', '孤独', 'lonely'),
  c('playful', 'お茶目', 'playful'), c('stoic', 'ストイック', 'stoic'),
  c('devoted', '一途', 'devoted'), c('rebellious', '反骨心が強い', 'rebellious'),
  c('calm', '穏やか', 'calm'), c('charismatic', 'カリスマ性がある', 'charismatic'),
];
