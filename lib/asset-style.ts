import { assetChoices } from '@/data/asset-options';
import {
  advancedAssetStyles,
  assetStyleCategories,
} from '@/data/asset-style-catalog';

export const assetStyles = assetChoices.style.map((option) => ({
  ...option,
  category:
    advancedAssetStyles.find((style) => style.id === option.id)?.category ??
    'general',
}));

export function filterAssetStyles(category = 'all', query = '') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return assetStyles.filter((style) => {
    const family = assetStyleCategories.find(
      (item) => item.id === style.category,
    );
    return (
      (category === 'all' ||
        style.category === category ||
        family?.usage === category) &&
      terms.every((term) =>
        `${style.ja} ${style.promptJa ?? ''} ${style.en} ${family?.ja} ${family?.en}`
          .toLocaleLowerCase()
          .includes(term),
      )
    );
  });
}
