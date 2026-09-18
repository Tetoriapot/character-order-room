// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "petite|小柄|petite|\nsmall-and-slender|小柄で華奢|small and slender|\nslim|細身|slender|\nlean-build|痩せ型|lean build|\ndelicate|華奢|delicate build|\naverage|中肉中背|average build|\nathletic|引き締まった体|fit build|\nathletic-build-2|スポーツ体型|athletic build|\nmuscular|筋肉質|muscular build|\npowerful|ガチムチ|heavily muscular build|\nbroad-shoulders|肩幅が広い|broad shoulders|\ntall|高身長|tall|\ntall-and-slender|高身長で細身|tall and slender|\ntall-and-muscular|高身長で筋肉質|tall and muscular|\nmodel|モデル体型|model-like build|\ncurvy|メリハリのある体型|curvy|\nsoft|柔らかそうな体型|soft-looking build|\nsturdy-build|がっしり|sturdy build|\nlarge|大柄|large build|\nsturdy|骨太|thickset build|\ngraceful-frame|すらりとした体型|graceful frame|\nboyish-build|少年っぽい体格|boyish build|\ngirlish-build|少女っぽい体格|girlish build|\nfrail-build|病弱そう|frail build|";

export const bodyTypes = createCatalog("build", raw);
