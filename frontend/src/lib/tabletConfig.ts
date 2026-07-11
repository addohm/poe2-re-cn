// Tablet filter-section config. Rarity reuses the waystone value-words. Type and
// uses fragments are CN mechanic names from poe2-en-cn-dict; conf:"check" ones
// need in-game verification (this is where the `(eac)` = Breach example failed on
// EN — the CN equivalent is 裂隙).
import { type Toggle } from "./waystoneConfig";

// Rarity line value ("稀有度: 稀有") — same fix as waystone. Confirmed from real
// tablet text (石板) "稀有度: 普通" / "稀有度: 稀有".
export const TABLET_RARITY: Toggle[] = [
  { id: "rare", labelZh: "稀有", labelEn: "Rare", frag: "度: 稀有", conf: "high" },
  { id: "magic", labelZh: "魔法", labelEn: "Magic", frag: "度: 魔法", conf: "high" },
  { id: "normal", labelZh: "普通", labelEn: "Normal", frag: "度: 普通", conf: "high" },
];

export const TABLET_TYPES: Toggle[] = [
  // All confirmed from real item NAME lines:
  // 能量辐照石板 / 驱灵仪式石板 / 惊悸迷雾石板 / 裂隙石板 / 深渊石板 / 神庙石板 / 霸主石板
  { id: "irradiated", labelZh: "能量辐照", labelEn: "Irradiated", frag: "辐照", conf: "high" },
  { id: "ritual", labelZh: "驱灵仪式", labelEn: "Ritual", frag: "仪式", conf: "high" },
  { id: "delirium", labelZh: "惊悸迷雾", labelEn: "Delirium", frag: "惊悸", conf: "high" },
  { id: "breach", labelZh: "裂隙", labelEn: "Breach", frag: "裂隙", conf: "high" },
  { id: "abyss", labelZh: "深渊", labelEn: "Abyss", frag: "深渊", conf: "high" },
  { id: "temple", labelZh: "神庙", labelEn: "Temple", frag: "神庙", conf: "high" },
  { id: "overseer", labelZh: "霸主", labelEn: "Overseer", frag: "霸主", conf: "high" },
];

// Real line: "剩余次数：10" (fullwidth colon). frag 剩余次数.
export const TABLET_USES = { labelZh: "剩余使用次数", labelEn: "Min. uses remaining", frag: "剩余次数", conf: "high" as const };
