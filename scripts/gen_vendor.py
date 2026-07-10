"""Generate the CN Vendor config (frontend/public/generated/Generated.Vendor.CN.json).

poe2.re's vendor tool builds a regex from hardcoded ENGLISH abbreviations that
match an item's info-panel text (rarity line, resistances, item class, ...). None
work on the CN client. Here we rebuild that option set with CN fragments sourced
from the dictionary (single source of truth), grouped like poe2.re.

Confidence:
  - `verified:false, confidence:"high"` — a plain CN stat/word that unambiguously
    appears in item text (resistances, attributes, damage, speeds, life, ES,
    movement, quality, item level). Safe.
  - `confidence:"check"` — depends on the exact CN info-panel format or base-name
    wording (rarity values, item class). Needs an in-game spot check; see
    docs/cn-client-regex-probe.md.

Each option: { id, en, zh, regex, confidence }. A group has a combine mode
(`and` = space-separated quoted terms; `or` = one quoted alternation) mirroring
how an item can hold many mods but only one rarity/class.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.translate import Resolver  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "generated" / "Generated.Vendor.CN.json"

res = Resolver()
def cn(en, fallback=None):
    return res.by_term(en) or fallback or en

# (group id, labelZh, labelEn, mode, [(id, EN term or None, regex-or-None, confidence)])
# When regex is None we look the term up in the dictionary by its EN name.
def opt(id, en, conf="high", regex=None):
    return {"id": id, "en": en, "zh": cn(en), "regex": regex or cn(en), "confidence": conf}


def build():
    groups = [
        {
            "id": "rarity", "labelEn": "Rarity", "labelZh": "稀有度", "mode": "or",
            "options": [
                {"id": "normal", "en": "Normal", "zh": "普通", "regex": "普通", "confidence": "check"},
                {"id": "magic", "en": "Magic", "zh": "魔法", "regex": "魔法", "confidence": "check"},
                {"id": "rare", "en": "Rare", "zh": "稀有", "regex": "稀有", "confidence": "check"},
            ],
        },
        {
            "id": "props", "labelEn": "Item Properties", "labelZh": "物品属性", "mode": "and",
            "options": [
                {"id": "quality", "en": "Quality", "zh": cn("Quality"), "regex": "品质", "confidence": "high"},
                {"id": "corrupted", "en": "Corrupted", "zh": "已腐化", "regex": "已腐化", "confidence": "high"},
                {"id": "ilvl", "en": "Item Level", "zh": "物品等级", "regex": "物品等级", "confidence": "high"},
            ],
        },
        {
            "id": "resist", "labelEn": "Resistances", "labelZh": "抗性", "mode": "and",
            "options": [
                opt("fire", "Fire Resistance"), opt("cold", "Cold Resistance"),
                opt("lightning", "Lightning Resistance"), opt("chaos", "Chaos Resistance"),
            ],
        },
        {
            "id": "attr", "labelEn": "Attributes", "labelZh": "属性", "mode": "and",
            "options": [
                opt("str", "Strength"), opt("dex", "Dexterity"),
                opt("int", "Intelligence"), opt("spirit", "Spirit"),
            ],
        },
        {
            "id": "offence", "labelEn": "Offence", "labelZh": "攻击", "mode": "and",
            "options": [
                opt("phys", "Physical Damage"), opt("spell", "Spell Damage"),
                opt("atkspd", "Attack Speed"), opt("castspd", "Cast Speed"),
                {"id": "movespd", "en": "Movement Speed", "zh": "移动速度", "regex": "移动速度", "confidence": "high"},
            ],
        },
        {
            "id": "defence", "labelEn": "Defence & Life", "labelZh": "防御与生命", "mode": "and",
            "options": [
                opt("life", "Maximum Life", regex="生命上限"),
                opt("es", "Energy Shield"), opt("armour", "Armour"),
                opt("evasion", "Evasion Rating"),
            ],
        },
        {
            "id": "class", "labelEn": "Item Class", "labelZh": "物品类别", "mode": "or",
            "options": [
                opt(k.lower(), k, conf="check") for k in [
                    "Amulet", "Ring", "Belt", "Dagger", "Wand", "Sceptre", "Bow",
                    "Staff", "Quarterstaff", "Spear", "Crossbow", "Gloves", "Boots",
                    "Helmet", "Quiver", "Focus", "Shield", "Buckler", "Claw", "Flail",
                ]
            ],
        },
    ]
    return {"groups": groups}


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = build()
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n = sum(len(g["options"]) for g in data["groups"])
    checks = sum(1 for g in data["groups"] for o in g["options"] if o["confidence"] == "check")
    print(f"vendor groups: {len(data['groups'])}  options: {n}  (needs in-game check: {checks})")
    for g in data["groups"]:
        print(f"  [{g['labelZh']}] " + ", ".join(f"{o['zh']}={o['regex']}" for o in g["options"][:6]))


if __name__ == "__main__":
    main()
