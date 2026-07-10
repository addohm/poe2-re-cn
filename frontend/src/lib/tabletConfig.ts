// Tablet filter-section config. Rarity reuses the waystone value-words. Type and
// uses fragments are CN mechanic names from poe2-en-cn-dict; conf:"check" ones
// need in-game verification (this is where the `(eac)` = Breach example failed on
// EN — the CN equivalent is 裂隙).
import { WAYSTONE_RARITY, type Toggle } from "./waystoneConfig";

export const TABLET_RARITY = WAYSTONE_RARITY;

export const TABLET_TYPES: Toggle[] = [
  { id: "irradiated", labelZh: "能量辐照", labelEn: "Irradiated", frag: "辐照", conf: "check" },
  { id: "ritual", labelZh: "驱灵仪式", labelEn: "Ritual", frag: "仪式", conf: "check" },
  { id: "delirium", labelZh: "惊悸迷雾", labelEn: "Delirium", frag: "惊悸", conf: "check" },
  { id: "breach", labelZh: "裂隙", labelEn: "Breach", frag: "裂隙", conf: "check" },
  { id: "abyss", labelZh: "深渊", labelEn: "Abyss", frag: "深渊", conf: "check" },
  { id: "temple", labelZh: "夺魂之殿", labelEn: "Temple", frag: "夺魂", conf: "check" },
  { id: "overseer", labelZh: "监督者", labelEn: "Overseer", frag: "监督", conf: "check" },
];

export const TABLET_USES = { labelZh: "剩余使用次数", labelEn: "Min. uses remaining", frag: "使用次数", conf: "check" as const };
