// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "human|人間|human|\nelf|エルフ|elf|\ndark-elf|ダークエルフ|dark elf|\nvampire|吸血鬼|vampire|\nangel|天使|angel|\nfallen-angel|堕天使|fallen angel|\ndemon|悪魔|demon|\nsuccubus|サキュバス|succubus|\nincubus|インキュバス|incubus|\nwerewolf|狼男|werewolf|\nbeastfolk|獣人|beastman|\nfox-spirit|狐の妖|fox spirit|\nghost|幽霊|ghost|\nspirit|精霊|spirit|\nfairy|妖精|fairy|\nmerfolk|人魚|merfolk|\ndragonkin|竜人|dragonkin|\nandroid|アンドロイド|android|\nrobot|ロボット|robot|\ncyborg|サイボーグ|cyborg|\ngolem|ゴーレム|golem|\nundead|アンデッド|undead|\nnonhuman|人外|otherworldly being|\ndivine-being|神性存在|divine being|\nyokai|妖怪|yokai|legacy";

export const species = createCatalog("species", raw);
