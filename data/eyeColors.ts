// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "black|黒い目|black eyes|\nbrown|茶色の目|brown eyes|\ndark-brown-eyes|ダークブラウンの目|dark brown eyes|\nhazel|ヘーゼルの目|hazel eyes|\namber|琥珀色の目|amber eyes|\ngold|金色の目|golden eyes|\nyellow-eyes|黄色い目|yellow eyes|\nred|赤い目|red eyes|\ncrimson-eyes|深紅の目|crimson eyes|\npink|ピンクの目|pink eyes|\npurple|紫の目|purple eyes|\nviolet|菫色の目|violet eyes|\nblue|青い目|blue eyes|\nicy-blue-eyes|氷のような青い目|icy blue eyes|\ncyan|空色の目|sky-blue eyes|\ngreen|緑の目|green eyes|\nemerald|エメラルドの目|emerald eyes|\nteal-eyes|青緑の目|teal eyes|\nsilver|銀の目|silver eyes|\ngray|灰色の目|gray eyes|\nwhite|白い目|white eyes|\nheterochromia|オッドアイ|heterochromia|\nstarry-eyes|星のような瞳|starry eyes|\nglowing|発光する目|glowing eyes|\nnavy|紺|navy|legacy\nwine|ワインレッド|wine red|legacy\ngradient|グラデーション|gradient-colored|legacy\nrainbow|虹色|rainbow-colored|legacy";

export const eyeColors = createCatalog("eyeColor", raw);
