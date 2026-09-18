import type { GapSeed, RandomTheme } from '@/lib/character-types';

const themeRules: Array<[RegExp, string[], string[], string[]]> = [
  [/王道ファンタジー|魔法使い|戦士/, ['fantasy', 'mage', 'knight', 'magic'], ['forest', 'palace', 'ruins'], ['sf', 'school']],
  [/ダークファンタジー|悪役/, ['dark', 'gothic', 'ruins', 'night', 'vampire', 'demon'], ['moon', 'mist', 'wounded'], ['school', 'pastel', 'beach', 'cheerful']],
  [/学園/, ['school', 'young', 'modern'], ['cardigan', 'casual'], ['royal', 'heavy-armor']],
  [/現代|会社員|紳士/, ['modern', 'casual', 'suit'], ['cafe', 'office'], ['fantasy', 'armor']],
  [/和風|巫女|幽霊/, ['japanese', 'shrine'], ['moon', 'forest', 'ghost'], ['sf']],
  [/SF|電脳/, ['sf', 'futuristic', 'tech', 'cyberpunk'], ['neon'], ['historical']],
  [/ゴシック/, ['gothic', 'dark', 'noble'], ['church', 'moon'], ['pastel', 'beach']],
  [/王族|令嬢/, ['royal', 'noble', 'palace'], ['formal', 'golden-light'], ['street']],
  [/聖職者|天使/, ['holy', 'clergy', 'angel', 'heavenly'], ['white', 'gold', 'wings'], ['demon', 'ominous']],
  [/お兄さん/, ['adult', 'male', 'gentle', 'suit'], ['cardigan', 'soft'], ['child']],
  [/お姉さん/, ['adult', 'female', 'elegant'], ['suit', 'soft'], ['child']],
  [/美少年/, ['male', 'young', 'delicate', 'beautiful'], ['ethereal'], ['large']],
  [/美少女/, ['female', 'young', 'delicate', 'beautiful'], ['pastel'], ['large']],
  [/人外男子/, ['male', 'fantasy'], ['horns', 'animal-ears', 'wings'], ['human']],
  [/吸血鬼/, ['vampire', 'noble', 'night'], ['gothic', 'moon'], ['beach', 'holy']],
  [/教師|眼鏡キャラ/, ['teacher', 'glasses', 'cardigan'], ['book', 'gentle'], ['fantasy']],
  [/マフィア/, ['mafia', 'suit', 'villain'], ['commanding', 'bar'], ['school']],
  [/アイドル/, ['idol', 'stage'], ['sparkles', 'colorful'], ['dirty']],
  [/悲劇|負傷/, ['wounded', 'tragic', 'dirty'], ['night', 'ominous'], ['cheerful']],
  [/癒し/, ['gentle', 'soft', 'friendly'], ['nature', 'pastel'], ['ominous']],
  [/反抗/, ['rebellious', 'punk', 'street'], ['smirk'], ['holy']],
  [/冬/, ['winter', 'snow', 'cold'], ['soft-light'], ['summer', 'beach']],
  [/夏/, ['summer', 'beach', 'bright'], ['casual'], ['winter', 'snow']],
  [/花/, ['flower', 'garden', 'delicate'], ['soft', 'pastel'], ['sf']],
  [/月/, ['moon', 'night', 'moonlight'], ['silver', 'mist'], ['sun']],
  [/太陽/, ['sun', 'warm', 'golden-light'], ['bright'], ['night']],
  [/砂漠/, ['desert', 'warm', 'mage'], ['sunset'], ['snow']],
  [/森/, ['forest', 'nature', 'dappled'], ['elf'], ['sf']],
  [/恋愛ゲーム|ウェブトゥーン/, ['noble', 'beautiful', 'soft'], ['glass', 'romantic'], ['horror']],
];

type ThemeCore = RandomTheme['core'][number];

const themeCoreRules: Array<[RegExp, ThemeCore[]]> = [
  [/^王道ファンタジー$/, [{ field: 'outfit', tags: ['fantasy'] }]],
  [/^ダークファンタジー$/, [{ field: 'outfit', tags: ['dark', 'gothic'] }]],
  [/^学園$/, [{ field: 'outfit', tags: ['school'] }]],
  [/^現代$/, [{ field: 'outfit', tags: ['modern'] }]],
  [/^和風$/, [{ field: 'outfit', tags: ['japanese'] }]],
  [/^SF$/, [{ field: 'outfit', tags: ['sf'] }]],
  [/^ゴシック$/, [{ field: 'outfit', tags: ['gothic'] }]],
  [/^王族$/, [{ field: 'outfit', tags: ['royal'] }]],
  [/^令嬢$/, [{ field: 'gender', ids: ['female'] }, { field: 'outfit', tags: ['royal', 'noble'] }]],
  [/^魔法使い$/, [{ field: 'outfit', tags: ['mage', 'magic'] }]],
  [/^聖職者$/, [{ field: 'outfit', tags: ['clergy', 'holy'] }]],
  [/^悪役$/, [{ field: 'outfit', tags: ['villain', 'dark'] }]],
  [/^お兄さん$/, [{ field: 'gender', ids: ['male'] }, { field: 'ageGroup', ids: ['adult'] }]],
  [/^お姉さん$/, [{ field: 'gender', ids: ['female'] }, { field: 'ageGroup', ids: ['adult'] }]],
  [/^美少年$/, [{ field: 'gender', ids: ['male'] }, { field: 'ageGroup', ids: ['boy'] }]],
  [/^美少女$/, [{ field: 'gender', ids: ['female'] }, { field: 'ageGroup', ids: ['girl'] }]],
  [/^人外男子$/, [{ field: 'gender', ids: ['male'] }, { field: 'species', tags: ['fantasy'] }]],
  [/^天使$/, [{ field: 'species', ids: ['angel'] }]],
  [/^吸血鬼$/, [{ field: 'species', ids: ['vampire'] }]],
  [/^教師$/, [{ field: 'outfit', tags: ['teacher'] }]],
  [/^マフィア$/, [{ field: 'outfit', ids: ['mafia'] }]],
  [/^アイドル$/, [{ field: 'outfit', tags: ['idol'] }]],
  [/^悲劇の主人公$/, [{ field: 'personality', ids: ['tragic'] }]],
  [/^癒し系$/, [{ field: 'personality', ids: ['gentle', 'soft-looking', 'friendly'] }]],
  [/^反抗的$/, [{ field: 'personality', ids: ['rebellious'] }]],
  [/^冬モチーフ$/, [{ field: 'background', tags: ['winter', 'snow'] }]],
  [/^夏モチーフ$/, [{ field: 'background', tags: ['summer', 'beach'] }]],
  [/^花モチーフ$/, [{ field: 'background', tags: ['flower', 'garden'] }]],
  [/^月モチーフ$/, [{ field: 'background', tags: ['moon', 'night'] }]],
  [/^太陽モチーフ$/, [{ field: 'lighting', tags: ['golden-light'] }]],
  [/^眼鏡キャラ$/, [{ field: 'faceFeatures', ids: ['glasses'] }]],
  [/^負傷キャラ$/, [{ field: 'personality', ids: ['wounded'] }]],
  [/^紳士$/, [{ field: 'gender', ids: ['male'] }, { field: 'ageGroup', ids: ['adult'] }, { field: 'outfit', tags: ['suit', 'formal'] }]],
  [/^戦士$/, [{ field: 'outfit', tags: ['knight', 'armor'] }]],
  [/^幽霊$/, [{ field: 'species', ids: ['ghost'] }]],
  [/^砂漠系$/, [{ field: 'background', tags: ['desert'] }]],
  [/^森系$/, [{ field: 'background', tags: ['forest'] }]],
  [/^電脳系$/, [{ field: 'outfit', ids: ['cyberpunk'] }]],
  [/^恋愛ゲーム風$/, [{ field: 'style', ids: ['otome'] }]],
  [/^ウェブトゥーン光沢系$/, [{ field: 'style', ids: ['webtoon'] }, { field: 'styleTraits', ids: ['glass-gloss'] }]],
];

const englishNames: Record<string, string> = {
  王道ファンタジー: 'Classic Fantasy', ダークファンタジー: 'Dark Fantasy', 学園: 'School', 現代: 'Modern',
  和風: 'Japanese', SF: 'Sci-Fi', ゴシック: 'Gothic', 王族: 'Royalty', 魔法使い: 'Mage', 聖職者: 'Clergy',
  悪役: 'Villain', お兄さん: 'Older Brother', お姉さん: 'Older Sister', 美少年: 'Pretty Boy', 美少女: 'Pretty Girl',
  人外男子: 'Nonhuman Man', 天使: 'Angel', 吸血鬼: 'Vampire', 教師: 'Teacher', マフィア: 'Mafia', アイドル: 'Idol',
  悲劇の主人公: 'Tragic Protagonist', 癒し系: 'Comforting', 反抗的: 'Rebellious', 冬モチーフ: 'Winter Theme',
  夏モチーフ: 'Summer Theme', 花モチーフ: 'Floral Theme', 月モチーフ: 'Moon Theme', 太陽モチーフ: 'Sun Theme',
  眼鏡キャラ: 'Glasses Character', 負傷キャラ: 'Injured Character', 紳士: 'Gentleman', 令嬢: 'Noble Lady',
  戦士: 'Warrior', 幽霊: 'Ghost', 砂漠系: 'Desert Theme', 森系: 'Forest Theme', 電脳系: 'Cyber Theme',
  恋愛ゲーム風: 'Romance Game Style', ウェブトゥーン光沢系: 'Glossy Webtoon Style',
};

const slug = (value: string) => value
  .normalize('NFKD')
  .replace(/[^\w\u3040-\u30ff\u3400-\u9fff]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

export function createThemes(raw: string): RandomTheme[] {
  return raw.split('\n').map((label) => label.trim()).filter(Boolean).map((label) => {
    const matches = themeRules.filter(([pattern]) => pattern.test(label));
    const preferredTags = [...new Set(matches.flatMap(([, preferred]) => preferred))];
    const secondaryTags = [...new Set(matches.flatMap(([, , secondary]) => secondary))];
    const excludedTags = [...new Set(matches.flatMap(([, , , excluded]) => excluded))];
    const core = themeCoreRules.filter(([pattern]) => pattern.test(label)).flatMap(([, values]) => values);
    return {
      id: slug(englishNames[label] ?? label),
      label,
      labelEn: englishNames[label] ?? label,
      description: `${label}に合う要素を優先して、まとまりのある案を生成します`,
      preferredTags,
      secondaryTags,
      excludedTags,
      core,
    };
  });
}

export function createGapSeeds(raw: string, rawEn = ''): GapSeed[] {
  const englishLabels = rawEn.split('\n').map((label) => label.trim()).filter(Boolean);
  return raw.split('\n').map((label) => label.trim()).filter((label) => Boolean(label) && !label.startsWith('概算')).map((label, index) => {
    const labelEn = englishLabels[index] ?? 'contrasting character details';
    return {
      id: `gap-${String(index + 1).padStart(2, '0')}`,
      label,
      labelEn,
      segments: label.split('×').map((segment) => segment.trim()).filter(Boolean),
      segmentsEn: labelEn.split('×').map((segment) => segment.trim()).filter(Boolean),
    };
  });
}
