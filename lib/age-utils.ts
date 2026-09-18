export const normalizeAgeInput = (value: string): string => {
  const trimmed = value.trim();
  return /^(?:0|[1-9]\d{0,2})$/.test(trimmed) ? trimmed : '';
};

export const isMinorAge = (ageNumber: string, ageGroup: string): boolean => {
  const normalized = normalizeAgeInput(ageNumber);
  if (normalized) return Number(normalized) < 18;
  return ['child', 'teen', 'boy', 'girl'].includes(ageGroup);
};
