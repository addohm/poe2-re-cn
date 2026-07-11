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
  nav_translate: { zh: "翻译", en: "Translate" },
  comingSoon: { zh: "开发中", en: "Coming soon" },
  translate_title: { zh: "物品翻译", en: "Item Translator" },
  translate_intro: {
    zh: "粘贴一件物品（游戏内复制的文本），按当前界面语言翻译整件物品。",
    en: "Paste an item (copied from the game); it's translated line-by-line into the current UI language.",
  },
  translate_loading: { zh: "正在加载翻译词库…", en: "Loading translation data…" },
  translate_in: { zh: "粘贴物品", en: "Paste item" },
  translate_out: { zh: "翻译结果", en: "Translation" },
  translate_placeholder: {
    zh: "在此粘贴物品文本…", en: "Paste item text here…",
  },
  translate_outempty: { zh: "翻译结果会显示在这里。", en: "Translation appears here." },
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
  tb_rarity: { zh: "碑牌稀有度", en: "Tablet rarity" },
  tb_type: { zh: "碑牌类型", en: "Tablet type" },
  tb_uses: { zh: "剩余使用次数", en: "Min. uses remaining" },
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
  relic_any: { zh: "任意前缀或后缀", en: "Any prefix or suffix" },
  relic_both: { zh: "前缀与后缀都需匹配", en: "Both prefix and suffix" },
  prefix: { zh: "前缀", en: "Prefix" },
  suffix: { zh: "后缀", en: "Suffix" },
  vendor_ilvl: { zh: "物品等级", en: "Item Level" },
  vendor_clvl: { zh: "需求等级", en: "Requires Level" },
  wantedMods: { zh: "想要的词缀", en: "Wanted mods" },
  unwantedMods: { zh: "排除的词缀", en: "Unwanted mods" },
  matchAny: { zh: "任意匹配 (或)", en: "Match any (OR)" },
  matchAll: { zh: "全部匹配 (与)", en: "Match all (AND)" },
  search: { zh: "搜索词缀…", en: "Search mods…" },
  output: { zh: "生成的正则", en: "Generated regex" },
  copy: { zh: "复制", en: "Copy" },
  copied: { zh: "已复制", en: "Copied" },
  reset: { zh: "重置", en: "Reset" },
  clear: { zh: "清空", en: "Clear" },
  length: { zh: "长度", en: "length" },
  tooLong: { zh: "超过游戏内 250 字符上限，无法粘贴。", en: "PoE has a 250-char limit; this can't be pasted." },
  showOptions: { zh: "显示选项", en: "Show options" },
  hideOptions: { zh: "隐藏选项", en: "Hide options" },
  customText: { zh: "自定义文本", en: "Custom text" },
  roundDown: { zh: "数值向下取整到 10（大幅节省长度）", en: "Round down to nearest 10 (saves a lot of space)" },
  ws_rarity: { zh: "界石稀有度", en: "Waystone rarity" },
  ws_tier: { zh: "阶级", en: "Tier" },
  ws_revives: { zh: "复活次数", en: "Revives" },
  ws_quantity: { zh: "数量与产出", en: "Quantity & yield" },
  ws_state: { zh: "状态", en: "State" },
  min: { zh: "最小", en: "Min" },
  max: { zh: "最大", en: "Max" },
  flaggedNote: {
    zh: "带「?」的项依赖游戏内文本格式，请先在游戏内验证。",
    en: "Items marked “?” depend on the exact in-game text — verify them in-game first.",
  },
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
