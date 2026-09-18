// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "eye|アイレベル|eye-level angle|\nfront|正面|front view|\nthree-quarter|斜め前|three-quarter view|\nprofile|横顔|profile view|\nhigh|やや上から|viewed slightly from above|\nlow|やや下から|viewed slightly from below|\ndramatic-low-angle|煽り構図|dramatic low angle|\ntop-down-angle|真上に近い視点|top-down angle|\nclose-up-framing|寄りの構図|close-up framing|\ndistant-shot|引きの構図|distant shot|\ncinematic-angle|映画的なアングル|cinematic angle|\nportrait-oriented-framing|ポートレート向け構図|portrait-oriented framing|\ntilted|ダッチアングル|Dutch angle|legacy\nover-shoulder|肩越し|over-the-shoulder view|legacy";

export const cameraAngles = createCatalog("cameraAngle", raw);
