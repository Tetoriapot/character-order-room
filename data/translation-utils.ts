export type TranslationEntry = {
  ja: string;
  en: string;
  type?: 'noun' | 'adjective' | 'phrase' | 'style' | 'negative';
  aliases?: string[];
};

const aliasMap: Record<string, string[]> = {
  メロい: ['色気がある', '魅力的', '人を惹きつける'],
  クール: ['冷静', '涼しげ'],
  儚い: ['繊細', '消え入りそう'],
  褐色肌: ['褐色', '日焼け肌', '小麦色'],
  ガチムチ: ['筋骨隆々', '屈強'],
};

export function createTranslations(raw: string): TranslationEntry[] {
  const seen = new Set<string>();
  return raw.split('\n').map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    const [ja, en] = line.split('|').map((part) => part.trim());
    if (!ja || !en || ja.startsWith('type?') || seen.has(ja)) return [];
    seen.add(ja);
    return [{ ja, en, aliases: aliasMap[ja] ?? [] }];
  });
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function translateWithDictionary(value: string, entries: TranslationEntry[]): string {
  const source = value.trim();
  if (!source) return '';
  const phrases = entries
    .flatMap((entry) => [entry.ja, ...(entry.aliases ?? [])].map((phrase) => ({ phrase, en: entry.en })))
    .sort((a, b) => b.phrase.length - a.phrase.length);
  const translateSegment = (segment: string) => {
    let translated = segment;
    for (const { phrase, en } of phrases) {
      translated = translated.replace(new RegExp(escapeRegExp(phrase), 'g'), en);
    }
    // A partly translated phrase such as "black hairの青年" is less useful than
    // preserving the original unknown phrase as a single unit.
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(translated) && translated !== segment
      ? segment
      : translated;
  };
  return source
    .split(/([、，。！？!?；;：:\n]+)/)
    .map((segment) => {
      if (/^[、，]+$/.test(segment)) return ', ';
      if (/^[。]+$/.test(segment)) return '. ';
      if (/^[！!]+$/.test(segment)) return '! ';
      if (/^[？?]+$/.test(segment)) return '? ';
      if (/^[；;]+$/.test(segment)) return '; ';
      if (/^[：:]+$/.test(segment)) return ': ';
      if (/^\n+$/.test(segment)) return '; ';
      return translateSegment(segment);
    })
    .join('')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*([.!?;:])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[,.]\s*$/, '');
}
