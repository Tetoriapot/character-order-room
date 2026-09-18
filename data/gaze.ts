// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "camera|こちらを見る|looking at the viewer|\nlooking-away|目をそらす|looking away|\ndowncast|伏し目|looking downward|\nup|見上げる|looking up|\nside|横を見る|looking to the side|\nlooking-over-the-shoulder|肩越しに見る|looking over the shoulder|\nclosed|目を閉じる|eyes closed|\nhalf-lidded-gaze|半目で見る|half-lidded gaze|\nintense-gaze|鋭く見つめる|intense gaze|\nsoft-gaze|柔らかく見つめる|soft gaze|\nsad-gaze|悲しげに見る|sad gaze|\ndistant|遠くを見る|looking into the distance|\ndowncast-gaze-2|うつむく|downcast gaze|\nteasing-gaze|からかうように見る|teasing gaze|\ncold-stare|冷たく見つめる|cold stare|\nadoring-gaze|愛おしそうに見る|adoring gaze|\ndown|見下ろす|looking downward|legacy\nback|振り返ってこちらを見る|looking back at the viewer|legacy";

export const gazes = createCatalog("gaze", raw);
