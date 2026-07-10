// Waystone filter-section config — CN fragments for the item-property filters
// (the top of poe2.re's waystone page). Fragments are sourced from
// poe2-en-cn-dict (stat lines / ClientStrings); `conf:"check"` marks ones whose
// exact in-game info-panel wording still needs verification (see
// docs/cn-client-regex-probe.md). The numeric ">=" regex around each fragment is
// built client-side by lib/numeric.ts.

export type Conf = "high" | "check";

export interface NumericField {
  id: string;
  labelZh: string;
  labelEn: string;
  frag: string; // CN substring that precedes the value on the item line
  conf: Conf;
}

// "Quantity & yield" — each emits  "<frag>.*<atLeast(value)>%".
export const WAYSTONE_NUMERIC: NumericField[] = [
  { id: "itemQuantity", labelZh: "物品数量", labelEn: "Item Quantity", frag: "物品数量", conf: "high" },
  { id: "itemRarity", labelZh: "物品稀有度", labelEn: "Item Rarity", frag: "物品稀有度", conf: "high" },
  { id: "waystoneDropChance", labelZh: "引路石数量", labelEn: "Waystone Quantity", frag: "引路石数量", conf: "check" },
  { id: "magicMonsters", labelZh: "魔法怪物", labelEn: "Magic Monsters", frag: "魔法怪物", conf: "high" },
  { id: "rareMonsters", labelZh: "稀有怪物", labelEn: "Rare Monsters", frag: "稀有怪物", conf: "high" },
  { id: "monsterEffectiveness", labelZh: "怪物效能", labelEn: "Monster Effectiveness", frag: "效能", conf: "check" },
  { id: "monsterRarity", labelZh: "怪物稀有度", labelEn: "Monster Rarity", frag: "怪物稀有度", conf: "check" },
  { id: "packSize", labelZh: "怪物群规模", labelEn: "Pack Size", frag: "群规模", conf: "high" },
];

export interface Toggle {
  id: string;
  labelZh: string;
  labelEn: string;
  frag: string;
  conf: Conf;
}

// Rarity of the waystone item itself (Rare/Magic/Normal). Format-dependent.
export const WAYSTONE_RARITY: Toggle[] = [
  { id: "rare", labelZh: "稀有", labelEn: "Rare", frag: "稀有", conf: "check" },
  { id: "magic", labelZh: "魔法", labelEn: "Magic", frag: "魔法", conf: "check" },
  { id: "normal", labelZh: "普通", labelEn: "Normal", frag: "普通", conf: "check" },
];

// Corrupted / delirious state. `!frag` (negation) handled by the builder.
export const WAYSTONE_STATE: Toggle[] = [
  { id: "corrupted", labelZh: "已腐化", labelEn: "Corrupted", frag: "已腐化", conf: "high" },
  { id: "uncorrupted", labelZh: "未腐化", labelEn: "Uncorrupted", frag: "已腐化", conf: "high" },
  { id: "delirious", labelZh: "区域亢奋", labelEn: "Area is delirious", frag: "亢奋", conf: "check" },
];

// Tier / revives use a CN label fragment + an integer-range pattern (numeric.ts).
export const WAYSTONE_TIER = { labelZh: "阶级", labelEn: "Tier", frag: "阶级", min: 1, max: 16, conf: "check" as Conf };
export const WAYSTONE_REVIVES = { labelZh: "复活", labelEn: "Revives", frag: "复活", min: 0, max: 6, conf: "check" as Conf };
