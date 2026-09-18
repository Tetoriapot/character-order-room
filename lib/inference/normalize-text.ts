export function normalizeInferenceText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\u3000]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .toLocaleLowerCase('ja-JP');
}

export function splitInferenceSentences(value: string) {
  return value
    .split(/(?<=[。！？!?\n])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
