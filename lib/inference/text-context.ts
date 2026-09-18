export type TextSpan = { start: number; end: number };

const clauseTail = (text: string, span: TextSpan, length = 18) =>
  text.slice(span.end, span.end + length).split(/[。！？\n]/u, 1)[0] ?? '';

/**
 * Detects common Japanese negation forms immediately around a matched phrase.
 * The bounded, same-clause window avoids treating a later sentence as negation.
 */
export const isNegatedSpan = (text: string, span: TextSpan) => {
  const before = text.slice(Math.max(0, span.start - 5), span.start);
  const after = clauseTail(text, span);
  return /(?:非|無|not\s*)$/iu.test(before)
    || /^(?:以外|を?(?:除く|除いて|除外(?:する|して|した)?)|を?(?:外す|外した|外して(?:いる|います)))/u.test(after)
    || /^(?:でも|も)[^。！？\n]{1,20}(?:でも|も)(?:ない|なく|なかった|ありません)/u.test(after)
    || /^(?:でも|も)(?:ない|なく|なかった|ありません)/u.test(after)
    || /^(?:に|へ|と)(?:は)?し(?:ない|なく|なかった|ません|ていない)/u.test(after)
    || /^(?:の(?:髪|髪色|目|瞳|肌|顔|服|衣装|角|翼|耳))(?:(?:では|じゃ|で)?(?:ない|なく|なかった|ありません|ございません)|(?:は|が|も)?(?:ない|なし|無い|無し|不要))/u.test(after)
    || /^(?:(?:では|じゃ|で)?(?:ない|なく|なかった|ありません|ございません)|(?:は|が|も|を)?(?:ない|なし|無い|無し|不要|なかった|ありません)|(?:を|は|が|も)?(?:かけ|掛け|着け|つけ|付け|持(?:た|っ)|装備し|着用し)(?:て)?(?:い)?(?:ない|なかった|ません))/u.test(after);
};
