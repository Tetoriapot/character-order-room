// Generated from 01_initial_data.txt.
import { createThemes } from './theme-utils';

const raw = "王道ファンタジー\nダークファンタジー\n学園\n現代\n和風\nSF\nゴシック\n王族\n魔法使い\n聖職者\n悪役\nお兄さん\nお姉さん\n美少年\n美少女\n人外男子\n天使\n吸血鬼\n教師\nマフィア\nアイドル\n悲劇の主人公\n癒し系\n反抗的\n冬モチーフ\n夏モチーフ\n花モチーフ\n月モチーフ\n太陽モチーフ\n眼鏡キャラ\n負傷キャラ\n紳士\n令嬢\n戦士\n幽霊\n砂漠系\n森系\n電脳系\n恋愛ゲーム風\nウェブトゥーン光沢系";

export const themes = createThemes(raw);
