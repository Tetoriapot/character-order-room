import type { LockKey } from '@/lib/character-types';

export type CompatibilitySelector = {
  field: LockKey;
  ids?: string[];
  tags?: string[];
};

export type CompatibilityRule = {
  when: CompatibilitySelector;
  target: CompatibilitySelector;
  multiplier: number;
};

export const compatibilityRules: CompatibilityRule[] = [
  { when: { field: 'ageGroup', ids: ['adult', 'middle'] }, target: { field: 'outfit', tags: ['suit'] }, multiplier: 1.6 },
  { when: { field: 'ageGroup', ids: ['adult', 'middle'] }, target: { field: 'outfit', tags: ['teacher'] }, multiplier: 1.4 },
  { when: { field: 'ageGroup', ids: ['adult', 'middle'] }, target: { field: 'outfit', tags: ['noble'] }, multiplier: 1.2 },
  { when: { field: 'ageGroup', ids: ['young'] }, target: { field: 'outfit', tags: ['casual'] }, multiplier: 1.5 },
  { when: { field: 'ageGroup', ids: ['teen', 'boy', 'girl', 'child'] }, target: { field: 'outfit', tags: ['school'] }, multiplier: 1.8 },
  { when: { field: 'ageGroup', ids: ['teen', 'boy', 'girl', 'child'] }, target: { field: 'outfit', tags: ['suit'] }, multiplier: 0.4 },
  { when: { field: 'ageGroup', ids: ['elderly'] }, target: { field: 'outfit', tags: ['school'] }, multiplier: 0.05 },

  { when: { field: 'species', ids: ['elf'] }, target: { field: 'outfit', tags: ['forest'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['elf'] }, target: { field: 'outfit', tags: ['mage'] }, multiplier: 1.5 },
  { when: { field: 'species', ids: ['elf'] }, target: { field: 'background', tags: ['forest'] }, multiplier: 1.8 },
  { when: { field: 'species', ids: ['dark-elf'] }, target: { field: 'outfit', tags: ['dark'] }, multiplier: 1.7 },
  { when: { field: 'species', ids: ['dark-elf'] }, target: { field: 'background', tags: ['night', 'ruins'] }, multiplier: 1.5 },
  { when: { field: 'species', ids: ['vampire'] }, target: { field: 'outfit', tags: ['noble'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['vampire'] }, target: { field: 'outfit', tags: ['gothic'] }, multiplier: 1.8 },
  { when: { field: 'species', ids: ['vampire'] }, target: { field: 'background', tags: ['night'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['vampire'] }, target: { field: 'background', tags: ['cathedral'] }, multiplier: 1.4 },
  { when: { field: 'species', ids: ['vampire'] }, target: { field: 'background', tags: ['beach'] }, multiplier: 0.35 },
  { when: { field: 'species', ids: ['angel'] }, target: { field: 'outfit', tags: ['clergy', 'holy'] }, multiplier: 1.6 },
  { when: { field: 'species', ids: ['angel'] }, target: { field: 'accessories', tags: ['wings'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['angel'] }, target: { field: 'background', tags: ['heavenly'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['angel'] }, target: { field: 'lighting', tags: ['holy-light'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['fallen-angel'] }, target: { field: 'outfit', tags: ['dark', 'dirty', 'torn'] }, multiplier: 1.6 },
  { when: { field: 'species', ids: ['fallen-angel'] }, target: { field: 'background', tags: ['ominous'] }, multiplier: 1.6 },
  { when: { field: 'species', ids: ['demon'] }, target: { field: 'outfit', tags: ['dark', 'gothic'] }, multiplier: 1.7 },
  { when: { field: 'species', ids: ['demon'] }, target: { field: 'faceFeatures', tags: ['horns'] }, multiplier: 1.8 },
  { when: { field: 'species', ids: ['ghost'] }, target: { field: 'outfit', tags: ['japanese'] }, multiplier: 1.7 },
  { when: { field: 'species', ids: ['ghost'] }, target: { field: 'background', tags: ['night'] }, multiplier: 1.8 },
  { when: { field: 'species', ids: ['android'] }, target: { field: 'outfit', tags: ['sf', 'futuristic'] }, multiplier: 2 },
  { when: { field: 'species', ids: ['android'] }, target: { field: 'background', tags: ['neon', 'sf'] }, multiplier: 1.5 },
  { when: { field: 'species', ids: ['android'] }, target: { field: 'outfit', tags: ['japanese'] }, multiplier: 0.7 },

  { when: { field: 'build', ids: ['muscular', 'powerful', 'large'] }, target: { field: 'personality', tags: ['commanding', 'confident'] }, multiplier: 1.4 },
  { when: { field: 'build', ids: ['muscular', 'powerful'] }, target: { field: 'outfit', tags: ['knight', 'armor'] }, multiplier: 1.5 },
  { when: { field: 'build', ids: ['delicate', 'slim'] }, target: { field: 'personality', tags: ['fragile', 'ethereal'] }, multiplier: 1.6 },
  { when: { field: 'build', ids: ['large', 'powerful'] }, target: { field: 'expression', tags: ['troubled-smile'] }, multiplier: 0.9 },

  { when: { field: 'personality', ids: ['gentle'] }, target: { field: 'expression', tags: ['smile', 'soft'] }, multiplier: 1.8 },
  { when: { field: 'personality', ids: ['friendly'] }, target: { field: 'expression', tags: ['friendly'] }, multiplier: 2 },
  { when: { field: 'personality', ids: ['confident'] }, target: { field: 'expression', tags: ['smirk', 'confident'] }, multiplier: 1.7 },
  { when: { field: 'personality', ids: ['suspicious'] }, target: { field: 'expression', tags: ['mysterious-smile'] }, multiplier: 1.8 },
  { when: { field: 'personality', ids: ['mad'] }, target: { field: 'expression', tags: ['insane'] }, multiplier: 1.7 },
  { when: { field: 'personality', ids: ['tired'] }, target: { field: 'expression', tags: ['sleepy', 'tired'] }, multiplier: 1.7 },
  { when: { field: 'personality', ids: ['confident'] }, target: { field: 'pose', tags: ['arms-crossed', 'hand-hip'] }, multiplier: 1.5 },
  { when: { field: 'personality', tags: ['teacher'] }, target: { field: 'pose', tags: ['adjust-glasses'] }, multiplier: 1.6 },
  { when: { field: 'personality', tags: ['scholarly'] }, target: { field: 'pose', tags: ['reading'] }, multiplier: 1.7 },

  { when: { field: 'outfit', tags: ['teacher'] }, target: { field: 'accessories', tags: ['glasses', 'book'] }, multiplier: 1.3 },
  { when: { field: 'outfit', tags: ['teacher'] }, target: { field: 'expression', tags: ['gentle', 'soft'] }, multiplier: 1.2 },
  { when: { field: 'outfit', tags: ['mage'] }, target: { field: 'accessories', tags: ['staff'] }, multiplier: 1.5 },
  { when: { field: 'outfit', tags: ['mage'] }, target: { field: 'pose', tags: ['magic'] }, multiplier: 2 },
  { when: { field: 'outfit', tags: ['knight'] }, target: { field: 'pose', tags: ['sword-ready', 'battle'] }, multiplier: 1.8 },
  { when: { field: 'outfit', tags: ['clergy'] }, target: { field: 'pose', tags: ['praying'] }, multiplier: 1.8 },
  { when: { field: 'outfit', tags: ['school'] }, target: { field: 'background', tags: ['school'] }, multiplier: 1.8 },
  { when: { field: 'outfit', tags: ['suit'] }, target: { field: 'background', tags: ['office'] }, multiplier: 1.5 },
  { when: { field: 'outfit', tags: ['mafia'] }, target: { field: 'background', tags: ['palace', 'bar'] }, multiplier: 1.6 },
  { when: { field: 'outfit', tags: ['doctor'] }, target: { field: 'background', tags: ['hospital'] }, multiplier: 1.8 },
  { when: { field: 'outfit', tags: ['researcher'] }, target: { field: 'background', tags: ['laboratory'] }, multiplier: 1.8 },
  { when: { field: 'outfit', tags: ['bartender'] }, target: { field: 'background', tags: ['bar'] }, multiplier: 2 },
  { when: { field: 'outfit', tags: ['japanese'] }, target: { field: 'background', tags: ['japanese'] }, multiplier: 1.6 },
  { when: { field: 'outfit', tags: ['clergy'] }, target: { field: 'background', tags: ['church'] }, multiplier: 2 },
  { when: { field: 'outfit', tags: ['knight'] }, target: { field: 'background', tags: ['palace'] }, multiplier: 1.6 },
  { when: { field: 'outfit', tags: ['mage'] }, target: { field: 'background', tags: ['ruins'] }, multiplier: 1.5 },
  { when: { field: 'outfit', tags: ['royal'] }, target: { field: 'background', tags: ['palace'] }, multiplier: 2 },
  { when: { field: 'outfit', tags: ['cyberpunk'] }, target: { field: 'background', tags: ['neon'] }, multiplier: 2 },
  { when: { field: 'outfit', tags: ['idol'] }, target: { field: 'background', tags: ['stage'] }, multiplier: 2 },

  { when: { field: 'background', tags: ['forest'] }, target: { field: 'lighting', tags: ['dappled'] }, multiplier: 2 },
  { when: { field: 'background', tags: ['garden'] }, target: { field: 'lighting', tags: ['soft-light'] }, multiplier: 1.5 },
  { when: { field: 'background', tags: ['palace'] }, target: { field: 'lighting', tags: ['golden-light'] }, multiplier: 1.6 },
  { when: { field: 'background', tags: ['cathedral'] }, target: { field: 'lighting', tags: ['holy-light'] }, multiplier: 2 },
  { when: { field: 'background', tags: ['night', 'moon'] }, target: { field: 'lighting', tags: ['moonlight'] }, multiplier: 2 },
  { when: { field: 'background', tags: ['neon'] }, target: { field: 'lighting', tags: ['neon-light'] }, multiplier: 1.8 },
  { when: { field: 'background', tags: ['snow'] }, target: { field: 'lighting', tags: ['cold'] }, multiplier: 1.7 },
  { when: { field: 'background', tags: ['desert'] }, target: { field: 'lighting', tags: ['warm'] }, multiplier: 1.7 },
];
