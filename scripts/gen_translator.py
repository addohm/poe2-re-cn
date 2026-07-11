"""Generate the item-text translator resource (Generated.Translate.CN.json).

Powers a page where you paste a whole item (either language) and get it back in
the other language, line by line. Sources, all from poe2-en-cn-dict:
  - mod lines: dictionary/consumers/trade-helper/stat_lines.json  (zh<->en
    templates with {0} placeholders) — the bulk of an item.
  - terms: item bases / uniques / skills / item-classes + a curated set of item-
    panel labels and rarity/type words.

Output:
  { "mods":  [[normZh, normEn], ...],   # placeholders canonicalized to {0},{1}
    "terms": { "<cn>": "<en>", ... } }   # bidirectional maps built client-side
"""
import json
import re
from pathlib import Path

DICT = Path(r"C:/Users/addohm/Documents/poe2-en-cn-dict/dictionary")
CONS = DICT / "consumers" / "trade-helper"
OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "generated" / "Generated.Translate.CN.json"

_TAG = re.compile(r"<[^>]*>")
_LINK = re.compile(r"\[([^\[\]|]*\|)?([^\[\]]*)\]")
_PH = re.compile(r"\{(\d+)(?::[^}]*)?\}")  # {0}, {0:+d}, {1} -> {0} {1}


def canon(s: str) -> str:
    """Strip GGG markup and canonicalize placeholders to {N}."""
    s = _TAG.sub("", s)
    s = _LINK.sub(lambda m: m.group(2), s)
    s = _PH.sub(lambda m: "{" + m.group(1) + "}", s)
    return re.sub(r"[ \t]+", " ", s).strip()


# Item-panel labels + rarity/type/state words the stat_lines/name maps don't cover.
# Keyed cn -> en; used both directions.
CURATED = {
    "物品类别": "Item Class", "稀有度": "Rarity", "物品等级": "Item Level",
    "复活次数": "Number of Revives", "剩余次数": "Uses remaining", "需求": "Requires",
    "品质": "Quality", "插槽": "Sockets", "等阶": "Tier", "等级": "Level",
    "前缀属性": "Prefix Modifier", "后缀属性": "Suffix Modifier",
    "基底属性": "Implicit Modifier", "传奇属性": "Unique Modifier",
    "打造的": "Crafted", "亵渎的": "Desecrated", "被腐化": "Corrupted",
    "数值不可调整": "value cannot be adjusted",
    "普通": "Normal", "魔法": "Magic", "稀有": "Rare", "传奇": "Unique",
    # waystone/tablet implicit short-form labels (rendered as "label: +N%")
    "物品稀有度": "Item Rarity", "物品数量": "Item Quantity",
    "怪物群规模": "Monster Pack Size", "怪物稀有度": "Monster Rarity",
    "怪物效能": "Monster Effectiveness", "引路石掉落几率": "Waystone Drop Chance",
    "掉落几率": "Drop Chance",
    "引路石": "Waystone", "石板": "Tablet",
    "裂隙石板": "Breach Precursor Tablet", "能量辐照石板": "Irradiated Precursor Tablet",
    "驱灵仪式石板": "Ritual Precursor Tablet", "深渊石板": "Abyssal Precursor Tablet",
    "惊悸迷雾石板": "Delirium Precursor Tablet", "神庙石板": "Temple Precursor Tablet",
    "霸主石板": "Overseer Precursor Tablet",
}


def main():
    mods = []
    seen = set()
    for zh, en in json.load(open(CONS / "stat_lines.json", encoding="utf-8")):
        nz, ne = canon(zh), canon(en)
        if not nz or not ne:
            continue
        key = (nz, ne)
        if key in seen:
            continue
        seen.add(key)
        mods.append([nz, ne])

    terms = {}
    for name in ("items", "uniques", "skills", "item_classes"):
        for cn, en in json.load(open(CONS / f"{name}.json", encoding="utf-8")).items():
            if cn and en and cn not in terms:
                terms[cn] = en
    for cn, en in CURATED.items():  # curated wins
        terms[cn] = en

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"mods": mods, "terms": terms},
                              ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"mods: {len(mods)}  terms: {len(terms)}  size: {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
