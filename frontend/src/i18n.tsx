import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// UI language ONLY affects chrome + which mod display string is shown.
// The generated regex is always built from the Chinese client text.
export type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

// All chrome strings live here, in both languages.
const STRINGS: Dict = {
  appTitle: { zh: "流放之路2 正则", en: "PoE2 Regex" },
  appSubtitle: { zh: "国服客户端", en: "CN Client" },
  nav_vendor: { zh: "商店", en: "Vendor" },
  nav_waystone: { zh: "地图 (界石)", en: "Waystone" },
  nav_tablet: { zh: "碑牌", en: "Tablet" },
  nav_relic: { zh: "圣物", en: "Relic" },
  nav_item: { zh: "物品", en: "Item" },
  comingSoon: { zh: "开发中", en: "Coming soon" },
  langToggle: { zh: "EN", en: "中文" },

  waystone_title: { zh: "地图 (界石) 正则", en: "Waystone Regex" },
  waystone_intro: {
    zh: "勾选想要的地图词缀，生成可粘贴到游戏内搜索框的正则。",
    en: "Select the map mods you want; get a regex to paste into the in-game search.",
  },
  tablet_title: { zh: "先驱碑牌 正则", en: "Tablet Regex" },
  tablet_intro: {
    zh: "勾选想要的碑牌词缀，生成可粘贴到游戏内搜索框的正则。",
    en: "Select the tablet affixes you want; get a regex to paste into the in-game search.",
  },
  relic_title: { zh: "圣物 正则", en: "Relic Regex" },
  relic_intro: {
    zh: "勾选想要的圣物词缀（前缀/后缀），生成可粘贴到游戏内搜索框的正则。",
    en: "Select the relic affixes (prefix/suffix) you want; get a regex to paste into the in-game search.",
  },
  item_title: { zh: "物品 正则", en: "Item Regex" },
  item_intro: {
    zh: "先搜索并选择物品基底，再勾选想要的词缀，生成游戏内搜索正则。",
    en: "Search and pick an item base, then select the mods you want to build an in-game search regex.",
  },
  item_search: { zh: "搜索物品基底…", en: "Search for an item base…" },
  vendor_title: { zh: "商店 正则", en: "Vendor Regex" },
  vendor_intro: {
    zh: "勾选想要的物品属性，生成用于商店/仓库搜索的正则。",
    en: "Select item properties to build a regex for vendor / stash search.",
  },
  vendor_warn: {
    zh: "⚠ 标有「?」的项（稀有度、物品类别）依赖游戏内文本格式，请先在游戏内验证。",
    en: "⚠ Options marked “?” (rarity, item class) depend on the exact in-game text — verify them in-game first.",
  },
  needsCheck: { zh: "待游戏内验证", en: "needs in-game check" },
  wantedMods: { zh: "想要的词缀", en: "Wanted mods" },
  unwantedMods: { zh: "排除的词缀", en: "Unwanted mods" },
  matchAny: { zh: "任意匹配 (或)", en: "Match any (OR)" },
  matchAll: { zh: "全部匹配 (与)", en: "Match all (AND)" },
  search: { zh: "搜索词缀…", en: "Search mods…" },
  output: { zh: "生成的正则", en: "Generated regex" },
  copy: { zh: "复制", en: "Copy" },
  copied: { zh: "已复制", en: "Copied" },
  clear: { zh: "清空", en: "Clear" },
  selectedCount: { zh: "已选", en: "selected" },
  emptyOutput: {
    zh: "勾选上方词缀以生成正则。",
    en: "Select mods above to generate a regex.",
  },
  regexNote: {
    zh: "正则匹配国服中文文本。已确认游戏内支持中文字面量、空格与 [0-9]。",
    en: "Regex matches the CN client's Chinese text. Chinese literals, spaces and [0-9] are confirmed working in-game.",
  },
};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof STRINGS | string) => string;
}>({ lang: "zh", setLang: () => {}, t: (k) => String(k) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("lang") as Lang) || "zh"
  );
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (key: string) => STRINGS[key]?.[lang] ?? key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
