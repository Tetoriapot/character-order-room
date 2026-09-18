// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "round|丸い目|round eyes|\nlarge|大きな目|large eyes|\nsmall|小さめの目|small eyes|\ndroopy|たれ目|droopy eyes|\nupturned|つり目|sharp eyes|\nalmond|切れ長の目|narrow eyes|\nsleepy-eyes|眠たげな目|sleepy eyes|\nhalf-lidded|半目|half-lidded eyes|\ngentle-eyes|優しい目|gentle eyes|\ncold-eyes|冷たい目|cold eyes|\nkind-eyes|穏やかな目|kind eyes|\nupturned-eyes-2|目尻が上がった目|upturned eyes|\ndownturned-eyes|目尻が下がった目|downturned eyes|\nsparkling-eyes|きらきらした目|sparkling eyes|\nlifeless-eyes|虚ろな目|lifeless eyes|\npiercing-eyes|鋭い眼差し|piercing eyes|\ninnocent-looking-eyes|無垢な目|innocent-looking eyes|\nseductive-eyes|色っぽい目|seductive eyes|\neyes-framed-by-long-eyelashes|まつ毛が印象的|eyes framed by long eyelashes|\nsoft-gaze|柔らかな目元|soft gaze|\nnarrow|細目|narrow|legacy\nsharp|鋭い目|sharp|legacy\ncat|猫目|cat-like|legacy\nsanpaku|三白眼|sanpaku|legacy\nhooded|奥二重|hooded|legacy";

export const eyeShapes = createCatalog("eyeShape", raw);
