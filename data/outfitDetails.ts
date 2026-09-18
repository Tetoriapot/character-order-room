// Preserved from the original catalog for saved-setting compatibility.
import { createCatalog } from './catalog-utils';

const raw = "cotton|コットン素材|cotton fabric|\nsilk|シルク素材|silk fabric|\nleather|レザー素材|leather details|\nvelvet|ベルベット素材|velvet fabric|\nlace|レース|lace details|\nmetal|メタル装飾|metal ornamentation|\nsimple|装飾少なめ|minimal decoration|\nornate|装飾多め|ornate decoration|\nmodest|露出少なめ|modest coverage|\nopen|露出多め|revealing cut|\nnecklace|ネックレス|necklace|\nearrings|イヤリング|earrings|\ngloves|手袋|gloves|\nbelt|ベルト|decorative belt|\nbrooch|ブローチ|brooch|\nribbon|リボン|ribbon accents|\nembroidery|刺繍|embroidery|\nchains|チェーン|chain accessories|\nfur|ファー|fur trim|\ntransparent|シアー素材|sheer fabric|\narmor|部分甲冑|partial armor|\nflowers|花の装飾|floral accessories|\njewels|宝石|gemstone details|\ntech|発光する機械パーツ|glowing tech details|";

export const outfitDetails = createCatalog("outfitDetail", raw);
