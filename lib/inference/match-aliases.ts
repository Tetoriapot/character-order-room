import { inferenceAliases } from '@/data/inference-aliases';
import { findChoice } from '@/data/options';
import { scoreConfidence } from './score-confidence';
import { isNegatedSpan, type TextSpan } from './text-context';
import type { InferenceAlias, InferenceLevel, InferredValue } from './types';

const overlaps = (left: TextSpan, right: TextSpan) =>
  left.start < right.end && right.start < left.end;

const findOccurrences = (text: string, key: string) => {
  const occurrences: TextSpan[] = [];
  let offset = 0;
  while (offset < text.length) {
    const index = text.indexOf(key, offset);
    if (index < 0) break;
    occurrences.push({ start: index, end: index + key.length });
    offset = index + Math.max(1, key.length);
  }
  return occurrences;
};

const standaloneBoundary = /[\s、。！？,.「」『』（）()【】のはがをにでへとやもおかよま]/u;
const standaloneSuffix = /^(?:だ|です|である|だった|でした|キャラ(?:クター)?|人物|少女|女性|男性|少年|青年)(?:[\s、。！？,.]|$)/u;

const matchesMode = (
  text: string,
  key: string,
  span: TextSpan,
  mode: 'substring' | 'standalone' | 'hairstyle' = 'substring',
) => {
  if (mode === 'substring') return true;
  const before = text.slice(Math.max(0, span.start - 8), span.start);
  const after = text.slice(span.end, span.end + 12);
  if (mode === 'hairstyle') {
    if (/^(?:コート|パンツ|丈|という(?:名|名前))/u.test(after)) return false;
    if (/(?:髪|髪型)(?:は|が|を)?$/u.test(before) || /^(?:ヘア|髪|カット)/u.test(after)) return true;
  }
  const previous = span.start > 0 ? text[span.start - 1] : '';
  const next = span.end < text.length ? text[span.end] : '';
  const leftBoundary = !previous
    || standaloneBoundary.test(previous)
    || /(?:では|じゃ|で)?(?:なく|ない)(?:て)?$/u.test(before);
  const rightBoundary = !next || standaloneBoundary.test(next) || standaloneSuffix.test(after);
  return leftBoundary && rightBoundary;
};

const identityFields = new Set(['gender', 'ageGroup', 'species', 'outfit']);

const isContextMismatch = (text: string, alias: InferenceAlias, span: TextSpan) => {
  const { key } = alias;
  const before = text.slice(Math.max(0, span.start - 8), span.start);
  const after = text.slice(span.end, span.end + 18);
  const identityAlias = alias.targets.some((target) => identityFields.has(target.category));
  if (identityAlias && (
    /^(?:の)?よう(?:な|に)/u.test(after)
    || /^(?:を|に|から|へ|と(?!して))[^、。！？\n]{0,8}(?:戦|闘|倒|討|退治|狩|追|逃|守|救|助け|襲|捕|封印|召喚|研究|契約|仕え|対峙|敵対|目指|話|出会)/u.test(after)
  )) return true;
  if (['明るい', '豪華', '上品', 'ダーク'].includes(key) && /^(?:な|の)?(?:光|照明|背景|色|部屋|髪|髪色|瞳|目|肌|服|衣装)/u.test(after)) return true;
  if (key === '明るい' && /^(?:光|照明|背景|色|部屋|髪|髪色|瞳|目|肌|服|衣装)/u.test(after)) return true;
  if (key === '青白い' && /^(?:光|照明|発光|炎|火|月|空|背景|オーラ|髪|瞳|目|服|衣装)/u.test(after)) return true;
  if (key === '傷' && (/^(?:つい|ついて|ついた|つけ|つき)/u.test(after) || before.endsWith('心の'))) return true;
  if (key === '牙' && (before.endsWith('象') || after.startsWith('城'))) return true;
  if ((key === '男' || key === '女') && (
    /^(?:装|体化|湯|性向け)/u.test(after)
    || (key === '男' ? before.endsWith('女') || after.startsWith('女') : before.endsWith('男') || after.startsWith('男'))
  )) return true;
  if (/(?:男|女)$/u.test(key) && /^(?:装|体化|湯|性向け)/u.test(after)) return true;
  if (/(?:男|女)(?:性|の人)?$/u.test(key) && /^(?:向け|用|もの|服|衣装)/u.test(after)) return true;
  if (['吸血鬼', 'ヴァンパイア', '天使', '堕天使', '悪魔', 'サキュバス', 'インキュバス', 'エルフ', 'ダークエルフ', '幽霊', '妖精', '人魚', '獣人', '狼男', 'アンドロイド', 'ロボット', 'サイボーグ', '人外'].includes(key)
    && /^(?:風|モチーフ|耳|(?:の)?(?:衣装|服|コスプレ|カチューシャ|アクセサリー))/u.test(after)) return true;
  if (key === '角') {
    if (/^(?:度|形|張った|ばった|を現)/u.test(after) || /(?:三|四|五|六|多)角$/u.test(before) || before.endsWith('頭')) return true;
    const hornContext = /(?:頭|額|鬼|悪魔|竜|龍|一本|二本|一対|大きな|小さな|鋭い|曲がった|生えた|生えている|持つ)$/u.test(before)
      || /^(?:(?:が|を|の)?(?:ある|生え|持|付き|つき|一本|二本|大き|小さ|鋭|曲が))/u.test(after);
    if (!hornContext) return true;
  }
  return false;
};

export function matchInferenceAliases(text: string, level: InferenceLevel) {
  const values: InferredValue[] = [];
  const warnings: string[] = [];
  const occupied: TextSpan[] = [];
  const sorted = [...inferenceAliases].sort((left, right) =>
    right.key.length - left.key.length || left.key.localeCompare(right.key, 'ja'),
  );

  for (const alias of sorted) {
    const validOccurrences = findOccurrences(text, alias.key).filter((span) =>
      !occupied.some((existing) => overlaps(existing, span))
      && matchesMode(text, alias.key, span, alias.matchMode)
      && !isContextMismatch(text, alias, span),
    );
    if (!validOccurrences.length) continue;

    const affirmed = validOccurrences.filter((span) => !isNegatedSpan(text, span));
    if (!affirmed.length) {
      warnings.push(`「${alias.key}」は否定表現のため候補から外しました。`);
      occupied.push(...validOccurrences);
      continue;
    }

    occupied.push(...affirmed);
    for (const target of alias.targets) {
      const choice = findChoice(target.category, target.valueId);
      if (!choice) {
        warnings.push(`「${alias.key}」に対応する項目を現在のデータから見つけられませんでした。`);
        continue;
      }
      const source = target.source ?? 'explicit';
      values.push({
        category: target.category,
        valueId: target.valueId,
        labelJa: choice.labelJa,
        labelEn: choice.labelEn,
        source,
        confidence: scoreConfidence(source, level, target.category, {
          base: target.confidence ?? alias.confidence,
          exact: true,
          longPhrase: alias.key.length >= 6,
          occurrences: affirmed.length,
        }),
        evidence: alias.key,
        reason: source === 'explicit'
          ? `「${alias.key}」を設定メモから読み取りました。`
          : `「${alias.key}」から自然に推測しました。`,
        reasonEn: source === 'explicit'
          ? `Read directly from “${alias.key}”.`
          : `Naturally inferred from “${alias.key}”.`,
      });
    }
  }

  return { values, warnings };
}
