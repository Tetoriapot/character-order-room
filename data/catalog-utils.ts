import type { Choice } from '@/lib/character-types';

const tagRules: Array<[RegExp, string[]]> = [
  [/翼は指定時のみ|指定していない翼|no wings unless|do not add wings/i, ['no-wings']],
  [/角は指定時のみ|指定していない角|no horns unless|do not add horns/i, ['no-horns']],
  [/獣耳は指定時のみ|指定していない獣耳|no animal ears unless|do not add animal ears/i, ['no-animal-ears']],
  [/人間|\bhuman\b/i, ['human']],
  [/ダークエルフ|dark elf/i, ['dark-elf', 'elf', 'dark', 'fantasy']],
  [/エルフ|\belf\b/i, ['elf', 'forest', 'fantasy']],
  [/吸血鬼|vampire/i, ['vampire', 'dark', 'gothic', 'fantasy']],
  [/堕天使|fallen angel/i, ['fallen-angel', 'angel', 'dark', 'wounded', 'fantasy']],
  [/天使|\bangel\b/i, ['angel', 'holy', 'heavenly', 'white', 'gold', 'fantasy']],
  [/悪魔|demon|succubus|incubus/i, ['demon', 'dark', 'horns', 'fantasy']],
  [/幽霊|ghost/i, ['ghost', 'spirit', 'moon', 'mist', 'fantasy']],
  [/精霊|spirit/i, ['spirit', 'ethereal', 'fantasy']],
  [/妖精|fairy/i, ['fairy', 'forest', 'fantasy']],
  [/人魚|merfolk|underwater/i, ['aquatic', 'fantasy']],
  [/獣人|beastman|werewolf|fox spirit|animal ears/i, ['beast', 'animal-ears', 'fantasy']],
  [/竜人|dragonkin/i, ['dragon', 'fantasy']],
  [/アンドロイド|android/i, ['android', 'sf', 'futuristic']],
  [/ロボット|robot|cyborg|prosthetic|digital|cyber/i, ['sf', 'futuristic', 'tech']],
  [/神性|divine|holy|sacred|聖|神聖/i, ['holy', 'heavenly']],
  [/王子|姫君|王族|王宮|玉座|royal|prince|princess|palace|throne/i, ['royal', 'palace', 'fantasy']],
  [/貴族|公爵|noble|aristocrat|ducal/i, ['noble', 'royal', 'formal']],
  [/騎士|knight|paladin/i, ['knight', 'armor', 'fantasy']],
  [/重装鎧|heavy armor/i, ['heavy-armor', 'armor', 'fantasy']],
  [/鎧|armor|battle suit/i, ['armor', 'battle']],
  [/魔法使い|魔術師|mage|magic|magical|court mage/i, ['mage', 'magic', 'fantasy']],
  [/司祭|シスター|聖職者|priest|nun|cleric|church|cathedral|chapel/i, ['clergy', 'holy', 'church']],
  [/教師|teacher/i, ['teacher', 'work', 'modern']],
  [/研究|research|laboratory|lab coat/i, ['researcher', 'laboratory', 'work']],
  [/医者|doctor|hospital/i, ['doctor', 'hospital', 'work']],
  [/バーテンダー|bartender|\bbar\b/i, ['bartender', 'bar', 'work']],
  [/マフィア|極道|yakuza|mafia/i, ['mafia', 'villain', 'commanding']],
  [/学校|学園|制服|school|classroom|rooftop/i, ['school', 'young']],
  [/スーツ|suit|office/i, ['suit', 'formal', 'modern']],
  [/カーディガン|cardigan/i, ['cardigan', 'soft', 'modern']],
  [/Tシャツ|T-shirt/i, ['tshirt', 'casual', 'modern']],
  [/カジュアル|casual|hoodie|street|denim|sweater|shirt/i, ['casual', 'modern']],
  [/和服|着物|巫女|侍|浪人|袴|浴衣|神社|竹林|和室|kimono|Japanese|samurai|shrine|bamboo/i, ['japanese']],
  [/ゴシック|gothic|black lace|mourning/i, ['gothic', 'dark']],
  [/サイバーパンク|cyberpunk|neon-lit|futuristic city|SF都市/i, ['cyberpunk', 'sf', 'neon', 'futuristic']],
  [/SF|sci-fi|space|宇宙/i, ['sf', 'futuristic']],
  [/アイドル|stage|concert|singer|dancer/i, ['idol', 'stage']],
  [/エプロン|apron/i, ['apron', 'domestic', 'gap-soft']],
  [/花柄|floral|flower/i, ['flower', 'delicate']],
  [/破れ|torn/i, ['torn', 'wounded']],
  [/汚れ|dirty|blood-stained|worn /i, ['dirty', 'wounded']],
  [/森|forest|woodland|dappled/i, ['forest', 'nature']],
  [/夜明け|\bdawn\b|pre-dawn/i, ['dawn']],
  [/星空|starry sky/i, ['night']],
  [/夜(?!明け)|\bnight\b|moonlit|moonlight/i, ['night', 'moon']],
  [/大聖堂|cathedral/i, ['cathedral', 'church', 'holy']],
  [/遺跡|ruins/i, ['ruins', 'fantasy']],
  [/海辺|beach|seaside/i, ['beach', 'summer']],
  [/天上|heavenly/i, ['heavenly', 'holy']],
  [/不穏|ominous|stormy/i, ['ominous', 'dark']],
  [/雪|snow/i, ['snow', 'winter', 'cold']],
  [/砂漠|desert/i, ['desert', 'warm']],
  [/夕焼け|sunset/i, ['sunset', 'warm']],
  [/庭園|garden/i, ['garden', 'nature']],
  [/図書館|本|book|library|scholar/i, ['book', 'scholarly']],
  [/杖|staff/i, ['staff', 'magic']],
  [/葉巻|cigar/i, ['cigar', 'mafia']],
  [/眼鏡|glasses/i, ['glasses', 'intellectual']],
  [/翼|wings?/i, ['wings']],
  [/角|horns?/i, ['horns']],
  [/獣耳|animal ears/i, ['animal-ears']],
  [/天使の輪|halo/i, ['halo', 'holy']],
  [/筋肉|muscular|powerfully built|sturdy|broad.shouldered/i, ['muscular', 'strong']],
  [/大柄|large build|thickset/i, ['large', 'strong']],
  [/華奢|delicate build|frail|small and slender/i, ['delicate', 'fragile']],
  [/高身長|\btall\b/i, ['tall']],
  [/優しい|gentle|kind|reassuring|supportive|warm/i, ['gentle', 'soft']],
  [/人懐こい|friendly/i, ['friendly', 'soft']],
  [/困った笑顔|troubled smile|awkward smile/i, ['troubled-smile', 'smile', 'soft']],
  [/はにか|bashful|shy smile/i, ['bashful', 'smile', 'soft']],
  [/笑|smile|grin|laugh/i, ['smile']],
  [/不敵|smirk|confident expression/i, ['smirk', 'confident']],
  [/意味深|mysterious smile|enigmatic/i, ['mysterious-smile', 'mysterious']],
  [/狂気|insane|unhinged/i, ['insane', 'dark']],
  [/眠|sleepy/i, ['sleepy']],
  [/疲れ|tired|war-weary/i, ['tired']],
  [/傷つ|wounded|pained|pain/i, ['wounded']],
  [/儚|ethereal|delicate/i, ['fragile', 'ethereal']],
  [/クール|cool|stoic|cold/i, ['cool']],
  [/自信|confident|arrogant|smug/i, ['confident']],
  [/威圧|commanding|dominant/i, ['commanding']],
  [/腕を組|crossing arms/i, ['arms-crossed']],
  [/腰に手|hand on hip|hands on hips/i, ['hand-hip']],
  [/座|sitting|reclining/i, ['sitting']],
  [/玉座|throne/i, ['throne']],
  [/眼鏡を直|adjusting glasses/i, ['adjust-glasses']],
  [/本を読|reading a book/i, ['reading']],
  [/剣を構|sword.*ready/i, ['sword-ready', 'battle']],
  [/祈|prayer|praying/i, ['praying', 'holy']],
  [/浮遊|floating/i, ['floating']],
  [/翼を広|spreading wings/i, ['spreading-wings', 'wings']],
  [/膝をつ|kneeling/i, ['kneeling']],
  [/手を差し|reaching/i, ['reaching']],
  [/顔を隠|covering the face/i, ['cover-face']],
  [/走|running/i, ['running']],
  [/目を閉|eyes closed/i, ['eyes-closed']],
  [/鋭く見|intense gaze|piercing/i, ['intense-gaze']],
  [/顔アップ|face close-up|headshot/i, ['face-closeup']],
  [/全身|full-body|full figure/i, ['full-body']],
  [/背景も見せ|showing more background/i, ['background-emphasis']],
  [/背景なし|no background/i, ['no-background']],
  [/透過|transparent/i, ['transparent']],
  [/柔らかな光|soft lighting|diffused lighting/i, ['soft-light']],
  [/木漏れ日|dappled sunlight/i, ['dappled']],
  [/月明かり|moonlight/i, ['moonlight']],
  [/ネオン|neon/i, ['neon-light']],
  [/金色の光|golden light/i, ['golden-light']],
  [/神聖な光|holy light/i, ['holy-light']],
  [/下からの光|underlighting/i, ['underlight']],
];

const groupRules: Array<[RegExp, string, number]> = [
  [/blue-black hair/i, 'hair-black-color', 2],
  [/black hair/i, 'hair-black-color', 1],
  [/very short hair|short cropped hair|pixie/i, 'hair-short', 2],
  [/short hair|short bob/i, 'hair-short', 1],
  [/very long hair|disheveled long|sleek long/i, 'hair-long', 2],
  [/long hair|long bob/i, 'hair-long', 1],
  [/low ponytail/i, 'ponytail', 2],
  [/ponytail/i, 'ponytail', 1],
  [/round glasses|thin-framed glasses/i, 'glasses', 2],
  [/glasses/i, 'glasses', 1],
  [/full beard/i, 'beard', 2],
  [/beard|mustache|goatee/i, 'beard', 1],
  [/friendly smile|gentle smile|reassuring smile|bashful smile|troubled smile/i, 'smile', 2],
  [/smile/i, 'smile', 1],
  [/standing naturally|standing straight|relaxed pose/i, 'standing', 2],
  [/standing/i, 'standing', 1],
  [/neon-lit city/i, 'night-city', 2],
  [/night city/i, 'night-city', 1],
  [/diffused lighting/i, 'soft-light', 2],
  [/soft lighting/i, 'soft-light', 1],
];

const uniq = (values: string[]) => [...new Set(values.filter(Boolean))];

const inferTags = (category: string, ja: string, en: string, explicit: string[]) => {
  const haystack = `${ja} ${en}`;
  return uniq([
    category,
    ...explicit,
    ...tagRules.flatMap(([pattern, tags]) => pattern.test(haystack) ? tags : []),
  ]);
};

const inferWeight = (category: string, ja: string, en: string) => {
  const key = `${ja} ${en}`.toLowerCase();
  if (category === 'species') {
    if (/人間|\bhuman\b/.test(key)) return 3;
    if (/エルフ|\belf\b/.test(key) && !/dark/.test(key)) return 0.8;
    if (/吸血鬼|vampire/.test(key)) return 0.65;
    if (/天使|angel|悪魔|demon/.test(key) && !/fallen/.test(key)) return 0.55;
    if (/幽霊|ghost/.test(key)) return 0.4;
    if (/android/.test(key)) return 0.35;
    if (/神性|divine/.test(key)) return 0.15;
    return 0.45;
  }
  if (category === 'hairColor') {
    if (/黒髪|black hair/.test(key)) return 1.4;
    if (/brown/.test(key)) return 1.2;
    if (/blonde/.test(key)) return 1;
    if (/white hair|白髪/.test(key)) return 0.8;
    if (/red hair|赤髪/.test(key)) return 0.75;
    if (/blue hair|青髪/.test(key)) return 0.55;
    if (/rainbow|虹色/.test(key)) return 0.1;
  }
  if (/rainbow|神性|divine|otherworldly/.test(key)) return 0.2;
  if (/glowing|発光|blood-stained|ゴア/.test(key)) return 0.65;
  return 1;
};

export function createCatalog(category: string, raw: string): Choice[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, labelJa, labelEn, tagText = '', weightText = ''] = line.split('|');
      const groups = groupRules
        .filter(([pattern]) => pattern.test(`${labelJa} ${labelEn}`))
        .map(([, group]) => group);
      const specificity = Math.max(
        1,
        ...groupRules
          .filter(([pattern]) => pattern.test(`${labelJa} ${labelEn}`))
          .map(([, , score]) => score),
      );
      const parsedWeight = Number(weightText);
      const weight = Number.isFinite(parsedWeight) && parsedWeight > 0
        ? parsedWeight
        : inferWeight(category, labelJa, labelEn);
      return {
        id,
        labelJa,
        labelEn,
        ja: labelJa,
        en: labelEn,
        tags: inferTags(category, labelJa, labelEn, tagText.split(',').map((tag) => tag.trim())),
        weight,
        groups: uniq(groups),
        specificity,
      };
    });
}
