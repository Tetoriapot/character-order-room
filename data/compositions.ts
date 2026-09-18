// Generated from 01_initial_data.txt. Re-run scripts/import-character-data-pack.mjs to refresh.
import { createCatalog } from './catalog-utils';

const raw = "close|顔アップ|face close-up|\nheadshot|頭部中心|headshot|\nbust|バストアップ|bust-up composition|\nwaist|腰上|waist-up composition|\nknees|膝上|knee-up composition|\nfull|全身|full-body composition|\ndynamic-full-body-composition|動きのある全身|dynamic full-body composition|\ncentered-composition|中央配置|centered composition|\nslightly-off-center-composition|少し横に寄せる|slightly off-center composition|\nvertical-portrait-composition|縦長構図|vertical portrait composition|\nsquare-icon-composition|正方形アイコン構図|square icon composition|\nupper-body-focused-composition|上半身重視|upper-body focused composition|\nsilhouette-focused-composition|シルエット重視|silhouette-focused composition|\ncomposition-showing-more-background|背景も見せる構図|composition showing more background|\nsheet|設定画構図|character reference sheet composition|legacy";

export const compositions = createCatalog("composition", raw);
