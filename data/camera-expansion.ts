import type { Choice } from '@/lib/character-types';

// Keep additions separate from the imported catalogs so re-importing the original pack preserves them.
// Camera labels use explicit tags: words such as "三角" must not imply anatomical horns.
const choices = (field: string, rows: Array<[string, string, string, string, number?]>): Choice[] => rows.map(([id, ja, en, tags, weight = 0.8]) => ({
  id, labelJa: ja, labelEn: en, ja, en, tags: [field, ...tags.split(',')], weight,
}));

export const expandedCameraAngles = choices('cameraAngle', [
  ['rear', '背面から', 'rear view, camera behind the subject', 'camera-direction,rear-view', 0.6],
  ['rear-three-quarter', '斜め後ろから', 'rear three-quarter view', 'camera-direction,rear-view', 0.7],
  ['front-left', '左斜め前から', 'view from the subject’s front-left side', 'camera-direction', 1],
  ['front-right', '右斜め前から', 'view from the subject’s front-right side', 'camera-direction', 1],
  ['profile-left', '左側からの横顔', 'left-side profile view', 'camera-direction', 0.9],
  ['profile-right', '右側からの横顔', 'right-side profile view', 'camera-direction', 0.9],
  ['rear-left', '左斜め後ろから', 'view from the subject’s rear-left side', 'camera-direction,rear-view', 0.6],
  ['rear-right', '右斜め後ろから', 'view from the subject’s rear-right side', 'camera-direction,rear-view', 0.6],
  ['high-front', '正面上方から見下ろす', 'high-angle view from in front of the subject', 'camera-height', 0.9],
  ['high-side', '横の上方から見下ろす', 'high-angle view from the side', 'camera-height', 0.8],
  ['high-rear', '後ろの上方から見下ろす', 'high-angle view from behind', 'camera-height,rear-view', 0.5],
  ['low-front', '正面下方から見上げる', 'low-angle view from in front of the subject', 'camera-height', 0.9],
  ['low-side', '横の下方から見上げる', 'low-angle view from the side', 'camera-height', 0.7],
  ['low-rear', '後ろの下方から見上げる', 'low-angle view from behind', 'camera-height,rear-view', 0.5],
  ['ground-level', '地面すれすれの視点', 'ground-level camera looking upward', 'camera-height,camera-dramatic', 0.4],
  ['direct-overhead', '真上から（90度）', 'directly overhead view, camera looking straight down', 'camera-height,camera-dramatic', 0.5],
]);

export const expandedCompositions = choices('composition', [
  ['eye-detail', '目元のクローズアップ', 'extreme close-up focused on the eyes', 'composition-framing,face-closeup', 0.35],
  ['head-and-shoulders', '頭と肩を入れる', 'head-and-shoulders portrait with both shoulders visible', 'composition-framing,face-closeup', 1],
  ['waist-with-hands', '手元も入れた腰上', 'waist-up framing with both hands inside the frame', 'composition-framing', 1],
  ['full-with-margin', '頭から足先まで余白つき', 'full-body framing with clear space above the head and below the feet', 'composition-framing,full-body', 1],
  ['left-third', '左の三分割線に配置', 'main focal point placed on the left third of the frame', 'composition-placement,scene-compatible', 1],
  ['right-third', '右の三分割線に配置', 'main focal point placed on the right third of the frame', 'composition-placement,scene-compatible', 1],
  ['space-left', '左側に広い余白', 'main focal point on the right with generous negative space on the left', 'composition-space,scene-compatible', 0.9],
  ['space-right', '右側に広い余白', 'main focal point on the left with generous negative space on the right', 'composition-space,scene-compatible', 0.9],
  ['space-above', '上側に広い余白', 'low focal point with generous negative space above', 'composition-space,scene-compatible', 0.8],
  ['space-below', '下側に広い余白', 'high focal point with generous negative space below', 'composition-space,scene-compatible', 0.6],
  ['symmetrical-balance', '左右対称の配置', 'balanced bilateral symmetry in the composition', 'composition-placement,scene-compatible', 0.9],
  ['asymmetrical-balance', '非対称のバランス', 'asymmetrical composition with balanced visual weight', 'composition-placement,scene-compatible', 0.9],
  ['diagonal-flow', '対角線に沿う配置', 'diagonal visual flow across the frame', 'composition-placement,scene-compatible', 0.8],
  ['triangular-balance', '三角形を意識した配置', 'triangular arrangement of the main visual elements', 'composition-placement,scene-compatible', 0.7],
  ['circular-flow', '円を描く視線誘導', 'circular visual flow guiding the eye toward the focal point', 'composition-placement,scene-compatible', 0.6],
  ['frame-within-frame', '窓や扉越しに切り取る', 'frame-within-a-frame composition using a window or doorway', 'composition-depth,scene-compatible,background-emphasis', 0.7],
  ['foreground-framing', '前景で主役を囲む', 'foreground elements framing the main focal point', 'composition-depth,scene-compatible,background-emphasis', 0.7],
  ['layered-depth', '前景・中景・遠景を分ける', 'layered foreground, middle ground, and background for a clear sense of depth', 'composition-depth,scene-compatible,background-emphasis', 0.8],
  ['wide-establishing', '広い情景を見せる', 'wide establishing composition emphasizing the surrounding setting', 'composition-depth,scene-compatible,background-emphasis', 0.7],
  ['environmental-portrait', '人物と居場所を一緒に見せる', 'environmental portrait showing the character together with their surroundings', 'composition-depth,background-emphasis', 0.9],
]);

const sceneCompositionIds = new Set([
  'centered-composition', 'slightly-off-center-composition', 'composition-showing-more-background',
  ...expandedCompositions.filter((choice) => choice.tags.includes('scene-compatible')).map((choice) => choice.id),
]);

export const isSceneComposition = (id: string) => sceneCompositionIds.has(id);
