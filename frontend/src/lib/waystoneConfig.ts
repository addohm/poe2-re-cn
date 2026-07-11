// Waystone filter-section config — fragments derived from REAL CN in-game item
// text (ground truth), e.g.:
//   稀有度: 稀有 / 魔法 / 普通            (rarity line — note 物品稀有度 / 怪物稀有度 also exist!)
//   引路石（ 16 阶）                       (tier)
//   复活次数: 0 (augmented)
//   物品稀有度: +11% (augmented)
//   怪物群规模: +14% (augmented)
//   怪物稀有度: +42% (augmented)
//   怪物效能: +13% (augmented)
//   引路石掉落几率: +75% (augmented)
//   被腐化                                 (corrupted marker, bottom of item)
// conf:"check" = still unverified against real text.

export type Conf = "high" | "check";

export interface NumericField {
  id: string; labelZh: string; labelEn: string; frag: string; conf: Conf;
}

// "Quantity & yield" — each emits  "<frag>.*<atLeast(value)>%". These five are the
// implicits real PoE2 waystones actually roll (confirmed across many items).
// poe2.re's Item Quantity / Magic Monsters / Rare Monsters fields don't exist in
// PoE2 and were removed.
export const WAYSTONE_NUMERIC: NumericField[] = [
  { id: "itemRarity", labelZh: "物品稀有度", labelEn: "Item Rarity", frag: "物品稀有度", conf: "high" },
  { id: "waystoneDropChance", labelZh: "引路石掉落几率", labelEn: "Waystone Drop Chance", frag: "掉落几率", conf: "high" },
  { id: "packSize", labelZh: "怪物群规模", labelEn: "Pack Size", frag: "怪物群规模", conf: "high" },
  { id: "monsterRarity", labelZh: "怪物稀有度", labelEn: "Monster Rarity", frag: "怪物稀有度", conf: "high" },
  { id: "monsterEffectiveness", labelZh: "怪物效能", labelEn: "Monster Effectiveness", frag: "怪物效能", conf: "high" },
];

export interface Toggle { id: string; labelZh: string; labelEn: string; frag: string; conf: Conf; }

// Rarity of the waystone itself. Match the rarity LINE value ("稀有度: 稀有") — NOT
// bare 稀有, which also appears in 物品稀有度 / 怪物稀有度 (that was the "rare matches
// everything" bug).
export const WAYSTONE_RARITY: Toggle[] = [
  { id: "rare", labelZh: "稀有", labelEn: "Rare", frag: "度: 稀有", conf: "high" },
  { id: "magic", labelZh: "魔法", labelEn: "Magic", frag: "度: 魔法", conf: "high" },
  { id: "normal", labelZh: "普通", labelEn: "Normal", frag: "度: 普通", conf: "high" },
];

// Corrupted marker is 被腐化 (bottom of item). Uncorrupted = negate it.
export const WAYSTONE_STATE: Toggle[] = [
  { id: "corrupted", labelZh: "已腐化", labelEn: "Corrupted", frag: "被腐化", conf: "high" },
  { id: "uncorrupted", labelZh: "未腐化", labelEn: "Uncorrupted", frag: "被腐化", conf: "high" },
  { id: "delirious", labelZh: "区域亢奋", labelEn: "Area is delirious", frag: "亢奋", conf: "check" },
];

export const WAYSTONE_TIER = { labelZh: "阶级", labelEn: "Tier", min: 1, max: 16, conf: "high" as Conf };
export const WAYSTONE_REVIVES = { labelZh: "复活次数", labelEn: "Revives", frag: "复活次数", min: 0, max: 6, conf: "high" as Conf };
