import { createCatalog } from './catalog-utils';

const raw = [
  'floral-apron|花柄エプロン|floral apron|apron,flower,domestic,soft',
  'pink-cardigan|ピンクのカーディガン|pink cardigan|cardigan,pink,soft',
  'rabbit-plush|うさぎのぬいぐるみ|rabbit plush toy|plush,soft,cute',
  'bouquet|花束|bouquet of flowers|flower,delicate',
  'flower-crown|花冠|flower crown|flower,delicate',
  'small-animal|小動物|small animal companion|animal,cute,soft',
].join('\n');

export const gapAccessories = createCatalog('accessory', raw);
