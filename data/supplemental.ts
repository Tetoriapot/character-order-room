import { createCatalog } from './catalog-utils';

export const supplementalOutfits = createCatalog(
  'outfit',
  'dirty-clothes|汚れた服|dirty clothes|dirty,wounded,special',
);

export const supplementalNegatives = createCatalog(
  'negative',
  'no-people|人物なし|no people|no-people',
);
