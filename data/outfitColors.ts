// Preserved from the original catalog for saved-setting compatibility.
import { createCatalog } from './catalog-utils';

const raw = "black|黒|black|\nwhite|白|white|\ngray|灰|gray|\nnavy|紺|navy|\nblue|青|blue|\ncyan|水色|sky blue|\ngreen|緑|green|\nmint|ミント|mint|\nred|赤|red|\nwine|ワイン|wine red|\npink|ピンク|pink|\npurple|紫|purple|\nlavender|ラベンダー|lavender|\nyellow|黄|yellow|\ngold|金|gold|\nsilver|銀|silver|\nbrown|茶|brown|\nbeige|ベージュ|beige|\ncream|クリーム|cream|\norange|オレンジ|orange|";

export const outfitColors = createCatalog("outfitColor", raw);
